// pages/ContinueWatchingPage.js
const BasePage = require('./BasePage');

class ContinueWatchingPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      continueWatchingRows: [
        '.continue-watching',
        '[data-testid="continue-watching"]',
        'section:has-text("Continue Watching")',
        'div:has-text("Continue Watching")',
        '.resume-watching',
        '[data-section="continue-watching"]',
        'h2:has-text("Continue Watching")',
        'h3:has-text("Continue Watching")',
        '.keep-watching',
      ],
      continueWatchingItems: [
        '.continue-watching .content-card',
        '.continue-watching .movie-card',
        '.continue-watching .item',
        '[data-testid="continue-watching-item"]',
        '.resume-item',
        '.watched-item',
        '.continue-watching-item',
      ],
      progressBadges: [
        '.progress-badge',
        '.watched-progress',
        '.resume-progress',
        '[data-testid="progress"]',
        '.progress-bar',
        '.watch-progress',
      ],
      continueWatchingNavLinks: [
        'a[href*="continue-watching"]',
        'a[href*="resume"]',
        'a:has-text("Continue Watching")',
        '[data-testid="continue-watching-nav"]',
      ],
    };
  }

  // ── After playback — check continue watching section ─────────────────────

  async isContinueWatchingRowVisible() {
    await this.waitForPageLoad();
    const el = await this.findElement(this.selectors.continueWatchingRows);
    return !!el;
  }

  async getContinueWatchingItemCount() {
    for (const sel of this.selectors.continueWatchingItems) {
      const count = await this.page.locator(sel).count();
      if (count > 0) return count;
    }
    return 0;
  }

  async scrollToAndVerifyContinueWatching() {
    // Scroll homepage to find Continue Watching row
    for (let i = 0; i < 6; i++) {
      const visible = await this.isContinueWatchingRowVisible();
      if (visible) return true;
      await this.scrollDown(400);
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  async isContentInContinueWatching(title) {
    const row = await this.findElement(this.selectors.continueWatchingRows);
    if (!row) return false;

    // Search within the row for the title
    const items = await this.page
      .locator(this.selectors.continueWatchingItems.join(', '))
      .all();
    for (const item of items) {
      const text = await item.textContent().catch(() => '');
      if (text.toLowerCase().includes(title.toLowerCase())) return true;
    }
    return false;
  }

  async hasProgressIndicator() {
    return this.findElement(this.selectors.progressBadges).then((el) => !!el);
  }

  // ── Navigate to continue watching page (if it exists) ────────────────────

  async navigateToContinueWatchingPage() {
    const link = await this.findElement(this.selectors.continueWatchingNavLinks);
    if (link) {
      await link.click();
      await this.waitForPageLoad();
      return true;
    }
    return false;
  }
}

module.exports = ContinueWatchingPage;
