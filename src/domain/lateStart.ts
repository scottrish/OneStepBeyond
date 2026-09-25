import { toMinutes } from "./defaultStartTimes";

// How far past its planned start a not-yet-started session must be before
// Home's Next card says so (daily-planning-and-completion-v2-proposal.md
// item 7: "more than 45 minutes").
export const LATE_START_GRACE_MINUTES = 45;

type StartableSession = {
  status: "planned" | "in_progress" | "done";
  startTime: string | null;
};

/**
 * Whether a planned session's start time passed more than 45 minutes ago
 * (`nowMinutes` = minutes since midnight today). Never true once the
 * session has started, or when it has no start time. The student sees
 * "You had planned to start this earlier." — never the word "late".
 */
export function startTimePassed(session: StartableSession, nowMinutes: number): boolean {
  if (session.status !== "planned" || !session.startTime) return false;
  return nowMinutes - toMinutes(session.startTime) > LATE_START_GRACE_MINUTES;
}
