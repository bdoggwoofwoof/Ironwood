# Ironwood source

The `main` branch is the published web app. This `source` branch holds what builds it.

- `index.src.html` — the page. It pulls in `styles.css` (all styles), `boot.js` (data and helpers loaded first) and `core.js` (the app), and `core.js` pulls in each feature module below with `/*@include name.js*/`. Edit these files directly.
- `assemble.py` — expands the includes and makes CSS font sizes follow the iPhone's text size → `app.html`.
- `FEATURE-HISTORY.md` — the notes from the 45 patch steps that built the app until Nov 10, 2026 (features.py and source.html are in git history).
- `meals.js` — the Meals tab (meal prep, recipes, scaling, shopping list), a feature module.
- `run.js` — running and conditioning (Oct 21): exercises logged by time, distance and splits; Train → Run (paces, profile, 8-week targets and plan from the 100 m, mile and 3 mile, next to the lifting days); cross-training swaps; six conditioning programs with timers; running PRs and stats.  `test_run.py` covers the pace math and plan logic.
- `improve.js` — Oct 21 review improvements : progression with a weight jump per exercise, smaller jumps after a miss and a ~10% drop after three misses; last time's sets; older holds converted to seconds; an IndexedDB copy of the data; weekly goal from the program; repeat / save a past workout; body measurements; workout picture. `test_review.py` covers them.
- `care.js` — Joint care programs : seven two-day strength and mobility programs for common aches, with a pain rule and signs to see a doctor or physical therapist; no therapy or treatment claims. `test_care.py` covers them.
- `together.js` — Programs together : a main program plus others alongside (joint care, conditioning, any plan) and the running plan on Train; an add-on's day can be added to the main workout or done on its own. `test_together.py` covers it.
- `fight.js` — Fight training (Oct 25): Train → Fight with a coach that calls combos out loud over timed rounds (boxing, kickboxing, Muay Thai, MMA, or solo BJJ movements), a combo library with favorites and one-combo drills, 36 drills and session ideas, and six fight programs in Routines; coach sessions save to History with rounds or fill a program workout. `test_fight.py` covers it.
- `build.py` — turns `app.html` into the installable offline web app in `dist/`.
- `package.sh` — runs assemble.py and build.py, refreshes the zip and the `site/` repo, pushes to GitHub.
- `test_pwa.py`, `test_backup.py`, `test_update.py` and the other `test_*.py` — browser tests (Playwright). `shots.py` — App Store screenshots. (`test_logic.py` covers unit switch, idle workouts, History paging, renamed exercises)
- `native/` — Capacitor iOS project. On a Mac: `npm install`, then `./sync.sh`, then open `ios/App/App.xcodeproj`.

Setup on a new machine: `./setup.sh`, then `python3 assemble.py && python3 build.py`.
