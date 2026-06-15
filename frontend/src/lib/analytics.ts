declare const window: Window & { gtag?: (...args: any[]) => void }

export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', event, params)
}

export const Events = {
  signUp: (role: string) => track('sign_up', { method: 'email', user_role: role }),
  orderCreated: (guestCount: number, totalPrice: number, hasBoutique: boolean) =>
    track('order_created', { guest_count: guestCount, value: totalPrice, has_boutique: hasBoutique }),
  beginCheckout: (orderId: string, value: number) =>
    track('begin_checkout', { order_id: orderId, value, currency: 'BRL' }),
  clickWhatsApp: (source: string) => track('whatsapp_click', { source }),
  kitPerfeito: (guestCount: number) => track('kit_perfeito_result', { guest_count: guestCount }),
  boutiqueQrScan: () => track('boutique_qr_scan'),
}
