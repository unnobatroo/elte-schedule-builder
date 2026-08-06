<script>
  import GitHubStarLink from "./GitHubStarLink.svelte";

  let {
    githubRepositoryUrl = "",
    faqRead = false,
    hasSubjects = false,
    onOpenFAQ,
    onReset,
  } = $props();
</script>

<header class="header">
  <h1>ELTE Schedule Builder</h1>
  <div class="header-buttons">
    {#if githubRepositoryUrl}
      <GitHubStarLink href={githubRepositoryUrl} />
    {/if}
    <button class="faq-btn" class:glow={!faqRead} onclick={() => onOpenFAQ?.()}>
      FAQ & Guide
    </button>
    {#if hasSubjects}
      <button class="reset-btn" onclick={() => onReset?.()}>Reset All</button>
    {/if}
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  h1 {
    margin: 0 20px 0 0;
    font-size: 2em;
    font-weight: 600;
    color: #4caf50;
  }

  .header-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .faq-btn,
  .reset-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .faq-btn {
    background: #4caf50;
  }

  .faq-btn:hover {
    background: #45a049;
  }

  .faq-btn.glow {
    animation: glow 2s ease-in-out infinite;
    box-shadow: 0 0 10px #4caf50;
  }

  .reset-btn {
    background: #d32f2f;
  }

  .reset-btn:hover {
    background: #f44336;
  }

  @keyframes glow {
    0%,
    100% {
      box-shadow: 0 0 10px #4caf50;
    }
    50% {
      box-shadow:
        0 0 20px #4caf50,
        0 0 30px #45a049;
    }
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    h1 {
      font-size: 1.5em;
    }

    .header-buttons {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
