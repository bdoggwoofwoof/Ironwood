"""Routine library: new programs show, library routines can be edited, reset, copied, removed and brought back."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8766
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        lib = pg.locator('.r-card')
        names = [await lib.nth(i).locator('h3').inner_text() for i in range(await lib.count())]
        check('library lists 8 routines', len(names) == 8, names)
        await pg.screenshot(path='shot-routines.png', full_page=True)

        # Edit a library routine: rename, drop the first exercise, save
        await pg.locator('.r-card', has_text='Upper / Lower').click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-routine-view.png', full_page=True)
        await pg.get_by_role('button', name='Edit').click(); await pg.wait_for_timeout(300)
        await pg.fill('#rt-name', 'My Upper Lower')
        await pg.get_by_role('button', name='Remove exercise').first.click()
        await pg.get_by_role('button', name='Save routine').click(); await pg.wait_for_timeout(300)
        first = await pg.locator('.r-items li').first.inner_text()
        check('edit saved', 'Bench Press' not in first and await pg.locator('.wo-title').inner_text() in ('My Upper Lower', 'MY UPPER LOWER'), first)
        check('edited routine marked', 'edited' in (await pg.locator('.eyebrow').first.inner_text()).lower())
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        tags = await pg.locator('.r-card .tag').all_inner_texts()
        check('library still 8, one tagged Edited', await pg.locator('.r-card').count() == 8 and sum('EDITED' in t.upper() for t in tags) == 1, tags)

        # Reset
        await pg.locator('.r-card', has_text='My Upper Lower').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Reset').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Reset routine').click(); await pg.wait_for_timeout(300)
        check('reset restores original', 'Bench Press' in await pg.locator('.r-items li').first.inner_text())

        # Copy
        await pg.get_by_role('button', name='Copy').click(); await pg.wait_for_timeout(300)
        check('copy becomes your routine', 'your routine' in (await pg.locator('.eyebrow').first.inner_text()).lower())

        # Remove a library routine, then bring it back
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.r-card', has_text='Full Body 5×5').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Remove').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Remove routine').click(); await pg.wait_for_timeout(300)
        check('removed from library', await pg.locator('.r-card', has_text='Full Body 5×5').count() == 0)
        await pg.get_by_role('button', name='Bring back').click(); await pg.wait_for_timeout(300)
        check('brought back', await pg.locator('.r-card', has_text='Full Body 5×5').count() == 1)

        # Survives reload
        await pg.locator('.r-card', has_text="Newt's").click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Remove').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Remove routine').click(); await pg.wait_for_timeout(800)
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        check('removal kept after reload', await pg.locator('.r-card', has_text="Newt's").count() == 0)

        # Start a new program's day
        await pg.locator('.r-card', has_text='Dumbbells Only').evaluate('e => e.click()'); await pg.wait_for_timeout(300)
        await pg.locator('.pill-btn', has_text='Start').first.evaluate('e => e.click()'); await pg.wait_for_timeout(500)
        check('workout starts from new program', await pg.locator('.set-row').count() > 0)
        kinds = await pg.evaluate("Object.values(BUILTIN_EX).filter(e => /dumbbell|goblet/i.test(e.name)).every(e => e.kind === 'dumbbell')")
        check('dumbbell exercises use dumbbell kind', kinds)
        check('no page errors', not errs, errs[:3])
        await b.close()

try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
