"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CHECKLIST, DEFAULT_STATE } from "@/lib/companion/goal";
import type { BankImport, BankItem, ChecklistId, CompanionState } from "@/lib/companion/types";

export const COMPANION_STORAGE_KEY = "osrs-companion-fr3nchy";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function mergeBank(raw: unknown): BankImport | null {
  if (!isRec(raw) || typeof raw.importedAt !== "string" || !Array.isArray(raw.items)) return null;
  const items: BankItem[] = raw.items.filter(
    (i): i is BankItem =>
      isRec(i) && Number.isInteger(i.itemId) && typeof i.name === "string" && isNum(i.quantity) && i.quantity > 0
  );
  return { importedAt: raw.importedAt, items: items.map(({ itemId, name, quantity }) => ({ itemId, name, quantity })) };
}

/**
 * Stored or imported JSON merged over DEFAULT_STATE, field by field: anything
 * missing or the wrong type falls back to the default instead of poisoning the maths.
 */
export function mergeState(raw: unknown): CompanionState {
  if (!isRec(raw)) return DEFAULT_STATE;
  const amount = (k: keyof CompanionState) => {
    const v = raw[k];
    return isNum(v) && v >= 0 ? v : (DEFAULT_STATE[k] as number);
  };
  const flag = (k: keyof CompanionState) => {
    const v = raw[k];
    return typeof v === "boolean" ? v : (DEFAULT_STATE[k] as boolean);
  };

  const checklist: CompanionState["checklist"] = {};
  if (isRec(raw.checklist)) {
    for (const { id } of CHECKLIST) {
      const v = raw.checklist[id];
      if (typeof v === "boolean") checklist[id as ChecklistId] = v;
    }
  }

  return {
    version: 1,
    cashGp: amount("cashGp"),
    tradeablesGp: amount("tradeablesGp"),
    slippagePct: amount("slippagePct"),
    reserveGp: amount("reserveGp"),
    weekdayHours: amount("weekdayHours"),
    weekendHours: amount("weekendHours"),
    ownsTbow: flag("ownsTbow"),
    dt2Complete: flag("dt2Complete"),
    checklist,
    bank: mergeBank(raw.bank),
    keepItemIds: Array.isArray(raw.keepItemIds) ? raw.keepItemIds.filter((n): n is number => Number.isInteger(n)) : [],
    useBankImport: flag("useBankImport"),
  };
}

// A tiny external store over localStorage. useSyncExternalStore gives SSR a
// "not loaded" snapshot (null) and swaps in the stored state right after
// hydration -- the load-on-mount of app/useGoals.ts, minus a setState-in-effect.
let current: CompanionState | null = null;
const listeners = new Set<() => void>();

function load(): CompanionState {
  try {
    const raw = localStorage.getItem(COMPANION_STORAGE_KEY);
    return raw ? mergeState(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function getSnapshot(): CompanionState {
  if (current === null) current = load();
  return current;
}

const getServerSnapshot = (): CompanionState | null => null;

function emit() {
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  // Another tab saved: pick it up so the two don't overwrite each other.
  if (e.key !== COMPANION_STORAGE_KEY) return;
  current = load();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function save(next: CompanionState) {
  current = next;
  try {
    localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable -- keep working in memory */
  }
  emit();
}

export type CompanionUpdate = Partial<CompanionState> | ((prev: CompanionState) => CompanionState);

export function useCompanionState() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Patch or transform the state; saved on every change. */
  const update = useCallback((change: CompanionUpdate) => {
    const prev = getSnapshot();
    save(typeof change === "function" ? change(prev) : { ...prev, ...change });
  }, []);

  /** Replace everything (backup restore). */
  const replace = useCallback((next: CompanionState) => save(next), []);

  return { state: snapshot ?? DEFAULT_STATE, ready: snapshot !== null, update, replace };
}
