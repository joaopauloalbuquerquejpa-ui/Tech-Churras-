'use client'
import { API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Tester {
  id: string
  name: string
  whatsapp: string
  createdAt: string
}

export default function AdminAlphaPage() {
  const [testers, setTesters] = useState<Tester[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/admin/alpha-testers`, {
      headers: { Authorization: 'Bearer ' + getToken() },
    })
      .then(r => r.json())
      .then(data => { setTesters(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Admin</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-bold">Testadores Alpha</h1>
        <span className="ml-2 bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
          {testers.length} cadastros
        </span>
      </div>

      <div className="mb-4 p-4 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400">
        <p>Link de opt-in Play Store:{' '}
          <a
            href="https://play.google.com/apps/internaltest/4701438334176936500"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:underline break-all"
          >
            play.google.com/apps/internaltest/4701438334176936500
          </a>
        </p>
        <p className="mt-1">Página de recrutamento: <Link href="/alpha" className="text-orange-400 hover:underline">/alpha</Link></p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Carregando...</p>
      ) : testers.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">Nenhum cadastro ainda. Compartilhe a página <strong>/alpha</strong>.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">WhatsApp</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Cadastrado em</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Ação</th>
              </tr>
            </thead>
            <tbody>
              {testers.map((t, i) => (
                <tr key={t.id} className={'border-b border-gray-800/60 hover:bg-gray-800/30 ' + (i % 2 === 0 ? '' : 'bg-gray-800/10')}>
                  <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{t.whatsapp}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmt(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/55${t.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
