import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createTranslator, detectLanguage, type Language } from './messages.ts';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

function applyLanguage(language: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.title = language === 'es'
    ? 'Kraken Habits | Registro de hábitos de 31 días'
    : 'Kraken Habits | Command Center';
}

const initialLanguage = detectLanguage(globalThis.navigator?.language);
applyLanguage(initialLanguage);

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: initialLanguage,
      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'proactive31-language',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ language }) => ({ language }),
      merge: (persisted, current) => {
        const language = (persisted as Partial<LanguageState> | null)?.language;
        return language === 'en' || language === 'es' ? { ...current, language } : current;
      },
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    }
  )
);

const translators = { en: createTranslator('en'), es: createTranslator('es') };

const percentFormats = {
  en: new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }),
  es: new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 1 }),
};

export function useLanguage() {
  const language = useLanguageStore((state) => state.language);
  return {
    language,
    locale: language === 'es' ? 'es' : 'en-US',
    t: translators[language],
    formatPercent: (value: number) => percentFormats[language].format(value / 100),
  };
}
