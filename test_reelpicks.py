"""Meal-prep picks from Newt's reels log (Nov 11): recipes with the creator credited, three ready-made preps, four
Mix & match flavors, all fully counted and free of beef, pork and cheese."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8829
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
NEW = ['m-reel-sc-teriyaki', 'm-reel-tikka-burritos', 'm-reel-loaf-chicken', 'm-reel-loaf-shawarma', 'm-reel-moghrabieh', 'm-reel-green-curry', 'm-reel-gochujang-coconut',
       'm-reel-greek-lemon-rice', 'm-reel-yogurt-airfryer', 'm-reel-me-baked-chicken', 'm-reel-lemon-chicken', 'm-reel-peanut-noodles', 'm-reel-chana', 'm-reel-red-lentil-soup',
       'm-reel-adas-hamod', 'm-reel-damset-adas', 'm-reel-mahmoos', 'm-reel-human-kibble', 'm-reel-edamame-salad', 'm-reel-sp-chickpea-salad', 'm-reel-steamed-chicken',
       'm-reel-vermicelli-rice', 'm-reel-mayak-eggs', 'm-reel-banana-oatmeal', 'm-reel-brownie-oatmeal', 'm-reel-tahini-granola']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        r = await ev(f"(() => {{ const ids = {NEW}; const rs = ids.map(id => MEAL_BUILTIN[id]); return [rs.every(Boolean), rs.every(r => fromReel(r) && r.src.by), rs.every(r => !macros(r).missing.length), rs.filter(r => r.ing.some(g => /beef|pork|bacon|cheese|feta|halloumi|paneer|\\bcream\\b/i.test(g.n) || (/\\bmilk\\b/i.test(g.n) && !/(oat|coconut|almond|soy|plant) milk/i.test(g.n)))).map(r => r.id), rs.filter(r => r.ing.some(g => g.a === 'other')).map(r => r.id)]; }})()")
        check('all 26 recipes are in, credited to the creator with the reel linked', r[0] and r[1], r[:2])
        check('every one is fully counted', r[2])
        check('no beef, pork, cheese, cream or dairy milk', not r[3], r[3])
        check('every ingredient has a shopping aisle', not r[4], r[4])
        r = await ev("['p-reels-faves', 'p-reels-freezer', 'p-reels-onepot'].map(id => { const pr = MEAL_PREPS.find(x => x.id === id); return pr && pr.items.every(([x]) => getRecipe(x) && macros(getRecipe(x))); })")
        check('three ready-made preps from the reels', all(r), r)
        inprep = await ev(f"(() => {{ const used = new Set(MEAL_PREPS.flatMap(p => p.items.map(i => i[0]))); return {NEW}.filter(id => !used.has(id)); }})()")
        check('the rest are in Recipes to look up', len(inprep) >= 8 and all(await ev(f"{inprep}.map(id => allRecipes().some(r => r.id === id))")), inprep)
        check('the weekend cook is never auto-picked for a plan', await ev("!!MEAL_BUILTIN['m-reel-mahmoos'].noAuto"))
        fl = await ev("['harissa-yogurt', 'greek-yogurt', 'thai-herb', 'muhammara'].map(f => MIX_BASES.filter(b => MIX_FLAVOR[f].for.includes(b.fam)).every(b => { const c = comboRecipe(b.id + '~' + f); return c && !macros(c).missing.length; }))")
        check('four new Mix & match flavors, every pairing counted', all(fl), fl)
        await ev("UI.setTab('meals'); setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click("button.chip:has-text('From reels')"); await pg.wait_for_timeout(300)
        n = await pg.locator('.meal-row').count()
        check('From reels lists them', n >= 31, n)
        await ev("UI.setView({ type: 'meal', id: 'm-reel-sc-teriyaki' })"); await pg.wait_for_timeout(300)
        txt = await pg.locator('main').inner_text()
        check('recipe page shows the creator', 'Tom Walsh' in txt)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
