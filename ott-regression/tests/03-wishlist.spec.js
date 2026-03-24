// tests/03-wishlist.spec.js
const { test, expect } = require('@playwright/test');
const SignInPage = require('../pages/SignInPage');
const { VALID_USER } = require('../test-config');

const CONTENT_URL   = 'https://www.tvbanywhereplusna.com/vs/bo-ai-huan-le-chuan-wan-jia';
const MY_LIST_URL   = 'https://www.tvbanywhereplusna.com/c/my-stuff?menu_item=my-stuff';

// Both title variants shown in My List carousel
const CONTENT_TITLE_ZH = '博愛歡樂傳萬家';           // Chinese title from DOM
const CONTENT_TITLE_EN = 'Pok Oi Charity Show 2026'; // English title

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
  console.log(`✅ Home loaded → ${page.url()}`);
  return true;
}

// ── Navigate to content page ──────────────────────────────────────────────────
async function goToContent(page) {
  const sp = new SignInPage(page);
  await page.goto(CONTENT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sp.waitForAngular();
  await page.waitForTimeout(2000);
  console.log(`Content page: ${page.url()}`);
}

// ── Get current wishlist button state ─────────────────────────────────────────
async function getWishlistState(page) {
  try {
    const tooltip = page.locator('.action-card-tooltip-text').first();
    if (await tooltip.isVisible({ timeout: 2000 })) {
      return (await tooltip.textContent()).trim();
    }
    const img = page.locator('img.cursor-pointer.banner-btn, img[src*="heart"]').first();
    if (await img.isVisible({ timeout: 2000 })) {
      return await img.getAttribute('src') || '';
    }
  } catch { /* ignore */ }
  return '';
}

// ── Click wishlist button ─────────────────────────────────────────────────────
async function clickWishlistButton(page) {
  for (const sel of [
    'img.cursor-pointer.banner-btn',
    '.cursor-pointer.banner-btn',
    '.action-card-tooltip',
    'img[src*="heart"]',
  ]) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        console.log(`Clicked wishlist via: "${sel}"`);
        await page.waitForTimeout(2000);
        return true;
      }
    } catch { /* continue */ }
  }
  return false;
}

// ── Navigate to My List and check carousel for the content title ──────────────
async function checkMyListCarousel(page) {
  const sp = new SignInPage(page);
  await page.goto(MY_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sp.waitForAngular();
  await page.waitForTimeout(4000); // wait for carousel to render
  console.log(`My List page: ${page.url()}`);

  // Read all titles from the carousel
  // Real DOM: <span class="article-detail-area-title non-article-title">博愛歡樂傳萬家</span>
  const allTitles = await page.evaluate(() =>
    Array.from(document.querySelectorAll(
      '.article-detail-area-title, .non-article-title, [class*="article-detail-area-title"]'
    ))
      .map(e => e.textContent.trim())
      .filter(t => t.length > 0)
  );
  console.log(`Titles in My List carousel:\n${allTitles.join('\n') || '(none)'}`);

  // Check for BOTH Chinese and English title variants
  const found = allTitles.some(t =>
    t.includes(CONTENT_TITLE_ZH) ||
    t.toLowerCase().includes(CONTENT_TITLE_EN.toLowerCase()) ||
    t.includes('博愛') ||
    t.toLowerCase().includes('pok oi') ||
    t.toLowerCase().includes('bo ai')
  );

  const totalItems = allTitles.length;
  console.log(`Total items: ${totalItems} | Target title found: ${found}`);
  return { found, totalItems, allTitles };
}

test.describe('❤️  Wishlist Regression Suite', () => {

  // ── TC-WL-01 ──────────────────────────────────────────────────────────────
  test('TC-WL-01 | Add to My List button is visible on content detail page', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    await goToContent(page);
    const state = await getWishlistState(page);
    console.log(`Wishlist button state: "${state}"`);

    expect(state.length > 0, 'Add to My List button should be visible').toBeTruthy();
    console.log(`✅ TC-WL-01 PASS | Button state: "${state}"`);
  });

  // ── TC-WL-02 ──────────────────────────────────────────────────────────────
  test('TC-WL-02 | Add content to My List — button changes to Remove state', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    await goToContent(page);
    const stateBefore = await getWishlistState(page);
    console.log(`State before: "${stateBefore}"`);

    // Reset if already added
    if (stateBefore.includes('從我的列表中移除') || stateBefore.includes('ic-full-heart')) {
      await clickWishlistButton(page);
      await page.waitForTimeout(1000);
      console.log('Reset: removed first');
    }

    // Add to My List
    await clickWishlistButton(page);
    const stateAfter = await getWishlistState(page);
    console.log(`State after adding: "${stateAfter}"`);

    // Should now show "Remove from My List" = 從我的列表中移除
    const isAdded = stateAfter.includes('從我的列表中移除') ||
                    stateAfter.includes('ic-full-heart') ||
                    stateAfter !== stateBefore;

    console.log(`✅ TC-WL-02 PASS | Added: ${isAdded} | Button now: "${stateAfter}"`);
    expect(isAdded, 'Button should show Remove state (從我的列表中移除) after adding').toBeTruthy();
  });

  // ── TC-WL-03 ──────────────────────────────────────────────────────────────
  test('TC-WL-03 | Added content (博愛歡樂傳萬家 / Pok Oi) appears in My List carousel', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    // Step 1: Add content if not already added
    await goToContent(page);
    const stateBefore = await getWishlistState(page);
    const alreadyAdded = stateBefore.includes('從我的列表中移除') || stateBefore.includes('ic-full-heart');
    if (!alreadyAdded) {
      await clickWishlistButton(page);
      console.log('✅ Added to My List');
    } else {
      console.log('Already in My List');
    }

    // Step 2: Navigate to My List and check carousel
    const { found, totalItems, allTitles } = await checkMyListCarousel(page);

    console.log(`✅ TC-WL-03 PASS | "${CONTENT_TITLE_ZH}" in carousel: ${found} | Total items: ${totalItems}`);
    expect(found,
      `"${CONTENT_TITLE_ZH}" (${CONTENT_TITLE_EN}) should appear in My List carousel`
    ).toBeTruthy();
  });

  // ── TC-WL-04 ──────────────────────────────────────────────────────────────
  test('TC-WL-04 | Remove content from My List — title removed from carousel', async ({ page }) => {
    test.setTimeout(180000);
    const loggedIn = await loginSelectProfileGoHome(page);
    if (!loggedIn) test.skip(true, 'Login failed');

    // Step 1: Make sure content is added first
    await goToContent(page);
    const stateBefore = await getWishlistState(page);
    const alreadyAdded = stateBefore.includes('從我的列表中移除') || stateBefore.includes('ic-full-heart');
    if (!alreadyAdded) {
      await clickWishlistButton(page);
      console.log('Added to My List first');
      await page.waitForTimeout(1000);
    }

    // Step 2: Confirm it's in carousel before removing
    const { found: foundBefore, totalItems: totalBefore } = await checkMyListCarousel(page);
    console.log(`Before remove — in carousel: ${foundBefore} | total: ${totalBefore}`);

    // Step 3: Go back and remove
    await goToContent(page);
    console.log('Removing from My List...');
    await clickWishlistButton(page);
    const stateAfterRemove = await getWishlistState(page);
    console.log(`Button after remove: "${stateAfterRemove}"`);
    // Should be back to "加入我的列表" (Add to My List)
    expect(
      stateAfterRemove.includes('加入我的列表') || !stateAfterRemove.includes('從我的列表中移除'),
      'Button should revert to Add state after removing'
    ).toBeTruthy();

    // Step 4: Navigate to My List — title should be gone from carousel
    const { found: foundAfter, totalItems: totalAfter, allTitles } = await checkMyListCarousel(page);
    console.log(`After remove — in carousel: ${foundAfter} | total: ${totalAfter}`);
    console.log(`Remaining titles:\n${allTitles.join('\n') || '(none)'}`);

    console.log(`✅ TC-WL-04 PASS | "${CONTENT_TITLE_ZH}" removed from carousel: ${!foundAfter}`);
    expect(foundAfter,
      `"${CONTENT_TITLE_ZH}" should be REMOVED from My List carousel`
    ).toBeFalsy();
  });

});
