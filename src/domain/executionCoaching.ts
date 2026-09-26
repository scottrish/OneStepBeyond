import { addDaysISODate } from "./planningDate";
import { defaultStartTimes, type BusyBlock } from "./defaultStartTimes";
import type { StudySlot } from "./studyCapacity";

// Today Execution's coaching (docs/features/execution-coaching-v0.1.md,
// roadmap Phase 7 step 12b): the student says what's getting in the way
// — a Blocker, in Domain-Model.md's terms — and gets one fixed, calm
// Intervention back. Pure rules and fixed copy (the prototype's exact
// wording); nothing adapts, nothing is proactive.

export type ExecutionStage = "before_start" | "in_progress";

export type FrictionKind =
  | "cant_start"
  | "unclear_task"
  | "too_big"
  | "distracted"
  | "dont_know_next"
  | "taking_longer"
  | "other";

export type FrictionOption = { kind: FrictionKind; label: string };

/** "What's getting in the way?" — the options differ before and after starting. */
export function frictionOptions(stage: ExecutionStage): FrictionOption[] {
  if (stage === "before_start") {
    return [
      { kind: "cant_start", label: "I can't get started" },
      { kind: "unclear_task", label: "I don't understand what to do" },
      { kind: "too_big", label: "It feels too big" },
      { kind: "distracted", label: "I'm distracted" },
      { kind: "other", label: "Something else" },
    ];
  }
  return [
    { kind: "dont_know_next", label: "I don't know what to do next" },
    { kind: "unclear_task", label: "I don't understand this" },
    { kind: "too_big", label: "This is bigger than I thought" },
    { kind: "distracted", label: "I'm distracted" },
    { kind: "taking_longer", label: "It's taking longer than I expected" },
    { kind: "other", label: "Something else" },
  ];
}

// What an action does next. The page renders; it doesn't reason.
export type ActionEffect =
  | "return_to_task"
  | "own_first_action"
  | "open_breakdown"
  | "open_repair"
  | "add_ten_minutes";

export type InterventionAction = { id: string; label: string; effect: ActionEffect };

export type Intervention = {
  id: string;
  headline: string;
  body: string;
  actions: InterventionAction[];
  // The prompt for an own_first_action action's text field.
  ownActionPrompt?: string;
};

const REPAIR = (label: string): InterventionAction => ({ id: "repair", label, effect: "open_repair" });

const INTERVENTIONS: Record<FrictionKind, Intervention> = {
  cant_start: {
    id: "small-start",
    headline: "Getting started is the hard part right now.",
    body: "What's the smallest useful action you could do first?",
    actions: [
      { id: "open_materials", label: "Open what I need", effect: "return_to_task" },
      { id: "read_first_instruction", label: "Read the first instruction", effect: "return_to_task" },
      { id: "own_first_action", label: "Pick my own first action", effect: "own_first_action" },
      REPAIR("Stop and change the plan"),
    ],
  },
  // The prototype also offers "Look at the assignment brief" here; this app
  // has no Assignment Brief, so it's omitted (spec, Dependency).
  unclear_task: {
    id: "resolve-uncertainty",
    headline: "Not being sure what's being asked is worth sorting out first.",
    body: "What would help you get clear?",
    actions: [
      { id: "reread_directions", label: "Read the directions again", effect: "return_to_task" },
      { id: "write_the_question", label: "Write down the question I need answered", effect: "own_first_action" },
      { id: "ask_someone", label: "Ask someone", effect: "return_to_task" },
      REPAIR("Stop and repair the plan"),
    ],
  },
  too_big: {
    id: "resize-self",
    headline: "This step may be too large for one sitting.",
    body: "What would help?",
    actions: [
      { id: "smaller_piece", label: "Decide on a smaller piece myself", effect: "own_first_action" },
      { id: "revisit_breakdown", label: "Revisit the breakdown", effect: "open_breakdown" },
      REPAIR("Stop and replan"),
    ],
  },
  distracted: {
    id: "refocus",
    headline: "Attention drifts. That's normal, and you can steer it back.",
    body: "Pick one thing to try.",
    actions: [
      { id: "five_minutes", label: "Try five focused minutes", effect: "return_to_task" },
      { id: "change_place", label: "Change where I'm working", effect: "return_to_task" },
      { id: "put_away", label: "Put one distraction away", effect: "return_to_task" },
      REPAIR("Stop and replan"),
    ],
  },
  taking_longer: {
    id: "revise-estimate",
    headline: "Your first estimate may need updating.",
    body: "Noticing this is a skill, not a slip.",
    actions: [
      { id: "add_ten", label: "Add 10 min to my estimate", effect: "add_ten_minutes" },
      { id: "keep_going", label: "Keep going without changing it", effect: "return_to_task" },
      REPAIR("Stop and replan"),
    ],
  },
  dont_know_next: {
    id: "find-next-step",
    headline: "You've started — the next move is the only thing that matters now.",
    body: "What's the most useful next action?",
    actions: [
      { id: "reread_step", label: "Re-read the step I'm on", effect: "return_to_task" },
      { id: "own_first_action", label: "Name my next action", effect: "own_first_action" },
      { id: "revisit_breakdown", label: "Look at the breakdown", effect: "open_breakdown" },
      REPAIR("Stop and replan"),
    ],
  },
  other: {
    id: "open-choice",
    headline: "Thanks for saying so.",
    body: "You don't have to explain it. What do you want to do?",
    actions: [
      { id: "keep_going", label: "Keep going", effect: "return_to_task" },
      { id: "own_first_action", label: "Note what's in the way", effect: "own_first_action" },
      REPAIR("Change the plan"),
    ],
    ownActionPrompt: "What's getting in the way?",
  },
};

// How many recent dismissals are remembered (the prototype's window).
export const RECENT_DISMISSALS = 8;

/**
 * The one intervention for a friction kind — unless the student has set
 * that same intervention aside at least twice among their recent
 * dismissals, when "Something else"'s open choice is offered instead:
 * never re-offer a strategy already rejected twice.
 */
export function chooseIntervention(kind: FrictionKind, recentDismissals: string[]): Intervention {
  const candidate = INTERVENTIONS[kind];
  const dismissed = recentDismissals.filter((id) => id === candidate.id).length;
  return dismissed >= 2 ? INTERVENTIONS.other : candidate;
}

/** "Worth knowing: this is due today." — due today or already past. */
export function isDueTodayOrEarlier(dueDate: string, today: string): boolean {
  return dueDate <= today;
}

/** "Tomorrow" is still offered, with a hint, when it's due before then. */
export function isDueBeforeTomorrow(dueDate: string, today: string): boolean {
  return dueDate < addDaysISODate(today, 1);
}

/**
 * "Later today": the first free start after now and after today's other
 * sessions, avoiding activities (with travel) — the Schedule step's own
 * scheduler, never a fixed clock time that could double-book
 * (docs/decisions/20260925-execution-timing.md, E2). Null when nothing
 * fits before midnight, so the option isn't offered.
 */
export function laterTodayStart(
  minutes: number,
  otherSessionBlocks: BusyBlock[],
  activityBlocks: BusyBlock[],
  slots: StudySlot[],
  nowMinutes: number,
): string | null {
  const after = Math.max(nowMinutes, ...otherSessionBlocks.map((block) => block.end));
  const times = defaultStartTimes(
    [{ id: "later", minutes }],
    slots,
    [...otherSessionBlocks, ...activityBlocks],
    after,
  );
  return times.later ?? null;
}
