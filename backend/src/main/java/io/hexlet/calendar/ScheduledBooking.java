package io.hexlet.calendar;

/** Запись вместе с её типом встречи: длительность типа задаёт интервал записи. */
public record ScheduledBooking(Booking booking, MeetingType meetingType) {

  public BookingInterval interval() {
    return BookingInterval.of(booking, meetingType);
  }
}
