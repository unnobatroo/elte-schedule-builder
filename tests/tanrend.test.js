import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/schedule.js", async () => {
  const actual = await vi.importActual("../src/utils/schedule.js");
  return { ...actual, fetchSubjectData: vi.fn() };
});

import Tanrend from "../src/routes/Tanrend.svelte";
import {
  createCalendarEvents,
  fetchSubjectData,
} from "../src/utils/schedule.js";
import {
  getActiveSchedule,
  loadScheduleStore,
  saveScheduleStore,
  updateActiveSchedule,
} from "../src/utils/scheduleStorage.js";

const firstLecture = {
  time: "Monday 10:00-11:30",
  code: "DEMO-1-1",
  type: "lecture",
  title: "Introduction to Web Development",
  location: "North Building 2.42",
  instructor: "Dr. Jane Smith",
};
const secondLecture = {
  ...firstLecture,
  time: "Friday 10:00-11:30",
  code: "DEMO-1-2",
};

describe("Tanrend", () => {
  let consoleError;

  beforeEach(() => {
    localStorage.clear();
    fetchSubjectData.mockReset();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it("searches and adds a selected class to the active schedule", async () => {
    fetchSubjectData.mockResolvedValue([firstLecture]);
    const scheduleUpdated = vi.fn();
    window.addEventListener("scheduleUpdated", scheduleUpdated, { once: true });
    render(Tanrend);

    await fireEvent.input(screen.getByPlaceholderText("Search by subject code"), {
      target: { value: "DEMO-1" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await fireEvent.click(
      await screen.findByRole("button", { name: "Add to schedule" })
    );

    expect(await screen.findByText(/Added "Introduction to Web Development"/))
      .toBeTruthy();
    const active = getActiveSchedule(loadScheduleStore(localStorage));
    expect(active.subjects).toEqual([
      expect.objectContaining({
        title: "Introduction to Web Development",
        enabled: true,
        events: [expect.objectContaining({ enabled: true })],
      }),
    ]);
    expect(scheduleUpdated).toHaveBeenCalledOnce();
  });

  it("replaces the enabled lecture group while preserving the subject", async () => {
    const initialEvent = {
      ...createCalendarEvents([firstLecture])[0],
      enabled: true,
    };
    let store = loadScheduleStore(localStorage, () => "schedule-one");
    store = updateActiveSchedule(store, {
      subjects: [{
        title: "Introduction to Web Development",
        code: firstLecture.code,
        enabled: true,
        events: [initialEvent],
      }],
    });
    saveScheduleStore(localStorage, store);
    fetchSubjectData.mockResolvedValue([secondLecture]);
    render(Tanrend);

    await fireEvent.input(screen.getByPlaceholderText("Search by subject code"), {
      target: { value: secondLecture.code },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await fireEvent.click(
      await screen.findByRole("button", { name: "Add to schedule" })
    );

    await waitFor(() => {
      const subject = getActiveSchedule(loadScheduleStore(localStorage)).subjects[0];
      expect(subject.events).toHaveLength(2);
      expect(subject.events.map(({ enabled }) => enabled)).toEqual([false, true]);
    });
  });

  it("shows a failed search without modifying schedule storage", async () => {
    fetchSubjectData.mockRejectedValue(new Error("offline"));
    render(Tanrend);

    await fireEvent.input(screen.getByPlaceholderText("Search by subject code"), {
      target: { value: "IK-FAIL" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Failed to fetch data. Please try again."))
      .toBeTruthy();
    expect(localStorage.getItem("scheduleManager")).toBeNull();
  });

  it("explains an empty API result", async () => {
    fetchSubjectData.mockResolvedValue([]);
    render(Tanrend);

    await fireEvent.input(screen.getByPlaceholderText("Search by subject code"), {
      target: { value: "IK-EMPTY" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText(
      "No results found for the provided subject code(s)."
    )).toBeTruthy();
    expect(localStorage.getItem("scheduleManager")).toBeNull();
  });
});
