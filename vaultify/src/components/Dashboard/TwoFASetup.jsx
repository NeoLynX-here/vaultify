import { useState } from "react";

export default function TwoFASetupModal({
  qrCode,
  onVerify,
  onClose,
  loading = false,
}) {
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      onVerify(verificationCode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-400 p-6 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-black border border-cyan-400 text-cyan-400 w-8 h-8 flex items-center justify-center hover:bg-cyan-400 hover:text-black transition-colors"
          title="Close"
        >
          <span className="material-icons text-lg">close</span>
        </button>

        <h2 className="text-cyan-400 font-mono text-xl mb-4 text-center border-b border-cyan-400/30 pb-2">
          SETUP TWO-FACTOR AUTH
        </h2>

        <div className="space-y-4">
          {/* Step 1: Scan QR Code */}
          <div className="text-center">
            <p className="text-white mb-3 font-mono text-sm">
              📱 Step 1: Scan QR code with your authenticator app
            </p>
            {qrCode && (
              <img
                src={qrCode}
                alt="2FA QR Code"
                className="mx-auto border-2 border-cyan-400 p-2 max-w-[200px]"
              />
            )}
            <p className="text-cyan-300 text-xs mt-2 font-mono">
              (Google Authenticator, Authy, Microsoft Authenticator, etc.)
            </p>
          </div>

          {/* Step 2: Enter Code */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-cyan-400 text-sm mb-2 font-mono">
                Step 2: Enter 6-digit verification code:
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="xxxxxx"
                className="w-full bg-black border border-cyan-400 text-white p-3 font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-cyan-400 text-black p-3 font-mono hover:bg-cyan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
              >
                {loading ? "VERIFYING..." : "VERIFY & ENABLE"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-800 text-white p-3 font-mono border border-gray-600 hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-xs text-gray-400 font-mono border-t border-gray-600 pt-3">
            <p>
              💡 After scanning, enter the 6-digit code from your authenticator
              app to complete setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
