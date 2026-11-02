/* ============ Goal plans: a short interview builds a plan around your goal, time, gear and joints (Nov 2) ============ */
/* Six built-in plans (Recomp 3-day, Recomp upper/lower 4-day, Lean bulk 4-day, Cut 3-day, Strength 3-day, Hybrid athlete
   3+2). The interview (Train → Build my plan, the Get started card, or the meal plan setup) asks your goal (recomp,
   size, strength, fat loss, speed, or a sport), whether to keep your current program, days and minutes, lifting gear,
   cardio gear, joints to go easy on, and an optional winter bulk → spring cut. It then either:
     - keeps your program and adjusts around it (adds conditioning that fits your sport and gear on free days), or
     - makes your own copy of the best-fitting plan ('gp-mine'): swaps for your gear and joints, trims to your minutes,
       sets per phase (bulk +1 accessory set, cut -1), and conditioning days built from the gear you have.
   Season phases (settings.goal.season) ask before switching: calories and the plan change only when you say so.
   Everything is an estimate for planning, not coaching or medical advice. */
const GP_TPL = [
  { id: 'gp-recomp3', name: 'Recomp 3-Day', days: 3, goal: ['recomp'], fit: 'Lose fat and build muscle at the same time on three full-body days.',
    why: 'Three full-body days hit each muscle often enough to grow while eating near maintenance.', t: [
      ['Full Body A', ['Full Body'], [['Back Squat', 3, '6–8', '', 'm'], ['Bench Press', 3, '6–8', '', 'm'], ['Seated Cable Row', 3, '10', '', 'a'], ['Romanian Deadlift', 3, '8–10', '', 'a'], ['Lateral Raises', 3, '12–15', '', 'a'], ['Plank', 3, '30 s', '', 'a']]],
      ['Full Body B', ['Full Body'], [['Deadlift', 3, '5', '', 'm'], ['Overhead Barbell Press', 3, '6–8', '', 'm'], ['Lat Pulldown', 3, '10', '', 'a'], ['Bulgarian Split Squat', 3, '10', 'Each leg.', 'a'], ['Incline Dumbbell Press', 3, '10', '', 'a'], ['Hanging Leg Raises', 3, '10', '', 'a']]],
      ['Full Body C', ['Full Body'], [['Front Squat', 3, '8', '', 'm'], ['Incline Barbell Bench Press', 3, '8', '', 'm'], ['Barbell Row', 3, '8', '', 'a'], ['Lying Leg Curl', 3, '12', '', 'a'], ['Face Pulls', 3, '15', '', 'a'], ['Hammer Curls', 3, '12', '', 'a']]]] },
  { id: 'gp-recomp4', name: 'Recomp Upper/Lower 4-Day', days: 4, goal: ['recomp'], fit: 'Recomp on four days: two upper, two lower.',
    why: 'Upper/lower gives each muscle two hard sessions a week with shorter workouts.', t: [
      ['Upper A', ['Upper'], [['Bench Press', 3, '6–8', '', 'm'], ['Barbell Row', 3, '8', '', 'm'], ['Seated Dumbbell Overhead Press', 3, '10', '', 'a'], ['Lat Pulldown', 3, '10', '', 'a'], ['Lateral Raises', 3, '15', '', 'a'], ['Tricep Pushdowns', 2, '12', '', 'a'], ['Dumbbell Curl', 2, '12', '', 'a']]],
      ['Lower A', ['Legs'], [['Back Squat', 3, '6–8', '', 'm'], ['Romanian Deadlift', 3, '8', '', 'm'], ['Leg Press', 3, '12', '', 'a'], ['Lying Leg Curl', 3, '12', '', 'a'], ['Calf Raises', 3, '15', '', 'a'], ['Dead Bug', 3, '10', 'Each side.', 'a']]],
      ['Upper B', ['Upper'], [['Overhead Barbell Press', 3, '6–8', '', 'm'], ['Pull-Up', 3, '6–10', '', 'm'], ['Incline Dumbbell Press', 3, '10', '', 'a'], ['Seated Cable Row', 3, '12', '', 'a'], ['Face Pulls', 3, '15', '', 'a'], ['Hammer Curls', 2, '12', '', 'a'], ['Skull Crushers', 2, '12', '', 'a']]],
      ['Lower B', ['Legs'], [['Deadlift', 3, '5', '', 'm'], ['Bulgarian Split Squat', 3, '10', 'Each leg.', 'm'], ['Leg Extension', 3, '12', '', 'a'], ['Dumbbell Hip Thrust', 3, '12', '', 'a'], ['Calf Raises', 3, '15', '', 'a'], ['Hanging Leg Raises', 3, '10', '', 'a']]]] },
  { id: 'gp-bulk4', name: 'Lean Bulk 4-Day', days: 4, goal: ['mass'], fit: 'Get bigger with a small calorie surplus and more training volume.',
    why: 'More sets in the 8–12 range and a small surplus (about ½ lb a week) build size with little fat.', t: [
      ['Upper (chest and back)', ['Upper'], [['Bench Press', 4, '8', '', 'm'], ['Barbell Row', 4, '8', '', 'm'], ['Incline Dumbbell Press', 3, '10', '', 'a'], ['Lat Pulldown', 3, '10', '', 'a'], ['Cable Fly', 3, '12', '', 'a'], ['Dumbbell Curl', 3, '12', '', 'a'], ['Tricep Pushdowns', 3, '12', '', 'a']]],
      ['Lower (squat)', ['Legs'], [['Back Squat', 4, '8', '', 'm'], ['Romanian Deadlift', 3, '10', '', 'm'], ['Leg Press', 3, '12', '', 'a'], ['Lying Leg Curl', 3, '12', '', 'a'], ['Calf Raises', 4, '12', '', 'a'], ['Hanging Leg Raises', 3, '12', '', 'a']]],
      ['Upper (shoulders and arms)', ['Upper'], [['Overhead Barbell Press', 4, '8', '', 'm'], ['Pull-Up', 4, '8', '', 'm'], ['Dumbbell Bench Press', 3, '10', '', 'a'], ['Seated Cable Row', 3, '12', '', 'a'], ['Lateral Raises', 4, '15', '', 'a'], ['Hammer Curls', 3, '12', '', 'a'], ['Skull Crushers', 3, '12', '', 'a']]],
      ['Lower (hinge)', ['Legs'], [['Deadlift', 3, '6', '', 'm'], ['Front Squat', 3, '8', '', 'm'], ['Bulgarian Split Squat', 3, '10', 'Each leg.', 'a'], ['Leg Extension', 3, '15', '', 'a'], ['Dumbbell Hip Thrust', 3, '12', '', 'a'], ['Calf Raises', 3, '15', '', 'a']]]] },
  { id: 'gp-cut3', name: 'Cut 3-Day', days: 3, goal: ['lose'], fit: 'Lose fat and keep your muscle and strength on three days.',
    why: 'Heavy main lifts tell your body to keep muscle; fewer accessory sets suit eating less. Short walks finish each day.', t: [
      ['Full Body A', ['Full Body'], [['Back Squat', 3, '5', 'Keep the weight heavy; drop a set if tired.', 'm'], ['Bench Press', 3, '5', '', 'm'], ['Seated Cable Row', 3, '10', '', 'a'], ['Lateral Raises', 2, '15', '', 'a'], ['Incline Walk', 1, '', '10–15 minutes, easy.', 'a']]],
      ['Full Body B', ['Full Body'], [['Deadlift', 3, '5', '', 'm'], ['Overhead Barbell Press', 3, '6', '', 'm'], ['Lat Pulldown', 3, '10', '', 'a'], ['Dumbbell Hip Thrust', 2, '12', '', 'a'], ['Incline Walk', 1, '', '10–15 minutes, easy.', 'a']]],
      ['Full Body C', ['Full Body'], [['Front Squat', 3, '6', '', 'm'], ['Incline Barbell Bench Press', 3, '6', '', 'm'], ['Barbell Row', 3, '8', '', 'a'], ['Face Pulls', 2, '15', '', 'a'], ['Incline Walk', 1, '', '10–15 minutes, easy.', 'a']]]] },
  { id: 'gp-strength3', name: 'Strength 3-Day', days: 3, goal: ['strength'], fit: 'Move more weight on the big lifts.',
    why: 'Low reps on squat, bench, deadlift and press, with a few helper lifts, add weight to the bar fastest.', t: [
      ['Squat and bench', ['Full Body'], [['Back Squat', 5, '5', 'Add a little weight each week while every rep is clean.', 'm'], ['Bench Press', 5, '5', '', 'm'], ['Barbell Row', 3, '8', '', 'a'], ['Plank', 3, '30 s', '', 'a']]],
      ['Deadlift and press', ['Full Body'], [['Deadlift', 3, '3', '', 'm'], ['Overhead Barbell Press', 5, '5', '', 'm'], ['Pull-Up', 3, '6–8', '', 'a'], ['Bulgarian Split Squat', 3, '8', 'Each leg.', 'a'], ['Farmer\'s Carry', 3, '', '30–40 m, heavy.', 'a']]],
      ['Squat and volume', ['Full Body'], [['Back Squat', 3, '3', 'Heavier than day 1.', 'm'], ['Incline Barbell Bench Press', 4, '6', '', 'm'], ['Romanian Deadlift', 3, '8', '', 'a'], ['Face Pulls', 3, '15', '', 'a'], ['Hanging Leg Raises', 3, '10', '', 'a']]]] },
  { id: 'gp-hybrid', name: 'Hybrid Athlete 3+2', days: 5, goal: ['speed', 'sport'], fit: 'Strong and fit: three lifting days and two conditioning days.',
    why: 'Lifting keeps you strong; one interval day and one steady day build speed and an engine, using the gear you have.', t: [
      ['Strength A', ['Full Body'], [['Back Squat', 3, '5', '', 'm'], ['Bench Press', 3, '5', '', 'm'], ['Pull-Up', 3, '6–10', '', 'a'], ['Kettlebell Swing', 3, '15', '', 'a'], ['Plank', 3, '30 s', '', 'a']]],
      ['Strength B', ['Full Body'], [['Deadlift', 3, '4', '', 'm'], ['Overhead Barbell Press', 3, '6', '', 'm'], ['Dumbbell Row', 3, '10', 'Each side.', 'a'], ['Dumbbell Step-Up', 3, '10', 'Each leg.', 'a'], ['Side Plank', 3, '30 s', 'Each side.', 'a']]],
      ['Strength C (power)', ['Full Body'], [['Broad Jump', 4, '3', 'Full rest between jumps.', 'm'], ['Front Squat', 3, '6', '', 'm'], ['Incline Dumbbell Press', 3, '10', '', 'a'], ['Seated Cable Row', 3, '10', '', 'a'], ['Farmer\'s Carry', 3, '', '30–40 m.', 'a']]],
      ['COND-HARD'], ['COND-EASY']] },
];
const GP_GOALS = [['recomp', 'Lose fat and build muscle'], ['mass', 'Get bigger'], ['strength', 'Lift more weight'], ['lose', 'Lose fat'], ['speed', 'Get faster and fitter'], ['sport', 'Get better at a sport']];
const GP_SPORTS = [['box', 'Boxing / MMA'], ['swim', 'Swimming'], ['row', 'Rowing'], ['run', 'Running'], ['bike', 'Cycling'], ['other', 'Another sport']];
const GP_GEAR = [['gym', 'Full gym'], ['db', 'Dumbbells'], ['bw', 'Bodyweight only']];
const GP_CARDIO = [['row', 'Rower'], ['pool', 'Pool'], ['bike', 'Bike'], ['airbike', 'Assault bike'], ['road', 'Treadmill or road'], ['track', 'Track'], ['hills', 'Hills'], ['sled', 'Sled'], ['rope', 'Jump rope'], ['bag', 'Heavy bag']];
const GP_JOINTS = [['knees', 'Knees'], ['back', 'Lower back'], ['shoulders', 'Shoulders'], ['wrists', 'Wrists'], ['hips', 'Hips']];
const GP_SWAP = {
  db: { 'Back Squat': 'Goblet Squat', 'Front Squat': 'Goblet Squat', 'Bench Press': 'Dumbbell Bench Press', 'Incline Barbell Bench Press': 'Incline Dumbbell Press', 'Deadlift': 'Dumbbell Romanian Deadlift', 'Romanian Deadlift': 'Dumbbell Romanian Deadlift', 'Barbell Row': 'Dumbbell Row', 'Overhead Barbell Press': 'Seated Dumbbell Overhead Press', 'Lat Pulldown': 'Pull-Up', 'Seated Cable Row': 'Dumbbell Row', 'Leg Press': 'Bulgarian Split Squat', 'Lying Leg Curl': 'Slider Hamstring Curl', 'Leg Extension': 'Dumbbell Step-Up', 'Face Pulls': 'Dumbbell Rear Delt Fly', 'Tricep Pushdowns': 'Dumbbell Overhead Tricep Extension', 'Cable Fly': 'Push-Ups', 'Skull Crushers': 'Dumbbell Overhead Tricep Extension', 'Kettlebell Swing': 'Dumbbell Romanian Deadlift' },
  bw: { 'Back Squat': 'Air Squat', 'Front Squat': 'Bodyweight Bulgarian Split Squat', 'Goblet Squat': 'Air Squat', 'Bench Press': 'Push-Ups', 'Dumbbell Bench Press': 'Push-Ups', 'Incline Barbell Bench Press': 'Push-Ups', 'Incline Dumbbell Press': 'Push-Ups', 'Deadlift': 'Single-Leg Glute Bridge', 'Romanian Deadlift': 'Single-Leg Glute Bridge', 'Dumbbell Romanian Deadlift': 'Single-Leg Glute Bridge', 'Barbell Row': 'Pull-Up', 'Dumbbell Row': 'Pull-Up', 'Seated Cable Row': 'Pull-Up', 'Lat Pulldown': 'Pull-Up', 'Overhead Barbell Press': 'Push-Ups', 'Seated Dumbbell Overhead Press': 'Push-Ups', 'Leg Press': 'Bodyweight Bulgarian Split Squat', 'Bulgarian Split Squat': 'Bodyweight Bulgarian Split Squat', 'Lying Leg Curl': 'Slider Hamstring Curl', 'Leg Extension': 'Wall Sit', 'Dumbbell Hip Thrust': 'Glute Bridge', 'Lateral Raises': 'Scapular Push-Up', 'Face Pulls': 'Prone Y-T-W Raise', 'Dumbbell Rear Delt Fly': 'Prone Y-T-W Raise', 'Cable Fly': 'Push-Ups', 'Tricep Pushdowns': 'Dips', 'Skull Crushers': 'Dips', 'Dumbbell Overhead Tricep Extension': 'Dips', 'Dumbbell Curl': 'Pull-Up', 'Hammer Curls': 'Pull-Up', 'Kettlebell Swing': 'Burpee Broad Jumps', 'Farmer\'s Carry': 'Bear Crawl', 'Dumbbell Step-Up': 'Bodyweight Bulgarian Split Squat', 'Calf Raises': 'Calf Raises', 'Incline Walk': 'Incline Walk' },
};
const GP_JOINT = {
  knees: { 'Back Squat': 'Leg Press', 'Front Squat': 'Dumbbell Hip Thrust', 'Bulgarian Split Squat': 'Dumbbell Step-Up', 'Leg Extension': 'Terminal Knee Extension', 'Broad Jump': 'Kettlebell Swing', 'Air Squat': 'Glute Bridge', 'Bodyweight Bulgarian Split Squat': 'Glute Bridge' },
  back: { 'Deadlift': 'Dumbbell Hip Thrust', 'Romanian Deadlift': 'Lying Leg Curl', 'Barbell Row': 'Seated Cable Row', 'Back Squat': 'Leg Press', 'Overhead Barbell Press': 'Seated Dumbbell Overhead Press', 'Kettlebell Swing': 'Glute Bridge' },
  shoulders: { 'Overhead Barbell Press': 'Incline Dumbbell Press', 'Seated Dumbbell Overhead Press': 'Lateral Raises', 'Bench Press': 'Dumbbell Bench Press', 'Incline Barbell Bench Press': 'Incline Dumbbell Press', 'Skull Crushers': 'Tricep Pushdowns', 'Pull-Up': 'Lat Pulldown', 'Dips': 'Tricep Pushdowns' },
  wrists: { 'Front Squat': 'Goblet Squat', 'Barbell Curl': 'Hammer Curls', 'Dumbbell Curl': 'Hammer Curls', 'Skull Crushers': 'Tricep Pushdowns', 'Push-Ups': 'Machine Chest Press' },
  hips: { 'Bulgarian Split Squat': 'Leg Press', 'Deadlift': 'Romanian Deadlift', 'Broad Jump': 'Kettlebell Swing' },
};
/* Conditioning by mode: [hard day items, easy day items] */
const GP_COND = {
  row: [[['Rowing Machine (Erg)', 6, '', '500 m hard, 2 minutes easy between.']], [['Rowing Machine (Erg)', 1, '', '20–30 minutes steady; you can still talk.']]],
  swim: [[['Swim', 8, '', '50 m hard, 30 seconds rest.']], [['Swim', 1, '', '20–30 minutes easy, any stroke.']]],
  run: [[['Run 400m', 6, '', 'Hard but even; 90 seconds walking between.'], ['Strides', 4, '', '20 seconds quick and relaxed.']], [['Easy Run', 1, '', '25–35 minutes; you can still talk.']]],
  track: [[['Run 200m', 8, '', 'Fast, full walk back between.'], ['Accelerations', 4, '', '']], [['Easy Run', 1, '', '25–35 minutes; you can still talk.']]],
  hills: [[['Hill Sprints', 8, '', '10–15 seconds up, walk down.']], [['Easy Run', 1, '', '25–35 minutes; you can still talk.']]],
  bike: [[['Bike Sprints', 8, '', '20 seconds hard, 100 seconds easy.']], [['Bike', 1, '', '30–45 minutes steady.']]],
  airbike: [[['Bike Sprints', 10, '', '15 seconds all-out, 45 seconds easy.']], [['Bike', 1, '', '25–30 minutes steady.']]],
  box: [[['Heavy Bag Rounds', 6, '', '2 minutes hard, 1 minute rest.'], ['Jump Rope', 3, '', '2 minutes.']], [['Shadowboxing Rounds', 6, '', '3 minute rounds, easy pace, sharp technique.'], ['Easy Run', 1, '', '20 minutes easy.']]],
  sled: [[['Sled Push', 8, '', '20 m hard, walk back.']], [['Incline Walk', 1, '', '30 minutes.']]],
  rope: [[['Jump Rope', 10, '', '30 seconds fast, 30 seconds easy.']], [['Incline Walk', 1, '', '30 minutes.']]],
  walk: [[['Incline Walk', 1, '', '20 minutes with 6 harder 1-minute pushes.']], [['Incline Walk', 1, '', '30–40 minutes easy.']]],
};
/* Which conditioning fits: your sport first, then the gear you have, easy on the knees if asked. */
function condMode(a) {
  const c = a.cardio || []; const knees = (a.joints || []).includes('knees');
  const sport = { box: 'box', swim: 'swim', row: 'row', run: 'run', bike: 'bike' }[a.goal === 'sport' ? a.sport : ''];
  if (sport && (sport === 'box' || sport === 'run' || c.includes(sport === 'swim' ? 'pool' : sport))) return knees && sport === 'run' ? 'bike' : sport;
  if (a.goal === 'speed' && !knees) { if (c.includes('track')) return 'track'; if (c.includes('hills')) return 'hills'; }
  for (const [k, m] of [['row', 'row'], ['airbike', 'airbike'], ['bike', 'bike'], ['pool', 'swim'], ['road', knees ? 'walk' : 'run'], ['track', knees ? 'walk' : 'track'], ['sled', 'sled'], ['rope', knees ? 'walk' : 'rope'], ['bag', 'box']]) if (c.includes(k)) return m;
  return knees ? 'walk' : 'run';
}
const CMODE_NAME = { row: 'rowing', swim: 'swimming', run: 'running', track: 'track running', hills: 'hill sprints', bike: 'cycling', airbike: 'the assault bike', box: 'bag work', sled: 'the sled', rope: 'jump rope', walk: 'incline walking' };
const phaseByDate = s => { const t = ymd(new Date()); return t >= s.cutTo ? 'keep' : t >= s.cutFrom ? 'cut' : t >= s.bulkFrom ? 'bulk' : 'keep'; };
const gpPhaseNow = a => (a.season && a.season.on ? (a.season.cur || phaseByDate(a.season)) : null);
/* Which built-in plan fits the answers */
function pickPlanFor(a) {
  const days = +a.days || 3; const ph = gpPhaseNow(a);
  if (ph === 'cut') return 'gp-cut3';
  if (ph === 'bulk') return days >= 4 ? 'gp-bulk4' : 'gp-recomp3';
  if (a.goal === 'strength') return 'gp-strength3';
  if (a.goal === 'lose') return 'gp-cut3';
  if (a.goal === 'mass') return days >= 4 ? 'gp-bulk4' : 'gp-recomp3';
  if (a.goal === 'speed' || a.goal === 'sport') return days >= 4 ? 'gp-hybrid' : 'gp-recomp3';
  return days >= 4 ? 'gp-recomp4' : 'gp-recomp3';
}
const GP_MAX_ITEMS = { 30: 4, 45: 5, 60: 6, 75: 9 };
/* Adjust one day's raw items for gear, joints, minutes and phase. Returns { items, swaps } */
function adaptItems(items, a) {
  const swaps = []; const out = [];
  for (const [n0, s0, r, cue, role] of items) {
    let n = n0;
    for (const j of a.joints || []) { const to = (GP_JOINT[j] || {})[n]; if (to) { swaps.push([n, to, j]); n = to; } }
    const g = GP_SWAP[a.gear]; if (g && g[n] && g[n] !== n) { n = g[n]; for (const j of a.joints || []) { const to = (GP_JOINT[j] || {})[n]; if (to) n = to; } }
    if (out.some(x => x[0] === n)) continue;
    let s = s0; const ph = gpPhaseNow(a) || (a.goal === 'mass' ? 'bulk' : a.goal === 'lose' ? 'cut' : null);
    if (role === 'a' && s > 1) s = ph === 'bulk' ? Math.min(4, s + 1) : ph === 'cut' ? Math.max(2, s - 1) : s;
    out.push([n, s, r, cue, role]);
  }
  const cap = GP_MAX_ITEMS[a.mins] || 6; const kept = out.slice(0, cap);
  if (+a.mins >= 75) kept.forEach(x => { if (x[4] === 'm') x[1] = Math.min(6, x[1] + 1); });
  return { items: kept, swaps };
}
/* Your own copy of the plan */
function buildGoalPlan(a) {
  const T = GP_TPL.find(t => t.id === pickPlanFor(a)); const mode = condMode(a); const allSwaps = [];
  const daysRaw = T.t.map(d => {
    if (d[0] === 'COND-HARD' || d[0] === 'COND-EASY') { const hard = d[0] === 'COND-HARD'; const its = GP_COND[mode][hard ? 0 : 1].map(x => [...x, 'c']);
      return [(hard ? 'Conditioning: intervals' : 'Conditioning: steady') + ' (' + CMODE_NAME[mode] + ')', ['Conditioning'], its.concat(hard ? [] : [['Dead Bug', 2, '10', 'Each side.', 'a']])]; }
    const { items, swaps } = adaptItems(d[2], a); allSwaps.push(...swaps); return [d[0], d[1], items];
  });
  /* Wanted conditioning but the plan has none, and there's a free day: add one */
  const wantsCond = a.goal === 'speed' || a.goal === 'sport' || a.goal === 'lose' || gpPhaseNow(a) === 'cut';
  if (wantsCond && T.id !== 'gp-hybrid' && (+a.days || 3) > daysRaw.length) daysRaw.push(['Conditioning (' + CMODE_NAME[mode] + ')', ['Conditioning'], GP_COND[mode][a.goal === 'lose' || gpPhaseNow(a) === 'cut' ? 1 : 0].map(x => [...x, 'c'])]);
  const days = daysRaw.map(([dn, tags, its], i) => planDay('gp-mine', i + 1, dn, tags, its.map(([n, s, r, cue]) => [n, s, r, cue])));
  const uniq = []; for (const s of allSwaps) if (!uniq.some(u => u[0] === s[0] && u[1] === s[1])) uniq.push(s);
  const jn = Object.fromEntries(GP_JOINTS);
  return { id: 'gp-mine', name: 'My ' + T.name, source: 'mine', createdAt: Date.now(), days, base: T.id, mode,
    note: T.why + (uniq.length ? ' Joint care: ' + uniq.map(([f, t, j]) => t + ' instead of ' + f + ' (' + jn[j].toLowerCase() + ')').join(', ') + '.' : '') };
}
/* Keep your program: what to add around it */
function keepPlanFor(a) {
  const pid = programId(); const r = getRoutine(pid); const used = r ? r.days.length : 0; const free = Math.max(0, (+a.days || 3) - used);
  const mode = condMode(a); const ph = gpPhaseNow(a) || (a.goal === 'mass' ? 'bulk' : a.goal === 'lose' ? 'cut' : null);
  let addon = null;
  if (a.goal === 'sport' && a.sport === 'box') addon = 'bi-cond-fight';
  else if (a.goal === 'speed' || a.goal === 'sport') addon = 'bi-cond-2010';
  else if (a.goal === 'lose' || ph === 'cut') addon = 'bi-cond-aerobic';
  const tips = [];
  if (ph === 'bulk') tips.push('While bulking: add one set to your accessory lifts (not the heavy ones).');
  if (ph === 'cut') tips.push('While cutting: keep the heavy lifts heavy and drop one set from accessory lifts.');
  if ((a.joints || []).length) tips.push('For your ' + a.joints.map(j => Object.fromEntries(GP_JOINTS)[j].toLowerCase()).join(' and ') + ': swap any lift that hurts for an easier version (tap Swap on the exercise during a workout).');
  return { pid, r, free, mode, addon: free > 0 ? addon : null, tips };
}
function applyGoal(a, d) {
  const prevProg = programId();
  if (a.season && a.season.on && !a.season.cur) a = { ...a, season: { ...a.season, cur: phaseByDate(a.season) } };
  commit(st => { st.meta.settings.goal = { ...a, at: Date.now() }; }, 'meta');
  if (a.keep && prevProg && prevProg !== 'self') {
    const k = keepPlanFor(a);
    if (k.addon && !(S.meta.settings.addons || []).includes(k.addon)) { setAddon(k.addon, true); if (typeof openSheet === 'function') setTimeout(() => openSheet({ type: 'addonFit', id: k.addon }), 50); }
    showToast({ kind: 'info', ms: 7000, text: 'Kept ' + (k.r ? k.r.name : 'your program') + (k.addon ? ', with ' + getRoutine(k.addon).name + ' alongside' : '') + '.' });
    return;
  }
  const r = d || buildGoalPlan(a);
  commit(st => { st.meta.routines[r.id] = r; }, 'meta');
  setProgram(r.id);
  showToast({ kind: 'info', ms: 7000, text: 'Following ' + r.name, action: prevProg && prevProg !== r.id ? 'Undo' : null, fn: () => setProgram(prevProg) });
}
/* Meal goal that goes with the training goal */
function mealGoalFor(a) {
  const ph = gpPhaseNow(a);
  if (ph === 'bulk' || (!ph && a.goal === 'mass')) return { goal: 'gain', pace: 'gentle' };
  if (ph === 'cut' || (!ph && a.goal === 'lose')) return { goal: 'lose', pace: 'steady' };
  return { goal: 'keep', pace: 'gentle' };
}
function nextDate(month, day, after) { const a = after || new Date(); let d = new Date(a.getFullYear(), month - 1, day); if (d <= a) d = new Date(a.getFullYear() + 1, month - 1, day); return ymd(d); }
function defaultSeason() { const cutFrom = nextDate(2, 15); return { on: false, bulkFrom: ymd(new Date()), cutFrom, cutTo: nextDate(5, 25, parseYmd(cutFrom)), asked: {} }; }
function GoalSetupSheet() {
  const saved = S.meta.settings.goal || {}; const pid = programId(); const hasProg = pid && pid !== 'self' && pid !== 'gp-mine' && getRoutine(pid);
  const [a, setA] = useState(() => ({ goal: saved.goal || 'recomp', sport: saved.sport || 'box', keep: saved.keep != null ? saved.keep && !!hasProg : !!hasProg, days: saved.days || 3, mins: saved.mins || 60,
    gear: saved.gear || 'gym', cardio: saved.cardio || ['road'], joints: saved.joints || [], season: { ...defaultSeason(), ...(saved.season || {}) } }));
  const [step, setStep] = useState(0);
  const set = (k, v) => setA({ ...a, [k]: v }); const tog = (k, x) => set(k, a[k].includes(x) ? a[k].filter(y => y !== x) : a[k].concat(x));
  const setSeason = (k, v) => setA({ ...a, season: { ...a.season, [k]: v } });
  const chips = (k, opts, multi) => html`<div class="cat-pick">${opts.map(([v, l]) => { const on = multi ? a[k].includes(v) : a[k] === v; return html`<button key=${v} id=${'gs-' + k + '-' + v} class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => multi ? tog(k, v) : set(k, v)}>${l}</button>`; })}</div>`;
  const seg = (k, opts) => html`<div class="seg wide" role="group">${opts.map(([v, l]) => html`<button key=${v} id=${'gs-' + k + '-' + v} class=${a[k] === v ? 'on' : ''} aria-pressed=${a[k] === v} onClick=${() => set(k, v)}>${l}</button>`)}</div>`;
  const bulky = a.goal === 'recomp' || a.goal === 'mass';
  const keep = a.keep && hasProg; const plan = keep ? null : buildGoalPlan(a); const kp = keep ? keepPlanFor(a) : null;
  const finish = toMeals => { applyGoal(a, plan); if (toMeals) { const mg = mealGoalFor(a); setTimeout(() => openSheet({ type: 'mealTargets', preset: mg }), 80); } else closeSheet(); };
  const steps = ['Goal', 'Time', 'Gear', 'Your plan'];
  return html`<${Sheet} label="Build my plan"><h2>Build my plan</h2>
    <div class="gs-steps" aria-label=${'Step ' + (step + 1) + ' of 4'}>${steps.map((s, i) => html`<span key=${s} class=${i === step ? 'on' : i < step ? 'done' : ''}>${s}</span>`)}</div>
    <div class="stack" style="gap:14px;margin-top:10px" id=${'gs-step' + step}>
    ${step === 0 ? html`
      <div><span class="lbl">What do you want most?</span>${chips('goal', GP_GOALS)}</div>
      ${a.goal === 'sport' ? html`<div><span class="lbl">Which sport?</span>${chips('sport', GP_SPORTS)}</div>` : null}
      ${bulky ? html`<label class="toggle-row" for="gs-season"><span><span>Bulk this winter, cut in spring</span><span class="d">Eat a little more and train more now (about ½ lb a week), then lose the extra fat (about 1 lb a week). Ironwood asks before switching.</span></span><input type="checkbox" role="switch" id="gs-season" checked=${a.season.on} onChange=${e => setSeason('on', e.target.checked)}/></label>` : null}
      ${bulky && a.season.on ? html`<div class="row" style="gap:8px">${[['bulkFrom', 'Bulk from'], ['cutFrom', 'Cut from'], ['cutTo', 'Cut until']].map(([k, l]) => html`<div key=${k} style="flex:1;min-width:0"><label class="lbl" for=${'gs-' + k}>${l}</label><input class="field" type="date" id=${'gs-' + k} value=${a.season[k]} onInput=${e => setSeason(k, e.target.value)}/></div>`)}</div>` : null}`
    : step === 1 ? html`
      ${hasProg ? html`<div><span class="lbl">You follow ${getRoutine(pid).name}</span><div class="seg wide" role="group"><button id="gs-keep" class=${a.keep ? 'on' : ''} aria-pressed=${a.keep} onClick=${() => set('keep', true)}>Keep it and adjust</button><button id="gs-new" class=${!a.keep ? 'on' : ''} aria-pressed=${!a.keep} onClick=${() => set('keep', false)}>Give me a new plan</button></div></div>` : null}
      <div><span class="lbl">Days a week you can train</span>${seg('days', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']])}</div>
      <div><span class="lbl">Minutes per workout</span>${seg('mins', [[30, '30'], [45, '45'], [60, '60'], [75, '75+']])}</div>`
    : step === 2 ? html`
      <div><span class="lbl">What can you lift with?</span>${chips('gear', GP_GEAR)}</div>
      <div><span class="lbl">Cardio you have (pick any)</span>${chips('cardio', GP_CARDIO, true)}</div>
      <div><span class="lbl">Joints to go easy on (optional)</span>${chips('joints', GP_JOINTS, true)}<p class="small muted" style="margin-top:4px">Ironwood swaps in easier lifts for these. If something hurts, stop and get it checked.</p></div>`
    : html`<div class="card" id="gs-result">${keep ? html`
        <div class="eyebrow">Keep and adjust</div><div style="font-weight:700">${kp.r.name}, plus what fits your goal</div>
        <ul class="small" style="margin:6px 0 0 18px">${kp.addon ? html`<li>${getRoutine(kp.addon).name} alongside on ${kp.free} free day${kp.free === 1 ? '' : 's'} (${CMODE_NAME[kp.mode]} fits your gear). You pick the days next.</li>` : html`<li>No extra days added${kp.free ? '' : ': your program already uses the days you have'}.</li>`}${kp.tips.map(t => html`<li key=${t}>${t}</li>`)}</ul>`
      : html`<div class="eyebrow">Your plan</div><div style="font-weight:700" id="gs-name">${plan.name}</div><p class="small muted" style="margin:2px 0 6px">${plan.note}</p>
        <div class="stack" style="gap:4px" id="gs-days">${plan.days.map(dd => html`<div key=${dd.id} class="small"><b>${dd.name}</b><span class="muted"> · ${dd.items.map(it => exName(it.ex)).join(', ')}</span></div>`)}</div>`}
      ${a.season.on && bulky ? html`<p class="small" style="margin-top:8px">Season: bulk until ${shortDate(parseYmd(a.season.cutFrom))}, then cut until ${shortDate(parseYmd(a.season.cutTo))}. Ironwood asks before each switch.</p>` : null}
      <p class="small faint" style="margin-top:8px">A starting point, not coaching or medical advice. Change any exercise, day or number later.</p></div>
      <button class="btn primary wide" id="gs-meals" onClick=${() => finish(true)}>Use this, then set my meals</button>
      <button class="btn wide" id="gs-go" onClick=${() => finish(false)}>Use this plan</button>`}
    <div class="row" style="gap:8px">${step > 0 ? html`<button class="btn" style="flex:1" id="gs-back" onClick=${() => setStep(step - 1)}>Back</button>` : html`<button class="btn" style="flex:1" onClick=${closeSheet}>Cancel</button>`}
      ${step < 3 ? html`<button class="btn primary" style="flex:2" id="gs-next" onClick=${() => setStep(step + 1)}>Next</button>` : null}</div></div><//>`;
}
/* ---- season phases: ask before switching ---- */
function phaseDue() {
  const g = S.meta.settings.goal; const s = g && g.season; if (!s || !s.on) return null;
  const today = ymd(new Date()); const want = today >= s.cutTo ? 'keep' : today >= s.cutFrom ? 'cut' : today >= s.bulkFrom ? 'bulk' : null;
  if (!want || want === (s.cur || phaseByDate(s))) return null; const ans = (s.asked || {})[want];
  if (ans === 'stay' || (typeof ans === 'number' && ans > Date.now())) return null; return want;
}
function switchPhase(to) {
  commit(st => { const g = st.meta.settings.goal; g.season = { ...g.season, cur: to }; }, 'meta');
  const g = S.meta.settings.goal; const me = ML().me;
  if (me && me.h) { const mg = mealGoalFor(g); const m2 = { ...me, ...mg }; const t = targetsFor(m2);
    if (t) mealCommit(m => { m.me = m2; m.goals = { ...m.goals, kcal: t.kcal, p: t.p, c: t.c, f: t.f, fib: t.fib, na: t.na }; if (m.menu) m.menu = buildMenu(t, m.menu.seed || Date.now() % 1e6); }); }
  if (programId() === 'gp-mine') { const r = buildGoalPlan(g); commit(st => { st.meta.routines[r.id] = r; }, 'meta'); }
  else if (to === 'cut' && !g.keep) applyGoal(g);
  showToast({ kind: 'info', ms: 7000, text: to === 'cut' ? 'Cut started: calories down about 1 lb a week, heavy lifts stay heavy.' : to === 'bulk' ? 'Bulk started: a small surplus, about ½ lb a week.' : 'Back to maintaining. Nice work.' });
}
function snoozePhase(to, how) { commit(st => { const s = st.meta.settings.goal.season; s.asked = { ...(s.asked || {}), [to]: how === 'stay' ? 'stay' : Date.now() + 7 * 864e5 }; }, 'meta'); }
function PhaseCheck() {
  if (S.active) return null; const to = phaseDue(); if (!to) return null; const s = S.meta.settings.goal.season;
  const t = { cut: ['Time for your spring cut', 'Your bulk was set to end ' + shortDate(parseYmd(s.cutFrom)) + '. Switch to cutting? Calories drop to lose about 1 lb a week; heavy lifts stay heavy, fewer accessory sets.'],
    bulk: ['Ready to start your bulk?', 'A small surplus (about ½ lb a week) and one more accessory set.'],
    keep: ['Your cut is done', 'Switch to maintenance calories and your regular plan?'] }[to];
  return html`<div class="card check-card" id="phase-check"><div class="eyebrow">Season plan</div><div style="font-weight:700">${t[0]}</div><div class="small muted">${t[1]}</div>
    <div class="check-acts"><button class="btn primary" id="ph-switch" onClick=${() => switchPhase(to)}>Switch now</button><button class="btn" id="ph-later" onClick=${() => snoozePhase(to, 'later')}>In a week</button><button class="btn text" id="ph-stay" onClick=${() => snoozePhase(to, 'stay')}>Stay as I am</button></div></div>`;
}
/* The six plans also live on the Programs shelf as they are (full gym, running for conditioning) */
for (const T of GP_TPL) {
  const days = T.t.map((d, i) => {
    if (d[0] === 'COND-HARD' || d[0] === 'COND-EASY') { const hard = d[0] === 'COND-HARD'; return planDay(T.id, i + 1, hard ? 'Conditioning: intervals' : 'Conditioning: steady', ['Conditioning'], GP_COND.run[hard ? 0 : 1].concat(hard ? [] : [['Dead Bug', 2, '10', 'Each side.']])); }
    return planDay(T.id, i + 1, d[0], d[1], d[2].map(([n, s, r, cue]) => [n, s, r, cue]));
  });
  BUILTIN_ROUTINES.push({ id: T.id, name: T.name, note: T.fit + ' ' + T.why + ' Build my plan (Train) fits it to your time, gear and joints.', source: 'builtin', shelf: 'programs', meta: 'Goal plan · ' + T.days + ' days a week', days, goalPlan: true });
}
