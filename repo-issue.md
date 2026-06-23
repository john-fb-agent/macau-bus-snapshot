# Task: Capture fresh snapshots for routes MT3, 30, 34

**Created:** 2026-06-11 18:43 (updated 2026-06-12 08:04 — added 34; updated 2026-06-12 19:08 — scope now 30, 34; re-requested 2026-06-15 17:38; added MT3 on 2026-06-15 18:56; refresh 30+34 requested 2026-06-22 19:05; refresh 30+34 requested 2026-06-23 19:15; **test run 2026-06-23 19:24, timing the new procedure**)
**Status:** In Progress
**Model:** minimax/MiniMax-M2.7-highspeed
**Related Issue:** —

---

## 1. Work Brief

John asked on 2026-06-15 18:56: "Get route MT3 30 34." Extending the
prior 30/34 capture with MT3. All three screenshots will be refreshed
in a single `snapshot.js` run.

Use the existing `snapshot.js` script (Playwright + headless Chrome) to
capture fresh live snapshots of Macau bus routes **MT3, 30, 34** from
the DSAT 巴士報站 system. Save fresh screenshots to `route-MT3.png`,
`route-30.png`, `route-34.png` and deliver the human-readable summary
back to John.

Prior captures in this thread: 52, MT2, 34 (commit 465d38f, 2026-06-12 08:04);
30, 34 (commit 5b6295d, 2026-06-12 19:10); 30, 34 (commit 66cf6eb, 2026-06-15 17:38).

---

## 2. TODO List

- [x] Run `snapshot.js 52 MT2 34` (done 2026-06-12 08:04, commit 465d38f)
- [x] Run `snapshot.js 30 34` (done 2026-06-12 19:10, commit 5b6295d)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-15 17:38, commit 66cf6eb)
- [x] Run `snapshot.js MT3 30 34` (refresh — 2026-06-15 18:56, all 3 screenshots updated)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-22 19:05)
- [x] Review captured output (bus positions for each route)
- [x] Commit the refreshed screenshots (commit 1fb2d5e)
- [x] Run `snapshot.js 30 34` (refresh — 2026-06-23 19:15)
- [ ] Run `snapshot.js 30 34` (test — 2026-06-23 19:24, timing the new procedure)
- [ ] Review captured output + commit refreshed screenshots
- [ ] ⚠️ Ask user to confirm completion before deleting this file

---

## 3. Information

**Repo:** `john-fb-agent/macau-bus-snapshot`
**Branch:** `main`
**Routes requested:** MT3, 30, 34 (this run)
**Detour status observed 2026-06-15 17:38:** Both routes 30 and 34
showed 改道消息 (detour in effect). Worth re-checking after this run.
**Note on prior repo-issue.md (2026-06-08):** The older doc-creation
task is "In Progress" with all doc work done but never formally closed
by John. Leaving it untouched for now — will ask John about it at
end-of-task review.
