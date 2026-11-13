import { Card, Stack, Text, Title } from '@mantine/core'
import { fetchBookings } from '../../api/bookings.ts'
import type { Booking } from '../../api/bookings.ts'
import { LoadError, Loading } from '../../components/LoadStatus.tsx'
import {
  calendarDaysBetween,
  dateInOwnerZone,
  formatOwnerInterval,
  todayInOwnerZone,
} from '../../ownerTime.ts'
import { useLoad } from '../../useLoad.ts'

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card withBorder padding="md">
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
  )
}

function formatDayCount(days: number): string {
  const lastTwoDigits = days % 100
  const lastDigit = days % 10
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${days} дней`
  }
  if (lastDigit === 1) {
    return `${days} день`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${days} дня`
  }
  return `${days} дней`
}

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

  const today = todayInOwnerZone()
  const bookings = state.data.map((booking) => ({
    booking,
    ownerDate: dateInOwnerZone(new Date(booking.start)),
  }))
  const todayBookings = bookings.filter(({ ownerDate }) => ownerDate === today)
  const futureBookings = bookings.filter(({ ownerDate }) => ownerDate > today)
  const nearestBooking = todayBookings.length === 0 ? futureBookings.at(0) : undefined
  const daysToNearest = nearestBooking ? calendarDaysBetween(today, nearestBooking.ownerDate) : null

  return (
    <Stack gap="md">
      <Stack component="section" aria-label="Сегодня" gap="sm">
        <Title order={3}>Сегодня</Title>
        {todayBookings.length === 0 ? (
          <Text c="dimmed">
            {daysToNearest === null
              ? 'На сегодня встреч нет'
              : `На сегодня встреч нет, ближайшая встреча через ${formatDayCount(daysToNearest)}`}
          </Text>
        ) : (
          todayBookings.map(({ booking }) => <BookingCard key={booking.id} booking={booking} />)
        )}
      </Stack>
      {futureBookings.length > 0 && (
        <Stack component="section" aria-label="Встречи начиная с завтра" gap="sm">
          {futureBookings.map(({ booking }) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export default UpcomingBookingsTab
