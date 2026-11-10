import { bookingsCreate, bookingsList } from './generated/sdk.gen.ts'
import type { Booking, NewBooking } from './generated/types.gen.ts'
import { unwrap } from './client.ts'

export type { Booking, NewBooking }

export function fetchBookings(): Promise<Booking[]> {
  return unwrap(bookingsList())
}

export function createBooking(payload: NewBooking): Promise<Booking> {
  return unwrap(bookingsCreate({ body: payload }))
}
