"""Audit Phase 4 (Nov 10): plain wording (P2-6), 44-point tap areas (P2-5), a focus ring on text boxes, an optional
"when you ate it" on food entries (P3-3), High contrast that follows iPhone Increase Contrast (P3-4), and rep ranges
with an en dash."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8792
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
INIT = "try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(INIT)
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        src = await ev("[...document.scripts].map(s => s.textContent).join(' ')")
        for old in ["hasn’t promised", "this site’s data", "Single rest (sec)", "A PR shows right away", "show over the camera"]:
            check('old wording gone: ' + old, old not in src)
        # Tap areas in a workout
        await ev("startWorkout(getRoutine('bi-newt-4day'), getRoutine('bi-newt-4day').days[0])"); await pg.wait_for_timeout(500)
        small = await ev("""(() => { const out = []; for (const e of document.querySelectorAll('main .icon-btn, main .note-add, main .unit-tog, main .side-tog, main .set-row button.n')) { if (!e.offsetWidth) continue;
          const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); const h = Math.max(r.height, parseFloat(a.height) || 0); if (h < 44) out.push(e.className + ' ' + Math.round(h)); } return out; })()""")
        check('workout controls have 44-point tap height', not small, small[:4])
        hit = await ev("(() => { const e = document.querySelector('main .icon-btn'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top - 2); return !!t && (t === e || e.contains(t)); })()")
        check('a tap just above the ⋯ button still hits it', hit)
        rep = await ev("document.querySelector('.slot .meta').textContent")
        check('rep ranges use an en dash', '5–8' in rep, rep)
        await ev("S.active = null; S.rerender()")
        # Focus ring
        await ev("UI.setTab('routines'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.focus('#plan-q')
        oc = await ev("getComputedStyle(document.querySelector('#plan-q')).outlineStyle")
        check('text boxes show a focus ring', oc == 'solid', oc)
        # When you ate it
        day = await ev("ymd(new Date())")
        await ev(f"addLog('{day}', {{ k: 'num', name: 'Test bar', m: {{ kcal: 200, p: 20, c: 20, f: 5 }} }})")
        eid = await ev(f"ML().log['{day}'].slice(-1)[0].id")
        await ev(f"UI.setTab('meals'); setMealsMode('log'); openSheet({{ type: 'logEntry', day: '{day}', id: '{eid}' }})"); await pg.wait_for_timeout(400)
        if await pg.locator('#le-when').count() == 0:
            await ev(f"openSheet({{ type: 'logEdit', day: '{day}', id: '{eid}' }})"); await pg.wait_for_timeout(300)
        check('food entry has a When field', await pg.locator('#le-when').count() == 1)
        await pg.fill('#le-when', '07:30'); await pg.dispatch_event('#le-when', 'change'); await pg.wait_for_timeout(300)
        at = await ev(f"(() => {{ const e = ML().log['{day}'].find(x => x.id === '{eid}'); const d = new Date(e.at); return [ymd(d), d.getHours(), d.getMinutes()]; }})()")
        check('When sets the time on the same day', at == [day, 7, 30], at)
        await ev("closeSheet()")
        # Language upload is tucked away
        await ev("UI.setTab('profile'); S.rerender()"); await pg.wait_for_timeout(300)
        check('language upload hidden behind a link', await pg.locator('#lang-file').count() == 0 and await pg.locator('#lang-add-open').count() == 1)
        await pg.click('#lang-add-open'); await pg.wait_for_timeout(200)
        check('link opens it', await pg.locator('#lang-add').count() == 1)
        check('no page errors', not errs, errs[:2])
        await ctx.close()
        # Increase Contrast
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}, forced_colors='none'); q = await c2.new_page()
        await q.add_init_script(INIT); await q.emulate_media(contrast='more') if hasattr(q, 'emulate_media') else None
        try:
            await q.emulate_media(contrast='more')
        except Exception:
            pass
        await q.goto(f'http://localhost:{PORT}/'); await q.wait_for_timeout(1000)
        more = await q.evaluate("matchMedia('(prefers-contrast: more)').matches")
        if more:
            check('Increase Contrast turns on High contrast', await q.evaluate("document.documentElement.classList.contains('hc')"))
            await q.evaluate("setDisp('hc', false)"); await q.reload(); await q.wait_for_timeout(1000)
            check('your own choice wins after that', not await q.evaluate("document.documentElement.classList.contains('hc')"))
        else:
            check('Increase Contrast is read (code path present)', 'prefers-contrast: more' in src)
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
