// pages/ContentPage.js
const BasePage = require('./BasePage');

class ContentPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // From DOM dump: content items link to /vs/ URLs
      contentCards: [
        'a[href*="/vs/"]',           // real content links on this site
        'a[href*="/live/"]',         // live channel links
        '.all-items a',              // items inside .row.all-items
        '.row.all-items a',
        '.subcategory-list a',
        '.content a[href*="/vs"]',
        '.dropdown-menu a[href*="/vs"]',
        '[class*="item"] a[href]',
        '[class*="thumb"] a',
        '[class*="poster"] a',
        '.content-card', '.movie-card', '.show-card',
        '.vod-item', '.program-item',
      ],
      searchIcons: [
        '.searchButton', '.search-icon1',
        '[class*="search"]', 'button[class*="search"]',
        'a[href*="search"]', '.search-box-xs',
      ],
      searchInputs: [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[name="q"]', '#search-input',
        '[class*="search-input"]', '[class*="search"] input',
      ],
      // Watch Now / Play button on detail page
      playButtons: [
        'button:has-text("Watch Now")',
        'a:has-text("Watch Now")',
        'button:has-text("Play")',
        'a:has-text("Play")',
        'button:has-text("Watch")',
        '[class*="watch-now"]',
        '[class*="play-btn"]',
        '[class*="play-button"]',
        '[class*="btn-play"]',
        '[class*="watchnow"]',
        'button[class*="watch"]',
        'a[class*="watch"]',
      ],
      videoPlayers: [
        'video',
        '.video-player', '#video-player',
        '.player-container', '.vjs-tech',
        '.jwplayer', 'iframe[src*="player"]',
        '[class*="player"]',
      ],
      playerControls: [
        '.vjs-control-bar', '.player-controls',
        '.control-bar', '[class*="control-bar"]',
        '[class*="player-control"]',
      ],
      pauseButtons: [
        '.vjs-pause-control', 'button[title*="Pause"]',
        'button[aria-label*="pause" i]', '.pause-button',
        '[class*="pause"]',
      ],
      progressBars: [
        '.vjs-progress-control', '.vjs-slider',
        'input[type="range"]', '.seek-bar',
        '[class*="progress"]',
      ],
      volumeControls: [
        '.vjs-volume-control', '.vjs-mute-control',
        'button[aria-label*="volume" i]', 'button[aria-label*="mute" i]',
      ],
      // Continue Watching
      continueWatchingRows: [
        'section:has-text("Continue Watching")',
        '[class*="continue-watching"]',
        '[class*="resume"]',
        'h2:has-text("Continue Watching")',
        'h3:has-text("Continue Watching")',
        '*:has-text("Continue Watching")',
      ],
      // Back button in player
      backButtons: [
        'button[aria-label*="back" i]',
        'a[aria-label*="back" i]',
        '[class*="back-btn"]',
        '[class*="back-button"]',
        'button:has-text("Back")',
        '.vjs-back-button',
      ],
    };
  }

  async navigate(path = '/') {
    const BASE = 'https://www.tvbanywhereplusna.com';
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.waitForAngular();
  }

  async browseHomePage() {
    const el = await this.findElement(this.selectors.contentCards);
    return !!el;
  }

  async openSearch() {
    const icon = await this.findElement(this.selectors.searchIcons);
    if (icon) {
      await icon.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async searchContent(query) {
    const input = await this.findElement(this.selectors.searchInputs);
    if (!input) throw new Error('Search input not found');
    await input.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async getSearchResults() {
    const results = [];
    for (const sel of this.selectors.contentCards) {
      const items = await this.page.locator(sel).all();
      if (items.length > 0) return items;
    }
    return results;
  }

  async clickFirstContentItem() {
    await this.waitForPageLoad();
    // Try to find and click first content card
    for (const sel of this.selectors.contentCards) {
      try {
        const count = await this.page.locator(sel).count();
        if (count > 0) {
          await this.page.locator(sel).first().click();
          await this.waitForPageLoad();
          return;
        }
      } catch { /* continue */ }
    }
    throw new Error('No content cards found on page');
  }

  async clickPlayButton() {
    const btn = await this.findElement(this.selectors.playButtons);
    if (!btn) throw new Error('Play/Watch Now button not found on detail page');
    await btn.click();
    await this.page.waitForTimeout(2000);
  }

  async isVideoPlayerVisible() {
    return !!(await this.findElement(this.selectors.videoPlayers));
  }

  async isVideoPlaying() {
    try {
      return await this.page.evaluate(() => {
        const v = document.querySelector('video');
        return v && !v.paused && !v.ended && v.currentTime > 0;
      });
    } catch { return false; }
  }

  async waitForVideoToStart(timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await this.isVideoPlaying()) return true;
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  async pauseVideo() {
    const btn = await this.findElement(this.selectors.pauseButtons);
    if (btn) { await btn.click(); return; }
    const video = await this.findElement(['video', '.player-container']);
    if (video) await video.click();
  }

  async getVideoCurrentTime() {
    return this.page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.currentTime : 0;
    });
  }

  async isPlayerControlsVisible() {
    return !!(await this.findElement(this.selectors.playerControls));
  }

  async isProgressBarVisible() {
    return !!(await this.findElement(this.selectors.progressBars));
  }

  async isVolumeControlVisible() {
    return !!(await this.findElement(this.selectors.volumeControls));
  }

  async goBack() {
    await this.page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await this.waitForAngular();
  }
}

module.exports = ContentPage;
