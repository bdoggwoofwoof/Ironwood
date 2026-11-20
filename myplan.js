/* ============ My plan, saving edits and plan names (Nov 20, Newt) ============
   Plans opens on My plan: the plan you follow, ready to view and edit (one day or the whole plan), with what runs
   alongside it. All plans is the library. Editing a plan you already have asks: save to this plan, or save as a new plan
   (with a name). Copy asks for a name too. No two plans share a name: "Sapwood already exists. Choose a new name."
   Suggested names for copies are the name plus the next free number: "Sapwood 2", then "Sapwood 3". */
const planNameKey = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
function planNameTaken(name, exceptId) {
  const k = planNameKey(name); if (!k) return null;
  const all = [...allRoutines(), ...(typeof archivedRoutines === 'function' ? archivedRoutines() : [])];
  return all.find(r => r.id !== exceptId && (!exceptId || r.base !== exceptId) && planNameKey(r.name) === k) || null;
}
/* "Sapwood Hypertrophy" → "Sapwood Hypertrophy 2"; "Sapwood Hypertrophy 2" → "… 3" (the next free number) */
function nextPlanName(name) {
  const base = String(name || 'My plan').trim().replace(/\s+\(copy\)$/i, '').replace(/\s+\d+$/, '') || 'My plan';
  for (let n = 2; n < 1000; n++) { const c = base + ' ' + n; if (!planNameTaken(c)) return c; }
  return base + ' ' + Date.now();
}
const uniquePlanName = (name, exceptId) => planNameTaken(name, exceptId) ? nextPlanName(name) : String(name).trim();
const takenMsg = name => '“' + String(name).trim() + '” already exists. Choose a new name.';
/* Ask for a plan name: { title, sub, value, ok, exceptId, onSave(name) } */
function PlanNameSheet({ title, sub, value, ok, exceptId, onSave }) {
  const [v, setV] = useState(value || ''); const [tried, setTried] = useState(false);
  const clash = planNameTaken(v, exceptId); const empty = !v.trim();
  const go = () => { setTried(true); if (empty || clash) return; onSave(v.trim()); };
  return html`<${Sheet} label=${title}><h2>${title}</h2>${sub ? html`<p class="note">${sub}</p>` : null}
    <label class="lbl" for="pn-name" style="margin-top:10px">Plan name</label>
    <input class="field" id="pn-name" value=${v} autocomplete="off" onInput=${e => setV(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') go(); }}/>
    ${clash && (tried || v !== value) ? html`<p class="small" id="pn-taken" role="alert" style="margin-top:6px;color:var(--red-text)">${takenMsg(v)}</p>` : null}
    ${tried && empty ? html`<p class="small" role="alert" style="margin-top:6px;color:var(--red-text)">Give the plan a name.</p>` : null}
    <button class="btn primary wide" id="pn-save" style="margin-top:12px" onClick=${go}>${ok || 'Save'}</button>
    <button class="btn wide" style="margin-top:8px" onClick=${closeSheet}>Cancel</button><//>`;
}
/* Copy a plan under a new name */
function copyPlanAs(r, name, follow) {
  const c = clone(r); delete c.base; delete c.meta; delete c.shelf; delete c.personal; c.id = uid('r'); c.source = 'mine'; c.name = name; c.createdAt = Date.now(); c.copyOf = r.id;
  c.days.forEach(d => { d.id = uid('d'); d.items.forEach(i => { i.id = uid('i'); }); });
  commit(st => { st.meta.routines[c.id] = c; if (follow) st.meta.settings.program = c.id; }, 'meta');
  return c;
}
function askCopy(r) {
  openSheet({ type: 'planName', title: 'Copy ' + r.name, sub: 'Make your own version to change. The original stays as it is.', value: nextPlanName(r.name), ok: 'Make the copy',
    onSave: name => { const c = copyPlanAs(r, name); closeSheet(); UI.setTab('routines'); UI.setView({ type: 'routine', id: c.id }); showToast({ kind: 'info', text: name + ' made. Edit it any way you like.' }); } });
}
/* Plans: My plan | All plans */
const plansView = () => { const v = lsGet('plansView'); if (v === 'mine' || v === 'all') return v; const pid = programId(); return pid && pid !== 'self' && getRoutine(pid) ? 'mine' : 'all'; };
function PlansTop() {
  return html`<${TopSwitch} value=${plansView()} options=${[['mine', 'My plan'], ['all', 'All plans']]} onChange=${k => { lsSet('plansView', k); S.rerender(); scrollTo(0, 0); }}/>`;
}
function MyPlanPane() {
  const pid = programId(); const r = pid && pid !== 'self' ? getRoutine(pid) : null;
  const others = typeof addonIds === 'function' ? addonIds().map(getRoutine).filter(Boolean) : [];
  if (!r) return html`<div id="my-plan"><div class="card" id="my-plan-none"><b>You’re not following a plan</b><p class="small muted" style="margin-top:4px">Pick one in All plans and Train lines up each day for you, or build your own.</p>
      <button class="btn primary wide" style="margin-top:10px" id="mp-browse" onClick=${() => { lsSet('plansView', 'all'); S.rerender(); }}>Browse all plans</button></div></div>`;
  return html`<div id="my-plan"><${RoutineView} id=${r.id} mine=${true}/>
    ${others.length ? html`<div class="section-h"><h2>Alongside</h2><button class="btn text" onClick=${() => openSheet({ type: 'addons' })}>Edit</button></div>
      <div class="stack">${others.map(o => html`<button key=${o.id} class="opt" id=${'mp-also-' + o.id} onClick=${() => UI.setView({ type: 'routine', id: o.id })}><div style="flex:1;min-width:0"><div>${o.name}</div><div class="d">${o.meta || o.days.length + ' days'}</div></div></button>`)}</div>` : null}
    <button class="btn wide" style="margin-top:14px" id="mp-change" onClick=${() => openSheet({ type: 'program' })}>Change plan</button></div>`;
}
/* A day's Edit: just for today, or this day in the plan */
function DayEditSheet({ rid, did }) {
  const r = getRoutine(rid); const d = r && r.days.find(x => x.id === did); if (!d) return null;
  return html`<${Sheet} label=${'Edit ' + d.name}><h2>Edit ${d.name}</h2>
    <button class="opt" id="de-today" onClick=${() => { closeSheet(); startWorkout(r, d); showToast({ kind: 'info', ms: 6000, text: 'Started ' + d.name + '. Add, swap or remove anything; your plan stays the same.' }); }}><div style="flex:1"><div>Just for today</div><div class="d">Start it now and change anything in the workout. The plan stays as it is.</div></div></button>
    <button class="opt" id="de-plan" onClick=${() => { closeSheet(); editPlanDraft(r, did); }}><div style="flex:1"><div>Change this day in the plan</div><div class="d">Every time you do ${d.name} from now on.</div></div></button>
    <button class="opt" id="de-all" onClick=${() => { closeSheet(); editPlanDraft(r); }}><div style="flex:1"><div>Edit the whole plan</div><div class="d">All days, names, sets and order.</div></div></button><//>`;
}
function editPlanDraft(r, dayId) {
  const builtin = r.source === 'builtin';
  UI.setTab('routines');
  UI.setView({ type: 'edit', dayId: dayId || null, draft: builtin ? { ...clone(r), source: 'mine', base: r.id, createdAt: Date.now() } : clone(r) });
}
