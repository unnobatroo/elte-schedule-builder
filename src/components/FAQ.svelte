<script>
  import { marked } from "marked";
  import calendarOverviewUrl from "../assets/guide/calendar-overview.png";
  import conflictCalendarUrl from "../assets/guide/conflict-calendar.png";
  import conflictDetailsUrl from "../assets/guide/conflict-details.png";
  import eventDetailsUrl from "../assets/guide/event-details.png";
  import googleCalendarExportUrl from "../assets/guide/google-calendar-export.png";
  import missingSubjectsUrl from "../assets/guide/missing-subjects.png";
  import subjectCodeInputUrl from "../assets/guide/subject-code-input.png";
  import visibilityControlsUrl from "../assets/guide/visibility-controls.png";
  let { isOpen = false, onClose } = $props();

  const guideMarkdown = `# What is this?

Usually creating your schedule feels more like a casino rather than planning. Well, not anymore! With this website you can plan your schedule ahead of the registration period and also export it straight to Google Calendar (from which you can export your precious schedule anywhere if you want).

# How to use

First of all, you need to acquire your subject codes from Neptun.

Then you paste them into the input field and press \`Generate schedule\`.
![Subject codes entered in the schedule builder](${subjectCodeInputUrl})
    \` Loading might take a bit if data is old and needs to be refreshed.\`

Upon loading, there might appear a window with missing subjects.
![Missing-subject warning](${missingSubjectsUrl})
\`\`\`
This might happen due to several reasons:
- Professor has not updated the schedule yet -> come back for this subject later
- There's a bug in the code (if you think that, please contact me)
\`\`\`

If there is information about subjects, you will see them in the calendar.
![Weekly calendar populated with classes](${calendarOverviewUrl})

# Features

### Click event to see more information
![Expanded event details](${eventDetailsUrl})

### Hide subjects from the calendar (single/several lessons or the whole subject) 
![Subject and event visibility controls](${visibilityControlsUrl})

### Conflicts between subjects (you can see which subjects are conflicting with each other)
![Conflicting events in the calendar](${conflictCalendarUrl})
![Conflict details in the subject controls](${conflictDetailsUrl})

### Export to Google Calendar
Once you are happy with your schedule and finished registering, you can proceed to export your calendar.

**Notice that only subjects that are visible in the calendar will be exported.**

When you click \`Export to Google Calendar\`, a window will open with your subjects and buttons next to them.
Each button will open a new window with Google Calendar where you can adjust the information and save the event.
![Google Calendar export dialog](${googleCalendarExportUrl})

### Share your schedule

When you click \`Share Schedule\`, the link to the schedule will be copied to your clipboard.

Opening a shared link creates a new schedule automatically, so schedules already saved on the device are preserved.

### Manage several schedules

Use the \`My schedules\` panel at the bottom of the Schedule Builder to create, switch, rename, or delete local schedules. Each schedule keeps its own subjects and lecture-exemption setting.
`;

  marked.setOptions({
    breaks: true,
    gfm: true,
  });
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
      <div class="markdown-content">
        <!-- guideMarkdown is a repository-owned constant, not user-provided content. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked(guideMarkdown)}
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

  .markdown-content {
    color: #ffffff;
  }

  .markdown-content :global(h1) {
    color: #4caf50;
    font-size: 1.8em;
    margin: 1.5em 0 0.8em;
  }

  .markdown-content :global(h1:first-child) {
    margin-top: 0;
  }

  .markdown-content :global(h2),
  .markdown-content :global(h3) {
    color: #4caf50;
    margin: 1.2em 0 0.6em;
  }

  .markdown-content :global(p) {
    margin: 0 0 1em;
    line-height: 1.6;
  }

  .markdown-content :global(img) {
    max-width: 100%;
    border-radius: 4px;
    margin: 1em 0;
  }

  .markdown-content :global(ul),
  .markdown-content :global(ol) {
    margin: 0 0 1em;
    padding-left: 2em;
  }

  .markdown-content :global(li) {
    margin-bottom: 0.5em;
  }

  .markdown-content :global(code) {
    background: #1a1a1a;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }

  .markdown-content :global(pre) {
    background: #1a1a1a;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1em 0;
  }

  .markdown-content :global(pre code) {
    background: none;
    padding: 0;
  }

  .markdown-content :global(strong) {
    color: #ffa726;
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 16px;
      margin: 16px;
    }

    .markdown-content :global(h1) {
      font-size: 1.5em;
    }
  }
</style>
