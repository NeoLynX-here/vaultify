import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../util/api";

// Constants
const PREMIUM_TOKEN_KEY = "premiumToken";
const VERIFY_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const ERROR_DISPLAY_TIME = 3000;
const REQUEST_TIMEOUT_MS = 10000;

// Default error handler
const defaultSetError = () => {};

export function usePremiumLogic(
  token,
  setError = defaultSetError,
  initialPremium = false
) {
  // State
  const [isPremium, setIsPremium] = useState(initialPremium);
  const [premiumToken, setPremiumToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDisablePremiumModal, setShowDisablePremiumModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [premiumError, setPremiumError] = useState("");

  // Derived state
  const isLoading = loading || verifying;

  // Error management
  const clearErrors = useCallback(() => {
    setPremiumError("");
    setError("");
  }, [setError]);

  const setErrors = useCallback(
    (message) => {
      setPremiumError(message);
      setError(message);
    },
    [setError]
  );

  const showTemporaryError = useCallback(
    (message, duration = ERROR_DISPLAY_TIME) => {
      setErrors(message);
      setTimeout(clearErrors, duration);
    },
    [setErrors, clearErrors]
  );

  // Token management
  const savePremiumToken = useCallback((token) => {
    setPremiumToken(token);
    localStorage.setItem(PREMIUM_TOKEN_KEY, token);
  }, []);

  const clearPremiumToken = useCallback(() => {
    setPremiumToken(null);
    localStorage.removeItem(PREMIUM_TOKEN_KEY);
  }, []);

  // Premium status management
  const activatePremium = useCallback(
    (premiumToken) => {
      setIsPremium(true);
      savePremiumToken(premiumToken);
    },
    [savePremiumToken]
  );

  const deactivatePremium = useCallback(() => {
    setIsPremium(false);
    clearPremiumToken();
  }, [clearPremiumToken]);

  // API calls
  const verifyPremiumStatus = useCallback(async () => {
    if (!token) return;

    try {
      setVerifying(true);
      const res = await fetch(`${API_BASE}/premium/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to verify premium status");

      const data = await res.json();

      if (data.isPremium) {
        activatePremium(data.premiumToken);
      } else {
        deactivatePremium();
      }
    } catch (err) {
      console.warn(" Premium status check failed:", err.message);
      // Don't logout on network errors, keep current state
    } finally {
      setVerifying(false);
    }
  }, [token, activatePremium, deactivatePremium]);

  const verifyPremiumKey = useCallback(
    async (premiumKey) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const res = await fetch(`${API_BASE}/premium/verifyPremium`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key: premiumKey.trim() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Invalid key (${res.status})`);
        }

        return await res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    },
    [token]
  );

  const disablePremiumAPI = useCallback(
    async (authProof) => {
      const res = await fetch(`${API_BASE}/premium/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ auth_proof: authProof }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to disable premium");
      }
    },
    [token]
  );

  const getSalt = useCallback(async () => {
    const res = await fetch(`${API_BASE}/premium/salt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to get salt");
    return await res.json();
  }, [token]);

  // Main operations
  const requestPremiumKey = useCallback(
    async (premiumKey = "") => {
      if (!token) {
        setPremiumError("Authentication required");
        return;
      }

      if (!premiumKey) {
        setShowUnlockModal(true);
        setPremiumError("");
        return;
      }

      try {
        setLoading(true);
        clearErrors();

        const trimmedKey = premiumKey.trim();
        if (!trimmedKey) {
          showTemporaryError(" NO_KEY_ENTERED");
          return;
        }

        const data = await verifyPremiumKey(trimmedKey);

        if (data.premiumToken) {
          activatePremium(data.premiumToken);
          showTemporaryError("PREMIUM_UNLOCKED!");
          setShowUnlockModal(false);
        } else {
          throw new Error("No token received from server");
        }
      } catch (err) {
        console.error(" Premium unlock failed:", err);

        let errorMessage = err.message || "Failed to verify premium key";
        if (err.name === "AbortError") {
          errorMessage = "Request timeout - please try again";
        }

        showTemporaryError(errorMessage, 4000);
      } finally {
        setLoading(false);
      }
    },
    [token, clearErrors, showTemporaryError, verifyPremiumKey, activatePremium]
  );

  const disablePremium = useCallback(
    async (password = "") => {
      if (!token) {
        setPremiumError("Authentication required");
        return;
      }

      if (!password) {
        setShowDisablePremiumModal(true);
        setPremiumError("");
        return;
      }

      try {
        setLoading(true);
        clearErrors();

        // Step 1: Get salt from server
        const { salt } = await getSalt();

        // Step 2: Derive auth proof
        const { deriveAuthProof } = await import("../crypto/crypto.js");
        const authProof = await deriveAuthProof(password, salt, "auth");

        // Step 3: Disable premium
        await disablePremiumAPI(authProof);

        // Success
        deactivatePremium();
        setShowDisablePremiumModal(false);
        showTemporaryError(" Premium access disabled");
      } catch (err) {
        showTemporaryError(err.message, 4000);
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      clearErrors,
      showTemporaryError,
      getSalt,
      disablePremiumAPI,
      deactivatePremium,
    ]
  );

  // Modal handlers
  const handleCloseUnlockModal = useCallback(() => {
    setShowUnlockModal(false);
    setPremiumError("");
  }, []);

  const handleCloseDisableModal = useCallback(() => {
    setShowDisablePremiumModal(false);
    setPremiumError("");
  }, []);

  const logoutPremium = useCallback(() => {
    deactivatePremium();
    console.log("Premium access cleared");
  }, [deactivatePremium]);

  // Effects
  // Initialize from localStorage and verify status
  useEffect(() => {
    const savedToken = localStorage.getItem(PREMIUM_TOKEN_KEY);
    if (savedToken) {
      setPremiumToken(savedToken);
      setIsPremium(true); // temporarily trust it
    }

    if (token) {
      verifyPremiumStatus();
    }
  }, [token, verifyPremiumStatus]);

  // Auto-verify premium status periodically
  useEffect(() => {
    if (!isPremium || !token) return;

    const interval = setInterval(verifyPremiumStatus, VERIFY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPremium, token, verifyPremiumStatus]);

  return {
    isPremium,
    premiumToken,
    loading: isLoading,
    showUnlockModal,
    setShowUnlockModal,
    showDisablePremiumModal,
    setShowDisablePremiumModal,
    requestPremiumKey,
    disablePremium,
    logoutPremium,
    verifyPremiumStatus,
    premiumError,
    // Additional convenience methods
    handleCloseUnlockModal,
    handleCloseDisableModal,
  };
}
