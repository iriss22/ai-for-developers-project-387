import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-10T08:00:00+03:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function booking(id: number, start: string, name: string, guestName: string) {
    return {
      id,
      start,
      guestName,
      guestEmail: `guest${id}@example.com`,
      note: null,
      meetingType: { id, name, durationMinutes: 30 },
    }
  }

  async function openUpcomingTab() {
    renderAdmin()
    fireEvent.click(await screen.findByRole('tab', { name: 'Предстоящие встречи' }))
  }

  it('показывает только заглушку, когда предстоящих встреч нет', async () => {
    await openUpcomingTab()

    expect(await screen.findByText('Предстоящих встреч нет')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Сегодня' })).not.toBeInTheDocument()
    expect(screen.queryByText(/ближайшая встреча/)).not.toBeInTheDocument()
  })

  it('показывает записи только на сегодня в отдельном блоке без заголовка и общей заглушки', async () => {
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          booking(1, '2026-11-10T09:00:00+03:00', 'Интервью', 'Гость утра'),
          booking(2, '2026-11-10T11:00:00+03:00', 'Разбор резюме', 'Гость дня'),
        ]),
      ),
    )
    await openUpcomingTab()

    const today = await screen.findByRole('region', { name: 'Сегодня' })
    expect(within(today).getByText('Интервью')).toBeInTheDocument()
    expect(within(today).getByText('Разбор резюме')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Сегодня' })).not.toBeInTheDocument()
    expect(screen.queryByText('Предстоящих встреч нет')).not.toBeInTheDocument()
    expect(screen.queryByText(/На сегодня встреч нет/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Встречи начиная с завтра' }),
    ).not.toBeInTheDocument()
  })

  it('показывает идущую сейчас запись вместе с будущими записями сегодня', async () => {
    vi.setSystemTime(new Date('2026-11-10T10:15:00+03:00'))
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          booking(1, '2026-11-10T10:00:00+03:00', 'Идущая встреча', 'Текущий гость'),
          booking(2, '2026-11-10T11:00:00+03:00', 'Следующая встреча', 'Следующий гость'),
        ]),
      ),
    )
    await openUpcomingTab()

    const today = await screen.findByRole('region', { name: 'Сегодня' })
    expect(within(today).getByText('Идущая встреча')).toBeInTheDocument()
    expect(within(today).getByText('Следующая встреча')).toBeInTheDocument()
    expect(screen.queryByText(/На сегодня встреч нет/)).not.toBeInTheDocument()
  })

  it('разделяет сегодняшние и будущие записи без дублей и сохраняет их порядок', async () => {
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          booking(1, '2026-11-10T09:00:00+03:00', 'Сегодня рано', 'Гость сегодня рано'),
          booking(2, '2026-11-10T10:00:00+03:00', 'Сегодня позже', 'Гость сегодня позже'),
          booking(3, '2026-11-11T09:00:00+03:00', 'Завтра', 'Гость завтра'),
          booking(4, '2026-11-12T09:00:00+03:00', 'Послезавтра', 'Гость послезавтра'),
        ]),
      ),
    )
    await openUpcomingTab()

    const today = await screen.findByRole('region', { name: 'Сегодня' })
    const future = screen.getByRole('region', { name: 'Встречи начиная с завтра' })
    expect(
      within(today)
        .getAllByText(/^Гость /)
        .map((node) => node.textContent),
    ).toEqual(['Гость сегодня рано', 'Гость сегодня позже'])
    expect(
      within(future)
        .getAllByText(/^Гость /)
        .map((node) => node.textContent),
    ).toEqual(['Гость завтра', 'Гость послезавтра'])
    expect(screen.getAllByText('Сегодня рано')).toHaveLength(1)
    expect(screen.getAllByText('Сегодня позже')).toHaveLength(1)
  })

  it.each([
    {
      start: '2026-11-11T09:00:00+03:00',
      message: 'На сегодня встреч нет, ближайшая встреча через 1 день',
    },
    {
      start: '2026-11-12T09:00:00+03:00',
      message: 'На сегодня встреч нет, ближайшая встреча через 2 дня',
    },
    {
      start: '2026-11-15T09:00:00+03:00',
      message: 'На сегодня встреч нет, ближайшая встреча через 5 дней',
    },
    {
      start: '2026-11-21T09:00:00+03:00',
      message: 'На сегодня встреч нет, ближайшая встреча через 11 дней',
    },
  ])(
    'показывает сообщение с корректной формой числительного: $message',
    async ({ start, message }) => {
      server.use(
        http.get('/api/bookings', () =>
          HttpResponse.json([booking(1, start, 'Будущая встреча', 'Будущий гость')]),
        ),
      )
      await openUpcomingTab()

      expect(await screen.findByText(message)).toBeInTheDocument()
      const future = screen.getByRole('region', { name: 'Встречи начиная с завтра' })
      expect(within(future).getByText('Будущая встреча')).toBeInTheDocument()
      expect(screen.queryByText('Предстоящих встреч нет')).not.toBeInTheDocument()
    },
  )

  it('считает дни до ближайшей из нескольких будущих записей', async () => {
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          booking(1, '2026-11-12T09:00:00+03:00', 'Ближайшая', 'Первый гость'),
          booking(2, '2026-11-15T09:00:00+03:00', 'Более поздняя', 'Второй гость'),
        ]),
      ),
    )
    await openUpcomingTab()

    expect(
      await screen.findByText('На сегодня встреч нет, ближайшая встреча через 2 дня'),
    ).toBeInTheDocument()
  })

  it('считает календарные даты у границы суток, а не полные сутки', async () => {
    vi.setSystemTime(new Date('2026-11-10T23:30:00+03:00'))
    server.use(
      http.get('/api/bookings', () =>
        HttpResponse.json([
          booking(1, '2026-11-11T00:15:00+03:00', 'После полуночи', 'Ночной гость'),
        ]),
      ),
    )
    await openUpcomingTab()

    expect(
      await screen.findByText('На сегодня встреч нет, ближайшая встреча через 1 день'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/через 0 дней/)).not.toBeInTheDocument()
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
