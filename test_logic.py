"""Unit switch keeps old entries' meaning, long-idle workouts ask for an end time, History pages, renamed exercises keep history, typing saves soon."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8768
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; R = []
def check(n, ok, d=''):
    R.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + (' - ' + str(d) if d != '' else ''))
SEED = """() => { const now = Date.now(), day = 864e5; const sessions = {};
  for (let i = 0; i < 40; i++) sessions['s' + i] = { id: 's' + i, name: 'Workout ' + i, startedAt: now - (60 - i) * day, endedAt: now - (60 - i) * day + 3600e3, updatedAt: now, prs: [],
    items: [{ ex: i === 0 ? 'b-russian-tits-to-l-stretch' : 'b-squat', group: '', ss: false, target: { sets: 2, reps: '' }, note: '', sets: [{ w: 185, r: 5 }, { w: 185, r: 5 }] }] };
  const meta = { settings: { unit: 'lb', bar: 45, inc: 5, goal: 4 }, exercises: {}, routines: {}, exUnit: {}, exRest: { 'b-russian-tits-to-l-stretch': 90 }, exCat: {}, bw: [{ id: 'b1', d: '2026-10-01', w: 180 }], dayMarks: {}, challenges: {}, timers: [], deleted: [], updatedAt: now };
  localStorage.setItem('liftbook.v1', JSON.stringify({ meta, sessions, active: null, activeAt: 0, dirty: [] })); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(URL); await pg.wait_for_timeout(800); await pg.evaluate(SEED); await pg.reload(); await pg.wait_for_timeout(1500)
        # renamed built-in exercise: old id migrated everywhere
        st = await pg.evaluate("JSON.parse(localStorage.getItem('liftbook.v1'))") if await pg.evaluate("S.sessions.s0.items[0].ex") else None
        check('renamed exercise id migrated in history and settings', await pg.evaluate("S.sessions.s0.items[0].ex === 'b-incline-dumbbell-pinky-press' && S.meta.exRest['b-incline-dumbbell-pinky-press'] === 90 && !('b-russian-tits-to-l-stretch' in S.meta.exRest)"))
        check('renamed exercise resolves to a name', await pg.evaluate("exName('b-incline-dumbbell-pinky-press')") == 'Incline Dumbbell Pinky Press', await pg.evaluate("exName('b-incline-dumbbell-pinky-press')"))
        # History: 30 at a time
        await pg.locator('.tab', has_text='Train').click(); await pg.locator('.topsw button', has_text='History').click(); await pg.wait_for_timeout(500)
        check('History shows 30 then a Show more button', await pg.locator('.log-item').count() == 30 and await pg.locator('#log-more').count() == 1, await pg.locator('.log-item').count())
        await pg.locator('#log-more').click(); await pg.wait_for_timeout(300)
        check('Show more reveals the rest', await pg.locator('.log-item').count() == 40 and await pg.locator('#log-more').count() == 0)
        # Unit switch: 185 lb stays 185 lb (84 kg), custom bar weight kept
        await pg.evaluate("commit(x => { x.meta.settings.bar = 35; }, 'meta')")
        await pg.locator('.tab', has_text='Profile').click(); await pg.wait_for_timeout(300)
        await pg.locator('.seg button', has_text='kg').first.click(); await pg.wait_for_timeout(400)
        st = await pg.evaluate("({ u: S.sessions.s5.items[0].u, bw: S.meta.bw[0].u, bar: S.meta.settings.bar, inc: S.meta.settings.inc, unit: S.meta.settings.unit, main: toMain(S.sessions.s5.items[0].sets, S.sessions.s5.items[0].u)[0].w })")
        check('old entries stamped with lb on switch to kg', st['u'] == 'lb' and st['bw'] == 'lb' and st['unit'] == 'kg', st)
        check('185 lb reads as ~84 kg in stats, not 185 kg', 83 <= st['main'] <= 85, st['main'])
        check('custom bar kept, default jump moved to 2.5', st['bar'] == 35 and st['inc'] == 2.5, st)
        await pg.locator('.seg button', has_text='lb').first.click(); await pg.wait_for_timeout(300)
        # Typing during a workout is saved within a second
        await pg.evaluate("startWorkout(null, null)"); await pg.wait_for_timeout(500)
        await pg.evaluate("S.active.name = 'Typed name'; touch()"); await pg.wait_for_timeout(900)
        check('active workout saved shortly after typing', await pg.evaluate("JSON.parse(localStorage.getItem('liftbook.v1')).active.name") == 'Typed name')
        # A workout idle for 5 hours asks for its end time
        await pg.evaluate("(() => { const a = S.active; a.startedAt = Date.now() - 6 * 3600e3; a.items.push({ id: 'i1', ex: 'b-squat', group: '', ss: false, target: { sets: 1, reps: '' }, note: '', sets: [{ w: '100', r: '5', c: Date.now() - 5 * 3600e3 }] }); touch(); })()")
        await pg.wait_for_timeout(300); await pg.evaluate("finishWorkout()"); await pg.wait_for_timeout(400)
        check('long-idle workout asks about the end time', await pg.locator('.sheet h2', has_text='Finished a while ago').count() == 1)
        await pg.locator('.sheet button', has_text='End at').click(); await pg.wait_for_timeout(600)
        mins = await pg.evaluate("(() => { const s = Object.values(S.sessions).sort((a, b) => b.startedAt - a.startedAt)[0]; return Math.round((s.endedAt - s.startedAt) / 60000); })()")
        check('saved as about an hour, not six', 55 <= mins <= 65, mins)
        # Steppers under the focused field; reps stepper logs the set
        await pg.evaluate("closeSheet()"); await pg.wait_for_timeout(300)
        await pg.evaluate("const r = getRoutine('bi-newt-4day'); startWorkout(r, r.days[0])"); await pg.wait_for_timeout(500)
        w = pg.locator('.set-row input[id^=w-]').first; await w.click(); await pg.wait_for_timeout(200)
        check('stepper strip appears under the focused weight', await pg.locator('.step-strip').count() == 1)
        await pg.locator('.step-strip button').nth(1).click(); await pg.locator('.step-strip button').nth(1).click(); await pg.wait_for_timeout(150)
        check('weight steps by the jump and keeps focus', await w.input_value() == '10' and (await pg.evaluate("document.activeElement.id")).startswith('w-'), await w.input_value())
        r = pg.locator('.set-row input[id^=r-]').first; await r.click(); await pg.wait_for_timeout(200)
        await pg.locator('.step-strip button').nth(1).click(); await pg.wait_for_timeout(200)
        check('reps stepper logs the set', await r.input_value() == '6' and await pg.evaluate("isDone(S.active.items[0].sets[0])"), await r.input_value())
        # Removing an exercise can be undone
        n0 = await pg.evaluate("S.active.items.length")
        await pg.locator('button[aria-label^="Options for"]').first.click(); await pg.wait_for_timeout(300)
        await pg.locator('.sheet button', has_text='Remove from this workout').click(); await pg.wait_for_timeout(300)
        check('exercise removed with an undo toast', await pg.evaluate("S.active.items.length") == n0 - 1 and await pg.locator('.toast button', has_text='Undo').count() == 1)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(200)
        check('undo brings the exercise back in place', await pg.evaluate("S.active.items.length") == n0 and await pg.evaluate("S.active.items[0].sets[0].r") == '6')
        await pg.evaluate("commit(st => { st.active = null; st.rest = null; }, 'active')"); await pg.wait_for_timeout(200)
        # Deleting a saved workout can be undone
        await pg.locator('.tab', has_text='Train').click(); await pg.locator('.topsw button', has_text='History').click(); await pg.wait_for_timeout(400)
        await pg.locator('.log-item').first.click(); await pg.wait_for_timeout(300)
        await pg.locator('.sheet button', has_text='Delete').first.click(); await pg.wait_for_timeout(200)
        if await pg.locator('.sheet button', has_text='Delete').count(): await pg.locator('.sheet button', has_text='Delete').last.click(); await pg.wait_for_timeout(300)
        n1 = await pg.evaluate("Object.keys(S.sessions).length")
        check('workout deleted with an undo toast', await pg.locator('.toast button', has_text='Undo').count() == 1, n1)
        await pg.locator('.toast button', has_text='Undo').click(); await pg.wait_for_timeout(200)
        check('undo restores the workout and clears the deleted mark', await pg.evaluate("Object.keys(S.sessions).length") == n1 + 1 and await pg.evaluate("(S.meta.deleted || []).length") == 0)
        # Timers survive a reload; 0.4 reps is not a logged set
        await pg.evaluate("S.rest = { until: Date.now() + 90000, total: 90, kind: 'solo', ex: 'b-squat', beeped: {} }; lsSave()"); await pg.reload(); await pg.wait_for_timeout(1200)
        check('rest timer survives a reload', await pg.evaluate("!!S.rest && S.rest.until > Date.now()"))
        check('0.4 reps does not count as a set', await pg.evaluate("isDone({ w: '100', r: '0.4' }) === false && isDone({ w: '100', r: '0.6' }) === true"))
        # Sheets are real modals: page behind is inert, focus moves in and comes back
        await pg.locator('.tab', has_text='Profile').click(); await pg.wait_for_timeout(300)
        await pg.locator('#pal-custom').click(); await pg.wait_for_timeout(300)
        inside = await pg.evaluate("document.querySelector('.sheet').contains(document.activeElement)")
        check('sheet takes focus and the page behind is inert', inside and await pg.evaluate("document.querySelector('#app > main').inert === true"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        check('closing restores the page and focus', await pg.evaluate("document.querySelector('#app > main').inert === false && document.activeElement && document.activeElement.id === 'pal-custom'"), await pg.evaluate("document.activeElement && document.activeElement.id"))
        # Rest end is announced to screen readers
        await pg.evaluate("S.rest = { until: Date.now() + 300, total: 60, kind: 'solo', ex: 'b-squat', beeped: {} }; S.rerender()"); await pg.wait_for_timeout(1200)
        check('rest over is announced', await pg.evaluate("document.querySelector('[aria-live=assertive]').textContent") == 'Rest over')
        # Default theme tokens pass 4.5:1
        await pg.emulate_media(color_scheme='dark'); await pg.wait_for_timeout(200)
        ratios = await pg.evaluate("""(() => { const g = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
          const lum = h => { h = h.replace('#', ''); const [r, g2, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g2 + .0722 * b; };
          const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
          return { btn: cr(g('--accent-ink'), g('--accent-bg')), ink3: cr(g('--ink-3'), g('--raised')), good: cr(g('--good'), g('--surface')), stop: cr(g('--stop'), g('--raised')), accent: cr(g('--accent'), g('--surface')) }; })()""")
        check('dark theme contrast is at least 4.5:1', all(v >= 4.5 for v in ratios.values()), {k: round(v, 2) for k, v in ratios.items()})
        await pg.emulate_media(color_scheme='light'); await pg.wait_for_timeout(200)
        ratios = await pg.evaluate("""(() => { const g = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
          const lum = h => { h = h.replace('#', ''); const [r, g2, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g2 + .0722 * b; };
          const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
          return { btn: cr(g('--accent-ink'), g('--accent-bg')), ink3: cr(g('--ink-3'), g('--raised')), good: cr(g('--good'), g('--surface')), stop: cr(g('--stop'), g('--raised')), accent: cr(g('--accent'), g('--surface')) }; })()""")
        check('light theme contrast is at least 4.5:1', all(v >= 4.5 for v in ratios.values()), {k: round(v, 2) for k, v in ratios.items()})
        check('no page errors', not errs, errs[:3])
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(R)}/{len(R)} passed'); sys.exit(0 if all(R) else 1)
