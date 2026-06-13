# Checklist de Infraestrutura — Tech Churras

**Data:** Junho 2026

---

## 1. Status de Trial / Plano

### Vercel (Frontend)
- **Ação necessária:** Acesse https://vercel.com/tech-churras/frontend → Settings → Billing
- Verifique se o projeto está no plano **Hobby (gratuito)** ou em trial de Pro
- O plano Hobby é gratuito para sempre mas tem limites de banda e build minutes
- **Risco:** Se o uso mensal ultrapassar os limites do Hobby, o deploy pode ser pausado
- **Recomendação:** Para produção com tráfego real, considere upgrade para Pro (~$20/mês)

### Railway (Backend)
- **Ação necessária:** Acesse https://railway.app → seu projeto → Settings → Usage
- O Railway cobra por uso de recursos (CPU + RAM + banda)
- O plano Hobby (gratuito) tem $5/mês de crédito — verifique se está sendo consumido
- **Risco:** Se o crédito acabar, o serviço é pausado automaticamente
- **Recomendação:** Adicione um cartão de crédito para garantir continuidade; o custo real de um backend pequeno é ~$1-3/mês

---

## 2. Variáveis de Ambiente (Railway)

Acesse: Railway → seu projeto → Variables

| Variável | Obrigatória | O que faz | Verificar |
|---|---|---|---|
| `DATABASE_URL` | ✅ Sim | Conexão PostgreSQL (Supabase pgbouncer) | Deve conter `?pgbouncer=true` |
| `DIRECT_URL` | ✅ Sim | Conexão direta para migrations | Não deve ter `pgbouncer` |
| `JWT_SECRET` | ✅ Sim | Assina tokens de autenticação | Deve ser longo e aleatório |
| `MP_ACCESS_TOKEN` | ✅ Sim | Mercado Pago (pagamentos) | Começa com `APP_USR-` (produção) ou `TEST-` (sandbox) |
| `SUPABASE_URL` | ✅ Sim | URL do projeto Supabase | Formato: `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Sim | Chave pública Supabase | Chave JWT longa |
| `SUPABASE_SERVICE_KEY` | ✅ Sim | Chave de serviço Supabase (uploads) | Chave JWT longa (diferente da anon) |
| `ANTHROPIC_API_KEY` | ✅ Sim | Claude AI (planner + foto produto) | Começa com `sk-ant-` |
| `VAPID_PUBLIC_KEY` | ⚠️ Notificações | Web Push (notificações) | Sem isso, push notifications não funcionam |
| `VAPID_PRIVATE_KEY` | ⚠️ Notificações | Web Push (privado) | Sem isso, push notifications não funcionam |
| `ZAPI_INSTANCE` | ⚠️ WhatsApp | Instância Z-API | Sem isso, lembretes WhatsApp não são enviados |
| `ZAPI_TOKEN` | ⚠️ WhatsApp | Token Z-API | Sem isso, lembretes WhatsApp não são enviados |
| `CRON_SECRET` | ⚠️ Cron | Autenticação do cron job | Deve ser uma string longa e aleatória |
| `FRONTEND_URL` | ℹ️ Opcional | URL do frontend para redirects | `https://www.techchurras.com.br` |

**Como verificar:** Para cada variável, confirme que não há valor `undefined`, `null`, ou um placeholder como `COLOCAR_AQUI`.

---

## 3. Cron Job — Configuração no cron-job.org

O endpoint `/cron/event-reminders` envia lembretes de WhatsApp 48h e 24h antes de cada evento.

### Passo a passo para configurar no cron-job.org

1. Acesse https://cron-job.org e crie uma conta gratuita

2. Clique em **"Create Cronjob"**

3. Preencha os campos:
   - **Title:** Tech Churras — Event Reminders
   - **URL:** `https://tech-churras-production.up.railway.app/cron/event-reminders`
   - **Schedule:** Every hour → selecione **"Custom"** e configure:
     - Minuto: `0`
     - Hora: `*` (toda hora)
     - Dia: `*`
     - Mês: `*`
     - Dia da semana: `*`

4. Na seção **"Advanced"** → **"Headers"**, adicione:
   - Header name: `x-cron-secret`
   - Header value: (o valor da variável `CRON_SECRET` do Railway)

5. Clique em **"Create"**

### Testar manualmente

Para testar o endpoint agora, rode no terminal:

```bash
curl -X GET "https://tech-churras-production.up.railway.app/cron/event-reminders" \
  -H "x-cron-secret: SEU_CRON_SECRET_AQUI"
```

Resposta esperada: `{"ok":true,"sent48":0,"sent24":0}` (zeros se não há eventos agendados no momento)

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
| `Can't reach database server` | `DATABASE_URL` incorreta ou Supabase fora | Verifique a variável no Railway |
| `PrismaClientInitializationError` | Migration não foi aplicada | Rode `npx prisma db push` no Railway Console |
| `401 Unauthorized` em rotas protegidas | Token JWT expirado ou `JWT_SECRET` incorreto | Verifique o `JWT_SECRET` |
| `MP_ACCESS_TOKEN invalid` | Token Mercado Pago expirado | Gere novo token no painel do Mercado Pago |
| `ZAPI error 401` | Token Z-API inválido | Verifique `ZAPI_INSTANCE` e `ZAPI_TOKEN` |
| `AnthropicError: authentication_error` | `ANTHROPIC_API_KEY` inválida ou sem crédito | Verifique a chave em console.anthropic.com |

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
| `partner-images` | Fotos de churrasqueiros, açougues e produtos | ✅ Sim |

Se os buckets não existirem ou não forem públicos, uploads de fotos vão falhar.

---

## Resumo de Ações Necessárias

- [ ] Verificar billing/crédito no Railway (adicionar cartão se necessário)
- [ ] Verificar billing/plano no Vercel
- [ ] Confirmar todas as variáveis de ambiente no Railway (sem placeholders)
- [ ] Configurar cron job no cron-job.org com o header `x-cron-secret`
- [ ] Testar o endpoint `/cron/event-reminders` manualmente
- [ ] Revisar logs do Railway por erros recorrentes
- [ ] Confirmar buckets `review-photos` e `partner-images` públicos no Supabase
