import { Card, Stack, Text } from '@mantine/core'
import { fetchBookings } from '../../api/bookings.ts'
import { LoadError, Loading } from '../../components/LoadStatus.tsx'
import { formatOwnerInterval } from '../../ownerTime.ts'
import { useLoad } from '../../useLoad.ts'

function UpcomingBookingsTab() {
  const { state, retry } = useLoad(fetchBookings)

  if (state.status === 'loading') {
    return <Loading />
  }
  if (state.status === 'error') {
    return <LoadError title="Не удалось загрузить предстоящие встречи" onRetry={retry} />
  }
  if (state.data.length === 0) {
    return <Text c="dimmed">Предстоящих встреч нет</Text>
  }
  return (
    <Stack gap="sm">
      {state.data.map((booking) => (
        <Card key={booking.id} withBorder padding="md">
          <Text fw={600}>{booking.meetingType.name}</Text>
          <Text size="sm">
            {formatOwnerInterval(booking.start, booking.meetingType.durationMinutes)}
          </Text>
          <Text size="sm">{booking.guestName}</Text>
          <Text size="sm" c="dimmed">
            {booking.guestEmail}
          </Text>
          {booking.note && (
            <Text size="sm" c="dimmed">
              {booking.note}
            </Text>
          )}
        </Card>
      ))}
    </Stack>
  )
}

export default UpcomingBookingsTab
