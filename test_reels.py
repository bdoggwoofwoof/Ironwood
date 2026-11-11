"""Recipes tab (Nov 11, Newt): the type chips scroll sideways only (they can't be dragged up out of view), and recipes
from reels are labeled and have their own From reels filter."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8823
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("UI.setTab('meals'); setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        sel = ".chips[aria-label='Recipe type']"
        st = await ev(f"(() => {{ const e = document.querySelector(\"{sel}\"); const c = getComputedStyle(e); return [c.overflowY, e.scrollHeight - e.clientHeight, c.overflowX]; }})()")
        check('chip row only scrolls sideways', st[0] == 'hidden' and st[1] <= 0 and st[2] == 'auto', st)
        moved = await ev(f"(() => {{ const e = document.querySelector(\"{sel}\"); e.scrollTop = 40; return e.scrollTop; }})()")
        check("chips can't be pushed up out of view", moved == 0, moved)
        await pg.click("button.chip:has-text('From reels')"); await pg.wait_for_timeout(200)
        n = await pg.locator('.meal-row').count(); tags = await pg.locator('.meal-row .reel-tag').count()
        check('From reels lists the recipes from reels', n == await ev("allRecipes().filter(fromReel).length") and n >= 5, n)
        check('each says From a reel', tags == n, (tags, n))
        await ev("MEALS.cat = 'all'; S.rerender()"); await pg.click("button.chip:has-text('All')"); await pg.wait_for_timeout(200)
        await pg.click("#rmore-main"); await pg.wait_for_timeout(200)
        check('reel recipes are labeled in All too', await pg.locator('.meal-row .reel-tag').count() >= 2)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
