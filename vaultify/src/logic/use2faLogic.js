import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../util/api";

// Constants
const ERROR_DISPLAY_TIME = 3000;
const EXTENDED_ERROR_DISPLAY_TIME = 4000;

export function use2FA(token, setError) {
  // State
  const [twofaEnabled, setTwofaEnabled] = useState(false);
  const [twofaLoading, setTwofaLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [twofaError, setTwofaError] = useState("");

  // Refs for cleanup
  const errorTimeoutRef = useRef(null);
  const twofaErrorTimeoutRef = useRef(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (twofaErrorTimeoutRef.current)
        clearTimeout(twofaErrorTimeoutRef.current);
    };
  }, []);

  // Error management
  const clearErrors = useCallback(() => {
    setTwofaError("");
    setError?.("");
  }, [setError]);

  const showTemporaryError = useCallback(
    (message, duration = ERROR_DISPLAY_TIME) => {
      setTwofaError(message);
      setError?.(message);

      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(clearErrors, duration);
    },
    [setError, clearErrors]
  );

  const showTemporarySuccess = useCallback(
    (message, duration = ERROR_DISPLAY_TIME) => {
      setError?.(message);

      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError?.(""), duration);
    },
    [setError]
  );

  // API calls with better error handling
  const fetchAPI = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || `API request failed: ${response.status}`
        );
      }

      return await response.json();
    },
    [token]
  );

  // Fetch 2FA status with caching consideration
  const fetch2FAStatus = useCallback(async () => {
    try {
      const data = await fetchAPI(`${API_BASE}/2fa/status`);
      setTwofaEnabled(data.enabled);
    } catch (err) {
      console.error("Failed to fetch 2FA status:", err);
    }
  }, [fetchAPI]);

  // Enable 2FA
  const handleEnable2FA = useCallback(async () => {
    try {
      setTwofaLoading(true);
      setTwofaError("");

      const data = await fetchAPI(`${API_BASE}/2fa/setup`, { method: "POST" });
      setQrCode(data.qrCodeURL);
      setShow2FASetup(true);

      return { success: true, qrCode: data.qrCodeURL };
    } catch (err) {
      console.error("Enable 2FA failed:", err);
      setTwofaError(err.message);
      return { success: false, error: err.message };
    } finally {
      setTwofaLoading(false);
    }
  }, [fetchAPI]);

  // Verify 2FA Code
  const handleVerify2FA = useCallback(
    async (verificationCode) => {
      try {
        setTwofaLoading(true);
        setTwofaError("");

        await fetchAPI(`${API_BASE}/2fa/verify`, {
          method: "POST",
          body: JSON.stringify({ token: verificationCode }),
        });

        setTwofaEnabled(true);
        setShow2FASetup(false);
        setQrCode(null);
        showTemporarySuccess("2FA enabled successfully!");

        return { success: true };
      } catch (err) {
        console.error("Verify 2FA failed:", err);
        setTwofaError(err.message);
        return { success: false, error: err.message };
      } finally {
        setTwofaLoading(false);
      }
    },
    [fetchAPI, showTemporarySuccess]
  );

  // Disable 2FA with Password Verification
  const handleDisable2FA = useCallback(
    async (password = "") => {
      // If no password provided, show password modal
      if (!password) {
        setShowDisable2FAModal(true);
        setTwofaError("");
        return { success: false, requiresPassword: true };
      }

      try {
        setTwofaLoading(true);
        setTwofaError("");
        setError("");

        // Get salt and derive auth proof
        const { salt } = await fetchAPI(`${API_BASE}/premium/salt`);
        const { deriveAuthProof } = await import("../crypto/crypto.js");
        const authProof = await deriveAuthProof(password, salt, "auth");

        // Disable 2FA
        await fetchAPI(`${API_BASE}/2fa/disable`, {
          method: "POST",
          body: JSON.stringify({ auth_proof: authProof }),
        });

        // Success
        setTwofaEnabled(false);
        setShowDisable2FAModal(false);
        showTemporarySuccess("🔓 2FA disabled successfully");

        return { success: true };
      } catch (err) {
        console.error("Disable 2FA failed:", err);

        // Auto-clear 2FA error after extended time
        setTwofaError(err.message);
        if (twofaErrorTimeoutRef.current)
          clearTimeout(twofaErrorTimeoutRef.current);
        twofaErrorTimeoutRef.current = setTimeout(
          () => setTwofaError(""),
          EXTENDED_ERROR_DISPLAY_TIME
        );

        return { success: false, error: err.message };
      } finally {
        setTwofaLoading(false);
      }
    },
    [fetchAPI, showTemporarySuccess, setError]
  );

  // Modal handlers
  const close2FASetup = useCallback(() => {
    setShow2FASetup(false);
    setQrCode(null);
    setTwofaError("");
  }, []);

  const closeDisable2FAModal = useCallback(() => {
    setShowDisable2FAModal(false);
    clearErrors();
  }, [clearErrors]);

  // Effects
  useEffect(() => {
    if (token) {
      fetch2FAStatus();
    }
  }, [token, fetch2FAStatus]);

  // Memoized return values to prevent unnecessary re-renders
  const returnValue = {
    twofaEnabled,
    twofaLoading,
    qrCode,
    show2FASetup,
    showDisable2FAModal,
    twofaError,
    handleEnable2FA,
    handleVerify2FA,
    handleDisable2FA,
    close2FASetup,
    closeDisable2FAModal,
  };

  return returnValue;
}
