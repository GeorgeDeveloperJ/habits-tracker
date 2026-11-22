import { spanish } from './catalog.ts';

export type Language = 'en' | 'es';
export type Message = keyof typeof spanish;
type Value = string | number;

export function detectLanguage(browserLocale?: string): Language {
  return browserLocale?.split('-')[0].toLowerCase() === 'es' ? 'es' : 'en';
}

function isMessage(value: string): value is Message {
  return Object.hasOwn(spanish, value);
}

function buildTranslator(language: Language) {
  return (message: Message, ...values: Value[]) => {
    const template = language === 'es' ? spanish[message] : message;
    if (values.length === 0) return template;
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
      values[Number(index)] === undefined ? placeholder : String(values[Number(index)])
    );
  };
}

const translators = {
  en: buildTranslator('en'),
  es: buildTranslator('es'),
} as const;

export function createTranslator(language: Language) {
  return translators[language];
}

export function translateFeedback(language: Language, message: string, ...values: Value[]) {
  return translators[language](
    isMessage(message) ? message : 'Something went wrong. Please try again.',
    ...values
  );
}

export function translatePillarText(language: Language, text: string) {
  return isMessage(text) ? translators[language](text) : text;
}
