"""Level for check-in photos (Nov 9): motion readings drive a bubble and directions over the live camera; each photo
saves its tilt, and the next check-in aims for that angle."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8791
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
# Android-style readings (this browser isn't an iPhone): upright portrait is y = +9.8
MOVE = "([x, y, z]) => { for (let i = 0; i < 25; i++) window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x, y, z } })); }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, permissions=['camera', 'accelerometer', 'gyroscope']); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        pose = await ev("POSES[0][0]")
        await ev("PH.list = []")
        await ev(f"UI.setTab('stats'); UI.setView({{ type: 'photoCap', poses: ['{pose}'], i: 0, date: ymd(new Date()), hand: 'right' }})"); await pg.wait_for_timeout(1500)
        check('live camera: Show level is offered', await pg.locator('#tilt-on').count() == 1 and await pg.locator('#cam-level').count() == 0)
        await pg.click('#tilt-on'); await pg.wait_for_timeout(100)
        s9, c9 = 9.8 * 0.0698, 9.8 * 0.9976   # 4 degrees
        await ev(MOVE, [-s9, c9, 0]); await pg.wait_for_timeout(200)   # right side lower by 4°
        t = await pg.inner_text('#cam-level')
        check('right side lower: says raise the right side about 4°', 'Raise the right side 4°' in t and 'ok' not in await pg.get_attribute('#cam-level', 'class') and await pg.locator('.lvl-plus.float').count() == 1, t)
        await ev(MOVE, [0, c9, -s9]); await pg.wait_for_timeout(200)   # top leaning toward the screen side
        t = await pg.inner_text('#cam-level')
        check('top leaning toward you: says tilt the top away', 'Tilt the top away 4°' in t, t)
        await ev(MOVE, [0, 9.8, 0]); await pg.wait_for_timeout(200)
        check('straight: green and says Level', await pg.inner_text('#cam-level') == 'Level' and 'ok' in await pg.get_attribute('#cam-level', 'class') and await pg.locator('.lvl-plus.float').count() == 0 and await pg.locator('.cam-lvl.ok .lvl-seg').count() == 3)
        check('the switch can turn it off', await pg.locator('#tilt-off').count() == 1)
        # take a photo at a slight angle: its tilt is saved
        await ev(MOVE, [0, c9, s9]); await pg.wait_for_timeout(200)
        await pg.click('.shutter'); await pg.wait_for_timeout(800)
        await pg.locator('button', has_text='Save check-in').click(); await pg.wait_for_timeout(600)
        rec = await ev("(PH.list || [])[0] && PH.list[0].tilt")
        check('the photo keeps the angle it was taken at', rec and abs(rec['p'] + 4) < 0.6 and abs(rec['r']) < 0.6, rec)
        # next check-in (another day) aims for that angle
        await ev(f"UI.setView({{ type: 'photoCap', poses: ['{pose}'], i: 0, date: '2099-01-01', hand: 'right' }})"); await pg.wait_for_timeout(1500)
        await ev(MOVE, [0, 9.8, 0]); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#cam-level')
        check('next time: straight is not a match; it says how to get to last time’s angle', 'Tilt the top away 4°' in t, t)
        await ev(MOVE, [0, c9, s9]); await pg.wait_for_timeout(200)
        check('at last time’s angle: green, “Same angle as last photo”', await pg.inner_text('#cam-level') == 'Same angle as last photo')
        check('the row says it’s matching the last photo', 'matching your last photo' in await pg.inner_text('#tilt-row'))
        await pg.click('#tilt-off'); await pg.wait_for_timeout(200)
        check('turned off: no level, and it stays off', await pg.locator('#cam-level').count() == 0 and await ev("localStorage.getItem('liftbook.tiltOn')") in ('', None))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
