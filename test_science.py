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
        check('Settings → About opens How Ironwood works with every section', all(f'sci-{s[0]}' for s in data['secs']) and await pg.locator('#science section').count() == len(data['secs']) and 'What it does.' in txt and 'Limits.' in txt and 'Why.' in txt)
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
        check('no page errors', not errs, errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
