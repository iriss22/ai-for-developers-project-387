package io.hexlet.calendar;

/**
 * Данные нового типа встречи от владельца. Контроллер отображает web-запрос в эту команду доменного
 * слоя.
 */
public record NewMeetingType(String name, String description, Integer durationMinutes) {}
