import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/schedule.js", async () => {
  const actual = await vi.importActual("../src/utils/schedule.js");
  return { ...actual, fetchSubjectData: vi.fn() };
});

import App from "../src/App.svelte";
import { encodeSchedule, fetchSubjectData } from "../src/utils/schedule.js";
import {
  getActiveSchedule,
  loadScheduleStore,
  saveScheduleStore,
  updateActiveSchedule,
} from "../src/utils/scheduleStorage.js";

const importedClass = {
  time: "Monday 10:00-11:30",
  code: "DEMO-1-1",
  type: "lecture",
  title: "Introduction to Web Development",
  location: "North Building 2.42",
  instructor: "Dr. Jane Smith",
};

describe("App integration", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("warningShown", "true");
    localStorage.setItem("mobileWarningShown", "true");
    fetchSubjectData.mockReset();
    fetchSubjectData.mockResolvedValue([importedClass]);
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
  });

  it("imports into a new active schedule while preserving local schedules", async () => {
    let store = loadScheduleStore(localStorage, () => "local-schedule");
    store = updateActiveSchedule(store, {
      subjects: [{ title: "Local subject", code: "LOCAL-1", enabled: false, events: [] }],
    });
    saveScheduleStore(localStorage, store);
    const encoded = encodeSchedule([importedClass.code], true);
    window.history.replaceState({}, "", `/import/${encoded}`);

    render(App);

    await waitFor(() => {
      const saved = loadScheduleStore(localStorage);
      expect(saved.schedules).toHaveLength(2);
      expect(getActiveSchedule(saved)).toMatchObject({
        name: "Imported schedule",
        lectureExemption: true,
        subjects: [
          expect.objectContaining({
            title: "Introduction to Web Development",
            enabled: true,
          }),
        ],
      });
      expect(saved.schedules[0].subjects).toEqual([
        expect.objectContaining({ title: "Local subject" }),
      ]);
    });
    expect(window.location.pathname).toBe("/");
  });
});
