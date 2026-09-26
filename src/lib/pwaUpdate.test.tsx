import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateNote from "../pages/home/UpdateNote";
import { registerServiceWorker } from "./registerServiceWorker";

// PWA phase 2, increment 2a (docs/features/pwa-phase-2-offline-v0.1.md;
// decisions W4 and O2).

afterEach(() => {
  vi.resetModules();
});

describe("registerServiceWorker", () => {
  it("never registers outside a production build", async () => {
    const load = vi.fn();
    await registerServiceWorker(false, load);
    expect(load).not.toHaveBeenCalled();
  });

  it("in production, a waiting version is offered on Home, and Refresh applies it", async () => {
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
    let needRefresh: () => void = () => {};
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const registerSW = vi.fn((options: { onNeedRefresh?: () => void }) => {
      needRefresh = options.onNeedRefresh!;
      return updateServiceWorker;
    });

    await registerServiceWorker(true, async () => ({ registerSW }));
    render(<UpdateNote />);
    expect(screen.queryByText("A new version is ready.")).not.toBeInTheDocument();

    act(() => needRefresh());
    expect(screen.getByText("A new version is ready.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("Later hides it (until the app is next opened) without reloading", async () => {
    // A fresh store: "Later" only lasts for this run of the app.
    vi.resetModules();
    const store = await import("./pwaUpdateStore");
    const { default: FreshUpdateNote } = await import("../pages/home/UpdateNote");
    const apply = vi.fn();

    act(() => store.setUpdateReady(apply));
    render(<FreshUpdateNote />);
    await userEvent.click(screen.getByRole("button", { name: "Later" }));

    expect(screen.queryByText("A new version is ready.")).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });
});
