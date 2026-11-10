import type { Page } from '@playwright/test'
import { OWNER_TIME_ZONE } from '../../src/ownerTime.ts'

export { OWNER_TIME_ZONE }

type DateParts = { year: number; month: number; day: number }

function ownerDateParts(date: Date): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: OWNER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string): number => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

// Сегодня в поясе владельца (должно совпадать с todayInOwnerZone из src/ownerTime.ts,
// на который опирается блок «Календарь»: его видимый месяц всегда начинается с сегодняшнего).
function ownerToday(): DateParts {
  return ownerDateParts(new Date())
}

// Дата через `daysAhead` дней от сегодня в поясе владельца — чтобы в тестах выбирать
// гарантированно свободный день внутри 14-дневного окна записи, не завязываясь на то,
// в какой момент дня (по UTC) реально запущен прогон.
export function ownerDateInDays(daysAhead: number): DateParts {
  return ownerDateParts(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000))
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// 'YYYY-MM-DD' — формат даты в API (GET /api/slots?date=...)
export function ymd(date: DateParts): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`
}

// 'dd.mm.yyyy' — формат даты, который видит владелец (formatDateRu/formatOwnerInterval)
export function dateRu(date: DateParts): string {
  return `${pad(date.day)}.${pad(date.month)}.${date.year}`
}

// Листает блок «Календарь» (aria-label="Календарь") до месяца нужной даты и кликает по дню.
// Видимый месяц при открытии шага календаря всегда совпадает с текущим (см. ownerToday),
// поэтому достаточно посчитать разницу в месяцах и нажать «Следующий месяц» нужное число раз.
export async function selectCalendarDate(page: Page, target: DateParts): Promise<void> {
  const today = ownerToday()
  const monthsAhead = (target.year - today.year) * 12 + (target.month - today.month)
  const calendar = page.getByRole('region', { name: 'Календарь' })
  for (let i = 0; i < monthsAhead; i += 1) {
    // Клики по «Следующий месяц» строго последовательны — месяц не выбрать иначе, чем по одному
    await calendar.getByRole('button', { name: 'Следующий месяц' }).click()
  }
  await calendar.getByRole('button', { name: String(target.day), exact: true }).click()
}
