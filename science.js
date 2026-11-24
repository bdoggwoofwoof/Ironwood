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
/* [id, title, what Ironwood does, where to change it, good to know, why, sources, rule of thumb?]
   Nov 24 (Newt): rewritten to be clearer and more direct: short sentences, plain words, examples. */
const SCIENCE = [
  ['volume', 'Sets per muscle', 'Ironwood counts how many hard sets each muscle gets a week. A plan page shows the count. Progress → Numbers compares what you logged with your plan and points out a muscle that got less than 70% of it. If a muscle gets its sets but its lifts haven’t gone up in 4 weeks, it offers 2 more sets a week. Nothing changes unless you tap it. A lift that only helps a muscle counts as half a set: a bench press is half a triceps set. If one workout gives a muscle more than about 11 sets, the plan page says so.',
    'Nothing to set. It follows your plan and what you log.', 'Which muscles each lift works is Ironwood’s own estimate. The 70%, 4-week and 2-set numbers are rules of thumb.',
    'More hard sets a week means more growth, but each extra set adds a little less. About 10 or more a week per muscle is a good target. In one workout, sets past about 11 for the same muscle stop clearly helping, so it’s better to spread a muscle over 2 or 3 days.', ['pelland', 'persession']],
  ['effort', 'Reps and effort', 'Most days start with 1 or 2 big lifts at 6–10 reps. Everything else is 10–15. After an exercise’s last set, tap how many more reps you could have done (0 to 4+). Every 4 weeks, one machine or cable lift asks you to guess, then go until you can’t do another rep. The difference shows how far off your guesses run, and Ironwood corrects for it.',
    'Settings → More training settings → Ask reps left. It’s on by default.', 'It asks only after the last set, so logging stays quick. The correction uses your last 5 checks.',
    'Sets grow muscle at almost any rep count as long as they end close to failure. The closer to failure, the more growth. Most people guess they have about 1 rep fewer left than they really do, which is why Ironwood checks.', ['loading', 'robinson', 'halperin']],
  ['progress', 'Next weight', 'Each set shows a target to beat, not a copy of last time. Each lift has a rep range, like 8–12. Same weight as last time: aim for one more rep per set, up to the top of the range. When every set reaches the top, Ironwood adds weight (one jump, or two for big leg lifts; a bigger jump if you had 3 or more reps to spare). At a new weight, the target reps come from what your last sets predict you can do at it. If last time\u2019s weight was clearly wrong for the range (every set 2 or more reps under the bottom, or 3 or more over the top), it moves the weight after one workout to land inside the range. If you fall short of the range three workouts in a row, it drops about 10%. “Last” still shows exactly what you did.',
    'Settings → More training settings: how big each jump is, smaller jumps after you miss your reps, and the 10% drop. You can also change them for one exercise from its ⋯ menu.', 'The jump sizes, “3 to spare”, the 10% drop and the one-workout fix (at most 20% lighter or 25% heavier) are Ironwood’s rules of thumb. The rep prediction uses a standard one-rep-max formula (weight × (1 + reps ÷ 30), counting reps left on the last set); it’s an estimate and less accurate past about 12 reps.',
    'Small, steady targets keep each set hard, and hard sets build muscle. Adding weight once a range gets easy keeps it that way. There are no planned easy weeks; Ironwood only drops the weight when you stall.', ['robinson', 'halperin'], true],
  ['rest', 'Rest timer and supersets', 'Big lifts rest 2–3 minutes. Smaller lifts rest 60–90 seconds. Each plan sets these. In a superset, each exercise gets its own timer when you log its set, shown with its name in the bottom-left corner. The one ending first is on the left. When it ends, it beeps, shows Go, then fades, and the next one slides over.',
    'Settings → More training settings: default rest, start the timer when you log a set, and superset rest (each exercise, or after the full round). You can also change one exercise’s rest from its ⋯ menu, or tap −15 / +15 on a timer.', 'No study pins down the exact seconds. Past about 90 seconds, more rest may not help. With the phone locked, only the bottom rest bar can beep; superset timers beep while Ironwood is open.',
    'Resting more than 60 seconds helps growth a little. Three minutes beat one minute in trained lifters. The main reason is that too little rest costs you reps on the next set.', ['singer', 'rest3']],
  ['drops', 'Drop sets', 'Some plans, like Sapwood, end some lifts with a drop set: after the last set, lower the weight about 20% and keep going with no rest. Only on machines, cables and dumbbells, never squats, rows or barbell presses. The drop is ready when the workout starts.',
    'Tap a set’s number to add or remove a drop.', 'Only one drop, on the last set. More drops tire you out faster than they build muscle.',
    'Drop sets build about as much muscle as normal sets in less time. They save time; they don’t add extra growth.', ['sodal']],
  ['exercises', 'Exercise choice, order and speed', 'When you swap an exercise, Ironwood suggests ones that work the same muscles the same way, and ranks higher the ones that stretch the muscle under load. Sapwood pairs leg extensions with squats and leg press. You choose the order. There’s no set speed for reps.',
    'Swap from an exercise’s ⋯ menu. Reorder or remove from the workout.', 'The research on stretching is still early, so it only nudges the suggestions.',
    'Working a muscle while it’s stretched may build it more. Leg extensions grow the middle of the thigh; squats grow the outer thigh. Exercise order changes how strong you are on the first lifts, not how much you grow. Reps lasting anywhere from half a second to 8 seconds build about the same.', ['wolf', 'quads', 'order', 'tempo']],
  ['busy', 'Busy week', 'One tap under Up next. Until Monday, each exercise has about a third of its sets (at least one), at your usual weights, with no drop sets.',
    'Turn it on or off from Train.', 'It keeps what you’ve built; it doesn’t build more. Use it for a week or a few, not as your plan.',
    'People kept their size and strength for up to 32 weeks on one workout a week and one set per exercise, as long as the weight stayed heavy. A third of the usual sets kept gains in younger adults.', ['spiering', 'bickel']],
  ['running', 'Running and lifting', 'The running plan warns you about hard runs on or right after leg day and suggests swaps like cycling. On days with both, it suggests lifting first.',
    'Train → Run: pick your run days and lift days.', 'The effect is small. The warning is as much about tired legs as about growth.',
    'Running and lifting together doesn’t hurt muscle growth or max strength overall. It may cost a little explosiveness, and running may hurt growth slightly more than cycling. Lifting first gives better leg strength with the same growth. The day-after-leg-day warning is Ironwood’s rule of thumb.', ['schumann', 'lundberg', 'concorder'], true],
  ['warmup', 'Warm-up sets', 'Before your first big lift, Ironwood shows three warm-up sets: 10 reps at about 40% of your working weight, 5 at 60% and 3 at 80%. They aren’t logged.',
    'Settings → More training settings → Show warm-up sets.', 'Nothing else in the app uses them.', 'A common coaching habit to practice the lift and get ready for heavy sets. The exact percentages are Ironwood’s choice, not from a study.', [], true],
  ['photos', 'Progress photo reminders', 'Optional reminders to take progress photos: when a workout starts, on the workout summary, or on a day and time you pick. Before and after reminders can come every workout or once a week.',
    'Progress → Photos → Photo reminders.', 'Ironwood can only remind you while it’s open. Add to phone calendar saves a repeating alert for the rest of the time. Photos stay on your phone.',
    'Photos show changes the scale and tape miss. Taking them the same way each time is what makes them easy to compare. The reminder timing is Ironwood’s choice.', [], true],
  ['protein', 'Protein', 'Meal targets aim for about 1.6 g of protein per kg of body weight a day (1.8 when losing or gaining). Body goal aims a little higher, 1.8–2.2 g per kg, most on a cut. The Log shows about 0.4 g per kg at each of 3–4 meals, and the workout summary shows today’s protein so far.',
    'Meals → Log → Change goals, or let Ironwood work them out from your height, weight and goal.', 'These are planning estimates, not medical advice. With a high BMI, the target uses a lower weight.',
    'Past about 1.6 g per kg a day, more protein stopped adding gains in studies; Ironwood rounds up to be safe. About 0.4 g per kg at 4 meals gets you there. On a cut you need more.', ['morton', 'permeal', 'helms']],
  ['weight', 'Weight change and calories', 'Body goal sets your pace: a lean bulk gains ¼–½ lb a week, and a cut loses ½–¾% of your weight a week. It warns you when your weight moves faster than that or not at all. Calories start from a standard formula and how active you are, with a minimum. No calorie targets for anyone under 18.',
    'Progress → Body goal: goal, pace and target.', 'Formulas are estimates. Your weight over 2–3 weeks is the real test. Not medical advice.',
    'For lean gains, experts suggest gaining 0.25–0.5% of your weight a week. On a cut, losing 0.5–1% a week keeps the most muscle. Ironwood’s bulk pace is a little slower to keep fat gain down.', ['iraki', 'helms']],
];
function ScienceView({ sec }) {
  useEffect(() => { if (sec) setTimeout(() => { const el = document.getElementById('sci-' + sec); if (el) el.scrollIntoView({ block: 'start' }); }, 60); }, [sec]);
  return html`<div id="science">
    <h2 class="wo-title" style="margin:6px 0 4px">How Ironwood works</h2>
    <p class="note">What each feature does, where to change it, and why, with the studies behind it. When a number is Ironwood’s own choice, it says so. For planning, not medical advice.</p>
    <div class="plan-chips" role="navigation" aria-label="Sections" style="margin:10px 0">${SCIENCE.map(([id, t]) => html`<button key=${id} class="chip" onClick=${() => { const el = document.getElementById('sci-' + id); if (el) el.scrollIntoView({ block: 'start' }); }}>${t}</button>`)}</div>
    ${SCIENCE.map(([id, t, does, set, lim, why, src, rule]) => html`<section key=${id} id=${'sci-' + id} style="scroll-margin-top:70px">
      <div class="section-h"><h2>${t}</h2></div>
      <div class="card"><p class="small"><b>What it does</b></p><p class="small">${does}</p>
        <p class="small" style="margin-top:10px"><b>Why</b></p><p class="small">${why}</p>
        <p class="small" style="margin-top:10px"><b>Good to know</b></p><p class="small">${lim}</p>
        <p class="small" style="margin-top:10px"><b>Where to change it</b></p><p class="small">${set}</p>
        ${src.length ? html`<p class="small" style="margin-top:10px"><b>Studies</b></p><ul class="run-ul">${src.map(k => html`<li key=${k} class="small"><a href=${SRC[k][2]} target="_blank" rel="noopener">${SRC[k][0]}</a>: ${SRC[k][1]}</li>`)}</ul>` : rule ? html`<p class="small faint" style="margin-top:10px">No study behind this one; it’s Ironwood’s rule of thumb.</p>` : null}</div></section>`)}
  </div>`;
}
