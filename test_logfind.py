"""Food log, simpler: one search, recent foods to log again, saved foods by category (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8787
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
        await ev("UI.setTab('meals'); setMealsMode('log')"); await pg.wait_for_timeout(200)
        today = await ev("ymd(new Date())")
        n = lambda: ev(f"(ML().log['{today}'] || []).length")
        await pg.click('#log-add'); await pg.wait_for_timeout(200)
        check('opens on one search box, no type tabs', await pg.locator('#lf-find').count() == 1 and await pg.locator('.sheet .seg button', has_text='Recipe').count() == 0)
        check('Scan and Enter numbers beside it', await pg.locator('#lf-scan-go').count() == 1 and await pg.locator('#lf-num-go').count() == 1)
        check('empty Recent explains itself', await pg.locator('.sheet', has_text='Foods you log show up here').count() == 1)
        # Typed amount
        await pg.fill('#lf-find', '2 eggs'); await pg.wait_for_timeout(150)
        check('typed amount offers “Log 2 eggs”, counts as eggs', 'Eggs' in await pg.inner_text('#lf-log-typed'))
        await pg.click('#lf-log-typed'); await pg.wait_for_timeout(150); await pg.click('#lf-save'); await pg.wait_for_timeout(200)
        check('logged', await n() == 1)
        # Recipe from search
        await pg.click('#log-add'); await pg.fill('#lf-find', 'egg muffin'); await pg.wait_for_timeout(150)
        heads = await ev("[...document.querySelectorAll('.sheet .aisle-h')].map(e => e.textContent)")
        check('search finds foods and recipes in one list, foods and lookup before recipes', 'Recipes' in heads and heads[-1] == 'Recipes' and await ev("(() => { const a = document.querySelector('#lf-find-online'), r = [...document.querySelectorAll('.sheet .aisle-h')].find(e => e.textContent === 'Recipes'); return !!(a.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING); })()"), heads)
        await pg.locator('.sheet .opt', has_text='Veggie Egg Muffins').click(); await pg.wait_for_timeout(150)
        check('recipe opens ready to log', await pg.locator('#log-save').count() == 1 and await pg.locator('#lf-back').count() == 1)
        await pg.click('#log-save'); await pg.wait_for_timeout(200)
        # Built-in food from search
        await pg.click('#log-add'); await pg.fill('#lf-find', 'banana'); await pg.wait_for_timeout(150)
        await pg.locator('.sheet .aisle-h', has_text='Foods').wait_for(); await pg.locator('.sheet .find-list .opt').filter(has_text='Banana').first.click(); await pg.wait_for_timeout(150)
        check('food opens with an amount filled in', await ev("document.querySelector('#lf-txt').value") == '1 Banana' or 'anana' in await ev("document.querySelector('#lf-txt').value"))
        await pg.click('#lf-save'); await pg.wait_for_timeout(200)
        check('three logged', await n() == 3)
        # Recent: one tap logs again
        await pg.click('#log-add'); await pg.wait_for_timeout(150)
        rec = await ev("[...document.querySelectorAll('#lf-recent .find-main .t')].map(e => e.textContent)")
        check('Recent lists what you logged, newest first', len(rec) == 3 and 'Egg Muffins' in rec[1], rec)
        await pg.click('#again-r1'); await pg.wait_for_timeout(200)
        last = await ev(f"ML().log['{today}'].slice(-1)[0]")
        check('one tap logs the same amount again', await n() == 4 and last['r'] == 'm-egg-muffins' and last['sv'] == 1, last)
        # Save by category
        await pg.click('#log-add'); await pg.click('#star-r0'); await pg.wait_for_timeout(100)
        check('☆ shows categories', await pg.locator('.cat-pick .chip', has_text='Breakfast').count() == 1 and await pg.locator('.cat-pick .chip', has_text='Drinks').count() == 1)
        await pg.locator('.cat-pick .chip', has_text='Breakfast').click(); await pg.wait_for_timeout(150)
        check('saved to Breakfast', await ev("Object.values(ML().saved).some(s => s.cat === 'Breakfast' && s.e.r === 'm-egg-muffins')"))
        await pg.click('#star-r1'); await pg.fill('.cat-new', 'Post-workout'); await pg.press('.cat-new', 'Enter'); await pg.wait_for_timeout(150)
        check('make your own category', await ev("ML().cats.includes('Post-workout') && Object.values(ML().saved).some(s => s.cat === 'Post-workout')"))
        await pg.click('#lf-saved-tab'); await pg.wait_for_timeout(100)
        sv = await pg.inner_text('#lf-saved')
        check('Saved tab groups by category', 'BREAKFAST' in sv.upper() and 'POST-WORKOUT' in sv.upper(), sv)
        before = await n(); await pg.locator('#lf-saved .find-main').first.click(); await pg.wait_for_timeout(200)
        check('one tap logs a saved food', await n() == before + 1)
        # Searching finds recent and saved too
        await pg.click('#log-add'); await pg.fill('#lf-find', 'muffin'); await pg.wait_for_timeout(150)
        check('search shows matching recent foods first', await pg.locator('.sheet .aisle-h', has_text='Recent and saved').count() == 1)
        check('online lookup and numbers from the search', await pg.locator('#lf-find-online').count() == 1 and await pg.locator('#lf-find-num').count() == 1)
        await pg.click('#lf-find-num'); await pg.wait_for_timeout(100)
        check('numbers form keeps the name you typed', await ev("document.querySelector('#ln-name').value") == 'muffin')
        await pg.click('#lf-back'); await pg.wait_for_timeout(100)
        check('back to search', await pg.locator('#lf-find').count() == 1); await ev("closeSheet()")
        # Entry sheet: save and log again
        eid = await ev(f"ML().log['{today}'][0].id")
        await ev(f"openSheet({{ type: 'logEntry', day: '{today}', id: '{eid}' }})"); await pg.wait_for_timeout(150)
        await pg.locator('.cat-pick .chip', has_text='Snacks').click(); await pg.wait_for_timeout(100)
        check('a logged entry can be saved to a category', await ev("Object.values(ML().saved).some(s => s.cat === 'Snacks')"))
        before = await n(); await pg.click('#le-again'); await pg.wait_for_timeout(150)
        check('...and logged again', await n() == before + 1)
        check('saved foods survive reload', await ev("Object.keys(normMeals(JSON.parse(JSON.stringify(ML()))).saved).length") == 3)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
