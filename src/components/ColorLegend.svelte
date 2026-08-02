<script>
  import { onMount } from "svelte";

  const STORAGE_KEY = "legendVisible";
  let isVisible = $state(true);

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      isVisible = stored === "true";
    }
  });

  function toggleVisibility() {
    isVisible = !isVisible;
    localStorage.setItem(STORAGE_KEY, isVisible ? "true" : "false");
  }

  let { lectureExemption = false, onToggleLectureExemption } = $props();

  function toggleExemption() {
    onToggleLectureExemption(!lectureExemption);
  }
</script>

<div
  class="color-legend {lectureExemption ? 'exemption-active' : ''} {!isVisible
    ? 'hidden'
    : ''}"
>
  <button
    class="toggle-btn"
    onclick={toggleVisibility}
    title={isVisible ? "Hide legend" : "Show legend"}
  >
    {isVisible ? "←" : "→"}
  </button>
  <div class="legend-content">
    <h3>Event Types</h3>
    <div class="legend-item">
      <div class="color-box lecture"></div>
      <span>Lecture</span>
    </div>
    <div class="legend-item">
      <div class="color-box practice"></div>
      <span>Practice</span>
    </div>
    <div class="legend-item">
      <div class="color-box conflict"></div>
      <span>Conflict</span>
    </div>

    <hr class="legend-divider" />

    <div class="legend-item exemption-item">
      <label class="switch">
        <input
          type="checkbox"
          checked={lectureExemption}
          onchange={toggleExemption}
        />
        <span class="slider round"></span>
      </label>
      <span>Lecture Exemption</span>
    </div>
  </div>
</div>

<style>
  .color-legend {
    position: fixed;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: #2d2d2d;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    width: 200px;
    z-index: 100;
    transition: transform 0.3s ease;
  }

  .color-legend.hidden {
    transform: translateY(-50%) translateX(-225px);
  }

  .color-legend.hidden .legend-content {
    opacity: 0;
  }

  .legend-content {
    opacity: 1;
    transition: opacity 0.2s ease;
  }

  .toggle-btn {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 40px;
    border-radius: 0 4px 4px 0;
    background: #2d2d2d;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1em;
    color: #ffffff;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .legend-divider {
    border: 0;
    height: 1px;
    background: #444;
    margin: 12px 0;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #4caf50;
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  .exemption-item {
    align-items: center;
  }

  .color-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .color-box.lecture {
    background-color: #4caf50;
  }

  .color-box.practice {
    background-color: #2196f3;
  }

  .color-box.conflict {
    background-color: #ff4444;
  }

</style>
