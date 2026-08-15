---
name: run-iterative-playwright-development
description: >
  EXPERIMENTAL. Run the unattended iterative development + Playwright
  persona feedback loop defined in
  docs/iterative-development-playwright-process.md: analyze a feature spec,
  tag, build an increment, evaluate it with an independent synthetic
  persona/mission, capture evidence, commit, and derive the next
  iteration's spec — up to 3 iterations, in an isolated git worktree. Not
  the normal development process for this repo; only use when explicitly
  invoked for this experiment.
---

# Run Iterative Playwright Development

## Purpose

Execute the process defined in
`docs/iterative-development-playwright-process.md` end to end, without
pausing for approval between steps. This is an explicit, narrow exception
to this project's normal "confirm before tagging/committing" discipline —
see `CLAUDE.md`'s Repository Tagging section and the git safety rules in
the system prompt. The exception is scoped to this skill only, and is safe
because everything it does happens inside a disposable git worktree/branch
that never touches the user's real working tree until they choose to merge
it.

Before running this skill, the invoking session's permission mode should
already be set permissively enough that Bash, Edit/Write, and Playwright
MCP tool calls don't block on a prompt (see "Permission prerequisites"
below) — this skill does not and cannot change the session's own
permission mode.

## Inputs

The user provides:

1. **Feature slug** — stable, lowercase, hyphen-separated (e.g.
   `assignment-planning`).
2. **Feature specification path** — usually `docs/features/<slug>.md`.
3. **Assessment definition path** — a `synthetic/assessment/<id>.yaml` file
   (see `synthetic/README.md`), wiring an independent persona + mission.
   Per the process doc, the persona and mission **must not** be derived
   from the feature spec — if none exists yet for this feature, stop and
   ask the user to create one (copy `synthetic/assessment/example-*.yaml`
   and adapt) rather than inventing one.

If any input is missing or ambiguous, stop and ask. Do not guess a feature
slug from a spec filename that doesn't match the convention.

## Permission prerequisites

Read `.claude/settings.local.json`. It should contain a `permissions.allow`
list covering: `git tag`, `git commit`, `git add`, `git worktree
add`/`remove`, `git checkout`/`switch`, the Supabase CLI local-stack
commands, the `npm run` scripts this repo defines, `npx playwright test`,
`npm install`, the two fixed localhost `curl` health-check strings, the
bootstrap script, and the evidence-promotion `mkdir`/`cp` commands. If any
of these are missing, stop and tell the user to re-run the permission setup
before continuing — do not silently proceed and let the run stall on
prompts partway through.

Additionally, MCP tool calls to the `playwright` server (browser
automation) and arbitrary file edits are **not** covered by the Bash
allowlist above — those are gated by the session's permission *mode*, not
by command-pattern rules. Tell the user: for this run to be genuinely
unattended, start the session in `auto` permission mode (a safety
classifier approves routine actions) rather than relying on the Bash
allowlist alone. `acceptEdits` only covers file edits, not MCP tool calls
or unlisted Bash commands, so it is not sufficient by itself for Step 4.

## Experiment manifest and resumability

State lives at `docs/playwright/<slug>/experiment.yaml` (created on first
run, updated after each completed step):

```yaml
feature_slug: <slug>
feature_spec: docs/features/<slug>.md
assessment: synthetic/assessment/<id>.yaml
worktree_path: ../OneStepBeyond-experiments/<slug>
branch: experiment/<slug>
iterations:
  - number: 1
    tag: dev-<slug>-i1-start
    spec: docs/features/iterations/<slug>/<slug>.i01.md
    commit: <sha, filled in after Step 6>
    status: complete | in-progress
    stop_after: true | false
status: in-progress | stopped-complete | stopped-max-iterations
```

At the start of a run, read this file if it exists. If an iteration is
`in-progress`, resume it from the first incomplete step rather than
restarting the whole iteration. If the file doesn't exist, this is a fresh
experiment.

## One-time setup (run once per experiment, not per iteration)

1. If `worktree_path` doesn't already exist as a git worktree: `git
   worktree add <worktree_path> -b <branch>`. If the branch already exists
   (resuming), use `git worktree add <worktree_path> <branch>` without
   `-b`.
2. In the worktree: `npm install` (worktrees don't share `node_modules`).
3. Confirm the local Supabase stack is running (`npx supabase status`); if
   not, `npx supabase start`.
4. Run `./scripts/bootstrap-playwright-test-account.sh` to ensure the fixed
   local test account exists and `.env.playwright` is populated. Export
   `PLAYWRIGHT_ADMIN_EMAIL`/`PLAYWRIGHT_ADMIN_PASSWORD` from that file for
   the rest of the run.
5. Start the dev server in the worktree in the background (`npm run dev`),
   then poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`
   until it returns `200` before proceeding. Use that exact curl invocation
   — it's what the permission rule matches.
6. Ensure Playwright's browser binary is installed: `npx playwright install
   chromium` (idempotent — a no-op if already present).
7. Generate fresh Playwright auth storage state: with
   `PLAYWRIGHT_ADMIN_EMAIL`/`PLAYWRIGHT_ADMIN_PASSWORD` exported, run `npx
   playwright test --project=authentication`. This writes
   `tests/.auth/admin.json`, which `.mcp.json`'s `playwright` server reads
   via `--storage-state` to give the persona assessment an already
   logged-in browser (see "Browser Interaction" in
   `run-synthetic-persona-assessment`'s own SKILL.md, which assumes
   authentication is handled as infrastructure before it starts — this is
   that infrastructure).

   **Ordering caveat:** `.mcp.json`'s `--storage-state` path is read when
   the `playwright` MCP server process starts, not hot-reloaded. If this
   experiment is running inside a Claude Code session that already
   connected to the `playwright` MCP server *before* this step regenerated
   `tests/.auth/admin.json` (e.g. a session reused from earlier, or the
   very first time the file is created), the running server won't see the
   fresh session. Prefer starting each experiment run in a new Claude Code
   session so the MCP server connects after the file already exists and is
   current. If a stale session must be reused, tell the user the MCP
   connection needs to be re-established before Step 4 will see a
   logged-in browser.
8. Write or update `experiment.yaml` with the setup above.

All remaining work happens with the worktree as the working directory.

## Per-iteration loop (steps 1–7 of the process doc; repeat up to 3x)

### 1. Analyze

Read `CLAUDE.md`, then the current iteration's feature spec (the original
spec for iteration 1, or the previous iteration's derived
`<slug>.iNN.md` for iterations 2–3). Produce the same build-plan analysis
`analyze-feature`'s skill produces (reuse its format directly), plus one
explicit line this process doc requires that `analyze-feature` doesn't
normally output: **"Scope decision: full feature" or "Scope decision:
increment — <what's included, what's deferred>."** Do not implement yet.

### 2. Tag

```
git tag dev-<slug>-i<N>-start
```

Record it in `experiment.yaml`.

### 3. Build

Implement the scope decided in Step 1, following `CLAUDE.md`'s engineering
standards and architecture principles as normal. Include tests. If a
migration is added, run `npx supabase migration new <description>` then
`npx supabase db reset`, and — per `CLAUDE.md` — run the
`schema-migration-reviewer` agent before treating any migration touching a
copy/clone function or an RLS policy as done. Before moving on, run the
Definition of Done commands: `npm run lint`, `npm run test:run`, `npm run
build`. Fix failures; do not proceed with a failing build.

### 4. Evaluate

Invoke the `run-synthetic-persona-assessment` skill, pointed at the
assessment definition from Inputs. Per the process doc's Critical
Separation: do this without re-reading or referencing the feature spec
during the evaluation itself — the persona's job is to attempt the mission
cold, not to check the spec was followed.

### 5. Capture evidence

`run-synthetic-persona-assessment` writes to
`synthetic/reports/<assessment-id>/` (gitignored). Promote the relevant
subset into the committed location:

```
mkdir -p docs/playwright/<slug>/iteration-<NN>/
cp -r synthetic/reports/<assessment-id>/* docs/playwright/<slug>/iteration-<NN>/
```

Then, within that promoted copy, write `observations-i<NN>.md` (per the
process doc's Observation File format — what the persona attempted, what
was observed, why it matters, evidence, suggested improvement) derived from
`findings.yaml`/`report.md`, and rename screenshots to
`i<NN>-<sequence>-<short-description>.png` if the assessment skill didn't
already use that convention.

### 6. Commit

```
git add -A
git commit -m "feat(<slug>): development iteration <N>"
```

Update `experiment.yaml` with the commit SHA and mark the iteration
`complete`.

### 7. Decide: derive next spec, or stop

Invoke `generate-requirements-from-persona-assessment` on this iteration's
`findings.yaml`. Then apply the deterministic stop rule:

**Continue** (derive the next spec) only if the output contains at least
one finding with disposition in `{implementation_defect,
specification_gap, ux_improvement}` **and** severity in `{high, medium}`.

**Stop** otherwise — this matches the process doc's "minor cosmetic
preferences or speculative enhancements do not require another iteration."
Also stop unconditionally after iteration 3 regardless of findings
(recording any remaining substantive findings in `experiment.yaml` as
unresolved, per the process doc's "Stop: Maximum Iterations Reached").

If continuing, write
`docs/features/iterations/<slug>/<slug>.i<N+1>.md` with the required
frontmatter:

```yaml
---
feature: <slug>
iteration: <N+1>
derived_from: <path to this iteration's spec>
playwright_evidence: docs/playwright/<slug>/iteration-<NN>/
---
```

Set `experiment.yaml`'s `status` to `stopped-complete`,
`stopped-max-iterations`, or leave `in-progress` and start the next
iteration's Step 1.

## Restrictions

- Never push the experiment branch anywhere. Never touch the user's
  original branch or working tree — everything happens inside the
  worktree.
- Never delete the worktree or branch automatically at the end of a run.
  The user reviews and decides whether to merge, keep, or discard it.
- Follow every other CLAUDE.md engineering/UI/accessibility standard as
  normal during Step 3 — this process changes *when* tagging/committing
  happens, not what "done" means for the code itself.

## Completion

At the end of a run (stopped early or at the 3-iteration cap), report:

- worktree path and branch name;
- for each completed iteration: tag, commit SHA, spec file, evidence
  directory, and a one-line summary of findings;
- final stop reason;
- any unresolved substantive findings if stopped at the iteration cap;
- how to review (`cd <worktree_path>`, `git log`, look at
  `docs/playwright/<slug>/`) and how to merge or discard when ready.
