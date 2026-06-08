# AGENTS.md — AI Agent Guide

**Last Updated:** 2026-06-08 | **Author:** Coder (OpenClaw Agent)
**Last Review:** 2026-06-08

---

## 🤖 Purpose

This file is for AI agents working in this repository. For **development
workflows**, see the `github-repo-dev` skill instead of duplicating rules here.

---

## 📖 What Is This Repo?

**macau-bus-snapshot** is a short how-to + working script for pulling
**live bus positions** for any Macau bus route from the official
**DSAT (交通事務局) 巴士報站** system.

### Core Mission
Document the working technique (headless browser + Playwright) and ship a
~120-line Node script that just works on the OpenClaw coder host.

### Data Flow
```
DSAT bus page (HTML wrapper)
  └─ <iframe> macauweb SPA (React + SuperMap)
       └─ POST /macauweb/getRouteData.html  → stops + metadata
       └─ GET  /macauweb/routestation/bus   → live bus positions per stop
  ↓
snapshot.js drives a headless Chrome through the SPA, captures the API
responses, and prints a human-readable summary.
```

### Key URLs
- **Source page:** <https://www.dsat.gov.mo/bus/site/busstopwaiting.aspx?lang=tc>
- **Inner app:** <https://bis.dsat.gov.mo:37812/macauweb/>
- **API base (relative):** `/macauweb/` and `/ddbus/`
- **Map tiles:** <https://bis.dsat.gov.mo:8091/iserver/services/map-ugcv5-aomenC>

---

## 📂 Repository Structure

```
macau-bus-snapshot/
├── AGENTS.md           ← YOU ARE HERE (repo-specific info)
├── README.md           ← Human-facing overview + quick start
├── repo-issue.md       ← Task tracker (delete after each task)
├── snapshot.js         ← The working script (Node + Playwright)
├── route-52.png        ← Sample screenshot, route 52
├── route-MT2.png       ← Sample screenshot, route MT2
└── docs/
    ├── architecture.md ← Why headless browser, page structure, token mechanism
    ├── known-issues.md ← What can go wrong + workarounds
    └── changelog.md    ← Release notes
```

This is intentionally tiny. Do not add `src/`, `tests/`, `data/`, `deployment/`,
`ci/`, or any other directories unless explicitly asked.

---

## 🔑 Key Concepts

- **The page is a JS SPA inside an iframe.** A bare `curl` of the DSAT URL
  returns HTML with an empty `<body>` and an `<iframe>` tag. The actual app
  loads inside the iframe at `bis.dsat.gov.mo:37812`. You need a real
  browser to render anything useful.
- **The API is gated by a per-request HMAC `token` header.** It is computed
  by a webpack-bundled module from the query string + a time-based key.
  See `docs/architecture.md` for the rough reconstruction.
- **The prod bundle has a hardcoded dev secret** — `BypassToken: HuatuTesting0307`.
  This is interesting trivia; it does **not** let you skip the `token` header.
- **The site shows live positions, not ETAs.** To estimate "X minutes to
  stop Y" you have to combine bus speed with the stops/lines GeoJSON (which
  lives in the SuperMap tile service, not in this repo).

---

## 🛠️ How to Run

```bash
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node snapshot.js 52 MT2
```

Default (no args) = routes 52 and MT2. Pass any route labels you see on
the home grid (e.g. `3`, `11`, `26A`, `MT1`, `H1`).

Per-route cost: ~6 seconds (page load + click + wait). Don't hammer it —
DSAT is a government service. Once every 30–60s is plenty.

---

## 🧭 Task Workflow

Per the github-repo-dev skill:

1. **Read** `AGENTS.md` (this file) first.
2. **Read** `README.md` and `docs/architecture.md` for context.
3. **Create** `repo-issue.md` at the start of any new task.
4. **Make changes** surgically. Don't refactor what isn't broken.
5. **Update docs** (`docs/changelog.md` at minimum) when shipping.
6. **Commit** with the model attribution line.
7. **Ask the user** to confirm completion before deleting `repo-issue.md`.

---

## 🔍 Troubleshooting

```bash
# Verify Chrome is at the expected path
which google-chrome           # /usr/bin/google-chrome

# Verify Playwright is reachable via the expected NODE_PATH
ls /home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright

# Run a single-route test (fast feedback)
NODE_PATH=/home/js/.npm-global/lib/node_modules/@playwright/mcp/node_modules \
  node snapshot.js 3

# Inspect what the script sees
# Add to snapshot.js: console.log(captured) before browser.close()
```

If a route label is no longer on the home grid (DSAT occasionally
restructures routes), the script will print `NOT FOUND in DOM` and skip it.
The list of valid route labels is whatever appears on the home screen
when you open the URL in a real browser.

---

## ⏰ Cron / Automation

There is no cron in this repo. If you wire one up, document it in
`docs/changelog.md` and commit the change.
