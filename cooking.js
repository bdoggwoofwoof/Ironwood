/* ============ Start cooking (Nov 11, Newt) ============
   Turns what you'll cook into one cooking session: long hands-off things (slow cooker, oven, simmering pots, rice)
   start first, and the hands-on steps of the other recipes fill the time while they cook. One cook, so only one
   hands-on step at a time; a hands-off step only needs a couple of minutes to start, then runs by itself.
   Steps are read from each recipe: a step that names a time and an oven, pot, slow cooker, fridge or rest is
   hands-off for that long. Chopping for every recipe is pulled together up front. Ticks live in meals.cook
   ({ start, done: { key: true } }) until you finish or start over. */
const COOK_PASSIVE = /slow cooker|cook on (low|high)|\boven\b|\bbak(e|es|ing)\b|\broast|simmer|\bboil|bring .* to a boil|cover(ed)? and cook|\bcook (it |them )?(covered|for)|rice cooker|refrigerat|\bchill|\bfreez|\brest\b|marinat|\bsoak|\bsteep|let (it |them )?(sit|cool|stand)|\bcool\b|until (soft|tender|cooked|done)|minutes? more/;
const COOK_DUR = /(\d+(?:\.\d+)?|½|¼)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/i;
const COOK_OVEN = /\boven\b|\bbak(e|es|ing)\b|\broast|\bbroil/;
const COOK_KNIFE = /\b(diced|minced|chopped|sliced|grated|cubed|shredded|julienned|crushed|halved|quartered|cut into [^,]+)\b/;
function stepTiming(s) {
  const t = String(s).toLowerCase();
  if (/overnight/.test(t)) return { passive: true, mins: 8 * 60, overnight: true };
  const m = COOK_DUR.exec(t); let mins = 0;
  if (m) { const a = m[1] === '½' ? 0.5 : m[1] === '¼' ? 0.25 : +m[1]; const b = m[2] ? +m[2] : a; const v = Math.max(a, b); mins = /^h/.test(m[3]) ? v * 60 : v; }
  if (mins >= 8 && COOK_PASSIVE.test(t)) return { passive: true, mins: Math.round(mins) };
  if (mins > 0 && mins < 8) return { passive: false, mins: Math.round(mins) };
  return { passive: false, mins: 0 };
}
/* Hands-on minutes for a step without a time: the recipe's hands-on time shared over its untimed steps */
function cookTasks(items) {
  const out = [];
  for (const { it, r } of items) {
    const steps = (r.steps || []); const tm = steps.map(stepTiming);
    const untimed = tm.filter(x => !x.passive && !x.mins).length;
    const passiveSum = tm.filter(x => x.passive && !x.overnight).reduce((a, x) => a + x.mins, 0);
    const handsOn = Math.max(untimed * 3, (+r.mins || 0) - passiveSum - tm.filter(x => !x.passive).reduce((a, x) => a + x.mins, 0));
    const each = untimed ? Math.min(12, Math.max(3, Math.round(handsOn / untimed))) : 0;
    const temp = (/(\d{3})\s*°\s*F/.exec(steps.join(' ')) || [])[1];
    const f = servingsFor(it) / (r.serves || 1);
    const withAmt = stepsWithAmounts(r, f);
    out.push({ r, f, steps: steps.map((s, i) => ({ key: r.id + ':' + i, r, i, text: s, parts: withAmt[i], passive: tm[i].passive, overnight: tm[i].overnight, run: tm[i].passive ? tm[i].mins : 0, work: tm[i].passive ? 2 : (tm[i].mins || each), oven: COOK_OVEN.test(String(s).toLowerCase()) && !/slow cooker/i.test(s), temp: temp ? +temp : 0 })) });
  }
  return out;
}
/* Schedule: at each moment do the next hands-on step of the recipe with the most time left (counting its
   hands-off waits), so long dishes get going first. Long hands-off steps (over 2 hours) go to Set and forget. */
function cookSchedule(items) {
  const recs = cookTasks(items);
  const longFirst = [], rest = [];
  for (const rc of recs) { const k = rc.steps.findIndex(s => s.passive && (s.run > 120 || s.overnight)); if (k >= 0) longFirst.push(rc); else rest.push(rc); }
  const left = rc => rc.steps.slice(rc.pos).reduce((a, s) => a + s.work + s.run, 0);
  rest.forEach(rc => { rc.pos = 0; rc.free = 0; });
  const plan = []; let t = 0; let guard = 0; const notes = [];
  /* One oven: a dish holds it from its first oven step to its last; another dish at the same temperature can share,
     a different temperature waits until it's free. */
  const oven = { temp: 0, users: new Set(), freeAt: 0 };
  const ovenFree = () => !oven.users.size && oven.freeAt <= t;
  const ovenOk = (rc, s) => !s.oven || !s.temp || oven.users.has(rc) || ovenFree() || (oven.temp === s.temp && oven.users.size > 0);
  while (rest.some(rc => rc.pos < rc.steps.length) && guard++ < 800) {
    const ready = rest.filter(rc => rc.pos < rc.steps.length && rc.free <= t && ovenOk(rc, rc.steps[rc.pos]));
    if (!ready.length) { const nexts = rest.filter(rc => rc.pos < rc.steps.length).map(rc => rc.free).concat(oven.freeAt).filter(x => x > t); t = nexts.length ? Math.min(...nexts) : t + 1; continue; }
    ready.sort((a, b) => left(b) - left(a));
    const rc = ready[0]; const s = rc.steps[rc.pos++];
    const waiting = rest.filter(x => x !== rc && x.free > t).map(x => x.r.name);
    plan.push({ ...s, at: t, while: waiting });
    if (s.oven && s.temp) { if (oven.temp && oven.temp !== s.temp && !oven.users.size && !notes.some(n => n.includes(s.temp + '°F'))) notes.push('One oven: the ' + oven.temp + '°F dish comes out first, then set it to ' + s.temp + '°F.'); oven.temp = s.temp; oven.users.add(rc); }
    t += s.work; rc.free = t + s.run;
    if (oven.users.has(rc) && !rc.steps.slice(rc.pos).some(x => x.oven)) { oven.users.delete(rc); oven.freeAt = Math.max(oven.freeAt, rc.free); }
  }
  const end = Math.max(t, ...rest.map(rc => rc.free || 0));
  const serial = recs.reduce((a, rc) => a + rc.steps.reduce((b, s) => b + s.work + (s.run > 120 ? 0 : s.run), 0), 0);
  return { longFirst, plan, end, serial, notes };
}
/* One chopping list for everything */
function knifeList(items) {
  const map = new Map();
  for (const { it, r } of items) { const f = servingsFor(it) / (r.serves || 1);
    for (const g of r.ing || []) { const n = String(g.n || ''); const cut = COOK_KNIFE.exec(n.toLowerCase()); if (!cut || /\bcans?\b|canned|crushed tomatoes|jar\b/.test(n.toLowerCase() + ' ' + (g.u || ''))) continue;
      const base = shopName(n).toLowerCase().replace(/(es|s)$/, ''); const l = ingLine(g, f);
      const e = map.get(base) || { name: shopName(n), cuts: new Set(), lines: [], recipes: new Set() };
      e.cuts.add(cut[1]); e.lines.push(l.q); e.recipes.add(r.name); map.set(base, e); } }
  return [...map.values()];
}
const minsText = m => m >= 60 ? Math.floor(m / 60) + ' hr' + (m % 60 ? ' ' + Math.round(m % 60) + ' min' : '') : Math.max(1, Math.round(m)) + ' min';
const clockAt = (start, m) => new Date(start + m * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function cookState() { const c = ML().cook || {}; return { start: c.start || 0, done: c.done || {} }; }
const cookTick = key => mealCommit(m => { const c = m.cook || { done: {} }; const done = { ...(c.done || {}) }; if (done[key]) delete done[key]; else done[key] = true; m.cook = { ...c, done }; });
function CookView() {
  const items = ML().plan.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r && (x.r.steps || []).length);
  const st = cookState();
  if (!items.length) return html`<div class="card note" style="margin-top:12px">Add recipes to what you’ll cook first.</div>`;
  const S2 = cookSchedule(items); const knives = knifeList(items);
  const tick = key => html`<input type="checkbox" class="cook-box" aria-label="Done" checked=${!!st.done[key]} onChange=${() => cookTick(key)}/>`;
  const when = m => st.start ? clockAt(st.start, m) : (m ? '+' + minsText(m) : 'Start');
  const doneN = Object.keys(st.done).length; const total = S2.plan.length + knives.length + S2.longFirst.length;
  return html`<div class="cook-view" id="cook-view">
    <h2 class="meal-title" style="margin-top:4px">Cook it all in one go</h2>
    <p class="small muted" id="cook-sum">About ${minsText(S2.end)} of cooking, instead of about ${minsText(S2.serial)} one recipe after another. Long things start first; the rest fits in while they cook.</p>
    <div class="row" style="gap:8px;margin-top:10px">${st.start ? html`<span class="small" style="flex:1">Started at ${clockAt(st.start, 0)} · ${doneN} of ${total} done</span><button class="btn" id="cook-reset" onClick=${() => mealCommit(m => { delete m.cook; })}>Start over</button>`
      : html`<button class="btn primary" style="flex:1" id="cook-go" onClick=${() => mealCommit(m => { m.cook = { start: Date.now(), done: {} }; })}>I’m starting now</button>`}</div>
    ${S2.longFirst.length ? html`<div class="section-h"><h2>Set and forget first</h2></div>
      <p class="small muted" style="margin:-4px 0 8px">These cook on their own for hours. Start them before anything else${S2.longFirst.filter(rc => /slow cooker/i.test(rc.steps.map(s => s.text).join(' '))).length > 1 ? '. More than one needs the slow cooker: start one now and the other tomorrow, or use a second cooker or an Instant Pot' : ''}.</p>
      <div class="stack" id="cook-long">${S2.longFirst.map(rc => { const k = rc.steps.findIndex(s => s.passive && (s.run > 120 || s.overnight)); const setup = rc.steps.slice(0, k + 1); const after = rc.steps.slice(k + 1);
        return html`<div key=${rc.r.id} class="card cook-step"><div class="row" style="align-items:flex-start;gap:10px">${tick(rc.r.id + ':long')}<div style="flex:1;min-width:0"><div style="font-weight:700">${rc.r.name}${Math.abs(rc.f - 1) > 0.01 ? html`<span class="small muted"> · ${fracStr(rc.f)} × recipe</span>` : null}</div>
          <ol class="small" style="margin:4px 0 0;padding-left:18px">${setup.map(s => html`<li key=${s.i}><${StepText} parts=${s.parts}/></li>`)}</ol>
          ${after.length ? html`<div class="small muted" style="margin-top:4px">When it’s done (${setup[k].overnight ? 'next day' : 'in about ' + minsText(setup[k].run)}): ${after.map(s => s.text).join(' ')}</div>` : null}</div></div></div>`; })}</div>` : null}
    ${knives.length ? html`<div class="section-h"><h2>Chop once for everything</h2></div>
      <p class="small muted" style="margin:-4px 0 8px">Do all the cutting before the heat goes on, then nothing waits on the knife.</p>
      <div class="card stack" id="cook-knife" style="gap:6px">${knives.map(k => html`<label key=${k.name} class="row cook-knife" style="gap:10px;align-items:flex-start">${tick('knife:' + k.name)}<span style="flex:1;min-width:0"><b>${k.name.replace(/^./, c => c.toUpperCase())}</b>, ${[...k.cuts].join(' and ')}<span class="small muted" style="display:block">${k.lines.filter(Boolean).join(' + ') || 'as the recipes say'} · ${[...k.recipes].join(', ')}</span></span></label>`)}</div>` : null}
    <div class="section-h"><h2>Cook in this order</h2></div>
    ${S2.notes.map(n => html`<p key=${n} class="small" style="margin:-4px 0 8px">${n}</p>`)}
    <div class="stack" id="cook-plan" style="gap:8px">${S2.plan.map((s, n) => html`<div key=${s.key} class=${'card cook-step' + (s.passive ? ' passive' : '') + (st.done[s.key] ? ' done' : '')}>
      <div class="row" style="align-items:flex-start;gap:10px">${tick(s.key)}<div style="flex:1;min-width:0">
        <div class="small muted num">${when(s.at)} · ${s.r.name}</div>
        <div><${StepText} parts=${s.parts}/></div>
        ${s.passive ? html`<div class="small cook-run">${I.timer} Runs about ${minsText(s.run)} on its own · ready ${st.start ? 'at ' + clockAt(st.start, s.at + s.work + s.run) : 'at +' + minsText(s.at + s.work + s.run)}. Go on to the next step.</div>` : null}
        ${!s.passive && s.while.length ? html`<div class="small muted">While ${s.while.join(' and ')} ${s.while.length > 1 ? 'cook' : 'cooks'}</div>` : null}</div></div></div>`)}</div>
    <div class="section-h"><h2>Finish and pack</h2></div>
    <ul class="small" style="padding-left:18px;margin-top:0" id="cook-finish"><li>Let food cool a little, then refrigerate within 2 hours.</li><li>Portion into containers by meal; label anything you freeze with the name and date.</li><li>Keep sauces and crunchy toppings in separate small containers.</li><li>Wash as you go while things simmer, so cleanup is short.</li></ul>
    <p class="small faint">Times are estimates read from the recipes. ${NOT_ADVICE}</p>
  </div>`;
}
/* ---- Amounts inside the steps (Nov 11, Newt: "what does half of the garlic mean?") ----
   Each step names its ingredients with the amount for the batch you're making, so you don't scroll back up:
   "Add half the garlic (1½ cloves)". Splits like half, a third, two-thirds, the rest and the remaining follow
   what earlier steps already used. An ingredient written with its own amount in the step is left alone. */
const SPLIT_WORDS = [[/\b(?:the )?other half(?: of)?(?: the)?\s*$/, 'rest'], [/\bhalf(?: of)?(?: the)?\s*$/, 0.5], [/\btwo[- ]thirds?(?: of)?(?: the)?\s*$/, 2 / 3], [/\b(?:a|one)[- ]third(?: of)?(?: the)?\s*$/, 1 / 3], [/\b(?:a|one)[- ]quarter(?: of)?(?: the)?\s*$/, 0.25],
  [/\bthree[- ]quarters?(?: of)?(?: the)?\s*$/, 0.75], [/\bthe rest(?: of)?(?: the)?\s*$/, 'rest'], [/\bremaining\s*$/, 'rest'], [/\bmost(?: of)?(?: the)?\s*$/, 0.75], [/\ba little(?: of)?(?: the)?\s*$/, 0.25]];
const ING_SKIP = /^(salt|pepper|black pepper|water|ice|oil spray|cooking spray)$/;   /* salt and pepper get their own pass */
function ingKeys(r) {
  const base = (r.ing || []).map(g => String(g.n || '').toLowerCase().split(',')[0].replace(/\([^)]*\)/g, ' ').replace(/\b(boneless|skinless|fresh|large|small|medium|ripe|plain|nonfat|low-fat|unsweetened|dry|dried|canned|frozen|lean|extra-virgin|ground|chopped|diced|minced|sliced)\b/g, ' ').replace(/\s+/g, ' ').trim());
  /* tail words first ("soy sauce", "sauce"), then single words ("chicken" in "chicken thighs"); a word two
     ingredients share is never used */
  const tails = base.map(n => { const w = n.split(' ').filter(Boolean); const out = []; for (let k = w.length; k >= 1; k--) { const s = w.slice(w.length - k).join(' '); if (s.length >= 3) out.push(s); } return out; });
  /* "chicken" in chicken broth or garlic in garlic powder doesn't make "the chicken" ambiguous */
  const words = base.map(n => /\b(broth|stock|bouillon|powder|paste|sauce|salt)$/.test(n) ? [] : n.split(' ').filter(x => x.length >= 4));
  const cT = {}, cA = {}; base.forEach((n, i) => { new Set(tails[i]).forEach(s => { cT[s] = (cT[s] || 0) + 1; }); new Set([...tails[i], ...words[i]]).forEach(s => { cA[s] = (cA[s] || 0) + 1; }); });
  const cands = base.map((n, i) => [...tails[i].filter(s => cT[s] === 1), ...words[i].filter(x => !tails[i].includes(x) && cA[x] === 1)]);
  return cands.map((c, i) => (ING_SKIP.test(base[i]) ? [] : c).map(s => ({ s, re: new RegExp('\\b' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/(s|es)$/, '') + '(?:es|s)?\\b', 'i') })));
}
/* steps → [[text or { amt, of }]] for one recipe at batch factor f */
const SPICE_ING = /^ginger$|caraway|baharat|7 spice|seven spice|clove|dill|fennel seed|mustard seed|powder|cumin|paprika|oregano|cinnamon|turmeric|garam|coriander|chili|cayenne|seasoning|allspice|za.?atar|sumac|thyme|rosemary|sage|nutmeg|cardamom|ginger, ground|ground ginger|black pepper|red pepper flakes|pepper flakes|bay lea|dried|^salt$|kosher salt|sea salt/;
const GROUP_SPICE = /\b(?:the |all the |your )?(spices|seasonings?|spice (?:mix|blend|rub)|dry rub|rub)\b|^season\b/i;
const GROUP_ALL = /\b(?:mix|stir|whisk|blend|combine|put|add|shake|puree|blitz|beat|toss)\b[^.]{0,20}?\b(everything(?: else)?|all (?:of )?the (?:ingredients|rest)|the rest of the ingredients|the remaining ingredients)\b/i;
const SALT_PEP = [[/\bsalt and (?:black )?pepper\b/i, ['salt', 'black pepper']], [/\bsalt\b/i, ['salt']], [/\b(?:black )?pepper\b/i, ['black pepper']]];
const ingShort = g => String(g.n || '').toLowerCase().split(',')[0].replace(/\([^)]*\)/g, '').replace(/\b(ground|dried|plain|fresh|kosher)\b/g, '').replace(/\s+/g, ' ').trim();
function stepsWithAmounts(r, f) {
  const keys = ingKeys(r); const ing = r.ing || []; const used = ing.map(() => 0); const steps = r.steps || [];
  const amtOf = (g, frac, withName) => { const L = ingLine({ ...g, q: g.q * frac }, f); const noun = !g.u ? String(L.n || '').split(',')[0].replace(/\([^)]*\)/g, '').trim().split(' ').pop() : '';
    return withName ? L.q + ' ' + (g.u ? ingShort(g) : String(L.n || '').split(',')[0].replace(/\([^)]*\)/g, '').trim()) : L.q + (noun ? ' ' + noun : ''); };
  /* which ingredients any step names on its own, so a group word ("the spices", "everything") only covers the rest */
  const mentions = (s, re) => { const m = re.exec(s); return !!m && !/\b(until|once|when|while) (the |it(?:s)? )?$/i.test(s.slice(Math.max(0, m.index - 12), m.index)); };
  const named = ing.map((g, i) => steps.some(s => keys[i].some(k => mentions(s, k.re))));
  const shared = (() => { const by = {}; ing.forEach((g, i) => { const w = ingShort(g).split(' ').filter(x => x.length >= 3); new Set([w.slice(-1)[0]].filter(Boolean)).forEach(x => { (by[x] = by[x] || []).push(i); }); });
    return Object.entries(by).filter(([, v]) => v.length > 1); })();
  const isSpice = g => SPICE_ING.test(ingShort(g)) && (!g.u || /tsp|tbsp|pinch/.test(g.u));
  const out = steps.map(step => {
    const hits = [];
    const overlaps = (a, b) => hits.some(h => a < h.end && h.start < b);
    ing.forEach((g, i) => { if (g.q == null || !(g.q > 0)) return;
      for (const k of keys[i]) { const m = k.re.exec(step); if (!m) continue;
        if (overlaps(m.index, m.index + m[0].length)) break;
        const before = step.slice(0, m.index);
        if (/\d[\d\s½¼¾⅓⅔⅛\/.-]*(\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|cloves?|cans?|scoops?))?\s*$/i.test(before.slice(-14))) break;
        if (/\b(until|once|when|while) (the |it(?:s)? )?$/i.test(before.slice(-12))) break;
        let frac = 0, split = false; for (const [re, v] of SPLIT_WORDS) if (re.test(before.slice(-28).toLowerCase())) { frac = v === 'rest' ? Math.max(0, 1 - used[i]) : v; split = true; break; }
        if (!split) { if (used[i] > 0) break; frac = 1; }   /* named again later without a split: no amount */
        if (frac <= 0.01) break;
        const tail = /^\s+(juice|zest|wedges)\b/i.exec(step.slice(m.index + m[0].length)); if (tail) m[0] += tail[0];
        used[i] = Math.min(1, used[i] + frac);
        hits.push({ start: m.index, end: m.index + m[0].length, amt: amtOf(g, frac) });
        break; } });
    /* salt and pepper (their own words, not "bell pepper") */
    for (const [re, names] of SALT_PEP) { const m = re.exec(step); if (!m || overlaps(m.index, m.index + m[0].length) || /bell |chili |red /i.test(step.slice(Math.max(0, m.index - 5), m.index))) continue;
      const list = names.map(n => ing.findIndex((g, i) => ingShort(g) === n && g.q > 0 && !used[i])).filter(i => i >= 0);
      if (!list.length) continue; list.forEach(i => { used[i] = 1; });
      hits.push({ start: m.index, end: m.index + m[0].length, amt: list.map(i => amtOf(ing[i], 1, list.length > 1)).join(' + ') }); break; }
    /* group words: the spices, the rub, everything */
    const gm = GROUP_SPICE.exec(step);
    if (gm && !overlaps(gm.index, gm.index + gm[0].length)) { const sp = /\bsalt\b|\bpepper\b/i.test(step); const list = ing.map((g, i) => i).filter(i => isSpice(ing[i]) && !named[i] && !used[i] && ing[i].q > 0 && !(sp && /^salt$|black pepper/.test(ingShort(ing[i]))));
      if (list.length) { list.forEach(i => { used[i] = 1; }); hits.push({ start: gm.index, end: gm.index + gm[0].length, amt: list.map(i => amtOf(ing[i], 1, true)).join(', ') }); } }
    /* a word two ingredients share ("both tomatoes", "the beans", "the oil"): the ones not used yet */
    for (const [w, idx] of shared) { const m = new RegExp('\\b' + w.replace(/(s|es)$/, '') + '(?:es|s)?\\b', 'i').exec(step); if (!m || overlaps(m.index, m.index + m[0].length)) continue;
      if (/\d[\d\s½¼¾⅓⅔⅛\/.-]*(\s*(cups?|tbsp|tsp|oz|lb|g|ml|cloves?|cans?))?\s*$/i.test(step.slice(Math.max(0, m.index - 14), m.index))) continue;
      let list = idx.filter(i => !used[i] && ing[i].q > 0 && !named[i]); if (!list.length) continue;
      if (new Set(list.map(i => ingShort(ing[i]))).size === 1) list = list.slice(0, 1);   /* same food split for two uses: the first one */
      list.forEach(i => { used[i] = 1; }); hits.push({ start: m.index, end: m.index + m[0].length, amt: list.map(i => amtOf(ing[i], 1, list.length > 1)).join(' + ') }); }
    const nm = /\bnuts\b/i.exec(step);
    if (nm && !overlaps(nm.index, nm.index + nm[0].length)) { const list = ing.map((g, i) => i).filter(i => /almond|walnut|pecan|cashew|pistachio|hazelnut|peanut(?! butter)/.test(ingShort(ing[i])) && !named[i] && !used[i] && ing[i].q > 0);
      if (list.length) { list.forEach(i => { used[i] = 1; }); hits.push({ start: nm.index, end: nm.index + nm[0].length, amt: list.map(i => amtOf(ing[i], 1, true)).join(', ') }); } }
    const vm = /\b(?:the )?(vegetables|veggies|veg)\b/i.exec(step);
    if (vm && !overlaps(vm.index, vm.index + vm[0].length)) { const list = ing.map((g, i) => i).filter(i => (ing[i].a === 'produce') && !named[i] && !used[i] && ing[i].q > 0);
      if (list.length) { list.forEach(i => { used[i] = 1; }); hits.push({ start: vm.index, end: vm.index + vm[0].length, amt: list.map(i => amtOf(ing[i], 1, true)).join(', ') }); } }
    const am0 = GROUP_ALL.exec(step); const am = am0 && { index: am0.index + am0[0].length - am0[1].length, 0: am0[1] };
    if (am && !overlaps(am.index, am.index + am[0].length)) { const list = ing.map((g, i) => i).filter(i => !named[i] && !used[i] && ing[i].q > 0);
      if (list.length) { list.forEach(i => { used[i] = 1; }); hits.push({ start: am.index, end: am.index + am[0].length, amt: list.map(i => amtOf(ing[i], 1, true)).join(', ') }); } }
    hits.sort((a, b) => a.start - b.start);
    const parts = []; let at = 0;
    for (const h of hits) { parts.push(step.slice(at, h.end)); parts.push({ amt: h.amt }); at = h.end; }
    parts.push(step.slice(at)); return parts;
  });
  out.used = used; return out;
}
const StepText = ({ parts }) => parts.map((p, i) => typeof p === 'string' ? p : html`<span key=${i} class="step-amt"> (${p.amt})</span>`);
