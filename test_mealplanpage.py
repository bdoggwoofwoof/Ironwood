"""Meal planning audit, phase 3 (Nov 16): the Plan page from Newt's approved mockup. A summary with one main button that
follows what's needed next, a card per date with status chips, one sheet per meal (each change touches only that meal),
Cook for these dates, More planning tools, the Log / Plan / Recipes / Shop names and the new Meals tour."""
import asyncio, subprocess, sys, time, json
from playwright.async_api import async_playwright
PORT = 8843
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, info=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  ' + str(info)[:400]))
SEED = """mealCommit(m => { m.me = { h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle', us: true }; m.habits = { ...mealHabits(), meals: 4, prep: 'few' };
  const t = targetsFor(m.me); m.goals = { kcal: t.kcal, p: t.p, c: t.c, f: t.f }; m.stars = { 'm-reel-chana': true }; });
setPlanDates(new Date(), 5); genFill(4242, { auto: true }); UI.setTab('meals'); UI.setView(null); setMealsMode('plan'); S.rerender();"""
ALL = "JSON.stringify(planYmds().map(d => dayRows(dayMeals(d)).map(({ x, key }) => [key, x.id, x.r || x.name, x.sv, !!x.off])))"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1200)
        ev = pg.evaluate
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        check('G: Meals switches read Log, Plan, Recipes, Shop', await ev("[...document.querySelectorAll('.topsw button')].map(b => b.textContent)") == ['Log', 'Plan', 'Recipes', 'Shop'])
        check('empty: one main button, Plan my week, and "or use a saved plan"', await pg.locator('#plan-start.primary').count() == 1 and await pg.locator('#week-ready').count() == 1 and await pg.locator('[id^="day-"]').count() == 0)
        await ev(SEED); await pg.wait_for_timeout(500)
        today = await ev("ymd(new Date())"); d1 = await ev("ymd(addDays(new Date(), 1))"); d2 = await ev("ymd(addDays(new Date(), 2))")
        check('B: one card per date, today marked', await pg.locator('[id^="day-"]').count() == 5 and 'Today' in await pg.inner_text(f'#day-{today} .section-h'))
        check('every meal spot has a row (3 meals + a snack)', await pg.locator(f'#day-{today} .menu-row').count() == 4)
        sm = await pg.inner_text('#plan-sum')
        check('summary: meals planned, shopping list ready, Shopping list is the main button', 'meals planned' in sm and 'shopping list ready' in sm and await pg.locator('#plan-sum #plan-list.primary').count() == 1, sm)
        check('each day shows its calories against the goal, and protein', ' of ' in await pg.inner_text(f'#daytot-{today}'))
        # the meal sheet
        before = json.loads(await ev(ALL))
        await pg.click(f'#pm-{today}-l'); await pg.wait_for_timeout(250)
        check('tapping a meal opens its sheet', await pg.locator('.sheet #pms-replace').count() == 1 and await pg.locator('.sheet #pms-move').count() == 1 and await pg.locator('.sheet #pms-copy').count() == 1)
        await pg.locator('.sheet button[aria-label="More servings for this meal"]').click(); await pg.wait_for_timeout(200)
        after = json.loads(await ev(ALL))
        diff = [(i, j) for i, (a, c) in enumerate(zip(before, after)) for j, (x, y) in enumerate(zip(a, c)) if x[3] != y[3]]
        check('servings change for that meal only', diff == [(0, 1)], diff)
        check('...and it becomes yours, so the plan never re-picks it', await ev(f"dayRows(dayMeals('{today}')).find(r => r.key === 'l').x.by") == 'you')
        await pg.click('#pms-eaten'); await pg.wait_for_timeout(300)
        lunch = await ev(f"dayRows(dayMeals('{today}')).find(r => r.key === 'l').x")
        e = await ev(f"ML().log['{today}'].slice(-1)[0]")
        check('Mark as eaten logs it, linked, at its servings', e['pm'] == lunch['id'] and e['sv'] == lunch['sv'])
        check('C: the row gets an Eaten chip', 'Eaten' in await pg.inner_text(f'#pm-{today}-l') and await pg.locator(f'#pm-{today}-l .chip.st-eaten').count() == 1)
        check('the summary counts it', '1 eaten' in await pg.inner_text('#plan-sum'))
        await pg.click(f'#pm-{today}-l'); await pg.wait_for_timeout(250)
        check('an eaten meal can\'t be changed from Plan', await pg.locator('.sheet #pms-replace').count() == 0 and 'remove it from Log' in await pg.inner_text('.sheet'))
        await ev("closeSheet()")
        # replace one meal
        snap = json.loads(await ev(ALL))
        await pg.click(f'#pm-{d1}-d'); await pg.wait_for_timeout(250); await pg.click('#pms-replace'); await pg.wait_for_timeout(300)
        pick = await ev("document.querySelector('.rp-list .opt').id.slice(3)"); await pg.locator('.rp-list .opt').first.click(); await pg.wait_for_timeout(300)
        now = json.loads(await ev(ALL))
        ch = [(i, j) for i, (a, c) in enumerate(zip(snap, now)) for j, (x, y) in enumerate(zip(a, c)) if x != y]
        check('Replace changes only that meal', ch == [(1, 2)] and now[1][2][2] == pick, ch)
        # move: swaps with what's there
        a0 = now[2][1]; b0 = now[2][2]
        await pg.click(f'#pm-{d2}-l'); await pg.wait_for_timeout(250); await pg.click('#pms-move'); await pg.wait_for_timeout(250)
        await pg.click(f'#pt-{d2}-d'); await pg.wait_for_timeout(300)
        mv = json.loads(await ev(ALL))
        check('Move puts it in the new spot and what was there takes its place', mv[2][1][2] == b0[2] and mv[2][2][2] == a0[2], (mv[2], a0, b0))
        # copy to every lunch
        await pg.click(f'#pm-{d1}-l'); await pg.wait_for_timeout(250); await pg.click('#pms-copy'); await pg.wait_for_timeout(250)
        await pg.click('#pt-all'); await pg.wait_for_timeout(100)
        n_sel = await pg.locator('.sheet [id^="pt-2"][aria-pressed="true"]').count()
        await pg.click('#pt-apply'); await pg.wait_for_timeout(300)
        lr = await ev(f"dayRows(dayMeals('{d1}')).find(r => r.key === 'l').x.r")
        cp = await ev(f"planYmds().filter(d => d > '{today}').every(d => dayRows(dayMeals(d)).find(r => r.key === 'l').x.r === '{lr}')")
        check('Copy to every lunch these days (eaten ones stay)', cp and n_sel == 3 and await ev(f"dayRows(dayMeals('{today}')).find(r => r.key === 'l').x.id") == lunch['id'], n_sel)
        # eating elsewhere, this day only
        await pg.click(f'#pm-{d2}-b'); await pg.wait_for_timeout(250); await pg.click('#pms-away'); await pg.wait_for_timeout(300)
        check('Eating elsewhere (this day): chip, no rule', await pg.locator(f'#pm-{d2}-b .chip', has_text='Eating elsewhere').count() == 1 and not await ev("(ML().rules || []).length"))
        # undo from the toast
        await pg.click('.toast button'); await pg.wait_for_timeout(300)
        check('Undo puts it back', await pg.locator(f'#pm-{d2}-b .chip').count() == 0)
        # remove → Needs a recipe
        await pg.click(f'#pm-{d2}-d'); await pg.wait_for_timeout(250); await pg.click('#pms-remove'); await pg.wait_for_timeout(300)
        check('C: a removed meal reads Pick a recipe with a Needs a recipe chip', await pg.locator(f'#pm-{d2}-d.empty .chip.st-need').count() == 1)
        check('...and the summary says one needs a recipe', '1 needs a recipe' in await pg.inner_text('#plan-sum'))
        # tapping an empty meal: starred of that kind first, a note, eating elsewhere
        await pg.click(f'#pm-{d2}-d'); await pg.wait_for_timeout(250)
        check('an empty meal offers starred recipes first', await pg.locator('#spot-m-reel-chana').count() == 1 and await pg.locator('#spot-note').count() == 1 and await pg.locator('#spot-away').count() == 1)
        await pg.click('#spot-m-reel-chana'); await pg.wait_for_timeout(300)
        check('picking one fills just that meal', await ev(f"dayRows(dayMeals('{d2}')).find(r => r.key === 'd').x.r") == 'm-reel-chana')
        await ev(f"dayMeals('{d2}').filter(x => x.slot === 's').forEach(x => removeMeal('{d2}', x.id))"); await pg.wait_for_timeout(200)
        check('C: an empty snack reads Add a meal, Not planned', await pg.locator(f'#pm-{d2}-s.empty .chip.st-none', has_text='Not planned').count() == 1)
        await pg.click(f'#pm-{d2}-s'); await pg.wait_for_timeout(250); await pg.click('#spot-note'); await pg.wait_for_timeout(150)
        await pg.fill('#spot-note', 'Fruit at work'); await pg.click('#spot-note-save'); await pg.wait_for_timeout(300)
        check('a note with no recipe is a meal too', 'Fruit at work' in await pg.inner_text(f'#pm-{d2}-s') and 'A note, no recipe' in await pg.inner_text(f'#pm-{d2}-s'))
        check('...and stays out of the shopping list', not await ev("ML().plan.items.some(i => !getRecipe(i.r))"))
        # Cook for these dates
        await pg.locator('#cook-for .mp-name').first.click(); await pg.wait_for_timeout(250)
        check('a recipe in Cook for these dates opens its sheet (times, swap everywhere, remove)', await pg.locator('.sheet #ci-swap').count() == 1 and await pg.locator('.sheet #ci-remove').count() == 1 and await pg.locator('.sheet .mstep').count() == 1)
        await ev("closeSheet()")
        rid = await ev("ML().plan.items[0].r"); sv0 = await ev(f"servingsFor(ML().plan.items.find(i => i.r === '{rid}'))")
        await pg.click('#plan-extra'); await pg.wait_for_timeout(250)
        await pg.locator(f'.sheet button[aria-label="More extra servings of {await ev(f"getRecipe(\'{rid}\').name")}"]').click(); await pg.wait_for_timeout(200)
        await pg.locator(f'.sheet button[aria-label="More extra servings of {await ev(f"getRecipe(\'{rid}\').name")}"]').click(); await pg.wait_for_timeout(200)
        check('Make extra adds servings to cook and buy, on no day', await ev(f"servingsFor(ML().plan.items.find(i => i.r === '{rid}'))") == sv0 + 2 and await ev(f"extraOf('{rid}')") == 2)
        await ev("closeSheet()")
        # More planning tools
        await pg.click('#plan-tools'); await pg.wait_for_timeout(250)
        ids = await ev("[...document.querySelectorAll('.sheet .opt')].map(b => b.id)")
        check('More planning tools: Different meals first, Clear everything last', ids[0] == 'wt-reroll' and ids[-1] == 'plan-clear' and all(x in ids for x in ['wt-settings', 'plan-prefs', 'plan-people', 'plan-preps', 'prep-save', 'plan-ahead-btn', 'rot-setup']), ids)
        await pg.click('#wt-reroll'); await pg.wait_for_timeout(250)
        await pg.locator('.sheet [id^="rr-"][aria-pressed="true"]').first.click(); await pg.wait_for_timeout(100)   # leave today out
        keep = await ev(f"JSON.stringify(dayRows(dayMeals('{today}')).map(r => r.x.r))")
        await pg.click('#rr-go'); await pg.wait_for_timeout(300)
        check('Different meals for the days you pick: an unpicked day stays', await ev(f"JSON.stringify(dayRows(dayMeals('{today}')).map(r => r.x.r))") == keep)
        check('...and meals you set yourself stay', await ev(f"dayRows(dayMeals('{d2}')).find(r => r.key === 'd').x.r") == 'm-reel-chana')
        await ev("openSheet({ type: 'planHousehold' })"); await pg.wait_for_timeout(200)
        await pg.locator('.sheet button[aria-label="More people"]').click(); await pg.wait_for_timeout(200)
        check('People and amounts: People lives here', await ev("ML().plan.people") == 2 and await pg.locator('.sheet #units-seg').count() == 1)
        await pg.locator('.sheet button[aria-label="Fewer people"]').click(); await ev("closeSheet()")
        # the main button follows what's needed next
        await ev("mealCommit(m => { m.checks = Object.fromEntries(shoppingList().map(x => [x.key, 1])); })"); await pg.wait_for_timeout(200)
        check('everything bought: Start cooking becomes the main button', await pg.locator('#plan-sum #cook-start.primary').count() == 1 and 'everything bought' in await pg.inner_text('#plan-sum'))
        await ev("mealCommit(m => { m.checks = {}; })")
        # Saved plans open the prep library
        await pg.click('#plan-tools'); await pg.wait_for_timeout(200); await pg.click('#plan-preps'); await pg.wait_for_timeout(300)
        check('Saved and ready-made preps opens the prep library', await pg.locator('#meal-prep-lib').count() == 1)
        # the tour follows the new layout
        stops = await ev("MEALS_TOUR.map(s => s[3])")
        check('the Meals tour follows Plan, Shop, cook, Log', stops[1] == '1. Your dates' and '3. Each day' in stops and '5. Shop' in stops and '6. Log' in stops, stops)
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        found = await ev("MEALS_TOUR.filter(s => s[5].meals === 'plan' && s[2]).every(s => !!document.querySelector(s[2]))")
        check('every Plan stop finds its spot on the page', found)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
