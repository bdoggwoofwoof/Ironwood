/* ============ Superset rest: one timer per exercise (Nov 24, Newt) ============
   In a superset each exercise gets its own rest timer, started when you log its set, shown as small labelled timers in
   the bottom-left corner. The one ending soonest sits on the left. When it ends it beeps, shows Go for a moment, then
   fades, and the next one slides left: they leapfrog as you go back and forth. S.restQ = [{ id, ex, until, total, beeped }]. */
S.restQ = S.restQ || [];
function pushSSRest(it, secs) {
  const now = Date.now(); S.restQ = S.restQ.filter(t => t.ex !== it.ex && !(t.until + 2600 < now));
  S.restQ.push({ id: uid('rq'), ex: it.ex, until: now + secs * 1000, total: secs, beeped: {} });
  S.restQ.sort((a, b) => a.until - b.until); S.rerender();
}
function restQTick() {
  const q = S.restQ; if (!q || !q.length) return; const st = S.meta.settings; const now = Date.now(); let changed = false;
  for (const t of q) { const left = Math.ceil((t.until - now) / 1000);
    if (st.countdown && left >= 1 && left <= 3 && !t.beeped[left]) { t.beeped[left] = 1; beep(660, 110); }
    if (left <= 0 && !t.beeped.end) { t.beeped.end = 1; if (st.beep) beep(990, 500, 0.35); announce(exName(t.ex) + ': rest over'); changed = true; } }
  const keep = q.filter(t => t.until + 2600 > now); if (keep.length !== q.length) { S.restQ = keep; changed = true; }
  if (changed) S.rerender();
}
function RestPills() {
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(iv); }, []);
  const q = (S.restQ || []).slice().sort((a, b) => a.until - b.until); if (!q.length) return null; const now = Date.now();
  const adj = (t, d) => { t.until = Math.max(now + 1000, t.until + d * 1000); t.total = Math.max(5, t.total + d); t.beeped = {}; S.restQ.sort((a, b) => a.until - b.until); S.rerender(); };
  return html`<div class="rest-pills" role="group" aria-label="Superset rest timers">${q.map(t => { const left = Math.ceil((t.until - now) / 1000); const done = left <= 0; const fading = t.until + 1800 < now;
    return html`<div key=${t.id} class=${'rest-pill' + (done ? ' go' : '') + (fading ? ' gone' : '')} role="timer" aria-label=${exName(t.ex) + (done ? ': go' : ' rest ' + clock(left))}>
      <span class="rp-name">${exName(t.ex)}</span><b class="rp-t">${done ? 'Go' : clock(left)}</b>
      ${done ? null : html`<span class="rp-acts"><button aria-label=${'15 seconds less for ' + exName(t.ex)} onClick=${() => adj(t, -15)}>−15</button><button aria-label=${'15 seconds more for ' + exName(t.ex)} onClick=${() => adj(t, 15)}>+15</button><button aria-label=${'Skip ' + exName(t.ex) + ' rest'} onClick=${() => { S.restQ = S.restQ.filter(x => x !== t); S.rerender(); }}>${I.x}</button></span>`}</div>`; })}</div>`;
}
