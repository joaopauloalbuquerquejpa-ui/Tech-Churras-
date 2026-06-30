# Audit Mobile / PWA — Tech Churras
**Data:** 2026-06-30
**Escopo:** PWA manifest, service worker, install prompt, Capacitor/Android, viewport, touch targets, performance, Play Store readiness.

---

## Sumário executivo

5 bloqueadores críticos — precisam ser resolvidos antes do lançamento (06/07). Nenhum deles exige refatoração pesada; todos são arquivos faltando ou configs incorretas. O restante é melhoria de qualidade que pode entrar pós-lançamento.

---

## 1. PWA Manifest

**Arquivo:** `frontend/public/manifest.json`

| Campo | Status | Valor |
|---|---|---|
| `name` | OK | "Tech Churras" |
| `short_name` | OK | "TechChurras" |
| `start_url` | OK | `/dashboard` |
| `display` | OK | `standalone` |
| `theme_color` | OK | `#f97316` |
| `background_color` | OK | `#000000` |
| `icon 192x192` | OK | referenciado |
| `icon 512x512` | **BLOQUEADOR** | arquivo nao existe |
| `purpose: maskable` | AUSENTE | icones sem maskable |
| `scope` | AUSENTE | campo nao declarado |
| `lang` | AUSENTE | campo nao declarado |

### Bloqueador 1 — `icon-512.png` nao existe

O manifest referencia `/icon-512.png` mas o arquivo nao esta em `public/`. O arquivo `public/icons/icon-1024.png` existe mas nao e referenciado.

Sem o icon-512, o Chrome no Android rejeita o critério de instalabilidade (o evento `beforeinstallprompt` pode nao disparar). Para a Play Store, o ícone de alta resolucao é obrigatorio.

**Acao:** copiar/redimensionar `icons/icon-1024.png` para `public/icon-512.png` e adicionar uma entrada `maskable` no manifest.

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "scope": "/",
  "lang": "pt-BR"
}
```

### Observacao — `start_url: "/dashboard"`

Uma instalacao nova do PWA com usuario nao autenticado abre `/dashboard`, que redireciona para `/login`. Funcional, mas pode confundir. Considerar `start_url: "/"` ou `"/?utm_source=pwa"` para rastrear installs no GA4.

---

## 2. Service Worker

**Arquivo:** `frontend/public/sw.js`

### Bloqueador 2 — `offline.html` nao existe

O SW define fallback:
```js
const PRECACHE = ['/', '/dashboard', '/offline.html']
// ...
caches.match(event.request).then(cached => {
  return cached || fetch(event.request).catch(() =>
    caches.match('/offline.html')  // aponta para arquivo inexistente
  )
})
```

O arquivo `public/offline.html` nao existe. Quando a rede falha e nao ha cache, o SW tenta servir `/offline.html` e retorna `undefined` — a pagina falha silenciosamente sem feedback ao usuario.

**Acao:** criar `public/offline.html` com mensagem minima.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sem conexao — Tech Churras</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
    h1 { color: #f97316; }
  </style>
</head>
<body>
  <div>
    <h1>Sem conexao</h1>
    <p>Verifique sua internet e tente novamente.</p>
  </div>
</body>
</html>
```

### Bloqueador 3 — PRECACHE nunca e executado

A constante `PRECACHE` e declarada mas nunca usada em um handler `install`:

```js
const PRECACHE = ['/', '/dashboard', '/offline.html']  // definida mas nunca usada

self.addEventListener('install', () => self.skipWaiting())  // nao pre-cacheia nada
```

Resultado: o SW nao cacheia nenhum asset durante a instalacao. O fallback offline nunca encontra `/offline.html` no cache porque ele nunca foi inserido.

**Acao:** adicionar logica de pre-cache no evento `install`:

```js
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
})
```

### O que esta correto no SW

- Push notifications com titulo, body, icon, vibrate, tag, renotify — correto
- `notificationclick` com `clients.openWindow` — correto
- Skip cross-origin requests — correto
- Header `Service-Worker-Allowed: /` configurado no `next.config.ts` — correto
- Cache-Control `no-cache` no sw.js para garantir atualizacoes — correto
- Registro via `afterInteractive` no layout.tsx — correto

---

## 3. Install Prompt

**Arquivo:** `frontend/src/components/PWAInstallPrompt.tsx`

Implementacao correta nos pontos principais:

- iOS detectado via UA + instrucoes de "Compartilhar > Adicionar a Tela de Inicio" — correto
- Android via `beforeinstallprompt` com `e.preventDefault()` e `deferredPrompt.prompt()` — correto
- Detecta modo standalone para nao mostrar em app ja instalado — correto
- Dismissal persistido em `localStorage` — correto
- Aparece apos 2s (Android) / 3s (iOS) — correto
- Posicionado acima da `MobileNav` com `bottom-20` — correto

**Observacao (nao bloqueador):** o botao "Fechar" tem `p-0.5` e SVG 14x14px — area de toque de ~15px, bem abaixo de 44px. Ver secao Touch Targets.

---

## 4. Capacitor Config

**Arquivos:** `frontend/capacitor.config.ts` e `frontend/android/app/src/main/assets/capacitor.config.json`

### Bloqueador 4 — Mismatch de App ID

| Arquivo | appId |
|---|---|
| `capacitor.config.ts` | `com.techchurras.android` |
| `android/app/src/main/assets/capacitor.config.json` | `com.techchurras.app` |
| `build.gradle` (`applicationId`) | `com.techchurras.android` |
| `build.gradle` (`namespace`) | `com.techchurras.app` |

Ha dois IDs diferentes em uso. O `applicationId` do `build.gradle` (`com.techchurras.android`) e o que a Play Store ve e registra — esse nao pode ser mudado apos o primeiro upload. O `namespace` e para o codigo Java/Kotlin e pode diferir, mas o `capacitor.config.json` baked no APK diz `com.techchurras.app`, criando inconsistencia.

**Acao:** decidir um ID definitivo antes do primeiro upload para a Play Store e unificar. Recomendado: `com.techchurras.app` (mais limpo). Alterar `applicationId` em `build.gradle` e `appId` em `capacitor.config.ts`, depois re-executar `npx cap sync android`.

### Bloqueador 5 — `google-services.json` ausente

O `build.gradle` tenta aplicar o plugin `com.google.gms.google-services` se o arquivo existir:

```groovy
def servicesJSON = file('google-services.json')
if (servicesJSON.text) {
    apply plugin: 'com.google.gms.google-services'
}
```

O arquivo nao existe em `android/app/`. Sem ele, o Firebase Cloud Messaging nao e inicializado no app nativo. Push notifications funcionam na PWA (via Web Push + VAPID), mas o canal nativo do Capacitor (`@capacitor/push-notifications`) nao funcionara no APK/AAB.

**Acao:** criar um projeto Firebase, adicionar o app Android com o `applicationId` definitivo, baixar o `google-services.json` e colocar em `android/app/google-services.json`.

### O que esta correto no Capacitor

- `server.url: 'https://www.techchurras.com.br'` — app carrega producao, correto
- `cleartext: false`, `androidScheme: 'https'` — sem HTTP, correto
- `webContentsDebuggingEnabled: false` — desabilitado em producao, correto
- `allowMixedContent: false` — correto
- SplashScreen 2.5s com `CENTER_CROP` — correto
- StatusBar dark — correto
- Keystore existe: `android/techchurras.keystore` — bom
- `keystore.properties` existe — bom

---

## 5. Viewport

**Arquivo:** `frontend/src/app/layout.tsx`

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

- Correto para mobile
- `viewportFit: 'cover'` cobre o notch do iPhone — correto
- O `<meta name="theme-color">` esta no `<head>` — correto

Nao ha viewport customizado por pagina sobrescrevendo o global — sem problema identificado.

---

## 6. Touch Targets

Minimo recomendado: 44x44px (iOS HIG e Material Design).

| Elemento | Arquivo | Tamanho estimado | Status |
|---|---|---|---|
| Botao fechar (X) — PWAInstallPrompt | `PWAInstallPrompt.tsx:84` | SVG 14px + p-0.5 ≈ 15px | ABAIXO |
| Botao "Sair" logout | `(dashboard)/layout.tsx:153` | px-3 py-1 ≈ 28px alto | ABAIXO |
| Botao "Entrar" (publico) | `(dashboard)/layout.tsx:158` | px-3 py-1 ≈ 28px alto | ABAIXO |
| CartIcon no header | `(dashboard)/layout.tsx:35` | w-9 h-9 = 36px | ABAIXO |
| Items do MobileNav | `MobileNav.tsx` | icone 22px + label 10px + padding — ~44px total | OK |
| Botao "Ativar notificacoes" | `(dashboard)/layout.tsx:24` | px-3 py-1.5 ≈ 32px | ABAIXO |

**Prioridade alta:** o botao fechar do PWAInstallPrompt (15px) e o logout/entrar do header sao os piores. Em telas de 360dp esses alvos sao frustrantes de tocar.

**Correcao rapida — fechar do PWAInstallPrompt:**
```tsx
// de:
className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors p-0.5"
// para:
className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors p-3 -m-2"
```

**Correcao rapida — Sair/Entrar no header:**
```tsx
// de: px-3 py-1
// para: px-3 py-2
```

---

## 7. Performance

### next.config.ts

- CSP configurado com todas as origens necessarias — correto
- `withSentryConfig` com `sourcemaps.disable: true` em producao — correto
- Sem configuracao de `images.domains` ou `images.remotePatterns` — imagens de terceiros (Supabase) carregadas via `<img>` direta, sem otimizacao do Next.js Image

### build.gradle — Android

```groovy
minifyEnabled false
```

Minificacao desabilitada significa sem R8/ProGuard. Para um app Capacitor que carrega tudo via URL remota o impacto e menor (o bundle JS nao esta no APK), mas o codigo Java/Kotlin nao e otimizado e o APK e maior que o necessario.

**Recomendacao:** habilitar `minifyEnabled true` no release build com o proguard-rules.pro ja configurado.

### Scripts de terceiros

O `TrackingScripts` (GA4, Meta Pixel, TikTok Pixel, Google Ads) carrega apenas apos consentimento LGPD — correto. Plausible carrega sempre (privacy-friendly, sem cookies) — aceitavel.

Sentry carrega via CDN (`https://js.sentry-cdn.com`) — fonte unica de risco de performance; monitorar o impacto no LCP.

### Imagens

- Logo carregada com `<img>` simples sem `loading="lazy"` — ok para elemento above-the-fold
- Sem `width`/`height` explicitos em algumas imagens (risco de layout shift no CLS)
- OG image `/jota.jpg` nao verificada — garantir que e comprimida para <200KB

---

## 8. Play Store Readiness

| Item | Status | Acao |
|---|---|---|
| Keystore (`.keystore`) | EXISTE | nenhuma |
| `keystore.properties` | EXISTE | nenhuma |
| `google-services.json` | **AUSENTE** | criar projeto Firebase + baixar arquivo |
| App ID unificado | **INCONSISTENTE** | decidir ID e unificar antes do 1o upload |
| `versionCode` / `versionName` | OK (2 / 1.0.1) | nenhuma |
| `targetSdkVersion` | OK (35) | nenhuma |
| `minSdkVersion` | OK (24 = Android 7.0) | nenhuma |
| Geracao do AAB | **PENDENTE** | `cd android && ./gradlew bundleRelease` |
| Ficha da loja (titulo, descricao, screenshots) | **PENDENTE** | criar no Play Console |
| 12 testers para closed testing | **PENDENTE** | recrutar / Play Console |
| Politica de privacidade (URL) | OK (existe `/politica-de-privacidade`) | confirmar URL publica |
| minifyEnabled release | **DESABILITADO** | habilitar para reducao do APK |

### Sequencia recomendada antes do upload

1. Decidir App ID definitivo (`com.techchurras.app` recomendado)
2. Atualizar `capacitor.config.ts` e `build.gradle` `applicationId`
3. Criar projeto Firebase > adicionar app Android com o ID definitivo > baixar `google-services.json`
4. Habilitar `minifyEnabled true`
5. `npx cap sync android`
6. `cd android && ./gradlew bundleRelease`
7. Assinar AAB com o keystore existente
8. Upload no Play Console > Internal testing > promover para Closed Testing com 12 testers

---

## Resumo de acoes por prioridade

### Bloqueadores (resolver antes de 06/07)

| # | Problema | Arquivo | Esforco |
|---|---|---|---|
| 1 | `icon-512.png` ausente | `public/` | 5 min — redimensionar icon-1024.png |
| 2 | `offline.html` ausente | `public/` | 10 min — criar arquivo |
| 3 | SW nao cacheia nada no install | `public/sw.js` | 5 min — adicionar install handler |
| 4 | App ID mismatch Capacitor/build.gradle | `capacitor.config.ts`, `build.gradle` | 15 min |
| 5 | `google-services.json` ausente | `android/app/` | 20 min — Firebase Console |

### Alta prioridade (antes do lançamento)

| # | Problema | Arquivo | Esforco |
|---|---|---|---|
| 6 | Touch targets abaixo de 44px (fechar, logout, entrar, cart) | `PWAInstallPrompt.tsx`, `(dashboard)/layout.tsx` | 15 min |
| 7 | `minifyEnabled false` no release build | `android/app/build.gradle` | 2 min |
| 8 | AAB nao gerado | — | 30 min build |
| 9 | Ficha da Play Store + screenshots | Play Console | 2-4h |
| 10 | 12 testers para closed testing | Play Console | acao de recrutamento |

### Pos-lançamento (melhoria)

| # | Problema |
|---|---|
| 11 | `purpose: maskable` ausente nos icons do manifest |
| 12 | `scope` e `lang` ausentes no manifest |
| 13 | `start_url` considerar `/` com `?utm_source=pwa` |
| 14 | Apple touch icon sem tamanho 180px dedicado |
| 15 | Imagens sem `width`/`height` explicitos (CLS) |

---

*Audit gerado por Mobile App Builder — Tech Churras, 2026-06-30*
