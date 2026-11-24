"""Reorder or remove (Nov 20, Newt): drag or arrow keys move exercises, supersets move together, remove with Undo, no
Move up / Move down options; Add from your other programs picks all or some exercises."""
import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8931
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        names = "S.active.items.map(it => exName(it.ex) + (it.ss ? '+' : ''))"
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0])"); await pg.wait_for_timeout(300)
        await ev("openSheet({ type: 'slot', it: S.active.items[1] })"); await pg.wait_for_timeout(200)
        txt = await pg.inner_text('.sheet')
        check('exercise menu has Reorder or remove, not Move up / Move down', 'Reorder or remove' in txt and 'Move up' not in txt and 'Move down' not in txt)
        await pg.click('#opt-reorder'); await pg.wait_for_timeout(200)
        units = await pg.locator('#reorder .ro-unit').count()
        check('supersets show as one block (6 exercises, 3 blocks since Nov 24)', units == 3, units)
        before = await ev(names)
        await pg.locator('#reorder .ro-handle').nth(2).focus(); await pg.keyboard.press('ArrowUp'); await pg.wait_for_timeout(200)
        after = await ev(names)
        check('arrow key moves the pushdown tri-set up as a block', after == ['Decline Chest Press', 'Tricep Pushdowns', 'Behind-the-Back Cable Lateral Raise+', 'Cable Crunch+', 'Incline Reverse-Grip Squeeze Press', 'Cable Fly+'], after)
        h = pg.locator('#reorder .ro-handle').nth(0); box = await h.bounding_box(); tgt = await pg.locator('#reorder .ro-unit').last.bounding_box()
        await ev("""(([x, y, y2]) => { const h = document.querySelectorAll('#reorder .ro-handle')[0]; const o = { pointerId: 7, bubbles: true, clientX: x, clientY: y, isPrimary: true };
          h.dispatchEvent(new PointerEvent('pointerdown', o)); for (let k = 1; k <= 8; k++) h.dispatchEvent(new PointerEvent('pointermove', { ...o, clientY: y + (y2 - y) * k / 8 })); h.dispatchEvent(new PointerEvent('pointerup', { ...o, clientY: y2 })); })""",
          [box['x'] + 10, box['y'] + 10, tgt['y'] + tgt['height'] - 4]); await pg.wait_for_timeout(300)
        dragged = await ev(names)
        check('dragging the handle moves an exercise to the bottom', dragged[-1] == 'Decline Chest Press' and not dragged[0].endswith('+'), dragged)
        await pg.locator('#reorder [id^=ro-x-]').first.click(); await pg.wait_for_timeout(200)
        rm = await ev(names)
        check('remove takes one out; the rest of its superset stays linked correctly', len(rm) == 5 and not rm[0].endswith('+'), rm)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(200)
        check('Undo puts it back where it was', await ev(names) == dragged, await ev(names))
        await pg.click('#ro-done'); await pg.wait_for_timeout(200)
        check('workout page has a Reorder or remove button', await pg.locator('#wo-reorder').count() == 1)
        # Add from your other programs: all or some
        await ev("setAddon('bi-care-stretch', true); S.rerender()"); await pg.wait_for_timeout(300)
        btn = pg.locator('#wo-addons button').first; await btn.click(); await pg.wait_for_timeout(300)
        nall = await pg.locator('#ap-list input').count(); n0 = await ev("S.active.items.length")
        check('add sheet lists the day with everything ticked', nall >= 2 and await pg.locator('#ap-list input:checked').count() == nall and 'Add all' in await pg.inner_text('#ap-add'), nall)
        await pg.click('#ap-all'); await pg.wait_for_timeout(100)
        check('Select none clears them and the add button waits', await pg.locator('#ap-list input:checked').count() == 0 and await pg.locator('#ap-add[disabled]').count() == 1)
        await pg.locator('#ap-list input').nth(0).check(); await pg.locator('#ap-list input').nth(1).check(); await pg.wait_for_timeout(100)
        await pg.click('#ap-add'); await pg.wait_for_timeout(300)
        check('only the picked exercises are added', await ev("S.active.items.length") == n0 + 2, await ev("S.active.items.length"))
        # plan editor
        await ev("commit(st => { st.active = null; }, 'active'); UI.setTab('routines'); UI.setView({ type: 'edit', draft: { ...clone(getRoutine('bi-sapwood')), source: 'mine', base: 'bi-sapwood' } })"); await pg.wait_for_timeout(400)
        check('plan editor: no Move up / Move down on exercises, a Reorder or remove per day', await pg.locator('.ed-item [aria-label="Move up"], .ed-item [aria-label="Move down"]').count() == 0 and await pg.locator('[id^=ed-reorder-]').count() == 4)
        check('no page errors', not errs, errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
