import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DiagnosticsScreen from "./DiagnosticsScreen";
import type { DashboardData } from "../hooks/useDashboardData";

const data: DashboardData = {
  courses: [],
  assignments: [
    { id: "a1", courseId: "c1", title: "Book report", dueDate: "2026-03-15", effortMinutes: 120, notes: null, completedAt: null },
  ],
  workItems: [
    { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
  ],
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

describe("DiagnosticsScreen", () => {
  it("shows entity counts and an entity index", () => {
    render(<DiagnosticsScreen data={data} />);

    expect(screen.getByText("Assignments")).toBeInTheDocument();
    expect(screen.getByText("a1")).toBeInTheDocument();
    expect(screen.getByText("w1")).toBeInTheDocument();
    expect(screen.getByText("da1")).toBeInTheDocument();
  });

  it("shows the raw event stream as JSON", () => {
    render(<DiagnosticsScreen data={data} />);

    expect(screen.getByText(/"type": "Work Breakdown Confirmed"/)).toBeInTheDocument();
  });
});
