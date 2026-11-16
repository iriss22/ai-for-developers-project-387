#!/usr/bin/env bash
# Общий счётчик бюджета запусков модели OpenCode на issue/PR.
#
# Источник истины — история Actions: токен здесь только read-only
# (GH_TOKEN: ${{ github.token }}), installation token агента этот шаг не
# выполняет, поэтому агент не может переписать счётчик через PR-комментарии
# или другие записи в репозитории.
#
# В счёт бюджета идут все запуски workflow opencode.yml и opencode-review.yml
# по данному issue/PR, где модель реально вызывалась или прогон оборвался:
# conclusion success / failure / cancelled / timed_out. Re-run наращивает
# run_attempt у того же run — каждая попытка расходует бюджет, поэтому
# суммируем run_attempt, а не количество run.
#
# Привязка прогона к issue/PR: у pull_request-событий run знает свой PR
# (pull_requests[].number), у issue_comment — нет, поэтому opencode.yml
# ставит run-name с номером («oc #<n>»), и мы дополнительно ищем по имени.
# Issues и PR в GitHub делят одну нумерацию, так что совпадения номеров
# разных сущностей нет — один номер всегда одно issue или один PR.
#
# Аргументы: <issue-or-pr-number> <limit> <current-run-id>
# Вывод в GITHUB_OUTPUT: runs, limit, skip (true/false).

set -euo pipefail

number="$1"
limit="$2"
current_run_id="$3"

select_expr="(.conclusion == \"success\" or .conclusion == \"failure\" or .conclusion == \"cancelled\" or .conclusion == \"timed_out\")"

runs=0
for workflow in opencode.yml opencode-review.yml; do
  page=1
  total=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow/runs?per_page=1" --jq '.total_count')
  while :; do
    batch=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow/runs?per_page=100&page=$page" \
      --jq "[.workflow_runs[]
        | select(.id != $current_run_id
            and (any(.pull_requests[]; .number == $number)
                 # Точное имя: «oc #23» относится к #23, «oc #230» — нет
                 or .name == \"oc #$number\")
            and $select_expr)
        | .run_attempt] | add // 0")
    runs=$((runs + batch))
    if [ "$((page * 100))" -ge "$total" ]; then
      break
    fi
    page=$((page + 1))
  done
done

echo "runs=$runs" >> "$GITHUB_OUTPUT"
echo "limit=$limit" >> "$GITHUB_OUTPUT"
if [ "$runs" -ge "$limit" ]; then
  echo "skip=true" >> "$GITHUB_OUTPUT"
  echo "Бюджет запусков агента исчерпан ($runs >= $limit), модель не вызывается" >&2
else
  echo "skip=false" >> "$GITHUB_OUTPUT"
fi
