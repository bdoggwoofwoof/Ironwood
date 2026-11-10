/* ============ Running plan setup that fits your lifting (Nov 2) ============ */
/* 1. Times are optional: pick how running feels now and the plan starts from estimated times (run.est), with a nudge
      to put in real ones after a week. 2. The plan reads your main program's days (not a guess) and asks how runs should
      fit: A off days, B on lifting days, C running first, D mixed (default). run.fit = path; run.lifts = weekday → type
      from the program; run.days = weekday for each run. Hard runs stay off leg days and the day before or after them.
   Programs added alongside ask the same: off days, lifting days, or pick yourself. */
const RUN_LEVELS = [
  ['new', 'New to running', 'Can’t run a mile without stopping yet', { t100: 20, t1: 780, t3: 2520 }],
  ['back', 'Getting back into it', 'Used to run; out of practice', { t100: 17.5, t1: 630, t3: 2070 }],
  ['some', 'Run now and then', 'A few easy miles feel OK', { t100: 16, t1: 540, t3: 1770 }],
  ['reg', 'Run regularly', 'Most weeks, some faster running', { t100: 14.5, t1: 450, t3: 1470 }]];
const FIT_PATHS = [
  ['mixed', 'Mixed (recommended)', 'Easy run on a lifting day; hard runs on days off, away from leg days when the week allows'],
  ['off', 'On my days off', 'Most recovery. Best for 2–3 runs a week'],
  ['double', 'On my lifting days', 'Lift first, run after. Keeps rest days fully off'],
  ['run', 'Running comes first', 'Runs get the best days; you may need to move leg day']];
function liftTypeOf(name) {
  const t = String(name || '').toLowerCase();
  if (/leg|lower|quad|hamstring|glute|squat/.test(t)) return 'Legs';
  if (/full/.test(t)) return 'Full Body';
  if (/upper/.test(t)) return 'Upper';
  if (/pull|back|lat/.test(t)) return 'Back';
  if (/push|chest|bench/.test(t)) return 'Chest';
  if (/shoulder|delt/.test(t)) return 'Shoulders';
  if (/arm|bicep|tricep/.test(t)) return 'Arms';
  return 'Full Body';
}
/* weekday → lifting type, from the main program's days (in week order, day 1 on the first planned weekday) */
function liftMapFromProgram() {
  const r = programRoutine(); if (!r || !r.days.length) return null;
  const dows = schedFor(r.id, r).slice().sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b)); const out = {};
  dows.forEach((d, i) => { out[d] = liftTypeOf(r.days[i % r.days.length].name); });
  return out;
}
/* Pick days for the hard and easy runs */
function fitDays(path, lifts, runs) {
  const L = lifts || {}; const isLift = d => !!L[d]; const legs = d => !!LEGGY[L[(d + 7) % 7]];
  const nearLegs = d => legs(d) || legs(d - 1) || legs(d + 1);
  const order = WEEK_ORDER;
  const tiers = {
    off: [[d => !isLift(d) && !nearLegs(d), d => !isLift(d)], [d => !nearLegs(d), d => !isLift(d)], [d => !legs(d), () => true]],
    double: [[d => isLift(d) && !nearLegs(d), d => isLift(d)], [d => isLift(d) && !legs(d), d => isLift(d)], [d => !legs(d), () => true]],
    run: [[d => !nearLegs(d), () => true], [d => !legs(d), () => true], [() => true, () => true]],
    mixed: [[d => !isLift(d) && !nearLegs(d), d => isLift(d)], [d => !isLift(d) && !legs(d), d => isLift(d) && !legs(d)], [d => !isLift(d), () => true], [d => !nearLegs(d), d => isLift(d)], [d => !legs(d), () => true]] }[path] || [];
  const gap = (a, b) => { const x = Math.abs(order.indexOf(a) - order.indexOf(b)); return Math.min(x, 7 - x); };
  const need = runs >= 2 ? 2 : 1;
  for (const [hardOk, easyOk] of tiers.concat([[() => true, () => true]])) {
    const hc = order.filter(hardOk); if (hc.length < need) continue;
    let pair = null, best = -1;
    if (need === 1) pair = [hc[Math.floor((hc.length - 1) / 2)]];
    else for (let i = 0; i < hc.length; i++) for (let j = i + 1; j < hc.length; j++) { const g = gap(hc[i], hc[j]); if (g >= 2 && g > best) { best = g; pair = [hc[i], hc[j]]; } }
    if (!pair) continue;
    const ec = order.filter(d => easyOk(d) && !pair.includes(d));
    const easy = ec.length ? ec.slice().sort((a, b) => Math.min(...pair.map(h => gap(b, h))) - Math.min(...pair.map(h => gap(a, h))))[0] : order.find(d => !pair.includes(d));
    return { hard: pair, easy };
  }
  return { hard: [2, 5], easy: 4 };
}
function applyFit(path, quiet) {
  const R = runSt(); if (!R) return; const lifts = liftMapFromProgram() || R.lifts || {};
  const f = fitDays(path, lifts, R.runs || 3); const [h1, h2] = f.hard;
  runCommit(r => {
    r.fit = path; r.lifts = { ...lifts }; const keep = Object.fromEntries(Object.entries(r.days || {}).filter(([k]) => /^E/.test(k)));
    r.days = { ...keep, A: h1, B: h2 != null ? h2 : h1, C: f.easy, 1: h1, 2: f.easy, T: h2 != null ? h2 : h1 };
  });
  if (!quiet) showToast({ kind: 'info', text: 'Runs moved to fit your lifting: hard runs ' + f.hard.map(d => DOW[d]).join(' and ') + ', easy ' + DOW[f.easy] });
}
function FitPicker({ value, set, pre }) {
  return html`<div class="stack" style="gap:6px" role="radiogroup" aria-label="How runs fit your lifting">${FIT_PATHS.map(([k, l, d]) => html`<button key=${k} id=${(pre || 'fit-') + k} role="radio" aria-checked=${value === k} class=${'opt' + (value === k ? ' on' : '')} onClick=${() => set(k)}><div style="flex:1;min-width:0"><div>${l}</div><div class="d">${d}</div></div>${value === k ? I.check : null}</button>`)}</div>`;
}
function RunFitSheet() {
  const R = runSt() || {}; const [p, setP] = useState(R.fit || 'mixed'); const lifts = liftMapFromProgram();
  return html`<${Sheet} label="How runs fit your lifting"><h2>How runs fit your lifting</h2>
    <p class="note">${lifts ? 'Your lifting days come from ' + programRoutine().name + ': ' + WEEK_ORDER.filter(d => lifts[d]).map(d => DOW[d] + ' ' + lifts[d]).join(', ') + '.' : 'Follow a lifting program and the plan works around its days. For now it uses the lifting days set on the Run tab.'}</p>
    <div style="margin-top:12px"><${FitPicker} value=${p} set=${setP}/></div>
    <div class="stack" style="margin-top:12px"><button class="btn primary wide" id="fit-save" onClick=${() => { closeSheet(); applyFit(p); }}>Move my runs</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* Setup: know your times, or pick a level */
function RunStart() {
  const [mode, setMode] = useState(''); const [lvl, setLvl] = useState('some'); const [fit, setFit] = useState('mixed');
  const [runs, setRuns] = useState(3); const [weeks, setWeeks] = useState(8); const [start, setStart] = useState(nextMonday());
  const build = (t, est) => {
    runCommit(r => { Object.assign(r, { t100: t.t100, t1: t.t1, t3: t.t3, runs: t.runs || runs, weeks: t.weeks || weeks, start: t.start || start, block: r.block || 1, est: !!est, off: false }); r.hist.push({ d: ymd(new Date()), t100: t.t100, t1: t.t1, t3: t.t3, why: est ? 'estimate' : 'start' }); });
    applyFit(fit, true); showToast({ kind: 'info', text: 'Your running plan is ready' + (est ? '. Paces are estimates until you add real times.' : '.') });
  };
  if (!mode) return html`<div id="run-begin">
    <div class="section-h" style="margin-top:14px"><h2>Start a running plan</h2></div>
    <p class="note" style="margin-bottom:12px">The plan sets every pace from your current speed and fits around your lifting. Don’t know your times? That’s fine.</p>
    <div class="stack"><button class="opt" id="rs-know" onClick=${() => setMode('times')}><div style="flex:1"><div>I know my times</div><div class="d">100 m, 1 mile and 3 miles</div></div></button>
      <button class="opt" id="rs-guess" onClick=${() => setMode('level')}><div style="flex:1"><div>I don’t know my times</div><div class="d">Answer one question and start from estimates</div></div></button></div>
    <button class="btn text" id="run-whole" style="padding-left:0;margin-top:6px" onClick=${() => openSheet({ type: 'goalSetup' })}>Or build a whole plan: lifting, running and meals</button>
    <p class="small faint" style="margin-top:14px">${RUN_NOTE}</p></div>`;
  const common = html`<div><span class="lbl">How should runs fit your lifting?</span><div style="margin-top:6px"><${FitPicker} value=${fit} set=${setFit} pre="rsfit-"/></div></div>`;
  if (mode === 'times') return html`<div id="run-begin"><button class="btn text" style="padding-left:0;margin-top:10px" onClick=${() => setMode('')}>${I.back} Back</button>
    <div class="section-h"><h2>Your times</h2></div>
    <div class="stack" style="gap:14px">${common}<${RunTimesForm} onSave=${x => build(x, false)} saveLabel="Build my plan" first=${true}/></div></div>`;
  const L = RUN_LEVELS.find(x => x[0] === lvl);
  return html`<div id="run-begin"><button class="btn text" style="padding-left:0;margin-top:10px" onClick=${() => setMode('')}>${I.back} Back</button>
    <div class="section-h"><h2>Where are you now?</h2></div>
    <div class="stack" style="gap:6px">${RUN_LEVELS.map(([k, l, d]) => html`<button key=${k} id=${'rs-lvl-' + k} class=${'opt' + (lvl === k ? ' on' : '')} aria-pressed=${lvl === k} onClick=${() => setLvl(k)}><div style="flex:1"><div>${l}</div><div class="d">${d}</div></div>${lvl === k ? I.check : null}</button>`)}</div>
    <p class="small muted">Starts from about a ${rfmt(L[3].t1)} mile. After your first week, put in a real mile time (Run → Times) and every pace updates.</p>
    <div class="stack" style="gap:14px;margin-top:12px">${common}
      <div><span class="lbl">Plan length</span><${LenSeg} v=${weeks} on=${setWeeks} pre="rslen-"/></div>
      <${RunsPicker} value=${runs} set=${setRuns} pre="rsruns"/>
      <div><label class="lbl" for="rs-start">Week 1 starts</label><input type="date" class="field" id="rs-start" style="margin-top:6px" value=${start} onChange=${e => e.target.value && setStart(e.target.value)}/></div>
      <button class="btn primary wide" id="rs-build" onClick=${() => build({ ...L[3] }, true)}>Build my plan</button></div>
    <p class="small faint" style="margin-top:14px">${RUN_NOTE}</p></div>`;
}
/* Plan tab: estimate banner and the fit button */
function RunFitBar() {
  useEffect(() => { try { runFitSync(); } catch (e) {} }, [programId()]);
  const R = runSt(); if (!R) return null; const p = FIT_PATHS.find(x => x[0] === (R.fit || ''));
  return html`<div style="margin-top:10px">${R.est ? html`<div class="tip-card" id="run-est" style="padding-right:14px"><b>Paces are estimates.</b> After a week of runs, put in a real mile time and every pace updates. <button class="btn text" id="run-est-go" onClick=${() => { lsSet('runTab', 'times'); S.rerender(); }}>Add my times</button></div>` : null}
    <button class="btn text" id="run-fit" style="padding-left:0" onClick=${() => openSheet({ type: 'runFit' })}>${I.cal} Fit with my lifting${p ? ': ' + p[1].replace(' (recommended)', '') : ''}</button></div>`;
}

/* ---- programs added alongside: how they fit ---- */
function addonDaysFor(id, how) {
  const r = getRoutine(id); const n = progDaysPerWeek(r || { days: [] }); const main = programRoutine(); const mainDays = main ? schedFor(main.id, main) : [];
  const order = WEEK_ORDER; let pool = how === 'off' ? order.filter(d => !mainDays.includes(d)) : how === 'same' ? order.filter(d => mainDays.includes(d)) : [];
  if (!pool.length) pool = order.slice();
  if (pool.length <= n) return pool.slice().sort();
  const out = []; const step = pool.length / n; for (let i = 0; i < n; i++) out.push(pool[Math.floor(i * step)]);
  return [...new Set(out)].sort();
}
function setAddonFit(id, how) {
  if (how === 'pick') { closeSheet(); UI.setView(null); UI.setTab('train'); TRAIN.mode = 'train'; S.rerender(); setTimeout(() => { const el = document.getElementById('plan-week'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120); showToast({ kind: 'info', text: 'Tap days in Your week to plan it' }); return; }
  const days = addonDaysFor(id, how);
  commit(st => { st.meta.settings.sched = { ...(st.meta.settings.sched || {}), [id]: days }; st.meta.settings.addonFit = { ...(st.meta.settings.addonFit || {}), [id]: how }; }, 'meta');
  showToast({ kind: 'info', text: (getRoutine(id) || {}).name + ': ' + days.map(d => DOW[d]).join(', ') });
}
function AddonFit({ id, onDone }) {
  const cur = (S.meta.settings.addonFit || {})[id];
  return html`<div class="cat-pick" role="group" aria-label="How it fits" id=${'afit-' + id}><span class="small muted" style="width:100%">How should it fit?</span>${[['off', 'On my days off'], ['same', 'On lifting days'], ['pick', 'I’ll pick days']].map(([k, l]) => html`<button key=${k} class=${'chip' + (cur === k ? ' on' : '')} id=${'afit-' + id + '-' + k} onClick=${() => { setAddonFit(id, k); onDone && onDone(); }}>${l}</button>`)}</div>`;
}
function AddonFitSheet({ id }) {
  const r = getRoutine(id);
  return html`<${Sheet} label="How it fits"><h2>${r ? r.name : 'Program'} alongside</h2><p class="note">It shows in Train next to your main program. Which days should it go on?</p>
    <div style="margin-top:10px"><${AddonFit} id=${id} onDone=${closeSheet}/></div><button class="btn wide" style="margin-top:12px" onClick=${closeSheet}>Decide later</button><//>`;
}

/* When the lifting program's days change (a new program, a new schedule, or a plan made before this setup existed),
   move the runs to match, once per change, and say so. */
function runFitSync() {
  const R = runSt(); if (!R || R.off || !R.t1) return; const lifts = liftMapFromProgram(); if (!lifts) return;
  const same = JSON.stringify(Object.entries(lifts).sort()) === JSON.stringify(Object.entries(R.lifts || {}).map(([k, v]) => [String(k), v]).sort().map(([k, v]) => [k, v]));
  const key = JSON.stringify(lifts); if (same || R.fitFor === key) return;
  runCommit(r => { r.fitFor = key; }); applyFit(R.fit || 'mixed');
}
setTimeout(() => { try { if (!S.active) runFitSync(); } catch (e) {} }, 2000);
