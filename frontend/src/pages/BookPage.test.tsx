import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server.ts'
import { theme } from '../theme.ts'
import BookPage from './BookPage.tsx'

const INTERVIEW = {
  id: 1,
  name: 'Интервью',
  description: 'Техническое интервью',
  durationMinutes: 60,
}
const RESUME = { id: 2, name: 'Разбор резюме', description: null, durationMinutes: 30 }

function renderBook() {
  return render(
    <MantineProvider theme={theme}>
      <BookPage />
    </MantineProvider>,
  )
}

describe('Мастер записи: шаг 1 «Выберите тип события»', () => {
  it('показывает карточки типов встреч и ведёт на шаг календаря по клику', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW, RESUME])))
    renderBook()

    expect(await screen.findByRole('button', { name: /Интервью/ })).toBeInTheDocument()
    expect(screen.getByText('Техническое интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Разбор резюме/ })).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Интервью/ }))

    expect(await screen.findByText('Календарь')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Разбор резюме/ })).not.toBeInTheDocument()
  })

  it('показывает заглушку «Пока нет доступных встреч», когда типов нет, и не даёт пройти дальше', async () => {
    renderBook()

    expect(await screen.findByText('Пока нет доступных встреч')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Интервью/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Календарь')).not.toBeInTheDocument()
  })

  it('показывает индикатор загрузки, пока типы загружаются', async () => {
    server.use(
      http.get('/api/meeting-types', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    renderBook()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(await screen.findByText('Пока нет доступных встреч')).toBeInTheDocument()
  })

  it('показывает сообщение об ошибке с кнопкой «Повторить» и загружает типы повторно', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.error()))
    renderBook()

    expect(await screen.findByText('Не удалось загрузить типы встреч')).toBeInTheDocument()

    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW])))
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('button', { name: /Интервью/ })).toBeInTheDocument()
  })
})

describe('Мастер записи: шаг 2 — календарь и слоты', () => {
  beforeEach(() => {
    // «Сейчас» — 25.11.2026 09:00 по поясу владельца: окно записи 25.11–08.12
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T09:00:00+03:00'))
    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW])))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function goToCalendarStep() {
    renderBook()
    fireEvent.click(await screen.findByRole('button', { name: /Интервью/ }))
    await screen.findByText('Календарь')
  }

  it('приглушает дни вне окна записи и не даёт их выбрать', async () => {
    await goToCalendarStep()

    expect(screen.getByRole('button', { name: '24' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '25' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled()
  })

  it('листает стрелками только месяцы, пересекающие окно записи', async () => {
    await goToCalendarStep()

    expect(screen.getByText(/ноябрь 2026/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }))

    expect(screen.getByText(/декабрь 2026/i)).toBeInTheDocument()
    // Последний день окна — 8 декабря: день 8 доступен, день 9 — нет
    expect(screen.getByRole('button', { name: '8' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '9' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeEnabled()
  })

  it('держит «Продолжить» неактивной, пока не выбран слот, и показывает выбор с подписью пояса', async () => {
    server.use(
      http.get('/api/slots', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('meetingTypeId')).toBe('1')
        expect(url.searchParams.get('date')).toBe('2026-11-26')
        return HttpResponse.json([
          { start: '2026-11-26T09:00:00+03:00', status: 'free' },
          { start: '2026-11-26T09:15:00+03:00', status: 'busy' },
        ])
      }),
    )
    await goToCalendarStep()

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    const freeSlot = await screen.findByRole('button', { name: '09:00' })
    // Занятый слот виден с меткой «Занято» и выбрать его нельзя
    const busySlot = screen.getByRole('button', { name: '09:15 · Занято' })
    expect(busySlot).toBeDisabled()

    fireEvent.click(freeSlot)

    expect(screen.getByText('Выбранная дата')).toBeInTheDocument()
    expect(screen.getByText('26.11.2026')).toBeInTheDocument()
    expect(screen.getByText('Выбранное время')).toBeInTheDocument()
    expect(screen.getByText('09:00 (Europe/Moscow)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled()
  })

  it('показывает заглушку «Нет свободных слотов», когда на дату ничего нет', async () => {
    server.use(http.get('/api/slots', () => HttpResponse.json([])))
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    expect(await screen.findByText('Нет свободных слотов')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  })

  it('показывает все слоты с меткой «Занято», когда на дату всё занято', async () => {
    server.use(
      http.get('/api/slots', () =>
        HttpResponse.json([
          { start: '2026-11-26T09:00:00+03:00', status: 'busy' },
          { start: '2026-11-26T09:15:00+03:00', status: 'busy' },
        ]),
      ),
    )
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    expect(await screen.findByRole('button', { name: '09:00 · Занято' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '09:15 · Занято' })).toBeDisabled()
    expect(screen.queryByText('Нет свободных слотов')).not.toBeInTheDocument()
  })

  it('показывает ошибку загрузки слотов с кнопкой «Повторить»', async () => {
    server.use(http.get('/api/slots', () => HttpResponse.error()))
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    expect(await screen.findByText('Не удалось загрузить слоты')).toBeInTheDocument()

    server.use(
      http.get('/api/slots', () =>
        HttpResponse.json([{ start: '2026-11-26T09:00:00+03:00', status: 'free' }]),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('button', { name: '09:00' })).toBeInTheDocument()
  })

  it('ведёт кнопкой «Продолжить» на шаг формы с именем, email и заметкой', async () => {
    server.use(
      http.get('/api/slots', () =>
        HttpResponse.json([{ start: '2026-11-26T09:00:00+03:00', status: 'free' }]),
      ),
    )
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(await screen.findByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Заметка')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeEnabled()
  })
  it('возвращает кнопкой «Назад» к выбору типа события', async () => {
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))

    expect(await screen.findByRole('heading', { name: 'Выберите тип события' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Интервью/ })).toBeInTheDocument()
    expect(screen.queryByText('Календарь')).not.toBeInTheDocument()
  })
})

describe('Мастер записи: шаги 3–4 — форма и подтверждение', () => {
  const SLOT = '2026-11-26T09:00:00+03:00'

  beforeEach(() => {
    // «Сейчас» — 25.11.2026 09:00 по поясу владельца: окно записи 25.11–08.12
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T09:00:00+03:00'))
    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW])))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function goToFormStep() {
    server.use(http.get('/api/slots', () => HttpResponse.json([{ start: SLOT, status: 'free' }])))
    renderBook()
    fireEvent.click(await screen.findByRole('button', { name: /Интервью/ }))
    fireEvent.click(screen.getByRole('button', { name: '26' }))
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
    await screen.findByLabelText('Имя')
  }

  function fillForm(name: string, email: string, note = '') {
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: name } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
    fireEvent.change(screen.getByLabelText('Заметка'), { target: { value: note } })
  }

  it('возвращает кнопкой «Назад» с формы к выбору слота', async () => {
    await goToFormStep()

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))

    expect(await screen.findByText('Календарь')).toBeInTheDocument()
    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '09:00' })).toBeInTheDocument()
  })

  it('проводит гостя от формы до экрана подтверждения с названием, датой и временем', async () => {
    let capturedBody: unknown
    server.use(
      http.post('/api/bookings', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 7,
            start: SLOT,
            guestName: 'Иван Петров',
            guestEmail: 'ivan@example.com',
            note: 'Позвонить вовремя',
            meetingType: { id: 1, name: 'Интервью', durationMinutes: 60 },
          },
          { status: 201 },
        )
      }),
    )
    await goToFormStep()

    // На форме виден контекст записи
    expect(screen.getByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText(/26\.11\.2026/)).toBeInTheDocument()

    fillForm('Иван Петров', 'ivan@example.com', 'Позвонить вовремя')
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(await screen.findByText('Вы записаны')).toBeInTheDocument()
    expect(screen.getByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText(/26\.11\.2026/)).toBeInTheDocument()
    expect(screen.getByText(/09:00 \(Europe\/Moscow\)/)).toBeInTheDocument()

    expect(capturedBody).toEqual({
      meetingTypeId: 1,
      start: SLOT,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
      note: 'Позвонить вовремя',
    })
  })

  it('валидирует поля на клиенте при нажатии «Забронировать» и не отправляет запрос', async () => {
    let postCalled = false
    server.use(
      http.post('/api/bookings', () => {
        postCalled = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    await goToFormStep()

    fillForm('  ', 'не-почта', 'а'.repeat(1001))
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(screen.getByText('Введите корректный email')).toBeInTheDocument()
    expect(screen.getByText('Заметка не длиннее 1000 символов')).toBeInTheDocument()
    expect(postCalled).toBe(false)
  })

  it('показывает серверные ошибки 400 у тех же полей', async () => {
    server.use(
      http.post('/api/bookings', () =>
        HttpResponse.json({ errors: { guestEmail: 'Некорректный формат email' } }, { status: 400 }),
      ),
    )
    await goToFormStep()

    fillForm('Иван Петров', 'ivan@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(await screen.findByText('Некорректный формат email')).toBeInTheDocument()
    // Остаёмся на шаге формы
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
  })

  it('показывает серверные ошибки 400 без поля в форме общим сообщением', async () => {
    server.use(
      http.post('/api/bookings', () =>
        HttpResponse.json({ errors: { start: 'Это время уже прошло' } }, { status: 400 }),
      ),
    )
    await goToFormStep()

    fillForm('Иван Петров', 'ivan@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(await screen.findByText('Это время уже прошло')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
  })

  it('при ответе 409 показывает «Это время уже занято» и возвращает к слотам с обновлённым списком', async () => {
    let slotsRequests = 0
    server.use(
      http.get('/api/slots', () => {
        slotsRequests += 1
        // Повторная загрузка после гонки: слот 09:00 уже занят
        const firstStatus = slotsRequests === 1 ? 'free' : 'busy'
        return HttpResponse.json([
          { start: SLOT, status: firstStatus },
          { start: '2026-11-26T09:15:00+03:00', status: 'free' },
        ])
      }),
      http.post('/api/bookings', () =>
        HttpResponse.json({ message: 'Это время уже занято' }, { status: 409 }),
      ),
    )
    renderBook()
    fireEvent.click(await screen.findByRole('button', { name: /Интервью/ }))
    fireEvent.click(screen.getByRole('button', { name: '26' }))
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    fillForm('Иван Петров', 'ivan@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    // Возврат на шаг слотов с сообщением и повторным запросом слотов
    expect(await screen.findByText('Это время уже занято')).toBeInTheDocument()
    expect(screen.getByText('Календарь')).toBeInTheDocument()
    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()

    // Список слотов обновлён: слот 09:00 теперь показан как «Занято» и недоступен для выбора
    const busySlot = await screen.findByRole('button', { name: '09:00 · Занято' })
    expect(busySlot).toBeDisabled()
    expect(screen.getByRole('button', { name: '09:15' })).toBeEnabled()
    expect(slotsRequests).toBe(2)
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  })
})
