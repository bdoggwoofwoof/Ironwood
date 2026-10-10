import asyncio, json, subprocess, sys, time, os
from playwright.async_api import async_playwright

PORT = 8765
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok), detail)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True, accept_downloads=True)
        pg = await ctx.new_page()
        errs = []; ext = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith(URL) and not r.url.startswith('blob:') and not r.url.startswith('data:') else None)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        check('app renders Train screen', await pg.locator('.hdr h1').inner_text() in ('Train', 'TRAIN'), await pg.locator('.hdr h1').inner_text())
        check('no errors on load', not errs, errs[:3])
        check('no requests to other sites', not ext, ext[:5])
        fonts = await pg.evaluate("document.fonts.check('700 22px \"Barlow Condensed\"') && document.fonts.check('16px Barlow')")
        check('fonts load from the app itself', fonts)
        sw = await pg.evaluate("navigator.serviceWorker.ready.then(r => !!r.active)")
        check('offline worker installed', sw)
        man = await pg.evaluate("fetch('manifest.webmanifest').then(r => r.json())")
        check('manifest is standalone', man.get('display') == 'standalone')
        await pg.screenshot(path='shot-train.png')

        # Log a workout: start the next day, fill the first set, finish
        await pg.get_by_role('button', name='Start', exact=False).first.click(); await pg.wait_for_timeout(400)
        inputs = pg.locator('.set-row input[inputmode="decimal"]')
        n = await inputs.count()
        check('workout opened with set rows', n > 0, n)
        await inputs.nth(0).fill('100')
        await pg.locator('.set-row input[inputmode="numeric"]').nth(0).fill('8')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-workout.png')
        await pg.locator('.hdr .r button').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Save workout').click(); await pg.wait_for_timeout(500)
        saved = await pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('liftbook.v1')).sessions).length")
        check('finished workout saved on the phone', saved == 1, saved)

        # Reload with the network cut: the app should still open with the workout in it
        await ctx.set_offline(True)
        await pg.reload(); await pg.wait_for_timeout(1500)
        title = await pg.locator('.hdr h1').inner_text()
        check('opens with no signal', title.upper() == 'TRAIN', title)
        check('fonts still there offline', await pg.evaluate("document.fonts.check('700 22px \"Barlow Condensed\"')"))
        await pg.locator('.tab', has_text='Log').click(); await pg.wait_for_timeout(400)
        check('workout still in the Log offline', await pg.locator('.log-item').count() == 1)
        await pg.screenshot(path='shot-log-offline.png')

        # Profile: sync line and backup file
        await pg.locator('.tab', has_text='Profile').click(); await pg.wait_for_timeout(400)
        sync = await pg.locator('.sync').first.inner_text()
        check('profile says saved on this phone', 'this phone' in sync, sync)
        async with pg.expect_download() as dl:
            await pg.get_by_role('button', name='Save backup file').click()
        d = await dl.value
        path = await d.path(); data = json.load(open(path))
        check('backup file downloads with the workout', data.get('app') == 'liftbook' and len(data['sessions']) == 1, d.suggested_filename)
        await pg.screenshot(path='shot-profile.png', full_page=False)
        persisted = await pg.evaluate("navigator.storage && navigator.storage.persisted ? navigator.storage.persisted() : 'n/a'")
        print('storage persisted (Chrome headless usually says false; iOS decides on its own):', persisted)
        # About links and the policy pages work offline
        check('profile links to privacy policy', await pg.locator('a[href="privacy.html"]').count() == 1)
        await pg.goto(URL + 'privacy.html'); await pg.wait_for_timeout(500)
        check('privacy page opens offline', 'PRIVACY' in (await pg.locator('h1').inner_text()).upper())
        await pg.screenshot(path='shot-privacy.png')
        await pg.goto(URL + 'support.html'); await pg.wait_for_timeout(300)
        check('support page opens offline', 'SUPPORT' in (await pg.locator('h1').inner_text()).upper())
        check('no errors overall', not errs, errs[:3])
        await b.close()

try:
    asyncio.run(main())
finally:
    srv.terminate()
print(sum(ok for _, ok, _ in results), 'of', len(results), 'checks passed')
