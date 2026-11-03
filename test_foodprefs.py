"""Food preferences (allergies, diet, dislikes), recipe sources, recipes from a post, recipes from the reels (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8790
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
POST = """High protein chicken bowls 🔥
Ingredients:
- 2 lb chicken breast
- 1 cup rice
- 2 tbsp soy sauce
- 1 tsp garlic powder
Steps:
1. Cook the rice.
2. Season and bake the chicken at 425 for 20 minutes.
3. Slice and serve over rice.
Follow for more! #mealprep
https://www.instagram.com/reel/ABC123/"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        # reels recipes
        rr = await ev("['m-reel-chicken-rice', 'm-reel-cereal-shake', 'm-reel-half-plate', 'm-reel-ice-cream', 'm-reel-burger-bowls'].map(id => { const r = getRecipe(id); const m = r && macros(r); return [id, !!r, r && r.src && r.src.url, m && Math.round(m.kcal), m && m.missing.length]; })")
        check('five recipes from the reels, each with its reel link', all(x[1] and x[2] and x[2].startswith('https://www.instagram.com/reel/') for x in rr), rr)
        check('their macros come from the ingredients (nothing missing)', all(x[4] == 0 for x in rr), rr)
        check('cereal + shake breakfast is a big one (about 900 kcal)', 750 <= rr[1][3] <= 1050, rr[1])
        await ev("UI.setTab('meals'); UI.setView({ type: 'meal', id: 'm-reel-cereal-shake' })"); await pg.wait_for_timeout(250)
        src = await pg.inner_text('#recipe-src') if await pg.locator('#recipe-src').count() else ''
        href = await ev("document.querySelector('#recipe-src a') && document.querySelector('#recipe-src a').href") or ''
        check('source shown at the bottom with the creator and a link', '@itsoliverdraisey' in src and href.startswith('https://www.instagram.com/reel/'), [src, href])
        check('the link opens outside the app', await ev("document.querySelector('#recipe-src a').target") == '_blank')
        # preferences
        iss = await ev("(() => { mealCommit(m => { m.prefs = { allergies: ['dairy', 'peanut'], diet: 'none', dislikes: 'mushrooms, pickles' }; }); return { shake: recipeIssues(getRecipe('m-reel-cereal-shake')), burger: recipeIssues(getRecipe('m-reel-burger-bowls')), rice: recipeIssues(getRecipe('m-reel-chicken-rice')) }; })()")
        check('allergy flags a recipe (dairy in the shake)', 'Dairy' in iss['shake']['block'], iss['shake'])
        check('dislike flags a recipe (pickles in burger bowls)', 'pickles' in iss['burger']['dislike'], iss['burger'])
        check('a clean recipe has no flags', not iss['rice']['block'] and not iss['rice']['dislike'], iss['rice'])
        pool = await ev("(() => { const P = planPool(); return [...P.b, ...P.m, ...P.s].map(r => r.id); })()")
        check('meal plans skip allergy and dislike recipes', 'm-reel-cereal-shake' not in pool and 'm-reel-burger-bowls' not in pool, pool)
        bad = await ev("(() => { const P = planPool(); return [...P.b, ...P.m, ...P.s].filter(r => recipeIssues(r).block.length || recipeIssues(r).dislike.length).map(r => r.name); })()")
        check('no plan recipe goes against your answers', not bad, bad)
        await pg.wait_for_timeout(150)
        check('recipe page warns', await pg.locator('.issue-line.bad', has_text='Dairy').count() == 1)
        await ev("mealCommit(m => { m.prefs = { allergies: [], diet: 'vegetarian', dislikes: '' }; })")
        veg = await ev("(() => { const P = planPool(); return [...P.b, ...P.m, ...P.s].filter(r => (r.ing || []).some(g => /chicken|turkey|beef|salmon|tuna/.test(String(g.n)))).map(r => r.name); })()")
        check('vegetarian: no meat or fish in plans', not veg, veg)
        # questionnaire sheet
        await ev("UI.setView(null); setMealsMode('plan'); mealCommit(m => { delete m.prefs; })"); await pg.wait_for_timeout(200)
        await ev("openSheet({ type: 'mealPrefs' })"); await pg.wait_for_timeout(150)
        await pg.click('#al-shellfish'); await pg.click('#diet-halal'); await pg.fill('#pf-dislikes', 'olives'); await pg.click('#pf-save'); await pg.wait_for_timeout(200)
        check('questionnaire saves', await ev("JSON.stringify(ML().prefs)") == '{"allergies":["shellfish"],"diet":"halal","dislikes":"olives"}')
        await ev("openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(150)
        check('meal plan setup asks the food questions too', await pg.locator('.sheet #prefs-fields').count() == 1 and await pg.locator('.sheet #al-shellfish.on').count() == 1)
        await ev("closeSheet()")
        # from a post
        await ev("setMealsMode('recipes')"); await pg.wait_for_timeout(200)
        await pg.click('#from-post'); await pg.wait_for_timeout(200)
        await pg.fill('#paste-text', POST); await pg.click('#paste-fill'); await pg.wait_for_timeout(150)
        f = await ev("({ name: document.querySelector('#me-name').value, ing: document.querySelector('#me-ing').value.split('\\n'), steps: document.querySelector('#me-steps').value.split('\\n'), src: document.querySelector('#me-src').value })")
        check('post fills name, ingredients, steps and link', f['name'].startswith('High protein chicken bowls') and len(f['ing']) == 4 and len(f['steps']) == 3 and f['src'] == 'https://www.instagram.com/reel/ABC123/', f)
        check('hashtags and "follow" lines left out', not any('Follow' in s or '#' in s for s in f['ing'] + f['steps']))
        await pg.locator('button', has_text='Save recipe').first.click(); await pg.wait_for_timeout(300)
        saved = await ev("Object.values(ML().recipes).find(r => /High protein chicken/.test(r.name))")
        check('saved recipe keeps its source link', saved and saved['src']['url'] == 'https://www.instagram.com/reel/ABC123/', saved and saved.get('src'))
        check('...shown at the bottom as instagram.com', 'instagram.com' in (await pg.inner_text('#recipe-src') if await pg.locator('#recipe-src').count() else ''))
        check('prefs survive reload', await ev("normMeals(JSON.parse(JSON.stringify(ML()))).prefs.diet") == 'halal')
        al = await ev("""(() => { mealCommit(m => { m.prefs = { allergies: ['dairy', 'gluten', 'treenut', 'shellfish'], diet: 'none', dislikes: '' }; });
          const t = ing => recipeIssues({ name: 'x', ing: ing.map(n => ({ n })) }).block;
          return { almondmilk: t(['almond milk']), pb: t(['peanut butter']), ghee: t(['ghee']), ricenoodle: t(['rice noodles']), bulgur: t(['bulgur']), coconut: t(['coconut flakes']), butternut: t(['butternut squash']), prawn: t(['prawns']) }; })()""")
        check('allergy synonyms are caught (ghee, bulgur, prawns)', 'Dairy' in al['ghee'] and 'Gluten / wheat' in al['bulgur'] and 'Shellfish' in al['prawn'], al)
        check('look-alikes are not flagged (almond milk as dairy, rice noodles, butternut, coconut)', 'Dairy' not in al['almondmilk'] and 'Dairy' not in al['pb'] and not al['ricenoodle'] and not al['butternut'] and not al['coconut'], al)
        await ev("mealCommit(m => { m.prefs = { allergies: [], diet: 'none', dislikes: '' }; })")
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
