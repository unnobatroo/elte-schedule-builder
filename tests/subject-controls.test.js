import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import SubjectControls from "../src/components/SubjectControls.svelte";

const subjects = [
  {
    title: "Algorithms",
    enabled: true,
    events: [
      {
        code: "IK-ALG-01",
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "11:30",
        enabled: true,
        hasConflict: true,
        extendedProps: { type: "practice" },
      },
      {
        description: "IK-ALG-02\nInstructor: Grace Hopper",
        dayOfWeek: "Wednesday",
        startTime: "12:00",
        endTime: "13:30",
        enabled: false,
        hasConflict: false,
        extendedProps: { type: "lecture" },
      },
    ],
  },
];

describe("SubjectControls", () => {
  it("forwards subject and delete actions", async () => {
    const onToggleSubject = vi.fn();
    const onDeleteSubject = vi.fn();
    render(SubjectControls, { subjects, onToggleSubject, onDeleteSubject });

    await fireEvent.click(screen.getByRole("checkbox", { name: "Algorithms" }));
    await fireEvent.click(screen.getByTitle("Remove subject"));

    expect(onToggleSubject).toHaveBeenCalledWith("Algorithms");
    expect(onDeleteSubject).toHaveBeenCalledWith("Algorithms");
  });

  it("reveals event controls and forwards the event index", async () => {
    const onToggleEvent = vi.fn();
    render(SubjectControls, { subjects, onToggleEvent });

    await fireEvent.mouseEnter(
      screen.getByRole("button", { name: "Toggle Algorithms events" }),
    );
    const menu = screen.getByRole("menu", { name: "Algorithms events" });
    const checkbox = menu.querySelector('input[type="checkbox"]');
    await fireEvent.click(checkbox);

    expect(screen.getByText("Group")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Day")).toBeTruthy();
    expect(screen.getByText("Time")).toBeTruthy();
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("02")).toBeTruthy();
    expect(screen.getByText("Pr")).toBeTruthy();
    expect(screen.getByText("L")).toBeTruthy();
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("10:00-11:30")).toBeTruthy();
    expect(screen.getByLabelText("Time conflict")).toBeTruthy();
    expect(onToggleEvent).toHaveBeenCalledWith("Algorithms", 0);
  });
});
