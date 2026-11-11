"""Starred recipes (Nov 11, Newt): star recipes in Recipes or on a recipe, a Starred filter, and a meal plan built from
them that updates itself when you star or unstar one."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8824
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
MENU_IDS = "[...new Set(ML().menu.days.flatMap(d => d.map(x => x.r)))]"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("UI.setTab('meals'); setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        check('each recipe row has a star', await pg.locator('.meal-row .rec-star').count() >= 5)
        await pg.locator('.meal-row', has_text='Protein Overnight Oats').locator('.rec-star').click(); await pg.wait_for_timeout(200)
        check('tapping it stars the recipe', await ev("isStarred('m-overnight-oats')"))
        check('the star fills in', await pg.locator('.meal-row', has_text='Protein Overnight Oats').locator('.rec-star.on').count() == 1)
        await ev("UI.setView({ type: 'meal', id: 'm-sc-tikka' })"); await pg.wait_for_timeout(300)
        await pg.click('#rec-star'); await pg.wait_for_timeout(200)
        check('a recipe page can star it too', await ev("isStarred('m-sc-tikka')") and await pg.locator('#rec-star.on').count() == 1)
        await ev("UI.setView(null); ['m-sc-shawarma', 'm-sc-honey-garlic', 'm-hb-eggs'].forEach(id => mealCommit(m => { m.stars = { ...(m.stars || {}), [id]: true }; })); setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click("button.chip:has-text('Starred')"); await pg.wait_for_timeout(200)
        check('Starred lists just the starred recipes', await pg.locator('.meal-row').count() == 5)
        # Week: plan from starred
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; m.goals = { kcal: 2600, p: 160, c: 280, f: 80 }; }); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        check('empty Week offers Plan from my 5 starred recipes', '5 starred' in await pg.inner_text('#plan-stars'))
        await pg.click('#plan-stars'); await pg.wait_for_timeout(600)
        ids = await ev(MENU_IDS)
        starred = ['m-overnight-oats', 'm-sc-tikka', 'm-sc-shawarma', 'm-sc-honey-garlic', 'm-hb-eggs']
        check('the week is built from the starred recipes', ids and all(i in starred for i in ids), ids)
        check('...and fills what you cook', await ev("ML().plan.fromMenu && ML().plan.items.length > 0"))
        check('the plan card says it is from your stars', 'starred' in (await pg.inner_text('#menu-card')).lower())
        # Auto-update
        await ev("toggleStar('m-sc-honey-garlic')"); await pg.wait_for_timeout(300)
        ids2 = await ev(MENU_IDS)
        check('unstarring a recipe takes it out of the plan', 'm-sc-honey-garlic' not in ids2, ids2)
        check('...and out of what you cook', not await ev("ML().plan.items.some(i => i.r === 'm-sc-honey-garlic')"))
        await ev("toggleStar('m-sc-salsa-chicken')"); await pg.wait_for_timeout(300)
        check('starring one adds it to the plan', 'm-sc-salsa-chicken' in await ev(MENU_IDS))
        # Too few stars in a slot: other recipes fill it
        await ev("mealCommit(m => { m.stars = { 'm-sc-tikka': true }; }); toggleStar('m-sc-shawarma')"); await pg.wait_for_timeout(300)
        b_ids = await ev("[...new Set(ML().menu.days.flatMap(d => d.filter(x => x.slot === 'b').map(x => x.r)))]")
        check('with no starred breakfast, breakfasts come from the rest', len(b_ids) >= 1, b_ids)
        await ev("openSheet({ type: 'mealTargets', step: 2 })"); await pg.wait_for_timeout(300)
        check('How you eat has the starred switch, on', await ev("document.querySelector('#hb-starred').checked"))
        await ev("closeSheet()")
        await ev("mealCommit(m => { m.habits = { ...m.habits, starred: false }; }); S.rerender()"); await pg.wait_for_timeout(200)
        check('a planned week offers Plan from my starred recipes when it is off', await pg.locator('#plan-use-stars').count() == 1)
        check('stars survive a reload', await ev("(S.meta.meals = normMeals(JSON.parse(JSON.stringify(S.meta.meals))), isStarred('m-sc-shawarma'))"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
