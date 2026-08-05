import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/schedule.js", async () => {
  const actual = await vi.importActual("../src/utils/schedule.js");
  return { ...actual, fetchSubjectData: vi.fn() };
});

import ScheduleInput from "../src/components/ScheduleInput.svelte";
import { fetchSubjectData } from "../src/utils/schedule.js";

const demoClass = {
  time: "Monday 10:00-11:30",
  code: "DEMO-1-1",
  type: "lecture",
  title: "Introduction to Web Development",
  location: "North Building 2.42",
  instructor: "Dr. Jane Smith",
};

describe("ScheduleInput", () => {
  let consoleError;

  beforeEach(() => {
    localStorage.clear();
    fetchSubjectData.mockReset();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it("turns fetched classes into enabled schedule events", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectData.mockResolvedValue([demoClass]);
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(screen.getByPlaceholderText(/Enter subject codes/), {
      target: { value: "DEMO-1" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Generate/Update Schedule" })
    );

    await waitFor(() => expect(onScheduleUpdate).toHaveBeenCalledOnce());
    expect(fetchSubjectData).toHaveBeenCalledWith("DEMO-1");
    expect(onScheduleUpdate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        description: expect.stringContaining("DEMO-1-1"),
        enabled: true,
      }),
    ]);
  });

  it("shows failed subjects and does not update the schedule", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectData.mockRejectedValue(new Error("offline"));
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(screen.getByPlaceholderText(/Enter subject codes/), {
      target: { value: "IK-FAIL" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Generate/Update Schedule" })
    );

    expect(await screen.findByText("IK-FAIL")).toBeTruthy();
    expect(screen.getByText(/No data found for 1 subject/)).toBeTruthy();
    expect(onScheduleUpdate).not.toHaveBeenCalled();
  });

  it("keeps successful results when another subject is empty", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectData
      .mockResolvedValueOnce([demoClass])
      .mockResolvedValueOnce([]);
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(screen.getByPlaceholderText(/Enter subject codes/), {
      target: { value: "DEMO-1 IK-EMPTY" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Generate/Update Schedule" })
    );

    await waitFor(() => expect(onScheduleUpdate).toHaveBeenCalledOnce());
    expect(await screen.findByText("IK-EMPTY")).toBeTruthy();
    expect(onScheduleUpdate.mock.calls[0][0]).toHaveLength(1);
  });
});
