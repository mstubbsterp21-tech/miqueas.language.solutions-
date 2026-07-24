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

function orderedCardIds(parent) {
  if (!parent) return [];
  return [...parent.children]
    .filter((item) => item.hasAttribute?.("data-custom-card-id"))
    .map((item, index) => ({
      item,
      index,
      order: Number.isFinite(Number(item.style.order)) && item.style.order !== "" ? Number(item.style.order) : index,
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ item }) => item.getAttribute("data-custom-card-id"))
    .filter(Boolean);
}

function FluidCardEditorRuntime({ editing, setSelectedCardId, setDraggingCardId, setCardOrder, flushSave }) {
  const gestureRef = useRef(null);
  const cloneRef = useRef(null);
  const frameRef = useRef(0);
  const finishTimerRef = useRef(0);

  useEffect(() => {
    if (!editing) return undefined;

    const clearClone = () => {
      window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(finishTimerRef.current);
      cloneRef.current?.remove();
      cloneRef.current = null;
      gestureRef.current?.card?.classList.remove("mls-card-placeholder");
      gestureRef.current = null;
      document.documentElement.classList.remove("mls-card-dragging");
    };

    const startVisualDrag = (gesture) => {
      const rect = gesture.card.getBoundingClientRect();
      const clone = gesture.card.cloneNode(true);
      clone.querySelectorAll(".mls-card-editor").forEach((node) => node.remove());
      clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      clone.removeAttribute("data-custom-card");
      clone.removeAttribute("data-custom-card-id");
      clone.classList.remove("mls-card-jiggle", "mls-card-placeholder");
      clone.classList.add("mls-card-drag-clone");
      clone.setAttribute("aria-hidden", "true");
      Object.assign(clone.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        zIndex: "10000",
        pointerEvents: "none",
        transformOrigin: `${gesture.offsetX}px ${gesture.offsetY}px`,
      });
      document.body.appendChild(clone);
      cloneRef.current = clone;
      gesture.card.classList.add("mls-card-placeholder");
      document.documentElement.classList.add("mls-card-dragging");
      gesture.started = true;
      setDraggingCardId(gesture.cardId);
      navigator.vibrate?.(10);
    };

    const move = (event) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (!gesture.started && distance < 7) return;
      if (!gesture.started) startVisualDrag(gesture);
      event.preventDefault();

      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (cloneRef.current) cloneRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.035) rotate(.35deg)`;
      });

      if (event.clientY < 92) window.scrollBy({ top: -14, behavior: "auto" });
      else if (event.clientY > window.innerHeight - 92) window.scrollBy({ top: 14, behavior: "auto" });

      const target = document.elementsFromPoint(event.clientX, event.clientY)
        .map((item) => item.closest?.('[data-custom-card="true"]'))
        .find((item) => item && item !== gesture.card && item.parentElement === gesture.parent);
      if (!target) return;
      const targetId = target.getAttribute("data-custom-card-id");
      if (!targetId || targetId === gesture.lastTargetId) return;
      gesture.lastTargetId = targetId;
      const ids = orderedCardIds(gesture.parent);
      const targetIndex = ids.indexOf(targetId);
      if (targetIndex < 0) return;
      const next = ids.filter((id) => id !== gesture.cardId);
      next.splice(targetIndex, 0, gesture.cardId);
      setCardOrder(next);
    };

    const finish = (event) => {
      const gesture = gestureRef.current;
      if (!gesture || (event?.pointerId !== undefined && gesture.pointerId !== event.pointerId)) return;
      window.removeEventListener("pointermove", move, { capture: true });
      window.removeEventListener("pointerup", finish, { capture: true });
      window.removeEventListener("pointercancel", finish, { capture: true });

      if (!gesture.started || !cloneRef.current) {
        clearClone();
        return;
      }

      const clone = cloneRef.current;
      const current = clone.getBoundingClientRect();
      const destination = gesture.card.getBoundingClientRect();
      clone.style.transform = "none";
      Object.assign(clone.style, {
        left: `${current.left}px`,
        top: `${current.top}px`,
        width: `${current.width}px`,
        height: `${current.height}px`,
        transition: "left 180ms cubic-bezier(.2,.8,.2,1), top 180ms cubic-bezier(.2,.8,.2,1), width 180ms ease, height 180ms ease, opacity 180ms ease, transform 180ms ease",
      });
      window.requestAnimationFrame(() => {
        Object.assign(clone.style, {
          left: `${destination.left}px`,
          top: `${destination.top}px`,
          width: `${destination.width}px`,
          height: `${destination.height}px`,
          opacity: ".45",
          transform: "scale(.985)",
        });
      });
      finishTimerRef.current = window.setTimeout(() => {
        clearClone();
        setDraggingCardId("");
        flushSave();
      }, 190);
    };

    const down = (event) => {
      if (event.button > 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest(".mls-card-editor, .mls-modal-surface")) return;
      const card = target.closest('[data-custom-card="true"]');
      if (!card) return;
      const cardId = card.getAttribute("data-custom-card-id");
      if (!cardId) return;
      const rect = card.getBoundingClientRect();
      setSelectedCardId(cardId);
      gestureRef.current = {
        pointerId: event.pointerId,
        card,
        cardId,
        parent: card.parentElement,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        lastTargetId: "",
        started: false,
      };
      window.addEventListener("pointermove", move, { capture: true, passive: false });
      window.addEventListener("pointerup", finish, { capture: true });
      window.addEventListener("pointercancel", finish, { capture: true });
    };

    document.addEventListener("pointerdown", down, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move, { capture: true });
      window.removeEventListener("pointerup", finish, { capture: true });
      window.removeEventListener("pointercancel", finish, { capture: true });
      clearClone();
    };
  }, [editing, flushSave, setCardOrder, setDraggingCardId, setSelectedCardId]);

  return null;
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

  useEffect(() => {
    if (!cardEditing) return undefined;
    const blockCardAction = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest(".mls-card-editor")) return;
      const card = target.closest('[data-custom-card="true"]');
      if (!card) return;
      event.preventDefault();
      event.stopPropagation();
      setSelectedCardId(card.getAttribute("data-custom-card-id") || "");
    };
    document.addEventListener("click", blockCardAction, true);
    return () => document.removeEventListener("click", blockCardAction, true);
  }, [cardEditing]);

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
      const fromIndex = current.indexOf(from);
      const targetIndex = current.indexOf(to);
      if (fromIndex < 0 || targetIndex < 0) return current;
      const next = current.filter((item) => item !== from);
      next.splice(targetIndex, 0, from);
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

  return <CardCustomizationContext.Provider value={value}>
    {children}
    <FluidCardEditorRuntime
      editing={cardEditing}
      setSelectedCardId={setSelectedCardId}
      setDraggingCardId={setDraggingCardId}
      setCardOrder={setCardOrder}
      flushSave={flushSave}
    />
  </CardCustomizationContext.Provider>;
}

export function useCardCustomization() {
  return useContext(CardCustomizationContext);
}
