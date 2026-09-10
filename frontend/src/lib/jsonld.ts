/**
 * JSON.stringify não escapa "<", então um nome de usuário (GM/açougue, texto
 * livre e self-service) contendo "</script><script>..." fecha a tag
 * application/ld+json e injeta script executável — XSS armazenado em
 * qualquer página que renderiza JSON-LD com dado de usuário.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
