import { useState, useEffect } from "react";
import { generateRandomPassword } from "../../util/passwordGenerator.js";
import { checkPasswordStrength } from "../../util/passwordUtils.js";

export default function PasswordGenerator({
  onPasswordGenerated,
  mode = "default",
}) {
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "weak",
  });
  const [options, setOptions] = useState({
    length: 16,
    useLowercase: true,
    useUppercase: true,
    useNumbers: true,
    useSymbols: true,
    avoidAmbiguous: true,
  });

  // Generate password whenever options change
  useEffect(() => {
    generateNewPassword();
  }, [options]); // Add options as dependency

  useEffect(() => {
    if (generatedPassword) {
      const strength = checkPasswordStrength(generatedPassword);
      setPasswordStrength(strength);
    }
  }, [generatedPassword]);

  const generateNewPassword = () => {
    const newPassword = generateRandomPassword(options);
    setGeneratedPassword(newPassword);
  };

  const handleUsePassword = () => {
    if (generatedPassword && onPasswordGenerated) {
      onPasswordGenerated(generatedPassword);
    } else if (mode === "sidebar") {
      navigator.clipboard.writeText(generatedPassword);
      console.log("Password copied to clipboard!");
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case "strong":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-red-400";
    }
  };

  const handleOptionChange = (key) => {
    // Update options immediately
    setOptions((prev) => {
      const newOptions = { ...prev, [key]: !prev[key] };
      return newOptions;
    });
    // No need for setTimeout - useEffect will handle regeneration
  };

  const handleLengthChange = (newLength) => {
    setOptions((prev) => ({ ...prev, length: newLength }));
    // No need to call generateNewPassword - useEffect will handle it
  };

  return (
    <div className="bg-black/90 border border-cyan-400/50 rounded-none p-6 shadow-[0_0_40px_rgba(34,211,238,0.4)] relative group backdrop-blur-sm">
      {/* Sharp corner accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <h3 className="text-cyan-400 font-mono text-xl flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
          <span className="material-icons text-cyan-400 text-2xl">key</span>
          QUANTUM_KEY_GENERATOR
        </h3>
        <div className="h-px w-32 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 mt-3 shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
        {mode === "sidebar" && (
          <p className="text-cyan-400/80 font-mono text-sm mt-2">
            STANDALONE_SECURITY_TOOL
          </p>
        )}
      </div>

      {/* Generated Password */}
      <div className="mb-6 relative z-10">
        <label className="block text-cyan-400 font-mono text-sm mb-3 tracking-wider uppercase">
          GENERATED_ENCRYPTION_KEY
        </label>
        <div className="relative">
          <input
            type="text"
            value={generatedPassword}
            readOnly
            className="w-full px-4 py-3 bg-black/90 border-2 border-cyan-500/70 text-white font-mono text-sm pr-20 shadow-[0_0_20px_rgba(34,211,238,0.3)] backdrop-blur-sm"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(generatedPassword)}
              className="text-cyan-400 hover:text-pink-400 transition-all duration-200 p-1 hover:scale-110"
              title="COPY_KEY"
            >
              <span className="material-icons text-lg">content_copy</span>
            </button>
            <button
              onClick={generateNewPassword}
              className="text-cyan-400 hover:text-pink-400 transition-all duration-200 p-1 hover:scale-110"
              title="GENERATE_NEW_KEY"
            >
              <span className="material-icons text-lg">refresh</span>
            </button>
          </div>
        </div>

        <div
          className={`mt-3 font-mono text-xs flex items-center gap-2 ${getStrengthColor()} drop-shadow-[0_0_5px_currentColor]`}
        >
          <span className="material-icons text-sm">
            {passwordStrength.strength === "strong"
              ? "security"
              : passwordStrength.strength === "medium"
              ? "warning"
              : "error"}
          </span>
          ENCRYPTION_STRENGTH: {passwordStrength.strength.toUpperCase()} (
          {passwordStrength.score}/6)
        </div>
      </div>

      {/* Slider for Length */}
      <div className="mb-6 relative z-10">
        <label className="block text-cyan-400 font-mono text-sm mb-3 uppercase">
          ENC_KEY_LENGTH:{" "}
          <span className="text-pink-400">{options.length}</span>
        </label>
        <input
          type="range"
          min="8"
          max="20"
          value={options.length}
          onChange={(e) => handleLengthChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)]"
        />
      </div>

      {/* Checkbox Controls */}
      <div className="grid grid-cols-2 gap-3 mb-6 text-cyan-400 font-mono text-sm relative z-10">
        {[
          { key: "useUppercase", label: "UPPERCASE" },
          { key: "useLowercase", label: "LOWERCASE" },
          { key: "useNumbers", label: "NUMBERS" },
          { key: "useSymbols", label: "SYMBOLS" },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => handleOptionChange(key)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 border-2 transition-all duration-200 flex items-center justify-center ${
                  options[key]
                    ? "bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                    : "border-cyan-400/50 group-hover:border-cyan-400"
                }`}
              >
                {options[key] && (
                  <span className="material-icons text-black text-sm">
                    check
                  </span>
                )}
              </div>
            </div>
            <span className="group-hover:text-cyan-300 transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center relative z-10">
        <button
          onClick={handleUsePassword}
          className="w-full py-3 bg-black/80 border-2 border-cyan-400 text-cyan-400 font-mono hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]"
        >
          <span className="material-icons text-lg group-hover:scale-110 transition-transform">
            {mode === "sidebar" ? "content_copy" : "check_circle"}
          </span>
          {mode === "sidebar" ? "COPY_TO_CLIPBOARD" : "USE_THIS_KEY"}
        </button>
      </div>

      {/* Security Info */}
      <div className="mt-6 p-4 bg-black/60 border border-cyan-400/40 backdrop-blur-sm relative z-10">
        <div className="flex items-start gap-3">
          <span className="material-icons text-cyan-400 text-base flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
            info
          </span>
          <div className="text-cyan-300 font-mono text-xs">
            <div className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">
              SECURITY_PROTOCOL_ACTIVE
            </div>
            <div className="mt-1 text-cyan-300/90">
              All keys generated locally • No network transmission •
              WEB_CRYPTO_SUBTLE Algorithms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
