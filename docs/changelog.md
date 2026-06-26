# Changelog

> Release notes for `macau-bus-snapshot`. Newest first.

---

## 2026-06-26 — v3 perf + OpenClaw skill bundle

**What's in this commit:**

- **`snapshot.js` v3** — switched from a fixed `waitForTimeout(2500ms)`
  after every click to `page.waitForResponse` on the `routestation/bus`
  endpoint. Initial-load wait now keys off `getRouteAndCompanyList`
  (which the home grid actually calls), not the bus API. Added a
  `--json-only` flag to skip PNG screenshots.

  Measured on the OpenClaw coder host (DSAT was moderately slow today):

  | Mode | 2 routes | 3 routes |
  |---|---|---|
  | v2 (previous) | ~13s | ~19s |
  | v3 (this) — `--json-only` | ~7s | ~14s |
  | v3 (this) — with screenshots | ~10s | ~18s |

- **`skills/macau-bus-snapshot/`** — new self-contained OpenClaw skill
  bundle. Contents:
  - `SKILL.md` — frontmatter + procedure, triggers on bus / 巴士報站 / DSAT requests
  - `scripts/snapshot.js` — mirror of the repo-root script
  - `references/architecture.md` — page structure + token mechanism
  - `references/known-issues.md` — caveats and workarounds
  - `references/quick-reference.md` — CLI options, output schema, the
    canonical Markdown reply template + speed budgets

  The skill can be registered with OpenClaw via `skill_workshop
  action=create` (then `action=apply` once approved).

- **`AGENTS.md`** — added a `skills/` section explaining the bundle and
  the rule that `skills/macau-bus-snapshot/scripts/snapshot.js` must
  mirror the repo-root script.

🤖 Model: minimax/MiniMax-M2.7-highspeed

---

## 2026-06-23 — Documented the snapshot workflow

**What's in this commit:**

- **`docs/snapshot-workflow.md`** — fast-path procedure for recurring
  bus snapshot refreshes. Captures: when to skip the full
  github-repo-dev ceremony, how to parse the `routestation/bus`
  response, the canonical output format (with worked example),
  the ~27s speed budget, and a list of don'ts.
- **Canonical output template** matches what John expects:
  one bullet per bus, route-order sorted, `MEDIA:` attachments
  inline, 改道消息 banner called out per route, follow-up question
  at the end.

**No code changes** — `snapshot.js` unchanged. The procedure doc
is the deliverable; speed optimizations to the script are tracked
separately.

🤖 Model: minimax/MiniMax-M2.7-highspeed

---

## 2026-06-08 — Initial release

**What's in this commit:**

- **`README.md`** — full how-to for getting a live bus snapshot from the
  Macau DSAT (交通事務局) 巴士報站 system. Covers why `curl` doesn't work,
  why a headless browser is required, the page structure, the key API
  endpoints, the token mechanism, and caveats.
- **`snapshot.js`** — a ~120-line Node script that opens the page in
  Playwright + headless Chrome, clicks each requested route, captures
  the `routestation/bus` JSON response, and prints a human-readable
  table. CLI usage: `node snapshot.js 52 MT2 3`.
- **`route-52.png`, `route-MT2.png`** — sample screenshots from a real
  run on 2026-06-08 08:21 GMT+8. Used as visual proof in the README.

**Verified working with:**

- Node v22.22.2
- Playwright 1.60.0
- Google Chrome stable
- DSAT frontend build `3.8.6` (from `/macauweb/static/build.json`)

**Known caveats:** see `docs/known-issues.md`.

---

## 2026-06-08 — Added AGENTS.md and docs/

**What's in this commit:**

- **`AGENTS.md`** — repo-specific AI agent guide (purpose, structure,
  key concepts, troubleshooting, task workflow).
- **`docs/architecture.md`** — moved the long-form technical content
  (page structure, token mechanism, headless browser rationale) out of
  the README and into a dedicated doc.
- **`docs/known-issues.md`** — 7 known issues documented with workarounds
  (no ETAs, hash-busted JS bundles, `BypassToken` placement, etc.).
- **`docs/changelog.md`** — this file.
- **`repo-issue.md`** — task tracker. Will be deleted once the user
  confirms completion (per github-repo-dev skill).

**No code changes** — `snapshot.js` and `README.md` are unchanged.
The README still links into the new docs and remains the entry point.