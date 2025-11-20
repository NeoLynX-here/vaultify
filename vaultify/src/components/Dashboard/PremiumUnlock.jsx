import { useState } from "react";

export default function PremiumUnlockModal({
  onVerify,
  onClose,
  loading = false,
  error = "",
}) {
  const [premiumKey, setPremiumKey] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (premiumKey.trim()) {
      onVerify(premiumKey);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-400 p-6 max-w-md w-full relative">
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute -top-3 -right-3 bg-black border border-cyan-400 text-cyan-400 w-8 h-8 items-center justify-center hover:bg-cyan-400 hover:text-black transition-colors"
          title="Close"
          disabled={loading}
        >
          <span className="material-icons text-lg">close</span>
        </button>

        <h2 className="text-cyan-400 font-mono text-xl mb-4 text-center border-b border-cyan-400/30 pb-2">
          UNLOCK PREMIUM ACCESS
        </h2>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-white mb-3 font-mono text-sm flex items-center justify-center gap-2">
              <span className="material-icons text-cyan-400">key</span>
              Enter your premium access key to unlock all features
            </p>
            <div className="bg-black border border-cyan-400/30 p-3 text-cyan-300 text-xs font-mono space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">star</span>
                <span>Unlimited access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">bolt</span>
                <span>Advanced features</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">support_agent</span>
                <span>Priority support</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 text-sm font-mono flex items-center gap-2">
              <span className="material-icons">warning</span>
              {error}
            </div>
          )}

          {/* Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cyan-400 text-sm mb-2 font-mono flex items-center gap-2">
                <span className="material-icons">vpn_key</span>
                PREMIUM ACCESS KEY:
              </label>
              <input
                type="text"
                value={premiumKey}
                onChange={(e) => setPremiumKey(e.target.value)}
                placeholder="Enter your premium key..."
                className="w-full bg-black border border-cyan-400 text-white p-3 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-gray-500"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !premiumKey.trim()}
                className="flex-1 bg-cyan-400 text-black p-3 font-mono hover:bg-cyan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin">refresh</span>
                    VERIFYING...
                  </>
                ) : (
                  <>
                    <span className="material-icons">lock_open</span>
                    UNLOCK PREMIUM
                  </>
                )}
              </button>
              {/* Mobile Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-800 text-white p-3 font-mono border border-gray-600 hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 md:hidden"
              >
                <span className="material-icons">close</span>
                ABORT
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-xs text-gray-400 font-mono border-t border-gray-600 pt-3 flex items-start gap-2">
            <span className="material-icons text-cyan-400 text-sm">help</span>
            <div>
              <p>Don't have a key? Contact support to get premium access.</p>
              <p className="mt-1 text-cyan-300 flex items-center gap-1">
                <span className="material-icons text-sm">security</span>
                Your key is securely verified with our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
