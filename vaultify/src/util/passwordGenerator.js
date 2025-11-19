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

  const cryptoRandom = (max) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };

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

  const requiredSets = [
    filteredLowercase,
    filteredUppercase,
    filteredNumbers,
    filteredSymbols,
  ].filter((s) => s.length > 0);

  const allChars = requiredSets.join("");
  if (!allChars.length) return "";

  let password = "";

  // Ensure at least one from each selected category
  requiredSets.forEach((set) => {
    password += set[cryptoRandom(set.length)];
  });

  // Fill remaining slots
  for (let i = password.length; i < length; i++) {
    password += allChars[cryptoRandom(allChars.length)];
  }

  // Secure shuffle
  const arr = password.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = cryptoRandom(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join("");
};
