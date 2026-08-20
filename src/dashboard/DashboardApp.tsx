import { useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../pages/LoginPage";
import { PageHeader, Panel } from "./components/shell";
import DashboardShell from "./DashboardShell";
import { useDashboardData } from "./hooks/useDashboardData";
import { useSupporterAccess } from "./hooks/useSupporterAccess";
import type { ActiveSupportRelationship, SupporterRole } from "../services/supportRelationshipService";
import AssignmentsScreen from "./screens/AssignmentsScreen";
import DiagnosticsScreen from "./screens/DiagnosticsScreen";
import OverviewScreen from "./screens/OverviewScreen";
import ReflectionsScreen from "./screens/ReflectionsScreen";
import TimelineScreen from "./screens/TimelineScreen";
import type { DashboardMode, DashboardScreen } from "./types";

function roleToMode(role: SupporterRole): DashboardMode {
  return role === "coach" ? "coach" : "parent";
}

// Short, stable label for a Student this session has no display name
// for — no separate Student/profile table exists in this codebase (every
// table denormalizes its own student_id directly, see
// 20260815003757_create_courses_table.sql's own comment), and adding one
// purely for a friendlier label here would be new structure this spec's
// own scope review deliberately left out (docs/features/
// supporter-role-based-access-feature-spec-v0.1.md's Requirements
// Review). A short id is honest about what's actually known.
function studentLabel(studentId: string): string {
  return `Student ${studentId.slice(0, 8)}`;
}

// docs/features/supporter-role-based-access-feature-spec-v0.1.md —
// reached at its own URL (see main.tsx). Which Student's data a session
// can see is now resolved from that session's own Active Support
// Relationships (§7.2) or superuser status (§7.3, Diagnostic Mode only)
// — never a free client-side mode choice. Supersedes the mode-toggle/
// localStorage approach docs/decisions/20260816-dashboard-reuses-student-auth.md
// described as a temporary stand-in — see docs/decisions/
// 20260819-dashboard-mode-toggle-replaced-by-real-access.md.
export default function DashboardApp() {
  const { user, signUp, signIn, signOut } = useAuth();

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  return <DashboardAccessGate user={user} signOut={signOut} />;
}

function CenteredScreen({ signOut, children }: { signOut: () => Promise<void>; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

function DashboardAccessGate({ user, signOut }: { user: User; signOut: () => Promise<void> }) {
  const { superuser, relationships, knownStudentIds, loading, loadError, retry } =
    useSupporterAccess(user.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  if (loading) {
    return <CenteredScreen signOut={signOut}>Loading…</CenteredScreen>;
  }

  if (loadError) {
    return (
      <CenteredScreen signOut={signOut}>
        <p role="alert" className="text-sm text-destructive">
          Couldn&rsquo;t check your access.
        </p>
        <button
          type="button"
          onClick={retry}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
        >
          Try again
        </button>
      </CenteredScreen>
    );
  }

  // Diagnostic Mode is a superuser-only path (§7.3) — deliberately
  // checked and handled first, and not blended with any Active
  // relationships the same account might also happen to have. A
  // superuser is a distinct, higher-privilege path, not one more option
  // alongside ordinary Supporter access.
  if (superuser) {
    if (!selectedStudentId) {
      return (
        <SuperuserStudentPicker
          studentIds={knownStudentIds}
          onSelect={setSelectedStudentId}
          signOut={signOut}
        />
      );
    }
    return (
      <DashboardContent
        signOut={signOut}
        mode="diagnostic"
        studentId={selectedStudentId}
        onSwitchStudent={knownStudentIds.length > 1 ? () => setSelectedStudentId(null) : undefined}
      />
    );
  }

  if (relationships.length === 0) {
    return (
      <CenteredScreen signOut={signOut}>
        <p className="text-sm text-muted-foreground">
          You don&rsquo;t currently support any students.
        </p>
      </CenteredScreen>
    );
  }

  const activeRelationship: ActiveSupportRelationship | undefined =
    relationships.length === 1
      ? relationships[0]
      : relationships.find((r) => r.id === selectedRelationshipId);

  if (!activeRelationship) {
    return (
      <RelationshipPicker
        relationships={relationships}
        onSelect={setSelectedRelationshipId}
        signOut={signOut}
      />
    );
  }

  return (
    <DashboardContent
      signOut={signOut}
      mode={roleToMode(activeRelationship.role)}
      studentId={activeRelationship.studentId}
      onSwitchStudent={relationships.length > 1 ? () => setSelectedRelationshipId(null) : undefined}
    />
  );
}

function RelationshipPicker({
  relationships,
  onSelect,
  signOut,
}: {
  relationships: ActiveSupportRelationship[];
  onSelect: (relationshipId: string) => void;
  signOut: () => Promise<void>;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <PageHeader title="Who do you want to support?" description="You support more than one student." />
      <Panel>
        <ul className="flex flex-col gap-2">
          {relationships.map((relationship) => (
            <li key={relationship.id}>
              <button
                type="button"
                onClick={() => onSelect(relationship.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/60"
              >
                <span className="text-foreground">{studentLabel(relationship.studentId)}</span>
                <span className="text-xs text-muted-foreground">
                  {relationship.role === "coach" ? "Coach" : "Parent / Guardian"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function SuperuserStudentPicker({
  studentIds,
  onSelect,
  signOut,
}: {
  studentIds: string[];
  onSelect: (studentId: string) => void;
  signOut: () => Promise<void>;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <PageHeader title="Diagnostic Mode" description="Superuser access — choose a student to inspect." />
      <Panel>
        {studentIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students with any data exist yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {studentIds.map((studentId) => (
              <li key={studentId}>
                <button
                  type="button"
                  onClick={() => onSelect(studentId)}
                  className="w-full rounded-lg border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
                >
                  {studentLabel(studentId)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function DashboardContent({
  signOut,
  mode,
  studentId,
  onSwitchStudent,
}: {
  signOut: () => Promise<void>;
  mode: DashboardMode;
  studentId: string;
  onSwitchStudent?: () => void;
}) {
  const [screen, setScreen] = useState<DashboardScreen>("overview");
  const { loading, loadError, ...data } = useDashboardData(studentId);

  return (
    <DashboardShell
      studentLabel={studentLabel(studentId)}
      signOut={signOut}
      mode={mode}
      onSwitchStudent={onSwitchStudent}
      screen={screen}
      onScreenChange={setScreen}
    >
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {loadError && (
        <p role="alert" className="rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground">
          Couldn&rsquo;t load dashboard data.
        </p>
      )}

      {!loading && !loadError && (
        <>
          {screen === "overview" && <OverviewScreen mode={mode} data={data} onNavigate={setScreen} />}
          {screen === "assignments" && <AssignmentsScreen mode={mode} data={data} />}
          {screen === "reflections" && <ReflectionsScreen mode={mode} data={data} />}
          {screen === "timeline" && <TimelineScreen mode={mode} data={data} />}
          {screen === "diagnostics" && mode === "diagnostic" && <DiagnosticsScreen data={data} />}
        </>
      )}
    </DashboardShell>
  );
}
