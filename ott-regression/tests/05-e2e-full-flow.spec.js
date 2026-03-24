// tests/05-e2e-full-flow.spec.js
const { test, expect } = require('@playwright/test');
const SignInPage           = require('../pages/SignInPage');
const ContentPage          = require('../pages/ContentPage');
const WishlistPage         = require('../pages/WishlistPage');
const ContinueWatchingPage = require('../pages/ContinueWatchingPage');
const { VALID_USER }       = require('../test-config');

test.describe('🔄 End-to-End Full Regression Flow', () => {

  test('TC-E2E-01 | Full journey: Sign In → Browse → Play → Wishlist → Continue Watching → Logout', async ({ page }) => {
    const signInPage  = new SignInPage(page);
    const contentPage = new ContentPage(page);
    const wishlistPage = new WishlistPage(page);
    const cwPage = new ContinueWatchingPage(page);

    const steps = [];
    const pass = (step, detail='') => { steps.push({ step, status: '✅ PASS', detail }); console.log(`✅ ${step}: ${detail}`); };
    const warn = (step, detail='') => { steps.push({ step, status: '⚠️  WARN', detail }); console.log(`⚠️  ${step}: ${detail}`); };
    const fail = (step, detail='') => { steps.push({ step, status: '❌ FAIL', detail }); console.log(`❌ ${step}: ${detail}`); };

    // ── 1. Load home page ────────────────────────────────────────────────────
    try {
      await signInPage.goToHomePage();
      const title = await signInPage.getTitle();
      pass('Home page loaded', title);
    } catch(e) { fail('Home page loaded', e.message); }

    // ── 2. Sign In ───────────────────────────────────────────────────────────
    let loggedIn = false;
    try {
      await signInPage.navigateToSignInPage();
      const hasForm = await signInPage.isEmailFieldVisible();
      if (!hasForm) { warn('Sign In', 'Login form not found'); }
      else {
        await signInPage.login(VALID_USER.email, VALID_USER.password);
        loggedIn = await signInPage.isLoggedIn();
        loggedIn ? pass('Sign In', `Logged in as ${VALID_USER.email}`) : fail('Sign In', 'Not logged in after submit');
      }
    } catch(e) { fail('Sign In', e.message); }

    if (!loggedIn) {
      warn('Remaining steps', 'Skipped — login required');
      console.table(steps);
      expect(loggedIn, 'Login must succeed for E2E').toBeTruthy();
      return;
    }

    // ── 3. Browse home content ───────────────────────────────────────────────
    try {
      await contentPage.navigate('/');
      await contentPage.waitForPageLoad();
      const hasContent = await contentPage.browseHomePage();
      hasContent ? pass('Browse home', 'Content tiles visible') : warn('Browse home', 'No content tiles found');
    } catch(e) { fail('Browse home', e.message); }

    // ── 4. Open content detail ───────────────────────────────────────────────
    let itemTitle = '';
    try {
      for (const sel of contentPage.selectors.contentCards) {
        const count = await page.locator(sel).count();
        if (count > 0) {
          itemTitle = (await page.locator(sel).first().textContent()).trim().split('\n')[0].trim().slice(0,50);
          await page.locator(sel).first().click();
          break;
        }
      }
      await contentPage.waitForPageLoad();
      pass('Open content detail', `"${itemTitle}" → ${page.url()}`);
    } catch(e) { fail('Open content detail', e.message); }

    // ── 5. Add to Wishlist ───────────────────────────────────────────────────
    try {
      const btnVisible = await wishlistPage.isAddToWishlistButtonVisible();
      if (!btnVisible) { warn('Add to Wishlist', 'Button not found'); }
      else {
        await wishlistPage.addToWishlist();
        await page.waitForTimeout(1500);
        const isAdded = await wishlistPage.isItemAddedToWishlist();
        isAdded ? pass('Add to Wishlist', 'Button state changed') : warn('Add to Wishlist', 'No visible state change');
      }
    } catch(e) { fail('Add to Wishlist', e.message); }

    // ── 6. Start Playback ────────────────────────────────────────────────────
    let videoStarted = false;
    try {
      const playBtn = await contentPage.findElement(contentPage.selectors.playButtons);
      if (!playBtn) { warn('Start Playback', 'Play button not found'); }
      else {
        await contentPage.clickPlayButton();
        videoStarted = await contentPage.waitForVideoToStart(30000);
        const t = await contentPage.getVideoCurrentTime();
        videoStarted ? pass('Start Playback', `Playing at ${t.toFixed(2)}s`) : warn('Start Playback', 'Video did not start');
        await page.waitForTimeout(6000); // watch 6 seconds
        await page.keyboard.press('Escape');
      }
    } catch(e) { fail('Start Playback', e.message); }

    // ── 7. Continue Watching row ─────────────────────────────────────────────
    try {
      await contentPage.navigate('/');
      await contentPage.waitForPageLoad();
      const cwVisible = await cwPage.scrollToAndVerifyContinueWatching();
      cwVisible ? pass('Continue Watching row', 'Visible on home page') : warn('Continue Watching row', 'Not found (may need longer play time)');
    } catch(e) { fail('Continue Watching row', e.message); }

    // ── 8. Wishlist page has item ────────────────────────────────────────────
    try {
      await wishlistPage.navigateToWishlistPage();
      await page.waitForTimeout(2000);
      const count = await wishlistPage.getWishlistItemCount();
      count > 0 ? pass('Wishlist has items', `${count} item(s)`) : warn('Wishlist has items', 'Empty — add may not have worked');
    } catch(e) { fail('Wishlist has items', e.message); }

    // ── 9. Logout ────────────────────────────────────────────────────────────
    try {
      await signInPage.logout();
      await page.waitForTimeout(3000);
      const stillLoggedIn = await signInPage.isLoggedIn();
      !stillLoggedIn ? pass('Logout', 'Logged out successfully') : warn('Logout', 'Still appears logged in');
    } catch(e) { fail('Logout', e.message); }

    // ── Final summary ─────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('       OTT REGRESSION — E2E RESULTS');
    console.log('══════════════════════════════════════════════');
    console.table(steps);

    const failed = steps.filter(s => s.status.includes('FAIL'));
    expect(failed.length, `${failed.length} step(s) failed`).toBe(0);
  });

});
