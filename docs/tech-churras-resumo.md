# Tech Churras — Resumo de Implementação
**Versão:** 1.0 · **Data:** 13 de junho de 2026  
**Stack:** Next.js 16 App Router · Fastify 5 · Prisma 7 · Supabase PostgreSQL · Vercel + Railway

---

## 1. Dashboard do Churrasqueiro — Completo (Sprint D)

### Visão geral
Reescrita completa de `/grillmasters/dashboard` com 4 abas independentes, sistema de treinamento e certificação, calendário de disponibilidade e formulário de perfil profissional.

### Arquivo principal
`frontend/src/app/(dashboard)/grillmasters/dashboard/page.tsx`

### 4 Abas implementadas

**Aba Eventos**
- Pedidos `PENDING` com indicador pulsante laranja — aguardando aceite/recusa
- Agenda dos próximos eventos (`CONFIRMED` / `IN_PROGRESS`)
- Histórico (`COMPLETED` / `CANCELLED`)
- Faturamento do mês: 93% do `totalPrice` (repasse do churrasqueiro)
- Stats: eventos este mês, avaliação média

**Aba Agenda**
- Calendário mensal em CSS puro — sem dependência de biblioteca
- Navegação por mês (← →)
- Dias disponíveis em laranja, indisponíveis em cinza
- Clique em qualquer dia faz toggle via `POST /grillmasters/schedule/toggle`
- Normalização de timezone: datas armazenadas com `.setUTCHours(12,0,0,0)` para evitar edge cases de meia-noite
- Backend retorna os próximos 60 dias de calendário

**Aba Perfil**
- Formulário completo: nome, cidade, bio, preço/hora, vídeo de apresentação (URL)
- `bringsEquipment`: toggle de botão customizado (não checkbox)
- `galleryUrls`: lista dinâmica com add/remove por URL (campo texto individual)
- Submit: `PUT /grillmasters`

**Aba Treinamento**
- 4 módulos sequenciais:
  1. Excelência no Atendimento ao Cliente
  2. Técnicas Avançadas de Churrasco
  3. Segurança Alimentar e Higiene
  4. Gestão do Negócio e Finanças
- Progresso visual (barra percentual: `checkedModules.size / 4 * 100%`)
- Botão "Concluir Treinamento" ativa todos via chamadas sequenciais a `POST /grillmasters/training/:moduleId/complete`
- Backend: array `trainingModules: Int[]`, deduplicado com `new Set`
- Ao completar os 4: gera `certificationCode = 'TC-' + randomUUID().slice(0,12).toUpperCase()` e seta `certifiedAt`

**Certificado Digital**
- Aparece automaticamente quando `profile.certifiedAt` existe
- Layout para impressão com `@media print { .no-print { display: none !important } }` (inline `<style>`)
- Campos: nome do profissional, data de certificação, código `TC-xxxxxxxx`
- Assinatura: "Jota Albuquerque · Fundador Tech Churras"
- Botão "Imprimir Certificado" chama `window.print()`
- Badge **CHANCELADO TC** exibido no card do churrasqueiro no dashboard

### Controle de uniforme (admin)
- Campo `uniformSent: Boolean` + `uniformSentAt: DateTime?` no modelo `Grillmaster`
- Rota: `PATCH /admin/grillmasters/:grillmasterId/uniform`
- Em `/admin`: badge "Treinamento ✓" quando `trainingModules.length === 4`
- Botão "Marcar uniforme enviado" → verde/desabilitado após envio

### Novos campos no schema (Prisma)
```prisma
model Grillmaster {
  videoUrl          String?
  certificationCode String?  @unique
  certifiedAt       DateTime?
  trainingModules   Int[]    @default([])
  uniformSent       Boolean  @default(false)
  uniformSentAt     DateTime?
}

model GrillmasterSchedule {
  @@unique([grillmasterId, date])
}
```

### Novas rotas (backend)
```
GET  /grillmasters/schedule                         → próximos 60 dias
POST /grillmasters/schedule/toggle                  → toggle disponibilidade
POST /grillmasters/training/:moduleId/complete      → conclui módulo
PATCH /admin/grillmasters/:grillmasterId/uniform    → marca uniforme enviado
```

> **Atenção Fastify:** todas as rotas específicas registradas ANTES de `/:id` para evitar match incorreto.  
> **Atenção Content-Type:** `POST /training/:id/complete` não tem body — enviar sem `Content-Type: application/json`, caso contrário Fastify retorna `FST_ERR_CTP_EMPTY_JSON_BODY`.

---

## 2. Dashboard Açougue com Interface iFood

> **STATUS: PENDENTE — próximo prompt**

Interface estilo iFood para o dashboard do açougue está planejada mas ainda não implementada. O dashboard atual (`/boutiques/dashboard`) já tem: stats de faturamento, toggle loja aberta/fechada, lista de produtos, pedidos recentes e QR code.

A interface iFood será implementada em sprint separada.

---

## 3. Separação de Dashboards por Role

### Arquivos-chave
- `frontend/src/components/Sidebar.tsx` (ou equivalente de navegação)
- `frontend/src/app/(dashboard)/layout.tsx`

### Regras por role

| Role | Rotas visíveis |
|---|---|
| `CUSTOMER` | Dashboard, Menu, Churrasqueiros, Açougues, Pedidos, Favoritos, Endereços, Ajuda |
| `BOUTIQUE` | Meu Açougue (`/boutiques/dashboard`), Ajuda |
| `GRILLMASTER` | Meu Dashboard (`/grillmasters/dashboard`), Ajuda |
| `ADMIN` | Dashboard, Admin (`/admin`), Fundador (`/founder`), Ajuda |

Links de Admin e Fundador **não aparecem** para outros roles.

### Redirects de cadastro
- `/boutiques/new` → após concluir → `/boutiques/dashboard`
- `/grillmasters/new` → após concluir → `/grillmasters/dashboard` ✔ (corrigido: redirecionava para `/dashboard`)

---

## 4. Contratos com Assinatura Eletrônica

### Módulo backend
`backend/src/modules/contracts/`

### Fluxo
1. Cadastro de parceiro (açougue ou churrasqueiro) chega na última etapa
2. Sistema gera contrato via `POST /contracts` com campos obrigatórios:
   - `durationMonths: 12`
   - `partnerDocument: '000.000.000-00'`
   - `partnerAddress: 'Cidade, UF'`
3. Modal de contrato exibe texto completo + scroll obrigatório
4. Checkbox de aceite só ativa após rolar até o fim
5. Assinatura registra: `acceptedAt` (timestamp), `signerIp` (IP real do usuário), `userId`
6. `POST /contracts/:id/sign` — efetiva a assinatura
7. Dashboard do parceiro mostra seção "Meu Contrato" com status e data de assinatura

---

## 5. Tech Churras IA — Menu com 3 Kits e Seção "Como é Feito"

### Arquivo principal
`frontend/src/app/menu/page.tsx`

### Funcionalidades
- **3 kits exclusivos** (não são sabores genéricos — são menus curados):
  - **Kit Essencial** — churrasco completo para grupos de até 10 pessoas
  - **Kit Premium** — upgrade com cortes nobres + acompanhamentos premium
  - **Kit Ultimate** — experiência completa com wagyu, sommelier e churrasqueiro profissional
- **Seção "Como é Feito"** com 3 passos:
  1. Você escolhe o kit → 2. IA monta o cardápio → 3. Entregamos ou organizamos tudo
- **Assistente IA** em `/menu/assistente` — chat com Claude via backend, sugere cardápios personalizados
- Link "Tech Churras IA" presente no card do menu

### Integração IA
- Backend: endpoint de proxy para Anthropic API
- Frontend: chat em tempo real no `/menu/assistente`
- Contexto do sistema: especialista em churrasco brasileiro, conhece os 3 kits, sugere quantidades por pessoa

---

## 6. Landing Pages de Parceiros

### `/para-acougues`
`frontend/src/app/para-acougues/page.tsx`

- Hero com proposta de valor para açougues parceiros
- Seção de benefícios (4 cards): visibilidade, pedidos automatizados, pagamento garantido, suporte
- Depoimentos de açougues (placeholder até Cidade Piloto)
- FAQ com 5 perguntas comuns
- CTA duplo: "Quero ser parceiro" → `/register?role=boutique`
- Cache: `revalidate: 3600` (1h)

### `/para-churrasqueiros`
`frontend/src/app/para-churrasqueiros/page.tsx`

- Hero com proposta de valor para churrasqueiros
- Seção "Como Funciona": 3 passos (cadastro → aceite de eventos → receba)
- Benefícios: renda extra, agenda flexível, suporte da plataforma, certificação
- Depoimentos + FAQ
- CTA: "Quero ser churrasqueiro Tech Churras" → `/register?role=grillmaster`
- Destaque para o programa de treinamento e badge Chancelado
- Cache: `revalidate: 3600` (1h)

---

## 7. Onboarding por Foto + IA (Açougue)

### Localização
`frontend/src/app/(dashboard)/boutiques/dashboard/page.tsx` — seção de produtos

### Fluxo
1. Botão "Adicionar por foto" na seção de produtos do dashboard do açougue
2. Upload de foto do produto (câmera ou galeria)
3. Imagem enviada ao backend → proxy para API de visão (Claude Haiku)
4. IA retorna: nome sugerido, categoria, descrição, preço estimado
5. Campos do formulário preenchidos automaticamente — usuário revisa e confirma
6. `POST /products` cria o produto com dados da IA

### Categorias disponíveis (enum)
`CARNE` · `CARVAO` · `ACOMPANHAMENTO` · `BEBIDA` · `OUTRO`

---

## 8. QR Code para Impressão

### Rotas
- `/boutiques/dashboard` → mostra QR code com código único do açougue (ex: `PREMIUM01`)
- `/boutiques/dashboard/qrcode-impressao` → layout imprimível, PDF-ready
- `/r/[code]` → redirect route pública para o link de indicação

### Funcionalidades
- Cada açougue tem `referralCode` único gerado no cadastro
- URL de referência: `techchurras.com.br/r/[code]`
- Placa para impressão: fundo branco, QR code grande centralizado, nome do açougue, URL legível abaixo
- Botão "Imprimir" → `window.print()` com CSS otimizado para impressão
- Dashboard mostra contador de indicações (quantas pessoas usaram o link)

---

## 9. Status Geral em `docs/status-geral.md`

**Arquivo:** `docs/status-geral.md`  
**Criado em:** 13/06/2026  
**Commit:** `22193dd`

### Resumo do checklist
- ✅ **12+ features** totalmente funcionais e testadas
- ⚠️ **6 features** implementadas mas não validadas end-to-end em produção real
- ❌ **5 itens** fora do escopo da Cidade Piloto

### 3 ações manuais pendentes (pré-lançamento)
| # | Ação | Criticidade |
|---|---|---|
| 1 | Cartão de crédito no Railway | 🔴 Crítico |
| 2 | `MP_ACCESS_TOKEN` → modo produção (`APP_USR-`) | 🔴 Crítico |
| 3 | Cron job no cron-job.org (`/cron/event-reminders`) | 🟡 Importante |

---

## 10. Contas Beta Criadas (Produção)

Para testes com usuários reais via `/beta-test`:

| Role | Email | Senha | Status |
|---|---|---|---|
| CUSTOMER | `beta.cliente@techchurras.com.br` | `Churras@2026` | Pronto, sem perfil (não precisa) |
| GRILLMASTER | `beta.grill@techchurras.com.br` | `Churras@2026` | Perfil completo, contrato assinado, treinamento concluído (TC-7F66BD2C4401) |
| BOUTIQUE | `beta.acougue@techchurras.com.br` | `Churras@2026` | Perfil completo, 5 produtos, contrato assinado, aguardando aprovação |

---

## 11. Testes E2E

**Arquivo:** `frontend/e2e_roteiro_completo.js` (Playwright)  
**Resultado:** 33/33 ✅ passando

**Correções aplicadas durante os testes:**
- Endpoint boutique: `/boutiques/my` (não `/boutiques/me`)
- Toggle de disponibilidade: texto "Disponivel" sem acento (não "Disponível")
- Training endpoint: não enviar `Content-Type: application/json` sem body
- Categorias de produto: `'CARNE'`, `'CARVAO'` (maiúsculas, enum)

---

## 12. Commits da Sprint

| Commit | Descrição |
|---|---|
| `22193dd` | docs: cria status-geral.md com checklist completo da sprint |
| `204d7ba` | feat: GM dashboard completo — 4 abas, agenda, treinamento, certificado, uniforme admin |
| `9fb6b1a` | feat: fechamento de ciclo — Tech Churras IA nas LPs, placa QR, docs atualizados |
| `a14a3a1` | feat: renomeia para Tech Churras IA e substitui estilos por 3 menus exclusivos |

---

## 13. Próximos Passos

1. **Dashboard açougue com interface iFood** — próximo prompt (planejado, não implementado)
2. **Beta test com usuários reais** — enviar link `/beta-test` com credenciais via WhatsApp
3. **Ativar pagamentos em produção** — trocar `MP_ACCESS_TOKEN` para `APP_USR-` e testar com R$ 1,00 real
4. **Configurar cron** — cadastrar endpoint no cron-job.org para lembretes automáticos de eventos

---

*Gerado em 13/06/2026 · Tech Churras Cidade Piloto Sprint*
