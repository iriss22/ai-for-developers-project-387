import { slotsList } from './generated/sdk.gen.ts'
import type { Slot } from './generated/types.gen.ts'
import { unwrap } from './client.ts'

export type { Slot }

export function fetchSlots(meetingTypeId: number, date: string): Promise<Slot[]> {
  return unwrap(slotsList({ query: { meetingTypeId, date } }))
}
