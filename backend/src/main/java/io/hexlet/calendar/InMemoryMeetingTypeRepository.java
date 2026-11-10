package io.hexlet.calendar;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryMeetingTypeRepository implements MeetingTypeRepository {

  private final AtomicLong nextId = new AtomicLong(1);
  private final List<MeetingType> storage = new CopyOnWriteArrayList<>();

  @Override
  public List<MeetingType> findAll() {
    return List.copyOf(storage);
  }

  @Override
  public Optional<MeetingType> findById(long id) {
    return storage.stream().filter(meetingType -> meetingType.id() == id).findFirst();
  }

  @Override
  public MeetingType save(MeetingType meetingType) {
    var saved =
        new MeetingType(
            nextId.getAndIncrement(),
            meetingType.name(),
            meetingType.description(),
            meetingType.durationMinutes());
    storage.add(saved);
    return saved;
  }
}
