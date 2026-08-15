import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PlanPage from "./PlanPage";

describe("PlanPage", () => {
  it("shows a coming-soon placeholder", () => {
    render(<PlanPage />);

    expect(screen.getByRole("heading", { name: /plan/i })).toBeInTheDocument();
    expect(screen.getByText(/planning is coming soon/i)).toBeInTheDocument();
  });
});
