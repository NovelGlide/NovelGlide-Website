import Image from "next/image";
import NavLink from "@/app/app_sections/components/nav-link";
import {Globe, Languages} from "lucide-react";
import {useTranslations} from 'next-intl';

export default function AppNav() {
  const tLocale = useTranslations('AppHeader');

  return (
    <nav className="p-8 flex justify-between items-center">
      <div
        className="
          flex
          items-center
          space-x-4
        "
      >
        <Image
          className="rounded-xl"
          src="/images/app_icon.png"
          alt="NovelGlide Logo"
          width={48}
          height={48}
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
          <NavLink href="/locale" exact aria-label={tLocale('languages')}>
            <Languages/>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
