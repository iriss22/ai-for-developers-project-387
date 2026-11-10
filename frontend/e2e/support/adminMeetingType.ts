import type { Page } from '@playwright/test'

type NewMeetingType = {
  name: string
  description?: string
  durationMinutes: 15 | 30 | 60
}

// Шаги 1–3 сценария из README: владелец на /admin создаёт тип встречи через форму
// «Создать событие» и ждёт, пока он появится в списке типов.
export async function createMeetingTypeViaAdmin(
  page: Page,
  { name, description, durationMinutes }: NewMeetingType,
): Promise<void> {
  await page.getByRole('button', { name: 'Создать событие' }).click()
  await page.getByLabel('Название').fill(name)
  if (description) {
    await page.getByLabel('Описание').fill(description)
  }
  await page.getByRole('radio', { name: `${durationMinutes} минут` }).check()
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await page.getByText(name, { exact: true }).waitFor()
}
