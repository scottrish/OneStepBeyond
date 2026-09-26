import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBanner from "./ErrorBanner";

describe("ErrorBanner", () => {
  it("renders a bare alert with no retry button when onRetry is omitted", () => {
    render(<ErrorBanner message="Something went wrong." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a retry button and calls onRetry when provided", async () => {
    const onRetry = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<ErrorBanner message="Couldn’t load your data." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your data.");
    await userEventInstance.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports a custom retry label", () => {
    render(<ErrorBanner message="Failed." onRetry={vi.fn()} retryLabel="Retry" />);

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  describe("offline (PWA phase 2, decision O1)", () => {
    function setOnline(online: boolean) {
      Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
      act(() => {
        window.dispatchEvent(new Event(online ? "online" : "offline"));
      });
    }

    afterEach(() => {
      Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    });

    it("a load error says 'You're offline' calmly — no 'Couldn't load', no alert", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const onRetry = vi.fn();
      render(<ErrorBanner message="Couldn’t load your day." onRetry={onRetry} />);

      expect(screen.getByRole("status")).toHaveTextContent(
        "You’re offline. This will load when you’re back online.",
      );
      expect(screen.queryByText(/couldn.t load/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      // A quiet Try again, for when the device never reports coming back.
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("counts as offline when requests aren't reaching the server, even if the browser says online", async () => {
      const { reachabilityFetch } = await import("../lib/networkStatus");
      await act(async () => {
        await reachabilityFetch(() => Promise.reject(new TypeError("Failed to fetch")))("https://example.test").catch(
          () => {},
        );
      });
      render(<ErrorBanner message="Couldn’t load your day." onRetry={vi.fn()} />);
      expect(screen.getByRole("status")).toHaveTextContent(/you’re offline/i);

      await act(async () => {
        await reachabilityFetch(() => Promise.resolve(new Response("ok")))("https://example.test");
      });
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your day.");
    });

    it("tries again by itself once the connection is back, and shows the usual banner if it still fails", () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const onRetry = vi.fn();
      render(<ErrorBanner message="Couldn’t load your day." onRetry={onRetry} />);
      expect(onRetry).not.toHaveBeenCalled();

      setOnline(true);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your day.");
    });

    it("doesn't retry on its own while online", () => {
      const onRetry = vi.fn();
      render(<ErrorBanner message="Couldn’t load your day." onRetry={onRetry} />);
      setOnline(true);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it("offline after a failed request, then the connection returns: it retries by itself", async () => {
      const { reachabilityFetch } = await import("../lib/networkStatus");
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      await act(async () => {
        await reachabilityFetch(vi.fn())("https://example.test").catch(() => {});
      });
      const onRetry = vi.fn();
      render(<ErrorBanner message="Couldn’t load your day." onRetry={onRetry} />);
      expect(screen.getByRole("status")).toHaveTextContent(/you’re offline/i);

      setOnline(true);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
