/* ============ The dated meal plan (Nov 16, meal planning audit phase 2) ============
   One dated list of planned meals is the source of truth. What you'll cook (plan.items), the shopping list and the
   cooking all come from it, and food log entries link to it.
   meals.days = { 'YYYY-MM-DD': [PlannedMeal] }, PlannedMeal = { id, slot: 'b' | 'l' | 'd' | 's' | 'x', r?, name?, sv,
     by: 'plan' | 'you', sp?: 1, off?: 1 }. slot 'x' is extra food not tied to a meal ("make 2 more"), kept on the first
     day of the dates. sv is servings per person. by 'plan' came from Plan my week and can be re-rolled; by 'you' never is.
     sp marks servings spread from a "times a week" amount (a picked recipe or a prep): they re-spread when the dates
     change. off = not planned for this meal ("covered elsewhere").
   meals.gen = { seed, at, h, t }: the meal plan generator (replaces menu). Its targets come from Daily goals (meals.goals);
     t is only the copy it last used, to know when to re-size.
   meals.rules = [{ dow: 0–6 Monday first, k: meal key }]: meals you don't prep, every week (the repeating part of Skip).
   plan.fromMenu: the generator fills these dates (and new dates when they change). plan.roll: the dates move on to the
     next prep week by themselves (plans made before dates existed).
   meals.v = 2. meals.v1 keeps the old plan, menu and skips for one release. plan.items is worked out, never edited. */
const DAY_KEYS = { 2: ['l', 'd'], 3: ['b', 'l', 'd'], 4: ['b', 'l', 'd', 's'], 5: ['b', 'l', 'd', 's', 's2'] };
const dayKeysFor = n => DAY_KEYS[n] || DAY_KEYS[4];
const keySlot = k => String(k)[0];
const CAT_SLOTS = { breakfast: ['b'], main: ['l', 'd'], snack: ['s'] };
const dowIdx = d => (parseYmd(d).getDay() + 6) % 7;   /* Monday first, like the old weekday plan */
/* A day's meals in slot order with keys (two snacks read s and s2), leaving out extra food */
const dayRows = list => menuRows((list || []).filter(x => x.slot !== 'x'));
/* The dates the plan covers, as YYYY-MM-DD */
function rangeYmds(P) { const s = P.start ? parseYmd(P.start) : prepWeekStartOf(new Date(), 0); const n = P.days || 7 * (P.weeks || 1); return Array.from({ length: n }, (_, k) => ymd(addDays(s, k))); }
const prepWeekStartOf = (d, dow) => { const x = startOfDay(d); return addDays(x, -((x.getDay() - dow + 7) % 7)); };
/* Planned meals that were eaten (a food log entry links to them) */
function eatenIds(m) { const s = new Set(); for (const l of Object.values(m.log || {})) for (const e of l) if (e && e.pm) s.add(e.pm); return s; }
/* What you'll cook, worked out from the dated meals: one item per recipe, n = times a week per person, sv = servings */
function deriveItems(m) {
  const dates = rangeYmds(m.plan); const sum = new Map();
  for (const d of dates) for (const x of (m.days || {})[d] || []) if (x.r && !x.off && x.sv > 0) sum.set(x.r, (sum.get(x.r) || 0) + x.sv);
  return [...sum].map(([r, sv]) => ({ id: 'mp-' + r, r, sv: Math.round(sv * 1000) / 1000, n: sv * 7 / dates.length }));
}
const pmId = () => uid('pm');
const ruleOff = (m, d, k) => (m.rules || []).some(u => u.dow === dowIdx(d) && u.k === k);

/* ---- changes to the dated meals (work on the meals object inside a commit; o = placeOpts()) ---- */
/* o: { dates (the plan's), from (first date to place on), catOf(id) → category, keys (meal keys a day), eaten (Set) } */
/* Put servings of a recipe on the plan: into empty meals of its kind first, then in place of meals the plan picked (from
   the end of the dates), and anything left over as extra food. Returns how many went into meals. */
function dPlace(m, r, count, o, by = 'you', sp = 1) {
  if (!(count > 0)) return 0; m.days = m.days || {}; let left = count; let placed = 0;
  const slots = CAT_SLOTS[o.catOf(r)] || []; const keys = o.keys.filter(k => slots.includes(keySlot(k)));
  const dates = o.dates.filter(d => d >= o.from); const ds = dates.length ? dates : o.dates;
  const mk = k => ({ id: pmId(), slot: keySlot(k), r, sv: 1, by, ...(sp ? { sp: 1 } : {}) });
  for (const d of ds) { if (left < 1) break;
    for (const k of keys) { if (left < 1) break; const list = m.days[d] || []; const taken = new Set(dayRows(list).map(x => x.key));
      if (taken.has(k) || ruleOff(m, d, k)) continue; m.days[d] = list.concat(mk(k)); left -= 1; placed++; } }
  for (const d of ds.slice().reverse()) { if (left < 1) break;
    for (const { x } of dayRows(m.days[d] || []).reverse()) { if (left < 1) break;
      if (x.by !== 'plan' || x.off || o.eaten.has(x.id) || !slots.includes(x.slot)) continue;
      Object.assign(x, { r, sv: 1, by, id: pmId() }, sp ? { sp: 1 } : {}); left -= 1; placed++; } }
  if (left > 1e-6) { const d0 = o.dates[0]; const list = m.days[d0] = m.days[d0] || []; const ex = list.find(x => x.slot === 'x' && x.r === r && x.by === by && !!x.sp === !!sp);
    if (ex) ex.sv = Math.round((ex.sv + left) * 1000) / 1000; else list.push({ id: pmId(), slot: 'x', r, sv: Math.round(left * 1000) / 1000, by, ...(sp ? { sp: 1 } : {}) }); }
  return placed;
}
/* Take servings of a recipe off the plan: extra food first, then meals from the end of the dates. Eaten meals stay. */
function dRemove(m, r, count, o) {
  let left = count; const all = o.dates.slice().reverse();
  const cut = (d, x) => { const k = Math.min(x.sv, left); x.sv = Math.round((x.sv - k) * 1000) / 1000; left -= k; if (x.sv <= 1e-6) m.days[d] = m.days[d].filter(y => y !== x); };
  for (const d of all) for (const x of (m.days[d] || []).slice()) if (left > 1e-6 && x.slot === 'x' && x.r === r) cut(d, x);
  for (const d of all) for (const x of (m.days[d] || []).slice().reverse()) if (left > 1e-6 && x.slot !== 'x' && x.r === r && !x.off && !o.eaten.has(x.id)) cut(d, x);
  for (const d of Object.keys(m.days)) if (!m.days[d].length) delete m.days[d];
}
/* Remove every planned meal on the dates (or only some, by a test), except eaten ones */
function dClear(m, o, keep = () => false) {
  for (const d of o.dates) { const l = (m.days[d] || []).filter(x => o.eaten.has(x.id) || keep(x)); if (l.length) m.days[d] = l; else delete m.days[d]; }
}
/* Fill the dates from a weekly pattern (pattern[0] is Monday): the plan's meals are replaced when asked, meals you set
   and eaten ones always stay. Returns { filled, kept }. */
function dFillPattern(m, pattern, o, replace) {
  m.days = m.days || {}; let filled = 0; const keptIds = new Set();
  for (const d of o.dates) { if (d < o.from) continue;
    let list = m.days[d] || [];
    if (replace) list = list.filter(x => x.by !== 'plan' || o.eaten.has(x.id));
    for (const { x } of dayRows(list)) keptIds.add(x.id);
    for (const { x: p, key } of menuRows(pattern[dowIdx(d)] || [])) {
      const taken = new Set(dayRows(list).map(y => y.key)); if (taken.has(key)) continue;
      list = list.concat({ id: pmId(), slot: p.slot, r: p.r, sv: p.sv, by: 'plan', ...(ruleOff(m, d, key) ? { off: 1 } : {}) }); filled++; }
    if (list.length) m.days[d] = list; else delete m.days[d]; }
  let kept = 0; for (const d of o.dates) if (d >= o.from) kept += (m.days[d] || []).filter(x => x.by === 'you' && x.slot !== 'x' && keptIds.has(x.id)).length;
  return { filled, kept };
}

/* ---- the same, on the live data ---- */
function placeOpts(m = ML()) {
  const dates = rangeYmds(m.plan); const today = ymd(new Date());
  return { dates, from: today > dates[0] ? today : dates[0], catOf: id => (getRecipe(id) || {}).cat, keys: dayKeysFor(+mealHabits().meals), eaten: eatenIds(m) };
}
const planYmds = () => rangeYmds(ML().plan);
const dayMeals = d => (ML().days || {})[d] || [];
/* Servings per person of a recipe on the plan's dates */
const recipeCount = (r, m = ML()) => { let s = 0; for (const d of rangeYmds(m.plan)) for (const x of (m.days || {})[d] || []) if (x.r === r && !x.off) s += x.sv; return Math.round(s * 1000) / 1000; };
/* Set how many servings (per person) of a recipe are on the plan */
function setRecipeCount(r, count) {
  mealCommit(mm => { const o = placeOpts(mm); const cur = recipeCount(r, mm); if (count > cur) dPlace(mm, r, count - cur, o); else if (count < cur) dRemove(mm, r, cur - count, o); });
}
/* The targets meals are planned for: Daily goals (P1), else the setup answers */
function planT() {
  const G = ML().goals || {}; if (G.kcal > 0 && G.p > 0) return { kcal: G.kcal, p: G.p, c: G.c || 0, f: G.f || 0 };
  return ML().me ? targetsFor(ML().me) : null;
}
/* Build the weekly pattern and put it on the dates. replace: the plan's own meals are picked again; from: first date
   (today for Different meals and re-sizing, so past days stay as they were). Returns null when too few recipes fit. */
function genFill(seed, { replace = true, from, auto, fill = true } = {}) {
  const t = planT(); if (!t) return null; const nm = buildMenu(t, seed); if (!nm) return null; let res;
  mealCommit(mm => { mm.gen = { seed, at: Date.now(), h: nm.h, t: { kcal: t.kcal, p: t.p, c: t.c, f: t.f } }; delete mm.menu;
    const o = placeOpts(mm); if (from) o.from = from; else o.from = o.dates[0];
    res = fill ? dFillPattern(mm, nm.days, o, replace) : { filled: 0, kept: 0 }; if (auto && fill) mm.plan.fromMenu = true; });
  return res;
}
/* The weekly pattern the generator would make now (for screens that show it, and tests) */
const genPattern = () => { const g = ML().gen; const t = planT(); return g && t ? (buildMenu(t, g.seed) || {}).days || null : null; };
/* Pick the plan's meals again with the same seed (after a food preference, star or Leave out change) */
function refreshPlan() { const g = ML().gen; if (!g) return false; return !!genFill(g.seed, { replace: true, from: placeOpts().from }); }
/* Change the dates: servings picked as "times a week" re-spread over the new dates, the plan fills new days, and
   planned meals on future days outside the dates are dropped. Past days stay as they were. */
function setPlanDates(start, days, { keepRoll } = {}) {
  mealCommit(mm => {
    const o0 = placeOpts(mm); const today = ymd(new Date()); const rate = new Map();
    for (const d of o0.dates) for (const x of mm.days[d] || []) if (x.sp && x.r && !x.off) rate.set(x.r, (rate.get(x.r) || 0) + x.sv * 7 / o0.dates.length);
    if (start) mm.plan.start = ymd(start); else mm.plan.start = ymd(prepWeekStart());
    mm.plan.days = clampInt(days, 1, 28, 7); mm.plan.weeks = Math.max(1, Math.min(4, Math.round(mm.plan.days / 7))); if (!keepRoll) delete mm.plan.roll;
    const o = placeOpts(mm); const inR = new Set(o.dates);
    for (const d of Object.keys(mm.days)) { if (d < today) continue;
      const l = mm.days[d].filter(x => o.eaten.has(x.id) || (inR.has(d) && !x.sp));
      if (l.length) mm.days[d] = l; else delete mm.days[d]; }
    if (mm.gen && mm.plan.fromMenu) { const t = planT(); const nm = t && buildMenu(t, mm.gen.seed); if (nm) dFillPattern(mm, nm.days, { ...o, from: o.dates[0] }, false); }
    for (const [r, n] of rate) { const want = Math.max(1, Math.ceil(n * o.dates.length / 7 - 0.02)); let have = 0;
      for (const d of o.dates) for (const x of mm.days[d] || []) if (x.sp && x.r === r && !x.off) have += x.sv;
      if (want > have + 1e-6) dPlace(mm, r, want - have, o); }
  });
}
/* Plans made before dates existed keep moving on to the next prep week by themselves */
function rollCheck() {
  const P = ML().plan; if (!P.roll || !planEnded(P)) return false;
  setPlanDates(prepWeekStart(), 7, { keepRoll: true }); return true;
}
/* Skip a meal (covered elsewhere): on every date of the plan with that weekday, and on future plans (a rule) */
function toggleOffMeal(d, key) {
  mealCommit(mm => { const dow = dowIdx(d); const on = !ruleOff(mm, d, key) && !((dayRows(mm.days[d] || []).find(x => x.key === key) || {}).x || {}).off;
    mm.rules = (mm.rules || []).filter(u => !(u.dow === dow && u.k === key)); if (on) mm.rules.push({ dow, k: key });
    const o = placeOpts(mm);
    for (const dd of o.dates) { if (dowIdx(dd) !== dow) continue; const row = dayRows(mm.days[dd] || []).find(x => x.key === key); if (!row || o.eaten.has(row.x.id)) continue; if (on) row.x.off = 1; else delete row.x.off; }
    if (!mm.rules.length) delete mm.rules; });
}
const isOffMeal = (d, key) => { const row = dayRows(dayMeals(d)).find(x => x.key === key); return !!(row && row.x.off); };
/* Which planned meal a logged recipe counts as (audit D3): the first meal that day with this recipe that isn't
   skipped or eaten already */
function planMealFor(day, rid) {
  if (!rid) return null; const ea = eatenIds(ML());
  for (const { x, key } of dayRows(dayMeals(day))) if (x.r === rid && !x.off && !ea.has(x.id)) return { pm: x.id, key };
  return null;
}
/* The recipes you picked yourself (not the plan's) on the plan's dates */
const pickedIds = () => { const s = new Set(); for (const d of planYmds()) for (const x of dayMeals(d)) if (x.by === 'you' && x.r && !x.off && getRecipe(x.r)) s.add(x.r); return [...s]; };
/* Put a prep's recipes on the plan ("times a week" each). replace: everything not eaten on the dates comes off first. */
function placePrep(mm, items, replace) {
  const o = placeOpts(mm); if (replace) dClear(mm, o); const n = o.dates.length;
  for (const [r, k] of items) { if (!getRecipe(r)) continue; const want = Math.max(1, Math.ceil(k * n / 7 - 0.02)); const have = recipeCount(r, mm);
    if (want > have) dPlace(mm, r, want - have, o); else if (!replace && want < have) dRemove(mm, r, have - want, o); }
  delete mm.plan.fromMenu;
}

/* ---- moving older data over, once ---- */
/* The old shape: plan.items with "times a week", a weekday menu (menu.days[0] is Monday), weekday skips, log entries
   linked by meal key. Builds the dated meals, checks them against the old batch and log, and keeps the old fields in v1.
   If anything doesn't add up, the old batch goes in as extra food so nothing to cook or buy is lost. */
function migrateMealsV2(x) {
  const v1 = { plan: clone(x.plan || {}), ...(x.menu ? { menu: clone(x.menu) } : {}), ...(x.skip ? { skip: clone(x.skip) } : {}) };
  const out = { ...x, v: 2, v1, days: {} }; const P = out.plan = { ...(x.plan || {}) };
  const dow0 = Number.isInteger(x.prepDay) ? x.prepDay : 0;
  if (!P.start) { P.start = ymd(prepWeekStartOf(new Date(), dow0)); P.days = P.days || 7; P.roll = true; }
  const recs = x.recipes || {}; const catOf = id => (recs[id] || MEAL_BUILTIN[id] || (typeof comboRecipe === 'function' ? comboRecipe(id) : null) || {}).cat;
  const before = new Map(); const nDays = P.days || 7;
  for (const it of P.items || []) if (it && it.r) before.set(it.r, (before.get(it.r) || 0) + Math.max(1, Math.ceil(+it.n * nDays / 7 - 0.02)));
  const H = x.habits || {}; const o = { dates: rangeYmds(P), catOf, keys: dayKeysFor(+H.meals || 4), eaten: new Set() };
  o.from = o.dates[0];
  try {
    out.rules = Object.keys(x.skip || {}).map(k => { const [dw, key] = k.split(':'); return { dow: +dw, k: key }; });
    const menu = x.menu && Array.isArray(x.menu.days) ? x.menu : null;
    if (menu) { dFillPattern(out, menu.days, o, false); out.gen = { seed: +menu.seed || 1, at: menu.at || Date.now(), h: menu.h || null, t: menu.t || null };
      if (!(out.goals && out.goals.kcal > 0) && menu.t) out.goals = { ...(out.goals || {}), kcal: menu.t.kcal, p: menu.t.p, c: menu.t.c, f: menu.t.f }; }
    const fromMenu = !!P.fromMenu || !(P.items || []).length;
    if (menu && !fromMenu) {
      /* What you'll cook didn't follow the meal plan: the batch is what counts. Meals of recipes you weren't cooking come
         off (or shrink); then your recipes go into the free meals. */
      for (const d of o.dates) for (const y of (out.days[d] || []).slice()) {
        const want = before.get(y.r) || 0; const have = recipeCount(y.r, out); if (have > want && !y.off) { const cut = Math.min(y.sv, have - want); y.sv -= cut; if (y.sv <= 1e-6) out.days[d] = out.days[d].filter(z => z !== y); }
      }
      for (const d of Object.keys(out.days)) if (!out.days[d].length) delete out.days[d];
    }
    if (!menu || !fromMenu) for (const [r, want] of before) { const have = recipeCount(r, out); if (want > have) dPlace(out, r, want - have, o); }
    P.fromMenu = !!menu && fromMenu ? true : undefined; if (!P.fromMenu) delete P.fromMenu;
    /* log entries linked to a meal key now link to that date's planned meal */
    for (const [d, l] of Object.entries(out.log || {})) for (const e of l) if (e && e.slot && !e.pm) { const row = dayRows(out.days[d] || []).find(z => z.key === e.slot && z.x.r === e.r); if (row) e.pm = row.x.id; }
    /* checks: the batch (per recipe, within one serving of rounding) */
    for (const [r, want] of before) { const got = recipeCount(r, out); if (Math.abs(Math.ceil(got - 0.02) - want) > 1) throw new Error('Batch for ' + r + ': ' + want + ' before, ' + got + ' after'); }
    if (fromMenu && menu) { /* the batch was the menu's: compare with what the menu gives */ }
  } catch (err) {
    out.days = {}; out.migErr = String(err && err.message || err).slice(0, 200);
    for (const [r, want] of before) (out.days[o.dates[0]] = out.days[o.dates[0]] || []).push({ id: pmId(), slot: 'x', r, sv: want, by: 'you', sp: 1 });
    delete P.fromMenu;
  }
  delete out.menu; delete out.skip; delete P.items; if (out.rules && !out.rules.length) delete out.rules;
  /* the whole old state, copied aside before anything is saved (IndexedDB, pre-meals-v2) */
  if (Object.keys(v1.plan.items || []).length || v1.menu) setTimeout(() => mealsCopyAside(v1, x), 0);
  return out;
}
function mealsCopyAside(v1, x) {
  try { const rq = indexedDB.open('ironwood-safety', 1);
    rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains('copies')) d.createObjectStore('copies', { keyPath: 'id' }); };
    rq.onsuccess = () => { try { const t = rq.result.transaction('copies', 'readwrite'); const st = t.objectStore('copies');
      const g = st.get('pre-meals-v2'); g.onsuccess = () => { if (!g.result) st.put({ id: 'pre-meals-v2', at: Date.now(), meals: clone(x) }); }; } catch (e) {} };
  } catch (e) {}
}
