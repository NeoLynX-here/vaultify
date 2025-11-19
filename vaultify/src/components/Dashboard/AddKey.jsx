import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator.jsx";
import PasswordGenerator from "./PasswordGenerator.jsx";

// Constants
const FORM_FIELDS = [
  { key: "title", label: "ENTRY_TITLE", type: "text", required: true },
  { key: "username", label: "USER_IDENTITY", type: "text", required: true },
  {
    key: "password",
    label: "ENCRYPTION_KEY",
    type: "password",
    required: true,
  },
  { key: "link", label: "ACCESS_PORTAL", type: "url", required: false },
];

const EMPTY_ITEM = {
  title: "",
  username: "",
  password: "",
  link: "",
  notes: "",
};

// Memoized Cyber Corner Component
const CyberCorner = memo(({ position, color }) => {
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
});

CyberCorner.displayName = "CyberCorner";

// Memoized Form Field Component
const FormField = memo(
  ({
    field,
    value,
    onChange,
    onKeyPress,
    showPassword,
    onTogglePassword,
    onOpenGenerator,
    passwordStrength,
  }) => {
    const { key, label, type, required } = field;

    const handleChange = useCallback(
      (e) => {
        onChange(key, e.target.value);
      },
      [key, onChange]
    );

    const isPasswordField = key === "password";

    return (
      <div className="group">
        <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase group-focus-within:text-pink-400 transition-colors duration-200">
          {label}
          {required && <span className="text-pink-600 ml-1">*</span>}
        </label>

        {isPasswordField ? (
          <PasswordField
            value={value}
            onChange={handleChange}
            onKeyPress={onKeyPress}
            showPassword={showPassword}
            onTogglePassword={onTogglePassword}
            onOpenGenerator={onOpenGenerator}
            required={required}
          />
        ) : (
          <input
            type={type}
            placeholder={`ENTER_${label}`}
            value={value}
            onChange={handleChange}
            onKeyPress={onKeyPress}
            className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            required={required}
          />
        )}

        {isPasswordField && value && (
          <div className="mt-2 md:mt-3">
            <PasswordStrengthIndicator passwordStrength={passwordStrength} />
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Memoized Password Field Component
const PasswordField = memo(
  ({
    value,
    onChange,
    onKeyPress,
    showPassword,
    onTogglePassword,
    onOpenGenerator,
    required,
  }) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder="ENTER_ENCRYPTION_KEY"
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)] pr-20 md:pr-24"
        required={required}
      />
      <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
        <button
          type="button"
          onClick={onOpenGenerator}
          className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
          title="GENERATE_SECURE_KEY"
        >
          <span className="material-icons text-base md:text-lg">key</span>
        </button>
        <button
          type="button"
          onClick={onTogglePassword}
          className="text-cyan-400 hover:text-pink-400 transition-colors duration-200"
          title={showPassword ? "HIDE_KEY" : "REVEAL_KEY"}
        >
          <span className="material-icons text-base md:text-lg">
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  )
);

PasswordField.displayName = "PasswordField";

// Memoized Action Button Component
const ActionButton = memo(
  ({ type, onClick, disabled, isValid, label, mobileLabel, icon }) => {
    const isPrimary = type === "primary";

    const baseClasses =
      "flex-1 py-2 md:py-3 font-bold font-mono transition-all duration-200 border relative overflow-hidden group flex items-center justify-center gap-1 md:gap-2";

    const primaryClasses = isValid
      ? "bg-black border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-pink-600/10 hover:border-pink-600 text-cyan-400 hover:text-pink-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.4)]"
      : "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed";

    const secondaryClasses =
      "bg-black border border-pink-600 text-pink-400 hover:bg-pink-600 hover:text-black";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${
          isPrimary ? primaryClasses : secondaryClasses
        }`}
        title={
          isPrimary
            ? isValid
              ? "COMMIT_TO_VAULT"
              : "MISSING_REQUIRED_FIELDS"
            : "ABORT_OPERATION"
        }
      >
        <span className="material-icons text-base md:text-lg group-hover:scale-110 transition-transform">
          {icon}
        </span>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{mobileLabel}</span>
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

// Memoized Info Item Component
const InfoItem = memo(({ icon, children }) => (
  <div className="flex items-start gap-2 md:gap-3 mb-2">
    <span className="material-icons text-cyan-400 text-sm md:text-base flex-shrink-0">
      {icon}
    </span>
    <div className="text-xs">{children}</div>
  </div>
));

InfoItem.displayName = "InfoItem";

// Main Component
export default function AddItems({
  newItem,
  setNewItem,
  passwordStrength,
  onAdd,
  onCancel,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const closeBtnRef = useRef(null);

  // Memoized computed values
  const isFormValid = useMemo(
    () =>
      newItem.title?.trim() &&
      newItem.username?.trim() &&
      newItem.password?.trim(),
    [newItem.title, newItem.username, newItem.password]
  );

  const missingFields = useMemo(() => {
    const fields = [];
    if (!newItem.title?.trim()) fields.push("TITLE");
    if (!newItem.username?.trim()) fields.push("USER");
    if (!newItem.password?.trim()) fields.push("PASSWORD");
    return fields;
  }, [newItem.title, newItem.username, newItem.password]);

  // Memoized callbacks
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && isFormValid) {
        onAdd();
      }
    },
    [isFormValid, onAdd]
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      setNewItem((prev) => ({ ...prev, [field]: value }));
    },
    [setNewItem]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const openPasswordGenerator = useCallback(() => {
    setShowPasswordGenerator(true);
  }, []);

  const handlePasswordGenerated = useCallback(
    (generatedPassword) => {
      setNewItem((prev) => ({ ...prev, password: generatedPassword }));
      setShowPasswordGenerator(false);
    },
    [setNewItem]
  );

  const closePasswordGenerator = useCallback(() => {
    setShowPasswordGenerator(false);
  }, []);

  // Accessibility: Lock scroll and close with ESC
  useEffect(() => {
    if (!showPasswordGenerator) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") {
        closePasswordGenerator();
      }
    };

    window.addEventListener("keydown", handleKey);
    setTimeout(() => closeBtnRef.current?.focus(), 100);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [showPasswordGenerator, closePasswordGenerator]);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn p-2 md:p-0"
      role="dialog"
      aria-modal="true"
    >
      {/* Password Generator Modal */}
      {showPasswordGenerator && (
        <div className="absolute inset-0 flex justify-center items-center z-60 p-2 md:p-0">
          <div className="relative w-full max-w-md mx-2 md:mx-4 animate-fadeIn">
            <PasswordGenerator
              mode="default"
              onPasswordGenerated={handlePasswordGenerated}
            />
            <button
              ref={closeBtnRef}
              onClick={closePasswordGenerator}
              className="absolute -top-2 md:-top-4 -right-2 md:-right-4 text-cyan-400 hover:text-pink-400 transition-colors duration-200 bg-black border border-cyan-400 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
              title="CLOSE_GENERATOR"
              aria-label="Close generator"
            >
              <span className="material-icons text-base md:text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Add Form */}
      <div
        className={`relative bg-black/70 border border-cyan-400/50 p-4 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.4)] w-full max-w-lg mx-2 md:mx-4 max-h-[90vh] overflow-y-auto group backdrop-blur-sm ${
          showPasswordGenerator ? "opacity-20 pointer-events-none" : ""
        }`}
      >
        {/* Cyber corners */}
        <CyberCorner position="topLeft" color="cyan" />
        <CyberCorner position="topRight" color="cyan" />
        <CyberCorner position="bottomLeft" color="pink" />
        <CyberCorner position="bottomRight" color="pink" />

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
              add_circle
            </span>
            <span className="hidden sm:inline">CREATE_NEW_ENTRY</span>
            <span className="sm:hidden">NEW_ENTRY</span>
          </h2>
          <div className="h-px w-24 md:w-32 mx-auto bg-gradient-to-r from-cyan-400 to-pink-600 mt-2 md:mt-3 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
        </div>

        {/* Fields */}
        <div className="space-y-4 md:space-y-6">
          {FORM_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={newItem[field.key]}
              onChange={handleFieldChange}
              onKeyPress={handleKeyPress}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
              onOpenGenerator={openPasswordGenerator}
              passwordStrength={passwordStrength}
            />
          ))}

          {/* Notes as multiline textarea */}
          <div className="group">
            <label className="block text-cyan-400 font-mono text-xs md:text-sm mb-1 md:mb-3 tracking-wider uppercase">
              SECURITY_NOTES
            </label>
            <textarea
              placeholder="ENTER_SECURITY_NOTES"
              value={newItem.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows="3"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border border-cyan-500/60 focus:scale-[1.02] hover:scale-[1.01] focus:outline-none focus:border-pink-500 text-white font-mono text-sm transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:shadow-[0_0_20px_rgba(239,68,68,0.4)] resize-y min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* Buttons - Remove abort button on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
            <ActionButton
              type="primary"
              onClick={onAdd}
              disabled={!isFormValid}
              isValid={isFormValid}
              label={isFormValid ? "COMMIT_ENTRY" : "FIELDS_REQUIRED"}
              mobileLabel={isFormValid ? "ADD" : "REQUIRED"}
              icon={isFormValid ? "add_circle" : "block"}
            />

            {/* Cancel button only visible on mobile */}
            <ActionButton
              type="secondary"
              onClick={onCancel}
              label="ABORT"
              mobileLabel="CANCEL"
              icon="close"
              mobileOnly
            />
          </div>

          {/* Info */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-black/80 border border-cyan-400/30 text-cyan-300 font-mono text-xs">
            <InfoItem icon="info">
              <span className="text-pink-400 font-bold">REQUIRED:</span> TITLE,
              USER, PASSWORD
            </InfoItem>

            <InfoItem icon="key">
              <span className="text-pink-400 font-bold">TIP:</span> Use key icon
              for secure passwords.
            </InfoItem>

            {missingFields.length > 0 && (
              <div className="flex items-start gap-2 md:gap-3 pt-2 border-t border-cyan-400/20 text-red-400">
                <span className="material-icons text-sm md:text-base flex-shrink-0">
                  warning
                </span>
                <div className="text-xs">
                  <span className="font-bold">MISSING:</span>{" "}
                  {missingFields.join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
