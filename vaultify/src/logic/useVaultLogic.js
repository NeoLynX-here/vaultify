import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  encryptVaultFields,
  decryptVaultFields,
  isEncryptedFieldShape,
} from "../crypto/crypto.js";
import { breachService } from "../services/breachDetection.js";
import { checkPasswordStrength } from "../util/passwordUtils.js";
import { API_BASE } from "../util/api";

// Constants
const SAVE_DEBOUNCE_MS = 3000;
const EMPTY_ITEM = {
  title: "",
  notes: "",
  link: "",
  username: "",
  password: "",
};

// Helper functions
const generateItemId = () =>
  `item-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const normalizeItem = (item) => ({
  id: item.id || generateItemId(),
  title: item.title?.toString()?.trim() || "",
  username: item.username?.toString()?.trim() || "",
  password: item.password?.toString() || "",
  link: item.link?.toString()?.trim() || "",
  notes: item.notes?.toString()?.trim() || "",
  created_at: item.created_at || new Date().toISOString(),
  updated_at: item.updated_at || new Date().toISOString(),
});

export function useVaultLogic(
  vaultKey,
  token,
  initialVault,
  navigate,
  setError,
  initialLoadComplete
) {
  // State
  const [vault, setVault] = useState({ items: [] });
  const [newItem, setNewItem] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "weak",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [breachResults, setBreachResults] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  // Refs
  const lastSaveRef = useRef(0);
  const hasAttemptedLoadRef = useRef(false);
  const recentOperationRef = useRef(false);
  const vaultItemsRef = useRef([]);

  // Memoized values
  const vaultItems = useMemo(() => vault.items || [], [vault.items]);
  const hasVaultKey = !!vaultKey;
  const hasToken = !!token;

  //  Update ref when vaultItems changes
  useEffect(() => {
    vaultItemsRef.current = vaultItems;
  }, [vaultItems]);

  //  Optimized error handler with debouncing
  const showVaultMessage = useCallback(
    (message) => {
      setError(message);
      setTimeout(() => setError(""), 2000);
    },
    [setError]
  );

  //  Save vault to backend with encryption - SILENT version
  const saveVaultSilent = useCallback(async () => {
    if (!hasVaultKey || !hasToken) {
      return false;
    }

    try {
      setSaving(true);

      const validVaultItems = vaultItemsRef.current.map(normalizeItem);
      const encryptedVault = await encryptVaultFields(
        { ...vault, items: validVaultItems },
        vaultKey
      );

      const res = await fetch(`${API_BASE}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ encrypted_blob: encryptedVault }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return false;
        }
        throw new Error(`Save failed: ${res.status}`);
      }

      console.log(" Vault saved silently");
      return true;
    } catch (err) {
      console.error(" Save Vault Error:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [vault, hasVaultKey, hasToken, vaultKey, token, navigate]);

  //  Save vault with message (for manual saves)
  const saveVaultWithMessage = useCallback(async () => {
    if (!hasVaultKey || !hasToken) {
      showVaultMessage("Not ready to save");
      return false;
    }

    try {
      setSaving(true);
      showVaultMessage("Saving vault...");

      const validVaultItems = vaultItemsRef.current.map(normalizeItem);
      const encryptedVault = await encryptVaultFields(
        { ...vault, items: validVaultItems },
        vaultKey
      );

      const res = await fetch(`${API_BASE}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ encrypted_blob: encryptedVault }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return false;
        }
        throw new Error(`Save failed: ${res.status}`);
      }

      showVaultMessage(" Vault saved successfully!");
      return true;
    } catch (err) {
      console.error(" Save Vault Error:", err);
      showVaultMessage("Failed to save vault: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    vault,
    hasVaultKey,
    hasToken,
    vaultKey,
    token,
    navigate,
    showVaultMessage,
  ]);

  //  Auto-save only when items actually change
  useEffect(() => {
    if (
      !hasVaultKey ||
      !initialLoadComplete.current ||
      vaultItems.length === 0
    ) {
      return;
    }

    // Don't auto-save immediately after user operations
    if (recentOperationRef.current) {
      recentOperationRef.current = false;
      return;
    }

    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_DEBOUNCE_MS) return;

    const timeoutId = setTimeout(() => {
      lastSaveRef.current = Date.now();
      saveVaultSilent().catch((err) =>
        console.error("Auto-save vault failed:", err)
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [vaultItems.length, hasVaultKey, saveVaultSilent, initialLoadComplete]);

  // Password strength check - Added debounce for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newItem.password) {
        setPasswordStrength(checkPasswordStrength(newItem.password));
      } else {
        setPasswordStrength({ score: 0, strength: "weak" });
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [newItem.password]);

  //  Load and decrypt vault
  const loadVault = useCallback(async () => {
    if (!hasVaultKey) return;

    try {
      setLoading(true);

      let vaultData = { items: [] };

      // Try to fetch from server
      if (hasToken) {
        const res = await fetch(`${API_BASE}/vault`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.encrypted_blob) {
            vaultData = data.encrypted_blob;
            console.log(" Vault data fetched from server");
          }
        } else if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        } else if (res.status !== 404) {
          console.warn("Unexpected response loading vault:", res.status);
        }
      }

      // Fall back to initialVault if no server data
      if (!vaultData.items?.length && initialVault?.items?.length) {
        vaultData = initialVault;
        console.log(" Using initial vault data");
      }

      // Check if decryption is needed
      const needsDecryption = vaultData.items?.some(
        (item) =>
          isEncryptedFieldShape(item.notes) ||
          isEncryptedFieldShape(item.link) ||
          isEncryptedFieldShape(item.username) ||
          isEncryptedFieldShape(item.password)
      );

      let decryptedVault;
      if (needsDecryption) {
        console.log(" Decrypting vault...");
        decryptedVault = await decryptVaultFields(vaultData, vaultKey);
      } else {
        console.log(" Vault is already decrypted or empty");
        decryptedVault = vaultData;
      }

      // Ensure items array exists and normalize data
      decryptedVault.items = (decryptedVault.items || []).map(normalizeItem);

      setVault(decryptedVault);
      hasAttemptedLoadRef.current = true;
    } catch (err) {
      console.error(" Error loading vault:", err);
      showVaultMessage("Failed to load vault: " + err.message);
      setVault({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [
    hasVaultKey,
    hasToken,
    token,
    initialVault,
    navigate,
    showVaultMessage,
    vaultKey,
  ]);

  // Load vault when vaultKey becomes available
  useEffect(() => {
    if (hasVaultKey && !hasAttemptedLoadRef.current) {
      hasAttemptedLoadRef.current = true;
      loadVault();
    }
  }, [hasVaultKey, loadVault]);

  // Reset load attempt when vaultKey changes
  useEffect(() => {
    hasAttemptedLoadRef.current = false;
  }, [vaultKey]);

  // CRUD Operations
  const editItem = useCallback(
    (id) => {
      const itemToEdit = vaultItems.find((i) => i.id === id);
      if (itemToEdit) setEditingItem({ ...itemToEdit });
    },
    [vaultItems]
  );

  const updateItem = useCallback(
    async (updatedItem) => {
      if (!updatedItem.title?.trim()) {
        showVaultMessage("Please enter a title");
        return;
      }

      const cleanUpdated = normalizeItem({
        ...updatedItem,
        updated_at: new Date().toISOString(),
      });

      setVault((prev) => ({
        ...prev,
        items: vaultItems.map((i) =>
          i.id === cleanUpdated.id ? cleanUpdated : i
        ),
      }));

      setEditingItem(null);
      showVaultMessage(" Item updated successfully!");

      // Mark recent operation to prevent immediate auto-save
      recentOperationRef.current = true;

      // Trigger silent save after delay
      setTimeout(() => {
        if (hasVaultKey && hasToken) {
          saveVaultSilent().catch((err) =>
            console.error("Auto-save after update failed:", err)
          );
        }
      }, 1500);
    },
    [vaultItems, hasVaultKey, hasToken, saveVaultSilent, showVaultMessage]
  );

  const cancelEdit = useCallback(() => setEditingItem(null), []);

  const addItem = useCallback(async () => {
    if (!newItem.title?.trim()) {
      showVaultMessage("Please enter a title");
      return;
    }

    const cleanItem = normalizeItem(newItem);

    setVault((prev) => ({
      ...prev,
      items: [...vaultItems, cleanItem],
    }));

    setNewItem(EMPTY_ITEM);
    setShowAddForm(false);
    showVaultMessage(" Item added successfully!");

    // Mark recent operation to prevent immediate auto-save
    recentOperationRef.current = true;

    // Trigger silent save after delay
    setTimeout(() => {
      if (hasVaultKey && hasToken) {
        saveVaultSilent().catch((err) =>
          console.error("Auto-save after add failed:", err)
        );
      }
    }, 1500);
  }, [
    newItem,
    vaultItems,
    hasVaultKey,
    hasToken,
    saveVaultSilent,
    showVaultMessage,
  ]);

  const removeItem = useCallback(
    async (id) => {
      setVault((prev) => ({
        ...prev,
        items: vaultItems.filter((i) => i.id !== id),
      }));

      // Remove from visible passwords
      setVisiblePasswords((prev) => {
        const newVisible = { ...prev };
        delete newVisible[id];
        return newVisible;
      });

      showVaultMessage(" Item removed successfully!");

      // Mark recent operation to prevent immediate auto-save
      recentOperationRef.current = true;

      // Trigger silent save after delay
      setTimeout(() => {
        if (hasVaultKey && hasToken) {
          saveVaultSilent().catch((err) =>
            console.error("Auto-save after removal failed:", err)
          );
        }
      }, 1500);
    },
    [vaultItems, hasVaultKey, hasToken, saveVaultSilent, showVaultMessage]
  );

  const togglePasswordVisibility = useCallback(
    (id) => setVisiblePasswords((p) => ({ ...p, [id]: !p[id] })),
    []
  );

  const openAddForm = useCallback(() => {
    setNewItem(EMPTY_ITEM);
    setShowAddForm(true);
  }, []);

  const closeAddForm = useCallback(() => {
    setShowAddForm(false);
    setNewItem(EMPTY_ITEM);
  }, []);

  //  Proper setNewItem function
  const handleSetNewItem = useCallback((value) => {
    // Handle both object updates and direct values
    if (typeof value === "object" && value !== null) {
      // Partial update: { field: value }
      setNewItem((prev) => ({ ...prev, ...value }));
    } else {
      // Direct value (shouldn't happen in normal usage, but as fallback)
      setNewItem(value);
    }
  }, []);

  return {
    vault,
    newItem,
    setNewItem: handleSetNewItem, 
    saving,
    loading,
    passwordStrength,
    showAddForm,
    setShowAddForm,
    visiblePasswords,
    breachResults,
    setBreachResults,
    editingItem,
    breachService,
    saveVault: saveVaultWithMessage,
    addItem,
    removeItem,
    loadVault,
    togglePasswordVisibility,
    openAddForm,
    closeAddForm,
    checkPasswordStrength,
    editItem,
    updateItem,
    cancelEdit,
    setVault,
  };
}
