/* ============ Meal plan from your targets, and easy measurements (Nov 2) ============ */
/* meals.me: { h (cm), w (kg), age, sex: 'm' | 'f' | 'x', act: 1–4, goal: 'lose' | 'keep' | 'gain', pace: 'gentle' | 'steady',
   bmi: show BMI, us: true for ft/in and lb }. The targets are estimates (Mifflin-St Jeor resting energy × activity, then
   a modest change for the goal) with a floor, never a crash diet. meals.menu: { seed, t: targets, days: [[{ slot, r, sv }]] }.
   meals.units: 'easy' | 'written' | 'weight' for every ingredient amount in Meals. */
const ACT_LEVELS = [[1, 'Light', 'Desk job, 1–3 workouts a week', 1.375], [2, 'Moderate', '3–5 workouts a week', 1.55], [3, 'Active', '6+ workouts, or on your feet all day', 1.725], [4, 'Very active', 'Physical job plus training', 1.9]];
const GOAL_ADJ = { lose: { gentle: -250, steady: -500 }, keep: { gentle: 0, steady: 0 }, gain: { gentle: 200, steady: 350 } };
const KCAL_FLOOR = { m: 1500, f: 1200, x: 1350 };
const bmiOf = me => me && me.h > 0 && me.w > 0 ? me.w / Math.pow(me.h / 100, 2) : null;
/* Why the numbers can't be worked out (empty fields, out of range, or under 18), or '' when they can */
function meProblem(me) {
  if (!me || !(me.h > 0) || !(me.w > 0) || !(me.age > 0)) return 'Fill in height, weight and age to see your numbers.';
  if (me.age < 18) return 'Calorie targets here are for adults. If you’re under 18, a doctor or dietitian can help with how much to eat while you’re still growing. You can still use the recipes, prep and shopping list.';
  if (me.age > 110 || me.h < 120 || me.h > 230 || me.w < 35 || me.w > 300) return 'Check your height, weight and age: one looks off (' + (me.us ? 'height in feet and inches, weight in pounds' : 'height in cm, weight in kg') + ').';
  return '';
}
function targetsFor(me) {
  if (meProblem(me)) return null;
  const s = me.sex === 'm' ? 5 : me.sex === 'f' ? -161 : -78;
  const bmr = 10 * me.w + 6.25 * me.h - 5 * me.age + s; const act = (ACT_LEVELS.find(a => a[0] === me.act) || ACT_LEVELS[1])[3];
  const tdee = bmr * act; const bmi = bmiOf(me);
  let goal = me.goal || 'keep'; let note = '';
  if (goal === 'lose' && bmi != null && bmi < 18.5) { goal = 'keep'; note = 'Your weight is already on the low side for your height, so this plan is for keeping it steady, not losing.'; }
  let kcal = tdee + (GOAL_ADJ[goal] || GOAL_ADJ.keep)[me.pace || 'gentle'];
  const floor = Math.max(KCAL_FLOOR[me.sex] || KCAL_FLOOR.x, Math.round(bmr));
  if (goal === 'lose' && kcal < floor) { kcal = floor; note = note || 'Ironwood doesn’t plan below ' + fmt(Math.round(floor / 10) * 10) + ' calories a day, so the loss will be slower.'; }
  kcal = Math.round(kcal / 10) * 10;
  const basis = bmi != null && bmi > 30 ? 27 * Math.pow(me.h / 100, 2) : me.w;   /* protein from a lean-ish weight when BMI is high */
  const p = Math.min(220, Math.round(basis * (goal === 'keep' ? 1.6 : 1.8) / 5) * 5);
  const f = Math.round(kcal * 0.28 / 9 / 5) * 5; const c = Math.max(50, Math.round((kcal - p * 4 - f * 9) / 4 / 5) * 5);
  return { kcal, p, c, f, fib: Math.round(kcal / 1000 * 14), na: 2300, bmr: Math.round(bmr), tdee: Math.round(tdee), goal, note, bmi };
}

/* ---- the menu ---- */
const PLAN_SLOTS = [['b', 'Breakfast'], ['l', 'Lunch'], ['d', 'Dinner'], ['s', 'Snack']];
/* A day's items in slot order, each with a key and a label (two snacks read Snack 1 and Snack 2) */
function menuRows(day) {
  const order = PLAN_SLOTS.map(p => p[0]); const ns = day.filter(x => x.slot === 's').length; let k = 0;
  return day.slice().sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)).map(x => {
    const lbl = (PLAN_SLOTS.find(p => p[0] === x.slot) || [, 'Meal'])[1];
    if (x.slot !== 's') return { x, key: x.slot, label: lbl }; k++; return { x, key: k > 1 ? 's' + k : 's', label: ns > 1 ? 'Snack ' + k : 'Snack' }; });
}
function seeded(seed) { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; }; }
function pickN(list, n, rnd) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
function planPool() {
  const ok = r => { const m = macros(r); return m && m.kcal > 0 && !(m.missing && m.missing.length > 1); };
  const all = allRecipes().filter(r => ok(r) && !(typeof avoidRecipe === 'function' && avoidRecipe(r)));
  return { b: all.filter(r => r.cat === 'breakfast' && macros(r).kcal >= 150), m: all.filter(r => r.cat === 'main' && macros(r).kcal >= 300), s: all.filter(r => r.cat === 'snack' && macros(r).kcal >= 100) };
}
/* Eating habits (Nov 2): meals.habits = { meals: 2 | 3 | 4 | 5, prep: 'once' | 'few' | 'fresh', cheap: bool, quick: bool }.
   meals 2 = two bigger meals, 3 = three meals, 4 = three meals and a snack (the default), 5 = three meals and two snacks.
   prep: cook once for the week (fewest recipes), a few times (the default), or fresh most days (more variety).
   cheap leans on budget staples; quick keeps to recipes of 30 minutes or less when enough fit. */
const HABITS0 = { meals: 4, prep: 'few', cheap: false, quick: false };
const mealHabits = () => ({ ...HABITS0, ...(ML().habits || {}) });
const PRICEY = /salmon|steak|sirloin|shrimp|scallop|bison|lamb|almond|cashew|pecan|walnut|pistachio|pine nut|berr|avocado|parmesan|feta|goat cheese|prosciutto|quinoa|protein powder|whey|\bcod\b|halibut|mahi|cheese crisps/;
const CHEAP = /\brice\b|\boats?\b|beans?\b|lentil|\beggs?\b|potato|chicken thigh|ground (turkey|beef|chicken)|pasta|frozen|cabbage|carrot|banana|onion|canned|peanut butter|tortilla|\bmilk\b|cottage cheese|chicken breast/;
function costScore(r) { let s = 0; for (const g of r.ing || []) { const n = String(g && g.n || g || '').toLowerCase(); if (PRICEY.test(n)) s += 2; else if (CHEAP.test(n)) s -= 0.5; } return s; }
/* Narrow the list by your answers, each step only when enough recipes are left: keeps all week (once a week), then
   cheap (nothing pricey, then the cheaper half), then quick (30 minutes or less, else the quickest). */
function shapePool(list, n, H, rnd) {
  let L = list; const keep = f => { const x = L.filter(f); if (x.length >= n) L = x; };
  if (H.prep === 'once') { keep(r => (r.keeps || 4) >= 3); keep(r => r.freezes || (r.keeps || 4) >= 5); }
  if (H.cheap) { keep(r => costScore(r) < 2); const sorted = L.slice().sort((a, b) => costScore(a) - costScore(b)); L = sorted.slice(0, Math.max(n, Math.ceil(sorted.length / 2))); }
  if (H.quick) { const byTime = L.slice().sort((a, b) => (+a.mins || 99) - (+b.mins || 99)); const q = byTime.filter(r => +r.mins > 0 && +r.mins <= 30); L = q.length >= n ? q : byTime.slice(0, Math.max(n, q.length)); }
  return pickN(L, Math.min(n, L.length), rnd);
}
function buildMenu(t, seed) {
  const P = planPool(); const rnd = seeded(seed); const H = mealHabits(); const two = +H.meals === 2;
  if ((!two && !P.b.length) || P.m.length < 2) return null;
  const nM = H.prep === 'once' ? 2 : H.prep === 'fresh' ? 5 : 3, nB = H.prep === 'once' ? 1 : H.prep === 'fresh' ? 3 : 2;
  const mains = two && P.m.length > nM ? P.m.slice().sort((a, b) => macros(b).kcal - macros(a).kcal).slice(0, Math.max(nM, Math.ceil(P.m.length / 2))) : P.m; /* two meals: the bigger mains */
  const bs = two ? [] : shapePool(P.b, nB, H, rnd), ms = shapePool(mains, nM, H, rnd);
  const cheapS = P.s.filter(r => costScore(r) <= 0);
  const snacks = (H.cheap && cheapS.length ? cheapS : H.cheap && P.s.length ? P.s.slice().sort((a, b) => costScore(a) - costScore(b)).slice(0, 2) : P.s).sort((a, b) => macros(b).p / macros(b).kcal - macros(a).p / macros(a).kcal);
  const maxSnacks = +H.meals === 5 ? 2 : +H.meals === 4 ? 1 : 0; const maxSv = two ? 2.5 : 2; const topUp = snacks.length ? snacks.slice().sort((a, b) => macros(b).kcal - macros(a).kcal)[0] : null;
  const addSnack = (day, r) => { const y = day.find(x => x.slot === 's' && x.r === r.id); if (y) y.sv += 1; else day.push({ slot: 's', r: r.id, sv: 1 }); };
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = two ? [{ slot: 'l', r: ms[i % ms.length].id, sv: 1 }, { slot: 'd', r: ms[(i + 1) % ms.length].id, sv: 1 }]
      : [{ slot: 'b', r: bs[i % bs.length].id, sv: 1 }, { slot: 'l', r: ms[i % ms.length].id, sv: 1 }, { slot: 'd', r: ms[(i + 1) % ms.length].id, sv: 1 }];
    const tot = () => day.reduce((a, x) => { const m = macros(getRecipe(x.r)); a.kcal += m.kcal * x.sv; a.p += m.p * x.sv; return a; }, { kcal: 0, p: 0 });
    /* snacks when there's room: the most protein for its calories when protein is short */
    let T = tot();
    for (let k = 0; k < maxSnacks && snacks.length; k++) { T = tot(); if (T.kcal >= t.kcal - 120) break;
      const s = T.p < t.p - 15 && !day.some(x => x.r === snacks[0].id) ? snacks[0] : snacks[(i + k + Math.floor(rnd() * snacks.length)) % snacks.length]; addSnack(day, s); }
    /* then portions in half steps toward the calorie target */
    for (let k = 0; k < 14; k++) {
      T = tot(); const gap = t.kcal - T.kcal; if (Math.abs(gap) < 90) break;
      const main = day.filter(x => x.slot === 'l' || x.slot === 'd' || x.slot === 'b');
      if (gap > 0) { const x = main.filter(y => y.sv < maxSv).sort((a, b) => macros(getRecipe(b.r)).p / macros(getRecipe(b.r)).kcal - macros(getRecipe(a.r)).p / macros(getRecipe(a.r)).kcal)[0]; if (!x || macros(getRecipe(x.r)).kcal * 0.5 > gap + 120) break; x.sv += 0.5; }
      else { const s = day.filter(y => y.slot === 's').pop(); if (s) { day.splice(day.indexOf(s), 1); continue; } const x = main.filter(y => y.sv > 0.5).sort((a, b) => macros(getRecipe(b.r)).kcal - macros(getRecipe(a.r)).kcal)[0]; if (!x || macros(getRecipe(x.r)).kcal * 0.5 > -gap + 120) break; x.sv -= 0.5; }
    }
    /* still more than 10% short with portions at their cap (2 or 3 meals, big targets): top up with a snack */
    for (let k = 0; k < 2 && topUp; k++) { T = tot(); if (t.kcal - T.kcal < t.kcal * 0.1) break; addSnack(day, topUp); }
    days.push(day);
  }
  return { seed, t, days, at: Date.now(), h: H };
}
function HabitsFields({ v, set }) {
  const seg = (k, opts, id) => html`<div class="seg wide" role="group" style="margin-top:6px">${opts.map(([x, l]) => html`<button key=${x} id=${'hb-' + id + '-' + x} class=${v[k] === x ? 'on' : ''} aria-pressed=${v[k] === x} onClick=${() => set({ ...v, [k]: x })}>${l}</button>`)}</div>`;
  return html`<div class="stack" style="gap:12px" id="habits-fields">
    <div><span class="lbl">Meals a day</span>${seg('meals', [[2, '2'], [3, '3'], [4, '3 + snack'], [5, '3 + 2 snacks']], 'meals')}</div>
    <div><span class="lbl">How you cook</span>${seg('prep', [['once', 'Once a week'], ['few', 'A few times'], ['fresh', 'Most days']], 'prep')}
      <p class="small muted" style="margin-top:4px">${v.prep === 'once' ? 'Fewest recipes: one big cook covers the week.' : v.prep === 'fresh' ? 'More variety, smaller batches.' : 'Two or three cooks a week.'}</p></div>
    <label class="toggle-row" for="hb-cheap"><span><span>Keep it cheap</span><span class="d">Leans on rice, oats, eggs, beans, chicken and frozen veg.</span></span><input type="checkbox" role="switch" id="hb-cheap" checked=${v.cheap} onChange=${e => set({ ...v, cheap: e.target.checked })}/></label>
    <label class="toggle-row" for="hb-quick"><span><span>Quick recipes</span><span class="d">30 minutes or less where possible, otherwise the quickest recipes.</span></span><input type="checkbox" role="switch" id="hb-quick" checked=${v.quick} onChange=${e => set({ ...v, quick: e.target.checked })}/></label></div>`;
}
const dayTotals = day => roundNut(day.reduce((a, x) => { const m = macros(getRecipe(x.r)) || {}; for (const [k] of NUT) a[k] = (a[k] || 0) + (+m[k] || 0) * x.sv; return a; }, {}));
const menuDayIdx = (d = new Date()) => (d.getDay() + 6) % 7;   /* Monday first */
/* "1½ bowls", "7 meatballs", "1 cup cooked (a fist)" */
function portionText(r, sv) {
  const g = r.size ? parseIng(r.size) : null; const um = !g && r.size ? String(r.size).match(/^(\S+)\s+([A-Za-z]+)$/) : null;
  if (um && numOf(um[1]) > 0) { const u = UNIT_ALIAS[um[2].toLowerCase()]; const q = numOf(um[1]) * sv; return u ? qtyText(q, u) : fracStr(q) + ' ' + (q > 1.01 ? plural(um[2]) : um[2]); }
  if (!g || g.q == null) return (sv === 1 ? '1 serving' : fracStr(sv) + ' servings') + (r.size ? ' (' + r.size + ' each)' : '');
  const q = g.q * sv; const easy = ML().units !== 'weight';
  let hint = '';
  if (easy && g.u === 'cup') hint = q <= 0.6 ? ' (a cupped hand)' : q <= 1.2 ? ' (about a fist)' : ' (about ' + fracStr(Math.round(q * 2) / 2) + ' fists)';
  if (easy && (g.u === 'oz') && /cooked/.test(g.n)) hint = q <= 5 ? ' (about a palm)' : ' (about ' + fracStr(Math.round(q / 4 * 2) / 2) + ' palms)';
  return qtyText(q, g.u) + ' ' + nameFor(g.n, q, g.u) + hint;
}

/* ---- easy and by-weight amounts ---- */
/* Spices, sauces, oils and anything measured by the spoon stay exact. */
const isExactIng = g => g.u === 'tsp' || g.u === 'tbsp' || g.u === 'pinch' || g.a === 'pantry' || /sauce|dressing|vinegar|\boil\b|seasoning|spice|extract/i.test(shopName(g.n));
const EACH = [
  [/chicken breast/, 225, 'chicken breast'], [/chicken thigh|\bthighs?\b/, 115, 'chicken thigh'],
  [/ground (turkey|beef|chicken|pork|bison)/, 454, 'pack', ' (1 lb each)', true], [/turkey liver|chicken liver/, 454, 'pack', ' (1 lb each)', true],
  [/salmon/, 170, 'salmon fillet'], [/\bcod\b|tilapia|white fish|\bfish\b/, 170, 'fish fillet'], [/shrimp/, 454, 'bag', ' (1 lb each)', true],
  [/tofu/, 400, 'block', '', true], [/steak|sirloin/, 250, 'steak'], [/pork chop/, 200, 'pork chop'], [/pork tenderloin/, 500, 'pork tenderloin'], [/sausage/, 85, 'link', '', true],
  [/sweet potato/, 200, 'sweet potato'], [/potato/, 210, 'potato'], [/butternut/, 1000, 'butternut squash'],
  [/onion/, 150, 'onion'], [/bell pepper|\bpeppers?\b/, 150, 'bell pepper'], [/carrot/, 60, 'carrot'], [/zucchini/, 200, 'zucchini'],
  [/broccoli/, 450, 'head', '', true], [/cauliflower/, 600, 'head', '', true], [/cabbage/, 900, 'head', '', true],
  [/tomato(es)?\b(?!.*(sauce|paste|crushed|diced|canned))/, 120, 'tomato'], [/cucumber/, 300, 'cucumber'], [/apple/, 180, 'apple'], [/banana/, 120, 'banana'],
  [/mushroom/, 227, 'pack', ' (8 oz each)', true], [/spinach|kale/, 142, 'bag', ' (5 oz each)', true], [/green bean|brussels/, 340, 'bag', ' (12 oz each)', true],
  [/pasta|spaghetti|penne|noodle/, 454, 'box', ' (1 lb each)', true]];
function eachFor(n) { const t = shopName(n).toLowerCase(); for (const e of EACH) if (e[0].test(t)) return e; return null; }
const roundHalf = v => Math.max(0.5, Math.round(v * 2) / 2);
function wtText(gr) { const [v, u, dec] = measure(gr, { k: 'wt', mul: 1 }, false); return qtyText(isMetric() ? v : Math.round(v * 4) / 4, u, dec); }
/* One ingredient line in the chosen style; f = how much the recipe is scaled */
function amtLine(g, f, mode) {
  mode = mode || (ML().units === 'weight' ? 'weight' : 'easy');
  if (mode === 'written' || g.q == null || isExactIng(g)) return ingLine(g, f);
  const fam = famOf(g.u); const food = foodFor(g);
  if (mode === 'easy') {
    if (fam.k !== 'wt') return ingLine(g, f);
    const gr = g.q * fam.mul * f; const e = eachFor(g.n);
    if (e) { const v = gr / e[1]; const n = v >= 3 ? Math.round(v) : roundHalf(v); const label = e[4] ? (n > 1.01 ? plural(e[2]) : e[2]) + ' ' + shopName(g.n) + (e[3] && n > 1.01 ? e[3] : e[3] ? e[3].replace(' each', '') : '') : (n > 1.01 ? plural(e[2]) : e[2]);
      return { q: fracStr(n), n: label + ' · about ' + wtText(gr) }; }
    if (food && food.g && food.g.cup) { const cups = Math.max(0.25, Math.round(gr / food.g.cup * 4) / 4); return { q: qtyText(cups, 'cup'), n: shopName(g.n) }; }
    return ingLine(g, f);
  }
  /* by weight */
  if (fam.k === 'wt') return { q: wtText(g.q * fam.mul * f) + (isMetric() ? '' : ''), n: g.n };
  const gr0 = food && !food.skip ? gramsOf(g, food) : null;
  if (gr0 > 0) { const gr = gr0 * f; return { q: isMetric() ? wtText(gr) : wtText(gr) + ' (' + Math.round(gr) + ' g)', n: shopName(g.n) }; }
  return ingLine(g, f);
}
/* Shopping list: easy mode turns weights into things you can count off the shelf */
function easyShop(e) {
  if (ML().units === 'weight' || !e.fams.wt || Object.keys(e.fams).length !== 1) return null;
  const x = eachFor(e.name); if (!x) return null; const gr = e.fams.wt.total; const n = Math.max(1, Math.ceil(gr / x[1] - 0.15));
  return { qty: String(n), label: x[4] ? (n > 1 ? plural(x[2]) : x[2]) + ' ' + e.name + (x[3] && n > 1 ? x[3] : '') : (n > 1 ? plural(x[2]) : x[2]) + ' (about ' + wtText(gr) + ')' };
}
function UnitsSeg({ small }) {
  const cur = ML().units === 'weight' ? 'weight' : 'easy';   /* two choices (Nov 10, meal audit M6); old "as written" reads as Easy */
  return html`<div class=${'seg' + (small ? '' : ' wide')} role="group" aria-label="Amounts" id="units-seg">${[['easy', 'Easy amounts'], ['weight', 'By weight']].map(([k, l]) => html`<button key=${k} id=${'units-' + k} class=${cur === k ? 'on' : ''} aria-pressed=${cur === k} onClick=${() => mealCommit(m => { m.units = k; })}>${l}</button>`)}</div>`;
}

/* ---- setup sheet ---- */
function TargetsSheet({ preset } = {}) {
  const me0 = ML().me || {}; const lastBw = (S.meta.bw || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).pop();
  const us0 = me0.us != null ? me0.us : !isMetric();
  const [d, setD] = useState(() => {
    const kgW = me0.w || (lastBw ? conv(+lastBw.w, lastBw.u || U(), 'kg') : 0);
    return { us: us0, ft: me0.h ? String(Math.floor(me0.h / 2.54 / 12)) : '', inch: me0.h ? String(Math.round(me0.h / 2.54 % 12)) : '', cm: me0.h ? String(Math.round(me0.h)) : '',
      pf: prefsOf(), hb: mealHabits(), w: kgW ? String(Math.round(us0 ? kgW * 2.20462 : kgW)) : '', age: me0.age ? String(me0.age) : '', sex: me0.sex || 'x', act: me0.act || 2, goal: (preset && preset.goal) || me0.goal || (mealGoalFromAbout(aboutYou().goal) || {}).goal || 'keep', pace: (preset && preset.pace) || me0.pace || (mealGoalFromAbout(aboutYou().goal) || {}).pace || 'gentle', bmi: !!me0.bmi, units: ML().units && ML().units !== 'written' ? ML().units : 'easy' };
  });
  const set = (k, v) => setD({ ...d, [k]: v });
  const h = d.us ? ((+d.ft || 0) * 12 + (+d.inch || 0)) * 2.54 : +d.cm; const w = d.us ? (+d.w || 0) / 2.20462 : +d.w;
  const me = { h, w, age: +d.age, sex: d.sex, act: d.act, goal: d.goal, pace: d.pace, bmi: d.bmi, us: d.us };
  const t = targetsFor(me); const bmi = bmiOf(me);
  const seg = (k, opts) => html`<div class="seg wide" role="group" style="margin-top:6px">${opts.map(([v, l]) => html`<button key=${v} id=${'tg-' + k + '-' + v} class=${d[k] === v ? 'on' : ''} aria-pressed=${d[k] === v} onClick=${() => set(k, v)}>${l}</button>`)}</div>`;
  const save = () => {
    mealCommit(m => { m.prefs = savePrefs(d.pf); m.habits = { ...d.hb }; m.me = me; m.goals = { ...m.goals, kcal: t.kcal, p: t.p, c: t.c, f: t.f, fib: t.fib, na: t.na }; m.units = d.units; m.menu = buildMenu(t, Date.now() % 1e6); });
    /* Making the plan fills the prep and shopping list right away (Nov 10, meal audit M1). A prep you built yourself or a
       rotation is only replaced if you say so. */
    const own = ML().plan.items.length > 0 && !ML().plan.fromMenu || !!ML().rot;
    if (ML().menu && !own) usePlanForPrep(true, true);
    const hadPrep = own;
    closeSheet(); setMealsMode('plan'); showToast({ kind: 'info', ms: hadPrep && ML().menu ? 10000 : 7000, ...(hadPrep && ML().menu ? { action: 'Update my prep', fn: () => usePlanForPrep(true) } : {}), text: ML().menu ? 'Your targets and a week of meals are ready.' + (hadPrep ? ' Your prep and shopping list still have the old recipes.' : '') : 'Targets set. Not enough recipes fit your food answers for a full week yet: add a few of your own (Recipes → New recipe or From a post) and tap Make me a meal plan again.' });
  };
  return html`<${Sheet} label="Your meal plan"><h2>Your meal plan</h2>
    <p class="note">A few numbers and Ironwood sets your daily calories and protein, then builds a week of meals from the recipes here.</p>
    ${preset ? html`<p class="small muted" id="tg-from-goal">Your goal is filled in from your plan answers. Change it if you like.</p>` : typeof GoalSetupSheet === 'function' ? html`<button class="btn text" id="tg-goal" onClick=${() => openSheet({ type: 'goalSetup' })}>Want a training plan too? Answer a few questions</button>` : null}
    <div class="stack" style="margin-top:12px">
      <div class="row"><span class="lbl" style="flex:1;margin:0">Units</span><div class="seg" role="group">${[[true, 'ft · lb'], [false, 'cm · kg']].map(([v, l]) => html`<button key=${l} class=${d.us === v ? 'on' : ''} aria-pressed=${d.us === v} onClick=${() => set('us', v)}>${l}</button>`)}</div></div>
      <div class="row" style="gap:10px">${d.us ? html`<div style="flex:1"><label class="lbl" for="tg-ft">Height</label><div class="row" style="gap:6px"><input class="field" id="tg-ft" inputmode="numeric" placeholder="ft" value=${d.ft} onInput=${e => set('ft', e.target.value.replace(/\D/g, ''))}/><input class="field" id="tg-in" inputmode="numeric" placeholder="in" value=${d.inch} onInput=${e => { const v = e.target.value.replace(/\D/g, ''); set('inch', v === '' ? '' : String(Math.min(11, +v))); }}/></div></div>`
        : html`<div style="flex:1"><label class="lbl" for="tg-cm">Height (cm)</label><input class="field" id="tg-cm" inputmode="numeric" value=${d.cm} onInput=${e => set('cm', e.target.value.replace(/\D/g, ''))}/></div>`}
        <div style="flex:1"><label class="lbl" for="tg-w">Weight (${d.us ? 'lb' : 'kg'})</label><input class="field" id="tg-w" inputmode="decimal" value=${d.w} onInput=${e => set('w', e.target.value.replace(/[^\d.]/g, ''))}/></div></div>
      <div class="row" style="gap:10px"><div style="flex:1"><label class="lbl" for="tg-age">Age</label><input class="field" id="tg-age" inputmode="numeric" value=${d.age} onInput=${e => set('age', e.target.value.replace(/\D/g, ''))}/></div>
        <div style="flex:2"><span class="lbl">For the formula</span>${seg('sex', [['m', 'Male'], ['f', 'Female'], ['x', 'Skip']])}</div></div>
      <div><span class="lbl">How active are you?</span><div class="stack" style="gap:6px;margin-top:6px">${ACT_LEVELS.map(([v, l, s]) => html`<button key=${v} id=${'tg-act-' + v} class=${'opt' + (d.act === v ? ' on' : '')} aria-pressed=${d.act === v} onClick=${() => set('act', v)}><div style="flex:1"><div>${l}</div><div class="d">${s}</div></div>${d.act === v ? I.check : null}</button>`)}</div></div>
      <div><span class="lbl">Your goal</span>${seg('goal', [['lose', 'Lose fat'], ['keep', 'Maintain'], ['gain', 'Build muscle']])}</div>
      ${d.goal !== 'keep' ? html`<div><span class="lbl">Pace</span>${seg('pace', d.goal === 'lose' ? [['gentle', 'Gentle (about ½ lb a week)'], ['steady', 'Steady (about 1 lb)']] : [['gentle', 'Lean (slow gain)'], ['steady', 'Faster']])}</div>` : null}
      <label class="toggle-row" for="tg-bmi"><span><span>Show my BMI</span><span class="d">Optional. A rough screening number that doesn’t account for muscle.</span></span><input type="checkbox" role="switch" id="tg-bmi" checked=${d.bmi} onChange=${e => set('bmi', e.target.checked)}/></label>
      <div><div class="section-h" style="margin:4px 0 2px"><h2>Food</h2></div><${PrefsFields} v=${d.pf} set=${pf => set('pf', pf)}/></div>
      <div><div class="section-h" style="margin:4px 0 2px"><h2>How you eat</h2></div><${HabitsFields} v=${d.hb} set=${hb => set('hb', hb)}/></div>
      <div><span class="lbl">How should amounts look?</span>${seg('units', [['easy', 'Easy (3 chicken breasts)'], ['weight', 'By weight']])}<p class="small muted" style="margin-top:4px">Spices and sauces stay exact either way. Change it any time.</p></div>
      ${t ? html`<div class="card" id="tg-result"><div style="font-weight:700">${fmt(t.kcal)} calories a day</div>
          <div class="small muted">Protein ${t.p} g · Carbs ${t.c} g · Fat ${t.f} g · Fiber ${t.fib} g${d.bmi && bmi ? ' · BMI ' + (Math.round(bmi * 10) / 10) : ''}</div>
          ${t.note ? html`<p class="small" style="margin-top:6px">${t.note}</p>` : null}
          <p class="small faint" style="margin-top:6px">From a standard formula. ${NOT_ADVICE} If you have a health condition, are pregnant, or have a history of disordered eating, check with a doctor or dietitian first.</p></div>` : html`<p class="small muted" id="tg-problem">${meProblem(me)}</p>`}
      <button class="btn primary wide" id="tg-save" disabled=${!t} onClick=${save}>Make my plan</button>
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}

/* ---- the plan on Prep, today's menu on Log ---- */
/* Fill the prep and shopping list from the week's menu (asks first when it would replace something) */
function usePlanForPrep(sure, quiet) {
  const m = ML(); const mn = m.menu; if (!mn || !mn.days) return;
  const week = {}; for (const d of mn.days) for (const x of d) week[x.r] = (week[x.r] || 0) + x.sv;
  const apply = () => { mealCommit(mm => { mm.plan.items = Object.entries(week).filter(([r]) => getRecipe(r)).map(([r, n]) => ({ id: uid('mp'), r, n: Math.max(1, Math.ceil(n - 1e-6)) })); mm.plan.people = 1; mm.plan.weeks = 1; mm.plan.fromMenu = true; mm.checks = {}; delete mm.rot; }); if (quiet) return; closeSheet(); showToast({ kind: 'info', text: 'Your prep and shopping list now match this plan.' }); };
  if (sure || (m.plan.fromMenu && !m.rot) || (!m.plan.items.length && !m.rot)) apply(); else openSheet({ type: 'confirm', title: 'Use this plan for your prep?', body: 'It replaces your current prep' + (m.rot ? ' and stops your rotation' : '') + ', and the shopping list starts fresh.', ok: 'Use this plan', onOk: apply });
}
function MenuCard() {
  const m = ML(); const mn = m.menu; const [di, setDi] = useState(menuDayIdx());
  if (!mn || !mn.days || !mn.days.length) return html`<div class="card plan-cta" id="plan-cta"><div style="font-weight:700">Make me a meal plan</div>
    <p class="small muted" style="margin:2px 0 10px">Enter your height, weight and goal. Ironwood sets your calories and protein, picks a week of meals with portions, and fills your prep and shopping list.</p>
    <button class="btn primary wide" id="plan-start" onClick=${() => openSheet({ type: 'mealTargets' })}>Start</button>
    <button class="btn text" id="plan-whole" style="padding-left:0" onClick=${() => openSheet({ type: 'goalSetup' })}>Or build a training plan and meals together</button></div>`;
  const day = (mn.days[di] || []).filter(x => getRecipe(x.r)); const tot = dayTotals(day); const t = mn.t || {};
  const reroll = () => { mealCommit(mm => { mm.menu = buildMenu(mm.menu.t, (mm.menu.seed + 7919) % 1e6); }); if (ML().plan.fromMenu && !ML().rot) usePlanForPrep(true, true); };
  const usePlan = () => usePlanForPrep(false);
  return html`<div class="card" id="menu-card">
    <div class="row"><div style="flex:1;min-width:0"><div class="eyebrow">Your meal plan</div><div style="font-weight:700">${fmt(t.kcal)} cal · ${t.p} g protein a day</div></div>
      <button class="btn text" id="plan-edit" onClick=${() => openSheet({ type: 'mealTargets' })}>Edit my answers</button></div>
    <button class="btn text" id="plan-prefs" style="padding-left:0" onClick=${() => openSheet({ type: 'mealPrefs' })}>Food preferences${prefsOf().allergies.length || prefsOf().diets.length || prefsOf().dislikes ? ' (set)' : ''}</button>
    <div class="menu-days" role="tablist">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => html`<button key=${i} role="tab" aria-selected=${di === i} class=${'chip' + (di === i ? ' on' : '')} id=${'menu-d' + i} onClick=${() => setDi(i)}>${l}</button>`)}</div>
    <p class="small muted" style="margin:6px 0 2px">Tap a meal for its recipe.</p>
    <div class="menu-list">${menuRows(day).map(({ x, key: s, label }) => { const r = getRecipe(x.r);
      return html`<button key=${s} class="menu-row" onClick=${() => UI.setView({ type: 'meal', id: r.id })}><span class="eyebrow">${label}</span><span class="t">${r.name}</span><span class="s">${portionText(r, x.sv)}</span></button>`; })}</div>
    <div class="small muted num" id="menu-total">This day: ${fmt(tot.kcal)} cal · ${tot.p} g protein · ${tot.c} g carbs · ${tot.f} g fat${t.p ? ' · ' + (Math.abs(tot.p - t.p) <= Math.max(10, t.p * 0.1) ? 'protein on target' : (tot.p > t.p ? '+' : '−') + Math.abs(Math.round(tot.p - t.p)) + ' g protein vs your target') : ''}</div>
    ${t.kcal && tot.kcal < t.kcal * 0.9 ? html`<p class="small" id="menu-short" style="margin-top:4px">About ${fmt(Math.round((t.kcal - tot.kcal) / 10) * 10)} cal short of your target. Add a snack or a bigger portion${+mealHabits().meals < 4 ? ', or pick more meals a day in Edit' : ''}.</p>`
      : t.kcal && tot.kcal > t.kcal * 1.1 ? html`<p class="small" id="menu-short" style="margin-top:4px">About ${fmt(Math.round((tot.kcal - t.kcal) / 10) * 10)} cal over your target. Eat a smaller portion of one meal.</p>` : null}
    <div style="margin-top:10px"><${UnitsSeg}/></div>
    <div class="row" style="margin-top:10px;gap:8px">${m.plan.fromMenu && !m.rot ? html`<button class="btn primary" style="flex:1" id="plan-list" onClick=${() => setMealsMode('list')}>Shopping list</button>` : html`<button class="btn primary" style="flex:1" id="plan-use" onClick=${usePlan}>Use for my prep</button>`}<button class="btn" style="flex:1" id="plan-shuffle" onClick=${reroll}>Different meals</button></div>
    <p class="small faint" style="margin-top:8px">${NOT_ADVICE}</p></div>`;
}
function TodayMenu({ day }) {
  const mn = ML().menu; if (!mn || !mn.days) return null;
  const list = (mn.days[menuDayIdx(parseYmd(day))] || []).filter(x => getRecipe(x.r)); if (!list.length) return null;
  const logged = new Set((ML().log[day] || []).filter(e => e.k === 'recipe').map(e => e.r + ':' + (e.slot || '')));
  return html`<div id="today-menu"><div class="section-h"><h2>On your plan</h2></div><div class="stack" style="gap:8px">${menuRows(list).map(({ x, key: s, label }) => { const r = getRecipe(x.r); const done = logged.has(r.id + ':' + s);
    return html`<div key=${s} class="menu-log"><div style="flex:1;min-width:0"><div class="eyebrow">${label}</div><div style="font-weight:600">${r.name}</div><div class="small muted">${portionText(r, x.sv)}</div></div>
      <button class=${'btn' + (done ? '' : ' primary')} id=${'menu-log-' + s} disabled=${done} onClick=${() => { const e = logRecipe(day, r, x.sv); if (e) { mealCommit(mm => { const y = (mm.log[day] || []).find(z => z.id === e.id); if (y) y.slot = s; }); showToast({ kind: 'info', text: r.name + ' logged', action: 'Undo', ms: 5000, fn: () => dropLog(day, e.id) }); } }}>${done ? 'Logged' : 'Ate it'}</button></div>`; })}</div></div>`;
}
