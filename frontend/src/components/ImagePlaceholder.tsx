'use client'

type PlaceholderType = 'grillmaster' | 'boutique-logo' | 'boutique-facade' | 'gallery'

interface ImagePlaceholderProps {
  type: PlaceholderType
  className?: string
}

const config: Record<PlaceholderType, { gradient: string; icon: string }> = {
  grillmaster: {
    gradient: 'from-orange-900/60 to-gray-900',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="12" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 54c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M26 42l3 4 4-6" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  'boutique-logo': {
    gradient: 'from-red-900/60 to-gray-900',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="28" width="40" height="26" rx="3" stroke="#ef4444" stroke-width="2.5"/>
      <path d="M20 28v-4a12 12 0 0124 0v4" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M22 42h20M22 48h14" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  'boutique-facade': {
    gradient: 'from-red-900/40 to-gray-900',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="22" width="48" height="34" rx="2" stroke="#ef4444" stroke-width="2.5"/>
      <path d="M8 22l24-14 24 14" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="24" y="38" width="16" height="18" rx="2" stroke="#ef4444" stroke-width="2"/>
      <rect x="12" y="30" width="10" height="10" rx="1" stroke="#ef4444" stroke-width="2"/>
      <rect x="42" y="30" width="10" height="10" rx="1" stroke="#ef4444" stroke-width="2"/>
    </svg>`,
  },
  gallery: {
    gradient: 'from-gray-800 to-gray-900',
    icon: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="4" stroke="#6b7280" stroke-width="2.5"/>
      <circle cx="22" cy="24" r="6" stroke="#6b7280" stroke-width="2"/>
      <path d="M8 40l14-14 10 10 10-12 14 16" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
}

export function ImagePlaceholder({ type, className = '' }: ImagePlaceholderProps) {
  const { gradient, icon } = config[type]
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
      dangerouslySetInnerHTML={{
        __html: `<div style="width:48px;height:48px;opacity:0.6">${icon}</div>`,
      }}
    />
  )
}
