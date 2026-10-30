/* ============ Lift goals and month in review (Oct 29) ============ */
/* Lift goals: meta.liftGoals = { id: { id, ex, metric: 'e1' | 'top', target, u, by: 'YYYY-MM-DD', start, createdAt } }.
   Train shows each goal every day: where you are now (best in the last 4 weeks), how far to go, the weekly gain that
   would get there by the date, and whether your current pace gets there. Estimates, not coaching advice. */
const GOAL_METRICS = [['e1', 'Est. 1-rep max'], ['top', 'Heaviest weight']];
const goalList = () => Object.values(S.meta.liftGoals || {}).filter(g => g && g.ex && +g.target > 0).sort((a, b) => (a.by || '').localeCompare(b.by || ''));
const goalTarget = g => r05(conv(+g.target, g.u || U(), U()));
const goalPts = g => seriesFor(g.ex, undefined, g.metric === 'top' ? 'top' : 'e1');
function goalNow(g) {
  const pts = goalPts(g); if (!pts.length) return null;
  const since = Date.now() - 28 * DAY; const recent = pts.filter(p => p.t >= since);
  return Math.max(...(recent.length ? recent : pts.slice(-1)).map(p => p.v));
}
function goalReached(g) { const tg = goalTarget(g); const hit = goalPts(g).find(p => p.t >= (g.createdAt || 0) - DAY && p.v >= tg - 0.05); return hit ? hit.t : 0; }
function goalStatus(g) {
  const tg = goalTarget(g); const now = goalNow(g); const reached = goalReached(g);
  const days = Math.ceil((+parseYmd(g.by) - +startOfDay(new Date())) / DAY); const weeks = Math.max(0, Math.ceil(days / 7));
  const start = Math.min(+g.start || 0, now || 0);
  const pct = now == null ? 0 : tg > start ? Math.max(0, Math.min(1, (now - start) / (tg - start))) : 1;
  const gap = now == null ? null : tg - now;
  const perWeek = gap != null && gap > 0 && weeks > 0 ? gap / weeks : 0;
  const pj = project(goalPts(g)); const onPace = pj && days > 0 ? pj.keep(days) >= tg - 0.05 : false;
  return { tg, now, reached, days, weeks, pct, gap, perWeek, onPace };
}
function goalLine(g, st) {
  const u = U(); const w = v => fmt(r05(v)) + ' ' + u;
  if (st.reached) return 'Reached on ' + shortDate(st.reached) + '.';
  if (st.now == null) return 'Log this lift to start tracking.';
  if (st.days < 0) return 'The date has passed, ' + w(st.gap) + ' to go. Move the date or keep going.';
  if (st.gap <= 0) return 'You’re there. Your next ' + (g.metric === 'top' ? 'heavy set' : 'workout') + ' makes it official.';
  return 'About +' + w(st.perWeek) + ' a week for ' + st.weeks + ' week' + (st.weeks === 1 ? '' : 's') + (st.onPace ? '. Your recent pace gets there.' : '. Faster than your recent pace.');
}
function GoalsCard() {
  const list = goalList(); if (!list.length) return null;
  return html`<div id="goals-card"><div class="section-h"><h2>Lift goals</h2><button class="btn text" id="goal-add" onClick=${() => openSheet({ type: 'liftGoal' })}>${I.plus} Goal</button></div>
    <div class="stack">${list.map(g => { const st = goalStatus(g); const u = U(); const metricName = g.metric === 'top' ? 'heaviest' : 'est. 1RM';
      return html`<button key=${g.id} class="card goal-card" id=${'goal-' + g.id} onClick=${() => openSheet({ type: 'liftGoal', id: g.id })}>
        <div class="row"><div style="flex:1;min-width:0;text-align:left"><div style="font-weight:700">${exName(g.ex)} · ${fmt(st.tg)} ${u}</div>
          <div class="small muted">${metricName} by ${shortDate(+parseYmd(g.by))}</div></div>
          ${st.reached ? html`<span class="chip on">${I.check} Reached</span>` : html`<div style="text-align:right"><b class="num">${st.now == null ? '–' : fmt(r05(st.now))}</b><div class="small muted">now</div></div>`}</div>
        <div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(st.pct * 100)}><span style=${{ width: Math.round((st.reached ? 1 : st.pct) * 100) + '%' }}></span></div>
        <div class="small muted" style="text-align:left">${goalLine(g, st)}</div></button>`; })}</div>
    <p class="small faint" style="margin-top:6px">Estimates from your logged sets, for planning. Not medical or coaching advice.</p></div>`;
}
/* Lifts you've logged with weight, most recent first */
function goalLifts() {
  const seen = new Map(); const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) for (const it of list[i].items || []) { const k = exKind(it.ex); if (k === 'bodyweight' || k === 'assisted' || isMeasured(k)) continue; if (!seen.has(it.ex) && it.sets.some(x => +x.w > 0 && +x.r > 0)) seen.set(it.ex, list[i].startedAt); }
  return [...seen.keys()];
}
function LiftGoalSheet({ id, ex: ex0 }) {
  const g0 = id ? (S.meta.liftGoals || {})[id] : null; const lifts = goalLifts();
  const [ex, setEx] = useState(g0 ? g0.ex : ex0 || lifts[0] || ''); const [metric, setMetric] = useState(g0 ? g0.metric : 'e1');
  const [tg, setTg] = useState(g0 ? String(goalTarget(g0)) : ''); const [by, setBy] = useState(g0 ? g0.by : ymd(addDays(new Date(), 84)));
  const now = ex ? goalNow({ ex, metric }) : null; const u = U();
  const ok = ex && +tg > 0 && /^\d{4}-\d\d-\d\d$/.test(by);
  const save = () => {
    const gid = id || uid('g');
    commit(st => { st.meta.liftGoals = { ...(st.meta.liftGoals || {}) }; st.meta.liftGoals[gid] = { ...(g0 || {}), id: gid, ex, metric, target: r05(+tg), u, by, start: g0 && g0.ex === ex && g0.metric === metric ? g0.start : (now || 0), createdAt: g0 && g0.ex === ex ? g0.createdAt : Date.now() }; }, 'meta');
    closeSheet(); showToast({ kind: 'info', text: id ? 'Goal updated' : 'Goal set. It shows in Train.' });
  };
  const del = () => { commit(st => { st.meta.liftGoals = { ...(st.meta.liftGoals || {}) }; delete st.meta.liftGoals[id]; }, 'meta'); closeSheet(); };
  return html`<${Sheet} label=${id ? 'Edit goal' : 'New lift goal'}><h2>${id ? 'Edit goal' : 'New lift goal'}</h2>
    ${!lifts.length && !ex ? html`<p class="note">Log a lift with weight first, then set a goal for it.</p><button class="btn wide" style="margin-top:12px" onClick=${closeSheet}>OK</button>` : html`<div class="stack" style="margin-top:10px">
      <div><label class="lbl" for="lg-ex">Lift</label><select class="field" id="lg-ex" value=${ex} onChange=${e => setEx(e.target.value)}>${[...new Set([ex, ...lifts].filter(Boolean))].map(x => html`<option key=${x} value=${x}>${exName(x)}</option>`)}</select></div>
      <div><span class="lbl">Measure by</span><div class="seg wide" role="group" aria-label="Measure by" style="margin-top:6px">${GOAL_METRICS.map(([k, l]) => html`<button key=${k} id=${'lg-m-' + k} class=${metric === k ? 'on' : ''} aria-pressed=${metric === k} onClick=${() => setMetric(k)}>${l}</button>`)}</div>
        <p class="small muted" style="margin-top:4px">${metric === 'e1' ? 'Estimated from any set, so a set of 5 counts too.' : 'The heaviest weight you lift for at least one rep.'}${now != null ? ' Now: ' + fmt(r05(now)) + ' ' + u + '.' : ''}</p></div>
      <div class="row" style="gap:10px"><div style="flex:1"><label class="lbl" for="lg-t">Target (${u})</label><input class="field" id="lg-t" inputmode="decimal" placeholder=${now != null ? String(r05(now * 1.1 / 5) * 5) : ''} value=${tg} onInput=${e => setTg(e.target.value.replace(/[^\d.]/g, ''))}/></div>
        <div style="flex:1"><label class="lbl" for="lg-by">By</label><input class="field" id="lg-by" type="date" value=${by} onInput=${e => setBy(e.target.value)}/></div></div>
      <button class="btn primary wide" id="lg-save" disabled=${!ok} onClick=${save}>${id ? 'Save goal' : 'Set goal'}</button>
      ${id ? html`<button class="btn danger wide" id="lg-del" onClick=${del}>Delete goal</button>` : null}
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div>`}<//>`;
}

/* ---- Month in review ---- */
/* ym = 'YYYY-MM'. Workouts, sets, weight moved, PRs, best session, most improved lift (est. 1RM this month vs. your best
   before it), food days and runs, plus a note you add (meta.monthNotes[ym]). */
const ymOf = t => ymd(t).slice(0, 7);
const ymStart = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1);
const ymAdd = (ym, n) => { const d = ymStart(ym); d.setMonth(d.getMonth() + n); return ymOf(d); };
const ymName = ym => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
function monthStats(ym) {
  const t0 = +ymStart(ym), t1 = +ymStart(ymAdd(ym, 1));
  const all = sessionList(); const ss = all.filter(s => s.startedAt >= t0 && s.startedAt < t1);
  const lifts = ss.filter(s => s.kind !== 'activity'); const runs = ss.filter(s => s.kind === 'activity' || s.routineId === 'run-plan');
  const sets = lifts.reduce((n, s) => n + s.items.reduce((m, it) => m + it.sets.filter(x => +x.r > 0 || +x.t > 0).length, 0), 0);
  const vol = lifts.reduce((n, s) => n + s.items.reduce((m, it) => m + itemVolume(it), 0), 0);
  const prs = lifts.flatMap(s => noE1(s.prs || []).filter(p => typeof p === 'object').map(p => ({ ...p, t: s.startedAt })));
  let best = null; for (const s of lifts) { const sc = noE1(s.prs || []).length * 1e9 + s.items.reduce((m, it) => m + itemVolume(it), 0); if (!best || sc > best.sc) best = { s, sc }; }
  let imp = null; const exs = [...new Set(lifts.flatMap(s => s.items.map(it => it.ex)))];
  for (const ex of exs) { const k = exKind(ex); if (k === 'bodyweight' || k === 'assisted' || isMeasured(k)) continue;
    const pts = seriesFor(ex, undefined, 'e1'); const before = pts.filter(p => p.t < t0), inM = pts.filter(p => p.t >= t0 && p.t < t1);
    if (!before.length || !inM.length) continue; const b = Math.max(...before.map(p => p.v)), m = Math.max(...inM.map(p => p.v)); const gain = (m - b) / b;
    if (gain > 0.004 && (!imp || gain > imp.gain)) imp = { ex, from: b, to: m, gain }; }
  const L = (S.meta.meals && S.meta.meals.log) || {}; const food = Object.keys(L).filter(d => d.slice(0, 7) === ym && L[d].length).length;
  return { ym, n: lifts.length, runs: runs.length, sets, vol, prs, best: best && best.s, imp, food, any: ss.length > 0 || food > 0 };
}
const monthNote = ym => ((S.meta.monthNotes || {})[ym] || '');
function MonthCard() {
  const d = new Date(); if (d.getDate() > 7) return null;
  const ym = ymAdd(ymOf(d), -1); if (lsGet('monthSeen') === ym) return null;
  const st = monthStats(ym); if (!st.n && !st.runs) return null;
  return html`<div class="card month-card" id="month-card"><div class="row"><div style="flex:1;min-width:0"><div class="eyebrow">Month in review</div><div style="font-weight:700">${ymName(ym)}</div>
      <div class="small muted">${st.n} workout${st.n === 1 ? '' : 's'}${st.prs.length ? ' · ' + st.prs.length + ' PR' + (st.prs.length === 1 ? '' : 's') : ''}${st.imp ? ' · ' + exName(st.imp.ex) + ' up ' + Math.round(st.imp.gain * 100) + '%' : ''}</div></div>
      <button class="tip-x" aria-label="Hide" onClick=${() => { lsSet('monthSeen', ym); S.rerender(); }}>${I.x}</button></div>
    <button class="btn primary wide" style="margin-top:10px" id="month-open" onClick=${() => { lsSet('monthSeen', ym); UI.setTab('stats'); UI.setView({ type: 'month', ym }); }}>See your month</button></div>`;
}
function MonthView({ ym }) {
  const cur = ymOf(new Date()); ym = ym || ymAdd(cur, -1); const st = monthStats(ym); const u = U();
  const [note, setNote] = useState(monthNote(ym)); useEffect(() => { setNote(monthNote(ym)); }, [ym]);
  const saveNote = v => commit(x => { x.meta.monthNotes = { ...(x.meta.monthNotes || {}) }; if (v.trim()) x.meta.monthNotes[ym] = v.trim().slice(0, 280); else delete x.meta.monthNotes[ym]; }, 'meta', 600);
  const go = n => UI.setView({ type: 'month', ym: ymAdd(ym, n) });
  const volTxt = st.vol >= 10000 ? fmt(Math.round(st.vol / 100) / 10) + 'k' : fmt(Math.round(st.vol));
  return html`<div id="month-view">
    <div class="row" style="margin-top:6px"><button class="icon-btn" aria-label="Previous month" id="month-prev" onClick=${() => go(-1)}>${I.back || '‹'}</button>
      <div style="flex:1;text-align:center"><div class="eyebrow">Month in review</div><h2 class="wo-title" style="margin:2px 0">${ymName(ym)}</h2></div>
      <button class="icon-btn" aria-label="Next month" id="month-next" disabled=${ym >= cur} onClick=${() => go(1)} style="transform:scaleX(-1)">${I.back || '›'}</button></div>
    ${!st.any ? html`<div class="card note" style="margin-top:12px">Nothing logged in ${ymName(ym)}.</div>` : html`
      <div class="kpis kpis3" style="margin-top:12px">${kpi(st.n, 'Workouts')}${kpi(st.prs.length, 'PRs')}${kpi(st.vol ? volTxt : st.sets, st.vol ? u + ' moved' : 'Sets')}</div>
      <div class="card prl" style="margin-top:10px">
        ${st.best ? html`<div><div><div style="font-weight:600">Best session</div><div class="small muted">${shortDate(st.best.startedAt)}${noE1(st.best.prs || []).length ? ' · ' + noE1(st.best.prs).length + ' PR' + (noE1(st.best.prs).length === 1 ? '' : 's') : ''}</div></div><b>${st.best.name || 'Workout'}</b></div>` : null}
        ${st.imp ? html`<div><div><div style="font-weight:600">Most improved</div><div class="small muted">Est. 1RM ${fmt(r05(st.imp.from))} → ${fmt(r05(st.imp.to))} ${u}</div></div><b>${exName(st.imp.ex)} +${Math.round(st.imp.gain * 100)}%</b></div>` : null}
        <div><div><div style="font-weight:600">Sets</div></div><b class="num">${st.sets}</b></div>
        ${st.runs ? html`<div><div><div style="font-weight:600">Runs and activities</div></div><b class="num">${st.runs}</b></div>` : null}
        <div><div><div style="font-weight:600">Days you logged food</div></div><b class="num">${st.food}</b></div></div>
      ${st.prs.length ? html`<div class="section-h"><h2>PRs</h2></div><div class="card prl">${st.prs.slice(0, 12).map((p, i) => html`<div key=${i}><div style="min-width:0"><div style="font-weight:600">${exName(p.ex)}</div><div class="small muted">${shortDate(p.t)} · ${p.value}</div></div><span class="pr-badge">${I.plate} ${p.label}</span></div>`)}</div>` : null}`}
    <div class="section-h"><h2>Your note</h2></div>
    <textarea class="field" id="month-note" rows="3" maxlength="280" placeholder="What stood out this month?" value=${note} onInput=${e => setNote(e.target.value)} onBlur=${e => saveNote(e.target.value)}></textarea>
    ${st.any ? html`<button class="btn wide" style="margin-top:12px" id="month-share" onClick=${() => shareMonth(ym)}>${I.share || I.copy} Share picture</button>` : null}
  </div>`;
}
function monthImage(ym) {
  const st = monthStats(ym); const css = getComputedStyle(document.documentElement); const c = k => (css.getPropertyValue(k) || '').trim();
  const bg = c('--bg') || '#111', ink = c('--ink') || '#fff', ink2 = c('--ink-2') || '#aaa', acc = c('--accent') || '#2f6fe0', surf = c('--surface') || '#222';
  const font = c('--display') || 'sans-serif', body = getComputedStyle(document.body).fontFamily || 'sans-serif'; const u = U();
  const rows = [];
  if (st.best) rows.push(['Best session', (st.best.name || 'Workout') + ' · ' + shortDate(st.best.startedAt)]);
  if (st.imp) rows.push(['Most improved', exName(st.imp.ex) + ' +' + Math.round(st.imp.gain * 100) + '% (est. 1RM)']);
  if (st.runs) rows.push(['Runs and activities', String(st.runs)]);
  rows.push(['Days you logged food', String(st.food)]);
  const note = monthNote(ym); const W = 1080, H = 420 + rows.length * 96 + (note ? 160 : 0) + 110;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = acc; g.fillRect(0, 0, W, 14);
  g.fillStyle = ink2; g.font = '600 34px ' + body; g.fillText('MONTH IN REVIEW', 64, 100);
  g.fillStyle = ink; g.font = '700 84px ' + font; g.fillText(ymName(ym).toUpperCase(), 64, 190);
  const vol = st.vol >= 10000 ? fmt(Math.round(st.vol / 100) / 10) + 'k' : fmt(Math.round(st.vol));
  [[st.n, 'workouts'], [st.prs.length, 'PRs'], [st.vol ? vol : st.sets, st.vol ? u + ' moved' : 'sets']].forEach(([v, l], i) => { const x = 64 + i * 330; g.fillStyle = surf; roundRect(g, x, 240, 300, 110, 22); g.fill(); g.fillStyle = ink; g.font = '700 50px ' + body; g.fillText(String(v), x + 28, 302); g.fillStyle = ink2; g.font = '500 26px ' + body; g.fillText(l, x + 28, 334); });
  let y = 440;
  for (const [a, b] of rows) { g.fillStyle = ink2; g.font = '500 30px ' + body; g.fillText(a, 64, y); g.fillStyle = ink; g.font = '600 38px ' + body; g.fillText(b.slice(0, 40), 64, y + 44); y += 96; }
  if (note) { g.fillStyle = acc; g.font = 'italic 500 34px ' + body; const words = note.split(/\s+/); let line = '', ly = y + 30, n = 0;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 128 && line) { g.fillText(line, 64, ly); ly += 46; line = w; if (++n >= 2) break; } else line = t; }
    if (n < 3 && line) g.fillText(line, 64, ly); }
  g.fillStyle = ink2; g.font = '600 30px ' + body; g.fillText('IRONWOOD', 64, H - 56);
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}
async function shareMonth(ym) {
  const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
  if (!dl) { showToast({ kind: 'info', text: 'Sharing isn’t available in this view.' }); return; }
  try { const b = await monthImage(ym); await dl.save({ filename: 'ironwood-' + ym + '.png', data: b }); }
  catch (e) { if (!e || e.code !== 'declined') showToast({ kind: 'info', text: 'Couldn’t make the picture here.' }); }
}
/* Stats: entry points */
function StatsExtras() {
  return html`<div class="row" style="gap:8px;margin-top:14px" id="stats-extras">
    <button class="btn" style="flex:1" id="open-month" onClick=${() => UI.setView({ type: 'month', ym: ymAdd(ymOf(new Date()), -1) })}>Month in review</button>
    <button class="btn" style="flex:1" id="open-goal" onClick=${() => openSheet({ type: 'liftGoal' })}>${I.plus} Lift goal</button></div>`;
}
