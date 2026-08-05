import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import AppNotices from "../src/components/AppNotices.svelte";

describe("AppNotices", () => {
  it("renders and closes the general notice", async () => {
    const onCloseWarning = vi.fn();
    render(AppNotices, { showWarning: true, onCloseWarning });

    await fireEvent.click(screen.getByRole("button", { name: "I Understand" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(onCloseWarning).toHaveBeenCalledOnce();
  });

  it("closes the mobile notice with Escape", async () => {
    const onCloseMobileWarning = vi.fn();
    render(AppNotices, { showMobileWarning: true, onCloseMobileWarning });

    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onCloseMobileWarning).toHaveBeenCalledOnce();
  });
});
