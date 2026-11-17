/* ============ The Plan page (Nov 16, meal planning audit phase 3; Newt approved the mockup) ============
   One question: what is planned, and what needs attention? The dates bar, a summary with one main button, one card per
   date with its meals and their status (coloured chips, decision C), then what to cook for these dates and one button
   for every other planning tool. Tapping a meal opens one sheet for it; each change touches only that meal. */
const SLOT_NAME = { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snack' };
/* Every meal spot of a date, filled or not, in order, with labels (Snack 1 and Snack 2 when there are two) */
function planDayRows(d, m = ML()) {
  const rows = dayRows((m.days || {})[d] || []); const keys = dayKeysFor(+mealHabits().meals).slice();
  for (const r of rows) if (!keys.includes(r.key)) keys.push(r.key);
  const order = ['b', 'l', 'd', 's', 's2', 's3']; keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const two = keys.filter(k => k[0] === 's').length > 1;
  return keys.map(k => { const r = rows.find(y => y.key === k); return { x: r ? r.x : null, key: k, label: k[0] === 's' ? (two ? 'Snack ' + (k === 's' ? 1 : k.slice(1)) : 'Snack') : SLOT_NAME[k] }; });
}
/* Status of a spot: [word, chip class] or null for plain Planned */
function spotStatus(row, ea) {
  const x = row.x; if (!x) return row.key[0] === 's' ? ['Not planned', 'st-none'] : ['Needs a recipe', 'st-need'];
  if (x.off) return ['Eating elsewhere', 'st-none']; if (ea.has(x.id)) return ['Eaten', 'st-eaten']; return null;
}
/* Counts for the summary line */
function planCounts(m = ML()) {
  const ea = eatenIds(m); const c = { planned: 0, need: 0, away: 0, eaten: 0 };
  for (const d of rangeYmds(m.plan)) for (const row of planDayRows(d, m)) { const x = row.x;
    if (!x) { if (row.key[0] !== 's') c.need++; continue; } if (x.off) c.away++; else { c.planned++; if (ea.has(x.id)) c.eaten++; } }
  return c;
}
const openMealPreps = () => { lsSet('plansMode', 'meals'); UI.setView(null); UI.setTab('routines'); scrollTo(0, 0); };
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

function PlanSummary() {
  const m = ML(); const c = planCounts(m); const list = c.planned ? shoppingList() : [];
  const ticked = list.filter(x => m.checks[x.key]).length; const bought = list.length > 0 && ticked === list.length;
  const bits = [c.need ? c.need + ' need' + (c.need === 1 ? 's' : '') + ' a recipe' : '', c.away ? c.away + ' eating elsewhere' : '', c.eaten ? c.eaten + ' eaten' : '',
    !c.planned ? '' : bought ? 'everything bought' : ticked ? ticked + ' of ' + list.length + ' bought' : 'shopping list ready'].filter(Boolean);
  const rot = m.rot; const nx = m.next || [];
  const src = m.gen && mealHabits().starred ? 'From your starred recipes' : m.gen && pickedIds().length ? 'Built around what you picked' : '';
  const more = [src, rot && rotIndex(rot) >= 0 ? 'Rotation: ' + ((prepById(rot.ids[rotIndex(rot)]) || {}).name || 'a prep') + ' this week' : '', nx.length ? pl(nx.length, 'plan') + ' coming up' : ''].filter(Boolean);
  if (!c.planned) return html`<div class="card plan-cta" id="plan-cta"><div style="font-weight:700">Plan your week</div>
    <p class="small muted" style="margin:2px 0 10px">A few questions and Ironwood picks meals with portions for your dates, then fills your cooking and shopping list.</p>
    <button class="btn primary wide" id="plan-start" onClick=${() => openSheet({ type: 'mealTargets' })}>Plan my week</button>
    <button class="btn text wide" id="week-ready" style="margin-top:2px" onClick=${openMealPreps}>or use a saved plan</button>
    ${Object.keys(m.stars || {}).length ? html`<button class="btn wide" id="plan-stars" style="margin-top:6px" onClick=${planFromStars}><span class="st" aria-hidden="true">★</span> Plan from my ${Object.keys(m.stars).length} starred recipes</button>` : null}
    <button class="btn text" id="week-pick" style="padding-left:0" onClick=${() => setMealsMode('recipes')}>Pick recipes myself</button>
    <button class="btn text" id="plan-whole" style="padding-left:0;display:block" onClick=${() => openSheet({ type: 'goalSetup' })}>Or build a training plan and meals together</button>
    ${more.length ? html`<p class="small muted" style="margin-top:4px">${more.join(' · ')}</p>` : null}</div>`;
  return html`<div class="card" id="plan-sum" style="margin-top:2px"><div style="font-weight:700" id="plan-sum-t">${pl(c.planned, 'meal')} planned</div>
    <div class="small muted" style="margin:2px 0 10px" id="plan-sum-d">${bits.join(' · ')}${more.length ? html`<br/>${more.join(' · ')}` : null}</div>
    ${bought ? html`<button class="btn primary wide" id="cook-start" onClick=${() => UI.setView({ type: 'cook' })}>${I.timer} Start cooking</button>
      <button class="btn text wide" id="plan-list" style="margin-top:2px" onClick=${() => setMealsMode('list')}>or open the shopping list</button>`
      : html`<button class="btn primary wide" id="plan-list" onClick=${() => setMealsMode('list')}>Shopping list</button>
      <button class="btn text wide" id="cook-start" style="margin-top:2px" onClick=${() => UI.setView({ type: 'cook' })}>or Start cooking</button>`}</div>`;
}
function PlanDay({ d, ea, t }) {
  const rows = planDayRows(d); const today = ymd(new Date()); const dt = parseYmd(d);
  const eat = rows.filter(r => r.x && r.x.r && !r.x.off && getRecipe(r.x.r)).map(r => r.x); const tot = dayTotals(eat);
  return html`<div id=${'day-' + d}><div class="section-h"><h2>${dayLbl(dt)}</h2>${d === today ? html`<span class="aside">Today</span>` : null}</div>
    <div class="card menu-list" style="padding:4px 14px">${rows.map(row => { const x = row.x; const r = x && x.r ? getRecipe(x.r) : null; const st = spotStatus(row, ea);
      const name = !x ? (row.key[0] === 's' ? 'Add a meal' : 'Pick a recipe') : x.off ? (r ? r.name : x.name || 'Eating elsewhere') : r ? r.name : x.name || 'A meal';
      const sub = !x ? '' : x.off ? 'Not in your cooking or shopping' : r ? portionText(r, x.sv) : 'A note, no recipe';
      return html`<div key=${row.key} class=${'menu-item' + (x && x.off ? ' off' : '')}><button class=${'menu-row' + (x ? '' : ' empty')} id=${'pm-' + d + '-' + row.key} aria-label=${dayLbl(dt) + ', ' + row.label + ': ' + name + (st ? ', ' + st[0] : '')}
          onClick=${() => openSheet({ type: x ? 'planMeal' : 'planSpot', d, k: row.key })}><span class="eyebrow">${row.label}</span><span class="t">${name}</span>${sub ? html`<span class="s">${sub}</span>` : null}${st ? html`<span class=${'chip ' + st[1]}>${st[0]}</span>` : null}</button>
        <span class="chev" aria-hidden="true">${I.back}</span></div>`; })}
      ${eat.length ? html`<div class="small muted num" style="padding:8px 0 6px" id=${'daytot-' + d}>${fmt(tot.kcal)}${t && t.kcal ? ' of ' + fmt(t.kcal) : ''} cal · ${tot.p} g protein</div>` : null}</div></div>`;
}
function CookForDates() {
  const m = ML(); const P = m.plan; const items = P.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r); if (!items.length) return null;
  const total = items.reduce((a, x) => a + servingsFor(x.it), 0);
  return html`<div id="cook-for"><div class="section-h"><h2>Cook for these dates</h2><span class="aside num">${pl(total, 'serving')}</span></div>
    <p class="small muted" style="margin:-4px 0 8px">Worked out from the meals above, for ${pl(P.people, 'person').replace('persons', 'people')}. Change a meal and this follows.</p>
    <div class="stack" style="gap:8px">${items.map(({ it, r }) => { const sv = servingsFor(it); const f = sv / (r.serves || 1); const kn = keepNote(r, it); const ex = extraOf(r.id);
      return html`<div key=${it.id} class="mp-item" style="padding:10px 14px"><button class="mp-name" id=${'cf-' + r.id} onClick=${() => openSheet({ type: 'cookItem', r: r.id })}><div class="t">${r.name}</div>
        <div class="s num">${pl(sv, 'serving')} · ${Math.abs(f - 1) < 0.01 ? '1 batch' : fracStr(f) + ' × recipe'}${ex ? ' · ' + fracStr(ex) + ' extra' : ''}</div></button>${kn ? html`<div class="mp-warn">${kn}</div>` : null}</div>`; })}</div>
    ${sharedBases(items).map(({ base, list }) => html`<div key=${base.id} class="tip-card mix-share" style="margin-top:10px;padding-right:14px">${list.map(x => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} use the same base, so make them in one session: ${list.every(x => MIX_FLAVOR[x.mix.flavor].kind === 'sauce') ? 'cook the ' + base.name.toLowerCase() + ' together, then split it and add each sauce.' : 'season each portion on its own before it cooks, and add any sauce after.'}</div>`)}
    <button class="btn ghost wide" id="plan-extra" style="margin-top:8px" onClick=${() => openSheet({ type: 'planExtra' })}>${I.plus} Make extra for the freezer</button>
    <button class="btn primary wide" id="cook-start-2" style="margin-top:12px" onClick=${() => UI.setView({ type: 'cook' })}>${I.timer} Start cooking</button></div>`;
}
function PlanPage() {
  const m = ML(); const ea = eatenIds(m); const ds = planYmds(); const any = ds.some(d => dayMeals(d).length) || !!m.gen; const t = planT();
  return html`<div>
    ${m.migErr ? html`<div class="tip-card" id="meals-mig-err" role="note" style="margin-bottom:10px;padding-right:14px"><div style="flex:1;min-width:0"><div>Your meal plan couldn’t move to dates in full, so what you’ll cook is kept as a list. Nothing was lost. A backup file helps if you report it.</div>
      <button class="btn" style="margin-top:8px" onClick=${async () => showToast({ kind: 'info', text: await saveBackupFile() })}>Save backup file</button></div></div>` : null}
    <${DatesBar}/>
    <${PlanSummary}/>
    ${any ? html`<${Tip} id="plan-meals" style="margin-top:10px">Tap any meal to change just that meal: replace it, move or copy it, change its servings, or mark it eaten.<//>
      ${ds.map(d => html`<${PlanDay} key=${d} d=${d} ea=${ea} t=${t}/>`)}` : null}
    <${CookForDates}/>
    <button class="btn wide" id="plan-tools" style="margin-top:14px" onClick=${openPlanTools}>More planning tools</button>
    <p class="small muted" style="text-align:center;margin-top:4px">Different meals, saved plans, rotation, plan settings, clear</p>
    ${m.gen ? html`<p class="small faint" style="margin-top:8px">${NOT_ADVICE}</p>` : null}
  </div>`;
}

/* ---- the meal sheet ---- */
function PlanMealSheet({ d, k: key }) {
  const m = ML(); const row = planDayRows(d).find(r => r.key === key); const x = row && row.x; if (!x) return html`<${PlanSpotSheet} d=${d} k=${key}/>`;
  const r = x.r ? getRecipe(x.r) : null; const ea = eatenIds(m).has(x.id); const dt = parseYmd(d); const mac = r && macros(r);
  const undo = () => { const s0 = daysSnap(); return () => daysRestore(s0); };
  const act = (fn, text) => { const u = undo(); fn(); closeSheet(); showToast({ kind: 'info', text, action: 'Undo', ms: 5000, fn: u }); };
  const pick = () => openSheet({ type: 'recipePick', cat: r ? r.cat : CAT_FOR_SLOT[x.slot], cur: x.r, title: r ? 'Replace ' + r.name : 'Pick a recipe', onPick: id => { const u = undo(); replaceMeal(d, x.id, id); showToast({ kind: 'info', text: getRecipe(id).name + ' for ' + dayLbl(dt) + ' ' + row.label.toLowerCase() + '. Nothing else changed.', action: 'Undo', ms: 5000, fn: u }); } });
  const dow = DOW_FULL[dt.getDay()]; const rule = ruleOff(m, d, key);
  const opt = (id, t, dd, fn, danger) => html`<button key=${id} class=${'opt' + (danger ? ' danger' : '')} id=${id} onClick=${fn}><div style="flex:1"><div>${t}</div>${dd ? html`<div class="d">${dd}</div>` : null}</div></button>`;
  return html`<${Sheet} label=${row.label + ', ' + dayLbl(dt)}><div class="eyebrow">${dayLbl(dt)} · ${row.label}</div><h2>${r ? r.name : x.name || 'A meal'}</h2>
    <p class="note">${[x.off ? 'Eating elsewhere' : r ? portionText(r, x.sv) : 'A note, no recipe', mac && !x.off ? fmt(Math.round(mac.kcal * x.sv)) + ' kcal · ' + Math.round(mac.p * x.sv) + ' g protein' : '', ea ? 'Eaten' : ''].filter(Boolean).join(' · ')}</p>
    ${ea ? html`<p class="small muted" style="margin-top:8px">You logged this meal. To change it, remove it from Log first.</p>
      <div class="stack" style="margin-top:10px;gap:4px">${r ? opt('pms-open', 'Open recipe', '', () => { closeSheet(); UI.setView({ type: 'meal', id: r.id }); }) : null}</div>`
    : html`${r && !x.off ? html`<div class="card mp-scale" style="margin-top:10px"><div style="flex:1"><div style="font-weight:700">Servings</div><div class="small muted">For this meal only</div></div>
        <${MStep} label="servings for this meal" value=${x.sv} min=${0.5} max=${6} step=${0.5} onChange=${v => setMealSv(d, x.id, v)}/></div>` : null}
      <div class="stack" style="margin-top:10px;gap:4px">
        ${r && !x.off ? opt('pms-eaten', 'Mark as eaten', 'Logs ' + fracStr(x.sv) + ' serving' + (x.sv === 1 ? '' : 's') + ' to ' + (d === ymd(new Date()) ? 'today' : dayLbl(dt)), () => { const e = logRecipe(d, r, x.sv, { pm: x.id, slot: key }); closeSheet(); if (e) showToast({ kind: 'info', text: r.name + ' logged', action: 'Undo', ms: 5000, fn: () => dropLog(d, e.id) }); }) : null}
        ${opt('pms-replace', r ? 'Replace' : 'Pick a recipe', r ? 'Pick another recipe for this meal' : 'Turn this note into a recipe', pick)}
        ${opt('pms-move', 'Move', 'To another day or meal', () => openSheet({ type: 'planTarget', d, id: x.id, k: key, mode: 'move' }))}
        ${opt('pms-copy', 'Copy', 'To other days, e.g. every ' + row.label.toLowerCase() + ' these days', () => openSheet({ type: 'planTarget', d, id: x.id, k: key, mode: 'copy' }))}
        ${x.off ? opt('pms-back', 'Plan it again', 'Back into your cooking and shopping', () => act(() => setMealOff(d, x.id, false), 'Back on the plan.'))
          : opt('pms-away', 'Eating elsewhere', 'This day only. Leaves it out of cooking and shopping', () => act(() => setMealOff(d, x.id, true), 'Eating elsewhere, ' + dayLbl(dt) + '.'))}
        ${opt('pms-rule', rule ? 'Plan ' + dow + ' ' + row.label.toLowerCase() + ' again' : 'Eating elsewhere every ' + dow, rule ? 'Stops skipping it every week' : 'Like lunch at work. Future plans skip it too', () => act(() => toggleOffMeal(d, key), rule ? 'Planned again on ' + dow + 's.' : 'Skipped every ' + dow + '.'))}
        ${r ? opt('pms-open', 'Open recipe', '', () => { closeSheet(); UI.setView({ type: 'meal', id: r.id }); }) : null}
        ${opt('pms-remove', 'Remove from this day', 'Leaves this meal empty', () => act(() => removeMeal(d, x.id), 'Removed from ' + dayLbl(dt) + '.'), true)}</div>`}
    <button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Done</button><//>`;
}
const CAT_FOR_SLOT = { b: 'breakfast', l: 'main', d: 'main', s: 'snack' };
/* Tapping an empty meal: starred and recent recipes of that kind first, a note, or eating elsewhere */
function PlanSpotSheet({ d, k: key }) { const dt = parseYmd(d); const row = planDayRows(d).find(r => r.key === key) || { label: SLOT_NAME[key[0]] }; const cat = CAT_FOR_SLOT[key[0]];
  const [note, setNote] = useState(null);
  const recent = []; for (let i = 0; i < 21 && recent.length < 6; i++) for (const e of ML().log[ymd(addDays(new Date(), -i))] || []) if (e.r && !recent.includes(e.r) && getRecipe(e.r)) recent.push(e.r);
  const st = Object.keys(ML().stars || {}).filter(id => getRecipe(id) && getRecipe(id).cat === cat);
  const list = [...new Set([...st, ...recent.filter(id => getRecipe(id).cat === cat)])].slice(0, 6).map(getRecipe);
  const put = o => { const s0 = daysSnap(); addMealAt(d, key, o); closeSheet(); showToast({ kind: 'info', text: (o.r ? getRecipe(o.r).name : o.off ? 'Eating elsewhere' : o.name) + ' for ' + dayLbl(dt) + ' ' + row.label.toLowerCase() + '.', action: 'Undo', ms: 5000, fn: () => daysRestore(s0) }); };
  const opt = (id, t, dd, fn) => html`<button key=${id} class="opt" id=${id} onClick=${fn}><div style="flex:1;min-width:0"><div>${t}</div>${dd ? html`<div class="d">${dd}</div>` : null}</div></button>`;
  return html`<${Sheet} label=${row.label + ', ' + dayLbl(dt)}><div class="eyebrow">${dayLbl(dt)} · ${row.label}</div><h2>${key[0] === 's' ? 'Add a meal' : 'Pick a recipe'}</h2>
    <p class="note">${key[0] === 's' ? 'Nothing planned here yet.' : 'This meal needs a recipe.'}${list.length ? ' Starred and recent ones come first.' : ''}</p>
    ${note != null ? html`<div class="stack" style="margin-top:10px"><label class="lbl" for="spot-note">Note</label><input class="field" id="spot-note" placeholder="e.g. Dinner at my parents" value=${note} onInput=${e => setNote(e.target.value)}/>
        <button class="btn primary wide" id="spot-note-save" disabled=${!note.trim()} onClick=${() => put({ name: note.trim() })}>Save note</button><button class="btn wide" onClick=${() => setNote(null)}>Back</button></div>`
    : html`<div class="stack" style="margin-top:10px;gap:6px">${list.map(r => opt('spot-' + r.id, (isStarred(r.id) ? '★ ' : '') + r.name, [macroLine(macros(r)), r.mins ? r.mins + ' min' : ''].filter(Boolean).join(' · '), () => put({ r: r.id })))}
      ${opt('spot-all', 'All recipes…', MEAL_CAT_NAME[cat] ? MEAL_CAT_NAME[cat] + ' first, or search everything' : '', () => openSheet({ type: 'recipePick', cat, title: 'Pick a recipe', onPick: id => put({ r: id }) }))}
      ${opt('spot-note', 'Just a note, no recipe', 'e.g. Dinner at my parents', () => setNote(''))}
      ${opt('spot-away', 'Eating elsewhere', 'Leaves it out of cooking and shopping', () => put({ name: 'Eating elsewhere', off: true }))}</div>
      <button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Cancel</button>`}<//>`;
}
/* Move or copy a meal: pick the day (and meal, for Move) */
function PlanTargetSheet({ d, id, k: key, mode }) {
  const m = ML(); const ea = eatenIds(m); const today = ymd(new Date()); const x = mealIn(m, d, id); const [sel, setSel] = useState([]);
  if (!x) return null; const r = x.r ? getRecipe(x.r) : null; const nm = r ? r.name : x.name;
  const ds = planYmds().filter(dd => dd >= today || dd === d);
  const back = () => openSheet({ type: 'planMeal', d, k: key });
  if (mode === 'move') return html`<${Sheet} label=${'Move ' + nm}><h2>Move ${nm}</h2><p class="note">Pick where it goes. Whatever is there now takes its place here.</p>
    <div class="stack" style="margin-top:10px;gap:4px" id="pt-list">${ds.flatMap(dd => planDayRows(dd).filter(rw => !(dd === d && rw.key === key) && !(rw.x && ea.has(rw.x.id))).map(rw => {
      const on = rw.x ? (rw.x.r ? (getRecipe(rw.x.r) || {}).name : rw.x.name) : 'empty';
      return html`<button key=${dd + rw.key} class="opt" id=${'pt-' + dd + '-' + rw.key} onClick=${() => { const s0 = daysSnap(); moveMeal(d, id, dd, rw.key); closeSheet(); showToast({ kind: 'info', text: nm + ' moved to ' + dayLbl(parseYmd(dd)) + ' ' + rw.label.toLowerCase() + '.', action: 'Undo', ms: 5000, fn: () => daysRestore(s0) }); }}>
        <div style="flex:1;min-width:0"><div>${dayLbl(parseYmd(dd))} · ${rw.label}</div><div class="d">Now: ${on}</div></div></button>`; }))}</div>
    <button class="btn wide" style="margin-top:10px" onClick=${back}>Back</button><//>`;
  const spots = ds.filter(dd => dd !== d).map(dd => { const rw = planDayRows(dd).find(z => z.key === key); return { dd, rw, locked: !!(rw && rw.x && ea.has(rw.x.id)) }; });
  const free = spots.filter(s => !s.locked).map(s => s.dd);
  const tog = dd => setSel(sel.includes(dd) ? sel.filter(z => z !== dd) : sel.concat(dd));
  const label = (planDayRows(d).find(z => z.key === key) || {}).label || 'meal';
  return html`<${Sheet} label=${'Copy ' + nm}><h2>Copy ${nm}</h2><p class="note">Pick the days for ${label.toLowerCase()}. What’s there now is replaced; eaten meals stay.</p>
    <button class="btn text" id="pt-all" style="padding-left:0" onClick=${() => setSel(sel.length === free.length ? [] : free)}>${sel.length === free.length ? 'Clear' : 'Every ' + label.toLowerCase() + ' these days'}</button>
    <div class="stack" style="gap:4px" id="pt-list">${spots.map(({ dd, rw, locked }) => { const on = sel.includes(dd); const cur = rw && rw.x ? (rw.x.r ? (getRecipe(rw.x.r) || {}).name : rw.x.name) : 'empty';
      return html`<button key=${dd} class=${'opt' + (on ? ' on' : '')} id=${'pt-' + dd} aria-pressed=${on} disabled=${locked} onClick=${() => tog(dd)}><div style="flex:1;min-width:0"><div>${dayLbl(parseYmd(dd))}</div><div class="d">${locked ? 'Eaten' : 'Now: ' + cur}</div></div>${on ? I.check : null}</button>`; })}</div>
    <div class="stack" style="margin-top:10px"><button class="btn primary wide" id="pt-apply" disabled=${!sel.length} onClick=${() => { const s0 = daysSnap(); const n = copyMeal(d, id, sel.map(dd => [dd, key])); closeSheet(); showToast({ kind: 'info', text: 'Copied to ' + pl(n, 'day') + '.', action: 'Undo', ms: 5000, fn: () => daysRestore(s0) }); }}>${sel.length ? 'Copy to ' + pl(sel.length, 'day') : 'Pick days'}</button>
      <button class="btn wide" onClick=${back}>Back</button></div><//>`;
}
/* A recipe in Cook for these dates */
function CookItemSheet({ r: rid }) {
  const P = ML().plan; const it = P.items.find(i => i.r === rid); const r = getRecipe(rid); if (!it || !r) return html`<${Sheet} label="Recipe"><p class="note">This recipe is no longer on the plan.</p><button class="btn wide" onClick=${closeSheet}>Done</button><//>`;
  const dd = spanDays(P); const short = dd < 7; const where = [];
  for (const d of planYmds()) for (const row of planDayRows(d)) if (row.x && row.x.r === rid && !row.x.off) where.push(DOW[parseYmd(d).getDay()] + ' ' + row.label.toLowerCase());
  const opt = (id, t, d2, fn, danger) => html`<button class=${'opt' + (danger ? ' danger' : '')} id=${id} onClick=${fn}><div style="flex:1"><div>${t}</div>${d2 ? html`<div class="d">${d2}</div>` : null}</div></button>`;
  return html`<${Sheet} label=${r.name}><h2>${r.name}</h2><p class="note">${pl(servingsFor(it), 'serving')}${where.length ? ' · ' + where.slice(0, 8).join(', ') + (where.length > 8 ? ' and more' : '') : ''}</p>
    <div class="card" style="margin-top:10px"><div class="row"><span style="flex:1;font-weight:600">${short ? 'Times in these ' + dd + ' days' : 'Times a week'}${P.people > 1 ? ', per person' : ''}</span>${short
      ? html`<${MStep} label=${'times in these days for ' + r.name} value=${Math.max(1, Math.ceil(it.sv - 0.02))} min=${1} max=${Math.max(1, Math.floor(3 * dd))} onChange=${v => setTimes(rid, v)}/>`
      : html`<${MStep} label=${'times a week for ' + r.name} value=${Math.max(1, Math.round(it.n))} min=${1} max=${21} onChange=${v => setTimes(rid, Math.max(1, Math.ceil(v * dd / 7 - 0.02)))}/>`}</div>
      <p class="small muted" style="margin-top:4px">More goes into free meals of its kind; fewer comes off the last days first.</p></div>
    <div class="stack" style="margin-top:10px;gap:4px">${opt('ci-open', 'Open recipe', '', () => { closeSheet(); UI.setView({ type: 'meal', id: rid }); })}
      ${opt('ci-swap', 'Swap everywhere', 'Another recipe on the same days and meals', () => swapPlanItem(it.id))}
      ${opt('ci-remove', 'Remove from these dates', 'Its meals become empty', () => { const s0 = daysSnap(); removeFromPlan(rid); closeSheet(); showToast({ kind: 'info', text: r.name + ' removed.', action: 'Undo', ms: 5000, fn: () => daysRestore(s0) }); }, true)}</div>
    <button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Done</button><//>`;
}
/* Make extra for the freezer */
function PlanExtraSheet() {
  const items = ML().plan.items.map(i => getRecipe(i.r)).filter(Boolean); const [, setT] = useState(0);
  const ids = [...new Set(items.map(r => r.id).concat((ML().days[planYmds()[0]] || []).filter(x => x.slot === 'x' && !x.sp && x.r).map(x => x.r)))].filter(getRecipe);
  return html`<${Sheet} label="Make extra"><h2>Make extra</h2><p class="note">Extra servings to cook with this batch, for the freezer or to share. They go on the shopping list but not on any day.</p>
    <div class="stack" style="margin-top:10px;gap:8px" id="extra-list">${ids.map(id => { const r = getRecipe(id); const n = extraOf(id);
      return html`<div key=${id} class="row"><span style="flex:1;min-width:0;font-weight:600">${r.name}</span><${MStep} label=${'extra servings of ' + r.name} value=${n} min=${0} max=${20} onChange=${v => { setExtra(id, v); setT(x => x + 1); }}/></div>`; })}</div>
    <button class="btn ghost wide" style="margin-top:10px" id="extra-add" onClick=${() => openSheet({ type: 'recipePick', title: 'Make extra of…', back: { type: 'planExtra' }, onPick: id => setExtra(id, Math.max(1, extraOf(id))) })}>${I.plus} Another recipe</button>
    <button class="btn primary wide" style="margin-top:8px" onClick=${closeSheet}>Done</button><//>`;
}
/* Different meals for the days you pick */
function PlanRerollSheet() {
  const today = ymd(new Date()); const ds = planYmds().filter(d => d >= today); const [sel, setSel] = useState(ds);
  const go = () => { const g = ML().gen; const res = genFill((g.seed + 7919) % 1e6, { replace: true, from: today, only: sel }); closeSheet();
    showToast({ kind: 'info', text: res ? 'New meals for ' + pl(sel.length, 'day') + (res.kept ? '; kept the ' + res.kept + ' you set' : '') + '.' : 'Not enough other recipes fit your answers and food preferences.' }); };
  return html`<${Sheet} label="Different meals"><h2>Different meals</h2><p class="note">The plan picks again for the days you choose. Meals you set yourself and eaten ones stay.</p>
    <div class="stack" style="margin-top:10px;gap:4px">${ds.map(d => { const on = sel.includes(d); return html`<button key=${d} class=${'opt' + (on ? ' on' : '')} id=${'rr-' + d} aria-pressed=${on} onClick=${() => setSel(on ? sel.filter(x => x !== d) : sel.concat(d))}><div style="flex:1">${dayLbl(parseYmd(d))}</div>${on ? I.check : null}</button>`; })}</div>
    <div class="stack" style="margin-top:10px"><button class="btn primary wide" id="rr-go" disabled=${!sel.length} onClick=${go}>${sel.length ? 'New meals for ' + pl(sel.length, 'day') : 'Pick days'}</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* People and how amounts look */
function PlanHouseholdSheet() {
  const P = ML().plan;
  return html`<${Sheet} label="People and amounts"><h2>People and amounts</h2><p class="note">How many people you cook for. Meals stay per person; cooking and the shopping list multiply.</p>
    <div class="card mp-who" style="margin-top:10px"><div class="mp-cell"><div class="lbl">People</div><${MStep} label="people" value=${P.people} min=${1} max=${12} onChange=${v => mealCommit(mm => { mm.plan.people = v; })}/></div></div>
    <div style="margin-top:12px"><span class="lbl">Amounts</span><${UnitsSeg}/></div>
    <button class="btn primary wide" style="margin-top:12px" onClick=${closeSheet}>Done</button><//>`;
}
/* More planning tools: everything else, smaller changes first and Clear everything last */
function openPlanTools() {
  const m = ML(); const nSkip = (m.rules || []).length; const nTick = Object.values(m.checks || {}).filter(Boolean).length; const P = m.plan;
  const ask = (title, body, ok, fn) => openSheet({ type: 'confirm', title, body, ok, onOk: () => { fn(); closeSheet(); } });
  const acts = [
    m.gen && ['wt-reroll', 'Different meals', 'Pick which days get new meals. Yours stay.', () => openSheet({ type: 'planReroll' })],
    m.gen && !P.fromMenu && ['plan-use', 'Use the meal plan for every meal', 'Replaces what you picked' + (m.rot ? ' and stops your rotation' : '') + '.', () => usePlanForPrep(false)],
    ['wt-settings', 'Plan settings', 'Calories, how you eat, kitchen gear.', () => openSheet({ type: 'mealTargets' })],
    ['plan-prefs', 'Food preferences', prefsOf().allergies.length || prefsOf().diets.length || prefsOf().dislikes ? 'Set. Allergies, diet, dislikes, swaps.' : 'Allergies, diet, dislikes, swaps.', () => openSheet({ type: 'mealPrefs' })],
    ['plan-people', 'People and amounts', P.people + (P.people === 1 ? ' person' : ' people') + ' · ' + (ML().units === 'weight' ? 'by weight' : 'easy amounts'), () => openSheet({ type: 'planHousehold' })],
    !mealHabits().starred && Object.keys(m.stars || {}).length && ['plan-use-stars', 'Plan from my ' + Object.keys(m.stars).length + ' starred recipes', 'Builds the meals from your stars.', () => { closeSheet(); planFromStars(); }],
    ['plan-preps', 'Saved and ready-made preps', 'Use one now or plan it for later dates.', () => { closeSheet(); openMealPreps(); }],
    P.items.length && ['prep-save', 'Save these meals as a prep', 'Use them again or put them in a rotation.', () => openSheet({ type: 'prepSave' })],
    ['plan-ahead-btn', 'Plan ahead', (m.next || []).length ? pl(m.next.length, 'plan') + ' coming up.' : 'Line up the next dates with a prep.', () => openSheet({ type: 'planAhead' })],
    ['rot-setup', m.rot ? 'Edit the rotation' : 'Rotate preps week by week', m.rot ? 'Rotating ' + m.rot.ids.length + ' preps.' : '2 to 4 preps, one each week.', () => openSheet({ type: 'rotation' })],
    m.rot && ['rot-stop', 'Stop rotating', 'This week’s meals stay.', () => { mealCommit(mm => { delete mm.rot; }); closeSheet(); }],
    nSkip && ['wt-unskip', 'Bring back skipped meals', pl(nSkip, 'meal') + ' skipped every week.', () => ask('Bring back skipped meals?', 'They go back into your cooking and shopping list.', 'Bring them back', () => mealCommit(mm => { delete mm.rules; const o = placeOpts(mm); for (const d of o.dates) for (const x of mm.days[d] || []) if (d >= o.from && x.off && x.r) delete x.off; }))],
    nTick && ['wt-untick', 'Untick the shopping list', pl(nTick, 'item') + ' ticked.', () => ask('Untick the shopping list?', 'Every item goes back to not bought. Nothing else changes.', 'Untick all', () => mealCommit(mm => { mm.checks = {}; }))],
    m.gen && ['wt-drop-menu', 'Stop the meal plan', 'Keeps these meals; the plan won’t pick for new dates.', () => ask('Stop the meal plan?', 'The meals on your dates stay as they are, as yours. New dates start empty.', 'Stop it', () => mealCommit(mm => { delete mm.gen; delete mm.plan.fromMenu; const o = placeOpts(mm); for (const d of o.dates) for (const x of mm.days[d] || []) if (x.by === 'plan') { x.by = 'you'; x.sp = 1; } }))],
    P.items.length && ['wt-empty-cook', 'Empty these dates', 'Takes every meal off these dates. Eaten ones stay.', () => ask('Empty these dates?', 'Every meal comes off and the shopping list starts fresh.' + (m.gen ? ' Different meals or Plan my week fills them again.' : ''), 'Empty them', () => mealCommit(mm => { dClear(mm, placeOpts(mm)); delete mm.plan.fromMenu; mm.checks = {}; delete mm.rot; }))],
    (m.gen || P.items.length) && ['plan-clear', 'Clear everything and start over', 'Asks first. Saved preps, recipes and preferences stay.', () => clearMealPlan(), true],
  ].filter(Boolean);
  openSheet({ type: 'planMore', title: 'More planning tools', acts });
}
