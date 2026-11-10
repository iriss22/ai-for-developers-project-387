# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Проект

Учебный проект Хекслета «Календарь звонков»: сервис бронирования встреч. Монорепозиторий из двух приложений: `backend/` (Java 25, Spring Boot 4.1, Maven Wrapper, пакет `io.hexlet.calendar`) и `frontend/` (React 19, TypeScript, Vite, Mantine, Vitest). Сейчас это каркас: целевой пользовательский сценарий (типы событий в админке, выбор слота гостем, проверка занятости, список встреч владельца) описан в конце `README.md`, и на него ориентируются автотесты Хекслета.

## Архитектура и связки, которые неочевидны

- **Фронтенд ↔ бэкенд.** В dev Vite проксирует `/api/*` на `http://localhost:8080` (`frontend/vite.config.ts`), поэтому фронтенд вызывает `fetch('/api/...')` без CORS. Новые REST-эндпоинты бэкенда размещайте под `/api`, иначе прокси их не увидит.
- **Проверки (`hk.pkl`)** делятся на три уровня: `pre-commit` — быстрые шаги по изменённым файлам (betterleaks, typos, rumdl, jactionlint, oxfmt, oxlint, Spotless) с автоисправлением; `pre-push` — медленные шаги целиком (tsc, Knip, Checkstyle, Error Prone); `check` — всё вместе. Новый шаг добавляйте в нужную группу `fast`/`slow` в `hk.pkl`.
- **Бэкенд-линтеры:** Spotless/google-java-format (отступ 2, строка до 100), Checkstyle (`backend/config/checkstyle/checkstyle.xml`), Error Prone при компиляции. google-java-format закреплён на 1.36.1: 1.37+ не работает с текущим Spotless.
- **Фронтенд-линтеры:** oxlint с `--deny-warnings`, oxfmt (одинарные кавычки, без `;`), `tsc -b`, Knip — неиспользуемые файлы/экспорты/зависимости тоже ломают проверку.
- **Maven-шаги в `check` идут последовательно**, потому что пишут в общий `backend/target/`.
- **commitlint** ставится через корневой `package.json` (только инструменты репозитория, не код приложения).
- При добавлении нового lockfile впишите его в задачу `audit` в `mise.toml`; при обновлении hk версия меняется и в `mise.toml`, и в URL в `hk.pkl`.
