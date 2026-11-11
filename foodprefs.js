/* ============ Food preferences, recipe sources, and recipes from a post (Nov 2) ============ */
/* meals.prefs: { allergies: [allergen ids], diet: 'none' | id, dislikes: 'mushrooms, olives' }. Allergies and the diet
   style block a recipe completely from meal plans and suggestions and flag it everywhere; dislikes keep it out of plans
   and suggestions but it can still be found and logged. Recipes can credit a source (src: { by, url }), shown at the
   bottom of the recipe, and a recipe can be filled in from a pasted post (caption from Instagram, TikTok, a blog). */
/* [id, label, matches, safe phrases removed first (so almond milk isn't dairy and rice noodles aren't wheat)] */
const ALLERGENS = [
  ['dairy', 'Dairy', /\bmilk\b|cheese|cheddar|mozzarella|parmesan|ricotta|\bfeta\b|cottage|paneer|queso|brie\b|gouda|provolone|yogh?urt|\bskyr\b|butter|ghee|cream|\bcurds?\b|casein|kefir|whey|buttermilk|\bparm\b|half[- ]and[- ]half|custard|protein powder/,
    /(almond|oat|soy|coconut|rice|cashew|hemp|pea|plant|non-?dairy|dairy-?free|vegan)[ -](milk|cream|butter|cheese|yogh?urt|creamer)|(peanut|almond|cashew|sunflower|nut|seed|apple|cocoa|shea|pumpkin) butter|cream of tartar|butternut|(plant|vegan|pea|soy) protein( powder)?/g],
  ['egg', 'Eggs', /\beggs?\b|egg white|mayo|aioli|meringue|frittata|omelet/, /(vegan|egg-?free) (mayo|aioli)|eggplant/g],
  ['peanut', 'Peanuts', /peanut|\bsatay\b/],
  ['treenut', 'Tree nuts', /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|pine nut|praline|marzipan|nutella|pesto|\bnuts?\b/, /butternut|nutmeg|doughnut|donut|water chestnut|coconut|nut-?free pesto/g],
  ['soy', 'Soy', /\bsoy|tofu|tempeh|edamame|\bmiso\b|tamari|shoyu|teriyaki/, /soy-?free/g],
  ['gluten', 'Gluten / wheat', /wheat|flour|bread|pasta|noodle|tortilla|\bwraps?\b|pita|bagel|farro|couscous|barley|bulgur|semolina|spelt|\brye\b|orzo|seitan|udon|ramen|\bmalt|panko|crumbs|cracker|\bbuns?\b|soy sauce|teriyaki|cereal|granola|\boats?\b|beer|spaghetti|naan|crouton|hoisin|gochujang/,
    /buckwheat|gluten-?free \w+( \w+)?|(almond|coconut|rice|chickpea|cassava|corn|tapioca|potato|oat|lentil) (flour|pasta|noodles?|tortillas?|wraps?|crackers?)|rice noodles?|corn tortillas?|lettuce wraps?/g],
  ['fish', 'Fish', /salmon|tuna|\bcod\b|tilapia|halibut|trout|mackerel|haddock|pollock|\bbass\b|mahi|snapper|swordfish|\bfish\b|anchov|sardine|worcestershire/],
  ['shellfish', 'Shellfish', /shrimp|prawn|crab|lobster|scallop|clam|mussel|oyster|crawfish|crayfish|squid|calamari|octopus/],
  ['sesame', 'Sesame', /sesame|tahini|hummus|za.?atar|furikake|everything[- ]bagel/]];
const DIETS = [
  ['none', 'No restrictions', null], ['vegetarian', 'Vegetarian', /chicken|turkey|beef|pork|bacon|sausage|\bham\b|steak|lamb|prosciutto|pepperoni|salami|chorizo|jerky|gelatin|salmon|tuna|\bcod\b|tilapia|\bfish\b|shrimp|prawn|crab|liver|broth|stock|anchov|worcestershire/, /(vegetable|veggie|mushroom) (broth|stock)/g],
  ['pescatarian', 'Pescatarian', /chicken|turkey|beef|pork|bacon|sausage|\bham\b|steak|lamb|prosciutto|pepperoni|salami|chorizo|jerky|gelatin|liver|chicken broth|beef broth|bone broth/], ['dairyfree', 'Dairy-free', ALLERGENS[0][2], ALLERGENS[0][3]],
  ['halal', 'Halal (no pork or alcohol)', /pork|bacon|\bham\b|prosciutto|wine|beer|rum|bourbon|gelatin/],
  ['lactose', 'Lactose intolerant', null]];
/* Lactose intolerant (Nov 10, Newt): pick which dairy foods to leave out. Low-lactose ones start allowed. */
const DAIRY_SAFE = ALLERGENS[0][3];
const LACTOSE_FOODS = [
  ['milk', 'Milk', /\bmilk\b|half[- ]and[- ]half|buttermilk|evaporated|condensed milk/, true],
  ['cream', 'Cream and sour cream', /(?<!ice )\bcream\b|creamer|sour cream|whipped/, true],
  ['icecream', 'Ice cream', /ice cream|gelato|frozen yogh?urt/, true],
  ['softcheese', 'Soft cheese (mozzarella, ricotta, cottage, cream cheese, feta)', /ricotta|cottage|cream cheese|mozzarella|\bbrie\b|queso|paneer|\bfeta\b|mascarpone/, true],
  ['yogurt', 'Yogurt', /(?<!greek )yogh?urt/, true],
  ['hardcheese', 'Hard cheese (cheddar, parmesan, Swiss)', /cheddar|parmesan|\bparm\b|gouda|provolone|swiss|pecorino|asiago|manchego|monterey|(?<!cream |cottage |soft )\bcheese\b/, false],
  ['greek', 'Greek yogurt and skyr', /greek yogh?urt|\bskyr\b/, false],
  ['butter', 'Butter and ghee', /\bbutter\b|\bghee\b/, false],
  ['whey', 'Whey protein', /\bwhey\b|protein powder|casein/, false],
  ['kefir', 'Kefir', /\bkefir\b/, false]];
const lactoseDefault = () => LACTOSE_FOODS.filter(x => x[3]).map(x => x[0]);
/* Several diets can be on at once; older saves had one diet string */
const prefsOf = () => { const p = ML().prefs || {};
  const diets = Array.isArray(p.diets) ? p.diets.filter(k => k !== 'none') : p.diet && p.diet !== 'none' ? [p.diet] : [];
  return { allergies: Array.isArray(p.allergies) ? p.allergies : [], diets, diet: diets[0] || 'none', lactose: Array.isArray(p.lactose) ? p.lactose : lactoseDefault(), dislikes: String(p.dislikes || '') }; };
const savePrefs = v => ({ allergies: v.allergies, diets: v.diets, diet: v.diets[0] || 'none', lactose: v.lactose, dislikes: String(v.dislikes || '').trim() });
/* Foods you don't like (Nov 10, Newt asked how "cheese beef" reads): commas, "and", or plain spaces all separate foods.
   A two-word food like "sour cream" stays together when a recipe here uses it. Plurals match singulars. */
const DISLIKE_FILLER = /^(no|not|any|i|dont|don’t|don't|like|eat|the|a|an|much|too|really|please|without)$/;
let DIS_VOCAB = null;
const dislikeVocab = () => DIS_VOCAB || (DIS_VOCAB = typeof allRecipes === 'function' ? allRecipes().flatMap(ingNames).join(' | ') : '');
function parseDislikes(text) {
  const out = [];
  for (const chunk of String(text || '').toLowerCase().split(/[,;\n/&+]|\band\b|\bor\b/)) {
    const words = chunk.replace(/[^a-z\u00c0-\u024f\s'’-]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !DISLIKE_FILLER.test(w)); if (!words.length) continue;
    const phrase = words.join(' ');
    if (words.length === 1 || dislikeVocab().includes(phrase)) out.push(phrase); else out.push(...words);
  }
  return [...new Set(out)];
}
const dislikeRe = t => { const root = t.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/([^s])s$/, '$1'); const e = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('\\b' + (root.endsWith('y') ? e.slice(0, -1) + '(y|ies)' : e + '(s|es)?') + '\\b'); };
const dislikeTerms = () => parseDislikes(prefsOf().dislikes);
const ingNames = r => (r.ing || []).map(g => String(g && g.n || g || '').toLowerCase());
/* What in this recipe goes against your answers: { block: ['Peanuts', ...], dislike: ['mushrooms'] } */
function recipeIssues(r) {
  const P = prefsOf(); const names = ingNames(r).concat(String(r.name || '').toLowerCase());
  const has = (re, safe) => names.some(n => re.test(safe ? n.replace(safe, ' ') : n));
  const block = ALLERGENS.filter(([k, , re, safe]) => P.allergies.includes(k) && has(re, safe)).map(a => a[1]);
  for (const k of P.diets) { const d = DIETS.find(x => x[0] === k); const lbl = d && 'Not ' + d[1].toLowerCase().replace(/ \(.*\)/, ''); if (d && d[2] && has(d[2], d[3]) && !block.includes(lbl)) block.push(lbl); }
  if (P.diets.includes('lactose') && !P.allergies.includes('dairy')) for (const [k, l, re] of LACTOSE_FOODS) if (P.lactose.includes(k) && has(re, DAIRY_SAFE)) block.push(l.replace(/ \(.*\)/, ''));
  const dislike = dislikeTerms().filter(t => { const re = dislikeRe(t); return names.some(n => re.test(n)); });
  return { block, dislike };
}
const avoidRecipe = r => { const x = recipeIssues(r); return x.block.length > 0 || x.dislike.length > 0; };
const prepIssues = pr => { const out = new Set(); for (const [id] of pr.items || []) { const r = getRecipe(id); if (!r) continue; const x = recipeIssues(r); x.block.concat(x.dislike).forEach(t => out.add(t)); } return [...out]; };
function IssueLine({ r }) {
  const x = recipeIssues(r); if (!x.block.length && !x.dislike.length) return null;
  return html`<div class=${'issue-line' + (x.block.length ? ' bad' : '')} role="note">${x.block.length ? 'Contains ' + x.block.join(', ') : ''}${x.block.length && x.dislike.length ? ' · ' : ''}${x.dislike.length ? 'Has ' + x.dislike.join(', ') + ' (you’d rather not)' : ''}</div>`;
}
/* The questionnaire: used on its own and inside the meal plan setup */
function PrefsFields({ v, set }) {
  const tog = k => set({ ...v, allergies: v.allergies.includes(k) ? v.allergies.filter(x => x !== k) : v.allergies.concat(k) });
  return html`<div class="stack" style="gap:12px" id="prefs-fields">
    <div><span class="lbl">Allergies or foods you can’t eat</span><div class="cat-pick">${ALLERGENS.map(([k, l]) => html`<button key=${k} id=${'al-' + k} class=${'chip' + (v.allergies.includes(k) ? ' on' : '')} aria-pressed=${v.allergies.includes(k)} onClick=${() => tog(k)}>${l}</button>`)}</div>
      <p class="small muted">Recipes with these never show up in plans or suggestions, and they’re marked everywhere. Always check labels yourself.</p></div>
    <div><span class="lbl">Diet (pick any)</span><div class="cat-pick">${DIETS.map(([k, l]) => { const on = k === 'none' ? !v.diets.length : v.diets.includes(k);
        return html`<button key=${k} id=${'diet-' + k} class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => set({ ...v, diets: k === 'none' ? [] : on ? v.diets.filter(x => x !== k) : v.diets.concat(k) })}>${l}</button>`; })}</div>
      ${v.diets.includes('lactose') ? html`<div class="card stack" id="lactose-menu" style="gap:4px;margin-top:10px"><div style="font-weight:700">Leave out</div>
        ${LACTOSE_FOODS.map(([k, l]) => html`<label key=${k} class="toggle-row" for=${'lac-' + k}><span>${l}</span><input type="checkbox" role="switch" id=${'lac-' + k} checked=${v.lactose.includes(k)} onChange=${e => set({ ...v, lactose: e.target.checked ? v.lactose.concat(k) : v.lactose.filter(x => x !== k) })}/></label>`)}
        <p class="small muted">Hard cheese, Greek yogurt and butter are lower in lactose, so many people can have them; switch on anything that bothers you. Turned-on foods stay out of plans and suggestions and are marked on recipes.</p></div>` : null}</div>
    <div><label class="lbl" for="pf-dislikes">Foods you don’t like</label><input class="field" id="pf-dislikes" placeholder="e.g. mushrooms, olives, cilantro" value=${v.dislikes} onInput=${e => set({ ...v, dislikes: e.target.value })}/>
      ${parseDislikes(v.dislikes).length ? html`<p class="small" id="pf-dislikes-read" style="margin-top:6px">Leaving out: ${parseDislikes(v.dislikes).join(' · ')}</p>` : null}
      <p class="small muted">Separate foods with commas or spaces. Left out of plans and suggestions; you can still search for them.</p></div></div>`;
}
function PrefsSheet() {
  const [v, setV] = useState(prefsOf());
  const save = () => { mealCommit(m => { m.prefs = savePrefs(v); if (m.menu && m.menu.t) m.menu = buildMenu(m.menu.t, m.menu.seed); }); closeSheet(); showToast({ kind: 'info', text: 'Food preferences saved' + (ML().menu ? '. Your meal plan was updated.' : '') }); };
  return html`<${Sheet} label="Food preferences"><h2>Food preferences</h2><p class="note">So Ironwood never suggests something you can’t or won’t eat.</p>
    <div style="margin-top:12px"><${PrefsFields} v=${v} set=${setV}/></div>
    <div class="stack" style="margin-top:14px"><button class="btn primary wide" id="pf-save" onClick=${save}>Save</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* ---- sources ---- */
function srcLabel(s) { if (!s) return ''; if (s.by) return s.by; try { const h = new URL(s.url).hostname.replace(/^www\./, ''); return h; } catch (e) { return 'Link'; } }
function SourceLine({ r }) {
  const s = r.src; if (!s || !/^https?:\/\//.test(s.url || '')) return null;
  return html`<div class="src-line" id="recipe-src"><span class="small muted">Source${s.what ? ': ' + s.what : ''}</span><a class="small" href=${s.url} target="_blank" rel="noopener noreferrer">${srcLabel(s)} ↗</a>
    ${r.builtin ? html`<span class="small faint">Recipe written for Ironwood from the idea in this post; the creator’s claims aren’t checked.</span>` : null}</div>`;
}
/* ---- recipe from a post ---- */
/* Pull a name, ingredients, steps and the link out of pasted caption text. Lines that start with an amount (or sit
   under an "Ingredients" heading) are ingredients; numbered lines or lines under "Steps / Directions / Method" are steps. */
function parsePost(text) {
  const EMO = /^(?:[\s•\-*–·▪️]|\p{Extended_Pictographic}|️|‍|[\u{1F1E6}-\u{1F1FF}])+/u;
  const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/^(\d)️?⃣\s*/u, '$1. ').replace(EMO, '').replace(/^(\d)️?⃣\s*/u, '$1. ').trim()).filter(Boolean);
  const url = (String(text).match(/https?:\/\/\S+/) || [])[0] || '';
  const ing = [], steps = []; let name = '', mode = '', serves = 0, mins = 0; const mac = {};
  const macros = l => { const g = (re) => { const m = l.match(re); return m ? +m[1] : null; };
    const kcal = g(/(\d{2,4})\s*(?:k?cals?|calories)\b/i), p = g(/(\d{1,3})\s*g?\s*(?:p\b|protein)/i), c = g(/(\d{1,3})\s*g?\s*(?:c\b|carbs?)/i), f = g(/(\d{1,3})\s*g?\s*(?:f\b|fat)/i);
    if (kcal) mac.kcal = kcal; if (p) mac.p = p; if (c) mac.c = c; if (f) mac.f = f; };
  for (const l0 of lines) {
    const l = l0.replace(/https?:\/\/\S+/g, '').trim(); if (!l) continue;
    if (/^#\w/.test(l) || /^(follow|like|save|share|comment|tag|link in bio|full recipe|recipe (below|in bio|on my)|dm me)/i.test(l)) continue;
    const sv = l.match(/^(?:serves|servings|makes|yield)\s*:?\s*(\d+)/i) || l.match(/^(\d+)\s+servings?\b/i); if (sv) { serves = +sv[1]; continue; }
    const tm = l.match(/^(?:total |cook |prep )?time\s*:?\s*(\d+)\s*min/i); if (tm) { mins = +tm[1]; continue; }
    if (/^(macros?|nutrition|per serving|each serving)\b/i.test(l) || ((l.match(/\d+\s*g?\s*(p|c|f|protein|carbs?|fat)\b/gi) || []).length >= 2 && l.length < 120)) { macros(l); continue; }
    if (/^(ingredients?|you(’|')ll need|what you need)\b[:\s]*$/i.test(l)) { mode = 'ing'; continue; }
    if (/^(steps?|directions?|method|instructions?|how to( make)?( it| this| them)?|let'?s make it)\b[:\s]*$/i.test(l)) { mode = 'step'; continue; }
    const numbered = l.match(/^(\d+)[.)]\s+(.+)/);
    const amount = /^(\d+([.,/]\d+)?|[½⅓⅔¼¾⅛]|a |one |two |three |half )/i.test(l) && l.length < 80;
    if (numbered && (mode === 'step' || numbered[2].length > 40)) { steps.push(numbered[2]); continue; }
    if (mode === 'ing' || (amount && mode !== 'step')) { ing.push(numbered && /^(\d|[½⅓⅔¼¾⅛]|a |an |one |two |half )/i.test(numbered[2]) ? numbered[2] : l.replace(/^(\d+)[.)]\s+/, '$1 ')); continue; }
    const clean = l.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\b(save (this|it|for later)|recipe below|must try)\b[!.]*/gi, '')
      .replace(/\((?:only |just )?\d+\s*(?:k?cals?|calories)[^)]*\)/gi, '').replace(/[-–|:,!.\s]+$/, '').replace(/\s{2,}/g, ' ').trim();
    if (!name && !mode && !ing.length && !steps.length && clean && clean.length <= 60) { name = clean; continue; }
    if (mode === 'step' || l.length > 60) { steps.push(l); continue; }
    if (!name && clean && clean.length <= 60) name = clean;
  }
  return { name, ing, steps, url, serves, mins, macros: mac };
}
function PasteBox({ onFill }) {
  const [t, setT] = useState('');
  return html`<div class="card" id="paste-box"><div style="font-weight:700">Fill in from a post</div>
    <p class="small muted" style="margin:2px 0 8px">Copy the caption (and the link) from Instagram, TikTok, YouTube or a blog and paste it here. Check what it fills in.</p>
    <textarea class="field me-ta" id="paste-text" placeholder=${'Paste the caption and link here'} value=${t} onInput=${e => setT(e.target.value)}></textarea>
    <button class="btn wide" style="margin-top:8px" id="paste-fill" disabled=${!t.trim()} onClick=${() => onFill(parsePost(t))}>Fill in the recipe</button></div>`;
}
