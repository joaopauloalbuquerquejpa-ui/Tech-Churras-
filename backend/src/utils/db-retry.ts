// Retry pra transacoes Serializable do Postgres que abortam por conflito de
// concorrencia real (SQLSTATE 40001) — isso NAO e um bug, e o Postgres fazendo
// exatamente o que Serializable promete (forcar uma das transacoes concorrentes
// a falhar em vez de deixar as duas lerem "disponivel" e criarem dados conflitantes).
// Sem retry, o cliente via um erro 500 generico num caso que na pratica so precisa
// tentar de novo.
function isSerializationFailure(err: any): boolean {
  return err?.code === '40001' || err?.meta?.code === '40001' || /could not serialize access/i.test(err?.message ?? '')
}

export async function withSerializableRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isSerializationFailure(err) || attempt === maxAttempts) throw err
      // pequeno jitter pra nao sincronizar retries das duas transacoes que colidiram
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
    }
  }
  throw lastErr
}
