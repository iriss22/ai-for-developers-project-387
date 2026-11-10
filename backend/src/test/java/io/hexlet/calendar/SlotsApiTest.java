package io.hexlet.calendar;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
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

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class SlotsApiTest {

  // Управляемые часы: «сейчас» — 10.11.2026 10:30 по поясу владельца (Europe/Moscow)
  private static final Instant NOW = Instant.parse("2026-11-10T07:30:00Z");

  @Autowired private MockMvc mvc;

  @MockitoBean private Clock clock;

  @BeforeEach
  void setUp() {
    when(clock.instant()).thenReturn(NOW);
  }

  private long createMeetingType(int durationMinutes) throws Exception {
    String response =
        mvc.perform(
                post("/api/meeting-types")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "Интервью %d мин", "durationMinutes": %d}
                        """
                            .formatted(durationMinutes, durationMinutes)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return Long.parseLong(response.replaceAll(".*\"id\":(\\d+).*", "$1"));
  }

  @Test
  @DisplayName("дата в окне записи — свободные слоты на сетке 15 минут")
  void slotsForDateInsideWindowReturnsFreeSlotsOnQuarterHourGrid() throws Exception {
    long typeId = createMeetingType(30);

    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", typeId, "2026-11-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(35))
        .andExpect(
            jsonPath("$[0].start").value(allOf(startsWith("2026-11-12T09:00"), endsWith("+03:00"))))
        .andExpect(jsonPath("$[1].start").value(startsWith("2026-11-12T09:15")))
        .andExpect(jsonPath("$[34].start").value(startsWith("2026-11-12T17:30")))
        .andExpect(jsonPath("$[*].status").value(everyItem(is("free"))));
  }

  @Test
  @DisplayName("последний старт зависит от длительности: слот умещается в границы дня")
  void lastStartDependsOnDurationSoSlotFitsInsideDayBounds() throws Exception {
    long type15 = createMeetingType(15);
    long type60 = createMeetingType(60);

    // Слоты 15 минут: последний старт 17:45, всего 36 слотов (9:00–17:45 с шагом 15 минут)
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", type15, "2026-11-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(36))
        .andExpect(jsonPath("$[35].start").value(startsWith("2026-11-12T17:45")));

    // Слоты 60 минут: последний старт 17:00, всего 33 слота
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", type60, "2026-11-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(33))
        .andExpect(jsonPath("$[32].start").value(startsWith("2026-11-12T17:00")));
  }

  @Test
  @DisplayName("прошедшие слоты сегодняшнего дня не возвращаются")
  void pastSlotsOfTodayAreNotReturned() throws Exception {
    long typeId = createMeetingType(30);

    // Сейчас 10:30 по поясу владельца: слоты 9:00–10:30 (включая старт 10:30) уже недоступны
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", typeId, "2026-11-10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].start").value(startsWith("2026-11-10T10:45")))
        .andExpect(jsonPath("$[*].start").value(everyItem(startsWith("2026-11-10T1"))));
  }

  @Test
  @DisplayName("дата вне окна записи — пустой массив")
  void dateOutsideBookingWindowReturnsEmptyArray() throws Exception {
    long typeId = createMeetingType(15);

    // Окно записи — 14 календарных дней включая сегодня: 10.11–23.11
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", typeId, "2026-11-23"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(36));

    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", typeId, "2026-11-24"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));

    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", typeId, "2026-11-09"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("нечисловой meetingTypeId — 400 с ошибкой поля")
  void nonNumericMeetingTypeIdReturns400WithFieldError() throws Exception {
    mvc.perform(get("/api/slots?meetingTypeId=abc&date=2026-11-12"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.meetingTypeId").isString());
  }

  @Test
  @DisplayName("без date или meetingTypeId — 400 с ошибкой параметра")
  void missingDateOrMeetingTypeIdReturns400WithFieldError() throws Exception {
    mvc.perform(get("/api/slots?meetingTypeId=1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.date").isString());

    mvc.perform(get("/api/slots?date=2026-11-12"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.meetingTypeId").isString());
  }

  @Test
  @DisplayName("неизвестный тип встречи — 404")
  void unknownMeetingTypeIdReturns404() throws Exception {
    mvc.perform(get("/api/slots?meetingTypeId={id}&date={date}", 999, "2026-11-12"))
        .andExpect(status().isNotFound());
  }
}
