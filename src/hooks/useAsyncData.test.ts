import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAsyncData } from "./useAsyncData";
import { reachabilityFetch } from "../lib/networkStatus";

describe("useAsyncData", () => {
  it("starts loading, then resolves with the fetched data", async () => {
    const fetcher = vi.fn().mockResolvedValue(["a", "b"]);

    const { result } = renderHook(() => useAsyncData(fetcher, [] as string[]));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.loadError).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("sets loadError on a rejected fetch, without throwing", async () => {
    const fetcher = vi.fn().mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useAsyncData(fetcher, [] as string[]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe("boom");
    expect(result.current.data).toEqual([]);
  });

  it("re-fetches when the fetcher reference changes", async () => {
    const fetcher1 = vi.fn().mockResolvedValue("first");
    const fetcher2 = vi.fn().mockResolvedValue("second");

    const { result, rerender } = renderHook(
      ({ fetcher }) => useAsyncData(fetcher, ""),
      { initialProps: { fetcher: fetcher1 } },
    );
    await waitFor(() => expect(result.current.data).toBe("first"));

    rerender({ fetcher: fetcher2 });
    await waitFor(() => expect(result.current.data).toBe("second"));
  });

  it("retry resets loading and loadError before re-fetching", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ message: "boom" }).mockResolvedValueOnce("ok");

    const { result } = renderHook(() => useAsyncData(fetcher, ""));
    await waitFor(() => expect(result.current.loadError).toBe("boom"));

    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    expect(result.current.loadError).toBeNull();

    await waitFor(() => expect(result.current.data).toBe("ok"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("setData allows a caller's own optimistic mutation", async () => {
    const fetcher = vi.fn().mockResolvedValue(["a"]);

    const { result } = renderHook(() => useAsyncData(fetcher, [] as string[]));
    await waitFor(() => expect(result.current.data).toEqual(["a"]));

    act(() => result.current.setData((prev) => [...prev, "b"]));

    expect(result.current.data).toEqual(["a", "b"]);
  });

  it("refetch re-runs the fetcher without resetting loading first", async () => {
    const fetcher = vi.fn().mockResolvedValue("value");

    const { result } = renderHook(() => useAsyncData(fetcher, ""));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.refetch());

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });

  describe("back online (PWA phase 2, 2b)", () => {
    function setOnline(online: boolean) {
      Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
      act(() => {
        window.dispatchEvent(new Event(online ? "online" : "offline"));
      });
    }

    afterEach(() => {
      Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    });

    it("reads again by itself when the connection returns", async () => {
      const fetcher = vi.fn().mockResolvedValueOnce("stored").mockResolvedValue("fresh");
      const { result } = renderHook(() => useAsyncData(fetcher, ""));
      await waitFor(() => expect(result.current.data).toBe("stored"));

      setOnline(false);
      expect(fetcher).toHaveBeenCalledTimes(1);
      setOnline(true);

      await waitFor(() => expect(result.current.data).toBe("fresh"));
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("doesn't read again while staying online", async () => {
      const fetcher = vi.fn().mockResolvedValue("x");
      const { result } = renderHook(() => useAsyncData(fetcher, ""));
      await waitFor(() => expect(result.current.loading).toBe(false));

      setOnline(true);

      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });
});

describe("instant screens (instant-screen-data-v0.1.md)", () => {
  // A save, as the Supabase client's fetch wrapper sees one.
  const save = () =>
    reachabilityFetch(() => Promise.resolve(new Response("ok")))("https://x.supabase.co/rest/v1/work_sessions", {
      method: "PATCH",
    });

  it("with a copy, the first render already has it — and it still refreshes", async () => {
    const fetcher = vi.fn().mockResolvedValue(["fresh"]);
    const { result } = renderHook(() => useAsyncData(fetcher, [] as string[], { peek: () => ["known"] }));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(["known"]);
    await waitFor(() => expect(result.current.data).toEqual(["fresh"]));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("with no copy, behaves as before", async () => {
    const fetcher = vi.fn().mockResolvedValue(["fresh"]);
    const { result } = renderHook(() => useAsyncData(fetcher, [] as string[], { peek: () => undefined }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(["fresh"]));
  });

  it("a read that was on its way when a save started is set aside and read again — a just-made change doesn't flip back (F1)", async () => {
    let finishFirst: (value: string) => void = () => {};
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => (finishFirst = resolve)))
      .mockResolvedValue("after the save");
    const { result } = renderHook(() => useAsyncData(fetcher, "", { peek: () => "known" }));

    // The student acts on what's showing: a save, and the screen's own update.
    await act(async () => {
      await save();
      result.current.setData("changed by the student");
    });
    await act(async () => {
      finishFirst("from before the save");
    });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.data).toBe("after the save"));
    expect(result.current.data).not.toBe("from before the save");
  });

  it("a new fetcher (e.g. another day) shows its copy at once (F3)", async () => {
    const copies: Record<string, string> = { mon: "Monday's copy", tue: "Tuesday's copy" };
    const pending = () => vi.fn(() => new Promise<string>(() => {}));
    const fetchers = { mon: pending(), tue: pending() };
    const { result, rerender } = renderHook(
      ({ day }: { day: "mon" | "tue" }) => useAsyncData(fetchers[day], "", { peek: () => copies[day] }),
      { initialProps: { day: "mon" } },
    );
    expect(result.current.data).toBe("Monday's copy");

    rerender({ day: "tue" });
    expect(result.current.data).toBe("Tuesday's copy");
    expect(result.current.loading).toBe(false);
  });

  it("a failed refresh keeps the content and reports it separately (I3); Try again refreshes in place", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ message: "boom" }).mockResolvedValue("fresh");
    const { result } = renderHook(() => useAsyncData(fetcher, "", { peek: () => "known" }));

    await waitFor(() => expect(result.current.refreshError).toBe("boom"));
    expect(result.current.loadError).toBeNull();
    expect(result.current.data).toBe("known");

    act(() => result.current.retry());
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(result.current.data).toBe("fresh"));
    expect(result.current.refreshError).toBeNull();
  });

  it("offline with content showing, a failed refresh says nothing (the offline line does)", async () => {
    const fetcher = vi.fn().mockRejectedValue({ message: "TypeError: Failed to fetch" });
    const { result } = renderHook(() => useAsyncData(fetcher, "", { peek: () => "known" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    await act(async () => {});
    expect(result.current.refreshError).toBeNull();
    expect(result.current.loadError).toBeNull();
    expect(result.current.data).toBe("known");
  });
});

