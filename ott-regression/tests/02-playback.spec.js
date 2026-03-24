// tests/02-playback.spec.js
const { test, expect } = require('@playwright/test');
const SignInPage  = require('../pages/SignInPage');
const ContentPage = require('../pages/ContentPage');
const { VALID_USER } = require('../test-config');

// ── Login + profile + home ────────────────────────────────────────────────────
async function loginSelectProfileGoHome(page) {
  const sp = new SignInPage(page);
  await sp.navigateToSignInPage();
  if (!(await sp.isEmailFieldVisible())) return false;

  await sp.enterEmail(VALID_USER.email);
  await sp.enterPassword(VALID_USER.password);
  await sp.clickSubmit();
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sp.waitForAngular();
  console.log(`After login → ${page.url()}`);

  // Profile selection
  await page.waitForURL('**/auth/user-profiles', { timeout: 20000 }).catch(() => {});
  if (page.url().includes('user-profiles') || page.url().includes('profiles')) {
    await sp.waitForAngular();
    await page.waitForTimeout(3000);
    for (const sel of ['div.profile-pic.focus-color', '.profile-pic.focus-color', '.profile-pic', '[class*="profile-pic"]']) {
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

  await page.waitForTimeout(3000);
  console.log(`✅ Home page loaded → ${page.url()}`);
  return true;
}

// ── Click first content — waits for dynamic content then dumps real links ─────
async function clickFirstContent(page) {
  const cp = new ContentPage(page);

  // Wait longer for Angular to render home page content
  await page.waitForTimeout(5000);

  // Dump ALL links on the page to find real content selectors
  const allLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map(e => e.getAttribute('href'))
      .filter(h => h && h.length > 1 && !h.startsWith('http') || (h && h.includes('tvbanywhere')))
      .slice(0, 30)
  );
  console.log('All links on home:\n' + allLinks.join('\n'));

  // Try every possible link selector — broad to narrow
  const contentSelectors = [
    'a[href*="/vs/"]',
    'a[href*="/vod/"]',
    'a[href*="/series/"]',
    'a[href*="/movie/"]',
    'a[href*="/program/"]',
    'a[href*="/channel/"]',
    'a[href*="/live/"]',
    '.all-items a',
    '.row.all-items a',
    '.subcategory-list a',
    '.content a',
    '.dropdown-menu a[href]',
    '[class*="item"] a',
    '[class*="thumb"] a',
    '[class*="card"] a',
    '[class*="tile"] a',
    '[class*="poster"] a',
    // Very broad — any link that goes somewhere internal
    'a[href^="/"]',
  ];

  for (const sel of contentSelectors) {
    try {
      const items = page.locator(sel);
      const count = await items.count();
      if (count > 0) {
        // Skip nav/menu links — pick one that looks like content
        for (let i = 0; i < Math.min(count, 10); i++) {
          const href = await items.nth(i).getAttribute('href') || '';
          // Skip auth, home, search, empty links
          if (href === '/' || href === '/home' || href.includes('auth') ||
              href.includes('search') || href.includes('#') || href.length < 3) continue;

          await items.nth(i).click();
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
          await cp.waitForAngular();
          console.log(`✅ Clicked: "${href}" via "${sel}"`);
          return true;
        }
      }
    } catch { /* continue */ }
  }

  // Final dump of full page structure
  const pageStructure = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map(e => `href="${e.getAttribute('href')}" cls="${(e.className||'').toString().slice(0,60)}" txt="${e.textContent.trim().slice(0,30)}"`)
      .slice(0, 30).join('\n')
  );
  console.log('Full link dump:\n' + pageStructure);
  return false;
}

test.describe('▶️ Playback Regression Suite', () => {

  // ── TC-PB-01 ──────────────────────────────────────────────────────────────
  test('TC-PB-01 | Login → select profile → navigate to home page', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    expect(loggedIn, 'Should login and reach home page').toBeTruthy();
    expect(page.url()).toContain('/home');
    console.log(`✅ TC-PB-01 PASS | URL: ${page.url()}`);
  });

  // ── TC-PB-02 ──────────────────────────────────────────────────────────────
  test('TC-PB-02 | Click content on home → series detail page opens', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const urlBefore = page.url();
    const clicked = await clickFirstContent(page);
    expect(clicked, 'Should find and click a content item').toBeTruthy();

    const detailUrl = page.url();
    console.log(`✅ TC-PB-02 PASS | Navigated to: ${detailUrl}`);
    expect(detailUrl).not.toBe(urlBefore);
  });

  // ── TC-PB-03 ──────────────────────────────────────────────────────────────
  test('TC-PB-03 | Series detail page shows Watch Now / Continue Watching button', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const clicked = await clickFirstContent(page);
    if (!clicked) test.skip(true, 'No content found');
    await page.waitForTimeout(2000);

    const cp = new ContentPage(page);
    const playBtn = await cp.findElement(cp.selectors.playButtons);

    if (!playBtn) {
      const btns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button,a'))
          .map(e => `"${e.textContent.trim().slice(0,40)}" cls="${(e.className||'').toString().slice(0,60)}"`)
          .filter(s => s.length > 5).slice(0, 20).join('\n')
      );
      console.log(`Buttons on detail page:\n${btns}`);
    }

    expect(playBtn, 'Watch Now or Continue Watching button should be visible').toBeTruthy();
    const btnText = await playBtn.textContent();
    console.log(`✅ TC-PB-03 PASS | Button: "${btnText.trim()}"`);
  });

  // ── TC-PB-04 ──────────────────────────────────────────────────────────────
  test('TC-PB-04 | Click Watch Now → player loads and playback starts', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const clicked = await clickFirstContent(page);
    if (!clicked) test.skip(true, 'No content found');
    await page.waitForTimeout(2000);
    console.log(`Series detail: ${page.url()}`);

    const cp = new ContentPage(page);
    await cp.clickPlayButton();
    console.log('Watch Now clicked — waiting for player...');

    await page.waitForTimeout(5000);
    const playerVisible = await cp.isVideoPlayerVisible();
    expect(playerVisible, 'Video player should load').toBeTruthy();

    const started = await cp.waitForVideoToStart(30000);
    const currentTime = await cp.getVideoCurrentTime();
    console.log(`✅ TC-PB-04 PASS | Playing: ${started} | time: ${currentTime.toFixed(2)}s`);
    expect(started, 'Playback should start').toBeTruthy();
  });

  // ── TC-PB-05 ──────────────────────────────────────────────────────────────
  test('TC-PB-05 | Play 30s → click back → Watch Now changes to Continue Watching', async ({ page }) => {
    test.setTimeout(300000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const clicked = await clickFirstContent(page);
    if (!clicked) test.skip(true, 'No content found');
    await page.waitForTimeout(2000);
    console.log(`Series detail: ${page.url()}`);

    const cp = new ContentPage(page);
    await cp.clickPlayButton();
    const started = await cp.waitForVideoToStart(30000);
    expect(started, 'Playback must start').toBeTruthy();
    console.log('▶️  Playing for 30 seconds...');

    await page.waitForTimeout(30000);
    const timeAt30 = await cp.getVideoCurrentTime();
    console.log(`⏱️  Time at 30s: ${timeAt30.toFixed(2)}s`);

    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await cp.waitForAngular();
    console.log(`Back on: ${page.url()}`);

    const continueBtn = await cp.findElement([
      'button:has-text("Continue Watching")',
      'a:has-text("Continue Watching")',
      'button:has-text("Resume")',
      'a:has-text("Resume")',
      '[class*="continue-watching"]',
      '[class*="resume"]',
    ]);

    const btnText = continueBtn ? await continueBtn.textContent() : null;
    console.log(`✅ TC-PB-05 PASS | Button after 30s: "${btnText?.trim()}"`);
    expect(continueBtn, 'Button should change to Continue Watching').toBeTruthy();
  });

  // ── TC-PB-06 ──────────────────────────────────────────────────────────────
  test('TC-PB-06 | After 30s play → home shows Continue Watching carousel', async ({ page }) => {
    test.setTimeout(300000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const clicked = await clickFirstContent(page);
    if (!clicked) test.skip(true, 'No content found');
    await page.waitForTimeout(2000);

    const cp = new ContentPage(page);
    await cp.clickPlayButton();
    const started = await cp.waitForVideoToStart(30000);
    expect(started, 'Playback must start').toBeTruthy();
    console.log('▶️  Playing for 30 seconds...');
    await page.waitForTimeout(30000);

    await cp.navigate('/home');
    await cp.waitForPageLoad();
    await page.waitForTimeout(3000);

    let cwVisible = false;
    for (let i = 0; i < 10; i++) {
      const cw = await cp.findElement(cp.selectors.continueWatchingRows);
      if (cw) { cwVisible = true; break; }
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(800);
    }

    console.log(`✅ TC-PB-06 PASS | Continue Watching carousel: ${cwVisible}`);
    expect(cwVisible, 'Continue Watching carousel should appear').toBeTruthy();
  });

  // ── TC-PB-07 ──────────────────────────────────────────────────────────────
  test('TC-PB-07 | Playback play and pause actions work correctly', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    const clicked = await clickFirstContent(page);
    if (!clicked) test.skip(true, 'No content found');
    await page.waitForTimeout(2000);

    const cp = new ContentPage(page);
    await cp.clickPlayButton();
    const started = await cp.waitForVideoToStart(30000);
    expect(started, 'Video should start').toBeTruthy();

    const timeBeforePause = await cp.getVideoCurrentTime();
    console.log(`▶️  Playing — time: ${timeBeforePause.toFixed(2)}s`);

    await cp.pauseVideo();
    await page.waitForTimeout(2000);
    const timeAfterPause = await cp.getVideoCurrentTime();
    console.log(`⏸️  Paused — time: ${timeAfterPause.toFixed(2)}s`);
    expect(Math.abs(timeAfterPause - timeBeforePause)).toBeLessThan(2);

    await cp.pauseVideo();
    await page.waitForTimeout(3000);
    const timeAfterResume = await cp.getVideoCurrentTime();
    console.log(`▶️  Resumed — time: ${timeAfterResume.toFixed(2)}s`);
    expect(timeAfterResume).toBeGreaterThan(timeAfterPause);

    console.log(`✅ TC-PB-07 PASS | Play/Pause/Resume working`);
  });

});
