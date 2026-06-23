# Bus Snapshot Workflow

> How an AI agent should capture a live DSAT bus snapshot and report
> it back to John. Last updated: 2026-06-23.

## When to use this

Whenever John asks for a **live bus snapshot** for one or more Macau
bus routes (e.g. "bus route 30 34 snapshot", "get route MT3"). This is
a recurring task — the same script, the same repo, the same output
shape. Optimize for **speed** and **consistent format**.

## Fast path (skip the heavy github-repo-dev ceremony)

For a *recurring* snapshot, you do **not** need to re-do the full
end-of-task checklist from the `github-repo-dev` skill. The repo
context is already known. The minimum viable workflow is:

1. **Cache is warm** — `AGENTS.md`, `README.md`, and `snapshot.js`
   are unchanged across refreshes. Don't re-read them unless
   something looks broken. Re-read only `repo-issue.md` to see what
   the last refresh noted (e.g. "改道消息 in effect").
2. **Bump `repo-issue.md`** — append the new timestamp to the task
   header. Do *not* recreate the file. Do *not* ask for completion
   confirmation unless John signals a new ask.
3. **Run the script** from the repo root:

   ```bash
   cd /home/js/.openclaw/workspace/github-repos/macau-bus-snapshot
   NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
     node snapshot.js 30 34
   ```

   Per-route cost is ~6s (SPA load + click + wait). Don't hammer
   DSAT — once every 30–60s is fine.
4. **Parse the captured `routestation/bus` response** to build a
   clean bus list per route. The script already captures it in the
   `captured` Map — but the script also dumps the full page text
   to stdout, which is slow and noisy. Prefer reading the JSON
   response directly.
5. **Commit** the refreshed PNGs + `repo-issue.md` bump in one commit
   with the standard model attribution line.
6. **Report** in the format below.

> **Full github-repo-dev workflow** (Step 1.5 repo-agent review,
> Step 2 doc analysis, etc.) is for *new* work in this repo. A
> snapshot refresh is maintenance, not a feature.

## How to read the API response

The `routestation/bus` endpoint returns:

```json
{
  "data": {
    "busColor": "Blue",
    "routeInfo": [
      {
        "staCode": "M4/1",
        "busInfo": [
          { "busPlate": "AA6678", "speed": "6", "status": "0", "busType": "1" }
        ]
      },
      { "staCode": "M20/2", "busInfo": [] }
    ]
  }
}
```

Each `routeInfo` entry is a stop. `busInfo` is the array of buses
*at* that stop (or just past it on the line). To turn `staCode` into
a human stop name, join it with the `staName` from the
`getRouteData.html` response — that response gives you the ordered
list of all stops for the route in the current direction.

Build a `staCode → staName (+ lane)` map from `getRouteData.html`
and use it to enrich each bus entry.

## Output format (use this every time)

Match this shape so John can scan it at a glance:

```
Done. <N> fresh, pushed (commit `<short-hash>`).

**🚌 Route <NAME>** — <改道消息 banner shown> | <N> buses live:
• `<plate>` <speed> km/h · near <staName>
• `<plate>` <speed> km/h · near <staName>
...

**🚌 Route <NAME>** — <改道消息 banner shown> | <N> buses live:
• `<plate>` <speed> km/h · near <staName>
...

MEDIA:<absolute-path-to-screenshot-1>
MEDIA:<absolute-path-to-screenshot-2>
```

Rules:

- **One line per bus.** Format: `` • `<plate>` <speed> km/h · near <staName> ``
- **If a bus has speed = 0 or missing**, render as `` `<plate>` 即将发车 · <staName> ``
- **If detour banner is shown**, mention it on the route header:
  `— 改道消息 | N buses live:`
- **Sort by route order** (the order they appear in the
  `routeInfo` array), not by speed or plate. John reads top-to-bottom
  along the route.
- **Skip empty stops** — only print stops that have at least one bus
  in `busInfo`.
- **At the end, attach the screenshots** using the `MEDIA:` directive
  (one per line, absolute path). This makes them inline-viewable in
  Telegram.
- **End with a follow-up question**: e.g. *"Want me to close out
  the repo-issue.md tracker, or keep it open for the next refresh?"*

## Example (canonical)

> Done. Both fresh, both pushed (commit `5b6295d`).
>
> **🚌 Route 30** — 改道消息 | 10 buses live:
> • `AA6644` 19 km/h · near M20/6 青洲坊總站
> • `AA2959` 8 km/h · near M1/14 關閘總站
> • `AA7090` 3 km/h · near M234 東北大馬路/海濱
> • `AA7240` 23 km/h · near M235/1 東北大馬路/保利達
> • `AA7300` 12 km/h · near T319 嘉模泳池
> • `AA7206` 32 km/h · near T353 廣東大馬路/濠尚
> • `AA6404` 41 km/h · near T413 氹仔中央公園/哥英布拉街
> • `AA3124` 47 km/h · near T343 海灣花園/海城閣
> • `AA2489` 7 km/h · near M246 永華街
> • `AA7534` 45 km/h · near M63 紀念孫中山公園
>
> **🚌 Route 34** — 6 buses live:
> • `AA6678` 即将发车 · M20/2 青洲坊總站
> • `AA7468` 20 km/h · near M1/14 關閘總站
> • `AA6965` 20 km/h · near M234 東北大馬路/海濱
> • `AA6675` 5 km/h · near M235/1 東北大馬路/保利達
> • `AA7552` 11 km/h · near T320 氹仔官也街
> • `AA6768` · near T336/1 海洋花園瞭望台
>
> MEDIA:/home/js/.openclaw/workspace/github-repos/macau-bus-snapshot/route-30.png
> MEDIA:/home/js/.openclaw/workspace/github-repos/macau-bus-snapshot/route-34.png
>
> Screenshots and code committed to `main`.

## Speed budget

For a 2-route refresh the agent's wall-clock should be:

| Step | Budget |
|---|---|
| Read `repo-issue.md` | 1s (cached after first read) |
| Update `repo-issue.md` timestamp | 1s |
| Run `snapshot.js` | 20s |
| Parse JSON + format output | 2s |
| `git add -A && git commit && git push` | 3s |
| **Total** | **~27s** |

The slowest piece is the script. If you want it faster, see
`docs/speed-optimizations.md` (TBD) — main wins are: reduce the
5000ms waits to 2500ms, don't reload the home page between routes,
and skip the full text dump.

## Don'ts

- ❌ Don't re-read `AGENTS.md` / `README.md` on every refresh — they're
  stable. Read once and rely on memory.
- ❌ Don't do Step 1.5 (repo-agent.md review) or Step 2 (full doc
  analysis) for a refresh. Those are for new work.
- ❌ Don't ask "is this complete?" at the end of a refresh. Just
  push and report. Ask only if the work spanned a real new feature.
- ❌ Don't sort buses by speed or plate. Sort by route order.
- ❌ Don't print the captured `routestation/bus` raw JSON to the
  chat — it's huge and unreadable. Parse it.
