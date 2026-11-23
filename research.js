/* Research-backed training aids (Nov 22, Newt: "make plans and start implementation").
   1. Reps left: one tap on the last set of an exercise records how many more reps you could have done. Lifters tend to
      guess about one rep low (Halperin 2022), so a calibration set every 4 weeks on a safe machine or cable lift
      compares the guess with a set taken to failure, and the average gap adjusts later readings.
      Next-weight suggestions use it: top of the range with 3+ to spare gets a double jump; short of the range with
      3+ to spare says push closer.
   2. Sets by muscle in Progress: what you actually logged per muscle this week and last, with helper work counted as
      half a set (Pelland 2024), beside what your plan calls for, flagging muscles that fell short.
   3. Busy week: one tap for a week of about a third of the sets at the same weights, enough to keep size and strength
      for weeks (Spiering 2021; Bickel 2011). Ends by itself on Monday.
   4. Warm-up: lighter ramp-up sets before the first big lift, shown as a line, not logged as work sets.
   5. Swaps: exercises that load the muscle at a long length get a small nudge in the ranking (Wolf 2023; early evidence). */

/* ---- 1. Reps left ---- */
const askRir = () => S.meta.settings.askRir !== false;
const RIR_OPTS = [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4+']];
const CALIB_DAYS = 28;
/* Calibrations from history: guess (g) at the top of the range (gt) against what the set to failure showed (r - gt) */
function rirCalibrations() {
  const out = []; for (const s of sessionList()) for (const it of s.items || []) for (const x of it.sets || []) if (x.g != null && x.gt) out.push({ t: s.startedAt, ex: it.ex, guess: +x.g, actual: Math.max(0, +x.r - +x.gt) });
  return out;
}
/* Average reps you had left beyond your guess (positive = you guess low); uses the last five calibrations */
function rirBias() { const c = rirCalibrations().slice(-5); if (!c.length) return 0; return c.reduce((a, x) => a + (x.actual - x.guess), 0) / c.length; }
const adjRir = v => v == null ? null : Math.max(0, v + Math.max(0, Math.round(rirBias())));
const calibOk = ex => { const e = exData(ex); return !!(e && (e.eq.includes('machine') || e.eq.includes('cable')) && !e.eq.includes('barbell') && !isMainLift(ex)); };
function pickCalib(a) {
  if (!a || !askRir() || S.meta.settings.calib === false) return;
  const last = rirCalibrations().slice(-1)[0]; if (last && Date.now() - last.t < CALIB_DAYS * DAY) return;
  const cand = a.items.filter(it => !isMeasured(exKind(it.ex)) && repTop(it.target.reps) && calibOk(it.ex)); if (!cand.length) return;
  cand[cand.length - 1].target.calib = true;
}
function RirRow({ it, s, j }) {
  if (!askRir() || isMeasured(exKind(it.ex)) || j !== it.sets.length - 1) return null;
  const done = isDone(s); const top = repTop(it.target.reps); const calib = it.target.calib && top;
  const pick = (k, v) => { s[k] = s[k] === v ? null : v; touch(); };
  if (calib && (!done || s.g != null)) {
    if (!done) return html`<div class="rir-row" id=${'rir-cal-' + it.id} style="margin:4px 0 8px"><p class="small"><b>Calibration set.</b> When you reach ${top} reps, how many more do you think you could do? Pick a guess, then keep going until you can’t do another rep, and log them all.</p>
      <div class="plan-chips" role="group" aria-label="Your guess: reps left at the top of the range" style="margin-top:6px">${RIR_OPTS.map(([v, l]) => html`<button key=${v} class=${'chip' + (s.g === v ? ' on' : '')} aria-pressed=${s.g === v} onClick=${() => pick('g', v)}>${l}</button>`)}</div></div>`;
    const actual = Math.max(0, Math.round(num(s.r)) - top); const diff = actual - s.g;
    return html`<p class="small muted" id=${'rir-cal-res-' + it.id} style="margin:4px 0 8px">You guessed ${s.g} left at ${top} reps and had ${actual}. ${diff >= 2 ? 'Most lifters guess low like this, so your sets can go a little closer to failure.' : diff <= -2 ? 'You guessed high, so you’re already pushing hard; keep your estimates honest.' : 'Spot on.'} Ironwood uses this to read your reps-left answers.<${Cite} k=${['halperin']} sec="effort"/></p>`;
  }
  if (!done) return null;
  return html`<div class="rir-row" id=${'rir-' + it.id} style="margin:2px 0 8px"><span class="small muted">Reps left on this set?</span>
    <div class="plan-chips" role="group" aria-label=${'Reps left on the last set of ' + exName(it.ex)} style="margin-top:4px">${RIR_OPTS.map(([v, l]) => html`<button key=${v} class=${'chip' + (s.rir === v ? ' on' : '')} aria-pressed=${s.rir === v} onClick=${() => pick('rir', v)}>${l}</button>`)}</div></div>`;
}
/* Saved with the set: ri = reps left, g = calibration guess, gt = the rep count it was made at */
function rirSaveFields(it, x, o) { if (x.rir != null) o.ri = x.rir; if (x.g != null && it.target && it.target.calib && repTop(it.target.reps)) { o.g = x.g; o.gt = repTop(it.target.reps); } return o; }

/* ---- 2. Sets by muscle, from what you logged ---- */
function loggedMuscleSets(from, to) {
  const out = {}; for (const s of sessionList()) { if (s.startedAt < from || s.startedAt >= to || s.kind === 'activity') continue;
    for (const it of s.items || []) { if (isMeasured(exKind(it.ex)) && exKind(it.ex) !== 'timed') continue; const n = (it.sets || []).length; if (!n) continue;
      for (const [m, w] of Object.entries(exMuscles(it.ex))) out[m] = (out[m] || 0) + n * w; } }
  return out;
}
function MuscleWeek() {
  const w0 = +startOfWeek(new Date()); const wk = 7 * DAY;
  const now = loggedMuscleSets(w0, w0 + wk), last = loggedMuscleSets(w0 - wk, w0);
  const pid = programId(); const r = pid && pid !== 'self' ? getRoutine(pid) : null; const plan = r && isLiftPlan(r) ? weeklySets(r) : null;
  const h = v => v >= 0.5 ? fmt(Math.round(v * 2) / 2) : '–';
  const short = plan ? COVER_ROWS.filter(([k]) => (plan[k] || 0) >= 6 && (last[k] || 0) < plan[k] * 0.7) : [];
  const anyLast = Object.keys(last).length;
  return html`<div class="card" id="muscle-week" style="margin-bottom:12px">
    <div class="row small" style="min-height:26px"><span style="flex:1" class="muted">Muscle</span><span class="muted" style="width:62px;text-align:right">This week</span><span class="muted" style="width:62px;text-align:right">Last week</span>${plan ? html`<span class="muted" style="width:52px;text-align:right">Plan</span>` : null}</div>
    ${COVER_ROWS.map(([k, l]) => html`<div key=${k} class="row small" style="min-height:26px"><span style="flex:1">${l}</span><b class="num" style="width:62px;text-align:right">${h(now[k] || 0)}</b><span class="num" style="width:62px;text-align:right">${h(last[k] || 0)}</span>${plan ? html`<span class="num muted" style="width:52px;text-align:right">${h(plan[k] || 0)}</span>` : null}</div>`)}
    ${short.length && anyLast ? html`<p class="small" id="muscle-short" style="margin-top:8px"><b>Last week fell short:</b> ${short.map(([k, l]) => l + ' ' + h(last[k] || 0) + ' of ' + h(plan[k])).join(', ')}. Missed days add up; a busy-week plan or an extra set or two this week closes the gap.<${Cite} k=${['pelland']} sec="volume"/></p>` : null}
    <p class="small muted" style="margin-top:6px">Logged hard sets, with helper work counted as half a set (a bench press is half a triceps set).${plan ? ' Plan is what ' + r.name + ' calls for in a full week.' : ''} Around 10 or more a week per muscle suits growth.<${Cite} k=${['pelland']} sec="volume"/></p></div>`;
}

/* ---- 3. Busy week ---- */
const thisWeekKey = () => ymd(startOfWeek(new Date()));
const isBusy = () => S.meta.settings.busyWk === thisWeekKey();
const setBusy = on => commit(st => { st.meta.settings.busyWk = on ? thisWeekKey() : null; }, 'meta');
function applyBusy(a) {
  if (!a || !isBusy()) return;
  a.items.forEach(it => { if (isMeasured(exKind(it.ex))) return; const n = Math.max(1, Math.ceil(it.sets.length / 3)); it.sets = it.sets.slice(0, n); it.sets.forEach(x => { delete x.drops; }); it.target.sets = n; });
  a.busy = true;
}
function BusyWeek() {
  if (isBusy()) return html`<div class="hint" id="busy-on" style="margin-top:10px"><div style="flex:1;min-width:0">Busy week: each exercise uses about a third of its sets (at least one), at your usual weights. That keeps your size and strength. It ends on its own on Monday. <button class="btn text" id="busy-off" style="padding:0;min-height:0" onClick=${() => setBusy(false)}>Turn off</button><${Cite} k=${['spiering', 'bickel']} sec="busy"/></div></div>`;
  return html`<button class="btn text wide" id="busy-start" style="margin-top:6px" onClick=${() => openSheet({ type: 'confirm', title: 'Busy week?', body: 'For the rest of this week, each exercise uses about a third of its sets (at least one) at your usual weights. Research finds that keeps size and strength for weeks. It turns off on its own on Monday.', ok: 'Start busy week', onOk: () => { setBusy(true); closeSheet(); showToast({ kind: 'info', text: 'Busy week on until Monday' }); } })}>Busy week? Keep your gains on fewer sets</button>`;
}

/* ---- 4. Warm-up before the first big lift ---- */
const warmOn = () => S.meta.settings.warmups !== false;
function warmupLine(it) {
  if (!warmOn() || !S.active || isMeasured(exKind(it.ex)) || exKind(it.ex) === 'bodyweight' || exKind(it.ex) === 'assisted') return '';
  const first = S.active.items.find(x => !isMeasured(exKind(x.ex)) && isMainLift(x.ex)); if (first !== it || it.sets.some(isDone)) return '';
  const u = it.u || U(); const w = num(it.sets[0].gw || it.sets[0].w); const step = exKind(it.ex) === 'barbell' ? (u === 'kg' ? 2.5 : 5) * 2 : (u === 'kg' ? 2.5 : 5);
  const bar = exKind(it.ex) === 'barbell' ? +S.meta.settings.bar || (u === 'kg' ? 20 : 45) : 0;
  const rnd = v => Math.max(bar, Math.round(v / step) * step);
  if (!(w > 0)) return 'Warm up first: 2–3 lighter sets that build toward your first working weight (about 10, 5 and 3 reps).';
  const ws = [[0.4, 10], [0.6, 5], [0.8, 3]].map(([p, r]) => [rnd(w * p), r]).filter(([v], k, a) => v < w && (k === 0 || v > a[k - 1][0]));
  return ws.length ? 'Warm up first: ' + ws.map(([v, r]) => fmt(v) + ' × ' + r).join(', ') + ' ' + u + ', then your working sets.' : '';
}
function WarmupHint({ it }) { const t = warmupLine(it); return t ? html`<div class="hint" id=${'warm-' + it.id}><div style="flex:1;min-width:0">${t}<${Cite} k=${[]} sec="warmup" rule=${true}/></div></div>` : null; }

/* ---- 5. Long-muscle-length exercises (nudged up in swaps) ---- */
const LONG_EX = new Set(['Behind-the-Back Cable Lateral Raise', 'Cable Lateral Raise', 'Overhead Cable Tricep Extension', 'Dumbbell Overhead Tricep Extension', 'Incline Dumbbell Curl', 'Cable Fly',
  'Dumbbell Fly', 'Seated Leg Curl', 'Romanian Deadlift', 'Dumbbell Romanian Deadlift', 'Lat Pulldown', 'Dumbbell Pullover', 'Sissy Squat', 'Bulgarian Split Squat', 'Leg Press Calf Raise', 'Deficit Push-Up'].map(nameKey));
const isLongEx = c => LONG_EX.has(nameKey(c.name || exName(c.id)));

/* ---- 6. Is the plan working? (Progress → Numbers) ----
   For each muscle your plan works hard (8+ sets a week): sets you actually did a week over the last 4 weeks, how much
   stronger you got on lifts that train it directly (best estimated 1-rep max, first vs latest in 8 weeks), and the
   matching tape or scan measurement when you have two. Growth needs enough hard sets and progress on them over time. */
const SIZE_MEAS = { chest: ['chest'], lats: ['chest'], upperback: ['chest'], quads: ['thigh', 'thigh_mr', 'thigh_ml', 'thigh_ur', 'thigh_ul', 'lean_lr', 'lean_ll'], hamstrings: ['thigh', 'thigh_mr', 'thigh_ml'],
  glutes: ['hips'], biceps: ['arm', 'bicep_r', 'bicep_l', 'lean_ar', 'lean_al'], triceps: ['arm', 'bicep_r', 'bicep_l', 'lean_ar', 'lean_al'], calves: ['calf', 'calf_r', 'calf_l'] };
function measChange(keys, from) {
  for (const k of keys) { const es = (S.meta.meas || []).filter(e => e.k === k && +e.v > 0 && +parseYmd(e.d) >= from).sort((a, b) => a.d < b.d ? -1 : 1); if (es.length < 2) continue;
    const a = es[0], b = es[es.length - 1]; const kind = measKind(k); const u = measUnit(k);
    const cv = e => kind === 'len' ? (e.u && e.u !== u ? (u === 'cm' ? +e.v * 2.54 : +e.v / 2.54) : +e.v) : kind === 'mass' ? conv(+e.v, e.u || U(), U()) : +e.v;
    const d = cv(b) - cv(a); return { k, d, u, label: (MEAS_DEF.find(x => x[0] === k) || [, k])[1] }; }
  return null;
}
function strengthChange(muscle, from) {
  const ch = []; const byEx = {};
  for (const s of sessionList()) { if (s.startedAt < from) continue; for (const it of s.items || []) { if (isMeasured(exKind(it.ex)) || !(exMuscles(it.ex)[muscle] >= 1)) continue;
    const e1 = Math.max(0, ...(it.sets || []).filter(x => +x.r > 0 && +x.r <= 15 && +x.w > 0).map(x => epley(conv(+x.w, it.u || U(), U()), +x.r))); if (!(e1 > 0)) continue;
    (byEx[it.ex] = byEx[it.ex] || []).push({ t: s.startedAt, e1 }); } }
  for (const l of Object.values(byEx)) if (l.length >= 2 && l[l.length - 1].t - l[0].t >= 14 * DAY) ch.push((l[l.length - 1].e1 - l[0].e1) / l[0].e1);
  if (!ch.length) return null; ch.sort((a, b) => a - b); return { pct: ch[Math.floor(ch.length / 2)] * 100, n: ch.length };
}
function PlanWorking() {
  const pid = programId(); const r = pid && pid !== 'self' ? getRoutine(pid) : null; if (!r || !isLiftPlan(r)) return null;
  const plan = weeklySets(r); const rows = COVER_ROWS.filter(([k]) => (plan[k] || 0) >= 8); if (!rows.length) return null;
  const w0 = +startOfWeek(new Date()); const from4 = w0 - 28 * DAY, from8 = Date.now() - 56 * DAY;
  const done = loggedMuscleSets(from4, w0); const any = sessionList().some(s => s.startedAt >= from4 && s.startedAt < w0); if (!any) return null;
  const pc = v => (v >= 0 ? '+' : '') + Math.round(v) + '%';
  const line = ([k, l]) => { const avg = (done[k] || 0) / 4; const st = strengthChange(k, from8); const sz = SIZE_MEAS[k] ? measChange(SIZE_MEAS[k], from8) : null;
    const enough = avg >= plan[k] * 0.8; const up = st && st.pct > 1;
    const verdict = !enough ? 'Fewer sets than planned; that comes first.' : st && !up ? 'Sets are there but lifts aren’t climbing: push closer to failure or add a set.' : up ? 'On track.' : 'Keep logging; it needs two weeks of the same lifts to judge.';
    return html`<div key=${k} class="opt" style="cursor:default;align-items:flex-start"><div style="flex:1;min-width:0"><div>${l}</div>
      <div class="d num">${fmt(Math.round(avg * 2) / 2)} of ${fmt(Math.round(plan[k] * 2) / 2)} sets a week${st ? ' · lifts ' + pc(st.pct) : ''}${sz ? ' · ' + sz.label.toLowerCase() + ' ' + (sz.d >= 0 ? '+' : '') + fmt(Math.round(sz.d * 10) / 10) + ' ' + sz.u : ''}</div>
      <div class="d">${verdict}</div></div></div>`; };
  return html`<div id="plan-working"><div class="section-h"><h2>Is the plan working?</h2><span class="aside">Last 4–8 weeks</span></div>
    <div class="card">${rows.map(line)}
      <p class="small muted" style="margin-top:8px">For each muscle ${r.name} works hardest: sets you did a week over the last 4 full weeks against the plan, how much your lifts for it went up (estimated 1-rep max, middle of your lifts, last 8 weeks), and the matching measurement if you logged two.<${Cite} k=${['pelland', 'robinson']} sec="volume"/></p></div></div>`;
}

/* ---- 7. Protein spread over the day, and after a workout ----
   About 0.4 g per kg at each of 3–4 meals reaches the daily target with every meal doing some of the work
   (Schoenfeld & Aragon 2018). Daily target itself: about 1.6 g/kg (Morton 2018), set in Meals → goals. */
function bodyKg() { const me = (typeof ML === 'function' && ML().me) || {}; const bw = (S.meta.bw || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).pop(); return bw ? conv(+bw.w, bw.u || U(), 'kg') : me.w > 0 ? +me.w : 0; }
function logMeals(list) { /* entries grouped by plan slot, or by time when there is none (within 90 minutes is one meal) */
  const out = []; for (const e of list.slice().sort((a, b) => a.at - b.at)) { const g = out.find(m => (e.slot && m.slot === e.slot) || (!e.slot && !m.slot && Math.abs(e.at - m.at) < 90 * 60000));
    if (g) g.p += +(e.m && e.m.p) || 0; else out.push({ slot: e.slot || null, at: e.at, p: +(e.m && e.m.p) || 0 }); }
  return out;
}
function ProteinSpread({ list }) {
  const kg = bodyKg(); if (!(kg > 0)) return null; const per = Math.round(kg * 0.4 / 5) * 5; const ms = logMeals(list || []); if (!ms.length) return html`<p class="small muted" id="prot-spread" style="margin-top:6px">Protein per meal: about ${per} g at each of 3–4 meals.<${Cite} k=${['permeal']} sec="protein"/></p>`;
  const hit = ms.filter(m => m.p >= per * 0.8).length;
  return html`<p class="small muted num" id="prot-spread" style="margin-top:6px">Protein per meal: about ${per} g at each of 3–4 meals. Today: ${ms.map(m => Math.round(m.p) + ' g').join(', ')} (${hit} of ${ms.length} meal${ms.length === 1 ? '' : 's'} there).<${Cite} k=${['permeal']} sec="protein"/></p>`;
}
function WorkoutProtein() {
  if (typeof ML !== 'function') return null; const G = ML().goals || {}; if (!G.p) return null;
  const list = (ML().log || {})[ymd(new Date())] || []; const p = Math.round(sumNut(list).p || 0); const left = G.p - p;
  return html`<p class="small" id="wo-protein" style="margin-top:12px">Protein today: <b class="num">${p} of ${G.p} g</b>.${left > 10 ? ' A meal with about ' + Math.min(left, Math.max(20, Math.round(bodyKg() * 0.4 / 5) * 5 || 30)) + ' g in the next few hours helps the work you just did pay off.' : ' You’re there.'}<${Cite} k=${['morton', 'permeal']} sec="protein"/></p>`;
}
