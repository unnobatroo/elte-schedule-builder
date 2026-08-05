import { describe, expect, it } from "vitest";
import {
  getEnabledEventCodes,
  getEnabledEvents,
  mergeScheduleEvents,
  normalizeSubjectTitle,
  setSubjectEnabled,
  toggleScheduleEvent,
} from "../src/utils/scheduleState.js";

function event(overrides = {}) {
  return {
    title: "Algorithms (practice)",
    dayOfWeek: "Monday",
    startTime: "10:00",
    endTime: "11:30",
    description: "IK-ALG-01\nInstructor: Ada",
    extendedProps: { type: "practice" },
    enabled: true,
    ...overrides,
  };
}

describe("schedule state", () => {
  it.each([
    ["Algorithms (practice)", "Algorithms"],
    ["Algorithms P.", "Algorithms"],
    ["Algorithms L+Pr.", "Algorithms"],
  ])("normalizes %s", (title, expected) => {
    expect(normalizeSubjectTitle(title)).toBe(expected);
  });

  it("adds new subjects and derives unique codes", () => {
    const subjects = mergeScheduleEvents([], [
      event(),
      event({
        dayOfWeek: "Tuesday",
        description: "IK-ALG-02\nInstructor: Grace",
        enabled: false,
      }),
    ]);

    expect(subjects).toEqual([
      expect.objectContaining({
        title: "Algorithms",
        code: "IK-ALG-01, IK-ALG-02",
        enabled: true,
      }),
    ]);
    expect(subjects[0].events).toHaveLength(2);
  });

  it("replaces refreshed events while preserving matching enabled state", () => {
    const existing = {
      title: "Algorithms",
      code: "IK-ALG-01",
      enabled: false,
      events: [event({ enabled: false, location: "Old room" })],
    };

    const subjects = mergeScheduleEvents([existing], [
      event({ description: "IK-ALG-02\nInstructor: Ada", location: "New room" }),
    ]);

    expect(subjects[0]).toMatchObject({
      code: "IK-ALG-01, IK-ALG-02",
      enabled: false,
      events: [{ enabled: false, location: "New room" }],
    });
    expect(existing.events[0]).toMatchObject({
      enabled: false,
      location: "Old room",
    });
  });

  it("toggles an entire subject without changing unrelated subjects", () => {
    const first = {
      title: "Algorithms",
      enabled: true,
      events: [event(), event({ dayOfWeek: "Tuesday" })],
    };
    const second = { title: "Databases", enabled: true, events: [] };

    const result = setSubjectEnabled([first, second], "Algorithms");

    expect(result[0].enabled).toBe(false);
    expect(result[0].events.every((item) => !item.enabled)).toBe(true);
    expect(result[1]).toBe(second);
  });

  it("toggles one event and derives the subject enabled state", () => {
    const subjects = [{
      title: "Algorithms",
      enabled: true,
      events: [event({ enabled: true })],
    }];

    const disabled = toggleScheduleEvent(subjects, "Algorithms", 0);
    const enabled = toggleScheduleEvent(disabled, "Algorithms", 0);

    expect(disabled[0]).toMatchObject({ enabled: false, events: [{ enabled: false }] });
    expect(enabled[0]).toMatchObject({ enabled: true, events: [{ enabled: true }] });
  });

  it("selects enabled events and their share codes", () => {
    const enabled = event();
    const disabled = event({
      description: "IK-ALG-02\nInstructor: Grace",
      enabled: false,
    });
    const subjects = [{ title: "Algorithms", enabled: true, events: [enabled, disabled] }];

    expect(getEnabledEvents(subjects)).toEqual([enabled]);
    expect(getEnabledEventCodes(subjects)).toEqual(["IK-ALG-01"]);
  });
});
