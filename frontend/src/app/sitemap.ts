import type { MetadataRoute } from 'next'
import { API_URL } from '@/lib/api'

const BASE_URL = 'https://www.techchurras.com.br'

function toSlug(city: string) {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

async function getCities(): Promise<{ gmCities: string[]; boutiqueCities: string[] }> {
  try {
    const [gmRes, bRes] = await Promise.all([
      fetch(`${API_URL}/grillmasters?limit=200`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/boutiques`, { next: { revalidate: 3600 } }),
    ])
    const gmData = gmRes.ok ? await gmRes.json() : { grillmasters: [] }
    const bData = bRes.ok ? await bRes.json() : []

    const gmList = Array.isArray(gmData) ? gmData : (gmData.grillmasters ?? [])
    const bList = Array.isArray(bData) ? bData : (bData.boutiques ?? [])

    const gmCities = [...new Set<string>(gmList.map((g: any) => g.city).filter(Boolean))]
    const boutiqueCities = [...new Set<string>(bList.map((b: any) => b.city).filter(Boolean))]

    return { gmCities, boutiqueCities }
  } catch {
    return { gmCities: [], boutiqueCities: [] }
  }
}

// SP priority city pages — always in sitemap regardless of API state
const SP_CITIES_GM = ['sao-paulo', 'guarulhos', 'campinas', 'osasco', 'santo-andre', 'sao-bernardo-do-campo']
const SP_CITIES_BOUTIQUE = ['sao-paulo', 'guarulhos', 'campinas', 'osasco']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { gmCities, boutiqueCities } = await getCities()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/grillmasters`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/boutiques`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/churrasqueiros/sao-paulo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/acougues/sao-paulo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/kit-perfeito`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/para-acougues`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/metodo-do-churrasco-exotico`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/convite-acougue`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE_URL}/para-churrasqueiros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/galeria`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/founder`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/termos-de-uso`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/politica-de-privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // SP priority city pages always included
  const spGmRoutes: MetadataRoute.Sitemap = SP_CITIES_GM
    .filter(slug => slug !== 'sao-paulo') // SP already in staticRoutes
    .map(slug => ({
      url: `${BASE_URL}/churrasqueiros/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }))

  const spBoutiqueRoutes: MetadataRoute.Sitemap = SP_CITIES_BOUTIQUE
    .filter(slug => slug !== 'sao-paulo')
    .map(slug => ({
      url: `${BASE_URL}/acougues/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }))

  // Dynamic routes from API, skip any already in hardcoded SP lists
  const spGmSlugs = new Set(SP_CITIES_GM)
  const spBoutiqueSlugs = new Set(SP_CITIES_BOUTIQUE)

  const gmCityRoutes: MetadataRoute.Sitemap = gmCities
    .filter(city => !spGmSlugs.has(toSlug(city)))
    .map(city => ({
      url: `${BASE_URL}/churrasqueiros/${toSlug(city)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

  const boutiqueCityRoutes: MetadataRoute.Sitemap = boutiqueCities
    .filter(city => !spBoutiqueSlugs.has(toSlug(city)))
    .map(city => ({
      url: `${BASE_URL}/acougues/${toSlug(city)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

  return [...staticRoutes, ...spGmRoutes, ...spBoutiqueRoutes, ...gmCityRoutes, ...boutiqueCityRoutes]
}
