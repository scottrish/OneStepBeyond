# Synthetic Persona Testing

This is a Claude-driven evaluation framework, separate from Vitest/Playwright
regression tests. It has Claude Code interact with the running application
*in character as a defined persona* — a specific user with specific domain
knowledge, specific application inexperience, and specific goals — and
produce evidence-based feedback about the experience, not a pass/fail
result.

It answers a different question than a regression test does. A regression
test asks "does this still work?" This asks "would a first-time user who
understands the problem domain but has never used this application actually
be able to figure this out, and where would they get stuck?"

## How the pieces fit together

```
synthetic/
├── personas/<id>.yaml        who is doing the assessment
├── missions/<id>.yaml        what they're trying to accomplish, and what
│                             to evaluate about the experience
├── assessment/<id>.yaml      entry point: wires a persona + mission +
│                             protocol together with output locations
├── protocol/
│   ├── persona-assessment.md how to conduct the assessment in character
│   └── findings-schema.md    where structured findings.yaml files go
└── reports/<assessment-id>/  generated output (gitignored — not committed)
```

Two Claude Code skills drive this (`.claude/skills/`):

- **`run-synthetic-persona-assessment`** — reads an assessment definition,
  loads the referenced persona/mission/protocol/feature spec, drives the
  running application via Playwright MCP while staying in character, and
  produces `report.md` + `findings.yaml` + supporting evidence.
- **`generate-requirements-from-persona-assessment`** — reads a completed
  assessment's `findings.yaml` and turns it into a proposed enhancement
  requirements spec, distinguishing implementation defects (bugs) from
  specification gaps (the spec itself needs to change) from UX
  improvements from things needing human validation.

## Setting this up for a new application

The `example-*` files in `personas/`, `missions/`, and `assessment/` are
templates, not a real assessment — copy each, rename it, and adapt:

1. **`personas/your-persona.yaml`** — who is assessing this. Give them a
   real role, real domain knowledge, and specific knows/doesn't-know
   boundaries. A persona that "knows everything" or "knows nothing"
   produces useless feedback; specificity is what makes the assessment
   believable.
2. **`missions/your-mission.yaml`** — reference the real
   `docs/features/*.md` spec under assessment, and describe what to
   evaluate (discoverability, terminology clarity, confidence,
   friction points) — not a fixed click-by-click script.
3. **`assessment/your-assessment.yaml`** — wire the persona and mission
   together, and set the output directory under `reports/`.

Then run the `run-synthetic-persona-assessment` skill, pointing it at your
new assessment file.

## The companion Playwright smoke test

`tests/personas/example-first-time-user.spec.ts` is a much lighter-weight
companion: a single, fast, deterministic assertion (e.g. "the primary
call-to-action is visible on load") that can run in CI as a cheap regression
guard for the specific discoverability question a full persona assessment
raised. It is not a substitute for the full assessment — it exists so a
finding the assessment surfaced doesn't silently regress later without
needing to re-run a full persona assessment to notice.

`tests/auth.setup.ts` logs in once and saves storage state to
`tests/.auth/` (gitignored) so persona-assessment Playwright specs run
already authenticated — see `playwright.config.ts`'s `authentication` /
`persona-assessment` project split. Set `PLAYWRIGHT_ADMIN_EMAIL` and
`PLAYWRIGHT_ADMIN_PASSWORD` in your environment before running
`npx playwright test`.

## What this is not

- Not a functional/regression test suite — it doesn't assert pass/fail
  against a spec, it produces qualitative, evidence-based feedback.
- Not a way to modify application code or specs directly — both skills are
  read-only/generative; a human (or a separate `analyze-feature` +
  implementation pass) still decides what to act on.
- Not a replacement for `docs/features/*.md` specs — missions reference an
  existing spec; the assessment evaluates the built experience against it.
