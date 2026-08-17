import { useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { moveItem } from "../domain/reorder";
import * as workBreakdownService from "../services/workBreakdownService";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

export type DraftItem = {
  key: string;
  title: string;
  effortMinutes: number;
};

// Manages the in-memory-only draft state for the "Break this down" flow
// (docs/features/manual-work-breakdown-reflection-v0.1.md §4). Nothing
// here touches the server until confirm() — see
// docs/decisions/20260815-manual-work-breakdown-draft-state.md for why.
//
// Completed items never enter the editable draft — they can't be
// renamed, estimated, reordered, or deleted through this flow. See
// docs/features/work-breakdown-revision-preserves-completed-items.md.
export function useWorkBreakdownDraft(
  studentId: string,
  assignment: Assignment,
  confirmedItems: WorkItem[],
) {
  const completedItems = confirmedItems.filter((item) => item.completedAt !== null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>(() =>
    confirmedItems
      .filter((item) => item.completedAt === null)
      .map((item) => ({
        key: item.id,
        title: item.title,
        effortMinutes: item.effortMinutes,
      })),
  );
  const [revisionCount, setRevisionCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  function addItem(title: string) {
    setDraftItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), title, effortMinutes: 0 },
    ]);
    setRevisionCount((count) => count + 1);
  }

  function editItem(key: string, title: string) {
    setDraftItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, title } : item)),
    );
    setRevisionCount((count) => count + 1);
  }

  function setEstimate(key: string, effortMinutes: number) {
    setDraftItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, effortMinutes } : item)),
    );
    setRevisionCount((count) => count + 1);
  }

  function deleteItem(key: string) {
    setDraftItems((prev) => prev.filter((item) => item.key !== key));
    setRevisionCount((count) => count + 1);
  }

  function moveDraftItem(index: number, direction: "up" | "down") {
    setDraftItems((prev) => moveItem(prev, index, direction));
    setRevisionCount((count) => count + 1);
  }

  async function confirm(): Promise<WorkItem[] | null> {
    setActionError(null);
    try {
      return await workBreakdownService.confirmWorkBreakdown(
        studentId,
        assignment,
        confirmedItems,
        draftItems.map((item) => ({
          title: item.title,
          effortMinutes: item.effortMinutes,
        })),
        revisionCount,
      );
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    }
  }

  return {
    draftItems,
    completedItems,
    actionError,
    addItem,
    editItem,
    setEstimate,
    deleteItem,
    moveDraftItem,
    confirm,
  };
}
