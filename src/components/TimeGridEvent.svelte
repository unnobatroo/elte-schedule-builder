<script>
  let { calendarEvent } = $props();

  const event = $derived(calendarEvent.originalEvent ?? {});
  const groupNumber = $derived(
    event.description?.split("-")[2]?.split("\n")[0] || ""
  );
</script>

<div class="event-details">
  <div class="event-title">{event.title ?? calendarEvent.title}</div>
  <div class="event-group">Group {groupNumber}</div>
  <div class="event-code">{event.code ?? ""}</div>
  <div class="event-time">{event.startTime ?? ""} - {event.endTime ?? ""}</div>
  {#if event.extendedProps?.instructor}
    <div class="event-instructor">{event.extendedProps.instructor}</div>
  {/if}
  {#if event.extendedProps?.location}
    <div class="event-location">{event.extendedProps.location}</div>
  {/if}
</div>

<style>
  .event-details {
    font-size: 1.2em;
    padding: 4px;
  }

  .event-title {
    font-weight: bold;
    font-size: 0.9em;
    margin-bottom: 2px;
  }

  .event-code {
    font-size: 0.9em;
    opacity: 0.9;
  }

  .event-time {
    font-size: 0.8em;
    opacity: 0.9;
  }

  .event-group {
    font-size: 0.85em;
    opacity: 0.9;
    font-weight: 500;
  }

  .event-location,
  .event-instructor {
    font-size: 0.8em;
    opacity: 0.8;
  }
</style>
