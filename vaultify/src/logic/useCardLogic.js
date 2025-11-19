import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  encryptCardFields,
  decryptCardFields,
  isEncryptedFieldShape,
} from "../crypto/crypto.js";
import { API_BASE } from "../util/api";

// Constants
const SAVE_DEBOUNCE_MS = 5000;
const AUTO_SAVE_DELAY_MS = 1000;
const LOGIN_BLOCK_TIME_MS = 3000;
const ERROR_DISPLAY_TIME_MS = 2000;

const EMPTY_CARD = {
  title: "",
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  notes: "",
};

const CARD_FIELDS = [
  "cardholderName",
  "cardNumber",
  "expiryDate",
  "cvv",
  "title",
  "notes",
];

// Helper functions
const generateCardId = () =>
  `card-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const normalizeCard = (card) => ({
  id: card.id || generateCardId(),
  title: card.title?.toString()?.trim() || "",
  cardholderName: card.cardholderName?.toString()?.trim() || "",
  cardNumber: card.cardNumber?.toString()?.replace(/\s/g, "") || "",
  expiryDate: card.expiryDate?.toString() || "",
  cvv: card.cvv?.toString() || "",
  notes: card.notes?.toString()?.trim() || "",
  created_at: card.created_at || new Date().toISOString(),
  updated_at: card.updated_at || new Date().toISOString(),
});

const validateCard = (card, existingCards = []) => {
  const errors = [];

  // Required field validation
  if (!card.title?.trim()) errors.push("Card title is required");
  if (!card.cardholderName?.trim()) errors.push("Cardholder name is required");

  const cleanCardNumber = card.cardNumber?.replace(/\s/g, "") || "";
  if (!cleanCardNumber || cleanCardNumber.length < 16) {
    errors.push("Card number must be at least 16 digits");
  }

  if (!card.expiryDate || card.expiryDate.length !== 5) {
    errors.push("Valid expiry date (MM/YY) is required");
  }

  if (!card.cvv || card.cvv.length < 3) {
    errors.push("CVV must be at least 3 digits");
  }

  // Duplicate validation
  const isDuplicate = isDuplicateCard(card, existingCards);
  if (isDuplicate) errors.push("Card number already exists");

  return { isValid: errors.length === 0, errors, isDuplicate };
};

const isDuplicateCard = (card, existingCards = []) => {
  if (!card.cardNumber || existingCards.length === 0) return false;

  const cleanNewCardNumber = card.cardNumber.replace(/\s/g, "");

  return existingCards.some((existingCard) => {
    if (card.id && existingCard.id === card.id) return false;
    const cleanExistingCardNumber =
      existingCard.cardNumber?.replace(/\s/g, "") || "";
    return cleanExistingCardNumber === cleanNewCardNumber;
  });
};

const canSaveCard = (card, existingCards = []) => {
  const validation = validateCard(card, existingCards);
  return validation.isValid && !validation.isDuplicate;
};

const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return "";
  const digits = cardNumber.replace(/\D/g, "");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

const getCardType = (cardNumber) => {
  if (!cardNumber) return "CARD";
  const cleaned = cardNumber.replace(/\s/g, "");

  if (/^4/.test(cleaned)) return "VISA";
  if (/^5[1-5]/.test(cleaned)) return "MASTERCARD";
  if (/^3[47]/.test(cleaned)) return "AMEX";
  if (/^6(?:011|5)/.test(cleaned)) return "DISCOVER";
  if (/^(?:2131|1800|35)/.test(cleaned)) return "JCB";
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return "DINERS";

  return "CARD";
};

// Custom hook for error management
const useErrorManager = (setError) => {
  const errorTimeoutRef = useRef();

  const showMessage = useCallback(
    (message) => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      setError(message);

      errorTimeoutRef.current = setTimeout(() => {
        setError("");
      }, ERROR_DISPLAY_TIME_MS);
    },
    [setError]
  );

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return showMessage;
};

// API functions
const useCardAPI = (vaultKey, token, navigate, showMessage) => {
  const saveCardsToAPI = useCallback(
    async (cardsData, silent = false) => {
      try {
        const validCardItems = (cardsData.items || []).map(normalizeCard);
        if (validCardItems.length === 0) return true;

        const cardsToEncrypt = { ...cardsData, items: validCardItems };
        const encryptedCards = await encryptCardFields(
          cardsToEncrypt,
          vaultKey
        );

        const res = await fetch(`${API_BASE}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ encrypted_blob: encryptedCards }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            navigate("/login", { replace: true });
            return false;
          }
          throw new Error(`Card save failed: ${res.status}`);
        }

        if (!silent) {
          showMessage("Cards saved successfully!");
        }

        return true;
      } catch (err) {
        console.error("Save Cards Error:", err);
        if (!silent) {
          showMessage("Failed to save cards: " + err.message);
        }
        return false;
      }
    },
    [vaultKey, token, navigate, showMessage]
  );

  const loadCardsFromAPI = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        return data.encrypted_blob || { items: [] };
      } else if (res.status === 404) {
        return { items: [] };
      } else if (res.status === 401) {
        navigate("/login", { replace: true });
        return { items: [] };
      } else {
        throw new Error(`Failed to load cards: ${res.status}`);
      }
    } catch (err) {
      console.error("Load Cards API Error:", err);
      throw err;
    }
  }, [token, navigate]);

  return { saveCardsToAPI, loadCardsFromAPI };
};

export function useCardLogic(
  vaultKey,
  token,
  navigate,
  setError,
  initialLoadComplete,
  initialCards = { items: [] }
) {
  // State
  const [cards, setCards] = useState(initialCards);
  const [newCard, setNewCard] = useState(EMPTY_CARD);
  const [savingCards, setSavingCards] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [visibleCardDetails, setVisibleCardDetails] = useState({});
  const [editingCard, setEditingCard] = useState(null);

  // Refs
  const hasLoadedRef = useRef(false);
  const lastSaveRef = useRef(0);
  const cardsDataRef = useRef(initialCards);
  const isInitialLoadRef = useRef(true);
  const loginBlockRef = useRef(true);

  // Custom hooks
  const showMessage = useErrorManager(setError);
  const { saveCardsToAPI, loadCardsFromAPI } = useCardAPI(
    vaultKey,
    token,
    navigate,
    showMessage
  );

  // Memoized values
  const cardItems = useMemo(() => cards.items || [], [cards.items]);
  const hasVaultKey = !!vaultKey;
  const hasToken = !!token;

  // Keep ref in sync with current cards
  useEffect(() => {
    cardsDataRef.current = cards;
  }, [cards]);

  // Save cards function
  const saveCards = useCallback(
    async (silent = false) => {
      if (loginBlockRef.current || !hasVaultKey || !hasToken) {
        return false;
      }

      try {
        setSavingCards(true);
        const success = await saveCardsToAPI(cardsDataRef.current, silent);

        if (success) {
          lastSaveRef.current = Date.now();
        }

        return success;
      } finally {
        setSavingCards(false);
      }
    },
    [hasVaultKey, hasToken, saveCardsToAPI]
  );

  // Auto-save when cards change
  useEffect(() => {
    if (
      loginBlockRef.current ||
      isInitialLoadRef.current ||
      !hasVaultKey ||
      !hasToken ||
      cardItems.length === 0
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_DEBOUNCE_MS) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveCards(true).catch((err) =>
        console.error("Auto-save cards failed:", err)
      );
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [cardItems, hasVaultKey, hasToken, saveCards]);

  // Load and decrypt cards
  const loadCards = useCallback(async () => {
    if (!hasVaultKey || hasLoadedRef.current) return;

    try {
      setLoadingCards(true);

      let cardsData = { items: [] };

      if (initialCards?.items?.length > 0) {
        cardsData = initialCards;
      } else if (hasToken) {
        cardsData = await loadCardsFromAPI();
      }

      // Check if decryption is needed
      const needsDecryption = cardsData.items?.some((card) =>
        CARD_FIELDS.some((field) => isEncryptedFieldShape(card[field]))
      );

      let decryptedCards = cardsData;

      if (needsDecryption) {
        decryptedCards = await decryptCardFields(cardsData, vaultKey);
      }

      // Normalize and set cards
      decryptedCards.items = (decryptedCards.items || []).map(normalizeCard);

      setCards(decryptedCards);
      cardsDataRef.current = decryptedCards;
      hasLoadedRef.current = true;
      isInitialLoadRef.current = false;

      if (initialLoadComplete) {
        initialLoadComplete.current = true;
      }
    } catch (err) {
      console.error("Error loading cards:", err);
      showMessage("Failed to load cards: " + err.message);
      setCards({ items: [] });
      hasLoadedRef.current = true;
      isInitialLoadRef.current = false;
    } finally {
      setLoadingCards(false);
    }
  }, [
    hasVaultKey,
    hasToken,
    initialCards,
    loadCardsFromAPI,
    showMessage,
    initialLoadComplete,
    vaultKey,
  ]);

  // Load cards once when vaultKey is available
  useEffect(() => {
    if (hasVaultKey && !hasLoadedRef.current) {
      loadCards();
    }
  }, [hasVaultKey, loadCards]);

  // Lift login block and reset on vaultKey change
  useEffect(() => {
    hasLoadedRef.current = false;
    isInitialLoadRef.current = true;
    loginBlockRef.current = true;

    const timer = setTimeout(() => {
      loginBlockRef.current = false;
    }, LOGIN_BLOCK_TIME_MS);

    return () => clearTimeout(timer);
  }, [vaultKey]);

  // CRUD Operations
  const editCard = useCallback(
    (id) => {
      const cardToEdit = cardItems.find((card) => card.id === id);
      if (cardToEdit) {
        setEditingCard({ ...cardToEdit });
      }
    },
    [cardItems]
  );

  const updateCard = useCallback(
    (updatedCard) => {
      if (!updatedCard.title?.trim()) {
        showMessage("Please enter a title");
        return;
      }

      const isDuplicate = isDuplicateCard(updatedCard, cardItems);
      if (isDuplicate) {
        showMessage("Card number already exists");
        return;
      }

      const cleanUpdatedCard = normalizeCard({
        ...updatedCard,
        updated_at: new Date().toISOString(),
      });

      setCards((prev) => ({
        ...prev,
        items: cardItems.map((card) =>
          card.id === cleanUpdatedCard.id ? cleanUpdatedCard : card
        ),
      }));

      setEditingCard(null);
      showMessage("Card updated successfully!");
    },
    [cardItems, showMessage]
  );

  const cancelCardEdit = useCallback(() => {
    setEditingCard(null);
  }, []);

  const addCard = useCallback(() => {
    if (!newCard.title?.trim()) {
      showMessage("Please enter a title");
      return;
    }

    const isDuplicate = isDuplicateCard(newCard, cardItems);
    if (isDuplicate) {
      showMessage("Card number already exists");
      return;
    }

    const cleanCard = normalizeCard(newCard);

    setCards((prev) => ({
      ...prev,
      items: [...cardItems, cleanCard],
    }));

    setNewCard(EMPTY_CARD);
    setShowAddCardForm(false);
    showMessage("Card added successfully!");
  }, [newCard, cardItems, showMessage]);

  const removeCard = useCallback(
    (id) => {
      setCards((prev) => ({
        ...prev,
        items: cardItems.filter((card) => card.id !== id),
      }));

      setVisibleCardDetails((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      showMessage("Card removed successfully!");
    },
    [cardItems, showMessage]
  );

  const toggleCardDetailsVisibility = useCallback((id, field) => {
    setVisibleCardDetails((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field],
      },
    }));
  }, []);

  const openAddCardForm = useCallback(() => {
    setNewCard(EMPTY_CARD);
    setShowAddCardForm(true);
  }, []);

  const closeAddCardForm = useCallback(() => {
    setShowAddCardForm(false);
    setNewCard(EMPTY_CARD);
  }, []);

  const handleSetNewCard = useCallback((updates) => {
    if (typeof updates === "function") {
      setNewCard(updates);
    } else {
      setNewCard((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Manual save function
  const manualSaveCards = useCallback(async () => {
    return await saveCards(false);
  }, [saveCards]);

  // Helper functions for card validation and formatting
  const cardLogicHelpers = useMemo(
    () => ({
      validateCard: (card, existingCards = cardItems) =>
        validateCard(card, existingCards),
      isDuplicateCard: (card, existingCards = cardItems) =>
        isDuplicateCard(card, existingCards),
      canSaveCard: (card, existingCards = cardItems) =>
        canSaveCard(card, existingCards),
      formatCardNumber,
      getCardType,
      EMPTY_CARD,
    }),
    [cardItems]
  );

  // Memoized return object
  const cardLogic = useMemo(
    () => ({
      // State
      cards,
      newCard,
      setNewCard: handleSetNewCard,
      savingCards,
      loadingCards,
      showAddCardForm,
      setShowAddCardForm,
      visibleCardDetails,
      editingCard,
      setCards,

      // Functions
      saveCards: manualSaveCards,
      addCard,
      removeCard,
      loadCards,
      toggleCardDetailsVisibility,
      openAddCardForm,
      closeAddCardForm,
      editCard,
      updateCard,
      cancelCardEdit,

      // Card logic helpers
      ...cardLogicHelpers,
    }),
    [
      cards,
      newCard,
      savingCards,
      loadingCards,
      showAddCardForm,
      visibleCardDetails,
      editingCard,
      manualSaveCards,
      addCard,
      removeCard,
      loadCards,
      toggleCardDetailsVisibility,
      openAddCardForm,
      closeAddCardForm,
      editCard,
      updateCard,
      cancelCardEdit,
      handleSetNewCard,
      cardLogicHelpers,
    ]
  );

  return cardLogic;
}
