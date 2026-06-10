'use client'
import { useEffect, useState } from 'react'

export interface Notification {
  id: string
  message: string
  orderId?: string
  read: boolean
  createdAt: Date
}

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || key === 'sua_anon_key_aqui') return

    let channel: any = null

    async function setup() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url!, key!)

      channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Order',
            filter: `customerId=eq.${userId}`,
          },
          (payload: any) => {
            const order = payload.new
            const statusMessages: Record<string, string> = {
              CONFIRMED: `Pedido #${order.id.slice(0, 8)} foi confirmado!`,
              IN_PROGRESS: `Seu churrasco esta em andamento!`,
              COMPLETED: `Pedido #${order.id.slice(0, 8)} concluido. Avalie seu grillmaster!`,
              CANCELLED: `Pedido #${order.id.slice(0, 8)} foi cancelado.`,
            }
            const message = statusMessages[order.status]
            if (!message) return

            const notification: Notification = {
              id: `${order.id}-${order.status}-${Date.now()}`,
              message,
              orderId: order.id,
              read: false,
              createdAt: new Date(),
            }
            setNotifications(prev => [notification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()
    }

    setup().catch(console.error)

    return () => {
      channel?.unsubscribe()
    }
  }, [userId])

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAllRead }
}
