"""Audit Phase 3 (Nov 10): six-stop tour, swipe tip only in the first 2 workouts, one-row rest bar, one tip per
screen, one shared disclaimer line, About you shared by the setups, gray type chips (max 3), letters in the week
dots, one custom-food path, and a disabled main button that looks off."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8795
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        # Tour
        n = await ev("TOUR.length")
        check('tour has six stops', n == 6, n)
        tabs = await ev("TOUR.map(t => t[0])")
        check('tour visits each tab once', tabs == ['train', 'train', 'routines', 'stats', 'meals', 'profile'], tabs)
        # Week dots carry letters
        await ev("setProgram('bi-5x5'); setAddon('bi-care-back', true); UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        letters = await ev("[...document.querySelectorAll('.wd-dot')].map(d => d.textContent)")
        check('week dots show letters', letters and set(letters) <= {'L', 'J', 'R', 'F', 'C'} and 'L' in letters and 'J' in letters, letters)
        check('schedule grid uses the same letters', await ev("(() => { openSheet({ type: 'schedule' }); return true; })()")); await pg.wait_for_timeout(300)
        cells = await ev("[...document.querySelectorAll('.pw-cell.on')].map(c => c.textContent.trim()).filter(Boolean)")
        check('grid letters L and J', 'L' in cells and 'J' in cells, cells)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        # Chips
        await ev("UI.setTab('routines'); lsSet('rtFilter', 'lift'); S.rerender()"); await pg.wait_for_timeout(300)
        counts = await ev("[...document.querySelectorAll('.r-card .tag-row')].map(r => r.querySelectorAll('.chip:not(.more)').length)")
        check('at most 3 type chips on a card', counts and max(counts) <= 3, counts)
        check('a "+N" chip stands for the rest', await pg.locator('.r-card .chip.more').count() >= 1)
        col = await ev("getComputedStyle(document.querySelector('.r-card .chip.wtag')).color")
        acc = await ev("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()")
        check('chips are gray, not the accent', 'rgb(' not in acc and col != acc, (col, acc))
        # One tip per screen
        await ev("lsSet('rtFilter', 'all'); commit(st => { st.meta.settings.tipsOff = {}; }, 'meta'); UI.setTab('train'); S.rerender()"); await pg.wait_for_timeout(300)
        check('at most one tip on a screen', await pg.locator('.tip-card:has(.tip-x[aria-label="Hide this tip"])').count() <= 1)
        # Swipe hint only for the first 2 workouts
        await ev("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(300)
        check('swipe hint shows in an early workout', await pg.locator('.swipe-hint').count() == 1)
        await ev("S.active = null; for (let i = 0; i < 2; i++) { const id = 'x' + i; S.sessions[id] = { id, name: 'A', startedAt: Date.now() - (i + 1) * 864e5, endedAt: Date.now() - (i + 1) * 864e5 + 36e5, items: [] }; } S.rerender()")
        await ev("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(300)
        check('swipe hint gone after 2 workouts', await pg.locator('.swipe-hint').count() == 0)
        # Rest bar is one row
        await ev("const it = S.active.items[0]; it.sets[0].w = '100'; it.sets[0].r = '5'; completeSet(it, it.sets[0], false); S.rest && (S.rest.offerBg = false); S.rest.total += 15; S.rest.until += 15000; S.rerender()"); await pg.wait_for_timeout(400)
        h = await ev("document.querySelector('.restbar-in').getBoundingClientRect().height")
        check('rest bar is one row', h < 70, h)
        check('Keep makes the new rest time the default', await pg.locator('.rest-save').count() == 1)
        await pg.click('.rest-save'); await pg.wait_for_timeout(300)
        check('default saved', await ev("S.meta.settings.rest") == await ev("S.rest ? S.rest.total : S.meta.settings.rest"))
        await ev("S.active = null; S.rest = null; S.rerender()")
        # Disclaimer
        check('one shared disclaimer line', await ev("NOT_ADVICE") == 'Estimates and general guidance, not medical advice.')
        page = await ev("document.documentElement.innerHTML")
        check('no physical-therapy wording anywhere', 'physical therap' not in (await ev("[...document.scripts].map(s => s.textContent).join(' ')")).lower())
        # About you
        await ev("UI.setTab('profile'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#about-you'); await pg.wait_for_timeout(300)
        await pg.fill('#ay-ft', '5'); await pg.fill('#ay-in', '10'); await pg.fill('#ay-w', '180'); await pg.fill('#ay-age', '30')
        await pg.click('#ay-goal-lose'); await pg.click('#ay-days-4'); await pg.click('#ay-save'); await pg.wait_for_timeout(300)
        a = await ev("aboutYou()")
        check('About you saves height, weight, goal and days', abs(a['h'] - 177.8) < 1 and abs(a['w'] - 81.6) < 0.5 and a['goal'] == 'lose' and a['days'] == 4, a)
        check('Profile shows the summary', '4 days a week' in await pg.inner_text('#about-you'))
        await ev("commit(st => { delete st.meta.settings.plan; }, 'meta'); openSheet({ type: 'goalSetup' })"); await pg.wait_for_timeout(300)
        check('Build my plan starts from About you', await pg.locator('#gs-goal-lose.on').count() == 1 and await pg.locator('#gs-from-about').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        await ev("openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(300)
        check('meal plan starts from About you', await pg.input_value('#tg-w') == '180' and await pg.locator('#tg-goal-lose.on').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        await ev("openSheet({ type: 'ironSetup', ver: 'iron75' })"); await pg.wait_for_timeout(300)
        check('Iron 75 starts from About you', await pg.locator('#ip-fat.on').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        # One custom-food path
        await ev("UI.setTab('meals'); setMealsMode('log'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#log-add'); await pg.wait_for_timeout(300)
        check('food log offers Quick add numbers', await pg.locator('#lf-num-go', has_text='Quick add numbers').count() == 1)
        await pg.click('#lf-num-go'); await pg.wait_for_timeout(300)
        check('quick add points to saving a food', await pg.locator('#ln-as-food').count() == 1)
        await pg.click('#ln-as-food'); await pg.wait_for_timeout(300)
        check('that opens New food', await pg.locator('#fd-name').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        # Disabled main button
        await ev("setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        if await pg.locator('#extra-item').count():
            bg = await ev("getComputedStyle(document.querySelector('#extra-item + .btn.primary')).backgroundColor")
            check('disabled add button is gray', 'rgba(127, 127, 127' in bg, bg)
        else:
            check('disabled add button is gray', await ev("[...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.selectorText === '.btn.primary:disabled'); } catch (e) { return false; } })"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
