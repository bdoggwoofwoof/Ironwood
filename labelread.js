/* ============ Read a nutrition label (Nov 3, Newt's request) ============
   A photo of the Nutrition Facts panel (or text copied from it with iPhone Live Text) fills in a food's numbers.
   Text recognition is Tesseract.js running on the phone (vendor/ocr, loaded only when used, then cached by the app's
   offline copy). The photo never leaves the phone. Reads US labels (per serving) and EU labels (per 100 g, salt →
   sodium). The numbers always land in the food's fields for a check before saving. */
const LBL_DV = { f: 78, c: 275, fib: 28, na: 2300, p: 50 };
const LBL_UNITS = [[/^(cups?|c)$/, 'cup'], [/^(tbsp|tbs|tablespoons?|tbl)$/, 'tbsp'], [/^(tsp|teaspoons?)$/, 'tsp'], [/^(scoops?)$/, 'scoop'],
  [/^(slices?)$/, 'slice'], [/^(cans?)$/, 'can'], [/^(packages?|pkgs?|packets?|pouch(es)?|bottles?|containers?|bags?|boxes?)$/, 'package'],
  [/^(oz|ounces?)$/, 'oz'], [/^(g|grams?)$/, 'g'],
  [/^(pieces?|pcs?|bars?|cookies?|crackers?|chips?|eggs?|links?|patt(y|ies)|sticks?|pretzels?|tortillas?|muffins?|bagels?|wafers?|biscuits?|cakes?|balls?|bites?|nuggets?|strips?|wraps?|buns?|rolls?|pods?|cubes?|pops?|squares?)$/, 'piece']];
const LBL_FRAC = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅛': 0.125 };
/* "8g" → 8; OCR slips: O→0, l/I/|→1, a trailing 9 that was really a g */
function lblNum(raw) {
  let t = String(raw || '').trim().replace(/^less\s*than\s*/i, '<').replace(/,/g, '.');
  const lt = /^</.test(t); t = t.replace(/^<\s*/, '');
  t = t.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1');
  const v = parseFloat(t); if (!isFinite(v)) return null;
  return lt ? Math.min(v, 0.5) : v;
}
/* One nutrient: its number, plus a second reading when "8g" may have been read as "89" */
function lblFind(text, re, opts = {}) {
  const m = text.match(re); if (!m) return null;
  const tok = m[1]; let unit = (m[2] || '').toLowerCase().replace(/9$/, 'g').replace(/q$/, 'g');
  let v = lblNum(tok); if (v == null) return null;
  const after = text.slice(m.index + m[0].length, m.index + m[0].length + 14); const pm = after.match(/^\s*(\d{1,3})\s*%/);
  const alts = [v];
  if (!unit && /9$/.test(tok.replace(/\s/g, '')) && tok.replace(/\D/g, '').length >= 2) { const w = lblNum(tok.replace(/9\s*$/, '')); if (w != null) alts.push(w); }
  if (opts.mg && unit === 'g' && opts.euSodium) v = v * 1000;
  if (pm && opts.dv && alts.length > 1) { const want = +pm[1] / 100 * opts.dv; alts.sort((a, b) => Math.abs(a - want) - Math.abs(b - want)); }
  return { v: alts[0], alts, unit, pct: pm ? +pm[1] : null };
}
function lblServing(text) {
  const line = (text.match(/serving\s*size\s*[:.]?\s*([^\n]*)/i) || [])[1] || '';
  const gm = line.match(/\(?\s*(?:about\s*)?(\d+(?:[.,]\d+)?)\s*(g|grams?|ml)\b\s*\)?/i);
  const g9 = !gm && line.match(/\(\s*(\d{1,4})9\s*\)/);   /* "(55g)" read as "(559)" */
  const gr = gm ? lblNum(gm[1]) : g9 ? +g9[1] : null;
  let q = null, u = null;
  const qm = line.replace(/\s*\(.*$/, '').match(/^\s*(\d+\s*\/\s*\d+|\d+\s+\d\s*\/\s*\d|\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅛])\s*([½⅓⅔¼¾⅛])?\s*([a-zA-Z]+)?/);
  if (qm) {
    const s = qm[1].replace(/\s+/g, ' ').trim();
    q = LBL_FRAC[s] != null ? LBL_FRAC[s] : /\d+ \d\/\d/.test(s) ? +s.split(' ')[0] + numOf(s.split(' ')[1]) : /\//.test(s) ? numOf(s.replace(/\s/g, '')) : lblNum(s);
    if (qm[2]) q += LBL_FRAC[qm[2]] || 0;
    const w = (qm[3] || '').toLowerCase(); const hit = LBL_UNITS.find(([re]) => re.test(w)); u = hit ? hit[1] : w ? 'serving' : null;
  }
  if (u === 'g' && q > 0) return { q, u: 'g', gr: q };
  if (u === 'oz' && q > 0) return gr ? { q: gr, u: 'g', gr } : { q, u: 'oz', gr: null };
  if (q > 0 && u) return { q, u, gr };
  if (gr) return { q: gr, u: 'g', gr };
  if (/per\s*100\s*g/i.test(text)) return { q: 100, u: 'g', gr: 100 };
  return null;
}
/* Label text → the food fields. Returns { fields, found: [labels], missing: [labels], check: '' } */
function parseLabel(raw) {
  const text = String(raw || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n');
  const flat = text.replace(/\n/g, ' ');
  const eu = /\b(per\s*100\s*g|of\s*which|energy|kj\b|salt\b|saturates)/i.test(flat) && !/total\s*carb/i.test(flat);
  const N = '([<]?\\s*(?:less\\s*than\\s*)?[0-9OolI|]+(?:[.,][0-9]+)?)(?:\\s*(mg|m9|mq|g)\\b)?';
  const R = {
    kcal: (() => {
      let m = flat.match(/(\d{2,4})\s*kcal/i); if (m) return { v: +m[1], alts: [+m[1]] };
      m = flat.match(/calories(?!\s*from)\s*(?:per\s*serving)?\s*[:.]?\s*([0-9OolI]{1,4})\b/i); if (m) { const v = lblNum(m[1]); return v != null ? { v, alts: [v] } : null; }
      return null;
    })(),
    f: lblFind(flat, new RegExp('total\\s*fat\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.f }) || lblFind(flat, new RegExp('(?<!(?:from|saturated|trans|poly\\w*|mono\\w*)\\s)\\bfat\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.f }),
    c: lblFind(flat, new RegExp('(?:total\\s*carb\\w*|carbohydrates?)\\.?\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.c }),
    fib: lblFind(flat, new RegExp('(?:dietary\\s*)?fib(?:er|re)\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.fib }),
    sug: lblFind(flat, new RegExp('(?:total\\s*sugars?|of\\s*which\\s*sugars?|(?<!added\\s)(?<!added\\s\\s)\\bsugars?)\\s*[:.]?\\s*' + N, 'i')),
    p: lblFind(flat, new RegExp('protein\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.p }),
    na: (() => {
      const s = lblFind(flat, new RegExp('sodium\\s*[:.]?\\s*' + N, 'i'), { dv: LBL_DV.na });
      if (s) { if (s.unit === 'g' || (eu && s.v < 10 && s.unit !== 'mg')) s.v = Math.round(s.v * 1000); return s; }
      const salt = lblFind(flat, new RegExp('salt\\s*[:.]?\\s*' + N, 'i'));
      return salt ? { v: Math.round(salt.v * 400), alts: [Math.round(salt.v * 400)] } : null;
    })(),
  };
  /* "8g" read as "89": try each reading and keep the set whose calories add up best */
  const amb = ['p', 'c', 'f'].filter(k => R[k] && R[k].alts.length > 1);
  if (R.kcal && amb.length) {
    let best = null;
    for (let mask = 0; mask < 1 << amb.length; mask++) {
      const pick = { p: R.p && R.p.v, c: R.c && R.c.v, f: R.f && R.f.v }; amb.forEach((k, i) => { pick[k] = R[k].alts[(mask >> i) & 1]; });
      const est = 4 * (pick.p || 0) + 4 * (pick.c || 0) + 9 * (pick.f || 0); const off = Math.abs(est - R.kcal.v);
      if (!best || off < best.off) best = { off, pick };
    }
    amb.forEach(k => { R[k].v = best.pick[k]; });
  }
  for (const k of ['fib', 'sug']) if (R[k] && R[k].alts.length > 1 && R.c && R[k].v > R.c.v) R[k].v = Math.min(...R[k].alts);
  if (R.fib && R.c && R.fib.v > R.c.v) R.fib = null;
  if (R.sug && R.c && R.sug.v > R.c.v) R.sug = null;
  const fields = {}; const found = [], missing = [];
  for (const [k, l] of NUT) { if (R[k] && isFinite(R[k].v) && R[k].v >= 0 && R[k].v < (k === 'na' ? 10000 : k === 'kcal' ? 3000 : 500)) { fields[k] = String(Math.round(R[k].v * 10) / 10); found.push(l.toLowerCase()); } else missing.push(l.toLowerCase()); }
  const sv = lblServing(text);
  if (sv) { fields.q = fracStr(sv.q); fields.u = sv.u; if (sv.gr) fields.gr = String(sv.gr); found.unshift('serving size'); } else missing.unshift('serving size');
  let check = '';
  if (fields.kcal && (fields.p || fields.c || fields.f)) {
    const est = 4 * (+fields.p || 0) + 4 * (+fields.c || 0) + 9 * (+fields.f || 0);
    if (Math.abs(est - +fields.kcal) > Math.max(25, +fields.kcal * 0.2)) check = 'The protein, carbs and fat it read add up to about ' + Math.round(est) + ' calories, not ' + fields.kcal + '. Check those numbers against the package.';
  }
  if (eu && !sv) check = (check ? check + ' ' : '') + 'This looks like a per-100 g label, so the serving is set to 100 g.';
  return { fields, found, missing, check };
}

/* ---- Text recognition (Tesseract.js), loaded on first use ---- */
const OCR = { worker: null, loading: null, idle: 0 };
const ocrBase = () => new URL('vendor/ocr/', location.href).href;
function ocrLoad() {
  if (OCR.worker) return Promise.resolve(OCR.worker);
  if (OCR.loading) return OCR.loading;
  OCR.loading = (async () => {
    if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/ocr/tesseract.min.js'; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
    const b = ocrBase();
    const w = await window.Tesseract.createWorker('eng', 1, { workerPath: b + 'worker.min.js', corePath: b.replace(/\/$/, ''), langPath: b.replace(/\/$/, ''), gzip: true, cacheMethod: 'none', workerBlobURL: false });
    await w.setParameters({ preserve_interword_spaces: '1' });
    OCR.worker = w; return w;
  })().catch(e => { OCR.loading = null; throw e; });
  return OCR.loading;
}
function ocrRelease() { clearTimeout(OCR.idle); OCR.idle = setTimeout(() => { if (OCR.worker) { OCR.worker.terminate(); OCR.worker = null; OCR.loading = null; } }, 90000); }
/* A phone photo, shrunk to at most 2000 px on its long side and turned gray, so reading takes seconds, not minutes */
async function ocrPrep(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), up = Math.max(img.naturalWidth, img.naturalHeight) < 900 ? 1.8 : 1;
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k * up); cv.height = Math.round(img.naturalHeight * k * up);
    const g = cv.getContext('2d'); g.filter = 'grayscale(1) contrast(1.25)'; g.drawImage(img, 0, 0, cv.width, cv.height); return cv;
  } finally { URL.revokeObjectURL(url); }
}
async function readLabelImage(file, onStage) {
  onStage && onStage('load'); const w = await ocrLoad();
  onStage && onStage('read'); const cv = await ocrPrep(file);
  try {
    let r = await w.recognize(cv); let out = parseLabel(r.data.text);
    if (out.found.length < 5) {   /* a crowded panel: try reading it as one block of lines */
      await w.setParameters({ tessedit_pageseg_mode: '6' }); const r2 = await w.recognize(cv); await w.setParameters({ tessedit_pageseg_mode: '3' });
      const out2 = parseLabel(r2.data.text); if (out2.found.length > out.found.length) { out = out2; r = r2; }
    }
    return { ...out, text: r.data.text };
  } finally { ocrRelease(); }
}

/* The card at the top of a new or edited food: photo or pasted text → fields below */
function LabelReader({ onFill }) {
  const [stage, setStage] = useState(''); const [res, setRes] = useState(null); const [err, setErr] = useState(''); const [paste, setPaste] = useState(null);
  const fill = out => { setRes(out); if (out.found.length) onFill(out.fields); else setErr('No nutrition numbers found. Try a closer, straight-on photo of just the Nutrition Facts panel in good light, or type them in.'); };
  const pick = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    setErr(''); setRes(null);
    try { fill(await readLabelImage(f, setStage)); }
    catch (x) { setErr(x && x.message === 'load' || !navigator.onLine && !OCR.worker ? 'The label reader couldn’t load. The first read needs a signal to download it (about 7 MB); after that it works offline.' : 'Couldn’t read that photo. Try again, or type the numbers in.'); }
    finally { setStage(''); }
  };
  return html`<div class="card stack" id="lbl-card">
    <div style="font-weight:700">Read the label</div>
    <p class="small muted">Take a photo of the Nutrition Facts panel and Ironwood fills in the numbers below. It reads the photo on this phone; nothing is sent. Check each number before saving.</p>
    ${stage ? html`<p class="small" role="status" id="lbl-busy">${stage === 'load' ? (OCR.worker ? 'Starting…' : 'Getting the label reader ready… The first time downloads it (about 7 MB); after that it works offline.') : 'Reading the label…'}</p>`
      : html`<label class="btn wide" for="lbl-photo" id="lbl-photo-btn">${I.camera} Photo of the label</label><input type="file" accept="image/*" id="lbl-photo" style="display:none" onChange=${pick}/>`}
    ${paste == null ? html`<button class="btn text" style="align-self:flex-start" id="lbl-paste-open" onClick=${() => setPaste('')}>Paste the label’s text instead</button>`
      : html`<div><label class="lbl" for="lbl-text">Label text</label><textarea class="field" id="lbl-text" rows="5" placeholder="On iPhone: open the photo, press and hold the text, Select All, Copy, then paste here." value=${paste} onInput=${e => setPaste(e.target.value)}></textarea>
        <button class="btn wide" style="margin-top:8px" id="lbl-paste-go" disabled=${!paste.trim()} onClick=${() => { setErr(''); fill(parseLabel(paste)); }}>Fill in from this text</button></div>`}
    ${err ? html`<p class="small down-c" role="alert" id="lbl-err">${err}</p>` : null}
    ${res && res.found.length ? html`<div id="lbl-res"><p class="small">Filled ${res.found.join(', ')}.${res.missing.length ? ' Not found: ' + res.missing.join(', ') + '; type ' + (res.missing.length > 1 ? 'them' : 'it') + ' in if the label lists ' + (res.missing.length > 1 ? 'them' : 'it') + '.' : ''}</p>
      ${res.check ? html`<p class="small down-c" id="lbl-check">${res.check}</p>` : null}</div>` : null}
  </div>`;
}
