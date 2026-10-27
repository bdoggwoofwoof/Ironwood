/* ============ Fight training: boxing, kickboxing, Muay Thai, MMA, BJJ (Train → Fight) ============ */
/* Like the shadowboxing and martial-arts coach apps: a round timer that calls combos out loud (boxing, kickboxing,
   Muay Thai, MMA) or solo movements (BJJ), a combo library, a library of drills and session ideas, and six fight
   programs that live in Routines like the conditioning and joint care plans. Settings are saved in meta.fight; a coach
   session can be saved to History as an activity (with rounds) or fill the rounds of a program's workout. Nothing
   leaves the phone. Generic names only; no gym, brand or fighter names. */
const FIGHT_NOTE = 'General fitness and solo technique practice, not a substitute for a qualified coach. Learn new techniques from a coach, and spar only with supervision, gloves, a mouthguard and the gear your gym asks for. Expected results are estimates.';

/* Moves: key → [number or short label, spoken name, group, how]. Groups: p punch, d defense, f footwork, k kick, n knee or elbow, c clinch, w wrestling, g ground */
const FMOVES = {
  '1': ['1', 'Jab', 'p', 'Lead hand, straight. Turn the fist over and snap it back to your chin.'],
  '2': ['2', 'Cross', 'p', 'Rear hand, straight. Turn the rear hip and pivot the back foot.'],
  '3': ['3', 'Lead hook', 'p', 'Lead hand, elbow up level with the fist, turn the lead hip and foot.'],
  '4': ['4', 'Rear hook', 'p', 'Rear hand hook, turning through the back hip. Short, not looping.'],
  '5': ['5', 'Lead uppercut', 'p', 'Lead hand, dip slightly and drive up from the legs, palm toward you.'],
  '6': ['6', 'Rear uppercut', 'p', 'Rear hand, drive up from the back leg and hip.'],
  '1b': ['1b', 'Jab to the body', 'p', 'Bend the knees to drop level; don’t just reach down.'],
  '2b': ['2b', 'Cross to the body', 'p', 'Drop your level, punch to the solar plexus, come back up behind your guard.'],
  '3b': ['3b', 'Lead hook to the body', 'p', 'Drop to the lead side, dig the hook under the ribs.'],
  '4b': ['4b', 'Rear hook to the body', 'p', 'Shift weight, rear hook to the liver side and back up.'],
  slip: ['Slip', 'Slip', 'd', 'Small turn and bend at the knees so the head moves just off the line. Eyes forward.'],
  roll: ['Roll', 'Roll', 'd', 'Bend the knees and trace a U under an imaginary hook. Don’t bend at the waist.'],
  pull: ['Pull', 'Pull back', 'd', 'Lean back a few inches over the rear foot, then come back with a punch.'],
  block: ['Block', 'Block', 'd', 'High guard: gloves to the temples, elbows tight. Take it, then answer.'],
  parry: ['Parry', 'Parry', 'd', 'Rear hand taps the jab down and across, small and quick.'],
  duck: ['Duck', 'Duck', 'd', 'Drop straight down by bending the knees, then come back up punching.'],
  pivot: ['Pivot', 'Pivot', 'f', 'On the ball of the lead foot, swing the back foot around to turn a quarter.'],
  step: ['Step back', 'Step back', 'f', 'Back foot moves first, lead follows. Keep your stance width.'],
  in: ['Step in', 'Step in', 'f', 'Lead foot first, back foot follows. Small steps, never cross your feet.'],
  out: ['Angle out', 'Angle out', 'f', 'Step off to the side away from their power hand.'],
  lteep: ['Lead teep', 'Lead teep', 'k', 'Push kick with the lead leg: knee up, push the ball of the foot through, set it back down.'],
  rteep: ['Rear teep', 'Rear teep', 'k', 'Push kick with the rear leg, hips forward, back to stance.'],
  llk: ['Lead low kick', 'Lead low kick', 'k', 'Lead leg to the thigh, turning the hip over; shin, not foot.'],
  rlk: ['Low kick', 'Low kick', 'k', 'Rear leg round kick to the thigh. Step out, turn the hip over, swing the arm down.'],
  rbk: ['Body kick', 'Body kick', 'k', 'Rear leg round kick to the ribs. Rise on the ball of the support foot.'],
  rhk: ['High kick', 'High kick', 'k', 'Rear leg round kick to head height. Only as high as you can stay balanced.'],
  swk: ['Switch kick', 'Switch kick', 'k', 'Quick switch of the feet, then a lead-side round kick to the body.'],
  check: ['Check', 'Check', 'd', 'Lift the lead knee and turn the shin out to block a low kick.'],
  rknee: ['Knee', 'Knee', 'n', 'Rear knee straight up and through, hips forward, pulling the hands down.'],
  swknee: ['Switch knee', 'Switch knee', 'n', 'Switch the feet and drive the lead-side knee.'],
  lelb: ['Lead elbow', 'Lead elbow', 'n', 'Short horizontal elbow with the lead arm, close range.'],
  relb: ['Rear elbow', 'Rear elbow', 'n', 'Rear horizontal elbow, turning through the hip.'],
  clinch: ['Clinch', 'Clinch', 'c', 'Hands behind the head, forearms on the collarbones, elbows tight.'],
  level: ['Level change', 'Level change', 'w', 'Drop your hips by bending the knees, back straight, head up, hands ready.'],
  double: ['Double leg', 'Double leg', 'w', 'Level change, penetration step deep between their feet, head up, drive forward.'],
  single: ['Single leg', 'Single leg', 'w', 'Level change and step to the lead leg, head on the inside.'],
  sprawl: ['Sprawl', 'Sprawl', 'w', 'Throw the legs back and hips down to the floor, chest heavy, then back up to stance.'],
  standup: ['Stand up', 'Stand up', 'g', 'From the floor: technical stand-up. Post a hand, lift the hips, swing the leg back behind you.'],
};
/* BJJ solo movements the coach calls one at a time */
/* Order matters: beginners get the first 9, intermediate adds through the Granby roll, advanced gets all. Rolls and breakfalls stay last. */
const FBJJ = [
  ['Shrimp', 'Hip escape: on your back, push off one foot and drive the hips away, then switch sides.'],
  ['Bridge and roll', 'Upa: bridge high onto one shoulder, look over it, and turn to your knees.'],
  ['Technical stand-up', 'Sit up on one hand, lift the hips, swing the leg back, stand behind your guard.'],
  ['Sit-out', 'From all fours, thread one leg under and sit through to face the other way.'],
  ['Hip switch', 'Sit-through from a sprawl or base, switching the hips side to side.'],
  ['Bear crawl', 'Knees an inch off the floor, opposite hand and foot together.'],
  ['Crab walk', 'Hips up, walk on hands and feet, then turn and sit through.'],
  ['Sprawl', 'Legs back, hips down, then back up to base.'],
  ['Leg circles', 'On your back, circle the legs as if keeping someone in front of you; turn the hips to follow.'],
  ['Hip heist', 'From sitting, post a hand, lift the hips and swing the leg through to a knee.'],
  ['Inverted shrimp', 'Shrimp, then keep turning onto the shoulders to bring the legs back in front.'],
  ['Granby roll', 'Only on mats you know: shoulder-walk over the upper back, keeping the neck off the floor.'],
  ['Shoulder roll', 'Only on mats you know: tuck the head and roll over one shoulder, not the neck.'],
  ['Breakfall', 'Only on mats: lie back and slap the mat with both arms, chin tucked.'],
];
/* Combos: [moves, level 1–3]. Styles: boxing (box), kickboxing (kick), Muay Thai (thai), MMA (mma). */
const FCOMBOS = {
  box: [['1', 1], ['1-1', 1], ['1-2', 1], ['1-1-2', 1], ['1-2-3', 1], ['1-2-1', 1], ['2-3-2', 1], ['1-2b', 1], ['1-2-block', 1], ['1-2-pull', 1], ['1-step', 1], ['in-1', 1], ['1-out', 1], ['1-2-step', 1], ['pivot-1-2', 1], ['in-1-2-step', 1], ['slip-2', 1], ['3-2', 1], ['1-2-slip', 1],
    ['1-2-3-2', 2], ['1-2-5-2', 2], ['1-6-3-2', 2], ['3b-3', 2], ['1-2-3b-3', 2], ['slip-2-3-2', 2], ['roll-3-2', 2], ['pull-2', 2], ['1-2-3-pivot', 2], ['1-1-2-roll-2', 2], ['2-3-6', 2], ['1-1b-2', 2], ['5-6-3-2', 2], ['parry-2', 2], ['block-3-2', 2], ['1-2-out', 2], ['slip-slip-2-3', 2], ['duck-3-2', 2],
    ['1-2-3-2-roll-2-3-2', 3], ['1-1b-2-3-roll-3-2', 3], ['slip-slip-6-3-2', 3], ['1-2-5-3b-3-2', 3], ['pull-2-3-pivot-2', 3], ['1-2-3b-3-roll-3-4', 3], ['parry-2-3-2-out', 3], ['1-2-roll-2-3-pivot', 3], ['3-3b-3-2', 3], ['2b-3-2-slip-2', 3], ['in-1-2-3-out', 3], ['block-block-6-3-2', 3]],
  kick: [['1-2-rlk', 1], ['1-rbk', 1], ['lteep', 1], ['lteep-2', 1], ['1-2-3-rlk', 1], ['check-2', 1], ['1-rteep', 1], ['rbk', 1], ['1-2', 1], ['2-llk', 1], ['block-rlk', 1], ['check-rbk', 1], ['pull-2', 1], ['parry-2-rlk', 1], ['in-1-2-out', 1], ['1-rlk-step', 1], ['lteep-out', 1], ['pivot-1-2', 1],
    ['1-2-3-rbk', 2], ['swk-2-3', 2], ['1-rhk', 2], ['lteep-1-2-rbk', 2], ['check-rlk', 2], ['2-3-rhk', 2], ['1-2-llk-2', 2], ['slip-2-rbk', 2], ['rlk-3-2', 2], ['1-swk', 2], ['block-3-2-rlk', 2], ['in-1-swk-out', 2], ['1-2-rbk-pivot', 2],
    ['1-1b-2-rhk', 3], ['lteep-swk-2-3-rlk', 3], ['check-3-2-rbk', 3], ['1-2-3-2-swk', 3], ['pull-2-3-rhk', 3], ['in-1-2-3-rlk-out', 3], ['parry-2-swk-pivot', 3], ['1-2-rlk-3-rbk', 3], ['swk-swk-2-3-2', 3]],
  thai: [['1-rbk', 1], ['lteep', 1], ['1-rknee', 1], ['1-2-rbk', 1], ['check-rbk', 1], ['rteep', 1], ['rbk', 1], ['1-2-rlk', 1], ['clinch-rknee', 1], ['lteep-rbk', 1], ['block-rbk', 1], ['check-2-rlk', 1], ['pull-rteep', 1], ['block-2-rknee', 1], ['in-1-rknee', 1], ['1-rbk-step', 1], ['lteep-out', 1], ['out-rbk', 1],
    ['1-2-relb', 2], ['1-lelb-relb', 2], ['clinch-rknee-rknee', 2], ['1-2-swknee', 2], ['2-3-rlk', 2], ['lteep-2-rbk', 2], ['rknee-relb', 2], ['check-swk', 2], ['1-2-3-rbk', 2], ['swk-2-rknee', 2], ['check-check-rbk', 2], ['in-1-lelb-out', 2], ['1-2-rlk-pivot', 2],
    ['1-2-lelb-relb-rknee', 3], ['check-lteep-2-3-rhk', 3], ['clinch-rknee-swknee-relb', 3], ['1-swk-2-lelb-rknee', 3], ['lteep-1-2-swknee-relb', 3], ['2-3-rlk-swk-rbk', 3], ['1-2-rhk-swknee', 3], ['in-1-2-relb-rknee-out', 3], ['block-check-2-3-rbk', 3]],
  mma: [['1-2-level', 1], ['1-double', 1], ['sprawl', 1], ['sprawl-1-2', 1], ['1-2-rlk', 1], ['standup', 1], ['level-1-2', 1], ['1-2-3', 1], ['sprawl-standup', 1], ['1-rbk', 1], ['block-1-2', 1], ['slip-2-level', 1],
    ['1-2-double', 2], ['level-2-3', 2], ['1-2-3-sprawl', 2], ['sprawl-standup-2', 2], ['2-single', 2], ['1-2-llk', 2], ['level-3-2-rbk', 2], ['1-2-rknee', 2], ['slip-2-double', 2], ['lteep-1-2-level', 2],
    ['1-2-level-2-3-rbk', 3], ['sprawl-standup-1-2-double', 3], ['pull-2-double', 3], ['1-2-3-level-single', 3], ['1-level-1-2-rhk', 3], ['sprawl-sprawl-1-2-3', 3], ['check-2-3-double', 3]],
};
const FSTYLES = [['box', 'Boxing'], ['kick', 'Kickboxing'], ['thai', 'Muay Thai'], ['mma', 'MMA'], ['bjj', 'BJJ solo']];
const FLEVELS = [[1, 'Beginner'], [2, 'Intermediate'], [3, 'Advanced']];
const FFOCUS = [['mix', 'Mixed'], ['off', 'Offense'], ['def', 'Defense'], ['foot', 'Footwork']];
const FPACE = { slow: [6.5, 25], med: [4.2, 18], fast: [2.6, 12] };  /* seconds between calls: striking, BJJ */
const FBURN = { box: 'Burnout! Fast straight punches', kick: 'Burnout! Fast punches and kicks', thai: 'Burnout! Fast knees', mma: 'Burnout! Sprawls and punches', bjj: 'Burnout! Fast shrimps' };
const FDEF = { style: 'box', level: 1, focus: 'mix', where: 'shadow', rounds: 3, round: 120, rest: 60, pace: 'med', nums: true, voice: true, burn: true, fav: [] };
const fightSt = () => ({ ...FDEF, ...((S.meta && S.meta.fight) || {}) });
const fightSet = patch => commit(st => { st.meta.fight = { ...FDEF, ...(st.meta.fight || {}), ...patch }; }, 'meta', 400);
const fToks = c => c.split('-');
const fNum = c => fToks(c).map(t => (FMOVES[t] || [t])[0]).join(' · ');
const fNames = c => fToks(c).map(t => (FMOVES[t] || [, t])[1]).join(', ');
const SAYN = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
function fSpeak(c, nums) { return fToks(c).map(t => { const m = FMOVES[t]; if (!m) return t; if (nums && m[2] === 'p') return SAYN[m[0][0]] + (m[0][1] === 'b' ? ' body' : ''); return m[1]; }).join(', '); }
const fGroups = c => new Set(fToks(c).map(t => (FMOVES[t] || [, , '?'])[2]));
function fFocusOk(c, focus) {
  const g = fGroups(c);
  if (focus === 'off') return !g.has('d') && !g.has('f');
  if (focus === 'def') return g.has('d') || fToks(c).includes('sprawl');
  if (focus === 'foot') return g.has('f') || g.has('w');
  return true;
}
/* The pool the coach calls from: up to your level, your level weighted twice, favorites three times */
function fightPool(cfg) {
  if (cfg.only) return [{ c: cfg.only, w: 1 }];
  const all = (FCOMBOS[cfg.style] || FCOMBOS.box).filter(([, l]) => l <= cfg.level);
  let list = all.filter(([c]) => fFocusOk(c, cfg.focus));
  if (list.length < 4) list = all;
  return list.map(([c, l]) => ({ c, w: (l === cfg.level ? 2 : 1) * ((cfg.fav || []).includes(cfg.style + ':' + c) ? 3 : 1) }));
}
function fPick(pool, last) {
  const opts = pool.length > 1 ? pool.filter(x => x.c !== last) : pool;
  let r = Math.random() * opts.reduce((a, x) => a + x.w, 0);
  for (const x of opts) { r -= x.w; if (r <= 0) return x.c; }
  return opts[opts.length - 1].c;
}

/* ---- The coach: a round timer that calls combos ---- */
const FR = { T: null, iv: null, voices: false };
function fSay(text, cfg, rate) {
  if (!cfg.voice) return false;
  try { const ss = window.speechSynthesis; if (!ss || typeof SpeechSynthesisUtterance === 'undefined') return false;
    ss.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate || (cfg.pace === 'fast' ? 1.25 : cfg.pace === 'slow' ? 1 : 1.12); ss.speak(u); return true; } catch (e) { return false; }
}
const canSpeak = () => { try { return !!(window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined'); } catch (e) { return false; } };
function bell(n) { for (let i = 0; i < n; i++) setTimeout(() => beep(1180, 220, 0.32), i * 260); }
function fightStart(cfg0) {
  const cfg = { ...FDEF, ...cfg0 }; const phases = buildPhases({ mode: 'intervals', prep: cfg.prep != null ? cfg.prep : 10, work: cfg.round, rest: cfg.rest, rounds: cfg.rounds, sets: 1, setRest: 0, cool: 0 });
  FR.T = { cfg, phases, total: phases.reduce((a, p) => a + p.secs, 0), startedAt: Date.now(), pausedAt: null, pausedTotal: 0, beeped: {}, call: null, callAt: 0, nextAt: 0, calls: 0, roundsDone: 0, done: false, burn: false, pool: cfg.style === 'bjj' ? null : fightPool(cfg) };
  unlockAudio(); fSay(cfg.style === 'bjj' ? 'Get ready. Solo drills.' : 'Get ready', cfg);
  if (!FR.iv) FR.iv = setInterval(fightTick, 150);
  S.rerender();
}
function fightStop() { FR.T = null; if (FR.iv) { clearInterval(FR.iv); FR.iv = null; } try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} S.rerender(); }
function fightPause() { const T = FR.T; if (!T) return; if (T.pausedAt) { T.pausedTotal += Date.now() - T.pausedAt; T.pausedAt = null; T.nextAt = Date.now() + 1200; } else { T.pausedAt = Date.now(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} } S.rerender(); }
function fightSkip() { const T = FR.T; if (!T) return; const p = tLocate(T); if (!p) return; T.startedAt -= p.left * 1000; S.rerender(); }
function fightCall(T, now) {
  const cfg = T.cfg;
  if (cfg.style === 'bjj') { const opts = FBJJ.slice(0, cfg.level === 1 ? 9 : cfg.level === 2 ? FBJJ.findIndex(m => m[0] === 'Granby roll') + 1 : FBJJ.length).filter(m => !T.call || m[0] !== T.call.c);
    const m = opts[Math.floor(Math.random() * opts.length)]; T.call = { c: m[0], bjj: m[1] };
    if (!fSay(m[0], cfg)) beep(740, 120); T.nextAt = now + FPACE[cfg.pace][1] * 1000; }
  else { const c = fPick(T.pool, T.call && T.call.c); T.call = { c };
    if (!fSay(fSpeak(c, cfg.nums), cfg)) beep(740, 90);
    const n = fToks(c).length; const g = FPACE[cfg.pace][0]; T.nextAt = now + (g * (0.8 + Math.random() * 0.4) + n * 0.45) * 1000; }
  T.calls++; T.callAt = now;
}
function fightTick() {
  const T = FR.T; if (!T || T.pausedAt || T.done) return;
  const p = tLocate(T); const now = Date.now();
  if (!p) { T.done = true; T.roundsDone = T.cfg.rounds; T.call = null; bell(3); fSay('Time. That’s the session. Nice work.', T.cfg, 1); S.rerender(); return; }
  const ph = p.phase; const left = Math.ceil(p.left - 1e-6);
  const sk = 's' + p.idx;
  if (!T.beeped[sk]) { T.beeped[sk] = 1; T.burn = false;
    if (ph.kind === 'work') { bell(ph.round === 1 ? 1 : 2); T.call = null; fSay('Round ' + ph.round, T.cfg, 1.05); T.nextAt = now + 1600; }
    else if (ph.kind === 'rest') { T.roundsDone = ph.round; T.call = null; bell(3); fSay('Time. Rest. ' + (T.cfg.rounds - ph.round) + ' to go.', T.cfg, 1.05); }
    S.rerender(); }
  const ck = p.idx + ':' + left; if (left >= 1 && left <= 3 && !T.beeped[ck]) { T.beeped[ck] = 1; beep(660, 110); }
  if (ph.kind === 'rest' && left === 10 && !T.beeped['r10' + p.idx]) { T.beeped['r10' + p.idx] = 1; fSay('Ten seconds', T.cfg, 1.05); }
  if (ph.kind !== 'work') return;
  if (T.cfg.burn && !T.cfg.only && p.left <= 10 && ph.secs >= 45) { if (!T.burn) { T.burn = true; T.call = { c: FBURN[T.cfg.style] || FBURN.box, burn: true }; fSay(T.call.c, T.cfg, 1.15); S.rerender(); } return; }
  if (!T.cfg.burn && p.left <= 10 && ph.secs >= 45 && !T.beeped['w10' + p.idx]) { T.beeped['w10' + p.idx] = 1; fSay('Ten seconds', T.cfg, 1.1); T.nextAt = now + 1500; }
  if (now >= T.nextAt && p.left > 2.5) { fightCall(T, now); S.rerender(); }
}
const FIGHT_ACT = { box: 'boxing', kick: 'kickbox', thai: 'kickbox', mma: 'mma', bjj: 'bjj' };
const fStyleName = k => (FSTYLES.find(s => s[0] === k) || FSTYLES[0])[1];
const fSessName = cfg => cfg.style === 'bjj' ? 'BJJ solo drills' : (cfg.where === 'bag' ? 'Heavy bag' : 'Shadowboxing') + ' · ' + fStyleName(cfg.style);
/* Save a finished (or ended) coach session to History as an activity */
function fightSave(T) {
  const el = Math.max(60, tElapsed(T)); const rounds = T.done ? T.cfg.rounds : T.roundsDone; const m = Math.max(1, Math.round(el / 60)); const end = Date.now();
  const x = { id: uid('s'), kind: 'activity', activity: FIGHT_ACT[T.cfg.style] || 'boxing', name: fSessName(T.cfg), startedAt: end - m * 60000, endedAt: end, updatedAt: end, items: [], prs: [], dur: m, dist: 0, distU: 'mi',
    note: rounds + ' × ' + clock(T.cfg.round) + ' rounds' + (T.cfg.style === 'bjj' ? '' : ' · ' + (FLEVELS.find(l => l[0] === T.cfg.level) || FLEVELS[0])[1].toLowerCase()), fight: { style: T.cfg.style, where: T.cfg.where, rounds, round: T.cfg.round, level: T.cfg.level, calls: T.calls } };
  commit(st => { st.sessions[x.id] = x; }, 's_' + x.id); T.saved = 'history'; showToast({ kind: 'info', text: x.name + ' saved to History' }); S.rerender();
}
/* Started from a program's workout: the rounds fill that exercise's sets */
function fightFill(T) {
  const id = T.cfg.fill; const n0 = T.done ? T.cfg.rounds : T.roundsDone; if (!S.active || !id || !n0) return;
  commit(st => { const a = st.active; if (!a) return; const it = a.items.find(i => i.ex === id && i.sets.some(x => !(+x.t > 0))) || a.items.find(i => i.ex === id); if (!it) return; let n = n0;
    for (const x of it.sets) { if (n <= 0) break; if (!(+x.t > 0)) { x.t = T.cfg.round; x.w = x.w || 0; x.r = x.r || 0; n--; } }
    while (n > 0) { it.sets.push({ id: uid('t'), w: 0, r: 0, n: '', t: T.cfg.round }); n--; } }, 'active');
  T.saved = 'workout'; showToast({ kind: 'info', text: n0 + ' round' + (n0 === 1 ? '' : 's') + ' added to your workout' }); S.rerender();
}

const fRunning = () => !!(FR.T && !FR.T.done && !FR.T.ended);
function fightGo(cfg) {
  if (fRunning()) { UI.setTab('train'); UI.setView({ type: 'fight' }); showToast({ kind: 'info', text: 'Your rounds are still going. End them to start new ones.' }); return; }
  if (S.itimer) { showToast({ kind: 'info', text: 'End the interval timer first, so two timers don’t beep at once.' }); return; }
  fightStart(cfg); UI.setTab('train'); UI.setView({ type: 'fight' });
}
/* Shown at the top of other screens while the coach runs */
function FightMini() {
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(iv); }, []);
  const T = FR.T; if (!T) return null; const p = tLocate(T); if (!p) return null;
  const label = p.phase.kind === 'work' ? 'Round ' + p.phase.round + ' of ' + T.cfg.rounds : p.phase.label;
  return html`<div class="mini" role="timer" id="fight-mini"><button class="mini-open" onClick=${() => { UI.setTab('train'); UI.setView({ type: 'fight' }); }}><b>${clock(Math.ceil(p.left - 1e-6))}</b><span>${label} · ${fStyleName(T.cfg.style)}${T.pausedAt ? ' · paused' : ''}</span></button>
    <button class="mini-btn" onClick=${fightPause}>${T.pausedAt ? 'Resume' : 'Pause'}</button></div>`;
}
/* Sessions and rounds, last 7 days and all time */
function fightTotals() {
  const since = Date.now() - 7 * DAY; const w = { n: 0, rounds: 0, mins: 0 }, all = { n: 0, rounds: 0, mins: 0 };
  for (const s of sessionList()) {
    const isF = (s.kind === 'activity' && ['boxing', 'kickbox', 'mma', 'bjj'].includes(s.activity)) || String(s.routineId || '').startsWith('bi-fight-');
    if (!isF) continue; const m = +s.dur || Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000) || 0; const r = s.fight ? +s.fight.rounds || 0 : 0;
    for (const o of s.startedAt >= since ? [w, all] : [all]) { o.n++; o.mins += m; o.rounds += r; } }
  return { w, all };
}
const fLine = o => o.n + ' session' + (o.n === 1 ? '' : 's') + (o.rounds ? ' · ' + o.rounds + ' rounds' : '') + (o.mins ? ' · ' + (o.mins >= 120 ? Math.round(o.mins / 6) / 10 + ' h' : o.mins + ' min') : '');
/* ---- Screens ---- */
function FightScreen() {
  const tab = ['coach', 'combos', 'drills', 'programs'].includes(lsGet('fightTab')) ? lsGet('fightTab') : 'coach';
  const pick = k => { lsSet('fightTab', k); S.rerender(); scrollTo(0, 0); };
  return html`<div id="fight-screen">
    <div class="seg wide fight-seg" role="tablist" style="margin-top:12px">${[['coach', 'Coach'], ['combos', 'Combos'], ['drills', 'Drills'], ['programs', 'Programs']].map(([k, l]) => html`<button key=${k} role="tab" id=${'fight-tab-' + k} aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => pick(k)}>${l}</button>`)}</div>
    ${tab === 'combos' ? html`<${FightCombos}/>` : tab === 'drills' ? html`<${FightDrills}/>` : tab === 'programs' ? html`<${FightPrograms}/>` : html`<${FightCoach}/>`}
    <p class="small faint" style="margin-top:18px">${FIGHT_NOTE}</p></div>`;
}
function fFocusShort(c) { if (c.style === 'bjj' || c.focus === 'mix') return false; const all = (FCOMBOS[c.style] || []).filter(([, l]) => l <= c.level); return all.filter(([k]) => fFocusOk(k, c.focus)).length < 4; }
const fSummary = c => fStyleName(c.style) + ' · ' + (FLEVELS.find(l => l[0] === c.level) || FLEVELS[0])[1].toLowerCase() + (c.style === 'bjj' ? '' : (c.where === 'bag' ? ' · bag' : '') + (c.focus !== 'mix' ? ' · ' + (FFOCUS.find(f => f[0] === c.focus) || FFOCUS[0])[1].toLowerCase() : '')) + ' · ' + c.rounds + ' × ' + clock(c.round);
const fTotal = c => (c.prep != null ? c.prep : 10) + c.rounds * c.round + Math.max(0, c.rounds - 1) * c.rest;
const FPRESETS = [
  ['Beginner', 'Boxing · 3 × 2 min', { style: 'box', level: 1, rounds: 3, round: 120, rest: 60, pace: 'slow' }],
  ['Amateur rounds', 'Boxing · 3 × 3 min', { style: 'box', level: 2, rounds: 3, round: 180, rest: 60, pace: 'med' }],
  ['Pro rounds', 'Boxing · 6 × 3 min', { style: 'box', level: 3, rounds: 6, round: 180, rest: 60, pace: 'fast' }],
  ['Thai rounds', 'Muay Thai · 5 × 3 min', { style: 'thai', level: 2, rounds: 5, round: 180, rest: 120, pace: 'med' }],
  ['MMA rounds', 'MMA · 3 × 5 min', { style: 'mma', level: 2, rounds: 3, round: 300, rest: 60, pace: 'med' }],
  ['BJJ solo flow', 'BJJ · 5 × 2 min', { style: 'bjj', level: 1, rounds: 5, round: 120, rest: 30, pace: 'med' }],
];
function FightCoach() {
  const c = fightSt(); const set = p => fightSet(p);
  const stp = (k, label, step, min, max, fmtv) => html`<div class="tm-field"><span>${label}</span><span class="stepper"><button aria-label=${'Less ' + label} id=${'fc-' + k + '-dn'} onClick=${() => set({ [k]: Math.max(min, c[k] - step) })}>−</button><b class="num" id=${'fc-' + k}>${fmtv ? fmtv(c[k]) : c[k]}</b><button aria-label=${'More ' + label} id=${'fc-' + k + '-up'} onClick=${() => set({ [k]: Math.min(max, c[k] + step) })}>+</button></span></div>`;
  const seg = (k, opts, label) => html`<div class="seg wide" role="group" aria-label=${label} style="margin-top:8px">${opts.map(([v, l]) => html`<button key=${v} class=${c[k] === v ? 'on' : ''} aria-pressed=${c[k] === v} onClick=${() => set({ [k]: v })}>${l}</button>`)}</div>`;
  const tog = (k, label, sub) => html`<label class="toggle-row" for=${'fc-' + k}><span><span>${label}</span>${sub ? html`<span class="d">${sub}</span>` : null}</span><input type="checkbox" role="switch" id=${'fc-' + k} checked=${!!c[k]} onChange=${e => set({ [k]: e.target.checked })}/></label>`;
  const tot = fightTotals(); const bjj = c.style === 'bjj'; const T = fRunning() ? FR.T : null;
  const go = () => fightGo({ ...c, only: null });
  return html`<div id="fight-coach">
    <p class="note" style="margin-top:12px">${bjj ? 'Solo grappling rounds: the coach calls a movement, you drill it until the next call.' : 'Shadowbox or hit the bag while the coach calls combos out loud, with a round bell and rest.'} Turn the volume up, switch off Silent mode and keep the screen on.</p>
    ${T ? html`<div class="card stack fc-now" id="fight-now" style="margin-top:12px"><div class="row"><b style="flex:1">Rounds in progress</b><span class="small muted">${fSummary(T.cfg)}</span></div>
      <div class="row" style="gap:8px"><button class="btn primary" style="flex:1" onClick=${() => UI.setView({ type: 'fight' })}>Open</button><button class="btn" style="flex:1" onClick=${fightStop}>End</button></div></div>`
    : html`<div class="card stack fc-now" id="fight-mine" style="margin-top:12px"><span class="lbl">Your rounds</span><b id="fc-summary">${fSummary(c)}</b>
      <button class="btn primary wide" id="fight-start-top" onClick=${go}>Start · ${clock(fTotal(c))}</button></div>`}
    ${tot.all.n ? html`<p class="small muted" id="fight-week" style="margin-top:8px">${tot.w.n ? 'Last 7 days: ' + fLine(tot.w) : 'Nothing in the last 7 days'} · All time: ${fLine(tot.all)}</p>` : null}
    <div class="section-h"><h2>Quick start</h2><span class="aside">Doesn’t change your settings</span></div>
    <div class="fc-presets">${FPRESETS.map(([n, s, p]) => html`<button key=${n} class="fc-preset" onClick=${() => fightGo({ ...c, focus: 'mix', where: 'shadow', ...p, only: null })}><b>${n}</b><span>${s}</span></button>`)}</div>
    <div class="section-h"><h2>Build your rounds</h2></div>
    <div class="range-grid" role="group" aria-label="Style" id="fc-style">${FSTYLES.map(([k, l]) => html`<button key=${k} class=${'chip' + (c.style === k ? ' on' : '')} aria-pressed=${c.style === k} onClick=${() => set({ style: k })}>${l}</button>`)}</div>
    ${seg('level', FLEVELS, 'Level')}
    ${bjj ? null : html`${seg('where', [['shadow', 'Shadowboxing'], ['bag', 'Heavy bag']], 'Where')}${seg('focus', FFOCUS, 'Focus')}`}
    <div class="card stack" style="margin-top:10px;gap:4px">
      ${stp('rounds', 'Rounds', 1, 1, 15)}${stp('round', 'Round', 30, 30, 600, clock)}${stp('rest', 'Rest', 15, 15, 300, clock)}
      <div class="tm-field"><span>Calls</span>${seg('pace', [['slow', 'Slow'], ['med', 'Medium'], ['fast', 'Fast']], 'Call pace')}</div>
      <div class="tm-field"><span class="muted">Total time</span><b class="num" id="fc-total">${clock(fTotal(c))}</b></div></div>
    ${fFocusShort(c) ? html`<p class="small muted" id="fc-focus-note" style="margin-top:6px">Few ${(FFOCUS.find(f => f[0] === c.focus) || FFOCUS[0])[1].toLowerCase()} combos at this level, so the coach mixes in others.</p>` : null}
    <div class="card fc-toggles" style="margin-top:10px">
      ${tog('voice', 'Call out loud', canSpeak() ? 'Uses the phone’s voice. Off: a beep and the combo on screen.' : 'Voice isn’t available here; you’ll get a beep and the combo on screen.')}
      ${bjj ? null : tog('nums', 'Call punches as numbers', '1 jab · 2 cross · 3 lead hook · 4 rear hook · 5 · 6 uppercuts')}
      ${tog('burn', 'Burnout in the last 10 s', 'Ends each round with all-out work')}</div>
    ${T ? null : html`<button class="btn primary wide" id="fight-start" style="margin-top:14px;min-height:56px;font-size:18px" onClick=${go}>Start ${c.rounds} × ${clock(c.round)}</button>`}
    ${bjj ? html`<p class="small muted" style="margin-top:8px">Rolls and breakfalls only come up at Intermediate and Advanced, and only belong on mats you know.</p>` : null}
    <${FightRecent}/></div>`;
}
function FightRecent() {
  const list = sessionList().filter(s => s.kind === 'activity' && s.fight).slice(0, 3);
  if (!list.length) return null;
  return html`<div><div class="section-h"><h2>Recent</h2></div><div class="card">${list.map(s => html`<button key=${s.id} class="opt" onClick=${() => openSheet({ type: 'session', id: s.id })}><div style="flex:1"><div>${s.name}</div><div class="d">${ago(s.startedAt)} · ${s.note || ''}</div></div></button>`)}</div></div>`;
}
/* Train view: the coach running */
function FightRun() {
  const [, tick] = useState(0); useWake();
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(iv); }, []);
  const T = FR.T;
  if (!T) return html`<div><div class="empty"><h3>No rounds running</h3><p>Start from Train → Fight.</p></div><button class="btn primary wide" onClick=${() => { TRAIN.mode = 'fight'; lsSet('trainMode', 'fight'); UI.setView(null); }}>Fight training</button></div>`;
  const c = T.cfg; const close = () => { fightStop(); UI.setView(null); };
  if (T.done || T.ended) {
    const rounds = T.done ? c.rounds : T.roundsDone;
    return html`<div id="fight-done"><div class="tm-card done"><div class="tm-phase">${T.done ? 'Done' : 'Ended'}</div><div class="tm-big">${rounds}</div><div class="tm-sub">round${rounds === 1 ? '' : 's'} of ${clock(c.round)} · ${fSessName(c)}${T.calls ? ' · ' + T.calls + ' calls' : ''}</div></div>
      <div class="stack" style="margin-top:14px">
        ${c.fill && S.active ? html`<button class="btn primary wide" id="fight-fill" disabled=${!!T.saved || !rounds} onClick=${() => fightFill(T)}>${T.saved === 'workout' ? html`${I.check} Added to your workout` : 'Add the rounds to your workout'}</button>`
          : html`<button class="btn primary wide" id="fight-save" disabled=${!!T.saved || tElapsed(T) < 30} onClick=${() => fightSave(T)}>${T.saved === 'history' ? html`${I.check} Saved to History` : 'Save to History'}</button>`}
        <div class="row" style="gap:8px"><button class="btn" style="flex:1" onClick=${() => { FR.T = null; fightGo({ ...c }); }}>Run again</button><button class="btn" style="flex:1" id="fight-close" onClick=${close}>Close</button></div></div></div>`;
  }
  const p = tLocate(T); if (!p) return null;
  const ph = p.phase; const next = T.phases[p.idx + 1]; const call = ph.kind === 'work' ? T.call : null;
  const fresh = call && Date.now() - T.callAt < 700;
  return html`<div id="fight-run">
    <div class=${'tm-card ' + ph.kind + (T.pausedAt ? ' paused' : '')} role="timer">
      <div class="tm-phase">${T.pausedAt ? 'Paused' : ph.kind === 'work' ? 'Round ' + ph.round + ' of ' + c.rounds : ph.label}</div>
      <div class="tm-big">${clock(Math.ceil(p.left - 1e-6))}</div>
      <div class=${'fc-call' + (fresh ? ' fresh' : '') + (call && call.burn ? ' burn' : '')} aria-live=${c.voice ? 'off' : 'polite'} id="fight-call">
        ${call ? (call.burn ? html`<b>${call.c}</b>` : c.style === 'bjj' ? html`<b>${call.c}</b><span>${call.bjj}</span>` : html`<b>${c.nums ? fNum(call.c) : fNames(call.c)}</b>${c.nums && fNum(call.c) !== fNames(call.c) ? html`<span>${fNames(call.c)}</span>` : null}`)
          : html`<span>${ph.kind === 'work' ? 'Move, breathe, hands up' : ph.kind === 'rest' ? 'Walk it off, breathe through the nose' : 'Get in your stance'}</span>`}</div>
      <div class="bar" style="margin-top:14px"><div style=${{ width: (p.el / T.total * 100).toFixed(1) + '%' }}></div></div>
      <div class="row small" style="margin-top:8px"><span>${next ? 'Next: ' + (next.kind === 'work' ? 'Round ' + next.round : next.label) + ' ' + clock(next.secs) : 'Last round'}</span><span class="spacer"></span><span class="num">${clock(Math.ceil(T.total - p.el))} left</span></div>
    </div>
    <div class="tm-ctl"><button class="btn" id="fight-voice" onClick=${() => { c.voice = !c.voice; fightSet({ voice: c.voice }); if (!c.voice) { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} } S.rerender(); }} aria-pressed=${!!c.voice}>${c.voice ? 'Voice on' : 'Voice off'}</button><button class="btn primary" id="fight-pause" onClick=${fightPause}>${T.pausedAt ? 'Resume' : 'Pause'}</button><button class="btn" onClick=${fightSkip}>Skip</button></div>
    <button class="btn text danger wide" id="fight-end" style="margin-top:8px" onClick=${() => { T.ended = true; T.pausedAt = T.pausedAt || Date.now(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} S.rerender(); }}>End rounds</button>
    <p class="small faint" style="margin-top:8px">${c.where === 'bag' && c.style !== 'bjj' ? 'Wrap your hands and wear bag gloves. ' : ''}Calls pause if the phone locks; keep it on screen.</p></div>`;
}
/* Combo library */
function FightCombos() {
  const c = fightSt(); const style = c.style === 'bjj' ? 'box' : c.style; const fav = c.fav || [];
  const togFav = k => fightSet({ fav: fav.includes(k) ? fav.filter(x => x !== k) : fav.concat(k) });
  const drill = combo => fightGo({ ...c, style, only: combo, rounds: 1, round: 60, rest: 30, burn: false });
  const used = new Set(FCOMBOS[style].flatMap(([k]) => fToks(k)));
  const keyGroups = [['p', 'Punches'], ['d', 'Defense'], ['f', 'Footwork'], ['k', 'Kicks'], ['n', 'Knees and elbows'], ['c', 'Clinch'], ['w', 'Wrestling'], ['g', 'Ground']];
  return html`<div id="fight-combos">
    <div class="range-grid" role="group" aria-label="Style" style="margin-top:12px">${FSTYLES.filter(s => s[0] !== 'bjj').map(([k, l]) => html`<button key=${k} class=${'chip' + (style === k ? ' on' : '')} aria-pressed=${style === k} onClick=${() => fightSet({ style: k })}>${l}</button>`)}</div>
    ${c.style === 'bjj' ? html`<p class="small muted" style="margin-top:8px">BJJ solo calls movements, not combos. Pick a striking style to see its combos.</p>` : null}
    <details class="card fc-key" style="margin-top:10px" id="fc-key"><summary><span style="flex:1"><b>The moves</b><span class="small muted" style="display:block">Numbers and how to throw them</span></span></summary>
      ${keyGroups.map(([g, gl]) => { const ms = Object.entries(FMOVES).filter(([k, m]) => m[2] === g && used.has(k)); return ms.length ? html`<div key=${g} style="margin-top:10px"><span class="lbl">${gl}</span>${ms.map(([k, m]) => html`<div key=${k} class="fc-move"><b>${m[0]}</b><div><div>${m[1]}</div><div class="small muted">${m[3]}</div></div></div>`)}</div>` : null; })}</details>
    <p class="note" style="margin-top:10px">Tap ★ to have the coach call a combo more often. Drill runs one minute of just that combo.</p>
    ${FLEVELS.map(([l, ln]) => html`<div key=${l}><div class="section-h"><h2>${ln}</h2></div><div class="card fc-list">${FCOMBOS[style].filter(x => x[1] === l).map(([k]) => { const id = style + ':' + k; const on = fav.includes(id);
      return html`<div key=${k} class="fc-row"><button class=${'fc-star' + (on ? ' on' : '')} aria-label=${(on ? 'Unstar ' : 'Star ') + fNames(k)} aria-pressed=${on} onClick=${() => togFav(id)}>${on ? '★' : '☆'}</button><div style="flex:1;min-width:0"><div class="fc-num">${fNum(k)}</div>${fNum(k) !== fNames(k) ? html`<div class="small muted">${fNames(k)}</div>` : null}</div><button class="pill-btn" onClick=${() => drill(k)}>Drill</button></div>`; })}</div></div>`)}</div>`;
}
/* Drills and session ideas: [id, category, name, time, how, why, start]. start: coach settings, or a timer. */
const FDRILLS = [
  ['s-home20', 'Session ideas', '20-minute home boxing', '20 min', ['3 min jump rope or skipping in place', '3 × 2 min shadowboxing, beginner calls, 30 s rest', '2 min footwork: box step and pivots', '2 × 1 min defense focus: slips and rolls', '3 min push-ups and plank, 30 s each'], 'Enough to learn the basics and sweat without a bag or partner.', { coach: { style: 'box', level: 1, focus: 'mix', rounds: 3, round: 120, rest: 30, pace: 'slow' } }],
  ['s-bag30', 'Session ideas', '30-minute bag workout', '30 min', ['5 min rope and dynamic warm-up', '6 × 3 min on the bag, 1 min rest: technique, power, body-head, volume, defense, burnout', '5 min core and stretch'], 'Builds power and punch endurance; the round structure matches amateur fights.', { coach: { style: 'box', level: 2, where: 'bag', rounds: 6, round: 180, rest: 60, pace: 'med' } }],
  ['s-thai', 'Session ideas', 'Muay Thai home rounds', '35 min', ['5 min rope', '3 × 3 min kick drills: teeps, low kicks, body kicks, each side', '5 × 3 min Muay Thai calls, 2 min rest', 'Finish: 3 × 30 s fast knees'], 'Muay Thai rounds are 3 minutes with 2 minutes rest; this builds the kicking base.', { coach: { style: 'thai', level: 1, rounds: 5, round: 180, rest: 120, pace: 'med' } }],
  ['s-bjj15', 'Session ideas', '15-minute BJJ solo flow', '15 min', ['5 × 2 min of called movements: shrimp, bridge and roll, technical stand-up, sit-outs, bear crawls', '30 s rest between', 'Easy hip and neck mobility after'], 'Keeps your hips and movement sharp between classes, or before you start.', { coach: { style: 'bjj', level: 1, rounds: 5, round: 120, rest: 30, pace: 'med' } }],
  ['s-mma', 'Session ideas', 'MMA striking and sprawls', '25 min', ['Rope or jog 3 min', '3 × 5 min MMA calls with level changes and sprawls, 1 min rest', 'Technical stand-ups: 3 × 10'], 'Mixes striking with the level changes and get-ups that wear you out in MMA.', { coach: { style: 'mma', level: 1, rounds: 3, round: 300, rest: 60, pace: 'med' } }],
  ['f-box', 'Footwork', 'Box step', '3 × 1 min', ['Imagine a square on the floor', 'Step forward, right, back, left in your stance, lead foot first in the direction you move', 'Never cross your feet; keep your stance width the whole time', 'Then reverse direction'], 'Teaches you to move in every direction while staying ready to punch.', { timer: { mode: 'intervals', name: 'Footwork 3 × 1 min', prep: 10, work: 60, rest: 20, rounds: 3, sets: 1, setRest: 0, cool: 0 } }],
  ['f-pivot', 'Footwork', 'Pivot drill', '3 × 1 min', ['Jab, then pivot a quarter turn on the lead foot', 'Jab, cross, pivot', 'Keep your chin down and hands up while you turn'], 'Pivoting takes you off the line of attack and opens new angles.', { coach: { style: 'box', level: 2, focus: 'foot', rounds: 3, round: 60, rest: 20, pace: 'slow' } }],
  ['f-inout', 'Footwork', 'In and out', '3 × 1 min', ['Step in with a jab, step back out of range', 'Then 1-2 in, step out', 'Stay light on the balls of your feet'], 'Range control: get in, land, and get out before anything comes back.', null],
  ['f-line', 'Footwork', 'Line drill', '2 × 1 min', ['Stand with a tape line between your feet', 'Move forward and back without your feet ever landing on the line', 'Add jabs while moving'], 'Keeps your stance from narrowing or crossing as you move.', null],
  ['d-slipline', 'Defense', 'Slip line', '3 × 2 min', ['Tie a rope at shoulder height across the room', 'Walk along it, rolling under it in a U shape each step', 'Throw a hook or uppercut each time you come up'], 'The classic way to learn rolling with your legs, not your waist.', { timer: { mode: 'intervals', name: 'Slip line 3 × 2 min', prep: 10, work: 120, rest: 30, rounds: 3, sets: 1, setRest: 0, cool: 0 } }],
  ['d-mirror', 'Defense', 'Slip and counter in the mirror', '3 × 1 min', ['Imagine a jab: slip to the outside, answer with a cross', 'Imagine a cross: slip to the inside, answer with a lead hook', 'Watch your head move off the center line in the mirror'], 'Builds the habit of answering every defense with a punch.', { coach: { style: 'box', level: 2, focus: 'def', rounds: 3, round: 60, rest: 20, pace: 'slow' } }],
  ['d-guard', 'Defense', 'High guard walk', '2 × 1 min', ['Walk forward behind a tight high guard', 'Every few steps, tuck tighter as if blocking, then throw a 1-2', 'Elbows in, chin down'], 'Teaches you to close distance safely behind your guard.', null],
  ['b-power', 'Heavy bag', 'Power tens', '3 × 3 min', ['Work the bag at a steady pace', 'Every 30 seconds: 10 hard punches as fast as you can', 'Back to steady'], 'Trains repeat power, the way a real round surges and settles.', { timer: { mode: 'intervals', name: 'Bag 3 × 3 min', prep: 10, work: 180, rest: 60, rounds: 3, sets: 1, setRest: 0, cool: 0 } }],
  ['b-bodyhead', 'Heavy bag', 'Body-head round', '3 min', ['Every combo goes to the body first, then the head: 3b-3, 2b-3-2', 'Bend the knees to go to the body'], 'Body shots set up head shots and slow an opponent down.', null],
  ['b-jab', 'Heavy bag', 'Jab-only round', '3 min', ['Only jabs: single, double, triple, to the body', 'Move around the bag between jabs'], 'The jab sets up everything; a round of only jabs sharpens it fast.', null],
  ['b-volume', 'Heavy bag', 'Volume round', '2 min', ['Non-stop light, fast punches the whole round', 'Stay relaxed; don’t load up'], 'Builds shoulder endurance and the ability to keep working when tired.', null],
  ['b-circle', 'Heavy bag', 'Circle the bag', '3 min', ['Move around the bag both ways, punching from new angles', 'Pivot off after every combo'], 'Stops you standing square in front of the bag (or an opponent).', null],
  ['r-rope', 'Jump rope', 'Rope rounds', '3–5 × 3 min', ['Basic bounce, then alternate feet like jogging', 'Boxer skip: shift weight side to side', 'Last 30 s of each round: as fast as you can'], 'The boxer’s warm-up: rhythm, calf strength, footwork and conditioning.', { timer: { mode: 'intervals', name: 'Rope 3 × 3 min', prep: 10, work: 180, rest: 60, rounds: 3, sets: 1, setRest: 0, cool: 0 } }],
  ['t-teep', 'Muay Thai', 'Teep line', '3 × 1 min', ['Lead teep, step forward, rear teep', 'Push through the target with the ball of the foot, then set it back down in stance'], 'The teep controls range in Muay Thai and keeps pressure off you.', null],
  ['t-balance', 'Muay Thai', 'Kick and hold', '2 × 10 each side', ['Throw a slow round kick, hold the leg at full extension for 2 s', 'Return to stance without putting the foot down early'], 'Builds the balance and hip strength that make kicks land and return.', null],
  ['t-switch', 'Muay Thai', 'Switch kicks', '3 × 1 min', ['Quick switch of the feet, then a body kick', 'Reset, repeat', 'Stay tall on the ball of the support foot'], 'A fast way to kick with your lead side hard.', null],
  ['t-knees', 'Muay Thai', 'Clinch knees on the bag', '3 × 1 min', ['Hold the bag like a clinch, forearms tight', 'Alternate knees, pulling the bag down into each one', 'Hips forward, stand tall'], 'Clinch knees win close-range exchanges; this builds the hips and grip for them.', { timer: { mode: 'intervals', name: 'Knees 3 × 1 min', prep: 10, work: 60, rest: 30, rounds: 3, sets: 1, setRest: 0, cool: 0 } }],
  ['t-check', 'Muay Thai', 'Check and return', '2 × 1 min', ['On a call, lift the lead knee and turn the shin out', 'Put it down and answer with a cross or low kick'], 'Checking is how you defend the low kick; answering makes it pay.', { coach: { style: 'thai', level: 1, focus: 'def', rounds: 2, round: 60, rest: 30, pace: 'slow' } }],
  ['w-sprawl', 'Wrestling & MMA', 'Sprawl drill', '5 × 30 s', ['From stance, throw the legs back and hips to the floor', 'Back up to stance and punch 1-2', 'Repeat'], 'Stops takedowns and builds hip power; brutal conditioning too.', { timer: { mode: 'intervals', name: 'Sprawls 5 × 30 s', prep: 10, work: 30, rest: 30, rounds: 5, sets: 1, setRest: 0, cool: 0 } }],
  ['w-level', 'Wrestling & MMA', 'Level change ladder', '3 × 10', ['From stance, drop the hips (not the head) and come back up', 'Add a penetration step: lead knee toward the floor, back foot drives up', 'Back straight, head up'], 'The level change is the start of every takedown and makes your punches harder to read.', null],
  ['w-standup', 'Wrestling & MMA', 'Wall stand-ups', '3 × 6', ['Sit with your back to a wall', 'Wall-walk up with hands posting, hips off the wall, turn out to stance', 'Then the technical stand-up from the open floor'], 'Getting up safely is the most useful skill in MMA and self-defense.', null],
  ['g-shrimp', 'BJJ solo', 'Shrimp the mat', '3 lengths', ['On your back, push off one foot and drive the hips away', 'Turn onto your side, then back flat, and switch sides', 'Travel the length of the room'], 'Hip escapes are how you make space from bottom positions.', null],
  ['g-upa', 'BJJ solo', 'Bridge and roll', '3 × 8 each side', ['Bridge high onto one shoulder', 'Look over that shoulder and turn to your knees', 'Come back down and switch'], 'The first mount escape most people learn; builds the bridge too.', null],
  ['g-flow', 'BJJ solo', 'Solo movement flow', '5 × 2 min', ['The coach calls a movement every ~18 s', 'Drill it smoothly until the next call', 'Breathe; this is technique, not a sprint'], 'Strings the basic movements together so they flow in a roll.', { coach: { style: 'bjj', level: 2, rounds: 5, round: 120, rest: 30, pace: 'med' } }],
  ['g-guard', 'BJJ solo', 'Leg circles and hip heists', '3 × 1 min', ['On your back, circle the legs and turn the hips as if keeping someone in front of you', 'Then hip heist up to a knee and back down'], 'Guard retention and getting up from the bottom.', null],
  ['g-crawl', 'BJJ solo', 'Animal crawls', '4 × 30 s', ['Bear crawl forward and back', 'Crab walk, then sit through and switch', 'Knees an inch off the floor'], 'Builds the shoulders, core and coordination grappling asks for.', null],
  ['x-neck', 'Strength & durability', 'Neck strength', '2–3 × week', ['Hand-against-head holds: push the head into your hand front, back and each side, 10 s each, easy pressure', 'Chin tucks: 2 × 10', 'Build slowly; never jerk the neck, no bridges on your head without a coach'], 'A strong neck handles grappling pressure and impacts better.', null],
  ['x-grip', 'Strength & durability', 'Grappler’s grip', '2 × week', ['Towel or gi hangs: 3 × max hold', 'Farmer’s carries: 3 × 40 m heavy', 'Dead hangs: 3 × max'], 'Grip fatigue ends grappling rounds early; train it on purpose.', null],
  ['x-rot', 'Strength & durability', 'Rotational power', '3 × 5 each side', ['Med ball rotational throws against a wall', 'Turn from the back hip, like a hook', 'Fast and explosive, full rest between sets'], 'Punching and kicking power come from turning the hips fast.', null],
  ['x-hips', 'Strength & durability', 'Fighter hip mobility', '10 min', ['90/90 hip switches: 2 × 10', 'Cossack squats: 2 × 6 each side', 'Deep squat hold: 2 × 30 s'], 'Kicks, sprawls and guard all need open hips.', null],
  ['x-road', 'Strength & durability', 'Roadwork', '20–40 min easy', ['Easy run at a pace you can talk at', '2–3 times a week alongside skill work', 'Or the bike if your legs need a break'], 'Fighters have always run: the aerobic base is what lets you recover between rounds.', null],
];
function FightDrills() {
  const c = fightSt(); const cats = [...new Set(FDRILLS.map(d => d[1]))];
  const start = s => { if (s.coach) fightGo({ ...c, where: 'shadow', focus: 'mix', burn: true, only: null, ...s.coach });
    else if (s.timer) { if (fRunning()) { showToast({ kind: 'info', text: 'End your rounds first, so two timers don’t beep at once.' }); return; } startInterval({ id: 'fd-' + Date.now(), ...s.timer }); UI.setView({ type: 'timer' }); } };
  return html`<div id="fight-drills">
    <p class="note" style="margin-top:12px">Training ideas you can do alone with little or no equipment. Tap one to see how; some start the coach or a round timer.</p>
    ${cats.map(cat => html`<div key=${cat}><div class="section-h"><h2>${cat}</h2></div><div class="stack" style="gap:8px">${FDRILLS.filter(d => d[1] === cat).map(([id, , name, time, how, why, s]) => html`<details key=${id} class="card fd-card" id=${'fd-' + id}><summary><span style="flex:1;font-weight:700">${name}</span><span class="small muted">${time}</span></summary>
      <ol class="run-ul" style="margin-top:8px">${how.map((t, i) => html`<li key=${i}>${t}</li>`)}</ol><p class="small muted" style="margin-top:8px">${why}</p>
      ${s ? html`<button class="btn wide" style="margin-top:10px" onClick=${() => start(s)}>${s.coach ? 'Start with the coach' : html`${I.timer} Start the round timer`}</button>` : null}</details>`)}</div></div>`)}</div>`;
}

/* ---- Fight programs (Routines). Items: [exercise, sets, reps, note, target]. A day can carry the coach (fight) or a timer. ---- */
const FIGHT_EX = { timed: ['Shadowboxing Rounds', 'Heavy Bag Rounds', 'Jump Rope', 'Footwork Drill', 'Slip Line Drill', 'Kick Drill', 'Teep Drill', 'Clinch Knees on Bag', 'Sprawl Drill', 'BJJ Solo Movement Rounds', 'Neck Isometric Hold', 'Hollow Body Hold', 'Bear Crawl', 'Towel Hang'],
  bodyweight: ['Technical Stand-Up', 'Bridge and Roll (Upa)', 'Shrimp (Hip Escape)', 'Sit-Out', 'Broad Jump', 'Level Change and Penetration Step', 'Hip Heist', 'Cossack Squat'],
  other: ['Med Ball Rotational Throw', 'Band Neck Extension', 'Landmine Rotation'] };
const FIGHT_NOLOAD = ['Shadowboxing Rounds', 'Heavy Bag Rounds', 'Jump Rope', 'Footwork Drill', 'Slip Line Drill', 'Kick Drill', 'Teep Drill', 'Clinch Knees on Bag', 'Sprawl Drill', 'BJJ Solo Movement Rounds', 'Bear Crawl', 'Shadow Boxing or Bag', 'Sprawls'];
for (const [k, ns] of Object.entries(FIGHT_EX)) for (const n of ns) ensureEx(n, k, /neck|hollow|bear|landmine|rotational/i.test(n) ? 'core' : /jump rope|footwork|sprawl|rounds|drill|knees/i.test(n) ? 'cardio' : /broad|cossack|stand-up|level/i.test(n) ? 'legs' : 'other');
for (const n of FIGHT_NOLOAD) { const e = findIn(BUILTIN_EX)(n); if (e) e.nol = true; }
const rd = s => ({ dur: s, judge: 'dur' });
const FPROGS = [
  { id: 'bi-fight-box', name: 'Boxing Basics', builds: 'Stance, the 1–6 punches, footwork, defense, rounds', week: '3× · 30–40 min', equip: 'Jump rope; bag optional', cost: 'Medium',
    fit: 'You want to learn to box, or get boxing fit, from home or the gym.',
    strengths: ['Teaches the six punches, slips, rolls and footwork in a set order, one level at a time.', 'Rounds are timed like real ones, so your conditioning matches what boxing asks for.', 'Works with or without a bag; every day has a shadowboxing version.'],
    result: 'In 6–8 weeks most beginners can throw clean 3–4 punch combos with defense, last 3 × 3 min rounds at a steady pace, and recover noticeably faster between rounds. Real timing and distance come from a coach and partner work.',
    watch: ['Wrap your hands and wear bag gloves for bag work; bare-knuckle bag work hurts wrists and knuckles.', 'Don’t snap punches to full lockout in the air; stop just short to spare the elbows.', 'Skip a day before heavy Legs or Push if your shoulders are tired.'],
    days: [
      ['A: Punches and footwork', [['Jump Rope', 3, '', 'Basic bounce, then alternate feet.', rd(180)], ['Footwork Drill', 3, '', 'Box step, then pivots.', rd(60)], ['Shadowboxing Rounds', 3, '', 'Start the coach at the top of the workout: beginner calls.', rd(120)], ['Push-Ups', 3, '12'], ['Plank', 2, '', '', rd(45)]],
        null, { style: 'box', level: 1, focus: 'mix', rounds: 3, round: 120, rest: 60, pace: 'slow', fillName: 'Shadowboxing Rounds' }],
      ['B: Bag or power rounds', [['Jump Rope', 2, '', '', rd(180)], ['Heavy Bag Rounds', 4, '', 'Start the coach at the top of the workout, or shadowbox hard if there’s no bag.', rd(180)], ['Med Ball Rotational Throw', 3, '5', 'Each side. Turn from the back hip.'], ['Hollow Body Hold', 3, '', '', rd(30)]],
        null, { style: 'box', level: 2, where: 'bag', focus: 'off', rounds: 4, round: 180, rest: 60, pace: 'med', fillName: 'Heavy Bag Rounds' }],
      ['C: Defense and conditioning', [['Jump Rope', 2, '', '', rd(180)], ['Slip Line Drill', 3, '', 'Rope at shoulder height; roll under, punch on the way up.', rd(120)], ['Shadowboxing Rounds', 3, '', 'Start the coach at the top of the workout: defense focus.', rd(180)], ['Burpees', 3, '10'], ['Neck Isometric Hold', 2, '', 'Hand against the head, front, back and sides, easy pressure.', rd(10)]],
        null, { style: 'box', level: 2, focus: 'def', rounds: 3, round: 180, rest: 60, pace: 'med', fillName: 'Shadowboxing Rounds' }],
    ] },
  { id: 'bi-fight-thai', name: 'Muay Thai at Home', builds: 'Kicks, teeps, knees, elbows, balance, kicking endurance', week: '3× · 35–45 min', equip: 'Jump rope; bag helps', cost: 'Medium–high',
    fit: 'You want Muay Thai or kickboxing fitness and technique between classes, or before you start.',
    strengths: ['Builds the hips, balance and calf strength that kicking depends on.', 'Rounds follow the Muay Thai format: 3 minutes on, 2 off.', 'Each day has a coach session with Muay Thai calls: kicks, knees, elbows and clinch.'],
    result: 'In 6–8 weeks kicks feel more balanced and return faster, 5 × 3 min rounds become manageable, and your shins and hips handle the volume better. Shin conditioning comes from gradual bag work, not shortcuts.',
    watch: ['Build kicking on a bag slowly: start light and add a few kicks a week.', 'Don’t kick hard into the air with a straight knee; keep a slight bend.', 'Elbows and knees in the air only; save hard ones for the bag with control.'],
    days: [
      ['A: Kicks and teeps', [['Jump Rope', 3, '', '', rd(180)], ['Teep Drill', 3, '', 'Lead and rear teeps along the room.', rd(60)], ['Kick Drill', 3, '', 'Kick and hold 2 s at extension, each side.', rd(60)], ['Shadowboxing Rounds', 3, '', 'Start the coach at the top of the workout: Muay Thai, beginner.', rd(180)], ['Calf Raises', 3, '15']],
        null, { style: 'thai', level: 1, rounds: 3, round: 180, rest: 120, pace: 'slow', fillName: 'Shadowboxing Rounds' }],
      ['B: Knees, elbows and clinch', [['Jump Rope', 2, '', '', rd(180)], ['Clinch Knees on Bag', 3, '', 'Or with a pillow on a wall.', rd(60)], ['Heavy Bag Rounds', 4, '', 'Start the coach at the top of the workout. Shadow if there’s no bag.', rd(180)], ['Towel Hang', 3, '', 'Grip for the clinch.', { judge: 'max' }], ['Neck Isometric Hold', 2, '', 'Easy pressure.', rd(10)]],
        null, { style: 'thai', level: 2, where: 'bag', rounds: 4, round: 180, rest: 120, pace: 'med', fillName: 'Heavy Bag Rounds' }],
      ['C: Fight rounds', [['Shadowboxing Rounds', 5, '', 'Start the coach at the top of the workout: intermediate Muay Thai.', rd(180)], ['Sprawl Drill', 3, '', '', rd(30)], ['Cossack Squat', 2, '6', 'Each side; hip mobility for kicks.']],
        null, { style: 'thai', level: 2, rounds: 5, round: 180, rest: 120, pace: 'med', fillName: 'Shadowboxing Rounds' }],
    ] },
  { id: 'bi-fight-mma', name: 'MMA Fight Conditioning', builds: 'Striking to takedown, sprawls, getting up, 5-minute rounds', week: '3× · 30–45 min', equip: 'Mat or open floor', cost: 'High',
    fit: 'You train or want to train MMA and need the stamina for mixed rounds.',
    strengths: ['Mixes punches and kicks with level changes, sprawls and stand-ups, which is what tires you in MMA.', '5-minute rounds build the pacing MMA needs.', 'A strength day for grip, hips and neck.'],
    result: 'In 6–8 weeks you keep your shape and output deeper into 5-minute rounds, sprawl and get up faster, and recover quicker between rounds.',
    watch: ['High cost on the legs: never the day before or after heavy Legs.', 'Sprawls hit the knees and toes on hard floors; use a mat.', 'Takedown entries without a partner are footwork only; learn the finish with a coach.'],
    days: [
      ['A: Striking to takedown', [['Jump Rope', 2, '', '', rd(180)], ['Level Change and Penetration Step', 3, '10'], ['Shadowboxing Rounds', 3, '', 'Start the coach at the top of the workout: MMA calls.', rd(300)], ['Technical Stand-Up', 3, '6', 'Each side.']],
        null, { style: 'mma', level: 1, rounds: 3, round: 300, rest: 60, pace: 'med', fillName: 'Shadowboxing Rounds' }],
      ['B: Scramble rounds', [['Sprawl Drill', 5, '', '30 s sprawl and up, 30 s rest.', rd(30)], ['Bear Crawl', 4, '', '', rd(30)], ['Burpees', 3, '10'], ['Kettlebell Swing', 3, '15']],
        { mode: 'intervals', name: 'Scramble 5 × 30 s', prep: 10, work: 30, rest: 30, rounds: 5, sets: 1, setRest: 0, cool: 0 }],
      ['C: Fighter strength', [['Pull-Up', 3, '6-10'], ["Farmer's Carry", 3, '', 'Heavy.', { d: 40 }], ['Med Ball Rotational Throw', 3, '5', 'Each side.'], ['Band Neck Extension', 2, '15', 'Light.'], ['Hollow Body Hold', 3, '', '', rd(30)]]],
    ] },
  { id: 'bi-fight-bjj', name: 'BJJ Solo & Mat Strength', builds: 'Hip movement, escapes, grip, neck, getting up', week: '2–3× · 20–30 min', equip: 'Mat or carpet; towel', cost: 'Low–medium',
    fit: 'You train jiu-jitsu (or are about to) and want movement and grappling strength on the off days.',
    strengths: ['The solo movements of BJJ (shrimps, bridges, sit-outs, stand-ups) drilled until they’re smooth.', 'Grip and neck strength for the gi and no-gi grind.', 'Light enough to do the day after class.'],
    result: 'In 4–8 weeks the basic movements feel automatic, hip escapes get faster, and grip lasts longer into a roll. It won’t replace drilling with partners.',
    watch: ['Rolls and breakfalls only on mats, and learn them from a coach first.', 'Neck work stays gentle: easy pressure, no bridging on your head.', 'Skip the strength day the day before a hard class.'],
    days: [
      ['A: Solo movement flow', [['BJJ Solo Movement Rounds', 5, '', 'Start the coach at the top of the workout: it calls a movement every ~18 s.', rd(120)], ['Shrimp (Hip Escape)', 3, '10', 'Each side, traveling.'], ['Bridge and Roll (Upa)', 3, '8', 'Each side.'], ['Technical Stand-Up', 3, '6', 'Each side.']],
        null, { style: 'bjj', level: 1, rounds: 5, round: 120, rest: 30, pace: 'med', fillName: 'BJJ Solo Movement Rounds' }],
      ['B: Grip and pull', [['Towel Hang', 3, '', 'Towel or gi over the bar.', { judge: 'max' }], ['Pull-Up', 3, '6-10'], ['Barbell Row', 3, '8-10'], ["Farmer's Carry", 3, '', 'Heavy.', { d: 40 }], ['Neck Isometric Hold', 2, '', 'Easy pressure, front, back, sides.', rd(10)]]],
      ['C: Hips and getting up', [['Hip Heist', 3, '8', 'Each side.'], ['Sit-Out', 3, '10', 'Each side.'], ['Cossack Squat', 3, '6', 'Each side.'], ['Bear Crawl', 3, '', '', rd(30)], ['Glute Bridge', 3, '12']]],
    ] },
  { id: 'bi-fight-bag', name: 'Heavy Bag Builder', builds: 'Punching power, punch endurance, combinations', week: '2× · 30 min', equip: 'Heavy bag, wraps, bag gloves', cost: 'Medium',
    fit: 'You have a bag and want a clear plan for it.',
    strengths: ['Two bag days: one for power and accuracy, one for volume and pace.', 'Round counts build week to week: add a round every two weeks up to 8.', 'Fits alongside a lifting split as conditioning.'],
    result: 'In 6–8 weeks you can hold a hard pace for 6–8 rounds, punches land with more snap, and shoulders stop burning out by round 3.',
    watch: ['Wraps and bag gloves every time; most bag injuries are wrists and knuckles.', 'Punch through the bag, but don’t lean on it or push.', 'Stop if your wrist or knuckles ache the next day; go lighter.'],
    days: [
      ['A: Power and accuracy', [['Jump Rope', 2, '', '', rd(180)], ['Heavy Bag Rounds', 6, '', 'Start the coach at the top of the workout: bag, offense, power punches.', rd(180)], ['Med Ball Rotational Throw', 3, '5', 'Each side.']],
        null, { style: 'box', level: 2, where: 'bag', focus: 'off', rounds: 6, round: 180, rest: 60, pace: 'slow', fillName: 'Heavy Bag Rounds' }],
      ['B: Volume and pace', [['Jump Rope', 2, '', '', rd(180)], ['Heavy Bag Rounds', 6, '', 'Start the coach at the top of the workout: fast calls, keep the hands moving.', rd(120)], ['Push-Ups', 3, '15'], ['Hollow Body Hold', 3, '', '', rd(30)]],
        null, { style: 'box', level: 2, where: 'bag', rounds: 6, round: 120, rest: 45, pace: 'fast', fillName: 'Heavy Bag Rounds' }],
    ] },
  { id: 'bi-fight-strength', name: 'Fighter Strength', builds: 'Rotational power, grip, neck, explosive hips', week: '2× · 30–40 min', equip: 'Med ball, kettlebell, pull-up bar', cost: 'Low–medium',
    fit: 'You lift and want the strength that carries over to striking or grappling, as an add-on to your program.',
    strengths: ['Explosive hips and rotation, the source of punching and kicking power.', 'Grip and neck, which ordinary lifting skips.', 'Short enough to add after a lifting day, or alongside your main program.'],
    result: 'In 6–8 weeks: harder rotational throws and broad jumps, longer grip holds, and a neck that handles pressure better. Total strength still comes from your main lifting.',
    watch: ['Explosive work first, while fresh; never to failure.', 'Neck work: light and slow, build over weeks.', 'If you add this alongside a full split, cut one set from your heaviest day.'],
    days: [
      ['A: Power', [['Broad Jump', 4, '3', 'Full rest between jumps.'], ['Med Ball Rotational Throw', 4, '5', 'Each side.'], ['Kettlebell Swing', 4, '12'], ['Landmine Rotation', 3, '8', 'Each side.']]],
      ['B: Grip and neck', [['Towel Hang', 3, '', '', { judge: 'max' }], ["Farmer's Carry", 3, '', 'Heavy.', { d: 40 }], ['Band Neck Extension', 2, '15', 'Light.'], ['Neck Isometric Hold', 2, '', '', rd(10)], ['Side Plank', 3, '', 'Each side.', rd(30)]]],
    ] },
];
if (!WTAGS.includes('Fight training')) WTAGS.splice(WTAGS.indexOf('Other'), 0, 'Fight training');
for (const P of FPROGS) {
  const days = P.days.map(([dn, items, timer, coach], i) => {
    const d = planDay(P.id, i + 1, dn, ['Fight training'], items.map(([n, sets, reps, note]) => [n, sets, reps, note]));
    d.items.forEach((it, j) => { const tg = items[j][4]; if (tg) it.tg = { ...tg }; });
    if (timer) d.timer = { id: 'ft-' + P.id + '-' + (i + 1), ...timer };
    if (coach) { const fx = findIn(BUILTIN_EX)(coach.fillName); const { fillName, ...cc } = coach; d.fight = { ...cc, fill: fx ? fx.id : null }; }
    return d;
  });
  BUILTIN_ROUTINES.push({ id: P.id, name: P.name, note: P.fit, source: 'builtin', shelf: 'programs', meta: 'Fight training · ' + P.days.length + ' days a week', days, info: { ...P, fight: true } });
}
/* Routine page for a fight program */
function FightInfo({ r }) {
  const P = r.info;
  return html`<div class="cond-info" id="fight-info">
    <div class="kpis kpis3">${kpi(P.week.split(' · ')[0], 'A week')}${kpi(P.cost, 'Recovery cost')}${kpi(P.equip, 'Equipment')}</div>
    <div class="card" style="margin-top:8px"><span class="lbl">Builds most</span><p>${P.builds}</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Strengths</span><ul class="run-ul">${P.strengths.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <div class="card run-result" style="margin-top:8px"><span class="lbl">Likely results</span><p>${P.result}</p></div>
    <div class="card" style="margin-top:8px"><span class="lbl">Watch out for</span><ul class="run-ul">${P.watch.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>
    <p class="small faint" style="margin-top:8px">${FIGHT_NOTE} Days with the coach start it from the workout screen.</p></div>`;
}
function FightPrograms() {
  return html`<div id="fight-programs">
    <p class="note" style="margin-top:14px">Six fight programs. Follow one on its own, or add it alongside your lifting program from its page so Train shows its next day too.</p>
    <div class="stack" style="margin-top:10px">${FPROGS.map(P => html`<button key=${P.id} class="r-card cond-card" id=${'fprog-' + P.id} onClick=${() => { UI.setTab('routines'); UI.setView({ type: 'routine', id: P.id }); }}>
      <span class="tag">${P.cost} recovery cost · ${P.week}</span><h3>${P.name}</h3><span class="days">Builds: ${P.builds} · ${P.equip}</span></button>`)}
      <button class="r-card cond-card" id="fprog-rounds" onClick=${() => { UI.setTab('routines'); UI.setView({ type: 'routine', id: 'bi-cond-fight' }); }}><span class="tag">Conditioning · 3 days</span><h3>Fight Rounds</h3><span class="days">Kettlebell, sprawl and bag rounds, roadwork and grip, from the conditioning programs</span></button></div>
    <div class="section-h"><h2>Fitting it in with lifting</h2></div>
    <div class="card"><ul class="run-ul">
      <li>Two fight sessions a week fit alongside a 4-day split. Three or more: drop to 3 lifting days or cut a set from each lift on your heaviest days.</li>
      <li>Keep hard rounds, sprawls and kicking away from the day before Legs; skill and shadowboxing days are fine anytime.</li>
      <li>Fight classes count too: log them from Train → Log another activity (Boxing, Kickboxing / Muay Thai, MMA, BJJ) so they count toward your week.</li>
      <li>If you also follow the running plan, easy roadwork can replace one easy run; keep the hard runs.</li></ul></div></div>`;
}
/* Workout screen: start the coach for a program day; its rounds fill the exercise */
function FightWorkoutBtn({ a }) {
  const f = a.fight; if (!f) return null; const T = FR.T;
  return html`<button class="btn wide" id="wo-fight" style="margin:4px 0 10px" onClick=${() => { if (T && !T.done && !T.ended) UI.setView({ type: 'fight' }); else { FR.T = null; fightGo({ ...fightSt(), where: 'shadow', focus: 'mix', only: null, ...f }); } }}>${I.timer} ${T && !T.done && !T.ended ? 'Open the coach' : 'Start the coach: ' + fStyleName(f.style) + ' ' + f.rounds + ' × ' + clock(f.round)}</button>`;
}
