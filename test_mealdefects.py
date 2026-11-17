"""Meal planning audit, phase 1 (Nov 16): regression tests for defects D1–D4 and D6 from the discovery brief.
D1 Body goal / Daily goals reach the meal plan's own target · D2 People survives a rebuild · D3 a planned meal logged
another way counts as eaten · D4 the recipe page's times stepper matches Week · D6 one change doesn't re-roll other days."""
import asyncio, subprocess, sys, time, json
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
});
setPlanDates(new Date(), 7); genFill(4242, { auto: true });
commit(st => { st.meta.bw = [{ id: 'b1', d: ymd(addDays(new Date(), -20)), w: 174, u: 'lb' }, { id: 'b2', d: ymd(new Date()), w: 173, u: 'lb' }]; }, 'meta');
"""
# Nov 16 (audit phase 2): the plan is dated; these read its meals from today on
MAINS = "JSON.stringify(planYmds().filter(d => d >= ymd(new Date())).map(d => dayRows(dayMeals(d)).filter(({ x }) => x.slot !== 's').map(({ x, key }) => key + x.r)))"
FUTURE = "JSON.stringify(planYmds().filter(d => d >= ymd(new Date())).map(d => dayRows(dayMeals(d)).map(({ x, key }) => [key, x.r, x.sv, !!x.off])))"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1200)
        ev = pg.evaluate
        await ev(SEED); await pg.wait_for_timeout(300)
        # D1: Body goal → Daily goals → the plan's portions follow
        await ev("commit(st => { st.meta.settings.body = { goal: 'cut', pace: 'gentle', from: ymd(new Date()), w0Kg: 78.5 }; }, 'meta')")
        days0 = await ev(MAINS)
        await ev("bgUseTargets(bgCalc(bgSet(), bodyNow()))"); await pg.wait_for_timeout(200)
        g = await ev("[ML().goals.kcal, ML().gen.t.kcal, ML().goals.p, ML().gen.t.p, planT().kcal]")
        check('D1: Body goal targets reach the meal plan', g[0] == g[1] == g[4] and g[2] == g[3], g)
        check('D1: same breakfasts, lunches and dinners; portions and snacks resized', days0 == await ev(MAINS))
        check('D1: the plan still sets the cooking', await ev("ML().plan.fromMenu === true"))
        await ev("UI.setTab('meals'); setMealsMode('log'); S.rerender(); openSheet({ type: 'mealGoals' })"); await pg.wait_for_timeout(300)
        await pg.fill('#goal-kcal', '2600'); await pg.click('#goal-save'); await pg.wait_for_timeout(300)
        check('D1: Daily goals typed by hand also reach the plan', await ev("ML().gen.t.kcal") == 2600)
        # D2: People survives rebuilding from the plan
        await ev("mealCommit(m => { m.plan.people = 2; })"); await ev("usePlanForPrep(true, true)")
        check('D2: People stays 2 after the plan refills the dates', await ev("ML().plan.people") == 2)
        await ev("toggleOffMeal(ymd(new Date()), 'l')")
        check('D2: ...and after a skip', await ev("ML().plan.people") == 2)
        await ev("toggleOffMeal(ymd(new Date()), 'l'); mealCommit(m => { m.plan.people = 1; })")
        # D3: a planned recipe logged through Log food counts as the planned meal
        rid = await ev("dayRows(dayMeals(ymd(new Date()))).find(x => x.key === 'l').x.r")
        await ev(f"logRecipe(ymd(new Date()), getRecipe('{rid}'), 1)"); await pg.wait_for_timeout(100)
        e = await ev("(ML().log[ymd(new Date())] || []).slice(-1)[0]")
        check('D3: the log entry is linked to the planned lunch', e.get('slot') == 'l' and e.get('pm') == await ev("dayRows(dayMeals(ymd(new Date()))).find(x => x.key === 'l').x.id"), e)
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('log'); S.rerender()"); await pg.wait_for_timeout(300)
        check('D3: Today shows it as logged, not Ate it', (await pg.inner_text('#menu-log-l')).strip() == 'Logged')
        await ev("(() => { const l = ML().log[ymd(new Date())]; dropLog(ymd(new Date()), l[l.length - 1].id); })()"); await pg.wait_for_timeout(200)
        check('D3: removing the entry brings Ate it back', (await pg.inner_text('#menu-log-l')).strip() == 'Ate it')
        await ev("addLog(ymd(new Date()), { k: 'food', name: 'Banana', m: { kcal: 105, p: 1 } })")
        check('D3: a food that isn\'t a recipe is never linked', await ev("!(ML().log[ymd(new Date())].slice(-1)[0].pm)"))
        # D4: recipe page stepper on a short plan
        await ev("mealCommit(m => { m.plan.items = [{ id: 'q', r: 'm-sheet-pan', n: 5.25 }]; m.plan.days = 4; m.plan.start = ymd(new Date()); })")
        await ev("UI.setView({ type: 'meal', id: 'm-sheet-pan' })"); await pg.wait_for_timeout(300)
        txt = await pg.inner_text('.meal-view')
        vals = await ev("[...document.querySelectorAll('.meal-view .mstep .v')].map(e => e.textContent)")
        check('D4: recipe page counts times in these 4 days', 'Times in these 4 days' in txt and '5.25' not in vals and vals[-1] == '3', vals)
        await ev("setPlanDates(new Date(), 7); setRecipeCount('m-sheet-pan', 5)"); await pg.wait_for_timeout(200)
        vals = await ev("[...document.querySelectorAll('.meal-view .mstep .v')].map(e => e.textContent)")
        check('D4: a full week shows whole times a week', vals[-1] == '5', vals)
        await ev("UI.setView(null)")
        # D6: swapping one recipe keeps every other day and meal
        await ev("mealCommit(m => { m.days = {}; delete m.plan.fromMenu; })")
        await ev(SEED); await pg.wait_for_timeout(200)
        before = await ev(FUTURE)
        old = await ev("ML().plan.items.find(i => getRecipe(i.r).cat === 'main').r")
        itid = await ev(f"ML().plan.items.find(i => i.r === '{old}').id")
        await ev(f"swapPlanItem('{itid}')"); await pg.wait_for_timeout(300)
        pick = await ev("document.querySelector('.rp-list .opt').id.slice(3)")
        await pg.locator('.rp-list .opt').first.click(); await pg.wait_for_timeout(300)
        after = await ev(FUTURE)
        check('D6: a swap changes only that recipe, on the same days and meals', after == before.replace(old, pick) and before != after)
        # adding by hand: only as many meals as it needs change, nothing re-rolls
        await ev("UI.setTab('meals'); setMealsMode('plan'); S.rerender()")
        import json
        snap = json.loads(await ev(FUTURE))
        await ev("addToPlan('m-reel-chana', 3)"); await pg.wait_for_timeout(400)
        now = json.loads(await ev(FUTURE))
        changed = sum(1 for da, db in zip(snap, now) for a, c in zip(da, db) if a != c)
        check('D6: adding a recipe changes only the meals it goes into', changed == 3 and await ev("recipeCount('m-reel-chana')") == 3, changed)
        check('D6: no out-of-step note, no Update button', await pg.locator('#menu-stale').count() == 0 and await pg.locator('#menu-resync').count() == 0)
        await ev("removeFromPlan('m-reel-chana')"); await pg.wait_for_timeout(300)
        after2 = json.loads(await ev(FUTURE))
        same = all(row in snap[i] for i, d in enumerate(after2) for row in d) and await ev("recipeCount('m-reel-chana')") == 0
        check('D6: removing one takes it off and leaves every other meal', same and sum(len(d) for d in after2) == sum(len(d) for d in snap) - 3, (sum(len(d) for d in after2), sum(len(d) for d in snap)))
        # D5: no + over the rows on Start cooking and Shopping; still there on the other Meals pages
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(250)
        check('D5: no + button on the Shopping list', await pg.locator('#quick-fab').count() == 0)
        await ev("UI.setView({ type: 'cook' })"); await pg.wait_for_timeout(250)
        check('D5: no + button on Start cooking', await pg.locator('#quick-fab').count() == 0)
        await ev("UI.setView(null); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(250)
        check('D5: the + button stays on Week', await pg.locator('#quick-fab').count() == 1)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
