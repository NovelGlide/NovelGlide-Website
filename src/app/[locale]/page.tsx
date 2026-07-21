import type { Metadata } from "next";
import HeaderSection from "@/app/app_sections/header_section";
import AppNav from "@/presentation/app_components/app_nav";
import FeatureSection from "@/app/app_sections/feature_section";
import AppFooter from "@/presentation/app_components/app_footer";
import { JsonLd, mobileAppLd } from "@/presentation/app_components/json_ld";
import { buildAlternates } from "@/i18n/alternates";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: buildAlternates(locale, ''),
  };
}

export default function Home() {
  return (
    <main className="block relative mx-auto min-h-screen max-w-3xl">
      <JsonLd data={mobileAppLd()} />
      <AppNav />
      <HeaderSection />
      <FeatureSection/>
      <AppFooter/>
    </main>
  );
}
