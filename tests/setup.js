import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

afterEach(async () => {
  const renderedScheduleX = document.querySelector(
    ".sx-svelte-calendar-wrapper",
  );
  cleanup();

  // Preact's browser fallback can leave a short post-render timer behind even
  // after Schedule-X is destroyed. Let it drain while jsdom globals still exist.
  if (renderedScheduleX) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

if (typeof window !== "undefined") {
  global.window = window;
  global.document = document;
  global.localStorage = window.localStorage;
}
