<script>
  import calendarOverviewUrl from "../assets/guide/calendar-overview.png";
  import conflictCalendarUrl from "../assets/guide/conflict-calendar.png";
  import conflictDetailsUrl from "../assets/guide/conflict-details.png";
  import eventDetailsUrl from "../assets/guide/event-details.png";
  import googleCalendarExportUrl from "../assets/guide/google-calendar-export.png";
  import missingSubjectsUrl from "../assets/guide/missing-subjects.png";
  import subjectCodeInputUrl from "../assets/guide/subject-code-input.png";
  import visibilityControlsUrl from "../assets/guide/visibility-controls.png";
  let { isOpen = false, onClose } = $props();
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    aria-label="Dismiss guide"
    onclick={(event) => event.target === event.currentTarget && onClose()}
    onkeydown={(event) => event.key === "Escape" && onClose()}
  >
    <div class="modal-content" role="dialog" aria-modal="true" tabindex="-1">
      <button
        type="button"
        class="close-btn"
        aria-label="Close guide"
        onclick={onClose}>×</button
      >
      <div class="guide-content">
        <h1>What is this?</h1>
        <p>
          Usually creating your schedule feels more like a casino rather than
          planning. Well, not anymore! With this website you can plan your
          schedule ahead of the registration period and also export it straight
          to Google Calendar (from which you can export your precious schedule
          anywhere if you want).
        </p>

        <h1>How to use</h1>
        <p>First of all, you need to acquire your subject codes from Neptun.</p>
        <p>
          Then you paste them into the input field and press
          <code>Generate schedule</code>.
        </p>
        <img
          src={subjectCodeInputUrl}
          alt="Subject codes entered in the schedule builder"
        />
        <p>
          <code>
            Loading might take a bit if data is old and needs to be refreshed.
          </code>
        </p>

        <p>Upon loading, there might appear a window with missing subjects.</p>
        <img src={missingSubjectsUrl} alt="Missing-subject warning" />
        <div class="guide-note">
          <p>This might happen due to several reasons:</p>
          <ul>
            <li>
              Professor has not updated the schedule yet &rarr; come back for
              this subject later.
            </li>
            <li>
              There is a bug in the code; if you think that is the case, please
              contact me.
            </li>
          </ul>
        </div>

        <p>
          If there is information about subjects, you will see them in the
          calendar.
        </p>
        <img
          src={calendarOverviewUrl}
          alt="Weekly calendar populated with classes"
        />

        <h1>Features</h1>

        <h3>Click an event to see more information</h3>
        <img src={eventDetailsUrl} alt="Expanded event details" />

        <h3>
          Hide subjects from the calendar (single or several lessons, or the
          whole subject)
        </h3>
        <img
          src={visibilityControlsUrl}
          alt="Subject and event visibility controls"
        />

        <h3>
          Conflicts between subjects (see which subjects conflict with each
          other)
        </h3>
        <img
          src={conflictCalendarUrl}
          alt="Conflicting events in the calendar"
        />
        <img
          src={conflictDetailsUrl}
          alt="Conflict details in the subject controls"
        />

        <h3>Export to Google Calendar</h3>
        <p>
          Once you are happy with your schedule and finished registering, you
          can proceed to export your calendar.
        </p>
        <p>
          <strong>
            Notice that only subjects that are visible in the calendar will be
            exported.
          </strong>
        </p>
        <p>
          When you click <code>Export to Google Calendar</code>, a window will
          open with your subjects and buttons next to them. Each button will
          open a new window with Google Calendar where you can adjust the
          information and save the event.
        </p>
        <img
          src={googleCalendarExportUrl}
          alt="Google Calendar export dialog"
        />

        <h3>Share your schedule</h3>
        <p>
          When you click <code>Share Schedule</code>, the link to the schedule
          will be copied to your clipboard.
        </p>
        <p>
          Opening a shared link creates a new schedule automatically, so
          schedules already saved on the device are preserved.
        </p>

        <h3>Manage several schedules</h3>
        <p>
          Use the <code>My schedules</code> panel at the bottom of the Schedule Builder
          to create, switch, rename, or delete local schedules. Each schedule keeps
          its own subjects and lecture-exemption setting.
        </p>

        <h1>Data and privacy</h1>
        <p>
          Saved schedules and interface preferences remain in this browser's
          local storage instead of being synchronized to an account. The
          production site uses self-hosted analytics, session recording, and
          heatmaps, which receive page-view and interaction data to help improve
          the application.
        </p>
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
    margin: 20px auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative;
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

  .guide-content {
    color: #ffffff;
  }

  .guide-content h1 {
    color: #4caf50;
    font-size: 1.8em;
    margin: 1.5em 0 0.8em;
  }

  .guide-content h1:first-child {
    margin-top: 0;
  }

  .guide-content h3 {
    color: #4caf50;
    margin: 1.2em 0 0.6em;
  }

  .guide-content p {
    margin: 0 0 1em;
    line-height: 1.6;
  }

  .guide-content img {
    max-width: 100%;
    border-radius: 4px;
    margin: 1em 0;
  }

  .guide-content ul {
    margin: 0 0 1em;
    padding-left: 2em;
  }

  .guide-content li {
    margin-bottom: 0.5em;
  }

  .guide-content code,
  .guide-note {
    background: #1a1a1a;
    border-radius: 4px;
  }

  .guide-content code {
    padding: 0.2em 0.4em;
    font-family: monospace;
    font-size: 0.9em;
  }

  .guide-note {
    padding: 1em;
    margin: 1em 0;
  }

  .guide-note p:last-child,
  .guide-note ul:last-child {
    margin-bottom: 0;
  }

  .guide-content strong {
    color: #ffa726;
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 16px;
      margin: 16px;
    }

    .guide-content h1 {
      font-size: 1.5em;
    }
  }
</style>
