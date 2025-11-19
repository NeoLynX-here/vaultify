import { useState } from "react";

export default function Disable2FAModal({
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

  const canSubmit = !loading && password.trim();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-100">
      <div className="bg-black/70 border border-red-500/50 p-6 max-w-md w-full relative group shadow-[0_0_40px_rgba(239,68,68,0.3)]">
        {/* Cyber Corner Accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-red-500"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-red-500"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-cyan-400"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-cyan-400"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-black border border-red-500 text-red-400 w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-black transition-all duration-200 group"
          title="CLOSE_MODAL"
          disabled={loading}
        >
          <span className="material-icons text-lg group-hover:scale-110 transition-transform">
            close
          </span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-red-400 font-mono text-xl md:text-2xl mb-2 tracking-wider flex items-center justify-center gap-2">
            <span className="material-icons text-red-400">security</span>
            DISABLE_2FA_PROTOCOL
          </h2>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-red-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
        </div>

        <div className="space-y-6">
          {/* Warning Section */}
          <div className="text-center">
            <p className="text-cyan-300 mb-4 font-mono text-sm tracking-wider">
              CONFIRM_SECURITY_DOWNGRADE
            </p>
            <div className="bg-black/80 border border-red-500/30 p-4 text-red-300 text-sm font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-icons text-red-400 text-base">
                  warning
                </span>
                <span>2FA_PROTECTION_REMOVED</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-red-400 text-base">
                  lock_open
                </span>
                <span>SINGLE_FACTOR_AUTHENTICATION_ONLY</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-red-400 text-base">
                  shield
                </span>
                <span>REDUCED_SECURITY_LEVEL</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 text-sm font-mono animate-pulse flex items-center gap-2">
              <span className="material-icons text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cyan-400 text-sm mb-3 font-mono tracking-wider uppercase">
                ENTER_PASSWORD_TO_CONFIRM
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER_SECURITY_PASSWORD"
                  className="w-full bg-black border border-cyan-500/60 text-white p-3 font-mono focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200 placeholder-cyan-400/40 pr-12"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-red-400 transition-colors duration-200"
                  disabled={loading}
                  title={showPassword ? "HIDE_PASSWORD" : "SHOW_PASSWORD"}
                >
                  <span className="material-icons text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex-1 py-3 font-mono border transition-all duration-200 relative overflow-hidden group ${
                  canSubmit
                    ? "bg-black border-red-500 text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-cyan-400/10 hover:border-cyan-400 hover:text-cyan-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                    : "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="material-icons text-base">
                    {loading ? "hourglass_empty" : "security"}
                  </span>
                  {loading ? "VERIFYING_ACCESS..." : "DISABLE_2FA"}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-black border border-cyan-400 text-cyan-400 py-3 font-mono hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-icons text-base">cancel</span>
                ABORT
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="border-t border-cyan-400/30 pt-4">
            <div className="text-xs text-cyan-300 font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-icons text-cyan-400 text-sm">
                  verified_user
                </span>
                <span>PASSWORD_VERIFICATION_REQUIRED_FOR_SECURITY</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400/60">
                <span className="material-icons text-sm">settings</span>
                <span>2FA_CAN_BE_REACTIVATED_FROM_SECURITY_SETTINGS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan line effect */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse opacity-60"></div>
      </div>
    </div>
  );
}
