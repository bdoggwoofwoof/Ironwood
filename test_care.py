"""Joint care programs: seven two-day strength and mobility programs for common aches, with a pain rule and signs to see a
doctor or physical therapist; no therapy, rehab or treatment claims; a finder on Routines."""
import asyncio, re, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8775
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
        progs = await ev("BUILTIN_ROUTINES.filter(r => r.info && r.info.care).map(r => ({ id: r.id, name: r.name, days: r.days.length, items: r.days.map(d => d.items.length), tags: r.days.map(d => d.tags[0]), red: r.info.red.length, kinds: r.days.flatMap(d => d.items.map(i => exKind(i.ex))) }))")
        check('seven joint care programs, two days each', len(progs) == 7 and all(p['days'] == 2 and min(p['items']) >= 4 for p in progs), [p['name'] for p in progs])
        check('tagged Joint care', all(t == 'Joint care' for p in progs for t in p['tags']))
        check('each lists signs to see a professional', all(p['red'] >= 2 for p in progs))
        check('no "Unknown exercise" and no odd kinds', await ev("BUILTIN_ROUTINES.filter(r => r.info && r.info.care).every(r => r.days.every(d => d.items.every(i => getEx(i.ex).name !== 'Unknown exercise')))") and all(k in ('bodyweight', 'dumbbell', 'other', 'cable', 'timed', 'carry', 'machine', 'barbell') for p in progs for k in p['kinds']))
        text = await ev("JSON.stringify(BUILTIN_ROUTINES.filter(r => r.info && r.info.care).map(r => [r.name, r.note, r.info, r.days])) + CARE_NOTE + CARE_PAIN + JSON.stringify(CARE_RED)")
        bad = [w for w in [r'\bphysical therapy\b', r'\bPT\b', r'\brehab', r'\btherap(y|ies)\b', r'\bcures?\b', r'\bheals?\b', r'\bfix(es)?\b', r'\bdiagnos(e|is)\b(?!.{0,3}or treatment)'] if re.search(w, text.replace('not medical advice, diagnosis or treatment', ''), re.I)]
        check('no therapy, rehab, cure or diagnosis claims', not bad, bad)
        check('says it is not medical advice or treatment', 'not medical advice, diagnosis or treatment' in text and 'physical therapist' in text)
        # Routines finder → program page → start
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        check('finder on Routines lists the areas', await pg.locator('#care-finder .chip').count() == 7)
        await pg.click('#care-ankle'); await pg.wait_for_timeout(300)
        info = await pg.locator('#care-info').inner_text()
        check('program page: how to use, what to expect, watch-outs, red flags', all(x in info for x in ['How to use it', 'What to expect', 'Watch out for', 'Pain rule', 'See a doctor or physical therapist']))
        await pg.locator('.pill-btn', has_text='Start').first.click(); await pg.wait_for_timeout(400)
        check('day A starts with a timed balance hold', await ev("S.active.items.some(i => exName(i.ex) === 'Single-Leg Balance' && exKind(i.ex) === 'timed' && i.target.dur === 30)"))
        await ev("commit(st => { st.active = null; }, 'active')")
        # Run → Programs points to ankle care
        await pg.locator('.tabs button', has_text='Train').click(); await pg.locator('.topsw button', has_text='Run').click(); await pg.wait_for_timeout(200)
        await ev("runCommit(r => { Object.assign(r, { t100: 16, t1: 540, t3: 1700, start: ymd(new Date()) }); })"); await pg.wait_for_timeout(200)
        await pg.click('#run-tab-programs'); await pg.wait_for_timeout(200); await pg.click('#run-care-link'); await pg.wait_for_timeout(300)
        check('Run → Programs links to Ankle & Foot Care', await pg.locator('h2', has_text='Ankle & Foot Care').count() == 1)
        # By type has a Joint care section
        await ev("lsSet('rtView', 'type'); lsSet('rtKind', 'plans')"); await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        check('By type has a Joint care section', 'JOINT CARE' in (await pg.locator('main').inner_text()).upper())
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
