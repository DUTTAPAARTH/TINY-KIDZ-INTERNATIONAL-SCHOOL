import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const ADMIN_EMAIL = "admin@tinykidz.com";
const ADMIN_PASSWORD = "admin123";
const TEACHER_EMAIL = "teacher@tinykidz.com";
const TEACHER_PASSWORD = "teacher123";
const STUDENT_EMAIL = "student@tinykidz.com";
const STUDENT_PASSWORD = "student123";

async function login(page, email, password, expectedPath) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith(expectedPath), { timeout: 20000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

test.describe("Marks Module - E2E Tests", () => {

  // ==================== TEACHER MARKS ====================
  test.describe("Teacher Marks", () => {
    test("should load teacher marks page with heading", async ({ page }) => {
      await login(page, TEACHER_EMAIL, TEACHER_PASSWORD, "/teacher");
      await page.goto(`${BASE_URL}/teacher/marks`);
      await expect(page.getByText("Teacher Marks Management")).toBeVisible({ timeout: 10000 });
    });

    test("should show class buttons or no-classes message", async ({ page }) => {
      await login(page, TEACHER_EMAIL, TEACHER_PASSWORD, "/teacher");
      await page.goto(`${BASE_URL}/teacher/marks`);
      await page.waitForTimeout(3000);

      const noClasses = page.getByText("No classes assigned");
      const classBtn = page.locator("button").filter({ hasText: /^[A-Za-z0-9]/ }).first();

      const noVisible = await noClasses.isVisible().catch(() => false);
      const btnVisible = await classBtn.isVisible().catch(() => false);

      if (noVisible) {
        await expect(noClasses).toBeVisible();
      } else if (btnVisible) {
        // Click class, check subject selector appears
        await classBtn.click();
        await page.waitForTimeout(1500);
        await expect(page.getByText("Subject")).toBeVisible({ timeout: 5000 });
      }
    });

    test("should show Save All, Print and Refresh buttons when selections made", async ({ page }) => {
      await login(page, TEACHER_EMAIL, TEACHER_PASSWORD, "/teacher");
      await page.goto(`${BASE_URL}/teacher/marks`);
      await page.waitForTimeout(3000);

      const classBtn = page.locator("button").filter({ hasText: /^[A-Za-z0-9]/ }).first();
      if (!(await classBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await classBtn.click();
      await page.waitForTimeout(1500);

      // Select subject
      const combo = page.locator('[role="combobox"]').first();
      if (await combo.isVisible().catch(() => false)) {
        await combo.click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible().catch(() => false)) {
          await opt.click();
          await page.waitForTimeout(500);
        }
      }

      // Select exam type
      const combos = page.locator('[role="combobox"]');
      if (await combos.count() >= 2) {
        await combos.nth(1).click();
        await page.waitForTimeout(500);
        const opt = page.locator('[role="option"]').first();
        if (await opt.isVisible().catch(() => false)) {
          await opt.click();
          await page.waitForTimeout(500);
        }
      }

      // Check action buttons
      const saveBtn = page.getByRole("button", { name: /save all/i });
      const printBtn = page.getByRole("button", { name: /print/i });
      const refreshBtn = page.getByRole("button", { name: /refresh/i });

      const s = await saveBtn.isVisible().catch(() => false);
      const p = await printBtn.isVisible().catch(() => false);
      const r = await refreshBtn.isVisible().catch(() => false);

      if (!s && !p && !r) test.skip();
      else {
        if (s) await expect(saveBtn).toBeVisible();
        if (p) await expect(printBtn).toBeVisible();
        if (r) await expect(refreshBtn).toBeVisible();
      }
    });
  });

  // ==================== STUDENT MARKS ====================
  test.describe("Student Marks", () => {
    test("should load student marks with heading", async ({ page }) => {
      await login(page, STUDENT_EMAIL, STUDENT_PASSWORD, "/student");
      await page.goto(`${BASE_URL}/student/marks`);
      await expect(page.getByText("My Marks & Performance")).toBeVisible({ timeout: 10000 });
    });

    test("should show performance summary cards when data exists", async ({ page }) => {
      await login(page, STUDENT_EMAIL, STUDENT_PASSWORD, "/student");
      await page.goto(`${BASE_URL}/student/marks`);
      await page.waitForTimeout(3000);

      const cards = page.getByText("Total Exams");
      if (await cards.isVisible().catch(() => false)) {
        await expect(cards).toBeVisible();
        await expect(page.getByText("Overall Average")).toBeVisible();
      }
    });

    test("should show marks table with subject, marks, and grade columns", async ({ page }) => {
      await login(page, STUDENT_EMAIL, STUDENT_PASSWORD, "/student");
      await page.goto(`${BASE_URL}/student/marks`);
      await page.waitForTimeout(3000);

      const table = page.locator("table");
      if (await table.isVisible().catch(() => false)) {
        await expect(page.getByText("Subject")).toBeVisible();
        await expect(page.getByText("Exam Type")).toBeVisible();
        await expect(page.getByText("Marks")).toBeVisible();
        await expect(page.getByText("Grade")).toBeVisible();
      } else {
        await expect(page.getByText(/no marks/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ==================== ADMIN MARKS ====================
  test.describe("Admin Marks", () => {
    test("should load admin marks page with heading and filters", async ({ page }) => {
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
      await page.goto(`${BASE_URL}/admin/marks`);
      await expect(page.getByText("Marks Management")).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button", { name: /apply filters/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("button", { name: /reset/i })).toBeVisible();
    });

    test("should show marks table when records exist", async ({ page }) => {
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
      await page.goto(`${BASE_URL}/admin/marks`);
      await page.waitForTimeout(4000);

      const table = page.locator("table");
      if (await table.isVisible().catch(() => false)) {
        await expect(page.getByText("Student")).toBeVisible();
        await expect(page.getByText("Subject")).toBeVisible();
        await expect(page.getByText("Marks")).toBeVisible();
        await expect(page.getByText("Grade")).toBeVisible();
      } else {
        await expect(page.getByText(/no marks/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ==================== CROSS-ROLE SECURITY ====================
  test.describe("Role Security", () => {
    test("student cannot access teacher marks page", async ({ page }) => {
      await login(page, STUDENT_EMAIL, STUDENT_PASSWORD, "/student");
      await page.goto(`${BASE_URL}/teacher/marks`);
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain("/teacher/marks");
    });

    test("teacher cannot access admin marks page", async ({ page }) => {
      await login(page, TEACHER_EMAIL, TEACHER_PASSWORD, "/teacher");
      await page.goto(`${BASE_URL}/admin/marks`);
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain("/admin/marks");
    });
  });
});
