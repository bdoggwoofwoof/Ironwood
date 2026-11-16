/* ============ Body goal (Nov 16, Newt: like the scan station's Fitness & Weight Loss page) ============
   Starts from the newest numbers you have: bodyweight, and from a body scan the body fat, lean mass and BMR. You pick
   Lean bulk, Cut, Recomp or Maintain, a pace, an optional target weight or body fat, and workouts a week. It shows how
   much to eat (calories and protein, carbs, fat), what you burn, the workouts, an estimated goal date and tips, and it
   warns when the plan and what you're doing drift apart: missed workouts on a bulk or a cut, weight moving too fast or
   not at all, low protein. S.meta.settings.body = { goal, pace, twKg?, tbf?, from: ymd, w0Kg, hold?: ymd }.
   Estimates for planning, not medical advice; no calorie numbers for anyone under 18. */
const BG_GOALS = [['bulk', 'Lean bulk', 'Gain muscle with a small surplus'], ['cut', 'Cut', 'Lose fat, keep muscle'], ['recomp', 'Recomp', 'Lose fat and build muscle at about maintenance'], ['keep', 'Maintain', 'Hold your weight steady']];
const BG_PACE = { bulk: { gentle: ['Gentle', '¼ lb a week, the least fat'], steady: ['Steady', '½ lb a week, faster, a bit more fat'] },
  cut: { gentle: ['Gentle', '½% of your weight a week, easiest to keep muscle'], steady: ['Steady', '¾% of your weight a week, faster and harder'] } };
const LB = 2.20462;
const bgSet = () => S.meta.settings.body || null;
const bgLatest = k => { const es = (S.meta.meas || []).filter(e => e.k === k).sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0); return es[es.length - 1] || null; };
/* What we know about you now. Weights in lb for the math. */
function bodyNow() {
  const me = (typeof ML === 'function' && ML().me) || {};
  const bw = (S.meta.bw || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).pop();
  const wLb = bw ? conv(+bw.w, bw.u || U(), 'lb') : me.w ? me.w * LB : 0;
  const bfE = bgLatest('bf'), lnE = bgLatest('leanm'), bmrE = bgLatest('bmr');
  const bf = bfE ? +bfE.v : null;
  const leanLb = lnE ? conv(+lnE.v, lnE.u || U(), 'lb') : bf != null && wLb ? wLb * (1 - bf / 100) : null;
  let bmr = null, bmrSrc = '';
  if (bmrE) { bmr = +bmrE.v; bmrSrc = 'your scan'; }
  else if (leanLb) { bmr = Math.round(370 + 21.6 * leanLb / LB); bmrSrc = 'your lean mass'; }
  else if (me.h > 0 && me.age > 0 && wLb) { bmr = Math.round(10 * wLb / LB + 6.25 * me.h - 5 * me.age + (me.sex === 'm' ? 5 : me.sex === 'f' ? -161 : -78)); bmrSrc = 'your height, weight and age'; }
  return { wLb, wD: bw ? bw.d : null, bf, bfD: bfE ? bfE.d : null, leanLb, bmr, bmrSrc, sex: me.sex || '', age: me.age || 0 };
}
/* Workouts: planned a week, done this week, in the last 14 days and the last 28 */
function bgWorkouts() {
  const plan = +S.meta.settings.goal || 3; const now = Date.now(); const ws = +startOfWeek(new Date());
  const ss = sessionList(); const since = d => ss.filter(s => s.startedAt >= now - d * 864e5).length;
  const first = ss.length ? Math.min(...ss.map(s => s.startedAt)) : now;
  return { plan, week: ss.filter(s => s.startedAt >= ws).length, d14: since(14), d28: since(28), days: Math.floor((now - first) / 864e5) };
}
const actFactor = n => 1.2 + 0.0875 * Math.min(6, Math.max(0, n));
/* Weight trend in lb a week over the last 3 weeks (needs entries 10+ days apart) */
function bgTrend() {
  const cut = ymd(addDays(new Date(), -21)); const es = (S.meta.bw || []).filter(b => b.d >= cut).sort((a, b) => a.d < b.d ? -1 : 1);
  if (es.length < 2) return null; const a = es[0], b = es[es.length - 1]; const days = (parseYmd(b.d) - parseYmd(a.d)) / 864e5;
  if (days < 10) return null; return (conv(+b.w, b.u || U(), 'lb') - conv(+a.w, a.u || U(), 'lb')) / days * 7;
}
/* The numbers for a goal setup (g), or { problem } */
function bgCalc(g, N) {
  N = N || bodyNow(); const W = bgWorkouts();
  if (N.age && N.age < 18) return { problem: 'Calorie targets here are for adults. If you’re under 18, a doctor or dietitian can help with how much to eat while you’re still growing.' };
  if (!N.wLb) return { problem: 'Log your weight (Bodyweight, below) or add a scan to see your numbers.' };
  if (!N.bmr) return { problem: 'Add a body scan, or your height and age in Profile → About you, to work out what you burn.' };
  const days = g.days || W.plan; const tdee = Math.round(N.bmr * actFactor(days) / 10) * 10;
  const pace = g.pace || 'gentle';
  let rate = 0; /* lb a week, + gain, − lose */
  if (g.goal === 'bulk') rate = pace === 'steady' ? 0.5 : 0.25;
  if (g.goal === 'cut') rate = -N.wLb * (pace === 'steady' ? 0.0075 : 0.005);
  let adj = Math.round(rate * 500); if (g.goal === 'cut') adj = Math.max(-750, adj); if (g.goal === 'recomp') adj = -100;
  const held = g.hold && g.hold >= ymd(new Date()) && g.goal === 'bulk';
  if (held) adj = 0;
  const floor = Math.max(N.bmr, N.sex === 'f' ? 1200 : N.sex === 'm' ? 1500 : 1350);
  let kcal = Math.round((tdee + adj) / 10) * 10; let note = '';
  if (kcal < floor) { kcal = Math.round(floor / 10) * 10; note = 'Ironwood doesn’t plan below what you burn at rest, so the loss will be slower.'; rate = Math.min(0, (kcal - tdee) / 500); }
  const pBase = N.bf != null && N.bf > 28 && N.leanLb ? N.leanLb * 1.1 : N.wLb * (g.goal === 'cut' ? 1.0 : g.goal === 'keep' ? 0.8 : 0.9);
  const p = Math.min(250, Math.round(pBase / 5) * 5); const f = Math.max(Math.round(N.wLb * 0.3 / 5) * 5, Math.round(kcal * 0.25 / 9 / 5) * 5);
  const c = Math.max(50, Math.round((kcal - p * 4 - f * 9) / 4 / 5) * 5);
  /* Target and goal date */
  let twLb = g.twKg ? g.twKg * LB : null; const fatLb = N.bf != null ? N.wLb * N.bf / 100 : null;
  if (!twLb && g.tbf && N.leanLb && (g.goal === 'cut')) twLb = N.leanLb / (1 - g.tbf / 100);
  let weeks = null, endBf = null, why = '';
  if (twLb && rate && Math.sign(twLb - N.wLb) === Math.sign(rate)) {
    weeks = Math.abs(twLb - N.wLb) / Math.abs(rate);
    if (fatLb != null) { const d = twLb - N.wLb; const leanShare = g.goal === 'bulk' ? (pace === 'steady' ? 0.45 : 0.6) : 0.1; endBf = (fatLb + d * (1 - leanShare)) / twLb * 100; }
  } else if (twLb && rate) why = g.goal === 'bulk' ? 'Your target is below your weight now; a bulk adds weight.' : 'Your target is above your weight now; a cut takes weight off.';
  if (g.goal === 'recomp' && g.tbf && N.bf != null && g.tbf < N.bf) { weeks = (N.bf - g.tbf) / 0.75 * 4.35; endBf = g.tbf; }
  const date = weeks != null && !held ? addDays(new Date(), Math.round(weeks * 7)) : null;
  const lift = { bulk: [4, 5], cut: [3, 4], recomp: [3, 4], keep: [3, 4] }[g.goal] || [3, 4];
  return { tdee, kcal, adj, p, c, f, rate, twLb, weeks, date, endBf, why, note, held, lift, days, floor };
}
/* What doesn't line up, most important first */
function bgWarnings(g, R, N) {
  const W = bgWorkouts(); const out = []; const done = W.d14, want = W.plan * 2;
  const hasHistory = W.days >= 14;
  if (g.goal === 'bulk' && hasHistory && done <= want - 3) out.push({ id: 'miss', lvl: 'bad', h: 'Your bulk is ahead of your training',
    t: 'You did ' + done + ' of ' + want + ' planned workouts in the last 2 weeks. Extra calories without the training to use them mostly turn into fat. Get back to your workouts, or eat at maintenance (about ' + fmt(R.tdee) + ') until you do.', act: 'hold' });
  if (g.goal === 'cut' && hasHistory && done <= want - 3) out.push({ id: 'miss', lvl: 'bad', h: 'Keep lifting on your cut',
    t: 'You did ' + done + ' of ' + want + ' planned workouts in the last 2 weeks. Lifting is what tells your body to keep its muscle while you eat less; without it, more of what you lose is muscle. Even 2 short full-body days a week help.' });
  if (g.goal === 'recomp' && hasHistory && done <= want - 3) out.push({ id: 'miss', lvl: 'warn', h: 'A recomp runs on training',
    t: 'You did ' + done + ' of ' + want + ' planned workouts in the last 2 weeks. At maintenance calories, the workouts are what turn fat loss into muscle gain.' });
  if (R.held) out.push({ id: 'held', lvl: 'info', h: 'Eating at maintenance', t: 'Your surplus is paused until ' + shortDate(parseYmd(g.hold)) + '. It comes back on its own, or now with Resume.', act: 'resume' });
  const tr = bgTrend();
  if (tr != null && !R.held) {
    if (g.goal === 'bulk' && tr > Math.max(0.75, R.rate * 2)) out.push({ id: 'fast', lvl: 'warn', h: 'Gaining faster than planned', t: 'About ' + fmt(r1(conv(tr, 'lb', U()))) + ' ' + U() + ' a week over 3 weeks, against ' + fmt(r1(conv(R.rate, 'lb', U()))) + ' planned. Much of the extra is likely fat: eat about 150 calories less.' });
    if (g.goal === 'bulk' && tr <= 0.05) out.push({ id: 'flat', lvl: 'warn', h: 'Your weight isn’t going up', t: 'No gain over 3 weeks. Add about 150 calories a day, like a glass of milk or a handful of nuts, and check again in 2 weeks.' });
    if (g.goal === 'cut' && tr < -N.wLb * 0.01) out.push({ id: 'fast', lvl: 'warn', h: 'Losing faster than planned', t: 'More than 1% of your weight a week. That risks muscle and energy for workouts: eat about 150 calories more.' });
    if (g.goal === 'cut' && tr >= -0.05) out.push({ id: 'flat', lvl: 'warn', h: 'Your weight isn’t going down', t: 'No loss over 3 weeks. Trim about 150 calories a day or add a daily walk, and make sure you log everything, sauces and drinks too.' });
  }
  if (tr == null && (g.goal === 'bulk' || g.goal === 'cut') && g.from && (Date.now() - parseYmd(g.from)) > 14 * 864e5) out.push({ id: 'weigh', lvl: 'info', h: 'Weigh in a few times a week', t: 'Log your weight (same time, after waking) so Ironwood can tell if the pace is right.' });
  /* Protein from the food log, if you log */
  if (typeof ML === 'function') { const L = ML().log || {}; let n = 0, s = 0; for (let i = 0; i < 7; i++) { const l = L[ymd(addDays(new Date(), -i))] || []; if (l.length) { n++; s += sumNut(l).p; } }
    if (n >= 3 && s / n < R.p * 0.8) out.push({ id: 'protein', lvl: 'warn', h: 'Protein is low', t: 'You average ' + Math.round(s / n) + ' g a day against ' + R.p + ' g. Protein at each meal is what builds and keeps muscle.' }); }
  if (N.bf != null) {
    const hi = N.sex === 'f' ? 30 : 20, lo = N.sex === 'f' ? 18 : 10;
    if (g.goal === 'bulk' && N.bf >= hi) out.push({ id: 'bfhi', lvl: 'info', h: 'Consider a cut or recomp first', t: 'At ' + fmt(N.bf) + '% body fat, a short cut or a recomp first usually makes a bulk leaner and longer.' });
    if (g.goal === 'cut' && N.bf <= lo) out.push({ id: 'bflo', lvl: 'warn', h: 'Already lean', t: 'At ' + fmt(N.bf) + '% body fat, cutting further gets hard on energy, mood and hormones. Go slowly and talk to a doctor before going much lower.' });
  }
  return out;
}
const BG_TIPS = {
  bulk: ['Aim for the slow pace: muscle grows only so fast, and the rest of a big surplus is fat.', 'Add weight or reps on your main lifts most weeks; that progress is what the extra food is for.', 'Spread protein over 3–5 meals, about 30–50 g each.', 'If eating enough is hard, drink some calories: milk, smoothies with oats and peanut butter.', 'Sleep 7–9 hours; growth happens while you recover.', 'Scan or measure every 4–8 weeks. Waist climbing fast with little strength gain means the surplus is too big.'],
  cut: ['Keep the weights heavy; drop a set if tired, not the weight.', 'Eat protein at every meal; it keeps muscle and keeps you full.', 'Walk every day: steps burn calories without cutting into recovery.', 'Fill up on vegetables, fruit and lean protein; watch oils, sauces and drinks.', 'Expect strength to hold, not climb. Losing a lot of strength means the pace is too fast.', 'Plan a week at maintenance every 8–12 weeks if it feels like a grind.'],
  recomp: ['Recomp works best if you’re newer to lifting or coming back after a break.', 'The scale may barely move; go by waist, scans, photos and strength.', 'Train each muscle at least twice a week and add weight or reps over time.', 'Hit your protein every day; it does the most work in a recomp.', 'Scan every 6–8 weeks; body fat often drops about ½–1 point a month.'],
  keep: ['Weigh in a few times a week; a 2-week average that drifts 2+ lb means adjust by about 150 calories.', 'Keep protein up to hold on to the muscle you built.', 'A good time to chase strength: lower reps on the main lifts.'],
};
/* "Lean bulk", "Cut"… */
const bgName = g => (BG_GOALS.find(x => x[0] === g) || [, 'Goal'])[1];
const bgW = lb => fmt(r1(conv(lb, 'lb', U()))) + ' ' + U();
function BodyGoalCard() {
  const g = bgSet(); const N = bodyNow();
  if (!g || !g.goal) return html`<div id="body-goal"><div class="section-h"><h2>Body goal</h2></div><div class="card">
      <p class="note">Bulk, cut or recomp: see how much to eat, how many workouts, when you’re likely to reach your goal, and a heads-up when things drift.${N.bf != null ? ' Starts from your latest scan.' : ''}</p>
      <button class="btn primary wide" id="bg-set" style="margin-top:10px" onClick=${() => openSheet({ type: 'bodyGoal' })}>Set a body goal</button></div></div>`;
  const R = bgCalc(g, N);
  if (R.problem) return html`<div id="body-goal"><div class="section-h"><h2>${bgName(g.goal)}</h2><button class="btn text" id="bg-edit" onClick=${() => openSheet({ type: 'bodyGoal' })}>Change</button></div><div class="card"><p class="note">${R.problem}</p></div></div>`;
  const Wk = bgWorkouts(); const warns = bgWarnings(g, R, N); const G = (typeof ML === 'function' && ML().goals) || {};
  const synced = G.kcal === R.kcal && G.p === R.p;
  const prog = R.twLb && g.w0Kg ? Math.max(0, Math.min(1, (N.wLb - g.w0Kg * LB) / (R.twLb - g.w0Kg * LB))) : null;
  const adjTxt = R.held ? 'maintenance for now' : R.adj > 0 ? R.adj + ' cal surplus' : R.adj < 0 ? -R.adj + ' cal deficit' : 'maintenance';
  return html`<div id="body-goal"><div class="section-h"><h2>${bgName(g.goal)}</h2><button class="btn text" id="bg-edit" onClick=${() => openSheet({ type: 'bodyGoal' })}>Change</button></div>
    <div class="card">
      <div class="bg-eat"><div><div class="eyebrow">Eat each day</div><b class="num" id="bg-kcal">${fmt(R.kcal)}</b><span class="small muted"> cal · ${adjTxt}</span></div></div>
      <div class="kpis kpis3" style="margin-top:8px">${kpi(R.p + ' g', 'Protein')}${kpi(R.c + ' g', 'Carbs')}${kpi(R.f + ' g', 'Fat')}</div>
      <div class="kpis kpis3" style="margin-top:8px">${kpi(fmt(R.tdee), 'You burn a day')}${kpi(Wk.week + ' of ' + R.days, 'Workouts this week')}${kpi(R.date ? shortDate(R.date).replace(/^\w+, /, '') : g.goal === 'keep' ? 'Ongoing' : '–', R.date && R.date.getFullYear() !== new Date().getFullYear() ? 'Goal date, ' + R.date.getFullYear() : 'Goal date')}</div>
      ${R.twLb ? html`<div class="bg-prog" style="margin-top:12px"><div class="row small"><span style="flex:1">Now ${bgW(N.wLb)}${N.bf != null ? ' · ' + fmt(N.bf) + '% fat' : ''}</span><span>Goal ${bgW(R.twLb)}</span></div>
        ${prog != null ? html`<div class="bg-bar" role="progressbar" aria-label="Progress to goal weight" aria-valuenow=${Math.round(prog * 100)} aria-valuemin="0" aria-valuemax="100"><i style=${'width:' + Math.round(prog * 100) + '%'}></i></div>` : null}
        ${R.endBf != null && g.goal !== 'recomp' ? html`<p class="small muted">At ${bgW(R.twLb)}, body fat would be about ${fmt(r1(R.endBf))}%${g.goal === 'bulk' ? ', if you train hard and gain slowly' : ', if you keep lifting'}.</p>` : null}</div>` : null}
      ${R.why ? html`<p class="small" style="margin-top:8px;color:var(--red-text)">${R.why}</p>` : null}
      ${R.note ? html`<p class="small muted" style="margin-top:8px">${R.note}</p>` : null}
      <p class="small muted" style="margin-top:8px">Burn is ${N.bmr} at rest (from ${N.bmrSrc}) plus ${R.days} workouts a week. Lifting: ${R.lift[0]}–${R.lift[1]} days a week${g.goal === 'cut' ? ', plus a daily walk' : ''}.</p>
      ${warns.length ? html`<div class="stack" id="bg-warns" style="margin-top:12px;gap:8px">${warns.map(w => html`<div key=${w.id} class=${'bg-warn ' + w.lvl} id=${'bgw-' + w.id}><b>${w.h}</b><div class="small">${w.t}</div>
        ${w.act === 'hold' ? html`<button class="btn" id="bg-hold" style="margin-top:6px" onClick=${() => bgHold(true)}>Eat at maintenance for a week</button>` : null}
        ${w.act === 'resume' ? html`<button class="btn" id="bg-resume" style="margin-top:6px" onClick=${() => bgHold(false)}>Resume the surplus</button>` : null}</div>`)}</div>` : null}
      <details class="meas-det" id="bg-tips"><summary><b>Tips for your ${bgName(g.goal).toLowerCase()}</b></summary><ul class="bg-tips">${BG_TIPS[g.goal].map(t => html`<li key=${t}>${t}</li>`)}</ul></details>
      ${typeof ML === 'function' ? html`<button class=${'btn wide' + (synced ? '' : ' primary')} id="bg-use" style="margin-top:10px" disabled=${synced} onClick=${() => bgUseTargets(R)}>${synced ? 'These are your meal targets' : 'Use these as my meal targets'}</button>` : null}
      <p class="small muted" style="margin-top:8px">Estimates to plan with, not medical advice. They update as you log weight, scans and workouts.</p></div></div>`;
}
function bgHold(on) {
  commit(st => { const b = st.meta.settings.body; if (on) b.hold = ymd(addDays(new Date(), 7)); else delete b.hold; }, 'meta');
  lsSet('bgWarnSeen', ymd(new Date()));
  showToast({ kind: 'info', text: on ? 'Maintenance calories for a week. The surplus comes back on its own.' : 'Surplus back on.' });
}
function bgUseTargets(R) {
  mealCommit(m => { m.goals = { ...(m.goals || {}), kcal: R.kcal, p: R.p, c: R.c, f: R.f }; });
  showToast({ kind: 'info', text: 'Meal targets set: ' + fmt(R.kcal) + ' cal, ' + R.p + ' g protein.' });
}
function BodyGoalSheet() {
  const g0 = bgSet() || {}; const N = bodyNow(); const ab = typeof aboutYou === 'function' ? aboutYou() : {};
  const ph = typeof gpPhaseNow === 'function' && S.meta.settings.plan ? gpPhaseNow(S.meta.settings.plan) : null;
  const guess = ph === 'bulk' ? 'bulk' : ph === 'cut' ? 'cut' : ab.goal === 'mass' ? 'bulk' : ab.goal === 'lose' ? 'cut' : ab.goal === 'recomp' ? 'recomp' : '';
  const [d, setD] = useState(() => ({ goal: g0.goal || guess, pace: g0.pace || 'gentle', tw: g0.twKg ? String(r1(conv(g0.twKg, 'kg', U()))) : '', tbf: g0.tbf ? String(g0.tbf) : '', days: +S.meta.settings.goal || 3 }));
  const set = o => setD({ ...d, ...o });
  const twKg = num(d.tw) > 0 ? conv(num(d.tw), U(), 'kg') : null;
  const G = d.goal ? { goal: d.goal, pace: d.pace, twKg, tbf: num(d.tbf) > 0 ? num(d.tbf) : null, days: d.days } : null;
  const R = G ? bgCalc(G, N) : null;
  const save = () => {
    const same = g0.goal === d.goal;
    commit(st => { st.meta.settings.body = { goal: d.goal, pace: d.pace, ...(twKg ? { twKg } : {}), ...(G.tbf ? { tbf: G.tbf } : {}), from: same && g0.from ? g0.from : ymd(new Date()), w0Kg: same && g0.w0Kg ? g0.w0Kg : N.wLb / LB }; st.meta.settings.goal = d.days; }, 'meta');
    closeSheet(); showToast({ kind: 'info', text: bgName(d.goal) + ' set.' });
  };
  const showPace = d.goal === 'bulk' || d.goal === 'cut';
  return html`<${Sheet} label="Body goal"><h2>Body goal</h2>
    <p class="note">${N.bf != null ? 'Starts from your latest scan (' + fmt(N.bf) + '% body fat' + (N.wLb ? ', ' + bgW(N.wLb) : '') + ').' : N.wLb ? 'Starts from your latest weight, ' + bgW(N.wLb) + '. A body scan makes it more exact.' : 'Log your weight or add a scan first for numbers.'}</p>
    <div class="stack" style="margin-top:12px">
      <div><span class="lbl">Goal</span><div class="stack" style="gap:6px">${BG_GOALS.map(([v, l, s]) => html`<button key=${v} id=${'bg-goal-' + v} class=${'opt' + (d.goal === v ? ' on' : '')} aria-pressed=${d.goal === v} onClick=${() => set({ goal: v })}><div style="flex:1"><div>${l}</div><div class="d">${s}</div></div></button>`)}</div></div>
      ${showPace ? html`<div><span class="lbl">Pace</span><div class="seg wide" role="group">${['gentle', 'steady'].map(p => html`<button key=${p} id=${'bg-pace-' + p} class=${d.pace === p ? 'on' : ''} aria-pressed=${d.pace === p} onClick=${() => set({ pace: p })}>${BG_PACE[d.goal][p][0]}</button>`)}</div>
        <p class="small muted" style="margin-top:4px">${BG_PACE[d.goal][d.pace][1]}</p></div>` : null}
      ${d.goal && d.goal !== 'keep' ? html`<div class="row" style="gap:10px">
        ${d.goal !== 'recomp' ? html`<div style="flex:1"><label class="lbl" for="bg-tw">Goal weight (${U()})</label><input class="field" id="bg-tw" inputmode="decimal" placeholder="Optional" value=${d.tw} onInput=${e => set({ tw: e.target.value.replace(/[^\d.]/g, '') })}/></div>` : null}
        ${d.goal !== 'bulk' ? html`<div style="flex:1"><label class="lbl" for="bg-tbf">Goal body fat (%)</label><input class="field" id="bg-tbf" inputmode="decimal" placeholder="Optional" value=${d.tbf} onInput=${e => set({ tbf: e.target.value.replace(/[^\d.]/g, '') })}/></div>` : null}</div>` : null}
      <div><span class="lbl">Workouts a week</span><div class="seg wide" role="group">${[2, 3, 4, 5, 6].map(n => html`<button key=${n} id=${'bg-days-' + n} class=${d.days === n ? 'on' : ''} aria-pressed=${d.days === n} onClick=${() => set({ days: n })}>${n}</button>`)}</div>
        ${R && R.lift && !R.problem && (d.days < R.lift[0]) ? html`<p class="small muted" style="margin-top:4px">${bgName(d.goal)} works best with ${R.lift[0]}–${R.lift[1]} lifting days a week.</p>` : null}</div>
      ${R ? R.problem ? html`<p class="note">${R.problem}</p> ` : html`<div class="card" id="bg-preview"><div class="small muted">Eat about</div><b class="num" style="font-size:calc(24 * var(--u))">${fmt(R.kcal)} cal</b>
        <div class="small">${R.p} g protein · ${R.c} g carbs · ${R.f} g fat</div>
        <div class="small muted" style="margin-top:4px">${R.date ? 'Goal around ' + shortDate(R.date) + (R.date.getFullYear() !== new Date().getFullYear() ? ', ' + R.date.getFullYear() : '') : R.why || (d.goal === 'keep' ? 'You burn about ' + fmt(R.tdee) + ' a day.' : 'Add a goal ' + (d.goal === 'recomp' ? 'body fat' : 'weight') + ' for a goal date.')}</div></div>` : null}
      <button class="btn primary wide" id="bg-save" disabled=${!d.goal} onClick=${save}>Save</button>
      ${g0.goal ? html`<button class="btn text wide" id="bg-clear" onClick=${() => { commit(st => { delete st.meta.settings.body; }, 'meta'); closeSheet(); }}>Remove my body goal</button>` : null}</div><//>`;
}
/* On Train: the bulk/cut warning about missed workouts, once a week at most */
function BodyGoalNudge() {
  if (S.active) return null; const g = bgSet(); if (!g || !g.goal) return null;
  const seen = lsGet('bgWarnSeen'); if (seen && seen > ymd(addDays(new Date(), -7))) return null;
  const N = bodyNow(); const R = bgCalc(g, N); if (R.problem) return null;
  const w = bgWarnings(g, R, N).find(x => x.id === 'miss'); if (!w) return null;
  return html`<div class="card check-card" id="bg-nudge"><div class="eyebrow">${bgName(g.goal)}</div><div style="font-weight:700">${w.h}</div><div class="small muted">${w.t}</div>
    <div class="check-acts">${w.act === 'hold' ? html`<button class="btn primary" id="bgn-hold" onClick=${() => bgHold(true)}>Maintenance for a week</button>` : null}
      <button class="btn" id="bgn-ok" onClick=${() => { lsSet('bgWarnSeen', ymd(new Date())); S.rerender(); }}>Got it</button></div></div>`;
}
