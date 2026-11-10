package io.hexlet.calendar;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import org.apache.tomcat.util.http.InvalidParameterException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import tools.jackson.core.JacksonException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleValidation(ValidationException ex) {
    return badRequest(ex.getErrors());
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(NotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<Map<String, String>> handleConflict(ConflictException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleBeanValidation(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new LinkedHashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
    return badRequest(errors);
  }

  // Битый JSON или неверный тип поля в теле: ответ приводим к форме {"errors": {"<поле>": "…"}}
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleNotReadable(
      HttpMessageNotReadableException ex) {
    String field = "request";
    if (ex.getCause() instanceof JacksonException jacksonException) {
      field =
          jacksonException.getPath().stream()
              .map(JacksonException.Reference::getPropertyName)
              .filter(Objects::nonNull)
              .findFirst()
              .orElse(field);
    }
    return badRequest(Map.of(field, "Некорректное значение"));
  }

  // Неверный тип параметра запроса (например, meetingTypeId=abc)
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleTypeMismatch(
      MethodArgumentTypeMismatchException ex) {
    return badRequest(Map.of(ex.getName(), "Некорректное значение параметра"));
  }

  // Обязательный параметр запроса не передан (например, GET /api/slots без date)
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleMissingParameter(
      MissingServletRequestParameterException ex) {
    return badRequest(Map.of(ex.getParameterName(), "Обязательный параметр"));
  }

  // Тело не JSON или не передано (POST без Content-Type): по контракту это ошибка валидации
  // запроса, а не 415
  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleMediaTypeNotSupported(
      HttpMediaTypeNotSupportedException ex) {
    return badRequest(Map.of("request", "Тело запроса должно быть JSON"));
  }

  // Tomcat не смог разобрать query-строку (параметр с пустым именем, битая кодировка). Без
  // обработчика ответ уходил бы телом /error Spring по умолчанию, не по контракту
  @ExceptionHandler(InvalidParameterException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleInvalidParameter(
      InvalidParameterException ex) {
    return badRequest(Map.of("request", "Некорректные параметры запроса"));
  }

  // Общий хелпер для тела 400: {"errors": {"<поле>": "<сообщение>"}} (contract/main.tsp,
  // модель ValidationErrorResponse)
  private static ResponseEntity<Map<String, Map<String, String>>> badRequest(
      Map<String, String> errors) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", errors));
  }
}
