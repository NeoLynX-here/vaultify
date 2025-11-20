// api/adminApi.js
const ADMIN_BASE = "http://localhost:5001/api/admin";

// Generic fetch wrapper with error handling
async function fetchWithAuth(url, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${ADMIN_BASE}${url}`, config);

  // Handle non-JSON responses or empty responses
  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
    // If we got text but expected JSON, try to parse it
    if (data && data.trim().startsWith("{")) {
      try {
        data = JSON.parse(data);
      } catch {
        // Keep as text if parsing fails
      }
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `HTTP error! status: ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// -------------------------
// ADMIN LOGIN
// -------------------------
export async function adminLogin(username, password) {
  return fetchWithAuth("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// -------------------------
// FETCH ALL USERS
// -------------------------
export async function getUsers(token) {
  const data = await fetchWithAuth("/users", {}, token);
  return Array.isArray(data) ? { users: data } : data;
}

// -------------------------
// TOGGLE PREMIUM STATUS
// -------------------------
export async function togglePremium(userId, isPremium, token) {
  return fetchWithAuth(
    `/users/${userId}/premium`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_premium: isPremium }),
    },
    token
  );
}

// -------------------------
// RESET 2FA
// -------------------------
export async function reset2FA(userId, token) {
  return fetchWithAuth(
    `/users/${userId}/2fa-reset`,
    {
      method: "PATCH",
    },
    token
  );
}

// -------------------------
// REGENERATE PREMIUM KEY
// -------------------------
export async function regeneratePremiumKey(userId, token) {
  return fetchWithAuth(
    `/users/${userId}/premium-key`,
    {
      method: "PATCH",
    },
    token
  );
}

// -------------------------
// DELETE USER
// -------------------------
export async function deleteUser(userId, token) {
  return fetchWithAuth(
    `/users/${userId}`,
    {
      method: "DELETE",
    },
    token
  );
}

// -------------------------
// BULK DELETE USERS
// -------------------------
export async function bulkDeleteUsers(userIds, token) {
  return fetchWithAuth(
    "/users/bulk",
    {
      method: "DELETE",
      body: JSON.stringify({ userIds }),
    },
    token
  );
}

// -------------------------
// DELETE ALL USERS (DANGEROUS)
// -------------------------
export async function deleteAllUsers(token) {
  return fetchWithAuth(
    "/users",
    {
      method: "DELETE",
      body: JSON.stringify({ confirm: "DELETE_ALL_USERS" }),
    },
    token
  );
}

// -------------------------
// BATCH OPERATIONS
// -------------------------
export async function batchTogglePremium(userIds, isPremium, token) {
  return fetchWithAuth(
    "/users/batch-premium",
    {
      method: "PATCH",
      body: JSON.stringify({
        user_ids: userIds,
        is_premium: isPremium,
      }),
    },
    token
  );
}

// -------------------------
// HEALTH CHECK
// -------------------------
export async function checkAdminHealth(token) {
  try {
    await fetchWithAuth("/health", {}, token);
    return true;
  } catch {
    return false;
  }
}
