# Red/green-демонстрация тестов спецификации #6

**Код:** main после мержа PR #15 (`3174cffa`, squash `e0d207b`).
**Тест:** `frontend/src/pages/AdminPage.test.tsx` — сценарии спецификации #6.

## Red — нарушенное поведение

Локально изменена одна строка `UpcomingBookingsTab.tsx` ( НЕ коммитится):
`ownerDate > today` → `ownerDate >= today` — сегодняшние встречи дублируются в общем списке.

`npx vitest run src/pages/AdminPage.test.tsx` → **exit 1, 4 failed | 16 passed (20)**.
Падают сценарии спецификации: «не дублировать сегодняшние», «пустой список», «идущая встреча», «смешанный список». Полный вывод: `red-run.log`.

## Green — после исправления

`git checkout` строки (возврат `ownerDate > today`), повторный прогон того же файла → **exit 0, 20 passed (20)**. Полный вывод: `green-run.log`.
