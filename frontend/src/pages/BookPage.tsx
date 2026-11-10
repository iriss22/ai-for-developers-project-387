import { Card, Container, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useCallback, useState, type ReactNode } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../api/meetingTypes.ts'
import type { Booking } from '../api/bookings.ts'
import { LoadError, Loading } from '../components/LoadStatus.tsx'
import { useLoad } from '../useLoad.ts'
import CalendarStep from './book/CalendarStep.tsx'
import ConfirmationStep from './book/ConfirmationStep.tsx'
import GuestFormStep from './book/GuestFormStep.tsx'

type Step = 'types' | 'slots' | 'form' | 'confirmation'

function BookPage() {
  const { state: typesState, retry } = useLoad(fetchMeetingTypes)
  const [step, setStep] = useState<Step>('types')
  const [selectedType, setSelectedType] = useState<MeetingType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsReloadToken, setSlotsReloadToken] = useState(0)
  const [slotTaken, setSlotTaken] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)

  const selectType = useCallback((type: MeetingType) => {
    setSelectedType(type)
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlotTaken(false)
    setStep('slots')
  }, [])

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlotTaken(false)
  }, [])

  const selectSlot = useCallback((slot: string) => {
    setSelectedSlot(slot)
    setSlotTaken(false)
  }, [])

  // Гонка за слот проиграна (409): возврат к выбору слота с обновлённым списком
  const handleConflict = useCallback(() => {
    setSelectedSlot(null)
    setSlotTaken(true)
    setSlotsReloadToken((token) => token + 1)
    setStep('slots')
  }, [])

  const handleBooked = useCallback((created: Booking) => {
    setBooking(created)
    setStep('confirmation')
  }, [])

  let content: ReactNode
  if (step === 'confirmation' && booking) {
    content = <ConfirmationStep booking={booking} />
  } else if (step === 'form' && selectedType && selectedSlot) {
    content = (
      <GuestFormStep
        meetingType={selectedType}
        start={selectedSlot}
        onBooked={handleBooked}
        onConflict={handleConflict}
        onBack={() => setStep('slots')}
      />
    )
  } else if (step === 'slots' && selectedType) {
    content = (
      <CalendarStep
        meetingType={selectedType}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSelectDate={selectDate}
        onSelectSlot={selectSlot}
        onContinue={() => setStep('form')}
        onBack={() => setStep('types')}
        reloadToken={slotsReloadToken}
        slotTaken={slotTaken}
      />
    )
  } else if (typesState.status === 'loading') {
    content = <Loading />
  } else if (typesState.status === 'error') {
    content = <LoadError title="Не удалось загрузить типы встреч" onRetry={retry} />
  } else if (typesState.data.length === 0) {
    content = <Text c="dimmed">Пока нет доступных встреч</Text>
  } else {
    content = (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {typesState.data.map((type) => (
          <UnstyledButton key={type.id} onClick={() => selectType(type)}>
            <Card withBorder padding="md" h="100%">
              <Text fw={600}>{type.name}</Text>
              {type.description && (
                <Text c="dimmed" size="sm">
                  {type.description}
                </Text>
              )}
              <Text size="sm">{type.durationMinutes} мин</Text>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2}>Запись на встречу</Title>
      {step === 'types' && (
        <Title order={3} mt="md">
          Выберите тип события
        </Title>
      )}
      <Stack gap="md" mt="md">
        {content}
      </Stack>
    </Container>
  )
}

export default BookPage
