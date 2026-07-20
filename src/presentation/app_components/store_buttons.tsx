import {FaApple, FaGooglePlay} from "react-icons/fa6";

// Both store links, side by side — the robust "show both, let the user pick"
// pattern (no unreliable UA redirect, no third-party smart-link tracker). Reused
// on the home hero and the /download page so the URLs live in one place.
const APP_STORE_URL =
  "https://apps.apple.com/tw/app/novelglide/id6748090356";
const PLAY_BASE =
  "https://play.google.com/store/apps/details?id=com.kai_wu.novelglide";

// Google Play install-referrer carries UTM so nav/page-driven installs are
// attributable in Play Console (App Store uses App Analytics web referrers, so
// its link needs no tag). `campaign` distinguishes where the click came from.
function playUrl(campaign: string): string {
  const referrer = new URLSearchParams({
    utm_source: "website",
    utm_medium: "web",
    utm_campaign: campaign,
  }).toString();
  return `${PLAY_BASE}&referrer=${encodeURIComponent(referrer)}`;
}

const buttonClass =
  "flex items-center gap-3 rounded-3xl bg-zinc-800 px-6 py-3 font-bold text-stone-50 " +
  "transition-all duration-300 ease-in-out hover:bg-sky-500 hover:text-amber-50";

export default function StoreButtons({
  campaign,
}: Readonly<{campaign: string}>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <a href={APP_STORE_URL} className={buttonClass}>
        <FaApple size={24}/> App Store
      </a>
      <a href={playUrl(campaign)} className={buttonClass}>
        <FaGooglePlay size={20}/> Google Play
      </a>
    </div>
  );
}
