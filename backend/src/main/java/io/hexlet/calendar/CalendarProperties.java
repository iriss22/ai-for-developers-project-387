package io.hexlet.calendar;

import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Настройки календаря. Часовой пояс владельца ({@code calendar.owner-timezone}) должен совпадать с
 * OWNER_TIME_ZONE во фронтенде.
 */
@ConfigurationProperties("calendar")
public record CalendarProperties(@DefaultValue("Europe/Moscow") ZoneId ownerTimezone) {}
