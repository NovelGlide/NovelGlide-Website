import SupportedLocales from '@/i18n/support_locales';

export default function changeLocale(newLocale: SupportedLocales) {
  // Set cookie
  document.cookie = `locale=${newLocale}; max-age=${365 * 24 * 60 * 60}; path=/`;
}