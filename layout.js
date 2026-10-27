/* ============ Challenges you can find, and one header style ============ */
/* Challenges were only reachable from a small button at the bottom of Train. Now: ready-made templates in a sheet,
   reachable from Train (a card near the top while you have none) and from Routines. Generic names only. */
const CH_TEMPLATES = [
  { id: 'iron75', name: 'Iron 75', days: 75, restart: true, rest: 0, d: 'The strict one: two workouts a day (make one outdoors), a gallon of water, your eating plan with no slip-ups, 10 pages of reading and a progress photo. Miss anything and you start over.',
    items: [['Workout 1', 'w1'], ['Workout 2 (outdoors)', 'w2'], ['Drink a gallon of water'], ['Stick to your eating plan'], ['Read 10 pages'], ['Progress photo']] },
  { id: 'iron75lite', name: 'Iron 75 Lite', days: 75, restart: false, rest: 1, d: 'The sustainable version: one workout a day with one rest day a week, water, eating plan and reading. A missed day doesn’t reset it.',
    items: [['Workout', 'w1'], ['Drink 3 liters of water'], ['Stick to your eating plan'], ['Read 10 pages']] },
  { id: 'move30', name: '30-Day Streak', days: 30, restart: false, rest: 0, d: 'Do something every day for 30 days: a workout, a run or any logged activity, plus a 10-minute walk.',
    items: [['Workout or activity', 'w1'], ['10-minute walk']] },
  { id: 'protein42', name: '6-Week Protein & Sleep', days: 42, restart: false, rest: 0, d: 'Recovery habits for six weeks: hit your protein goal, sleep 7+ hours and train on your plan days.',
    items: [['Hit your protein goal'], ['Sleep 7+ hours'], ['Training on plan days', 'w1']] },
];
function challengeFrom(t) {
  return { id: uid('c'), name: t.name, days: t.days, start: ymd(new Date()), restart: t.restart, restPerWeek: t.rest || 0, createdAt: Date.now(), log: {},
    items: t.items.map(([name, auto]) => ({ id: uid('k'), name, auto: auto || null })) };
}
function openChallengeDraft(draft) { closeSheet(); UI.setTab('train'); UI.setView({ type: 'chEdit', draft, isNew: true }); }
function ChallengeSheet() {
  return html`<${Sheet} label="Start a challenge"><h2>Start a challenge</h2>
    <p class="note">A daily checklist for a set number of days. Workouts you log tick their items by themselves. You can change everything before you start.</p>
    <div class="stack" style="gap:8px;margin-top:10px">${CH_TEMPLATES.map(t => html`<button key=${t.id} class="opt ch-tpl" id=${'cht-' + t.id} onClick=${() => openChallengeDraft(challengeFrom(t))}>
      <div style="flex:1;min-width:0"><div><b>${t.name}</b> <span class="small muted">· ${t.days} days</span></div><div class="d">${t.d}</div></div></button>`)}
      <button class="opt" id="cht-own" onClick=${() => openChallengeDraft({ ...newChallenge(), name: 'My challenge', items: [{ id: uid('k'), name: 'Workout', auto: 'w1' }] })}><div style="flex:1"><div><b>Make your own</b></div><div class="d">Pick the length and the daily checklist yourself.</div></div></button></div>
    <p class="small faint" style="margin-top:10px">Strict challenges are hard on recovery. Take rest days if you feel run down, and skip anything that hurts. Not medical advice.</p><//>`;
}
/* Train (while you have no challenge) and Routines: a way in */
function ChallengeFinder({ where }) {
  if (where === 'train' && Object.keys(S.meta.challenges || {}).length) return null;
  return html`<button class="card ch-finder" id=${'ch-finder-' + where} onClick=${() => openSheet({ type: 'challenges' })}>
    <span class="ch-ic">${I.check}</span><span style="flex:1;min-width:0;text-align:left"><b>Challenges</b><span class="small muted" style="display:block">Iron 75, Iron 75 Lite, 30-day streak and more</span></span><span class="go">Start</span></button>`;
}
