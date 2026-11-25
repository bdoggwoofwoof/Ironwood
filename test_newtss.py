"""Nov 24 (Newt): his split plans (Sapwood, Heartwood, Newt's 4-Day Split) start each day with one exercise on its own and
pair the rest in supersets, with squats and RDLs both on their own on the legs day. A fresh app launch opens Train with
each tab on its first view and Meals on Log; reloading or switching tabs in the open app keeps your place."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8855
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
SHAPE = """(id => getRoutine(id).days.map(d => ({ n: d.name, ss: d.items.map(i => i.ss), ex: d.items.map(i => exName(i.ex)) })))"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("try{['tourDone','setupOffered','bgOffered'].forEach(k => localStorage.setItem('liftbook.' + k, '1'))}catch(e){}")
        for rid in ['bi-sapwood', 'bi-heartwood', 'bi-newt-4day']:
            days = await ev(SHAPE + f"('{rid}')")
            ok = True; bad = []
            for d in days:
                legs = 'Legs' in d['n']; solo = 2 if legs else 1; ss = d['ss']
                if any(ss[:solo]): ok = False; bad.append(d['n'] + ' solo')
                rest = ss[solo:]
                if rest and (rest[0] or not all(rest[k] == (k % 2 == 1) for k in range(len(rest) - (1 if len(rest) % 2 else 0)))): ok = False; bad.append(d['n'] + ' pairs')
                if len(rest) % 2 == 1 and len(rest) > 1 and not rest[-1]: ok = False; bad.append(d['n'] + ' odd one out')
                if legs and not ('Squat' in d['ex'][0] and 'Romanian' in d['ex'][1]): ok = False; bad.append(d['n'] + ' squat/RDL')
            check(rid + ': one exercise on its own, the rest in supersets; legs day squat and RDL on their own', ok, bad or [d['ss'] for d in days])
        bad = await ev("""getRoutine('bi-sapwood').days.flatMap(d => d.items.map((it, j) => it.ss && clash(d.items[j - 1], it) ? d.name + ': ' + exName(d.items[j - 1].ex) + ' + ' + exName(it.ex) : null).filter(Boolean))""")
        check('Sapwood: no superset pairs two lifts for the same main muscle', bad == [], bad)
        # An edited copy of Sapwood follows the new pairs once
        out = await ev("""(() => { const m = { settings: {}, routines: { 'bi-sapwood': { ...clone(getRoutine('bi-sapwood')), days: getRoutine('bi-sapwood').days.map(d => ({ ...d, items: d.items.map(i => ({ ...i, ss: false })) })) } } };
          const a = normalizeMeta(m); const again = normalizeMeta({ ...a, routines: { 'bi-sapwood': { ...a.routines['bi-sapwood'], days: a.routines['bi-sapwood'].days.map(d => ({ ...d, items: d.items.map(i => ({ ...i, ss: false })) })) } } });
          return [a.routines['bi-sapwood'].days[0].items.map(i => i.ss), a.settings.newtSS1, again.routines['bi-sapwood'].days[0].items.every(i => !i.ss)]; })()""")
        check('an edited copy of Sapwood gets the new supersets once', out[0][0] is False and out[0][2] is True and out[1] == 1 and out[2], out)
        # Fresh launch vs staying open
        await ev("UI.setTab('meals'); setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_timeout(1000)
        check('reloading the open app keeps your place', await ev("lsGet('tab')") == 'meals' and await ev("MEALS.mode") == 'recipes')
        await ev("UI.setTab('train'); TRAIN.mode = 'run'; lsSet('trainMode', 'run'); UI.setTab('stats'); lsSet('statsTab', 'photos'); UI.setTab('meals')"); await pg.wait_for_timeout(200)
        check('switching tabs keeps each tab’s view', await ev("MEALS.mode") == 'recipes' and await ev("TRAIN.mode") == 'run')
        await pg.close()
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto(f'http://localhost:{PORT}/'); await pg2.wait_for_timeout(1000)
        ev2 = pg2.evaluate
        check('a fresh launch opens Train', await pg2.locator('.tab.on').inner_text() == 'Train' and await ev2("TRAIN.mode") == 'train')
        check('...Meals opens on Log', await ev2("MEALS.mode") == 'log')
        check('...Progress on its first view', (await ev2("lsGet('statsTab')")) in (None, 'history'))
        check('...settings and choices are kept', await ev2("lsGet('tourDone')") == '1')
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
