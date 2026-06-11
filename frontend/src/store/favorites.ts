import { create } from 'zustand'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface FavEntry {
  targetType: string
  targetId: string
}

interface FavoritesStore {
  entries: FavEntry[]
  loaded: boolean
  load: () => Promise<void>
  isFavorited: (targetType: string, targetId: string) => boolean
  toggle: (targetType: string, targetId: string) => Promise<void>
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  entries: [],
  loaded: false,

  load: async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${BASE}/favorites`, {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) return
      const data = await res.json()
      const entries: FavEntry[] = [
        ...(data.grillmasters ?? []).map((g: { id: string }) => ({
          targetType: 'GRILLMASTER',
          targetId: g.id,
        })),
        ...(data.boutiques ?? []).map((b: { id: string }) => ({
          targetType: 'BOUTIQUE',
          targetId: b.id,
        })),
      ]
      set({ entries, loaded: true })
    } catch {}
  },

  isFavorited: (targetType, targetId) =>
    get().entries.some((e) => e.targetType === targetType && e.targetId === targetId),

  toggle: async (targetType, targetId) => {
    const token = getToken()
    if (!token) return
    const already = get().isFavorited(targetType, targetId)

    // Optimistic update
    if (already) {
      set((state) => ({
        entries: state.entries.filter(
          (e) => !(e.targetType === targetType && e.targetId === targetId)
        ),
      }))
    } else {
      set((state) => ({ entries: [...state.entries, { targetType, targetId }] }))
    }

    try {
      if (already) {
        await fetch(`${BASE}/favorites/${targetType}/${targetId}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token },
        })
      } else {
        await fetch(`${BASE}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ targetType, targetId }),
        })
      }
    } catch {
      // Revert on error
      if (already) {
        set((state) => ({ entries: [...state.entries, { targetType, targetId }] }))
      } else {
        set((state) => ({
          entries: state.entries.filter(
            (e) => !(e.targetType === targetType && e.targetId === targetId)
          ),
        }))
      }
    }
  },
}))
