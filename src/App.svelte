<script>
  import { onMount } from "svelte";
  import ScheduleInput from "./components/ScheduleInput.svelte";
  import Calendar from "./components/Calendar.svelte";
  import FAQ from "./components/FAQ.svelte";
  import ExportModal from "./components/ExportModal.svelte";
  import ColorLegend from "./components/ColorLegend.svelte";
  import GitHubStarLink from "./components/GitHubStarLink.svelte";
  import ScheduleManager from "./components/ScheduleManager.svelte";
  import SubjectControls from "./components/SubjectControls.svelte";
  import AppNotices from "./components/AppNotices.svelte";
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
  import {
    getEnabledEventCodes,
    getEnabledEvents,
    mergeScheduleEvents,
    setSubjectEnabled,
    toggleScheduleEvent,
  } from "./utils/scheduleState.js";
  import { STORAGE_KEYS } from "./utils/storageKeys.js";

  let events = $state([]);
  let allSubjects = $state([]);
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
      const {
        baseCodes,
        fullCodes,
        lectureExemption: importedExemption,
      } = decodeSchedule(base64String);
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
    const warningShown = localStorage.getItem(STORAGE_KEYS.warningShown);
    if (!warningShown) {
      showWarning = true;
    }

    // Check if FAQ was read before
    faqRead = localStorage.getItem(STORAGE_KEYS.faqRead) === "true";

    const mql = window.matchMedia(
      "(max-width: 768px) and (orientation: portrait)",
    );
    const mobileWarningShown = localStorage.getItem(
      STORAGE_KEYS.mobileWarningShown,
    );
    showMobileWarning = mql.matches && !mobileWarningShown;

    const handleOrientationChange = (e) => {
      showMobileWarning =
        e.matches && !localStorage.getItem(STORAGE_KEYS.mobileWarningShown);
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
    localStorage.setItem(STORAGE_KEYS.warningShown, "true");
  }

  function closeMobileWarning() {
    showMobileWarning = false;
    localStorage.setItem(STORAGE_KEYS.mobileWarningShown, "true");
  }

  function handleScheduleUpdate(eventData) {
    allSubjects = mergeScheduleEvents(allSubjects, eventData);
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
    computeConflicts();
  }

  function persistAndApply(store) {
    saveScheduleStore(localStorage, store);
    applyScheduleStore(store);
  }

  function createSchedule() {
    persistAndApply(
      addSchedule(scheduleStore ?? loadScheduleStore(localStorage)),
    );
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
    events = getEnabledEvents(allSubjects);
  }

  function toggleSubject(title, allEnabled = null) {
    allSubjects = setSubjectEnabled(allSubjects, title, allEnabled);
    computeConflicts();
    saveAndUpdate();
  }

  function toggleEvent(subjectTitle, eventIndex) {
    allSubjects = toggleScheduleEvent(allSubjects, subjectTitle, eventIndex);
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

  function handleExportToGoogle() {
    if (!events.length) return;
    showExportModal = true;
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
      localStorage.setItem(STORAGE_KEYS.faqRead, "true");
    }
  }

  function getActiveCodes() {
    return getEnabledEventCodes(allSubjects);
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
              localStorage.setItem(STORAGE_KEYS.faqRead, "true");
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
        onImportComplete={() =>
          (importedCodes = { baseCodes: "", fullCodes: [] })}
        {importedCodes}
      />
    {/key}
    {#if allSubjects.length > 0}
      <SubjectControls
        subjects={allSubjects}
        onToggleSubject={toggleSubject}
        onToggleEvent={toggleEvent}
        onDeleteSubject={deleteSubject}
      />
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

<AppNotices
  {showWarning}
  {showMobileWarning}
  onCloseWarning={closeWarning}
  onCloseMobileWarning={closeMobileWarning}
/>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #121212;
    color: #ffffff;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans,
      Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
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
