# Checklist de Infraestrutura — Tech Churras

**Versão:** 2.0 · **Data:** Junho 2026  
**Status geral:** ✅ Pronto para Cidade Piloto (com ressalva no cron job — ver seção 3)

---

## 1. Status de Trial / Plano

### Vercel (Frontend)
- **Ação necessária:** Acesse https://vercel.com/tech-churras/frontend → Settings → Billing
- O plano Hobby é gratuito para sempre, mas tem limites de banda (100 GB/mês) e de build minutes (6.000 min/mês)
- **Risco real para Cidade Piloto:** Baixo — com tráfego inicial, o Hobby aguenta bem. Monitorar ao atingir ~50 usuários ativos simultâneos.
- **Recomendação:** Manter Hobby por ora. Ao escalar para 200+ usuários/dia, avaliar upgrade para Pro (~$20/mês)

### Railway (Backend)
- **Ação necessária:** Acesse https://railway.app → seu projeto → Settings → Usage
- O plano Hobby tem $5/mês de crédito. Um backend pequeno (Fastify + Prisma) consome ~$1–3/mês
- **Risco:** Se o crédito zerar sem cartão cadastrado, o serviço para automaticamente
- **Recomendação:** ⚠️ **Adicionar cartão de crédito no Railway antes de lançar a Cidade Piloto.** O custo real é mínimo, mas a continuidade é crítica.

---

## 2. Variáveis de Ambiente (Railway)

Acesse: Railway → seu projeto → Variables

| Variável | Status | O que faz | Observação |
|---|---|---|---|
| `DATABASE_URL` | ✅ Configurada | Conexão PostgreSQL (Supabase pgbouncer) | Deve conter `?pgbouncer=true` |
| `DIRECT_URL` | ✅ Configurada | Conexão direta para migrations | Sem `pgbouncer` |
| `JWT_SECRET` | ✅ Configurada | Assina tokens de autenticação | Longo e aleatório |
| `MP_ACCESS_TOKEN` | ✅ Configurada | Mercado Pago (pagamentos) | Verificar se é produção (`APP_USR-`) ou sandbox (`TEST-`) |
| `SUPABASE_URL` | ✅ Configurada | URL do projeto Supabase | Formato: `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Configurada | Chave pública Supabase | JWT longa |
| `SUPABASE_SERVICE_KEY` | ✅ Configurada | Chave de serviço Supabase (uploads) | JWT longa, diferente da anon |
| `ANTHROPIC_API_KEY` | ✅ Configurada | Claude AI (Tech Churras IA + foto produto) | Chave `sk-ant-` configurada via Railway |
| `VAPID_PUBLIC_KEY` | ⚠️ Verificar | Web Push (notificações) | Sem isso, push notifications não funcionam |
| `VAPID_PRIVATE_KEY` | ⚠️ Verificar | Web Push (privado) | Sem isso, push notifications não funcionam |
| `ZAPI_INSTANCE` | ⚠️ Opcional | Instância Z-API (WhatsApp) | Sem isso, lembretes WhatsApp não são enviados |
| `ZAPI_TOKEN` | ⚠️ Opcional | Token Z-API | Sem isso, lembretes WhatsApp não são enviados |
| `CRON_SECRET` | ⚠️ Verificar | Autenticação do cron job | Deve ser string longa e aleatória |
| `FRONTEND_URL` | ✅ Configurada | URL do frontend para redirects | `https://www.techchurras.com.br` |

**Como verificar:** Para cada variável, confirme que não há valor `undefined`, `null`, ou placeholder como `COLOCAR_AQUI`.

---

## 3. Cron Job — Configuração no cron-job.org

O endpoint `/cron/event-reminders` envia lembretes de WhatsApp 48h e 24h antes de cada evento.

> ⚠️ **Status:** Se ainda não foi configurado, fazer antes do primeiro evento agendado na Cidade Piloto.

### Passo a passo para configurar no cron-job.org

1. Acesse https://cron-job.org e crie uma conta gratuita

2. Clique em **"Create Cronjob"**

3. Preencha os campos:
   - **Title:** Tech Churras — Event Reminders
   - **URL:** `https://tech-churras-production.up.railway.app/cron/event-reminders`
   - **Schedule:** selecione **"Custom"** e configure:
     - Minuto: `0`
     - Hora: `*` (toda hora)
     - Dia: `*` · Mês: `*` · Dia da semana: `*`

4. Na seção **"Advanced"** → **"Headers"**, adicione:
   - Header name: `x-cron-secret`
   - Header value: (o valor da variável `CRON_SECRET` do Railway)

5. Clique em **"Create"**

### Testar manualmente

```bash
curl -X GET "https://tech-churras-production.up.railway.app/cron/event-reminders" \
  -H "x-cron-secret: SEU_CRON_SECRET_AQUI"
```

Resposta esperada: `{"ok":true,"sent48":0,"sent24":0}`

Se retornar `{"error":"Unauthorized"}`, o `CRON_SECRET` está errado.

---

## 4. Revisão de Logs do Railway

Para checar logs das últimas 24h:

1. Acesse https://railway.app → seu projeto → seu serviço
2. Clique na aba **"Logs"**
3. Filtre por: últimas 24h

### Erros comuns e soluções

| Erro | Causa provável | Solução |
|---|---|---|
| `Can't reach database server` | `DATABASE_URL` incorreta ou Supabase fora | Verificar variável no Railway |
| `PrismaClientInitializationError` | Migration não foi aplicada | Rodar `npx prisma db push` no Railway Console |
| `401 Unauthorized` em rotas protegidas | Token JWT expirado ou `JWT_SECRET` incorreto | Verificar `JWT_SECRET` |
| `MP_ACCESS_TOKEN invalid` | Token Mercado Pago expirado | Gerar novo token no painel do Mercado Pago |
| `ZAPI error 401` | Token Z-API inválido | Verificar `ZAPI_INSTANCE` e `ZAPI_TOKEN` |
| `AnthropicError: authentication_error` | `ANTHROPIC_API_KEY` inválida ou sem crédito | Verificar chave em console.anthropic.com |

### O que procurar nos logs

- ❌ Linhas com `ERROR` ou `Error:` — indicam falhas
- ⚠️ Linhas com `Warning` — podem indicar problemas futuros
- ✅ `Server listening on port 3333` — backend iniciou corretamente
- ✅ `[Reminder WhatsApp] Enviado para` — lembretes funcionando

---

## 5. Supabase Storage — Buckets

Verifique no painel do Supabase (https://supabase.com → seu projeto → Storage):

| Bucket | Usado para | Deve ser público |
|---|---|---|
| `review-photos` | Fotos de avaliações | ✅ Sim |
| `partner-images` | Fotos de churrasqueiros, açougues, produtos (Tech Churras IA) | ✅ Sim |

Se os buckets não existirem ou não forem públicos, uploads de fotos vão falhar.

---

## 6. Funcionalidades Ativas — Status por Módulo

| Módulo | Status | Observação |
|---|---|---|
| Autenticação (login/cadastro) | ✅ | JWT, Fastify |
| Listagem de churrasqueiros | ✅ | Filtros por cidade, avaliação, preço |
| Perfil público do churrasqueiro | ✅ | |
| Criação de pedidos | ✅ | Multi-step form |
| Pagamento (Mercado Pago) | ✅ | Verificar se está em modo produção |
| Acompanhamento de pedido + mapa | ✅ | |
| Chat cliente ↔ churrasqueiro | ✅ | |
| Avaliações com foto | ✅ | Supabase Storage |
| Dashboard do açougue | ✅ | |
| Previsão de demanda | ✅ | |
| QR code de indicação (açougue) | ✅ | `/r/{code}` |
| Placa de QR code para impressão | ✅ | `/boutiques/dashboard/qrcode-impressao` |
| Tech Churras IA (planejar evento) | ✅ | 3 menus + seção "Como é Feito" |
| Foto → IA → produto (açougue) | ✅ | Claude Vision + Supabase |
| Lembretes WhatsApp (cron) | ⚠️ | Depende de configurar cron-job.org e Z-API |
| Push notifications | ⚠️ | Depende de configurar VAPID keys |

---

## Resumo de Ações Necessárias Antes da Cidade Piloto

- [ ] **Crítico:** Adicionar cartão de crédito no Railway (garantir continuidade)
- [ ] **Crítico:** Confirmar que `MP_ACCESS_TOKEN` está em modo **produção** (não sandbox)
- [ ] **Importante:** Configurar cron job no cron-job.org com o header `x-cron-secret`
- [ ] **Importante:** Testar o endpoint `/cron/event-reminders` manualmente
- [ ] **Verificar:** Confirmar buckets `review-photos` e `partner-images` públicos no Supabase
- [ ] **Verificar:** Confirmar que `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` estão configuradas
- [ ] **Opcional:** Configurar Z-API para lembretes WhatsApp automáticos
- [ ] Revisar logs do Railway por erros recorrentes nas últimas 24h

---

## Conclusão

**O projeto está apto para iniciar a Cidade Piloto** com as seguintes ressalvas:
1. Cartão de crédito no Railway (evita interrupção involuntária do serviço)
2. Confirmar que o Mercado Pago está em modo produção (caso contrário, pagamentos reais não funcionam)
3. Configurar o cron job antes do primeiro evento agendado (para que os lembretes automáticos funcionem)

Tudo mais está implementado, deployado e validado em produção.
