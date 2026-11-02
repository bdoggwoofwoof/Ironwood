"""Machines: the same exercise on different machines keeps separate weights, Last numbers and PRs, and you can switch
mid-lift (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8786
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        ex = await ev("(() => { for (const k of ['b-cable-crunch', 'b-cable-crunches', 'b-kneeling-cable-crunch']) if (exName(k) !== 'Unknown exercise') return k; return 'b-lat-pulldown'; })()")
        # History: older workout on Stack A at 130, newer on Stack B at 90
        await ev(f"""(() => {{ S.meta.settings.unit = 'lb'; S.meta.machines = {{ '{ex}': ['Stack A', 'Stack B'] }}; const d = 864e5, now = Date.now();
          S.sessions = {{ a: {{ id: 'a', name: 'W', startedAt: now - 6 * d, endedAt: now - 6 * d + 3e6, prs: [], items: [{{ ex: '{ex}', group: '', u: 'lb', sets: [{{ w: 130, r: 12, m: 'Stack A' }}, {{ w: 130, r: 10, m: 'Stack A' }}] }}] }},
            b: {{ id: 'b', name: 'W', startedAt: now - 2 * d, endedAt: now - 2 * d + 3e6, prs: [], items: [{{ ex: '{ex}', group: '', u: 'lb', sets: [{{ w: 90, r: 15, m: 'Stack B' }}, {{ w: 90, r: 14, m: 'Stack B' }}] }}] }} }}; S.ver++;
          startWorkout(null, null); S.active.items.push(makeSlot({{ ex: '{ex}', sets: 3, reps: '10-15' }})); touch(); }})()""")
        await pg.wait_for_timeout(300); it = "S.active.items[0]"
        st = await ev(f"({{ mach: {it}.mach, gw: {it}.sets.map(s => s.gw), m: {it}.sets.map(s => s.m) }})")
        check('starts on the machine you used last, with its weights', st['mach'] == 'Stack B' and st['gw'][0] == '90' and st['m'] == ['Stack B'] * 3, st)
        check('machine chips on the exercise', await pg.locator('.mach-row .chip', has_text='Stack A').count() == 1 and await pg.locator('.mach-row .chip.on', has_text='Stack B').count() == 1)
        check('Last line says which machine', await pg.locator('.last-line', has_text='on Stack B').count() == 1)
        # Do set 1 on B, then switch to A for the rest
        await ev(f"(() => {{ const s = {it}.sets[0]; s.w = '90'; s.r = '15'; completeSet({it}, s, false); }})()")
        await pg.locator('.mach-row .chip', has_text='Stack A').click(); await pg.wait_for_timeout(200)
        st = await ev(f"({{ mach: {it}.mach, gw: {it}.sets.map(s => s.gw), m: {it}.sets.map(s => s.m), pv: [...document.querySelectorAll('.last-note .prev')].map(e => e.textContent) }})")
        check('switch mid-lift: remaining sets move to Stack A with its weights', st['mach'] == 'Stack A' and st['m'] == ['Stack B', 'Stack A', 'Stack A'] and st['gw'][1] == '130', st)
        check('Last column: the done set keeps B, the rest show A', st['pv'] == ['90 × 15', '130 × 12', '130 × 10'], st['pv'])
        # PRs stay per machine: 130 × 13 on A beats A's best reps (12) but would not count against B
        pr = await ev(f"(() => {{ const s = {it}.sets[1]; s.w = '130'; s.r = '13'; completeSet({it}, s, false); return s.prInfo; }})()")
        check('rep PR judged against the same machine only', pr and any('Rep PR' in x and 'was 12' in x for x in pr), pr)
        pr2 = await ev(f"(() => {{ const s = {it}.sets[0]; return setPR({it}, s); }})()")
        check('90 × 15 on B is not a PR (it matched B’s best)', not pr2, pr2)
        # finishing a set on A doesn't carry its weight to a set on B
        await ev(f"(() => {{ {it}.sets[2].m = 'Stack B'; {it}.sets[2].gw = '90'; const s = {it}.sets[1]; s.w = '135'; afterEdit({it}, s); completeSet({it}, s, false); }})()")
        check('weight carry-over stays on the same machine', await ev(f"{it}.sets[2].gw") == '90')
        # Manage machines
        await pg.locator('.mach-row .chip[aria-label="Edit machines"]').click(); await pg.wait_for_timeout(200)
        await pg.fill('#mach-name', 'Gym B cable'); await pg.click('#mach-add'); await pg.wait_for_timeout(200)
        check('add a machine', await ev(f"S.meta.machines['{ex}'].includes('Gym B cable')"))
        await pg.locator('.sheet input[aria-label="Machine 1 name"]').fill('Left stack'); await pg.locator('.sheet input[aria-label="Machine 1 name"]').press('Tab'); await pg.wait_for_timeout(300)
        check('rename carries into history', await ev("S.sessions.a.items[0].sets[0].m") == 'Left stack' and await ev(f"S.meta.machines['{ex}'][0]") == 'Left stack')
        await ev("closeSheet()")
        # ⋯ menu entry for an exercise without machines
        await ev("(() => { S.active.items.push(makeSlot({ ex: 'b-bench-press', sets: 2, reps: '5' })); touch(); })()"); await pg.wait_for_timeout(200)
        check('no chips until you name machines', await pg.locator('.mach-row').count() == 1)
        await ev("openSheet({ type: 'slot', it: S.active.items[1] })"); await pg.wait_for_timeout(200)
        check('⋯ menu offers Machines', await pg.locator('#opt-machines').count() == 1)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
