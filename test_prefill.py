"""Last time's numbers (any workout vs this workout only), last time shown beside each set, and rep records per weight
with lb and kg converted (Oct 27)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8782
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
# [days ago, routine, day, exercise, unit, weight, reps list]
SEED = """(spec) => { const now = Date.now(), d = 864e5; S.sessions = {};
  spec.forEach(([ago, rid, did, ex, u, w, reps], i) => { const id = 'h' + i; S.sessions[id] = { id, name: 'W', routineId: rid, dayId: did, startedAt: now - ago * d, endedAt: now - ago * d + 3e6, items: [{ ex, group: '', u, sets: reps.map(r => ({ w, r })) }], prs: [] }; });
  S.ver++; touch(); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev("S.meta.settings.unit = 'lb'")
        # Bench in day 1 of 5x5 at 100 lb (older), then in another plan at 150 lb (newer)
        await ev(SEED, [[6, 'bi-5x5', 'bi-5x5-d1', 'b-bench', 'lb', 100, [8, 7, 6]], [2, 'other', 'other-d1', 'b-bench', 'lb', 150, [5, 5, 4]]])
        start = "(() => { const r = getRoutine('bi-5x5'); const d = r.days[0]; startWorkout(r, d); const it = S.active.items.find(i => i.ex === 'b-bench') || (S.active.items.push(makeSlot({ ex: 'b-bench', sets: 3, reps: '' })), S.active.items[S.active.items.length - 1]); return { gw: it.sets.map(s => s.gw), where: it.prevWhere || '' }; })()"
        stop = "(() => { S.active = null; touch(); })()"
        r = await ev(start)
        check('default: last time in any workout (150 lb)', r['gw'][0] == '150' and r['where'] == '', r); await ev(stop)
        await ev("setPrefill('workout')"); await pg.wait_for_timeout(100)
        r = await ev(start)
        check('this workout only: last time in this plan day (100 lb)', r['gw'][0] == '100' and r['where'] == 'in this workout', r); await ev(stop)
        await ev("setPrefill('all', 'bi-5x5')"); await pg.wait_for_timeout(100)
        r = await ev(start)
        check('a plan can override the default', r['gw'][0] == '150' and await ev("S.meta.settings.prefillBy['bi-5x5'] === 'all'"), r); await ev(stop)
        await ev("setPrefill('workout', 'bi-5x5')")
        check('choosing the default again clears the override', await ev("!S.meta.settings.prefillBy['bi-5x5']"))
        await ev(SEED, [[2, 'other', 'other-d1', 'b-bench', 'lb', 150, [5, 5, 4]]])
        r = await ev(start)
        check('never done in this workout: falls back to any workout', r['gw'][0] == '150' and r['where'] == 'in any workout', r); await ev(stop)
        await ev("setPrefill('all')")
        # Settings UI
        await pg.locator('.tabs button', has_text='Profile').click(); await pg.wait_for_timeout(250)
        check('Profile has the choice', await pg.locator('#prefill-all').count() == 1)
        await ev("UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-5x5' })"); await pg.wait_for_timeout(250)
        check('plan page has its own choice', await pg.locator('#prefill-row #prefill-plan').count() == 1)
        await pg.click('#pfp-workout'); await pg.wait_for_timeout(150)
        check('plan choice saves', await ev("S.meta.settings.prefillBy['bi-5x5'] === 'workout'"))
        await ev("setPrefill('all', 'bi-5x5')")
        # Last time beside each set
        await ev(SEED, [[2, 'other', 'other-d1', 'b-bench', 'lb', 150, [8, 6, 5]]])
        await ev("(() => { startWorkout(null, null); S.active.items.push(makeSlot({ ex: 'b-bench', sets: 3, reps: '8' })); touch(); })()"); await pg.wait_for_timeout(300)
        prev = await ev("[...document.querySelectorAll('.last-note .prev')].map(e => e.textContent)")
        check('each set shows its own numbers from last time', prev == ['150 × 8', '150 × 6', '150 × 5'], prev)
        gr = await ev("S.active.items[0].sets.map(s => s.gr)")
        check('reps aimed at the target still prefill', gr == ['8', '8', '8'], gr)
        check('column header says Last', await pg.locator('.set-row.th', has_text='Last').count() == 1)
        await ev(stop)
        # Rep records: heaviest first, then most reps at lighter weights; kg converted
        await ev(SEED, [[9, 'x', 'x1', 'b-bench', 'lb', 50, [1]], [7, 'x', 'x1', 'b-bench', 'lb', 50, [6]], [5, 'x', 'x1', 'b-bench', 'kg', 20, [9]], [3, 'x', 'x1', 'b-bench', 'lb', 45, [8]], [1, 'x', 'x1', 'b-bench', 'lb', 40, [12]]])
        rr = await ev("repRecords('b-bench').map(b => [b.w, b.r])")
        check('rep records heaviest first: 50×6, 45×8, 20 kg as 44 lb ×9, 40×12; 50×1 left out', rr == [[50, 6], [45, 8], [44, 9], [40, 12]], rr)
        await ev("UI.setTab('stats'); UI.setView({ type: 'exercise', ex: 'b-bench' })"); await pg.wait_for_timeout(300)
        t = await pg.locator('#rep-records > div').first.inner_text() if await pg.locator('#rep-records').count() else ''
        check('records list on the exercise page, heaviest first', '50 lb' in t and 'Heaviest' in t and '6 reps' in t, t)
        # PRs: same weight more reps is a rep PR; kg compared as lb
        await ev(SEED, [[3, 'x', 'x1', 'b-bench', 'lb', 50, [1]]])
        await ev("(() => { startWorkout(null, null); S.active.items.push(makeSlot({ ex: 'b-bench', sets: 2, reps: '' })); touch(); })()")
        pr = await ev("(() => { const it = S.active.items[0]; const s = it.sets[0]; s.w = '50'; s.r = '6'; completeSet(it, s, false); return s.prInfo; })()")
        check('50 × 6 after 50 × 1 is a rep PR', pr and any(x == 'Rep PR: 6 reps at 50 lb (was 1 rep)' for x in pr), pr)
        pr2 = await ev("(() => { const it = S.active.items[0]; it.u = 'kg'; const s = it.sets[1]; s.w = '22.5'; s.r = '1'; completeSet(it, s, false); return s.prInfo; })()")
        check('22.5 kg (49.6 lb) × 1 is not a PR over 50 lb', not pr2, pr2)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
