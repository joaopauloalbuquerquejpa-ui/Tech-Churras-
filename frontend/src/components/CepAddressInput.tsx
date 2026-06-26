'use client'
import { useState } from 'react'

interface Props {
  onAddressChange: (address: string) => void
  required?: boolean
}

interface ViaCepResult {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

function buildAddress(street: string, numero: string, bairro: string, cidade: string, uf: string) {
  return [street, numero, bairro, `${cidade} - ${uf}`].filter(Boolean).join(', ')
}

export function CepAddressInput({ onAddressChange, required }: Props) {
  const [cep, setCep] = useState('')
  const [numero, setNumero] = useState('')
  const [street, setStreet] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const [manual, setManual] = useState(false)

  async function lookupCep(digits: string) {
    setStatus('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data: ViaCepResult = await res.json()
      if (data.erro) { setStatus('error'); return }
      setStreet(data.logradouro)
      setBairro(data.bairro)
      setCidade(data.localidade)
      setUf(data.uf)
      setStatus('found')
      onAddressChange(buildAddress(data.logradouro, numero, data.bairro, data.localidade, data.uf))
    } catch {
      setStatus('error')
    }
  }

  function handleCepChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 8)
    const formatted = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits
    setCep(formatted)
    setStatus('idle')
    setStreet(''); setBairro(''); setCidade(''); setUf('')
    if (digits.length === 8) lookupCep(digits)
  }

  function handleNumeroChange(v: string) {
    setNumero(v)
    if (street) onAddressChange(buildAddress(street, v, bairro, cidade, uf))
  }

  if (manual) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          onChange={e => onAddressChange(e.target.value)}
          placeholder="Ex: Av. Paulista, 1000, Bela Vista, São Paulo - SP"
          required={required}
          className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm"
        />
        <button type="button" onClick={() => setManual(false)} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
          ← Usar CEP
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Linha CEP + Número */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={cep}
            onChange={e => handleCepChange(e.target.value)}
            placeholder="CEP (ex: 01310-100)"
            maxLength={9}
            inputMode="numeric"
            required={required && !street}
            className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm"
          />
          {status === 'loading' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin inline-block" />
            </span>
          )}
          {status === 'found' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
          )}
        </div>

        {status === 'found' && (
          <input
            type="text"
            value={numero}
            onChange={e => handleNumeroChange(e.target.value)}
            placeholder="Nº"
            required={required}
            className="w-20 bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-3 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm text-center"
          />
        )}
      </div>

      {/* Preview do endereço encontrado */}
      {status === 'found' && street && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Endereço encontrado</p>
          <p className="text-sm text-white">{street}{numero ? ', ' + numero : <span className="text-orange-400"> — informe o número</span>}</p>
          <p className="text-xs text-gray-500 mt-0.5">{bairro} · {cidade} - {uf}</p>
        </div>
      )}

      {/* CEP não encontrado */}
      {status === 'error' && (
        <p className="text-xs text-red-400">CEP não encontrado.</p>
      )}

      {/* Toggle manual */}
      {status !== 'found' && (
        <button type="button" onClick={() => setManual(true)} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
          Não sei o CEP — digitar endereço
        </button>
      )}
    </div>
  )
}
