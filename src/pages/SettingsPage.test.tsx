import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage";

function renderSettingsPage(overrides: Record<string, unknown> = {}) {
  return render(
    <SettingsPage
      onBack={vi.fn()}
      onGoToActivities={vi.fn()}
      onGoToCourses={vi.fn()}
      onGoToPreferences={vi.fn()}
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

  it("calls signOut when Sign out is clicked", async () => {
    const signOut = vi.fn();
    const userEventInstance = userEvent.setup();

    renderSettingsPage({ signOut });

    await userEventInstance.click(
      screen.getByRole("button", { name: /sign out/i }),
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
