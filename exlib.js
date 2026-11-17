/* ============ Exercise library data (Nov 17, 2026) ============
   One canonical record per lifting exercise: what it trains, how it moves, what it needs, how fiddly it is to set up.
   Used by the swap suggestions, program coverage, equipment lists, session times and weight jumps.
   Row: [name, kind, cat, muscles, patterns, equipment, setup, how-to, also-known-as]
     muscles: 'quads glutes/.5' = quads count 1 set, glutes half a set (indirect work)
     patterns: first one is the main movement; swaps keep it
     setup: 1 = pick it up or sit down, 2 = a bench, a pin or a cable attachment, 3 = load a barbell in a rack
   Old ids for the same movement point here through EX_RENAMED, so history, prefills and PRs follow the movement. */
const MUSCLES = { chest: 'Chest', uchest: 'Upper chest', lats: 'Lats', upperback: 'Upper back', erectors: 'Lower back', frontdelt: 'Front delts', sidedelt: 'Side delts', reardelt: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms and grip', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', adductors: 'Adductors', calves: 'Calves', abs: 'Abs and core' };
const PATTERNS = { hpush: 'chest press', incline: 'incline press', vpush: 'overhead press', fly: 'chest fly', dip: 'dip', hpull: 'row', vpull: 'pull-down or pull-up', pullover: 'straight-arm pull',
  shrug: 'shrug', latraise: 'lateral raise', reardelt: 'rear-delt pull', squat: 'squat', legpress: 'leg press', lunge: 'single-leg squat or lunge', hinge: 'hip hinge', hipext: 'hip thrust or bridge',
  kneeext: 'knee extension', kneeflex: 'knee flexion (leg curl)', calf: 'calf raise', elbowflex: 'curl', elbowext: 'triceps extension', trunkflex: 'ab crunch or leg raise', antiext: 'core bracing',
  antirot: 'anti-rotation', latflex: 'side bend', carry: 'loaded carry', grip: 'grip hold' };
/* Close cousins: offered after exact matches, never instead of them */
const PATTERN_NEAR = { squat: ['legpress', 'lunge'], legpress: ['squat', 'lunge'], lunge: ['squat', 'legpress'], hpush: ['incline', 'dip'], incline: ['hpush'], dip: ['hpush', 'elbowext'],
  hinge: ['hipext'], hipext: ['hinge'], vpull: ['pullover'], pullover: ['vpull'], antiext: ['trunkflex', 'antirot'], trunkflex: ['antiext'], antirot: ['antiext', 'latflex'], latflex: ['antirot'], shrug: ['carry'] };
const EQUIP = { barbell: 'Barbell', dumbbell: 'Dumbbells', cable: 'Cable', machine: 'Machine', bench: 'Bench', rack: 'Rack', bar: 'Pull-up bar', bodyweight: 'Bodyweight', kettlebell: 'Kettlebell', band: 'Band' };
const SETUP = { 1: 'Easy setup', 2: 'Some setup', 3: 'More setup' };
const EX_LIB = [
  /* Chest */
  ['Bench Press', 'barbell', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'barbell bench rack', 3, 'Lie on a flat bench, feet planted, shoulder blades pinched. Lower the bar to mid-chest, press back up over the shoulders.'],
  ['Dumbbell Bench Press', 'dumbbell', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'dumbbell bench', 2, 'Flat bench, a dumbbell in each hand over the chest. Lower until the elbows are a little below the bench, press back up.'],
  ['Machine Chest Press', 'machine', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'machine', 1, 'Set the seat so the handles line up with mid-chest. Press out, stop just short of locking the elbows, return under control.'],
  ['Decline Chest Press', 'machine', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'machine', 1, 'Decline press machine (or decline bench). Press down and out toward the lower chest line, return slowly.'],
  ['Push-Ups', 'bodyweight', 'chest', 'chest triceps/.5 frontdelt/.5 abs/.5', 'hpush', 'bodyweight', 1, 'Hands a little wider than the shoulders, body in one straight line. Lower the chest to just above the floor, push back up.', ['Push-Up']],
  ['Dumbbell Floor Press', 'dumbbell', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'dumbbell', 1, 'Lie on the floor with knees bent. Lower the dumbbells until the upper arms touch the floor, press back up.'],
  ['Smith Machine Bench Press', 'machine', 'chest', 'chest triceps/.5 frontdelt/.5', 'hpush', 'machine bench', 2, 'Bench under a Smith machine so the bar lands on mid-chest. Unhook, lower under control, press up.'],
  ['Incline Barbell Bench Press', 'barbell', 'chest', 'chest uchest frontdelt/.5 triceps/.5', 'incline hpush', 'barbell bench rack', 3, 'Bench at about 30 degrees. Lower the bar to the upper chest, press back up over the shoulders.'],
  ['Incline Dumbbell Press', 'dumbbell', 'chest', 'chest uchest frontdelt/.5 triceps/.5', 'incline hpush', 'dumbbell bench', 2, 'Bench at about 30 degrees. Lower the dumbbells to the sides of the upper chest, press up and slightly in.'],
  ['Incline Machine Press', 'machine', 'chest', 'chest uchest frontdelt/.5 triceps/.5', 'incline hpush', 'machine', 1, 'Incline press machine. Seat so the handles line up with the upper chest; press up and out, return slowly.'],
  ['Incline Reverse-Grip Squeeze Press', 'dumbbell', 'chest', 'chest uchest triceps/.5', 'incline hpush', 'dumbbell bench', 2, 'Incline bench. Hold the dumbbells pressed together, palms toward your face, pinkie-side touching. Press up only until the chest finishes the work, not the tris.'],
  ['Cable Fly', 'cable', 'chest', 'chest', 'fly', 'cable', 2, 'Handles at shoulder height, a step forward, slight bend in the elbows. Bring the hands together in a hugging arc, open back to a stretch.', ['Cable Crossover', 'Cable Flye']],
  ['Low-to-High Cable Fly', 'cable', 'chest', 'chest uchest', 'fly incline', 'cable', 2, 'Handles low. Sweep up and in to eye level with soft elbows, lower back to a stretch.'],
  ['Pec Deck', 'machine', 'chest', 'chest', 'fly', 'machine', 1, 'Seat so the handles are at chest height. Bring the arms together in an arc, open slowly to a comfortable stretch.', ['Machine Fly']],
  ['Dumbbell Fly', 'dumbbell', 'chest', 'chest', 'fly', 'dumbbell bench', 2, 'Flat bench, arms over the chest, slight bend in the elbows. Open wide to a stretch, bring the dumbbells back together.'],
  ['Dips', 'bodyweight', 'chest', 'chest triceps frontdelt/.5', 'dip elbowext', 'bar', 1, 'Parallel bars. Lean slightly forward, lower until the shoulders are a little below the elbows, press back up.'],
  ['Assisted Dips', 'assisted', 'chest', 'chest triceps frontdelt/.5', 'dip elbowext', 'machine', 1, 'Assisted dip machine: more assistance makes it easier. Lower under control, press back up.'],
  ['Bench Dips', 'bodyweight', 'triceps', 'triceps chest/.5', 'dip elbowext', 'bench', 1, 'Hands on a bench behind you, legs out. Bend the elbows to about 90 degrees, press back up.'],
  /* Shoulders */
  ['Overhead Barbell Press', 'barbell', 'shoulders', 'frontdelt sidedelt/.5 triceps/.5', 'vpush', 'barbell rack', 3, 'Standing, bar on the front of the shoulders. Squeeze glutes and abs, press straight up, head through at the top.', ['Standing Overhead Press', 'Overhead Press', 'Military Press']],
  ['Seated Dumbbell Overhead Press', 'dumbbell', 'shoulders', 'frontdelt sidedelt/.5 triceps/.5', 'vpush', 'dumbbell bench', 2, 'Bench upright. Dumbbells at shoulder height, press up until the arms are straight, lower to the shoulders.', ['Dumbbell Shoulder Press']],
  ['Machine Shoulder Press', 'machine', 'shoulders', 'frontdelt sidedelt/.5 triceps/.5', 'vpush', 'machine', 1, 'Seat so the handles start at shoulder height. Press up, lower slowly.'],
  ['Arnold Press', 'dumbbell', 'shoulders', 'frontdelt sidedelt/.5 triceps/.5', 'vpush', 'dumbbell bench', 2, 'Start with palms facing you at the shoulders. Rotate the palms out as you press up, reverse on the way down.'],
  ['Lateral Raises', 'dumbbell', 'shoulders', 'sidedelt', 'latraise', 'dumbbell', 1, 'Slight lean forward, soft elbows. Raise the dumbbells out to the sides to shoulder height, lower slowly.', ['Dumbbell Lateral Raise', 'Side Raise']],
  ['Cable Lateral Raise', 'cable', 'shoulders', 'sidedelt', 'latraise', 'cable', 2, 'Stand beside a low cable, handle in the far hand. Raise the arm out to the side to shoulder height, lower slowly.'],
  ['Behind-the-Back Cable Lateral Raise', 'cable', 'shoulders', 'sidedelt', 'latraise', 'cable', 2, 'Stand beside a low cable with the handle behind your back in the far hand. Raise the arm out to the side to shoulder height, then lower slowly.'],
  ['Cable Lateral Raise Toss', 'cable', 'shoulders', 'sidedelt', 'latraise', 'cable', 2, 'Lateral raise on a low cable done fast, as if tossing the handle out to the side; let it come back under control.'],
  ['Machine Lateral Raise', 'machine', 'shoulders', 'sidedelt', 'latraise', 'machine', 1, 'Pads on the outside of the upper arms. Raise to shoulder height, lower slowly.'],
  ['Barbell Upright Row', 'barbell', 'shoulders', 'sidedelt upperback/.5 biceps/.5', 'latraise shrug', 'barbell', 2, 'Hands shoulder-width. Pull the bar up the body leading with the elbows to about chest height, lower slowly.'],
  ['Face Pulls', 'cable', 'shoulders', 'reardelt upperback/.5', 'reardelt', 'cable', 2, 'Rope at face height. Pull toward the eyes, elbows high and wide, rotate the hands back at the end.', ['Face Pull']],
  ['Dumbbell Rear Delt Fly', 'dumbbell', 'shoulders', 'reardelt upperback/.5', 'reardelt', 'dumbbell', 1, 'Hinge forward with a flat back. Raise the dumbbells out to the sides with soft elbows, lower slowly.', ['Rear Delt Fly']],
  ['Reverse Pec Deck', 'machine', 'shoulders', 'reardelt upperback/.5', 'reardelt', 'machine', 1, 'Face the pec deck, handles at shoulder height. Open the arms back in an arc, return slowly.', ['Reverse Fly Machine']],
  ['Cuban Press', 'dumbbell', 'shoulders', 'reardelt/.5 sidedelt/.5', 'reardelt vpush', 'dumbbell', 1, 'Light dumbbells. Row to chest height with elbows out, rotate the forearms up until vertical, press overhead, then reverse it on the way down.'],
  /* Back */
  ['Lat Pulldown', 'cable', 'back', 'lats biceps/.5 upperback/.5', 'vpull', 'cable machine', 1, 'Thighs under the pad, hands a little wider than the shoulders. Pull the bar to the upper chest, elbows down and back.'],
  ['Pull-Up', 'bodyweight', 'back', 'lats biceps/.5 upperback/.5', 'vpull', 'bar', 1, 'Hang with hands a little wider than the shoulders. Pull until the chin clears the bar, lower all the way.', ['Pull-Ups', 'Pullup']],
  ['Assisted Pull-Up', 'assisted', 'back', 'lats biceps/.5 upperback/.5', 'vpull', 'machine', 1, 'Assisted pull-up machine: more assistance makes it easier. Pull the chin over the bar, lower all the way.'],
  ['Chin-Up', 'bodyweight', 'back', 'lats biceps upperback/.5', 'vpull elbowflex', 'bar', 1, 'Palms facing you, shoulder-width. Pull the chin over the bar, lower all the way.', ['Chin-Ups']],
  ['Single-Arm Cable Pulldown', 'cable', 'back', 'lats biceps/.5', 'vpull', 'cable', 2, 'Kneel or sit under a high cable. Pull the handle down to the side of the chest, elbow toward the hip, let it stretch back up.'],
  ['Barbell Row', 'barbell', 'back', 'upperback lats reardelt/.5 biceps/.5 erectors/.5', 'hpull', 'barbell', 3, 'Hinge to about 45 degrees with a flat back. Row the bar to the lower ribs, lower under control.', ['Bent-Over Barbell Rows', 'Bent-Over Barbell Row', 'Standing Barbell Row', 'Bent Over Row']],
  ['Dumbbell Row', 'dumbbell', 'back', 'upperback lats reardelt/.5 biceps/.5', 'hpull', 'dumbbell bench', 1, 'One hand and knee on a bench. Row the dumbbell toward the hip, lower to a stretch.', ['One-Arm Dumbbell Row']],
  ['Chest-Supported Dumbbell Row', 'dumbbell', 'back', 'upperback lats reardelt/.5 biceps/.5', 'hpull', 'dumbbell bench', 2, 'Lie chest-down on an incline bench. Row both dumbbells up, squeeze the shoulder blades, lower to a stretch.'],
  ['Seated Cable Row', 'cable', 'back', 'upperback lats reardelt/.5 biceps/.5', 'hpull', 'cable', 1, 'Sit tall, feet on the platform. Row the handle to the stomach, squeeze the shoulder blades, let the arms stretch forward.'],
  ['Machine Row', 'machine', 'back', 'upperback lats reardelt/.5 biceps/.5', 'hpull', 'machine', 1, 'Chest on the pad, handles in reach. Row back, squeeze the shoulder blades, return slowly.', ['Seated Machine Row']],
  ['T-Bar Row', 'barbell', 'back', 'upperback lats reardelt/.5 biceps/.5 erectors/.5', 'hpull', 'barbell', 3, 'Straddle the bar with a V-handle. Hinge with a flat back, row to the chest, lower under control.'],
  ['Inverted Row', 'bodyweight', 'back', 'upperback lats/.5 reardelt/.5 biceps/.5', 'hpull', 'bar rack', 2, 'Hang under a bar set at hip height, body straight. Pull the chest to the bar, lower slowly.'],
  ['Rear Delt Rows', 'barbell', 'back', 'reardelt upperback biceps/.5', 'hpull reardelt', 'barbell', 2, 'Like bent rows but elbows out and lighter, pulling to the upper chest rather than the ribs or waist.'],
  ['Dumbbell Pullover', 'dumbbell', 'back', 'lats chest/.5', 'pullover', 'dumbbell bench', 2, 'Lie across or along a bench, one dumbbell over the chest. Lower it behind the head with slightly bent arms, pull back over.'],
  ['Straight-Arm Cable Pulldown', 'cable', 'back', 'lats', 'pullover', 'cable', 1, 'High cable, straight bar or rope. Arms nearly straight, sweep the handle down to the thighs, let it rise slowly.'],
  ['Barbell Shrugs', 'barbell', 'back', 'upperback forearms/.5', 'shrug', 'barbell', 2, 'Hold the bar at arm\'s length. Shrug the shoulders straight up toward the ears, pause, lower.'],
  ['Dumbbell Shrugs', 'dumbbell', 'back', 'upperback forearms/.5', 'shrug', 'dumbbell', 1, 'Dumbbells at your sides. Shrug straight up, pause, lower.'],
  ['Scapular Shrugs', 'dumbbell', 'back', 'upperback', 'shrug', 'dumbbell', 1, 'Dumbbells at your sides, arms straight. Shrug the shoulder blades up and down without bending the elbows.'],
  /* Arms */
  ['Barbell Curl', 'barbell', 'biceps', 'biceps forearms/.5', 'elbowflex', 'barbell', 1, 'Shoulder-width grip, elbows at your sides. Curl up, lower all the way without swinging.', ['Barbell Bicep Curl', 'Barbell Biceps Curl']],
  ['Dumbbell Curl', 'dumbbell', 'biceps', 'biceps forearms/.5', 'elbowflex', 'dumbbell', 1, 'Palms forward, elbows at your sides. Curl up, lower all the way.', ['Dumbbell Bicep Curl']],
  ['Hammer Curls', 'dumbbell', 'biceps', 'biceps forearms/.5', 'elbowflex', 'dumbbell', 1, 'Palms facing each other the whole rep. Curl up, lower all the way.', ['Hammer Curl']],
  ['Hybrid Curls', 'dumbbell', 'biceps', 'biceps forearms/.5', 'elbowflex', 'dumbbell', 1, 'A mix of hammer curls and Zottman curls. Hammer: palms facing each other the whole rep. Zottman: curl up palms up, turn the palms down at the top, lower slowly.'],
  ['Cable Curl', 'cable', 'biceps', 'biceps forearms/.5', 'elbowflex', 'cable', 1, 'Low cable, straight or EZ bar. Elbows at your sides, curl up, lower slowly.'],
  ['Preacher Curl', 'machine', 'biceps', 'biceps', 'elbowflex', 'machine', 1, 'Upper arms on the pad. Curl up, lower slowly to almost straight.', ['Machine Preacher Curl']],
  ['Incline Dumbbell Curl', 'dumbbell', 'biceps', 'biceps', 'elbowflex', 'dumbbell bench', 2, 'Lie back on a 45-60 degree bench, arms hanging. Curl up without moving the elbows forward, lower to a full stretch.'],
  ['Tricep Pushdowns', 'cable', 'triceps', 'triceps', 'elbowext', 'cable', 1, 'High cable, bar or rope. Elbows pinned at your sides, push down until straight, let it come back to about 90 degrees.', ['Tricep Pushdown', 'Triceps Pushdown', 'Cable Pushdown']],
  ['Overhead Cable Tricep Extension', 'cable', 'triceps', 'triceps', 'elbowext', 'cable', 2, 'Face away from a cable with the rope behind your head. Straighten the arms overhead, lower back to a deep stretch.', ['Overhead Tricep Extension']],
  ['Dumbbell Overhead Tricep Extension', 'dumbbell', 'triceps', 'triceps', 'elbowext', 'dumbbell', 1, 'Hold one dumbbell overhead with both hands. Lower it behind the head, straighten back up.'],
  ['Skull Crushers', 'other', 'triceps', 'triceps', 'elbowext', 'barbell bench', 2, 'Lie on a bench, EZ bar over the forehead. Bend only the elbows to lower it toward the head, straighten back up.', ['Lying Tricep Extension']],
  ['Dumbbell Kickback', 'dumbbell', 'triceps', 'triceps', 'elbowext', 'dumbbell bench', 1, 'Hinge forward, upper arm by your side. Straighten the elbow back, lower slowly.'],
  /* Legs */
  ['Back Squat', 'barbell', 'legs', 'quads glutes adductors/.5 erectors/.5', 'squat', 'barbell rack', 3, 'Bar on the upper back, feet about shoulder-width. Sit down between the heels as deep as you can with a flat back, stand up.', ['Squat', 'Barbell Squat', 'Squats']],
  ['Front Squat', 'barbell', 'legs', 'quads glutes adductors/.5', 'squat', 'barbell rack', 3, 'Bar on the front of the shoulders, elbows high. Squat down with an upright chest, stand up.'],
  ['Goblet Squat', 'dumbbell', 'legs', 'quads glutes adductors/.5', 'squat', 'dumbbell', 1, 'Hold one dumbbell at the chest. Squat down between the heels, elbows inside the knees, stand up.'],
  ['Box Squat', 'barbell', 'legs', 'quads glutes adductors/.5', 'squat', 'barbell rack bench', 3, 'Squat back to a box at or above knee height, touch, stand up.'],
  ['Hack Squat', 'machine', 'legs', 'quads glutes/.5', 'squat legpress', 'machine', 1, 'Back on the pad, feet shoulder-width. Lower as deep as is comfortable, press back up.'],
  ['Smith Machine Squat', 'machine', 'legs', 'quads glutes adductors/.5', 'squat', 'machine', 2, 'Bar on the upper back, feet slightly forward. Squat down, stand up.'],
  ['Leg Press', 'machine', 'legs', 'quads glutes/.5 adductors/.5', 'legpress squat', 'machine', 1, 'Feet shoulder-width in the middle of the platform. Lower until the knees are well bent without the low back lifting, press back up.'],
  ['Bulgarian Split Squat', 'dumbbell', 'legs', 'quads glutes adductors/.5', 'lunge', 'dumbbell bench', 2, 'Back foot on a bench, dumbbells at your sides. Lower until the front thigh is about level, drive back up. Each leg.'],
  ['Dumbbell Split Squat', 'dumbbell', 'legs', 'quads glutes adductors/.5', 'lunge', 'dumbbell', 1, 'Long stance, dumbbells at your sides. Lower the back knee toward the floor, drive up through the front foot. Each leg.'],
  ['Reverse Lunge', 'dumbbell', 'legs', 'quads glutes adductors/.5', 'lunge', 'dumbbell', 1, 'Step back into a lunge, lower the back knee toward the floor, push through the front foot to stand. Each leg.'],
  ['Dumbbell Step-Up', 'dumbbell', 'legs', 'quads glutes', 'lunge', 'dumbbell bench', 2, 'Foot on a knee-height box or bench. Step up through that foot, lower slowly. Each leg.'],
  ['Weighted Walking Lunge', 'dumbbell', 'legs', 'quads glutes adductors/.5', 'lunge', 'dumbbell', 1, 'Dumbbells at your sides. Lunge forward, lower the back knee toward the floor, step through into the next lunge.'],
  ['Bodyweight Bulgarian Split Squat', 'bodyweight', 'legs', 'quads glutes', 'lunge', 'bench', 1, 'Back foot on a bench. Lower until the front thigh is about level, drive back up. Each leg.'],
  ['Leg Extension', 'machine', 'legs', 'quads', 'kneeext', 'machine', 1, 'Pad on the lower shins, knees in line with the machine\'s pivot. Straighten the knees, lower slowly.', ['Leg Extensions']],
  ['Single-Leg Leg Extension', 'machine', 'legs', 'quads', 'kneeext', 'machine', 1, 'Leg extension one leg at a time; use about half the weight.'],
  ['Sissy Squat', 'bodyweight', 'legs', 'quads', 'kneeext', 'bodyweight', 2, 'Hold a post, rise onto the toes and lean back as the knees travel forward and down. Go only as deep as feels fine, stand back up.'],
  ['Reverse Nordic', 'bodyweight', 'legs', 'quads', 'kneeext', 'bodyweight', 1, 'Kneel upright on a pad. Lean the whole body back from the knees as far as you can control, return upright.'],
  ['Leg Curl', 'machine', 'legs', 'hamstrings', 'kneeflex', 'machine', 1, 'Lying or seated leg curl machine. Curl the heels toward you, lower slowly. Seated versions stretch the hamstrings more.', ['Leg Curls', 'Lying Leg Curl', 'Lying Leg Curls', 'Hamstring Curl']],
  ['Seated Leg Curl', 'machine', 'legs', 'hamstrings', 'kneeflex', 'machine', 1, 'Sit tall with the thigh pad snug. Curl the heels down and back, return slowly to a full stretch.', ['Seated Hamstring Curl']],
  ['Nordic Hamstring Curl', 'bodyweight', 'legs', 'hamstrings', 'kneeflex', 'bodyweight', 2, 'Kneel with the heels anchored. Lower the body forward as slowly as you can, catch with the hands, pull back up.', ['Nordic Curl']],
  ['Slider Hamstring Curl', 'bodyweight', 'legs', 'hamstrings glutes/.5', 'kneeflex', 'bodyweight', 1, 'Lie on your back with heels on sliders or towels. Lift the hips, curl the heels in, slide back out.'],
  ['Romanian Deadlift', 'barbell', 'legs', 'hamstrings glutes erectors/.5 forearms/.5', 'hinge', 'barbell', 2, 'Soft knees, push the hips back with a flat back until you feel a deep hamstring stretch, stand up by driving the hips forward.', ['RDL']],
  ['Dumbbell Romanian Deadlift', 'dumbbell', 'legs', 'hamstrings glutes erectors/.5 forearms/.5', 'hinge', 'dumbbell', 1, 'Dumbbells in front of the thighs. Push the hips back with a flat back to a deep hamstring stretch, stand up.', ['Dumbbell RDL']],
  ['Stiff-Leg Deadlift', 'barbell', 'legs', 'hamstrings glutes erectors/.5 forearms/.5', 'hinge', 'barbell', 2, 'Like a Romanian deadlift with straighter knees, lowering the bar a little further.'],
  ['Deadlift', 'barbell', 'back', 'glutes erectors hamstrings/.5 quads/.5 upperback/.5 forearms/.5', 'hinge', 'barbell', 3, 'Bar over mid-foot, flat back, arms straight. Push the floor away and stand tall, lower the bar back along the legs.', ['Conventional Deadlift']],
  ['Back Extension', 'machine', 'legs', 'glutes hamstrings erectors/.5', 'hinge hipext', 'machine', 1, '45-degree back extension bench. Hinge down at the hips, raise back up to a straight line.', ['45 Degree Back Extension', 'Hyperextension']],
  ['Cable Pull-Through', 'cable', 'legs', 'glutes hamstrings/.5', 'hipext hinge', 'cable', 2, 'Face away from a low cable, rope between the legs. Hinge back, then drive the hips forward to stand tall.'],
  ['Dumbbell Hip Thrust', 'dumbbell', 'legs', 'glutes hamstrings/.5', 'hipext', 'dumbbell bench', 2, 'Upper back on a bench, dumbbell on the hips. Drive the hips up until the body is straight from knees to shoulders, lower.'],
  ['Barbell Hip Thrust', 'barbell', 'legs', 'glutes hamstrings/.5', 'hipext', 'barbell bench', 3, 'Upper back on a bench, padded bar on the hips. Drive the hips up, pause, lower.', ['Hip Thrust']],
  ['Hip Thrust Machine', 'machine', 'legs', 'glutes hamstrings/.5', 'hipext', 'machine', 1, 'Belt or pad across the hips. Drive the hips up, pause, lower.', ['Glute Drive']],
  ['Glute Bridge', 'bodyweight', 'legs', 'glutes hamstrings/.5', 'hipext', 'bodyweight', 1, 'Lie on your back, knees bent. Drive the hips up, squeeze, lower.'],
  ['Single-Leg Glute Bridge', 'bodyweight', 'legs', 'glutes hamstrings/.5', 'hipext', 'bodyweight', 1, 'Glute bridge with one foot down and the other leg raised. Each leg.'],
  ['Calf Raises', 'machine', 'legs', 'calves', 'calf', 'machine', 1, 'Standing calf machine or a step. Rise high onto the toes, lower slowly to a full stretch with a short pause.', ['Calf Raise', 'Standing Calf Raise']],
  ['Seated Calf Raise', 'machine', 'legs', 'calves', 'calf', 'machine', 1, 'Pad on the thighs, balls of the feet on the bar. Rise up, lower to a full stretch.'],
  ['Leg Press Calf Raise', 'machine', 'legs', 'calves', 'calf', 'machine', 1, 'In the leg press with legs straight, balls of the feet on the bottom edge. Push through the toes, lower to a stretch.'],
  ['Single-Leg Calf Raise', 'dumbbell', 'legs', 'calves', 'calf', 'dumbbell', 1, 'One foot on a step, a dumbbell in the same-side hand. Rise up, lower to a full stretch. Each leg.'],
  /* Core */
  ['Cable Crunch', 'cable', 'core', 'abs', 'trunkflex', 'cable', 1, 'Kneel facing a high cable, rope by the head. Curl the ribs down toward the hips, return slowly.'],
  ['Machine Crunch', 'machine', 'core', 'abs', 'trunkflex', 'machine', 1, 'Ab crunch machine. Curl the chest toward the hips, return slowly.', ['Ab Crunch Machine']],
  ['Hanging Leg Raises', 'bodyweight', 'core', 'abs', 'trunkflex', 'bar', 1, 'Hang from a bar. Raise the legs by curling the hips up, lower without swinging.', ['Hanging Leg Raise']],
  ['Hanging Knee Raise', 'bodyweight', 'core', 'abs', 'trunkflex', 'bar', 1, 'Hang from a bar or use the captain\'s chair. Bring the knees up toward the chest, lower slowly.', ['Captain\'s Chair Knee Raise']],
  ['Reverse Crunch', 'bodyweight', 'core', 'abs', 'trunkflex', 'bodyweight', 1, 'Lie on your back, knees bent. Curl the hips off the floor toward the chest, lower slowly.'],
  ['Weighted Decline Sit-Ups', 'bodyweight', 'core', 'abs', 'trunkflex', 'bench', 2, 'Decline bench, a weight held at the chest. Curl up, lower slowly.'],
  ['Sit-Ups', 'bodyweight', 'core', 'abs', 'trunkflex', 'bodyweight', 1, 'Lie on your back, knees bent, feet anchored. Curl all the way up, lower slowly.', ['Sit-Up']],
  ['Bicycle Crunches', 'bodyweight', 'core', 'abs', 'trunkflex antirot', 'bodyweight', 1, 'On your back, hands by the head. Bring one elbow toward the opposite knee as the other leg straightens, switch.', ['Bicycles']],
  ['Russian Twists', 'bodyweight', 'core', 'abs', 'antirot trunkflex', 'bodyweight', 1, 'Sit leaning back with the feet up or down. Turn the shoulders side to side, touching the floor (or a weight) by each hip.'],
  ['Ab Wheel Rollout', 'bodyweight', 'core', 'abs', 'antiext', 'bodyweight', 1, 'Kneel with the wheel under the shoulders. Roll forward as far as you can with a flat back, pull back.'],
  ['Plank', 'timed', 'core', 'abs', 'antiext', 'bodyweight', 1, 'Forearms and toes, body in a straight line, squeeze glutes and abs.'],
  ['Dead Bug', 'timed', 'core', 'abs', 'antiext', 'bodyweight', 1, 'On your back, arms up, knees over hips. Lower opposite arm and leg slowly with the low back flat, switch.'],
  ['Pallof Press', 'cable', 'core', 'abs', 'antirot', 'cable', 2, 'Stand side-on to a cable at chest height. Press the handle straight out and hold without letting it turn you.'],
  ['Side Plank', 'timed', 'core', 'abs', 'latflex antiext', 'bodyweight', 1, 'On one forearm, body in a straight line, hips up. Each side.'],
  ['Dumbbell Side Bend', 'dumbbell', 'core', 'abs', 'latflex', 'dumbbell', 1, 'Dumbbell in one hand (or a low cable). Lean away from it, then pull back up with the opposite side.'],
  ["Farmer's Carry", 'carry', 'other', 'forearms upperback/.5 abs/.5', 'carry grip', 'dumbbell', 1, 'Heavy dumbbells or handles at your sides. Walk tall with short steps.'],
  ['Dead Hang', 'timed', 'other', 'forearms', 'grip', 'bar', 1, 'Hang from a bar with straight arms, shoulders active.'],
];
/* name → canonical name, from every also-known-as */
const EX_ALIAS = {};
const muscleMap = s => Object.fromEntries(String(s || '').split(/\s+/).filter(Boolean).map(t => { const [k, w] = t.split('/'); return [k, w ? +w : 1]; }));
for (const [name, kind, cat, m, pat, eq, setup, how, aka] of EX_LIB) {
  const id = 'b-' + slug(name);
  BUILTIN_EX[id] = { id, name, kind, cat, m: muscleMap(m), pat: pat.split(' '), eq: eq.split(' '), setup, how };
  for (const a of aka || []) EX_ALIAS[nameKey(a)] = name;
}
const resolveExName = nm => EX_ALIAS[nameKey(nm)] || nm;
/* Saved ids of merged duplicates → the canonical exercise (added to EX_RENAMED below) */
const EX_MERGED = {
  'b-squat': 'b-back-squat', 'b-bent-over-barbell-rows': 'b-barbell-row', 'b-standing-barbell-row': 'b-barbell-row', 'b-leg-curls': 'b-leg-curl', 'b-lying-leg-curl': 'b-leg-curl',
  'b-barbell-bicep-curl': 'b-barbell-curl', 'b-standing-overhead-press': 'b-overhead-barbell-press', 'b-dumbbell-shoulder-press': 'b-seated-dumbbell-overhead-press', 'b-cable-crossover': 'b-cable-fly' };
