# Cognitive Walkthrough: Tech Churras Customer Wizard
**Persona:** Maria, 34 anos, SP, aniversário do marido, chegou pelo Instagram, nunca usou o app, celular Android médio, moderately tech-savvy
**Método:** Leitura direta do código-fonte, simulação do modelo mental em cada etapa
**Data:** 2026-06-29
**Analista:** UX Researcher

---

## Contexto Técnico: Dois Wizards Existem em Paralelo

Antes de começar o walkthrough, o código revela um fato crítico: existem **dois wizards completamente diferentes**, com arquiteturas opostas.

| Atributo | `/pedido?boutiqueId=xxx` | `/menu/novo` (via `/orders/new`) |
|---|---|---|
| Autenticação | Não exige (guest checkout) | Exige login (rota protegida pelo dashboard layout) |
| Entrada | Somente via link com `boutiqueId` na URL | Via perfil do GM → "Contratar para meu evento" |
| Passos | Evento → Cortes → GM → Confirmar+conta | Data → Convidados → GM → Açougue/Kits |
| Campo de horário | Sim (`type="time"`, padrão 12:00) | Não (só a data) |
| Criação de conta | Coleta nome+WhatsApp no Passo 4, cria conta guest | Exige conta antes de entrar no wizard |
| Incremento de produtos | 0.5 kg | 1 unidade (sem decimais) |

Maria vindo do Instagram vai bater na versão autenticada (`/menu/novo`). O wizard guest (`/pedido`) é inalcançável pelo fluxo principal — só chega nele via QR code do açougue ou deep link de marketing.

**O walkthrough abaixo segue a jornada real de Maria: Instagram → homepage → `/grillmasters` → perfil do GM → auth wall → `/menu/novo`.**

---

## Jornada da Maria: Passo a Passo

### Pré-Wizard — Do Instagram ao Formulário

Maria vê um post ou ad no Instagram da Tech Churras. Clica. Cai na homepage (`techchurras.com.br`).

**O que ela vê:**
- Hero: "O melhor churrasco da sua vida começa aqui."
- CTAs: "Contratar Grillmaster" (laranja) e "Ver açougues parceiros" (cinza)
- Stats: 4.9★, 100% açougues validados, R$ 0 taxa pro cliente
- `PriceCalculator`, depoimentos (se existirem), cards de GMs com foto hero
- Seção "Como funciona" em 3 passos com ícones

**Modelo mental de Maria:** "Ok, é um app de churrasqueiro profissional. Deixa eu ver quem tem disponível."

Ela clica em "Contratar Grillmaster" → vai para `/grillmasters`.

**Na listagem de GMs:**
- Cards com: foto ou ícone 🔥 (se sem foto), nome, rating em estrelas, cidade, badge "Disponível", texto "Grillmaster certificado"
- **Confusão:** Não há preço visível nesta listagem — apenas "Grillmaster certificado". Maria não sabe quanto vai custar antes de clicar em cada perfil.

Ela clica em um GM com boa avaliação e foto real.

**No perfil do GM (`/grillmasters/[id]`):**
- Foto hero em 64×80 com overlay de gradiente — visualmente forte
- Nome, rating, cidade, badge de disponibilidade
- Bio (gerada por IA ou manual), especialidades, galeria de fotos, avaliações
- Preço visível: "R$ 180 / hora" no overlay inferior
- No rodapé: botão "Contratar para meu evento" (laranja) e "Compartilhar" (verde/WhatsApp)

**Ela clica "Contratar para meu evento". Acontece o bloqueio.**

O botão executa `router.push('/menu/novo?grillmasterId=' + gm.id)`. O dashboard layout detecta que `/menu` está em `PROTECTED_PREFIXES` e não há token em `localStorage` → redireciona para `/login`.

**Maria pensa:** "Por que preciso criar conta pra ver o preço? Eu nem sei quanto vai custar ainda."

**Na tela de login (`/login`):**
- Vídeo de fogo no lado esquerdo (desktop only)
- Trust badges: "+1.800 eventos", "churrasqueiros certificados", "carne entregue pelo churrasqueiro"
- Formulário email + senha
- Link "Primeira vez? Crie sua conta grátis"
- Sem preservação da URL de destino (`?next=` não existe no código)

Ela nunca usou → clica em "Criar conta"

**Na tela de registro (`/register`):**
- Seletor de perfil: "Quero fazer um churrasco", "Sou churrasqueiro", "Tenho açougue"
- Ela escolhe "Quero fazer um churrasco"
- Formulário: nome, email, celular (opcional), senha, checkbox de termos
- Cria conta → **redirecionada para `/dashboard`** (linha 85 de `register/page.tsx`: `router.push('/dashboard')`)

**O parâmetro `?grillmasterId=xxx` que preservava a intenção de Maria desapareceu completamente.** O login e o registro sempre redirecionam para `/dashboard`, sem ler nenhum `?next=`. Maria está no dashboard olhando para métricas zeradas, sem saber como começar o pedido.

---

### Passo 0 — "Quando é o churrasco?"

**Código:** `/orders/new/page.tsx`, `step === 0`

**O que Maria vê:**
- Progress bar no topo: 4 linhas horizontais finas. A primeira está preenchida de laranja. Texto: "Passo 1 de 4 — Quando e onde"
- Título: "Quando é o churrasco?"
- Subtítulo: "Data, local e duração do evento"
- Campo "Data do evento *" com `min={today}` (bloqueia datas passadas — correto)
- Campo "Endereço do evento *" usando o componente `CepAddressInput`
- Slider "Duração do serviço" de 2h a 12h, padrão 4h, marcadores em 2h / 6h / 12h

**Experiência do componente `CepAddressInput`:**
O campo começa pedindo CEP (8 dígitos, `inputMode="numeric"`). Ao completar 8 dígitos, dispara automaticamente a API ViaCEP. Se encontrar: aparece o campo "Nº" com `autoFocus` (o teclado pula para esse campo automaticamente — comportamento súbito no celular), mostra preview do endereço em card cinza. Se não encontrar: exibe "CEP não encontrado." em vermelho. Link pequeno "Não sei o CEP — digitar endereço completo" exibe um campo de texto livre como fallback.

**Confusões e perguntas de Maria:**
1. "CEP? Qual é o CEP da minha casa mesmo?" — A maioria das pessoas sabe o endereço, não o CEP. O fallback existe mas é `text-xs text-gray-500` — quase invisível no celular com fundo escuro.
2. "Que horas vai começar?" — Não há campo de horário. O wizard registra apenas a data. A versão `/pedido` tem campo de horário (padrão 12:00). Nesta versão, a hora nunca é capturada.
3. "4 horas é quanto tempo? Suficiente para 15 pessoas?" — Nenhuma dica de contexto junto ao slider.
4. O `autoFocus` no campo "Nº" que aparece automaticamente após o CEP ser encontrado pode causar scroll inesperado no celular — o teclado vai abrir sem que Maria tenha tocado naquele campo.

---

### Passo 1 — "Quantas pessoas?"

**Código:** `/orders/new/page.tsx`, `step === 1`

**O que Maria vê:**
- Título: "Quantas pessoas?"
- Subtítulo: "A IA calcula os insumos ideais para o seu churrasco"
- Três contadores em grid 3 colunas: **Homens** (padrão 5), **Mulheres** (padrão 3), **Crianças** (padrão 2)
- Botões – e + grandes e redondos
- Caixa laranja/10 com "Estimativa calculada pela IA": total de pessoas, kg de proteína, sacos de carvão

**Confusões e perguntas de Maria:**
1. "Por que separar homens e mulheres?" — A lógica (350g/homem, 300g/mulher, 200g/criança) não é explicada em lugar algum. Para Maria parece arbitrário ou invasivo.
2. Os contadores já chegam preenchidos com valores não-zero (5+3+2=10 pessoas). Maria pode interpretar que são dados de outro usuário ou exemplos fixos — não fica claro que são defaults editáveis.
3. "Sacos de carvão — quem compra? Eu ou o churrasqueiro?" — A estimativa cita carvão mas não resolve a responsabilidade logística.
4. "2 sacos para 10 pessoas — isso é muito ou pouco?"

**O delight:** A caixa de estimativa da IA é a melhor funcionalidade do wizard. Ver "10 pessoas → 3.4 kg de proteína · 2 sacos de carvão" em tempo real cria um momento genuíno de "esse app está pensando por mim". Maria provavelmente sorri aqui.

---

### Passo 2 — "Escolha o churrasqueiro"

**Código:** `/orders/new/page.tsx`, `step === 2`

**O que Maria vê:**
- Título: "Escolha o churrasqueiro"
- Subtítulo com contexto: "[dia da semana, dia, mês] · X pessoas · Xh"
- Seção "Recomendados para você" (badge `✨`) com cards numerados
  - Avatar com inicial em laranja/20, badge numérico sobreposto
  - Nome, rating com ★, número de avaliações, distância em km
  - Texto de razão em itálico laranja: *"Disponível nesta data, próximo a você..."*
  - Linha: "R$ 180/hora" + "R$ 720.00 total"
  - Linha extra: "40% do valor das carnes" (se `itemsTotal > 0`)
- Seção "Todos os churrasqueiros" abaixo (os não-recomendados)

**Nota sobre a pré-seleção do GM:** Se Maria tivesse chegado com `?grillmasterId=XXX` na URL (ou seja, sem perder o contexto no login), o wizard teria pulado para este step com o GM pré-selecionado. Como ela perdeu o contexto, precisa procurar o churrasqueiro que viu antes manualmente — mas os avatares aqui são apenas iniciais de texto, não fotos. No perfil do GM ela viu uma foto real. Agora vê "RC" em laranja/20. A reconexão visual é difícil.

**Confusões e perguntas de Maria:**
1. "X% do valor das carnes" — neste momento Maria ainda não sabe o valor das carnes (isso só aparece no Passo 3). A métrica não tem contexto.
2. A diferença visual entre "Recomendados" (borda laranja/30, fundo laranja/5) e "Todos" (borda gray-800, fundo gray-900) é sutil no dark mode em Android. Maria pode não perceber a hierarquia.
3. "Esse churrasqueiro está disponível no meu sábado específico?" — Os recomendados mostram disponibilidade no `reason`. Os não-recomendados não têm indicação explícita de disponibilidade para a data selecionada.
4. "O que é 'Chancelado'?" — O badge aparece nos cards sem nenhuma tooltip ou explicação.

---

### Passo 3 — "Açougue & Kits"

**Código:** `/orders/new/page.tsx`, `step === 3`

Este é o passo mais longo. Contém em sequência: seletor de açougue → kits → produtos avulsos → acompanhamentos → observações → resumo do pedido.

**O que Maria vê ao entrar:**
- Título: "Açougue & kits"
- Subtítulo: "O churrasqueiro busca tudo no açougue no dia do evento" (excelente copy — resolve a dúvida logística)
- Opção **"Sem açougue parceiro"** selecionada por padrão (borda laranja, fundo laranja/10)
- Açougues disponíveis listados abaixo em cinza

**Confusão crítica — o default é "Sem açougue":**
O estado inicial é `boutiqueId: ''`. A opção "Sem açougue parceiro" está na primeira posição e com estilo de selecionado (borda laranja). Maria precisa **desmarcar ativamente** para usar um açougue — exatamente o contrário do que beneficia ela (receber kits prontos, estimativa automática) e o negócio (comissão de 10%).

**Se ela não selecionar açougue**, o resumo só mostra o custo do GM — e ela vai para o pagamento sem entender o que o churrasqueiro vai grelhar.

**Se ela selecionar um açougue**, acontece o seguinte:
- Os kits aparecem com badge "Ideal" no kit mais adequado para o tamanho do grupo (`bestKit` calculado por `minGuests`/`maxGuests`)
- O kit ideal é auto-selecionado — bom UX
- Cada kit mostra: nome, descrição, lista de produtos com quantidades, faixa de convidados, preço (com desconto riscado se houver)
- Seção "Produtos avulsos" abaixo com +/- por item
- Seção "Acompanhamentos" (produtos do açougue + serviços extras do GM)
- Campo "Observações" (opcional, textarea)
- Resumo do pedido com total

**Outras confusões:**
1. "Produto avulso — acrescentei 2 de picanha — são 2 kg ou 2 peças?" O incremento é 1 inteiro e a unidade (`p.unit`) aparece no preço ("R$89.00/kg") mas não junto ao controle de quantidade.
2. "Acomp. mão de obra" no resumo final — jargão opaco para quem não trabalha no setor.
3. A página é muito longa no mobile: açougue + kits + produtos + extras + notas + resumo. Sem âncoras ou divisores visuais fortes, parece uma única parede de conteúdo.
4. "Depois que eu clico 'Ir para pagamento' o preço pode mudar?" — Não há aviso de que o total é estimado. O wizard `/pedido` tem a frase "O preço final é confirmado pelo churrasqueiro antes do pagamento." Este wizard não tem.

Ela clica "Ir para pagamento →" → pedido criado via `POST /orders` → redirect para `/orders/[id]/payment`.

---

### Pagamento — `/orders/[id]/payment`

**O que Maria vê:**
- Card cinza: nome do GM, açougue, data do evento, total em laranja grande
- Texto: "Você será redirecionado para o Mercado Pago para concluir o pagamento com segurança."
- Chips de métodos: Cartão de Crédito, Cartão de Débito, Pix, Boleto
- **Política de cancelamento** — apresentada ANTES do botão de pagamento
  - Até 48h: reembolso integral (verde)
  - 24-48h: multa 30% (amarelo)
  - Menos de 24h: multa 50% (vermelho)
- Botão azul grande "Pagar com Mercado Pago"
- Linha pequena cinza embaixo do botão: "Não precisa ter conta no Mercado Pago — clique em 'Continuar sem criar conta'"
- "Ambiente seguro · Dados criptografados"

**Confusões e perguntas de Maria:**
1. "Multa de 50% se cancelar em menos de 24h — isso é severo?" A política está correta em ser transparente, mas a posição (logo antes do CTA de pagamento, no momento de maior ansiedade) pode causar hesitação desnecessária.
2. A linha "Não precisa ter conta no Mercado Pago" é um alívio enorme para quem não tem conta no MP. Mas está em `text-xs text-gray-500` abaixo do botão — invisível para quem está com pressa. Maria pode abrir o Mercado Pago, ver a tela de login e sair.
3. "O valor que aparece aqui é o mesmo que no wizard?" — Se o `totalPrice` da API diferir do `totalEstimate` do wizard, Maria vai estranhar.

---

## Top 5 Friction Points por Severidade

### 1. BLOCKER — Auth wall com perda de contexto de intenção

**O que acontece:** Maria clica "Contratar para meu evento" no perfil de um GM → redirecionada para `/login` → cria conta → vai para `/dashboard`. O `?grillmasterId=xxx` desaparece. Ela não sabe como chegar ao wizard nem qual GM tinha escolhido.

**Código responsável:**
- `(dashboard)/layout.tsx` L73: `router.push('/login')` sem `?next=`
- `(auth)/login/page.tsx` L36: `router.push('/dashboard')` hardcoded
- `(auth)/register/page.tsx` L85: `router.push('/dashboard')` hardcoded

**Por que é blocker:** Usuária fria do Instagram, sem conta, bate em registro antes de ver qualquer preço ou fluxo de valor. Ao criar conta é enviada para uma tela com métricas zeradas sem orientação para o próximo passo. Probabilidade de abandono = alta.

---

### 2. HIGH — Ausência de campo de horário no wizard autenticado

**O que acontece:** O wizard `/menu/novo` não captura horário do evento. O submit envia `eventDate: form.eventDate` (string de data sem hora, ex: "2026-07-18"). O GM recebe o pedido sem saber se o evento é às 10h, 14h ou 19h.

**Código responsável:**
- `/orders/new/page.tsx` Step 0: sem `eventTime` em nenhum estado
- Submit L197: `eventDate: form.eventDate`

**Impacto:** Gera troca de mensagens extra entre GM e cliente para confirmar horário, atrasa a confirmação do pedido, aumenta risco de conflito de agenda. A versão `/pedido` resolve isso com um `<input type="time">` simples.

---

### 3. HIGH — "Sem açougue parceiro" como default sabota a proposta de valor

**O que acontece:** O Passo 3 começa com `boutiqueId: ''` no estado. "Sem açougue parceiro" é a primeira opção e visualmente parece selecionada (borda laranja). O usuário precisa clicar em outro açougue para ativar os kits — ação não-intuitiva.

**Código responsável:**
- `/orders/new/page.tsx` L75: `boutiqueId: ''` no estado inicial do form
- L489: botão "Sem açougue parceiro" tem `border-orange-500 bg-orange-500/10` quando `!form.boutiqueId`

**Impacto:** Parcela significativa dos usuários vai finalizar o pedido sem açougue, perdendo: estimativa automática de carnes, kit curado, logística integrada. Reduz o ticket médio e a satisfação com o resultado do evento.

---

### 4. HIGH — Divisão Homens/Mulheres/Crianças sem explicação, com defaults pré-preenchidos

**O que acontece:** Step 1 inicia com Homens: 5, Mulheres: 3, Crianças: 2. A razão da divisão por gênero (350g/300g/200g) não é explicada em nenhum lugar. Parece arbitrário, possivelmente invasivo, e os valores pré-preenchidos parecem dados de outro usuário.

**Código responsável:**
- `/orders/new/page.tsx` L73: `homens: 5, mulheres: 3, criancas: 2` no `useState` inicial

**Impacto:** Usuários ajustam errado ou deixam os defaults, resultando em estimativas incorretas de carne. Usuários mais sensíveis podem abandonar achando que a divisão por gênero é desnecessária.

---

### 5. MEDIUM — Nota "Não precisa ter conta no Mercado Pago" enterrada sob o botão de pagamento

**O que acontece:** Na tela de pagamento, a linha "Não precisa ter conta no Mercado Pago — clique em 'Continuar sem criar conta'" está em `text-xs text-gray-500` abaixo do botão azul. A maioria dos usuários não lê esse texto. Ao ser redirecionada para o Mercado Pago e ver uma tela de login, pode interpretar como bloqueio e abandonar.

**Código responsável:**
- `/orders/[id]/payment/page.tsx` L168: `<p className="text-center text-xs text-gray-500 mt-1">`

**Impacto:** Drop-off no momento mais crítico do funil — logo antes da conversão. É o tipo de perda que não aparece como erro, só como pedido abandonado.

---

## Quick Wins — Mudanças de Menos de 1 Hora com Alto Impacto

### QW-1: Preservar destino após login/registro (30 min)

**Arquivo:** `(dashboard)/layout.tsx` + `(auth)/login/page.tsx` + `(auth)/register/page.tsx`

Em `layout.tsx` L73, passar `?next=` com a URL atual:
```typescript
if (!token && isProtected) {
  const next = encodeURIComponent(pathname + (window.location.search || ''))
  router.push('/login?next=' + next)
}
```

Em `login/page.tsx` e `register/page.tsx`, após autenticar:
```typescript
const searchParams = useSearchParams()
const next = searchParams.get('next') || '/dashboard'
router.push(next)
```

Isso restaura o `?grillmasterId=xxx` e o `useEffect` do wizard já faz `setStep(2)` com o GM pré-selecionado.

### QW-2: Adicionar campo de horário ao wizard autenticado (20 min)

**Arquivo:** `/orders/new/page.tsx`

Adicionar ao estado e ao Step 0:
```typescript
const [eventTime, setEventTime] = useState('12:00')

// No JSX do Step 0, ao lado do campo de data:
<input
  type="time"
  value={eventTime}
  onChange={e => setEventTime(e.target.value)}
  className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white outline-none"
/>

// No submit:
eventDate: new Date(`${form.eventDate}T${eventTime}:00`).toISOString()
```

### QW-3: Inverter o default do açougue no Passo 3 (15 min)

**Arquivo:** `/orders/new/page.tsx`

No `useEffect` que carrega boutiques, pré-selecionar o primeiro:
```typescript
.then(d => {
  const list = Array.isArray(d) ? d : d.boutiques ?? []
  setBoutiques(list)
  if (list.length > 0 && !form.boutiqueId) {
    setForm(prev => ({ ...prev, boutiqueId: list[0].id }))
  }
})
```

E mover o botão "Sem açougue parceiro" para o final da lista, com estilo discreto (sem borda laranja quando não selecionado intencionalmente).

### QW-4: Dar destaque à nota do Mercado Pago na tela de pagamento (10 min)

**Arquivo:** `/orders/[id]/payment/page.tsx`

Mudar a classe da nota de `text-xs text-gray-500` para algo mais visível, e usar o destaque antes do botão:
```tsx
<p className="text-center text-sm text-gray-300 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4">
  Nao precisa ter conta no Mercado Pago —{' '}
  <span className="text-orange-400 font-medium">clique em "Continuar sem criar conta"</span> na proxima tela.
</p>
```

### QW-5: Adicionar hint explicativo nos contadores de convidados (10 min)

**Arquivo:** `/orders/new/page.tsx`

Abaixo dos três contadores, antes da caixa de estimativa da IA:
```tsx
<p className="text-xs text-gray-600 text-center -mt-2">
  Estimamos 350g por homem · 300g por mulher · 200g por crianca
</p>
```

Isso valida o cálculo de IA e elimina a percepção de arbitrariedade da divisão.

---

## O Encantamento Surpreendente — Manter e Ampliar

**A seção "Recomendados para você" no Passo 2 com o campo `reason` é a maior surpresa positiva do wizard.**

Quando Maria chega na escolha do churrasqueiro, ao invés de uma lista genérica ordenada por algum critério opaco, ela vê:
- Cards numerados (1, 2, 3) com badge laranja no avatar
- Texto em itálico laranja: *"Disponível nesta data, próximo a você, com experiência em eventos de 10 pessoas"*
- O custo total calculado na hora (R$ X total para Xh)

Este é o momento em que o app demonstra inteligência real: combina disponibilidade de data, distância geográfica e experiência com o tamanho do grupo, e devolve uma narrativa em linguagem natural — não um número de score. Para Maria, que nunca contratou um churrasqueiro, isso é exatamente o tipo de guia que ela precisaria de um amigo experiente.

**Para potencializar:** O `reason` atualmente está em `text-xs text-orange-300/80 italic` — quase invisível no fundo escuro. Aumentar para `text-sm text-orange-300 italic` e adicionar um ícone ✨ antes do texto tornaria este diferencial muito mais perceptível.

---

## Resumo Executivo

| # | Friction Point | Severidade | Arquivo | Referência |
|---|---|---|---|---|
| 1 | Auth wall sem preservação de destino | BLOCKER | `layout.tsx`, `login/page.tsx`, `register/page.tsx` | L73, L36, L85 |
| 2 | Sem campo de horário no wizard autenticado | HIGH | `/orders/new/page.tsx` | Step 0 |
| 3 | "Sem açougue" como default no Passo 3 | HIGH | `/orders/new/page.tsx` | L75, L489 |
| 4 | Divisão gênero sem contexto, defaults não-zero | HIGH | `/orders/new/page.tsx` | L73 (estado inicial) |
| 5 | Nota MP enterrada em texto xs cinza | MEDIUM | `/orders/[id]/payment/page.tsx` | L168 |
| — | AI `reason` nos GMs recomendados | DELIGHT — GUARDAR | `/orders/new/page.tsx` | Step 2 |

**Prioridade de execução:**
1. QW-1 (auth redirect) — impacto máximo, sem risco
2. QW-3 (default açougue) — altera comportamento de produto, verificar com Jota se é intenção a opção "sem açougue"
3. QW-2 (horário) — completude de dados, requer ajuste no backend também para aceitar a hora no campo `eventDate`
4. QW-4 (nota MP) — reduz drop-off no momento mais caro do funil
5. QW-5 (hint contadores) — pequena, mas melhora percepção de inteligência do sistema

**Decisão estratégica pendente:** Avaliar se o wizard autenticado deve suportar guest checkout — permitindo que usuários cheguem ao checkout antes de criar conta, como o `/pedido` faz. Isso eliminaria o blocker #1 pela raiz. O código do `/pedido` já demonstra que a plataforma sabe fazer isso: coleta nome+WhatsApp no Step 4 e cria a conta automaticamente. Portar essa lógica para o fluxo principal seria o maior ganho de conversão disponível no lançamento.

---

*Baseado em leitura direta dos arquivos:*
- `frontend/src/app/pedido/page.tsx`
- `frontend/src/app/(dashboard)/orders/new/page.tsx`
- `frontend/src/app/(dashboard)/orders/[id]/payment/page.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/(dashboard)/grillmasters/[id]/GrillmasterProfile.tsx`
- `frontend/src/components/CepAddressInput.tsx`
- `frontend/src/app/page.tsx`
