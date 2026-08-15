import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn(),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));

import * as activityService from "../services/activityService";
import ActivitiesPage from "./ActivitiesPage";

const mockedService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
  createActivity: ReturnType<typeof vi.fn>;
  updateActivityDays: ReturnType<typeof vi.fn>;
  deleteActivity: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

const activity = {
  id: "1",
  name: "Football practice",
  days: [1, 2, 3, 4, 5],
  startTime: "15:30",
  finishTime: "17:00",
  travelMinutes: 15,
};

describe("ActivitiesPage", () => {
  it("shows the empty state when there are no activities", async () => {
    mockedService.listActivities.mockResolvedValue([]);

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText(/no activities yet/i)).toBeInTheDocument();
  });

  it("lists existing activities with days, times, and travel", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText("Football practice")).toBeInTheDocument();
    expect(screen.getByText(/3:30 PM–5:00 PM/)).toBeInTheDocument();
    expect(screen.getByText(/15m travel/)).toBeInTheDocument();
  });

  it("disables Add activity until name, a day, and a valid time range are set", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no activities yet/i);

    const addButton = screen.getByRole("button", { name: /add activity/i });
    // Days default to Mon-Fri and times default to a valid range, so only
    // the name is missing initially.
    expect(addButton).toBeDisabled();

    await userEventInstance.type(
      screen.getByLabelText(/what is it\?/i),
      "Football practice",
    );
    expect(addButton).toBeEnabled();
  });

  it("adds an activity and clears the name field", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    mockedService.createActivity.mockResolvedValue(activity);
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no activities yet/i);

    const input = screen.getByLabelText(/what is it\?/i);
    await userEventInstance.type(input, "Football practice");
    await userEventInstance.click(
      screen.getByRole("button", { name: /add activity/i }),
    );

    await waitFor(() =>
      expect(mockedService.createActivity).toHaveBeenCalledWith(
        "student-1",
        expect.objectContaining({
          name: "Football practice",
          days: [1, 2, 3, 4, 5],
        }),
      ),
    );
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("toggles a day off in the add form", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no activities yet/i);

    const withinForm = screen.getByRole("group", { name: "Which days?" });
    const monday = within(withinForm).getByRole("button", { name: "Mon" });
    expect(monday).toHaveAttribute("aria-pressed", "true");

    await userEventInstance.click(monday);
    expect(monday).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles an existing activity's day in place", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);
    mockedService.updateActivityDays.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Football practice");

    const group = screen.getByRole("group", {
      name: "Days for Football practice",
    });
    await userEventInstance.click(within(group).getByRole("button", { name: "Sat" }));

    expect(mockedService.updateActivityDays).toHaveBeenCalledWith(
      "1",
      [1, 2, 3, 4, 5, 6],
    );
  });

  it("removes an activity", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);
    mockedService.deleteActivity.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Football practice");

    await userEventInstance.click(
      screen.getByRole("button", { name: /remove football practice/i }),
    );

    expect(mockedService.deleteActivity).toHaveBeenCalledWith("1");
  });

  it("calls onBack when the back button is clicked", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<ActivitiesPage user={user} onBack={onBack} />);
    await screen.findByText(/no activities yet/i);

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
