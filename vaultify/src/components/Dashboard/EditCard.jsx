// components/Dashboard/EditCardModal.jsx
import { useState, useEffect } from "react";

export default function EditCardModal({
  card,
  onUpdate,
  onCancel,
  existingCards = [],
  cardLogic,
}) {
  const [editedCard, setEditedCard] = useState(card);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { formatCardNumber, getCardType, canSaveCard, EMPTY_CARD } =
    cardLogic || {};

  // Fallback validation
  const isFormValidFallback = () => {
    return (
      editedCard.title?.trim() &&
      editedCard.cardholderName?.trim() &&
      editedCard.cardNumber?.replace(/\s/g, "").length >= 16 &&
      editedCard.expiryDate?.length === 5 &&
      editedCard.cvv?.length >= 3
    );
  };

  // Format card number display
  const formatCardNumberDisplay = (value) => {
    return formatCardNumber
      ? formatCardNumber(value)
      : (() => {
          if (!value) return "";
          const digits = String(value).replace(/\D/g, "");
          return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
        })();
  };

  // ✅ ADD: Get card type display
  const getCardTypeDisplay = (number) => {
    return getCardType
      ? getCardType(number)
      : (() => {
          if (!number) return "CARD";
          const cleaned = String(number).replace(/\s/g, "");
          if (/^4/.test(cleaned)) return "VISA";
          if (/^5[1-5]/.test(cleaned)) return "MASTERCARD";
          if (/^3[47]/.test(cleaned)) return "AMEX";
          if (/^6(?:011|5)/.test(cleaned)) return "DISCOVER";
          return "CARD";
        })();
  };

  // Check for duplicate card number (excluding current card)
  const isDuplicateCardNumber = existingCards.some(
    (existingCard) =>
      existingCard.id !== card.id &&
      existingCard.cardNumber === editedCard.cardNumber?.replace(/\s/g, "")
  );

  //  Handle field changes properly
  const handleFieldChange = (field, value) => {
    if (field === "cardNumber" || field === "cvv") {
      const numericValue = value.replace(/\D/g, "");
      setEditedCard((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setEditedCard((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Proper card number formatting
  const handleCardNumberChange = (value) => {
    const formatted = formatCardNumberDisplay(value);
    handleFieldChange("cardNumber", formatted.replace(/\s/g, "")); // Store without spaces
  };

  // Month and year handlers
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (month && selectedYear) {
      setEditedCard((prev) => ({
        ...prev,
        expiryDate: `${month}/${selectedYear}`,
      }));
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (selectedMonth && year) {
      setEditedCard((prev) => ({
        ...prev,
        expiryDate: `${selectedMonth}/${year}`,
      }));
    }
  };

  // Initialize month and year from card's expiry date
  useEffect(() => {
    if (card?.expiryDate) {
      const [month, year] = card.expiryDate.split("/");
      setSelectedMonth(month || "");
      setSelectedYear(year || "");
    } else {
      setSelectedMonth("");
      setSelectedYear("");
    }
  }, [card]);

  // Check if there are any changes compared to original card
  useEffect(() => {
    const checkForChanges = () => {
      if (!card) return false;

      const hasCardChanged =
        editedCard.title !== card.title ||
        editedCard.cardholderName !== card.cardholderName ||
        editedCard.cardNumber !== card.cardNumber ||
        editedCard.expiryDate !== card.expiryDate ||
        editedCard.cvv !== card.cvv ||
        editedCard.notes !== card.notes;

      setHasChanges(hasCardChanged);
    };

    checkForChanges();
  }, [editedCard, card]);

  // Reset when card changes
  useEffect(() => {
    setEditedCard(card);
    if (card?.expiryDate) {
      const [month, year] = card.expiryDate.split("/");
      setSelectedMonth(month || "");
      setSelectedYear(year || "");
    } else {
      setSelectedMonth("");
      setSelectedYear("");
    }
    setHasChanges(false);
  }, [card]);

  const handleSave = () => {
    // Don't save if no changes or invalid
    if (!hasChanges || !canUpdateCard()) {
      return;
    }

    if (cardLogic && canSaveCard) {
      if (canSaveCard(editedCard, existingCards, card.id)) {
        onUpdate(editedCard);
      }
    } else {
      // Fallback validation
      if (isFormValidFallback()) {
        onUpdate(editedCard);
      }
    }
  };

  const handleCancel = () => {
    setEditedCard(card);
    if (card?.expiryDate) {
      const [month, year] = card.expiryDate.split("/");
      setSelectedMonth(month || "");
      setSelectedYear(year || "");
    } else {
      setSelectedMonth("");
      setSelectedYear("");
    }
    onCancel();
  };

  // Check if card can be updated (similar to AddCardModal)
  const canUpdateCard = () => {
    // First check for duplicates - if duplicate, immediately return false
    if (isDuplicateCardNumber) {
      return false;
    }

    // Then check other validation
    return cardLogic
      ? canSaveCard(editedCard, existingCards, card.id)
      : isFormValidFallback();
  };

  //  Get missing fields for error display (similar to AddCardModal)
  const getMissingFields = () => {
    const missing = [];

    if (!editedCard.title?.trim()) missing.push("TITLE");
    if (!editedCard.cardholderName?.trim()) missing.push("CARDHOLDER");

    const cardNumberDigits = editedCard.cardNumber?.replace(/\s/g, "") || "";
    if (cardNumberDigits.length < 16) missing.push("CARD_NUMBER");

    if (!editedCard.expiryDate || editedCard.expiryDate.length !== 5)
      missing.push("EXPIRY");

    if (!editedCard.cvv || editedCard.cvv.length < 3) missing.push("CVV");

    return missing;
  };

  // Individual field validation states
  const hasTitleError = !editedCard.title?.trim();
  const hasCardholderError = !editedCard.cardholderName?.trim();
  const hasCardNumberError =
    !editedCard.cardNumber?.replace(/\s/g, "")?.length >= 16;
  const hasExpiryError = !selectedMonth || !selectedYear;
  const hasCVVError = !editedCard.cvv?.length >= 3;

  // Combined disabled state - disabled if no changes OR invalid OR duplicate
  const isSaveDisabled =
    !hasChanges || !canUpdateCard() || isDuplicateCardNumber;

  // Accessibility: Close with ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        handleCancel();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleCancel]);

  const cardType = getCardTypeDisplay(editedCard.cardNumber);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn p-2 md:p-0"
      role="dialog"
      aria-modal="true"
    >
      {/* Main Edit Card Form */}
      <div className="relative bg-black/70 border border-cyan-400/50 p-4 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.4)] w-full max-w-lg mx-2 md:mx-4 max-h-[90vh] overflow-y-auto group backdrop-blur-sm">
        {/* Cyber corners */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600"></div>

        {/* Desktop Close Button - Top Right */}
        <button
          onClick={handleCancel}
          className="hidden md:flex absolute top-4 right-4 text-cyan-400 hover:text-pink-400 transition-colors duration-200 p-2 bg-black/80 border border-cyan-400/50 hover:border-pink-400/50 rounded-none group"
          title="Close modal"
        >
          <span className="material-icons text-xl group-hover:scale-110 transition-transform">
            close
          </span>
        </button>

        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600 font-mono flex items-center justify-center gap-2 md:gap-3">
            <span className="material-icons text-cyan-400 text-lg md:text-xl">
              edit
            </span>
            <span className="hidden sm:inline">EDIT_CARD_ENTRY</span>
            <span className="sm:hidden">EDIT_CARD</span>
          </h2>
          <div className="h-px w-24 md:w-32 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 mt-2 md:mt-3 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
        </div>

        {/* Card Preview */}
        {editedCard.cardNumber && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-cyan-400/30 rounded-none">
            <div className="flex justify-between items-center mb-2">
              <div className="text-cyan-400 font-mono text-xs uppercase tracking-wider">
                {cardType}
              </div>
              <div className="text-pink-400 font-mono text-xs">
                {showCardNumber ? "VISIBLE" : "ENCRYPTED"}
              </div>
            </div>
            <div className="text-white font-mono text-lg md:text-xl tracking-wider mb-2">
              {showCardNumber
                ? formatCardNumberDisplay(editedCard.cardNumber)
                : "•••• •••• •••• " + (editedCard.cardNumber.slice(-4) || "")}
            </div>
            <div className="flex justify-between text-cyan-300 font-mono text-xs">
              <span>{editedCard.cardholderName || "CARDHOLDER"}</span>
              <span>{editedCard.expiryDate || "MM/YY"}</span>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 md:space-y-6">
          {/* Title */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              CARD_TITLE *
            </label>
            <input
              type="text"
              placeholder="ENTER_CARD_TITLE"
              value={editedCard.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200"
              required
            />
            {hasTitleError && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Card title is required
              </div>
            )}
          </div>

          {/* Cardholder Name */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              CARDHOLDER_NAME *
            </label>
            <input
              type="text"
              placeholder="ENTER_CARDHOLDER_NAME"
              value={editedCard.cardholderName}
              onChange={(e) =>
                handleFieldChange("cardholderName", e.target.value)
              }
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200"
              required
            />
            {hasCardholderError && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Cardholder name is required
              </div>
            )}
          </div>

          {/* Card Number */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              CARD_NUMBER *
            </label>
            <div className="relative">
              <input
                type={showCardNumber ? "text" : "password"}
                placeholder="XXXX XXXX XXXX XXXX"
                value={formatCardNumberDisplay(editedCard.cardNumber)}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className={`w-full px-3 md:px-4 py-2 md:py-3 bg-black border text-white font-mono text-sm transition-all duration-200 pr-20 md:pr-24 tracking-wider focus:outline-none ${
                  isDuplicateCardNumber
                    ? "border-red-500 focus:border-red-500"
                    : "border-cyan-500/60 focus:border-pink-500"
                }`}
                required
              />
              <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                  title={showCardNumber ? "HIDE_CARD" : "SHOW_CARD"}
                >
                  <span className="material-icons text-base md:text-lg">
                    {showCardNumber ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {hasCardNumberError && !isDuplicateCardNumber && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Card number must be at least 16 digits
              </div>
            )}
            {isDuplicateCardNumber && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Card number already exists
              </div>
            )}
          </div>

          {/* Expiry Date with Month/Year Selectors */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              EXPIRY_DATE *
            </label>
            <div className="flex gap-2 items-center">
              {/* Month Select */}
              <div className="flex-1 relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full bg-black border border-cyan-500/60 text-white font-mono text-sm px-3 py-2 pl-8 focus:outline-none focus:border-pink-500 transition-all duration-200 appearance-none"
                >
                  
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, "0");
                    const monthNames = [
                      "JAN",
                      "FEB",
                      "MAR",
                      "APR",
                      "MAY",
                      "JUN",
                      "JUL",
                      "AUG",
                      "SEP",
                      "OCT",
                      "NOV",
                      "DEC",
                    ];
                    return (
                      <option key={month} value={month} className="text-white">
                        {month} - {monthNames[i]}
                      </option>
                    );
                  })}
                </select>
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400 pointer-events-none">
                  <span className="material-icons text-sm">date_range</span>
                </span>
              </div>

              <span className="text-cyan-400 font-mono text-lg">/</span>

              {/* Year Select */}
              <div className="flex-1 relative">
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full bg-black border border-cyan-500/60 text-white font-mono text-sm px-3 py-2 pl-8 focus:outline-none focus:border-pink-500 transition-all duration-200 appearance-none"
                >
                  
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i)
                      .toString()
                      .slice(-2);
                    return (
                      <option key={year} value={year} className="text-white">
                        20{year}
                      </option>
                    );
                  })}
                </select>
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400 pointer-events-none">
                  <span className="material-icons text-sm">schedule</span>
                </span>
              </div>
            </div>
            {hasExpiryError && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Both month and year are required
              </div>
            )}
          </div>

          {/* CVV */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              CVV *
            </label>
            <div className="relative">
              <input
                type={showCVV ? "text" : "password"}
                placeholder="XXX"
                value={editedCard.cvv}
                onChange={(e) => handleFieldChange("cvv", e.target.value)}
                maxLength={4}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 pr-20 md:pr-24"
                required
              />
              <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={() => setShowCVV(!showCVV)}
                  className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                  title={showCVV ? "HIDE_CVV" : "SHOW_CVV"}
                >
                  <span className="material-icons text-base md:text-lg">
                    {showCVV ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {hasCVVError && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * CVV is required
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              SECURITY_NOTES
            </label>
            <textarea
              placeholder="ENTER_CARD_SECURITY_NOTES"
              value={editedCard.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows="3"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 resize-y min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
            {/* Save button now takes full width on desktop, Cancel only on mobile */}
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`flex-1 py-2 md:py-3 font-bold font-mono transition-all duration-200 border relative overflow-hidden group ${
                !isSaveDisabled
                  ? "bg-black border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
                  : "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
              }`}
              title={
                isDuplicateCardNumber
                  ? "CARD_NUMBER_ALREADY_EXISTS"
                  : !hasChanges
                  ? "NO_CHANGES_DETECTED"
                  : isSaveDisabled
                  ? "MISSING_REQUIRED_FIELDS"
                  : "COMMIT_CHANGES"
              }
            >
              <span className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                <span className="material-icons text-base md:text-lg">
                  {!isSaveDisabled ? "save" : "block"}
                </span>
                <span className="hidden sm:inline">
                  {isDuplicateCardNumber
                    ? "DUPLICATE_CARD"
                    : !hasChanges
                    ? "NO_CHANGES"
                    : !isSaveDisabled
                    ? "COMMIT_CHANGES"
                    : "FIELDS_REQUIRED"}
                </span>
                <span className="sm:hidden">
                  {isDuplicateCardNumber
                    ? "DUPLICATE"
                    : !hasChanges
                    ? "NO_CHANGES"
                    : !isSaveDisabled
                    ? "SAVE"
                    : "REQUIRED"}
                </span>
              </span>
            </button>

            {/* ✅ UPDATED: Cancel button only visible on mobile */}
            <button
              onClick={handleCancel}
              className="flex-1 py-2 md:py-3 bg-black border border-pink-600 text-pink-400 font-mono hover:bg-pink-600 hover:text-black transition-all duration-200 flex items-center justify-center gap-1 md:gap-2 group md:hidden"
              title="ABORT_OPERATION"
            >
              <span className="material-icons text-base md:text-lg group-hover:scale-110 transition-transform">
                close
              </span>
              <span className="hidden sm:inline">ABORT</span>
              <span className="sm:hidden">CANCEL</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-black/80 border border-cyan-400/30 text-cyan-300 font-mono text-xs">
            <div className="flex items-start gap-2 md:gap-3 mb-2">
              <span className="material-icons text-cyan-400 text-sm md:text-base flex-shrink-0">
                security
              </span>
              <div>
                <span className="text-pink-400 font-bold">SECURITY:</span> All
                card data is encrypted before storage
              </div>
            </div>
            <div className="flex items-start gap-2 md:gap-3 mb-2">
              <span className="material-icons text-cyan-400 text-sm md:text-base flex-shrink-0">
                edit
              </span>
              <div>
                <span className="text-pink-400 font-bold">REQUIRED:</span>{" "}
                TITLE, CARDHOLDER, NUMBER, EXPIRY, CVV
              </div>
            </div>

            {!canUpdateCard() && hasChanges && (
              <div className="flex items-start gap-2 md:gap-3 pt-2 border-t border-cyan-400/20 text-red-400">
                <span className="material-icons text-sm md:text-base flex-shrink-0">
                  warning
                </span>
                <div className="text-xs">
                  <span className="font-bold">MISSING:</span>
                  {isDuplicateCardNumber
                    ? " • DUPLICATE_CARD"
                    : ` ${getMissingFields().join(" • ")}`}
                </div>
              </div>
            )}

            {!hasChanges && (
              <div className="flex items-start gap-2 md:gap-3 pt-2 border-t border-cyan-400/20 text-cyan-400">
                <span className="material-icons text-sm md:text-base flex-shrink-0">
                  info
                </span>
                <div className="text-xs">
                  <span className="font-bold">STATUS:</span> No changes
                  detected. Modify any field to enable commit.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
