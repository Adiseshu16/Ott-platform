// pages/WishlistPage.js
const BasePage = require('./BasePage');

class WishlistPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      addToWishlistButtons: [
        'button[aria-label*="wishlist" i]',
        'button[aria-label*="watchlist" i]',
        'button[aria-label*="favourite" i]',
        'button[aria-label*="favorite" i]',
        'button:has-text("Add to Wishlist")',
        'button:has-text("Add to Watchlist")',
        'button:has-text("+ Wishlist")',
        'button:has-text("Watchlist")',
        '.wishlist-btn',
        '.watchlist-btn',
        '.add-to-list',
        '[data-testid="wishlist-btn"]',
        '[data-testid="watchlist-btn"]',
        '.bookmark-btn',
        'button[aria-label*="bookmark" i]',
        'button[aria-label*="save" i]',
        'button:has-text("Save")',
        '.heart-btn',
        'button[aria-label*="heart" i]',
      ],
      removeFromWishlistButtons: [
        'button[aria-label*="remove" i]',
        'button:has-text("Remove from Wishlist")',
        'button:has-text("Remove from Watchlist")',
        '.remove-from-list',
        '[data-testid="remove-wishlist"]',
      ],
      wishlistNavLinks: [
        'a[href*="wishlist"]',
        'a[href*="watchlist"]',
        'a[href*="favorites"]',
        'a[href*="my-list"]',
        'a[href*="saved"]',
        'a:has-text("Wishlist")',
        'a:has-text("Watchlist")',
        'a:has-text("My List")',
        '[data-testid="wishlist-nav"]',
      ],
      wishlistItems: [
        '.wishlist-item',
        '.watchlist-item',
        '.saved-item',
        '[data-testid="wishlist-item"]',
        '.my-list-item',
        '.content-card',
        '.movie-card',
      ],
      emptyWishlistMessages: [
        '.empty-wishlist',
        '.empty-list',
        '[data-testid="empty-wishlist"]',
        'p:has-text("No items")',
        'p:has-text("Your list is empty")',
        'p:has-text("Nothing in your watchlist")',
      ],
      successToasts: [
        '.toast',
        '.snackbar',
        '.notification',
        '[role="alert"]',
        '.success-message',
        '[data-testid="toast"]',
      ],
    };
  }

  // ── Wishlist button on content detail page ────────────────────────────────

  async isAddToWishlistButtonVisible() {
    const el = await this.findElement(this.selectors.addToWishlistButtons);
    return !!el;
  }

  async addToWishlist() {
    const btn = await this.findElement(this.selectors.addToWishlistButtons);
    if (!btn) throw new Error('Add to Wishlist button not found');

    const textBefore = await btn.textContent().catch(() => '');
    const ariaBefore = await btn.getAttribute('aria-label').catch(() => '');

    await btn.click();
    await this.page.waitForTimeout(1500);

    const textAfter = await btn.textContent().catch(() => '');
    const ariaAfter = await btn.getAttribute('aria-label').catch(() => '');

    // Detect if button changed state (text or aria-label change = added)
    const changed = textBefore !== textAfter || ariaBefore !== ariaAfter;
    return changed;
  }

  async isItemAddedToWishlist() {
    // Look for a visual indicator that the item was added
    const btn = await this.findElement(this.selectors.addToWishlistButtons);
    if (!btn) return false;

    const text = (await btn.textContent().catch(() => '')).toLowerCase();
    const aria = (await btn.getAttribute('aria-label').catch(() => '')).toLowerCase();
    const cls = (await btn.getAttribute('class').catch(() => '')).toLowerCase();

    return (
      text.includes('added') ||
      text.includes('remove') ||
      text.includes('saved') ||
      aria.includes('added') ||
      aria.includes('remove') ||
      cls.includes('active') ||
      cls.includes('added') ||
      cls.includes('selected')
    );
  }

  async getWishlistSuccessToast() {
    const el = await this.findElement(this.selectors.successToasts);
    if (!el) return null;
    return el.textContent();
  }

  // ── Wishlist page ─────────────────────────────────────────────────────────

  async navigateToWishlistPage() {
    // Try nav link first
    const navLink = await this.findElement(this.selectors.wishlistNavLinks);
    if (navLink) {
      await navLink.click();
      await this.waitForPageLoad();
      return;
    }
    // Fallback to direct URL guesses
    for (const path of ['/wishlist', '/watchlist', '/my-list', '/favorites', '/saved']) {
      await this.navigate(path);
      await this.page.waitForTimeout(1000);
      const items = await this.findElement(this.selectors.wishlistItems);
      if (items) return;
    }
  }

  async getWishlistItemCount() {
    for (const sel of this.selectors.wishlistItems) {
      const count = await this.page.locator(sel).count();
      if (count > 0) return count;
    }
    return 0;
  }

  async isWishlistEmpty() {
    const el = await this.findElement(this.selectors.emptyWishlistMessages);
    return !!el;
  }

  async isContentInWishlist(title) {
    const items = await this.page.locator(this.selectors.wishlistItems.join(', ')).all();
    for (const item of items) {
      const text = await item.textContent().catch(() => '');
      if (text.toLowerCase().includes(title.toLowerCase())) return true;
    }
    return false;
  }
}

module.exports = WishlistPage;
