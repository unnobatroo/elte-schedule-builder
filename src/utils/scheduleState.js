export function normalizeSubjectTitle(title) {
  return title
    .split("(")[0]
    .trim()
    .replace(/\s*[LP]\.\s*$/, "")
    .replace(/\s*L\+Pr\.\s*$/, "")
    .trim();
}

function getEventCode(event) {
  return (event.code ?? event.description.split("\n")[0]).trim();
}

function matchesExistingEvent(existingEvent, newEvent) {
  return (
    existingEvent.dayOfWeek === newEvent.dayOfWeek &&
    existingEvent.startTime === newEvent.startTime &&
    existingEvent.type === newEvent.type
  );
}

export function mergeScheduleEvents(subjects, eventData) {
  const eventsByTitle = new Map();

  for (const event of eventData) {
    const title = normalizeSubjectTitle(event.title);
    const events = eventsByTitle.get(title) ?? [];
    events.push({ ...event, code: getEventCode(event) });
    eventsByTitle.set(title, events);
  }

  const updatedSubjects = [...subjects];
  for (const [title, events] of eventsByTitle) {
    const existingIndex = updatedSubjects.findIndex(
      (subject) => subject.title === title,
    );

    if (existingIndex === -1) {
      updatedSubjects.push({
        title,
        code: [...new Set(events.map((event) => event.code))].join(", "),
        events,
        enabled: events.some((event) => event.enabled),
      });
      continue;
    }

    const existingSubject = updatedSubjects[existingIndex];
    const updatedEvents = events.map((newEvent) => {
      const existingEvent = existingSubject.events.find((event) =>
        matchesExistingEvent(event, newEvent),
      );
      return {
        ...newEvent,
        enabled: existingEvent ? existingEvent.enabled : newEvent.enabled,
      };
    });

    updatedSubjects[existingIndex] = {
      ...existingSubject,
      events: updatedEvents,
      code: [
        ...new Set([
          ...existingSubject.code.split(", ").filter(Boolean),
          ...events.map((event) => event.code),
        ]),
      ].join(", "),
      enabled: updatedEvents.some((event) => event.enabled),
    };
  }

  return updatedSubjects;
}

export function getEnabledEvents(subjects) {
  return subjects
    .filter((subject) => subject.enabled)
    .flatMap((subject) => subject.events.filter((event) => event.enabled));
}

export function setSubjectEnabled(subjects, title, enabled = null) {
  return subjects.map((subject) => {
    if (subject.title !== title) return subject;
    const nextEnabled = enabled ?? !subject.enabled;
    return {
      ...subject,
      enabled: nextEnabled,
      events: subject.events.map((event) => ({
        ...event,
        enabled: nextEnabled,
      })),
    };
  });
}

export function toggleScheduleEvent(subjects, subjectTitle, eventIndex) {
  return subjects.map((subject) => {
    if (subject.title !== subjectTitle) return subject;
    const events = subject.events.map((event, index) =>
      index === eventIndex ? { ...event, enabled: !event.enabled } : event,
    );
    return {
      ...subject,
      enabled: events.some((event) => event.enabled),
      events,
    };
  });
}

export function getEnabledEventCodes(subjects) {
  return getEnabledEvents(subjects).map(getEventCode);
}
