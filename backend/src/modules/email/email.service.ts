const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Tech Churras <noreply@techchurras.com.br>'
const BASE_URL = 'https://www.techchurras.com.br'

async function sendEmail(to: string, subject: string, html: string, label: string) {
  if (!RESEND_API_KEY) { console.warn(`[Email] RESEND_API_KEY ausente — email "${label}" não enviado`); return }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    })
    if (!res.ok) console.log(`[Email] ${label} erro:`, res.status)
    else console.log(`[Email] ${label} enviado para`, to)
  } catch (err) {
    console.log(`[Email] ${label} falha:`, err)
  }
}

function baseTemplate(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tech Churras</title></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="text-align:center;padding:24px 0 16px">
    <img src="${BASE_URL}/icon-192.png" alt="Tech Churras" style="width:48px;height:48px;border-radius:12px">
    <h1 style="margin:8px 0 0;font-size:20px;color:#fff">Tech Churras</h1>
  </div>
  <div style="background:#1a1a1a;border-radius:16px;padding:28px;border:1px solid #2a2a2a">
    ${body}
  </div>
  <p style="text-align:center;color:#555;font-size:12px;margin-top:20px">
    Tech Churras · <a href="${BASE_URL}" style="color:#f97316;text-decoration:none">techchurras.com.br</a>
  </p>
</div>
</body></html>`
}

export async function emailOrderConfirmed(
  to: string,
  customerName: string,
  orderId: string,
  grillmasterName: string,
  eventDate: Date,
  eventAddress: string
) {
  const firstName = customerName.split(' ')[0]
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const orderUrl = `${BASE_URL}/orders/${orderId}`

  const html = baseTemplate(`
    <h2 style="color:#f97316;margin:0 0 8px;font-size:24px">🔥 Churrasco confirmado!</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}, seu churrasco está confirmado. Prepare-se para uma experiência incrível!</p>
    <div style="background:#111;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Detalhes do evento</p>
      <p style="margin:4px 0;color:#fff"><strong>👨‍🍳 Churrasqueiro:</strong> ${grillmasterName}</p>
      <p style="margin:4px 0;color:#fff"><strong>📅 Data:</strong> ${date}</p>
      <p style="margin:4px 0;color:#fff"><strong>📍 Local:</strong> ${eventAddress}</p>
    </div>
    <a href="${orderUrl}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      Acompanhar pedido
    </a>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:16px">Você receberá atualizações em tempo real quando o churrasqueiro estiver a caminho.</p>
  `)

  await sendEmail(to, '🔥 Seu churrasco foi confirmado!', html, 'order-confirmed')
}

export async function emailNewOrderGrillmaster(
  to: string,
  grillmasterName: string,
  orderId: string,
  customerName: string,
  eventDate: Date,
  guestCount: number
) {
  const firstName = grillmasterName.split(' ')[0]
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(eventDate)
  const dashUrl = `${BASE_URL}/grillmasters/dashboard`

  const html = baseTemplate(`
    <h2 style="color:#f97316;margin:0 0 8px;font-size:24px">🔥 Novo pedido para você!</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}, você recebeu um novo pedido. Acesse o painel para aceitar!</p>
    <div style="background:#111;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Detalhes</p>
      <p style="margin:4px 0;color:#fff"><strong>👤 Cliente:</strong> ${customerName}</p>
      <p style="margin:4px 0;color:#fff"><strong>📅 Data:</strong> ${date}</p>
      <p style="margin:4px 0;color:#fff"><strong>👥 Convidados:</strong> ${guestCount}</p>
    </div>
    <a href="${dashUrl}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      Ver pedido no painel
    </a>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:16px">Responda rapidamente para aumentar sua taxa de aceitação!</p>
  `)

  await sendEmail(to, '🔥 Novo pedido — confirme agora!', html, 'new-order-gm')
}

export async function emailOrderCompleted(
  to: string,
  customerName: string,
  orderId: string,
  grillmasterName: string
) {
  const firstName = customerName.split(' ')[0]
  const reviewUrl = `${BASE_URL}/orders/${orderId}/review`

  const html = baseTemplate(`
    <h2 style="color:#f97316;margin:0 0 8px;font-size:24px">🎉 Churrasco finalizado!</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}, esperamos que o churrasco com ${grillmasterName} tenha sido incrível!</p>
    <p style="color:#ccc;margin:0 0 20px">Sua avaliação ajuda outros clientes a escolher os melhores churrasqueiros. Leva menos de 1 minuto 🙏</p>
    <a href="${reviewUrl}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      ⭐ Avaliar o churrasqueiro
    </a>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:16px">Obrigado por usar a Tech Churras!</p>
  `)

  await sendEmail(to, '⭐ Como foi o churrasco? Avalie agora!', html, 'order-completed')
}

export async function emailPartnerApproved(
  to: string,
  partnerName: string,
  partnerType: 'GRILLMASTER' | 'BOUTIQUE',
  dashUrl: string
) {
  const firstName = partnerName.split(' ')[0]
  const emoji = partnerType === 'GRILLMASTER' ? '👨‍🍳' : '🥩'
  const tipo = partnerType === 'GRILLMASTER' ? 'churrasqueiro' : 'açougue'

  const html = baseTemplate(`
    <h2 style="color:#22c55e;margin:0 0 8px;font-size:24px">🎉 Parabéns! Perfil aprovado!</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}! Seu perfil de ${tipo} foi aprovado na Tech Churras.</p>
    <p style="color:#ccc;margin:0 0 20px">${emoji} Você já está ativo e pode receber pedidos. Acesse seu painel para configurar sua disponibilidade.</p>
    <a href="${dashUrl}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      Acessar meu painel
    </a>
  `)

  await sendEmail(to, '🎉 Seu perfil foi aprovado na Tech Churras!', html, 'partner-approved')
}

export async function emailPasswordReset(to: string, customerName: string, resetUrl: string) {
  const firstName = customerName.split(' ')[0]
  const html = baseTemplate(`
    <h2 style="color:#f97316;margin:0 0 8px;font-size:24px">🔒 Redefinição de senha</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    <p style="color:#ccc;margin:0 0 20px">Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#f97316">30 minutos</strong>.</p>
    <a href="${resetUrl}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      Redefinir minha senha
    </a>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:20px">Se você não solicitou isso, ignore este email. Sua senha continua a mesma.</p>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:8px">Link: ${resetUrl}</p>
  `)
  await sendEmail(to, '🔒 Redefinição de senha — Tech Churras', html, 'password-reset')
}

export async function emailWelcomeCustomer(to: string, customerName: string) {
  const firstName = customerName.split(' ')[0]
  const html = baseTemplate(`
    <h2 style="color:#f97316;margin:0 0 8px;font-size:24px">🔥 Bem-vindo à Tech Churras!</h2>
    <p style="color:#aaa;margin:0 0 20px">Oi ${firstName}! Você acaba de entrar no maior marketplace de churrasqueiros profissionais do Brasil.</p>
    <div style="background:#111;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="margin:4px 0;color:#fff">🥩 <strong>Açougues selecionados</strong> com os melhores cortes</p>
      <p style="margin:4px 0;color:#fff">👨‍🍳 <strong>Churrasqueiros certificados</strong> perto de você</p>
      <p style="margin:4px 0;color:#fff">📍 <strong>Rastreamento ao vivo</strong> do evento</p>
      <p style="margin:4px 0;color:#fff">⭐ <strong>Avaliações reais</strong> de clientes verificados</p>
    </div>
    <a href="${BASE_URL}/grillmasters" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:bold;font-size:16px">
      Encontrar churrasqueiros
    </a>
    <p style="color:#666;font-size:12px;text-align:center;margin-top:16px">Use o cupom <strong style="color:#f97316">CHURRAS10</strong> no primeiro pedido para 10% OFF.</p>
  `)
  await sendEmail(to, '🔥 Bem-vindo à Tech Churras! Seu churrasco perfeito está aqui.', html, 'welcome-customer')
}
