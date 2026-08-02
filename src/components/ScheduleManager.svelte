<script>
  import { onMount } from "svelte";

  let {
    schedules = [],
    activeScheduleId = "",
    onCreate,
    onSwitch,
    onRename,
    onDelete,
  } = $props();

  const STORAGE_KEY = "scheduleManagerVisible";
  let isVisible = $state(true);
  let editingId = $state("");
  let editingName = $state("");

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) isVisible = stored === "true";
  });

  function toggleVisibility() {
    isVisible = !isVisible;
    localStorage.setItem(STORAGE_KEY, isVisible ? "true" : "false");
  }

  function beginRename(schedule) {
    editingId = schedule.id;
    editingName = schedule.name;
  }

  function finishRename() {
    if (editingName.trim()) onRename?.(editingId, editingName);
    editingId = "";
    editingName = "";
  }
</script>

<aside class="schedule-manager" class:hidden={!isVisible} aria-label="Schedule manager">
  <button
    type="button"
    class="toggle-btn"
    onclick={toggleVisibility}
    title={isVisible ? "Hide schedule manager" : "Show schedule manager"}
    aria-label={isVisible ? "Hide schedule manager" : "Show schedule manager"}
  >
    {isVisible ? "↓" : "↑"}
  </button>
  <div class="manager-content">
    <div class="manager-header">
      <h3>My schedules</h3>
      <button type="button" class="create-btn" onclick={() => onCreate?.()}>
        + New
      </button>
    </div>
    <div class="schedule-list">
      {#each schedules as schedule (schedule.id)}
        <div class:active={schedule.id === activeScheduleId} class="schedule-row">
          {#if editingId === schedule.id}
            <form onsubmit={(event) => { event.preventDefault(); finishRename(); }}>
              <input
                aria-label="Schedule name"
                bind:value={editingName}
                onkeydown={(event) => {
                  if (event.key === "Escape") editingId = "";
                }}
              />
              <button type="submit" title="Save name" aria-label="Save schedule name">✓</button>
            </form>
          {:else}
            <button
              type="button"
              class="schedule-name"
              class:active={schedule.id === activeScheduleId}
              onclick={() => onSwitch?.(schedule.id)}
              aria-current={schedule.id === activeScheduleId ? "true" : undefined}
            >
              {schedule.name}
            </button>
            <button
              type="button"
              class="icon-btn"
              onclick={() => beginRename(schedule)}
              title={`Rename ${schedule.name}`}
              aria-label={`Rename ${schedule.name}`}
            >✎</button>
            <button
              type="button"
              class="icon-btn delete"
              onclick={() => onDelete?.(schedule.id)}
              disabled={schedules.length === 1}
              title={schedules.length === 1 ? "You must keep at least one schedule" : `Delete ${schedule.name}`}
              aria-label={`Delete ${schedule.name}`}
            >×</button>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</aside>

<style>
  .schedule-manager {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    width: min(440px, calc(100vw - 48px));
    padding: 14px;
    border-radius: 8px;
    background: #2d2d2d;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    z-index: 120;
    transition: transform 0.3s ease;
  }

  .schedule-manager.hidden {
    transform: translateX(-50%) translateY(calc(100% + 18px));
  }

  .schedule-manager.hidden .manager-content {
    opacity: 0;
    pointer-events: none;
  }

  .toggle-btn {
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    width: 44px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 4px 4px 0 0;
    background: #2d2d2d;
    color: #fff;
  }

  .manager-content { transition: opacity 0.2s ease; }
  .manager-header, .schedule-row, form { display: flex; align-items: center; gap: 8px; }
  .manager-header { justify-content: space-between; margin-bottom: 10px; }
  h3 { margin: 0; font-size: 1em; }
  .schedule-list { display: grid; gap: 6px; max-height: 180px; overflow-y: auto; }
  .schedule-row { padding: 5px; border-radius: 6px; background: #383838; }
  .schedule-row.active { box-shadow: inset 3px 0 #4caf50; }
  .schedule-name { flex: 1; overflow: hidden; text-overflow: ellipsis; text-align: left; background: transparent; color: #ddd; }
  .schedule-name.active { color: #72d576; font-weight: 600; }
  .create-btn { background: #4caf50; color: #fff; border: 0; }
  .icon-btn { width: 34px; padding: 6px; background: #484848; color: #fff; }
  .icon-btn.delete { color: #ff8a80; }
  .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  form { width: 100%; }
  input { flex: 1; min-width: 0; padding: 8px; border: 1px solid #5d5d5d; border-radius: 4px; background: #202020; color: #fff; }

  @media (max-width: 768px) {
    .schedule-manager { bottom: 12px; width: calc(100vw - 56px); }
  }
</style>
