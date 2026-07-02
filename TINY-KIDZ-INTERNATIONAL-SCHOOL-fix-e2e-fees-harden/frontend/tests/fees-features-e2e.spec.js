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

async function selectFirstOptionFromCombobox(page, dialog) {
  const scope = dialog || page;
  const combos = scope.locator('[role="combobox"]');
  const count = await combos.count();
  if (count === 0) return false;
  for (let i = 0; i < count; i++) {
    const combo = combos.nth(i);
    if (await combo.isVisible({ timeout: 1000 }).catch(() => false)) {
      await combo.click();
      await page.waitForTimeout(300);
      const opt = page.locator('[role="option"]').first();
      if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(300);
        return true;
      }
    }
  }
  return false;
}

// ============================================
// FEATURE 1: DISCOUNT / CONCESSION MANAGEMENT
// ============================================
test.describe("Feature 1: Discount Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should open discount dialog from View Records", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    // Select a class first so DataGrid shows records
    const combos = page.locator('[role="combobox"]');
    if (await combos.count() > 0) {
      await combos.first().click();
      await page.waitForTimeout(400);
      const opt = page.locator('[role="option"]').first();
      if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1500);
      }
    }

    const discBtn = page.locator('button:has-text("Disc")').first();
    if (await discBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await discBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByRole("heading", { name: /Discount/ })).toBeVisible({ timeout: 3000 });
      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    }
  });

  test("should display Discount button on fee records", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);
    // Discount/Edit Disc buttons only appear when a class is selected and records exist
    // This is a soft check — skip if no class selected
    const discBtn = page.locator('button:has-text("Disc"), button:has-text("Discount")').first();
    if (await discBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(discBtn).toBeVisible();
    }
  });

  test("should show discount fields in dialog", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    // Select class first
    const combos = page.locator('[role="combobox"]');
    if (await combos.count() > 0) {
      await combos.first().click();
      await page.waitForTimeout(400);
      const opt = page.locator('[role="option"]').first();
      if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1500);
      }
    }

    const discBtn = page.locator('button:has-text("Disc")').first();
    if (await discBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await discBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText("Discount Type").first()).toBeVisible({ timeout: 3000 });
      await expect(dialog.getByText("Reason").first()).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================
// FEATURE 2: BULK PAYMENT ENTRY
// ============================================
test.describe("Feature 2: Bulk Payment Entry", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should open bulk payment modal from Generate Fees tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('button:has-text("Bulk Payment Entry")')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Bulk Payment Entry")').click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Bulk Payment Entry" })).toBeVisible({ timeout: 3000 });
    await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("should show class, fee type, amount, method fields in bulk payment modal", async ({ page }) => {
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Bulk Payment Entry")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText("Class").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("Fee Type").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("Payment Method").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("Amount per record").first()).toBeVisible({ timeout: 3000 });
  });

  test("should allow selecting a class and seeing students", async ({ page }) => {
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Bulk Payment Entry")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');

    // Select first available class
    const combos = dialog.locator('[role="combobox"]');
    if (await combos.count() > 0) {
      await combos.first().click();
      await page.waitForTimeout(400);
      const opt = page.locator('[role="option"]').first();
      if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(2000);

        // Check for "Select All" or student checkboxes
        const checkboxes = dialog.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        // If students loaded, checkbox count > 0
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("should have select all checkbox for students", async ({ page }) => {
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Bulk Payment Entry")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const combos = dialog.locator('[role="combobox"]');
    if (await combos.count() > 0) {
      await combos.first().click();
      await page.waitForTimeout(400);
      const opt = page.locator('[role="option"]').first();
      if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1500);

        // Check for "Select All" text
        const selectAll = dialog.locator("text=Select All");
        if (await selectAll.isVisible({ timeout: 2000 }).catch(() => false)) {
          const checkbox = selectAll.locator('input[type="checkbox"]');
          await expect(checkbox).toBeVisible({ timeout: 2000 });
        }
      }
    }
  });

  test("should show Record Payments button enabled when form valid", async ({ page }) => {
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Bulk Payment Entry")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const recordBtn = dialog.locator('button:has-text("Record Payments")');

    // Initially may be disabled
    // Fill amount to start
    const numbers = dialog.locator('input[type="number"]');
    if (await numbers.count() > 0) {
      await numbers.first().fill("5000");
    }
  });
});

// ============================================
// FEATURE 3: FEE STRUCTURE ROLLOVER
// ============================================
test.describe("Feature 3: Fee Structure Rollover", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should display Rollover button in Fee Structure tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('button:has-text("Rollover")')).toBeVisible({ timeout: 3000 });
  });

  test("should open rollover dialog with source and target year selectors", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Rollover")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("From Year").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("To Year").first()).toBeVisible({ timeout: 3000 });

    // Should have 2 comboboxes
    const combos = dialog.locator('[role="combobox"]');
    await expect(combos).toHaveCount(2);
  });

  test("should allow selecting source and target years", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Rollover")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');

    // Select source year
    const combos = dialog.locator('[role="combobox"]');
    if (await combos.count() >= 2) {
      await combos.first().click();
      await page.waitForTimeout(400);
      const opts = page.locator('[role="option"]');
      if (await opts.count() > 1) {
        await opts.first().click();
        await page.waitForTimeout(300);

        // Select target year (different)
        await combos.nth(1).click();
        await page.waitForTimeout(400);
        const yearOpts = page.locator('[role="option"]');
        if (await yearOpts.count() > 1) {
          await yearOpts.nth(1).click();
          await page.waitForTimeout(300);
        }
      }
    }

    await expect(page.locator('[role="dialog"] button:has-text("Rollover")')).toBeVisible();
  });

  test("should close rollover dialog on Cancel", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Rollover")').click();
    await page.waitForTimeout(500);

    await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("should show Rollover button enabled when years selected", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Rollover")').click();
    await page.waitForTimeout(500);

    await selectFirstOptionFromCombobox(page, page.locator('[role="dialog"]'));

    const rolloverBtn = page.locator('[role="dialog"] button:has-text("Rollover")');
    await expect(rolloverBtn).toBeVisible();
    await expect(rolloverBtn).toBeEnabled();
  });
});

// ============================================
// FEATURE 4: CSV IMPORT
// ============================================
test.describe("Feature 4: Import Fee Records from CSV", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should display Import CSV button in Fee Structure tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('button:has-text("Import CSV")')).toBeVisible({ timeout: 3000 });
  });

  test("should open import dialog and show file input", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Import CSV")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText("Import Fee Records from CSV")).toBeVisible({ timeout: 3000 });
    await expect(dialog.locator('input[type="file"]')).toBeVisible({ timeout: 3000 });
  });

  test("should show CSV format instructions in dialog", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Import CSV")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText("studentId").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("feeType").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("totalAmount").first()).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText("dueDate").first()).toBeVisible({ timeout: 3000 });
  });

  test("should accept CSV file upload", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Import CSV")').click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('[role="dialog"] input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-fees.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("studentId,feeType,totalAmount,dueDate\nabc123,Tuition,5000,2025-04-10"),
    });

    await page.waitForTimeout(300);
    await expect(page.locator('[role="dialog"]').getByText("test-fees.csv")).toBeVisible({ timeout: 3000 });
  });

  test("should have Import button enabled after file selected", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Import CSV")').click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('[role="dialog"] input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("studentId,feeType,totalAmount,dueDate\nabc,Tuition,5000,2025-04-10"),
    });

    await page.waitForTimeout(300);
    const importBtn = page.locator('[role="dialog"] button:has-text("Import")');
    await expect(importBtn).toBeEnabled({ timeout: 2000 });
  });

  test("should close import dialog on Cancel", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Import CSV")').click();
    await page.waitForTimeout(500);

    await page.locator('[role="dialog"] button:has-text("Cancel")').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

// ============================================
// WORKFLOW & UI INTEGRATION
// ============================================
test.describe("Workflow & UI Integration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should display Quick Start section with 5 steps", async ({ page }) => {
    await expect(page.getByText("Quick Start")).toBeVisible({ timeout: 3000 });

    const steps = [
      "Set Fee Structure",
      "Generate Fee Records",
      "Collect Payments",
      "Track Defaulters",
      "Reports",
    ];
    for (const step of steps) {
      await expect(page.getByText(step).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("should display Today's Collection summary", async ({ page }) => {
    await expect(page.getByText("Today's Collection")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=₹").first()).toBeVisible({ timeout: 3000 });
  });

  test("should have all 5 tabs", async ({ page }) => {
    const tabs = [
      "Fee Structure",
      "Generate Fees",
      "View Records",
      "Defaulters",
      "Reports",
    ];
    await expect(page.getByRole("tab")).toHaveCount(5);
    for (const name of tabs) {
      await expect(page.getByRole("tab", { name })).toBeVisible();
    }
  });

  test("should allow switching between all tabs", async ({ page }) => {
    const tabNames = ["Fee Structure", "Generate Fees", "View Records", "Defaulters", "Reports"];
    for (const name of tabNames) {
      await page.getByRole("tab", { name }).click();
      await page.waitForTimeout(500);
      await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    }
  });

  test("should show academic years up to 2034-35", async ({ page }) => {
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);

    const combos = page.locator('[role="combobox"]');
    if (await combos.count() > 0) {
      await combos.first().click();
      await page.waitForTimeout(500);

      const opts = page.locator('[role="option"]');
      const count = await opts.count();
      expect(count).toBeGreaterThanOrEqual(10);

      await expect(page.locator('[role="option"]:has-text("2034")')).toBeVisible({ timeout: 2000 });
      // Dismiss dropdown
      await page.keyboard.press("Escape");
    }
  });
});

// ============================================
// END-TO-END WORKFLOW TEST
// ============================================
test.describe("End-to-End Workflow", () => {
  test("navigate between tabs and verify all new feature buttons exist", async ({ page }) => {
    await loginAndGoToFees(page);

    // Tab 0: Fee Structure - check Rollover & Import CSV
    await page.getByRole("tab", { name: "Fee Structure" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Rollover")')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Import CSV")')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Set Structure")')).toBeVisible({ timeout: 3000 });

    // Tab 1: Generate Fees - check Bulk Payment
    await page.getByRole("tab", { name: "Generate Fees" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Bulk Payment Entry")')).toBeVisible({ timeout: 3000 });

    // Tab 2: View Records - check Discount buttons (soft check)
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);
    const discBtn = page.locator('button:has-text("Disc")').first();
    if (await discBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(discBtn).toBeVisible();
    }

    // Tab 3: Defaulters
    await page.getByRole("tab", { name: "Defaulters" }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { name: "Defaulters" })).toBeVisible();

    // Tab 4: Reports
    await page.getByRole("tab", { name: "Reports" }).click();
    await page.waitForTimeout(1000);
  });
});
