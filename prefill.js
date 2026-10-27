/* ============ Last time's numbers, rep records (Oct 27) ============ */
/* Where a workout's prefilled weights and reps (and the weight-jump suggestions) come from:
   'all'     – the last time you did the exercise in any workout (the default)
   'workout' – the last time you did it in this same workout (plan day); if never, any workout.
   settings.prefill is the default; settings.prefillBy[routineId] overrides it for one plan. Records and PRs always
   count every workout. */
let PREFILL_CTX = null;
const PREFILL_OPTS = [['all', 'Any workout'], ['workout', 'This workout only']];
const prefillScopeFor = rid => { const st = S.meta.settings; const o = rid && st.prefillBy && st.prefillBy[rid]; return o || st.prefill || 'all'; };
function prefillCtx() {
  const a = S.active; const c = a ? { rid: a.routineId, did: a.dayId } : PREFILL_CTX;
  return c && c.rid && c.did && prefillScopeFor(c.rid) === 'workout' ? c : null;
}
const sameWorkout = (s, c) => s.routineId === c.rid && s.dayId === c.did;
function lastEntryOccIn(exId, group, occ, keep) {
  const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) {
    const x = list[i]; if (!keep(x)) continue; const its = x.items.filter(it => it.ex === exId && (it.group || '') === group);
    if (its.length) { const it = its[Math.min(occ || 0, its.length - 1)]; return { t: x.startedAt, sid: x.id, group, sets: toMain(it.sets, it.u), raw: it.sets, u: it.u || U(), note: it.note || '' }; }
  }
  return null;
}
function setPrefill(v, rid) {
  commit(st => {
    const s = st.meta.settings;
    if (!rid) { s.prefill = v; return; }
    s.prefillBy = { ...(s.prefillBy || {}) }; if (v === (s.prefill || 'all')) delete s.prefillBy[rid]; else s.prefillBy[rid] = v;
  }, 'meta', 400);
}
function PrefillSeg({ rid }) {
  const cur = prefillScopeFor(rid);
  return html`<div class="seg" role="group" aria-label="Last time's numbers come from" id=${rid ? 'prefill-plan' : 'prefill-all'}>${PREFILL_OPTS.map(([k, l]) => html`<button key=${k} class=${cur === k ? 'on' : ''} aria-pressed=${cur === k} id=${(rid ? 'pfp-' : 'pf-') + k} onClick=${() => setPrefill(k, rid)}>${l}</button>`)}</div>`;
}
/* Plan page: per-plan choice */
function PrefillRow({ r }) {
  if (r.info && (r.info.care || r.info.fight)) return null;
  const over = (S.meta.settings.prefillBy || {})[r.id];
  return html`<div class="card" style="margin-top:12px" id="prefill-row"><div style="font-weight:600">Last time’s numbers come from</div>
    <p class="small muted" style="margin:2px 0 8px">${r.days.length > 1 ? 'Any workout, or only the last time you did this day of the plan.' : 'Any workout, or only the last time you did this routine.'} ${over ? 'Set for this plan.' : 'Same as your default in Profile.'}</p>
    <${PrefillSeg} rid=${r.id}/></div>`;
}

/* Exercise stats: the most reps at each weight. A row shows only when nothing heavier was ever done for as many reps,
   so the list starts at your heaviest weight and works down. Weights logged in the other unit are converted. */
function repRecords(ex, group) {
  const best = new Map();
  for (const e of entries(ex, group)) for (const x of e.sets) {
    const w = r05(+x.w || 0), r = +x.r || 0; if (!(w > 0) || !(r > 0)) continue;
    const b = best.get(w); if (!b || r > b.r || (r === b.r && e.t < b.t)) best.set(w, { w, r, t: e.t });
  }
  const out = []; let most = 0;
  for (const b of [...best.values()].sort((a, c) => c.w - a.w)) if (b.r > most) { out.push(b); most = b.r; }
  return out;
}
function RepRecords({ ex, group }) {
  const k = exKind(ex); if (k === 'assisted' || k === 'bodyweight' || isMeasured(k)) return null;
  const rows = repRecords(ex, group); if (!rows.length) return null;
  return html`<div class="section-h"><h2>Best reps at each weight</h2></div>
    <div class="card prl" id="rep-records">${rows.map((b, i) => html`<div key=${b.w}><div><div style="font-weight:600">${fmt(b.w)} ${U()}${i === 0 ? html` <span class="chip on" style="margin-left:4px">Heaviest</span>` : null}</div><div class="small muted">${shortDate(b.t)}</div></div><b class="num">${b.r} rep${b.r === 1 ? '' : 's'}</b></div>`)}
      <p class="small muted" style="margin-top:6px">A weight shows only when nothing heavier was done for as many reps. Sets logged in ${U() === 'kg' ? 'lb' : 'kg'} are converted to ${U()}.</p></div>`;
}
/* One set's numbers from last time, shown beside the set */
function prevSetText(it, j, kind) {
  const p = it.prev && it.prev[j]; if (!p || !(+p.r > 0)) return '';
  return kind === 'bodyweight' && !(+p.w) ? p.r + ' reps' : fmt(+p.w || 0) + ' × ' + p.r;
}
