// src/components/UserTable.jsx
import React, { useState } from "react";

export default function UserTable({
  users = [],
  onTogglePremium = () => {},
  onReset2FA = () => {},
  onRegenerateKey = () => {},
  onDeleteUser = () => {},
  onBulkDelete = () => {},
  onDeleteAll = () => {},
}) {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Handle individual user selection
  const handleUserSelect = (userId, isSelected) => {
    setSelectedUsers((prev) => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(userId);
      } else {
        newSelected.delete(userId);
      }
      return newSelected;
    });
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`
      )
    ) {
      onBulkDelete(Array.from(selectedUsers));
      setSelectedUsers(new Set());
    }
  };

  // Handle delete all confirmation
  const handleDeleteAllConfirm = () => {
    if (
      window.confirm(
        "🚨 DANGER: This will delete ALL users and their data. This action cannot be undone. Type 'DELETE_ALL_USERS' to confirm."
      )
    ) {
      onDeleteAll();
      setShowDeleteAllConfirm(false);
      setSelectedUsers(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {users.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-800 border border-cyan-400 rounded">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={
                  selectedUsers.size === users.length && users.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4"
              />
              Select All ({selectedUsers.size} selected)
            </label>

            {selectedUsers.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium"
              >
                Delete Selected ({selectedUsers.size})
              </button>
            )}
          </div>

          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 rounded text-white font-medium border border-red-600"
            title="Delete all users and their data"
          >
            🚨 Delete All Users
          </button>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-500 p-6 rounded max-w-md">
            <h3 className="text-red-400 text-lg font-bold mb-4">
              🚨 Confirm Delete All Users
            </h3>
            <p className="text-white mb-4">
              This will permanently delete ALL users and their data. This action
              cannot be undone.
            </p>
            <p className="text-yellow-400 text-sm mb-4">
              Type <code className="bg-black px-2 py-1">DELETE_ALL_USERS</code>{" "}
              to confirm:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                id="confirmDelete"
                placeholder="DELETE_ALL_USERS"
                className="flex-1 px-3 py-2 bg-black border border-gray-600 text-white rounded"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("confirmDelete");
                  if (input?.value === "DELETE_ALL_USERS") {
                    handleDeleteAllConfirm();
                  } else {
                    alert("Please type DELETE_ALL_USERS exactly to confirm.");
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Delete All Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <table className="w-full text-left text-white border border-cyan-400">
        <thead className="bg-cyan-800">
          <tr>
            <th className="p-3 w-12">
              <input
                type="checkbox"
                checked={
                  selectedUsers.size === users.length && users.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4"
              />
            </th>
            <th className="p-3">ID</th>
            <th className="p-3">Email</th>
            <th className="p-3">Premium</th>
            <th className="p-3">Premium Key</th>
            <th className="p-3">2FA</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-t border-cyan-700 bg-gray-900 hover:bg-gray-800"
            >
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={(e) => handleUserSelect(u.id, e.target.checked)}
                  className="w-4 h-4"
                />
              </td>
              <td className="p-3 font-mono text-sm">{u.id}</td>
              <td className="p-3">{u.email}</td>

              <td className="p-3">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    u.is_premium ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {u.is_premium ? "Premium" : "Free"}
                </span>
              </td>

              <td className="p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="bg-black border border-cyan-500 px-2 py-1 text-xs w-40 font-mono text-sm"
                    value={u.premium_key || ""}
                    readOnly
                  />

                  <button
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
                    onClick={() => onRegenerateKey(u)}
                    title="Generate new premium key"
                  >
                    Reset Key
                  </button>
                  <button
                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs"
                    onClick={() =>
                      navigator.clipboard?.writeText(u.premium_key || "")
                    }
                    title="Copy premium key"
                  >
                    Copy
                  </button>
                </div>
              </td>

              <td className="p-3">
                {u.twofa_enabled ? (
                  <span className="text-green-400">Enabled</span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </td>

              <td className="p-3 space-x-2">
                <button
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"
                  onClick={() => onTogglePremium(u)}
                  title="Toggle premium status"
                >
                  Toggle Premium
                </button>
                <button
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm"
                  onClick={() => onReset2FA(u)}
                  title="Reset 2FA settings"
                >
                  Reset 2FA
                </button>
                <button
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete user ${u.email}? This will remove all their data permanently.`
                      )
                    ) {
                      onDeleteUser(u.id);
                    }
                  }}
                  title="Delete user and all data"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center text-gray-400 py-8 border border-cyan-400">
          No users found
        </div>
      )}
    </div>
  );
}
