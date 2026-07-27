import { expect, test } from "@playwright/test";

test.describe("play — demo content pack", () => {
  test("a visitor can begin a journey, choose, reflect, collect, and have it persist", async ({
    page,
  }) => {
    await page.goto("/play");

    await expect(page.getByRole("heading", { name: "Enter as the Seeker" })).toBeVisible();
    await page.getByLabel("What shall we call you, Seeker?").fill("Ari");
    await page.getByRole("button", { name: "Begin your journey" }).click();

    await expect(page.getByRole("heading", { name: "The Garden Gate" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByRole("button", { name: "The quiet bench beneath the old tree" })
      .click();

    await expect(page.getByRole("heading", { name: "The Old Bench" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByPlaceholder("Write whatever comes to mind...")
      .fill("A settling stillness.");
    await page.getByRole("button", { name: "Save to journal" }).click();
    await expect(
      page.getByText("Saved — no one else will read this."),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Walk on toward the heart of the garden" })
      .click();

    await expect(page.getByRole("heading", { name: "The Heart of the Garden" })).toBeVisible();
    await expect(page.getByText("A Quiet Stone", { exact: true })).toBeVisible();
    await expect(page.getByText("✦ Found the Quiet", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Return to the garden gate" }).click();

    await expect(page.getByRole("heading", { name: "The Garden Gate" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("— your path")).toBeVisible();

    // Reload to confirm the journey persisted via the session cookie + database.
    await page.reload();

    await expect(page.getByRole("heading", { name: "The Garden Gate" })).toBeVisible();
    await expect(page.getByText("A Quiet Stone", { exact: true })).toBeVisible();
    await expect(page.getByText("✦ Found the Quiet", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("— your path")).toBeVisible();

    await page.getByRole("button", { name: "Your growth" }).click();
    await expect(page.getByText("Awareness")).toBeVisible();
    await expect(page.getByText("Seeker", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Journal" }).click();
    await expect(page.getByText("A settling stillness.")).toBeVisible();
  });
});
