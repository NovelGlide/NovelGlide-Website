import {getRequestConfig} from 'next-intl/server';
import {headers} from "next/headers";
import {defaultLocale, supportedLocales} from "@/i18n/support_locales";

export default getRequestConfig(async () => {
  // Get locale from various sources
  const locale = await detectLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

async function detectLocale(): Promise<string> {
  const headersList = await headers();

  // Strategy 1: Check cookie
  const cookieStore = headersList.get('cookie');
  const localeCookie = cookieStore
    ?.split(';')
    .find(c => c.trim().startsWith('locale='))
    ?.split('=')[1];

  if (localeCookie && supportedLocales.includes(localeCookie)) {
    return localeCookie;
  }

  // Strategy 2: Check Accept-Language header
  const acceptLanguage = headersList.get('Accept-Language');

  if (acceptLanguage) {
    // Parse Accept-Language header
    const preferredLocale = parseAcceptLanguage(acceptLanguage, supportedLocales);
    if (preferredLocale) return preferredLocale;
  }

  return defaultLocale;
}

function parseAcceptLanguage(acceptLanguage: string, supportedLocales: string[]): string | null {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return {code: code.toLowerCase(), quality: parseFloat(q)};
    })
    .sort((a, b) => b.quality - a.quality);

  for (const {code} of languages) {
    // Check exact match
    if (supportedLocales.includes(code)) {
      return code;
    }

    // Check language part (e.g., 'en' from 'en-US')
    const langPart = code.split('-')[0];
    if (supportedLocales.includes(langPart)) {
      return langPart;
    }
  }

  return null;
}