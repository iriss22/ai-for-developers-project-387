import { client } from './generated/client.gen.ts'

// Сгенерированный клиент строит Request явно (new Request(url)), а не вызывает fetch(url) —
// без абсолютного baseUrl это не резолвится в jsdom (и не во всех средах). В dev и проде
// запрос всё равно остаётся на том же origin, поэтому proxy /api (vite.config.ts) видит его как раньше.
client.setConfig({ baseUrl: window.location.origin })

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, fieldErrors: Record<string, string> = {}) {
    super(`Запрос завершился со статусом ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type FieldsResult<TData> = { data?: TData; error?: unknown; response?: Response }

function fieldErrorsOf(error: unknown): Record<string, string> {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const errors = (error as { errors?: unknown }).errors
    return errors && typeof errors === 'object' ? (errors as Record<string, string>) : {}
  }
  return {}
}

// Разворачивает результат вызова сгенерированного SDK (@hey-api/openapi-ts, клиент
// client-fetch, см. mise run generate): при ошибке — ApiError со статусом ответа и, для 400,
// ошибками полей из тела {"errors": {...}} (contract/main.tsp, модель ValidationErrorResponse)
export async function unwrap<TData>(call: Promise<FieldsResult<TData>>): Promise<TData> {
  const { data, error, response } = await call
  if (error === undefined) {
    // SDK гарантирует: data определено ровно тогда, когда error не определено
    return data as TData
  }
  const status = response?.status ?? 0
  const fieldErrors = status === 400 ? fieldErrorsOf(error) : {}
  throw new ApiError(status, fieldErrors)
}
