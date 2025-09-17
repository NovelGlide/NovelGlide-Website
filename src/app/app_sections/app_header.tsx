import Image from "next/image";
import Link from "next/link";
import { FaGooglePlay } from "react-icons/fa6";
import { FaApple } from "react-icons/fa6";
import {useTranslations} from 'next-intl';

export default function AppHeader() {
  const t = useTranslations('AppHeader');
  return (
    <header className="p-8 w-full flex items-center">
      <div className="flex-2 pr-8">
        <h2 className="font-bold text-2xl md:text-4xl">
          {t('title')}
        </h2>
        <h3 className="mt-4 font-bold text-xl md:text-2xl">
          {t('subtitle')}
        </h3>
        <p className="mt-8">
          {t('description')}
        </p>
        <p className="mt-8 flex items-center justify-evenly flex-wrap">
          <Link
            href="https://play.google.com/store/apps/details?id=com.kai_wu.novelglide"
            className="
              flex
              items-center
              m-2
              p-4
              rounded-3xl
              font-bold
              text-lg
              md:text-xl
              bg-zinc-800
              text-stone-50
              hover:bg-sky-500
              hover:text-amber-50
              transition-all
              duration-300
              ease-in-out
            "
          >
            <FaGooglePlay className="mr-4"/>
            Play Store
          </Link>
          <Link
            href="https://apps.apple.com/tw/app/novelglide/id6748090356"
            className="
              flex
              items-center
              m-2
              p-4
              rounded-3xl
              font-bold
              text-lg
              md:text-xl
              bg-zinc-800
              text-stone-50
              hover:bg-sky-500
              hover:text-amber-50
              transition-all
              duration-300
              ease-in-out
            "
          >
            <FaApple className="mr-4" size="24"/>
            App Store
          </Link>
        </p>
      </div>
      <div className="flex-1">
        <Image
          className="w-full h-full border-4 shadow-xl rounded-4xl object-contain"
          src="/images/screenshots_en-US.png"
          alt="NovelGlide Screenshot"
          width={0}
          height={0}
          sizes="100vw"
        />
      </div>
    </header>
  );
}