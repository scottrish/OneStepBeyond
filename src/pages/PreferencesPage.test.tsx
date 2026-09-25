import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", saturdayHours: 2, sundayHours: 2 },
}));

import * as preferencesService from "../services/preferencesService";
import PreferencesPage from "./PreferencesPage";

const mockedService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
  upsertPreferences: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;
const stored = { weekdayFinishTime: "20:30", saturdayHours: 4.5, sundayHours: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  mockedService.getPreferences.mockResolvedValue(stored);
  mockedService.upsertPreferences.mockImplementation(async (_id: string, input: unknown) => input);
});

async function renderLoaded() {
  render(<PreferencesPage user={user} onBack={vi.fn()} />);
  await waitFor(() => expect(screen.getByLabelText(/study should be done by/i)).toHaveValue("20:30"));
}

describe("PreferencesPage", () => {
  it("shows the saved done-by time and each weekend day's own hours", async () => {
    await renderLoaded();

    expect(screen.getByText("4.5 hours")).toBeInTheDocument();
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
  });

  it("changing Saturday saves straight away, leaving Sunday and the weekday alone", async () => {
    const userEventInstance = userEvent.setup();
    await renderLoaded();

    await userEventInstance.click(screen.getByRole("button", { name: "More time on Saturday" }));

    expect(mockedService.upsertPreferences).toHaveBeenCalledWith("student-1", {
      weekdayFinishTime: "20:30",
      saturdayHours: 5,
      sundayHours: 1,
    });
    expect(screen.getByText("5 hours")).toBeInTheDocument();
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("changing Sunday saves only Sunday's new value", async () => {
    const userEventInstance = userEvent.setup();
    await renderLoaded();

    await userEventInstance.click(screen.getByRole("button", { name: "Less time on Sunday" }));

    expect(mockedService.upsertPreferences).toHaveBeenCalledWith("student-1", {
      weekdayFinishTime: "20:30",
      saturdayHours: 4.5,
      sundayHours: 0.5,
    });
  });

  it("each stepper button has a distinct name; − is disabled at 0 and + at 8", async () => {
    mockedService.getPreferences.mockResolvedValue({
      weekdayFinishTime: "20:30",
      saturdayHours: 0,
      sundayHours: 8,
    });
    await renderLoaded();

    expect(screen.getByRole("button", { name: "Less time on Saturday" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "More time on Saturday" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "More time on Sunday" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Less time on Sunday" })).toBeEnabled();
    expect(screen.getByText("No study time")).toBeInTheDocument();
  });

  it("announces each change in a polite live region", async () => {
    const userEventInstance = userEvent.setup();
    await renderLoaded();

    await userEventInstance.click(screen.getByRole("button", { name: "Less time on Sunday" }));

    expect(screen.getByText("0.5 hours")).toHaveAttribute("aria-live", "polite");
  });

  it("changing the done-by time saves it straight away; a half-typed (empty) time isn't saved", async () => {
    await renderLoaded();
    const input = screen.getByLabelText(/study should be done by/i);

    fireEvent.change(input, { target: { value: "" } });
    expect(mockedService.upsertPreferences).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "19:00" } });
    expect(mockedService.upsertPreferences).toHaveBeenCalledWith("student-1", {
      ...stored,
      weekdayFinishTime: "19:00",
    });
    expect(screen.getByText(/planning counts study time up to 7:00 PM/i)).toBeInTheDocument();
  });

  it("says when a save fails and can try again, keeping the change on screen", async () => {
    mockedService.upsertPreferences.mockRejectedValueOnce(new Error("network down"));
    const userEventInstance = userEvent.setup();
    await renderLoaded();

    await userEventInstance.click(screen.getByRole("button", { name: "More time on Saturday" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn’t save your study hours/i);
    expect(screen.getByText("5 hours")).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(mockedService.upsertPreferences).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<PreferencesPage user={user} onBack={onBack} />);
    await screen.findByLabelText(/study should be done by/i);

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
