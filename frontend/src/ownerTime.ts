// Часовой пояс владельца. ДОЛЖЕН совпадать с calendar.owner-timezone бэкенда
// (backend/src/main/resources/application.properties): в нём заданы границы дня и окно записи,
// гость видит время в нём же, конвертации нет.
export const OWNER_TIME_ZONE = 'Europe/Moscow'

// en-CA даёт дату в формате 'YYYY-MM-DD'
const ownerIsoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OWNER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayInOwnerZone(): string {
  return ownerIsoDateFormatter.format(new Date())
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// 'YYYY-MM-DD' → 'dd.mm.yyyy'
export function formatDateRu(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

// Время старта слота из ISO-строки с offset пояса владельца: '2026-11-26T09:00:00+03:00' → '09:00'
export function slotTime(start: string): string {
  return start.slice(11, 16)
}

const ownerDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const ownerTimeOnlyFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: OWNER_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

// Интервал записи в поясе владельца: конец = старт + длительность типа,
// например '10.11.2026, 09:00–09:30 (Europe/Moscow)'
export function formatOwnerInterval(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const date = ownerDateFormatter.format(start)
  const startTime = ownerTimeOnlyFormatter.format(start)
  const endTime = ownerTimeOnlyFormatter.format(end)
  return `${date}, ${startTime}–${endTime} (${OWNER_TIME_ZONE})`
}
