import { useState, useCallback, useMemo } from "react";

// Constants
const COPY_FEEDBACK_DURATION = 2000;

export default function CardItem({
  card,
  visibleCardDetails = {},
  onToggleVisibility,
  onCopy,
  onEdit,
  onRemove,
  isEditing = false,
}) {
  const [copyFeedback, setCopyFeedback] = useState("");

  // Memoized field visibility states
  const cardNumberVisible = useMemo(
    () => visibleCardDetails?.[card.id]?.cardNumber || false,
    [visibleCardDetails, card.id]
  );

  const cvvVisible = useMemo(
    () => visibleCardDetails?.[card.id]?.cvv || false,
    [visibleCardDetails, card.id]
  );

  // Memoized handlers
  const handleCopy = useCallback(
    (text) => {
      onCopy(text);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), COPY_FEEDBACK_DURATION);
    },
    [onCopy]
  );

  // Memoized card type detection
  const cardType = useMemo(() => {
    if (!card.cardNumber) return "CREDIT";
    const cleaned = String(card.cardNumber).replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "VISA";
    if (/^5[1-5]/.test(cleaned)) return "MASTERCARD";
    if (/^3[47]/.test(cleaned)) return "AMEX";
    if (/^6(?:011|5)/.test(cleaned)) return "DISCOVER";
    return "CREDIT";
  }, [card.cardNumber]);

  // Memoized display values
  const displayCardNumber = useMemo(() => {
    if (!card.cardNumber) return "•••• •••• •••• ••••";
    const cardNum = String(card.cardNumber);
    if (cardNumberVisible) {
      const digits = cardNum.replace(/\D/g, "");
      return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }
    return "•••• •••• •••• " + (cardNum.slice(-4) || "");
  }, [card.cardNumber, cardNumberVisible]);

  const displayCVV = useMemo(
    () => (cvvVisible ? card.cvv || "•••" : "•••"),
    [cvvVisible, card.cvv]
  );

  // Memoized toggle handlers
  const toggleCardNumber = useCallback(
    () => onToggleVisibility("cardNumber"),
    [onToggleVisibility]
  );

  const toggleCVV = useCallback(
    () => onToggleVisibility("cvv"),
    [onToggleVisibility]
  );

  // Memoized action handlers
  const handleRemove = useCallback(
    () => onRemove(card.id),
    [onRemove, card.id]
  );

  const handleEdit = useCallback(() => onEdit(card.id), [onEdit, card.id]);

  const copyCardNumber = useCallback(
    () => handleCopy(card.cardNumber),
    [handleCopy, card.cardNumber]
  );

  const copyCVV = useCallback(
    () => handleCopy(card.cvv),
    [handleCopy, card.cvv]
  );

  // If editing, the modal will be handled by the parent component
  if (isEditing) {
    return null;
  }

  return (
    <div className="bg-black/20 border border-cyan-400/50 rounded-none p-4 md:p-5 shadow-[0_0_15px_rgba(34,211,238,0.2)] relative group mt-3 transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] w-full max-w-5xl mx-auto">
      {/* Corner accents */}
      <CyberCorner position="topLeft" color="cyan" />
      <CyberCorner position="topRight" color="cyan" />
      <CyberCorner position="bottomLeft" color="pink" />
      <CyberCorner position="bottomRight" color="pink" />

      {/* Card Header */}
      <CardHeader
        title={card.title}
        cardType={cardType}
        copyFeedback={copyFeedback}
        onRemove={handleRemove}
        onEdit={handleEdit}
      />

      {/* Security Notes */}
      {card.notes && <SecurityNotes notes={card.notes} />}

      {/* Card Details */}
      <div className="space-y-4">
        <CardNumberField
          displayCardNumber={displayCardNumber}
          cardNumberVisible={cardNumberVisible}
          onToggleVisibility={toggleCardNumber}
          onCopy={copyCardNumber}
        />

        <CardholderField cardholderName={card.cardholderName} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExpiryField expiryDate={card.expiryDate} />
          <CVVField
            displayCVV={displayCVV}
            cvvVisible={cvvVisible}
            onToggleVisibility={toggleCVV}
            onCopy={copyCVV}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-components
const CyberCorner = ({ position, color }) => {
  const positions = {
    topLeft: "top-2 left-2 border-t border-l",
    topRight: "top-2 right-2 border-t border-r",
    bottomLeft: "bottom-2 left-2 border-b border-l",
    bottomRight: "bottom-2 right-2 border-b border-r",
  };

  const colors = {
    cyan: "border-cyan-400",
    pink: "border-pink-600",
  };

  return (
    <div
      className={`absolute w-3 h-3 ${positions[position]} ${colors[color]}`}
    />
  );
};

const CardHeader = ({ title, cardType, copyFeedback, onRemove, onEdit }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <h3 className="text-cyan-400 font-mono text-lg md:text-xl truncate">
        {title}
      </h3>
      <span className="text-pink-400 text-xs bg-pink-900/30 px-2 py-1 border border-pink-600/50 font-mono flex-shrink-0">
        {cardType}
      </span>
      {copyFeedback && (
        <div className="bg-green-900/100 text-white font-mono text-xs px-2 py-1 border border-green-400 animate-pulse">
          {copyFeedback}
        </div>
      )}
    </div>
    <ActionButtons onRemove={onRemove} onEdit={onEdit} />
  </div>
);

const ActionButtons = ({ onRemove, onEdit }) => (
  <div className="flex gap-1 flex-shrink-0 ml-3">
    <ActionButton
      onClick={onRemove}
      icon="delete"
      title="DELETE_CARD"
      color="red"
    />
    <ActionButton
      onClick={onEdit}
      icon="edit"
      title="MODIFY_CARD"
      color="cyan"
    />
  </div>
);

const ActionButton = ({ onClick, icon, title, color }) => {
  const colorClasses = {
    red: "border-red-500 text-red-400 hover:bg-red-500 hover:text-black",
    cyan: "border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-black border transition-all duration-200 p-1 md:p-1.5 flex items-center justify-center group ${colorClasses[color]}`}
      title={title}
    >
      <span className="material-icons text-sm group-hover:scale-110 transition-transform">
        {icon}
      </span>
    </button>
  );
};

const SecurityNotes = ({ notes }) => (
  <div className="mb-4 p-3 bg-black/60 border border-cyan-400/30 rounded-none">
    <div className="text-cyan-400 font-mono text-sm flex items-start gap-2">
      <span className="material-icons text-cyan-400 text-base flex-shrink-0 mt-0.5">
        notes
      </span>
      <span className="text-cyan-300 whitespace-pre-wrap">{notes}</span>
    </div>
  </div>
);

const CardNumberField = ({
  displayCardNumber,
  cardNumberVisible,
  onToggleVisibility,
  onCopy,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <FieldLabel
      icon="credit_card"
      desktopText="CARD NUMBER:"
      mobileText="CARD:"
    />
    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex-1 flex items-center gap-2">
        <CodeField value={displayCardNumber} trackingWidest />
        <div className="flex gap-2 flex-shrink-0">
          <VisibilityToggle
            isVisible={cardNumberVisible}
            onToggle={onToggleVisibility}
            title={cardNumberVisible ? "HIDE_CARD" : "SHOW_CARD"}
          />
          <CopyButton onCopy={onCopy} title="COPY_FULL_NUMBER" />
        </div>
      </div>
    </div>
  </div>
);

const CardholderField = ({ cardholderName }) => (
  <div className="flex items-center gap-3">
    <FieldLabel icon="person" text="HOLDER:" />
    <CodeField value={cardholderName || "NO NAME"} />
  </div>
);

const ExpiryField = ({ expiryDate }) => (
  <div className="flex items-center gap-3">
    <FieldLabel icon="event" text="EXPIRES:" minWidth="min-w-[80px]" />
    <CodeField value={expiryDate || "••/••"} center trackingWidest />
  </div>
);

const CVVField = ({ displayCVV, cvvVisible, onToggleVisibility, onCopy }) => (
  <div className="flex items-center gap-3">
    <FieldLabel icon="lock" text="CVV:" minWidth="min-w-[80px]" />
    <div className="flex-1 flex items-center gap-3">
      <CodeField value={displayCVV} center />
      <div className="flex gap-2 flex-shrink-0">
        <VisibilityToggle
          isVisible={cvvVisible}
          onToggle={onToggleVisibility}
          title={cvvVisible ? "HIDE_CVV" : "SHOW_CVV"}
        />
        <CopyButton onCopy={onCopy} title="COPY_CVV" showText />
      </div>
    </div>
  </div>
);

const FieldLabel = ({
  icon,
  desktopText,
  mobileText,
  text,
  minWidth = "min-w-[100px]",
}) => (
  <span
    className={`text-cyan-400 flex items-center gap-2 font-mono text-base flex-shrink-0 ${minWidth}`}
  >
    <span className="material-icons text-cyan-400 text-lg">{icon}</span>
    {desktopText ? (
      <>
        <span className="hidden sm:inline">{desktopText}</span>
        <span className="sm:hidden">{mobileText}</span>
      </>
    ) : (
      <span>{text}</span>
    )}
  </span>
);

const CodeField = ({ value, center = false, trackingWidest = false }) => (
  <code
    className={`flex-1 bg-black/60 border border-cyan-400/30 px-4 py-2 text-cyan-300 font-mono text-base truncate min-h-[44px] flex items-center ${
      center ? "justify-center" : ""
    } ${trackingWidest ? "tracking-widest" : ""}`}
  >
    {value}
  </code>
);

const VisibilityToggle = ({ isVisible, onToggle, title }) => (
  <IconButton
    onClick={onToggle}
    icon={isVisible ? "visibility_off" : "visibility"}
    title={title}
    color="pink"
  />
);

const CopyButton = ({ onCopy, title, showText = false }) => (
  <IconButton
    onClick={onCopy}
    icon="content_copy"
    title={title}
    color={showText ? "pink" : "cyan"}
    showText={showText}
  />
);

const IconButton = ({ onClick, icon, title, color, showText = false }) => {
  const colorClasses = {
    cyan: "border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black",
    pink: "border-pink-600 text-pink-400 hover:bg-pink-600/20",
  };

  const sizeClasses = showText
    ? "px-2 py-2 gap-2 font-mono text-sm"
    : "p-2 min-w-[44px] min-h-[44px]";

  return (
    <button
      onClick={onClick}
      className={`bg-black border transition-all duration-200 flex items-center group justify-center ${colorClasses[color]} ${sizeClasses}`}
      title={title}
    >
      <span className="material-icons text-base group-hover:scale-110 transition-transform">
        {icon}
      </span>
      {showText && <span className="hidden sm:inline">COPY</span>}
    </button>
  );
};
