package io.hexlet.calendar;

import java.time.LocalTime;

/** Правила сетки слотов: дневные границы, шаг сетки и окно записи (в часовом поясе владельца). */
final class CalendarRules {

  static final LocalTime DAY_START = LocalTime.of(9, 0);
  static final LocalTime DAY_END = LocalTime.of(18, 0);
  static final int GRID_STEP_MINUTES = 15;
  static final int BOOKING_WINDOW_DAYS = 14;

  private CalendarRules() {}
}
