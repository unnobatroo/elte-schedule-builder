<script>
  import { onMount } from "svelte";
  import {
    createCalendarEvents,
    fetchSubjectData,
    parseTimeString,
  } from "../utils/schedule";
  import {
    getActiveSchedule,
    loadScheduleStore,
    saveScheduleStore,
    updateActiveSchedule,
  } from "../utils/scheduleStorage";

  let query = $state("");
  let isLoading = $state(false);
  let results = $state([]);
  let error = $state("");
  let successMessage = $state("");

  onMount(() => {
    const savedQuery = localStorage.getItem("tanrendQuery");
    const savedResults = localStorage.getItem("tanrendResults");

    if (savedQuery) {
      query = savedQuery;
    }
    if (savedResults) {
      try {
        results = JSON.parse(savedResults);
      } catch (e) {
        console.error("Failed to parse saved results:", e);
      }
    }
  });

  const dayPriority = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  function sortRows(rows) {
    return [...rows].sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) {
        return a.dayIndex - b.dayIndex;
      }
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes;
      }
      return a.code.localeCompare(b.code);
    });
  }

  function refineRows(rows) {
    return rows
      .map((r) => {
        const t = parseTimeString(r.time);
        if (!t) return null;
        const [startHour, startMinute] = t.startTime.split(":").map(Number);
        return {
          when: `${t.dayOfWeek} ${t.startTime}-${t.endTime}`,
          code: r.code,
          type: r.type,
          title: r.title,
          location: r.location,
          instructor: r.instructor,
          dayIndex: dayPriority[t.dayOfWeek] ?? Number.MAX_SAFE_INTEGER,
          startMinutes: startHour * 60 + startMinute,
        };
      })
      .filter(Boolean);
  }

  function normalizeCode(code) {
    const parts = code.split("-");
    if (parts.length > 2) {
      parts.pop();
      return parts.join("-");
    }
    return code;
  }

  async function search() {
    const codes = query
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .map(normalizeCode);

    if (codes.length === 0) {
      error = "Enter at least one subject code.";
      return;
    }
    error = "";
    isLoading = true;
    results = [];
    const aggregated = [];

    try {
      for (const code of [...new Set(codes)]) {
        const rows = await fetchSubjectData(code);
        aggregated.push(...refineRows(rows));
      }
    } catch (e) {
      console.error(e);
      error = "Failed to fetch data. Please try again.";
    } finally {
      results = sortRows(aggregated).map(
        ({ dayIndex, startMinutes, ...display }) => display
      );
      isLoading = false;

      // Save query and results to localStorage
      localStorage.setItem("tanrendQuery", query);
      localStorage.setItem("tanrendResults", JSON.stringify(results));
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      search();
    }
  }

  function eventMatchesRow(event, row) {
    const [dayOfWeek, timeRange] = row.when.split(" ");
    return event.dayOfWeek === dayOfWeek &&
      event.startTime === timeRange.split("-")[0] &&
      (event.code ?? event.description.split("\n")[0]) === row.code;
  }

  function createSelectableEvents(classes, row) {
    return createCalendarEvents(classes).map((event) => ({
      ...event,
      enabled: eventMatchesRow(event, row),
    }));
  }

  async function addToSchedule(row) {
    error = "";
    successMessage = "";

    const cleanTitle = row.title
      .split("(")[0]
      .trim()
      .replace(/\s*[LP]\.\s*$/, "")
      .replace(/\s*L\+Pr\.\s*$/, "")
      .trim();

    const apiCode = normalizeCode(row.code);

    const isLecture = row.type.toLowerCase().includes("lecture");
    const isPractice = row.type.toLowerCase().includes("practice");

    const scheduleStore = loadScheduleStore(localStorage);
    const allSubjects = structuredClone(getActiveSchedule(scheduleStore).subjects);

    const existingSubject = allSubjects.find((s) => s.title === cleanTitle);

    if (existingSubject) {
      const eventExists = existingSubject.events.some(
        (event) => event.description.split("\n")[0] === row.code
      );

      if (eventExists) {
        existingSubject.events = existingSubject.events.map((event) => {
          const eventIsLecture = event.extendedProps?.type
            ?.toLowerCase()
            .includes("lecture");
          const eventIsPractice = event.extendedProps?.type
            ?.toLowerCase()
            .includes("practice");

          if (eventMatchesRow(event, row)) {
            return { ...event, enabled: true };
          }

          if (
            (isLecture && eventIsLecture) ||
            (isPractice && eventIsPractice)
          ) {
            return { ...event, enabled: false };
          }

          return event;
        });

        existingSubject.enabled = existingSubject.events.some((e) => e.enabled);
      } else {
        try {
          const classes = await fetchSubjectData(apiCode);
          if (!classes || classes.length === 0) {
            error = `Failed to fetch data for ${apiCode}`;
            return;
          }

          const newEvents = createSelectableEvents(classes, row);

          if (newEvents.length === 0) {
            error = `No valid events found for ${apiCode}`;
            return;
          }

          const selectedEventType = row.type.toLowerCase();
          existingSubject.events = existingSubject.events.map((event) => {
            const eventType = event.extendedProps?.type?.toLowerCase() || "";
            if (
              selectedEventType.includes("lecture") &&
              eventType.includes("lecture")
            ) {
              return { ...event, enabled: false };
            } else if (
              selectedEventType.includes("practice") &&
              eventType.includes("practice")
            ) {
              return { ...event, enabled: false };
            }
            return event;
          });

          existingSubject.events.push(...newEvents);

          const existingCodes = existingSubject.code.split(", ");
          const newCodes = newEvents.map((e) => e.description.split("\n")[0]);
          existingSubject.code = [
            ...new Set([...existingCodes, ...newCodes]),
          ].join(", ");

          existingSubject.enabled = existingSubject.events.some(
            (e) => e.enabled
          );
        } catch (err) {
          console.error("Error fetching subject data:", err);
          error = `Failed to add ${apiCode} to schedule`;
          return;
        }
      }
    } else {
      try {
        const classes = await fetchSubjectData(apiCode);
        if (!classes || classes.length === 0) {
          error = `Failed to fetch data for ${apiCode}`;
          return;
        }

        const events = createSelectableEvents(classes, row);

        if (events.length === 0) {
          error = `No valid events found for ${apiCode}`;
          return;
        }

        allSubjects.push({
          title: cleanTitle,
          code: row.code,
          events: events,
          enabled: true,
        });
      } catch (err) {
        console.error("Error fetching subject data:", err);
        error = `Failed to add ${apiCode} to schedule`;
        return;
      }
    }

    saveScheduleStore(
      localStorage,
      updateActiveSchedule(scheduleStore, { subjects: allSubjects })
    );

    window.dispatchEvent(new CustomEvent("scheduleUpdated"));

    successMessage = `Added "${cleanTitle}" to schedule`;
    setTimeout(() => {
      successMessage = "";
    }, 3000);
  }
</script>

<div class="wrap">
  <div class="search">
    <input
      type="text"
      placeholder="Search by subject code"
      bind:value={query}
      onkeydown={handleKey}
    />
    <button class="primary" onclick={search} disabled={isLoading}>
      {isLoading ? "Loading..." : "Search"}
    </button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if successMessage}
    <div class="success">{successMessage}</div>
  {/if}

  {#if results.length > 0}
    <div class="table-wrap" role="region" aria-label="Search results">
      <table class="results">
        <colgroup>
          <col class="col-time" />
          <col class="col-code" />
          <col class="col-title" />
          <col class="col-place" />
          <col class="col-tutor" />
          <col class="col-action" />
        </colgroup>
        <thead>
          <tr>
            <th>Time</th>
            <th>Subject code (type)</th>
            <th>Subject name</th>
            <th>Place</th>
            <th>Course tutor</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each results as r}
            <tr>
              <td class="time">
                <div class="when">{r.when}</div>
              </td>
              <td class="code"
                ><span class="code-text">{r.code}</span>
                <span class="type">({r.type})</span></td
              >
              <td class="title">{r.title}</td>
              <td class="place">{r.location || "-"}</td>
              <td class="tutor">{r.instructor || "-"}</td>
              <td class="action">
                <button class="add-btn" onclick={() => addToSchedule(r)}>
                  Add to schedule
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if !isLoading}
    <div class="empty">
      No results yet. Enter the subject code(s) and press search.
    </div>
    <div class="empty">Results are ordered by day and time.</div>
  {/if}
</div>

<style>
  .wrap {
    color: #fff;
    min-height: 100vh;
    background: #121212;
  }
  /* .header and h1 selectors removed as they are unused */
  /* back link removed per request */

  .search {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px 20px;
    display: flex;
    gap: 10px;
  }
  input[type="text"] {
    flex: 1;
    padding: 10px 12px;
    background: #1f1f1f;
    border: 1px solid #2a2a2a;
    color: #fff;
    border-radius: 6px;
  }
  .primary {
    background: #4caf50;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error {
    color: #ff6b6b;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px 10px;
  }

  .success {
    color: #4caf50;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px 10px;
    font-weight: 500;
  }

  .table-wrap {
    max-width: 1200px;
    margin: 0 auto 40px;
    padding: 0 20px 20px;
  }
  table.results {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* lock column widths for consistent alignment */
    background: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
  }
  .results col.col-time {
    width: 16%;
  }
  .results col.col-code {
    width: 20%;
  }
  .results col.col-title {
    width: 22%;
  }
  .results col.col-place {
    width: 13%;
  }
  .results col.col-tutor {
    width: 13%;
  }
  .results col.col-action {
    width: 16%;
  }
  thead th {
    text-align: left;
    padding: 12px;
    background: #222;
    color: #cfcfcf;
    font-weight: 600;
  }
  tbody td {
    padding: 12px;
    border-top: 1px solid #2a2a2a;
    color: #e0e0e0;
    vertical-align: top;
    line-height: 1.4;
  }
  tbody tr:hover {
    background: #262626;
  }
  td.time {
    white-space: normal;
    text-align: left;
  }
  .when {
    font-weight: 600;
  }
  td.code {
    font-family: ui-monospace, Menlo, monospace;
    color: #c3e88d;
    white-space: nowrap;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
  }
  td.code .type {
    color: #a5d6a7;
  }
  td.title {
    text-align: left;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  td.place,
  td.tutor {
    color: #b0b0b0;
    overflow-wrap: anywhere;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  td.action {
    text-align: center;
    vertical-align: middle;
  }

  .add-btn {
    background: #4caf50;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: background 0.2s;
  }

  .add-btn:hover {
    background: #45a049;
  }

  .add-btn:active {
    background: #3d8b40;
  }

  .empty {
    max-width: 1200px;
    margin: 20px auto;
    padding: 0 20px;
    color: #b0b0b0;
  }
</style>
