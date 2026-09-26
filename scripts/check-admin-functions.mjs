#!/usr/bin/env node
// Checks the admin database functions (docs/features/admin-account-management-v0.1.md;
// supabase/migrations/20260926120000_admin_account_management.sql) against
// the LOCAL Supabase stack: who may call them, exactly what each clearing
// category removes, turning accounts off and on, the all-or-nothing rule,
// and the admin record. `npm run test:run` mocks Supabase, so it can't
// check these; run this after changing the migration (decision Q5):
//
//   node scripts/check-admin-functions.mjs
//
// Safety rail: like bootstrap-playwright-test-account.sh, it only ever
// talks to the local stack (127.0.0.1) — keys and the database URL come
// from `npx supabase status`, never from arguments or the environment. It
// creates throwaway accounts and deletes them again, even on failure.

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const status = JSON.parse(execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
const URL = status.API_URL;
const DB = status.DB_URL;
if (!URL?.startsWith("http://127.0.0.1") || !DB?.includes("127.0.0.1")) {
  console.error("Refusing to run: this script only talks to the local Supabase stack.");
  process.exit(1);
}
const SERVICE = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
const ANON = status.ANON_KEY ?? status.PUBLISHABLE_KEY;

const service = createClient(URL, SERVICE, { auth: { persistSession: false } });
// SQL goes in on stdin, so newlines and $$-quoting reach psql untouched.
const psql = (sql) =>
  execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -At -q`, { input: sql, stdio: ["pipe", "pipe", "inherit"] })
    .toString()
    .trim();

const results = [];
const check = (name, ok, detail = "") => {
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const stamp = Date.now();
const password = `admin-check-${stamp}`;
const created = [];

async function makeUser(label) {
  const email = `admin-check-${label}-${stamp}@example.com`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  created.push(data.user.id);
  return { id: data.user.id, email };
}

async function signedIn(user) {
  const client = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw error;
  return client;
}

// One of every kind of per-account row, written as the student.
async function seed(client, id) {
  const one = async (query) => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  const course = await one(client.from("courses").insert({ student_id: id, name: "Biology", color_index: 0 }).select().single());
  const assignment = await one(
    client
      .from("assignments")
      .insert({ student_id: id, course_id: course.id, title: "Lab report", due_date: "2026-12-01", effort_minutes: 60 })
      .select()
      .single(),
  );
  const item = await one(
    client
      .from("work_items")
      .insert({ student_id: id, assignment_id: assignment.id, title: "Method", effort_minutes: 30, position: 0 })
      .select()
      .single(),
  );
  const session = await one(
    client
      .from("work_sessions")
      .insert({ student_id: id, work_item_id: item.id, date: "2026-11-01", planned_minutes: 30, start_time: "16:00" })
      .select()
      .single(),
  );
  await one(client.from("activities").insert({ student_id: id, name: "Soccer", days: [1], start_time: "17:00", finish_time: "18:00" }));
  await one(client.from("student_preferences").upsert({ student_id: id }));
  await one(client.from("reflections").insert({ student_id: id, assignment_id: assignment.id, trigger: "assignment_completed", structured_response: "Not sure" }));
  await one(
    client.from("coaching_interactions").insert({
      student_id: id,
      assignment_id: assignment.id,
      work_item_id: item.id,
      work_session_id: session.id,
      stage: "in_progress",
      friction_kind: "too_big",
      intervention_id: "smallest-step",
    }),
  );
  // Rows the app writes through flows too long to drive here.
  psql(
    `insert into public.planning_sessions (student_id, date, items_planned, minutes_planned) values ('${id}', '2026-11-01', 1, 30)`,
  );
  psql(
    `insert into public.decomposition_attempts (student_id, assignment_id, outcome)
     values ('${id}', '${assignment.id}', 'confirmed')`,
  );
}

const countsOf = (id) => JSON.parse(psql(`select admin_private.counts('${id}')::text`));

try {
  const admin = await makeUser("admin");
  const otherAdmin = await makeUser("other-admin");
  const student = await makeUser("student");
  const student2 = await makeUser("student2");
  const supporter = await makeUser("supporter");
  const plain = await makeUser("plain");
  psql(`insert into public.superusers (user_id) values ('${admin.id}'), ('${otherAdmin.id}')`);

  const adminDb = await signedIn(admin);
  const studentDb = await signedIn(student);
  const student2Db = await signedIn(student2);
  const plainDb = await signedIn(plain);
  const anonDb = createClient(URL, ANON, { auth: { persistSession: false } });

  await seed(studentDb, student.id);
  await seed(student2Db, student2.id);
  psql(
    `insert into public.support_relationships (student_id, supporter_id, role, status, invited_by, invited_email, token_hash, expires_at)
     values ('${student.id}', '${supporter.id}', 'coach', 'active', 'student', '${supporter.email}', 'hash-${stamp}', now() + interval '7 days')`,
  );
  // plain has signed in; this one never has.
  const never = await makeUser("never");

  // ——— Who may call them ———
  const nonAdmin = await plainDb.rpc("admin_list_accounts", {});
  check("a non-admin can't list accounts", nonAdmin.error?.code === "42501", nonAdmin.error?.message);
  const anon = await anonDb.rpc("admin_list_accounts", {});
  check("a signed-out caller can't list accounts", !!anon.error, anon.error?.message);
  const nonAdminClear = await plainDb.rpc("admin_clear_account", { p_user: student.id, p_categories: ["plans"] });
  check("a non-admin can't clear data", nonAdminClear.error?.code === "42501");
  const nonAdminDisable = await plainDb.rpc("admin_set_disabled", { p_user: student.id, p_disabled: true });
  check("a non-admin can't turn an account off", nonAdminDisable.error?.code === "42501");
  const internal = await adminDb.schema("admin_private").rpc("counts", { p_user: student.id });
  check("internal helpers aren't reachable through the API, even by an admin", !!internal.error, internal.error?.message);
  const plainLog = await plainDb.from("admin_actions").select("id");
  const adminLog = await adminDb.from("admin_actions").select("id");
  check(
    "nobody reads the admin record as a table — only through admin_get_account",
    (!!plainLog.error || plainLog.data.length === 0) && (!!adminLog.error || adminLog.data.length === 0),
  );

  // An account whose only data is plan history (courses deleted after
  // planning) still counts as a student.
  const planOnly = await makeUser("plan-only");
  psql(
    `insert into public.planning_sessions (student_id, date, items_planned, minutes_planned) values ('${planOnly.id}', '2026-11-01', 1, 30)`,
  );

  // ——— The list ———
  const list = await adminDb.rpc("admin_list_accounts", { p_search: `-${stamp}@`, p_limit: 50 });
  const byId = new Map((list.data ?? []).map((row) => [row.id, row]));
  check("the list includes every account, with a total", !list.error && byId.size === 8 && list.data[0].total_count === 8, list.error?.message);
  check("plan history alone makes an account a student", byId.get(planOnly.id)?.is_student === true);
  check(
    "roles are worked out from the data",
    byId.get(student.id)?.is_student &&
      !byId.get(student.id)?.is_supporter &&
      byId.get(supporter.id)?.is_supporter &&
      !byId.get(supporter.id)?.is_student &&
      byId.get(admin.id)?.is_admin &&
      !byId.get(plain.id)?.is_student,
  );
  check(
    "status: active, never signed in",
    byId.get(plain.id)?.status === "active" && byId.get(never.id)?.status === "never_signed_in",
  );
  check("counts", byId.get(student.id)?.course_count === 1 && byId.get(student.id)?.planned_session_count === 1);
  const filtered = await adminDb.rpc("admin_list_accounts", { p_search: `-${stamp}@`, p_role: "supporter" });
  check("filter by role", filtered.data?.length === 1 && filtered.data[0].id === supporter.id);
  const paged = await adminDb.rpc("admin_list_accounts", { p_search: `-${stamp}@`, p_sort: "email_asc", p_limit: 2, p_offset: 2 });
  check("sort and page", paged.data?.length === 2 && paged.data[0].total_count === 8 && paged.data[0].email < paged.data[1].email);

  const detail = await adminDb.rpc("admin_get_account", { p_user: student.id });
  check(
    "an account's page shows its supporters",
    detail.data?.as_student?.[0]?.other_email === supporter.email && detail.data?.account?.id === student.id,
  );
  const supporterDetail = await adminDb.rpc("admin_get_account", { p_user: supporter.id });
  check("…and a supporter's students", supporterDetail.data?.as_supporter?.[0]?.other_email === student.email);

  // ——— Each category removes exactly its rows ———
  const clearOne = async (category, expectRemoved, expectKept) => {
    const before = countsOf(student.id);
    const preview = await adminDb.rpc("admin_clear_preview", { p_user: student.id, p_categories: [category] });
    const unchanged = JSON.stringify(countsOf(student.id)) === JSON.stringify(before);
    const res = await adminDb.rpc("admin_clear_account", { p_user: student.id, p_categories: [category] });
    const after = countsOf(student.id);
    const removedOk = expectRemoved.every((t) => before[t] > 0 && after[t] === 0);
    const keptOk = expectKept.every((t) => after[t] === before[t]);
    const matches = JSON.stringify(preview.data) === JSON.stringify(res.data?.removed);
    check(
      `clear "${category}": removes ${expectRemoved.join(", ")}; keeps ${expectKept.join(", ") || "—"}; the preview matched and changed nothing`,
      !res.error && removedOk && keptOk && matches && unchanged,
      res.error?.message ?? JSON.stringify(res.data?.removed),
    );
  };
  await clearOne("plans", ["work_sessions", "planning_sessions"], ["work_items", "assignments", "courses", "coaching_interactions"]);
  await clearOne("history", ["reflections", "decomposition_attempts", "coaching_interactions"], ["assignments", "work_items"]);
  await clearOne("activities", ["activities"], ["courses"]);
  await clearOne("study_hours", ["student_preferences"], ["courses"]);
  await clearOne("support", ["support_relationships"], ["courses"]);
  await clearOne("assignments", ["assignments", "work_items"], ["courses"]);
  await clearOne("courses", ["courses"], []);
  const empty = Object.values(countsOf(student.id)).every((n) => n === 0);
  check("after every category, nothing is left", empty);
  const stillSignsIn = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.signInWithPassword({
    email: student.email,
    password,
  });
  check("clearing leaves the account able to sign in", !stillSignsIn.error);

  // ——— All or nothing ———
  psql(
    `create function public.admin_check_fail() returns trigger language plpgsql as $$ begin raise exception 'forced failure'; end $$;
     create trigger admin_check_fail before insert on public.admin_actions for each row execute function public.admin_check_fail();`,
  );
  const allCategories = ["courses", "assignments", "plans", "history", "activities", "study_hours", "support"];
  const beforeFail = countsOf(student2.id);
  const failed = await adminDb.rpc("admin_clear_account", { p_user: student2.id, p_categories: allCategories, p_also_disable: true });
  psql(`drop trigger admin_check_fail on public.admin_actions; drop function public.admin_check_fail();`);
  const bannedAfterFail = psql(`select banned_until is not null from auth.users where id = '${student2.id}'`);
  check(
    "a failure partway leaves every row, and the account on",
    !!failed.error && JSON.stringify(countsOf(student2.id)) === JSON.stringify(beforeFail) && bannedAfterFail === "f",
    failed.error?.message,
  );

  // ——— All data, and turn it off, in one step ———
  const all = await adminDb.rpc("admin_clear_account", { p_user: student2.id, p_categories: allCategories, p_also_disable: true });
  const banned = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.signInWithPassword({
    email: student2.email,
    password,
  });
  check(
    "all data + turn off: everything removed, and sign-in refused with user_banned",
    !all.error && all.data?.disabled === true && Object.values(countsOf(student2.id)).every((n) => n === 0) && banned.error?.code === "user_banned",
    all.error?.message ?? banned.error?.code,
  );
  const refresh = await student2Db.auth.refreshSession();
  check("…and its session can't be refreshed", !!refresh.error, refresh.error?.code);
  const listed = await adminDb.rpc("admin_list_accounts", { p_search: student2.email });
  check("…and it's listed as disabled", listed.data?.[0]?.status === "disabled");

  // ——— Turning off and on ———
  const off = await adminDb.rpc("admin_set_disabled", { p_user: plain.id, p_disabled: true });
  const plainBanned = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.signInWithPassword({
    email: plain.email,
    password,
  });
  const on = await adminDb.rpc("admin_set_disabled", { p_user: plain.id, p_disabled: false });
  const plainBack = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.signInWithPassword({
    email: plain.email,
    password,
  });
  check(
    "turn off → sign-in refused; turn on → signs in again",
    !off.error && plainBanned.error?.code === "user_banned" && !on.error && !plainBack.error,
  );

  // ——— Protected accounts (A6, Q2) ———
  const selfOff = await adminDb.rpc("admin_set_disabled", { p_user: admin.id, p_disabled: true });
  check("you can't turn yourself off", !!selfOff.error, selfOff.error?.message);
  const selfClearOff = await adminDb.rpc("admin_clear_account", { p_user: admin.id, p_categories: ["plans"], p_also_disable: true });
  check("…not even while clearing", !!selfClearOff.error);
  const selfClear = await adminDb.rpc("admin_clear_account", { p_user: admin.id, p_categories: ["plans"] });
  check("you can clear your own data (Q2)", !selfClear.error, selfClear.error?.message);
  const otherOff = await adminDb.rpc("admin_set_disabled", { p_user: otherAdmin.id, p_disabled: true });
  const otherClear = await adminDb.rpc("admin_clear_account", { p_user: otherAdmin.id, p_categories: ["plans"] });
  check("another admin can't be turned off or cleared", !!otherOff.error && !!otherClear.error);
  const bogus = await adminDb.rpc("admin_clear_account", { p_user: student.id, p_categories: ["plans", "everything"] });
  check("an unknown category is refused", !!bogus.error);

  // ——— The record (A4) ———
  const records = await Promise.all(
    [student.id, student2.id, plain.id].map((id) => adminDb.rpc("admin_get_account", { p_user: id })),
  );
  const actions = records
    .flatMap((record) => record.data?.actions ?? [])
    .map((row) => row.action)
    .sort()
    .join(",");
  check(
    "every change is recorded (and the failed one isn't)",
    actions === ["clear", "clear", "clear", "clear", "clear", "clear", "clear", "clear", "disable", "enable"].sort().join(","),
    actions,
  );
  const detailAfter = await adminDb.rpc("admin_get_account", { p_user: student2.id });
  check(
    "the account's page shows its record, with who did it",
    detailAfter.data?.actions?.[0]?.also_disabled === true && detailAfter.data?.actions?.[0]?.admin_email === admin.email,
  );

  // ——— The admin log (admin-action-log-v0.1.md) ———
  // An action on an account that's since been deleted still shows.
  const gone = await makeUser("gone");
  await adminDb.rpc("admin_set_disabled", { p_user: gone.id, p_disabled: true });
  await service.auth.admin.deleteUser(gone.id);

  const mine = { p_admin_id: admin.id, p_limit: 200 };
  const expected = Number(psql(`select count(*) from public.admin_actions where admin_id = '${admin.id}'`));
  const logAll = await adminDb.rpc("admin_list_actions", mine);
  const times = (logAll.data ?? []).map((row) => row.created_at);
  check(
    "the log lists every action by this admin, newest first, with the total",
    !logAll.error && logAll.data.length === expected && logAll.data[0].total_count === expected &&
      times.every((t, i) => i === 0 || times[i - 1] >= t),
    logAll.error?.message ?? `${logAll.data?.length} of ${expected}`,
  );
  const nonAdminLog = await plainDb.rpc("admin_list_actions", {});
  const nonAdminAdmins = await plainDb.rpc("admin_list_log_admins");
  check("a non-admin can't read the log", nonAdminLog.error?.code === "42501" && nonAdminAdmins.error?.code === "42501");

  const goneEntry = logAll.data?.find((row) => row.target_user_id === gone.id);
  check("an action on a deleted account still shows, with no email", !!goneEntry && goneEntry.target_email === null);
  check(
    "entries carry the admin's and the account's emails",
    logAll.data?.every((row) => row.admin_email === admin.email) &&
      logAll.data?.some((row) => row.target_email === student.email),
  );

  const disables = await adminDb.rpc("admin_list_actions", { ...mine, p_action: "disable" });
  check(
    "filter by action",
    disables.data?.length > 0 && disables.data.every((row) => row.action === "disable"),
    `${disables.data?.length}`,
  );
  const plainOnly = await adminDb.rpc("admin_list_actions", { ...mine, p_account_search: plain.email });
  check(
    "filter by account email",
    plainOnly.data?.map((row) => row.action).sort().join(",") === "disable,enable",
    plainOnly.data?.map((row) => row.action).join(","),
  );
  const combined = await adminDb.rpc("admin_list_actions", { ...mine, p_action: "enable", p_account_search: plain.email });
  check("filters combine", combined.data?.length === 1 && combined.data[0].action === "enable");
  const future = await adminDb.rpc("admin_list_actions", { ...mine, p_from: new Date(Date.now() + 3600_000).toISOString() });
  const past = await adminDb.rpc("admin_list_actions", { ...mine, p_to: new Date(stamp - 3600_000).toISOString() });
  const window = await adminDb.rpc("admin_list_actions", {
    ...mine,
    p_from: new Date(stamp - 60_000).toISOString(),
    p_to: new Date(Date.now() + 60_000).toISOString(),
  });
  check(
    "filter by date range (from inclusive, to exclusive)",
    future.data?.length === 0 && past.data?.length === 0 && window.data?.length === expected,
  );
  const page1 = await adminDb.rpc("admin_list_actions", { ...mine, p_limit: 3, p_offset: 0 });
  const page2 = await adminDb.rpc("admin_list_actions", { ...mine, p_limit: 3, p_offset: 3 });
  const ids1 = new Set((page1.data ?? []).map((row) => row.id));
  check(
    "pages don't overlap, and each carries the total",
    page1.data?.length === 3 && page2.data?.length === 3 && page2.data.every((row) => !ids1.has(row.id)) &&
      page2.data[0].total_count === expected,
  );
  const admins = await adminDb.rpc("admin_list_log_admins");
  check("the Admin filter lists admins who appear in the log", admins.data?.some((row) => row.admin_id === admin.id && row.admin_email === admin.email));
} finally {
  for (const id of created) await service.auth.admin.deleteUser(id);
  psql(`delete from public.admin_actions where admin_id::text in (${created.map((id) => `'${id}'`).join(",") || "''"})`);
  console.log(results.join("\n"));
  const failures = results.filter((line) => line.startsWith("FAIL")).length;
  console.log(`\n${results.length - failures} passed, ${failures} failed`);
  process.exitCode = failures > 0 ? 1 : 0;
}
