'use client';

import type { FrontendLocale } from '@/lib/frontendDataSource';

interface HandoffLanguageToggleProps {
  locale: FrontendLocale;
  onChange: (locale: FrontendLocale) => void;
}

const languages: { id: FrontendLocale; label: string; title: string }[] = [
  { id: 'ko', label: 'KO', title: '한국어' },
  { id: 'vi', label: 'VI', title: 'Tiếng Việt' },
  { id: 'en', label: 'EN', title: 'English' },
];

export function HandoffLanguageToggle({
  locale,
  onChange,
}: HandoffLanguageToggleProps) {
  return (
    <div
      className="inline-flex min-h-10 items-center border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
      role="group"
      aria-label="Language"
    >
      {languages.map((language) => (
        <button
          key={language.id}
          type="button"
          title={language.title}
          aria-pressed={locale === language.id}
          onClick={() => onChange(language.id)}
          className={`min-h-8 min-w-10 px-2 text-[11px] font-black ${
            locale === language.id
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)]'
          }`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
