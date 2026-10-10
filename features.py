"""Apply Oct 10 overnight changes to the Liftbook artifact source (source.html) -> app.html.

- Name: Ironwood everywhere people see it (storage keys and backup label unchanged).
- Photos backup: Profile -> Backup -> "Prepare photos backup", then save the file.
- Routine library: seven more ready-made programs; library routines can be edited (saved over
  the original, with Reset), copied, or removed (and brought back).
- Restore: accepts workout backups and photo backups; reads big files without the text box;
  a backup restored into an empty app brings back everything (settings, bodyweight,
  challenges, timers, day marks); into a used app it adds whatever is missing.
"""
import re, sys

src = open('source.html', encoding='utf8').read()


def swap(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f'Expected {count} of {old[:80]!r}, found {n}')
    src = src.replace(old, new)


# 1. Name
src = src.replace('Liftbook', 'Ironwood')
swap("filename: 'liftbook-backup-'", "filename: 'ironwood-backup-'")
swap("'liftbook-phrases.csv'", "'ironwood-phrases.csv'")
swap("Saved liftbook-phrases.csv", "Saved ironwood-phrases.csv")
swap("filename: 'liftbook-' + p.pose", "filename: 'ironwood-' + p.pose")

# 2. Photo backup helpers, placed right after phDelete
anchor = 'async function phDelete(id) {'
i = src.index(anchor)
j = src.index('\n', i)
PHOTO_FNS = r'''
/* Photo backups: a separate file (photos are large), restored by Profile -> Restore. */
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const b64ToBlob = (s, type) => { const bin = atob(s); const a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); return new Blob([a], { type: type || 'image/jpeg' }); };
async function photoBackup() {
  const all = (await pdbTx('readonly', st => st.getAll())) || []; const photos = [];
  for (const p of all) { if (!p || !p.blob) continue; const { blob, ...rest } = p; photos.push({ ...rest, type: blob.type || 'image/jpeg', data: await blobToB64(blob) }); }
  photos.sort((a, b) => (a.t || 0) - (b.t || 0));
  return { app: 'liftbook-photos', version: 1, exportedAt: new Date().toISOString(), photos };
}
async function photoRestore(d) {
  const have = new Set(); try { ((await pdbTx('readonly', st => st.getAllKeys())) || []).forEach(k => have.add(k)); } catch (e) {}
  let n = 0;
  for (const p of (d.photos || [])) {
    if (!p || !p.id || !p.data || have.has(p.id)) continue;
    const { data, type, ...rest } = p;
    await pdbTx('readwrite', st => st.put({ ...rest, blob: b64ToBlob(data, type) })); n++;
  }
  PH.urls.forEach(u => URL.revokeObjectURL(u)); PH.urls.clear(); PH.list = null;
  return n;
}
/* Restore merge: an empty app takes the whole backup; a used app gains only what it lacks. */
function restoreInto(st, d) {
  const m = normalizeMeta(d.meta); const keys = ['meta'];
  const fresh = !Object.keys(st.sessions).length && !Object.keys(st.meta.routines).length && !Object.keys(st.meta.exercises).length;
  if (fresh) {
    const deleted = [...new Set([...(m.deleted || []), ...(st.meta.deleted || [])])];
    st.meta = { ...m, deleted };
  } else {
    Object.assign(st.meta.exercises, m.exercises || {});
    for (const [k, r] of Object.entries(m.routines || {})) if (!st.meta.routines[k]) st.meta.routines[k] = r;
    for (const f of ['exUnit', 'exRest', 'exCat', 'dayMarks', 'challenges']) { st.meta[f] = st.meta[f] || {}; for (const [k, v] of Object.entries(m[f] || {})) if (!(k in st.meta[f])) st.meta[f][k] = v; }
    const bwDays = new Set((st.meta.bw || []).map(x => x.d)); st.meta.bw = (st.meta.bw || []).concat((m.bw || []).filter(x => x && !bwDays.has(x.d)));
    const tIds = new Set((st.meta.timers || []).map(x => x.id)); st.meta.timers = (st.meta.timers || []).concat((m.timers || []).filter(x => x && !tIds.has(x.id)));
  }
  let added = 0;
  for (const [k, s] of Object.entries(d.sessions || {})) if (!st.sessions[k] && !(st.meta.deleted || []).includes(k)) { st.sessions[k] = s; keys.push('s_' + k); added++; }
  return { keys, added, fresh };
}'''
src = src[:j + 1] + PHOTO_FNS.lstrip('\n') + '\n' + src[j + 1:]

# 3. Profile: photo backup button (two steps, so the save happens right on the tap)
swap("  const copyBackup = async () => {",
     r'''  const [phb, setPhb] = useState(null);
  const preparePhotos = async () => { setMsg('Gathering photos…'); try { const d = await photoBackup(); if (!d.photos.length) { setMsg('No progress photos to back up yet.'); return; } setPhb(d); setMsg(''); } catch (e) { setMsg('Couldn’t read the photos on this device.'); } };
  const savePhotos = async () => {
    const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null; const n = phb.photos.length;
    if (!dl) { setMsg('Saving files isn’t available here.'); return; }
    try { await dl.save({ filename: 'ironwood-photos-' + ymd(new Date()) + '.json', data: new Blob([JSON.stringify(phb)], { type: 'application/json' }) }); setMsg(n + ' photo' + (n === 1 ? '' : 's') + ' saved. Restore this file in Ironwood to bring them back.'); setPhb(null); }
    catch (e) { setMsg(e && e.code === 'declined' ? 'Photos backup not saved.' : 'Could not save the file here.'); }
  };
  const copyBackup = async () => {''')
swap('''<button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>''',
     '''<button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>
      <div class="row wrap">${phb ? html`<button class="btn primary" onClick=${savePhotos}>Save ${phb.photos.length} photo${phb.photos.length === 1 ? '' : 's'}</button>` : html`<button class="btn" onClick=${preparePhotos}>Prepare photos backup</button>`}</div>
      <p class="note">The backup file has workouts, routines and settings. Progress photos are large, so they go in their own file.</p>''')

# 4. Restore sheet: either backup type, big files straight from the file picker
start = src.index('function RestoreSheet() {')
end = src.index('function ConfirmSheet(', start)
RESTORE = r'''function RestoreSheet() {
  const [text, setText] = useState(''); const [file, setFile] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const onFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; setErr('');
    const rd = new FileReader(); rd.onload = () => { const t = String(rd.result || ''); if (t.length > 200000) { setFile({ name: f.name, text: t }); setText(''); } else { setFile(null); setText(t); } }; rd.readAsText(f); };
  const restore = async () => {
    let d; try { d = JSON.parse(file ? file.text : text); } catch (e) { setErr('That isn’t an Ironwood backup. Choose the .json file or paste the full backup text.'); return; }
    if (d && d.app === 'liftbook-photos') {
      setBusy(true); try { const n = await photoRestore(d); closeSheet(); showToast({ kind: 'info', text: n ? n + ' photo' + (n === 1 ? '' : 's') + ' restored' : 'Those photos are already here' }); }
      catch (e) { setErr('Couldn’t save the photos on this device.'); } finally { setBusy(false); } return;
    }
    if (!d || d.app !== 'liftbook' || !d.meta) { setErr('That file isn’t an Ironwood backup.'); return; }
    let r; commit(st => { r = restoreInto(st, d); }, 'meta');
    schedule(r.keys); S.ver++; applyDisplay && applyDisplay(); S.rerender(); closeSheet();
    showToast({ kind: 'info', text: r.fresh ? 'Backup restored' : r.added + ' workout' + (r.added === 1 ? '' : 's') + ' added' });
  };
  return html`<${Sheet} label="Restore backup"><h2>Restore a backup</h2><p class="note" style="margin-bottom:10px">Choose a workout backup or a photos backup. On a fresh install this brings back everything; otherwise it adds what's missing and never overwrites what's here.</p>
    <div class="stack"><label class="btn" for="rs-file">${file ? 'Chosen: ' + file.name : 'Choose backup file'}</label><input id="rs-file" type="file" accept=".json,application/json" hidden onChange=${onFile}/>
      ${file ? null : html`<textarea class="field" id="rs-text" placeholder="…or paste the backup text" value=${text} onInput=${e => { setText(e.target.value); setErr(''); }}></textarea>`}
      ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
      <button class="btn primary wide" disabled=${busy || !(file || text.trim())} onClick=${restore}>${busy ? 'Restoring…' : 'Restore'}</button></div><//>`;
}
'''
src = src[:start] + RESTORE + src[end:]

# 5. First launch: offer Restore while there's nothing logged yet (hidden after a workout or a tap on "Not now")
swap('<p class="small faint" style="margin-top:8px">Tap a day to mark rest, sick, injured or break.</p>',
     '''<p class="small faint" style="margin-top:8px">Tap a day to mark rest, sick, injured or break.</p>
    ${window.claude && window.claude.standalone && !Object.keys(S.sessions).length && !Object.keys(S.meta.routines).length && lsGet('restoreHint') !== 'off' ? html`<div class="card stack" style="margin-top:14px" id="restore-hint">
      <div style="font-weight:700">Moving from another phone or the Claude version?</div>
      <p class="note">Restore your backup file to bring back your workouts, routines and settings. Restore a photos backup the same way.</p>
      <div class="row"><button class="btn primary" onClick=${() => openSheet({ type: 'restore' })}>Restore a backup</button><button class="btn text" onClick=${() => { lsSet('restoreHint', 'off'); S.rerender(); }}>Not now</button></div></div>` : null}''')

# 6. Routine library: more ready-made programs, and library routines can be edited or removed.
#    An edited library routine is saved under the same id (with base: id), so it keeps its workout
#    history and "next up" order. Removed ones are listed in meta.hidden and can be brought back.
LIB = r"""
const LIB_PROGRAMS = [
  ['bi-5x5', 'Full Body 5×5', 'Beginner · 3 days a week', 'Alternate A and B, three days a week with a rest day between. Start lighter than you think. Each time you get all 25 reps, add 5 lb next session (10 lb on deadlift). If you miss the same weight three sessions running, drop it about 10% and build back up.', `Workout A
5x5 Squat
5x5 Bench Press
5x5 Bent-Over Barbell Rows
Workout B
5x5 Squat
5x5 Overhead Barbell Press
1x5 Deadlift`],
  ['bi-tiered', 'Tiered Linear 4-Day', 'Beginner · 3–4 days a week', 'The three-tier method (the GZCLP style): T1 is the heavy main lift, T2 the same pattern lighter for volume, T3 an accessory. Make the last set of T1 and T3 as many reps as you can. Add weight whenever you get every rep. When T1 stalls, edit it from 5×3 to 6×2, then 10×1; when T2 stalls, go 3×10 → 3×8 → 3×6.', `Day 1 - Squat / Bench
5x3 Squat
3x10 Bench Press
3x15 Lat Pulldown
Day 2 - Press / Deadlift
5x3 Overhead Barbell Press
3x10 Deadlift
3x15 Dumbbell Row
Day 3 - Bench / Squat
5x3 Bench Press
3x10 Squat
3x15 Lat Pulldown
Day 4 - Deadlift / Press
5x3 Deadlift
3x10 Overhead Barbell Press
3x15 Dumbbell Row`],
  ['bi-fb3', 'Full Body 3-Day', 'Beginner · 3 days a week', 'Three different full-body days with a rest day between. Add reps until every set reaches the top of the range, then add weight and start again at the bottom.', `Day 1 - Full Body A
3x6-8 Squat
3x6-8 Bench Press
3x8-10 Bent-Over Barbell Rows
3x10-12 Leg Curls
3x10-15 Lateral Raises
3x10-15 Cable Crunch
Day 2 - Full Body B
3x5 Deadlift
3x8-10 Overhead Barbell Press
3x8-12 Lat Pulldown
3x10-12 Leg Press
3x10-12 Barbell Curl
3x10-12 Tricep Pushdowns
Day 3 - Full Body C
3x10-12 Goblet Squat
3x8-10 Incline Dumbbell Press
3x8-12 Seated Cable Row
3x8-10 Romanian Deadlift
3x12-15 Face Pulls
3x10-15 Calf Raises`],
  ['bi-db3', 'Dumbbells Only 3-Day', 'Home gym · 3 days a week', 'Needs a pair of dumbbells and a bench (presses work on the floor too). Pick a weight you can lift for the low end of the range, and move up once every set reaches the top.', `Day 1 - Full Body A
3x8-12 Goblet Squat
3x8-12 Dumbbell Bench Press
3x8-12 Dumbbell Row
3x8-12 Dumbbell Romanian Deadlift
3x10-15 Lateral Raises
3x10-15 Hammer Curls
Day 2 - Full Body B
3x8-12 Dumbbell Split Squat
3x8-12 Dumbbell Shoulder Press
3x10-12 Dumbbell Pullover
3x10-15 Dumbbell Hip Thrust
3x10-15 Dumbbell Overhead Tricep Extension
3x10-15 Dumbbell Curl
Day 3 - Full Body C
3x8-12 Dumbbell Step-Up
3x8-12 Incline Dumbbell Press
3x8-12 Dumbbell Row
3x8-12 Dumbbell Romanian Deadlift
3x12-15 Dumbbell Rear Delt Fly
3x10-20 Push-Up`],
  ['bi-ul4', 'Upper / Lower 4-Day', 'Intermediate · 4 days a week', 'A heavy upper and lower day early in the week, then a volume upper and lower day. On heavy days add weight once you reach the top of the range; on volume days keep the reps smooth and controlled.', `Day 1 - Upper Heavy
4x3-5 Bench Press
4x3-5 Bent-Over Barbell Rows
3x5-8 Overhead Barbell Press
3x6-10 Lat Pulldown
3x6-10 Barbell Curl
3x6-10 Skull Crushers
Day 2 - Lower Heavy
4x3-5 Squat
3x3-5 Deadlift
3x10-15 Leg Press
3x6-10 Leg Curls
4x6-10 Calf Raises
Day 3 - Upper Volume
4x8-12 Incline Dumbbell Press
4x8-12 Cable Fly
4x8-12 Seated Cable Row
4x8-12 Dumbbell Row
4x10-15 Lateral Raises
4x8-12 Hammer Curls
4x8-12 Tricep Pushdowns
Day 4 - Lower Volume
4x8-12 Front Squat
3x8-12 Bulgarian Split Squat
3x10-15 Leg Extension
3x10-15 Leg Curls
4x10-15 Calf Raises`],
  ['bi-ppl6', 'Push / Pull / Legs', 'Intermediate · 6 days a week', 'Pull, push, legs, then the B versions, then a rest day. Make the last set of the 5×5 and the 1×5 as many reps as you can. Main lifts go up 5 lb a session; accessories go up once every set reaches the top of the range.', `Day 1 - Pull A
1x5 Deadlift
3x8-12 Lat Pulldown
3x8-12 Seated Cable Row
5x15-20 Face Pulls
4x8-12 Hammer Curls
4x8-12 Barbell Curl
Day 2 - Push A
5x5 Bench Press
3x8-12 Overhead Barbell Press
3x8-12 Incline Dumbbell Press
3x8-12 Tricep Pushdowns
3x8-12 Overhead Cable Tricep Extension
3x15-20 Lateral Raises
Day 3 - Legs A
3x5 Squat
3x8-12 Romanian Deadlift
3x8-12 Leg Press
3x8-12 Leg Curls
5x8-12 Calf Raises
Day 4 - Pull B
5x5 Bent-Over Barbell Rows
3x8-12 Pull-Up
3x8-12 Seated Cable Row
5x15-20 Face Pulls
4x8-12 Hammer Curls
4x8-12 Barbell Curl
Day 5 - Push B
5x5 Overhead Barbell Press
3x8-12 Bench Press
3x8-12 Incline Dumbbell Press
3x8-12 Tricep Pushdowns
3x8-12 Overhead Cable Tricep Extension
3x15-20 Lateral Raises
Day 6 - Legs B
3x5 Squat
3x8-12 Romanian Deadlift
3x8-12 Leg Press
3x8-12 Leg Curls
5x8-12 Calf Raises`],
  ['bi-split5', '5-Day Body-Part Split', 'Intermediate · 5 days a week', 'One muscle group a day with plenty of sets for each. Add weight once every set reaches the top of the range.', `Day 1 - Chest
4x6-10 Bench Press
3x8-12 Incline Dumbbell Press
3x10-12 Machine Chest Press
3x10-15 Cable Fly
Day 2 - Back
3x5 Deadlift
3x6-10 Pull-Up
3x10-12 Lat Pulldown
3x10-12 Seated Cable Row
3x15-20 Face Pulls
Day 3 - Shoulders
4x6-10 Overhead Barbell Press
4x12-15 Lateral Raises
3x12-15 Dumbbell Rear Delt Fly
3x10-15 Barbell Shrugs
Day 4 - Legs
4x6-10 Squat
3x8-12 Romanian Deadlift
3x10-15 Leg Press
3x10-15 Leg Extension
3x10-15 Leg Curls
4x10-15 Calf Raises
Day 5 - Arms
3x8-12 Barbell Curl
3x8-12 Skull Crushers
3x10-15 Hammer Curls
3x10-15 Tricep Pushdowns
3x12-15 Cable Curl
3x12-15 Overhead Cable Tricep Extension`],
];
const BUILTIN_ROUTINES = [
  Object.assign(builtinRoutine('bi-newt-4day', "Newt's 4-Day Split", 'Your plan from RepCount. Lines marked "x" are supersets with the exercise above.', NEWT_TEXT), { meta: 'Your plan · 4 days a week' }),
  ...LIB_PROGRAMS.map(([id, name, meta, note, text]) => Object.assign(builtinRoutine(id, name, note, text), { meta })),
];
for (const e of Object.values(BUILTIN_EX)) if (/\b(dumbbell|goblet)\b/i.test(e.name)) e.kind = 'dumbbell';
"""
swap("""const BUILTIN_ROUTINES = [
  builtinRoutine('bi-newt-4day', "Newt's 4-Day Split", 'Your plan from RepCount. Lines marked "x" are supersets with the exercise above.', NEWT_TEXT),
];""", LIB.strip())

swap("deleted: [], updatedAt: 0 });", "deleted: [], hidden: [], updatedAt: 0 });")
swap("deleted: m.deleted || [] };", "deleted: m.deleted || [], hidden: m.hidden || [] };")

swap("const allRoutines = () => [...Object.values(S.meta.routines).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), ...BUILTIN_ROUTINES];\nconst getRoutine = id => S.meta.routines[id] || BUILTIN_ROUTINES.find(r => r.id === id) || null;",
r"""const isHidden = id => (S.meta.hidden || []).includes(id);
const libBase = id => BUILTIN_ROUTINES.find(r => r.id === id) || null;
const myRoutines = () => Object.values(S.meta.routines).filter(r => !r.base).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const libRoutines = () => BUILTIN_ROUTINES.filter(r => !isHidden(r.id)).map(r => S.meta.routines[r.id] || r);
const allRoutines = () => [...myRoutines(), ...libRoutines()];
const getRoutine = id => isHidden(id) ? null : (S.meta.routines[id] || libBase(id));""")

start = src.index('function RoutinesScreen({ view }) {')
end = src.index('function RoutineEditor({ view }) {', start)
SCREENS = r"""function RoutinesScreen({ view }) {
  if (view && view.type === 'routine') return html`<${RoutineView} id=${view.id}/>`;
  if (view && view.type === 'edit') return html`<${RoutineEditor} view=${view}/>`;
  const mine = myRoutines(); const hidden = (S.meta.hidden || []).filter(libBase);
  const card = r => html`<button key=${r.id} class="r-card" onClick=${() => UI.setView({ type: 'routine', id: r.id })}>
    <span class="tag">${r.base ? 'Edited' + (r.meta ? ' · ' + r.meta : '') : r.source === 'builtin' ? (r.meta || 'Built in') : r.source === 'imported' ? 'Imported' : 'Yours'}</span><h3>${r.name}</h3>
    <span class="days">${r.days.length} day${r.days.length === 1 ? '' : 's'} · ${r.days.map(d => d.name.replace(/\s*\(.*\)$/, '').replace(/^Day\s*\d+\s*[-–]\s*/, '')).join(', ')}</span></button>`;
  return html`<div>
    <div class="section-h"><h2>Your routines</h2></div>
    <div class="stack">${mine.length ? mine.map(card) : html`<div class="card note">Routines you build, copy, or import live here. Library routines can be edited or removed too.</div>`}
      <div class="row"><button class="btn primary" style="flex:1" onClick=${() => UI.setView({ type: 'edit', draft: { id: uid('r'), name: '', source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: 'Day 1', items: [] }] }, isNew: true })}>${I.plus} New routine</button>
        <button class="btn" style="flex:1" onClick=${() => openSheet({ type: 'import' })}>Import</button></div></div>
    <div class="section-h"><h2>Library</h2><span class="aside">Ready to run</span></div>
    <div class="stack">${libRoutines().map(card)}
      ${hidden.length ? html`<button class="btn text wide" onClick=${() => commit(st => { st.meta.hidden = []; }, 'meta')}>Bring back ${hidden.length} removed routine${hidden.length === 1 ? '' : 's'}</button>` : null}</div>
  </div>`;
}
function RoutineView({ id }) {
  const r = getRoutine(id); if (!r) return html`<div class="empty"><h3>Routine not found</h3></div>`;
  const lib = !!libBase(r.id); const builtin = r.source === 'builtin';
  const copy = () => { const c = clone(r); delete c.base; delete c.meta; c.id = uid('r'); c.source = 'mine'; c.name = r.name + ' (copy)'; c.createdAt = Date.now(); c.days.forEach(d => { d.id = uid('d'); d.items.forEach(i => { i.id = uid('i'); }); });
    commit(st => { st.meta.routines[c.id] = c; }, 'meta'); UI.setView({ type: 'routine', id: c.id }); };
  const edit = () => UI.setView({ type: 'edit', draft: builtin ? { ...clone(r), source: 'mine', base: r.id, createdAt: Date.now() } : clone(r) });
  const reset = () => openSheet({ type: 'confirm', title: 'Reset ' + r.name + '?', body: 'Your changes to this routine are undone. Logged workouts stay in your history.', ok: 'Reset routine', danger: true, onOk: () => { commit(st => { delete st.meta.routines[r.id]; }, 'meta'); closeSheet(); } });
  const del = () => openSheet({ type: 'confirm', title: (lib ? 'Remove ' : 'Delete ') + r.name + '?', body: lib ? 'It leaves your library. You can bring it back at the bottom of Routines. Logged workouts stay in your history.' : 'Logged workouts stay in your history.', ok: lib ? 'Remove routine' : 'Delete routine', danger: true,
    onOk: () => { commit(st => { delete st.meta.routines[r.id]; if (lib) st.meta.hidden = [...new Set([...(st.meta.hidden || []), r.id])]; }, 'meta'); closeSheet(); UI.setView(null); } });
  return html`<div>
    <div class="eyebrow" style="margin-top:6px">${builtin ? 'Library routine' : r.base ? 'Library routine · edited' : 'Your routine'}${r.meta ? ' · ' + r.meta : ''}</div>
    <h2 class="wo-title" style="margin:2px 0 6px">${r.name}</h2>
    ${r.note ? html`<p class="note">${r.note}</p>` : null}
    <div class="row wrap" style="margin:14px 0 4px">
      <button class="btn" onClick=${edit}>${I.edit} Edit</button>
      <button class="btn" onClick=${copy}>${I.copy} Copy</button>
      ${r.base ? html`<button class="btn text" onClick=${reset}>Reset</button>` : null}
      <button class="btn text danger" onClick=${del}>${lib ? 'Remove' : 'Delete'}</button>
    </div>
    <div class="stack" style="margin-top:10px">${r.days.map(d => html`<div key=${d.id} class="r-day">
      <div class="row"><h3 style="flex:1">${d.name}</h3><button class="pill-btn accent" onClick=${() => startWorkout(r, d)}>Start</button></div>
      <ul class="r-items">${d.items.map(it => html`<li key=${it.id} class=${it.ss ? 'ssi' : ''}><span class="sx num">${it.sets}×${it.reps ? it.reps : ''}</span><span>${exName(it.ex)}</span>${groupChip(it.group)}</li>`)}</ul></div>`)}</div>
  </div>`;
}
"""
src = src[:start] + SCREENS + src[end:]
swap("This change applies to today. Copy the routine to make it permanent.", "This change applies to today. Edit the routine to make it permanent.")

for need in ['function applyDisplay', 'function showToast']:
    if need not in src:
        sys.exit('missing ' + need)
open('app.html', 'w', encoding='utf8').write(src)
print('app.html written', len(src.encode()) // 1024, 'KB')
