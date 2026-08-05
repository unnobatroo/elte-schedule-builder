import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExportModal from "../src/components/ExportModal.svelte";

const event = {
  title: "Introduction to Web Development (lecture)",
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
  description: "DEMO-1-1\nInstructor: Dr. Jane Smith",
  extendedProps: {
    type: "lecture",
    location: "North Building 2.42",
  },
};

describe("ExportModal", () => {
  let open;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 12));
    open = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    open.mockRestore();
    vi.useRealTimers();
  });

  it("opens a complete Google Calendar template using local calendar dates", async () => {
    render(ExportModal, {
      props: { isOpen: true, events: [event], onClose: vi.fn() },
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Add to Calendar" }),
    );

    expect(open).toHaveBeenCalledWith(expect.any(String), "_blank");
    const url = new URL(open.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(event.title);
    expect(url.searchParams.get("dates")).toBe(
      "20260810T100000/20260810T113000",
    );
    expect(url.searchParams.get("location")).toBe("North Building 2.42");
    expect(url.searchParams.get("details")).toBe(event.description);
    expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY");
  });
});
