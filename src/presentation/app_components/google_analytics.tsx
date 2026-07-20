import Script from "next/script";

// Privacy-hardened Google Analytics (GA4) — cookieless & anonymous by design.
//
// The app (Firebase Analytics) and this site can report together when this
// points at a GA4 *web data stream* on the SAME property the app uses. But the
// site markets itself as privacy-first, so this stream is deliberately stripped
// of everything that identifies or follows a person:
//   • consent defaults to DENIED (Consent Mode v2) and is never granted here,
//   • `client_storage: 'none'` → no cookies, no persistent client-id,
//   • Google Signals and ad personalization off,
//   • IP anonymized.
// The result is aggregate, cookieless pings — no individual is tracked across
// sessions or devices, and no cookie-consent banner is required.
//
// Inert until `NEXT_PUBLIC_GA_ID` is set (in the Vercel project env). Without it
// this renders nothing, so committing it does not turn on any tracking.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  if (!GA_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            client_storage: 'none'
          });
        `}
      </Script>
    </>
  );
}
