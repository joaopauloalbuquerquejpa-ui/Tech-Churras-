'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const BASE = 'https://tech-churras-production.up.railway.app'
const PUB_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
const stripePromise =
  PUB_KEY && PUB_KEY !== 'pk_test_sua_chave_aqui' ? loadStripe(PUB_KEY) : null

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

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setErr('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/orders/' + orderId },
    })
    if (error) setErr(error.message ?? 'Pagamento falhou')
    setPaying(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-sm text-gray-400 mb-4">Dados do cartao</p>
        <PaymentElement />
      </div>
      {err && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {err}
        </div>
      )}
      <button
        type="submit"
        disabled={paying || !stripe}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors animate-flamePulse"
      >
        {paying ? 'Processando...' : 'Confirmar Pagamento'}
      </button>
    </form>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState('')

  useEffect(() => {
    const t = getToken()
    if (!t) { router.push('/login'); return }
    fetch(BASE + '/orders/' + orderId, { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'CONFIRMED' || d.status === 'COMPLETED') {
          router.push('/orders/' + orderId)
          return
        }
        setOrder(d)
        return fetch(BASE + '/payments/' + orderId, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + t },
        })
      })
      .then(r => r?.json())
      .then(d => {
        if (d?.clientSecret) setClientSecret(d.clientSecret)
        else if (d?.error) setIntentError(d.error)
      })
      .catch(() => setIntentError('Erro ao preparar pagamento'))
      .finally(() => setLoadingOrder(false))
  }, [orderId, router])

  if (loadingOrder) return <Spinner />

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={'/orders/' + orderId} className="text-gray-400 hover:text-white transition-colors">
          &#8592;
        </Link>
        <h1 className="text-2xl font-bold">Pagamento</h1>
      </div>

      {order && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-500 font-mono mb-2">Pedido #{orderId.slice(0, 8)}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {order.grillmaster?.user?.name || 'Grillmaster'}
              </p>
              {order.boutique && (
                <p className="text-sm text-gray-400">{order.boutique.name}</p>
              )}
            </div>
            <p className="text-orange-400 font-bold text-2xl">
              R${' '}
              {(order.totalPrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {intentError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
          {intentError}
        </div>
      )}

      {!clientSecret && !intentError && <Spinner />}

      {!stripePromise && clientSecret && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
          <p className="text-yellow-400 font-semibold mb-2">Stripe nao configurado</p>
          <p className="text-gray-400 text-sm">
            Adicione{' '}
            <code className="text-orange-400">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> no{' '}
            <code className="text-orange-400">.env.local</code> para habilitar pagamentos.
          </p>
        </div>
      )}

      {stripePromise && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#f97316' } } }}
        >
          <CheckoutForm orderId={orderId} />
        </Elements>
      )}
    </div>
  )
}
