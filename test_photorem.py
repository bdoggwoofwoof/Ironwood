"""Progress photo reminders (Nov 23, Newt): before workouts (pop-up), after (summary card), on a day and time (pop-up while
the app is open, plus a calendar file with a weekly alert)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8934
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1'); localStorage.setItem('liftbook.setupOffered', '1') } catch (e) {}")
        await pg.goto(URL); await pg.wait_for_timeout(3500); ev = pg.evaluate
        check('off by default: no pop-up on open', await pg.locator('.sheet').count() == 0)
        await ev("UI.setTab('stats'); lsSet('statsTab', 'photos'); S.rerender()"); await pg.wait_for_timeout(600)
        check('Photos shows Photo reminders: Off', 'Off' in await pg.inner_text('#photo-rem'))
        await pg.click('#photo-rem'); await pg.wait_for_timeout(200)
        await pg.click('#pr-before'); await pg.wait_for_timeout(100)
        await pg.locator('.sheet .seg button', has_text='Every workout').click(); await pg.wait_for_timeout(100)
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        check('summary line reads before workouts', 'before workouts' in await pg.inner_text('#photo-rem'))
        await ev("startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0])"); await pg.wait_for_timeout(900)
        check('starting a workout pops up the reminder', await pg.locator('#pr-take').count() == 1 and 'PROGRESS PHOTOS FIRST' in (await pg.inner_text('.sheet')).upper())
        await pg.click('#pr-later'); await pg.wait_for_timeout(200)
        await ev("S.active = null; startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[1])"); await pg.wait_for_timeout(900)
        check('Not now: no second pop-up the same day', await pg.locator('#pr-take').count() == 0)
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), lastAsk: '' } }, 'meta'); S.active = null; startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[1])"); await pg.wait_for_timeout(900)
        await pg.click('#pr-take'); await pg.wait_for_timeout(500)
        check('Take photos opens the check-in, workout still running', await ev("lsGet('statsTab')") == 'photos' and 'CHECK' in (await pg.inner_text('.sheet')).upper() and await ev("!!S.active"))
        await ev("closeSheet()")
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), every: 'week', lastAsk: '', last: '' } }, 'meta')")
        check('first workout of the week: due', await ev("prDue('before')"))
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), lastAsk: ymd(addDays(new Date(), 0)) } }, 'meta')")
        check('already asked this week: not due again this week', not await ev("(() => { const n = new Date(); n.setHours(23, 59); return prDue('before', addDays(new Date(), 0)) })()"))
        # after
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), before: false, after: true, every: 'each', lastAsk: '', last: '' } }, 'meta'); S.active = null; startWorkout(getRoutine('bi-sapwood'), getRoutine('bi-sapwood').days[0])"); await pg.wait_for_timeout(700)
        await ev("const it = S.active.items[0]; it.sets[0].w = '100'; it.sets[0].r = '8'; completeSet(it, it.sets[0]); S.rest = null; finishWorkout()"); await pg.wait_for_timeout(600)
        check('after a workout: a card on the summary', await pg.locator('#pr-after').count() == 1)
        await pg.click('#pr-after-later'); await pg.wait_for_timeout(200)
        check('Not now hides the card', await pg.locator('#pr-after').count() == 0)
        await ev("closeSheet()")
        # weekly
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), after: false, weekly: true, dow: new Date().getDay(), time: '00:00', lastAsk: '', last: '' } }, 'meta'); PH.list = []")
        await ev("prMaybe('weekly')"); await pg.wait_for_timeout(400)
        check('weekly: pops up at or after the day and time', 'PROGRESS PHOTO DAY' in (await pg.inner_text('.sheet')).upper() if await pg.locator('.sheet').count() else False)
        await pg.click('#pr-later'); await pg.wait_for_timeout(200)
        await ev("prMaybe('weekly')"); await pg.wait_for_timeout(300)
        check('weekly: dismissed until next week', await pg.locator('#pr-take').count() == 0)
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), lastAsk: '', time: '23:59' } }, 'meta')")
        check('weekly: not before the time', not await ev("(() => { const n = new Date(); n.setHours(12, 0); return prDue('weekly', n); })()"))
        await ev("commit(st => { st.meta.settings.photoRem = { ...prSet(), time: '00:00' } }, 'meta'); PH.list = [{ id: 'x', date: ymd(new Date()), pose: 'front', t: Date.now() }]")
        check('weekly: photos already taken that day count', not await ev("prDue('weekly')"))
        ics = await ev("prIcs()")
        day = await ev("['SU','MO','TU','WE','TH','FR','SA'][new Date().getDay()]")
        check('calendar file repeats weekly on that day with an alert', f'RRULE:FREQ=WEEKLY;BYDAY={day}' in ics and 'BEGIN:VALARM' in ics and 'TRIGGER:PT0M' in ics, ics[:200])
        check('no page errors', not errs, errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
