"""Audit Phase 2 (Nov 10): one Plans library (search, filter chips, Show all), "plan" wording everywhere, Train with
Up next before the week and the schedule grid in a sheet, Profile in four groups plus an Advanced page, Progress in
four tabs."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8797
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        # Plans library
        await ev("UI.setTab('routines'); lsSet('rtFilter', 'all'); S.rerender()"); await pg.wait_for_timeout(300)
        txt = await pg.inner_text('main') if await pg.locator('main').count() else await pg.inner_text('body')
        check('Plans has a search box and filter chips', await pg.locator('#plan-q').count() == 1 and await pg.locator('#plan-filters button').count() >= 8)
        check('no Routines/Plans switch any more', await pg.locator('.topsw button').count() == 0)
        check('no "routine" wording on Plans', 'routine' not in txt.lower(), [l for l in txt.split('\n') if 'routine' in l.lower()][:3])
        check('All shows at most 3 per section', await pg.locator('#ps-lift .r-card').count() == 3)
        await pg.click('#more-lift'); await pg.wait_for_timeout(200)
        check('Show all opens the whole section', await pg.locator('#ps-lift .r-card').count() > 3)
        await pg.click('#pf-fight'); await pg.wait_for_timeout(200)
        check('Fight filter shows only fight plans', await pg.locator('#ps-fight').count() == 1 and await pg.locator('#ps-lift').count() == 0)
        check('filter is remembered', await ev("lsGet('rtFilter')") == 'fight')
        await pg.click('#pf-all'); await pg.fill('#plan-q', '5x5'); await pg.wait_for_timeout(200)
        check('search finds a plan by name', '5×5' in (await pg.inner_text('.r-card')).lower() if await pg.locator('.r-card').count() else False)
        await pg.fill('#plan-q', 'zzzqqq'); await pg.wait_for_timeout(200)
        check('search with no match says so', await pg.locator('text=Nothing found').count() == 1)
        await pg.fill('#plan-q', ''); await pg.click('#pf-care'); await pg.wait_for_timeout(200)
        check('Joint care filter keeps the area finder', await pg.locator('#ps-care').count() == 1 and await pg.locator('#care-finder').count() == 1)
        await pg.click('#pf-type'); await pg.wait_for_timeout(200)
        check('By type is a filter', await pg.locator('#by-type').count() == 1)
        # Fight and Run send you to the filtered library
        await ev("lsSet('rtFilter', 'all'); TRAIN.mode = 'fight'; lsSet('trainMode', 'fight'); UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        if await pg.locator('#fight-in-plans').count() == 0:
            await ev("const t = [...document.querySelectorAll('button')].find(x => /^Plans$/i.test(x.textContent.trim())); t && t.click()"); await pg.wait_for_timeout(300)
        await pg.click('#fight-in-plans'); await pg.wait_for_timeout(300)
        check('Fight opens Plans filtered to fight', await ev("lsGet('tab')") == 'routines' and await ev("lsGet('rtFilter')") == 'fight')
        # Train: Up next before This week, schedule grid in a sheet
        await ev("commit(st => { st.meta.settings.program = 'bi-5x5'; }, 'meta'); TRAIN.mode = 'train'; lsSet('trainMode', 'train'); UI.setView(null); UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        order = await ev("(() => { const hs = [...document.querySelectorAll('.today .section-h h2')].map(h => h.textContent.trim()); return [hs.indexOf('Up next'), hs.indexOf('This week')]; })()")
        check('Up next comes before This week', order[0] >= 0 and order[1] > order[0], order)
        check('Start is on the first screen', await ev("(() => { const b = [...document.querySelectorAll('.next-card .btn.primary')][0]; return !!b && b.getBoundingClientRect().bottom < innerHeight; })()"))
        check('one week strip, no grid on Train', await pg.locator('#plan-week').count() == 0 and await pg.locator('.week').count() == 1)
        await pg.click('#plan-sched'); await pg.wait_for_timeout(300)
        check('Schedule opens the grid in a sheet', await pg.locator('.sheet #plan-week').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        t2 = await pg.inner_text('body')
        check('no "routine" wording on Train', 'routine' not in t2.lower(), [l for l in t2.split('\n') if 'routine' in l.lower()][:3])
        # Profile
        await ev("UI.setTab('profile')"); await pg.wait_for_timeout(300)
        hs = await ev("[...document.querySelectorAll('.section-h h2')].map(h => h.textContent.trim())")
        check('Profile groups: Backup, Display, Training basics, Help, About', hs == ['Backup', 'Display & language', 'Training basics', 'Help', 'About'], hs)
        check('no stale Nutrition placeholder', 'Coming later' not in await pg.inner_text('body'))
        await pg.click('#profile-more'); await pg.wait_for_timeout(300)
        hs2 = await ev("[...document.querySelectorAll('#profile-advanced .section-h h2')].map(h => h.textContent.trim())")
        check('Advanced page has the rest', hs2 == ['Weight jumps', 'Rest timer', 'Personal records', 'Streaks', 'Rep ranges'], hs2)
        check('Advanced page has a title and a back button', (await pg.inner_text('.hdr h1')).lower() == 'training settings' and await pg.locator('.hdr .pill-btn').count() == 1)
        await pg.locator('.hdr .pill-btn').click(); await pg.wait_for_timeout(200)
        check('back returns to Profile', await pg.locator('#profile-more').count() == 1)
        # Progress
        await ev("lsSet('statsTab', 'cats'); UI.setTab('stats'); S.rerender()"); await pg.wait_for_timeout(300)
        tabs = await ev("[...document.querySelectorAll('[role=tablist] [role=tab]')].map(t => t.textContent.trim())")
        check('Progress has four tabs', tabs == ['History', 'Numbers', 'Exercises', 'Photos'], tabs)
        check('an old saved tab opens Numbers', await ev("document.querySelector('[role=tab][aria-selected=true]').textContent.trim()") == 'Numbers')
        check('Numbers has the overall numbers and sets by muscle', await pg.locator('#stats-cats').count() == 1 and await pg.locator('.per').count() == 1)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
