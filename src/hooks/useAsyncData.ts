import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useOnlineStatus } from "./useOnlineStatus";

export type UseAsyncDataResult<T> = {
  data: T;
  loading: boolean;
  loadError: string | null;
  /** Direct state access for a caller's own optimistic mutations (e.g.
   *  appending a newly-created row without a full refetch). */
  setData: Dispatch<SetStateAction<T>>;
  /** Re-fetches without resetting loading/error first — for a caller
   *  that wants a fresh read after its own successful mutation. */
  refetch: () => Promise<void>;
  /** Re-fetches after resetting loading to true and clearing loadError —
   *  for a user-facing "Try again" action after a failed load. */
  retry: () => void;
};

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
export function useAsyncData<T>(fetcher: () => Promise<T>, initialValue: T): UseAsyncDataResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetcher()
      .then((result) => {
        setData(result);
        setLoadError(null);
      })
      .catch((error: unknown) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
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
    setLoading(true);
    setLoadError(null);
    load();
  }

  return { data, loading, loadError, setData, refetch: load, retry };
}
