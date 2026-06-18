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
    default: 'Tech Churras — Churrasqueiros Profissionais em São Paulo',
    template: '%s — Tech Churras',
  },
  description: 'Contrate Grillmasters profissionais certificados e açougues premium em São Paulo. Kit de churrasco planejado por IA, acompanhe ao vivo no mapa. Aniversários, eventos corporativos e confraternizações.',
  keywords: [
    'churrasqueiro profissional São Paulo',
    'contratar churrasqueiro SP',
    'grillmaster São Paulo',
    'churrasco para evento São Paulo',
    'churrasqueiro para aniversário SP',
    'churrasco corporativo São Paulo',
    'açougue premium São Paulo',
    'kit churrasco completo',
    'churrasqueiro a domicílio SP',
    'Tech Churras',
    'Jota Grillmaster',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    url: 'https://www.techchurras.com.br',
    title: 'Tech Churras — Grillmasters Profissionais em São Paulo',
    description: 'O jeito mais fácil de contratar um Grillmaster profissional em SP. Escolha o churrasqueiro, o açougue e deixa a IA montar o kit. Acompanhe ao vivo.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tech Churras — Grillmasters Profissionais em São Paulo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Churras — Grillmasters Profissionais em São Paulo',
    description: 'O jeito mais fácil de contratar um Grillmaster profissional em SP. Escolha o churrasqueiro, o açougue e deixa a IA montar o kit.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://www.techchurras.com.br' },
  other: {
    'geo.region': 'BR-SP',
    'geo.placename': 'São Paulo',
    'geo.position': '-23.5505;-46.6333',
    'ICBM': '-23.5505, -46.6333',
  },
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
        {/* ── JSON-LD Schema Markup ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://www.techchurras.com.br/#organization",
                "name": "Tech Churras",
                "url": "https://www.techchurras.com.br",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.techchurras.com.br/logo-flame.png",
                  "width": 512,
                  "height": 512
                },
                "telephone": "+5511970593650",
                "sameAs": [
                  "https://www.instagram.com/tech.churras/"
                ],
                "founder": {
                  "@type": "Person",
                  "name": "Jota Albuquerque",
                  "jobTitle": "Grillmaster & Fundador"
                },
                "description": "Plataforma que conecta clientes a Grillmasters certificados e açougues premium em São Paulo. Contrate, acompanhe ao vivo e avalie.",
                "areaServed": {
                  "@type": "City",
                  "name": "São Paulo",
                  "containedInPlace": { "@type": "State", "name": "São Paulo, Brasil" }
                }
              },
              {
                "@type": ["LocalBusiness", "FoodEstablishment"],
                "@id": "https://www.techchurras.com.br/#localbusiness",
                "name": "Tech Churras",
                "url": "https://www.techchurras.com.br",
                "telephone": "+5511970593650",
                "priceRange": "$$",
                "image": "https://www.techchurras.com.br/jota.jpg",
                "description": "Contrate Grillmasters profissionais certificados e açougues premium para o seu churrasco em São Paulo. Aniversários, eventos corporativos e confraternizações.",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "São Paulo",
                  "addressRegion": "SP",
                  "addressCountry": "BR"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": -23.5505,
                  "longitude": -46.6333
                },
                "areaServed": "São Paulo, SP, Brasil",
                "servesCuisine": ["Churrasco Brasileiro", "Parrilla Argentina", "Churrasco Gaúcho"],
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                  "opens": "08:00",
                  "closes": "22:00"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "5.0",
                  "reviewCount": "12",
                  "bestRating": "5",
                  "worstRating": "1"
                },
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Serviços de Churrasco Profissional",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Grillmaster para Aniversário",
                        "description": "Churrasqueiro profissional para festas de aniversário em São Paulo"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Churrasco Corporativo",
                        "description": "Grillmaster para confraternizações e eventos corporativos em SP"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Kit Churrasco Completo com IA",
                        "description": "Planejamento automático de kit de churrasco com Grillmaster e açougue parceiro"
                      }
                    }
                  ]
                }
              },
              {
                "@type": "WebSite",
                "@id": "https://www.techchurras.com.br/#website",
                "url": "https://www.techchurras.com.br",
                "name": "Tech Churras",
                "publisher": { "@id": "https://www.techchurras.com.br/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://www.techchurras.com.br/grillmasters?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}}
        />

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