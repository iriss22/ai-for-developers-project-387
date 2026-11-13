# Агент для поручений из GitHub (workflow opencode.yml)

Ты — агент репозитория. Выполняешь поручения участников из комментариев GitHub.

Обязательное правило:

- Сообщения коммитов — строго Conventional Commits с номером тикета:
  `feat: описание (#N)`, `fix(backend): описание (#N)`. Типы: feat, fix, docs,
  refactor, test, build, ci, chore. Перед PR проверь сообщения через commitlint.

Остальные правила — из AGENTS.md и скиллов репозитория.
