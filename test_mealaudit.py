"""Meal plan audit (Nov 10): making a plan fills the prep and shopping list (M1), an empty List points to the plan (M10),
no repeated subtitle (M11), two amount options (M6), the day total says how it compares with the protein target (M7)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8789
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
        await ev("UI.setTab('meals'); setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        check('M11: no shared subtitle', 'logged, planned and shopped for' not in await pg.inner_text('body'))
        check('M10: empty List offers Plan my week', await pg.locator('#list-plan').count() == 1)
        await pg.click('#list-plan'); await pg.wait_for_timeout(300)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '180'); await pg.fill('#tg-age', '30')
        await pg.click('#tg-save'); await pg.wait_for_timeout(600)
        n = await ev("ML().plan.items.length"); lst = await ev("shoppingList().length")
        check('M1: making the plan fills the prep', n >= 3, n)
        check('M1: and the shopping list', lst >= 5, lst)
        check('M1: the plan card points to the list instead of Use for my prep', await pg.locator('#plan-list').count() == 1 and await pg.locator('#plan-use').count() == 0)
        before = await ev("ML().plan.items.map(i => i.r).sort().join()")
        await pg.click('#plan-shuffle'); await pg.wait_for_timeout(300)
        after = await ev("ML().plan.items.map(i => i.r).sort().join()")
        want = await ev("(() => { const w = {}; for (const d of ML().menu.days) for (const x of d) w[x.r] = 1; return Object.keys(w).sort().join(); })()")
        check('M1: Different meals and the list follows', after == want, (before == after, after[:80], want[:80]))
        tot = await pg.inner_text('#menu-total')
        check('M7: the day total compares protein with the target', 'protein on target' in tot or 'vs your target' in tot, tot)
        check('M6: two amount options', await ev("[...document.querySelectorAll('#units-seg button')].map(b => b.textContent)") == ['Easy amounts', 'By weight'])
        check('edit answers is labeled', 'Edit my answers' in await pg.inner_text('#menu-card'))
        # a prep you built yourself is not replaced without asking
        await ev("addToPlan('m-turkey-chili', 2)"); await pg.wait_for_timeout(200)
        check('adding a recipe makes it your own prep', not await ev("!!ML().plan.fromMenu"))
        mine = await ev("ML().plan.items.length")
        await ev("openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(300); await pg.click('#tg-save'); await pg.wait_for_timeout(500)
        check('remaking the plan keeps your own prep', await ev("ML().plan.items.length") == mine and await ev("ML().plan.items.some(i => i.r === 'm-turkey-chili')"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
