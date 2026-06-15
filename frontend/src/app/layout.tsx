import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  metadataBase: new URL('https://www.techchurras.com.br'),
  title: {
    default: 'Tech Churras — Churrasqueiros Profissionais Certificados',
    template: '%s — Tech Churras',
  },
  description: 'Contrate churrasqueiros profissionais certificados e açougues premium para o seu evento. Acompanhe ao vivo no mapa. a Tech Churras.',
  keywords: ['churrasqueiro', 'contratar churrasqueiro', 'churrasco profissional', 'acougue premium', 'Tech Churras'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    title: 'Tech Churras — Churrasqueiros Profissionais Certificados',
    description: 'Churrasqueiros certificados e açougues premium. Contrate pelo app, acompanhe ao vivo no mapa.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Churras — Churrasqueiros Profissionais Certificados',
    description: 'Churrasqueiros certificados e açougues premium. Contrate pelo app, acompanhe ao vivo no mapa.',
    images: ['/jota.jpg'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR'>
      <head>
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TechChurras" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} h-full`}>
        {/* ── GA4 ── */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1ZXG3T5ST7" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-1ZXG3T5ST7',{page_path:window.location.pathname});`}
        </Script>

        {/* ── META PIXEL ── adicione NEXT_PUBLIC_META_PIXEL_ID no Vercel quando criar a conta Meta Ads ── */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        )}

        {/* ── TIKTOK PIXEL ── adicione NEXT_PUBLIC_TIKTOK_PIXEL_ID no Vercel quando criar a conta TikTok Ads ── */}
        {process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}');ttq.page();}(window,document,'ttq');`}
          </Script>
        )}

        {/* ── GOOGLE ADS ── adicione NEXT_PUBLIC_GOOGLE_ADS_ID no Vercel quando criar a conta Google Ads (formato: AW-XXXXXXXXXX) ── */}
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
          <Script id="google-ads" strategy="afterInteractive">
            {`gtag('config','${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');`}
          </Script>
        )}

        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){}); }`}
        </Script>
      </body>
    </html>
  )
}