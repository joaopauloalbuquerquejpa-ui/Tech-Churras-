'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function AdminSegurancaPage() {
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadStatus() {
    setLoading(true)
    try {
      const { data } = await api.get('/auth/me')
      setTotpEnabled(!!data.totpEnabled)
    } catch {
      setError('Não foi possível carregar o status de segurança')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStatus() }, [])

  async function handleStartSetup() {
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/auth/2fa/setup')
      setSetupData(data)
    } catch {
      setError('Falha ao gerar o QR Code. Tente novamente.')
    }
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/auth/2fa/enable', { code })
      setSuccess('2FA ativado! Da próxima vez que você entrar, o código será exigido.')
      setSetupData(null)
      setCode('')
      await loadStatus()
    } catch {
      setError('Código inválido. Confira o app autenticador e tente de novo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/auth/2fa/disable', { code })
      setSuccess('2FA desativado.')
      setCode('')
      await loadStatus()
    } catch {
      setError('Código inválido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-1">Segurança da conta</h1>
      <p className="text-gray-500 text-sm mb-6">Verificação em duas etapas (TOTP) para o login de admin.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm">{success}</div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : totpEnabled ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-300 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
            2FA está <b className="text-white">ativado</b> nesta conta.
          </p>
          <form onSubmit={handleDisable} className="space-y-3">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block">
              Digite um código atual para desativar
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-gray-950 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none tracking-[0.5em] text-center"
              placeholder="000000"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Desativando...' : 'Desativar 2FA'}
            </button>
          </form>
        </div>
      ) : setupData ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-300 mb-4">
            Escaneie o QR Code com Google Authenticator, Authy ou similar. Depois, digite o código gerado para confirmar.
          </p>
          <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
            <img src={setupData.qrCode} alt="QR Code 2FA" width={200} height={200} />
          </div>
          <p className="text-xs text-gray-500 mb-4 break-all">
            Não conseguiu escanear? Chave manual: <span className="text-gray-300 font-mono">{setupData.secret}</span>
          </p>
          <form onSubmit={handleEnable} className="space-y-3">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block">
              Código do app autenticador
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-gray-950 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none tracking-[0.5em] text-center text-lg"
              placeholder="000000"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
              style={{ background: 'linear-gradient(135deg, rgb(194,54,22) 0%, rgb(158,45,18) 100%)' }}
            >
              {submitting ? 'Confirmando...' : 'Confirmar e ativar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-300 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-600 mr-2" />
            2FA está <b className="text-white">desativado</b>. Ative para exigir um código do celular além da senha.
          </p>
          <button
            onClick={handleStartSetup}
            className="w-full text-white font-bold py-3 rounded-xl transition-colors"
            style={{ background: 'linear-gradient(135deg, rgb(194,54,22) 0%, rgb(158,45,18) 100%)' }}
          >
            Ativar 2FA
          </button>
        </div>
      )}
    </div>
  )
}
