package io.hexlet.calendar;

import java.time.Instant;

/** Интервал записи или слота: [start, end); стык-в-стык не считается пересечением. */
public record BookingInterval(Instant start, Instant end) {

  public static BookingInterval of(Instant start, int durationMinutes) {
    return new BookingInterval(start, start.plusSeconds(durationMinutes * 60L));
  }

  /** Интервал записи — [start, start + длительность её типа встречи). */
  public static BookingInterval of(Booking booking, MeetingType type) {
    return of(booking.start().toInstant(), type.durationMinutes());
  }

  public boolean overlaps(BookingInterval other) {
    return start.isBefore(other.end) && other.start.isBefore(end);
  }
}
