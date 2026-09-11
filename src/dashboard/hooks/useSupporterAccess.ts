import { useCallback } from "react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { isSuperuser, listKnownStudentIds } from "../../services/superuserService";
import { listActiveRelationshipsForSupporter } from "../../services/supportRelationshipService";
import type { ActiveSupportRelationship } from "../../services/supportRelationshipService";

type AccessData = {
  superuser: boolean;
  relationships: ActiveSupportRelationship[];
  knownStudentIds: string[];
};

const EMPTY_ACCESS: AccessData = { superuser: false, relationships: [], knownStudentIds: [] };

// docs/features/supporter-role-based-access-feature-spec-v0.1.md §7.2/§7.3
// — pure data for the two independent facts DashboardApp's own routing
// (§7.2's 0/1/2+ relationship cases, §7.3's superuser gate) branches on.
// A superuser is deliberately not blended with their own Support
// Relationships, if any happen to also exist — Diagnostic access is a
// distinct, higher-privilege path (§7.3: "not intended to be used by a
// Supporter"), not one more option alongside ordinary relationships.
export function useSupporterAccess(userId: string) {
  const fetchAccess = useCallback(async (): Promise<AccessData> => {
    const superuser = await isSuperuser(userId);
    // Only a superuser can ever discover other Students' ids at all
    // (listKnownStudentIds relies entirely on the superuser RLS policy
    // already granting that read) — skip it otherwise, since an ordinary
    // Supporter would just get an empty result back and there's no reason
    // to make the request.
    const [knownStudentIds, relationships] = await Promise.all([
      superuser ? listKnownStudentIds() : Promise.resolve<string[]>([]),
      listActiveRelationshipsForSupporter(userId),
    ]);
    return { superuser, knownStudentIds, relationships };
  }, [userId]);

  const { data, loading, loadError, retry } = useAsyncData<AccessData>(fetchAccess, EMPTY_ACCESS);

  return { ...data, loading, loadError, retry };
}
