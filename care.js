/* ============ Joint care programs ============ */
/* Strengthening and mobility for common aches: clicky or pinchy shoulders, sore ankles and shins after runs, a cranky lower
   back, front-of-knee pain, tight hips, elbows and wrists, a stiff neck. General exercise, not physical therapy: no
   diagnosis or treatment claims, a pain rule, and clear signs to see a doctor or physical therapist. Each program has two
   days (A: strength, B: mobility and control) done three times a week, alternating, about 15–20 minutes, after a warm-up or
   at the end of a lifting day. Items: [exercise, sets, reps, note, target, kind for a new exercise]. */
const CARE_NOTE = 'General strength and mobility exercise for common aches, not medical advice, diagnosis or treatment, and not a substitute for a doctor or physical therapist.';
const CARE_PAIN = 'Pain rule: mild discomfort during an exercise (up to about 3 out of 10) that settles within 24 hours is okay. If it’s sharper, or worse the next morning, use less weight, fewer reps or a smaller range next time. Stop anything that causes sharp, catching or worsening pain.';
const CARE_RED = ['Pain after a fall, a pop or a direct hit', 'Numbness, tingling or weakness', 'Swelling, redness or warmth around a joint', 'Pain at night or at rest that doesn’t ease with changing position', 'Pain that keeps getting worse over 2 weeks, or no better after 4–6 weeks of this program'];
const CARE = [
  { id: 'bi-care-shoulder', area: 'Shoulders', name: 'Shoulder Care', fit: 'Clicky or pinchy shoulders, aches with pressing or overhead work.',
    builds: 'Rotator cuff and shoulder-blade strength, overhead control', week: '3× · 15–20 min', equip: 'Band, light dumbbells', cost: 'Low',
    strengths: ['Strengthens the small muscles that keep the ball of the shoulder centered while you press, pull and reach overhead.', 'Trains the shoulder blades to move with the arm (upward rotation and tilt), which is often what’s missing when overhead work pinches.', 'Light enough to do after an upper-body day without eating into recovery.'],
    result: 'Most people with a mild, activity-related ache find pressing and overhead work feel better within 3–6 weeks, as long as heavy pressing stays at a level that doesn’t flare it. Painless clicking on its own is common and usually harmless; this won’t always make it go away.',
    watch: ['Use light weights: these muscles are small. If your neck or traps take over, go lighter.', 'Keep pressing heavy only in a range that doesn’t pinch while you build up; swap to a neutral-grip or landmine press if needed.', 'Clicking with pain, catching, or the shoulder feeling like it slips out needs a professional look.'],
    red: ['A shoulder that feels like it slipped out, or a clunk with sudden pain', 'Arm weakness, or you can’t lift the arm to the side'],
    days: [
      ['A: Cuff and blades', [['Side-Lying Dumbbell External Rotation', 3, '12-15', 'Each arm. Elbow on your side with a towel under it, rotate up slowly, 3 s down.', null, 'dumbbell'],
        ['Prone Y-T-W Raise', 2, '8', 'Each letter. Face down on an incline bench, thumbs up, light or no weight.', null, 'dumbbell'],
        ['Scapular Push-Up', 3, '10-12', 'Arms straight; let the shoulder blades come together, then push the floor away and round the upper back.', null, 'bodyweight'],
        ['Face Pulls', 3, '12-15', 'Pull to the forehead, elbows high, and finish with the hands back (external rotation).']]],
      ['B: Overhead control', [['Wall Slide with Lift-Off', 3, '10', 'Forearms on the wall, slide up into a Y, lift the hands off for a second at the top.', null, 'bodyweight'],
        ['Band External Rotation', 3, '15', 'Each arm. Elbow at your side, slow both ways.', null, 'other'],
        ['Band Pull-Apart', 3, '15-20', 'Straight arms, squeeze the shoulder blades, slow return.', null, 'other'],
        ['Bottoms-Up Kettlebell Carry', 3, '', 'Each arm. Hold a light kettlebell upside down by the shoulder and walk; wrist straight.', { dur: 30, judge: 'dur' }, 'timed'],
        ['Cross-Body Shoulder Stretch', 2, '', 'Each arm. Gentle, no pinching at the front of the shoulder.', { dur: 30, judge: 'dur' }, 'timed']]],
    ] },
  { id: 'bi-care-ankle', area: 'Ankles & shins', name: 'Ankle & Foot Care', fit: 'Ankles, shins, calves or feet that ache after runs; wobbly ankles.',
    builds: 'Calf, shin and foot strength, ankle mobility, balance', week: '3× · 15–20 min', equip: 'A step, a band', cost: 'Low',
    strengths: ['Builds the calves (both the straight-knee and bent-knee muscles), which take several times your bodyweight with every running stride.', 'Strengthens the shin and foot muscles that control landing, plus balance that protects against rolled ankles.', 'Pairs with the running plan: do it on non-running days or after an easy run.'],
    result: 'With running load kept in check, most people notice less ache after runs within 3–6 weeks and better balance within 2–3. Calf strength keeps improving for 8–12 weeks.',
    watch: ['If runs are what hurt, keep running but cut weekly running 20–30% (or swap a run for cross-training) while you build up.', 'Heel drops can make calves sore for the first week; start with 2 sets.', 'Pain on one spot of the shin or foot bone, especially if it hurts to press or to hop, needs a doctor before more running.'],
    red: ['Pain on one spot of a bone that hurts to press, or pain when you hop on that leg', 'A sudden pop or kick at the back of the ankle or calf'],
    days: [
      ['A: Calves and shins', [['Calf Raises', 3, '15', 'Straight knees, 2 s up, 1 s pause, 3 s down. Move to one leg when 3 × 15 is easy.'],
        ['Bent-Knee Calf Raise', 3, '15', 'Knees bent, as in a quarter squat; works the deeper calf muscle that takes most of the load when you run.', null, 'bodyweight'],
        ['Seated Tibialis Raise', 3, '15-20', 'Heels down, lift the toes high, slow down.'],
        ['Single-Leg Balance', 3, '', 'Each leg. When easy, close your eyes or stand on a pillow.', { dur: 30, judge: 'dur' }, 'timed']]],
      ['B: Load and mobility', [['Eccentric Heel Drop', 3, '12', 'Each leg. Up on two feet, lower slowly on one off a step (3–4 s).', null, 'bodyweight'],
        ['Knee-to-Wall Ankle Dorsiflexion', 2, '10', 'Each side. Knee over the toes to the wall, heel down.'],
        ['Banded Ankle Eversion', 2, '15', 'Each foot. Turn the foot out against a band, slow.', null, 'other'],
        ['Short Foot', 3, '10', 'Pull the ball of the foot toward the heel without curling the toes, 5 s hold.', null, 'bodyweight'],
        ['Pogo Hops', 2, '20', 'Small, quick, quiet bounces off the balls of the feet. Add only after 2 pain-free weeks.', null, 'bodyweight']]],
    ] },
  { id: 'bi-care-back', area: 'Lower back', name: 'Lower Back Care', fit: 'A stiff or achy lower back, especially after sitting or lifting.',
    builds: 'Trunk endurance, hip hinge, glutes, easy movement', week: '3× · 15–20 min, plus walks', equip: 'Mat, a light dumbbell or kettlebell', cost: 'Low',
    strengths: ['Builds trunk endurance (holding positions), which matters more for an achy back than heavy ab work.', 'Grooves the hip hinge so the hips, not the lower back, do the bending when you lift.', 'Daily walking is part of it: gentle movement usually helps a sore back more than rest.'],
    result: 'Most everyday lower back aches ease within a few weeks with gentle activity; this builds the endurance and hinge pattern that make flare-ups less likely and shorter. Stiffness after long sitting improves within 2–3 weeks for most people.',
    watch: ['Keep moving: short walks through the day help. Long bed rest tends to make it worse.', 'Hold positions without holding your breath; quality over time.', 'While it’s sore, lighten or skip heavy deadlifts and squats rather than stopping all training.'],
    red: ['Numbness in the groin or inner thighs, or new trouble controlling the bladder or bowels: go to an emergency room now', 'Pain, numbness or weakness down a leg below the knee', 'Fever, unexplained weight loss, or a history of cancer'],
    days: [
      ['A: Trunk endurance', [['Modified Curl-Up', 3, '6', 'One knee bent, hands under the lower back. Lift head and shoulders an inch, hold 8 s.', null, 'bodyweight'],
        ['Side Plank', 3, '', 'Each side. From the knees to start.', { dur: 20, judge: 'dur' }],
        ['Bird Dog', 3, '6', 'Each side. Reach arm and opposite leg long, hold 8 s, without the back arching.', null, 'bodyweight'],
        ['Glute Bridge', 3, '12', '2 s squeeze at the top; ribs down.', null, 'bodyweight']]],
      ['B: Hinge and move', [['Cat-Cow and T-Spine Rotation', 2, '8', 'Slow, within a comfortable range.'],
        ['Dead Bug', 3, '8', 'Each side. Lower back stays gently against the floor.'],
        ['Dowel Hip Hinge', 3, '10', 'Dowel on the back touching head, upper back and tailbone; push the hips back.', null, 'bodyweight'],
        ['Suitcase Carry', 3, '', 'Each side. One weight at your side, walk tall without leaning.', { dur: 30, judge: 'dur' }, 'timed'],
        ['Half-Kneeling Hip Flexor Stretch', 2, '', 'Each side. Tuck the tailbone, squeeze the back glute.', { dur: 30, judge: 'dur' }, 'timed']]],
    ] },
  { id: 'bi-care-knee', area: 'Knees', name: 'Knee Care', fit: 'Ache at the front of the knee with stairs, squats, lunges or running.',
    builds: 'Quad and hip strength, control on the way down', week: '3× · 15–20 min', equip: 'Band, a step', cost: 'Low',
    strengths: ['Wall sits and similar holds load the knee strongly with little movement, which many people tolerate even when squats ache.', 'Slow step-downs train control of the knee over the foot.', 'Hip strength (side of the hip) helps keep the knee tracking well when you land or squat.'],
    result: 'For the common front-of-knee ache, most people see stairs and squats feel better within 4–8 weeks; strength keeps building to 12 weeks.',
    watch: ['Find a squat depth that stays under the pain rule and build from there, rather than stopping squats completely.', 'Cut running hills and downhill running while it’s sore.', 'Locking, giving way, or swelling after activity needs a professional look.'],
    red: ['Knee locking, giving way, or swelling after activity', 'Pain after a twist with a pop'],
    days: [
      ['A: Quads and hips', [['Wall Sit', 4, '', 'Thighs about 60° (not all the way to parallel if it aches).', { dur: 45, judge: 'dur' }, 'timed'],
        ['Slow Step-Down', 3, '8', 'Each leg. From a low step, tap the heel down in 3 s, knee over the middle toes.', null, 'bodyweight'],
        ['Terminal Knee Extension', 3, '15', 'Each leg. Band behind the knee, straighten fully and squeeze the quad.', null, 'other'],
        ['Side-Lying Hip Abduction', 3, '15', 'Each side. Top leg slightly back, toes forward.', null, 'bodyweight']]],
      ['B: Strength through range', [['Split Squat', 3, '8', 'Each leg. Slow down, to a depth that stays comfortable.', null, 'bodyweight'],
        ['Single-Leg Glute Bridge', 3, '10', 'Each leg.', null, 'bodyweight'],
        ['Slider Hamstring Curl', 3, '8', 'On your back on socks or sliders, hips up, curl the heels in.', null, 'bodyweight'],
        ['Calf Raises', 3, '15']]],
    ] },
  { id: 'bi-care-hip', area: 'Hips', name: 'Hip Care', fit: 'Tight hips, a pinch at the bottom of a squat, groin tightness.',
    builds: 'Hip rotation, inner and outer hip strength, control', week: '3× · 15–20 min', equip: 'Band, a bench', cost: 'Low',
    strengths: ['Works hip rotation both ways, which lifting rarely trains.', 'Strengthens the inner thigh (often weak and the first to strain) and the side of the hip.', 'Single-leg balance work carries straight over to running and lunges.'],
    result: 'Most people move noticeably better in squats and lunges within 3–4 weeks; groin and hip strength builds over 6–12 weeks.',
    watch: ['A pinch at the front of the hip in deep squats: squat to just above it, try a slightly wider stance and toes out.', 'Copenhagen planks are hard: start with the short (knee) version.', 'Deep groin pain, or a click with sharp pain, needs a professional look.'],
    red: ['Deep groin pain that catches, or pain with a sharp click', 'Hip pain that wakes you at night'],
    days: [
      ['A: Strength', [['Short Copenhagen Plank', 3, '', 'Each side. Top knee on a bench, lift the hips, bottom leg off the floor if you can.', { dur: 20, judge: 'dur' }, 'timed'],
        ['Banded Clamshell', 3, '15', 'Each side. Heels together, don’t roll back.', null, 'other'],
        ['Hip Airplanes', 3, '5', 'Each side. Hold something for balance at first.'],
        ['Glute Bridge', 3, '12', '2 s squeeze at the top.', null, 'bodyweight']]],
      ['B: Rotation and range', [['90/90 Hip Rotations', 2, '8', 'Each way, slow; sit tall.'],
        ['Cossack Squat', 3, '6', 'Each side, to a comfortable depth; hold something at first.', null, 'bodyweight'],
        ['Side Plank', 3, '', 'Each side, top leg lifted if you can.', { dur: 20, judge: 'dur' }],
        ['Half-Kneeling Hip Flexor Stretch', 2, '', 'Each side.', { dur: 30, judge: 'dur' }, 'timed']]],
    ] },
  { id: 'bi-care-elbow', area: 'Elbows & wrists', name: 'Elbow & Wrist Care', fit: 'Elbow ache from curls, pull-ups or gripping; wrists that ache in push-ups or front squats.',
    builds: 'Forearm and grip strength, wrist mobility', week: '3× · 10–15 min', equip: 'Light dumbbell, a band', cost: 'Low',
    strengths: ['Slow lowering (eccentric) work for the forearm muscles is the most studied exercise approach for activity-related elbow ache.', 'Builds grip strength that pulling and carrying rely on.', 'Wrist mobility makes push-ups, front racks and handstands easier on the joint.'],
    result: 'Elbow aches from overuse tend to improve slowly: most people notice progress within 6–8 weeks and keep improving to 12. Wrist mobility improves within 2–3 weeks.',
    watch: ['Go light: 2–5 lb is plenty to start. The lowering phase does the work.', 'Change what flares it while you build up: neutral-grip pulls, straps for heavy pulling, push-ups on handles or fists.', 'Expect a little ache during the exercise; it should settle by the next day.'],
    red: ['Numbness or tingling into the fingers', 'Pain after a fall on an outstretched hand'],
    days: [
      ['A: Forearm strength', [['Eccentric Wrist Extension', 3, '15', 'Forearm on your thigh, palm down. Use the other hand to lift, lower on your own in 3–4 s.', null, 'dumbbell'],
        ['Wrist Curl', 3, '15', 'Palm up, slow.', null, 'dumbbell'],
        ['Hammer Rotation', 3, '12', 'Hold one end of a light dumbbell or hammer and rotate palm up and palm down slowly.', null, 'dumbbell'],
        ['Band Finger Extension', 3, '20', 'Band around the fingers, open the hand.', null, 'other']]],
      ['B: Grip and mobility', [['Floor Wrist Stretch', 2, '', 'Fingers forward, then back; gentle rocking.', { dur: 30, judge: 'dur' }],
        ['Dead Hang', 3, '', 'Relaxed hang or with feet supported.', { dur: 20, judge: 'dur' }],
        ["Farmer's Carry", 3, '', 'Moderate weight, tall posture.', { d: 30 }],
        ['Wrist Circles', 2, '10', 'Each way, fingers interlaced.', null, 'bodyweight']]],
    ] },
  { id: 'bi-care-neck', area: 'Neck & upper back', name: 'Neck & Upper Back Care', fit: 'A stiff neck or upper back from desk work, phones or driving.',
    builds: 'Neck and upper-back endurance, posture breaks, mobility', week: '3× · 10–15 min, plus breaks', equip: 'Band, foam roller', cost: 'Low',
    strengths: ['Trains the deep neck muscles and the upper back to hold a relaxed position, which helps more than stretching alone.', 'Opens the upper back and chest, which stiffen with long sitting.', 'Short enough to do as a work break.'],
    result: 'Most people with posture-related stiffness feel easier within 2–4 weeks, especially when they also take movement breaks every 30–60 minutes.',
    watch: ['Gentle is the point: no forcing end range in the neck.', 'Move often during the day; no single posture is perfect for hours.', 'Headaches with neck pain that are new or severe need a doctor.'],
    red: ['Pain, numbness or tingling down an arm', 'Dizziness, severe headache, or trouble with balance or vision'],
    days: [
      ['A: Strength', [['Chin Tuck', 3, '10', 'Lying or standing, nod gently and draw the chin back; 5 s hold.', null, 'bodyweight'],
        ['Prone Y-T-W Raise', 2, '8', 'Each letter, no weight.', null, 'dumbbell'],
        ['Band Pull-Apart', 3, '15-20', 'Shoulders down, slow.', null, 'other'],
        ['Face Pulls', 3, '12-15']]],
      ['B: Mobility', [['Open Book Rotation', 2, '8', 'Each side. Lying on your side, knees bent, open the top arm across.', null, 'bodyweight'],
        ['Foam Roller Thoracic Extension', 2, '8', 'Roller under the upper back, hands behind the head, extend over it at a few spots.', null, 'bodyweight'],
        ['Doorway Chest Stretch', 2, '', 'Each side, elbow at shoulder height.', { dur: 30, judge: 'dur' }, 'timed'],
        ['Wall Slide with Lift-Off', 2, '10']]],
    ] },
];
/* New exercises get the kind each program gives them; existing ones keep theirs */
function careEx(name, kind) {
  let ex = findIn(BUILTIN_EX)(name); if (ex) return ex;
  const n = norm(name);
  ex = { id: 'b-' + slug(name), name, kind: kind || guessKind(name), cat: /calf|tibialis|heel|ankle|foot|pogo|balance|knee|wall sit|step|split squat|hamstring|abduction|bridge|clamshell|cossack|copenhagen|hip/.test(n) ? 'legs' : /curl-up|plank|bird dog|dead bug|carry|suitcase/.test(n) ? 'core' : /wrist|finger|hammer rotation/.test(n) ? 'biceps' : /external rotation|y-t-w|scapular|wall slide|pull-apart|face pull|chin tuck|cross-body|kettlebell carry/.test(n) ? 'shoulders' : 'other' };
  BUILTIN_EX[ex.id] = ex; return ex;
}
if (!WTAGS.includes('Joint care')) WTAGS.splice(WTAGS.indexOf('Other'), 0, 'Joint care');
for (const P of CARE) {
  const days = P.days.map(([dn, items], i) => {
    items.forEach(([n, , , , , kind]) => careEx(n, kind));
    const d = planDay(P.id, i + 1, dn, ['Joint care'], items.map(([n, sets, reps, note]) => [n, sets, reps, note]));
    d.items.forEach((it, j) => { const tg = items[j][4]; if (tg) it.tg = { ...tg }; });
    return d;
  });
  BUILTIN_ROUTINES.push({ id: P.id, name: P.name, note: P.fit, source: 'builtin', shelf: 'programs', meta: 'Joint care · 3 times a week', days, info: { ...P, care: true } });
}
/* Routine page for a joint care program */
function CareInfo({ r }) {
  const P = r.info;
  return html`<div class="cond-info" id="care-info">
    <div class="kpis kpis3">${kpi('3 days', 'A week')}${kpi(P.week.split(' · ')[1] || '', 'Each session')}${kpi(P.equip, 'Equipment')}</div>
    <div class="card" style="margin-top:8px"><span class="lbl">How to use it</span><p class="note" style="margin-top:4px">Alternate day A and day B, three times a week, after a warm-up or at the end of a lifting day. When every set feels easy for a week, add a little weight, a few reps or a few seconds.</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">What it trains</span><ul class="run-ul">${P.strengths.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <div class="card run-result" style="margin-top:8px"><span class="lbl">What to expect</span><p>${P.result}</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Watch out for</span><ul class="run-ul">${P.watch.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul><p class="small muted" style="margin-top:8px">${CARE_PAIN}</p></div>
    <div class="card care-red" style="margin-top:8px" id="care-red"><span class="lbl">See a doctor or physical therapist if you have</span><ul class="run-ul">${P.red.concat(CARE_RED).map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <p class="small faint" style="margin-top:8px">${CARE_NOTE} Expected results are estimates.</p></div>`;
}
/* Routines → a quick way in: pick the area that bothers you */
function CareFinder() {
  return html`<div class="card care-finder" id="care-finder" style="margin-top:12px"><div class="row"><span style="font-weight:700;flex:1">Joint care</span><span class="small muted">15–20 min, 3× a week</span></div>
    <p class="small muted" style="margin-top:2px">Strength and mobility for common aches. What’s bothering you?</p>
    <div class="range-grid" style="margin-top:8px">${CARE.map(P => html`<button key=${P.id} class="chip" id=${'care-' + P.id.slice(8)} onClick=${() => UI.setView({ type: 'routine', id: P.id })}>${P.area}</button>`)}</div></div>`;
}
