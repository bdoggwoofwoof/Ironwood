"""Routine library: new programs show, library routines can be edited, reset, copied, removed and brought back."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8766
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        lib = pg.locator('.r-card')
        names = [await lib.nth(i).locator('h3').inner_text() for i in range(await lib.count())]
        await pg.locator('.topsw button', has_text='Plans').click(); await pg.wait_for_timeout(300)
        pnames = [await lib.nth(i).locator('h3').inner_text() for i in range(await lib.count())]
        check('12 routines and 16 plans (10 + 6 conditioning)', len(names) == 12 and len(pnames) == 16, (len(names), len(pnames)))
        check("4-Day Split first among plans; Efficient PPL is one plan", pnames[0].upper() == "NEWT'S 4-DAY SPLIT" and pnames[1].upper() == 'EFFICIENT PUSH/PULL/LEGS', pnames[:3])
        page = await pg.content()
        check('no source labels', not any(w in page for w in ('From RepCount', 'Ready to run', 'Your plan')))
        await pg.screenshot(path='shot-routines.png', full_page=True)

        # Edit a library routine: rename, drop the first exercise, save
        await pg.locator('.r-card', has_text='Upper / Lower').click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-routine-view.png', full_page=True)
        await pg.get_by_role('button', name='Edit').click(); await pg.wait_for_timeout(300)
        await pg.fill('#rt-name', 'My Upper Lower')
        await pg.get_by_role('button', name='Remove exercise').first.click()
        await pg.get_by_role('button', name='Save routine').click(); await pg.wait_for_timeout(300)
        first = await pg.locator('.r-items li').first.inner_text()
        check('edit saved', 'Bench Press' not in first and await pg.locator('.wo-title').inner_text() in ('My Upper Lower', 'MY UPPER LOWER'), first)
        check('edited routine marked', 'edited' in (await pg.locator('.eyebrow').first.inner_text()).lower())
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        tags = await pg.locator('.r-card .tag').all_inner_texts()
        check('plans still 16, one tagged Edited', await pg.locator('.r-card').count() == 16 and sum('EDITED' in t.upper() for t in tags) == 1, tags)

        # Reset
        await pg.locator('.r-card', has_text='My Upper Lower').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Reset').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Reset routine').click(); await pg.wait_for_timeout(300)
        check('reset restores original', 'Bench Press' in await pg.locator('.r-items li').first.inner_text())

        # Copy
        await pg.get_by_role('button', name='Copy').click(); await pg.wait_for_timeout(300)
        check('copy becomes your own plan', '(copy)' in (await pg.locator('.wo-title').inner_text()).lower())

        # Remove a library routine, then bring it back
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.r-card', has_text='Full Body 5×5').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Remove').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Remove routine').click(); await pg.wait_for_timeout(300)
        check('removed from library', await pg.locator('.r-card', has_text='Full Body 5×5').count() == 0)
        await pg.get_by_role('button', name='Bring back').click(); await pg.wait_for_timeout(300)
        check('brought back', await pg.locator('.r-card', has_text='Full Body 5×5').count() == 1)

        # Survives reload
        await pg.locator('.r-card', has_text="Newt's").click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Remove').click(); await pg.wait_for_timeout(200)
        await pg.get_by_role('button', name='Remove routine').click(); await pg.wait_for_timeout(800)
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        check('removal kept after reload', await pg.locator('.r-card', has_text="Newt's").count() == 0)

        # Start a new program's day
        await pg.locator('.r-card', has_text='Dumbbells Only').evaluate('e => e.click()'); await pg.wait_for_timeout(300)
        await pg.locator('.pill-btn', has_text='Start').first.evaluate('e => e.click()'); await pg.wait_for_timeout(500)
        check('workout starts from new program', await pg.locator('.set-row').count() > 0)
        kinds = await pg.evaluate("Object.values(BUILTIN_EX).filter(e => /dumbbell|goblet/i.test(e.name)).every(e => e.kind === 'dumbbell')")
        check('dumbbell exercises use dumbbell kind', kinds)

        # Notes on routine items, and during the workout
        await pg.evaluate("UI.setView(null)"); await pg.wait_for_timeout(200)
        await pg.evaluate("S.active = null; S.rerender()"); await pg.wait_for_timeout(200)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.r-card', has_text='Efficient Push/Pull/Legs').evaluate('e => e.click()'); await pg.wait_for_timeout(300)
        check('exercise note shows in routine', await pg.locator('.r-items .cue', has_text='elbows out').count() == 1)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.topsw button', has_text='Routines').click(); await pg.wait_for_timeout(200)
        await pg.locator('.r-card', has_text='Core 2').evaluate('e => e.click()'); await pg.wait_for_timeout(300)
        await pg.locator('.pill-btn', has_text='Start').first.evaluate('e => e.click()'); await pg.wait_for_timeout(500)
        check('exercise note shows during workout', await pg.locator('.slot', has_text='Plank Twists').locator('p', has_text='Each side').count() == 1)
        await pg.evaluate("S.active = null; S.rerender()"); await pg.wait_for_timeout(200)

        # By type view
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('tab', name='By type').click(); await pg.wait_for_timeout(300)
        secs = await pg.locator('.wsec-h h2').all_inner_texts()
        check('routine type sections', [s.title() for s in secs] == ['Full Body', 'Core', 'Mobility', 'Conditioning'], secs)
        await pg.locator('.topsw button', has_text='Plans').click(); await pg.wait_for_timeout(300)
        secs = await pg.locator('.wsec-h h2').all_inner_texts()
        check('plan type sections', [s.title() for s in secs] == ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Conditioning'], secs)
        check('sections start closed', await pg.locator('.wk-row').count() == 0)
        await pg.locator('.wsec-h', has_text='Push').first.click(); await pg.wait_for_timeout(200)
        push = await pg.locator('.wsec', has=pg.locator('h2', has_text='Push')).first.locator('.wk-row .t').all_inner_texts()
        check('Push holds push workouts', 'Push' in push and 'Push A' in push and 'Pull A' not in push, push)
        newt = await pg.evaluate("BUILTIN_ROUTINES[0].days.map(d => dayTags(d, BUILTIN_ROUTINES[0]).join('+'))")
        check('4-day split tags', newt == ['Push+Chest', 'Pull+Back', 'Push+Shoulders+Arms', 'Legs'], newt)
        await pg.screenshot(path='shot-bytype.png', full_page=True)
        await pg.get_by_role('button', name='Open all').click(); await pg.wait_for_timeout(200)
        n_all = await pg.locator('.wk-row').count()
        check('open all', n_all > 20, n_all)
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        check('view and open sections remembered', await pg.locator('.wk-row').count() == n_all)
        await pg.get_by_role('button', name='Close all').click(); await pg.wait_for_timeout(200)
        await pg.locator('.topsw button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.wsec-h', has_text='Conditioning').click(); await pg.wait_for_timeout(200)
        cond = await pg.locator('.wk-row .t').all_inner_texts()
        check('Conditioning holds the six conditioning workouts', len(cond) == 6 and set(cond) == {'Calisthenics Pyramid', 'Run & Swing Circuit', '400m Repeats + Calisthenics', 'Swim AMRAP', 'Burpee Grinder', '4-Mile Ruck + Calisthenics'}, cond)

        # Set a type by hand in the editor
        await pg.locator('.wk-row', has_text='Burpee Grinder').locator('.wk-main').click(); await pg.wait_for_timeout(300)
        await pg.get_by_role('button', name='Edit').click(); await pg.wait_for_timeout(300)
        await pg.locator('.ed-tags button', has_text='Full Body').click()
        await pg.get_by_role('button', name='Save routine').click(); await pg.wait_for_timeout(300)
        await pg.locator('.tabs button', has_text='Routines').click(); await pg.wait_for_timeout(300)
        await pg.locator('.wsec-h', has_text='Full Body').click(); await pg.wait_for_timeout(200)
        check('manual type moves workout', await pg.locator('.wsec', has=pg.locator('h2', has_text='Full Body')).locator('.wk-row', has_text='Burpee Grinder').count() == 1)
        await pg.get_by_role('tab', name='List').click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-routines.png', full_page=True)
        tags = await pg.evaluate("Object.fromEntries(allRoutines().flatMap(r => r.days.map(d => [r.name + ' / ' + d.name, dayTags(d, r).join(', ')])))")
        for k, v in tags.items(): print('   ', k, '->', v)
        check('no page errors', not errs, errs[:3])
        await b.close()

try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
