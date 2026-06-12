# Task: Capture fresh snapshots for routes 52, MT2, 34

**Created:** 2026-06-11 18:43 (updated 2026-06-12 08:04 — added 34)
**Status:** In Progress
**Model:** minimax/MiniMax-M2.7-highspeed
**Related Issue:** —

---

## 1. Work Brief

John asked (latest, 2026-06-12 08:03): "Load github repo dev skill, goto
bus route repo, get bus route 52 MT2 34 snapshot."

Use the existing `snapshot.js` script (Playwright + headless Chrome) to
capture fresh live snapshots of three Macau bus routes — **52, MT2, 34** —
from the DSAT 巴士報站 system. Deliver the human-readable summaries back to
John and save fresh screenshots to `route-52.png`, `route-MT2.png`,
`route-34.png` (overwriting the older ones).

---

## 2. TODO List

- [ ] Run `snapshot.js 52 MT2 34`
- [ ] Review captured output (bus positions for each route, 3 screenshots)
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
