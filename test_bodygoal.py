"""Body goal (Nov 16, Newt): like the scan station's Fitness & Weight Loss page. From the latest scan and weight: how much
to eat, what you burn, workouts a week, a goal date, tips, and warnings (missed workouts on a bulk, pace, protein)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8833
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SCAN = """commit(st => { st.meta.meas = [['bf', 18.4, '%'], ['leanm', 141.2, 'lb'], ['fatm', 33.3, 'lb'], ['bmr', 1925, 'cal/day']].map(([k, v, u], i) => ({ id: 'm' + i, d: ymd(new Date()), k, v, u }));
  st.meta.bw = [{ id: 'b1', d: ymd(new Date()), w: 181, u: 'lb' }]; st.meta.settings.goal = 4; }, 'meta')"""
# n sessions spread over the last 14 days, plus one 30 days ago (so there is history)
SESS = """(n => commit(st => { st.sessions = {}; const mk = (id, t) => { st.sessions[id] = { id, name: 'W', startedAt: t, endedAt: t + 3e6, items: [{ id: 'i' + id, ex: 'b-squat', sets: [{ w: 100, r: 5 }] }] }; };
  mk('old', Date.now() - 30 * 864e5); for (let i = 0; i < n; i++) mk('s' + i, Date.now() - (i * 13 / Math.max(1, n) + 0.5) * 864e5); }, 'sessions'))"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await pg.locator('.tabs button', has_text='Progress').click(); await pg.locator('.seg button', has_text='Numbers').first.click(); await pg.wait_for_timeout(300)
        check('Progress offers Set a body goal', await pg.locator('#bg-set').count() == 1)
        await ev(SCAN); await ev(SESS + "(8)"); await pg.wait_for_timeout(200)
        N = await ev("bodyNow()")
        check('uses the scan: BMR, body fat, lean mass, weight', N['bmr'] == 1925 and N['bmrSrc'] == 'your scan' and N['bf'] == 18.4 and round(N['leanLb'], 1) == 141.2 and N['wLb'] == 181, N)
        await pg.click('#bg-set'); await pg.wait_for_timeout(200)
        await pg.click('#bg-goal-bulk'); await pg.click('#bg-pace-steady'); await pg.fill('#bg-tw', '190'); await pg.wait_for_timeout(150)
        pv = await pg.inner_text('#bg-preview')
        R = await ev("bgCalc({ goal: 'bulk', pace: 'steady', twKg: 190 / 2.20462, days: 4 })")
        check('lean bulk, steady: a 250 cal surplus like the scan station', R['adj'] == 250 and R['kcal'] == R['tdee'] + 250, R)
        check('burn = BMR × activity for 4 workouts', R['tdee'] == round(1925 * 1.55 / 10) * 10, R['tdee'])
        check('macros add up to the calories (±40)', abs(R['p'] * 4 + R['c'] * 4 + R['f'] * 9 - R['kcal']) <= 40, R)
        check('protein about 0.9 g per lb', 155 <= R['p'] <= 170, R['p'])
        check('goal date: 9 lb at ½ lb a week = 18 weeks', round(R['weeks']) == 18, R['weeks'])
        check('the preview shows calories, macros and the goal date', str(R['kcal'])[:1] in pv and 'g protein' in pv and 'Goal around' in pv, pv)
        await pg.click('#bg-save'); await pg.wait_for_timeout(300)
        card = await pg.inner_text('#body-goal')
        check('the card: eat, macros, burn, workouts, goal date', all(x in card for x in ['EAT EACH DAY'.title(), 'Protein', 'You burn a day', 'Workouts this week', 'Goal date', '250 cal surplus']) or all(x.lower() in card.lower() for x in ['eat each day', 'protein', 'you burn a day', 'workouts this week', 'goal date', '250 cal surplus']), card[:300].replace('\n', ' | '))
        check('projected body fat at the goal', 'body fat would be about' in card)
        check('not medical advice', 'not medical advice' in card)
        check('no warnings when training is on track', await pg.locator('#bg-warns').count() == 0)
        await pg.click('#bg-tips summary'); await pg.wait_for_timeout(100)
        check('tips for bulking', 'surplus' in await pg.inner_text('#bg-tips'))
        await pg.click('#bg-use'); await pg.wait_for_timeout(200)
        check('Use these as my meal targets sets the meal goals', await ev("ML().goals.kcal") == R['kcal'] and await ev("ML().goals.p") == R['p'])
        # Missed workouts on a bulk
        await ev(SESS + "(3)"); await pg.wait_for_timeout(300)
        check('bulk + missed workouts warns', await pg.locator('#bgw-miss').count() == 1 and '3 of 8' in await pg.inner_text('#bgw-miss'))
        await ev("UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        check('...and Train shows it too', await pg.locator('#bg-nudge').count() == 1)
        await pg.click('#bgn-hold'); await pg.wait_for_timeout(300)
        check('Maintenance for a week drops the surplus', await ev("bgCalc(bgSet()).adj") == 0 and await pg.locator('#bg-nudge').count() == 0)
        await pg.locator('.tabs button', has_text='Progress').click(); await pg.wait_for_timeout(200)
        check('the card says maintenance and offers Resume', 'maintenance for now' in await pg.inner_text('#body-goal') and await pg.locator('#bg-resume').count() == 1)
        await pg.click('#bg-resume'); await pg.wait_for_timeout(200)
        check('Resume brings the surplus back', await ev("bgCalc(bgSet()).adj") == 250)
        # Pace warnings from the weight trend
        await ev("commit(st => { st.meta.bw = [{ id: 'a', d: ymd(addDays(new Date(), -18)), w: 176, u: 'lb' }, { id: 'b', d: ymd(new Date()), w: 181, u: 'lb' }]; }, 'meta')"); await pg.wait_for_timeout(200)
        check('gaining too fast warns', await pg.locator('#bgw-fast').count() == 1)
        await ev("commit(st => { st.meta.bw = [{ id: 'a', d: ymd(addDays(new Date(), -18)), w: 181.2, u: 'lb' }, { id: 'b', d: ymd(new Date()), w: 181, u: 'lb' }]; }, 'meta')"); await pg.wait_for_timeout(200)
        check('not gaining warns', await pg.locator('#bgw-flat').count() == 1)
        # Cut
        Rc = await ev("bgCalc({ goal: 'cut', pace: 'gentle', tbf: 12, days: 4 })")
        check('cut: deficit ½% of weight a week', Rc['adj'] == round(-181 * 0.005 * 500) and Rc['rate'] < 0, Rc)
        check('cut to 12% body fat: goal weight from lean mass', abs(Rc['twLb'] - 141.2 / 0.88) < 0.5 and Rc['weeks'] > 0, Rc)
        check('cut protein about 1 g per lb', 175 <= Rc['p'] <= 185, Rc['p'])
        await ev("commit(st => { st.meta.settings.body = { goal: 'cut', pace: 'gentle', from: ymd(new Date()), w0Kg: 82 }; }, 'meta')"); await ev(SESS + "(2)"); await pg.wait_for_timeout(300)
        check('cut + missed workouts warns about muscle', 'muscle' in await pg.inner_text('#bgw-miss'))
        # Low protein from the food log
        await ev("mealCommit(m => { m.log = {}; for (let i = 0; i < 4; i++) m.log[ymd(addDays(new Date(), -i))] = [{ id: 'f' + i, n: 'x', m: { kcal: 1500, p: 80 } }]; })"); await pg.wait_for_timeout(200)
        check('low protein warns', await pg.locator('#bgw-protein').count() == 1)
        # Recomp with a body fat goal
        Rr = await ev("bgCalc({ goal: 'recomp', tbf: 15, days: 4 })")
        check('recomp: near maintenance, a slow body fat date', Rr['adj'] == -100 and 15 < Rr['weeks'] < 25, Rr)
        # No scan: from height, weight and age
        await ev("commit(st => { st.meta.meas = []; }, 'meta'); mealCommit(m => { m.me = { h: 185, w: 82, age: 27, sex: 'm', us: true }; })")
        N2 = await ev("bodyNow()")
        check('without a scan, BMR from height, weight and age', N2['bmrSrc'] == 'your height, weight and age' and 1800 < N2['bmr'] < 1900, N2)
        await ev("mealCommit(m => { m.me = { ...m.me, age: 16 }; })")
        check('under 18: no calorie numbers', 'adults' in await ev("bgCalc({ goal: 'bulk', pace: 'gentle' }).problem"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
