export const THEME_IDS = ['light', 'dark', 'warm', 'violet'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = 'light';

export const THEME_COOKIE = 'chm-theme';

export function isThemeId(value: string | undefined | null): value is ThemeId {
  return !!value && (THEME_IDS as readonly string[]).includes(value);
}
