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
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1ZXG3T5ST7" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-1ZXG3T5ST7',{page_path:window.location.pathname});`}
        </Script>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(){}); }`}
        </Script>
      </body>
    </html>
  )
}