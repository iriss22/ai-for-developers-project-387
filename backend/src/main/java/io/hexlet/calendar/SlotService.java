package io.hexlet.calendar;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SlotService {

  private final MeetingTypeService meetingTypeService;
  private final OwnerCalendar ownerCalendar;

  public SlotService(MeetingTypeService meetingTypeService, OwnerCalendar ownerCalendar) {
    this.meetingTypeService = meetingTypeService;
    this.ownerCalendar = ownerCalendar;
  }

  public List<Slot> slotsFor(long meetingTypeId, LocalDate date) {
    MeetingType type = meetingTypeService.getById(meetingTypeId);
    if (!ownerCalendar.isInBookingWindow(date)) {
      return List.of();
    }

    Instant now = ownerCalendar.now();
    List<Slot> slots = new ArrayList<>();
    for (LocalTime start = CalendarRules.DAY_START;
        !start.plusMinutes(type.durationMinutes()).isAfter(CalendarRules.DAY_END);
        start = start.plusMinutes(CalendarRules.GRID_STEP_MINUTES)) {
      ZonedDateTime slotStart = ZonedDateTime.of(date, start, ownerCalendar.zone());
      if (!slotStart.toInstant().isAfter(now)) {
        continue;
      }
      BookingInterval slot = BookingInterval.of(slotStart.toInstant(), type.durationMinutes());
      SlotStatus status = ownerCalendar.isBusy(slot) ? SlotStatus.BUSY : SlotStatus.FREE;
      slots.add(new Slot(slotStart.toOffsetDateTime(), status));
    }
    return slots;
  }

  public record Slot(OffsetDateTime start, SlotStatus status) {}
}
