<script>
  import { onMount } from "svelte";
  import App from "./App.svelte";
  import NavigationPanel from "./components/NavigationPanel.svelte";
  import Tanrend from "./routes/Tanrend.svelte";

  let path = $state(window.location.pathname);

  function navigate(to) {
    if (to !== path) {
      window.history.pushState({}, "", to);
      path = to;
    }
  }

  function handleLinkClick(event) {
    const anchor = event.target.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (href.startsWith("http") || href.startsWith("mailto:")) return;
    event.preventDefault();
    navigate(href);
  }

  onMount(() => {
    const handlePopState = () => (path = window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });

  let isBuilder = $derived(path === "/" || path.startsWith("/import/"));
  let isTanrend = $derived(path.startsWith("/tanrend"));
</script>

<div class="page-shell">
  <NavigationPanel {path} onNavigate={navigate} />
  {#if isBuilder}
    <App />
  {:else if isTanrend}
    <Tanrend />
  {:else}
    <div class="not-found">
      <h2>Page not found</h2>
      <p>
        The page "{path}" doesn't exist. Go back to
        <a href="/" onclick={handleLinkClick}>Schedule Builder</a>.
      </p>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
  }

  .not-found {
    color: #fff;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
  }

  .page-shell {
    min-height: 100vh;
    background: #121212;
  }
</style>
