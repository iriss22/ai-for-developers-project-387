#!/usr/bin/env bash
# Общий счётчик бюджета запусков модели OpenCode на issue/PR.
#
# Источник истины — история Actions: токен здесь только read-only
# (GH_TOKEN: ${{ github.token }}), installation token агента этот шаг не
# выполняет, поэтому агент не может переписать счётчик через комментарии
# или другие записи в репозитории.
#
# В счёт бюджета идут все запуски workflow opencode.yml и opencode-review.yml
# по данному issue/PR, где модель реально вызывалась или прогон оборвался:
# conclusion success / failure / cancelled / timed_out. Re-run наращивает
# run_attempt у того же run — каждая попытка расходует бюджет, поэтому
# суммируем run_attempt, а не количество run.
#
# Привязка прогона к issue/PR: у pull_request-событий run знает свой PR
# (pull_requests[].number). У issue_comment/pull_request_review_comment —
# нет (run-name с github.event не работает — выражение молча откатывается
# на имя workflow), поэтому opencode.yml кладёт артефакт oc-budget-<n>
# (шаг Record budget marker); для прогонов opencode.yml без прямой привязки
# проверяем артефакты отдельным запросом. Issues и PR в GitHub делят одну
# нумерацию — один номер всегда одно issue или один PR.
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
  total=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow/runs?per_page=1" | jq '.total_count')
  while :; do
    # Прогоны страницы: id, число попыток, есть ли прямая привязка к PR.
    while IFS= read -r row; do
      [ -z "$row" ] && continue
      run_id=${row%% *}
      rest=${row#* }
      attempts=${rest%% *}
      direct=${rest##* }
      if [ "$direct" = "true" ]; then
        runs=$((runs + attempts))
        continue
      fi
      # Без прямой привязки: opencode.yml маркирует прогоны артефактом.
      if [ "$workflow" = "opencode.yml" ] \
        && gh api "repos/$GITHUB_REPOSITORY/actions/runs/$run_id/artifacts?per_page=100" \
          | jq -r '.artifacts[].name' | grep -qx "oc-budget-$number"; then
        runs=$((runs + attempts))
      fi
    done < <(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow/runs?per_page=100&page=$page" \
      | jq -r "[.workflow_runs[]
          | select(.id != $current_run_id and $select_expr)
          | \"\(.id) \(.run_attempt) \(any(.pull_requests[]; .number == $number))\"
        ] | .[]")
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
