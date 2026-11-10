import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createMeetingTypeViaAdmin } from './support/adminMeetingType.ts'
import { gotoAdminFromHeader, gotoBookingWizardFromHeader } from './support/nav.ts'
import { ownerDateInDays, selectCalendarDate, ymd } from './support/ownerCalendar.ts'
import { slotTime as slotTimeOf } from '../src/ownerTime.ts'

type MeetingTypeDto = { id: number; name: string }
type SlotDto = { start: string; status: 'free' | 'busy' }

// Отдельный сценарий конфликта (docs/specification.md, «Тестирование», п. 3): слот занят
// прямым запросом к API, пока гость ещё на форме бронирования.
test('гость видит «Это время уже занято», когда слот заняли, пока он был на форме', async ({
  page,
}) => {
  const meetingTypeName = `E2E Конфликт ${randomUUID().slice(0, 8)}`
  // Другой день, чем в сценарии happy-path (booking-flow.spec.ts), хотя тип встречи и так свой:
  // так оба теста остаются независимыми даже при будущих изменениях сценариев.
  const date = ownerDateInDays(2)

  await page.goto('/')
  await gotoAdminFromHeader(page)
  await createMeetingTypeViaAdmin(page, { name: meetingTypeName, durationMinutes: 30 })

  await gotoBookingWizardFromHeader(page)
  await page.getByRole('button', { name: meetingTypeName }).click()
  await selectCalendarDate(page, date)

  const slotsRegion = page.getByRole('region', { name: 'Статус слотов' })
  const freeSlot = slotsRegion.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
  const slotTime = (await freeSlot.textContent())?.trim() ?? ''
  expect(slotTime).toMatch(/^\d{2}:\d{2}$/)
  await freeSlot.click()
  await page.getByRole('button', { name: 'Продолжить' }).click()

  // Гость заполняет форму, но пока не отправляет её
  await page.getByLabel('Имя').fill('Иван Петров')
  await page.getByLabel('Email').fill('ivan.petrov.e2e@example.com')

  // Гонка: слот бронируется прямым запросом к API, пока гость ещё на форме
  const typesResponse = await page.request.get('/api/meeting-types')
  const types: MeetingTypeDto[] = await typesResponse.json()
  const meetingType = types.find((type) => type.name === meetingTypeName)
  expect(meetingType).toBeDefined()

  const slotsResponse = await page.request.get(
    `/api/slots?meetingTypeId=${meetingType!.id}&date=${ymd(date)}`,
  )
  const slots: SlotDto[] = await slotsResponse.json()
  const takenSlot = slots.find((slot) => slotTimeOf(slot.start) === slotTime)
  expect(takenSlot).toBeDefined()

  const rivalBooking = await page.request.post('/api/bookings', {
    data: {
      meetingTypeId: meetingType!.id,
      start: takenSlot!.start,
      guestName: 'Соперник',
      guestEmail: 'rival.e2e@example.com',
    },
  })
  expect(rivalBooking.status()).toBe(201)

  // Гость отправляет форму — слот уже занят соперником
  await page.getByRole('button', { name: 'Забронировать' }).click()

  await expect(page.getByText('Это время уже занято')).toBeVisible()
  await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Имя')).not.toBeVisible()

  // Список слотов обновлён: тот же слот теперь показан как «Занято» и недоступен
  const nowTakenSlot = page.getByRole('button', { name: `${slotTime} · Занято` })
  await expect(nowTakenSlot).toBeVisible()
  await expect(nowTakenSlot).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
})
