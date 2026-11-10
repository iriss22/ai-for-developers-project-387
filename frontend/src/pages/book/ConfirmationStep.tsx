import { Card, Stack, Text, Title } from '@mantine/core'
import type { Booking } from '../../api/bookings.ts'
import { formatDateRu, OWNER_TIME_ZONE, slotTime } from '../../ownerTime.ts'

type ConfirmationStepProps = {
  booking: Booking
}

function ConfirmationStep({ booking }: ConfirmationStepProps) {
  return (
    <Card withBorder padding="lg" maw={480}>
      <Stack gap="xs">
        <Title order={3}>Вы записаны</Title>
        <Text fw={600}>{booking.meetingType.name}</Text>
        <Text>
          {formatDateRu(booking.start.slice(0, 10))}, {slotTime(booking.start)} ({OWNER_TIME_ZONE})
        </Text>
      </Stack>
    </Card>
  )
}

export default ConfirmationStep
