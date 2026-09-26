# Admin powers through superuser-checked database functions

Date: 2026-09-26

## Context

`admin-account-management-v0.1.md` adds a superuser-only page, `/admin`,
to list every account, turn accounts off and on, and clear an account's
data by category. Until now superusers could only **read** student data
(additive RLS read policies, `supporter-role-based-access` §7.3). Nothing
in the app could see `auth.users`, disable an account, or delete another
account's rows. The product owner settled A1–A7 and Q1–Q5 on 2026-09-26.

## Decision

1. **Admin powers live in `security definer` database functions**
   (migration `20260926120000_admin_account_management.sql`, A1):
   `admin_list_accounts`, `admin_get_account`, `admin_set_disabled`,
   `admin_clear_preview` and `admin_clear_account`.
   - Each first checks that the caller is in `public.superusers`.
   - Each pins an empty `search_path`, and can be executed by
     `authenticated` only.
   - Helpers sit in a schema the API doesn't expose (`admin_private`).
   - The browser never holds the service-role key, and there's no Edge
     Function to deploy.
2. **Turning an account off sets `auth.users.banned_until`** to 100 years
   ahead (`'infinity'` makes the auth server fail sign-in with a 500), and
   **deletes the account's `auth.sessions`**, which revokes its refresh
   tokens. Sign-in then fails with `user_banned`, which the app shows as
   "This account has been turned off…". A current access token keeps
   working until it expires, up to an hour (A3). Checked on local
   Supabase.
3. **Clearing is one function call, so it's one transaction.** Categories
   delete in dependency order, and lean on the tables' own cascades. "All
   data" can also turn the account off in the same call (A5).
4. **The confirmation's preview runs the real deletes inside a
   sub-transaction and rolls them back**, so it always matches what Clear
   will remove.
5. **Every change is recorded in `admin_actions`** (A4). The table has
   row level security, no policies and no grants: it's written only by
   the functions, and read only through `admin_get_account`. This was
   tightened after the migration review.
6. **Protections** (A6, Q2): another superuser can never be turned off or
   cleared; you can't turn yourself off (including through "Also turn
   off"); you can clear your own data. Superuser status is still granted
   only in the database.
7. **`scripts/check-admin-functions.mjs`** checks all of this against the
   local stack (Q5), because the unit tests mock Supabase.

## Alternatives considered

- **An Edge Function with the service-role key, using Supabase's admin
  API:** the admin API is supported, but it would be the project's first
  Edge Function, with its own deployment and secrets.
- **Superuser write policies on every table (RLS):** these would spread
  delete power across twelve policies, and there'd be no single
  transaction for a multi-category clear.
- **Making RLS refuse a disabled account's reads, to close the last
  hour:** every existing policy would need touching. That was rejected
  in A3.

## Consequences

- **Writing to Supabase's `auth` schema** (`banned_until`,
  `auth.sessions`) depends on its layout. Re-run the check script after a
  Supabase upgrade.
- **The admin page makes no stored reads and queues nothing.** It needs
  a connection.
- **A disabled student's offline copy stays on their device** until
  someone else signs in there (Q1). That's by design in PWA 2c.
- **The Diagnostic dashboard could later list students from
  `admin_list_accounts`** instead of `listKnownStudentIds`.

*Update 2026-09-26, the admin log* (`admin-action-log-v0.1.md`): the
whole record is now readable in the app, still only through
superuser-checked functions (`admin_list_actions`,
`admin_list_log_admins`, migration `20260926130000_admin_action_log.sql`).
`admin_actions` itself stays closed to direct reads.

