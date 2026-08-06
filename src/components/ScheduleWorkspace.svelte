<script>
  import { onDestroy } from "svelte";
  import { encodeSchedule } from "../utils/schedule.js";
  import ExportModal from "./ExportModal.svelte";
  import ScheduleInput from "./ScheduleInput.svelte";

  let {
    events = [],
    activeCodes = [],
    lectureExemption = false,
    importedCodes = { baseCodes: "", fullCodes: [] },
    onScheduleUpdate,
    onImportComplete,
  } = $props();

  let showExportModal = $state(false);
  let showCopiedIndicator = $state(false);
  let copiedIndicatorTimeout;

  onDestroy(() => clearTimeout(copiedIndicatorTimeout));

  function openExportModal() {
    if (events.length > 0) showExportModal = true;
  }

  function copyWithTextarea(value) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function shareSchedule() {
    const encoded = encodeSchedule(activeCodes, lectureExemption);
    const shareUrl = `${window.location.origin}/import/${encoded}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (!copyWithTextarea(shareUrl)) {
        return;
      }

      clearTimeout(copiedIndicatorTimeout);
      showCopiedIndicator = true;
      copiedIndicatorTimeout = setTimeout(() => {
        showCopiedIndicator = false;
      }, 2000);
    } catch {
      showCopiedIndicator = false;
    }
  }
</script>

<ScheduleInput
  {onScheduleUpdate}
  onExportToGoogle={openExportModal}
  onShare={shareSchedule}
  {onImportComplete}
  {importedCodes}
/>

<ExportModal
  isOpen={showExportModal}
  onClose={() => (showExportModal = false)}
  {events}
/>

{#if showCopiedIndicator}
  <div class="copied-indicator" role="status">
    Share link copied to clipboard!
  </div>
{/if}

<style>
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
