import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDashboardLogic } from "../logic/useDashboardLogic.js";
import DashboardUI from "./UI.jsx";

// Constants
const REDIRECT_DELAY = 2000;

// Memoized Components
const ErrorState = ({ error, message = "Redirecting to login..." }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-red-400 font-mono text-center p-8 border border-red-400">
      <div className="text-2xl mb-4">SECURITY_ERROR</div>
      <div className="text-sm mb-4">{error}</div>
      <div className="text-xs text-gray-400 mt-4">{message}</div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-cyan-400 font-mono text-xl animate-pulse">
      DECRYPTING_VAULT...
    </div>
  </div>
);

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    vault: initialVaultData,
    cards: initialCardsData,
    token,
    email,
  } = location.state || {};

  const [vaultKey, setVaultKey] = useState(null);
  const [activeTab, setActiveTab] = useState("passwords");
  const [error, setError] = useState("");
  const [keyLoaded, setKeyLoaded] = useState(false);

  // Derived values
  const initialVault = initialVaultData || { items: [] };
  const initialCards = initialCardsData || { items: [] };

  // Vault key loading
  const loadVaultKey = useCallback(async () => {
    if (keyLoaded) return;

    try {
      setError("");

      // Method 1: Check sessionStorage (2FA flow)
      const vaultKeyBase64 = sessionStorage.getItem("vault_key_base64");

      if (vaultKeyBase64) {
        const { importAesKeyFromBase64 } = await import("../crypto/crypto.js");
        const key = await importAesKeyFromBase64(vaultKeyBase64);
        setVaultKey(key);
        sessionStorage.removeItem("vault_key_base64");
        setKeyLoaded(true);
        return;
      }

      // Method 2: Derive from password/salt (direct login flow)
      if (location.state?.password && location.state?.salt) {
        const { deriveAesKey } = await import("../crypto/crypto.js");
        const key = await deriveAesKey(
          location.state.password,
          location.state.salt,
          "vault"
        );
        setVaultKey(key);
        setKeyLoaded(true);
        return;
      }

      // No valid authentication method found
      throw new Error("Session expired - please login again");
    } catch (err) {
      console.error("Failed to load vault key:", err);
      setError(err.message);
      setTimeout(() => navigate("/login", { replace: true }), REDIRECT_DELAY);
    }
  }, [navigate, location.state, keyLoaded]);

  useEffect(() => {
    loadVaultKey();
  }, [loadVaultKey]);

  // Dashboard logic
  const dashboardLogic = useDashboardLogic(
    vaultKey,
    token,
    initialVault,
    initialCards,
    navigate,
    setError
  );

  // Derived states
  const isLoading =
    dashboardLogic.loading || dashboardLogic.loadingCards || !vaultKey;
  const hasVaultData = dashboardLogic.vault?.items;
  const hasCardsData = dashboardLogic.cards?.items;

  // Show error state
  if (error && !vaultKey) {
    return <ErrorState error={error} />;
  }

  // Show loading state
  if (isLoading && !hasVaultData && !hasCardsData) {
    return <LoadingState />;
  }

  // Prepare props for DashboardUI
  const dashboardProps = {
    // Core props
    activeTab,
    setActiveTab,
    error,
    setError,
    isLoading,
    onLogout: dashboardLogic.logout,
    email,

    // Vault data
    vault: dashboardLogic.vault || initialVault,
    cards: dashboardLogic.cards || initialCards,

    // Vault operations
    newItem: dashboardLogic.newItem,
    setNewItem: dashboardLogic.setNewItem,
    searchTerm: dashboardLogic.searchTerm,
    setSearchTerm: dashboardLogic.setSearchTerm,
    passwordStrength: dashboardLogic.passwordStrength,
    showAddForm: dashboardLogic.showAddForm,
    visiblePasswords: dashboardLogic.visiblePasswords,
    breachResults: dashboardLogic.breachResults,
    scanning: dashboardLogic.scanning,
    scanProgress: dashboardLogic.scanProgress,
    copyToClipboard: dashboardLogic.copyToClipboard,
    saveVault: dashboardLogic.saveVault,
    addItem: dashboardLogic.addItem,
    removeItem: dashboardLogic.removeItem,
    scanForBreaches: dashboardLogic.scanForBreaches,
    clearBreachResults: dashboardLogic.clearBreachResults,
    togglePasswordVisibility: dashboardLogic.togglePasswordVisibility,
    openAddForm: dashboardLogic.openAddForm,
    closeAddForm: dashboardLogic.closeAddForm,
    editItem: dashboardLogic.editItem,
    updateItem: dashboardLogic.updateItem,
    cancelEdit: dashboardLogic.cancelEdit,
    editingItem: dashboardLogic.editingItem,

    // Card operations
    newCard: dashboardLogic.newCard,
    setNewCard: dashboardLogic.setNewCard,
    showAddCardForm: dashboardLogic.showAddCardForm,
    visibleCardDetails: dashboardLogic.visibleCardDetails,
    saveCards: dashboardLogic.saveCards,
    addCard: dashboardLogic.addCard,
    removeCard: dashboardLogic.removeCard,
    toggleCardDetailsVisibility: dashboardLogic.toggleCardDetailsVisibility,
    openAddCardForm: dashboardLogic.openAddCardForm,
    closeAddCardForm: dashboardLogic.closeAddCardForm,
    editingCard: dashboardLogic.editingCard,
    editCard: dashboardLogic.editCard,
    updateCard: dashboardLogic.updateCard,
    cancelCardEdit: dashboardLogic.cancelCardEdit,

    // Premium features
    isPremium: dashboardLogic.isPremium,
    onUnlockPremium: dashboardLogic.requestPremiumKey,
    premiumLoading: dashboardLogic.premiumLoading,
    showPremiumModal: dashboardLogic.showUnlockModal,
    setShowPremiumModal: dashboardLogic.setShowUnlockModal,
    premiumError: dashboardLogic.premiumError,
    onDisablePremium: dashboardLogic.disablePremium,
    showDisablePremiumModal: dashboardLogic.showDisablePremiumModal,
    setShowDisablePremiumModal: dashboardLogic.setShowDisablePremiumModal,

    // 2FA features
    twofaEnabled: dashboardLogic.twofaEnabled,
    qrCode: dashboardLogic.qrCode,
    show2FASetup: dashboardLogic.show2FASetup,
    handleVerify2FA: dashboardLogic.handleVerify2FA,
    close2FASetup: dashboardLogic.close2FASetup,
    onEnable2FA: dashboardLogic.handleEnable2FA,
    onDisable2FA: dashboardLogic.handleDisable2FA,
    twofaLoading: dashboardLogic.twofaLoading,
    showDisable2FAModal: dashboardLogic.showDisable2FAModal,
    closeDisable2FAModal: dashboardLogic.closeDisable2FAModal,
    twofaError: dashboardLogic.twofaError,
  };

  return <DashboardUI {...dashboardProps} />;
}
