"""Meals (Nov 11, Newt): skip a meal you already have covered (Thursday lunch at work), a bigger Log food, a + button
on every Meals page, small goal tiles, and Clear this week that keeps saved preps and preferences."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8818
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
        # Today: small tiles, Log food near the top, + button
        await ev("UI.setTab('meals'); setMealsMode('log'); S.rerender()"); await pg.wait_for_timeout(300)
        h = await ev("document.querySelector('#log-totals').getBoundingClientRect().height")
        check('goal tiles are small', h < 170, h)
        check('Log food sits above the fold', await ev("document.querySelector('#log-add').getBoundingClientRect().bottom < 600"))
        for mode in ['log', 'plan', 'recipes', 'list']:
            await ev(f"setMealsMode('{mode}'); S.rerender()"); await pg.wait_for_timeout(400)
            want = 0 if mode == 'list' else 1  # Nov 16: the Quick log button is on every Meals page except Shopping (audit D5)
            try:
                await pg.wait_for_function(f"document.querySelectorAll('#quick-fab:not([hidden])').length === {want}", timeout=3000)
            except Exception:
                pass
            check('+ button on ' + mode, await pg.locator('#quick-fab:not([hidden])').count() == want, await ev("[MEALS.mode, document.querySelector('#quick-fab') && [...document.querySelectorAll('#quick-fab')].map(e => e.outerHTML.slice(0, 120)).join(' ;; ')]"))
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#quick-fab'); await pg.wait_for_timeout(300); await pg.click('#ql-food'); await pg.wait_for_timeout(300)
        check('+ opens Log food', await pg.locator('#lf-num-go').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(300)
        # Make a plan and a saved prep
        await ev("setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(300)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '180'); await pg.fill('#tg-age', '30')
        await pg.click('#tg-save'); await pg.wait_for_timeout(500)
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: ['halal'], dislikes: 'olives' }; m.preps = { k1: { id: 'k1', name: 'Keep me', items: [[m.plan.items[0].r, 3]] } }; })")
        check('plan made', await ev("!!ML().gen && ML().plan.fromMenu && ML().plan.items.length > 0"))
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        # Nov 16 (audit phase 2): the day tabs are the plan's dates; find Thursday's
        ti = await ev("menuWindow().findIndex(d => dowIdx(d) === 3)"); thuD = await ev(f"menuWindow()[{ti}]")
        await pg.click(f'#menu-d{ti}'); await pg.wait_for_timeout(200)
        lunch = await ev(f"(dayRows(dayMeals('{thuD}')).find(x => x.key === 'l') || {{}}).x")
        check('Thursday has a lunch', bool(lunch))
        kcal0 = await ev(f"dayTotals(dayMeals('{thuD}').filter(x => x.slot !== 'x')).kcal")
        r = lunch['r']; sv = lunch['sv']; n0 = await ev(f"recipeCount('{r}')")
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        check('Skip saves Thursday lunch, every week', await ev("(ML().rules || []).some(u => u.dow === 3 && u.k === 'l')") and await ev(f"isOffMeal('{thuD}', 'l')"))
        check('row reads Covered elsewhere', 'Covered elsewhere' in await pg.inner_text('#menu-card'))
        check('the button now says Prep it', await pg.inner_text('#menu-skip-l') == 'Prep it')
        check('day total drops', 'This day: ' + format(kcal0, ',') not in await pg.inner_text('#menu-total'), kcal0)
        n1 = await ev(f"recipeCount('{r}')")
        check('what you cook drops that lunch', abs(n1 - (n0 - sv)) < 1e-6, (n0, n1, sv))
        await pg.click('#plan-shuffle'); await pg.wait_for_timeout(300)
        check('skip stays after Different meals', await ev("(ML().rules || []).some(u => u.dow === 3 && u.k === 'l')") and (await ev(f"'{thuD}' < ymd(new Date())") or await ev(f"isOffMeal('{thuD}', 'l')")))
        await pg.click(f'#menu-d{ti}'); await pg.wait_for_timeout(200)
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        check('Prep it turns it back on', not await ev("(ML().rules || []).some(u => u.dow === 3 && u.k === 'l')") and not await ev(f"isOffMeal('{thuD}', 'l')"))
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        # Today hides a skipped meal
        thu = thuD
        check('picked a Thursday', await ev(f"menuDayIdx(parseYmd('{thu}'))") == 3)
        await ev(f"setMealsMode('log'); UI.mealDay = '{thu}'; S.rerender()")
        await pg.wait_for_timeout(300)
        if await ev(f"typeof setMealDay === 'function'"):
            await ev(f"setMealDay('{thu}')"); await pg.wait_for_timeout(300)
        html_ = await ev("document.querySelector('#today-menu') ? document.querySelector('#today-menu').innerText : ''")
        check('Today leaves the skipped lunch out', html_ == '' or 'Lunch' not in html_, html_[:120])
        # Clear this week
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#plan-clear'); await pg.wait_for_timeout(300)
        check('clear warns it can\'t be undone', 'can’t be undone' in await pg.inner_text('.sheet'))
        await pg.click('.sheet .btn.danger'); await pg.wait_for_timeout(400)
        M = await ev("ML()")
        check('clear drops the meal plan and the cooking', 'gen' not in M and not M['plan']['items'] and not M['plan'].get('fromMenu'), list(M.keys()))
        check('clear keeps saved preps', 'k1' in M['preps'])
        check('clear keeps food preferences', M['prefs'].get('diets') == ['halal'] and M['prefs'].get('dislikes') == 'olives', M['prefs'])
        check('clear keeps your answers (goals)', bool(M.get('goals', {}).get('kcal')) and bool(M.get('me')))
        check('clear keeps skipped meals', {'dow': 3, 'k': 'l'} in M.get('rules', []), M.get('rules'))
        check('back to Plan my week', await pg.locator('#plan-start').count() == 1)
        check('old skips become rules on load; only real ones are kept', await ev("normMeals({ skip: { '9:zz': true, '2:d': true, 'x': true } }).rules") == [{'dow': 2, 'k': 'd'}])
        check('...and bad rules are dropped', await ev("normMeals({ v: 2, rules: [{ dow: 2, k: 'd' }, { dow: 1, k: 'zz' }] }).rules") == [{'dow': 2, 'k': 'd'}])
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
