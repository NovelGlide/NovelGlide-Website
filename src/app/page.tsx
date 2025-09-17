import AppHeader from "@/app/app_sections/app_header";
import AppNav from "@/app/app_sections/app_nav";
import FeatureSection from "@/app/app_sections/feature_section";
import AppFooter from "@/app/app_sections/app_footer";

export default function Home() {
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav />
      <AppHeader />
      <FeatureSection/>
      <AppFooter/>
    </main>
  );
}
