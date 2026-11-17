/* ============ Shop (Nov 17, meal planning audit phase 4; Newt's calls F and H) ============
   Each row edits three ways (F): tap it (or ⋯) for its sheet, or swipe it left for Amount, I have it and Remove. The box
   ticks it. Coloured badges (H) say "Need 2 more" when the plan grew after you ticked it, and "You have it". */
const SHOP_UI = { open: null, removed: false };
function ShopRow({ x, onTick }) {
  const [dx, setDx] = useState(0); const st = useRef(null); const open = SHOP_UI.open === x.key; const W = 222;
  const off = open ? -W : dx;
  const down = e => { st.current = { x: e.clientX, y: e.clientY, base: open ? -W : 0, moved: false, dx: open ? -W : 0, el: e.currentTarget, id: e.pointerId }; };
  const move = e => { const s = st.current; if (!s) return; const ddx = e.clientX - s.x; if (!s.moved && Math.abs(ddx) < 8) return; if (!s.moved && Math.abs(e.clientY - s.y) > Math.abs(ddx)) { st.current = null; return; }
    if (!s.moved) { try { s.el.setPointerCapture(s.id); } catch (x2) {} } s.moved = true; s.dx = Math.max(-W - 20, Math.min(0, s.base + ddx)); setDx(s.dx); };
  const up = () => { const s = st.current; st.current = null; if (!s || !s.moved) return; SHOP_UI.open = s.dx < -60 ? x.key : (SHOP_UI.open === x.key ? null : SHOP_UI.open); SHOP_UI.swiped = Date.now(); setDx(0); S.rerender(); };
  const act = (fn) => { SHOP_UI.open = null; fn(); };
  const done = x.st === 'done' || x.st === 'have';
  const badge = x.st === 'more' ? html`<span class="chip st-need shop-badge">Need ${x.more}</span>` : x.st === 'have' ? html`<span class="chip st-eaten shop-badge">You have it</span>` : null;
  return html`<div class="shop-swipe" id=${'shop-' + x.key.replace(/[^a-z0-9]+/gi, '-')}>
    <div class="shop-acts" aria-hidden=${!open}>
      <button tabindex=${open ? 0 : -1} class="sa-amt" onClick=${() => act(() => openSheet({ type: 'shopItem', k: x.key, edit: true }))}>Amount</button>
      <button tabindex=${open ? 0 : -1} class="sa-have" onClick=${() => act(() => shopSet(x.key, { have: x.st === 'have' ? null : 1 }))}>${x.st === 'have' ? 'Need it' : 'I have it'}</button>
      <button tabindex=${open ? 0 : -1} class="sa-rm" onClick=${() => act(() => { shopSet(x.key, { hide: 1 }); showToast({ kind: 'info', text: x.label + ' is off this list.', action: 'Undo', ms: 5000, fn: () => shopSet(x.key, { hide: null }) }); })}>Remove</button></div>
    <div class=${'shop-row' + (done ? ' on' : '')} style=${off ? { transform: 'translateX(' + off + 'px)' } : null} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>
      <button class="shop-tick" role="checkbox" aria-checked=${done} aria-label=${(done ? 'Bought: ' : 'Not bought: ') + x.label} onClick=${() => onTick(x)}><span class="box" aria-hidden="true">${done ? I.check : null}</span></button>
      <button class="shop-body" onClick=${() => { if (Date.now() - (SHOP_UI.swiped || 0) < 400) return; if (SHOP_UI.open) { SHOP_UI.open = null; S.rerender(); return; } openSheet({ type: 'shopItem', k: x.key }); }}>
        <span class="nm">${x.qty ? html`<b class="num">${x.qty}</b> ` : null}${x.label}${x.loose && x.qty ? ' (+ to taste)' : ''}</span>${badge}<span class="from">${x.from.join(' · ')}</span></button>
      <button class="shop-more" aria-label=${'Change ' + x.label} onClick=${() => openSheet({ type: 'shopItem', k: x.key })}>⋯</button></div></div>`;
}
function ShopPane() {
  const m = ML(); const P = m.plan; const items = shoppingList(); const hidden = shoppingList(true).filter(x => x.hide); const [txt, setTxt] = useState(''); const [, setT] = useState(0);
  const tick = x => mealCommit(mm => { if (x.st === 'have') { mm.shop = { ...(mm.shop || {}) }; const s = { ...(mm.shop[x.key] || {}) }; delete s.have; if (Object.keys(s).length) mm.shop[x.key] = s; else delete mm.shop[x.key]; return; }
    if (x.st === 'done') delete mm.checks[x.key]; else mm.checks[x.key] = shopSnap(x.key); });
  const got = items.filter(x => !shopOpen(x)).length + m.extras.filter(e => e.c).length; const all = items.length + m.extras.length;
  const addExtra = () => { const t = txt.trim(); if (!t) return; mealCommit(mm => { mm.extras.push({ id: uid('mx'), t, c: false }); }); setTxt(''); };
  const box = on => html`<span class="box" aria-hidden="true">${on ? I.check : null}</span>`;
  return html`<div>
    ${P.items.length ? html`<div style="margin-top:8px"><${UnitsSeg}/></div>` : null}
    ${P.items.length ? html`<p class="small muted num" style="margin-top:6px">For ${P.people} ${P.people === 1 ? 'person' : 'people'} · ${rangeText(parseYmd(P.start), spanDays(P))} · ${P.items.length} recipe${P.items.length === 1 ? '' : 's'}${all ? ' · ' + got + ' of ' + all + ' in the cart' : ''}</p>`
      : html`<div class="card stack" style="margin-top:8px"><p class="note">Your shopping list fills in from your plan’s meals, added up and sorted by aisle.</p>
        ${ML().gen ? html`<button class="btn primary wide" id="list-from-plan" onClick=${() => usePlanForPrep(false)}>Fill it from my meal plan</button>` : html`<button class="btn primary wide" id="list-plan" onClick=${() => openSheet({ type: 'mealTargets' })}>Plan my week</button>`}
        <button class="btn wide" onClick=${() => setMealsMode('recipes')}>Pick recipes myself</button></div>`}
    ${all ? html`<div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" id="share-list" onClick=${shareList}>${I.copy} Share or copy</button>${got ? html`<button class="btn" style="flex:1" onClick=${() => mealCommit(mm => { mm.checks = {}; mm.extras.forEach(e => { e.c = false; }); })}>Untick all</button>` : null}</div>` : null}
    ${AISLES.map(([a, label]) => {
      const rows = items.filter(x => x.a === a).sort((x, y) => (+!shopOpen(x) - +!shopOpen(y)) || x.label.localeCompare(y.label));
      const ex = a === 'other' ? m.extras : [];
      if (!rows.length && !ex.length) return null;
      return html`<div key=${a}><div class="aisle-h">${label}</div>${a === 'pantry' ? html`<p class="small faint" style="margin:0 0 2px">You may have these already.</p>` : null}
        <div class="card shop-card">${rows.map(x => html`<${ShopRow} key=${x.key} x=${x} onTick=${tick}/>`)}
          ${ex.map(e => html`<div key=${e.id} class=${'shop-row' + (e.c ? ' on' : '')}><button class="shop-x" role="checkbox" aria-checked=${e.c} onClick=${() => mealCommit(mm => { const y = mm.extras.find(z => z.id === e.id); if (y) y.c = !y.c; })}>${box(e.c)}<span class="nm" style="flex:1;text-align:left">${e.t}</span></button>
            <button class="tip-x" aria-label=${'Remove ' + e.t} onClick=${() => mealCommit(mm => { mm.extras = mm.extras.filter(z => z.id !== e.id); })}>${I.x}</button></div>`)}</div></div>`; })}
    ${items.length ? html`<p class="small faint" style="margin-top:8px">Tap an item to change it · swipe left for quick actions · ⋯ for the same menu</p>` : null}
    ${hidden.length ? html`<button class="btn text" id="shop-removed" style="padding-left:0" onClick=${() => { SHOP_UI.removed = !SHOP_UI.removed; setT(t => t + 1); }}>${SHOP_UI.removed ? 'Hide' : 'Show'} what you took off this list (${hidden.length})</button>
      ${SHOP_UI.removed ? html`<div class="card shop-card">${hidden.map(x => html`<div key=${x.key} class="shop-row"><span style="flex:1;min-width:0"><span class="nm">${x.qty ? html`<b class="num">${x.qty}</b> ` : null}${x.label}</span></span><button class="btn" onClick=${() => shopSet(x.key, { hide: null })}>Put back</button></div>`)}</div>` : null}` : null}
    <div class="section-h"><h2>Add an item</h2></div>
    <div class="row"><input class="field" id="extra-item" placeholder="e.g. coffee, paper towels" value=${txt} onInput=${e => setTxt(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') addExtra(); }}/><button class="btn primary" aria-label="Add to the list" disabled=${!txt.trim()} onClick=${addExtra}>${I.plus}</button></div>
  </div>`;
}
/* One item: what the plan needs, what you bought, and the edits */
function ShopItemSheet({ k, edit }) {
  const x = shoppingList(true).find(y => y.key === k); const [amt, setAmt] = useState(edit ? ((ML().shop || {})[k] || {}).edit || (x && x.qty) || '' : null); const [aisle, setAisle] = useState(false);
  if (!x) return html`<${Sheet} label="Item"><p class="note">This item is no longer on the list.</p><button class="btn wide" onClick=${closeSheet}>Done</button><//>`;
  const plan = shopFmt(x); const c = (ML().checks || {})[k]; const bought = c && c.f ? shopFmt({ ...x, fams: Object.fromEntries(Object.entries(x.fams).map(([f, v]) => [f, { fam: v.fam, total: +c.f[f] || 0 }])) }).qty : c ? 'all of it' : '';
  const opt = (id, t, d, fn, danger) => html`<button class=${'opt' + (danger ? ' danger' : '')} id=${id} onClick=${fn}><div style="flex:1"><div>${t}</div>${d ? html`<div class="d">${d}</div>` : null}</div></button>`;
  const status = x.st === 'more' ? 'Need ' + x.more : x.st === 'have' ? 'You have it at home' : x.st === 'done' ? 'In the cart' : 'Not bought yet';
  return html`<${Sheet} label=${x.label}><h2>${x.label}</h2><p class="note">For ${x.from.join(', ')}.</p>
    <div class="card stack" style="margin-top:10px;gap:8px" id="si-card">
      <div class="row"><span style="flex:1"><b>The plan needs</b><span class="small muted" style="display:block">worked out from your meals</span></span><b class="num">${plan.qty || 'to taste'}</b></div>
      ${x.edited ? html`<div class="row"><span style="flex:1"><b>Your amount</b></span><b class="num">${x.qty}</b></div>` : null}
      ${bought ? html`<div class="row"><span style="flex:1"><b>Bought</b></span><b class="num">${bought}</b></div>` : null}
      <div class="small" style="color:var(--ink-2)" id="si-status">${status}</div></div>
    ${amt != null ? html`<div class="stack" style="margin-top:10px"><label class="lbl" for="si-amt">Amount on the list</label><input class="field" id="si-amt" value=${amt} onInput=${e => setAmt(e.target.value)} placeholder=${plan.qty}/>
        <div class="row" style="gap:8px"><button class="btn primary" style="flex:2" id="si-amt-save" onClick=${() => { shopSet(k, { edit: amt.trim() && amt.trim() !== plan.qty ? amt.trim().slice(0, 40) : null }); closeSheet(); }}>Save</button>${x.edited ? html`<button class="btn" style="flex:1" onClick=${() => { shopSet(k, { edit: null }); closeSheet(); }}>Use the plan’s</button>` : null}</div></div>`
    : aisle ? html`<div class="stack" style="margin-top:10px;gap:4px">${AISLES.map(([a, l]) => opt('si-a-' + a, l + (x.a === a ? ' ✓' : ''), '', () => { shopSet(k, { a: a === shoppingList(true).find(y => y.key === k).a && !((ML().shop || {})[k] || {}).a ? null : a }); closeSheet(); }))}</div>`
    : html`<div class="stack" style="margin-top:10px;gap:4px">
      ${opt('si-tick', x.st === 'done' ? 'Untick' : x.st === 'more' ? 'Bought the rest' : 'Bought it', '', () => { mealCommit(mm => { if (x.st === 'done') delete mm.checks[k]; else mm.checks[k] = shopSnap(k); }); closeSheet(); })}
      ${opt('si-have', x.st === 'have' ? 'I need to buy it after all' : 'I have this at home', x.st === 'have' ? '' : 'Ticks it off without buying', () => { shopSet(k, { have: x.st === 'have' ? null : 1 }); closeSheet(); })}
      ${opt('si-amt-btn', 'Change the amount on the list', 'Use your own amount instead of the plan’s', () => setAmt(x.edited ? x.qty : plan.qty))}
      ${opt('si-aisle', 'Move to another aisle', 'Now in ' + (AISLES.find(a => a[0] === x.a) || [, 'Other'])[1], () => setAisle(true))}
      ${opt('si-rm', 'Remove from this list', 'Only for these dates', () => { shopSet(k, { hide: 1 }); closeSheet(); showToast({ kind: 'info', text: x.label + ' is off this list.', action: 'Undo', ms: 5000, fn: () => shopSet(k, { hide: null }) }); }, true)}</div>`}
    <button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Done</button><//>`;
}
