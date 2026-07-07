# Chamama Staff App — Project Docs

This documentation package is the initial source of truth for the Chamama staff-only web app.

The project should be built as a mobile-first PWA for staff and a desktop-first admin interface for management. The selected stack is:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Supabase local development first, Supabase Cloud later
- PostgreSQL with Row Level Security
- Supabase Auth with Google OAuth restricted to the institutional Google domain
- Supabase Storage for student photos
- Web Push / FCM-compatible push architecture for mobile notifications

## Core rule

No Hebrew text is allowed in source code, JSX, database seed labels, comments, component names, variable names, or migration comments.

Hebrew UI text must live only in dedicated language resource files, for example:

- `src/i18n/he.json`
- `src/i18n/en.json`

## Recommended reading order

1. `docs/00_PROJECT_BRIEF.md`
2. `docs/01_PRODUCT_REQUIREMENTS.md`
3. `docs/02_TECH_STACK_AND_ARCHITECTURE.md`
4. `docs/03_DATA_MODEL_DRAFT.md`
5. `docs/04_RBAC_MATRIX.md`
6. `docs/05_AI_COLLABORATION_PROTOCOL.md`
7. `docs/06_IMPLEMENTATION_BACKLOG.md`
8. `docs/07_LOCAL_SUPABASE_WORKFLOW.md`
9. `docs/08_I18N_AND_LANGUAGE_RULES.md`
10. `docs/09_API_AND_WEBHOOKS.md`
11. `docs/10_SECURITY_PRIVACY_AUDIT.md`
12. `docs/11_DECISION_LOG.md`
13. `docs/12_CURRENT_STATE.md`
14. `docs/13_TASK_TEMPLATE.md`

## AI model workflow

Use the three available models in parallel, but only through scoped tasks and updated docs:

- Claude: complex UX, interaction design, visual systems, difficult product questions.
- GPT: deep architecture, database design, backend logic, permissions, API, implementation plans.
- Gemini: fast implementation tasks, refactors, repetitive UI, docs cleanup, small utilities, first-pass scaffolding.

Every model must read the shared docs before making changes and must update the relevant documentation after finishing a task.
