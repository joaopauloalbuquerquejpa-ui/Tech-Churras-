'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { useAuthStore } from '@/store/authStore'

export default function NotificationBell() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, markAllRead } = useRealtimeNotifications(user?.id)
  const [open, setOpen] = useState(false)
  const [shake, setShake] = useState(false)
  const prevCount = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
    prevCount.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggle() {
    setOpen(v => !v)
    if (!open && unreadCount > 0) markAllRead()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
        style={shake ? { animation: 'bellShake 0.6s ease' } : undefined}
        aria-label="Notificacoes"
      >
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Notificacoes</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Nenhuma notificacao ainda.</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={'px-4 py-3 border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors ' + (!n.read ? 'bg-orange-500/5' : '')}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">{n.message}</p>
                      {n.orderId && (
                        <Link
                          href={'/orders/' + n.orderId}
                          onClick={() => setOpen(false)}
                          className="text-xs text-orange-400 hover:text-orange-300 mt-0.5 inline-block"
                        >
                          Ver pedido
                        </Link>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">
                        {n.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          90% { transform: rotate(-5deg); }
        }
      `}</style>
    </div>
  )
}
