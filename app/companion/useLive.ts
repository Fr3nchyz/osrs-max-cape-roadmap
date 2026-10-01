"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export interface Remote<T> {
  /** Last good response; kept while a reload is in flight or after it fails. */
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

type Result<T> = { nonce: number; data: T | null; error: string | null };

function errorMessage(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") return body.error;
  return `Request failed (${status})`;
}

/** GET a JSON endpoint on mount (and on reload) while `enabled`. */
export function useJson<T>(url: string, enabled = true): Remote<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T>>({ nonce: -1, data: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const body: unknown = await res.json().catch(() => null);
        if (!res.ok || body === null) throw new Error(errorMessage(body, res.status));
        return body as T;
      })
      .then(
        (data) => setResult({ nonce, data, error: null }),
        (err: unknown) => {
          if (controller.signal.aborted) return;
          const error = err instanceof Error ? err.message : String(err);
          setResult((prev) => ({ nonce, data: prev.data, error }));
        }
      );
    return () => controller.abort();
  }, [url, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data: result.data, error: result.error, loading: enabled && result.nonce !== nonce, reload };
}

// A shared clock that ticks every 30s, so ages ("fetched 4m ago") and the
// 15-minute price-freshness check keep moving while the page stays open.
// Server snapshot is 0: nothing time-based renders before hydration.
let clock = 0;
const clockListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  clock = Date.now();
  clockListeners.forEach((l) => l());
}

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    tick();
    timer = setInterval(tick, 30_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getClock() {
  if (clock === 0) clock = Date.now();
  return clock;
}

const getServerClock = () => 0;

/** Epoch ms, refreshed every 30 seconds (0 during SSR). */
export function useNow(): number {
  return useSyncExternalStore(subscribeClock, getClock, getServerClock);
}
