'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Props as JoyrideProps, EventData } from 'react-joyride'

const Joyride = dynamic(
  () => import('react-joyride').then(m => ({ default: m.Joyride })),
  { ssr: false }
) as React.ComponentType<JoyrideProps>

import type React from 'react'

const BASE = 'https://tech-churras-production.up.railway.app'

function getToken() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null
  return raw ? JSON.parse(raw)?.state?.token : null
}

const CUSTOMER_STEPS = [
  { target: 'body', placement: 'center' as const, title: 'Bem-vindo à Tech Churras!', content: 'Vamos te mostrar como funciona a plataforma em poucos passos.' },
  { target: '[data-tour="menu-link"]', title: 'Monte seu pedido', content: 'No Menu você escolhe os cortes e produtos do açougue parceiro.' },
  { target: '[data-tour="grillmasters-link"]', title: 'Escolha seu churrasqueiro', content: 'Veja os churrasqueiros disponíveis, compare avaliações e preços por hora.' },
  { target: '[data-tour="orders-link"]', title: 'Acompanhe seus pedidos', content: 'Aqui você vê o status de todos os seus churrascos em tempo real.' },
  { target: '[data-tour="favoritos-link"]', title: 'Salve seus favoritos', content: 'Guarde os churrasqueiros que você mais gostou para contratar de novo.' },
]

const GRILLMASTER_STEPS = [
  { target: 'body', placement: 'center' as const, title: 'Bem-vindo, Churrasqueiro!', content: 'Vamos mostrar como gerenciar seus pedidos e perfil na plataforma.' },
  { target: '[data-tour="dashboard-gm-link"]', title: 'Seu painel', content: 'No seu Dashboard você vê pedidos pendentes, avaliações e faturamento.' },
  { target: '[data-tour="orders-link"]', title: 'Pedidos recebidos', content: 'Aqui chegam as solicitações dos clientes. Confirme e gerencie cada churrasco.' },
]

const BOUTIQUE_STEPS = [
  { target: 'body', placement: 'center' as const, title: 'Bem-vindo, Açougue!', content: 'Configure seu catálogo e acompanhe as vendas pelo painel.' },
  { target: '[data-tour="boutique-dashboard-link"]', title: 'Painel do Açougue', content: 'Veja faturamento, pedidos pendentes e gerencie seus produtos aqui.' },
  { target: '[data-tour="orders-link"]', title: 'Pedidos em tempo real', content: 'Quando um cliente inclui seu açougue num pedido, você é notificado aqui.' },
]

const stepsByRole: Record<string, typeof CUSTOMER_STEPS> = {
  CUSTOMER: CUSTOMER_STEPS,
  GRILLMASTER: GRILLMASTER_STEPS,
  BOUTIQUE: BOUTIQUE_STEPS,
}

interface Props {
  userId: string
  role: string
}

export default function OnboardingTour({ userId, role }: Props) {
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (!userId) return
    const key = 'tc-onb-' + userId
    if (localStorage.getItem(key) === 'done') return
    const timer = setTimeout(() => setRun(true), 800)
    return () => clearTimeout(timer)
  }, [userId])

  async function finish() {
    const key = 'tc-onb-' + userId
    localStorage.setItem(key, 'done')
    setRun(false)
    try {
      await fetch(BASE + '/auth/onboarding-completed', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + getToken() },
      })
    } catch {}
  }

  const steps = stepsByRole[role] || CUSTOMER_STEPS

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      options={{
        primaryColor: '#f97316',
        backgroundColor: '#1f2937',
        textColor: '#f9fafb',
        overlayColor: 'rgba(0,0,0,0.65)',
        buttons: ['back', 'primary', 'skip'],
        showProgress: true,
        zIndex: 9999,
      }}
      styles={{
        tooltip: { borderRadius: 14 },
        buttonPrimary: { borderRadius: 8 },
        buttonBack: { borderRadius: 8, color: '#9ca3af' },
        buttonSkip: { color: '#6b7280' },
      }}
      locale={{ back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular' }}
      onEvent={(data: EventData) => {
        if (data.status === 'finished' || data.status === 'skipped') finish()
      }}
    />
  )
}
