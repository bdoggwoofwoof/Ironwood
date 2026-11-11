"""Amounts in the steps (Nov 11, Newt): each step shows how much of each ingredient, scaled to your batch, and
splits like half or the rest of the garlic are worked out."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8828
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
FLAT = "(id, f) => stepsWithAmounts(getRecipe(id), f).map(ps => ps.map(p => typeof p === 'string' ? p : '[' + p.amt + ']').join(''))"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        sh = await ev(f"({FLAT})('m-sc-shawarma', 1)")
        check('two-thirds of the garlic says how many cloves', 'two-thirds of the garlic[4 cloves]' in sh[0], sh[0])
        check('the rest of the garlic is what is left', 'the rest of the garlic[2 cloves]' in sh[2], sh[2])
        check('chicken thighs are found as "the chicken"', 'chicken[3 lb]' in sh[0], sh[0])
        check('counts say what they count', 'onions[2 onions]' in sh[0] and 'lemon juice[2 lemons]' in sh[0], sh[0])
        check('a second mention without a split gets no amount', 'Pack rice, chicken and onions,' in sh[3], sh[3])
        sp = await ev(f"({FLAT})('m-sheet-pan', 1)")
        check('half the oil', 'half the oil[1½ tbsp]' in sp[1], sp[1])
        sh2 = await ev(f"({FLAT})('m-sc-shawarma', 1.5)")
        check('amounts scale with the batch', 'chicken[4½ lb]' in sh2[0] and 'garlic[6 cloves]' in sh2[0], sh2[0])
        sf = await ev(f"({FLAT})('m-stir-fry', 1)")
        check('an amount already written in the step is left alone', 'Cook the chicken[1½ lb] in 1 tbsp oil over' in sf[2], sf[2])
        check('the spices list each spice with its amount', 'the spices[1 tbsp cumin, 1 tbsp smoked paprika, 1 tsp turmeric, ½ tsp cinnamon]' in sh[0], sh[0])
        check('salt gets its amount', 'the salt[1 tsp]' in sh[0], sh[0])
        ch = await ev(f"({FLAT})('m-turkey-chili', 1)")
        check('both tomatoes and the beans list each can', 'both tomatoes[1 can crushed tomatoes + 1 can diced tomatoes]' in ch[2] and 'kidney beans' in ch[2], ch[2])
        rv = await ev(f"({FLAT})('m-roast-veg', 1)")
        check('the vegetables and seasoning are spelled out', 'vegetables[1 head broccoli' in rv[1] and 'garlic powder' in rv[1], rv[1])
        cov = await ev("(() => { let t = 0, c = 0; for (const r of Object.values(MEAL_BUILTIN)) { const o = stepsWithAmounts(r, 1); (r.ing || []).forEach((g, i) => { if (g.q > 0) { t++; if (o.used[i]) c++; } }); } return c / t; })()")
        check('at least 95% of ingredient amounts show up in the steps', cov >= 0.95, cov)
        await ev("UI.setTab('meals'); UI.setView({ type: 'meal', id: 'm-sc-shawarma' })"); await pg.wait_for_timeout(300)
        t = await pg.inner_text('.step-list')
        check('the recipe page shows amounts in the steps', '(4 cloves)' in t and '(2 cloves)' in t, t[:160])
        await ev("UI.setView(null); mealCommit(m => { m.plan.items = [{ id: 'a', r: 'm-sc-shawarma', n: 9 }]; delete m.plan.fromMenu; }); setMealsMode('plan'); S.rerender(); UI.setView({ type: 'cook' })"); await pg.wait_for_timeout(400)
        t = await pg.inner_text('#cook-view')
        check('Start cooking shows amounts for your batch', '(6 cloves)' in t and '(4½ lb)' in t, t[:300])
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
