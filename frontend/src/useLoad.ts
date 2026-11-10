import { useCallback, useEffect, useState } from 'react'

type LoadState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

type Settled<T> = {
  load: () => Promise<T>
  reloadKey: unknown
  attempt: number
  state: LoadState<T>
}

// Загрузка данных с состояниями «загрузка / ошибка / готово» и повтором.
// Запрос повторяется при смене load (передавайте стабильную функцию или useCallback),
// при смене reloadKey и по retry(). Пока не пришёл ответ на текущий запрос — 'loading';
// ответ устаревшего запроса отбрасывается.
export function useLoad<T>(load: () => Promise<T>, reloadKey?: unknown) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    const settle = (state: LoadState<T>) => {
      if (!cancelled) {
        setSettled({ load, reloadKey, attempt, state })
      }
    }
    load().then(
      (data) => settle({ status: 'ready', data }),
      () => settle({ status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [load, reloadKey, attempt])

  const isCurrent =
    settled !== null &&
    settled.load === load &&
    settled.reloadKey === reloadKey &&
    settled.attempt === attempt
  const state: LoadState<T> = isCurrent ? settled.state : { status: 'loading' }

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  // Локальное изменение загруженных данных (например, добавить созданный элемент)
  const update = useCallback((change: (data: T) => T) => {
    setSettled((prev) =>
      prev?.state.status === 'ready'
        ? { ...prev, state: { status: 'ready', data: change(prev.state.data) } }
        : prev,
    )
  }, [])

  return { state, retry, update }
}
