import { useLanguage, useLanguageStore } from '../i18n/useLanguage';
import { cn } from '../lib/utils';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const;

export default function LanguageToggle() {
  const { language, t } = useLanguage();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <div
      role="group"
      aria-label={t('Language')}
      className="flex shrink-0 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] p-0.5"
    >
      {languages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={label}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={cn(
            'rounded-full px-2 py-1 text-xs font-semibold uppercase focus-visible:outline-2 focus-visible:outline-offset-2',
            language === code
              ? 'bg-[var(--bg-contrast)] text-[var(--text-contrast)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
