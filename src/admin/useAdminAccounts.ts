import { useCallback } from "react";
import { useAsyncData } from "../hooks/useAsyncData";
import * as adminService from "../services/adminService";
import type { AccountQuery, AdminAccount } from "../services/adminService";

// One page of the account list for the current search, filters and sort.
export function useAdminAccounts(query: AccountQuery) {
  const { search, status, role, sort, page } = query;
  const fetchAccounts = useCallback(
    () => adminService.listAccounts({ search, status, role, sort, page }),
    [search, status, role, sort, page],
  );
  return useAsyncData<{ accounts: AdminAccount[]; total: number }>(fetchAccounts, { accounts: [], total: 0 });
}
