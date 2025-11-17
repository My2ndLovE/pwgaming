import { useTranslation as useTranslationNext } from 'next-i18next';

export function useTranslation(ns: string = 'common') {
  return useTranslationNext(ns);
}

export function t(key: string, options?: any): string {
  // Fallback for non-hook contexts
  return key;
}
