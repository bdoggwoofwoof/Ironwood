# Ironwood source

The `main` branch is the published web app. This `source` branch holds what builds it.

- `source.html` — the Claude artifact version of the app as of Oct 9 (version 8), the base everything is built from.
- `meals.js` — the Meals tab (meal prep, recipes, scaling, shopping list), added by features.py.
- `run.js` — running and conditioning (Oct 21): exercises logged by time, distance and splits; Train → Run (paces, profile, 8-week targets and plan from the 100 m, mile and 3 mile, next to the lifting days); cross-training swaps; six conditioning programs with timers; running PRs and stats. Added by features.py step 13. `test_run.py` covers the pace math and plan logic.
- `improve.js` — Oct 21 review improvements (features.py step 14): progression with a weight jump per exercise, smaller jumps after a miss and a ~10% drop after three misses; last time's sets; older holds converted to seconds; an IndexedDB copy of the data; weekly goal from the program; repeat / save a past workout; body measurements; workout picture. `test_review.py` covers them.
- `care.js` — Joint care programs (features.py step 15): seven two-day strength and mobility programs for common aches, with a pain rule and signs to see a doctor or physical therapist; no therapy or treatment claims. `test_care.py` covers them.
- `together.js` — Programs together (features.py step 16): a main program plus others alongside (joint care, conditioning, any plan) and the running plan on Train; an add-on's day can be added to the main workout or done on its own. `test_together.py` covers it.
- `fight.js` — Fight training (features.py step 19, Oct 25): Train → Fight with a coach that calls combos out loud over timed rounds (boxing, kickboxing, Muay Thai, MMA, or solo BJJ movements), a combo library with favorites and one-combo drills, 36 drills and session ideas, and six fight programs in Routines; coach sessions save to History with rounds or fill a program workout. `test_fight.py` covers it.
- `features.py` — applies the Oct 10 changes (Ironwood name, photos backup, fuller restore) → `app.html`.
- `build.py` — turns `app.html` into the installable offline web app in `dist/`.
- `package.sh` — runs both, refreshes the zip and the `site/` repo, pushes to GitHub.
- `test_pwa.py`, `test_backup.py`, `test_update.py` and the other `test_*.py` — browser tests (Playwright). `shots.py` — App Store screenshots. (`test_logic.py` covers unit switch, idle workouts, History paging, renamed exercises)
- `native/` — Capacitor iOS project. On a Mac: `npm install`, then `./sync.sh`, then open `ios/App/App.xcodeproj`.

Setup on a new machine: `./setup.sh`, then `python3 features.py && python3 build.py`.
