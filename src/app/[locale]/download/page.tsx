import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import QRCode from "qrcode";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import StoreButtons from "@/presentation/app_components/store_buttons";
import {routing} from "@/i18n/routing";
import {buildAlternates, localizedPath} from "@/i18n/alternates";
import {SITE_URL} from "@/config/site";

type Props = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Download"});
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: buildAlternates(locale, "/download"),
  };
}

export default async function DownloadPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Download"});

  // Encodes this page's own absolute URL so a desktop visitor can jump to their
  // phone and pick their store. Generated locally by `qrcode` — no external QR
  // service is ever contacted. Shown only on >=md (a phone needn't scan itself).
  const downloadUrl = `${SITE_URL}${localizedPath(locale, "/download")}`;
  const qrSvg = await QRCode.toString(downloadUrl, {
    type: "svg",
    margin: 1,
    color: {dark: "#1c1917", light: "#00000000"},
  });

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-16 flex flex-col items-center gap-8 text-center">
        <div>
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <p className="mt-3 text-stone-600">{t("subtitle")}</p>
        </div>

        <StoreButtons campaign="download-cta"/>

        <div className="mt-4 hidden flex-col items-center gap-3 md:flex">
          <div
            className="h-40 w-40 [&>svg]:h-full [&>svg]:w-full"
            aria-hidden="true"
            dangerouslySetInnerHTML={{__html: qrSvg}}
          />
          <p className="max-w-xs text-sm text-stone-500">{t("qrHint")}</p>
        </div>
      </div>
      <AppFooter/>
    </main>
  );
}
