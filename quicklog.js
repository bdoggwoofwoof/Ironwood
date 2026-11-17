/* ============ Quick log (Nov 16, Newt) ============
   One round + button in the same spot on every page except Profile. It opens three groups:
   Quick train (start now: what's up next, a blank workout, a day from your plan or another plan, a run, fight training),
   Log exercise (something you already did), and Log food. Replaces the Meals-only + button. */
function quickGo(fn) { closeSheet(); setTimeout(fn, 30); }
function trainMode(m) { TRAIN.mode = m; lsSet('trainMode', m); UI.setTab('train'); S.rerender(); }
function QuickLogSheet() {
  const [days, setDays] = useState(false);
  const nx = typeof nextUp === 'function' ? nextUp() : null; const r = nx && nx.routine;
  const others = typeof addonIds === 'function' ? addonIds().map(getRoutine).filter(x => x && x.days.length) : [];
  const row = (id, icon, t, d, fn) => html`<button class="opt ql-row" id=${id} onClick=${fn}><span class="ql-ic" aria-hidden="true">${icon}</span><div style="flex:1;min-width:0"><div>${t}</div>${d ? html`<div class="d">${d}</div>` : null}</div></button>`;
  const dayBtn = (rt, d) => html`<button key=${rt.id + d.id} class="chip ql-day" id=${'ql-d-' + d.id} onClick=${() => quickGo(() => { UI.setTab('train'); startWorkout(rt, d); })}>${d.name}</button>`;
  return html`<${Sheet} label="Quick log"><h2>Quick log</h2>
    <div class="eyebrow" style="margin-top:10px">Quick train</div>
    ${S.active ? row('ql-resume', I.timer, 'Go to your workout', S.active.name || 'In progress', () => quickGo(() => { TRAIN.mode = 'train'; UI.setTab('train'); }))
      : html`
      ${nx ? row('ql-next', I.plus, 'Start ' + nx.day.name, r.name + ' · up next', () => quickGo(() => { UI.setTab('train'); startWorkout(r, nx.day); })) : null}
      ${row('ql-blank', I.plus, 'Blank workout', 'Add exercises as you go', () => quickGo(() => { UI.setTab('train'); startWorkout(null, null); }))}
      ${r || others.length ? html`${row('ql-plan', I.cal, 'Pick a day from my plan', days ? null : (r ? r.days.length + ' days' : '') + (others.length ? (r ? ' · ' : '') + others.map(o => o.name).join(', ') : ''), () => setDays(!days))}
        ${days ? html`<div class="ql-days" id="ql-days">${[r, ...others].filter(Boolean).map(rt => html`<div key=${rt.id}><div class="small muted" style="margin:6px 0 4px">${rt.name}</div><div class="row wrap" style="gap:6px">${rt.days.map(d => dayBtn(rt, d))}</div></div>`)}</div>` : null}` : null}
      ${row('ql-other', I.note, 'Another plan', 'Browse every plan in Plans', () => quickGo(() => UI.setTab('routines')))}
      ${row('ql-run', I.share, 'Run', typeof runActive === 'function' && runActive() ? 'Your running plan' : 'Running and the running plan', () => quickGo(() => trainMode('run')))}
      ${row('ql-fight', I.timer, 'Fight training', 'Rounds, drills and the coach', () => quickGo(() => trainMode('fight')))}`}
    <div class="eyebrow" style="margin-top:14px">Log exercise</div>
    ${row('ql-activity', I.edit, 'Log an activity', 'Something you already did: a run, a class, a sport, a hike', () => openSheet({ type: 'activity' }))}
    ${row('ql-bw', I.plate, 'Log bodyweight', '', () => openSheet({ type: 'bw' }))}
    ${typeof ML === 'function' ? html`<div class="eyebrow" style="margin-top:14px">Log food</div>
      ${row('ql-food', I.meals, 'Log food', 'Search, scan or pick from recent', () => openSheet({ type: 'mealLog', day: typeof MEALS !== 'undefined' && MEALS.mode === 'log' && MEALS.day ? MEALS.day : ymd(new Date()) }))}` : null}<//>`;
}
/* The button itself: hidden on Profile and on the workout screen while you lift */
function QuickFab({ tab, view }) {
  if (tab === 'profile') return null;
  /* Nov 16 (meal audit D5, Newt's pick): no + over the rows on Start cooking and the Shopping list */
  if (tab === 'meals' && ((view && view.type === 'cook') || (!view && typeof MEALS !== 'undefined' && MEALS.mode === 'list'))) return null;
  if (tab === 'train' && (S.active || view) && !(view && view.type === 'challenge')) return null;
  return html`<button class=${'fab' + (S.rest ? ' over-rest' : '')} id="quick-fab" aria-label="Quick log: train, log exercise or food" onClick=${() => openSheet({ type: 'quickLog' })}>${I.plus}</button>`;
}
