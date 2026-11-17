"""Meal planning audit, phase 1 (Nov 16): regression tests for defects D1–D4 and D6 from the discovery brief.
D1 Body goal / Daily goals reach the meal plan's own target · D2 People survives a rebuild · D3 a planned meal logged
another way counts as eaten · D4 the recipe page's times stepper matches Week · D6 one change doesn't re-roll other days."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8841
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, info=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  ' + str(info)))
SEED = """
mealCommit(m => {
  m.me = { h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle', us: true };
  m.habits = { ...mealHabits(), meals: 4, prep: 'few' };
  const t = targetsFor(m.me); m.goals = { kcal: t.kcal, p: t.p, c: t.c, f: t.f };
  m.menu = buildMenu(t, 4242);
});
usePlanForPrep(true, true);
commit(st => { st.meta.bw = [{ id: 'b1', d: ymd(addDays(new Date(), -20)), w: 174, u: 'lb' }, { id: 'b2', d: ymd(new Date()), w: 173, u: 'lb' }]; }, 'meta');
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1200)
        ev = pg.evaluate
        await ev(SEED); await pg.wait_for_timeout(300)
        # D1: Body goal → meal targets → the plan's own target follows
        await ev("commit(st => { st.meta.settings.body = { goal: 'cut', pace: 'gentle', from: ymd(new Date()), w0Kg: 78.5 }; }, 'meta')")
        days0 = await ev("JSON.stringify(ML().menu.days.map(d => d.filter(x => x.slot !== 's').map(x => x.slot + x.r)))")
        await ev("bgUseTargets(bgCalc(bgSet(), bodyNow()))"); await pg.wait_for_timeout(200)
        g = await ev("[ML().goals.kcal, ML().menu.t.kcal, ML().goals.p, ML().menu.t.p]")
        check('D1: Body goal targets reach the meal plan', g[0] == g[1] and g[2] == g[3], g)
        check('D1: same breakfasts, lunches and dinners; portions and snacks resized', days0 == await ev("JSON.stringify(ML().menu.days.map(d => d.filter(x => x.slot !== 's').map(x => x.slot + x.r)))"))
        check('D1: What you\'ll cook follows the resized plan', await ev("ML().plan.fromMenu === true"))
        await ev("UI.setTab('meals'); setMealsMode('log'); S.rerender(); openSheet({ type: 'mealGoals' })"); await pg.wait_for_timeout(300)
        await pg.fill('#goal-kcal', '2600'); await pg.click('#goal-save'); await pg.wait_for_timeout(300)
        check('D1: Daily goals typed by hand also reach the plan', await ev("ML().menu.t.kcal") == 2600)
        # D2: People survives rebuilding from the plan
        await ev("mealCommit(m => { m.plan.people = 2; })"); await ev("usePlanForPrep(true, true)")
        check('D2: People stays 2 after the plan refills What you\'ll cook', await ev("ML().plan.people") == 2)
        await ev("toggleSkip(0, 'l')")
        check('D2: ...and after a skip', await ev("ML().plan.people") == 2)
        await ev("toggleSkip(0, 'l'); mealCommit(m => { m.plan.people = 1; })")
        # D3: a planned recipe logged through Log food counts as the planned meal
        today = await ev("ymd(new Date())")
        rid = await ev("(() => { const di = menuDayIdx(new Date()); return ML().menu.days[di].find(x => x.slot === 'l').r; })()")
        await ev(f"logRecipe(ymd(new Date()), getRecipe('{rid}'), 1)"); await pg.wait_for_timeout(100)
        check('D3: the log entry is linked to the planned lunch', await ev("(ML().log[ymd(new Date())] || []).slice(-1)[0].slot") == 'l')
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('log'); S.rerender()"); await pg.wait_for_timeout(300)
        check('D3: Today shows it as logged, not Ate it', (await pg.inner_text('#menu-log-l')).strip() == 'Logged')
        await ev("(() => { const l = ML().log[ymd(new Date())]; dropLog(ymd(new Date()), l[l.length - 1].id); })()"); await pg.wait_for_timeout(200)
        check('D3: removing the entry brings Ate it back', (await pg.inner_text('#menu-log-l')).strip() == 'Ate it')
        await ev("addLog(ymd(new Date()), { k: 'food', name: 'Banana', m: { kcal: 105, p: 1 } })")
        check('D3: a food that isn\'t a recipe is never linked', await ev("!(ML().log[ymd(new Date())].slice(-1)[0].slot)"))
        # D4: recipe page stepper on a short plan
        await ev("mealCommit(m => { m.plan.items = [{ id: 'q', r: 'm-sheet-pan', n: 5.25 }]; m.plan.days = 4; m.plan.start = ymd(new Date()); delete m.plan.fromMenu; })")
        await ev("UI.setView({ type: 'meal', id: 'm-sheet-pan' })"); await pg.wait_for_timeout(300)
        txt = await pg.inner_text('.meal-view')
        vals = await ev("[...document.querySelectorAll('.meal-view .mstep .v')].map(e => e.textContent)")
        check('D4: recipe page counts times in these 4 days', 'Times in these 4 days' in txt and '5.25' not in vals and vals[-1] == '3', vals)
        await ev("mealCommit(m => { m.plan.days = 7; m.plan.items[0].n = 4.6; })"); await pg.wait_for_timeout(200)
        vals = await ev("[...document.querySelectorAll('.meal-view .mstep .v')].map(e => e.textContent)")
        check('D4: a full week shows whole times a week', vals[-1] == '5', vals)
        await ev("UI.setView(null)")
        # D6: swapping one recipe keeps every other day and meal
        await ev(SEED.replace('usePlanForPrep(true, true);', 'usePlanForPrep(true, true); mealCommit(m => { m.plan.start = ymd(new Date()); m.plan.days = 7; });'))
        await pg.wait_for_timeout(200)
        before = await ev("ML().menu.days.map(d => d.map(x => x.slot + ':' + x.r + ':' + x.sv))")
        old = await ev("ML().plan.items.find(i => getRecipe(i.r).cat === 'main').r")
        itid = await ev(f"ML().plan.items.find(i => i.r === '{old}').id")
        await ev(f"swapPlanItem('{itid}')"); await pg.wait_for_timeout(300)
        pick = await ev("document.querySelector('.rp-list .opt').id.slice(3)")
        await pg.locator('.rp-list .opt').first.click(); await pg.wait_for_timeout(300)
        after = await ev("ML().menu.days.map(d => d.map(x => x.slot + ':' + x.r + ':' + x.sv))")
        same = all(a == bb.replace(old, pick) for da, db in zip(after, before) for a, bb in zip(da, db))
        check('D6: a swap changes only that recipe, on the same days and meals', same and before != after)
        check('D6: no out-of-step note after a swap', await pg.locator('#menu-stale').count() == 0)
        # adding by hand: nothing re-rolls, the card says so and offers the rebuild
        await ev("UI.setTab('meals'); setMealsMode('plan'); S.rerender()")
        snap = await ev("JSON.stringify(ML().menu.days)")
        await ev("addToPlan('m-reel-chana', 3)"); await pg.wait_for_timeout(400)
        check('D6: adding a recipe leaves the meal plan as it was', snap == await ev("JSON.stringify(ML().menu.days)"))
        check('D6: the meal plan says it is out of step, with an Update button', await pg.locator('#menu-stale #menu-resync').count() == 1)
        await pg.click('#menu-resync'); await pg.wait_for_timeout(400)
        mains = await ev("[...new Set(ML().menu.days.flatMap(d => d.filter(x => x.slot === 'l' || x.slot === 'd').map(x => x.r)))].every(r => pickedIds().includes(r))")
        check('D6: Update the meal plan rebuilds it from what you\'ll cook', mains and await pg.locator('#menu-stale').count() == 0)
        await ev("removeFromPlan('m-reel-chana')"); await pg.wait_for_timeout(300)
        snap2 = await ev("JSON.stringify(ML().menu.days)")
        await pg.wait_for_timeout(300)
        check('D6: removing one leaves the plan until you ask', snap2 == await ev("JSON.stringify(ML().menu.days)") and await pg.locator('#menu-stale').count() == 1)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
