"""Oct 21 review improvements: progression (jump per exercise, smaller jump after a miss, drop after three misses,
target reps, last time's sets), older holds logged as reps, the IndexedDB copy, weekly goal from the program,
repeat / save a workout, measurements, workout picture, and the running plan adapting (missed runs, easy week,
push back, goal race, quick-logged runs)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8774
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SEED = """(spec) => { const now = Date.now(), d = 864e5; S.sessions = {};
  spec.forEach(([ago, ex, w, reps], i) => { const id = 'h' + i; S.sessions[id] = { id, name: 'W', routineId: 'bi-5x5', dayId: 'bi-5x5-d1', startedAt: now - ago * d, endedAt: now - ago * d + 3e6, items: [{ ex, group: '', u: 'lb', sets: reps.map(r => ({ w, r })) }], prs: [] }; });
  S.ver++; touch(); }"""
PLAN = "(([ex, sets, reps]) => { const it = makeSlot({ ex, sets, reps }); return { gw: it.sets.map(s => s.gw), gr: it.sets.map(s => s.gr), prog: it.prog && it.prog.mode, msg: it.prog && it.prog.msg, last: lastLine(it) }; })"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True); pg = await ctx.new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        async def plan(seed, ex='b-squat', sets=5, reps='5'):
            await ev(SEED, seed); return await ev(PLAN, [ex, sets, reps])
        # ---- progression ----
        r = await plan([[6, 'b-squat', 135, [5, 5, 5, 5, 5]]])
        check('hit every rep: +5 lb (main jump)', r['prog'] == 'bump' and r['gw'][0] == '140' and r['gr'] == ['5'] * 5, r)
        await ev("commit(st => { st.meta.exJump = { 'b-squat': { v: 10, u: 'lb' } }; }, 'meta')")
        r = await plan([[6, 'b-squat', 135, [5, 5, 5, 5, 5]]])
        check('jump per exercise: +10', r['gw'][0] == '145' and '+10 lb' in r['msg'], r['msg'])
        r = await plan([[6, 'b-squat', 135, [5, 5, 5, 5, 5]], [4, 'b-squat', 145, [5, 5, 4, 3, 3]]])
        check('missed after a 10 lb jump: suggests +5 instead', r['prog'] == 'step' and r['gw'][0] == '140' and r['gr'] == ['5'] * 5, r)
        check('last time shown with each set', r['last'] == '145 × 5, 5, 4, 3, 3 lb', r['last'])
        r = await plan([[8, 'b-squat', 135, [5] * 5], [6, 'b-squat', 145, [5, 5, 4, 3, 3]], [4, 'b-squat', 140, [5, 5, 5, 4, 4]]])
        check('a miss after a smaller step: stays (no step below the smallest jump)', r['prog'] is None and r['gw'][0] == '140', r)
        await ev("commit(st => { st.meta.settings.fine = 2.5; }, 'meta')")
        r = await plan([[6, 'b-squat', 140, [5] * 5], [4, 'b-squat', 145, [5, 5, 4, 3, 3]]])
        check('with 2.5 lb available: 5 → 2.5', r['prog'] == 'step' and r['gw'][0] == '142.5', r)
        check('plate readout uses 1.25 lb plates', await ev("plates(142.5, 'lb')") == 'Per side: 45 · 2.5 · 1.25', await ev("plates(142.5, 'lb')"))
        await ev("commit(st => { delete st.meta.settings.fine; st.meta.settings.stepDown = false; }, 'meta')")
        r = await plan([[6, 'b-squat', 135, [5] * 5], [4, 'b-squat', 145, [5, 5, 4, 3, 3]]])
        check('smaller jump can be turned off', r['prog'] is None and r['gw'][0] == '145')
        await ev("commit(st => { delete st.meta.settings.stepDown; }, 'meta')")
        r = await plan([[8, 'b-squat', 200, [5, 5, 4, 3, 3]], [6, 'b-squat', 200, [5, 4, 4, 3, 3]], [4, 'b-squat', 200, [5, 5, 3, 3, 2]]])
        check('three misses at one weight: about 10% less', r['prog'] == 'deload' and r['gw'][0] == '180' and r['gr'] == ['5'] * 5, r)
        r = await plan([[4, 'b-deadlift', 225, [5]]], 'b-deadlift', 1, '5')
        check('barbell deadlift jumps twice the main jump', r['gw'][0] == '235', r)
        r = await plan([[4, 'b-bench-press', 135, [8, 7, 6]]], 'b-bench-press', 3, '6-8')
        check('rep range: aims at last time within the range', r['prog'] is None and r['gr'] == ['8', '7', '6'], r)
        r = await plan([[4, 'b-bench-press', 135, [8, 8, 8]]], 'b-bench-press', 3, '6-8')
        check('rep range topped: weight up, reps back to the bottom', r['prog'] == 'bump' and r['gw'][0] == '140' and r['gr'] == ['6'] * 3, r)
        # jump sheet in a workout
        await ev("commit(st => { st.meta.exJump = {}; }, 'meta')"); await ev(SEED, [[4, 'b-squat', 135, [5] * 5]])
        await ev("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(300)
        await pg.locator('.slot .icon-btn').first.click(); await pg.click('#opt-jump'); await pg.wait_for_timeout(200)
        check('jump presets stop at 20 lb', await pg.locator('.sheet .preset-grid .chip').all_inner_texts() == ['+2.5', '+5', '+10', '+15', '+20'])
        await pg.locator('.sheet .chip', has_text='+10').first.click(); await pg.wait_for_timeout(300)
        check('setting a jump during a workout updates the suggestion', await ev("S.active.items[0].sets[0].gw") == '145' and await ev("S.meta.exJump['b-squat'].v") == 10)
        await ev("commit(st => { st.meta.exJump = { 'b-squat': { v: 45, u: 'lb' } }; }, 'meta')")
        check('a bigger saved jump is capped at 20 lb', await ev("jumpFor('b-squat', 'lb')") == 20)
        await ev("commit(st => { st.active = null; st.meta.exJump = {}; }, 'active')")
        # ---- older holds logged as reps ----
        await ev("""(() => { const now = Date.now(); S.sessions = { old: { id: 'old', name: 'Core', startedAt: now - 5 * 864e5, endedAt: now - 5 * 864e5 + 2e6, prs: [], items: [{ ex: 'b-plank', u: 'lb', sets: [{ w: 0, r: 60 }] }, { ex: 'b-dead-hang', u: 'lb', sets: [{ w: 25, r: 40 }] }] } }; delete S.meta.settings.legacyTimed; S.ver++; touch(); })()""")
        check('old hold labels keep their reps', await ev("[measLabel({ w: 25, r: 40 }, 'timed', 'lb'), measLabel({ w: 0, r: 60 }, 'timed', 'lb')]") == ['25 lb × 40 reps', '60 reps'])
        await pg.locator('.tabs button', has_text='Train').click(); await pg.locator('.topsw button', has_text='Train').click(); await pg.wait_for_timeout(300)
        check('card offers to convert old holds', await pg.locator('#legacy-timed').count() == 1)
        await pg.click('#legacy-convert'); await pg.wait_for_timeout(300)
        check('converted to seconds, card gone', await ev("[S.sessions.old.items[0].sets[0].t, S.sessions.old.items[0].sets[0].r, S.sessions.old.items[1].sets[0].t]") == [60, 0, 40] and await pg.locator('#legacy-timed').count() == 0)
        check('converted holds count as hold times', await ev("measBest(S.sessions.old.items[1].sets, 'timed')") == '40.0 s · +25 lb')
        # ---- IndexedDB copy ----
        await ev("commit(st => { st.meta.settings.goal = 5; }, 'meta')"); await pg.wait_for_timeout(400)
        await ev("localStorage.removeItem('liftbook.v1')"); await pg.reload(); await pg.wait_for_timeout(1500)
        check('cleared localStorage: everything comes back from IndexedDB', await ev("S.meta.settings.goal") == 5 and await ev("!!S.sessions.old"))
        # ---- weekly goal from the program ----
        await ev("commit(st => { st.meta.settings.goal = 4; st.meta.settings.program = null; }, 'meta')")
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.locator('.topsw button', has_text='Plans').click(); await pg.wait_for_timeout(200)
        await pg.locator('.r-card', has_text='Full Body 5×5').click(); await pg.click('#follow'); await pg.wait_for_timeout(300)
        t = await pg.locator('.toast').inner_text()
        check('following a 3-day plan offers a goal of 3', '3 days a week' in t and 'Make it 3' in t, t)
        await pg.locator('.toast button').click(); await pg.wait_for_timeout(200)
        check('goal set to 3', await ev("S.meta.settings.goal") == 3)
        await ev("showToast({ kind: 'info', text: 'Following X' }); startWorkout(null, null)"); await pg.wait_for_timeout(200)
        check('starting a workout clears the info message', await pg.locator('.toast').count() == 0)
        await ev("commit(st => { st.active = null; }, 'active')")
        # ---- repeat / save a past workout, share picture ----
        await ev(SEED, [[2, 'b-squat', 135, [5, 5, 4]]])
        await ev("openSheet({ type: 'session', id: 'h0' })"); await pg.wait_for_timeout(200)
        await pg.click('#sess-again'); await pg.wait_for_timeout(300)
        check('do it again starts the same exercises', await ev("S.active && S.active.items.length === 1 && S.active.items[0].ex === 'b-squat' && S.active.items[0].sets.length === 3 && S.active.items[0].target.reps === '4-5'"))
        await ev("commit(st => { st.active = null; }, 'active')")
        await ev("openSheet({ type: 'session', id: 'h0' })"); await pg.wait_for_timeout(200)
        await pg.click('#sess-save-routine'); await pg.wait_for_timeout(300)
        check('save as routine', await ev("Object.values(S.meta.routines).some(r => r.days[0].items[0].ex === 'b-squat' && r.days[0].items[0].sets === 3)"))
        await ev("openSheet({ type: 'session', id: 'h0' })"); await pg.wait_for_timeout(200)
        async with pg.expect_download() as dl:
            await pg.click('#sess-share')
        d = await dl.value
        check('share picture makes a PNG', d.suggested_filename.endswith('.png'), d.suggested_filename)
        await ev("closeSheet()")
        # ---- measurements ----
        await pg.locator('.tabs button', has_text='Stats').click(); await pg.locator('.seg button', has_text='Overall').first.click(); await pg.wait_for_timeout(200)
        await pg.click('#log-meas'); await pg.fill('#ms-waist', '34'); await pg.fill('#ms-bf', '18'); await pg.click('#ms-save'); await pg.wait_for_timeout(300)
        mc = await pg.locator('#measure-card').inner_text()
        check('measurements saved and shown', '34 in' in mc and '18 %' in mc, mc.replace('\n', ' | '))
        bk = await ev("JSON.parse(backupJSON())")
        check('measurements are in the backup', len(bk['meta'].get('meas', [])) == 2)
        # ---- running plan adapts ----
        await ev("runCommit(r => { Object.assign(r, { t100: 16, t1: 540, t3: 1700, runs: 3, start: ymd(addDays(startOfWeek(new Date()), -7)), block: 1 }); r.hist = [{ d: ymd(new Date()), t100: 16, t1: 540, t3: 1700, why: 'start' }]; })")
        check('missed runs found', await ev("runMissed(runSt(), 1).length") == 3)
        start0 = await ev("runSt().start")
        await pg.locator('.tabs button', has_text='Train').click(); await pg.locator('.topsw button', has_text='Run').click(); await pg.wait_for_timeout(300)
        check('missed runs flagged on the plan', await pg.locator('#push-back').count() == 1)
        await pg.click('#easy-week'); await pg.wait_for_timeout(200)
        check('not feeling 100% turns the week easy', await ev("planWeek(runSt(), runWeekOf(runSt(), new Date())).every(x => x.s.easy && x.s.lite)"))
        await pg.click('#easy-week'); await pg.wait_for_timeout(200)
        await pg.click('#push-back'); await pg.wait_for_timeout(200)
        check('plan moves back a week', await ev("runSt().start") == await ev("s => ymd(addDays(parseYmd(s), 7))", start0) and await ev("runWeekOf(runSt(), new Date())") == 1)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(200)
        check('undo', await ev("runSt().start") == start0)
        # goal race
        g = await ev("(() => { runCommit(r => { r.goal = { d: 5000, t: 29 * 60 }; }); const R = runSt(); const c1 = ctxWeek(R, 1), c8 = ctxWeek(R, 8), G = goalInfo(R); return { t1w1: c1.t1, t1w8: c8.t1, aim1: G.aim1, reach: G.reach, h1: runGoal(c8).h1, base: R.t1 }; })()")
        check('goal paces step from current toward the goal', abs(g['t1w1'] - g['base']) < 1e-6 and g['t1w8'] < g['base'] and abs(g['t1w8'] - g['aim1']) < 1e-6 and abs(g['h1'] - g['aim1']) < 1e-6, g)
        g2 = await ev("(() => { runCommit(r => { r.goal = { d: 5000, t: 22 * 60 }; }); const R = runSt(); const G = goalInfo(R); const T = runTargets(runCtx(R)); return [G.reach, Math.abs(G.aim1 - T.t1.fast) < 1e-6]; })()")
        check('an out-of-reach goal is capped at the 8-week range', g2 == [False, True], g2)
        await ev("runCommit(r => { delete r.goal; })")
        # quick-logged run counts
        await ev("runCommit(r => { r.start = ymd(startOfWeek(new Date())); })")
        await ev("openSheet({ type: 'activity' })"); await pg.wait_for_timeout(200)
        await pg.fill('#ac-dur', '30'); await pg.fill('#ac-dist', '3'); await pg.locator('.sheet button', has_text='Save activity').click(); await pg.wait_for_timeout(300)
        t = await pg.locator('.toast').inner_text()
        due = await ev("!!planSessionFor(new Date())")
        if due:
            check('quick-logged run offers to count as the plan run', 'Count it' in t, t)
            await pg.locator('.toast button', has_text='Count it').click(); await pg.wait_for_timeout(300)
            check('plan session done', await ev("sessionList().filter(s => s.kind === 'activity' && s.run).length") == 1)
        else:
            check('no plan run due today: no offer', 'Count it' not in t, t)
        check('a 3-mile activity counts toward the 3-mile best', 1800 in await ev("stdPool('mile3')"))
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
