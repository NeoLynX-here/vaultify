import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVaultLogic } from "./useVaultLogic";
import { useCardLogic } from "./useCardLogic";
import { usePremiumLogic } from "./usePremiumLogic";
import { use2FA } from "./use2faLogic";


// Constants
const SCAN_PROGRESS_INTERVAL = 300;
const SCAN_PROGRESS_INCREMENT = 10;
const MESSAGE_TIMEOUT = 2000;
const SCAN_MESSAGE_TIMEOUT = 5000;

export function useDashboardLogic(
  vaultKey,
  token,
  initialVault,
  initialCards,
  navigate,
  setError
) {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Refs
  const initialLoadComplete = useRef(false);
  const previousVaultKey = useRef(null);
  const progressIntervalRef = useRef(null);
  const messageTimeoutRef = useRef(null);

  // Memoized values
  const hasVaultKey = !!vaultKey;
  const hasToken = !!token;

  // Initialize logic hooks
  const vaultLogic = useVaultLogic(
    vaultKey,
    token,
    initialVault,
    navigate,
    setError,
    initialLoadComplete
  );

  const cardLogic = useCardLogic(
    vaultKey,
    token,
    navigate,
    setError,
    initialLoadComplete,
    initialCards
  );

  const premiumLogic = usePremiumLogic(token, setError);
  const twofaLogic = use2FA(token, setError);

  // Stable references for critical functions
  const functionRefs = useRef({
    loadVault: vaultLogic.loadVault,
    loadCards: cardLogic.loadCards,
    setVault: vaultLogic.setVault,
    setCards: cardLogic.setCards,
  });

  useEffect(() => {
    functionRefs.current = {
      loadVault: vaultLogic.loadVault,
      loadCards: cardLogic.loadCards,
      setVault: vaultLogic.setVault,
      setCards: cardLogic.setCards,
    };
  }, [
    vaultLogic.loadVault,
    cardLogic.loadCards,
    vaultLogic.setVault,
    cardLogic.setCards,
  ]);

  // Optimized vault key change handler
  useEffect(() => {
    if (hasVaultKey && vaultKey !== previousVaultKey.current) {
      console.log(" Vault key updated, checking data reload...");
      previousVaultKey.current = vaultKey;

      const { loadVault, loadCards } = functionRefs.current;
      const hasExistingVaultData = vaultLogic.vault?.items?.length > 0;
      const hasExistingCardsData = cardLogic.cards?.items?.length > 0;

      if (hasExistingVaultData) {
        console.log(" Reloading vault with new key...");
        loadVault();
      }
      if (hasExistingCardsData) {
        loadCards();
      }
    }
  }, [hasVaultKey, vaultKey, vaultLogic.vault?.items, cardLogic.cards?.items]);

  // Optimized initial data load
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (
        !hasVaultKey ||
        !hasToken ||
        initialLoadComplete.current ||
        !mounted
      ) {
        return;
      }

      console.log(" Dashboard: Initial data load...");

      try {
        const { loadVault, loadCards, setVault, setCards } =
          functionRefs.current;
        const shouldLoadVault = !initialVault?.items?.length;
        const shouldLoadCards = !initialCards?.items?.length;

        console.log(
          ` Load conditions - Vault: ${shouldLoadVault}, Cards: ${shouldLoadCards}`
        );

        const loadPromises = [];

        if (shouldLoadVault) {
          loadPromises.push(loadVault());
        } else {
          console.log(" Using initial vault data from login");
          setVault(initialVault);
        }

        if (shouldLoadCards) {
          loadPromises.push(loadCards());
        } else {
          console.log(" Using initial cards data from login");
          setCards(initialCards);
        }

        await Promise.all(loadPromises);

        if (mounted) {
          initialLoadComplete.current = true;
          console.log(" Initial data load complete");
        }
      } catch (err) {
        console.error(" Initial data load failed:", err);
        if (mounted) {
          setError("Failed to load data");
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [hasVaultKey, hasToken, initialVault, initialCards, setError]);

  // Cleanup timeouts and intervals
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Optimized clipboard helper
  const copyToClipboard = useCallback(
    async (text) => {
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        setError("Copied to clipboard!");

        // Clear previous timeout
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }

        messageTimeoutRef.current = setTimeout(() => {
          setError("");
        }, MESSAGE_TIMEOUT);
      } catch (err) {
        console.error("Copy failed:", err);
        setError("Failed to copy");
      }
    },
    [setError]
  );

  // Optimized logout handler
  const logout = useCallback(() => {
    // Clear any pending timeouts
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("vaultData");
    sessionStorage.removeItem("vault_key_base64");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Memoized breach scan conditions
  const scanConditions = useMemo(
    () => ({
      hasItems: vaultLogic.vault?.items?.length > 0,
      hasVaultKey,
    }),
    [vaultLogic.vault?.items, hasVaultKey]
  );

  // Optimized breach scan with proper cleanup
  const scanForBreaches = useCallback(async () => {
    if (!scanConditions.hasItems) {
      setError("No items to scan");
      setTimeout(() => setError(""), 2000);
      return;
    }

    if (!scanConditions.hasVaultKey) {
      setError("Encryption key not available");
      return;
    }

    try {
      // Clear previous intervals/timeouts
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      setScanning(true);
      setScanProgress(0);
      setError("");

      // Extract passwords efficiently
      const passwordsToCheck = {};
      let passwordCount = 0;

      for (const item of vaultLogic.vault.items) {
        if (item.password?.trim()) {
          passwordsToCheck[item.id] = item.password;
          passwordCount++;
        }
      }

      if (passwordCount === 0) {
        setError("No passwords available for scanning");
        setScanning(false);
        return;
      }

      setError(`Scanning ${passwordCount} passwords...`);

      // Simulate progress
      progressIntervalRef.current = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressIntervalRef.current);
            return prev;
          }
          return prev + SCAN_PROGRESS_INCREMENT;
        });
      }, SCAN_PROGRESS_INTERVAL);

      const results = await vaultLogic.breachService.checkMultiplePasswords(
        passwordsToCheck
      );

      clearInterval(progressIntervalRef.current);
      setScanProgress(100);

      vaultLogic.setBreachResults(results);

      const breachedCount = Object.values(results).filter(
        (r) => r.isBreached
      ).length;

      const message = `Scan complete! ${passwordCount} password${
        passwordCount > 1 ? "s" : ""
      } scanned. ${
        breachedCount
          ? `Found ${breachedCount} breached password${
              breachedCount > 1 ? "s" : ""
            }.`
          : `No breaches found.`
      }`;

      setError(message);

      // Auto-clear success message
      messageTimeoutRef.current = setTimeout(() => {
        setError("");
      }, SCAN_MESSAGE_TIMEOUT);
    } catch (error) {
      console.error("Scan error:", error);
      setError("Failed to scan for breaches: " + error.message);

      // Cleanup on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } finally {
      setScanning(false);
    }
  }, [
    scanConditions,
    vaultLogic.vault.items,
    vaultLogic.breachService,
    vaultLogic.setBreachResults,
    setError,
  ]);

  // Memoized clear breach results
  const clearBreachResults = useCallback(
    () => vaultLogic.setBreachResults({}),
    [vaultLogic.setBreachResults]
  );

  // Memoized search handler
  const handleSetSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Optimized return object with stable references
  const dashboardLogic = useMemo(
    () => ({
      // Common state
      searchTerm,
      scanning,
      scanProgress,

      // Common actions
      setSearchTerm: handleSetSearchTerm,
      copyToClipboard,
      logout,
      scanForBreaches,
      clearBreachResults,

      // Vault logic
      ...vaultLogic,

      // Cards logic
      ...cardLogic,

      // Premium logic
      ...premiumLogic,

      // 2FA logic
      ...twofaLogic,
    }),
    [
      searchTerm,
      scanning,
      scanProgress,
      handleSetSearchTerm,
      copyToClipboard,
      logout,
      scanForBreaches,
      clearBreachResults,
      vaultLogic,
      cardLogic,
      premiumLogic,
      twofaLogic,
    ]
  );

  return dashboardLogic;
}
