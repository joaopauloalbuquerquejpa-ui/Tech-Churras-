declare const window: Window & {
  gtag?: (...args: any[]) => void
  fbq?: (...args: any[]) => void
  ttq?: { track: (event: string, params?: Record<string, any>) => void }
}

export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  window.gtag?.('event', event, params)
}

function metaTrack(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  window.fbq?.('track', event, params)
}

function tiktokTrack(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  window.ttq?.track(event, params)
}

export const Events = {
  signUp: (role: string) => {
    track('sign_up', { method: 'email', user_role: role })
    metaTrack('CompleteRegistration', { content_name: role })
    tiktokTrack('CompleteRegistration', { content_type: role })
  },

  orderCreated: (guestCount: number, totalPrice: number, hasBoutique: boolean) => {
    track('order_created', { guest_count: guestCount, value: totalPrice, has_boutique: hasBoutique })
    metaTrack('InitiateCheckout', { value: totalPrice, currency: 'BRL', num_items: guestCount })
    tiktokTrack('InitiateCheckout', { value: totalPrice, currency: 'BRL' })
  },

  beginCheckout: (orderId: string, value: number) => {
    track('begin_checkout', { order_id: orderId, value, currency: 'BRL' })
    metaTrack('AddPaymentInfo', { value, currency: 'BRL' })
    tiktokTrack('AddPaymentInfo', { value, currency: 'BRL' })
  },

  purchase: (orderId: string, value: number) => {
    track('purchase', { transaction_id: orderId, value, currency: 'BRL' })
    metaTrack('Purchase', { value, currency: 'BRL', order_id: orderId })
    tiktokTrack('PlaceAnOrder', { value, currency: 'BRL', order_id: orderId })
    // Google Ads conversion
    window.gtag?.('event', 'conversion', {
      send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
      value,
      currency: 'BRL',
      transaction_id: orderId,
    })
  },

  ebookCheckoutStarted: (value: number) => {
    track('ebook_checkout_started', { value, currency: 'BRL' })
    metaTrack('InitiateCheckout', { value, currency: 'BRL', content_name: 'metodo_churrasco_exotico' })
    tiktokTrack('InitiateCheckout', { value, currency: 'BRL' })
  },

  ebookPurchase: (value: number) => {
    track('ebook_purchase', { value, currency: 'BRL' })
    metaTrack('Purchase', { value, currency: 'BRL', content_name: 'metodo_churrasco_exotico' })
    tiktokTrack('PlaceAnOrder', { value, currency: 'BRL' })
    window.gtag?.('event', 'conversion', {
      send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
      value,
      currency: 'BRL',
    })
  },

  clickWhatsApp: (source: string) => {
    track('whatsapp_click', { source })
    metaTrack('Contact', { source })
    tiktokTrack('Contact', { source })
  },

  kitPerfeito: (guestCount: number) => track('kit_perfeito_result', { guest_count: guestCount }),

  viewContent: (page: string) => {
    metaTrack('ViewContent', { content_name: page })
    tiktokTrack('ViewContent', { content_name: page })
  },

  boutiquePageView: () => {
    track('boutique_page_view', {})
    metaTrack('ViewContent', { content_name: 'para-acougues', content_category: 'boutique' })
    tiktokTrack('ViewContent', { content_name: 'para-acougues' })
  },

  boutiqueInterest: (source: string) => {
    track('boutique_lead', { source })
    metaTrack('Lead', { content_name: source })
    tiktokTrack('Subscribe', { content_name: source })
    window.gtag?.('event', 'generate_lead', { source })
  },

  boutiqueFounderClick: (source: string) => {
    track('boutique_founder_click', { source })
    metaTrack('Lead', { content_name: `founder_${source}`, value: 1107, currency: 'BRL' })
    tiktokTrack('Subscribe', { content_name: `founder_${source}` })
  },
}
