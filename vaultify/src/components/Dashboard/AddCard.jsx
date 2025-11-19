// components/Dashboard/AddCardModal.jsx
import { useState, useEffect, useCallback } from "react";

export default function AddCardModal({
  newCard,
  setNewCard,
  onAdd,
  onCancel,
  existingCards = [],
  cardLogic,
}) {
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Move isFormValidFallback to the top to avoid TDZ issues
  const isFormValidFallback = useCallback(() => {
    return (
      newCard.title?.trim() &&
      newCard.cardholderName?.trim() &&
      newCard.cardNumber?.replace(/\s/g, "").length >= 16 &&
      newCard.expiryDate?.length === 5 &&
      newCard.cvv?.length >= 3
    );
  }, [newCard]);

  // Use cardLogic helpers
  const { formatCardNumber, getCardType, canSaveCard, EMPTY_CARD } =
    cardLogic || {};

  //: Initialize with cardLogic helpers or fallbacks
  const formatCardNumberDisplay = useCallback(
    (value) => {
      return formatCardNumber
        ? formatCardNumber(value)
        : (() => {
            if (!value) return "";
            const digits = value.replace(/\D/g, "");
            return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
          })();
    },
    [formatCardNumber]
  );

  const getCardTypeDisplay = useCallback(
    (number) => {
      return getCardType
        ? getCardType(number)
        : (() => {
            if (!number) return "CARD";
            const cleaned = number.replace(/\s/g, "");
            if (/^4/.test(cleaned)) return "VISA";
            if (/^5[1-5]/.test(cleaned)) return "MASTERCARD";
            if (/^3[47]/.test(cleaned)) return "AMEX";
            if (/^6(?:011|5)/.test(cleaned)) return "DISCOVER";
            return "CARD";
          })();
    },
    [getCardType]
  );

  // Check for duplicate card number
  const isDuplicateCardNumber = useCallback(() => {
    return existingCards.some(
      (card) => card.cardNumber === newCard.cardNumber?.replace(/\s/g, "")
    );
  }, [existingCards, newCard.cardNumber]);

  // Use cardLogic validation AND check for duplicates
  const canAddCard = useCallback(() => {
    // First check for duplicates - if duplicate, immediately return false
    if (isDuplicateCardNumber()) {
      return false;
    }

    // Then check other validation
    return cardLogic
      ? canSaveCard(newCard, existingCards)
      : isFormValidFallback();
  }, [
    cardLogic,
    canSaveCard,
    newCard,
    existingCards,
    isDuplicateCardNumber,
    isFormValidFallback,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && canAddCard()) {
        onAdd();
      }
    },
    [canAddCard, onAdd]
  );

  // Handle field changes properly
  const handleFieldChange = useCallback(
    (field, value) => {
      if (field === "cardNumber" || field === "cvv") {
        // For numeric fields, only allow digits
        const numericValue = value.replace(/\D/g, "");
        setNewCard((prev) => ({ ...prev, [field]: numericValue }));
      } else {
        setNewCard((prev) => ({ ...prev, [field]: value }));
      }
    },
    [setNewCard]
  );

  // Proper card number formatting
  const handleCardNumberChange = useCallback(
    (value) => {
      const formatted = formatCardNumberDisplay(value);
      handleFieldChange("cardNumber", formatted.replace(/\s/g, "")); // Store without spaces
    },
    [formatCardNumberDisplay, handleFieldChange]
  );

  // Month and year handlers
  const handleMonthChange = useCallback(
    (month) => {
      setSelectedMonth(month);
      if (month && selectedYear) {
        setNewCard((prev) => ({
          ...prev,
          expiryDate: `${month}/${selectedYear}`,
        }));
      }
    },
    [selectedYear, setNewCard]
  );

  const handleYearChange = useCallback(
    (year) => {
      setSelectedYear(year);
      if (selectedMonth && year) {
        setNewCard((prev) => ({
          ...prev,
          expiryDate: `${selectedMonth}/${year}`,
        }));
      }
    },
    [selectedMonth, setNewCard]
  );

  // Reset form when modal opens
  useEffect(() => {
    if (cardLogic && EMPTY_CARD) {
      setNewCard(EMPTY_CARD);
    }
    setSelectedMonth("");
    setSelectedYear("");
  }, [cardLogic, EMPTY_CARD, setNewCard]);

  const toggleCardNumberVisibility = useCallback(() => {
    setShowCardNumber((prev) => !prev);
  }, []);

  const toggleCVVVisibility = useCallback(() => {
    setShowCVV((prev) => !prev);
  }, []);

  // Get missing fields for error display
  const getMissingFields = useCallback(() => {
    const missing = [];

    // Proper condition checking
    if (!newCard.title?.trim()) missing.push("TITLE");
    if (!newCard.cardholderName?.trim()) missing.push("CARDHOLDER");

    // Check if card number has at least 16 digits
    const cardNumberDigits = newCard.cardNumber?.replace(/\s/g, "") || "";
    if (cardNumberDigits.length < 16) missing.push("CARD_NUMBER");

    // Check if expiry date is exactly 5 characters (MM/YY)
    if (!newCard.expiryDate || newCard.expiryDate.length !== 5)
      missing.push("EXPIRY");

    // Check if CVV has at least 3 digits
    if (!newCard.cvv || newCard.cvv.length < 3) missing.push("CVV");

    return missing;
  }, [newCard]);

  // Accessibility: Close with ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  // Precompute values for rendering
  const duplicateCard = isDuplicateCardNumber();
  const canSubmit = canAddCard();
  const missingFields = getMissingFields();
  const cardType = getCardTypeDisplay(newCard.cardNumber);
  const formattedCardNumber = formatCardNumberDisplay(newCard.cardNumber);

  const buttonText = duplicateCard
    ? "DUPLICATE_CARD"
    : canSubmit
    ? "ENCRYPT_CARD"
    : "FIELDS_REQUIRED";

  const buttonIcon = canSubmit ? "enhanced_encryption" : "block";

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn p-2 md:p-0"
      role="dialog"
      aria-modal="true"
    >
      {/* Main Add Card Form */}
      <div className="relative bg-black/70 border border-cyan-400/50 p-4 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.4)] w-full max-w-lg mx-2 md:mx-4 max-h-[90vh] overflow-y-auto group backdrop-blur-sm">
        {/* Cyber corners */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-600"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-600"></div>

        {/* Desktop Close Button - Top Right */}
        <button
          onClick={onCancel}
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
              credit_card
            </span>
            <span className="hidden sm:inline">SECURE_CARD_ENTRY</span>
            <span className="sm:hidden">NEW_CARD</span>
          </h2>
          <div className="h-px w-24 md:w-32 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 mt-2 md:mt-3 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
        </div>

        {/* Card Preview */}
        {newCard.cardNumber && (
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
                ? formattedCardNumber
                : "•••• •••• •••• " + (newCard.cardNumber.slice(-4) || "")}
            </div>
            <div className="flex justify-between text-cyan-300 font-mono text-xs">
              <span>{newCard.cardholderName || "CARDHOLDER"}</span>
              <span>{newCard.expiryDate || "MM/YY"}</span>
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
              value={newCard.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200"
              required
            />
            {!newCard.title?.trim() && (
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
              value={newCard.cardholderName}
              onChange={(e) =>
                handleFieldChange("cardholderName", e.target.value)
              }
              onKeyPress={handleKeyPress}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200"
              required
            />
            {!newCard.cardholderName?.trim() && (
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
                value={formattedCardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={19}
                className={`w-full px-3 md:px-4 py-2 md:py-3 bg-black border text-white font-mono text-sm transition-all duration-200 pr-20 md:pr-24 tracking-wider focus:outline-none ${
                  duplicateCard
                    ? "border-red-500 focus:border-red-500"
                    : "border-cyan-500/60 focus:border-pink-500"
                }`}
                required
              />
              <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={toggleCardNumberVisibility}
                  className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                  title={showCardNumber ? "HIDE_CARD" : "SHOW_CARD"}
                >
                  <span className="material-icons text-base md:text-lg">
                    {showCardNumber ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {!newCard.cardNumber?.trim() && (
              <div className="text-red-400 font-mono text-xs mt-1">
                * Card number is required
              </div>
            )}
            {duplicateCard && (
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
                  <option value="" className="text-cyan-400/60">
                    MONTH
                  </option>
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
                  <option value="" className="text-cyan-400/60">
                    YEAR
                  </option>
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
            {(!selectedMonth || !selectedYear) && (
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
                value={newCard.cvv}
                onChange={(e) => handleFieldChange("cvv", e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={4}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 pr-20 md:pr-24"
                required
              />
              <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={toggleCVVVisibility}
                  className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
                  title={showCVV ? "HIDE_CVV" : "SHOW_CVV"}
                >
                  <span className="material-icons text-base md:text-lg">
                    {showCVV ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            {!newCard.cvv?.trim() && (
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
              value={newCard.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows="3"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 resize-y min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
            {/* Add button now takes full width on desktop, Cancel only on mobile */}
            <button
              onClick={onAdd}
              disabled={!canSubmit}
              className={`flex-1 py-2 md:py-3 font-bold font-mono transition-all duration-200 border relative overflow-hidden group ${
                canSubmit
                  ? "bg-black border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
                  : "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
              }`}
              title={
                duplicateCard
                  ? "CARD_NUMBER_ALREADY_EXISTS"
                  : !canSubmit
                  ? "MISSING_REQUIRED_FIELDS"
                  : "ENCRYPT_AND_STORE_CARD"
              }
            >
              <span className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                <span className="material-icons text-base md:text-lg">
                  {buttonIcon}
                </span>
                <span className="hidden sm:inline">{buttonText}</span>
                <span className="sm:hidden">
                  {duplicateCard ? "DUPLICATE" : canSubmit ? "ADD" : "REQUIRED"}
                </span>
              </span>
            </button>

            {/* Cancel button only visible on mobile */}
            <button
              onClick={onCancel}
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
                credit_card
              </span>
              <div>
                <span className="text-pink-400 font-bold">REQUIRED:</span>{" "}
                TITLE, CARDHOLDER, NUMBER, EXPIRY, CVV
              </div>
            </div>

            {!canSubmit && (
              <div className="flex items-start gap-2 md:gap-3 pt-2 border-t border-cyan-400/20 text-red-400">
                <span className="material-icons text-sm md:text-base flex-shrink-0">
                  warning
                </span>
                <div className="text-xs">
                  <span className="font-bold">MISSING:</span>
                  {duplicateCard
                    ? " • DUPLICATE_CARD"
                    : ` ${missingFields.join(" • ")}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
