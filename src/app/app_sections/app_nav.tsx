import Image from "next/image";
import NavLink from "@/app/app_sections/components/nav-link";
import {Languages} from "lucide-react";
import {useTranslations} from 'next-intl';

export default function AppNav() {
  const tLocale = useTranslations('Locales');

  return (
    <nav className="flex justify-between items-center mb-8">
      <div
        className="
          flex
          items-center
          space-x-4
        "
      >
        <Image
          className="
            w-8
            h-8
            sm:w-12
            sm:h-12
            rounded-lg
            sm:rounded-xl
          "
          src="/images/app_icon.png"
          alt="NovelGlide Logo"
          width={48}
          height={48}
          sizes="32px 48px"
        />
        <h1 className="text-xl font-bold">
          <NavLink href="/" activeClassName="" exact>
            NovelGlide
          </NavLink>
        </h1>
      </div>
      <ul
        className="flex gap-4"
      >
        <li>
          <NavLink href="/locale" exact aria-label={tLocale('title')}>
            <Languages/>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
