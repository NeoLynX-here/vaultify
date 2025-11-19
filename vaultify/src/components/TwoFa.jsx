import { useState, useEffect } from "react";
import {
  importAesKeyFromBase64,
  decryptVaultFields,
  isEncryptedFieldShape,
} from "../crypto/crypto";
import { API_BASE } from "../util/api";

// Constants
const REQUEST_TIMEOUT_MS = 10000;
const ERROR_DISPLAY_TIME_MS = 2000;
const CLEANUP_DELAY_MS = 1000;
const OTP_LENGTH = 6;

export default function TwoFAModal({
  show,
  onClose,
  twoFAData,
  onVerificationSuccess,
}) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [vaultKey, setVaultKey] = useState(null);
  const [vaultKeyBase64, setVaultKeyBase64] = useState(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setOtp("");
      setError("");
      setVerifying(false);
    }
  }, [show]);

  // Load vault key when modal opens
  useEffect(() => {
    async function loadKey() {
      if (!show) return;

      try {
        setError("");
        const base64Key = sessionStorage.getItem("vault_key_base64");
        if (!base64Key) {
          throw new Error("Session expired - please login again");
        }

        const key = await importAesKeyFromBase64(base64Key);
        setVaultKey(key);
        setVaultKeyBase64(base64Key);
      } catch (err) {
        console.error("Failed to import AES key:", err);
        setError(err.message);
        setTimeout(onClose, ERROR_DISPLAY_TIME_MS);
      }
    }
    loadKey();
  }, [show, onClose]);

  const handleOtpChange = (value) => {
    setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
  };

  const verifyOTP = async (ticket, otpCode) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE}/2fa/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: ticket, otp: otpCode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const responseText = await res.text();
        let message = "Invalid or expired code";
        try {
          const parsed = JSON.parse(responseText);
          message = parsed.message || message;
        } catch {}
        throw new Error(message);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const fetchUserData = async (token) => {
    const [vaultRes, cardsRes] = await Promise.all([
      fetch(`${API_BASE}/vault`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    let vaultData = { items: [] };
    if (vaultRes.ok) {
      const data = await vaultRes.json();
      vaultData = data.encrypted_blob || { items: [] };
    }

    let cardsData = { items: [] };
    if (cardsRes.ok) {
      const data = await cardsRes.json();
      cardsData = data.encrypted_blob || { items: [] };
    }

    return { vaultData, cardsData };
  };

  const decryptData = async (vaultData, cardsData, key) => {
    const needsDecryption = (data) =>
      data.items?.some((item) =>
        Object.values(item).some((value) => isEncryptedFieldShape(value))
      );

    const [decryptedVault, decryptedCards] = await Promise.all([
      needsDecryption(vaultData)
        ? decryptVaultFields(vaultData, key)
        : vaultData,
      needsDecryption(cardsData)
        ? decryptVaultFields(cardsData, key)
        : cardsData,
    ]);

    return {
      vault: { items: decryptedVault.items || [] },
      cards: { items: decryptedCards.items || [] },
    };
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setVerifying(true);

    try {
      const { ticket } = twoFAData;
      if (!ticket) throw new Error("No verification ticket found");
      if (!otp || otp.length !== OTP_LENGTH)
        throw new Error("Please enter 6-digit code");
      if (!vaultKey) throw new Error("Security system not ready");

      const data = await verifyOTP(ticket, otp);
      const { token, is_premium } = data;
      if (!token) throw new Error("No authentication token received");

      const { vaultData, cardsData } = await fetchUserData(token);
      const { vault, cards } = await decryptData(
        vaultData,
        cardsData,
        vaultKey
      );

      onVerificationSuccess({
        vault,
        cards,
        token,
        isPremium: is_premium || false,
        vault_key_base64: vaultKeyBase64,
        email: twoFAData?.email,
      });

      // Clean up session storage
      setTimeout(() => {
        sessionStorage.removeItem("vault_key_base64");
      }, CLEANUP_DELAY_MS);
    } catch (err) {
      console.error("2FA verification failed:", err);
      setError(
        err.name === "AbortError"
          ? "Request timeout - please try again"
          : err.message
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    sessionStorage.removeItem("vault_key_base64");
    onClose();
  };

  const canSubmit = !verifying && otp.length === OTP_LENGTH && vaultKey;
  const buttonText = verifying
    ? "VERIFYING_CODE..."
    : !vaultKey
    ? "INITIALIZING_SECURITY..."
    : "VERIFY_IDENTITY";

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/95 border border-cyan-400/50 rounded-none p-8 max-w-md w-full shadow-[0_0_40px_rgba(34,211,238,0.4)] relative group">
        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600"></div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-pink-400 transition-colors duration-200"
          disabled={verifying}
        >
          <span className="material-icons text-xl">close</span>
        </button>

        <h2 className="text-3xl mb-4 text-center text-cyan-400 font-mono tracking-wider">
          _2FA_VERIFICATION_
        </h2>

        <p className="text-cyan-300 text-sm text-center mb-6 font-mono">
          ENTER_6_DIGIT_CODE_FROM_AUTHENTICATOR
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              className="w-full text-center text-2xl tracking-[10px] p-4 border border-cyan-500 bg-black text-cyan-300 focus:outline-none focus:border-pink-500 transition-all font-mono"
              placeholder="••••••"
              autoFocus
              disabled={verifying || !vaultKey}
            />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mt-2 font-mono animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-4 font-bold text-lg font-mono transition-all duration-200 border relative overflow-hidden group mt-4 ${
              !canSubmit
                ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-black border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
            }`}
          >
            <span className="relative z-10">{buttonText}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-pink-600/0 to-cyan-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300"></div>
          </button>
        </form>

        {!vaultKey && (
          <p className="text-yellow-400 text-sm text-center mt-4 font-mono animate-pulse">
            INITIALIZING_SECURITY_SYSTEM...
          </p>
        )}
      </div>
    </div>
  );
}
