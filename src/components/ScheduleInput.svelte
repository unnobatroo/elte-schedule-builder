<script>
  import {
    createCalendarEvents,
    fetchSubjectData,
    parseSubjectCodes,
    processSubjectCode,
  } from "../utils/schedule";
  import {
    getActiveSchedule,
    loadScheduleStore,
  } from "../utils/scheduleStorage";

  let {
    isLoading = false,
    loadingProgress = { current: 0, total: 0 },
    importedCodes = { baseCodes: "", fullCodes: [] },
    onScheduleUpdate,
    onExportToGoogle,
    onShare,
    onImportComplete,
  } = $props();

  let inputValue = $state("");
  let error = $state("");
  let currentSubject = $state("");
  let failedSubjects = $state([]);
  let showFailedSubjects = $state(false);

  $effect(() => {
    if (importedCodes.baseCodes && !inputValue) {
      inputValue = importedCodes.baseCodes;
      processSubjects();
    }
  });

  async function processSubjects() {
    const isImport = importedCodes.fullCodes?.length > 0;
    // This set is local to this invocation and is not rendered reactive state.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const subjectCodesSet = new Set();
    showFailedSubjects = false;

    if (inputValue.trim()) {
      const inputCodes = parseSubjectCodes(inputValue);
      if (importedCodes.baseCodes) {
        parseSubjectCodes(importedCodes.baseCodes)
          .map(processSubjectCode)
          .forEach((code) => subjectCodesSet.add(code));
      } else {
        inputCodes.forEach((code) => subjectCodesSet.add(code));
      }
    }

    // Refresh only the currently selected schedule.
    const subjects = getActiveSchedule(
      loadScheduleStore(localStorage),
    ).subjects;
    const storedCodes = subjects.flatMap((subject) =>
      subject.code.split(", ").map(processSubjectCode),
    );
    storedCodes.forEach((code) => subjectCodesSet.add(code));

    // Convert Set to Array
    const subjectCodes = Array.from(subjectCodesSet);

    if (subjectCodes.length === 0) {
      error = "No subject codes found in input or saved subjects.";
      return;
    }

    isLoading = true;
    error = "";
    failedSubjects = [];
    loadingProgress = { current: 0, total: subjectCodes.length };
    const events = [];

    try {
      for (const code of subjectCodes) {
        currentSubject = code;
        try {
          const classes = await fetchSubjectData(code);
          if (classes && classes.length > 0) {
            const parsedEvents = createCalendarEvents(classes);
            if (parsedEvents.length > 0) {
              // If we have imported codes, mark only the specific events as enabled
              if (importedCodes.fullCodes?.length > 0) {
                parsedEvents.forEach((event) => {
                  const eventCode = event.description.split("\n")[0];
                  event.enabled = importedCodes.fullCodes.includes(eventCode);
                });
              } else {
                // For manually entered codes, enable all events
                parsedEvents.forEach((event) => {
                  event.enabled = true;
                });
              }
              events.push(...parsedEvents);
            } else {
              failedSubjects = [
                ...failedSubjects,
                {
                  code,
                  title:
                    classes[0]?.title?.split("(")[0]?.trim() ||
                    "Unknown Subject",
                },
              ];
            }
          } else {
            failedSubjects = [
              ...failedSubjects,
              {
                code,
                title: "Unknown Subject",
              },
            ];
          }
        } catch (err) {
          console.error(`Error fetching data for ${code}:`, err);
          failedSubjects = [
            ...failedSubjects,
            {
              code,
              title: "Unknown Subject",
            },
          ];
        }
        loadingProgress = {
          ...loadingProgress,
          current: loadingProgress.current + 1,
        };
      }

      if (events.length > 0) {
        onScheduleUpdate?.(events);
      }

      if (failedSubjects.length > 0) {
        showFailedSubjects = true;
      }
    } catch (err) {
      console.error("Error processing subjects:", err);
      error = "Failed to fetch schedule data. Please try again.";
    } finally {
      isLoading = false;
      currentSubject = "";
      loadingProgress = { current: 0, total: 0 };
      // Clear imported codes after processing
      importedCodes = { baseCodes: "", fullCodes: [] };
      if (isImport) onImportComplete?.();
      // Clear input field
      inputValue = "";
    }
  }
</script>

<div class="input-container">
  <textarea
    bind:value={inputValue}
    placeholder="Enter subject codes separated by space, newline, or comma"
    disabled={isLoading}></textarea>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  {#if isLoading}
    <div class="loading-info">
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {(loadingProgress.current / loadingProgress.total) *
            100}%"
        ></div>
      </div>
      <div class="progress-text">
        Processing {currentSubject} ({loadingProgress.current}/{loadingProgress.total})
      </div>
    </div>
  {/if}
  {#if showFailedSubjects && failedSubjects.length > 0}
    <div class="failed-subjects">
      <div class="failed-header">
        No data found for {failedSubjects.length} subject{failedSubjects.length ===
        1
          ? ""
          : "s"}:
        <button class="close-btn" onclick={() => (showFailedSubjects = false)}
          >×</button
        >
      </div>
      <div class="failed-list">
        {#each failedSubjects as subject (subject.code)}
          <div class="failed-item">
            <span class="failed-code">{subject.code}</span>
            <span class="failed-title">{subject.title}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  <div class="buttons">
    <button class="primary" onclick={processSubjects} disabled={isLoading}>
      {#if isLoading}
        Loading...
      {:else}
        Generate/Update Schedule
      {/if}
    </button>
    <button onclick={onExportToGoogle} disabled={isLoading}>
      Export to Google Calendar
    </button>
    <button class="share" onclick={onShare} disabled={isLoading}>
      Share Schedule
    </button>
  </div>
</div>

<style>
  .input-container {
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  textarea {
    width: 70%;
    height: 100px;
    margin-bottom: 15px;
    padding: 12px;
    background: #2d2d2d;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    color: #ffffff;
    font-family: inherit;
    resize: vertical;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  textarea::placeholder {
    color: #808080;
  }

  textarea:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-info {
    width: 70%;
    background: #2d2d2d;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 15px;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #3d3d3d;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: #4caf50;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.9em;
    color: #b0b0b0;
    text-align: center;
  }

  .failed-subjects {
    width: 70%;
    background: #2d2d2d;
    border-radius: 6px;
    margin-bottom: 15px;
    border: 1px solid #3d3d3d;
  }

  .failed-header {
    padding: 12px;
    background: #3d3d3d;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #b0b0b0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #b0b0b0;
    font-size: 1.2em;
    cursor: pointer;
    padding: 0 4px;
  }

  .close-btn:hover {
    color: #ffffff;
  }

  .failed-list {
    padding: 12px;
    max-height: 150px;
    overflow-y: auto;
  }

  .failed-item {
    padding: 8px;
    background: #3d3d3d;
    border-radius: 4px;
    margin-bottom: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .failed-code {
    font-family: monospace;
    color: #ff9800;
  }

  .failed-title {
    font-size: 0.9em;
    color: #b0b0b0;
  }

  .failed-item:last-child {
    margin-bottom: 0;
  }

  .error {
    width: 70%;
    color: #ff5252;
    margin-bottom: 15px;
    font-size: 0.9em;
    text-align: center;
  }

  .buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition:
      transform 0.2s,
      background-color 0.2s,
      box-shadow 0.2s;
    background: #2d2d2d;
    color: #ffffff;
    border: 1px solid #3d3d3d;
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  button.primary {
    background: #4caf50;
    border: none;
  }

  button.primary:hover:not(:disabled) {
    background: #45a049;
  }

  button.share {
    background: #2196f3;

    border: none;
  }

  button.share:hover:not(:disabled) {
    background: #64b5f6;
  }

  @media (max-width: 768px) {
    textarea,
    .loading-info,
    .failed-subjects,
    .error {
      width: 90%;
    }
  }
</style>
