"""Kitchen gear (Nov 11, Newt): pick what you have; plans skip recipes that need something you don't have unless
something you have stands in, and recipes say how. Plus the setup step markers jump to a step."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8821
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        need = await ev("recipeGear(getRecipe('m-reel-ice-cream')).need")
        check('ice cream needs a pint machine (and a blender)', 'pint' in need, need)
        check('sheet-pan chicken needs the oven', 'oven' in await ev("recipeGear(getRecipe('m-sheet-pan')).need"))
        check('stir-fry needs the stovetop', 'stove' in await ev("recipeGear(getRecipe('m-stir-fry')).need"))
        check('with nothing chosen, nothing is skipped', await ev("allRecipes().every(r => !recipeGear(r).missing.length)"))
        # Setup: How you eat has the gear chips
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; }); UI.setTab('meals'); setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(400)
        check('step buttons: all three tappable once the numbers are in', await pg.locator('#tg-steps button:not([disabled])').count() == 3)
        await pg.click('#tg-go-2'); await pg.wait_for_timeout(200)
        check('How you eat has Kitchen gear', await pg.locator('#gear-fields .chip').count() == 8)
        await pg.click('#gear-pint'); await pg.click('#gear-oven'); await pg.wait_for_timeout(100)
        await pg.click('#tg-save'); await pg.wait_for_timeout(600)
        g = await ev("ML().habits.gear")
        check('gear is saved', 'pint' not in g and 'oven' not in g and 'airfryer' in g, g)
        check('no oven but an air fryer: sheet-pan chicken stays in, with a note', await ev("(() => { const x = recipeGear(getRecipe('m-sheet-pan')); return !x.missing.length && x.notes.some(n => /air-fry/i.test(n)); })()"))
        check('no pint machine but a blender: ice cream stays in, with a note', await ev("(() => { const x = recipeGear(getRecipe('m-reel-ice-cream')); return !x.missing.length && x.notes.some(n => /ice-cube tray/.test(n)); })()"))
        await ev("mealCommit(m => { m.habits = { ...m.habits, gear: ['stove'] }; })")
        x = await ev("recipeGear(getRecipe('m-sheet-pan'))")
        check('no oven and no air fryer: sheet-pan chicken is skipped', x['missing'] == ['an oven'], x)
        check('...plans leave it out', not await ev("planPool().m.some(r => r.id === 'm-sheet-pan')"))
        await ev("UI.setView({ type: 'meal', id: 'm-sheet-pan' })"); await pg.wait_for_timeout(300)
        check('recipe says what it needs', 'Needs an oven' in await pg.inner_text('#recipe-gear'))
        await ev("UI.setView({ type: 'meal', id: 'm-froyo-cups' })"); await pg.wait_for_timeout(300)
        check('freezer cups need nothing special', await pg.locator('#recipe-gear').count() == 0)
        await ev("UI.setView(null)")
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
