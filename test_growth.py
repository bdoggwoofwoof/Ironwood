"""Lift goals, month in review and the weekly prep rotation (Oct 29)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8783
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
# [date 'YYYY-MM-DD', exercise, unit, weight, reps list, prs list]
SEED = """(spec) => { S.sessions = {}; spec.forEach(([d, ex, u, w, reps, prs], i) => { const t = +parseYmd(d) + 18 * 36e5; const id = 'g' + i;
  S.sessions[id] = { id, name: 'Day ' + i, startedAt: t, endedAt: t + 3e6, items: [{ ex, group: '', u, sets: reps.map(r => ({ w, r })) }], prs: prs || [] }; }); S.ver++; touch(); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev("S.meta.settings.unit = 'lb'")
        sq = await ev("Object.keys(EXDB || {}).find(k => /squat/i.test(exName(k)) && exKind(k) === 'barbell') || exList().find(e => /^back squat|^squat/i.test(e.name)).id") if False else None
        sq = await ev("(() => { for (const k of ['b-squat', 'b-back-squat', 'b-barbell-squat']) if (exName(k) && exName(k) !== 'Unknown exercise') return k; return null; })()")
        check('found a squat exercise id', bool(sq), sq)
        today = await ev("ymd(new Date())")
        d = lambda n: asyncio.get_event_loop()
        days = await ev("[-40, -30, -20, -10, -3].map(n => ymd(addDays(new Date(), n)))")
        await ev(SEED, [[days[0], sq, 'lb', 200, [5]], [days[1], sq, 'lb', 205, [5]], [days[2], sq, 'lb', 210, [5]], [days[3], sq, 'lb', 215, [5]], [days[4], sq, 'lb', 220, [5]]])
        # ---- Lift goals
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(200)
        check('no goals card until you set one', await pg.locator('#goals-card').count() == 0)
        await pg.locator('.tabs button', has_text='Stats').click(); await pg.wait_for_timeout(200)
        await pg.click('#open-goal'); await pg.wait_for_timeout(200)
        check('goal sheet picks your logged lift', await ev("document.querySelector('#lg-ex').value") == sq)
        now_txt = await pg.inner_text('.sheet')
        check('shows where you are now (est. 1RM of 220×5 ≈ 257)', 'Now: 256.5 lb' in now_txt or 'Now: 257 lb' in now_txt, now_txt[:300])
        by = await ev("ymd(addDays(new Date(), 70))")
        await pg.fill('#lg-t', '285'); await pg.fill('#lg-by', by); await pg.click('#lg-save'); await pg.wait_for_timeout(250)
        g = await ev("Object.values(S.meta.liftGoals)[0]")
        check('goal saved with lift, target, date and starting point', g['ex'] == sq and g['target'] == 285 and g['by'] == by and g['metric'] == 'e1' and g['start'] > 250, g)
        await pg.locator('.tabs button', has_text='Train').click(); await pg.wait_for_timeout(250)
        card = await pg.inner_text('#goals-card') if await pg.locator('#goals-card').count() else ''
        check('Train shows the goal with the weekly gain needed', '285 lb' in card and 'a week for 11 weeks' in card, card)
        check('labeled as an estimate', 'Not medical or coaching advice' in card)
        st = await ev("goalStatus(Object.values(S.meta.liftGoals)[0])")
        pj = await ev("(() => { const g = Object.values(S.meta.liftGoals)[0]; const st = goalStatus(g); const p = project(goalPts(g)); return [st.onPace, p.keep(st.days) >= st.tg - 0.05]; })()")
        check('on-pace call matches the projection used on the Stats chart', pj[0] == pj[1], pj)
        await ev(SEED, [[days[0], sq, 'lb', 200, [5]], [days[4], sq, 'lb', 250, [5]]])
        await ev("Object.values(S.meta.liftGoals)[0].createdAt = Date.now() - 864e5 * 20; S.rerender()"); await pg.wait_for_timeout(200)
        card = await pg.inner_text('#goals-card')
        check('reached once a set gets there (250×5 ≈ 292)', 'Reached' in card, card)
        await pg.locator('#goals-card .goal-card').first.click(); await pg.wait_for_timeout(200)
        await pg.click('#lg-del'); await pg.wait_for_timeout(200)
        check('goal can be deleted', await ev("Object.keys(S.meta.liftGoals).length") == 0 and await pg.locator('#goals-card').count() == 0)
        await ev(f"UI.setTab('stats'); UI.setView({{ type: 'exercise', ex: '{sq}' }})"); await pg.wait_for_timeout(250)
        check('exercise page offers a goal for that lift', await pg.locator('#ex-goal', has_text='Set a goal').count() == 1)
        await pg.click('#ex-goal'); await pg.wait_for_timeout(150)
        check('...for that lift', await ev("document.querySelector('#lg-ex').value") == sq); await ev("closeSheet(); UI.setView(null)")
        # ---- Month in review
        lm = await ev("ymAdd(ymOf(new Date()), -1)"); pm = await ev("ymAdd(ymOf(new Date()), -2)")
        await ev(SEED, [[pm + '-10', sq, 'lb', 200, [5]], [lm + '-05', sq, 'lb', 210, [5], [{ 'ex': sq, 'type': 'weight', 'label': 'Heaviest weight', 'value': '210 lb × 5' }]], [lm + '-12', sq, 'kg', 100, [5]], [lm + '-20', sq, 'lb', 200, [3]]])
        await ev(f"mealCommit(m => {{ m.log['{lm}-03'] = [{{ id: 'x', k: 'num', name: 'a', m: {{ kcal: 100 }} }}]; m.log['{lm}-04'] = [{{ id: 'y', k: 'num', name: 'b', m: {{ kcal: 100 }} }}]; }})")
        ms = await ev(f"(() => {{ const s = monthStats('{lm}'); return {{ n: s.n, prs: s.prs.length, food: s.food, imp: s.imp && [s.imp.ex, Math.round(s.imp.gain * 100)], best: s.best && s.best.name, sets: s.sets }}; }})()")
        check('month: workouts, PRs, food days, sets', ms['n'] == 3 and ms['prs'] == 1 and ms['food'] == 2 and ms['sets'] == 3, ms)
        check('most improved uses kg converted (100 kg×5 vs 200 lb×5 before → +10%)', ms['imp'] and ms['imp'][0] == sq and ms['imp'][1] == 10, ms)
        check('best session is the one with a PR', ms['best'] == 'Day 1', ms)
        await ev("UI.setTab('stats'); UI.setView(null)"); await pg.wait_for_timeout(150)
        await pg.click('#open-month'); await pg.wait_for_timeout(250)
        mv = await pg.inner_text('#month-view')
        check('month view shows last month', 'Month in review' in mv.title() or 'MONTH IN REVIEW' in mv.upper() and '3' in mv, mv[:200])
        await pg.fill('#month-note', 'Squat finally moved.'); await pg.locator('#month-note').blur(); await pg.wait_for_timeout(800)
        check('note saved for that month', await ev(f"S.meta.monthNotes['{lm}']") == 'Squat finally moved.')
        await pg.click('#month-prev'); await pg.wait_for_timeout(200)
        check('previous month works', await pg.locator('#month-view', has_text=await ev(f"ymName('{pm}')")).count() == 1)
        blob = await ev(f"monthImage('{lm}').then(b => b && b.size)")
        check('share picture is made', blob and blob > 5000, blob)
        await ev("UI.setView(null); UI.setTab('train')"); await pg.wait_for_timeout(200)
        first_week = await ev("new Date().getDate() <= 7")
        if first_week:
            check('Train card the first week of the month', await pg.locator('#month-card').count() == 1)
        else:
            check('no Train card after the first week', await pg.locator('#month-card').count() == 0)
        await ev("(() => { const D = Date; const fake = new D(D.now()); fake.setDate(3); window.__now = +fake; })()")
        # MonthCard with a faked date
        shown = await ev("""(() => { const RealDate = Date; const t = new RealDate(); t.setDate(3); const Fake = class extends RealDate { constructor(...a) { if (!a.length) super(t); else super(...a); } static now() { return +t; } };
          window.Date = Fake; try { lsSet('monthSeen', ''); const lm = ymAdd(ymOf(new Date()), -1); return [!!MonthCard(), lm]; } finally { window.Date = RealDate; } })()""")
        check('on the 3rd, the card offers last month', shown[0] is True, shown)
        # ---- Prep rotation
        await ev("UI.setTab('meals'); setMealsMode('plan')"); await pg.wait_for_timeout(250)
        check('rotation card offers setup', await pg.locator('#rot-setup').count() == 1)
        ids = await ev("MEAL_PREPS.slice(0, 3).map(p => p.id)")
        await pg.click('#rot-setup'); await pg.wait_for_timeout(200)
        for i in ids[:3]: await pg.click('#rot-' + i)
        check('picked order shows as weeks', await pg.locator('.sheet .chip', has_text='Week 3').count() == 1)
        await pg.click('#rot-save'); await pg.wait_for_timeout(300)
        r = await ev("({ rot: ML().rot, items: ML().plan.items.map(i => i.r) })")
        want = await ev(f"MEAL_PREPS.find(p => p.id === '{ids[0]}').items.filter(([x]) => getRecipe(x)).map(([x]) => x)")
        check('week 1 loads into your prep now', r['rot']['ids'] == ids and r['items'] == want and r['rot']['applied'] == await ev("thisMonday()"), r)
        card = await pg.inner_text('#rot-card')
        n1 = await ev(f"prepById('{ids[0]}').name"); n2 = await ev(f"prepById('{ids[1]}').name")
        check('card says this week and next week', n1 in card and n2 in card and 'Week 1 of 3' in card, card)
        # Next Monday: second prep loads, list unticked
        await ev("mealCommit(m => { m.checks = { a: true }; m.rot.start = ymd(addDays(parseYmd(m.rot.start), -7)); m.rot.applied = ymd(addDays(parseYmd(m.rot.applied), -7)); })")
        await ev("rotCheck()"); await pg.wait_for_timeout(200)
        want2 = await ev(f"MEAL_PREPS.find(p => p.id === '{ids[1]}').items.filter(([x]) => getRecipe(x)).map(([x]) => x)")
        check('a new week loads the next prep and clears the list ticks', await ev("ML().plan.items.map(i => i.r)") == want2 and await ev("Object.keys(ML().checks).length") == 0)
        check('it loads once per week', await ev("rotCheck()") is False)
        # Save your own prep and rotate it
        await pg.click('#prep-save'); await pg.wait_for_timeout(150); await pg.fill('#ps-name', 'Sunday Mix'); await pg.click('#ps-save'); await pg.wait_for_timeout(200)
        check('save this prep', await pg.locator('.prep-card', has_text='Sunday Mix').count() == 1)
        check('saved preps survive reload', await ev("normMeals(JSON.parse(JSON.stringify(ML()))).preps && Object.values(normMeals(JSON.parse(JSON.stringify(ML()))).preps).some(p => p.name === 'Sunday Mix') && !!normMeals(JSON.parse(JSON.stringify(ML()))).rot"))
        await pg.click('#rot-stop'); await pg.wait_for_timeout(150)
        check('stop rotating', await ev("!ML().rot") and await pg.locator('#rot-setup').count() == 1)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
