# Roteiro de Teste com Usuários — Tech Churras

**Versão:** 2.0 · **Data:** Junho 2026  
**Para:** Testadores externos (não técnicos)  
**Plataforma:** https://www.techchurras.com.br

---

## Antes de começar

Você vai testar o Tech Churras — um app que conecta churrasqueiros profissionais, açougues e clientes que querem organizar churrascos.

**O que você precisa:**
- Um smartphone ou computador com internet
- Cerca de 30–40 minutos por papel testado
- Acesso ao e-mail que usou para criar a conta (para confirmar o cadastro, se necessário)

**Conta de pagamento de teste (Mercado Pago Sandbox):**
- Cartão de crédito teste: `5031 4332 1540 6351` · Validade: `11/25` · CVV: `123`
- Ou selecione **PIX** e simule o pagamento na tela que aparecer

**Atenção:** Esta é uma versão de testes. Nenhum pagamento real será cobrado. Nenhum pedido real será enviado.

---

## PAPEL 1 — Cliente (CUSTOMER)

> Você é uma pessoa que quer contratar um churrasqueiro e/ou comprar carnes para um evento.

### Passo 1 — Criar conta

1. Acesse https://www.techchurras.com.br
2. Clique em **"Criar conta"**
3. Preencha nome, e-mail e senha (mínimo 6 caracteres)
4. Clique em **"Criar conta"**
5. Você deve ser redirecionado para o **Dashboard**

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 2 — Explorar churrasqueiros

1. No menu superior, clique em **"Churrasqueiros"**
2. Explore a lista — veja fotos, avaliações e preços
3. Use os filtros (cidade, preço mínimo/máximo, avaliação)
4. Clique em um churrasqueiro para ver o perfil completo

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 3 — Tech Churras IA: planejar o evento

1. Clique em **"Menu"** no menu superior
2. Clique em **"Tech Churras IA"** (card com ícone 🤖)
3. Escolha o **Menu Tech Churras** e configure:
   - 6 homens, 4 mulheres, 2 crianças
   - 4 horas
4. Clique em **"Planejar com Tech Churras IA"**
5. Verifique a lista de compras gerada, as dicas do Grillmaster
6. Role a página até a seção **"Como é Feito"** — confirme que aparecem 2-3 descrições de pratos
7. Volte ao início e repita com a **Parrillada Tech Churras**
8. Repita com a **Especialidade Jota Grillmaster**
9. Confirme que cada menu traz itens e descrições diferentes e condizentes com o estilo

- [ ] Os 3 menus geram resultados distintos
- [ ] A seção "Como é Feito" aparece com descrições educativas
- [ ] A linguagem é informativa, sem prometer execução específica
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 4 — Calculadora de carne

1. Na página do Tech Churras IA, veja a sugestão de quantidade de carne gerada
2. Tente adicionar os itens essenciais ao carrinho (botão 🛒)
3. Verifique se o valor estimado total aparece no card de resumo

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 5 — Fazer um pedido

1. Clique em **"Novo Pedido"** (ou no botão do dashboard)
2. Escolha a data e horário do evento
3. Informe o endereço do evento
4. Informe o número de convidados
5. Selecione um churrasqueiro disponível
6. Adicione itens de carne (de um açougue parceiro), se disponível
7. Aplique o cupom **`BEMVINDO10`** (10% de desconto)
8. Revise o resumo do pedido
9. Clique em **"Confirmar pedido"**
10. Selecione o pagamento (Pix ou cartão de teste)
11. Conclua o pagamento

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 6 — Acompanhar o pedido

1. Após o pedido, vá em **"Pedidos"** no menu
2. Clique no pedido que você acabou de criar
3. Veja a linha do tempo de status
4. Veja o mapa com a localização do churrasqueiro (quando disponível)
5. Use o **chat** para enviar uma mensagem ao churrasqueiro

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 7 — Avaliar o pedido

1. Quando o pedido estiver com status **"Concluído"**, vá até o pedido
2. Clique em **"Avaliar"**
3. Dê uma nota de 1 a 5 estrelas
4. Escreva um comentário
5. Adicione uma foto (opcional)
6. Envie a avaliação

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

---

## PAPEL 2 — Churrasqueiro (GRILLMASTER)

> Você é um churrasqueiro profissional que quer oferecer seus serviços pela plataforma.

### Passo 1 — Criar conta como churrasqueiro

1. Acesse https://www.techchurras.com.br/register?role=grillmaster
2. Preencha nome, e-mail e senha
3. Clique em **"Criar conta"**
4. Você deve ver um aviso de **"Cadastro de Churrasqueiro Parceiro"**

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 2 — Configurar perfil

1. No dashboard, clique em **"Churrasqueiros"** → **"Meu perfil"** (ou similar)
2. Preencha:
   - Especialidades (ex: churrasco gaúcho, espetinhos)
   - Preço por hora
   - Foto de perfil
   - Cidade de atuação
3. Salve o perfil

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 3 — Receber e confirmar pedido

> (Peça a alguém jogando o papel de Cliente para fazer um pedido para você)

1. Aguarde a notificação de novo pedido
2. Acesse **"Pedidos"**
3. Clique no pedido recebido
4. Clique em **"Confirmar"**

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 4 — Avançar status do pedido

1. No pedido confirmado, avance o status:
   - Confirmar → **"A caminho"** (ativa o rastreamento de localização)
   - A caminho → **"Em andamento"**
   - Em andamento → **"Concluído"**
2. Verifique se o cliente consegue ver a mudança de status

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 5 — Avaliar o cliente

1. Após marcar como concluído, veja se aparece opção de avaliar o cliente
2. Dê uma nota e escreva um comentário

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

---

## PAPEL 3 — Açougue (BOUTIQUE)

> Você é dono de um açougue e quer vender carnes pelos pedidos da plataforma.

### Passo 1 — Criar conta como açougue

1. Acesse https://www.techchurras.com.br/register?role=boutique
2. Preencha nome, e-mail e senha
3. Clique em **"Criar conta"**
4. Você deve ver um aviso de **"Cadastro de Açougue Parceiro"**

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 2 — Cadastrar o açougue

1. Acesse **"Açougues"** → **"Cadastrar açougue"** (ou similar)
2. Preencha nome, cidade, estado e descrição
3. Salve

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 3 — Adicionar produtos

1. No dashboard do açougue, veja a seção **"Produtos"**
2. Clique em **"+ Adicionar produto"** e cadastre manualmente:
   - Nome: Picanha · Preço: R$ 89,90/kg · Categoria: Carne
3. Clique em **"📸 Adicionar por foto"** e tire uma foto de um produto
   - A IA vai sugerir nome, categoria e descrição automaticamente
   - Revise os dados e preencha o preço
   - Salve

- [ ] Adicionar manualmente funcionou
- [ ] Adicionar por foto funcionou
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 4 — Dashboard e pedidos

1. Acesse o **Dashboard do açougue** (`/boutiques/dashboard`)
2. Verifique as estatísticas (faturamento, pedidos)
3. Veja a **previsão de demanda** para os próximos 14 dias
4. Quando um pedido chegar, veja os itens solicitados

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 5 — QR Code de indicação

1. No dashboard, localize o **QR Code de indicação**
2. Copie o link de indicação
3. Abra o link em outro dispositivo (ou aba anônima)
4. Crie uma nova conta de cliente pelo link
5. Verifique se o contador de indicações aumentou
6. Faça um pedido com essa conta e confirme se o desconto de 15% é aplicado

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

### Passo 6 — Placa de QR code para impressão

1. No dashboard do açougue, localize o botão **"Imprimir Placa"** (ou acesse `/boutiques/dashboard/qrcode-impressao`)
2. Verifique se a placa mostra o QR code do seu açougue corretamente
3. Clique em **"Imprimir"** e confirme que a página de impressão aparece limpa (sem menus do app)

- [ ] Funcionou como esperado
- [ ] Funcionou com problema: _______________
- [ ] Não funcionou: _______________
- **Observações:** _______________

---

## Feedback Geral

Ao final dos testes, responda:

1. **O que foi mais fácil de usar?** _______________
2. **O que foi mais difícil ou confuso?** _______________
3. **Alguma função que você esperava encontrar mas não encontrou?** _______________
4. **Como você avaliaria o app de 1 a 10?** _______________
5. **Você indicaria para amigos? Por quê?** _______________

---

## Como enviar seu feedback

Envie este documento preenchido para: **techchurras@gmail.com**  
Ou fale diretamente no WhatsApp: **(11) 97059-3650**

Obrigado por ajudar a melhorar o Tech Churras!
