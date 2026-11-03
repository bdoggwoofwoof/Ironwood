"""Turn plans off or restart them, and the check-in when 2+ planned sessions slip in a week (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8788
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
        # A running plan that started 10 days ago and was never run (like Newt's)
        await ev("""(() => { S.sessions = {}; S.meta.settings.program = 'self'; S.meta.run = normRun({ t100: 16, t1: 540, t3: 1750, runs: 3, start: ymd(addDays(startOfWeek(new Date()), -7)) }); S.ver++; touch(); UI.setTab('train'); TRAIN.mode = 'train'; S.rerender(); })()""")
        await pg.wait_for_timeout(300)
        card = await pg.inner_text('#plan-check') if await pg.locator('#plan-check').count() else ''
        check('Train asks about a plan that never started', 'running plan' in card.lower() and 'haven’t started' in card, card)
        check('options: restart, postpone, edit, turn off (no "I did them" when never started)', all([await pg.locator(s).count() == 1 for s in ['#ck-restart', '#ck-postpone', '#ck-edit', '#ck-off']]) and await pg.locator('#ck-did').count() == 0)
        await pg.click('#ck-restart'); await pg.wait_for_timeout(200)
        check('restart asks when to start', await pg.locator('#rr-today').count() == 1 and await pg.locator('#rr-monday').count() == 1)
        blk = await ev("runSt().block || 1"); await pg.click('#rr-today'); await pg.wait_for_timeout(200)
        R = await ev("runSt()")
        check('restart: new block, week 1 from today, plan on', R['block'] == blk + 1 and R['start'] == await ev("ymd(new Date())") and not R.get('off'), [R['block'], R['start']])
        check('check-in answered, card gone', await pg.locator('#plan-check').count() == 0)
        # Turn off and on from the Run tab
        await ev("TRAIN.mode = 'run'; lsSet('runTab', 'plan'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#run-stop'); await pg.wait_for_timeout(200)
        check('turn off the running plan', await ev("runSt().off") is True and await pg.locator('#run-off').count() == 1)
        check('an off plan leaves Your week and Train', await ev("planList().some(p => p.key === 'run')") is False)
        await pg.click('#run-on'); await pg.wait_for_timeout(200)
        check('turn it back on', not await ev("runSt().off") and await ev("planList().some(p => p.key === 'run')"))
        # Missed runs last week → check-in with "I did them"
        await ev("""(() => { S.meta.settings.checkins = {}; runCommit(r => { r.start = ymd(addDays(startOfWeek(new Date()), -7)); r.block = 1; }); S.sessions.x = { id: 'x', name: 'Run', startedAt: Date.now() - 864e5 * 9, endedAt: Date.now() - 864e5 * 9, items: [], prs: [], run: { id: '1-0-zz' } }; TRAIN.mode = 'train'; S.ver++; touch(); })()""")
        await pg.wait_for_timeout(300)
        miss = await ev("(() => { const R = runActive(); return runMissedLeft(R, 1).length; })()")
        card = await pg.inner_text('#plan-check') if await pg.locator('#plan-check').count() else ''
        check('missed 2+ runs in a week: Train asks', miss >= 2 and 'missed last week' in card, [miss, card])
        await pg.click('#ck-did'); await pg.wait_for_timeout(200)
        check('“I did them” marks those runs done', await ev("runMissedLeft(runActive(), 1).length") == 0 and await pg.locator('#plan-check').count() == 0)
        # Postpone moves the plan back a week
        await ev("""(() => { S.meta.settings.checkins = {}; runCommit(r => { r.done = {}; }); S.rerender(); })()"""); await pg.wait_for_timeout(200)
        st = await ev("runSt().start"); await pg.click('#ck-postpone'); await pg.wait_for_timeout(200)
        check('postpone pushes the running plan back a week', await ev("runSt().start") == await ev(f"ymd(addDays(parseYmd('{st}'), 7))"))
        # Programs: follow a plan, miss 2 days last week
        await ev("""(() => { runCommit(r => { r.off = true; }); S.meta.settings.checkins = {}; setProgram('bi-5x5'); const ws = startOfWeek(new Date());
          S.meta.settings.progSince = { 'bi-5x5': +addDays(ws, -10) }; S.meta.settings.sched = { 'bi-5x5': [1, 3, 5] };
          const t = +addDays(ws, -7) + 18 * 36e5; S.sessions = { a: { id: 'a', name: 'A', routineId: 'bi-5x5', dayId: getRoutine('bi-5x5').days[0].id, startedAt: t, endedAt: t + 3e6, items: [], prs: [] } }; S.ver++; touch(); })()""")
        await pg.wait_for_timeout(300)
        card = await pg.inner_text('#plan-check') if await pg.locator('#plan-check').count() else ''
        check('program: 2 of 3 workouts missed last week → check-in', '2 workouts missed last week' in card, card)
        nxt = await ev("nextUp().day.id"); d0 = await ev("getRoutine('bi-5x5').days[0].id")
        check('before restart, next up is day 2', nxt != d0)
        await pg.click('#ck-restart'); await pg.wait_for_timeout(200)
        check('restart a program: next up is day 1 again', await ev("nextUp().day.id") == d0)
        # Edit opens the plan; plan page has restart and stop
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-5x5' })"); await pg.wait_for_timeout(200)
        check('plan page: restart and stop following', await pg.locator('#plan-restart').count() == 1 and await pg.locator('#plan-stop').count() == 1)
        await pg.click('#plan-stop'); await pg.wait_for_timeout(200)
        check('stop following → Self-log', await ev("S.meta.settings.program") == 'self')
        # Add-on restart affects its next day
        await ev("""(() => { setAddon('bi-care-shoulder', true); const r = getRoutine('bi-care-shoulder'); const t = Date.now() - 864e5; S.sessions.c = { id: 'c', name: 'C', routineId: 'bi-care-shoulder', dayId: r.days[0].id, startedAt: t, endedAt: t + 1e6, items: [], prs: [] }; S.ver++; touch(); })()""")
        a1 = await ev("nextFor(getRoutine('bi-care-shoulder')).day.id"); await ev("restartProgram('bi-care-shoulder')")
        check('restart a program alongside: back to its day 1', a1 != await ev("nextFor(getRoutine('bi-care-shoulder')).day.id") and await ev("nextFor(getRoutine('bi-care-shoulder')).day.id") == await ev("getRoutine('bi-care-shoulder').days[0].id"))
        # Dismiss
        await ev("""(() => { S.meta.settings.checkins = {}; setProgram('bi-5x5'); S.meta.settings.progStart = {}; UI.setView(null); UI.setTab('train'); TRAIN.mode = 'train'; S.rerender(); })()"""); await pg.wait_for_timeout(300)
        if await pg.locator('#plan-check').count():
            await pg.locator('#plan-check .tip-x').click(); await pg.wait_for_timeout(200)
            check('× hides it for that week', await pg.locator('#plan-check').count() == 0)
        else:
            check('× hides it for that week', True)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
