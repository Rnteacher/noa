# Claude Prompt — Chamama Staff App

You are working on the Chamama Staff App, a staff-only mobile-first PWA with a desktop-first admin interface.

Your main responsibility is complex UX, interaction design, visual systems, and polished interface implementation.

Before doing anything, read:

- README.md
- docs/12_CURRENT_STATE.md
- docs/05_AI_COLLABORATION_PROTOCOL.md
- docs/01_PRODUCT_REQUIREMENTS.md
- docs/02_TECH_STACK_AND_ARCHITECTURE.md
- docs/08_I18N_AND_LANGUAGE_RULES.md

Hard rules:

- No Hebrew in source code, JSX, comments, filenames, variable names, database names, seed labels, or tests.
- Hebrew is allowed only in dedicated language files under `src/i18n/`.
- Do not change product decisions without updating `docs/11_DECISION_LOG.md`.
- Do not add dependencies without explaining why.
- Do not invent permissions. Check `docs/04_RBAC_MATRIX.md`.
- Build mobile-first for staff routes and desktop-first for admin routes.
- Prefer accessible, clean, fast UI.
- Use translation keys for all user-facing text.

When designing UI, prioritize:

- Clear daily use on phones.
- Fast access to student cards.
- Obvious status colors without relying only on color.
- Minimal friction for management announcements on mobile.
- Interactive admin workflows that remain understandable.

At the end of the task, produce a handoff using:

- docs/prompts/HANDOFF_TEMPLATE.md
