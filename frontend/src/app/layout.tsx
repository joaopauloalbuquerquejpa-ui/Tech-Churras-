import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.techchurras.com.br'),
  title: {
    default: 'Tech Churras — O Churrasqueiro dos Famosos',
    template: '%s — Tech Churras',
  },
  description: 'Conectamos voce com churrasqueiros profissionais e acougues parceiros. Churrasco de qualidade para seu evento.',
  keywords: ['churrasqueiro', 'churrasco', 'acougue', 'evento', 'Tech Churras', 'churrasco profissional'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Tech Churras',
    title: 'Tech Churras — O Churrasqueiro dos Famosos',
    description: 'Conectamos voce com churrasqueiros profissionais e acougues parceiros. Churrasco de qualidade para seu evento.',
    images: [{ url: '/jota.jpg', width: 800, height: 800, alt: 'Tech Churras' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Churras — O Churrasqueiro dos Famosos',
    description: 'Conectamos voce com churrasqueiros profissionais e acougues parceiros.',
    images: ['/jota.jpg'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR'>
      <body className={`${geistSans.variable} ${geistMono.variable} h-full`}>
        {children}
      </body>
    </html>
  )
}