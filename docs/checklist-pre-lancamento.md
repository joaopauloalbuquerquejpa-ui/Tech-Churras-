# Checklist Pré-Lançamento — Tech Churras
**Versão:** 1.0 · **Data:** Junho 2026  
**Para:** João Paulo (ação manual necessária antes da Cidade Piloto)

---

> Estas 3 ações não podem ser feitas pelo código — precisam ser feitas manualmente por você no painel de cada serviço. Marque cada item conforme for completando.

---

## 1. Cartão de crédito no Railway

**Por que é crítico:** O Railway usa um crédito mensal de $5. Se o crédito zerar sem cartão cadastrado, o backend para completamente — o app fica fora do ar. O custo real de um backend pequeno como o Tech Churras é ~$1–3/mês.

**Como fazer:**

- [ ] Acesse https://railway.app e faça login
- [ ] No menu superior direito, clique no seu avatar → **"Account Settings"**
- [ ] Na lateral esquerda, clique em **"Billing"**
- [ ] Clique em **"Add Payment Method"**
- [ ] Insira os dados do cartão de crédito e salve
- [ ] Confirme que o status aparece como **"Billing Active"** ou similar

**O que acontece se não fizer:** Quando o crédito de $5 acabar, o Railway suspende todos os serviços do projeto. O frontend (Vercel) continua no ar, mas todas as chamadas à API retornam erro — o app fica inutilizável.

---

## 2. Mercado Pago — Verificar e ativar modo produção

**Por que é crítico:** Se o `MP_ACCESS_TOKEN` estiver em modo de testes (`TEST-...`), pagamentos reais de clientes não são processados — o checkout falha ou os valores não são cobrados de verdade.

**Como verificar o token atual:**

- [ ] Acesse https://railway.app → seu projeto → aba **"Variables"**
- [ ] Encontre a variável `MP_ACCESS_TOKEN`
- [ ] Verifique o prefixo do valor:
  - Começa com `TEST-` → **modo sandbox (testes)** — precisa trocar
  - Começa com `APP_USR-` → **modo produção** — OK, pode pular os passos abaixo

**Se o token for de teste — como gerar o de produção:**

- [ ] Acesse https://www.mercadopago.com.br/developers/panel/app
- [ ] Faça login com sua conta do Mercado Pago
- [ ] Selecione sua aplicação (ou crie uma nova: **"Criar aplicação"**)
- [ ] No menu lateral, clique em **"Credenciais de produção"**
- [ ] Copie o valor de **"Access Token"** (começa com `APP_USR-`)
- [ ] Volte ao Railway → **"Variables"** → clique em `MP_ACCESS_TOKEN`
- [ ] Substitua pelo novo valor e salve
- [ ] Aguarde o Railway fazer redeploy automático (~1 min)
- [ ] Teste fazendo um pagamento real de R$ 1,00 para confirmar

**Atenção:** O Mercado Pago pode pedir validação de identidade na primeira vez que você ativar as credenciais de produção. Isso pode levar algumas horas. Faça isso antes do dia do lançamento.

---

## 3. Cron Job no cron-job.org — Lembretes automáticos de eventos

**Por que é importante:** O endpoint `/cron/event-reminders` envia lembretes automáticos (WhatsApp + push notification) 48h e 24h antes de cada evento agendado. Sem o cron job configurado, nenhum lembrete é enviado.

**Passo a passo:**

- [ ] Acesse https://cron-job.org e crie uma conta gratuita (ou faça login)
- [ ] Clique em **"Create Cronjob"**
- [ ] Preencha os campos:
  - **Title:** `Tech Churras — Event Reminders`
  - **URL:** `https://tech-churras-production.up.railway.app/cron/event-reminders`
  - **Schedule:** selecione **"Every hour"** (ou Custom: minuto `0`, hora `*`, demais `*`)
- [ ] Abra a seção **"Advanced"** → **"Request headers"**
- [ ] Adicione o header:
  - **Name:** `x-cron-secret`
  - **Value:** *(copie o valor de `CRON_SECRET` do Railway → Variables)*
- [ ] Clique em **"Create"** para salvar

**Testar manualmente depois de criar:**

```bash
curl -X GET "https://tech-churras-production.up.railway.app/cron/event-reminders" \
  -H "x-cron-secret: SEU_CRON_SECRET_AQUI"
```

- [ ] Resposta esperada: `{"ok":true,"sent48":0,"sent24":0}` → funcionando
- [ ] Se retornar `{"error":"Unauthorized"}` → verifique se copiou o `CRON_SECRET` correto do Railway

---

## Status geral

| Item | Responsável | Status |
|---|---|---|
| Cartão no Railway | João Paulo | - [ ] Pendente |
| MP_ACCESS_TOKEN produção | João Paulo | - [ ] Verificar |
| Cron job no cron-job.org | João Paulo | - [ ] Pendente |

**Após completar os 3 itens:** o backend está protegido contra interrupção involuntária, os pagamentos reais funcionam e os lembretes automáticos estão ativos.
