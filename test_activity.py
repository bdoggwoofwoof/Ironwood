"""Quick-log other activities: saved from Train / Log / a day, shown in the Log, counted toward the week goal, editable and deletable."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8768
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        before = await pg.evaluate("weekStats().thisCount")
        await pg.locator('#log-activity').click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-activity.png', full_page=True)
        await pg.get_by_role('button', name='Running', exact=True).click()
        await pg.fill('#ac-dur', '28'); await pg.fill('#ac-dist', '3.1'); await pg.fill('#ac-note', 'Easy pace')
        await pg.get_by_role('button', name='Save activity').click(); await pg.wait_for_timeout(400)
        after = await pg.evaluate("weekStats().thisCount")
        check('counts toward this week', after == before + 1, (before, after))
        check('week strip shows today', await pg.evaluate("dayCounts()[ymd(Date.now())] >= 1"))
        await pg.locator('.tabs button', has_text='Log').click(); await pg.wait_for_timeout(300)
        item = await pg.locator('.log-item').first.inner_text()
        check('log shows distance, time and pace', 'Running' in item and '3.1 mi' in item and '28 min' in item and '9:02 /mi' in item, item.replace('\n', ' | '))
        # edit: switch to swimming
        await pg.locator('.log-item').first.click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Yoga', exact=True).click(); await pg.fill('#ac-dur', '60')
        await pg.get_by_role('button', name='Save changes').click(); await pg.wait_for_timeout(300)
        item = await pg.locator('.log-item').first.inner_text()
        check('edit saved', 'Yoga' in item and '60 min' in item and ' mi ' not in item and '/mi' not in item, item.replace('\n', ' | '))
        check('still one entry', await pg.locator('.log-item').count() == 1)
        # Other, backdated from a day in the week strip
        await pg.locator('.tabs button', has_text='Log').click()
        await pg.evaluate("openSheet({ type: 'activity', day: ymd(addDays(new Date(), -2)) })"); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Other', exact=True).click(); await pg.fill('#ac-name', 'Climbing'); await pg.fill('#ac-dur', '90')
        await pg.get_by_role('button', name='Save activity').click(); await pg.wait_for_timeout(300)
        names = await pg.locator('.log-item h3').all_inner_texts()
        check('backdated custom activity', names == ['Yoga', 'Climbing'], names)
        check('dated two days ago', await pg.evaluate("Object.values(S.sessions).some(s => s.name === 'Climbing' && ymd(s.startedAt) === ymd(addDays(new Date(), -2)))"))
        # reload keeps them; delete one
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Log').click(); await pg.wait_for_timeout(300)
        check('saved after reload', await pg.locator('.log-item').count() == 2)
        await pg.locator('.log-item', has_text='Climbing').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Delete', exact=True).click(); await pg.get_by_role('button', name='Delete activity').click(); await pg.wait_for_timeout(300)
        check('deleted', await pg.locator('.log-item').count() == 1)
        await pg.screenshot(path='shot-log-activity.png', full_page=True)
        await pg.locator('.tabs button', has_text='Stats').click(); await pg.wait_for_timeout(500)
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(300)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
