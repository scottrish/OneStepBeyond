import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: { auth: { getSession: vi.fn() } } }));
vi.mock("./offlineSenders", () => ({ sendAction: vi.fn() }));

import { supabase } from "../lib/supabase";
import type { OfflineAction } from "../domain/offlineActions";
import type { WorkSession } from "./workSessionService";
import { memoryStore, type KeyValueStore } from "./offlineStore";
import { cachedRead, peekRead, resetOfflineCacheForTests, setCacheOwner } from "./offlineCache";
import { sendAction } from "./offlineSenders";
import {
  discardQueue,
  discardStuck,
  dismissConflictNotice,
  flushQueue,
  loadQueue,
  queueState,
  resetOfflineQueueForTests,
  retryStuck,
  sendOrQueue,
} from "./offlineQueue";

const mockedSend = vi.mocked(sendAction);
const mockedGetSession = supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>;

const start = (sessionId: string, at = "2026-09-26T16:02:00.000Z"): OfflineAction => ({
  kind: "startSession",
  sessionId,
  at,
});
const done = (sessionId: string, at = "2026-09-26T16:40:00.000Z"): OfflineAction => ({
  kind: "completeSession",
  sessionId,
  at,
});

function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
}

let store: KeyValueStore;

async function signIn(studentId: string) {
  mockedGetSession.mockResolvedValue({ data: { session: { user: { id: studentId } } }, error: null });
  setCacheOwner(studentId);
  await loadQueue(studentId);
  await flushQueue();
}

beforeEach(async () => {
  vi.clearAllMocks();
  mockedSend.mockResolvedValue("applied");
  setOnline(true);
  store = memoryStore();
  resetOfflineCacheForTests(store);
  resetOfflineQueueForTests();
  await signIn("s1");
});

afterEach(() => {
  setOnline(true);
});

describe("offline queue (PWA phase 2, 2c)", () => {
  it("online with nothing waiting: sent straight away, as before", async () => {
    await sendOrQueue(start("a"));
    expect(mockedSend).toHaveBeenCalledWith(start("a"));
    expect(queueState().pending).toBe(0);
  });

  it("online, a server error still reaches the student", async () => {
    mockedSend.mockRejectedValueOnce({ message: "boom" });
    await expect(sendOrQueue(start("a"))).rejects.toMatchObject({ message: "boom" });
    expect(queueState().pending).toBe(0);
  });

  it("offline: kept on the device and resolved at once, so the screen can update", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });

    await sendOrQueue(start("a"));
    await sendOrQueue(done("a"));

    expect(queueState().pending).toBe(2);
    expect(await store.get("s1:queue")).toHaveLength(2);
  });

  it("a send that fails for lack of a connection is queued, not reported", async () => {
    // Online as far as the app knew, but the request never got there.
    mockedSend.mockRejectedValueOnce({ message: "TypeError: Failed to fetch" });
    await expect(sendOrQueue(start("a"))).resolves.toBeUndefined();

    // Queued, then sent again — safe, because every send is guarded.
    await flushQueue();
    expect(mockedSend).toHaveBeenCalledTimes(2);
    expect(mockedSend).toHaveBeenLastCalledWith(start("a"));
    expect(queueState().pending).toBe(0);
  });

  it("back online: sent in order, with the times they happened", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    await sendOrQueue(done("a"));

    mockedSend.mockReset();
    mockedSend.mockResolvedValue("applied");
    setOnline(true);
    await flushQueue();

    expect(mockedSend.mock.calls.map(([action]) => action)).toEqual([start("a"), done("a")]);
    expect(queueState().pending).toBe(0);
    expect(await store.get("s1:queue")).toEqual([]);
  });

  it("while something is waiting, a new action goes behind it, even online", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));

    setOnline(true);
    mockedSend.mockReset();
    const order: string[] = [];
    mockedSend.mockImplementation(async (action) => {
      order.push(action.kind);
      return "applied";
    });
    await sendOrQueue(done("a"));
    await flushQueue();

    expect(order).toEqual(["startSession", "completeSession"]);
  });

  it("survives closing the app: the same student's queue is loaded and sent", async () => {
    await store.put("s1:queue", [{ id: "q1", action: start("a"), attempts: 0, stuck: false }]);
    resetOfflineQueueForTests();

    await signIn("s1");

    expect(mockedSend).toHaveBeenCalledWith(start("a"));
    expect(queueState().pending).toBe(0);
  });

  it("waits for a fresh sign-in before sending", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    mockedSend.mockReset();

    setOnline(true);
    mockedGetSession.mockResolvedValue({ data: { session: null }, error: null });
    await flushQueue();
    expect(mockedSend).not.toHaveBeenCalled();
    expect(queueState().pending).toBe(1);

    mockedSend.mockResolvedValue("applied");
    await signIn("s1");
    expect(mockedSend).toHaveBeenCalledWith(start("a"));
  });

  it("a different student signing in: the previous one's changes are discarded", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    mockedSend.mockReset();

    setOnline(true);
    await signIn("s2");

    expect(mockedSend).not.toHaveBeenCalled();
    expect(queueState().pending).toBe(0);
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/discarded 1 unsent/));
    info.mockRestore();
  });

  it("a conflict is dropped and noted once; the rest still sends", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(done("gone"));
    await sendOrQueue(start("b"));

    setOnline(true);
    mockedSend.mockReset();
    mockedSend.mockResolvedValueOnce("conflict").mockResolvedValueOnce("applied");
    await flushQueue();

    expect(mockedSend).toHaveBeenCalledTimes(2);
    expect(queueState()).toEqual({ pending: 0, stuck: false, conflict: true });
    dismissConflictNotice();
    expect(queueState().conflict).toBe(false);
  });

  it("a record whose session was removed (foreign key) is a conflict too", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue({ kind: "recordFriction", row: { id: "f1" } });

    setOnline(true);
    mockedSend.mockReset();
    mockedSend.mockRejectedValueOnce({ message: "violates foreign key", code: "23503" });
    await flushQueue();

    expect(queueState()).toMatchObject({ pending: 0, conflict: true });
  });

  it("a real failure retries, then waits in Settings: Try again sends it", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    await sendOrQueue(done("a"));

    setOnline(true);
    mockedSend.mockReset();
    mockedSend.mockRejectedValue({ message: "server error", code: "XX000" });
    await flushQueue();

    expect(mockedSend).toHaveBeenCalledTimes(3);
    expect(queueState()).toMatchObject({ pending: 2, stuck: true });

    // Stuck blocks what's behind it — order matters.
    await flushQueue();
    expect(mockedSend).toHaveBeenCalledTimes(3);

    mockedSend.mockReset();
    mockedSend.mockResolvedValue("applied");
    await retryStuck();
    expect(mockedSend).toHaveBeenCalledTimes(2);
    expect(queueState()).toMatchObject({ pending: 0, stuck: false });
  });

  it("…or Discard drops just that one and sends the rest", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    await sendOrQueue(done("b"));

    setOnline(true);
    mockedSend.mockReset();
    mockedSend.mockRejectedValue({ message: "server error" });
    await flushQueue();
    expect(queueState().stuck).toBe(true);

    mockedSend.mockReset();
    mockedSend.mockResolvedValue("applied");
    await discardStuck();
    await flushQueue();
    expect(mockedSend.mock.calls.map(([action]) => action)).toEqual([done("b")]);
    expect(queueState().pending).toBe(0);
  });

  it("signing out discards the queue, even mid-send", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    await sendOrQueue(done("a"));

    setOnline(true);
    mockedSend.mockReset();
    let finish: (value: "applied") => void = () => {};
    mockedSend.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const sending = flushQueue();
    await vi.waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));

    discardQueue();
    finish("applied");
    await sending;

    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(queueState().pending).toBe(0);
  });

  it("reads show what's waiting — fresh from the server or from storage", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));

    const planned: WorkSession = {
      id: "a",
      workItemId: "w1",
      date: "2026-09-26",
      plannedMinutes: 30,
      startTime: null,
      status: "planned",
    };
    const fresh = await cachedRead("s1", "workSessions:all", async () => [planned]);
    expect(fresh[0]).toMatchObject({ status: "in_progress", startedAt: "2026-09-26T16:02:00.000Z" });

    // Never the supporter dashboard's reads for another student.
    const theirs = await cachedRead("someone-else", "workSessions:all", async () => [planned]);
    expect(theirs[0]!.status).toBe("planned");
  });

  it("an action sent while a read was on its way still shows on that read", async () => {
    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));
    setOnline(true);
    mockedSend.mockReset();
    mockedSend.mockResolvedValue("applied");

    const planned: WorkSession = {
      id: "a",
      workItemId: "w1",
      date: "2026-09-26",
      plannedMinutes: 30,
      startTime: null,
      status: "planned",
    };
    // The server's reply was put together before the Start arrived.
    const read = cachedRead("s1", "workSessions:all", async () => {
      await flushQueue();
      return [planned];
    });
    expect((await read)[0]!.status).toBe("in_progress");
  });

  it("instant screens: a peek shows what's waiting to be saved, like any read", async () => {
    const planned: WorkSession = {
      id: "a",
      workItemId: "w1",
      date: "2026-09-26",
      plannedMinutes: 30,
      startTime: null,
      status: "planned",
    };
    await cachedRead("s1", "workSessions:all", async () => [planned]);

    setOnline(false);
    mockedSend.mockRejectedValue({ message: "AbortError: You're offline." });
    await sendOrQueue(start("a"));

    const peeked = peekRead<WorkSession[]>("s1", "workSessions:all");
    expect(peeked?.[0]).toMatchObject({ status: "in_progress", startedAt: "2026-09-26T16:02:00.000Z" });
  });
});

