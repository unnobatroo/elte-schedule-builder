<script>
  import { onDestroy } from "svelte";
  import { getEventGroupNumber } from "../utils/schedule";

  let {
    subjects = [],
    onToggleSubject,
    onToggleEvent,
    onDeleteSubject,
  } = $props();

  let hoveredSubject = $state(null);
  let hoverTimeout;

  onDestroy(() => clearTimeout(hoverTimeout));

  function showEvents(title) {
    clearTimeout(hoverTimeout);
    hoveredSubject = title;
  }

  function hideEvents(title) {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      if (hoveredSubject === title) hoveredSubject = null;
    }, 300);
  }

  function toggleEvents(title) {
    hoveredSubject = hoveredSubject === title ? null : title;
  }

  function getShortType(event) {
    const type = event.extendedProps?.type || "";
    return type.includes("lecture") ? "L" : "Pr";
  }

  function keepDropdownInViewport(node) {
    const viewportMargin = 16;

    function reposition() {
      node.style.transform = "";
      const bounds = node.getBoundingClientRect();
      let horizontalShift = 0;

      if (bounds.right > window.innerWidth - viewportMargin) {
        horizontalShift = window.innerWidth - viewportMargin - bounds.right;
      }
      if (bounds.left + horizontalShift < viewportMargin) {
        horizontalShift += viewportMargin - (bounds.left + horizontalShift);
      }

      node.style.transform = `translateX(${horizontalShift}px)`;
    }

    reposition();
    window.addEventListener("resize", reposition);

    return {
      destroy() {
        window.removeEventListener("resize", reposition);
      },
    };
  }
</script>

<div class="subject-toggles">
  {#each subjects as subject (subject.title)}
    <div
      class="toggle-container"
      role="button"
      tabindex="0"
      aria-expanded={hoveredSubject === subject.title}
      aria-label={`Toggle ${subject.title} events`}
      onmouseenter={() => showEvents(subject.title)}
      onmouseleave={() => hideEvents(subject.title)}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleEvents(subject.title);
        }
      }}
    >
      <label class="toggle">
        <input
          type="checkbox"
          checked={subject.enabled}
          onchange={() => onToggleSubject?.(subject.title)}
        />
        <span class="toggle-label">{subject.title}</span>
      </label>
      <button
        class="delete-btn"
        onclick={() => onDeleteSubject?.(subject.title)}
        title="Remove subject"
      >
        ×
      </button>
      {#if hoveredSubject === subject.title}
        <div
          class="event-dropdown"
          role="menu"
          aria-label={`${subject.title} events`}
          tabindex="0"
          use:keepDropdownInViewport
          onmouseenter={() => showEvents(subject.title)}
          onmouseleave={() => hideEvents(subject.title)}
        >
          <div class="event-grid-header" aria-hidden="true">
            <span></span>
            <span>Group</span>
            <span>Type</span>
            <span>Day</span>
            <span>Time</span>
            <span></span>
          </div>
          {#each subject.events as event, eventIndex (event)}
            <label class="event-toggle" class:conflict={event.hasConflict}>
              <input
                type="checkbox"
                checked={event.enabled}
                aria-checked={event.enabled}
                onchange={() => onToggleEvent?.(subject.title, eventIndex)}
              />
              <span class="event-cell event-group">
                {getEventGroupNumber(event) || "—"}
              </span>
              <span class="event-cell event-type">{getShortType(event)}</span>
              <span class="event-cell event-day">{event.dayOfWeek}</span>
              <span class="event-cell event-time">
                {event.startTime}-{event.endTime}
              </span>
              {#if event.hasConflict}
                <span
                  class="conflict-indicator"
                  aria-label="Time conflict"
                  title="Time conflict">⚠️</span
                >
              {:else}
                <span class="conflict-indicator" aria-hidden="true"></span>
              {/if}
            </label>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .subject-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px;
    background: #2d2d2d;
    border-radius: 8px;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #3d3d3d;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .toggle:hover,
  .event-toggle:hover {
    background: #4d4d4d;
  }

  .toggle input {
    margin: 0;
  }

  .toggle-label {
    font-size: 0.9em;
    white-space: nowrap;
  }

  .delete-btn {
    padding: 4px 8px;
    background: #ff4444;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 1.2em;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .delete-btn:hover {
    background: #ff6666;
  }

  .event-dropdown {
    position: absolute;
    top: calc(100% - 4px);
    left: 0;
    z-index: 200;
    background: #3d3d3d;
    border-radius: 4px;
    padding: 8px;
    margin-top: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    width: max-content;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    overflow-x: auto;
  }

  .event-grid-header,
  .event-toggle {
    display: grid;
    grid-template-columns:
      18px minmax(3.5rem, auto) minmax(2.5rem, auto) minmax(5.75rem, auto)
      minmax(7.75rem, auto) 1.25rem;
    align-items: center;
    column-gap: 8px;
  }

  .event-grid-header {
    padding: 2px 8px 5px;
    color: #bdbdbd;
    font-size: 0.7em;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid #555555;
  }

  .event-toggle {
    padding: 4px 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .event-toggle input {
    margin: 0;
  }

  .event-cell {
    color: #ffffff;
    font-size: 0.85em;
    white-space: nowrap;
  }

  .event-group {
    font-variant-numeric: tabular-nums;
  }

  .event-time {
    font-variant-numeric: tabular-nums;
  }

  .conflict-indicator {
    display: inline-flex;
    justify-content: center;
    font-size: 0.8em;
  }

  .event-toggle.conflict .event-cell {
    color: #ff4444;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    .subject-toggles {
      padding: 10px;
    }
  }
</style>
