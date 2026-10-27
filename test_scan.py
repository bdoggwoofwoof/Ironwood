"""Barcode scan and online food lookup (Oct 27): Log food → Scan. Online lookups are opt-in and send only the barcode or
the search words; Open Food Facts is mocked here, so no test touches the internet. The camera test feeds Chromium a
fake camera showing a real EAN-13 barcode (testdata/), read by the bundled ZXing WebAssembly reader."""
import asyncio, json, os, shutil, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright
PORT = 8781
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
CODE = '0041196910551'
PRODUCT = {'code': CODE, 'status': 1, 'product': {'product_name': 'Tomato Soup', 'brands': 'Progresso,General Mills', 'serving_size': '1 cup (245 g)', 'serving_quantity': 245,
           'nutriments': {'energy-kcal_100g': 40, 'proteins_100g': 1.2, 'carbohydrates_100g': 8, 'fat_100g': 0.4, 'fiber_100g': 0.8, 'sugars_100g': 5, 'sodium_100g': 0.28}}}
SEARCH = {'products': [{'code': '123456789012', 'product_name': 'Chocolate Protein Shake', 'brands': 'Fairlife', 'serving_quantity': 340, 'serving_size': '1 bottle (340 ml)',
           'nutriments': {'energy-kcal_100g': 44, 'proteins_100g': 9, 'carbohydrates_100g': 1.2, 'fat_100g': 0.7}},
          {'code': '999', 'product_name': 'No numbers', 'nutriments': {}}]}
async def main():
    tmp = tempfile.mkdtemp(); cam = os.path.join(tmp, 'cam.y4m')
    have_cam = shutil.which('ffmpeg') and subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', 'testdata/barcode-0041196910551.png', '-t', '0.3', '-pix_fmt', 'yuv420p', cam]).returncode == 0
    async with async_playwright() as p:
        args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] + (['--use-file-for-fake-video-capture=' + cam] if have_cam else [])
        b = await p.chromium.launch(args=args)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, permissions=['camera']); pg = await ctx.new_page(); errs = []; sent = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        async def off(route):
            u = route.request.url; sent.append(u)
            if '/api/v2/product/' in u:
                body = PRODUCT if (CODE in u or CODE[1:] in u) else {'status': 0}
                return await route.fulfill(status=200 if body.get('status') else 404, content_type='application/json', body=json.dumps(body))
            if '/cgi/search.pl' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps(SEARCH))
            await route.abort()
        await pg.route('https://world.openfoodfacts.org/**', off)
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await pg.locator('.tabs button', has_text='Meals').click(); await ev("setMealsMode('log')"); await pg.wait_for_timeout(250)
        check('Scan button next to Log food', await pg.locator('#log-scan').count() == 1)
        await pg.click('#log-scan'); await pg.wait_for_timeout(250)
        check('opens Log food on the Scan tab', await pg.locator('.sheet .seg button.on', has_text='Scan').count() == 1)
        check('asks before any online lookup', await pg.locator('#lookup-ask').count() == 1 and await pg.locator('#off-q').count() == 0)
        # Not allowed yet: typing a barcode sends nothing and offers the choice
        await pg.fill('#bc-num', CODE); await pg.click('#bc-go'); await pg.wait_for_timeout(300)
        check('lookups off: nothing sent', not sent, sent)
        check('lookups off: offers look it up online or add from the label', await pg.locator('#bc-allow').count() == 1 and await pg.locator('#bc-label').count() == 1)
        await pg.click('#bc-allow'); await pg.wait_for_timeout(500)
        check('allowing looks it up', await ev("ML().lookup === true") and await pg.locator('#scan-product').count() == 1)
        check('only the barcode number is sent', len(sent) == 1 and sent[0].split('?')[0].endswith('/api/v2/product/' + CODE + '.json'), sent)
        txt = await pg.inner_text('#scan-product')
        check('product name, brand and serving shown', 'Tomato Soup' in txt and 'Progresso' in txt and '245 g' in txt and 'Open Food Facts' in txt, txt[:160])
        tiles = await pg.inner_text('#scan-product .macro-tiles, #scan-product .me-tiles') if await pg.locator('#scan-product .macro-tiles, #scan-product .me-tiles').count() else txt
        check('one serving: 98 kcal (40 per 100 g × 245 g)', '98' in tiles, tiles[:120])
        await pg.click('#scan-log'); await pg.wait_for_timeout(300)
        food = await ev("Object.values(ML().foods).find(f => f.bc === '%s')" % CODE)
        check('saved to your foods with its barcode', food and food['name'] == 'Progresso Tomato Soup' and food['sv'] == {'q': 1, 'u': 'serving', 'gr': 245} and round(food['lab']['kcal']) == 98 and food['lab']['na'] == 686, food)
        entry = await ev("ML().log[Object.keys(ML().log)[0]].slice(-1)[0]")
        check('logged one serving', entry['m']['kcal'] == 98 and entry['txt'] == '1 serving' and entry['fk'] == food['id'], entry)
        # Second scan: found on the phone, no request
        n = len(sent)
        await pg.click('#log-scan'); await pg.wait_for_timeout(250)
        await pg.fill('#bc-num', CODE[1:]); await pg.click('#bc-go'); await pg.wait_for_timeout(300)
        check('known barcode found offline (UPC-A matches EAN-13)', await pg.locator('#scan-product', has_text='Saved on this phone').count() == 1 and len(sent) == n)
        await pg.locator('.seg button', has_text='Grams').click(); await pg.fill('#sp-g', '100'); await pg.wait_for_timeout(150)
        check('grams option', '40' in await pg.inner_text('#scan-product'))
        await pg.locator('#scan-product button', has_text='Back').click(); await pg.wait_for_timeout(150)
        # Name search
        await pg.fill('#off-q', 'fairlife chocolate'); await pg.click('#off-go'); await pg.wait_for_timeout(400)
        check('search sends only the words', 'search_terms=fairlife%20chocolate' in sent[-1], sent[-1])
        check('results without calories are left out', await pg.locator('#off-results .opt').count() == 1)
        await pg.locator('#off-results .opt').first.click(); await pg.wait_for_timeout(200)
        check('search result opens the product', await pg.locator('#scan-product', has_text='Chocolate Protein Shake').count() == 1)
        await pg.locator('#scan-product button', has_text='Back').click(); await pg.wait_for_timeout(150)
        # Unknown barcode → add from the label, which keeps the barcode
        await pg.fill('#bc-num', '00000000'); await pg.click('#bc-go'); await pg.wait_for_timeout(400)
        check('unknown barcode: add from the label', await pg.locator('#bc-miss', has_text='Not in the food database').count() == 1)
        await pg.click('#bc-label'); await pg.wait_for_timeout(250)
        await pg.fill('#fd-name', 'Gym bar'); await pg.fill('#fd-q', '50'); await pg.fill('#fd-kcal', '200'); await pg.fill('#fd-p', '20'); await pg.click('#fd-save'); await pg.wait_for_timeout(300)
        check('label food keeps its barcode and comes back to log it', await ev("Object.values(ML().foods).some(f => f.name === 'Gym bar' && f.bc === '00000000')") and await pg.locator('#scan-product', has_text='Gym bar').count() == 1)
        await pg.click('#scan-log'); await pg.wait_for_timeout(250)
        # Offline
        await pg.click('#log-scan'); await pg.wait_for_timeout(200)
        await ctx.set_offline(True)
        await pg.fill('#bc-num', '11111111'); await pg.click('#bc-go'); await pg.wait_for_timeout(400)
        check('offline: clear message', await pg.locator('.sheet [role=alert]', has_text='offline').count() == 1)
        await ctx.set_offline(False)
        # Turn lookups off
        await pg.click('#lookup-toggle'); await pg.wait_for_timeout(150)
        check('lookups can be turned off', await ev("ML().lookup === false") and await pg.locator('#off-q').count() == 0)
        check('setting survives a reload', await ev("normMeals(JSON.parse(JSON.stringify(ML()))).lookup === false"))
        await pg.click('#lookup-toggle'); await pg.wait_for_timeout(150)
        # Camera reading a real barcode
        if have_cam:
            n = len(sent)
            await pg.click('#scan-start'); await pg.wait_for_timeout(200)
            await pg.wait_for_selector('#scan-product', timeout=15000)
            check('camera reads the barcode and finds the product', await pg.locator('#scan-product', has_text='Tomato Soup').count() == 1)
            check('camera turned off after a read', await ev("!document.querySelector('#bc-cam')"))
        else:
            print('SKIP camera test (no ffmpeg)')
        # Food tab: look up what you typed
        await pg.keyboard.press('Escape'); await ev("closeSheet()"); await pg.wait_for_timeout(200)
        await pg.click('#log-add'); await pg.locator('.sheet .seg button', has_text='Food').click(); await pg.wait_for_timeout(150)
        await pg.fill('#lf-txt', '340 g fairlife chocolate'); await pg.wait_for_timeout(150)
        await pg.click('#lf-online-go'); await pg.wait_for_timeout(500)
        check('Food tab: online lookup searches what you typed (no amount)', 'search_terms=fairlife%20chocolate' in sent[-1] and await pg.locator('#lf-online #off-results .opt').count() == 1, sent[-1])
        check('Food tab lookup shows search only, no barcode parts', await pg.locator('#lf-online #scan-start').count() == 0 and await pg.locator('#lf-online #bc-num').count() == 0)
        await pg.locator('#lf-online #off-results .opt').first.click(); await pg.wait_for_timeout(200)
        check('amount typed in grams carries over', await ev("document.querySelector('#sp-g') && document.querySelector('#sp-g').value") == '340')
        await pg.click('#scan-log'); await pg.wait_for_timeout(250)
        check('logged from the Food tab', await ev("Object.values(ML().log).flat().some(e => e.name === 'Chocolate Protein Shake' && e.txt === '340 g' && e.m.kcal === 150)"))
        await pg.click('#log-add'); await pg.locator('.sheet .seg button', has_text='Food').click(); await pg.fill('#lf-txt', '1 jar mystery sauce'); await pg.wait_for_timeout(150)
        await pg.click('#lf-food'); await pg.wait_for_timeout(150)
        check('food picker also offers online lookup', await pg.locator('#lf-pick-online').count() == 1)
        await pg.click('#lf-pick-online'); await pg.wait_for_timeout(300); await ev("closeSheet()")
        await ev("mealCommit(m => { delete m.lookup; })"); await pg.wait_for_timeout(100); n = len(sent)
        await pg.click('#log-add'); await pg.locator('.sheet .seg button', has_text='Food').click(); await pg.fill('#lf-txt', '1 bar fairlife'); await pg.click('#lf-online-go'); await pg.wait_for_timeout(300)
        check('Food tab asks first; nothing sent before you allow', await pg.locator('#lf-online #lookup-ask').count() == 1 and len(sent) == n)
        await pg.click('#lookup-allow'); await pg.wait_for_timeout(400)
        check('allowing runs the search', len(sent) == n + 1 and 'fairlife' in sent[-1].split('search_terms=')[1], sent[-1])
        await ev("closeSheet()")
        check('privacy page explains lookups', 'Food lookups' in (await (await ctx.request.get(URL + 'privacy.html')).text()))
        sw = await (await ctx.request.get(URL + 'sw.js')).text()
        check('reader files are on the site', (await ctx.request.get(URL + 'vendor/zxing_reader.wasm')).ok and (await ctx.request.get(URL + 'vendor/barcode-ponyfill.js')).ok)
        check('no page errors', not errs, errs[:3]); await b.close()
    shutil.rmtree(tmp, ignore_errors=True)
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
