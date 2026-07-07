# 08 — i18n and Language Rules

## Hard rule

No Hebrew is allowed in source code outside dedicated language resource files.

This includes:

- JSX text.
- Component names.
- Variable names.
- Function names.
- Route segments.
- File names.
- Comments.
- Database table names.
- Database column names.
- Migration comments.
- Seed labels.
- Test descriptions.

## Allowed Hebrew locations

Hebrew is allowed only in:

- `src/i18n/he.json`
- Future dedicated translation files under `src/i18n/`
- External content imported into the database by authorized app flows

## Recommended translation structure

```txt
src/i18n/
  he.json
  en.json
```

Example keys:

```json
{
  "common.save": "...",
  "common.cancel": "...",
  "dashboard.title": "...",
  "studentCard.projectStatus.green": "..."
}
```

## UI direction

The Hebrew UI should be right-to-left.

Direction must be controlled by app configuration, not by hardcoded Hebrew in components.

## Component rule

Bad:

```tsx
<button>שמירה</button>
```

Good:

```tsx
<button>{t("common.save")}</button>
```

## Comments rule

Comments must be English only.

Bad:

```ts
// בדיקה אם המשתמש מנהל
```

Good:

```ts
// Check whether the user has admin permissions.
```

## Database labels

Do not store Hebrew enum values.

Bad:

```txt
ירוק
צהוב
אדום
```

Good:

```txt
green
yellow
red
```

Display values should come from translation keys.

## Suggested automated check

Add a script that scans source files and fails if Hebrew characters appear outside allowed paths.

Allowed paths:

- `src/i18n/he.json`
- `examples/i18n/he.json`

Possible script name:

```bash
pnpm check:no-hebrew-in-code
```

## Date and time formatting

Use a centralized date formatting utility.

Requirements:

- Hebrew UI.
- Israel timezone by default.
- School-day context.
- Avoid duplicating formatting logic inside components.
