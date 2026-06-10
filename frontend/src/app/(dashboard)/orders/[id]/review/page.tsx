'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110"
          style={{ color: star <= (hovered || value) ? '#f97316' : '#4b5563' }}
        >
          &#9733;
        </button>
      ))}
    </div>
  )
}

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    grillRating: 0,
    boutiqueRating: 0,
    grillComment: '',
    boutiqueComment: '',
  })

  useEffect(() => {
    const t = getToken()
    if (!t) { router.push('/login'); return }
    fetch(BASE + '/orders/' + orderId, { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json())
      .then(d => {
        if (d.review) { router.push('/orders/' + orderId); return }
        if (d.status !== 'COMPLETED') { router.push('/orders/' + orderId); return }
        setOrder(d)
      })
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false))
  }, [orderId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.grillRating === 0) { alert('Avalie o churrasqueiro'); return }
    setSubmitting(true)
    try {
      const body: any = {
        orderId,
        grillRating: form.grillRating,
        grillComment: form.grillComment || undefined,
      }
      if (order?.boutiqueId && form.boutiqueRating > 0) {
        body.boutiqueRating = form.boutiqueRating
        body.boutiqueComment = form.boutiqueComment || undefined
      }
      const res = await fetch(BASE + '/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/orders/' + orderId), 2000)
      } else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao enviar avaliacao'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-gray-400 p-8 text-center">Carregando...</div>
  if (!order) return null

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">&#9733;</div>
        <h2 className="text-xl font-bold text-white mb-2">Avaliacao enviada!</h2>
        <p className="text-gray-400">Obrigado pelo feedback. Redirecionando...</p>
      </div>
    )
  }

  const gmName = order.grillmaster?.user?.name || 'Churrasqueiro'
  const boutiqueName = order.boutique?.name

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={'/orders/' + orderId} className="text-gray-400 hover:text-white transition-colors">
          &#8592;
        </Link>
        <h1 className="text-2xl font-bold">Avaliar Pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="font-semibold text-lg mb-4 text-white">Churrasqueiro: {gmName}</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Nota *</label>
            <StarRating value={form.grillRating} onChange={v => setForm(f => ({ ...f, grillRating: v }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Comentario (opcional)</label>
            <textarea
              value={form.grillComment}
              onChange={e => setForm(f => ({ ...f, grillComment: e.target.value }))}
              placeholder="Como foi a experiencia com o grillmaster?"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-sm resize-none h-24 border border-gray-700 focus:border-orange-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {boutiqueName && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="font-semibold text-lg mb-4 text-white">Acougue: {boutiqueName}</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Nota (opcional)</label>
              <StarRating value={form.boutiqueRating} onChange={v => setForm(f => ({ ...f, boutiqueRating: v }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Comentario (opcional)</label>
              <textarea
                value={form.boutiqueComment}
                onChange={e => setForm(f => ({ ...f, boutiqueComment: e.target.value }))}
                placeholder="Como foram os cortes e o servico do acougue?"
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-sm resize-none h-24 border border-gray-700 focus:border-orange-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || form.grillRating === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
        >
          {submitting ? 'Enviando...' : 'Enviar Avaliacao'}
        </button>
      </form>
    </div>
  )
}
