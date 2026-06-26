# Task: Capture fresh snapshots for routes MT3, 30, 34 + v3 perf + OpenClaw skill

**Created:** 2026-06-11 18:43 (updated 2026-06-12 08:04 — added 34; updated 2026-06-12 19:08 — scope now 30, 34; re-requested 2026-06-15 17:38; added MT3 on 2026-06-15 18:56; refresh 30+34 requested 2026-06-22 19:05; refresh 30+34 requested 2026-06-23 19:15; **test run 2026-06-23 19:24, timing the new procedure**; refresh **11, 30, 34, MT2** requested 2026-06-24 18:43; refresh **11, MT2** requested 2026-06-24 18:45; refresh **30, 34** requested 2026-06-26 08:24; **v3 perf + skill bundle** requested 2026-06-26 08:49)
**Status:** In Progress
**Model:** minimax/MiniMax-M2.7-highspeed
**Related Issue:** —

---

## 1. Work Brief

Two parts to this task:

1. Refresh the 30 + 34 snapshots (John asked at 08:24) — done, committed `a7b4ddc`.
2. Make the bus snapshot tool faster AND ship it as a reusable OpenClaw skill
   (John asked at 08:49). Goal: agent-callable, sub-10s for 2 routes.

Use the existing `snapshot.js` script (Playwright + headless Chrome) to
capture fresh live snapshots of Macau bus routes. Save fresh screenshots to
`route-<NAME>.png` and deliver the human-readable summary back to John.

---

## 2. TODO List

- [x] Run `snapshot.js 52 MT2 34` (done 2026-06-12 08:04, commit 465d38f)
- [x] Run `snapshot.js 30 34` (done 2026-06-12 19:10, commit 5b6295d)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-15 17:38, commit 66cf6eb)
- [x] Run `snapshot.js MT3 30 34` (refresh — 2026-06-15 18:56)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-22 19:05)
- [x] Commit the refreshed screenshots (commit 1fb2d5e)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-23 19:15)
- [x] Run `snapshot.js 30 34` (test — 2026-06-23 19:24, timing the new procedure)
- [x] Run `snapshot.js 11 30 34 MT2` (refresh — 2026-06-24 18:43, commit 9494d30)
- [x] Run `snapshot.js 11 MT2` (refresh — 2026-06-24 18:45, commit 8bed338)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-26 08:24, commit a7b4ddc)
- [x] Review captured output + commit refreshed screenshots
- [x] Write v3 `snapshot.js` with `waitForResponse` on bus API + `--json-only` flag
- [x] Test v3: 2 routes + screenshots = ~10s; 2 routes json-only = ~7s; 3 routes json-only = ~14s
- [x] Create `skills/macau-bus-snapshot/` bundle (SKILL.md + scripts/ + references/)
- [x] Update `AGENTS.md` (skills section + perf note)
- [x] Update `docs/changelog.md` (v3 + skill bundle entry)
- [x] Commit skill bundle to repo
- [ ] Register skill via `skill_workshop action=create` (pending)
- [ ] ⚠️ Ask user to confirm completion (and whether to apply the proposal) before deleting this file

---

## 3. Information

**Repo:** `john-fb-agent/macau-bus-snapshot`
**Branch:** `main`
**Routes requested (this run):** 30, 34
**Detour status observed 2026-06-26 08:25:** Both routes 30 and 34
showed 改道消息 (detour in effect).

**v3 perf numbers (DSAT was moderately slow on 2026-06-26):**

| Mode | 2 routes | 3 routes |
|---|---|---|
| v2 (previous) | ~13s | ~19s |
| v3 `--json-only` | ~7s | ~14s |
| v3 with screenshots | ~10s | ~18s |

Key changes in v3:
- `page.waitForResponse` on `routestation/bus` instead of `waitForTimeout(2500)`
- Initial-load wait keys off `getRouteAndCompanyList.html` (which the
  home grid actually calls), not the bus API (which only fires on click)
- New `--json-only` flag skips PNG screenshots

**Skill bundle (`skills/macau-bus-snapshot/`):**

- `SKILL.md` — frontmatter + procedure, triggers on bus / 巴士報站 / DSAT requests
- `scripts/snapshot.js` — mirror of repo-root v3
- `references/architecture.md` — page structure + token mechanism
- `references/known-issues.md` — caveats and workarounds
- `references/quick-reference.md` — CLI options, output schema, the canonical
  Markdown reply template, speed budgets

**Note on prior repo-issue.md (2026-06-08):** The older doc-creation
task is "In Progress" with all doc work done but never formally closed
by John. Leaving it untouched for now — will ask John about it at
end-of-task review.