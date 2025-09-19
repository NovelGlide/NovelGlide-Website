import HeaderSection from "@/app/app_sections/header_section";
import AppNav from "@/presentation/app_components/app_nav";
import FeatureSection from "@/app/app_sections/feature_section";
import AppFooter from "@/presentation/app_components/app_footer";

export default function Home() {
  return (
    <main className="block relative mx-auto min-h-screen max-w-3xl">
      <AppNav />
      <HeaderSection />
      <FeatureSection/>
      <AppFooter/>
    </main>
  );
}
