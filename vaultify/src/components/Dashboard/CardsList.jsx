// components/Dashboard/CardsList.jsx
import CardItem from "./CardItem.jsx";

export default function CardsList({
  cards,
  searchTerm,
  visibleCardDetails,
  onRemoveCard,
  toggleCardDetailsVisibility,
  onCopyToClipboard,
  onEditCard,
  onUpdateCard,
  onCancelCardEdit,
}) {
  // Safe helper functions (like VaultItemsList has)
  const getDisplayText = (field) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object" && field.iv && field.ciphertext) {
      return "🔒 ENCRYPTED"; // Show placeholder for encrypted fields
    }
    return String(field); // Fallback
  };

  const isEncrypted = (field) => {
    return field && typeof field === "object" && field.iv && field.ciphertext;
  };

  // Safe filtering that handles encrypted data
  const filteredCards = (cards?.items || []).filter((card) => {
    if (!card) return false;

    const searchLower = searchTerm.toLowerCase();

    // Safely get text from all searchable fields
    const title = getDisplayText(card.title).toLowerCase();
    const cardholderName = getDisplayText(card.cardholderName).toLowerCase();
    const cardNumber = getDisplayText(card.cardNumber).toLowerCase();
    const notes = getDisplayText(card.notes).toLowerCase();

    return (
      title.includes(searchLower) ||
      cardholderName.includes(searchLower) ||
      cardNumber.includes(searchLower) ||
      notes.includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(34,211,238,0.1)_100%)] animate-matrix-rain"></div>
      </div>

      {/* Header with Stats - Cyberpunk Style */}
      <div className="relative bg-black/80 border border-cyan-400/30 rounded-none p-4 md:p-6 group hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        {/* Sharp corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>

        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 md:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8">
            {/* Cards Label */}
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-base sm:text-lg md:text-xl tracking-wider">
              <span className="material-icons text-cyan-400 text-lg sm:text-xl md:text-2xl">
                credit_card
              </span>
              <span className="uppercase bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent font-black">
                SILICON_SECRETS
              </span>
            </div>

            {/* Divider for larger screens */}
            <div className="hidden sm:block h-6 w-px bg-gradient-to-b from-cyan-400/50 to-pink-600/50"></div>

            {/* Cards Count */}
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm sm:text-base">
              <span className="material-icons text-green-400 text-base sm:text-lg animate-pulse">
                payment
              </span>
              <span className="uppercase text-cyan-400/80">CARD_S:</span>
              <span className="text-cyan-400 font-bold text-lg">
                {cards?.items?.length || 0}
              </span>
            </div>

            {/* Encrypted Cards Count */}
            {filteredCards.some(
              (card) =>
                isEncrypted(card.cardNumber) ||
                isEncrypted(card.cvv) ||
                isEncrypted(card.cardholderName)
            ) && (
              <>
                <div className="hidden sm:block h-6 w-px bg-cyan-400/30"></div>
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm sm:text-base">
                  <span className="material-icons text-cyan-400 text-base sm:text-lg animate-pulse">
                    lock
                  </span>
                  <span className="uppercase text-cyan-400/80">ENCRYPTED:</span>
                  <span className="font-bold text-cyan-400">
                    {
                      filteredCards.filter(
                        (card) =>
                          isEncrypted(card.cardNumber) ||
                          isEncrypted(card.cvv) ||
                          isEncrypted(card.cardholderName)
                      ).length
                    }
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="flex items-center gap-2 text-pink-400 font-mono text-sm bg-black/60 border border-pink-400/30 px-3 py-2 group-hover:border-pink-400/50 transition-colors duration-300">
              <span className="material-icons text-pink-400 text-base">
                search
              </span>
              <span className="font-bold">{filteredCards.length}</span>
              <span className="text-pink-300">
                {filteredCards.length === 1 ? "MATCH" : "MATCHES"}
              </span>
            </div>
          )}
        </div>

        {/* Scan line effect */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse opacity-60"></div>
      </div>

      {/* Cards List */}
      {filteredCards.length > 0 ? (
        <div className="space-y-3 md:space-y-10 relative">
          {filteredCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardItem
                card={card}
                visibleCardDetails={visibleCardDetails}
                onToggleVisibility={(field) =>
                  toggleCardDetailsVisibility(card.id, field)
                }
                onCopy={onCopyToClipboard}
                onEdit={() => onEditCard(card.id)}
                onRemove={() => onRemoveCard(card.id)}
                onUpdate={onUpdateCard}
                onCancel={onCancelCardEdit}
                getDisplayText={getDisplayText}
                isEncrypted={isEncrypted}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Show appropriate empty state based on search */
        <>
          {/* Empty Cards (no search and cards is empty) */}
          {!searchTerm && (!cards?.items || cards.items.length === 0) && (
            <div className="relative text-center py-12 md:py-16 bg-black/60 border border-cyan-400/30 rounded-none group hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-400"></div>
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-400"></div>
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-pink-600"></div>
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-pink-600"></div>

              <div className="flex flex-col items-center gap-4 text-cyan-400 relative z-10">
                <span className="material-icons text-4xl md:text-6xl text-cyan-400/60 animate-float">
                  credit_card_off
                </span>
                <div className="font-mono space-y-2 px-4">
                  <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent">
                    NO_CARDS_STORED
                  </div>
                  <div className="text-cyan-300 text-sm md:text-base tracking-wider">
                    ADD_CARDS_TO_BEGIN
                  </div>
                  <div className="text-cyan-400/60 text-xs md:text-sm mt-4 tracking-widest">
                    CREATE_CARD_ENTRY
                  </div>
                </div>
              </div>

              {/* Floating binary particles */}
              <div className="absolute inset-0 overflow-hidden opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-cyan-400 font-mono text-xs animate-float"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${10 + Math.random() * 10}s`,
                    }}
                  >
                    {Math.random() > 0.5 ? "1" : "0"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Search Results (has cards but no matches) */}
          {searchTerm && cards?.items?.length > 0 && (
            <div className="relative text-center py-10 md:py-14 bg-black/60 border border-pink-400/30 rounded-none group hover:border-pink-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-pink-400"></div>
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-pink-400"></div>
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-cyan-400"></div>
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-cyan-400"></div>

              <div className="flex flex-col items-center gap-3 text-pink-400 relative z-10">
                <span className="material-icons text-3xl md:text-5xl text-pink-400/60">
                  search_off
                </span>
                <div className="font-mono space-y-2 px-4">
                  <div className="text-lg md:text-xl font-black bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    NO_MATCHING_CARDS_FOUND
                  </div>
                  <div className="text-pink-300 text-sm md:text-base tracking-wider border border-pink-400/30 px-3 py-1 bg-black/60">
                    "{searchTerm}"
                  </div>
                  <div className="text-pink-400/60 text-xs md:text-sm mt-3 tracking-widest">
                    MODIFY_SEARCH_TERMS
                  </div>
                </div>
              </div>

              {/* Scan line effect */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-pulse opacity-40"></div>
            </div>
          )}
        </>
      )}
      {/* Data State Info (Debug - remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 font-mono p-2 border border-gray-700 rounded">
          <div>Total Cards: {cards?.items?.length || 0}</div>
          <div>Filtered: {filteredCards.length}</div>
          <div>
            Sample Card:{" "}
            {cards?.items?.[0]
              ? JSON.stringify({
                  title: "LynX",
                  cardholderName: "Neo LynX",
                  cardNumber: "3714 496353 98431",
                  cvv: "123",
                  Exp: "12/26"
                })
              : "No cards"}
          </div>
        </div>
      )}
      {/* Floating corner accents for the entire section */}
      <div className="absolute -top-2 -left-2 w-6 h-6 border-t border-l border-cyan-400/50 animate-pulse"></div>
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t border-r border-pink-400/50 animate-pulse delay-500"></div>
      <div className="absolute -bottom-8 -left-2 w-6 h-6 border-b border-l border-pink-400/50 animate-pulse delay-1000"></div>
      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b border-r border-cyan-400/50 animate-pulse delay-1500"></div>
    </div>
  );
}
