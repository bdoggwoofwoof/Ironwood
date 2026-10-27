/* ============ Programs together ============ */
/* Follow one main program and add others alongside it (joint care, conditioning, any plan or routine); the running plan
   shows too. Train lists what each one has next, and an add-on's day can be started on its own or added to the main
   workout. settings.addons: [routine id]. A workout records the add-on days it included (session.addons: [{ id, dayId }]),
   so each add-on moves on to its next day. */
const addonIds = () => (S.meta.settings.addons || []).filter(id => id !== programId() && getRoutine(id));
function setAddon(id, on) {
  commit(st => { const a = new Set(st.meta.settings.addons || []); if (on) a.add(id); else a.delete(id); st.meta.settings.addons = [...a]; }, 'meta');
}
function nextFor(r) {
  const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) { const s = list[i];
    const hit = s.routineId === r.id ? s.dayId : ((s.addons || []).find(a => a.id === r.id) || {}).dayId;
    if (!hit) continue; const idx = r.days.findIndex(d => d.id === hit); return { day: r.days[(idx + 1) % r.days.length], last: s }; }
  return { day: r.days[0], last: null };
}
const doneToday = id => sessionList().some(s => ymd(s.startedAt) === ymd(new Date()) && (s.routineId === id || (s.addons || []).some(a => a.id === id)));
/* Add an add-on day to the workout in progress (or start the main day with it) */
function addDayToWorkout(r, day) {
  const a = S.active; if (!a) return;
  const base = a.items.length;
  day.items.forEach((x, i) => { const occ = a.items.filter(y => y.ex === x.ex && (y.group || '') === (x.group || '')).length; const it = makeSlot(x, occ); if (i === 0) it.ss = false; a.items.push(it); });
  a.addons = (a.addons || []).concat([{ id: r.id, dayId: day.id }]);
  if (day.timer && !a.timer) a.timer = clone(day.timer);
  touch(); showToast({ kind: 'info', text: r.name + ' · ' + day.name + ' added' });
  setTimeout(() => { const el = document.querySelectorAll('.slot')[base]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
}
function startTogether(main, mainDay, r, day) { startWorkout(main, mainDay); if (S.active && S.active.dayId === mainDay.id) addDayToWorkout(r, day); }
const shortName = r => r.name.replace(/ Care$/, '');
/* Train: what else is on your plate */
function AlsoToday({ nx, quiet }) {
  const ids = addonIds(); const R = typeof runSt === 'function' ? runSt() : null;
  /* The running plan always shows once it's set up: today's run, or the next one */
  const run = R && runCtxNow() ? (() => { const n = planLen(R); const today = startOfDay(new Date());
    for (let i = 0; i < 21; i++) { const day = addDays(today, i); const w = runWeekOf(R, day); if (w < 1 || w > n) continue;
      const due = planWeek(R, w).filter(x => ymd(sessDate(R, w, x.dow)) === ymd(day)); const x = due.find(y => !runLogged(R, w, y.key).length) || (i === 0 ? due[0] : null);
      if (x) return { w, x, i, day, done: !!runLogged(R, w, x.key).length }; }
    return runWeekOf(R, today) > n ? { finished: true } : null; })() : null;
  if (!ids.length && !run) return quiet ? null : html`<button class="btn ghost wide" id="add-alongside" style="margin-top:12px" onClick=${() => openSheet({ type: 'addons' })}>${I.plus} Add joint care, conditioning, running or another plan alongside</button>`;
  const openRun = () => { TRAIN.mode = 'run'; lsSet('trainMode', 'run'); S.rerender(); scrollTo(0, 0); };
  const when = i => html`<span class=${'chip' + (i === 0 ? ' on' : '')}>${whenText(i)}</span>`;
  return html`<div id="also-today"><div class="section-h"><h2>Also on your plan</h2><button class="btn text" id="edit-addons" onClick=${() => openSheet({ type: 'addons' })}>Edit</button></div>
    <div class="stack">
    ${run && run.finished ? html`<div class="also-card" id="also-run"><div class="also-h"><span class="eyebrow">Running plan</span></div><div class="also-t">All weeks done</div><div class="also-s">Start the next block from Train → Run.</div><div class="row" style="margin-top:8px"><button class="btn" style="flex:1" onClick=${openRun}>Open the running plan</button></div></div>` : null}
    ${run && !run.finished ? html`<div class="also-card" id="also-run"><div class="also-h"><span class="eyebrow">Running plan · week ${run.w}</span>${run.done ? html`<span class="chip on">Done today</span>` : when(run.i)}</div>
      <div class="also-t">${run.x.name} · ${run.x.s.t}</div><div class="also-s">${run.i > 0 ? shortDate(run.day) + ' · ' : ''}${run.x.s.items.filter(i => i.log).map(i => i.k).join(' · ')}</div>
      <div class="row" style="margin-top:8px"><button class=${'btn' + (run.i === 0 && !run.done ? ' primary' : '')} style="flex:1" id="also-run-start" onClick=${() => startRunSession(run.w, run.x.key)}>${run.done ? 'Run again' : run.i === 0 ? 'Start run' : 'Start it early'}</button>
        <button class="btn text" onClick=${openRun}>Plan</button></div></div>` : null}
    ${ids.map(id => { const r = getRoutine(id); const n = nextFor(r); const done = doneToday(id); const tag = r.info && r.info.care ? 'Joint care' : r.info && r.info.fight ? 'Fight training' : r.info ? 'Conditioning' : (r.meta || 'Plan'); const nxt = nextPlanned(schedFor(id, r));
      return html`<div key=${id} class="also-card" id=${'also-' + id}><div class="also-h"><span class="eyebrow">${tag}</span>${done ? html`<span class="chip on">Done today</span>` : when(nxt)}</div>
        <div class="also-t">${r.name}${r.days.length > 1 ? ' · ' + n.day.name : ''}</div>
        <div class="also-s">${n.day.items.slice(0, 4).map(it => exName(it.ex)).join(' · ')}${n.day.items.length > 4 ? ' +' + (n.day.items.length - 4) : ''}</div>
        <div class="row wrap" style="margin-top:8px;gap:8px">
          ${nx ? html`<button class=${'btn' + (done || nxt !== 0 ? '' : ' primary')} style="flex:2" id=${'also-add-' + id} onClick=${() => startTogether(nx.routine, nx.day, r, n.day)}>Add to ${nx.day.name.split(/\s+[-–]\s+/)[0]}</button>` : null}
          <button class=${'btn' + (nx || done || nxt !== 0 ? '' : ' primary')} style="flex:1" id=${'also-start-' + id} onClick=${() => startWorkout(r, n.day)}>On its own</button></div></div>`; })}
    </div></div>`;
}
/* During a workout: add an add-on's next day */
function WorkoutAddons({ a }) {
  const ids = addonIds().filter(id => id !== a.routineId && !(a.addons || []).some(x => x.id === id)); if (!ids.length) return null;
  return html`<div class="wo-addons" id="wo-addons"><span class="lbl">Add from your other programs</span><div class="row wrap" style="gap:8px;margin-top:6px">${ids.map(id => { const r = getRoutine(id); const n = nextFor(r);
    return html`<button key=${id} class="btn" id=${'wo-add-' + id} onClick=${() => addDayToWorkout(r, n.day)}>${I.plus} ${shortName(r)}${r.days.length > 1 ? ' · ' + n.day.name.split(':')[0] : ''}</button>`; })}</div></div>`;
}
/* Pick the programs that sit alongside the main one */
function AddonsSheet() {
  const pid = programId(); const on = new Set(addonIds()); const R = typeof runSt === 'function' ? runSt() : null;
  const all = [...myRoutines(), ...libRoutines()].filter(r => r.id !== pid && r.days.length);
  const groups = [['Joint care', all.filter(r => r.info && r.info.care)], ['Fight training', all.filter(r => r.info && r.info.fight)], ['Conditioning', all.filter(r => r.info && !r.info.care && !r.info.fight)], ['Made by you', all.filter(r => !r.info && r.source !== 'builtin')], ['Other plans', all.filter(r => !r.info && r.source === 'builtin' && r.days.length > 1)]];
  const row = r => html`<button key=${r.id} class=${'opt' + (on.has(r.id) ? ' on' : '')} id=${'addon-' + r.id} aria-pressed=${on.has(r.id)} onClick=${() => setAddon(r.id, !on.has(r.id))}><div style="flex:1;min-width:0"><div>${r.name}</div><div class="d">${r.days.length > 1 ? r.days.length + ' days · ' : ''}${r.meta || r.days[0].items.length + ' exercises'}</div></div>${on.has(r.id) ? I.check : html`<span class="small muted">Add</span>`}</button>`;
  return html`<${Sheet} label="Programs alongside"><h2>Programs alongside</h2>
    <p class="note">${pid && pid !== 'self' ? 'Your main program stays ' + (getRoutine(pid) || {}).name + '. ' : ''}Add others and Train shows what each has next. Add a day to your main workout or do it on its own.</p>
    <div class="opt" style="cursor:default" id="addon-run"><div style="flex:1"><div>Running plan</div><div class="d">${R && runCtxNow() ? 'On · ' + R.runs + ' run' + (R.runs === 1 ? '' : 's') + ' a week, ' + planLen(R) + ' weeks. Its runs show in Train and Your week.' : 'Off. Set it up in Train → Run with your 100 m, mile and 3 mile times.'}</div></div>${R && runCtxNow() ? html`<span class="chip on">${I.check} On</span>` : html`<button class="btn text" onClick=${() => { closeSheet(); TRAIN.mode = 'run'; lsSet('trainMode', 'run'); UI.setTab('train'); S.rerender(); }}>Set up</button>`}</div>
    ${groups.filter(g => g[1].length).map(([t, rs]) => html`<div key=${t}><div class="eyebrow" style="margin:16px 0 2px">${t}</div>${rs.map(row)}</div>`)}
    <button class="btn primary wide" style="margin-top:14px" onClick=${closeSheet}>Done</button><//>`;
}
