import { useState, useEffect, useCallback, useMemo } from "react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator.jsx";
import { checkPasswordStrength } from "../../util/passwordUtils.js";

export default function VaultItem({
  item,
  visiblePasswords,
  breachResults,
  onRemoveItem,
  onEditItem,
  onUpdateItem,
  onCancelEdit,
  onTogglePasswordVisibility,
  onCopy,
  isEditing,
  getDisplayText,
  isEncrypted,
}) {
  const breachInfo = breachResults[item.id];
  const isBreached = breachInfo?.isBreached;
  const [editForm, setEditForm] = useState({ ...item, showPassword: false });
  const [copyFeedback, setCopyFeedback] = useState("");

  //  FIXED: Only calculate password strength when needed
  const [editPasswordStrength, setEditPasswordStrength] = useState({
    score: 0,
    strength: "weak",
  });

  // Memoized display values - KEEP BOTH FOR BACKWARDS COMPATIBILITY
  const displayValues = useMemo(
    () => ({
      title: getDisplayText(item.title),
      username: getDisplayText(item.username),
      password: getDisplayText(item.password),
      link: getDisplayText(item.link),
      notes: getDisplayText(item.notes),
    }),
    [item, getDisplayText]
  );

  //  KEEP ORIGINAL VARIABLES FOR BACKWARDS COMPATIBILITY
  const displayTitle = displayValues.title;
  const displayUsername = displayValues.username;
  const displayPassword = displayValues.password;
  const displayLink = displayValues.link;
  const displayNotes = displayValues.notes;

  // Memoized encryption checks - KEEP BOTH FOR BACKWARDS COMPATIBILITY
  const encryptionStatus = useMemo(
    () => ({
      title: isEncrypted(item.title),
      username: isEncrypted(item.username),
      password: isEncrypted(item.password),
      link: isEncrypted(item.link),
      notes: isEncrypted(item.notes),
    }),
    [item, isEncrypted]
  );

  //  KEEP ORIGINAL VARIABLES FOR BACKWARDS COMPATIBILITY
  const isTitleEncrypted = encryptionStatus.title;
  const isUsernameEncrypted = encryptionStatus.username;
  const isPasswordEncrypted = encryptionStatus.password;
  const isLinkEncrypted = encryptionStatus.link;
  const isNotesEncrypted = encryptionStatus.notes;

  //  FIXED: Only update edit form when item changes and we're in editing mode
  useEffect(() => {
    if (isEditing) {
      setEditForm({ ...item, showPassword: false });
    }
  }, [isEditing, item]);

  //  FIXED: Debounced password strength calculation
  useEffect(() => {
    if (!isEditing || !editForm.password) {
      return;
    }

    // Only calculate strength if password actually changed and we're editing
    const timeoutId = setTimeout(() => {
      const strength = checkPasswordStrength(editForm.password);
      setEditPasswordStrength(strength);
    }, 300); // Debounce to avoid rapid calculations

    return () => clearTimeout(timeoutId);
  }, [editForm.password, isEditing]); // Only depend on password and editing state

  const handleCopy = useCallback(
    (text) => {
      onCopy(text);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 2000);
    },
    [onCopy]
  );

  const handleSave = useCallback(
    () => onUpdateItem(editForm),
    [onUpdateItem, editForm]
  );

  const handleCancel = useCallback(() => onCancelEdit(), [onCancelEdit]);

  //  FIXED: Memoized form field handlers
  const handleFieldChange = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setEditForm((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  }, []);

  // Memoized form configuration
  const formFields = useMemo(
    () => [
      { key: "title", label: "ENTRY_TITLE", type: "text" },
      { key: "username", label: "USER_IDENTITY", type: "text" },
      { key: "password", label: "ENCRYPTION_KEY", type: "password" },
      { key: "link", label: "ACCESS_PORTAL", type: "url" },
    ],
    []
  );

  // Memoized corner accents component
  const CornerAccents = useCallback(
    ({ isBreached, position = "all" }) => (
      <>
        {(position === "all" || position === "top") && (
          <>
            <div
              className={`absolute top-2 left-2 w-3 h-3 border-t border-l ${
                isBreached ? "border-red-500" : "border-cyan-400"
              }`}
            />
            <div
              className={`absolute top-2 right-2 w-3 h-3 border-t border-r ${
                isBreached ? "border-red-500" : "border-cyan-400"
              }`}
            />
          </>
        )}
        {(position === "all" || position === "bottom") && (
          <>
            <div
              className={`absolute bottom-2 left-2 w-3 h-3 border-b border-l ${
                isBreached ? "border-red-500" : "border-pink-600"
              }`}
            />
            <div
              className={`absolute bottom-2 right-2 w-3 h-3 border-b border-r ${
                isBreached ? "border-red-500" : "border-pink-600"
              }`}
            />
          </>
        )}
      </>
    ),
    []
  );

  // Early return for editing mode
  if (isEditing) {
    return (
      <div className="bg-black/50 border border-cyan-400/50 rounded-none p-4 md:p-6 shadow-[0_0_20px_rgba(34,211,238,0.3)] relative group mt-4 w-full max-w-6xl mx-auto">
        <CornerAccents />

        <h3 className="text-cyan-400 font-mono text-base md:text-lg mb-4 flex items-center gap-2">
          <span className="material-icons text-cyan-400 text-sm md:text-base">
            edit
          </span>
          EDITING: {displayTitle}
        </h3>

        <div className="space-y-4">
          {formFields.map(({ key, label, type }) => (
            <div key={key} className="group">
              <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 tracking-wider uppercase">
                {label}
                {encryptionStatus[key] && (
                  <span className="text-cyan-400/60 text-xs ml-2">
                    (ENCRYPTED)
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={
                    key === "password" && editForm.showPassword ? "text" : type
                  }
                  placeholder={`ENTER_${label}`}
                  value={editForm[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-red-500 text-white font-mono text-sm transition-all duration-200 pr-10"
                />

                {key === "password" && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-pink-400 transition-colors"
                    title={
                      editForm.showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <span className="material-icons text-base">
                      {editForm.showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                )}
              </div>

              {key === "password" && editForm.password && (
                <div className="mt-2">
                  <PasswordStrengthIndicator
                    passwordStrength={editPasswordStrength}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Notes field */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 tracking-wider uppercase">
              SECURITY_NOTES
              {isNotesEncrypted && (
                <span className="text-cyan-400/60 text-xs ml-2">
                  (ENCRYPTED)
                </span>
              )}
            </label>
            <textarea
              placeholder="ENTER_SECURITY_NOTES"
              value={editForm.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows="3"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-red-500 text-white font-mono text-sm transition-all duration-200 resize-y min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-2 md:py-3 bg-black border border-cyan-400 text-cyan-400 font-mono hover:bg-cyan-400 hover:text-black transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
            >
              <span className="material-icons text-lg group-hover:scale-110 transition-transform">
                save
              </span>
              <span className="hidden sm:inline">COMMIT_CHANGES</span>
              <span className="sm:hidden">SAVE</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 md:py-3 bg-black border border-pink-600 text-pink-400 font-mono hover:bg-pink-600 hover:text-black transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
            >
              <span className="material-icons text-lg group-hover:scale-110 transition-transform">
                close
              </span>
              <span className="hidden sm:inline">ABORT_EDIT</span>
              <span className="sm:hidden">CANCEL</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`bg-black/20 border rounded-none p-4 md:p-5 shadow-[0_0_15px_rgba(34,211,238,0.2)] relative group mt-3 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] w-full max-w-6xl mx-auto ${
        isBreached
          ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          : "border-cyan-400/50"
      }`}
    >
      <CornerAccents isBreached={isBreached} />

      {/* Entry Header with card-style layout */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3
            className={`font-mono text-lg md:text-xl truncate ${
              isBreached ? "text-red-400" : "text-cyan-400"
            }`}
          >
            {displayTitle}
            {isTitleEncrypted && (
              <span className="text-cyan-400/60 text-xs ml-2">(ENCRYPTED)</span>
            )}
            {isBreached && (
              <span className="text-red-300 text-xs md:text-sm ml-2 md:ml-3 font-normal">
                ({breachInfo.breachCount})
              </span>
            )}
          </h3>

          {isBreached && (
            <span className="text-red-500 text-xs bg-red-900/30 px-2 py-1 border border-red-600/50 font-mono flex-shrink-0 flex items-center gap-1">
              <span className="material-icons text-xs">warning</span>
              <span className="hidden sm:inline">BREACHED</span>
            </span>
          )}

          {copyFeedback && (
            <div className="bg-green-900/100 text-white font-mono text-xs px-2 py-1 border border-green-400 animate-pulse flex-shrink-0">
              {copyFeedback}
            </div>
          )}
        </div>

        {/* Action Buttons - card-style positioning */}
        <div className="flex gap-1 flex-shrink-0 ml-3">
          <button
            onClick={() => onRemoveItem(item.id)}
            className="bg-black border border-red-500 text-red-400 hover:bg-red-500/30 transition-all duration-200 p-1 md:p-1.5 flex items-center justify-center group"
            title="DELETE_ENTRY"
          >
            <span className="material-icons text-sm group-hover:scale-110 transition-transform">
              delete
            </span>
          </button>

          <button
            onClick={() => onEditItem(item.id)}
            className="bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200 p-1 md:p-1.5 flex items-center justify-center group"
            title="MODIFY_ENTRY"
          >
            <span className="material-icons text-sm group-hover:scale-110 transition-transform">
              edit
            </span>
          </button>
        </div>
      </div>

      {/* Security Notes - card-style */}
      {displayNotes && (
        <div className="mb-4 p-3 bg-black/60 border border-cyan-400/30 rounded-none">
          <div className="text-cyan-400 font-mono text-sm flex items-start gap-2">
            <span className="material-icons text-cyan-400 text-base flex-shrink-0 mt-0.5">
              notes
            </span>
            <span className="text-cyan-300 whitespace-pre-wrap">
              {displayNotes}
              {isNotesEncrypted && (
                <span className="text-cyan-400/60 text-xs ml-2">
                  (ENCRYPTED)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Access Portal - card-style */}
      {displayLink && (
        <a
          href={
            displayLink.startsWith("http")
              ? displayLink
              : "https://" + displayLink
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 font-mono text-sm hover:text-pink-400 transition-colors duration-200 flex items-center gap-2 mb-4"
        >
          <span className="material-icons text-base">link</span>
          <span className="hidden sm:inline">PORTAL_ACCESS: </span>
          <span className="truncate flex-1">{displayLink}</span>
          {isLinkEncrypted && (
            <span className="text-cyan-400/60 text-xs ml-2">(ENCRYPTED)</span>
          )}
        </a>
      )}

      {/* Credentials Section - Card-style layout */}
      {(displayUsername || displayPassword) && (
        <div className="space-y-4">
          {/* USER_IDENTITY - Card-style */}
          {displayUsername && (
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 flex items-center gap-2 font-mono text-base flex-shrink-0 min-w-[100px]">
                <span className="material-icons text-cyan-400 text-lg">
                  person
                </span>
                <span className="hidden sm:inline">USER_ID:</span>
                <span className="sm:hidden">USER:</span>
              </span>
              <div className="flex-1 flex items-center gap-2">
                <code className="flex-1 bg-black/60 border border-cyan-400/30 px-4 py-2 text-cyan-300 font-mono text-base truncate min-h-[44px] flex items-center">
                  {displayUsername}
                  {isUsernameEncrypted && (
                    <span className="text-cyan-400/60 text-xs ml-2">
                      (ENCRYPTED)
                    </span>
                  )}
                </code>
                <button
                  onClick={() => handleCopy(displayUsername)}
                  className="bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200 px-2 py-2 flex items-center gap-2 group font-mono text-sm flex-shrink-0"
                  title="COPY_IDENTITY"
                >
                  <span className="material-icons text-base group-hover:scale-110 transition-transform">
                    content_copy
                  </span>
                  <span className="hidden sm:inline">COPY</span>
                </button>
              </div>
            </div>
          )}

          {/* PASSWORD - Card-style */}
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 flex items-center gap-2 font-mono text-base flex-shrink-0 min-w-[100px]">
              <span className="material-icons text-cyan-400 text-lg">lock</span>
              <span className="hidden sm:inline">PASSWORD:</span>
              <span className="sm:hidden">PASS:</span>
            </span>
            <div className="flex-1 flex items-center gap-2">
              <code
                className={`flex-1 border px-4 py-2 font-mono text-base truncate min-h-[44px] flex items-center ${
                  isBreached
                    ? "bg-red-900/30 border-red-500 text-red-300"
                    : "bg-black/60 border-cyan-400/30 text-cyan-300"
                }`}
              >
                {visiblePasswords[item.id] ? displayPassword : "••••••••"}
                {isPasswordEncrypted && (
                  <span className="text-cyan-400/60 text-xs ml-2">
                    (ENCRYPTED)
                  </span>
                )}
              </code>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onTogglePasswordVisibility(item.id)}
                  className="bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-200 p-2 flex items-center group min-w-[44px] min-h-[44px] justify-center"
                  title={visiblePasswords[item.id] ? "HIDE_KEY" : "REVEAL_KEY"}
                  disabled={isPasswordEncrypted}
                >
                  <span className="material-icons text-base group-hover:scale-110 transition-transform">
                    {visiblePasswords[item.id]
                      ? "visibility_off"
                      : "visibility"}
                  </span>
                </button>
                <button
                  onClick={() => handleCopy(displayPassword)}
                  className="bg-black border border-pink-600 text-pink-400 hover:bg-pink-600/30 transition-all duration-200 px-2 py-2 flex items-center gap-2 group font-mono text-sm"
                  title="COPY_IDENTITY_KEY"
                >
                  <span className="material-icons text-base group-hover:scale-110 transition-transform">
                    content_copy
                  </span>
                  <span className="hidden sm:inline">COPY</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Status Alert - Card-style */}
      {(isTitleEncrypted || isUsernameEncrypted || isPasswordEncrypted) && (
        <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-400/50 rounded-none">
          <div className="flex items-start gap-3">
            <span className="material-icons text-cyan-400 text-base flex-shrink-0">
              lock
            </span>
            <div className="font-mono text-cyan-300 text-sm">
              <div className="text-cyan-400 font-bold">ENCRYPTED_DATA</div>
              <div className="mt-1 text-cyan-300/80 text-xs">
                This entry contains encrypted fields that require decryption
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Alerts */}
      <div className="mt-4 space-y-3">
        {/* Breach Alert */}
        {isBreached && (
          <div className="p-3 bg-red-900/20 border border-red-500 rounded-none">
            <div className="flex items-start gap-3">
              <span className="material-icons text-red-400 text-base flex-shrink-0">
                security
              </span>
              <div className="font-mono text-red-300 text-sm">
                <div className="text-red-400 font-bold">
                  <span className="hidden sm:inline">SECURITY_BREACH</span>
                  <span className="sm:hidden">BREACHED</span>
                </div>
                <div className="mt-1 text-red-300/80">
                  {breachInfo.message}
                  <div className="mt-2 flex items-center gap-2 text-red-400 font-mono text-xs font-bold animate-pulse">
                    <span className="material-icons text-sm">warning</span>
                    CHANGE_PASSWORD_NOW
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
