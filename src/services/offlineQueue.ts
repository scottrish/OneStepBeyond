import {
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  applyPending,
  classifySendError,
  type OfflineAction,
  type QueuedAction,
} from "../domain/offlineActions";
import { isReachable, subscribeReachability } from "../lib/networkStatus";
import { supabase } from "../lib/supabase";
import { currentOwner, loadOwned, saveOwned, setReadOverlay } from "./offlineCache";
import { sendAction } from "./offlineSenders";

// Actions made offline, saved when the connection returns (PWA phase 2,
// increment 2c — docs/features/pwa-phase-2-offline-v0.1.md, question 4;
// docs/decisions/20260926-offline-action-queue.md).
//
// - One ordered queue per student, kept on the device beside the offline
//   plan, so it survives closing the app.
// - Online with nothing waiting, an action is sent straight away, exactly
//   as before (Q5). It's queued only when the server can't be reached,
//   when something is already waiting (order matters: Start before Done),
//   or when sending it fails for lack of a connection.
// - Sent in order, one at a time, as the signed-in student — never before
//   the sign-in has been refreshed.
// - A conflict (the plan changed on another device) drops the action and
//   says so once. A real failure retries twice, then waits in Settings.

const QUEUE_KEY = "queue";
const LOCK_NAME = "osb-offline-queue";
// Sent actions stay visible on reads that started before they were sent.
const SENT_LOG_LIMIT = 100;

let queue: QueuedAction[] = [];
let queueOwner: string | null = null;
let conflictNotice = false;
let running: Promise<void> | null = null;
let retryDelays = RETRY_DELAYS_MS;
// Bumped when the queue is thrown away, so a send in progress stops.
let generation = 0;
let sentSeq = 0;
let sentLog: { seq: number; action: OfflineAction }[] = [];

export type QueueState = {
  /** Changes waiting to be saved. */
  pending: number;
  /** The first one has failed three times: Settings offers Try again / Discard. */
  stuck: boolean;
  /** Something didn't apply because the plan changed on another device. */
  conflict: boolean;
};

let state: QueueState = { pending: 0, stuck: false, conflict: false };
const listeners = new Set<() => void>();

function notify() {
  state = { pending: queue.length, stuck: queue[0]?.stuck ?? false, conflict: conflictNotice };
  listeners.forEach((listener) => listener());
}

async function persist() {
  if (queueOwner) await saveOwned(queueOwner, QUEUE_KEY, queue);
}

async function setQueue(next: QueuedAction[]) {
  queue = next;
  notify();
  await persist();
}

function online(): boolean {
  return isReachable() && !(typeof navigator !== "undefined" && navigator.onLine === false);
}

export function newId(): string {
  return crypto.randomUUID();
}

// Reads show what's still waiting, plus anything sent since they started.
setReadOverlay({
  mark: () => sentSeq,
  apply: (key, data, since) =>
    applyPending(key, data, [
      ...sentLog.filter((entry) => entry.seq > since).map((entry) => entry.action),
      ...queue.map((item) => item.action),
    ]),
});

/**
 * Send `action` now if that's possible; otherwise keep it for later. Resolves
 * once it's sent or safely queued. Throws only what the student should see
 * (a server error while online, or no connection with nobody signed in).
 */
export async function sendOrQueue(action: OfflineAction): Promise<void> {
  const owner = currentOwner();
  const canQueue = owner !== null && owner === queueOwner;
  if (!canQueue || (queue.length === 0 && online())) {
    try {
      // Online, the result is whatever the server now holds — as before.
      await sendAction(action);
      return;
    } catch (error) {
      if (!canQueue || classifySendError(error) !== "offline") throw error;
    }
  }
  await setQueue([...queue, { id: newId(), action, attempts: 0, stuck: false }]);
  if (online()) void flushQueue();
}

/** After sign-in: this student's queue, from the device, and send it. */
export async function loadQueue(studentId: string): Promise<void> {
  if (queueOwner !== studentId) {
    const startedIn = generation;
    const stored = await loadOwned(studentId, QUEUE_KEY);
    if (startedIn !== generation || currentOwner() !== studentId) return;
    queueOwner = studentId;
    queue = Array.isArray(stored) ? (stored as QueuedAction[]) : [];
    notify();
  }
  void flushQueue();
}

/** On sign-out (after the warning): forget everything waiting. */
export function discardQueue(): void {
  generation += 1;
  queue = [];
  queueOwner = null;
  conflictNotice = false;
  sentLog = [];
  notify();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withLock(send: () => Promise<void>): Promise<void> {
  // Two open copies of the app take turns. Where locks aren't available,
  // the safe-repeat guards (offlineSenders) cover a double send.
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request(LOCK_NAME, send) : send();
}

async function sendAll(): Promise<void> {
  const owner = currentOwner();
  if (!owner || owner !== queueOwner) return;
  const startedIn = generation;
  const current = () => startedIn === generation && currentOwner() === owner;

  // Another copy of the app may have sent some meanwhile.
  const stored = await loadOwned(owner, QUEUE_KEY);
  if (!current()) return;
  if (Array.isArray(stored)) {
    queue = stored as QueuedAction[];
    notify();
  }
  if (queue.length === 0 || queue[0]!.stuck) return;

  // Sent as the signed-in student, with a fresh sign-in (question 2). If it
  // can't be refreshed, the queue waits until the student signs in again.
  const { data, error } = await supabase.auth.getSession();
  if (error || data.session?.user.id !== owner || !current()) return;

  while (current() && queue.length > 0) {
    const item = queue[0]!;
    if (item.stuck) return;
    try {
      const result = await sendAction(item.action);
      if (!current()) return;
      if (result === "conflict") conflictNotice = true;
      sentSeq += 1;
      sentLog = [...sentLog, { seq: sentSeq, action: item.action }].slice(-SENT_LOG_LIMIT);
      await setQueue(queue.filter((q) => q.id !== item.id));
    } catch (sendError) {
      if (!current()) return;
      const failure = classifySendError(sendError);
      if (failure === "offline") return;
      if (failure === "conflict") {
        conflictNotice = true;
        await setQueue(queue.filter((q) => q.id !== item.id));
        continue;
      }
      const attempts = item.attempts + 1;
      const stuck = attempts >= MAX_ATTEMPTS;
      await setQueue(queue.map((q) => (q.id === item.id ? { ...q, attempts, stuck } : q)));
      if (stuck) return;
      await sleep(retryDelays[attempts - 1] ?? 0);
    }
  }
}

/** Send what's waiting, in order. Safe to call any time; one send runs at once. */
export function flushQueue(): Promise<void> {
  running ??= withLock(sendAll)
    .catch(() => {})
    .finally(() => {
      running = null;
    });
  return running;
}

/** Settings' Try again, for a change that failed three times. */
export async function retryStuck(): Promise<void> {
  const head = queue[0];
  if (head?.stuck) await setQueue([{ ...head, attempts: 0, stuck: false }, ...queue.slice(1)]);
  await flushQueue();
}

/** Settings' Discard, for a change that failed three times. */
export async function discardStuck(): Promise<void> {
  const head = queue[0];
  if (head?.stuck) await setQueue(queue.slice(1));
  void flushQueue();
}

export function dismissConflictNotice(): void {
  conflictNotice = false;
  notify();
}

export function queueState(): QueueState {
  return state;
}

export function subscribeQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For tests: an empty queue, and no waiting between retries. */
export function resetOfflineQueueForTests({ delays = [0, 0] }: { delays?: number[] } = {}): void {
  discardQueue();
  running = null;
  retryDelays = delays;
  sentSeq = 0;
}

// When the connection returns, or the student comes back to the app,
// send what's waiting. (Background Sync isn't used: iPhones don't have it,
// and this covers them — decision Q4.)
if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushQueue();
  });
}
subscribeReachability(() => {
  if (isReachable()) void flushQueue();
});
