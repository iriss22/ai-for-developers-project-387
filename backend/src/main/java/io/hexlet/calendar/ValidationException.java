package io.hexlet.calendar;

import java.util.LinkedHashMap;
import java.util.Map;

public class ValidationException extends RuntimeException {

  private final transient Map<String, String> errors;

  public ValidationException(Map<String, String> errors) {
    super(errors.toString());
    this.errors = new LinkedHashMap<>(errors);
  }

  public Map<String, String> getErrors() {
    return Map.copyOf(errors);
  }
}
