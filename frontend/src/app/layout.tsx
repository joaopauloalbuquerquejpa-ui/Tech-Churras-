import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import Script from 'next/script'
import { PostHogProvider } from '@/components/PostHogProvider'
import { CookieConsent } from '@/components/CookieConsent'
import { TrackingScripts } from '@/components/TrackingScripts'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
})

const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
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
    images: [{ url: '/jota.jpg', width: 1200, height: 630, alt: 'Tech Churras — Grillmasters Profissionais em São Paulo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Churras — Grillmasters Profissionais em São Paulo',
    description: 'O jeito mais fácil de contratar um Grillmaster profissional em SP. Escolha o churrasqueiro, o açougue e deixa a IA montar o kit.',
    images: ['/jota.jpg'],
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
        <meta name="theme-color" content="#c23616" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TechChurras" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full`}>
        <PostHogProvider>
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

        {/* ── Tracking — só carrega após consentimento LGPD ── */}
        <TrackingScripts />

        {/* ── PLAUSIBLE ANALYTICS (LGPD-friendly, sem cookies — carrega sempre) ── */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}

        {children}
        <CookieConsent />
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){}); }`}
        </Script>
        </PostHogProvider>
      </body>
    </html>
  )
}