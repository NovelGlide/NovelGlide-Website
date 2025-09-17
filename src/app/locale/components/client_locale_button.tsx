'use client';

import SupportedLocales from "@/i18n/support_locales";
import changeLocale from "@/i18n/change_locale";
import {useRouter} from "next/navigation";

export default function ClientLocaleButton({
                                             locale,
  currentTranslation,
  originalTranslation,
                                           }: Readonly<{
  locale: SupportedLocales,
  currentTranslation: string,
  originalTranslation: string,
}>) {
  const router = useRouter();
  const isActive = currentTranslation === originalTranslation;

  return (
    <button
      className="
        flex
        flex-col
        items-center
        justify-center
        px-8
        py-4
        rounded-4xl
        bg-stone-200
        text-stone-800
        hover:bg-stone-800
        hover:text-stone-200
        disabled:bg-stone-800
        disabled:text-stone-200
        transition-all
        duration-300
        ease-in-out
        cursor-pointer
        disabled:cursor-default
      "
      onClick={() => {
        changeLocale(locale);
        router.refresh();
      }}
      disabled={isActive}
    >
      <span className="text-lg font-bold">
        {currentTranslation}
      </span>
      <span className="text-sm">
        {originalTranslation}
      </span>
    </button>
  );
}