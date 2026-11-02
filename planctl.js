/* ============ Turn plans off, restart them, and a check-in when a week slips (Nov 2) ============ */
/* Every plan you follow (main program, programs alongside, the running plan) can be turned off or restarted.
   settings.progStart[id]: restart time (earlier workouts no longer count for "next day"). settings.progSince[id]: when
   you started following it. Running plan: run.off, run.done[session id] (done but not logged), and a restart starts a
   new block. When a week has 2 or more planned sessions missed (or a plan was never started), Train asks: did you do
   them, restart, postpone, edit, or turn it off. Answers are kept in settings.checkins[plan:week]. */
function runActive() { const R = typeof runSt === 'function' ? runSt() : null; return R && !R.off && runCtxNow() ? R : null; }
const progStartOf = id => (S.meta.settings.progStart || {})[id] || 0;
function markSince(st, id) { st.meta.settings.progSince = { ...(st.meta.settings.progSince || {}), [id]: Date.now() }; }
function restartProgram(id) {
  const r = getRoutine(id); const before = progStartOf(id);
  commit(st => { st.meta.settings.progStart = { ...(st.meta.settings.progStart || {}), [id]: Date.now() }; markSince(st, id); }, 'meta');
  showToast({ kind: 'info', ms: 7000, text: (r ? r.name : 'Plan') + ' restarts at ' + (r && r.days[0] ? r.days[0].name : 'day 1'), action: 'Undo', fn: () => commit(st => { st.meta.settings.progStart = { ...(st.meta.settings.progStart || {}), [id]: before }; }, 'meta') });
}
function stopPlan(id) {
  if (id === 'run') { runCommit(r => { r.off = true; }); showToast({ kind: 'info', ms: 7000, text: 'Running plan turned off. Turn it back on from Train → Run.', action: 'Undo', fn: () => runCommit(r => { r.off = false; }) }); return; }
  const r = getRoutine(id); const main = programId() === id;
  if (main) { commit(st => { st.meta.settings.program = 'self'; }, 'meta'); showToast({ kind: 'info', ms: 7000, text: 'Stopped following ' + (r ? r.name : 'the plan') + '. You’re on Self-log.', action: 'Undo', fn: () => commit(st => { st.meta.settings.program = id; }, 'meta') }); }
  else { setAddon(id, false); showToast({ kind: 'info', ms: 7000, text: (r ? r.name : 'Plan') + ' removed from Train', action: 'Undo', fn: () => setAddon(id, true) }); }
}
function restartRun(start) {
  runCommit(r => { r.block = (r.block || 1) + 1; r.start = start; r.swaps = {}; r.easy = {}; r.done = {}; r.off = false; });
  if (typeof RUN_SEL !== 'undefined') RUN_SEL.w = 1;
  showToast({ kind: 'info', text: 'Running plan restarts at week 1 on ' + shortDate(parseYmd(start)) });
}
function editPlan(id) {
  closeSheet();
  if (id === 'run') { TRAIN.mode = 'run'; lsSet('trainMode', 'run'); lsSet('runTab', 'plan'); UI.setTab('train'); S.rerender(); scrollTo(0, 0); return; }
  UI.setTab('routines'); UI.setView({ type: 'routine', id });
}

/* ---- missed sessions ---- */
function runMissedLeft(R, w) { const done = R.done || {}; return runMissed(R, w).filter(x => !done[sessId(R, w, x.key)]); }
function runStarted(R) { const b = (R.block || 1) + '-'; return sessionList().some(s => s.run && String(s.run.id || '').startsWith(b)) || Object.keys(R.done || {}).some(k => k.startsWith(b)); }
/* What slipped for one plan: { key, id, name, missed, planned, never, wk, keys } or null */
function slipFor(p) {
  const today = startOfDay(new Date()); const ans = S.meta.settings.checkins || {};
  if (p.key === 'run') {
    const R = runActive(); if (!R) return null; const cur = runWeekOf(R, today); const N = planLen(R);
    for (const w of [cur - 1, cur]) {
      if (w < 1 || w > N) continue; const miss = runMissedLeft(R, w); if (miss.length < 2) continue;
      const key = 'run:' + (R.block || 1) + ':' + w; if (ans[key]) continue;
      return { key, id: 'run', name: 'Running plan', missed: miss.length, planned: planWeek(R, w).length, never: !runStarted(R), wk: w === cur ? 'this week' : 'last week', miss, w };
    }
    return null;
  }
  const since = Math.max(progStartOf(p.key), (S.meta.settings.progSince || {})[p.key] || 0);
  const first = sessionList().find(s => s.routineId === p.key || (s.addons || []).some(a => a.id === p.key));
  const from = since || (first ? first.startedAt : 0); if (!from) return null;
  const ws = startOfWeek(today);
  for (const [a, label] of [[addDays(ws, -7), 'last week'], [ws, 'this week']]) {
    let planned = 0, done = 0;
    for (let i = 0; i < 7; i++) { const d = addDays(a, i); if (d >= today || +d < +startOfDay(new Date(from))) continue; if (p.days.includes(d.getDay())) planned++; if (progDoneOn(p, ymd(d))) done++; }
    const missed = planned - done; if (missed < 2) continue;
    const key = p.key + ':' + ymd(a); if (ans[key]) continue;
    const never = !sessionList().some(s => s.startedAt >= from && (s.routineId === p.key || (s.addons || []).some(x => x.id === p.key)));
    return { key, id: p.key, name: p.name, missed, planned, never, wk: label };
  }
  return null;
}
const answerCheck = (key, a) => commit(st => { st.meta.settings.checkins = { ...(st.meta.settings.checkins || {}), [key]: a }; }, 'meta');
function PlanCheckIn() {
  if (S.active) return null; const slips = planList().map(slipFor).filter(Boolean); if (!slips.length) return null;
  const x = slips[0];
  const unit = x.id === 'run' ? 'run' : 'workout'; const n = x.missed;
  return html`<div class="card check-card" id="plan-check"><div class="row"><div style="flex:1;min-width:0"><div class="eyebrow">Check in · ${x.name}</div>
      <div style="font-weight:700">${x.never ? 'You haven’t started this plan yet' : n + ' ' + unit + (n === 1 ? '' : 's') + ' missed ' + x.wk}</div>
      <div class="small muted">${x.never ? n + ' ' + unit + (n === 1 ? ' was' : 's were') + ' planned so far. Want to start fresh, push it back, or turn it off?' : 'Did you do them without logging, or does the plan need a change?'}</div></div>
      <button class="tip-x" aria-label="Not now" onClick=${() => answerCheck(x.key, 'later')}>${I.x}</button></div>
    <div class="check-acts">
      ${x.never ? null : html`<button class="btn" id="ck-did" onClick=${() => { if (x.id === 'run') runCommit(r => { r.done = r.done || {}; for (const m of x.miss) r.done[sessId(r, x.w, m.key)] = true; }); answerCheck(x.key, 'did'); showToast({ kind: 'info', text: 'Marked as done' }); }}>I did ${n === 1 ? 'it' : 'them'}</button>`}
      <button class="btn" id="ck-restart" onClick=${() => { answerCheck(x.key, 'restart'); if (x.id === 'run') openSheet({ type: 'runRestart' }); else restartProgram(x.id); }}>Restart</button>
      <button class="btn" id="ck-postpone" onClick=${() => { answerCheck(x.key, 'postpone'); if (x.id === 'run') pushPlanBack(); else showToast({ kind: 'info', text: 'OK. Pick up where you left off: next up is still waiting.' }); }}>${x.id === 'run' ? 'Postpone a week' : 'Postpone'}</button>
      <button class="btn" id="ck-edit" onClick=${() => { answerCheck(x.key, 'edit'); editPlan(x.id); }}>Edit</button>
      <button class="btn text danger" id="ck-off" onClick=${() => { answerCheck(x.key, 'off'); stopPlan(x.id); }}>Turn off</button></div></div>`;
}
function RunRestartSheet() {
  const today = ymd(new Date()); const mon = nextMonday();
  return html`<${Sheet} label="Restart the running plan"><h2>Restart the running plan</h2>
    <p class="note">Week 1 starts again with your current times. Runs you already logged stay in your history.</p>
    <div class="stack" style="margin-top:12px"><button class="btn primary wide" id="rr-today" onClick=${() => { closeSheet(); restartRun(today); }}>Start today</button>
      <button class="btn wide" id="rr-monday" onClick=${() => { closeSheet(); restartRun(mon); }}>Start Monday, ${shortDate(parseYmd(mon))}</button>
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* Run tab: the plan's own on/off and restart */
function RunControls() {
  const R = runSt(); if (!R) return null;
  if (R.off) return html`<div class="card" id="run-off" style="margin-top:12px"><div style="font-weight:700">Your running plan is off</div>
    <p class="small muted" style="margin:2px 0 10px">It doesn’t show in Train, Your week or your calendar file. Your times and history are kept.</p>
    <div class="row" style="gap:8px"><button class="btn primary" style="flex:1" id="run-on" onClick=${() => runCommit(r => { r.off = false; })}>Turn it back on</button><button class="btn" style="flex:1" id="run-restart2" onClick=${() => openSheet({ type: 'runRestart' })}>Restart</button></div></div>`;
  return html`<div class="row wrap" style="gap:8px;margin-top:12px" id="run-ctl"><button class="btn text" id="run-restart" onClick=${() => openSheet({ type: 'runRestart' })}>Restart from week 1</button><button class="btn text danger" id="run-stop" onClick=${() => stopPlan('run')}>Turn off the plan</button></div>`;
}
