import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { server } from './test/server.ts'
import { theme } from './theme.ts'

function renderApp(initialPath = '/') {
  return render(
    <MantineProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('Главная страница', () => {
  it('показывает название сервиса, описание и кнопку записи', () => {
    renderApp()

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByText(/без переписки/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Записаться' }).length).toBeGreaterThan(0)
  })

  it('ведёт на /book по кнопке «Записаться»', () => {
    renderApp()

    fireEvent.click(screen.getAllByRole('link', { name: 'Записаться' })[0])

    expect(screen.getByRole('heading', { name: 'Запись на встречу' })).toBeInTheDocument()
  })

  it('ведёт на /admin по кнопке «Админка»', () => {
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Админка' }))

    expect(screen.getByRole('heading', { name: 'Админка' })).toBeInTheDocument()
  })
})

describe('Шапка: «Записаться» на странице записи', () => {
  const SLOT = '2026-11-26T09:00:00+03:00'

  beforeEach(() => {
    // «Сейчас» — 25.11.2026 09:00 по поясу владельца: окно записи 25.11–08.12
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T09:00:00+03:00'))
    server.use(
      http.get('/api/meeting-types', () =>
        HttpResponse.json([{ id: 1, name: 'Интервью', description: null, durationMinutes: 60 }]),
      ),
      http.get('/api/slots', () => HttpResponse.json([{ start: SLOT, status: 'free' }])),
      http.post('/api/bookings', () =>
        HttpResponse.json(
          {
            id: 7,
            start: SLOT,
            guestName: 'Иван Петров',
            guestEmail: 'ivan@example.com',
            note: null,
            meetingType: { id: 1, name: 'Интервью', durationMinutes: 60 },
          },
          { status: 201 },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('после подтверждения записи начинает мастер заново с выбора типа события', async () => {
    renderApp('/book')

    fireEvent.click(await screen.findByRole('button', { name: /Интервью/ }))
    fireEvent.click(screen.getByRole('button', { name: '26' }))
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
    fireEvent.change(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))
    expect(await screen.findByText('Вы записаны')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Записаться' }))

    expect(await screen.findByRole('heading', { name: 'Выберите тип события' })).toBeInTheDocument()
    expect(screen.queryByText('Вы записаны')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Интервью/ })).toBeInTheDocument()
  })
})
