import { Alert, Button, Group, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client.ts'
import { createBooking, type Booking } from '../../api/bookings.ts'
import type { MeetingType } from '../../api/meetingTypes.ts'
import { unshownFieldErrors } from '../../formErrors.ts'
import { formatDateRu, OWNER_TIME_ZONE, slotTime } from '../../ownerTime.ts'

type GuestFormStepProps = {
  meetingType: MeetingType
  // ISO-строка старта выбранного слота с offset пояса владельца
  start: string
  onBooked: (booking: Booking) => void
  onConflict: () => void
  onBack: () => void
}

// Правило — из contract/main.tsp (guestEmail в NewBooking): local@domain.tld без пробелов.
// Проверка на клиенте — для мгновенной подсказки; серверная (из того же контракта) — источник правды.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_FIELDS = ['guestName', 'guestEmail', 'note'] as const

function GuestFormStep({ meetingType, start, onBooked, onConflict, onBack }: GuestFormStepProps) {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState(false)

  const validate = (): Record<string, string> => {
    const fieldErrors: Record<string, string> = {}
    if (!guestName.trim()) {
      fieldErrors.guestName = 'Введите имя'
    } else if (guestName.trim().length > 100) {
      fieldErrors.guestName = 'Имя не длиннее 100 символов'
    }
    if (!EMAIL_PATTERN.test(guestEmail.trim())) {
      fieldErrors.guestEmail = 'Введите корректный email'
    }
    if (note.length > 1000) {
      fieldErrors.note = 'Заметка не длиннее 1000 символов'
    }
    return fieldErrors
  }

  const generalErrors = unshownFieldErrors(errors, FORM_FIELDS)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(false)
    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) {
      return
    }
    createBooking({
      meetingTypeId: meetingType.id,
      start,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      note: note || undefined,
    })
      .then(onBooked)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 400) {
          setErrors(error.fieldErrors)
        } else if (error instanceof ApiError && error.status === 409) {
          onConflict()
        } else {
          setSubmitError(true)
        }
      })
  }

  return (
    <Stack gap="md" maw={480}>
      <Stack gap={4}>
        <Text fw={600}>{meetingType.name}</Text>
        <Text size="sm" c="dimmed">
          {formatDateRu(start.slice(0, 10))}, {slotTime(start)} ({OWNER_TIME_ZONE})
        </Text>
      </Stack>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Имя"
            value={guestName}
            onChange={(event) => setGuestName(event.currentTarget.value)}
            error={errors.guestName}
          />
          <TextInput
            label="Email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.currentTarget.value)}
            error={errors.guestEmail}
          />
          <Textarea
            label="Заметка"
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            error={errors.note}
          />
          {(submitError || generalErrors.length > 0) && (
            <Alert color="red" title="Не удалось забронировать время">
              {generalErrors.join(' ')}
            </Alert>
          )}
          <Group>
            <Button variant="default" onClick={onBack}>
              Назад
            </Button>
            <Button type="submit">Забронировать</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}

export default GuestFormStep
