// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
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
  const [error, setError] = useState("");

  // Handle authentication errors and redirect to login
  const handleAuthError = useCallback(
    (error) => {
      console.error("Authentication error:", error);
      sessionStorage.removeItem("adminToken");
      nav("/");
    },
    [nav]
  );

  // Generic error handler with auth check
  const handleApiError = useCallback(
    (error, action = "operation") => {
      console.error(`${action} failed:`, error);

      // Check for authentication errors
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("unauthorized") ||
        error?.message?.includes("token")
      ) {
        handleAuthError(error);
        return true; // Indicates auth error was handled
      }

      // Show user-friendly error message for other errors
      alert(`Failed to ${action}: ${error.message || "Unknown error"}`);
      return false; // Indicates non-auth error
    },
    [handleAuthError]
  );

  // Load users with error handling
  const loadUsers = useCallback(async () => {
    if (!token) {
      handleAuthError(new Error("No token found"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getUsers(token);
      setUsers(data.users || data || []);
    } catch (err) {
      const isAuthError = handleApiError(err, "load users");
      if (!isAuthError) {
        setError("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, handleApiError]);

  // Regenerate premium key
  const handleRegenerateKey = useCallback(
    async (user) => {
      try {
        const res = await regeneratePremiumKey(user.id, token);
        if (res?.premium_key) {
          alert(`New key for ${user.email}: ${res.premium_key}`);
          await loadUsers();
        } else {
          throw new Error("No key returned from server");
        }
      } catch (err) {
        handleApiError(err, "generate new key");
      }
    },
    [token, loadUsers, handleApiError]
  );

  // Toggle premium status
  const handleTogglePremium = useCallback(
    async (user) => {
      try {
        await togglePremium(user.id, !user.is_premium, token);
        await loadUsers();
      } catch (err) {
        handleApiError(err, "toggle premium status");
      }
    },
    [token, loadUsers, handleApiError]
  );

  // Reset 2FA
  const handleReset2FA = useCallback(
    async (user) => {
      try {
        await reset2FA(user.id, token);
        await loadUsers();
      } catch (err) {
        handleApiError(err, "reset 2FA");
      }
    },
    [token, loadUsers, handleApiError]
  );

  // Logout function
  const logout = useCallback(() => {
    sessionStorage.removeItem("adminToken");
    nav("/");
  }, [nav]);

  // Effect to load users on mount and handle token check
  useEffect(() => {
    if (!token) {
      nav("/");
      return;
    }
    loadUsers();
  }, [token, nav, loadUsers]);

  return (
    <div className="h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-cyan-400 text-lg">Loading users...</div>
        </div>
      ) : (
        <UserTable
          users={users}
          onTogglePremium={handleTogglePremium}
          onReset2FA={handleReset2FA}
          onRegenerateKey={handleRegenerateKey}
        />
      )}
    </div>
  );
}
