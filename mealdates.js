/* ============ Dates, swaps, stars, planning ahead and the Meals tour (Nov 11, Newt) ============
   plan.start: first day 'YYYY-MM-DD' (unset = no dates yet, a rolling week); plan.days: 1–28. An item's n stays a rate
   ("times a week"), so a 4-day stretch makes 4/7 of the servings, rounded up; under a week the screen shows the count
   for those days instead. meals.prepDay: 0–6 (Sunday = 0, the default) is the day your weeks start, for rotations and
   "until my prep day". meals.next: [{ id, name, start, days, items: [[recipe id, n]] }] are stretches planned ahead;
   each loads on its first day with a fresh shopping list. meals.stars: { recipe id: true }. */
const prepDow = () => { const v = ML().prepDay; return Number.isInteger(v) && v >= 0 && v <= 6 ? v : 0; };
const prepWeekStart = (d = new Date(), dow = prepDow()) => { const x = startOfDay(d); return addDays(x, -((x.getDay() - dow + 7) % 7)); };
const spanDays = (P = ML().plan) => P.days || 7 * (P.weeks || 1);
function planSpan(P = ML().plan) { const days = spanDays(P); const start = P.start ? parseYmd(P.start) : null; return { start, days, end: start ? addDays(start, days - 1) : null }; }
const dayLbl = d => DOW[d.getDay()] + ' ' + MON[d.getMonth()] + ' ' + d.getDate();
const daysTxt = n => n + (n === 1 ? ' day' : ' days');
const rangeText = (start, days) => dayLbl(start) + (days > 1 ? ' – ' + dayLbl(addDays(start, days - 1)) : '') + ' · ' + daysTxt(days);
function spanText(P = ML().plan) { const s = planSpan(P); return s.start ? rangeText(s.start, s.days) : 'No dates yet · ' + (s.days === 7 ? 'a week' : daysTxt(s.days)); }
/* Days from start through the day before your next prep day (a full week when start is a prep day) */
const untilPrepDay = start => (prepDow() - startOfDay(start).getDay() + 7) % 7 || 7;
const round2 = v => Math.round(v * 100) / 100;
/* How many servings a rate makes over a stretch (0.02 absorbs rounding in stored rates) */
const servingsOver = (n, days, people = 1) => Math.max(1, Math.ceil(n * people * days / 7 - 0.02));
const planEnded = (P = ML().plan) => { const s = planSpan(P); return !!(s.end && ymd(s.end) < ymd(new Date())); };
function setPlanDates(start, days) {
  mealCommit(mm => { if (start) mm.plan.start = ymd(start); else delete mm.plan.start; mm.plan.days = clampInt(days, 1, 28, 7); mm.plan.weeks = Math.max(1, Math.min(4, Math.round(mm.plan.days / 7))); });
}
/* The stretch after the current one: from the day after it ends (or today), up to your prep day */
function nextStretch() {
  const q = ML().next || []; const last = q.reduce((a, x) => { const e = addDays(parseYmd(x.start), x.days); return !a || e > a ? e : a; }, null);
  const s = planSpan(); let start = last || (s.end && s.end >= startOfDay(new Date()) ? addDays(s.end, 1) : prepWeekStart(addDays(new Date(), 7)));
  if (!last && !s.end) start = addDays(prepWeekStart(), 7);
  return { start, days: untilPrepDay(start) };
}

/* ---- the calendar ---- */
function RangeCal({ start, days, onChange, idp = 'cal' }) {
  const s0 = start ? startOfDay(start) : startOfDay(new Date());
  const [mo, setMo] = useState(() => new Date(s0.getFullYear(), s0.getMonth(), 1));
  const [picking, setPicking] = useState('start');
  const end = start ? addDays(startOfDay(start), days - 1) : null;
  const today = startOfDay(new Date()); const minDay = addDays(today, -7);
  const first = new Date(mo.getFullYear(), mo.getMonth(), 1); const lead = first.getDay(); const nDays = new Date(mo.getFullYear(), mo.getMonth() + 1, 0).getDate();
  const cells = []; for (let i = 0; i < lead; i++) cells.push(null); for (let d = 1; d <= nDays; d++) cells.push(new Date(mo.getFullYear(), mo.getMonth(), d));
  const tap = d => {
    if (picking === 'end' && start && d >= startOfDay(start)) { const n = Math.round((+d - +startOfDay(start)) / DAY) + 1; if (n <= 28) { onChange(start, n); setPicking('start'); return; } }
    onChange(d, 1); setPicking('end');
  };
  const quick = start ? [[untilPrepDay(start), 'Until ' + DOW_FULL[prepDow()]], [7, '1 week'], [14, '2 weeks'], [21, '3 weeks'], [28, '4 weeks']].filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i) : [];
  return html`<div class="rcal" id=${idp}>
    <div class="row rcal-h"><button class="btn text" aria-label="Previous month" onClick=${() => setMo(new Date(mo.getFullYear(), mo.getMonth() - 1, 1))}>‹</button>
      <div style="flex:1;text-align:center;font-weight:700">${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo.getMonth()]} ${mo.getFullYear()}</div>
      <button class="btn text" aria-label="Next month" onClick=${() => setMo(new Date(mo.getFullYear(), mo.getMonth() + 1, 1))}>›</button></div>
    <div class="rcal-g" role="grid">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => html`<div key=${'h' + i} class=${'rcal-dow' + (i === prepDow() ? ' prep' : '')} aria-hidden="true">${l}</div>`)}
      ${cells.map((d, i) => { if (!d) return html`<div key=${'e' + i}></div>`;
        const inR = start && d >= startOfDay(start) && d <= end; const isS = start && +d === +startOfDay(start); const isE = end && +d === +end;
        return html`<button key=${i} id=${idp + '-' + ymd(d)} class=${'rcal-d' + (inR ? ' in' : '') + (isS ? ' rs' : '') + (isE ? ' re' : '') + (+d === +today ? ' today' : '') + (d.getDay() === prepDow() ? ' prep' : '')} disabled=${d < minDay} aria-pressed=${!!inR} aria-label=${dayLbl(d) + (isS ? ', first day' : isE ? ', last day' : '')} onClick=${() => tap(d)}>${d.getDate()}</button>`; })}</div>
    <p class="small muted" style="margin:6px 0 0">${picking === 'end' ? 'Now tap the last day, or pick a length below.' : 'Tap the first day, then the last day.'} Your prep day is underlined.</p>
    ${quick.length ? html`<div class="chips" style="margin-top:6px">${quick.map(([n, l]) => html`<button key=${l} class=${'chip' + (days === n ? ' on' : '')} aria-pressed=${days === n} onClick=${() => { onChange(start, n); setPicking('start'); }}>${l}</button>`)}</div>` : null}
  </div>`;
}
function PrepDayPick() {
  const v = prepDow();
  return html`<div id="prep-day"><span class="lbl">I usually prep on</span><div class="seg wide" role="group" aria-label="Usual prep day" style="margin-top:6px">${DOW.map((l, i) => html`<button key=${i} id=${'prepday-' + i} class=${v === i ? 'on' : ''} aria-pressed=${v === i} aria-label=${DOW_FULL[i]} onClick=${() => mealCommit(mm => { mm.prepDay = i; })}>${l[0]}</button>`)}</div>
    <p class="small muted" style="margin-top:4px">Rotations switch on this day, and “Until ${DOW_FULL[v]}” plans a short stretch to get you there.</p></div>`;
}
function PlanDatesSheet({ start: s0, days: d0 }) {
  const sp = planSpan(); const [st, setSt] = useState(() => s0 || sp.start || startOfDay(new Date())); const [days, setDays] = useState(() => d0 || (sp.start ? sp.days : untilPrepDay(s0 || new Date())));
  const save = () => { setPlanDates(st, days); closeSheet(); showToast({ kind: 'info', text: 'Planning ' + rangeText(st, days) + '. Servings and the shopping list match.' }); };
  return html`<${Sheet} label="Plan dates"><h2>Your dates</h2><p class="note">Pick the days this plan covers. Servings and the shopping list scale to the number of days.</p>
    <div class="stack" style="margin-top:10px"><${RangeCal} start=${st} days=${days} onChange=${(s, n) => { setSt(s); setDays(n); }}/>
      <div class="card small" id="pd-sum" style="font-weight:600">${rangeText(st, days)}</div>
      <${PrepDayPick}/>
      <button class="btn primary wide" id="pd-save" onClick=${save}>Use these dates</button>
      ${ML().plan.start ? html`<button class="btn text" id="pd-clear" onClick=${() => { setPlanDates(null, 7); closeSheet(); }}>Clear the dates</button>` : null}
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
function DatesBar() {
  const s = planSpan(); const ended = planEnded(); const q = ML().next || [];
  return html`<div class="card dates-bar" id="plan-dates"><div class="row" style="gap:10px"><span class="dates-ic" aria-hidden="true">${I.cal}</span>
      <div style="flex:1;min-width:0"><div style="font-weight:700" id="plan-dates-t">${spanText()}</div><div class="small muted">You prep on ${DOW_FULL[prepDow()]}s${q.length ? ' · ' + q.length + ' coming up' : ''}</div></div>
      <button class="btn" id="plan-dates-btn" onClick=${() => openSheet({ type: 'planDates' })}>${s.start ? 'Change' : 'Pick dates'}</button></div>
    ${ended ? html`<p class="small" id="plan-ended" style="margin-top:8px">This plan ended ${dayLbl(s.end)}. <button class="btn text" style="padding:0;min-height:0" onClick=${() => { const n = nextStretch(); openSheet({ type: 'planDates', start: n.start, days: n.days }); }}>Set dates for the next one</button></p>` : null}</div>`;
}

/* ---- swapping recipes ---- */
function RecipePickSheet({ cat, title, cur, onPick, back }) {
  const [q, setQ] = useState(''); const [all, setAll] = useState(!cat);
  const st = ML().stars || {}; const term = q.trim().toLowerCase();
  const list = allRecipes().filter(r => r.id !== cur && (all || r.cat === cat) && r.cat !== 'base' && (!term || (r.name + ' ' + (r.ing || []).map(g => g.n).join(' ')).toLowerCase().includes(term)))
    .map(r => ({ r, bad: recipeIssues(r).block.length > 0, star: !!st[r.id] })).sort((a, b) => (a.bad - b.bad) || (b.star - a.star) || a.r.name.localeCompare(b.r.name));
  const done = () => { if (back) openSheet(back); else closeSheet(); };
  return html`<${Sheet} label=${title}><h2>${title}</h2><p class="note">Starred recipes come first. Anything against your food preferences is at the bottom.</p>
    <input class="field" type="search" id="rp-q" placeholder="Search recipes or ingredients" value=${q} onInput=${e => setQ(e.target.value)} style="margin-top:8px"/>
    ${cat ? html`<div class="seg wide" role="group" style="margin-top:8px"><button class=${!all ? 'on' : ''} aria-pressed=${!all} onClick=${() => setAll(false)}>${MEAL_CAT_NAME[cat] || 'Same kind'}</button><button class=${all ? 'on' : ''} aria-pressed=${all} id="rp-all" onClick=${() => setAll(true)}>All recipes</button></div>` : null}
    <div class="stack rp-list" style="margin-top:10px;gap:6px">${list.slice(0, 80).map(({ r, bad, star }) => html`<button key=${r.id} class="opt" id=${'rp-' + r.id} onClick=${() => { onPick(r.id); done(); }}>
      <div style="flex:1;min-width:0"><div>${star ? '★ ' : ''}${r.name}</div><div class="d">${[macroLine(macros(r)), r.mins ? r.mins + ' min' : '', bad ? 'has ' + recipeIssues(r).block.join(', ') : ''].filter(Boolean).join(' · ')}</div></div></button>`)}
      ${list.length ? null : html`<p class="note">No recipes match.</p>`}</div>
    <button class="btn wide" style="margin-top:10px" onClick=${done}>Cancel</button><//>`;
}
function swapPlanItem(itId) {
  const it = ML().plan.items.find(i => i.id === itId); const r = it && getRecipe(it.r); if (!r) return;
  openSheet({ type: 'recipePick', cat: r.cat, cur: r.id, title: 'Swap ' + r.name, onPick: id => {
    mealCommit(mm => { const dup = mm.plan.items.find(i => i.r === id); const x = mm.plan.items.find(i => i.id === itId); if (!x) return; if (dup && dup !== x) { dup.n = round2(dup.n + x.n); mm.plan.items = mm.plan.items.filter(i => i !== x); } else x.r = id; delete mm.plan.fromMenu; });
    showToast({ kind: 'info', text: 'Swapped in ' + getRecipe(id).name + '. The shopping list is updated.' }); } });
}

/* ---- using a prep: swap recipes, pick dates, now or later ---- */
const PREP_DRAFT = { d: null };
function openUsePrep(pr, later) {
  const n = later ? nextStretch() : null; const sp = planSpan();
  PREP_DRAFT.d = { id: pr.id, name: pr.name, orig: pr.items.map(x => x[0]), items: pr.items.filter(([r]) => getRecipe(r)).map(([r, k]) => [r, k]), when: later ? 'later' : 'now',
    start: later ? n.start : sp.start || startOfDay(new Date()), days: later ? n.days : sp.start ? sp.days : untilPrepDay(new Date()), mode: 'replace' };
  openSheet({ type: 'usePrep' });
}
function UsePrepSheet() {
  const D = PREP_DRAFT.d; const [, setT] = useState(0); const re = () => setT(x => x + 1);
  if (!D) return null;
  const today = startOfDay(new Date()); const sp = planSpan(); const P = ML().plan;
  const later = D.when === 'later' && startOfDay(D.start) > today;
  const back = { type: 'usePrep' };
  const swap = i => { const r = getRecipe(D.items[i][0]); openSheet({ type: 'recipePick', cat: r.cat, cur: r.id, title: 'Swap ' + r.name, back, onPick: id => { const j = D.items.findIndex(x => x[0] === id); if (j >= 0 && j !== i) { D.items[j][1] += D.items[i][1]; D.items.splice(i, 1); } else D.items[i] = [id, D.items[i][1]]; } }); };
  const add = () => openSheet({ type: 'recipePick', title: 'Add a recipe', back, onPick: id => { if (!D.items.some(x => x[0] === id)) D.items.push([id, (getRecipe(id) || {}).week || 3]); } });
  const apply = () => {
    const items = D.items.filter(([r]) => getRecipe(r));
    if (later) {
      mealCommit(mm => { mm.next = (mm.next || []).concat({ id: uid('nx'), name: D.name, start: ymd(D.start), days: D.days, items }).sort((a, b) => a.start < b.start ? -1 : 1); });
      closeSheet(); PREP_DRAFT.d = null; showToast({ kind: 'info', ms: 6000, text: D.name + ' is planned for ' + rangeText(D.start, D.days) + '. It loads that morning with a fresh shopping list.' }); return;
    }
    mealCommit(mm => { delete mm.plan.fromMenu; delete mm.plan.src; if (D.mode === 'replace' || !mm.plan.items.length) mm.plan.items = []; for (const [r, n] of items) { const ex = mm.plan.items.find(i => i.r === r); if (ex) ex.n = n; else mm.plan.items.push({ id: uid('mp'), r, n }); }
      if (D.when === 'later' || D.dated) { mm.plan.start = ymd(D.start); mm.plan.days = D.days; mm.plan.weeks = Math.max(1, Math.min(4, Math.round(D.days / 7))); }
      if (D.mode === 'replace') mm.checks = {}; });
    closeSheet(); PREP_DRAFT.d = null; PREP_UI.open = null; scrollTo(0, 0); showToast({ kind: 'info', text: D.name + ' is in What you’ll cook. Your shopping list is ready.' });
  };
  return html`<${Sheet} label=${'Use ' + D.name}><h2>${D.name}</h2>
    <p class="note">Swap any recipe for another or take one out. Changes apply only this time; the prep itself stays as it is.</p>
    <div class="stack" style="margin-top:10px;gap:6px" id="up-items">${D.items.map(([r, n], i) => { const rec = getRecipe(r); if (!rec) return null; const bad = recipeIssues(rec).block;
      return html`<div key=${r} class="up-row"><div style="flex:1;min-width:0"><div style="font-weight:600">${rec.name}${D.orig.includes(r) ? '' : html` <span class="chip on" style="margin-left:4px">swapped in</span>`}</div>
          <div class="small muted">${n === Math.round(n) ? n : fracStr(n)}× a week${bad.length ? html` · <span class="down-c">has ${bad.join(', ')}</span>` : ''}</div></div>
        <button class="btn" id=${'up-swap-' + i} aria-label=${'Swap ' + rec.name} onClick=${() => swap(i)}>${I.swap} Swap</button>
        <button class="tip-x" aria-label=${'Take out ' + rec.name} onClick=${() => { D.items.splice(i, 1); re(); }}>${I.x}</button></div>`; })}
      <button class="btn ghost wide" id="up-add" onClick=${add}>${I.plus} Add a recipe</button></div>
    <div class="section-h"><h2>When</h2></div>
    <div class="seg wide" role="group" aria-label="When" id="up-when"><button class=${D.when === 'now' ? 'on' : ''} aria-pressed=${D.when === 'now'} id="up-now" onClick=${() => { D.when = 'now'; re(); }}>Now</button><button class=${D.when === 'later' ? 'on' : ''} aria-pressed=${D.when === 'later'} id="up-later" onClick=${() => { const n = nextStretch(); D.when = 'later'; D.start = n.start; D.days = n.days; re(); }}>Pick dates</button></div>
    ${D.when === 'now' ? html`<p class="small muted" style="margin-top:6px">For your current dates: ${spanText()}.</p>`
      : html`<div style="margin-top:8px"><${RangeCal} idp="up-cal" start=${D.start} days=${D.days} onChange=${(s, n) => { D.start = s; D.days = n; re(); }}/>
        <div class="card small" style="margin-top:8px;font-weight:600" id="up-sum">${rangeText(D.start, D.days)}${later ? ' · planned ahead' : ' · starts now'}</div></div>`}
    ${!later && P.items.length ? html`<div class="seg wide" role="group" style="margin-top:10px">${[['replace', 'Replace what I’m cooking'], ['add', 'Add to it']].map(([k, l]) => html`<button key=${k} id=${'up-' + k} class=${D.mode === k ? 'on' : ''} aria-pressed=${D.mode === k} onClick=${() => { D.mode = k; re(); }}>${l}</button>`)}</div>` : null}
    <div class="stack" style="margin-top:12px"><button class="btn primary wide" id="up-apply" disabled=${!D.items.length} onClick=${() => { if (D.when === 'later') D.dated = true; apply(); }}>${later ? 'Plan it for ' + dayLbl(D.start) : 'Use this prep'}</button>
      <button class="btn wide" onClick=${() => { PREP_DRAFT.d = null; closeSheet(); }}>Cancel</button></div><//>`;
}
function PlanAheadSheet() {
  const m = ML(); const cur = m.plan.items.filter(i => getRecipe(i.r));
  const pick = pr => openUsePrep(pr, true);
  return html`<${Sheet} label="Plan ahead"><h2>Plan ahead</h2><p class="note">Pick what to cook next, then its dates. It loads on its first day with a fresh shopping list, and you can line up several.</p>
    <div class="stack" style="margin-top:10px;gap:6px">
      ${cur.length ? html`<button class="opt" id="pa-copy" onClick=${() => pick({ id: 'cur', name: 'Same as now', items: cur.map(i => [i.r, i.n]) })}><div style="flex:1"><div>Same as what I’m cooking now</div><div class="d">${cur.map(i => getRecipe(i.r).name).join(' · ')}</div></div></button>` : null}
      ${Object.values(m.preps).map(pr => html`<button key=${pr.id} class="opt" onClick=${() => pick(pr)}><div style="flex:1"><div>${pr.name}</div><div class="d">Yours · ${pr.items.length} recipes</div></div></button>`)}
      ${readyPreps().map(pr => html`<button key=${pr.id} class="opt" id=${'pa-' + pr.id} onClick=${() => pick(pr)}><div style="flex:1"><div>${pr.name}</div><div class="d">${prepFits(pr) ? 'Picked for your food preferences · ' : ''}${pr.items.length} recipes</div></div></button>`)}</div>
    <button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Cancel</button><//>`;
}
function ComingUp() {
  const q = ML().next || [];
  return html`<div class="card" style="margin-top:14px" id="plan-ahead"><div style="font-weight:700">Plan ahead</div>
    ${q.length ? html`<div class="stack" style="gap:6px;margin:8px 0">${q.map(x => html`<div key=${x.id} class="up-row"><div style="flex:1;min-width:0"><div style="font-weight:600">${x.name}</div><div class="small muted">${rangeText(parseYmd(x.start), x.days)}</div></div>
        <button class="tip-x" aria-label=${'Remove ' + x.name} onClick=${() => mealCommit(mm => { mm.next = (mm.next || []).filter(y => y.id !== x.id); })}>${I.x}</button></div>`)}</div>`
      : html`<p class="small muted" style="margin:2px 0 10px">Line up what you’ll cook next, with its dates, so the next shopping list is ready when that day comes.</p>`}
    <button class="btn wide" id="plan-ahead-btn" onClick=${() => openSheet({ type: 'planAhead' })}>${q.length ? 'Plan another' : 'Plan what’s next'}</button></div>`;
}
/* Load a planned stretch on its first day. Returns true when one loaded. */
function nextCheck() {
  const m = ML(); const q = m.next || []; const today = ymd(new Date()); const due = q.filter(x => x.start <= today); if (!due.length) return false;
  const cur = due.filter(x => ymd(addDays(parseYmd(x.start), x.days - 1)) >= today).sort((a, b) => a.start < b.start ? 1 : -1)[0];
  mealCommit(mm => { mm.next = (mm.next || []).filter(x => x.start > today);
    if (cur) { mm.plan.items = cur.items.filter(([r]) => getRecipe(r)).map(([r, n]) => ({ id: uid('mp'), r, n })); mm.plan.start = cur.start; mm.plan.days = cur.days; mm.plan.weeks = Math.max(1, Math.min(4, Math.round(cur.days / 7))); mm.plan.src = 'next'; delete mm.plan.fromMenu; mm.checks = {}; } });
  if (cur) showToast({ kind: 'info', ms: 6000, text: 'Today starts ' + cur.name + ' (' + rangeText(parseYmd(cur.start), cur.days) + '). Your shopping list is ready.' });
  return !!cur;
}

/* ---- stars ---- */
const isStarred = id => !!(ML().stars || {})[id];
function toggleStar(id) {
  const on = !isStarred(id); mealCommit(mm => { mm.stars = { ...(mm.stars || {}) }; if (on) mm.stars[id] = true; else delete mm.stars[id]; });
  const r = getRecipe(id); showToast({ kind: 'info', text: on ? (r ? r.name : 'Recipe') + ' starred. Find it under Recipes → Starred.' : 'Unstarred' });
}
function StarBtn({ id, name, big }) {
  const on = isStarred(id);
  return html`<button class=${'rec-star' + (on ? ' on' : '') + (big ? ' big' : '')} id=${big ? 'rec-star' : null} aria-pressed=${on} aria-label=${(on ? 'Unstar ' : 'Star ') + name} onClick=${e => { e.stopPropagation(); toggleStar(id); }}>${on ? '★' : '☆'}</button>`;
}

/* ---- the Meals tour: what to do, in the order most people do it ---- */
const MEALS_TOUR = [
  ['meals', null, null, 'How Meals works', 'Meals has four tabs, used in this order: Week to plan, Shopping to buy, then you cook, and Today to log what you eat. This takes about a minute.', { meals: 'plan' }],
  ['meals', null, '#plan-dates', '1. Pick your dates', 'Tap Pick dates and choose the days on a calendar: the first day, then the last. Starting midweek? Tap “Until Sunday” (or your prep day) for a short first plan, and the next one starts on your prep day.', { meals: 'plan' }],
  ['meals', null, '#plan-cta, #menu-card, #plan-cta-small', '2. Choose your meals', 'Plan my week asks about you, your food and how you cook, then picks meals with portions. Or use a ready-made prep, or pick recipes yourself. Any of them fills your cooking and shopping list.', { meals: 'plan' }],
  ['meals', null, '#ready-preps', 'Ready-made preps', 'A week of cooking in one tap. Open one to see its recipes. Use this prep loads it as is. Swap recipes or plan it lets you change any recipe first, or save it for later dates.', { meals: 'plan' }],
  ['meals', null, '.mp-who, #plan-cta', '3. What you’ll cook', 'Once you’ve picked meals, each recipe shows how many times you’ll eat it. Set the people and days and everything scales. Tap Swap to trade a recipe for another, or ✕ to drop it.', { meals: 'plan' }],
  ['meals', null, '#plan-ahead', 'Plan ahead', 'Line up the next plan now, with its dates. It loads on its first day with a fresh shopping list. Or rotate 2 to 4 preps, one each week, just below.', { meals: 'plan' }],
  ['meals', null, '#meal-search', 'Recipes', 'Search by name or ingredient. The filters narrow it to breakfasts, mains, snacks, reels, your own recipes or Starred. The + adds a recipe to what you’ll cook.', { meals: 'recipes' }],
  ['meals', null, '#rchip-starred', 'Star your favorites', 'Tap ☆ on any recipe to star it. Starred keeps them in one place, and they come first when you swap a recipe.', { meals: 'recipes' }],
  ['meals', null, '#rchip-mix', 'Mix & match', 'Cook one plain base, like chicken or rice, and turn it into different meals with a sauce or spice mix, so the week doesn’t taste the same every day.', { meals: 'recipes' }],
  ['meals', null, '#new-recipe', 'Your own recipes', 'New recipe saves your own. It can fill itself in from a post: paste the caption and link, then check what it found. Nutrition is worked out from the ingredients.', { meals: 'recipes' }],
  ['meals', null, '#share-list, #list-plan, #list-from-plan', '4. Shopping', 'Everything for your dates, added up and sorted by aisle. Tick things off as they go in the cart, add extras like coffee, or share the list.', { meals: 'list' }],
  ['meals', null, '#log-scan, #log-add', '5. Today', 'Log what you eat against your daily goals. Meals from your plan show up here with an Ate it button.', { meals: 'log' }],
  ['meals', null, null, 'A simple routine', 'On your prep day: check Week, open Shopping, buy, cook. Each day: tap Ate it in Today. Help at the bottom of any page brings this tour back.', { meals: 'plan' }]];
