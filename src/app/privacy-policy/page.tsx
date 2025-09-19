import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import PrivacyPolicyContent from "./privacy_policy_content";
import {useTranslations} from "next-intl";
import Head from "next/head";
import {getTranslations} from "next-intl/server";

type Props = {
  params: {
    locale: string,
  }
}

export async function generateMetadata(params: Props): Promise<object> {
  const {locale} = params.params;
  const t = await getTranslations({locale, namespace: 'General'}); // Load translations for metadata

  return {
    title: t('privacyPolicy'),
  };
}

export default function Home() {
  const t = useTranslations("General");

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <Head>
        <title>
          {t("privacyPolicy")}
        </title>
      </Head>
      <AppNav/>
      <div className="my-8">
        <PrivacyPolicyContent/>
      </div>
      <AppFooter/>
    </main>
  );
}