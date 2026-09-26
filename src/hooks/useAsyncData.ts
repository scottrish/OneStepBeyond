import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { NEEDS_CONNECTION } from "../domain/offlineWording";
import { errorMessage } from "../lib/errorMessage";
import { writeCount } from "../lib/networkStatus";
import { useOnlineStatus } from "./useOnlineStatus";

export type UseAsyncDataResult<T> = {
  data: T;
  loading: boolean;
  /** Nothing could be shown: the first load failed. */
  loadError: string | null;
  /** Content is showing, but refreshing it failed (a server error) — shown
   *  above the content, never instead of it (instant-screen-data-v0.1.md, I3). */
  refreshError: string | null;
  /** Direct state access for a caller's own optimistic mutations (e.g.
   *  appending a newly-created row without a full refetch). */
  setData: Dispatch<SetStateAction<T>>;
  /** Re-fetches without resetting loading/error first — for a caller
   *  that wants a fresh read after its own successful mutation. */
  refetch: () => Promise<void>;
  /** Re-fetches after resetting loading to true and clearing loadError —
   *  for a user-facing "Try again" action after a failed load. With
   *  content showing, it refreshes in place instead. */
  retry: () => void;
};

export type UseAsyncDataOptions<T> = {
  /** The last-known result, if the app already has one (instant screens):
   *  the hook starts from it, with no loading, and refreshes in the
   *  background. Must be synchronous. */
  peek?: () => T | undefined;
};

// Reads per load when saves keep landing mid-read (F1), before accepting
// whatever comes back.
const MAX_ATTEMPTS = 3;

// docs/decisions/20260911-architecture-refactor-proposal.md increment 2
// — the "fetch on mount" shape (loading/error state + effect + retry)
// that was independently hand-rolled in 13 places before this. The same
// `react-hooks/set-state-in-effect` bug (synchronous setState inside an
// effect body) had already been found and fixed twice, in
// useSupporterAccess.ts and SupportPage.tsx, precisely because there was
// no single implementation to fix once — this hook is that single
// implementation. Callers own their own mutation methods on top (add/
// update/remove) — this hook only owns the read side.
//
// `fetcher` must be a stable reference the caller memoizes with its own
// `useCallback` (keyed on whatever params the fetch actually needs, e.g.
// `studentId` or `[studentId, date]`) — this hook re-fetches whenever
// `fetcher` itself changes, rather than accepting a raw dependency array,
// so `react-hooks/exhaustive-deps` can verify this hook's own effect
// correctly without needing to see into the caller's dependencies.
//
// Not every hook in the codebase uses this — useAllWorkSessions.ts is a
// deliberate exception (silently-swallowed errors, no loadError surface,
// plus a `cancelled`-flag guard against a slow stale response overwriting
// a newer one) and was left as its own hand-rolled implementation rather
// than bent to fit this shape; see that file's own comment.
//
// Instant screens (docs/features/instant-screen-data-v0.1.md): with a
// `peek`, the hook starts from the app's last-known copy and refreshes in
// the background. A read that was on its way when a save started may
// predate it, so its answer is set aside and the read tried again (F1) —
// otherwise a change the student just made could flip back.
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  { peek }: UseAsyncDataOptions<T> = {},
): UseAsyncDataResult<T> {
  const [start] = useState(() => {
    const peeked = peek?.();
    return peeked === undefined ? { data: initialValue, known: false } : { data: peeked, known: true };
  });
  const [data, setData] = useState<T>(start.data);
  const [loading, setLoading] = useState(!start.known);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  // Whether something is on screen, so a failed refresh keeps it (I3).
  const showing = useRef(start.known);
  useEffect(() => {
    showing.current = !loading && loadError === null;
  }, [loading, loadError]);

  // A new fetcher (e.g. Plan's day changed): its copy at once, if there is
  // one (F3). Set during render, the "information from previous renders"
  // pattern, rather than in an effect.
  const [lastFetcher, setLastFetcher] = useState(() => fetcher);
  if (fetcher !== lastFetcher) {
    setLastFetcher(() => fetcher);
    const peeked = peek?.();
    if (peeked !== undefined) {
      setData(peeked);
      setLoading(false);
      setLoadError(null);
    }
  }

  const load = useCallback((): Promise<void> => {
    const attempt = (n: number): Promise<void> => {
      const writesAtStart = writeCount();
      // A save started while this read was on its way: its answer may
      // predate the save, so read again (F1).
      const outdated = () => n < MAX_ATTEMPTS && writeCount() !== writesAtStart;
      return fetcher().then(
        (result) => {
          if (outdated()) return attempt(n + 1);
          setData(result);
          setLoadError(null);
          setRefreshError(null);
        },
        (error: unknown) => {
          if (outdated()) return attempt(n + 1);
          const message = errorMessage(error);
          if (!showing.current) setLoadError(message);
          // Offline with content showing: say nothing — the offline line
          // already does (I3).
          else if (message !== NEEDS_CONNECTION) setRefreshError(message);
        },
      );
    };
    return attempt(1).finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  // Back online: read again, so a screen showing the stored plan (PWA
  // phase 2, 2b) or an offline message (2a) catches up by itself.
  const online = useOnlineStatus();
  const wasOffline = useRef(!online);
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      load();
    }
  }, [online, load]);

  function retry() {
    setRefreshError(null);
    if (!showing.current) {
      setLoading(true);
      setLoadError(null);
    }
    void load();
  }

  return { data, loading, loadError, refreshError, setData, refetch: load, retry };
}
