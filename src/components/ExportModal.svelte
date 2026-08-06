<script>
  import {
    getNextWeekDateForDay,
    formatDateToCompact,
  } from "../utils/schedule";

  let { isOpen = false, onClose, events = [] } = $props();
  let exportError = $state("");

  function formatEventLabel(event) {
    const type = event.extendedProps?.type || "";
    const shortType = type.includes("lecture") ? "Lecture" : "Practice";
    const code = event.description.split("\n")[0].trim();
    const group = code.split("-")[2] || "";
    return `${shortType} - Group ${group}`;
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
      exportError = popup
        ? ""
        : "Google Calendar could not be opened. Allow pop-ups and try again.";
    } catch {
      exportError =
        "Google Calendar could not be opened. Allow pop-ups and try again.";
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop">
    <div
      class="modal-content"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button class="close-btn" onclick={onClose}>×</button>
      <h2>Export to Google Calendar</h2>
      {#if exportError}
        <p class="export-error" role="alert">{exportError}</p>
      {/if}
      <div class="events-list">
        {#each events as event (event)}
          <div class="event-item">
            <div class="event-info">
              <div class="event-title">{event.title}</div>
              <div class="event-details">
                <span class="event-type">{formatEventLabel(event)}</span>
                <span class="event-time"
                  >{event.dayOfWeek} {event.startTime}-{event.endTime}</span
                >
                {#if event.extendedProps?.location}
                  <span class="event-location"
                    >{event.extendedProps.location}</span
                  >
                {/if}
              </div>
            </div>
            <button class="export-btn" onclick={() => handleExport(event)}>
              Add to Calendar
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
  }

  .modal-content {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 24px;
    max-width: 800px;
    width: 90%;
    margin: 20px auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  h2 {
    color: #4caf50;
    margin: 0 0 20px 0;
    font-size: 1.5em;
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #b0b0b0;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 2;
  }

  .close-btn:hover {
    color: #ffffff;
    background: #3d3d3d;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .export-error {
    margin: 0 0 16px;
    color: #ff8a80;
  }

  .event-item {
    background: #1a1a1a;
    border-radius: 6px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .event-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .event-title {
    font-weight: 500;
    color: #ffffff;
    text-align: left;
  }

  .event-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.9em;
    color: #b0b0b0;
    justify-content: flex-start;
  }

  .event-type {
    color: #4caf50;
  }

  .event-time {
    color: #ffa726;
  }

  .event-location {
    color: #64b5f6;
  }

  .export-btn {
    padding: 8px 16px;
    background: #4caf50;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .export-btn:hover {
    background: #45a049;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 16px;
      margin: 16px;
    }

    .event-item {
      flex-direction: column;
      align-items: stretch;
    }

    .export-btn {
      margin-top: 12px;
    }
  }
</style>
