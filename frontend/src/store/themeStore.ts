import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(next);
        set({ theme: next });
      },
    }),
    {
      name: 'proactive31-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);
