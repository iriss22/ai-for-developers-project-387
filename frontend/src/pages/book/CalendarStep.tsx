import { Alert, Button, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { useCallback, useMemo } from 'react'
import { fetchSlots } from '../../api/slots.ts'
import type { MeetingType } from '../../api/meetingTypes.ts'
import { LoadError, Loading } from '../../components/LoadStatus.tsx'
import {
  addDays,
  formatDateRu,
  OWNER_TIME_ZONE,
  slotTime,
  todayInOwnerZone,
} from '../../ownerTime.ts'
import { useLoad } from '../../useLoad.ts'
import Calendar from './Calendar.tsx'

type SlotListProps = {
  meetingTypeId: number
  date: string
  selectedSlot: string | null
  onSelectSlot: (slot: string) => void
  reloadToken: number
}

function SlotList({ meetingTypeId, date, selectedSlot, onSelectSlot, reloadToken }: SlotListProps) {
  const load = useCallback(() => fetchSlots(meetingTypeId, date), [meetingTypeId, date])
  const { state, retry } = useLoad(load, reloadToken)

  if (state.status === 'loading') {
    return <Loading />
  }
  if (state.status === 'error') {
    return <LoadError title="Не удалось загрузить слоты" onRetry={retry} />
  }
  // Заглушка — только когда слотов нет вовсе; занятые слоты показываются с меткой «Занято»
  if (state.data.length === 0) {
    return <Text c="dimmed">Нет свободных слотов</Text>
  }
  return (
    <SimpleGrid cols={4} spacing="xs">
      {state.data.map((slot) =>
        slot.status === 'free' ? (
          <Button
            key={slot.start}
            size="compact-sm"
            variant={selectedSlot === slot.start ? 'filled' : 'light'}
            onClick={() => onSelectSlot(slot.start)}
          >
            {slotTime(slot.start)}
          </Button>
        ) : (
          // Занятый слот виден гостю с меткой «Занято», но недоступен для выбора
          <Button key={slot.start} size="compact-sm" variant="light" color="gray" disabled>
            {slotTime(slot.start)} · Занято
          </Button>
        ),
      )}
    </SimpleGrid>
  )
}

type CalendarStepProps = {
  meetingType: MeetingType
  selectedDate: string | null
  selectedSlot: string | null
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string) => void
  onContinue: () => void
  onBack: () => void
  // Увеличивается при возврате на шаг после гонки (409): слоты перезапрашиваются
  reloadToken: number
  // Показать сообщение о проигранной гонке за слот
  slotTaken: boolean
}

function CalendarStep({
  meetingType,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onContinue,
  onBack,
  reloadToken,
  slotTaken,
}: CalendarStepProps) {
  const windowStart = useMemo(() => todayInOwnerZone(), [])
  const windowEnd = useMemo(() => addDays(windowStart, 13), [windowStart])

  return (
    <Group align="flex-start" gap="lg" mt="md">
      <Card withBorder padding="md" w={280}>
        <Stack gap="xs">
          <Text fw={600}>{meetingType.name}</Text>
          <Text size="sm" c="dimmed">
            {meetingType.durationMinutes} мин
          </Text>
          <Text size="sm" fw={500} mt="sm">
            Выбранная дата
          </Text>
          <Text size="sm">{selectedDate ? formatDateRu(selectedDate) : '—'}</Text>
          <Text size="sm" fw={500}>
            Выбранное время
          </Text>
          <Text size="sm">
            {selectedSlot ? `${slotTime(selectedSlot)} (${OWNER_TIME_ZONE})` : '—'}
          </Text>
          {/* Кнопки друг под другом: в карточке шириной 280 px по две в ряд «Продолжить» обрезается (#25) */}
          <Stack mt="md" gap="xs">
            <Button fullWidth disabled={selectedSlot === null} onClick={onContinue}>
              Продолжить
            </Button>
            <Button fullWidth variant="default" onClick={onBack}>
              Назад
            </Button>
          </Stack>
        </Stack>
      </Card>
      <Stack gap="lg" style={{ flex: 1 }}>
        {slotTaken && <Alert color="orange" title="Это время уже занято" />}
        <section aria-label="Календарь">
          <Text fw={600} mb="xs">
            Календарь
          </Text>
          <Calendar
            windowStart={windowStart}
            windowEnd={windowEnd}
            selected={selectedDate}
            onSelect={onSelectDate}
          />
        </section>
        <section aria-label="Статус слотов">
          <Text fw={600} mb="xs">
            Статус слотов
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Часовой пояс владельца: {OWNER_TIME_ZONE}
          </Text>
          {selectedDate ? (
            <SlotList
              meetingTypeId={meetingType.id}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={onSelectSlot}
              reloadToken={reloadToken}
            />
          ) : (
            <Text c="dimmed">Выберите дату в календаре</Text>
          )}
        </section>
      </Stack>
    </Group>
  )
}

export default CalendarStep
