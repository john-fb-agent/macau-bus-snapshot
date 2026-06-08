# Macau DSAT Bus Live Snapshot — How-To

A short guide + working script for pulling **live bus positions and waiting status**
for any Macau bus route from the official **DSAT (交通事務局) 巴士報站** system.

> Target URL: <https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc>

> 🤖 **If you're an AI agent:** read [`AGENTS.md`](./AGENTS.md) first. The
> longer technical content (page structure, token mechanism, etc.) lives in
> [`docs/architecture.md`](./docs/architecture.md). Caveats and workarounds
> are in [`docs/known-issues.md`](./docs/known-issues.md).

---

## TL;DR

The DSAT bus app is a JavaScript single-page app (React + SuperMap). You **cannot**
just `curl` it — the home page is a thin HTML wrapper that loads the real app inside
an iframe, and the real app talks to a JSON API protected by a per-request HMAC-style
`token` header.

The reliable, no-reverse-engineering way to get a live snapshot is:

1. Open the page in a headless browser (Playwright + system Chrome).
2. Wait for the SPA to render the route grid.
3. Click the route number (e.g. `52` or `MT2`).
4. Read the live bus data out of the iframe's DOM and the `routestation/bus` API
   response.

A working script that does exactly that is in [`snapshot.js`](./snapshot.js).

---

## Why a headless browser is required

Things that **do not** work:

| Tool | Why it fails |
|---|---|
| `curl` / `web_fetch` | The outer page returns HTML with an empty `<body>` and an `<iframe src="https://bis.dsat.gov.mo:37812/macauweb/">`. No bus data is in the initial HTML. |
| Hitting the JSON API directly | Every request needs a custom `token` header (HMAC of query string + a time-based string) that is computed by a webpack-bundled module. The dev bundle does contain a hardcoded `BypassToken: HuatuTesting0307` (interesting trivia), but the API still rejects requests with `status: 1000` (token required) without the dynamic signature. |
| `wget` / raw HTTP | Same as curl — no JS execution. |

Things that **work**:

- **Playwright + headless Chrome** — the script below opens the page, lets the
  SPA initialize (it makes ~10 API calls on load), then clicks the route icon and
  scrapes the response + rendered DOM.

---

## How to get a live snapshot

### 1. Prerequisites

- Node.js ≥ 18
- `playwright` reachable via the `NODE_PATH` below
- A `google-chrome` binary at `/usr/bin/google-chrome`

```bash
# On the OpenClaw coder host these are already set up:
which google-chrome           # /usr/bin/google-chrome
ls /home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright
```

### 2. Save the script

Copy [`snapshot.js`](./snapshot.js) into the current directory. The script:

- Launches headless Chrome via Playwright
- Navigates to the DSAT bus page
- Waits for the iframe to load
- Clicks a route number (default: `52` and `MT2`)
- Captures the `routestation/bus` JSON response for each route
- Prints a human-readable table of stops + live buses
- Saves a screenshot per route to `route-<NAME>.png`

### 3. Run it

```bash
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node snapshot.js
```

Sample output:

```
========= ROUTE 52 =========
C690/5-蝴蝶谷大馬路總站 (B 車道)
C689/2-和諧廣場/樂群樓
C650-石排灣馬路/擎天匯
C703-榕樹街/金峰南岸
  🚌 AB6106   27 km/h
T427-澳大河隧/西堤馬路
...
```

The script also dumps the raw `getRouteData.html` and `routestation/bus` JSON
responses — those are the canonical data sources.

### 4. Customize the routes

The script has a `ROUTES` array near the top:

```js
const ROUTES = ['52', 'MT2'];
```

Replace it with any routes shown on the home grid (e.g. `['3', '11', '26A', 'MT1', 'MT2', 'H1']`).

---

## How the page is structured

```
https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc
└─ <iframe src="https://bis.dsat.gov.mo:37812/macauweb/">     ← outer wrapper
   └─ macauweb SPA (React + SuperMap)
      ├─ Home: grid of all bus route icons (colored by operator)
      │        blue  = 新福利 (Transmac)
      │        orange= 澳巴 (TCM)
      │        green = 新時代 (defunct? only 2 routes)
      │        cone  = service notice / detour
      ├─ Route detail: list of stops + live bus positions between them
      └─ Banner / swiper header at the top
```

Clicking a route on the home grid calls:

```
POST https://bis.dsat.gov.mo:37812/macauweb/getRouteData.html
GET  https://bis.dsat.gov.mo:37812/macauweb/routestation/bus
```

`routestation/bus` returns the live state — for each stop on the route, it
includes a `busInfo` array with license plate, bus type, speed, and passenger
flow. Empty `busInfo` = no bus between that stop and the next.

---

## Key API endpoints (from network capture)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/macauweb/getRouteData.html` | Stops + metadata for a route |
| `GET`  | `/macauweb/routestation/bus`   | **Live bus positions per stop** |
| `POST` | `/ddbus/busmess/route`         | Service notices for a route |
| `GET`  | `/ddbus/common/station/capacity` | (Empty in dev) |
| `GET`  | `/ddbus/common/banner/list`    | Banners shown at the top |
| `GET`  | `/ddbus/common/keyPoi/category` | POI categories (lights, roadworks) |
| `GET`  | `/ddbus/user/uid`              | Anonymized device ID (sets a `HUID` cookie) |
| `GET`  | `/macauweb/static/build.json`  | Frontend version (e.g. `3.8.6`) |

All require:
- A `token: <HMAC>` request header
- A `BypassToken: HuatuTesting0307` parameter (this is a dev secret left in the prod bundle — funny but not exploitable for clean data, since the `token` header is still required and uses a time-based key)

---

## Token mechanism (for the curious)

The SPA computes the `token` header in `vendors.<hash>.js` roughly like this:

```js
g = function(url, data) {
  // 1. Build query string from `data` (or from `url`'s "?..." part)
  var qs = buildQueryString(data ?? url);

  // 2. p() is some hash (MD5/SHA) of qs — module 1299 in the bundle
  var hash = p()(qs);

  // 3. c() is the current local time formatted as YYYYMMDDHHmm
  var t = c();   // e.g. "202606080847"

  // 4. Splice slices of `t` into the hash at fixed positions
  return hash
    .split("")
    .splice(24, 0, t.slice(8))     // 4 chars: HHmm
    .splice(12, 0, t.slice(4, 8))  // 4 chars: MMDD
    .splice(4,  0, t.slice(0, 4))  // 4 chars: YYYY
    .join("");
}
```

The token is bound to the request URL + params + current minute. Reverse-engineering
it is doable but out of scope for a 5-line script — using a real browser sidesteps
the problem.

---

## Caveats

- The site shows **live positions, not ETAs**. To estimate "X minutes until next
  bus at stop Y", compute the distance from the nearest `busInfo` to that stop
  divided by its speed. Speed is in km/h, staCodes aren't geocoded by this
  endpoint — you'd need to combine with a stops/lines GeoJSON (the SuperMap tile
  server at `https://bis.dsat.gov.mo:8091/iserver/services/map-ugcv5-aomenC` is
  where the route geometry lives).
- The page is mobile-sized by default. Desktop browsers get the same view but
  some selectors differ. The script uses a 414×900 mobile viewport.
- Headless Chrome + Playwright takes ~6 seconds per route (load + click + wait).
  Fine for one-shot snapshots, not for sub-second polling.
- Don't hammer it — DSAT is a government service. Once every 30–60s is plenty
  for a personal cron.

---

## What I'd build next

- A specific-stop watcher: you tell me "city center stop on route 52", I alert
  via Telegram when a bus is ~3 min away.
- A morning cron that posts the day's service notices + delays for routes 52
  and MT2 to Telegram at 07:30.
- A reverse-engineered token so we can poll the API directly without a browser
  (faster, headless server friendly).

Just say the word.

---

## 📚 Related

- [`AGENTS.md`](./AGENTS.md) — AI agent guide (purpose, structure, troubleshooting)
- [`docs/architecture.md`](./docs/architecture.md) — page structure, token mechanism
- [`docs/known-issues.md`](./docs/known-issues.md) — caveats and workarounds
- [`docs/changelog.md`](./docs/changelog.md) — release notes
