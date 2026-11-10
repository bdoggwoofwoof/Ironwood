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
  for (let i = list.length - 1; i >= 0; i--) { const s = list[i]; if (s.routineId !== r.id || s.startedAt < progStartOf(r.id)) continue; const idx = r.days.findIndex(d => d.id === s.dayId); return { routine: r, day: r.days[(idx + 1) % r.days.length], last: s }; }
  return { routine: r, day: r.days[0], last: null };
}
const setProgram = id => { commit(st => { st.meta.settings.program = id; if (id && id !== 'self' && typeof markSince === 'function') markSince(st, id); }, 'meta'); if (typeof applyFit === 'function' && runActive() && runSt().fit) applyFit(runSt().fit, true); };
/* Dismissable explanations. Hidden ones come back from Help → Show tips again. */
const tipOff = id => !!((S.meta.settings.tipsOff || {})[id]);
/* One tip per screen (Nov 10, audit P2-3): the first unhidden tip in a render shows; later ones wait their turn. */
const TIP_FRAME = {};
function Tip({ id, children, style, slot }) {
  if (tipOff(id)) return null;
  const k = slot || 'page'; if (!Object.keys(TIP_FRAME).length) queueMicrotask(() => { for (const x in TIP_FRAME) delete TIP_FRAME[x]; });
  if (TIP_FRAME[k] && TIP_FRAME[k] !== id) return null; TIP_FRAME[k] = id;
  return html`<div class="tip-card" style=${style}><div style="flex:1;min-width:0">${children}</div><button class="tip-x" aria-label="Hide this tip" onClick=${() => commit(st => { st.meta.settings.tipsOff = { ...(st.meta.settings.tipsOff || {}), [id]: 1 }; }, 'meta')}>${I.x}</button></div>`;
}
function TopSwitch({ value, options, onChange }) {
  return html`<div class=${'topsw' + (options.length > 3 ? ' four' : '')} role="tablist">${options.map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${value === k} class=${value === k ? 'on' : ''} onClick=${() => onChange(k)}>${l}</button>`)}</div>`;
}
const TRAIN = { mode: ['run', 'fight'].includes(lsGet('trainMode')) ? lsGet('trainMode') : 'train' };
function TrainSwitch() {
  const pick = m => { TRAIN.mode = m; lsSet('trainMode', m); S.rerender(); scrollTo(0, 0); };
  if (TRAIN.mode === 'history') { TRAIN.mode = 'train'; lsSet('trainMode', 'train'); }
  return html`<div><${TopSwitch} value=${TRAIN.mode} options=${[['train', 'Train'], ['run', 'Run'], ['fight', 'Fight']]} onChange=${pick}/>
    <p class="small muted tab-intro" style="margin:2px 0 8px">${TRAIN.mode === 'run' ? 'Your running plan, paces and conditioning.' : TRAIN.mode === 'fight' ? 'Coached rounds, combos and drills.' : 'Today’s training: what’s next and your week.'}</p>
    ${TRAIN.mode === 'run' ? html`<${RunScreen}/>` : TRAIN.mode === 'fight' ? html`<${FightScreen}/>` : html`<${TrainHome}/>`}</div>`;
}
function TrainHome() {
  const nx = nextUp(); const ws = weekStats(); const routine = nx && nx.routine; const now = new Date(); const pid = programId();
  const chs = Object.values(S.meta.challenges || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const newCh = () => UI.setView({ type: 'chEdit', draft: newChallenge(), isNew: true });
  const weekTxt = ws.thisReq === 0 ? 'Streak paused this week' : ws.thisCount + ' of ' + ws.thisReq + ' workouts' + (ws.thisExc ? ' (' + ws.thisExc + ' excused)' : '') + (ws.cur ? ' · ' + ws.cur + '-week streak' : '');
  const actBtn = html`<button class="btn ghost wide" id="log-activity" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log another activity</button>`;
  const pickBtn = (label, cls) => html`<button class=${cls || 'btn primary wide'} onClick=${() => openSheet({ type: 'program' })}>${label}</button>`;
  /* Train order (Nov 10, audit P1-1): what's next and Start come first, then the week. The full schedule grid moved
     into a sheet behind Schedule, so Train has one week strip. */
  const hasPlans = typeof planList === 'function' && planList().length > 0;
  const weekBlock = html`<div class="section-h" style="margin-top:14px"><h2>This week</h2>${!pid && !Object.keys(S.sessions).length ? null : html`<span class="aside num">${weekTxt}</span>`}</div>
    <${WeekStrip}/>
    ${hasPlans ? html`<div class="row" style="justify-content:flex-end;margin-top:2px"><button class="btn text" id="plan-sched" onClick=${() => openSheet({ type: 'schedule' })}>${I.cal} Schedule</button></div>` : null}
    <${Tip} id="week" style="margin-top:6px">Tap a day to mark rest, sick, injured or break, or to log an activity on that day.<//>
    <${PhaseCheck}/>
    <${PlanCheckIn}/>`;
  return html`<div class="today">
    <div class="eyebrow" style="margin-top:4px">${DOW_FULL[now.getDay()]} · ${MON[now.getMonth()]} ${now.getDate()}</div>
    ${nx ? html`
      <div class="section-h" style="margin-top:10px"><h2>Up next</h2><span class="aside">${nx.last ? 'Last: ' + dayLabel({ name: nx.last.name }) : 'Next in your plan'}</span></div>
      <div class="next-card">
        <div><div class="row" style="gap:8px"><div class="eyebrow" style="flex:1;min-width:0">${routine.name}</div><button class="btn text" style="min-height:28px;padding:0" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Change</button></div><h2>${nx.day.name}</h2></div>
        <div class="next-list">${nx.day.items.map(it => html`<div key=${it.id} class=${it.ss ? 'ssl' : ''}>${exName(it.ex)}<span class="faint"> · ${it.sets} × ${repTxt(it.reps)}</span>${it.group ? ' · ' + (RANGE_NAME[it.group] && (it.group === '1RM' || it.group === 'Max') ? RANGE_NAME[it.group] : it.group) : ''}</div>`)}</div>
        <button class="btn primary wide" onClick=${() => startWorkout(routine, nx.day)}>Start ${nx.day.name.split(/\s+[-–]\s+/)[0]}</button>
      </div>
      <${AlsoToday} nx=${nx}/>
      ${weekBlock}
      ${routine.days.length > 1 ? html`<div class="section-h"><h2>Or pick a day</h2><button class="btn text" onClick=${() => { UI.setTab('routines'); }}>All plans</button></div>` : html`<div style="height:12px"></div>`}
      <div class="stack">${routine.days.filter(d => d.id !== nx.day.id).map(d => html`<button key=${d.id} class="day-btn" onClick=${() => startWorkout(routine, d)}>
        <div><div class="t">${d.name}</div><div class="s">${d.items.length} exercises</div></div><span class="go">Start</span></button>`)}
        <button class="btn ghost wide" onClick=${() => startWorkout(null, null)}>${I.plus} Empty workout</button></div>`
    : pid === 'self' ? html`
      <div class="section-h"><h2>Self-log</h2><button class="btn text" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Follow a plan</button></div>
      <div class="next-card"><h2>Log your own workout</h2><p class="note">Start an empty workout and add exercises as you go. Weights carry over from last time.</p>
        <button class="btn primary wide" onClick=${() => startWorkout(null, null)}>${I.plus} Start a workout</button></div>
      <div class="stack" style="margin-top:10px"><button class="btn wide" onClick=${() => UI.setTab('routines')}>Start a saved plan</button></div>
      <${AlsoToday} nx=${null} quiet=${false}/>
      ${weekBlock}`
    : html`
      <div class="section-h"><h2>Get started</h2></div>
      <div class="next-card" id="get-started"><h2>Pick how you train</h2><p class="note">Follow a plan and Ironwood lines up the next day for you, or self-log whatever you do.</p>
        <button class="btn primary wide" id="gs-start" style="margin-bottom:8px" onClick=${() => openSheet({ type: 'goalSetup' })}>Build my plan (a few questions)</button>
        ${pickBtn('Choose a plan', 'btn wide')}</div>
      <${AlsoToday} nx=${null} quiet=${true}/>
      ${weekBlock}`}
    <div class="row" style="margin-top:12px">
      <button class="btn" style="flex:1" onClick=${() => UI.setView({ type: 'timer' })}>${I.timer} Interval timer</button>
    </div>
    <${GoalsCard}/>
    <${MonthCard}/>
    ${window.claude && window.claude.standalone && !Object.keys(S.sessions).length && !Object.keys(S.meta.routines).length && lsGet('restoreHint') !== 'off' ? html`<div class="card stack" style="margin-top:14px" id="restore-hint">
      <div style="font-weight:700">Moving from another phone?</div>
      <p class="note">Restore your backup file to bring back your workouts, plans and settings. Restore a photos backup the same way.</p>
      <div class="row"><button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore a backup</button><button class="btn text" onClick=${() => { lsSet('restoreHint', 'off'); S.rerender(); }}>Not now</button></div></div>` : null}
    <${LegacyTimedCard}/>
    ${window.claude && window.claude.standalone ? html`<${BackupNudge}/>` : null}
    ${chs.length ? html`<div class="section-h"><h2>Challenges</h2><button class="btn text" onClick=${newCh}>New</button></div>
      <div class="stack">${chs.map(ch => html`<${ChallengeCard} key=${ch.id} ch=${ch}/>`)}</div>` : null}
  </div>`;
}
function ProgramSheet() {
  const cur = programId(); const all = allRoutines();
  const plans = all.filter(r => r.days.length > 1), singles = all.filter(r => r.days.length === 1);
  const choose = id => { setProgram(id); closeSheet(); TRAIN.mode = 'train'; UI.setTab('train'); showToast(followToast(id)); };
  const row = r => html`<button key=${r.id} class=${'opt' + (cur === r.id ? ' on' : '')} onClick=${() => choose(r.id)}><div style="flex:1;min-width:0"><div>${r.name}</div><div class="d">${r.days.length > 1 ? r.days.length + ' days · ' + r.days.map(dayLabel).join(', ') : r.days[0].items.length + ' exercises'}</div></div>${cur === r.id ? I.check : null}</button>`;
  const create = () => { closeSheet(); UI.setTab('routines'); UI.setView({ type: 'edit', draft: { id: uid('r'), name: '', source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: 'Day 1', items: [] }, { id: uid('d'), name: 'Day 2', items: [] }] }, isNew: true, follow: true }); };
  return html`<${Sheet} label="Choose a plan"><h2>Choose a plan</h2>
    <p class="note" style="margin-bottom:6px">Train shows the next day of the plan you pick. You can change it any time.</p>
    <button class=${'opt' + (cur === 'self' ? ' on' : '')} id="pick-self" onClick=${() => choose('self')}><div style="flex:1"><div>Self-log</div><div class="d">No plan. Start an empty workout and add exercises as you go.</div></div>${cur === 'self' ? I.check : null}</button>
    <button class="opt" id="pick-goal" onClick=${() => openSheet({ type: 'goalSetup' })}><div style="flex:1"><div>Build my plan</div><div class="d">A few questions about your goal, time and gear, and Ironwood fits a plan to you.</div></div></button>
    <button class="opt" onClick=${create}><div style="flex:1"><div>${I.plus} Create a new plan</div><div class="d">Build your own days and exercises.</div></div></button>
    <div class="eyebrow" style="margin:16px 0 2px">Plans</div>${plans.map(row)}
    ${singles.length ? html`<div class="eyebrow" style="margin:16px 0 2px">One-day plans</div>${singles.map(row)}` : null}<//>`;
}
/* ---------- Help, tour, feedback ---------- */
const ERRS = []; addEventListener('error', e => { ERRS.push(String(e.message || e.error || 'error').slice(0, 200)); if (ERRS.length > 5) ERRS.shift(); });
addEventListener('unhandledrejection', e => { ERRS.push(('Promise: ' + (e.reason && (e.reason.message || e.reason))).slice(0, 200)); if (ERRS.length > 5) ERRS.shift(); });
const SUPPORT = 'https://github.com/bdoggwoofwoof/ironwood/issues';
function HelpFoot() { return html`<div class="help-foot"><button class="btn text" id="help-btn" onClick=${() => openSheet({ type: 'help' })}><span class="help-q" aria-hidden="true">?</span> Help</button></div>`; }
function HelpSheet() {
  const hidden = Object.keys(S.meta.settings.tipsOff || {}).length;
  return html`<${Sheet} label="Help"><h2>Help</h2>
    <button class="opt" id="help-tour" onClick=${startTour}><div style="flex:1"><div>Take the tour</div><div class="d">A quick walk through each page.</div></div></button>
    <button class="opt" id="help-feedback" onClick=${() => openSheet({ type: 'feedback' })}><div style="flex:1"><div>Send feedback</div><div class="d">Something went wrong, or you have an idea.</div></div></button>
    ${hidden ? html`<button class="opt" onClick=${() => { commit(st => { st.meta.settings.tipsOff = {}; }, 'meta'); closeSheet(); showToast({ kind: 'info', text: 'Tips are back' }); }}><div style="flex:1"><div>Show tips again</div><div class="d">${hidden} tip${hidden === 1 ? '' : 's'} hidden.</div></div></button>` : null}<//>`;
}
/* Walkthrough. Runs once on a fresh install (skippable), and again from Help or Profile. While it runs, the app
   shows sample workouts so Stats has something to show; they live only in memory and vanish when it ends. */
/* Each step: [tab, train mode, element(s) to highlight, title, text, extra settings]. No selector = centered card. */
/* Six stops (Nov 10, audit P1-4). Each tab teaches the rest itself with one tip on its first visit. */
const TOUR = [
  ['train', 'train', null, 'Welcome to Ironwood', 'Six quick stops, one for each tab. Skip any time; Help at the bottom of every page brings it back.'],
  ['train', 'train', '#get-started, .next-card', 'Train', 'Your next workout and its Start button sit at the top. During a workout, swipe a set right to log it, or tap its number. Hit the top of the rep range on every set and the next workout adds weight. Run and Fight live in the switch above.'],
  ['routines', null, '#plan-filters', 'Plans', 'Every plan in one list: lifting, one-day plans, goal plans, running, fight and joint care. Search or tap a filter, then follow a plan or add it alongside your main one.', { ls: { rtFilter: 'all' } }],
  ['stats', null, '.lift-row', 'Progress', 'Your history, numbers, each lift’s chart and records, and progress photos. These are sample numbers for the tour; they go away when it ends.', { max: 4, ls: { statsTab: 'ex' } }],
  ['meals', null, '#log-scan, #log-add', 'Meals', 'Log what you eat against daily goals, plan a week of meals, and prep with one shopping list. Barcode and online lookups are off until you allow them.', { meals: 'log' }],
  ['profile', null, '#backup-file', 'Profile', 'Everything stays on this phone, with no account. Save a backup file now and then. Colors, text size and training settings are here too.'],
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
function startTour() { if (S.active) { closeSheet(); showToast({ kind: 'info', text: 'Finish your workout first, then take the tour. It walks through every page.' }); return; } closeSheet(); setDemo(true); S.tour = { step: 0 }; S.rerender(); }
function endTour() { S.tour = null; tourDone(); TRAIN.mode = 'train'; lsSet('trainMode', 'train'); UI.setTab('train'); if (typeof offerSetup === 'function') offerSetup(); }
const tourGo = n => { S.tour = { step: n }; S.rerender(); };
/* Spotlight tour. One animation loop eases the highlight and the text card toward where they should be (no CSS
   transitions to restart mid-motion). Moving to another screen fades the page out, swaps it while it is invisible,
   and fades it back in; scrolling uses an eased animation. Reduce Motion skips all of it. */
const reduceMotion = () => document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const tourWait = ms => new Promise(r => setTimeout(r, ms));
const tourFrame = () => new Promise(r => requestAnimationFrame(() => r()));
function tourScroll(to, ms) {
  const from = scrollY, d = to - from; if (Math.abs(d) < 2 || ms <= 0) { scrollTo(0, to); return Promise.resolve(); }
  return new Promise(res => { const t0 = performance.now(); const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const f = now => { const p = Math.min(1, (now - t0) / ms); scrollTo(0, from + d * ease(p)); if (p < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
}
function TourOverlay() {
  const step = S.tour.step; const [tab, mode, sel, title, body, extra] = TOUR[step] || TOUR[0]; const last = step >= TOUR.length - 1;
  const holeRef = useRef(null), cardRef = useRef(null), insetRef = useRef(null);
  const [vis, setVis] = useState(step); const shown = TOUR[vis] || TOUR[0];   /* the words on the card; under Reduce Motion they change only once it has faded out */
  const tgt = useRef({ els: null, mid: true, side: 'mid', show: false });
  /* one loop for the whole tour */
  useEffect(() => {
    let raf = 0, prev = performance.now(); const cur = { x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0, ring: 0, cy: null, op: 0 }; const vel = { x: 0, y: 0, w: 0, h: 0, cy: 0 };
    const W = 11; /* spring speed: critically damped, settles in about half a second */
    const spring = (p, goal, dt) => { const a = W * W * (goal - cur[p]) - 2 * W * vel[p]; vel[p] += a * dt; cur[p] += vel[p] * dt; };
    let lastRect = null;
    const loop = now => {
      const dt = Math.min(64, now - prev); prev = now; const rm = reduceMotion(); const k = 1 - Math.exp(-dt / (rm ? 60 : 85)); const sdt = Math.min(.032, dt / 1000);
      /* Reduce Motion: nothing slides. The card and highlight fade out, move while invisible, and fade back in. */
      const snap = rm && (cur.op < .04 || cur.cy === null);
      const hole = holeRef.current, card = cardRef.current, inset = insetRef.current, T = tgt.current;
      if (hole && card) {
        const vw = innerWidth, vh = innerHeight, pad = 8;
        let r = null;
        if (T.els) for (const e of T.els) { if (!e.isConnected) continue; const q = e.getBoundingClientRect(); if (!q.width) continue;
          r = r ? { l: Math.min(r.l, q.left), t: Math.min(r.t, q.top), r: Math.max(r.r, q.right), b: Math.max(r.b, q.bottom) } : { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
        if (r) lastRect = r;
        const use = T.mid ? null : (r || lastRect);
        const g = use ? { x: Math.max(4, use.l - pad), y: Math.max(4, use.t - pad), w: Math.min(vw - 8, use.r - use.l + 2 * pad), h: Math.min(vh - 8, use.b - use.t + 2 * pad), ring: 1 }
                      : { x: vw / 2, y: vh / 2, w: 0, h: 0, ring: 0 };
        for (const p of ['x', 'y', 'w', 'h']) { if (snap) { cur[p] = g[p]; vel[p] = 0; } else if (!rm) spring(p, g[p], sdt); } cur.ring += (g.ring - cur.ring) * k;
        /* hole = the cut-out rect in the SVG mask; ring = a small outlined box over it (both cheap to redraw) */
        const cut = hole.querySelector('.tour-cut'), ring = hole.querySelector('.tour-ring');
        cut.setAttribute('fill-opacity', (rm ? cur.op : 1).toFixed(3));
        cut.setAttribute('x', cur.x.toFixed(1)); cut.setAttribute('y', cur.y.toFixed(1)); cut.setAttribute('width', Math.max(0, cur.w).toFixed(1)); cut.setAttribute('height', Math.max(0, cur.h).toFixed(1));
        ring.style.transform = 'translate(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px)'; ring.style.width = Math.max(0, cur.w).toFixed(1) + 'px'; ring.style.height = Math.max(0, cur.h).toFixed(1) + 'px';
        ring.style.opacity = (cur.ring * (rm ? cur.op : 1)).toFixed(3);
        const it = inset ? inset.offsetTop : 0, ib = inset ? inset.offsetHeight : 0, ch = card.offsetHeight;
        const side = T.mid ? 'mid' : T.side;
        const ty = side === 'top' ? it + 12 : side === 'bottom' ? vh - ib - 12 - ch : (vh - ch) / 2;
        if (cur.cy === null || snap) { cur.cy = ty; vel.cy = 0; } else if (!rm) spring('cy', ty, sdt); cur.op += ((T.show ? 1 : 0) - cur.op) * k;
        card.style.transform = 'translateY(' + cur.cy.toFixed(1) + 'px)'; card.style.opacity = cur.op.toFixed(3);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onKey = e => { if (e.key === 'Escape') endTour(); }; addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey); document.body.classList.remove('tour-fading', 'tour-on'); };
  }, []);
  /* each step: change screens if needed (hidden behind a fade), find the item, scroll it into the middle, aim the spotlight */
  useEffect(() => {
    let alive = true; const T = tgt.current; const rm = reduceMotion(); document.body.classList.add('tour-on');
    (async () => {
      if (rm && T.show) { T.show = false; await tourWait(220); if (!alive) return; }
      setVis(step);
      const ls = (extra && extra.ls) || {};
      const needTab = lsGet('tab') !== tab || Object.keys(ls).some(k => lsGet(k) !== ls[k]), needMode = !!mode && TRAIN.mode !== mode;
      if (extra && extra.meals && typeof MEALS !== 'undefined' && MEALS.mode !== extra.meals) { MEALS.mode = extra.meals; lsSet('mealsMode', extra.meals); if (!needTab && !needMode) S.rerender(); }
      if (needTab || needMode) {
        document.body.classList.add('tour-fading'); await tourWait(200); if (!alive) return;
        for (const k in ls) lsSet(k, ls[k]);
        if (mode) { TRAIN.mode = mode; lsSet('trainMode', mode); }
        if (needTab) { UI.setTab(tab); S.rerender(); } else S.rerender();
        await tourFrame(); await tourFrame();
      } else for (const k in ls) lsSet(k, ls[k]);
      let els = [];
      if (sel) for (let i = 0; i < 30 && alive; i++) { els = [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0).slice(0, (extra && extra.max) || 1); if (els.length) break; await tourWait(50); }
      if (!alive) return;
      if (els.length) {
        let r = null; for (const e of els) { const q = e.getBoundingClientRect(); r = r ? { t: Math.min(r.t, q.top), b: Math.max(r.b, q.bottom) } : { t: q.top, b: q.bottom }; }
        const vh = innerHeight, maxY = Math.max(0, document.documentElement.scrollHeight - vh);
        const want = Math.min(maxY, Math.max(0, scrollY + (r.t + r.b) / 2 - vh / 2));
        T.side = (r.t + r.b) / 2 - (want - scrollY) > vh / 2 ? 'top' : 'bottom';
        /* Scrolling from code stutters on iPhone, so a far-off item is reached by fading the page out, jumping there
           while it is invisible, and fading back in. Small moves just happen under the fade-in. */
        if (Math.abs(want - scrollY) > 40 && !(needTab || needMode)) { document.body.classList.add('tour-fading'); await tourWait(180); if (!alive) return; }
        scrollTo(0, want); await tourFrame();
        T.mid = false; T.els = els; T.show = true;
        document.body.classList.remove('tour-fading');
      } else { T.mid = true; T.els = null; T.show = true; document.body.classList.remove('tour-fading'); }
    })();
    return () => { alive = false; };
  }, [step]);
  return html`<div class="tour" role="dialog" aria-modal="true" aria-label=${'Tour: ' + title}>
    <div class="tour-inset" ref=${insetRef} aria-hidden="true"></div>
    <div class="tour-hole" ref=${holeRef}><svg class="tour-dim" aria-hidden="true"><defs><mask id="tour-mask" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="100%" height="100%" fill="#fff"/><rect class="tour-cut" x="0" y="0" width="0" height="0" rx="14" fill="#000"/></mask></defs><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,.62)" mask="url(#tour-mask)"/></svg><div class="tour-ring"></div></div>
    <div class="tour-card" ref=${cardRef}><div key=${vis} class="tour-txt">
      <div class="row"><div class="eyebrow" style="flex:1">${vis + 1} of ${TOUR.length}</div>${vis >= TOUR.length - 1 ? null : html`<button class="btn text" id="tour-skip" style="min-height:28px;padding:0" onClick=${endTour}>Skip tour</button>`}</div>
      <h2>${shown[3]}</h2><p class="note" style="margin:6px 0 14px">${shown[4]}</p></div>
      <div class="row">${step > 0 ? html`<button class="btn" style="flex:1" onClick=${() => tourGo(step - 1)}>Back</button>` : null}
        <button class="btn primary" style="flex:2" id="tour-next" onClick=${() => last ? endTour() : tourGo(step + 1)}>${last ? 'Done' : step === 0 ? 'Show me' : 'Next'}</button></div>
    </div></div>`;
}
function FeedbackSheet() {
  const [text, setText] = useState(''); const [tech, setTech] = useState(false); const [msg, setMsg] = useState('');
  const details = () => ['Ironwood ' + (window.claude && window.claude.standalone ? 'home-screen app' : 'Claude version'), 'Device: ' + navigator.userAgent, 'Screen: ' + innerWidth + '×' + innerHeight,
    'Saved: ' + S.sync, ERRS.length ? 'Recent errors:\n- ' + ERRS.join('\n- ') : 'Recent errors: none'].join('\n');
  const body = () => text.trim() + (tech ? '\n\n---\n' + details() : '');
  const url = () => SUPPORT + '/new?title=' + encodeURIComponent('Feedback: ' + (text.trim().split('\n')[0].slice(0, 60) || 'Ironwood')) + '&body=' + encodeURIComponent(body().slice(0, 6000));
  const copy = async () => { try { await navigator.clipboard.writeText(body()); setMsg('Copied. Paste it wherever you like.'); } catch (e) { setMsg('Copy is blocked here. Use the button above.'); } };
  return html`<${Sheet} label="Send feedback"><h2>Send feedback</h2>
    <p class="note" style="margin-bottom:10px">Tell us what happened or what you’d like. It posts as a public issue on the Ironwood support page; no workouts or personal data are included.</p>
    <div class="stack"><textarea class="field" id="fb-text" style="min-height:120px;font-family:var(--body);font-size:calc(16 * var(--u))" placeholder="What happened? What did you expect?" value=${text} onInput=${e => setText(e.target.value)}></textarea>
      <label class="toggle" for="fb-tech"><input type="checkbox" id="fb-tech" checked=${tech} onChange=${e => setTech(e.target.checked)}/>Include app version, device model and recent error messages (helps with bugs; visible on the public issue)</label>
      ${tech ? html`<pre class="fb-details">${details()}</pre>` : null}
      <a class=${'btn primary wide' + (text.trim() ? '' : ' disabled')} id="fb-send" href=${text.trim() ? url() : null} target="_blank" rel="noopener" aria-disabled=${!text.trim()}>Send on the support page</a>
      <p class="small faint">Opens the Ironwood support page on GitHub (a free account is needed to post).</p>
      <button class="btn wide" disabled=${!text.trim()} onClick=${copy}>Copy instead</button>
      ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}</div><//>`;
}
/* ---------- Color themes ---------- */
const PALETTES = {
  classic: ['Classic', '', { a: '#4c8dff', p: '#ffcf40', s: '#f0603f', g: '#39c98a', r: '#ff7d61', pi: '#1b1400' }, { a: '#1f5fd6', p: '#f5c22e', s: '#d2452a', g: '#1d9a62', r: '#b3341b', pi: '#2a1e00' }],
  forest: ['Forest', 'Pine, brass and iron', { a: '#6fbe8a', ai: '#0d1a12', p: '#d9ab4c', pi: '#1a1300', s: '#e0784f', si: '#200a02', g: '#7fb6d1', r: '#f08e66', bg: '#10130f', surface: '#181d17', raised: '#222921', line: '#2f392d', ink: '#eceee6', ink2: '#a8b1a1', ink3: '#929b8c' },
    { a: '#2e6b45', ai: '#ffffff', p: '#c48f2a', pi: '#1f1500', s: '#a8461f', si: '#ffffff', g: '#2f6f8f', r: '#9e3d19', bg: '#efeee7', surface: '#fbfaf5', raised: '#e5e3d8', line: '#d3d0c2', ink: '#1a1c17', ink2: '#555b50', ink3: '#5d6358' }],
  rg: ['Red-green friendly', 'For protanopia and deuteranopia', { a: '#56b4e9', p: '#f0c000', s: '#e07bb4', g: '#00b386', r: '#e98bc0', pi: '#1b1400' }, { a: '#00669f', p: '#e6b400', s: '#b0457f', g: '#007a5e', r: '#9c3a6f', pi: '#241a00' }],
  by: ['Blue-yellow friendly', 'For tritanopia', { a: '#26c6da', p: '#ff8fb1', s: '#ff5252', g: '#b39ddb', r: '#ff8fb1', pi: '#2a0010' }, { a: '#006e78', p: '#f06292', s: '#c62828', g: '#5e35b1', r: '#ad1457', pi: '#ffffff' }],
};
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const lum = h => { const n = parseInt(h.slice(1), 16); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
/* Text on a color: white or near-black, whichever contrasts more (white needs a fairly dark fill to reach 4.5:1) */
const inkFor = h => (1.05 / (lum(h) + .05)) >= ((lum(h) + .05) / (lum('#14171b') + .05)) ? '#ffffff' : '#14171b';
const palSurf = c => c.bg ? '--bg:' + c.bg + ';--surface:' + c.surface + ';--raised:' + c.raised + ';--line:' + c.line + ';--ink:' + c.ink + ';--ink-2:' + c.ink2 + ';--ink-3:' + c.ink3 + ';' : '';
const palVars = (c, al) => palSurf(c) + '--accent:' + c.a + ';--accent-bg:' + c.a + ';--accent-ink:' + (c.ai || inkFor(c.a)) + ';--accent-btn:' + ((c.ai || inkFor(c.a)) === '#ffffff' ? 'color-mix(in srgb, ' + c.a + ' 72%, #000)' : hexA('#ffffff', .3)) + ';--accent-soft:' + hexA(c.a, al) + ';--pr:' + c.p + ';--pr-ink:' + c.pi + ';--stop:' + c.s + ';--stop-ink:' + (c.si || (al > .12 ? '#240800' : '#ffffff')) + ';--good:' + c.g + ';--red-text:' + c.r + ';';
/* ---- Custom colors: three colors picked on a hue/saturation wheel, all at one shared brightness (HSV value). ---- */
const hsv2hex = (h, s, v) => { h = ((h % 360) + 360) % 360; const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
const hex2hsv = hex => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx }; };
const CUSTOM_DEF = () => { const c = PALETTES.classic[2]; return { v: .95, mode: 'square', cols: [c.a, c.p, c.s].map(x => { const q = hex2hsv(x); return { h: q.h, s: q.s }; }) }; };
const customGet = () => { try { const c = JSON.parse(lsGet('palCustom') || 'null'); if (c && c.cols && c.cols.length === 3) return c; } catch (e) {} return null; };
function customPal(c) {
  c = c || customGet() || CUSTOM_DEF(); const v = c.v;
  const dark = c.cols.map(x => hsv2hex(x.h, x.s, v)), light = c.cols.map(x => hsv2hex(x.h, Math.min(1, x.s * 1.08 + .05), Math.max(.35, v * .72)));
  const mk = (cs, g, r) => ({ a: cs[0], p: cs[1], s: cs[2], g, r: cs[2], ai: inkFor(cs[0]), pi: inkFor(cs[1]), si: inkFor(cs[2]) });
  return ['Custom', 'Your three colors', mk(dark, '#39c98a'), mk(light, '#1d9a62')];
}
const palFor = k => k === 'custom' ? customPal() : PALETTES[k];
function applyPalette() {
  const k = DISP.palette === 'custom' || PALETTES[DISP.palette] ? DISP.palette : 'classic'; let el = document.getElementById('palette');
  if (k === 'classic') { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = 'palette'; document.head.appendChild(el); }
  const P = palFor(k), d = P[2], l = P[3];
  el.textContent = 'html:root{' + palVars(d, .16) + '}@media (prefers-color-scheme: light){html:root:not([data-theme="dark"]){' + palVars(l, .10) + '}}html:root[data-theme="light"]{' + palVars(l, .10) + '}html:root[data-theme="dark"]{' + palVars(d, .16) + '}';
}
function PaletteChooser() {
  const cur = DISP.palette === 'custom' || PALETTES[DISP.palette] ? DISP.palette : 'classic'; const cp = customPal()[2];
  const cb = cur === 'rg' || cur === 'by'; const tiles = [['classic'], ['forest'], ['cb']];
  return html`<div><span class="lbl">Colors</span><div class="pal-grid">${tiles.map(([k]) => { const isCb = k === 'cb'; const P = PALETTES[isCb ? (cb ? cur : 'rg') : k]; const [n0, sub0, d] = P; const n = isCb ? 'Color-blind friendly' : n0; const sub = isCb ? 'Two kinds to choose from' : sub0; const on = isCb ? cb : cur === k;
    return html`<button key=${k} class=${'pal' + (on ? ' on' : '')} id=${'pal-' + k} aria-pressed=${on} onClick=${() => setDisp('palette', isCb ? (cb ? cur : 'rg') : k)}>
    <span class="sw" aria-hidden="true">${[d.a, d.p, d.s].map((c, i) => html`<i key=${i} style=${{ background: c }}></i>`)}</span><span class="pn">${n}</span>${sub ? html`<span class="pd">${sub}</span>` : null}</button>`; })}
    <button class=${'pal' + (cur === 'custom' ? ' on' : '')} id="pal-custom" aria-pressed=${cur === 'custom'} onClick=${() => openSheet({ type: 'colors' })}>
      <span class="sw" aria-hidden="true">${[cp.a, cp.p, cp.s].map((c, i) => html`<i key=${i} style=${{ background: c }}></i>`)}</span><span class="pn">Custom</span><span class="pd">${customGet() ? 'Tap to edit' : 'Pick your own three'}</span></button></div>
    ${cb ? html`<div class="seg wide" role="group" aria-label="Kind of color blindness" id="pal-cb" style="margin-top:8px">${[['rg', 'Red-green'], ['by', 'Blue-yellow']].map(([k, l]) => html`<button key=${k} id=${'pal-' + k} class=${cur === k ? 'on' : ''} aria-pressed=${cur === k} onClick=${() => setDisp('palette', k)}>${l}</button>`)}</div>
      <p class="small muted" style="margin-top:4px">${cur === 'rg' ? 'For protanopia and deuteranopia.' : 'For tritanopia.'}</p>` : null}</div>`;
}
const HARMONY = [['complementary', 'Complementary', [180]], ['split', 'Split', [150, 210]], ['triadic', 'Triadic', [120, 240]], ['square', 'Square', [90, 180, 270]], ['analogous', 'Analogous', [-30, 30]]];
const SLOTS = [['Main', 'Buttons, links and highlights'], ['Records', 'PR badges and records'], ['Warnings', 'Stop, delete and missed days']];
function ColorSheet() {
  const [c, setC] = useState(() => clone(customGet() || (() => { const P = palFor(DISP.palette === 'custom' || PALETTES[DISP.palette] ? DISP.palette : 'classic')[2];
    const cols = [P.a, P.p, P.s].map(x => { const q = hex2hsv(x); return { h: q.h, s: q.s }; }); return { v: Math.max(.55, Math.max(...[P.a, P.p, P.s].map(x => hex2hsv(x).v))), mode: 'square', cols }; })()));
  const [sel, setSel] = useState(0); const [target, setTarget] = useState(1);
  const cv = useRef(null); const R = 130;
  useEffect(() => { const el = cv.current; if (!el) return; const dpr = Math.min(2, devicePixelRatio || 1), size = R * 2 * dpr; el.width = el.height = size; const ctx = el.getContext('2d'); const img = ctx.createImageData(size, size); const d = img.data, rr = size / 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const dx = x - rr + .5, dy = y - rr + .5, r = Math.sqrt(dx * dx + dy * dy); const i = (y * size + x) * 4; if (r > rr) { d[i + 3] = 0; continue; }
      const hex = hsv2hex(Math.atan2(dy, dx) * 180 / Math.PI + 90, r / rr, c.v); const n = parseInt(hex.slice(1), 16); d[i] = n >> 16; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255; d[i + 3] = r > rr - 1 ? Math.round(255 * (rr - r)) : 255; }
    ctx.putImageData(img, 0, 0); }, [c.v]);
  const pos = (h, s) => { const a = (h - 90) * Math.PI / 180; return [R + Math.cos(a) * s * R, R + Math.sin(a) * s * R]; };
  const setCol = (i, col) => { const n = clone(c); n.cols[i] = col; setC(n); };
  const pick = e => { const b = e.currentTarget.getBoundingClientRect(); const dx = e.clientX - b.left - R, dy = e.clientY - b.top - R;
    setCol(sel, { h: (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360, s: Math.min(1, Math.sqrt(dx * dx + dy * dy) / R) }); };
  const dragging = useRef(false);
  const cur = c.cols[sel]; const offs = (HARMONY.find(x => x[0] === c.mode) || HARMONY[3])[2];
  const sugg = offs.map(o => ({ h: (cur.h + o + 360) % 360, s: cur.s }));
  const others = [0, 1, 2].filter(i => i !== sel); const tgt = others.includes(target) ? target : others[0];
  const useSugg = q => { setCol(tgt, q); const nx = others.find(i => i !== tgt); setTarget(nx); };
  const fill = () => { const n = clone(c); others.forEach((i, k) => { if (sugg[k] || sugg[0]) n.cols[i] = sugg[k] || sugg[0]; }); setC(n); };
  const hexes = c.cols.map(x => hsv2hex(x.h, x.s, c.v));
  const save = () => { lsSet('palCustom', JSON.stringify(c)); setDisp('palette', 'custom'); applyPalette(); closeSheet(); showToast({ kind: 'info', text: 'Custom colors on' }); };
  const [hx, hy] = pos(cur.h, cur.s);
  return html`<${Sheet} label="Custom colors"><h2>Custom colors</h2>
    <p class="note" style="margin-bottom:10px">Pick a color, then drag on the wheel. Dashed lines point to colors that go with it.</p>
    <div class="slot-pick" role="group" aria-label="Which color">${SLOTS.map(([n, d], i) => html`<button key=${i} class=${'slot-btn' + (sel === i ? ' on' : '')} aria-pressed=${sel === i} onClick=${() => { setSel(i); setTarget([0, 1, 2].find(k => k !== i)); }}>
      <i style=${{ background: hexes[i] }}></i><span><b>${n}</b><span class="d">${d}</span></span></button>`)}</div>
    <div class="wheel" style=${{ width: R * 2 + 'px', height: R * 2 + 'px' }} id="color-wheel"
      onPointerDown=${e => { dragging.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} pick(e); }}
      onPointerMove=${e => { if (dragging.current) pick(e); }} onPointerUp=${() => { dragging.current = false; }} onPointerCancel=${() => { dragging.current = false; }}>
      <canvas ref=${cv} style=${{ width: R * 2 + 'px', height: R * 2 + 'px' }} aria-hidden="true"></canvas>
      <svg viewBox=${'0 0 ' + R * 2 + ' ' + R * 2} aria-hidden="true">
        ${sugg.map((q, i) => { const [x, y] = pos(q.h, q.s); return html`<g key=${i}><line x1=${R} y1=${R} x2=${x} y2=${y} class="wl sug"/><circle cx=${x} cy=${y} r="11" class="wd-sug" style=${{ fill: hsv2hex(q.h, q.s, c.v) }}/></g>`; })}
        <line x1=${R} y1=${R} x2=${hx} y2=${hy} class="wl main"/><circle cx=${R} cy=${R} r="4" class="wc"/>
        <circle cx=${hx} cy=${hy} r="15" class="wd-main" style=${{ fill: hexes[sel] }}/></svg></div>
    <div class="lbl" style="margin-top:12px">Suggestions</div>
    <div class="range-grid" role="group" aria-label="Kind of suggestions" style="margin-top:4px">${HARMONY.map(([k, l]) => html`<button key=${k} class=${'chip' + (c.mode === k ? ' on' : '')} aria-pressed=${c.mode === k} onClick=${() => setC({ ...c, mode: k })}>${l}</button>`)}</div>
    <div class="row wrap" style="margin-top:10px;gap:8px">${sugg.map((q, i) => html`<button key=${i} class="sug-sw" aria-label=${'Use suggestion ' + (i + 1) + ' for ' + SLOTS[tgt][0]} onClick=${() => useSugg(q)} style=${{ background: hsv2hex(q.h, q.s, c.v) }}></button>`)}
      <span class="small muted" style="flex:1;min-width:120px">Tap one to use it for <b>${SLOTS[tgt][0]}</b></span></div>
    <button class="btn wide" style="margin-top:10px" id="fill-sugg" onClick=${fill}>Use suggestions for ${others.map(i => SLOTS[i][0]).join(' and ')}</button>
    <div style="margin-top:14px"><label class="lbl" for="cw-v">Brightness (all three)</label>
      <input type="range" id="cw-v" class="cw-v" min="55" max="100" value=${Math.round(c.v * 100)} onInput=${e => setC({ ...c, v: +e.target.value / 100 })}/></div>
    <div class="cw-prev" aria-label="Preview"><span class="btn" style=${{ background: hexes[0], color: inkFor(hexes[0]) }}>Start</span><span class="pr-badge" style=${{ background: hexes[1], color: inkFor(hexes[1]) }}>New PR</span><span class="btn" style=${{ background: hexes[2], color: inkFor(hexes[2]) }}>Stop</span></div>
    <p class="small faint" style="margin-top:6px">Light mode uses deeper versions of the same three colors.</p>
    <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" onClick=${closeSheet}>Cancel</button><button class="btn primary" style="flex:2" id="cw-save" onClick=${save}>Use these colors</button></div><//>`;
}
