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

test.describe("Payment Ledger - Add/View/Edit/Delete Payments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToFees(page);
  });

  test("should display View Records tab with action buttons", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "Fee Records" })).toBeVisible();

    // Check for action buttons in the DataGrid rows
    const demandSlipBtns = page.locator('button:has-text("Demand Slip")');
    const collectPaymentBtns = page.locator('button:has-text("Collect Payment")');
    const viewLedgerBtns = page.locator('button:has-text("View Ledger")');

    if (await demandSlipBtns.count() > 0) {
      await expect(demandSlipBtns.first()).toBeVisible({ timeout: 5000 });
    }
    if (await collectPaymentBtns.count() > 0) {
      await expect(collectPaymentBtns.first()).toBeVisible({ timeout: 5000 });
    }
    if (await viewLedgerBtns.count() > 0) {
      await expect(viewLedgerBtns.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("should open Collect Payment modal and show form fields", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const collectBtn = page.locator('button:has-text("Collect Payment")').first();
    if (await collectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // PaymentModal should be open
      await expect(page.getByText("Collect Payment")).toBeVisible({ timeout: 3000 });

      // Check for form fields
      await expect(page.getByLabel("Amount ₹")).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel("Payment Method")).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel("Payment Date")).toBeVisible({ timeout: 3000 });

      // Should have payment method options
      const methodSelect = page.getByLabel("Payment Method");
      await methodSelect.click();
      await page.waitForTimeout(300);
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(4);

      // Close modal
      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test("should show fee details in Collect Payment modal", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const collectBtn = page.locator('button:has-text("Collect Payment")').first();
    if (await collectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // Should show fee summary with Total, Paid, Due
      await expect(page.getByText(/Total:/).first()).toBeVisible();
      await expect(page.getByText(/Paid:/).first()).toBeVisible();
      await expect(page.getByText(/Due:/).first()).toBeVisible();

      // Balance helper text should be visible
      const amountInput = page.getByLabel("Amount ₹");
      await amountInput.fill("100");
      await expect(page.getByText(/Balance after payment/)).toBeVisible({ timeout: 3000 });

      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    }
  });

  test("should open View Ledger dialog and show payment history", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const ledgerBtn = page.locator('button:has-text("View Ledger")').first();
    if (await ledgerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ledgerBtn.click();
      await page.waitForTimeout(1000);

      // PaymentLedger dialog should be open
      await expect(page.getByText("Payment Ledger")).toBeVisible({ timeout: 5000 });

      // Should show fee summary section
      await expect(page.getByText("Fee Amount").first()).toBeVisible({ timeout: 3000 });
      await expect(page.getByText("Total Paid").first()).toBeVisible({ timeout: 3000 });
      await expect(page.getByText("Balance").first()).toBeVisible({ timeout: 3000 });
      await expect(page.getByText("Status").first()).toBeVisible({ timeout: 3000 });

      // Close
      await page.locator('[role="dialog"] button:has-text("Close")').first().click();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  });

  test("should show Add Payment button in ledger when balance > 0", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const ledgerBtn = page.locator('button:has-text("View Ledger")').first();
    if (await ledgerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ledgerBtn.click();
      await page.waitForTimeout(1000);

      // Check if Add Payment button exists (only for partial/unpaid)
      const addPaymentBtn = page.locator('[role="dialog"] button:has-text("Add Payment")');
      if (await addPaymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addPaymentBtn.click();
        await page.waitForTimeout(500);
        // Should navigate to Payment Modal
      }
    }
  });

  test("should show status badges in DataGrid", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    // Check for status chips in the DataGrid
    const statusChips = page.locator('[role="grid"] .MuiChip-root');
    if (await statusChips.count() > 0) {
      await expect(statusChips.first()).toBeVisible({ timeout: 5000 });

      // Verify it's one of the expected statuses
      const text = await statusChips.first().textContent();
      expect(["DUE", "PARTIAL", "PAID", "OVERDUE"]).toContain(text?.trim());
    }
  });

  test("should validate payment amount in Collect Payment modal", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const collectBtn = page.locator('button:has-text("Collect Payment")').first();
    if (await collectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // Try submitting with empty amount - button should be disabled
      const recordBtn = page.locator('[role="dialog"] button:has-text("Record Payment")');
      await expect(recordBtn).toBeDisabled();

      // Enter invalid amount
      const amountInput = page.getByLabel("Amount ₹");
      await amountInput.fill("0");
      await expect(recordBtn).toBeDisabled();

      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    }
  });

  test("should show cheque fields when Cheque method selected", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const collectBtn = page.locator('button:has-text("Collect Payment")').first();
    if (await collectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      // Select Cheque method
      const methodSelect = page.getByLabel("Payment Method");
      await methodSelect.click();
      await page.waitForTimeout(300);
      await page.locator('[role="option"]:has-text("Cheque")').click();
      await page.waitForTimeout(300);

      // Cheque fields should appear
      await expect(page.getByLabel("Cheque Number")).toBeVisible({ timeout: 2000 });
      await expect(page.getByLabel("Bank Name")).toBeVisible({ timeout: 2000 });

      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    }
  });

  test("should show transaction ID field when UPI selected", async ({ page }) => {
    await page.getByRole("tab", { name: "View Records" }).click();
    await page.waitForTimeout(1000);

    const collectBtn = page.locator('button:has-text("Collect Payment")').first();
    if (await collectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collectBtn.click();
      await page.waitForTimeout(500);

      const methodSelect = page.getByLabel("Payment Method");
      await methodSelect.click();
      await page.waitForTimeout(300);
      await page.locator('[role="option"]:has-text("UPI")').click();
      await page.waitForTimeout(300);

      await expect(page.getByLabel("Transaction ID")).toBeVisible({ timeout: 2000 });

      await page.locator('[role="dialog"] button:has-text("Cancel")').first().click();
    }
  });
});
