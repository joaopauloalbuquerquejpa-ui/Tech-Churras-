export function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <span className="w-12 h-12 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center mb-3">
        {icon}
      </span>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
