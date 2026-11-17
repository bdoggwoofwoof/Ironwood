/* ============ Programs: personal vs library, families, program facts, smart swaps (Nov 17, 2026) ============
   Plans fall into three states: Personal (Newt's programs and anything you build, copy or import), Library (curated
   general programs in three families: Full Body, Upper / Lower, Push / Pull / Legs, plus the specialty shelves), and
   Archived (retired library plans, plans you archived or removed). Nothing is deleted: a retired or archived plan still
   opens, can be followed, and its workouts stay in history.
   Program facts (sessions a week, minutes, equipment, weekly sets per muscle) are worked out from the exercise data in
   exlib.js, so they stay right when a plan is edited. */
const FAMILIES = [
  ['fb', 'Full Body', 'Every muscle two or three times a week on three days. The simplest place to start.'],
  ['ul', 'Upper / Lower', 'Two upper and two lower days a week. Shorter workouts, every muscle twice a week.'],
  ['ppl', 'Push / Pull / Legs', 'Pressing, pulling and leg days in order. Six days for the most volume, or three days rotating.'],
];
/* Library programs: family, variant label, goal, experience, a new display name where one was renamed */
const PROG_INFO = {
  'bi-fb3': { fam: 'fb', variant: 'Main', goal: 'size', level: 'Beginner' },
  'bi-db3': { fam: 'fb', variant: 'Dumbbells only', goal: 'size', level: 'Beginner' },
  'gp-strength3': { fam: 'fb', variant: 'Strength', goal: 'strength', level: 'Beginner to intermediate', name: 'Full Body Strength 3-Day' },
  'bi-ul4': { fam: 'ul', variant: 'Main', goal: 'both', level: 'Intermediate' },
  'gp-bulk4': { fam: 'ul', variant: 'Hypertrophy', goal: 'size', level: 'Intermediate', name: 'Upper / Lower Hypertrophy' },
  'bi-ul4-strength': { fam: 'ul', variant: 'Strength', goal: 'strength', level: 'Intermediate' },
  'bi-drop4': { fam: 'ul', variant: 'Drop sets (advanced, optional)', goal: 'size', level: 'Advanced' },
  'bi-ppl6': { fam: 'ppl', variant: 'Main', goal: 'size', level: 'Intermediate' },
  'bi-ppl3': { fam: 'ppl', variant: '3-day rotating', goal: 'size', level: 'Beginner to intermediate' },
  'bi-heartwood': { goal: 'size', level: 'Intermediate' }, 'bi-growth-rings': { goal: 'size', level: 'Beginner to intermediate' },
  'bi-sapwood': { goal: 'size', level: 'Intermediate' },
  'bi-three-ring': { goal: 'size', level: 'Beginner to intermediate' }, 'bi-easy-grain': { goal: 'size', level: 'Beginner' },
  'bi-newt-4day': { goal: 'both', level: 'Intermediate' },
};
/* Retired from the library: near-copies of a family plan. They stay under Archived and keep working if followed. */
const RETIRED = {
  'bi-5x5': 'Folded into Full Body Strength 3-Day.', 'bi-tiered': 'Folded into Upper / Lower Strength.',
  'bi-split5': 'One-muscle-a-day splits now live in Personal (Heartwood Split).', 'bi-failure3': 'Low-volume to-failure training was an extra method, not a separate program.',
  'gp-recomp3': 'Same shape as Full Body 3-Day; Build my plan still fits it to a recomp.', 'gp-recomp4': 'Same shape as Upper / Lower 4-Day; Build my plan still fits it to a recomp.',
  'gp-cut3': 'Use Full Body 3-Day; Build my plan trims it for a cut.',
};
const GOAL_NAME = { size: 'Build muscle', strength: 'Get stronger', both: 'Muscle and strength' };
BUILTIN_ROUTINES.forEach(r => { const i = PROG_INFO[r.id]; if (i && i.name) { r.name = i.name; r.meta = i.level + ' · ' + r.days.length + ' days a week'; r.goalPlan = false; } });

const restoredRetired = id => !!((S.meta.settings.restored || {})[id]);
const isRetired = id => !!RETIRED[id] && !restoredRetired(id);
/* Which shelf a plan sits on */
function planGroup(r) {
  if (!r) return 'arch';
  if (r.archived) return 'arch';
  if (r.personal || !libBase(r.id)) return 'mine';
  if (isRetired(r.id)) return 'arch';
  const i = PROG_INFO[r.id]; if (i && i.fam) return i.fam;
  if (r.id === 'gp-hybrid') return 'run';
  if (r.info && r.info.fight) return 'fight';
  if (r.info && r.info.care) return 'care';
  if (r.info) return 'run';
  if (r.days.length === 1) return 'one';
  return 'lift';
}
const archivedRoutines = () => [...Object.values(S.meta.routines).filter(r => r.archived && !r.base),
  ...BUILTIN_ROUTINES.filter(r => isHidden(r.id) || isRetired(r.id)).map(r => libOver(r.id) || r)];
function archivePlan(r) {
  const lib = !!libBase(r.id);
  if (programId() === r.id) commit(st => { st.meta.settings.program = null; }, 'meta');
  if (addonIds().includes(r.id)) setAddon(r.id, false);
  commit(st => { if (lib) st.meta.hidden = [...new Set([...(st.meta.hidden || []), r.id])]; else if (st.meta.routines[r.id]) st.meta.routines[r.id].archived = true; }, 'meta');
  showToast({ kind: 'info', ms: 8000, text: r.name + ' archived. Find it under Plans → Archived.', action: 'Undo', fn: () => restorePlan(r) });
}
function restorePlan(r) {
  commit(st => {
    st.meta.hidden = (st.meta.hidden || []).filter(x => x !== r.id);
    if (st.meta.routines[r.id] && !libBase(r.id)) delete st.meta.routines[r.id].archived;
    if (RETIRED[r.id]) st.meta.settings.restored = { ...(st.meta.settings.restored || {}), [r.id]: 1 };
  }, 'meta');
  showToast({ kind: 'info', text: r.name + ' is back in Plans' });
}

/* ---------- Program facts ---------- */
const exData = id => { const e = getEx(id); return e && e.pat ? e : null; };
/* Muscles an exercise trains: from the exercise data, else its one category */
const CAT_MUSCLE = { chest: 'chest', back: 'lats', shoulders: 'sidedelt', biceps: 'biceps', triceps: 'triceps', legs: 'quads', core: 'abs' };
function exMuscles(id) { const e = exData(id); if (e) return e.m; const c = CAT_MUSCLE[exCat(id)]; return c ? { [c]: 1 } : {}; }
function sessionsPerWeek(r) { return r.days.length === 1 ? 1 : Math.min(7, progDaysPerWeek(r)); }
/* Minutes: about 2½ minutes a working set with its rest, plus 5 to warm up (the same budget Build my plan uses) */
const dayMinutes = d => 5 + d.items.reduce((t, it) => t + (isMeasured(exKind(it.ex)) ? (+((it.tg || {}).dur) || 300) / 60 * (+it.sets || 1) + 1 : 2.5 * (+it.sets || 1)), 0);
function minutesText(r) {
  const ms = r.days.filter(d => d.items.length).map(dayMinutes); if (!ms.length) return '';
  const r5 = m => Math.max(10, Math.round(m / 5) * 5); const lo = r5(Math.min(...ms)), hi = r5(Math.max(...ms));
  return lo === hi ? 'about ' + lo + ' min' : lo + '–' + hi + ' min';
}
/* Weekly sets per muscle: direct sets count 1, helper sets ½ (fractional counting) */
function weeklySets(r) {
  const out = {}; const k = sessionsPerWeek(r) / Math.max(1, r.days.length);
  for (const d of r.days) for (const it of d.items) { if (isMeasured(exKind(it.ex)) && exKind(it.ex) !== 'timed') continue;
    for (const [m, w] of Object.entries(exMuscles(it.ex))) out[m] = (out[m] || 0) + (+it.sets || 0) * w * k; }
  return out;
}
const EQ_ORDER = ['barbell', 'rack', 'dumbbell', 'bench', 'cable', 'machine', 'bar', 'kettlebell', 'band'];
function planEquipment(r) {
  const s = new Set(); for (const d of r.days) for (const it of d.items) { const e = exData(it.ex); if (e) e.eq.forEach(x => { if (x !== 'bodyweight') s.add(x); }); }
  return EQ_ORDER.filter(x => s.has(x)).map(x => EQUIP[x]);
}
const COVER_ROWS = [['chest', 'Chest'], ['lats', 'Lats'], ['upperback', 'Upper back'], ['sidedelt', 'Side delts'], ['reardelt', 'Rear delts'], ['biceps', 'Biceps'], ['triceps', 'Triceps'],
  ['quads', 'Quads'], ['hamstrings', 'Hamstrings'], ['glutes', 'Glutes'], ['calves', 'Calves'], ['abs', 'Abs and core']];
const isLiftPlan = r => r && !r.info && r.days.some(d => d.items.some(it => !isMeasured(exKind(it.ex)) && exData(it.ex)));
/* One line for cards and sheets: "Build muscle · 4 days a week · 35–45 min" */
function planFactsLine(r) {
  const i = PROG_INFO[r.id] || {}; const n = sessionsPerWeek(r);
  return [i.goal ? GOAL_NAME[i.goal] : '', r.days.length > 1 ? n + ' days a week' : '', minutesText(r)].filter(Boolean).join(' · ');
}
/* Plain-language guidance shown on every lifting plan */
function progressionText(r) {
  const u = U(); const inc = +S.meta.settings.inc || UNIT_DEFAULTS[u].inc;
  return [
    'Each exercise has a rep range, like 8–12. Start with a weight you can lift for the bottom of the range with good form.',
    'When you reach the top of the range on every set, Ironwood adds weight next time: ' + fmt(inc * 2) + ' ' + u + ' on barbell and machine squats, leg presses, deadlifts and hip thrusts, ' + fmt(inc) + ' ' + u + ' on everything else. Until then, aim for one more rep than last time.',
    'If the heavier weight is too much, it suggests half the jump. After three workouts in a row stuck at one weight, it suggests about 10% lighter so you can build back up.',
    'Pull-ups, dips and other bodyweight moves add reps instead. Once you pass the top of the range, add a little weight.',
  ];
}
function restText(r) {
  if (r.id === 'bi-drop4' || r.id === 'bi-pump-finisher') return 'Main lifts: 2 minutes. Drops: no rest between drops, then about 2 minutes before the next set.';
  const i = PROG_INFO[r.id] || {};
  if (i.goal === 'strength') return 'Heavy lifts (5 reps or fewer): 2–3 minutes. Everything else: 1–2 minutes. The rest timer starts on its own after each set.';
  return 'Big lifts: about 2 minutes. Smaller and machine lifts: 1–1½ minutes. The rest timer starts on its own after each set; change it with Keep on the timer.';
}
function effortText(r) {
  if (r.id === 'bi-drop4' || r.id === 'bi-pump-finisher') return 'Straight sets: stop with 1–2 good reps left. Drops: go until the reps slow right down.';
  const i = PROG_INFO[r.id] || {};
  if (i.goal === 'strength') return 'Heavy sets: stop with 1–2 good reps left, never grinding. Lighter sets: 1–3 reps left.';
  return 'Most sets: stop with 1–3 good reps left in the tank. On the last set of smaller lifts (curls, raises, pushdowns) you can go until the reps slow right down.';
}
/* Facts card at the top of a plan page */
function ProgramFacts({ r }) {
  if (!isLiftPlan(r)) return null;
  const i = PROG_INFO[r.id] || {}; const eq = planEquipment(r);
  const rows = [['Goal', i.goal ? GOAL_NAME[i.goal] : ''], ['Experience', i.level || ''], ['How often', r.days.length > 1 ? sessionsPerWeek(r) + ' days a week' : 'One workout'],
    ['Each workout', minutesText(r)], ['Equipment', eq.length ? eq.join(', ') : 'Bodyweight']].filter(x => x[1]);
  return html`<div class="card" id="plan-facts" style="margin-top:10px">${rows.map(([k, v]) => html`<div key=${k} class="row small" style="min-height:28px"><span class="muted" style="flex:0 0 96px">${k}</span><span style="flex:1;min-width:0">${v}</span></div>`)}</div>`;
}
/* How the plan works: coverage, progression, rest, effort (below the days) */
function ProgramGuide({ r }) {
  if (!isLiftPlan(r)) return null;
  const ws = weeklySets(r); const none = COVER_ROWS.filter(([k]) => !(ws[k] >= 1)).map(x => x[1]);
  return html`<div id="plan-guide">
    <div class="section-h"><h2>Muscle coverage</h2><span class="aside">Sets a week</span></div>
    <div class="card" id="plan-cover">${COVER_ROWS.map(([k, l]) => html`<div key=${k} class="row small" style="min-height:26px"><span style="flex:1">${l}</span><b class="num">${ws[k] >= 1 ? fmt(Math.round(ws[k] * 2) / 2) : '–'}</b></div>`)}
      <p class="small muted" style="margin-top:6px">${none.length ? 'Not trained directly: ' + none.join(', ') + '. ' : ''}Helper work counts as half a set (a bench press is half a triceps set). Around 10 sets a week per muscle is a good target for growth; fewer still works.</p></div>
    <div class="section-h"><h2>How to progress</h2></div>
    <div class="card" id="plan-progress"><ul class="run-ul">${progressionText(r).map((t, k) => html`<li key=${k}>${t}</li>`)}</ul></div>
    <div class="section-h"><h2>Rest and effort</h2></div>
    <div class="card" id="plan-effort"><p class="small"><b>Rest:</b> ${restText(r)}</p><p class="small" style="margin-top:6px"><b>Effort:</b> ${effortText(r)}</p></div></div>`;
}

/* ---------- Smart swaps ----------
   Alternatives keep the purpose of the exercise: the same main movement first (a leg extension → other knee
   extensions), then close cousins, ranked by how alike the muscles are, then by easier setup and what you already do. */
function muscleSim(a, b) {
  let dot = 0, na = 0, nb = 0; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k] || 0, y = b[k] || 0; dot += x * y; na += x * x; nb += y * y; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
const hasHistory = id => sessionList().some(s => (s.items || []).some(it => it.ex === id && it.sets && it.sets.length));
const topMuscles = e => Object.entries(e.m).filter(([, w]) => w >= 1).map(([k]) => MUSCLES[k] || k);
function swapCandidates(exId, f = {}) {
  const o = exData(exId); const out = [];
  for (const c of Object.values(allEx())) {
    if (c.id === exId || !c.pat) continue;
    let score = 0, why = '';
    if (o) {
      const same = c.pat[0] === o.pat[0], near = (PATTERN_NEAR[o.pat[0]] || []).includes(c.pat[0]) || c.pat.includes(o.pat[0]);
      if (same) { score = 100; why = 'Same movement: ' + PATTERNS[o.pat[0]]; }
      else if (near && f.move !== 'same') { score = 45; why = 'Close movement: ' + PATTERNS[c.pat[0]] + ' instead of ' + PATTERNS[o.pat[0]]; }
      else if (f.move === 'any' && muscleSim(o.m, c.m) > 0.3) { score = 10; why = 'Works some of the same muscles'; }
      else continue;
      const sim = muscleSim(o.m, c.m); score += sim * 40;
      const tm = topMuscles(c); if (sim > 0.6 && tm.length) why += '; works ' + tm.slice(0, 2).join(' and ').toLowerCase();
    } else {
      if (exCat(c.id) !== exCat(exId)) continue; score = 20; why = 'Same body part (' + (CATS[exCat(exId)] || 'Other') + ')';
    }
    if (f.eq && !c.eq.includes(f.eq)) continue;
    if (f.muscle && !(c.m[f.muscle] >= 1)) continue;
    if (f.setup && c.setup > 1) continue;
    const star = isStarEx(c.id), done = hasHistory(c.id);
    if (f.pref && !star && !done) continue;
    score += (3 - (c.setup || 2)) * 2 + (star ? 8 : 0) + (done ? 6 : 0) + (o && c.kind === o.kind ? 2 : 0);
    if (star) why += '; one of your starred exercises'; else if (done) why += "; you've done it before";
    out.push({ ex: c, score, why });
  }
  return out.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name));
}
const exFacts = e => [e.eq.filter(x => x !== 'bodyweight').map(x => EQUIP[x]).join(' + ') || 'Bodyweight', SETUP[e.setup] || '', topMuscles(e).join(', '), PATTERNS[e.pat[0]] ? PATTERNS[e.pat[0]].replace(/^./, c => c.toUpperCase()) : ''].filter(Boolean).join(' · ');
function SwapSheet({ ex, title, onPick }) {
  const o = exData(ex); const [f, setF] = useState({ move: 'near' }); const set = (k, v) => setF({ ...f, [k]: f[k] === v ? '' : v });
  const list = swapCandidates(ex, f); const top = list.slice(0, 3), more = list.slice(3, 15);
  const mus = o ? Object.entries(o.m).filter(([, w]) => w >= 0.5).map(([k]) => k) : [];
  const chipRow = (label, k, opts) => html`<div><div class="lbl" style="margin-top:8px">${label}</div><div class="plan-chips" role="group" aria-label=${label}>${opts.map(([v, l]) => html`<button key=${v || 'any'} class=${'chip' + ((f[k] || '') === v ? ' on' : '')} aria-pressed=${(f[k] || '') === v} id=${'sw-' + k + '-' + (v || 'any')} onClick=${() => setF({ ...f, [k]: v })}>${l}</button>`)}</div></div>`;
  const row = (c, rec) => html`<button key=${c.ex.id} class="opt" id=${'swap-' + c.ex.id} onClick=${() => onPick(c.ex)}><div style="flex:1;min-width:0"><div>${c.ex.name}</div><div class="d">${c.why}</div><div class="d">${exFacts(c.ex)}</div></div></button>`;
  return html`<${Sheet} label=${title || 'Swap exercise'}><h2>${title || 'Swap exercise'}</h2>
    <p class="note" id="swap-for">${o ? exName(ex) + ': ' + exFacts(o) + '. Suggestions keep that movement.' : exName(ex) + ' has no movement data yet, so these are the same body part.'}</p>
    ${chipRow('Equipment', 'eq', [['', 'Any'], ['machine', 'Machine'], ['cable', 'Cable'], ['dumbbell', 'Dumbbells'], ['barbell', 'Barbell'], ['bodyweight', 'Bodyweight']])}
    ${o ? chipRow('Movement', 'move', [['same', 'Same movement'], ['near', 'Same or close'], ['any', 'Any that share muscles']]) : null}
    ${mus.length > 1 ? chipRow('Muscle', 'muscle', [['', 'Any'], ...mus.map(m => [m, MUSCLES[m]])]) : null}
    ${chipRow('Setup and preference', 'setup', [['', 'Any setup'], ['easy', 'Easy setup']])}
    <div class="plan-chips" role="group" aria-label="Preference" style="margin-top:6px"><button class=${'chip' + (f.pref ? ' on' : '')} aria-pressed=${!!f.pref} id="sw-pref" onClick=${() => set('pref', 'mine')}>Starred or done before</button></div>
    <div class="section-h"><h2>${top.length ? 'Recommended' : 'No matches'}</h2></div>
    <div id="swap-top">${top.map(c => row(c, true))}</div>
    ${!top.length ? html`<p class="note">Nothing fits these filters. Loosen one, or browse every exercise.</p>` : null}
    ${more.length ? html`<div class="section-h"><h2>More matches</h2></div><div id="swap-more">${more.map(c => row(c, false))}</div>` : null}
    <button class="btn wide" id="swap-all" style="margin-top:12px" onClick=${() => openSheet({ type: 'pick', title: title || 'Swap exercise', onPick })}>Browse all exercises</button><//>`;
}

/* ---------- Library filters (Plans → Library) ---------- */
const LIB_F = { goal: '', days: '', eq: '' };
function libPass(r) {
  const i = PROG_INFO[r.id] || {}; const n = sessionsPerWeek(r);
  if (LIB_F.goal && !(i.goal === LIB_F.goal || i.goal === 'both')) return false;
  if (LIB_F.days && n !== +LIB_F.days) return false;
  if (LIB_F.eq === 'db' && planEquipment(r).some(x => x !== 'Dumbbells' && x !== 'Bench')) return false;
  return true;
}
function LibFilters({ re }) {
  const row = (k, label, opts) => html`<div class="plan-chips" role="group" aria-label=${label} style="margin-top:6px">${opts.map(([v, l]) => html`<button key=${v || 'any'} class=${'chip' + (LIB_F[k] === v ? ' on' : '')} aria-pressed=${LIB_F[k] === v} id=${'lf-' + k + '-' + (v || 'any')} onClick=${() => { LIB_F[k] = v; re(); }}>${l}</button>`)}</div>`;
  return html`<div id="lib-filters">${row('goal', 'Goal', [['', 'Any goal'], ['size', 'Build muscle'], ['strength', 'Get stronger']])}${row('days', 'Days a week', [['', 'Any days'], ['3', '3 days'], ['4', '4 days'], ['6', '6 days']])}${row('eq', 'Equipment', [['', 'Full gym'], ['db', 'Dumbbells only']])}</div>`;
}
