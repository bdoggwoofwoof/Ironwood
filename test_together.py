"""Programs together: a main program plus others alongside (joint care, conditioning, any plan) and the running plan, all on
Train; an add-on's day can be added to the main workout or done on its own, and each add-on moves on to its next day."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8776
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev("setProgram('bi-5x5')"); await pg.wait_for_timeout(200)
        check('Train offers to add programs alongside', await pg.locator('#add-alongside').count() == 1)
        # add from a program page
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.click('#care-back'); await pg.wait_for_timeout(200)
        await pg.click('#alongside'); await pg.wait_for_timeout(200)
        check('program page adds it alongside', await ev("addonIds()") == ['bi-care-back'] and 'Alongside' in await pg.locator('#alongside').inner_text())
        # add from the sheet on Train
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(200)
        await pg.click('#edit-addons'); await pg.click('#addon-bi-cond-aerobic'); await ev("closeSheet()"); await pg.wait_for_timeout(200)
        check('both show on Train with the main program', await pg.locator('#also-bi-care-back').count() == 1 and await pg.locator('#also-bi-cond-aerobic').count() == 1 and await pg.locator('.next-card').count() == 1)
        # add to the main workout
        await pg.click('#also-add-bi-care-back'); await pg.wait_for_timeout(400)
        a = await ev("({ n: S.active.items.length, names: S.active.items.map(i => exName(i.ex)), addons: S.active.addons, rid: S.active.routineId })")
        check('Add to Workout A: main day plus joint care day', a['n'] == 7 and a['names'][:3] == ['Squat', 'Bench Press', 'Bent-Over Barbell Rows'] and a['names'][3] == 'Modified Curl-Up' and a['rid'] == 'bi-5x5', a)
        check('workout offers the other add-on', await pg.locator('#wo-add-bi-cond-aerobic').count() == 1 and await pg.locator('#wo-add-bi-care-back').count() == 0)
        await pg.click('#wo-add-bi-cond-aerobic'); await pg.wait_for_timeout(300)
        check('conditioning day added mid-workout', await ev("S.active.addons.length") == 2 and await ev("S.active.items.length") == 8)
        await ev("S.active.items.forEach(it => it.sets.forEach(s => { if (isMeasured(exKind(it.ex))) { s.t = 30; s.c = Date.now(); } else { s.w = '100'; s.r = '5'; s.c = Date.now(); } })); finishWorkout(); closeSheet();"); await pg.wait_for_timeout(500)
        s = await ev("sessionList().slice(-1)[0]")
        check('saved workout records the add-on days', [x['id'] for x in s.get('addons', [])] == ['bi-care-back', 'bi-cond-aerobic'], s.get('addons'))
        check('main program moves to Workout B', await ev("nextUp().day.name") == 'Workout B')
        check('joint care moves to day B', (await ev("nextFor(getRoutine('bi-care-back')).day.name")).startswith('B:'))
        check('marked done today', 'Done today' in await pg.locator('#also-bi-care-back').inner_text())
        # on its own
        await pg.click('#also-start-bi-cond-aerobic'); await pg.wait_for_timeout(300)
        check('start an add-on on its own', await ev("S.active.routineId") == 'bi-cond-aerobic')
        await ev("commit(st => { st.active = null; }, 'active')")
        # running plan shows when a run is due today
        await ev("runCommit(r => { Object.assign(r, { t100: 16, t1: 540, t3: 1700, runs: 3, weeks: 8, start: ymd(startOfWeek(new Date())) }); r.days = { A: new Date().getDay() }; })"); await pg.wait_for_timeout(200)
        await pg.locator('.tabs button', has_text='Train').click(); await pg.locator('.topsw button', has_text='Train').click(); await pg.wait_for_timeout(200)
        check("today's run shows on Train", await pg.locator('#also-run').count() == 1 and 'Run A' in await pg.locator('#also-run').inner_text())
        await pg.click('#also-run-start'); await pg.wait_for_timeout(300)
        check('start the run from Train', await ev("!!(S.active && S.active.run && S.active.run.key === 'A')"))
        await ev("commit(st => { st.active = null; }, 'active')")
        # remove
        await ev("setAddon('bi-cond-aerobic', false)"); await pg.wait_for_timeout(200)
        check('removing an add-on', await pg.locator('#also-bi-cond-aerobic').count() == 0 and await ev("addonIds()") == ['bi-care-back'])
        check('add-ons are in the backup', 'bi-care-back' in await ev("JSON.parse(backupJSON()).meta.settings.addons.join(',')"))
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
