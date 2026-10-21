"""Running and conditioning: pace math, the 8-week plan, timed and distance logging, running PRs, swaps, programs and the Run screen."""
import asyncio, json, math, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8772
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
MILE = 1609.34
def ctx(t100, t1, t3):
    P3 = t3 / 3; pred3 = t1 * 3 ** 1.06; E = t3 / pred3; T2 = t1 * 2 ** 1.06
    return dict(E=E, focus='endurance' if E > 1.04 else 'speed' if E < 0.98 else 'balanced', easyLo=P3 * 1.22, easyHi=P3 * 1.32, T=P3 * 1.045,
                I=(T2 / 2 + P3 * 0.96) / 2, R=t1, stride=t100 / 0.8, s150=t100 * 1.48 / 0.9, s200=t100 * 2.06 / 0.9)
CASES = [(14.5, 465, 1560), (13.0, 400, 1230), (16.0, 540, 1700)]   # endurance-limited, speed-limited, balanced
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        # ---- pace math ----
        for t100, t1, t3 in CASES:
            got = await ev("t => runCtx(t)", {'t100': t100, 't1': t1, 't3': t3}); exp = ctx(t100, t1, t3)
            check(f'paces for {t100}/{t1}/{t3}', all(abs(got[k] - exp[k]) < 1e-6 for k in exp if k != 'focus') and got['focus'] == exp['focus'], got['focus'])
        check('focus covers all three profiles', [ctx(*c)['focus'] for c in CASES] == ['endurance', 'speed', 'balanced'])
        txt = await ev("(() => { const c = runCtx({ t100: 14.5, t1: 465, t3: 1560 }); return [easyR(c), paceTxt(c.T), rfmt(splitAt(c.R, 200)), rfmt(c.stride)]; })()")
        check('page numbers for 14.5 / 7:45 / 26:00', txt == ['10:34–11:26 /mi', '9:03 /mi', '57.8 s', '18.1 s'], txt)
        tg = await ev("(() => { const c = runCtx({ t100: 14.5, t1: 465, t3: 1560 }); return runTargets(c); })()")
        g = [0.015, 0.045, 0.075]   # endurance profile
        check('8-week targets: fast end 1.4×, slow end 0.6× the goal', abs(tg['t1']['fast'] - 465 * (1 - g[1] * 1.4)) < 1e-6 and abs(tg['t3']['slow'] - 1560 * (1 - g[2] * 0.6)) < 1e-6 and tg['t100']['fast'] < tg['t100']['slow'] < 14.5)
        chk = await ev("[runCheck({ t100: 14.5, t1: 465, t3: 1560 }), runCheck({ t100: 5, t1: 465, t3: 1300 }), runCheck({ t100: 14, t1: 600, t3: 1500 })]")
        check('time checks', chk[0] == {} and 't100' in chk[1] and 't3' in chk[1] and 't3' in chk[2], chk)
        check('clock and distance parsing', await ev("[parseClock('1:52'), parseClock('14.5'), parseClock('25', true), parseClock('1:02:30'), Math.round(parseDist('1 mi')), parseDist('400m'), parseDist('1.5 km'), fmtDist(1609.34), fmtDist(400)]") == [112, 14.5, 1500, 3750, 1609, 400, 1500, '1 mi', '400 m'])
        # ---- plan logic ----
        plan = await ev("""(() => { const out = {}; for (const [n, t] of [['end', { t100: 14.5, t1: 465, t3: 1560 }], ['spd', { t100: 13, t1: 400, t3: 1230 }], ['bal', { t100: 16, t1: 540, t3: 1700 }]]) { const c = runCtx(t);
          out[n] = { three: [1,2,3,4,5,6,7,8].map(w => weekSessions(w, c, 3).map(x => x.key + x.dow + ':' + x.s.t)), two: [1,2,3,4,5,6,7,8].map(w => weekSessions(w, c, 2).map(x => x.key + x.dow + ':' + x.s.t)) }; } return out; })()""")
        check('3 runs: A Tue, C Thu, B Fri every week', all(w[0].startswith('A2') and w[1].startswith('C4') and w[2].startswith('B5') for w in plan['end']['three']))
        check('week 4 is lighter with the mile check', plan['end']['three'][3] == ['A2:Light', 'C4:Easy', 'B5:Mile check'])
        check('week 8 is the three tests', plan['end']['three'][7] == ['A2:100 m test', 'C4:3 mile test', 'B5:Mile test'])
        first = lambda n: ''.join(w[0].split(':')[1][0] for i, w in enumerate(plan[n]['two']) if i not in (3, 7))
        check('2 runs: hard run follows the profile', first('end') == 'TSITST' and first('spd') == 'STSSIS' and first('bal') == 'STSTST', [first(k) for k in ('end', 'spd', 'bal')])
        check('2 runs, week 8: 100 m test Monday before lifting, mile Tue, 3 miles Sun', plan['bal']['two'][7] == ['T1:Before lifting', '12:Mile test', '20:3 mile test'], plan['bal']['two'][7])
        check('endurance profile adds 5 min to easy runs', await ev("[sessC(1, runCtx({ t100: 14.5, t1: 465, t3: 1560 })).items[0].d, sessC(1, runCtx({ t100: 16, t1: 540, t3: 1700 })).items[0].d]") == ['30 min', '25 min'])
        check('speed profile adds an acceleration', await ev("[sessA(1, runCtx({ t100: 13, t1: 400, t3: 1230 })).items[0].log.sets, sessA(1, runCtx({ t100: 16, t1: 540, t3: 1700 })).items[0].log.sets]") == [5, 4])
        dates = await ev("(() => { const R = { start: '2026-10-26' }; return [ymd(sessDate(R, 1, 2)), ymd(sessDate(R, 1, 0)), ymd(sessDate(R, 8, 5)), runWeekOf(R, parseYmd('2026-10-25')), runWeekOf(R, parseYmd('2026-11-02')), runWeekOf(R, parseYmd('2026-12-21'))]; })()")
        check('session dates and plan weeks', dates == ['2026-10-27', '2026-11-01', '2026-12-18', 0, 2, 9], dates)
        lc = await ev("(() => { const R = normRun({}); return [legsClash(R, 4, 'sprint'), legsClash(R, 3, 'interval'), legsClash(R, 2, 'sprint'), legsClash(R, 4, '')]; })()")
        check('warns when a hard run lands the day after Legs', lc == ['after', 'same', None, None], lc)
        sw = await ev("""(() => { const c = runCtx({ t100: 16, t1: 540, t3: 1700 }); const e = sessC(2, c), th = sessB(1, c), vo = sessB(3, c), sp = sessA(1, c), te = sessB(8, c);
          return [swapPlan(e, 'bike').txt, swapPlan(e, 'rower').txt, swapPlan(e, 'swim').txt, swapPlan(e, 'incline').txt, swapPlan(th, 'incline').ok, swapPlan(th, 'bike').items.length, swapPlan(vo, 'rower').txt, swapPlan(sp, 'bike').txt, swapPlan(sp, 'swim').ok, swapPlan(te, 'bike').ok]; })()""")
        check('cross-training conversions', sw == ['40–45 min, easy', '30 min, easy', '25 min, steady', '40 min, 8–12% grade', False, 1, '5 × 500 m hard, same rest', '8 × 10 s all-out, 1 min easy between', False, False], sw)
        st = await ev("""[measStatus({ judge: 'split', d: 200, t: 57.8 }, { t: 59.5, d: 200 }).st, measStatus({ judge: 'split', d: 200, t: 57.8 }, { t: 60.1, d: 200 }).st, measStatus({ judge: 'split', d: 200, t: 57.8 }, { t: 55.5, d: 200 }).st,
          measStatus({ judge: 'easy', dur: 1800, lo: 634, hi: 686 }, { t: 1500 }).st, measStatus({ judge: 'goal', goal: 465, tol: 16 }, { t: 470 }).st, measStatus({ judge: 'dur', dur: 60 }, { t: 45 }).st]""")
        check('on target within 2 s per 200 m', st == ['on', 'slow', 'fast', 'short', 'on', 'short'], st)
        check('session on target at 75% of checked sets', await ev("""[sessionStatus([{ ex: 'b-strides', target: { judge: 'split', d: 100, t: 18 }, sets: [{ t: 18 }, { t: 18.5 }, { t: 17 }, { t: 22 }] }]), sessionStatus([{ ex: 'b-strides', target: { judge: 'split', d: 100, t: 18 }, sets: [{ t: 18 }, { t: 21 }, { t: 22 }, { t: 22 }] }])]""") == ['on', 'off'])
        # ---- conditioning programs ----
        progs = await ev("BUILTIN_ROUTINES.filter(r => r.info).map(r => [r.name, r.days.length, r.days.filter(d => d.timer).length, r.info.strengths.length > 0 && !!r.info.result && r.info.watch.length > 0])")
        check('six conditioning programs with strengths, results and watch-outs', len(progs) == 6 and all(p[3] for p in progs) and sum(p[2] for p in progs) >= 6, progs)
        allText = await ev("JSON.stringify(BUILTIN_ROUTINES.filter(r => r.info)) + JSON.stringify(COND_FIT) + document.documentElement.innerHTML.replace(/p-tabata/g, '')")
        check('no brand or program names', not any(w.lower() in allText.lower() for w in ['Hyrox', 'CrossFit', 'Murph', 'Tabata']))
        check('kinds: planks timed, runs distance, carries carry, push-ups still reps', await ev("[exKind('b-plank'), exKind('b-run-400m'), exKind(findIn(BUILTIN_EX)(\"Farmer's Carry\").id), exKind(findIn(BUILTIN_EX)('Push-Ups').id), guessKind('Treadmill Run'), guessKind('Barbell Row'), guessKind('Side Plank Hold')]") == ['timed', 'distance', 'carry', 'bodyweight', 'distance', 'barbell', 'timed'])
        # ---- Run screen: set up, plan, start Run A, log, finish ----
        await pg.locator('.topsw button', has_text='Run').click(); await pg.wait_for_timeout(300)
        check('Run starts with the times form', await pg.locator('#run-setup').count() == 1 and await pg.locator('#run-save').is_disabled())
        await pg.fill('#rt-t100', '16'); await pg.fill('#rt-t1', '9:00'); await pg.fill('#rt-t3', '28:20'); await pg.click('#runs-3')
        await ev("lsSet('x', 1)"); await pg.fill('#run-start', await ev("ymd(addDays(new Date(), -1))")); await pg.click('#run-save'); await pg.wait_for_timeout(400)
        check('plan shows lifting days and runs', await pg.locator('.rg-lift').count() >= 4 and await pg.locator('.rg-run').count() == 3)
        body = await pg.locator('#run-screen').inner_text()
        check('labelled as estimates, not advice', 'not medical or coaching advice' in body)
        await pg.click('#run-tab-paces'); await pg.wait_for_timeout(200)
        check('paces tab', 'Speed and endurance are even' in await pg.locator('#run-focus').inner_text() and await pg.locator('#run-targets .kpi').count() == 3)
        await pg.click('#run-tab-programs'); await pg.wait_for_timeout(200)
        check('programs tab lists six', await pg.locator('.cond-card').count() == 6)
        await pg.click('#run-tab-plan'); await pg.wait_for_timeout(200)
        await pg.click('#start-A'); await pg.wait_for_timeout(500)
        check('workout carries the run targets', await pg.locator('.run-banner').count() == 1 and 'in ' in await pg.locator('.slot .meta').nth(1).inner_text())
        ids = await ev("S.active.items[1].sets.map(s => s.id)")
        for i in range(len(ids)):
            await pg.fill('#t-' + ids[i], '20'); await pg.locator('#t-' + ids[i]).press('Enter'); await pg.wait_for_timeout(120)
        check('strides logged with time and distance', await ev("S.active.items[1].sets.every(s => isDone(s) && +s.t === 20 && +s.d === 100 && s.st === 'on')"))
        await ev("finishWorkout()"); await pg.wait_for_timeout(600)
        s = await ev("(() => { const s = sessionList().slice(-1)[0]; return { run: s.run, sets: s.items.map(i => i.sets.length), t: s.items[0].sets[0].t, d: s.items[0].sets[0].d }; })()")
        check('saved with the plan session and status', s['run']['id'] == '1-1-A' and s['run']['status'] == 'on' and s['t'] == 20 and s['d'] == 100, s)
        check('summary shows the run status', await pg.locator('#run-sum').count() == 1)
        await pg.locator('.sheet button', has_text='Done').click(); await pg.wait_for_timeout(300)
        check('session card marked on target', 'On target' in await pg.locator('#mark-A').inner_text())
        # swap and mark
        await pg.click('#swap-B'); await pg.wait_for_timeout(200); await pg.click('#sw-bike'); await pg.wait_for_timeout(200)
        check('swap shown on the card', 'Swapped for bike' in await pg.locator('#rs-B').inner_text())
        await pg.click('#mark-A'); await pg.wait_for_timeout(200); await pg.click('#mk-off'); await pg.wait_for_timeout(200)
        check('you can override the check', 'Off target' in await pg.locator('#mark-A').inner_text())
        # week 4 mile check: only more than 5 s faster updates the mile
        async def mile(w, key, t):
            await ev("([w, k]) => startRunSession(w, k, true)", [w, key]); await pg.wait_for_timeout(200)
            await ev("t => { const it = S.active.items.find(i => i.target.test); const s = it.sets[0]; s.t = t; s.d = s.gd; completeMeasured(it, s); finishWorkout(); }", t); await pg.wait_for_timeout(500)
            await ev("closeSheet()"); await pg.wait_for_timeout(100)
            return await ev("runSt().t1")
        check('week 4 check 3 s faster keeps the mile', await mile(4, 'B', 537) == 540)
        check('week 4 check 10 s faster updates the mile', await mile(4, 'B', 530) == 530)
        check('week 8 test updates the time', await mile(8, 'B', 545) == 545)
        hist = await ev("runSt().hist.map(h => h.why)")
        check('times history records the tests', hist == ['start', 'wk4', 'wk8'], hist)
        # PRs and stats
        prs = await ev("sessionList().slice(-1)[0].prs.map(p => p.type)")
        check('mile PR only when faster than every earlier mile', prs == [], prs)
        await ev("([w, k]) => startRunSession(w, k, true)", [8, 'B']); await pg.wait_for_timeout(200)
        await ev("(() => { const it = S.active.items.find(i => i.target.test); const s = it.sets[0]; s.t = 520; s.d = s.gd; completeMeasured(it, s); finishWorkout(); })()"); await pg.wait_for_timeout(500); await ev("closeSheet()")
        check('fastest mile PR', 'mile' in await ev("sessionList().slice(-1)[0].prs.map(p => p.type)"))
        await pg.locator('.tabs button', has_text='Stats').click(); await pg.wait_for_timeout(300)
        await pg.locator('.seg button', has_text='Overall').click(); await pg.wait_for_timeout(300)
        rs = await pg.locator('#run-stats').inner_text()
        check('Stats → Running: best times, chart, minutes', '8:40' in rs and await pg.locator('#run-stats .run-svg circle').count() >= 3 and 'minutes a week' in rs.lower(), rs[:120])
        await pg.locator('.seg button', has_text='Exercises').click(); await pg.wait_for_timeout(300)
        check('Stats → Exercises lists running and timed', await pg.locator('#meas-rows .lift-row').count() >= 2)
        # a timed plank in a normal workout
        await ev("startWorkout(null, null); S.active.items.push(makeSlot({ ex: 'b-plank', sets: 2, tg: { dur: 45, judge: 'dur' } })); touch()"); await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(300)
        pid = await ev("S.active.items[0].sets[0].id")
        await pg.fill('#t-' + pid, '0:50'); await pg.locator('#t-' + pid).press('Enter'); await pg.wait_for_timeout(200)
        check('plank logs a time', await ev("+S.active.items[0].sets[0].t === 50 && isDone(S.active.items[0].sets[0])"))
        await ev("finishWorkout()"); await pg.wait_for_timeout(400); await ev("closeSheet()")
        # backup carries it
        bk = await ev("JSON.parse(JSON.stringify({ meta: S.meta, sessions: S.sessions }))")
        check('backup carries the plan and timed sets', bk['meta']['run']['t1'] == 520 and any(st.get('t') == 50 for s in bk['sessions'].values() for it in s['items'] for st in it['sets']))
        net = await ev("performance.getEntriesByType('resource').map(e => e.name).filter(u => !u.startsWith(location.origin))")
        check('nothing leaves the phone', net == [], net[:3])
        await pg.screenshot(path='shot-run.png', full_page=True)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
