"""Nov 17 programs: personal programs (coverage, short lower days), Newt's 4-Day Split unchanged, merged duplicate
exercises keep history, smart swaps keep the movement and record what was planned, library families and filters,
archive and restore, exercise-specific weight jumps, bodyweight rep progression, plan pages show facts before settings."""
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8899
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))

NEWT = [['Decline Chest Press', 'Incline Reverse-Grip Squeeze Press', 'Hybrid Curls', 'Cable Fly', 'Tricep Pushdowns', 'Cable Crunch', 'Behind-the-Back Cable Lateral Raise'],
        ['Barbell Row', 'Lat Pulldown', 'Cuban Press', 'Behind-the-Back Cable Lateral Raise', 'Hybrid Curls', 'Scapular Shrugs', 'Cable Crunch'],
        ['Overhead Barbell Press', 'Behind-the-Back Cable Lateral Raise', 'Tricep Pushdowns', 'Face Pulls', 'Overhead Cable Tricep Extension', 'Scapular Shrugs', 'Cable Crunch'],
        ['Back Squat', 'Romanian Deadlift', 'Leg Curl', 'Calf Raises']]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        ev = pg.evaluate
        await pg.goto(URL); await pg.wait_for_timeout(1500)

        # ---- Personal programs ----
        names = await ev("personalPlans().slice(0, 5).map(r => r.name)")
        names = await ev("personalPlans().slice(0, 6).map(r => r.name)")
        check('personal order: Heartwood, Growth Rings, Sapwood, Three-Ring, Easy Grain, then the original split', names == ['Heartwood Split', 'Growth Rings Upper/Lower', 'Sapwood Hypertrophy', 'Three-Ring Full Body', 'Easy Grain 4-Day', "Newt's 4-Day Split"], names)
        newt = await ev("getRoutine('bi-newt-4day').days.map(d => d.items.map(i => exName(i.ex)))")
        sets = await ev("getRoutine('bi-newt-4day').days.flatMap(d => d.items.map(i => i.sets + 'x' + i.reps + (i.ss ? 'ss' : ''))).join(' ')")
        orig = await ev("parseProgram(NEWT_TEXT).flatMap(d => d.items.map(i => i.sets + 'x' + i.reps + (i.ss ? 'ss' : ''))).join(' ')")
        check("Newt's 4-Day Split keeps every exercise, set and rep", newt == NEWT and sets == orig, (newt, sets))
        lib_has_personal = await ev("libRoutines().filter(r => r.personal && planGroup(r) !== 'mine').length")
        check('personal routines are not on library shelves', lib_has_personal == 0)
        cov = await ev("""['bi-heartwood', 'bi-growth-rings', 'bi-sapwood', 'bi-three-ring', 'bi-easy-grain'].map(id => { const r = getRoutine(id); const w = weeklySets(r);
          const pats = new Set(r.days.flatMap(d => d.items.flatMap(i => getEx(i.ex).pat || [])));
          return [id, COVER_ROWS.filter(([k]) => !(w[k] >= 2)).map(x => x[0]), ['hpush', 'vpull', 'hpull', 'kneeflex', 'calf', 'hinge'].filter(x => !pats.has(x)), pats.has('squat') || pats.has('legpress'), pats.has('vpush') || pats.has('latraise')]; })""")
        check('every personal program trains each major muscle at least 2 sets a week', all(not c[1] for c in cov), cov)
        check('every personal program has press, pulls, hinge, knee flexion, calves, a squat pattern and shoulders', all(not c[2] and c[3] and c[4] for c in cov), cov)
        lower = await ev("""[getRoutine('bi-growth-rings'), getRoutine('bi-easy-grain')].map(r => r.days.map(d => [d.name, d.items.length, d.items.reduce((t, i) => t + i.sets, 0), Math.round(dayMinutes(d))]))""")
        gr = dict((d[0], d) for d in lower[0])
        check('Growth Rings lower days are short; Lower B is the shortest day of the week', gr['Lower A'][2] <= 13 and gr['Lower B'][2] <= 12 and gr['Lower B'][3] == min(d[3] for d in lower[0]) and max(d[3] for d in lower[0]) <= 50, lower[0])
        check('Easy Grain: at most 5 exercises a day, no supersets', all(d[1] <= 5 for d in lower[1]) and await ev("!getRoutine('bi-easy-grain').days.some(d => d.items.some(i => i.ss))"), lower[1])
        hw = await ev("getRoutine('bi-heartwood').days.filter(d => (d.tags || []).includes('Legs')).length")
        check('Heartwood Split has exactly one leg day', hw == 1)

        # ---- Merged duplicate exercises keep history ----
        await ev("""(() => { const now = Date.now(), d = 864e5;
          const mk = (id, ago, ex, w, r) => S.sessions[id] = { id, name: 'Old', startedAt: now - ago * d, endedAt: now - ago * d + 3600e3, items: [{ ex, sets: [{ w, r }, { w, r }] }], prs: [] };
          mk('o1', 20, 'b-squat', 200, 5); mk('o2', 10, 'b-bent-over-barbell-rows', 135, 8); mk('o3', 9, 'b-lying-leg-curl', 90, 12); mk('o4', 8, 'b-leg-curls', 95, 12);
          S.meta.exRest['b-squat'] = 180; S.meta.settings.starEx = { 'b-standing-barbell-row': 1 }; S.meta.machines = { 'b-leg-curls': ['Seated'] };
          storeSave(); })()""")
        await pg.reload(); await pg.wait_for_timeout(1500)
        mig = await ev("[S.sessions.o1.items[0].ex, S.sessions.o2.items[0].ex, S.sessions.o3.items[0].ex, S.sessions.o4.items[0].ex, S.meta.exRest['b-back-squat'], 'b-squat' in S.meta.exRest, isStarEx('b-barbell-row'), (S.meta.machines['b-leg-curl'] || []).join()]")
        check('old ids migrate to the canonical exercise, with rest, stars and machines', mig == ['b-back-squat', 'b-barbell-row', 'b-leg-curl', 'b-leg-curl', 180, False, True, 'Seated'], mig)
        prev = await ev("(() => { const it = makeSlot({ ex: 'b-back-squat', sets: 2, reps: '3-5' }); return [it.prev && it.prev[0].w, entries('b-leg-curl').length]; })()")
        check('the merged lift prefills from its old name and merges both leg curl histories', prev == [200, 2], prev)
        check('a plan written with an alias name uses the canonical exercise', await ev("findEx('Bent-Over Barbell Rows').id === 'b-barbell-row' && findEx('Squat').id === 'b-back-squat'"))
        kinds = await ev("[exKind('b-bulgarian-split-squat'), exCat('b-incline-dumbbell-press'), exCat('b-cable-fly'), exKind('b-bicycle-crunches')]")
        check('misclassified exercises fixed', kinds[:3] == ['dumbbell', 'chest', 'chest'] and kinds[3] != 'cable', kinds)

        # ---- Smart swaps ----
        sw = await ev("""['b-leg-extension', 'b-leg-curl', 'b-machine-chest-press', 'b-lat-pulldown', 'b-calf-raises', 'b-tricep-pushdowns', 'b-romanian-deadlift'].map(id => [id, getEx(id).pat[0], swapCandidates(id, { move: 'near' }).slice(0, 3).map(c => getEx(c.ex.id).pat[0])])""")
        check('top 3 swaps keep the main movement', all(len(x[2]) == 3 and all(p == x[1] for p in x[2]) for x in sw), sw)
        eqf = await ev("swapCandidates('b-leg-curl', { move: 'near', eq: 'bodyweight' }).slice(0, 3).every(c => c.ex.eq.includes('bodyweight') && c.ex.pat[0] === 'kneeflex')")
        check('equipment filter keeps the movement', eqf)
        await ev("(() => { const r = getRoutine('bi-heartwood'); setProgram(r.id); startWorkout(r, r.days[3]); })()"); await pg.wait_for_timeout(400)
        await ev("openSheet({ type: 'slot', it: S.active.items[3] })"); await pg.wait_for_timeout(300)
        check('exercise options show how to do it', await pg.locator('#slot-how').count() == 1)
        await pg.click('#opt-swap'); await pg.wait_for_timeout(300)
        top = await pg.locator('#swap-top .opt').count()
        await pg.screenshot(path='shot-swap.png')
        check('swap sheet shows 3 recommended with why, equipment and muscles', top == 3 and 'Same movement' in await pg.locator('#swap-top').inner_text(), top)
        await pg.locator('#swap-top .opt').first.click(); await pg.wait_for_timeout(300)
        it = await ev("[exName(S.active.items[3].ex), S.active.items[3].planned]")
        check('swap records what the plan said', it[1] == 'b-leg-extension' and it[0] != 'Leg Extension', it)
        await ev("S.active.items.forEach(i => i.sets.forEach(x => { x.w = '50'; x.r = '10'; x.c = Date.now(); })); finishWorkout(); closeSheet()"); await pg.wait_for_timeout(300)
        saved = await ev("(() => { const s = sessionList()[sessionList().length - 1]; return s.items[3].planned; })()")
        check('history keeps the planned exercise', saved == 'b-leg-extension', saved)
        await ev("openSheet({ type: 'session', id: sessionList()[sessionList().length - 1].id })"); await pg.wait_for_timeout(300)
        check('session details say what it replaced', 'Swapped in for Leg Extension' in await pg.inner_text('.sheet'))
        await ev("closeSheet()")
        n0 = await ev("Object.keys(S.sessions).length")
        await ev("setProgram('bi-growth-rings')"); await pg.wait_for_timeout(200)
        check('switching programs keeps every workout', await ev("Object.keys(S.sessions).length") == n0)

        # ---- Progression ----
        jumps = await ev("[jumpFor('b-back-squat', 'lb'), jumpFor('b-leg-press', 'lb'), jumpFor('b-romanian-deadlift', 'lb'), jumpFor('b-bench-press', 'lb'), jumpFor('b-lateral-raises', 'lb'), jumpFor('b-goblet-squat', 'lb')]")
        check('big lower-body barbell and machine lifts jump 10 lb, the rest 5', jumps == [10, 10, 10, 5, 5, 5], jumps)
        await ev("""(() => { const now = Date.now(); S.sessions.pu = { id: 'pu', name: 'P', startedAt: now - 2 * 864e5, endedAt: now - 2 * 864e5 + 1, items: [{ ex: 'b-pull-up', sets: [{ w: 0, r: 10 }, { w: 0, r: 10 }, { w: 0, r: 10 }] }], prs: [] };
          S.sessions.sq = { id: 'sq', name: 'Q', startedAt: now, endedAt: now + 1, items: [{ ex: 'b-back-squat', sets: [{ w: 200, r: 10 }, { w: 200, r: 10 }, { w: 200, r: 10 }] }], prs: [] }; S.ver++; })()""")
        bw = await ev("(() => { S.active = null; const it = makeSlot({ ex: 'b-pull-up', sets: 3, reps: '6-10' }); const sq = makeSlot({ ex: 'b-back-squat', sets: 3, reps: '6-10' }); return [it.prog && it.prog.mode, it.sets[0].gr, sq.sets[0].gw, sq.prog && sq.prog.msg]; })()")
        check('bodyweight moves progress by reps; squats add 10 lb', bw[0] == 'reps' and bw[1] == '11' and bw[2] == '210', bw)
        rest = await ev("(() => { setFocus('bi-ul4', 'strength'); const d = focusDay(getRoutine('bi-ul4'), getRoutine('bi-ul4').days[0]); const it = makeSlot(d.items[0]); setFocus('bi-ul4', ''); return [d.items[0].reps, it.target.rest]; })()")
        check('Rep focus Strength sets main-lift reps and rest', rest == ['3-5', 150], rest)

        # ---- Library, filters, archive ----
        fams = await ev("FAMILIES.map(([k]) => libRoutines().filter(r => !isRetired(r.id) && planGroup(r) === k).map(r => r.id))")
        check('three families with their variants', sorted(fams[0]) == sorted(['bi-fb3', 'bi-db3', 'gp-strength3']) and sorted(fams[1]) == sorted(['bi-ul4', 'gp-bulk4', 'bi-ul4-strength', 'bi-drop4']) and sorted(fams[2]) == sorted(['bi-ppl6', 'bi-ppl3']), fams)
        arch = await ev("archivedRoutines().map(r => r.id).sort()")
        check('retired near-copies are archived, not deleted', arch == sorted(['bi-5x5', 'bi-tiered', 'bi-split5', 'bi-failure3', 'gp-recomp3', 'gp-recomp4', 'gp-cut3']), arch)
        check('a retired plan still opens and can be followed', await ev("(() => { setProgram('bi-5x5'); return !!getRoutine('bi-5x5') && nextUp().routine.id === 'bi-5x5'; })()"))
        await ev("UI.setView(null); UI.setTab('routines'); lsSet('rtFilter', 'lift'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#lf-goal-strength'); await pg.wait_for_timeout(200)
        shown = await pg.locator('.r-card h3').all_inner_texts()
        check('library goal filter: strength', all(('STRENGTH' in t.upper() or t.upper() == 'UPPER / LOWER 4-DAY') for t in shown) and len(shown) >= 2, shown)
        await pg.click('#lf-goal-any'); await pg.click('#lf-days-3'); await pg.wait_for_timeout(200)
        shown = await pg.locator('.r-card h3').all_inner_texts()
        check('library days filter: 3 days', len(shown) >= 3 and not any('6' in t or '4-DAY' in t.upper() for t in shown), shown)
        await pg.click('#lf-days-any')
        await ev("lsSet('rtFilter', 'all'); S.rerender()")
        await ev("commit(st => { st.meta.routines.cx = { id: 'cx', name: 'My Test Plan', source: 'mine', createdAt: 1, days: [{ id: 'cxd', name: 'Day 1', items: [{ id: 'cxi', ex: 'b-bench-press', sets: 3, reps: '8-12' }] }] }; }, 'meta')")
        await ev("archivePlan(getRoutine('cx'))"); await pg.wait_for_timeout(200)
        a1 = await ev("[myRoutines().some(r => r.id === 'cx'), archivedRoutines().some(r => r.id === 'cx'), !!getRoutine('cx')]")
        await ev("restorePlan(getRoutine('cx'))")
        a2 = await ev("myRoutines().some(r => r.id === 'cx') && !archivedRoutines().some(r => r.id === 'cx')")
        check('archive and restore a personal plan', a1 == [False, True, True] and a2, a1)

        # ---- Plan page order: facts, days, then guide and settings ----
        await ev("UI.setView({ type: 'routine', id: 'bi-heartwood' })"); await pg.wait_for_timeout(300)
        ys = await ev("['#plan-facts', '.r-day', '#plan-cover', '#plan-progress', '#plan-effort', '#plan-settings-h', '#focus-row'].map(s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : -1; })")
        check('plan page: facts, then days, then coverage, progression, effort, then settings', all(y > 0 for y in ys) and ys == sorted(ys), ys)
        txt = await pg.inner_text('main')
        check('plan page shows goal, days, minutes and equipment', all(w in txt for w in ('Build muscle', '4 days a week', 'min', 'Dumbbells')), txt[:300])
        await pg.screenshot(path='shot-heartwood.png', full_page=True)
        await ev("UI.setView(null); UI.setTab('train')"); await pg.wait_for_timeout(300)
        check('Up next shows how long the workout takes', 'min ·' in await pg.inner_text('#next-mins'))

        # ---- Sapwood Hypertrophy (Nov 17): growth volume, known exercises, rest times, tips ----
        sw = await ev("""(() => { const r = getRoutine('bi-sapwood'); const w = weeklySets(r);
          return { low: COVER_ROWS.filter(([k]) => ['chest', 'back', 'sdelt', 'quads', 'hams', 'triceps', 'biceps'].includes(k) && !(w[k] >= 8)).map(([k]) => k + ':' + w[k]),
            keys: COVER_ROWS.map(x => x[0]), unknown: r.days.flatMap(d => d.items.filter(i => !(getEx(i.ex).pat || []).length).map(i => exName(i.ex))),
            norest: r.days.flatMap(d => d.items.filter(i => !i.rest).map(i => exName(i.ex))), tips: (r.tips || []).length, dayTips: r.days.filter(d => d.tip).length,
            mins: r.days.map(d => Math.round(dayMinutes(d))), prio: ['chest', 'lats', 'sidedelt', 'quads'].map(k => w[k]), legs2: r.days.filter(d => d.items.some(i => (getEx(i.ex).pat || []).includes('kneeflex'))).length }; })()""")
        check('Sapwood: 8+ weekly sets for chest, back, side delts, quads, hamstrings, triceps and biceps; 11+ for chest, lats, side delts and quads', not sw['low'] and min(sw['prio']) >= 11, sw)
        check('Sapwood: every exercise has muscle data and a rest time; hamstrings twice a week', not sw['unknown'] and not sw['norest'] and sw['legs2'] == 2, sw)
        check('Sapwood: 8 tips, no day over an hour', sw['tips'] == 8 and sw['dayTips'] == 0 and max(sw['mins']) <= 60, sw)
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-sapwood' })"); await pg.wait_for_timeout(400)
        t1 = await pg.inner_text('#plan-tips')
        check('Sapwood tips sit together in one card on the plan page', 'How to use this plan' in t1 and all(w in t1 for w in ('find your weights', 'How hard', 'Drop sets', 'progresses', 'Rest', 'Supersets', 'Your week', 'Bad days')), t1[:80])
        await pg.click('.tip-card .tip-x'); await pg.wait_for_timeout(300)
        check('one tap hides the tips for good', await pg.locator('#plan-tips').count() == 0 and await ev("tipOff('pt-bi-sapwood-v2')"))
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[1])"); await pg.wait_for_timeout(500)
        rest0 = await ev("S.active.items[0].target.rest")
        check('Sapwood workout uses the plan rest time and shows no tip card', rest0 == 150 and await pg.locator('.tip-card').count() == 0, rest0)
        drops = await ev("[getRoutine('bi-sapwood').days.flatMap(d => d.items.filter(i => i.dl).map(i => exName(i.ex) + ':' + i.dl)), S.active.items.map(it => it.sets.map(x => (x.drops || []).length).join(''))]")
        check('Sapwood: nine machine, cable and dumbbell lifts end with one drop on the last set, set up when the workout starts; main lifts stay straight', len(drops[0]) == 9 and all(x.endswith(':1') for x in drops[0]) and drops[1][0] == '000' and '001' in drops[1], drops)
        await ev("S.active = null; startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0])"); await pg.wait_for_timeout(300)
        await ev("""(() => { const a = S.active; delete a.dlSync; a.items.forEach(it => it.sets.forEach(x => { delete x.drops; }));
          a.items[2].sets[2].w = '30'; a.items[2].sets[2].r = '12'; UI.setTab('train'); S.rerender(); })()"""); await pg.wait_for_timeout(400)
        after = await ev("S.active.items.map(it => exName(it.ex) + ':' + it.sets.map(x => (x.drops || []).length).join(''))")
        check('a workout started before the drop sets gets them on unfinished last sets only', set(after[0].split(':')[1]) == {'0'} and after[2] == 'Cable Fly:000' and after[4].endswith(':001'), after)
        await ev("S.active.items[4].sets[2].drops = []; S.rerender()"); await pg.wait_for_timeout(200)
        check('a drop removed afterwards stays removed', await ev("(S.active.items[4].sets[2].drops || []).length") == 0)
        await ev("commit(st => { st.active = null; st.rest = null; }, 'active')"); await pg.wait_for_timeout(300)
        # ---- Accessibility: automated check on the new screens ----
        axe = os.path.join('node_modules', 'axe-core', 'axe.min.js')
        if os.path.exists(axe):
            await pg.add_script_tag(path=axe)
            v = []
            for setup in ["UI.setTab('routines'); UI.setView(null)", "UI.setView({ type: 'routine', id: 'bi-growth-rings' })", "openSheet({ type: 'swap', ex: 'b-leg-extension', onPick: () => {} })"]:
                await ev(setup); await pg.wait_for_timeout(400)
                v += await ev("axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag22aa'] }).then(r => r.violations.map(x => x.id + ':' + x.nodes.length))")
            check('no automated WCAG violations on Plans, a plan page and the swap sheet', not v, v)
        check('no page errors', not errs, errs)
        await b.close()

try:
    asyncio.run(main())
finally:
    srv.terminate()
print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
