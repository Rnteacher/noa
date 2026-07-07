# 05 — AI Collaboration Protocol

## Goal

Enable parallel work with Claude, GPT, and Gemini while keeping the project coherent and synchronized.

## Model responsibilities

### Claude

Use Claude for:

- Complex UX flows.
- Mobile-first design systems.
- Admin interface design.
- Interaction design for calendars, gantt, and learning group schedule.
- Visual hierarchy.
- Component architecture when design complexity is high.
- Product wording in English docs, not Hebrew UI copy unless editing language files only.

### GPT

Use GPT for:

- Deep architecture.
- Database modelling.
- RLS and permission strategy.
- Backend logic.
- API and webhook design.
- Implementation planning.
- Complex debugging.
- Reviewing cross-model conflicts.

### Gemini

Use Gemini for:

- Fast scaffolding.
- Repetitive implementation.
- Simple UI components from existing patterns.
- Refactors with narrow scope.
- Test generation.
- Documentation cleanup.
- Simple migrations after schema decisions are approved.

Gemini can work quickly, but it should receive very specific tasks with clear acceptance criteria.

## Source of truth

The docs directory is the source of truth.

Every model must read the relevant docs before starting:

- Always: `README.md`, `docs/12_CURRENT_STATE.md`, and this file.
- Product tasks: `docs/01_PRODUCT_REQUIREMENTS.md`.
- Architecture tasks: `docs/02_TECH_STACK_AND_ARCHITECTURE.md`.
- Database tasks: `docs/03_DATA_MODEL_DRAFT.md` and `docs/04_RBAC_MATRIX.md`.
- Language/UI tasks: `docs/08_I18N_AND_LANGUAGE_RULES.md`.

## Branching strategy

Use separate branches for model work:

- `ai/claude/<task-id>-<short-name>`
- `ai/gpt/<task-id>-<short-name>`
- `ai/gemini/<task-id>-<short-name>`

Avoid assigning overlapping files to multiple models at the same time.

## Task format

Every task must have:

- Task id.
- Model owner.
- Goal.
- Files allowed to edit.
- Files not allowed to edit.
- Context docs to read.
- Acceptance criteria.
- Required tests/checks.
- Required documentation updates.

Use `docs/13_TASK_TEMPLATE.md`.

## Handoff requirements

At the end of every task, the model must produce a handoff note containing:

- Summary of changes.
- Files changed.
- Decisions made.
- Open questions.
- Tests run.
- Known risks.
- Recommended next task.

Use `docs/prompts/HANDOFF_TEMPLATE.md`.

## Documentation update rule

Any task that changes behavior must update at least one of:

- `docs/12_CURRENT_STATE.md`
- `docs/11_DECISION_LOG.md`
- A feature-specific doc.

Do not allow silent architectural drift.

## Conflict prevention

Before assigning parallel tasks:

1. Split by feature area.
2. Assign non-overlapping files.
3. Give each model a clear stop condition.
4. Require a final handoff.
5. Merge only after reading the handoff.

## Review order

Recommended review flow:

1. Gemini performs fast draft/scaffold tasks.
2. GPT reviews logic, data, and permissions.
3. Claude improves UX and visual quality.
4. GPT performs final integration review when the change touches data or permissions.

## Hard rules for every model

- Do not write Hebrew in source code, JSX, comments, route names, table names, seed labels, or component names.
- Hebrew text may only be added to language resource files.
- Do not change the tech stack without an explicit decision log entry.
- Do not create new permissions without updating the RBAC doc.
- Do not create new tables without updating the data model doc.
- Do not add a dependency without explaining why.
- Do not bypass RLS for normal user actions.
- Do not put sensitive student details in push payloads.
