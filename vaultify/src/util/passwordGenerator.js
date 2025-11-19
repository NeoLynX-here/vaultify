export const generateRandomPassword = (options = {}) => {
  const {
    length = 16,
    useLowercase = true,
    useUppercase = true,
    useNumbers = true,
    useSymbols = true,
    avoidAmbiguous = true,
  } = options;

  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const ambiguous = "Il1O0";

  // Filter character sets if avoidAmbiguous is true
  const getFilteredSet = (charset) => {
    if (!avoidAmbiguous) return charset;
    return charset
      .split("")
      .filter((char) => !ambiguous.includes(char))
      .join("");
  };

  const filteredLowercase = useLowercase ? getFilteredSet(lowercase) : "";
  const filteredUppercase = useUppercase ? getFilteredSet(uppercase) : "";
  const filteredNumbers = useNumbers ? getFilteredSet(numbers) : "";
  const filteredSymbols = useSymbols ? getFilteredSet(symbols) : "";

  // Build character sets
  const requiredChars = [
    ...(useLowercase ? [filteredLowercase] : []),
    ...(useUppercase ? [filteredUppercase] : []),
    ...(useNumbers ? [filteredNumbers] : []),
    ...(useSymbols ? [filteredSymbols] : []),
  ].filter((set) => set.length > 0);

  // Combine all characters for the remaining slots
  const allChars = requiredChars.join("");

  if (allChars.length === 0) return "";

  let password = "";

  // Step 1: Ensure at least one character from each selected type
  requiredChars.forEach((charSet) => {
    if (charSet.length > 0) {
      password += charSet[Math.floor(Math.random() * charSet.length)];
    }
  });

  // Step 2: Fill the rest with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Step 3: Shuffle the password to mix the required characters
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
