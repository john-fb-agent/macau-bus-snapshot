---
name: macau-bus-snapshot
description: Get live Macau bus positions from DSAT 巴士報站 in ~5-10s. Pass route numbers as args. Triggers on "bus snapshot", "live bus", "巴士報站", "bus position", or any Macau DSAT bus request with route numbers like 30, 34, MT2.
---

# Macau Bus Snapshot

Grab **live bus positions** for any Macau bus route from the official DSAT
(交通事務局) 巴士報站 system. Headless-Chrome-based, no API reverse-engineering.

## When to use

Trigger this skill when the user asks for any of:

- A live snapshot of Macau buses (e.g. "bus snapshot 30 34", "巴士報站 52")
- "Where is bus X right now?" / "How many buses are running on route Y?"
- A refreshed screenshot of the DSAT bus page for a specific route
- Any DSAT bus / Macau bus request that needs **real-time** data

Do **not** use for ETA prediction — the site only shows live positions,
not arrival times. See `references/architecture.md` for why.

## Quick start

The fastest path — JSON only, no screenshots:

```bash
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node scripts/snapshot.js 30 34 --json-only
```

Default (no args) = routes 52 and MT2. With screenshots (slower, ~9s for 2 routes):

```bash
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node scripts/snapshot.js 30 34
```

Route labels are whatever appears on the DSAT home grid — e.g. `3`, `11`,
`26A`, `MT1`, `MT2`, `H1`. If a label isn't on the grid, the script prints
`NOT FOUND in DOM` and skips it.

## Output

A single JSON object on stdout:

```jsonc
{
  "results": [
    {
      "route": "30",
      "clicked": "clicked via parent (depth 0)",
      "detour": true,                    // 改道消息 in effect
      "buses": [
        { "plate": "AA5798", "speed": "15",
          "stop": { "code": "M20/6", "name": "青洲坊總站" },
          "note": null }
      ]
    }
  ],
  "apiLog": [ /* raw routestation/bus + getRouteData.html bodies */ ],
  "_meta": { "routes": ["30","34"], "elapsedMs": 9609 }
}
```

Plus `route-<NAME>.png` screenshots (skipped when `--json-only`).

## What to do with the output

Render a Markdown summary like the canonical template in
`references/quick-reference.md`. Key rules:

1. **One bullet per bus**, in the order the route renders them
2. **改道消息 banner** at the top of each route section when `detour: true`
3. Attach the PNG with `MEDIA:route-<NAME>.png` on its own line
4. Surface `_meta.elapsedMs` if speed matters to the user

## Performance budget

| Mode | 2 routes | 3 routes |
|---|---|---|
| `--json-only` | ~6-9s | ~12-18s |
| With screenshots | ~9-12s | ~14-20s |

Per-route cost is ~3-5s after the initial SPA load. The initial load
(~3-8s) is dominated by the SPA bundle + SuperMap scripts. Don't expect
sub-second runs — DSAT is a government service with rate-limit risks.

Wait 30-60s between batch runs.

## Files in this bundle

- `scripts/snapshot.js` — Playwright + headless Chrome, ~200 lines
- `references/architecture.md` — page structure, API endpoints, token mechanism
- `references/known-issues.md` — caveats (no ETAs, TLS cert, route reshuffles)
- `references/quick-reference.md` — CLI usage + output schema + canonical reply template

## Gotchas

- **Route label must exist on the home grid.** DSAT occasionally
  restructures the route list. If `clicked === "NOT FOUND in DOM"`,
  tell the user the route isn't currently listed.
- **`speed` and `note` may be `null`** for buses that are stopped at a
  terminal — those usually have `note: "即将发车"`.
- **Detour (`改道消息`)** is a flag, not a route change. Buses still
  run, but stop geometry may be off. Surface it; don't suppress it.
- **Don't hammer DSAT.** Once every 30-60s is plenty for personal use.
- **Headless Chrome must be at `/usr/bin/google-chrome`** — the script
  hardcodes that path. Override via the `CHROME` env var if needed.

## Prerequisites (one-time)

The OpenClaw coder host already has:

```bash
which google-chrome                              # /usr/bin/google-chrome
ls /home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright
```

If `playwright` is missing on a new host:

```bash
npm install -g playwright
# or point NODE_PATH at an existing install
```

## See also

- `references/architecture.md` — why a headless browser is required,
  the API endpoints, the HMAC token mechanism
- `references/known-issues.md` — what can break (route list changes,
  TLS certs, hardcoded dev secrets)
- `references/quick-reference.md` — CLI options + output schema +
  the canonical Markdown reply template