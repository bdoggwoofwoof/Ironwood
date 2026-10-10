"""Train / History, program choice and Self-log, hideable tips, Help (tour, feedback), color themes."""
import asyncio, subprocess, sys, time
from urllib.parse import unquote
from playwright.async_api import async_playwright
PORT = 8771
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        tabs = await pg.locator('.tabs .tab').all_inner_texts()
        check('four tabs, no Log', [t.strip() for t in tabs] == ['Train', 'Routines', 'Stats', 'Profile'], tabs)
        check('no program by default', await pg.locator('#get-started').count() == 1 and await pg.locator('.next-card', has_text="Newt's").count() == 0)
        # Self-log
        await pg.get_by_role('button', name='Create or select a program').click(); await pg.wait_for_timeout(300)
        opts = await pg.locator('.opt > div > div:first-child').all_inner_texts()
        check('picker: Self-log, Create, then the 4-Day Split first', opts[0] == 'Self-log' and 'Create a new program' in opts[1] and opts[2] == "Newt's 4-Day Split", opts[:3])
        await pg.locator('#pick-self').click(); await pg.wait_for_timeout(300)
        check('Self-log card', await pg.locator('.next-card', has_text='Log your own workout').count() == 1)
        # Follow a plan from its page
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.locator('.topsw button', has_text='Plans').click(); await pg.wait_for_timeout(300)
        await pg.locator('.r-card', has_text='Efficient Push/Pull/Legs').click(); await pg.wait_for_timeout(300)
        await pg.locator('#follow').click(); await pg.wait_for_timeout(300)
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(300)
        check('Up next follows the chosen plan', await pg.locator('.next-card h2').inner_text() == 'PUSH' or (await pg.locator('.next-card h2').inner_text()).upper() == 'PUSH', await pg.locator('.next-card h2').inner_text())
        # History and save status
        await pg.locator('.topsw button', has_text='History').click(); await pg.wait_for_timeout(300)
        check('History shows a labeled save status', await pg.locator('.sync-line').count() == 1, await pg.locator('.sync-line').inner_text())
        await pg.locator('.topsw button', has_text='Train').click(); await pg.wait_for_timeout(200)
        # Sheet handle: drag up = full height, drag down = smaller, drag further = close, tap toggles
        async def drag(dy):
            b = await pg.locator('.grab-zone').bounding_box(); x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
            await pg.mouse.move(x, y); await pg.mouse.down()
            for k in range(1, 9): await pg.mouse.move(x, y + dy * k / 8); await pg.wait_for_timeout(30)
            await pg.mouse.up(); await pg.wait_for_timeout(350)
        await pg.locator('.wd').first.click(); await pg.wait_for_timeout(300)
        h0 = (await pg.locator('.sheet').bounding_box())['height']
        await drag(-250)
        h1 = (await pg.locator('.sheet').bounding_box())['height']
        check('drag up makes the sheet full height', await pg.locator('.sheet.big').count() == 1 and h1 > h0 + 100, (h0, h1))
        await drag(80)
        check('drag down shrinks it back', await pg.locator('.sheet.big').count() == 0 and await pg.locator('.sheet').count() == 1)
        await pg.locator('.grab-zone').click(); await pg.wait_for_timeout(300)
        check('tapping the bar toggles the size', await pg.locator('.sheet.big').count() == 1)
        await pg.locator('.grab-zone').click(); await pg.wait_for_timeout(300)
        await drag(220)
        check('drag down further closes it', await pg.locator('.sheet').count() == 0)
        # Tips hide and come back
        await pg.locator('.tip-card .tip-x').first.click(); await pg.wait_for_timeout(200)
        check('tip hidden', await pg.locator('.tip-card', has_text='Tap a day').count() == 0)
        await pg.reload(); await pg.wait_for_timeout(1500)
        check('tip stays hidden after reload', await pg.locator('.tip-card', has_text='Tap a day').count() == 0)
        await pg.locator('#help-btn').click(); await pg.get_by_role('button', name='Show tips again').click(); await pg.wait_for_timeout(300)
        check('tips come back', await pg.locator('.tip-card', has_text='Tap a day').count() == 1)
        # Tour visits every page
        await pg.locator('#help-btn').click(); await pg.locator('#help-tour').click(); await pg.wait_for_timeout(300)
        seen = []
        for _ in range(11):
            await pg.wait_for_timeout(250); seen.append((await pg.locator('.tab.on').inner_text()).strip())
            await pg.locator('#tour-next').click(); await pg.wait_for_timeout(250)
        check('tour walks through each page', seen == ['Train'] * 5 + ['Routines', 'Routines', 'Stats', 'Profile', 'Train', 'Train'], seen)
        check('tour closes', await pg.locator('.tour').count() == 0)
        # Feedback
        await pg.locator('#help-btn').click(); await pg.locator('#help-feedback').click(); await pg.wait_for_timeout(300)
        await pg.fill('#fb-text', 'Rest timer stopped beeping')
        href = await pg.locator('#fb-send').get_attribute('href')
        check('feedback opens a prefilled support page', href.startswith('https://github.com/bdoggwoofwoof/ironwood/issues/new?title=') and 'Rest timer stopped beeping' in unquote(href) and 'liftbook.v1' not in unquote(href), unquote(href)[:110])
        await pg.keyboard.press('Escape')
        # Colors
        before = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
        await pg.locator('.tabs button', has_text='Profile').click(); await pg.wait_for_timeout(300)
        await pg.locator('.pal', has_text='Red-green friendly').click(); await pg.wait_for_timeout(200)
        after = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
        check('color theme changes accent', before != after and after.lower() in ('#56b4e9', '#0072b2'), (before, after))
        await pg.reload(); await pg.wait_for_timeout(1500)
        kept = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
        check('color theme kept after reload', kept == after, kept)
        await pg.locator('.tabs button', has_text='Profile').click(); await pg.locator('.pal', has_text='Classic').click(); await pg.wait_for_timeout(200)
        check('back to classic', await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()") == before)
        # Custom colors from the wheel
        await pg.locator('.tabs button', has_text='Profile').click(); await pg.wait_for_timeout(300)
        await pg.locator('#pal-custom').click(); await pg.wait_for_timeout(400)
        w = await pg.locator('#color-wheel').bounding_box(); cx, cy = w['x'] + w['width'] / 2, w['y'] + w['height'] / 2
        await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx + 90, cy - 30, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        lines = {}
        for k in ['Complementary', 'Split', 'Triadic', 'Square', 'Analogous']:
            await pg.locator('.sheet .chip', has_text=k).click(); await pg.wait_for_timeout(100); lines[k] = await pg.locator('.wheel .wl.sug').count()
        check('suggestion lines per harmony', lines == {'Complementary': 1, 'Split': 2, 'Triadic': 2, 'Square': 3, 'Analogous': 2}, lines)
        await pg.locator('#fill-sugg').click(); await pg.wait_for_timeout(100)
        vals = await pg.evaluate("(() => { const c = [...document.querySelectorAll('.slot-btn i')].map(e => getComputedStyle(e).backgroundColor.match(/\\d+/g).map(Number)); return c.map(x => Math.max(...x)); })()")
        check('all three share one brightness', len(set(vals)) == 1, vals)
        await pg.locator('#cw-save').click(); await pg.wait_for_timeout(300)
        acc = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
        check('custom colors applied', acc.lower() not in ('#1f5fd6', '#4c8dff') and await pg.locator('#pal-custom.on').count() == 1, acc)
        await pg.reload(); await pg.wait_for_timeout(1500)
        check('custom colors kept after reload', await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()") == acc)
        # an old link to #log opens History
        await pg.goto(URL + '#log'); await pg.reload(); await pg.wait_for_timeout(1500)
        check('#log opens History', (await pg.locator('.topsw button.on').inner_text()).upper() == 'HISTORY')
        # First launch: the tour opens by itself, shows sample stats, and leaves no trace
        q = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); q.on('pageerror', lambda e: errs.append(str(e)))
        await q.goto(URL); await q.wait_for_timeout(2200)
        check('tour opens on first launch', await q.locator('.tour', has_text='Welcome to Ironwood').count() == 1)
        holes = []
        for _ in range(7):
            await q.locator('#tour-next').click(); await q.wait_for_timeout(450); holes.append(await q.locator('.tour-hole').count())
        check('each step highlights what it talks about', all(holes), holes)
        check('tour reaches Stats with sample data', (await q.locator('.tab.on').inner_text()).strip() == 'Stats' and await q.locator('#demo-banner').count() == 1 and await q.locator('.lift-row').count() >= 5, await q.locator('.lift-row').count())
        await q.locator('#tour-skip').click(); await q.wait_for_timeout(400)
        check('skipping clears the sample data', await q.locator('#demo-banner').count() == 0 and await q.locator('.lift-row').count() == 0 and await q.evaluate("sessionList().length") == 0)
        check('nothing fake saved', await q.evaluate("Object.keys(JSON.parse(localStorage.getItem('liftbook.v1') || '{\"sessions\":{}}').sessions || {}).length") == 0)
        await q.reload(); await q.wait_for_timeout(2200)
        check('tour does not reopen', await q.locator('.tour').count() == 0)
        await q.locator('.tabs button', has_text='Profile').click(); await q.wait_for_timeout(300)
        await q.locator('#profile-tour').click(); await q.wait_for_timeout(300)
        check('tour can be redone from Profile', await q.locator('.tour', has_text='Welcome to Ironwood').count() == 1)
        await q.screenshot(path='shot-tour.png')
        for _ in range(11): await q.locator('#tour-next').click(); await q.wait_for_timeout(250)
        check('finishing the tour clears sample data too', await q.evaluate("sessionList().length") == 0 and await q.locator('.tour').count() == 0)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
