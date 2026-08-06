<script>
  import { onMount } from "svelte";
  import Calendar from "./components/Calendar.svelte";
  import FAQ from "./components/FAQ.svelte";
  import ColorLegend from "./components/ColorLegend.svelte";
  import ScheduleManager from "./components/ScheduleManager.svelte";
  import SubjectControls from "./components/SubjectControls.svelte";
  import AppNotices from "./components/AppNotices.svelte";
  import AppFooter from "./components/AppFooter.svelte";
  import AppHeader from "./components/AppHeader.svelte";
  import ScheduleWorkspace from "./components/ScheduleWorkspace.svelte";
  import { decodeSchedule, markConflicts } from "./utils/schedule.js";
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
  let showMobileWarning = $state(false);
  let faqRead = $state(false);
  let importedCodes = $state({ baseCodes: "", fullCodes: [] });
  let lectureExemption = $state(false);
  let scheduleStore = $state(null);
  let schedules = $state([]);
  let activeScheduleId = $state("");
  let activeCodes = $derived(getEnabledEventCodes(allSubjects));
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

  function openFAQ() {
    showFAQ = true;
    if (!faqRead) {
      faqRead = true;
      localStorage.setItem(STORAGE_KEYS.faqRead, "true");
    }
  }
</script>

<main>
  <div class="container">
    <AppHeader
      {githubRepositoryUrl}
      {faqRead}
      hasSubjects={allSubjects.length > 0}
      onOpenFAQ={openFAQ}
      onReset={resetAll}
    />
    {#key activeScheduleId}
      <ScheduleWorkspace
        {events}
        {activeCodes}
        {lectureExemption}
        {importedCodes}
        onScheduleUpdate={handleScheduleUpdate}
        onImportComplete={() =>
          (importedCodes = { baseCodes: "", fullCodes: [] })}
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
    <AppFooter {githubRepositoryUrl} />
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
</main>

<FAQ isOpen={showFAQ} onClose={closeFAQ} />

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

  @media (max-width: 768px) {
    .container {
      padding: 15px;
    }
  }
</style>
