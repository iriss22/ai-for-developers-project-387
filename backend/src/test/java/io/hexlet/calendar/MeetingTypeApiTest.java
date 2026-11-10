package io.hexlet.calendar;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MeetingTypeApiTest {

  @Autowired private MockMvc mvc;

  @Test
  @DisplayName("пустое хранилище — пустой список типов встреч")
  void listMeetingTypesReturnsEmptyArrayOnEmptyStorage() throws Exception {
    mvc.perform(get("/api/meeting-types"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  @DisplayName("созданный тип встречи — 201 и появляется в списке")
  void createMeetingTypeReturnsCreatedAndAppearsInList() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "Интервью", "description": "Техническое интервью", "durationMinutes": 60}
                    """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.name").value("Интервью"))
        .andExpect(jsonPath("$.description").value("Техническое интервью"))
        .andExpect(jsonPath("$.durationMinutes").value(60));

    mvc.perform(get("/api/meeting-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].name").value("Интервью"));
  }

  @Test
  @DisplayName("пустое название — 400 с ошибкой name")
  void createMeetingTypeWithoutNameReturns400WithNameError() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "  ", "durationMinutes": 30}
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.name").isString());
  }

  @Test
  @DisplayName("название длиннее 100 символов — 400 с ошибкой name")
  void createMeetingTypeWithTooLongNameReturns400WithNameError() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "%s", "durationMinutes": 30}
                    """
                        .formatted("а".repeat(101))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.name").isString());
  }

  @Test
  @DisplayName("описание длиннее 1000 символов — 400 с ошибкой description")
  void createMeetingTypeWithTooLongDescriptionReturns400WithDescriptionError() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "Консультация", "description": "%s", "durationMinutes": 30}
                    """
                        .formatted("а".repeat(1001))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.description").isString());
  }

  @Test
  @DisplayName("длительность не 15/30/60 — 400 с ошибкой durationMinutes")
  void createMeetingTypeWithUnsupportedDurationReturns400WithDurationError() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "Разбор резюме", "durationMinutes": 45}
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.durationMinutes").isString());
  }

  @Test
  @DisplayName("название типа встречи хранится как введено")
  void meetingTypeNameIsStoredAsEntered() throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "  Интервью  ", "durationMinutes": 60}
                    """))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("  Интервью  "));

    mvc.perform(get("/api/meeting-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("  Интервью  "));
  }

  @Test
  @DisplayName("дубль названия без учёта регистра и пробелов — 400 с ошибкой name")
  void createMeetingTypeWithDuplicateNameIgnoringCaseAndSpacesReturns400WithNameError()
      throws Exception {
    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "Интервью", "durationMinutes": 60}
                    """))
        .andExpect(status().isCreated());

    mvc.perform(
            post("/api/meeting-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"name": "  интервью  ", "durationMinutes": 30}
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.name").isString());
  }
}
