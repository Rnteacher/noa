import he from '@/i18n/he.json';

export type TranslationKey = keyof typeof he;

/**
 * Translates a key using the primary Hebrew dictionary.
 * Includes support for simple template placeholder replacement.
 */
export function t(key: TranslationKey | string, placeholders?: Record<string, string>): string {
  const dictionary = he as Record<string, string>;
  const value = dictionary[key] || key;

  if (placeholders) {
    let result = value;
    for (const [k, v] of Object.entries(placeholders)) {
      result = result.replace(`{${k}}`, v);
    }
    return result;
  }

  return value;
}
