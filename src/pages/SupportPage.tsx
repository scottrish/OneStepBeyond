import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "../lib/errorMessage";
import * as supportRelationshipService from "../services/supportRelationshipService";
import type {
  StudentRelationship,
  SupporterRole,
} from "../services/supportRelationshipService";

type SupportPageProps = {
  user: User;
  onBack: () => void;
};

// docs/features/supporter-invitation-feature-spec-v0.1.md §6/§7 — the
// invite wizard's own steps, plus "list" (§11, this screen's landing
// state). A separate, smaller step machine from Plan's or Work
// Breakdown's own, matching how every other multi-step flow in this app
// owns its steps locally rather than sharing one enum.
type Step = "list" | "choose-role" | "enter-email" | "explain" | "link";

// §3's 2026-08-19 update — Coach and Teacher are the exact same stored
// role; this only exists so the screen can offer a second button for a
// Student who wouldn't otherwise think to tap "Coach."
const ROLE_CHOICES: { label: string; role: SupporterRole }[] = [
  { label: "Parent / Guardian", role: "parent_guardian" },
  { label: "Coach", role: "coach" },
  { label: "Teacher", role: "coach" },
];

const ROLE_LABEL: Record<SupporterRole, string> = {
  parent_guardian: "Parent / Guardian",
  coach: "Coach",
};

const STATUS_LABEL: Record<StudentRelationship["status"], string> = {
  pending: "Invite pending",
  active: "Active",
  declined: "Declined",
  expired: "Expired",
  ended: "Ended",
};

export default function SupportPage({ user, onBack }: SupportPageProps) {
  const [step, setStep] = useState<Step>("list");
  const [relationships, setRelationships] = useState<StudentRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const [chosenRole, setChosenRole] = useState<SupporterRole | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // No synchronous setState here — react-hooks/set-state-in-effect flags
  // calling setLoading/setLoadError directly from the body of an effect.
  // The effect below only ever calls this fetch itself; retry() is the
  // one that resets loading/error state, and it's only ever invoked from
  // a user action (button click), never from an effect.
  const fetchRelationships = useCallback(() => {
    return supportRelationshipService
      .listRelationshipsForStudent(user.id)
      .then((data) => {
        setRelationships(data);
        setLoadError(null);
      })
      .catch((error: unknown) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchRelationships();
  }

  function startInvite() {
    setChosenLabel(null);
    setChosenRole(null);
    setEmail("");
    setSendError(null);
    setInviteLink(null);
    setStep("choose-role");
  }

  function chooseRole(label: string, role: SupporterRole) {
    setChosenLabel(label);
    setChosenRole(role);
    setStep("enter-email");
  }

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (email.trim() === "") return;
    setStep("explain");
  }

  async function handleSend() {
    if (!chosenRole) return;
    setSending(true);
    setSendError(null);
    try {
      const { rawToken } = await supportRelationshipService.createInvitation({
        studentId: user.id,
        invitedEmail: email.trim(),
        role: chosenRole,
      });
      setInviteLink(`${window.location.origin}/invite?token=${rawToken}`);
      setStep("link");
      fetchRelationships();
    } catch (error) {
      setSendError(errorMessage(error));
    } finally {
      setSending(false);
    }
  }

  if (step === "choose-role") {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <Button variant="ghost" onClick={() => setStep("list")} className="mb-3 -ml-3 px-3">
          ← Cancel
        </Button>
        <h1 className="mb-6 text-2xl">Who would you like to add?</h1>
        <div className="flex flex-col gap-2">
          {ROLE_CHOICES.map((choice) => (
            <Button
              key={choice.label}
              variant="outline"
              className="h-14 w-full justify-start px-4 text-base"
              onClick={() => chooseRole(choice.label, choice.role)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      </main>
    );
  }

  if (step === "enter-email") {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <Button variant="ghost" onClick={() => setStep("choose-role")} className="mb-3 -ml-3 px-3">
          ← Back
        </Button>
        <h1 className="mb-6 text-2xl">What&rsquo;s their email?</h1>
        <form onSubmit={handleEmailSubmit}>
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="invite-email" className="sr-only">
              Email
            </Label>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={email.trim() === ""}>
            Continue
          </Button>
        </form>
      </main>
    );
  }

  if (step === "explain" && chosenRole) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <Button variant="ghost" onClick={() => setStep("enter-email")} className="mb-3 -ml-3 px-3">
          ← Back
        </Button>
        <h1 className="mb-4 text-2xl">Before you send this</h1>
        <p className="mb-2 text-muted-foreground">
          They&rsquo;ll be able to see the {ROLE_LABEL[chosenRole]} dashboard for your account.
        </p>
        <p className="mb-6 text-muted-foreground">You can remove them later.</p>

        {sendError && (
          <p role="alert" className="mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground">
            {sendError}
          </p>
        )}

        <Button onClick={handleSend} disabled={sending}>
          Send invite
        </Button>
      </main>
    );
  }

  if (step === "link" && inviteLink && chosenLabel) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-4 text-2xl">Invite ready</h1>
        <p className="mb-4 text-muted-foreground">
          Send this link to {email} yourself — text, email, however works. It&rsquo;s just for{" "}
          {chosenLabel.toLowerCase()}, expires in two weeks, and only works once.
        </p>
        <div className="mb-6 rounded-lg border border-border bg-card p-3">
          <Label htmlFor="invite-link" className="sr-only">
            Invitation link
          </Label>
          <Input id="invite-link" readOnly value={inviteLink} onFocus={(event) => event.target.select()} />
        </div>
        <Button
          onClick={() => {
            setStep("list");
            setInviteLink(null);
          }}
        >
          Done
        </Button>
      </main>
    );
  }

  const pending = relationships.filter((r) => r.status === "pending");
  const active = relationships.filter((r) => r.status === "active");

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>
      <h1 className="mb-4 text-3xl">Support</h1>

      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive bg-card p-3 text-card-foreground">
          <p className="mb-2 text-sm">Couldn&rsquo;t load your supporters.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {active.length > 0 && (
            <>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Active</h2>
              <ul className="mb-4 flex flex-col gap-1">
                {active.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{r.invitedEmail}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_LABEL[r.role]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {pending.length > 0 && (
            <>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Pending</h2>
              <ul className="mb-4 flex flex-col gap-1">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{r.invitedEmail}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABEL[r.role]} · {STATUS_LABEL[r.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {active.length === 0 && pending.length === 0 && (
            <p className="mb-4 text-muted-foreground">
              No one supporting you yet.
              <br />
              Add a parent, guardian, coach, or teacher so they can see how things are going.
            </p>
          )}

          <Button onClick={startInvite}>Add someone who supports you</Button>
        </>
      )}
    </main>
  );
}
