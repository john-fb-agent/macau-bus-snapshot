# Task: Capture fresh snapshots for routes 52, MT2, 34

**Created:** 2026-06-11 18:43 (updated 2026-06-12 08:04 — added 34; updated 2026-06-12 19:08 — scope now 30, 34)
**Status:** In Progress
**Model:** minimax/MiniMax-M2.7-highspeed
**Related Issue:** —

---

## 1. Work Brief

John asked (latest, 2026-06-12 19:08): "Route 30 34."

Use the existing `snapshot.js` script (Playwright + headless Chrome) to
capture fresh live snapshots of Macau bus routes **30** and **34** from
the DSAT 巴士報站 system. Save fresh screenshots to `route-30.png` and
`route-34.png` and deliver the human-readable summary back to John.

Prior captures in this session: 52, MT2, 34 (committed 2026-06-12 08:04).

---

## 2. TODO List

- [x] Run `snapshot.js 52 MT2 34` (done 2026-06-12 08:04)
- [x] Commit 52 / MT2 / 34 screenshots (commit 465d38f)
- [ ] Run `snapshot.js 30 34`
- [ ] Review captured output (bus positions for each route)
- [ ] Commit the new screenshots
- [ ] ⚠️ Ask user to confirm completion before deleting this file

---

## 3. Information

**Repo:** `john-fb-agent/macau-bus-snapshot`
**Branch:** `main`
**Routes requested:** 52, MT2, 34 (3 routes; previous run was MT2 only)
**Existing `route-52.png`:** from 2026-06-11 18:45 (very recent)
**Existing `route-MT2.png`:** from 2026-06-11 19:11 (very recent)
**New file `route-34.png`:** will be created on this run
**Note on prior repo-issue.md (2026-06-08):** The older doc-creation
task is "In Progress" with all doc work done but never formally closed
by John. Leaving it untouched for now — will ask John about it at
end-of-task review.
