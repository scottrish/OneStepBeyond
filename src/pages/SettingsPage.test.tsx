import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage";
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
});
