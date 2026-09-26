import { useCallback } from "react";
import { useAsyncData } from "../hooks/useAsyncData";
import * as adminService from "../services/adminService";
import type { ClearCategory } from "../domain/adminClearing";

// What clearing would remove, per table — for the confirmation (A7). The
// database works it out by clearing inside a transaction it then undoes,
// so the preview always matches what Clear will do.
export function useClearPreview(userId: string, categories: ClearCategory[]) {
  const key = categories.join(",");
  const fetchPreview = useCallback(
    () => adminService.previewClear(userId, key.split(",") as ClearCategory[]),
    [userId, key],
  );
  return useAsyncData<Record<string, number>>(fetchPreview, {});
}
