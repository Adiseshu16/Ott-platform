// pages/BasePage.js
const BASE_URL = 'https://www.tvbanywhereplusna.com';

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(path = '/') {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.waitForAngular();
  }

  async waitForAngular() {
    await this.page.waitForFunction(() => {
      const root = document.querySelector('app-root');
      return root && root.innerHTML.length > 500;
    }, { timeout: 20000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  async waitForPageLoad() {
    await this.waitForAngular();
  }

  async getTitle() {
    return this.page.title();
  }

  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  // Safe find — checks page is still open before each attempt
  async findElement(selectors = [], timeout = 8000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (this.page.isClosed()) return null;
      for (const sel of selectors) {
        try {
          const el = this.page.locator(sel).first();
          if (await el.isVisible({ timeout: 800 })) return el;
        } catch { /* continue */ }
      }
      if (this.page.isClosed()) return null;
      await this.page.waitForTimeout(400).catch(() => {});
    }
    return null;
  }

  async scrollDown(pixels = 500) {
    await this.page.mouse.wheel(0, pixels);
    await this.page.waitForTimeout(800);
  }

  async isElementVisible(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch { return false; }
  }
}

module.exports = BasePage;
