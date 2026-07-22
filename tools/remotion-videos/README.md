# Tech Churras — Vídeos por código (Remotion)

Vídeos gerados programaticamente a partir de dados reais (React + Remotion), em vez de editados manualmente. Complementa a pipeline FAL.ai + TTS + ffmpeg (`tools/gerar_video_lancamento.py`) — Remotion entra quando o vídeo é **repetitivo e data-driven** (ex.: um vídeo por avaliação de cliente), não para peças únicas/cinemáticas.

## Uso

```bash
npm install

# Editor visual — ajusta props (nome, nota, comentário) ao vivo no navegador
npm run dev

# Renderiza um MP4 real a partir de props
npx remotion render src/index.ts ReviewVideo out/nome-do-arquivo.mp4 \
  --props='{"clienteName":"Marina S.","cidade":"São Paulo","nota":5,"comentario":"Churrasco impecável!","grillmasterName":"Team Jota"}'
```

## Templates disponíveis

- **ReviewVideo** (`src/ReviewVideo.tsx`) — vídeo vertical (9:16, 6s) de avaliação 5 estrelas: estrelas animadas, comentário do cliente, nome do GM. Pronto para puxar dados reais de `Review` + `Order` via um script que chama `remotion render` com `--props` montado a partir do Prisma.

## Próximo passo (quando houver pedidos reais)

Escrever um script (`scripts/gerar-videos-avaliacao.ts`) que roda no cron, busca reviews novas com nota ≥ 4 e chama o render automaticamente — cada avaliação boa vira um post pronto, sem trabalho manual.
