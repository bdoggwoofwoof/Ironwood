"""Edit a food entered by hand: name and numbers, saved copy follows, Undo (Nov 3)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8794
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        k = await ev("ymd(new Date())")
        await ev("UI.setTab('meals'); setMealsMode('log'); openSheet({ type: 'mealLog', day: ymd(new Date()), view: 'num' })"); await pg.wait_for_timeout(300)
        if not await pg.locator('#ln-name').count():
            await pg.get_by_role('button', name='Enter numbers').click(); await pg.wait_for_timeout(200)
        await pg.fill('#ln-name', 'Burrito bowl'); await pg.fill('#ln-kcal', '700'); await pg.fill('#ln-p', '35'); await pg.click('#ln-save'); await pg.wait_for_timeout(300)
        e = await ev(f"ML().log['{k}'][0]")
        check('entered by hand', e['k'] == 'num' and e['m']['kcal'] == 700)
        await ev(f"saveFood(ML().log['{k}'][0], 'Lunch')"); await pg.wait_for_timeout(200)
        await ev(f"openSheet({{ type: 'logEntry', day: '{k}', id: '{e['id']}' }})"); await pg.wait_for_timeout(300)
        check('hand-entered food offers Edit', await pg.locator('#le-edit').count() == 1)
        await pg.click('#le-edit'); await pg.wait_for_timeout(200)
        check('form is filled in', await pg.input_value('#le-name') == 'Burrito bowl' and await pg.input_value('#le-kcal') == '700' and await pg.input_value('#le-p') == '35')
        await pg.fill('#le-name', 'Burrito bowl (half rice)'); await pg.fill('#le-kcal', '620'); await pg.fill('#le-p', '33'); await pg.click('#le-save'); await pg.wait_for_timeout(300)
        e2 = await ev(f"ML().log['{k}'][0]"); sv = await ev("Object.values(ML().saved)[0].e")
        check('entry updated', e2['name'] == 'Burrito bowl (half rice)' and e2['m']['kcal'] == 620 and e2['m']['p'] == 33 and e2['id'] == e['id'])
        check('saved copy updated too', sv['name'] == 'Burrito bowl (half rice)' and sv['m']['kcal'] == 620)
        check('day total uses the new numbers', await ev(f"sumNut(ML().log['{k}']).kcal") == 620)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(300)
        e3 = await ev(f"ML().log['{k}'][0]"); sv3 = await ev("Object.values(ML().saved)[0].e")
        check('Undo restores both', e3['name'] == 'Burrito bowl' and e3['m']['kcal'] == 700 and sv3['m']['kcal'] == 700)
        await ev("mealCommit(m => { m.log[ymd(new Date())].push({ id: 'r1', k: 'recipe', r: 'm-burrito-bowls', sv: 1, name: 'Chicken Burrito Bowls', m: { kcal: 500, p: 40, c: 50, f: 12, fib: 6, sug: 4, na: 700 } }); })")
        await ev(f"closeSheet(); openSheet({{ type: 'logEntry', day: '{k}', id: 'r1' }})"); await pg.wait_for_timeout(300)
        check('recipes keep their own servings control, no number edit', await pg.locator('#le-edit').count() == 0)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
