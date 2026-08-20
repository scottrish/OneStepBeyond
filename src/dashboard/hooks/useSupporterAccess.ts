import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../../lib/errorMessage";
import { isSuperuser, listKnownStudentIds } from "../../services/superuserService";
import { listActiveRelationshipsForSupporter } from "../../services/supportRelationshipService";
import type { ActiveSupportRelationship } from "../../services/supportRelationshipService";

// docs/features/supporter-role-based-access-feature-spec-v0.1.md §7.2/§7.3
// — pure data for the two independent facts DashboardApp's own routing
// (§7.2's 0/1/2+ relationship cases, §7.3's superuser gate) branches on.
// A superuser is deliberately not blended with their own Support
// Relationships, if any happen to also exist — Diagnostic access is a
// distinct, higher-privilege path (§7.3: "not intended to be used by a
// Supporter"), not one more option alongside ordinary relationships.
export function useSupporterAccess(userId: string) {
  const [superuser, setSuperuser] = useState(false);
  const [relationships, setRelationships] = useState<ActiveSupportRelationship[]>([]);
  const [knownStudentIds, setKnownStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAccess = useCallback(() => {
    return isSuperuser(userId)
      .then((su) => {
        setSuperuser(su);
        // Only a superuser can ever discover other Students' ids at all
        // (listKnownStudentIds relies entirely on the superuser RLS
        // policy already granting that read) — skip it otherwise, since
        // an ordinary Supporter would just get an empty result back and
        // there's no reason to make the request.
        return su
          ? Promise.all([listKnownStudentIds(), listActiveRelationshipsForSupporter(userId)])
          : Promise.all([Promise.resolve<string[]>([]), listActiveRelationshipsForSupporter(userId)]);
      })
      .then(([studentIds, activeRelationships]) => {
        setKnownStudentIds(studentIds);
        setRelationships(activeRelationships);
      })
      .catch((error: unknown) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchAccess();
  }

  return { superuser, relationships, knownStudentIds, loading, loadError, retry };
}
