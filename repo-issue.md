# Task: Add AGENTS.md and docs/ for macau-bus-snapshot

**Created:** 2026-06-08 10:25  
**Status:** In Progress  
**Model:** minimax/MiniMax-M2.7-highspeed  
**Related Issue:** —

---

## 1. Work Brief

Per the github-repo-dev skill, the new repo `macau-bus-snapshot` only had a
README + script + sample screenshots. Add the standard agent-facing
documentation so future agents (or John) can pick the repo up without
re-discovering everything:

- `AGENTS.md` — short AI agent guide (purpose, structure, key concepts,
  troubleshooting)
- `docs/` — split the longer-form knowledge out of the README
  - `docs/architecture.md` — why a headless browser, page structure, token mechanism
  - `docs/known-issues.md` — what can go wrong
  - `docs/changelog.md` — release notes

Keep things proportional: this is a ~120-line script, not a full web app.

---

## 2. TODO List

- [x] Verify gh auth + create repo (done in previous turn)
- [x] Write initial README + script (done in previous turn)
- [ ] Create `AGENTS.md` ⚠️ (in this turn)
- [ ] Create `docs/architecture.md` ⚠️ (in this turn)
- [ ] Create `docs/known-issues.md` ⚠️ (in this turn)
- [ ] Create `docs/changelog.md` ⚠️ (in this turn)
- [ ] Review README for consistency with new docs
- [ ] Commit + push
- [ ] ⚠️ **Ask user to confirm completion before deleting this file**

---

## 3. Information

**Repo:** `john-fb-agent/macau-bus-snapshot`  
**Branch:** `main`  
**Existing files:** `README.md`, `snapshot.js`, `route-52.png`, `route-MT2.png`

**Conventions seen in sibling repos** (`govmo-news`, `macao-government-it-procurement`):
- `repo-agent.md` or `AGENTS.md` at root (mixed CN/EN OK; English is fine for this small repo)
- `docs/` with topic-split markdown files
- AGENTS.md has a "Last Updated / Last Review" line in the header
- Commits end with the model attribution line per skill rule
