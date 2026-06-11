import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EventData {
  date: string
  time: string
  address: string
  cep: string
  hours: number
  homens: number
  mulheres: number
  criancas: number
  acompanhamentos: boolean
  acompanhamentosText: string
}

const defaultEventData: EventData = {
  date: '',
  time: '12:00',
  address: '',
  cep: '',
  hours: 4,
  homens: 5,
  mulheres: 3,
  criancas: 2,
  acompanhamentos: false,
  acompanhamentosText: '',
}

interface CartStore {
  grillmasterId: string
  boutiqueId: string
  selectedQty: Record<string, number>
  eventData: EventData
  couponCode: string

  setGrillmasterId: (id: string) => void
  setBoutiqueId: (id: string) => void
  setSelectedQty: (qty: Record<string, number>) => void
  setEventData: (data: Partial<EventData>) => void
  setCouponCode: (code: string) => void
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      grillmasterId: '',
      boutiqueId: '',
      selectedQty: {},
      eventData: defaultEventData,
      couponCode: '',

      setGrillmasterId: (id) => set({ grillmasterId: id }),
      setBoutiqueId: (id) => set({ boutiqueId: id }),
      setSelectedQty: (qty) => set({ selectedQty: qty }),
      setEventData: (data) =>
        set((state) => ({ eventData: { ...state.eventData, ...data } })),
      setCouponCode: (code) => set({ couponCode: code }),
      clearCart: () =>
        set({
          grillmasterId: '',
          boutiqueId: '',
          selectedQty: {},
          eventData: defaultEventData,
          couponCode: '',
        }),
      itemCount: () =>
        Object.values(get().selectedQty).filter((q) => q > 0).length,
    }),
    { name: 'cart-storage' }
  )
)
