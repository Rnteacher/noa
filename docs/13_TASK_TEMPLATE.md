# 13 — AI Task Template

Use this template for every task given to Claude, GPT, or Gemini.

```md
# Task <TASK-ID> — <Short title>

## Model

<Claude | GPT | Gemini>

## Goal

<One clear goal.>

## Context docs to read first

- README.md
- docs/12_CURRENT_STATE.md
- <additional relevant docs>

## Files allowed to edit

- <path>
- <path>

## Files not allowed to edit

- <path>
- <path>

## Requirements

- <requirement>
- <requirement>

## Acceptance criteria

- <criterion>
- <criterion>

## Tests/checks to run

```bash
<pnpm command>
```

## Documentation updates required

- <doc path>

## Important rules

- No Hebrew in source code, JSX, comments, file names, variable names, database names, seed labels, or tests.
- Hebrew may only be added to language files under `src/i18n/`.
- Do not change the tech stack.
- Do not add dependencies without explaining why.
- Do not bypass permissions or RLS.
- Do not include sensitive student details in push payloads.

## Handoff format

Use `docs/prompts/HANDOFF_TEMPLATE.md`.
```
