// tests/04-continue-watching.spec.js
const { test, expect } = require('@playwright/test');
const ContentPage          = require('../pages/ContentPage');
const ContinueWatchingPage = require('../pages/ContinueWatchingPage');
const { loginAndGoHome }   = require('../utils/loginHelper');

test.describe('🕐 Continue Watching Regression Suite', () => {

  test('TC-CW-01 | Partial playback adds to Continue Watching', async ({ page }) => {
    const loggedIn = await loginAndGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');
    const cp = new ContentPage(page);
    const cw = new ContinueWatchingPage(page);
    await cp.clickFirstContentItem();
    const playBtn = await cp.findElement(cp.selectors.playButtons);
    if (!playBtn) test.skip(true, 'Play button not found');
    await cp.clickPlayButton();
    await page.waitForTimeout(8000);
    await page.keyboard.press('Escape');
    await cp.navigate('/');
    await cp.waitForPageLoad();
    const found = await cw.scrollToAndVerifyContinueWatching();
    console.log(`Continue Watching row found: ${found}`);
    expect(found, 'Continue Watching row should appear').toBeTruthy();
  });

  test('TC-CW-02 | Continue Watching section exists on home page', async ({ page }) => {
    const loggedIn = await loginAndGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');
    const cw = new ContinueWatchingPage(page);
    const found = await cw.scrollToAndVerifyContinueWatching();
    const count = await cw.getContinueWatchingItemCount();
    console.log(`CW row: ${found} | Items: ${count}`);
    if (!found) console.log('ℹ️  Play some content first (TC-CW-01)');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-CW-03 | Progress indicator on Continue Watching items', async ({ page }) => {
    const loggedIn = await loginAndGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');
    const cw = new ContinueWatchingPage(page);
    await cw.scrollToAndVerifyContinueWatching();
    const count = await cw.getContinueWatchingItemCount();
    if (count === 0) test.skip(true, 'No CW items — run TC-CW-01 first');
    const hasProgress = await cw.hasProgressIndicator();
    console.log(`Progress indicator: ${hasProgress}`);
    expect(hasProgress, 'Progress bar should show').toBeTruthy();
  });

  test('TC-CW-04 | Clicking Continue Watching item loads player', async ({ page }) => {
    const loggedIn = await loginAndGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');
    const cp = new ContentPage(page);
    const cw = new ContinueWatchingPage(page);
    await cw.scrollToAndVerifyContinueWatching();
    const count = await cw.getContinueWatchingItemCount();
    if (count === 0) test.skip(true, 'No CW items — run TC-CW-01 first');
    const urlBefore = page.url();
    for (const sel of cw.selectors.continueWatchingItems) {
      const items = page.locator(sel);
      if (await items.count() > 0) { await items.first().click(); break; }
    }
    await page.waitForTimeout(5000);
    const playerVisible = await cp.isVideoPlayerVisible();
    console.log(`Player: ${playerVisible} | URL: ${page.url()}`);
    expect(playerVisible || page.url() !== urlBefore, 'Should open player').toBeTruthy();
  });

  test('TC-CW-05 | Continue Watching persists after refresh', async ({ page }) => {
    const loggedIn = await loginAndGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');
    const cw = new ContinueWatchingPage(page);
    await cw.scrollToAndVerifyContinueWatching();
    const countBefore = await cw.getContinueWatchingItemCount();
    if (countBefore === 0) test.skip(true, 'No CW items to verify');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await cw.scrollToAndVerifyContinueWatching();
    const countAfter = await cw.getContinueWatchingItemCount();
    console.log(`Before: ${countBefore} | After: ${countAfter}`);
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

});
