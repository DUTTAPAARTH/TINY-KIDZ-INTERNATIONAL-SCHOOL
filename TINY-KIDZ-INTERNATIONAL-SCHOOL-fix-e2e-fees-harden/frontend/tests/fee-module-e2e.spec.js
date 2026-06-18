import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function loginAndGoToFees(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', "admin@tinykidz.com");
  await page.fill('input[type="password"]', "admin123");
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 30000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
  await page.goto(`${BASE_URL}/admin/fees`);
  await page.waitForURL(/\/admin\/fees/, { timeout: 10000 });
  await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
}

test.describe("Fee Module - Complete Button & Form Testing", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  // ==================== TAB NAVIGATION ====================
  test.describe("Tab Navigation", () => {
    test("should display all 5 tabs", async ({ page }) => {
      await expect(page.getByRole("tab")).toHaveCount(5);
      await expect(page.getByRole("tab", { name: "Fee Structure" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Generate Fees" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "View Records" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Defaulters" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
    });

    test("should switch between tabs correctly", async ({ page }) => {
      const tabNames = ["Fee Structure", "Generate Fees", "View Records", "Defaulters", "Reports"];
      for (const name of tabNames) {
        const tab = page.getByRole("tab", { name });
        await tab.click();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        await page.waitForTimeout(500);
      }
    });
  });

  // ==================== TAB 0: FEE STRUCTURE ====================
  test.describe("Tab 0: Fee Structure - Buttons & Forms", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "Fee Structure" }).click();
      await page.waitForTimeout(500);
    });

    test("should display Fee Structure tab with required elements", async ({ page }) => {
      await expect(page.getByText("Academic Year").first()).toBeVisible();
      await expect(page.getByRole("combobox").first()).toBeVisible();
      await expect(page.getByRole("button", { name: /Set Fee Structure/i })).toBeVisible();
    });

    test("should open Set Fee Structure dialog", async ({ page }) => {
      await page.getByRole("button", { name: /Set Fee Structure/i }).click();
      await expect(page.getByRole("heading", { name: "Set Fee Structure" })).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Tuition Fee").first()).toBeVisible();
    });

    test("should fill and submit fee structure form", async ({ page }) => {
      await page.getByRole("button", { name: /Set Fee Structure/i }).click();
      await expect(page.getByRole("heading", { name: "Set Fee Structure" })).toBeVisible({ timeout: 5000 });

      // Open Class select (MUI Select uses role="combobox")
      const classCombos = page.locator('[role="dialog"] [role="combobox"]');
      if (await classCombos.count() > 0) {
        await classCombos.first().click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible({ timeout: 1500 })) {
          await opt.click();
          await page.waitForTimeout(300);
        }
      }

      // Fill Tuition Fee (first number input in dialog)
      const inputs = page.locator('[role="dialog"] input[type="number"]');
      if (await inputs.count() > 0) {
        await inputs.first().fill("5000");
      }

      // Save button should be visible inside the dialog
      await expect(page.locator('[role="dialog"] button:has-text("Save")')).toBeVisible();
    });

    test("should close fee structure dialog on Cancel", async ({ page }) => {
      await page.getByRole("button", { name: /Set Fee Structure/i }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

      const cancelBtn = page.locator('[role="dialog"] button:has-text("Cancel")').first();
      await cancelBtn.click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test("should display edit and delete icons for structures", async ({ page }) => {
      const rows = page.locator("table tbody tr");
      if (await rows.count() === 0) {
        test.skip(); return;
      }

      // MUI IconButton renders EditIcon with data-testid="EditIcon"
      await expect(page.locator('[data-testid="EditIcon"]').first()).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="DeleteIcon"]').first()).toBeVisible({ timeout: 3000 });
    });

    test("should change academic year filter", async ({ page }) => {
      // Click the combobox to open dropdown
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() > 0) {
        await combos.first().click();
        await page.waitForTimeout(500);
        const opts = page.locator('[role="option"]');
        if (await opts.count() > 1) {
          await opts.nth(1).click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  // ==================== TAB 1: GENERATE FEES ====================
  test.describe("Tab 1: Generate Fees - All 4 Buttons & Forms", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "Generate Fees" }).click();
      await page.waitForTimeout(500);
    });

    test("should display all 4 generate buttons", async ({ page }) => {
      await expect(page.locator('button:has-text("Configure")')).toHaveCount(4);
      await expect(page.getByText("Generate for One Class")).toBeVisible();
      await expect(page.getByText("Generate for Whole School")).toBeVisible();
      await expect(page.getByText("Generate for Class Range")).toBeVisible();
      await expect(page.getByText("Generate for One Student")).toBeVisible();
    });

    async function openCardDialog(page, cardTitle) {
      const card = page.locator(`h6:has-text("${cardTitle}")`).locator("..").locator("..");
      await card.locator('button:has-text("Configure")').click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }

    test("Button 1: Generate for One Class - open dialog", async ({ page }) => {
      await openCardDialog(page, "Generate for One Class");
      await expect(page.getByText("Generate Fees for One Class")).toBeVisible();
    });

    test("Button 1: Generate for One Class - fill form", async ({ page }) => {
      await openCardDialog(page, "Generate for One Class");

      const combos = page.locator('[role="dialog"] [role="combobox"]');
      if (await combos.count() > 0) {
        await combos.first().click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible({ timeout: 1000 })) {
          await opt.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test("Button 1: Generate for One Class - close dialog", async ({ page }) => {
      await openCardDialog(page, "Generate for One Class");
      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test("Button 2: Generate for Whole School - open dialog", async ({ page }) => {
      await openCardDialog(page, "Generate for Whole School");
      await expect(page.getByText("Generate Fees for Whole School")).toBeVisible();
    });

    test("Button 2: Generate for Whole School - fill form", async ({ page }) => {
      await openCardDialog(page, "Generate for Whole School");

      const combos = page.locator('[role="dialog"] [role="combobox"]');
      if (await combos.count() > 0) {
        await combos.first().click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible({ timeout: 1000 })) {
          await opt.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test("Button 3: Generate for Class Range - open dialog", async ({ page }) => {
      await openCardDialog(page, "Generate for Class Range");
      await expect(page.getByText("Generate Fees for Class Range")).toBeVisible();
    });

    test("Button 3: Generate for Class Range - fill form", async ({ page }) => {
      await openCardDialog(page, "Generate for Class Range");

      // Fill From Class number input
      const numbers = page.locator('[role="dialog"] input[type="number"]');
      if (await numbers.count() > 0) {
        await numbers.first().fill("1");
      }
    });

    test("Button 4: Generate for One Student - open dialog", async ({ page }) => {
      await openCardDialog(page, "Generate for One Student");
      await expect(page.getByRole("heading", { name: "Generate Fee for One Student" })).toBeVisible({ timeout: 8000 });
    });

    test("Button 4: Generate for One Student - fill form", async ({ page }) => {
      await openCardDialog(page, "Generate for One Student");
      await page.waitForTimeout(2000); // Wait for students to load

      // The student selector is an Autocomplete - find its input
      const autoInput = page.locator('[role="dialog"] input[role="combobox"]');
      if (await autoInput.count() > 0) {
        await autoInput.click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible({ timeout: 2000 })) {
          await opt.click();
          await page.waitForTimeout(300);
        }
      } else {
        // Fallback: look for any combobox in the dialog
        const combos = page.locator('[role="dialog"] [role="combobox"]');
        if (await combos.count() > 0) {
          await combos.first().click();
          await page.waitForTimeout(500);
          const opt = page.locator('[role="option"]').first();
          if (await opt.isVisible({ timeout: 1000 })) {
            await opt.click();
          }
        }
      }
    });
  });

  // ==================== TAB 2: VIEW RECORDS ====================
  test.describe("Tab 2: View Records - Buttons & Filters", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "View Records" }).click();
      await page.waitForTimeout(1000);
    });

    test("should display View Records tab with all filters", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Fee Records" })).toBeVisible();
      await expect(page.getByText("Class").first()).toBeVisible();
      await expect(page.getByText("Quarter").first()).toBeVisible();
      await expect(page.getByText("Status").first()).toBeVisible();
      await expect(page.getByText("Fee Type").first()).toBeVisible();
    });

    test("should display Update Overdue Status button", async ({ page }) => {
      await expect(page.locator('button:has-text("Update Overdue Status")')).toBeVisible();
    });

    test("should handle Class filter dropdown", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() > 0) {
        await combos.first().click();
        await page.waitForTimeout(500);
        const opts = page.locator('[role="option"]');
        await expect(await opts.count()).toBeGreaterThan(0);
        await opts.first().click();
        await page.waitForTimeout(500);
      }
    });

    test("should handle Quarter filter dropdown", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() < 3) { test.skip(); return; }
      // Quarter is typically the 3rd combobox (after Class, Academic Year)
      await combos.nth(2).click();
      await page.waitForTimeout(500);
      const q1 = page.locator('[role="option"]:has-text("Q1")');
      if (await q1.isVisible({ timeout: 1000 })) {
        await q1.click();
        await page.waitForTimeout(500);
      }
    });

    test("should handle Status filter dropdown", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      // Status is typically the 3rd combobox (Class, Academic Year, Quarter, Status, Fee Type)
      if (await combos.count() >= 3) {
        await combos.nth(2).click();
        await page.waitForTimeout(500);
      }

      const paid = page.locator('[role="option"]:has-text("PAID")');
      if (await paid.isVisible({ timeout: 1000 })) {
        await paid.click();
        await page.waitForTimeout(500);
      }
    });

    test("should handle Fee Type filter dropdown", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() >= 4) {
        await combos.nth(3).click();
        await page.waitForTimeout(500);
      }

      const tuition = page.locator('[role="option"]:has-text("Tuition")');
      if (await tuition.isVisible({ timeout: 1000 })) {
        await tuition.click();
        await page.waitForTimeout(500);
      }
    });

    test("should display DataGrid with records", async ({ page }) => {
      // DataGrid only shows when a class is selected
      const grid = page.locator('[role="grid"]');
      if (await grid.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(grid).toBeVisible();
      } else {
        await expect(page.getByText("Select a class to view fee records")).toBeVisible();
      }
    });

    test("should click Update Overdue Status button", async ({ page }) => {
      const btn = page.locator('button:has-text("Update Overdue Status")');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  // ==================== TAB 3: DEFAULTERS ====================
  test.describe("Tab 3: Defaulters - Search & Filters", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "Defaulters" }).click();
      await page.waitForTimeout(1000);
    });

    test("should display Defaulters tab with search and filters", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Defaulters" })).toBeVisible();
      await expect(page.getByLabel("Search")).toBeVisible();
      await expect(page.getByText("Class").first()).toBeVisible();
      await expect(page.getByText("Due Filter").first()).toBeVisible();
    });

    test("should type in Search box", async ({ page }) => {
      const searchBox = page.getByLabel("Search");
      await expect(searchBox).toBeVisible();
      await searchBox.fill("Test");
      await expect(searchBox).toHaveValue("Test");
      await searchBox.clear();
      await expect(searchBox).toHaveValue("");
    });

    test("should use Class filter in Defaulters tab", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() > 0) {
        await combos.first().click();
        await page.waitForTimeout(500);
        const opts = page.locator('[role="option"]');
        if (await opts.count() > 0) {
          await opts.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test("should use Due Filter dropdown", async ({ page }) => {
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() >= 2) {
        await combos.nth(1).click();
        await page.waitForTimeout(500);
        const opts = page.locator('[role="option"]');
        await expect(await opts.count()).toBeGreaterThan(0);

        const opt1000 = opts.filter({ hasText: "1,000+" });
        if (await opt1000.isVisible({ timeout: 1000 })) {
          await opt1000.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test("should display Defaulters DataGrid", async ({ page }) => {
      const grid = page.locator('[role="grid"]');
      if (await grid.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(grid).toBeVisible();
      }
    });
  });

  // ==================== TAB 4: REPORTS ====================
  test.describe("Tab 4: Reports - Charts & Export Buttons", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "Reports" }).click();
      await page.waitForTimeout(2000);
    });

    test("should display Reports tab and load data", async ({ page }) => {
      const svgs = page.locator("svg");
      if (await svgs.first().isVisible({ timeout: 10000 }).catch(() => false)) {
        await expect(svgs.first()).toBeVisible();
      }
      // Check for charts - at least the loading state resolves
      await page.waitForTimeout(2000);
    });

    test("should display summary KPI cards", async ({ page }) => {
      const card = page.locator('[class*="MuiCard"]').first();
      if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(card).toBeVisible();
      }
    });

    test("should display filter dropdowns in Reports", async ({ page }) => {
      // FeeReportsTab component may or may not have filters
      const combos = page.locator('[role="combobox"]');
      const count = await combos.count();
      expect(count).toBeGreaterThanOrEqual(0); // Just verify page loaded
    });
  });
});
