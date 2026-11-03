"""Tighter top and bottom, bigger top switch (Nov 3)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8783
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        check('the spacer above a tab no longer adds the status bar again', await ev("document.querySelector('.hdr-space').offsetHeight") <= 6)
        fs = await ev("parseFloat(getComputedStyle(document.querySelector('main .topsw button')).fontSize)")
        check('Train / Run / Fight at 30px', abs(fs - 30) < 0.6, fs)
        check('the switch sits near the top', await ev("document.querySelector('.topsw').getBoundingClientRect().top") < 20)
        await ev("UI.setTab('stats')"); await pg.wait_for_timeout(300)
        check('Progress title matches', abs(await ev("parseFloat(getComputedStyle(document.querySelector('.page-title')).fontSize)") - 30) < 0.6)
        await ev("UI.setTab('meals')"); await pg.wait_for_timeout(300)
        check('no top switch overflows the screen', await ev("[...document.querySelectorAll('main .topsw')].every(t => t.scrollWidth <= t.clientWidth + 1 || t.classList.contains('four'))"))
        check('tab bar icons keep 24px', await ev("document.querySelector('.tab svg').getBoundingClientRect().width") == 24)
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
