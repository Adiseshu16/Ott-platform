// tests/00-inspect.spec.js
// Run this FIRST to discover the real DOM selectors on this Angular app
// npx playwright test tests/00-inspect.spec.js --headed
const { test } = require('@playwright/test');

test('🔍 INSPECTOR | Dump all interactive elements after Angular loads', async ({ page }) => {
  // Navigate and wait for Angular to fully render
  await page.goto('https://www.tvbanywhereplusna.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Wait for Angular app-root to render content (up to 20s)
  await page.waitForFunction(() => {
    const root = document.querySelector('app-root');
    return root && root.innerHTML.length > 500;
  }, { timeout: 20000 }).catch(() => {});
  
  await page.waitForTimeout(3000); // extra buffer

  console.log('\n========== PAGE URL ==========');
  console.log(page.url());

  console.log('\n========== ALL BUTTONS ==========');
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(e => ({
      text: e.textContent.trim().slice(0, 60),
      cls: (e.className || '').toString().slice(0, 100),
      id: e.id,
      type: e.type
    }))
  );
  buttons.forEach(b => console.log(`BUTTON | text="${b.text}" | class="${b.cls}" | id="${b.id}"`));

  console.log('\n========== ALL LINKS ==========');
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(e => ({
      text: e.textContent.trim().slice(0, 60),
      href: e.getAttribute('href') || '',
      cls: (e.className || '').toString().slice(0, 100),
      id: e.id
    }))
  );
  links.forEach(l => console.log(`LINK | text="${l.text}" | href="${l.href}" | class="${l.cls}"`));

  console.log('\n========== INPUTS ==========');
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(e => ({
      type: e.type,
      name: e.name,
      id: e.id,
      placeholder: e.placeholder,
      cls: (e.className || '').toString().slice(0, 100)
    }))
  );
  inputs.forEach(i => console.log(`INPUT | type="${i.type}" | name="${i.name}" | id="${i.id}" | placeholder="${i.placeholder}" | class="${i.cls}"`));

  console.log('\n========== NAV / HEADER elements ==========');
  const nav = await page.evaluate(() =>
    Array.from(document.querySelectorAll('nav *, header *, [class*="nav"], [class*="header"], [class*="toolbar"]'))
      .map(e => ({
        tag: e.tagName,
        text: e.textContent.trim().slice(0, 50),
        cls: (e.className || '').toString().slice(0, 100),
        id: e.id
      }))
      .filter(e => e.text.length > 0)
      .slice(0, 40)
  );
  nav.forEach(n => console.log(`${n.tag} | text="${n.text}" | class="${n.cls}"`));

  console.log('\n========== app-root structure (first 3000 chars) ==========');
  const rootHtml = await page.evaluate(() => {
    const root = document.querySelector('app-root');
    return root ? root.innerHTML.slice(0, 3000) : 'NOT FOUND';
  });
  console.log(rootHtml);
});


test('🔍 INSPECTOR | Dump DOM after clicking first Sign-In link', async ({ page }) => {
  await page.goto('https://www.tvbanywhereplusna.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('app-root');
    return root && root.innerHTML.length > 500;
  }, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Try clicking anything that looks like sign-in
  const candidates = [
    'a:has-text("Sign In")', 'button:has-text("Sign In")',
    'a:has-text("Login")', 'button:has-text("Login")',
    'header a', 'nav a', 'mat-toolbar a',
  ];
  for (const sel of candidates) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        console.log(`Clicking: ${sel}`);
        await el.click();
        await page.waitForTimeout(3000);
        break;
      }
    } catch {}
  }

  console.log('URL after click:', page.url());

  // Dump all inputs and forms
  const forms = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, form, mat-dialog-container, [class*="modal"], [class*="dialog"]'))
      .map(e => ({
        tag: e.tagName,
        type: e.type || '',
        name: e.name || '',
        id: e.id || '',
        placeholder: e.placeholder || '',
        cls: (e.className || '').toString().slice(0, 120)
      }));
  });
  console.log('\n=== INPUTS/FORMS after click ===');
  forms.forEach(f => console.log(`${f.tag} | type=${f.type} | name=${f.name} | id=${f.id} | ph="${f.placeholder}" | cls="${f.cls}"`));

  // Full app-root after click
  const rootHtml = await page.evaluate(() => {
    const root = document.querySelector('app-root');
    return root ? root.innerHTML.slice(0, 4000) : 'NOT FOUND';
  });
  console.log('\n=== app-root after click (4000 chars) ===\n' + rootHtml);
});
