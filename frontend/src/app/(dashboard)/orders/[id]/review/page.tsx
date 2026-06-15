'use client'
import { useEffect, useRef, useState } from 'react'
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [referralCopied, setReferralCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    grillRating: 0,
    boutiqueRating: 0,
    grillComment: '',
    boutiqueComment: '',
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth-storage')
      const uid = raw ? JSON.parse(raw)?.state?.user?.id : null
      if (uid) setCurrentUserId(uid)
    } catch {}
  }, [])

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photoFiles.length)
    if (!files.length) return
    const newFiles = [...photoFiles, ...files].slice(0, 3)
    setPhotoFiles(newFiles)
    const previews = newFiles.map(f => URL.createObjectURL(f))
    setPhotoPreviews(previews)
  }

  function removePhoto(index: number) {
    const newFiles = photoFiles.filter((_, i) => i !== index)
    const newPreviews = photoPreviews.filter((_, i) => i !== index)
    setPhotoFiles(newFiles)
    setPhotoPreviews(newPreviews)
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < photoFiles.length; i++) {
      setUploadProgress(`Enviando foto ${i + 1}/${photoFiles.length}...`)
      const fd = new FormData()
      fd.append('file', photoFiles[i])
      const res = await fetch(BASE + '/reviews/upload-photo', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: fd,
      })
      if (res.ok) {
        const { url } = await res.json()
        urls.push(url)
      }
    }
    setUploadProgress('')
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.grillRating === 0) { alert('Avalie o churrasqueiro'); return }
    setSubmitting(true)
    try {
      let photoUrls: string[] = []
      if (photoFiles.length > 0) {
        photoUrls = await uploadPhotos()
      }
      const body: any = {
        orderId,
        grillRating: form.grillRating,
        grillComment: form.grillComment || undefined,
        photos: photoUrls,
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
    const gmName = order?.grillmaster?.user?.name ?? 'churrasqueiro'
    const shareMsg = `🔥 Acabo de avaliar o churrasco do ${gmName} via Tech Churras!\n\nSe você ainda não conhece, é a melhor forma de contratar churrasqueiros profissionais 🥩✨\n\nhttps://www.techchurras.com.br`
    const referralUrl = currentUserId ? `https://www.techchurras.com.br/convite/${currentUserId}` : null
    const referralMsg = referralUrl
      ? `🔥 Contratei um churrasqueiro profissional pelo Tech Churras e foi incrível!\n\nUse meu link e ganhe 10% OFF no seu primeiro churrasco:\n${referralUrl}`
      : null

    async function copyReferral() {
      if (!referralUrl) return
      await navigator.clipboard.writeText(referralUrl)
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2500)
    }

    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-white mb-2">Avaliação enviada! Obrigado!</h2>
          <p className="text-gray-400 text-sm">Sua opinião ajuda outros clientes a escolher os melhores churrasqueiros.</p>
        </div>

        {referralUrl && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-white mb-1">Indique um amigo e ele ganha 10% OFF!</h3>
            <p className="text-gray-400 text-xs mb-4">Compartilhe seu link exclusivo. Seu amigo recebe desconto na primeira contratação.</p>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 truncate font-mono">
                {referralUrl}
              </div>
              <button
                onClick={copyReferral}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors shrink-0"
              >
                {referralCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <button
              onClick={() => referralMsg && window.open(`https://wa.me/?text=${encodeURIComponent(referralMsg)}`, '_blank')}
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
              Enviar pelo WhatsApp
            </button>
          </div>
        )}

        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank')}
          className="flex items-center justify-center gap-2 w-full border border-green-700 hover:bg-green-900/30 text-green-400 font-medium py-3 rounded-xl transition-colors mb-3 text-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.9 2C6.458 2 2.015 6.443 2.015 11.885c0 1.778.468 3.51 1.36 5.034L2 22l5.225-1.372a9.86 9.86 0 004.675 1.187C17.342 21.815 22 17.385 22 11.9 22 6.458 17.342 2 11.9 2z"/></svg>
          Compartilhar minha avaliação
        </button>

        <Link href={'/orders/' + orderId}
          className="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Voltar ao pedido →
        </Link>
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

        {/* Photo upload */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="font-semibold text-base mb-3 text-white">Fotos do churrasco (opcional)</h2>
          <p className="text-xs text-gray-500 mb-4">Adicione ate 3 fotos do seu evento</p>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 text-white text-xs rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {photoFiles.length < 3 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-700 hover:border-orange-500/50 rounded-xl py-4 text-gray-500 hover:text-gray-300 text-sm transition-colors flex flex-col items-center gap-1"
              >
                <span className="text-2xl">📷</span>
                <span>Adicionar foto ({photoFiles.length}/3)</span>
              </button>
            </>
          )}
        </div>

        {uploadProgress && (
          <p className="text-sm text-orange-400 text-center">{uploadProgress}</p>
        )}

        <button
          type="submit"
          disabled={submitting || form.grillRating === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
        >
          {submitting ? (uploadProgress || 'Enviando...') : 'Enviar Avaliacao'}
        </button>
      </form>
    </div>
  )
}
