# Screenshots para o Google Play Console — Tech Churras

## Especificações técnicas
- **Tamanho:** 1080 × 1920 px (portrait) ou 1080 × 2400 px
- **Formato:** PNG ou JPEG, sem canal alpha
- **Mínimo:** 2 screenshots | **Máximo:** 8 por tipo de dispositivo
- **Como capturar:** Chrome DevTools → F12 → Device Toolbar → Pixel 7 (1080×2400) → botão direito → "Capture screenshot"

---

## 8 screenshots em ordem de impacto

### #1 — Tela inicial com churrasqueiros disponíveis
**URL:** `https://www.techchurras.com.br/grillmasters`
**O que mostra:** cards dos churrasqueiros com foto, rating, preço, badge de certificação
**Por que é a #1:** primeira impressão — prova que há profissionais reais disponíveis

---

### #2 — Kit sugerido pela IA (diferencial principal)
**URL:** `https://www.techchurras.com.br/pedido` → preencher formulário → ver resultado
**O que mostra:** lista de carnes recomendadas pela IA com quantidades e preços
**Por que é a #2:** diferencial competitivo — nenhum concorrente tem isso

---

### #3 — Perfil de um churrasqueiro
**URL:** `https://www.techchurras.com.br/grillmasters/[slug-do-jota]`
**O que mostra:** foto, bio, especialidades, avaliações, badge Bahari, botão contratar
**Por que é a #3:** constrói confiança — avaliações e credencial internacional

---

### #4 — Rastreamento ao vivo
**URL:** `https://www.techchurras.com.br/acompanhar/[token-de-pedido-real]`
**O que mostra:** mapa com pin do churrasqueiro em movimento, timeline de status
**Por que é a #4:** feature exclusiva — nenhuma outra plataforma de churrasco tem mapa ao vivo

---

### #5 — Lista de açougues parceiros
**URL:** `https://www.techchurras.com.br/acougues/sao-paulo`
**O que mostra:** açougues com logo, endereço, produtos em destaque, avaliação
**Por que é a #5:** mostra que não é só churrasqueiro — é o ecossistema completo

---

### #6 — Formulário de pedido (step 1)
**URL:** `https://www.techchurras.com.br/pedido`
**O que mostra:** campos de evento (data, convidados, endereço), visual limpo
**Por que é a #6:** mostra simplicidade — "3 cliques" fica crível

---

### #7 — Dashboard do açougue parceiro
**URL:** `https://www.techchurras.com.br/boutiques/dashboard` (logar como açougue)
**O que mostra:** pedidos recebidos, produtos, QR code do balcão
**Por que é a #7:** atrai açougues a se cadastrar (B2B screenshot)

---

### #8 — Tela home / landing
**URL:** `https://www.techchurras.com.br`
**O que mostra:** hero com headline, CTA "Pedir agora", fotos de eventos
**Por que é a #8:** identidade da marca, contexto geral

---

## Passo a passo para capturar

```
1. Abra o Chrome
2. Pressione F12 (DevTools)
3. Clique no ícone de celular (Device Toolbar)
4. Selecione "Pixel 7" no dropdown de dispositivos
   → Se não aparecer: clique "Edit" → Add → Width 1080, Height 2400, DPR 2.625
5. Navegue até a URL da screenshot
6. Clique com botão direito na área da página
7. Selecione "Capture screenshot"
8. Salve com o nome indicado abaixo
```

## Nomes de arquivo sugeridos
```
01-grillmasters-lista.png
02-kit-ia-resultado.png
03-perfil-churrasqueiro.png
04-rastreamento-mapa.png
05-acougues-parceiros.png
06-formulario-pedido.png
07-dashboard-acougue.png
08-home-landing.png
```

## Feature Graphic (banner 1024×500 — obrigatório)
Arquivo pronto para capturar: `store-assets/feature-graphic.html`
Abra no Chrome → DevTools → 1024×500 DPR 1 → Capture screenshot
