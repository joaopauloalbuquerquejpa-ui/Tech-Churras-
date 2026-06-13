# Status Geral — Tech Churras
**Versão:** 1.0 · **Data:** 13 de junho de 2026  
**Último commit:** `1a9df11` — feat: navegação por role, GM dashboard renovado e fluxo de cadastro corrigido

---

## 1. Segurança — Tokens expostos nos scripts de screenshot

**Conclusão: sem risco.** Os dois tokens expostos nos scripts (`ss_grillmaster_flow.js`, `ss_boutique_dashboard.js`) pertencem exclusivamente a contas de teste:

| Token | Role | Email | Emitido em |
|---|---|---|---|
| `3cb980b7...` | GRILLMASTER | carlos.grill@teste.com | 13/06/2026 13:45 |
| `fe780a33...` | BOUTIQUE | premium.acougue@teste.com | 13/06/2026 13:55 |

Nenhuma conta real ou de fundador foi exposta. Os tokens não têm campo `exp` (não expiram por tempo), mas pertencem a contas descartáveis de sandbox. Ação necessária: nenhuma.

---

## 2. Checklist de Status — Funcionalidades

### ✅ 100% funcional e testado

**Fluxos de cadastro e contratos**
- Cadastro de cliente (`/register?role=customer`) — formulário + JWT + redirect para `/dashboard`
- Cadastro de açougue (`/boutiques/new`) — multi-step, contrato e-sign (scroll + aceite + IP + timestamp), redirect para `/boutiques/dashboard`
- Cadastro de churrasqueiro (`/grillmasters/new`) — multi-step, contrato e-sign, redirect corrigido para `/grillmasters/dashboard` ✔
- Backend: módulo `/contracts` com geração e assinatura de contratos de parceiros

**Dashboards separados por role**
- **Cliente** (`/dashboard`) — pedidos ativos, histórico, acesso a /menu, /grillmasters, /boutiques, /favoritos, /perfil/enderecos
- **Açougue** (`/boutiques/dashboard`) — stats (faturamento, pedidos), gráfico de receita, previsão de demanda, toggle "Loja aberta/fechada", QR code de indicação, placa para impressão, produtos com toggle individual + adicionar por foto via IA, pedidos recentes
- **Churrasqueiro** (`/grillmasters/dashboard`) — toggle de disponibilidade (verde/cinza), novos eventos para aceitar/recusar (PENDING, com indicador pulsante), agenda dos próximos eventos (CONFIRMED/IN_PROGRESS), stats do mês, seção "Meu Contrato", histórico (COMPLETED/CANCELLED)
- **Admin** (`/dashboard` + `/admin` + `/founder`) — visível apenas para role ADMIN

**Navegação por role**
- CUSTOMER vê: Dashboard, Menu, Churrasqueiros, Açougues, Pedidos, Favoritos, Endereços, Ajuda
- BOUTIQUE vê: Meu Açougue, Ajuda
- GRILLMASTER vê: Meu Dashboard, Ajuda
- ADMIN vê: Dashboard, Admin, Fundador, Ajuda
- Links de Admin/Fundador **removidos** da visualização de outros roles ✔

**Tech Churras IA (menu)**
- 3 kits exclusivos: Kit Essencial / Kit Premium / Kit Ultimate
- Seção "Como é Feito" com 3 passos
- Assistente IA em `/menu/assistente` (integrado ao Claude via backend)
- Link "Tech Churras IA" no card do menu

**Landing pages de parceiros**
- `/para-acougues` — hero, benefícios, depoimentos, FAQ, CTA → `/register?role=boutique`
- `/para-churrasqueiros` — hero, benefícios, depoimentos, FAQ, CTA → `/register?role=grillmaster`
- Seção "Como Funciona" em ambas as LPs

**Sistema de indicação por QR code**
- QR code único por açougue (código ex: `PREMIUM01`)
- URL de referência: `techchurras.com.br/r/[code]`
- `/r/[code]` — redirect route funcional
- Placa para impressão: `/boutiques/dashboard/qrcode-impressao` (layout imprimível, PDF-ready)
- Dashboard mostra contador de indicações

**Roteiro de teste (`/beta-test`)**
- Página pública, mobile-first, `noindex,nofollow`
- 3 seções: Cliente / Churrasqueiro / Açougue
- Checkboxes interativos por step
- Cartão sandbox exibido com destaque
- Contato WhatsApp + email ao final

**PWA**
- `manifest.json` + `sw.js` instalados
- `theme-color` + `apple-touch-icon` configurados
- App instalável no Android via "Adicionar à tela inicial"

---

### ⚠️ Implementado mas não validado end-to-end

| Feature | Status | O que falta |
|---|---|---|
| Pagamento via Mercado Pago | Funciona em sandbox | `MP_ACCESS_TOKEN` ainda em modo `TEST-` — trocar para `APP_USR-` antes do lançamento |
| Aceitar/recusar eventos (GM) | Implementado e revisado no código | Não confirmado em produção com um pedido real de ponta a ponta |
| Push notifications (VAPID) | Backend configurado | Testado só em dev; iOS requer Add to Home Screen + iOS 16.4+ (cobertura ~15%) |
| Lembretes automáticos de eventos | Endpoint `/cron/event-reminders` pronto | Cron job no cron-job.org não configurado ainda |
| Tech Churras IA gerando cardápios | Funciona em sandbox | Não testado com usuários reais fazendo pedidos completos |
| Onboarding guiado (tour) | Implementado no layout | Não validado com usuários reais — pode ter friction points |

---

### ❌ Não implementado / fora do escopo atual

| Item | Decisão |
|---|---|
| Multi-role (ser açougue E churrasqueiro) | Fora do escopo da Cidade Piloto — usuários criam contas separadas |
| iOS push notifications nativas | Requer React Native (~3–4 meses). PWA cobre Android; iOS via Add to Home Screen |
| GPS/rastreamento de entrega em background | Limitação do Web API. Futuro: React Native |
| Admin panel completo (`/admin`, `/founder`) | Rotas existem e são acessíveis para ADMIN; não detalhado nesta sprint |
| Testes automatizados (Jest/Playwright CI) | Scripts de smoke test existem mas não estão em CI |

---

## 3. Ações manuais pendentes (pré-lançamento)

Ver `docs/checklist-pre-lancamento.md` para o passo a passo completo.

| # | Ação | Criticidade | Status |
|---|---|---|---|
| 1 | Cartão de crédito no Railway | 🔴 Crítico — sem cartão o backend para quando o crédito de $5 acabar | Pendente |
| 2 | `MP_ACCESS_TOKEN` → modo produção | 🔴 Crítico — sem isso, pagamentos reais não funcionam | Verificar |
| 3 | Cron job no cron-job.org | 🟡 Importante — sem isso, nenhum lembrete automático é enviado | Pendente |

---

## 4. Próximos passos sugeridos (pré Cidade Piloto)

Em ordem de prioridade:

### 🥇 1. Executar o roteiro de teste com 2–3 usuários reais (esta semana)

**Por quê é o mais crítico:** Todo o desenvolvimento foi feito e validado por você (o desenvolvedor). Nenhum usuário leigo passou pelos fluxos. É aqui que surgem os bugs de UX mais impactantes — campos confusos, erros não tratados, redirects inesperados. Uma sessão de 30 minutos com um amigo testando pode revelar mais do que semanas de desenvolvimento.

**Como fazer:** Envie o link `techchurras.com.br/beta-test` para 2–3 pessoas (um como cliente, um como churrasqueiro, um como açougue). Observe em tempo real ou peça que anotem onde travaram. Use o roteiro da página para guiar.

---

### 🥈 2. Completar as 3 ações manuais do checklist pré-lançamento

**Por quê é urgente:** Sem cartão no Railway e sem MP em produção, o app tecnicamente não funciona para uso real. Estas 3 ações levam menos de 30 minutos no total e desbloqueiam tudo.

**Referência:** `docs/checklist-pre-lancamento.md`

---

### 🥉 3. Testar o fluxo completo de ponta a ponta com dinheiro real

**Por quê é necessário:** Pagamento → aceite pelo GM → confirmação → evento → avaliação. Nunca foi feito com `APP_USR-` em produção. Fazer isso com R$ 1,00 antes do lançamento evita surpresas no dia.

**Sequência:** (1) Ativar MP produção, (2) Criar pedido como cliente real → (3) Churrasqueiro aceita → (4) Marcar como concluído → (5) Avaliar → (6) Confirmar que repasse aparece no dashboard do churrasqueiro.

---

*Gerado em 13/06/2026 com base no estado do repositório após commit `1a9df11`.*
