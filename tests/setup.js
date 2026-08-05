import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  global.window = window;
  global.document = document;
  global.localStorage = window.localStorage;
}
