# Development

This project develops and tests against a **local Supabase stack**, not a
hosted project — see
`docs/decisions/20260814-local-supabase-for-initial-development.md` for
why. This doc is the practical how-to.

## Prerequisites

- Node.js and npm (already required for this project).
- [Docker](https://www.docker.com/products/docker-desktop/) — the Supabase
  CLI runs Postgres, Auth, Storage, and Studio as local containers.
- The Supabase CLI. **Already have it installed globally (e.g. from
  another project)?** Use that — it's not project-specific, it just
  operates on whatever `supabase/` directory it finds in the current
  working directory. Drop the `npx` prefix from every command below and
  run `supabase ...` directly; a quick `supabase --version` is worth
  checking if something behaves unexpectedly, but there's no per-project
  install step needed.

  Don't have it yet? Add it as a devDependency instead of a global install,
  so everyone on the project (and CI) uses the same pinned version:

  ```bash
  npm install supabase --save-dev
  ```

  and use `npx supabase ...` as written below. (Global install via
  Homebrew etc. also works — see the
  [Supabase CLI docs](https://supabase.com/docs/guides/local-development/cli/getting-started).)

## One-time setup

```bash
npm install
npx supabase init      # creates supabase/ (config.toml, migrations/) — commit this
npx supabase start     # pulls images, starts the local stack
```

`supabase start` prints a block like:

```
API URL: http://127.0.0.1:54321
Publishable key: sb_publishable_...
Secret key: sb_secret_...
Studio URL: http://127.0.0.1:54323
```

(Older CLI versions print legacy `anon key` / `service_role key` JWTs
instead — same roles, different names. Use whichever pair your `supabase
start` output actually shows.)

Copy the **API URL** and **Publishable key** into `.env.local`:

```bash
cp .env.example .env.local   # if you don't already have one
```

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from supabase start>
```

The **Secret key** (`sb_secret_...` — full admin access, bypasses RLS) has
no place in this app's `.env.local` — Vite inlines every `VITE_*` var into
the client bundle at build time, so putting it there would ship
unrestricted database access to every visitor's browser. This project has
no server-side code yet; if one is added later that needs the secret key,
it must be read from a non-`VITE_`-prefixed var in a server-only context,
never the client.

(`.env.local` is gitignored — never commit real credentials here, local or
otherwise.) Then:

```bash
npm run dev
```

Lost the values later? Run `npx supabase status` any time the stack is
running to print them again.

## Day-to-day

- Start the local stack once per work session: `npx supabase start`
  (containers persist between `stop`/`start`; you don't lose local data by
  stopping it).
- Run the app as usual: `npm run dev`.
- **Studio** (`http://127.0.0.1:54323` by default) gives you a browser UI
  over the local Postgres instance — table browser, SQL editor, auth users
  — a faster loop than writing one-off queries while developing.

## Schema changes (migrations)

```bash
npx supabase migration new <short_description>
```

creates a new timestamped SQL file under `supabase/migrations/`. Write the
schema change there, then apply it to your local database from scratch:

```bash
npx supabase db reset
```

This drops and recreates the local database, reapplies every migration in
order, and then runs `supabase/seed.sql` if one exists. It's the standard
way to confirm a migration works end-to-end, not just "on top of whatever
state my local DB happened to be in."

Before considering any migration touching a copy/clone function or an RLS
policy "done," run it through the `schema-migration-reviewer` agent per
CLAUDE.md. `supabase/migrations/` is what an eventual hosted project will
also apply (via `supabase db push`) and how CI and every other developer's
local instance stay in sync — commit these files.

## Seed data

If `supabase/seed.sql` exists, `supabase db reset` runs it automatically.
Use it for development sample data (e.g. courses/activities matching the
persona docs under `synthetic/personas/`) — never anything resembling real
student data.

## Running tests

- `npm run test:run` — Vitest unit/component tests. Independent of the
  Supabase stack; mock the client at the boundary where a test needs to.
- `npm run lint` — ESLint.
- `npm run build` — type-check and build. Doesn't need the local stack
  *running*, but Vite inlines `VITE_*` env vars at build time, so
  `.env.local` still needs non-empty values (`src/lib/supabase.ts` throws
  otherwise).
- `npx playwright test` — persona/e2e smoke checks (`synthetic/README.md`).
  These need:
  1. Playwright's browser binaries installed once per machine:
     `npx playwright install chromium`.
  2. the local Supabase stack running (`npx supabase start`),
  3. the dev server running (or Playwright's configured `webServer`, if
     any — check `playwright.config.ts`),
  4. a real test account in the **local** instance's auth — create one via
     Studio's Auth panel, the CLI, or (for the synthetic persona workflow)
     `scripts/bootstrap-playwright-test-account.sh`, which creates/confirms
     a fixed test account against the local instance only and writes
     `.env.playwright` — with `PLAYWRIGHT_ADMIN_EMAIL` /
     `PLAYWRIGHT_ADMIN_PASSWORD` set in your environment before running.

  `tests/auth.setup.ts` (the `authentication` Playwright project) signs
  that account in and saves the session to `tests/.auth/admin.json`. The
  app has no router yet (added when a feature needs one, per `CLAUDE.md`),
  so success is detected by content (a "Sign out" button appearing), not by
  a URL change — don't "fix" that assertion back to a URL check.

## Stopping / resetting

```bash
npx supabase stop              # stops containers, keeps local data
npx supabase stop --no-backup  # stops and discards local data
```

If the local stack gets into a confusing state, `stop --no-backup` then
`start` then `db reset` is the reliable way back to a clean slate.

## Moving to a hosted project later

Not yet — this is deliberately deferred (see the decision record). When it
happens, it's expected to need no application code changes:

```bash
npx supabase link --project-ref <ref>
npx supabase db push     # applies supabase/migrations/ to the hosted project
```

then point the real deployment's env vars at the hosted project's URL and
publishable key instead of the local ones.

## Troubleshooting

- **Docker not running** — start Docker Desktop first; `supabase start`
  fails fast with a clear error otherwise.
- **Ports already in use / stack behaving oddly** — `npx supabase stop`,
  then `npx supabase start` again.
