# Feature: Admin log — every admin action, in one place

**Status:** Built 2026-09-26 (tag `v-pre-admin-log`; see
"Implementation Notes (as built)"). Earlier: approved 2026-09-26. Decisions L1–L5 were
approved as recommended. It builds on `admin-account-management-v0.1.md` (built
2026-09-26). It adds a database function, so it needs a tag, a
`schema-migration-reviewer` pass, and an update to
`scripts/check-admin-functions.mjs` when it's built.

## Summary

The admin page records every action an admin takes (turning an account
off or on, clearing data) in `public.admin_actions`. Today that record
is only visible **one account at a time**, on each account's page (its
20 most recent actions). To see everything, you have to run SQL.

This adds an **Admin log** to `/admin`: every admin action, newest
first, across all accounts, filterable, and linked to the account each
action was taken on.

## Current behaviour

- **Recording:** `admin_actions` records who (`admin_id`), which
  account (`target_user_id`), what (`disable` / `enable` / `clear`),
  which categories, whether "Also turn off" was ticked, what was
  removed (per table), and when. It's written only by the admin
  functions, in the same transaction as the action. A failed action
  leaves no entry.
- **Access:** the table has row level security with no policies and no
  grants, so nobody reads it directly. The app reaches it only through
  `admin_get_account` (one account, 20 entries). This was tightened in
  the admin page's migration review, and this spec keeps that rule.
- **Refusals aren't recorded:** a refused attempt (by a non-admin, or
  against a protected account) raises an error before anything is
  written, so it isn't recorded.
- **Entries outlive accounts:** there are no foreign keys, so entries
  stay when an account is deleted. The emails then can't be looked up.

## User Story

As the app's administrator, I want to see every admin action in one
list, so that I can check what's been done, by whom and when, without
opening accounts one by one or writing SQL.

## Decisions (approved 2026-09-26, as recommended)

**L1. Where the log lives.** *Recommended:* a second view on `/admin`,
with a two-item navigation in the admin header: **Accounts** | **Admin
log**. Opening an entry's account goes to that account's page, and Back
returns to the log with its filters kept.

**L2. Filters.** *Recommended:*
- **Action:** any / turned off / turned back on / cleared data;
- **Admin:** any / a specific admin (chosen from the admins who appear
  in the log);
- **Account:** search by email;
- **Date range:** from / to (either can be left open).

It's sorted newest first and paged 50 at a time.

**L3. Record refused attempts too?**
- **Option A (recommended): no, not in this increment.** The log stays
  "what was changed". A refusal changes nothing, and the database
  already stops it.
- **Option B:** also record refusals (who tried what, on which account)
  as a separate kind of entry. That's useful for spotting misuse, but it
  needs a write outside the failed transaction, so it's more design.

**L4. Export.** *Recommended:* not in this increment. The SQL in the
Implementation guidance below covers a one-off export. Add a CSV
download later if it's needed.

**L5. How long entries are kept.** *Recommended:* forever, for now. The
volume is tiny: one row per admin action. Revisit if a retention rule is
ever required (these are school-age students' records).

## Functional Requirements

### 1. The Admin log view

- **A list of admin actions,** newest first, each showing:
  - **When:** date and time, in the viewer's time zone;
  - **Admin:** their email, or "Deleted account" if it no longer
    exists;
  - **Account:** its email, or "Deleted account";
  - **What:**
    - "Turned off";
    - "Turned back on";
    - "Cleared {categories}";
    - "Cleared all data";
    - "Cleared all data and turned off" (the one-step action).
    
    The wording is the same as the account page's record
    (`AccountPage.describeAction`), shared rather than duplicated.
  - **Removed:** for clears, the counts in words ("3 assignments, 5
    steps …"), using the existing `removalLines`.
- **Filters** as in L2. Changing a filter returns to the first page.
- **"Showing 1–50 of N"**, with Previous / Next.
- **An entry's account email opens that account's page,** unless the
  account has been deleted. Back returns to the log with its filters
  and page kept (L1).
- **Empty states:** "No admin actions yet." or "No admin actions match."

### 2. Data access

- **A new `security definer` function, `admin_list_actions`**, in a new
  migration. It checks for a superuser first, like the others, pins its
  `search_path`, and can be executed by `authenticated` only. It takes:
  - `p_action` (text, or null for any);
  - `p_admin_id` (uuid, or null);
  - `p_account_search` (text, or null);
  - `p_from` / `p_to` (timestamptz, or null);
  - `p_limit` / `p_offset`.
  
  It returns the entries with the admin's and account's emails (a left
  join to `auth.users`, so deleted accounts come back as null) and a
  total count.
- **The admins for the Admin filter** come from the same function, or a
  small companion (`admin_list_log_admins`): the distinct admins in the
  log, with their emails.
- **`admin_actions` itself stays closed:** still no policies and no
  grants. Nothing in this spec reads the table directly.
- **An index for the new ordering:** `admin_actions (created_at desc)`.
  The existing index is per account.

### 3. Access

The same as the rest of `/admin`: superusers only, enforced by the
function. A non-admin calling `admin_list_actions` is refused.

## Accessibility

- A real `<table>` from `sm:` (with a caption; its column headers
  aren't sortable, since the log is always newest first), and a stacked
  list on phones.
- Labelled filters. The date inputs use native `<input type="date">`.
- The navigation between **Accounts** and **Admin log** is a `<nav>`
  with `aria-current` on the active item, and 44 px targets.

## Acceptance Criteria

- A superuser opens **Admin log** and sees every admin action across all
  accounts, newest first, with when, admin, account, what, and (for
  clears) what was removed.
- **Filtering** by action, admin, account email and date range shows
  only the matching entries, and the total updates. Changing a filter
  returns to page 1.
- **Paging** 50 at a time works with Previous / Next.
- **Tapping an entry's account** opens its page. Back returns to the log
  with its filters and page kept.
- **An action on a since-deleted account** still appears, with "Deleted
  account".
- **A non-superuser** calling `admin_list_actions` is refused.
  `admin_actions` still can't be read directly by anyone.
- **The wording** of an entry matches the account page's record exactly.

## Testing Notes

- **Database** (extend `scripts/check-admin-functions.mjs`):
  - refusal for a non-admin;
  - each filter, alone and combined;
  - paging and the total;
  - a deleted account's entry still listed, with a null email;
  - the table still unreadable directly.
- **Unit:** the shared action wording (moved to
  `src/domain/adminAccounts.ts`) for every kind of entry.
- **Component:**
  - the log view: rows, filters producing the right query, paging,
    empty states;
  - opening an account and returning with filters kept;
  - the header navigation.
- **Real browser** (1280 px and 320 px): take a few actions, then find
  each in the log by filter.

## Domain Model Touchpoints

None. The admin log is operations infrastructure, not domain (the same
reasoning as the admin page, and `Domain-Model.md` on
authentication/authorization infrastructure).

## Explicitly Out of Scope

- Recording refused attempts (L3).
- Export (L4).
- Retention or deleting log entries (L5).
- Recording other admin activity, such as viewing an account. Only
  changes are recorded, as today.
- Changes to what's recorded for each action.

## Implementation guidance (for reference)

A one-off export of the whole log, until L4 is revisited. Run it in the
Supabase SQL Editor, or `psql`, as the database owner:

```sql
select a.created_at, admin.email as admin, target.email as account,
       a.action, a.categories, a.also_disabled, a.counts
from public.admin_actions a
left join auth.users admin  on admin.id  = a.admin_id
left join auth.users target on target.id = a.target_user_id
order by a.created_at desc;
```

## Implementation Notes (as built), 2026-09-26

- **Analysis decisions:**
  - G1: one shared wording for both views: "Cleared all data and turned
    off", with no comma;
  - G2: date filters use the viewer's own days, both inclusive, and "to"
    before "from" simply matches nothing;
  - G3: from the log, the account page's Back reads "← Admin log" and
    returns with the filters kept.
- **Migration** `supabase/migrations/20260926130000_admin_action_log.sql`:
  - `admin_list_actions` and `admin_list_log_admins`, both `security
    definer`, checking for a superuser first, executable by
    `authenticated` only;
  - an index on `admin_actions (created_at desc, id)`;
  - `admin_actions` stays closed.
  
  The `schema-migration-reviewer` agent found nothing blocking. Its one
  suggestion, putting the tie-break `id` in the index, was taken.
- **Code:**
  - `src/domain/adminAccounts.ts`: `describeAdminAction`, moved from
    `AccountPage` and shared; `dateRangeBounds`; `ADMIN_ACTION_LABEL`;
  - `src/services/adminService.ts`: `listActions` and `listLogAdmins`;
  - `src/admin/AdminLog.tsx` (a table from `sm:`, a stacked list on
    phones) and `useAdminLog.ts`;
  - `AdminApp.tsx`: the header `<nav>` (Accounts | Admin log, with
    `aria-current`), each view's filters kept, and Back returning to the
    view that opened the account;
  - `AccountPage.tsx`: `backLabel`.
- **Tests:**
  - `scripts/check-admin-functions.mjs` gained 10 log checks (46 in all):
    - a non-admin refused;
    - the entries, with a total, newest first;
    - a deleted account's entry with no email;
    - each filter, and filters combined;
    - the date bounds (from inclusive, to exclusive);
    - pages that don't overlap;
    - the admins filter.
  - Unit tests for the shared wording and the date bounds.
  - Service tests.
  - `AdminLog` component tests: rows, deleted accounts, opening an
    account, each filter, the bounds reaching the service, both empty
    states, paging.
  - `AdminApp` tests: `aria-current`, "← Admin log" keeping filters, each
    view keeping its own.
- **Real browser** (1280 px and 320 px, local Supabase), 6 checks:
  - the log lists the admin's two actions, newest first;
  - filtering by action;
  - opening an account, and "← Admin log" keeping the filter;
  - today's date range includes today's actions, and a past range
    matches nothing;
  - at 320 px, the navigation fits with 44 px targets.

