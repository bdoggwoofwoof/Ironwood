"""Research-backed aids (Nov 22): reps left on the last set and calibration, next-weight suggestions that use them,
sets by muscle from logged workouts, busy week, warm-up line, swaps that favor long-muscle-length exercises."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8932
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SEED = """((spec) => { const now = Date.now(), d = 864e5; S.sessions = {};
  spec.forEach(([ago, ex, w, reps, extra], i) => { const id = 'h' + i; S.sessions[id] = { id, name: 'W', startedAt: now - ago * d, endedAt: now - ago * d + 3e6, prs: [],
    items: [{ ex, group: '', u: 'lb', sets: reps.map((r, k) => Object.assign({ w, r }, k === reps.length - 1 ? (extra || {}) : {})) }] }; });
  S.ver++; S.rerender(); })"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        # ---- reps left row and saving ----
        await ev("setProgram('bi-sapwood'); startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0])"); await pg.wait_for_timeout(300)
        await ev("const it = S.active.items[0]; it.sets.slice(0, 3).forEach(s => { s.w = '100'; s.r = '8'; completeSet(it, s); }); S.rest = null; S.rerender()"); await pg.wait_for_timeout(200)
        check('no reps-left question before the last set is done', await pg.locator('#rir-' + await ev("S.active.items[0].id")).count() == 0)
        await ev("const it = S.active.items[0]; const s = it.sets[3]; s.w = '100'; s.r = '9'; completeSet(it, s); S.rest = null; S.rerender()"); await pg.wait_for_timeout(200)
        rid = await ev("S.active.items[0].id")
        check('after the last set: Reps left 0 1 2 3 4+', await pg.locator('#rir-' + rid + ' button').count() == 5)
        await pg.locator('#rir-' + rid + ' button', has_text='3').click(); await pg.wait_for_timeout(100)
        check('a tap records it on the set', await ev("S.active.items[0].sets[3].rir") == 3)
        calib = await ev("S.active.items.filter(it => it.target.calib).map(it => exName(it.ex))")
        check('first workout picks one machine or cable lift for a calibration set, never a main lift', len(calib) == 1 and calib[0] not in ('Decline Chest Press', 'Incline Reverse-Grip Squeeze Press'), calib)
        ci = await ev("S.active.items.findIndex(it => it.target.calib)")
        cid = await ev(f"S.active.items[{ci}].id"); top = await ev(f"repTop(S.active.items[{ci}].target.reps)")
        check('the calibration set asks for a guess before the set', await pg.locator('#rir-cal-' + cid + ' button').count() == 5)
        await pg.locator('#rir-cal-' + cid + ' button', has_text='1').click()
        await ev(f"(() => {{ const it = S.active.items[{ci}]; it.sets.forEach((s, k) => {{ s.w = '50'; s.r = String(k === it.sets.length - 1 ? {top} + 4 : 12); completeSet(it, s); }}); S.rest = null; S.rerender(); }})()"); await pg.wait_for_timeout(200)
        res = await pg.inner_text('#rir-cal-res-' + cid)
        check('after it: guess vs what you had (1 vs 4)', 'guessed 1' in res and 'had 4' in res, res)
        await ev("finishWorkout(); closeSheet()"); await pg.wait_for_timeout(400)
        saved = await ev("(() => { const s = sessionList().slice(-1)[0]; return [s.items[0].sets[3].ri, s.items.flatMap(i => i.sets).filter(x => x.g != null).map(x => [x.g, x.gt])]; })()")
        check('saved with the workout: reps left and the calibration', saved[0] == 3 and saved[1] == [[1, top]], saved)
        check('calibration bias is +3 (guessed low), and readings are adjusted by it', await ev("Math.round(rirBias())") == 3 and await ev("adjRir(1)") == 4)
        check('no second calibration within 4 weeks', await ev("(() => { startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[1]); const n = S.active.items.filter(it => it.target.calib).length; S.active = null; return n; })()") == 0)
        # ---- next weight uses reps left ----
        await ev(SEED + "([[3, 'b-leg-extension', 100, [15, 15, 15], { ri: 3 }]])")
        await ev("S.active = null; S.rest = null; S.meta.exJump = {}"); 
        jump = await ev("(() => { const it = makeSlot({ ex: 'b-leg-extension', sets: 3, reps: '12-15' }); refill(it); return [it.prog && it.prog.mode, it.prog && it.prog.msg, it.sets[0].gw]; })()")
        check('top of the range with 3+ to spare: a double jump', jump[0] == 'bump' and 'to spare' in jump[1] and float(jump[2]) > 105, jump)
        await ev(SEED + "([[3, 'b-leg-extension', 100, [13, 12, 12], { ri: 0 }]])")
        await ev("S.meta.exRest = S.meta.exRest; rirCalibrations = () => []")
        hold = await ev("(() => { const it = makeSlot({ ex: 'b-leg-extension', sets: 3, reps: '12-15' }); refill(it); return it.prog; })()")
        check('short of the top with nothing to spare: same weight, beat last time by a rep (Nov 24)', hold and hold['mode'] == 'beat', hold)
        await ev(SEED + "([[3, 'b-leg-extension', 100, [12, 12, 12], { ri: 4 }]])")
        push = await ev("(() => { const it = makeSlot({ ex: 'b-leg-extension', sets: 3, reps: '12-15' }); refill(it); return [it.prog && it.prog.mode, it.sets[0].gw, it.sets[0].gr]; })()")
        check('in range but 3+ to spare: same weight, aim for the top', push[0] == 'push' and float(push[1]) == 100 and push[2] == '15', push)
        # ---- sets by muscle ----
        lw = await ev("Math.round((Date.now() - (+startOfWeek(new Date()) - 3 * 864e5)) / 864e5 * 100) / 100")
        await ev(SEED + f"([[0, 'b-bench-press', 100, [8, 8, 8]], [{lw}, 'b-leg-extension', 100, [12, 12]]])")
        await ev("UI.setTab('stats'); lsSet('statsTab', 'numbers'); S.rerender()"); await pg.wait_for_timeout(400)
        mw = await ev("(() => { const w0 = +startOfWeek(new Date()); return [loggedMuscleSets(w0, w0 + 7 * 864e5), loggedMuscleSets(w0 - 7 * 864e5, w0)]; })()")
        check('logged sets per muscle: bench is 3 chest and 1.5 triceps', mw[0].get('chest') == 3 and mw[0].get('triceps') == 1.5, mw[0])
        txt = await pg.inner_text('#muscle-week')
        check('Progress → Numbers shows this week, last week and the plan', 'This week' in txt and 'Last week' in txt and 'Plan' in txt)
        check('flags muscles that fell short of the plan last week', await pg.locator('#muscle-short').count() == 1 and 'Chest' in await pg.inner_text('#muscle-short'))
        # ---- busy week ----
        await ev("UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#busy-start'); await pg.wait_for_timeout(200); await pg.locator('.sheet button', has_text='Start busy week').click(); await pg.wait_for_timeout(300)
        check('busy week turns on and says so on Train', await pg.locator('#busy-on').count() == 1)
        bw = await ev("(() => { startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0]); const r = S.active.items.map(it => it.sets.length + ':' + it.sets.some(s => (s.drops || []).length)); S.active = null; return r; })()")
        check('busy week: a third of the sets (4 → 2, 3 → 1), no drop sets', bw == ['2:false', '1:false', '1:false', '1:false', '1:false', '1:false'], bw)
        await ev("commit(st => { st.meta.settings.busyWk = ymd(addDays(startOfWeek(new Date()), -7)); }, 'meta')"); await pg.wait_for_timeout(200)
        check('it ends by itself the next week', not await ev("isBusy()") and await pg.locator('#busy-start').count() == 1)
        # ---- warm-up ----
        await ev(SEED + "([[3, 'b-back-squat', 225, [8, 8, 8]]])")
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[3])"); await pg.wait_for_timeout(300)
        wl = await ev("warmupLine(S.active.items[0])")
        check('warm-up before the first big lift, ramping under the working weight', 'Warm up first' in wl and '× 10' in wl and '× 3' in wl and await ev("warmupLine(S.active.items[1])") == '', wl)
        await ev("commit(st => { st.meta.settings.warmups = false; }, 'meta')")
        check('the warm-up line can be turned off', await ev("warmupLine(S.active.items[0])") == '')
        await ev("commit(st => { st.active = null; st.meta.settings.warmups = true; }, 'active')"); await pg.wait_for_timeout(200)
        # ---- swaps ----
        sw = await ev("swapCandidates('b-tricep-pushdowns').slice(0, 6).map(c => c.ex.name + '|' + c.why)")
        check('swaps: an overhead (stretched) triceps exercise is offered with that reason', any('stretched' in x for x in sw), sw)
        # ---- Finish offers Discard (Nov 22) ----
        await ev("S.active = null; startWorkout(null, null)"); await pg.wait_for_timeout(300)
        await ev("openSheet({ type: 'finish' })"); await pg.wait_for_timeout(200)
        check('Finish on an empty workout offers Discard', await pg.locator('#finish-discard').count() == 1)
        await pg.click('#finish-discard'); await pg.wait_for_timeout(400)
        check('Discard ends it without saving', await ev("S.active") is None)
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0]); const it = S.active.items[0]; it.sets[0].w = '100'; it.sets[0].r = '8'; completeSet(it, it.sets[0]); S.rest = null; openSheet({ type: 'finish' })"); await pg.wait_for_timeout(300)
        n0 = await ev("Object.keys(S.sessions).length")
        await pg.click('#finish-discard'); await pg.wait_for_timeout(300)
        sh = await pg.inner_text('.sheet') if await pg.locator('.sheet').count() else ''
        check('with logged sets, Discard asks first', await ev("!!S.active") and 'DISCARD THIS WORKOUT' in sh.upper(), (await ev("!!S.active"), sh[:200]))
        await pg.locator('.sheet button', has_text='Discard').last.click(); await pg.wait_for_timeout(400)
        check('confirmed: discarded, nothing saved', await ev("S.active") is None and await ev("Object.keys(S.sessions).length") == n0)
        # ---- protein ----
        await ev("""mealCommit(m => { m.me = { h: 180, w: 80, age: 30, sex: 'm', act: 2, goal: 'gain' }; m.goals = { kcal: 2800, p: 140 };
          const now = Date.now(); m.log[ymd(new Date())] = [{ id: 'a', at: now - 6 * 36e5, k: 'food', name: 'Eggs', m: { kcal: 300, p: 20 } }, { id: 'b', at: now - 6 * 36e5 + 6e5, k: 'food', name: 'Yogurt', m: { kcal: 150, p: 15 } }, { id: 'c', at: now - 2 * 36e5, k: 'food', name: 'Chicken', m: { kcal: 400, p: 40 } }]; })""")
        await ev("UI.setTab('meals'); lsSet('mealsMode', 'log'); MEALS.mode = 'log'; S.rerender()"); await pg.wait_for_timeout(400)
        ps = await ev("(() => { const e = document.getElementById('prot-spread'); return e ? e.textContent : ''; })()")
        check('Log: protein per meal (0.4 g/kg = 30 g) with meals grouped by time', 'about 30 g' in ps and '35 g, 40 g' in ps and '2 of 2' in ps, ps)
        await ev(SEED + "([[0, 'b-bench-press', 100, [8, 8, 8]]])")
        await ev("openSheet({ type: 'summary', id: 'h0' })"); await pg.wait_for_timeout(300)
        wp = await pg.inner_text('#wo-protein')
        check('workout summary: protein today and a nudge', '75 of 140 g' in wp and 'next few hours' in wp, wp)
        await ev("closeSheet()")
        # ---- is the plan working ----
        await ev("""(() => { const now = Date.now(), d = 864e5, w0 = +startOfWeek(new Date()); S.sessions = {}; let i = 0;
          for (let wk = 1; wk <= 6; wk++) for (const day of [0, 2]) { const t = w0 - wk * 7 * d + day * d + 36e5; const w = 100 + (6 - wk) * 5;
            S.sessions['p' + i] = { id: 'p' + i, name: 'W', startedAt: t, endedAt: t + 3e6, prs: [], items: [{ ex: 'b-bench-press', u: 'lb', sets: [{ w, r: 8 }, { w, r: 8 }, { w, r: 8 }, { w, r: 8 }, { w, r: 8 }, { w, r: 8 }] }, { ex: 'b-leg-extension', u: 'lb', sets: [{ w: 80, r: 12 }] }] }; i++; }
          S.meta.meas = [{ id: 'm1', d: ymd(new Date(w0 - 40 * d)), k: 'chest', v: 40, u: 'in' }, { id: 'm2', d: ymd(new Date(w0 - 3 * d)), k: 'chest', v: 41, u: 'in' }];
          setProgram('bi-sapwood'); S.ver++; UI.setTab('stats'); lsSet('statsTab', 'numbers'); S.rerender(); })()"""); await pg.wait_for_timeout(400)
        pw = await pg.inner_text('#plan-working')
        check('Is the plan working: chest has sets, lifts up and chest tape up, and says on track', 'Chest' in pw and '12 of 13 sets a week' in pw and 'lifts +' in pw and 'chest +1 in' in pw and 'On track' in pw, pw[:400])
        check('a priority muscle with too few sets says so first', 'Fewer sets than planned' in pw)
        check('no page errors', not errs, errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
