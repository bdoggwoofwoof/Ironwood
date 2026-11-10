/* ============ Iron 75 and Iron 75 Lite, set up from a short questionnaire (Nov 2) ============ */
/* Picking Iron 75 or Lite asks your priorities (fat loss, muscle, running, discipline) and which daily habits to include
   (reading, water, outdoor time, no alcohol, a photo, sleep, steps), then builds the checklist. It adapts:
   workouts tick themselves from anything you log (your plans count), protein and calories tick from your food log,
   and a sick or hurt day can be made a light day (a gentle 20 minutes) instead of breaking the run. Iron 75 still
   starts over after a missed day; Lite doesn't and allows a rest day a week. Generic name only. */
const IRON_PRIOS = [['fat', 'Lose fat'], ['muscle', 'Build muscle'], ['run', 'Running fitness'], ['habits', 'Discipline & habits']];
const IRON_HABITS = [['read', 'Read 10 pages', true], ['water', 'Drink water', true], ['outdoor', 'Time outdoors', true], ['alcohol', 'No alcohol', true], ['photo', 'Progress photo', true], ['sleep', 'Sleep 7+ hours', false], ['steps', '8,000+ steps', false], ['phone', 'No phone the first 30 minutes', false]];
function ironItems(v) {
  const strict = v.ver === 'iron75'; const out = [];
  out.push(['Workout' + (strict ? ' 1' : ''), 'w1']);
  if (strict) out.push(['Workout 2' + (v.habits.includes('outdoor') ? ' (outdoors)' : ''), 'w2']);
  if (v.prios.includes('run')) out.push(['One workout is a run or cardio']);
  /* these tick from the food log, so only when there's a goal to compare with; otherwise you tick them */
  const G = typeof ML === 'function' ? ML().goals || {} : {};
  if (v.prios.includes('muscle')) out.push(G.p ? ['Hit your protein goal', 'protein'] : ['Eat enough protein']);
  if (v.prios.includes('fat')) out.push(G.kcal ? ['Stay at or under your calories', 'kcal'] : ['Stick to your calories']);
  if (!v.prios.includes('fat') && !v.prios.includes('muscle')) out.push(['Stick to your eating plan']);
  for (const [k, l] of IRON_HABITS) if (v.habits.includes(k) && !(k === 'outdoor' && strict)) out.push([k === 'water' ? 'Drink ' + v.water : k === 'read' ? 'Read ' + v.pages + ' pages' : l]);
  return out;
}
function IronSetupSheet({ ver: ver0 }) {
  const [v, setV] = useState({ ver: ver0 || 'iron75', prios: ironPriosFromAbout(aboutYou().goal), habits: IRON_HABITS.filter(h => h[2]).map(h => h[0]).filter(k => (ver0 || 'iron75') === 'iron75' || !['outdoor', 'photo', 'alcohol'].includes(k)), water: (ver0 || 'iron75') === 'iron75' ? 'a gallon of water' : '3 liters of water', pages: 10 });
  const tog = (k, x) => setV({ ...v, [k]: v[k].includes(x) ? v[k].filter(y => y !== x) : v[k].concat(x) });
  const items = ironItems(v); const strict = v.ver === 'iron75';
  const G = typeof ML === 'function' ? ML().goals || {} : {}; const noGoals = (v.prios.includes('muscle') && !G.p) || (v.prios.includes('fat') && !G.kcal);
  const startNow = () => { const d = { ...challengeFrom({ name: strict ? 'Iron 75' : 'Iron 75 Lite', days: 75, restart: strict, rest: strict ? 0 : 1, items }), light: true, prios: v.prios };
    commit(m => { m.meta.challenges[d.id] = d; }, 'meta', 300); closeSheet(); UI.setTab('train'); UI.setView({ type: 'challenge', id: d.id }); showToast({ kind: 'info', text: d.name + ' started. Day 1 is today.' }); };
  const start = () => openChallengeDraft({ ...challengeFrom({ name: strict ? 'Iron 75' : 'Iron 75 Lite', days: 75, restart: strict, rest: strict ? 0 : 1, items }), light: true, prios: v.prios });
  return html`<${Sheet} label="Set up Iron 75"><h2>Set up ${strict ? 'Iron 75' : 'Iron 75 Lite'}</h2>
    <div class="stack" style="gap:12px;margin-top:8px">
      <div class="seg wide" role="group" aria-label="Version">${[['iron75', 'Iron 75 (strict)'], ['iron75lite', 'Lite']].map(([k, l]) => html`<button key=${k} id=${'iv-' + k} class=${v.ver === k ? 'on' : ''} aria-pressed=${v.ver === k} onClick=${() => setV({ ...v, ver: k, water: k === 'iron75' ? 'a gallon of water' : '3 liters of water' })}>${l}</button>`)}</div>
      <p class="small muted">${strict ? 'Two workouts a day, no rest days; miss a day and it starts over. A sick or hurt day can be a light day.' : 'One workout a day with a rest day each week. A missed day is counted but doesn’t reset it.'}</p>
      <div><span class="lbl">What matters most to you?</span><div class="cat-pick">${IRON_PRIOS.map(([k, l]) => html`<button key=${k} id=${'ip-' + k} class=${'chip' + (v.prios.includes(k) ? ' on' : '')} aria-pressed=${v.prios.includes(k)} onClick=${() => tog('prios', k)}>${l}</button>`)}</div>
        <p class="small muted">Muscle adds a protein goal and fat loss a calorie limit, both ticked from your food log.</p>
        ${noGoals ? html`<p class="small" id="iron-nogoals">You don’t have ${!G.p && !G.kcal ? 'meal targets' : !G.p ? 'a protein goal' : 'a calorie goal'} yet, so ${v.prios.includes('muscle') && v.prios.includes('fat') ? 'those items' : 'that item'} can’t tick itself: you’ll tick it by hand${strict ? ', and forgetting would restart the challenge' : ''}. <button class="btn text" id="iron-meals" style="padding:0;min-height:0" onClick=${() => openSheet({ type: 'mealTargets' })}>Set up meals first</button></p>` : null}</div>
      <div><span class="lbl">Daily habits</span><div class="cat-pick">${IRON_HABITS.map(([k, l]) => html`<button key=${k} id=${'ih-' + k} class=${'chip' + (v.habits.includes(k) ? ' on' : '')} aria-pressed=${v.habits.includes(k)} onClick=${() => tog('habits', k)}>${l}</button>`)}</div></div>
      ${v.habits.includes('water') ? html`<div><span class="lbl">Water</span><div class="cat-pick">${['a gallon of water', '3 liters of water', '2 liters of water'].map(w => html`<button key=${w} class=${'chip' + (v.water === w ? ' on' : '')} onClick=${() => setV({ ...v, water: w })}>${w.replace(' of water', '')}</button>`)}</div></div>` : null}
      <div class="card"><div style="font-weight:700">Your daily checklist</div><ul class="small" id="iron-preview" style="margin:6px 0 0 18px">${items.map(([n]) => html`<li key=${n}>${n}</li>`)}</ul></div>
      <button class="btn primary wide" id="iron-start" onClick=${startNow}>Start ${strict ? 'Iron 75' : 'Iron 75 Lite'}</button>
      <button class="btn wide" id="iron-go" onClick=${start}>Change the list first</button>
      <p class="small faint">Strict challenges are hard on recovery. Take a light day if you feel run down, and skip anything that hurts. ${NOT_ADVICE}</p></div><//>`;
}
/* ---- adaptive checks ---- */
const chFoodDay = k => (typeof ML === 'function' && ML().log ? sumNut(ML().log[k] || []) : null);
function chProteinHit(k) { const G = typeof ML === 'function' ? ML().goals : {}; const t = chFoodDay(k); return !!(t && G && G.p && t.p >= G.p * 0.95); }
function chKcalOk(k) { const G = typeof ML === 'function' ? ML().goals : {}; const t = chFoodDay(k); return !!(t && G && G.kcal && t.kcal > G.kcal * 0.5 && t.kcal <= G.kcal * 1.05); }
function chAutoOn(ch, it, k, wc) {
  const e = (ch.log || {})[k] || {};
  if ((it.auto === 'w1' || it.auto === 'w2') && e.light && e.c && e.c.light) return true;
  return (it.auto === 'w1' && wc >= 1) || (it.auto === 'w2' && wc >= 2) || (it.auto === 'protein' && chProteinHit(k)) || (it.auto === 'kcal' && chKcalOk(k));
}
const chAutoLabel = it => it.auto === 'w1' ? 'auto: 1st workout' : it.auto === 'w2' ? 'auto: 2nd workout' : it.auto === 'protein' ? 'auto: from your food log and protein goal' : it.auto === 'kcal' ? 'auto: from your food log and calorie goal' : '';
function chLight(id, k, on) { commit(m => { const c = m.meta.challenges[id]; if (!c) return; c.log = c.log || {}; const e = c.log[k] = c.log[k] || {}; if (on) e.light = 1; else { delete e.light; if (e.c) delete e.c.light; if (!e.c || !Object.keys(e.c).length) { if (!e.rest) delete c.log[k]; } } }, 'meta', 600); }
function LightDay({ ch, k }) {
  if (!ch.light || !ch.items.some(it => it.auto === 'w1' || it.auto === 'w2')) return null;
  const e = (ch.log || {})[k] || {};
  if (!e.light) return html`<button class="btn text" id="light-day" onClick=${() => chLight(ch.id, k, true)}>Sick or hurt? Make today a light day</button>`;
  const on = !!(e.c && e.c.light);
  return html`<div class="light-day" id="light-on"><button class=${'ch-item' + (on ? ' on' : '')} aria-pressed=${on} id="light-item" onClick=${() => chToggle(ch.id, k, 'light')}><i>${on ? I.check : null}</i><span class="nm">Gentle 20 minutes: walk or stretch</span><span class="d">light day, covers today’s workouts</span></button>
    <button class="btn text" onClick=${() => chLight(ch.id, k, false)}>Not a light day after all</button></div>`;
}
