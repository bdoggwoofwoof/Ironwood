"""Drop sets (Nov 16, Newt): tap a set's number, Make it a drop set; drops log under the set, count toward volume,
are saved with the workout and show in history."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8829
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
        await ev("UI.setTab('train'); startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0]); S.rest = null; S.rerender()"); await pg.wait_for_timeout(400)
        sid = await ev("S.active.items[0].sets[0].id")
        await ev("const s = S.active.items[0].sets[0]; s.w = '100'; s.r = '8'; S.rerender()"); await pg.wait_for_timeout(200)
        await pg.click(f'#sn-{sid}'); await pg.wait_for_timeout(300)
        check('tapping the set number offers Make it a drop set', await pg.locator('#sa-drop').count() == 1)
        await pg.click('#sa-drop'); await pg.wait_for_timeout(400)
        check('a drop row appears under the set', await pg.locator('.drop-row').count() == 1)
        ph = await ev("document.querySelector('.drop-row input').placeholder")
        check('the drop suggests about 80% of the weight', ph == '80', ph)
        did = await ev("S.active.items[0].sets[0].drops[0].id")
        await pg.fill(f'#dw-{did}', '80'); await pg.fill(f'#dr-{did}', '6'); await pg.dispatch_event(f'#dr-{did}', 'change'); await pg.wait_for_timeout(200)
        await pg.click(f'#da-{sid}'); await pg.wait_for_timeout(300)
        check('+ Another drop adds a second', await pg.locator('.drop-row').count() == 2)
        ph2 = await ev("document.querySelectorAll('.drop-row input')[2].placeholder")
        check('the second drop steps down from the first', ph2 == '65', ph2)
        d2 = await ev("S.active.items[0].sets[0].drops[1].id")
        await pg.fill(f'#dw-{d2}', '60'); await pg.fill(f'#dr-{d2}', '5'); await pg.wait_for_timeout(100)
        check('the set number shows it is a drop set', await pg.locator(f'#sn-{sid} .drop-d').count() == 1)
        await ev("const it = S.active.items[0]; completeSet(it, it.sets[0], false); S.rest = null"); await pg.wait_for_timeout(200)
        vol = await ev("itemVolume({ ex: S.active.items[0].ex, sets: [{ w: 100, r: 8, dr: [{ w: 80, r: 6 }, { w: 60, r: 5 }] }] })")
        check('drops count toward volume', vol == 100 * 8 + 80 * 6 + 60 * 5, vol)
        await ev("finishWorkout({ quiet: true })"); await pg.wait_for_timeout(400)
        last = await ev("(() => { const s = Object.values(S.sessions).sort((a, b) => b.startedAt - a.startedAt)[0]; return s.items[0].sets[0]; })()")
        check('the workout saves the drops', last.get('dr') == [{'w': 80, 'r': 6}, {'w': 60, 'r': 5}], last)
        check('a reload keeps them', await ev("(() => { const s = Object.values(S.sessions).sort((a, b) => b.startedAt - a.startedAt)[0]; return JSON.stringify(s.items[0].sets[0].dr); })()") == '[{"w":80,"r":6},{"w":60,"r":5}]')
        await ev("const s = Object.values(S.sessions).sort((a, b) => b.startedAt - a.startedAt)[0]; openSheet({ type: 'session', id: s.id })"); await pg.wait_for_timeout(500)
        txt = await ev("document.body.innerText")
        check('history shows the drops', '↓ drop 80×6, 60×5' in txt, txt[txt.find('100'):txt.find('100') + 80] if '100' in txt else txt[:80])
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
