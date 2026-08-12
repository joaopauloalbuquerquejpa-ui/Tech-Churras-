'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Animação sutil reaproveitada do padrão já usado em /founder (whileHover/whileTap)
// — mesma identidade visual, sem introduzir estilo novo.
export function AnimatedCTA({ href, className, children, external }: { href: string; className: string; children: ReactNode; external?: boolean }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {children}
    </motion.a>
  )
}

export function RevealSection({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
