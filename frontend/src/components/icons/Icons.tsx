// Ícones próprios da Tech Churras — traço único, levemente irregular, no lugar de emoji.
// Substituem 🔥🥩📍✓🤝⭐🔒📊👨‍🍳🎉🏆 no site.

type IconProps = { className?: string; size?: number }

const base = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function FlameIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M12 3c-2 3-5 5-5 9a5 5 0 0010 0c0-1.5-.8-2.3-1.5-3.2.3 1.8-.6 2.7-1.2 2 .8-2.3-.4-4.6-2.3-5.8.4 1.3-.2 2-1 2.5" />
    </svg>
  )
}

export function MeatIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 14c0-4 3.5-9 8-9s8 5 8 9-3.5 6-8 6-8-2-8-6z" />
      <path d="M8 13c1.5 1 6.5 1 8 0" strokeDasharray="2 2" />
    </svg>
  )
}

export function PinIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0119 9.5C19 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2" />
    </svg>
  )
}

export function CheckIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M5 12.5l4.5 5L19 7" />
    </svg>
  )
}

export function HandshakeIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M2 12l4-3 3 2 3-2 2 2 2-2 3 2 3-2" />
      <path d="M8 11l2.5 3a1.5 1.5 0 002 .2M13 11l3 3.5a1.5 1.5 0 01-2 2.2l-1-1" />
    </svg>
  )
}

export function StarIcon({ className, size = 20, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l2.5 5.6 6 .7-4.5 4.1 1.2 6-5.2-3.1-5.2 3.1 1.2-6-4.5-4.1 6-.7z" />
    </svg>
  )
}

export function LockIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  )
}

export function ShieldIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function ChefIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M7 10c-1.5 0-2.5-1.3-2.5-2.7 0-1.3 1-2.4 2.2-2.6C7 3.2 8.3 2 10 2c1.2 0 2.2.6 2.8 1.5.5-.3 1-.5 1.7-.5 1.7 0 3 1.4 3 3.1 0 1.4-1 2.6-2.3 2.9" />
      <path d="M6 10v9h12v-9" />
      <path d="M6 15h12" />
    </svg>
  )
}

export function CelebrationIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 20l4-11 7 7z" />
      <path d="M13 6l1.5 1.5M17 4l1 2M20 8l-2 1" strokeDasharray="0 3" />
    </svg>
  )
}

export function TrophyIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M7 4h10v5a5 5 0 01-10 0z" />
      <path d="M7 5H4a3 3 0 003 4M17 5h3a3 3 0 01-3 4" />
      <path d="M12 14v3M9 20h6M9 20l.5-2.5h5l.5 2.5" />
    </svg>
  )
}

export function CardIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18" />
    </svg>
  )
}

export function ChartIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  )
}

export function AlertIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M12 3l9 16H3z" />
      <path d="M12 9.5v4M12 17v.1" />
    </svg>
  )
}

export function ChatIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  )
}

export function CashIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
      <circle cx="12" cy="12" r="2.3" />
    </svg>
  )
}

export function RocketIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M12 3c3 1 5 4 5 8 0 3-1.5 6-5 10-3.5-4-5-7-5-10 0-4 2-7 5-8z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M8 16l-3 4M16 16l3 4" />
    </svg>
  )
}

export function BellIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  )
}

export function ClockIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function CameraIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.3" />
    </svg>
  )
}

export function ClipboardIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="6" y="4.5" width="12" height="16" rx="1.5" />
      <path d="M9 4V3.5a1 1 0 011-1h4a1 1 0 011 1V4" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  )
}

export function TargetIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function PersonIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
    </svg>
  )
}

export function PhoneIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="7" y="2.5" width="10" height="19" rx="1.5" />
      <path d="M11 18h2" />
    </svg>
  )
}

export function PrinterIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="8" rx="1.2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  )
}

export function StoreIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 9l1-5h14l1 5" />
      <path d="M4 9a2.3 2.3 0 004.4 1 2.3 2.3 0 004.4 0 2.3 2.3 0 004.4 0 2.3 2.3 0 004.4-1" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

export function CarIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <path d="M4 16l1.5-5.5A2 2 0 017.4 9h9.2a2 2 0 011.9 1.5L20 16" />
      <path d="M3 16h18v3a1 1 0 01-1 1h-1.5a1 1 0 01-1-1v-1h-11v1a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
      <circle cx="7.5" cy="16" r="1.3" />
      <circle cx="16.5" cy="16" r="1.3" />
    </svg>
  )
}

export function GiftIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} stroke="currentColor" {...base}>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M4 13h16M12 9v11" />
      <path d="M12 9C10 6 7 6 7 8.5S10 10 12 9zM12 9c2-3 5-3 5-.5S14 10 12 9z" />
    </svg>
  )
}
