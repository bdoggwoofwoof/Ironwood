"""Audit P0 fixes (Nov 10): contrast of accent buttons and the rest bar in every palette, set actions without a
swipe, and schedule cells without the table roles."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8799
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
CONTRAST = """sel => { const rgb = s => { const m = s.match(/[\\d.]+/g).map(Number); return m; };
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const bgOf = el => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const g = cv.getContext('2d');
    const chain = []; for (let e = el; e; e = e.parentElement) chain.push(getComputedStyle(e).backgroundColor);
    g.fillStyle = getComputedStyle(document.body).backgroundColor; g.fillRect(0, 0, 1, 1); for (const c of chain.reverse()) { g.fillStyle = c; g.fillRect(0, 0, 1, 1); } return [...g.getImageData(0, 0, 1, 1).data]; };
  return [...document.querySelectorAll(sel)].filter(e => e.offsetWidth).map(e => { const fg = rgb(getComputedStyle(e).color), bg = bgOf(e); const a = L(fg), b = L(bg); return Math.round((Math.max(a, b) + .05) / (Math.min(a, b) + .05) * 100) / 100; }); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        worst = {}
        for theme in ['dark', 'light']:
            for pal in ['classic', 'forest', 'rg', 'by']:
                ctx = await b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=theme); pg = await ctx.new_page()
                await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1')}catch(e){}")
                await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
                await pg.evaluate(f"setDisp('palette', '{pal}'); UI.setTab('meals'); setMealsMode('log')"); await pg.wait_for_timeout(300)
                c1 = await pg.evaluate(CONTRAST, '#log-add')
                await pg.evaluate("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(300)
                await pg.evaluate("const it = S.active.items[0]; it.sets[0].w = '100'; it.sets[0].r = '5'; completeSet(it, it.sets[0], false); S.rerender()"); await pg.wait_for_timeout(300)
                c2 = await pg.evaluate(CONTRAST, '.restbar button, .restbar .lbl2')
                worst[theme + ' ' + pal] = min(c1 + c2) if c1 + c2 else 0
                await ctx.close()
        check('main buttons and the rest bar reach 4.5:1 in every palette, light and dark', all(v >= 4.5 for v in worst.values()), worst)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("startWorkout(getRoutine('bi-5x5'), getRoutine('bi-5x5').days[0])"); await pg.wait_for_timeout(300)
        ids = await ev("S.active.items[0].sets.map(s => s.id)")
        await ev("const it = S.active.items[0]; it.sets[1].w = '135'; S.rerender()")
        await pg.click('#sn-' + ids[1]); await pg.wait_for_timeout(250)
        check('tapping a set number opens its actions', await pg.locator('.sheet #sa-del').count() == 1 and 'set 2' in (await pg.inner_text('.sheet h2')).lower())
        await pg.click('#sa-del'); await pg.wait_for_timeout(250)
        now = await ev("S.active.items[0].sets.map(s => s.id)")
        check('Delete set removes a set in the middle', len(now) == len(ids) - 1 and ids[1] not in now)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(200)
        check('Undo puts it back in place, weight kept', await ev("S.active.items[0].sets.map(s => s.id)") == ids and await ev("S.active.items[0].sets[1].w") == '135')
        await pg.focus('#sn-' + ids[2]); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
        check('works from the keyboard', await pg.locator('.sheet #sa-copy').count() == 1)
        await pg.click('#sa-copy'); await pg.wait_for_timeout(200)
        check('Copy set adds a copy after it', await ev("S.active.items[0].sets.length") == len(ids) + 1)
        await ev("const it = S.active.items[0]; it.sets[0].w = '100'; it.sets[0].r = ''; S.rerender()")
        await pg.click('#sn-' + ids[0]); await pg.wait_for_timeout(250)
        dbg = await pg.inner_text('.sheet') if await pg.locator('.sheet').count() else 'no sheet'
        await pg.click('#sa-log'); await pg.wait_for_timeout(250)
        check('Log this set logs it with the planned reps', 'Log this set' in dbg and await ev("!!S.active.items[0].sets[0].c && S.active.items[0].sets[0].r === '5'"), dbg[:60])
        check('the set number still reads as the number', await pg.inner_text('#sn-' + ids[0]) == '1')
        await ev("finishWorkout ? 0 : 0"); await ev("S.active = null; UI.setTab('train'); commit(st => { st.meta.settings.program = 'bi-5x5'; }, 'meta'); setTimeout(() => openSheet({ type: 'schedule' }), 50)"); await pg.wait_for_timeout(300)
        check('schedule cells no longer use table roles', await ev("document.querySelectorAll('[role=cell],[role=table],[role=columnheader],[role=rowheader]').length") == 0 and await ev("document.querySelectorAll('.pw-cell[aria-label]').length") > 0)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
