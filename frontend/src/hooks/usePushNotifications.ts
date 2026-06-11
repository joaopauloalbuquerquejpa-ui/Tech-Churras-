'use client'
import { useEffect, useState } from 'react'

const BASE = 'https://tech-churras-production.up.railway.app'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr.buffer
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage')
    return raw ? JSON.parse(raw)?.state?.token : null
  } catch { return null }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)
    if (Notification.permission === 'granted') checkSubscription()
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function subscribe() {
    if (!supported) return
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const keyRes = await fetch(`${BASE}/push/vapid-public-key`)
      const { publicKey } = await keyRes.json()
      if (!publicKey) return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const token = getToken()
      if (!token) return

      await fetch(`${BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(sub.toJSON()),
      })
      setSubscribed(true)
    } catch (err) {
      console.error('[Push] subscribe error:', err)
    }
  }

  async function unsubscribe() {
    if (!supported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      const token = getToken()
      if (token) {
        await fetch(`${BASE}/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {})
      }
      await sub.unsubscribe()
      setSubscribed(false)
    } catch {}
  }

  return { permission, subscribed, supported, subscribe, unsubscribe }
}
