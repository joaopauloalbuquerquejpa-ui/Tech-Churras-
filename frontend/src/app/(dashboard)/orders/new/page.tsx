'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// /orders/new foi unificado com /pedido (mesmo wizard pra guest e logado —
// antes eram duas implementações com lógica de preço duplicada e risco real
// de divergir). Isso fica só como redirecionador pra não quebrar links/
// bookmarks antigos.
function Redirector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    router.replace('/pedido' + (params ? '?' + params : ''))
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" />
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" /></div>}>
      <Redirector />
    </Suspense>
  )
}
