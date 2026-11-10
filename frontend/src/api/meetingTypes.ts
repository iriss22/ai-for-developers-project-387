import { meetingTypesCreate, meetingTypesList } from './generated/sdk.gen.ts'
import type { MeetingType, NewMeetingType } from './generated/types.gen.ts'
import { unwrap } from './client.ts'

export type { MeetingType, NewMeetingType }

export function fetchMeetingTypes(): Promise<MeetingType[]> {
  return unwrap(meetingTypesList())
}

export function createMeetingType(payload: NewMeetingType): Promise<MeetingType> {
  return unwrap(meetingTypesCreate({ body: payload }))
}
