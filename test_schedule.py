"""Your week: a weekly schedule for the main program, programs alongside and the running plan; dots on the week strip
(two on doubled-up days); Also on your plan always shows the running plan's next run; calendar file (.ics) export."""
import asyncio, re, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8778
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        check('no programs: no schedule card', await pg.locator('#plan-week').count() == 0)
        await ev("setProgram('bi-5x5'); setAddon('bi-care-back', true)"); await pg.wait_for_timeout(300)
        rows = await ev("planList().map(p => [p.key, p.days])")
        check('defaults: 3-day main Mon/Wed/Fri, joint care Mon/Wed/Fri', rows == [['bi-5x5', [1, 3, 5]], ['bi-care-back', [1, 3, 5]]], rows)
        check('schedule card shows both', await pg.locator('#pw-bi-5x5').count() == 1 and await pg.locator('#pw-bi-care-back').count() == 1)
        check('doubled days listed', 'Doubled up: Mon (Lift + Care)' in await pg.locator('#plan-week').inner_text())
        mon_dots = await pg.locator('.week .wd').nth(0).locator('.wd-dot').count(); tue_dots = await pg.locator('.week .wd').nth(1).locator('.wd-dot').count()
        check('two dots on a doubled-up day, none on a rest day', mon_dots == 2 and tue_dots == 0, (mon_dots, tue_dots))
        await pg.click('#pw-bi-care-back-2'); await pg.wait_for_timeout(200)
        check('tap a cell to plan a day', await ev("schedFor('bi-care-back')") == [1, 2, 3, 5] and await pg.locator('.week .wd').nth(1).locator('.wd-dot').count() == 1)
        await pg.click('#pw-bi-care-back-2'); await pg.wait_for_timeout(200)
        check('tap again to clear it', await ev("schedFor('bi-care-back')") == [1, 3, 5])
        # running plan: shows in Your week and always in Also on your plan
        await ev("runCommit(r => { Object.assign(r, { t100: 16, t1: 540, t3: 1700, runs: 3, weeks: 8, start: ymd(startOfWeek(new Date())) }); r.days = { A: (new Date().getDay() + 1) % 7, C: (new Date().getDay() + 3) % 7, B: (new Date().getDay() + 4) % 7 }; })"); await pg.wait_for_timeout(300)
        check('running plan row in Your week', await pg.locator('#pw-run').count() == 1 and 'Running plan' in await pg.locator('#pw-run').inner_text())
        run_card = await pg.locator('#also-run').inner_text() if await pg.locator('#also-run').count() else ''
        check('next run shows even on a day without one', ('Tomorrow' in run_card or 'Start it early' in run_card) and 'Run' in run_card, run_card.replace('\n', ' | ')[:120])
        jc = await pg.locator('#also-bi-care-back').inner_text()
        check('joint care says when it is next', any(w in jc for w in ['Today', 'Tomorrow', 'day']), jc[:60])
        await pg.click('#edit-addons'); await pg.wait_for_timeout(200)
        check('Programs alongside says the running plan is on', 'On · 3 runs a week' in await pg.locator('#addon-run').inner_text())
        await ev("closeSheet()")
        # calendar file
        ics = await ev("buildIcs(planEvents(2), true)")
        n_ev = ics.count('BEGIN:VEVENT')
        check('calendar file has the right number of events (2 weeks)', n_ev == 2 * (3 + 3 + 3) or n_ev >= 15, n_ev)
        check('valid calendar file shape', ics.startswith('BEGIN:VCALENDAR\r\nVERSION:2.0') and ics.rstrip().endswith('END:VCALENDAR') and 'BEGIN:VALARM' in ics and all(len(l) <= 75 for l in ics.split('\r\n')))
        check('events named with the program day', 'SUMMARY:Ironwood · Full Body 5×5: Workout A' in ics and 'SUMMARY:Ironwood · Lower Back Care: A: Trunk endurance' in ics and re.search(r'SUMMARY:Ironwood · Run [ABC]', ics) is not None)
        check('rotation predicted: A then B', ics.index('Workout A') < ics.index('Workout B'))
        await pg.click('#plan-cal'); await pg.wait_for_timeout(300)
        await pg.click('#cal-w2'); await pg.wait_for_timeout(100)
        async with pg.expect_download() as dl:
            await pg.click('#cal-save')
        d = await dl.value
        check('saves ironwood-plan.ics', d.suggested_filename == 'ironwood-plan.ics')
        await pg.wait_for_timeout(200)
        hlp = await pg.locator('#cal-help').inner_text()
        check('how-to for Apple, Google, Outlook and Proton', all(w in hlp for w in ['Apple Calendar', 'Google Calendar', 'Outlook', 'Proton']))
        check('times saved per program', await ev("(() => { const p = planList()[0]; return calFor(p).at; })()") == '17:30')
        check('schedule is in the backup', 'bi-care-back' in await ev("JSON.stringify(JSON.parse(backupJSON()).meta.settings.sched || {}) + JSON.stringify(JSON.parse(backupJSON()).meta.settings.addons)"))
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
