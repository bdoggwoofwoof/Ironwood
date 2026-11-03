"""Read a nutrition label (Nov 3): parser on typical and OCR-garbled text, then photos read on the device."""
import asyncio, subprocess, sys, time, os
from playwright.async_api import async_playwright
PORT = 8784
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
TD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'testdata')
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
US = """Nutrition Facts\n8 servings per container\nServing size 2/3 cup (55g)\nAmount per serving\nCalories 230\n% Daily Value*\nTotal Fat 8g 10%\nSaturated Fat 1g 5%\nTrans Fat 0g\nCholesterol 0mg 0%\nSodium 160mg 7%\nTotal Carbohydrate 37g 13%\nDietary Fiber 4g 14%\nTotal Sugars 12g\nIncludes 10g Added Sugars 20%\nProtein 3g"""
GARBLED = """Nutrition Facts\nServing size 1 bar (40 g)\nCalories\n190\nTotal Fat 79 9%\nSaturated Fat 2.59 13%\nSodium 140m9 6%\nTotal Carbohydrate 239 8%\nDietary Fiber 39 11%\nTotal Sugars 99\nProtein 109"""
OLD = """Serving Size 1 cup (228g)\nCalories 250 Calories from Fat 110\nTotal Fat 12g 18%\nSodium 470mg 20%\nTotal Carbohydrate 31g 10%\nDietary Fiber 0g\nSugars 5g\nProtein 5g"""
EU = """Nutrition information Per 100g\nEnergy 1046kJ / 250kcal\nFat 9.0g\nof which saturates 4.0g\nCarbohydrate 30g\nof which sugars 3.0g\nFibre 2.5g\nProtein 12g\nSalt 1.2g"""
WANT = {'kcal': '230', 'f': '8', 'na': '160', 'c': '37', 'fib': '4', 'sug': '12', 'p': '3'}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        r = await ev("t => parseLabel(t)", US)
        check('US label: every number and the serving', all(r['fields'].get(k) == v for k, v in WANT.items()) and r['fields']['u'] == 'cup' and r['fields']['gr'] == '55' and r['fields']['q'] in ('⅔', '2/3') and not r['missing'] and not r['check'], r)
        check('US label: sugar is total sugars, not added', r['fields']['sug'] == '12')
        r = await ev("t => parseLabel(t)", GARBLED)
        check('garbled "g" read as 9: fixed by % Daily Value and calories', r['fields'].get('f') == '7' and r['fields'].get('c') == '23' and r['fields'].get('p') == '10' and r['fields'].get('na') == '140' and r['fields'].get('kcal') == '190', r['fields'])
        check('a bar serving becomes 1 piece of 40 g', r['fields']['u'] == 'piece' and r['fields']['gr'] == '40')
        r = await ev("t => parseLabel(t)", "Serving size 2/3 cup (559)\nCalories 230\nTotal Fat 8g\nTotal Carbohydrate 37g\nProtein 3g")
        check('"(55g)" read as "(559)" still gives 55 g', r['fields'].get('gr') == '55', r['fields'])
        r = await ev("t => parseLabel(t)", OLD)
        check('older label: "Calories from Fat" is not the fat', r['fields']['f'] == '12' and r['fields']['kcal'] == '250' and r['fields']['sug'] == '5', r['fields'])
        r = await ev("t => parseLabel(t)", EU)
        check('per-100 g label: kcal, salt to sodium, 100 g serving', r['fields']['kcal'] == '250' and r['fields']['na'] == '480' and r['fields']['q'] == '100' and r['fields']['u'] == 'g' and r['fields']['fib'] == '2.5', r['fields'])
        r = await ev("t => parseLabel(t)", "Calories 900\nTotal Fat 1g\nTotal Carbohydrate 2g\nProtein 3g")
        check('numbers that don’t add up get a warning', 'add up to about' in r['check'], r['check'])
        # the scan tab and the food sheet
        await pg.locator('.tabs button', has_text='Meals').click(); await ev("setMealsMode('log')"); await pg.wait_for_timeout(250)
        await pg.click('#log-scan'); await pg.wait_for_timeout(300)
        check('Scan shows “Read a nutrition label”', await pg.locator('#scan-label').count() == 1)
        await pg.click('#scan-label'); await pg.wait_for_timeout(300)
        check('it opens a new food with the label reader on top', await pg.locator('#lbl-card').count() == 1 and await pg.locator('#fd-name').count() == 1)
        await pg.click('#lbl-paste-open'); await pg.fill('#lbl-text', US); await pg.click('#lbl-paste-go'); await pg.wait_for_timeout(200)
        vals = {k: await pg.input_value('#fd-' + k) for k in WANT}
        check('pasted text fills the food’s fields', vals == WANT and await pg.input_value('#fd-gr') == '55' and await pg.input_value('#fd-u') == 'cup', vals)
        check('says what it filled', 'Filled serving size, calories' in await pg.locator('#lbl-res').inner_text())
        await pg.fill('#fd-name', 'Granola'); await pg.click('#fd-save'); await pg.wait_for_timeout(300)
        f = await ev("Object.values(ML().foods).find(f => f.name === 'Granola')")
        check('saves with the label’s numbers', f and f['lab']['kcal'] == 230 and f['lab']['na'] == 160 and f['sv']['gr'] == 55, f)
        # photos, read on the device
        for name, label in [('label-clean.jpg', 'clean label photo'), ('label-photo.jpg', 'tilted, dim, blurry photo')]:
            await ev("closeSheet(); openSheet({ type: 'foodEdit', name: '' })"); await pg.wait_for_timeout(300)
            t0 = time.time()
            await pg.set_input_files('#lbl-photo', os.path.join(TD, name))
            await pg.wait_for_selector('#lbl-res, #lbl-err', timeout=120000)
            vals = {k: await pg.input_value('#fd-' + k) for k in WANT}
            right = [k for k in WANT if vals[k] == WANT[k]]
            check(f'{label}: read on the device ({time.time() - t0:.0f}s), {len(right)}/7 numbers right', len(right) == 7, vals)
            check(f'{label}: serving 2/3 cup, 55 g', await pg.input_value('#fd-gr') == '55' and await pg.input_value('#fd-u') == 'cup', [await pg.input_value('#fd-q'), await pg.input_value('#fd-u'), await pg.input_value('#fd-gr')])
        reqs = []
        pg.on('request', lambda q: reqs.append(q.url))
        await ev("closeSheet(); openSheet({ type: 'foodEdit', name: '' })"); await pg.wait_for_timeout(200)
        await pg.set_input_files('#lbl-photo', os.path.join(TD, 'label-clean.jpg')); await pg.wait_for_selector('#lbl-res, #lbl-err', timeout=60000)
        check('nothing leaves the device: every request is to the app itself', all(u.startswith(f'http://localhost:{PORT}/') or u.startswith('blob:') or u.startswith('data:') for u in reqs), [u for u in reqs if 'localhost' not in u][:3])
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
