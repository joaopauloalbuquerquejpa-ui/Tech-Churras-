export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) })
}
