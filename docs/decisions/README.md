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
