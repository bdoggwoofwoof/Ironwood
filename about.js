/* ============ About you (Nov 10, audit P2-8) ============
   One small profile the setups read, so Build my plan, Your meal plan and Iron 75 each ask only what's new.
   Body numbers live with the meal targets (ML().me), the training goal and days with Build my plan
   (settings.plan) or, before that exists, in settings.about. Everything stays on the phone. */
const ABOUT_GOALS = [['lose', 'Lose fat'], ['recomp', 'Lose fat and build muscle'], ['mass', 'Get bigger'], ['strength', 'Lift more weight'], ['speed', 'Get faster and fitter']];
function lastBwKg() { const b = (S.meta.bw || []).slice().sort((a, c) => a.d < c.d ? -1 : 1).pop(); return b ? conv(+b.w, b.u || U(), 'kg') : 0; }
function aboutYou() {
  const me = (typeof ML === 'function' && ML().me) || {}; const pl = S.meta.settings.plan || {}; const ab = S.meta.settings.about || {};
  const mealGoal = me.goal === 'lose' ? 'lose' : me.goal === 'gain' ? 'mass' : '';
  return { h: me.h || 0, w: me.w || lastBwKg() || 0, age: me.age || 0, sex: me.sex || '', act: me.act || 0, us: me.us != null ? me.us : !isMetric(),
    goal: pl.goal || ab.goal || mealGoal || '', days: pl.days || ab.days || 0 };
}
/* Training goal → meal goal, for a meal setup that hasn't been filled in yet */
function mealGoalFromAbout(g) { return g === 'lose' ? { goal: 'lose', pace: 'steady' } : g === 'mass' ? { goal: 'gain', pace: 'gentle' } : g ? { goal: 'keep', pace: 'gentle' } : null; }
/* Training goal → Iron 75 priorities */
function ironPriosFromAbout(g) { return g === 'lose' ? ['fat', 'habits'] : g === 'recomp' ? ['fat', 'muscle'] : g === 'mass' || g === 'strength' ? ['muscle', 'habits'] : g === 'speed' ? ['run', 'habits'] : ['habits']; }
function aboutSummary(a) {
  const parts = [];
  if (a.h) parts.push(a.us ? Math.floor(a.h / 2.54 / 12) + '′' + Math.round(a.h / 2.54 % 12) + '″' : Math.round(a.h) + ' cm');
  if (a.w) parts.push(a.us ? Math.round(a.w * 2.20462) + ' lb' : Math.round(a.w) + ' kg');
  if (a.age) parts.push(a.age + ' years');
  const g = ABOUT_GOALS.find(x => x[0] === a.goal) || (typeof GP_GOALS !== 'undefined' && GP_GOALS.find(x => x[0] === a.goal)); if (g) parts.push(g[1].toLowerCase());
  if (a.days) parts.push(a.days + ' days a week');
  return parts.join(' · ');
}
function AboutYouCard() {
  const a = aboutYou(); const s = aboutSummary(a);
  return html`<button class="opt" id="about-you" onClick=${() => openSheet({ type: 'aboutYou' })}><div style="flex:1"><div>About you</div>
    <div class="d">${s ? s : 'Height, weight, goal and training days. Build my plan, Your meal plan and Iron 75 start from these.'}</div></div></button>`;
}
function AboutYouSheet() {
  const a0 = aboutYou();
  const [d, setD] = useState(() => ({ us: a0.us, ft: a0.h ? String(Math.floor(a0.h / 2.54 / 12)) : '', inch: a0.h ? String(Math.round(a0.h / 2.54 % 12)) : '', cm: a0.h ? String(Math.round(a0.h)) : '',
    w: a0.w ? String(Math.round(a0.us ? a0.w * 2.20462 : a0.w)) : '', age: a0.age ? String(a0.age) : '', goal: a0.goal || '', days: a0.days || 0 }));
  const set = (k, v) => setD({ ...d, [k]: v });
  const h = d.us ? ((+d.ft || 0) * 12 + (+d.inch || 0)) * 2.54 : +d.cm; const w = d.us ? (+d.w || 0) / 2.20462 : +d.w;
  const save = () => {
    if (typeof mealCommit === 'function') mealCommit(m => { m.me = { ...(m.me || {}), us: d.us, ...(h ? { h } : {}), ...(w ? { w } : {}), ...(+d.age ? { age: +d.age } : {}) }; });
    commit(st => { st.meta.settings.about = { goal: d.goal, days: d.days }; if (st.meta.settings.plan) { if (d.goal) st.meta.settings.plan.goal = d.goal; if (d.days) st.meta.settings.plan.days = d.days; } if (d.days) st.meta.settings.goal = d.days; }, 'meta');
    closeSheet(); showToast({ kind: 'info', text: 'Saved. Setups start from these now.' });
  };
  return html`<${Sheet} label="About you"><h2>About you</h2>
    <p class="note">Fill in what you like. Build my plan, Your meal plan and Iron 75 start from these, so they only ask what’s new. Stays on this phone.</p>
    <div class="stack" style="margin-top:12px">
      <div class="row"><span class="lbl" style="flex:1;margin:0">Units</span><div class="seg" role="group">${[[true, 'ft · lb'], [false, 'cm · kg']].map(([v, l]) => html`<button key=${l} class=${d.us === v ? 'on' : ''} aria-pressed=${d.us === v} onClick=${() => set('us', v)}>${l}</button>`)}</div></div>
      <div class="row" style="gap:10px">${d.us ? html`<div style="flex:1"><label class="lbl" for="ay-ft">Height</label><div class="row" style="gap:6px"><input class="field" id="ay-ft" inputmode="numeric" placeholder="ft" aria-label="Feet" value=${d.ft} onInput=${e => set('ft', e.target.value.replace(/\D/g, ''))}/><input class="field" id="ay-in" inputmode="numeric" placeholder="in" aria-label="Inches" value=${d.inch} onInput=${e => set('inch', e.target.value.replace(/\D/g, ''))}/></div></div>`
        : html`<div style="flex:1"><label class="lbl" for="ay-cm">Height (cm)</label><input class="field" id="ay-cm" inputmode="numeric" value=${d.cm} onInput=${e => set('cm', e.target.value.replace(/\D/g, ''))}/></div>`}
        <div style="flex:1"><label class="lbl" for="ay-w">Weight (${d.us ? 'lb' : 'kg'})</label><input class="field" id="ay-w" inputmode="decimal" value=${d.w} onInput=${e => set('w', e.target.value.replace(/[^\d.]/g, ''))}/></div></div>
      <div style="max-width:50%"><label class="lbl" for="ay-age">Age</label><input class="field" id="ay-age" inputmode="numeric" value=${d.age} onInput=${e => set('age', e.target.value.replace(/\D/g, ''))}/></div>
      <div><span class="lbl">What do you want most?</span><div class="cat-pick">${ABOUT_GOALS.map(([v, l]) => html`<button key=${v} id=${'ay-goal-' + v} class=${'chip' + (d.goal === v ? ' on' : '')} aria-pressed=${d.goal === v} onClick=${() => set('goal', d.goal === v ? '' : v)}>${l}</button>`)}</div></div>
      <div><span class="lbl">Days a week you can train</span><div class="seg wide" role="group">${[2, 3, 4, 5, 6, 7].map(n => html`<button key=${n} id=${'ay-days-' + n} class=${d.days === n ? 'on' : ''} aria-pressed=${d.days === n} onClick=${() => set('days', n)}>${n}</button>`)}</div></div>
      <button class="btn primary wide" id="ay-save" onClick=${save}>Save</button>
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}

