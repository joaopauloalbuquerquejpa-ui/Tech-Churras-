# Frontend Audit — Tech Churras
**Data:** 2026-06-30  
**Escopo:** `frontend/src` — Next.js 16.2.6 App Router  
**Método:** Leitura estática de arquivos, grep por padrões de risco

---

## Legenda de Severidade

| Nível | Critério |
|-------|----------|
| **Critical** | Bloqueia lançamento — afeta segurança, pagamento ou comunica modelo errado ao parceiro |
| **High** | Deve ser corrigido antes do lançamento — afeta UX crítica ou tracking/conversão |
| **Medium** | Corrigir no ciclo imediato pós-lançamento |
| **Low** | Backlog — não bloqueia |

---

## CRITICAL

### C-1 — Middleware de autenticação nunca é executado
**Arquivo:** `src/proxy.ts`  
**Motivo:** O Next.js só reconhece middleware quando o arquivo se chama `src/middleware.ts` (ou `middleware.ts` na raiz). O arquivo atual se chama `proxy.ts` e exporta uma função `proxy`, mas ela nunca é invocada pelo framework. O `config.matcher` também fica inerte. Resultado: todas as proteções de rota server-side (cookie `tc-auth`, verificação de role `ADMIN`) estão desabilitadas. As páginas fazem redirect client-side via `localStorage`, o que é suficiente para dados (backend autentica independente), mas garante flash de conteúdo protegido antes do redirect e ausência de redirect em `login`/`register` para usuários já autenticados.

### C-2 — Página `/parceiros` comunica modelo de negócio completamente diferente
**Arquivo:** `src/app/parceiros/page.tsx`, linhas 6, 44–45, 51–56  
**Motivo:** A página descreve: "Zero mensalidade. Sem contrato. R$40 por cliente indicado." O modelo real (documentado em CLAUDE.md e implementado em `/para-acougues`) é: R$369/mês (fundador) ou R$497/mês (padrão) + 10% de comissão. Um açougue que ler `/parceiros` e assinar terá expectativa completamente errada do contrato. Esta é uma rota pública indexada.

### C-3 — Link quebrado para `/termos` na tela de pagamento
**Arquivo:** `src/app/(dashboard)/orders/[id]/payment/page.tsx`, linha 153  
**Motivo:** `<a href="/termos">termos de uso</a>` — a rota `/termos` não existe. A rota correta é `/termos-de-uso`. Este link aparece imediatamente antes do botão de pagamento e é requisito legal LGPD para o "De acordo com" de aceitação.

---

## HIGH

### H-1 — GA4 ID hardcoded em `TrackingScripts.tsx`
**Arquivo:** `src/components/TrackingScripts.tsx`, linhas 25–27  
**Motivo:** `G-1ZXG3T5ST7` está embutido no código-fonte em vez de usar `process.env.NEXT_PUBLIC_GA4_ID`. Todos os demais pixels (Meta, TikTok, Google Ads) usam variáveis de ambiente corretamente. Se o ID GA4 precisar ser trocado (conta, ambiente staging vs prod), requer deploy. Além disso, o ID está exposto publicamente no repositório.

### H-2 — Números de social proof hardcoded e potencialmente falsos na tela de login
**Arquivo:** `src/app/(auth)/login/page.tsx`, linhas 11, 126, 166  
**Motivo:** `'+1.800 eventos realizados em São Paulo'` e `'47 churrascos agendados essa semana em SP'` são strings estáticas — não vêm de API. No lançamento, a plataforma terá zero pedidos. O número 47 aparece duas vezes (desktop + mobile). Estas strings são apresentadas como se fossem dados em tempo real ("essa semana"), o que é enganoso.

### H-3 — CSP bloqueia vídeos Pexels em todas as telas com vídeo de fundo
**Arquivo:** `next.config.ts`, linha 21; afeta `login/page.tsx`, `dashboard/page.tsx`, `menu/page.tsx`, `founder/page.tsx`  
**Motivo:** `media-src 'self' blob: https://*.supabase.co` não inclui `https://videos.pexels.com`. Navegadores com CSP compliant (Chrome, Firefox) vão bloquear os vídeos de fundo das páginas de Login, Dashboard, Menu e Founder. O fallback é gradient CSS — funcional, mas a UX do vídeo de fundo não vai aparecer em produção com CSP ativo.

### H-4 — Churras Club promove features não implementadas
**Arquivo:** `src/app/churras-club/page.tsx`  
**Motivo:** A página lista 6 benefícios (desconto 5%, churrasqueiro prioritário, agendamento prioritário, Kit Perfeito ilimitado, suporte VIP, pontos em dobro) e aceita cadastro de interesse, mas nenhuma dessas features está implementada no backend. O formulário de interesse abre WhatsApp em vez de criar uma assinatura real. A página está linkada no nav principal e na MobileNav. Usuários que chegarem via esse link encontrarão uma promessa sem entrega.

### H-5 — `alert()` nativo em formulários críticos de onboarding
**Arquivos:** `src/app/(dashboard)/grillmasters/new/page.tsx`, linha 114; `src/app/(dashboard)/boutiques/new/page.tsx`, linha 96  
**Motivo:** Ambos os formulários de cadastro de parceiros chamam `alert('Preencha todos os campos obrigatorios')` em vez de mostrar erro inline. Em iOS WebView (Capacitor), `alert()` pode ser bloqueado ou ter comportamento inconsistente. Estes são os formulários de onboarding dos parceiros mais críticos do lançamento.

---

## MEDIUM

### M-1 — API_URL fallback hardcoded para `localhost`
**Arquivo:** `src/lib/api.ts`, linha 3  
**Motivo:** `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'` — se a variável de ambiente falhar em produção (Vercel redeployou sem ela, por exemplo), todas as chamadas de API silenciosamente apontam para localhost e retornam CORS error ou timeout. O fallback deveria ser a URL de produção ou deveria lançar um erro explícito.

### M-2 — `beta-test/page.tsx` públicamente acessível com dados de teste
**Arquivo:** `src/app/beta-test/page.tsx`, linha 75  
**Motivo:** A página tem `robots: 'noindex,nofollow'` mas está acessível sem autenticação. Contém instruções de teste e menção a "cartão de crédito de teste". Qualquer link compartilhado leva um usuário real a uma tela de test mode. Deveria ser removida ou protegida por auth ADMIN.

### M-3 — `console.error` em hook de notificações expõe stack trace
**Arquivo:** `src/hooks/useRealtimeNotifications.ts`, linha 64  
**Motivo:** `setup().catch(console.error)` — em produção, erros de conexão Supabase aparecem no console do navegador, incluindo detalhes de configuração. Os demais `console.error` em `boutiques/page.tsx` (linha 67) e `orders/page.tsx` (linha 60) são adequados pois mostram contexto ao desenvolvedor sem dados sensíveis, mas vale padronizar para um logger.

### M-4 — Strings visíveis sem acento no UI (degradação de qualidade)
**Arquivos:** `src/app/(dashboard)/boutiques/page.tsx` linhas 91, 96, 225; `src/app/(dashboard)/favoritos/page.tsx` linhas 123, 143, 198; `src/app/(dashboard)/layout.tsx` linha 149; múltiplos outros  
**Motivo:** Strings user-facing como "Acougues", "Voce", "Historico de resgates", "Nao funcionou", "Nao foi possivel" aparecem sem acento em textos visíveis ao usuário. São principalmente na área logada mas um açougue ou grillmaster vai ver isso.

### M-5 — Placeholder de env var verificado hardcoded em runtime
**Arquivo:** `src/hooks/useRealtimeNotifications.ts`, linha 21  
**Motivo:** `if (!url || !key || key === 'sua_anon_key_aqui') return` — a string `'sua_anon_key_aqui'` é um fallback hardcoded que sugere que em algum momento a chave ficou como placeholder. Isso indica que o setup de `.env` foi feito com placeholder e depois corrigido, mas o check no código deveria ser removido ou substituído por uma validação mais robusta.

### M-6 — `visita-equipe/page.tsx` e `script-equipe/page.tsx` sem autenticação
**Arquivos:** `src/app/visita-equipe/page.tsx`; `src/app/script-equipe/page.tsx`  
**Motivo:** Ambas as páginas são ferramentas internas da equipe de vendas (scripts de abordagem, estrutura de comissões, CRM de visitas), mas não exigem autenticação. `script-equipe` tem `robots: noindex` mas não tem auth. Qualquer concorrente que descobrir a URL terá acesso às comissões pagas à equipe (R$300/açougue, R$50/churrasqueiro), scripts de objeção e dados de mercado.

### M-7 — Fallback vazio de testimonials não comunica nada ao usuário
**Arquivo:** `src/app/page.tsx`, linha 33; linha 149  
**Motivo:** `const STATIC_TESTIMONIALS: Testimonial[] = []` — quando a API `/public/testimonials` retorna vazio (esperado no lançamento), a seção de testimonials simplesmente desaparece sem exibir um placeholder ou mensagem. Dependendo do layout, pode criar um "buraco" visual na homepage.

### M-8 — Tela de pagamento chama `window.location.reload()` no retry
**Arquivo:** `src/app/(dashboard)/orders/[id]/payment/page.tsx`, linha 112  
**Motivo:** O botão "Tentar novamente" chama `window.location.reload()` em vez de re-executar o `useEffect`. Isso funciona, mas perde estado local e é menos elegante. Em Capacitor (Android), `location.reload()` pode criar comportamento inconsistente dependendo do WebView.

---

## LOW

### L-1 — Vídeos Pexels UHD (até 2560×1440) carregados sem lazy loading ou `preload="none"` consistente
**Arquivos:** `login/page.tsx` linha 8, `founder/page.tsx` linha 18, `menu/page.tsx` linha 5  
**Motivo:** O dashboard usa `preload="none"` (correto), mas login usa `preload="auto"` (implícito pela ausência do atributo). Um vídeo UHD de Pexels pode pesar 10–50MB. Na tela de login, isso prejudica o LCP diretamente. Além disso, se a Pexels retirar os vídeos, as páginas perdem o background sem aviso.

### L-2 — `lancamento/page.tsx` e `lancamento-acougue/page.tsx` — countdown hardcoded para 06/07
**Arquivos:** `src/app/lancamento/page.tsx`; `src/app/lancamento-acougue/page.tsx`, linha 6  
**Motivo:** `const LAUNCH_DATE = new Date('2026-07-06T10:00:00-03:00')` — após o lançamento, o contador exibirá tempo negativo ou "0d 0h 0m 0s". As páginas não têm fallback para pós-lançamento. São páginas de captação ativas.

### L-3 — `perfil/pontos/page.tsx` não tem loading skeleton, usa texto simples
**Arquivo:** `src/app/(dashboard)/perfil/pontos/page.tsx`, linha 73  
**Motivo:** `if (loading) return <div className="text-gray-400 text-center py-16">Carregando...</div>` — inconsistente com o padrão de skeleton usado em favoritos e boutiques.

### L-4 — Status "Concluido" e "Concluído" inconsistentes
**Arquivos:** `src/app/(dashboard)/orders/page.tsx` linha 28; `src/app/(dashboard)/orders/[id]/page.tsx` linha 18  
**Motivo:** `orders/page.tsx` usa `'Concluido'` (sem acento) e `orders/[id]/page.tsx` usa `'Concluido'` (também sem acento). Mas o `STATUS_SUBSTATES` em `orders/[id]/page.tsx` usa `'Acougue separando carnes'` sem acento. Esses são textos exibidos ao cliente na timeline do pedido.

### L-5 — `churras-club` acessível sem auth mas aparece na nav logada
**Arquivo:** `src/app/(dashboard)/layout.tsx`, linha 89; `src/proxy.ts` (inativo)  
**Motivo:** `/churras-club` não está em `PROTECTED_PREFIXES`, então qualquer usuário não autenticado pode acessar. A página tem seu próprio header alternativo com "Acessar conta" em vez do dashboard layout. Isso é intencional (página de marketing), mas o link na nav authenticated também leva para lá. Consistente, mas vale documentar a intenção.

### L-6 — `orders/[id]/page.tsx` status em inglês no `STATUS_SUBSTATES`
**Arquivo:** `src/app/(dashboard)/orders/[id]/page.tsx`, linhas 30–33  
**Motivo:** Substates como `'Acougue separando carnes'`, `'Churrasqueiro a caminho'`, `'Servindo'` são enviados e recebidos como strings literais do backend. Se o backend enviar essas strings, elas aparecem no frontend sem tradução. A inconsistência está no texto `'Acougue separando carnes'` (sem cedilha) vs `'Churrasqueiro chegou'` (correto).

### L-7 — `cron` no `vercel.json` executa apenas 1x/dia vs documentação que diz "a cada hora"
**Arquivo:** `frontend/vercel.json`, linha 5  
**Motivo:** `"schedule": "0 9 * * *"` executa às 9h UTC uma vez por dia, não a cada hora. O CLAUDE.md diz "cron-job.org → GET /cron/event-reminders a cada hora", que é um endpoint diferente no backend Railway. São dois sistemas distintos. O cron do Vercel chama `/api/cron/reminders` no Next.js (possivelmente para uma funcionalidade diferente). Sem documentação de por que existem dois sistemas de cron, isso pode causar confusão de manutenção.

### L-8 — `register/page.tsx` mostra "15% de desconto" para `referralCode`, mas `/indicar` promove "10%"
**Arquivo:** `src/app/(auth)/register/page.tsx`, linha 167; `src/app/(dashboard)/indicar/page.tsx`, linhas 27, 44  
**Motivo:** Na tela de cadastro com `?ref=CODIGO`, aparece "15% de desconto no primeiro churrasco já aplicado." Na tela de indicação, o texto diz "seus amigos ganham 10% OFF". São percentuais diferentes para o mesmo fluxo — um dos dois está errado.

---

## Resumo por categoria

| Categoria | Critical | High | Medium | Low |
|-----------|----------|------|--------|-----|
| Auth / Segurança | 1 (C-1) | — | 1 (M-6) | — |
| Copy / Modelo de negócio | 1 (C-2) | 2 (H-2, H-4) | — | 1 (L-8) |
| Routing / Links quebrados | 1 (C-3) | — | — | — |
| Performance / CSP | — | 1 (H-3) | — | 1 (L-1) |
| Tracking | — | 1 (H-1) | — | — |
| UX / Mobile | — | 1 (H-5) | 3 (M-1, M-7, M-8) | 4 (L-2–L-7) |
| Debug / Qualidade de código | — | — | 3 (M-2–M-5) | — |

**Total: 3 Critical · 5 High · 6 Medium · 8 Low**

---

## Prioridade imediata (bloqueia lançamento 06/07)

1. **C-1** — Renomear `src/proxy.ts` → `src/middleware.ts` e exportar como `export { proxy as default }`
2. **C-2** — Remover ou redirecionar `/parceiros` para `/para-acougues`, ou reescrever o conteúdo com o modelo real  
3. **C-3** — Corrigir href `/termos` → `/termos-de-uso` em `payment/page.tsx`
4. **H-1** — Mover `G-1ZXG3T5ST7` para `NEXT_PUBLIC_GA4_ID` em `.env` e `TrackingScripts.tsx`
5. **H-2** — Remover ou deixar claro que são dados ficticios/estimativas as strings de social proof na tela de login
6. **H-3** — Adicionar `https://videos.pexels.com` ao `media-src` no CSP do `next.config.ts`
7. **H-5** — Substituir `alert()` por inline error state nos formulários de GM e Boutique
8. **L-8** — Alinhar desconto de indicação: 10% ou 15%, escolher um e padronizar
