package io.hexlet.calendar;

import io.hexlet.calendar.generated.api.MeetingTypesApi;
import io.hexlet.calendar.generated.model.MeetingDuration;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

// Реализует сгенерированный из contract/main.tsp интерфейс (mise run generate):
// аннотации @RequestMapping/@Valid/@RequestBody — на методах интерфейса, Spring MVC их наследует.
@RestController
public class MeetingTypeController implements MeetingTypesApi {

  private final MeetingTypeService service;

  public MeetingTypeController(MeetingTypeService service) {
    this.service = service;
  }

  @Override
  public ResponseEntity<List<io.hexlet.calendar.generated.model.MeetingType>> meetingTypesList() {
    return ResponseEntity.ok(service.findAll().stream().map(MeetingTypeController::toDto).toList());
  }

  @Override
  public ResponseEntity<io.hexlet.calendar.generated.model.MeetingType> meetingTypesCreate(
      io.hexlet.calendar.generated.model.NewMeetingType newMeetingType) {
    MeetingType created =
        service.create(
            new NewMeetingType(
                newMeetingType.getName(),
                newMeetingType.getDescription(),
                durationOf(newMeetingType.getDurationMinutes())));
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
  }

  private static io.hexlet.calendar.generated.model.MeetingType toDto(MeetingType type) {
    return new io.hexlet.calendar.generated.model.MeetingType(
        type.id(), type.name(), type.description(), durationDto(type.durationMinutes()));
  }

  private static MeetingDuration durationDto(int durationMinutes) {
    return MeetingDuration.fromValue(BigDecimal.valueOf(durationMinutes));
  }

  private static int durationOf(MeetingDuration duration) {
    return duration.getValue().intValueExact();
  }
}
