
export default function ScanButton({
  onScan,
  scanning,
  breachResults,
  onClear,
  vault,
}) {
  const breachedCount = Object.values(breachResults).filter(
    (r) => r.isBreached
  ).length;
  const encryptedCount = Object.values(breachResults).filter(
    (r) => r.encrypted
  ).length;
  const hasBreaches = breachedCount > 0;
  const hasEncrypted = encryptedCount > 0;
  const hasItems = vault.items && vault.items.length > 0;

  // Button configuration based on state
  const getButtonConfig = () => {
    if (scanning) {
      return {
        text: "SCANNING_IN_PROGRESS",
        icon: "hourglass_empty",
        bgColor: "bg-gray-900 border-gray-700",
        textColor: "text-gray-500",
        disabled: true,
      };
    }
    if (hasBreaches) {
      return {
        text: `SECURITY_BREACHES: ${breachedCount}`,
        icon: "security",
        bgColor: "bg-black border-red-500 hover:bg-red-500",
        textColor: "text-red-400 hover:text-black",
        disabled: false,
      };
    }
    if (hasEncrypted) {
      return {
        text: `ENCRYPTED_ENTRIES: ${encryptedCount}`,
        icon: "lock",
        bgColor: "bg-black border-cyan-400 hover:bg-cyan-400",
        textColor: "text-cyan-400 hover:text-black",
        disabled: false,
      };
    }
    return {
      text: "INITIATE_SECURITY_SCAN",
      icon: "search",
      bgColor: "bg-black/40 border-cyan-400 hover:bg-cyan-400",
      textColor: "text-cyan-400 hover:text-black",
      disabled: !hasItems,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="flex items-center gap-3">
      {/* Main Scan Button */}
      <button
        onClick={onScan}
        disabled={buttonConfig.disabled}
        className={`px-6 py-3 border font-mono text-sm transition-all duration-200 flex items-center gap-2 group relative overflow-hidden ${
          buttonConfig.bgColor
        } ${buttonConfig.textColor} ${
          buttonConfig.disabled
            ? "cursor-not-allowed"
            : "hover:scale-[1.02] focus:scale-[1.02]"
        }`}
        title={
          !hasItems
            ? "NO_ENTRIES_FOR_ANALYSIS"
            : "SCAN_ALL_ENCRYPTION_KEYS_FOR_BREACHES"
        }
      >
        <span className="material-icons text-lg group-hover:scale-110 transition-transform">
          {buttonConfig.icon}
        </span>
        <span className="relative z-10">{buttonConfig.text}</span>

        {/* Button hover effect */}
        {!buttonConfig.disabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-pink-600/0 to-cyan-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300"></div>
        )}

        {/* Scanning animation */}
        {scanning && (
          <div className="absolute -right-2 -top-2 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {/* Clear Results Button */}
      {(hasBreaches || hasEncrypted) && (
        <button
          onClick={onClear}
          className="px-4 py-3 bg-black border border-pink-600 text-pink-400 font-mono text-sm hover:bg-pink-600 hover:text-black transition-all duration-200 flex items-center gap-2 group"
          title="CLEAR_SECURITY_ANALYSIS"
        >
          <span className="material-icons text-base group-hover:scale-110 transition-transform">
            clear
          </span>
          CLEAR_ANALYSIS
        </button>
      )}

      {/* Status Indicators */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {hasItems && !scanning && (
          <div className="text-cyan-400 flex items-center gap-1">
            <span className="material-icons text-xs">folder</span>
            READY: {vault.items?.length || 0}
          </div>
        )}

        {hasBreaches && (
          <div className="text-red-400 flex items-center gap-1">
            <span className="material-icons text-xs">warning</span>
            BREACHED: {breachedCount}
          </div>
        )}
      </div>
    </div>
  );
}
