"""Slow-cooker recipes (Nov 11, Newt): five slow-cooker mains, Favor slow-cooker recipes in How you eat, a Slow-Cooker
Week prep, and the chili swapped out of the ready-made preps."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8822
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SC = ['m-sc-salsa-chicken', 'm-sc-tikka', 'm-sc-shawarma', 'm-sc-honey-garlic', 'm-sc-lentil-soup']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        info = await ev(f"{SC}.map(id => {{ const r = getRecipe(id); const m = macros(r); return [id, !!r, m && m.kcal, m && m.p, m && m.missing.length, r && recipeGear(r).need.join()]; }})")
        check('five slow-cooker mains', all(x[1] for x in info), info)
        check('their macros come from the ingredients', all(x[4] == 0 for x in info), info)
        check('each is a real meal (300+ kcal, 20+ g protein)', all(x[2] >= 300 and x[3] >= 20 for x in info), info)
        check('each needs only the slow cooker', all(x[5] == 'slow' for x in info), info)
        check('no beef, pork or cheese in them', not await ev(f"{SC}.some(id => getRecipe(id).ing.some(g => /beef|pork|bacon|cheese/.test(g.n)))"))
        check('the chili is still in Recipes', await ev("allRecipes().some(r => r.id === 'm-turkey-chili')"))
        check('...but never in a meal plan', not await ev("planPool().m.some(r => r.id === 'm-turkey-chili')") and not await ev("[1,2,3,4,5,6,7,8].some(s => { const M = buildMenu({ kcal: 2400, p: 150, c: 250, f: 80 }, s * 977); return M && M.days.some(d => d.some(x => x.r === 'm-turkey-chili')); })"))
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: 'chili' }; })")
        check('not liking chili flags the chili dish', await ev("recipeIssues(getRecipe('m-turkey-chili')).dislike") == ['chili'])
        check('...but not chili powder or chili-lime chicken', await ev("!recipeIssues(getRecipe('m-sc-salsa-chicken')).dislike.length && !recipeIssues(getRecipe('m-thighs-chili-lime')).dislike.length"))
        check('...so no ready-made prep says has chili', await ev("MEAL_PREPS.filter(p => prepIssues(p).length).map(p => p.name)") == [])
        check('curry powder works the same way', await ev("(mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: 'curry' }; }), recipeIssues({ name: 'Rice', ing: [{ n: 'curry powder' }] }).dislike.length === 0 && recipeIssues({ name: 'Chickpea Curry', ing: [] }).dislike.length === 1)"))
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: '' }; })")
        check('no chili left in the ready-made preps', not await ev("MEAL_PREPS.some(p => p.items.some(([r]) => r === 'm-turkey-chili'))"))
        # Favor slow-cooker recipes
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; }); UI.setTab('meals'); setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets', step: 2 })"); await pg.wait_for_timeout(400)
        check('How you eat has Favor slow-cooker recipes', await pg.locator('#hb-slow').count() == 1)
        await pg.click('#hb-slow'); await pg.click('#tg-save'); await pg.wait_for_timeout(600)
        check('saved', await ev("ML().habits.slow === true"))
        mains = await ev("[...new Set(ML().menu.days.flatMap(d => d.filter(x => x.slot === 'l' || x.slot === 'd').map(x => x.r)))]")
        check('lunches and dinners are slow-cooker recipes', mains and await ev(f"{mains}.every(id => isSlowRecipe(getRecipe(id)))"), mains)  # any slow-cooker recipe, incl. the reel ones (Nov 11)
        await ev("PREP_UI.all = true; S.rerender()"); await pg.wait_for_timeout(200)
        first = await ev("[...document.querySelectorAll('#ready-preps .ready-row b')].map(b => b.textContent)")
        check('Slow-Cooker Week is picked for you', 'Slow-Cooker Week' in first[:4], first)
        await ev("mealCommit(m => { m.habits = { ...m.habits, slow: false }; })")
        check('turned off, the plan can use other mains', await ev("planPool().m.some(r => !/slow cooker/i.test(r.steps.join(' ')))"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
