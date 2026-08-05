<script>
  let {
    showWarning = false,
    showMobileWarning = false,
    onCloseWarning,
    onCloseMobileWarning,
  } = $props();
</script>

{#if showWarning}
  <div class="warning-backdrop">
    <div
      class="warning-modal"
      role="dialog"
      tabindex="0"
      aria-modal="true"
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => {
        if (event.key === "Escape") onCloseWarning?.();
      }}
    >
      <h2>⚠️ Important Notice ⚠️</h2>
      <div class="warning-content">
        <ul>
          <li><strong>Not affiliated</strong> with ELTE University.</li>
          <li>
            Data is fetched from Tanrend. It is there, you just can't see it.
          </li>
          <li>
            Developer takes <strong>no responsibility</strong> for errors or
            inaccuracies.<br />
            <i>(I don't have control over the source data)</i>
          </li>
          <li>Found a bug? Please contact the developer.</li>
        </ul>
        <div class="acknowledge-container">
          <button class="understand-btn" onclick={onCloseWarning}
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
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => {
        if (event.key === "Escape") onCloseMobileWarning?.();
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
          <button class="understand-btn" onclick={onCloseMobileWarning}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .warning-backdrop {
    position: fixed;
    inset: 0;
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

  h2 {
    color: #ffa726;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .warning-content {
    color: #ffffff;
  }

  .warning-content p {
    margin: 0 0 12px;
  }

  .warning-content ul {
    margin: 0 0 20px;
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
    padding: 12px 24px;
    background: #4caf50;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
  }

  .understand-btn:hover {
    background: #45a049;
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
</style>
