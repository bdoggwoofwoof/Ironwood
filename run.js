/* ============ Timed and distance exercises ============ */
/* Three kinds log something other than weight × reps:
   timed (planks, hangs, holds): time per set, optional added weight;
   distance (runs, rows, swims, bike): distance and time per set, with optional splits;
   carry (farmer's carry, sled push, ruck): weight, distance and time.
   A set keeps w and r as numbers (r = 0) so older code and backups still read it, and adds
   t (seconds), d (meters) and sp (split times in seconds). Routine items carry a target in tg:
   { d: meters per set, t: target time per set, dur: planned time per set, pace: sec per mile or a pace key,
     lo/hi: easy pace range, goal: time to beat, judge: how a set is checked }. */
const MEAS = { timed: 1, distance: 1, carry: 1 };
const isMeasured = k => !!MEAS[k];
Object.assign(KINDS, { timed: 'Timed hold', distance: 'Distance (run, row, swim)', carry: 'Carry' });
const MILE = 1609.34;
/* "1:52", "52", "52.4", "25:00", "1:02:30" → seconds. A bare number is minutes when minutesFirst. */
function parseClock(s, minutesFirst) {
  s = String(s == null ? '' : s).trim().replace(/[^\d:.,]/g, '').replace(',', '.'); if (!s) return NaN;
  if (s.includes(':')) { const p = s.split(':'); if (p.length > 3 || p.some(x => x === '' || isNaN(+x))) return NaN; return p.reduce((t, x) => t * 60 + +x, 0); }
  const n = +s; return isNaN(n) ? NaN : minutesFirst ? n * 60 : n;
}
/* Seconds for reading: 14.5 s, 1:52, 25:00, 1:02:30 */
function rfmt(sec) {
  if (!isFinite(sec) || sec <= 0) return '–';
  if (sec < 60) return (Math.round(sec * 10) / 10).toFixed(1) + ' s';
  const r = Math.round(sec), h = Math.floor(r / 3600), m = Math.floor(r / 60) % 60, x = r % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
}
const paceTxt = p => rfmt(p) + ' /mi';
const splitAt = (pace, m) => pace * m / MILE;
/* "400", "400m", "1 mi", "1.5 km", "800 yd" → meters. A bare number under 30 is miles (lb) or km (kg). */
function parseDist(s) {
  s = String(s == null ? '' : s).trim().toLowerCase().replace(',', '.'); if (!s) return NaN;
  const m = s.match(/^(\d*\.?\d+)\s*(m|meters?|metres?|km|k|mi|miles?|yd|yards?)?$/); if (!m) return NaN;
  const n = +m[1], u = m[2] || (n < 30 ? (U() === 'kg' ? 'km' : 'mi') : 'm');
  return u[0] === 'k' ? n * 1000 : u.startsWith('mi') ? n * MILE : u[0] === 'y' ? n * 0.9144 : n;
}
function fmtDist(m) {
  if (!(m > 0)) return '–';
  const mi = m / MILE;
  if (mi >= 0.5 && Math.abs(mi * 2 - Math.round(mi * 2)) < 0.01) return fmt(Math.round(mi * 2) / 2) + ' mi';
  if (m < 1000) return Math.round(m) + ' m';
  if (U() === 'kg' || Math.abs(m / 100 - Math.round(m / 100)) < 0.01) return fmt(Math.round(m / 10) / 100) + ' km';
  return fmt(Math.round(mi * 100) / 100) + ' mi';
}
const RUN_RE = /\b(run|running|jog|sprints?|strides?|accelerations?|reps|time trial|threshold|interval)\b/;
const isRunEx = id => { const e = getEx(id); return exKind(id) === 'distance' && (e.run != null ? !!e.run : RUN_RE.test(norm(e.name))); };
/* Built-in exercises that log time or distance; the ones the running plan and programs add are made here too */
const MEAS_EX = {
  timed: ['Dead Hang', 'Hanging Lat Stretch', 'Plank', 'Side Plank', 'Knee-to-Wall Ankle Dorsiflexion', 'Banded Ankle Distractions', 'Slant Board Calf Stretch', 'Floor Wrist Stretch', 'Dead Bug', 'Side Plank Rotations', 'Shadow Boxing or Bag', 'Sprawls'],
  distance: ['Run 400m', '100m Sprints', '50m Swim', 'Run 4 Miles', 'Rowing Machine (Erg)', 'Accelerations', 'Strides', 'Speed 150 m', 'Speed 200 m', 'Mile-Pace Reps', 'Threshold Run', 'Interval Reps', 'Easy Run', 'Mile Time Trial', '100 m Sprint', '3 Mile Time Trial',
    'Run 200m', 'Run 800m', 'Run 1 km', 'Run Half Mile', '2 Mile Run', 'Bike', 'Elliptical', 'Incline Walk', 'Swim', 'Bike Sprints', 'Rower Sprints', 'Hill Sprints'],
  carry: ['Ruck 4 Miles', 'Ruck', "Farmer's Carry", 'Sled Push', 'Sandbag Walking Lunge'],
};
const NOT_RUN = /\b(swim|bike|row|rower|erg|elliptical|walk|ruck)\b/;
function ensureEx(name, kind, cat) {
  let ex = findIn(BUILTIN_EX)(name);
  if (!ex) { ex = { id: 'b-' + slug(name), name, kind }; BUILTIN_EX[ex.id] = ex; }
  ex.kind = kind; if (cat) ex.cat = cat;
  const dm = name.match(/(\d*\.?\d+)\s*(m|km|miles?|mi)\b/i);
  if (kind !== 'timed' && dm) ex.dist = /k/i.test(dm[2]) ? +dm[1] * 1000 : /mi/i.test(dm[2]) ? +dm[1] * MILE : +dm[1];
  if (/half mile/i.test(name)) ex.dist = MILE / 2;
  if (name === 'Mile Time Trial') ex.dist = MILE;
  if (kind === 'distance') ex.run = !NOT_RUN.test(norm(name));
  return ex;
}
for (const [kind, names] of Object.entries(MEAS_EX)) for (const n of names) ensureEx(n, kind, kind === 'timed' && /plank|dead bug/i.test(n) ? 'core' : kind === 'distance' || /ruck|sled/i.test(n) ? 'cardio' : null);
/* Timed items in the built-in routines: their note held the time ("20 s each set", "3 min") */
BUILTIN_ROUTINES.forEach(r => r.days.forEach(d => d.items.forEach(it => {
  if (exKind(it.ex) !== 'timed' || it.tg) return;
  const m = String(it.note || '').match(/^(\d+)\s*(s|sec|min)\b/i); if (m) it.tg = { dur: +m[1] * (/min/i.test(m[2]) ? 60 : 1), judge: 'dur' };
  if (it.ex === 'b-dead-hang' && !it.tg) it.tg = { judge: 'max' };
})));
BUILTIN_ROUTINES.forEach(r => r.days.forEach(d => d.items.forEach(it => {
  const e = getEx(it.ex); if (!isMeasured(e.kind) || it.tg) return;
  if (e.dist) it.tg = { d: e.dist };
  const m = String(it.note || '').match(/under\s+(\d+:\d+)/i); if (m && it.tg) it.tg.goal = parseClock(m[1]);
  const w = String(it.note || '').match(/(\d+)\s*lb/i); if (w && e.kind === 'carry') { it.tg = it.tg || {}; it.tg.w = +w[1]; }
})));
/* A routine item's target with pace keys turned into times from the current running profile */
function resolveTg(item) {
  const tg = item && item.tg ? { ...item.tg } : {}; const e = item && item.ex ? getEx(item.ex) : null;
  if (!tg.d && e && e.dist && e.kind !== 'timed') tg.d = e.dist;
  const c = runCtxNow();
  if (typeof tg.pace === 'string') { if (c) { if (tg.pace === 'easy') { tg.lo = c.easyLo; tg.hi = c.easyHi; tg.judge = tg.judge || 'easy'; } else { tg.pace = c[tg.pace]; } } else delete tg.pace; }
  if (typeof tg.pace === 'string') delete tg.pace;
  if (tg.pace && tg.d && !tg.t && !tg.dur) { tg.t = splitAt(tg.pace, tg.d); tg.judge = tg.judge || 'split'; }
  if (!tg.judge) tg.judge = tg.goal ? 'goal' : tg.t ? 'split' : tg.pace ? 'pace' : tg.dur ? 'dur' : 'feel';
  return tg;
}
const durTxt = d => d < 60 ? Math.round(d) + ' s' : d >= 120 && d % 60 === 0 ? d / 60 + ' min' : rfmt(d);
/* Short line for a routine item: "8 × 400 m", "3 × 0:45", "1 × 4 mi, under 31:30" */
function tgLabel(it) {
  const tg = resolveTg(it); const n = it.sets + ' × ';
  const parts = [];
  if (tg.d) parts.push(fmtDist(tg.d)); if (tg.dur) parts.push(durTxt(tg.dur)); if (!tg.d && !tg.dur) parts.push(exKind(it.ex) === 'timed' ? 'max hold' : 'time');
  let s = n + parts.join(', ');
  if (tg.t && tg.judge === 'split') s += ' in ' + rfmt(tg.t);
  if (tg.pace && tg.judge === 'pace') s += ' at ' + paceTxt(tg.pace);
  if (tg.lo) s += ' at ' + rfmt(tg.lo) + '–' + rfmt(tg.hi) + ' /mi';
  if (tg.goal) s += ', goal ' + rfmt(tg.goal);
  if (tg.w) s += ' · ' + tg.w + ' ' + U();
  return s;
}
/* One logged set, for reading */
function measLabel(x, kind, u) {
  const t = +x.t || 0, d = +x.d || 0, w = +x.w || 0; const p = [];
  if (!t && !d && +x.r > 0) return (w ? fmt(w) + ' ' + (u || U()) + ' × ' : '') + x.r + ' reps';   /* logged before this exercise tracked time */
  if (d) p.push(fmtDist(d)); if (t) p.push(rfmt(t));
  if (kind === 'timed' && w) p.push('+' + fmt(w) + ' ' + (u || U()));
  if (kind === 'distance' && t && d >= 200) p.push(paceTxt(t / (d / MILE)));
  return p.join(' · ');
}
function measBest(sets, kind) {
  const done = sets.filter(x => +x.t > 0 || +x.d > 0); if (!done.length) return sets.length ? measLabel(sets[0], kind) : '';
  let b;
  if (kind === 'timed') b = done.reduce((a, x) => (+x.t > +a.t ? x : a));
  else if (kind === 'carry') b = done.reduce((a, x) => ((+x.w || 0) * 1e5 + (+x.d || 0) > (+a.w || 0) * 1e5 + (+a.d || 0) ? x : a));
  else { const timed = done.filter(x => +x.t > 0 && +x.d > 0); b = timed.length ? timed.reduce((a, x) => (x.t / x.d < a.t / a.d ? x : a)) : done.reduce((a, x) => (+x.d > +a.d ? x : a)); }
  return measLabel(b, kind);
}
const measDone = x => num(x.t) > 0 || num(x.d) > 0;

/* ---- Checking a set against its target ---- */
/* Within 2 seconds per 200 m is on target (the plan's rule). Easy runs are off only when too fast or cut short. */
function measStatus(target, x) {
  const tg = target || {}; const t = num(x.t), d = num(x.d) || tg.d || 0;
  switch (tg.judge) {
    case 'split': {
      if (!(t > 0) || !tg.t) return null; const want = tg.d && d ? tg.t * d / tg.d : tg.t; const tol = Math.max(1, 2 * (d || tg.d || 200) / 200);
      return t > want + tol ? { st: 'slow', txt: rfmt(t - want) + ' slower than target' } : t < want - tol ? { st: 'fast', txt: rfmt(want - t) + ' faster than target' } : { st: 'on', txt: 'On target' };
    }
    case 'pace': {
      if (!(t > 0) || !(num(x.d) > 0) || !tg.pace) return t > 0 ? { st: null, txt: 'Add the distance to check your pace' } : null;
      const p = t / (num(x.d) / MILE), tol = 2 * MILE / 200;
      return p > tg.pace + tol ? { st: 'slow', txt: paceTxt(p) + ', slower than ' + paceTxt(tg.pace) } : p < tg.pace - tol ? { st: 'fast', txt: paceTxt(p) + ', faster than planned' } : { st: 'on', txt: paceTxt(p) + ', on target' };
    }
    case 'easy': {
      if (t > 0 && num(x.d) > 0 && tg.lo) { const p = t / (num(x.d) / MILE); if (p < tg.lo - 5) return { st: 'fast', txt: paceTxt(p) + ': too fast for easy' }; }
      if (tg.dur && t > 0 && t < tg.dur * 0.9) return { st: 'short', txt: 'Shorter than planned' };
      return t > 0 ? { st: 'on', txt: 'Easy run done' } : null;
    }
    case 'goal': {
      if (!(t > 0) || !tg.goal) return null;
      const tol = tg.tol || 0;
      return t <= tg.goal + tol ? { st: 'on', txt: t <= tg.goal ? 'Beat the goal by ' + rfmt(tg.goal - t + 0.001) : 'Within ' + rfmt(tol) + ' of your time' } : { st: 'slow', txt: rfmt(t - tg.goal) + ' off the goal' };
    }
    case 'dur': {
      if (!tg.dur || !(t > 0)) return null;
      return t >= tg.dur * 0.9 ? { st: 'on', txt: 'Done' } : { st: 'short', txt: 'Shorter than planned' };
    }
    default: return null;
  }
}
/* A whole session: on target when at least 3 of 4 checked sets are on target (faster counts); a test counts its best try */
function sessionStatus(items) {
  let on = 0, n = 0;
  for (const it of items) {
    const tg = it.target || {}; if (!isMeasured(exKind(it.ex))) continue;
    if (tg.judge === 'goal') { const best = it.sets.filter(x => +x.t > 0).map(x => +x.t).sort((a, b) => a - b)[0]; if (best) { n++; if (best <= tg.goal + (tg.tol || 0)) on++; } continue; }
    for (const x of it.sets) { const s = measStatus(tg, x); if (!s || !s.st) continue; n++; if (s.st === 'on' || s.st === 'fast') on++; }
  }
  return n ? (on / n >= 0.75 ? 'on' : 'off') : null;
}
/* The fade rule: stop the set when a rep is more than 5% slower than the first */
function fadeHint(it) {
  const tg = it.target || {}; if (!(tg.judge === 'split' || tg.judge === 'pace')) return '';
  const done = it.sets.filter(x => isDone(x) && num(x.t) > 0); if (done.length < 2) return '';
  const per = x => num(x.t) / (num(x.d) || tg.d || 1);
  return per(done[done.length - 1]) > per(done[0]) * 1.05 ? 'That rep was more than 5% slower than your first. Stop the set here.' : '';
}

/* ---- Records for time and distance ---- */
const STD = [['run100', 100, 'Fastest 100 m'], ['mile', MILE, 'Fastest mile'], ['mile3', 3 * MILE, 'Fastest 3 miles']];
const stdOf = d => STD.find(([, m]) => Math.abs(d - m) <= m * (m === 100 ? 0.02 : 0.012)) || null;
/* Every timed effort at a standard distance, from any exercise, plus the times entered in the running plan */
function stdPool(type, beforeT, excludeSid) {
  const out = [];
  for (const s of sessionList()) { if (s.id === excludeSid || (beforeT && s.startedAt >= beforeT)) continue;
    for (const it of s.items) if (exKind(it.ex) === 'distance') for (const x of it.sets) { const st = stdOf(+x.d || 0); if (st && st[0] === type && +x.t > 0) out.push(+x.t); } }
  for (const s of sessionList()) { if (s.id === excludeSid || (beforeT && s.startedAt >= beforeT) || s.kind !== 'activity' || s.activity !== 'run') continue; const m = actMeters(s); const st = m && stdOf(m); if (st && st[0] === type && +s.dur > 0) out.push(+s.dur * 60); }
  const R = S.meta.run; const key = { run100: 't100', mile: 't1', mile3: 't3' }[type];
  if (R && R.hist) for (const h of R.hist) if (h[key] && (!beforeT || parseYmd(h.d) < beforeT)) out.push(h[key]);
  return out;
}
function measReasons(ex, x, poolSets, stdPrior) {
  const P = prOpts(); if (!P.run) return [];
  const kind = exKind(ex); const t = num(x.t), d = num(x.d), w = num(x.w); const out = [];
  if (kind === 'distance' && t > 0 && d > 0) {
    const st = stdOf(d);
    if (st) { const best = Math.min(...stdPrior(st[0])); if (isFinite(best) && t < best - 0.05) out.push({ type: st[0], label: st[2], value: rfmt(t), prev: rfmt(best), score: -t }); }
    else { const same = poolSets.filter(y => +y.t > 0 && Math.abs((+y.d || 0) - d) <= d * 0.01); if (same.length) { const best = Math.min(...same.map(y => +y.t)); if (t < best - 0.05) out.push({ type: 'fastest', label: 'Fastest ' + fmtDist(d), value: rfmt(t), prev: rfmt(best), score: -t }); } }
    const longest = Math.max(0, ...poolSets.map(y => +y.d || 0)); if (poolSets.length && longest > 0 && d > longest * 1.001 && !st && !getEx(ex).dist) out.push({ type: 'longest', label: 'Longest distance', value: fmtDist(d), prev: fmtDist(longest), score: d });
  }
  if (kind === 'timed' && t > 0) { const timedSets = poolSets.filter(y => +y.t > 0); if (timedSets.length) { const best = Math.max(...timedSets.map(y => +y.t)); if (t > best + 0.05) out.push({ type: 'hold', label: 'Longest hold', value: rfmt(t), prev: rfmt(best), score: t }); } }
  if (kind === 'carry' && (d > 0 || t > 0)) {
    const ws = poolSets.filter(y => +y.d > 0 || +y.t > 0); if (ws.length) {
      const bw = Math.max(...ws.map(y => +y.w || 0)); if (w > bw + 0.05) out.push({ type: 'carryw', label: 'Heaviest carry', value: fmt(w) + ' ' + U(), prev: fmt(bw) + ' ' + U(), score: w });
      const bd = Math.max(...ws.map(y => +y.d || 0)); if (d > bd * 1.001 && bd > 0 && !getEx(ex).dist) out.push({ type: 'carryd', label: 'Longest carry', value: fmtDist(d), prev: fmtDist(bd), score: d });
    }
  }
  return out;
}
/* Called by detectPRs for a finished workout */
function measuredPRs(session, it) {
  const prior = entries(it.ex).filter(e => e.sid !== session.id && e.t < session.startedAt);
  const pool = prior.flatMap(e => e.raw.map(x => ({ ...x, w: +x.w || 0 })));
  const stdPrior = type => stdPool(type, session.startedAt, session.id);
  const best = {};
  for (const x of it.sets) for (const p of measReasons(it.ex, x, pool, stdPrior)) {
    if (!best[p.type] || p.score > best[p.type].score) best[p.type] = p;
  }
  return Object.values(best).map(({ score, ...p }) => ({ ex: it.ex, group: '', ...p }));
}
/* Live, while logging: earlier sets of this workout count as prior efforts */
function measSetPR(it, s) {
  const prior = entries(it.ex).flatMap(e => e.raw.map(x => ({ ...x })));
  const earlier = S.active.items.flatMap(o => o.sets.filter(x => x !== s && isDone(x) && x.c && (!s.c || x.c < s.c)).map(x => ({ ex: o.ex, x })));
  const pool = prior.concat(earlier.filter(e => e.ex === it.ex).map(e => e.x));
  const stdPrior = type => stdPool(type).concat(earlier.filter(e => exKind(e.ex) === 'distance' && +e.x.t > 0 && stdOf(+e.x.d || 0) && stdOf(+e.x.d)[0] === type).map(e => +e.x.t));
  if (!prior.length && !stdPrior('run100').length && !stdPrior('mile').length && !stdPrior('mile3').length) return [];
  return measReasons(it.ex, s, pool, stdPrior);
}
/* Prefill: last time's distance and time, or the target */
function refillMeasured(it, occ) {
  const prev = lastEntryOcc(it.ex, it.group || '', occ || 0); const tg = it.target || {};
  it.prev = prev ? prev.raw.map(x => ({ ...x })) : null; it.prevNote = prev ? prev.note : ''; it.bump = false;
  it.sets.forEach((x, j) => {
    if (!x.id) x.id = uid('t'); if (isDone(x)) return;
    const p = it.prev ? (it.prev[j] || it.prev[it.prev.length - 1]) : null;
    x.gd = tg.d ? String(Math.round(tg.d * 100) / 100) : p && +p.d ? String(+p.d) : '';
    x.gt = tg.dur ? String(tg.dur) : tg.t ? String(Math.round(tg.t * 10) / 10) : tg.goal ? String(Math.round(tg.goal)) : p && +p.t ? String(+p.t) : '';
    x.gw = tg.w ? String(tg.w) : p && +p.w ? String(+p.w) : '';
  });
}
function completeMeasured(it, s) {
  const kind = exKind(it.ex); const tg = it.target || {};
  if (!(num(s.d) > 0) && num(s.gd) > 0 && kind !== 'timed') s.d = s.gd;
  if (!(num(s.t) > 0) && num(s.gt) > 0 && (kind === 'timed' || tg.dur)) s.t = s.gt;
  if (!String(s.w || '').trim() && s.gw && kind !== 'distance') s.w = s.gw;
  if (!measDone(s)) { S.rerender(); focusId((kind === 'timed' ? 't-' : kind === 'carry' && !num(s.gd) ? 'd-' : 't-') + s.id); return false; }
  s.r = 0; s.c = Date.now();
  const st = measStatus(tg, s); s.st = st && st.st ? st.st : null;
  const prs = measSetPR(it, s); s.pr = prs.length > 0; s.prInfo = prs.map(prText);
  if (s.pr) { showToast({ kind: 'pr', text: 'PR · ' + exName(it.ex) + ' · ' + prs.map(p => p.label).join(', ') }); if (prOpts().sound) { beep(1320, 90, 0.22); setTimeout(() => beep(1760, 150, 0.22), 110); } }
  startRest(it); touch(); return true;
}
function uncompleteMeasured(it, s) { s.c = null; s.pr = false; s.prInfo = null; s.st = null; touch(); }

/* ---- Logging rows ---- */
function MeasRow({ it, s, j, kind }) {
  if (!s.id) s.id = uid('t');
  const tg = it.target || {}; const done = !!s.c && measDone(s); const u = it.u || U();
  const minutesFirst = (tg.dur || num(s.gt)) >= 300 || (tg.d || num(s.gd)) >= 1000;
  const [tt, setTt] = useState(num(s.t) > 0 ? rfmt(num(s.t)).replace(' s', '') : '');
  const [dd, setDd] = useState(num(s.d) > 0 ? fmtDist(num(s.d)) : '');
  useEffect(() => { const v = num(s.t); if (v > 0 && Math.abs(parseClock(tt, minutesFirst) - v) > 0.05) setTt(rfmt(v).replace(' s', '')); if (!(v > 0) && !s.c && tt && !(parseClock(tt, minutesFirst) > 0)) setTt(''); }, [s.t]);
  useEffect(() => { const v = num(s.d); if (v > 0 && Math.abs(parseDist(dd) - v) > 0.5) setDd(fmtDist(v)); }, [s.d]);
  const setT = v => { setTt(v); const x = parseClock(v, minutesFirst); s.t = x > 0 ? x : ''; if (s.c) { const st = measStatus(tg, s); s.st = st && st.st ? st.st : null; } touch(); };
  const setD = v => { setDd(v); const x = parseDist(v); s.d = x > 0 ? x : ''; touch(); };
  const after = () => { if (!s.c && measDone(s) && (kind !== 'distance' || num(s.t) > 0)) completeMeasured(it, s); };
  const st = done ? measStatus(tg, s) : null;
  const tPh = num(s.gt) > 0 ? rfmt(num(s.gt)).replace(' s', '') : kind === 'timed' ? '0:30' : 'm:ss';
  const dPh = num(s.gd) > 0 ? fmtDist(num(s.gd)) : kind === 'carry' ? '40 m' : '400 m';
  const tIn = html`<input id=${'t-' + s.id} type="text" inputmode="decimal" autocomplete="off" value=${tt} placeholder=${tPh} aria-label=${'Set ' + (j + 1) + ' time'} onFocus=${selAll} onInput=${e => setT(e.target.value)} onChange=${after} onKeyDown=${enterBlur}/>`;
  const dIn = html`<input id=${'d-' + s.id} type="text" inputmode="decimal" autocomplete="off" value=${dd} placeholder=${dPh} aria-label=${'Set ' + (j + 1) + ' distance'} onFocus=${selAll} onInput=${e => setD(e.target.value)} onChange=${after} onKeyDown=${enterBlur}/>`;
  const wIn = html`<input id=${'w-' + s.id} type="text" inputmode="decimal" autocomplete="off" value=${s.w} placeholder=${s.gw || '0'} aria-label=${'Set ' + (j + 1) + (kind === 'timed' ? ' added weight, ' : ' weight, ') + u} onFocus=${selAll} onInput=${e => { s.w = e.target.value; touch(); }} onKeyDown=${enterBlur}/>`;
  const fields = kind === 'timed' ? [tIn, wIn] : kind === 'carry' ? [wIn, dIn, tIn] : [dIn, tIn];
  const pace = kind === 'distance' && num(s.t) > 0 && num(s.d) >= 200 ? paceTxt(num(s.t) / (num(s.d) / MILE)) : '';
  const toggle = () => { if (done) uncompleteMeasured(it, s); else completeMeasured(it, s); };
  return html`<div class="setwrap"><div class=${'meas-row k-' + kind + (done ? ' done' : '')}>
      <span class=${'n' + (s.pr && done ? ' pr' : '')}>${j + 1}</span>${fields}
      <button class=${'meas-ok' + (done ? ' on' : '')} aria-pressed=${done} aria-label=${(done ? 'Clear set ' : 'Log set ') + (j + 1)} onClick=${toggle}>${I.check}</button>
    </div>
    ${done || pace || (s.sp && s.sp.length) || (kind === 'distance' && (tg.d || num(s.gd) || num(s.d)) >= 400) ? html`<div class="meas-info">
      ${st && st.txt ? html`<span class=${'tg-badge ' + (st.st || 'none')}>${st.txt}</span>` : null}
      ${pace && !(st && /\/mi/.test(st.txt)) ? html`<span class="small muted num">${pace}</span>` : null}
      ${s.sp && s.sp.length ? html`<span class="small muted num">Splits ${s.sp.map(x => rfmt(x)).join(' · ')}</span>` : null}
      ${kind === 'distance' && ((tg.d || num(s.gd) || num(s.d)) >= 400 || (s.sp && s.sp.length)) ? html`<button class="btn text sp-btn" id=${'sp-' + s.id} onClick=${() => openSheet({ type: 'splits', it, s })}>${I.timer} ${s.sp && s.sp.length ? 'Edit splits' : 'Splits'}</button>` : null}
    </div>` : null}
    ${s.pr && done && s.prInfo && s.prInfo.length ? html`<p class="pr-line" role="note">${s.prInfo.map((t, k) => html`<span key=${k}>PR · ${t}</span>`)}</p>` : null}</div>`;
}
function MeasSlot({ it, nextSS }) {
  const kind = exKind(it.ex); const u = it.u || U(); const tg = it.target || {};
  const allDone = it.sets.length && it.sets.every(x => x.c && measDone(x));
  const heads = kind === 'timed' ? ['Time', '+' + u] : kind === 'carry' ? [u, 'Distance', 'Time'] : ['Distance', 'Time'];
  const hint = fadeHint(it);
  return html`<section class=${'slot' + (it.ss ? ' ss' : '') + (nextSS ? ' ss-next' : '')} aria-label=${exName(it.ex)}>
    ${it.ss ? html`<div class="ss-tag">${I.link} Superset with above</div>` : null}
    <div class="slot-head"><div class="slot-name"><h3>${exName(it.ex)}${allDone ? html` <span class="faint" style="font-weight:600">✓</span>` : null}</h3>
      <div class="meta"><span class="num">${tgLabel({ ...it, sets: it.target.sets, tg })}</span>${it.prev ? null : html`<span class="faint">· first time</span>`}</div>
      ${tg.k ? html`<p class="small muted" style="margin-top:4px">${tg.k}</p>` : null}
      ${it.target && it.target.cue ? html`<p class="small muted" style="margin-top:4px">${it.target.cue}</p>` : null}</div>
      <button class="icon-btn" aria-label=${'Options for ' + exName(it.ex)} onClick=${() => openSheet({ type: 'slot', it })}>${I.more}</button></div>
    <${ExNote} it=${it}/>
    <div class="sets">
      <div class=${'meas-row th k-' + kind}><span>Set</span>${heads.map(h => html`<span key=${h}>${h}</span>`)}<span></span></div>
      ${it.sets.map((x, j) => html`<${MeasRow} key=${x.id || j} it=${it} s=${x} j=${j} kind=${kind}/>`)}
    </div>
    ${hint ? html`<div class="hint warn" role="note">${hint}</div>` : null}
    <div class="slot-foot"><button class="btn text" onClick=${() => { const l = it.sets[it.sets.length - 1] || {}; it.sets.push({ id: uid('t'), w: '', r: '', n: '', gw: l.w || l.gw || '', gd: l.d || l.gd || '', gt: l.gt || '' }); touch(); }}>+ Set</button>
      <span class="plates small muted">${kind === 'distance' ? 'Times like 1:52 or 25:00' : kind === 'timed' ? 'Times like 0:45' : 'Distance like 40 m or 1 mi'}</span></div></section>`;
}
/* Splits: tap Lap as you pass each marker, or type them in. The total becomes the set's time. */
function SplitsSheet({ it, s }) {
  const tg = it.target || {}; const [list, setList] = useState(() => (s.sp || []).slice()); const [txt, setTxt] = useState((s.sp || []).map(x => rfmt(x).replace(' s', '')).join(', '));
  const [run, setRun] = useState(null); const [, tick] = useState(0);
  useEffect(() => { if (!run) return; const iv = setInterval(() => tick(x => x + 1), 100); return () => clearInterval(iv); }, [run]);
  const now = run ? (Date.now() - run.t0) / 1000 : 0; const lapStart = run ? run.laps.reduce((a, x) => a + x, 0) : 0;
  const lap = () => { const l = Math.round((now - lapStart) * 10) / 10; const laps = run.laps.concat([l]); setRun({ ...run, laps }); setList(laps); setTxt(laps.map(x => rfmt(x).replace(' s', '')).join(', ')); };
  const stop = () => { const l = Math.round((now - lapStart) * 10) / 10; const laps = l > 0.5 ? run.laps.concat([l]) : run.laps; setRun(null); setList(laps); setTxt(laps.map(x => rfmt(x).replace(' s', '')).join(', ')); };
  const fromTxt = v => { setTxt(v); const xs = v.split(/[,\s]+/).map(p => parseClock(p)).filter(x => x > 0); setList(xs); };
  const total = list.reduce((a, x) => a + x, 0);
  const lapM = tg.lap || (tg.d && tg.d >= 1200 ? 400 : tg.d >= 800 ? 200 : 0);
  const save = () => { s.sp = list; if (total > 0) s.t = Math.round(total * 10) / 10; if (!(num(s.d) > 0) && num(s.gd) > 0) s.d = num(s.gd); closeSheet(); if (!s.c && measDone(s)) completeMeasured(it, s); else touch(); };
  return html`<${Sheet} label="Splits"><h2>Splits</h2>
    <p class="note">${lapM ? 'Tap Lap each ' + lapM + ' m' + (tg.split ? ' (target ' + rfmt(tg.split) + ' each)' : '') + ', or type the lap times.' : 'Tap Lap at each marker, or type the lap times.'} The total becomes this set’s time.</p>
    <div class="sp-clock num" aria-live="off">${(t => t >= 60 ? rfmt(t) : t.toFixed(1))(run ? now : total)}</div>
    <div class="row" style="margin-top:8px">${run ? html`<button class="btn primary" style="flex:2" id="sp-lap" onClick=${lap}>Lap</button><button class="btn" style="flex:1" id="sp-stop" onClick=${stop}>Stop</button>`
      : html`<button class="btn primary wide" id="sp-start" onClick=${() => { setRun({ t0: Date.now(), laps: [] }); setList([]); setTxt(''); }}>${list.length ? 'Start over' : 'Start'}</button>`}</div>
    <label class="lbl" for="sp-txt" style="margin-top:14px">Lap times</label>
    <input class="field" id="sp-txt" inputmode="text" placeholder="1:52, 1:55, 1:54, 1:49" value=${txt} onInput=${e => fromTxt(e.target.value)}/>
    ${list.length ? html`<div class="sp-list">${list.map((x, k) => { const want = tg.split; const st = want ? (x > want + 2 * (lapM || 200) / 200 ? 'slow' : x < want - 2 * (lapM || 200) / 200 ? 'fast' : 'on') : null;
      return html`<div key=${k} class="row"><span class="faint num" style="width:28px">${k + 1}</span><span class="num" style="flex:1">${rfmt(x)}</span>${st ? html`<span class=${'tg-badge ' + st}>${st === 'on' ? 'on target' : st}</span>` : null}</div>`; })}
      <div class="row" style="font-weight:700"><span style="width:28px"></span><span class="num" style="flex:1">Total ${rfmt(total)}</span></div></div>` : null}
    <div class="row" style="margin-top:14px"><button class="btn" style="flex:1" onClick=${closeSheet}>Cancel</button><button class="btn primary" style="flex:2" id="sp-save" disabled=${!!run} onClick=${save}>Save splits</button></div><//>`;
}
/* Editing a saved workout: time, distance and weight as text */
function MeasEditSet({ x, j, i, kind, onRemove }) {
  const [tt, setTt] = useState(num(x.t) > 0 ? rfmt(num(x.t)).replace(' s', '') : ''); const [dd, setDd] = useState(num(x.d) > 0 ? fmtDist(num(x.d)) : '');
  return html`<div class="edit-set meas"><span class="faint num">${j + 1}</span>
    ${kind !== 'timed' ? html`<input id=${'ed-' + i + '-' + j} inputmode="decimal" aria-label="Distance" placeholder="Distance" value=${dd} onInput=${e => { setDd(e.target.value); const v = parseDist(e.target.value); x.d = v > 0 ? v : 0; }}/>` : null}
    <input id=${'et-' + i + '-' + j} inputmode="decimal" aria-label="Time" placeholder="Time" value=${tt} onInput=${e => { setTt(e.target.value); const v = parseClock(e.target.value); x.t = v > 0 ? v : 0; }}/>
    ${kind !== 'distance' ? html`<input id=${'ew-' + i + '-' + j} inputmode="decimal" aria-label="Weight" placeholder="Weight" value=${x.w || ''} onInput=${e => { x.w = e.target.value; }}/>` : null}
    <button class="icon-btn" aria-label="Remove set" onClick=${onRemove}>${I.x}</button></div>`;
}
/* Routine editor: one target box instead of reps, e.g. "400m in 1:50", "45 s", "25 min", "3 mi" */
function parseTarget(v) {
  const s = String(v || '').toLowerCase(); const tg = {};
  const inM = s.match(/\bin\s+([\d:.]+)/); if (inM) tg.t = parseClock(inM[1]);
  const rest = s.replace(/\bin\s+[\d:.]+/, '').trim();
  const dm = rest.match(/(\d*\.?\d+)\s*(m|meters?|km|k|mi|miles?|yd|yards?)\b/); if (dm) tg.d = parseDist(dm[1] + dm[2]);
  const tm = rest.replace(dm ? dm[0] : '', '').match(/([\d:.]+)\s*(s|sec|secs|seconds?|min|mins|minutes?)?\b/);
  if (tm && tm[1]) { const x = tm[1].includes(':') ? parseClock(tm[1]) : +tm[1] * (/^m/.test(tm[2] || '') ? 60 : 1); if (x > 0) tg.dur = x; }
  for (const k of Object.keys(tg)) if (!(tg[k] > 0)) delete tg[k];
  return tg;
}
const targetText = tg => !tg ? '' : [tg.d ? fmtDist(tg.d).replace(' ', '') : '', tg.dur ? (tg.dur >= 120 ? Math.round(tg.dur / 60) + ' min' : tg.dur + ' s') : '', tg.t ? 'in ' + rfmt(tg.t).replace(' s', '') : ''].filter(Boolean).join(' ');
function TargetInput({ it, re }) {
  const [v, setV] = useState(() => targetText(it.tg));
  return html`<input class="ed-reps ed-tg" id=${'tg-' + it.id} aria-label="Target distance or time" placeholder=${exKind(it.ex) === 'timed' ? '45 s' : '400m in 1:50'} value=${v}
    onInput=${e => { setV(e.target.value); const tg = parseTarget(e.target.value); const keep = it.tg ? { judge: it.tg.judge, pace: it.tg.pace } : {}; it.tg = Object.keys(tg).length ? { ...tg, ...(keep.pace && !tg.t ? { pace: keep.pace } : {}) } : null; }} onBlur=${re}/>`;
}
function MeasuredStats({ ex }) {
  const kind = exKind(ex); const all = entries(ex);
  const sets = all.flatMap(e => e.raw.filter(measDone).map(x => ({ ...x, t0: e.t })));
  const best = (f, better) => sets.reduce((b, x) => (f(x) > 0 && (!b || better(f(x), f(b))) ? x : b), null);
  const rows = kind === 'timed' ? [['Longest hold', best(x => +x.t, (a, b) => a > b), x => rfmt(+x.t)]]
    : kind === 'carry' ? [['Heaviest carry', best(x => +x.w, (a, b) => a > b), x => fmt(+x.w) + ' ' + U() + (x.d ? ' · ' + fmtDist(+x.d) : '')], ['Longest carry', best(x => +x.d, (a, b) => a > b), x => fmtDist(+x.d)]]
    : [['Longest', best(x => +x.d, (a, b) => a > b), x => fmtDist(+x.d)], ['Fastest pace', best(x => +x.t > 0 && +x.d >= 200 ? x.t / (x.d / MILE) : 0, (a, b) => a < b), x => paceTxt(x.t / (x.d / MILE))]];
  const R = S.meta.run;
  return html`<div>
    <div class="row" style="margin-top:6px"><span class="eyebrow">${KINDS[kind]}</span><span class="spacer"></span>
      <label class="small muted" for="ex-cat">Category</label><select id="ex-cat" class="field mini-select" value=${exCat(ex)} onChange=${e => commit(st => { st.meta.exCat[ex] = e.target.value; }, 'meta', 800)}>${Object.entries(CATS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></div>
    <h2 class="wo-title" style="margin:2px 0 8px">${exName(ex)}</h2>
    <div class="card prl">${rows.map(([l, b, f]) => html`<div key=${l}><span style="font-weight:600">${l}</span><span class="num">${b ? f(b) + ' · ' + shortDate(b.t0) : '–'}</span></div>`)}</div>
    ${isRunEx(ex) && R ? html`<p class="note" style="margin-top:8px">Fastest 100 m, mile and 3 miles from any run are in Stats → Overall → Running.</p>` : null}
    <div class="section-h"><h2>History</h2></div>
    ${all.length ? html`<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Best</th><th>Sets</th></tr></thead>
      <tbody>${all.slice().reverse().map(e => html`<tr key=${e.sid}><td>${shortDate(e.t)}</td><td>${measBest(e.raw, kind)}</td><td>${e.raw.length}</td></tr>`)}</tbody></table></div>` : html`<div class="empty">Nothing logged yet.</div>`}
  </div>`;
}

/* ============ Running plan ============ */
/* Ported from the Ironwood Running & Conditioning page (Oct 21, 2026): paces from the 100 m, mile and 3 mile,
   a profile from how the 3 miles compares with what the mile predicts (Riegel, exponent 1.06), 8-week targets,
   and the 8-week plan for 2 or 3 runs a week. All of it is an estimate, not medical or coaching advice.
   Saved in meta.run: { t100, t1, t3 (seconds), runs: 2 | 3, start: 'YYYY-MM-DD' (week 1, day 1), block,
   hist: [{ d, t100, t1, t3, why }], days: { session key: weekday 0–6 }, lifts: { weekday: day type },
   swaps: { session id: mode }, marks: { session id: 'on' | 'off' } }. */
const RUN_LIMITS = { t100: [9, 30], t1: [240, 1200], t3: [840, 3900] };
function runCheck(t) {
  const e = {};
  if (!(t.t100 >= 9 && t.t100 <= 30)) e.t100 = 'Enter seconds between 9 and 30.';
  if (!(t.t1 >= 240 && t.t1 <= 1200)) e.t1 = 'Enter a time between 4:00 and 20:00.';
  if (!(t.t3 >= 840 && t.t3 <= 3900)) e.t3 = 'Enter a time between 14:00 and 65:00.';
  if (!e.t1 && !e.t3 && t.t3 < t.t1 * 2.9) e.t3 = 'This is faster than 3× your mile. Check both times.';
  return e;
}
function runCtx(t) {
  const P1 = t.t1, P3 = t.t3 / 3;
  const pred3 = t.t1 * Math.pow(3, 1.06);
  const E = t.t3 / pred3;
  const focus = E > 1.04 ? 'endurance' : E < 0.98 ? 'speed' : 'balanced';
  const T2 = t.t1 * Math.pow(2, 1.06);
  return { t100: t.t100, t1: t.t1, t3: t.t3, P1, P3, pred3, E, focus,
    easyLo: P3 * 1.22, easyHi: P3 * 1.32, T: P3 * 1.045, I: (T2 / 2 + P3 * 0.96) / 2, R: P1,
    stride: t.t100 / 0.80, s150: t.t100 * 1.48 / 0.90, s200: t.t100 * 2.06 / 0.90, reserve: (MILE / t.t1) / (100 / t.t100) };
}
const GOAL_PCT = { balanced: [0.02, 0.045, 0.06], endurance: [0.015, 0.045, 0.075], speed: [0.03, 0.045, 0.05] };
function runGoal(c) { const g = GOAL_PCT[c.focus]; const o = { h100: c.t100 * (1 - g[0]), h1: c.t1 * (1 - g[1]), h3: c.t3 * (1 - g[2]), g }; if (c.h) { if (c.h.h1) o.h1 = Math.min(o.h1, c.h.h1); if (c.h.h3) o.h3 = Math.min(o.h3, c.h.h3); } return o; }
/* 8-week target ranges: the faster end is 1.4× the goal improvement, the slower end 0.6× */
function runTargets(c) { const g = runGoal(c).g; const r = (now, x) => ({ now, fast: now * (1 - x * 1.4), slow: now * (1 - x * 0.6) }); return { t100: r(c.t100, g[0]), t1: r(c.t1, g[1]), t3: r(c.t3, g[2]) }; }
const plusN = (c, n) => c.focus === 'speed' ? n + 1 : n;
const minsN = (c, n) => c.focus === 'endurance' ? n + 5 : n;
/* A session item: k (name), d (what to do), r (target shown), log (how it becomes a workout exercise, or none) */
const rIt = (k, d, r, log) => ({ k, d, r: r || '', log: log || null });
const easyR = c => rfmt(c.easyLo) + '–' + rfmt(c.easyHi) + ' /mi';
function sessA(w, c) {
  const acc = n => rIt('Accelerations', n + ' × 60 m, build to about 90%, walk back', 'by feel', { ex: 'Accelerations', sets: n, tg: { d: 60, judge: 'feel' } });
  const str = n => rIt('Strides', n + ' × 100 m, relaxed and fast, walk back', rfmt(c.stride) + ' each', { ex: 'Strides', sets: n, tg: { d: 100, t: c.stride, judge: 'split' } });
  const s150 = n => rIt('Speed 150s', n + ' × 150 m at 90%, 3 min walk between', rfmt(c.s150) + ' each', { ex: 'Speed 150 m', sets: n, tg: { d: 150, t: c.s150, judge: 'split' } });
  const s200 = n => rIt('Speed 200s', n + ' × 200 m at 90%, 4 min walk between', rfmt(c.s200) + ' each', { ex: 'Speed 200 m', sets: n, tg: { d: 200, t: c.s200, judge: 'split' } });
  const rep = (n, m, rest) => rIt('Reps', n + ' × ' + m + ' m at mile pace, ' + rest + ' between', rfmt(splitAt(c.R, m)) + ' each', { ex: 'Mile-Pace Reps', sets: n, tg: { d: m, t: splitAt(c.R, m), judge: 'split' } });
  const g = runGoal(c);
  switch (w) {
    case 1: return { t: 'Speed', hard: 'sprint', items: [acc(plusN(c, 4)), str(6), rep(4, 200, '200 m walk/jog')] };
    case 2: return { t: 'Speed', hard: 'sprint', items: [acc(plusN(c, 4)), s150(2), rep(6, 200, '200 m jog')] };
    case 3: return { t: 'Speed', hard: 'sprint', items: [acc(3), s150(plusN(c, 3)), rep(4, 400, '400 m jog')] };
    case 4: return { t: 'Light', easy: true, items: [rIt('Easy run', '20 min', easyR(c), { ex: 'Easy Run', sets: 1, tg: { dur: 1200, lo: c.easyLo, hi: c.easyHi, judge: 'easy' } }), str(6)] };
    case 5: return { t: 'Speed', hard: 'sprint', items: [acc(plusN(c, 4)), s200(3), rep(4, 200, '200 m jog')] };
    case 6: return { t: 'Speed', hard: 'sprint', items: [acc(4), s150(plusN(c, 2)), rep(6, 300, '300 m jog')] };
    case 7: return { t: 'Speed', hard: 'sprint', items: [acc(3), s150(plusN(c, 3)), rep(6, 400, '400 m jog')] };
    case 8: return { t: '100 m test', test: 't100', hard: 'sprint', items: [
      rIt('Build-ups', '15 min warm-up and drills, then 3 × 60 m building to near full speed', '', { ex: 'Accelerations', sets: 3, tg: { d: 60, judge: 'feel' } }),
      rIt('Test', '2–3 timed 100 m from a standing start, 5 min full rest between. Keep the best.', rfmt(g.h100) + ' goal', { ex: '100 m Sprint', sets: 3, tg: { d: 100, goal: g.h100, judge: 'goal', test: 't100' } }),
      rIt('Finish', '4 × 200 m at mile pace, 200 m jog', rfmt(splitAt(c.R, 200)) + ' each', { ex: 'Mile-Pace Reps', sets: 4, tg: { d: 200, t: splitAt(c.R, 200), judge: 'split' } })] };
  }
}
function sessB(w, c) {
  const thr = (d, n, secs) => rIt('Threshold', d, paceTxt(c.T), { ex: 'Threshold Run', sets: n, tg: { dur: secs, pace: c.T, judge: 'pace' } });
  const vo = (n, m, rest) => rIt('Intervals', n + ' × ' + m + ' m, ' + rest + ' jog between', rfmt(splitAt(c.I, m)) + ' each', { ex: 'Interval Reps', sets: n, tg: { d: m, t: splitAt(c.I, m), judge: 'split' } });
  const g = runGoal(c);
  const warm = rIt('Warm-up', '15 min easy with 4 strides');
  switch (w) {
    case 1: return { t: 'Threshold', items: [thr('3 × 5 min, 2 min jog between', 3, 300)] };
    case 2: return { t: 'Threshold', items: [thr('4 × 5 min, 1 min jog between', 4, 300)] };
    case 3: return { t: 'Intervals', hard: 'interval', items: [vo(5, 800, '2:30')] };
    case 4: return { t: 'Mile check', test: 'check', hard: 'interval', items: [warm,
      rIt('Mile time trial', 'Even pace: aim for each 400 m in the split shown, push the last lap', rfmt(splitAt(c.R, 400)) + ' /400 m', { ex: 'Mile Time Trial', sets: 1, tg: { d: MILE, goal: c.t1, tol: 2 * MILE / 200, judge: 'goal', test: 'check', lap: 400, split: splitAt(c.R, 400) } }),
      rIt('Cool-down', '10 min easy')] };
    case 5: return { t: 'Threshold', items: [thr('2 × 10 min, 2 min jog between', 2, 600)] };
    case 6: return { t: 'Intervals', hard: 'interval', items: [vo(4, 1000, '3 min')] };
    case 7: return { t: 'Threshold', items: [thr('20 min continuous', 1, 1200)] };
    case 8: return { t: 'Mile test', test: 't1', hard: 'interval', items: [warm,
      rIt('Mile test', 'All-out, even first three laps, empty the tank on the fourth', rfmt(g.h1) + ' goal', { ex: 'Mile Time Trial', sets: 1, tg: { d: MILE, goal: g.h1, judge: 'goal', test: 't1', lap: 400, split: splitAt(g.h1, 400) } }),
      rIt('Lap split for goal', '', rfmt(splitAt(g.h1, 400)) + ' /400 m')] };
  }
}
function sessC(w, c) {
  const e = (m, strides) => { const a = [rIt('Easy run', m + ' min', easyR(c), { ex: 'Easy Run', sets: 1, tg: { dur: m * 60, lo: c.easyLo, hi: c.easyHi, judge: 'easy' } })];
    if (strides) a.push(rIt('Strides', '4 × 100 m after the run', rfmt(c.stride) + ' each', { ex: 'Strides', sets: 4, tg: { d: 100, t: c.stride, judge: 'split' } })); return a; };
  const g = runGoal(c);
  switch (w) {
    case 1: return { t: 'Easy', easy: true, items: e(minsN(c, 25), true) };
    case 2: return { t: 'Easy', easy: true, items: e(minsN(c, 30), true) };
    case 3: return { t: 'Easy', easy: true, items: e(minsN(c, 35), false) };
    case 4: return { t: 'Easy', easy: true, items: e(25, false) };
    case 5: return { t: 'Easy', easy: true, items: e(minsN(c, 40), true) };
    case 6: return { t: 'Easy', easy: true, items: e(minsN(c, 40), false) };
    case 7: return { t: 'Easy', easy: true, items: e(minsN(c, 45), true) };
    case 8: return { t: '3 mile test', test: 't3', items: [rIt('Warm-up', '10 min easy with 4 strides. Run this 3 or more days after the mile test.'),
      rIt('3 mile test', 'Hold an even pace and pick it up over the last half mile', rfmt(g.h3) + ' goal', { ex: '3 Mile Time Trial', sets: 1, tg: { d: 3 * MILE, goal: g.h3, judge: 'goal', test: 't3', lap: 1609, split: g.h3 / 3 } }),
      rIt('Mile split for goal', '', rfmt(g.h3 / 3) + ' /mi')] };
  }
}
const PICK2 = { endurance: 'BABxBAB', speed: 'ABAxABA', balanced: 'ABAxBAB' };
const WEEK_LABEL = ['', 'Base', 'Build', 'Build', 'Lighter', 'Build', 'Build', 'Peak', 'Test'];
/* Default days (0 = Sunday): 3 runs → A Tue, C Thu, B Fri; 2 runs → Tue and Thu, week 8's second run on Sunday, the 100 m test on Monday */
const RUN_DAYS = { 3: { A: 2, B: 5, C: 4 }, 2: { 1: 2, 2: 4, T: 1 } };
const RUN_LIFTS = { 1: 'Push', 3: 'Legs', 4: 'Pull', 6: 'Full Body' };
/* The week's sessions: [{ key, name, s: session, dow }] */
function weekSessions(w, c, runs, days) {
  const A = sessA(w, c), B = sessB(w, c), C = sessC(w, c); days = days || {};
  const dd = (key, def) => days[key] != null ? +days[key] : def;
  if (runs === 3) return [{ key: 'A', name: 'Run A', s: A, dow: dd('A', 2) }, { key: 'C', name: 'Run C', s: C, dow: dd('C', 4) }, { key: 'B', name: 'Run B', s: B, dow: dd('B', 5) }];
  if (w === 4) return [{ key: '1', name: 'Run 1', s: B, dow: dd('1', 2) }, { key: '2', name: 'Run 2', s: C, dow: dd('2', 4) }];
  if (w === 8) return [{ key: 'T', name: '100 m test', s: { t: 'Before lifting', test: 't100', hard: 'sprint', items: [A.items[0], A.items[1]] }, dow: dd('T', 1) }, { key: '1', name: 'Run 1', s: B, dow: dd('1', 2) }, { key: '2', name: 'Run 2', s: C, dow: days['2'] != null ? +days['2'] : 0 }];
  const p = PICK2[c.focus].charAt(w - 1);
  return [{ key: '1', name: 'Run 1', s: p === 'A' ? A : B, dow: dd('1', 2) }, { key: '2', name: 'Run 2', s: C, dow: dd('2', 4) }];
}
/* ---- State ---- */
function normRun(r) {
  if (!r || typeof r !== 'object') return null;
  const o = { runs: 3, block: 1, hist: [], days: {}, lifts: { ...RUN_LIFTS }, swaps: {}, marks: {}, ...r };
  o.runs = o.runs === 2 ? 2 : 3; o.hist = Array.isArray(o.hist) ? o.hist : []; for (const k of ['days', 'lifts', 'swaps', 'marks', 'easy']) if (!o[k] || typeof o[k] !== 'object') o[k] = {};
  return o;
}
const runSt = () => normRun(S.meta.run);
const runCtxNow = () => { const R = runSt(); return R && R.t1 && R.t3 && R.t100 ? runCtx(R) : null; };
function runCommit(fn) { commit(st => { st.meta.run = normRun(st.meta.run) || normRun({}); fn(st.meta.run); }, 'meta', 600); }
const nextMonday = () => { const d = startOfDay(new Date()); const add = (8 - d.getDay()) % 7 || 7; return ymd(addDays(d, add)); };
const weekStart = (R, w) => addDays(parseYmd(R.start), 7 * (w - 1));
const sessDate = (R, w, dow) => { const s = parseYmd(R.start); return addDays(s, 7 * (w - 1) + ((dow - s.getDay() + 7) % 7)); };
/* The plan week for a date: 0 before the start, 9 after week 8 */
function runWeekOf(R, d) { const k = Math.floor((startOfDay(d) - parseYmd(R.start)) / (7 * DAY)) + 1; return k < 1 ? 0 : k > 8 ? 9 : k; }
const sessId = (R, w, key) => (R.block || 1) + '-' + w + '-' + key;
/* Saved workouts for a plan session (the latest one counts) */
function runLogged(R, w, key) { const id = sessId(R, w, key); return sessionList().filter(s => s.run && s.run.id === id); }
function runStatus(R, w, key) {
  const id = sessId(R, w, key); const logs = runLogged(R, w, key); if (!logs.length) return null;
  const last = logs[logs.length - 1]; const mark = R.marks[id];
  return { s: last, auto: last.run.status || sessionStatus(last.items), st: mark || last.run.status || sessionStatus(last.items), manual: !!mark };
}
/* Lifting the day before (or the same day as) a sprint or interval session */
const LEGGY = { Legs: 1, Lower: 1 };
function legsClash(R, dow, hard) {
  if (!hard) return null;
  const prev = R.lifts[(dow + 6) % 7], same = R.lifts[dow];
  if (LEGGY[prev]) return 'after';
  if (LEGGY[same]) return 'same';
  return null;
}
/* Did a logged workout yesterday train legs? (any day typed Legs or Lower) */
function legsYesterday() {
  const y = ymd(addDays(new Date(), -1));
  for (const s of sessionList()) { if (ymd(s.startedAt) !== y || s.kind === 'activity') continue;
    const r = s.routineId && getRoutine(s.routineId); const d = r && r.days.find(x => x.id === s.dayId);
    const tags = d ? dayTags(d, r) : autoTags({ name: s.name, items: s.items.map(it => ({ ex: it.ex, sets: it.sets.length })) }, null);
    if (tags.some(t => LEGGY[t])) return true; }
  return false;
}
/* ---- Cross-training swaps (rough equivalents in training effect) ---- */
const SWAPS = [['bike', 'Bike', 'Bike'], ['rower', 'Rower', 'Rowing Machine (Erg)'], ['elliptical', 'Elliptical', 'Elliptical'], ['incline', 'Incline walk', 'Incline Walk'], ['swim', 'Swim', 'Swim']];
const sessType = s => s.test ? 'test' : s.easy ? 'easy' : s.t === 'Threshold' ? 'threshold' : s.t === 'Intervals' ? 'vo2' : 'sprint';
/* What a swap means for this session: { ok, txt, items } (items as plan log specs) */
function swapPlan(s, mode) {
  const ty = sessType(s); const ex = (SWAPS.find(x => x[0] === mode) || [])[2];
  const easyMin = (s.items.find(i => i.log && i.log.ex === 'Easy Run') || { log: { tg: { dur: 1800 } } }).log.tg.dur / 60;
  const reps = s.items.filter(i => i.log && i.log.ex !== 'Strides' && i.log.ex !== 'Accelerations');
  const R5 = x => Math.round(x / 5) * 5 || Math.round(x);
  if (ty === 'test') return { ok: false, txt: 'Tests need the real thing. Move it to another day instead.' };
  if (ty === 'easy') {
    const m = { bike: [easyMin * 1.33, easyMin * 1.5, 'easy'], rower: [easyMin, 0, 'easy'], elliptical: [easyMin, easyMin * 1.17, ''], incline: [easyMin * 1.33, 0, '8–12% grade'], swim: [easyMin * 0.83, 0, 'steady'] }[mode];
    const lo = R5(m[0]), hi = m[1] ? R5(m[1]) : 0;
    return { ok: true, txt: (hi ? lo + '–' + hi : lo) + ' min' + (m[2] ? ', ' + m[2] : ''), items: [{ ex, sets: 1, k: m[2] ? m[2][0].toUpperCase() + m[2].slice(1) : '', tg: { dur: lo * 60, judge: 'dur' } }] };
  }
  if (ty === 'threshold') {
    if (mode === 'incline') return { ok: false, txt: 'Not a good match for threshold work.' };
    const txt = { bike: 'Same work and rest, comfortably hard', rower: 'Same work and rest, about 2:00–2:10 per 500 m feel', elliptical: 'Same work and rest', swim: 'Same work time, hard' }[mode];
    return { ok: true, txt, items: reps.map(i => ({ ex, sets: i.log.sets, k: txt, tg: { dur: i.log.tg.dur, judge: 'dur' } })) };
  }
  if (ty === 'vo2') {
    if (mode === 'incline') return { ok: false, txt: 'Not a good match for intervals.' };
    const i = reps[0]; const repT = Math.round(i.log.tg.t);
    if (mode === 'rower') { const m = i.log.tg.d >= 1000 ? 600 : 500; return { ok: true, txt: i.log.sets + ' × ' + m + ' m hard, same rest', items: [{ ex, sets: i.log.sets, k: 'Hard', tg: { d: m, judge: 'feel' } }] }; }
    const txt = i.log.sets + ' × ' + rfmt(repT) + ' hard, same rest' + (mode === 'elliptical' ? ' (harder to push)' : '');
    return { ok: true, txt, items: [{ ex, sets: i.log.sets, k: 'Hard', tg: { dur: repT, judge: 'dur' } }] };
  }
  if (mode === 'bike') return { ok: true, txt: '8 × 10 s all-out, 1 min easy between', items: [{ ex: 'Bike Sprints', sets: 8, k: 'All-out, 1 min easy between', tg: { dur: 10, judge: 'dur' } }] };
  if (mode === 'rower') return { ok: true, txt: '8 × 15 s all-out', items: [{ ex: 'Rower Sprints', sets: 8, k: 'All-out', tg: { dur: 15, judge: 'dur' } }] };
  if (mode === 'incline') return { ok: true, txt: 'Hill sprints instead: 6 × 10 s', items: [{ ex: 'Hill Sprints', sets: 6, k: 'Hard uphill, walk back down', tg: { dur: 10, judge: 'dur' } }] };
  return { ok: false, txt: 'Not a good match for sprints. Short hill sprints keep the speed work with less impact.' };
}
/* ---- Starting a plan session as a workout ---- */
function runItems(specs) { return specs.map((l, j) => ({ id: 'rp-' + j, ex: (findIn(BUILTIN_EX)(l.ex) || ensureEx(l.ex, 'distance')).id, sets: l.sets, reps: '', group: '', ss: false, note: '', tg: { ...l.tg, k: l.k || '' } })); }
function startRunSession(w, key, force) {
  const R = runSt(); const c = runCtxNow(); if (!R || !c) return;
  const ws = planWeek(R, w).find(x => x.key === key); if (!ws) return;
  const id = sessId(R, w, key); const mode = R.swaps[id]; const sw = mode ? swapPlan(ws.s, mode) : null;
  if (!force && ws.s.hard && !(sw && sw.ok) && legsYesterday()) {
    openSheet({ type: 'confirm', title: 'Legs yesterday', body: 'Sprints and hard intervals the day after Legs raise the risk of a strain. Do an easy run or a cross-training swap today and move this session, or start it anyway.', ok: 'Start anyway', onOk: () => { closeSheet(); startRunSession(w, key, true); } });
    return;
  }
  const specs = sw && sw.ok ? sw.items : ws.s.items.filter(i => i.log).map(i => ({ ...i.log, k: i.d }));
  const name = 'Week ' + w + ' · ' + ws.name + ' · ' + (sw && sw.ok ? (SWAPS.find(x => x[0] === mode) || [])[1] : ws.s.t);
  startWorkout({ id: 'run-plan', name: 'Running plan' }, { id: 'run-' + id, name, items: runItems(specs) });
  if (S.active && S.active.dayId === 'run-' + id) { S.active.run = { id, w, key, block: R.block || 1, swap: mode || '', test: sw && sw.ok ? '' : (ws.s.test || ''), hard: ws.s.hard || '' }; touch(500); }
}
/* After a run is saved: tests update the times (week 4 only when more than 5 s faster), and the session gets its status */
function runFinished(session) {
  const R = runSt(); if (!R || !session.run) return;
  const status = sessionStatus(session.items); const run = { ...session.run, status }; const msgs = [];
  const best = test => { const it = session.items.find(i => i.target && i.target.test === test); if (!it) return 0; const ts = it.sets.filter(x => +x.t > 0).map(x => +x.t); return ts.length ? Math.min(...ts) : 0; };
  const upd = {};
  if (run.test === 'check') { const t = best('check'); if (t) { if (t < R.t1 - 5) { upd.t1 = t; msgs.push('Mile check ' + rfmt(t) + ': more than 5 s faster, so your mile is updated and weeks 5–8 use the new paces.'); } else msgs.push('Mile check ' + rfmt(t) + '. Your paces stay the same.'); } }
  for (const [test, k, l] of [['t100', 't100', '100 m'], ['t1', 't1', 'Mile'], ['t3', 't3', '3 miles']]) if (run.test === test) { const t = best(test); if (t) { upd[k] = t; msgs.push(l + ' retest ' + rfmt(t) + (R[k] ? (t < R[k] ? ', ' + rfmt(R[k] - t) + ' faster than before' : ', ' + rfmt(t - R[k]) + ' slower than before') : '') + '. Paces updated.'); } }
  run.msg = msgs.join(' ');
  commit(st => { const s = st.sessions[session.id]; if (s) s.run = run;
    if (Object.keys(upd).length) { const r = st.meta.run = normRun(st.meta.run); Object.assign(r, upd); r.hist.push({ d: ymd(session.startedAt), t100: r.t100, t1: r.t1, t3: r.t3, why: run.test === 'check' ? 'wk4' : 'wk8' }); } }, ['s_' + session.id, 'meta'], 300);
}

/* ============ Conditioning programs ============ */
/* Six programs from the Running & Conditioning page, as built-in plans. In the app they have generic names; the
   page notes what each borrows from. A day can carry an interval-timer setup (rounds, AMRAP, EMOM, 20 on / 10 off),
   started from the workout screen. Items: [exercise, sets, reps, note, target]. */
const COND = [
  { id: 'bi-cond-aerobic', name: 'Aerobic Base', builds: 'Endurance engine, recovery', week: '2–3 h', equip: 'Any cardio', cost: 'Low',
    strengths: ['Builds the aerobic engine that every other kind of fitness sits on, including recovery between lifting sets.', 'Barely dents your lifting recovery, so it pairs with heavy training better than anything else here.', 'Can be done on any machine, so it doubles as cross-training.', 'Low injury risk; the safest way to add volume.'],
    result: 'Over 8–12 weeks your easy pace gets faster at the same heart rate (often 20–40 s per mile), resting heart rate drops a few beats, and your 3 miles improves more than your mile. Your 100 m won’t change.',
    fit: 'Your 3 miles lags your mile, or you want cardio that won’t cost you muscle.',
    watch: ['It feels too easy, which is the point. Most people run it too fast.', 'The 180-minus-age heart-rate rule is a rough guide; the talk test works as well.', 'Slow to show results. Judge it at 8 weeks, not 2.'],
    days: [
      ['After Push', [['Bike', 1, '', 'Easy: you can talk in full sentences.', { dur: 1800, judge: 'dur' }]]],
      ['Easy run + hard efforts', [['Easy Run', 1, '', 'Easy run, or run/walk.', { dur: 2700, pace: 'easy' }], ['Hard Efforts', 6, '', 'Once a week: 6 × (1 min hard, 2 min easy) inside one session. This is the hard 20% of the week.', { dur: 60, judge: 'dur' }]],
        { mode: 'intervals', name: '6 × 1 min hard / 2 min easy', prep: 10, work: 60, rest: 120, rounds: 6, sets: 1, setRest: 60, cool: 0 }],
      ['After Full Body', [['Incline Walk', 1, '', 'Brisk, 8–12% grade.', { dur: 1500, judge: 'dur' }]]],
      ['Long easy day', [['Easy Run', 1, '', 'Easy hike, ride or run.', { dur: 3600, pace: 'easy' }]]],
    ] },
  { id: 'bi-cond-2010', name: '20/10 Intervals', builds: 'VO₂max, anaerobic capacity', week: '40–60 min', equip: 'Bike or rower', cost: 'High per minute',
    strengths: ['Very time-efficient: the work itself is 4 minutes.', 'Trains both the aerobic and the anaerobic system, which few methods do at once.', 'Done on a bike or rower, it spares your legs the pounding of sprinting.'],
    result: 'In the original 6-week study, fit students training 5 days a week raised VO₂max by about 14% and anaerobic capacity by about 28%. Training 2 days a week, expect smaller gains: a noticeably stronger last lap of the mile and faster recovery between hard efforts within 4–6 weeks.',
    fit: 'You’re short on time, or your mile fades in the last 400 m.',
    watch: ['True all-out is brutal. Most classes sold as 20-second intervals are far easier and give far less.', 'Don’t run the 20 s sprints on pavement; bike, rower or ski erg instead.', 'Max 2 a week, never the day before Legs. Stop if you feel dizzy or sick, not just tired.'],
    days: [
      ['20 on / 10 off', [['Bike Sprints', 8, '', '10 min easy warm-up first, 10 min easy after. 8 × (20 s all-out, 10 s easy). Weeks 4+: two blocks with 4 min rest between (set Sets to 2 in the timer).', { dur: 20, judge: 'dur' }]],
        { mode: 'intervals', name: '20 on / 10 off × 8', prep: 10, work: 20, rest: 10, rounds: 8, sets: 1, setRest: 240, cool: 0 }],
      ['30 on / 30 off', [['Rowing Machine (Erg)', 10, '', '10 min easy warm-up first, 10 min easy after. 10 × (30 s hard, 30 s easy).', { dur: 30, judge: 'dur' }]],
        { mode: 'intervals', name: '30 on / 30 off × 10', prep: 10, work: 30, rest: 30, rounds: 10, sets: 1, setRest: 60, cool: 0 }],
      ['Optional easy day', [['Bike', 1, '', 'Easy walk or ride.', { dur: 1800, judge: 'dur' }]]],
    ] },
  { id: 'bi-cond-tactical', name: 'Tactical Readiness', builds: 'Muscular endurance, rucking, grit', week: '3–4 h', equip: 'Pull-up bar, backpack', cost: 'Medium–high',
    strengths: ['Big gains in push-ups, pull-ups and core endurance.', 'Rucking builds legs, back and durability with little impact.', 'Simple equipment; works anywhere.', 'Built to be measured: test it every 4 weeks.'],
    result: 'In 8 weeks, untrained people often add 30–50% to their push-up and pull-up counts, cut their 1.5–2 mile time by 5–10%, and can carry a 25–35 lb pack for 4–6 miles. Builds toughness more than top speed.',
    fit: 'You like clear tests to beat, or you’re heading somewhere outdoorsy or overseas.',
    watch: ['High-rep push-ups on top of chest-focused lifting can overload your shoulders. Cut chest volume by a third while you run this.', 'Raise ruck weight or distance by no more than 10% a week.', 'Shins: build run volume slowly.'],
    days: [
      ['After Push: push-up ladder', [['Push-Ups', 10, '', 'Ladder: 1, 2, 3 … 10 reps, 30 s rest between.']]],
      ['400s + pull-ups', [['Run 400m', 6, '', 'At interval pace, 90 s rest between.', { d: 400, pace: 'I' }], ['Pull-Up', 3, '', 'Max reps each set.']]],
      ['After Pull: plank series', [['Plank', 3, '', 'Front plank.', { dur: 60, judge: 'dur' }], ['Side Plank', 3, '', 'Each side.', { dur: 45, judge: 'dur' }]]],
      ['Ruck', [['Ruck', 1, '', '3–5 miles with 20–35 lb, brisk walk.', { d: 3 * MILE, w: 25 }]]],
      ['Test (every 4 weeks)', [['Push-Ups', 1, '', '2 minutes, as many as you can.'], ['Pull-Up', 1, '', 'Max reps.'], ['Sit-Ups', 1, '', '2 minutes, as many as you can.'], ['2 Mile Run', 1, '', 'All-out.', { d: 2 * MILE }]],
        { mode: 'amrap', name: '2-minute test', prep: 10, total: 120 }],
    ] },
  { id: 'bi-cond-hybrid', name: 'Hybrid Race', builds: 'Running while tired, strength-endurance', week: '2–3 h', equip: 'Full gym', cost: 'High',
    strengths: ['Teaches you to run well on tired legs, which plain running never does.', 'Uses your gym: sled, rower, carries, wall balls, lunges.', 'Builds strength-endurance without much lost muscle.', 'Easy to score and repeat.'],
    result: 'In 8 weeks expect a much smaller drop in run pace after strength work, a faster threshold pace, and stronger carries and lunges. Plain mile and 100 m times improve only a little.',
    fit: 'You want conditioning that feels like lifting, or you’d enjoy entering a hybrid fitness race.',
    watch: ['Lunges and wall balls hit your legs hard. Never on the day before or after Legs.', 'Needs a sled and a rower or ski erg. Swap in heavy carries and burpees if you lack them.', 'Cap the first sessions at 3–4 rounds.'],
    days: [
      ['Run + station rounds', [['Run 800m', 4, '', 'Each round: run 800 m at threshold pace, then one station, then 2 min rest.', { d: 800, pace: 'T' }], ['Wall Ball', 1, '20', 'Station 1.'], ['Sled Push', 1, '', 'Station 2.', { d: 40 }], ['Rowing Machine (Erg)', 1, '', 'Station 3.', { d: 500 }], ['Burpee Broad Jumps', 1, '20', 'Station 4.']]],
      ['After Pull: carries', [["Farmer's Carry", 3, '', 'Heavy.', { d: 200 }], ['Sandbag Walking Lunge', 3, '', '', { d: 20 }]]],
      ['Race simulation', [['Run 1 km', 4, '', '4 × (1 km run + 1 station), no rest, timed. Add a round every 2 weeks.', { d: 1000 }], ['Wall Ball', 1, '20'], ['Sled Push', 1, '', '', { d: 40 }], ['Rowing Machine (Erg)', 1, '', '', { d: 500 }], ['Burpee Broad Jumps', 1, '20']],
        { mode: 'stopwatch', name: 'Stopwatch' }],
    ] },
  { id: 'bi-cond-metcon', name: 'Mixed-Modal Metcons', builds: 'General work capacity', week: '1.5–2.5 h', equip: 'Basic gym', cost: 'Medium–high',
    strengths: ['Broad work capacity: running, bodyweight and light loads mixed.', 'Variety keeps it interesting.', 'Benchmark workouts give you a clear number to beat.'],
    result: 'In 6–8 weeks benchmark times drop 10–20%, high-rep bodyweight endurance rises, and you get through hard days with less fatigue. It’s less specific: your mile improves somewhat, your 100 m barely.',
    fit: 'You get bored by plain cardio and want a scored workout.',
    watch: ['A huge high-rep benchmark as a first workout can cause serious muscle breakdown (rhabdomyolysis) in untrained people. Start with a quarter or half.', 'Technique slips when you race the clock; slow down before form goes.', 'Repeat benchmarks so you can see progress; random workouts hide it.'],
    days: [
      ['12 min AMRAP', [['Run 200m', 1, '', 'As many rounds as you can in 12 minutes of: 200 m run, 10 kettlebell swings, 10 push-ups. Note your rounds.', { d: 200 }], ['Kettlebell Swing', 1, '10'], ['Push-Ups', 1, '10']],
        { mode: 'amrap', name: 'AMRAP 12 min', prep: 10, total: 720 }],
      ['After Pull: 12 min EMOM', [['Rowing Machine (Erg)', 6, '', 'Odd minutes: 12 calories.'], ['Air Squat', 6, '15', 'Even minutes.']],
        { mode: 'emom', name: 'EMOM 12 min', prep: 10, every: 60, rounds: 12 }],
      ['Benchmark', [['Run Half Mile', 1, '', 'Split the reps any way you like. Retest every 4 weeks.', { d: MILE / 2 }], ['Pull-Up', 1, '50'], ['Push-Ups', 1, '100'], ['Air Squat', 1, '150'], ['Run Half Mile', 1, '', 'Finish.', { d: MILE / 2 }]],
        { mode: 'stopwatch', name: 'Stopwatch' }],
    ] },
  { id: 'bi-cond-fight', name: 'Fight Rounds', builds: 'Repeat power, recovery between rounds', week: '2–3 h', equip: 'Kettlebell, bag optional', cost: 'Medium',
    strengths: ['Trains repeated bursts with short recovery, the way a grappling round or a game actually feels.', 'Builds grip, hips and power through the round, not just at the start.', 'A good bridge if you sign up for jiu-jitsu.'],
    result: 'In 6–8 weeks you recover faster between rounds and between hard efforts, keep more power late in a round, and your heart rate comes down quicker. Your mile gains a little from the extra aerobic work.',
    fit: 'You’re thinking about jiu-jitsu again, or you like short, intense, varied rounds.',
    watch: ['Needs the easy runs too; rounds alone don’t build enough aerobic base.', 'Swings and sprawls: learn the hip hinge before going fast.', 'Keep the same round times week to week and add rounds, not chaos.'],
    days: [
      ['Rounds', [['Kettlebell Swing', 5, '', '5 rounds of 3 min, 1 min rest. Each round: 30 s swings, 30 s sprawls, 30 s shadow boxing or bag, then repeat.'], ['Sprawls', 5, '', '', { dur: 30, judge: 'dur' }], ['Shadow Boxing or Bag', 5, '', '', { dur: 30, judge: 'dur' }]],
        { mode: 'intervals', name: '5 × 3 min rounds, 1 min rest', prep: 10, work: 180, rest: 60, rounds: 5, sets: 1, setRest: 60, cool: 0 }],
      ['After Pull: roadwork + grip', [['Easy Run', 1, '', 'Easy roadwork.', { dur: 1800, pace: 'easy' }], ['Dead Hang', 3, '', 'Max hold.', { judge: 'max' }]]],
      ['After Full Body: bike rounds', [['Bike', 6, '', '6 rounds of 2 min hard, 1 min easy, then 10 min easy.', { dur: 120, judge: 'dur' }]],
        { mode: 'intervals', name: '6 × 2 min hard / 1 min easy', prep: 10, work: 120, rest: 60, rounds: 6, sets: 1, setRest: 60, cool: 600 }],
    ] },
];
const COND_FIT = ['For building muscle and losing belly fat, the 3-run plan, or 2 runs plus one Aerobic Base session, is enough. More conditioning eats into recovery from lifting. Fat loss comes mostly from your eating; conditioning helps at the margin.',
  'To add a program on top of running, drop to the 2-run plan and do 1–2 sessions from the program on non-leg days.',
  'To run a program instead of the running plan, do it for 6–8 weeks, then retest your three times to see what carried over.',
  'High-cost programs (20/10 Intervals, Hybrid Race, Tactical Readiness): cut one set from each lift on Legs and Full Body while you run them.'];
for (const P of COND) {
  const days = P.days.map(([dn, items, timer], i) => {
    const d = planDay(P.id, i + 1, dn, ['Conditioning'], items.map(([n, sets, reps, note]) => [n, sets, reps, note]));
    d.items.forEach((it, j) => { const tg = items[j][4]; if (tg) it.tg = { ...tg }; });
    if (timer) d.timer = { id: 'ct-' + P.id + '-' + (i + 1), ...timer };
    return d;
  });
  BUILTIN_ROUTINES.push({ id: P.id, name: P.name, note: P.fit, source: 'builtin', shelf: 'programs', meta: 'Conditioning · ' + P.days.length + ' days a week', days, info: P });
}
/* Exercises the programs added through planDay get the right kind */
for (const [kind, names] of Object.entries(MEAS_EX)) for (const n of names) { const e = findIn(BUILTIN_EX)(n); if (e) e.kind = kind; }
ensureEx('Hard Efforts', 'timed', 'cardio');
for (const n of ['Burpee Broad Jumps', 'Wall Ball', 'Kettlebell Swing', 'Sit-Ups', 'Push-Ups', 'Pull-Up', 'Air Squat']) { const e = findIn(BUILTIN_EX)(n); if (e && isMeasured(e.kind)) e.kind = 'bodyweight'; }

/* ============ Run screen (Train → Run) ============ */
const RUN_NOTE = 'Paces, targets and expected results are estimates for a healthy adult, not medical or coaching advice. Check with a doctor before starting hard interval training if you have heart, blood pressure or joint concerns.';
const FOCUS_TXT = c => { const pct = Math.round((c.E - 1) * 100); return {
  endurance: ['Speed is ahead of endurance', 'Your 3 miles is ' + pct + '% slower than your mile predicts (' + rfmt(c.pred3) + '). Your easy runs are 5 minutes longer each week and the threshold work matters most. That gap usually closes fastest of anything here.'],
  speed: ['Endurance is ahead of speed', 'Your 3 miles is as fast as or faster than your mile predicts (' + rfmt(c.pred3) + '). The plan adds an extra sprint or acceleration to each speed day, because top speed is what is holding your mile back.'],
  balanced: ['Speed and endurance are even', 'Your 3 miles is within a few percent of what your mile predicts (' + rfmt(c.pred3) + '). The plan weights speed, threshold and easy running equally.'] }[c.focus]; };
const timeIn = (v, sec) => v > 0 ? (sec ? (Math.round(v * 10) / 10).toString() : rfmt(v)) : '';
function RunTimesForm({ onSave, saveLabel, first }) {
  const R = runSt() || {};
  const [v, setV] = useState({ t100: timeIn(R.t100, 1), t1: timeIn(R.t1), t3: timeIn(R.t3) });
  const [runs, setRuns] = useState(R.runs || 3); const [start, setStart] = useState(R.start || nextMonday());
  const t = { t100: parseClock(v.t100), t1: parseClock(v.t1, false), t3: parseClock(v.t3, false) };
  const errs = runCheck(t); const touched = k => String(v[k]).trim() !== '';
  const ok = !Object.keys(errs).length;
  const field = (k, label, hint, ph) => html`<label class="run-in" for=${'rt-' + k}><span class="lbl">${label}</span>
    <input id=${'rt-' + k} class="field" inputmode="decimal" autocomplete="off" placeholder=${ph} value=${v[k]} onInput=${e => setV({ ...v, [k]: e.target.value })}/>
    <span class="small muted">${hint}</span>${touched(k) && errs[k] ? html`<span class="small down-c" role="alert">${errs[k]}</span>` : null}</label>`;
  return html`<div class="stack" style="gap:14px">
    <div class="run-ins">${field('t100', '100 m sprint', 'Seconds, e.g. 14.5', '14.5')}${field('t1', '1 mile', 'Minutes:seconds, e.g. 7:45', '7:45')}${field('t3', '3 miles', 'Minutes:seconds, e.g. 26:00', '26:00')}</div>
    <p class="note">Use honest, recent, all-out efforts: the 100 m from a standing start, the mile and 3 miles on flat ground or a track.</p>
    ${first ? html`<div><span class="lbl">Runs a week</span><div class="seg" role="group" aria-label="Runs a week" style="margin-top:6px">${[2, 3].map(n => html`<button key=${n} id=${'runs-' + n} class=${runs === n ? 'on' : ''} aria-pressed=${runs === n} onClick=${() => setRuns(n)}>${n} runs</button>`)}</div></div>
      <div><label class="lbl" for="run-start">Week 1 starts</label><input type="date" class="field" id="run-start" style="margin-top:6px" value=${start} onChange=${e => e.target.value && setStart(e.target.value)}/></div>` : null}
    <button class="btn primary wide" id="run-save" disabled=${!ok} onClick=${() => onSave({ ...t, runs, start })}>${saveLabel}</button>
  </div>`;
}
function RunSetup() {
  const save = x => { runCommit(r => { Object.assign(r, { t100: x.t100, t1: x.t1, t3: x.t3, runs: x.runs, start: x.start, block: r.block || 1 }); r.hist.push({ d: ymd(new Date()), t100: x.t100, t1: x.t1, t3: x.t3, why: 'start' }); }); showToast({ kind: 'info', text: 'Running plan ready' }); };
  return html`<div id="run-setup">
    <div class="section-h" style="margin-top:14px"><h2>Your base times</h2></div>
    <p class="note" style="margin-bottom:12px">Enter your 100 m, 1 mile and 3 mile times. The 8-week plan sets every pace and split from them and fits around your lifting days.</p>
    <${RunTimesForm} onSave=${save} saveLabel="Build my plan" first=${true}/>
    <p class="small faint" style="margin-top:14px">${RUN_NOTE}</p></div>`;
}
function RunScreen() {
  const R = runSt(); const c = runCtxNow();
  if (!R || !c) return html`<${RunSetup}/>`;
  const tab = ['plan', 'paces', 'programs', 'times'].includes(lsGet('runTab')) ? lsGet('runTab') : 'plan';
  const pick = k => { lsSet('runTab', k); S.rerender(); };
  return html`<div id="run-screen">
    <div class="seg wide run-seg" role="tablist" style="margin-top:12px">${[['plan', 'Plan'], ['paces', 'Paces'], ['programs', 'Programs'], ['times', 'Times']].map(([k, l]) => html`<button key=${k} role="tab" id=${'run-tab-' + k} aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => pick(k)}>${l}</button>`)}</div>
    ${tab === 'paces' ? html`<${RunPaces} c=${c}/>` : tab === 'programs' ? html`<${RunPrograms}/>` : tab === 'times' ? html`<${RunTimes}/>` : html`<${RunPlan} R=${R} c=${c}/>`}
    <p class="small faint" style="margin-top:18px">${RUN_NOTE}</p></div>`;
}
const RUN_SEL = { w: 0 };
function RunPlan({ R, c }) {
  const today = new Date(); const cur = runWeekOf(R, today);
  const w = RUN_SEL.w || (cur >= 1 && cur <= 8 ? cur : cur > 8 ? 8 : 1);
  const setW = x => { RUN_SEL.w = x; S.rerender(); };
  const ws = planWeek(R, w).sort((a, b) => ((a.dow - parseYmd(R.start).getDay() + 7) % 7) - ((b.dow - parseYmd(R.start).getDay() + 7) % 7));
  const a = weekStart(R, w), b = addDays(a, 6);
  const head = cur === 0 ? 'Starts ' + shortDate(parseYmd(R.start)) : cur > 8 ? 'All 8 weeks are done' : 'Week ' + cur + ' of 8 · ' + WEEK_LABEL[cur];
  const clashes = ws.map(x => ({ x, c: legsClash(R, x.dow, x.s.hard && !(R.swaps[sessId(R, w, x.key)] && swapPlan(x.s, R.swaps[sessId(R, w, x.key)]).ok)) })).filter(y => y.c);
  return html`<div>
    <div class="row" style="margin-top:14px;align-items:baseline"><h2 class="run-h">${head}</h2><span class="spacer"></span><span class="small muted">Block ${R.block || 1} · ${R.runs} runs a week</span></div>
    ${cur > 8 ? html`<div class="card stack" style="margin-top:10px" id="run-next-block"><div style="font-weight:700">Start the next block</div><p class="note">Your retest times are in. A new 8-week block starts next Monday with paces from your latest times.</p>
      <button class="btn primary" onClick=${() => { runCommit(r => { r.block = (r.block || 1) + 1; r.start = nextMonday(); r.swaps = {}; }); RUN_SEL.w = 1; showToast({ kind: 'info', text: 'Block ' + ((R.block || 1) + 1) + ' starts ' + shortDate(parseYmd(nextMonday())) }); }}>Start block ${(R.block || 1) + 1}</button></div>` : null}
    <div class="weekbar" role="tablist" aria-label="Week">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => html`<button key=${n} role="tab" aria-selected=${n === w} id=${'rw-' + n} class=${(n === w ? 'on ' : '') + (n === 4 || n === 8 ? 'test ' : '') + (n === cur ? 'now' : '')} onClick=${() => setW(n)}><b>${n}</b><span>${WEEK_LABEL[n]}</span></button>`)}</div>
    <div class="small muted" style="margin:8px 0 2px">Week ${w} · ${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}</div>
    <${RunWeekGrid} R=${R} w=${w} ws=${ws}/>
    <${RunAdapt} R=${R} w=${w} cur=${cur}/>
    ${clashes.length ? html`<div class="run-warn" role="alert" id="legs-warn">${clashes.map(({ x, c: k }) => html`<p key=${x.key}><b>${x.name} (${DOW[x.dow]})</b> is a ${x.s.hard === 'sprint' ? 'sprint' : 'hard interval'} session ${k === 'after' ? 'the day after Legs' : 'on a Legs day'}. Move it to another day, or swap it for cross-training.</p>`)}</div>` : null}
    ${w === 4 ? html`<p class="note" style="margin-top:12px">Lighter week: less volume so you absorb the first three weeks, plus a mile check. If you beat your mile by more than 5 seconds, your mile updates and weeks 5–8 use the new paces.</p>` : null}
    ${w === 8 ? html`<p class="note" style="margin-top:12px">Test week. Space the tests at least 2 days apart${R.runs === 2 ? '; do the 100 m test at the start of a lifting day, before you lift' : ''}. Each test updates that time, and the paces recalculate.</p>` : null}
    <div class="stack" style="margin-top:12px">${ws.map(x => html`<${RunSession} key=${x.key} R=${R} w=${w} x=${x}/>`)}</div>
    <div class="section-h"><h2>Every session</h2></div>
    <div class="card prl run-rules">
      <div><b>Warm-up</b><span>10 min easy jogging, then 5 min of drills (A-skips, high knees, butt kicks, leg swings). Cool down with 5–10 min easy.</span></div>
      <div><b>Hitting splits</b><span>Within 2 seconds per 200 m is on target. If a rep is more than 5% slower than the first, stop the set there.</span></div>
      <div><b>Easy means easy</b><span>You can speak full sentences. Walk hills if you need to.</span></div>
      <div><b>Pain rule</b><span>Soreness that fades after warming up is fine. Sharp pain, or pain in the shin, knee or Achilles that gets worse as you run: stop, and take 2–3 easy days.</span></div>
    </div></div>`;
}
function RunWeekGrid({ R, w, ws }) {
  const s0 = parseYmd(R.start).getDay(); const days = [0, 1, 2, 3, 4, 5, 6].map(i => (s0 + i) % 7);
  const a = weekStart(R, w); const todayK = ymd(new Date());
  const logged = {}; for (const s of sessionList()) { const k = ymd(s.startedAt); if (s.kind !== 'activity' && !s.run) (logged[k] = logged[k] || []).push(s); }
  return html`<div class="run-grid" id="run-grid">${days.map((dow, i) => { const d = addDays(a, i); const k = ymd(d); const lift = R.lifts[dow]; const runs = ws.filter(x => x.dow === dow); const did = logged[k] || [];
    return html`<button key=${dow} class=${'rg-day' + (runs.length ? ' run' : '') + (k === todayK ? ' today' : '')} aria-label=${DOW_FULL[dow] + ': ' + [lift || 'no lifting', ...runs.map(x => x.name)].join(', ')} onClick=${() => openSheet({ type: 'runDay', dow })}>
      <b>${DOW[dow]}</b><span class="rg-date num">${d.getDate()}</span>
      ${lift ? html`<span class=${'rg-lift' + (LEGGY[lift] ? ' legs' : '')}>${lift}</span>` : html`<span class="rg-none">${runs.length ? '' : 'Rest'}</span>`}
      ${runs.map(x => html`<span key=${x.key} class=${'rg-run' + (x.s.hard ? ' hard' : '') + (x.s.test ? ' test' : '')}>${x.name.replace('Run ', '')}${x.s.test ? ' test' : ''}</span>`)}
      ${did.length ? html`<span class="rg-did">✓ lifted</span>` : null}</button>`; })}</div>
    <p class="small muted" style="margin-top:6px">Tap a day to set its lifting or move a run there.</p>`;
}
function RunSession({ R, w, x }) {
  const id = sessId(R, w, x.key); const mode = R.swaps[id]; const sw = mode ? swapPlan(x.s, mode) : null; const st = runStatus(R, w, x.key);
  const date = sessDate(R, w, x.dow); const cls = x.s.test ? 'test' : x.s.easy ? 'easy' : ''; const missed = !st && date < startOfDay(new Date());
  return html`<div class=${'run-sess' + (st ? ' logged' : '')} id=${'rs-' + x.key}>
    <div class="run-sess-h"><h3>${x.name}</h3><span class=${'chip run-chip ' + cls}>${x.s.t}</span><span class="spacer"></span>${missed ? html`<span class="chip run-missed">Missed</span>` : null}<span class="small muted">${shortDate(date)}</span></div>
    ${sw && sw.ok ? html`<div class="run-swap-line"><b>Swapped for ${(SWAPS.find(y => y[0] === mode) || [])[1].toLowerCase()}:</b> ${sw.txt} <button class="btn text" onClick=${() => runCommit(r => { delete r.swaps[id]; })}>Undo</button></div>` : null}
    <div class=${'run-items' + (sw && sw.ok ? ' dim' : '')}>${x.s.items.map((i, k) => html`<div key=${k} class="run-item"><span class="k">${i.k}</span><span class="d">${i.d}</span>${i.r ? html`<span class="r num">${i.r}</span>` : null}</div>`)}</div>
    ${st ? html`<div class="run-st"><button class=${'tg-badge big ' + (st.st || 'none')} id=${'mark-' + x.key} onClick=${() => openSheet({ type: 'runMark', id, auto: st.auto })}>${st.st === 'on' ? '✓ On target' : st.st === 'off' ? 'Off target' : 'Done'}${st.manual ? ' (yours)' : ''}</button>
      <button class="btn text" onClick=${() => openSheet({ type: 'session', id: st.s.id })}>View</button>${st.s.run && st.s.run.msg ? html`<p class="small muted" style="flex-basis:100%">${st.s.run.msg}</p>` : null}</div>` : null}
    <div class="row" style="margin-top:10px">
      <button class=${'btn ' + (st ? '' : 'primary')} style="flex:2" id=${'start-' + x.key} onClick=${() => startRunSession(w, x.key)}>${st ? 'Log again' : 'Start'}</button>
      ${x.s.test ? null : html`<button class="btn" style="flex:1" id=${'swap-' + x.key} onClick=${() => openSheet({ type: 'runSwap', w, k: x.key })}>${I.swap} Swap</button>`}</div></div>`;
}
function RunPaces({ c: c0 }) {
  const R = runSt(); const cur = runWeekOf(R, new Date()); const wk = Math.min(8, Math.max(1, cur)); const c = R.goal ? ctxWeek(R, wk) : c0;
  const f = FOCUS_TXT(c0); const T = runTargets(c0);
  const rows = [['Easy', 'Most of your running. Conversational.', easyR(c)], ['Threshold', 'Comfortably hard, about 1 hour race effort.', paceTxt(c.T)],
    ['Interval', 'Hard, about 2 mile race effort.', paceTxt(c.I) + ' · ' + rfmt(splitAt(c.I, 400)) + ' /400'], ['Mile pace', 'Your current mile, for reps.', rfmt(splitAt(c.R, 200)) + ' /200 · ' + rfmt(splitAt(c.R, 400)) + ' /400'],
    ['Speed', '90% sprints, full rest.', rfmt(c.s150) + ' /150 · ' + rfmt(c.s200) + ' /200'], ['Strides', 'Relaxed and fast, about 80%.', rfmt(c.stride) + ' /100']];
  const tgt = (l, x) => html`<div class="kpi run-tgt"><span class="lbl">${l}</span><b class="num">${rfmt(x.fast)}</b><span>to ${rfmt(x.slow)} · from ${rfmt(x.now)}</span></div>`;
  return html`<div>
    <div class="run-focus" id="run-focus"><span class="lbl">Your profile</span><b>${f[0]}</b><p class="note">${f[1]} Your mile pace uses ${Math.round(c.reserve * 100)}% of your 100 m speed.</p></div>
    <${RunGoalCard}/>
    <div class="section-h"><h2>Training paces</h2><span class="aside">${R.goal && goalInfo(R) && !goalInfo(R).slower ? 'Week ' + wk + ' · estimates' : 'Estimates'}</span></div>
    <div class="card prl run-paces">${rows.map(r => html`<div key=${r[0]}><div style="min-width:0"><div style="font-weight:700">${r[0]}</div><div class="small muted">${r[1]}</div></div><span class="num run-pv">${r[2]}</span></div>`)}</div>
    <div class="section-h"><h2>8-week targets</h2><span class="aside">Estimates</span></div>
    <div class="kpis kpis3" id="run-targets">${tgt('100 m', T.t100)}${tgt('1 mile', T.t1)}${tgt('3 miles', T.t3)}</div>
    <p class="note" style="margin-top:8px">Targets assume you run every planned session and are fairly new to structured running. If you already train hard, expect the slower end; if you’re returning after a layoff, you may beat the faster end.</p></div>`;
}
function RunPrograms() {
  return html`<div>
    <p class="note" style="margin-top:14px">Six conditioning programs. Run one at a time for 6–8 weeks, in place of the running plan or replacing one of its runs. Each is a plan in Routines you can start, edit or follow.</p>
    <div class="stack" style="margin-top:10px">${COND.map(P => html`<button key=${P.id} class="r-card cond-card" id=${'cond-' + P.id} onClick=${() => { UI.setTab('routines'); UI.setView({ type: 'routine', id: P.id }); }}>
      <span class="tag">${P.cost} recovery cost · ${P.week} a week</span><h3>${P.name}</h3><span class="days">Builds: ${P.builds} · ${P.equip}</span></button>`)}</div>
    <div class="section-h"><h2>Fitting them in</h2></div>
    <div class="card"><ul class="run-ul">${COND_FIT.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <div class="section-h"><h2>Cross-training swaps</h2></div>
    <p class="note">When your legs need a break from pounding, or the weather wins, swap a planned run from its card. Times are rough equivalents in training effect.</p>
    <div class="card tbl-wrap" style="margin-top:8px"><table class="tbl run-tbl"><thead><tr><th>Run</th><th>Bike</th><th>Rower</th><th>Elliptical</th><th>Incline walk</th><th>Swim</th></tr></thead><tbody>
      <tr><td><b>Easy 30 min</b></td><td>40–45 min easy</td><td>30 min easy</td><td>30–35 min</td><td>40 min, 8–12% grade</td><td>25 min steady</td></tr>
      <tr><td><b>Threshold</b></td><td>Same work and rest, comfortably hard</td><td>Same work and rest, ~2:00–2:10/500 m feel</td><td>Same work and rest</td><td>Not a good match</td><td>Same work time, hard</td></tr>
      <tr><td><b>Intervals</b></td><td>Same reps by time, hard</td><td>500 m reps for 800s</td><td>Okay, harder to push</td><td>Not a good match</td><td>Okay</td></tr>
      <tr><td><b>Sprints</b></td><td>8 × 10 s all-out, 1 min easy</td><td>8 × 15 s all-out</td><td>Not a good match</td><td>Hill sprints: 6 × 10 s</td><td>Not a good match</td></tr></tbody></table></div>
    <p class="note" style="margin-top:8px">Sprints have no true substitute. Short hill sprints keep the speed work with less impact if a flat sprint bothers you.</p></div>`;
}
function RunTimes() {
  const R = runSt(); const [edit, setEdit] = useState(false);
  const save = x => { runCommit(r => { Object.assign(r, { t100: x.t100, t1: x.t1, t3: x.t3 }); r.hist.push({ d: ymd(new Date()), t100: x.t100, t1: x.t1, t3: x.t3, why: 'manual' }); }); setEdit(false); showToast({ kind: 'info', text: 'Times saved. Paces updated.' }); };
  const WHY = { start: 'Starting times', manual: 'Entered', wk4: 'Week 4 mile check', wk8: 'Week 8 retest' };
  return html`<div>
    <div class="section-h" style="margin-top:14px"><h2>Your times</h2>${edit ? null : html`<button class="btn text" id="run-edit-times" onClick=${() => setEdit(true)}>${I.edit} Update</button>`}</div>
    ${edit ? html`<div class="card"><${RunTimesForm} onSave=${save} saveLabel="Save times"/><button class="btn text wide" onClick=${() => setEdit(false)}>Cancel</button></div>`
      : html`<div class="kpis kpis3">${kpi(rfmt(R.t100), '100 m')}${kpi(rfmt(R.t1), '1 mile')}${kpi(rfmt(R.t3), '3 miles')}</div>`}
    <div class="section-h"><h2>Test times</h2></div>
    <div class="card"><${RunTimeChart}/></div>
    <div class="section-h"><h2>Settings</h2></div>
    <div class="card stack" style="gap:12px">
      <div><span class="lbl">Runs a week</span><div class="seg" role="group" aria-label="Runs a week" style="margin-top:6px">${[2, 3].map(n => html`<button key=${n} id=${'set-runs-' + n} class=${R.runs === n ? 'on' : ''} aria-pressed=${R.runs === n} onClick=${() => runCommit(r => { r.runs = n; })}>${n} runs</button>`)}</div></div>
      <div><label class="lbl" for="set-start">Week 1 starts</label><input type="date" class="field" id="set-start" style="margin-top:6px" value=${R.start} onChange=${e => e.target.value && runCommit(r => { r.start = e.target.value; })}/></div>
      <p class="small muted">Changing these rebuilds the plan from your current times. Logged runs stay in History.</p></div>
    <div class="section-h"><h2>History</h2></div>
    <div class="card prl">${R.hist.slice().reverse().map((h, i) => html`<div key=${i}><div style="min-width:0"><div style="font-weight:600">${WHY[h.why] || 'Times'}</div><div class="small muted">${shortDate(parseYmd(h.d))}</div></div><span class="num small">${rfmt(h.t100)} · ${rfmt(h.t1)} · ${rfmt(h.t3)}</span></div>`)}</div></div>`;
}
/* Test times over time, lower is faster: the chart is drawn so faster is higher */
function RunTimeChart() {
  const R = runSt(); const [k, setK] = useState(lsGet('runChart') || 't1'); const pick = x => { setK(x); lsSet('runChart', x); };
  const pts = runTestPoints(k);
  const W = 340, H = 150, L = 46, Rr = 10, T = 14, B = 22;
  const vs = pts.map(p => p.v); const lo = Math.min(...vs), hi = Math.max(...vs); const pad = Math.max(hi - lo, hi * 0.02) * 0.25 || 1;
  const t0 = pts.length ? pts[0].t : 0, t1 = pts.length ? pts[pts.length - 1].t : 1;
  const x = t => L + (t1 > t0 ? (t - t0) / (t1 - t0) : 0.5) * (W - L - Rr); const y = v => T + (v - (lo - pad)) / ((hi + pad) - (lo - pad)) * (H - T - B);
  return html`<div id="run-chart"><div class="seg wide">${[['t100', '100 m'], ['t1', 'Mile'], ['t3', '3 miles']].map(([q, l]) => html`<button key=${q} class=${k === q ? 'on' : ''} aria-pressed=${k === q} onClick=${() => pick(q)}>${l}</button>`)}</div>
    ${pts.length ? html`<svg viewBox=${'0 0 ' + W + ' ' + H} class="run-svg" role="img" aria-label=${'Test times: ' + pts.map(p => rfmt(p.v)).join(', ')}>
      <text x=${L - 6} y=${y(hi) + 4} text-anchor="end" class="ax">${rfmt(hi)}</text><text x=${L - 6} y=${y(lo) + 4} text-anchor="end" class="ax">${rfmt(lo)}</text>
      <line x1=${L} x2=${W - Rr} y1=${y(hi)} y2=${y(hi)} class="gl"/><line x1=${L} x2=${W - Rr} y1=${y(lo)} y2=${y(lo)} class="gl"/>
      ${pts.length > 1 ? html`<polyline points=${pts.map(p => x(p.t) + ',' + y(p.v)).join(' ')} class="ln"/>` : null}
      ${pts.map((p, i) => html`<circle key=${i} cx=${x(p.t)} cy=${y(p.v)} r="4" class="dt"/>`)}
      <text x=${L} y=${H - 4} class="ax">${shortDate(t0)}</text>${pts.length > 1 ? html`<text x=${W - Rr} y=${H - 4} text-anchor="end" class="ax">${shortDate(t1)}</text>` : null}</svg>
      <p class="small muted">${pts.length > 1 ? 'From ' + rfmt(pts[0].v) + ' to ' + rfmt(pts[pts.length - 1].v) + (pts[pts.length - 1].v < pts[0].v ? ', ' + rfmt(pts[0].v - pts[pts.length - 1].v) + ' faster.' : '.') : 'One time so far. Tests and updates add points.'} Faster is lower on the scale, shown higher here.</p>`
      : html`<p class="note" style="margin-top:10px">No ${k === 't100' ? '100 m' : k === 't1' ? 'mile' : '3 mile'} times yet.</p>`}</div>`;
}
/* Entered and tested times, plus timed efforts at the standard distance from any workout */
function runTestPoints(k) {
  const R = runSt(); const out = []; const type = { t100: 'run100', t1: 'mile', t3: 'mile3' }[k];
  if (R) for (const h of R.hist) if (h[k] && (h.why !== 'wk4' && h.why !== 'wk8')) out.push({ t: +parseYmd(h.d), v: h[k] });
  for (const s of sessionList()) for (const it of s.items) if (exKind(it.ex) === 'distance') { const ts = it.sets.filter(x => +x.t > 0 && stdOf(+x.d || 0) && stdOf(+x.d)[0] === type).map(x => +x.t); if (ts.length) out.push({ t: s.startedAt, v: Math.min(...ts) }); }
  return out.sort((a, b) => a.t - b.t);
}
/* Sheets */
function RunDaySheet({ dow }) {
  const R = runSt(); const c = runCtxNow(); const w = RUN_SEL.w || Math.min(8, Math.max(1, runWeekOf(R, new Date()))); const ws = planWeek(R, w);
  const LIFTS = ['', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms'];
  const setLift = v => runCommit(r => { if (v) r.lifts[dow] = v; else delete r.lifts[dow]; });
  const move = key => runCommit(r => { r.days[key] = dow; });
  return html`<${Sheet} label=${DOW_FULL[dow]}><h2>${DOW_FULL[dow]}</h2>
    <div class="lbl" style="margin-top:8px">Lifting</div>
    <div class="range-grid" role="group" aria-label="Lifting day">${LIFTS.map(l => html`<button key=${l || 'none'} class=${'chip' + ((R.lifts[dow] || '') === l ? ' on' : '')} aria-pressed=${(R.lifts[dow] || '') === l} onClick=${() => setLift(l)}>${l || 'No lifting'}</button>`)}</div>
    <div class="lbl" style="margin-top:14px">Move a run here</div>
    <div class="stack" style="gap:6px;margin-top:6px">${ws.map(x => html`<button key=${x.key} class=${'opt' + (x.dow === dow ? ' on' : '')} id=${'move-' + x.key} onClick=${() => move(x.key)}><div style="flex:1"><div>${x.name} · ${x.s.t}</div><div class="d">Now on ${DOW_FULL[x.dow]}${x.s.hard ? ' · keep it away from the day after Legs' : ''}</div></div>${x.dow === dow ? I.check : null}</button>`)}</div>
    <p class="small muted" style="margin-top:10px">Applies to every week of the plan. Keep sprints and hard intervals at least a day away from Legs.</p>
    <button class="btn primary wide" style="margin-top:12px" onClick=${closeSheet}>Done</button><//>`;
}
function RunSwapSheet({ w, k: key }) {
  const R = runSt(); const c = runCtxNow(); const x = planWeek(R, w).find(y => y.key === key); if (!x) return null;
  const id = sessId(R, w, key); const cur = R.swaps[id];
  return html`<${Sheet} label="Swap this run"><h2>Swap ${x.name}</h2><p class="note">Week ${w} · ${x.s.t}. Rough equivalents in training effect.</p>
    <div class="stack" style="gap:6px;margin-top:10px">${SWAPS.map(([m, l]) => { const p = swapPlan(x.s, m);
      return html`<button key=${m} class=${'opt' + (cur === m ? ' on' : '')} id=${'sw-' + m} disabled=${!p.ok} onClick=${() => { runCommit(r => { r.swaps[id] = m; }); closeSheet(); }}><div style="flex:1"><div>${l}</div><div class="d">${p.txt}</div></div>${cur === m ? I.check : null}</button>`; })}
      ${cur ? html`<button class="opt" onClick=${() => { runCommit(r => { delete r.swaps[id]; }); closeSheet(); }}><div style="flex:1"><div>Run as planned</div></div></button>` : null}</div><//>`;
}
function RunMarkSheet({ id, auto }) {
  const R = runSt(); const cur = R.marks[id] || '';
  const set = v => { runCommit(r => { if (v) r.marks[id] = v; else delete r.marks[id]; }); closeSheet(); };
  return html`<${Sheet} label="How did it go?"><h2>How did it go?</h2><p class="note">Ironwood checked your splits: ${auto === 'on' ? 'on target' : auto === 'off' ? 'off target' : 'nothing to check'}. Change it if that’s not how it went.</p>
    <div class="stack" style="gap:6px;margin-top:10px">${[['', 'Use the check (' + (auto === 'on' ? 'on target' : auto === 'off' ? 'off target' : 'done') + ')'], ['on', 'On target'], ['off', 'Off target']].map(([v, l]) => html`<button key=${v || 'auto'} class=${'opt' + (cur === v ? ' on' : '')} id=${'mk-' + (v || 'auto')} onClick=${() => set(v)}><div style="flex:1">${l}</div>${cur === v ? I.check : null}</button>`)}</div><//>`;
}
/* Workout screen: what the session is for, the timer for programs, and the Legs warning */
function WorkoutExtras({ a }) {
  const r = a.run; const tm = a.timer;
  if (!r && !tm) return null;
  return html`<div class="wo-extra">
    ${r ? html`<div class="run-banner"><span class="lbl">Running plan · week ${r.w}</span>
      <p class="small">${r.swap ? 'Cross-training swap. Keep the effort the plan asks for.' : 'Warm up with 10 min easy and 5 min of drills first. Targets are next to each exercise; within 2 s per 200 m is on target.'}</p>
      ${r.hard && !r.swap && legsYesterday() ? html`<p class="small down-c" role="alert">You did Legs yesterday. Sprints and hard intervals the day after Legs raise the risk of a strain.</p>` : null}
      <p class="small faint">Targets are estimates, not coaching advice.</p></div>` : null}
    ${tm ? html`<button class="btn wide" id="wo-timer" onClick=${() => { if (!S.itimer) startInterval(tm); UI.setView({ type: 'timer' }); }}>${I.timer} ${S.itimer ? 'Open timer' : 'Start timer: ' + (tm.name || timerSummary(tm))}</button>` : null}</div>`;
}
/* After a saved run: what it means for the plan */
function RunSummary({ s }) {
  if (!s.run) return null; const R = runSt(); const st = (R && R.marks[s.run.id]) || s.run.status || sessionStatus(s.items);
  return html`<div class="run-sum" id="run-sum"><span class=${'tg-badge big ' + (st || 'none')}>${st === 'on' ? '✓ On target' : st === 'off' ? 'Off target' : 'Logged'}</span>
    ${s.run.msg ? html`<p class="small" style="margin-top:6px">${s.run.msg}</p>` : null}
    <button class="btn text" onClick=${() => openSheet({ type: 'runMark', id: s.run.id, auto: s.run.status || sessionStatus(s.items) })}>Change</button></div>`;
}
/* Routine page for a conditioning program */
function CondInfo({ r }) {
  const P = r.info; if (!P) return null;
  return html`<div class="cond-info" id="cond-info">
    <div class="kpis kpis3">${kpi(P.week, 'A week')}${kpi(P.cost, 'Recovery cost')}${kpi(P.equip, 'Equipment')}</div>
    <div class="card" style="margin-top:8px"><span class="lbl">Builds most</span><p>${P.builds}</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Strengths</span><ul class="run-ul">${P.strengths.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <div class="card run-result" style="margin-top:8px"><span class="lbl">Likely results</span><p>${P.result}</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Watch out for</span><ul class="run-ul">${P.watch.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <p class="small faint" style="margin-top:8px">Likely results are estimates for a healthy adult, not medical or coaching advice. Lifting days stay as they are; these days fit around them.</p></div>`;
}
/* Stats → Overall: running */
function runMinutes(s) {
  if (s.kind === 'activity') return s.activity === 'run' ? (+s.dur || 0) : 0;
  const c = runCtxNow(); const easy = c ? (c.easyLo + c.easyHi) / 2 : 540; let t = 0;
  for (const it of s.items) if (isRunEx(it.ex)) for (const x of it.sets) t += +x.t > 0 ? +x.t : +x.d > 0 ? (+x.d / MILE) * easy : 0;
  return t / 60;
}
function RunStatsCard() {
  const R = runSt(); const weeks = weeklySeries(12, runMinutes); const any = weeks.some(x => x.v > 0);
  if (!R && !any) return null;
  const bests = STD.map(([type, , label]) => { const pool = stdPool(type); return [label.replace('Fastest ', ''), pool.length ? Math.min(...pool) : 0]; });
  return html`<div id="run-stats"><div class="section-h"><h2>Running</h2><span class="aside">Best times</span></div>
    <div class="kpis kpis3">${bests.map(([l, v]) => kpi(v ? rfmt(v) : '–', l))}</div>
    <div class="card" style="margin-top:8px"><span class="lbl">Test times</span><${RunTimeChart}/></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Running minutes a week</span><${BarChart} data=${weeks.map(x => ({ t: x.t, v: Math.round(x.v) }))} fmtV=${v => fmt(v)} unit="min"/>
      <p class="small muted">Runs from workouts and logged activities. Sets with a distance but no time are counted at your easy pace.</p></div></div>`;
}
/* Stats → Exercises: exercises logged by time or distance */
function MeasuredRows({ rows }) {
  return html`<div id="meas-rows"><div class="section-h"><h2>Running & timed</h2></div>
    <div>${rows.map(r => { const kind = exKind(r.ex); const all = entries(r.ex); const last = all[all.length - 1];
      return html`<button key=${r.ex} class="lift-row" onClick=${() => UI.setView({ type: 'exercise', ex: r.ex, group: '' })}>
        <div style="min-width:0"><div class="nm">${exName(r.ex)}</div><div class="sub"><span>${KINDS[kind]} · ${all.length} workout${all.length === 1 ? '' : 's'}</span></div></div>
        <div class="v"><span class="small muted">Last</span><b class="small">${last ? measBest(last.raw, kind) : '–'}</b></div></button>`; })}</div></div>`;
}

/* ============ Oct 21: the plan adapts, goal times, quick-logged runs ============ */
/* meta.run.goal: { d: meters, t: seconds } — a goal race. Each week's paces move from your current times toward the
   goal-equivalent mile and 3 miles, never past the fast end of the 8-week range. meta.run.easy: { 'block-week': true }
   turns a week easy ("Not feeling 100%"). Pushing the plan back moves the start a week later. */
const GOAL_RACES = [[MILE, 'Mile'], [5000, '5K'], [3 * MILE, '3 miles'], [10000, '10K'], [21097.5, 'Half marathon']];
const raceName = d => (GOAL_RACES.find(g => Math.abs(g[0] - d) < 1) || [0, fmtDist(d)])[1];
const riegel = (t, d1, d2) => t * Math.pow(d2 / d1, 1.06);
function goalInfo(R) {
  const c0 = R && R.t1 && R.t3 && R.t100 ? runCtx(R) : null; if (!c0 || !R.goal || !(R.goal.t > 0) || !(R.goal.d > 0)) return null;
  const T = runTargets(c0); const eq1 = riegel(R.goal.t, R.goal.d, MILE), eq3 = riegel(R.goal.t, R.goal.d, 3 * MILE);
  const now = riegel(R.t3, 3 * MILE, R.goal.d);
  const reach = eq3 >= T.t3.fast - 0.5 && eq1 >= T.t1.fast - 0.5;
  return { c0, T, eq1, eq3, now, reach, aim1: Math.max(eq1, T.t1.fast), aim3: Math.max(eq3, T.t3.fast), slower: eq1 >= R.t1 && eq3 >= R.t3 };
}
function ctxWeek(R, w) {
  const c0 = runCtxNow(); const G = goalInfo(R); if (!c0 || !G || G.slower) return c0;
  const f = Math.min(1, Math.max(0, (w - 1) / 7));
  const t1 = G.aim1 < R.t1 ? R.t1 + (G.aim1 - R.t1) * f : R.t1, t3 = G.aim3 < R.t3 ? R.t3 + (G.aim3 - R.t3) * f : R.t3;
  const c = runCtx({ t100: R.t100, t1, t3 }); c.focus = c0.focus; c.h = { h1: G.aim1, h3: G.aim3 }; return c;
}
const easyKey = (R, w) => (R.block || 1) + '-' + w;
/* The week as planned: goal paces, then an easy week if you said you're not feeling 100% */
function planWeek(R, w) {
  const c = ctxWeek(R, w); const ws = weekSessions(w, c, R.runs, R.days);
  if (!(R.easy || {})[easyKey(R, w)]) return ws;
  return ws.map(x => { const s = x.s; if (s.easy && !s.test) {
      const m = Math.max(15, Math.round((s.items.find(i => i.log && i.log.ex === 'Easy Run') || { log: { tg: { dur: 1800 } } }).log.tg.dur / 60 * 0.66 / 5) * 5);
      return { ...x, s: { t: 'Easy', easy: true, lite: true, items: [rIt('Easy run', m + ' min, no strides', easyR(c), { ex: 'Easy Run', sets: 1, tg: { dur: m * 60, lo: c.easyLo, hi: c.easyHi, judge: 'easy' } })] } }; }
    return { ...x, s: { t: s.test ? 'Easy (test moved)' : 'Easy', easy: true, lite: true, items: [rIt('Easy run', '20 min, or rest if you feel worse', easyR(c), { ex: 'Easy Run', sets: 1, tg: { dur: 1200, lo: c.easyLo, hi: c.easyHi, judge: 'easy' } })] } }; });
}
/* Sessions whose day has passed with nothing logged */
function runMissed(R, w) {
  const today = startOfDay(new Date()); if (w < 1 || w > 8) return [];
  return planWeek(R, w).filter(x => sessDate(R, w, x.dow) < today && !runLogged(R, w, x.key).length);
}
function pushPlanBack() {
  const R = runSt(); const before = R.start;
  runCommit(r => { r.start = ymd(addDays(parseYmd(r.start), 7)); });
  showToast({ kind: 'info', ms: 8000, text: 'Plan moved back a week', action: 'Undo', fn: () => runCommit(r => { r.start = before; }) });
}
function toggleEasyWeek(w) { const R = runSt(); const k = easyKey(R, w); const on = !(R.easy || {})[k]; runCommit(r => { r.easy = r.easy || {}; if (on) r.easy[k] = true; else delete r.easy[k]; }); showToast({ kind: 'info', text: on ? 'Week ' + w + ' is easy now. Rest if you feel worse.' : 'Week ' + w + ' is back to the plan' }); }
/* Shown on the Plan tab: missed runs, an easy week, pushing back */
function RunAdapt({ R, w, cur }) {
  const prevMiss = cur >= 2 && cur <= 8 ? runMissed(R, cur - 1) : []; const easy = !!(R.easy || {})[easyKey(R, w)];
  const inPlan = cur >= 1 && cur <= 8;
  return html`<div class="run-adapt" id="run-adapt">
    ${prevMiss.length && w === cur ? html`<div class="run-warn" style="color:var(--ink)"><p><b>${prevMiss.length} run${prevMiss.length === 1 ? '' : 's'} missed last week</b> (${prevMiss.map(x => x.name).join(', ')}). If you lost the week, move the plan back so you don't skip ahead.</p><button class="btn" id="push-back" onClick=${pushPlanBack}>Move the plan back a week</button></div>` : null}
    ${easy ? html`<p class="note" style="margin-top:10px">Week ${w} is easy: runs are short and easy, tests are moved. When you're ready, turn it off, or move the plan back a week to keep every session.</p>` : null}
    <div class="row wrap" style="margin-top:10px;gap:8px">
      ${inPlan && w >= cur ? html`<button class=${'btn' + (easy ? ' primary' : '')} id="easy-week" aria-pressed=${easy} onClick=${() => toggleEasyWeek(w)}>${easy ? 'Easy week on' : 'Not feeling 100%'}</button>` : null}
      ${inPlan && !(prevMiss.length && w === cur) ? html`<button class="btn text" id="push-back-any" onClick=${pushPlanBack}>Move the plan back a week</button>` : null}</div></div>`;
}
/* Goal race */
function RunGoalCard() {
  const R = runSt(); const G = goalInfo(R);
  return html`<div class="card stack" id="run-goal" style="gap:8px;margin-top:14px"><div class="row"><span class="lbl" style="flex:1">Goal race</span><button class="btn text" id="goal-edit" onClick=${() => openSheet({ type: 'runGoal' })}>${R.goal ? 'Change' : 'Set a goal'}</button></div>
    ${!G ? html`<p class="note">Optional. Set a race and a time, and each week's paces step from where you are toward it.</p>`
      : html`<div><b style="font-size:19px">${raceName(R.goal.d)} in ${rfmt(R.goal.t)}</b><p class="note" style="margin-top:4px">Your times predict about ${rfmt(G.now)} now (estimate). ${G.slower ? 'You are already there; paces stay at your current times.' : G.reach ? 'Within reach of the 8-week range. Paces step toward it each week.' : 'Further than 8 weeks usually brings. This block aims for ' + rfmt(G.aim1) + ' mile and ' + rfmt(G.aim3) + ' 3 miles; keep the goal for the next block.'}</p></div>`}</div>`;
}
function RunGoalSheet() {
  const R = runSt(); const [d, setD] = useState(R.goal ? R.goal.d : 5000); const [t, setT] = useState(R.goal ? rfmt(R.goal.t) : '');
  const sec = parseClock(t, false); const est = riegel(R.t3, 3 * MILE, d);
  const ok = sec > est * 0.6 && sec < est * 2;
  const save = () => { runCommit(r => { r.goal = { d, t: sec }; }); closeSheet(); };
  return html`<${Sheet} label="Goal race"><h2>Goal race</h2>
    <div class="range-grid" role="group" aria-label="Race">${GOAL_RACES.map(([m, l]) => html`<button key=${l} class=${'chip' + (Math.abs(d - m) < 1 ? ' on' : '')} aria-pressed=${Math.abs(d - m) < 1} onClick=${() => setD(m)}>${l}</button>`)}</div>
    <label class="lbl" for="goal-time" style="margin-top:12px;display:block">Goal time</label><input class="field" id="goal-time" inputmode="decimal" placeholder=${rfmt(est * 0.95)} value=${t} onInput=${e => setT(e.target.value)}/>
    <p class="small muted" style="margin-top:4px">Your 3 miles predicts about ${rfmt(est)} now. ${t && !ok ? 'That time looks far off; check it.' : ''}</p>
    <div class="row" style="margin-top:12px">${R.goal ? html`<button class="btn" style="flex:1" onClick=${() => { runCommit(r => { delete r.goal; }); closeSheet(); }}>Remove goal</button>` : null}<button class="btn primary" style="flex:2" id="goal-save" disabled=${!ok} onClick=${save}>Save goal</button></div><//>`;
}
/* A run quick-logged from Log another activity can count as that day's plan session */
const actMeters = s => !(+s.dist > 0) ? 0 : +s.dist * ({ mi: MILE, km: 1000, m: 1, yd: 0.9144 }[s.distU || 'mi'] || MILE);
function planSessionFor(day) {
  const R = runSt(); if (!R || !runCtxNow()) return null; const w = runWeekOf(R, day); if (w < 1 || w > 8) return null;
  const open = planWeek(R, w).filter(x => !x.s.test && !runLogged(R, w, x.key).length && sessDate(R, w, x.dow) <= startOfDay(day));
  const same = open.find(x => ymd(sessDate(R, w, x.dow)) === ymd(day));
  const x = same || open[open.length - 1]; return x ? { R, w, x } : null;
}
function offerPlanLink(a) {
  if (a.activity !== 'run' || a.run) return; const m = planSessionFor(new Date(a.startedAt)); if (!m) return;
  const id = sessId(m.R, m.w, m.x.key);
  showToast({ kind: 'info', ms: 10000, text: 'Running logged. Count it as week ' + m.w + ' ' + m.x.name + '?', action: 'Count it', fn: () => { commit(st => { const s = st.sessions[a.id]; if (s) s.run = { id, w: m.w, key: m.x.key, block: m.R.block || 1, status: null, msg: 'Logged as an activity.' }; }, 's_' + a.id); showToast({ kind: 'info', text: m.x.name + ' done' }); } });
}
