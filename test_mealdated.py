"""Meal planning audit, phase 2 (Nov 16): the dated meal plan. Old data moves over once (fixtures from the plan, section 4),
and every feature reads the dated meals: what you'll cook, the shopping list, the log, the dates, swaps and servings."""
import asyncio, subprocess, sys, time, json
from playwright.async_api import async_playwright
PORT = 8842
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, info=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  ' + str(info)[:400]))
# An old (v1) meals object: a weekday menu, what you'll cook as "times a week", skips, a log linked by meal key
OLD = """(opts => { const o = opts || {};
  const me = { h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle' }; const t = targetsFor(me);
  mealCommit(m => { m.habits = { ...mealHabits(), meals: 4, prep: 'few' }; });
  const menu = o.noMenu ? null : buildMenu(t, 4242);
  const days = o.days || 7; const start = o.start || null; const skip = o.skip || {};
  let items = o.items;
  if (!items && menu) { const w = {}; for (let k = 0; k < days; k++) { const di = start ? menuDayIdx(addDays(parseYmd(start), k)) : k % 7; for (const { x, key } of menuRows(menu.days[di])) if (!skip[di + ':' + key]) w[x.r] = (w[x.r] || 0) + x.sv; }
    items = Object.entries(w).map(([r, n]) => ({ id: 'q' + r, r, n: Math.round(Math.max(1, Math.ceil(n - 1e-6)) * 7 / days * 100) / 100 })); }
  const old = { recipes: {}, foods: {}, preps: o.preps || { k1: { id: 'k1', name: 'Mine', items: [['m-sheet-pan', 3]] } }, saved: {}, extras: [], goals: o.goals || {}, me, habits: { meals: 4, prep: 'few' },
    stars: { 'm-sc-tikka': true }, checks: o.checks || {}, log: o.log || {}, units: 'easy',
    plan: { people: o.people || 1, weeks: 1, days, ...(start ? { start } : {}), items: items || [], ...(o.fromMenu === false ? {} : menu ? { fromMenu: true } : {}), ...(o.src ? { src: o.src } : {}) },
    ...(menu ? { menu } : {}), ...(Object.keys(skip).length ? { skip } : {}), ...(o.rot ? { rot: o.rot } : {}), ...(o.next ? { next: o.next } : {}) };
  return old; })"""
BATCH = "(n => Object.fromEntries(n.plan.items.map(i => [i.r, Math.max(1, Math.ceil(i.sv - 0.02))])))"
OLDBATCH = "(o => Object.fromEntries(o.plan.items.map(i => [i.r, Math.max(1, Math.ceil(+i.n * o.plan.days / 7 - 0.02))])))"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1200)
        ev = pg.evaluate
        async def mig(opts):
            return await ev(f"(() => {{ const old = {OLD}({opts}); const n = normMeals(clone(old)); return {{ before: {OLDBATCH}(old), after: {BATCH}(n), n, err: n.migErr || null }}; }})()")
        # ---- migration fixtures ----
        r = await ev("(() => { const n = normMeals({}); return [n.v, n.plan.start === ymd(prepWeekStart()), n.plan.roll, n.plan.items.length, Object.keys(n.days).length]; })()")
        check('empty: dates on this prep week, rolling, nothing planned', r == [2, True, True, 0, 0], r)
        r = await mig("{}")
        check('meal plan only: same batch, recipe by recipe', r['before'] == r['after'] and not r['err'], (r['before'], r['after'], r['err']))
        check('...the generator and its seed carry over', r['n'].get('gen', {}).get('seed') == 4242 and r['n']['plan'].get('fromMenu') is True)
        check('...every date has its meals, marked as the plan\'s', len(r['n']['days']) == 7 and all(x['by'] == 'plan' for d in r['n']['days'].values() for x in d))
        check('...the old fields are kept in v1 and gone from the top', 'menu' in r['n']['v1'] and 'menu' not in r['n'] and 'skip' not in r['n'] and r['n']['v'] == 2)
        check('...the plan\'s targets become Daily goals when there were none', r['n']['goals'].get('kcal') == await ev("targetsFor({ h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle' }).kcal"))
        r = await mig("{ noMenu: true, items: [{ id: 'a', r: 'm-sheet-pan', n: 7 }, { id: 'b', r: 'm-overnight-oats', n: 3 }, { id: 'c', r: 'm-yogurt-jars', n: 4 }] }")
        check('batch only: same batch', r['before'] == r['after'] and not r['err'], (r['before'], r['after']))
        check('...placed into meals of their kind, as yours', all(x['by'] == 'you' and x.get('sp') for d in r['n']['days'].values() for x in d) and any(x['slot'] == 'b' and x['r'] == 'm-overnight-oats' for d in r['n']['days'].values() for x in d))
        check('...no generator', 'gen' not in r['n'])
        r = await mig("{ fromMenu: false, skip: { '3:l': true, '5:d': true }, items: [{ id: 'a', r: 'm-sheet-pan', n: 7 }, { id: 'b', r: 'm-egg-muffins', n: 5 }, { id: 'c', r: 'm-sc-tikka', n: 4 }] }")
        check('meal plan + your own picks + skips: the batch you were cooking stays', r['before'] == r['after'] and not r['err'], (r['before'], r['after'], r['err']))
        check('...skips become rules and "covered elsewhere" meals', {'dow': 3, 'k': 'l'} in r['n'].get('rules', []) and any(x.get('off') for d in r['n']['days'].values() for x in d))
        check('...your picks drive the cooking, not the plan', not r['n']['plan'].get('fromMenu'))
        r = await mig("{ start: ymd(addDays(new Date(), -1)), days: 4 }")
        check('short date range: 4 dates, same batch', len([d for d in r['n']['days']]) == 4 and r['before'] == r['after'], (list(r['n']['days']), r['before'], r['after']))
        check('...dates kept, not rolling', r['n']['plan']['start'] == await ev("ymd(addDays(new Date(), -1))") and not r['n']['plan'].get('roll'))
        r = await mig("{ people: 2 }")
        check('2 people: People kept, servings per person', r['n']['plan']['people'] == 2 and r['before'] == r['after'])
        r = await mig("{ noMenu: true, src: 'rot', start: thisMonday(), items: [{ id: 'a', r: 'm-sheet-pan', n: 3 }], rot: { ids: ['p-reels-faves', 'p-reels-onepot'], start: ymd(addDays(prepWeekStart(), -21)), applied: thisMonday() } }")
        check('rotation started weeks ago: kept as is, this week\'s prep on the dates', r['n'].get('rot', {}).get('applied') == await ev("thisMonday()") and r['before'] == r['after'] and r['n']['plan'].get('src') == 'rot', r['n'].get('rot'))
        r = await mig("{ next: [{ id: 'n1', name: 'Later', start: ymd(addDays(new Date(), 9)), days: 5, items: [['m-sheet-pan', 3]] }] }")
        check('planned-ahead stretches stay planned ahead', r['n'].get('next', [{}])[0].get('start') == await ev("ymd(addDays(new Date(), 9))"))
        r = await mig("{ checks: { 'chicken breast': 1, onion: 1 } }")
        check('a half-ticked shopping list keeps its ticks', r['n']['checks'] == {'chicken breast': 1, 'onion': 1})
        lg = await ev(f"""(() => {{ const old = {OLD}({{ start: ymd(new Date()) }}); const b = old.menu.days[menuDayIdx()].find(x => x.slot === 'b');
          old.log = {{ [ymd(new Date())]: [{{ id: 'l1', k: 'recipe', r: b.r, slot: 'b', sv: 1, m: {{ kcal: 321, p: 20 }} }}, {{ id: 'l2', k: 'food', name: 'Apple', m: {{ kcal: 95 }} }}] }};
          const n = normMeals(clone(old)); const L = n.log[ymd(new Date())]; const row = dayRows(n.days[ymd(new Date())]).find(x => x.key === 'b');
          return [L.length, L[0].m.kcal, L[0].pm === row.x.id, !L[1].pm]; }})()""")
        check('log entries keep their numbers and link to that date\'s planned meal', lg == [2, 321, True, True], lg)
        # restoring an older backup after the upgrade runs the same move
        rb = await ev(f"""(() => {{ const old = {OLD}({{}}); const d = {{ app: 'liftbook', meta: {{ ...clone(S.meta), meals: old }}, sessions: {{}} }};
          S.sessions['s-x'] = {{ id: 's-x', name: 'x', startedAt: 1, endedAt: 2, items: [], prs: [] }}; mealCommit(m => {{ m.days = {{}}; }});
          restoreInto(S, d); const n = S.meta.meals; return [n.v, !!n.gen, n.plan.items.length > 0, !('menu' in n)]; }})()""")
        check('an older backup restored after the upgrade moves over too', rb == [2, True, True, True], rb)
        # a failure halfway through keeps the batch as extra food and says so
        ff = await ev(f"""(() => {{ const keep = dPlace; window.dPlace = () => {{ throw new Error('boom'); }};
          try {{ const old = {OLD}({{ noMenu: true, items: [{{ id: 'a', r: 'm-sheet-pan', n: 7 }}] }}); const n = normMeals(clone(old)); return [n.migErr, {BATCH}(n), !!n.v1, n.v1.plan.items.length]; }} finally {{ window.dPlace = keep; }} }})()""")
        check('a failure halfway: nothing to cook is lost, old data kept in v1, the error is noted', ff[0] and 'boom' in ff[0] and ff[1] == {'m-sheet-pan': 7} and ff[2] and ff[3] == 1, ff)
        # the copy aside, in IndexedDB
        await pg.wait_for_timeout(400)
        cp = await ev("""new Promise(res => { const rq = indexedDB.open('ironwood-safety', 1); rq.onsuccess = () => { try { const g = rq.result.transaction('copies').objectStore('copies').get('pre-meals-v2'); g.onsuccess = () => res(!!(g.result && g.result.meals && g.result.meals.plan)); g.onerror = () => res(false); } catch (e) { res(false); } }; rq.onerror = () => res(false); })""")
        check('the old meal data is copied aside in IndexedDB before the move (pre-meals-v2)', cp)
        check('a saved v2 object reloads unchanged', await ev("(() => { const a = JSON.stringify(ML()); return JSON.stringify(normMeals(JSON.parse(a))) === a; })()"))
        # ---- every feature reads the dated meals ----
        await ev("""mealCommit(m => { m.me = { h: 178, w: 79, age: 27, sex: 'm', act: 2, goal: 'gain', pace: 'gentle' }; const t = targetsFor(m.me); m.goals = { kcal: t.kcal, p: t.p, c: t.c, f: t.f }; m.days = {}; m.checks = {}; delete m.plan.fromMenu; delete m.rot; delete m.next; m.plan.people = 1; });
          setPlanDates(new Date(), 7); genFill(777, { auto: true }); UI.setTab('meals'); UI.setView(null); setMealsMode('plan'); S.rerender()"""); await pg.wait_for_timeout(300)
        it = await ev("JSON.stringify(ML().plan.items.map(i => [i.r, i.sv]))")
        want = await ev("JSON.stringify((() => { const w = new Map(); for (const d of planYmds()) for (const x of dayMeals(d)) if (!x.off) w.set(x.r, (w.get(x.r) || 0) + x.sv); return [...w].map(([r, s]) => [r, Math.round(s * 1000) / 1000]); })())")
        check('what you\'ll cook is worked out from the dated meals', it == want, (it, want))
        sh0 = await ev("shoppingList().length")
        check('the shopping list comes from them too', sh0 > 5)
        # add to the plan
        await ev("addToPlan('m-reel-chana', 2)"); await pg.wait_for_timeout(200)
        check('add a recipe: it lands on meals of its kind, from today on', await ev("planYmds().filter(d => d >= ymd(new Date())).flatMap(d => dayMeals(d)).filter(x => x.r === 'm-reel-chana' && (x.slot === 'l' || x.slot === 'd')).length") == 2)
        check('...and in the shopping list (chickpeas)', await ev("shoppingList().some(x => /chickpea/i.test(x.name))"))
        # change servings
        await ev("setRecipeCount('m-reel-chana', 4)"); await pg.wait_for_timeout(100)
        check('change servings: 4 on the plan, 4 to cook', await ev("recipeCount('m-reel-chana')") == 4 and await ev("servingsFor(ML().plan.items.find(i => i.r === 'm-reel-chana'))") == 4)
        sh_c = await ev("shoppingList().find(x => /chickpea/i.test(x.name)).fams")
        await ev("setRecipeCount('m-reel-chana', 6)"); await pg.wait_for_timeout(100)
        sh_c2 = await ev("shoppingList().find(x => /chickpea/i.test(x.name)).fams")
        check('increase a quantity: the shopping list goes up', json.dumps(sh_c) != json.dumps(sh_c2))
        await ev("setRecipeCount('m-reel-chana', 2)")
        check('...and down again, from the end of the dates', await ev("recipeCount('m-reel-chana')") == 2)
        # people
        await ev("mealCommit(m => { m.plan.people = 2; })")
        check('2 people double what you cook, not the plan', await ev("servingsFor(ML().plan.items.find(i => i.r === 'm-reel-chana'))") == 4 and await ev("recipeCount('m-reel-chana')") == 2)
        await ev("mealCommit(m => { m.plan.people = 1; })")
        # mark eaten, log a planned recipe
        today = await ev("ymd(new Date())")
        row = await ev(f"dayRows(dayMeals('{today}')).find(x => x.key === 'd').x")
        await ev("setMealsMode('log'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#menu-log-d'); await pg.wait_for_timeout(200)
        e = await ev(f"ML().log['{today}'].slice(-1)[0]")
        check('Ate it logs the planned dinner, linked to it', e['pm'] == row['id'] and e['sv'] == row['sv'] and e['r'] == row['r'], (e, row))
        check('...an eaten meal is never re-rolled', await ev(f"(genFill(ML().gen.seed + 1, {{ replace: true, from: ymd(new Date()) }}), dayMeals('{today}').some(x => x.id === '{row['id']}' && x.r === '{row['r']}'))"))
        check('...or removed by Empty or Clear', await ev(f"(mealCommit(m => dClear(m, placeOpts(m))), dayMeals('{today}').some(x => x.id === '{row['id']}'))"))
        await ev("genFill(777, { auto: true })")
        # edit a recipe later: the log keeps its numbers
        k0 = e['m']['kcal']
        await ev(f"mealCommit(m => {{ m.recipes['{row['r']}'] = {{ ...clone(getRecipeRaw('{row['r']}')), m: {{ kcal: 9999, p: 1 }}, manual: true }}; }})")
        check('edit a recipe later: what you logged keeps its numbers', await ev(f"ML().log['{today}'].slice(-1)[0].m.kcal") == k0)
        await ev(f"mealCommit(m => {{ delete m.recipes['{row['r']}']; }})")
        # replace one meal everywhere (swap)
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(200)
        pre = await ev("JSON.stringify(planYmds().map(d => dayRows(dayMeals(d)).map(({ x, key }) => key + ':' + x.r)))")
        old_r = await ev("ML().plan.items.find(i => getRecipe(i.r).cat === 'main').r")
        eaten_id = row['id'] if row['r'] == old_r else None
        await ev(f"swapPlanItem('mp-{old_r}')"); await pg.wait_for_timeout(300)
        pk = await ev("document.querySelector('.rp-list .opt').id.slice(3)"); await pg.locator('.rp-list .opt').first.click(); await pg.wait_for_timeout(300)
        post = await ev("JSON.stringify(planYmds().map(d => dayRows(dayMeals(d)).map(({ x, key }) => key + ':' + x.r)))")
        check('replace a recipe: same days and meals, nothing else moves', post == pre.replace(old_r, pk) or eaten_id, (old_r, pk))
        # change the date range
        n7 = await ev("planYmds().length")
        await ev("setPlanDates(new Date(), 4)"); await pg.wait_for_timeout(200)
        check('shorter dates: the plan covers 4 days and drops later ones', await ev("planYmds().length") == 4 and await ev("Object.keys(ML().days).filter(d => d >= ymd(new Date())).every(d => planYmds().includes(d))"))
        await ev("setPlanDates(new Date(), 10)"); await pg.wait_for_timeout(200)
        check('longer dates: the plan fills the new days', await ev("planYmds().every(d => dayRows(dayMeals(d)).length >= 3)") and n7 == 7)
        check('...and the Plan page has a card for each date', await pg.locator('[id^="day-"]').count() == 10)
        # a picked recipe re-spreads with the dates ("times a week")
        await ev("mealCommit(m => { m.days = {}; delete m.plan.fromMenu; delete m.gen; }); setPlanDates(new Date(), 7); addToPlan('m-sheet-pan', 7)")
        check('a picked recipe: 7 times a week is 7 servings', await ev("recipeCount('m-sheet-pan')") == 7)
        await ev("setPlanDates(new Date(), 14)")
        check('...14 over two weeks', await ev("recipeCount('m-sheet-pan')") == 14)
        await ev("setPlanDates(new Date(), 4)")
        check('...4 over 4 days', await ev("recipeCount('m-sheet-pan')") == 4)
        # rolling plans move on by themselves
        await ev("mealCommit(m => { m.plan.roll = true; m.plan.start = ymd(addDays(prepWeekStart(), -14)); m.plan.days = 7; })")
        check('a rolling plan that ended moves to this prep week', await ev("rollCheck()") is True and await ev("ML().plan.start === thisMonday() && ML().plan.roll === true"))
        # Body goal saves Daily goals (P1)
        await ev("commit(st => { st.meta.bw = [{ id: 'b1', d: ymd(new Date()), w: 173, u: 'lb' }]; }, 'meta'); openSheet({ type: 'bodyGoal' })"); await pg.wait_for_timeout(300)
        if await pg.locator('#bg-goal-cut').count():
            await pg.click('#bg-goal-cut'); await pg.click('#bg-save'); await pg.wait_for_timeout(300)
            check('P1: setting a body goal sets Daily goals', await ev("ML().goals.kcal") == await ev("bgCalc(bgSet(), bodyNow()).kcal"))
        else:
            check('P1: body goal sheet opens', False)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
