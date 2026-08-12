// Constantes de precificação compartilhadas entre orders.service.ts e
// dispatch.service.ts — em arquivo separado pra evitar import circular
// entre os dois módulos (dispatch importa de orders pra notificações).

// Regra de qualidade: 1 Grillmaster sozinho não sustenta padrão acima de 30
// convidados. Só GM com bringsAuxiliar pode atender acima disso — 1 auxiliar
// a cada 30 convidados extras, R$80/h cada (mesma comissão da mão de obra).
export const AUXILIAR_GUEST_THRESHOLD = 30
export const AUXILIAR_HOURLY_RATE = 80.00

export function calcAuxiliaresNeeded(guestCount: number): number {
  if (guestCount <= AUXILIAR_GUEST_THRESHOLD) return 0
  return Math.ceil((guestCount - AUXILIAR_GUEST_THRESHOLD) / AUXILIAR_GUEST_THRESHOLD)
}
