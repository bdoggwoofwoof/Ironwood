"""How Ironwood works (Nov 23, Newt): a page with each feature's choices, settings, limits, reasons and sources, and a
Sources line (study links + Why) under warnings and advice."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8933
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        data = await ev("({ src: Object.entries(SRC).map(([k, v]) => [k, v[2]]), secs: SCIENCE.map(s => [s[0], s[6], !!s[7]]) })")
        check('every source has an https link', all(u.startswith('https://') for k, u in data['src']), data['src'])
        used = {k for s in data['secs'] for k in s[1]}
        check('every section has sources or says it is a rule of thumb', all(s[1] or s[2] for s in data['secs']), data['secs'])
        check('every source is used and every used source exists', used <= {k for k, u in data['src']} and used == {k for k, u in data['src']}, used ^ {k for k, u in data['src']})
        await ev("UI.setTab('profile'); UI.setView(null)"); await pg.wait_for_timeout(300)
        await pg.click('#about-science'); await pg.wait_for_timeout(300)
        txt = await pg.inner_text('#science')
        check('Settings → About opens How Ironwood works with every section', all(f'sci-{s[0]}' for s in data['secs']) and await pg.locator('#science section').count() == len(data['secs']) and all(h in txt for h in ['What it does', 'Why', 'Good to know', 'Where to change it']))  # Nov 24: plainer headings
        check('sections link the studies', await pg.locator('#science a[href^="https://"]').count() >= len(data['src']))
        await ev("UI.setView(null); UI.setTab('train'); openSheet({ type: 'help' })"); await pg.wait_for_timeout(200)
        await pg.click('#help-science'); await pg.wait_for_timeout(400)
        check('Help opens it too', await pg.locator('#science').count() == 1)
        # warnings carry sources
        await ev("setProgram('bi-sapwood'); setBusy(true); UI.setView(null); UI.setTab('train')"); await pg.wait_for_timeout(400)
        bt = await pg.inner_text('#busy-on')
        check('busy week names its sources', 'Spiering 2021' in bt and 'Bickel 2011' in bt and await pg.locator('#busy-on a[href*="pubmed"]').count() == 2, bt)
        await ev("document.querySelector('#busy-on .cite button').click()"); await pg.wait_for_timeout(500)
        check('Why opens the matching section', await pg.locator('#science #sci-busy').count() == 1)
        await ev("""(() => { const now = Date.now(), w0 = +startOfWeek(new Date()); S.sessions = { a: { id: 'a', name: 'W', startedAt: w0 - 3 * 864e5, endedAt: w0 - 3 * 864e5 + 3e6, prs: [], items: [{ ex: 'b-bench-press', u: 'lb', sets: [{ w: 100, r: 8 }] }] } }; S.ver++;
          UI.setView(null); UI.setTab('stats'); lsSet('statsTab', 'numbers'); S.rerender(); })()"""); await pg.wait_for_timeout(400)
        check('Sets by muscle shortfall cites Pelland', 'Pelland 2024' in await pg.inner_text('#muscle-short'))
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-sapwood' })"); await pg.wait_for_timeout(400)
        pt = await pg.inner_text('#plan-tips'); cov = await pg.inner_text('#plan-cover')
        check('plan tips and coverage cite their sources', 'Robinson 2024' in pt and 'Sødal 2023' in pt and 'Pelland 2024' in cov, (pt[-160:], cov[-120:]))
        await ev("""mealCommit(m => { m.me = { h: 180, w: 80, age: 30, sex: 'm', act: 2, goal: 'gain' }; m.goals = { kcal: 2800, p: 140 }; m.log[ymd(new Date())] = [{ id: 'a', at: Date.now(), k: 'food', name: 'Eggs', m: { kcal: 300, p: 20 } }]; });
          UI.setView(null); UI.setTab('meals'); lsSet('mealsMode', 'log'); MEALS.mode = 'log'; S.rerender()"""); await pg.wait_for_timeout(400)
        check('protein per meal cites Schoenfeld & Aragon', 'Schoenfeld & Aragon 2018' in await pg.inner_text('#prot-spread'))
        # ---- per-session cap, stalled muscle, lift first, reorder note ----
        await ev("""commit(st => { st.meta.routines['x1'] = { id: 'x1', name: 'Big chest', source: 'mine', days: [{ id: 'x1d', name: 'Chest', items: [{ id: 'a', ex: 'b-bench-press', sets: 6, reps: '8' }, { id: 'b', ex: 'b-cable-fly', sets: 6, reps: '12' }] }] }; }, 'meta'); UI.setView(null); UI.setTab('routines'); UI.setView({ type: 'routine', id: 'x1' })"""); await pg.wait_for_timeout(400)
        dl = await pg.inner_text('#dayload-x1d') if await pg.locator('#dayload-x1d').count() else ''
        check('a day with 12 chest sets is flagged, with its source', 'Chest 12 sets' in dl and 'Remmert 2025' in dl, dl)
        check('Sapwood days are under the cap', await ev("getRoutine('bi-sapwood').days.every(d => COVER_ROWS.every(([k]) => !(dayMuscleSets(d)[k] > SESSION_CAP)))"))
        await ev("""(() => { const d = 864e5, w0 = +startOfWeek(new Date()); S.sessions = {}; let i = 0;
          for (let wk = 1; wk <= 6; wk++) for (const day of [0, 2]) { const t = w0 - wk * 7 * d + day * d + 36e5;
            S.sessions['q' + i] = { id: 'q' + i, name: 'W', startedAt: t, endedAt: t + 3e6, prs: [], items: [{ ex: 'b-cable-fly', u: 'lb', sets: [1,2,3,4,5,6,7].map(() => ({ w: 50, r: 12 })) }] }; i++; }
          setProgram('bi-sapwood'); S.ver++; UI.setView(null); UI.setTab('stats'); lsSet('statsTab', 'numbers'); S.rerender(); })()"""); await pg.wait_for_timeout(400)
        pw = await pg.inner_text('#plan-working')
        check('chest gets its sets but lifts are flat for 4+ weeks: offers 2 more sets', 'flat for 4+ weeks' in pw and await pg.locator('#pw-add-chest').count() == 1, pw[:300])
        before = await ev("getRoutine('bi-sapwood').days.flatMap(d => d.items).filter(it => exMuscles(it.ex).chest >= 1).reduce((a, it) => a + it.sets, 0)")
        await ev("document.getElementById('pw-add-chest').click()"); await pg.wait_for_timeout(300)
        after = await ev("getRoutine('bi-sapwood').days.flatMap(d => d.items).filter(it => exMuscles(it.ex).chest >= 1).reduce((a, it) => a + it.sets, 0)")
        check('tapping it adds 2 chest sets to the plan (as an edit)', after == before + 2 and await ev("!!getRoutine('bi-sapwood').base"), (before, after))
        await ev("[...document.querySelectorAll('.toast button')].find(b => b.textContent.includes('Undo')).click()"); await pg.wait_for_timeout(300)
        check('Undo puts the plan back', await ev("getRoutine('bi-sapwood').days.flatMap(d => d.items).filter(it => exMuscles(it.ex).chest >= 1).reduce((a, it) => a + it.sets, 0)") == before and await ev("!S.meta.routines['bi-sapwood']"))
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0]); openSheet({ type: 'reorder', list: S.active.items, workout: true })"); await pg.wait_for_timeout(300)
        rt = await pg.inner_text('.sheet')
        check('reorder says order doesn’t change growth, with its source', 'doesn’t change muscle growth' in rt and 'Nunes 2021' in rt)
        await ev("closeSheet(); S.active = null")
        check('lift-first tip function exists and the source is listed', await ev("typeof liftedToday === 'function' && !!SRC.concorder"))
        check('no page errors', not errs, errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
