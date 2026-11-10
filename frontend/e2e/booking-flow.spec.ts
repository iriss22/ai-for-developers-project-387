import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createMeetingTypeViaAdmin } from './support/adminMeetingType.ts'
import { gotoAdminFromHeader, gotoBookingWizardFromHeader } from './support/nav.ts'
import {
  dateRu,
  OWNER_TIME_ZONE,
  ownerDateInDays,
  selectCalendarDate,
} from './support/ownerCalendar.ts'

// Сквозной сценарий из README.md («Сценарий: от типа встречи до записи в списке владельца»,
// шаги 1–13) против собранного бэкенда и фронтенда, без подмены ответов API (docs/specification.md,
// «Тестирование», п. 3).
test('гость записывается на тип встречи, созданный владельцем, и запись видна в админке', async ({
  page,
}) => {
  const meetingTypeName = `E2E Интервью ${randomUUID().slice(0, 8)}`
  const guestName = 'Иван Петров'
  const guestEmail = 'ivan.petrov.e2e@example.com'
  const note = 'Проверка через Playwright'
  // «Завтра» в поясе владельца: точно внутри 14-дневного окна записи и без слотов,
  // уже занятых другими e2e-сценариями, запущенными на том же бэкенде.
  const date = ownerDateInDays(1)

  await test.step('Владелец создаёт тип встречи (шаги 1–3)', async () => {
    await page.goto('/')
    await gotoAdminFromHeader(page)
    await createMeetingTypeViaAdmin(page, {
      name: meetingTypeName,
      description: 'Техническое интервью',
      durationMinutes: 60,
    })
    await expect(page.getByText(meetingTypeName, { exact: true })).toBeVisible()
  })

  let slotTime = ''

  await test.step('Гость выбирает тип, дату и свободный слот (шаги 4–8)', async () => {
    await gotoBookingWizardFromHeader(page)
    await page.getByRole('button', { name: meetingTypeName }).click()

    await selectCalendarDate(page, date)
    await expect(page.getByText(dateRu(date))).toBeVisible()

    const slotsRegion = page.getByRole('region', { name: 'Статус слотов' })
    const freeSlot = slotsRegion.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
    slotTime = (await freeSlot.textContent())?.trim() ?? ''
    expect(slotTime).toMatch(/^\d{2}:\d{2}$/)
    await freeSlot.click()

    await expect(page.getByText(`${slotTime} (${OWNER_TIME_ZONE})`)).toBeVisible()
    await page.getByRole('button', { name: 'Продолжить' }).click()
  })

  await test.step('Гость заполняет форму и видит подтверждение (шаги 9–10)', async () => {
    await page.getByLabel('Имя').fill(guestName)
    await page.getByLabel('Email').fill(guestEmail)
    await page.getByLabel('Заметка').fill(note)
    await page.getByRole('button', { name: 'Забронировать' }).click()

    await expect(page.getByRole('heading', { name: 'Вы записаны' })).toBeVisible()
    await expect(page.getByText(meetingTypeName, { exact: true })).toBeVisible()
    await expect(page.getByText(dateRu(date))).toBeVisible()
    await expect(page.getByText(`${slotTime} (${OWNER_TIME_ZONE})`)).toBeVisible()
  })

  await test.step('Тот же слот у гостя теперь показан как «Занято» (шаг 11)', async () => {
    await gotoBookingWizardFromHeader(page)
    await page.getByRole('button', { name: meetingTypeName }).click()
    await selectCalendarDate(page, date)

    const takenSlot = page.getByRole('button', { name: `${slotTime} · Занято` })
    await expect(takenSlot).toBeVisible()
    await expect(takenSlot).toBeDisabled()
  })

  await test.step('Запись видна владельцу в «Предстоящих встречах» (шаг 13)', async () => {
    await gotoAdminFromHeader(page)
    await page.getByRole('tab', { name: 'Предстоящие встречи' }).click()

    const bookingCard = page.getByText(guestEmail, { exact: true }).locator('xpath=..')
    await expect(bookingCard.getByText(meetingTypeName, { exact: true })).toBeVisible()
    await expect(bookingCard.getByText(guestName, { exact: true })).toBeVisible()
    await expect(bookingCard.getByText(note, { exact: true })).toBeVisible()
    await expect(bookingCard.getByText(`${dateRu(date)}, ${slotTime}`)).toBeVisible()
  })
})
