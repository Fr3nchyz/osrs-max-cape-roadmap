"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/**
 * The page's current tab, kept in the URL hash (/companion#money) so a reload,
 * a bookmark or the back button lands on the same tab.
 */
export function useHashTab<T extends string>(tabs: readonly T[], fallback: T): [T, (t: T) => void] {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => ""
  );
  const tab = (tabs as readonly string[]).includes(hash) ? (hash as T) : fallback;
  const set = useCallback(
    (t: T) => {
      if (t === fallback) history.replaceState(null, "", window.location.pathname + window.location.search);
      else window.location.hash = t;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [fallback]
  );
  return [tab, set];
}
