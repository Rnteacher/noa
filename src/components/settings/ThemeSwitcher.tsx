'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { THEME_COOKIE, THEME_IDS, type ThemeId } from '@/lib/theme';
import { t } from '@/lib/i18n';

const SWATCH_COLOR: Record<ThemeId, string> = {
  light: '#0a84ff',
  dark: '#409cff',
  warm: '#e0703f',
  violet: '#7c5cff',
};

const THEME_LABEL_KEY: Record<ThemeId, string> = {
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
  warm: 'settings.theme.warm',
  violet: 'settings.theme.violet',
};

function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Theme-picker card plus the theme-appropriate logo beneath it (Settings
 * tab). Both live in one client component so the logo swaps immediately
 * when a swatch is tapped, without waiting for a page reload.
 */
export function ThemeSwitcher({ initialTheme }: { initialTheme: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initialTheme);

  return (
    <>
      <div className="chm-card-shadow flex justify-between rounded-[18px] bg-surface-raised p-4">
        {THEME_IDS.map((id) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTheme(id);
                applyTheme(id);
              }}
              aria-pressed={isActive}
              className="flex flex-col items-center gap-2 bg-transparent text-ink"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: SWATCH_COLOR[id],
                  boxShadow: isActive
                    ? `0 0 0 3px var(--surface-raised), 0 0 0 5px ${SWATCH_COLOR[id]}`
                    : 'none',
                }}
              >
                {isActive ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-white" strokeWidth={3} />
                ) : null}
              </span>
              <span className="text-xs font-semibold text-ink-secondary">
                {t(THEME_LABEL_KEY[id])}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pb-1.5 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo; next/image blocks SVG by default */}
        <img
          src={theme === 'dark' ? '/logo-light-text.svg' : '/logo-dark-text.svg'}
          alt={t('settings.logoAlt')}
          className="h-[22px] w-auto opacity-55"
        />
      </div>
    </>
  );
}
