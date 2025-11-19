// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserTable from "../components/UserTable";
import {
  getUsers,
  togglePremium,
  reset2FA,
  regeneratePremiumKey,
} from "../api/adminApi";

export default function Dashboard() {
  const nav = useNavigate();
  const token = sessionStorage.getItem("adminToken");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers(token);
      setUsers(data.users || data || []);
    } catch (err) {
      console.error("Failed to load users", err);
      if (!token) nav("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      nav("/");
      return;
    }
    loadUsers();
  }, [token]);

  async function handleRegenerateKey(user) {
    try {
      const res = await regeneratePremiumKey(user.id, token);
      if (res && res.premium_key) {
        // Optionally show a toast/alert
        alert(`New key for ${user.email}: ${res.premium_key}`);
        // reload users to show updated key
        await loadUsers();
      } else {
        throw new Error("No key returned");
      }
    } catch (err) {
      console.error("Regenerate key failed", err);
      alert("Failed to generate new key: " + err.message);
    }
  }

  async function handleTogglePremium(user) {
    try {
      await togglePremium(user.id, !user.is_premium, token);
      await loadUsers();
    } catch (err) {
      console.error("Toggle premium failed", err);
      alert("Failed to toggle premium: " + err.message);
    }
  }

  async function handleReset2FA(user) {
    try {
      await reset2FA(user.id, token);
      await loadUsers();
    } catch (err) {
      console.error("Reset 2FA failed", err);
      alert("Failed to reset 2FA: " + err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem("adminToken");
    nav("/");
  }

  return (
    <div className="h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={logout} className="px-4 py-2 bg-red-600 rounded">
            Logout
          </button>
          <button onClick={loadUsers} className="px-4 py-2 bg-cyan-600 rounded">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <UserTable
          users={users}
          onTogglePremium={handleTogglePremium}
          onReset2FA={handleReset2FA}
          onRegenerateKey={handleRegenerateKey} // <- THIS MUST MATCH UserTable prop name
        />
      )}
    </div>
  );
}
