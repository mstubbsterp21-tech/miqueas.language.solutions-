import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@clerk/clerk-react";

const CardCustomizationContext = createContext(null);

const CARD_SIZES = new Set(["small", "medium", "large"]);
const CARD_SHAPES = new Set(["soft", "rounded", "square"]);
const LEGACY_SIZE_MAP = { compact: "small", standard: "medium", spacious: "large" };

export function normalizeCardSize(value, fallback = "medium") {
  const normalized = LEGACY_SIZE_MAP[String(value || "")] || String(value || "");
  return CARD_SIZES.has(normalized) ? normalized : fallback;
}

export function normalizeCardShape(value, fallback = "soft") {
  const normalized = String(value || "");
  return CARD_SHAPES.has(normalized) ? normalized : fallback;
}

function normalizeCardRecord(value = {}, fallbackSize = "medium", fallbackShape = "soft") {
  const order = Number.isInteger(value.order) ? Math.max(0, Math.min(value.order, 999)) : undefined;
  return {
    size: normalizeCardSize(value.size, fallbackSize),
    shape: normalizeCardShape(value.shape, fallbackShape),
    ...(order === undefined ? {} : { order }),
  };
}

function normalizePagePreference(value = {}) {
  const size = normalizeCardSize(value.size);
  const shape = normalizeCardShape(value.shape);
  const rawCards = value.cards && typeof value.cards === "object" && !Array.isArray(value.cards) ? value.cards : {};
  const cards = Object.fromEntries(Object.entries(rawCards).slice(0, 150).map(([key, card]) => [key, normalizeCardRecord(card, size, shape)]));
  return { size, shape, cards };
}

function normalizePreferences(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, preference]) => [key, normalizePagePreference(preference)]));
}

export function useLongPress(onLongPress, { delay = 520, disabled = false } = {}) {
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const handlers = useMemo(() => ({
    onPointerDown: (event) => {
      if (disabled || event.button > 0) return;
      triggeredRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        navigator.vibrate?.(18);
        onLongPress?.(event);
      }, delay);
    },
    onPointerMove: (event) => {
      if (!startRef.current) return;
      const distance = Math.hypot(event.clientX - startRef.current.x, event.clientY - startRef.current.y);
      if (distance > 9) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (event) => {
      if (triggeredRef.current || event.pointerType === "touch") event.preventDefault();
    },
  }), [clear, delay, disabled, onLongPress]);

  const consumeTriggered = useCallback(() => {
    if (!triggeredRef.current) return false;
    triggeredRef.current = false;
    return true;
  }, []);

  return { handlers, consumeTriggered };
}

export function CardCustomizationProvider({ role, section, layout, children }) {
  const { session } = useSession();
  const [tabPreferences, setTabPreferences] = useState(() => normalizePreferences(layout?.tab_card_preferences));
  const [navOrder, setNavOrder] = useState(() => Array.isArray(layout?.nav_order) ? layout.nav_order : []);
  const [cardEditing, setCardEditing] = useState(false);
  const [navigationEditing, setNavigationEditing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [draggingCardId, setDraggingCardId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const tabPreferencesRef = useRef(tabPreferences);
  const navOrderRef = useRef(navOrder);
  const saveTimerRef = useRef(null);
  const pendingSaveRef = useRef(null);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const nextPreferences = normalizePreferences(layout?.tab_card_preferences);
    const nextNavOrder = Array.isArray(layout?.nav_order) ? layout.nav_order : [];
    tabPreferencesRef.current = nextPreferences;
    navOrderRef.current = nextNavOrder;
    setTabPreferences(nextPreferences);
    setNavOrder(nextNavOrder);
  }, [layout]);

  useEffect(() => {
    setCardEditing(false);
    setSelectedCardId("");
    setDraggingCardId("");
  }, [section]);

  const persist = useCallback(async (payload) => {
    if (!session || !payload) return;
    const sequence = ++requestSequenceRef.current;
    setSaving(true);
    setSaveError("");
    try {
      const bearer = await session.getToken();
      const response = await fetch("/api/operations-v2?action=savePortalLayoutV2", {
        method: "POST",
        headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Layout save failed (${response.status}).`);
    } catch (error) {
      if (sequence === requestSequenceRef.current) setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      if (sequence === requestSequenceRef.current) setSaving(false);
    }
  }, [session]);

  const scheduleSave = useCallback((payload) => {
    pendingSaveRef.current = payload;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const next = pendingSaveRef.current;
      pendingSaveRef.current = null;
      persist(next);
    }, 500);
  }, [persist]);

  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    const next = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (next) persist(next);
  }, [persist]);

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);

  const currentPage = tabPreferences[section] || normalizePagePreference();

  const updateCurrentPage = useCallback((updater, { immediate = false } = {}) => {
    setTabPreferences((current) => {
      const existing = current[section] || normalizePagePreference();
      const nextPage = normalizePagePreference(typeof updater === "function" ? updater(existing) : updater);
      const next = { ...current, [section]: nextPage };
      tabPreferencesRef.current = next;
      const payload = { section, cardPreferences: nextPage };
      if (immediate) persist(payload);
      else scheduleSave(payload);
      return next;
    });
  }, [persist, scheduleSave, section]);

  const cardPreference = useCallback((cardId) => {
    const page = tabPreferencesRef.current[section] || normalizePagePreference();
    return normalizeCardRecord(page.cards?.[cardId] || {}, page.size, page.shape);
  }, [section]);

  const updateCard = useCallback((cardId, changes) => {
    setSelectedCardId(cardId);
    updateCurrentPage((page) => ({
      ...page,
      cards: {
        ...page.cards,
        [cardId]: { ...cardPreference(cardId), ...changes },
      },
    }));
  }, [cardPreference, updateCurrentPage]);

  const setCardOrder = useCallback((cardIds) => {
    if (!Array.isArray(cardIds) || !cardIds.length) return;
    updateCurrentPage((page) => {
      const cards = { ...page.cards };
      cardIds.forEach((cardId, order) => {
        cards[cardId] = { ...normalizeCardRecord(cards[cardId], page.size, page.shape), order };
      });
      return { ...page, cards };
    });
  }, [updateCurrentPage]);

  const moveNavigation = useCallback((from, to) => {
    if (!from || !to || from === to) return;
    setNavOrder((current) => {
      const base = current.length ? current : [];
      if (!base.includes(from) || !base.includes(to)) return current;
      const next = base.filter((item) => item !== from);
      next.splice(next.indexOf(to), 0, from);
      navOrderRef.current = next;
      return next;
    });
  }, []);

  const commitNavigation = useCallback(() => persist({ navOrder: navOrderRef.current }), [persist]);

  const startCardEditing = useCallback((cardId = "") => {
    setNavigationEditing(false);
    setCardEditing(true);
    setSelectedCardId(cardId);
  }, []);

  const stopCardEditing = useCallback(() => {
    flushSave();
    setCardEditing(false);
    setSelectedCardId("");
    setDraggingCardId("");
  }, [flushSave]);

  const startNavigationEditing = useCallback(() => {
    setCardEditing(false);
    setNavigationEditing(true);
  }, []);

  const stopNavigationEditing = useCallback(() => {
    commitNavigation();
    setNavigationEditing(false);
  }, [commitNavigation]);

  const value = useMemo(() => ({
    role,
    section,
    pagePreference: currentPage,
    tabPreferences,
    navOrder,
    setNavOrder: (next) => {
      navOrderRef.current = next;
      setNavOrder(next);
    },
    cardEditing,
    navigationEditing,
    selectedCardId,
    draggingCardId,
    saving,
    saveError,
    cardPreference,
    updateCard,
    setCardOrder,
    flushSave,
    startCardEditing,
    stopCardEditing,
    startNavigationEditing,
    stopNavigationEditing,
    setSelectedCardId,
    setDraggingCardId,
    moveNavigation,
    commitNavigation,
  }), [
    role, section, currentPage, tabPreferences, navOrder, cardEditing, navigationEditing,
    selectedCardId, draggingCardId, saving, saveError, cardPreference, updateCard,
    setCardOrder, flushSave, startCardEditing, stopCardEditing, startNavigationEditing,
    stopNavigationEditing, moveNavigation, commitNavigation,
  ]);

  return <CardCustomizationContext.Provider value={value}>{children}</CardCustomizationContext.Provider>;
}

export function useCardCustomization() {
  return useContext(CardCustomizationContext);
}
