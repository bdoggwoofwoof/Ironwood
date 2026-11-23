/* How Ironwood works (Nov 23, Newt: "When you include warnings, can you cite your sources? … an about section that tells
   about the choices for different features, settings, and limits and reasonings with citations"). One page in Settings →
   About, and a Sources line under each warning that links to the studies and to the matching section here.
   SRC holds every study the app leans on; a choice with no study behind it says so ("Ironwood's rule of thumb"). */
const SRC = {
  pelland: ['Pelland 2024', 'The resistance training dose-response: weekly volume and frequency (meta-regression)', 'https://sportrxiv.org/index.php/server/preprint/view/460/version/587'],
  persession: ['Remmert 2025', 'Per-session set volume and hypertrophy (meta-regression)', 'https://sportrxiv.org/index.php/server/preprint/download/537/1148/1071'],
  robinson: ['Robinson 2024', 'Proximity to failure (reps in reserve) and muscle growth (meta-regression)', 'https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/'],
  halperin: ['Halperin 2022', 'How accurately lifters predict reps to failure (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/34542869/'],
  loading: ['Schoenfeld 2021', 'Loading recommendations: the repetition continuum re-examined', 'https://doaj.org/article/6d51b905504d46f0873bb43d5d84bf21'],
  singer: ['Singer 2024', 'Rest between sets and muscle growth (Bayesian meta-analysis)', 'https://doi.org/10.3389/fspor.2024.1429789'],
  rest3: ['Schoenfeld 2016', 'Longer rest periods and muscle growth in trained men', 'https://pubmed.ncbi.nlm.nih.gov/26605807/'],
  sodal: ['Sødal 2023', 'Drop sets and muscle growth (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/37523092/'],
  wolf: ['Wolf 2023', 'Partial vs full range of motion (meta-analysis)', 'https://doaj.org/article/99e86b317bec40f5abc2f0008358737e'],
  quads: ['Zabaleta-Korta 2021', 'Squats vs leg extensions: regional quadriceps growth', 'https://searchworks.jioinstitute.edu.in/articles/asx__153456335'],
  order: ['Nunes 2021', 'Exercise order, strength and muscle growth (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/32077380/'],
  tempo: ['Schoenfeld 2015', 'Repetition duration and muscle growth (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/25601394/'],
  spiering: ['Spiering 2021', 'The minimal dose of exercise to keep strength and endurance', 'https://pubmed.ncbi.nlm.nih.gov/33629972'],
  bickel: ['Bickel 2011', 'Exercise dosing to keep training gains', 'https://pubmed.ncbi.nlm.nih.gov/21131862/'],
  schumann: ['Schumann 2022', 'Concurrent aerobic and strength training (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/34757594/'],
  concorder: ['Eddens 2018', 'Exercise order within a concurrent training session (meta-analysis)', 'https://link.springer.com/article/10.1007/s40279-017-0784-1'],
  lundberg: ['Lundberg 2022', 'Concurrent training and muscle fiber growth (meta-analysis)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474354'],
  morton: ['Morton 2018', 'Protein supplementation and gains from training (meta-analysis)', 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
  permeal: ['Schoenfeld & Aragon 2018', 'How much protein the body can use in one meal', 'https://pubmed.ncbi.nlm.nih.gov/29497353/'],
  helms: ['Helms 2014', 'Evidence-based recommendations for natural bodybuilders: nutrition', 'https://pubmed.ncbi.nlm.nih.gov/24864135'],
  iraki: ['Iraki 2019', 'Nutrition for bodybuilders in the off-season (review)', 'https://pubmed.ncbi.nlm.nih.gov/31247944/'],
};
/* "Sources: A, B · Why" under a warning. Links open the study; Why opens this section of How Ironwood works. */
function Cite({ k, sec, rule }) {
  const ks = (Array.isArray(k) ? k : [k]).filter(x => SRC[x]);
  return html`<span class="small faint cite" style="display:block;margin-top:4px">${rule ? 'Ironwood’s rule of thumb' : ks.length ? 'Sources: ' : ''}${ks.map((x, i) => html`<span key=${x}>${i || rule ? ', ' : ''}<a class="cite-a" href=${SRC[x][2]} target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${SRC[x][0]}</a></span>`)}${sec ? html` · <button class="btn text cite-why" style="padding:0;min-height:0;font-size:inherit;vertical-align:baseline" onClick=${e => { e.stopPropagation(); openScience(sec); }}>Why</button>` : null}</span>`;
}
function openScience(sec) { if (S.sheet) closeSheet(); UI.setTab('profile'); UI.setView({ type: 'science', sec }); setTimeout(() => { const el = sec && document.getElementById('sci-' + sec); if (el) el.scrollIntoView({ block: 'start' }); }, 120); }
/* [id, title, what Ironwood does, settings, limits, why, sources, rule of thumb?] */
const SCIENCE = [
  ['volume', 'Sets per muscle', 'Plan pages count weekly sets per muscle and flag a workout that gives one muscle more than about 11 sets. Progress → Numbers counts what you logged, this week and last, beside your plan, flags muscles that fell below 70% of it, and, when a muscle gets its sets but its lifts have been flat for 4+ weeks, offers 2 more sets a week (only if you tap it). Helper work counts as half a set (a bench press is half a triceps set).',
    'None; it follows your plan and your log.', 'Exercise muscle data is Ironwood’s own estimate for each lift. The 70% flag, the 4-week stall and the 2-set step are rules of thumb.',
    'More hard sets a week mean more growth, with smaller gains from each extra set, and counting helper sets as half fits the research best. Around 10 or more hard sets a week per muscle suits growth. Within one workout, extra sets for the same muscle stop showing a clear benefit at about 11, so Ironwood spreads a muscle over two or three days.', ['pelland', 'persession']],
  ['effort', 'Reps, effort and reps left', 'Rep ranges are about 6–10 on each day’s first big lifts and 10–15 on the rest. After an exercise’s last set, one tap records reps left (0 to 4+). Every 4 weeks one machine or cable lift becomes a calibration set: guess your reps left at the top of the range, then go to failure. The average gap corrects your later answers.',
    'Settings → More training settings: Ask reps left on each exercise’s last set (on by default).', 'Only the last set is asked, to keep logging quick. The calibration uses your last five checks; until then answers are taken as given.',
    'Muscle grows across a wide range of reps when sets end near failure, and growth increases the closer sets get to failure, while strength depends less on it. Lifters guess their reps left about one rep low on average, and guesses get worse farther from failure, which is why Ironwood checks them.', ['loading', 'robinson', 'halperin']],
  ['progress', 'Next weight', 'Double progression: keep the weight until every set reaches the top of the range, then add the weight jump (twice it for big lower-body lifts). Top of the range with 3 or more reps left on the last set: a double jump. In range with 3 or more to spare: same weight, aim for the top. Short of the bottom on most sets three sessions running: down about 10%.',
    'Settings → More training settings: weight jumps, smaller jumps after a miss, the 10% step down; per exercise from its ⋯ menu.', 'The 3-to-spare and 10% rules and the jump sizes are Ironwood’s rules of thumb, not tested directly; they follow from the effort research above.',
    'Adding load when you outgrow a rep range keeps sets hard, which the effort research says drives growth. There are no scheduled deloads; the step down happens only when you stall.', ['robinson', 'halperin'], true],
  ['rest', 'Rest timer and supersets', 'Main lifts rest 2–3 minutes, smaller lifts 60–90 seconds, as each plan sets. In a superset the time spent on the other exercise counts toward each exercise’s rest, so after a set the timer shows only what’s left for the next one.',
    'Settings → More training settings: default rest, start the timer when a set is logged, superset rest after each exercise or the full round; per exercise from its ⋯ menu.', 'The exact seconds are not pinned down by research; past about 90 seconds the benefit is unclear.',
    'Rest longer than 60 seconds gives a small growth benefit, unclear past 90 seconds. Three minutes beat one minute in trained men. Rest matters mostly because too little costs reps on the next set; counting superset time keeps the rest without the wait.', ['singer', 'rest3']],
  ['drops', 'Drop sets', 'Sapwood and the drop-set plans put one drop on the last set of machine, cable and dumbbell lifts, about 20% lighter, set up when the workout starts. Never on squats, rows or barbell presses.',
    'Add or remove a drop from a set’s number; plans decide where they start.', 'One drop, last set only: more drops add fatigue faster than growth (Ironwood’s reading of the research below).',
    'Drop sets grow muscle about as well as normal sets and take less time, so they are a time saver, not a growth booster.', ['sodal']],
  ['exercises', 'Exercise choice, order and speed', 'Swaps keep the same movement and muscles and nudge up exercises that train the muscle stretched. Sapwood pairs leg extensions with squats and leg press. Order is yours to change; there are no tempo targets.',
    'Swap from any exercise’s ⋯ menu; Reorder or remove from the workout.', 'The stretched-position evidence is early, so it only nudges the ranking.',
    'Training at long muscle lengths may grow muscle more. Leg extensions grow the middle quad (rectus femoris) more than squats, which grow the outer quad more. Exercise order changes strength on the first lifts but not growth. Reps lasting 0.5 to 8 seconds grow muscle about the same.', ['wolf', 'quads', 'order', 'tempo']],
  ['busy', 'Busy week', 'One tap under Up next: until Monday, each exercise uses about a third of its sets (at least one) at your usual weights, with no drop sets.',
    'Turn it on or off from Train.', 'It keeps what you have; it doesn’t build. Use it for a week or a few, not as a plan.',
    'Size and strength held for up to 32 weeks on as little as one session a week and one set per exercise when the weight stayed heavy; a third of the usual volume kept gains in younger adults.', ['spiering', 'bickel']],
  ['running', 'Running with lifting', 'The running plan warns about hard runs right after or on leg day, offers cycling and other swaps, and on days with both suggests lifting first.',
    'Train → Run: your run days and lift days.', 'The interference effect is small; the warning is about how your legs feel as much as growth.',
    'Combining aerobic and strength training doesn’t compromise muscle growth or maximal strength overall; explosive strength may suffer, and running may slightly blunt fiber growth more than cycling. In one session, lifting before endurance gave better lower-body strength with no difference in growth. The day-after-Legs strain warning is Ironwood’s rule of thumb.', ['schumann', 'lundberg', 'concorder'], true],
  ['warmup', 'Warm-up sets', 'Before the first big lift: about 40%, 60% and 80% of your working weight for 10, 5 and 3 reps, shown as a line and not logged.',
    'Settings → More training settings: Show warm-up sets.', 'Not used for anything else in the app.', 'A common coaching practice to rehearse the lift and get ready for heavy sets; Ironwood has no study for the exact percentages.', [], true],
  ['photos', 'Progress photo reminders', 'Optional reminders to take progress photos: a pop-up when a workout starts, a card on the workout summary, or a pop-up on a day and time you pick. Before and after can ask every workout or only the first of the week.',
    'Progress → Photos → Photo reminders.', 'A web app can’t pop up while it’s closed, so the day-and-time reminder shows when Ironwood is open; Add to phone calendar saves a repeating event with an alert for when it isn’t. Photos stay on the phone.',
    'Photos show changes the scale and tape miss; taking them the same way each time is what makes them comparable. The timing options are Ironwood’s choice, not from a study.', [], true],
  ['protein', 'Protein', 'Meal targets worked out from your height and weight aim for about 1.6 g of protein per kg (1.8 when losing or gaining); Body goal aims a little higher, about 1.8–2.2 g/kg, most on a cut. The Log shows about 0.4 g per kg at each of 3–4 meals and what today’s meals had; the workout summary shows protein so far.',
    'Meals → Log → Change goals, or work them out from your height, weight and goal.', 'Estimates for planning, not medical advice. With a high BMI the target uses a leaner weight.',
    'Extra protein stopped adding gains from training beyond about 1.6 g/kg a day; Ironwood rounds up for a margin. About 0.4 g/kg per meal over at least four meals reaches that. On a cut, needs are higher (2.3–3.1 g per kg of lean mass).', ['morton', 'permeal', 'helms']],
  ['weight', 'Weight change and calories', 'Body goal paces: a lean bulk of ¼–½ lb a week, a cut of ½–¾% of your weight a week, and warnings when your weight moves faster or not at all. Calories start from the Mifflin-St Jeor estimate and your activity, with a floor; no calorie targets under 18.',
    'Progress → Body goal: goal, pace, target.', 'Formulas are estimates; your weight trend over 2–3 weeks is the real check. Not medical advice.',
    'For lean gains, about 0.25–0.5% of body weight a week (a 10–20% surplus) is recommended; on a cut, about 0.5–1% a week keeps the most muscle. Ironwood’s bulk pace is a little more conservative.', ['iraki', 'helms']],
];
function ScienceView({ sec }) {
  useEffect(() => { if (sec) setTimeout(() => { const el = document.getElementById('sci-' + sec); if (el) el.scrollIntoView({ block: 'start' }); }, 60); }, [sec]);
  return html`<div id="science">
    <h2 class="wo-title" style="margin:6px 0 4px">How Ironwood works</h2>
    <p class="note">What each feature does, the settings and limits, why, and the studies behind it. Where a choice is Ironwood’s own rule of thumb, it says so. Ironwood is for planning and is not medical advice.</p>
    <div class="plan-chips" role="navigation" aria-label="Sections" style="margin:10px 0">${SCIENCE.map(([id, t]) => html`<button key=${id} class="chip" onClick=${() => { const el = document.getElementById('sci-' + id); if (el) el.scrollIntoView({ block: 'start' }); }}>${t}</button>`)}</div>
    ${SCIENCE.map(([id, t, does, set, lim, why, src, rule]) => html`<section key=${id} id=${'sci-' + id} style="scroll-margin-top:70px">
      <div class="section-h"><h2>${t}</h2></div>
      <div class="card"><p class="small"><b>What it does.</b> ${does}</p><p class="small" style="margin-top:6px"><b>Settings.</b> ${set}</p><p class="small" style="margin-top:6px"><b>Limits.</b> ${lim}</p>
        <p class="small" style="margin-top:6px"><b>Why.</b> ${why}</p>
        ${src.length || rule ? html`<ul class="run-ul" style="margin-top:6px">${rule ? html`<li class="small">Ironwood’s rule of thumb where noted above.</li>` : null}${src.map(k => html`<li key=${k} class="small"><a href=${SRC[k][2]} target="_blank" rel="noopener">${SRC[k][0]}</a>: ${SRC[k][1]}</li>`)}</ul>` : null}</div></section>`)}
  </div>`;
}
