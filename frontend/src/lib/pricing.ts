// Espelha as mesmas constantes do backend (backend/src/modules/orders/orders.service.ts).
// Fonte única pro frontend — antes cada wizard (pedido/page.tsx, orders/new/page.tsx)
// tinha sua própria cópia hardcoded, com risco real de divergir e cobrar valores
// diferentes pro mesmo tipo de pedido. O valor cobrado de verdade sempre vem do
// backend; isso aqui é só pra estimativa mostrada ao cliente antes de confirmar.
export const SERVICE_FEE_RATE = 0.06
export const SIDE_DISH_RATE_ACOUGUE = 18.50
export const SIDE_DISH_RATE_GRILLMASTER = 25.00
export const AUXILIAR_GUEST_THRESHOLD = 30
export const AUXILIAR_HOURLY_RATE = 80.00

export function calcAuxiliaresNeeded(guestCount: number): number {
  if (guestCount <= AUXILIAR_GUEST_THRESHOLD) return 0
  return Math.ceil((guestCount - AUXILIAR_GUEST_THRESHOLD) / AUXILIAR_GUEST_THRESHOLD)
}

export const WEEKEND_SURCHARGE_RATE = 0.15
export const ADVANCE_BOOKING_DISCOUNT_RATE = 0.10
export const ADVANCE_BOOKING_MIN_DAYS = 30

export function calcLaborPriceModifier(eventDate: Date): { rate: number; label: string | null } {
  const day = eventDate.getDay()
  const isWeekend = day === 0 || day === 6
  if (isWeekend) return { rate: WEEKEND_SURCHARGE_RATE, label: 'Sobretaxa de fim de semana' }

  const daysUntilEvent = Math.floor((eventDate.getTime() - Date.now()) / 86400000)
  if (daysUntilEvent >= ADVANCE_BOOKING_MIN_DAYS) {
    return { rate: -ADVANCE_BOOKING_DISCOUNT_RATE, label: 'Desconto por antecedência' }
  }
  return { rate: 0, label: null }
}
