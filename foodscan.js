/* ============ Barcode scan and online food lookup (Oct 27) ============ */
/* Log food → Scan. Scanning a barcode first checks your own foods, so anything scanned before works offline. Online
   lookups are opt-in (ML().lookup): only the barcode number, or the words you search, go to Open Food Facts, a free
   public food database. A product you log is saved on this phone as one of your foods (with its barcode), so you can
   fix its numbers and the next scan finds it without the internet. */
const OFF_API = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'code,product_name,brands,serving_size,serving_quantity,nutriments';
const BC_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
/* UPC-A (12 digits) is EAN-13 with a leading 0 */
const bcKey = s => { const d = String(s || '').replace(/\D/g, ''); return d.length === 12 ? '0' + d : d; };
const bcValid = s => { const d = String(s || '').replace(/\D/g, ''); return d.length >= 8 && d.length <= 14; };
const myFoodByBarcode = code => { const k = bcKey(code); return Object.values(ML().foods).find(f => f && f.bc && bcKey(f.bc) === k) || null; };
const lookupOn = () => ML().lookup === true;
const setLookup = on => mealCommit(m => { m.lookup = !!on; });

/* fetch JSON with a time limit. Throws 'offline', 'busy' (rate limit or server overloaded), 'slow' (timed out) or
   'error'; e.status carries the HTTP status. A busy answer is retried once after a short wait. */
const OFF_SEARCH = 'https://search.openfoodfacts.org';
async function offGet(path, ms = 9000, base = OFF_API, retry = true) {
  if (navigator.onLine === false) throw Object.assign(new Error('offline'), { status: 0 });
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  let timedOut = false; const t = setTimeout(() => { timedOut = true; if (ctl) ctl.abort(); }, ms);
  let r;
  try { r = await fetch(base + path, { signal: ctl ? ctl.signal : undefined }); }
  catch (e) { clearTimeout(t); throw Object.assign(new Error(timedOut ? 'slow' : navigator.onLine === false ? 'offline' : 'error'), { status: 0 }); }
  clearTimeout(t);
  if (r.status === 404) return null;
  if (r.status === 429 || r.status === 502 || r.status === 503 || r.status === 504) {
    if (retry) { await new Promise(res => setTimeout(res, 1500)); return offGet(path, ms, base, false); }
    throw Object.assign(new Error('busy'), { status: r.status });
  }
  if (!r.ok) throw Object.assign(new Error('error'), { status: r.status });
  try { return await r.json(); } catch (e) { throw Object.assign(new Error('error'), { status: r.status }); }
}
const offText = v => Array.isArray(v) ? v.filter(Boolean).join(', ') : v && typeof v === 'object' ? (v.en || v.main || Object.values(v).find(x => typeof x === 'string') || '') : String(v || '');
/* An Open Food Facts product → { code, name, brand, per (per 100 g), sq (grams a serving), svTxt, ok: has calories } */
function offProduct(p) {
  if (!p) return null; const n = p.nutriments || {};
  const v = k => { const x = n[k + '_100g']; return x === '' || x == null || !isFinite(+x) ? null : +x; };
  let kcal = v('energy-kcal'); if (kcal == null && v('energy') != null) kcal = v('energy') / 4.184;
  const name = offText(p.product_name || p.product_name_en).trim(); const brand = offText(p.brands).split(',')[0].trim();
  const per = { kcal, p: v('proteins'), c: v('carbohydrates'), f: v('fat'), fib: v('fiber'), sug: v('sugars'), na: v('sodium') != null ? v('sodium') * 1000 : v('salt') != null ? v('salt') * 400 : null };
  const sq = +p.serving_quantity > 0 && +p.serving_quantity < 2000 ? +p.serving_quantity : null;
  return { code: String(p.code || ''), name: name || brand || 'Scanned food', brand: name ? brand : '', per, sq, svTxt: offText(p.serving_size).trim(), ok: kcal != null };
}
async function lookupBarcode(code) {
  const c = String(code).replace(/\D/g, ''); const tries = c.length === 12 ? [c, '0' + c] : c.length === 13 && c[0] === '0' ? [c, c.slice(1)] : [c];
  for (const t of tries) { const j = await offGet('/api/v2/product/' + t + '.json?fields=' + OFF_FIELDS); if (j && j.status !== 0 && j.product) return offProduct({ code: c, ...j.product, code: c }); }
  return null;
}
/* Name search: Search-a-licious (Open Food Facts' current search) first, the older search as a fallback. Results
   without nutrition still list; tapping one fetches its numbers by barcode. */
async function searchFoodsOnline(q) {
  const keep = list => { const seen = new Set(); return list.map(offProduct).filter(p => p && p.code && p.name && !seen.has(p.code) && seen.add(p.code)); };
  let first = null;
  try {
    const j = await offGet('/search?q=' + encodeURIComponent(q) + '&page_size=20&langs=en&fields=' + OFF_FIELDS, 9000, OFF_SEARCH);
    if (j && Array.isArray(j.hits)) return keep(j.hits);
  } catch (e) { if (e.message === 'offline') throw e; first = e; }
  try {
    const j = await offGet('/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=20&fields=' + OFF_FIELDS, 15000);
    return keep((j && j.products) || []);
  } catch (e) { throw first && first.message === 'busy' ? first : e; }
}
/* Save a product as one of your foods (label numbers per serving), or update the one with the same barcode */
function saveScanned(p) {
  const old = p.code ? myFoodByBarcode(p.code) : null; const fid = old ? old.id : uid('my-');
  const gr = p.sq || 100; const r1 = x => Math.round(x * 10) / 10;
  const lab = Object.fromEntries(NUT.filter(([k]) => p.per[k] != null).map(([k]) => [k, k === 'na' ? Math.round(p.per[k] * gr / 100) : r1(p.per[k] * gr / 100)]));
  const name = (p.brand ? p.brand + ' ' : '') + p.name;
  mealCommit(m => { m.foods[fid] = { ...(old || {}), id: fid, name: old ? old.name : name, sv: old ? old.sv : p.sq ? { q: 1, u: 'serving', gr } : { q: 100, u: 'g', gr: 100 }, ...(p.svTxt && !old ? { svTxt: p.svTxt } : {}), lab: old ? old.lab : lab, bc: p.code || (old && old.bc), src: old ? old.src : 'off', updatedAt: Date.now() }; });
  return fid;
}
/* A saved food as a product card */
function productOfFood(f) {
  const gr = +f.sv.gr; const per = Object.fromEntries(NUT.map(([k]) => [k, f.lab && f.lab[k] != null ? f.lab[k] / gr * 100 : null]));
  const wt = f.sv.u === 'g' || f.sv.u === 'oz';
  return { code: f.bc || '', name: f.name, brand: '', per, sq: wt ? null : gr / (+f.sv.q || 1), svTxt: f.svTxt || (wt ? '' : fracStr(+f.sv.q || 1) + ' ' + f.sv.u + ' (' + Math.round(gr) + ' g)'), ok: true, fid: f.id, own: true };
}

/* The barcode reader: the phone's own when it has one (Chrome, Android), else ZXing in WebAssembly (iPhone), loaded
   from this site the first time you scan and kept for offline use. */
let _bdP = null;
function barcodeReader() {
  if (_bdP) return _bdP;
  _bdP = (async () => {
    if ('BarcodeDetector' in window) {
      try { const have = await window.BarcodeDetector.getSupportedFormats(); const f = BC_FORMATS.filter(x => have.includes(x)); if (f.length) return new window.BarcodeDetector({ formats: f }); } catch (e) {}
    }
    if (!window.BarcodeDetectionAPI) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/barcode-ponyfill.js'; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
    const A = window.BarcodeDetectionAPI; if (!A || !A.BarcodeDetector) throw new Error('load');
    A.prepareZXingModule({ overrides: { locateFile: (path, prefix) => path.endsWith('.wasm') ? 'vendor/' + path : prefix + path } });
    return new A.BarcodeDetector({ formats: BC_FORMATS });
  })();
  _bdP.catch(() => { _bdP = null; });
  return _bdP;
}
function BarcodeCam({ onCode, onClose }) {
  const vid = useRef(null); const [msg, setMsg] = useState('Starting the camera…');
  useEffect(() => {
    let stream = null, stop = false, timer = 0;
    (async () => {
      const md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) { setMsg('This phone can’t open the camera here. Type the number under the barcode instead.'); return; }
      try { stream = await md.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
      catch (e) { setMsg(e && e.name === 'NotAllowedError' ? 'Camera access is off for Ironwood. Allow it in Settings, or type the number under the barcode.' : 'The camera didn’t start. Type the number under the barcode instead.'); return; }
      if (stop) { stream.getTracks().forEach(t => t.stop()); return; }
      const v = vid.current; v.srcObject = stream; try { await v.play(); } catch (e) {}
      let det; try { det = await barcodeReader(); } catch (e) { setMsg('The barcode reader didn’t load. Type the number under the barcode instead.'); return; }
      setMsg('Point at the barcode and hold steady.');
      const tick = async () => {
        if (stop) return;
        try { if (v.readyState >= 2) { const hits = await det.detect(v); const h = hits && hits.find(x => bcValid(x.rawValue)); if (h && !stop) { stop = true; try { navigator.vibrate && navigator.vibrate(30); } catch (e) {} onCode(h.rawValue.replace(/\D/g, '')); return; } } } catch (e) {}
        timer = setTimeout(tick, 220);
      };
      tick();
    })();
    return () => { stop = true; clearTimeout(timer); if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);
  return html`<div class="bc-cam" id="bc-cam"><video ref=${vid} playsinline muted autoplay aria-label="Camera"></video><div class="bc-aim" aria-hidden="true"></div>
    <p class="small muted" role="status" style="margin-top:8px">${msg}</p><button class="btn wide" style="margin-top:8px" onClick=${onClose}>Close camera</button></div>`;
}

function LookupNote() {
  return html`<p class="small faint" style="margin-top:10px">Online lookups send only the barcode number or the words you search to Open Food Facts, a free public food database. Nothing else leaves your phone. Numbers come from the product’s label as entered there, so check them against the package.</p>`;
}
/* Log food → Scan */
/* only: 'search' shows just the online name search (Log food → Food); q0 starts it with these words; g0 = grams typed */
function LogScan({ day, fid, only, q0, g0 }) {
  const [cam, setCam] = useState(false); const [code, setCode] = useState(''); const [q, setQ] = useState(q0 || '');
  const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [prod, setProd] = useState(() => fid && ML().foods[fid] ? productOfFood(ML().foods[fid]) : null); const [res, setRes] = useState(null); const [miss, setMiss] = useState('');
  const fail = e => { const m = e && e.message; setErr(m === 'offline' ? 'You’re offline. Try again with a signal, or add the food from its label.'
    : m === 'busy' ? 'The food database is busy right now (it allows about 10 searches a minute). Wait a minute and try again, or add the food from its label.'
    : m === 'slow' ? 'The food database took too long to answer. Try again, or add the food from its label.'
    : 'The food database didn’t answer' + (e && e.status ? ' (error ' + e.status + ')' : '') + '. Try again in a minute, or add the food from its label.'); };
  const find = async raw => {
    const c = String(raw || '').replace(/\D/g, ''); setCam(false); setErr(''); setMiss(''); setRes(null);
    if (!bcValid(c)) { setErr('A barcode number is 8 to 14 digits.'); return; }
    setCode(c);
    const mine = myFoodByBarcode(c); if (mine) { setProd(productOfFood(mine)); return; }
    if (!lookupOn()) { setMiss(c); return; }
    setBusy('code');
    try { const p = await lookupBarcode(c); if (p && p.ok) setProd(p); else setMiss(c); }
    catch (e) { fail(e); } finally { setBusy(''); }
  };
  const search = async t0 => {
    const t = (typeof t0 === 'string' ? t0 : q).trim(); if (!t) return; setErr(''); setMiss(''); setProd(null); setBusy('search');
    try { setRes(await searchFoodsOnline(t)); } catch (e) { fail(e); } finally { setBusy(''); }
  };
  const openResult = async p => {
    if (p.ok) { setProd(p); return; } setErr(''); setBusy('p' + p.code);
    try { const x = await lookupBarcode(p.code); if (x && x.ok) setProd({ ...x, name: x.name || p.name, brand: x.brand || p.brand }); else setErr('No nutrition is listed for ' + p.name + '. Pick another result, or add it from its label.'); }
    catch (e) { fail(e); } finally { setBusy(''); }
  };
  const allow = () => { setLookup(true); if (miss) find(miss); };
  useEffect(() => { if (only === 'search' && q0 && lookupOn()) search(q0); }, []);
  const allowSearch = () => { setLookup(true); if (only === 'search' && q.trim()) setTimeout(() => search(q), 0); };
  const addLabel = c => openSheet({ type: 'foodEdit', name: '', bc: c, then: id => openSheet({ type: 'mealLog', day, tab: 'scan', fid: id }) });
  if (prod) return html`<${ScanProduct} day=${day} p=${prod} g0=${g0} onBack=${() => setProd(null)}/>`;
  return html`<div class="stack">
    ${ML().lookup === undefined ? html`<div class="card" id="lookup-ask"><div style="font-weight:700">Look foods up online?</div>
      <p class="small muted" style="margin-top:4px">${only === 'search' ? 'Ironwood can search Open Food Facts, a free public food database, for store-bought foods. Only the words you search are sent.' : html`Scanning matches foods you’ve saved without the internet. To find new products, Ironwood can ask Open Food Facts, a free public food database. Only the barcode number or the words you search are sent.`}</p>
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn primary" style="flex:1" id="lookup-allow" onClick=${allowSearch}>Allow lookups</button><button class="btn" style="flex:1" id="lookup-no" onClick=${() => setLookup(false)}>Not now</button></div></div>` : null}
    ${only === 'search' ? null : cam ? html`<${BarcodeCam} onCode=${find} onClose=${() => setCam(false)}/>` : html`<button class="btn primary wide" id="scan-start" onClick=${() => { setErr(''); setCam(true); }}>${I.camera} Scan a barcode</button>`}
    ${only === 'search' ? null : html`<div><label class="lbl" for="bc-num">Or type the number under the barcode</label><div class="row" style="gap:8px">
      <input class="field" id="bc-num" inputmode="numeric" autocomplete="off" placeholder="e.g. 041196910551" value=${code} onInput=${e => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown=${e => { if (e.key === 'Enter') find(code); }}/>
      <button class="btn" style="white-space:nowrap" id="bc-go" disabled=${!code || busy} onClick=${() => find(code)}>${busy === 'code' ? 'Looking…' : 'Look up'}</button></div></div>`}
    ${lookupOn() ? html`<div><label class="lbl" for="off-q">${only === 'search' ? 'Search online' : 'Search by name online'}</label><div class="row" style="gap:8px">
      <input class="field" id="off-q" type="search" placeholder="e.g. Fairlife chocolate shake" value=${q} onInput=${e => setQ(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') search(); }}/>
      <button class="btn" style="white-space:nowrap" id="off-go" disabled=${!q.trim() || busy} onClick=${search}>${busy === 'search' ? 'Searching…' : 'Search'}</button></div></div>` : null}
    ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
    ${miss ? html`<div class="card" id="bc-miss"><div style="font-weight:700">${lookupOn() ? 'Not in the food database' : 'Not one of your foods yet'}</div>
      <p class="small muted" style="margin-top:4px">${lookupOn() ? 'Barcode ' + miss + ' has no nutrition there. Add it from its label once and every later scan finds it.' : 'Barcode ' + miss + '. Look it up online, or add it from its label once and every later scan finds it.'}</p>
      <div class="row wrap" style="margin-top:10px;gap:8px">${!lookupOn() ? html`<button class="btn primary" style="flex:1" id="bc-allow" onClick=${allow}>Look it up online</button>` : null}<button class="btn" style="flex:1" id="bc-label" onClick=${() => addLabel(miss)}>Add from the label</button></div></div>` : null}
    ${res ? html`<div class="food-list" id="off-results">${res.length ? res.map(p => html`<button key=${p.code} class="opt" onClick=${() => openResult(p)}><div style="flex:1;min-width:0"><div>${p.name}</div><div class="d">${p.brand ? p.brand + ' · ' : ''}${p.ok ? Math.round(p.per.kcal) + ' kcal per 100 g' : busy === 'p' + p.code ? 'Getting its numbers…' : 'Tap for its numbers'}</div></div></button>`)
      : html`<p class="note" style="margin-top:6px">Nothing found for “${q.trim()}”. Try fewer words${only === 'search' ? ', or add it from its label' : ', or scan the barcode'}.</p>`}</div>` : null}
    ${ML().lookup !== undefined ? html`<button class="btn text" id="lookup-toggle" style="align-self:flex-start" onClick=${() => setLookup(!lookupOn())}>${lookupOn() ? 'Turn off online lookups' : 'Turn on online lookups'}</button>` : null}
    <${LookupNote}/></div>`;
}
/* One product: choose the amount, see the numbers, log it */
function ScanProduct({ day, p, onBack, g0 }) {
  const [unit, setUnit] = useState(p.sq && !(g0 > 0) ? 'sv' : 'g'); const [sv, setSv] = useState(1); const [g, setG] = useState(String(g0 > 0 ? Math.round(g0) : p.sq || 100));
  const grams = unit === 'sv' ? sv * p.sq : (+g || 0);
  const m = roundNut(Object.fromEntries(NUT.map(([k]) => [k, (p.per[k] || 0) * grams / 100])));
  const save = () => {
    const fid = p.own ? p.fid : saveScanned(p);
    addLog(day, { k: 'food', name: p.name, txt: unit === 'sv' ? fracStr(sv) + ' serving' + (sv === 1 ? '' : 's') : Math.round(grams) + ' g', fk: fid, m });
    closeSheet(); showToast({ kind: 'info', text: p.name + ' logged' });
  };
  const missing = NUT.filter(([k]) => p.per[k] == null).map(([, l]) => l.toLowerCase());
  return html`<div class="stack" id="scan-product">
    <div class="row"><div style="flex:1;min-width:0"><div style="font-weight:700">${p.name}</div><div class="small muted">${[p.brand, p.svTxt ? 'Serving ' + p.svTxt : p.sq ? 'Serving ' + p.sq + ' g' : '', p.own ? 'Saved on this phone' : 'From Open Food Facts'].filter(Boolean).join(' · ')}</div></div><button class="btn text" onClick=${onBack}>Back</button></div>
    ${p.sq ? html`<div class="seg wide" role="group" aria-label="Amount in">${[['sv', 'Servings'], ['g', 'Grams']].map(([k, l]) => html`<button key=${k} class=${unit === k ? 'on' : ''} aria-pressed=${unit === k} onClick=${() => setUnit(k)}>${l}</button>`)}</div>` : null}
    ${unit === 'sv' ? html`<div class="row"><span style="flex:1;font-weight:600">Servings</span><${MStep} label="servings eaten" value=${sv} min=${0.5} max=${10} step=${0.5} onChange=${setSv}/></div>`
      : html`<div class="row" style="gap:8px"><label class="lbl" for="sp-g" style="flex:1;margin:0">Grams eaten</label><input class="field" id="sp-g" style="width:100px;text-align:center" inputmode="decimal" value=${g} onInput=${e => setG(e.target.value.replace(/[^\d.]/g, ''))}/></div>`}
    <${MacroTiles} m=${m}/><${ExtraLine} m=${m}/>
    ${missing.length ? html`<p class="small muted">No ${missing.join(', ')} listed for this product, so ${missing.length > 1 ? 'they count' : 'it counts'} as 0.</p>` : null}
    <button class="btn primary wide" id="scan-log" disabled=${!(grams > 0)} onClick=${save}>Log it</button>
    ${!p.own ? html`<p class="small faint">Logging saves it to your foods with its barcode, so the next scan works offline. You can fix its numbers in Meals → Recipes → My foods.</p>` : html`<button class="btn text" style="align-self:flex-start" onClick=${() => openSheet({ type: 'foodEdit', id: p.fid })}>Fix the numbers</button>`}</div>`;
}
