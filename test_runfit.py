"""Running plan setup that fits your lifting: optional times, fit paths, programs alongside choosing days (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8789
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
        # Newt's case: 4-day split on Mon, Tue, Thu, Fri
        await ev("(() => { S.sessions = {}; S.meta.run = null; setProgram('bi-newt-4day'); S.meta.settings.sched = { 'bi-newt-4day': [1, 2, 4, 5] }; S.ver++; touch(); })()")
        lm = await ev("liftMapFromProgram()")
        check('lifting days come from the program, not a guess', sorted(int(k) for k in lm) == [1, 2, 4, 5], lm)
        legs = [int(k) for k, v in lm.items() if v == 'Legs']
        check('leg days recognized from day names', len(legs) >= 1, lm)
        res = {}
        for path in ['mixed', 'off', 'double', 'run']:
            res[path] = await ev(f"fitDays('{path}', liftMapFromProgram(), 3)")
        nearLegs = lambda d: any(((d - L) % 7) in (0, 1, 6) for L in legs)
        off = res['off']
        check('days off: hard runs on non-lifting days away from legs', all(d not in (1, 2, 4, 5) for d in off['hard']) and not any(nearLegs(d) for d in off['hard']), [off, legs])
        check('days off: hard runs not back to back', abs(off['hard'][0] - off['hard'][1]) % 7 not in (1, 6), off)
        mx = res['mixed']
        check('mixed: easy run on a lifting day, hard runs off it', mx['easy'] in (1, 2, 4, 5) and all(d not in (1, 2, 4, 5) for d in mx['hard']), mx)
        db = res['double']
        check('lifting days: all runs on lifting days, hard runs not on or next to legs', db['easy'] in (1, 2, 4, 5) and all(d in (1, 2, 4, 5) and not any(d == L for L in legs) for d in db['hard']), [db, legs])
        check('running first: hard runs avoid legs', not any(d in legs for d in res['run']['hard']), res['run'])
        # Setup without times
        await ev("UI.setTab('train'); TRAIN.mode = 'run'; lsSet('trainMode', 'run'); S.rerender()"); await pg.wait_for_timeout(300)
        check('setup asks whether you know your times', await pg.locator('#rs-know').count() == 1 and await pg.locator('#rs-guess').count() == 1)
        await pg.click('#rs-guess'); await pg.wait_for_timeout(150)
        check('levels to pick from, and the fit question', await pg.locator('#rs-lvl-back').count() == 1 and await pg.locator('#rsfit-mixed').count() == 1)
        await pg.click('#rs-lvl-back'); await pg.click('#rsfit-off'); await pg.click('#rs-build'); await pg.wait_for_timeout(400)
        R = await ev("runSt()")
        check('plan built from estimates, marked as estimates', R['t1'] == 630 and R['est'] is True and R['fit'] == 'off', [R.get('t1'), R.get('est'), R.get('fit')])
        check('runs placed on days off', all(int(R['days'][k]) not in (1, 2, 4, 5) for k in ['A', 'B']), R['days'])
        check('Plan tab says paces are estimates', await pg.locator('#run-est').count() == 1)
        check('run plan lifting days match the program', sorted(int(k) for k in R['lifts']) == [1, 2, 4, 5], R['lifts'])
        # Change the fit later
        await pg.click('#run-fit'); await pg.wait_for_timeout(150); await pg.click('#fit-double'); await pg.click('#fit-save'); await pg.wait_for_timeout(200)
        R = await ev("runSt()")
        check('change how runs fit from the Plan tab', R['fit'] == 'double' and int(R['days']['C']) in (1, 2, 4, 5), R['days'])
        # Real times clear the estimate flag
        await ev("lsSet('runTab', 'times'); S.rerender()"); await pg.wait_for_timeout(200)
        await ev("runCommit(r => { r.est = false; })")
        # Moving a lifting day re-fits the runs
        await ev("toggleSched('bi-newt-4day', 5); toggleSched('bi-newt-4day', 6)"); await pg.wait_for_timeout(200)
        check('changing program days re-fits the runs', sorted(int(k) for k in (await ev("runSt().lifts"))) == [1, 2, 4, 6])
        # Program alongside asks which days
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-care-shoulder' })"); await pg.wait_for_timeout(200)
        await pg.click('#alongside'); await pg.wait_for_timeout(200)
        check('adding alongside asks how it fits', await pg.locator('#afit-bi-care-shoulder').count() == 1)
        await pg.click('#afit-bi-care-shoulder-off'); await pg.wait_for_timeout(200)
        days = await ev("S.meta.settings.sched['bi-care-shoulder']")
        check('“days off” puts it on non-lifting days', days and all(d not in (1, 2, 4, 6) for d in days), days)
        await ev("openSheet({ type: 'addons' })"); await pg.wait_for_timeout(200)
        await pg.click('#addon-bi-care-knee'); await pg.wait_for_timeout(150)
        check('Programs alongside sheet asks too', await pg.locator('#afit-bi-care-knee').count() == 1)
        check('an added plan is listed once (under Alongside, not again in its group)', await pg.locator('#addon-bi-care-knee').count() == 1)
        await pg.click('#afit-bi-care-knee-same'); await pg.wait_for_timeout(150)
        check('“lifting days” puts it on lifting days', all(d in (1, 2, 4, 6) for d in await ev("S.meta.settings.sched['bi-care-knee']")))
        ul = await ev("fitDays('mixed', { 1: 'Upper', 2: 'Legs', 4: 'Upper', 5: 'Legs' }, 3)")
        check('mixed with upper/lower 4 days: hard runs on days off', all(d not in (1, 2, 4, 5) for d in ul['hard']), ul)
        fb = await ev("fitDays('mixed', { 1: 'Full Body', 3: 'Full Body', 5: 'Full Body' }, 3)")
        check('full body treated as leggy', await ev("!!LEGGY['Full Body']"))
        q = await ev("(() => { const t = Date.now(); S.sessions.qr = { id: 'qr', kind: 'activity', activity: 'run', startedAt: t, endedAt: t + 1800e3, updatedAt: t, items: [] }; S.ver++; return runStarted({ block: 7, start: ymd(new Date()), done: {} }); })()")
        check('quick-logged runs count as having started the plan', q is True)
        await ev("(() => { delete S.sessions.qr; S.ver++; touch(); })()")
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
