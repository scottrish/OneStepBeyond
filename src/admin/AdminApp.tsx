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
import type { AccountQuery } from "../services/adminService";

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

function AdminScreens({ me, signOut }: { me: User; signOut: () => Promise<void> }) {
  // Kept here, so returning from an account keeps the list's search,
  // filters and page.
  const [query, setQuery] = useState<AccountQuery>(FIRST_PAGE);
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-display text-base font-semibold text-foreground">One Step Beyond</span>
            <span className="truncate text-xs text-muted-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden truncate text-sm text-muted-foreground sm:block">{me.email}</p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {openAccountId ? (
          <AccountPage userId={openAccountId} meId={me.id} onBack={() => setOpenAccountId(null)} />
        ) : (
          <AccountList query={query} onQueryChange={setQuery} onOpen={setOpenAccountId} />
        )}
      </main>
    </div>
  );
}
