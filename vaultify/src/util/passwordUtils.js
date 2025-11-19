// passwordUtils.js - FIXED VERSION
export const hasRepeatedWords = (password) => {
  //  ADD TYPE CHECKING
  if (typeof password !== "string") {
    console.warn("hasRepeatedWords: password is not a string", password);
    return false;
  }

  const words = password
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const uniqueWords = new Set(words);
  return words.length !== uniqueWords.size;
};

export const hasSequentialChars = (password) => {
  //  ADD TYPE CHECKING
  if (typeof password !== "string") {
    console.warn("hasSequentialChars: password is not a string", password);
    return false;
  }

  // Check for sequential characters (abc, 123, etc.)
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "zyxwvutsrqponmlkjihgfedcba",
    "0123456789",
    "9876543210",
  ];

  for (let i = 0; i < password.length - 2; i++) {
    const segment = password.toLowerCase().substring(i, i + 3);
    for (const sequence of sequences) {
      if (sequence.includes(segment)) {
        return true;
      }
    }
  }
  return false;
};

export const hasCommonPatterns = (password) => {
  //  ADD TYPE CHECKING
  if (typeof password !== "string") {
    console.warn("hasCommonPatterns: password is not a string", password);
    return false;
  }

  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa)
    /(123|234|345|456|567|678|789)/, // Common number sequences
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/, // Common letter sequences
    /(qwerty|asdfgh|zxcvbn)/, // Keyboard patterns
    /(password|admin|welcome|123456|qwerty)/i, // Common weak passwords
  ];

  return commonPatterns.some((pattern) => pattern.test(password.toLowerCase()));
};

// Updated checkPasswordStrength function with proper error handling
export const checkPasswordStrength = (password) => {
  //  COMPREHENSIVE TYPE CHECKING
  if (typeof password !== "string") {
    console.warn("checkPasswordStrength: password is not a string", password);
    return {
      score: 0,
      strength: "weak",
      feedback: ["Invalid password format"],
    };
  }

  if (!password) {
    return {
      score: 0,
      strength: "weak",
      feedback: ["Password cannot be empty"],
    };
  }

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Store base score for penalty calculations
  const baseScore = score;

  // NEW: Balanced penalties for weak patterns
  let penalty = 0;

  if (hasRepeatedWords(password)) {
    feedback.push("PATTERN_DETECTED: Word repetition detected");
    penalty += 1;
  }

  if (hasSequentialChars(password)) {
    feedback.push("PATTERN_DETECTED: Sequential character sequence");
    penalty += 0.5;
  }

  if (hasCommonPatterns(password)) {
    feedback.push("PATTERN_DETECTED: Common vulnerability pattern");
    // Check if it's a really bad password
    const isVeryWeak = /^(password|123456|qwerty|admin)$/i.test(password);
    penalty += isVeryWeak ? 2 : 1;
  }

  // Apply penalty but don't destroy good passwords
  score = Math.max(0, score - penalty);

  // If base score was good, ensure we don't drop too low
  if (baseScore >= 4 && score < 3) {
    score = 3; // Minimum medium for good base passwords
  }

  // Ensure score is between 0-6
  score = Math.max(0, Math.min(6, Math.round(score)));

  // Determine strength
  let strength;
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";
  else strength = "weak";

  return { score, strength, feedback };
};

// Update getPasswordFeedback to include the new checks
export const getPasswordFeedback = (password) => {
  //  ADD TYPE CHECKING
  if (typeof password !== "string") {
    console.warn("getPasswordFeedback: password is not a string", password);
    return {
      strength: {
        score: 0,
        strength: "weak",
        feedback: ["Invalid password format"],
      },
      validation: {
        isValid: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSpecial: false,
        hasRepeatedWords: false,
        hasSequentialChars: false,
        hasCommonPatterns: false,
      },
      feedback: ["Invalid password format"],
      isStrong: false,
    };
  }

  const strength = checkPasswordStrength(password);
  const validation = {
    isValid: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
    hasRepeatedWords: hasRepeatedWords(password),
    hasSequentialChars: hasSequentialChars(password),
    hasCommonPatterns: hasCommonPatterns(password),
  };

  const feedback = [];

  // Basic requirements
  if (password.length < 8) {
    feedback.push("MIN_LENGTH: 8 characters required");
  }
  if (!validation.hasLower) {
    feedback.push("REQUIREMENT: Lowercase character");
  }
  if (!validation.hasUpper) {
    feedback.push("REQUIREMENT: Uppercase character");
  }
  if (!validation.hasNumber) {
    feedback.push("REQUIREMENT: Numeric character");
  }
  if (!validation.hasSpecial) {
    feedback.push("REQUIREMENT: Special character");
  }

  // Weak pattern warnings with cyberpunk terms
  if (validation.hasRepeatedWords) {
    feedback.push("VULNERABILITY: Word repetition detected");
  }
  if (validation.hasSequentialChars) {
    feedback.push("VULNERABILITY: Sequential character pattern");
  }
  if (validation.hasCommonPatterns) {
    feedback.push("VULNERABILITY: Common attack vector pattern");
  }

  return {
    strength,
    validation,
    feedback,
    isStrong:
      strength.strength === "strong" &&
      !validation.hasRepeatedWords &&
      !validation.hasSequentialChars &&
      !validation.hasCommonPatterns,
  };
};
