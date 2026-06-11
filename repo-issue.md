# Task: Capture fresh MT2 bus route snapshot

**Created:** 2026-06-11 18:43
**Status:** In Progress
**Model:** minimax/MiniMax-M2.7-highspeed
**Related Issue:** —

---

## 1. Work Brief

John asked: "goto bus route repo, get bus route MT2 snapshot."

Use the existing `snapshot.js` script (Playwright + headless Chrome) to
capture a fresh live snapshot of Macau bus route MT2 from the DSAT
巴士報站 system. Deliver the human-readable summary back to John and
save a new screenshot to `route-MT2.png` (overwriting the older one).

---

## 2. TODO List

- [ ] Run `snapshot.js MT2`
- [ ] Review captured output (bus positions, route-MT2.png)
- [ ] Commit the new screenshot
- [ ] ⚠️ Ask user to confirm completion before deleting this file

---

## 3. Information

**Repo:** `john-fb-agent/macau-bus-snapshot`
**Branch:** `main`
**Existing `route-MT2.png`:** from 2026-06-11 18:42 (very recent, ~4 min
before this task — likely from a manual run earlier; we'll overwrite with
a fresh capture).
**Note on prior repo-issue.md (2026-06-08):** The older doc-creation
task is "In Progress" with all doc work done but never formally closed
by John. Leaving it untouched for now — will ask John about it at
end-of-task review.
