type Accent = 'orange' | 'green' | 'blue' | 'neutral'

const ACCENT_ICON_BG: Record<Accent, string> = {
  orange: 'bg-orange-500/15 text-orange-400',
  green: 'bg-green-500/15 text-green-400',
  blue: 'bg-blue-500/15 text-blue-400',
  neutral: 'bg-gray-700/50 text-gray-300',
}

const ACCENT_VALUE: Record<Accent, string> = {
  orange: 'text-orange-400',
  green: 'text-green-400',
  blue: 'text-blue-400',
  neutral: 'text-white',
}

export function MetricCard({ icon, label, value, hint, accent = 'neutral', href }: {
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
  accent?: Accent
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ACCENT_ICON_BG[accent]}`}>
          {icon}
        </span>
      </div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-black mt-1 ${ACCENT_VALUE[accent]}`}>{value}</p>
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </>
  )

  const className = 'bg-gray-900 border border-gray-800 rounded-2xl p-5'

  if (href) {
    return (
      <a href={href} className={`${className} hover:border-orange-500/40 hover:bg-gray-800/60 transition-all block`}>
        {content}
      </a>
    )
  }
  return <div className={className}>{content}</div>
}
