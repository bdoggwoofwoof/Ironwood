"""Targets to beat (Nov 24, Newt): holding a weight aims one more rep per set; a new weight aims for the reps last time's
sets predict at it; a weight clearly outside the range moves after one workout (at most 20% down or 25% up)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8856
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        async def plan(ex, w, reps, target, sets=3, ri=None):
            return await ev(f"""(() => {{ commit(st => {{ st.sessions = {{}}; st.active = null; const t = Date.now() - 3 * 864e5;
              st.sessions.h = {{ id: 'h', name: 'W', startedAt: t, endedAt: t + 3e6, items: [{{ id: 'i', ex: '{ex}', sets: {reps}.map((r, j, a) => ({{ w: {w}, r, ...(j === a.length - 1 && {ri if ri is not None else 'null'} != null ? {{ ri: {ri if ri is not None else 'null'} }} : {{}}) }})) }}] }}; }}, 'sessions');
              startWorkout(null, null); S.active.items.push(makeSlot({{ ex: '{ex}', sets: {sets}, reps: '{target}' }})); touch();
              const it = S.active.items[0]; const o = {{ gw: it.sets.map(s => s.gw), gr: it.sets.map(s => s.gr), prog: it.prog && it.prog.mode, msg: it.prog && it.prog.msg }}; commit(st => {{ st.active = null; }}, 'active'); return o; }})()""")
        r = await plan('b-leg-extension', 150, [7, 7, 5], '12-15')
        check('too heavy (150 × 7, 7, 5 on 12–15): lighter after one workout', r['gw'][0] == '125' and r['prog'] == 'step' and 'Lighter today' in r['msg'], r)
        check('...aiming inside the range', all(12 <= int(x) <= 15 for x in r['gr']), r['gr'])
        r = await plan('b-bench-press', 135, [8, 7, 6], '6-10')
        check('holding: one more rep per set', r['gw'] == ['135'] * 3 and r['gr'] == ['9', '8', '7'] and r['prog'] == 'beat', r)
        r = await plan('b-bench-press', 135, [10, 10, 10], '6-10')
        check('all at the top: heavier, reps predicted from last time (not reset to the bottom)', r['gw'][0] == '140' and r['gr'] == ['8', '8', '8'], r)  # 135 × 10 predicts about 8.6 at 140
        r = await plan('b-leg-curl', 100, [20, 19, 18], '10-12')
        check('too light (20, 19, 18 on 10–12): heavier after one workout, at most 25%', r['prog'] == 'bump' and 100 < float(r['gw'][0]) <= 125 and 'Heavier today' in r['msg'], r)
        r = await plan('b-lateral-raises', 20, [8, 8, 8], '12-15')
        check('a big cut is capped: 20 lb with 5 lb steps holds', r['gw'][0] == '20', r)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
