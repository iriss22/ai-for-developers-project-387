package io.hexlet.calendar;

import java.time.Instant;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final MeetingTypeService meetingTypeService;
  private final OwnerCalendar ownerCalendar;

  public BookingService(
      BookingRepository bookingRepository,
      MeetingTypeService meetingTypeService,
      OwnerCalendar ownerCalendar) {
    this.bookingRepository = bookingRepository;
    this.meetingTypeService = meetingTypeService;
    this.ownerCalendar = ownerCalendar;
  }

  // synchronized: проверка пересечения и сохранение атомарны, гонку двух гостей решает сервер
  public synchronized ScheduledBooking create(NewBooking command) {
    MeetingType type = meetingTypeService.getById(command.meetingTypeId());
    validateStart(command.start(), type);
    if (ownerCalendar.isBusy(
        BookingInterval.of(command.start().toInstant(), type.durationMinutes()))) {
      throw new ConflictException("Это время уже занято");
    }
    Booking saved =
        bookingRepository.save(
            new Booking(
                null,
                command.meetingTypeId(),
                command.start(),
                command.guestName(),
                command.guestEmail(),
                command.note()));
    return new ScheduledBooking(saved, type);
  }

  // Старт записи — старт слота: сетка 15 минут, слот целиком внутри 9:00–18:00,
  // дата в окне записи, время ещё не прошло (всё — в часовом поясе владельца)
  private void validateStart(OffsetDateTime start, MeetingType type) {
    ZonedDateTime localStart = start.atZoneSameInstant(ownerCalendar.zone());
    LocalTime time = localStart.toLocalTime();
    if (time.getMinute() % CalendarRules.GRID_STEP_MINUTES != 0
        || time.getSecond() != 0
        || time.getNano() != 0) {
      throw new ValidationException(
          Map.of("start", "Время начала должно быть на сетке каждые 15 минут"));
    }
    if (time.isBefore(CalendarRules.DAY_START)
        || time.plusMinutes(type.durationMinutes()).isAfter(CalendarRules.DAY_END)) {
      throw new ValidationException(
          Map.of("start", "Слот должен целиком умещаться в границы 9:00–18:00"));
    }
    if (!ownerCalendar.isInBookingWindow(localStart.toLocalDate())) {
      throw new ValidationException(
          Map.of("start", "Дата должна быть в окне записи — 14 дней включая сегодня"));
    }
    if (!start.toInstant().isAfter(ownerCalendar.now())) {
      throw new ValidationException(Map.of("start", "Это время уже прошло"));
    }
  }

  // Предстоящие записи по возрастанию старта. «Прошедшая» — следствие текущего времени:
  // запись выпадает из списка, когда её интервал [start, start + длительность типа) прошёл
  public List<ScheduledBooking> findUpcoming() {
    Instant now = ownerCalendar.now();
    return ownerCalendar.bookings().stream()
        .filter(scheduled -> scheduled.interval().end().isAfter(now))
        .sorted(Comparator.comparing(scheduled -> scheduled.interval().start()))
        .toList();
  }
}
