import { useMemo } from "react";
import { todayISODate } from "../domain/planningDate";
import { assignmentsNeedingAttention } from "../domain/riskDetection";
import type { AttentionItem } from "../domain/riskDetection";
import { useActivities } from "./useActivities";
import { useAllWorkSessions } from "./useAllWorkSessions";
import { usePreferences } from "./usePreferences";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 2 — Assignment Detail's own risk-message and breakdown-nudge
// derivation (docs/features/assignment-detail-cta-hierarchy.md items 2
// and 3), split out of AssignmentDetailPage.tsx along with the three
// hooks (`useActivities`/`useAllWorkSessions`/`usePreferences`) that only
// ever fed this one computation there.
export function useAssignmentRisk(
  userId: string,
  assignment: Assignment | null,
  workItems: WorkItem[],
): { attentionItem: AttentionItem | undefined; suggestBreakdown: boolean } {
  const {
    activities,
    loading: activitiesLoading,
    loadError: activitiesLoadError,
  } = useActivities(userId);
  const { sessions: allSessions, loading: allSessionsLoading } = useAllWorkSessions(userId);
  const {
    preferences,
    loading: preferencesLoading,
    loadError: preferencesLoadError,
  } = usePreferences(userId);
  const today = useMemo(() => todayISODate(), []);

  // Fail closed, not open, on a load error — usePreferences keeps
  // DEFAULT_PREFERENCES even after a failed fetch, so computing anyway
  // would silently use placeholder capacity assumptions and could show a
  // confidently wrong message instead of an honestly absent one. See
  // docs/features/assignment-detail-cta-hierarchy.md item 2.
  const readyForRisk =
    !activitiesLoading &&
    !allSessionsLoading &&
    !preferencesLoading &&
    !activitiesLoadError &&
    !preferencesLoadError;
  const attentionItem =
    assignment && readyForRisk
      ? assignmentsNeedingAttention([assignment], workItems, allSessions, activities, today, preferences)[0]
      : undefined;
  const suggestBreakdown = !!assignment && workItems.length === 0 && assignment.effortMinutes > 45;

  return { attentionItem, suggestBreakdown };
}
