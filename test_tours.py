"""Tours (Nov 10, Newt): Help offers Tour this page and the Full tour; first launch keeps the short six-stop tour."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8790
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
        check('full tour has the old stops', await ev("TOUR_FULL.length") == 22, await ev("TOUR_FULL.length"))
        check('first launch tour is still short', await ev("TOUR.length") == 6)
        for tab, mode, name in [('meals', None, 'Meals'), ('routines', None, 'Plans'), ('stats', None, 'Progress'), ('profile', None, 'Profile'), ('train', 'run', 'Run'), ('train', 'train', 'Train')]:
            await ev(f"TRAIN.mode = '{mode or 'train'}'; lsSet('trainMode', TRAIN.mode); UI.setTab('{tab}'); S.rerender()"); await pg.wait_for_timeout(300)
            await pg.click('#help-btn'); await pg.wait_for_timeout(200)
            check(f'{name}: Help offers both tours', await pg.locator('#help-page-tour').count() == 1 and await pg.locator('#help-tour').count() == 1)
            await pg.click('#help-page-tour'); await pg.wait_for_timeout(500)
            steps = await ev("tourSteps().map(t => t[0] + ':' + (t[1] || ''))")
            check(f'{name}: page tour stays on {name}', len(steps) >= 3 and all(s.startswith(tab) for s in steps), steps)
            n = len(steps); seen = set()
            for i in range(n):
                seen.add(await ev("lsGet('tab')"))
                await pg.click('#tour-next'); await pg.wait_for_timeout(450)
            check(f'{name}: tour ends and you stay on the page', await pg.locator('.tour').count() == 0 and await ev("lsGet('tab')") == tab and seen == {tab}, (seen, await ev("lsGet('tab')")))
        await ev("UI.setTab('train'); S.rerender()"); await pg.click('#help-btn'); await pg.wait_for_timeout(200); await pg.click('#help-tour'); await pg.wait_for_timeout(400)
        check('Full tour starts the long walkthrough', await ev("tourSteps().length") == 22 and '1 of 22' in (await pg.inner_text('.tour')).lower())
        await pg.click('#tour-skip'); await pg.wait_for_timeout(300)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
