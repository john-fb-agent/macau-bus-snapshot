# Quick Reference — Macau Bus Snapshot

> One-page cheat sheet for the `macau-bus-snapshot` skill.

## CLI

```bash
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node scripts/snapshot.js [ROUTE...] [--json-only]
```

| Flag / arg | Default | Purpose |
|---|---|---|
| `[ROUTE...]` | `52 MT2` | One or more route labels (anything on the DSAT home grid) |
| `--json-only` | off | Skip PNG screenshots; faster (~6-9s for 2 routes vs ~9-12s) |

Route labels are case-sensitive. The full list is whatever appears in the
home grid at <https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc>
as of the current frontend build.

## Output schema

```ts
type Result = {
  results: Array<{
    route: string;            // "30" | "MT2" | "26A" | ...
    clicked: string;          // "clicked via parent (depth 0)" | "NOT FOUND in DOM" | ...
    detour?: boolean;         // true if 改道消息 banner was visible
    buses: Array<{
      plate: string;          // Macau plate, e.g. "AA5798"
      speed: string | null;   // "27" km/h, or null if at terminal
      stop: { code: string; name: string } | null;  // nearest stop on the route
      note: string | null;    // "即将发车" for buses about to depart
    }>;
  }>;
  apiLog: Array<{ url: string; body: string }>;  // raw routestation/bus + getRouteData.html
  _meta: {
    routes: string[];
    jsonOnly: boolean;
    graceMs: number;          // post-API grace period (default 250)
    apiTimeoutMs: number;     // max wait per API response (default 8000)
    elapsedMs: number;        // total wall-clock time
  };
}
```

## Canonical Markdown reply template

Use this when delivering bus positions to the user (matches what John
expects from prior 2026-06-23 snapshot runs):

```markdown
**Bus route snapshots — 30 & 34 (2026-06-26 08:25 GMT+8)** ⚠️ 改道消息 (detour in effect on both)

**Route 30 — 14 buses live**
| Plate | Speed | Near stop |
|---|---|---|
| AA5798 | 15 km/h | M20/6 青洲坊總站 |
| AA6404 | 7 | M222/2 看台街 |
...

**Route 34 — 7 buses live**
| Plate | Speed | Near stop |
|---|---|---|
| AA6843 | 35 km/h | M20/2 青洲坊總站 |
...

Committed `<hash>` → pushed to `main`.

MEDIA:route-30.png
MEDIA:route-34.png
```

Rules:

1. Sort buses in the order the API returns them (the route order)
2. Surface `detour: true` as a banner at the top of the affected route
3. Render `note: "即将发车"` as "(即將發車)" in the Speed column when `speed` is null
4. Attach the PNG via `MEDIA:route-<NAME>.png` on its own line
5. If `_meta.elapsedMs` is unusually high (>20s for 2 routes), mention
   DSAT may be slow today

## Performance tips

- **Warm SPA first**: opening the home page once is ~3-8s due to the
  SuperMap scripts. Subsequent route clicks within the same run are ~3-5s each.
- **JSON-only is fastest**: skip the PNG save if the user doesn't need
  a screenshot. Saves ~1-2s per route.
- **Don't bump `GRACE_MS`**: 250ms is enough for the DOM render after
  `waitForResponse` resolves. Higher values just waste time.
- **Don't parallelize with multiple pages**: the SPA uses session-level
  state that conflicts. Sequential is correct.

## Speed budgets (observed on OpenClaw coder host, 2026-06-26)

| Routes | Mode | Median | Worst |
|---|---|---|---|
| 2 | `--json-only` | 7s | 12s |
| 2 | screenshots | 10s | 14s |
| 3 | `--json-only` | 14s | 20s |
| 3 | screenshots | 16s | 22s |

If a run exceeds the worst case, DSAT is probably slow. Retry once.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `NOT FOUND in DOM` for a known route | Route was renamed / removed | Open the URL in a real browser and check the new label |
| `no iframe` | DSAT served the page without the iframe wrapper | Retry once — usually transient |
| Empty `buses: []` | Route currently has no buses running (e.g. early morning, late night) | Render the route with "0 buses live" — legitimate state |
| `elapsedMs > 30s` | DSAT is slow or partially down | Retry; if persistent, surface to user |
| Chrome `net::ERR_CERT_*` | bis.dsat.gov.mo cert issue | The script already passes `--ignore-certificate-errors` and `ignoreHTTPSErrors: true`. If it persists, see `known-issues.md` |