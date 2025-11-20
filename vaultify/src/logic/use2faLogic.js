import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../util/api";

const ERROR_DISPLAY_TIME = 3000;

export function use2FA(token, setUIMessage) {
  const [twofaEnabled, setTwofaEnabled] = useState(false);
  const [twofaLoading, setTwofaLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [twofaError, setTwofaError] = useState("");

  // Two separate timers so UI success does NOT conflict with modal error
  const modalErrorTimer = useRef(null);
  const uiSuccessTimer = useRef(null);

  /** ---------------------
   *  Clean up timers
   * ----------------------*/
  useEffect(() => {
    return () => {
      clearTimeout(modalErrorTimer.current);
      clearTimeout(uiSuccessTimer.current);
    };
  }, []);

  /** ---------------------
   *  Modal error (auto-clear)
   * ----------------------*/
  const showModalError = useCallback((msg) => {
    setTwofaError(msg);
    clearTimeout(modalErrorTimer.current);
    modalErrorTimer.current = setTimeout(() => {
      setTwofaError("");
    }, ERROR_DISPLAY_TIME);
  }, []);

  /** ---------------------
   *  UI success message (auto-clear)
   * ----------------------*/
  const showUISuccess = useCallback(
    (msg) => {
      if (!setUIMessage) return;

      setUIMessage(msg);
      clearTimeout(uiSuccessTimer.current);

      uiSuccessTimer.current = setTimeout(() => {
        setUIMessage("");
      }, ERROR_DISPLAY_TIME);
    },
    [setUIMessage]
  );

  /** ---------------------
   *  API wrapper
   * ----------------------*/
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "API error");
      return data;
    },
    [token]
  );

  /** ---------------------
   *  Load 2FA status
   * ----------------------*/
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await fetchAPI(`${API_BASE}/2fa/status`);
        setTwofaEnabled(data.enabled);
      } catch {}
    })();
  }, [token, fetchAPI]);

  /** ---------------------
   *  Enable 2FA
   * ----------------------*/
  const handleEnable2FA = useCallback(async () => {
    try {
      setTwofaLoading(true);

      const { qrCodeURL } = await fetchAPI(`${API_BASE}/2fa/setup`, {
        method: "POST",
      });

      setQrCode(qrCodeURL);
      setShow2FASetup(true);

      return { success: true };
    } catch (err) {
      showModalError("Failed to setup 2FA.");
      return { success: false };
    } finally {
      setTwofaLoading(false);
    }
  }, [fetchAPI, showModalError]);

  /** ---------------------
   *  Verify 2FA
   * ----------------------*/
  const handleVerify2FA = useCallback(
    async (code) => {
      try {
        setTwofaLoading(true);

        await fetchAPI(`${API_BASE}/2fa/verify`, {
          method: "POST",
          body: JSON.stringify({ token: code }),
        });

        setTwofaEnabled(true);
        setShow2FASetup(false);
        setQrCode(null);

        showUISuccess("2FA enabled successfully!");

        return { success: true };
      } catch (err) {
        const msg = err.message.includes("invalid")
          ? "Invalid TOTP code."
          : "Verification failed.";
        showModalError(msg);
        return { success: false };
      } finally {
        setTwofaLoading(false);
      }
    },
    [fetchAPI, showModalError, showUISuccess]
  );

  /** ---------------------
   *  Disable 2FA
   * ----------------------*/
  const handleDisable2FA = useCallback(
    async (password) => {
      if (!password) {
        setShowDisable2FAModal(true);
        return { success: false, requiresPassword: true };
      }

      try {
        setTwofaLoading(true);

        const { salt } = await fetchAPI(`${API_BASE}/premium/salt`);
        const { deriveAuthProof } = await import("../crypto/crypto.js");

        const authProof = await deriveAuthProof(password, salt, "auth");

        await fetchAPI(`${API_BASE}/2fa/disable`, {
          method: "POST",
          body: JSON.stringify({ auth_proof: authProof }),
        });

        setTwofaEnabled(false);
        setShowDisable2FAModal(false);

        showUISuccess(" 2FA disabled successfully");

        return { success: true };
      } catch (err) {
        const msg = err.message.includes("password")
          ? "Invalid password."
          : "Failed to disable 2FA.";
        showModalError(msg);
        return { success: false };
      } finally {
        setTwofaLoading(false);
      }
    },
    [fetchAPI, showModalError, showUISuccess]
  );

  /** ---------------------
   *  Modal close handlers
   * ----------------------*/
  const close2FASetup = () => {
    setShow2FASetup(false);
    setTwofaError("");
    clearTimeout(modalErrorTimer.current);
  };

  const closeDisable2FAModal = () => {
    setShowDisable2FAModal(false);
    setTwofaError("");
    clearTimeout(modalErrorTimer.current);
  };

  return {
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
}
