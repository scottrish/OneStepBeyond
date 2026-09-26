import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage";

// Unsaved offline changes (PWA phase 2, 2c), set per test.
const offlineQueue = vi.hoisted(() => ({
  state: { pending: 0, stuck: false, conflict: false },
  retry: vi.fn(),
  discard: vi.fn(),
}));
vi.mock("../hooks/useOfflineQueue", () => ({
  useOfflineQueue: () => ({
    ...offlineQueue.state,
    retry: offlineQueue.retry,
    discard: offlineQueue.discard,
    dismissConflict: vi.fn(),
  }),
}));
import { initAppearance, setAppearance } from "../lib/appearanceStore";

function renderSettingsPage(overrides: Record<string, unknown> = {}) {
  return render(
    <SettingsPage
      onBack={vi.fn()}
      onGoToActivities={vi.fn()}
      onGoToCourses={vi.fn()}
      onGoToPreferences={vi.fn()}
      onGoToSupport={vi.fn()}
      signOut={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SettingsPage", () => {
  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ onBack });

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onGoToActivities when Activities is clicked", async () => {
    const onGoToActivities = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ onGoToActivities });

    await userEventInstance.click(
      screen.getByRole("button", { name: /activities/i }),
    );
    expect(onGoToActivities).toHaveBeenCalledTimes(1);
  });

  it("calls onGoToCourses when Courses is clicked", async () => {
    const onGoToCourses = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ onGoToCourses });

    await userEventInstance.click(
      screen.getByRole("button", { name: /courses/i }),
    );
    expect(onGoToCourses).toHaveBeenCalledTimes(1);
  });

  it("calls onGoToPreferences when Study hours is clicked", async () => {
    const onGoToPreferences = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ onGoToPreferences });

    await userEventInstance.click(
      screen.getByRole("button", { name: /study hours/i }),
    );
    expect(onGoToPreferences).toHaveBeenCalledTimes(1);
  });

  it("calls onGoToSupport when Support is clicked", async () => {
    const onGoToSupport = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ onGoToSupport });

    await userEventInstance.click(screen.getByRole("button", { name: /support/i }));
    expect(onGoToSupport).toHaveBeenCalledTimes(1);
  });

  it("calls signOut when Sign out is clicked", async () => {
    const signOut = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ signOut });

    await userEventInstance.click(
      screen.getByRole("button", { name: /sign out/i }),
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  describe("Appearance (docs/features/appearance-light-dark-v0.1.md)", () => {
    afterEach(() => {
      setAppearance("system");
      window.localStorage.clear();
      vi.unstubAllGlobals();
    });

    it("shows the current choice, and opens a sheet with the three options", async () => {
      setAppearance("system");
      const userEventInstance = userEvent.setup();
      renderSettingsPage();

      const row = screen.getByRole("button", { name: /^appearance/i });
      expect(row).toHaveTextContent("Match my device");
      await userEventInstance.click(row);

      const sheet = screen.getByRole("dialog", { name: "Appearance" });
      const radios = within(sheet).getAllByRole("radio");
      expect(radios.map((r) => r.getAttribute("value"))).toEqual(["system", "light", "dark"]);
      expect(within(sheet).getByRole("radio", { name: /match my device/i })).toBeChecked();
      expect(within(sheet).getByRole("group", { name: "Appearance" })).toBeInTheDocument();
    });

    it("choosing Dark applies it at once and saves it on this device", async () => {
      setAppearance("system");
      const userEventInstance = userEvent.setup();
      renderSettingsPage();

      await userEventInstance.click(screen.getByRole("button", { name: /^appearance/i }));
      await userEventInstance.click(screen.getByRole("radio", { name: "Dark" }));

      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(window.localStorage.getItem("osb-appearance")).toBe("dark");

      // Closing keeps the choice (no Save); the row then shows it.
      await userEventInstance.keyboard("{Escape}");
      expect(await screen.findByRole("button", { name: /^appearance/i })).toHaveTextContent("Dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("arrow keys move between the options", async () => {
      setAppearance("system");
      const userEventInstance = userEvent.setup();
      renderSettingsPage();

      await userEventInstance.click(screen.getByRole("button", { name: /^appearance/i }));
      screen.getByRole("radio", { name: /match my device/i }).focus();
      await userEventInstance.keyboard("{ArrowDown}");

      expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("'Match my device' follows the device, including a change while the app is open", () => {
      let listener: (() => void) | null = null;
      const query = {
        matches: true,
        addEventListener: (_: string, handler: () => void) => {
          listener = handler;
        },
      };
      vi.stubGlobal("matchMedia", () => query);

      setAppearance("system");
      initAppearance();
      expect(document.documentElement.dataset.theme).toBe("dark");

      query.matches = false;
      listener!();
      expect(document.documentElement.dataset.theme).toBe("light");

      // A fixed choice ignores the device.
      setAppearance("dark");
      query.matches = false;
      listener!();
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });

  describe("changes made offline (PWA phase 2, 2c)", () => {
    afterEach(() => {
      offlineQueue.state = { pending: 0, stuck: false, conflict: false };
    });

    it("with nothing waiting: no note, and Sign out signs out straight away", async () => {
      const signOut = vi.fn();
      renderSettingsPage({ signOut });
      expect(screen.queryByText(/waiting to be saved/)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it("shows how many changes are waiting", () => {
      offlineQueue.state = { pending: 3, stuck: false, conflict: false };
      renderSettingsPage();
      const note = screen.getByRole("region", { name: "Unsaved changes" });
      expect(note).toHaveTextContent("3 changes waiting to be saved");
      expect(note).toHaveTextContent("They’ll be saved when you’re back online.");
      expect(within(note).queryByRole("button")).not.toBeInTheDocument();
    });

    it("a change that hasn't gone through offers Try again and Discard — never 'failed'", async () => {
      offlineQueue.state = { pending: 1, stuck: true, conflict: false };
      renderSettingsPage();
      const note = screen.getByRole("region", { name: "Unsaved changes" });
      expect(note).toHaveTextContent("1 change waiting to be saved");
      expect(note).not.toHaveTextContent(/fail|error/i);

      await userEvent.click(within(note).getByRole("button", { name: "Try again" }));
      expect(offlineQueue.retry).toHaveBeenCalledTimes(1);
      await userEvent.click(within(note).getByRole("button", { name: "Discard" }));
      expect(offlineQueue.discard).toHaveBeenCalledTimes(1);
    });

    it("signing out with changes waiting warns first; Stay signed in keeps them", async () => {
      offlineQueue.state = { pending: 2, stuck: false, conflict: false };
      const signOut = vi.fn();
      renderSettingsPage({ signOut });

      await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
      const dialog = screen.getByRole("dialog", { name: "Sign out?" });
      expect(dialog).toHaveTextContent(
        "You have changes that haven’t been saved yet. Signing out will lose them.",
      );

      await userEvent.click(within(dialog).getByRole("button", { name: "Stay signed in" }));
      expect(signOut).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("…and Sign out anyway signs out", async () => {
      offlineQueue.state = { pending: 2, stuck: false, conflict: false };
      const signOut = vi.fn();
      renderSettingsPage({ signOut });

      await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
      await userEvent.click(screen.getByRole("button", { name: "Sign out anyway" }));
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
