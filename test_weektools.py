"""Change or clear this week (Nov 11, Newt): Clear everything sits at the bottom with a warning, under smaller options
that change one thing without starting over."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8825
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
        await ev("UI.setTab('meals'); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        check('nothing to clear on an empty week', await pg.locator('#week-tools').count() == 0)
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; }); openSheet({ type: 'mealTargets', step: 2 })"); await pg.wait_for_timeout(300)
        await pg.click('#tg-save'); await pg.wait_for_timeout(5500)
        check('the top Clear button is gone', await ev("(() => { const c = document.querySelector('#plan-clear'); const t = document.querySelector('#week-tools'); return !!c && !!t && t.contains(c); })()"))
        check('Change or clear sits at the bottom, after the ready-made preps', await ev("!!(document.querySelector('#ready-preps').compareDocumentPosition(document.querySelector('#week-tools')) & Node.DOCUMENT_POSITION_FOLLOWING)"))
        check('Clear everything is the last option', await ev("(() => { const t = document.querySelector('#week-tools'); const bs = [...t.querySelectorAll('button')]; return bs[bs.length - 1].id === 'plan-clear'; })()"))
        seed = await ev("ML().menu.seed")
        await pg.click('#wt-reroll'); await pg.wait_for_timeout(300)
        check('Different meals gives a new week', await ev("ML().menu.seed") != seed)
        # skip + ticks
        await ev("mealCommit(m => { m.skip = { '3:l': true }; m.checks = { a: true, b: true }; }); S.rerender()"); await pg.wait_for_timeout(200)
        check('offers Bring back skipped meals', await pg.locator('#wt-unskip').count() == 1)
        await pg.click('#wt-unskip'); await pg.wait_for_timeout(200); await pg.click('.sheet .btn.primary'); await pg.wait_for_timeout(300)
        check('...which brings them back', not await ev("!!ML().skip"))
        await ev("mealCommit(m => { m.checks = { a: true, b: true }; }); S.rerender()"); await pg.wait_for_timeout(200)
        await pg.click('#wt-untick'); await pg.wait_for_timeout(200); await pg.click('.sheet .btn.primary'); await pg.wait_for_timeout(300)
        check('Untick the shopping list only unticks', await ev("Object.keys(ML().checks).length === 0 && !!ML().menu && ML().plan.items.length > 0"))
        n = await ev("ML().plan.items.length")
        await pg.click('#wt-drop-menu'); await pg.wait_for_timeout(200); await pg.click('.sheet .btn.primary'); await pg.wait_for_timeout(300)
        check('Remove the meal plan only keeps what you cook', await ev("!ML().menu") and await ev("ML().plan.items.length") == n)
        await pg.click('#wt-empty-cook'); await pg.wait_for_timeout(200); await pg.click('.sheet .btn.primary'); await pg.wait_for_timeout(300)
        check("Empty what you'll cook empties it", await ev("ML().plan.items.length") == 0)
        check('with nothing left, the card goes away', await pg.locator('#week-tools').count() == 0)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
