import { ActionIcon, Button, Group, SimpleGrid, Text } from '@mantine/core'
import { useState } from 'react'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

type CalendarProps = {
  // Границы окна записи ('YYYY-MM-DD'), включительно
  windowStart: string
  windowEnd: string
  selected: string | null
  onSelect: (date: string) => void
}

function Calendar({ windowStart, windowEnd, selected, onSelect }: CalendarProps) {
  const [startYear, startMonth] = windowStart.split('-').map(Number)
  const [endYear, endMonth] = windowEnd.split('-').map(Number)
  const [view, setView] = useState({ year: startYear, month: startMonth })

  const atFirstMonth = view.year === startYear && view.month === startMonth
  const atLastMonth = view.year === endYear && view.month === endMonth

  const shiftMonth = (delta: number) => {
    setView((prev) => {
      const shifted = new Date(Date.UTC(prev.year, prev.month - 1 + delta, 1))
      return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 }
    })
  }

  const monthLabel = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(view.year, view.month - 1, 1)))

  // Неделя начинается с понедельника
  const leadingBlanks = (new Date(Date.UTC(view.year, view.month - 1, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate()

  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <ActionIcon
          aria-label="Предыдущий месяц"
          variant="subtle"
          disabled={atFirstMonth}
          onClick={() => shiftMonth(-1)}
        >
          ←
        </ActionIcon>
        <Text fw={600}>{monthLabel}</Text>
        <ActionIcon
          aria-label="Следующий месяц"
          variant="subtle"
          disabled={atLastMonth}
          onClick={() => shiftMonth(1)}
        >
          →
        </ActionIcon>
      </Group>
      <SimpleGrid cols={7} spacing={4}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} size="xs" c="dimmed" ta="center">
            {weekday}
          </Text>
        ))}
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const date = `${view.year}-${pad(view.month)}-${pad(day)}`
          const inWindow = date >= windowStart && date <= windowEnd
          return (
            <Button
              key={date}
              size="compact-sm"
              variant={selected === date ? 'filled' : 'subtle'}
              c={inWindow ? undefined : 'dimmed'}
              disabled={!inWindow}
              onClick={() => onSelect(date)}
            >
              {day}
            </Button>
          )
        })}
      </SimpleGrid>
    </div>
  )
}

export default Calendar
