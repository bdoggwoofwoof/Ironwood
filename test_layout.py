"""Layout: one header style on every main page; challenges findable from Train and Routines with ready-made templates."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8779
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        heads = []
        for t in ['Train', 'Routines', 'Meals', 'Stats', 'Profile']:
            await pg.locator('.tabs button', has_text=t).click(); await pg.wait_for_timeout(250)
            heads.append(await ev("(() => { const e = document.querySelector('main .topsw button.on, main .page-title'); const r = e.getBoundingClientRect(); return [getComputedStyle(e).fontSize, Math.round(r.top), Math.round(r.height)]; })()"))
        check('same header size and position on all five pages', len({tuple(h) for h in heads}) == 1, heads)
        await pg.locator('.tabs button', has_text='Meals').click(); await ev("setMealsMode('log')"); await pg.wait_for_timeout(200)
        fill = await ev("[document.documentElement.scrollHeight, innerHeight, Math.round(document.querySelector('nav.tabs').getBoundingClientRect().bottom)]")
        check('short pages still fill the screen, tab bar at the very bottom', fill[0] > fill[1] and fill[2] == fill[1], fill)
        check('no small centered title on Stats and Profile', await pg.locator('header.hdr').count() == 0)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(200)
        check('challenges on Routines', await pg.locator('#ch-finder-routines').count() == 1)
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(200)
        await pg.click('#ch-finder-train'); await pg.wait_for_timeout(250)
        check('templates: Iron 75, Iron 75 Lite, 30-Day Streak, 6-Week Protein & Sleep, your own', await pg.locator('.sheet .opt').count() == 5)
        await pg.click('#cht-iron75'); await pg.wait_for_timeout(300)
        check('template opens the editor filled in', await ev("document.querySelector('#ch-name').value") == 'Iron 75' and await pg.locator('.ed-item').count() == 6)
        await pg.locator('button', has_text='Start challenge').click(); await pg.wait_for_timeout(300)
        check('challenge saved with auto-ticking workouts', await ev("Object.values(S.meta.challenges).some(c => c.name === 'Iron 75' && c.items.filter(i => i.auto).length === 2 && c.restart)"))
        await ev("UI.setView(null)"); await pg.wait_for_timeout(200)
        check('Train card hides once you have a challenge', await pg.locator('#ch-finder-train').count() == 0)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
