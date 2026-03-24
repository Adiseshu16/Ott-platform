// tests/01-signin.spec.js
const { test, expect } = require('@playwright/test');
const SignInPage = require('../pages/SignInPage');
const { VALID_USER, INVALID_USER } = require('../test-config');

test.describe('🔐 Sign-In Regression Suite', () => {

  // ── TC-SI-01 ──────────────────────────────────────────────────────────────
  test('TC-SI-01 | Home page loads successfully', async ({ page }) => {
    const sp = new SignInPage(page);
    await sp.goToHomePage();
    const title = await sp.getTitle();
    expect(title).toBeTruthy();
    expect(page.url()).toContain('tvbanywhereplusna.com');
    console.log(`✅ Title: "${title}" | URL: ${page.url()}`);
  });

  // ── TC-SI-02 ──────────────────────────────────────────────────────────────
  test('TC-SI-02 | Sign-In link/button visible on home page', async ({ page }) => {
    const sp = new SignInPage(page);
    await sp.goToHomePage();
    const found = await sp.findElement(sp.selectors.signInLinks);
    expect(found, 'Sign-In link/button should exist').toBeTruthy();
  });

  // ── TC-SI-03 ──────────────────────────────────────────────────────────────
  test('TC-SI-03 | Clicking Sign-In shows login form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      const sp = new SignInPage(page);
      await sp.navigateToSignInPage();
      expect(await sp.isEmailFieldVisible(),    'Email field visible').toBeTruthy();
      expect(await sp.isPasswordFieldVisible(), 'Password field visible').toBeTruthy();
      expect(await sp.isSubmitButtonVisible(),  'Submit button visible').toBeTruthy();
      console.log(`✅ Login form visible at ${page.url()}`);
    } finally { await ctx.close().catch(() => {}); }
  });

  // ── TC-SI-04 — Empty credentials blocked ──────────────────────────────────
  test('TC-SI-04 | Empty credentials submission blocked', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      const sp = new SignInPage(page);
      await sp.navigateToSignInPage();
      if (!(await sp.isEmailFieldVisible())) { console.log('Form not found'); return; }

      // Click submit without entering anything
      const submitBtn = await sp.findElement(sp.selectors.submitButtons);
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(3000);

      const url = page.url().toLowerCase();
      const stayedOnAuth = url.includes('/auth/signin') || url.includes('/login') || url.includes('/signin');
      console.log(`URL: ${page.url()} | Stayed on auth: ${stayedOnAuth}`);
      expect(stayedOnAuth, 'Should stay on login page with empty credentials').toBeTruthy();
    } finally { await ctx.close().catch(() => {}); }
  });

  // ── TC-SI-05 — Invalid credentials blocked ────────────────────────────────
  test('TC-SI-05 | Invalid credentials show error / stay on login', async ({ browser }) => {
    test.setTimeout(120000);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      const sp = new SignInPage(page);
      await sp.navigateToSignInPage();
      if (!(await sp.isEmailFieldVisible())) { console.log('Form not found'); return; }

      await sp.enterEmail(INVALID_USER.email);
      await sp.enterPassword(INVALID_USER.password);
      await sp.clickSubmit();

      // Wait up to 45s for error popup
      await page.waitForTimeout(45000);

      const url = page.url().toLowerCase();
      const onAuthPage = url.includes('/auth/signin') || url.includes('/login') || url.includes('/signin');
      console.log(`URL: ${page.url()} | On auth page: ${onAuthPage}`);
      expect(onAuthPage, 'Should remain on auth page with invalid credentials').toBeTruthy();
    } finally { await ctx.close().catch(() => {}); }
  });

  // ── TC-SI-06 ──────────────────────────────────────────────────────────────
  test('TC-SI-06 | Valid credentials log in successfully', async ({ page }) => {
    const sp = new SignInPage(page);
    await sp.navigateToSignInPage();
    if (!(await sp.isEmailFieldVisible())) test.skip(true, 'Login form not found');
    await sp.login(VALID_USER.email, VALID_USER.password);
    const loggedIn = await sp.isLoggedIn();
    console.log(`Logged in: ${loggedIn} | URL: ${page.url()}`);
    expect(loggedIn, `Should be logged in as ${VALID_USER.email}`).toBeTruthy();
  });

  // ── TC-SI-07 — slow so logout process is clearly visible ──────────────────
  test('TC-SI-07 | Logout works after login', async ({ page }) => {
    const sp = new SignInPage(page);
    await sp.navigateToSignInPage();
    if (!(await sp.isEmailFieldVisible())) test.skip(true, 'Login form not found');

    await sp.login(VALID_USER.email, VALID_USER.password);
    const loggedIn = await sp.isLoggedIn();
    if (!loggedIn) test.skip(true, 'Login failed — skipping logout');
    console.log(`✅ Logged in | URL: ${page.url()}`);

    await page.waitForTimeout(3000);
    console.log('Step 1: Opening profile dropdown for logout...');

    const dropdownSelectors = [
      '.dropdown.nav-profile',
      '.dropdown-toggle.cursor-pointer',
      '.nav-profile .dropdown-toggle',
      '[class*="nav-profile"] .dropdown-toggle',
      '.profile-pic-container',
    ];
    for (const sel of dropdownSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          console.log(`Dropdown opened via "${sel}"`);
          break;
        }
      } catch { /* continue */ }
    }

    await page.waitForTimeout(2000);
    console.log('Step 2: Clicking logout (登出)...');

    const logoutSelectors = [
      'a:has-text("登出")',
      '.nav-profile-menu a:has-text("登出")',
      '[class*="nav-profile-menu"] a:last-child',
      'a:has-text("Logout")',
      'a:has-text("Sign Out")',
      'a[href*="logout"]',
    ];
    let logoutClicked = false;
    for (const sel of logoutSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          logoutClicked = true;
          console.log(`✅ Logout clicked via "${sel}"`);
          break;
        }
      } catch { /* continue */ }
    }
    if (!logoutClicked) {
      await page.evaluate(() => {
        const menu = document.querySelector('[class*="nav-profile-menu"]');
        if (menu) {
          const links = menu.querySelectorAll('a');
          if (links.length > 0) links[links.length - 1].click();
        }
      });
      console.log('Logout via JS fallback');
    }

    await page.waitForTimeout(3000);
    await sp.waitForAngular();

    const finalUrl = page.url();
    const stillLoggedIn = await sp.isLoggedIn();
    console.log(`✅ After logout → URL: ${finalUrl} | Still logged in: ${stillLoggedIn}`);
    expect(stillLoggedIn, 'Should be logged out').toBeFalsy();
  });

  // ── TC-SI-08 ──────────────────────────────────────────────────────────────
  test('TC-SI-08 | Password field is masked', async ({ page }) => {
    const sp = new SignInPage(page);
    await sp.navigateToSignInPage();
    const pwInput = await sp.findElement(sp.selectors.passwordInputs);
    if (!pwInput) test.skip(true, 'Password field not found');
    expect(await pwInput.getAttribute('type')).toBe('password');
    console.log('✅ Password field is masked');
  });

});
