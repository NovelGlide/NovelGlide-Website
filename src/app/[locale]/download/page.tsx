import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import QRCode from "qrcode";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import StoreButtons, {
  APP_STORE_URL,
  playUrl,
} from "@/presentation/app_components/store_buttons";
import {routing} from "@/i18n/routing";
import {buildAlternates} from "@/i18n/alternates";

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

// QR generated locally by `qrcode` — no external QR service is ever contacted.
function qr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: {dark: "#1c1917", light: "#00000000"},
  });
}

export default async function DownloadPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Download"});

  // One QR per store, each straight to that store's listing — a desktop visitor
  // scans the one for their phone. (Shown only on >=md; a phone needn't scan
  // itself.) `download-qr` distinguishes desktop-scan installs in Play Console.
  const [qrAppStore, qrPlay] = await Promise.all([
    qr(APP_STORE_URL),
    qr(playUrl("download-qr")),
  ]);

  const codes = [
    {label: "App Store", svg: qrAppStore},
    {label: "Google Play", svg: qrPlay},
  ];

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
          <div className="flex gap-8">
            {codes.map((code) => (
              <figure
                key={code.label}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="h-36 w-36 [&>svg]:h-full [&>svg]:w-full"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{__html: code.svg}}
                />
                <figcaption className="text-sm text-stone-600">
                  {code.label}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="max-w-xs text-sm text-stone-500">{t("qrHint")}</p>
        </div>
      </div>
      <AppFooter/>
    </main>
  );
}
