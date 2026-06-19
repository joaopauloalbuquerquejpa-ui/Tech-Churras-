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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { gmCities, boutiqueCities } = await getCities()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/grillmasters`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/boutiques`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/kit-perfeito`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/parceiros`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/para-churrasqueiros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/para-acougues`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/termos-de-uso`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/politica-de-privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const gmCityRoutes: MetadataRoute.Sitemap = gmCities.map(city => ({
    url: `${BASE_URL}/churrasqueiros/${toSlug(city)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const boutiqueCityRoutes: MetadataRoute.Sitemap = boutiqueCities.map(city => ({
    url: `${BASE_URL}/acougues/${toSlug(city)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticRoutes, ...gmCityRoutes, ...boutiqueCityRoutes]
}
