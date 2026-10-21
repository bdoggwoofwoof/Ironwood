# Ironwood source

The `main` branch is the published web app. This `source` branch holds what builds it.

- `source.html` — the Claude artifact version of the app as of Oct 9 (version 8), the base everything is built from.
- `meals.js` — the Meals tab (meal prep, recipes, scaling, shopping list), added by features.py.
- `run.js` — running and conditioning (Oct 21): exercises logged by time, distance and splits; Train → Run (paces, profile, 8-week targets and plan from the 100 m, mile and 3 mile, next to the lifting days); cross-training swaps; six conditioning programs with timers; running PRs and stats. Added by features.py step 13. `test_run.py` covers the pace math and plan logic.
- `features.py` — applies the Oct 10 changes (Ironwood name, photos backup, fuller restore) → `app.html`.
- `build.py` — turns `app.html` into the installable offline web app in `dist/`.
- `package.sh` — runs both, refreshes the zip and the `site/` repo, pushes to GitHub.
- `test_pwa.py`, `test_backup.py`, `test_update.py` and the other `test_*.py` — browser tests (Playwright). `shots.py` — App Store screenshots. (`test_logic.py` covers unit switch, idle workouts, History paging, renamed exercises)
- `native/` — Capacitor iOS project. On a Mac: `npm install`, then `./sync.sh`, then open `ios/App/App.xcodeproj`.

Setup on a new machine: `./setup.sh`, then `python3 features.py && python3 build.py`.
