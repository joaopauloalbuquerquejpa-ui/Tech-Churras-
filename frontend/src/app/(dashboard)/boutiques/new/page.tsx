'use client'
import { API_URL } from '@/lib/api'
import { useRef, useState } from 'react'
import Link from 'next/link'
import ContractModal from '@/components/ContractModal'

async function generateBoutiqueDesc(token: string, params: { name: string; city?: string; specialties?: string }): Promise<string> {
  const res = await fetch(API_URL + '/ai/generate-bio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ role: 'boutique', ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao gerar descrição')
  return data.bio as string
}

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
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

export default function NewBoutiquePage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [boutiqueAddress, setBoutiqueAddress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [descLoading, setDescLoading] = useState(false)
  const [descError, setDescError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    state: '',
    phone: '',
    address: '',
    instagram: '',
    openingHours: '',
    deliveryOrPickup: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [facadeFile, setFacadeFile] = useState<File | null>(null)
  const [facadePreview, setFacadePreview] = useState<string | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  const logoRef = useRef<HTMLInputElement>(null)
  const facadeRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleFacade(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFacadeFile(file)
    setFacadePreview(URL.createObjectURL(file))
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
    if (!form.name || !form.city || !form.state) {
      alert('Preencha todos os campos obrigatorios')
      return
    }
    setLoading(true)
    setUploadError('')
    try {
      const token = getToken()
      let logoUrl: string | undefined
      let facadeUrl: string | undefined
      let galleryUrls: string[] = []

      if (logoFile) logoUrl = await uploadImage(logoFile, token)
      if (facadeFile) facadeUrl = await uploadImage(facadeFile, token)
      if (galleryFiles.length > 0) {
        galleryUrls = await Promise.all(galleryFiles.map(f => uploadImage(f, token)))
      }

      const body: Record<string, unknown> = {
        ...form,
        instagram: form.instagram || undefined,
        openingHours: form.openingHours || undefined,
        deliveryOrPickup: form.deliveryOrPickup || undefined,
        galleryUrls,
      }
      if (logoUrl) body.logoUrl = logoUrl
      if (facadeUrl) body.facadeUrl = facadeUrl

      const res = await fetch(API_URL + '/boutiques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const created = await res.json()
        const addr = [created.address, created.city, created.state].filter(Boolean).join(', ')
        setBoutiqueAddress(addr)
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
          <h2 className="text-xl font-bold mb-2">Acougue enviado!</h2>
          <p className="text-gray-400 mb-6">Aguarde a aprovacao do administrador para aparecer na listagem.</p>
          <Link href="/boutiques/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg inline-block font-medium">
            Ir para o painel
          </Link>
        </div>
      </div>
    )
  }

  if (showContract) {
    return (
      <ContractModal
        partnerType="BOUTIQUE"
        partnerAddress={boutiqueAddress}
        onAccepted={() => { setShowContract(false); setSuccess(true) }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/boutiques" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">&larr; Voltar</Link>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Acougue</h1>

      <div className="space-y-6">
        {/* Logo + Facade */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Fotos do estabelecimento</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Logo */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Logo (quadrado)</p>
              <div
                onClick={() => logoRef.current?.click()}
                className="aspect-square rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-orange-500 cursor-pointer flex items-center justify-center transition-colors"
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <span className="text-gray-500 text-sm text-center px-3">Adicionar logo</span>
                }
              </div>
              <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogo} className="hidden" />
            </div>
            {/* Facade */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Fachada (16:9)</p>
              <div
                onClick={() => facadeRef.current?.click()}
                className="aspect-video rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-orange-500 cursor-pointer flex items-center justify-center transition-colors"
              >
                {facadePreview
                  ? <img src={facadePreview} alt="fachada" className="w-full h-full object-cover" />
                  : <span className="text-gray-500 text-sm text-center px-3">Adicionar fachada</span>
                }
              </div>
              <input ref={facadeRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFacade} className="hidden" />
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Galeria (ate 6 fotos)</h2>
          <div className="grid grid-cols-3 gap-3">
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
            <label className="block text-sm text-gray-400 mb-1">Nome do acougue *</label>
            <input type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-gray-400">Descricao</label>
              <button
                type="button"
                onClick={async () => {
                  if (!form.name) return
                  const token = getToken()
                  if (!token) return
                  setDescLoading(true)
                  setDescError('')
                  try {
                    const desc = await generateBoutiqueDesc(token, {
                      name: form.name,
                      city: form.city,
                      specialties: [form.address, form.deliveryOrPickup].filter(Boolean).join(' — ') || undefined,
                    })
                    setForm(f => ({ ...f, description: desc }))
                  } catch (err: any) {
                    setDescError(err.message || 'Erro ao gerar descricao com IA — escreva manualmente')
                  } finally { setDescLoading(false) }
                }}
                disabled={descLoading || !form.name}
                className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 flex items-center gap-1"
              >
                {descLoading ? 'Gerando...' : '✨ Gerar com IA'}
              </button>
            </div>
            {descError && <p className="text-xs text-red-400 mb-1">{descError}</p>}
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Conte sobre o acougue..."
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white h-24 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Endereco</label>
            <input type="text" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Rua, numero, bairro"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
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
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
          </div>
        </div>

        {/* Extra */}
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Detalhes operacionais</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Horario de funcionamento</label>
            <input type="text" value={form.openingHours}
              onChange={e => setForm({ ...form, openingHours: e.target.value })}
              placeholder="Seg-Sex 8h-18h, Sab 8h-13h"
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modalidade</label>
            <select value={form.deliveryOrPickup}
              onChange={e => setForm({ ...form, deliveryOrPickup: e.target.value })}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white">
              <option value="">Selecione...</option>
              <option value="Entrega">Entrega</option>
              <option value="Retirada">Retirada</option>
              <option value="Ambos">Entrega e Retirada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Instagram</label>
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
              <span className="px-3 text-gray-500 text-sm">@</span>
              <input type="text" value={form.instagram}
                onChange={e => setForm({ ...form, instagram: e.target.value.replace('@', '') })}
                placeholder="seu_acougue"
                className="flex-1 bg-transparent py-2 pr-3 text-white outline-none" />
            </div>
          </div>
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