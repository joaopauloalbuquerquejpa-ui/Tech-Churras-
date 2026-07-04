import * as Sentry from '@sentry/node'

// Erros de negócio são lançados como `new Error('mensagem pro usuário')` nos services.
// Qualquer outra classe (PrismaClientKnownRequestError, TypeError, AbortError, etc.)
// é falha de infra e precisa aparecer no Sentry — senão ficamos cegos em produção.
export function reportIfUnexpected(err: unknown): void {
  if (err instanceof Error && err.constructor === Error) return
  Sentry.captureException(err)
}
