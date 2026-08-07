import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

/**
 * Measurement for the SEO/GEO work. Both trackers are env-gated: with no IDs set
 * this component renders nothing at all, so it is inert until someone adds the
 * variables on Railway.
 *
 * Yandex Metrica matters as much as GA4 here — Yandex holds a large share of
 * search in Uzbekistan. AI-search referrals (chatgpt.com, perplexity.ai,
 * gemini.google.com) arrive as ordinary GA4 `referral` traffic; that is how GEO
 * progress gets measured.
 *
 * `afterInteractive` keeps both off the critical path so they cannot hurt LCP/INP.
 */
export default function Analytics() {
  if (!GA_ID && !YM_ID) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {YM_ID && (
        <Script id="yandex-metrica" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${YM_ID},'init',{ssr:true,webvisor:true,clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
        </Script>
      )}
    </>
  );
}
