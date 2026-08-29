<script>
  import { onDestroy } from "svelte";
  import "temporal-polyfill/global";
  import { ScheduleXCalendar } from "@schedule-x/svelte";
  import { createCalendar, createViewWeek } from "@schedule-x/calendar";
  import { createEventsServicePlugin } from "@schedule-x/events-service";

  import { createEventModalPlugin } from "@schedule-x/event-modal";
  import "@schedule-x/theme-default/dist/index.css";
  import {
    getConflictPairs,
    getEventGroupNumber,
    getWeekDateForDay,
  } from "../utils/schedule";
  import TimeGridEvent from "./TimeGridEvent.svelte";

  let { events = [], lectureExemption = false } = $props();

  const CALENDAR_TIME_ZONE = "Europe/Budapest";
  const eventModal = createEventModalPlugin();
  const eventsServicePlugin = createEventsServicePlugin();

  function formatTime(hour, minute) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function formatEvents(rawEvents) {
    const overlappingEvents = new Set(
      getConflictPairs(rawEvents, lectureExemption).flatMap(
        ({ event1, event2 }) => [event1, event2],
      ),
    );

    return rawEvents.map((event, index) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);

      const dateStr = getWeekDateForDay(event.dayOfWeek);

      const groupNumber = getEventGroupNumber(event);
      const isLecture = event.extendedProps?.type?.includes("lecture");
      const eventId = event.id || index.toString();
      const hasConflict = overlappingEvents.has(index);

      const classes = [
        isLecture ? "sx-event--is-lecture" : "sx-event--is-practice",
      ];

      if (hasConflict) {
        classes.push("sx-event--has-conflict");
      }

      return {
        id: eventId,
        title: `${event.title} (${isLecture ? "L" : "Pr"})`,
        description: `Group ${groupNumber} | ${event.code}`,
        start: Temporal.ZonedDateTime.from(
          `${dateStr}T${formatTime(startHour, startMin)}:00[${CALENDAR_TIME_ZONE}]`,
        ),
        end: Temporal.ZonedDateTime.from(
          `${dateStr}T${formatTime(endHour, endMin)}:00[${CALENDAR_TIME_ZONE}]`,
        ),
        location: event.extendedProps?.location || "",
        people: event.extendedProps?.instructor
          ? [event.extendedProps.instructor]
          : [],
        _options: {
          additionalClasses: classes,
        },
        originalEvent: event,
      };
    });
  }

  const calendarApp = createCalendar({
    views: [createViewWeek()],
    timezone: CALENDAR_TIME_ZONE,
    isDark: true,
    defaultView: "week",
    dayBoundaries: {
      start: "08:00",
      end: "22:00",
    },
    weekOptions: {
      gridHeight: 1000,
      nDays: 5,
      eventWidth: 95,
      timeAxisFormatOptions: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    },
    plugins: [eventsServicePlugin, eventModal],
    callbacks: {},
  });

  $effect(() => {
    eventsServicePlugin.set(formatEvents(events));
  });

  onDestroy(() => {
    calendarApp.destroy();
  });
</script>

<div class="calendar-wrapper">
  <ScheduleXCalendar {calendarApp} timeGridEvent={TimeGridEvent} />
</div>

<style>
  .calendar-wrapper {
    width: 100%;
    min-height: 1000px;
    max-height: 200vh;
    height: auto;
    --sx-color-primary: #2196f3;
    --sx-color-event-preview: rgba(33, 150, 243, 0.2);
  }

  :global(.sx__calendar-header) {
    display: none;
  }

  :global(.is-dark) {
    --sx-color-primary: #ffffff;
  }

  :global(.sx-event--is-lecture) {
    background-color: #4caf50 !important;
  }

  :global(.sx-event--is-practice) {
    background-color: #2196f3 !important;
  }

  :global(.sx__event) {
    cursor: pointer;
  }

  :global(.sx-event--has-conflict) {
    background-color: #ff4444 !important;
    border: 2px solid #ff0000;
  }
</style>
