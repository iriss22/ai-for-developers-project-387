# Правила для агентов

## Команды

Все инструменты и их версии ставит mise (`mise.toml`), задачи проекта тоже в нём (`mise tasks`).

```bash
mise install && mise run setup  # один раз: инструменты, npm-зависимости, git-хуки hk
mise run dev     # бэкенд :8080 и фронтенд :5173 параллельно
mise run check   # всё: генерация, линтеры, тесты, сборка, e2e — то же, что в CI
mise run fix     # автоисправления (Spotless, oxfmt, пробелы, Markdown)
mise run lint | test | build
mise run test:frontend | test:backend
mise run generate  # OpenAPI и SDK фронтенда из contract/main.tsp
mise run test:e2e  # Playwright против собранного jar
mise run audit   # OSV-Scanner, не входит в check
```

Один тест:

```bash
cd backend && ./mvnw -q test -Dtest=SlotsApiTest                     # класс
cd backend && ./mvnw -q test -Dtest='SlotsApiTest#unknown*'          # метод
cd frontend && npx vitest run src/App.test.tsx                     # файл
cd frontend && npx vitest run -t 'название теста'                  # по имени
```

## Правила

- Все проверки запускает `mise run check`. Изменение готово, только когда эта команда проходит. CI запускает её же.
- Автоисправления форматирования: `mise run fix`. Java форматирует Spotless (google-java-format), руками отступы не выравнивайте.
- Сообщения коммитов в формате Conventional Commits (`feat: …`, `fix(backend): …`). Их проверяют хук commit-msg и CI.
- Каждый коммит ссылается на тикет: указывайте номер тикета в сообщении коммита (например, `feat: добавить фильтр поиска (#386)`).
- Не отключайте правила линтеров, чтобы изменение прошло. Исключение допустимо только узкое (один путь и одно правило), с причиной в комментарии, и его согласует человек.
- `.github/workflows/hexlet-check.yml` генерирует Хекслет: не редактируйте и не удаляйте его.
- Источник правды для API — `contract/main.tsp`. Из него `mise run generate` выпускает:
  - `contract/openapi.yaml` — OpenAPI 3.1, коммитится;
  - `frontend/src/api/generated/` — клиентский SDK (`@hey-api/openapi-ts`), коммитится;
  - `backend/target/generated-sources/openapi/` — серверные интерфейсы и DTO Spring (`openapi-generator`, генератор `spring`, `interfaceOnly`), генерируются заново при каждой сборке Maven (`generate-sources`), в `target/` — не коммитятся.
  Все три пути — сгенерированный код: руками не правятся. Меняйте `contract/main.tsp` и перегенерируйте. `mise run check` повторяет генерацию и падает при расхождении с закоммиченным.

## Agent skills

### Issue tracker

Issues и спеки живут в GitHub Issues этого репозитория, операции — через `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Дефолтный словарь из пяти ролей: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` в корне репозитория. See `docs/agents/domain.md`.
