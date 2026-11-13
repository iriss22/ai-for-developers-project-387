# Календарь звонков (продолжение)

[![hexlet-check](https://github.com/iriss22/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/iriss22/ai-for-developers-project-387/actions)

Интегрируйте работу агентов в GitHub проект

Сервис для бронирования календаря, разработанный совместно с ИИ.

Учебный проект Хекслета: <https://ru.hexlet.io/programs/ai-for-developers>
Как это должно работать: <https://files.hexlet.app/a/2ipc5m>

## Исходная спецификация и решения

Приложение перенесено из [проекта 386](https://github.com/iriss22/ai-for-developers-project-386). Текущие задачи ведутся в [трекере проекта 387](https://github.com/iriss22/ai-for-developers-project-387/issues).

- Спецификация MVP: [локальная копия](docs/specification.md), [исходная спецификация](https://github.com/iriss22/ai-for-developers-project-386/blob/main/docs/specification.md).
- [Карта решений и обсуждения первого проекта](https://github.com/iriss22/ai-for-developers-project-386/issues/1). Номера тикетов в исходной спецификации относятся к проекту 386.
- Словарь: [локальная копия](GLOSSARY.md), [исходный словарь](https://github.com/iriss22/ai-for-developers-project-386/blob/main/GLOSSARY.md).
- Хранение в памяти: [ADR-0001](docs/adr/0001-in-memory-storage.md), [исходное решение](https://github.com/iriss22/ai-for-developers-project-386/blob/main/docs/adr/0001-in-memory-storage.md).
- Границы MVP: [ADR-0002](docs/adr/0002-mvp-scope-single-owner-no-auth.md), [исходное решение](https://github.com/iriss22/ai-for-developers-project-386/blob/main/docs/adr/0002-mvp-scope-single-owner-no-auth.md).

## Стек

**Бэкенд** (`backend/`):

- Java 25
- Spring Boot 4.1 (Spring Web MVC, Validation, Actuator, DevTools)
- Maven (через Maven Wrapper `mvnw`)
- JUnit 5, MockMvc

**Фронтенд** (`frontend/`):

- TypeScript, React 19
- Vite (dev-сервер и сборка)
- Mantine (UI-компоненты)
- Vitest, React Testing Library, jsdom (тесты)

**Тулчейн и проверки качества** (подобраны по [dev-quality-gates](https://github.com/mokevnin/dev-quality-gates)):

| Инструмент | Что проверяет | Конфиг |
|---|---|---|
| [mise](https://mise.jdx.dev) | версии Java, Node и всех инструментов, задачи проекта | `mise.toml` |
| [hk](https://hk.jdx.dev) | запуск проверок в git-хуках и в CI | `hk.pkl` |
| Spotless (google-java-format) | форматирование Java: стиль Google, отступ 2 пробела | `backend/pom.xml` |
| Checkstyle | стиль Java-кода | `backend/config/checkstyle/checkstyle.xml` |
| Error Prone | баг-паттерны Java при компиляции | `backend/pom.xml` |
| oxlint | линтер TypeScript/React | `frontend/.oxlintrc.json` |
| oxfmt | форматирование TypeScript/JSON | `frontend/.oxfmtrc.json` |
| tsc | проверка типов | `frontend/tsconfig*.json` |
| Knip | неиспользуемые файлы, экспорты и зависимости фронтенда | — |
| Betterleaks | секреты в коде | — |
| typos | опечатки в коде и документации | — |
| rumdl | Markdown | `.rumdl.toml` |
| jactionlint, ShellCheck | GitHub Actions workflows | — |
| commitlint | сообщения коммитов в формате [Conventional Commits](https://www.conventionalcommits.org/ru/) | `.commitlintrc.json` |
| Renovate | раз в неделю открывает PR с обновлениями зависимостей и инструментов | `renovate.json` |
| [OSV-Scanner](https://google.github.io/osv-scanner/) | известные уязвимости в зависимостях (раз в неделю и при их изменении) | `.github/workflows/osv.yml` |

## Установка

Нужны только [mise](https://mise.jdx.dev/getting-started.html) и git. Java, Node.js и все линтеры mise поставит сам нужных версий.

```bash
git clone https://github.com/iriss22/ai-for-developers-project-387.git
cd ai-for-developers-project-387

mise trust      # разрешить mise читать mise.toml этого проекта
mise install    # Java, Node.js, hk и линтеры
mise run setup  # npm-зависимости (корень и фронтенд) и git-хуки
```

Переменные окружения пока не нужны. Настройки бэкенда лежат в `backend/src/main/resources/application.properties`.

## Использование

Основные команды (полный список — `mise tasks`):

```bash
mise run dev     # бэкенд :8080 и фронтенд :5173 параллельно, Ctrl+C останавливает оба
mise run check   # все проверки: линтеры, типы, тесты, сборка
mise run fix     # безопасные автоисправления: форматирование, пробелы, Markdown
mise run lint    # только линтеры
mise run test    # только тесты
mise run build   # production-сборка фронтенда и jar бэкенда
mise run audit   # известные уязвимости в зависимостях (OSV-Scanner)
```

Фронтенд открывается на <http://localhost:5173>. Vite проксирует запросы `/api/*` на бэкенд `http://localhost:8080`, поэтому из кода фронтенда достаточно писать `fetch('/api/...')`, CORS настраивать не нужно.

Проверка бэкенда:

```bash
curl http://localhost:8080/actuator/health
# {"groups":["liveness","readiness"],"status":"UP"}
```

Собранный jar запускается так:

```bash
java -jar backend/target/calendar-0.0.1-SNAPSHOT.jar
```

### Где запускаются проверки

- **pre-commit** — быстрые проверки изменённых файлов: секреты, опечатки, Markdown, workflows, Spotless, oxfmt и oxlint. Форматирование исправляется автоматически.
- **commit-msg** — commitlint проверяет сообщение коммита: `тип: описание`, например `feat: добавить выбор слота` или `fix(backend): …`. Типы: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` и другие из Conventional Commits.
- **pre-push** — проверки целиком тех частей проекта, которых касается push: типы и Knip на фронтенде, Checkstyle и Error Prone на бэкенде.
- **CI** (`.github/workflows/ci.yml`) — на каждый push проверяет сообщения новых коммитов и выполняет `mise run check`, ту же команду, что и локально. Хук можно пропустить, CI — нет.
- **По расписанию** (`.github/workflows/osv.yml`) — раз в неделю, а также при изменении `pom.xml` или lockfile'ов, `mise run audit` ищет известные уязвимости в зависимостях. В `check` эта проверка не входит: новые уязвимости появляются без изменений в коде и не должны блокировать несвязанную работу.

### Агент OpenCode в Issues и PR

Workflow [`.github/workflows/opencode.yml`](.github/workflows/opencode.yml) запускает OpenCode по комментариям с командой `/oc` или `/opencode` — в issues и в review-комментариях PR. Назначение — отвечать на вопросы и выполнять небольшие поручения участников прямо из трекера.

- **События**: только создание комментария (`issue_comment` и `pull_request_review_comment`, оба `types: [created]`). Редактирование и удаление комментариев не запускают агента.
- **Кто может запустить**: только комментарий участника с `author_association` OWNER, MEMBER или COLLABORATOR. Команды ботов и посторонних (например, из fork) игнорируются и до секретов не доходят.
- **Модель**: `moonshotai/kimi-k3.1-pro` через `MOONSHOT_API_KEY` из GitHub Secrets. Это единственная из доступных ключу моделей дешевле альтернативы (`kimi-k3`); более дешёвые модели на free-тарифе platform.kimi.ai закрыты (см. [#4](https://github.com/iriss22/ai-for-developers-project-387/issues/4)).
- **Авторизация**: доступ к репозиторию даёт installation token GitHub App `opencode-agent` через обмен OIDC-токена (`id-token: write`); у `GITHUB_TOKEN` только `contents: read`, у checkout `persist-credentials: false`.
- **Ограничения**: тайм-аут 30 минут, одна задача за раз (`concurrency` на issue/PR, без отмены текущего прогона).
- **Share**: публичный доступ к сессиям OpenCode не включается (параметр `share` не задан, по умолчанию выключен) — ответы видны только в комментариях GitHub.
- **Результаты**: агент отвечает комментарием в той же ветке, вместе со ссылкой на прогон в Actions.
- **Контекст на раннере**: агент получает репозиторий со скиллами первого проекта из `.agents/skills/` (triage, implement, code-review, research и другие) и настройками GitHub Issues из `docs/agents/` — трекер (`gh` CLI, `iriss22/ai-for-developers-project-387`), словарь из пяти triage-меток (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), доменные документы (`GLOSSARY.md`, `docs/adr/`). Полный список скиллов — в каталоге `.agents/skills/`.

Workflow [`.github/workflows/opencode-triage.yml`](.github/workflows/opencode-triage.yml) автоматически триажит новые обращения: OpenCode по скиллу `triage` ставит одну triage-метку и оставляет краткий комментарий с категорией, обоснованием и следующим шагом.

- **События**: только открытие и повторное открытие issue (`issues`, `types: [opened, reopened]`).
- **Фильтры**: созданные ботами и уже затриаженные обращения — с любой из меток `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` — пропускаются условием job, до запуска OpenCode и доступа к секретам.
- **Права**: `issues: write` для установки меток и комментирования, `id-token: write` для обмена OIDC-токена на installation token GitHub App, `contents: read` для чтения репозитория.
- **Ограничения**: тайм-аут 15 минут, отдельная `concurrency`-группа на issue; новый прогон отменяет незавершённый предыдущий для того же обращения (`cancel-in-progress: true`).

Workflow [`.github/workflows/opencode-review.yml`](.github/workflows/opencode-review.yml) запускает независимое авторевью каждого pull request: OpenCode оценивает дифф по критериям из [REVIEW.md](REVIEW.md) и оставляет один обобщающий комментарий с вердиктом `approve` или `changes requested`.

- **События**: открытие, повторное открытие, обновление ветки и снятие черновика (`pull_request`, `types: [opened, reopened, synchronize, ready_for_review]`).
- **Критерии**: четыре раздела [REVIEW.md](REVIEW.md) — соответствие задаче, качество кода, тесты, безопасность и риски. Ревьюер не дублирует замечания CI и оценивает то, что автопроверки не видят.
- **Фильтры**: PR от ботов (release-please, Renovate) пропускаются условием job, до запуска OpenCode и доступа к секретам.
- **Права**: `pull-requests: write` для чтения PR и итогового комментария, `id-token: write` для обмена OIDC-токена на installation token GitHub App, `contents: read` для чтения репозитория. Код и настройки агент не меняет.
- **Ограничения**: тайм-аут 30 минут; `concurrency`-группа на PR с `cancel-in-progress: true` — новый пуш в ветку отменяет устаревшее незавершённое ревью, ветка ревьюируется только по последнему диффу.
- **Блокировка мерджа**: ревьюер выставляет на head-коммит статусный чек `opencode-review` (`success` при approve, `failure` при changes requested). Чек нужно добавить в требуемые проверки защиты ветки (`Settings → Branches → require status checks`): тогда мердж без завершённого ревью невозможен. Шаг `Ensure review status exists` ставит чеку `error`, если агент не выставил статус (упал, не успел за тайм-аут), — отсутствие ревью тоже блокирует.
- **Предел запусков**: модель вызывается максимум 3 раза на PR — шаг `Check review run limit` считает предыдущие прогоны workflow по этому PR через GitHub API до запуска OpenCode. При исчерпании лимита модель не вызывается, а чек получает `success` с пояснением «Лимит запусков авторевью на PR исчерпан», чтобы защита ветки не блокировала мердж бесконечно из-за частых пушей.

Шаблон PR — [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md): при открытии PR предлагает заполнить «Проверки», «Риск» и «Откат»; незаполненные разделы авторевью отмечает замечанием по критерию 4.

Отличие агента из `opencode.yml` от локального агента (Claude Code/OpenCode в терминале): workflow-агент работает только по команде в комментарии, на раннере GitHub, с правами GitHub App и скиллами из `.agents/skills/`; локальный агент работает в рабочей копии разработчика.

## Деплой

Приложение развёрнуто на Render: <https://calendar-byst.onrender.com>

Один Docker-образ (`Dockerfile`) содержит и бэкенд, и собранный фронтенд: Spring Boot отдаёт API под `/api` и статику. Сервис описан в Blueprint `render.yaml`. Render пересобирает и выкатывает его на каждый push в ветку, указанную в настройках Blueprint.

### Ограничения

- **Данные не сохраняются.** Типы встреч и бронирования лежат в памяти процесса (`InMemory*Repository`), базы данных нет. Всё созданное пропадает при каждом деплое, перезапуске и засыпании сервиса.
- **Сервис засыпает.** На бесплатном тарифе Render останавливает сервис примерно через 15 минут без запросов. Первый запрос после этого ждёт запуска до минуты, а данные, как сказано выше, к этому моменту уже сброшены.

### Подключение MCP-сервера Render

MCP-сервер Render позволяет ИИ-агенту (например, Claude Code) создавать сервисы, смотреть деплои, логи и метрики. Он уже описан в `.mcp.json`, а ключ берётся из переменной окружения `RENDER_API_KEY`. Сам ключ в репозиторий не попадает.

1. В [дашборде Render](https://dashboard.render.com) откройте **Account Settings → API Keys** и создайте ключ.
2. Задайте переменную в профиле своей оболочки (`~/.zshrc`, `~/.bashrc`), а не в файлах проекта:

   ```bash
   export RENDER_API_KEY=<ваш ключ>
   ```

3. Откройте новый терминал и перезапустите Claude Code из корня репозитория. При первом запуске подтвердите использование MCP-сервера из `.mcp.json`.
4. Проверьте подключение командой `/mcp`: сервер `render` должен быть в статусе connected. После этого агент видит workspace Render, к которому относится ключ.

Ключ даёт полный доступ к аккаунту Render. Не коммитьте его и не вставляйте в чат. Если ключ утёк, удалите его в **API Keys** и создайте новый.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.

## Сценарий: от типа встречи до записи в списке владельца

Владелец создаёт тип встречи

1. Нажимает «Админка» в шапке.
2. Нажимает «Создать событие». Заполняет поля: название и описание, выбирает длительность. Нажимает «Сохранить».
3. Новый тип появляется в списке типов в админке.

Гость записывается

4. На главной странице нажимает «Записаться» (или «Записаться» в шапке).
5. На экране «Выберите тип события» нажимает на карточку с нужной встречей.
6. В блоке «Календарь» выбирает дату. Доступны только дни из окна записи (14 дней с 9 до 18), переключать месяцы можно кнопками ← и →. В карточке слева в поле «Выбранная дата» появится дата.
7. В блоке «Статус слотов» выбирает свободный слот. Слоты со статусом «Занято» выбрать нельзя. В поле «Выбранное время» появится выбранное время.
8. Нажимает «Продолжить». Пока время не выбрано, кнопка неактивна.
9. На шаге подтверждения вводит имя, email и, если нужно, заметку. Нажимает «Забронировать».
10. Видит экран подтверждения: Название, дата и время встречи.

Проверка занятости

11. Гость снова нажимает «Записаться» и выбирает дату, выбранный слот теперь показан как «Занято».
12. Затем выбирает «Встреча 30 минут» на ту же дату. Слоты, которые пересекаются, тоже помечены «Занято».

Владелец видит запись

13. Нажимает «Админка» и открывает список предстоящих встреч. Там есть строка: с забронированной встречей, имя и email гостя.
