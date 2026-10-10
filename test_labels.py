"""The 4-Day Split matches Newt's in-app edit (so that edit no longer reads as 'Edited'); routine lines say sets × reps and the last weight with its unit."""
import asyncio, json, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8767
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
EDIT = None
if len(sys.argv) > 1:
    d = json.load(open(sys.argv[1])); d = d.get('data', d); EDIT = d['routines']['bi-newt-4day']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        if EDIT:
            await pg.evaluate("e => commit(st => { st.meta.routines[e.id] = e; }, 'meta')", EDIT); await pg.wait_for_timeout(300)
            check('in-app edit matches the new standard version', await pg.evaluate("!libOver('bi-newt-4day') && getRoutine('bi-newt-4day').days[3].items.length === 4"))
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        tag = await pg.locator('.r-card', has_text="Newt's").locator('.tag').inner_text()
        check('4-Day Split not marked Edited', 'EDITED' not in tag.upper(), tag)
        # log Decline Chest Press at 100 lb
        await pg.locator('.r-card', has_text="Newt's").click(); await pg.wait_for_timeout(300)
        first = await pg.locator('.r-items li').first.inner_text()
        check('line reads sets × reps', '3 sets × 5-8 reps' in first, first.replace('\n', ' | '))
        await pg.locator('.pill-btn', has_text='Start').first.click(); await pg.wait_for_timeout(500)
        meta = await pg.locator('.slot .meta').first.inner_text()
        check('workout says reps', '3 sets × 5-8 reps' in meta, meta)
        await pg.locator('.set-row input[inputmode="decimal"]').nth(0).fill('100')
        await pg.locator('.set-row input[inputmode="numeric"]').nth(0).fill('8'); await pg.wait_for_timeout(200)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.evaluate("S.sessions['t1'] = { id: 't1', name: 'x', routineId: 'bi-newt-4day', dayId: 'bi-newt-4day-d1', startedAt: Date.now() - 4e6, endedAt: Date.now() - 3e6, items: [{ ex: 'b-decline-chest-press', group: '', u: 'lb', sets: [{ w: 100, r: 8 }] }] }; S.active = null; S.ver++; S.rerender()"); await pg.wait_for_timeout(300)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.r-card', has_text="Newt's").click(); await pg.wait_for_timeout(300)
        first = await pg.locator('.r-items li').first.inner_text()
        check('last weight shown with unit', 'last 100 lb' in first, first.replace('\n', ' | '))
        await pg.screenshot(path='shot-split.png', full_page=True)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
