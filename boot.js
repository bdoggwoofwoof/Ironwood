
/* ============ Core logic (no DOM) ============ */
const DAY = 864e5;
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const fmt = n => { if (n == null || !isFinite(n)) return '–'; const r = Math.round(n * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1); };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const nameKey = s => norm(s).replace(/ /g, '').replace(/(es|s)$/, '');
const slug = s => norm(s).replace(/ /g, '-').slice(0, 40) || 'ex';
const titleCase = s => { s = s.replace(/\s+/g, ' ').trim(); if (/[A-Z]/.test(s.slice(1)) && /[a-z]/.test(s)) { if (!/[a-z][A-Z]/.test(s)) return s; } return s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()); };
const epley = (w, r) => r <= 0 ? 0 : r === 1 ? w : w * (1 + Math.min(r, 15) / 30);

const KINDS = { barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable', machine: 'Machine', bodyweight: 'Bodyweight', assisted: 'Assisted', other: 'Other' };
function guessKind(name) {
  const n = norm(name);
  if (/assist/.test(n)) return 'assisted';
  if (/\b(run|running|jog|jogging|sprints?|swim|swimming|cycling|elliptical|rowing machine|erg|treadmill)\b/.test(n)) return 'distance';
  if (/\b(carry|carries|ruck|rucking|sled push|sled drag|yoke)\b/.test(n)) return 'carry';
  if (/\b(plank|dead hang|wall sit|l-sit|hollow hold)\b/.test(n) && !/jack|up|walk|row/.test(n)) return 'timed';
  if (/machine|leg curl|leg press|leg extension|calf|chest press|smith|hack/.test(n)) return 'machine';
  if (/barbell|squat|deadlift|bench|\brdl\b|romanian|good morning|hip thrust/.test(n)) return 'barbell';
  if (/cable|pulldown|pushdown|push down|face pull|crunch|\bfl(y|ies)\b/.test(n)) return 'cable';
  if (/dumbbell|\bdb\b|curl|cuban|shrug|lateral|raise/.test(n)) return 'dumbbell';
  if (/pull ?up|chin ?up|\bdips?\b|push ?up|plank/.test(n)) return 'bodyweight';
  return 'other';
}

/* Program text parser: accepts RepCount-style ("3x x Hybrid Curls"), "4x8-10 Squat", "Squat 3x5",
   "Bench - 3 sets x 8 reps", A1/A2 supersets, and plain headers as day names. */
function parseProgram(text) {
  const days = []; let cur = null, lastLetter = null;
  const newDay = name => { cur = { name: name.replace(/[:\s]+$/, '').trim() || ('Day ' + (days.length + 1)), items: [] }; days.push(cur); lastLetter = null; };
  const add = (name, sets, reps, ss) => {
    if (!cur) newDay('Day 1');
    name = String(name).replace(/\s+/g, ' ').trim(); if (!name) return;
    cur.items.push({ name, sets: Math.min(Math.max(sets || 3, 1), 20), reps: String(reps || '').replace(/\s/g, '').replace('–', '-'), ss: !!ss && cur.items.length > 0 });
  };
  for (const raw of String(text || '').split(/\r?\n/)) {
    let line = raw.replace(/^\s*[-•*·]\s+/, '').trim();
    if (!line) continue;
    let ss = false, letter = null;
    const ab = line.match(/^([A-Za-z])(\d)[.):]\s+(.*)$/);
    if (ab) { letter = ab[1].toUpperCase(); ss = letter === lastLetter; line = ab[3]; }
    let m = line.match(/^(\d+)\s*[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)?\s+((?:x|ss|\+)\s+)?(.+)$/i);
    if (m) { add(m[4], +m[1], m[2], ss || !!m[3]); lastLetter = letter; continue; }
    m = line.match(/^((?:x|ss|\+)\s+)?(.+?)\s*[:–—-]?\s+(\d+)\s*(?:sets?\s*)?[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)\s*(?:reps?)?$/i);
    if (m) { add(m[2], +m[3], m[4], ss || !!m[1]); lastLetter = letter; continue; }
    m = line.match(/^(?:x|ss|\+)\s+(.+)$/i);
    if (m && cur) { add(m[1], 3, '', true); continue; }
    if (letter) { add(line, 3, '', ss); lastLetter = letter; continue; }
    newDay(line);
  }
  return days.filter(d => d.items.length);
}

/* Built-in content */
const BUILTIN_EX = {};
const NEWT_TEXT = `Day 1 - Chest Focus
3x5-8 Decline Chest Press
3x5-8 Incline Reverse-Grip Squeeze Press
3x5-8 x Hybrid Curls
3x5-8 Cable Fly
3x5-8 x Tricep Pushdowns
3x5-8 Cable Crunch
3x10-12 x Behind-the-Back Cable Lateral Raise
Day 2 - Back / Rear Delts
3x5-8 Bent-Over Barbell Rows
3x5-8 Lat Pulldown
3x10-12 x Cuban Press
4x10-12 Behind-the-Back Cable Lateral Raise
3x5-8 x Hybrid Curls
3x10-12 Scapular Shrugs
3x10-12 x Cable Crunch
Day 3 - Shoulders / Tris
3x5-8 Overhead Barbell Press
3x10-12 Behind-the-Back Cable Lateral Raise
3x5-8 x Tricep Pushdowns
3x5-8 Face Pulls
3x5-8 x Overhead Cable Tricep Extension
3x10-12 Scapular Shrugs
3x10-12 x Cable Crunch
Day 4 - Legs
3x5-8 Squat
3x5-8 x Romanian Deadlift
3x5-8 Leg Curls
3x10-12 x Calf Raises`;
const findIn = (...stores) => name => { const k = nameKey(name); for (const st of stores) { const hit = Object.values(st).find(e => nameKey(e.name) === k); if (hit) return hit; } return null; };
function builtinRoutine(rid, name, note, text) {
  const days = parseProgram(text).map((d, i) => ({
    id: `${rid}-d${i + 1}`, name: d.name,
    items: d.items.map((it, j) => {
      let ex = findIn(BUILTIN_EX)(it.name);
      if (!ex) { ex = { id: 'b-' + slug(it.name), name: it.name, kind: guessKind(it.name) }; BUILTIN_EX[ex.id] = ex; }
      return { id: `${rid}-d${i + 1}-${j + 1}`, ex: ex.id, sets: it.sets, reps: it.reps, group: '', ss: it.ss };
    })
  }));
  return { id: rid, name, note, source: 'builtin', days };
}
const LIB_PROGRAMS = [
  ['bi-5x5', 'Full Body 5×5', 'Beginner · 3 days a week', 'Alternate A and B, three days a week with a rest day between. Start lighter than you think. Each time you get all 25 reps, add 5 lb (2.5 kg) next session, twice that on deadlift; Ironwood suggests it. If you miss the same weight three sessions running, drop it about 10% and build back up.', `Workout A
5x5 Squat
5x5 Bench Press
5x5 Bent-Over Barbell Rows
Workout B
5x5 Squat
5x5 Overhead Barbell Press
1x5 Deadlift`],
  ['bi-tiered', 'Tiered Linear 4-Day', 'Beginner · 3–4 days a week', 'The three-tier method: T1 is the heavy main lift, T2 the same pattern lighter for volume, T3 an accessory. Make the last set of T1 and T3 as many reps as you can. Add weight whenever you get every rep. When T1 stalls, edit it from 5×3 to 6×2, then 10×1; when T2 stalls, go 3×10 → 3×8 → 3×6.', `Day 1 - Squat / Bench
5x3 Squat
3x10 Bench Press
3x15 Lat Pulldown
Day 2 - Press / Deadlift
5x3 Overhead Barbell Press
3x10 Deadlift
3x15 Dumbbell Row
Day 3 - Bench / Squat
5x3 Bench Press
3x10 Squat
3x15 Lat Pulldown
Day 4 - Deadlift / Press
5x3 Deadlift
3x10 Overhead Barbell Press
3x15 Dumbbell Row`],
  ['bi-fb3', 'Full Body 3-Day', 'Beginner · 3 days a week', 'Three different full-body days with a rest day between. Add reps until every set reaches the top of the range, then add weight and start again at the bottom.', `Day 1 - Full Body A
3x6-8 Squat
3x6-8 Bench Press
3x8-10 Bent-Over Barbell Rows
3x10-12 Leg Curls
3x10-15 Lateral Raises
3x10-15 Cable Crunch
Day 2 - Full Body B
3x5 Deadlift
3x8-10 Overhead Barbell Press
3x8-12 Lat Pulldown
3x10-12 Leg Press
3x10-12 Barbell Curl
3x10-12 Tricep Pushdowns
Day 3 - Full Body C
3x10-12 Goblet Squat
3x8-10 Incline Dumbbell Press
3x8-12 Seated Cable Row
3x8-10 Romanian Deadlift
3x12-15 Face Pulls
3x10-15 Calf Raises`],
  ['bi-db3', 'Dumbbells Only 3-Day', 'Home gym · 3 days a week', 'Needs a pair of dumbbells and a bench (presses work on the floor too). Pick a weight you can lift for the low end of the range, and move up once every set reaches the top.', `Day 1 - Full Body A
3x8-12 Goblet Squat
3x8-12 Dumbbell Bench Press
3x8-12 Dumbbell Row
3x8-12 Dumbbell Romanian Deadlift
3x10-15 Lateral Raises
3x10-15 Hammer Curls
Day 2 - Full Body B
3x8-12 Dumbbell Split Squat
3x8-12 Dumbbell Shoulder Press
3x10-12 Dumbbell Pullover
3x10-15 Dumbbell Hip Thrust
3x10-15 Dumbbell Overhead Tricep Extension
3x10-15 Dumbbell Curl
Day 3 - Full Body C
3x8-12 Dumbbell Step-Up
3x8-12 Incline Dumbbell Press
3x8-12 Dumbbell Row
3x8-12 Dumbbell Romanian Deadlift
3x12-15 Dumbbell Rear Delt Fly
3x10-20 Push-Up`],
  ['bi-ul4', 'Upper / Lower 4-Day', 'Intermediate · 4 days a week', 'A heavy upper and lower day early in the week, then a volume upper and lower day. On heavy days add weight once you reach the top of the range; on volume days keep the reps smooth and controlled.', `Day 1 - Upper Heavy
4x3-5 Bench Press
4x3-5 Bent-Over Barbell Rows
3x5-8 Overhead Barbell Press
3x6-10 Lat Pulldown
3x6-10 Barbell Curl
3x6-10 Skull Crushers
Day 2 - Lower Heavy
4x3-5 Squat
3x3-5 Deadlift
3x10-15 Leg Press
3x6-10 Leg Curls
4x6-10 Calf Raises
Day 3 - Upper Volume
4x8-12 Incline Dumbbell Press
4x8-12 Cable Fly
4x8-12 Seated Cable Row
4x8-12 Dumbbell Row
4x10-15 Lateral Raises
4x8-12 Hammer Curls
4x8-12 Tricep Pushdowns
Day 4 - Lower Volume
4x8-12 Front Squat
3x8-12 Bulgarian Split Squat
3x10-15 Leg Extension
3x10-15 Leg Curls
4x10-15 Calf Raises`],
  ['bi-ppl6', 'Push / Pull / Legs', 'Intermediate · 6 days a week', 'Pull, push, legs, then the B versions, then a rest day. Make the last set of the 5×5 and the 1×5 as many reps as you can. Main lifts go up 5 lb a session; accessories go up once every set reaches the top of the range.', `Day 1 - Pull A
1x5 Deadlift
3x8-12 Lat Pulldown
3x8-12 Seated Cable Row
5x15-20 Face Pulls
4x8-12 Hammer Curls
4x8-12 Barbell Curl
Day 2 - Push A
5x5 Bench Press
3x8-12 Overhead Barbell Press
3x8-12 Incline Dumbbell Press
3x8-12 Tricep Pushdowns
3x8-12 Overhead Cable Tricep Extension
3x15-20 Lateral Raises
Day 3 - Legs A
3x5 Squat
3x8-12 Romanian Deadlift
3x8-12 Leg Press
3x8-12 Leg Curls
5x8-12 Calf Raises
Day 4 - Pull B
5x5 Bent-Over Barbell Rows
3x8-12 Pull-Up
3x8-12 Seated Cable Row
5x15-20 Face Pulls
4x8-12 Hammer Curls
4x8-12 Barbell Curl
Day 5 - Push B
5x5 Overhead Barbell Press
3x8-12 Bench Press
3x8-12 Incline Dumbbell Press
3x8-12 Tricep Pushdowns
3x8-12 Overhead Cable Tricep Extension
3x15-20 Lateral Raises
Day 6 - Legs B
3x5 Squat
3x8-12 Romanian Deadlift
3x8-12 Leg Press
3x8-12 Leg Curls
5x8-12 Calf Raises`],
  ['bi-split5', '5-Day Body-Part Split', 'Intermediate · 5 days a week', 'One muscle group a day with plenty of sets for each. Add weight once every set reaches the top of the range.', `Day 1 - Chest
4x6-10 Bench Press
3x8-12 Incline Dumbbell Press
3x10-12 Machine Chest Press
3x10-15 Cable Fly
Day 2 - Back
3x5 Deadlift
3x6-10 Pull-Up
3x10-12 Lat Pulldown
3x10-12 Seated Cable Row
3x15-20 Face Pulls
Day 3 - Shoulders
4x6-10 Overhead Barbell Press
4x12-15 Lateral Raises
3x12-15 Dumbbell Rear Delt Fly
3x10-15 Barbell Shrugs
Day 4 - Legs
4x6-10 Squat
3x8-12 Romanian Deadlift
3x10-15 Leg Press
3x10-15 Leg Extension
3x10-15 Leg Curls
4x10-15 Calf Raises
Day 5 - Arms
3x8-12 Barbell Curl
3x8-12 Skull Crushers
3x10-15 Hammer Curls
3x10-15 Tricep Pushdowns
3x12-15 Cable Curl
3x12-15 Overhead Cable Tricep Extension`],
];
/* Newt's own routines from RepCount: one workout each, with the notes he kept on each exercise.
   Item: [exercise, sets, reps, note, superset with the one above] */
const MY_PLANS = [
  ['bi-eff-ppl', 'Efficient Push/Pull/Legs', null, '', [
    ['Push', ['Push'], [['Bench Press', 3], ['Assisted Dips', 3], ['Standing Overhead Press', 3], ['Cable Lateral Raise Toss', 3], ['Overhead Cable Tricep Extension', 3, '', '', 1]]],
    ['Pull', ['Pull'], [['Assisted Pull-Up', 3], ['Standing Barbell Row', 3], ['Rear Delt Rows', 3, '', 'Like bent rows but elbows out and lighter, pulling to the upper chest rather than the ribs or waist'], ['Face Pulls', 3], ['Hybrid Curls', 3, '', '', 1]]],
    ['Legs', ['Legs'], [['Back Squat', 3], ['Romanian Deadlift', 3], ['Weighted Walking Lunge', 3], ['Calf Raises', 3, '', '', 1]]]]],
  ['bi-full-body', 'Full Body', ['Full Body'], '', [['Overhead Barbell Press', 3, '', 'Shoulders'], ['Assisted Dips', 3, '', 'Chest, triceps'], ['Dead Hang', 3, '', 'Forearms'], ['Barbell Bicep Curl', 3, '', 'Biceps'], ['Bent-Over Barbell Rows', 3, '', 'Back'], ['Assisted Pull-Up', 3, '', 'Back'], ['Hanging Leg Raises', 10, '', 'Abs: 10 sets, 30 s on / 30 s off'], ['Back Squat', 3, '', 'Legs'], ['Deadlift', 3, '', 'Legs']]],
  ['bi-core-1', 'Core 1', ['Core'], 'On a decline sit-up machine, use weights.', [['Kettlebell Around the World', 3], ['Weighted Decline Sit-Ups', 3], ['Hanging Leg Raise Holds', 3, '10', 'With a 5-second release'], ['Dumbbell Side Bend', 3, '12', 'Weight in one hand, then crunch the opposite direction']]],
  ['bi-core-2', 'Core 2', ['Core'], '', [['Kettlebell Around the World', 3], ['Plank Twists', 3, '15', 'Each side'], ['Cross-Body Mountain Climbers', 3, '15', 'Each leg. Like mountain climbers, but bringing the knee across the body'], ['Side Plank Crunches', 3, '20', 'Each side'], ['Plank Crunches', 3, '15'], ['Toe Touches', 3, '10'], ['Heel Touches', 3, '20', 'Each side'], ['Knee Roll-Ups', 3]]],
  ['bi-core-3', 'Core 3', ['Core'], '', [['Kettlebell Around the World', 3, '20'], ['Russian Twists', 3, '20', 'Each side'], ['Scissor Kicks', 3, '20'], ['Scullers', 3, '30'], ['90-Degree Leg Lowers', 3, '10', 'Slow and controlled'], ['Bicycle Crunches', 3, '30', 'Each leg']]],
  ['bi-sere-pyramid', 'Calisthenics Pyramid', ['Conditioning'], 'Multiply the round number by the number in each note. Round 1 (10): 10 pull-ups, 20 dips, 30 push-ups, 40 sit-ups, 50 squats. Round 2 (9): 9, 18, 27, 36, 45. And so on.', [['Pull-Up', 6, '', '1× the round number'], ['Dips', 6, '', '2× the round number'], ['Push-Ups', 6, '', '3× the round number'], ['Sit-Ups', 6, '', '4× the round number'], ['Air Squat', 6, '', '5× the round number'], ['Rowing Machine (Erg)', 1, '', '20 min, 1 on / 1 off']]],
  ['bi-sere-trot', 'Run & Swing Circuit', ['Conditioning'], '', [['Run 400m', 3], ['Kettlebell Swing', 3, '', '45 lb'], ['Pull-Up', 3], ['100m Sprints', 10, '', 'Sprint 100 m at the top of every minute; rest for whatever is left of that minute']]],
  ['bi-sere-buster', '400m Repeats + Calisthenics', ['Conditioning'], '', [['Run 400m', 8, '', 'Under 1:50 each, rest 2:00'], ['Pull-Up', 5, '20'], ['Push-Ups', 5, '30'], ['Sit-Ups', 5, '40'], ['Air Squat', 5, '50']]],
  ['bi-sere-swim', 'Swim AMRAP', ['Conditioning'], '30-minute cap.', [['50m Swim', 10], ['Push-Ups', 10, '10'], ['Air Squat', 10, '15']]],
  ['bi-sere-burp', 'Burpee Grinder', ['Conditioning'], 'Split it however you want.', [['Run 4 Miles', 1, '', 'Under 31:30'], ['Pull-Up', 1, '50'], ['Burpees', 1, '100'], ['Wall Ball', 1, '50']]],
  ['bi-sere-ruck', '4-Mile Ruck + Calisthenics', ['Conditioning'], '', [['Ruck 4 Miles', 1, '', 'Under 60 min at 55 lb'], ['Push-Ups', 5, '', '50-40-30-20-10'], ['Sit-Ups', 5, '', '50-40-30-20-10'], ['Kettlebell Swing', 5, '', '50-40-30-20-10']]],
  ['bi-lifter-mobility', "Lifter's Mobility", ['Mobility'], '3–5 sessions a week. Keep it easy: about a 6 out of 10 effort.', [['Knee-to-Wall Ankle Dorsiflexion', 3, '', '3 min'], ['Banded Ankle Distractions', 3, '', '20 s each set'], ['Slant Board Calf Stretch', 3, '', '20 s each set'], ['Seated Tibialis Raise', 3, '15'], ['90/90 Hip Rotations', 3, '8'], ['Pigeon Stretch with Thoracic Rotation', 3, '6'], ['Hip Airplanes', 3, '6'], ['Quadruped T-Spine Rotations', 3, '8'], ['Hanging Lat Stretch', 3, '', '20 s each set'], ['Banded Shoulder Dislocates', 3, '10'], ['Banded Terminal Knee Extensions', 3, '15'], ['Petersen Step-Up', 3, '12'], ['Weighted Wrist Extension', 3, '10'], ['Floor Wrist Stretch', 3, '', '20 s each set'], ['Dead Bug', 3, '', '20 s each set'], ['Side Plank Rotations', 3, '', '20 s each set']]],
  ['bi-mobility-flow', 'Mobility Flow', ['Mobility'], '', [["World's Greatest Stretch", 3], ['90/90 Hip Flow', 3], ['Cat-Cow and T-Spine Rotation', 3], ['Half-Kneeling Adductor Rock Back', 3], ['Thread the Needle', 3], ['Achilles Opener', 3], ['Thoracic Extension Stretch', 3], ['Figure-4 Windshield Wipers', 3], ['Air Squat', 3], ['Bodyweight Bulgarian Split Squat', 3]]],
  ['bi-full-body-hlm', 'Full Body: Heavy, Light, Medium', null, 'Three full-body days a week: one heavy, one light with high reps, one in between. Add weight on a day once you hit all its reps.', [
    ['Day 1 - Heavy', ['Full Body'], [['Dumbbell Bench Press', 3, '5'], ['Lat Pulldown', 3, '5'], ['Squat', 1, '8'], ['Romanian Deadlift', 1, '8'], ['Seated Dumbbell Overhead Press', 3, '5'], ['Hybrid Curls', 3, '8'], ['Skull Crushers', 3, '8'], ['Calf Raises', 3, '10'], ['Cable Crunch', 3, '10']]],
    ['Day 2 - Light', ['Full Body'], [['Cable Crossover', 3, '15'], ['Dumbbell Pullover', 3, '15'], ['Leg Extension', 3, '15'], ['Lying Leg Curl', 3, '15'], ['Lateral Raises', 3, '15'], ['Hybrid Curls', 3, '15'], ['Tricep Pushdowns', 3, '15'], ['Calf Raises', 3, '15'], ['Cable Crunch', 3, '15']]],
    ['Day 3 - Medium', ['Full Body'], [['Incline Barbell Bench Press', 3, '10'], ['Bent-Over Barbell Rows', 3, '10'], ['Leg Press', 1, '10'], ['Stiff-Leg Deadlift', 1, '10'], ['Barbell Upright Row', 3, '10'], ['Dumbbell Curl', 3, '12'], ['Dumbbell Overhead Tricep Extension', 3, '12'], ['Calf Raises', 3, '12'], ['Cable Crunch', 3, '12']]]]],
];
const COND_EX = /\b(run|running|sprints?|swim|swimming|miles?|ruck|burpees?|erg|wall ?ball|kettlebell swing|kettle bell swing|kb swing|jump rope|bike|cycling|treadmill|rower)\b/;
const BW_EX = /\b(air squat|push ?ups?|sit ?ups?|burpees?|planks?|plank twists|toe touches|ankle taps|scissor kicks|scullers|leg lowers|bicycles|knee roll ?ups|dead hang|hanging leg raises?|dips|bench dips|inverted rows?|reverse crunch(es)?|chin ?ups?|mountain climbers?|bear crawls?)\b/;
function planDay(rid, i, name, tags, items) {
  return { id: `${rid}-d${i}`, name, tags, items: items.map(([nm, sets, reps, cue, ss], j) => {
    let ex = findIn(BUILTIN_EX)(nm);
    if (!ex) { const n = norm(nm); ex = { id: 'b-' + slug(nm), name: nm, kind: BW_EX.test(n) && !/assist/.test(n) ? 'bodyweight' : /kettle ?bell|wall ?ball/.test(n) || COND_EX.test(n) ? 'other' : tags[0] === 'Mobility' && !/weighted|dumbbell|barbell/.test(n) ? 'bodyweight' : guessKind(nm) };
      if (COND_EX.test(n)) ex.cat = 'cardio'; else if (tags[0] === 'Core') ex.cat = 'core'; else if (tags[0] === 'Mobility') ex.cat = 'other'; else if (/rear delt row/.test(n)) ex.cat = 'back';
      BUILTIN_EX[ex.id] = ex; }
    return { id: `${rid}-d${i}-${j + 1}`, ex: ex.id, sets, reps: reps || '', group: '', ss: !!ss && j > 0, note: cue || '' }; }) };
}
/* One-day plans: [id, name, tags, note, items]. Multi-day: [id, name, null, note, [[day name, tags, items], …]]. */
function builtinPlan([rid, name, tags, note, items]) {
  const days = tags ? [planDay(rid, 1, name, tags, items)] : items.map(([dn, t, its], i) => planDay(rid, i + 1, dn, t, its));
  return { id: rid, name, note, source: 'builtin', shelf: 'plans', meta: days.length > 1 ? days.length + ' days a week' : '', days };
}
const BUILTIN_ROUTINES = [
  Object.assign(builtinRoutine('bi-newt-4day', "Newt's 4-Day Split", 'Exercises marked with a bar on the left are supersets with the one above.', NEWT_TEXT), { meta: '4 days a week', shelf: 'plans' }),
  ...MY_PLANS.map(builtinPlan),
  ...LIB_PROGRAMS.map(([id, name, meta, note, text]) => Object.assign(builtinRoutine(id, name, note, text), { meta, shelf: 'programs' })),
];
BUILTIN_ROUTINES.forEach(r => { if (r.id === 'bi-5x5' || r.id === 'bi-tiered') r.days.forEach(d => { d.tags = ['Full Body']; }); });
for (const e of Object.values(BUILTIN_EX)) if (/\b(dumbbell|goblet)\b/i.test(e.name)) e.kind = 'dumbbell';
/* How-to cues for built-in exercises whose names don't explain them; shown in the routine and during the workout */
const EX_CUES = {
  'b-incline-reverse-grip-squeeze-press': 'Incline bench. Hold the dumbbells pressed together, palms toward your face, pinkie-side touching. Press up only until the chest finishes the work, not the tris.',
  'b-cuban-press': 'Light dumbbells. Row to chest height with elbows out, rotate the forearms up until vertical, press overhead, then reverse it on the way down.',
  'b-kettlebell-around-the-world': 'Standing, pass the kettlebell around your waist from hand to hand, hips still. Switch direction halfway.',
  'b-petersen-step-up': 'Stand on a low step on the ball of one foot, heel up. Lower the other heel to the floor slowly by straightening the knee, then drive back up. Builds the VMO.',
  'b-hip-airplanes': 'Single-leg hinge. Balancing on one leg, open the hips toward the standing leg, then rotate them closed. Hold a post if needed.',
  'b-heel-touches': 'Lie on your back, knees bent, shoulders off the floor. Crunch sideways to tap each heel.',
  'b-hybrid-curls': 'A mix of hammer curls and Zottman curls. Hammer: palms facing each other the whole rep. Zottman: curl up palms up, turn the palms down at the top, lower slowly.',
  'b-cable-lateral-raise-toss': 'Lateral raise on a low cable done fast, as if tossing the handle out to the side; let it come back under control.',
  'b-scapular-shrugs': 'Dumbbells at your sides, arms straight. Shrug the shoulder blades up and down without bending the elbows.',
  'b-behind-the-back-cable-lateral-raise': 'Stand beside a low cable with the handle behind your back in the far hand. Raise the arm out to the side to shoulder height, then lower slowly.',
  'b-dumbbell-side-bend': 'Dumbbell in one hand (or a low cable). Lean away from it, then pull back up with the opposite side.',
};
BUILTIN_ROUTINES.forEach(r => r.days.forEach(d => d.items.forEach(it => { if (!it.note && EX_CUES[it.ex]) it.note = EX_CUES[it.ex]; })));

/* ============ Store ============ */
const DEFAULT_SETTINGS = { unit: 'lb', bar: 45, inc: 5, goal: 4, rest: 120, restSS: 45, ssMode: 'each', autoRest: true, beep: true, countdown: true, excuse: true, bgAudio: false };
const emptyMeta = () => ({ settings: { ...DEFAULT_SETTINGS }, exercises: {}, routines: {}, exUnit: {}, exRest: {}, exCat: {}, bw: [], dayMarks: {}, challenges: {}, timers: [], deleted: [], hidden: [], updatedAt: 0 });
function normalizeMeta(m) {
  const e = emptyMeta(); m = m ? clone(m) : {};
  const settings = { ...e.settings, ...(m.settings || {}) };
  if (m.settings && !('restSS' in m.settings) && +m.settings.rest === 90) settings.rest = 120; /* old 1:30 default becomes 2:00 */
  /* Nov 2 builds saved the Build my plan answers over the weekly goal number: move them to settings.plan */
  if (settings.goal && typeof settings.goal === 'object') { if (!settings.plan) settings.plan = settings.goal; settings.goal = Math.min(7, Math.max(1, +settings.goal.days || 4)); }
  return { ...e, ...m, settings, exercises: m.exercises || {}, routines: m.routines || {}, exUnit: m.exUnit || {}, exRest: m.exRest || {}, exCat: m.exCat || {}, bw: m.bw || [], dayMarks: m.dayMarks || {}, challenges: m.challenges || {}, meals: normMeals(m.meals), timers: m.timers || [], deleted: m.deleted || [], hidden: m.hidden || [] };
}
/* A saved workout as the app expects it, or null if it can't be used. Backups and old data pass through here so one
   bad entry can't stop every screen from rendering. */
function cleanSession(k, s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  const t = +s.startedAt || +s.endedAt || +s.updatedAt;
  if (!isFinite(t) || t <= 0) return null;
  const o = { ...s, id: typeof s.id === 'string' && s.id ? s.id : String(k), startedAt: +s.startedAt || t };
  if (!isFinite(+o.endedAt)) o.endedAt = o.startedAt;
  o.items = (Array.isArray(s.items) ? s.items : []).filter(it => it && typeof it.ex === 'string').map(it => ({ ...it, ex: exIdNow(it.ex),
    sets: (Array.isArray(it.sets) ? it.sets : []).filter(x => x && typeof x === 'object' && isFinite(+x.w) && isFinite(+x.r)).map(x => ({ ...x, w: +x.w, r: Math.round(+x.r) })) }));
  if (!Array.isArray(o.prs)) o.prs = [];
  return o;
}
/* Built-in exercises that were renamed: old ids in saved data point at the new exercise, so history carries over */
const EX_RENAMED = {
  'b-russian-tits-to-l-stretch': 'b-incline-reverse-grip-squeeze-press', 'b-incline-dumbbell-pinky-press': 'b-incline-reverse-grip-squeeze-press',
  'b-russian-behind-the-back-cable-flies': 'b-behind-the-back-cable-lateral-raise', 'b-behind-the-back-cable-fly': 'b-behind-the-back-cable-lateral-raise',
  'b-zottman-curl': 'b-hybrid-curls', 'b-cable-lateral-raise-tosses': 'b-cable-lateral-raise-toss', 'b-dumbbell-cable-bends': 'b-dumbbell-side-bend', 'b-ankle-taps': 'b-heel-touches',
  'b-bicycles': 'b-bicycle-crunches', 'b-erg': 'b-rowing-machine-erg', 'b-weighted-lunge-walk': 'b-weighted-walking-lunge', 'b-peterson-step-ups': 'b-petersen-step-up',
  'b-plank-single-leg-up': 'b-cross-body-mountain-climbers' };
const exIdNow = id => EX_RENAMED[id] || id;
function migrateExIds(st) {
  const keys = Object.keys(EX_RENAMED); if (!keys.length) return;
  const fix = it => { if (it && EX_RENAMED[it.ex]) it.ex = EX_RENAMED[it.ex]; };
  for (const s of Object.values(st.sessions || {})) (s.items || []).forEach(fix);
  if (st.active) (st.active.items || []).forEach(fix);
  for (const r of Object.values(st.meta.routines || {})) for (const d of r.days || []) (d.items || []).forEach(fix);
  for (const f of ['exUnit', 'exRest', 'exCat']) { const o = st.meta[f] || {}; for (const [a, b] of Object.entries(EX_RENAMED)) if (a in o && !(b in o)) { o[b] = o[a]; delete o[a]; } }
}
function cleanSessions(obj) {
  const out = {}; let skipped = 0;
  for (const [k, s] of Object.entries(obj && typeof obj === 'object' ? obj : {})) { const c = cleanSession(k, s); if (c) out[k] = c; else skipped++; }
  return { sessions: out, skipped };
}
const S = { meta: emptyMeta(), sessions: {}, active: null, dirty: new Set(), activeAt: 0, sync: 'loading', ver: 0, rest: null, rerender: () => {} };
const U = () => S.meta.settings.unit;
const LB_PER_KG = 2.20462;
const conv = (w, from, to) => (!from || !to || from === to) ? w : from === 'kg' ? w * LB_PER_KG : w / LB_PER_KG;
const r1 = n => Math.round(n * 10) / 10;
const r05 = n => Math.round(n * 2) / 2;
/* Sets are logged in the unit the exercise used that day; stats read everything in the main unit. */
const toMain = (sets, u) => (!u || u === U()) ? sets : sets.map(x => ({ ...x, w: r1(conv(+x.w || 0, u, U())) }));
const slotUnit = ex => (S.meta.exUnit && S.meta.exUnit[ex]) || U();
const isDone = x => Math.round(num(x.r)) >= 1 || (!!x.c && (num(x.t) > 0 || num(x.d) > 0));
const parseYmd = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
const EXCUSED = { sick: 1, injured: 1, break: 1 };
const CATS = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', legs: 'Legs', core: 'Core', cardio: 'Cardio', other: 'Other' };
const PPL = { chest: 'Push', shoulders: 'Push', triceps: 'Push', back: 'Pull', biceps: 'Pull', legs: 'Legs', core: 'Core', cardio: 'Other', other: 'Other' };
function guessCat(name) {
  const n = ' ' + norm(name) + ' ';
  if (/ leg curl| leg ext| squat| lunge| leg press| calf| romanian| rdl | hip thrust| glute| hamstring| quad| step up| split squat/.test(n)) return 'legs';
  if (/ crunch| plank| ab | abs | core | sit up| leg raise| oblique| russian twist| hollow/.test(n)) return 'core';
  if (/ run | running| bike| cycling| treadmill| elliptical| cardio| jump rope| stair/.test(n)) return 'cardio';
  if (/ tricep| pushdown| push down| skull| dip | dips |close grip|overhead .*ext| kickback/.test(n)) return 'triceps';
  if (/ curl/.test(n)) return 'biceps';
  if (/ rear delt| face pull| lateral| cuban| shoulder| overhead .*press| military| arnold| delt| upright row| behind the back/.test(n)) return 'shoulders';
  if (/ row | rows | pulldown| pull down| pull up| pullup| chin| lat | deadlift| shrug| back ext| pullover/.test(n)) return 'back';
  if (/ chest| bench| fly | flies| flye| push up| pushup| pec | tits| dip /.test(n)) return 'chest';
  return 'other';
}
const exCat = id => (S.meta.exCat && S.meta.exCat[id]) || getEx(id).cat || guessCat(exName(id));
const DAY_MARKS = { rest: 'Rest day', sick: 'Sick', injured: 'Injured', break: 'Break' };

const allEx = () => ({ ...BUILTIN_EX, ...S.meta.exercises });
const getEx = id => S.meta.exercises[id] || BUILTIN_EX[id] || { id, name: 'Unknown exercise', kind: 'other' };
const exName = id => getEx(id).name;
const exKind = id => getEx(id).kind || 'other';
const findEx = name => findIn(S.meta.exercises, BUILTIN_EX)(name);
const isHidden = id => (S.meta.hidden || []).includes(id);
const libBase = id => BUILTIN_ROUTINES.find(r => r.id === id) || null;
const myRoutines = () => Object.values(S.meta.routines).filter(r => !r.base).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const routineKey = r => JSON.stringify([r.name, r.days.map(d => [d.id, d.name, d.tags && d.tags.length ? d.tags : null, d.items.map(i => [i.id, i.ex, +i.sets, i.reps || '', !!i.ss, i.group || '', i.note || ''])])]);
/* An edit of a library routine counts only while it differs from the library version. */
const libOver = id => { const o = S.meta.routines[id], b = libBase(id); return o && b && routineKey(o) !== routineKey(b) ? o : null; };
const libRoutines = () => BUILTIN_ROUTINES.filter(r => !isHidden(r.id)).map(r => libOver(r.id) || r);
const allRoutines = () => [...myRoutines(), ...libRoutines()];
const getRoutine = id => isHidden(id) ? null : libBase(id) ? (libOver(id) || libBase(id)) : (S.meta.routines[id] || null);

function materialize(days) {
  return days.map(d => ({ id: uid('d'), name: d.name, items: d.items.map(it => {
    let ex = findEx(it.name);
    if (!ex) { ex = { id: 'u-' + slug(it.name) + '-' + Math.random().toString(36).slice(2, 5), name: titleCase(it.name), kind: guessKind(it.name) }; S.meta.exercises[ex.id] = ex; }
    return { id: uid('i'), ex: ex.id, sets: it.sets, reps: it.reps || '', group: '', ss: !!it.ss };
  }) }));
}

/* ============ History, PRs ============ */
const DEMO = { on: false, list: null }; /* sample data shown only during the walkthrough */
let _sl = null, _slv = -1;
function sessionList() { if (DEMO.on) return demoSessions(); if (_slv !== S.ver) { _sl = Object.values(S.sessions).sort((a, b) => a.startedAt - b.startedAt); _slv = S.ver; } return _sl; }
function entries(exId, group) {
  const out = [];
  for (const x of sessionList()) for (const it of x.items) if (it.ex === exId && (group === undefined || (it.group || '') === group))
    out.push({ t: x.startedAt, sid: x.id, group: it.group || '', sets: toMain(it.sets, it.u), raw: it.sets, u: it.u || U(), note: it.note || '' });
  return out;
}
const lastEntry = (exId, group) => { const e = entries(exId, group); return e[e.length - 1] || null; };
function entryStats(sets, kind) {
  let top = 0, e1 = 0, reps = 0, vol = 0, best = null, minAssist = Infinity, total = 0;
  for (const s of sets) {
    const w = +s.w || 0, r = +s.r || 0; if (r <= 0) continue;
    if (r > reps) reps = r; if (w > top) top = w;
    const e = epley(w, r); if (e > e1 || !best) { e1 = Math.max(e1, e); best = s; }
    vol = Math.max(vol, w * r); total += w * r;
    if (w < minAssist) minAssist = w;
  }
  if (kind === 'bodyweight' || kind === 'assisted') best = sets.reduce((b, s) => (!b || (+s.r) > (+b.r)) ? s : b, null);
  return { top, e1, reps, vol, best, minAssist, total };
}
const defaultMetric = kind => (kind === 'bodyweight' || kind === 'assisted') ? 'reps' : 'e1';
const METRICS = { e1: 'Est. 1RM', top: 'Top weight', reps: 'Best reps' };
function metricVal(st, metric) { return metric === 'reps' ? st.reps : metric === 'top' ? st.top : st.e1; }
function bestSetLabel(sets, kind) {
  if (isMeasured(kind)) return measBest(sets, kind);
  const st = entryStats(sets, kind); const b = st.best; if (!b) return '';
  if (kind === 'bodyweight' && !(+b.w)) return b.r + ' reps';
  return fmt(+b.w) + (kind === 'assisted' ? ' asst' : '') + ' × ' + b.r;
}
/* Personal records. Each type can be turned off in Profile. A first session sets the baseline; ties never count. */
const PR_DEF = { weight: true, reps: true, setvol: false, sessvol: true, run: true, ranges: true, sound: true };
const prOpts = () => ({ ...PR_DEF, ...((S.meta.settings && S.meta.settings.pr) || {}) });
const noE1 = a => (a || []).filter(p => typeof p === 'string' ? !/^Best est\. 1RM/.test(p) : p.type !== 'e1rm');
const prText = p => p.label + ': ' + p.value + (p.prev ? ' (was ' + p.prev + ')' : '');
function prReasons(cur, pool, kind, unit, P) {
  const out = []; if (!pool.length || !(cur.r > 0)) return out;
  const show = v => fmt(r05(conv(v, U(), unit))) + ' ' + unit; const w = cur.w, r = cur.r;
  const maxOf = f => Math.max(...pool.map(f));
  if (kind === 'bodyweight') { const best = maxOf(x => x.r); if (P.reps && r > best) out.push({ type: 'reps', label: 'Most reps', value: r + ' reps', prev: best + ' reps', score: r }); return out; }
  if (kind === 'assisted') {
    const best = maxOf(x => x.r); if (P.reps && r > best) out.push({ type: 'reps', label: 'Most reps', value: r + ' reps', prev: best + ' reps', score: r });
    const minA = Math.min(...pool.map(x => x.w)); if (P.weight && w < minA - 0.05) out.push({ type: 'assist', label: 'Least assistance', value: show(w), prev: show(minA), score: -w });
    return out;
  }
  if (P.weight) { const best = maxOf(x => x.w); if (w > best + 0.05) out.push({ type: 'weight', label: 'Heaviest weight', value: show(w) + ' × ' + r, prev: show(best), score: w }); }
  if (P.reps) { const atW = pool.filter(x => x.w >= w - 0.05); if (atW.length) { const best = Math.max(...atW.map(x => x.r)); if (r > best) out.push({ type: 'reps', label: 'Rep PR', value: r + ' reps at ' + show(w), prev: best + (best === 1 ? ' rep' : ' reps'), score: r + w / 1e4 }); } }
  if (P.setvol) { const best = maxOf(x => x.w * x.r); if (w * r > best + 0.5) out.push({ type: 'setvol', label: 'Best single set', value: fmtBig(conv(w * r, U(), unit)) + ' ' + unit + ' moved', prev: fmtBig(conv(best, U(), unit)) + ' ' + unit, score: w * r }); }
  return out;
}
function detectPRs(session) {
  const P = prOpts(); const prs = [];
  for (const it of session.items) {
    const kind = exKind(it.ex); if (isMeasured(kind)) { prs.push(...measuredPRs(session, it)); continue; }
    const u = it.u || U(); const cur = toMain(it.sets, it.u).filter(x => +x.r > 0).map(x => ({ w: +x.w || 0, r: +x.r, m: x.m || '' }));
    const scopes = [undefined]; if (P.ranges && it.group) scopes.push(it.group); const got = new Set();
    for (const g of scopes) {
      const prior = entries(it.ex, g).filter(e => e.sid !== session.id && e.t < session.startedAt); if (!prior.length) continue;
      const pool = prior.flatMap(e => e.sets.filter(x => +x.r > 0).map(x => ({ w: +x.w || 0, r: +x.r, m: x.m || '' })));
      const best = {};
      for (const x of cur) for (const p of prReasons(x, x.m ? pool.filter(y => y.m === x.m) : pool, kind, u, P)) if (!best[p.type] || p.score > best[p.type].score) best[p.type] = p;
      if (P.sessvol && kind !== 'bodyweight' && kind !== 'assisted') {
        const vol = cur.reduce((a, x) => a + x.w * x.r, 0); const pv = Math.max(...prior.map(e => e.sets.reduce((a, x) => a + (+x.w || 0) * (+x.r || 0), 0)));
        if (pv > 0 && vol > pv + 0.5) best.sessvol = { type: 'sessvol', label: 'Session volume', value: fmtBig(conv(vol, U(), u)) + ' ' + u, prev: fmtBig(conv(pv, U(), u)) + ' ' + u, score: vol };
      }
      for (const t of Object.keys(best)) { if (g !== undefined && got.has(t)) continue; if (g === undefined) got.add(t); const p = best[t]; prs.push({ ex: it.ex, group: g || '', type: t, label: p.label, value: p.value, prev: p.prev }); }
    }
  }
  return prs;
}
/* ============ Training prescriptions ============ */
const repTop = reps => { const m = String(reps || '').match(/(\d+)\s*$/); return m ? +m[1] : 0; };
function lastEntryOcc(exId, group, occ) {
  const pc = prefillCtx(); if (pc) { const h = lastEntryOccIn(exId, group, occ, s => sameWorkout(s, pc)); if (h) return { ...h, scoped: true }; }
  const list = sessionList();
  for (let i = list.length - 1; i >= 0; i--) {
    const x = list[i]; const its = x.items.filter(it => it.ex === exId && (it.group || '') === group);
    if (its.length) { const it = its[Math.min(occ || 0, its.length - 1)]; return { t: x.startedAt, sid: x.id, group, sets: toMain(it.sets, it.u), raw: it.sets, u: it.u || U(), note: it.note || '' }; }
  }
  return null;
}
/* A converted weight (225 lb → 102.06 kg) is rounded to the jump for that unit, so suggestions can actually be loaded */
const roundToInc = (v, inc) => inc > 0 ? Math.round(v / inc) * inc : r05(v);
function refill(it, occ) {
  if (isMeasured(exKind(it.ex))) { if (occ === undefined) { const same = S.active ? S.active.items.filter(o => o.ex === it.ex) : []; occ = Math.max(0, same.indexOf(it)); } refillMeasured(it, occ); return; }
  if (occ === undefined) { const same = S.active ? S.active.items.filter(o => o.ex === it.ex && (o.group || '') === (it.group || '')) : []; occ = Math.max(0, same.indexOf(it)); }
  refillLift(it, occ);
}
function makeSlot(item, occ) {
  const n = item.sets || 3;
  const it = { id: uid('i'), slot: item.id || null, ex: item.ex, group: item.group || '', ss: !!item.ss, u: slotUnit(item.ex), note: '', target: Object.assign({ sets: n, reps: item.reps || '', cue: item.note || '' }, isMeasured(exKind(item.ex)) ? resolveTg(item) : {}),
    sets: Array.from({ length: n }, () => ({ id: uid('t'), w: '', r: '', n: '' })) };
  refill(it, occ || 0); initMachine(it); return it;
}
/* ============ Calendar, streaks, projections ============ */
const ymd = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = d => { const x = startOfDay(d); const dow = (x.getDay() + 6) % 7; return addDays(x, -dow); };
function dayCounts() { const m = {}; for (const s of sessionList()) { const k = ymd(s.startedAt); m[k] = (m[k] || 0) + 1; } return m; }
function weekStats(now = new Date()) {
  const goal = Math.max(1, S.meta.settings.goal | 0);
  const counts = {}; for (const x of sessionList()) { const k = ymd(startOfWeek(x.startedAt)); counts[k] = (counts[k] || 0) + 1; }
  const exc = {};
  if (S.meta.settings.excuse) for (const [d, m] of Object.entries(S.meta.dayMarks || {})) if (EXCUSED[m]) { const k = ymd(startOfWeek(parseYmd(d))); exc[k] = (exc[k] || 0) + 1; }
  const status = k => { const req = Math.max(0, goal - (exc[k] || 0)); const c = counts[k] || 0; return req === 0 ? (c > 0 ? 'met' : 'paused') : (c >= req ? 'met' : 'miss'); };
  const thisWeek = startOfWeek(now); const tk = ymd(thisWeek); const thisCount = counts[tk] || 0;
  const thisExc = exc[tk] || 0, thisReq = Math.max(0, goal - thisExc);
  let cur = status(tk) === 'met' ? 1 : 0, paused = 0;
  let w = addDays(thisWeek, -7);
  for (let g = 0; g < 520; g++) { const st = status(ymd(w)); if (st === 'met') cur++; else if (st === 'paused') paused++; else break; w = addDays(w, -7); }
  const list = sessionList();
  const firstT = Math.min(list.length ? list[0].startedAt : Infinity, ...Object.keys(exc).map(k => +parseYmd(k)));
  let longest = 0, run = 0;
  if (isFinite(firstT)) { let x = startOfWeek(firstT); while (x <= thisWeek) { const st = status(ymd(x)); if (st === 'met') { run++; longest = Math.max(longest, run); } else if (st === 'miss' && +x !== +thisWeek) run = 0; x = addDays(x, 7); } }
  const last = list.length ? list[list.length - 1].startedAt : null;
  const daysSince = last ? Math.floor((startOfDay(now) - startOfDay(last)) / DAY) : null;
  const last28 = list.filter(x => x.startedAt >= +now - 28 * DAY).length;
  return { goal, thisCount, thisReq, thisExc, cur, paused, longest, daysSince, last28, total: list.length };
}
/* Detraining model: strength holds ~10 days, then fades ~0.3%/day, floored at 75% of the last logged level. */
const GRACE = 10, FADE = 0.003, FLOOR = 0.75, HORIZON = 56;
const retain = d => d <= GRACE ? 1 : Math.max(FLOOR, 1 - FADE * (d - GRACE));
function project(points, now = Date.now()) {
  if (!points.length) return null;
  const last = points[points.length - 1];
  const recent = points.filter(p => p.t >= now - 90 * DAY).slice(-10);
  let slope = 0;
  if (recent.length >= 2) {
    const xs = recent.map(p => (p.t - recent[0].t) / DAY), ys = recent.map(p => p.v);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let sxx = 0, sxy = 0; xs.forEach((x, i) => { sxx += (x - mx) ** 2; sxy += (x - mx) * (ys[i] - my); });
    slope = sxx > 0 ? sxy / sxx : 0;
  }
  const cap = last.v * 0.015 / 7; slope = Math.max(-cap, Math.min(cap, slope));
  const goal = Math.max(1, S.meta.settings.goal | 0);
  const done28 = sessionList().filter(s => s.startedAt >= now - 28 * DAY && s.startedAt <= now).length;
  const adherence = Math.min(1, done28 / (goal * 4));
  const daysOff = Math.max(0, (now - last.t) / DAY);
  const today = last.v * retain(daysOff);
  const eff = slope > 0 ? slope * adherence : slope;
  return { last, today, slope, eff, adherence, done28, planned: goal * 4, daysOff,
    keep: d => Math.max(0, today + eff * d), stop: d => last.v * retain(daysOff + d) };
}
function seriesFor(exId, group, metric) {
  const kind = exKind(exId);
  return entries(exId, group).map(e => ({ t: e.t, v: metricVal(entryStats(e.sets, kind), metric), sets: e.sets })).filter(p => p.v > 0);
}
function plates(total, unit) {
  const st = S.meta.settings; const u = unit || st.unit;
  const bar = u === st.unit ? +st.bar || 0 : (u === 'kg' ? 20 : 45);
  let side = (total - bar) / 2; if (side < -1e-9) return null;
  if (side < 1e-9) return 'Empty bar';
  const fn = typeof fineFor === 'function' ? fineFor(u) : 5; const P = u === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25].concat(fn <= 1 ? [0.5] : [], fn <= 0.5 ? [0.25] : []) : [45, 35, 25, 10, 5, 2.5].concat(fn <= 2.5 ? [1.25] : [], fn <= 1 ? [0.5] : []);
  const out = []; for (const p of P) while (side >= p - 1e-9) { out.push(p); side -= p; }
  return 'Per side: ' + out.map(x => x < 2 ? String(x) : fmt(x)).join(' · ') + (side > 0.01 ? ' (+' + fmt(side) + ')' : '');
}

/* ============ Challenges ============ */
function newChallenge() {
  const today = ymd(new Date());
  return { id: uid('c'), name: 'Iron 75', days: 75, start: today, restart: true, restPerWeek: 0, createdAt: Date.now(), log: {},
    items: [{ id: uid('k'), name: 'Workout 1', auto: 'w1' }, { id: uid('k'), name: 'Workout 2', auto: 'w2' }, { id: uid('k'), name: 'Water', auto: null }, { id: uid('k'), name: 'Macros', auto: null }] };
}
const chItemsOn = (ch, k) => ch.items.filter(it => !it.since || it.since <= k);
function chChecked(ch, it, k, wc) { const e = (ch.log || {})[k]; return !!(e && e.c && e.c[it.id]) || chAutoOn(ch, it, k, wc); }
/* Walks every day from the start. Done = every item checked. A missed day restarts the run when restart is on.
   Rest days (up to the weekly allowance) count as done. Sick, injured and break days pause it when that setting is on. */
function challengeState(ch, todayK = ymd(new Date())) {
  const counts = dayCounts(); const marks = S.meta.dayMarks || {}; const excuse = !!S.meta.settings.excuse;
  const days = []; const end = parseYmd(todayK); let d = parseYmd(ch.start);
  let count = 0, best = 0, missed = 0, attempt = 1, runStart = ch.start, finishedOn = null, elapsed = 0, pausedN = 0;
  while (d <= end && !finishedOn) {
    const k = ymd(d); const e = (ch.log || {})[k] || {}; const wc = counts[k] || 0; const items = chItemsOn(ch, k);
    const complete = items.length > 0 && items.every(it => chChecked(ch, it, k, wc));
    let status;
    if (complete) status = 'done';
    else if (e.rest) status = 'rest';
    else if (excuse && EXCUSED[marks[k]]) status = 'paused';
    else status = k === todayK ? 'today' : 'missed';
    if (status === 'paused') pausedN++; else elapsed++;
    if (status === 'done' || status === 'rest') { count++; best = Math.max(best, count); if (ch.restart && count >= ch.days) finishedOn = k; }
    else if (status === 'missed') { missed++; if (ch.restart) { attempt++; count = 0; runStart = ymd(addDays(d, 1)); } }
    if (!ch.restart && elapsed >= ch.days && status !== 'today') finishedOn = k;
    days.push({ k, status, mark: marks[k] || null });
    d = addDays(d, 1);
  }
  const today = days.find(x => x.k === todayK) || null;
  const todayIn = !!(today && (today.status === 'done' || today.status === 'rest'));
  const dayNum = ch.restart ? Math.min(ch.days, count + (todayIn ? 0 : 1)) : Math.min(ch.days, elapsed);
  const started = parseYmd(ch.start) <= end;
  const left = ch.restart ? ch.days - count - (todayIn ? 0 : 1) : ch.days - elapsed;
  const projectedEnd = finishedOn ? parseYmd(finishedOn) : started ? addDays(end, Math.max(0, left)) : addDays(parseYmd(ch.start), ch.days - 1);
  return { days, count, best, missed, attempt, runStart, finishedOn, today, todayIn, dayNum, started, elapsed, pausedN, projectedEnd };
}
function restUsedInWeek(ch, k) {
  const ws = startOfWeek(parseYmd(k)); let n = 0;
  for (let i = 0; i < 7; i++) { const e = (ch.log || {})[ymd(addDays(ws, i))]; if (e && e.rest) n++; }
  return n;
}

/* ============ Persistence: this device first, then the Claude account ============ */
const LS = 'liftbook.v1';
const SCHEMA = 2;  /* stored-data version; bump when the shape changes and add a step to migrateData */
/* Older data is brought up to the current shape here, one version at a time */
function migrateData(l) {
  if (!l || typeof l !== 'object') return l;
  let v = +l.schema || 1;
  if (v < 2) { /* v1 → v2: timers stored alongside the active workout; nothing to convert */ v = 2; }
  l.schema = v; return l;
}
/* If the saved data can't be read, keep the raw text (and a copy under its own key) and refuse to write over it:
   the first save after an empty start would otherwise erase the only copy. */
let lsBroken = null, lsFull = false;
function lsLoad() {
  let raw = null; try { raw = localStorage.getItem(LS); } catch (e) { return null; }
  if (!raw) return null;
  try { const v = JSON.parse(raw); if (v && typeof v === 'object') return v; } catch (e) {}
  lsBroken = raw;
  try { localStorage.setItem(LS + '.corrupt-' + Date.now(), raw); } catch (e) {}
  return null;
}
function lsSave() { return storeSave(); }
function lsSaveLocalOnly() {
  if (lsBroken) return false;
  try {
    localStorage.setItem(LS, JSON.stringify({ schema: SCHEMA, meta: S.meta, sessions: S.sessions, active: S.active, activeAt: S.activeAt, dirty: [...S.dirty], rest: S.rest || null, itimer: S.itimer || null }));
    if (lsFull) { lsFull = false; if (S.sync === 'full') S.sync = col ? 'pending' : 'local'; }
    return true;
  } catch (e) {
    /* Full (or blocked) storage: say so, loudly and once, instead of pretending the save worked */
    if (!lsFull) { lsFull = true; showToast({ kind: 'bad', text: 'Storage is full. Your changes aren’t being saved. Save a backup file now.', ms: 9000 }); }
    S.sync = 'full';
    return false;
  }
}
const lsGet = k => { try { return localStorage.getItem('liftbook.' + k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem('liftbook.' + k, v); } catch (e) {} };
let col = null, flushing = false, flushTimer = null;
/* Typing during a workout changes only the active workout; those saves wait 400 ms so each keystroke doesn't rewrite
   the whole database. Anything else saves at once, and a pending save is written before the app goes to the background. */
let lsTimer = null;
/* Another tab (desktop) saved: take its data unless a workout is being logged here */
addEventListener('storage', e => {
  if (e.key !== LS || !e.newValue || lsBroken) return;
  if (S.active) { showToast({ kind: 'info', text: 'Ironwood is open in another tab. Finish here before using it there.', ms: 6000 }); return; }
  const l = migrateData(lsLoad()); if (!l) return;
  S.meta = normalizeMeta(l.meta); S.sessions = cleanSessions(l.sessions).sessions; S.active = l.active && typeof l.active === 'object' ? l.active : null; S.activeAt = l.activeAt || 0;
  migrateExIds(S); S.ver++; S.rerender();
});
function lsFlush() { if (lsTimer) { clearTimeout(lsTimer); lsTimer = null; lsSave(); } }
addEventListener('pagehide', lsFlush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') lsFlush(); });
function schedule(keys, delay = 700) {
  const standalone = !!(window.claude && window.claude.standalone);
  for (const k of [].concat(keys)) { if (!standalone) S.dirty.add(k); if (k === 'active') S.activeAt = Date.now(); }
  if ([].concat(keys).every(k => k === 'active')) { clearTimeout(lsTimer); lsTimer = setTimeout(() => { lsTimer = null; lsSave(); }, 400); }
  else { clearTimeout(lsTimer); lsTimer = null; lsSave(); }
  if (!col) return;
  if (S.sync === 'synced') S.sync = 'pending';
  clearTimeout(flushTimer); flushTimer = setTimeout(flush, delay);
}
function commit(fn, keys, delay) { fn(S); if ([].concat(keys).includes('meta')) S.meta.updatedAt = Date.now(); S.ver++; schedule(keys, delay); S.rerender(); }
async function flush() {
  if (!col || flushing) return; flushing = true; let stalled = false;
  try {
    for (const key of [...S.dirty]) {
      S.dirty.delete(key);
      try {
        if (key.startsWith('del:')) await col.doc(key.slice(4)).delete();
        else if (key === 'meta') await col.doc('meta').set(clone(S.meta));
        else if (key === 'active') await col.doc('active').set({ s: S.active ? clone(S.active) : null, updatedAt: S.activeAt || Date.now() });
        else if (key.startsWith('s_')) { const s = S.sessions[key.slice(2)]; if (s) await col.doc(key).set(clone(s)); }
      } catch (e) {
        S.dirty.add(key); stalled = true;
        const c = e && e.code;
        if (c === 'revoked' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed') { col = null; S.sync = 'local'; }
        else if (c === 'quota_exceeded') S.sync = 'full';
        else { S.sync = 'offline'; setTimeout(flush, 20000); }
        break;
      }
    }
    if (!stalled && S.sync !== 'over' && S.sync !== 'full') S.sync = S.dirty.size ? 'pending' : 'synced';
  } finally {
    flushing = false; lsSave(); S.rerender();
    if (!stalled && S.dirty.size && col) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 400); }
  }
}
async function initCloud() {
  const C = window.claude;
  if (!C || !C.use) { S.sync = 'local'; S.rerender(); return; }
  try {
    const [db, user] = await Promise.all([C.use('db'), C.use('user')]);
    const id = user ? await user.id() : null;
    if (!db || !id) { S.sync = 'local'; S.rerender(); return; }
    const c = db.collection('data/users/' + id);
    const snap = await c.get();
    const R = { meta: null, sessions: {}, active: null };
    snap.docs.forEach(d => { const v = d.data(); if (!v) return; if (d.id === 'meta') R.meta = clone(v); else if (d.id === 'active') R.active = clone(v); else if (d.id.startsWith('s_')) R.sessions[d.id.slice(2)] = clone(v); });
    const del = new Set([...(S.meta.deleted || []), ...((R.meta && R.meta.deleted) || [])]);
    if (R.meta && (R.meta.updatedAt || 0) >= (S.meta.updatedAt || 0)) { S.meta = normalizeMeta(R.meta); S.dirty.delete('meta'); }
    else if (S.meta.updatedAt) S.dirty.add('meta');
    if (del.size !== (S.meta.deleted || []).length) { S.meta.deleted = [...del]; S.dirty.add('meta'); }
    for (const [sid, s] of Object.entries(R.sessions)) {
      if (del.has(sid)) { S.dirty.add('del:s_' + sid); continue; }
      const l = S.sessions[sid]; if (!l || (s.updatedAt || 0) >= (l.updatedAt || 0)) { S.sessions[sid] = s; S.dirty.delete('s_' + sid); }
    }
    for (const sid of Object.keys(S.sessions)) { if (del.has(sid)) delete S.sessions[sid]; else if (!R.sessions[sid]) S.dirty.add('s_' + sid); }
    if (R.active && (R.active.updatedAt || 0) > (S.activeAt || 0)) { S.active = R.active.s || null; S.activeAt = R.active.updatedAt; S.dirty.delete('active'); }
    else if (S.activeAt && (!R.active || (R.active.updatedAt || 0) < S.activeAt)) S.dirty.add('active');
    col = c; S.ver++; S.sync = S.dirty.size ? 'pending' : 'synced'; lsSave(); S.rerender();
    if (S.dirty.size) flush();
    addEventListener('online', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.dirty.size) flush(); });
  } catch (e) { S.sync = 'local'; S.rerender(); }
}

