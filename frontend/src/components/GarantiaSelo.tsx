const ITENS = [
  { icon: '🥩', text: 'Carne calculada por convidado — não acaba no meio da festa' },
  { icon: '📍', text: 'Churrasqueiro rastreado por GPS no dia do evento' },
  { icon: '💸', text: 'Pagamento seguro via Mercado Pago · reembolso se algo falhar' },
]

// Selo de eliminação de risco — as 3 quebras clássicas do nicho (atraso, carne
// insuficiente, calote) respondidas uma a uma. Usado no wizard e na home.
export default function GarantiaSelo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-gray-900 border border-orange-500/30 rounded-2xl ${compact ? 'p-4' : 'p-5'}`}>
      <p className={`font-black text-orange-400 uppercase tracking-wide ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        🛡 Garantia Tech Churras
      </p>
      <ul className="space-y-2">
        {ITENS.map(i => (
          <li key={i.text} className={`flex items-start gap-2 text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span aria-hidden="true">{i.icon}</span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
