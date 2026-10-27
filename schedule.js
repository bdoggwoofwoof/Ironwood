/* ============ Your week: programs together on a weekly schedule ============ */
/* Each program you follow gets weekdays: the main program, every program alongside it, and the running plan (whose days
   come from the plan itself). Train shows the week as a small grid, the week strip gets one dot per program on each day
   (two dots on a doubled-up day, filled once done), and the whole schedule can be saved as a calendar file (.ics) for
   Apple, Google, Microsoft Outlook or Proton Calendar. Saved in settings.sched: { routine id: [weekday 0–6] } and
   settings.cal: { routine id or 'run': { at: 'HH:MM', min } }. Nothing leaves the phone unless you share the file. */
const PLAN_COLORS = ['var(--accent)', '#e8833a', '#2fa36b', '#9b6bd6', '#d6577a', '#3a9fd6', '#c9a227'];
const DEF_DAYS = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
function progTag(r) { return r.info && r.info.care ? 'Care' : r.info && r.info.fight ? 'Fight' : r.info ? 'Cond' : 'Lift'; }
function progDaysPerWeek(r) { const m = String(r.meta || '').match(/(\d)(?:\s*[–-]\s*\d)?\s*(?:days|times) a week/); return m ? +m[1] : Math.min(7, r.days.length > 1 ? r.days.length : 3); }
function schedFor(id, r) {
  const s = (S.meta.settings.sched || {})[id]; if (Array.isArray(s)) return s.slice().sort();
  const n = progDaysPerWeek(r || getRoutine(id) || { days: [] }); return (DEF_DAYS[n] || DEF_DAYS[3]).slice();
}
function toggleSched(id, dow) {
  const cur = new Set(schedFor(id)); if (cur.has(dow)) cur.delete(dow); else cur.add(dow);
  commit(st => { st.meta.settings.sched = { ...(st.meta.settings.sched || {}), [id]: [...cur].sort() }; }, 'meta');
}
/* The running plan's days this week (or the next week of the plan) */
function runPlanInfo() {
  const R = typeof runSt === 'function' ? runSt() : null; if (!R || !runCtxNow()) return null;
  const n = planLen(R); let w = runWeekOf(R, new Date()); if (w > n) return { R, done: true, w, ws: [] };
  const wk = Math.max(1, w); const ws = planWeek(R, wk);
  return { R, w, wk, n, ws, days: [...new Set(ws.map(x => x.dow))].sort() };
}
/* Everything you follow, in order: main program, programs alongside, running plan */
function planList() {
  const out = []; const main = programRoutine();
  if (main) out.push({ key: main.id, r: main, name: main.name, tag: 'Lift', role: 'Main program', days: schedFor(main.id, main) });
  for (const id of addonIds()) { const r = getRoutine(id); out.push({ key: id, r, name: r.name, tag: progTag(r), role: 'Alongside', days: schedFor(id, r) }); }
  const run = runPlanInfo();
  if (run && !run.done) out.push({ key: 'run', run, name: 'Running plan', tag: 'Run', role: 'Week ' + run.wk + ' of ' + run.n + (run.w < 1 ? ', starts ' + shortDate(parseYmd(run.R.start)) : ''), days: run.days });
  out.forEach((p, i) => { p.color = PLAN_COLORS[i % PLAN_COLORS.length]; });
  return out;
}
/* Did this program get trained on date k? */
function progDoneOn(p, k) {
  return sessionList().some(s => ymd(s.startedAt) === k && (p.key === 'run' ? !!s.run || (s.kind === 'activity' && s.activity === 'run') : s.routineId === p.key || (s.addons || []).some(a => a.id === p.key)));
}
/* Dots under a day in the week strip: one per program planned that weekday, filled when done */
function DayDots({ dow, k }) {
  const ps = planList().filter(p => p.days.includes(dow)); if (!ps.length) return null;
  return html`<span class="wd-dots" aria-hidden="true">${ps.slice(0, 4).map(p => html`<span key=${p.key} class=${'wd-dot' + (progDoneOn(p, k) ? ' done' : '')} style=${{ '--c': p.color }}></span>`)}</span>`;
}
const dotsLabel = dow => { const ps = planList().filter(p => p.days.includes(dow)); return ps.length ? ', planned: ' + ps.map(p => p.tag).join(' and ') : ''; };
/* Train: the week at a glance, editable */
function PlanWeekCard() {
  const ps = planList(); if (!ps.length) return null;
  const today = new Date().getDay(); const ws = startOfWeek(new Date());
  const doubled = WEEK_ORDER.filter(d => ps.filter(p => p.days.includes(d)).length > 1);
  return html`<div class="card plan-week" id="plan-week">
    <div class="row" style="align-items:baseline"><span style="font-weight:700;flex:1">Your week</span><button class="btn text" id="plan-add" onClick=${() => openSheet({ type: 'addons' })}>${I.plus} Program</button><button class="btn text" id="plan-cal" onClick=${() => openSheet({ type: 'calendar' })}>${I.cal || I.timer} Calendar</button></div>
    <div class="pw-grid" role="table" aria-label="Weekly schedule">
      <div class="pw-row pw-head" role="row">${WEEK_ORDER.map(d => html`<span key=${d} role="columnheader" class=${d === today ? 'today' : ''}>${'SMTWTFS'[d]}</span>`)}</div>
      ${ps.map(p => html`<div key=${p.key} class="pw-row" role="row" id=${'pw-' + p.key}>
        <span class="pw-name" role="rowheader"><i style=${{ background: p.color }}></i><span><b>${p.name}</b><small>${p.role} · ${p.days.length}×</small></span></span>
        ${WEEK_ORDER.map(d => { const on = p.days.includes(d); const k = ymd(addDays(ws, (d + 6) % 7)); const done = on && progDoneOn(p, k);
          return html`<button key=${d} role="cell" class=${'pw-cell' + (on ? ' on' : '') + (done ? ' done' : '') + (d === today ? ' today' : '')} style=${{ '--c': p.color }} id=${'pw-' + p.key + '-' + d}
            aria-label=${p.name + ', ' + DOW_FULL[d] + (on ? ', planned' : ', not planned') + (done ? ', done' : '')} aria-pressed=${on}
            onClick=${() => p.key === 'run' ? openSheet({ type: 'runDay', dow: d }) : toggleSched(p.key, d)}>${on ? (done ? I.check : p.tag[0]) : ''}</button>`; })}</div>`)}
    </div>
    <p class="small muted" style="margin-top:8px">${doubled.length ? html`<b>Doubled up:</b> ${doubled.map(d => DOW[d] + ' (' + ps.filter(p => p.days.includes(d)).map(p => p.tag).join(' + ') + ')').join(', ')}. ` : ''}Tap a day to plan it or clear it.${ps.some(p => p.key === 'run') ? ' Run days come from the running plan; tapping one opens it.' : ''}</p></div>`;
}
/* Next planned weekday on or after today (0 = today) */
function nextPlanned(days) { const t = new Date().getDay(); for (let i = 0; i < 7; i++) if (days.includes((t + i) % 7)) return i; return -1; }
const whenText = i => i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : i > 1 ? DOW_FULL[(new Date().getDay() + i) % 7] : 'Not scheduled';

/* ---- Calendar file (.ics) ---- */
const CAL_DEF = { Lift: ['17:30', 60], Care: ['07:00', 20], Cond: ['17:30', 30], Fight: ['18:00', 45], Run: ['07:00', 45] };
function calFor(p) { const c = (S.meta.settings.cal || {})[p.key]; const d = CAL_DEF[p.tag] || ['17:30', 45]; return { at: c && c.at || d[0], min: c && +c.min || d[1] }; }
const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => '\\' + m);
const icsFold = l => { const out = []; let s = l; while (s.length > 60) { out.push(s.slice(0, 60)); s = ' ' + s.slice(60); } out.push(s); return out.join('\r\n'); };
const icsStamp = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
function icsTime(day, at, addMin) { const [h, m] = at.split(':').map(Number); const d = new Date(day); d.setHours(h, m + (addMin || 0), 0, 0); return icsStamp(d) + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00'; }
/* Events for the next `weeks` weeks: each program on its days, with the day it will be on (rotation predicted from now) */
function planEvents(weeks, keys) {
  const out = []; const start = startOfDay(new Date()); const ps = planList().filter(p => !keys || keys.includes(p.key));
  for (const p of ps) {
    const c = calFor(p); let rot = p.r ? nextFor(p.r) : null; let idx = rot && p.r.days.length ? p.r.days.findIndex(d => d.id === rot.day.id) : 0;
    for (let i = 0; i < weeks * 7; i++) {
      const day = addDays(start, i); const dow = day.getDay(); let title = '', desc = '';
      if (p.key === 'run') {
        const R = p.run.R; const w = runWeekOf(R, day); if (w < 1 || w > planLen(R)) continue;
        const x = planWeek(R, w).find(y => y.dow === dow); if (!x) continue;
        title = x.name + ' · ' + x.s.t + ' (week ' + w + ')'; desc = x.s.items.map(it => it.k + ': ' + it.d + (it.r ? ' (' + it.r + ')' : '')).join('\n');
      } else {
        if (!p.days.includes(dow)) continue;
        const d = p.r.days[idx % p.r.days.length]; idx++;
        title = p.name + (p.r.days.length > 1 ? ': ' + d.name : ''); desc = d.items.map(it => exName(it.ex) + ' · ' + it.sets + ' × ' + (it.reps || (it.tg && it.tg.dur ? it.tg.dur + ' s' : ''))).join('\n');
      }
      out.push({ uid: 'ironwood-' + p.key + '-' + icsStamp(day) + '@ironwood', day, at: c.at, min: c.min, title, desc });
    }
  }
  return out.sort((a, b) => a.day - b.day || a.at.localeCompare(b.at));
}
function buildIcs(evts, alarm) {
  const now = new Date(); const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ironwood//Training plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Ironwood training'];
  for (const e of evts) {
    L.push('BEGIN:VEVENT', 'UID:' + e.uid, 'DTSTAMP:' + stamp, 'DTSTART:' + icsTime(e.day, e.at), 'DTEND:' + icsTime(e.day, e.at, e.min), 'SUMMARY:' + icsEsc('Ironwood · ' + e.title), 'DESCRIPTION:' + icsEsc(e.desc + '\n\nPlanned in Ironwood. Estimates, not medical or coaching advice.'), 'CATEGORIES:Training');
    if (alarm) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:-PT30M', 'END:VALARM');
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
async function saveIcs(evts, alarm) {
  const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
  if (!dl) { showToast({ kind: 'info', text: 'Saving files isn’t available in this view.' }); return false; }
  try { await dl.save({ filename: 'ironwood-plan.ics', data: new Blob([buildIcs(evts, alarm)], { type: 'text/calendar' }) }); return true; }
  catch (e) { if (!e || e.code !== 'declined') showToast({ kind: 'info', text: 'Couldn’t save the calendar file here.' }); return false; }
}
function CalendarSheet() {
  const ps = planList(); const [weeks, setWeeks] = useState(4); const [alarm, setAlarm] = useState(true); const [off, setOff] = useState({}); const [done, setDone] = useState(false);
  const keys = ps.filter(p => !off[p.key]).map(p => p.key); const evts = planEvents(weeks, keys);
  const setCal = (p, f, v) => commit(st => { const c = st.meta.settings.cal = { ...(st.meta.settings.cal || {}) }; c[p.key] = { ...calFor(p), ...(c[p.key] || {}), [f]: v }; }, 'meta', 600);
  return html`<${Sheet} label="Add to calendar"><h2>Add to your calendar</h2>
    <p class="note">Saves a calendar file with each planned workout for the next weeks. Open it in Apple, Google, Microsoft Outlook or Proton Calendar. The calendar doesn’t update by itself: save a new file when your plan changes.</p>
    <div class="stack" style="gap:10px;margin-top:12px">${ps.map(p => { const c = calFor(p); return html`<div key=${p.key} class="cal-row" id=${'cal-' + p.key}>
      <label class="toggle"><input type="checkbox" checked=${!off[p.key]} onChange=${e => setOff({ ...off, [p.key]: !e.target.checked })}/><i style=${{ background: p.color }} class="cal-dot"></i><b>${p.name}</b></label>
      <div class="row" style="gap:8px;margin-top:6px"><input type="time" class="field" aria-label=${p.name + ' start time'} value=${c.at} onChange=${e => e.target.value && setCal(p, 'at', e.target.value)} style="flex:1"/>
        <select class="field mini-select" aria-label=${p.name + ' length'} value=${String(c.min)} onChange=${e => setCal(p, 'min', +e.target.value)}>${[15, 20, 30, 45, 60, 75, 90].map(m => html`<option value=${String(m)}>${m} min</option>`)}</select></div></div>`; })}</div>
    <div style="margin-top:12px"><span class="lbl">How far ahead</span><div class="seg" role="group" aria-label="Weeks" style="margin-top:6px">${[2, 4, 8, 12].map(w => html`<button key=${w} id=${'cal-w' + w} class=${weeks === w ? 'on' : ''} aria-pressed=${weeks === w} onClick=${() => setWeeks(w)}>${w} wk</button>`)}</div></div>
    <label class="toggle-row" for="cal-alarm" style="margin-top:8px"><span><span>Reminder 30 minutes before</span></span><input type="checkbox" role="switch" id="cal-alarm" checked=${alarm} onChange=${e => setAlarm(e.target.checked)}/></label>
    <button class="btn primary wide" id="cal-save" style="margin-top:12px" disabled=${!evts.length} onClick=${async () => { if (await saveIcs(evts, alarm)) setDone(true); }}>Save ${evts.length} workout${evts.length === 1 ? '' : 's'} as a calendar file</button>
    ${done ? html`<div class="card" style="margin-top:12px" id="cal-help"><span class="lbl">Next, in your calendar app</span><ul class="run-ul">
      <li><b>Apple Calendar:</b> tap the file in the share sheet or Files, then Add All.</li>
      <li><b>Google Calendar:</b> on a computer, Settings → Import & export → Import, and choose the file.</li>
      <li><b>Microsoft Outlook:</b> Add calendar → Upload from file.</li>
      <li><b>Proton Calendar:</b> Settings → Import, and choose the file.</li></ul>
      <p class="small muted" style="margin-top:6px">Tip: import into its own calendar (say, “Training”) so you can replace it in one step next time.</p></div>` : null}<//>`;
}
