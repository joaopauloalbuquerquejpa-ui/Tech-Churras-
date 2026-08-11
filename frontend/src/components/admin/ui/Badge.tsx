// Convenção única de badge/pill do painel admin — translúcida tintada,
// substitui a pill sólida (bg-orange-500 text-white) que só o status de
// pedido usava, inconsistente com o resto do app (leads, contratos).

export type BadgeTone = 'neutral' | 'orange' | 'blue' | 'green' | 'red' | 'yellow'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-gray-700 text-gray-300',
  orange: 'bg-orange-500/20 text-orange-400',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  red: 'bg-red-500/20 text-red-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}

export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

export const LEAD_STATUS_TONE: Record<string, BadgeTone> = {
  new: 'neutral',
  qualified: 'orange',
  contacted: 'blue',
  converted: 'green',
  dead: 'red',
}

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: 'Novo',
  qualified: 'Qualificado',
  contacted: 'Contatado',
  converted: 'Convertido',
  dead: 'Frio',
}
