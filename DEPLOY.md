# Tech Churras — Guia de Deploy

## Android (Google Play)

### Keystore de assinatura
- **Localização:** `C:\projetos\tech-churras\techchurras.keystore`
- **Alias:** `techchurras`
- **Validade:** 10.000 dias (~27 anos)
- **Senhas:** guardadas em `frontend/android/.keystore-info.txt` (local, gitignored)

> ⚠️ NUNCA commite o arquivo `.keystore` ou `keystore.properties` no git.
> Se perder o keystore, não será possível publicar atualizações do app na Play Store.
> Faça backup em local seguro (ex: pen drive criptografado, 1Password).

### Gerar novo AAB (Android App Bundle)

1. Abra o Android Studio
2. Abra o projeto: `C:\projetos\tech-churras\frontend\android\`
3. Aguarde o Gradle sync terminar
4. Menu: **Build → Generate Signed App Bundle / APK**
5. Selecione: **Android App Bundle**
6. Key store path: `C:\projetos\tech-churras\techchurras.keystore`
7. Alias: `techchurras`
8. Build Variant: **release**
9. AAB gerado em: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

### Upload no Google Play Console

1. Acesse: [play.google.com/console](https://play.google.com/console)
2. Conta ID: `8304366789103710767`
3. App: Tech Churras (`com.techchurras.app`)
4. Menu lateral: **Produção → Criar novo lançamento** (ou Testes internos)
5. Upload do arquivo `app-release.aab`
6. Preencher notas de versão
7. Salvar → Revisar → Lançar

---

## Web (Vercel)

### Deploy automático
Push para `master` no GitHub dispara o deploy automático na Vercel.

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin master
```

### Deploy manual (se o webhook falhar)
```bash
cd frontend
npx vercel --prod --yes
```

### Variáveis de ambiente necessárias (Vercel Dashboard)
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `CRON_SECRET`

---

## Backend (Railway)

Deploy automático via push para `master`. O Railway roda na inicialização:
```
prisma db push --accept-data-loss && node dist/server.js
```

Para mudanças no schema do Prisma, o `db push` aplica automaticamente no boot.
