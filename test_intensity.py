"""Rep focus and intensity plans (Nov 16, Newt): set any plan to Strength or Size rep ranges; built-in drop set and
to-failure plans, with drops ready on the last set when a workout starts."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8841
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-ul4' })"); await pg.wait_for_timeout(300)
        check('a plan page has Rep focus: As written, Strength, Size', await pg.locator('#focus-row .seg button').count() == 3)
        await pg.click('#focus-strength'); await pg.wait_for_timeout(200)
        reps = await ev("focusDay(getRoutine('bi-ul4'), getRoutine('bi-ul4').days[0]).items.map(i => [exName(i.ex), i.reps])")
        check('Strength: main lifts 3-5, the rest 6-8', all((r == '3-5') == bool(__import__('re').search(r'press|row|pulldown|squat|deadlift', n.lower()) and not __import__('re').search(r'raise|curl|fly|pushdown|extension', n.lower())) for n, r in reps), reps)
        check('the plan page shows the new ranges', '3–5' in await pg.inner_text('.r-items') or '3-5' in await pg.inner_text('.r-items'))
        await ev("startWorkout(getRoutine('bi-ul4'), getRoutine('bi-ul4').days[0])"); await pg.wait_for_timeout(300)
        check('a workout starts with them', await ev("S.active.items[0].target.reps") == '3-5', await ev("S.active.items.map(i => i.target.reps)"))
        check('the plan itself is unchanged', await ev("getRoutine('bi-ul4').days[0].items.some(i => i.reps !== '3-5' && isMainLift(i.ex))"))
        await ev("commit(st => { st.active = null; }, 'active'); UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-ul4' })"); await pg.wait_for_timeout(300)
        await pg.click('#focus-size'); await pg.wait_for_timeout(200)
        check('Size: main lifts 6-10, the rest 10-15', set(r for _, r in await ev("focusDay(getRoutine('bi-ul4'), getRoutine('bi-ul4').days[0]).items.map(i => [exName(i.ex), i.reps])")) <= {'6-10', '10-15'})
        await pg.click('#focus-none'); await pg.wait_for_timeout(200)
        check('As written goes back', not await ev("planFocus('bi-ul4')"))
        # Intensity plans
        info = await ev("['bi-drop4', 'bi-failure3', 'bi-pump-finisher'].map(id => { const r = getRoutine(id); return r && [r.days.length, r.days.flatMap(d => d.items).filter(i => i.dl).length, r.days.flatMap(d => d.items).every(i => getEx(i.ex).name !== 'Unknown exercise')]; })")
        check('Drop Set Hypertrophy 4-Day, Failure Focus 3-Day and a drop set finisher', info[0] and info[0][0] == 4 and info[1][0] == 3 and info[2][0] == 1, info)
        check('...with drop sets marked and real exercises', info[0][1] >= 10 and all(x[2] for x in info), info)
        check('failure plan says to failure on its sets', await ev("getRoutine('bi-failure3').days.every(d => d.items.every(i => /failure/i.test(i.note)))"))
        await ev("UI.setView({ type: 'routine', id: 'bi-drop4' })"); await pg.wait_for_timeout(300)
        check('the plan page shows the drops', 'last set + 2 drops' in await pg.inner_text('.r-items'))
        await ev("startWorkout(getRoutine('bi-drop4'), getRoutine('bi-drop4').days[0])"); await pg.wait_for_timeout(300)
        d = await ev("S.active.items.map(i => (i.sets[i.sets.length - 1].drops || []).length)")
        check('starting it sets up the drops on the last sets', d[1] == 2 and d[0] == 0 and d[3] == 1, d)
        check('drop rows show in the workout', await pg.locator('.drop-row').count() >= 8)
        await ev("commit(st => { st.active = null; }, 'active')")
        await ev("UI.setTab('routines'); UI.setView(null); setPlanFilter('lift'); S.rerender()"); await pg.wait_for_timeout(300)
        t = (await pg.inner_text('main')).lower()
        check('listed in Plans → Lifting', 'drop set hypertrophy' in t and 'failure focus' in t)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
