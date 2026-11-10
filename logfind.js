/* ============ Food log: one search, recent foods, saved foods by category (Nov 2) ============ */
/* Log food opens on a single search box. Before you type: your recent foods (tap to log the same amount again) and
   your saved foods by category. While you type: matching recents and saved foods, recipes, your foods and built-in
   foods, plus online lookup and quick numbers. meals.saved: { id: { id, cat, e: log entry template } };
   meals.cats: [category names]. */
const DEF_CATS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];
const foodCats = () => (Array.isArray(ML().cats) && ML().cats.length ? ML().cats : DEF_CATS);
const tmplOf = e => { const { id, at, slot, ...t } = e; return t; };
const tmplKey = e => e.k === 'recipe' ? 'r:' + e.r + ':' + e.sv : e.fk ? 'f:' + e.fk + ':' + (e.txt || '') : 'n:' + String(e.name).toLowerCase() + ':' + Math.round(+e.m.kcal || 0);
function recentFoods(n = 15) {
  const all = Object.values(ML().log).flat().filter(e => e && e.m).sort((a, b) => (b.at || 0) - (a.at || 0));
  const out = [], seen = new Set(); for (const e of all) { const k = tmplKey(e); if (seen.has(k)) continue; seen.add(k); out.push(e); if (out.length >= n) break; }
  return out;
}
const entrySub = e => (e.k === 'recipe' ? fracStr(e.sv) + ' serving' + (e.sv > 1 ? 's' : '') + ' · ' : e.txt ? e.txt + ' · ' : '') + fmtNut('kcal', e.m.kcal) + ' kcal · ' + Math.round(e.m.p) + ' g protein';
function logAgain(day, e) {
  const n = addLog(day, tmplOf(e)); closeSheet();
  showToast({ kind: 'info', text: e.name + ' logged', action: 'Undo', ms: 7000, fn: () => dropLog(day, n.id), action2: 'Change amount', fn2: () => openSheet({ type: 'logEntry', day, id: n.id }) });
}
const savedKey = e => tmplKey(e);
const savedFor = e => Object.values(ML().saved || {}).find(s => savedKey(s.e) === savedKey(e)) || null;
function saveFood(e, cat) { const old = savedFor(e); mealCommit(m => { m.saved = m.saved || {}; const id = old ? old.id : uid('sv'); m.saved[id] = { id, cat, e: tmplOf(e) }; }); showToast({ kind: 'info', text: e.name + ' saved to ' + cat }); }
const unsaveFood = id => mealCommit(m => { delete m.saved[id]; });
function addCat(name) { const n = String(name || '').trim().slice(0, 24); if (!n || foodCats().includes(n)) return false; mealCommit(m => { m.cats = foodCats().concat(n); }); return true; }
/* Category chips for saving one food */
function CatPick({ e, onDone }) {
  const [add, setAdd] = useState(''); const cur = savedFor(e);
  return html`<div class="cat-pick" role="group" aria-label=${'Save ' + e.name + ' to'}>${foodCats().map(c => html`<button key=${c} class=${'chip' + (cur && cur.cat === c ? ' on' : '')} onClick=${() => { saveFood(e, c); onDone && onDone(); }}>${c}</button>`)}
    <input class="field cat-new" aria-label="New category" placeholder="New category" value=${add} onInput=${x => setAdd(x.target.value)} onKeyDown=${x => { if (x.key === 'Enter' && addCat(add)) { saveFood(e, add.trim()); onDone && onDone(); } }}/>
    ${cur ? html`<button class="chip" onClick=${() => { unsaveFood(cur.id); onDone && onDone(); }}>Remove from saved</button>` : null}</div>`;
}
function FoodRow({ e, day, k, picking, setPicking }) {
  const sv = savedFor(e);
  return html`<div class="find-row-wrap"><div class="find-row"><button class="find-main" id=${'again-' + k} onClick=${() => logAgain(day, e)}><div class="t">${e.name}</div><div class="s num">${entrySub(e)}</div></button>
      <button class=${'find-star' + (sv ? ' on' : '')} aria-label=${sv ? 'Saved in ' + sv.cat + '. Change' : 'Save ' + e.name + ' to a category'} id=${'star-' + k} onClick=${() => setPicking(picking === k ? null : k)}>${sv ? '★' : '☆'}</button></div>
    ${picking === k ? html`<${CatPick} e=${e} onDone=${() => setPicking(null)}/>` : null}</div>`;
}
function FindView({ day, go }) {
  const [q, setQ] = useState(''); const rec = recentFoods(); const saved = Object.values(ML().saved || {});
  const [view, setView] = useState(rec.length || !saved.length ? 'recent' : 'saved'); const [picking, setPicking] = useState(null);
  const term = q.trim().toLowerCase(); const g = term ? parseIng(q) : null;
  const hit = s => String(s || '').toLowerCase().includes(term);
  const recipes = term ? allRecipes().filter(r => macros(r) && hit(r.name)).slice(0, 6) : [];
  const foods = term ? myFoods().concat(FOODS).filter(f => hit(f.label) || f.re.test(term)).slice(0, 8) : [];
  const matchE = term ? recentFoods(60).filter(e => hit(e.name)).slice(0, 5) : [];
  const parsedFood = g && g.q != null ? foodFor(g) : null;
  const foodTxt = f => f.mine ? '1 serving ' + f.label : f.g && f.g.each ? '1 ' + f.label : '100 g ' + f.label;
  const cats = foodCats().filter(c => saved.some(s => s.cat === c)).concat([...new Set(saved.map(s => s.cat))].filter(c => !foodCats().includes(c)));
  return html`<div class="stack" id="log-find">
    <input class="field" type="search" id="lf-find" autocomplete="off" placeholder="Search foods and recipes, or type “2 eggs”" value=${q} onInput=${x => setQ(x.target.value)} ref=${el => { if (el && !el.dataset.f) { el.dataset.f = 1; setTimeout(() => { try { el.focus({ preventScroll: true }); } catch (_) {} }, 60); } }}/>
    <div class="row" style="gap:8px"><button class="btn" style="flex:1" id="lf-scan-go" onClick=${() => go('scan')}>${I.camera} Scan</button><button class="btn" style="flex:1" id="lf-num-go" onClick=${() => go('num', { name0: q.trim() })}>Enter numbers</button></div>
    ${!term ? html`
      <div class="seg wide" role="tablist" aria-label="Your foods">${[['recent', 'Recent'], ['saved', 'Saved']].map(([k, l]) => html`<button key=${k} role="tab" id=${'lf-' + k + '-tab'} aria-selected=${view === k} class=${view === k ? 'on' : ''} onClick=${() => setView(k)}>${l}</button>`)}</div>
      ${view === 'recent' ? (rec.length ? html`<div class="find-list" id="lf-recent">${rec.map((e, i) => html`<${FoodRow} key=${tmplKey(e)} e=${e} day=${day} k=${'r' + i} picking=${picking} setPicking=${setPicking}/>`)}<p class="small muted">Tap to log the same amount again. ☆ saves it to a category.</p></div>`
          : html`<p class="note">Foods you log show up here, so you can log them again with one tap.</p>`)
        : (saved.length ? html`<div id="lf-saved">${cats.map(c => html`<div key=${c}><div class="aisle-h">${c}</div><div class="find-list">${saved.filter(s => s.cat === c).map(s => html`<div key=${s.id} class="find-row"><button class="find-main" id=${'sv-' + s.id} onClick=${() => logAgain(day, s.e)}><div class="t">${s.e.name}</div><div class="s num">${entrySub(s.e)}</div></button><button class="find-star" aria-label=${'Remove ' + s.e.name + ' from saved'} onClick=${() => unsaveFood(s.id)}>${I.x}</button></div>`)}</div></div>`)}</div>`
          : html`<p class="note">Save foods you eat often from Recent with ☆, sorted into Breakfast, Lunch, Dinner, Snacks, Drinks or your own categories.</p>`)}` : html`
      ${g && (g.q != null || parsedFood) ? html`<button class="opt find-top" id="lf-log-typed" onClick=${() => go('food', { txt: q.trim() })}><div style="flex:1;min-width:0"><div>Log “${q.trim()}”</div><div class="d">${parsedFood ? 'Counts as ' + parsedFood.label : 'Pick what it counts as next'}</div></div>${I.plus}</button>` : null}
      ${matchE.length ? html`<div class="aisle-h">Recent and saved</div><div class="find-list">${matchE.map((e, i) => html`<${FoodRow} key=${tmplKey(e)} e=${e} day=${day} k=${'m' + i} picking=${picking} setPicking=${setPicking}/>`)}</div>` : null}
      ${foods.length ? html`<div class="aisle-h">Foods</div><div class="find-list">${foods.map(f => html`<button key=${f.id} class="opt" onClick=${() => go('food', { txt: foodTxt(f), fk: f.id })}><div style="flex:1;min-width:0"><div>${f.label}</div><div class="d">${f.mine ? 'Your food · ' : ''}${per100(f)}</div></div></button>`)}</div>` : null}
      <div class="row wrap" style="gap:8px;margin-top:4px"><button class="btn ghost" style="flex:1" id="lf-find-online" onClick=${() => go('scan', { only: 'search', q0: (g && g.q != null ? shopName(g.n) : q.trim()) })}>Look up “${q.trim()}” online</button>
        <button class="btn ghost" style="flex:1" id="lf-find-num" onClick=${() => go('num', { name0: q.trim() })}>Enter its numbers</button></div>
      ${recipes.length ? html`<div class="aisle-h">Recipes</div><div class="find-list">${recipes.map(r => html`<button key=${r.id} class="opt" onClick=${() => go('recipe', { r0: r.id })}><div style="flex:1;min-width:0"><div>${r.name}</div><div class="d">${macroLine(macros(r))} a serving</div>${recipeIssues(r).block.length ? html`<${IssueLine} r=${r}/>` : null}</div></button>`)}</div>` : null}`}
  </div>`;
}
