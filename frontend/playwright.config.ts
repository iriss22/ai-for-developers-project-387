import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Бэкенд и фронтенд поднимаются на свободных портах (не совпадающих с dev-портами
// 8080/5173 из vite.config.ts), чтобы e2e не конфликтовал с параллельным `mise run dev`.
const BACKEND_PORT = 8099
const FRONTEND_PORT = 4399

// Имя env-переменной, через которую vite.config.ts узнаёт порт бэкенда для preview.proxy
// (см. CALENDAR_API_PORT в frontend/vite.config.ts).
const BACKEND_PORT_ENV_VAR = 'CALENDAR_API_PORT'

// Jar ищется шелл-командой, а не на этапе загрузки конфига: конфиг импортируют и
// статические инструменты (knip) до того, как `mise run build:backend` соберёт jar,
// и падать на этом импорте нельзя — упасть можно только когда webServer реально стартует.
const BACKEND_TARGET_DIR = join(import.meta.dirname, '../backend/target')
const BACKEND_JAR_COMMAND = `jar=$(ls "${BACKEND_TARGET_DIR}"/*.jar 2>/dev/null | grep -v -- '-sources.jar$' | head -n1); if [ -z "$jar" ]; then echo "В ${BACKEND_TARGET_DIR} нет jar-файла. Соберите jar перед e2e (mise run build:backend)." >&2; exit 1; fi; exec java -jar "$jar"`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Собранный бэкенд на свободном порту с пустым in-memory хранилищем (свежий процесс).
      command: `sh -c '${BACKEND_JAR_COMMAND}'`,
      env: { SERVER_PORT: String(BACKEND_PORT) },
      url: `http://localhost:${BACKEND_PORT}/api/meeting-types`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Собранный фронтенд (vite preview), проксирующий /api на бэкенд выше (см. vite.config.ts).
      command: `npx vite preview --port ${FRONTEND_PORT} --strictPort`,
      env: { [BACKEND_PORT_ENV_VAR]: String(BACKEND_PORT) },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
