import { useMemo } from "react";
import VaultItem from "./VaultItem.jsx";

export default function VaultItemsList({
  vault,
  searchTerm,
  visiblePasswords,
  breachResults,
  onRemoveItem,
  onEditItem,
  onUpdateItem,
  onCancelEdit,
  editingItem,
  onTogglePasswordVisibility,
  onCopyToClipboard,
}) {
  // Helper function to safely get display text
  const getDisplayText = (field) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object" && field.iv && field.cipher) {
      return "••••••••"; // Show placeholder for encrypted fields
    }
    return String(field); // Fallback
  };

  // Helper to check if a field is encrypted
  const isEncrypted = (field) => {
    return field && typeof field === "object" && field.iv && field.cipher;
  };

  // Memoized filtered items and stats for performance
  const { filteredItems, stats } = useMemo(() => {
    const filtered =
      vault.items?.filter((item) => {
        if (!item) return false;

        const searchLower = searchTerm.toLowerCase();
        const title = getDisplayText(item.title);
        const username = getDisplayText(item.username);
        const link = getDisplayText(item.link);
        const notes = getDisplayText(item.notes);

        const searchText =
          `${title} ${username} ${link} ${notes}`.toLowerCase();
        return searchText.includes(searchLower);
      }) || [];

    const breachedCount = Object.values(breachResults).filter(
      (r) => r.isBreached
    ).length;

    const encryptedItemsCount =
      vault.items?.filter(
        (item) =>
          isEncrypted(item.password) ||
          isEncrypted(item.username) ||
          isEncrypted(item.title)
      ).length || 0;

    return {
      filteredItems: filtered,
      stats: {
        totalItems: vault.items?.length || 0,
        breachedCount,
        encryptedItemsCount,
        hasSearch: !!searchTerm,
        hasItems: vault.items?.length > 0,
      },
    };
  }, [vault.items, searchTerm, breachResults]);

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* Header with Stats - Cyberpunk Style */}
      <div className="relative bg-black/80 border border-cyan-400/30 rounded-none p-4 md:p-6 group hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400 group-hover:border-pink-600 transition-colors duration-300"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600 group-hover:border-cyan-400 transition-colors duration-300"></div>

        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 md:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8">
            {/* Vault Label */}
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-base sm:text-lg md:text-xl tracking-wider">
              <span className="material-icons text-cyan-400 text-lg sm:text-xl md:text-2xl">
                storage
              </span>
              <span className="uppercase bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent font-black">
                VIRTUAL_IDS
              </span>
            </div>

            {/* Divider for larger screens */}
            <div className="hidden sm:block h-6 w-px bg-gradient-to-b from-cyan-400/50 to-pink-600/50"></div>

            {/* Vault Count */}
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm sm:text-base">
              <span className="material-icons text-green-400 text-base sm:text-lg animate-pulse">
                folder
              </span>
              <span className="uppercase text-cyan-400/80">ID_S:</span>
              <span className="text-cyan-400 font-bold text-lg">
                {stats.totalItems}
              </span>
            </div>

            {/* Encrypted Items Count */}
            {stats.encryptedItemsCount > 0 && (
              <>
                <div className="hidden sm:block h-6 w-px bg-cyan-400/30"></div>
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm sm:text-base">
                  <span className="material-icons text-cyan-400 text-base sm:text-lg animate-pulse">
                    lock
                  </span>
                  <span className="uppercase text-cyan-400/80">ENCRYPTED:</span>
                  <span className="font-bold text-cyan-400">
                    {stats.encryptedItemsCount}
                  </span>
                </div>
              </>
            )}

            {/* Breach Count (only visible if > 0) */}
            {stats.breachedCount > 0 && (
              <>
                <div className="hidden sm:block h-6 w-px bg-cyan-400/30"></div>
                <div className="flex items-center gap-2 text-red-400 font-mono text-sm sm:text-base animate-pulse">
                  <span className="material-icons text-red-400 text-base sm:text-lg">
                    warning
                  </span>
                  <span className="uppercase">BREACHED:</span>
                  <span className="font-bold text-red-400">
                    {stats.breachedCount}
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
              <span className="font-bold">{filteredItems.length}</span>
              <span className="text-pink-300">
                {filteredItems.length === 1 ? "MATCH" : "MATCHES"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3 md:space-y-10 relative">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <VaultItem
                item={item}
                visiblePasswords={visiblePasswords}
                breachResults={breachResults}
                onRemoveItem={onRemoveItem}
                onEditItem={onEditItem}
                onUpdateItem={onUpdateItem}
                onCancelEdit={onCancelEdit}
                isEditing={editingItem?.id === item.id}
                onTogglePasswordVisibility={onTogglePasswordVisibility}
                onCopy={onCopyToClipboard}
                getDisplayText={getDisplayText}
                isEncrypted={isEncrypted}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Show appropriate empty state based on search */
        <>
          {/* Empty Vault (no search and vault is empty) */}
          {!searchTerm && !stats.hasItems && (
            <div className="relative text-center py-12 md:py-16 bg-black/60 border border-cyan-400/30 rounded-none group hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-400"></div>
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-400"></div>
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-pink-600"></div>
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-pink-600"></div>

              <div className="flex flex-col items-center gap-4 text-cyan-400 relative z-10">
                <span className="material-icons text-4xl md:text-6xl text-cyan-400/60 animate-float">
                  folder_open
                </span>
                <div className="font-mono space-y-2 px-4">
                  <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent">
                    VAULT_EMPTY
                  </div>
                  <div className="text-cyan-300 text-sm md:text-base tracking-wider">
                    NO_IDENTITIES_DETECTED
                  </div>
                  <div className="text-cyan-400/60 text-xs md:text-sm mt-4 tracking-widest">
                    CREATE_NEW_ID_TO_BEGIN
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

          {/* No Search Results (has items but no matches) */}
          {searchTerm && stats.hasItems && (
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
                    NO_RESULTS_FOUND
                  </div>
                  <div className="text-pink-300 text-sm md:text-base tracking-wider border border-pink-400/30 px-3 py-1 bg-black/60">
                    "{searchTerm}"
                  </div>
                  <div className="text-pink-400/60 text-xs md:text-sm mt-3 tracking-widest">
                    MODIFY_SEARCH_PARAMETERS
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Development Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 font-mono p-2 border border-gray-700 rounded">
          <div>Total Items: {stats.totalItems}</div>
          <div>Filtered: {filteredItems.length}</div>
          <div>
            Sample Item:{" "}
            {vault.items?.[0]
              ? JSON.stringify({
                  title: typeof vault.items[0].title,
                  username: typeof vault.items[0].username,
                  password: typeof vault.items[0].password,
                })
              : "No items"}
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
