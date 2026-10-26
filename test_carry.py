"""Oct 26: finishing a set carries its weight forward but not its reps (later sets keep last time's reps), and the
−/+ strips no longer show while typing reps or weight."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8781
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SEED = """() => { const now = Date.now(), d = 864e5; S.sessions = { h0: { id: 'h0', name: 'W', routineId: null, dayId: null, startedAt: now - 4 * d, endedAt: now - 4 * d + 3e6,
  items: [{ ex: 'b-bench-press', group: '', u: 'lb', sets: [{ w: 135, r: 8 }, { w: 135, r: 7 }, { w: 135, r: 6 }] }], prs: [] } }; S.ver++; touch(); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev(SEED)
        await ev("startWorkout(null, null); S.active.items.push(makeSlot({ ex: 'b-bench-press', sets: 3, reps: '6-8' })); touch()"); await pg.wait_for_timeout(400)
        before = await ev("S.active.items[0].sets.map(s => s.gr)")
        check('prefill starts from last time', before == ['8', '7', '6'], before)
        sid = await ev("S.active.items[0].sets[0].id")
        await pg.focus('#r-' + sid); await pg.wait_for_timeout(150)
        check('no −1 / +1 strip while typing reps', await pg.locator('.step-strip').count() == 0)
        await pg.fill('#r-' + sid, '10'); await pg.press('#r-' + sid, 'Enter'); await pg.wait_for_timeout(300)
        r = await ev("S.active.items[0].sets.map(s => [s.r, s.gr, s.gw, !!s.c])")
        check('set 1 logged with the new reps', r[0][0] == '10' and r[0][3], r)
        check('later sets keep last time\'s reps (7, 6), not 10', [r[1][1], r[2][1]] == ['7', '6'], r)
        check('weight still carries forward', r[1][2] == '135' and r[2][2] == '135', r)
        await ev("S.active.items[0].sets[1].w = '145'; touch()"); await pg.wait_for_timeout(100)
        await ev("completeSet(S.active.items[0], S.active.items[0].sets[1], false)"); await pg.wait_for_timeout(200)
        r = await ev("S.active.items[0].sets[2]")
        check('a new weight carries, reps still from last time', r['gw'] == '145' and r['gr'] == '6', r)
        wid = await ev("S.active.items[0].sets[2].id")
        wsel = await ev(f"(() => {{ const el = [...document.querySelectorAll('input')].find(i => i.id && i.id.endsWith('{wid}') && !i.id.startsWith('r-')); return el ? el.id : ''; }})()")
        if wsel:
            await pg.focus('#' + wsel); await pg.wait_for_timeout(150)
            check('no −5 / +5 strip while typing weight', await pg.locator('.step-strip').count() == 0)
        else:
            check('weight field found', False)
        check('no page errors', not errs, errs)
        await b.close()
    srv.terminate()
    print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
asyncio.run(main())
