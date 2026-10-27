import type { Metadata } from "next";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import ManualDocumentContent from "@/presentation/app_components/manual_document_content";
import {getTranslations} from "next-intl/server";
import {buildAlternates} from "@/i18n/alternates";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'General'});

  return {
    title: t('termsOfUse'),
    alternates: buildAlternates(locale, '/terms-of-use'),
  };
}

export default function TermsOfUse() {
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-8">
        <ManualDocumentContent folder="terms-of-use"/>
      </div>
      <AppFooter/>
    </main>
  );
}
