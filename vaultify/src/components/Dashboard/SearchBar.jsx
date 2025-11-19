
export default function SearchBar({
  searchTerm,
  setSearchTerm,
  placeholder = "SEARCH_VAULT: TITLE, IDENTITY, PORTAL, NOTES...",
  mode = "passwords", // "passwords" or "cards"
}) {
  // Dynamic placeholder text based on mode
  const getPlaceholder = () => {
    if (placeholder) return placeholder;

    switch (mode) {
      case "cards":
        return "SEARCH_CARDS: TITLE, CARDHOLDER, NUMBER, NOTES...";
      case "passwords":
      default:
        return "SEARCH_VAULT: TITLE, IDENTITY, PORTAL, NOTES...";
    }
  };

  // Dynamic search status text based on mode
  const getSearchStatus = () => {
    switch (mode) {
      case "cards":
        return "CARD_SEARCH_ACTIVE";
      case "passwords":
      default:
        return "PASSWORD_SEARCH_ACTIVE";
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="relative group w-full max-w-2xl">
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-12 py-4 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-pink-500 text-white font-mono transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(236,72,153,0.4)] placeholder-cyan-400/60"
        />

        {/* Search Icon - Changes based on mode */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 group-focus-within:text-pink-400 transition-colors duration-200">
          <span className="material-icons text-xl">search</span>
        </div>

        {/* Clear Search Button - FIXED POSITIONING */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-5 top-7.5 transform -translate-y-1/2 text-cyan-400 hover:text-pink-400 transition-colors duration-200 z-10"
            title="CLEAR_SEARCH"
          >
            <span className="material-icons ">backspace</span>
          </button>
        )}

        {/* Search Status Indicator */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <div className="text-cyan-400 font-mono text-xs flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
            <span className="material-icons">
              {mode === "cards" ? "credit_score" : "key"}
            </span>
            {getSearchStatus()}
          </div>
        </div>

        {/* Corner Accents - Color changes based on mode */}
        <div
          className={`absolute top-2 left-2 w-2 h-2 border-t border-l transition-colors duration-200 ${
            mode === "cards"
              ? "border-pink-600 group-focus-within:border-cyan-400"
              : "border-cyan-400 group-focus-within:border-pink-500"
          }`}
        ></div>
        <div
          className={`absolute top-2 right-2 w-2 h-2 border-t border-r transition-colors duration-200 ${
            mode === "cards"
              ? "border-pink-600 group-focus-within:border-cyan-400"
              : "border-cyan-400 group-focus-within:border-pink-500"
          }`}
        ></div>
        <div
          className={`absolute bottom-2 left-2 w-2 h-2 border-b border-l transition-colors duration-200 ${
            mode === "cards"
              ? "border-cyan-400 group-focus-within:border-pink-600"
              : "border-pink-600 group-focus-within:border-cyan-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-2 right-2 w-2 h-2 border-b border-r transition-colors duration-200 ${
            mode === "cards"
              ? "border-cyan-400 group-focus-within:border-pink-600"
              : "border-pink-600 group-focus-within:border-cyan-400"
          }`}
        ></div>
      </div>
    </div>
  );
}
