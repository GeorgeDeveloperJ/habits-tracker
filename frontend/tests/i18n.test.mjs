import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTranslator, detectLanguage } from '../src/i18n/messages.ts';

test('selects Spanish for Spanish browser locales and defaults to English', () => {
  assert.equal(detectLanguage('es-DO'), 'es');
  assert.equal(detectLanguage('en-US'), 'en');
  assert.equal(detectLanguage('fr'), 'en');
  assert.equal(detectLanguage(), 'en');
});

test('uses the selected language and interpolates values', () => {
  assert.equal(createTranslator('en')('Day {0}', '07'), 'Day 07');
  assert.equal(createTranslator('es')('Day {0}', '07'), 'Día 07');
});

test('translates known feedback and falls back for unexpected server messages', async () => {
  const { translateFeedback } = await import('../src/i18n/messages.ts');
  assert.equal(translateFeedback('es', 'Invalid credentials'), 'Correo electrónico o contraseña incorrectos.');
  assert.equal(translateFeedback('es', 'Unexpected server detail'), 'Ocurrió un error. Inténtalo de nuevo.');
});

test('persists a manual choice and applies it when a new session loads', async () => {
  const storage = new Map();
  Object.defineProperties(globalThis, {
    localStorage: {
      configurable: true,
      value: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
    },
    document: { configurable: true, value: { documentElement: {} } },
    navigator: { configurable: true, value: { language: 'es-DO' } },
  });

  const { useLanguageStore } = await import('../src/i18n/useLanguage.ts');
  assert.equal(useLanguageStore.getState().language, 'es');
  assert.equal(document.documentElement.lang, 'es');
  useLanguageStore.getState().setLanguage('en');
  const { useLanguageStore: reopened } = await import('../src/i18n/useLanguage.ts?reload');
  assert.equal(reopened.getState().language, 'en');
  assert.equal(document.documentElement.lang, 'en');
});
