'use client'
import { useRef, useState } from 'react'
import { API_URL } from '@/lib/api'

interface Props {
  token: string
  onTranscribed: (text: string) => void
  label?: string
}

// Botão de "gravar nota de voz" — grava um áudio curto, manda pro backend
// transcrever (Gemini) e devolve o texto puro pro chamador decidir o que fazer
// com ele (preencher um campo, anexar a um texto existente, etc.). Pensado pra
// quem prefere falar a digitar (bio, especialidades, descrição do negócio).
export function VoiceDictateButton({ token, onTranscribed, label = 'Gravar nota de voz' }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing' | 'error'>('idle')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => transcribe(new Blob(chunksRef.current, { type: mimeType }))
      recorder.start()
      mediaRecorderRef.current = recorder
      setState('recording')
    } catch {
      setError('Não conseguimos acessar o microfone. Verifique a permissão do navegador.')
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function transcribe(blob: Blob) {
    setState('transcribing')
    try {
      const fd = new FormData()
      fd.append('file', blob, 'nota-de-voz.webm')
      const res = await fetch(API_URL + '/ai/transcribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao transcrever áudio')
      onTranscribed(data.text as string)
      setState('idle')
    } catch (err: any) {
      setError(err.message || 'Falha ao transcrever áudio — digite manualmente')
      setState('error')
    }
  }

  if (state === 'recording') {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 animate-pulse"
      >
        ⏺ Gravando... toque para parar
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={startRecording}
        disabled={state === 'transcribing'}
        className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50 flex items-center gap-1"
      >
        {state === 'transcribing' ? '⏳ Transcrevendo...' : `🎙️ ${label}`}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
