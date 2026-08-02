<script>
  import { onMount } from "svelte";
  import ScheduleInput from "./components/ScheduleInput.svelte";
  import Calendar from "./components/Calendar.svelte";
  import FAQ from "./components/FAQ.svelte";
  import ExportModal from "./components/ExportModal.svelte";
  import ColorLegend from "./components/ColorLegend.svelte";
  import GitHubStarLink from "./components/GitHubStarLink.svelte";
  import ScheduleManager from "./components/ScheduleManager.svelte";
  import {
    decodeSchedule,
    encodeSchedule,
    markConflicts,
  } from "./utils/schedule.js";
  import {
    activateSchedule,
    addSchedule,
    getActiveSchedule,
    getUniqueScheduleName,
    loadScheduleStore,
    removeSchedule,
    renameSchedule,
    saveScheduleStore,
    updateActiveSchedule,
  } from "./utils/scheduleStorage.js";

  let events = $state([]);
  let allSubjects = $state([]);
  let hoveredSubject = $state(null);
  let hoverTimeout = $state(null);
  let showFAQ = $state(false);
  let showWarning = $state(false);
  let showExportModal = $state(false);
  let showMobileWarning = $state(false);
  let faqRead = $state(false);
  let showCopiedIndicator = $state(false);
  let importedCodes = $state({ baseCodes: "", fullCodes: [] });
  let lectureExemption = $state(false);
  let scheduleStore = $state(null);
  let schedules = $state([]);
  let activeScheduleId = $state("");
  const githubRepositoryUrl =
    import.meta.env.VITE_GITHUB_REPOSITORY_URL?.trim() ||
    "https://github.com/w04m1/elte-schedule-builder";

  onMount(() => {
    const path = window.location.pathname;
    let storedSchedules = loadScheduleStore(localStorage);

    // Shared schedules always get their own profile, preserving local schedules.
    if (path.startsWith("/import/")) {
      const base64String = path.split("/import/")[1];
      const { baseCodes, fullCodes, lectureExemption: importedExemption } =
        decodeSchedule(base64String);
      if (fullCodes.length > 0) {
        storedSchedules = addSchedule(storedSchedules, {
          name: getUniqueScheduleName(storedSchedules, "Imported schedule"),
          lectureExemption: importedExemption,
        });
        saveScheduleStore(localStorage, storedSchedules);
        importedCodes = { baseCodes, fullCodes };
      }
      // Remove the import path from URL without reloading
      window.history.replaceState({}, "", "/");
    }
    applyScheduleStore(storedSchedules);

    // Check if warning was shown before
    const warningShown = localStorage.getItem("warningShown");
    if (!warningShown) {
      showWarning = true;
    }

    // Check if FAQ was read before
    faqRead = localStorage.getItem("faqRead") === "true";

    const mql = window.matchMedia(
      "(max-width: 768px) and (orientation: portrait)"
    );
    const mobileWarningShown = localStorage.getItem("mobileWarningShown");
    showMobileWarning = mql.matches && !mobileWarningShown;

    const handleOrientationChange = (e) => {
      showMobileWarning =
        e.matches && !localStorage.getItem("mobileWarningShown");
    };

    const handleStoredScheduleUpdate = () => {
      applyScheduleStore(loadScheduleStore(localStorage));
    };

    mql.addEventListener("change", handleOrientationChange);
    window.addEventListener("scheduleUpdated", handleStoredScheduleUpdate);

    return () => {
      mql.removeEventListener("change", handleOrientationChange);
      window.removeEventListener("scheduleUpdated", handleStoredScheduleUpdate);
    };
  });

  function closeWarning() {
    showWarning = false;
    localStorage.setItem("warningShown", "true");
  }

  function closeMobileWarning() {
    showMobileWarning = false;
    localStorage.setItem("mobileWarningShown", "true");
  }

  function handleScheduleUpdate(eventData) {

    // Group events by subject title (removing anything in parentheses)
    const eventsByTitle = eventData.reduce((acc, event) => {
      // Extract code from description
      const code = event.description.split("\n")[0].trim();
      // Get clean title without anything in parentheses and remove trailing L/P/L+Pr
      const cleanTitle = event.title
        .split("(")[0]
        .trim()
        .replace(/\s*[LP]\.\s*$/, "") // Remove trailing L or P
        .replace(/\s*L\+Pr\.\s*$/, "") // Remove trailing L+Pr. (with dot)
        .trim();

      if (!acc[cleanTitle]) {
        acc[cleanTitle] = [];
      }
      acc[cleanTitle].push({
        ...event,
        code,
      });
      return acc;
    }, {});

    // Update allSubjects with new events
    const updatedSubjects = [...allSubjects];
    Object.entries(eventsByTitle).forEach(([title, events]) => {
      const existingIndex = updatedSubjects.findIndex((s) => s.title === title);
      if (existingIndex === -1) {
        // Add new subject
        updatedSubjects.push({
          title,
          // Join all unique codes with comma
          code: [...new Set(events.map((e) => e.code))].join(", "),
          events: events,
          enabled: events.some((e) => e.enabled),
        });
      } else {
        // Update existing subject, preserving enabled states
        const existingEvents = updatedSubjects[existingIndex].events;
        const updatedEvents = events.map((newEvent) => {
          const existingEvent = existingEvents.find(
            (e) =>
              e.dayOfWeek === newEvent.dayOfWeek &&
              e.startTime === newEvent.startTime &&
              e.type === newEvent.type
          );
          return {
            ...newEvent,
            enabled: existingEvent ? existingEvent.enabled : newEvent.enabled,
          };
        });

        updatedSubjects[existingIndex] = {
          ...updatedSubjects[existingIndex],
          events: updatedEvents,
          // Update codes in case new ones were added
          code: [
            ...new Set([
              ...updatedSubjects[existingIndex].code.split(", "),
              ...events.map((e) => e.code),
            ]),
          ].join(", "),
          enabled: updatedEvents.some((e) => e.enabled),
        };
      }
    });

    allSubjects = updatedSubjects;
    computeConflicts();
    saveAndUpdate();
    if (importedCodes.fullCodes.length > 0) {
      importedCodes = { baseCodes: "", fullCodes: [] };
    }
  }

  function saveAndUpdate() {
    const currentStore = scheduleStore ?? loadScheduleStore(localStorage);
    scheduleStore = updateActiveSchedule(currentStore, {
      subjects: allSubjects,
      lectureExemption,
    });
    saveScheduleStore(localStorage, scheduleStore);
    schedules = scheduleStore.schedules;
    updateEvents();
  }

  function applyScheduleStore(store) {
    scheduleStore = store;
    schedules = store.schedules;
    activeScheduleId = store.activeScheduleId;
    const activeSchedule = getActiveSchedule(store);
    allSubjects = activeSchedule.subjects;
    lectureExemption = activeSchedule.lectureExemption;
    hoveredSubject = null;
    computeConflicts();
  }

  function persistAndApply(store) {
    saveScheduleStore(localStorage, store);
    applyScheduleStore(store);
  }

  function createSchedule() {
    persistAndApply(addSchedule(scheduleStore ?? loadScheduleStore(localStorage)));
  }

  function switchSchedule(scheduleId) {
    if (scheduleId === activeScheduleId) return;
    persistAndApply(activateSchedule(scheduleStore, scheduleId));
  }

  function handleRenameSchedule(scheduleId, name) {
    scheduleStore = renameSchedule(scheduleStore, scheduleId, name);
    saveScheduleStore(localStorage, scheduleStore);
    schedules = scheduleStore.schedules;
  }

  function deleteSchedule(scheduleId) {
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule || schedules.length === 1) return;
    if (!confirm(`Delete "${schedule.name}"? This cannot be undone.`)) return;
    persistAndApply(removeSchedule(scheduleStore, scheduleId));
  }

  function updateEvents() {
    events = allSubjects
      .filter((subject) => subject.enabled)
      .flatMap((subject) => subject.events.filter((event) => event.enabled));
  }

  function toggleSubject(title, allEnabled = null) {
    allSubjects = allSubjects.map((subject) => {
      if (subject.title === title) {
        const newEnabled = allEnabled ?? !subject.enabled;
        return {
          ...subject,
          enabled: newEnabled,
          events: subject.events.map((event) => ({
            ...event,
            enabled: newEnabled,
          })),
        };
      }
      return subject;
    });
    computeConflicts();
    saveAndUpdate();
  }

  function toggleEvent(subjectTitle, eventIndex) {
    allSubjects = allSubjects.map((subject) => {
      if (subject.title === subjectTitle) {
        const updatedEvents = subject.events.map((event, idx) =>
          idx === eventIndex ? { ...event, enabled: !event.enabled } : event
        );

        // Update subject's enabled state based on events
        return {
          ...subject,
          enabled: updatedEvents.some((e) => e.enabled),
          events: updatedEvents,
        };
      }
      return subject;
    });
    computeConflicts();
    saveAndUpdate();
  }

  function deleteSubject(title) {
    allSubjects = allSubjects.filter((subject) => subject.title !== title);
    computeConflicts();
    saveAndUpdate();
  }

  function resetAll() {
    if (confirm("Clear all subjects from this schedule?")) {
      allSubjects = [];
      events = [];
      saveAndUpdate();
    }
  }

  function formatEventLabel(event) {
    const type = event.extendedProps?.type || "";
    const shortType = type.includes("lecture") ? "L" : "Pr";
    return `${shortType} ${event.dayOfWeek} ${event.startTime}-${event.endTime}`;
  }

  function handleExportToGoogle() {
    if (!events.length) return;
    showExportModal = true;
  }

  function handleMouseEnter(code) {
    clearTimeout(hoverTimeout);
    hoveredSubject = code;
  }

  function handleMouseLeave(code) {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      if (hoveredSubject === code) {
        hoveredSubject = null;
      }
    }, 300); // 300ms delay before closing
  }

  function computeConflicts() {
    allSubjects = markConflicts(allSubjects, lectureExemption);
    updateEvents();
  }

  function toggleLectureExemption(value) {
    lectureExemption = value;
    computeConflicts();
    saveAndUpdate();
  }

  function closeFAQ() {
    showFAQ = false;
    if (!faqRead) {
      faqRead = true;
      localStorage.setItem("faqRead", "true");
    }
  }

  function getActiveCodes() {
    return allSubjects
      .filter((subject) => subject.enabled)
      .flatMap((subject) => subject.events.filter((event) => event.enabled))
      .map((event) => event.description.split("\n")[0]);
  }

  async function handleShare() {
    const base64String = encodeSchedule(getActiveCodes(), lectureExemption);
    const shareUrl = `${window.location.origin}/import/${base64String}`;

    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback to older method
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed"; // Avoid scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback clipboard copy failed:", err);
        }

        document.body.removeChild(textarea);
      }

      showCopiedIndicator = true;
      setTimeout(() => {
        showCopiedIndicator = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }
</script>

<main>
  <div class="container">
    <div class="header">
      <h1>ELTE Schedule Builder</h1>
      <div class="header-buttons">
        {#if githubRepositoryUrl}
          <GitHubStarLink href={githubRepositoryUrl} />
        {/if}
        <button
          class="faq-btn {!faqRead ? 'glow' : ''}"
          onclick={() => {
            showFAQ = true;
            if (!faqRead) {
              faqRead = true;
              localStorage.setItem("faqRead", "true");
            }
          }}
        >
          FAQ & Guide
        </button>
        {#if allSubjects.length > 0}
          <button class="reset-btn" onclick={resetAll}>Reset All</button>
        {/if}
      </div>
    </div>
    {#key activeScheduleId}
      <ScheduleInput
        onScheduleUpdate={handleScheduleUpdate}
        onExportToGoogle={handleExportToGoogle}
        onShare={handleShare}
        onImportComplete={() => (importedCodes = { baseCodes: "", fullCodes: [] })}
        {importedCodes}
      />
    {/key}
    {#if allSubjects.length > 0}
      <div class="subject-toggles">
        {#each allSubjects as subject (subject.title)}
          <div
            class="toggle-container"
            role="button"
            tabindex="0"
            aria-expanded={hoveredSubject === subject.title}
            aria-label={`Toggle ${subject.title} events`}
            onmouseenter={() => handleMouseEnter(subject.title)}
            onmouseleave={() => handleMouseLeave(subject.title)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                hoveredSubject =
                  hoveredSubject === subject.title ? null : subject.title;
              }
            }}
          >
            <label class="toggle">
              <input
                type="checkbox"
                checked={subject.enabled}
                onchange={() => toggleSubject(subject.title)}
              />
              <span class="toggle-label">{subject.title}</span>
            </label>
            <button
              class="delete-btn"
              onclick={() => deleteSubject(subject.title)}
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
                onmouseenter={() => handleMouseEnter(subject.title)}
                onmouseleave={() => handleMouseLeave(subject.title)}
              >
                {#each subject.events as event, eventIndex}
                  <label
                    class="event-toggle {event.hasConflict ? 'conflict' : ''}"
                  >
                    <input
                      type="checkbox"
                      checked={event.enabled}
                      aria-checked={event.enabled}
                      onchange={() => toggleEvent(subject.title, eventIndex)}
                    />
                    <span class="event-label">{formatEventLabel(event)}</span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    <Calendar {events} {lectureExemption} />
    <footer class="footer">
      {#if githubRepositoryUrl}
        <div class="github-footer-callout">
          <span>Found this useful? Support the project:</span>
          <GitHubStarLink href={githubRepositoryUrl} />
        </div>
      {/if}
      <div class="contact-info">
        <span>Contact:</span>
        <a href="mailto:w04m1@proton.me" class="contact-link">w04m1@proton.me</a
        >
        <span class="separator">•</span>
        <a
          href="https://t.me/igenigenigen"
          class="contact-link"
          target="_blank"
          rel="noopener noreferrer">Telegram</a
        >
      </div>
      <div class="credits">
        by <a
          href="https://blog.w04m1.dev"
          class="contact-link"
          target="_blank"
          rel="noopener noreferrer">Daniil Sherstennikov</a
        > 😶‍🌫️
      </div>
    </footer>
  </div>
  <ColorLegend
    {lectureExemption}
    onToggleLectureExemption={toggleLectureExemption}
  />
  <ScheduleManager
    {schedules}
    {activeScheduleId}
    onCreate={createSchedule}
    onSwitch={switchSchedule}
    onRename={handleRenameSchedule}
    onDelete={deleteSchedule}
  />
  {#if showCopiedIndicator}
    <div class="copied-indicator">Share link copied to clipboard!</div>
  {/if}
</main>

<FAQ isOpen={showFAQ} onClose={closeFAQ} />

<ExportModal
  isOpen={showExportModal}
  onClose={() => (showExportModal = false)}
  {events}
/>

{#if showWarning}
  <div class="warning-backdrop">
    <div
      class="warning-modal"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Escape") closeWarning();
      }}
    >
      <h2>⚠️ Important Notice ⚠️</h2>
      <div class="warning-content">
        <ul>
          <li>
            <strong>Not affiliated</strong> with ELTE University.
          </li>
          <li>
            Data is fetched from Tanrend. It is there, you just can't see it.
          </li>
          <li>
            Developer takes <strong>no responsibility</strong> for errors or
            inaccuracies.
            <br />
            <i>(I don't have control over the source data)</i>
          </li>
          <li>Found a bug? Please contact the developer.</li>
        </ul>
        <div class="acknowledge-container">
          <button class="understand-btn" onclick={closeWarning}
            >I Understand</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showMobileWarning}
  <div class="warning-backdrop">
    <div
      class="warning-modal mobile-warning"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === "Escape") closeMobileWarning();
      }}
    >
      <h2>📱 Mobile Device Detected</h2>
      <div class="warning-content">
        <p>This website is designed for desktop/laptop viewing.</p>
        <ul>
          <li>
            For the best experience, please use a desktop or laptop computer.
          </li>
          <li>
            If you must use a mobile device, try rotating your device to
            landscape mode.
          </li>
        </ul>
        <div class="acknowledge-container">
          <button class="understand-btn" onclick={closeMobileWarning}
            >Continue Anyway</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #121212;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  }

  main {
    min-height: 100vh;
    padding: 20px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  h1 {
    margin: 0;
    margin-right: 20px;
    font-size: 2em;
    font-weight: 600;
    color: #4caf50;
  }

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

  .toggle:hover {
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

  .reset-btn {
    padding: 8px 16px;
    background: #d32f2f;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .reset-btn:hover {
    background: #f44336;
  }

  @media (max-width: 768px) {
    .container {
      padding: 15px;
    }

    h1 {
      font-size: 1.5em;
    }

    .subject-toggles {
      padding: 10px;
    }
  }

  .event-dropdown {
    position: absolute;
    top: calc(100% - 4px); /* Reduce the gap to prevent mouse leaving */
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

  .event-toggle:hover {
    background: #4d4d4d;
  }

  .event-label {
    font-size: 0.85em;
    white-space: nowrap;
  }

  .header-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .faq-btn {
    padding: 8px 16px;
    background: #4caf50;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .faq-btn.glow {
    animation: glow 2s ease-in-out infinite;
    box-shadow: 0 0 10px #4caf50;
  }

  @keyframes glow {
    0% {
      box-shadow: 0 0 10px #4caf50;
    }
    50% {
      box-shadow:
        0 0 20px #4caf50,
        0 0 30px #45a049;
    }
    100% {
      box-shadow: 0 0 10px #4caf50;
    }
  }

  .faq-btn:hover {
    background: #45a049;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .header-buttons {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #2d2d2d;
    text-align: center;
  }

  .github-footer-callout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 18px;
    color: #d0d0d0;
  }

  .contact-info {
    color: #b0b0b0;
    font-size: 0.9em;
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .contact-link {
    color: #4caf50;
    text-decoration: none;
    transition: color 0.2s;
  }

  .contact-link:hover {
    color: #45a049;
    text-decoration: underline;
  }

  .separator {
    color: #4d4d4d;
  }

  .credits {
    margin-top: 12px;
    color: #808080;
    font-size: 1em;
    text-align: center;
  }

  @media (max-width: 768px) {
    .github-footer-callout {
      flex-direction: column;
    }

    .contact-info {
      flex-direction: column;
      gap: 8px;
    }

    .separator {
      display: none;
    }
  }

  .warning-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .warning-modal {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    margin: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .warning-modal h2 {
    color: #ffa726;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .warning-content {
    color: #ffffff;
  }

  .warning-content p {
    margin: 0 0 12px 0;
  }

  .warning-content ul {
    margin: 0 0 20px 0;
    padding-left: 0;
    list-style-type: none;
  }

  .warning-content li {
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .warning-content strong {
    color: #ff5252;
  }

  .acknowledge-container {
    text-align: center;
  }

  .understand-btn {
    width: auto;
    padding: 12px 24px;
    background: #4caf50;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .understand-btn:hover {
    background: #45a049;
  }

  /* Style for conflicting events in the dropdown */
  .event-toggle.conflict .event-label {
    color: #ff4444; /* Red color for conflicts */
    font-weight: bold;
  }

  /* Optionally, add a tooltip or an icon to indicate conflict */
  .event-toggle.conflict .event-label::after {
    content: " ⚠️";
    margin-left: 4px;
  }

  /* Ensure non-conflicting events have normal styling */
  .event-toggle:not(.conflict) .event-label {
    color: #ffffff;
  }

  .mobile-warning {
    max-width: 90%;
    width: 400px;
  }

  .mobile-warning h2 {
    color: #64b5f6;
  }

  @media (orientation: landscape) {
    .mobile-warning {
      display: none;
    }
  }

  .copied-indicator {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4caf50;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: fadeInOut 2s ease-in-out;
    outline: 2px solid #121212;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    85% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }
</style>
