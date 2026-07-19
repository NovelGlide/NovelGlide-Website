import type { Metadata } from "next";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import PrivacyPolicyContent from "./privacy_policy_content";
import {getTranslations} from "next-intl/server";
import {buildAlternates} from "@/i18n/alternates";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'General'}); // Load translations for metadata

  return {
    title: t('privacyPolicy'),
    alternates: buildAlternates(locale, '/privacy-policy'),
  };
}

export default function Home() {
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-8">
        <PrivacyPolicyContent/>
      </div>
      <AppFooter/>
    </main>
  );
}
