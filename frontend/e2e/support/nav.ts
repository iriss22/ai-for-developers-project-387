import type { Page } from '@playwright/test'

// Шапка (AppShell.Header) рендерит «Админка»/«Записаться» как ссылки (react-router Link),
// а не кнопки — и «Записаться» повторяется на главной странице в основном контенте,
// поэтому переход по шапке нужно явно отличать от клика по карточке/кнопке на странице.
function header(page: Page) {
  return page.getByRole('banner')
}

export async function gotoAdminFromHeader(page: Page): Promise<void> {
  await header(page).getByRole('link', { name: 'Админка' }).click()
}

export async function gotoBookingWizardFromHeader(page: Page): Promise<void> {
  await header(page).getByRole('link', { name: 'Записаться' }).click()
}
