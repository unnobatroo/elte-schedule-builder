import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
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

const savedEvent = {
  title: "Introduction to Web Development (lecture)",
  code: "DEMO-1-1",
  description: "DEMO-1-1\nInstructor: Dr. Jane Smith",
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
  enabled: true,
  extendedProps: {
    type: "lecture",
    location: "North Building 2.42",
    instructor: "Dr. Jane Smith",
  },
};

function savePopulatedSchedule() {
  let store = loadScheduleStore(localStorage, () => "schedule-one");
  store = updateActiveSchedule(store, {
    subjects: [
      {
        title: "Introduction to Web Development",
        code: "DEMO-1-1",
        enabled: true,
        events: [savedEvent],
      },
    ],
  });
  saveScheduleStore(localStorage, store);
  return store;
}

describe("App integration", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("warningShown", "true");
    localStorage.setItem("mobileWarningShown", "true");
    fetchSubjectData.mockReset();
    fetchSubjectData.mockResolvedValue([importedClass]);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
  });

  it("imports into a new active schedule while preserving local schedules", async () => {
    let store = loadScheduleStore(localStorage, () => "local-schedule");
    store = updateActiveSchedule(store, {
      subjects: [
        { title: "Local subject", code: "LOCAL-1", enabled: false, events: [] },
      ],
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

  it("shares the enabled schedule and persists lecture exemption", async () => {
    savePopulatedSchedule();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(App);

    await fireEvent.click(
      await screen.findByRole("button", { name: "Share Schedule" }),
    );
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/import/${encodeSchedule(["DEMO-1-1"], false)}`,
    );
    expect(
      await screen.findByText("Share link copied to clipboard!"),
    ).toBeTruthy();

    const exemptionControl = screen
      .getByText("Lecture Exemption")
      .parentElement.querySelector('input[type="checkbox"]');
    await fireEvent.change(exemptionControl);

    await waitFor(() => {
      expect(
        getActiveSchedule(loadScheduleStore(localStorage)).lectureExemption,
      ).toBe(true);
    });
  });

  it("opens export coordination for the active schedule", async () => {
    savePopulatedSchedule();
    render(App);

    await fireEvent.click(
      await screen.findByRole("button", {
        name: "Export to Google Calendar",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Export to Google Calendar" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add to Calendar" }),
    ).toBeTruthy();
  });

  it("creates, renames, switches, and deletes schedules", async () => {
    const initial = loadScheduleStore(localStorage, () => "schedule-one");
    saveScheduleStore(localStorage, initial);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    render(App);

    await fireEvent.click(await screen.findByRole("button", { name: "+ New" }));
    await waitFor(() => {
      expect(loadScheduleStore(localStorage).schedules).toHaveLength(2);
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Rename New schedule" }),
    );
    await fireEvent.input(screen.getByLabelText("Schedule name"), {
      target: { value: "Exam plan" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Save schedule name" }),
    );
    expect(loadScheduleStore(localStorage).schedules[1].name).toBe("Exam plan");

    await fireEvent.click(
      screen.getByRole("button", { name: "Default schedule", exact: true }),
    );
    expect(loadScheduleStore(localStorage).activeScheduleId).toBe(
      "schedule-one",
    );

    await fireEvent.click(
      screen.getByRole("button", { name: "Delete Exam plan" }),
    );
    expect(loadScheduleStore(localStorage).schedules).toHaveLength(1);
  });
});
