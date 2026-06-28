import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/founder',
          '/api',
          '/grillmasters/dashboard',
          '/boutiques/dashboard',
          '/menu',
          '/menu/',
          '/orders',
          '/orders/',
          '/pedido',
          '/perfil',
          '/carrinho',
          '/login',
          '/register',
          '/redefinir-senha',
          '/acompanhar/',
          '/indicar',
          '/convite/',
          '/r/',
        ],
      },
    ],
    sitemap: 'https://www.techchurras.com.br/sitemap.xml',
  }
}
