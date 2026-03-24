// utils/loginHelper.js
const SignInPage  = require('../pages/SignInPage');
const ContentPage = require('../pages/ContentPage');
const { VALID_USER } = require('../test-config');

async function loginAndGoHome(page) {
  const sp = new SignInPage(page);
  await sp.navigateToSignInPage();
  if (!(await sp.isEmailFieldVisible())) {
    console.log('⚠️  Login form not found');
    return false;
  }

  // Submit credentials
  await sp.enterEmail(VALID_USER.email);
  await sp.enterPassword(VALID_USER.password);
  await sp.clickSubmit();
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sp.waitForAngular();

  // Handle profile selection page
  await page.waitForURL('**/auth/user-profiles', { timeout: 15000 }).catch(() => {});
  if (page.url().includes('user-profiles') || page.url().includes('profiles')) {
    await sp.waitForAngular();
    await page.waitForTimeout(3000);
    const profileSelectors = [
      'div.profile-pic.focus-color', '.profile-pic.focus-color',
      '.profile-pic', '[class*="profile-pic"]',
    ];
    for (const sel of profileSelectors) {
      try {
        await page.waitForSelector(sel, { state: 'visible', timeout: 8000 });
        await page.locator(sel).first().click();
        console.log(`✅ Profile clicked: "${sel}"`);
        break;
      } catch { /* try next */ }
    }
    await page.waitForURL('**/home', { timeout: 30000 }).catch(() => {});
    await sp.waitForAngular();
  }

  const loggedIn = await sp.isLoggedIn();
  if (!loggedIn) {
    console.log(`⚠️  Login failed | URL: ${page.url()}`);
    return false;
  }

  console.log(`✅ Logged in | URL: ${page.url()}`);
  const cp = new ContentPage(page);
  await cp.navigate('/');
  await cp.waitForPageLoad();
  return true;
}

module.exports = { loginAndGoHome };
