<script>
  import GitHubStarLink from "./GitHubStarLink.svelte";
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";

  let { githubRepositoryUrl = "" } = $props();
</script>

<footer class="footer" aria-label={t($language, "projectInformation")}>
  <div class="footer-main">
    <div class="project-note">
      <strong>{t($language, "notAffiliated")}</strong>
      <p>
        {t($language, "builtBy")}
        <a href="https://jalols.page/" target="_blank" rel="noopener noreferrer"
          >Jaloliddin Ismailov<span class="sr-only">
            ({t($language, "opensNewTab")})</span
          ></a
        >.
      </p>
    </div>

    <nav class="footer-actions" aria-label={t($language, "projectLinks")}>
      {#if githubRepositoryUrl}
        <div class="github-action">
          <GitHubStarLink href={githubRepositoryUrl} />
        </div>
      {/if}
      <a href="mailto:me@jismailov.com" class="contact-action">
        <Icon name="mail" size={17} />
        <span>
          <small>{t($language, "email")}</small>
          me@jismailov.com
        </span>
      </a>
    </nav>
  </div>
</footer>

<style>
  .footer {
    margin-top: var(--space-4);
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-1);
  }

  .footer-main {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) auto;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-4) var(--space-5);
  }

  .project-note {
    display: grid;
    gap: 3px;
    min-width: 0;
    color: var(--color-text);
  }

  .project-note strong {
    display: block;
    font-size: var(--text-sm);
  }

  .project-note p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .project-note a {
    color: var(--color-accent);
    font-weight: var(--weight-semibold);
    text-decoration: none;
  }

  .project-note a:hover {
    color: var(--color-accent-strong);
    text-decoration: underline;
  }

  .footer-actions {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
  }

  .contact-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: var(--control-md);
    padding: 6px 11px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-decoration: none;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .contact-action span {
    display: grid;
    line-height: 1.25;
  }

  .contact-action small {
    color: var(--color-text-muted);
    font-size: 0.66rem;
    font-weight: 600;
  }

  .contact-action:hover {
    border-color: var(--color-border-strong);
    background: var(--color-surface-3);
    color: var(--color-text);
  }

  @media (max-width: 768px) {
    .footer-main {
      grid-template-columns: 1fr;
      align-items: stretch;
      gap: var(--space-4);
    }

    .footer-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
    }
  }

  @media (max-width: 480px) {
    .footer-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
