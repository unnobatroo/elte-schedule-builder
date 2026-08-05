<script>
  import { onDestroy } from "svelte";

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

  function formatEventLabel(event) {
    const type = event.extendedProps?.type || "";
    const shortType = type.includes("lecture") ? "L" : "Pr";
    return `${shortType} ${event.dayOfWeek} ${event.startTime}-${event.endTime}`;
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
          onmouseenter={() => showEvents(subject.title)}
          onmouseleave={() => hideEvents(subject.title)}
        >
          {#each subject.events as event, eventIndex (event)}
            <label class="event-toggle" class:conflict={event.hasConflict}>
              <input
                type="checkbox"
                checked={event.enabled}
                aria-checked={event.enabled}
                onchange={() => onToggleEvent?.(subject.title, eventIndex)}
              />
              <span class="event-label">{formatEventLabel(event)}</span>
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
    z-index: 10;
    background: #3d3d3d;
    border-radius: 4px;
    padding: 8px;
    margin-top: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    min-width: 200px;
  }

  .event-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .event-label {
    color: #ffffff;
    font-size: 0.85em;
    white-space: nowrap;
  }

  .event-toggle.conflict .event-label {
    color: #ff4444;
    font-weight: bold;
  }

  .event-toggle.conflict .event-label::after {
    content: " ⚠️";
    margin-left: 4px;
  }

  @media (max-width: 768px) {
    .subject-toggles {
      padding: 10px;
    }
  }
</style>
