/* ---------- Program you follow, Train / History ---------- */
/* settings.program: a routine id, 'self' (log your own workouts), or unset (asks). Someone who logged a routine
   workout before this setting existed keeps following the routine they used last. */
function programId() {
  const p = S.meta.settings.program; if (p) return p;
  const list = sessionList(); for (let i = list.length - 1; i >= 0; i--) if (list[i].routineId && getRoutine(list[i].routineId)) return list[i].routineId;
  return null;
}
const programRoutine = () => { const p = programId(); return p && p !== 'self' ? getRoutine(p) : null; };
function nextUp() {
  const r = programRoutine(); if (!r || !r.days.length) return null;
  const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) { const s = list[i]; if (s.routineId !== r.id) continue; const idx = r.days.findIndex(d => d.id === s.dayId); return { routine: r, day: r.days[(idx + 1) % r.days.length], last: s }; }
  return { routine: r, day: r.days[0], last: null };
}
const setProgram = id => { commit(st => { st.meta.settings.program = id; }, 'meta'); };
/* Dismissable explanations. Hidden ones come back from Help → Show tips again. */
const tipOff = id => !!((S.meta.settings.tipsOff || {})[id]);
function Tip({ id, children, style }) {
  if (tipOff(id)) return null;
  return html`<div class="tip-card" style=${style}><div style="flex:1;min-width:0">${children}</div><button class="tip-x" aria-label="Hide this tip" onClick=${() => commit(st => { st.meta.settings.tipsOff = { ...(st.meta.settings.tipsOff || {}), [id]: 1 }; }, 'meta')}>${I.x}</button></div>`;
}
function TopSwitch({ value, options, onChange }) {
  return html`<div class="topsw" role="tablist">${options.map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${value === k} class=${value === k ? 'on' : ''} onClick=${() => onChange(k)}>${l}</button>`)}</div>`;
}
const TRAIN = { mode: lsGet('trainMode') === 'history' ? 'history' : 'train' };
function TrainSwitch() {
  const pick = m => { TRAIN.mode = m; lsSet('trainMode', m); S.rerender(); scrollTo(0, 0); };
  return html`<div><${TopSwitch} value=${TRAIN.mode} options=${[['train', 'Train'], ['history', 'History']]} onChange=${pick}/>
    ${TRAIN.mode === 'history' ? html`<div><p class=${'sync-line sync ' + S.sync}><i></i>${SYNC_TEXT[S.sync]}</p><${LogScreen}/></div>` : html`<${TrainHome}/>`}</div>`;
}
function TrainHome() {
  const nx = nextUp(); const ws = weekStats(); const routine = nx && nx.routine; const now = new Date(); const pid = programId();
  const chs = Object.values(S.meta.challenges || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const newCh = () => UI.setView({ type: 'chEdit', draft: newChallenge(), isNew: true });
  const weekTxt = ws.thisReq === 0 ? 'Streak paused this week' : ws.thisCount + ' of ' + ws.thisReq + ' workouts' + (ws.thisExc ? ' (' + ws.thisExc + ' excused)' : '') + (ws.cur ? ' · ' + ws.cur + '-week streak' : '');
  const actBtn = html`<button class="btn ghost wide" id="log-activity" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log another activity</button>`;
  const pickBtn = (label, cls) => html`<button class=${cls || 'btn primary wide'} onClick=${() => openSheet({ type: 'program' })}>${label}</button>`;
  return html`<div class="today">
    <div class="eyebrow" style="margin-top:4px">${DOW_FULL[now.getDay()]} · ${MON[now.getMonth()]} ${now.getDate()}</div>
    <div class="section-h" style="margin-top:14px"><h2>This week</h2><span class="aside num">${weekTxt}</span></div>
    <${WeekStrip}/>
    <${Tip} id="week" style="margin-top:10px">Tap a day to mark rest, sick, injured or break, or to log an activity on that day.<//>
    ${window.claude && window.claude.standalone && !Object.keys(S.sessions).length && !Object.keys(S.meta.routines).length && lsGet('restoreHint') !== 'off' ? html`<div class="card stack" style="margin-top:14px" id="restore-hint">
      <div style="font-weight:700">Moving from another phone or the Claude version?</div>
      <p class="note">Restore your backup file to bring back your workouts, routines and settings. Restore a photos backup the same way.</p>
      <div class="row"><button class="btn primary" onClick=${() => openSheet({ type: 'restore' })}>Restore a backup</button><button class="btn text" onClick=${() => { lsSet('restoreHint', 'off'); S.rerender(); }}>Not now</button></div></div>` : null}
    ${chs.length ? html`<div class="section-h"><h2>Challenges</h2><button class="btn text" onClick=${newCh}>New</button></div>
      <div class="stack">${chs.map(ch => html`<${ChallengeCard} key=${ch.id} ch=${ch}/>`)}</div>` : null}
    ${nx ? html`
      <div class="section-h"><h2>Up next</h2><span class="aside">${nx.last ? 'Last: ' + dayLabel({ name: nx.last.name }) : 'First workout'}</span></div>
      <div class="next-card">
        <div><div class="row" style="gap:8px"><div class="eyebrow" style="flex:1;min-width:0">${routine.name}</div><button class="btn text" style="min-height:28px;padding:0" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Change</button></div><h2>${nx.day.name}</h2></div>
        <div class="next-list">${nx.day.items.map(it => html`<div key=${it.id} class=${it.ss ? 'ssl' : ''}>${exName(it.ex)}<span class="faint"> · ${it.sets} × ${it.reps || ''}</span>${it.group ? ' · ' + (RANGE_NAME[it.group] && (it.group === '1RM' || it.group === 'Max') ? RANGE_NAME[it.group] : it.group) : ''}</div>`)}</div>
        <button class="btn primary wide" onClick=${() => startWorkout(routine, nx.day)}>Start ${nx.day.name.split(/\s+[-–]\s+/)[0]}</button>
      </div>
      ${routine.days.length > 1 ? html`<div class="section-h"><h2>Or pick a day</h2><button class="btn text" onClick=${() => { UI.setTab('routines'); }}>All routines</button></div>` : html`<div style="height:12px"></div>`}
      <div class="stack">${routine.days.filter(d => d.id !== nx.day.id).map(d => html`<button key=${d.id} class="day-btn" onClick=${() => startWorkout(routine, d)}>
        <div><div class="t">${d.name}</div><div class="s">${d.items.length} exercises</div></div><span class="go">Start</span></button>`)}
        <button class="btn ghost wide" onClick=${() => startWorkout(null, null)}>${I.plus} Empty workout</button>${actBtn}</div>`
    : pid === 'self' ? html`
      <div class="section-h"><h2>Self-log</h2><button class="btn text" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Follow a program</button></div>
      <div class="next-card"><h2>Log your own workout</h2><p class="note">Start an empty workout and add exercises as you go. Weights carry over from last time.</p>
        <button class="btn primary wide" onClick=${() => startWorkout(null, null)}>${I.plus} Start a workout</button></div>
      <div class="stack" style="margin-top:10px"><button class="btn wide" onClick=${() => UI.setTab('routines')}>Start a saved routine</button>${actBtn}</div>`
    : html`
      <div class="section-h"><h2>Get started</h2></div>
      <div class="next-card" id="get-started"><h2>Pick how you train</h2><p class="note">Follow a program and Ironwood lines up the next day for you, or self-log whatever you do.</p>
        ${pickBtn('Create or select a program')}</div>
      <div class="stack" style="margin-top:10px">${actBtn}</div>`}
    <div class="row" style="margin-top:12px">
      <button class="btn" style="flex:1" onClick=${() => UI.setView({ type: 'timer' })}>${I.timer} Interval timer</button>
      ${chs.length ? null : html`<button class="btn" style="flex:1" onClick=${newCh}>${I.check} Start a challenge</button>`}
    </div>
  </div>`;
}
function ProgramSheet() {
  const cur = programId(); const all = allRoutines();
  const plans = all.filter(r => r.days.length > 1), singles = all.filter(r => r.days.length === 1);
  const choose = id => { setProgram(id); closeSheet(); TRAIN.mode = 'train'; UI.setTab('train'); showToast({ kind: 'info', text: id === 'self' ? 'Self-log it is' : 'Following ' + getRoutine(id).name }); };
  const row = r => html`<button key=${r.id} class=${'opt' + (cur === r.id ? ' on' : '')} onClick=${() => choose(r.id)}><div style="flex:1;min-width:0"><div>${r.name}</div><div class="d">${r.days.length > 1 ? r.days.length + ' days · ' + r.days.map(dayLabel).join(', ') : r.days[0].items.length + ' exercises'}</div></div>${cur === r.id ? I.check : null}</button>`;
  const create = () => { closeSheet(); UI.setTab('routines'); UI.setView({ type: 'edit', draft: { id: uid('r'), name: '', source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: 'Day 1', items: [] }, { id: uid('d'), name: 'Day 2', items: [] }] }, isNew: true, follow: true }); };
  return html`<${Sheet} label="Choose a program"><h2>Choose a program</h2>
    <p class="note" style="margin-bottom:6px">Train shows the next day of the program you pick. You can change it any time.</p>
    <button class=${'opt' + (cur === 'self' ? ' on' : '')} id="pick-self" onClick=${() => choose('self')}><div style="flex:1"><div>Self-log</div><div class="d">No program. Start an empty workout and add exercises as you go.</div></div>${cur === 'self' ? I.check : null}</button>
    <button class="opt" onClick=${create}><div style="flex:1"><div>${I.plus} Create a new program</div><div class="d">Build your own days and exercises.</div></div></button>
    <div class="eyebrow" style="margin:16px 0 2px">Plans</div>${plans.map(row)}
    ${singles.length ? html`<div class="eyebrow" style="margin:16px 0 2px">Single workouts</div>${singles.map(row)}` : null}<//>`;
}
/* ---------- Help, tour, feedback ---------- */
const ERRS = []; addEventListener('error', e => { ERRS.push(String(e.message || e.error || 'error').slice(0, 200)); if (ERRS.length > 5) ERRS.shift(); });
addEventListener('unhandledrejection', e => { ERRS.push(('Promise: ' + (e.reason && (e.reason.message || e.reason))).slice(0, 200)); if (ERRS.length > 5) ERRS.shift(); });
const SUPPORT = 'https://github.com/bdoggwoofwoof/ironwood/issues';
function HelpFoot() { return html`<div class="help-foot"><button class="btn text" id="help-btn" onClick=${() => openSheet({ type: 'help' })}><span class="help-q" aria-hidden="true">?</span> Help</button></div>`; }
function HelpSheet() {
  const hidden = Object.keys(S.meta.settings.tipsOff || {}).length;
  return html`<${Sheet} label="Help"><h2>Help</h2>
    <button class="opt" id="help-tour" onClick=${() => openSheet({ type: 'tour', step: 0 })}><div style="flex:1"><div>Take the tour</div><div class="d">A quick walk through each page.</div></div></button>
    <button class="opt" id="help-feedback" onClick=${() => openSheet({ type: 'feedback' })}><div style="flex:1"><div>Send feedback</div><div class="d">Something went wrong, or you have an idea.</div></div></button>
    ${hidden ? html`<button class="opt" onClick=${() => { commit(st => { st.meta.settings.tipsOff = {}; }, 'meta'); closeSheet(); showToast({ kind: 'info', text: 'Tips are back' }); }}><div style="flex:1"><div>Show tips again</div><div class="d">${hidden} tip${hidden === 1 ? '' : 's'} hidden.</div></div></button>` : null}<//>`;
}
/* Walkthrough. Runs once on a fresh install (skippable), and again from Help or Profile. While it runs, the app
   shows sample workouts so Stats has something to show; they live only in memory and vanish when it ends. */
const TOUR = [
  ['train', 'train', 'Welcome to Ironwood', 'A quick look at what it can do. It takes about a minute, and you can skip it any time.'],
  ['train', 'train', 'Train', 'Follow a program and Ironwood lines up the next day, or Self-log whatever you do. Runs, swims, yoga and classes count toward your streak too. Tap a day in the week to mark a rest day.'],
  ['train', 'history', 'History', 'Every workout and activity you’ve logged. Tap one to see the sets, fix a typo or delete it.'],
  ['routines', null, 'Routines and plans', 'Routines are single workouts; plans have several days. Edit, copy or remove any of them, and follow one as your program. “By type” sorts every workout into Push, Pull, Legs and more.'],
  ['stats', null, 'Stats', 'Each lift gets a chart with an 8-week projection, plus records, streaks and progress photos. These numbers are samples for the tour. They disappear when it ends.'],
  ['profile', null, 'Make it yours', 'Units, rest timer, text size and colors, including two color-blind friendly themes. Save a backup now and then.'],
  ['train', 'train', 'You’re set', 'Take this tour again from Profile, or from Help at the bottom of any page.'],
];
function demoSessions() {
  if (DEMO.list) return DEMO.list;
  const kg = U() === 'kg', now = Date.now(), out = [];
  const lifts = [['Squat', 185, 5], ['Bench Press', 145, 5], ['Bent-Over Barbell Rows', 125, 8], ['Deadlift', 225, 5], ['Overhead Barbell Press', 95, 6], ['Lat Pulldown', 120, 10]];
  const days = [['Full Body A', [0, 1, 2]], ['Full Body B', [3, 4, 5]], ['Full Body C', [0, 1, 5]]];
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now - (i * 2.3 + 0.6) * DAY); t.setHours(17, 30, 0, 0); if (+t > now) continue; const prog = (29 - i) / 29; const [name, picks] = days[i % 3];
    const items = picks.map(k => { const [n, base, r] = lifts[k]; let w = base * (1 + 0.14 * prog); w = kg ? Math.round(w / LB_PER_KG / 2.5) * 2.5 : Math.round(w / 5) * 5;
      return { ex: (findEx(n) || {}).id, group: '', u: U(), sets: [{ w, r }, { w, r }, { w, r: Math.max(1, r - (i % 2)) }] }; }).filter(x => x.ex);
    out.push({ id: 'demo' + i, name, startedAt: +t, endedAt: +t + 52 * 60000, items, prs: [] });
    if (i % 7 === 3) { const r0 = +t - DAY; out.push({ id: 'demo-run' + i, kind: 'activity', activity: 'run', name: 'Running', startedAt: r0, endedAt: r0 + 28 * 60000, items: [], prs: [], dur: 28, dist: kg ? 5 : 3.1, distU: kg ? 'km' : 'mi', note: '' }); }
  }
  DEMO.list = out.sort((a, b) => a.startedAt - b.startedAt); return DEMO.list;
}
const setDemo = on => { if (DEMO.on === on) return; DEMO.on = on; if (!on) DEMO.list = null; S.ver++; S.rerender(); };
const tourDone = () => { lsSet('tourDone', '1'); setDemo(false); };
function TourSheet({ step }) {
  const [tab, mode, title, body] = TOUR[step] || TOUR[0]; const last = step >= TOUR.length - 1;
  useEffect(() => { setDemo(true); return () => tourDone(); }, []);
  useEffect(() => { if (mode) { TRAIN.mode = mode; lsSet('trainMode', mode); } if (tab === 'stats') lsSet('statsTab', 'ex'); UI.setTab(tab); }, [step]);
  return html`<${Sheet} label="Tour"><div class="row"><div class="eyebrow" style="flex:1">${step + 1} of ${TOUR.length}</div>${last ? null : html`<button class="btn text" id="tour-skip" style="min-height:28px;padding:0" onClick=${closeSheet}>Skip tour</button>`}</div>
    <h2>${title}</h2><p class="note" style="margin:6px 0 14px">${body}</p>
    <div class="row">${step > 0 ? html`<button class="btn" style="flex:1" onClick=${() => openSheet({ type: 'tour', step: step - 1 })}>Back</button>` : null}
      <button class="btn primary" style="flex:2" id="tour-next" onClick=${() => last ? closeSheet() : openSheet({ type: 'tour', step: step + 1 })}>${last ? 'Done' : step === 0 ? 'Show me' : 'Next'}</button></div><//>`;
}
function FeedbackSheet() {
  const [text, setText] = useState(''); const [tech, setTech] = useState(true); const [msg, setMsg] = useState('');
  const details = () => ['Ironwood ' + (window.claude && window.claude.standalone ? 'home-screen app' : 'Claude version'), 'Device: ' + navigator.userAgent, 'Screen: ' + innerWidth + '×' + innerHeight,
    'Saved: ' + S.sync, ERRS.length ? 'Recent errors:\n- ' + ERRS.join('\n- ') : 'Recent errors: none'].join('\n');
  const body = () => text.trim() + (tech ? '\n\n---\n' + details() : '');
  const url = () => SUPPORT + '/new?title=' + encodeURIComponent('Feedback: ' + (text.trim().split('\n')[0].slice(0, 60) || 'Ironwood')) + '&body=' + encodeURIComponent(body().slice(0, 6000));
  const copy = async () => { try { await navigator.clipboard.writeText(body()); setMsg('Copied. Paste it wherever you like.'); } catch (e) { setMsg('Copy is blocked here. Use the button above.'); } };
  return html`<${Sheet} label="Send feedback"><h2>Send feedback</h2>
    <p class="note" style="margin-bottom:10px">Tell us what happened or what you’d like. No workouts or personal data are included.</p>
    <div class="stack"><textarea class="field" id="fb-text" style="min-height:120px;font-family:var(--body);font-size:16px" placeholder="What happened? What did you expect?" value=${text} onInput=${e => setText(e.target.value)}></textarea>
      <label class="toggle" for="fb-tech"><input type="checkbox" id="fb-tech" checked=${tech} onChange=${e => setTech(e.target.checked)}/>Include app version, device and recent errors</label>
      ${tech ? html`<pre class="fb-details">${details()}</pre>` : null}
      <a class=${'btn primary wide' + (text.trim() ? '' : ' disabled')} id="fb-send" href=${text.trim() ? url() : null} target="_blank" rel="noopener" aria-disabled=${!text.trim()}>Send on the support page</a>
      <p class="small faint">Opens the Ironwood support page on GitHub (a free account is needed to post).</p>
      <button class="btn wide" disabled=${!text.trim()} onClick=${copy}>Copy instead</button>
      ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}</div><//>`;
}
/* ---------- Color themes ---------- */
const PALETTES = {
  classic: ['Classic', '', { a: '#4c8dff', p: '#ffcf40', s: '#f0603f', g: '#39c98a', r: '#ff7d61', pi: '#1b1400' }, { a: '#1f5fd6', p: '#f5c22e', s: '#d2452a', g: '#1d9a62', r: '#b3341b', pi: '#2a1e00' }],
  forest: ['Forest', '', { a: '#3fbf73', p: '#ffcf40', s: '#f0603f', g: '#2ec4c4', r: '#ff7d61', pi: '#1b1400' }, { a: '#1e8a4c', p: '#f5c22e', s: '#d2452a', g: '#12898c', r: '#b3341b', pi: '#2a1e00' }],
  grape: ['Grape', '', { a: '#9b7bff', p: '#ffcf40', s: '#ff5c7a', g: '#39c98a', r: '#ff7d93', pi: '#1b1400' }, { a: '#6d4fd6', p: '#f5c22e', s: '#d0304f', g: '#1d9a62', r: '#b0243f', pi: '#2a1e00' }],
  ember: ['Ember', '', { a: '#ff7a3d', p: '#ffd84d', s: '#ff4d6d', g: '#39c98a', r: '#ff7d93', pi: '#1b1400' }, { a: '#d65314', p: '#e6b400', s: '#c9184a', g: '#1d9a62', r: '#b0243f', pi: '#241a00' }],
  rg: ['Red-green friendly', 'For protanopia and deuteranopia', { a: '#56b4e9', p: '#f0c000', s: '#e07bb4', g: '#00b386', r: '#e98bc0', pi: '#1b1400' }, { a: '#0072b2', p: '#e6b400', s: '#b0457f', g: '#007a5e', r: '#9c3a6f', pi: '#241a00' }],
  by: ['Blue-yellow friendly', 'For tritanopia', { a: '#26c6da', p: '#ff8fb1', s: '#ff5252', g: '#b39ddb', r: '#ff8fb1', pi: '#2a0010' }, { a: '#00838f', p: '#f06292', s: '#c62828', g: '#5e35b1', r: '#ad1457', pi: '#ffffff' }],
};
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const palVars = (c, al) => '--accent:' + c.a + ';--accent-soft:' + hexA(c.a, al) + ';--pr:' + c.p + ';--pr-ink:' + c.pi + ';--stop:' + c.s + ';--good:' + c.g + ';--red-text:' + c.r + ';';
function applyPalette() {
  const k = PALETTES[DISP.palette] ? DISP.palette : 'classic'; let el = document.getElementById('palette');
  if (k === 'classic') { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = 'palette'; document.head.appendChild(el); }
  const d = PALETTES[k][2], l = PALETTES[k][3];
  el.textContent = 'html:root{' + palVars(d, .16) + '}@media (prefers-color-scheme: light){html:root:not([data-theme="dark"]){' + palVars(l, .10) + '}}html:root[data-theme="light"]{' + palVars(l, .10) + '}html:root[data-theme="dark"]{' + palVars(d, .16) + '}';
}
function PaletteChooser() {
  const cur = PALETTES[DISP.palette] ? DISP.palette : 'classic';
  return html`<div><span class="lbl">Colors</span><div class="pal-grid">${Object.entries(PALETTES).map(([k, [n, sub, d]]) => html`<button key=${k} class=${'pal' + (cur === k ? ' on' : '')} aria-pressed=${cur === k} onClick=${() => setDisp('palette', k)}>
    <span class="sw" aria-hidden="true">${[d.a, d.p, d.s].map((c, i) => html`<i key=${i} style=${{ background: c }}></i>`)}</span><span class="pn">${n}</span>${sub ? html`<span class="pd">${sub}</span>` : null}</button>`)}</div></div>`;
}
