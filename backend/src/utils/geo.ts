// Haversine — distância em km entre dois pontos geográficos
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}

// Cache em memória com TTL de 24h — evita rate limit do Nominatim (1 req/s por IP)
const geocodeCache = new Map<string, { result: { lat: number; lng: number } | null; expiresAt: number }>()

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.toLowerCase().trim()

  const cached = geocodeCache.get(key)
  if (cached && Date.now() < cached.expiresAt) return cached.result

  const result = await _fetchGeocode(address)

  geocodeCache.set(key, { result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })

  // Limpeza periódica para evitar crescimento ilimitado
  if (geocodeCache.size > 500) {
    const now = Date.now()
    for (const [k, v] of geocodeCache) {
      if (now > v.expiresAt) geocodeCache.delete(k)
    }
  }

  return result
}

async function _fetchGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(address + ', Brasil')
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TechChurras/1.0 (contato@techchurras.com.br)' },
    })
    if (!res.ok) return null
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
