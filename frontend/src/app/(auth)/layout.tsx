import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tech Churras — Churrasco e Açougue em SP',
  description: 'Contrate churrasqueiros certificados e compre carnes selecionadas em São Paulo. Kit montado por IA, rastreamento ao vivo.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
