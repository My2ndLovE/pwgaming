import { useTranslation as useTranslationNext } from 'next-i18next';

export function useTranslation(ns: string = 'common') {
  return useTranslationNext(ns);
}

interface TranslationOptions {
  [key: string]: string | number | boolean;
}

export function t(key: string, options?: TranslationOptions): string {
  // Fallback for non-hook contexts
  return key;
}
