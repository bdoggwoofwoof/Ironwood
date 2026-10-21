import asyncio, json, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8766
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
R = []
def check(n, ok, d=''):
    R.append(ok); print(('PASS ' if ok else 'FAIL ') + n + (' - ' + str(d) if d != '' else ''))

SEED = """() => {
  const now = Date.now(), day = 864e5;
  const meta = { settings: { unit: 'lb', bar: 45, inc: 5, goal: 5, rest: 150 }, exercises: {}, routines: {}, exUnit: {}, exRest: {}, exCat: {},
    bw: [{ id: 'b1', d: '2026-10-01', w: 181, u: 'lb' }], dayMarks: { '2026-10-02': 'rest' }, challenges: {}, timers: [], deleted: [], updatedAt: now };
  const sessions = {};
  for (let i = 0; i < 3; i++) { const id = 's' + i; sessions[id] = { id, routineId: 'bi-newt-4day', routineName: "Newt's 4-Day Split", dayId: 'bi-newt-4day-d4', name: 'Day 4 - Legs (N/BJJ)',
    startedAt: now - (10 - i * 3) * day, endedAt: now - (10 - i * 3) * day + 3600e3, updatedAt: now, prs: [],
    items: [{ ex: 'b-squat', group: '', ss: false, target: { sets: 3, reps: '' }, note: '', sets: [{ w: 185 + i * 10, r: 5 }, { w: 185 + i * 10, r: 5 }] }] }; }
  localStorage.setItem('liftbook.v1', JSON.stringify({ meta, sessions, active: null, activeAt: 0, dirty: [] }));
}"""
ADD_PHOTO = """() => new Promise((res, rej) => {
  const c = document.createElement('canvas'); c.width = 60; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#4c8dff'; g.fillRect(0, 0, 60, 80);
  c.toBlob(blob => { const rq = indexedDB.open('liftbook-photos', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('photos', { keyPath: 'id' });
    rq.onsuccess = () => { const t = rq.result.transaction('photos', 'readwrite'); t.objectStore('photos').put({ id: 'ph1', date: '2026-10-05', pose: 'front', t: Date.now(), blob });
      t.oncomplete = () => { rq.result.close(); res(true); }; t.onerror = () => rej(t.error); }; }, 'image/jpeg', 0.8); })"""
COUNT_PHOTOS = """() => new Promise(res => { const rq = indexedDB.open('liftbook-photos', 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore('photos', { keyPath: 'id' });
  rq.onsuccess = () => { const t = rq.result.transaction('photos', 'readonly'); const r = t.objectStore('photos').getAll();
    r.onsuccess = () => res(r.result.map(p => ({ id: p.id, pose: p.pose, size: p.blob && p.blob.size, type: p.blob && p.blob.type }))); }; })"""

async def profile(pg):
    await pg.locator('.tab', has_text='Profile').click(); await pg.wait_for_timeout(300)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        # Phone A: has data and a photo; save both backups
        a = await b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
        pa = await a.new_page(); pa.on('pageerror', lambda e: errs.append(str(e)))
        await pa.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pa.goto(URL); await pa.evaluate(SEED); await pa.evaluate(ADD_PHOTO); await pa.reload(); await pa.wait_for_timeout(1000)
        await profile(pa)
        async with pa.expect_download() as dl: await pa.get_by_role('button', name='Save backup file').click()
        backup = await (await dl.value).path()
        await pa.get_by_role('button', name='Prepare photos backup').click(); await pa.wait_for_timeout(500)
        btn = pa.get_by_role('button', name='Save 1 photo')
        check('photos backup prepared', await btn.count() == 1)
        async with pa.expect_download() as dl2: await btn.click()
        d2 = await dl2.value; photos = await d2.path(); pj = json.load(open(photos))
        check('photos file has the photo', pj['app'] == 'liftbook-photos' and len(pj['photos']) == 1 and len(pj['photos'][0]['data']) > 100, d2.suggested_filename)

        # Phone B: fresh install; restore both
        c = await b.new_context(viewport={'width': 390, 'height': 844})
        pb = await c.new_page(); pb.on('pageerror', lambda e: errs.append(str(e)))
        await pb.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pb.goto(URL); await pb.wait_for_timeout(800); await profile(pb)
        await pb.get_by_role('button', name='Restore').click(); await pb.wait_for_timeout(300)
        await pb.set_input_files('#rs-file', backup); await pb.wait_for_timeout(300)
        await pb.locator('.sheet button.primary').click(); await pb.wait_for_timeout(600)
        st = await pb.evaluate("JSON.parse(localStorage.getItem('liftbook.v1'))")
        check('workouts restored', len(st['sessions']) == 3, len(st['sessions']))
        check('settings restored on a fresh install', st['meta']['settings']['goal'] == 5 and st['meta']['settings']['rest'] == 150, st['meta']['settings'].get('goal'))
        check('bodyweight and day marks restored', len(st['meta']['bw']) == 1 and st['meta']['dayMarks'].get('2026-10-02') == 'rest')
        await pb.locator('.tab', has_text='Train').click(); await pb.wait_for_timeout(200)
        await pb.locator('.topsw button', has_text='History').click(); await pb.wait_for_timeout(300)
        check('History shows restored workouts', await pb.locator('.log-item').count() == 3)
        await profile(pb)
        await pb.get_by_role('button', name='Restore').click(); await pb.wait_for_timeout(300)
        await pb.set_input_files('#rs-file', photos); await pb.wait_for_timeout(300)
        await pb.locator('.sheet button.primary').click(); await pb.wait_for_timeout(800)
        ph = await pb.evaluate(COUNT_PHOTOS)
        check('photo restored into this phone', len(ph) == 1 and ph[0]['size'] > 100 and ph[0]['type'] == 'image/jpeg', ph)
        # Restoring the same files again adds nothing
        await pb.get_by_role('button', name='Restore').click(); await pb.wait_for_timeout(300)
        await pb.set_input_files('#rs-file', backup); await pb.wait_for_timeout(300)
        await pb.locator('.sheet button.primary').click(); await pb.wait_for_timeout(500)
        st2 = await pb.evaluate("JSON.parse(localStorage.getItem('liftbook.v1'))")
        check('second restore adds no duplicates', len(st2['sessions']) == 3 and len(st2['meta']['bw']) == 1)

        # A damaged backup: bad entries are skipped and reported, good ones restored, and the app still opens afterwards
        bad = dict(json.load(open(backup)))
        bad['sessions'] = { 'ok1': { 'id': 'ok1', 'startedAt': 1700000000000, 'endedAt': 1700003600000, 'items': [{ 'ex': 'b-squat', 'sets': [{ 'w': 100, 'r': 5 }, { 'w': 'x', 'r': 5 }] }] },
                            'noTime': { 'id': 'noTime', 'items': [] }, 'noItems': { 'id': 'noItems', 'startedAt': 1700100000000 }, 'junk': 'nope', 'nul': None }
        badf = str(backup).replace('.json', '-bad.json'); json.dump(bad, open(badf, 'w'))
        await profile(pb); await pb.locator('button', has_text='Restore').first.click(); await pb.wait_for_timeout(300)
        await pb.set_input_files('#rs-file', badf); await pb.wait_for_timeout(300)
        await pb.locator('.sheet button.primary').click(); await pb.wait_for_timeout(600)
        toast = await pb.locator('.toast').inner_text() if await pb.locator('.toast').count() else ''
        st3 = await pb.evaluate("JSON.parse(localStorage.getItem('liftbook.v1'))")
        check('damaged entries skipped and reported', 'skipped' in toast and 'ok1' in st3['sessions'] and 'noItems' in st3['sessions'] and 'noTime' not in st3['sessions'] and 'junk' not in st3['sessions'], toast)
        check('bad set dropped from a good workout', len(st3['sessions']['ok1']['items'][0]['sets']) == 1)
        await pb.reload(); await pb.wait_for_timeout(1500)
        await pb.locator('.tab', has_text='Train').click(); await pb.locator('.topsw button', has_text='History').click(); await pb.wait_for_timeout(400)
        check('app and History open after a damaged restore', await pb.locator('.tabs').count() == 1 and await pb.locator('.log-item').count() >= 4, await pb.locator('.log-item').count())

        # Unreadable saved data: a recovery screen, a kept copy, and no overwrite
        # With the IndexedDB copy, damaged localStorage is recovered from it (and the damaged text kept)
        n_before = await pb.evaluate("sessionList().length")
        await pb.evaluate("localStorage.setItem('liftbook.v1', '{not json')"); await pb.reload(); await pb.wait_for_timeout(1500)
        check('damaged localStorage recovered from the IndexedDB copy', await pb.locator('.tabs').count() == 1 and await pb.evaluate("sessionList().length") == n_before and await pb.evaluate("Object.keys(localStorage).some(k => k.startsWith('liftbook.v1.corrupt-'))"), n_before)
        # Both copies unreadable: the recovery screen, as before
        await pb.evaluate("new Promise(r => { IDB.db && IDB.db.close(); const q = indexedDB.deleteDatabase('ironwood'); q.onsuccess = q.onerror = q.onblocked = () => r(); })")
        await pb.evaluate("localStorage.setItem('liftbook.v1', '{not json')"); await pb.reload(); await pb.wait_for_timeout(1500)
        keys = await pb.evaluate("Object.keys(localStorage).filter(k => k.startsWith('liftbook.v1.corrupt-'))")
        check('recovery screen with a kept copy', await pb.locator('h2', has_text='couldn’t be read').count() == 1 and len(keys) >= 1, keys)
        check('damaged data left untouched', await pb.evaluate("localStorage.getItem('liftbook.v1')") == '{not json')
        await pb.locator('button', has_text='Start fresh').click(); await pb.locator('button', has_text='Yes, start fresh').click(); await pb.wait_for_timeout(1500)
        check('start fresh opens the app', await pb.locator('.tabs').count() == 1)

        # Full storage is reported, not hidden
        await pb.evaluate("(() => { const o = localStorage.setItem.bind(localStorage); localStorage.setItem = (k, v) => { if (k === 'liftbook.v1') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return o(k, v); }; })()")
        await pb.evaluate("commit(st => { st.meta.settings.goal = 3; }, 'meta')"); await pb.wait_for_timeout(400)
        check('full localStorage: saves continue in IndexedDB, no false alarm', await pb.locator('.toast.bad').count() == 0 and await pb.evaluate("S.sync") != 'full' and await pb.evaluate("IDB.savedAt > 0 && !IDB.failed"))
        await pb.reload(); await pb.wait_for_timeout(1500)
        check('change made while localStorage was full survives a reload', await pb.evaluate("S.meta.settings.goal") == 3)
        await pb.evaluate("(() => { const o = localStorage.setItem.bind(localStorage); localStorage.setItem = (k, v) => { if (k === 'liftbook.v1') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return o(k, v); }; idbPut = () => Promise.reject(new Error('quota')); })()")
        await pb.evaluate("commit(st => { st.meta.settings.goal = 4; }, 'meta')"); await pb.wait_for_timeout(400)
        check('both full: storage warning shows', await pb.locator('.toast.bad').count() == 1 and await pb.evaluate("S.sync") == 'full')

        # Backup nudge: six older workouts and no backup yet
        await pb.reload(); await pb.wait_for_timeout(800)
        await pb.evaluate("""(() => { const now = Date.now(), day = 864e5; const d = JSON.parse(localStorage.getItem('liftbook.v1')) || { meta: null, sessions: {}, active: null, activeAt: 0, dirty: [] }; d.sessions = {};
          for (let i = 0; i < 6; i++) d.sessions['n' + i] = { id: 'n' + i, startedAt: now - (30 - i) * day, endedAt: now - (30 - i) * day + 3600e3, updatedAt: now, prs: [], items: [{ ex: 'b-squat', sets: [{ w: 100, r: 5 }] }] };
          d.at = Date.now() + 1e9; localStorage.setItem('liftbook.v1', JSON.stringify(d)); })()""")
        await pb.reload(); await pb.wait_for_timeout(1500); await pb.locator('.tab', has_text='Train').click(); await pb.locator('.topsw button', has_text='Train').click(); await pb.wait_for_timeout(300)
        check('backup nudge appears', await pb.locator('#backup-nudge').count() == 1)
        await pb.locator('#backup-nudge button', has_text='Later').click(); await pb.wait_for_timeout(200)
        check('nudge can be snoozed', await pb.locator('#backup-nudge').count() == 0)
        await pb.evaluate("localStorage.removeItem('liftbook.backupSnooze'); localStorage.setItem('liftbook.lastBackup', String(Date.now()))"); await pb.reload(); await pb.wait_for_timeout(1200)
        await profile(pb)
        check('last backup shown and nudge gone after a backup', 'today' in await pb.locator('#last-backup').inner_text() and await pb.locator('#backup-nudge').count() == 0)
        check('no page errors', not errs, errs[:3])
        await b.close()

try:
    asyncio.run(main())
finally:
    srv.terminate()
print(sum(R), 'of', len(R), 'checks passed')
