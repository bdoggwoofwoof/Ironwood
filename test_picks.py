"""The meal plan follows the recipes you picked (Nov 11, Newt picked dishes and the day-by-day plan showed others)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8827
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
IDS = "[...new Set(ML().menu.days.flatMap(d => d.map(x => x.r)))]"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("mealCommit(m => { m.me = { h: 178, w: 82, age: 30, sex: 'm', act: 1.55, us: true }; }); UI.setTab('meals'); setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets', step: 2 })"); await pg.wait_for_timeout(300)
        await pg.click('#tg-save'); await pg.wait_for_timeout(800)
        picks = ['m-egg-muffins', 'm-sc-tikka', 'm-sc-shawarma', 'm-hb-eggs']
        await ev(f"mealCommit(m => {{ m.plan.items = {picks}.map((r, i) => ({{ id: 'p' + i, r, n: 4 }})); delete m.plan.fromMenu; }}); S.rerender()"); await pg.wait_for_timeout(600)
        ids = await ev(IDS)
        check('the day-by-day plan uses only the recipes you picked', ids and all(i in picks for i in ids), ids)
        check('the card says it is from what you picked', 'from what you picked' in (await pg.inner_text('#menu-card')).lower())
        await ev("addToPlan('m-sc-honey-garlic', 3)"); await pg.wait_for_timeout(600)
        check('adding a recipe brings it into the plan', 'm-sc-honey-garlic' in await ev(IDS))
        await ev("removeFromPlan('m-sc-tikka'); S.rerender()"); await pg.wait_for_timeout(600)
        check('removing one takes it out', 'm-sc-tikka' not in await ev(IDS))
        await ev("mealCommit(m => { m.plan.items = [{ id: 'q', r: 'm-sc-shawarma', n: 7 }]; }); S.rerender()"); await pg.wait_for_timeout(600)
        b_ids = await ev("[...new Set(ML().menu.days.flatMap(d => d.filter(x => x.slot === 'b').map(x => x.r)))]")
        check('a meal type you picked nothing for still gets filled', len(b_ids) >= 1, b_ids)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
