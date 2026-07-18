'use client';

import SupportedLocales from "@/i18n/support_locales";
import {usePathname, useRouter} from "@/i18n/navigation";

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
  const pathname = usePathname();
  const isActive = currentTranslation === originalTranslation;

  return (
    <button
      className="
        flex
        flex-col
        items-center
        justify-center
        w-40
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
        box-border
      "
      onClick={() => {
        // Switch locale by navigating to the same path under the target locale.
        // next-intl's usePathname returns the locale-agnostic path, so this keeps
        // the user on the current page while changing the language prefix.
        router.replace(pathname, {locale});
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
