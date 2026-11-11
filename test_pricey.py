"""Keep it cheap with a pick list of pricey things (Nov 11, Newt), Leave out of my meal plans on a recipe (no meatballs),
and a cheaper frozen protein treat linked from the protein ice cream."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8820
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
        # Pricey list
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; }); UI.setTab('meals'); setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets', step: 2 })"); await pg.wait_for_timeout(400)
        check('no pricey list until Keep it cheap is on', await pg.locator('#pricey-menu').count() == 0)
        await pg.click('#hb-cheap'); await pg.wait_for_timeout(150)
        check('Keep it cheap opens a list of pricey things', await pg.locator('#pricey-menu input').count() == 9)
        check('all of them start left out', await ev("[...document.querySelectorAll('#pricey-menu input')].every(i => i.checked)"))
        await pg.click('#pr-powder'); await pg.wait_for_timeout(100)
        await pg.click('#tg-save'); await pg.wait_for_timeout(600)
        H = await ev("ML().habits")
        check('the choice is saved', H.get('cheap') and 'powder' not in H.get('pricey', []) and 'fish' in H.get('pricey', []), H)
        check('salmon stays out of the pool', not await ev("planPool().m.some(r => /salmon/i.test(r.name))"))
        check('protein powder recipes are allowed again', await ev("planPool().s.some(r => r.id === 'm-reel-ice-cream')"))
        await ev("mealCommit(m => { m.habits = { ...m.habits, pricey: ['powder'] }; })")
        check('turning powder back on keeps the ice cream out', not await ev("planPool().s.some(r => r.id === 'm-reel-ice-cream')"))
        check('a list item that would empty a group is ignored, not fatal', await ev("(mealCommit(m => { m.habits = { ...m.habits, pricey: PRICEY_ITEMS.map(x => x[0]) }; }), !!buildMenu(ML().menu.t, 5))"))
        # Leave out of my meal plans
        await ev("UI.setView({ type: 'meal', id: 'm-meatballs' })"); await pg.wait_for_timeout(300)
        check('recipe has Leave out of my meal plans', await pg.locator('#rec-noplan').count() == 1)
        await pg.click('#rec-noplan'); await pg.wait_for_timeout(400)
        check('saved', await ev("ML().noPlan['m-meatballs'] === true"))
        check('meatballs leave the pool', not await ev("planPool().m.some(r => r.id === 'm-meatballs')"))
        check('...and the current plan', not await ev("ML().menu.days.some(d => d.some(x => x.r === 'm-meatballs'))"))
        check('...and what you cook', not await ev("ML().plan.items.some(i => i.r === 'm-meatballs')"))
        for s in [11, 22, 33, 44]:
            if await ev(f"(() => {{ const M = buildMenu(ML().menu.t, {s}); return !!M && M.days.some(d => d.some(x => x.r === 'm-meatballs')); }})()"):
                check('Different meals never brings them back', False, s); break
        else:
            check('Different meals never brings them back', True)
        await pg.click('#rec-noplan'); await pg.wait_for_timeout(300)
        check('switching it off puts them back', await ev("planPool().m.some(r => r.id === 'm-meatballs')"))
        # Cheaper frozen treat
        await ev("UI.setView({ type: 'meal', id: 'm-reel-ice-cream' })"); await pg.wait_for_timeout(300)
        check('ice cream points to a cheaper option', 'Cheaper option' in await pg.inner_text('#recipe-alt'))
        await pg.click('#recipe-alt'); await pg.wait_for_timeout(300)
        check('opens the Greek yogurt freezer cups', 'greek yogurt freezer cups' in (await pg.inner_text('.meal-title')).lower())
        m = await ev("macros(getRecipe('m-froyo-cups'))")
        check('freezer cups count protein without powder', m['p'] >= 20 and not m['missing'], m)
        check('no protein powder or machine in it', not await ev("getRecipe('m-froyo-cups').ing.some(g => /protein powder|whey/.test(g.n))"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
