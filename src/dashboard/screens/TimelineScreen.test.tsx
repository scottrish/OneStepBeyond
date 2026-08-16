import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimelineScreen from "./TimelineScreen";
import type { DashboardData } from "../hooks/useDashboardData";

const data: DashboardData = {
  courses: [],
  assignments: [
    { id: "a1", courseId: "c1", title: "Book report", dueDate: "2026-03-15", effortMinutes: 120, notes: null, completedAt: null },
  ],
  workItems: [],
  decompositionAttempts: [
    {
      id: "da1",
      assignmentId: "a1",
      initialWorkItems: [],
      resultingWorkItems: ["Finish book"],
      revisionCount: 0,
      assistanceRequested: false,
      initialScaffoldIntensity: "None",
      highestScaffoldIntensity: "None",
      scaffoldsProvided: [],
      outcome: "confirmed",
      occurredAt: "2026-03-08T00:00:00Z",
    },
  ],
  reflections: [],
};

describe("TimelineScreen", () => {
  it("is hidden in Parent Mode", () => {
    render(<TimelineScreen mode="parent" data={data} />);

    expect(screen.getByText(/not available in parent mode/i)).toBeInTheDocument();
    expect(screen.queryByText(/work breakdown confirmed/i)).not.toBeInTheDocument();
  });

  it("lists synthesized events in Coach Mode without a payload inspector", () => {
    render(<TimelineScreen mode="coach" data={data} />);

    expect(screen.getByText("Work Breakdown Confirmed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /inspect payload/i })).not.toBeInTheDocument();
  });

  it("shows a payload inspector in Diagnostic Mode", async () => {
    const userEventInstance = userEvent.setup();
    render(<TimelineScreen mode="diagnostic" data={data} />);

    await userEventInstance.click(screen.getByRole("button", { name: /inspect payload/i }));

    expect(screen.getByText(/"attemptId": "da1"/)).toBeInTheDocument();
  });

  it("filters events by assignment or type", async () => {
    const userEventInstance = userEvent.setup();
    render(<TimelineScreen mode="coach" data={data} />);

    await userEventInstance.type(
      screen.getByPlaceholderText(/filter by event type or assignment/i),
      "nonexistent",
    );

    expect(screen.getByText(/no events match this filter/i)).toBeInTheDocument();
  });
});
