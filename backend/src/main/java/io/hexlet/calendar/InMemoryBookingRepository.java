package io.hexlet.calendar;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryBookingRepository implements BookingRepository {

  private final AtomicLong nextId = new AtomicLong(1);
  private final List<Booking> storage = new CopyOnWriteArrayList<>();

  @Override
  public List<Booking> findAll() {
    return List.copyOf(storage);
  }

  @Override
  public Booking save(Booking booking) {
    var saved =
        new Booking(
            nextId.getAndIncrement(),
            booking.meetingTypeId(),
            booking.start(),
            booking.guestName(),
            booking.guestEmail(),
            booking.note());
    storage.add(saved);
    return saved;
  }
}
