package io.hexlet.calendar;

import java.util.List;

public interface BookingRepository {

  List<Booking> findAll();

  Booking save(Booking booking);
}
