package io.hexlet.calendar;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BookingApiTest {

  // Управляемые часы: «сейчас» — 10.11.2026 10:30 по поясу владельца (Europe/Moscow)
  private static final Instant NOW = Instant.parse("2026-11-10T07:30:00Z");

  @Autowired private MockMvc mvc;

  @MockitoBean private Clock clock;

  @BeforeEach
  void setUp() {
    when(clock.instant()).thenReturn(NOW);
  }

  private long createMeetingType(String name, int durationMinutes) throws Exception {
    String response =
        mvc.perform(
                post("/api/meeting-types")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "%s", "durationMinutes": %d}
                        """
                            .formatted(name, durationMinutes)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return Long.parseLong(response.replaceAll(".*\"id\":(\\d+).*", "$1"));
  }

  private ResultActions book(long meetingTypeId, String start, String guestName, String guestEmail)
      throws Exception {
    return mvc.perform(
        post("/api/bookings")
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                """
                {"meetingTypeId": %d, "start": "%s", "guestName": "%s", "guestEmail": "%s"}
                """
                    .formatted(meetingTypeId, start, guestName, guestEmail)));
  }

  @Test
  @DisplayName("создание записи возвращает 201 и вложенный тип встречи")
  void createBookingReturns201WithNestedMeetingType() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    mvc.perform(
            post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"meetingTypeId": %d, "start": "2026-11-12T10:00:00+03:00",
                     "guestName": "Иван Петров", "guestEmail": "ivan@example.com",
                     "note": "Подготовить резюме"}
                    """
                        .formatted(typeId)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.start").value(startsWith("2026-11-12T10:00")))
        .andExpect(jsonPath("$.start").value(endsWith("+03:00")))
        .andExpect(jsonPath("$.guestName").value("Иван Петров"))
        .andExpect(jsonPath("$.guestEmail").value("ivan@example.com"))
        .andExpect(jsonPath("$.note").value("Подготовить резюме"))
        .andExpect(jsonPath("$.meetingType.id").value(typeId))
        .andExpect(jsonPath("$.meetingType.name").value("Интервью"))
        .andExpect(jsonPath("$.meetingType.durationMinutes").value(60));
  }

  @Test
  @DisplayName("запись занимает пересекающиеся слоты любого типа, стык-в-стык остаётся свободным")
  void bookingMakesOverlappingSlotsOfAnyTypeBusyAndAdjacentSlotsStayFree() throws Exception {
    long type60 = createMeetingType("Интервью", 60);
    long type15 = createMeetingType("Экспресс-разбор", 15);

    // Запись 10:00–11:00 (60 минут)
    book(type60, "2026-11-12T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isCreated());

    // Слоты того же типа (60 минут), сетка 15 минут: 9:00 = [0], 9:15 = [1], …, 10:45 = [7], 11:00
    // = [8]
    // Пересекаются с 10:00–11:00 слоты со стартом 9:15–10:45 ([1]–[7]) — они заняты.
    // Стык-в-стык разрешён: 9:00–10:00 и 11:00–12:00 свободны.
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", type60, "2026-11-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].start").value(startsWith("2026-11-12T09:00")))
        .andExpect(jsonPath("$[0].status").value("free"))
        .andExpect(jsonPath("$[1].status").value("busy"))
        .andExpect(jsonPath("$[4].status").value("busy"))
        .andExpect(jsonPath("$[7].start").value(startsWith("2026-11-12T10:45")))
        .andExpect(jsonPath("$[7].status").value("busy"))
        .andExpect(jsonPath("$[8].start").value(startsWith("2026-11-12T11:00")))
        .andExpect(jsonPath("$[8].status").value("free"));

    // Слоты другого типа (15 минут): заняты ровно 10:00, 10:15, 10:30, 10:45 ([4]–[7]);
    // стык-в-стык 9:45–10:00 ([3]) и 11:00–11:15 ([8]) свободны.
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", type15, "2026-11-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[3].start").value(startsWith("2026-11-12T09:45")))
        .andExpect(jsonPath("$[3].status").value("free"))
        .andExpect(jsonPath("$[4].status").value("busy"))
        .andExpect(jsonPath("$[5].status").value("busy"))
        .andExpect(jsonPath("$[6].status").value("busy"))
        .andExpect(jsonPath("$[7].start").value(startsWith("2026-11-12T10:45")))
        .andExpect(jsonPath("$[7].status").value("busy"))
        .andExpect(jsonPath("$[8].start").value(startsWith("2026-11-12T11:00")))
        .andExpect(jsonPath("$[8].status").value("free"));
  }

  @Test
  @DisplayName("пересекающаяся запись — 409, стык-в-стык — разрешена")
  void secondBookingOnOverlappingIntervalReturns409WhileAdjacentIsAllowed() throws Exception {
    long type60 = createMeetingType("Интервью", 60);
    long type15 = createMeetingType("Экспресс-разбор", 15);

    book(type60, "2026-11-12T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isCreated());

    // Гонка: пересекающийся слот другого типа уже занят
    book(type15, "2026-11-12T10:30:00+03:00", "Мария Сидорова", "maria@example.com")
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.message").isString());

    // Стык-в-стык — не пересечение: запись с 11:00 создаётся
    book(type60, "2026-11-12T11:00:00+03:00", "Мария Сидорова", "maria@example.com")
        .andExpect(status().isCreated());
  }

  @Test
  @DisplayName("два параллельных бронирования одного слота: ровно один 201 и один 409")
  void twoParallelBookingsOnSameSlotYieldExactlyOne201AndOne409() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    // Гонка двух гостей за один слот: решает сервер — ровно один 201 и ровно один 409.
    // Каждая пара запросов бронирует свой день, чтобы пары не пересекались между собой.
    for (int day = 12; day <= 21; day++) {
      String start = "2026-11-%02dT10:00:00+03:00".formatted(day);
      CyclicBarrier barrier = new CyclicBarrier(2);
      Callable<Integer> postBooking =
          () -> {
            barrier.await(10, TimeUnit.SECONDS);
            return book(typeId, start, "Иван Петров", "ivan@example.com")
                .andReturn()
                .getResponse()
                .getStatus();
          };
      ExecutorService executor = Executors.newFixedThreadPool(2);
      try {
        Future<Integer> first = executor.submit(postBooking);
        Future<Integer> second = executor.submit(postBooking);
        List<Integer> statuses =
            List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
        long created = statuses.stream().filter(code -> code == 201).count();
        long conflicts = statuses.stream().filter(code -> code == 409).count();
        String context = "день " + day + ": статусы " + statuses;
        assertEquals(1, created, () -> context);
        assertEquals(1, conflicts, () -> context);
      } finally {
        executor.shutdownNow();
      }
    }
  }

  @Test
  @DisplayName("старт вне сетки 15 минут — 400 с ошибкой start")
  void bookingStartOffTheQuarterHourGridReturns400WithStartError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    book(typeId, "2026-11-12T10:10:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());
  }

  @Test
  @DisplayName("слот за границами 9:00–18:00 — 400 с ошибкой start")
  void bookingSlotOutsideDayBoundsReturns400WithStartError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    // До начала дня
    book(typeId, "2026-11-12T08:45:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());

    // Слот не умещается в границы дня: 17:30 + 60 минут = 18:30
    book(typeId, "2026-11-12T17:30:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());

    // Стык-в-стык с концом дня разрешён: 17:00 + 60 минут = 18:00
    book(typeId, "2026-11-12T17:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isCreated());
  }

  @Test
  @DisplayName("дата вне окна записи — 400 с ошибкой start")
  void bookingDateOutsideBookingWindowReturns400WithStartError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    // Окно записи — 14 календарных дней включая сегодня: 10.11–23.11
    book(typeId, "2026-11-24T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());

    book(typeId, "2026-11-09T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());

    // Последний день окна — можно
    book(typeId, "2026-11-23T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isCreated());
  }

  @Test
  @DisplayName("прошедшее время — 400 с ошибкой start")
  void bookingStartInThePastReturns400WithStartError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    // Сейчас 10.11.2026 10:30 по поясу владельца
    book(typeId, "2026-11-10T10:15:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());

    // Слот со стартом ровно «сейчас» уже недоступен (как и в списке слотов)
    book(typeId, "2026-11-10T10:30:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.start").isString());
  }

  @Test
  @DisplayName("неизвестный тип встречи — 404")
  void bookingWithUnknownMeetingTypeIdReturns404() throws Exception {
    book(999, "2026-11-12T10:00:00+03:00", "Иван Петров", "ivan@example.com")
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("битый JSON — 400 с errors")
  void malformedJsonBodyReturns400WithErrors() throws Exception {
    mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content("{"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.request").isString());
  }

  @Test
  @DisplayName("неверный тип поля в теле — 400 с ошибкой этого поля")
  void wrongFieldTypeInBodyReturns400WithFieldError() throws Exception {
    mvc.perform(
            post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"meetingTypeId": "abc", "start": "2026-11-12T10:00:00+03:00",
                     "guestName": "Иван Петров", "guestEmail": "ivan@example.com"}
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.meetingTypeId").isString());
  }

  @Test
  @DisplayName("пустое имя гостя — 400 с ошибкой guestName")
  void bookingWithBlankNameReturns400WithGuestNameError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    book(typeId, "2026-11-12T10:00:00+03:00", "  ", "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.guestName").isString());
  }

  @Test
  @DisplayName("имя гостя длиннее 100 символов — 400 с ошибкой guestName")
  void bookingWithTooLongNameReturns400WithGuestNameError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    book(typeId, "2026-11-12T10:00:00+03:00", "а".repeat(101), "ivan@example.com")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.guestName").isString());
  }

  @Test
  @DisplayName("некорректный или отсутствующий email — 400 с ошибкой guestEmail")
  void bookingWithMalformedOrMissingEmailReturns400WithGuestEmailError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    book(typeId, "2026-11-12T10:00:00+03:00", "Иван Петров", "не-почта")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.guestEmail").isString());

    // Правило то же, что на фронтенде: в домене обязательна точка
    book(typeId, "2026-11-12T10:00:00+03:00", "Иван Петров", "a@b")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.guestEmail").isString());

    mvc.perform(
            post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"meetingTypeId": %d, "start": "2026-11-12T10:00:00+03:00",
                     "guestName": "Иван Петров"}
                    """
                        .formatted(typeId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.guestEmail").isString());
  }

  @Test
  @DisplayName("заметка длиннее 1000 символов — 400 с ошибкой note")
  void bookingWithTooLongNoteReturns400WithNoteError() throws Exception {
    long typeId = createMeetingType("Интервью", 60);

    mvc.perform(
            post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"meetingTypeId": %d, "start": "2026-11-12T10:00:00+03:00",
                     "guestName": "Иван Петров", "guestEmail": "ivan@example.com",
                     "note": "%s"}
                    """
                        .formatted(typeId, "а".repeat(1001))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.note").isString());
  }
}
