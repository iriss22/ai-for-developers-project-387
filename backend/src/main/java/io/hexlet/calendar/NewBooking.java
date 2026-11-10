package io.hexlet.calendar;

import java.time.OffsetDateTime;

/** Данные новой записи от гостя. Контроллер отображает web-запрос в эту команду доменного слоя. */
public record NewBooking(
    long meetingTypeId, OffsetDateTime start, String guestName, String guestEmail, String note) {}
