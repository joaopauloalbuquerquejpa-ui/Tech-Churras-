'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function Redirector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // /pedido virou o wizard único (guest e logado) — antes redirecionava
    // pra /orders/new, que exigia login mesmo pra quem só estava navegando.
    const params = searchParams.toString()
    router.replace('/pedido' + (params ? '?' + params : ''))
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" />
    </div>
  )
}

export default function MenuNovoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-black"><div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500 animate-spin" /></div>}>
      <Redirector />
    </Suspense>
  )
}
