import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as preferencesService from "../services/preferencesService";
import PreferencesPage from "./PreferencesPage";

const mockedService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
  upsertPreferences: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

beforeEach(() => {
  vi.clearAllMocks();
  mockedService.getPreferences.mockResolvedValue({
    weekdayFinishTime: "21:00",
    weekendHours: 10,
  });
});

describe("PreferencesPage", () => {
  it("pre-fills the form with the student's saved preferences", async () => {
    mockedService.getPreferences.mockResolvedValue({
      weekdayFinishTime: "20:30",
      weekendHours: 6,
    });

    render(<PreferencesPage user={user} onBack={vi.fn()} />);

    const weekdayInput = await screen.findByLabelText(/done studying by/i);
    await waitFor(() => expect(weekdayInput).toHaveValue("20:30"));
    expect(screen.getByLabelText(/hours available on a weekend day/i)).toHaveValue("6");
  });

  it("saves the entered values", async () => {
    mockedService.upsertPreferences.mockResolvedValue({
      weekdayFinishTime: "19:00",
      weekendHours: 4,
    });
    const userEventInstance = userEvent.setup();

    render(<PreferencesPage user={user} onBack={vi.fn()} />);
    const weekdayInput = await screen.findByLabelText(/done studying by/i);

    await userEventInstance.clear(weekdayInput);
    await userEventInstance.type(weekdayInput, "19:00");
    const weekendInput = screen.getByLabelText(/hours available on a weekend day/i);
    await userEventInstance.clear(weekendInput);
    await userEventInstance.type(weekendInput, "4");

    await userEventInstance.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockedService.upsertPreferences).toHaveBeenCalledWith("student-1", {
        weekdayFinishTime: "19:00",
        weekendHours: 4,
      }),
    );
    expect(await screen.findByRole("button", { name: /^saved$/i })).toBeInTheDocument();
  });

  it("disables Save when weekend hours is not a valid non-negative number", async () => {
    const userEventInstance = userEvent.setup();

    render(<PreferencesPage user={user} onBack={vi.fn()} />);
    const weekendInput = await screen.findByLabelText(/hours available on a weekend day/i);

    await userEventInstance.clear(weekendInput);
    await userEventInstance.type(weekendInput, "-3");

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("calls onBack when the back button is clicked", async () => {
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<PreferencesPage user={user} onBack={onBack} />);
    await screen.findByLabelText(/done studying by/i);

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
