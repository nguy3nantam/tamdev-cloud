import { vi } from './vi';
import { en } from './en';

export type Locale = 'vi' | 'en';

export const ui: Record<Locale, typeof vi> = { vi, en };

export const locales: Locale[] = ['vi', 'en'];

export const defaultLocale: Locale = 'vi';

export function getLocaleFromUrl(pathname: string): Locale {
  return pathname.startsWith('/en') ? 'en' : 'vi';
}

export function localizedPath(path: string, locale: Locale): string {
  if (locale === 'vi') return path;
  return `/en${path === '/' ? '' : path}`;
}

export function switchToPath(pathname: string, locale: Locale): string {
  if (locale === 'vi') {
    return `/en${pathname === '/' ? '' : pathname}`;
  }
  return pathname.replace(/^\/en/, '') || '/';
}
