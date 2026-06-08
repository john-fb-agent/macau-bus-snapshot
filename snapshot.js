#!/usr/bin/env node
// snapshot.js — get a live snapshot of any Macau bus route from DSAT
//
// Usage:
//   NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
//     node snapshot.js 52 MT2 3
//
// What it does:
//   1. Launches headless Chrome (Playwright)
//   2. Opens the DSAT bus page (which loads the real app in an iframe)
//   3. For each route you pass, clicks the route icon and reads the live data
//   4. Prints a human-readable summary + saves a screenshot per route
//
// Notes:
//   - The DSAT bus app is a JS SPA. The home page is just an iframe wrapper.
//   - Direct API access is blocked by a per-request HMAC token, so we drive a
//     real browser instead. ~6s per route, fine for one-shot polling.
//   - The `BypassToken: HuatuTesting0307` in the prod bundle is a hardcoded dev
//     secret — interesting trivia, not exploitable for clean data (the dynamic
//     `token` header is still required).
//
// Tested on: Node v22, Playwright 1.60, Chrome stable.

const { chromium } = require('playwright');

const URL_HOME = 'https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc';

// Routes to look up. Pass via CLI args or hardcode here.
const ROUTES = process.argv.slice(2);
if (ROUTES.length === 0) {
  console.log('No routes given, defaulting to 52 and MT2');
  ROUTES.push('52', 'MT2');
}

const CHROME = '/usr/bin/google-chrome';
const VIEWPORT = { width: 414, height: 900 };  // mobile size to match the official app

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
    ],
  });

  const ctx = await browser.newContext({
    ...VIEWPORT,
    ignoreHTTPSErrors: true,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // Capture the API calls we care about.
  const captured = new Map();  // url -> body
  page.on('response', async (resp) => {
    const u = resp.url();
    if (u.includes('routestation/bus') || u.includes('getRouteData.html')) {
      try {
        captured.set(u, await resp.text());
      } catch {}
    }
  });

  // Open the home page once.
  await page.goto(URL_HOME, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const mainFrame = () =>
    page.frames().find(
      (f) => f.url().includes('bis.dsat.gov.mo') && f.url().includes('macauweb') && !f.url().includes('headerSwiper')
    );

  for (const routeName of ROUTES) {
    console.log(`\n========= ROUTE ${routeName} =========`);

    // If we're not on the home route, re-load the home page.
    if (routeName !== ROUTES[0]) {
      await page.goto(URL_HOME, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
    }

    const mf = mainFrame();
    if (!mf) {
      console.log('  (no iframe found, skipping)');
      continue;
    }

    // Click the route number. The label is a leaf text node, so we click its
    // parent (which is the actual clickable icon).
    const clicked = await mf.evaluate((name) => {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.children.length === 0 && el.textContent.trim() === name) {
          let p = el.parentElement;
          for (let i = 0; i < 6 && p; i++) {
            p.click();
            return 'clicked via parent (depth ' + i + ')';
          }
          el.click();
          return 'clicked element directly';
        }
      }
      return 'NOT FOUND in DOM';
    }, routeName);
    console.log('  click:', clicked);

    await page.waitForTimeout(5000);
    await page.screenshot({
      path: `route-${routeName.replace(/\//g, '-')}.png`,
      fullPage: true,
    });

    // Print the visible page text.
    const text = await mf.evaluate(() => document.body.innerText);
    console.log('  --- page text ---');
    console.log(text.split('\n').map((l) => '  ' + l).join('\n'));
  }

  // Dump the raw API responses (useful for further processing).
  console.log('\n========= API RESPONSES =========');
  for (const [u, body] of captured) {
    console.log('  ', u);
    console.log('   ', body.substring(0, 400));
  }

  await browser.close();
})();
