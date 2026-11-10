package io.hexlet.calendar;

import java.time.OffsetDateTime;

public record Booking(
    Long id,
    long meetingTypeId,
    OffsetDateTime start,
    String guestName,
    String guestEmail,
    String note) {}
