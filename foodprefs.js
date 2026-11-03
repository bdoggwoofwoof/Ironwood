/* ============ Food preferences, recipe sources, and recipes from a post (Nov 2) ============ */
/* meals.prefs: { allergies: [allergen ids], diet: 'none' | id, dislikes: 'mushrooms, olives' }. Allergies and the diet
   style block a recipe completely from meal plans and suggestions and flag it everywhere; dislikes keep it out of plans
   and suggestions but it can still be found and logged. Recipes can credit a source (src: { by, url }), shown at the
   bottom of the recipe, and a recipe can be filled in from a pasted post (caption from Instagram, TikTok, a blog). */
/* [id, label, matches, safe phrases removed first (so almond milk isn't dairy and rice noodles aren't wheat)] */
const ALLERGENS = [
  ['dairy', 'Dairy', /\bmilk\b|cheese|cheddar|mozzarella|parmesan|ricotta|\bfeta\b|cottage|paneer|queso|brie\b|gouda|provolone|yogh?urt|\bskyr\b|butter|ghee|cream|\bcurds?\b|casein|kefir|whey|half[- ]and[- ]half|custard|protein powder/,
    /(almond|oat|soy|coconut|rice|cashew|hemp|pea|plant|non-?dairy|dairy-?free|vegan)[ -](milk|cream|butter|cheese|yogh?urt|creamer)|(peanut|almond|cashew|sunflower|nut|seed|apple|cocoa|shea|pumpkin) butter|cream of tartar|butternut|(plant|vegan|pea|soy) protein( powder)?/g],
  ['egg', 'Eggs', /\beggs?\b|egg white|mayo|aioli|meringue|frittata|omelet/, /(vegan|egg-?free) (mayo|aioli)|eggplant/g],
  ['peanut', 'Peanuts', /peanut|\bsatay\b/],
  ['treenut', 'Tree nuts', /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|pine nut|praline|marzipan|nutella|pesto|\bnuts?\b/, /butternut|nutmeg|doughnut|donut|water chestnut|coconut|nut-?free pesto/g],
  ['soy', 'Soy', /\bsoy|tofu|tempeh|edamame|\bmiso\b|tamari|shoyu|teriyaki/, /soy-?free/g],
  ['gluten', 'Gluten / wheat', /wheat|flour|bread|pasta|noodle|tortilla|\bwraps?\b|pita|bagel|farro|couscous|barley|bulgur|semolina|spelt|\brye\b|orzo|seitan|udon|ramen|\bmalt|panko|crumbs|cracker|\bbuns?\b|soy sauce|teriyaki|cereal|granola|\boats?\b|beer/,
    /buckwheat|gluten-?free \w+( \w+)?|(almond|coconut|rice|chickpea|cassava|corn|tapioca|potato|oat|lentil) (flour|pasta|noodles?|tortillas?|wraps?|crackers?)|rice noodles?|corn tortillas?|lettuce wraps?/g],
  ['fish', 'Fish', /salmon|tuna|\bcod\b|tilapia|halibut|trout|mackerel|haddock|pollock|\bbass\b|mahi|snapper|swordfish|\bfish\b|anchov|sardine|worcestershire/],
  ['shellfish', 'Shellfish', /shrimp|prawn|crab|lobster|scallop|clam|mussel|oyster|crawfish|crayfish|squid|calamari|octopus/],
  ['sesame', 'Sesame', /sesame|tahini|hummus|za.?atar|furikake/]];
const DIETS = [
  ['none', 'No restrictions', null], ['vegetarian', 'Vegetarian', /chicken|turkey|beef|pork|bacon|sausage|\bham\b|steak|lamb|prosciutto|pepperoni|salami|chorizo|jerky|gelatin|salmon|tuna|\bcod\b|tilapia|\bfish\b|shrimp|prawn|crab|liver|broth|stock|anchov|worcestershire/, /(vegetable|veggie|mushroom) (broth|stock)/g],
  ['pescatarian', 'Pescatarian', /chicken|turkey|beef|pork|bacon|sausage|\bham\b|steak|lamb|prosciutto|pepperoni|salami|chorizo|jerky|gelatin|liver|chicken broth|beef broth|bone broth/], ['dairyfree', 'Dairy-free', ALLERGENS[0][2], ALLERGENS[0][3]],
  ['halal', 'Halal (no pork or alcohol)', /pork|bacon|\bham\b|prosciutto|wine|beer|rum|bourbon|gelatin/]];
const prefsOf = () => { const p = ML().prefs || {}; return { allergies: Array.isArray(p.allergies) ? p.allergies : [], diet: p.diet || 'none', dislikes: String(p.dislikes || '') }; };
const dislikeTerms = () => prefsOf().dislikes.split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
const ingNames = r => (r.ing || []).map(g => String(g && g.n || g || '').toLowerCase());
/* What in this recipe goes against your answers: { block: ['Peanuts', ...], dislike: ['mushrooms'] } */
function recipeIssues(r) {
  const P = prefsOf(); const names = ingNames(r).concat(String(r.name || '').toLowerCase());
  const has = (re, safe) => names.some(n => re.test(safe ? n.replace(safe, ' ') : n));
  const block = ALLERGENS.filter(([k, , re, safe]) => P.allergies.includes(k) && has(re, safe)).map(a => a[1]);
  const d = DIETS.find(x => x[0] === P.diet); if (d && d[2] && has(d[2], d[3]) && !block.includes(d[1])) block.push('Not ' + d[1].toLowerCase().replace(/ \(.*\)/, ''));
  const dislike = dislikeTerms().filter(t => names.some(n => n.includes(t)) || String(r.name).toLowerCase().includes(t));
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
    <div><span class="lbl">Diet</span><div class="cat-pick">${DIETS.map(([k, l]) => html`<button key=${k} id=${'diet-' + k} class=${'chip' + (v.diet === k ? ' on' : '')} aria-pressed=${v.diet === k} onClick=${() => set({ ...v, diet: k })}>${l}</button>`)}</div></div>
    <div><label class="lbl" for="pf-dislikes">Foods you don’t like</label><input class="field" id="pf-dislikes" placeholder="e.g. mushrooms, olives, cilantro" value=${v.dislikes} onInput=${e => set({ ...v, dislikes: e.target.value })}/>
      <p class="small muted">Left out of plans and suggestions. You can still search for them.</p></div></div>`;
}
function PrefsSheet() {
  const [v, setV] = useState(prefsOf());
  const save = () => { mealCommit(m => { m.prefs = { allergies: v.allergies, diet: v.diet, dislikes: v.dislikes.trim() }; if (m.menu && m.menu.t) m.menu = buildMenu(m.menu.t, m.menu.seed); }); closeSheet(); showToast({ kind: 'info', text: 'Food preferences saved' + (ML().menu ? '. Your meal plan was updated.' : '') }); };
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
  const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/^[\s•\-*–·✔✅👉🔸🔹▪️]+/u, '').trim()).filter(Boolean);
  const url = (String(text).match(/https?:\/\/\S+/) || [])[0] || '';
  const ing = [], steps = []; let name = '', mode = '';
  for (const l0 of lines) {
    const l = l0.replace(/https?:\/\/\S+/g, '').trim(); if (!l) continue;
    if (/^#\w/.test(l) || /^(follow|like|save|share|comment|link in bio)/i.test(l)) continue;
    if (/^(ingredients?|you(’|')ll need|what you need)\b[:\s]*$/i.test(l)) { mode = 'ing'; continue; }
    if (/^(steps?|directions?|method|instructions?|how to( make)?)\b[:\s]*$/i.test(l)) { mode = 'step'; continue; }
    const numbered = l.match(/^(\d+)[.)]\s+(.+)/);
    const amount = /^(\d+([.,/]\d+)?|[½⅓⅔¼¾⅛]|a |one |two |three |half )/i.test(l) && l.length < 80;
    if (numbered && (mode === 'step' || numbered[2].length > 40)) { steps.push(numbered[2]); continue; }
    if (mode === 'ing' || (amount && mode !== 'step')) { ing.push(l.replace(/^(\d+)[.)]\s+/, '$1 ')); continue; }
    if (mode === 'step' || l.length > 60) { steps.push(l); continue; }
    if (!name && l.length <= 60) name = l.replace(/[!:.\s]+$/, '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
  }
  return { name, ing, steps, url };
}
function PasteBox({ onFill }) {
  const [t, setT] = useState('');
  return html`<div class="card" id="paste-box"><div style="font-weight:700">Fill in from a post</div>
    <p class="small muted" style="margin:2px 0 8px">Copy the caption (and the link) from Instagram, TikTok, YouTube or a blog and paste it here. Check what it fills in.</p>
    <textarea class="field me-ta" id="paste-text" placeholder=${'Paste the caption and link here'} value=${t} onInput=${e => setT(e.target.value)}></textarea>
    <button class="btn wide" style="margin-top:8px" id="paste-fill" disabled=${!t.trim()} onClick=${() => onFill(parsePost(t))}>Fill in the recipe</button></div>`;
}
