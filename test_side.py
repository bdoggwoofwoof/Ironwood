"""Weight is total or each side, per exercise (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8785
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
        ex = await ev("(() => { for (const k of ['b-cable-fly', 'b-cable-flye', 'b-cable-crossover', 'b-dumbbell-fly']) if (exName(k) !== 'Unknown exercise') return k; return 'b-bench-press'; })()")
        await ev(f"""(() => {{ S.meta.settings.unit = 'lb'; const t = Date.now() - 3 * 864e5; S.sessions = {{ a: {{ id: 'a', name: 'W', startedAt: t, endedAt: t + 3e6, prs: [], items: [{{ ex: '{ex}', group: '', u: 'lb', sets: [{{ w: 20, r: 12 }}] }}] }} }}; S.ver++;
          startWorkout(null, null); S.active.items.push(makeSlot({{ ex: '{ex}', sets: 2, reps: '10-12' }})); touch(); }})()""")
        await pg.wait_for_timeout(300)
        check('weight heading has the total/each-side button, total by default', await pg.locator(f'.set-row.th .side-tog[aria-pressed=false] .dot').count() == 1)
        await pg.locator('.set-row.th .side-tog').first.click(); await pg.wait_for_timeout(200)
        check('tap: two small dots for each side', await pg.locator('.set-row.th .side-tog[aria-pressed=true] .dot.sm').count() == 2 and await ev(f"exSideOn('{ex}')"))
        check('Last line says each side', await pg.locator('.last-line', has_text='each side').count() == 1)
        check('saved per exercise in settings that back up', await ev(f"S.meta.exSide['{ex}'] === true"))
        await pg.locator('.set-row.th .side-tog').first.click(); await pg.wait_for_timeout(200)
        check('tap again: back to total', not await ev(f"exSideOn('{ex}')") and await pg.locator('.last-line', has_text='each side').count() == 0)
        w = await ev("[...document.querySelectorAll('.set-row.th')][0].scrollWidth <= [...document.querySelectorAll('.set-row.th')][0].offsetWidth")
        check('heading row still fits', w)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
