import SupportedLocales from "@/i18n/support_locales";
import {getTranslations} from "next-intl/server";
import ClientLocaleButton from "@/app/locale/components/client_locale_button";

export default async function LocaleButton({
                                       locale
                                     }: Readonly<{
  locale: SupportedLocales,
}>) {
  const currentTranslation = await getTranslations('Locales');
  const originTranslation = await import((`@/../messages/${locale}.json`));

  return (
    <ClientLocaleButton
      locale={locale}
      currentTranslation={currentTranslation(locale)}
      originalTranslation={originTranslation.Locales[locale]}
    />
  );
}