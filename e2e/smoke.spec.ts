import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page shows Seeker", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Seeker" })).toBeVisible();
    await expect(page).toHaveTitle(/Seeker/);
  });

  test("health endpoint reports database ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, db: true });
  });
});
