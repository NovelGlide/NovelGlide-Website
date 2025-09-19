import NavLink from "./nav-link";
import { useTranslations } from "next-intl";

export default function AppFooter() {
  const t = useTranslations('General');
  const tLocale = useTranslations('Locales');

  return (
    <footer className="py-8 text-center">
      <div className="flex justify-center flex-wrap gap-4 text-sm text-zinc-600 hover:text-underline">
        <NavLink href="/locale" exact aria-label={tLocale('title')}>
          {tLocale('title')}
        </NavLink>
        <NavLink
          href="/privacy-policy"
          exact
          aria-label={t('privacyPolicy')}
        >
          {t('privacyPolicy')}
        </NavLink>
      </div>
      <p className="mt-4 text-sm text-zinc-600">
        &copy; 2025 NovelGlide. All rights reserved.
      </p>
    </footer>
  );
}