# Como capturar os assets do Play Console agora (sem Android Studio)

## 1. Feature Graphic (1024×500) — OBRIGATÓRIO

1. Abra `feature-graphic.html` no Chrome
2. F12 → ícone de celular (Device Toolbar)
3. No dropdown de resolução → "Edit..." → "Add custom device":
   - Device name: Play Feature Graphic
   - Width: 1024 / Height: 500 / DPR: 1
4. Selecione "Play Feature Graphic" no dropdown
5. Clique com botão direito na área da página → "Capture screenshot"
6. Salve como: `feature-graphic.png`
7. Upload no Play Console: Presença na loja → Imagem de recurso (1024×500)

---

## 2. Ícone 512×512 — já pronto ✅

Arquivo: `frontend/public/icon-512.png` (512×512 px)
Upload no Play Console: Presença na loja → Ícone do app

---

## 3. Screenshots de telefone (mínimo 2, ideal 6-8)

**Tamanho aceito:** min 320px, max 3840px. Razão entre 9:16 e 16:9.
**Recomendado:** 1080×1920 (portrait) ou 1080×2400 (portrait moderno)

### Como capturar via Chrome DevTools:

1. Abra `https://www.techchurras.com.br` no Chrome
2. F12 → Device Toolbar → selecione "Pixel 7" (ou custom 1080×2400, DPR 2.625)
3. Para cada tela abaixo, navegue até ela e clique:
   **Menu de 3 pontos → More tools → Capture full size screenshot**
   (ou botão direito → Capture screenshot para a viewport apenas)

### Telas prioritárias (capture nesta ordem):

| # | URL / Navegação | Nome do arquivo |
|---|----------------|----------------|
| 1 | `/grillmasters` — lista com cards | screenshot-01-grillmasters.png |
| 2 | `/grillmasters/[slug]` — perfil de um GM | screenshot-02-perfil-gm.png |
| 3 | `/pedido?boutique=xxx` — assistente IA (preencha um formulário) | screenshot-03-kit-ia.png |
| 4 | `/acougues` ou página de açougues | screenshot-04-acougues.png |
| 5 | `/acompanhar/[id]` — tela de rastreamento | screenshot-05-rastreamento.png |
| 6 | Tela home `/` — hero principal | screenshot-06-home.png |

**Mínimo obrigatório para envio:** 2 screenshots.
**Para destaque na loja:** 6-8 com boa variedade.

---

## 4. O que fazer no Play Console agora (sem AAB)

Acesse: **play.google.com/console** → Conta ID 8304366789103710767

### Passo 1 — Criar o app
- Clique "Criar app"
- Nome do app: **Tech Churras — Churrasco e Açougue**
- Idioma padrão: **Português (Brasil) — pt-BR**
- App ou jogo: **App**
- Gratuito ou pago: **Gratuito**
- Aceitar políticas → "Criar app"

### Passo 2 — Presença na loja (copie do store-listing.md)
- Título: `Tech Churras — Churrasco e Açougue`
- Descrição curta: `Contrate churrasqueiros certificados, monte kit com IA e acompanhe ao vivo.`
- Descrição longa: (texto completo em store-listing.md)
- Ícone: `public/icon-512.png`
- Imagem de recurso: `feature-graphic.png` (capturar conforme acima)
- Screenshots: mínimo 2 (capturar conforme acima)

### Passo 3 — Classificação do conteúdo
- Clique em "Classificação do conteúdo" no menu lateral
- Preencha o questionário:
  - Violência: **Não**
  - Sexual: **Não**
  - Linguagem: **Não**
  - Produtos controlados: **Não**
  - Interação entre usuários: **Sim** (avaliações, contato com profissional)
  - Compartilhamento de localização: **Sim** (rastreamento do churrasqueiro)
  - Conteúdo gerado pelo usuário: **Sim** (avaliações, fotos)
  - Compras: **Sim** (marketplace com pagamento)
  - Jogos de azar: **Não**
- Classificação esperada: **Livre (L)** ou **10 anos**

### Passo 4 — Política de privacidade
- URL: `https://www.techchurras.com.br/politica-de-privacidade`

### Passo 5 — Configuração do app
- Em "Acesso ao app": Todas as funcionalidades acessíveis sem login restrito
  (ou criar conta de teste se quiserem testar funcionalidades autenticadas)

### Passo 6 — Versão do app (aguardar AAB)
- Menu: Produção → Criar novo lançamento
- Aqui você vai fazer upload do AAB após gerar com Android Studio
- **Pule este passo por enquanto**

---

## Resumo: o que falta só do Android Studio

1. `keytool` → gerar `techchurras.keystore` (5 min após instalar)
2. `keystore.properties` → preencher com as senhas (2 min)
3. Android Studio → Build → Generate Signed Bundle → AAB release (5 min)
4. Upload do AAB no Play Console → Produção ou Testes Internos (2 min)

**Tempo estimado após Android Studio pronto: ~15 minutos**
