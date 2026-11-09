"""Check-in camera (Nov 9): the last photo of the pose shows tinted red, and the pose outline is hidden while it shows."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8789
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        pose = await ev("POSES[0][0]")
        open_cap = f"UI.setTab('stats'); UI.setView({{ type: 'photoCap', poses: ['{pose}'], i: 0, date: ymd(new Date()), hand: 'right' }})"
        # no earlier photo: outline as before
        await ev("PH.list = []"); await ev(open_cap); await pg.wait_for_timeout(500)
        check('first check-in: the pose outline shows, no last photo', await pg.locator('.cam .pose').count() == 1 and await pg.locator('.cam-ghost').count() == 0)
        # an earlier photo of the same pose
        await ev(f"""(async () => {{ const c = document.createElement('canvas'); c.width = 30; c.height = 40; c.getContext('2d').fillRect(0, 0, 30, 40);
          const blob = await new Promise(r => c.toBlob(r, 'image/png')); PH.list = [{{ id: 'old1', pose: '{pose}', date: '2026-10-01', t: Date.now() - 864e5 * 30, blob }}];
          UI.setView(null); S.rerender(); }})()""")
        await pg.wait_for_timeout(200); await ev(open_cap); await pg.wait_for_timeout(500)
        g = pg.locator('.cam-ghost')
        check('the last photo shows over the camera', await g.count() == 1)
        flt = await ev("getComputedStyle(document.querySelector('.cam-ghost')).filter")
        check('tinted red', 'ghost-red' in flt and await ev("!!document.querySelector('#ghost-red feColorMatrix')"), flt)
        check('the pose outline and its lines are hidden while it shows', await pg.locator('.cam .pose').count() == 0)
        check('the slider says it’s the red one', '(red)' in await pg.inner_text('.cam-ghost-row'))
        await pg.fill('#ghost-op', '0'); await pg.dispatch_event('#ghost-op', 'input'); await pg.wait_for_timeout(200)
        check('slide it to 0%: the outline comes back', await pg.locator('.cam .pose').count() == 1 and await pg.locator('.cam-ghost').count() == 0)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
