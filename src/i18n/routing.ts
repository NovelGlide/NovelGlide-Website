import {defineRouting} from 'next-intl/routing';
import {defaultLocale, supportedLocales} from '@/i18n/support_locales';

// Single source of truth for locale routing. Locales + default locale come
// from support_locales.ts. `as-needed` keeps the default locale (en) prefix-free
// so /privacy-policy, /locale and / stay valid for en (the app store's privacy
// URL points at the un-prefixed en path and must keep working without a redirect).
export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: 'as-needed',
});
