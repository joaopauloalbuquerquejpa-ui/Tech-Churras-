'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const BASE = 'https://tech-churras-production.up.railway.app'

interface GalleryItem {
  id: string
  photos: string[]
  grillComment: string | null
  grillRating: number | null
  grillmasterName: string | null
  city: string | null
  eventDate: string | null
}

export default function GaleriaClient() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [modal, setModal] = useState<{ item: GalleryItem; photoIndex: number } | null>(null)

  const fetchPage = useCallback(async (p: number, append = false) => {
    try {
      const res = await fetch(BASE + '/public/gallery?page=' + p)
      const data = await res.json()
      setItems(prev => append ? [...prev, ...data.items] : data.items)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { fetchPage(1) }, [fetchPage])

  function loadMore() {
    setLoadingMore(true)
    fetchPage(page + 1, true)
  }

  function openModal(item: GalleryItem, photoIndex = 0) { setModal({ item, photoIndex }) }
  function closeModal() { setModal(null) }
  function prevPhoto() {
    if (!modal) return
    const newIdx = (modal.photoIndex - 1 + modal.item.photos.length) % modal.item.photos.length
    setModal({ ...modal, photoIndex: newIdx })
  }
  function nextPhoto() {
    if (!modal) return
    const newIdx = (modal.photoIndex + 1) % modal.item.photos.length
    setModal({ ...modal, photoIndex: newIdx })
  }

  const hasMore = items.length < total

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-10 pb-8 text-center">
        <p className="text-xs font-semibold text-orange-400 tracking-widest uppercase mb-3">Galeria</p>
        <h1 className="text-3xl sm:text-4xl font-black mb-3">Churrascos incríveis realizados</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Veja o que nossos churrasqueiros profissionais já fizeram. Inspire-se e agende o seu.
        </p>
        <Link href="/login" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
          Quero um churrasco assim!
        </Link>
      </div>

      {/* Gallery grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">Nenhuma foto ainda</p>
            <p className="text-gray-600 text-sm">Seja o primeiro a registrar seu churrasco!</p>
            <Link href="/login" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              Agendar churrasco
            </Link>
          </div>
        ) : (
          <>
            {/* Masonry-style grid using columns */}
            <div className="columns-2 sm:columns-3 gap-3 space-y-0">
              {items.map(item => (
                <div key={item.id} className="break-inside-avoid mb-3">
                  <button onClick={() => openModal(item)} className="w-full text-left group relative overflow-hidden rounded-xl block cursor-pointer">
                    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                      <Image
                        src={item.photos[0]}
                        alt={item.grillComment || 'Churrasco'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {item.grillmasterName && <p className="text-white text-xs font-semibold truncate">{item.grillmasterName}</p>}
                        {item.city && <p className="text-gray-300 text-xs truncate">{item.city}</p>}
                      </div>
                    </div>
                    {/* Multiple photos badge */}
                    {item.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-1.5 py-0.5 text-xs text-white">
                        1/{item.photos.length}
                      </div>
                    )}
                    {/* Rating */}
                    {item.grillRating && (
                      <div className="absolute top-2 left-2 bg-orange-500/90 rounded-lg px-1.5 py-0.5 text-xs text-white font-bold">
                        ★ {item.grillRating}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={loadingMore} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors">
                  {loadingMore ? 'Carregando...' : 'Ver mais fotos'}
                </button>
              </div>
            )}

            {/* CTA bottom */}
            <div className="mt-12 bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-6 text-center">
              <p className="text-white font-bold text-lg mb-2">Quer um churrasco assim?</p>
              <p className="text-gray-400 text-sm mb-4">Churrasqueiros profissionais disponíveis para o seu evento</p>
              <Link href="/login" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                Agendar agora
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={closeModal} className="absolute -top-10 right-0 text-gray-400 hover:text-white text-2xl font-light">✕</button>

            {/* Photo */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
              <Image
                src={modal.item.photos[modal.photoIndex]}
                alt={modal.item.grillComment || 'Churrasco'}
                fill
                className="object-cover"
                sizes="100vw"
              />
              {/* Nav arrows */}
              {modal.item.photos.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg">‹</button>
                  <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg">›</button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {modal.item.photos.map((_, i) => (
                      <span key={i} className={'w-1.5 h-1.5 rounded-full ' + (i === modal.photoIndex ? 'bg-white' : 'bg-white/40')} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Caption */}
            <div className="mt-3 px-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                {modal.item.grillmasterName && <p className="font-semibold text-white text-sm">{modal.item.grillmasterName}</p>}
                {modal.item.grillRating && <span className="text-orange-400 font-bold text-sm">★ {modal.item.grillRating}/5</span>}
              </div>
              {modal.item.grillComment && <p className="text-gray-400 text-sm italic">"{modal.item.grillComment}"</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                {modal.item.city && <span>{modal.item.city}</span>}
                {modal.item.eventDate && <span>{new Date(modal.item.eventDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>}
              </div>
            </div>

            <Link href="/login" onClick={closeModal} className="mt-4 block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Quero um churrasco assim!
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
