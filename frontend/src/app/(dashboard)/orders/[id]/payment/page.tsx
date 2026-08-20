'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Events } from '@/lib/analytics'


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

    fetch(API_URL + '/orders/' + orderId, { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'CONFIRMED' || d.status === 'COMPLETED') {
          router.push('/orders/' + orderId)
          return null
        }
        setOrder(d)
        return fetch(API_URL + '/payments/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
          body: JSON.stringify({ orderId }),
        })
      })
      .then(r => r?.json())
      .then(d => {
        if (!d) return
        if (d.error) { setError(d.error); return }
        if (d.checkout_url) Events.beginCheckout(orderId, d.amount ?? 0)
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
          {(order.totalPrice ?? 0) >= 60 && (
            <p className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mt-3 text-center">
              💳 Parcele em até 12x de R$ {((order.totalPrice ?? 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no cartão de crédito
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-4">
          <p className="text-red-400 font-bold mb-1">Não foi possível preparar o pagamento</p>
          <p className="text-red-400/70 text-sm mb-5">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setError(''); setLoading(true); window.location.reload() }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Tentar novamente
            </button>
            <a
              href={`https://wa.me/5511970593650?text=${encodeURIComponent(`Olá! Tive um problema no pagamento do pedido ${orderId.slice(0,8)}. Pode me ajudar?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-green-600/40 text-green-400 hover:bg-green-600/10 font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
              Falar com suporte
            </a>
          </div>
        </div>
      )}

      {!error && !checkoutUrl && <Spinner />}

      {checkoutUrl && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-4">
              Você será redirecionado para o Mercado Pago para concluir o pagamento com segurança.
              Aceitamos cartão de crédito, débito, Pix e boleto.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg font-medium">
                Cartão de Crédito · parcelado
              </span>
              {['Cartão de Débito', 'Pix', 'Boleto'].map(m => (
                <span key={m} className="bg-gray-800 border border-gray-700 text-gray-500 px-2.5 py-1 rounded-lg">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-xs text-gray-500 space-y-1.5">
            <p className="text-gray-400 font-medium text-sm mb-2">Política de cancelamento</p>
            <p>• Cancelamento até 48h antes do evento: <span className="text-green-400">reembolso integral</span></p>
            <p>• Cancelamento entre 24h e 48h antes: <span className="text-yellow-400">multa de 30% (reembolso de 70%)</span></p>
            <p>• Cancelamento com menos de 24h: <span className="text-red-400">multa de 50% (reembolso de 50%)</span></p>
            <p className="text-gray-600 pt-1">Ao pagar você concorda com nossa política de cancelamento e com os <a href="/termos-de-uso" className="underline hover:text-gray-400">termos de uso</a>.</p>
          </div>

          <p className="text-center text-sm text-gray-400">Tudo certo? Falta só confirmar. 🔥</p>

          <a
            href={checkoutUrl}
            className="flex items-center justify-center gap-3 w-full bg-[#009ee3] hover:bg-[#0088c7] text-white font-bold py-4 rounded-xl transition-colors text-base shadow-lg shadow-blue-500/20"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 7.5C2 5.567 3.567 4 5.5 4h13C20.433 4 22 5.567 22 7.5v9C22 18.433 20.433 20 18.5 20h-13C3.567 20 2 18.433 2 16.5v-9zm3.5-.5a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2zM12 15a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
            Pagar com Mercado Pago
          </a>

          <p className="text-center text-xs text-gray-500 mt-1">
            Não precisa ter conta no Mercado Pago — clique em <span className="text-gray-300">"Continuar sem criar conta"</span> na próxima tela.
          </p>

          <p className="text-center text-xs text-gray-600">
            Ambiente seguro &middot; Dados criptografados
          </p>
        </div>
      )}
    </div>
  )
}