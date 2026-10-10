"""Apply Oct 10 overnight changes to the Liftbook artifact source (source.html) -> app.html.

- Name: Ironwood everywhere people see it (storage keys and backup label unchanged).
- Photos backup: Profile -> Backup -> "Prepare photos backup", then save the file.
- Routine library: Newt's 13 RepCount routines (with exercise notes) and seven ready-made programs;
  List / By type views, with workout-type tags (set in the editor or automatic) and collapsible sections; library routines can be edited (saved over
  the original, with Reset), copied, or removed (and brought back).
- Train / History (Log under Train), program picker with Self-log, tips you can hide, Help (tour, feedback), color themes.
- Other activities: quick-log running, swimming, yoga, BJJ and more from Train, Log or a day; counts toward streaks.
- Restore: accepts workout backups and photo backups; reads big files without the text box;
  a backup restored into an empty app brings back everything (settings, bodyweight,
  challenges, timers, day marks); into a used app it adds whatever is missing.
"""
import os, re, sys

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
  ['bi-tiered', 'Tiered Linear 4-Day', 'Beginner · 3–4 days a week', 'The three-tier method: T1 is the heavy main lift, T2 the same pattern lighter for volume, T3 an accessory. Make the last set of T1 and T3 as many reps as you can. Add weight whenever you get every rep. When T1 stalls, edit it from 5×3 to 6×2, then 10×1; when T2 stalls, go 3×10 → 3×8 → 3×6.', `Day 1 - Squat / Bench
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
/* Newt's own routines from RepCount: one workout each, with the notes he kept on each exercise.
   Item: [exercise, sets, reps, note, superset with the one above] */
const MY_PLANS = [
  ['bi-eff-ppl', 'Efficient Push/Pull/Legs', null, '', [
    ['Push', ['Push'], [['Bench Press', 3], ['Assisted Dips', 3], ['Standing Overhead Press', 3], ['Cable Lateral Raise Tosses', 3], ['Overhead Cable Tricep Extension', 3, '', '', 1]]],
    ['Pull', ['Pull'], [['Assisted Pull-Up', 3], ['Standing Barbell Row', 3], ['Rear Delt Rows', 3, '', 'Like bent rows but elbows out and lighter, pulling to the upper chest rather than the ribs or waist'], ['Face Pulls', 3], ['Hybrid Curls', 3, '', '', 1]]],
    ['Legs', ['Legs'], [['Back Squat', 3], ['Romanian Deadlift', 3], ['Weighted Lunge Walk', 3], ['Calf Raises', 3, '', '', 1]]]]],
  ['bi-full-body', 'Full Body', ['Full Body'], '', [['Overhead Barbell Press', 3, '', 'Shoulders'], ['Assisted Dips', 3, '', 'Chest, triceps'], ['Dead Hang', 3, '', 'Forearms'], ['Barbell Bicep Curl', 3, '', 'Biceps'], ['Bent-Over Barbell Rows', 3, '', 'Back'], ['Assisted Pull-Up', 3, '', 'Back'], ['Hanging Leg Raises', 10, '', 'Abs: 10 sets, 30 s on / 30 s off'], ['Back Squat', 3, '', 'Legs'], ['Deadlift', 3, '', 'Legs']]],
  ['bi-core-1', 'Core 1', ['Core'], 'On a decline sit-up machine, use weights.', [['Kettlebell Around the World', 3], ['Weighted Decline Sit-Ups', 3], ['Hanging Leg Raise Holds', 3, '10', 'With a 5-second release'], ['Dumbbell/Cable Bends', 3, '12', 'Weight in one hand, then crunch the opposite direction']]],
  ['bi-core-2', 'Core 2', ['Core'], '', [['Kettlebell Around the World', 3], ['Plank Twists', 3, '15', 'Each side'], ['Plank Single Leg Up', 3, '15', 'Each leg. Like mountain climbers, but bringing the knee across the body'], ['Side Plank Crunches', 3, '20', 'Each side'], ['Plank Crunches', 3, '15'], ['Toe Touches', 3, '10'], ['Ankle Taps', 3, '20', 'Each side'], ['Knee Roll-Ups', 3]]],
  ['bi-core-3', 'Core 3', ['Core'], '', [['Kettlebell Around the World', 3, '20'], ['Russian Twists', 3, '20', 'Each side'], ['Scissor Kicks', 3, '20'], ['Scullers', 3, '30'], ['90-Degree Leg Lowers', 3, '10', 'Slow and controlled'], ['Bicycles', 3, '30', 'Each leg']]],
  ['bi-sere-pyramid', 'SERE - Calisthenics Pyramid', ['Conditioning'], 'Multiply the round number by the number in each note. Round 1 (10): 10 pull-ups, 20 dips, 30 push-ups, 40 sit-ups, 50 squats. Round 2 (9): 9, 18, 27, 36, 45. And so on.', [['Pull-Up', 6, '', '1× the round number'], ['Dips', 6, '', '2× the round number'], ['Push-Ups', 6, '', '3× the round number'], ['Sit-Ups', 6, '', '4× the round number'], ['Air Squat', 6, '', '5× the round number'], ['Erg', 1, '', '20 min, 1 on / 1 off']]],
  ['bi-sere-trot', 'SERE - Elephant Trot', ['Conditioning'], '', [['Run 400m', 3], ['Kettlebell Swing', 3, '', '45 lb'], ['Pull-Up', 3], ['100m Sprints', 10, '', 'Sprint 100 m at the top of every minute; rest for whatever is left of that minute']]],
  ['bi-sere-buster', 'SERE - Buster', ['Conditioning'], '', [['Run 400m', 8, '', 'Under 1:50 each, rest 2:00'], ['Pull-Up', 5, '20'], ['Push-Ups', 5, '30'], ['Sit-Ups', 5, '40'], ['Air Squat', 5, '50']]],
  ['bi-sere-swim', 'SERE - Swim AMRAP', ['Conditioning'], '30-minute cap.', [['50m Swim', 10], ['Push-Ups', 10, '10'], ['Air Squat', 10, '15']]],
  ['bi-sere-burp', 'SERE - Burp', ['Conditioning'], 'Split it however you want.', [['Run 4 Miles', 1, '', 'Under 31:30'], ['Pull-Up', 1, '50'], ['Burpees', 1, '100'], ['Wall Ball', 1, '50']]],
  ['bi-sere-ruck', 'SERE - 4 Mile Ruck+', ['Conditioning'], '', [['Ruck 4 Miles', 1, '', 'Under 60 min at 55 lb'], ['Push-Ups', 5, '', '50-40-30-20-10'], ['Sit-Ups', 5, '', '50-40-30-20-10'], ['Kettlebell Swing', 5, '', '50-40-30-20-10']]],
  ['bi-lifter-mobility', "Lifter's Mobility", ['Mobility'], '3–5 sessions a week. Keep it easy: about a 6 out of 10 effort.', [['Knee-to-Wall Ankle Dorsiflexion', 3, '', '3 min'], ['Banded Ankle Distractions', 3, '', '20 s each set'], ['Slant Board Calf Stretch', 3, '', '20 s each set'], ['Seated Tibialis Raise', 3, '15'], ['90/90 Hip Rotations', 3, '8'], ['Pigeon Stretch with Thoracic Rotation', 3, '6'], ['Hip Airplanes', 3, '6'], ['Quadruped T-Spine Rotations', 3, '8'], ['Hanging Lat Stretch', 3, '', '20 s each set'], ['Banded Shoulder Dislocates', 3, '10'], ['Banded Terminal Knee Extensions', 3, '15'], ['Peterson Step-Ups', 3, '12'], ['Weighted Wrist Extension', 3, '10'], ['Floor Wrist Stretch', 3, '', '20 s each set'], ['Dead Bug', 3, '', '20 s each set'], ['Side Plank Rotations', 3, '', '20 s each set']]],
  ['bi-mobility-flow', 'Mobility Flow', ['Mobility'], '', [["World's Greatest Stretch", 3], ['90/90 Hip Flow', 3], ['Cat-Cow and T-Spine Rotation', 3], ['Half-Kneeling Adductor Rock Back', 3], ['Thread the Needle', 3], ['Achilles Opener', 3], ['Thoracic Extension Stretch', 3], ['Figure-4 Windshield Wipers', 3], ['Air Squat', 3], ['Bodyweight Bulgarian Split Squat', 3]]],
  ['bi-full-body-hlm', 'Full Body: Heavy, Light, Medium', null, 'Three full-body days a week: one heavy, one light with high reps, one in between. Add weight on a day once you hit all its reps.', [
    ['Day 1 - Heavy', ['Full Body'], [['Dumbbell Bench Press', 3, '5'], ['Lat Pulldown', 3, '5'], ['Squat', 1, '8'], ['Romanian Deadlift', 1, '8'], ['Seated Dumbbell Overhead Press', 3, '5'], ['Hybrid Curls', 3, '8'], ['Skull Crushers', 3, '8'], ['Calf Raises', 3, '10'], ['Cable Crunch', 3, '10']]],
    ['Day 2 - Light', ['Full Body'], [['Cable Crossover', 3, '15'], ['Dumbbell Pullover', 3, '15'], ['Leg Extension', 3, '15'], ['Lying Leg Curl', 3, '15'], ['Lateral Raises', 3, '15'], ['Hybrid Curls', 3, '15'], ['Tricep Pushdowns', 3, '15'], ['Calf Raises', 3, '15'], ['Cable Crunch', 3, '15']]],
    ['Day 3 - Medium', ['Full Body'], [['Incline Barbell Bench Press', 3, '10'], ['Bent-Over Barbell Rows', 3, '10'], ['Leg Press', 1, '10'], ['Stiff-Leg Deadlift', 1, '10'], ['Barbell Upright Row', 3, '10'], ['Dumbbell Curl', 3, '12'], ['Dumbbell Overhead Tricep Extension', 3, '12'], ['Calf Raises', 3, '12'], ['Cable Crunch', 3, '12']]]]],
];
const COND_EX = /\b(run|running|sprints?|swim|swimming|miles?|ruck|burpees?|erg|wall ?ball|kettlebell swing|kettle bell swing|kb swing|jump rope|bike|cycling|treadmill|rower)\b/;
const BW_EX = /\b(air squat|push ?ups?|sit ?ups?|burpees?|planks?|plank twists|toe touches|ankle taps|scissor kicks|scullers|leg lowers|bicycles|knee roll ?ups|dead hang|hanging leg raises?|dips)\b/;
function planDay(rid, i, name, tags, items) {
  return { id: `${rid}-d${i}`, name, tags, items: items.map(([nm, sets, reps, cue, ss], j) => {
    let ex = findIn(BUILTIN_EX)(nm);
    if (!ex) { const n = norm(nm); ex = { id: 'b-' + slug(nm), name: nm, kind: BW_EX.test(n) && !/assist/.test(n) ? 'bodyweight' : /kettle ?bell|wall ?ball/.test(n) || COND_EX.test(n) ? 'other' : tags[0] === 'Mobility' && !/weighted|dumbbell|barbell/.test(n) ? 'bodyweight' : guessKind(nm) };
      if (COND_EX.test(n)) ex.cat = 'cardio'; else if (tags[0] === 'Core') ex.cat = 'core'; else if (tags[0] === 'Mobility') ex.cat = 'other'; else if (/rear delt row/.test(n)) ex.cat = 'back';
      BUILTIN_EX[ex.id] = ex; }
    return { id: `${rid}-d${i}-${j + 1}`, ex: ex.id, sets, reps: reps || '', group: '', ss: !!ss && j > 0, note: cue || '' }; }) };
}
/* One-day plans: [id, name, tags, note, items]. Multi-day: [id, name, null, note, [[day name, tags, items], …]]. */
function builtinPlan([rid, name, tags, note, items]) {
  const days = tags ? [planDay(rid, 1, name, tags, items)] : items.map(([dn, t, its], i) => planDay(rid, i + 1, dn, t, its));
  return { id: rid, name, note, source: 'builtin', shelf: 'plans', meta: days.length > 1 ? days.length + ' days a week' : '', days };
}
const BUILTIN_ROUTINES = [
  Object.assign(builtinRoutine('bi-newt-4day', "Newt's 4-Day Split", 'Exercises marked with a bar on the left are supersets with the one above.', NEWT_TEXT), { meta: '4 days a week', shelf: 'plans' }),
  ...MY_PLANS.map(builtinPlan),
  ...LIB_PROGRAMS.map(([id, name, meta, note, text]) => Object.assign(builtinRoutine(id, name, note, text), { meta, shelf: 'programs' })),
];
BUILTIN_ROUTINES.forEach(r => { if (r.id === 'bi-5x5' || r.id === 'bi-tiered') r.days.forEach(d => { d.tags = ['Full Body']; }); });
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
const routineKey = r => JSON.stringify([r.name, r.days.map(d => [d.id, d.name, d.tags && d.tags.length ? d.tags : null, d.items.map(i => [i.id, i.ex, +i.sets, i.reps || '', !!i.ss, i.group || '', i.note || ''])])]);
/* An edit of a library routine counts only while it differs from the library version. */
const libOver = id => { const o = S.meta.routines[id], b = libBase(id); return o && b && routineKey(o) !== routineKey(b) ? o : null; };
const libRoutines = () => BUILTIN_ROUTINES.filter(r => !isHidden(r.id)).map(r => libOver(r.id) || r);
const allRoutines = () => [...myRoutines(), ...libRoutines()];
const getRoutine = id => isHidden(id) ? null : libBase(id) ? (libOver(id) || libBase(id)) : (S.meta.routines[id] || null);""")

start = src.index('function RoutinesScreen({ view }) {')
end = src.index('function RoutineEditor({ view }) {', start)
SCREENS = r"""/* Workout types. A day's tags come from the editor, or are worked out from its name, then its exercises. */
const WTAGS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Mobility', 'Conditioning', 'Other'];
const TAG_WORDS = [[/\bpush\b/, ['Push']], [/\bpull\b/, ['Pull']], [/\blegs?\b/, ['Legs']], [/\bupper\b/, ['Upper']], [/\blower\b/, ['Lower']], [/\b(full|total) ?body\b/, ['Full Body']],
  [/\bchest\b/, ['Chest', 'Push']], [/\bback\b/, ['Back', 'Pull']], [/\bshoulders?\b/, ['Shoulders', 'Push']], [/\b(arms?|biceps?|triceps?|bis|tris)\b/, ['Arms']], [/\b(core|abs?)\b/, ['Core']], [/\b(mobility|stretch(es|ing)?|yoga|flexibility)\b/, ['Mobility']], [/\b(conditioning|cardio|hiit|metcon)\b/, ['Conditioning']]];
function autoTags(day, r) {
  const nm = norm(String(day.name || '').replace(/^Day\s*\d+\s*[-–]\s*/i, '') + (r && r.days.length === 1 ? ' ' + r.name : ''));
  const out = []; for (const [re, t] of TAG_WORDS) if (re.test(nm)) t.forEach(x => { if (!out.includes(x)) out.push(x); });
  if (out.length) return WTAGS.filter(t => out.includes(t));
  const w = { push: 0, pull: 0, legs: 0, core: 0, arms: 0, cond: 0 }; let tot = 0;
  for (const it of day.items) {
    const s = +it.sets || 1; tot += s;
    if (COND_EX.test(norm(exName(it.ex)))) { w.cond += s; continue; }
    const c = exCat(it.ex);
    if (c === 'chest' || c === 'shoulders') w.push += s; else if (c === 'triceps') { w.push += s; w.arms += s; }
    else if (c === 'back') w.pull += s; else if (c === 'biceps') { w.pull += s; w.arms += s; }
    else if (c === 'legs') w.legs += s; else if (c === 'core') w.core += s; else if (c === 'cardio') w.cond += s;
  }
  if (!tot) return ['Other']; const f = k => w[k] / tot;
  if (f('cond') >= .4) return ['Conditioning']; if (f('core') >= .6) return ['Core']; if (f('legs') >= .6) return ['Legs'];
  if (f('arms') >= .6) return ['Arms']; if (f('push') >= .6) return ['Push']; if (f('pull') >= .6) return ['Pull'];
  if (f('legs') >= .2 && f('push') + f('pull') >= .3) return ['Full Body']; if (f('push') + f('pull') >= .6) return ['Upper'];
  if (f('legs') + f('core') >= .6) return ['Lower']; return ['Other'];
}
const dayTags = (day, r) => day.tags && day.tags.length ? day.tags : autoTags(day, r);
const routineTags = r => { const s = new Set(); r.days.forEach(d => dayTags(d, r).forEach(t => s.add(t))); return WTAGS.filter(t => s.has(t)); };
const setsLabel = it => it.sets + ' set' + (+it.sets === 1 ? '' : 's') + (it.reps ? ' × ' + it.reps + ' reps' : '');
/* The weight used last time (heaviest set, or least assistance), with its unit. */
const lastTop = it => { const e = lastEntry(it.ex, it.group || ''); if (!e) return ''; const ws = e.raw.filter(x => +x.r > 0).map(x => +x.w || 0).filter(w => w > 0); if (!ws.length) return '';
  const asst = exKind(it.ex) === 'assisted'; return ' · last ' + fmt(asst ? Math.min(...ws) : Math.max(...ws)) + ' ' + e.u + (asst ? ' assist' : ''); };
const dayLabel = d => String(d.name || '').replace(/\s*\(.*\)$/, '').replace(/^Day\s*\d+\s*[-–]\s*/i, '');
const tagChips = tags => html`<span class="tag-row">${tags.map(t => html`<span key=${t} class="chip wtag">${t}</span>`)}</span>`;

function RoutinesScreen({ view }) {
  if (view && view.type === 'routine') return html`<${RoutineView} id=${view.id}/>`;
  if (view && view.type === 'edit') return html`<${RoutineEditor} view=${view}/>`;
  return html`<${RoutineList}/>`;
}
const RT_OPEN = { v: null };
const openSecs = () => { if (!RT_OPEN.v) { try { RT_OPEN.v = JSON.parse(lsGet('rtOpen') || '{}') || {}; } catch (e) { RT_OPEN.v = {}; } } return RT_OPEN.v; };
function RoutineList() {
  const [kind, setKind] = useState(lsGet('rtKind') === 'plans' ? 'plans' : 'routines');
  const [mode, setMode] = useState(lsGet('rtView') === 'type' ? 'type' : 'list'); const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const pickKind = k => { setKind(k); lsSet('rtKind', k); }; const pick = m => { setMode(m); lsSet('rtView', m); };
  const isPlan = r => r.days.length > 1; const want = r => kind === 'plans' ? isPlan(r) : !isPlan(r);
  const mine = myRoutines().filter(want); const lib = libRoutines().filter(want); const hidden = (S.meta.hidden || []).filter(libBase);
  const pid = programId();
  const card = r => { const tag = [r.base ? 'Edited' : '', pid === r.id ? 'Your program' : '', r.meta || ''].filter(Boolean).join(' · ');
    return html`<button key=${r.id} class="r-card" onClick=${() => UI.setView({ type: 'routine', id: r.id })}>
    ${tag ? html`<span class="tag">${tag}</span>` : null}<h3>${r.name}</h3>
    <span class="days">${r.days.length === 1 ? r.days[0].items.length + ' exercises' : r.days.length + ' days · ' + r.days.map(dayLabel).join(', ')}</span>${tagChips(routineTags(r))}</button>`; };
  const newDraft = () => ({ id: uid('r'), name: '', source: 'mine', createdAt: Date.now(), days: kind === 'plans' ? [{ id: uid('d'), name: 'Day 1', items: [] }, { id: uid('d'), name: 'Day 2', items: [] }] : [{ id: uid('d'), name: 'Day 1', items: [] }] });
  const seg = html`<div class="seg" role="tablist" aria-label="Routine view" style="margin:2px 0 0">
    <button role="tab" aria-selected=${mode === 'list'} class=${mode === 'list' ? 'on' : ''} onClick=${() => pick('list')}>List</button>
    <button role="tab" aria-selected=${mode === 'type'} class=${mode === 'type' ? 'on' : ''} onClick=${() => pick('type')}>By type</button></div>`;
  const actions = html`<div class="row"><button class="btn primary" style="flex:1" onClick=${() => UI.setView({ type: 'edit', draft: newDraft(), isNew: true })}>${I.plus} ${kind === 'plans' ? 'New plan' : 'New routine'}</button>
    <button class="btn" style="flex:1" onClick=${() => openSheet({ type: 'import' })}>Import</button></div>`;
  const bring = hidden.length ? html`<button class="btn text wide" onClick=${() => commit(st => { st.meta.hidden = []; }, 'meta')}>Bring back ${hidden.length} removed routine${hidden.length === 1 ? '' : 's'}</button>` : null;
  const top = html`<${TopSwitch} value=${kind} options=${[['routines', 'Routines'], ['plans', 'Plans']]} onChange=${pickKind}/>
    <${Tip} id=${'kind-' + kind} style="margin-top:12px">${kind === 'plans' ? 'Plans have several days. Follow one from its page and Train lines up the next day for you.' : 'Routines are single workouts. Start one any time, or follow it as your program.'}<//>
    <div class="row" style="margin-top:12px">${seg}</div>`;
  if (mode === 'list') return html`<div>${top}
    <div class="section-h"><h2>Yours</h2></div>
    <div class="stack">${mine.length ? mine.map(card) : html`<${Tip} id=${'yours-' + kind}>${kind === 'plans' ? 'Plans you build, copy, or import live here.' : 'Routines you build, copy, or import live here.'} Library ones can be edited or removed too.<//>`}${actions}</div>
    ${lib.length ? html`<div class="section-h"><h2>Library</h2></div><div class="stack">${lib.map(card)}</div>` : null}
    <div class="stack" style="margin-top:10px">${bring}</div></div>`;
  const open = openSecs(); const groups = WTAGS.map(t => ({ t, rows: [] }));
  for (const r of [...mine, ...lib]) for (const d of r.days) if (d.items.length) for (const t of dayTags(d, r)) (groups.find(g => g.t === t) || groups[groups.length - 1]).rows.push({ r, d });
  const shown = groups.filter(g => g.rows.length); const allOpen = shown.length && shown.every(g => open[g.t]);
  const setAll = v => { shown.forEach(g => { open[g.t] = v; }); lsSet('rtOpen', JSON.stringify(open)); re(); };
  const row = ({ r, d }) => html`<div key=${r.id + d.id} class="wk-row">
    <button class="wk-main" onClick=${() => UI.setView({ type: 'routine', id: r.id })}>
      <span class="t">${r.days.length > 1 ? dayLabel(d) : r.name}</span>
      <span class="s">${r.days.length > 1 ? r.name + ' · ' : ''}${d.items.length} exercise${d.items.length === 1 ? '' : 's'}</span>${tagChips(dayTags(d, r))}</button>
    <button class="pill-btn accent" onClick=${() => startWorkout(r, d)}>Start</button></div>`;
  return html`<div>${top}
    <div class="row" style="margin:12px 0 2px"><div style="flex:1"><${Tip} id="bytype">Every workout, sorted by type. Set a workout's type in Edit.<//></div>
      ${shown.length ? html`<button class="btn text" onClick=${() => setAll(!allOpen)}>${allOpen ? 'Close all' : 'Open all'}</button>` : null}</div>
    ${shown.map(g => { const on = !!open[g.t]; return html`<section key=${g.t} class="wsec">
      <button class="wsec-h" aria-expanded=${on} onClick=${() => { open[g.t] = !on; lsSet('rtOpen', JSON.stringify(open)); re(); }}><h2>${g.t}</h2><span class="aside num">${g.rows.length}</span>${on ? I.up : I.down}</button>
      ${on ? html`<div class="stack" style="gap:6px;margin-top:8px">${g.rows.map(row)}</div>` : null}</section>`; })}
    <div class="stack" style="margin-top:18px">${actions}${bring}</div></div>`;
}
function RoutineView({ id }) {
  const r = getRoutine(id); if (!r) return html`<div class="empty"><h3>Routine not found</h3></div>`;
  const lib = !!libBase(r.id); const builtin = r.source === 'builtin';
  const copy = () => { const c = clone(r); delete c.base; delete c.meta; delete c.shelf; c.id = uid('r'); c.source = 'mine'; c.name = r.name + ' (copy)'; c.createdAt = Date.now(); c.days.forEach(d => { d.id = uid('d'); d.items.forEach(i => { i.id = uid('i'); }); });
    commit(st => { st.meta.routines[c.id] = c; }, 'meta'); UI.setView({ type: 'routine', id: c.id }); };
  const edit = () => UI.setView({ type: 'edit', draft: builtin ? { ...clone(r), source: 'mine', base: r.id, createdAt: Date.now() } : clone(r) });
  const reset = () => openSheet({ type: 'confirm', title: 'Reset ' + r.name + '?', body: 'Your changes to this routine are undone. Logged workouts stay in your history.', ok: 'Reset routine', danger: true, onOk: () => { commit(st => { delete st.meta.routines[r.id]; }, 'meta'); closeSheet(); } });
  const del = () => openSheet({ type: 'confirm', title: (lib ? 'Remove ' : 'Delete ') + r.name + '?', body: lib ? 'It leaves your library. You can bring it back at the bottom of Routines. Logged workouts stay in your history.' : 'Logged workouts stay in your history.', ok: lib ? 'Remove routine' : 'Delete routine', danger: true,
    onOk: () => { commit(st => { delete st.meta.routines[r.id]; if (lib) st.meta.hidden = [...new Set([...(st.meta.hidden || []), r.id])]; }, 'meta'); closeSheet(); UI.setView(null); } });
  return html`<div>
    <div class="eyebrow" style="margin-top:6px">${[r.base ? 'Edited' : '', programId() === r.id ? 'Your program' : '', r.meta || ''].filter(Boolean).join(' · ') || (r.days.length > 1 ? 'Plan' : 'Routine')}</div>
    <h2 class="wo-title" style="margin:2px 0 6px">${r.name}</h2>
    <div style="margin-bottom:8px">${tagChips(routineTags(r))}</div>
    ${r.note ? html`<p class="note">${r.note}</p>` : null}
    <div class="row wrap" style="margin:14px 0 4px">
      ${programId() === r.id ? null : html`<button class="btn primary" id="follow" onClick=${() => { setProgram(r.id); showToast({ kind: 'info', text: 'Following ' + r.name }); }}>Follow${r.days.length > 1 ? ' this plan' : ''}</button>`}
      <button class="btn" onClick=${edit}>${I.edit} Edit</button>
      <button class="btn" onClick=${copy}>${I.copy} Copy</button>
      ${r.base ? html`<button class="btn text" onClick=${reset}>Reset</button>` : null}
      <button class="btn text danger" onClick=${del}>${lib ? 'Remove' : 'Delete'}</button>
    </div>
    <div class="stack" style="margin-top:10px">${r.days.map(d => html`<div key=${d.id} class="r-day">
      <div class="row"><div style="flex:1;min-width:0"><h3>${d.name}</h3>${r.days.length > 1 ? html`<div style="margin-top:4px">${tagChips(dayTags(d, r))}</div>` : null}</div><button class="pill-btn accent" onClick=${() => startWorkout(r, d)}>Start</button></div>
      <ul class="r-items">${d.items.map(it => html`<li key=${it.id} class=${it.ss ? 'ssi' : ''}><span class="nm">${exName(it.ex)}</span>${groupChip(it.group)}<span class="sub num">${setsLabel(it)}${lastTop(it)}</span>${it.note ? html`<span class="cue">${it.note}</span>` : null}</li>`)}</ul></div>`)}</div>
  </div>`;
}
"""
src = src[:start] + SCREENS + src[end:]
# 8. Newt's 4-Day Split as he edited it in the app (Oct 10): rep ranges, new supersets, no pull-ups on legs day, plain day names.
swap("Day 1 - Chest Focus (N)\n3x Decline Chest Press\n3x Russian Tits to L Stretch\n3x x Hybrid Curls\n3x Cable Fly\n3x x Tricep Pushdowns\n3x Cable Crunch\n3x Russian Behind-the-Back Cable Flies\nDay 2 - Back / Rear Delts (N)\n3x Bent-Over Barbell Rows\n3x Lat Pulldown\n3x x Cuban Press\n4x Russian Behind-the-Back Cable Flies\n3x x Hybrid Curls\n3x Scapular Shrugs\n3x Cable Crunch\nDay 3 - Shoulders / Tris (N)\n3x Overhead Barbell Press\n3x Russian Behind-the-Back Cable Flies\n3x x Tricep Pushdowns\n3x Face Pulls\n3x x Overhead Cable Tricep Extension\n3x Scapular Shrugs\n3x Cable Crunch\nDay 4 - Legs (N/BJJ)\n3x Squat\n3x Romanian Deadlift\n3x Leg Curls\n3x Calf Raises\n3x Assisted Pull-Up", "Day 1 - Chest Focus\n3x5-8 Decline Chest Press\n3x5-8 Russian Tits to L Stretch\n3x5-8 x Hybrid Curls\n3x5-8 Cable Fly\n3x5-8 x Tricep Pushdowns\n3x5-8 Cable Crunch\n3x10-12 x Russian Behind-the-Back Cable Flies\nDay 2 - Back / Rear Delts\n3x5-8 Bent-Over Barbell Rows\n3x5-8 Lat Pulldown\n3x10-12 x Cuban Press\n4x10-12 Russian Behind-the-Back Cable Flies\n3x5-8 x Hybrid Curls\n3x10-12 Scapular Shrugs\n3x10-12 x Cable Crunch\nDay 3 - Shoulders / Tris\n3x5-8 Overhead Barbell Press\n3x10-12 Russian Behind-the-Back Cable Flies\n3x5-8 x Tricep Pushdowns\n3x5-8 Face Pulls\n3x5-8 x Overhead Cable Tricep Extension\n3x10-12 Scapular Shrugs\n3x10-12 x Cable Crunch\nDay 4 - Legs\n3x5-8 Squat\n3x5-8 x Romanian Deadlift\n3x5-8 Leg Curls\n3x10-12 x Calf Raises")
# 7. Exercise notes on routines (shown in the routine and during the workout), workout-type tags in the editor.
swap("note: '', target: { sets: n, reps: item.reps || '' },", "note: '', target: { sets: n, reps: item.reps || '', cue: item.note || '' },")
swap("""${it.prev ? null : html`<span class="faint">· first time${it.group ? ' in this range' : ''}</span>`}</div></div>""",
     """${it.prev ? null : html`<span class="faint">· first time${it.group ? ' in this range' : ''}</span>`}</div>${it.target && it.target.cue ? html`<p class="small muted" style="margin-top:4px">${it.target.cue}</p>` : null}</div>""")
swap("""        <button class="icon-btn" aria-label="Delete day" onClick=${() => { d.days.splice(di, 1); re(); }}>${I.trash}</button></div>
""", """        <button class="icon-btn" aria-label="Delete day" onClick=${() => { d.days.splice(di, 1); re(); }}>${I.trash}</button></div>
      <div><div class="lbl">Workout type</div><div class="ed-tags" role="group" aria-label="Workout type">${WTAGS.map(t => { const on = (day.tags || []).includes(t); return html`<button key=${t} class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => { const s = new Set(day.tags || []); if (on) s.delete(t); else s.add(t); day.tags = WTAGS.filter(x => s.has(x)); re(); }}>${t}</button>`; })}</div>
        ${day.tags && day.tags.length ? null : html`<p class="small faint" style="margin-top:6px">Automatic: ${autoTags(day, d).join(', ')}. Tap a type to set your own.</p>`}</div>
""")
swap("""          ${ii > 0 ? html`<label class="toggle"><input type="checkbox" id=${'ss-' + it.id} checked=${it.ss} onChange=${e => { it.ss = e.target.checked; re(); }}/>Superset</label>` : null}
        </div></div>`)}""", """          ${ii > 0 ? html`<label class="toggle"><input type="checkbox" id=${'ss-' + it.id} checked=${it.ss} onChange=${e => { it.ss = e.target.checked; re(); }}/>Superset</label>` : null}
        </div>
        <input class="field ed-cue" id=${'cue-' + it.id} aria-label=${exName(it.ex) + ' note'} placeholder="Note, e.g. 15 each side" value=${it.note || ''} onInput=${e => { it.note = e.target.value; }}/></div>`)}""")
swap(".r-card .days{font-size:14px;color:var(--ink-2)}", """.r-card .days{font-size:14px;color:var(--ink-2)}
.tag-row{display:flex;flex-wrap:wrap;gap:4px}
.chip.wtag{font-size:11.5px;padding:2px 8px;background:var(--accent-soft);color:var(--accent)}
.wsec-h{display:flex;align-items:center;gap:10px;width:100%;padding:14px 4px 10px;border-bottom:1px solid var(--line);text-align:left}
.wsec-h h2{font-family:var(--display);font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;flex:1}
.wsec-h svg{width:18px;height:18px;color:var(--ink-2)}
.wk-row{display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:12px;padding:10px 12px}
.wk-main{flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;gap:4px}
.wk-main .t{font-weight:700;line-height:1.25}
.wk-main .s{font-size:13.5px;color:var(--ink-2)}
.r-items li{gap:2px 8px}
.r-items .nm{font-weight:600}
.r-items .sub{flex-basis:100%;font-size:13.5px;color:var(--ink-2)}
.r-items .cue{flex-basis:100%;font-size:13.5px;color:var(--ink-3)}
.ed-tags{display:flex;flex-wrap:wrap;gap:6px}
input.field.ed-cue{padding:8px 10px;font-size:15px;background:var(--surface)}""")
swap("<span>${it.target.sets} sets${it.target.reps ? ' × ' + it.target.reps : ''}</span>", "<span>${it.target.sets} sets${it.target.reps ? ' × ' + it.target.reps + ' reps' : ''}</span>")
swap("${it.sets}× ${exName(it.ex)}${it.group ? ' · ' + (RANGE_NAME", "${exName(it.ex)}<span class=\"faint\"> · ${it.sets} × ${it.reps || ''}</span>${it.group ? ' · ' + (RANGE_NAME")
swap("This change applies to today. Copy the routine to make it permanent.", "This change applies to today. Edit the routine to make it permanent.")

# 9. Quick-log other activities (running, swimming, yoga, BJJ…). Saved as a session with kind 'activity' and no
#    exercises, so streaks, the week strip, workouts-per-week and backups all count it with no further changes.
ACT = r"""
/* ---------- Other activities ---------- */
const ACTS = [['run', 'Running', 1], ['walk', 'Walking / hiking', 1], ['cycle', 'Cycling', 1], ['swim', 'Swimming', 1], ['row', 'Rowing', 1], ['ruck', 'Rucking', 1],
  ['cross', 'Cross-training', 0], ['hiit', 'HIIT / conditioning', 0], ['bjj', 'BJJ / martial arts', 0], ['sport', 'Sports', 0], ['yoga', 'Yoga', 0], ['mobility', 'Stretching / mobility', 0], ['other', 'Other', 0]];
const actInfo = k => ACTS.find(a => a[0] === k) || ACTS[ACTS.length - 1];
const actUnit = k => k === 'swim' ? (U() === 'kg' ? 'm' : 'yd') : (U() === 'kg' ? 'km' : 'mi');
function actLine(s) {
  const p = []; if (s.dist) p.push(fmt(s.dist) + ' ' + (s.distU || 'mi')); if (s.dur) p.push(s.dur + ' min');
  if (s.dist && s.dur && (s.distU === 'mi' || s.distU === 'km') && s.activity !== 'cycle') { const pm = s.dur / s.dist; p.push(Math.floor(pm) + ':' + String(Math.round((pm % 1) * 60)).padStart(2, '0') + ' /' + s.distU); }
  return p.join(' · ');
}
function ActivitySheet({ id, day }) {
  const s0 = id ? S.sessions[id] : null; const today = ymd(Date.now());
  const [act, setAct] = useState(s0 ? s0.activity : 'run'); const [name, setName] = useState(s0 && s0.activity === 'other' ? s0.name : '');
  const [d, setD] = useState(s0 ? ymd(s0.startedAt) : (day && day <= today ? day : today));
  const [dur, setDur] = useState(s0 && s0.dur ? String(s0.dur) : ''); const [dist, setDist] = useState(s0 && s0.dist ? String(s0.dist) : '');
  const [du, setDu] = useState(s0 && s0.distU ? s0.distU : actUnit(s0 ? s0.activity : 'run')); const [note, setNote] = useState(s0 ? s0.note || '' : '');
  const [confirm, setConfirm] = useState(false);
  const info = actInfo(act);
  const pick = k => { setAct(k); if (!dist) setDu(actUnit(k)); };
  const save = () => {
    const m = Math.max(0, Math.round(num(dur))); let start;
    if (s0 && ymd(s0.startedAt) === d) start = s0.startedAt; else if (d === today) start = Date.now() - Math.max(m, 1) * 60000; else { const x = parseYmd(d); x.setHours(12, 0, 0, 0); start = +x; }
    const x = { id: s0 ? s0.id : uid('s'), kind: 'activity', activity: act, name: act === 'other' ? (name.trim() || 'Other activity') : info[1], startedAt: start, endedAt: start + Math.max(m, 1) * 60000,
      updatedAt: Date.now(), items: [], prs: [], dur: m, dist: info[2] && num(dist) > 0 ? num(dist) : 0, distU: du, note: note.trim() };
    commit(st => { st.sessions[x.id] = x; }, 's_' + x.id); closeSheet(); showToast({ kind: 'info', text: x.name + (s0 ? ' updated' : ' logged') });
  };
  const del = () => { commit(st => { delete st.sessions[id]; st.meta.deleted = [...(st.meta.deleted || []), id]; }, ['del:s_' + id, 'meta']); closeSheet(); };
  return html`<${Sheet} label=${s0 ? 'Edit activity' : 'Log an activity'}><h2>${s0 ? 'Edit activity' : 'Log an activity'}</h2>
    <p class="note">Counts toward your week streak and workouts per week, like a lifting workout.</p>
    <div class="range-grid" role="group" aria-label="Activity">${ACTS.map(([k, l]) => html`<button key=${k} class=${'chip' + (act === k ? ' on' : '')} aria-pressed=${act === k} onClick=${() => pick(k)}>${l}</button>`)}</div>
    <div class="stack" style="margin-top:14px">
      ${act === 'other' ? html`<div><label class="lbl" for="ac-name">What did you do?</label><input class="field" id="ac-name" placeholder="e.g. Climbing" value=${name} onInput=${e => setName(e.target.value)}/></div>` : null}
      <div class="row" style="align-items:flex-end"><div style="flex:1"><label class="lbl" for="ac-date">Date</label><input class="field" id="ac-date" type="date" max=${today} value=${d} onChange=${e => e.target.value && setD(e.target.value)}/></div>
        <div style="flex:1"><label class="lbl" for="ac-dur">Minutes</label><input class="field" id="ac-dur" inputmode="numeric" placeholder="e.g. 45" value=${dur} onInput=${e => setDur(e.target.value.replace(/[^\d]/g, ''))}/></div></div>
      ${info[2] ? html`<div class="row" style="align-items:flex-end"><div style="flex:1"><label class="lbl" for="ac-dist">Distance (optional)</label><input class="field" id="ac-dist" inputmode="decimal" placeholder="0" value=${dist} onInput=${e => setDist(e.target.value.replace(/[^\d.,]/g, ''))}/></div>
        <div class="seg" role="group" aria-label="Distance unit" style="margin-bottom:4px">${['mi', 'km', 'm', 'yd'].map(u => html`<button key=${u} class=${du === u ? 'on' : ''} aria-pressed=${du === u} onClick=${() => setDu(u)}>${u}</button>`)}</div></div>` : null}
      <div><label class="lbl" for="ac-note">Note (optional)</label><input class="field" id="ac-note" placeholder=${act === 'run' ? 'e.g. Easy pace, hills' : 'How it went'} value=${note} onInput=${e => setNote(e.target.value)}/></div>
      <button class="btn primary wide" onClick=${save}>${s0 ? 'Save changes' : 'Save activity'}</button>
      ${s0 ? (confirm ? html`<button class="btn wide danger" onClick=${del}>Delete activity</button><button class="btn wide" onClick=${() => setConfirm(false)}>Keep it</button>`
        : html`<button class="btn text danger wide" onClick=${() => setConfirm(true)}>Delete</button>`) : null}
    </div><//>`;
}
"""
swap("function SessionSheet({ id }) {", ACT.lstrip('\n') + "function SessionSheet({ id }) {")
swap("""  const s0 = S.sessions[id]; const [edit, setEdit] = useState(null); const [confirm, setConfirm] = useState(false);
  if (!s0) return null;
""", """  const s0 = S.sessions[id]; const [edit, setEdit] = useState(null); const [confirm, setConfirm] = useState(false);
  if (!s0) return null;
  if (s0.kind === 'activity') return html`<${ActivitySheet} id=${id}/>`;
""")
swap("    case 'session': return html`<${SessionSheet} id=${sheet.id}/>`;",
     "    case 'session': return html`<${SessionSheet} id=${sheet.id}/>`;\n    case 'activity': return html`<${ActivitySheet} day=${sheet.day}/>`;")
# Train: next to "Empty workout", and when there are no routines
swap("""        <button class="btn ghost wide" onClick=${() => startWorkout(null, null)}>${I.plus} Empty workout</button></div>`
    : html`<div class="empty"><h3>No routines yet</h3><p>Build one in Routines, or start an empty workout.</p></div>`}""",
"""        <button class="btn ghost wide" onClick=${() => startWorkout(null, null)}>${I.plus} Empty workout</button>
        <button class="btn ghost wide" id="log-activity" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log another activity</button></div>`
    : html`<div class="empty"><h3>No routines yet</h3><p>Build one in Routines, or start an empty workout.</p><button class="btn ghost wide" style="margin-top:12px" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log another activity</button></div>`}""")
# Log: button on top, activity line in each entry
swap("""  if (!list.length) return html`<div class="empty"><h3>No workouts yet</h3><p>Finished workouts show up here with your best set for each exercise.</p></div>`;""",
"""  const actBtn = html`<button class="btn ghost wide" style="margin-top:6px" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log an activity</button>`;
  if (!list.length) return html`<div><div class="empty"><h3>No workouts yet</h3><p>Finished workouts show up here with your best set for each exercise. Running, swimming, yoga and other activities can be logged too.</p></div>${actBtn}</div>`;""")
swap("""<ul class="log-ex">${s.items.map(""", """${s.kind === 'activity' ? html`<p class="log-act">${actLine(s) || 'Activity'}${s.note ? html`<span class="faint"> · ${s.note}</span>` : null}</p>` : null}<ul class="log-ex">${s.items.map(""")
swap("""  return html`<div>${list.map(s => {""", """  return html`<div>${actBtn}${list.map(s => {""")
# Day sheet: log an activity on that day
swap("""    ${m ? html`<button class="btn wide" style="margin-top:12px" onClick=${() => setM('')}>Clear this day</button>` : null}<//>`;""",
"""    ${m ? html`<button class="btn wide" style="margin-top:12px" onClick=${() => setM('')}>Clear this day</button>` : null}
    ${k <= ymd(Date.now()) ? html`<button class="btn ghost wide" style="margin-top:12px" onClick=${() => openSheet({ type: 'activity', day: k })}>${I.plus} Log an activity on this day</button>` : null}<//>`;""")
swap(".log-prs{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}", ".log-prs{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}\n.log-act{margin-top:6px;font-size:15px;color:var(--ink-2);font-variant-numeric:tabular-nums}")

# 10. Train / History (Log moves under Train), choosing a program or Self-log, dismissable tips, Help (tour + feedback)
#     on every page, the save status as a labeled line in History, and color themes (two color-blind friendly).
swap("let _sl = null, _slv = -1;", "const DEMO = { on: false, list: null }; /* sample data shown only during the walkthrough */\nlet _sl = null, _slv = -1;")
swap("function sessionList() { if (_slv !== S.ver)", "function sessionList() { if (DEMO.on) return demoSessions(); if (_slv !== S.ver)")
swap("  initCloud();\n})();", "  initCloud();\n  setTimeout(() => { if (lsGet('tourDone') !== '1' && !S.active && !Object.keys(S.sessions).length) startTour(); }, 1400);\n})();")
swap("""    <div class="section-h" style="margin-top:12px"><h2>Display & language</h2></div>""", """    <div class="section-h" style="margin-top:12px"><h2>Help</h2></div>
    <div class="card stack" style="gap:8px"><button class="btn wide" id="profile-tour" onClick=${startTour}>Take the tour again</button><button class="btn wide" onClick=${() => openSheet({ type: 'feedback' })}>Send feedback</button></div>
    <div class="section-h" style="margin-top:12px"><h2>Display & language</h2></div>""")
swap("""    ${tab === 'cats' ? html`<${StatsCategories}/>`""", """    ${DEMO.on ? html`<div class="demo-banner" id="demo-banner" style="margin-top:10px">${I.stats} Sample data for the tour. It goes away when the tour ends.</div>` : null}
    ${tab === 'cats' ? html`<${StatsCategories}/>`""")
a = src.index("""    : html`<div class="card"><div class="demo-banner">${I.stats} Example only.""")
b = src.index("now=${now}/></div>`}", a) + len("now=${now}/></div>`}")
src = src[:a] + """    : html`<div class="card note">Log a workout to see your lifts here, each with a chart and an 8-week projection.</div>`}""" + src[b:]
TRAINJS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'train.js'), encoding='utf8').read()
a = src.index('function nextUp() {'); b = src.index('\n}\n', a) + 3
src = src[:a] + src[b:]
a = src.index('function TrainHome() {'); b = src.index('function ActiveWorkout() {', a)
src = src[:a] + TRAINJS + src[b:]
swap("const TABS = [['train', 'Train'], ['log', 'Log'], ['routines', 'Routines'], ['stats', 'Stats'], ['profile', 'Profile']];",
     "const TABS = [['train', 'Train'], ['routines', 'Routines'], ['stats', 'Stats'], ['profile', 'Profile']];")
swap("const [tab, setTab] = useState(() => { const h = (location.hash || '').slice(1); return TABS.some(t => t[0] === h) ? h : (lsGet('tab') || 'train'); });",
     "const [tab, setTab] = useState(() => { const h = (location.hash || '').slice(1); if (h === 'log' || lsGet('tab') === 'log') { TRAIN.mode = 'history'; return 'train'; } return TABS.some(t => t[0] === h) ? h : (lsGet('tab') || 'train'); });")
swap("let title = { train: S.active ? 'Workout' : 'Train', log: 'Log', routines: 'Routines', stats: 'Stats', profile: 'Profile' }[tab];",
     "let title = { train: S.active ? 'Workout' : '', routines: '', stats: 'Stats', profile: 'Profile' }[tab];\n  if (tab === 'routines' && vt === 'routine') title = 'Routines';")
swap("  if (tab === 'log') right = html`<span class=${'sync ' + S.sync} title=${SYNC_TEXT[S.sync]}><i></i></span>`;\n", "")
swap("S.active ? html`<${ActiveWorkout}/>` : html`<${TrainHome}/>`;", "S.active ? html`<${ActiveWorkout}/>` : html`<${TrainSwitch}/>`;")
swap("tab === 'log' ? html`<${LogScreen}/>` : ", "")
swap("""    <header class="hdr"><div class="hdr-in"><div class="l">${left}</div><h1>${title}</h1><div class="r">${right}</div></div></header>""",
     """    ${title || left || right ? html`<header class="hdr"><div class="hdr-in"><div class="l">${left}</div><h1>${title}</h1><div class="r">${right}</div></div></header>` : html`<div class="hdr-space"></div>`}""")
swap(">${body}</main>", ">${body}<${HelpFoot}/></main>")
swap("    <${SheetHost} sheet=${sheet}/>`;", "    <${SheetHost} sheet=${sheet}/>\n    ${S.tour ? html`<${TourOverlay}/>` : null}`;")
swap(".tabs-in{display:grid;grid-template-columns:repeat(5,1fr);", ".tabs-in{display:grid;grid-template-columns:repeat(4,1fr);")
swap("    case 'session': return html`<${SessionSheet} id=${sheet.id}/>`;",
     "    case 'session': return html`<${SessionSheet} id=${sheet.id}/>`;\n    case 'program': return html`<${ProgramSheet}/>`;\n    case 'help': return html`<${HelpSheet}/>`;\n    case 'feedback': return html`<${FeedbackSheet}/>`;\n    case 'colors': return html`<${ColorSheet}/>`;")
swap("commit(st => { st.meta.routines[d.id] = clone(d); }, 'meta'); UI.setView({ type: 'routine', id: d.id }); };",
     "commit(st => { st.meta.routines[d.id] = clone(d); if (view.follow) st.meta.settings.program = d.id; }, 'meta'); UI.setView({ type: 'routine', id: d.id }); };")
swap("""<p class="note">Counts toward your week streak and workouts per week, like a lifting workout.</p>""",
     """<${Tip} id="activity" style="margin-top:4px">Counts toward your week streak and workouts per week, like a lifting workout.<//>""")
# colors
swap("const DISP = { theme: lsGet('theme') || 'system',", "const DISP = { palette: lsGet('palette') || 'classic', theme: lsGet('theme') || 'system',")
swap("  r.classList.toggle('rm', DISP.rm); r.classList.toggle('hc', DISP.hc);", "  r.classList.toggle('rm', DISP.rm); r.classList.toggle('hc', DISP.hc); applyPalette();")
swap("""setDisp('theme', k)}>${l}</button>`)}</div></div>""", """setDisp('theme', k)}>${l}</button>`)}</div></div>
    <${PaletteChooser}/>""")
swap(".r-card .days{font-size:14px;color:var(--ink-2)}", """.r-card .days{font-size:14px;color:var(--ink-2)}
.hdr-space{height:calc(env(safe-area-inset-top,0px) + 14px)}
.topsw{display:flex;gap:22px;margin:2px 0 4px}
.topsw button{font-family:var(--display);font-size:30px;font-weight:700;text-transform:uppercase;letter-spacing:.01em;color:var(--ink-3);padding:2px 0 6px;border-bottom:3px solid transparent}
.topsw button.on{color:var(--ink);border-bottom-color:var(--accent)}
.tip-card{display:flex;align-items:flex-start;gap:6px;background:var(--surface);border-radius:12px;padding:10px 6px 10px 14px;font-size:14px;color:var(--ink-2);line-height:1.4}
.tip-x{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--ink-3);flex:none;margin-top:-5px}
.tip-x svg{width:16px;height:16px}
.help-foot{display:flex;justify-content:center;margin:28px 0 4px}
.help-q{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1.5px solid currentColor;font-size:12px;font-weight:700;line-height:1}
.sync-line{margin:10px 0 0;font-size:13.5px}
.pal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pal{display:flex;flex-direction:column;align-items:flex-start;gap:4px;background:var(--raised);border-radius:12px;padding:10px 12px;text-align:left;border:2px solid transparent}
.pal.on{border-color:var(--ink)}
.pal .sw{display:flex;gap:4px}.pal .sw i{width:18px;height:18px;border-radius:50%;display:block}
.pal .pn{font-weight:600;font-size:14.5px}.pal .pd{font-size:12px;color:var(--ink-2);line-height:1.3}
.fb-details{white-space:pre-wrap;word-break:break-word;font-size:12px;background:var(--raised);border-radius:10px;padding:10px;color:var(--ink-2);margin:0;max-height:140px;overflow:auto}
a.btn{text-decoration:none}a.btn.disabled{opacity:.45;pointer-events:none}
.tour{position:fixed;inset:0;z-index:90}
.tour-dim{position:absolute;inset:0;background:rgba(0,0,0,.62)}
.tour-hole{position:absolute;border-radius:14px;box-shadow:0 0 0 3px var(--accent),0 0 0 9999px rgba(0,0,0,.62);transition:left .25s,top .25s,width .25s,height .25s;pointer-events:none}
.tour-card{position:absolute;left:12px;right:12px;max-width:560px;margin:0 auto;background:var(--surface);color:var(--ink);border-radius:18px;padding:14px 16px 16px;box-shadow:0 12px 36px rgba(0,0,0,.4)}
.tour-card.top{top:calc(env(safe-area-inset-top,0px) + 12px)}
.tour-card.bottom{bottom:calc(env(safe-area-inset-bottom,0px) + 12px)}
.tour-card.mid{top:50%;transform:translateY(-50%)}
.tour-card h2{font-family:var(--display);font-size:24px;font-weight:700;text-transform:uppercase;line-height:1.05;margin-top:4px}
:root.rm .tour-hole{transition:none}
.slot-pick{display:flex;flex-direction:column;gap:6px}
.slot-btn{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;background:var(--raised);text-align:left;border:2px solid transparent}
.slot-btn.on{border-color:var(--ink)}
.slot-btn i{width:28px;height:28px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.slot-btn b{display:block;font-size:15px}.slot-btn .d{font-size:12.5px;color:var(--ink-2)}
.wheel{position:relative;margin:14px auto 0;touch-action:none;cursor:crosshair;user-select:none;-webkit-user-select:none}
.wheel canvas,.wheel svg{position:absolute;inset:0;width:100%;height:100%}
.wheel .wl{stroke-width:3;stroke-linecap:round}
.wheel .wl.main{stroke:#fff;filter:drop-shadow(0 0 1.5px rgba(0,0,0,.9))}
.wheel .wl.sug{stroke:#fff;stroke-dasharray:5 5;opacity:.9;filter:drop-shadow(0 0 1.5px rgba(0,0,0,.9))}
.wheel .wc{fill:#fff;stroke:rgba(0,0,0,.6);stroke-width:1.5}
.wheel .wd-main{stroke:#fff;stroke-width:4;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))}
.wheel .wd-sug{stroke:#fff;stroke-width:2.5;filter:drop-shadow(0 0 2px rgba(0,0,0,.7))}
.sug-sw{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--line)}
.cw-v{width:100%;accent-color:var(--ink-2)}
.cw-prev{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
.cw-prev .btn{min-height:40px;padding:8px 16px}
@media (prefers-reduced-motion: reduce){.tour-hole{transition:none}}""")

# 11. Sheet handles work: drag the bar down to close the sheet, up to make it full height (tap toggles the size).
a = src.index('function Sheet({ children, label }) {'); b = src.index('function Sparkline(', a)
src = src[:a] + r"""function Sheet({ children, label }) {
  const ref = useRef(null); const drag = useRef(null); const last = useRef(0); const [big, setBig] = useState(false);
  const down = e => { const el = ref.current; if (!el) return; drag.current = { y: e.clientY, t: Date.now(), h: el.getBoundingClientRect().height, dy: 0 }; last.current = 0; el.style.transition = 'none';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} };
  const move = e => { const d = drag.current, el = ref.current; if (!d || !el) return; const dy = e.clientY - d.y; d.dy = dy;
    if (dy >= 0) { el.style.transform = 'translateY(' + dy + 'px)'; el.style.height = ''; el.style.maxHeight = ''; }
    else { el.style.transform = ''; el.style.maxHeight = 'none'; el.style.height = Math.min(innerHeight - 12, d.h - dy) + 'px'; } };
  const up = () => { const d = drag.current, el = ref.current; drag.current = null; if (!d || !el) return; const dy = d.dy; last.current = dy;
    const fast = dy / Math.max(1, Date.now() - d.t) > 0.6;
    el.style.transition = 'transform .2s ease, height .2s ease';
    if (dy > 140 || (dy > 30 && fast && !big) || (dy > 30 && fast && big && dy > 90)) { el.style.transform = 'translateY(' + (el.offsetHeight + 40) + 'px)'; setTimeout(closeSheet, 180); return; }
    el.style.transform = ''; el.style.height = ''; el.style.maxHeight = '';
    if (dy < -40) setBig(true); else if (dy > 40 && big) setBig(false); };
  const tap = () => { if (Math.abs(last.current) < 6) setBig(!big); last.current = 0; };
  return html`<div class="scrim" onClick=${e => { if (e.target === e.currentTarget) closeSheet(); }}>
    <div ref=${ref} class=${'sheet' + (big ? ' big' : '')} role="dialog" aria-modal="true" aria-label=${label || 'Panel'}>
      <button class="grab-zone" aria-label=${big ? 'Make this panel smaller' : 'Make this panel full height'} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onClick=${tap}><span class="grab"></span></button>${children}</div></div>`;
}
""" + src[b:]
swap(".grab{width:40px;height:5px;border-radius:3px;background:var(--line);margin:4px auto 10px}",
     ".grab{display:block;width:40px;height:5px;border-radius:3px;background:var(--line);margin:4px auto 10px}\n.grab-zone{display:block;width:100%;margin:-8px 0 0;padding:8px 0 2px;background:none;touch-action:none;cursor:grab}\n.grab-zone:active{cursor:grabbing}.grab-zone:active .grab{background:var(--ink-3)}\n.sheet.big{max-height:calc(100% - env(safe-area-inset-top,0px) - 12px);height:calc(100% - env(safe-area-inset-top,0px) - 12px)}")

for need in ['function applyDisplay', 'function showToast']:
    if need not in src:
        sys.exit('missing ' + need)
open('app.html', 'w', encoding='utf8').write(src)
print('app.html written', len(src.encode()) // 1024, 'KB')
