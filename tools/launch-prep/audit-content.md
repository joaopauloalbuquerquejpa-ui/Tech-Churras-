# Auditoria de Conteúdo — Tech Churras
**Data:** 2026-06-30 | **Escopo:** Homepage, dashboard, convites, pitch, para-acougues, para-churrasqueiros, churras-club

---

## Legenda de Severidade
- **CRITICAL** — bloqueia lançamento: dado financeiro errado ou trust killer visível
- **HIGH** — corrigir antes do lançamento: inconsistência de pricing ou gênero
- **MEDIUM** — corrigir na semana do lançamento: erros de copy ou placeholder
- **LOW** — backlog: UX mínimo

---

## CRITICAL

| # | Arquivo | Linha(s) | Problema | Correção sugerida |
|---|---------|----------|----------|-------------------|
| C1 | `para-acougues/ParaAcouguesClient.tsx` | 764, 856 | Simulator labels exibem "Comissão plataforma (7%)" e `value: '7%'` — mas açougue paga 10%. O cálculo interno usa `COMISSAO_RATE = 0.10` corretamente, mas o DISPLAY está errado. Açougue vê 7%, fecha parceria, e é cobrado 10%. | Trocar label para "Comissão plataforma (10%)" em ambas as linhas |
| C2 | `para-acougues/page.tsx` | 7 (description), 42 (faqSchema) | Metadata SEO: "Mensalidade R$ 369/mês + 7% de comissão". FAQ schema answer: "comissão de 7% da plataforma". Açougues pagam 10%, não 7%. Conflita com convite-acougue (correto em 10%) e com CLAUDE.md. | Substituir "7%" por "10%" em ambos os lugares |
| C3 | `para-acougues/ParaAcouguesClient.tsx` | 916–929 | Dois depoimentos hardcoded e inventados: "Açougue Premium SP" e "Casa de Carnes Bom Sabor" com frases fabricadas. Ainda não há parceiros reais. Cliente de açougue que pesquisar verá provas sociais que não existem. | Remover os dois primeiros cards, deixar só o placeholder "Seu Açougue aqui" com o campo `isPlaceholder` |

---

## HIGH

| # | Arquivo | Linha(s) | Problema | Correção sugerida |
|---|---------|----------|----------|-------------------|
| H1 | `para-acougues/page.tsx` | 7, 17 (OG title) | Gênero: "do Tech Churras" em ambos os títulos OG. | Trocar por "da Tech Churras" |
| H2 | `para-acougues/ParaAcouguesClient.tsx` | 10 | WhatsApp URL tem "quero+ser+parceiro+açougue+do+Tech+Churras". | Trocar "do+Tech+Churras" por "da+Tech+Churras" |
| H3 | `para-acougues/ParaAcouguesClient.tsx` | 253 | WhatsApp message: "Quero ser Parceiro Fundador do Tech Churras". | Trocar "do Tech Churras" por "da Tech Churras" |
| H4 | `para-acougues/ParaAcouguesClient.tsx` | 907 | "açougues já fazem parte do Tech Churras". | Trocar "do Tech Churras" por "da Tech Churras" |
| H5 | `para-churrasqueiros/ParaChurrasqueirosClient.tsx` | 7 | WhatsApp URL: "quero+ser+churrasqueiro+parceiro+do+Tech+Churras". | Trocar "do+Tech+Churras" por "da+Tech+Churras" |
| H6 | `page.tsx` (homepage) | 102 | Persona açougue diz "2 meses sem mensalidade para os primeiros parceiros". Modelo correto é 3 meses. | Trocar "2 meses" por "3 meses" |
| H7 | `page.tsx` (homepage) | 101 | Persona GM diz "2 meses sem mensalidade para os primeiros". GM nunca paga mensalidade — o texto não faz sentido e confunde a proposta de valor. | Substituir por benefício real: ex. "Chancela Jota Albuquerque inclusa no onboarding" |
| H8 | `convite-acougue/page.tsx` | 427, 487 | Diz "Somente para os primeiros 3 açougues em São Paulo" e "Restam 3 vagas de Parceiro Fundador". CLAUDE.md define 5 vagas fundadoras. | Trocar "3" por "5" em ambas as linhas |
| H9 | `para-acougues/ParaAcouguesClient.tsx` | 231, 233, 354 | Badge e texto dizem "1 por região". `pitch-acougue/page.tsx` linhas 27, 137 dizem "1 vaga por bairro". Nenhum dos dois bate com o modelo oficial (5 vagas em SP). | Padronizar para "5 vagas em SP" ou "primeiros 5 açougues em SP" em todas as páginas |

---

## MEDIUM

| # | Arquivo | Linha(s) | Problema | Correção sugerida |
|---|---------|----------|----------|-------------------|
| M1 | `page.tsx` (homepage) | 473 (footer) | "Conectando Grillmasters profissionais, açougues premium e clientes exigentes desde 2025." Plataforma lança em julho/2026 — "desde 2025" é factualmente errado. | Trocar "desde 2025" por "desde 2026" ou remover a data |
| M2 | `(dashboard)/dashboard/page.tsx` | 392 | Label do stat card: `'Acougues'` sem cedilha — visível a todos os usuários autenticados. | Trocar por "Açougues" |
| M3 | `(dashboard)/dashboard/page.tsx` | 484 | "para o proximo resgate" sem acento — visível a qualquer usuário com pontos. | Trocar por "próximo" |
| M4 | `churras-club/page.tsx` | 83 | Badge: "Lançamento em breve". Mas a homepage (`page.tsx` linha 429) anuncia "Assine por R$ 49/mês" e tem CTA "Conhecer o Churras Club" — usuário chega ao club e vê que não é assinável. | Ajustar o teaser na homepage para "Em breve — R$ 49/mês" ou colocar o CTA como lista de espera diretamente |
| M5 | `page.tsx` (homepage) | 276–283 | Stats section hardcoded: "4.9★ avaliação média" e "100% açougues validados" são afirmações de fato sem dados reais no lançamento. | Ou puxar da API (similar ao que homepage já faz para GMs/boutiques) ou trocar por afirmações não-numéricas como "chancelados" e "validados" |
| M6 | `para-acougues/ParaAcouguesClient.tsx` | 115 | FAQ resposta: "Fale com nosso time para mais detalhes sobre as condições de parceria." Sem link, sem contato. Deixa o açougue em um beco sem saída. | Adicionar link WhatsApp inline: `<a href="...">Fale com a gente no WhatsApp</a>` |
| M7 | `para-acougues/page.tsx` | 42 (faqSchema) | FAQ schema (SEO) diz "comissão de 7% da plataforma" para açougues no repasse semanal. Além de errar a taxa (deve ser 10%), essa resposta está indexada pelo Google. | Corrigir para 10% |

---

## LOW

| # | Arquivo | Linha(s) | Problema | Correção sugerida |
|---|---------|----------|----------|-------------------|
| L1 | `para-acougues/ParaAcouguesClient.tsx` | 294, 511 | "Cliente escaneia → 15% desconto no 1º pedido" mencionado no mockup e no "Como funciona". Não foi possível confirmar via frontend se esse desconto está wired no checkout. | Verificar se o fluxo de pagamento aplica o desconto de 15% automaticamente no primeiro pedido via QR code |
| L2 | `page.tsx` (homepage) | 288 | "1.800+ eventos em 3 continentes" no rodapé dos stats — number claim sobre Jota, não sobre a plataforma. Está OK mas está posicionado como dado da plataforma, não do fundador. | Mover para a seção Founder (linha 449+) onde o contexto é claro |
| L3 | `convite-churrasqueiro/page.tsx` | 311 | "Restam 10 vagas de Churrasqueiro Fundador em São Paulo." — número hardcoded sem base definida em CLAUDE.md. | Confirmar se 10 é o número oficial ou ajustar |
| L4 | `(dashboard)/dashboard/page.tsx` | 574 | Trust row: "Profissionais chancelados por Jota Grillmaster" — deve ser "Jota Albuquerque" (nomenclatura consistente com resto do app). | Trocar por "chancelados por Jota Albuquerque" |

---

## Sumário por Categoria

| Categoria | CRITICAL | HIGH | MEDIUM | LOW |
|-----------|----------|------|--------|-----|
| Gênero ("da" vs "do") | — | 5 | — | — |
| Pricing incorreto | 2 | — | 1 | — |
| Vagas inconsistentes | — | 2 | — | — |
| Trust signals / prova social falsa | 1 | — | 1 | — |
| Placeholder visível | — | — | 1 | — |
| Typo / gramática | — | — | 2 | 1 |
| CTA quebrado / ambíguo | — | — | 2 | 1 |
| Claim sem verificação | — | — | — | 2 |
| **Total** | **3** | **7** | **7** | **4** |

---

## Prioridade de execução

1. **Agora (bloqueia lançamento):** C1, C2, C3 — comissão errada e depoimentos falsos
2. **Antes do 06/07:** H1–H9 — gênero e pricing
3. **Semana do lançamento:** M1–M7 — polish e typos
4. **Backlog:** L1–L4
