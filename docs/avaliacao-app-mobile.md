# Avaliação Técnica — PWA vs App Mobile Nativo
**Data:** Junho 2026 · **Para:** Decisão de roadmap mobile do Tech Churras

---

## 1. Estado atual do PWA

O Tech Churras já é um PWA funcional. O que está implementado:

| Recurso | Status | Detalhe |
|---|---|---|
| Instalável (Add to Home Screen) | ✅ Funciona | `manifest.json` com `display: standalone`, ícones 192px e 512px |
| Abre sem barra do browser | ✅ Funciona | `display: standalone` configurado |
| Ícone na tela inicial | ✅ Funciona | `icon-192.png` e `icon-512.png` presentes |
| Push notifications (Android) | ✅ Funciona | Service Worker + VAPID + web-push implementados |
| Push notifications (iOS) | ⚠️ Parcial | Funciona apenas no iOS 16.4+ **e** somente se instalado via Add to Home Screen |
| Cache offline básico | ⚠️ Mínimo | SW cacheia `/`, `/dashboard` e `/offline.html` — mas `offline.html` não existe ainda |
| Tema laranja na barra de status | ✅ Funciona | `theme-color: #f97316` no layout |
| Apple touch icon (iOS) | ✅ Funciona | `apple-touch-icon` configurado |
| Splash screen nativa | ❌ Não configurada | Nenhuma meta tag `apple-splash-screen` definida |
| Ícone maskable (bordas adaptativas) | ❌ Ausente | Sem variante `purpose: maskable` no manifest |
| Atalhos (shortcuts) no manifest | ❌ Ausente | Poderia atalhar "Novo Pedido" direto do ícone |
| Screenshots no manifest | ❌ Ausente | Deixaria o prompt de instalação mais rico |

**Diagnóstico:** O PWA está 70% completo. Funciona bem no Android. No iOS, a experiência de instalação e notificações é degradada mas utilizável.

---

## 2. Gaps do PWA vs App Nativo — específicos para o Tech Churras

### Gap crítico: Rastreamento GPS em background
O Tech Churras rastreia a localização do churrasqueiro em tempo real para o cliente ver no mapa. **O PWA não consegue acessar GPS em background** (quando o app está fechado ou em segundo plano) — isso é uma limitação do Web API para ambos iOS e Android. A consequência prática: o churrasqueiro precisa manter o browser aberto e visível para o tracking funcionar. Um app nativo rodaria o tracking em background sem restrição.

### Gap importante: Push notifications no iOS
- PWA + iOS: funciona apenas em iOS 16.4+, somente se o usuário instalou via "Adicionar à tela de início", e com banner de permissão que muitos ignoram.
- App nativo iOS: notificações funcionam para qualquer usuário, sem precisar instalar nada extra. A taxa de opt-in no iOS nativo é ~50–70% vs <15% estimado para PWA.
- **Impacto direto:** notificações de novo pedido (para o churrasqueiro) e de status de pedido (para o cliente) são centrais para o produto. No iOS, o PWA pode deixar usuários sem receber alertas críticos.

### Gap relevante: Presença nas lojas
O PWA não aparece na App Store nem na Play Store. Usuários não encontram o Tech Churras buscando "churrasqueiro app" — precisam receber o link diretamente. Para a Cidade Piloto (usuários indicados) isso é irrelevante. Para escala, é uma barreira real de aquisição.

### Gap menor: Câmera para onboarding de parceiros
O açougue tira fotos da fachada, logo e produtos. A API de câmera do browser funciona, mas é mais lenta e tem menos controle (zoom, foco manual, compressão) do que APIs nativas. A funcionalidade existe e funciona — apenas com UX inferior.

### Sem gap real:
- Pagamentos: Mercado Pago funciona igualmente no browser
- Chat: WebSocket/polling funciona no PWA
- Formulários e dashboards: PWA é equivalente ao nativo

---

## 3. Esforço estimado

### Opção A — Polir o PWA (recomendada para Cidade Piloto)

| Tarefa | Esforço |
|---|---|
| Criar `offline.html` | 30 min |
| Adicionar ícone maskable | 1h (design + manifest) |
| Meta tags de splash screen iOS | 1h |
| Atalhos no manifest (`shortcuts`) | 30 min |
| Testar instalação em iPhone e Android | 2h |
| **Total** | **~1 dia de trabalho** |

Isso não resolve o gap de background GPS e melhora marginalmente o iOS — mas entrega uma experiência mais polida sem custo significativo.

### Opção B — App React Native (Expo)

| Fase | Esforço estimado |
|---|---|
| Setup Expo + autenticação + navegação | 1 semana |
| Telas de cliente (listagem, pedido, pagamento, mapa, chat) | 3–4 semanas |
| Telas de parceiro (boutique/GM onboarding, dashboards) | 3–4 semanas |
| Push notifications nativas (iOS + Android) | 1 semana |
| Background location (tracking do grillmaster) | 1 semana |
| Publicação na App Store e Play Store | 1–2 semanas (revisão da Apple pode atrasar) |
| **Total** | **3–4 meses de desenvolvimento solo** |

O backend não precisa mudar — a API REST já existe. Seria basicamente reescrever o frontend em React Native.

### Opção C — PWA + TWA (Trusted Web Activity) para Play Store

O Android permite empacotar um PWA como app nativo via TWA e publicar na Play Store. Isso dá presença na Play Store sem reescrever nada.

| Tarefa | Esforço |
|---|---|
| Gerar `.apk` TWA (Digital Asset Links, Bubblewrap) | 1–2 dias |
| Publicar na Play Store | 1 dia + revisão (~3–7 dias) |
| **Total** | **~1 semana** |

Limitação: resolve Play Store mas não App Store (Apple não aceita TWA). iOS continua sendo PWA.

---

## 4. Recomendação

### Para a fase "Cidade Piloto" (3–20 usuários, foco em validação): **Polir o PWA**

**Justificativa:**
- Os usuários piloto são indicados — você manda o link diretamente, sem precisar de loja.
- Com 5–20 usuários, você pode orientar pessoalmente cada um a instalar o PWA e ativar notificações.
- Os gaps (background GPS, iOS push) não vão derrubar a validação nesta escala.
- Investir 3–4 meses em React Native agora seria construir antes de validar o modelo de negócio.
- **1 dia de polimento no PWA** é o investimento correto antes da Cidade Piloto.

### Para a fase de escala (50+ usuários, usuários autônomos): **React Native**

Quando o modelo for validado e você quiser crescer organicamente (indicações, loja, marketing), os gaps do PWA — especialmente notificações no iOS e ausência nas lojas — se tornam barreiras reais. Nessa fase, o React Native faz sentido: o backend já está pronto, a lógica de negócio existe, e seria principalmente um trabalho de frontend.

**Sequência sugerida:**
1. Cidade Piloto → PWA polido (agora)
2. Primeiros resultados reais + feedback → validar o produto
3. Se tracionar → construir app React Native (Expo) + TWA Play Store
4. App Store iOS: submeter após validação (processo mais longo/criterioso)

---

## Anexo — O que fazer ainda no PWA antes da Cidade Piloto

```
1. Criar /public/offline.html (página simples: "Você está offline. Conecte-se para continuar.")
2. Gerar icon-192-maskable.png (mesmo ícone com fundo laranja, sem margens)
3. Adicionar no manifest.json: { "src": "/icon-192-maskable.png", "purpose": "maskable", "sizes": "192x192" }
4. Adicionar no layout.tsx: meta tags apple-mobile-web-app-capable e apple-touch-startup-image
```

Esses 4 itens levam menos de 1 dia e fecham os principais gaps da instalação no iOS/Android.
