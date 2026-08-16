import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OverviewScreen from "./OverviewScreen";
import type { DashboardData } from "../hooks/useDashboardData";

const data: DashboardData = {
  courses: [{ id: "c1", name: "English 10", colorIndex: 0 }],
  assignments: [
    { id: "a1", courseId: "c1", title: "Book report", dueDate: "2026-03-15", effortMinutes: 120, notes: null, completedAt: null },
    { id: "a2", courseId: "c1", title: "Reading log", dueDate: "2026-03-10", effortMinutes: 30, notes: null, completedAt: "2026-03-09T00:00:00Z" },
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

describe("OverviewScreen", () => {
  it("shows coach stats and current commitments in Coach Mode", () => {
    render(<OverviewScreen mode="coach" data={data} onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    expect(screen.getByText("Open assignments")).toBeInTheDocument();
    expect(screen.getByText("Book report")).toBeInTheDocument();
    expect(screen.queryByText("Reading log")).not.toBeInTheDocument();
  });

  it("shows a supportive summary in Parent Mode", () => {
    render(<OverviewScreen mode="parent" data={data} onNavigate={vi.fn()} />);

    expect(screen.getByText(/how things are going/i)).toBeInTheDocument();
    expect(screen.getByText("What's coming up")).toBeInTheDocument();
    expect(screen.getByText("Book report")).toBeInTheDocument();
    expect(screen.getByText("Recent progress")).toBeInTheDocument();
    expect(screen.getByText("Reading log")).toBeInTheDocument();
  });

  it("navigates to Assignments when a commitment is clicked", async () => {
    const onNavigate = vi.fn();
    const userEventInstance = userEvent.setup();
    render(<OverviewScreen mode="coach" data={data} onNavigate={onNavigate} />);

    await userEventInstance.click(screen.getByRole("button", { name: "Book report" }));

    expect(onNavigate).toHaveBeenCalledWith("assignments");
  });
});
