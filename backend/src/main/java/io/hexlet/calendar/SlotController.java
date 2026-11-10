package io.hexlet.calendar;

import io.hexlet.calendar.generated.api.SlotsApi;
import io.hexlet.calendar.generated.model.SlotStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

// Реализует сгенерированный из contract/main.tsp интерфейс (mise run generate):
// аннотации @RequestMapping/@RequestParam — на методах интерфейса, Spring MVC их наследует.
@RestController
public class SlotController implements SlotsApi {

  private final SlotService service;

  public SlotController(SlotService service) {
    this.service = service;
  }

  @Override
  public ResponseEntity<List<io.hexlet.calendar.generated.model.Slot>> slotsList(
      Long meetingTypeId, LocalDate date) {
    return ResponseEntity.ok(
        service.slotsFor(meetingTypeId, date).stream().map(SlotController::toDto).toList());
  }

  private static io.hexlet.calendar.generated.model.Slot toDto(SlotService.Slot slot) {
    SlotStatus status =
        switch (slot.status()) {
          case FREE -> SlotStatus.FREE;
          case BUSY -> SlotStatus.BUSY;
        };
    return new io.hexlet.calendar.generated.model.Slot(slot.start(), status);
  }
}
