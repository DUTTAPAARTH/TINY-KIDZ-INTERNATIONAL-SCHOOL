# Fee Module E2E Testing - Playwright Test Suite

Complete test coverage for all buttons, forms, and interactions in the Fee Management Module.

## 📋 Test Coverage

### **Total Test Cases: 50+**

#### **Tab Navigation (2 tests)**
- Display all 5 tabs correctly
- Switch between tabs seamlessly

#### **Tab 0: Fee Structure (7 tests)**
- Display Fee Structure with all elements
- Open/close fee structure dialog
- Fill and submit fee structure form
- Edit and delete existing structures
- Change academic year filter

#### **Tab 1: Generate Fees (10 tests)**
- Display all 4 generate buttons
- **Button 1: Generate for One Class**
  - Open dialog
  - Fill form
  - Close dialog
- **Button 2: Generate for Whole School**
  - Open dialog
  - Fill form
- **Button 3: Generate for Class Range**
  - Open dialog
  - Fill form
- **Button 4: Generate for One Student**
  - Open dialog
  - Fill form

#### **Tab 2: View Records (10 tests)**
- Display all filters (Class, Quarter, Status, Fee Type)
- Display "Update Overdue Status" button
- Test Class filter dropdown
- Test Quarter filter dropdown
- Test Status filter dropdown
- Test Fee Type filter dropdown
- Display DataGrid with records
- Click Update Overdue Status button

#### **Tab 3: Defaulters (7 tests)**
- Display search bar and filters
- Type in search box
- Use Class filter
- Use Due Amount filter dropdown
- Display defaulters DataGrid
- Filter with multiple criteria

#### **Tab 4: Reports (7 tests)**
- Load and display charts
- Display summary KPI cards
- Display filter dropdowns
- Display CSV export buttons
- Display Print button
- Use monthly collection filter
- Use class-wise filter

#### **Form Validation (2 tests)**
- Validate fee structure form fields
- Handle modal close with Escape key

#### **Responsive & Accessibility (3 tests)**
- Render all buttons accessibly
- Proper tab order
- Graceful error handling

#### **Integration Tests (2 tests)**
- Flow through all tabs in sequence
- Maintain state when switching tabs

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Frontend running on `http://localhost:5173`
- Backend running on `http://localhost:5000`
- Admin account exists: `admin@tinykidz.com` / `admin123`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Install Playwright browsers (one-time)
npx playwright install
```

### Running Tests

#### Run all tests
```bash
npx playwright test
```

#### Run specific test file
```bash
npx playwright test tests/fee-module-e2e.spec.js
```

#### Run tests with UI mode (recommended for development)
```bash
npx playwright test --ui
```

#### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

#### Run specific test suite
```bash
# Test only Tab 0: Fee Structure
npx playwright test --grep "Fee Structure"

# Test only Tab 1: Generate Fees
npx playwright test --grep "Generate Fees"

# Test only form validation
npx playwright test --grep "Form Validation"
```

#### Run tests in debug mode
```bash
npx playwright test --debug
```

#### Run against specific browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# Mobile Chrome only
npx playwright test --project="Mobile Chrome"
```

### Viewing Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports are saved in:
- HTML Report: `tests/playwright-report/`
- JSON Results: `tests/test-results.json`
- JUnit XML: `tests/junit.xml`
- Screenshots: `tests/playwright-report/test-failed-*/`
- Videos: `tests/playwright-report/test-failed-*/`

## 📊 Test Structure

```
├── tests/
│   └── fee-module-e2e.spec.js (Main test file - 50+ tests)
├── playwright.config.js (Playwright configuration)
└── README.md (This file)
```

## 🔧 Configuration

### Browser Settings
- **Chromium**: Desktop Chrome browser
- **Firefox**: Desktop Firefox browser  
- **WebKit**: Desktop Safari browser
- **Mobile Chrome**: Pixel 5 emulation
- **Mobile Safari**: iPhone 12 emulation

### Timeouts
- Global test timeout: **60 seconds**
- Assertion timeout: **10 seconds**
- Auto-start local servers: Yes (dev @ 5173, backend @ 5000)

### On Failure
- **Screenshot**: Captured for failed tests
- **Video**: Recorded for failed tests
- **Trace**: Collected on first retry
- **Retry**: 2x on CI (0x locally)

## 📝 Test Examples

### Example 1: Testing Fee Structure Creation
```javascript
test('should fill and submit fee structure form', async ({ page }) => {
  await page.click('button:has-text("Set Fee Structure")');
  await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
  
  // Interact with form...
  const saveButton = page.locator('[role="dialog"] button:has-text("Save")');
  await expect(saveButton).toBeVisible();
});
```

### Example 2: Testing Filter Functionality
```javascript
test('should handle Status filter dropdown', async ({ page }) => {
  const statusSelect = page.locator('label:has-text("Status")').locator('..').locator('[role="button"]');
  await statusSelect.click();
  
  const paidOption = page.locator('[role="option"]:has-text("PAID")');
  if (await paidOption.isVisible({ timeout: 1000 })) {
    await paidOption.click();
  }
});
```

### Example 3: Testing Tab Navigation
```javascript
test('should switch between tabs correctly', async ({ page }) => {
  await page.click('[role="tab"]:has-text("Generate Fees")');
  await expect(page.locator('h5:has-text("Generate Fee Records")')).toBeVisible();
});
```

## 🧪 Debugging Tips

### Enable Debug Mode
```bash
npx playwright test --debug
```
This opens Playwright Inspector with step-through debugging.

### View Browser During Test
```bash
npx playwright test --headed
```
Runs tests with browser visible.

### Capture Trace for Analysis
```bash
npx playwright test --trace on
```
Creates trace files that can be viewed with:
```bash
npx playwright show-trace tests/trace.zip
```

### Add Console Logs to Tests
```javascript
console.log('Current URL:', page.url());
console.log('Text content:', await page.textContent('selector'));
```

## ⚙️ Customization

### Modifying Test Credentials
Edit the following in `tests/fee-module-e2e.spec.js`:
```javascript
const ADMIN_EMAIL = 'admin@tinykidz.com';
const ADMIN_PASSWORD = 'admin123';
```

### Changing Server URLs
```javascript
const BASE_URL = 'http://localhost:5173';  // Frontend URL
const API_BASE = 'http://localhost:5000';  // Backend API URL
```

### Adding New Tests
1. Add test block within existing describe block:
```javascript
test('should do something specific', async ({ page }) => {
  // Your test code here
});
```

2. Or create new describe block for feature area:
```javascript
test.describe('New Feature', () => {
  test('should test feature', async ({ page }) => {
    // Test code
  });
});
```

## 📋 Test Status Indicators

### ✅ Passing
- Test assertion met
- Element found and interacted with
- API response valid

### ❌ Failing
- Assertion not met
- Element not found
- Timeout exceeded
- Exception thrown

### ⚠️ Skipped
- Test marked with `test.skip()`
- Test marked with `test.fixme()`

### ⏭️ Flaky
- Retried due to flake
- May pass/fail intermittently

## 🔍 Common Issues & Solutions

### **Issue: Tests timeout waiting for elements**
```
Solution: Increase timeout in selector
await expect(element).toBeVisible({ timeout: 10000 });
```

### **Issue: Backend connection refused**
```
Solution: Ensure backend is running
cd backend && node server.js
```

### **Issue: Elements not found in selectors**
```
Solution: Use Page Inspector in headed mode to find exact selector
npx playwright test --headed --debug
```

### **Issue: Form submission fails silently**
```
Solution: Add loading waits and check for success messages
await page.waitForLoadState('networkidle');
```

## 📊 Performance Goals

- **Total Test Execution**: < 5 minutes (all 50+ tests)
- **Average Test Duration**: 5-10 seconds
- **Browser Load Time**: < 3 seconds
- **API Response Time**: < 2 seconds

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🤝 Contributing

To add new tests:
1. Follow existing test naming conventions
2. Add appropriate `describe` blocks for grouping
3. Document test purpose in comments
4. Use meaningful assertions with error messages
5. Test user workflows, not implementation details

## 📞 Support

For test failures or issues:
1. Check browser console for errors
2. Review screenshot/video in report
3. Run test in headed mode with `--debug`
4. Check backend logs for API errors
5. Verify test data exists in database

---

**Last Updated**: March 2025
**Test Framework**: Playwright 1.58.2
**Node.js Version**: 16+
