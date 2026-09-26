import { supabase } from "../lib/supabase";
import type { OfflineAction } from "../domain/offlineActions";

// How each offline-capable action is written (PWA phase 2, increment 2c —
// docs/features/pwa-phase-2-offline-v0.1.md, question 4). Every write is
// safe to send twice: a reply can be lost after the server has saved it,
// and the queue will then send it again.
//
// - Updates are guarded to the state they change from (Start only a
//   "planned" session, Done only one not yet done…). If the guard matches
//   nothing, the row is looked up: still there means it's already how the
//   student wanted it (a repeat, or done on another device) — nothing
//   lost; gone means the plan changed on another device — a conflict.
// - Inserts carry an id made on the device and ignore a duplicate.
// - Times are the device's, sent explicitly — never the server's now().

export type SendResult = "applied" | "conflict";

type Table = "work_sessions" | "work_items" | "assignments";

// The state a row must still be in for the update to apply.
type Guard = ["status", "eq" | "neq", string] | ["completed_at", "is", null];

async function guardedUpdate(
  table: Table,
  id: string,
  patch: Record<string, unknown>,
  [column, op, value]: Guard,
): Promise<SendResult> {
  const query = supabase.from(table).update(patch).eq("id", id);
  const guarded =
    op === "is" ? query.is(column, value) : op === "eq" ? query.eq(column, value) : query.neq(column, value);
  const { data, error } = await guarded.select("id");
  if (error) throw error;
  if ((data ?? []).length > 0) return "applied";

  const { data: row, error: lookupError } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  if (lookupError) throw lookupError;
  return row ? "applied" : "conflict";
}

async function insertOnce(table: "reflections" | "coaching_interactions", row: Record<string, unknown>) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  return "applied" as const;
}

export async function sendAction(action: OfflineAction): Promise<SendResult> {
  switch (action.kind) {
    case "startSession":
      return guardedUpdate(
        "work_sessions",
        action.sessionId,
        { status: "in_progress", started_at: action.at },
        ["status", "eq", "planned"],
      );
    case "completeSession":
      return guardedUpdate(
        "work_sessions",
        action.sessionId,
        { status: "done", completed_at: action.at },
        ["status", "neq", "done"],
      );
    case "reviseEstimate":
      return guardedUpdate(
        "work_sessions",
        action.sessionId,
        { planned_minutes: action.plannedMinutes, original_planned_minutes: action.originalPlannedMinutes },
        ["status", "neq", "done"],
      );
    case "clearSession": {
      // "Yes — clear the other time": only time still set aside.
      const { error } = await supabase
        .from("work_sessions")
        .delete()
        .eq("id", action.sessionId)
        .neq("status", "done");
      if (error) throw error;
      return "applied";
    }
    case "completeStep":
      return guardedUpdate("work_items", action.workItemId, { completed_at: action.at }, ["completed_at", "is", null]);
    case "completeAssignment":
      return guardedUpdate("assignments", action.assignmentId, { completed_at: action.at }, ["completed_at", "is", null]);
    case "recordReflection":
      return insertOnce("reflections", action.row);
    case "recordFriction":
      return insertOnce("coaching_interactions", action.row);
    case "resolveInteraction": {
      const { error } = await supabase
        .from("coaching_interactions")
        .update(action.patch)
        .eq("id", action.interactionId);
      if (error) throw error;
      return "applied";
    }
  }
}
