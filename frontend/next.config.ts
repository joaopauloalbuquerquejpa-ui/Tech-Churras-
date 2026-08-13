import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline (Next.js requer) + analytics externos
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://plausible.io https://js.sentry-cdn.com https://www.clarity.ms https://us-assets.i.posthog.com https://googleads.g.doubleclick.net",
  // Estilos: self + inline (Tailwind CSS-in-JS)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fontes
  "font-src 'self' https://fonts.gstatic.com",
  // Imagens: self + data URIs + Supabase + Google + pixels de conversão (Meta/Google Ads)
  "img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://www.google.com https://www.google.com.br https://www.facebook.com https://googleads.g.doubleclick.net https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://*.tile.openstreetmap.fr https://*.tile.openstreetmap.de https://image.pollinations.ai https://images.pexels.com",
  // Conexões de rede: backend + analytics + Supabase (https+wss p/ Realtime) + maps + Sentry + pixels de conversão
  "connect-src 'self' https://tech-churras-production.up.railway.app https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://ad.doubleclick.net https://googleads.g.doubleclick.net https://www.google.com https://www.google.com.br https://o4507954432344064.ingest.us.sentry.io https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://plausible.io https://posthog.com https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.facebook.com https://analytics.tiktok.com https://analytics-ipv6.tiktokw.us https://www.clarity.ms https://viacep.com.br",
  // Frames: apenas Mercado Pago (checkout)
  "frame-src 'self' https://www.mercadopago.com.br https://sandbox.mercadopago.com.br https://*.mercadopago.com",
  // Workers: service worker
  "worker-src 'self' blob:",
  // Media
  "media-src 'self' blob: https://*.supabase.co https://videos.pexels.com",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    // next/image otimiza buscando a imagem pelo SERVIDOR (diferente do CSP,
    // que só controla o que o navegador pode carregar) — um wildcard
    // *.supabase.co viraria proxy aberto pra qualquer projeto Supabase de
    // qualquer pessoa, não só o nosso. Por isso aqui é o subdomínio exato
    // do nosso projeto (mesmo valor de SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL),
    // não o wildcard que o CSP usa pro navegador.
    remotePatterns: [
      { protocol: 'https', hostname: 'azujdhdwcmdgfselxiim.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'image.pollinations.ai', pathname: '/**' },
      // Alguns registros antigos gravaram photoUrl como URL absoluta pro
      // próprio domínio (ex: Team Jota) em vez de caminho relativo — sem
      // isso o next/image trata como "externo" e quebra em runtime.
      { protocol: 'https', hostname: 'www.techchurras.com.br', pathname: '/**' },
      { protocol: 'https', hostname: 'techchurras.com.br', pathname: '/**' },
    ],
  },
  async redirects() {
    return [
      { source: '/entrar', destination: '/login', permanent: true },
      { source: '/parceiros', destination: '/para-acougues', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: { disable: true },
})
