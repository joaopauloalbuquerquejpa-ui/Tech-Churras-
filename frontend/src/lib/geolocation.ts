// Localização do navegador pra listagens "perto de você" (churrasqueiros/açougues).
// Guardado em sessionStorage pra não pedir permissão de novo a cada página
// na mesma sessão de navegação.

const STORAGE_KEY = 'tc-user-location'

export interface UserLocation {
  lat: number
  lng: number
}

export function getCachedLocation(): UserLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function requestLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste navegador.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc)) } catch {}
        resolve(loc)
      },
      err => {
        const messages: Record<number, string> = {
          1: 'Permissão de localização negada.',
          2: 'Não foi possível determinar sua localização.',
          3: 'Tempo esgotado ao buscar sua localização.',
        }
        reject(new Error(messages[err.code] || 'Não foi possível obter sua localização.'))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    )
  })
}

export function clearCachedLocation() {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
}
