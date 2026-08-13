---
name: generate-ddd-documentation
description: Generate Domain-Driven Design documentation for this application — bounded context map, aggregates/entities, ubiquitous language glossary, key workflows — with validated Mermaid diagrams.
---

# Generate DDD Documentation

## Purpose

Produce a Domain-Driven Design description of *this application as actually
implemented*. This is a read-only documentation task — do not modify any
application code or migrations.

The value of this document comes from being concrete and grounded in the
real schema and code — not from restating aspirational structure. A DDD doc
that describes concepts the codebase doesn't actually have isn't useful;
don't write one.

## Scope

Before starting, determine the application's actual scope from the codebase
(which tables/features exist) rather than from any aspirational plan. Read
`docs/project-requirements.md` if it exists, for the intended scope, but
ground every claim in what's actually implemented. If scope is ambiguous,
ask the user whether to cover the whole application or a specific area.

## Workflow

1. Read `CLAUDE.md`.
2. Inventory the actual codebase:
   - Every table defined across `supabase/migrations/*.sql` (read migrations
     in chronological order — schema is cumulative, not per-file), including
     key columns, CHECK constraints, foreign keys, and RLS policies that
     reveal business rules.
   - Every `src/features/*` (or equivalent) folder: its `domain/*` pure
     logic modules, `services/*` data-access modules, and the shape of its
     core types.
   - Any substantial cross-cutting domain algorithm (a scheduler, a
     ranking engine, a state-machine-like workflow) worth describing on
     its own.
   - Whether there's any Role/Permission type, or whether authorization is
     realized purely as scoped membership rows + RLS.
   This step is a large, mostly-mechanical inventory — if the codebase is
   non-trivial, delegate it to an Explore (or general-purpose) agent with a
   specific, structured request (schema by table, feature folders with
   their domain/service files summarized one line each, key type shapes,
   and named algorithms to summarize) rather than doing it inline.
3. Write the document (see Structure, below).
4. Extract every Mermaid diagram and validate it renders (see Validating
   Diagrams, below) before finishing.

## Structure

Produce a single markdown file (ask the user for the path if not specified;
`docs/domain-driven-design.md` is a reasonable default) with:

1. **Scope** — which parts of the application this document covers.
2. **Bounded Context Map** — a Mermaid flowchart of the application's
   bounded contexts (or feature areas, if the app is small enough that
   formal bounded contexts don't yet exist) and their relationships.
3. **Ubiquitous Language** — a table mapping each domain term to its
   concrete representation in this codebase (a table, a type, or a note
   that it's implicit/not yet named in code).
4. **Aggregates and Entities** — a Mermaid `erDiagram` of the actual schema,
   plus prose identifying the true aggregate root(s) and any
   value-object-like concepts (computed-not-persisted, or keyed by
   something other than a surrogate id).
5. **Per-context detail** — for each bounded context: its key
   types/tables, its invariants as actually enforced (triggers, CHECK
   constraints, RLS — not just what a spec says should be true), and a
   diagram where one clarifies more than prose would: a `stateDiagram-v2`
   for an entity's status lifecycle, a `flowchart` for an algorithm or
   decision process, a `sequenceDiagram` for a multi-step workflow.
6. **Domain Events** — a table of meaningful state transitions and how (or
   whether) each is realized as a persisted event or log entry. Most
   early-stage apps don't persist real domain events — say so plainly if
   that's the case, rather than implying they exist.
7. **Known Simplifications** — deliberate simplifications or deferrals
   made for this increment, each grounded in a specific file/table/decision
   record reference (see `docs/decisions/`), not a vague generalization.
8. **File Map** — bounded context → source folders → key tables, as a
   quick-reference table.

## Validating Diagrams

Mermaid syntax errors are easy to introduce and easy to miss by eye,
especially in `sequenceDiagram` blocks. Before finishing:

1. Extract every ` ```mermaid ` fenced block from the document into its own
   `.mmd` file (a short Python or shell script over the markdown is fine).
2. Render each with `npx --yes -p @mermaid-js/mermaid-cli mmdc -i
   diagram.mmd -o diagram.svg`. Fix any that error, then re-render.
3. Known gotchas from doing this before:
   - **Flowcharts and `stateDiagram-v2`** tolerate a literal `\n` inside a
     quoted node label and render it as a line break — fine to use.
   - **`sequenceDiagram` does not.** A literal `\n` inside a message or
     Note causes a parse error (`Expecting ... got 'NEWLINE'`). Use `<br/>`
     instead for line breaks in sequence diagram messages/notes.
   - **A semicolon (`;`) inside a `sequenceDiagram` message is parsed as a
     statement separator**, not literal punctuation — it silently splits
     one message into two invalid statements and produces a confusing
     parse error pointing at the *next* line, not the semicolon itself. Use
     a comma, dash, or period instead.
4. Optionally render a couple of the more complex diagrams to PNG and view
   them (the Read tool can display images) to sanity-check layout, not just
   syntax validity — a diagram that parses but renders as an unreadable
   tangle should be simplified or split.
5. Clean up the temporary `.mmd`/`.svg`/`.png` files afterward; they're
   scratch artifacts, not deliverables.

## Restrictions

Do not modify any application code or migration. This skill only writes the
one documentation file.

## Completion

Report: the file path written, how many diagrams it contains (all
validated), and a short list of the most notable simplifications or
deferrals found.
