# Architecture

> Why we use a headless browser, how the DSAT bus app is structured, and
> how the API's auth token works. Read this before changing `snapshot.js`.

---

## TL;DR

The DSAT bus app is a JavaScript single-page application (SPA) loaded inside
an `<iframe>` of a thin HTML wrapper page. The SPA talks to a JSON API
protected by a per-request HMAC-style `token` header. Rather than
reverse-engineer the token, we drive a real headless Chrome and let the
SPA do its own auth.

```
   https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc
   └── <iframe src="https://bis.dsat.gov.mo:37812/macauweb/" />
        └── macauweb SPA (React + SuperMap)
             ├── Home:  grid of all bus route icons
             └── Route: list of stops + live bus positions between them
                    │
                    ├── POST /macauweb/getRouteData.html
                    │      → stops + metadata for the selected route
                    │
                    └── GET  /macauweb/routestation/bus
                           → live state: for each stop,
                             array of buses (plate, type, speed, flow)
```

---

## 1. The page

The outer page at `dsat.gov.mo` is a 30-line HTML file that does nothing
other than embed an iframe:

```html
<iframe
  src="https://bis.dsat.gov.mo:37812/macauweb/"
  frameborder="0"
  style="position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%"
></iframe>
```

The real app lives at `bis.dsat.gov.mo:37812/macauweb/`. It is a React-style
SPA built with Webpack (we observed chunk hashes like `index.6e5a0476.js`,
`vendors.6e5a0476.js`) plus a SuperMap-based mapping layer (from
`/macauweb/static/supermap11iR2/...`).

Initial HTML contains route shells, language switchers, and modal markup
but **no bus data**. All bus data is loaded by JavaScript after the page
boots.

---

## 2. The home grid

After the SPA initializes, the home screen shows a grid of all bus routes
operated in Macau. Each icon is colored by the operating company:

| Color  | Operator  | Notes |
|--------|-----------|-------|
| 🟦 Blue   | 新福利 (Transmac) | |
| 🟧 Orange | 澳巴 (TCM)        | Largest operator |
| 🟩 Green  | 新時代 (Reolian)   | Only ~2 routes remaining (legacy) |

A small **orange traffic-cone** icon on a route indicates a service notice
or detour. The same info is in the `busmess/route` API response.

As of 2026-06-08, ~72 routes are visible (1, 1A, 2, 2A, ..., 73, plus MT1,
MT2, MT3, MT4, MT5, H1).

---

## 3. Clicking a route

When the user (or `snapshot.js`) clicks a route icon, the SPA calls:

```
POST https://bis.dsat.gov.mo:37812/macauweb/getRouteData.html
GET  https://bis.dsat.gov.mo:37812/macauweb/routestation/bus
```

`getRouteData.html` returns the static information for a route — the
ordered list of stops, the route code, and the URL for change messages:

```json
{
  "data": {
    "routeCode": "00052",
    "suspend": "暫不停靠站點",
    "routeCoors": [],
    "routeChange": "0",
    "msgList": [],
    "dir": "",
    "routeChangeWebBaseURL": "https://bis.dsat.gov.mo:37011/its/routeChangeMsgWeb.html",
    "routeInfo": [
      { "staName": "蝴蝶谷大馬路總站", "laneName": "B 車道",
        "suspendState": "0", "busstopcode": "00052001", "staCode": "C690/5" },
      { "staName": "和諧廣場/樂群樓", ... },
      ...
    ]
  },
  "header": "000"
}
```

`routestation/bus` returns the live state — for each stop on the route, an
array of currently-running buses between that stop and the next:

```json
{
  "data": {
    "lastBusType": "",
    "badCar": "",
    "lastBusPlate": "",
    "toBeginBus": "",
    "busColor": "Orange",
    "routeInfo": [
      { "staCode": "C690/5", "busInfo": [] },
      { "staCode": "C689/2", "busInfo": [] },
      { "staCode": "C650",    "busInfo": [] },
      { "staCode": "C703",    "busInfo": [
          { "busType":"2", "busCode":"E2262", "busPlate":"AB6106",
            "status":"0", "isFacilities":"0",
            "passengerFlow":"2", "speed":"27" }
      ]},
      ...
    ]
  }
}
```

Key fields:

| Field | Meaning |
|-------|---------|
| `staCode` | Stop code (also used as a key in `getRouteData.html`) |
| `busInfo[]` | Empty = no bus between this stop and the next |
| `busPlate` | License plate, e.g. `AB6106` |
| `busType` | `1` = small bus, `2` = large bus (best guess — see known-issues) |
| `speed` | km/h, integer |
| `passengerFlow` | `"-1"` = unknown; `0..3` = rough load (0=empty, 3=full) |
| `status` | `0` = running, `1` = at terminal/layover (best guess) |

**There are no ETAs.** To estimate "X minutes to stop Y", you have to
combine this speed with the stops/lines geometry from the SuperMap tile
service (`https://bis.dsat.gov.mo:8091/iserver/services/map-ugcv5-aomenC`).
We don't do that here.

---

## 4. The token mechanism (for the curious)

Every API call carries a custom `token` request header. The token is
computed in the SPA's webpack bundle (`vendors.<hash>.js`), in a function
roughly equivalent to:

```js
g = function(url, data) {
  // 1. Build the query string from `data` (or from `url` if no `data`).
  var qs = buildQueryString(data ?? url);

  // 2. Hash it. `p()` is module 1299 in the bundle (MD5/SHA — not
  //    reverse-engineered; it doesn't matter for snapshot.js).
  var hash = p()(qs);

  // 3. Current local time formatted as YYYYMMDDHHmm
  //    e.g. "202606080847" for 2026-06-08 08:47.
  var t = c();

  // 4. Splice slices of `t` into the hash at fixed positions.
  return hash
    .split("")
    .splice(24, 0, t.slice(8))      // 4 chars: HHmm
    .splice(12, 0, t.slice(4, 8))   // 4 chars: MMDD
    .splice( 4, 0, t.slice(0, 4))   // 4 chars: YYYY
    .join("");
}
```

The token is therefore:

- **Bound to the request URL + params** (one token per request)
- **Bound to the current minute** (rolling window)
- **Includes a hardcoded dev secret** in the `BypassToken` parameter that
  is checked on the server side but does **not** bypass the `token` header

Reverse-engineering the hash function is doable but not worth the
maintenance burden. Driving a real browser sidesteps the problem.

---

## 5. Why a headless browser

| Approach | Result |
|----------|--------|
| `curl` / `web_fetch` the outer page | Returns HTML with empty body + iframe tag. No data. |
| Hitting the JSON API directly | `{"data":"","header":{"status":"1000"}}` — token required. |
| Running a real headless Chrome | Works. ~6s per route. |

Playwright + system Chrome (`/usr/bin/google-chrome`) is the simplest
reliable option. We use:

```js
chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
});
```

The `--ignore-certificate-errors` flag is needed because
`bis.dsat.gov.mo:37812` has a self-signed or expired TLS cert that some
Chrome versions reject by default.

---

## 6. Future improvements (not implemented)

- **Stop-specific watcher.** Combine `routestation/bus` with the
  SuperMap route geometry to compute "next bus at stop X in N minutes".
  Then alert via Telegram when N < threshold.
- **Token reverse-engineering.** Port the JS `g` function to Python/Go
  and bypass the browser. Worth it only if we want sub-second polling.
- **Mobile-app view.** The official DSAT app has a slightly different
  layout with proper ETAs. Same APIs, different bundle hash.

See `changelog.md` for what was actually shipped.
