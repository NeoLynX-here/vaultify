// src/components/UserTable.jsx
import React from "react";

export default function UserTable({
  users = [],
  onTogglePremium = () => {},
  onReset2FA = () => {},
  onRegenerateKey = () => {},
}) {
  // debug quickly if needed:
  // console.log("UserTable props:", { onRegenerateKey, users });

  return (
    <table className="w-full text-left text-white border border-cyan-400">
      <thead className="bg-cyan-800">
        <tr>
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
          <tr key={u.id} className="border-t border-cyan-700 bg-gray-900">
            <td className="p-3">{u.id}</td>
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
                  className="bg-black border border-cyan-500 px-2 py-1 text-xs w-40"
                  value={u.premium_key || ""}
                  readOnly
                />

                <button
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
                  onClick={() => onRegenerateKey(u)}
                >
                  Reset Key
                </button>
                <button
                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs"
                  onClick={() =>
                    navigator.clipboard?.writeText(u.premium_key || "")
                  }
                  title="Copy key"
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
                className="px-3 py-1 bg-blue-600 rounded"
                onClick={() => onTogglePremium(u)}
              >
                Toggle Premium
              </button>
              <button
                className="px-3 py-1 bg-yellow-600 rounded"
                onClick={() => onReset2FA(u)}
              >
                Reset 2FA
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
