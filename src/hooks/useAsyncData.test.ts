import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAsyncData } from "./useAsyncData";

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
});
