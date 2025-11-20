// components/Dashboard/DisablePremiumModal.jsx
import { useState } from "react";

export default function DisablePremiumModal({
  onVerify,
  onClose,
  loading = false,
  error = "",
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onVerify(password);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-55 p-4">
      <div className="bg-gray-900 border border-red-400 p-6 max-w-md w-full relative">
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute -top-3 -right-3 bg-black border border-red-400 text-red-400 w-8 h-8 items-center justify-center hover:bg-red-400 hover:text-black transition-colors"
          title="Close"
          disabled={loading}
        >
          <span className="material-icons text-lg">close</span>
        </button>

        <h2 className="text-red-400 font-mono text-xl mb-4 text-center border-b border-red-400/30 pb-2">
          DISABLE PREMIUM ACCESS
        </h2>

        <div className="space-y-4">
          {/* Warning */}
          <div className="text-center">
            <p className="text-white mb-3 font-mono text-sm flex items-center justify-center gap-2">
              <span className="material-icons text-red-400">warning</span>
              This action will remove all premium features
            </p>
            <div className="bg-black border border-red-400/30 p-3 text-red-300 text-xs font-mono space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">block</span>
                <span>Breach scanning disabled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">lock</span>
                <span>Advanced features locked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-sm">support</span>
                <span>Priority support removed</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 text-sm font-mono flex items-center gap-2">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-red-400 text-sm mb-2 font-mono flex items-center gap-2">
                <span className="material-icons">vpn_key</span>
                ENTER PASSWORD TO CONFIRM:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full bg-black border border-red-400 text-white p-3 font-mono focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-500 pr-12"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors"
                  disabled={loading}
                >
                  <span className="material-icons text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex-1 bg-red-600 text-white p-3 font-mono hover:bg-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin">refresh</span>
                    VERIFYING...
                  </>
                ) : (
                  <>
                    <span className="material-icons">block</span>
                    DISABLE PREMIUM
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
            <span className="material-icons text-red-400 text-sm">
              security
            </span>
            <div>
              <p className="text-red-300">
                This action requires password verification for security.
              </p>
              <p className="mt-1">
                You can re-enable premium anytime with your premium key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
