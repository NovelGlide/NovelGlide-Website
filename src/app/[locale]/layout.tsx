import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/presentation/app_components/google_analytics";
import { JsonLd, organizationLd, websiteLd } from "@/presentation/app_components/json_ld";
import "../globals.css";
import React from "react";
import { routing } from "@/i18n/routing";
import { toBcp47 } from "@/i18n/alternates";
import { SITE_URL } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves relative alternates (canonical / hreflang) to absolute URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | NovelGlide', // %s will be replaced by the page-specific title
    default: 'NovelGlide', // Fallback title for pages without a specific title
  },
  description: "Your personal e-book reader and library manager.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html lang={toBcp47(locale)} className="p-4 sm:p-8 scroll-smooth bg-stone-100 text-stone-800">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
        `}
      >
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
