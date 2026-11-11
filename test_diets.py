"""Diets (Nov 10, Newt): more than one diet at once, and Lactose intolerant with a menu of dairy foods to leave out."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8791
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        # an old save with one diet string still reads
        await ev("mealCommit(m => { m.prefs = { allergies: [], diet: 'halal', dislikes: '' }; })")
        check('old single diet still works', await ev("prefsOf().diets") == ['halal'])
        await ev("openSheet({ type: 'mealPrefs' })"); await pg.wait_for_timeout(300)
        await pg.click('#diet-vegetarian'); await pg.wait_for_timeout(100)
        on = await ev("[...document.querySelectorAll('[id^=diet-][aria-pressed=true]')].map(e => e.id)")
        check('two diets can be on at once', set(on) == {'diet-halal', 'diet-vegetarian'}, on)
        check('no lactose menu until Lactose intolerant is on', await pg.locator('#lactose-menu').count() == 0)
        await pg.click('#diet-lactose'); await pg.wait_for_timeout(200)
        check('Lactose intolerant opens a menu of dairy foods', await pg.locator('#lactose-menu input').count() >= 8)
        labels = await ev("[...document.querySelectorAll('#lactose-menu .toggle-row')].map(r => r.textContent)")
        check('menu lists cheese, butter, yogurt and Greek yogurt', all(any(w in l for l in labels) for w in ['cheese', 'Butter', 'Yogurt', 'Greek yogurt']), labels)
        check('milk starts left out, butter starts allowed', await ev("document.querySelector('#lac-milk').checked && !document.querySelector('#lac-butter').checked"))
        await pg.click('#lac-butter'); await pg.click('#lac-milk'); await pg.wait_for_timeout(100)
        await pg.click('#pf-save'); await pg.wait_for_timeout(300)
        P = await ev("prefsOf()")
        check('saves all three diets and the choices', set(P['diets']) == {'halal', 'vegetarian', 'lactose'} and 'butter' in P['lactose'] and 'milk' not in P['lactose'], P)
        iss = await ev("recipeIssues({ name: 'Test', ing: ['2 tbsp butter', '1 cup milk', '1 cup almond milk', '1 tbsp peanut butter'] })")
        check('a recipe with butter is blocked; milk now allowed; almond milk and peanut butter are fine', 'Butter and ghee' in iss['block'] and 'Milk' not in iss['block'], iss)
        iss2 = await ev("recipeIssues({ name: 'Bowl', ing: ['1 cup Greek yogurt', '4 oz chicken'] })")
        check('vegetarian still applies alongside', any('vegetarian' in x for x in iss2['block']), iss2)
        await ev("openSheet({ type: 'mealPrefs' })"); await pg.wait_for_timeout(300)
        await pg.click('#diet-none'); await pg.wait_for_timeout(100)
        check('No restrictions clears the diets', await ev("[...document.querySelectorAll('[id^=diet-][aria-pressed=true]')].map(e => e.id)") == ['diet-none'])
        await ev("closeSheet()")
        # Foods you don't like
        check('"cheese beef" reads as two foods', await ev("parseDislikes('cheese beef')") == ['cheese', 'beef'])
        check('commas and "and" work too', await ev("parseDislikes('olives, mushrooms and cilantro')") == ['olives', 'mushrooms', 'cilantro'])
        check('a two-word food the recipes use stays together', await ev("parseDislikes('soy sauce')") == ['soy sauce'], await ev("parseDislikes('soy sauce')"))
        check('filler words are ignored', await ev("parseDislikes('no onions please')") == ['onions'])
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: 'mushrooms tomatoes' }; })")
        iss = await ev("recipeIssues({ name: 'X', ing: ['1 mushroom', '2 tomatoes, diced'] })")
        check('plurals match singulars', iss['dislike'] == ['mushrooms', 'tomatoes'], iss)
        iss = await ev("recipeIssues({ name: 'X', ing: ['1 cup tomato sauce'] })")
        check('tomatoes matches tomato', iss['dislike'] == ['tomatoes'], iss)
        await ev("openSheet({ type: 'mealPrefs' })"); await pg.wait_for_timeout(300)
        await pg.fill('#pf-dislikes', 'cheese beef'); await pg.wait_for_timeout(150)
        check('the sheet shows what it understood', 'cheese · beef' in await pg.inner_text('#pf-dislikes-read'))
        await ev("closeSheet()")
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
