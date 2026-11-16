"""Quick log (Nov 16, Newt): one round + button in the same spot on every page except Profile, opening Quick train
(up next, blank, a day from my plan, another plan, run, fight), Log exercise and Log food."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8837
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("setProgram('bi-ul4'); setAddon('bi-care-stretch', true); S.rerender()")
        boxes = {}
        for tab in ['train', 'routines', 'meals', 'stats', 'profile']:
            await ev(f"UI.setTab('{tab}')"); await pg.wait_for_timeout(250)
            n = await pg.locator('#quick-fab').count()
            boxes[tab] = (await pg.locator('#quick-fab').bounding_box()) if n else None
        check('the button is on Train, Plans, Meals and Progress', all(boxes[t] for t in ['train', 'routines', 'meals', 'stats']), boxes)
        check('...but not on Profile', boxes['profile'] is None)
        xs = {(round(v['x']), round(v['y']), round(v['width'])) for k, v in boxes.items() if v}
        check('same round button in the same spot everywhere', len(xs) == 1 and abs(boxes['train']['width'] - boxes['train']['height']) < 1, xs)
        await ev("UI.setTab('stats')"); await pg.wait_for_timeout(200)
        await pg.click('#quick-fab'); await pg.wait_for_timeout(300)
        txt = await pg.inner_text('.sheet')
        check('three groups: Quick train, Log exercise, Log food', txt.upper().index('QUICK TRAIN') < txt.upper().index('LOG EXERCISE') < txt.upper().rindex('LOG FOOD'), txt[:300])
        check('up next from my plan', 'Start Day 1' in txt)
        for i in ['ql-blank', 'ql-plan', 'ql-other', 'ql-run', 'ql-fight', 'ql-activity', 'ql-bw', 'ql-food']:
            if await pg.locator('#' + i).count() != 1: check('has ' + i, False)
        await pg.click('#ql-plan'); await pg.wait_for_timeout(200)
        check('Pick a day lists my plan and the one alongside', 'Upper / Lower 4-Day' in await pg.inner_text('#ql-days') and 'Deep Stretch Mobility' in await pg.inner_text('#ql-days'))
        did = await ev("getRoutine('bi-ul4').days[2].id")
        await pg.click('#ql-d-' + did); await pg.wait_for_timeout(400)
        check('a day starts that workout on Train', await ev("S.active && S.active.dayId") == did and await ev("lsGet('tab')") == 'train')
        check('no button while lifting', await pg.locator('#quick-fab').count() == 0)
        await ev("UI.setTab('meals')"); await pg.wait_for_timeout(200)
        await pg.click('#quick-fab'); await pg.wait_for_timeout(200)
        check('during a workout it offers Go to your workout', await pg.locator('#ql-resume').count() == 1 and await pg.locator('#ql-blank').count() == 0)
        await pg.click('#ql-food'); await pg.wait_for_timeout(300)
        check('Log food opens the food log', await pg.locator('#lf-num-go').count() == 1)
        await ev("closeSheet(); commit(st => { st.active = null; }, 'active'); UI.setTab('stats')"); await pg.wait_for_timeout(200)
        await pg.click('#quick-fab'); await pg.click('#ql-blank'); await pg.wait_for_timeout(400)
        check('Blank workout starts an empty workout', await ev("!!S.active && S.active.items.length === 0"))
        await ev("commit(st => { st.active = null; }, 'active'); UI.setTab('meals')"); await pg.wait_for_timeout(200)
        await pg.click('#quick-fab'); await pg.click('#ql-run'); await pg.wait_for_timeout(300)
        check('Run goes to Train → Run', await ev("lsGet('tab') === 'train' && TRAIN.mode === 'run'"))
        await pg.click('#quick-fab'); await pg.click('#ql-fight'); await pg.wait_for_timeout(300)
        check('Fight training goes to Train → Fight', await ev("TRAIN.mode === 'fight'"))
        await pg.click('#quick-fab'); await pg.click('#ql-activity'); await pg.wait_for_timeout(300)
        check('Log an activity opens the activity log', 'activity' in (await pg.inner_text('.sheet')).lower())
        await ev("closeSheet(); TRAIN.mode = 'train'; S.rerender()")
        # Settings left the tab bar; a Settings button at the bottom of each page (Nov 16)
        await ev("UI.setTab('stats')"); await pg.wait_for_timeout(200)
        check('no Profile or Settings in the tab bar', await ev("[...document.querySelectorAll('.tabs .tab')].map(t => t.textContent.trim())") == ['Train', 'Plans', 'Meals', 'Progress'])
        check('Settings button at the bottom of the page', await pg.locator('#settings-btn').count() == 1)
        await pg.click('#settings-btn'); await pg.wait_for_timeout(300)
        check('it opens Settings with a Back button', 'SETTINGS' in (await pg.inner_text('main .page-title')).upper() and await pg.locator('#settings-back').count() == 1)
        await pg.click('#settings-back'); await pg.wait_for_timeout(300)
        check('Back returns to the page you were on', await ev("lsGet('tab')") == 'stats')
        # Page intros can be hidden
        await ev("UI.setTab('train'); TRAIN.mode = 'train'; S.rerender()"); await pg.wait_for_timeout(200)
        check('Train intro has an x', await pg.locator('#intro-train .tip-x').count() == 1)
        await pg.click('#intro-train .tip-x'); await pg.wait_for_timeout(200)
        check('tapping it hides the line', await pg.locator('#intro-train').count() == 0 and await ev("S.meta.settings.tipsOff['intro-train'] === 1"))
        await ev("UI.setTab('routines')"); await pg.wait_for_timeout(200)
        check('other pages keep theirs until hidden', await pg.locator('#intro-plans').count() == 1)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
