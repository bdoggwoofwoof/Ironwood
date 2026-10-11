"""A new build reaches an installed copy: the next open shows it, and an open app switches over by itself."""
import asyncio, os, re, shutil, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright
PORT = 8777
root = tempfile.mkdtemp(); site = os.path.join(root, 'site'); shutil.copytree('dist', site)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', site], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
def publish(marker):
    """Simulate a new build: change the page and the service worker's version, like build.py does."""
    p = os.path.join(site, 'index.html'); h = open(p, encoding='utf8').read()
    h = re.sub(r'<meta name="build-marker" content="[^"]*">', '', h).replace('<head>', f'<head><meta name="build-marker" content="{marker}">', 1)
    open(p, 'w', encoding='utf8').write(h)
    s = os.path.join(site, 'sw.js'); w = open(s, encoding='utf8').read()
    w = re.sub(r"ironwood-[0-9a-z]+", 'ironwood-' + marker, w); open(s, 'w', encoding='utf8').write(w)
async def marker(pg):
    return await pg.evaluate("(document.querySelector('meta[name=build-marker]') || {}).content || 'original'")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg = await ctx.new_page()
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("navigator.serviceWorker.ready"); await pg.reload(); await pg.wait_for_timeout(1200)
        check('installed and controlled by the offline worker', await pg.evaluate("!!navigator.serviceWorker.controller"))
        publish('v2')
        await pg.reload(); await pg.wait_for_timeout(2500)
        check('next open shows the new build', await marker(pg) == 'v2', await marker(pg))
        publish('v3')
        await pg.evaluate("navigator.serviceWorker.getRegistration().then(r => r.update())"); await pg.wait_for_timeout(3000)
        check('an open app switches to a newer build by itself', await marker(pg) == 'v3', await marker(pg))
        # never reload in the middle of a workout
        await pg.evaluate("startWorkout(null, null)"); await pg.wait_for_timeout(500)
        publish('v4')
        await pg.evaluate("navigator.serviceWorker.getRegistration().then(r => r.update())"); await pg.wait_for_timeout(3000)
        check('no reload during a workout', await marker(pg) == 'v3' and await pg.evaluate("!!S.active"), await marker(pg))
        await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(5000)
        check('still opens offline', await pg.locator('.tabs').count() == 1)
        # Visiting the privacy page online must not replace the saved app page; a server error must not either
        await ctx.set_offline(False); await pg.goto(URL + 'privacy.html'); await pg.wait_for_timeout(1500)
        check('privacy page opens', 'Privacy' in await pg.title() or await pg.locator('h1', has_text='Privacy').count() == 1)
        await ctx.set_offline(True); await pg.goto(URL + 'index.html'); await pg.wait_for_timeout(4000)
        check('app still opens offline after visiting another page', await pg.locator('.tabs').count() == 1 and await pg.locator('h1', has_text='Privacy').count() == 0)
        await ctx.set_offline(False); os.rename(os.path.join(site, 'index.html'), os.path.join(site, 'index.bak'))
        await pg.goto(URL + 'index.html'); await pg.wait_for_timeout(4000)
        check('server error shows the saved app instead', await pg.locator('.tabs').count() == 1)
        os.rename(os.path.join(site, 'index.bak'), os.path.join(site, 'index.html'))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate(); shutil.rmtree(root, ignore_errors=True)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
