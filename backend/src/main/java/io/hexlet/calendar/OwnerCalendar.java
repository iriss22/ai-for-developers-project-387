package io.hexlet.calendar;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Контекст владельца: «сейчас», окно записи и занятость. Общие правила для списка слотов и
 * бронирования, чтобы слот, показанный свободным, и запись проверялись одинаково.
 */
@Component
public class OwnerCalendar {

  private final BookingRepository bookingRepository;
  private final MeetingTypeRepository meetingTypeRepository;
  private final Clock clock;
  private final ZoneId ownerZone;

  public OwnerCalendar(
      BookingRepository bookingRepository,
      MeetingTypeRepository meetingTypeRepository,
      Clock clock,
      CalendarProperties properties) {
    this.bookingRepository = bookingRepository;
    this.meetingTypeRepository = meetingTypeRepository;
    this.clock = clock;
    this.ownerZone = properties.ownerTimezone();
  }

  public ZoneId zone() {
    return ownerZone;
  }

  public Instant now() {
    return clock.instant();
  }

  /** Окно записи — 14 календарных дней, включая сегодня (в поясе владельца). */
  public boolean isInBookingWindow(LocalDate date) {
    LocalDate today = LocalDate.ofInstant(now(), ownerZone);
    return !date.isBefore(today)
        && date.isBefore(today.plusDays(CalendarRules.BOOKING_WINDOW_DAYS));
  }

  /** Интервал занят, если пересекается с любой записью любого типа (стык-в-стык — свободен). */
  public boolean isBusy(BookingInterval interval) {
    return bookings().stream().map(ScheduledBooking::interval).anyMatch(interval::overlaps);
  }

  /** Все записи вместе с их типами встреч. */
  public List<ScheduledBooking> bookings() {
    return bookingRepository.findAll().stream().map(this::withMeetingType).toList();
  }

  public ScheduledBooking withMeetingType(Booking booking) {
    return new ScheduledBooking(
        booking, meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow());
  }
}
