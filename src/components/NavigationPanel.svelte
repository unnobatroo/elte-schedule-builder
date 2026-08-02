<script>
  import { onMount } from "svelte";

  let { path = "/", onNavigate } = $props();

  const STORAGE_KEY = "navigationVisible";
  let isVisible = $state(true);

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      isVisible = stored === "true";
    }
  });

  let isBuilder = $derived(path === "/" || path.startsWith("/import/"));
  let isTanrend = $derived(path.startsWith("/tanrend"));

  function toggleVisibility() {
    isVisible = !isVisible;
    localStorage.setItem(STORAGE_KEY, isVisible ? "true" : "false");
  }

  function handleNavigate(event, href) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event.type === "click" && event.button !== 0)
    ) {
      return;
    }

    event.preventDefault();
    onNavigate?.(href);
  }
</script>

<div class={`navigation-panel ${isVisible ? "" : "hidden"}`}>
  <button
    class="toggle-btn"
    onclick={toggleVisibility}
    title={isVisible ? "Hide navigation" : "Show navigation"}
  >
    {isVisible ? "→" : "←"}
  </button>
  <nav class="nav-content" aria-label="Primary navigation">
    <h3>Navigate</h3>
    <a
      href="/"
      class:is-active={isBuilder}
      onclick={(event) => handleNavigate(event, "/")}
    >
      Schedule Builder
    </a>
    <a
      href="/tanrend"
      class:is-active={isTanrend}
      onclick={(event) => handleNavigate(event, "/tanrend")}
    >
      Search
    </a>
  </nav>
</div>

<style>
  .navigation-panel {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: #2d2d2d;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    width: 200px;
    z-index: 110;
    transition: transform 0.3s ease;
  }

  .navigation-panel.hidden {
    transform: translateY(-50%) translateX(225px);
  }

  .navigation-panel.hidden .nav-content {
    opacity: 0;
    pointer-events: none;
  }

  .nav-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 1;
    transition: opacity 0.2s ease;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1em;
    color: #ffffff;
  }

  a {
    display: block;
    text-decoration: none;
    color: #b0b0b0;
    padding: 10px 12px;
    border-radius: 6px;
    background: #3d3d3d;
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      transform 0.05s ease;
    text-align: center;
  }

  a:hover {
    background: #4d4d4d;
    color: #ffffff;
  }

  a.is-active {
    background: #2d2d2d;
    color: #4caf50;
    border: 1px solid #4caf50;
  }

  .toggle-btn {
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 40px;
    border-radius: 4px 0 0 4px;
    background: #2d2d2d;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-btn:hover {
    background: #414141;
  }

  @media (max-width: 768px) {
    .navigation-panel {
      top: auto;
      bottom: 20px;
      transform: none;
      right: 16px;
    }

    .navigation-panel.hidden {
      transform: translateY(0) translateX(225px);
    }

    .toggle-btn {
      top: 16px;
      transform: none;
    }
  }
</style>
