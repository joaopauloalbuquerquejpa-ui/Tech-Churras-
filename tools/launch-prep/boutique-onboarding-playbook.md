# Playbook de Onboarding — Açougue Parceiro Tech Churras

**Versao:** 2.0 | **Data:** 2026-06-29
**Responsavel:** Jota (remoto, Zanzibar) — operacao 100% async via WhatsApp

---

## NOTAS INTERNAS — LER ANTES DE USAR (so para o rep e o Jota)

Tres bugs operacionais ativos no lancamento. Nao revelar ao parceiro.

**Bug 1 — Periodo gratuito: codigo diz 60 dias, comercial promete 3 meses.**
O campo `trialEndsAt` e calculado como `hoje + 60 dias` no backend (`boutiques.service.ts`, linha 76).
O pitch e o CLAUDE.md prometem "3 meses gratis". O açougue vai ver o aviso de encerramento
antes da promessa ser cumprida se nao for corrigido.
Correcao: trocar `+ 60` por `+ 90` no `boutiques.service.ts` linha 76 antes de fechar parceiros.

**Bug 2 — Chave PIX nao e autocadastrada pelo proprio açougue.**
O campo `pixKey` do banco nao esta exposto no dashboard do parceiro — so aparece no painel admin.
O rep deve coletar a chave PIX na assinatura e enviar ao Jota por WhatsApp imediatamente.
Jota insere manualmente via `techchurras.com.br/admin` antes do primeiro repasse.

**Bug 3 — Repasse e 100% manual.**
Nao existe PIX automatico. Jota deve clicar em "Gerar repasses" na tela `/admin/repasses`
e marcar como pago manualmente. Cadencia recomendada: toda segunda-feira.

---

## DIA 0 — ASSINATURA (rep presencial)

### O que coletar antes de sair do estabelecimento

Sair com tudo anotado — papel ou nota no WhatsApp. Nada de "eu mando depois":

```
CHECKLIST DIA 0

[ ] Nome completo do responsavel (para criar a conta)
[ ] E-mail (vai ser o login na plataforma)
[ ] Celular com WhatsApp — com DDD, sem espacos
[ ] CNPJ do estabelecimento (para o contrato digital)
[ ] Nome do acougue (exatamente como aparece na fachada)
[ ] Endereco completo (rua, numero, bairro, cidade, estado)
[ ] Horario de funcionamento — formato: "Seg-Sex 7h-18h, Sab 7h-14h"
[ ] Modalidade: so retirada / so entrega / os dois
[ ] Instagram (opcional, sem @)
[ ] CHAVE PIX — CNPJ, CPF, telefone ou e-mail cadastrado no banco
    --> Enviar ao Jota por WhatsApp antes de chegar em casa
```

A chave PIX e a unica que nao pode esperar. Sem ela, o primeiro repasse nao sai.

---

### Mensagem 1 — Boas-vindas (enviar no WhatsApp imediatamente apos a assinatura)

Copie, substitua os campos entre [ ] e envie:

```
Ola, [NOME]! Aqui e [NOME DO REP] da Tech Churras.

Seja bem-vindo como parceiro fundador!

Voce acabou de garantir uma das 5 vagas de acougue fundador em SP.
3 meses gratis. Comissao so quando vender. Sem mensalidade agora.

O que acontece agora:

1. Crie sua conta hoje (leva 5 minutos, link abaixo).
2. Nossa equipe aprova em ate 24 horas — voce recebe aviso aqui no WhatsApp.
3. Depois da aprovacao, seus cortes ja aparecem para os clientes do app.

LINK PARA CRIAR SUA CONTA:
techchurras.com.br/register?role=BOUTIQUE

Qualquer duvida, me chama aqui. Bem-vindo!
```

---

### Mensagem 2 — Chave PIX para o Jota (enviar pelo rep, nao pelo parceiro)

Encaminhar ao Jota imediatamente apos sair do estabelecimento:

```
Jota, novo acougue assinado.

Nome: [NOME DO ACOUGUE]
Responsavel: [NOME]
Cidade: [CIDADE/BAIRRO]
Chave PIX: [CHAVE]

Ja pedi pra ele criar a conta. Assim que aparecer no admin, pode aprovar.
```

---

## DIAS 1-3 — SETUP DA CONTA

### Mensagem 3 — Guia de criacao de conta (enviar no Dia 1 se ele nao tiver criado)

```
[NOME], bom dia! Vou te mandar o passo a passo para criar sua conta agora.
Sao 5 minutos. Pode fazer pelo celular mesmo.

--- PASSO 1: CRIAR CONTA ---

1. Abra no celular: techchurras.com.br/register?role=BOUTIQUE
2. Preencha: seu nome, e-mail e uma senha.
3. Toque em "Criar conta".

--- PASSO 2: CADASTRAR O ACOUGUE ---

4. Vai aparecer a tela com o botao laranja
   "Cadastrar meu acougue agora". Toque nele.

5. Adicione uma foto do logo (quadrada) e uma da fachada.
   Pode ser foto tirada agora com o celular.

6. Preencha:
   - Nome do acougue
   - Endereco completo
   - Cidade: Sao Paulo
   - Estado: SP
   - Telefone com DDD

7. Horario de funcionamento.
   Exemplo: "Seg-Sex 7h-18h, Sab 7h-14h"

8. Modalidade: escolha "Retirada"
   (o churrasqueiro vem buscar as carnes no seu balcao)

9. Instagram se quiser (opcional).

10. Toque em "Enviar para aprovacao".

11. Aparece o contrato digital. Leia e toque em "Aceitar contrato".

Pronto! Sua conta esta criada.
Nossa equipe aprova em ate 24 horas e voce recebe aviso aqui.

Me manda um "feito" quando terminar.
```

---

### O que acontece no backend quando o cadastro e enviado

- O sistema gera automaticamente um codigo de indicacao unico para o acougue.
- O sistema configura o periodo gratuito (60 dias no codigo — ver Bug 1).
- Jota recebe push notification + WhatsApp automatico com nome, email e cidade.
- Jota aprova em `techchurras.com.br/admin` — so entao o acougue aparece nas buscas.

---

### Mensagem 4 — Confirmacao de aprovacao (enviar quando Jota aprovar)

```
[NOME], boas noticias!

Seu acougue foi aprovado. Agora e hora de cadastrar seus cortes.

Acesse seu painel: techchurras.com.br/boutiques/dashboard

Vou te mandar o guia de produtos em seguida.
```

---

### Mensagem 5 — Guia de produtos (enviar apos aprovacao)

```
[NOME], aqui esta como adicionar seus cortes ao painel.

--- COMO CADASTRAR PRODUTOS ---

1. Acesse: techchurras.com.br/boutiques/dashboard
2. Toque na aba "Produtos" (quarta aba do menu).
3. Toque em "+ Produto".

OPCAO RAPIDA COM FOTO (mais facil):
4. Toque em "Tirar foto do produto".
5. Aponte a camera para a peca com boa luz.
6. O sistema preenche nome, descricao e categoria sozinho.
7. Confirme o PRECO POR KG e toque em "Salvar".

OPCAO MANUAL:
4. Nome do produto (ex: "Picanha Angus").
5. Preco por kg.
6. Categoria: Carne, Sal e Tempero, Carvao,
   Acompanhamento, Bebida ou Outro.
7. Marque "Disponivel" e toque em "Salvar".

META PARA APARECER BEM NAS BUSCAS:
- Pelo menos 5 cortes de carne (Picanha, Costela,
  Maminha, Fraldinha, Linguica sao os mais pedidos)
- Pelo menos 1 acompanhamento (farofa, vinagrete,
  paozinho de alho, queijo coalho...)

Se nao tiver foto, cadastre sem ela — da para adicionar depois.

Me manda quantos produtos voce cadastrou quando terminar!
```

---

### Guia de fotos — instrucoes para o proprio dono tirar

Para incluir no guia impresso ou enviar como mensagem separada:

```
DICAS DE FOTO — SEM PRECISAR DE FOTOGRAFO

Luz: foto perto da janela pela manha, sem flash.
Fundo: tabua de madeira, papel craft ou balcao limpo.
Angulo: camera a 45 graus de cima, peca no centro.
Uma foto por produto. Celular e suficiente.

O que fotografar primeiro:
Picanha, costela, maminha, fraldinha — sao os
mais pedidos nos churrascos.

A plataforma redimensiona a foto automaticamente.
```

---

### Mensagem 6 — Guia de kits (enviar depois que tiver pelo menos 3 produtos)

```
[NOME], agora vou te ensinar a criar os "Pacotes de Churrasco".

Os pacotes sao kits com varios cortes num preco unico
para um numero de pessoas. E o que aparece para o cliente
quando ele monta o pedido pelo app.

--- COMO CRIAR UM PACOTE ---

1. No painel, aba "Produtos", role para baixo
   ate "Pacotes de Churrasco".
2. Toque em "+ Novo pacote".
3. Preencha:
   - Nome: ex. "Kit Familia 15 pessoas"
   - Descricao: ex. "Picanha, costela, linguica e farofa"
   - Minimo de convidados: ex. 12
   - Maximo de convidados: ex. 18
4. Adicione os itens: clique em "+ Item", selecione
   o produto e defina a quantidade.
5. O sistema calcula o preco total automaticamente.
6. Adicione foto de capa (opcional).
7. Toque em "Salvar pacote".

SUGESTAO PARA COMECAR COM 3 KITS:

Kit Basico 10 pax
- 2 kg picanha + 1,5 kg maminha + 1 kg linguica
- 1 kg farofa + 1 kg sal grosso

Kit Familia 20 pax
- 3 kg picanha + 2 kg costela + 1,5 kg maminha
- 1 kg linguica + farofa + sal grosso

Kit Premium 30 pax
- 4 kg picanha + 3 kg costela + 2 kg maminha
- 2 kg linguica + farofa + vinagrete + sal grosso

Me fala se precisar de ajuda pra montar os precos.
```

---

### Abrir a loja

Somente apos ter pelo menos 1 produto cadastrado e aprovacao ativa:

1. No topo do painel, toque no botao *"Loja fechada — abrir"*.
2. Botao fica verde: *"Loja aberta — fechar"*.
3. O acougue passa a aparecer nas buscas e pode receber pedidos.

Para fechar temporariamente (feriado, falta de estoque): mesmo botao, toca para fechar.
Nenhum pedido chega enquanto a loja esta fechada.

---

### Imprimir os QR Codes do painel

O painel tem DOIS QR Codes diferentes. O rep precisa explicar a diferenca:

**QR Code do Balcao** (converte cliente fisico em pedido digital):
- Painel → aba "Balcao" → botao "Imprimir Placa"
- Link direto: `techchurras.com.br/boutiques/dashboard/qrcode-eventos`
- Quando o cliente escaneia, o app abre com o acougue ja pre-selecionado.
- Imprimir em A5 ou A4, plastificar, colar na frente do caixa.

**QR Code de Indicacao** (ganha R$ 40 por cliente novo):
- Painel → aba "Indicacoes" → botao "Imprimir Placa"
- Link direto: `techchurras.com.br/boutiques/dashboard/qrcode-impressao`
- Quando o cliente escaneia e faz o primeiro pedido, o acougue ganha R$ 40 de bonus.
- Colocar no WhatsApp Status, Instagram e tambem no balcao.

Script para o atendente (esta pronto na aba "Balcao" do painel):

```
"Voce vai fazer churrasco? A gente tem parceria com
churrasqueiros profissionais certificados. Voce escaneia
esse QR aqui, escolhe o churrasqueiro e a carne ja vem
separada daqui mesmo. Tudo em um app, facil."
```

---

## SEMANA 1 — PREPARACAO PARA O PRIMEIRO PEDIDO

### Checklist de verificacao — confirmar com o parceiro no Dia 3

O rep envia por WhatsApp e pede para o parceiro confirmar item a item:

```
[NOME], checklist rapido antes do primeiro pedido chegar.
Me fala quais estao prontos:

[ ] Conta criada e login funcionando
[ ] Acougue aprovado (status verde no painel)
[ ] Pelo menos 5 cortes de carne cadastrados com preco
[ ] Pelo menos 1 acompanhamento cadastrado
[ ] Pelo menos 1 Kit de Churrasco criado
[ ] Loja no status "Aberta" (botao verde no topo do painel)
[ ] QR Code do balcao impresso e afixado no caixa
[ ] Chave PIX enviada para nos (para configurar o repasse)

Algum que nao tiver pronto, me chama que a gente resolve rapido.
```

Se algum item estiver faltando, o rep agenda 30 minutos por videochamada ou presencial.

---

### Como funciona a notificacao de pedido

Quando um cliente fecha um pedido que inclui o acougue, chegam DOIS avisos simultaneos:

**1. Mensagem no WhatsApp** no numero cadastrado no perfil:
- Data e horario do evento
- Numero de convidados
- Nome do churrasqueiro responsavel
- Lista de itens com quantidade (ex: "3 kg Picanha Angus, 2 kg Costela")
- Link direto: `techchurras.com.br/boutiques/dashboard`

**2. Notificacao push no celular** (aparece no topo da tela como qualquer mensagem):
- Requer que o dono tenha acessado o site pelo celular e aceitado a permissao de notificacao.
- Se nao receber o push, o WhatsApp funciona independentemente — nao e critico.

O acougue tambem recebe um segundo aviso quando o churrasqueiro confirma retirada.

---

### Mensagem 7 — Guia de atendimento de pedido (enviar antes do primeiro pedido chegar)

```
[NOME], antes do primeiro pedido chegar, vou te ensinar
como responder. E muito simples.

--- QUANDO CHEGAR O AVISO DE NOVO PEDIDO ---

1. Abra: techchurras.com.br/boutiques/dashboard
2. O pedido aparece com fundo laranja no topo da tela.
3. Voce ve: data do evento, convidados, itens e quantidades.
4. Se tiver estoque, toque em "Aceitar pedido" (botao verde).
   - O cliente e o churrasqueiro recebem aviso na hora.
5. Se NAO tiver estoque naquele dia, toque em "Recusar".
   - Recuse logo — nao deixar pendente.

--- QUANDO OS CORTES ESTIVEREM PRONTOS PARA RETIRADA ---

6. No mesmo pedido, toque em
   "Cortes prontos — avisar churrasqueiro".
7. O churrasqueiro recebe notificacao para passar no balcao.

OS 3 STATUS DO PEDIDO:
- Pendente (laranja) = voce precisa aceitar ou recusar
- Confirmado (azul) = voce aceitou, aguardando retirada
- Concluido (verde) = evento realizado, repasse gerado

E so isso. Qualquer duvida, me chama.
```

---

### Escalacao de problemas

O Jota esta em Zanzibar durante o lancamento. Comunicacao principal: WhatsApp.
Diferenca de horario: Zanzibar esta 4 horas a frente de SP.
Tempo de resposta esperado: ate 4 horas em horario comercial.

| Situacao | O que fazer |
|---|---|
| Nao recebi aprovacao em 24h | WhatsApp para o rep — ele aciona o Jota |
| Nao consigo aceitar pedido no painel | Print da tela por WhatsApp para o rep |
| Erro ao cadastrar produto | Descricao do erro por WhatsApp — Jota resolve remotamente |
| Nao recebi repasse esperado | WhatsApp para o rep com data do evento concluido |
| Quero alterar minha chave PIX | WhatsApp para o rep — nao ha autocadastro no painel ainda |
| Problema no dia do evento | Rep tem numero direto do Jota com prioridade total |

Contato do rep: `[NUMERO DO REP]`
Email de backup (se nao conseguir o rep): techchurras@gmail.com — assunto "URGENTE — [nome do acougue]"

---

## OPERACAO CONTINUA

### Repasse: quanto e quando o acougue recebe

- A plataforma retem *10%* do valor dos cortes de cada pedido concluido.
- O acougue recebe *90%* dos cortes via PIX na chave cadastrada.
- Repasses sao processados pelo Jota toda semana (toda segunda-feira).
- Pedidos concluidos ate o domingo entram no repasse da segunda seguinte.

O repasse nao e automatico hoje — e processado manualmente. Se atrasar, o rep avisa proativamente.

### Mensalidade (apos o periodo gratuito)

- Parceiros fundadores: *3 meses gratis* a partir da data de cadastro.
- Apos esse periodo: *R$ 369,00 por mes* (parceiro fundador) ou *R$ 497,00* (padrao).
- O aviso de vencimento aparece no proprio painel com antecedencia de 7 dias.
- A mensalidade e cobrada diretamente pelo Jota — ainda nao e debitada automaticamente.

Nota interna: o codigo esta configurado para 60 dias (Bug 1). Corrigir antes do lancamento.

---

### Como o acougue ve os dados de venda

**Painel:** `techchurras.com.br/boutiques/dashboard` → aba "Visao Geral"

Tres numeros no topo:
- Faturamento bruto dos ultimos 30 dias (total que os clientes pagaram pelos seus cortes)
- Pedidos concluidos nos ultimos 30 dias
- Pedidos pendentes (que precisam de acao agora)

Grafico de faturamento: linha diaria dos ultimos 30 dias.

**Previsao de demanda — proximos 14 dias:**
- Mostra as categorias de carne necessarias e as quantidades totais.
- Atualizado automaticamente conforme chegam pedidos confirmados e pagos.
- Ferramenta pratica para programar compra no frigorifico com antecedencia.
- Pedidos marcados como "urgentes" (evento em 2 dias ou menos) aparecem em laranja.

**Aba "Indicacoes":**
- Quantidade de clientes novos que vieram pelo seu QR code pessoal.
- Bonus de R$ 40 por cliente indicado que fizer o primeiro pedido.
- Bonus pago junto ao repasse semanal — sem burocracia.

**Pedidos recentes:**
- Lista com nome do cliente, nome do churrasqueiro, data do evento, itens pedidos e valor.

---

### Mensagem 8 — Como ver seus dados (enviar na Semana 2)

```
[NOME], so para voce saber onde ver seus numeros.

Acesse: techchurras.com.br/boutiques/dashboard
Aba: "Visao Geral"

Voce ve:
- Quanto faturou nos ultimos 30 dias
- Quantos pedidos teve
- Previsao do que vai precisar separar
  nos proximos 14 dias (muito util para
  programar a compra no frigorifico)

Tambem tem a aba "Indicacoes": cada cliente
que escanear seu QR e fizer o primeiro pedido
vale R$ 40 para voce, pagos no repasse semanal.
Sem limite de indicacoes.

Qualquer duvida, me chama.
```

---

## CADENCIA DE ACOMPANHAMENTO DO REP

| Quando | Acao | Canal |
|---|---|---|
| Dia 0 — apos assinatura | Mensagem 1 (boas-vindas) + link de cadastro | WhatsApp |
| Dia 0 — antes de chegar em casa | Mensagem 2 (PIX) para o Jota | WhatsApp |
| Dia 1 — manha | Mensagem 3 (guia de conta) se nao criou | WhatsApp |
| Dia 1 — apos criacao | Mensagem 4 (confirmacao de aprovacao) | WhatsApp |
| Dia 2 | Mensagem 5 (guia de produtos) | WhatsApp |
| Dia 2 | Mensagem 6 (guia de kits) | WhatsApp |
| Dia 3 | Checklist de verificacao (7 itens) | WhatsApp |
| Dia 3 | Mensagem 7 (guia de atendimento de pedido) | WhatsApp |
| Dia 7 | Verificar se recebeu notificacoes (Jota faz pedido teste) | WhatsApp |
| Dia 14 | Mensagem 8 (como ver os dados) | WhatsApp |
| Dia 30 | Check-in: quantos pedidos? algum problema? | WhatsApp ou presencial |
| Dia 55 | Aviso do fim do periodo gratuito + orientar sobre mensalidade | WhatsApp ou presencial |

---

## PONTOS DE FALHA UNICO — MITIGACAO ATIVA

O onboarding depende do Jota para tres acoes que so ele pode executar:

| Acao | Dependencia | Contingencia |
|---|---|---|
| Aprovar o acougue no admin | Jota — painel `/admin` | Rep avisa Jota via WhatsApp assim que o cadastro for concluido. Jota processa uma vez por dia (18h SP / 22h Zanzibar). Se nao houver resposta em 24h: e-mail para techchurras@gmail.com com assunto "APROVACAO URGENTE — [nome do acougue]". |
| Inserir a chave PIX no cadastro | Jota — campo `pixKey` no admin | Rep coleta PIX no Dia 0 e envia ao Jota por WhatsApp antes de chegar em casa. Sem isso, o primeiro repasse nao sai. |
| Processar o repasse semanal | Jota — tela `/admin/repasses` | Repasse processado toda segunda-feira. Se houver atraso, o rep avisa o parceiro proativamente — nunca deixar o acougue descobrir o atraso por conta propria. |

---

*Documento interno — nao compartilhar com parceiros | Tech Churras v2.0*
