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
  const order = Number.isInteger(value?.order) ? Math.max(0, Math.min(value.order, 999)) : undefined;
  return {
    size: normalizeCardSize(value?.size, fallbackSize),
    shape: normalizeCardShape(value?.shape, fallbackShape),
    ...(order === undefined ? {} : { order }),
  };
}

function normalizePagePreference(value = {}) {
  const size = normalizeCardSize(value?.size);
  const shape = normalizeCardShape(value?.shape);
  const rawCards = value?.cards && typeof value.cards === "object" && !Array.isArray(value.cards) ? value.cards : {};
  const cards = Object.fromEntries(
    Object.entries(rawCards)
      .slice(0, 150)
      .map(([key, card]) => [key, normalizeCardRecord(card, size, shape)]),
  );
  return { size, shape, cards };
}

function normalizePreferences(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, preference]) => [key, normalizePagePreference(preference)]));
}

function cardFamily(cardId) {
  const value = String(cardId || "");
  return value.replace(/-[^-]+$/, "") || value;
}

function cardRecordFor(page, cardId) {
  const exact = page.cards?.[cardId];
  if (exact) return normalizeCardRecord(exact, page.size, page.shape);

  const family = cardFamily(cardId);
  const legacyEntry = Object.entries(page.cards || {})
    .filter(([key]) => key === family || cardFamily(key) === family)
    .sort(([, left], [, right]) => {
      const leftHasOrder = Number.isInteger(left?.order) ? 1 : 0;
      const rightHasOrder = Number.isInteger(right?.order) ? 1 : 0;
      return rightHasOrder - leftHasOrder;
    })[0];

  return normalizeCardRecord(legacyEntry?.[1] || {}, page.size, page.shape);
}

function removeLegacyFamilyRecords(cards, cardIds) {
  const currentIds = new Set(cardIds);
  const families = new Set(cardIds.map(cardFamily));
  Object.keys(cards).forEach((key) => {
    if (!currentIds.has(key) && families.has(cardFamily(key))) delete cards[key];
  });
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

function cleanText(value, maxLength = 120) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function isRuntimeNode(node) {
  return node?.closest?.(".mls-card-editor, .mls-card-compact-runtime, button, a, input, select, textarea") !== null;
}

function firstUsefulNode(card, selectors, excluded = new Set()) {
  return [...card.querySelectorAll(selectors)].find((node) => {
    if (excluded.has(node) || isRuntimeNode(node)) return false;
    return cleanText(node.textContent, 200).length > 0;
  });
}

function compactSummaryFor(card) {
  const titleNode = firstUsefulNode(
    card,
    "[data-card-summary-title], h1, h2, h3, h4, .font-black, .font-bold",
  );
  const valueNode = firstUsefulNode(
    card,
    "[data-card-summary-value], .text-5xl, .text-4xl, .text-3xl, .text-2xl",
    new Set(titleNode ? [titleNode] : []),
  );
  const excluded = new Set([titleNode, valueNode].filter(Boolean));
  const detailNode = firstUsefulNode(
    card,
    "[data-card-summary-detail], p, .text-sm, .text-xs, span.block",
    excluded,
  );

  const title = cleanText(titleNode?.textContent || card.getAttribute("aria-label") || "Portal card", 72);
  const value = cleanText(valueNode?.textContent, 52);
  let detail = cleanText(detailNode?.textContent, 112);
  if (detail === title || detail === value) detail = "";

  return { title, value, detail };
}

function syncCompactSummary(card) {
  const existing = card.querySelector(":scope > .mls-card-compact-runtime");
  if (card.getAttribute("data-custom-size") !== "small") {
    existing?.remove();
    return;
  }

  const summary = compactSummaryFor(card);
  const signature = JSON.stringify(summary);
  if (existing?.dataset.signature === signature) return;

  const runtime = existing || document.createElement("div");
  runtime.className = "mls-card-compact-runtime";
  runtime.dataset.signature = signature;
  runtime.replaceChildren();

  const title = document.createElement("p");
  title.className = "mls-card-compact-title";
  title.textContent = summary.title;
  runtime.appendChild(title);

  if (summary.value) {
    const value = document.createElement("p");
    value.className = "mls-card-compact-value";
    value.textContent = summary.value;
    runtime.appendChild(value);
  }

  if (summary.detail) {
    const detail = document.createElement("p");
    detail.className = "mls-card-compact-detail";
    detail.textContent = summary.detail;
    runtime.appendChild(detail);
  }

  if (!existing) card.appendChild(runtime);
}

function CompactCardSummaryRuntime({ section, preferences }) {
  useEffect(() => {
    const main = document.querySelector(".mls-portal-theme main");
    if (!main) return undefined;

    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        main.querySelectorAll('.mls-card[data-custom-card="true"]').forEach(syncCompactSummary);
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-custom-size"],
    });
    sync();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [section, preferences]);

  return null;
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
  const pendingSavesRef = useRef(new Map());
  const requestQueueRef = useRef(Promise.resolve());
  const activeSavesRef = useRef(0);
  const hydrationKeyRef = useRef("");
  const previousSectionRef = useRef(section);

  useEffect(() => {
    const identity = `${session?.user?.id || session?.id || "anonymous"}:${role}`;
    if (!layout || hydrationKeyRef.current === identity) return;
    const nextPreferences = normalizePreferences(layout?.tab_card_preferences);
    const nextNavOrder = Array.isArray(layout?.nav_order) ? layout.nav_order : [];
    tabPreferencesRef.current = nextPreferences;
    navOrderRef.current = nextNavOrder;
    setTabPreferences(nextPreferences);
    setNavOrder(nextNavOrder);
    hydrationKeyRef.current = identity;
  }, [layout, role, session?.id, session?.user?.id]);

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

  const persist = useCallback((payload) => {
    if (!session || !payload) return Promise.resolve();

    const task = async () => {
      activeSavesRef.current += 1;
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
        setSaveError(error instanceof Error ? error.message : String(error));
      } finally {
        activeSavesRef.current = Math.max(0, activeSavesRef.current - 1);
        setSaving(activeSavesRef.current > 0);
      }
    };

    requestQueueRef.current = requestQueueRef.current.then(task, task);
    return requestQueueRef.current;
  }, [session]);

  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    const pending = [...pendingSavesRef.current.values()];
    pendingSavesRef.current.clear();
    pending.forEach((payload) => persist(payload));
  }, [persist]);

  const scheduleSave = useCallback((payload) => {
    const key = payload?.section ? `section:${payload.section}` : payload?.navOrder ? "navigation" : "layout";
    pendingSavesRef.current.set(key, payload);
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushSave, 420);
  }, [flushSave]);

  useEffect(() => () => flushSave(), [flushSave]);

  useEffect(() => {
    if (previousSectionRef.current === section) return;
    flushSave();
    previousSectionRef.current = section;
    setCardEditing(false);
    setSelectedCardId("");
    setDraggingCardId("");
  }, [flushSave, section]);

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
    return cardRecordFor(page, cardId);
  }, [section]);

  const updateCard = useCallback((cardId, changes) => {
    setSelectedCardId(cardId);
    updateCurrentPage((page) => {
      const cards = { ...page.cards };
      removeLegacyFamilyRecords(cards, [cardId]);
      cards[cardId] = { ...cardRecordFor(page, cardId), ...changes };
      return { ...page, cards };
    });
  }, [updateCurrentPage]);

  const setCardOrder = useCallback((cardIds) => {
    if (!Array.isArray(cardIds) || !cardIds.length) return;
    updateCurrentPage((page) => {
      const cards = { ...page.cards };
      removeLegacyFamilyRecords(cards, cardIds);
      cardIds.forEach((cardId, order) => {
        cards[cardId] = { ...cardRecordFor(page, cardId), order };
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
    flushSave();
    setCardEditing(false);
    setNavigationEditing(true);
  }, [flushSave]);

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

  return (
    <CardCustomizationContext.Provider value={value}>
      {children}
      <CompactCardSummaryRuntime section={section} preferences={currentPage} />
      <FluidCardEditorRuntime
        editing={cardEditing}
        setSelectedCardId={setSelectedCardId}
        setDraggingCardId={setDraggingCardId}
        setCardOrder={setCardOrder}
        flushSave={flushSave}
      />
    </CardCustomizationContext.Provider>
  );
}

export function useCardCustomization() {
  return useContext(CardCustomizationContext);
}
