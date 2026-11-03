"""Eating habits shape the meal plan (meals a day, cooking, cheap, quick); first-launch setup offer (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8793
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        T = "{ kcal: 2600, p: 170, c: 280, f: 80 }"
        menu = lambda h: ev(f"(() => {{ mealCommit(m => {{ m.habits = {h}; m.prefs = undefined; }}); const M = buildMenu({T}, 12345); return M && {{ days: M.days.map(d => d.map(x => x.slot)), recipes: [...new Set(M.days.flat().filter(x => x.slot !== 's').map(x => x.r))], kcal: M.days.map(d => dayTotals(d).kcal) }}; }})()")
        m = await menu("{ meals: 4, prep: 'few' }")
        check('default: three meals plus a snack when there is room', all(d[:3] == ['b', 'l', 'd'] for d in m['days']) and any('s' in d for d in m['days']), m['days'][0])
        m = await menu("{ meals: 3, prep: 'few' }"); check('3 meals: three meals, a snack only to top up a short day', all(d[:3] == ['b', 'l', 'd'] for d in m['days']))
        m = await menu("{ meals: 2, prep: 'few' }"); check('2 meals: two bigger meals, no breakfast slot', all(d[:2] == ['l', 'd'] and 'b' not in d for d in m['days']), m['days'][0])
        check('2 meals lands within about 10% of the calories', all(abs(k - 2600) <= 270 for k in m['kcal']), m['kcal'])
        hi = await ev("(() => { mealCommit(m => { m.habits = { meals: 2, prep: 'once', quick: true }; }); const M = buildMenu({ kcal: 3500, p: 200 }, 7); return M.days.map(d => dayTotals(d).kcal); })()")
        check('2 meals at 3,500 is topped up, not left a quarter short', min(hi) >= 3500 * 0.85, hi)
        m = await menu("{ meals: 5, prep: 'few' }"); check('3 + 2 snacks: up to two snacks', max(d.count('s') for d in m['days']) == 2, m['days'])
        cq = await ev("(() => { mealCommit(m => { m.habits = { meals: 4, prep: 'few', cheap: true, quick: true }; }); const M = buildMenu({ kcal: 2400, p: 180 }, 99); return M.days.flat().map(x => getRecipe(x.r).name); })()")
        check('cheap + quick → nothing pricey (no salmon)', not any('almon' in n for n in cq), cq)
        await ev("mealCommit(m => { m.habits = { meals: 5, prep: 'few' }; m.menu = buildMenu({ kcal: 2900, p: 180 }, 4); })"); await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('plan')"); await pg.wait_for_timeout(300)
        rows = await ev("(() => { const d = ML().menu.days[menuDayIdx()]; return [d.length, document.querySelectorAll('#menu-card .menu-row').length]; })()")
        check('every planned item has a row, second snack included', rows[0] == rows[1], rows)
        once = await menu("{ meals: 4, prep: 'once' }"); fresh = await menu("{ meals: 4, prep: 'fresh' }")
        check('cook once a week → fewer recipes than most days', len(once['recipes']) < len(fresh['recipes']), [len(once['recipes']), len(fresh['recipes'])])
        cheap = await menu("{ meals: 4, prep: 'few', cheap: true }")
        sc = await ev(f"(() => {{ const ids = {cheap['recipes']}; const all = planPool().m.map(costScore).sort((a, b) => a - b); return {{ mine: ids.map(id => costScore(getRecipe(id))), median: all[Math.floor(all.length / 2)] }}; }})()".replace("{cheap['recipes']}", str(cheap['recipes'])))
        check('keep it cheap → no pricey ingredients beyond the median', all(x <= sc['median'] for x in sc['mine']), sc)
        quick = await menu("{ meals: 4, prep: 'few', quick: true }")
        mins = await ev(f"{quick['recipes']}.map(id => getRecipe(id)).filter(r => r.cat === 'main').map(r => +r.mins)")
        cut = await ev("(() => { const t = planPool().m.map(r => +r.mins || 99).sort((a, b) => a - b); return Math.max(30, t[2]); })()")
        check('quick → the quickest mains (30 minutes or less where possible)', all(0 < x <= cut for x in mins), [mins, cut])
        # the setup sheet asks and saves
        await ev("mealCommit(m => { delete m.habits; })"); await ev("openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(200)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '170'); await pg.fill('#tg-age', '28')
        await pg.click('#hb-meals-3'); await pg.click('#hb-prep-once'); await pg.click('#hb-cheap'); await pg.wait_for_timeout(100)
        await pg.click('#tg-save'); await pg.wait_for_timeout(300)
        h = await ev("ML().habits"); mn = await ev("ML().menu && ML().menu.days.every(d => d.filter(x => x.slot !== 's').length === 3)")
        check('meal setup saves habits and the plan follows them', h == {'meals': 3, 'prep': 'once', 'cheap': True, 'quick': False} and mn, h)
        check('habits survive a reload', await ev("normMeals(JSON.parse(JSON.stringify(ML()))).habits.prep") == 'once')
        # first launch: fresh install, tour ends → offered once
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto(URL); await pg2.wait_for_timeout(1200)
        await pg2.evaluate("(() => { localStorage.removeItem('liftbook.setupOffered'); S.sessions = {}; delete S.meta.settings.program; delete S.meta.settings.plan; S.ver++; touch(); startTour(); })()"); await pg2.wait_for_timeout(400)
        await pg2.click('#tour-skip'); await pg2.wait_for_timeout(700)
        check('fresh install: ending the tour offers setup', await pg2.locator('#gs-welcome').count() == 1 and (await pg2.locator('#gs-cancel').text_content()) == 'Skip for now')
        await pg2.click('#gs-cancel'); await pg2.wait_for_timeout(200)
        await pg2.evaluate("startTour()"); await pg2.wait_for_timeout(400); await pg2.click('#tour-skip'); await pg2.wait_for_timeout(700)
        check('only offered once', await pg2.locator('#gs-welcome').count() == 0)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
