'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function getUser() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.user : null
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl transition-colors"
        >
          <span className={(hover || value) >= n ? 'text-yellow-400' : 'text-gray-600'}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

interface OrderInfo {
  id: string
  customer?: { name: string; averageRating?: number | null }
}

export default function ReviewCustomerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'GRILLMASTER') {
      router.push('/orders')
      return
    }
    const token = getToken()
    fetch(`${BASE}/orders/${id}`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setOrder(data))
      .catch(() => {})
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Selecione uma avaliacao de 1 a 5 estrelas.'); return }
    setError('')
    setSubmitting(true)
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/reviews/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ orderId: id, customerRating: rating, customerComment: comment || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Erro ao enviar avaliacao.')
        return
      }
      router.push(`/orders/${id}`)
    } catch {
      setError('Erro ao enviar avaliacao.')
    } finally {
      setSubmitting(false)
    }
  }

  const customerName = order?.customer?.name ?? 'o cliente'

  return (
    <div className="max-w-lg mx-auto">
      <Link href={`/orders/${id}`} className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Voltar ao pedido
      </Link>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold mb-1">Avaliar cliente</h1>
        <p className="text-sm text-gray-400 mb-6">
          Como foi a experiencia com {customerName}?
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">
              Avaliacao *
            </label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                {rating === 1 && 'Muito ruim'}
                {rating === 2 && 'Ruim'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bom'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Descreva como foi trabalhar com este cliente..."
              rows={3}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar avaliacao'}
            </button>
            <Link
              href={`/orders/${id}`}
              className="px-5 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
            >
              Pular
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
