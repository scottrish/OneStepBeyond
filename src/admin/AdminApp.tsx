import { useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import ErrorBanner from "../components/ErrorBanner";
import { useAuth } from "../hooks/useAuth";
import { useAsyncData } from "../hooks/useAsyncData";
import LoginPage from "../pages/LoginPage";
import { isSuperuser } from "../services/superuserService";
import AccountList from "./AccountList";
import AccountPage from "./AccountPage";
import AdminLog from "./AdminLog";
import type { AccountQuery, AdminLogQuery } from "../services/adminService";

// The admin page, at its own address — /admin (docs/features/admin-account-
// management-v0.1.md, A2) — beside /dashboard and /invite, outside the
// student app's shell. For superusers only: everyone else sees one line
// and nothing else, and the database refuses them regardless (A1).
export default function AdminApp() {
  const { user, signUp, signIn, signOut } = useAuth();

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  return <AdminGate user={user} signOut={signOut} />;
}

function AdminGate({ user, signOut }: { user: User; signOut: () => Promise<void> }) {
  const checkAdmin = useCallback(() => isSuperuser(user.id), [user.id]);
  const { data: admin, loading, loadError, retry } = useAsyncData<boolean>(checkAdmin, false);

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading…</p>;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorBanner message="Couldn’t check your access." onRetry={retry} />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl">This page is for administrators</h1>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <AdminScreens me={user} signOut={signOut} />;
}

const FIRST_PAGE: AccountQuery = { search: "", status: null, role: null, sort: "created_desc", page: 0 };
const FIRST_LOG_PAGE: AdminLogQuery = { action: null, adminId: null, accountSearch: "", fromDay: "", toDay: "", page: 0 };

type View = "accounts" | "log";
const VIEWS: { view: View; label: string }[] = [
  { view: "accounts", label: "Accounts" },
  { view: "log", label: "Admin log" },
];

function AdminScreens({ me, signOut }: { me: User; signOut: () => Promise<void> }) {
  // Each view's filters and page are kept here, so switching views or
  // returning from an account keeps them (admin-action-log-v0.1.md, G3).
  const [view, setView] = useState<View>("accounts");
  const [query, setQuery] = useState<AccountQuery>(FIRST_PAGE);
  const [logQuery, setLogQuery] = useState<AdminLogQuery>(FIRST_LOG_PAGE);
  // An account opened from either view; Back returns to that view.
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);

  function showView(next: View) {
    setView(next);
    setOpenAccountId(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:flex-nowrap sm:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-display text-base font-semibold text-foreground">One Step Beyond</span>
            <span className="truncate text-xs text-muted-foreground">Admin</span>
          </div>
          <nav aria-label="Admin" className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
            {VIEWS.map((item) => (
              <Button
                key={item.view}
                variant={view === item.view ? "secondary" : "ghost"}
                size="sm"
                aria-current={view === item.view ? "page" : undefined}
                onClick={() => showView(item.view)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <p className="hidden truncate text-sm text-muted-foreground lg:block">{me.email}</p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {openAccountId ? (
          <AccountPage
            userId={openAccountId}
            meId={me.id}
            onBack={() => setOpenAccountId(null)}
            backLabel={view === "log" ? "← Admin log" : "← All accounts"}
          />
        ) : view === "log" ? (
          <AdminLog query={logQuery} onQueryChange={setLogQuery} onOpenAccount={setOpenAccountId} />
        ) : (
          <AccountList query={query} onQueryChange={setQuery} onOpen={setOpenAccountId} />
        )}
      </main>
    </div>
  );
}
