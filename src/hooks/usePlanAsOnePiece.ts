import { useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as workBreakdownService from "../services/workBreakdownService";
import type { Assignment } from "../services/assignmentService";

// "Plan it as one piece" (daily-planning-and-completion-v2-proposal.md
// item 3): not every assignment is worth breaking down ("Read chapter 1
// by Tuesday"), so this makes a one-step breakdown named after the
// assignment, with its whole estimate — recorded as a confirmed Work
// Breakdown like any other (docs/decisions/
// 20260816-plan-directly-without-breakdown.md). Offered on Assignment
// Detail only since 2026-09-25 (docs/decisions/
// 20260925-plan-rows-and-one-piece.md). Resolves to the new step's id,
// so the caller can open Plan with it chosen.
export function usePlanAsOnePiece(studentId: string) {
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function planAsOnePiece(assignment: Assignment): Promise<string | null> {
    setPlanning(true);
    setError(null);
    try {
      const [created] = await workBreakdownService.confirmWorkBreakdown(
        studentId,
        assignment,
        [],
        [{ title: assignment.title, effortMinutes: assignment.effortMinutes }],
        0,
      );
      return created?.id ?? null;
    } catch (caught) {
      setError(errorMessage(caught));
      return null;
    } finally {
      setPlanning(false);
    }
  }

  return { planAsOnePiece, planning, error };
}
