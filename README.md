# OneStepBeyond

A mobile-first React + TypeScript + Vite + Supabase application.

See `CLAUDE.md` for the full development process (workflow, engineering
standards, UI quality bar, and Claude Code tooling) this project follows.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project's URL and anon key
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run ESLint
- `npm run test` — run Vitest in watch mode
- `npm run test:run` — run Vitest once
- `npm run test:coverage` — run Vitest with coverage
- `npx playwright test` — run the Playwright persona/e2e smoke checks (see `synthetic/README.md`)

## Project layout

```
src/
├── hooks/       # React hooks (e.g. useAuth)
├── lib/         # Centralized external clients (e.g. Supabase)
├── pages/       # Top-level route/page components
└── test/        # Vitest setup

tests/           # Playwright specs (persona smoke checks, auth setup)
synthetic/       # Synthetic persona assessment framework (see synthetic/README.md)
docs/
├── decisions/   # Architecture Decision Records
└── features/    # Feature specifications (create as needed)
templates/       # Reusable doc templates (requirements, accessibility audit)
.claude/         # Project-level Claude Code skills and agents
```

## Platform direction

Built mobile-first as a responsive web app. A PWA and/or a Capacitor-wrapped
native shell are possible future directions, not implemented yet — see
`CLAUDE.md`'s "You Aren't Going to Need It" section. Add that tooling as a
deliberate increment, with a decision record, when it's actually needed.
