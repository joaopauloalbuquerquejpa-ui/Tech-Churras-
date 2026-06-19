'use client'
import { API_URL } from '@/lib/api'
import { useRef, useState } from 'react'


function getToken() {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw)?.state?.token : null
}

interface Props {
  partnerType: 'BOUTIQUE' | 'GRILLMASTER'
  partnerAddress?: string
  onAccepted: () => void
}

type Step = 'form' | 'reading' | 'done'

export default function ContractModal({ partnerType, partnerAddress, onAccepted }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [duration, setDuration] = useState<6 | 12>(12)
  const [document, setDocument] = useState('')
  const [address, setAddress] = useState(partnerAddress || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractId, setContractId] = useState('')
  const [contractText, setContractText] = useState('')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    if (!document.trim()) { setError('Informe seu CPF ou CNPJ'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(API_URL + '/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ durationMonths: duration, partnerDocument: document.trim(), partnerAddress: address.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar contrato')
      setContractId(data.id)
      setContractText(data.contractText)
      setStep('reading')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) setScrolledToBottom(true)
  }

  async function handleAccept() {
    if (!accepted) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL + `/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar aceite')
      setStep('done')
      setTimeout(onAccepted, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isGrillmaster = partnerType === 'GRILLMASTER'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-400 font-bold text-lg">Contrato de Parceria</span>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
              MINUTA — REV. JURÍDICA PENDENTE
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {isGrillmaster ? 'Churrasqueiro (Grillmaster)' : 'Açougue (Boutique)'} · Aceite eletrônico com registro de evidência
          </p>
        </div>

        {/* Legal warning banner */}
        <div className="mx-5 mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
          <p className="text-xs text-yellow-300 leading-relaxed">
            ⚠️ Este contrato está em fase de revisão jurídica e pode ser atualizado antes do lançamento oficial da plataforma. O aceite eletrônico é registrado com timestamp e IP como evidência, mas <strong>sem validade jurídica plena</strong> até aprovação do advogado responsável.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'form' && (
            <div className="space-y-5">
              {/* Duration */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-3">Prazo de vigência</p>
                <div className="grid grid-cols-2 gap-3">
                  {([6, 12] as const).map(months => (
                    <button
                      key={months}
                      onClick={() => setDuration(months)}
                      className={`rounded-xl p-4 border-2 text-left transition-all ${
                        duration === months
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-xl font-bold text-white">{months} meses</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {months === 6 ? 'Contrato semestral' : 'Contrato anual · mais popular'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {isGrillmaster ? 'CPF *' : 'CPF / CNPJ *'}
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={e => setDocument(e.target.value)}
                  placeholder={isGrillmaster ? '000.000.000-00' : '000.000.000-00 ou 00.000.000/0001-00'}
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600"
                />
              </div>

              {/* Address (optional override) */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Endereço completo {!isGrillmaster && '(pré-preenchido do cadastro)'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade — UF"
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-xl font-bold text-white transition-colors"
              >
                {loading ? 'Gerando contrato...' : 'Gerar meu contrato'}
              </button>
            </div>
          )}

          {step === 'reading' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Leia o contrato abaixo na íntegra. O botão de aceite é habilitado ao chegar ao final.
              </p>

              {/* Contract text */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="bg-gray-950 rounded-xl p-4 h-72 overflow-y-auto font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border border-gray-800"
              >
                {contractText}
              </div>

              {!scrolledToBottom && (
                <p className="text-xs text-gray-500 text-center">Role até o final para habilitar o aceite</p>
              )}

              {scrolledToBottom && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={e => setAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"
                  />
                  <span className="text-sm text-gray-300">
                    Li e compreendi o contrato na íntegra e aceito seus termos, ciente de que se trata de uma minuta pendente de revisão jurídica.
                  </span>
                </label>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleAccept}
                disabled={!accepted || loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-white transition-colors"
              >
                {loading ? 'Registrando aceite...' : 'Aceitar contrato'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-2xl font-bold">&#10003;</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Contrato aceito!</h3>
              <p className="text-gray-400 text-sm">Aceite registrado com sucesso. Redirecionando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}