import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/founder', '/api'],
      },
    ],
    sitemap: 'https://www.techchurras.com.br/sitemap.xml',
  }
}
