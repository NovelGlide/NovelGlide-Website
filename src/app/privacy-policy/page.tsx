import AppFooter from "@/presentation/app_components/app_footer";
import AppNav from "@/presentation/app_components/app_nav";
import PrivacyPolicyContent from "./privacy_policy_content";

export default function Home() {
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl">
      <AppNav/>
      <div className="my-8">
        <PrivacyPolicyContent />
      </div>
      <AppFooter/>
    </main>
  );
}