<script>
  let { href, label = "Star on GitHub" } = $props();
</script>

<a
  class="github-star-link"
  {href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${label} (opens in a new tab)`}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m12 2.75 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.94l-5.56 2.93 1.06-6.2L3 9.28l6.22-.9L12 2.75Z"
    />
  </svg>
  <span>{label}</span>
</a>

<style>
  .github-star-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid #686868;
    border-radius: 6px;
    background: #242424;
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    transition:
      background-color 0.2s,
      border-color 0.2s,
      transform 0.2s;
  }

  .github-star-link:hover {
    border-color: #f5c542;
    background: #353535;
    color: #fff;
    transform: translateY(-1px);
  }

  .github-star-link:focus-visible {
    outline: 3px solid #f5c542;
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: #f5c542;
  }
</style>
