import { useSyncExternalStore } from "react";
import {
  discardStuck,
  dismissConflictNotice,
  queueState,
  retryStuck,
  subscribeQueue,
} from "../services/offlineQueue";

// Changes made offline and not yet saved (PWA phase 2, 2c): how many, whether
// one is stuck, and whether something didn't apply — with Settings' and the
// conflict note's actions.
export function useOfflineQueue() {
  const state = useSyncExternalStore(subscribeQueue, queueState, queueState);
  return {
    ...state,
    retry: () => void retryStuck(),
    discard: () => void discardStuck(),
    dismissConflict: dismissConflictNotice,
  };
}
