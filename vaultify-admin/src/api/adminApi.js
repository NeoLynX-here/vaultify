// api/api.js
const ADMIN_BASE = "http://localhost:5001/api/admin";

// -------------------------
// ADMIN LOGIN
// -------------------------
export async function adminLogin(username, password) {
  const res = await fetch(`${ADMIN_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
}

// -------------------------
// FETCH ALL USERS
// -------------------------
export async function getUsers(token) {
  const res = await fetch(`${ADMIN_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json(); // { users: [...] }
}

// -------------------------
// TOGGLE PREMIUM STATUS
// -------------------------
export async function togglePremium(userId, isPremium, token) {
  const res = await fetch(`${ADMIN_BASE}/users/${userId}/premium`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_premium: isPremium }),
  });

  return res.json();
}

// -------------------------
// RESET 2FA
// -------------------------
export async function reset2FA(userId, token) {
  const res = await fetch(`${ADMIN_BASE}/users/${userId}/2fa-reset`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
}

// -------------------------
// REGENERATE PREMIUM KEY
// -------------------------
export async function regeneratePremiumKey(userId, token) {
  const res = await fetch(`${ADMIN_BASE}/users/${userId}/premium-key`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json(); // { premium_key: "newhexkey" }
}
