"""Starred plans and exercises (Nov 16, Newt)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8839
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
        await ev("UI.setTab('routines')"); await pg.wait_for_timeout(300)
        check('every plan card has a star', await pg.locator('.r-wrap .rec-star').count() >= 5)
        await pg.click('#pf-starred'); await pg.wait_for_timeout(200)
        check('Starred with none says how', await pg.locator('#ps-starred-none').count() == 1)
        await pg.click('#pf-all'); await pg.wait_for_timeout(200)
        sid = await ev("document.querySelector('#ps-fb .r-wrap .rec-star').id.slice(6)")
        await pg.click('#pstar-' + sid); await pg.wait_for_timeout(200)
        check('tapping the star stars the plan without opening it', await ev(f"isStarPlan('{sid}')") and await ev("lsGet('tab')") == 'routines' and await pg.locator('#rv-star').count() == 0)
        check('All shows a Starred section first', await pg.locator('#ps-starred').count() == 1 and await ev("document.querySelector('#ps-starred').compareDocumentPosition(document.querySelector('#ps-mine')) & 4"))
        await pg.click('#pf-starred'); await pg.wait_for_timeout(200)
        check('the Starred filter lists it', await pg.locator('#ps-starred .r-card').count() == 1)
        await ev("UI.setView({ type: 'routine', id: 'bi-ul4' })"); await pg.wait_for_timeout(300)
        await pg.click('#rv-star'); await pg.wait_for_timeout(200)
        check('a plan page can star it too', await ev("isStarPlan('bi-ul4')") and await pg.locator('#rv-star.on').count() == 1)
        # Exercises
        await ev("UI.setView(null); openSheet({ type: 'pick', title: 'Add exercise', onPick: () => closeSheet() })"); await pg.wait_for_timeout(300)
        first = await ev("document.querySelector('.pick-list .opt span').textContent")
        exid = await ev("Object.values(allEx()).find(e => e.name === 'Lat Pulldown').id")
        await pg.click('#xstar-' + exid); await pg.wait_for_timeout(200)
        check('star an exercise in the picker', await ev(f"isStarEx('{exid}')"))
        await ev("closeSheet(); openSheet({ type: 'pick', title: 'Add exercise', onPick: () => closeSheet() })"); await pg.wait_for_timeout(300)
        check('starred exercises come first', await ev("document.querySelector('.pick-list .opt span').textContent") == 'Lat Pulldown', first)
        await ev("closeSheet(); UI.setTab('stats'); UI.setView({ type: 'exercise', ex: '" + exid + "', group: '' })"); await pg.wait_for_timeout(300)
        check('an exercise page has the star, on', await pg.locator('#ex-star.on').count() == 1)
        check('stars survive a reload', await ev("JSON.parse(JSON.stringify(S.meta.settings)).starEx['" + exid + "'] === 1"))
        # Plans: Training | Meal preps
        await ev("UI.setView(null); UI.setTab('routines')"); await pg.wait_for_timeout(300)
        sw = await ev("[...document.querySelectorAll('main .topsw button')].map(b => b.textContent)")
        check('Plans has Training and Meal preps at the top', sw == ['Training', 'Meal preps'], sw)
        await pg.locator('main .topsw button', has_text='Meal preps').click(); await pg.wait_for_timeout(300)
        n = await pg.locator('#meal-prep-lib .ready-row').count()
        check('Meal preps lists the ready-made preps', n >= 5, n)
        await pg.locator('#meal-prep-lib .ready-h').first.click(); await pg.wait_for_timeout(200)
        pid = await ev("document.querySelector('#meal-prep-lib .ready-row.open').id.slice(9)")
        await pg.click('#lib-use-' + pid); await pg.wait_for_timeout(400)
        check('Use this prep fills this week and opens Meals → Week', await ev("ML().plan.items.length > 0 && lsGet('tab') === 'meals' && MEALS.mode === 'plan'"))
        await ev("UI.setTab('routines')"); await pg.wait_for_timeout(200)
        check('Plans remembers Meal preps', await pg.locator('#meal-prep-lib').count() == 1)
        await pg.locator('main .topsw button', has_text='Training').click(); await pg.wait_for_timeout(200)
        check('Training shows the plan library', await pg.locator('#plan-filters').count() == 1)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
