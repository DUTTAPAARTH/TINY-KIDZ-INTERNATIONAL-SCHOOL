import { chromium } from "playwright";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5175";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tinykidz.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const report = {
  meta: { frontend: FRONTEND_URL },
  checks: [],
  failures: [],
};

const dangerousPattern =
  /(generate|save|delete|update overdue|export|print report)/i;

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function recordCheck(name, action) {
  try {
    const details = (await action()) || "ok";
    report.checks.push({ name, status: "PASS", details });
  } catch (error) {
    const details = error?.message || String(error);
    report.checks.push({ name, status: "FAIL", details });
    report.failures.push(`${name}: ${details}`);
  }
}

async function closeDialogIfOpen(page) {
  const closeButtons = [
    page.getByRole("button", { name: /^Close$/i }),
    page.getByRole("button", { name: /^Cancel$/i }),
  ];

  for (const button of closeButtons) {
    if ((await button.count()) > 0 && (await button.first().isVisible())) {
      await button
        .first()
        .click({ timeout: 2000 })
        .catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  await page.keyboard.press("Escape").catch(() => {});
}

async function clickNamedButton(page, label, options = {}) {
  const { tabName = "", mode, index = 0 } = options;
  const resolvedMode =
    mode || (dangerousPattern.test(label) ? "trial" : "click");
  const nameRegex = new RegExp(`^${escapeRegExp(label)}$`, "i");
  const locator = page.getByRole("button", { name: nameRegex }).nth(index);

  await locator.waitFor({ timeout: 6000 });

  if (resolvedMode === "trial") {
    await locator.click({ trial: true, timeout: 5000 });
    return `${tabName} ${label}: trial`;
  }

  await locator.click({ timeout: 6000 });
  await page.waitForTimeout(250);
  await closeDialogIfOpen(page);
  return `${tabName} ${label}: clicked`;
}

async function openFeesPage(page) {
  await page.goto(`${FRONTEND_URL}/admin/fees`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page
    .getByRole("heading", { name: /Fee Management/i })
    .waitFor({ timeout: 15000 });
}

async function clickTabByIndex(page, index) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const tab = page.locator('[role="tab"]').nth(index);
  await tab.waitFor({ timeout: 6000 });
  await tab.click({ timeout: 6000 });
  await page.waitForTimeout(700);
}

async function setupViewRecords(page) {
  const classSelect = page.getByLabel("Class").first();
  if ((await classSelect.count()) === 0) return "class filter not found";

  await classSelect.click({ timeout: 4000 });
  await page
    .getByRole("option", { name: "All Classes" })
    .click({ timeout: 4000 });
  await page.waitForTimeout(1200);
  return "set class filter to All Classes";
}

async function auditFeeStructure(page) {
  await openFeesPage(page);

  await recordCheck("Fee Structure -> Set Fee Structure", async () =>
    clickNamedButton(page, "Set Fee Structure", {
      tabName: "Fee Structure",
      mode: "click",
    }),
  );

  const rowButtons = page.locator("table tbody tr button");
  const rowButtonCount = await rowButtons.count();
  report.checks.push({
    name: "Fee Structure -> Row Icon Buttons Present",
    status: rowButtonCount > 0 ? "PASS" : "FAIL",
    details: `count=${rowButtonCount}`,
  });

  if (rowButtonCount > 0) {
    await recordCheck("Fee Structure -> Edit Icon Button", async () => {
      await rowButtons.nth(0).click({ timeout: 5000 });
      await closeDialogIfOpen(page);
      return "clicked first row edit button";
    });
  }

  if (rowButtonCount > 1) {
    await recordCheck("Fee Structure -> Delete Icon Button", async () => {
      await rowButtons.nth(1).click({ timeout: 5000 });
      await closeDialogIfOpen(page);
      return "clicked first row delete button";
    });
  }
}

async function auditGenerateFees(page) {
  await openFeesPage(page);
  await clickTabByIndex(page, 1);

  await recordCheck("Generate Fees -> Configure buttons count", async () => {
    const configureButtons = page.getByRole("button", { name: /^Configure$/i });
    const count = await configureButtons.count();
    if (count < 4)
      throw new Error(`Expected 4 Configure buttons, found ${count}`);

    for (let i = 0; i < 4; i += 1) {
      await configureButtons.nth(i).click({ timeout: 5000 });
      await closeDialogIfOpen(page);
      await page.waitForTimeout(150);
    }

    return `clicked ${count} Configure button(s)`;
  });
}

async function auditViewRecords(page) {
  await openFeesPage(page);
  await clickTabByIndex(page, 2);

  await recordCheck("View Records -> Prepare class filter", async () =>
    setupViewRecords(page),
  );

  await recordCheck("View Records -> Update Overdue Status", async () =>
    clickNamedButton(page, "Update Overdue Status", {
      tabName: "View Records",
      mode: "trial",
    }),
  );

  const demandButtons = page.getByRole("button", { name: /^Demand Slip$/i });
  const ledgerButtons = page.getByRole("button", { name: /^View Ledger$/i });
  const collectButtons = page.getByRole("button", {
    name: /^Collect Payment$/i,
  });

  await recordCheck("View Records -> Demand Slip button", async () => {
    if ((await demandButtons.count()) === 0)
      return "not visible in current grid page";
    await demandButtons.first().click({ timeout: 5000 });
    await closeDialogIfOpen(page);
    return "clicked";
  });

  await recordCheck("View Records -> View Ledger button", async () => {
    if ((await ledgerButtons.count()) === 0)
      return "not visible in current grid page";
    await ledgerButtons.first().click({ timeout: 5000 });
    await closeDialogIfOpen(page);
    return "clicked";
  });

  await recordCheck("View Records -> Collect Payment button", async () => {
    if ((await collectButtons.count()) === 0)
      return "no due rows on current page";
    await collectButtons.first().click({ timeout: 5000 });
    await closeDialogIfOpen(page);
    return "clicked";
  });
}

async function auditDefaulters(page) {
  await openFeesPage(page);
  await clickTabByIndex(page, 3);

  await recordCheck("Defaulters -> Demand Slip button", async () => {
    const demandButtons = page.getByRole("button", { name: /^Demand Slip$/i });
    if ((await demandButtons.count()) === 0)
      return "not visible in current page";
    await demandButtons.first().click({ timeout: 5000 });
    await closeDialogIfOpen(page);
    return "clicked";
  });
}

async function auditReports(page) {
  await openFeesPage(page);
  await clickTabByIndex(page, 4);

  const reportButtons = [
    "Export Summary CSV",
    "Export Class-wise CSV",
    "Export Defaulters CSV",
    "Export All Payments CSV",
    "Print Report",
  ];

  for (const label of reportButtons) {
    await recordCheck(`Reports -> ${label}`, async () =>
      clickNamedButton(page, label, { tabName: "Reports", mode: "trial" }),
    );
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("dialog", async (dialog) => {
    await dialog.dismiss().catch(() => {});
  });

  try {
    await page.addInitScript(() => {
      window.print = () => {};
    });

    await recordCheck("Auth -> Open login", async () => {
      await page.goto(`${FRONTEND_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      return page.url();
    });

    await recordCheck("Auth -> Login admin", async () => {
      await page.getByLabel("Email").fill(ADMIN_EMAIL);
      await page.getByLabel("Password").fill(ADMIN_PASSWORD);
      await Promise.all([
        page.waitForURL("**/admin/dashboard", { timeout: 25000 }),
        page.getByRole("button", { name: /^Login$/i }).click(),
      ]);
      return page.url();
    });

    await recordCheck("Fees Page -> Open", async () => {
      await openFeesPage(page);
      return page.url();
    });

    const tabs = [
      "Fee Structure",
      "Generate Fees",
      "View Records",
      "Defaulters",
      "Reports",
    ];
    for (const tabName of tabs) {
      await recordCheck(`Tabs -> ${tabName} visible`, async () => {
        await page
          .getByRole("tab", { name: tabName })
          .waitFor({ timeout: 7000 });
        return "visible";
      });
    }

    await auditFeeStructure(page);
    await auditGenerateFees(page);
    await auditViewRecords(page);
    await auditDefaulters(page);
    await auditReports(page);
  } finally {
    await browser.close();
  }

  report.summary =
    report.failures.length === 0
      ? `Audit passed. ${report.checks.length} button/tab checks completed.`
      : `Audit completed with ${report.failures.length} failure(s) out of ${report.checks.length} checks.`;

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.failures.length > 0 ? 1 : 0);
}

run().catch((error) => {
  report.blocker = error?.message || String(error);
  report.summary = "Audit blocked before completion";
  console.log(JSON.stringify(report, null, 2));
  process.exit(2);
});
