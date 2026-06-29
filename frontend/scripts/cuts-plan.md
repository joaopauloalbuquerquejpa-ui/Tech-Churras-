# Tech Churras — Plano de Corte Cinematográfico
**Vídeo fonte:** `techchurras_acougue_v3.mp4` (1080x1920, ~4min 11s)  
**Objetivo:** Peça de 55s para conversão de açougues parceiros  
**Formato:** Vertical 9:16 — Meta Reels, TikTok, Instagram Stories

---

## Análise do Source (25 frames analisados)

O vídeo é uma **única tomada contínua** de Jota no deck de Zanzibar, sem B-roll.  
A variação disponível para corte são os **momentos expressivos** do founder:

| Intervalo | O que aparece na imagem | Potencial |
|---|---|---|
| 0-10s | Jota sorrindo, badge Zanzibar + lower-third | ✅ GANCHO — rosto aberto, localização exótica |
| 20-30s | Perfil lateral, sério, gesticulando | contexto/problema |
| 50-60s | Dedo apontando para câmera | ✅ SOLUÇÃO — gesto de autoridade |
| 90-100s | Direto na câmera, inclinado para frente | credibilidade |
| 130-150s | Badge Tech Churras, expressão firme | ✅ MARCA — ancoragem |
| 190-200s | Polegar levantado / dedo indicando | prova/números |
| 220-230s | Sorriso, postura relaxada | amigável, CTA buildup |
| 240-246s | CTA final visível na tela | ✅ FECHAMENTO |

---

## Gancho Recomendado

**Opção escolhida: Opção 3**
> *"De R$ 369 por mês, açougues estão recebendo pedidos de churrasco direto no WhatsApp — sem precisar abrir nenhum app."*

**Por quê:** É o mais concreto (número + mecanismo), funciona sem som (85% dos Reels são assistidos mutados), e cria curiosidade imediata. Combina com o visual de Jota sorrindo nos primeiros segundos.

---

## Timeline — Corte de 55 Segundos

```
[HOOK COUNTER]  0:00 – 0:05   Hook animado (já no vídeo — contador R$0→3.779)

[GANCHO]        0:05 – 0:08   Jota sorrindo, olhando para câmera
  Texto:  "De R$ 369/mês seu açougue já faz parte"
  Visual: Frame 001 — rosto aberto, Zanzibar ao fundo

[CONTEXTO]      0:08 – 0:15   Jota gesticulando, sério
  Texto:  "Churrasqueiros profissionais precisam de cortes de qualidade"
  Texto:  "Mas não sabem onde encontrar um açougue confiável"
  Visual: Frame 003 — perfil lateral, expressão séria

[SOLUÇÃO]       0:15 – 0:28   Jota apontando para câmera
  Texto:  "O Tech Churras conecta você diretamente a eles"
  Texto:  "Pedidos chegam no seu painel — você só prepara os cortes"
  Visual: Frame 006 — dedo apontando (momento de autoridade)

[PROVA]         0:28 – 0:40   Jota inclinado para frente, direto na câmera
  Texto:  "R$ 15 bilhões em churrasco por ano no Brasil"
  Texto:  "Seu açougue pode ter uma fatia disso"
  Visual: Frame 010 — expressão engajada, postura de conversa

[NÚMEROS]       0:40 – 0:48   Polegar levantado / dedo indicando
  Texto:  "R$ 3.779 / mês em média por açougue parceiro"
  Visual: Frame 020 — gesto de afirmação

[CTA]           0:48 – 0:55   Jota sorrindo, CTA na tela
  Texto:  "Cadastre seu açougue agora"
  Texto:  "techchurras.com.br/para-acougues"
  Visual: Frame 023/025 — expressão amigável + CTA overlay
```

---

## Comandos FFmpeg — Extração dos Cortes Brutos

> **Nota:** Todos usam `techchurras_acougue_v3.mp4` como fonte.  
> O grade cinematográfico (orange/teal, grain, shadow lift) já está aplicado no v3.  
> Estes cortes são os **segmentos brutos para aprovação** — sem texto final.

```bash
FF="C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe"
SRC="C:\Users\DrButeko\Videos\bahari\output\techchurras_acougue_v3.mp4"
OUT="C:\Users\DrButeko\Videos\bahari\output\cuts_v3"
mkdir -p "$OUT"

# Segmento 1 — GANCHO (0s-8s do main, já pós-hook)
"$FF" -y -i "$SRC" -ss 5 -to 13 -c:v libx264 -crf 18 -c:a aac "$OUT/seg1_gancho.mp4"

# Segmento 2 — CONTEXTO/PROBLEMA (20s-30s)
"$FF" -y -i "$SRC" -ss 25 -to 35 -c:v libx264 -crf 18 -c:a aac "$OUT/seg2_contexto.mp4"

# Segmento 3 — SOLUÇÃO (50s-68s)
"$FF" -y -i "$SRC" -ss 55 -to 73 -c:v libx264 -crf 18 -c:a aac "$OUT/seg3_solucao.mp4"

# Segmento 4 — PROVA (90s-105s)
"$FF" -y -i "$SRC" -ss 95 -to 110 -c:v libx264 -crf 18 -c:a aac "$OUT/seg4_prova.mp4"

# Segmento 5 — NÚMEROS (190s-200s)
"$FF" -y -i "$SRC" -ss 195 -to 205 -c:v libx264 -crf 18 -c:a aac "$OUT/seg5_numeros.mp4"

# Segmento 6 — CTA (220s-231s)
"$FF" -y -i "$SRC" -ss 225 -to 236 -c:v libx264 -crf 18 -c:a aac "$OUT/seg6_cta.mp4"
```

---

## Tratamento Visual (já aplicado no v3)

| Parâmetro | v2 | v3 (novo) | Por quê |
|---|---|---|---|
| Shadow lift | ❌ preto puro | ✅ `colorlevels rimin=0.035` | Pretos cinematográficos |
| Grain | ❌ | ✅ `noise=alls=6:allf=t` | Textura analógica |
| Orange/teal push | parcial | ✅ `colorchannelmixer` mais forte | Look cinema contemporâneo |
| Vinheta | `PI/5` | ✅ `PI/4.2` (mais fechada) | Foco no rosto |
| Logo | 72px | ✅ 160px | Visibilidade mobile |
| Overlays | badges azuis | ✅ só laranja + lower-third limpo | Identidade TC |
| CTA box | `boxborderw=15` | ✅ `boxborderw=22` | Mais legível |

---

## Estrutura de Texto por Bloco (legendas de conversão)

### GANCHO (0:05–0:08)
```
De R$ 369/mes
seu acougue ja faz parte do Tech Churras
```
*Fonte grande, centralizada, aparece em 2 steps de 1.5s cada*

### CONTEXTO (0:08–0:15)
```
Churrasqueiros profissionais
precisam de cortes de qualidade
```
```
Mas nao sabem onde encontrar
um acougue confiavel
```
*2 cards, 3.5s cada*

### SOLUÇÃO (0:15–0:28)
```
O Tech Churras conecta voce diretamente a eles
```
```
Pedidos chegam no painel
voce so prepara os cortes
```
*2 cards com fade rápido*

### PROVA SOCIAL (0:28–0:40)
```
R$ 15 bilhoes em churrasco
por ano no Brasil
```
```
Seu acougue pode ter
uma fatia disso
```

### NÚMEROS (0:40–0:48)
```
R$ 3.779 / mes
em media por acougue parceiro
```
*Destaque em laranja, fonte maior*

### CTA (0:48–0:55)
```
Cadastre seu acougue agora
Vagas limitadas — Parceiro Fundador
```
```
techchurras.com.br/para-acougues
```

---

## O que Cortar Fora (trechos a evitar)

- **Silêncios longos entre frases** (verificar com o áudio transcrito)
- **Momentos de desvio do olhar** (olha para cima/lado por >2s)
- **Gestos muito amplos** que saem do frame vertical (braços abertos)
- **Repetições** — se o mesmo ponto é dito 2x, ficar com a versão mais energética
- **Trecho 110s–155s** — pelo padrão dos frames parece ser a parte mais longa/explicativa; candidato a corte agressivo no edit de 55s

---

## Próximos Passos (aguardando aprovação)

1. ✅ Aprovar este plano ou ajustar timestamps
2. ⏳ Você me passa a transcrição do áudio (CapCut → auto-legendas)  
   → Ajusto os textos para o que foi falado exatamente
3. ⏳ Executo os cortes e monto o concat final de 55s
4. ⏳ Gero versões para cada plataforma (Meta, TikTok, YouTube)

---
*Gerado em 22/06/2026 — Tech Churras Lançamento 07/07/2026*
