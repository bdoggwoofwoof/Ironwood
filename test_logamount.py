"""Change how much you ate (Nov 4): an Amount stepper on any logged food, any day, and "Change amount" after re-logging."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8788
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
BAR = "{ k: 'food', name: 'Protein bar', txt: '1 bar', fk: 'my-bar', m: { kcal: 200, p: 20, c: 22, f: 7, fib: 3, sug: 5, na: 150 } }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        k = await ev("ymd(new Date())"); y = await ev("ymd(addDays(new Date(), -1))")
        await ev("UI.setTab('meals'); setMealsMode('log')")
        e = await ev(f"addLog(ymd(new Date()), {BAR})")
        await ev(f"openSheet({{ type: 'logEntry', day: '{k}', id: '{e['id']}' }})"); await pg.wait_for_timeout(300)
        check('a logged food has an Amount stepper', await pg.locator('#le-amount').count() == 1 and 'How many' in await pg.inner_text('#le-amount'))
        more = pg.locator('#le-amount button[aria-label^="More"]'); less = pg.locator('#le-amount button[aria-label^="Fewer"]')
        await more.click(); await more.click(); await pg.wait_for_timeout(200)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{e['id']}')")
        check('two of them: numbers double', x['m']['kcal'] == 400 and x['m']['p'] == 40 and x['m']['na'] == 300 and x['q'] == 2, x['m'])
        check('the entry says how much', x['txt'] == '2 bars', x['txt'])
        check('the day’s totals follow', await ev(f"sumNut(ML().log['{k}']).kcal") == 400)
        await less.click(); await less.click(); await less.click(); await pg.wait_for_timeout(200)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{e['id']}')")
        check('half a bar works too, and back down is exact', x['m']['kcal'] == 100 and x['txt'] == '½ bar', (x['m']['kcal'], x['txt']))
        await more.click(); await pg.wait_for_timeout(150)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{e['id']}')")
        check('back to 1: original numbers and text', x['m']['kcal'] == 200 and x['txt'] == '1 bar', (x['m'], x['txt']))
        # 3 eggs can go down to 2, 1 or half an egg (Nov 11, Newt)
        e3 = await ev(f"addLog('{k}', {{ k: 'food', name: 'Eggs', txt: '3', fk: 'egg', m: {{ kcal: 216, p: 19, c: 1, f: 15, fib: 0, sug: 0, na: 210 }} }})")
        await ev(f"closeSheet(); openSheet({{ type: 'logEntry', day: '{k}', id: '{e3['id']}' }})"); await pg.wait_for_timeout(300)
        check('3 eggs shows as 3', '3' in await pg.inner_text('#le-amount .mstep .v'))
        for _ in range(4): await pg.locator('#le-amount button[aria-label^="Fewer"]').click()
        await pg.wait_for_timeout(200)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{e3['id']}')")
        check('3 eggs down to 1: one egg of numbers', x['m']['kcal'] == 72 and x['txt'] == '1', (x['m']['kcal'], x['txt']))
        await pg.locator('#le-amount button[aria-label^="Fewer"]').click(); await pg.wait_for_timeout(150)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{e3['id']}')")
        check('and half an egg', x['m']['kcal'] == 36 and x['txt'] == '½', (x['m']['kcal'], x['txt']))
        g = await ev(f"addLog('{k}', {{ k: 'food', name: 'Rice', txt: '150 g', fk: 'rice', m: {{ kcal: 195, p: 4, c: 42, f: 0, fib: 1, sug: 0, na: 2 }} }})")
        await ev(f"closeSheet(); openSheet({{ type: 'logEntry', day: '{k}', id: '{g['id']}' }})"); await pg.wait_for_timeout(300)
        await pg.locator('#le-amount button[aria-label^="Fewer"]').click(); await pg.wait_for_timeout(150)
        x = await ev(f"ML().log['{k}'].find(e => e.id === '{g['id']}')")
        check('grams step by 10', x['txt'] == '140 g' and x['m']['kcal'] == 182, (x['txt'], x['m']['kcal']))
        # an earlier day
        e2 = await ev(f"addLog('{y}', {{ k: 'num', name: 'Quick add', m: {{ kcal: 300, p: 10, c: 30, f: 10, fib: 0, sug: 0, na: 0 }} }})")
        await ev(f"closeSheet(); openSheet({{ type: 'logEntry', day: '{y}', id: '{e2['id']}' }})"); await pg.wait_for_timeout(300)
        for _ in range(4): await pg.locator('#le-amount button[aria-label^="More"]').click()
        x = await ev(f"ML().log['{y}'].find(e => e.id === '{e2['id']}')")
        check('works on an earlier day, and on numbers-only entries', x['m']['kcal'] == 900 and x['txt'] == '3×', (x['m']['kcal'], x['txt']))
        await pg.click('#le-edit'); await pg.fill('#le-kcal', '1200'); await pg.click('#le-save'); await pg.wait_for_timeout(200)
        x = await ev(f"ML().log['{y}'].find(e => e.id === '{e2['id']}')")
        check('editing the numbers keeps the amount consistent', x['m']['kcal'] == 1200 and x['m1']['kcal'] == 400, (x['m']['kcal'], x['m1']['kcal']))
        # recipes keep servings
        await ev(f"mealCommit(m => {{ m.log['{k}'].push({{ id: 'r1', k: 'recipe', r: 'm-burrito-bowls', sv: 1, name: 'Burrito Bowls', m: {{ kcal: 500, p: 40, c: 50, f: 12, fib: 6, sug: 4, na: 700 }} }}); }})")
        await ev(f"closeSheet(); openSheet({{ type: 'logEntry', day: '{k}', id: 'r1' }})"); await pg.wait_for_timeout(300)
        check('recipes keep their Servings stepper, no second one', await pg.locator('#le-amount').count() == 0 and await pg.locator('.mstep[aria-label="servings eaten"]').count() == 1)
        # from Recent: log again, then Change amount
        await ev("closeSheet()"); await pg.click('#log-add'); await pg.wait_for_timeout(300)
        row = pg.locator('#log-find .find-main', has_text='Protein bar').first
        await row.click(); await pg.wait_for_timeout(300)
        check('logging from Recent offers Undo and Change amount', await pg.locator('.toast button', has_text='Undo').count() == 1 and await pg.locator('#toast-2', has_text='Change amount').count() == 1)
        await pg.click('#toast-2'); await pg.wait_for_timeout(300)
        check('Change amount opens the new entry', await pg.locator('#le-amount').count() == 1)
        await pg.locator('#le-amount button[aria-label^="More"]').click(); await pg.locator('#le-amount button[aria-label^="More"]').click(); await pg.wait_for_timeout(200)
        bars = await ev(f"ML().log['{k}'].filter(e => e.name === 'Protein bar').map(e => e.m.kcal)")
        check('so eating two takes one log and one tap, not logging twice', sorted(bars) == [200, 400], bars)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
