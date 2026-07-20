import Image from "next/image";
import NavLink from "@/presentation/app_components/nav-link";
import {Languages, Newspaper} from "lucide-react";
import {useTranslations} from 'next-intl';

export default function AppNav() {
  const tBlog = useTranslations('Blog');
  const tLocale = useTranslations('Locales');
  const tDownload = useTranslations('Download');

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
          <NavLink href="/blog" aria-label={tBlog('nav')}>
            <Newspaper/>
          </NavLink>
        </li>
        <li>
          <NavLink href="/locale" exact aria-label={tLocale('title')}>
            <Languages/>
          </NavLink>
        </li>
        <li>
          <NavLink
            href="/download"
            exact
            className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold text-stone-50 transition-colors duration-300 ease-in-out hover:bg-sky-500 hover:text-amber-50"
            activeClassName="opacity-60 pointer-events-none"
          >
            {tDownload('nav')}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
