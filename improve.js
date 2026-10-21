/* ============ Oct 21 review improvements ============ */
/* ---- Progression: weight jump per exercise, smaller jumps after a miss, a drop after three misses ----
   settings.fine: the smallest weight you can add (5 / 2.5 / 1 lb, 2.5 / 1.25 / 0.5 kg).
   settings.stepDown: after a jump, if a set falls below the bottom of the rep range, the next suggestion is half the jump.
   settings.deload: after three sessions short at one weight, suggest about 10% less.
   meta.exJump: { exercise id: { v, u } } — a weight jump just for that exercise (total added to the bar or machine). */
const FINE_OPTS = { lb: [5, 2.5, 1], kg: [2.5, 1, 0.5] };
const JUMP_PRESETS = { lb: [2.5, 5, 10, 15, 20, 25, 45, 90], kg: [1.25, 2.5, 5, 10, 20, 40] };
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
function jumpDefault(ex, u) { const b = unitInc(u); return exKind(ex) === 'barbell' && isDeadlift(ex) ? b * 2 : b; }
function jumpFor(ex, u) {
  const j = (S.meta.exJump || {})[ex];
  if (j && +j.v > 0) return j.u === u ? +j.v : roundToInc(conv(+j.v, j.u, u), fineFor(u)) || fineFor(u);
  return jumpDefault(ex, u);
}
const repBottom = reps => { const m = String(reps || '').match(/^(\d+)/); return m ? +m[1] : 0; };
/* The last n entries for an exercise at this slot position (newest first), weights in unit u */
function recentOcc(exId, group, occ, n, u) {
  const out = []; const list = sessionList();
  for (let i = list.length - 1; i >= 0 && out.length < n; i--) {
    const its = list[i].items.filter(it => it.ex === exId && (it.group || '') === (group || ''));
    if (!its.length) continue; const it = its[Math.min(occ || 0, its.length - 1)];
    const sets = it.sets.filter(x => +x.r > 0).map(x => ({ w: r1(conv(+x.w || 0, it.u || U(), u)), r: +x.r }));
    if (sets.length) out.push({ t: list[i].startedAt, sets, top: Math.max(...sets.map(x => x.w)) });
  }
  return out;
}
/* What to suggest next time: { mode: 'bump' | 'step' | 'deload' | 'hold', delta, factor, msg } */
function progPlan(it, kind, u, occ) {
  const st = S.meta.settings; const top = repTop(it.target.reps), low = repBottom(it.target.reps) || top, n = it.target.sets || 1;
  if (!top || kind === 'bodyweight') return { mode: 'hold' };
  const h = recentOcc(it.ex, it.group || '', occ, 3, u); if (!h.length) return { mode: 'hold' };
  const e1 = h[0], e0 = h[1];
  const full = e => e.sets.length >= n && e.sets.every(x => x.r >= top);
  const miss = e => e.sets.some(x => x.r < low);
  const fine = fineFor(u), jump = jumpFor(it.ex, u);
  const w = v => fmt(v) + ' ' + u;
  if (kind === 'assisted') return full(e1) ? { mode: 'bump', delta: -jump, msg: 'Less assist today. You hit every rep last time.' } : { mode: 'hold' };
  if (full(e1)) return { mode: 'bump', delta: jump, msg: '+' + w(jump) + ' today. You hit every rep last time.' };
  if (st.stepDown !== false && e0 && e1.top > e0.top + 1e-9 && miss(e1)) {
    const step = Math.floor(((e1.top - e0.top) / 2) / fine + 1e-9) * fine;
    if (step >= fine - 1e-9 && e0.top + step < e1.top - 1e-9)
      return { mode: 'step', delta: e0.top + step - e1.top, msg: 'Smaller jump today: ' + w(e0.top + step) + ' (+' + w(step) + '). ' + w(e1.top) + ' fell short of ' + low + ' reps last time.' };
  }
  if (st.deload !== false && h.length >= 3 && h.every(e => Math.abs(e.top - e1.top) < 1e-9 && miss(e)) && e1.top > 0) {
    const to = Math.floor(e1.top * 0.9 / fine + 1e-9) * fine;
    if (to < e1.top) return { mode: 'deload', factor: to / e1.top, to, msg: 'Down about 10% to ' + w(to) + ': three sessions short at ' + w(e1.top) + '. Build back up from here.' };
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
  const P = prev ? progPlan(it, kind, u, occ) : { mode: 'hold' };
  it.bump = P.mode === 'bump'; it.prog = P.mode !== 'hold' ? { mode: P.mode, msg: P.msg } : null;
  const top = repTop(it.target.reps), low = repBottom(it.target.reps) || top;
  it.sets.forEach((x, j) => {
    if (!x.id) x.id = uid('t');
    if (isDone(x)) return;
    const p = it.prev ? (it.prev[j] || it.prev[it.prev.length - 1]) : null;
    if (!p) { x.gw = ''; x.gr = low ? String(low) : ''; return; }
    let wv = +p.w || 0;
    if (P.mode === 'bump' || P.mode === 'step') wv = Math.max(0, wv + P.delta);
    if (P.mode === 'deload') wv = Math.max(0, Math.floor(wv * P.factor / fine + 1e-9) * fine);
    if (P.mode === 'step') wv = roundToInc(wv, fine);
    x.gw = wv ? String(r1(wv)) : '';
    const pr = +p.r || 0;
    x.gr = String(!top ? pr : P.mode !== 'hold' ? (low || top) : Math.min(top, Math.max(low, pr)));
  });
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
    <p class="note" style="margin-bottom:12px">How much to add when you hit the top of the rep range on every set. The total added, in ${u}. If a jump is too big and you fall short, the next workout suggests half of it.</p>
    <div class="preset-grid">${JUMP_PRESETS[u].map(p => html`<button key=${p} class=${'chip' + (now === p && cur ? ' on' : '')} aria-pressed=${now === p && !!cur} onClick=${() => set(p)}>+${fmt(p)}</button>`)}</div>
    <div class="row" style="margin-top:12px;align-items:flex-end"><div style="flex:1"><label class="lbl" for="jump-own">Your own amount (${u})</label><input class="field" id="jump-own" inputmode="decimal" placeholder=${fmt(now)} value=${v} onInput=${e => setV(e.target.value)}/></div>
      <button class="btn primary" id="jump-save" disabled=${!(num(v) > 0)} onClick=${() => set(Math.min(500, r1(num(v))))}>Save</button></div>
    <button class=${'opt' + (!cur ? ' on' : '')} style="margin-top:10px" onClick=${() => set(null)}>Use the default (+${fmt(def)} ${u}${isDeadlift(ex) && exKind(ex) === 'barbell' ? ', twice the main jump for deadlifts' : ''})</button><//>`;
}
const exUnitOf = ex => (S.meta.exUnit && S.meta.exUnit[ex]) || U();
function ProgressionSettings({ set }) {
  const st = S.meta.settings; const u = st.unit; const fine = fineFor(u);
  const ej = Object.entries(S.meta.exJump || {});
  const tog = (k, label, sub) => html`<label class="toggle-row" for=${'tg-' + k}><span><span>${label}</span><span class="d">${sub}</span></span><input type="checkbox" role="switch" id=${'tg-' + k} checked=${st[k] !== false} onChange=${e => set(k, e.target.checked)}/></label>`;
  return html`<div class="stack" style="gap:12px" id="prog-settings">
    <div><span class="lbl">Smallest jump your gym allows (${u})</span><div class="seg" role="group" aria-label="Smallest jump" style="margin-top:6px">${FINE_OPTS[u].map(f => html`<button key=${f} id=${'fine-' + String(f).replace('.', '_')} class=${fine === f ? 'on' : ''} aria-pressed=${fine === f} onClick=${() => set('fine', f)}>${fmt(f)}</button>`)}</div>
      <p class="small muted" style="margin-top:4px">${'One ' + fmt(fine / 2) + ' ' + u + ' plate each side' + (fine < (u === 'lb' ? 5 : 2.5) ? ' (fractional plates). The plate readout uses them.' : '.')}</p></div>
    ${tog('stepDown', 'Smaller jump after a miss', 'If a set falls below the bottom of the range after a jump, suggest half the jump next time (10 → 5 → 2.5), down to your smallest jump.')}
    ${tog('deload', 'Drop about 10% after three misses', 'Three sessions in a row short of the range at the same weight.')}
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
  const r = { id: uid('r'), name: s.name && s.name !== 'Workout' ? s.name : 'Workout from ' + shortDate(s.startedAt), source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: s.name || 'Day 1', items: itemsFromSession(s) }] };
  commit(st => { st.meta.routines[r.id] = r; }, 'meta'); closeSheet(); UI.setTab('routines'); UI.setView({ type: 'routine', id: r.id });
  showToast({ kind: 'info', text: 'Saved as a routine. Edit it to change sets or reps.' });
}

/* ---- Body measurements, next to bodyweight ---- */
const MEAS_KEYS = [['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['calf', 'Calf'], ['neck', 'Neck'], ['bf', 'Body fat']];
const lenU = () => U() === 'kg' ? 'cm' : 'in';
const measUnit = k => k === 'bf' ? '%' : lenU();
const measVal = e => e.k === 'bf' ? +e.v : r1(e.u && e.u !== lenU() ? (e.u === 'cm' ? +e.v / 2.54 : +e.v * 2.54) : +e.v);
function MeasureCard() {
  const list = (S.meta.meas || []).slice().sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  const keys = MEAS_KEYS.filter(([k]) => list.some(e => e.k === k));
  return html`<div id="measure-card"><div class="section-h"><h2>Measurements</h2><button class="btn text" id="log-meas" onClick=${() => openSheet({ type: 'measure' })}>+ Log</button></div>
    <div class="card">${!keys.length ? html`<p class="note">Waist, chest, arms and more, measured every few weeks, show changes the scale misses.</p>`
      : html`<div class="prl">${keys.map(([k, l]) => { const es = list.filter(e => e.k === k); const last = es[es.length - 1], first = es[0]; const d = measVal(last) - measVal(first);
        return html`<div key=${k}><div style="min-width:0"><div style="font-weight:600">${l}</div><div class="small muted">${shortDate(+parseYmd(last.d))}${es.length > 1 ? ' · ' + (d >= 0 ? '+' : '−') + fmt(Math.abs(r1(d))) + ' ' + measUnit(k) + ' since ' + shortDate(+parseYmd(first.d)) : ''}</div></div>
          ${es.length > 1 ? html`<${Sparkline} pts=${es.map(e => ({ t: +parseYmd(e.d), v: measVal(e) }))}/>` : null}<b class="num">${fmt(measVal(last))} ${measUnit(k)}</b></div>`; })}</div>`}</div></div>`;
}
function MeasureSheet() {
  const [d, setD] = useState(ymd(new Date())); const [v, setV] = useState({});
  const any = Object.values(v).some(x => num(x) > 0);
  const save = () => { const add = Object.entries(v).filter(([, x]) => num(x) > 0).map(([k, x]) => ({ id: uid('m'), d, k, v: r1(num(x)), u: measUnit(k) }));
    commit(st => { const ks = new Set(add.map(a => a.k)); st.meta.meas = (st.meta.meas || []).filter(e => !(e.d === d && ks.has(e.k))).concat(add); }, 'meta', 600); closeSheet(); showToast({ kind: 'info', text: 'Measurements saved' }); };
  return html`<${Sheet} label="Log measurements"><h2>Log measurements</h2><p class="note">Fill in any you measured. Same spot, same time of day, tape snug but not tight.</p>
    <div style="margin-top:10px"><label class="lbl" for="ms-date">Date</label><input class="field" type="date" id="ms-date" max=${ymd(new Date())} value=${d} onChange=${e => e.target.value && setD(e.target.value)}/></div>
    <div class="me-grid" style="margin-top:10px">${MEAS_KEYS.map(([k, l]) => html`<div key=${k}><label class="lbl" for=${'ms-' + k}>${l} (${measUnit(k)})</label><input class="field" id=${'ms-' + k} inputmode="decimal" value=${v[k] || ''} onInput=${e => setV({ ...v, [k]: e.target.value })}/></div>`)}</div>
    <button class="btn primary wide" style="margin-top:14px" id="ms-save" disabled=${!any} onClick=${save}>Save</button><//>`;
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
    ${!s.routineId || s.routineId === 'run-plan' || summary === false ? html`<button class="btn" id="sess-save-routine" onClick=${() => saveSessionAsRoutine(id)}>${I.plus} Save as routine</button>` : null}
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
      if (S.sync === 'full' && lsOver) { S.sync = col ? 'pending' : 'local'; S.rerender(); } next(); })
    .catch(() => { IDB.failed = true; if (lsOver) storeFull(); next(); }); };
  next();
}
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
    return true;
  } catch (e) {
    lsOver = true; try { localStorage.setItem(LS + '.at', String(storeAt)); } catch (e2) {}
    if (!IDB.ok || IDB.failed) { storeFull(); return false; }
    return true;
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
