import { timingSafeEqual } from 'crypto'

// Comparação de segredo (webhook secret, cron secret) resistente a timing
// attack. `!==` compara string char a char e retorna assim que acha a
// primeira diferença — o tempo de resposta vaza quantos caracteres do
// prefixo estão certos. timingSafeEqual exige buffers do mesmo tamanho,
// então trata tamanho diferente como "não bate" sem chamar (evita o throw).
export function safeCompare(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
