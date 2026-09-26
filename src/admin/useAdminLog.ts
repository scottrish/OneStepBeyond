import { useCallback } from "react";
import { dateRangeBounds } from "../domain/adminAccounts";
import { useAsyncData } from "../hooks/useAsyncData";
import * as adminService from "../services/adminService";
import type { AdminLogEntry, AdminLogQuery } from "../services/adminService";

// One page of the admin log for the current filters
// (admin-action-log-v0.1.md). Days become time bounds here (G2).
export function useAdminLog(query: AdminLogQuery) {
  const { action, adminId, accountSearch, fromDay, toDay, page } = query;
  const fetchLog = useCallback(
    () =>
      adminService.listActions(
        { action, adminId, accountSearch, fromDay, toDay, page },
        dateRangeBounds(fromDay, toDay),
      ),
    [action, adminId, accountSearch, fromDay, toDay, page],
  );
  return useAsyncData<{ entries: AdminLogEntry[]; total: number }>(fetchLog, { entries: [], total: 0 });
}

// The admins who appear in the log, for the Admin filter.
export function useLogAdmins() {
  const fetchAdmins = useCallback(() => adminService.listLogAdmins(), []);
  return useAsyncData<{ id: string; email: string | null }[]>(fetchAdmins, []);
}
