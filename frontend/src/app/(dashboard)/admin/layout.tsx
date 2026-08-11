import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/ui/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <Suspense fallback={null}>
        {/* Mobile: nav horizontal rolável no topo. Desktop: sidebar fixa à esquerda. */}
        <div className="md:hidden">
          <AdminSidebar orientation="horizontal" />
        </div>
        <div className="hidden md:block sticky top-6 self-start">
          <AdminSidebar orientation="vertical" />
        </div>
      </Suspense>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
