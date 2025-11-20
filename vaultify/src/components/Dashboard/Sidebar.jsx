import {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import PasswordGenerator from "./PasswordGenerator.jsx";
import PremiumUnlockModal from "./PremiumUnlock.jsx";
import DisablePremiumModal from "./DisablePremium.jsx";
import Disable2FAModal from "./Disable2FA.jsx";
import TwoFASetupModal from "./TwoFASetup.jsx";

// Memoized Statistics Component
const StatisticsDisplay = memo(({ stats, activeTab }) => (
  <div className="p-2 bg-black/60 border border-cyan-400/30 rounded-none">
    <div className="text-cyan-400 font-mono text-xs mb-1 text-center border-b border-cyan-400/20 pb-1">
      STATS
    </div>
    <div className="space-y-1 text-cyan-400/80 font-mono text-[10px]">
      <div className="flex justify-between items-center">
        <span>Passwords:</span>
        <span
          className={`text-cyan-400 ${
            activeTab === "passwords" ? "animate-pulse" : ""
          }`}
        >
          {stats.totalPasswords}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span>Cards:</span>
        <span
          className={`text-cyan-400 ${
            activeTab === "cards" ? "animate-pulse" : ""
          }`}
        >
          {stats.totalCards}
        </span>
      </div>
      {activeTab === "passwords" && stats.breachedCount > 0 && (
        <div className="flex justify-between items-center">
          <span>Breached:</span>
          <span className="text-red-400 animate-pulse">
            {stats.breachedCount}
          </span>
        </div>
      )}
    </div>
  </div>
));

StatisticsDisplay.displayName = "StatisticsDisplay";

// Memoized Tab Switcher Component
const TabSwitcher = memo(({ activeTab, setActiveTab }) => (
  <div className="flex flex-col gap-2 p-2 bg-black/60 border border-cyan-400/30 rounded-none">
    {[
      { key: "passwords", label: "PASSWORDS", icon: "lock" },
      { key: "cards", label: "CARDS", icon: "credit_card" },
    ].map((tab) => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`p-2 font-mono text-xs border transition-all duration-200 flex items-center justify-center gap-1 ${
          activeTab === tab.key
            ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
            : "bg-transparent text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10"
        }`}
        title={tab.key === "passwords" ? "Password Vault" : "Card Manager"}
      >
        <span className="material-icons text-sm">{tab.icon}</span>
        {tab.label}
      </button>
    ))}
  </div>
));

TabSwitcher.displayName = "TabSwitcher";

// Memoized Status Indicator Component
const StatusIndicator = memo(({ isPremium }) => (
  <div className="flex items-center justify-center gap-2 p-2 bg-black/60 border border-cyan-400/30 rounded-none mt-2">
    <div
      className={`w-2 h-2 ${
        isPremium ? "bg-yellow-400" : "bg-green-500"
      } rounded-full animate-pulse`}
    />
    <span className="text-cyan-400 font-mono text-[10px]">
      {isPremium ? "PREMIUM" : "ONLINE"}
    </span>
  </div>
));

StatusIndicator.displayName = "StatusIndicator";

// Memoized Account Security Component
const AccountSecurity = memo(
  ({
    twofaEnabled,
    twofaLoading,
    onEnable2FA,
    onDisable2FA,
    premiumLoading,
    setShowDisablePremiumModal,
  }) => (
    <div className="mt-4 border-t border-cyan-400/20 pt-4">
      <h3 className="text-cyan-400 font-mono text-[10px] mb-2 text-center leading-tight">
        ACCOUNT_SECURITY
      </h3>
      <div className="flex flex-col gap-2">
        {twofaEnabled ? (
          <>
            <p className="text-green-400 font-mono text-[10px] text-center leading-tight">
              2FA <span className="text-green-300">ENABLED</span>
            </p>
            <button
              onClick={ ()=> onDisable2FA() }
              disabled={twofaLoading}
              className="text-[10px] font-mono border border-pink-500 text-pink-400 hover:bg-pink-600/20 py-1 px-1 transition-all disabled:opacity-50 text-center"
            >
              {twofaLoading ? "DISABLING..." : "CLEAR_2FA"}
            </button>
          </>
        ) : (
          <>
            <p className="text-yellow-400 font-mono text-[10px] text-center leading-tight">
              2FA <span className="text-yellow-300">DISABLED</span>
            </p>
            <button
              onClick={onEnable2FA}
              disabled={twofaLoading}
              className="text-[10px] font-mono border border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 py-1 px-1 transition-all disabled:opacity-50 text-center"
            >
              {twofaLoading ? "ENABLING..." : "ENABLE_2FA"}
            </button>
          </>
        )}
        <button
          onClick={() => setShowDisablePremiumModal(true)}
          disabled={premiumLoading}
          className="text-[10px] font-mono border border-red-500 text-red-400 hover:bg-red-600/20 py-1 px-1 transition-all disabled:opacity-50 text-center mt-2"
        >
          {premiumLoading ? "DISABLING..." : "DISABLE_PREMIUM"}
        </button>
      </div>
    </div>
  )
);

AccountSecurity.displayName = "AccountSecurity";

// Main Sidebar Component
export default function Sidebar({
  activeTab,
  setActiveTab,
  onScan,
  scanning,
  breachResults,
  onClear,
  vault,
  cards,
  isPremium,
  onUnlockPremium,
  onDisablePremium,
  premiumLoading,
  twofaEnabled,
  onEnable2FA,
  onDisable2FA,
  twofaLoading,
  twofaError,
  showPremiumModal,
  setShowPremiumModal,
  showDisablePremiumModal,
  setShowDisablePremiumModal,
  premiumError,
  showDisable2FAModal,
  closeDisable2FAModal,
  show2FASetup,
  qrCode,
  handleVerify2FA,
  close2FASetup,
  secretKey,
}) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const closeBtnRef = useRef(null);

  // Memoized statistics calculation
  const stats = useMemo(() => {
    const breachedCount = breachResults
      ? Object.values(breachResults).filter((r) => r.isBreached).length
      : 0;
    const totalPasswords = vault?.items?.length || 0;
    const totalCards = cards?.items?.length || 0;

    return { breachedCount, totalPasswords, totalCards };
  }, [breachResults, vault?.items, cards?.items]);

  // Memoized handlers
  const handlePasswordGenerated = useCallback((password) => {
    navigator.clipboard.writeText(password);
    setCopyFeedback("Copied!");
    const timer1 = setTimeout(() => setCopyFeedback(""), 1000);
    const timer2 = setTimeout(() => setShowGenerator(false), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleUnlockPremium = useCallback(() => {
    setShowPremiumModal(true);
  }, [setShowPremiumModal]);

  const handlePremiumVerify = useCallback(
    (premiumKey) => {
      onUnlockPremium(premiumKey);
    },
    [onUnlockPremium]
  );

  const handleDisablePremiumVerify = useCallback(
    (password) => {
      onDisablePremium(password);
    },
    [onDisablePremium]
  );

  const handleDisable2FAVerify = useCallback(
    (password) => {
      onDisable2FA(password);
    },
    [onDisable2FA]
  );

  // Keyboard and modal management
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (showGenerator) setShowGenerator(false);
        if (showPremiumModal) setShowPremiumModal(false);
        if (showDisablePremiumModal) setShowDisablePremiumModal(false);
        if (showDisable2FAModal) closeDisable2FAModal();
      }
    };

    const shouldLockScroll =
      showGenerator ||
      showPremiumModal ||
      showDisablePremiumModal ||
      showDisable2FAModal;

    if (shouldLockScroll) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);

      // Focus management
      setTimeout(() => closeBtnRef.current?.focus(), 50);

      return () => {
        window.removeEventListener("keydown", handleKey);
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [
    showGenerator,
    showPremiumModal,
    showDisablePremiumModal,
    showDisable2FAModal,
    setShowPremiumModal,
    setShowDisablePremiumModal,
    closeDisable2FAModal,
  ]);

  return (
    <>
      {/* Sidebar - Fixed width */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-black/40 border backdrop-blur-sm border-cyan-400/50 rounded-none p-4 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-30 w-38">
        <div className="flex flex-col gap-4">
          <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

          <StatisticsDisplay stats={stats} activeTab={activeTab} />

          {/* Password Generator Icon */}
          <button
            onClick={() => setShowGenerator(true)}
            className="p-3 bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200 flex flex-col items-center gap-2 group relative"
            title="QUANTUM_KEY_GENERATOR"
          >
            <span className="material-icons text-2xl group-hover:scale-110 transition-transform">
              key
            </span>
            <span className="font-mono text-xs">GENERATOR</span>
            {showGenerator && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
          </button>

          {/* Premium Unlock Button */}
          {!isPremium && (
            <button
              onClick={handleUnlockPremium}
              disabled={premiumLoading}
              className="p-3 bg-black border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200 flex flex-col items-center gap-2 group"
              title="Unlock premium features"
            >
              <span className="material-icons text-2xl group-hover:scale-110 transition-transform">
                star_border
              </span>
              <span className="font-mono text-xs">
                {premiumLoading ? "VERIFYING..." : "GET_PREMIUM"}
              </span>
            </button>
          )}

          {/* Security Scan Button */}
          {activeTab === "passwords" && (
            <button
              onClick={onScan}
              disabled={scanning || !isPremium}
              className={`p-3 border transition-all duration-200 flex flex-col items-center gap-2 group relative ${
                isPremium
                  ? "bg-black border-pink-600 text-pink-400 hover:bg-pink-600 hover:text-black"
                  : "bg-black border-gray-700 text-gray-500 cursor-not-allowed opacity-50"
              }`}
              title={
                isPremium
                  ? "SCAN_FOR_BREACHES"
                  : "Upgrade to Premium to use breach scan"
              }
            >
              <span className="material-icons text-2xl group-hover:scale-110 transition-transform">
                {scanning ? "hourglass_empty" : "security"}
              </span>
              <span className="font-mono text-xs">
                {scanning
                  ? "SCANNING..."
                  : isPremium
                  ? "BREACH_SCAN"
                  : "LOCKED"}
              </span>
              {isPremium &&
                breachResults &&
                Object.keys(breachResults).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
            </button>
          )}

          {/* Clear Scan Results */}
          {activeTab === "passwords" &&
            breachResults &&
            Object.keys(breachResults).length > 0 && (
              <button
                onClick={onClear}
                className="p-2 bg-black border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all duration-200 flex flex-col items-center gap-1 group"
                title="CLEAR_SCAN_RESULTS"
              >
                <span className="material-icons text-xl group-hover:scale-110 transition-transform">
                  clear
                </span>
                <span className="font-mono text-[10px]">CLEAR_SCAN</span>
              </button>
            )}

          {/* Account Security Section */}
          {isPremium && (
            <AccountSecurity
              twofaEnabled={twofaEnabled}
              twofaLoading={twofaLoading}
              onEnable2FA={onEnable2FA}
              onDisable2FA={onDisable2FA}
              premiumLoading={premiumLoading}
              setShowDisablePremiumModal={setShowDisablePremiumModal}
            />
          )}

          <StatusIndicator isPremium={isPremium} />
        </div>
      </div>

      {/* Modals */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex justify-center items-center z-50">
          <div className="relative max-w-md w-full mx-4 animate-fadeIn">
            {copyFeedback && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white font-mono text-xs px-3 py-2 border border-green-400 animate-pulse z-50 rounded-none">
                {copyFeedback}
              </div>
            )}
            <PasswordGenerator
              mode="sidebar"
              onPasswordGenerated={handlePasswordGenerated}
            />
            <button
              ref={closeBtnRef}
              onClick={() => setShowGenerator(false)}
              className="absolute -top-4 -right-4 text-pink-300 hover:text-red-500 transition-colors duration-200 bg-black border border-cyan-400 rounded-full w-8 h-8 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.6)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
              title="CLOSE_GENERATOR"
              aria-label="Close generator"
            >
              <span className="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {showPremiumModal && (
        <PremiumUnlockModal
          onVerify={handlePremiumVerify}
          onClose={() => setShowPremiumModal(false)}
          loading={premiumLoading}
          error={premiumError}
        />
      )}

      {showDisablePremiumModal && (
        <DisablePremiumModal
          onVerify={handleDisablePremiumVerify}
          onClose={() => setShowDisablePremiumModal(false)}
          loading={premiumLoading}
          error={premiumError}
        />
      )}

      {showDisable2FAModal && (
        <Disable2FAModal
          onVerify={handleDisable2FAVerify}
          onClose={closeDisable2FAModal}
          loading={twofaLoading}
          error={twofaError}
        />
      )}

      {show2FASetup && (
        <TwoFASetupModal
          qrCode={qrCode}
          onVerify={handleVerify2FA}
          onClose={close2FASetup}
          loading={twofaLoading}
          twofaError={twofaError}
        />
      )}
    </>
  );
}
