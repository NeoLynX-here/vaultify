// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserTable from "../components/UserTable";
import {
  getUsers,
  togglePremium,
  reset2FA,
  regeneratePremiumKey,
  deleteUser,
  bulkDeleteUsers,
  deleteAllUsers,
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

  // Delete single user
  const handleDeleteUser = useCallback(
    async (userId) => {
      try {
        await deleteUser(userId, token);
        await loadUsers();
      } catch (err) {
        handleApiError(err, "delete user");
      }
    },
    [token, loadUsers, handleApiError]
  );

  // Bulk delete users
  const handleBulkDelete = useCallback(
    async (userIds) => {
      try {
        await bulkDeleteUsers(userIds, token);
        await loadUsers();
      } catch (err) {
        handleApiError(err, "delete users");
      }
    },
    [token, loadUsers, handleApiError]
  );

  // Delete all users
  const handleDeleteAll = useCallback(async () => {
    try {
      await deleteAllUsers(token);
      await loadUsers();
    } catch (err) {
      handleApiError(err, "delete all users");
    }
  }, [token, loadUsers, handleApiError]);

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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with cyberpunk styling */}
      <div className="flex justify-between items-center mb-8 p-4 bg-black/80 border border-cyan-400/50 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.3)]">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600 font-mono">
            ADMIN_DASHBOARD
          </h1>
          <p className="text-cyan-300 text-sm font-mono mt-1">
            USER_MANAGEMENT_SYSTEM
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded border border-red-400 font-mono text-sm transition-all duration-200 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            LOGOUT
          </button>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded border border-cyan-400 font-mono text-sm transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "REFRESHING..." : "REFRESH"}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/60 border border-cyan-400/30 rounded p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {users.length}
            </div>
            <div className="text-cyan-300 text-sm font-mono">TOTAL_USERS</div>
          </div>
          <div className="bg-black/60 border border-green-400/30 rounded p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {users.filter((u) => u.is_premium).length}
            </div>
            <div className="text-green-300 text-sm font-mono">
              PREMIUM_USERS
            </div>
          </div>
          <div className="bg-black/60 border border-yellow-400/30 rounded p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {users.filter((u) => u.twofa_enabled).length}
            </div>
            <div className="text-yellow-300 text-sm font-mono">2FA_ENABLED</div>
          </div>
          <div className="bg-black/60 border border-purple-400/30 rounded p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {users.filter((u) => u.premium_key).length}
            </div>
            <div className="text-purple-300 text-sm font-mono">ACTIVE_KEYS</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200 font-mono">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-cyan-400 text-lg font-mono animate-pulse">
            LOADING_USER_DATA...
          </div>
        </div>
      ) : (
        <div className="bg-black/40 border border-cyan-400/30 rounded-lg p-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <UserTable
            users={users}
            onTogglePremium={handleTogglePremium}
            onReset2FA={handleReset2FA}
            onRegenerateKey={handleRegenerateKey}
            onDeleteUser={handleDeleteUser}
            onBulkDelete={handleBulkDelete}
            onDeleteAll={handleDeleteAll}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-cyan-400/60 text-sm font-mono">
        <div className="flex justify-center gap-6 mb-2">
          <span>SYSTEM_SECURE</span>
          <span>•</span>
          <span>ENCRYPTED_COMMS</span>
          <span>•</span>
          <span>ADMIN_PRIVILEGES</span>
        </div>
        <div>VAULTIFY_ADMIN_PANEL v1.0</div>
      </div>
    </div>
  );
}
