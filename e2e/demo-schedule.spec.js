import { expect, test } from "@playwright/test";

test("adds a DEMO class and keeps it after reload", async ({ page }) => {
  await page.goto("/tanrend");

  await page.getByPlaceholder("Search by subject code").fill("DEMO-1");
  await page.getByRole("button", { name: "Search" }).click();

  const selectedRow = page
    .getByRole("row")
    .filter({ hasText: "Monday 10:00-11:30" })
    .filter({ hasText: "DEMO-1-1" });
  await expect(selectedRow).toContainText("Introduction to Web Development");
  await selectedRow.getByRole("button", { name: "Add to schedule" }).click();
  await expect(
    page.getByText('Added "Introduction to Web Development"'),
  ).toBeVisible();

  await page.getByRole("link", { name: "Schedule Builder" }).click();
  await page.getByRole("button", { name: "I Understand" }).click();

  const subject = page.getByRole("checkbox", {
    name: "Introduction to Web Development",
  });
  await expect(subject).toBeChecked();

  await page.reload();

  await expect(
    page.getByRole("checkbox", {
      name: "Introduction to Web Development",
    }),
  ).toBeChecked();
});
