import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server.ts'
import { theme } from '../theme.ts'
import AdminPage from './AdminPage.tsx'

function renderAdmin() {
  return render(
    <MantineProvider theme={theme}>
      <AdminPage />
    </MantineProvider>,
  )
}

describe('Админка: вкладка «Типы встреч»', () => {
  it('показывает заглушку, когда типов встреч нет', async () => {
    renderAdmin()

    expect(await screen.findByText('Пока нет типов встреч')).toBeInTheDocument()
  })

  it('показывает список типов встреч с названием, описанием и длительностью', async () => {
    server.use(
      http.get('/api/meeting-types', () =>
        HttpResponse.json([
          { id: 1, name: 'Интервью', description: 'Техническое интервью', durationMinutes: 60 },
          { id: 2, name: 'Разбор резюме', description: null, durationMinutes: 30 },
        ]),
      ),
    )
    renderAdmin()

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText('Техническое интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(screen.getByText('Разбор резюме')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('показывает индикатор загрузки, пока список загружается', async () => {
    server.use(
      http.get('/api/meeting-types', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    renderAdmin()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(await screen.findByText('Пока нет типов встреч')).toBeInTheDocument()
  })

  it('показывает сообщение об ошибке с кнопкой «Повторить» и загружает список повторно', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.error()))
    renderAdmin()

    expect(await screen.findByText('Не удалось загрузить типы встреч')).toBeInTheDocument()

    server.use(
      http.get('/api/meeting-types', () =>
        HttpResponse.json([{ id: 1, name: 'Интервью', description: null, durationMinutes: 60 }]),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
  })

  it('создаёт тип встречи через форму по кнопке «Создать событие»', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/meeting-types', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          { id: 1, name: 'Интервью', description: 'Техническое интервью', durationMinutes: 60 },
          { status: 201 },
        )
      }),
    )
    renderAdmin()

    fireEvent.click(await screen.findByRole('button', { name: 'Создать событие' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Название' }), {
      target: { value: 'Интервью' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), {
      target: { value: 'Техническое интервью' },
    })
    fireEvent.click(screen.getByRole('radio', { name: '60 минут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(requestBody).toEqual({
      name: 'Интервью',
      description: 'Техническое интервью',
      durationMinutes: 60,
    })
  })

  it('показывает серверную ошибку валидации у поля «Название»', async () => {
    server.use(
      http.post('/api/meeting-types', () =>
        HttpResponse.json(
          { errors: { name: 'Тип встречи с таким названием уже существует' } },
          { status: 400 },
        ),
      ),
    )
    renderAdmin()

    fireEvent.click(await screen.findByRole('button', { name: 'Создать событие' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Название' }), {
      target: { value: 'Интервью' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(
      await screen.findByText('Тип встречи с таким названием уже существует'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Название' })).toBeInTheDocument()
  })

  it('показывает серверную ошибку 400 без поля в форме общим сообщением', async () => {
    server.use(
      http.post('/api/meeting-types', () =>
        HttpResponse.json({ errors: { request: 'Некорректное значение' } }, { status: 400 }),
      ),
    )
    renderAdmin()

    fireEvent.click(await screen.findByRole('button', { name: 'Создать событие' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Название' }), {
      target: { value: 'Интервью' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Некорректное значение')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Название' })).toBeInTheDocument()
  })
})

describe('Админка: вкладка «Предстоящие встречи»', () => {
  async function openUpcomingTab() {
    renderAdmin()
    fireEvent.click(await screen.findByRole('tab', { name: 'Предстоящие встречи' }))
  }

  it('показывает заглушку, когда предстоящих встреч нет', async () => {
    await openUpcomingTab()

    expect(await screen.findByText('Предстоящих встреч нет')).toBeInTheDocument()
  })

  it('показывает список записей с типом, интервалом в поясе владельца, гостем и заметкой', async () => {
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          {
            id: 1,
            start: '2026-11-10T09:00:00+03:00',
            guestName: 'Иван Петров',
            guestEmail: 'ivan@example.com',
            note: 'Подготовить резюме',
            meetingType: { id: 1, name: 'Интервью', durationMinutes: 30 },
          },
          {
            id: 2,
            start: '2026-11-12T14:30:00+03:00',
            guestName: 'Мария Сидорова',
            guestEmail: 'maria@example.com',
            note: null,
            meetingType: { id: 2, name: 'Разбор резюме', durationMinutes: 60 },
          },
        ]),
      ),
    )
    await openUpcomingTab()

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText('10.11.2026, 09:00–09:30 (Europe/Moscow)')).toBeInTheDocument()
    expect(screen.getByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('Подготовить резюме')).toBeInTheDocument()
    expect(screen.getByText('Разбор резюме')).toBeInTheDocument()
    expect(screen.getByText('12.11.2026, 14:30–15:30 (Europe/Moscow)')).toBeInTheDocument()
    expect(screen.getByText('Мария Сидорова')).toBeInTheDocument()
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
  })

  it('показывает индикатор загрузки, пока список загружается', async () => {
    server.use(
      http.get('/api/bookings', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    await openUpcomingTab()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(await screen.findByText('Предстоящих встреч нет')).toBeInTheDocument()
  })

  it('показывает сообщение об ошибке с кнопкой «Повторить» и загружает список повторно', async () => {
    server.use(http.get('/api/bookings', () => HttpResponse.error()))
    await openUpcomingTab()

    expect(await screen.findByText('Не удалось загрузить предстоящие встречи')).toBeInTheDocument()

    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          {
            id: 1,
            start: '2026-11-10T09:00:00+03:00',
            guestName: 'Иван Петров',
            guestEmail: 'ivan@example.com',
            note: null,
            meetingType: { id: 1, name: 'Интервью', durationMinutes: 30 },
          },
        ]),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Иван Петров')).toBeInTheDocument()
  })
})
