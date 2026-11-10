package io.hexlet.calendar;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
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
class UpcomingBookingsApiTest {

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

  private void book(long meetingTypeId, String start, String guestName, String guestEmail)
      throws Exception {
    mvc.perform(
            post("/api/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"meetingTypeId": %d, "start": "%s", "guestName": "%s", "guestEmail": "%s"}
                    """
                        .formatted(meetingTypeId, start, guestName, guestEmail)))
        .andExpect(status().isCreated());
  }

  @Test
  @DisplayName("пустой список — 200 и пустой массив")
  void emptyListReturns200WithEmptyArray() throws Exception {
    mvc.perform(get("/api/bookings"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  @DisplayName("предстоящие записи отсортированы по старту и содержат тип встречи")
  void upcomingBookingsAreSortedByStartAscendingWithNestedMeetingType() throws Exception {
    long typeId = createMeetingType("Интервью", 30);

    // Создаём не по порядку: поздняя запись первой
    book(typeId, "2026-11-12T14:00:00+03:00", "Мария Сидорова", "maria@example.com");
    book(typeId, "2026-11-12T09:00:00+03:00", "Иван Петров", "ivan@example.com");

    mvc.perform(get("/api/bookings"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].start").value(startsWith("2026-11-12T09:00")))
        .andExpect(jsonPath("$[0].start").value(endsWith("+03:00")))
        .andExpect(jsonPath("$[0].id").isNumber())
        .andExpect(jsonPath("$[0].guestName").value("Иван Петров"))
        .andExpect(jsonPath("$[0].guestEmail").value("ivan@example.com"))
        .andExpect(jsonPath("$[0].note").doesNotExist())
        .andExpect(jsonPath("$[0].meetingType.id").value(typeId))
        .andExpect(jsonPath("$[0].meetingType.name").value("Интервью"))
        .andExpect(jsonPath("$[0].meetingType.durationMinutes").value(30))
        .andExpect(jsonPath("$[1].start").value(startsWith("2026-11-12T14:00")))
        .andExpect(jsonPath("$[1].guestName").value("Мария Сидорова"));
  }

  @Test
  @DisplayName("прошедшие записи не возвращаются, идущие и будущие — возвращаются")
  void pastBookingsAreNotReturnedWhileOngoingAndFutureOnesAre() throws Exception {
    long typeId = createMeetingType("Интервью", 30);

    // Создаём записи, пока все они в будущем: «сейчас» — 10.11 8:30 по поясу владельца
    when(clock.instant()).thenReturn(Instant.parse("2026-11-10T05:30:00Z"));
    book(typeId, "2026-11-10T09:00:00+03:00", "Иван Петров", "ivan@example.com");
    book(typeId, "2026-11-10T10:15:00+03:00", "Мария Сидорова", "maria@example.com");
    book(typeId, "2026-11-12T09:00:00+03:00", "Пётр Иванов", "petr@example.com");

    // Время идёт: теперь «сейчас» — 10.11 10:30. Запись 9:00–9:30 прошла и выпадает из списка;
    // идущая сейчас (10:15–10:45) и будущая — остаются
    when(clock.instant()).thenReturn(NOW);

    mvc.perform(get("/api/bookings"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].guestName").value("Мария Сидорова"))
        .andExpect(jsonPath("$[1].guestName").value("Пётр Иванов"));
  }
}
