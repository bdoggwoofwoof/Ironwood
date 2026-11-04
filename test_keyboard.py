"""Sheets stay above the iPhone keyboard (Nov 3): the keyboard is simulated by shrinking the visible area."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8786
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        await pg.locator('.tabs button', has_text='Meals').click(); await ev("setMealsMode('log')"); await pg.wait_for_timeout(250)
        await pg.click('#log-add'); await pg.wait_for_timeout(300)
        await pg.focus('#lf-find'); await pg.keyboard.type('luna')
        box = lambda sel: ev(f"(() => {{ const r = document.querySelector('{sel}').getBoundingClientRect(); return [r.top, r.bottom]; }})()")
        await ev("kbFit(508, 0)"); await pg.wait_for_timeout(200)
        sh = await box('.sheet'); f = await box('#lf-find')
        check('keyboard up: the sheet ends above it', sh[1] <= 508.5, sh)
        check('keyboard up: the search box and its words are visible', f[0] >= 0 and f[1] <= 508.5 and await pg.input_value('#lf-find') == 'luna', f)
        await ev("kbFit(508, 120)"); await pg.wait_for_timeout(200)
        sh = await box('.sheet')
        check('page nudged up by iOS: the sheet follows the visible area', sh[1] <= 628.5 and sh[0] >= 120 - 0.5, sh)
        await ev("kbFit(844, 0)"); await pg.wait_for_timeout(200)
        sh = await box('.sheet')
        check('keyboard down: the sheet goes back to the bottom', abs(sh[1] - 844) < 1 and not await ev("document.documentElement.classList.contains('kb-open')"), sh)
        await ev("closeSheet(); openSheet({ type: 'foodEdit', name: '' })"); await pg.wait_for_timeout(300)
        await pg.focus('#fd-na'); await ev("kbFit(508, 0)"); await pg.wait_for_timeout(300)
        f = await box('#fd-na')
        check('a field low in a long sheet scrolls into view above the keyboard', f[0] >= 0 and f[1] <= 508.5, f)
        await ev("kbFit(844, 0)")
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
