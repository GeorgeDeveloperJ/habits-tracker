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

export function createTranslator(language: Language) {
  return (message: Message, ...values: Value[]) => {
    const template = language === 'es' ? spanish[message] : message;
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
      values[Number(index)] === undefined ? placeholder : String(values[Number(index)])
    );
  };
}

export function translateFeedback(language: Language, message: string, ...values: Value[]) {
  return createTranslator(language)(
    isMessage(message) ? message : 'Something went wrong. Please try again.',
    ...values
  );
}

export function translatePillarText(language: Language, text: string) {
  return isMessage(text) ? createTranslator(language)(text) : text;
}
