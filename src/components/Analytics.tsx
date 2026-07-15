import Script from 'next/script'

/**
 * Browser Pixel + GA4 (§13.3, §13.8). Direct fbq/gtag — no tag manager (perf tax + breaks in the
 * FB webview). Per-event event_ids are server-generated and passed to fbq's { eventID } so the
 * browser event dedups against the CAPI event (§13.3). Purchase's id === orderNumber (#9/#20).
 * Only renders when the ids are configured (needs a Meta Pixel + GA4 property).
 */
export function Analytics() {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID

  return (
    <>
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}');`}
          </Script>
        </>
      )}
    </>
  )
}
