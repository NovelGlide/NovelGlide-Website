import {getRequestConfig} from 'next-intl/server';
import {headers} from "next/headers";

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

  // Strategy 1: Check Accept-Language header
  const acceptLanguage = headersList.get('Accept-Language');

  // Strategy 2: Check custom header (if you set one)
  const customLocale = headersList.get('X-Locale');

  // Define your supported locales
  const supportedLocales = ['en', 'zh-tw', 'zh-cn', 'ja'];
  const defaultLocale = supportedLocales[0];

  // Priority order: custom header > cookie > accept-language > default
  if (customLocale && supportedLocales.includes(customLocale)) {
    return customLocale;
  }

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