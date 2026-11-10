package io.hexlet.calendar;

import io.hexlet.calendar.generated.api.BookingsApi;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

// Реализует сгенерированный из contract/main.tsp интерфейс (mise run generate):
// аннотации @RequestMapping/@Valid/@RequestBody — на методах интерфейса, Spring MVC их наследует.
@RestController
public class BookingController implements BookingsApi {

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @Override
  public ResponseEntity<List<io.hexlet.calendar.generated.model.Booking>> bookingsList() {
    return ResponseEntity.ok(
        bookingService.findUpcoming().stream().map(BookingController::toDto).toList());
  }

  @Override
  public ResponseEntity<io.hexlet.calendar.generated.model.Booking> bookingsCreate(
      io.hexlet.calendar.generated.model.NewBooking newBooking) {
    ScheduledBooking scheduled =
        bookingService.create(
            new NewBooking(
                newBooking.getMeetingTypeId(),
                newBooking.getStart(),
                newBooking.getGuestName(),
                newBooking.getGuestEmail(),
                newBooking.getNote()));
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(scheduled));
  }

  private static io.hexlet.calendar.generated.model.Booking toDto(ScheduledBooking scheduled) {
    Booking booking = scheduled.booking();
    MeetingType type = scheduled.meetingType();
    return new io.hexlet.calendar.generated.model.Booking(
        booking.id(),
        booking.start(),
        booking.guestName(),
        booking.guestEmail(),
        booking.note(),
        new io.hexlet.calendar.generated.model.BookingMeetingType(
            type.id(), type.name(), type.durationMinutes()));
  }
}
