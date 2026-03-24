**🚀 Project Setup**

# 1. Navigate to project folder
cd ott-regression

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install

**🔑 Configure Credentials**
Open:
test-config.js
Update with your valid credentials:
VALID_USER: {
  email: 'your-email',
  password: 'your-password',
}
**▶️ Run Tests**
🔹 Run Full Regression Suite
npx playwright test --headed

**👉 Runs all test files:**
Sign-in
Playback
Wishlist
Continue Watching
E2E flow
**🔹 Run in Headless Mode (faster)**
npx playwright test
**🔹 Run with Debug Mode**
npx playwright test --debug
**🎯 Run Individual Test Suites
🔐 Sign-In Tests**
npx playwright test tests/01-signin.spec.js --headed
**▶️ Playback Tests**
npx playwright test tests/02-playback.spec.js --headed
**❤️ Wishlist Tests**
npx playwright test tests/03-wishlist.spec.js --headed
**⏱️ Continue Watching Tests**
npx playwright test tests/04-continue-watching.spec.js --headed
**🔄 Full End-to-End Flow**
npx playwright test tests/05-e2e-full-flow.spec.js --headed

**📊 View Test Report**
After execution:
npx playwright show-report

**👉 Opens HTML report with:**
✅ Pass/Fail status
📸 Screenshots on failure
🎥 Video recordings
📄 Execution logs
🧠 Useful Commands
Purpose	Command
Run specific test case	npx playwright test -g "test name"
Run in Chromium only	npx playwright test --project=chromium
Run with 1 worker	npx playwright test --workers=1
Show trace viewer	npx playwright show-trace <trace.zip>

**🏗️ Project Structure**
ott-regression/
│
├── tests/
│   ├── 01-signin.spec.js
│   ├── 02-playback.spec.js
│   ├── 03-wishlist.spec.js
│   ├── 04-continue-watching.spec.js
│   └── 05-e2e-full-flow.spec.js
│
├── pages/                # Page Object Models
├── test-config.js        # Credentials & config
├── playwright.config.js  # Playwright settings
└── package.json
