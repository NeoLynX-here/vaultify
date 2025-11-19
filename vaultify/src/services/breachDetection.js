export class BreachDetectionService {
  // Check password against Have I Been Pwned API
  async checkPasswordBreach(password) {
    try {
      // Hash the password using SHA-1 (required by HIBP API)
      const passwordHash = await this.sha1(password);
      const prefix = passwordHash.slice(0, 5);
      const suffix = passwordHash.slice(5).toUpperCase();

      // Make API call to HIBP
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
      );

      if (!response.ok) {
        throw new Error("Failed to check password breach");
      }

      const data = await response.text();
      const hashes = data.split("\n");

      // Check if our hash suffix exists in the response
      const breachedHash = hashes.find((hash) => hash.startsWith(suffix));

      if (breachedHash) {
        const breachCount = parseInt(breachedHash.split(":")[1]);
        return {
          isBreached: true,
          breachCount: breachCount,
          message: `Password found in ${breachCount} data breaches`,
        };
      }

      return {
        isBreached: false,
        breachCount: 0,
        message: "No breaches found",
      };
    } catch (error) {
      console.error("Breach check error:", error);
      return {
        isBreached: false,
        breachCount: 0,
        message: "Error checking breaches",
        error: error.message,
      };
    }
  }

  // SHA-1 hashing function
  async sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.toUpperCase();
  }

  // Check multiple passwords
  async checkMultiplePasswords(passwords) {
    const results = {};

    for (const [id, password] of Object.entries(passwords)) {
      if (password && typeof password === "string" && password.trim() !== "") {
        results[id] = await this.checkPasswordBreach(password);
      }
    }

    return results;
  }
}

export const breachService = new BreachDetectionService();
