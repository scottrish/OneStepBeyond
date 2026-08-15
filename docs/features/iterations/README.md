# Derived Iteration Specs

Files under `docs/features/iterations/<feature-slug>/` are **generated
output** of the experimental process defined in
`docs/iterative-development-playwright-process.md` and run by the
`run-iterative-playwright-development` skill — not hand-authored feature
specs.

They are named `<feature-slug>.i<NN>.md`, each carrying frontmatter that
identifies its parent:

```yaml
---
feature: <feature-slug>
iteration: <N>
derived_from: <parent spec path>
playwright_evidence: docs/playwright/<feature-slug>/iteration-<NN>/
---
```

Do not confuse these with the canonical specs in `docs/features/*.md`.
CLAUDE.md's "read only the feature specification referenced by the current
task" rule refers to those canonical specs, not iteration drafts here.
Iteration 1 of an experiment is always derived from a canonical spec in
`docs/features/`; iterations 2–3 are derived from the previous iteration
file in this directory.

See `docs/Roadmap.md` for which canonical feature specs exist and their
priority order.
