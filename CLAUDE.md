# Tech Churras — Contexto do Projeto

## O que é

Marketplace B2B2C que conecta clientes → Grill Masters (churrasqueiros profissionais) → Açougues parceiros.
O cliente contrata um churrasco completo. O Grill Master executa. O açougue fornece os cortes.

**Site:** techchurras.com.br | **App:** Android (Capacitor)
**Lançamento:** 06/07/2026 — 7 dias a partir de 29/06/2026

## Stack

- **Frontend:** Next.js 16.2.6 App Router + Tailwind CSS v4 → Vercel
- **Backend:** Fastify 5 + TypeScript → Railway
- **Banco:** Supabase PostgreSQL + Prisma 7 + PrismaPg adapter
- **Auth:** `@fastify/jwt` no backend, Zustand (`useAuthStore`) no frontend
- **Pagamento:** Mercado Pago produção (token APP_USR no Railway)
- **Notificações:** WhatsApp via Z-API + Web Push Notifications
- **Email:** Resend API
- **IA:** Claude Haiku (geração de bio, chat assistente /menu/assistente, sugestão de kits)
- **Analytics:** PostHog, Google Analytics 4, Meta Pixel, TikTok Pixel, Google Ads
- **Cron:** cron-job.org → GET /cron/event-reminders a cada hora via x-cron-secret

## Roles

| Role | Descrição |
|------|-----------|
| CUSTOMER | Contrata churrasco via wizard 4 passos |
| GRILLMASTER | Churrasqueiro — aceita pedidos, executa o evento |
| BOUTIQUE | Açougue — fornece cortes, recebe pedidos do sistema |
| ADMIN | Gerencia parceiros, métricas, aprovações |

## O que está funcionando (produto completo)

- Wizard de pedido 4 passos: data/local → proteínas+kit → GM → confirmação+pagamento
- Pagamento Mercado Pago produção com validação HMAC de webhook
- WhatsApp automático em cada evento do pedido via Z-API
- Web Push Notifications em todos os eventos críticos
- Chat IA multi-turno com Claude Haiku (/menu/assistente)
- GPS tracking ao vivo do GM com ETA (Leaflet + Nominatim)
- Sistema de avaliações pós-churrasco
- Indicação viral: cliente→cliente (10% OFF, /convite/[id])
- Bot de captação de açougues com IA + follow-up 48h automático
- Admin dashboard com auto-refresh e métricas
- Email transacional em todos os eventos (Resend)
- Kits de cortes criados pelos açougues com produtos reais
- Cron de reminders 24h antes dos eventos
- PWA Install Prompt (Android + iOS)
- OG dinâmico por GM e açougue
- City pages SEO: /churrasqueiros/[cidade] e /acougues/[cidade]

## Modelo de negócio

**Fontes de receita da plataforma:**
- **7% da mão de obra do GM** por pedido concluído (GM recebe 93%)
- **10% das carnes do açougue** por pedido concluído
- **Mensalidade do açougue:** R$369/mês pra todo parceiro · 1º mês grátis pra novos ("Açougue Embaixador")

**Perfis:**
- **Açougue Embaixador:** R$369/mês + 10% comissão. Aberto a qualquer novo açougue, sem exclusividade regional. 1º mês grátis pra todos verem que a plataforma funciona.
- **Grill Master:** define própria mão de obra por hora · plataforma retém 7% · GM recebe 93%
- **Cliente:** paga pelo churrasco via Mercado Pago

**Importante:** GM NÃO paga mensalidade. GM NÃO participa da comissão do açougue. São fontes de receita independentes.

## Go-to-market

**Supply side first:** fechar açougues → onboard GMs → ativar tráfego pago.

**Equipe comissionada em SP (presencial):**
- R$300 por açougue fechado (R$150 na assinatura + R$150 no 1º pagamento)
- R$50 por churrasqueiro ativo 30 dias

**Ativos prontos:** /pitch-acougue, /pitch-churrasqueiro, /script-equipe, scripts Meta Ads e Google Ads prontos para ativar.

## Fundador e credencial

**João Paulo (Jota)** — lançando remotamente de Zanzibar, Tanzânia.
**Bahari of Brazil:** PPP com Governo de Tanzânia (MCITI). Primeiro restaurante/hub culinário em parceria governamental no país. 500m², Jota como BBQ Master. Principal ativo de credibilidade do lançamento.

## Infra de produção (confirmada)

- ✅ Mercado Pago produção
- ✅ MP_WEBHOOK_SECRET configurado (rejeita se ausente)
- ✅ CRON_SECRET no Railway
- ✅ Cron-job.org ativo
- ✅ Pixels: Meta, TikTok, Google Ads, PostHog (Vercel)
- ✅ Railway billing ativo
- ✅ JWT com expiresIn: '30d'
- ✅ Prisma db push sem --accept-data-loss
- ✅ Índices: Grillmaster(city,state,approved,available), Boutique(city,state,approved), GrillmasterSchedule(date)

## Pendências críticas (lançamento 06/07)

1. Teste de pagamento real ponta a ponta (cartão real → pedido → push → WhatsApp)
2. Primeiro açougue real onboardado em SP
3. Equipe comissionada recrutada (representante presencial SP)
4. Play Store: keystore + AAB + ficha + 12 testers (14 dias de prazo — CRÍTICO)
5. Vídeo de Zanzibar com legendas + re-upload YouTube

## Contas de teste

- Admin: joaopauloalbuquerque.jpa@gmail.com (não existe conta admin@techchurras.com.br)
- GM fundador: techchurras@gmail.com (não existe conta teamjota@techchurras.com.br)
- Açougue fundador: acougue@techchurras.com.br

## Tom de voz

- "a Tech Churras" — sempre feminino
- Direto, confiante, brasileiro — sem frescura
- Churrasco como cultura, não commodity
- Açougue como parceiro estratégico, não fornecedor
