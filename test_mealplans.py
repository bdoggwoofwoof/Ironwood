"""Whole-food Sunday prep and the four-week bowl rotation in Meals: every recipe resolves, counts nutrition fully, has a
shopping aisle and no beef, pork or cheese; each prep can be used and fills the shopping list."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8777
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
PREPS = ['p-wholefood', 'p-bowls-levant', 'p-bowls-korea', 'p-bowls-latin', 'p-bowls-southern']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        info = await ev("""ids => { const P = MEAL_PREPS.filter(p => ids.includes(p.id)); const rs = [...new Set(P.flatMap(p => p.items.map(i => i[0])))].map(getRecipe);
          return { preps: P.map(p => [p.id, p.items.length]), missingRecipe: rs.filter(r => !r).length,
            noNut: rs.filter(r => { const m = macros(r); return !m || m.missing.length; }).map(r => r.id),
            noAisle: rs.flatMap(r => r.ing.filter(g => g.a === 'other').map(g => r.id + ':' + g.n)),
            meat: rs.flatMap(r => r.ing.filter(g => /\\b(beef|pork|bacon|ham|sausage|cheese|parmesan|cheddar|feta)\\b/i.test(g.n)).map(g => r.id + ':' + g.n)),
            protein: rs.filter(r => /thighs|crumble/i.test(r.name)).map(r => macros(r).p) }; }""", PREPS)
        check('five new preps', [x[0] for x in info['preps']] == PREPS and all(n >= 9 for _, n in info['preps']), info['preps'])
        check('every recipe in them exists', info['missingRecipe'] == 0)
        check('nutrition counts every ingredient', not info['noNut'], info['noNut'])
        check('every ingredient has a shopping aisle', not info['noAisle'], info['noAisle'])
        check('no beef, pork or cheese', not info['meat'], info['meat'])
        check('proteins land around 25-35 g a serving', all(24 <= p <= 36 for p in info['protein']), info['protein'])
        check('liver note on every crumble', await ev("['m-liver-crumble','m-crumble-levant','m-crumble-ginger','m-crumble-taco','m-crumble-sage'].every(id => /2–3 servings a week/.test(getRecipe(id).note))"))
        # use a prep and see the list
        await pg.locator('.tabs button', has_text='Meals').click(); await pg.locator('.topsw button', has_text='Prep').click(); await pg.wait_for_timeout(300)
        card = pg.locator('.prep-card', has_text='Bowl Rotation 2: Korea & Japan')
        check('bowl week shows its signature bowls', 'Bibimbap' in await card.inner_text())
        await card.locator('button', has_text='Use this prep').click(); await pg.wait_for_timeout(300)
        check('prep fills the plan', await ev("ML().plan.items.length") == 9)
        await pg.locator('.topsw button', has_text='List').click(); await pg.wait_for_timeout(300)
        lst = (await pg.locator('main').inner_text()).lower()
        check('shopping list adds it up', all(w in lst for w in ['chicken thighs', 'ground turkey', 'chicken livers', 'gochujang', 'broccoli']), lst[:200])
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
