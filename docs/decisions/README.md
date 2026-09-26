# Project Decisions

This directory contains durable product, domain, and architecture decisions.

Each file follows the format: **Context** → **Decision** → **Alternatives considered** → **Consequences**.

Create a new decision record whenever a significant architectural decision
is made — a non-obvious choice between two or more reasonable approaches, a
deviation from an existing pattern, or a trade-off with future consequences.
See `CLAUDE.md`'s "Architectural Decisions" section for when to create one.

Name new files `YYYYMMDD-short-slug.md`. Add each new decision to the index
below as it's created — the index should always reflect every file in this
directory.

## Index

| # | Decision | Date |
|---|----------|------|
| 1 | [Student-only first increment](20260813-student-only-first-increment.md) | 2026-08-13 |
| 2 | [Local Supabase for initial development](20260814-local-supabase-for-initial-development.md) | 2026-08-14 |
| 3 | [Adopt the prototype's visual design toolchain early](20260814-adopt-prototype-visual-design-toolchain.md) | 2026-08-14 |
| 4 | [Manual Work Breakdown: client-side draft state, single entry point](20260815-manual-work-breakdown-draft-state.md) | 2026-08-15 |
| 5 | [Coach/Parent/Diagnostic Dashboard reuses student auth; no real roles yet](20260816-dashboard-reuses-student-auth.md) | 2026-08-16 |
| 6 | [Daily Planning: confirm-plan write order and navigation fallback](20260816-daily-planning-confirm-write-order.md) | 2026-08-16 |
| 7 | [Plan tab's day/step: lifted state, and not reset on re-tap](20260816-plan-tab-state-lifted-not-reset-on-retap.md) | 2026-08-16 |
| 8 | [Daily Planning: allow scheduling an assignment without a Work Breakdown](20260816-plan-directly-without-breakdown.md) | 2026-08-16 |
| 9 | [Today Execution: interim entry point before Home Dashboard exists](20260816-today-execution-interim-entry-point.md) | 2026-08-16 |
| 10 | [Assignment Detail becomes a global overlay owned by App.tsx](20260817-assignment-detail-global-overlay.md) | 2026-08-17 |
| 11 | [Remove the Undo-window soft-delete; confirm before every delete instead](20260817-remove-undo-delete.md) | 2026-08-17 |
| 12 | [Coming Up shows Needs Attention's assignment(s) instead of hiding them](20260817-coming-up-shows-attention-items.md) | 2026-08-17 |
| 13 | [Assignment Detail regains inline Work Item add/edit/delete, superseding the single-entry-point design](20260818-inline-work-item-management.md) | 2026-08-18 |
| 14 | [Plan's Day step is removed; its content folds into Select](20260818-plan-day-step-removed.md) | 2026-08-18 |
| 15 | [Dashboard mode toggle replaced by real, RLS-enforced access](20260819-dashboard-mode-toggle-replaced-by-real-access.md) | 2026-08-19 |
| 16 | [Architecture refactor: audit findings and completed refactor](20260911-architecture-refactor-proposal.md) | 2026-09-11 |
| 17 | [Page complexity reduction: audit findings and completed refactor](20260912-page-complexity-reduction-proposal.md) | 2026-09-12 |
| 18 | [Build a PWA in two phases: installable now, offline after prototype parity](20260924-pwa-in-two-phases.md) | 2026-09-24 |
| 19 | [Home's secondary screens become App-level overlays](20260924-secondary-screens-app-level-overlays.md) | 2026-09-24 |
| 20 | [Plan opens on the existing day's plan when one exists](20260925-existing-day-view.md) | 2026-09-25 |
| 21 | [Confirming a plan adds to the day; it no longer replaces it](20260925-confirm-plan-appends.md) | 2026-09-25 |
| 22 | [Reordering planned sessions: drag, re-chaining, and retiming](20260925-session-reorder-and-drag.md) | 2026-09-25 |
| 23 | [Separate Saturday and Sunday study hours, and no protected buffer](20260925-split-weekend-study-hours.md) | 2026-09-25 |
| 24 | [Course colour choice, and deleting a course with everything in it](20260925-course-colour-and-delete.md) | 2026-09-25 |
| 25 | [Plan opens for one assignment, with its work already chosen](20260925-plan-target.md) | 2026-09-25 |
| 26 | [Breakdown choices live on Assignment Detail; Plan lists every assignment](20260925-plan-rows-and-one-piece.md) | 2026-09-25 |
| 27 | [Execution coaching, part one: timing, revised estimates, and completion checks](20260925-execution-timing.md) | 2026-09-25 |
| 28 | [Light/dark choice: saved on the device, applied before the first paint](20260925-appearance-on-device.md) | 2026-09-25 |
| 29 | [PWA phase 2: how the app works offline and stays up to date](20260925-pwa-phase-2-approach.md) | 2026-09-25 |
| 30 | [Offline actions: a queue beside the offline plan, sent directly when online](20260926-offline-action-queue.md) | 2026-09-26 |
| 31 | [The prototype is no longer a reference](20260926-prototype-no-longer-a-reference.md) | 2026-09-26 |
| 32 | [Assignment Detail with no steps: one card, and planning that makes steps](20260926-assignment-detail-no-steps.md) | 2026-09-26 |
