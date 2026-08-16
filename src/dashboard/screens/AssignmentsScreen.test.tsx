import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignmentsScreen from "./AssignmentsScreen";
import type { DashboardData } from "../hooks/useDashboardData";

const baseData: DashboardData = {
  courses: [{ id: "c1", name: "English 10", colorIndex: 0 }],
  assignments: [
    {
      id: "a1",
      courseId: "c1",
      title: "Book report",
      dueDate: "2026-03-15",
      effortMinutes: 120,
      notes: null,
      completedAt: null,
    },
    {
      id: "a2",
      courseId: "c1",
      title: "Reading log",
      dueDate: "2026-03-10",
      effortMinutes: 30,
      notes: null,
      completedAt: "2026-03-09T00:00:00Z",
    },
  ],
  workItems: [
    { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
    { id: "w2", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
  ],
  decompositionAttempts: [
    {
      id: "da1",
      assignmentId: "a1",
      initialWorkItems: [],
      resultingWorkItems: ["Finish book", "Write report"],
      revisionCount: 2,
      assistanceRequested: false,
      initialScaffoldIntensity: "None",
      highestScaffoldIntensity: "None",
      scaffoldsProvided: [],
      outcome: "confirmed",
      occurredAt: "2026-03-08T00:00:00Z",
    },
  ],
  reflections: [
    {
      id: "rf1",
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "Some steps were too big",
      freeText: "Writing the draft felt impossible.",
      proposedAdjustment: "Make smaller steps next time",
      scaffoldIntensity: "Structured",
      occurredAt: "2026-03-14T00:00:00Z",
    },
  ],
};

describe("AssignmentsScreen", () => {
  it("lists open assignments by default with breakdown state and effort", () => {
    render(<AssignmentsScreen mode="coach" data={baseData} />);
    const table = screen.getByRole("table");

    expect(within(table).getByText("Book report")).toBeInTheDocument();
    expect(within(table).queryByText("Reading log")).not.toBeInTheDocument(); // completed, filtered out by default "Open" status
    expect(within(table).getByText(/confirmed · 2 items/i)).toBeInTheDocument();
  });

  it("shows the selected assignment's confirmed breakdown, decomposition history, and reflection", async () => {
    render(<AssignmentsScreen mode="coach" data={baseData} />);

    expect(screen.getByText("Finish book")).toBeInTheDocument();
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText(/no assistance requested/i)).toBeInTheDocument();
    expect(screen.getByText('"Some steps were too big"')).toBeInTheDocument();
    expect(screen.getByText("Make smaller steps next time")).toBeInTheDocument();
  });

  it("hides decomposition attempt history and free text in Parent Mode", () => {
    render(<AssignmentsScreen mode="parent" data={baseData} />);

    expect(screen.queryByText(/decomposition attempt history/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/writing the draft felt impossible/i)).not.toBeInTheDocument();
    // Structured response and proposed adjustment remain visible.
    expect(screen.getByText('"Some steps were too big"')).toBeInTheDocument();
  });

  it("hides the recent-reflection column in Parent Mode", () => {
    render(<AssignmentsScreen mode="parent" data={baseData} />);

    expect(screen.queryByText(/recent reflection/i)).not.toBeInTheDocument();
  });

  it("filters by status", async () => {
    const userEventInstance = userEvent.setup();
    render(<AssignmentsScreen mode="coach" data={baseData} />);
    const table = screen.getByRole("table");

    await userEventInstance.selectOptions(screen.getByLabelText("Status"), "Complete");

    expect(within(table).getByText("Reading log")).toBeInTheDocument();
    expect(within(table).queryByText("Book report")).not.toBeInTheDocument();
  });

  it("filters by course", async () => {
    const dataWithSecondCourse: DashboardData = {
      ...baseData,
      courses: [...baseData.courses, { id: "c2", name: "Algebra II", colorIndex: 1 }],
      assignments: [
        ...baseData.assignments,
        { id: "a3", courseId: "c2", title: "Problem set 7", dueDate: "2026-03-12", effortMinutes: 45, notes: null, completedAt: null },
      ],
    };
    const userEventInstance = userEvent.setup();
    render(<AssignmentsScreen mode="coach" data={dataWithSecondCourse} />);
    const table = screen.getByRole("table");

    await userEventInstance.selectOptions(screen.getByLabelText("Course"), "c2");

    expect(within(table).getByText("Problem set 7")).toBeInTheDocument();
    expect(within(table).queryByText("Book report")).not.toBeInTheDocument();
  });

  it("selecting a different row updates the detail panel", async () => {
    const userEventInstance = userEvent.setup();
    render(<AssignmentsScreen mode="coach" data={baseData} />);

    await userEventInstance.selectOptions(screen.getByLabelText("Status"), "All");
    await userEventInstance.click(within(screen.getByRole("table")).getByText("Reading log"));

    expect(screen.getByText(/no confirmed work breakdown yet/i)).toBeInTheDocument();
  });

  it("shows an empty state when no assignments match the filter", () => {
    render(
      <AssignmentsScreen
        mode="coach"
        data={{ ...baseData, assignments: [baseData.assignments[1]] }}
      />,
    );

    expect(screen.getByText(/no assignments match this filter/i)).toBeInTheDocument();
  });
});
