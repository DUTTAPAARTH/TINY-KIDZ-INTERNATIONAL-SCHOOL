import axios from "axios";
import { chromium } from "playwright";

const FRONTEND_URL = "http://localhost:5173";
const API_BASE = "http://localhost:5000/api";
const ADMIN_EMAIL = "admin@tinykidz.com";
const ADMIN_PASSWORD = "admin123";

const report = {
  backend: { checks: [], disparities: [] },
  ui: { checks: [], disparities: [] },
  blockers: [],
};

function pass(scope, name, details = "") {
  report[scope].checks.push({ name, status: "PASS", details });
}

function fail(scope, name, details = "") {
  report[scope].checks.push({ name, status: "FAIL", details });
}

function disparity(scope, details) {
  report[scope].disparities.push(details);
}

async function safeCheck(scope, name, fn) {
  try {
    const details = await fn();
    pass(scope, name, details || "");
    return true;
  } catch (error) {
    fail(scope, name, error?.message || String(error));
    return false;
  }
}

async function backendAudit() {
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  const token = loginRes?.data?.token;
  if (!token) throw new Error("Admin login succeeded but no token returned");

  const api = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  const state = {
    totalRecords: 0,
    dueRecords: 0,
    defaulters: 0,
    receiptCount: 0,
    firstRecord: null,
  };

  await safeCheck("backend", "GET /fees/class/all", async () => {
    const res = await api.get("/fees/class/all");
    const rows = Array.isArray(res.data) ? res.data : [];
    state.totalRecords = rows.length;
    state.dueRecords = rows.filter((r) => Number(r?.dueAmount ?? (Number(r?.totalAmount || 0) - Number(r?.paidAmount || 0))) > 0).length;
    state.firstRecord = rows[0] || null;
    return `records=${state.totalRecords}, dueRecords=${state.dueRecords}`;
  });

  await safeCheck("backend", "GET /fees/defaulters", async () => {
    const res = await api.get("/fees/defaulters");
    const rows = Array.isArray(res.data) ? res.data : [];
    state.defaulters = rows.length;
    return `defaulters=${state.defaulters}`;
  });

  await safeCheck("backend", "GET /fees/payment/today", async () => {
    const res = await api.get("/fees/payment/today");
    const amount = Number(res.data?.totalAmount || 0);
    const count = Number(res.data?.count || 0);
    return `todayAmount=${amount}, paymentCount=${count}`;
  });

  await safeCheck("backend", "DELETE /fees/cleanup-zero-records", async () => {
    const res = await api.delete("/fees/cleanup-zero-records");
    return `deletedCount=${Number(res.data?.deletedCount || 0)}`;
  });

  await safeCheck("backend", "GET /fees/fix-statuses", async () => {
    const res = await api.get("/fees/fix-statuses");
    return `checked=${Number(res.data?.checked || 0)}, updated=${Number(res.data?.updated || 0)}`;
  });

  if (state.firstRecord?.studentId?._id) {
    await safeCheck("backend", "GET /fees/demand-slip/:studentId", async () => {
      const res = await api.get(`/fees/demand-slip/${state.firstRecord.studentId._id}`);
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      return `items=${items.length}`;
    });

    await safeCheck("backend", "GET /fees/receipt/student/:studentId", async () => {
      const res = await api.get(`/fees/receipt/student/${state.firstRecord.studentId._id}`);
      const receipts = Array.isArray(res.data) ? res.data : [];
      state.receiptCount = receipts.length;
      return `receipts=${state.receiptCount}`;
    });
  } else {
    disparity("backend", "No fee records found; could not verify demand-slip/receipt-by-student endpoints.");
  }

  return { token, state };
}

async function uiAudit(backendState) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await safeCheck("ui", "Load login page", async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.getByRole("heading", { name: /Tiny Kidz International School/i }).waitFor({ timeout: 10000 });
      return "login page loaded";
    });

    await safeCheck("ui", "Admin login via UI", async () => {
      await page.getByLabel("Email").fill(ADMIN_EMAIL);
      await page.getByLabel("Password").fill(ADMIN_PASSWORD);
      await Promise.all([
        page.waitForURL("**/admin/dashboard", { timeout: 15000 }),
        page.getByRole("button", { name: /^Login$/i }).click(),
      ]);
      return `url=${page.url()}`;
    });

    await safeCheck("ui", "Open admin fee page", async () => {
      await page.goto(`${FRONTEND_URL}/admin/fees`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.getByRole("heading", { name: /Fee Management/i }).waitFor({ timeout: 10000 });
      return "fee management visible";
    });

    await safeCheck("ui", "Fee tabs visible", async () => {
      await page.getByRole("tab", { name: "Fee Structure" }).waitFor();
      await page.getByRole("tab", { name: "Generate Fees" }).waitFor();
      await page.getByRole("tab", { name: "View Records" }).waitFor();
      await page.getByRole("tab", { name: "Defaulters" }).waitFor();
      return "all tabs visible";
    });

    let collectBtnCount = 0;
    let paidChipCount = 0;

    await safeCheck("ui", "View Records actions rendered", async () => {
      await page.getByRole("tab", { name: "View Records" }).click();
      await page.getByText("Fee Records", { exact: false }).waitFor({ timeout: 10000 });
      await page.waitForTimeout(1200);

      collectBtnCount = await page.getByRole("button", { name: "Collect Payment" }).count();
      paidChipCount = await page.getByText("✓ PAID", { exact: false }).count();
      const demandBtnCount = await page.getByRole("button", { name: "Demand Slip" }).count();
      const ledgerBtnCount = await page.getByRole("button", { name: "View Ledger" }).count();

      if (demandBtnCount === 0 && backendState.totalRecords > 0) {
        disparity("ui", "Backend has fee records but no Demand Slip action visible in UI records grid.");
      }

      if (ledgerBtnCount === 0 && backendState.totalRecords > 0) {
        disparity("ui", "Backend has fee records but no View Ledger action visible in UI records grid.");
      }

      return `collectButtons=${collectBtnCount}, paidChips=${paidChipCount}, demandButtons=${demandBtnCount}, ledgerButtons=${ledgerBtnCount}`;
    });

    if (backendState.dueRecords > 0 && collectBtnCount === 0) {
      disparity("ui", `Backend reports ${backendState.dueRecords} due record(s) but UI shows 0 Collect Payment buttons.`);
    }

    await safeCheck("ui", "Demand slip dialog opens", async () => {
      const btn = page.getByRole("button", { name: "Demand Slip" }).first();
      await btn.click();
      await page.getByRole("heading", { name: "Demand Slip" }).waitFor({ timeout: 10000 });
      await page.getByText(/Tiny Kidz International School/i).first().waitFor({ timeout: 10000 });
      await page.getByRole("button", { name: "Close" }).click();
      return "demand slip dialog rendered";
    });

    await safeCheck("ui", "Ledger dialog opens", async () => {
      const btn = page.getByRole("button", { name: "View Ledger" }).first();
      await btn.click();
      await page.getByRole("heading", { name: "View Ledger" }).waitFor({ timeout: 10000 });
      const printCount = await page.getByRole("button", { name: "Print Receipt" }).count();
      await page.getByRole("button", { name: "Close" }).click();
      return `printReceiptButtonsInLedger=${printCount}`;
    });

    await safeCheck("ui", "Defaulters tab and filters", async () => {
      await page.getByRole("tab", { name: "Defaulters" }).click();
      await page.getByRole("heading", { name: "Defaulters" }).waitFor({ timeout: 10000 });
      await page.getByLabel("Search").waitFor({ timeout: 10000 });
      await page.getByLabel("Class").first().waitFor({ timeout: 10000 });
      await page.getByLabel("Due Filter").waitFor({ timeout: 10000 });
      return `backendDefaulters=${backendState.defaulters}`;
    });

    await safeCheck("ui", "Generate fees custom amount dialogs", async () => {
      await page.getByRole("tab", { name: "Generate Fees" }).click();
      await page.getByRole("heading", { name: "Generate Fee Records" }).waitFor({ timeout: 10000 });

      const configureButtons = page.getByRole("button", { name: "Configure" });
      const totalConfigure = await configureButtons.count();
      if (totalConfigure < 4) throw new Error(`Expected 4 Configure buttons, found ${totalConfigure}`);

      await configureButtons.nth(0).click();
      await page.getByRole("heading", { name: "Generate Fees for One Class" }).waitFor();
      await page.getByLabel("Custom Amount (Optional)").waitFor();
      await page.getByRole("button", { name: "Cancel" }).click();

      await configureButtons.nth(1).click();
      await page.getByRole("heading", { name: "Generate Fees for Whole School" }).waitFor();
      await page.getByLabel("Custom Amount (Optional)").waitFor();
      await page.getByRole("button", { name: "Cancel" }).click();

      await configureButtons.nth(2).click();
      await page.getByRole("heading", { name: "Generate Fees for Class Range" }).waitFor();
      await page.getByLabel("Custom Amount (Optional)").waitFor();
      await page.getByRole("button", { name: "Cancel" }).click();

      await configureButtons.nth(3).click();
      await page.getByRole("heading", { name: "Generate Fee for One Student" }).waitFor();
      await page.getByLabel("Amount").waitFor();
      await page.getByRole("button", { name: "Cancel" }).click();

      return "all 4 generation dialogs verified";
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const { state } = await backendAudit();
    await uiAudit(state);

    if (report.backend.disparities.length === 0 && report.ui.disparities.length === 0) {
      report.summary = "No disparities found between verified backend responses and tested fee UI flows.";
    } else {
      report.summary = "Disparities found. Review disparity lists for details.";
    }

    console.log(JSON.stringify(report, null, 2));

    const hasFailures =
      report.backend.checks.some((c) => c.status === "FAIL") ||
      report.ui.checks.some((c) => c.status === "FAIL");

    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    report.blockers.push(error?.message || String(error));
    report.summary = "Audit blocked before completion.";
    console.log(JSON.stringify(report, null, 2));
    process.exit(2);
  }
}

main();
