// src/crypto/crypto.js
// Client-side crypto helpers for Vaultify (Web Crypto API)

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* -------------------------
   Utilities (ArrayBuffer <-> base64/hex)
   ------------------------- */
export function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // build string in chunks to avoid stack issues with large arrays
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBuf(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function hex(buffer) {
  const b = new Uint8Array(buffer);
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/* -------------------------
   Salt & IV generation
   ------------------------- */
export function generateSalt(length = 16) {
  const s = crypto.getRandomValues(new Uint8Array(length));
  return bufToBase64(s.buffer); // store as base64 string
}

function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
}

/* -------------------------
   PBKDF2 helpers
   ------------------------- */
async function importPasswordKey(password) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Derive an AES-GCM CryptoKey for the vault from password + salt + context.
 * - extractable: set true only if you intend to export the key (short-lived).
 */
export async function deriveAesKey(
  password,
  saltBase64,
  contextLabel = "vault",
  iterations = 250_000,
  extractable = false
) {
  const saltBuf = base64ToBuf(saltBase64);
  const combinedSalt = new Uint8Array([
    ...new Uint8Array(saltBuf),
    ...encoder.encode(contextLabel),
  ]);
  const baseKey = await importPasswordKey(password);
  const derived = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: combinedSalt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    extractable, // <-- controlled here
    ["encrypt", "decrypt"]
  );
  return derived; // CryptoKey
}

/**
 * Derive a raw auth proof (ArrayBuffer) you send to server over TLS.
 * Returns base64 string.
 */
export async function deriveAuthProof(
  password,
  saltBase64,
  contextLabel = "auth",
  iterations = 250_000,
  length = 32
) {
  const saltBuf = base64ToBuf(saltBase64);
  const combinedSalt = new Uint8Array([
    ...new Uint8Array(saltBuf),
    ...encoder.encode(contextLabel),
  ]);
  const baseKey = await importPasswordKey(password);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: combinedSalt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    length * 8
  );
  return bufToBase64(bits); // base64 string
}

/* -------------------------
   Export / Import CryptoKey helpers
   - exportCryptoKeyToBase64: serialize an AES CryptoKey (raw)
   - importAesKeyFromBase64: re-create a CryptoKey from base64 raw bytes
   ------------------------- */

/**
 * Export a CryptoKey (AES) to base64 string.
 * - Key must be extractable (created with extractable=true).
 */
export async function exportCryptoKeyToBase64(aesKey) {
  if (!(aesKey instanceof CryptoKey)) throw new Error("Not a CryptoKey");
  const raw = await crypto.subtle.exportKey("raw", aesKey); // ArrayBuffer
  return bufToBase64(raw);
}

/**
 * Import AES-GCM key from base64 (raw) string.
 * - usable for decrypt/encrypt
 */
export async function importAesKeyFromBase64(base64, extractable = false) {
  const raw = base64ToBuf(base64);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"]
  );
}

/* -------------------------
   Full-vault Encrypt / Decrypt (AES-GCM)
   ------------------------- */
export async function encryptVaultJson(jsonObj, aesKey) {
  if (!aesKey) throw new Error("Missing AES key");
  const iv = generateIV();
  const plaintext = encoder.encode(JSON.stringify(jsonObj));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintext
  );
  return {
    iv: bufToBase64(iv.buffer),
    cipher: bufToBase64(cipherBuf),
    version: 1,
  };
}

export async function decryptVaultJson(encryptedObj, aesKey) {
  if (!encryptedObj || !encryptedObj.cipher)
    throw new Error("Invalid encrypted data");
  const ivBuf = base64ToBuf(encryptedObj.iv);
  const cipherBuf = base64ToBuf(encryptedObj.cipher);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
    aesKey,
    cipherBuf
  );
  const text = decoder.decode(plainBuf);
  return JSON.parse(text);
}

/* -------------------------
   Field-level Encryption (per-value)
   ------------------------- */
export async function encryptField(plaintext, aesKey) {
  if (!aesKey) throw new Error("Missing AES key");
  if (typeof plaintext !== "string") plaintext = JSON.stringify(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );
  return {
    iv: bufToBase64(iv.buffer),
    cipher: bufToBase64(cipherBuf),
  };
}

export async function decryptField(encObj, aesKey) {
  if (!aesKey) throw new Error("Missing AES key");
  if (!encObj || !encObj.iv || !encObj.cipher)
    throw new Error("Invalid encrypted field");
  const ivBuf = base64ToBuf(encObj.iv);
  const cipherBuf = base64ToBuf(encObj.cipher);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
    aesKey,
    cipherBuf
  );
  const decoded = decoder.decode(plainBuf);
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

/* -------------------------
   Vault and Card field helpers
   ------------------------- */
export function isEncryptedFieldShape(x) {
  return x && typeof x === "object" && "iv" in x && "cipher" in x;
}

export async function encryptVaultFields(vaultObj, aesKey) {
  if (!vaultObj || typeof vaultObj !== "object") vaultObj = { items: [] };
  if (!aesKey) throw new Error("Missing AES key for encryption");
  const out = { items: [] };
  for (const item of vaultObj.items || []) {
    const encryptedItem = { ...item };
    for (const field of ["notes", "link", "username", "password"]) {
      const val = item[field];
      encryptedItem[field] = isEncryptedFieldShape(val)
        ? val
        : await encryptField(val ?? "", aesKey);
    }
    out.items.push(encryptedItem);
  }
  return out;
}

export async function decryptVaultFields(vaultObj, aesKey) {
  if (!vaultObj || typeof vaultObj !== "object") vaultObj = { items: [] };
  if (!aesKey) throw new Error("Missing AES key for decryption");
  const out = { items: [] };
  for (const item of vaultObj.items || []) {
    const decryptedItem = { ...item };
    for (const field of ["notes", "link", "username", "password"]) {
      const val = item[field];
      decryptedItem[field] = isEncryptedFieldShape(val)
        ? await decryptField(val, aesKey)
        : val ?? "";
    }
    out.items.push(decryptedItem);
  }
  return out;
}

export async function encryptCardFields(cardObj, aesKey) {
  if (!cardObj || typeof cardObj !== "object") cardObj = { items: [] };
  if (!aesKey) throw new Error("Missing AES key for encryption");
  const out = { items: [] };
  for (const item of cardObj.items || []) {
    const encryptedItem = { ...item };
    for (const field of [
      "title",
      "cardholderName",
      "cardNumber",
      "expiryDate",
      "cvv",
      "notes",
    ]) {
      const val = item[field];
      if (val !== undefined && val !== null) {
        encryptedItem[field] = isEncryptedFieldShape(val)
          ? val
          : await encryptField(val ?? "", aesKey);
      }
    }
    out.items.push(encryptedItem);
  }
  return out;
}

export async function decryptCardFields(cardObj, aesKey) {
  if (!cardObj || typeof cardObj !== "object") cardObj = { items: [] };
  if (!aesKey) throw new Error("Missing AES key for decryption");
  const out = { items: [] };
  for (const item of cardObj.items || []) {
    const decryptedItem = { ...item };
    for (const field of [
      "title",
      "cardholderName",
      "cardNumber",
      "expiryDate",
      "cvv",
      "notes",
    ]) {
      const val = item[field];
      if (val !== undefined && val !== null) {
        decryptedItem[field] = isEncryptedFieldShape(val)
          ? await decryptField(val, aesKey)
          : val ?? "";
      }
    }
    out.items.push(decryptedItem);
  }
  return out;
}
