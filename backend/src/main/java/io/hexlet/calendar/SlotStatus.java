package io.hexlet.calendar;

import com.fasterxml.jackson.annotation.JsonValue;

/** Статус слота для гостя: в JSON сериализуется как "free"/"busy". */
public enum SlotStatus {
  FREE("free"),
  BUSY("busy");

  private final String code;

  SlotStatus(String code) {
    this.code = code;
  }

  @JsonValue
  public String code() {
    return code;
  }
}
