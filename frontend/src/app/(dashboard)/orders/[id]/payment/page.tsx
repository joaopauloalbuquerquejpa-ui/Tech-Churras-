'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function Spinner() {
  return (
    <div className="flex justify-center p-8">
      <div
        className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-orange-500"
        style={{ animation: 'spin 0.8s linear infinite' }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = getToken()
    if (!t) { router.push('/login'); return }

    fetch(BASE + '/orders/' + orderId, { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'CONFIRMED' || d.status === 'COMPLETED') {
          router.push('/orders/' + orderId)
          return null
        }
        setOrder(d)
        return fetch(BASE + '/payments/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
          body: JSON.stringify({ orderId }),
        })
      })
      .then(r => r?.json())
      .then(d => {
        if (!d) return
        if (d.error) { setError(d.error); return }
        setCheckoutUrl(d.checkout_url ?? '')
      })
      .catch(() => setError('Erro ao preparar pagamento. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [orderId, router])

  if (loading) return <Spinner />

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={'/orders/' + orderId} className="text-gray-400 hover:text-white transition-colors text-xl">
          &#8592;
        </Link>
        <h1 className="text-2xl font-bold">Pagamento</h1>
      </div>

      {order && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-500 font-mono mb-3">Pedido #{orderId.slice(0, 8)}</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-semibold text-lg">
                {order.grillmaster?.user?.name || 'Grillmaster'}
              </p>
              {order.boutique && (
                <p className="text-sm text-gray-400 mt-0.5">{order.boutique.name}</p>
              )}
              {order.eventDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.eventDate).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-orange-400 font-bold text-2xl">
                R${' '}
                {(order.totalPrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{order.guestCount} convidados</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {!error && !checkoutUrl && <Spinner />}

      {checkoutUrl && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-4">
              Voce sera redirecionado para o Mercado Pago para concluir o pagamento com seguranca.
              Aceitamos cartao de credito, debito, Pix e boleto.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {['Cartao de Credito', 'Cartao de Debito', 'Pix', 'Boleto'].map(m => (
                <span key={m} className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <a
            href={checkoutUrl}
            className="flex items-center justify-center gap-3 w-full bg-[#009ee3] hover:bg-[#0088c7] text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg shadow-blue-500/20"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 7.5C2 5.567 3.567 4 5.5 4h13C20.433 4 22 5.567 22 7.5v9C22 18.433 20.433 20 18.5 20h-13C3.567 20 2 18.433 2 16.5v-9zm3.5-.5a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2zM12 15a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
            Pagar com Mercado Pago
          </a>

          <p className="text-center text-xs text-gray-600">
            Ambiente seguro &middot; Dados criptografados
          </p>
        </div>
      )}
    </div>
  )
}
