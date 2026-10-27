import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import ContactForm from "@/presentation/contact/contact_form";
import {buildAlternates} from "@/i18n/alternates";

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "General"});

  return {
    title: t("contactUs"),
    alternates: buildAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "General"});

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="mx-auto my-8 max-w-xl">
        <h2 className="mb-6 text-3xl font-bold">{t("contactUs")}</h2>
        <ContactForm/>
      </div>
      <AppFooter/>
    </main>
  );
}
