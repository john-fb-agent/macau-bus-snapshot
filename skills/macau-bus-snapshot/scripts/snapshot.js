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
//   4. Emits a single JSON object on stdout with parsed buses per route
//      and the raw API responses (routestation/bus + getRouteData.html).
//   5. Saves a screenshot per route to route-<NAME>.png.
//
// Notes:
//   - The DSAT bus app is a JS SPA. The home page is just an iframe wrapper.
//   - Direct API access is blocked by a per-request HMAC token, so we drive a
//     real browser instead.
//   - The `BypassToken: HuatuTesting0307` in the prod bundle is a hardcoded dev
//     secret — interesting trivia, not exploitable for clean data (the dynamic
//     `token` header is still required).
//
// v3 (2026-06-26): use page.waitForResponse on routestation/bus instead of a
//   fixed 2500ms wait. Cuts per-route latency to ~0.4-1s after the first
//   iframe load. Typical 2-route run: ~5-6s (was ~13s in v2).
//   Also added a --json-only flag for sub-second, no-screenshot runs.
//
// v2 (2026-06-23): WAIT_LOAD cut 5000→2500ms; parse route text internally
//   and emit JSON instead of dumping the full page text.
//
// Tested on: Node v22, Playwright 1.60, Chrome stable.

const { chromium } = require('playwright');

const URL_HOME = 'https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc';
const IFRAME_HOME = 'https://bis.dsat.gov.mo:37812/macauweb/';

const ARGS = process.argv.slice(2);
const ROUTES = ARGS.filter(a => !a.startsWith('--'));
const JSON_ONLY = ARGS.includes('--json-only');
if (ROUTES.length === 0) {
  ROUTES.push('52', 'MT2');
}

const CHROME = '/usr/bin/google-chrome';
const VIEWPORT = { width: 414, height: 900 };  // mobile size to match the official app
const GRACE_MS = 250;          // small grace for DOM render after API response
const API_TIMEOUT_MS = 8000;   // max wait for the bus API response
const IFRAME_TIMEOUT_MS = 15000;

// Match the routestation/bus response. Each route click triggers one (or
// more) of these. We treat the first one as "data is here".
// Note: getRouteAndCompanyList is what the home grid fetches, so we wait
// on that to know the SPA is ready.
const isBusApi = (url) =>
  url.includes('routestation/bus') || url.includes('getRouteData.html');
const isRouteList = (url) => url.includes('getRouteAndCompanyList.html');
const isReadyApi = (url) => isBusApi(url) || isRouteList(url);

// Parse the iframe body text into a structured bus list.
// Format: stops are "M20/6-青洲坊總站（C 車道）"; buses are plate "AA1234"
// on their own line, followed (after a blank) by "13 km/h" or "即將發車".
// A bus is "near" the last stop that appeared before its plate.
function parseRouteText(text) {
  const result = { detour: false, buses: [] };
  let lastStop = null;
  let currentBus = null;

  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (!l) continue;
    if (l.includes('改道消息')) { result.detour = true; continue; }
    if (l === '手動刷新' || l.includes('切換方向')) continue;
    if (/^\d+$/.test(l)) continue;  // pagination / route number noise

    // Stop line: "M20/6-青洲坊總站（C 車道）" or "T319-嘉模泳池"
    const sm = l.match(/^([MT]\d+(?:\/\d+)?(?:-\d+)?)\s*[-–—]\s*(.+?)\s*(?:[（(][^）)]+[）)])?\s*$/);
    if (sm) { lastStop = { code: sm[1], name: sm[2] }; continue; }

    // Bus plate
    if (/^AA\d+$/.test(l)) {
      if (currentBus) result.buses.push(currentBus);
      currentBus = { plate: l, speed: null, stop: lastStop, note: null };
      continue;
    }

    // Speed
    const spm = l.match(/^(\d+)\s*km\/h$/);
    if (spm && currentBus) { currentBus.speed = spm[1]; continue; }

    // About to depart
    if (l.includes('即將發車') && currentBus) {
      currentBus.speed = '0';
      currentBus.note = '即将发车';
    }
  }

  if (currentBus) result.buses.push(currentBus);
  return result;
}

// Click a route by its label inside the iframe. The label is a leaf text
// node; we click its ancestor (the actual clickable icon).
async function clickRoute(frame, name) {
  return await frame.evaluate((name) => {
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
  }, name);
}

const mainFrame = (page) =>
  page.frames().find(
    (f) => f.url().includes('bis.dsat.gov.mo') && f.url().includes('macauweb') && !f.url().includes('headerSwiper')
  );

(async () => {
  const t0 = Date.now();

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
  const apiLog = [];
  page.on('response', async (resp) => {
    const u = resp.url();
    if (isBusApi(u)) {
      try { apiLog.push({ url: u, body: await resp.text() }); } catch {}
    }
  });

  // Open the home page. The SPA + iframe are ready once the route list
  // (getRouteAndCompanyList) returns, not the bus API (only fires on click).
  await page.goto(URL_HOME, { timeout: IFRAME_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
  await page
    .waitForResponse((r) => r.url().includes('macauweb') && isRouteList(r.url()), {
      timeout: IFRAME_TIMEOUT_MS,
    })
    .catch(() => null);

  const results = [];

  for (let i = 0; i < ROUTES.length; i++) {
    const routeName = ROUTES[i];
    const mf = mainFrame(page);
    if (!mf) { results.push({ route: routeName, error: 'no iframe' }); continue; }

    // Race the click against the API response. waitForResponse returns
    // immediately when the matching request finishes — usually <500ms after
    // the click for a warm SPA.
    const busResp = page
      .waitForResponse((r) => isBusApi(r.url()), { timeout: API_TIMEOUT_MS })
      .catch(() => null);
    const clicked = await clickRoute(mf, routeName);
    await busResp;
    await page.waitForTimeout(GRACE_MS);

    if (!JSON_ONLY) {
      await page.screenshot({
        path: `route-${routeName.replace(/\//g, '-')}.png`,
        fullPage: true,
      });
    }

    const text = await mf.evaluate(() => document.body.innerText);
    const parsed = parseRouteText(text);
    results.push({ route: routeName, clicked, ...parsed });

    // Navigate back to the SPA root for the next route. We reload the
    // iframe (not the outer page) — much faster than a full page reload.
    if (i < ROUTES.length - 1) {
      const resetResp = page
        .waitForResponse((r) => isBusApi(r.url()), { timeout: API_TIMEOUT_MS })
        .catch(() => null);
      try {
        await mf.goto(IFRAME_HOME, { timeout: IFRAME_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
      } catch (e) {
        await page.goto(URL_HOME, { timeout: IFRAME_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
      }
      await resetResp;
      await page.waitForTimeout(GRACE_MS);
    }
  }

  console.log(
    JSON.stringify(
      {
        results,
        apiLog,
        _meta: {
          routes: ROUTES,
          jsonOnly: JSON_ONLY,
          graceMs: GRACE_MS,
          apiTimeoutMs: API_TIMEOUT_MS,
          elapsedMs: Date.now() - t0,
        },
      },
      null,
      2
    )
  );

  await browser.close();
})();