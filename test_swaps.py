"""Swaps (Nov 11, Newt): recipes trade what you can't or won't eat instead of disappearing, beef and pork can be
traded on purpose, and two preps built for halal, lactose intolerant, no beef, pork or cheese come first for anyone
with those answers."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8819
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
NEWT = "{ allergies: [], diets: ['halal', 'lactose'], lactose: ['milk', 'cream', 'softcheese', 'hardcheese'], dislikes: 'cheese, pork, beef' }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        check('no swaps without answers', await ev("!getRecipe('m-reel-burger-bowls').swaps"))
        check('halal no longer trips on "crumble" or "crumbs"', not await ev("(mealCommit(m => { m.prefs = { allergies: [], diets: ['halal'], dislikes: '' }; }), avoidRecipe(getRecipe('m-meatballs')) || avoidRecipe(getRecipe('m-crumble-levant')))"))
        check('halal still blocks bacon', await ev("recipeIssues({ name: 'x', ing: [{ n: 'bacon' }] }).block.length") == 1)
        check('...but not turkey bacon', await ev("recipeIssues({ name: 'x', ing: [{ n: 'turkey bacon' }] }).block.length") == 0)
        await ev(f"mealCommit(m => {{ m.prefs = {NEWT}; }})")
        r = await ev("getRecipe('m-reel-burger-bowls')")
        names = [g['n'] for g in r['ing']]
        check('burger bowls use ground turkey', any('ground turkey' in n for n in names) and not any('beef' in n for n in names), names)
        check('cheese is left out', not any('cheese' in n for n in names))
        check('steps say turkey and skip the cheese', 'beef' not in ' '.join(r['steps']).lower() and 'cheese' not in ' '.join(r['steps']).lower(), r['steps'])
        check('swapped recipe has no issues left', await ev("!avoidRecipe(getRecipe('m-reel-burger-bowls'))"))
        check('milk becomes lactose-free milk', await ev("getRecipe('m-overnight-oats').ing.some(g => g.n === 'lactose-free milk')"))
        check('lactose-free milk passes lactose intolerant', await ev("recipeIssues({ name: '', ing: [{ n: 'lactose-free milk' }] }).block.length") == 0)
        check('the original recipe is untouched underneath', await ev("getRecipeRaw('m-reel-burger-bowls').ing.some(g => /beef/.test(g.n))"))
        check('dairy allergy gets a dairy-free milk instead', await ev("(mealCommit(m => { m.prefs = { allergies: ['dairy'], diets: [], dislikes: '' }; }), /almond milk|oat milk/.test(getRecipe('m-overnight-oats').ing.map(g => g.n).join()))"))
        check('dairy allergy: butter becomes olive oil', await ev("swapIng('unsalted butter', prefsOf()).to") == 'olive oil')
        # Trade proteins on purpose
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: '', swap: { beef: 'chicken' } }; })")
        check('Beef → Chicken trades even when beef is fine', await ev("getRecipe('m-reel-burger-bowls').ing.some(g => /ground chicken/.test(g.n))"))
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: '', swap: { beef: 'keep' } }; })")
        check('Keep beef keeps it', await ev("getRecipe('m-reel-burger-bowls').ing.some(g => /ground beef/.test(g.n))"))
        # The sheet
        await ev(f"mealCommit(m => {{ m.prefs = {NEWT}; }}); openSheet({{ type: 'mealPrefs' }})"); await pg.wait_for_timeout(300)
        check('Trade out proteins is in Food preferences', await pg.locator('#swap-fields').count() == 1)
        check('no Keep beef when you would rather not have beef', await pg.locator('#sw-beef-keep').count() == 0 and await pg.locator('#sw-beef-turkey.on').count() == 1)
        await pg.click('#sw-beef-chicken'); await pg.click('#pf-save'); await pg.wait_for_timeout(300)
        check('choice is saved', await ev("prefsOf().swap.beef") == 'chicken')
        check('...and used', await ev("getRecipe('m-reel-burger-bowls').ing.some(g => /ground chicken/.test(g.n))"))
        # Recipe page lists the swaps
        await ev("UI.setTab('meals'); UI.setView({ type: 'meal', id: 'm-reel-burger-bowls' })"); await pg.wait_for_timeout(300)
        t = await pg.inner_text('#recipe-swaps')
        check('recipe shows what was swapped', 'ground chicken' in t and 'left out' in t, t)
        await ev("UI.setView(null); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        first = await ev("[...document.querySelectorAll('#ready-preps .ready-row b')].slice(0, 2).map(b => b.textContent)")
        check('preps built for these answers come first', first == ['Halal, Dairy-Light Week', 'Turkey Burger Bowl Week'], first)
        check('...marked as picked for you', await pg.locator('#ready-preps .fit-tag').count() == 3)  # + Reel Favorites Week (Nov 11)
        await pg.locator('#ready-preps .ready-h').first.click(); await pg.wait_for_timeout(200)
        check('an open prep lists its swaps', 'Swapped for you' in await pg.inner_text('#ready-preps'))
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: [], dislikes: '' }; }); S.rerender()"); await pg.wait_for_timeout(200)
        check('without those answers they are not marked', await pg.locator('#ready-preps .fit-tag').count() == 0)
        await ev(f"mealCommit(m => {{ m.prefs = {NEWT}; }})")
        check('meal plan pool gets the turkey meatballs back (halal fix)', await ev("planPool().m.some(r => r.id === 'm-meatballs')"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
