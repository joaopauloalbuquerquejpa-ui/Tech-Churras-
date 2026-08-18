'use client'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'
import { Badge, type BadgeTone } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { PersonIcon } from '@/components/icons/Icons'

function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  phoneVerified: boolean
  role: string
  points: number
  createdAt: string
  _count: { orders: number }
}

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Cliente',
  GRILLMASTER: 'Churrasqueiro',
  BOUTIQUE: 'Açougue',
  ADMIN: 'Admin',
}
const ROLE_TONE: Record<string, BadgeTone> = {
  CUSTOMER: 'neutral',
  GRILLMASTER: 'orange',
  BOUTIQUE: 'green',
  ADMIN: 'blue',
}

const TAKE = 25

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [skip, setSkip] = useState(0)

  useEffect(() => { setSkip(0) }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ skip: String(skip), take: String(TAKE) })
    if (search.trim()) params.set('search', search.trim())
    fetch(`${API_URL}/admin/users?${params}`, { headers: { Authorization: 'Bearer ' + getToken() } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setUsers(Array.isArray(data) ? data : (data.data ?? []))
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, skip])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput) }}
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />
        <button
          onClick={() => setSearch(searchInput)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Buscar
        </button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput('') }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            Limpar
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500 text-sm">Carregando...</p>}

      {!loading && users.length === 0 && (
        <EmptyState icon={<PersonIcon size={22} />} message="Nenhum usuário encontrado." />
      )}

      {!loading && users.length > 0 && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-2">Nome</th>
                  <th className="text-left px-4 py-2">Contato</th>
                  <th className="text-left px-4 py-2">Papel</th>
                  <th className="text-right px-4 py-2">Pedidos</th>
                  <th className="text-right px-4 py-2 hidden md:table-cell">Pontos</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {u.phone ?? '—'}
                      {u.phone && (
                        <span className={'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ' + (u.phoneVerified ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400')}>
                          {u.phoneVerified ? 'verificado' : 'não verificado'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={ROLE_TONE[u.role] ?? 'neutral'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300">{u._count.orders}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400 hidden md:table-cell">{u.points}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > TAKE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">{skip + 1}–{Math.min(skip + TAKE, total)} de {total}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSkip(s => Math.max(0, s - TAKE))}
              disabled={skip === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-1.5 rounded-lg"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSkip(s => s + TAKE)}
              disabled={skip + TAKE >= total}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-1.5 rounded-lg"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
