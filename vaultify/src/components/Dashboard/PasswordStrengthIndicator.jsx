import { useMemo } from "react";

// Memoized strength configuration to prevent recreation on every render
const STRENGTH_CONFIG = {
  strong: {
    bar: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    text: "text-green-400",
    label: "_STRONG",
    icon: "security",
    description: "MAXIMUM_SECURITY_ACHIEVED",
  },
  medium: {
    bar: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
    text: "text-yellow-400",
    label: "ADEPT_LEVEL",
    icon: "warning",
    description: "ENHANCE_ENCRYPTION_RECOMMENDED",
  },
  weak: {
    bar: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    text: "text-red-400",
    label: "VULNERABLE",
    icon: "error",
    description: "CRITICAL_VULNERABILITY_DETECTED",
  },
};

// Default fallback values for safety
const DEFAULT_STRENGTH = {
  strength: "weak",
  score: 0,
  feedback: [],
};

export default function PasswordStrengthIndicator({ passwordStrength }) {
  // ✅ SAFE: Memoized validation with comprehensive type checking
  const safePasswordStrength = useMemo(() => {
    // Handle null/undefined cases
    if (!passwordStrength) {
      return DEFAULT_STRENGTH;
    }

    // Handle non-object cases (numbers, strings, etc.)
    if (
      typeof passwordStrength !== "object" ||
      Array.isArray(passwordStrength)
    ) {
      return DEFAULT_STRENGTH;
    }

    // Ensure valid strength value
    const validStrength =
      typeof passwordStrength.strength === "string" &&
      STRENGTH_CONFIG[passwordStrength.strength]
        ? passwordStrength.strength
        : "weak";

    // Ensure valid score (0-6 range)
    const validScore =
      typeof passwordStrength.score === "number"
        ? Math.max(0, Math.min(6, Math.round(passwordStrength.score)))
        : 0;

    // Ensure valid feedback array
    const validFeedback = Array.isArray(passwordStrength.feedback)
      ? passwordStrength.feedback
      : [];

    return {
      strength: validStrength,
      score: validScore,
      feedback: validFeedback,
    };
  }, [passwordStrength]);

  // ✅ SAFE: Memoized strength configuration lookup
  const strengthConfig = useMemo(
    () =>
      STRENGTH_CONFIG[safePasswordStrength.strength] || STRENGTH_CONFIG.weak,
    [safePasswordStrength.strength]
  );

  // ✅ SAFE: Memoized score indicators
  const scoreIndicators = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6].map((level) => ({
        level,
        isActive: level <= safePasswordStrength.score,
      })),
    [safePasswordStrength.score]
  );

  // Calculate width percentage safely
  const barWidth = useMemo(
    () => `${(safePasswordStrength.score / 6) * 100}%`,
    [safePasswordStrength.score]
  );

  return (
    <div className="mt-3">
      {/* Strength Bar */}
      <div className="w-full h-1 bg-gray-800 rounded-none overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-500 ${strengthConfig.bar}`}
          style={{ width: barWidth }}
        />
      </div>

      {/* Strength Info */}
      <div
        className={`font-mono text-xs flex justify-between items-center ${strengthConfig.text}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">ENCRYPTION_STRENGTH:</span>
          <span className="text-white">{strengthConfig.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">SCORE:</span>
          <span className="text-white">{safePasswordStrength.score}/6</span>
        </div>
      </div>

      {/* Strength Indicators */}
      <div className="flex justify-between mt-2 font-mono text-[10px] text-cyan-400">
        {scoreIndicators.map(({ level, isActive }) => (
          <div
            key={level}
            className={`text-center ${
              isActive ? "text-cyan-400" : "text-gray-600"
            }`}
          >
            <div className="w-2 h-2 mx-auto mb-1 rounded-full bg-current" />
            {level}
          </div>
        ))}
      </div>

      {/* Strength Description */}
      <div className="mt-2 font-mono text-[10px] text-cyan-300 text-center">
        <span className="flex items-center justify-center gap-1">
          <span
            className={`material-icons text-${
              safePasswordStrength.strength === "strong"
                ? "green"
                : safePasswordStrength.strength === "medium"
                ? "yellow"
                : "red"
            }-400 text-xs`}
          >
            {strengthConfig.icon}
          </span>
          {strengthConfig.description}
        </span>
      </div>

      {/* Optional: Feedback display (safe) */}
      {safePasswordStrength.feedback.length > 0 &&
        process.env.NODE_ENV === "development" && (
          <div className="mt-2 font-mono text-[10px] text-gray-500 max-h-20 overflow-y-auto">
            {safePasswordStrength.feedback.map((message, index) => (
              <div key={index}>• {message}</div>
            ))}
          </div>
        )}
    </div>
  );
}

// Optional: Add PropTypes for better development experience
PasswordStrengthIndicator.defaultProps = {
  passwordStrength: DEFAULT_STRENGTH,
};
