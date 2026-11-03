"""Nov 2 fix list, earlier bugs: superset at the top, activity Undo, backups carry display settings, restore fills in
what a used phone lacks, lift goal checks, back gesture closes sheets, fight rounds survive a reload, nearly-full
storage warning, no tour mid-workout, run finish wording."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8794
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        # superset moved to the top
        await ev("(() => { const r = getRoutine('bi-5x5'); startWorkout(r, r.days[0]); S.active.items[1].ss = true; S.rerender(); })()"); await pg.wait_for_timeout(200)
        await ev("openSheet({ type: 'slot', it: S.active.items[1] })"); await pg.wait_for_timeout(150)
        await pg.locator('.sheet button', has_text='Move up').click(); await pg.wait_for_timeout(150)
        check('a superset moved to the top is no longer "with above"', await ev("S.active.items[0].ss") is False)
        # no tour mid-workout
        await ev("startTour()"); await pg.wait_for_timeout(150)
        check('the tour waits until the workout is over', await ev("!S.tour"))
        await ev("commit(st => { st.active = null; }, 'active')"); await pg.wait_for_timeout(150)
        # activity delete has Undo
        await ev("(() => { const t = Date.now() - 3600e3; S.sessions.act1 = { id: 'act1', kind: 'activity', activity: 'run', startedAt: t, endedAt: t + 1800e3, updatedAt: t, items: [], dur: 30 }; S.ver++; touch(); openSheet({ type: 'session', id: 'act1' }); })()"); await pg.wait_for_timeout(200)
        await pg.locator('.sheet button', has_text='Delete').last.click(); await pg.wait_for_timeout(100)
        await pg.locator('.sheet button', has_text='Delete activity').click(); await pg.wait_for_timeout(200)
        gone = await ev("!S.sessions.act1"); await ev("S.toast.fn()"); await pg.wait_for_timeout(150)
        check('deleting an activity offers Undo, and Undo brings it back', gone and await ev("!!S.sessions.act1"))
        # backups carry display settings
        await ev("setDisp('theme', 'dark'); setDisp('size', '115')")
        bk = await ev("JSON.parse(backupJSON()).display")
        check('backup includes theme and text size', bk.get('theme') == 'dark' and bk.get('size') == '115', bk)
        await ev("restoreDisplay({ theme: 'light', size: '130' })"); await pg.wait_for_timeout(100)
        check('a fresh restore takes them back', await ev("DISP.theme === 'light' && DISP.size === '130' && localStorage.getItem('liftbook.size') === '130'"))
        await ev("setDisp('size', '100'); setDisp('theme', 'system')")
        # restore onto a phone in use fills in what it lacks
        r = await ev("""(() => { const st = { meta: clone(S.meta), sessions: { x: { id: 'x', startedAt: 1, endedAt: 2, items: [] } } }; st.meta.routines = st.meta.routines || {}; st.meta.routines.keep = { id: 'keep', name: 'k', days: [] };
          delete st.meta.run; delete st.meta.settings.plan; st.meta.meals = normMeals({});
          const d = { app: 'liftbook', meta: { settings: { plan: { goal: 'mass', days: 4 } }, run: { t1: 500, runs: 3 }, meals: { recipes: { mine1: { id: 'mine1', name: 'Mine', cat: 'main', serves: 2, ing: [{ n: 'rice', q: 1, u: 'cup' }] } }, habits: { meals: 3, prep: 'once' } } }, sessions: {} };
          restoreInto(st, d); return { plan: st.meta.settings.plan && st.meta.settings.plan.goal, run: !!st.meta.run, recipe: !!st.meta.meals.recipes.mine1, habits: st.meta.meals.habits && st.meta.meals.habits.prep, unit: st.meta.settings.unit }; })()""")
        check('restoring onto a used phone adds plan answers, running plan, recipes and habits', r['plan'] == 'mass' and r['run'] and r['recipe'] and r['habits'] == 'once', r)
        # lift goals
        await ev("(() => { const t = Date.now() - 86400e3; S.sessions.g1 = { id: 'g1', startedAt: t, endedAt: t + 3600e3, updatedAt: t, items: [{ ex: 'b-squat', u: 'lb', sets: [{ w: 200, r: 5 }] }] }; S.ver++; touch(); openSheet({ type: 'liftGoal' }); })()"); await pg.wait_for_timeout(200)
        await pg.fill('#lg-t', '9999'); await pg.wait_for_timeout(80)
        check('a 9,999 lb goal is questioned', 'world record' in (await pg.locator('#lg-why').text_content() or '') and await pg.locator('#lg-save').is_disabled())
        await pg.fill('#lg-t', '150'); await pg.wait_for_timeout(80)
        check('a target already beaten is questioned', 'already' in (await pg.locator('#lg-why').text_content() or ''))
        await pg.fill('#lg-t', '300'); await pg.fill('#lg-by', '2001-01-01'); await pg.wait_for_timeout(80)
        check('a past date is refused', 'after today' in (await pg.locator('#lg-why').text_content() or ''))
        await ev("closeSheet()")
        # back gesture closes a sheet and stays in the app
        await ev("openSheet({ type: 'restore' })"); await pg.wait_for_timeout(150)
        await pg.go_back(); await pg.wait_for_timeout(250)
        check('back closes the sheet and stays in the app', await pg.locator('.sheet').count() == 0 and pg.url.startswith(URL))
        # nearly full storage says so
        await ev("storeOver()"); await pg.wait_for_timeout(100)
        check('nearly full storage warns instead of "Saved on this phone"', await ev("S.sync") == 'over' and 'almost full' in await ev("SYNC_TEXT[S.sync]"))
        # run finish wording and no "0 lb moved"
        await ev("(() => { const r = getRoutine('bi-5x5'); startWorkout(r, r.days[0]); S.active.run = { id: '1-1-A', key: 'A' }; openSheet({ type: 'finish' }); })()"); await pg.wait_for_timeout(150)
        txt = await pg.locator('.sheet').inner_text()
        check('finishing a run with nothing logged says what to do, not "sets without reps"', 'without reps' not in txt, txt[:120])
        await ev("closeSheet(); commit(st => { st.active = null; }, 'active')")
        # fight rounds survive a reload
        await ev("fightGo({ rounds: 3, round: 60, rest: 30, voice: false })"); await pg.wait_for_timeout(400)
        await ev("fightEnd()"); check('End stops the clock', await ev("!FR.iv && !fRunning()"))
        await ev("fightStop(); fightGo({ rounds: 3, round: 60, rest: 30, voice: false })"); await pg.wait_for_timeout(400)
        await pg.reload(); await pg.wait_for_timeout(1800)
        check('rounds are still there after a reload (paused)', await ev("!!(FR.T && FR.T.pausedAt && !FR.T.ended)"))
        await ev("fightStop()")
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
