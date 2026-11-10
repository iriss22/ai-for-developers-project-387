// Сообщения серверных ошибок 400 для полей, у которых нет инпута в форме
// (например, start, meetingTypeId или request): их форма показывает общим сообщением
export function unshownFieldErrors(
  errors: Record<string, string>,
  shownFields: readonly string[],
): string[] {
  return Object.entries(errors)
    .filter(([field]) => !shownFields.includes(field))
    .map(([, message]) => message)
}
