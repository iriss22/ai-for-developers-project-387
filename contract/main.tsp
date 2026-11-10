import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using Http;
using Rest;
using OpenAPI;

/**
 * Календарь звонков: контракт API.
 *
 * Источник правды — этот файл (см. docs/specification.md, разделы «API» и
 * «Контракт и генерация»). Код на бэкенде и фронтенде описывает то же самое
 * API руками ровно там, где генератор не дотягивает (см. ADR в docs/adr/ и
 * AGENTS.md о запрете ручной правки сгенерированных файлов) — но форма
 * запросов, ответов и ошибок всегда выводится из этого контракта.
 *
 * Термины — по GLOSSARY.md: Владелец, Гость, Тип встречи, Запись, Слот, Окно записи.
 */
@service(#{ title: "Календарь звонков" })
namespace CalendarApi;

// ---------- Общие тела ошибок (раздел «Коды ошибок» спецификации) ----------

/** 400 — ошибки валидации: карта «поле → сообщение». */
@error
model ValidationErrorResponse {
  @statusCode statusCode: 400;
  errors: Record<string>;
}

/** 404 — ссылка на несуществующий id. */
@error
model NotFoundErrorResponse {
  @statusCode statusCode: 404;
  message: string;
}

/** 409 — запрошенный интервал пересекается с существующей записью. */
@error
model ConflictErrorResponse {
  @statusCode statusCode: 409;
  message: string;
}

// ---------- Тип встречи ----------

/** Тип встречи: шаблон, который создаёт владелец. Не редактируется и не удаляется. */
model MeetingType {
  @visibility(Lifecycle.Read)
  id: int64;

  /** Непустое, до 100 символов; уникально без учёта регистра и пробелов по краям. */
  @maxLength(100)
  name: string;

  /** До 1000 символов. */
  @maxLength(1000)
  description: string | null;

  /** Минуты: 15, 30 или 60. */
  durationMinutes: MeetingDuration;
}

/** Допустимые длительности типа встречи, в минутах. */
enum MeetingDuration {
  fifteen: 15,
  thirty: 30,
  sixty: 60,
}

/** Данные для создания типа встречи. */
model NewMeetingType {
  // Непустое после обрезки пробелов — как @NotBlank на бэкенде, то же правило во фронтенде
  @maxLength(100)
  @pattern(".*\\S.*")
  name: string;

  @maxLength(1000)
  description?: string;

  durationMinutes: MeetingDuration;
}

@tag("MeetingTypes")
@route("/api/meeting-types")
interface MeetingTypes {
  /** Список типов встреч. */
  @get
  list(): MeetingType[];

  /** Создание типа встречи. */
  @post
  create(@body body: NewMeetingType): {
    @statusCode statusCode: 201;
    @body meetingType: MeetingType;
  } | ValidationErrorResponse;
}

// ---------- Слоты ----------

/** Статус слота для гостя. */
enum SlotStatus {
  free: "free",
  busy: "busy",
}

/** Слот сетки записи: старт и статус занятости. */
model Slot {
  /** ISO 8601 с offset пояса владельца. */
  start: offsetDateTime;

  status: SlotStatus;
}

@tag("Slots")
@route("/api/slots")
interface Slots {
  /**
   * Слоты дня для типа встречи. Дата вне окна записи — пустой массив, не ошибка;
   * прошедшие слоты не возвращаются.
   */
  @get
  list(
    @query meetingTypeId: int64,
    @query date: plainDate,
  ): Slot[] | NotFoundErrorResponse | ValidationErrorResponse;
}

// ---------- Записи ----------

/** Тип встречи, вложенный в запись (снимок полей не хранится — это актуальный тип). */
model BookingMeetingType {
  id: int64;
  name: string;
  durationMinutes: int32;
}

/** Забронированная гостем встреча. */
model Booking {
  @visibility(Lifecycle.Read)
  id: int64;

  /** ISO 8601 с offset пояса владельца; конец вычисляется из длительности типа. */
  start: offsetDateTime;

  @maxLength(100)
  guestName: string;

  @pattern("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
  guestEmail: string;

  @maxLength(1000)
  note: string | null;

  meetingType: BookingMeetingType;
}

/** Данные для бронирования встречи гостем. */
model NewBooking {
  meetingTypeId: int64;

  /** Старт слота: сетка 15 минут, внутри 9:00–18:00 владельца, в окне записи, не в прошлом. */
  start: offsetDateTime;

  // Непустое после обрезки пробелов — то же правило во фронтенде (GuestFormStep.tsx)
  @maxLength(100)
  @pattern(".*\\S.*")
  guestName: string;

  // Та же проверка формата, что и в GuestFormStep.tsx — единственный источник: этот контракт
  @pattern("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
  guestEmail: string;

  @maxLength(1000)
  note?: string;
}

@tag("Bookings")
@route("/api/bookings")
interface Bookings {
  /** Предстоящие записи владельца, по возрастанию старта, без пагинации. */
  @get
  list(): Booking[];

  /** Бронирование встречи. */
  @post
  create(
    @body body: NewBooking,
  ): {
    @statusCode statusCode: 201;
    @body booking: Booking;
  } | ValidationErrorResponse | NotFoundErrorResponse | ConflictErrorResponse;
}
