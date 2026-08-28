<script>
  import GitHubStarLink from "./GitHubStarLink.svelte";

  let { githubRepositoryUrl = "" } = $props();
</script>

<footer class="footer">
  {#if githubRepositoryUrl}
    <div class="github-footer-callout">
      <span>Found this useful? Support the project:</span>
      <GitHubStarLink href={githubRepositoryUrl} />
    </div>
  {/if}
  <div class="contact-info">
    <span>Contact:</span>
    <a href="mailto:w04m1@proton.me" class="contact-link">w04m1@proton.me</a>
    <span class="separator">•</span>
    <a
      href="https://t.me/w04m1"
      class="contact-link"
      target="_blank"
      rel="noopener noreferrer">Telegram</a
    >
  </div>
  <div class="credits">
    by <a
      href="https://blog.w04m1.dev"
      class="contact-link"
      target="_blank"
      rel="noopener noreferrer">Daniil Sherstennikov</a
    > 😶‍🌫️
  </div>
</footer>

<style>
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #2d2d2d;
    text-align: center;
  }

  .github-footer-callout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 18px;
    color: #d0d0d0;
  }

  .contact-info {
    color: #b0b0b0;
    font-size: 0.9em;
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .contact-link {
    color: #4caf50;
    text-decoration: none;
    transition: color 0.2s;
  }

  .contact-link:hover {
    color: #45a049;
    text-decoration: underline;
  }

  .separator {
    color: #4d4d4d;
  }

  .credits {
    margin-top: 12px;
    color: #808080;
    font-size: 1em;
  }

  @media (max-width: 768px) {
    .github-footer-callout,
    .contact-info {
      flex-direction: column;
    }

    .contact-info {
      gap: 8px;
    }

    .separator {
      display: none;
    }
  }
</style>
