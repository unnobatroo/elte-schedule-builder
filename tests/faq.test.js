import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import FAQ from "../src/components/FAQ.svelte";

describe("FAQ", () => {
  it("does not render the guide while closed", () => {
    render(FAQ, { isOpen: false, onClose: vi.fn() });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the guide and calls onClose from its close button", async () => {
    const onClose = vi.fn();
    render(FAQ, { isOpen: true, onClose });

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Manage several schedules")).toBeTruthy();
    expect(screen.getByText("Data and privacy")).toBeTruthy();
    expect(screen.getByText(/session recording, and heatmaps/)).toBeTruthy();
    const guideImages = screen.getByRole("dialog").querySelectorAll("img");
    expect(guideImages).toHaveLength(8);
    expect(
      [...guideImages].every(
        (image) => image.alt && !image.src.includes("i.imgur.com"),
      ),
    ).toBe(true);
    await fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
