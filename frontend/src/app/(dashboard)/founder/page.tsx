'use client'
import { useRef, useEffect, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  animate,
} from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const EmberParticles = dynamic(() => import('./EmberParticles'), { ssr: false })

const VIDEO_BRASA = 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4'

// ── Typewriter ──────────────────────────────────────────────────────────────

function Typewriter({ text, startDelay = 0.3 }: { text: string; startDelay?: number }) {
  return (
    <span>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: startDelay + i * 0.055, duration: 0.01 }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
      <motion.span
        className="text-orange-500"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.72, ease: 'linear' }}
      >
        |
      </motion.span>
    </span>
  )
}

// ── AnimatedCounter ─────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  suffix = '',
  label,
}: {
  value: number
  suffix?: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    if (!isInView) return
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' })
    return () => controls.stop()
  }, [isInView, count, value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl font-black text-orange-500 leading-none mb-2 tabular-nums">
        <motion.span>{rounded}</motion.span>
        <span className="text-3xl">{suffix}</span>
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  )
}

// ── TimelineItem ─────────────────────────────────────────────────────────────

interface TimelineEntry {
  icon: string
  title: string
  desc: string
  year?: string
}

function TimelineItem({ entry, index }: { entry: TimelineEntry; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' as never })
  const isLeft = index % 2 === 0

  const cardVariants = {
    hidden: { opacity: 0, x: isLeft ? -80 : 80 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <div ref={ref} className="relative mb-6">
      {/* Mobile layout */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        transition={{ duration: 0.7, delay: index * 0.07 }}
        className="md:hidden bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-5 flex gap-4"
      >
        <span className="text-2xl text-orange-400 shrink-0 mt-0.5">{entry.icon}</span>
        <div>
          {entry.year && (
            <p className="text-xs text-orange-400 font-bold uppercase tracking-wide mb-0.5">
              {entry.year}
            </p>
          )}
          <h3 className="font-bold text-white mb-1">{entry.title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{entry.desc}</p>
        </div>
      </motion.div>

      {/* Desktop alternating layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_56px_1fr] items-center gap-0">
        {/* Left slot */}
        {isLeft ? (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            transition={{ duration: 0.7, delay: index * 0.07 }}
            className="bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-5 text-right mr-4"
          >
            {entry.year && (
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wide mb-0.5">
                {entry.year}
              </p>
            )}
            <h3 className="font-bold text-white mb-1">{entry.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{entry.desc}</p>
          </motion.div>
        ) : (
          <div />
        )}

        {/* Center dot */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.4, delay: index * 0.07 + 0.2 }}
            className="w-5 h-5 rounded-full bg-orange-500 shrink-0 z-10 animate-flamePulse"
          />
        </div>

        {/* Right slot */}
        {!isLeft ? (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            transition={{ duration: 0.7, delay: index * 0.07 }}
            className="bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-5 ml-4"
          >
            {entry.year && (
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wide mb-0.5">
                {entry.year}
              </p>
            )}
            <h3 className="font-bold text-white mb-1">{entry.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{entry.desc}</p>
          </motion.div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

// ── FireCursor ───────────────────────────────────────────────────────────────

function FireCursor() {
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const rawX = useMotionValue(-200)
  const rawY = useMotionValue(-200)
  const cx = useSpring(rawX, { damping: 20, stiffness: 600 })
  const cy = useSpring(rawY, { damping: 20, stiffness: 600 })
  const t1x = useSpring(rawX, { damping: 30, stiffness: 260 })
  const t1y = useSpring(rawY, { damping: 30, stiffness: 260 })
  const t2x = useSpring(rawX, { damping: 42, stiffness: 160 })
  const t2y = useSpring(rawY, { damping: 42, stiffness: 160 })

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.style.cursor = 'none'

    const move = (e: MouseEvent) => {
      rawX.set(e.clientX - 9)
      rawY.set(e.clientY - 9)
      setVisible(true)
    }
    const over = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('a, button')) setHovering(true)
    }
    const out = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('a, button')) setHovering(false)
    }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
    }
  }, [rawX, rawY])

  if (!visible) return null
  const size = hovering ? 38 : 18

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9996] hidden md:block"
        style={{
          x: t2x,
          y: t2y,
          width: size * 0.35,
          height: size * 0.35,
          background: 'rgba(249,115,22,0.18)',
          mixBlendMode: 'screen',
          transition: 'width 0.15s,height 0.15s',
        }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9997] hidden md:block"
        style={{
          x: t1x,
          y: t1y,
          width: size * 0.62,
          height: size * 0.62,
          background: 'rgba(249,115,22,0.32)',
          mixBlendMode: 'screen',
          transition: 'width 0.15s,height 0.15s',
        }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cx,
          y: cy,
          width: size,
          height: size,
          background:
            'radial-gradient(circle, rgba(251,191,36,0.95) 0%, rgba(249,115,22,0.7) 50%, transparent 70%)',
          mixBlendMode: 'screen',
          transition: 'width 0.15s,height 0.15s',
        }}
      />
    </>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const timeline: TimelineEntry[] = [
  {
    icon: '●',
    title: 'O Início do Fogo',
    year: '+13 anos atrás',
    desc: 'Começou como churrasqueiro de família, dominando fogo e brasa até virar referência local.',
  },
  {
    icon: '★',
    title: 'Festivais Nacionais',
    year: 'Grandes palcos',
    desc: 'Bárbaros, Let\'s Grill e Carnivoria — os maiores festivais de churrasco do Brasil.',
  },
  {
    icon: '◎',
    title: 'Churrasqueiro dos Famosos',
    year: 'Celebridades',
    desc: 'Atendeu Madonna, Lady Gaga e Neymar Jr., além de atletas da NBA e NFL.',
  },
  {
    icon: '◆',
    title: 'Corporativo Premium',
    year: 'Grandes marcas',
    desc: 'Elevou o padrão para Grupo Heineken, RedBull e outras gigantes do mercado global.',
  },
  {
    icon: '◉',
    title: 'Expansão Internacional',
    year: 'Global',
    desc: 'Cardápio do One Resort Aquapark & SPA na Tunísia e sócio no Bahari of Brazil em Zanzibar.',
  },
  {
    icon: '◈',
    title: 'Cast in The House',
    year: 'Mídia',
    desc: 'Criou o primeiro podcast audiovisual de churrasco do Brasil.',
  },
  {
    icon: '⬟',
    title: 'Tech Churras',
    year: '2024',
    desc: 'Fundou a plataforma que une os melhores churrasqueiros, açougues e clientes exigentes do país.',
  },
]

const PROBLEMS = [
  'Profissionais sem qualificação comprovada',
  'Cálculo errado de quantidade de carne',
  'Insumos de qualidade duvidosa',
  'Surpresas de preço no último minuto',
  'Desperdício, estresse e frustração garantidos',
]

const SOLUTIONS = [
  'Grillmasters chancelados pessoalmente por Jota',
  'Calculadora inteligente de quantidades por pessoa',
  'Açougues premium curados e verificados',
  'Preço 100% fechado antes do evento',
  'Experiência premium — sempre, sem exceção',
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FounderPage() {
  const bioRef = useRef<HTMLDivElement>(null)
  const bioInView = useInView(bioRef, { once: true, margin: '-60px' as never })

  const ctaRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: ctaScroll } = useScroll({
    target: ctaRef,
    offset: ['start end', 'end start'],
  })
  const ctaVideoY = useTransform(ctaScroll, [0, 1], ['-15%', '15%'])

  const chancelaRef = useRef<HTMLDivElement>(null)
  const chancelaInView = useInView(chancelaRef, { once: true, margin: '-80px' as never })

  const probSolRef = useRef<HTMLDivElement>(null)
  const probSolInView = useInView(probSolRef, { once: true, margin: '-80px' as never })

  return (
    <>
      <FireCursor />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="-mx-6 -mt-6 relative overflow-hidden flex flex-col"
        style={{ minHeight: '91vh' }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={VIDEO_BRASA} type="video/mp4" />
        </video>

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.88) 100%)',
            zIndex: 1,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 65%, rgba(249,115,22,0.2) 0%, transparent 62%)',
            zIndex: 2,
          }}
        />

        <div
          className="relative flex flex-col items-center justify-center text-center px-6 flex-1"
          style={{ zIndex: 3, minHeight: '91vh' }}
        >
          {/* Shimmer badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6"
          >
            <span
              className="inline-block text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-widest text-black animate-shimmer"
              style={{
                background:
                  'linear-gradient(90deg, #f97316 0%, #fbbf24 50%, #f97316 100%)',
                backgroundSize: '200% 100%',
              }}
            >
              Churrasqueiro dos Famosos
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            <Typewriter text="Conheça o Fundador" />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="text-gray-300 text-xl max-w-lg mb-16"
          >
            A história por trás da revolução do churrasco brasileiro
          </motion.p>

          {/* Scroll bounce */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          >
            <span className="text-xs text-gray-500 uppercase tracking-widest">Rolar</span>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="text-orange-500 text-xl"
            >
              ↓
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-20">

        {/* ── BIO ── */}
        <div ref={bioRef} className="flex flex-col md:flex-row gap-12 items-start mb-24">

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={bioInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative shrink-0 mx-auto md:mx-0"
          >
            <div
              className="rounded-2xl overflow-hidden border-2 border-orange-500 animate-flamePulse"
              style={{ width: 280 }}
            >
              <Image
                src="/jota.jpg"
                alt="Jota Albuquerque"
                width={280}
                height={360}
                className="object-cover block"
              />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -bottom-4 -right-4 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-orange-500/40"
            >
              &#11088; Fundador &amp; CEO
            </motion.div>
          </motion.div>

          {/* Text */}
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={bioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl font-black text-white mb-1"
            >
              Jota Albuquerque
            </motion.h2>
            <motion.span
              initial={{ opacity: 0 }}
              animate={bioInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.25 }}
              className="text-orange-400 font-semibold block mb-6"
            >
              Fundador &amp; CEO da Tech Churras
            </motion.span>

            {[
              'Com mais de 13 anos de trajetória, João "Jota" Albuquerque consolidou-se como o Churrasqueiro dos Famosos e uma das maiores referências do churrasco no Brasil.',
              'Especialista em dominar o fogo e a brasa, ele transforma cada evento em uma experiência memorável que une técnica apurada, excelência gastronômica e hospitalidade de alto nível.',
              'De festas íntimas a megaeventos com celebridades internacionais, Jota carrega no currículo mais de 500 eventos realizados em 3 países — e uma visão clara do que o churrasco pode ser.',
            ].map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={bioInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.35 + i * 0.15 }}
                className="text-gray-300 leading-relaxed mb-4"
              >
                {para}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={bioInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="flex flex-wrap gap-8 mt-6 pt-6 border-t border-gray-800"
            >
              {[
                { n: '13+', l: 'anos' },
                { n: '500+', l: 'eventos' },
                { n: '3', l: 'países' },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-black text-orange-500">{s.n}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{s.l}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── STATS COUNTERS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-y border-gray-800 mb-24">
          <AnimatedCounter value={500} suffix="+" label="eventos realizados" />
          <AnimatedCounter value={13} suffix="+" label="anos de experiência" />
          <AnimatedCounter value={3} label="países atendidos" />
          <AnimatedCounter value={100} suffix="%" label="aprovação" />
        </div>

        {/* ── TIMELINE ── */}
        <div className="mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-black text-center mb-2"
          >
            Uma Trajetória de Fogo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-center mb-14"
          >
            Cada etapa moldou o churrasqueiro e o visionário
          </motion.p>

          <div className="relative">
            {/* Vertical line desktop */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-orange-500/25 -translate-x-1/2 origin-top"
            />

            <div className="space-y-2">
              {timeline.map((entry, i) => (
                <TimelineItem key={i} entry={entry} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* ── PROBLEM vs SOLUTION ── */}
        <div ref={probSolRef} className="grid md:grid-cols-2 gap-6 mb-24">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={probSolInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="bg-gray-900 border border-red-500/20 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.span
                animate={probSolInView ? { scale: [1, 1.35, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.2, delay: 0.4 }}
                className="text-2xl"
              >
                &#10060;
              </motion.span>
              <h3 className="text-xl font-black text-white">O Problema</h3>
            </div>
            <ul className="space-y-3">
              {PROBLEMS.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: -20 }}
                  animate={probSolInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3 text-gray-400 text-sm"
                >
                  <span className="text-red-500 text-xs mt-1 shrink-0">&#9679;</span>
                  {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={probSolInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-gray-900 border border-orange-500/30 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.span
                animate={probSolInView ? { scale: [1, 1.35, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.2, delay: 1 }}
                className="text-2xl"
              >
                &#9989;
              </motion.span>
              <h3 className="text-xl font-black text-orange-400">A Solução</h3>
            </div>
            <ul className="space-y-3">
              {SOLUTIONS.map((s, i) => (
                <motion.li
                  key={s}
                  initial={{ opacity: 0, x: 20 }}
                  animate={probSolInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 text-gray-300 text-sm"
                >
                  <span className="text-orange-500 text-xs mt-1 shrink-0">&#9679;</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── CHANCELA ── */}
        <div
          ref={chancelaRef}
          className="relative rounded-2xl overflow-hidden py-24 px-6 text-center mb-8"
          style={{ background: '#060606', border: '1px solid rgba(249,115,22,0.15)' }}
        >
          {/* Three.js Ember Particles */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <EmberParticles className="w-full h-full" />
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            {/* Rotating seal */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-36 h-36">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-orange-500/50 animate-flamePulse"
                />
                <div
                  className="absolute rounded-full border border-orange-500/20"
                  style={{ inset: 10 }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  &#128293;
                </div>
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={chancelaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="text-3xl md:text-4xl font-black text-white mb-4 animate-textGlow"
            >
              A Chancela Jota Grillmaster
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={chancelaInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-gray-300 max-w-xl mx-auto leading-relaxed"
            >
              Cada churrasqueiro na plataforma passa pelo processo de curadoria e certificação
              pessoal de Jota. A Chancela Jota Grillmaster é a garantia de que você está
              contratando um profissional treinado nos mais altos padrões da gastronomia do fogo.
            </motion.p>
          </div>
        </div>
      </div>

      {/* ── CTA FINAL com Parallax ──────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="-mx-6 relative overflow-hidden"
        style={{ minHeight: 440 }}
      >
        <motion.video
          style={{ y: ctaVideoY, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={VIDEO_BRASA} type="video/mp4" />
        </motion.video>

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.92) 100%)',
            zIndex: 1,
          }}
        />

        <div
          className="relative flex flex-col items-center justify-center text-center px-6 py-24"
          style={{ zIndex: 2 }}
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            Pronto para um churrasco de outro nível?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-lg mb-12 max-w-lg"
          >
            Grillmasters chancelados por Jota. Cortes premium. Experiência completa.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/menu/novo"
                className="inline-block text-black font-black px-10 py-4 rounded-xl text-lg animate-shimmer"
                style={{
                  background:
                    'linear-gradient(90deg, #f97316 0%, #fbbf24 50%, #f97316 100%)',
                  backgroundSize: '200% 100%',
                }}
              >
                Montar Meu Churrasco
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/grillmasters"
                className="inline-block border-2 border-orange-500/60 hover:border-orange-500 text-orange-400 hover:text-white hover:bg-orange-500/10 font-bold px-10 py-4 rounded-xl text-lg transition-all"
              >
                Ver Churrasqueiros
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="h-8" />
    </>
  )
}
