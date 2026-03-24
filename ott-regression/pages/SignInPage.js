// pages/SignInPage.js — v8 exact (no URL check in isLoggedIn)
const BasePage = require('./BasePage');

class SignInPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      signInLinks: [
        'a[routerlink*="login"]', 'a[routerlink*="signin"]',
        'a:has-text("Sign In")', 'a:has-text("Login")', 'a:has-text("Log In")',
        'button:has-text("Sign In")', 'button:has-text("Login")',
        'a[href*="login"]', 'a[href*="signin"]',
        '[class*="login"]', '[class*="signin"]',
        'mat-toolbar a', 'mat-toolbar button',
        'app-header a', 'app-header button',
        'header a', 'nav a', '.header a', '.navbar a',
      ],
      emailInputs: [
        'input[type="email"]', 'input[name="email"]', 'input[name="username"]',
        'input[formcontrolname="email"]', 'input[formcontrolname="username"]',
        'input[formcontrolname="EmailAddress"]',
        'input[placeholder*="email" i]', 'input[placeholder*="username" i]',
        'mat-form-field input[type="email"]', 'mat-form-field input[type="text"]',
        '#email', '#username', '#Email',
        '[autocomplete="email"]', '[autocomplete="username"]',
      ],
      passwordInputs: [
        'input[type="password"]', 'input[name="password"]',
        'input[formcontrolname="password"]',
        'input[placeholder*="password" i]',
        'mat-form-field input[type="password"]',
        '#password', '[autocomplete="current-password"]',
      ],
      submitButtons: [
        'button[type="submit"]', 'input[type="submit"]',
        'button:has-text("Sign In")', 'button:has-text("Login")',
        'button:has-text("Log In")', 'button:has-text("Submit")',
        '[class*="login-btn"]', '[class*="signin-btn"]',
        'form button',
        'mat-dialog-container button[type="submit"]',
        'mat-dialog-container button:has-text("Sign")',
      ],
      // EXACT from live DOM: <div class="profile-pic focus-color">
      profileItems: [
        'div.profile-pic.focus-color',
        '.profile-pic.focus-color',
        '.profile-pic',
        '[class*="profile-pic"]',
        '[class*="profile-item"]',
        '[class*="profile-card"]',
        '[class*="user-profile"]',
        'ul.profiles li', '[class*="profiles"] li',
      ],
      loggedInIndicators: [
        '.nav-profile',
        '.profile-pic-container',
        '.dropdown-toggle.cursor-pointer',
        '[class*="nav-profile"]',
        '[class*="profile-pic"]',
        'a:has-text("登出")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
        'a[href*="logout"]',
        'a[routerlink*="logout"]',
      ],
      logoutTriggers: [
        '.dropdown-toggle.cursor-pointer',
        '.nav-profile .dropdown-toggle',
        '[class*="nav-profile"] .dropdown-toggle',
        '.profile-pic-container',
        '[class*="profile-pic"]',
      ],
      logoutLinks: [
        'a:has-text("登出")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
        '.nav-profile-menu a:last-child',
        '[class*="nav-profile-menu"] a:last-child',
        'a[href*="logout"]', 'a[href*="signout"]',
        'a[routerlink*="logout"]', '[class*="logout"]',
      ],
    };
  }

  async goToHomePage() {
    await this.navigate('/');
  }

  async navigateToSignInPage() {
    await this.navigate('/');
    const signinLink = await this.findElement(this.selectors.signInLinks);
    if (signinLink) {
      await signinLink.click();
      await this.page.waitForTimeout(3000);
      await this.waitForAngular();
    }
    if (!(await this.findElement(this.selectors.emailInputs))) {
      for (const path of ['/login', '/signin', '/sign-in', '/account/login', '/auth/login']) {
        try {
          await this.page.goto(`https://www.tvbanywhereplusna.com${path}`, {
            waitUntil: 'domcontentloaded', timeout: 15000
          });
          await this.waitForAngular();
          if (await this.findElement(this.selectors.emailInputs)) break;
        } catch { /* try next */ }
      }
    }
  }

  async enterEmail(email) {
    const el = await this.findElement(this.selectors.emailInputs);
    if (!el) throw new Error('Email input not found');
    await el.click(); await el.clear(); await el.fill(email);
  }

  async enterPassword(password) {
    const el = await this.findElement(this.selectors.passwordInputs);
    if (!el) throw new Error('Password input not found');
    await el.click(); await el.clear(); await el.fill(password);
  }

  async clickSubmit() {
    const el = await this.findElement(this.selectors.submitButtons);
    if (!el) throw new Error('Submit button not found');
    await el.click();
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSubmit();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await this.waitForAngular();
    await this.selectProfileIfNeeded();
  }

  async selectProfileIfNeeded() {
    if (this.page.isClosed()) return;
    const url = this.page.url();
    if (!url.includes('user-profile') && !url.includes('profile-select') && !url.includes('profiles')) return;

    console.log(`Profile page → ${url}`);
    await this.page.waitForTimeout(3000);

    // Try CSS selectors with waitForSelector
    for (const sel of this.selectors.profileItems) {
      try {
        await this.page.waitForSelector(sel, { state: 'visible', timeout: 5000 });
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          console.log(`Clicking profile: "${sel}"`);
          await el.click();
          await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
          await this.waitForAngular();
          console.log(`After profile click → ${this.page.url()}`);
          return;
        }
      } catch { /* try next */ }
    }

    // JS fallback
    console.log('CSS failed — JS click...');
    const result = await this.page.evaluate(() => {
      const candidates = [
        'div.profile-pic.focus-color', 'div.profile-pic',
        '[class*="profile-pic"]', '[class*="profile-item"]',
      ];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return `clicked "${sel}"`; }
      }
      return 'not found: ' + Array.from(document.querySelectorAll('div,li'))
        .map(e => (e.className || '').toString())
        .filter(c => c.includes('profile') || c.includes('avatar'))
        .slice(0, 8).join(' | ');
    }).catch(() => 'error');
    console.log(`JS: ${result}`);
    await this.page.waitForTimeout(3000);
    await this.waitForAngular();
    console.log(`After JS → ${this.page.url()}`);
  }

  // v8 exact — no URL check (works because profile selection runs first)
  async isLoggedIn() {
    if (this.page.isClosed()) return false;
    for (const sel of this.selectors.loggedInIndicators) {
      try {
        if (await this.page.locator(sel).first().isVisible({ timeout: 2000 })) return true;
      } catch { /* continue */ }
    }
    return false;
  }

  async isEmailFieldVisible()   { return !!(await this.findElement(this.selectors.emailInputs)); }
  async isPasswordFieldVisible() { return !!(await this.findElement(this.selectors.passwordInputs)); }
  async isSubmitButtonVisible()  { return !!(await this.findElement(this.selectors.submitButtons)); }

  async logout() {
    if (this.page.isClosed()) return;
    for (const sel of this.selectors.logoutTriggers) {
      try {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          await this.page.waitForTimeout(1000);
          break;
        }
      } catch { /* continue */ }
    }
    for (const sel of this.selectors.logoutLinks) {
      try {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
          await this.waitForAngular();
          return;
        }
      } catch { /* continue */ }
    }
    console.log('⚠️ Logout link not found');
  }
}

module.exports = SignInPage;
