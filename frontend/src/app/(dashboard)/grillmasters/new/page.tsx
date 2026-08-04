'use client'
import { API_URL } from '@/lib/api'
import { useRef, useState } from 'react'
import Link from 'next/link'
import ContractModal from '@/components/ContractModal'
import { VoiceDictateButton } from '@/components/VoiceDictateButton'

async function generateBio(token: string, params: { name?: string; city?: string; specialties?: string; churrascoStyle?: string; experience?: number }): Promise<string> {
  const res = await fetch(API_URL + '/ai/generate-bio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ role: 'grillmaster', ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao gerar bio')
  return data.bio as string
}


function getToken() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

function getAuthName(): string {
  const raw = localStorage.getItem('auth-storage')
  return raw ? (JSON.parse(raw)?.state?.user?.name ?? '') : ''
}

async function uploadImage(file: File, token: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(API_URL + '/upload/image', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')
  return data.url as string
}

const STYLES = ['Gaucho', 'Mineiro', 'Espetinho', 'Vegano', 'Misto', 'Outro']

function suggestPrice(city: string, state: string, specialties: string, experience: number): { min: number; max: number; suggested: number } | null {
  if (!city.trim() || !state.trim()) return null
  const st = state.toUpperCase()
  const ct = city.toLowerCase()
  const sp = specialties.toLowerCase()
  const isCapitalSP = ct.includes('são paulo') || ct.includes('sao paulo')
  const isPremium = /dry.aged|wagyu|angus|prime|tomahawk|cordeiro|internacional/i.test(sp)
  // Faixa de mercado: R$100–R$160/h para tração inicial
  let base = 100
  if (isCapitalSP) base = 120
  if (isPremium) base = Math.min(base + 20, 140)
  if (experience >= 10) base = Math.min(base + 20, 160)
  else if (experience >= 5) base = Math.min(base + 10, 150)
  base = Math.round(base / 10) * 10
  return { min: 100, max: 160, suggested: base }
}

export default function NewGrillmasterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [gmAddress, setGmAddress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [bioLoading, setBioLoading] = useState(false)
  const [bioError, setBioError] = useState('')
  const [form, setForm] = useState({
    bio: '',
    experience: 1,
    pricePerHour: 0,
    city: '',
    state: '',
    specialties: '',

    instagram: '',
    churrascoStyle: '',
    bringsEquipment: false,
    minGuests: '',
    maxGuests: '',
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  const photoRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 6 - galleryFiles.length
    const toAdd = files.slice(0, remaining)
    setGalleryFiles(prev => [...prev, ...toAdd])
    setGalleryPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeGallery(idx: number) {
    setGalleryFiles(prev => prev.filter((_, i) => i !== idx))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!form.bio || !form.city || !form.state || form.pricePerHour <= 0) {
      alert('Preencha todos os campos obrigatorios')
      return
    }
    setLoading(true)
    setUploadError('')
    try {
      const token = getToken()
      let photoUrl: string | undefined
      let galleryUrls: string[] = []

      if (photoFile) {
        photoUrl = await uploadImage(photoFile, token)
      }
      if (galleryFiles.length > 0) {
        galleryUrls = await Promise.all(galleryFiles.map(f => uploadImage(f, token)))
      }

      const body: Record<string, unknown> = {
        ...form,
        experience: Number(form.experience),
        pricePerHour: Number(form.pricePerHour),
        minGuests: form.minGuests ? Number(form.minGuests) : undefined,
        maxGuests: form.maxGuests ? Number(form.maxGuests) : undefined,
        instagram: form.instagram || undefined,
        churrascoStyle: form.churrascoStyle || undefined,
        galleryUrls,
      }
      if (photoUrl) body.photoUrl = photoUrl

      const res = await fetch(API_URL + '/grillmasters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const created = await res.json()
        setGmAddress([created.city, created.state].filter(Boolean).join(' — '))
        setShowContract(true)
      } else {
        const err = await res.json()
        alert('Erro: ' + (err.error || 'ao cadastrar'))
      }
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-2xl font-bold">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Perfil enviado!</h2>
          <p className="text-gray-400 mb-6">Aguarde a aprovacao do administrador para aparecer na listagem.</p>
          <Link href="/grillmasters/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg inline-block font-medium">
            Ir para meu painel
          </Link>
        </div>
      </div>
    )
  }

  if (showContract) {
    return (
      <ContractModal
        partnerType="GRILLMASTER"
        partnerAddress={gmAddress}
        onAccepted={() => { setShowContract(false); setSuccess(true) }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/grillmasters" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">&larr; Voltar</Link>
      <h1 className="text-2xl font-bold mb-6">Cadastrar como Churrasqueiro</h1>

      <div className="space-y-6">
        {/* Photo */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Foto de perfil</h2>
          <div className="flex items-center gap-6">
            <div
              onClick={() => photoRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-orange-500 cursor-pointer flex items-center justify-center transition-colors shrink-0"
            >
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                : <span className="text-gray-500 text-xs text-center px-2">Adicionar foto</span>
              }
            </div>
            <div className="text-sm text-gray-500">
              <p>JPG, PNG ou WebP</p>
              <p>Maximo 5MB</p>
              <button onClick={() => photoRef.current?.click()} className="mt-2 text-orange-400 hover:text-orange-300 underline text-sm">
                {photoPreview ? 'Trocar foto' : 'Escolher foto'}
              </button>
            </div>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Galeria (ate 6 fotos)</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {galleryPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeGallery(i)}
                  className="absolute top-1 right-1 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs hover:bg-red-600"
                >&#215;</button>
              </div>
            ))}
            {galleryFiles.length < 6 && (
              <div
                onClick={() => galleryRef.current?.click()}
                className="aspect-square rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 hover:border-orange-500 cursor-pointer flex items-center justify-center transition-colors"
              >
                <span className="text-gray-500 text-2xl">+</span>
              </div>
            )}
          </div>
          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGallery} className="hidden" />
        </div>

        {/* Basic info */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Informacoes basicas</h2>
          <div>
            <div className="flex items-center justify-between mb-1 gap-2">
              <label className="block text-sm text-gray-400">Bio *</label>
              <div className="flex items-center gap-3">
                <VoiceDictateButton
                  token={getToken() || ''}
                  label="Ditar bio"
                  onTranscribed={text => setForm(f => ({ ...f, bio: f.bio ? f.bio + ' ' + text : text }))}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const token = getToken()
                    if (!token) return
                    setBioLoading(true)
                    setBioError('')
                    try {
                      const bio = await generateBio(token, {
                        name: getAuthName(),
                        city: form.city,
                        specialties: form.specialties,
                        churrascoStyle: form.churrascoStyle,
                        experience: form.experience,
                      })
                      setForm(f => ({ ...f, bio }))
                    } catch (err: any) {
                      setBioError(err.message || 'Erro ao gerar bio com IA — escreva manualmente')
                    } finally { setBioLoading(false) }
                  }}
                  disabled={bioLoading || (!form.city && !form.specialties)}
                  title={!form.city && !form.specialties ? 'Preencha cidade ou especialidades primeiro' : ''}
                  className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {bioLoading ? 'Gerando...' : '✨ Gerar com IA'}
                </button>
              </div>
            </div>
            {bioError && <p className="text-xs text-red-400 mb-1">{bioError}</p>}
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Conte sobre sua experiencia com churrasco..."
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-28 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cidade *</label>
              <input type="text" value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Estado *</label>
              <input type="text" maxLength={2} placeholder="SP" value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Especialidades</label>
            <input type="text" value={form.specialties}
              onChange={e => setForm({ ...form, specialties: e.target.value })}
              placeholder="Picanha, costela, frango, dry-aged..."
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Anos de experiencia *</label>
            <input type="number" min={0} value={form.experience}
              onChange={e => setForm({ ...form, experience: +e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
          </div>
          {(() => {
            const s = suggestPrice(form.city, form.state, form.specialties, form.experience)
            if (!s) return null
            const liquidoEvento4h = Math.round(s.suggested * 4 * 0.93)
            return (
              <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-2">Sugestão de valor</p>
                <p className="text-sm text-gray-300 mb-1">
                  Churrasqueiros com seu perfil em <span className="text-white font-medium">{form.city}</span> cobram entre{' '}
                  <span className="text-white font-bold">R$ {s.min}–R$ {s.max}/hora</span>.
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Num evento de 4h você receberia <span className="text-green-400 font-semibold">R$ {liquidoEvento4h} líquido</span> (93% de R$ {s.suggested * 4})
                </p>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pricePerHour: s.suggested }))}
                  className="text-xs bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Usar R$ {s.suggested}/hora
                </button>
              </div>
            )
          })()}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mao de obra por hora (R$) *</label>
            <input type="number" min={0} step="1" value={form.pricePerHour || ''}
              placeholder={suggestPrice(form.city, form.state, form.specialties, form.experience)?.suggested?.toString() || '0'}
              onChange={e => setForm({ ...form, pricePerHour: +e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
            <p className="text-xs text-gray-600 mt-1">A plataforma retém 7% — você recebe 93% deste valor por hora trabalhada.</p>
          </div>
        </div>

        {/* Extra info */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Detalhes do servico</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estilo de churrasco</label>
            <select value={form.churrascoStyle}
              onChange={e => setForm({ ...form, churrascoStyle: e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white">
              <option value="">Selecione...</option>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Instagram</label>
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
              <span className="px-3 text-gray-500 text-sm">@</span>
              <input type="text" value={form.instagram}
                onChange={e => setForm({ ...form, instagram: e.target.value.replace('@', '') })}
                placeholder="seu_usuario"
                className="flex-1 bg-transparent py-2 pr-3 text-white outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min. convidados</label>
              <input type="number" min={1} value={form.minGuests}
                onChange={e => setForm({ ...form, minGuests: e.target.value })}
                placeholder="ex: 10"
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max. convidados</label>
              <input type="number" min={1} value={form.maxGuests}
                onChange={e => setForm({ ...form, maxGuests: e.target.value })}
                placeholder="ex: 100"
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm({ ...form, bringsEquipment: !form.bringsEquipment })}
              className={`w-12 h-6 rounded-full transition-colors ${form.bringsEquipment ? 'bg-orange-500' : 'bg-gray-700'} relative`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.bringsEquipment ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-300">Levo meu proprio equipamento</span>
          </label>
        </div>

        {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-xl font-bold text-white"
        >
          {loading ? 'Enviando...' : 'Enviar para aprovacao'}
        </button>
      </div>
    </div>
  )
}