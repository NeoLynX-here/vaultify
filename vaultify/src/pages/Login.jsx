// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deriveAuthProof,
  deriveAesKey,
  decryptVaultFields,
  isEncryptedFieldShape,
  exportCryptoKeyToBase64,
} from "../crypto/crypto";
import TwoFAModal from "../components/TwoFA";
import { API_BASE } from "../util/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFAData, setTwoFAData] = useState({ ticket: null, email: "" });
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // STEP 1: Get user's salt from server
      const saltRes = await fetch(
        `${API_BASE}/getSalt?email=${encodeURIComponent(email)}`
      );
      if (!saltRes.ok) throw new Error("Email not found or server error");
      const { salt } = await saltRes.json();

      // STEP 2: Derive authentication proof (PBKDF2)
      const authProof = await deriveAuthProof(password, salt, "auth");

      // STEP 3: Verify credentials
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, auth_proof: authProof }),
      });

      if (!loginRes.ok) {
        const body = await loginRes.json().catch(() => ({}));
        throw new Error(body.message || "Invalid credentials");
      }

      const loginJson = await loginRes.json();
      console.log("Login response status:", loginRes.status);

      // CASE A: Server returned final token => 2FA not required
      if (loginJson.token) {
        await handleSuccessfulLogin(
          loginJson.token,
          loginJson.is_premium,
          password,
          salt
        );
        return;
      }

      // CASE B: Server says 2FA is required
      if (loginJson.twofa_required && loginJson.ticket) {
        console.log("2FA REQUIRED - Showing modal");
        console.log("Ticket:", loginJson.ticket);
    
        const vaultKey = await deriveAesKey(
          password,
          salt,
          "vault",
          250000,
          true
        );
     
        const vaultKeyBase64 = await exportCryptoKeyToBase64(vaultKey);
       
        sessionStorage.setItem("vault_key_base64", vaultKeyBase64);
        
        setTwoFAData({
          ticket: loginJson.ticket,
          email: email,
        });
        setShowTwoFAModal(true);
        return;
      }

      throw new Error("Unexpected login response from server");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuccessfulLogin(token, isPremium, password, salt) {
    const is_premium = isPremium || false;

    // STEP 4: Derive vault key for decryption
    const vaultKey = await deriveAesKey(password, salt, "vault");

    // STEP 5: Fetch vault data
    const vaultRes = await fetch(`${API_BASE}/vault`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let vaultData = { items: [] };
    if (vaultRes.ok) {
      const data = await vaultRes.json();
      vaultData = data.encrypted_blob || { items: [] };
    } else if (vaultRes.status === 404) {
      console.log("No vault found - starting fresh");
    } else {
      throw new Error("Failed to load vault");
    }

    // STEP 6: Fetch cards data
    const cardsRes = await fetch(`${API_BASE}/cards`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let cardsData = { items: [] };
    if (cardsRes.ok) {
      const data = await cardsRes.json();
      cardsData = data.encrypted_blob || { items: [] };
    } else if (cardsRes.status === 404) {
      console.log("No cards found - starting fresh");
    } else {
      throw new Error("Failed to load cards");
    }

    // STEP 7: Check if vault needs decryption
    let decryptedVault = vaultData;
    const vaultNeedsDecryption = vaultData.items?.some(
      (item) =>
        isEncryptedFieldShape(item.notes) ||
        isEncryptedFieldShape(item.link) ||
        isEncryptedFieldShape(item.username) ||
        isEncryptedFieldShape(item.password)
    );

    if (vaultNeedsDecryption) {
      console.log("🔓 Decrypting vault...");
      decryptedVault = await decryptVaultFields(vaultData, vaultKey);
    }

    // STEP 8: Check if cards need decryption
    let decryptedCards = cardsData;
    const cardsNeedDecryption = cardsData.items?.some(
      (card) =>
        isEncryptedFieldShape(card.title) ||
        isEncryptedFieldShape(card.cardholderName) ||
        isEncryptedFieldShape(card.cardNumber) ||
        isEncryptedFieldShape(card.expiryDate) ||
        isEncryptedFieldShape(card.cvv) ||
        isEncryptedFieldShape(card.notes)
    );

    if (cardsNeedDecryption) {
      console.log("🔓 Decrypting cards...");
      decryptedCards = await decryptVaultFields(cardsData, vaultKey);
    }

    // STEP 9: Prepare final data structure
    const finalData = {
      vault: {
        items: decryptedVault.items || [],
      },
      cards: {
        items: decryptedCards.items || [],
      },
    };

    // STEP 10: Export AES key for session-based restoration
    try {
      // Make key extractable just for this export operation
      const exportableVaultKey = await deriveAesKey(
        password,
        salt,
        "vault",
        250000,
        true
      );
      const vaultKeyBase64 = await exportCryptoKeyToBase64(exportableVaultKey);
      sessionStorage.setItem("vault_key_base64", vaultKeyBase64);
      console.log("AES key stored in sessionStorage");
    } catch (err) {
      console.error("Failed to export AES key:", err);
    }

    navigate("/dashboard", {
      state: {
        vault: finalData.vault,
        cards: finalData.cards,
        token,
        isPremium: is_premium,
        email
      },
    });
    console.log("2FA not required, proceeding to dashboard");
  }

  function handle2FASuccess(data) {
    navigate("/dashboard", {
      state: data,
      replace: true,
    });
  }

  function handle2FAClose() {
    setShowTwoFAModal(false);
    setLoading(false);
  }
  const isFormValid = email.trim() && password.trim();

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Full screen background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900"></div>

      {/* Matrix rain animation background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(34,211,238,0.1)_100%)] animate-matrix-rain"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,rgba(236,72,153,0.1)_100%)] animate-matrix-rain-reverse opacity-60"></div>
      </div>

      {/* Full width grid pattern */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(34,211,238,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.4)_1px,transparent_1px)] bg-[size:80px_80px]"></div>

      {/* Full width neon borders */}
      <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400 shadow-[0_0_20px_5px_rgba(34,211,238,0.8)]"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-pink-500 shadow-[0_0_20px_5px_rgba(236,72,153,0.8)]"></div>

      {/* Multiple full width scan lines */}
      <div className="absolute top-20 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
      <div className="absolute bottom-20 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse delay-1000"></div>

      {/* Floating binary code particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-cyan-400 font-mono text-xs opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            {Math.random() > 0.5 ? "1" : "0"}
          </div>
        ))}
      </div>

      {/* Main content - full width layout */}
      <div className="relative z-10 min-h-screen flex">
        {/* Center login section */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 min-w-0">
          {/* Header with glitch effect */}
          <div className="text-center mb-12 w-full relative">
            <h1 className="text-6xl md:text-8xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600 font-mono tracking-tight">
              VAULTIFY
            </h1>
            <div className="h-1 w-80 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 shadow-[0_0_20px_3px_rgba(34,211,238,0.8)] mb-6"></div>
            <p className="text-cyan-400 text-2xl tracking-widest font-mono">
              SECURE_ACCESS
            </p>
          </div>

          {/* Login form - sharp edges */}
          <div className="w-full max-w-lg">
            <div className="bg-black/90 border border-cyan-400/50 rounded-none p-8 shadow-[0_0_30px_rgba(34,211,238,0.3)] relative group hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all duration-300">
              {/* Sharp corner accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>

              {/* Animated border glow */}
              <div className="absolute inset-0 border border-transparent bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                <div className="group">
                  <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
                    DIGITAL_IDENTITY
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-cyan-400 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="user@neon.net"
                    disabled={loading}
                  />
                </div>

                <div className="group">
                  <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
                    ENCRYPTION_KEY
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-4 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-cyan-400 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(34,211,238,0.4)] pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="XXXXXXXX"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-pink-400 transition-colors duration-200 disabled:opacity-50"
                      disabled={loading}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-icons text-lg">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`w-64 py-4 font-bold text-lg font-mono transition-all duration-200 border relative overflow-hidden group ${
                      loading || !isFormValid
                        ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-black border-cyan-400 focus:scale-[1.01] hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
                    }`}
                  >
                    <span className="relative z-10">
                      {loading
                        ? "LOADING_DATA..."
                        : !isFormValid
                        ? "ENTER_CREDENTIALS"
                        : "INITIATE_ACCESS"}
                    </span>
                    {/* Button hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-pink-600/0 to-cyan-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300"></div>
                  </button>
                </div>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-cyan-400/20 relative z-10">
                <p className="text-cyan-400 font-mono text-sm group-hover:text-cyan-300 transition-colors duration-300">
                  NEW_IDENT?{" "}
                  <Link
                    to="/register"
                    className="text-pink-600 hover:text-cyan-400 transition-colors duration-200 font-bold hover:underline"
                  >
                    REQUEST_CLEARANCE
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="mt-12 flex gap-8 text-cyan-400 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
              <span>SYSTEM_ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-600 shadow-[0_0_8px_rgba(219,39,119,0.6)] animate-pulse"></div>
              <span>VAULT_SECURE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse"></div>
              <span>2FA_READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner accents with animation */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-400 animate-pulse"></div>
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-pink-500 animate-pulse delay-500"></div>
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-pink-500 animate-pulse delay-1000"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-400 animate-pulse delay-1500"></div>

      {/* Security notice */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-20">
        <div className="bg-black/80 border border-cyan-400/30 rounded-none p-4 text-center group">
          <p className="text-cyan-400 font-mono text-xs font-bold mb-1">
            DUAL_PROTECTION_VAULT
          </p>
          <p className="text-cyan-300 font-mono text-xs mb-2">
            PASSWORDS_AND_CARDS_SEPARATELY_ENCRYPTED • END_TO_END_SECURITY
          </p>
          <a
            href="https://github.com/NeoLynX-here/vaultify.git"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 hover:text-cyan-400 font-mono text-xs transition-all duration-200 hover:tracking-wider group-hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] px-2 py-1"
          >
            [ACCESS_SOURCE_CODE]
          </a>
        </div>
      </div>

      {/* 2FA Modal */}
      <TwoFAModal
        show={showTwoFAModal}
        onClose={handle2FAClose}
        twoFAData={twoFAData}
        onVerificationSuccess={handle2FASuccess}
      />
    </div>
  );
}
