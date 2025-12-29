import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import React from "react";
import { getLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | NovelGlide', // %s will be replaced by the page-specific title
    default: 'NovelGlide', // Fallback title for pages without a specific title
  },
  description: "Your personal e-book reader and library manager.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="p-4 sm:p-8 scroll-smooth bg-stone-100 text-stone-800">
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
