/* ============ Oct 21 review improvements ============ */
/* ---- Progression: weight jump per exercise, smaller jumps after a miss, a drop after three misses ----
   settings.fine: the smallest weight you can add (5 / 2.5 / 1 lb, 2.5 / 1.25 / 0.5 kg).
   settings.stepDown: after a jump, if a set falls below the bottom of the rep range, the next suggestion is half the jump.
   settings.deload: after three sessions short at one weight, suggest about 10% less. A session counts as short only when
   half or more of the sets done fall below the range (7, 6, 4 on 5-8 reps is close enough; it holds the weight), and
   skipped sets don't count. No drop when the smallest step can't come within 15% (20 lb in 5 lb steps would be 15, -25%).
   meta.exJump: { exercise id: { v, u } } — a weight jump just for that exercise (total added to the bar or machine). */
const FINE_OPTS = { lb: [5, 2.5, 1], kg: [2.5, 1, 0.5] };
const JUMP_PRESETS = { lb: [2.5, 5, 10, 15, 20], kg: [1, 2.5, 5, 10] };
const BIG_PRESETS = { lb: [25, 35, 45, 90], kg: [15, 20, 40] };
/* The biggest jump by default: 20 lb (10 each side) or 10 kg. Bigger jumps miss more often than they save time.
   settings.bigJumps turns the limit off (up to 500 lb / 225 kg). */
const maxJump = u => S.meta.settings.bigJumps ? (u === 'kg' ? 225 : 500) : (u === 'kg' ? 10 : 20);
const jumpPresets = u => JUMP_PRESETS[u].concat(S.meta.settings.bigJumps ? BIG_PRESETS[u] : []);
const unitInc = u => u === U() ? +S.meta.settings.inc || UNIT_DEFAULTS[u].inc : UNIT_DEFAULTS[u].inc;
function fineFor(u) {
  const st = S.meta.settings; const base = u === st.unit ? +st.fine : NaN;
  if (base > 0) return base;
  if (u === st.unit) return Math.min(unitInc(u), UNIT_DEFAULTS[u].inc);
  const f = +st.fine; if (!(f > 0)) return UNIT_DEFAULTS[u].inc;
  const v = conv(f, st.unit, u); return FINE_OPTS[u].reduce((b, o) => Math.abs(o - v) < Math.abs(b - v) ? o : b, FINE_OPTS[u][0]);
}
const isDeadlift = ex => /deadlift/.test(norm(exName(ex))) && !/romanian|stiff|dumbbell|single|kettlebell/.test(norm(exName(ex)));
/* The jump for one exercise in unit u: its own setting, else the main jump (twice that on barbell deadlifts) */
/* Nov 17: big lower-body lifts on a barbell or machine (squats, leg press, deadlifts, hip thrusts) jump twice as much */
const BIG_LOWER = ['squat', 'legpress', 'hinge', 'hipext'];
function jumpDefault(ex, u) {
  const b = unitInc(u); const k = exKind(ex); const e = getEx(ex);
  if (k === 'barbell' && isDeadlift(ex)) return b * 2;
  return (k === 'barbell' || k === 'machine') && e.pat && BIG_LOWER.includes(e.pat[0]) ? b * 2 : b;
}
function jumpFor(ex, u) {
  const j = (S.meta.exJump || {})[ex];
  if (j && +j.v > 0) return Math.min(maxJump(u), j.u === u ? +j.v : roundToInc(conv(+j.v, j.u, u), fineFor(u)) || fineFor(u));
  return jumpDefault(ex, u);
}
const repBottom = reps => { const m = String(reps || '').match(/^(\d+)/); return m ? +m[1] : 0; };
/* The last n entries for an exercise at this slot position (newest first), weights in unit u */
function recentOcc(exId, group, occ, n, u) {
  const out = []; let list = sessionList();
  const c = typeof prefillCtx === 'function' ? prefillCtx() : null;
  if (c) { const f = list.filter(s => sameWorkout(s, c)); if (f.some(s => s.items.some(it => it.ex === exId && (it.group || '') === (group || '')))) list = f; }
  for (let i = list.length - 1; i >= 0 && out.length < n; i--) {
    const its = list[i].items.filter(it => it.ex === exId && (it.group || '') === (group || ''));
    if (!its.length) continue; const it = its[Math.min(occ || 0, its.length - 1)];
    const sets = it.sets.filter(x => +x.r > 0).map(x => Object.assign({ w: r1(conv(+x.w || 0, it.u || U(), u)), r: +x.r }, x.ri != null ? { ri: +x.ri } : {}));
    if (sets.length) out.push({ t: list[i].startedAt, sets, top: Math.max(...sets.map(x => x.w)) });
  }
  return out;
}
/* What to suggest next time: { mode: 'bump' | 'step' | 'deload' | 'hold', delta, factor, msg } */
function progPlan(it, kind, u, occ) {
  const st = S.meta.settings; const top = repTop(it.target.reps), low = repBottom(it.target.reps) || top, n = it.target.sets || 1;
  if (!top) return { mode: 'hold' };
  const h = recentOcc(it.ex, it.group || '', occ, 3, u); if (!h.length) return { mode: 'hold' };
  const e1 = h[0], e0 = h[1];
  const full = e => e.sets.length >= n && e.sets.every(x => x.r >= top);
  /* Nov 17: bodyweight moves progress by reps */
  if (kind === 'bodyweight') return full(e1) ? { mode: 'reps', msg: 'Every set reached ' + top + ' last time. Go for one more rep per set, or add a little weight.' } : { mode: 'hold' };
  const miss = e => e.sets.some(x => x.r < low);
  const mostShort = e => e.sets.filter(x => x.r < low).length * 2 >= e.sets.length;
  const fine = fineFor(u), jump = jumpFor(it.ex, u);
  const w = v => fmt(v) + ' ' + u;
  if (kind === 'assisted') return full(e1) ? { mode: 'bump', delta: -jump, msg: 'Less assist today. You hit every rep last time.' } : { mode: 'hold' };
  /* Nov 22: reps left on the last set (adjusted by your calibration) */
  const spare = e => { const l = e.sets[e.sets.length - 1]; return l && l.ri != null && typeof adjRir === 'function' ? adjRir(l.ri) : null; };
  if (full(e1) && spare(e1) >= 3) return { mode: 'bump', delta: 2 * jump, src: ['robinson', 'halperin'], rule: true, msg: '+' + w(2 * jump) + ' today. You hit every rep with 3 or more to spare last time.' };
  if (full(e1)) return { mode: 'bump', delta: jump, msg: '+' + w(jump) + ' today. You hit every rep last time.' };
  if (spare(e1) >= 3 && !miss(e1)) return { mode: 'push', src: ['robinson'], rule: true, msg: 'Same weight, but push closer: you had about ' + spare(e1) + ' reps to spare last time. Aim for ' + top + ' reps.' };
  if (st.stepDown !== false && e0 && e1.top > e0.top + 1e-9 && miss(e1)) {
    const step = Math.floor(((e1.top - e0.top) / 2) / fine + 1e-9) * fine;
    if (step >= fine - 1e-9 && e0.top + step < e1.top - 1e-9)
      return { mode: 'step', delta: e0.top + step - e1.top, msg: 'Smaller jump today: ' + w(e0.top + step) + ' (+' + w(step) + '). ' + w(e1.top) + ' fell short of ' + low + ' reps last time.' };
  }
  if (st.deload !== false && h.length >= 3 && h.every(e => Math.abs(e.top - e1.top) < 1e-9 && mostShort(e)) && e1.top > 0) {
    const to = Math.floor(e1.top * 0.9 / fine + 1e-9) * fine;
    if (to < e1.top && to >= e1.top * 0.85 - 1e-9) return { mode: 'deload', factor: to / e1.top, to, src: [], rule: true, msg: 'Down about 10% to ' + w(to) + ': three sessions short at ' + w(e1.top) + '. Build back up from here.' };
  }
  return { mode: 'hold' };
}
/* Prefill for a lifting slot: weights from last time with the plan applied, reps aimed at the target */
function refillLift(it, occ) {
  const prev = lastEntryOcc(it.ex, it.group || '', occ);
  const kind = exKind(it.ex); const u = it.u || U();
  const fine = fineFor(u);
  const rw = v => u === U() ? r05(v) : roundToInc(conv(v, U(), u), unitInc(u));
  it.prev = prev ? prev.sets.map(x => ({ w: rw(+x.w || 0), r: x.r })) : null;
  it.prevNote = prev ? prev.note : ''; it.prevT = prev ? prev.t : 0;
  it.prevWhere = prev && prev.scoped ? 'in this workout' : prev && typeof prefillCtx === 'function' && prefillCtx() ? 'in any workout' : '';
  const P = prev ? progPlan(it, kind, u, occ) : { mode: 'hold' };
  it.bump = P.mode === 'bump'; it.prog = P.mode !== 'hold' ? { mode: P.mode, msg: P.msg, src: P.src || null, rule: !!P.rule } : null;
  const top = repTop(it.target.reps), low = repBottom(it.target.reps) || top;
  /* Nov 24 (Newt): targets to beat, not a copy of last time. Holding a weight: one more rep per set, up to the top.
     A new weight: the reps your last sets predict at it (Epley one-rep max, w × (1 + reps / 30), with reps left
     added on the last set). A weight clearly outside the range (every set 2+ under the bottom, or 3+ over the top)
     is moved after one workout to land near the low-middle of the range. */
  const lastRi = it.prev && prev && prev.sets.length && prev.sets[prev.sets.length - 1].ri != null && typeof adjRir === 'function' ? adjRir(prev.sets[prev.sets.length - 1].ri) : 0;
  const e1 = (p, j) => (+p.w || 0) * (1 + ((+p.r || 0) + (it.prev && j === it.prev.length - 1 ? lastRi : 0)) / 30);
  const repsAt = (est, wv) => wv > 0 ? Math.floor(30 * (est / wv - 1) + 1e-9) : 0;
  let fitW = 0;
  if (it.prev && it.prev.length && top && low && kind !== 'bodyweight' && kind !== 'assisted' && (P.mode === 'hold' || P.mode === 'push' || P.mode === 'bump')) {
    const rs = it.prev.map(p => +p.r || 0).filter(r => r > 0); const wTop = Math.max(...it.prev.map(p => +p.w || 0));
    const best = Math.max(...it.prev.map((p, j) => e1(p, j)));
    const heavy = rs.length && Math.max(...rs) <= low - 2, light = rs.length && Math.min(...rs) >= top + 3;
    if ((heavy || light) && wTop > 0 && best > 0) {
      const aim = heavy ? low + 1 : Math.round((low + top) / 2);
      const wv = Math.floor(best / (1 + aim / 30) / fine + 1e-9) * fine;
      if (wv > 0 && Math.abs(wv - wTop) >= fine - 1e-9 && (heavy ? wv >= wTop * 0.8 - 1e-9 : wv <= wTop * 1.25 + 1e-9)) {   /* at most 20% lighter or 25% heavier in one go */
        fitW = wv; const w = v => fmt(v) + ' ' + u;
        it.prog = { mode: heavy ? 'step' : 'bump', msg: (heavy ? 'Lighter today: ' : 'Heavier today: ') + w(wv) + '. ' + w(wTop) + ' gave ' + rs.join(', ') + ' reps last time, ' + (heavy ? 'under' : 'over') + ' the ' + low + '–' + top + ' range.', src: null, rule: true };
        it.bump = !heavy;
      }
    }
  }
  if (!it.prog && it.prev && top && P.mode === 'hold' && it.prev.some(p => (+p.r || 0) < top)) it.prog = { mode: 'beat', msg: 'Beat last time: one more rep per set, same weight, up to ' + top + '.', src: null, rule: false };
  it.sets.forEach((x, j) => {
    if (!x.id) x.id = uid('t');
    if (isDone(x)) return;
    const p = it.prev ? (it.prev[j] || it.prev[it.prev.length - 1]) : null;
    if (!p) { x.gw = ''; x.gr = low ? String(low) : ''; return; }
    let wv = +p.w || 0;
    if (fitW) wv = fitW;
    else {
      if (P.mode === 'bump' || P.mode === 'step') wv = Math.max(0, wv + P.delta);
      if (P.mode === 'deload') wv = Math.max(0, Math.floor(wv * P.factor / fine + 1e-9) * fine);
      if (P.mode === 'step') wv = roundToInc(wv, fine);
    }
    x.gw = wv ? String(r1(wv)) : '';
    const pr = +p.r || 0; const jj = it.prev.indexOf(p);
    const pred = Math.max(1, repsAt(e1(p, jj), wv));
    x.gr = String(!top ? pr : P.mode === 'reps' ? pr + 1 : P.mode === 'push' ? top
      : (fitW || P.mode === 'bump' || P.mode === 'step' || P.mode === 'deload') ? Math.min(top, Math.max(low || 1, pred))
      : Math.min(top, Math.max(low, pr + 1)));
  });
  if (it.mach && typeof applyMachine === 'function') applyMachine(it, it.mach, true);
}
/* "Last · Mon, Oct 19: 140 × 5, 5, 4 · 135 × 8" */
function lastLine(it) {
  if (!it.prev || !it.prev.length) return '';
  const groups = []; for (const p of it.prev) { const g = groups[groups.length - 1]; if (g && g.w === p.w) g.r.push(p.r); else groups.push({ w: p.w, r: [p.r] }); }
  const kind = exKind(it.ex); const u = it.u || U();
  return groups.map(g => (kind === 'bodyweight' && !g.w ? '' : fmt(g.w) + (kind === 'assisted' ? ' asst' : '') + ' × ') + g.r.join(', ') + (kind === 'bodyweight' && !g.w ? ' reps' : '')).join(' · ') + (groups.some(g => g.w) ? ' ' + u : '');
}
function ExJumpSheet({ ex, u0 }) {
  const u = u0 || exUnitOf(ex); const cur = (S.meta.exJump || {})[ex]; const def = jumpDefault(ex, u);
  const [v, setV] = useState(cur && cur.u === u ? String(cur.v) : '');
  const set = val => { commit(x => { x.meta.exJump = x.meta.exJump || {}; if (val == null) delete x.meta.exJump[ex]; else x.meta.exJump[ex] = { v: val, u }; }, 'meta', 600); if (S.active) S.active.items.filter(i => i.ex === ex).forEach(i => refill(i)); touch(); closeSheet(); };
  const now = jumpFor(ex, u);
  return html`<${Sheet} label="Weight jump"><h2>Weight jump for ${exName(ex)}</h2>
    <p class="note" style="margin-bottom:12px">How much to add when you hit the top of the rep range on every set. The total added, in ${u}${S.meta.settings.bigJumps ? '' : ', up to ' + maxJump(u) + ' ' + u + ' (' + maxJump(u) / 2 + ' each side)'}. If a jump is too big and you fall short, the next workout suggests half of it.</p>
    <div class="preset-grid">${jumpPresets(u).map(p => html`<button key=${p} class=${'chip' + (now === p && cur ? ' on' : '')} aria-pressed=${now === p && !!cur} onClick=${() => set(p)}>+${fmt(p)}</button>`)}</div>
    <div class="row" style="margin-top:12px;align-items:flex-end"><div style="flex:1"><label class="lbl" for="jump-own">Your own amount (${u})</label><input class="field" id="jump-own" inputmode="decimal" placeholder=${fmt(now)} value=${v} onInput=${e => setV(e.target.value)}/>${num(v) > maxJump(u) ? html`<span class="small muted" id="jump-cap">Saved as ${maxJump(u)} ${u}, the most per jump. To allow more, turn on Bigger jumps below.</span>` : null}</div>
      <button class="btn primary" id="jump-save" disabled=${!(num(v) > 0)} onClick=${() => set(Math.min(maxJump(u), r1(num(v))))}>Save</button></div>
    <label class="toggle-row" for="jump-big" style="margin-top:10px"><span><span>Bigger jumps</span><span class="d">Allow more than ${u === 'kg' ? '10 kg' : '20 lb'} per jump, for every exercise.</span></span><input type="checkbox" role="switch" id="jump-big" checked=${!!S.meta.settings.bigJumps} onChange=${e => commit(x => { x.meta.settings.bigJumps = e.target.checked; }, 'meta', 600)}/></label>
    <button class=${'opt' + (!cur ? ' on' : '')} style="margin-top:10px" onClick=${() => set(null)}>Use the default (+${fmt(def)} ${u}${def > unitInc(u) ? ', twice the main jump for big lower-body lifts' : ''})</button><//>`;
}
const exUnitOf = ex => (S.meta.exUnit && S.meta.exUnit[ex]) || U();
function ProgressionSettings({ set }) {
  const st = S.meta.settings; const u = st.unit; const fine = fineFor(u);
  const ej = Object.entries(S.meta.exJump || {});
  const tog = (k, label, sub) => html`<label class="toggle-row" for=${'tg-' + k}><span><span>${label}</span><span class="d">${sub}</span></span><input type="checkbox" role="switch" id=${'tg-' + k} checked=${st[k] !== false} onChange=${e => set(k, e.target.checked)}/></label>`;
  return html`<div class="stack" style="gap:12px" id="prog-settings">
    <div><span class="lbl">Last time’s numbers come from</span><div style="margin-top:6px"><${PrefillSeg}/></div>
      <p class="small muted" style="margin-top:4px">Prefilled weights and reps, and weight jumps, use the last time you did the exercise in any workout, or only in the same workout (plan day). A plan can choose its own on its page. PRs always count every workout.</p></div>
    <div><span class="lbl">Smallest jump your gym allows (${u})</span><div class="seg" role="group" aria-label="Smallest jump" style="margin-top:6px">${FINE_OPTS[u].map(f => html`<button key=${f} id=${'fine-' + String(f).replace('.', '_')} class=${fine === f ? 'on' : ''} aria-pressed=${fine === f} onClick=${() => set('fine', f)}>${fmt(f)}</button>`)}</div>
      <p class="small muted" style="margin-top:4px">${'One ' + fmt(fine / 2) + ' ' + u + ' plate each side' + (fine < (u === 'lb' ? 5 : 2.5) ? ' (fractional plates). The plate readout uses them.' : '.')}</p></div>
    ${tog('stepDown', 'Smaller jump after a miss', 'If a set falls below the bottom of the range after a jump, suggest half the jump next time (10 → 5 → 2.5), down to your smallest jump.')}
    <label class="toggle-row" for="tg-bigJumps"><span><span>Bigger jumps</span><span class="d">Off: a jump is at most ${u === 'kg' ? '10 kg' : '20 lb (10 each side)'}. On: any amount.</span></span><input type="checkbox" role="switch" id="tg-bigJumps" checked=${!!st.bigJumps} onChange=${e => set('bigJumps', e.target.checked)}/></label>
    ${tog('deload', 'Drop about 10% after three misses', 'Three sessions in a row at the same weight where half or more of the sets fell short of the range.')}
    ${ej.length ? html`<div><span class="lbl">Per-exercise jumps</span>${ej.map(([ex, j]) => html`<div key=${ex} class="row small" style="min-height:40px"><span style="flex:1">${exName(ex)}</span><b class="num">+${fmt(j.v)} ${j.u}</b><button class="icon-btn" aria-label=${'Use the default jump for ' + exName(ex)} onClick=${() => commit(x => { delete x.meta.exJump[ex]; }, 'meta', 600)}>${I.x}</button></div>`)}</div>` : null}
    <p class="note">Set one exercise's jump from its ⋯ menu during a workout.</p></div>`;
}

/* ---- Planks, hangs and runs logged as reps before Oct 21 ---- */
function legacyTimed() {
  const out = [];
  for (const s of sessionList()) for (const it of s.items) if (exKind(it.ex) === 'timed') for (const x of it.sets) if (+x.r > 0 && !(+x.t > 0)) out.push({ s, it, x });
  return out;
}
function LegacyTimedCard() {
  if (S.meta.settings.legacyTimed) return null; const L = legacyTimed(); if (!L.length) return null;
  const exs = [...new Set(L.map(l => exName(l.it.ex)))];
  const ex = L[0];
  const go = () => { const ids = new Set(); commit(st => { for (const s of Object.values(st.sessions)) { let hit = false; for (const it of s.items || []) if (exKind(it.ex) === 'timed') for (const x of it.sets) if (+x.r > 0 && !(+x.t > 0)) { x.t = +x.r; x.r0 = +x.r; x.r = 0; hit = true; } if (hit) { s.updatedAt = Date.now(); ids.add('s_' + s.id); } }
    st.meta.settings.legacyTimed = 'converted'; }, ['meta', ...ids]); showToast({ kind: 'info', text: L.length + ' set' + (L.length === 1 ? '' : 's') + ' now count as seconds' }); };
  return html`<div class="card stack" style="margin-top:14px" id="legacy-timed"><div style="font-weight:700">Holds you logged as reps</div>
    <p class="note">${exs.slice(0, 3).join(', ')}${exs.length > 3 ? ' and ' + (exs.length - 3) + ' more' : ''} now log a time. ${L.length} older set${L.length === 1 ? '' : 's'} were logged as reps, like ${fmt(+ex.x.w || 0) !== '0' ? fmt(+ex.x.w) + ' ' + (ex.it.u || U()) + ' × ' : ''}${ex.x.r}. If those reps were seconds, convert them so they count as hold times.</p>
    <div class="row"><button class="btn primary" id="legacy-convert" onClick=${go}>Count reps as seconds</button><button class="btn text" onClick=${() => commit(st => { st.meta.settings.legacyTimed = 'kept'; }, 'meta')}>Leave them</button></div></div>`;
}

/* ---- Weekly goal follows the program ---- */
function programDays(id) {
  const r = id && id !== 'self' && getRoutine(id); if (!r) return 0;
  const m = String(r.meta || '').match(/(\d)(?:\s*[–-]\s*\d)?\s*days a week/); if (m) return +m[1];
  return Math.min(7, r.days.length);
}
function followToast(id) {
  if (id === 'self') return { kind: 'info', text: 'Self-log it is' };
  const r = getRoutine(id); const n = programDays(id); const g = +S.meta.settings.goal || 0;
  if (n && n !== g) return { kind: 'info', ms: 9000, text: 'Following ' + r.name + ', ' + n + ' days a week. Your weekly goal is ' + g + '.', action: 'Make it ' + n, fn: () => { commit(st => { st.meta.settings.goal = n; }, 'meta'); showToast({ kind: 'info', text: 'Weekly goal: ' + n + ' workouts' }); } };
  return { kind: 'info', text: 'Following ' + r.name };
}

/* ---- A past workout: do it again, or save it as a routine ---- */
function itemsFromSession(s) {
  return s.items.filter(it => it.sets && it.sets.length).map((it, j) => { const t = it.target || {};
    const o = { id: uid('i'), ex: it.ex, sets: it.sets.length, reps: t.reps || (isMeasured(exKind(it.ex)) ? '' : sameReps(it.sets)), group: it.group || '', ss: !!it.ss && j > 0, note: t.cue || '' };
    if (isMeasured(exKind(it.ex))) { const tg = {}; const d = it.sets.map(x => +x.d || 0).filter(Boolean); const tt = it.sets.map(x => +x.t || 0).filter(Boolean);
      if (t.d || d.length) tg.d = t.d || d[0]; if (t.dur) tg.dur = t.dur; else if (exKind(it.ex) === 'timed' && tt.length) tg.dur = Math.round(Math.max(...tt)); if (Object.keys(tg).length) o.tg = tg; }
    return o; });
}
const sameReps = sets => { const r = sets.map(x => +x.r || 0).filter(Boolean); if (!r.length) return ''; const lo = Math.min(...r), hi = Math.max(...r); return lo === hi ? String(lo) : lo + '-' + hi; };
function repeatSession(id) {
  const s = S.sessions[id]; if (!s) return; closeSheet();
  startWorkout(null, { id: 'again-' + id, name: s.name, items: itemsFromSession(s) });
  if (S.active && S.active.dayId === 'again-' + id) { S.active.routineName = 'Again: ' + shortDate(s.startedAt); touch(); }
}
function saveSessionAsRoutine(id) {
  const s = S.sessions[id]; if (!s) return;
  const r = { id: uid('r'), name: uniquePlanName(s.name && s.name !== 'Workout' ? s.name : 'Workout from ' + shortDate(s.startedAt)), source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: s.name || 'Day 1', items: itemsFromSession(s) }] };
  commit(st => { st.meta.routines[r.id] = r; }, 'meta'); closeSheet(); UI.setTab('routines'); UI.setView({ type: 'routine', id: r.id });
  showToast({ kind: 'info', text: 'Saved as a plan. Edit it to change sets or reps.' });
}

/* ---- Body measurements and body scans, in Stats next to bodyweight ----
   Nov 16 (Newt): track everything a 3D body scan report gives (Styku and similar): body fat, lean, fat and bone mass,
   BMR, fat by area, lean by limb and left/right tape measurements. A scan PDF is read on the phone (pdf.js, loaded only
   when used); nothing leaves the phone. Entries: S.meta.meas [{ id, d, k, v, u }]. */
const MEAS_DEF = [
  ['waist', 'Waist', 'len', 'basic'], ['chest', 'Chest', 'len', 'basic'], ['hips', 'Hips', 'len', 'basic'], ['arm', 'Arm', 'len', 'basic'],
  ['thigh', 'Thigh', 'len', 'basic'], ['calf', 'Calf', 'len', 'basic'], ['neck', 'Neck', 'len', 'basic'], ['bf', 'Body fat', '%', 'basic'],
  ['leanm', 'Lean mass', 'mass', 'comp'], ['fatm', 'Fat mass', 'mass', 'comp'], ['bonem', 'Bone mass', 'mass', 'comp'],
  ['leanp', 'Lean mass %', '%', 'comp'], ['bonep', 'Bone mass %', '%', 'comp'], ['bmr', 'Resting burn (BMR)', 'kcal', 'comp'],
  ['visc', 'Visceral fat', 'mass', 'fat'], ['subq', 'Subcutaneous fat', 'mass', 'fat'], ['android', 'Belly fat (android)', 'mass', 'fat'],
  ['gynoid', 'Hip fat (gynoid)', 'mass', 'fat'], ['vfa', 'Visceral fat area', 'cm2', 'fat'],
  ['lean_al', 'Left arm lean', 'mass', 'limb'], ['lean_ar', 'Right arm lean', 'mass', 'limb'], ['lean_ll', 'Left leg lean', 'mass', 'limb'],
  ['lean_lr', 'Right leg lean', 'mass', 'limb'], ['alsti', 'Limb lean index (ALSTI)', 'idx', 'limb'], ['shape', 'Shape score', 'score', 'limb'],
  ['waist_ab', 'Waist at belly button', 'len', 'tape'], ['waist_lo', 'Lower waist', 'len', 'tape'], ['hip_hi', 'High hip', 'len', 'tape'],
  ['bicep_l', 'Bicep, left', 'len', 'tape'], ['bicep_r', 'Bicep, right', 'len', 'tape'], ['bicep_ll', 'Lower bicep, left', 'len', 'tape'],
  ['bicep_lr', 'Lower bicep, right', 'len', 'tape'], ['fore_l', 'Forearm, left', 'len', 'tape'], ['fore_r', 'Forearm, right', 'len', 'tape'],
  ['thigh_ul', 'Upper thigh, left', 'len', 'tape'], ['thigh_ur', 'Upper thigh, right', 'len', 'tape'], ['thigh_ml', 'Mid-thigh, left', 'len', 'tape'],
  ['thigh_mr', 'Mid-thigh, right', 'len', 'tape'], ['thigh_ll', 'Lower thigh, left', 'len', 'tape'], ['thigh_lr', 'Lower thigh, right', 'len', 'tape'],
  ['calf_l', 'Calf, left', 'len', 'tape'], ['calf_r', 'Calf, right', 'len', 'tape'],
];
const MEAS_GROUPS = [['basic', 'Basics'], ['comp', 'Body composition'], ['fat', 'Where the fat is'], ['limb', 'Lean by limb and scores'], ['tape', 'Scan measurements, left and right']];
const MEAS_KEYS = MEAS_DEF.map(([k, l]) => [k, l]);
const MEAS_TOP = ['bf', 'leanm', 'fatm', 'waist', 'chest', 'hips', 'arm', 'thigh', 'calf', 'neck'];
const lenU = () => U() === 'kg' ? 'cm' : 'in';
const measKind = k => (MEAS_DEF.find(x => x[0] === k) || [])[2] || 'len';
const measUnit = k => ({ len: lenU(), mass: U(), '%': '%', kcal: 'cal/day', cm2: 'cm²', idx: 'kg/m²', score: '' })[measKind(k)];
const lenConv = (v, from, to) => (!from || !to || from === to) ? v : from === 'cm' ? v / 2.54 : v * 2.54;
const measVal = e => { const kd = measKind(e.k); return kd === 'len' ? r1(lenConv(+e.v, e.u, lenU())) : kd === 'mass' ? r1(conv(+e.v, e.u || U(), U())) : +e.v; };
const measSorted = () => (S.meta.meas || []).slice().sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
function MeasStatRow({ k, l, list }) {
  const es = list.filter(e => e.k === k); const last = es[es.length - 1], first = es[0]; const d = measVal(last) - measVal(first); const un = measUnit(k);
  return html`<div key=${k}><div style="min-width:0"><div style="font-weight:600">${l}</div><div class="small muted">${shortDate(+parseYmd(last.d))}${es.length > 1 ? ' · ' + (d >= 0 ? '+' : '−') + fmt(Math.abs(r1(d))) + (un ? ' ' + un : '') + ' since ' + shortDate(+parseYmd(first.d)) : ''}</div></div>
    ${es.length > 1 ? html`<${Sparkline} pts=${es.map(e => ({ t: +parseYmd(e.d), v: measVal(e) }))}/>` : null}<b class="num">${fmt(measVal(last))}${un ? ' ' + un : ''}</b></div>`;
}
function MeasureCard() {
  const list = measSorted(); const has = new Set(list.map(e => e.k)); const all = lsGet('measAll') === '1';
  const shown = MEAS_DEF.filter(([k]) => has.has(k)); const top = MEAS_TOP.map(k => MEAS_DEF.find(x => x[0] === k)).filter(x => has.has(x[0]));
  const more = shown.length - top.length; const scans = [...new Set(list.filter(e => !['basic'].includes((MEAS_DEF.find(x => x[0] === e.k) || [])[3])).map(e => e.d))];
  return html`<div id="measure-card"><div class="section-h"><h2>Measurements</h2><span class="row" style="gap:2px"><button class="btn text" id="scan-import" onClick=${() => openSheet({ type: 'bodyScan' })}>Add a scan</button><button class="btn text" id="log-meas" onClick=${() => openSheet({ type: 'measure' })}>+ Log</button></span></div>
    <div class="card">${!shown.length ? html`<p class="note">Waist, chest, arms and more, measured every few weeks, show changes the scale misses. Had a 3D body scan? Add a scan reads the report's PDF on your phone and tracks every number in it.</p>`
      : all && more > 0 ? MEAS_GROUPS.map(([g, gl]) => { const rows = shown.filter(x => x[3] === g); return rows.length ? html`<div key=${g} class="meas-grp"><div class="meas-gh">${gl}</div><div class="prl">${rows.map(([k, l]) => html`<${MeasStatRow} key=${k} k=${k} l=${l} list=${list}/>`)}</div></div>` : null; })
      : html`<div class="prl">${(top.length ? top : shown.slice(0, 6)).map(([k, l]) => html`<${MeasStatRow} key=${k} k=${k} l=${l} list=${list}/>`)}</div>`}
      ${more > 0 ? html`<button class="btn text" id="meas-all" onClick=${() => { lsSet('measAll', all ? '0' : '1'); S.rerender(); }}>${all ? 'Show fewer' : 'Show all ' + shown.length + ' numbers'}</button>` : null}
      ${scans.length ? html`<p class="small muted" style="margin-top:6px">${scans.length === 1 ? '1 scan' : scans.length + ' scans'}, last ${shortDate(+parseYmd(scans[scans.length - 1]))}. Scan numbers are the scanner's estimates, not medical advice.</p>` : null}</div></div>`;
}
/* Fields for one date, grouped; groups with values (or the Basics) start open */
function MeasFields({ v, setV, keys, openAll }) {
  return MEAS_GROUPS.map(([g, gl]) => { const ks = MEAS_DEF.filter(x => x[3] === g && (!keys || keys.includes(x[0]))); if (!ks.length) return null;
    const grid = html`<div class="me-grid" style="margin-top:8px">${ks.map(([k, l]) => html`<div key=${k}><label class="lbl" for=${'ms-' + k}>${l}${measUnit(k) ? ' (' + measUnit(k) + ')' : ''}</label><input class="field" id=${'ms-' + k} inputmode="decimal" value=${v[k] || ''} onFocus=${selAll} onInput=${e => setV({ ...v, [k]: e.target.value })}/></div>`)}</div>`;
    const filled = ks.filter(([k]) => num(v[k]) > 0).length;
    return g === 'basic' && !keys ? html`<div key=${g} style="margin-top:10px">${grid}</div>`
      : html`<details key=${g} class="meas-det" id=${'mg-' + g} open=${openAll || filled > 0}><summary><b>${gl}</b><span class="small muted">${filled ? filled + ' filled' : ks.length + ' numbers'}</span></summary>${grid}</details>`; });
}
const measOn = d => { const o = {}; (S.meta.meas || []).filter(e => e.d === d).forEach(e => { o[e.k] = String(measVal(e)); }); return o; };
/* Replace one date's numbers with these (an emptied field removes that number) */
function saveMeas(d, v, keys) {
  const ks = new Set(keys || MEAS_DEF.map(x => x[0]));
  const add = Object.entries(v).filter(([k, x]) => ks.has(k) && num(x) > 0).map(([k, x]) => ({ id: uid('m'), d, k, v: measKind(k) === 'kcal' ? Math.round(num(x)) : r1(num(x)), u: measUnit(k) || '' }));
  commit(st => { st.meta.meas = (st.meta.meas || []).filter(e => !(e.d === d && ks.has(e.k))).concat(add); }, 'meta', 600);
  return add.length;
}
function MeasureSheet() {
  const [d, setD] = useState(ymd(new Date())); const [v, setV] = useState(() => measOn(ymd(new Date())));
  const had = (S.meta.meas || []).some(e => e.d === d); const any = Object.values(v).some(x => num(x) > 0);
  const save = () => { saveMeas(d, v); closeSheet(); showToast({ kind: 'info', text: 'Measurements saved' }); };
  return html`<${Sheet} label="Log measurements"><h2>Log measurements</h2><p class="note">Fill in any you measured. Same spot, same time of day, tape snug but not tight.${had ? ' This date already has numbers: change them here, or empty a box to remove it.' : ''}</p>
    <div style="margin-top:10px"><label class="lbl" for="ms-date">Date</label><input class="field" type="date" id="ms-date" max=${ymd(new Date())} value=${d} onChange=${e => { if (e.target.value) { setD(e.target.value); setV(measOn(e.target.value)); } }}/></div>
    <${MeasFields} v=${v} setV=${setV}/>
    <button class="btn text" id="ms-scan" style="margin-top:6px" onClick=${() => openSheet({ type: 'bodyScan' })}>Have a body scan report? Add it from the PDF</button>
    <button class="btn primary wide" style="margin-top:10px" id="ms-save" disabled=${!any && !had} onClick=${save}>Save</button><//>`;
}

/* ---- Reading a body scan report ----
   Labels as scan reports print them (Styku first; a few common InBody/DEXA names too). Longest labels are matched first
   and taken out of the text, so "High Hip 35.8" is never read as Hip, or "Mid-Thigh Left" as another thigh. */
const SCAN_LABELS = [
  ['Body Fat %', 'bf'], ['Percent Body Fat', 'bf'], ['Body Fat Percentage', 'bf'], ['PBF', 'bf'], ['Lean Mass %', 'leanp'], ['Bone Mass %', 'bonep'],
  ['Fat Mass', 'fatm'], ['Body Fat Mass', 'fatm'], ['Lean Mass', 'leanm'], ['Lean Body Mass', 'leanm'], ['Fat Free Mass', 'leanm'], ['Bone Mass', 'bonem'],
  ['BMR', 'bmr'], ['Basal Metabolic Rate', 'bmr'], ['Android Mass', 'android'], ['Gynoid Mass', 'gynoid'], ['Visceral Fat Area', 'vfa'],
  ['Visceral Fat', 'visc'], ['Subcutaneous Fat', 'subq'], ['Shape Score', 'shape'], ['Appendicular Lean Soft Tissue Index', 'alsti'], ['ALSTI', 'alsti'],
  ['Bicep Left Lower', 'bicep_ll'], ['Bicep Left', 'bicep_l'], ['Bicep Right Lower', 'bicep_lr'], ['Bicep Right', 'bicep_r'],
  ['Calf Left', 'calf_l'], ['Calf Right', 'calf_r'], ['Chest', 'chest'], ['Forearm Left', 'fore_l'], ['Forearm Right', 'fore_r'],
  ['High Hip', 'hip_hi'], ['Hip', 'hips'], ['Hips', 'hips'], ['Neck', 'neck'],
  ['Thigh Left Lower', 'thigh_ll'], ['Mid-Thigh Left', 'thigh_ml'], ['Thigh Left Upper', 'thigh_ul'], ['Thigh Right Lower', 'thigh_lr'],
  ['Mid-Thigh Right', 'thigh_mr'], ['Thigh Right Upper', 'thigh_ur'],
  ['Waist (Abdominal)', 'waist_ab'], ['Waist (Lower)', 'waist_lo'], ['Waist (Narrowest)', 'waist'], ['Waist', 'waist'],
].sort((a, b) => b[0].length - a[0].length);
/* text → { vals: { key: number in the report's units }, d: 'YYYY-MM-DD' | null, mu: 'lb'|'kg', lu: 'in'|'cm', bw: number | null } */
function parseScan(text) {
  let t = ' ' + String(text || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ') + ' ';
  const hu = t.match(/\(\s*(lbs?|kg)\s*,\s*(in|cm)\s*\)/i);
  const mu = hu ? (/kg/i.test(hu[1]) ? 'kg' : 'lb') : /\d\s*kg\b/i.test(t) && !/\d\s*lbs?\b/i.test(t) ? 'kg' : 'lb';
  const lu = hu ? hu[2].toLowerCase() : mu === 'kg' ? 'cm' : 'in';
  let d = null; const dm = t.match(/(?:Scan|Test|Exam)\s*Date\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i) || t.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (dm) { const y = +dm[3] < 100 ? 2000 + +dm[3] : +dm[3]; const dt = new Date(y, +dm[1] - 1, +dm[2]); if (!isNaN(dt) && dt.getDate() === +dm[2]) d = ymd(dt); }
  const wm = t.match(/Weight\b[^\n]{0,40}?(\d+(?:\.\d+)?)\s*(lbs?|kg)\b/i); const bw = wm ? +wm[1] : null; const bwU = wm ? (/kg/i.test(wm[2]) ? 'kg' : 'lb') : mu;
  const vals = {};
  for (const [lab, k] of SCAN_LABELS) {
    const re = new RegExp('(^|[^A-Za-z-])' + reEsc(lab) + '\\s*:?\\s*(\\d+(?:\\.\\d+)?)', 'i');
    let m; while ((m = t.match(re))) { if (vals[k] == null) vals[k] = +m[2]; t = t.slice(0, m.index) + m[1] + ' ' + t.slice(m.index + m[0].length); }
  }
  return { vals, d, mu, lu, bw, bwU };
}
/* The report's numbers in the app's units, as strings for the review boxes */
function scanToFields(P) {
  const o = {}; for (const [k, x] of Object.entries(P.vals)) { const kd = measKind(k);
    o[k] = String(kd === 'len' ? r1(lenConv(x, P.lu, lenU())) : kd === 'mass' ? r1(conv(x, P.mu, U())) : x); }
  return o;
}
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
/* A PDF's text, line by line (pieces on the same line joined left to right) */
async function pdfText(file) {
  if (!window.pdfjsLib) await loadScript('vendor/pdf/pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf/pdf.worker.min.js', location.href).href;
  const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const out = [];
  for (let i = 1; i <= Math.min(doc.numPages, 12); i++) {
    const tc = await (await doc.getPage(i)).getTextContent(); const rows = [];
    for (const it of tc.items) { if (!it.str || !it.str.trim()) continue; const y = it.transform[5], x = it.transform[4];
      let r = rows.find(q => Math.abs(q.y - y) < 3); if (!r) rows.push(r = { y, p: [] }); r.p.push([x, it.str]); }
    rows.sort((a, b) => b.y - a.y).forEach(r => out.push(r.p.sort((a, b) => a[0] - b[0]).map(q => q[1]).join(' ').replace(/\s+/g, ' ').trim()));
  }
  try { doc.destroy(); } catch (e) {}
  return out.join('\n');
}
/* Numbers scan reports often show only as pictures, so they are typed in by hand */
const SCAN_PICTURE_KEYS = ['shape', 'alsti', 'vfa', 'lean_al', 'lean_ar', 'lean_ll', 'lean_lr'];
function BodyScanSheet() {
  const [st, setSt] = useState({ stage: 'pick' }); const [paste, setPaste] = useState(''); const set = o => setSt(s => ({ ...s, ...o }));
  const read = P => { const n = Object.keys(P.vals).length;
    if (!n) return set({ stage: 'pick', err: 'No body scan numbers found in that. Try the report PDF itself, or paste its text below.' });
    set({ stage: 'review', P, v: scanToFields(P), d: P.d && P.d <= ymd(new Date()) ? P.d : ymd(new Date()), bwOn: !!P.bw, err: '' }); };
  const onFile = async e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; set({ stage: 'reading', err: '' });
    try { read(parseScan(await pdfText(f))); } catch (x) { set({ stage: 'pick', err: 'That file could not be read as a PDF. You can paste the report text instead.' }); } };
  if (st.stage === 'review') {
    const { P, v, d } = st; const found = Object.keys(P.vals); const pic = SCAN_PICTURE_KEYS.filter(k => !found.includes(k));
    const bwShow = P.bw ? r1(conv(P.bw, P.bwU, U())) : 0; const prior = (S.meta.meas || []).some(e => e.d === d && found.concat(pic).includes(e.k));
    const save = () => { const keys = found.concat(pic.filter(k => num(v[k]) > 0)); const n = saveMeas(d, v, keys);
      if (st.bwOn && bwShow > 0) commit(x => { x.meta.bw = (x.meta.bw || []).filter(y => y.d !== d).concat([{ id: uid('b'), d, w: bwShow, u: U() }]); }, 'meta', 600);
      lsSet('measAll', '1'); closeSheet(); showToast({ kind: 'info', text: n + ' numbers saved from your scan' + (st.bwOn && bwShow > 0 ? ', plus your weight' : '') + '.' }); };
    return html`<${Sheet} label="Check your scan"><h2>Check your scan</h2>
      <p class="note">Found ${found.length} numbers${P.d ? ' from the scan on ' + shortDate(+parseYmd(P.d)) : ''}. Fix any that look wrong, then save.${U() !== P.mu ? ' Converted to ' + U() + ' and ' + lenU() + '.' : ''}</p>
      <div style="margin-top:10px"><label class="lbl" for="bs-date">Scan date</label><input class="field" type="date" id="bs-date" max=${ymd(new Date())} value=${d} onChange=${e => e.target.value && set({ d: e.target.value })}/></div>
      ${prior ? html`<p class="small muted" style="margin-top:6px">This date already has scan numbers. Saving replaces them.</p>` : null}
      ${P.bw ? html`<label class="toggle-row" for="bs-bw" style="margin-top:10px"><span><span>Also log my weight, ${fmt(bwShow)} ${U()}</span><span class="d">Adds it to Bodyweight for this date.</span></span><input type="checkbox" role="switch" id="bs-bw" checked=${st.bwOn} onChange=${e => set({ bwOn: e.target.checked })}/></label>` : null}
      <${MeasFields} v=${v} setV=${nv => set({ v: nv })} keys=${found} openAll=${true}/>
      ${pic.length ? html`<details class="meas-det" id="mg-pics"><summary><b>Numbers in the report's pictures</b><span class="small muted">Optional</span></summary>
        <p class="small muted" style="margin-top:6px">Reports often show these only as charts, so they can't be read from the file. Type in any you want to track.</p>
        <${MeasFields} v=${v} setV=${nv => set({ v: nv })} keys=${pic} openAll=${true}/></details>` : null}
      <p class="small muted" style="margin-top:8px">Read on your phone; the report never leaves it. Scan numbers are the scanner's estimates, not medical advice.</p>
      <button class="btn primary wide" style="margin-top:10px" id="bs-save" onClick=${save}>Save ${found.length} numbers</button><//>`;
  }
  return html`<${Sheet} label="Add a body scan"><h2>Add a body scan</h2>
    <p class="note">Choose the report PDF from your scan (Styku and similar). Ironwood reads it on your phone, shows you what it found, and tracks each number in Stats. The file never leaves your phone.</p>
    ${st.err ? html`<p class="note" role="alert" style="margin-top:8px;color:var(--red-text)">${st.err}</p>` : null}
    <div class="stack" style="margin-top:12px"><label class="btn primary wide" for="bs-file" aria-disabled=${st.stage === 'reading'}>${st.stage === 'reading' ? 'Reading your report…' : 'Choose the PDF'}</label>
      <input id="bs-file" type="file" accept="application/pdf,.pdf" hidden onChange=${onFile}/></div>
    <details class="meas-det" id="bs-paste-box" style="margin-top:12px"><summary><b>Or paste the report's text</b></summary>
      <textarea class="field" id="bs-paste" rows="6" style="margin-top:8px" placeholder="Body Fat % 18.4&#10;Lean Mass 141.2&#10;Waist (Narrowest) 30.2" value=${paste} onInput=${e => setPaste(e.target.value)}></textarea>
      <button class="btn wide" id="bs-read" style="margin-top:8px" disabled=${!paste.trim()} onClick=${() => read(parseScan(paste))}>Read it</button></details>
    <button class="btn text" style="margin-top:8px" onClick=${() => openSheet({ type: 'measure' })}>Type numbers in instead</button><//>`;
}

/* ---- Share a finished workout as a picture (nothing leaves the phone unless you share it) ---- */
function workoutImage(s) {
  const css = getComputedStyle(document.documentElement); const c = k => (css.getPropertyValue(k) || '').trim();
  const bg = c('--bg') || '#111', ink = c('--ink') || '#fff', ink2 = c('--ink-2') || '#aaa', acc = c('--accent') || '#2f6fe0', surf = c('--surface') || '#222';
  const font = (c('--display') || 'sans-serif'), body = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const rows = s.items.slice(0, 9).map(it => { const kind = exKind(it.ex); const u = it.u || U();
    return [exName(it.ex), isMeasured(kind) ? measBest(it.sets, kind) : it.sets.length + ' set' + (it.sets.length === 1 ? '' : 's') + ' · best ' + String(bestSetLabel(it.sets, kind) || '').replace(' × ', kind === 'bodyweight' ? ' × ' : ' ' + u + ' × ')]; });
  const prs = noE1(s.prs || []);
  const W = 1080, H = 360 + rows.length * 86 + (prs.length ? 120 : 0) + 120;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = acc; g.fillRect(0, 0, W, 14);
  g.fillStyle = ink2; g.font = '600 34px ' + body; g.fillText(shortDate(s.startedAt).toUpperCase() + (s.routineName ? '  ·  ' + s.routineName.toUpperCase() : ''), 64, 100);
  g.fillStyle = ink; g.font = '700 84px ' + font; g.fillText(String(s.name || 'Workout').toUpperCase().slice(0, 22), 64, 190);
  const mins = Math.max(1, Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000)); const sets = s.items.reduce((n, it) => n + it.sets.length, 0); const vol = s.items.reduce((n, it) => n + itemVolume(it), 0);
  const stats = [[mins + ' min', 'time'], [sets, 'sets'], [vol ? (vol >= 10000 ? fmt(Math.round(vol / 100) / 10) + 'k' : fmt(vol)) : '–', U() + ' moved']];
  stats.forEach(([v, l], i) => { const x = 64 + i * 330; g.fillStyle = surf; roundRect(g, x, 230, 300, 100, 22); g.fill(); g.fillStyle = ink; g.font = '700 46px ' + body; g.fillText(String(v), x + 28, 288); g.fillStyle = ink2; g.font = '500 26px ' + body; g.fillText(l, x + 28, 318); });
  let y = 410;
  for (const [n, v] of rows) { g.fillStyle = ink; g.font = '600 38px ' + body; g.fillText(n.slice(0, 30), 64, y); g.fillStyle = ink2; g.font = '500 32px ' + body; g.fillText(v.slice(0, 40), 64, y + 42); y += 86; }
  if (prs.length) { g.fillStyle = acc; g.font = '700 36px ' + body; g.fillText(prs.length + ' new PR' + (prs.length === 1 ? '' : 's') + ': ' + prs.slice(0, 3).map(p => exName(p.ex)).join(', ').slice(0, 44), 64, y + 40); y += 120; }
  g.fillStyle = ink2; g.font = '600 30px ' + body; g.fillText('IRONWOOD', 64, H - 56);
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function shareWorkout(id) {
  const s = S.sessions[id]; if (!s) return;
  const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
  if (!dl) { showToast({ kind: 'info', text: 'Sharing isn’t available in this view.' }); return; }
  try { const b = await workoutImage(s); await dl.save({ filename: 'ironwood-' + ymd(s.startedAt) + '.png', data: b }); }
  catch (e) { if (!e || e.code !== 'declined') showToast({ kind: 'info', text: 'Couldn’t make the picture here.' }); }
}
function SessionActions({ id, summary }) {
  const s = S.sessions[id]; if (!s || s.kind === 'activity') return null;
  return html`<div class="row wrap sess-acts" style="margin-top:12px">
    <button class="btn" id="sess-again" onClick=${() => repeatSession(id)}>${I.swap} Do it again</button>
    ${!s.routineId || s.routineId === 'run-plan' || summary === false ? html`<button class="btn" id="sess-save-routine" onClick=${() => saveSessionAsRoutine(id)}>${I.plus} Save as a plan</button>` : null}
    <button class="btn" id="sess-share" onClick=${() => shareWorkout(id)}>${I.share || I.copy} Share picture</button></div>`;
}

/* ---- Storage: a second copy in IndexedDB ----
   Every save still goes to localStorage (as before), and also to IndexedDB, which holds far more. Each save is stamped
   (at), and launch loads whichever copy is newer, so the app survives a full or cleared localStorage. If localStorage is
   full, saves continue in IndexedDB and "Storage is full" only shows when both fail. If IndexedDB can't be read at launch
   while it holds the newer copy, the app refuses to save rather than write an older copy over it. */
const IDB = { ok: typeof indexedDB !== 'undefined', db: null, pending: null, busy: false, savedAt: 0, failed: false };
let storeBlocked = false, storeAt = 0, lsOver = false;
function idbOpen() {
  if (IDB.db) return Promise.resolve(IDB.db);
  return new Promise((res, rej) => { let q; try { q = indexedDB.open('ironwood', 1); } catch (e) { rej(e); return; }
    q.onupgradeneeded = () => { try { q.result.createObjectStore('kv'); } catch (e) {} };
    q.onsuccess = () => { IDB.db = q.result; IDB.db.onversionchange = () => { try { IDB.db.close(); } catch (e) {} IDB.db = null; }; res(IDB.db); };
    q.onerror = () => rej(q.error); q.onblocked = () => rej(new Error('blocked')); });
}
function idbGet() { return idbOpen().then(db => new Promise((res, rej) => { const r = db.transaction('kv', 'readonly').objectStore('kv').get('main'); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); })); }
function idbPut(raw, at) { return idbOpen().then(db => new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put({ raw, at }, 'main'); tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); })); }
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
function idbQueue(raw, at) {
  if (!IDB.ok) return; IDB.pending = { raw, at }; if (IDB.busy) return;
  const next = () => { const job = IDB.pending; if (!job) { IDB.busy = false; return; } IDB.pending = null; IDB.busy = true;
    idbPut(job.raw, job.at).then(() => { IDB.savedAt = job.at; IDB.failed = false;
      if (lsOver) { try { localStorage.setItem(LS + '.at', String(job.at)); } catch (e) { try { localStorage.removeItem(LS); localStorage.setItem(LS + '.at', String(job.at)); } catch (e2) {} } }
      if (S.sync === 'full' && lsOver) { storeOver(); } next(); })
    .catch(() => { IDB.failed = true; if (lsOver) storeFull(); next(); }); };
  next();
}
/* localStorage is full but the IndexedDB copy is saving: safe for now, so say so plainly once and keep a warning up */
function storeOver() { if (S.sync === 'over') return; const first = !storeOver.told; storeOver.told = true; S.sync = 'over'; if (first) showToast({ kind: 'info', ms: 9000, text: 'This phone’s storage is almost full. Your changes are still saved, but save a backup file soon.' }); S.rerender(); }
function storeFull() { if (!lsFull) { lsFull = true; showToast({ kind: 'bad', text: 'Storage is full. Your changes aren’t being saved. Save a backup file now.', ms: 9000 }); } S.sync = 'full'; S.rerender(); }
function storeSave() {
  if (lsBroken || storeBlocked) return false;
  storeAt = Math.max(Date.now(), storeAt + 1);
  const raw = JSON.stringify({ schema: SCHEMA, at: storeAt, meta: S.meta, sessions: S.sessions, active: S.active, activeAt: S.activeAt, dirty: [...S.dirty], rest: S.rest || null, itimer: S.itimer || null });
  idbQueue(raw, storeAt);
  try {
    localStorage.setItem(LS, raw); lsOver = false;
    try { localStorage.setItem(LS + '.at', String(storeAt)); } catch (e) {}
    if (lsFull) { lsFull = false; if (S.sync === 'full') S.sync = col ? 'pending' : 'local'; }
    if (S.sync === 'over') S.sync = col ? 'pending' : 'local';
    return true;
  } catch (e) {
    lsOver = true; try { localStorage.setItem(LS + '.at', String(storeAt)); } catch (e2) {}
    if (!IDB.ok || IDB.failed) { storeFull(); return false; }
    storeOver(); return true;
  }
}
async function storeLoad() {
  const ls = lsLoad(); if (!IDB.ok) return ls;
  let rec = null, err = false;
  try { rec = await withTimeout(idbGet(), 3000); } catch (e) { err = true; }
  const lsAt = ls ? (+ls.at || 0) : -1; let mark = 0; try { mark = +localStorage.getItem(LS + '.at') || 0; } catch (e) {}
  if (rec && rec.raw) { let v = null; try { v = JSON.parse(rec.raw); } catch (e) {}
    if (v && typeof v === 'object' && ((+v.at || 0) > lsAt || lsBroken)) { lsBroken = null; storeAt = +v.at || 0; return v; } }
  if (err && mark > Math.max(0, lsAt)) storeBlocked = true;
  if (ls) storeAt = Math.max(storeAt, +ls.at || 0);
  return ls;
}
function StoreBlockedScreen() {
  return html`<div class="empty" style="padding:48px 24px"><h3>Couldn’t open your saved workouts</h3>
    <p class="note" style="margin:10px 0 16px">Your newest data is in this phone’s app storage, which didn’t open just now. Nothing has been changed or saved over. Close Ironwood completely and open it again.</p>
    <button class="btn primary" onClick=${() => location.reload()}>Try again</button></div>`;
}
