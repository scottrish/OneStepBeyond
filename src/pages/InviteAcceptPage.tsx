import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { errorMessage } from "../lib/errorMessage";
import * as supportRelationshipService from "../services/supportRelationshipService";
import type { InvitationDetails, SupporterRole } from "../services/supportRelationshipService";
import LoginPage from "./LoginPage";
import { Button } from "@/components/ui/button";

const ROLE_LABEL: Record<SupporterRole, string> = {
  parent_guardian: "Parent / Guardian",
  coach: "Coach",
};

type Outcome = "accepted" | "declined" | null;

// docs/features/supporter-invitation-feature-spec-v0.1.md §9/§10 — the
// invited person's own entry point, reached via the link
// SupportPage.tsx displays (Implementation Note: no email is sent this
// increment, but this route and flow are exactly what a real email's
// link would open). Not part of the mobile AppShell or its tab state —
// a standalone route, the same shape as DashboardApp.tsx, reached by
// Root.tsx's own pathname check.
export default function InviteAcceptPage() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [invitation, setInvitation] = useState<InvitationDetails | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!user || !token) return;
    // No synchronous setState here (react-hooks/set-state-in-effect) —
    // invitation/loadError both already start at their correct "nothing
    // resolved yet" defaults, and this effect only ever runs once per
    // token/user pair (there's no retry affordance on this page to
    // re-trigger it), so there's no stale prior state to clear first.
    supportRelationshipService
      .findInvitationByToken(token)
      .then(setInvitation)
      .catch((error: unknown) => setLoadError(errorMessage(error)));
  }, [user, token]);

  if (!token) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-4 text-2xl">This link isn&rsquo;t valid</h1>
        <p className="text-muted-foreground">Check that you copied the whole link.</p>
      </main>
    );
  }

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  async function handleAccept() {
    if (!invitation) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await supportRelationshipService.acceptInvitation(invitation.id, user!.id);
      setOutcome("accepted");
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!invitation) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await supportRelationshipService.declineInvitation(invitation.id);
      setOutcome("declined");
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (outcome === "accepted") {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-4 text-2xl">You&rsquo;re connected</h1>
        <p className="mb-6 text-muted-foreground">
          You can see this student&rsquo;s dashboard whenever you sign in.
        </p>
        <Button onClick={() => (window.location.href = "/dashboard")}>Go to your dashboard</Button>
      </main>
    );
  }

  if (outcome === "declined") {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-4 text-2xl">Invitation declined</h1>
        <p className="text-muted-foreground">You won&rsquo;t be connected to this student.</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <p role="alert" className="text-sm text-destructive">
          Couldn&rsquo;t check this invitation.
        </p>
      </main>
    );
  }

  if (invitation === undefined) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (invitation === null) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-4 text-2xl">This invitation isn&rsquo;t available</h1>
        <p className="mb-4 text-muted-foreground">
          It may have expired, already been used, or been sent to a different email address than
          you&rsquo;re signed in with{user.email ? ` (${user.email})` : ""}.
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign in with a different account
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <h1 className="mb-4 text-2xl">You&rsquo;ve been invited to support a student</h1>
      <p className="mb-6 text-muted-foreground">
        You&rsquo;ll be connected as their {ROLE_LABEL[invitation.role]}. You&rsquo;ll be able to
        see their {ROLE_LABEL[invitation.role]} dashboard — they can remove you at any time.
      </p>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground">
          {actionError}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={handleDecline} disabled={submitting}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={submitting}>
          Accept
        </Button>
      </div>
    </main>
  );
}
