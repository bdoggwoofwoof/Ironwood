/* ============ Review my eating (Nov 3, Newt's request) ============ */
/* Meals → Log → "Review my eating" (and Progress → Overall → Nutrition). Over the last 7 or 14 days with food logged:
   1. Averages against your daily goals: what's low, on target or high.
   2. Where it happens: calories by time of day (from when you logged, same-day entries only), the foods that bring
      the most calories, sodium and sugar, and training days against rest days.
   3. Food groups behind the nutrients Ironwood can't count (vegetables, fruit, whole grains, beans, fish, calcium
      foods, nuts and seeds): how many logged days had each.
   4. Suggestions that fit your goal, with recipes you can add to your prep in one tap (allergies and dislikes left out).
   Estimates from what you logged, for planning. Not medical or diet advice. Uses only existing styles. */
const EAT_GROUPS = [
  ['veg', 'Vegetables', /broccoli|spinach|kale|pepper|carrot|zucchini|cabbage|cauliflower|green bean|brussels|tomato|lettuce|salad|cucumber|mushroom|asparagus|squash|vegetable|\bveg\b|greens|celery|beet|sweet potato/, 0.6, 'fiber, potassium, vitamins A and C'],
  ['fruit', 'Fruit', /apple|banana|berr|orange|mango|pineapple|grape|peach|pear|kiwi|fruit|raisin|cherr|melon|lemon|lime/, 0.4, 'vitamin C, potassium, fiber'],
  ['grain', 'Whole grains', /\boats?\b|oatmeal|brown rice|quinoa|whole wheat|whole-wheat|whole grain|whole-grain|barley|farro|bulgur/, 0.4, 'fiber, B vitamins, magnesium'],
  ['legume', 'Beans and lentils', /\bbeans?\b|lentil|chickpea|hummus|edamame|black bean|split pea/, 0.3, 'fiber, iron, folate'],
  ['fish', 'Fish', /salmon|tuna|\bcod\b|tilapia|sardine|\bfish\b|shrimp|trout|mackerel|anchov/, 0.15, 'omega-3 fats, vitamin D, iodine'],
  ['calcium', 'Dairy or calcium foods', /\bmilk\b|yogurt|cheese|kefir|tofu|cottage|sardine|fortified/, 0.5, 'calcium, vitamin D'],
  ['nuts', 'Nuts and seeds', /almond|walnut|peanut|cashew|pecan|pistachio|\bnuts?\b|seed|chia|flax/, 0.3, 'healthy fats, magnesium, vitamin E'],
];
const EAT_TIMES = [['morning', 'Morning', 0, 11], ['midday', 'Midday', 11, 15], ['afternoon', 'Afternoon', 15, 18], ['evening', 'Evening', 18, 21], ['late', 'Late night', 21, 24]];
function entryWords(e) {
  const out = [String(e.name || ''), String(e.txt || '')];
  const r = e.r && typeof getRecipe === 'function' ? getRecipe(e.r) : null; if (r) for (const g of r.ing || []) out.push(String(g && g.n || g || ''));
  return out.join(' ').toLowerCase();
}
function eatReview(n) {
  const L = ML().log || {}; const days = [];
  for (let i = n - 1; i >= 0; i--) { const k = ymd(addDays(startOfDay(new Date()), -i)); const l = (L[k] || []).filter(e => e && e.m); if (l.length) days.push({ k, l, s: sumNut(l) }); }
  const N = days.length; const avg = {}; for (const [k] of NUT) avg[k] = N ? days.reduce((a, d) => a + (+d.s[k] || 0), 0) / N : 0;
  /* time of day: only entries logged on the day they're for, so the clock time means something */
  const times = Object.fromEntries(EAT_TIMES.map(t => [t[0], 0])); let timed = 0;
  for (const d of days) for (const e of d.l) { if (!e.at || ymd(new Date(e.at)) !== d.k) continue; const h = new Date(e.at).getHours(); const t = EAT_TIMES.find(x => h >= x[2] && h < x[3]); times[t[0]] += +e.m.kcal || 0; timed += +e.m.kcal || 0; }
  /* top sources */
  const by = {}; for (const d of days) for (const e of d.l) { const key = String(e.name || 'Other'); const x = by[key] = by[key] || { name: key, kcal: 0, na: 0, sug: 0, p: 0, n: 0, r: e.r }; x.kcal += +e.m.kcal || 0; x.na += +e.m.na || 0; x.sug += +e.m.sug || 0; x.p += +e.m.p || 0; x.n++; }
  const foods = Object.values(by); const tot = k => foods.reduce((a, f) => a + f[k], 0);
  const top = k => foods.filter(f => f[k] > 0).sort((a, b) => b[k] - a[k]).slice(0, 3).map(f => ({ ...f, share: tot(k) ? f[k] / tot(k) : 0 }));
  /* food groups: on how many logged days */
  const groups = EAT_GROUPS.map(([id, name, re, want, gives]) => ({ id, name, want, gives, hit: days.filter(d => d.l.some(e => re.test(entryWords(e)))).length }));
  /* training days vs rest days */
  const trained = new Set(sessionList().map(s => ymd(new Date(s.startedAt))));
  const td = days.filter(d => trained.has(d.k)), rd = days.filter(d => !trained.has(d.k));
  const mean = (ds, k) => ds.length ? ds.reduce((a, d) => a + (+d.s[k] || 0), 0) / ds.length : 0;
  return { N, days, avg, times, timed, topKcal: top('kcal'), topNa: top('na'), topSug: top('sug'), groups,
    train: td.length >= 2 && rd.length >= 2 ? { kcalT: mean(td, 'kcal'), kcalR: mean(rd, 'kcal'), pT: mean(td, 'p'), pR: mean(rd, 'p'), nT: td.length, nR: rd.length } : null };
}
/* recipes to suggest: fit your food answers, not already in your prep, best for one measure */
function suggestRecipes(score, filt, n) {
  const inPlan = new Set((ML().plan.items || []).map(i => i.r));
  return allRecipes().filter(r => !inPlan.has(r.id) && !(typeof avoidRecipe === 'function' && avoidRecipe(r)) && macros(r) && macros(r).kcal > 0 && (!filt || filt(r)))
    .sort((a, b) => score(b) - score(a)).slice(0, n || 2);
}
const recipeHas = re => r => (r.ing || []).some(g => re.test(String(g && g.n || g || '').toLowerCase()));
function eatTips(R) {
  const G = ML().goals || {}; const me = ML().me || {}; const goal = me.goal || 'keep'; const tips = [];
  const gap = k => G[k] ? R.avg[k] - G[k] : null; const pct = k => G[k] ? R.avg[k] / G[k] : null;
  if (G.p && pct('p') < 0.9) tips.push({ id: 'protein', title: 'Protein is about ' + Math.round(-gap('p')) + ' g a day short', body: 'Protein helps you keep and build muscle' + (goal === 'lose' ? ', which matters most while you eat less' : '') + '. Adding one high-protein meal or snack a day closes most of the gap.', recipes: suggestRecipes(r => macros(r).p, r => macros(r).kcal >= 150 && macros(r).p / macros(r).kcal >= 0.07) });
  if (G.kcal && pct('kcal') > 1.1) { const big = R.topKcal[0]; const late = R.timed ? (R.times.evening + R.times.late) / R.timed : 0;
    tips.push({ id: 'kcal-high', title: 'Calories average ' + fmt(Math.round(gap('kcal'))) + ' over your goal', body: (big ? big.name + ' brings ' + Math.round(big.share * 100) + '% of your calories. ' : '') + (late > 0.5 ? 'Over half of them come in the evening or late; a bigger breakfast or lunch often makes evenings easier. ' : '') + (goal === 'gain' ? 'A small surplus is the plan, so this may be fine if your weight is moving about ½ lb a week.' : 'Smaller portions of your biggest meal, or a lighter swap, would bring it down.'), recipes: goal === 'gain' ? [] : suggestRecipes(r => macros(r).p / macros(r).kcal, r => r.cat === 'main' && macros(r).kcal >= 250 && macros(r).kcal <= 550) }); }
  if (G.kcal && pct('kcal') < 0.85) tips.push({ id: 'kcal-low', title: 'Calories average ' + fmt(Math.round(-gap('kcal'))) + ' under your goal', body: goal === 'lose' ? 'Eating far under your target can cost muscle and energy for training. Aim for your target, not below it.' : 'You may not be eating enough to recover and ' + (goal === 'gain' ? 'gain' : 'keep your weight') + '. An extra snack on training days is the easiest fix.', recipes: suggestRecipes(r => macros(r).kcal, r => r.cat === 'snack') });
  if (R.avg.fib < Math.max(25, (G.fib || 0) * 0.9)) tips.push({ id: 'fiber', title: 'Fiber is low (about ' + Math.round(R.avg.fib) + ' g a day)', body: 'Beans, oats, vegetables and fruit add fiber, which helps digestion and keeps you full on fewer calories.', recipes: suggestRecipes(r => macros(r).fib || 0) });
  if (G.na && R.avg.na > G.na * 1.05 && R.topNa[0]) tips.push({ id: 'sodium', title: 'Sodium is above your limit', body: 'The most comes from ' + R.topNa.slice(0, 2).map(f => f.name).join(' and ') + '. Use half the sauce or seasoning packet, or a low-sodium version.', recipes: [] });
  if (G.sug && R.avg.sug > G.sug * 1.05 && R.topSug[0]) tips.push({ id: 'sugar', title: 'Sugar is above your limit', body: 'Most comes from ' + R.topSug.slice(0, 2).map(f => f.name).join(' and ') + '. Swapping one of those for fruit or plain yogurt makes the biggest difference.', recipes: [] });
  if (R.train && R.train.kcalT + 200 < R.train.kcalR) tips.push({ id: 'train-days', title: 'You eat less on training days', body: 'About ' + fmt(Math.round(R.train.kcalR - R.train.kcalT)) + ' fewer calories than on rest days. Moving a snack to training days helps you recover and lift better.', recipes: [] });
  if (R.train && R.train.pT + 15 < R.train.pR) tips.push({ id: 'train-protein', title: 'Less protein on training days', body: 'Try a protein-rich meal within a few hours after you train.', recipes: [] });
  const miss = R.N >= 3 ? R.groups.filter(g => g.hit / R.N < g.want) : [];
  if (miss.length) { const first = miss[0]; const re = EAT_GROUPS.find(x => x[0] === first.id)[2];
    tips.push({ id: 'groups', title: 'Food groups to add: ' + miss.map(g => g.name.toLowerCase()).join(', '), body: 'Ironwood can’t count vitamins and minerals, so it looks at food groups (see below). Start with ' + first.name.toLowerCase() + ', which bring ' + first.gives + ':', recipes: suggestRecipes(r => macros(r).p, r => recipeHas(re)(r) && macros(r).kcal >= 150) }); }
  return tips;
}
function EatReview() {
  const [n, setN] = useState(() => lsGet('eatReviewN') === '14' ? 14 : 7);
  const R = eatReview(n); const G = ML().goals || {};
  const seg = html`<div class="seg wide" role="group" aria-label="Period" style="margin-top:8px">${[[7, 'Last 7 days'], [14, 'Last 14 days']].map(([v, l]) => html`<button key=${v} id=${'er-' + v} class=${n === v ? 'on' : ''} aria-pressed=${n === v} onClick=${() => { setN(v); lsSet('eatReviewN', String(v)); }}>${l}</button>`)}</div>`;
  if (R.N < 3) return html`<div id="eat-review">${seg}<div class="card note" style="margin-top:12px">Log what you eat on at least 3 days in this period and the review fills in: what’s low or high, where it comes from, and what to change. ${R.N ? R.N + ' day' + (R.N === 1 ? '' : 's') + ' logged so far.' : ''}</div></div>`;
  const status = k => { const lim = LIMITS[k]; const g = G[k]; if (!g) return ['', 'No goal set']; const p = R.avg[k] / g;
    if (lim) return p > 1.05 ? ['over', 'Over the limit'] : ['ok', 'Within the limit'];
    return p < 0.9 ? ['under', 'Low'] : p > 1.1 ? ['over', k === 'p' || k === 'fib' ? 'Above goal' : 'High'] : ['ok', 'On target']; };
  const tips = eatTips(R);
  const timeTotal = R.timed || 1;
  return html`<div id="eat-review">${seg}
    <p class="small muted" style="margin-top:8px">${R.N} days with food logged. Averages count only those days.</p>
    <div class="section-h"><h2>Your averages</h2>${Object.keys(G).length ? null : html`<button class="btn text" onClick=${() => openSheet({ type: 'mealGoals' })}>Set goals</button>`}</div>
    <div class="card prl" id="er-avg">${NUT.map(([k, l, u]) => { const [cls, txt] = status(k); return html`<div key=${k} id=${'er-' + k} class=${'er-' + cls}><div style="min-width:0"><div style="font-weight:600">${l}</div><div class="small muted">${G[k] ? (LIMITS[k] ? 'Limit ' : 'Goal ') + fmtNut(k, G[k]) + (u || ' cal') : 'No goal'}</div></div><b class="num">${fmtNut(k, R.avg[k])}${u || ''}<span class="small muted" style="display:block;font-weight:500;text-align:right">${txt}</span></b></div>`; })}</div>
    <div class="section-h"><h2>What to change</h2></div>
    ${tips.length ? html`<div class="stack" id="er-tips">${tips.map(t => html`<div key=${t.id} class="card" id=${'tip-' + t.id}><div style="font-weight:700">${t.title}</div><p class="small muted" style="margin-top:2px">${t.body}</p>
      ${t.recipes && t.recipes.length ? html`<div class="stack" style="gap:6px;margin-top:8px">${t.recipes.map(r => html`<div key=${r.id} class="row" style="gap:8px"><button class="btn text" style="flex:1;justify-content:flex-start;padding-left:0;text-align:left" onClick=${() => UI.setView({ type: 'meal', id: r.id })}>${r.name}<span class="small muted" style="font-weight:400"> · ${macroLine(macros(r))}</span></button><button class="btn" id=${'er-add-' + t.id + '-' + r.id} onClick=${() => addToPlan(r.id)}>Add to prep</button></div>`)}</div>` : null}</div>`)}</div>`
      : html`<div class="card note">Nothing stands out. Your averages are close to your goals and you’re eating from most food groups.</div>`}
    ${ML().menu ? html`<div class="row" style="gap:8px;margin-top:10px"><button class="btn" style="flex:1" id="er-targets" onClick=${() => openSheet({ type: 'mealTargets' })}>Adjust my targets</button><button class="btn" style="flex:1" id="er-newweek" onClick=${() => { mealCommit(m => { m.menu = buildMenu(m.menu.t, (m.menu.seed + 7919) % 1e6); }); showToast({ kind: 'info', text: 'A new week of meals is ready on Prep' }); }}>New week of meals</button></div>`
      : html`<button class="btn wide" id="er-plan" style="margin-top:10px" onClick=${() => openSheet({ type: 'mealTargets' })}>Make me a meal plan</button>`}
    <div class="section-h"><h2>Food groups</h2><span class="aside">days with each</span></div>
    <div class="card prl" id="er-groups">${R.groups.map(g => html`<div key=${g.id}><div style="min-width:0"><div style="font-weight:600">${g.name}</div><div class="small muted">${g.gives}</div></div><b class="num">${g.hit} of ${R.N}</b></div>`)}</div>
    <div class="section-h"><h2>Where the calories come from</h2></div>
    <div class="card prl" id="er-top">${R.topKcal.map(f => html`<div key=${f.name}><div style="min-width:0"><div style="font-weight:600">${f.name}</div><div class="small muted">${f.n} time${f.n === 1 ? '' : 's'}</div></div><b class="num">${Math.round(f.share * 100)}%</b></div>`)}</div>
    ${R.timed ? html`<div class="card prl" id="er-times" style="margin-top:8px">${EAT_TIMES.filter(t => R.times[t[0]] > 0).map(t => html`<div key=${t[0]}><div style="font-weight:600">${t[1]}</div><b class="num">${Math.round(R.times[t[0]] / timeTotal * 100)}%</b></div>`)}
      <p class="small muted" style="margin-top:6px">From when you logged, on days you logged as you ate.</p></div>` : null}
    ${R.train ? html`<div class="section-h"><h2>Training days and rest days</h2></div>
      <div class="card prl" id="er-train"><div><div style="font-weight:600">Training days (${R.train.nT})</div><b class="num">${fmt(Math.round(R.train.kcalT))} cal · ${Math.round(R.train.pT)} g protein</b></div>
        <div><div style="font-weight:600">Rest days (${R.train.nR})</div><b class="num">${fmt(Math.round(R.train.kcalR))} cal · ${Math.round(R.train.pR)} g protein</b></div></div>` : null}
    <p class="small faint" style="margin-top:12px">From what you logged. Ironwood counts calories, protein, carbs, fat, fiber, sugar and sodium; vitamins and minerals are only judged from food groups. ${NOT_ADVICE} If you have a health condition, are pregnant, or have a history of disordered eating, talk with a doctor or dietitian.</p>
  </div>`;
}
