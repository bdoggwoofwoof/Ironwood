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
            await ev(f"setMealsMode('{mode}'); S.rerender()"); await pg.wait_for_timeout(200)
            check('+ button on ' + mode, await pg.locator('#meal-fab').count() == (0 if mode == 'log' else 1))
        await pg.click('#meal-fab'); await pg.wait_for_timeout(300)
        check('+ opens Log food', await pg.locator('#lf-num-go').count() == 1)
        await ev("closeSheet()"); await pg.wait_for_timeout(300)
        # Make a plan and a saved prep
        await ev("setMealsMode('plan'); S.rerender(); openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(300)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '180'); await pg.fill('#tg-age', '30')
        await pg.click('#tg-save'); await pg.wait_for_timeout(500)
        await ev("mealCommit(m => { m.prefs = { allergies: [], diets: ['halal'], dislikes: 'olives' }; m.preps = { k1: { id: 'k1', name: 'Keep me', items: [[m.plan.items[0].r, 3]] } }; })")
        check('plan made', await ev("!!ML().menu && ML().plan.fromMenu && ML().plan.items.length > 0"))
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#menu-d3'); await pg.wait_for_timeout(200)
        lunch = await ev("(ML().menu.days[3] || []).find(x => x.slot === 'l')")
        check('Thursday has a lunch', bool(lunch))
        before = await ev("JSON.stringify(ML().plan.items)")
        kcal0 = await ev("dayTotals(ML().menu.days[3]).kcal")
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        check('Skip saves Thursday lunch', await ev("ML().skip && ML().skip['3:l'] === true"))
        check('row reads Covered elsewhere', 'Covered elsewhere' in await pg.inner_text('#menu-card'))
        check('the button now says Prep it', await pg.inner_text('#menu-skip-l') == 'Prep it')
        check('day total drops', 'This day: ' + format(kcal0, ',') not in await pg.inner_text('#menu-total'), kcal0)
        after = await ev("ML().plan.items.reduce((a, i) => a + i.n, 0)"); before_n = sum(i['n'] for i in __import__('json').loads(before))
        r = lunch['r']; sv = lunch['sv']
        wk = await ev(f"ML().menu.days.reduce((a, d, di) => a + d.filter(x => x.r === '{r}' && !(di === 3 && x.slot === 'l')).reduce((s, x) => s + x.sv, 0), 0)")
        n = await ev(f"(ML().plan.items.find(i => i.r === '{r}') || {{ n: 0 }}).n")
        check('what you cook drops that lunch', n == (int(-(-wk // 1)) if wk else 0) and after <= before_n, (n, wk, after, before_n))
        await pg.click('#plan-shuffle'); await pg.wait_for_timeout(300)
        check('skip stays after Different meals', await ev("ML().skip['3:l'] === true"))
        await pg.click('#menu-d3'); await pg.wait_for_timeout(200)
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        check('Prep it turns it back on', not await ev("!!(ML().skip || {})['3:l']"))
        await pg.click('#menu-skip-l'); await pg.wait_for_timeout(300)
        # Today hides a skipped meal
        thu = await ev("(() => { const d = new Date(); const back = (d.getDay() + 3) % 7; d.setDate(d.getDate() - back); return ymd(d); })()")
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
        await pg.click('.sheet .btn.primary'); await pg.wait_for_timeout(400)
        M = await ev("ML()")
        check('clear drops the meal plan and the cooking', 'menu' not in M and not M['plan']['items'] and not M['plan'].get('fromMenu'), list(M.keys()))
        check('clear keeps saved preps', 'k1' in M['preps'])
        check('clear keeps food preferences', M['prefs'].get('diets') == ['halal'] and M['prefs'].get('dislikes') == 'olives', M['prefs'])
        check('clear keeps your answers (goals)', bool(M.get('goals', {}).get('kcal')) and bool(M.get('me')))
        check('clear keeps skipped meals', M.get('skip', {}).get('3:l') is True)
        check('back to Plan my week', await pg.locator('#plan-start').count() == 1)
        check('only real skip keys are kept on load', await ev("normMeals({ skip: { '9:zz': true, '2:d': true, 'x': true } }).skip") == {'2:d': True})
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
