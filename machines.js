/* ============ Machines (Nov 2) ============ */
/* The same exercise on different machines (cable crunch at 130 on one stack, 90 on another). meta.machines[ex] = [names].
   Each set remembers its machine (set.m). Pick a machine on the exercise and the sets left in it switch to it, with
   last time's numbers from that machine; sets already done keep theirs, so you can switch mid-lift. Weight carry-over,
   Last numbers and PRs only compare sets on the same machine. */
const machinesOf = ex => ((S.meta.machines || {})[ex] || []).filter(Boolean);
/* The last sets done on this machine (newest workout first), weights in unit u */
function machinePrev(ex, name, u) {
  const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i]; if (S.active && s.id === S.active.id) continue;
    const sets = []; for (const it of s.items || []) if (it.ex === ex) for (const x of it.sets) if ((x.m || '') === name && +x.r > 0) sets.push({ w: r1(conv(+x.w || 0, it.u || U(), u)), r: +x.r });
    if (sets.length) return { t: s.startedAt, sets };
  }
  return null;
}
function lastMachine(ex) {
  const list = sessionList(); const have = machinesOf(ex);
  for (let i = list.length - 1; i >= 0; i--) for (const it of list[i].items || []) if (it.ex === ex) { const x = it.sets.slice().reverse().find(y => y.m && have.includes(y.m)); if (x) return x.m; }
  return have[0] || '';
}
function applyMachine(it, name, quiet) {
  it.mach = name || ''; const u = it.u || U(); const pv = name ? machinePrev(it.ex, name, u) : null; const kind = exKind(it.ex);
  if (name) { it.prevWhere = 'on ' + name; if (pv) { it.prev = pv.sets; it.prevT = pv.t; } }
  const open = it.sets.filter(x => !isDone(x));
  open.forEach((x, k) => {
    x.m = name || undefined;
    const p = pv ? (pv.sets[k] || pv.sets[pv.sets.length - 1]) : null;
    x.pv = p ? (kind === 'bodyweight' && !p.w ? p.r + ' reps' : fmt(p.w) + ' × ' + p.r) : '';
    if (p) { x.gw = p.w ? String(p.w) : ''; x.gr = String(p.r); } else if (name) { x.gw = ''; }
  });
  if (!quiet) { touch(); showToast({ kind: 'info', text: name ? (pv ? 'On ' + name + '. Weights from last time on it.' : 'On ' + name + '. First time on this machine.') : 'No machine' }); }
}
function initMachine(it) { if (!machinesOf(it.ex).length) return; const m = lastMachine(it.ex); if (m) applyMachine(it, m, true); }
function MachineRow({ it }) {
  const ms = machinesOf(it.ex); if (!ms.length) return null;
  return html`<div class="mach-row" id=${'mach-' + it.id} role="group" aria-label="Machine">${ms.map(m => html`<button key=${m} class=${'chip' + (it.mach === m ? ' on' : '')} aria-pressed=${it.mach === m} onClick=${() => applyMachine(it, it.mach === m ? '' : m)}>${m}</button>`)}
    <button class="chip" aria-label="Edit machines" onClick=${() => openSheet({ type: 'machines', ex: it.ex, itId: it.id })}>${I.edit}</button></div>`;
}
function MachinesSheet({ ex, itId }) {
  const [list, setList] = useState(machinesOf(ex)); const [name, setName] = useState('');
  const save = l => { setList(l); commit(st => { st.meta.machines = { ...(st.meta.machines || {}) }; if (l.length) st.meta.machines[ex] = l; else delete st.meta.machines[ex]; }, 'meta', 300); };
  const add = () => { const n = name.trim().slice(0, 30); if (!n || list.includes(n)) return; const l = list.concat(n); save(l); setName('');
    const it = S.active && S.active.items.find(x => x.id === itId); if (it && !it.mach) applyMachine(it, n, true); touch(); };
  const ren = (i, v) => { const old = list[i]; const n = v.trim().slice(0, 30); if (!n || n === old || list.includes(n)) return; const l = list.slice(); l[i] = n; save(l);
    const ids = Object.values(S.sessions).filter(s => (s.items || []).some(it => it.ex === ex && it.sets.some(x => x.m === old))).map(s => s.id);
    if (ids.length) commit(st => { for (const id of ids) for (const it of st.sessions[id].items || []) if (it.ex === ex) for (const x of it.sets) if (x.m === old) x.m = n; }, ids.map(id => 's_' + id), 300);
    if (S.active) for (const it of S.active.items) if (it.ex === ex) { if (it.mach === old) it.mach = n; for (const x of it.sets) if (x.m === old) x.m = n; } touch(); };
  const del = i => { const l = list.filter((_, k) => k !== i); save(l); if (S.active) for (const it of S.active.items) if (it.ex === ex && it.mach === list[i]) applyMachine(it, '', true); touch(); };
  return html`<${Sheet} label="Machines"><h2>Machines for ${exName(ex)}</h2>
    <p class="note">Name each machine you use for this exercise, like “Left cable stack” or “Gym B”. Weights, last time’s numbers and PRs stay separate for each one. Switch machines from the exercise during a workout.</p>
    <div class="stack" style="margin-top:12px">${list.map((m, i) => html`<div key=${m} class="row" style="gap:8px"><input class="field" style="flex:1" aria-label=${'Machine ' + (i + 1) + ' name'} value=${m} onChange=${e => ren(i, e.target.value)}/><button class="icon-btn" aria-label=${'Remove ' + m} onClick=${() => del(i)}>${I.trash}</button></div>`)}
      <div class="row" style="gap:8px"><input class="field" style="flex:1" id="mach-name" placeholder="New machine name" value=${name} onInput=${e => setName(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') add(); }}/><button class="btn primary" id="mach-add" disabled=${!name.trim()} onClick=${add}>Add</button></div>
      <button class="btn wide" onClick=${closeSheet}>Done</button></div><//>`;
}
