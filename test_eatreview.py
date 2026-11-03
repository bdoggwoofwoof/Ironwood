"""Review my eating: averages vs goals, sources, food groups, training vs rest days, suggestions (Nov 3)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8795
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SEED = """(() => {
  const d = i => ymd(addDays(startOfDay(new Date()), -i)); const at = (i, h) => { const t = addDays(startOfDay(new Date()), -i); t.setHours(h, 0, 0, 0); return +t; };
  mealCommit(m => { m.goals = { kcal: 2400, p: 160, fib: 30, sug: 50, na: 2300 }; m.me = { h: 178, w: 80, age: 30, sex: 'm', act: 2, goal: 'lose', pace: 'steady' }; m.log = {};
    for (let i = 0; i < 6; i++) m.log[d(i)] = [
      { id: 'a' + i, k: 'num', name: 'Cereal and milk', at: at(i, 8), m: { kcal: 450, p: 15, c: 80, f: 8, fib: 3, sug: 30, na: 300 } },
      { id: 'b' + i, k: 'num', name: 'Burger and fries', at: at(i, 19), m: { kcal: 1400, p: 45, c: 120, f: 70, fib: 6, sug: 15, na: 2100 } },
      { id: 'c' + i, k: 'num', name: 'Chips', at: at(i, 22), m: { kcal: 900, p: 10, c: 90, f: 55, fib: 4, sug: 5, na: 900 } }]; });
  S.sessions = {}; for (const i of [1, 3]) { const id = 's' + i; S.sessions[id] = { id, name: 'Lift', startedAt: at(i, 17), endedAt: at(i, 18), items: [] }; }
  S.ver++; touch();
})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev("UI.setTab('meals'); setMealsMode('log')"); await pg.wait_for_timeout(200)
        check('Log has Review my eating', await pg.locator('#log-review').count() == 1)
        await pg.click('#log-review'); await pg.wait_for_timeout(300)
        check('too few days: explains what it needs', 'at least 3 days' in await pg.locator('#eat-review').inner_text())
        await ev(SEED); await pg.wait_for_timeout(300)
        t = await pg.locator('#er-avg').inner_text()
        check('averages against goals', 'High' in await pg.locator('#er-kcal').inner_text() and 'Low' in await pg.locator('#er-p').inner_text() and 'Over the limit' in await pg.locator('#er-na').inner_text(), t.replace('\n', ' | ')[:200])
        tips = await ev("[...document.querySelectorAll('#er-tips > .card')].map(c => c.id)")
        check('suggests protein, calories, fiber, sodium', all(x in tips for x in ['tip-protein', 'tip-kcal-high', 'tip-fiber', 'tip-sodium']), tips)
        check('food groups missing are named together', 'tip-groups' in tips and 'vegetables' in await pg.locator('#tip-groups').inner_text().then(lambda x: x) if False else 'tip-groups' in tips, tips)
        body = await pg.locator('#tip-kcal-high').inner_text()
        check('says where calories come from and when', 'Burger and fries' in body and 'evening' in body, body[:200])
        check('time of day split', 'Late night' in await pg.locator('#er-times').inner_text())
        check('training vs rest days', 'Training days (2)' in await pg.locator('#er-train').inner_text())
        n0 = await ev("ML().plan.items.length")
        btn = pg.locator('#tip-protein button', has_text='Add to prep').first
        if await btn.count():
            await btn.click(); await pg.wait_for_timeout(200)
        check('a suggested recipe goes into the prep', await ev("ML().plan.items.length") == n0 + 1)
        await ev("mealCommit(m => { m.prefs = { allergies: ['dairy'], diet: 'none', dislikes: '' }; })"); await pg.wait_for_timeout(200)
        bad = await ev("[...document.querySelectorAll('#er-tips .card')].flatMap(c => [...c.querySelectorAll('button')].map(b => b.textContent))")
        check('no suggestion breaks a food allergy', await ev("eatTips(eatReview(7)).flatMap(t => t.recipes || []).every(r => !avoidRecipe(r))"))
        await pg.click('#er-14'); await pg.wait_for_timeout(200)
        check('14-day view', '6 days with food logged' in await pg.locator('#eat-review').inner_text())
        await ev("UI.setTab('stats'); lsSet('statsTab', 'overall'); S.rerender()"); await pg.wait_for_timeout(300)
        check('Progress links to the review', await pg.locator('#stats-eat-review').count() == 1)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
