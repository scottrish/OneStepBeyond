import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "../hooks/useAsyncData";
import * as adminService from "../services/adminService";
import type { AccountDetail } from "../services/adminService";
import type { ClearCategory } from "../domain/adminClearing";

// One account's page, and the two things an admin can do to it: turn it
// off or on (A3), and clear its data — optionally turning it off in the
// same step (A5). Both reload the page afterwards, so the record shows
// what was just done.
export function useAdminAccount(userId: string) {
  const [actionError, setActionError] = useState<string | null>(null);
  const fetchDetail = useCallback(() => adminService.getAccount(userId), [userId]);
  const { data: detail, loading, loadError, retry, refetch } = useAsyncData<AccountDetail | null>(fetchDetail, null);

  async function setDisabled(disabled: boolean): Promise<boolean> {
    setActionError(null);
    try {
      await adminService.setAccountDisabled(userId, disabled);
      await refetch();
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function clear(
    categories: ClearCategory[],
    alsoDisable: boolean,
  ): Promise<{ removed: Record<string, number>; disabled: boolean } | null> {
    setActionError(null);
    try {
      const result = await adminService.clearAccount(userId, categories, alsoDisable);
      await refetch();
      return result;
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    }
  }

  return { detail, loading, loadError, retry, actionError, setDisabled, clear };
}
