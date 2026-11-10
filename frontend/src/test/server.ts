import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Тестовый шов на границе fetch('/api/...'): по умолчанию хранилище пустое,
// отдельные тесты переопределяют обработчики через server.use(...)
const defaultHandlers = [
  http.get('/api/meeting-types', () => HttpResponse.json([])),
  http.get('/api/bookings', () => HttpResponse.json([])),
]

export const server = setupServer(...defaultHandlers)
