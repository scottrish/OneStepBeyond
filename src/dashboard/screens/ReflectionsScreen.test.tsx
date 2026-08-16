import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ReflectionsScreen from "./ReflectionsScreen";
import type { DashboardData } from "../hooks/useDashboardData";

const data: DashboardData = {
  courses: [],
  assignments: [
    { id: "a1", courseId: "c1", title: "Book report", dueDate: "2026-03-15", effortMinutes: 120, notes: null, completedAt: null },
  ],
  workItems: [],
  decompositionAttempts: [],
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

describe("ReflectionsScreen", () => {
  it("shows structured response, free text, and proposed adjustment in Coach Mode", () => {
    render(<ReflectionsScreen mode="coach" data={data} />);

    expect(screen.getByText("Some steps were too big")).toBeInTheDocument();
    expect(screen.getByText('"Writing the draft felt impossible."')).toBeInTheDocument();
    expect(screen.getByText("Make smaller steps next time")).toBeInTheDocument();
  });

  it("hides free text but keeps structured response in Parent Mode", () => {
    render(<ReflectionsScreen mode="parent" data={data} />);

    expect(screen.getByText("Some steps were too big")).toBeInTheDocument();
    expect(screen.queryByText(/writing the draft felt impossible/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no reflections", () => {
    render(<ReflectionsScreen mode="coach" data={{ ...data, reflections: [] }} />);

    expect(screen.getByText(/no reflections match this filter/i)).toBeInTheDocument();
  });
});
