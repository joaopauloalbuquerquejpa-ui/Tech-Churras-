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

// Açougue Embaixador é grátis até completar esses pedidos — não por prazo
// (30 dias corriam igual mesmo sem nenhum pedido, cobrando de quem não viu
// a plataforma gerar venda nenhuma ainda). Ver admin.service.ts (aprovação)
// e boutiques.service.ts (cálculo ao vivo pro dashboard).
export const TRIAL_ORDERS_THRESHOLD = 3

// Sobretaxa de fim de semana (mais demanda) e desconto por antecedência
// (ajuda a preencher agenda de dias de semana) — regra fixa de calendário,
// sem precificação dinâmica/algorítmica. Aplicada só sobre o custo do
// Grillmaster (mão de obra), não sobre carne/açougue.
export const WEEKEND_SURCHARGE_RATE = 0.15
export const ADVANCE_BOOKING_DISCOUNT_RATE = 0.10
export const ADVANCE_BOOKING_MIN_DAYS = 30

export function calcLaborPriceModifier(eventDate: Date): { rate: number; label: string | null } {
  const day = eventDate.getDay() // 0 = domingo, 6 = sábado
  const isWeekend = day === 0 || day === 6
  if (isWeekend) return { rate: WEEKEND_SURCHARGE_RATE, label: 'Sobretaxa de fim de semana' }

  const daysUntilEvent = Math.floor((eventDate.getTime() - Date.now()) / 86400000)
  if (daysUntilEvent >= ADVANCE_BOOKING_MIN_DAYS) {
    return { rate: -ADVANCE_BOOKING_DISCOUNT_RATE, label: 'Desconto por antecedência' }
  }
  return { rate: 0, label: null }
}
