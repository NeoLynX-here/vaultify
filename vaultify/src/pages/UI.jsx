import { useState, useMemo, useCallback, memo } from "react";
import AddItemModal from "../components/Dashboard/AddKey.jsx";
import AddCardModal from "../components/Dashboard/AddCard.jsx";
import SearchBar from "../components/Dashboard/SearchBar.jsx";
import VaultItemsList from "../components/Dashboard/VaultItemsList.jsx";
import CardsList from "../components/Dashboard/CardsList.jsx";
import Sidebar from "../components/Dashboard/Sidebar.jsx";
import TwoFASetupModal from "../components/Dashboard/TwoFASetup.jsx";
import EditCardModal from "../components/Dashboard/EditCard.jsx";

// Memoized binary particles with better visibility
const BinaryParticles = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {useMemo(
      () =>
        [...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute text-cyan-400 font-mono text-sm opacity-70 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
              fontSize: `${10 + Math.random() * 8}px`,
            }}
          >
            {Math.random() > 0.5 ? "1" : "0"}
          </div>
        )),
      []
    )}
  </div>
));

BinaryParticles.displayName = "BinaryParticles";

// Improved background with better matrix rain effect
const BackgroundElements = memo(() => (
  <>
    {/* Full screen background */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-black to-blue-900/80"></div>

    {/* Enhanced matrix rain */}
    <div className="absolute inset-0 opacity-60 overflow-hidden">
      {/* Primary cyan rain */}
      <div
        className="absolute inset-0 bg-[linear-gradient(transparent_70%,rgba(34,211,238,0.05)_85%,rgba(34,211,238,0.1)_100%)] animate-matrix-rain"
        style={{ animationDuration: "5s" }}
      ></div>
      {/* Secondary pink rain */}
      <div
        className="absolute inset-0 bg-[linear-gradient(720deg,transparent_70%,rgba(236,72,153,0.05)_85%,rgba(236,72,153,0.1)_100%)] animate-matrix-rain-reverse"
        style={{ animationDuration: "5s" }}
      ></div>
    </div>

    {/* Grid pattern */}
    <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(34,211,238,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.3)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

    {/* Neon borders */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_3px_rgba(34,211,238,0.8)]"></div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_20px_3px_rgba(236,72,153,0.8)]"></div>
  </>
));

BackgroundElements.displayName = "BackgroundElements";

const CornerAccents = memo(() => (
  <>
    <div className="hidden md:block absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 animate-pulse"></div>
    <div className="hidden md:block absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-500 animate-pulse delay-500"></div>
    <div className="hidden md:block absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-pink-500 animate-pulse delay-1000"></div>
    <div className="hidden md:block absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 animate-pulse delay-1500"></div>
  </>
));

CornerAccents.displayName = "CornerAccents";

const DashboardHeader = memo(({ activeTab, email, onLogout }) => (
  <div className="relative pt-4 p-3 md:pt-6 md:p-6 border-b border-cyan-400/30">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div className="mb-3 sm:mb-0">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600 font-mono tracking-tight">
          VAULTIFY
        </h1>
        <p className="text-cyan-400 font-mono text-xs mt-1 tracking-wider">
          {activeTab === "passwords"
            ? "KEYS_MANAGEMENT_INTERFACE"
            : "CARD_MANAGEMENT_INTERFACE"}
        </p>
      </div>

      <div className="flex items-center gap-3 md:gap-4 self-end sm:self-auto">
        <div className="text-cyan-400 font-mono text-xs bg-black border border-cyan-400 px-3 py-1 rounded-none relative overflow-hidden group hover:border-pink-500 transition-colors duration-200">
          <span className="relative z-10 flex items-center gap-1">
            <span className="material-icons text-xs">badge</span>
            <span className="truncate max-w-[100px] md:max-w-[140px]">
              {email}
            </span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-pink-500/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <button
          onClick={onLogout}
          className="relative p-2 md:px-4 md:py-2 bg-black border border-cyan-400 text-cyan-400 font-mono text-xs hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center gap-1 md:gap-2 group hover:shadow-[0_0_15px_rgba(34,211,238,0.6)]"
          title="Terminate session"
        >
          <span className="material-icons text-base group-hover:scale-110 transition-transform">
            logout
          </span>
          <span className="hidden md:inline">TERMINATE</span>
          <span className="md:hidden">OUT</span>
        </button>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-60"></div>
  </div>
));

DashboardHeader.displayName = "DashboardHeader";

const ScanningProgress = memo(({ scanning, scanProgress, activeTab }) => {
  if (!scanning || activeTab !== "passwords") return null;

  return (
    <div className="px-3 md:px-6 mb-3 md:mb-6">
      <div className="max-w-2xl mx-auto">
        <div className="w-full h-1 md:h-2 bg-gray-800 rounded-none overflow-hidden mb-1 md:mb-2 border border-cyan-400/30">
          <div
            className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-1 md:gap-2 text-cyan-400 font-mono text-xs tracking-wider">
          <span className="material-icons text-xs md:text-sm animate-pulse">
            hourglass_empty
          </span>
          SCANNING... {scanProgress}%
        </div>
      </div>
    </div>
  );
});

ScanningProgress.displayName = "ScanningProgress";

const StatusIndicators = memo(
  ({
    isSaving,
    activeTab,
    hasError,
    error,
    isSuccessError,
    scanning,
    scanProgress,
  }) => (
    <>
      {isSaving && (
        <div className="relative flex justify-center items-center gap-2 p-2 md:p-3 bg-black/80 border-b border-cyan-400/50">
          <div className="w-2 h-2 md:w-3 md:h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-cyan-400 font-mono text-xs tracking-wider">
            AUTO_SAVING_{activeTab === "passwords" ? "VAULT" : "CARDS"}...
          </span>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-40"></div>
        </div>
      )}

      {hasError && (
        <div
          className={`relative mx-3 md:mx-6 mt-3 md:mt-4 p-3 md:p-4 border font-mono text-xs md:text-sm bg-black/80 ${
            isSuccessError
              ? "border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              : "border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          }`}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <span className="material-icons text-sm">
              {isSuccessError ? "check_circle" : "error"}
            </span>
            <span className="break-words font-mono">{error}</span>
          </div>
        </div>
      )}

      {scanning && activeTab === "passwords" && (
        <div className="px-3 md:px-6 mb-3 md:mb-6">
          <div className="max-w-2xl mx-auto">
            <div className="w-full h-1 md:h-2 bg-gray-800 rounded-none overflow-hidden mb-1 md:mb-2 border border-cyan-400/30">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-1 md:gap-2 text-cyan-400 font-mono text-xs tracking-wider">
              <span className="material-icons text-xs md:text-sm animate-pulse">
                hourglass_empty
              </span>
              SCANNING... {scanProgress}%
            </div>
          </div>
        </div>
      )}
    </>
  )
);

StatusIndicators.displayName = "StatusIndicators";

/// Main DashboardUI Component
export default function DashboardUI(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Memoized derived values
  const hasError = !!props.error;
  const isSuccessError = useMemo(() => 
    props.error?.includes("Scan complete") ||
    props.error?.includes("saved") ||
    props.error?.includes("success") ||
    props.error?.includes("Copied") ||
    props.error?.includes("PREMIUM_UNLOCKED!"),
  [props.error]);

  const currentItems = props.activeTab === "passwords" ? props.vault.items : props.cards.items;
  const itemsCount = useMemo(() => currentItems?.length || 0, [currentItems]);

  // Memoized handlers
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Optimized modals with proper keys
  const modals = useMemo(() => {
    const modalComponents = [];

    if (props.showAddForm && props.activeTab === "passwords") {
      modalComponents.push(
        <AddItemModal
          key="add-item"
          newItem={props.newItem}
          setNewItem={props.setNewItem}
          passwordStrength={props.passwordStrength}
          onAdd={props.addItem}
          onCancel={props.closeAddForm}
        />
      );
    }

    if (props.showAddCardForm && props.activeTab === "cards") {
      modalComponents.push(
        <AddCardModal
          key="add-card"
          newCard={props.newCard}
          setNewCard={props.setNewCard}
          onAdd={props.addCard}
          onCancel={props.closeAddCardForm}
          existingCards={props.cards.items}
          cardLogic={props.cardLogic}
        />
      );
    }

    if (props.editingCard && props.activeTab === "cards") {
      modalComponents.push(
        <EditCardModal
          key="edit-card"
          card={props.editingCard}
          onUpdate={props.updateCard}
          onCancel={props.cancelCardEdit}
          existingCards={props.cards.items}
          cardLogic={props.cardLogic}
        />
      );
    }

    if (props.show2FASetup) {
      modalComponents.push(
        <TwoFASetupModal
          key="2fa-setup"
          qrCode={props.qrCode}
          onVerify={props.handleVerify2FA}
          onClose={props.close2FASetup}
          loading={props.twofaLoading}
          twofaError={props.twofaError}
        />
      );
    }

    return modalComponents;
  }, [
    props.showAddForm,
    props.activeTab,
    props.newItem,
    props.passwordStrength,
    props.addItem,
    props.closeAddForm,
    props.showAddCardForm,
    props.newCard,
    props.addCard,
    props.closeAddCardForm,
    props.editingCard,
    props.updateCard,
    props.cancelCardEdit,
    props.cards.items,
    props.cardLogic,
    props.show2FASetup,
    props.qrCode,
    props.handleVerify2FA,
    props.close2FASetup,
    props.twofaLoading,
  ]);

  // Memoized sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    activeTab: props.activeTab,
    setActiveTab: props.setActiveTab,
    onScan: props.scanForBreaches,
    scanning: props.scanning,
    breachResults: props.breachResults,
    onClear: props.clearBreachResults,
    vault: props.vault,
    cards: props.cards,
    isPremium: props.isPremium,
    onUnlockPremium: props.onUnlockPremium,
    premiumLoading: props.premiumLoading,
    twofaEnabled: props.twofaEnabled,
    onEnable2FA: props.onEnable2FA,
    onDisable2FA: props.onDisable2FA,
    twofaLoading: props.twofaLoading,
    showPremiumModal: props.showPremiumModal,
    setShowPremiumModal: props.setShowPremiumModal,
    premiumError: props.premiumError,
    onDisablePremium: props.onDisablePremium,
    showDisablePremiumModal: props.showDisablePremiumModal,
    setShowDisablePremiumModal: props.setShowDisablePremiumModal,
    twofaError: props.twofaError,
    showDisable2FAModal: props.showDisable2FAModal,
    closeDisable2FAModal: props.closeDisable2FAModal,
  }), [
    props.activeTab, props.setActiveTab, props.scanForBreaches, props.scanning,
    props.breachResults, props.clearBreachResults, props.vault, props.cards,
    props.isPremium, props.onUnlockPremium, props.premiumLoading, props.twofaEnabled,
    props.onEnable2FA, props.onDisable2FA, props.twofaLoading, props.showPremiumModal,
    props.setShowPremiumModal, props.premiumError, props.onDisablePremium,
    props.showDisablePremiumModal, props.setShowDisablePremiumModal, props.twofaError,
    props.showDisable2FAModal, props.closeDisable2FAModal,
  ]);

  // Memoized status indicator props
  const statusIndicatorProps = useMemo(() => ({
    isSaving: props.isSaving,
    activeTab: props.activeTab,
    hasError,
    error: props.error,
    isSuccessError,
    scanning: props.scanning,
    scanProgress: props.scanProgress,
  }), [props.isSaving, props.activeTab, hasError, props.error, isSuccessError, props.scanning, props.scanProgress]);

  return (
    <div className="min-h-screen bg-gray-900/50 relative overflow-hidden">
      <BackgroundElements />
      <BinaryParticles />

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={handleSidebarToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-black/80 border border-cyan-400 text-cyan-400 rounded-r-md w-6 h-12 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.6)] hover:bg-cyan-400 hover:text-black transition-all duration-200 md:hidden group"
        title={sidebarOpen ? "CLOSE_SIDEBAR" : "OPEN_SIDEBAR"}
      >
        <span className="material-icons text-base group-hover:scale-110 transition-transform">
          {sidebarOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>

      {/* Sidebar */}
      <div className={sidebarOpen ? "block" : "hidden md:block"}>
        <Sidebar {...sidebarProps} />
      </div>

      {/* Main Content - rest remains exactly the same */}
      <div className="relative z-10 min-h-screen ml-0 md:ml-40 mr-0 md:mr-40">
        <DashboardHeader
          activeTab={props.activeTab}
          email={props.email}
          onLogout={props.onLogout}
        />

        <StatusIndicators {...statusIndicatorProps} />

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 md:gap-4 p-3 md:p-6">
          <button
            onClick={props.activeTab === "passwords" ? props.openAddForm : props.openAddCardForm}
            className="relative p-3 md:px-6 md:py-3 bg-black/80 border border-cyan-400 text-cyan-400 font-mono text-sm hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center justify-center gap-1 md:gap-2 group hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          >
            <span className="material-icons text-base md:text-lg group-hover:scale-110 transition-transform">add</span>
            <span>{props.activeTab === "passwords" ? "CREATE_PASSWORD" : "ADD_CARD"}</span>
          </button>
        </div>

        {modals}

        {/* Search Bar */}
        <div className="px-3 md:px-6 mb-3 md:mb-6">
          <SearchBar
            searchTerm={props.searchTerm}
            setSearchTerm={props.setSearchTerm}
            mode={props.activeTab}
            placeholder={
              props.activeTab === "passwords"
                ? "SEARCH_PASSWORDS: TITLE, USERNAME, URL, NOTES..."
                : "SEARCH_CARDS: TITLE, CARDHOLDER, NUMBER, NOTES..."
            }
          />
        </div>

        {/* Content */}
        <div className="px-3 md:px-6 pb-4 md:pb-6">
          {props.activeTab === "passwords" ? (
            <VaultItemsList
              vault={props.vault}
              searchTerm={props.searchTerm}
              visiblePasswords={props.visiblePasswords}
              breachResults={props.breachResults}
              onRemoveItem={props.removeItem}
              onTogglePasswordVisibility={props.togglePasswordVisibility}
              onCopyToClipboard={props.copyToClipboard}
              onEditItem={props.editItem}
              onUpdateItem={props.updateItem}
              onCancelEdit={props.cancelEdit}
              editingItem={props.editingItem}
            />
          ) : (
            <CardsList
              cards={props.cards}
              searchTerm={props.searchTerm}
              visibleCardDetails={props.visibleCardDetails}
              onRemoveCard={props.removeCard}
              toggleCardDetailsVisibility={props.toggleCardDetailsVisibility}
              onCopyToClipboard={props.copyToClipboard}
              onEditCard={props.editCard}
              onUpdateCard={props.updateCard}
              onCancelCardEdit={props.cancelCardEdit}
              editingCard={props.editingCard}
            />
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-1 md:bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 border border-cyan-400/30 px-2 py-1 md:px-4 md:py-2 max-w-[95vw] md:max-w-[90vw] shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <div className="flex items-center gap-2 md:gap-6 text-cyan-400 font-mono text-[9px] md:text-xs tracking-wider">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 shadow-[0_0_6px_rgba(34,211,238,0.6)] animate-pulse" />
              <span className="hidden sm:inline">{props.activeTab === "passwords" ? "PASSWORDS" : "CARDS"}:</span>
              <span className="font-bold">{itemsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] animate-pulse" />
              <span className="hidden sm:inline">ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      <CornerAccents />
    </div>
  );
}