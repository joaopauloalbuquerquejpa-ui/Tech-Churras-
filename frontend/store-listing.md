# Tech Churras — Play Store Listing (PT-BR)

## Título do app
```
Tech Churras — Churrasco e Açougue
```
> 34/50 caracteres ✅

---

## Descrição curta (80 chars máx)
```
Contrate churrasqueiros certificados, monte kit com IA e acompanhe ao vivo.
```
> 75/80 caracteres ✅

---

## Descrição longa (4000 chars máx)

```
🔥 O jeito mais fácil de fazer o melhor churrasco da sua vida.

Tech Churras é o marketplace que conecta você a Grillmasters profissionais certificados e açougues premium em São Paulo. Do convite ao último espeto — tudo em um só app.

━━━ CONTRATE UM GRILLMASTER ━━━

Churrasco bom começa com quem sabe o que está fazendo. Na Tech Churras, você escolhe entre churrasqueiros profissionais verificados pela nossa equipe — todos treinados, avaliados e com histórico real de eventos.

Aniversários, confraternizações corporativas, casamentos, formaturas: o Grillmaster cuida de tudo. Você só aproveita.

✅ Profissionais verificados e avaliados
✅ Perfis completos com estilo, especialidades e fotos
✅ Agenda e disponibilidade em tempo real
✅ Avaliações de clientes reais

━━━ AÇOUGUES PARCEIROS ━━━

Seus Grillmasters parceiros trabalham com os melhores açougues de SP. Carnes selecionadas, carvão, acompanhamentos — tudo entregue diretamente no evento.

✅ Açougues verificados pela plataforma
✅ Catálogo completo com preços e fotos
✅ Pedido integrado ao evento — um só checkout

━━━ KIT MONTADO POR IA ━━━

Não sabe quanto de carne pedir? A nossa IA calcula o kit perfeito baseado no número de convidados, perfil do churrasqueiro e estilo do evento.

Picanha para aniversário? Fraldinha para parrilla? Costela para churrasco gaúcho? A IA recomenda os cortes certos, na quantidade certa, com base no que funciona.

✅ Sugestão automática de carnes, acompanhamentos e carvão
✅ Calculado por convidado (adultos, mulheres, crianças)
✅ Baseado nas especialidades do churrasqueiro escolhido

━━━ ACOMPANHE AO VIVO ━━━

Seu churrasqueiro saiu para buscar as carnes? Está a caminho? No mapa em tempo real você vê onde ele está e recebe atualizações a cada etapa.

✅ Rastreamento do churrasqueiro no mapa
✅ Notificações de status do pedido
✅ ETA em tempo real

━━━ BAHARI OF BRAZIL ━━━

A Tech Churras é parceira oficial do Projeto Bahari of Brazil — iniciativa do Governo de Zanzibar (MCITI) para promover a culinária brasileira em mercados internacionais, com nosso fundador Jota como BBQ Master representante do Brasil.

━━━ COMO FUNCIONA ━━━

1. Escolha um Grillmaster disponível na sua região
2. A IA monta o kit de carnes ideal para o seu evento
3. Confirme o açougue parceiro e faça o pedido
4. Acompanhe tudo ao vivo pelo mapa
5. Avalie o profissional ao final

Tech Churras — Feito para quem leva o churrasco a sério. 🥩
```
> ~2.200 caracteres (espaço para crescer até 4.000) ✅

---

## Categoria
- **Categoria principal:** Alimentação e bebidas (Food & Drink)
- **Categoria secundária:** Estilo de vida (Lifestyle)

---

## Tags / palavras-chave sugeridas
```
churrasqueiro profissional, churrasco SP, grillmaster, açougue premium,
contratar churrasqueiro, kit churrasco IA, churrasco corporativo,
churrasco aniversário, Tech Churras, rastreamento churrasqueiro
```

---

## Classificação indicativa
**Livre (Everyone / L)**
- Sem violência, sem conteúdo adulto, sem compras in-app de conteúdo inapropriado
- Exibe preços de serviços (normal para marketplace)
- A classificação "Livre" (L) é adequada — equivale a "E" no sistema do Google

---

## Política de privacidade
URL obrigatória para publicação:
```
https://www.techchurras.com.br/politica-de-privacidade
```
> ✅ Página já existe com conteúdo completo (LGPD). `/privacidade` redireciona para ela.

---

## Screenshots — Requisitos e Recomendações

### Especificações técnicas (Google Play Console)
| Item | Mínimo | Máximo | Formatos aceitos |
|------|--------|--------|-----------------|
| Telefone | 2 | 8 | JPEG ou PNG, sem alpha |
| Tablet 7" | 0 | 8 | JPEG ou PNG, sem alpha |
| Tablet 10" | 0 | 8 | JPEG ou PNG, sem alpha |

**Dimensões aceitas para telefone:**
- Portrait: 1080 × 1920 px (16:9) ← mais comum
- Portrait: 1080 × 2400 px (20:9) ← telas modernas
- Landscape: 1920 × 1080 px (se preferir horizontal)
- Regra: lado menor ≥ 320px, lado maior ≤ 3.840px, razão entre 16:9 e 9:16

**Feature Graphic (banner):**
- Tamanho: **1024 × 500 px** (obrigatório se quiser destaque na loja)
- Formato: JPEG ou PNG, sem alpha
- Conteúdo: sem texto (será sobreposto pelo Google)

---

### Telas prioritárias (mínimo 2, ideal 6-8)

| # | Tela | Por quê | Screenshot existente |
|---|------|---------|---------------------|
| 1 | **Listagem de Grillmasters** | Proposta de valor imediata | screenshots/ca_mobile_*.png |
| 2 | **Kit sugerido pela IA** | Diferencial tecnológico | screenshots/05_resultado_ia.png |
| 3 | **Perfil do Grillmaster** | Confiança / prova social | screenshots/ca3_*.png |
| 4 | **Açougues parceiros** | Completeness do serviço | screenshots/acougues/*.png |
| 5 | **Mapa ao vivo / rastreamento** | Feature exclusiva | — capturar do app |
| 6 | **Formulário de pedido** | Facilidade de uso | screenshots/04_formulario_preenchido.png |
| 7 | **Dashboard / painel** | Mostra ecossistema | screenshots/bdash_top.png |
| 8 | **Splash + onboarding** | Primeira impressão | — capturar do app |

> ⚠️ As screenshots existentes provavelmente são de desktop.
> Para o Play Console, você precisa de capturas **mobile (portrait, 1080px+)**.
> Capture direto do Android Studio (emulador Pixel 7 → 1080×2400) ou de um celular físico.

---

## Checklist completo — do zero ao primeiro AAB publicado

### Fase 1 — Ambiente (fazer agora)
- [x] `build.gradle` atualizado (minSdk 22, targetSdk 34, versionName 1.0.0, signing config)
- [x] `.gitignore` protegendo keystore e senhas
- [x] `keystore.properties.template` criado
- [x] `.keystore-info.txt` criado (gitignored)
- [x] `store-listing.md` criado
- [x] `capacitor.config.ts` corrigido (`webDir: 'public'`)
- [x] `/privacidade` → redireciona para `/politica-de-privacidade` (LGPD completo)
- [ ] **Instalar Android Studio** (developer.android.com/studio) — ~1.2 GB
- [ ] Abrir Android Studio uma vez para baixar SDK components (~800 MB)
- [ ] Terminal com Java no PATH (Android Studio inclui JDK em `jbr/bin/`)

### Fase 2 — Keystore (após instalar Android Studio)
```bash
# No terminal do Android Studio (ou com Java no PATH):
cd C:/projetos/tech-churras/frontend/android

keytool -genkey -v \
  -keystore techchurras.keystore \
  -alias techchurras \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Tech Churras, OU=Mobile, O=Tech Churras, L=Sao Paulo, ST=SP, C=BR"

# Quando pedir senha: escolha senha forte (ex: 16+ chars), salve em .keystore-info.txt
# Quando pedir "senha da chave": pode usar a mesma senha do store

# Após gerar, confirme:
keytool -list -v -keystore techchurras.keystore -alias techchurras
# Copie o SHA-1 para .keystore-info.txt
```

- [ ] Criar `keystore.properties` (copiar do template e preencher senhas)
- [ ] Guardar senhas em gerenciador de senhas (1Password, Bitwarden, etc.)
- [ ] Confirmar que `.keystore` e `keystore.properties` estão no `.gitignore`

### Fase 3 — Sync e Build
```bash
# No terminal, dentro de frontend/:
npx cap sync android

# Abre o projeto no Android Studio:
npx cap open android
```
- [ ] `npx cap sync android` sem erros
- [ ] Android Studio abre sem erros de Gradle sync
- [ ] Menu: **Build → Generate Signed Bundle/APK**
  - Escolher: **Android App Bundle (.aab)**
  - Keystore file: selecionar `techchurras.keystore`
  - Alias: `techchurras`
  - Senhas: conforme `keystore.properties`
  - Build Variant: **release**
- [ ] AAB gerado em: `android/app/build/outputs/bundle/release/app-release.aab`

### Fase 4 — Google Play Console
- [ ] Acessar: play.google.com/console (conta ID: 8304366789103710767)
- [ ] Criar app → applicationId: `com.techchurras.app`
- [ ] Preencher ficha com textos deste arquivo (`store-listing.md`)
- [ ] Criar política de privacidade em `/privacidade` no site
- [ ] Tirar screenshots mobile (mínimo 2, recomendado 6-8 em 1080×1920 ou 1080×2400)
- [ ] Upload screenshots + feature graphic (1024×500)
- [ ] Configurar conteúdo: classificação indicativa → responder questionário → **Livre**
- [ ] Upload do AAB em **Testes internos** primeiro (para validar antes de ir a Produção)
- [ ] Adicionar testadores internos (seus emails)
- [ ] Instalar via link de teste interno e validar no celular
- [ ] Se OK → Promover para **Produção** (revisão leva 1-7 dias para apps novos)

---

## Notas importantes

### Por que WebView + URL (e não app offline)?
O `capacitor.config.ts` usa `server.url: 'https://www.techchurras.com.br'`, ou seja,
o app é uma casca nativa que carrega o site em produção. Vantagens:
- Atualizações instantâneas sem nova submissão à Play Store
- Código único (Next.js já é o app)
- Funcionalidades nativas: push notifications, splash screen, deep links

O Google aceita esse modelo desde que o app tenha valor (tem: push nativo, splash, tracking de pedido).

### Compatibilidade
- minSdk 22 = Android 5.1 (Lollipop MR1) → cobre 99,6% dos dispositivos Android ativos
- targetSdk 34 = Android 14 → atende requisito do Play Console (mínimo 33+ para novos apps em 2024)
- compileSdk 36 = mais recente → sem avisos de deprecação no Android Studio
