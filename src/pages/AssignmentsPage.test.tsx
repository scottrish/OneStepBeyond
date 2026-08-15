import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AssignmentsPage from "./AssignmentsPage";

describe("AssignmentsPage", () => {
  it("shows a coming-soon placeholder that points back to Home for capture", () => {
    render(<AssignmentsPage />);

    expect(
      screen.getByRole("heading", { name: /assignments/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your assignment list is coming soon/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/capture new assignments from home/i)).toBeInTheDocument();
  });
});
