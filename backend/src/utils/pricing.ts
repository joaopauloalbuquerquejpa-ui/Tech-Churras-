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

// Pivô de modelo (set/2026): açougue não paga mais mensalidade em nenhuma
// hipótese — TRIAL_ORDERS_THRESHOLD e BOUTIQUE_FEE_WAIVER_THRESHOLD foram
// removidos porque não existe mais mensalidade pra "liberar depois de X
// pedidos" ou "dispensar acima de um piso de faturamento". Comissão sobre
// carne (BOUTIQUE_COMMISSION) continua a única cobrança da Tech Churras.

// Mão de obra do evento — executada pela equipe própria da Tech Churras
// (marketplace de churrasqueiro independente fica dormente, ver
// Order.executionType). Tabela fixa por faixa de convidados, não mais
// pricePerHour × horas: R$350 cobre até AUXILIAR_GUEST_THRESHOLD (30)
// convidados; cada bloco de 30 adicionais soma um auxiliar fixo.
export const LABOR_BASE_FLAT_PRICE = 350.00
export const LABOR_AUXILIAR_FLAT_PRICE = 195.00

export function calcLaborFlatPrice(guestCount: number): { total: number; auxiliares: number } {
  const auxiliares = calcAuxiliaresNeeded(guestCount)
  return { total: LABOR_BASE_FLAT_PRICE + auxiliares * LABOR_AUXILIAR_FLAT_PRICE, auxiliares }
}

// Comissões da Tech Churras — únicas fontes da verdade, usadas em
// payouts.service.ts (nunca hardcodear esses números de novo em outro
// arquivo). GM_COMMISSION só se aplica a Order.executionType='MARKETPLACE_GM'
// (churrasqueiro independente, dormente); equipe interna usa
// INTERNAL_TEAM_PAYOUT_PER_EVENT (valor fixo, não percentual).
export const BOUTIQUE_COMMISSION = 10
export const GM_COMMISSION = 7
export const INTERNAL_TEAM_PAYOUT_PER_EVENT = 250.00

// Incentivo novo do pivô: açougue ganha esse percentual sobre a mão de obra
// do evento (order.laborPrice), além da comissão que já paga sobre a carne —
// mesmo não executando o evento, é recompensado por ter mão de obra vendida
// junto com os insumos dele. Ver Payout.type='BOUTIQUE_LABOR_BONUS'.
export const BOUTIQUE_LABOR_BONUS_RATE = 10

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
