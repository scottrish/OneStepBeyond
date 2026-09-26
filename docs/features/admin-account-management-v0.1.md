# Feature: Admin — view and manage all accounts

**Status:** Built 2026-09-26 (tag `v-pre-admin-accounts`; see
"Implementation Notes (as built)" and
`docs/decisions/20260926-admin-account-management.md`). Earlier:
approved 2026-09-26. Decisions A1–A7 were
settled by the product owner (below). Needs an `analyze-feature` pass. It adds database functions and a
table, so it needs a tag, a `schema-migration-reviewer` pass, and a
decision record when it's built.

## Summary

The product owner needs one place to see every account in the app,
turn an account off or back on, and clear out an account's data, either
selectively or all of it. Today that means running SQL against the
database by hand.

This adds an **admin page, for superusers only**, with:

1. **A list of all accounts:** students, supporters, and accounts with
   no data yet.
2. **Disable / enable** for an account. A disabled account can't sign in
   or keep using the app.
3. **Clear data** under an account, by category or all of it. The
   account itself stays.

## Current behaviour

- **Superusers already exist**
  (`supporter-role-based-access-feature-spec-v0.1.md` §7.3):
  - a `public.superusers` table, provisioned only by direct database
    access and never by application code;
  - they can **read** every student's data (additive RLS read policies),
    but can't change any of it;
  - they use this for the dashboard's Diagnostic mode (`/dashboard`).
- **No account list exists.** The app can't read `auth.users`; that's
  Supabase's own table. Diagnostic mode finds students indirectly, from
  who owns courses (`superuserService.listKnownStudentIds`), so an
  account with no courses (a new student, or a supporter) is invisible.
- **Disabling or deleting** an account, or clearing its data, is only
  possible through the Supabase dashboard or SQL.
- **How account data is stored:** every table carries the account's id
  and cascades on delete:
  - courses → assignments → steps (`work_items`) → work sessions;
  - assignments → breakdown attempts (`decomposition_attempts`),
    reflections, and coaching interactions;
  - on their own: activities, study hours (`student_preferences`),
    planning sessions (`planning_sessions`), and support relationships,
    where the account is either the student or the supporter.

## User Story

As the app's administrator, I want to see every account, switch an
account off, and clear some or all of its data, so that I can support
students, handle a problem account, or reset a test account, without
touching the database directly.

## Decisions (settled 2026-09-26)

**A1. How the page gets admin powers.** *Decided 2026-09-26: Option A,
database functions.* The browser must never hold the service-role key.
- **Option A (recommended): database functions** (`security definer`,
  in a migration). Each one first checks the caller is in
  `superusers`, then reads `auth.users`, sets the disabled flag, or
  deletes rows. They're called from `src/services/adminService.ts` like
  any other query (`supabase.rpc`). Everything stays in migrations,
  like the rest of this project, and no new server needs deploying.
- **Option B: a Supabase Edge Function** holding the service-role key,
  using Supabase's admin API. It's more flexible (it could, say, send
  emails), but it's the project's first Edge Function, so it needs its
  own deployment and secrets.

**A2. Where the page lives.** *Decided 2026-09-26: Option A, `/admin`.*
- **Option A (recommended): its own address, `/admin`**, beside
  `/dashboard` and `/invite` (the same pathname check in `Root.tsx`, and
  its own lazily loaded bundle). It's desktop-first, but still usable on
  a phone.
- **Option B:** a section inside the dashboard's Diagnostic mode. It
  sits beside the student data it relates to, but mixes read-only
  diagnosis with actions that destroy data.

**A3. What "disabled" means.** *Decided 2026-09-26: as recommended.*
- The account can't sign in, and is signed out on every device the next
  time its session refreshes. Its existing session is cut off at once
  (its refresh tokens are revoked), so the longest it can carry on is
  the life of its current access token, up to an hour.
- Its data is untouched.
- On the Login screen: "This account has been turned off. Ask your
  teacher or the app's administrator."
- Enabling it again restores everything as it was.

*Alternative, not taken:* also make RLS refuse a disabled account's
reads, which closes that last hour. More work, and every existing policy
is touched.

**A4. A record of admin actions.** *Decided 2026-09-26: yes.* A small
`admin_actions` table recording who did what, to which account, when,
and which categories were cleared. It's shown on the account's page.
Clearing a student's data can't be undone, and these are school-age
students.

**A5. Deleting an account completely.** *Decided 2026-09-26: no full
deletion.* Instead, clearing all data and turning the account off can be
done **in one step**: the "All data" confirmation has a tick box, **Also
turn off this account** (requirement 3). The empty, disabled account
stays visible in the list.

**A6. Protecting superusers.** *Decided 2026-09-26: as recommended.*
- You can't disable yourself.
- Other superusers are shown, marked "Admin", but can't be disabled or
  cleared from this page.
- Superuser status is still only granted in the database, never from
  this page (the §7.3 rule).

**A7. How strongly clearing is confirmed.** *Decided 2026-09-26: as
recommended.*
- **Selective:** a sheet listing what will be removed, with counts, and
  a red **Clear** button.
- **All data:** the same, plus typing the account's email to enable the
  button, and the **Also turn off this account** tick box (A5).

## Functional Requirements

### 1. The account list

- **Shows every account in `auth.users`,** for each one:
  - email;
  - when it was created and when it last signed in;
  - status: **Active**, **Disabled**, or **Never signed in** (Q3: the
    account exists but has never signed in, usually an unconfirmed
    sign-up);
  - its roles, worked out from its data: **Student** (owns any student
    data or preferences), **Supporter** (supporter on any relationship),
    **Admin** (in `superusers`);
  - a few counts: courses, assignments, and planned sessions.
- **Search** by email, and **filter** by status and role.
- **Sort** by email, created or last sign-in. Newest first by default.
- **Paged** 50 at a time.
- **Tap an account** to open its page.

### 2. An account's page

- **The account's details,** as in the list, plus its support
  relationships: as a student, its supporters and their status; as a
  supporter, its students.
- **Disable / Enable,** as in A3, confirmed in a sheet. Not offered for
  yourself or for other superusers (A6).
- **Clear data** (section 3).
- **Recent admin actions** on this account (A4).

### 3. Clearing data

The account stays; only its data goes. The categories follow how the
data depends on itself: clearing one also removes everything that
depends on it, and the sheet says so.

| Category | Removes | Also removes (dependent data) |
|---|---|---|
| **Courses and all school work** | courses, and plan history (planning sessions, Q4) | their assignments, steps, work sessions, breakdown attempts, reflections, coaching records |
| **Assignments** (keeps courses) | assignments | their steps, work sessions, breakdown attempts, reflections, coaching records |
| **Plans** (keeps assignments and steps) | work sessions, planning sessions | coaching records keep their text but lose the link to the removed session (as today) |
| **Reflections and coaching history** | reflections, breakdown attempts, coaching interactions | none |
| **Activities** | activities | none |
| **Study hours** | the saved study hours | none (the defaults apply again) |
| **Support relationships** | relationships where the account is the student or the supporter, including pending invitations | the other side loses access at once |

- **Choose one or more** categories, or **All data**, which is every
  category. The sheet shows what will be removed, with counts, before
  confirming (A7).
- **"All data" can also turn the account off, in one step** (A5). Its
  confirmation has a tick box, **Also turn off this account**:
  - it's unticked by default;
  - it isn't shown when the account is already disabled, or is your own
    account (A6);
  - when ticked, the data is cleared and the account is disabled
    together, exactly as Disable does it (A3), and the confirm button
    reads **Clear all data and turn off**.
- **All of a request's changes succeed or none do** (one database
  transaction), including turning the account off when that's ticked.
  The result shows what was removed, and whether the account is now off.
- **Clearing works on any account except other superusers** (A6),
  including a disabled one, and including your own (Q2). You still can't
  turn your own account off.

### 4. Access

- The page, and every database function behind it, is for superusers
  only. Anyone else who opens `/admin` sees "This page is for
  administrators" and nothing else. The functions refuse regardless of
  what the page shows.
- Nothing here changes what students or supporters can see or do.

## What the affected student notices

- **Disabled:**
  - they're signed out, within an hour at most (A3);
  - Login shows the "turned off" message.
  - Their offline copy and unsaved changes **stay on their device** (Q1).
    Being signed out by a revoked session isn't a Sign out, and 2c
    deliberately keeps both for the same student. They're cleared when
    anyone else signs in on that device. Changes still waiting can't be
    sent while the account is off.
- **Data cleared:**
  - the next time they're online, their screens load the now-empty data;
  - a device offline at the time still shows its stored copy until it
    reconnects;
  - unsaved offline changes that refer to removed items get the usual
    calm "didn't apply" note (2c conflict handling).
- **Supporters** of a cleared student see the cleared data disappear.
  If support relationships were cleared, they lose access.

## Analysis decisions (2026-09-26)

- **Q1:** a disabled student's offline copy stays on their device until
  someone else signs in there. 2c is unchanged.
- **Q2:** you can clear your own account's data, but not turn it off.
- **Q3:** "Never signed in" in place of "Invited — not signed in yet".
- **Q4:** "Courses and all school work" also clears plan history
  (`planning_sessions`).
- **Q5:** the admin database functions get a committed check script,
  run by hand against local Supabase.
- **Q5b:** built in one piece.
- **Technical findings:**
  - `auth.users.banned_until = 'infinity'` breaks sign-in with a 500
    error, so disabling uses `now() + 100 years`;
  - the auth server's `user_banned` error code is mapped to the "turned
    off" message.

## Accessibility

- Standard WCAG 2.2 AA: a real `<table>` with a caption and sortable
  column headers (`aria-sort`); labelled search and filters; all actions
  reachable by keyboard.
- Destructive confirmations are `ResponsiveSheet`s. The red button is
  never the default focus.
- Status isn't shown by colour alone: "Disabled" is written out.
- At phone width the table becomes a stacked list.

## Acceptance Criteria

- **A superuser at `/admin`** sees every account, including ones with no
  data and supporter-only accounts, with email, dates, status, roles and
  counts; and can search, filter, sort and page.
- **Anyone else** at `/admin` sees only "This page is for
  administrators". Calling the admin functions directly (not through
  the page) is refused for a non-superuser.
- **Disabling** an account:
  - stops it signing in (Login shows the "turned off" message) and ends
    its sessions within the access token's life;
  - enabling it again restores sign-in with all data intact.
- **Selective clearing** removes exactly the chosen categories and what
  depends on them, and nothing else. The confirmation's counts match
  what's removed.
- **"All data"** requires typing the account's email. With **Also turn
  off this account** unticked, it leaves an account that can sign in to
  an empty app (the "add your courses first" state). Ticked, the account
  is cleared and disabled in one step (sign-in refused with the "turned
  off" message), recorded as one admin action. If either part fails,
  neither happens.
- The tick box doesn't appear for an account that's already disabled,
  or for your own.
- **Protected accounts:** you can't disable yourself, and another
  superuser can't be disabled or cleared.
- **The record** (A4): every disable, enable and clear appears on the
  account's page with who, when and what.
- **A failed clear** removes nothing.

## Testing Notes

- **Database** (local Supabase, SQL or through the client, as the
  existing schema checks are done): each function refuses a
  non-superuser; each category deletes exactly its rows; a failure
  partway leaves everything; superusers are protected.
- **Unit:** the category → tables mapping and the confirmation's
  summary text (a pure function, `src/domain/adminClearing.ts`).
- **Component:** the list (search, filter, sort, paging); the account
  page; both confirmations (the email must match; the "Also turn off"
  tick box changes the button and is hidden for disabled accounts and
  yourself); the non-admin screen.
- **Database:** "all data" with turn-off ticked clears and disables in
  one transaction; a failure in either leaves both undone.
- **Real browser:**
  - a throwaway student with data: clear "Plans" → the student's Today
    is empty but assignments remain; clear all → the "add your courses
    first" state;
  - disable → sign-in refused with the message; enable → back in.

## Domain Model Touchpoints

- **No new domain concepts.** Superuser status, account enable/disable,
  and the admin record are authentication and operations
  infrastructure, not domain (`Domain-Model.md`: "authentication/
  authorization infrastructure, not domain concepts").
- **Ownership isn't changed.** An admin removes a student's data; they
  never own or edit it (Domain Invariant 15 is about Supporters, and
  this doesn't make the admin one).
- **Clearing follows the model's own dependencies:** assignments belong
  to courses, and steps, sessions and reflections belong to assignments.
  That's why the categories cascade.

## Explicitly Out of Scope

- **Creating accounts, resetting passwords, or changing emails** (use the
  Supabase dashboard).
- **Granting or removing superuser status** (database only, §7.3).
- **Deleting an account completely** (A5).
- **Editing a student's data** (only clearing it).
- **Exporting an account's data.**
- **Changing the Diagnostic dashboard** (it could later use the full
  account list instead of `listKnownStudentIds`).
- **Bulk actions across several accounts at once.**

## Implementation Notes (as built), 2026-09-26

- **Migration** `supabase/migrations/20260926120000_admin_account_management.sql`:
  - the `admin_actions` table (row level security, no policies, no
    grants; read only through `admin_get_account`);
  - the helper schema `admin_private` (not exposed by the API);
  - five `security definer` functions, each checking for a superuser
    first, executable by `authenticated` only.
- **The `schema-migration-reviewer` agent** reported two findings, both
  fixed:
  - an account whose only data is plan history showed no Student role,
    so `planning_sessions` was added to the check;
  - `admin_actions` was readable as a whole table, so its grant was
    removed.
  
  Its coverage, security, protection and preview-rollback checks came
  back clean.
- **Code:**
  - `src/services/adminService.ts`: RPC wrappers;
  - `src/domain/adminAccounts.ts` and `adminClearing.ts`: statuses,
    roles, the turned-off message, the categories, and the removal
    wording;
  - `src/admin/`: `AdminApp` (sign-in, the superuser gate, and the
    "This page is for administrators" screen), `AccountList` (a table
    from `sm:`, a stacked list on phones), `AccountPage`,
    `ClearDataSheet` and `StatusBadge`, plus hooks;
  - `src/Root.tsx`: the `/admin` branch, full width;
  - `src/hooks/useAuth.ts`: `user_banned` → "This account has been
    turned off. Ask your teacher or the app's administrator."
- **Database checks:** `node scripts/check-admin-functions.mjs` against
  local Supabase, 36 checks:
  - who may call the functions;
  - the list, filters, sort and paging, and roles including plan history
    only;
  - each category removes exactly its rows, and the preview matches
    while changing nothing;
  - a forced failure leaves everything;
  - "all data" plus turning off, then sign-in refused with `user_banned`
    and the session refresh refused;
  - turning off and on;
  - the protections;
  - the record.
- **Unit and component tests:**
  - `adminAccounts`, `adminClearing` and `adminService`;
  - `AdminApp` (signed out, not an admin, admin);
  - `AccountList` (the rows, opening an account, search, filters, sort
    with `aria-sort`, paging);
  - `AccountPage` (details, turning off and on, a refusal, the
    protections, selective clearing with the preview, "all data" with the
    email and "Also turn off", an already-off account, cancel);
  - the `useAuth` banned message.
- **Real browser** (1280 px and 320 px, local Supabase), 9 checks:
  - a non-admin sees only the one line;
  - the list's statuses, roles and counts;
  - clearing "Plans" removes the session and keeps the step, and it's
    recorded;
  - a turned-off student gets the plain message at sign-in, and signs in
    again once turned back on;
  - "All data" stays disabled until the email is typed;
  - clear all plus turn off, at 320 px.
- **Not yet:**
  - the Diagnostic dashboard still finds students through courses;
  - no bulk actions;
  - Login still reports errors with `alert()` (existing behaviour).

