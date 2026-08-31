<script>
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import {
    getEventGroupNumber,
    getNextWeekDateForDay,
    formatDateToCompact,
    isLectureType,
  } from "../utils/schedule.js";
  import { language, t } from "../utils/i18n.js";

  let { isOpen = false, onClose, events = [] } = $props();
  let exportError = $state("");

  function formatEventLabel(event) {
    const type = event.extendedProps?.type || "";
    const shortType = isLectureType(type)
      ? t($language, "lecture")
      : t($language, "practice");
    const group = getEventGroupNumber(event);
    return `${shortType} - ${t($language, "group")} ${group}`;
  }

  function handleExport(event) {
    const isoDateStr = getNextWeekDateForDay(event.dayOfWeek);
    const [year, month, day] = isoDateStr.split("-").map(Number);
    const eventDateObj = new Date(year, month - 1, day);
    const dateStr = formatDateToCompact(eventDateObj);

    const startTime = event.startTime.replace(":", "") + "00";
    const endTime = event.endTime.replace(":", "") + "00";

    const url =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(event.title)}` +
      `&dates=${dateStr}T${startTime}/${dateStr}T${endTime}` +
      `&location=${encodeURIComponent(event.extendedProps?.location || "")}` +
      `&details=${encodeURIComponent(`${event.description || ""}`)}` +
      `&recur=RRULE:FREQ=WEEKLY`;

    try {
      const popup = window.open(url, "_blank");
      exportError = popup ? "" : t($language, "googleCalendarFailed");
    } catch {
      exportError = t($language, "googleCalendarFailed");
    }
  }
</script>

<Modal open={isOpen} wide label={t($language, "exportDialogTitle")} {onClose}>
  <div class="export-panel">
    <button
      type="button"
      class="button button-ghost button-icon close-btn"
      aria-label={t($language, "closeExport")}
      onclick={onClose}
    >
      <Icon name="x" size={22} />
    </button>
    <h2>{t($language, "exportDialogTitle")}</h2>
    {#if exportError}
      <p class="export-error" role="alert">{exportError}</p>
    {/if}
    <ul class="events-list">
      {#each events as event (event)}
        <li class="event-item">
          <div class="event-info">
            <div class="event-title">{event.title}</div>
            <div class="event-details">
              <span class="event-type">{formatEventLabel(event)}</span>
              <span class="event-time"
                ><Icon name="clock" size={14} />
                {event.dayOfWeek}
                {event.startTime}-{event.endTime}</span
              >
              {#if event.extendedProps?.location}
                <span class="event-location"
                  ><Icon name="map-pin" size={14} />
                  {event.extendedProps.location}</span
                >
              {/if}
            </div>
          </div>
          <button
            type="button"
            class="button button-transfer export-btn"
            aria-label={t($language, "addEventToGoogle", {
              name: event.title,
              label: formatEventLabel(event),
            })}
            onclick={() => handleExport(event)}
          >
            <Icon name="external-link" size={16} />
            {t($language, "addToCalendar")}
          </button>
        </li>
      {/each}
    </ul>
  </div>
</Modal>

<style>
  .export-panel {
    position: relative;
  }

  h2 {
    color: var(--color-accent-strong);
    margin: 0 0 var(--space-5);
    font-size: var(--text-2xl);
  }

  .close-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: var(--control-sm);
    min-width: var(--control-sm);
    min-height: var(--control-sm);
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-height: 70vh;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .export-error {
    margin: 0 0 16px;
    color: var(--color-danger);
  }

  .event-item {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-4);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
  }

  .event-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
  }

  .event-title {
    font-weight: var(--weight-semibold);
    color: var(--color-text);
  }

  .event-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .event-details span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .event-type {
    color: var(--color-accent);
    font-weight: 500;
  }

  .event-time {
    color: var(--color-warning);
  }

  .event-location {
    color: var(--color-info);
  }

  .export-btn {
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .event-item {
      flex-direction: column;
      align-items: stretch;
    }

    .export-btn {
      margin-top: 12px;
      justify-content: center;
    }
  }
</style>
