# Known Issues

> Things that can break when using `snapshot.js` or extending this repo.
> Add a new entry at the top when you discover something.

---

## 2026-06-08 — `busType` and `status` field semantics are not documented

**What.** The `busType` and `status` fields in the `routestation/bus`
response are not documented anywhere public. We're guessing:

- `busType`: `1` = small/medium bus, `2` = large bus
- `status`: `0` = running, `1` = at terminal or layover

**Why it matters.** If you're using these fields to do something
non-trivial (e.g. filtering "buses currently moving"), the guess might
be wrong.

**Workaround.** Treat both as opaque strings for now. Use `speed` and
the timestamp of the most recent API response instead.

---

## 2026-06-08 — DSAT frontend version hash changes without notice

**What.** The webpack chunks are content-hashed:
`index.6e5a0476.js`, `vendors.6e5a0476.js`, `index.6e5a0476.css`. When
DSAT ships a new frontend build, the hash changes.

**Why it matters.** If you've cached the JS bundles for offline analysis
or to compare token generation logic, the cache is stale.

**Workaround.** Always re-fetch the bundle from `/macauweb/`. The
`/macauweb/static/build.json` endpoint returns the current version
(e.g. `3.8.6` as of 2026-06-08).

---

## 2026-06-08 — No countdown ETAs, only live positions

**What.** The site shows where each bus is right now and its speed. It
does **not** show "X minutes until arrival at stop Y".

**Why it matters.** If you want a "next bus in N minutes" answer (e.g.
for a Telegram alert), you have to compute it yourself.

**Workaround.** Combine the `routestation/bus` response with the route
geometry from the SuperMap tile service:
`https://bis.dsat.gov.mo:8091/iserver/services/map-ugcv5-aomenC`. That
service has the lat/lon of every stop. Then it's a haversine-distance
+ `speed` calculation.

---

## 2026-06-08 — TLS cert on `bis.dsat.gov.mo:37812` is questionable

**What.** The `bis.dsat.gov.mo:37812` endpoint occasionally presents a
cert that some Chrome builds reject.

**Why it matters.** If the script starts failing with `net::ERR_CERT_*`
errors, the `--ignore-certificate-errors` flag is no longer enough.

**Workaround (current).** `snapshot.js` already passes
`--ignore-certificate-errors` to Chrome and `ignoreHTTPSErrors: true` to
the Playwright context.

**Workaround (future).** If the cert becomes truly invalid, the script
will need to be pointed at a different host (e.g. the official DSAT app
APIs) or the cert needs to be added to the system trust store.

---

## 2026-06-08 — Hardcoded `BypassToken: HuatuTesting0307` in prod bundle

**What.** The dev/QA bypass token is hardcoded in the production JS
bundle.

**Why it matters.** This is a security smell, even if it doesn't grant
useful access. Worth flagging to DSAT if you have a contact.

**Workaround.** None needed for the script to work. The `BypassToken`
is not enough on its own — the dynamic `token` header is still required.

---

## 2026-06-08 — `BypassToken` in POST body is treated differently from query string

**What.** When we initially tried to call the API with
`?BypassToken=HuatuTesting0307` in the query string, every endpoint
returned `status: 1000` (token required). When we tried the same
parameter in the POST body for a POST endpoint, we got `status: 100`
(missing/invalid params). The dev frontend appears to send `BypassToken`
as a body field, not a query param.

**Why it matters.** If you ever write a manual API client (bypassing
the browser), the parameter placement matters. Follow what the SPA
does, not what the API docs would say.

**Workaround.** Match the SPA exactly: send `BypassToken` as a body
field on POSTs, and the dynamic `token` as a request header on every
request.

---

## 2026-06-08 — DSAT occasionally restructures the route list

**What.** The home grid isn't a fixed set of routes. New routes get
added, old ones get retired or renumbered. The new route list is
whatever's in `getRouteAndCompanyList.html`.

**Why it matters.** A route label that worked yesterday might not work
today. The script will print `NOT FOUND in DOM` and skip it.

**Workaround.** If a route is missing, refresh the home page in a real
browser and check whether the label changed (e.g. `26A` → `26AT`).
Update `snapshot.js` accordingly.

---

## 2026-06-08 — Bundle analyzer tools (webpack) needed for token reverse-engineering

**What.** If you ever want to skip the headless browser, you'll need to
recover module 1299 from the webpack bundle. The bundle is
`vendors.<hash>.js` (currently ~230 KB minified). The relevant module
is small but the surrounding code (jQuery, Bootstrap, axios, etc.) is
noisy.

**Why it matters.** Reverse-engineering the hash function is the main
hurdle to direct API access.

**Workaround.** Use a JS-aware beautifier (`prettier`, `webcrack`) on
the bundle first. Then search for `function (t, e, n) {` patterns —
the module 1299 definition will be one of those.
