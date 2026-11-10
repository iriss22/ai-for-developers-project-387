package io.hexlet.calendar;

import java.util.List;
import java.util.Optional;

public interface MeetingTypeRepository {

  List<MeetingType> findAll();

  Optional<MeetingType> findById(long id);

  MeetingType save(MeetingType meetingType);
}
