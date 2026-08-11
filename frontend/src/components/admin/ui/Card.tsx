export function Card({ children, className = '', featured = false }: {
  children: React.ReactNode; className?: string; featured?: boolean
}) {
  return (
    <div className={`bg-gray-900 border border-gray-800 ${featured ? 'rounded-2xl p-5' : 'rounded-xl p-4'} ${className}`}>
      {children}
    </div>
  )
}
