"""Meal planning audit, phase 5 (Nov 17): 44-point tap areas on the Meals pages without changing the look, and the
labels a screen reader needs (meal rows, status chips, shopping ticks, swipe actions also in the row's sheet)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8845
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, info=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  ' + str(info)[:400]))
SEED = """mealCommit(m => { m.me = { h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle', us: true }; const t = targetsFor(m.me); m.goals = { kcal: t.kcal, p: t.p, c: t.c, f: t.f }; m.extras = [{ id: 'e1', t: 'coffee', c: false }]; });
setPlanDates(new Date(), 5); genFill(4242, { auto: true });"""
# Every visible control: its hit area (the box, or the box grown by an invisible ::after) is at least 44 × 44
SMALL = """(() => { const bad = []; for (const el of document.querySelectorAll('main button, main [role=checkbox], .sheet button')) {
  const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.closest('.tip-card, .tab-intro') || el.classList.contains('grab-zone')) continue;
  const a = getComputedStyle(el, '::after'); let w = r.width, h = r.height;
  if (a.content !== 'none' && a.position === 'absolute') { w = Math.max(w, parseFloat(a.width) || 0); h = Math.max(h, parseFloat(a.height) || 0); }
  if (w < 43.5 || h < 43.5) bad.push((el.id || el.className || el.tagName) + ' ' + Math.round(w) + '×' + Math.round(h)); } return [...new Set(bad)]; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1200)
        ev = pg.evaluate
        await ev(SEED); await pg.wait_for_timeout(300)
        for name, js in [('Plan', "UI.setTab('meals'); UI.setView(null); setMealsMode('plan')"), ('Log', "setMealsMode('log')"), ('Recipes', "setMealsMode('recipes')"), ('Shop', "setMealsMode('list')"),
                         ('a recipe', "UI.setView({ type: 'meal', id: 'm-sheet-pan' })"), ('Start cooking', "UI.setView({ type: 'cook' })"),
                         ('the meal sheet', "UI.setView(null); setMealsMode('plan'); openSheet({ type: 'planMeal', d: ymd(new Date()), k: 'l' })"),
                         ('More planning tools', "closeSheet(); openPlanTools()"), ('the shopping sheet', "closeSheet(); setMealsMode('list'); openSheet({ type: 'shopItem', k: shoppingList()[0].key })")]:
            await ev(js + "; S.rerender()"); await pg.wait_for_timeout(400)
            bad = await ev(SMALL)
            check('E: every control on ' + name + ' has a 44-point tap area', not bad, bad)
        await ev("closeSheet(); setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        # the grown area really takes the tap: just above a segment button
        r = await ev("(() => { const b = document.querySelector('#units-weight'); const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top - 4); return !!el && (el === b || b.contains(el)); })()")
        check('...and a tap just outside the drawn segment still hits it', r)
        check('the look stays: segments are drawn at their old height', await ev("Math.round(document.querySelector('#units-weight').getBoundingClientRect().height)") <= 34)
        # screen-reader labels
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        lab = await ev("document.querySelector('[id^=\"pm-\"]').getAttribute('aria-label')")
        check('each meal row reads its day, meal, recipe and status', lab and ',' in lab and ':' in lab, lab)
        await ev("setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        t = await ev("[...document.querySelectorAll('.shop-tick')].slice(0, 2).map(b => [b.getAttribute('role'), b.getAttribute('aria-checked'), b.getAttribute('aria-label')])")
        check('shopping ticks are checkboxes that say bought or not', all(x[0] == 'checkbox' and x[1] in ('true', 'false') and 'bought' in x[2].lower() for x in t), t)
        check('swipe actions are hidden from the screen reader until opened (they are in the row sheet too)', await ev("[...document.querySelectorAll('.shop-acts')].every(a => a.getAttribute('aria-hidden') === 'true')"))
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
