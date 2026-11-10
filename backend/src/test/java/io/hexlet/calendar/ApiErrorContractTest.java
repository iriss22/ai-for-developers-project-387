package io.hexlet.calendar;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

/**
 * Ошибки, которые возникают до контроллера или в обход него (разбор запроса Tomcat'ом, multipart,
 * Content-Type, приведение типов Jackson), отвечают по контракту: 400 с телом {"errors": {...}}
 * (ValidationErrorResponse в contract/main.tsp), а не 415/500 и не тело /error Spring по умолчанию.
 *
 * <p>Запросы идут на настоящий сервер: MockMvc не разбирает query-строку и multipart так, как
 * Tomcat. Расхождения нашёл Schemathesis (mise run test:contract).
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ApiErrorContractTest {

  private static final String JSON = "application/json";

  private final HttpClient http = HttpClient.newHttpClient();

  @LocalServerPort private int port;

  @Test
  @DisplayName("Content-Type multipart без boundary в GET не ломает сервер")
  void getWithMultipartContentTypeWithoutBoundaryIsNotServerError() throws Exception {
    HttpResponse<String> response =
        send(
            HttpRequest.newBuilder(uri("/api/meeting-types"))
                .header("Content-Type", "multipart/form-data")
                .GET());

    assertThat(response.statusCode()).isEqualTo(200);
  }

  @Test
  @DisplayName("POST без тела и Content-Type — 400 с ошибкой request")
  void postWithoutBodyReturns400WithRequestError() throws Exception {
    HttpResponse<String> response =
        send(HttpRequest.newBuilder(uri("/api/meeting-types")).POST(BodyPublishers.noBody()));

    assertValidationError(response, "request");
  }

  @Test
  @DisplayName("POST с телом не в JSON — 400 с ошибкой request")
  void postWithNonJsonContentTypeReturns400WithRequestError() throws Exception {
    HttpResponse<String> response =
        send(
            HttpRequest.newBuilder(uri("/api/bookings"))
                .header("Content-Type", "text/plain")
                .POST(BodyPublishers.ofString("x")));

    assertValidationError(response, "request");
  }

  @Test
  @DisplayName("query-параметр с пустым именем — 400 по контракту")
  void queryParameterWithEmptyNameReturns400WithRequestError() throws Exception {
    HttpResponse<String> response =
        send(HttpRequest.newBuilder(uri("/api/slots?meetingTypeId=1&date=2026-11-12&=x")).GET());

    assertValidationError(response, "request");
  }

  @Test
  @DisplayName("query-параметр с битой UTF-8 кодировкой — 400 по контракту")
  void queryParameterWithMalformedEncodingReturns400WithRequestError() throws Exception {
    HttpResponse<String> response =
        send(HttpRequest.newBuilder(uri("/api/slots?meetingTypeId=1&date=2026-11-12&a=%C3")).GET());

    assertValidationError(response, "request");
  }

  @Test
  @DisplayName("число вместо строки в description — 400, а не молчаливое приведение")
  void numberInsteadOfStringFieldReturns400WithFieldError() throws Exception {
    HttpResponse<String> response =
        send(
            HttpRequest.newBuilder(uri("/api/meeting-types"))
                .header("Content-Type", JSON)
                .POST(
                    BodyPublishers.ofString(
                        """
                        {"name": "Интервью", "description": 4194304, "durationMinutes": 30}
                        """)));

    assertValidationError(response, "description");
  }

  @Test
  @DisplayName("строка вместо числа в durationMinutes — 400, а не молчаливое приведение")
  void stringInsteadOfNumberFieldReturns400WithFieldError() throws Exception {
    HttpResponse<String> response =
        send(
            HttpRequest.newBuilder(uri("/api/meeting-types"))
                .header("Content-Type", JSON)
                .POST(
                    BodyPublishers.ofString(
                        """
                        {"name": "Интервью", "durationMinutes": "30"}
                        """)));

    assertValidationError(response, "durationMinutes");
  }

  @Test
  @DisplayName(
      "null в необязательном строковом поле — 400: по контракту поле либо строка, либо нет")
  void nullInOptionalStringFieldReturns400WithFieldError() throws Exception {
    HttpResponse<String> response =
        send(
            HttpRequest.newBuilder(uri("/api/meeting-types"))
                .header("Content-Type", JSON)
                .POST(
                    BodyPublishers.ofString(
                        """
                        {"name": "Интервью", "description": null, "durationMinutes": 30}
                        """)));

    assertValidationError(response, "description");
  }

  private URI uri(String pathAndQuery) {
    return URI.create("http://localhost:" + port + pathAndQuery);
  }

  private HttpResponse<String> send(HttpRequest.Builder request)
      throws IOException, InterruptedException {
    return http.send(request.build(), BodyHandlers.ofString());
  }

  private static void assertValidationError(HttpResponse<String> response, String field) {
    assertThat(response.statusCode()).isEqualTo(400);
    assertThat(response.headers().firstValue("Content-Type"))
        .hasValueSatisfying(type -> assertThat(type).startsWith(JSON));
    assertThat(response.body()).startsWith("{\"errors\":{").contains("\"" + field + "\":");
  }
}
