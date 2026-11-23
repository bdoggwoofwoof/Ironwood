/* Reorder or remove (Nov 20, Newt): one page to drag exercises into order and take some out, instead of Move up / Move down
   one step at a time. Used in a workout and in the plan editor. A superset moves as one block; dragging is by the handle,
   and the handle also takes the arrow keys. Removing the first exercise of a superset keeps the rest linked. */
const groupsOf = list => { const u = []; list.forEach((it, i) => { if (i > 0 && it.ss && u.length) u[u.length - 1].push(it); else u.push([it]); }); return u; };
function ReorderSheet({ list, title, onChange, workout }) {
  const [, setT] = useState(0); const re = () => { setT(x => x + 1); if (onChange) onChange(); };
  const drag = useRef(null); const units = groupsOf(list);
  const setUnits = us => { list.splice(0, list.length, ...us.flat()); if (list[0]) list[0].ss = false; };
  const moveUnit = (from, to) => { const us = groupsOf(list); if (to < 0 || to >= us.length || from === to) return; const [m] = us.splice(from, 1); us.splice(to, 0, m); setUnits(us); re(); };
  const remove = it => { const before = list.slice(); const ss = list.map(x => x.ss); const i = list.indexOf(it);
    if (!it.ss && list[i + 1] && list[i + 1].ss) list[i + 1].ss = false; list.splice(i, 1); if (list[0]) list[0].ss = false; re();
    const n = workout ? it.sets.filter(isDone).length : 0;
    showToast({ kind: 'info', ms: 8000, text: exName(it.ex) + ' removed' + (n ? ' with ' + n + ' logged set' + (n === 1 ? '' : 's') : ''), action: 'Undo', fn: () => { list.splice(0, list.length, ...before); before.forEach((x, k) => { x.ss = ss[k]; }); re(); } }); };
  const down = (e, ui) => { e.preventDefault(); const h = e.currentTarget; try { h.setPointerCapture(e.pointerId); } catch (x) {} drag.current = { ui, id: e.pointerId }; re(); };
  const moveP = e => { const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const rows = [...document.querySelectorAll('#reorder .ro-unit')]; let to = d.ui;
    rows.forEach((el, k) => { const r = el.getBoundingClientRect(); if (k < d.ui && e.clientY < r.top + r.height / 2) to = Math.min(to, k); if (k > d.ui && e.clientY > r.top + r.height / 2) to = Math.max(to, k); });
    if (to !== d.ui) { moveUnit(d.ui, to); d.ui = to; } };
  const up = e => { if (drag.current && drag.current.id === e.pointerId) { drag.current = null; re(); } };
  const key = (e, ui) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const to = ui + (e.key === 'ArrowUp' ? -1 : 1); moveUnit(ui, to); setTimeout(() => { const b = document.querySelectorAll('#reorder .ro-handle')[Math.max(0, Math.min(to, groupsOf(list).length - 1))]; if (b) b.focus(); }, 30); } };
  return html`<${Sheet} label=${title || 'Reorder or remove'}><h2>${title || 'Reorder or remove'}</h2>
    <p class="note" style="margin-bottom:6px">Drag the handle on the left to move an exercise; a superset moves together. Tap the X to take one out. Order doesn’t change muscle growth, so if a machine is taken, do something else first; only strength on the first lifts benefits from going first.<${Cite} k=${['order']} sec="exercises"/></p>
    <div id="reorder" role="list">${units.map((u, ui) => html`<div key=${u[0].id} role="listitem" class="opt ro-unit" style=${{ alignItems: 'flex-start', opacity: drag.current && drag.current.ui === ui ? 0.6 : 1 }}>
      <button class="icon-btn ro-handle" style="touch-action:none;cursor:grab" aria-label=${'Move ' + u.map(x => exName(x.ex)).join(' and ') + '. Drag, or use the arrow keys.'}
        onPointerDown=${e => down(e, ui)} onPointerMove=${moveP} onPointerUp=${up} onPointerCancel=${up} onKeyDown=${e => key(e, ui)}>${I.grip}</button>
      <div style="flex:1;min-width:0">${u.length > 1 ? html`<div class="d">Superset</div>` : null}${u.map(it => html`<div key=${it.id} class="row" style="min-height:44px">
        <div style="flex:1;min-width:0"><div>${exName(it.ex)}</div><div class="d">${workout ? it.sets.filter(isDone).length + ' of ' + it.sets.length + ' sets done' : setsLabel(it)}</div></div>
        <button class="icon-btn" id=${'ro-x-' + it.id} aria-label=${'Remove ' + exName(it.ex)} onClick=${() => remove(it)}>${I.x}</button></div>`)}</div></div>`)}</div>
    ${!list.length ? html`<p class="note" style="margin-top:10px">No exercises left.</p>` : null}
    <button class="btn primary wide" id="ro-done" style="margin-top:14px" onClick=${closeSheet}>Done</button><//>`;
}
/* Add from your other programs: pick which exercises to bring in, all or just a few (Nov 20, Newt) */
function AddPickSheet({ rid, dayId }) {
  const r = getRoutine(rid); const day = r && (r.days.find(d => d.id === dayId) || r.days[0]); const [on, setOn] = useState(() => new Set(day ? day.items.map(x => x.id) : []));
  if (!day) return null;
  const tog = id => { const s = new Set(on); if (s.has(id)) s.delete(id); else s.add(id); setOn(s); };
  const n = on.size; const all = n === day.items.length;
  return html`<${Sheet} label=${'Add from ' + r.name}><h2>Add from ${shortName(r)}</h2><p class="note">${day.name}. Pick the exercises to add to this workout.</p>
    <button class="btn text" id="ap-all" style="padding-left:0" onClick=${() => setOn(new Set(all ? [] : day.items.map(x => x.id)))}>${all ? 'Select none' : 'Select all'}</button>
    <div id="ap-list">${day.items.map(x => html`<label key=${x.id} class="opt" style="cursor:pointer"><input type="checkbox" id=${'ap-' + x.id} checked=${on.has(x.id)} onChange=${() => tog(x.id)}/>
      <div style="flex:1;min-width:0"><div>${exName(x.ex)}</div><div class="d">${setsLabel(x)}</div></div></label>`)}</div>
    <button class="btn primary wide" id="ap-add" style="margin-top:14px" disabled=${!n} onClick=${() => { closeSheet(); addDayToWorkout(r, day, on); }}>${n ? 'Add ' + (all ? 'all ' : '') + n + ' exercise' + (n === 1 ? '' : 's') : 'Pick at least one'}</button>
    <p class="note" style="margin-top:8px">Added too many? The exercise menu’s Reorder or remove takes any of them out.</p><//>`;
}
