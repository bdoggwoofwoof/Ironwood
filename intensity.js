/* ============ Rep focus and intensity plans (Nov 16, Newt) ============
   Rep focus: any plan can be set to Strength or Size (hypertrophy). Workouts then start with those rep ranges in place of
   the written ones: main compound lifts and the rest each get their own range. settings.focus = { plan id: 'strength' | 'size' }.
   Intensity plans: built-in plans built on drop sets and on taking sets to failure. A plan item can carry dl (drops already
   set up on its last set) so the drops are there when the workout starts. */
const FOCUS = {
  strength: ['Strength', 'Main lifts 3–5 reps, others 6–8. Heavier, with 2–3 minutes of rest on the main lifts.', { m: '3-5', a: '6-8', rm: 150, ra: 90 }],
  size: ['Size', 'Main lifts 6–10 reps, others 10–15. Moderate weight, 60–90 seconds of rest, close to failure.', { m: '6-10', a: '10-15', rm: 90, ra: 75 }] };
const COMPOUND = /squat|deadlift|bench|press|\brow|pull-?up|chin-?up|lunge|hip thrust|\bdips?\b|clean|snatch|pulldown/;
const ISOLATION = /lateral|raise|fly|curl|extension|pushdown|kickback|shrug|crunch|calf|face pull|pullover|crossover/;
const planFocus = rid => ((S.meta.settings.focus || {})[rid]) || '';
/* Main lift: a multi-joint movement in the exercise data (Nov 17), else the old name test */
const MAIN_PATS = ['hpush', 'incline', 'vpush', 'dip', 'hpull', 'vpull', 'squat', 'legpress', 'lunge', 'hinge', 'hipext'];
const isMainLift = ex => { const e = getEx(ex); if (e && e.pat) return MAIN_PATS.includes(e.pat[0]); const n = norm(exName(ex)); return COMPOUND.test(n) && !ISOLATION.test(n); };
function focusItem(it, f) { if (!f || !FOCUS[f] || isMeasured(exKind(it.ex))) return it; const main = isMainLift(it.ex); return { ...it, reps: FOCUS[f][2][main ? 'm' : 'a'], rest: FOCUS[f][2][main ? 'rm' : 'ra'] }; }
function focusDay(r, d) { const f = r && d ? planFocus(r.id) : ''; return f ? { ...d, items: d.items.map(it => focusItem(it, f)) } : d; }
function setFocus(rid, f) {
  commit(st => { const m = { ...(st.meta.settings.focus || {}) }; if (f) m[rid] = f; else delete m[rid]; st.meta.settings.focus = m; }, 'meta');
  showToast({ kind: 'info', text: f ? 'Workouts from this plan start with ' + FOCUS[f][0].toLowerCase() + ' rep ranges.' : 'Back to the plan’s own rep ranges.' });
}
function FocusRow({ r }) {
  if (!r.days.some(d => d.items.some(it => !isMeasured(exKind(it.ex))))) return null;
  const f = planFocus(r.id);
  return html`<div class="card" id="focus-row" style="margin-top:10px"><div class="row"><span style="font-weight:700;flex:1">Rep focus</span></div>
    <div class="seg wide" role="group" aria-label="Rep focus" style="margin-top:6px">${[['', 'As written'], ['strength', 'Strength'], ['size', 'Size']].map(([k, l]) => html`<button key=${k || 'none'} id=${'focus-' + (k || 'none')} class=${f === k ? 'on' : ''} aria-pressed=${f === k} onClick=${() => setFocus(r.id, k)}>${l}</button>`)}</div>
    <p class="small muted" style="margin-top:6px">${f ? FOCUS[f][1] : 'Uses the rep ranges written in the plan. Pick Strength or Size to set every workout from this plan to that goal.'}</p></div>`;
}
/* Drops ready on the last set when a workout starts */
function presetDrops(slot, n, u) {
  const last = slot.sets[slot.sets.length - 1]; if (!last) return; const step = u === 'kg' ? 2.5 : 5; let w0 = num(last.w || last.gw);
  last.drops = Array.from({ length: n }, () => { const gw = w0 > 0 ? String(Math.max(0, Math.round(w0 * 0.8 / step) * step)) : ''; w0 = num(gw); return { id: uid('d'), w: '', r: '', gw, gr: '' }; });
}
/* ---- Intensity plans ---- */
const INTENSITY_PLANS = [
  ['bi-drop4', 'Drop Set Hypertrophy 4-Day', 'Upper/lower for size. Main lifts stay straight sets; most accessories end with a double drop set on the last set (about 20% lighter each drop, no rest). The drops are set up when you start.', [
    ['Upper A', ['Upper'], [['Bench Press', 3, '6-10', 'Straight sets, 2 min rest.'], ['Lat Pulldown', 3, '8-12', 'Last set: drop twice.', 2], ['Incline Dumbbell Press', 3, '10-12', 'Last set: drop twice.', 2], ['Seated Cable Row', 3, '10-12', 'Last set: drop once.', 1], ['Lateral Raises', 3, '12-15', 'Last set: drop twice.', 2], ['Tricep Pushdowns', 3, '12-15', 'Last set: drop twice.', 2]]],
    ['Lower A', ['Legs'], [['Back Squat', 3, '6-10', 'Straight sets, 2–3 min rest.'], ['Leg Press', 3, '10-12', 'Last set: drop twice.', 2], ['Lying Leg Curl', 3, '10-12', 'Last set: drop twice.', 2], ['Leg Extension', 3, '12-15', 'Last set: drop twice.', 2], ['Calf Raises', 3, '12-15', 'Last set: drop once.', 1]]],
    ['Upper B', ['Upper'], [['Overhead Barbell Press', 3, '6-10', 'Straight sets, 2 min rest.'], ['Barbell Row', 3, '8-10', ''], ['Cable Fly', 3, '12-15', 'Last set: drop twice.', 2], ['Face Pulls', 3, '15', 'Last set: drop once.', 1], ['Dumbbell Curl', 3, '10-12', 'Last set: drop twice.', 2], ['Hammer Curls', 2, '10-12', 'Last set: drop once.', 1]]],
    ['Lower B', ['Legs'], [['Romanian Deadlift', 3, '8-10', 'Straight sets.'], ['Bulgarian Split Squat', 3, '10', 'Each leg.'], ['Leg Extension', 3, '12-15', 'Last set: drop twice.', 2], ['Lying Leg Curl', 3, '12-15', 'Last set: drop once.', 1], ['Calf Raises', 4, '12-15', 'Last set: drop twice.', 2]]]], 'Drop sets · 4 days a week'],
  ['bi-failure3', 'Failure Focus 3-Day', 'Fewer, harder sets: after warm-ups, 1–2 working sets per exercise taken to failure (no more clean reps). Machines and cables where you can, so failure is safe. Rest 2–3 minutes; stop a set when form breaks.', [
    ['Push', ['Push'], [['Incline Dumbbell Press', 2, '6-10', 'To failure. Spotter or safeties on barbell work.'], ['Dumbbell Bench Press', 1, '8-12', 'To failure.'], ['Cable Fly', 2, '10-15', 'To failure.'], ['Lateral Raises', 2, '12-20', 'To failure, then 5 partial reps.'], ['Tricep Pushdowns', 2, '10-15', 'To failure.']]],
    ['Pull', ['Pull'], [['Lat Pulldown', 2, '6-10', 'To failure.'], ['Seated Cable Row', 2, '8-12', 'To failure.'], ['Face Pulls', 1, '15-20', 'To failure.'], ['Dumbbell Curl', 2, '8-12', 'To failure.'], ['Hammer Curls', 1, '10-12', 'To failure, then drop once.', 1]]],
    ['Legs', ['Legs'], [['Leg Press', 2, '8-12', 'To failure. Keep the lower back on the pad.'], ['Lying Leg Curl', 2, '10-12', 'To failure.'], ['Leg Extension', 2, '12-15', 'To failure, then drop once.', 1], ['Calf Raises', 2, '12-20', 'To failure, 2 s pause at the bottom.']]]], 'To failure · 3 days a week'],
  ['bi-pump-finisher', 'Arm and Shoulder Drop Set Finisher', 'Ten minutes to finish any workout: three exercises, each one set with two drops. Go to failure on every drop.', [['Dumbbell Curl', 1, '10-12', 'Then drop twice, to failure each time.', 2], ['Tricep Pushdowns', 1, '12-15', 'Then drop twice.', 2], ['Lateral Raises', 1, '12-15', 'Then drop twice.', 2]], 'Drop sets · one day'],
];
for (const [id, name, note, days, meta] of INTENSITY_PLANS) {
  const multi = Array.isArray(days[0][2]);
  const ds = (multi ? days : [[name, ['Arms'], days]]).map(([dn, tags, items], i) => { const d = planDay(id, i + 1, dn, tags, items.map(x => x.slice(0, 4))); items.forEach((x, j) => { if (x[4]) d.items[j].dl = x[4]; }); return d; });
  BUILTIN_ROUTINES.push({ id, name, note, source: 'builtin', meta, days: ds, intensity: true });
}
