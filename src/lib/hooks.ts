"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * These hooks are all built on `useSyncExternalStore` rather than the more
 * obvious `useState` + `useEffect` pair.
 *
 * That is not stylistic. Reading an external value (a media query, a
 * connection flag, whether we are on the client) into state via an effect
 * causes a second render on every mount and trips React 19's
 * `set-state-in-effect` rule. `useSyncExternalStore` subscribes to the source
 * directly, gives a correct server snapshot, and settles in one pass.
 */

const noopSubscribe = () => () => {};

/**
 * SSR-safe media query. Returns `false` on the server and during the first
 * client render, then settles to the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Reactive `prefers-reduced-motion`.
 *
 * Read this before building any timeline. The convention across the codebase:
 * when it returns true, skip the animation entirely and render the element in
 * its FINAL state — never leave content stuck at `opacity: 0`.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * The desktop/mobile split. This is a REAL branch, not a styling detail: the
 * home page renders a different component tree on each side of it (pinned
 * crossfade reel vs. scroll-snap stack).
 *
 * Matches Tailwind's `md` (48rem / 768px).
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 48rem)");
}

/**
 * True when the user is on a metered/save-data connection. Video components
 * use this to hold at the poster frame instead of streaming.
 *
 * Not subscribable in any cross-browser way, so this is read once per render
 * rather than watched — it does not change mid-session in practice.
 */
export function useSaveData(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData,
      ),
    () => false,
  );
}

/** Has the component mounted on the client? For deferring portals/measurements. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
