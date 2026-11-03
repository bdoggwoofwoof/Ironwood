"""Workout clock in the header once the big clock scrolls away (Nov 3)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8781
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
        await pg.evaluate("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(600)
        check('at the top: big clock shows, header clock hidden', await pg.locator('.wo-head .wo-clock').count() == 1 and await pg.locator('#hdr-clock').count() == 0)
        await pg.evaluate("S.active.startedAt = Date.now() - 125000; S.rerender(); window.scrollTo(0, 900)"); await pg.wait_for_timeout(1300)
        t = await pg.locator('.hdr #hdr-clock').inner_text() if await pg.locator('#hdr-clock').count() else ''
        check('scrolled down: elapsed time shows at the header top left', t.startswith('2:0'), t)
        await pg.evaluate("window.scrollTo(0, 0)"); await pg.wait_for_timeout(400)
        check('back at the top: header clock hides again', await pg.locator('#hdr-clock').count() == 0)
        await pg.evaluate("UI.setTab('meals')"); await pg.wait_for_timeout(300)
        check('not on other tabs', await pg.locator('#hdr-clock').count() == 0)
        check('no page errors', not errs, errs)
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
