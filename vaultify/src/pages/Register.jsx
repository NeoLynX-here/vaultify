import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateSalt, deriveAuthProof } from "../crypto/crypto";
import {
  checkPasswordStrength,
  getPasswordFeedback,
} from "../util/passwordUtils";
import PasswordGenerator from "../components/Dashboard/PasswordGenerator.jsx";
import { API_BASE } from "../util/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "weak",
  });
  const [passwordFeedback, setPasswordFeedback] = useState({
    strength: { score: 0, strength: "weak" },
    validation: {},
    feedback: [],
    isStrong: false,
  });
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      validateEmail(email) &&
      passwordFeedback.validation.isValid &&
      password === confirmPassword &&
      passwordStrength.score >= 3 // Medium strength or better
    );
  };

  // Auto-focus email input on mount
  useEffect(() => {
    document.querySelector('input[type="email"]')?.focus();
  }, []);

  // Update password strength dynamically
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      const feedback = getPasswordFeedback(password);
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
    } else {
      setPasswordStrength({ score: 0, strength: "weak" });
      setPasswordFeedback({
        strength: { score: 0, strength: "weak" },
        validation: {},
        feedback: [],
        isStrong: false,
      });
    }
  }, [password]);

  const handlePasswordGenerated = (generatedPassword) => {
    setPassword(generatedPassword);
    setShowPasswordGenerator(false);
  };

  // Enter key navigation
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && isFormValid() && !loading) {
      handleRegister(e);
    }
  };

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    // Validate email
    if (!validateEmail(email)) {
      alert("INVALID_DIGITAL_IDENTITY: Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      alert("ENCRYPTION_KEYS_MISMATCH");
      setLoading(false);
      return;
    }

    const feedback = getPasswordFeedback(password);
    if (!feedback.validation.isValid) {
      alert("ENCRYPTION_KEY_TOO_WEAK: Minimum 8 characters required");
      setLoading(false);
      return;
    }

    // Warn about weak passwords but allow continuation
    if (passwordStrength.score < 3) {
      const proceed = window.confirm(
        "ENCRYPTION_STRENGTH_WARNING: Your encryption key is weak. " +
          "For maximum security, we recommend using a stronger key. " +
          "Continue anyway?"
      );
      if (!proceed) {
        setLoading(false);
        return;
      }
    }

    try {
      const salt = generateSalt();

      // Derive authentication proof only (vault setup happens later)
      const authProof = await deriveAuthProof(password, salt, "auth");

      console.log("Sending registration request without encrypted blob...");

      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          auth_proof: authProof,
          salt,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Registration successful:", data);
        alert("IDENTITY_CREATED: Access granted");
        navigate("/login");
      } else {
        throw new Error(data.message || `Registration failed: ${res.status}`);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err.message || "System error";

      // User-friendly error messages
      if (
        errorMessage.includes("Email already exists") ||
        errorMessage.includes("23505")
      ) {
        alert("IDENTITY_CONFLICT: Digital identity already registered");
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("Failed to fetch")
      ) {
        alert("NETWORK_FAILURE: Check connection and retry");
      } else {
        alert("REGISTRATION_FAILED: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

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
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-cyan-400 font-mono text-xs opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          >
            {Math.random() > 0.5 ? "1" : "0"}
          </div>
        ))}
      </div>

      {/* Password Generator Modal */}
      {showPasswordGenerator && (
        <div className="absolute inset-0 flex justify-center items-center z-50">
          <div className="relative max-w-md w-full mx-4">
            <PasswordGenerator onPasswordGenerated={handlePasswordGenerated} />
            <button
              onClick={() => setShowPasswordGenerator(false)}
              className="absolute -top-4 -right-4 text-cyan-400 hover:text-pink-400 transition-colors duration-200 bg-black border border-cyan-400 rounded-full w-8 h-8 flex items-center justify-center"
              title="CLOSE_GENERATOR"
            >
              <span className="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content - full width layout */}
      <div className="relative z-10 min-h-screen flex">
        {/* Center register section */}
        <div
          className={`flex-1 flex flex-col justify-center items-center p-8 min-w-0 ${
            showPasswordGenerator ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          {/* Header with glitch effect */}
          <div className="text-center mb-12 w-full relative">
            <h1 className="text-6xl md:text-8xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600 font-mono tracking-tight">
              VAULTIFY
            </h1>
            <div className="h-1 w-80 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 shadow-[0_0_20px_3px_rgba(34,211,238,0.8)] mb-6"></div>
            <p className="text-cyan-400 text-2xl tracking-widest font-mono">
              IDENTITY_REGISTRATION
            </p>
          </div>

          {/* Register form - sharp edges */}
          <div className="w-full max-w-lg">
            <div className="bg-black/90 border border-cyan-400/50 rounded-none p-8 shadow-[0_0_30px_rgba(34,211,238,0.3)] relative group hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all duration-300">
              {/* Sharp corner accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>

              {/* Animated border glow */}
              <div className="absolute inset-0 border border-transparent bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

              <form
                onSubmit={handleRegister}
                onKeyPress={handleKeyPress}
                className="space-y-6 relative z-10"
              >
                <div className="group">
                  <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
                    DIGITAL_IDENTITY
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-red-500 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="user@neon.net"
                  />
                  {email && !validateEmail(email) && (
                    <div className="text-red-400 text-xs mt-2 font-mono font-bold flex items-center gap-2">
                      <span className="material-icons text-sm">warning</span>
                      INVALID_DIGITAL_IDENTITY_FORMAT
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
                    ENCRYPTION_KEY
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-4 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-red-500 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)] pr-24"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength="8"
                      placeholder="MIN_8_CHARACTERS"
                    />

                    {/* Password Action Buttons */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      {/* Generate Password Button */}
                      <button
                        type="button"
                        onClick={() => setShowPasswordGenerator(true)}
                        className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                        title="GENERATE_SECURE_KEY"
                      >
                        <span className="material-icons text-lg">key</span>
                      </button>

                      {/* Show/Hide Password Button */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                        title={showPassword ? "HIDE_KEY" : "REVEAL_KEY"}
                      >
                        <span className="material-icons text-lg">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-2 font-mono">
                        <span className="text-cyan-400">
                          ENCRYPTION_STRENGTH:
                        </span>
                        <span
                          className={
                            passwordStrength.strength === "strong"
                              ? "text-green-400 font-bold"
                              : passwordStrength.strength === "medium"
                              ? "text-yellow-400 font-bold"
                              : "text-red-400 font-bold"
                          }
                        >
                          {passwordStrength.strength.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-none overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.strength === "strong"
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                              : passwordStrength.strength === "medium"
                              ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                          }`}
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Password strength warning */}
                      {password && passwordStrength.score < 3 && (
                        <div className="text-yellow-400 text-xs mt-2 font-mono font-bold flex items-center gap-2">
                          <span className="material-icons text-sm">
                            warning
                          </span>
                          ENCRYPTION_STRENGTH_RECOMMENDED: Use stronger key for
                          maximum security
                        </div>
                      )}

                      {passwordFeedback.feedback.length > 0 && (
                        <div className="mt-2 text-xs text-cyan-400 font-mono">
                          <div className="font-bold mb-2 text-pink-400 flex items-center gap-2">
                            <span className="material-icons text-sm">
                              security
                            </span>
                            ENCRYPTION_REQUIREMENTS:
                          </div>
                          {passwordFeedback.feedback.map((item, index) => {
                            const isVulnerability =
                              item.includes("VULNERABILITY");
                            const isRequirement = item.includes("REQUIREMENT");
                            const isPattern = item.includes("PATTERN");

                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 mb-1"
                              >
                                <span className="material-icons text-xs">
                                  {isVulnerability
                                    ? "warning"
                                    : isRequirement
                                    ? "info"
                                    : isPattern
                                    ? "pattern"
                                    : "check_circle"}
                                </span>
                                <span
                                  className={`${
                                    isVulnerability
                                      ? "text-red-400"
                                      : isRequirement
                                      ? "text-yellow-400"
                                      : "text-cyan-300"
                                  }`}
                                >
                                  {item}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
                    CONFIRM_ENCRYPTION_KEY
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full px-4 py-4 bg-black border focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-red-500 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)] pr-12 ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                          : "border-cyan-500/60"
                      }`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="VERIFY_ENCRYPTION_KEY"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <span className="material-icons text-lg">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <div className="text-red-400 text-xs mt-2 font-mono font-bold">
                      ENCRYPTION_KEYS_MISMATCH
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-8 ">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={`w-64 py-4 font-bold text-lg font-mono transition-all duration-200 border relative overflow-hidden group ${
                      loading || !isFormValid()
                        ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-black border-cyan-400 focus:scale-[1.01] hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          GENERATING_IDENTITY...
                        </>
                      ) : (
                        "CREATE_IDENTITY"
                      )}
                    </span>
                    {/* Button hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-pink-600/0 to-cyan-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300"></div>
                  </button>
                </div>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-cyan-400/20 relative z-10">
                <p className="text-cyan-400 font-mono text-sm group-hover:text-cyan-300 transition-colors duration-300">
                  EXISTING_IDENT?{" "}
                  <Link
                    to="/login"
                    className="text-pink-600 hover:text-cyan-400 transition-colors duration-200 font-bold hover:underline"
                  >
                    INITIATE_ACCESS
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="mt-4 mb-15 flex gap-8 text-cyan-400 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
              <span>SYSTEM_ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
              <span>ENCRYPTION_ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-600 shadow-[0_0_8px_rgba(219,39,119,0.6)] animate-pulse"></div>
              <span>VAULT_v1.1</span>
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
        <div className="bg-black/80 border border-cyan-400/30 rounded-none p-4 text-center">
          <p className="text-cyan-400 font-mono text-xs font-bold mb-1">
            SECURITY_PROTOCOL_ACTIVE
          </p>
          <p className="text-cyan-300 font-mono text-xs">
            MASTER_PASSWORD_ENCRYPTS_LOCALLY • SERVER_NEVER_SEES_RAW_DATA
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
    </div>
  );
}
