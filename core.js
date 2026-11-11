
/* ============ UI ============ */
const { html, render, useState, useEffect, useRef, useMemo } = htmPreact;
const ic = f => () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${f()}</svg>`;
const ICONS = {
  train: ic(() => html`<path d="M2.5 9.5v5M5.5 7v10M18.5 7v10M21.5 9.5v5M5.5 12h13"/>`),
  log: ic(() => html`<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>`),
  routines: ic(() => html`<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M7 4.5h10M6 8V6.5M18 8V6.5"/>`),
  stats: ic(() => html`<path d="M5 20V12M10 20V5M15 20v-9M20 20v-5"/>`),
  profile: ic(() => html`<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>`),
  check: ic(() => html`<path d="M5 12.5l4.5 4.5L19 7.5"/>`),
  more: ic(() => html`<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>`),
  up: ic(() => html`<path d="M12 19V5M6 11l6-6 6 6"/>`),
  down: ic(() => html`<path d="M12 5v14M6 13l6 6 6-6"/>`),
  x: ic(() => html`<path d="M6 6l12 12M18 6L6 18"/>`),
  link: ic(() => html`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`),
  swap: ic(() => html`<path d="M7 7h12l-3-3M17 17H5l3 3"/>`),
  layers: ic(() => html`<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>`),
  trash: ic(() => html`<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>`),
  plus: ic(() => html`<path d="M12 5v14M5 12h14"/>`),
  back: ic(() => html`<path d="M15 5l-7 7 7 7"/>`),
  edit: ic(() => html`<path d="M4 20h4L19 9l-4-4L4 16v4z"/>`),
  copy: ic(() => html`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`),
  plate: ic(() => html`<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/>`),
  note: ic(() => html`<path d="M5 4h14v16H5zM9 9h6M9 13h6"/>`),
  timer: ic(() => html`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>`),
  camera: ic(() => html`<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>`),
  meals: ic(() => html`<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 8c0-1.4 1-1.8 1-3.2M12 8c0-1.4 1-1.8 1-3.2M16 8c0-1.4 1-1.8 1-3.2"/>`),
  share: ic(() => html`<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>`),
  cal: ic(() => html`<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>`),
  globe: ic(() => html`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>`),
};
const I = {}; for (const [k, f] of Object.entries(ICONS)) Object.defineProperty(I, k, { get: f });
/* One shared disclaimer line (Nov 10, audit P2-3) */
/* Rep ranges read with an en dash (5–8) */
const repTxt = r => String(r == null ? '' : r).replace(/(\d)\s*-\s*(\d)/g, '$1–$2');
const NOT_ADVICE = 'Estimates and general guidance, not medical advice.';
const UI = { setSheet: () => {}, setView: () => {}, setTab: () => {} };
const ALSO = { v: true };
/* The phone's back gesture closes an open sheet instead of leaving the app: opening a sheet adds one history entry,
   back pops it and closes the sheet. A sheet closed by its own buttons leaves that entry as a spare; the next back
   with nothing open uses it up and goes on back, so leaving the app still takes one gesture. */
const SHEET_H = { open: false, entry: false };
const openSheet = s => { UI.setSheet(s); SHEET_H.open = !!s; if (s && !SHEET_H.entry) { try { history.pushState({ ironSheet: 1 }, ''); SHEET_H.entry = true; } catch (e) {} } };
const closeSheet = () => { UI.setSheet(null); SHEET_H.open = false; setTimeout(() => { if (typeof settleScroll === 'function') settleScroll(); }, 350); };
addEventListener('popstate', () => { if (!SHEET_H.entry) return; SHEET_H.entry = false; if (SHEET_H.open) { SHEET_H.open = false; UI.setSheet(null); } else { try { history.back(); } catch (e) {} } });
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clock = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const shortDate = t => { const d = new Date(t); return DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate(); };
const groupChip = g => g ? html`<span class="chip group">${g in RANGE_REPS ? (g === '1RM' || g === 'Max' ? RANGE_NAME[g] : g + ' reps') : g}</span>` : null;
const RANGES = [['1RM', '1 rep max', '1'], ['Max', 'Max reps', ''], ['3-5', '3–5', '3-5'], ['5-8', '5–8', '5-8'], ['8-12', '8–12', '8-12'], ['12-15', '12–15', '12-15'], ['15-20', '15–20', '15-20']];
const RANGE_REPS = Object.fromEntries(RANGES.map(r => [r[0], r[2]]));
const RANGE_NAME = Object.fromEntries(RANGES.map(r => [r[0], r[1]]));
const applyRange = (t, g) => { if (g in RANGE_REPS) t.reps = RANGE_REPS[g]; };
const fmtDur = ms => { const m = Math.round(ms / 60000); return m >= 60 ? Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm' : m + ' min'; };
const fmtBig = n => n >= 1e6 ? fmt(n / 1e6) + 'M' : n >= 1e4 ? fmt(n / 1e3) + 'k' : Math.round(n).toLocaleString();
const selAll = e => { const el = e.target; setTimeout(() => { try { el.setSelectionRange(0, 99); } catch (_) {} }, 0); };
const enterBlur = e => { if (e.key === 'Enter') e.target.blur(); };
const focusId = id => setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 30);
const ago = t => { const d = Math.floor((startOfDay(new Date()) - startOfDay(t)) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };

/* Sound is unlocked by the first tap, then timers can beep while the page is on screen. */
const AUD = { ctx: null };
function unlockAudio() { try { if (!AUD.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) AUD.ctx = new C(); } if (AUD.ctx && AUD.ctx.state === 'suspended') AUD.ctx.resume(); } catch (e) {} }
function beep(freq = 880, ms = 160, vol = 0.25) {
  try { const c = AUD.ctx; if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + ms / 1000 + 0.03); } catch (e) {}
}
document.addEventListener('pointerdown', unlockAudio, true);
function audioTick() {
  const st = S.meta.settings; const r = S.rest;
  if (BG.kind === 'rest' && !r) bgStop();
  if (BG.kind === 'timer' && (!S.itimer || S.itimer.pausedAt)) bgStop();
  if (r && !(BG.on && BG.kind === 'rest')) { r.beeped = r.beeped || {}; const left = Math.ceil((r.until - Date.now()) / 1000);
    if (st.countdown && left >= 1 && left <= 3 && !r.beeped[left]) { r.beeped[left] = 1; beep(660, 110); }
    if (left <= 0 && !r.beeped.end) { r.beeped.end = 1; if (st.beep) beep(990, 500, 0.35); announce('Rest over'); } }
  const T = S.itimer;
  if (T && !T.pausedAt && T.cfg.mode !== 'stopwatch') {
    const p = tLocate(T);
    if (!p) { if (!T.done) { T.done = true; if (st.beep && !(BG.on && BG.kind === 'timer')) beep(990, 800, 0.35); S.rerender(); } return; }
    if (BG.on && BG.kind === 'timer') return;
    const left = Math.ceil(p.left - 1e-6);
    const sk = 's' + p.idx; if (!T.beeped[sk]) { T.beeped[sk] = 1; if (p.idx > 0 && st.beep) beep(p.phase.kind === 'work' ? 1040 : 520, 280, 0.3); }
    const ck = p.idx + ':' + left; if (st.countdown && left >= 1 && left <= 3 && !T.beeped[ck]) { T.beeped[ck] = 1; beep(660, 110); }
  }
}
/* Background alerts (beta): an audio track of silence with the beeps baked in, so they still sound
   with the screen locked or in another app. The phone treats it as media, so it can pause other audio. */
const BG = { el: null, url: null, on: false, kind: null, tok: 0, primed: false };
function wavBlob(total, beeps) {
  const rate = total > 300 ? 4000 : 8000; const n = Math.max(Math.floor(rate / 4), Math.ceil(total * rate));
  const buf = new ArrayBuffer(44 + n); const v = new DataView(buf); const w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  const d = new Uint8Array(buf, 44); d.fill(128);
  for (const b of beeps) { const s0 = Math.floor(b.t * rate), len = Math.floor(b.d * rate);
    for (let i = 0; i < len && s0 + i < n; i++) { if (s0 + i < 0) continue; const env = Math.min(1, i / (rate * 0.01), (len - i) / (rate * 0.03)); d[s0 + i] = 128 + Math.round(100 * env * Math.sin(2 * Math.PI * b.f * i / rate)); } }
  return new Blob([buf], { type: 'audio/wav' });
}
function bgPrime() {
  if (BG.primed || !S.meta.settings.bgAudio) return;
  try { const a = BG.el || (BG.el = new Audio()); a.setAttribute('playsinline', ''); const u = URL.createObjectURL(wavBlob(0.25, [])); a.src = u;
    const p = a.play(); if (p && p.then) p.then(() => { BG.primed = true; if (!BG.on) a.pause(); }).catch(() => {}); } catch (e) {}
}
document.addEventListener('pointerdown', bgPrime, true);
function bgPlay(kind, total, beeps, title) {
  if (!S.meta.settings.bgAudio || total <= 0 || total > 2700) { if (BG.kind === kind) bgStop(); return; }
  try { const a = BG.el || (BG.el = new Audio()); a.setAttribute('playsinline', ''); const old = BG.url;
    BG.url = URL.createObjectURL(wavBlob(total + 0.9, beeps)); a.src = BG.url; BG.kind = kind; BG.on = false; const tok = ++BG.tok;
    const p = a.play(); if (p && p.then) p.then(() => { if (BG.tok === tok) BG.on = true; }).catch(() => { if (BG.tok === tok) BG.on = false; }); else BG.on = true;
    if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
    if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'Ironwood' });
  } catch (e) { BG.on = false; }
}
function bgStop() { try { BG.tok++; BG.on = false; BG.kind = null; if (BG.el) BG.el.pause(); if (BG.url) { const u = BG.url; BG.url = null; setTimeout(() => URL.revokeObjectURL(u), 1000); } } catch (e) {} }
function bgRest() {
  const r = S.rest; if (!r) { if (BG.kind === 'rest') bgStop(); return; }
  const st = S.meta.settings; const left = Math.max(0, (r.until - Date.now()) / 1000); const b = [];
  if (st.countdown) for (const k of [3, 2, 1]) if (left - k > 0) b.push({ t: left - k, f: 660, d: 0.12 });
  if (st.beep) b.push({ t: left, f: 990, d: 0.5 });
  bgPlay('rest', left, b, 'Rest ' + clock(Math.ceil(left)));
}
function bgTimer() {
  const T = S.itimer; if (!T || T.pausedAt || T.cfg.mode === 'stopwatch') { if (BG.kind === 'timer') bgStop(); return; }
  const st = S.meta.settings; const el = tElapsed(T); const b = []; let acc = 0;
  T.phases.forEach((p, i) => { const start = acc - el, end = acc + p.secs - el;
    if (i > 0 && start > 0 && st.beep) b.push({ t: start, f: p.kind === 'work' ? 1040 : 520, d: 0.28 });
    if (st.countdown) for (const k of [3, 2, 1]) { const tt = end - k; if (tt > 0 && p.secs > k) b.push({ t: tt, f: 660, d: 0.11 }); }
    acc += p.secs; });
  const left = T.total - el; if (st.beep) b.push({ t: left, f: 990, d: 0.8 });
  bgPlay('timer', left, b, T.cfg.name || 'Interval timer');
}
/* Display settings live on this device. */
const HOST_THEME = document.documentElement.getAttribute('data-theme');
const DISP = { palette: lsGet('palette') || 'classic', theme: lsGet('theme') || 'system', size: lsGet('size') || '100', rm: lsGet('rm') == null ? (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })() : lsGet('rm') === '1', hc: lsGet('hc') == null ? (() => { try { return matchMedia('(prefers-contrast: more)').matches; } catch (e) { return false; } })() : lsGet('hc') === '1' };
/* Follows iPhone Increase Contrast until you set High contrast yourself (Nov 10, audit P3-4) */
try { matchMedia('(prefers-contrast: more)').addEventListener('change', e => { if (lsGet('hc') == null) { DISP.hc = e.matches; applyDisplay(); if (typeof S !== 'undefined' && S.rerender) S.rerender(); } }); } catch (e) {}
function applyDisplay() {
  const r = document.documentElement;
  if (DISP.theme === 'system') { if (HOST_THEME) r.setAttribute('data-theme', HOST_THEME); else r.removeAttribute('data-theme'); } else r.setAttribute('data-theme', DISP.theme);
  r.classList.toggle('rm', DISP.rm); r.classList.toggle('hc', DISP.hc); applyPalette();
  r.style.setProperty('--tu', String((+DISP.size || 100) / 100));
}
function setDisp(k, v) { DISP[k] = v; lsSet(k, typeof v === 'boolean' ? (v ? '1' : '0') : v); applyDisplay(); S.rerender(); }

/* Languages: the 10 most spoken. Claude translates each phrase the first time it shows up (with your permission),
   and only the language you pick is saved on this device. Any other language can come from a spreadsheet. */
const L10N_CATALOG = ["/wk avg", "A planned day off. Your weekly goal already allows for these.", "A rest time just for this exercise", "AMRAP {#} min", "Storage is full, so new changes aren’t being saved. Save a backup file, then delete old workouts.", "Add a note to set", "Add at least one checklist item", "Add exercise", "Add the first exercise below.", "Add to", "Added", "After each exercise", "After the full round", "All time", "All timers", "Also becomes the rest for", "Also becomes your default rest after", "Also change it in", "Apr", "Assist", "Attempt", "Aug", "Automatic translation isn’t available here. Upload a translation spreadsheet instead.", "Back", "Backup copied.", "Backup not saved.", "Backup saved.", "Beep the last {#} seconds", "Beep when time is up", "Bengali", "Best run", "Bodyweight", "Brazilian Portuguese", "Build one in Routines, or start an empty workout.", "Built in", "Busy. Trying again in a moment.", "By day", "By week", "Cancel", "Categories", "Categories fill in as you log workouts.", "Category", "Challenge", "Challenge day", "Challenge deleted", "Change rest time", "Changes only the timer that is running.", "Checklist item", "Choose a text file", "Choose backup file", "Clear", "Clear this day", "Close", "Complete", "Connecting…", "Cool down", "Copied the phrase list. Paste it into a spreadsheet, translate the second column, and upload it as CSV.", "Copy is blocked in this view. Use Save backup file.", "Copy set", "Copy to edit", "Core", "Could not save the file here. Try Copy backup instead.", "Counts up from zero. Tap Lap to record splits.", "Counts up, with laps", "Custom, e.g. Paused", "Dark", "Date", "Day", "Day name", "Days done", "Days left", "Days this run", "Dec", "Default", "Delete", "Delete day", "Delete entry for", "Delete timer", "Delete workout", "Details", "Discard", "Display & language", "Done", "EMOM {#} min", "Each range keeps its own history", "Each range keeps its own weights, prefills, chart and PRs, so curls done two ways never overwrite each other. Records still count overall.", "Edit", "Edit challenge", "Edit exercise note", "Edit note for set", "Elapsed time", "Empty workout", "End", "Ended", "English", "Enter", "Equipment", "Escape", "Español", "Every", "Every {#} min × {#}", "Example only. Log a workout to see your own lifts here.", "Exercise note", "Exercise options", "Exercises", "Feb", "Fewer", "Fewer rest days", "Fewer sets", "Finish", "Finish or discard the current workout before starting another.", "Finish workout", "Finished", "Finished workouts show up here with your best set for each exercise.", "For HIIT, circuits and conditioning. Tap a timer to change it, or Start to run it as is.", "Français", "French", "Fri", "Friday", "Get ready", "Go", "Go to workout", "Heaviest weight", "Heavy", "Hindi", "Imported", "In {#} weeks at your pace", "In {#} weeks if you stop", "Interval timer", "Interval timers also beep at each change.", "Intervals", "Jan", "Jul", "Jun", "Keep it", "Labeled only. Turn on \"Sick, injured and break days pause streaks\" in Profile to protect streaks.", "Lap", "Large", "Larger", "Last {#} days", "Last:", "Leg circuit", "Legs", "Length", "Length in days", "Less", "Less assist", "Ironwood", "Light", "Loaded", "Log", "Log bodyweight", "Longest streak", "Lowers that week's goal by one and pauses challenges, so streaks aren't broken.", "Main unit", "Mark this day", "Missed days are counted, and it keeps going.", "Missing a day starts it over at day {#}.", "Modern Standard Arabic", "More rest days", "More sets", "Most reps in a set", "Move day up", "Move down", "Move up", "Muscle group", "Muscle groups", "My language", "Name", "New best ·", "New challenge", "New items count from today, so past days stay complete.", "Next:", "No", "No exercises found yet. Each exercise line needs a set count like {#}x.", "No match. Create it above.", "No new records this time. Logged weights become next workout's starting point.", "No phrases found. The file needs two columns: English and your translation.", "No rest days left this week.", "No sets logged yet", "No workouts yet", "No, I tick it", "Note", "Nothing from this session will be saved.", "Nothing yet", "Nov", "Now", "Now → {#} weeks", "Oct", "Off", "Options for", "Other", "Overall", "Overrides your single and superset rest for this exercise only.", "Pace comes from your last", "Panel", "Paste a program from RepCount, a website, or a note. Day names go on their own line. Exercises look like", "Pause", "Paused", "Per week", "Per-exercise rest", "Pick a different movement for this slot", "Português", "Profile", "Pull", "Push", "Push / pull / legs", "Range:", "Recent PRs", "Records", "Remove exercise", "Remove item", "Remove set", "Remove superset", "Rep range", "Rep range:", "Reps", "Rest", "Rest between sets", "Rest day", "Rest day taken · Undo", "Rest for", "Rest time", "Rest timer", "Rest timer:", "Restore a backup", "Restore backup", "Resume", "Round", "Rounds", "Routine name", "Routine not found", "Routines", "Run again", "Russian", "Sat", "Saturday", "Save", "Save changes", "Save timer", "Saved on this device only", "Saved on this phone. Will sync when you’re back online.", "Saved to your Claude account", "Saving files is not available here.", "Saving files isn’t available here.", "Saving to your Claude account…", "Search or type a new exercise", "Sections", "Sep", "Set", "Set note", "Set rest", "Sets", "Sets a week, lately", "Sets this week", "Sick", "Sick, injured and break days pause streaks", "Simplified Chinese", "Skip", "Small", "Spanish", "Squat {#}x{#}", "Squat · Est. {#}RM", "Start", "Start a challenge", "Start challenge", "Start the timer when a set is logged", "Starts", "Stats", "Stopwatch", "Streak paused this week", "Strength", "Sun", "Sunday", "Superset rest", "Superset with exercise above", "Swap exercise", "System", "20 on / 10 off", "Tap a day to mark rest, sick, injured or break.", "Target reps", "That file isn’t a Ironwood backup.", "That isn’t a Ironwood backup. Paste the full backup text or choose the .json file.", "Theme", "They lower that week's goal instead of breaking your streak, and pause challenges.", "This exercise", "This rest", "This week", "Thu", "Thursday", "Ticks itself", "Time", "Time cap", "Timer", "Timer finished", "Timer saved", "Today", "Today's estimate", "Total time", "Train", "Training", "Translate these user-interface strings from a gym workout tracking app from English into", "Translating", "Translation stopped. Choose the language again to retry.", "Translation wasn’t allowed. Pick the language again to be asked again, or upload a spreadsheet.", "Tue", "Tuesday", "Undo", "Up next", "Urdu", "Use defaults for", "View", "Volume", "Volume,", "Wed", "Wednesday", "Week streak", "Weigh in", "Weight in", "When I log a workout", "When I log a {#}nd workout", "Work", "Workout", "Workout days over the last {#} weeks", "Workout details", "Workout in progress", "Workout saved", "Workouts", "Workouts per week", "Year", "Yours", "aside num", "at your pace ·", "btn danger", "btn ghost wide", "btn primary", "btn primary wide", "btn text", "btn text danger", "btn text danger wide", "btn wide", "btn wide danger", "card note", "card prl", "card stack", "card tbl-wrap", "chip group", "days ago", "days done", "days without this lift, today's estimate starts to fade.", "e.g. Read {#} pages", "e.g. Upper / Lower", "est. {#}RM", "every time.", "faint num", "field mini-select", "from your log", "heaviest,", "if you stop", "in the", "inside your current streak.", "kpis kpis{#}", "least assistance,", "lift-row cat-row", "logged yet.", "margin:{#}px {#}", "margin:{#}px {#} {#}px", "margin:{#}px {#}px {#} {#}", "muted small", "note-add wide", "num muted", "off ·", "on ·", "padding:{#}px {#}", "padding:{#}px {#}px", "paused week", "phrases from “", "phrases translated and saved on this device.", "phrases…", "pill-btn accent", "rounds so far", "row small", "row wrap", "s goal by one and pauses challenges, so streaks aren", "seg wide", "set-row th", "sets done", "sets logged ·", "sets will be saved.", "sets ×", "single exercises", "single exercises.", "small down-c", "small faint", "small faint ex-prev", "small muted", "small muted num", "superset exercises.", "sx num", "time cap, count your rounds", "tm-card done", "tm-card stop", "to superset it with the line above.", "today. You hit every rep last time.", "work yet", "{#} days", "{#} month", "{#} months", "{#} on / {#} off", "{#} on / {#} off, {#} sets", "{#} rep max", "{#} seconds less", "{#} seconds more", "{#} week", "{#} weeks", "{#} year", "{#}x Squat", "{#}x{#}-{#} Lat Pulldown", "· attempt", "· first time", "· paused", "· rest", "· set", "· workout", "…or paste the backup text"];
const LANGS = [['en', 'English', 'English'], ['zh', '中文', 'Simplified Chinese'], ['hi', 'हिन्दी', 'Hindi'], ['es', 'Español', 'Spanish'], ['ar', 'العربية', 'Modern Standard Arabic'],
  ['fr', 'Français', 'French'], ['bn', 'বাংলা', 'Bengali'], ['pt', 'Português', 'Brazilian Portuguese'], ['ru', 'Русский', 'Russian'], ['ur', 'اردو', 'Urdu']];
const RTL = { ar: 1, ur: 1, fa: 1, he: 1 };
const L10N = { lang: lsGet('lang') || 'en', name: lsGet('langName') || '', map: {}, pending: new Set(), seen: new Set(), busy: false, status: '', denied: false, obs: null };
const NUM_RE = /\d+(?:[.,:]\d+)*/g;
const keyOf = t => t.replace(NUM_RE, '{#}');
const L10N_OUT = new WeakMap(), L10N_ORIG = new WeakMap();
function l10nLoad() {
  try { L10N.map = JSON.parse(localStorage.getItem('liftbook.l10n.' + L10N.lang) || '{}'); } catch (e) { L10N.map = {}; }
  try { JSON.parse(localStorage.getItem('liftbook.l10nSeen') || '[]').forEach(k => L10N.seen.add(k)); } catch (e) {}
}
let l10nSaveT = 0;
function l10nSave() { clearTimeout(l10nSaveT); l10nSaveT = setTimeout(() => { try { localStorage.setItem('liftbook.l10n.' + L10N.lang, JSON.stringify(L10N.map)); localStorage.setItem('liftbook.l10nSeen', JSON.stringify([...L10N.seen].slice(-3000))); } catch (e) {} }, 400); }
function trStr(raw) {
  const t = raw.trim(); if (!t || !/[A-Za-z]/.test(t)) return null;
  const k = keyOf(t); if (!L10N.seen.has(k)) { L10N.seen.add(k); l10nSave(); }
  const tr = L10N.map[k]; if (tr == null) { L10N.pending.add(k); return null; }
  const nums = t.match(NUM_RE) || []; let i = 0; const out = tr.replace(/\{#\}/g, () => (i < nums.length ? nums[i++] : ''));
  return raw.replace(t, out);
}
const L10N_SKIP = '[translate="no"],script,style,textarea';
function l10nApply(root) {
  if (!root || L10N.lang === 'en') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest(L10N_SKIP)) continue;
    const out = L10N_OUT.get(n); if (out === n.data && L10N_ORIG.get(n) !== n.data) continue;
    if (out !== n.data) L10N_ORIG.set(n, n.data);
    const tr = trStr(L10N_ORIG.get(n) || n.data); if (tr != null && tr !== n.data) n.data = tr; L10N_OUT.set(n, n.data); }
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => { if (el.closest('[translate="no"]')) return;
    for (const a of ['placeholder', 'aria-label', 'title']) { const v = el.getAttribute(a); if (!v || el.getAttribute('data-l10n-' + a) === v) continue;
      const tr = trStr(v); if (tr != null && tr !== v) { el.setAttribute('data-l10n-' + a, tr); el.setAttribute(a, tr); } } });
  l10nQueue();
}
function l10nRestore() {
  const root = document.getElementById('app'); if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const o = L10N_ORIG.get(n); if (o != null && L10N_OUT.get(n) === n.data) n.data = o; L10N_OUT.delete(n); L10N_ORIG.delete(n); }
}
let l10nRaf = 0, l10nT = 0;
function l10nStart() {
  const root = document.getElementById('app'); if (!root) return;
  document.documentElement.lang = L10N.lang.startsWith('custom') ? '' : L10N.lang;
  document.documentElement.dir = RTL[L10N.lang] ? 'rtl' : 'ltr';
  if (L10N.lang === 'en') { if (L10N.obs) { L10N.obs.disconnect(); L10N.obs = null; } return; }
  if (!L10N.obs) { L10N.obs = new MutationObserver(() => { if (l10nRaf) return; l10nRaf = requestAnimationFrame(() => { l10nRaf = 0; l10nApply(root); }); });
    L10N.obs.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] }); }
  l10nApply(root);
}
function l10nQueue() {
  if (!L10N.pending.size) return;
  if (L10N.lang === 'en' || L10N.lang.startsWith('custom') || L10N.denied) { L10N.pending.clear(); return; }
  clearTimeout(l10nT); l10nT = setTimeout(l10nFetch, 900);
}
async function l10nFetch() {
  if (L10N.busy || L10N.denied) return;
  const keys = [...L10N.pending].filter(k => L10N.map[k] == null).slice(0, 120); L10N.pending.clear(); if (!keys.length) return;
  const lang = LANGS.find(x => x[0] === L10N.lang); if (!lang) return;
  const C = window.claude; const sample = C && C.use ? await C.use('sample') : null;
  if (!sample) { L10N.status = 'Automatic translation isn’t available here. Upload a translation spreadsheet instead.'; L10N.denied = true; S.rerender(); return; }
  L10N.busy = true; L10N.status = 'Translating ' + keys.length + ' phrases…'; S.rerender();
  try {
    const prompt = 'Translate these user-interface strings from a gym workout tracking app from English into ' + lang[2] + '.\n'
      + 'Rules: keep every {#} placeholder exactly as written (each stands for a number). Keep translations as short as app labels. Keep lb, kg, 1RM, EMOM, AMRAP and symbols like ·, ×, ⇄, + and − unchanged. Use the usual gym words in that language for exercise names.\n'
      + 'Return only a JSON object whose keys are the exact English strings and whose values are the translations.\n\n' + JSON.stringify(keys);
    const res = await sample.json(prompt, { modelTier: 'quick' });
    if (res && typeof res === 'object') for (const k of keys) if (typeof res[k] === 'string' && res[k].trim()) L10N.map[k] = res[k];
    for (const k of keys) if (L10N.map[k] == null) L10N.map[k] = k;
    l10nSave(); L10N.status = Object.keys(L10N.map).length + ' phrases translated and saved on this device.';
  } catch (e) {
    const c = e && e.code;
    if (c === 'not_granted') { L10N.denied = true; L10N.status = 'Translation wasn’t allowed. Pick the language again to be asked again, or upload a spreadsheet.'; }
    else if (c === 'rate_limited') { keys.forEach(k => L10N.pending.add(k)); L10N.status = 'Busy. Trying again in a moment.'; setTimeout(l10nQueue, 8000); }
    else { L10N.status = 'Translation stopped. Choose the language again to retry.'; }
  } finally { L10N.busy = false; l10nApply(document.getElementById('app')); S.rerender(); if (L10N.pending.size) l10nQueue(); }
}
function setLang(code, name) {
  l10nRestore(); L10N.lang = code; L10N.name = name || ''; L10N.denied = false; L10N.status = '';
  lsSet('lang', code); lsSet('langName', L10N.name); l10nLoad();
  if (code !== 'en' && !code.startsWith('custom')) { L10N_CATALOG.forEach(k => { if (L10N.map[k] == null) L10N.pending.add(k); }); }
  l10nStart(); if (L10N.pending.size) { clearTimeout(l10nT); l10nFetch(); } S.rerender();
}
function csvParse(text) {
  const rows = []; let row = [], cur = '', q = false; const t = String(text || '').replace(/^﻿/, '');
  const sep = (t.split('\n')[0].match(/\t/g) || []).length > (t.split('\n')[0].match(/,/g) || []).length ? '\t' : t.split('\n')[0].includes(';') && !t.split('\n')[0].includes(',') ? ';' : ',';
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
function l10nImport(text, name) {
  const rows = csvParse(text); let start = rows[0] && /english/i.test(rows[0][0] || '') ? 1 : 0; const map = {};
  for (const r of rows.slice(start)) if (r[0] && r[1] && r[0].trim() && r[1].trim()) map[keyOf(r[0].trim())] = r[1].trim();
  const n = Object.keys(map).length; if (!n) return 0;
  const code = 'custom-' + (slug(name || 'my-language') || 'mine');
  try { localStorage.setItem('liftbook.l10n.' + code, JSON.stringify(map)); } catch (e) {}
  const customs = JSON.parse(lsGet('customLangs') || '[]').filter(x => x[0] !== code); customs.push([code, name || 'My language']); lsSet('customLangs', JSON.stringify(customs));
  setLang(code, name || 'My language'); return n;
}
function l10nCSV() {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const keys = [...new Set([...L10N_CATALOG, ...L10N.seen])].sort((a, b) => a.localeCompare(b));
  return 'English,Translation\n' + keys.map(k => q(k) + ',' + q(L10N.map[k] && L10N.map[k] !== k ? L10N.map[k] : '')).join('\n');
}
/* Keep the screen on while a workout or interval timer is running, or the timer screen is open. iOS drops the lock whenever
   the app goes to the background, so it is taken again each time the app comes back and whenever the state changes. */
const WAKE = { lock: null, hold: 0, busy: false };
async function wakeSync() {
  if (WAKE.busy || !navigator.wakeLock) return; WAKE.busy = true;
  try {
    const want = (WAKE.hold > 0 || !!S.active || !!S.itimer) && document.visibilityState === 'visible';
    if (want && !WAKE.lock) { try { const l = await navigator.wakeLock.request('screen'); l.addEventListener('release', () => { if (WAKE.lock === l) WAKE.lock = null; }); WAKE.lock = l; } catch (e) { WAKE.lock = null; } }
    else if (!want && WAKE.lock) { const l = WAKE.lock; WAKE.lock = null; try { await l.release(); } catch (e) {} }
  } finally { WAKE.busy = false; }
}
document.addEventListener('visibilitychange', () => { wakeSync(); });
function useWake() { useEffect(() => { WAKE.hold++; wakeSync(); return () => { WAKE.hold--; wakeSync(); }; }, []); }
/* The elapsed clock ticks on its own, so the set rows aren't redrawn every second */
function WoClock({ since }) {
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(iv); }, []);
  const el = Math.max(0, Math.floor((Date.now() - since) / 1000));
  return html`<div class="wo-clock" role="timer" aria-label="Elapsed time">${clock(el)}</div>`;
}
/* One live region for things a sighted person sees in the rest bar or a toast */
const ANN = { text: '', at: 0 };
function announce(text) { ANN.text = text; ANN.at = Date.now(); S.rerender(); }
function Announcer() { return html`<div class="sr-only" aria-live="assertive" aria-atomic="true">${Date.now() - ANN.at < 4000 ? ANN.text : ''}</div>`; }
/* The tab bar and rest bar get taller with larger text; publish their heights for the layout offsets */
let barRO = null;
function measureBars() {
  const r = document.documentElement, t = document.querySelector('.tabs'), b = document.querySelector('.restbar');
  const set = () => { if (t) r.style.setProperty('--tabs-h', t.offsetHeight + 'px'); if (b && b.isConnected) r.style.setProperty('--rest-h', b.offsetHeight + 'px'); };
  set();
  if (window.ResizeObserver) { if (!barRO) barRO = new ResizeObserver(set); barRO.disconnect(); if (t) barRO.observe(t); if (b) barRO.observe(b); }
}
function showToast(t) { const ms = t.ms || (t.action ? 8000 : 3500); S.toast = { ...t, until: Date.now() + ms }; S.rerender(); setTimeout(() => S.rerender(), ms + 60); }
let SUPPRESS = 0;
const SW = { open: null };

/* ---------- workout actions ---------- */
function touch(delay = 2500) { if (!S.active) return; S.active.updatedAt = Date.now(); schedule('active', delay); S.rerender(); }
function startWorkout(routine, day) {
  if (S.active) { openSheet({ type: 'confirm', title: 'Workout in progress', body: 'Finish or discard the current workout before starting another.', ok: 'Go to workout', onOk: () => { closeSheet(); UI.setTab('train'); } }); return; }
  if (S.toast && S.toast.kind === 'info') S.toast = null;
  PREFILL_CTX = { rid: routine ? routine.id : null, did: day ? day.id : null };
  S.active = { id: uid('s'), routineId: routine ? routine.id : null, routineName: routine ? routine.name : '', dayId: day ? day.id : null, name: day ? day.name : 'Workout', startedAt: Date.now(), updatedAt: Date.now(), items: day ? day.items.map((x, i, arr) => makeSlot(x, arr.slice(0, i).filter(y => y.ex === x.ex && (y.group || '') === (x.group || '')).length)) : [] };
  if (day && day.timer) S.active.timer = clone(day.timer);
  if (day && day.fight) S.active.fight = clone(day.fight);
  touch(500); UI.setView(null); UI.setTab('train'); scrollTo(0, 0);
}
/* A set counts as done once it has reps. Swiping right logs the faded numbers as they are. */
function prPool(it, s, group) {
  const pool = []; for (const e of entries(it.ex, group)) for (const x of e.sets) if (+x.r > 0 && (!s.m || (x.m || '') === s.m)) pool.push({ w: +x.w || 0, r: +x.r });
  if (!pool.length) return [];
  for (const o of S.active.items) if (o.ex === it.ex && (group === undefined || (o.group || '') === group))
    for (const x of o.sets) if (x !== s && isDone(x) && x.c && (!s.c || x.c < s.c) && (!s.m || (x.m || '') === s.m)) pool.push({ w: r1(conv(num(x.w), o.u || U(), U())), r: num(x.r) });
  return pool;
}
const rangeTag = g => g in RANGE_REPS && g !== '1RM' && g !== 'Max' ? RANGE_NAME[g] + ' reps' : (RANGE_NAME[g] || g);
function setPR(it, s) {
  const kind = exKind(it.ex); const u = it.u || U(); const P = prOpts(); const cur = { w: r1(conv(num(s.w), u, U())), r: num(s.r) };
  let res = prReasons(cur, prPool(it, s, undefined), kind, u, P);
  if (!res.length && P.ranges && it.group) res = prReasons(cur, prPool(it, s, it.group), kind, u, P).map(p => ({ ...p, label: p.label + ' for ' + rangeTag(it.group) }));
  return res;
}
function completeSet(it, s, swiped) {
  if (!String(s.r).trim()) s.r = s.gr || '';
  if (!isDone(s)) { s.r = ''; S.rerender(); focusId('r-' + s.id); return false; }
  if (!String(s.w).trim() && s.gw) s.w = s.gw;
  s.c = Date.now(); if (!s.m && it.mach) s.m = it.mach;
  const j = it.sets.indexOf(s);
  for (const n of it.sets.slice(j + 1)) if (!isDone(n) && (n.m || '') === (s.m || '')) n.gw = s.w;
  const prs = setPR(it, s); s.pr = prs.length > 0; s.prInfo = prs.map(prText);
  if (s.pr) { showToast({ kind: 'pr', text: 'PR · ' + exName(it.ex) + ' · ' + prs.map(p => p.label).join(', ') }); if (prOpts().sound) { beep(1320, 90, 0.22); setTimeout(() => beep(1760, 150, 0.22), 110); } }
  if (swiped) lsSet('swiped', '1');
  startRest(it); touch(); return true;
}
function uncompleteSet(it, s, clear) { if (clear) { s.r = ''; s.w = ''; } s.c = null; s.pr = false; s.prInfo = null; touch(); }
function afterEdit(it, s) { const d = isDone(s); if (d && !s.c) completeSet(it, s, false); else if (!d && s.c) uncompleteSet(it, s, false); else if (d) { const prs = setPR(it, s); s.pr = prs.length > 0; s.prInfo = prs.map(prText); touch(); } }
function copySet(it, s) { const j = it.sets.indexOf(s); it.sets.splice(j + 1, 0, { id: uid('t'), w: '', r: '', n: '', gw: s.w || s.gw || '', gr: s.r || s.gr || '' }); SW.open = null; touch(); }
function deleteSet(it, s) {
  const j = it.sets.indexOf(s); if (j < 0) return;
  it.sets.splice(j, 1); SW.open = null; touch();
  showToast({ kind: 'info', ms: 8000, text: 'Set ' + (j + 1) + ' deleted', action: 'Undo', fn: () => { if (!it.sets.includes(s)) { it.sets.splice(Math.min(j, it.sets.length), 0, s); touch(); } } });
}
function startRest(it) {
  const st = S.meta.settings; if (!st.autoRest || !S.active) return;
  const a = S.active; const i = a.items.indexOf(it);
  const linkedNext = !!(a.items[i + 1] && a.items[i + 1].ss); const inSS = !!it.ss || linkedNext;
  if (inSS && st.ssMode === 'round' && linkedNext) return;
  const exR = S.meta.exRest[it.ex];
  const kind = exR != null ? 'ex' : inSS ? 'ss' : 'solo';
  const secs = Math.max(0, +(exR != null ? exR : inSS ? st.restSS : st.rest) || 0);
  if (secs > 0) { S.rest = { until: Date.now() + secs * 1000, total: secs, kind, ex: it.ex, beeped: {} }; bgRest(); offerBgAudio(); }
}
/* The first time a rest timer runs in the home-screen app, offer the beep that works with the phone locked (off by default) */
function offerBgAudio() {
  const st = S.meta.settings; if (st.bgAudio || !(window.claude && window.claude.standalone) || lsGet('bgOffered') === '1') return;
  /* asked inside the rest bar (not a toast), so it never covers the workout title or an Undo */
  if (S.rest) { S.rest.offerBg = true; lsSet('bgOffered', '1'); }
}
const bgOfferYes = () => { lsSet('bgOffered', '1'); if (S.rest) S.rest.offerBg = false; commit(x => { x.meta.settings.bgAudio = true; }, 'meta'); bgPrime(); bgRest(); showToast({ kind: 'info', text: 'On. Change it under Profile → Rest timer.' }); };
const bgOfferNo = () => { lsSet('bgOffered', '1'); if (S.rest) S.rest.offerBg = false; S.rerender(); };
function toggleUnit(it) {
  const from = it.u || U(), to = from === 'kg' ? 'lb' : 'kg';
  const incTo = to === U() ? +S.meta.settings.inc : (to === 'kg' ? 2.5 : 5);
  it.sets.forEach(x => { if (String(x.w).trim()) x.w = String(r1(conv(num(x.w), from, to))); if (String(x.gw || '').trim()) x.gw = String(roundToInc(conv(num(x.gw), from, to), incTo)); });
  if (it.prev) it.prev = it.prev.map(p => ({ ...p, w: roundToInc(conv(+p.w || 0, from, to), incTo) }));
  it.u = to; if (!isMeasured(exKind(it.ex))) refill(it);
  commit(st => { if (to === U()) delete st.meta.exUnit[it.ex]; else st.meta.exUnit[it.ex] = to; }, 'meta', 1200);
  touch();
}
const timeOfDay = t => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function finishWorkout(opts = {}) {
  const a = S.active; if (!a) return;
  /* A workout left open for hours (phone pocketed, forgotten overnight) shouldn't be saved as a 14-hour session */
  const lastSet = Math.max(0, ...a.items.flatMap(it => it.sets.filter(isDone).map(x => +x.c || 0)));
  if (!opts.endedAt && lastSet && Date.now() - lastSet > 3 * 3600e3) {
    const when = Date.now() - lastSet > DAY ? shortDate(lastSet) + ' ' + timeOfDay(lastSet) : timeOfDay(lastSet);
    openSheet({ type: 'confirm', title: 'Finished a while ago?', body: 'The last set was logged at ' + when + '. Save the workout as ending then, so its time isn’t counted up to now?', ok: 'End at ' + when, onOk: () => { closeSheet(); finishWorkout({ endedAt: lastSet + 60000 }); }, alt: 'End now', onAlt: () => { closeSheet(); finishWorkout({ endedAt: Date.now() }); } });
    return;
  }
  const items = a.items.map(it => ({ ex: it.ex, group: it.group || '', ss: !!it.ss, u: it.u || U(), target: it.target, note: (it.note || '').trim(),
    sets: it.sets.filter(isDone).map(x => { const o = { w: Math.max(0, num(x.w || x.gw)), r: Math.round(num(x.r)) }; if (x.n && x.n.trim()) o.n = x.n.trim(); if (x.pr && x.prInfo && x.prInfo.length) o.p = x.prInfo; if (num(x.t) > 0) o.t = num(x.t); if (num(x.d) > 0) o.d = num(x.d); if (x.sp && x.sp.length) o.sp = x.sp; if (x.st) o.st = x.st; return o; }) })).filter(it => it.sets.length);
  if (!items.length) { commit(st => { st.active = null; st.rest = null; }, 'active', 300); return; }
  const now = Date.now(); const ended = opts.endedAt && opts.endedAt > a.startedAt ? opts.endedAt : now;
  const session = { id: a.id, routineId: a.routineId, routineName: a.routineName, dayId: a.dayId, name: a.name, startedAt: a.startedAt, endedAt: ended, updatedAt: now, items, prs: [] };
  if (a.run) session.run = { ...a.run };
  /* an add-on day counts as done only if at least one of its sets was (older workouts without .from still count) */
  if (a.addons && a.addons.length) { const did = new Set(a.items.filter(it => it.from && it.sets.some(isDone)).map(it => it.from)); const ad = a.addons.filter(x => did.has(x.id) || !a.items.some(it => it.from === x.id)); if (ad.length) session.addons = ad; }
  session.prs = detectPRs(session);
  commit(st => { st.sessions[session.id] = session; st.active = null; st.rest = null; }, ['s_' + session.id, 'active'], 300);
  if (session.run) runFinished(session);
  openSheet({ type: 'summary', id: session.id });
}
function routineSlot(a, it) {
  const r = a && S.meta.routines[a.routineId]; if (!r || !it.slot) return null;
  for (const d of r.days) { const x = d.items.find(i => i.id === it.slot); if (x) return x; }
  return null;
}

/* ---------- shared bits ---------- */
function Sheet({ children, label }) {
  const ref = useRef(null); const drag = useRef(null); const last = useRef(0); const [big, setBig] = useState(false);
  const down = e => { const el = ref.current; if (!el) return; drag.current = { y: e.clientY, t: Date.now(), h: el.getBoundingClientRect().height, dy: 0 }; last.current = 0; el.style.transition = 'none';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} };
  const move = e => { const d = drag.current, el = ref.current; if (!d || !el) return; const dy = e.clientY - d.y; d.dy = dy;
    if (dy >= 0) { el.style.transform = 'translateY(' + dy + 'px)'; el.style.height = ''; el.style.maxHeight = ''; }
    else { el.style.transform = ''; el.style.maxHeight = 'none'; el.style.height = Math.min(innerHeight - 12, d.h - dy) + 'px'; } };
  const up = () => { const d = drag.current, el = ref.current; drag.current = null; if (!d || !el) return; const dy = d.dy; last.current = dy;
    const fast = dy / Math.max(1, Date.now() - d.t) > 0.6;
    el.style.transition = 'transform .2s ease, height .2s ease';
    if (dy > 140 || (dy > 30 && fast && !big) || (dy > 30 && fast && big && dy > 90)) { el.style.transform = 'translateY(' + (el.offsetHeight + 40) + 'px)'; setTimeout(closeSheet, 180); return; }
    el.style.transform = ''; el.style.height = ''; el.style.maxHeight = '';
    if (dy < -40) setBig(true); else if (dy > 40 && big) setBig(false); };
  const tap = () => { if (Math.abs(last.current) < 6) setBig(!big); last.current = 0; };
  /* A real modal: the page behind is inert (so Tab and VoiceOver stay inside), focus moves to the title, and goes back
     to whatever opened the sheet when it closes. */
  useEffect(() => {
    const prev = document.activeElement; const el = ref.current;
    const bg = [...document.querySelectorAll('#app > header, #app > main, #app > nav')]; bg.forEach(n => { n.inert = true; });
    const t = setTimeout(() => { if (el && !el.contains(document.activeElement)) { const h = el.querySelector('h2') || el; h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch (e) {} } }, 40);
    return () => { clearTimeout(t); bg.forEach(n => { n.inert = false; }); if (prev && prev !== document.body && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) {} } };
  }, []);
  return html`<div class="scrim" onClick=${e => { if (e.target === e.currentTarget) closeSheet(); }}>
    <div ref=${ref} class=${'sheet' + (big ? ' big' : '')} role="dialog" aria-modal="true" aria-label=${label || 'Panel'}>
      <button class="grab-zone" aria-label=${big ? 'Make this panel smaller' : 'Make this panel full height'} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onClick=${tap}><span class="grab"></span></button>${children}</div></div>`;
}
function Sparkline({ pts }) {
  if (!pts || pts.length < 2) return html`<svg viewBox="0 0 76 26" width="76" height="26" aria-hidden="true"><line x1="2" y1="13" x2="74" y2="13" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 4"/></svg>`;
  const p = pts.slice(-12); const lo = Math.min(...p.map(x => x.v)), hi = Math.max(...p.map(x => x.v)); const sp = hi - lo || 1;
  const xy = p.map((x, i) => [3 + i * 70 / (p.length - 1), 22 - (x.v - lo) / sp * 18]);
  return html`<svg viewBox="0 0 76 26" width="76" height="26" aria-hidden="true"><polyline points=${xy.map(q => q.join(',')).join(' ')} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx=${xy[xy.length - 1][0]} cy=${xy[xy.length - 1][1]} r="3" fill="var(--accent)"/></svg>`;
}
function WeekStrip() {
  const ws = startOfWeek(new Date()); const counts = dayCounts(); const today = ymd(new Date()); const marks = S.meta.dayMarks || {};
  return html`<div class="week">${[0, 1, 2, 3, 4, 5, 6].map(i => { const k = ymd(addDays(ws, i)); const hit = counts[k] > 0; const m = !hit && marks[k];
    const cls = 'wd' + (hit ? ' hit' : '') + (k === today ? ' is-today' : '') + (m ? (EXCUSED[m] ? ' mk-ex' : ' mk-rest') : '');
    return html`<button key=${k} class=${cls} aria-label=${DOW_FULL[(i + 1) % 7] + (hit ? ', workout logged' : m ? ', ' + DAY_MARKS[m] : '') + dotsLabel((i + 1) % 7)} onClick=${() => openSheet({ type: 'day', k })}>
      <b>${'MTWTFSS'[i]}</b><i>${hit ? I.check : m ? html`<span class="mk">${DAY_MARKS[m][0]}</span>` : null}</i><${DayDots} dow=${(i + 1) % 7} k=${k}/></button>`; })}</div>`;
}
/* ---------- TRAIN ---------- */
/*@include train.js*/
function ActiveWorkout() {
  const a = S.active;
  useWake();
  const total = a.items.reduce((n, it) => n + it.sets.length, 0), done = a.items.reduce((n, it) => n + it.sets.filter(isDone).length, 0);
  return html`<div>
    <div class="wo-head"><div style="min-width:0"><div class="eyebrow">${a.routineName || 'Workout'}</div><h2 class="wo-title">${a.name}</h2></div><${WoClock} since=${a.startedAt}/></div>
    <div class="bar" role="progressbar" aria-label="Sets done" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${done} aria-valuetext=${done + ' of ' + total + ' sets'}><div style=${{ width: (total ? done / total * 100 : 0) + '%' }}></div></div>
    <div class="small muted num" style="margin-top:6px">${done} of ${total} sets done</div>
    <${WorkoutExtras} a=${a}/>
    <${FightWorkoutBtn} a=${a}/>
    ${lsGet('swiped') !== '1' && Object.values(S.sessions).filter(x => x.kind !== 'activity').length < 2 ? html`<p class="swipe-hint">Swipe a set right to log it as shown, or tap its number for Log, Copy and Delete. Typing the reps logs it too.</p>` : null}
    ${a.items.map((it, i) => html`<${SlotCard} key=${it.id} it=${it} i=${i} nextSS=${!!(a.items[i + 1] && a.items[i + 1].ss)}/>`)}
    ${!a.items.length ? html`<div class="empty"><h3>Empty workout</h3><p>Add the first exercise below.</p></div>` : null}
    <div class="stack" style="margin-top:16px">
      <${WorkoutAddons} a=${a}/>
      <button class="btn ghost wide" onClick=${() => openSheet({ type: 'pick', title: 'Add exercise', onPick: ex => { a.items.push(makeSlot({ ex: ex.id, sets: 3 })); closeSheet(); touch(); } })}>${I.plus} Add exercise</button>
      <button class="btn wide" onClick=${() => UI.setView({ type: 'timer' })}>${I.timer} Interval timer</button>
      <button class="btn primary wide" onClick=${() => openSheet({ type: 'finish' })}>Finish workout</button>
      <button class="btn text danger wide" onClick=${() => openSheet({ type: 'confirm', title: 'Discard this workout?', body: 'Nothing from this session will be saved.', ok: 'Discard', danger: true, onOk: () => { commit(st => { st.active = null; st.rest = null; }, 'active', 300); closeSheet(); } })}>Discard workout</button>
    </div></div>`;
}
/* Steppers under the set being edited: weight moves by the weight jump, reps by one; press and hold to repeat.
   Pointer-down is cancelled on the strip so the field keeps focus and the keyboard stays up. */
function StepStrip({ it, s, field, kind }) {
  const u = it.u || U(); const inc = field === 'w' ? (u === U() ? +S.meta.settings.inc || 5 : (u === 'kg' ? 2.5 : 5)) : 1;
  const cur = () => num(field === 'w' ? (String(s.w).trim() ? s.w : s.gw) : (String(s.r).trim() ? s.r : s.gr));
  const apply = v => { if (field === 'w') s.w = String(r1(Math.max(0, v))); else s.r = String(Math.max(0, Math.round(v))); touch(); if (field === 'r') afterEdit(it, s); };
  const hold = useRef(null);
  const start = (e, dir) => { e.preventDefault(); e.stopPropagation(); apply(cur() + dir * inc); clearTimeout(hold.current); clearInterval(hold.current);
    hold.current = setTimeout(() => { hold.current = setInterval(() => apply(cur() + dir * inc), 110); }, 420); };
  const stop = () => { clearTimeout(hold.current); clearInterval(hold.current); hold.current = null; };
  useEffect(() => stop, []);
  const btn = (dir, label) => html`<button type="button" tabindex="-1" aria-label=${(dir > 0 ? 'Add ' : 'Subtract ') + inc + (field === 'w' ? ' ' + u : ' rep' + (inc === 1 ? '' : 's'))} onPointerDown=${e => start(e, dir)} onPointerUp=${stop} onPointerCancel=${stop} onPointerLeave=${stop} onContextMenu=${e => e.preventDefault()}>${label}</button>`;
  const shown = field === 'w' ? fmt(cur()) + ' ' + (kind === 'assisted' ? 'assist' : u) : Math.round(cur()) + ' reps';
  return html`<div class="step-strip" onPointerDown=${e => e.preventDefault()}>${btn(-1, '−' + fmt(inc))}<span class="step-val num">${shown}</span>${btn(1, '+' + fmt(inc))}
    ${field === 'w' && s.gw && String(s.w).trim() && num(s.w) !== num(s.gw) ? html`<button type="button" tabindex="-1" class="step-last" onPointerDown=${e => { e.preventDefault(); apply(num(s.gw)); }}>Last ${fmt(num(s.gw))}</button>` : null}</div>`;
}
function SetRow({ it, s, j, kind }) {
  if (!s.id) s.id = uid('t');
  const [foc, setFoc] = useState(null);
  const key = s.id; const ref = useRef(null); const wrap = useRef(null); const drag = useRef(null); const ulR = useRef(null); const urR = useRef(null);
  const [ne, setNe] = useState(false); const noteRef = useRef(null);
  useEffect(() => { if (ne && noteRef.current) noteRef.current.focus(); }, [ne]);
  const side = SW.open && SW.open.key === key ? SW.open.side : null;
  const base = side === 'L' ? 168 : side === 'R' ? -92 : 0;
  const done = isDone(s); const u = it.u || U();
  const setX = (x, anim) => { const el = ref.current; if (!el) return; const W = el.offsetWidth || 320; const tr = anim ? 'transform .18s ease-out' : 'none';
    el.style.transition = tr; el.style.transform = x ? 'translateX(' + x + 'px)' : '';
    for (const [r, w, full] of [[ulR, Math.max(0, x), x > W * 0.55], [urR, Math.max(0, -x), -x > W * 0.55]]) if (r.current) { r.current.style.transition = anim ? 'width .18s ease-out' : 'none'; r.current.style.width = w + 'px'; r.current.classList.toggle('full', full); } };
  useEffect(() => { setX(base, true); }, [base]);
  const down = e => { if (e.pointerType === 'mouse' && e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false, dx: 0 }; };
  const move = e => { const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      d.on = true; try { ref.current.setPointerCapture(e.pointerId); } catch (_) {}
      const ae = document.activeElement; if (ae && ref.current.contains(ae)) ae.blur();
      if (SW.open && SW.open.key !== key) { SW.open = null; S.rerender(); }
    }
    d.dx = dx; const W = ref.current.offsetWidth; setX(Math.max(-W, Math.min(W, base + dx)), false); };
  const up = e => { const d = drag.current; drag.current = null; if (!d || !d.on) return; SUPPRESS = Date.now();
    const W = ref.current.offsetWidth; const x = base + d.dx;
    if (x > W * 0.55) { SW.open = null; setX(W, true); setTimeout(() => { setX(0, true); if (!done) completeSet(it, s, true); else uncompleteSet(it, s, true); }, 170); }
    else if (x > 50) { SW.open = { key, side: 'L' }; setX(168, true); S.rerender(); }
    else if (x < -W * 0.55) { SW.open = null; setX(-W, true); setTimeout(() => deleteSet(it, s), 170); }
    else if (x < -50) { SW.open = { key, side: 'R' }; setX(-92, true); S.rerender(); }
    else { SW.open = null; setX(0, true); S.rerender(); } };
  const cancel = () => { if (drag.current && drag.current.on) setX(base, true); drag.current = null; };
  const clickCap = e => { if (Date.now() - SUPPRESS < 350) { e.preventDefault(); e.stopPropagation(); return; }
    if (side) { e.preventDefault(); e.stopPropagation(); SW.open = null; S.rerender(); } };
  const wLbl = kind === 'assisted' ? 'Assist ' + u : kind === 'bodyweight' ? 'Added ' + u : u;
  const act = (cls, icon, label, fn) => html`<button class=${'act ' + cls} tabindex=${side ? 0 : -1} onClick=${fn}><span class="pill">${icon}</span><span class="al">${label}</span></button>`;
  const noteCell = ne
    ? html`<input ref=${noteRef} id=${'n-' + s.id} class="note" type="text" autocomplete="off" translate=${false} value=${s.n || ''} placeholder="Note" aria-label=${'Set ' + (j + 1) + ' note'}
        onInput=${e => { s.n = e.target.value; touch(); }} onBlur=${() => setNe(false)} onKeyDown=${enterBlur}/>`
    : s.n ? html`<button class="note-txt" translate=${false} aria-label=${'Edit note for set ' + (j + 1)} onClick=${() => setNe(true)}>${s.n}</button>`
    : html`<button class="note-add" aria-label=${'Add a note to set ' + (j + 1)} onClick=${() => setNe(true)}>${I.note}</button>`;
  return html`<div class="setwrap"><div class="swipe" ref=${wrap}>
    <div class="under" aria-hidden=${side ? null : 'true'}>
      <div class="ul" ref=${ulR}>${act('ok', done ? I.x : I.check, done ? 'Clear' : 'Complete', () => { SW.open = null; done ? uncompleteSet(it, s, true) : completeSet(it, s, true); })}${act('cp', I.copy, 'Copy set', () => copySet(it, s))}</div>
      <div class="ur" ref=${urR}>${act('del', I.trash, 'Delete', () => deleteSet(it, s))}</div>
    </div>
    <div ref=${ref} class=${'set-row' + (done ? ' done' : '')} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${cancel} onClickCapture=${clickCap}>
      <button type="button" class=${'n' + (s.pr && done ? ' pr' : '')} id=${'sn-' + s.id} aria-label=${'Set ' + (j + 1) + (done ? ', logged' : '') + '. Actions'} onClick=${() => openSheet({ type: 'setActs', it, s })}>${j + 1}</button>
      <input id=${'w-' + s.id} type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" value=${s.w} placeholder=${s.gw || (kind === 'bodyweight' ? '0' : '–')} aria-label=${'Set ' + (j + 1) + ' ' + wLbl}
        onFocus=${e => { selAll(e); setFoc('w'); }} onBlur=${() => setFoc(f => f === 'w' ? null : f)} onInput=${e => { s.w = e.target.value; touch(); }} onChange=${() => afterEdit(it, s)} onKeyDown=${enterBlur}/>
      <input id=${'r-' + s.id} type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" value=${s.r} placeholder=${s.gr || '–'} aria-label=${'Set ' + (j + 1) + ' reps'}
        onFocus=${e => { selAll(e); setFoc('r'); }} onBlur=${() => setFoc(f => f === 'r' ? null : f)} onInput=${e => { s.r = e.target.value; touch(); }} onChange=${() => afterEdit(it, s)} onKeyDown=${enterBlur}/>
      <div class="last-note">${!ne && prevSetText(it, j, kind) ? html`<span class="prev num" id=${'pv-' + s.id} aria-label=${'Set ' + (j + 1) + ' last time: ' + prevSetText(it, j, kind)}>${prevSetText(it, j, kind)}</span>` : null}${noteCell}</div>
    </div></div>${s.pr && done && s.prInfo && s.prInfo.length ? html`<p class="pr-line" role="note" aria-label=${'Set ' + (j + 1) + ' personal record: ' + s.prInfo.join(', ')}>${s.prInfo.map((t, k) => html`<span key=${k}>PR · ${t}</span>`)}</p>` : null}</div>`;
}
function ExNote({ it }) {
  const [ed, setEd] = useState(false); const ref = useRef(null);
  useEffect(() => { if (ed && ref.current) ref.current.focus(); }, [ed]);
  if (ed) return html`<input ref=${ref} class="ex-note" id=${'en-' + it.id} type="text" autocomplete="off" translate=${false} value=${it.note || ''} placeholder=${it.prevNote ? 'Last time: ' + it.prevNote : 'Seat height, grip, cues'} aria-label=${exName(it.ex) + ' note'}
    onInput=${e => { it.note = e.target.value; touch(); }} onBlur=${() => setEd(false)} onKeyDown=${enterBlur}/>`;
  if (it.note) return html`<button class="ex-note-txt" translate=${false} aria-label="Edit exercise note" onClick=${() => setEd(true)}>${it.note}</button>`;
  return html`<div class="ex-note-row"><button class="note-add wide" onClick=${() => setEd(true)}>${I.note}<span>Exercise note</span></button>${it.prevNote ? html`<span class="small faint ex-prev" translate=${false}>Last time: ${it.prevNote}</span>` : null}</div>`;
}
function SlotCard(p) { return isMeasured(exKind(p.it.ex)) ? html`<${MeasSlot} ...${p}/>` : html`<${LiftSlot} ...${p}/>`; }
function LiftSlot({ it, nextSS }) {
  const kind = exKind(it.ex); const u = it.u || U();
  const wLabel = kind === 'assisted' ? 'Assist ' + u : kind === 'bodyweight' ? '+' + u : u;
  const cur = it.sets.find(x => !isDone(x)) || it.sets[it.sets.length - 1];
  const curW = cur ? num(cur.w || cur.gw) : 0;
  const pl = kind === 'barbell' && curW > 0 && !exSideOn(it.ex) ? plates(curW, u) : null;
  const allDone = it.sets.length && it.sets.every(isDone);
  const exR = S.meta.exRest[it.ex];
  const inc = u === U() ? +S.meta.settings.inc : (u === 'kg' ? 2.5 : 5);
  return html`<section class=${'slot' + (it.ss ? ' ss' : '') + (nextSS ? ' ss-next' : '')} aria-label=${exName(it.ex)}>
    ${it.ss ? html`<div class="ss-tag">${I.link} Superset with above</div>` : null}
    <div class="slot-head"><div class="slot-name"><h3>${exName(it.ex)}${allDone ? html` <span class="faint" style="font-weight:600">✓</span>` : null}</h3>
      <div class="meta">${groupChip(it.group)}<span>${it.target.sets} sets${it.target.reps ? ' × ' + repTxt(it.target.reps) + ' reps' : ''}</span>${exR != null ? html`<span>· rest ${exR ? clock(exR) : 'off'}</span>` : null}${it.prev ? null : html`<span class="faint">· first time${it.group ? ' in this range' : ''}</span>`}</div>${it.prev && it.prevT ? html`<div class="last-line num" id=${'last-' + it.id}>Last${it.prevWhere ? ' ' + it.prevWhere : ''} · ${shortDate(it.prevT)}: ${lastLine(it)}${exSideOn(it.ex) ? ' each side' : ''}</div>` : null}${it.target && it.target.cue ? html`<p class="small muted" style="margin-top:4px">${it.target.cue}</p>` : null}</div>
      <button class="icon-btn" aria-label=${'Options for ' + exName(it.ex)} onClick=${() => openSheet({ type: 'slot', it })}>${I.more}</button></div>
    ${it.prog ? html`<div class=${'hint prog-' + it.prog.mode} id=${'prog-' + it.id}>${it.prog.mode === 'step' || it.prog.mode === 'deload' ? I.down : I.up} ${it.prog.msg}</div>` : null}
    <${MachineRow} it=${it}/>
    <${ExNote} it=${it}/>
    <div class="sets">
      <div class="set-row th"><span>Set</span><span class="w-th"><button class="unit-tog" aria-label=${'Weight in ' + u + '. Switch to ' + (u === 'kg' ? 'lb' : 'kg')} onClick=${() => toggleUnit(it)}>${wLabel} ⇄</button><${SideTog} ex=${it.ex}/></span><span>Reps</span><span class="th-ln">${it.prev ? html`<span class="th-last">Last</span>` : null}<span>Note</span></span></div>
      ${it.sets.map((x, j) => html`<${SetRow} key=${x.id || j} it=${it} s=${x} j=${j} kind=${kind}/>`)}
    </div>
    <div class="slot-foot">
      <button class="btn text" onClick=${() => { const l = it.sets[it.sets.length - 1]; it.sets.push({ id: uid('t'), w: '', r: '', n: '', gw: l ? (l.w || l.gw || '') : '', gr: l ? (l.r || l.gr || '') : '' }); touch(); }}>+ Set</button>
      ${pl ? html`<span class="plates">${pl}</span>` : null}
    </div></section>`;
}
function RestBar() {
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(iv); }, []);
  const r = S.rest; if (!r) return null;
  const left = Math.ceil((r.until - Date.now()) / 1000);
  if (left <= -4) { S.rest = null; return null; }
  const st = S.meta.settings; const key = r.kind === 'ss' ? 'restSS' : 'rest';
  const def = r.kind === 'ex' ? +S.meta.exRest[r.ex] : +st[key] || 0;
  const adjust = d => { const t = Math.max(15, r.total + d); r.until += (t - r.total) * 1000; r.total = t; r.beeped = {}; bgRest(); S.rerender(); };
  const label = left > 0 ? (r.kind === 'ss' ? 'Superset rest' : r.kind === 'ex' ? exName(r.ex) + ' rest' : 'Rest') : 'Go';
  const saveTxt = r.kind === 'ss' ? 'supersets' : r.kind === 'ex' ? exName(r.ex) : 'single exercises';
  return html`<div class="restbar" role="timer"><div class="restbar-in">
    <button class="rest-time" aria-label=${label + ' ' + clock(Math.max(0, left)) + '. Change rest time'} onClick=${() => openSheet({ type: 'restPick' })}><span class="lbl2">${label}</span><span class="t">${clock(Math.max(0, left))}</span></button>
    <div class="spacer"></div>
    <button aria-label="15 seconds less" onClick=${() => adjust(-15)}>−15</button>
    <button aria-label="15 seconds more" onClick=${() => adjust(15)}>+15</button>
    <button onClick=${() => { S.rest = null; bgStop(); S.rerender(); }}>Skip</button>
    ${r.offerBg ? html`<div class="rest-offer" id="bg-offer"><span>Hear the beep with the phone locked?</span><button id="bg-yes" onClick=${bgOfferYes}>Turn on</button><button id="bg-no" onClick=${bgOfferNo}>No</button></div>` : null}
    ${r.total !== def ? html`<button class="rest-save" aria-label=${'Make ' + clock(r.total) + ' the default for ' + saveTxt} onClick=${() => { commit(m => { if (r.kind === 'ex') m.meta.exRest[r.ex] = r.total; else m.meta.settings[key] = r.total; }, 'meta', 800); showToast({ kind: 'info', text: clock(r.total) + ' is now the default for ' + saveTxt + '.' }); }}>Keep</button>` : null}
  </div></div>`;
}
function IntervalMini() {
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(iv); }, []);
  const T = S.itimer; if (!T) return null;
  let label, time;
  if (T.cfg.mode === 'stopwatch') { label = 'Stopwatch'; time = clock(Math.floor(tElapsed(T))); }
  else { const p = tLocate(T); if (!p) { label = 'Timer finished'; time = '0:00'; } else { label = p.phase.label; time = clock(Math.ceil(p.left - 1e-6)); } }
  return html`<div class="mini" role="timer"><button class="mini-open" onClick=${() => { UI.setTab('train'); UI.setView({ type: 'timer' }); }}><b>${time}</b><span>${label}${T.pausedAt ? ' · paused' : ''}</span></button>
    <button class="mini-btn" onClick=${() => tPause(T)}>${T.pausedAt ? 'Resume' : 'Pause'}</button></div>`;
}
function Toast() {
  const t = S.toast; if (!t || Date.now() > t.until) return null;
  const hold = () => { if (S.toast === t) t.until = Math.max(t.until, Date.now() + 6000); };
  return html`<div class=${'toast ' + (t.kind || 'info')} role="status" onPointerEnter=${hold} onPointerDown=${hold} onFocusIn=${hold}>${t.kind === 'pr' ? I.plate : null}<span>${t.text}</span>${t.action ? html`<button onClick=${() => { const f = t.fn; S.toast = null; if (f) f(); S.rerender(); }}>${t.action}</button>` : null}${t.action2 ? html`<button id="toast-2" onClick=${() => { const f = t.fn2; S.toast = null; if (f) f(); S.rerender(); }}>${t.action2}</button>` : null}</div>`;
}
/* ---------- LOG ---------- */
function LogScreen() {
  const all = sessionList().slice().reverse(); const [shown, setShown] = useState(30);
  const list = all.slice(0, shown);  /* 30 at a time: years of history shouldn't build thousands of rows at once */
  const actBtn = html`<button class="btn ghost wide" style="margin-top:6px" onClick=${() => openSheet({ type: 'activity' })}>${I.plus} Log an activity</button>`;
  if (!list.length) return html`<div><div class="empty"><h3>No workouts yet</h3><p>Finished workouts show up here with your best set for each exercise. Running, swimming, yoga and other activities can be logged too.</p></div>${actBtn}</div>`;
  let lastMonth = '';
  return html`<div>${actBtn}${list.map(s => { const d = new Date(s.startedAt); const mk = MON[d.getMonth()] + ' ' + d.getFullYear(); const head = mk !== lastMonth ? (lastMonth = mk, html`<div class="month-h">${MON[d.getMonth()]} ${d.getFullYear()}</div>`) : null;
    const mins = Math.max(1, Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000));
    return html`${head}<button key=${s.id} class="log-item" onClick=${() => openSheet({ type: 'session', id: s.id })}>
      <div class="date-chip"><span>${DOW[d.getDay()]}</span><b>${d.getDate()}</b></div>
      <div style="min-width:0"><div class="log-top"><h3>${s.name}</h3><span class="mins">${mins} min</span></div>
        ${s.kind === 'activity' ? html`<p class="log-act">${actLine(s) || 'Activity'}${s.note ? html`<span class="faint"> · ${s.note}</span>` : null}</p>` : null}<ul class="log-ex">${s.items.map((it, k) => html`<li key=${k}><span>${it.sets.length}× ${exName(it.ex)}${it.group ? ' · ' + it.group : ''}</span><span class="best">${bestSetLabel(it.sets, exKind(it.ex))}${it.u && it.u !== U() ? ' ' + it.u : ''}</span></li>`)}</ul>
        ${noE1(s.prs).length ? html`<div class="log-prs">${noE1(s.prs).slice(0, 3).map((p, k) => html`<span key=${k} class="pr-badge">${I.plate} ${p.label}</span>`)}${noE1(s.prs).length > 3 ? html`<span class="chip">+${noE1(s.prs).length - 3} more</span>` : null}</div>` : null}
      </div></button>`; })}
    ${all.length > shown ? html`<button class="btn wide" style="margin-top:12px" id="log-more" onClick=${() => setShown(shown + 30)}>Show ${Math.min(30, all.length - shown)} more · ${all.length - shown} older</button>` : null}</div>`;
}

/* ---------- ROUTINES ---------- */
/* Workout types. A day's tags come from the editor, or are worked out from its name, then its exercises. */
const WTAGS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Mobility', 'Conditioning', 'Other'];
const TAG_WORDS = [[/\bpush\b/, ['Push']], [/\bpull\b/, ['Pull']], [/\blegs?\b/, ['Legs']], [/\bupper\b/, ['Upper']], [/\blower\b/, ['Lower']], [/\b(full|total) ?body\b/, ['Full Body']],
  [/\bchest\b/, ['Chest', 'Push']], [/\bback\b/, ['Back', 'Pull']], [/\bshoulders?\b/, ['Shoulders', 'Push']], [/\b(arms?|biceps?|triceps?|bis|tris)\b/, ['Arms']], [/\b(core|abs?)\b/, ['Core']], [/\b(mobility|stretch(es|ing)?|yoga|flexibility)\b/, ['Mobility']], [/\b(conditioning|cardio|hiit|metcon)\b/, ['Conditioning']]];
function autoTags(day, r) {
  const nm = norm(String(day.name || '').replace(/^Day\s*\d+\s*[-–]\s*/i, '') + (r && r.days.length === 1 ? ' ' + r.name : ''));
  const out = []; for (const [re, t] of TAG_WORDS) if (re.test(nm)) t.forEach(x => { if (!out.includes(x)) out.push(x); });
  if (out.length) return WTAGS.filter(t => out.includes(t));
  const w = { push: 0, pull: 0, legs: 0, core: 0, arms: 0, cond: 0 }; let tot = 0;
  for (const it of day.items) {
    const s = +it.sets || 1; tot += s;
    if (COND_EX.test(norm(exName(it.ex)))) { w.cond += s; continue; }
    const c = exCat(it.ex);
    if (c === 'chest' || c === 'shoulders') w.push += s; else if (c === 'triceps') { w.push += s; w.arms += s; }
    else if (c === 'back') w.pull += s; else if (c === 'biceps') { w.pull += s; w.arms += s; }
    else if (c === 'legs') w.legs += s; else if (c === 'core') w.core += s; else if (c === 'cardio') w.cond += s;
  }
  if (!tot) return ['Other']; const f = k => w[k] / tot;
  if (f('cond') >= .4) return ['Conditioning']; if (f('core') >= .6) return ['Core']; if (f('legs') >= .6) return ['Legs'];
  if (f('arms') >= .6) return ['Arms']; if (f('push') >= .6) return ['Push']; if (f('pull') >= .6) return ['Pull'];
  if (f('legs') >= .2 && f('push') + f('pull') >= .3) return ['Full Body']; if (f('push') + f('pull') >= .6) return ['Upper'];
  if (f('legs') + f('core') >= .6) return ['Lower']; return ['Other'];
}
const dayTags = (day, r) => day.tags && day.tags.length ? day.tags : autoTags(day, r);
const routineTags = r => { const s = new Set(); r.days.forEach(d => dayTags(d, r).forEach(t => s.add(t))); return WTAGS.filter(t => s.has(t)); };
const setsLabel = it => isMeasured(exKind(it.ex)) ? tgLabel(it) : it.sets + ' set' + (+it.sets === 1 ? '' : 's') + (it.reps ? ' × ' + repTxt(it.reps) + ' reps' : '');
/* The weight used last time (heaviest set, or least assistance), with its unit. */
const lastTop = it => { const e = lastEntry(it.ex, it.group || ''); if (!e) return ''; if (isMeasured(exKind(it.ex))) return ' · last ' + measBest(e.raw, exKind(it.ex)); const ws = e.raw.filter(x => +x.r > 0).map(x => +x.w || 0).filter(w => w > 0); if (!ws.length) return '';
  const asst = exKind(it.ex) === 'assisted'; return ' · last ' + fmt(asst ? Math.min(...ws) : Math.max(...ws)) + ' ' + e.u + (asst ? ' assist' : ''); };
const dayLabel = d => String(d.name || '').replace(/\s*\(.*\)$/, '').replace(/^Day\s*\d+\s*[-–]\s*/i, '');
/* Type chips (Nov 10, audit P2-1): gray, at most 3 on a card with "+N" for the rest; the plan's page shows them all */
const tagChips = (tags, max) => { const n = max || tags.length; const shown = tags.slice(0, n);
  return html`<span class="tag-row">${shown.map(t => html`<span key=${t} class="chip wtag">${t}</span>`)}${tags.length > n ? html`<span class="chip wtag more" aria-label=${(tags.length - n) + ' more types: ' + tags.slice(n).join(', ')}>+${tags.length - n}</span>` : null}</span>`; };

function RoutinesScreen({ view }) {
  if (view && view.type === 'routine') return html`<${RoutineView} id=${view.id}/>`;
  if (view && view.type === 'edit') return html`<${RoutineEditor} view=${view}/>`;
  return html`<${RoutineList}/>`;
}
const RT_OPEN = { v: null };
const openSecs = () => { if (!RT_OPEN.v) { try { RT_OPEN.v = JSON.parse(lsGet('rtOpen') || '{}') || {}; } catch (e) { RT_OPEN.v = {}; } } return RT_OPEN.v; };
/* The Plans library (Nov 10, audit P1-3): one list. A routine is just a one-day plan. A search box, one row of filter
   chips, and sections that show their first 3 with Show all. "By type" keeps the old view by workout type. */
const PLAN_FILTERS = [['all', 'All'], ['mine', 'Yours'], ['lift', 'Lifting'], ['one', 'One-day'], ['goal', 'Goal plans'], ['run', 'Running and conditioning'], ['fight', 'Fight'], ['care', 'Joint care'], ['ch', 'Challenges'], ['type', 'By type']];
const PLAN_MORE = {};
function setPlanFilter(f) { lsSet('rtFilter', f); }
function RoutineList() {
  const fl = PLAN_FILTERS.some(x => x[0] === lsGet('rtFilter')) ? lsGet('rtFilter') : 'all';
  const [q, setQ] = useState(''); const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const pickF = f => { setPlanFilter(f); re(); };
  const mine = myRoutines(); const lib = libRoutines(); const hidden = (S.meta.hidden || []).filter(libBase);
  const pid = programId();
  const card = r => { const tag = [r.base ? 'Edited' : '', pid === r.id ? 'Your main plan' : '', r.meta || (r.days.length === 1 ? 'One day' : '')].filter(Boolean).join(' · ');
    return html`<button key=${r.id} class="r-card" onClick=${() => UI.setView({ type: 'routine', id: r.id })}>
    ${tag ? html`<span class="tag">${tag}</span>` : null}<h3>${r.name}</h3>
    <span class="days">${r.days.length === 1 ? r.days[0].items.length + ' exercises' : r.days.length + ' days · ' + r.days.map(dayLabel).join(', ')}</span>${tagChips(routineTags(r), 3)}</button>`; };
  const newDraft = () => ({ id: uid('r'), name: '', source: 'mine', createdAt: Date.now(), days: [{ id: uid('d'), name: 'Day 1', items: [] }] });
  const actions = html`<div class="row"><button class="btn primary" style="flex:1" id="plan-new" onClick=${() => UI.setView({ type: 'edit', draft: newDraft(), isNew: true })}>${I.plus} New plan</button>
    <button class="btn" style="flex:1" onClick=${() => openSheet({ type: 'import' })}>Import</button></div>`;
  const bring = hidden.length ? html`<button class="btn text wide" onClick=${() => commit(st => { st.meta.hidden = []; }, 'meta')}>Bring back ${hidden.length} removed plan${hidden.length === 1 ? '' : 's'}</button>` : null;
  const multi = r => r.days.length > 1;
  const SECS = [
    ['mine', 'Yours', mine],
    ['lift', 'Lifting', lib.filter(r => multi(r) && !r.info && !r.goalPlan)],
    ['one', 'One-day', lib.filter(r => !multi(r) && !r.info)],
    ['goal', 'Goal plans', lib.filter(r => r.goalPlan)],
    ['run', 'Running and conditioning', lib.filter(r => r.info && !r.info.care && !r.info.fight)],
    ['fight', 'Fight', lib.filter(r => r.info && r.info.fight)],
    ['care', 'Joint care', lib.filter(r => r.info && r.info.care)]];
  const runRow = html`<button class="r-card" id="lib-run" onClick=${() => { TRAIN.mode = 'run'; lsSet('trainMode', 'run'); UI.setTab('train'); }}><span class="tag">${runActive && runActive() ? 'On' : 'Set up in Train → Run'}</span><h3>Running plan</h3><span class="days">Paces from your times or a quick estimate, around your lifting</span></button>`;
  const top = html`<div class="topsw"><h1 class="page-title">Plans</h1></div>
    <p class="small muted tab-intro" style="margin:2px 0 8px">Workouts and plans to start or follow.</p>
    <input class="field" type="search" id="plan-q" placeholder="Search plans" aria-label="Search plans" value=${q} onInput=${e => setQ(e.target.value)}/>
    <div class="plan-chips" role="group" aria-label="Show" id="plan-filters">${PLAN_FILTERS.map(([k, l]) => html`<button key=${k} class=${'chip' + (fl === k ? ' on' : '')} aria-pressed=${fl === k} id=${'pf-' + k} onClick=${() => pickF(k)}>${l}</button>`)}</div>
    <${Tip} id="plans-lib" style="margin-top:10px">Follow a plan from its page and Train lines up the next day for you. A one-day plan is a single workout you can start any time.<//>`;
  const norm = t => String(t).toLowerCase().replace(/×/g, 'x'); const term = norm(q.trim());
  if (term) {
    const hits = [...mine, ...lib].filter(r => norm(r.name + ' ' + (r.meta || '') + ' ' + r.days.map(d => d.name).join(' ')).includes(term));
    return html`<div>${top}<div class="section-h"><h2>${hits.length ? hits.length + ' found' : 'Nothing found'}</h2></div><div class="stack">${hits.map(card)}</div>
      ${hits.length ? null : html`<p class="note">Try fewer letters, or clear the search to browse.</p>`}</div>`;
  }
  if (fl === 'type') return html`<div>${top}<${ByTypeList} rs=${[...mine, ...lib]}/><div class="stack" style="margin-top:18px">${actions}${bring}</div></div>`;
  if (fl === 'ch') return html`<div>${top}<div class="section-h"><h2>Challenges</h2></div><${ChallengeFinder} where="routines"/></div>`;
  const sec = ([k, t, rs]) => {
    if (fl !== 'all' && fl !== k) return null;
    const extra = k === 'run' ? 1 : 0; if (!rs.length && !extra && k !== 'mine') return null;
    const cap = fl === 'all' && !PLAN_MORE[k] ? 3 : 1e9; const list = rs.slice(0, Math.max(0, cap - extra));
    return html`<div key=${k} id=${'ps-' + k}><div class="section-h"><h2>${t}</h2>${fl === 'all' && rs.length + extra > 3 ? html`<button class="btn text" id=${'more-' + k} onClick=${() => { PLAN_MORE[k] = !PLAN_MORE[k]; re(); }}>${PLAN_MORE[k] ? 'Show fewer' : 'Show all ' + (rs.length + extra)}</button>` : null}</div>
      ${k === 'care' ? html`<${CareFinder}/>` : null}
      <div class="stack">${k === 'mine' && !rs.length ? html`<p class="note">Plans you build, copy or import show here.</p>` : null}${k === 'run' ? runRow : null}${list.map(card)}${k === 'mine' ? actions : null}</div></div>`; };
  return html`<div>${top}${SECS.map(sec)}
    ${fl === 'all' ? html`<div class="section-h"><h2>Challenges</h2><button class="btn text" onClick=${() => pickF('ch')}>Show all</button></div><${ChallengeFinder} where="routines"/>` : null}
    <div class="stack" style="margin-top:10px">${bring}</div></div>`;
}
/* Every workout sorted by its type, in sections you open and close */
function ByTypeList({ rs }) {
  const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const open = openSecs(); const groups = WTAGS.map(t => ({ t, rows: [] }));
  for (const r of rs) for (const d of r.days) if (d.items.length) for (const t of dayTags(d, r)) (groups.find(g => g.t === t) || groups[groups.length - 1]).rows.push({ r, d });
  const shown = groups.filter(g => g.rows.length); const allOpen = shown.length && shown.every(g => open[g.t]);
  const setAll = v => { shown.forEach(g => { open[g.t] = v; }); lsSet('rtOpen', JSON.stringify(open)); re(); };
  const row = ({ r, d }) => html`<div key=${r.id + d.id} class="wk-row">
    <button class="wk-main" onClick=${() => UI.setView({ type: 'routine', id: r.id })}>
      <span class="t">${r.days.length > 1 ? dayLabel(d) : r.name}</span>
      <span class="s">${r.days.length > 1 ? r.name + ' · ' : ''}${d.items.length} exercise${d.items.length === 1 ? '' : 's'}</span>${tagChips(dayTags(d, r), 3)}</button>
    <button class="pill-btn accent" onClick=${() => startWorkout(r, d)}>Start</button></div>`;
  return html`<div id="by-type"><div class="row" style="margin:12px 0 2px"><p class="small muted" style="flex:1">Every workout, sorted by type. Set a workout's type in Edit.</p>
      ${shown.length ? html`<button class="btn text" onClick=${() => setAll(!allOpen)}>${allOpen ? 'Close all' : 'Open all'}</button>` : null}</div>
    ${shown.map(g => { const on = !!open[g.t]; return html`<section key=${g.t} class="wsec">
      <button class="wsec-h" aria-expanded=${on} onClick=${() => { open[g.t] = !on; lsSet('rtOpen', JSON.stringify(open)); re(); }}><h2>${g.t}</h2><span class="aside num">${g.rows.length}</span>${on ? I.up : I.down}</button>
      ${on ? html`<div class="stack" style="gap:6px;margin-top:8px">${g.rows.map(row)}</div>` : null}</section>`; })}</div>`;
}
function RoutineView({ id }) {
  const r = getRoutine(id); if (!r) return html`<div class="empty"><h3>Plan not found</h3></div>`;
  const lib = !!libBase(r.id); const builtin = r.source === 'builtin';
  const copy = () => { const c = clone(r); delete c.base; delete c.meta; delete c.shelf; c.id = uid('r'); c.source = 'mine'; c.name = r.name + ' (copy)'; c.createdAt = Date.now(); c.days.forEach(d => { d.id = uid('d'); d.items.forEach(i => { i.id = uid('i'); }); });
    commit(st => { st.meta.routines[c.id] = c; }, 'meta'); UI.setView({ type: 'routine', id: c.id }); };
  const edit = () => UI.setView({ type: 'edit', draft: builtin ? { ...clone(r), source: 'mine', base: r.id, createdAt: Date.now() } : clone(r) });
  const reset = () => openSheet({ type: 'confirm', title: 'Reset ' + r.name + '?', body: 'Your changes to this plan are undone. Logged workouts stay in your history.', ok: 'Reset plan', danger: true, onOk: () => { commit(st => { delete st.meta.routines[r.id]; }, 'meta'); closeSheet(); } });
  const del = () => openSheet({ type: 'confirm', title: (lib ? 'Remove ' : 'Delete ') + r.name + '?', body: lib ? 'It leaves your library. You can bring it back at the bottom of Plans. Logged workouts stay in your history.' : 'Logged workouts stay in your history.', ok: lib ? 'Remove plan' : 'Delete plan', danger: true,
    onOk: () => { commit(st => { delete st.meta.routines[r.id]; if (lib) st.meta.hidden = [...new Set([...(st.meta.hidden || []), r.id])]; }, 'meta'); closeSheet(); UI.setView(null); } });
  return html`<div>
    <div class="eyebrow" style="margin-top:6px">${[r.base ? 'Edited' : '', programId() === r.id ? 'Your main plan' : '', r.meta || ''].filter(Boolean).join(' · ') || (r.days.length > 1 ? 'Plan' : 'One-day plan')}</div>
    <h2 class="wo-title" style="margin:2px 0 6px">${r.name}</h2>
    <div style="margin-bottom:8px">${tagChips(routineTags(r))}</div>
    ${r.note ? html`<p class="note">${r.note}</p>` : null}
    ${r.info ? (r.info.fight ? html`<${FightInfo} r=${r}/>` : r.info.care ? html`<${CareInfo} r=${r}/>` : html`<${CondInfo} r=${r}/>`) : null}
    <div class="row wrap" style="margin:14px 0 4px">
      ${programId() === r.id ? null : html`<button class=${'btn' + (addonIds().includes(r.id) ? ' primary' : '')} id="alongside" aria-pressed=${addonIds().includes(r.id)} onClick=${() => { const on = !addonIds().includes(r.id); setAddon(r.id, on); if (on) openSheet({ type: 'addonFit', id: r.id }); else showToast({ kind: 'info', text: r.name + ' removed from Train' }); }}>${addonIds().includes(r.id) ? html`${I.check} Alongside` : html`${I.plus} Add alongside`}</button>`}
      ${programId() === r.id ? null : html`<button class="btn primary" id="follow" onClick=${() => { setProgram(r.id); showToast(followToast(r.id)); }}>Follow${r.days.length > 1 ? ' this plan' : ''}</button>`}
      <button class="btn" onClick=${edit}>${I.edit} Edit</button>
      <button class="btn" onClick=${copy}>${I.copy} Copy</button>
      <button class="btn" id="plan-more" aria-label=${'More for ' + r.name} onClick=${() => openSheet({ type: 'planMore', title: r.name, acts: [
        programId() === r.id || addonIds().includes(r.id) ? ['plan-restart', 'Restart from day 1', '', () => { closeSheet(); restartProgram(r.id); }] : null,
        programId() === r.id ? ['plan-stop', 'Stop following', 'Train goes back to asking what you follow.', () => { closeSheet(); stopPlan(r.id); }] : null,
        r.base ? ['plan-reset', 'Reset', 'Undo your changes to this plan.', reset] : null,
        ['plan-del', lib ? 'Remove from Plans' : 'Delete plan', lib ? 'You can bring it back at the bottom of Plans.' : 'Logged workouts stay in your history.', del, true]].filter(Boolean) })}>${I.more}</button>
    </div>
    <${PrefillRow} r=${r}/>
    <div class="stack" style="margin-top:10px">${r.days.map(d => html`<div key=${d.id} class="r-day">
      <div class="row"><div style="flex:1;min-width:0"><h3>${d.name}</h3>${r.days.length > 1 ? html`<div style="margin-top:4px">${tagChips(dayTags(d, r))}</div>` : null}</div><button class="pill-btn accent" onClick=${() => startWorkout(r, d)}>Start</button></div>
      <ul class="r-items">${d.items.map(it => html`<li key=${it.id} class=${it.ss ? 'ssi' : ''}><span class="nm">${exName(it.ex)}</span>${groupChip(it.group)}<span class="sub num">${setsLabel(it)}${lastTop(it)}</span>${it.note ? html`<span class="cue">${it.note}</span>` : null}</li>`)}</ul></div>`)}</div>
  </div>`;
}
function RoutineEditor({ view }) {
  const d = view.draft; const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const move = (arr, i, dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; ssTop(arr); re(); };
  const save = () => { if (!d.name.trim()) d.name = 'My plan'; d.days = d.days.filter(x => x.items.length || x.name.trim()); d.days.forEach(x => { if (x.items[0]) x.items[0].ss = false; });
    commit(st => { st.meta.routines[d.id] = clone(d); if (view.follow) st.meta.settings.program = d.id; }, 'meta'); UI.setView({ type: 'routine', id: d.id }); };
  return html`<div class="stack" style="gap:14px;margin-top:6px">
    <div><label class="lbl" for="rt-name">Plan name</label><input class="field" id="rt-name" value=${d.name} placeholder="e.g. Upper / Lower" onInput=${e => { d.name = e.target.value; }}/></div>
    ${d.days.map((day, di) => html`<div key=${day.id} class="r-day">
      <div class="row"><input class="field" id=${'day-' + day.id} aria-label="Day name" value=${day.name} onInput=${e => { day.name = e.target.value; }}/>
        <button class="icon-btn" aria-label="Move day up" onClick=${() => move(d.days, di, -1)}>${I.up}</button>
        <button class="icon-btn" aria-label="Delete day" onClick=${() => { d.days.splice(di, 1); re(); }}>${I.trash}</button></div>
      <div><div class="lbl">Workout type</div><div class="ed-tags" role="group" aria-label="Workout type">${WTAGS.map(t => { const on = (day.tags || []).includes(t); return html`<button key=${t} class=${'chip' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => { const s = new Set(day.tags || []); if (on) s.delete(t); else s.add(t); day.tags = WTAGS.filter(x => s.has(x)); re(); }}>${t}</button>`; })}</div>
        ${day.tags && day.tags.length ? null : html`<p class="small faint" style="margin-top:6px">Automatic: ${autoTags(day, d).join(', ')}. Tap a type to set your own.</p>`}</div>
      ${day.items.map((it, ii) => html`<div key=${it.id} class=${'ed-item' + (it.ss ? ' ssi' : '')}>
        <div class="row"><button class="ed-name" onClick=${() => openSheet({ type: 'pick', title: 'Swap exercise', onPick: ex => { it.ex = ex.id; closeSheet(); re(); } })}><span>${exName(it.ex)}</span>${I.swap}</button>
          <button class="icon-btn" aria-label="Move up" onClick=${() => move(day.items, ii, -1)}>${I.up}</button>
          <button class="icon-btn" aria-label="Move down" onClick=${() => move(day.items, ii, 1)}>${I.down}</button>
          <button class="icon-btn" aria-label="Remove exercise" onClick=${() => { day.items.splice(ii, 1); re(); }}>${I.x}</button></div>
        <div class="row wrap">
          <span class="stepper"><button aria-label="Fewer sets" onClick=${() => { it.sets = Math.max(1, it.sets - 1); re(); }}>−</button><b>${it.sets}</b><button aria-label="More sets" onClick=${() => { it.sets = Math.min(20, it.sets + 1); re(); }}>+</button></span>
          <span class="small muted">sets ×</span>
          ${isMeasured(exKind(it.ex)) ? html`<${TargetInput} key=${it.ex} it=${it} re=${re}/>` : html`<input class="ed-reps" id=${'reps-' + it.id} aria-label="Target reps" placeholder="reps" value=${it.reps} onInput=${e => { it.reps = e.target.value.replace(/[^\d\-–]/g, ''); }}/>`}
          <button class=${'chip' + (it.group ? ' group' : '')} onClick=${() => openSheet({ type: 'group', current: it.group, dayName: day.name, onPick: g => { it.group = g; applyRange(it, g); closeSheet(); re(); } })}>${it.group ? 'Range: ' + (RANGE_NAME[it.group] || it.group) : 'Rep range'}</button>
          ${ii > 0 ? html`<label class="toggle"><input type="checkbox" id=${'ss-' + it.id} checked=${it.ss} onChange=${e => { it.ss = e.target.checked; re(); }}/>Superset</label>` : null}
        </div>
        <input class="field ed-cue" id=${'cue-' + it.id} aria-label=${exName(it.ex) + ' note'} placeholder="Note, e.g. 15 each side" value=${it.note || ''} onInput=${e => { it.note = e.target.value; }}/></div>`)}
      <button class="btn ghost wide" onClick=${() => openSheet({ type: 'pick', title: 'Add to ' + (day.name || 'day'), onPick: ex => { day.items.push({ id: uid('i'), ex: ex.id, sets: 3, reps: '', group: '', ss: false }); closeSheet(); re(); } })}>${I.plus} Add exercise</button>
    </div>`)}
    <button class="btn wide" onClick=${() => { d.days.push({ id: uid('d'), name: 'Day ' + (d.days.length + 1), items: [] }); re(); }}>${I.plus} Add day</button>
    <div class="row"><button class="btn" style="flex:1" onClick=${() => UI.setView(view.isNew ? null : { type: 'routine', id: d.id })}>Cancel</button><button class="btn primary" style="flex:2" onClick=${save}>Save plan</button></div>
  </div>`;
}

/* ---------- STATS ---------- */
function niceTicks(lo, hi, n) {
  const raw = (hi - lo) / n; const mag = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}
function LiftChart({ pts, proj, unitLabel, now, kind }) {
  const W = 360, H = 216, L = 40, R = 10, T = 14, B = 26;
  const [hov, setHov] = useState(null); const ref = useRef(null);
  const t0 = Math.min(pts.length ? pts[0].t : now, now - 28 * DAY), t1 = now + HORIZON * DAY;
  const vals = pts.map(p => p.v); if (proj) vals.push(proj.today, proj.keep(HORIZON), proj.stop(HORIZON));
  let lo = Math.min(...vals), hi = Math.max(...vals); if (hi - lo < 1) { lo -= 2; hi += 2; } const pad = (hi - lo) * 0.14; lo -= pad; hi += pad; if (lo < 0) lo = 0;
  const ticks = niceTicks(lo, hi, 4);
  const x = t => L + (t - t0) / (t1 - t0) * (W - L - R), y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
  const samp = f => { let s = ''; for (let d = 0; d <= HORIZON; d += 4) s += (d ? 'L' : 'M') + x(now + d * DAY).toFixed(1) + ' ' + y(f(d)).toFixed(1); return s; };
  const onMove = e => { const b = ref.current.getBoundingClientRect(); const px = (e.clientX - b.left) / b.width * W;
    if (px > x(now) && proj) { const d = Math.min(HORIZON, Math.max(0, Math.round((px - L) / (W - L - R) * (t1 - t0) / DAY - (now - t0) / DAY))); setHov({ kind: 'proj', d }); return; }
    let bi = -1, bd = 1e9; pts.forEach((p, i) => { const dd = Math.abs(x(p.t) - px); if (dd < bd) { bd = dd; bi = i; } }); setHov(bi >= 0 ? { kind: 'pt', i: bi } : null); };
  const d0 = new Date(t0);
  let tip = null, hx = null;
  if (hov && hov.kind === 'pt' && pts[hov.i]) { const p = pts[hov.i]; hx = x(p.t); tip = html`<div class="tip" style=${{ left: Math.min(80, Math.max(20, hx / W * 100)) + '%' }}><b>${fmt(p.v)} ${unitLabel}</b><br/>${shortDate(p.t)} · ${bestSetLabel(p.sets, kind || 'barbell')}</div>`; }
  if (hov && hov.kind === 'proj' && proj) { hx = x(now + hov.d * DAY); tip = html`<div class="tip" style=${{ left: Math.min(80, Math.max(20, hx / W * 100)) + '%' }}>${shortDate(now + hov.d * DAY)}<br/><b>${fmt(proj.keep(hov.d))}</b> at your pace · <b>${fmt(proj.stop(hov.d))}</b> if you stop</div>`; }
  return html`<div class="chart-wrap">
    <svg ref=${ref} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Chart of ' + unitLabel + ' over time with projections'} onPointerMove=${onMove} onPointerDown=${onMove} onPointerLeave=${() => setHov(null)}>
      ${ticks.map(v => html`<g key=${v}><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} stroke="var(--line)" stroke-width="1"/><text x=${L - 6} y=${y(v) + 4} text-anchor="end" font-size="11" fill="var(--ink-3)">${fmt(v)}</text></g>`)}
      <rect x=${x(now)} y=${T} width=${W - R - x(now)} height=${H - T - B} fill="var(--accent-soft)" opacity="0.35"/>
      <line x1=${x(now)} x2=${x(now)} y1=${T} y2=${H - B} stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 3"/>
      <text x=${L} y=${H - 8} font-size="11" fill="var(--ink-3)">${MON[d0.getMonth()]} ${d0.getDate()}</text>
      <text x=${x(now)} y=${H - 8} font-size="11" fill="var(--ink-2)" text-anchor="middle" font-weight="600">Today</text>
      <text x=${W - R} y=${H - 8} font-size="11" fill="var(--ink-3)" text-anchor="end">+8 wk</text>
      ${proj && pts.length ? html`<path d=${'M' + x(proj.last.t) + ' ' + y(proj.last.v) + 'L' + x(now) + ' ' + y(proj.today)} fill="none" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="2 3"/>` : null}
      ${proj ? html`<path d=${samp(proj.stop)} fill="none" stroke="var(--stop)" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>` : null}
      ${proj ? html`<path d=${samp(proj.keep)} fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>` : null}
      ${pts.length > 1 ? html`<path d=${line} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>` : null}
      ${pts.map((p, i) => html`<circle key=${i} cx=${x(p.t)} cy=${y(p.v)} r=${hov && hov.kind === 'pt' && hov.i === i ? 5.5 : 4} fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`)}
      ${proj ? html`<circle cx=${x(now)} cy=${y(proj.today)} r="4.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>` : null}
      ${proj ? html`<circle cx=${x(t1)} cy=${y(proj.keep(HORIZON))} r="3.5" fill="var(--accent)"/><circle cx=${x(t1)} cy=${y(proj.stop(HORIZON))} r="3.5" fill="var(--stop)"/>` : null}
      ${hx != null ? html`<line x1=${hx} x2=${hx} y1=${T} y2=${H - B} stroke="var(--ink-2)" stroke-width="1"/>` : null}
    </svg>${tip}
    <div class="legend">
      <span><svg viewBox="0 0 22 8"><line x1="1" y1="4" x2="21" y2="4" stroke="var(--accent)" stroke-width="2"/><circle cx="11" cy="4" r="3" fill="var(--accent)"/></svg>Logged</span>
      <span><svg viewBox="0 0 22 8"><line x1="1" y1="4" x2="21" y2="4" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 3"/></svg>At your current pace</span>
      <span><svg viewBox="0 0 22 8"><line x1="1" y1="4" x2="21" y2="4" stroke="var(--stop)" stroke-width="2" stroke-dasharray="5 3"/></svg>If you stop training</span>
    </div></div>`;
}
function ProjTrio({ proj, unitLabel }) {
  const k = proj.keep(HORIZON), s = proj.stop(HORIZON), dk = k - proj.last.v;
  return html`<div class="trio">
    <div><b>${fmt(proj.today)}</b><span>Today's estimate${proj.daysOff > GRACE ? ', fading' : ''}</span></div>
    <div><b class=${dk >= 0 ? 'up-c' : 'down-c'}>${fmt(k)}</b><span>In 8 weeks at your pace</span></div>
    <div><b class="down-c">${fmt(s)}</b><span>In 8 weeks if you stop</span></div></div>`;
}
function Heatmap() {
  const weeks = 16; const ws0 = addDays(startOfWeek(new Date()), -7 * (weeks - 1)); const counts = dayCounts(); const today = ymd(new Date()); const nowD = startOfDay(new Date());
  const marks = S.meta.dayMarks || {};
  const cells = []; const months = []; let lastM = -9;
  for (let w = 0; w < weeks; w++) { const wd = addDays(ws0, 7 * w); const ch = addDays(wd, 6).getMonth() !== addDays(wd, -1).getMonth();
    if ((w === 0 || ch) && w - lastM >= 3) { months.push(MON[addDays(wd, 6).getMonth()]); lastM = w; } else months.push('');
    for (let d = 0; d < 7; d++) { const day = addDays(wd, d); const k = ymd(day); const m = marks[k]; cells.push({ k, w, d, on: counts[k] > 0, m, fut: day > nowD, now: k === today }); } }
  return html`<div class="heat" role="img" aria-label="Workout days over the last 16 weeks">
    <span></span>${months.map((m, i) => html`<span key=${'m' + i} class="ml" style=${{ gridColumn: i + 2, gridRow: 1 }}>${m}</span>`)}
    ${['M', '', 'W', '', 'F', '', 'S'].map((l, d) => html`<span key=${'d' + d} class="dl" style=${{ gridColumn: 1, gridRow: d + 2 }}>${l}</span>`)}
    ${cells.map(c => html`<i key=${c.k} title=${c.k + (c.on ? ' · workout' : c.m ? ' · ' + DAY_MARKS[c.m] : '')} class=${(c.on ? 'on ' : c.m ? (EXCUSED[c.m] ? 'ex ' : 'rest ') : '') + (c.fut ? 'fut ' : '') + (c.now ? 'now' : '')} style=${{ gridColumn: c.w + 2, gridRow: c.d + 2 }}></i>`)}
  </div>
  <div class="heat-legend"><span><i class="on"></i>Workout</span><span><i class="rest"></i>Rest day</span><span><i class="ex"></i>Sick, injured or break</span></div>`;
}
function liftRows() {
  const seen = new Map();
  for (const s of sessionList()) for (const it of s.items) { const k = it.ex + '|' + (it.group || ''); seen.set(k, { ex: it.ex, group: it.group || '', last: s.startedAt }); }
  return [...seen.values()].sort((a, b) => b.last - a.last);
}
function demoData(now) {
  const pts = []; const start = now - 70 * DAY; let v = 190;
  for (let t = start; t < now - 9 * DAY; t += 3.5 * DAY) { v += 1.6 + Math.sin(t / 5e8) * 1.4; pts.push({ t, v: Math.round(v), sets: [{ w: Math.round(v / 1.17), r: 5 }] }); }
  return pts;
}
function itemVolume(it) { const k = exKind(it.ex); if (k === 'bodyweight' || k === 'assisted') return 0; return toMain(it.sets, it.u).reduce((a, x) => a + (+x.w || 0) * (+x.r || 0), 0); }
const PERIODS = [['1w', '1 week'], ['4w', '1 month'], ['3m', '3 months'], ['1y', 'Year'], ['all', 'All time']];
function periodStart(p) { const t = startOfDay(new Date()); return p === '1w' ? addDays(t, -6) : p === '4w' ? addDays(t, -27) : p === '3m' ? addDays(t, -90) : p === '1y' ? addDays(t, -364) : new Date(0); }
function overallStats(p) {
  const from = +periodStart(p); const ss = sessionList().filter(x => x.startedAt >= from);
  let dur = 0, vol = 0, sets = 0, reps = 0;
  for (const x of ss) { dur += Math.max(0, (x.endedAt || x.startedAt) - x.startedAt); for (const it of x.items) { vol += itemVolume(it); sets += it.sets.length; reps += it.sets.reduce((a, y) => a + (+y.r || 0), 0); } }
  const first = sessionList()[0]; const spanDays = p === 'all' ? (first ? Math.max(7, (Date.now() - first.startedAt) / DAY) : 7) : (Date.now() - from) / DAY;
  return { n: ss.length, dur, vol, sets, reps, avgDur: ss.length ? dur / ss.length : 0, rps: sets ? reps / sets : 0, spw: ss.length ? sets / ss.length : 0, perWeek: ss.length / Math.max(1, spanDays / 7) };
}
function dailySeries(days, fn) {
  const d0 = addDays(startOfDay(new Date()), -(days - 1)); const out = [];
  for (let i = 0; i < days; i++) out.push({ t: +addDays(d0, i), v: 0 });
  for (const x of sessionList()) { const i = Math.round((+startOfDay(x.startedAt) - +d0) / DAY); if (i >= 0 && i < days) out[i].v += fn(x); }
  return out;
}
function weeklySeries(weeks, fn) {
  const ws0 = addDays(startOfWeek(new Date()), -7 * (weeks - 1)); const out = [];
  for (let i = 0; i < weeks; i++) out.push({ t: +addDays(ws0, 7 * i), v: 0 });
  for (const x of sessionList()) { const i = Math.round((+startOfWeek(x.startedAt) - +ws0) / (7 * DAY)); if (i >= 0 && i < weeks) out[i].v += fn(x); }
  return out;
}
const barPath = (x, y, w, h) => { const r = Math.min(4, w / 2, h); return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z'; };
function BarChart({ data, fmtV, unit, daily }) {
  const W = 360, H = 194, L = 38, R = 8, T = 24, B = 24;
  const [hov, setHov] = useState(null); const ref = useRef(null);
  const max = Math.max(1, ...data.map(d => d.v)); const ticks = niceTicks(0, max, 3); const top = Math.max(max, ticks[ticks.length - 1] || max);
  const n = data.length; const slot = (W - L - R) / n; const bw = Math.max(2, slot - Math.min(8, slot * 0.3));
  const y = v => T + (1 - v / top) * (H - T - B);
  const onMove = e => { const b = ref.current.getBoundingClientRect(); const px = (e.clientX - b.left) / b.width * W; const i = Math.floor((px - L) / slot); setHov(i >= 0 && i < n ? i : null); };
  const lbl = t => { const d = new Date(t); return MON[d.getMonth()] + ' ' + d.getDate(); };
  const dayLbl = (t, i) => i === n - 1 ? 'Today' : DOW[new Date(t).getDay()];
  const xi = daily ? data.map((_, i) => i) : [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  const maxI = data.reduce((bi, d, i) => d.v > data[bi].v ? i : bi, 0);
  const showVal = i => data[i].v > 0 && (n <= 16 || i === maxI || i === n - 1);
  const cx = i => L + i * slot + slot / 2;
  return html`<div class="chart-wrap"><svg ref=${ref} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${(daily ? 'Daily ' : 'Weekly ') + unit + ': ' + data.map(d => fmtV(d.v)).join(', ')} onPointerMove=${onMove} onPointerDown=${onMove} onPointerLeave=${() => setHov(null)}>
    ${ticks.map(v => html`<g key=${v}><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} stroke="var(--line)" stroke-width="1"/><text x=${L - 6} y=${y(v) + 4} text-anchor="end" font-size="11" fill="var(--ink-3)">${fmtV(v)}</text></g>`)}
    ${data.map((d, i) => { if (!(d.v > 0)) return null; const h = Math.max(1, y(0) - y(d.v)); const x = L + i * slot + (slot - bw) / 2;
      return html`<path key=${i} d=${barPath(x, y(d.v), bw, h)} fill="var(--accent)" opacity=${i === n - 1 && !daily ? 0.55 : (hov === null || hov === i ? 1 : 0.55)}/>`; })}
    ${data.map((d, i) => showVal(i) ? html`<text key=${'v' + i} x=${cx(i)} y=${y(d.v) - 6} font-size=${n > 16 ? 10 : 11} font-weight="700" fill="var(--ink)" text-anchor="middle">${fmtV(d.v)}</text>` : null)}
    ${xi.map(i => html`<text key=${'x' + i} x=${daily ? cx(i) : i === 0 ? L : i === n - 1 ? W - R : cx(i)} y=${H - 7} font-size="11" fill="var(--ink-3)" text-anchor=${daily ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>${daily ? dayLbl(data[i].t, i) : i === n - 1 ? 'This week' : lbl(data[i].t)}</text>`)}
  </svg>${hov != null ? html`<div class="tip" style=${{ left: Math.min(80, Math.max(20, cx(hov) / W * 100)) + '%' }}>${daily ? shortDate(data[hov].t) : 'Week of ' + lbl(data[hov].t) + (hov === n - 1 ? ' (so far)' : '')}<br/><b>${fmtV(data[hov].v, true)}</b> ${unit}</div>` : null}</div>`;
}
function SimpleLine({ pts, unit }) {
  const W = 360, H = 170, L = 40, R = 12, T = 14, B = 24;
  const [hov, setHov] = useState(null); const ref = useRef(null);
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v)); if (hi - lo < 2) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const t0 = pts[0].t, t1 = Math.max(pts[pts.length - 1].t, t0 + DAY);
  const x = t => L + (t - t0) / (t1 - t0) * (W - L - R), y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = niceTicks(lo, hi, 3);
  const onMove = e => { const b = ref.current.getBoundingClientRect(); const px = (e.clientX - b.left) / b.width * W; let bi = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.abs(x(p.t) - px); if (d < bd) { bd = d; bi = i; } }); setHov(bi); };
  const lbl = t => { const d = new Date(t); return MON[d.getMonth()] + ' ' + d.getDate(); };
  return html`<div class="chart-wrap"><svg ref=${ref} viewBox=${'0 0 ' + W + ' ' + H} role="img" aria-label=${'Bodyweight over time, ' + unit} onPointerMove=${onMove} onPointerDown=${onMove} onPointerLeave=${() => setHov(null)}>
    ${ticks.map(v => html`<g key=${v}><line x1=${L} x2=${W - R} y1=${y(v)} y2=${y(v)} stroke="var(--line)" stroke-width="1"/><text x=${L - 6} y=${y(v) + 4} text-anchor="end" font-size="11" fill="var(--ink-3)">${fmt(v)}</text></g>`)}
    <path d=${pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ')} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${pts.map((p, i) => html`<circle key=${i} cx=${x(p.t)} cy=${y(p.v)} r=${hov === i ? 5.5 : 4} fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`)}
    <text x=${L} y=${H - 7} font-size="11" fill="var(--ink-3)">${lbl(t0)}</text><text x=${W - R} y=${H - 7} font-size="11" fill="var(--ink-3)" text-anchor="end">${lbl(pts[pts.length - 1].t)}</text>
  </svg>${hov != null ? html`<div class="tip" style=${{ left: Math.min(80, Math.max(20, x(pts[hov].t) / W * 100)) + '%' }}>${shortDate(pts[hov].t)}<br/><b>${fmt(pts[hov].v)}</b> ${unit}</div>` : null}</div>`;
}
const kpi = (v, l) => html`<div class="kpi"><b>${v}</b><span>${l}</span></div>`;
function StatsScreen({ view }) {
  if (view && view.type === 'exercise') return html`<${ExerciseStats} ex=${view.ex} group=${view.group}/>`;
  if (view && view.type === 'month') return html`<${MonthView} ym=${view.ym}/>`;
  if (view && view.type === 'category') return html`<${CategoryView} cat=${view.cat} mode=${view.mode}/>`;
  if (view && view.type === 'photoCap') return html`<${PhotoCapture} view=${view}/>`;
  if (view && view.type === 'photoCmp') return html`<${PhotoCompare}/>`;
  /* Four tabs (Nov 10, audit P1-5): Numbers holds what were Overall and Categories. Old saved names still open it. */
  const t0 = lsGet('statsTab') || 'history'; const tab = t0 === 'overall' || t0 === 'cats' ? 'numbers' : t0;
  const pick = t => { lsSet('statsTab', t); S.rerender(); };
  return html`<div>
    <div class="seg wide" role="tablist" style="margin-top:8px">${[['history', 'History'], ['numbers', 'Numbers'], ['ex', 'Exercises'], ['photos', 'Photos']].map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => pick(k)}>${l}</button>`)}</div>
    ${DEMO.on ? html`<div class="demo-banner" id="demo-banner" style="margin-top:10px">${I.stats} Sample data for the tour. It goes away when the tour ends.</div>` : null}
    ${tab === 'numbers' || tab === 'ex' ? html`<${StatsExtras}/>` : null}
    ${tab === 'history' ? html`<div><p class=${'sync-line sync ' + S.sync}><i></i>${SYNC_TEXT[S.sync]}</p><${LogScreen}/></div>` : tab === 'ex' ? html`<${StatsExercises}/>` : tab === 'photos' ? html`<${PhotosScreen}/>` : html`<div><${StatsOverall}/><div class="section-h" id="stats-cats"><h2>Sets by muscle</h2></div><${StatsCategories}/></div>`}
  </div>`;
}
function StatsOverall() {
  const per = lsGet('statsPer') || '4w'; const met = lsGet('statsMet') || 'workouts';
  const setPer = p => { lsSet('statsPer', p); S.rerender(); }; const setMet = m => { lsSet('statsMet', m); S.rerender(); };
  const o = overallStats(per); const ws = weekStats();
  const first = sessionList()[0];
  const daily = per === '1w';
  const weeks = per === '4w' ? 8 : per === '3m' ? 13 : per === '1y' ? 52 : Math.min(104, Math.max(8, first ? Math.ceil((Date.now() - first.startedAt) / (7 * DAY)) + 1 : 8));
  const M = { workouts: ['Workouts', x => 1, v => fmt(v), 'workouts'], volume: ['Volume', x => x.items.reduce((a, it) => a + itemVolume(it), 0), v => fmtBig(v), U()], sets: ['Sets', x => x.items.reduce((a, it) => a + it.sets.length, 0), v => fmt(v), 'sets'], time: ['Time', x => Math.max(0, ((x.endedAt || x.startedAt) - x.startedAt) / 60000), v => Math.round(v) + '', 'minutes'] };
  const m = M[met] || M.workouts;
  return html`<div>
    <div class="seg wide per" style="margin-top:14px">${PERIODS.map(([k, l]) => html`<button key=${k} class=${per === k ? 'on' : ''} aria-pressed=${per === k} onClick=${() => setPer(k)}>${l}</button>`)}</div>
    <div class="kpis kpis3" style="margin-top:10px">
      ${kpi(o.n, 'Workouts')}${kpi(fmt(r1(o.perWeek)), per === '1w' ? 'Last 7 days' : 'Per week')}${kpi(fmtBig(o.vol), 'Volume, ' + U())}
      ${lsGet('statsMore') === '1' ? html`${kpi(o.n ? fmtDur(o.avgDur) : '–', 'Avg duration')}${kpi(fmtDur(o.dur), 'Total time')}${kpi(fmtBig(o.sets), 'Sets')}
      ${kpi(fmtBig(o.reps), 'Reps')}${kpi(o.sets ? fmt(r1(o.rps)) : '–', 'Reps per set')}${kpi(o.n ? fmt(r1(o.spw)) : '–', 'Sets per workout')}` : null}
    </div>
    <button class="btn text" id="stats-more" onClick=${() => { lsSet('statsMore', lsGet('statsMore') === '1' ? '0' : '1'); S.rerender(); }}>${lsGet('statsMore') === '1' ? 'Fewer numbers' : 'More numbers'}</button>
    <p class="note" style="margin-top:8px">Volume is weight × reps on weighted lifts, in ${U()}. Bodyweight and assisted moves count toward sets and reps only.</p>
    <div class="section-h"><h2>${daily ? 'By day' : 'By week'}</h2></div>
    <div class="card"><div class="seg wide">${Object.entries(M).map(([k, v]) => html`<button key=${k} class=${met === k ? 'on' : ''} aria-pressed=${met === k} onClick=${() => setMet(k)}>${v[0]}</button>`)}</div>
      <${BarChart} data=${daily ? dailySeries(7, m[1]) : weeklySeries(weeks, m[1])} fmtV=${m[2]} unit=${m[3]} daily=${daily}/></div>
    <div class="section-h"><h2>Consistency</h2><span class="aside">Goal ${ws.goal}/week</span></div>
    <div class="kpis">${kpi(ws.cur, 'Week streak')}${kpi(ws.longest, 'Longest streak')}${kpi(ws.daysSince == null ? '–' : ws.daysSince, 'Days since last')}</div>
    <div class="card" style="margin-top:8px"><${Heatmap}/>
      ${S.meta.settings.excuse && ws.paused ? html`<p class="small muted" style="margin-top:8px">${ws.paused} paused week${ws.paused === 1 ? '' : 's'} inside your current streak.</p>` : null}</div>
    <${BodyweightCard}/>
    <${MeasureCard}/>
    <${RunStatsCard}/>
    <${NutritionStatsCard}/>
  </div>`;
}
function BodyweightCard() {
  const list = (S.meta.bw || []).slice().sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  const pts = list.map(e => ({ t: +parseYmd(e.d), v: r1(conv(+e.w, e.u || U(), U())) }));
  const last = pts[pts.length - 1]; const before = pts.filter(p => p.t <= Date.now() - 28 * DAY).pop();
  return html`<div class="section-h"><h2>Bodyweight</h2><button class="btn text" onClick=${() => openSheet({ type: 'bw' })}>+ Log weight</button></div>
    <div class="card">${!pts.length ? html`<p class="note">Log your bodyweight to track it over time.</p>` : html`
      <div class="row" style="align-items:baseline;flex-wrap:wrap"><b class="big-num">${fmt(last.v)}</b><span class="muted">${U()} · ${shortDate(last.t)}</span>
        ${before ? html`<span class="spacer"></span><span class="small muted">${(last.v - before.v >= 0 ? '+' : '−') + fmt(Math.abs(r1(last.v - before.v)))} ${U()} vs 4 weeks ago</span>` : null}</div>
      ${pts.length > 1 ? html`<${SimpleLine} pts=${pts} unit=${U()}/>` : null}
      <div class="bw-list">${list.slice().reverse().slice(0, 5).map(e => html`<div key=${e.id} class="row small"><span>${shortDate(+parseYmd(e.d))}</span><span class="spacer"></span><b class="num">${fmt(+e.w)} ${e.u || U()}</b>
        <button class="icon-btn" aria-label=${'Delete entry for ' + shortDate(+parseYmd(e.d))} onClick=${() => commit(st => { st.meta.bw = st.meta.bw.filter(x => x.id !== e.id); }, 'meta', 800)}>${I.x}</button></div>`)}</div>`}
    </div>`;
}
function catAgg(mode) {
  const keyOf = ex => mode === 'ppl' ? PPL[exCat(ex)] : exCat(ex);
  const ws0 = addDays(startOfWeek(new Date()), -7 * 11); const thisW = +startOfWeek(new Date()); const from4 = +addDays(startOfWeek(new Date()), -28);
  const A = {};
  for (const x of sessionList()) for (const it of x.items) {
    const k = keyOf(it.ex);
    const a = A[k] = A[k] || { key: k, weeks: Array.from({ length: 12 }, (_, i) => ({ t: +addDays(ws0, 7 * i), v: 0 })), sets: 0, vol: 0, last: 0, exs: new Set(), sets4: 0, vol4: 0 };
    const n = it.sets.length, v = itemVolume(it); a.sets += n; a.vol += v; a.last = Math.max(a.last, x.startedAt); a.exs.add(it.ex);
    const wi = Math.round((+startOfWeek(x.startedAt) - +ws0) / (7 * DAY)); if (wi >= 0 && wi < 12) a.weeks[wi].v += n;
    if (x.startedAt >= from4 && x.startedAt < thisW) { a.sets4 += n; a.vol4 += v; }
  }
  return Object.values(A);
}
function StatsCategories() {
  const mode = lsGet('catMode') || 'muscle'; const setMode = v => { lsSet('catMode', v); S.rerender(); };
  const order = mode === 'ppl' ? ['Push', 'Pull', 'Legs', 'Core', 'Other'] : Object.keys(CATS);
  const rows = catAgg(mode).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return html`<div>
    <div class="seg wide" style="margin-top:14px">${[['muscle', 'Muscle groups'], ['ppl', 'Push / pull / legs']].map(([k, l]) => html`<button key=${k} class=${mode === k ? 'on' : ''} aria-pressed=${mode === k} onClick=${() => setMode(k)}>${l}</button>`)}</div>
    ${rows.length ? html`<div style="margin-top:6px">${rows.map(a => html`<button key=${a.key} class="lift-row cat-row" onClick=${() => UI.setView({ type: 'category', cat: a.key, mode })}>
      <div style="min-width:0"><div class="nm">${mode === 'ppl' ? a.key : CATS[a.key]}</div><div class="sub">${a.weeks[11].v} sets this week · ${fmt(r1(a.sets4 / 4))}/wk avg · ${ago(a.last)}</div></div>
      <${Sparkline} pts=${a.weeks}/>
      <div class="v"><b>${fmtBig(a.vol4)}</b><span class="muted">${U()} · 4 wk</span></div></button>`)}</div>`
      : html`<div class="empty"><h3>Nothing yet</h3><p>Categories fill in as you log workouts.</p></div>`}
    <p class="note" style="margin-top:12px">"/wk avg" and volume use the last 4 full weeks. Every exercise has one category; change it from that exercise's page under Exercises.</p>
  </div>`;
}
function CategoryView({ cat, mode }) {
  const keyOf = ex => mode === 'ppl' ? PPL[exCat(ex)] : exCat(ex);
  const a = catAgg(mode).find(x => x.key === cat); const met = lsGet('catMet') || 'sets';
  const name = mode === 'ppl' ? cat : CATS[cat];
  if (!a) return html`<div class="empty"><h3>No ${name} work yet</h3></div>`;
  const vol = weeklySeries(12, x => x.items.filter(it => keyOf(it.ex) === cat).reduce((t, it) => t + itemVolume(it), 0));
  const exRows = [...a.exs].map(ex => { const e = entries(ex); return { ex, sets: e.reduce((t, x) => t + x.sets.length, 0), last: e.length ? e[e.length - 1].t : 0 }; }).sort((p, q) => q.last - p.last);
  return html`<div>
    <div class="eyebrow" style="margin-top:6px">${mode === 'ppl' ? 'Push / pull / legs' : 'Muscle group'}</div><h2 class="wo-title" style="margin:2px 0 10px">${name}</h2>
    <div class="kpis">${kpi(a.weeks[11].v, 'Sets this week')}${kpi(fmt(r1(a.sets4 / 4)), 'Sets a week, lately')}${kpi(fmtBig(a.vol4), U() + ', last 4 wk')}</div>
    <div class="card" style="margin-top:10px"><div class="seg wide">${[['sets', 'Sets'], ['volume', 'Volume']].map(([k, l]) => html`<button key=${k} class=${met === k ? 'on' : ''} aria-pressed=${met === k} onClick=${() => { lsSet('catMet', k); S.rerender(); }}>${l}</button>`)}</div>
      <${BarChart} data=${met === 'volume' ? vol : a.weeks} fmtV=${met === 'volume' ? (v => fmtBig(v)) : (v => fmt(v))} unit=${met === 'volume' ? U() : 'sets'}/></div>
    <div class="section-h"><h2>Exercises</h2></div>
    <div>${exRows.map(r => html`<button key=${r.ex} class="lift-row" style="grid-template-columns:minmax(0,1fr) auto" onClick=${() => UI.setView({ type: 'exercise', ex: r.ex })}>
      <div style="min-width:0"><div class="nm">${exName(r.ex)}</div><div class="sub">${r.sets} sets logged · ${ago(r.last)}</div></div><span class="muted small">View</span></button>`)}</div>
  </div>`;
}
function StatsExercises() {
  const rows0 = liftRows(); const rows = rows0.filter(r => !isMeasured(exKind(r.ex))); const mrows = rows0.filter(r => isMeasured(exKind(r.ex)) && entries(r.ex).length); const now = Date.now();
  const recentPRs = sessionList().slice().reverse().flatMap(x => noE1(x.prs).map(p => ({ ...p, t: x.startedAt }))).slice(0, 6);
  return html`<div>
    <div class="section-h" style="margin-top:14px"><h2>Strength</h2><span class="aside">Now → 8 weeks</span></div>
    ${rows.length ? html`<div>${rows.map(r => { const kind = exKind(r.ex); const m = defaultMetric(kind); const pts = seriesFor(r.ex, r.group, m); const pj = project(pts, now);
      const k = pj ? pj.keep(HORIZON) : 0;
      return html`<button key=${r.ex + r.group} class="lift-row" onClick=${() => UI.setView({ type: 'exercise', ex: r.ex, group: r.group })}>
        <div style="min-width:0"><div class="nm">${exName(r.ex)}</div><div class="sub">${groupChip(r.group)}<span>${CATS[exCat(r.ex)]} · ${METRICS[m]}${m === 'reps' ? '' : ', ' + U()}</span></div></div>
        <${Sparkline} pts=${pts}/>
        <div class="v">${pj ? html`<b>${fmt(pj.today)}</b><span class=${k >= pj.today ? 'up-c' : 'down-c'}>${k >= pj.today ? '↑' : '↓'} ${fmt(k)}</span>` : '–'}</div></button>`; })}</div>`
    : html`<div class="card note">Log a workout to see your lifts here, each with a chart and an 8-week projection.</div>`}
    ${mrows.length ? html`<${MeasuredRows} rows=${mrows}/>` : null}
    ${recentPRs.length ? html`<div class="section-h"><h2>Recent PRs</h2></div>
      <div class="card prl">${recentPRs.map((p, i) => html`<div key=${i}><div style="min-width:0"><div style="font-weight:600">${exName(p.ex)}${p.group ? ' · ' + p.group : ''}</div><div class="small muted">${shortDate(p.t)} · ${p.value}${p.prev ? ' · was ' + p.prev : ''}</div></div><span class="pr-badge">${I.plate} ${p.label}</span></div>`)}</div>` : null}
  </div>`;
}
function ExerciseStats(p) { return isMeasured(exKind(p.ex)) ? html`<${MeasuredStats} ex=${p.ex}/>` : html`<${LiftStats} ...${p}/>`; }
function LiftStats({ ex, group }) {
  const kind = exKind(ex); const [metric, setMetric] = useState(defaultMetric(kind)); const now = Date.now();
  const groups = [...new Set(entries(ex).map(e => e.group))];
  const pts = seriesFor(ex, group, metric); const proj = project(pts, now);
  const all = entries(ex, group).map(e => ({ ...e, st: entryStats(e.sets, kind) }));
  const bestBy = f => all.reduce((b, e) => (!b || f(e.st) > f(b.st)) ? e : b, null);
  const unitLabel = metric === 'reps' ? 'reps' : U();
  const prs = kind === 'bodyweight' || kind === 'assisted'
    ? [['Most reps in a set', bestBy(s => s.reps), e => e.st.reps + ' reps']]
    : [['Heaviest weight', bestBy(s => s.top), e => fmt(e.st.top) + ' ' + U()], ['Best est. 1RM', bestBy(s => s.e1), e => fmt(e.st.e1) + ' ' + U()], ['Best set volume', bestBy(s => s.vol), e => fmt(e.st.vol) + ' ' + U()]];
  return html`<div>
    <div class="row" style="margin-top:6px"><span class="eyebrow">${KINDS[kind]}</span><span class="spacer"></span>
      <label class="small muted" for="ex-cat">Category</label><select id="ex-cat" class="field mini-select" value=${exCat(ex)} onChange=${e => commit(st => { st.meta.exCat[ex] = e.target.value; }, 'meta', 800)}>${Object.entries(CATS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></div>
    <h2 class="wo-title" style="margin:2px 0 8px">${exName(ex)}</h2>
    ${kind === 'bodyweight' || kind === 'assisted' ? null : html`<button class="btn text" id="ex-goal" style="margin:-4px 0 8px;padding-left:0" onClick=${() => { const g = goalList().find(x => x.ex === ex); openSheet(g ? { type: 'liftGoal', id: g.id } : { type: 'liftGoal', ex }); }}>${goalList().some(x => x.ex === ex) ? 'Edit your goal for this lift' : 'Set a goal for this lift'}</button>`}
    ${groups.length > 1 || group ? html`<div class="row wrap" style="margin-bottom:10px">${[undefined, ...groups].map(g => html`<button key=${g === undefined ? 'all' : g || 'none'} class=${'chip' + (g === group ? ' on' : '')} onClick=${() => UI.setView({ type: 'exercise', ex, group: g })}>${g === undefined ? 'All' : g ? (RANGE_NAME[g] || g) : 'No range'}</button>`)}</div>` : null}
    <div class="seg" role="tablist">${Object.entries(METRICS).filter(([k]) => kind === 'bodyweight' || kind === 'assisted' ? k !== 'e1' : true).map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${metric === k} class=${metric === k ? 'on' : ''} onClick=${() => setMetric(k)}>${l}</button>`)}</div>
    <div class="card" style="margin-top:10px">
      ${pts.length ? html`<${LiftChart} pts=${pts} proj=${proj} unitLabel=${unitLabel} now=${now} kind=${kind}/><${ProjTrio} proj=${proj} unitLabel=${unitLabel}/>
        <p class="note" style="margin-top:12px">Pace comes from your last ${Math.min(10, pts.length)} sessions${group ? ' in the ' + group + ' group' : ''}, scaled by consistency: ${proj.done28} of ${proj.planned} planned workouts in the last 4 weeks. Skipped workouts flatten the blue line right away. After ${GRACE} days without this lift, today's estimate starts to fade.</p>`
      : html`<div class="empty" style="padding:20px 0">No ${METRICS[metric].toLowerCase()} logged yet.</div>`}
    </div>
    ${all.length ? html`<div class="section-h"><h2>Records</h2></div>
      <div class="card prl">${prs.filter(p => p[1]).map(([label, e, val]) => html`<div key=${label}><div><div style="font-weight:600">${label}</div><div class="small muted">${shortDate(e.t)}</div></div><b class="num">${val(e)}</b></div>`)}</div>
      <${RepRecords} ex=${ex} group=${group}/>
      <div class="section-h"><h2>History</h2></div>
      <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Best set</th><th>Sets</th><th>${METRICS[metric]}</th></tr></thead>
        <tbody>${all.slice().reverse().map(e => html`<tr key=${e.sid}><td>${shortDate(e.t)}</td><td>${bestSetLabel(e.sets, kind)}</td><td>${e.sets.length}</td><td>${fmt(metricVal(e.st, metric))}</td></tr>`)}</tbody></table></div>` : null}
  </div>`;
}

/* ---------- PROFILE ---------- */
const SYNC_TEXT = { loading: 'Connecting…', synced: 'Saved to your Claude account', pending: 'Saving to your Claude account…', offline: 'Saved on this phone. Will sync when you’re back online.', local: 'Saved on this device only', over: 'Saved on this phone, but its storage is almost full. Save a backup file, then delete old workouts or photos.', full: 'Storage is full, so new changes aren’t being saved. Save a backup file, then delete old workouts.' };
/* Changing the main unit: older entries carry no unit stamp and mean "the main unit at the time", so they are stamped
   with the old unit first (185 lb must not turn into 185 kg). Bar weight and weight jump only move to the new defaults
   when they were still at the old defaults. */
const UNIT_DEFAULTS = { lb: { bar: 45, inc: 5 }, kg: { bar: 20, inc: 2.5 } };
function switchMainUnit(u) {
  const from = S.meta.settings.unit; if (from === u || !UNIT_DEFAULTS[u]) return;
  const keys = ['meta'];
  commit(x => {
    for (const [id, s] of Object.entries(x.sessions)) { let hit = false; for (const it of s.items || []) if (!it.u) { it.u = from; hit = true; } if (hit) { s.updatedAt = Date.now(); keys.push('s_' + id); } }
    for (const b of x.meta.bw || []) if (!b.u) b.u = from;
    if (x.active) { let hit = false; for (const it of x.active.items || []) if (!it.u) { it.u = from; hit = true; } if (hit) keys.push('active'); }
    const st = x.meta.settings, d0 = UNIT_DEFAULTS[from] || {}, d1 = UNIT_DEFAULTS[u];
    if (+st.bar === d0.bar) st.bar = d1.bar;
    if (+st.inc === d0.inc) st.inc = d1.inc;
    delete st.fine;
    st.unit = u;
  }, keys);
}
const backupJSON = () => JSON.stringify({ app: 'liftbook', version: 1, schema: SCHEMA, exportedAt: new Date().toISOString(), meta: S.meta, sessions: S.sessions, display: typeof displayBackup === 'function' ? displayBackup() : undefined }, null, 1);
const markBackedUp = () => { lsSet('lastBackup', String(Date.now())); S.rerender(); };
async function saveBackupFile() {
  const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
  if (!dl) { try { await navigator.clipboard.writeText(backupJSON()); markBackedUp(); return 'Copied the backup to your clipboard. Paste it into a note to keep it.'; } catch (e) { return 'Saving files is not available here.'; } }
  try { await dl.save({ filename: 'ironwood-backup-' + ymd(new Date()) + '.json', data: backupJSON() }); markBackedUp(); return 'Backup saved.'; }
  catch (e) { return e && e.code === 'declined' ? 'Backup not saved.' : 'Could not save the file here. Try Copy backup instead.'; }
}
/* When a backup is due: 14 days since the last one (or since the first workout) and at least 5 workouts since */
function backupDue() {
  const n = Object.keys(S.sessions).length; if (n < 5) return false;
  const last = +lsGet('lastBackup') || 0, snooze = +lsGet('backupSnooze') || 0; if (Date.now() < snooze) return false;
  const since = Object.values(S.sessions).filter(x => (x.endedAt || x.startedAt || 0) > last).length;
  if (since < 5) return false;
  const first = Math.min(...Object.values(S.sessions).map(x => x.startedAt || Infinity));
  return Date.now() - Math.max(last, first) > 14 * DAY;
}
function BackupNudge() {
  const [msg, setMsg] = useState('');
  if (!backupDue()) return null;
  const last = +lsGet('lastBackup') || 0, since = Object.values(S.sessions).filter(x => (x.endedAt || x.startedAt || 0) > last).length;
  return html`<div class="card stack" style="margin-top:14px" id="backup-nudge">
    <div style="font-weight:700">${last ? 'Time for a backup' : 'Save a backup'}</div>
    <p class="note">${since} workout${since === 1 ? '' : 's'} ${last ? 'since your last backup' : 'are only on this phone'}. A backup file is the only copy if the app or phone is lost.</p>
    ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
    <div class="row"><button class="btn primary" onClick=${async () => setMsg(await saveBackupFile())}>Save backup file</button><button class="btn text" onClick=${() => { lsSet('backupSnooze', String(Date.now() + 7 * DAY)); S.rerender(); }}>Later</button></div></div>`;
}
function lastBackupText() {
  const t = +lsGet('lastBackup') || 0; if (!t) return 'No backup saved yet.';
  const d = Math.floor((Date.now() - t) / DAY); return 'Last backup: ' + (d === 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago') + '.';
}
/* Safari (not the home-screen app) can clear site data after a week without use; say so, and show whether the browser agreed to keep it */
function StorageNote() {
  const [kept, setKept] = useState(null);
  useEffect(() => { let on = true; try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(v => { if (on) setKept(!!v); }).catch(() => {}); } catch (e) {} return () => { on = false; }; }, []);
  const standalone = (() => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } })();
  const isWeb = !!(window.claude && window.claude.standalone);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isWeb && ios && !standalone) return html`<p class="small down-c" id="storage-warn">Open from the Home Screen to keep your data safe: in a Safari tab, iOS can delete it after 7 days without use. Share → Add to Home Screen.</p>`;
  if (kept === false && isWeb) return html`<p class="small faint">Your iPhone can clear app data when it’s low on space. Keep a recent backup.</p>`;
  return null;
}
function ProfileScreen({ view }) {
  const st = S.meta.settings; const [msg, setMsg] = useState('');
  const set = (k, v) => commit(x => { x.meta.settings[k] = v; }, 'meta', 1200);
  const backup = backupJSON;
  const exportFile = async () => setMsg(await saveBackupFile());
  const [phb, setPhb] = useState(null);
  const preparePhotos = async () => { setMsg('Gathering photos…'); try { const d = await photoBackup(); if (!d.count) { setMsg('No progress photos to back up yet.'); return; } setPhb(d); setMsg(''); } catch (e) { setMsg('Couldn’t read the photos on this device.'); } };
  const savePhotos = async () => {
    const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null; const n = phb.count;
    if (!dl) { setMsg('Saving files isn’t available here.'); return; }
    try { await dl.save({ filename: 'ironwood-photos-' + ymd(new Date()) + '.json', data: phb.blob }); setMsg(n + ' photo' + (n === 1 ? '' : 's') + ' saved. Restore this file in Ironwood to bring them back.'); setPhb(null); }
    catch (e) { setMsg(e && e.code === 'declined' ? 'Photos backup not saved.' : 'Could not save the file here.'); }
  };
  const copyBackup = async () => { try { await navigator.clipboard.writeText(backup()); markBackedUp(); setMsg('Backup copied.'); } catch (e) { setMsg('Copy is blocked in this view. Use Save backup file.'); } };
  const restField = (k, label) => html`<div><label class="lbl" for=${'set-' + k}>${label}</label><input class="field" id=${'set-' + k} inputmode="numeric" value=${st[k]} onChange=${e => { const v = e.target.value.trim(); set(k, v === '' ? DEFAULT_SETTINGS[k] : Math.min(900, Math.max(0, Math.round(num(v))))); }}/></div>`;
  const field = (k, label) => html`<div><label class="lbl" for=${'set-' + k}>${label}</label><input class="field" id=${'set-' + k} inputmode="decimal" value=${st[k]} onChange=${e => set(k, Math.abs(num(e.target.value)) || DEFAULT_SETTINGS[k])}/></div>`;
  const tog = (k, label, sub) => html`<label class="toggle-row" for=${'tg-' + k}><span><span>${label}</span>${sub ? html`<span class="d">${sub}</span>` : null}</span><input type="checkbox" role="switch" id=${'tg-' + k} checked=${!!st[k]} onChange=${e => set(k, e.target.checked)}/></label>`;
  const exR = Object.entries(S.meta.exRest || {});
  /* Four groups and an Advanced page (Nov 10, audit P1-5): the everyday settings stay here; the rest is one tap away. */
  if (view && view.type === 'advanced') return html`<div class="stack" style="gap:12px" id="profile-advanced">
    <div class="section-h" style="margin-top:6px"><h2>Weight jumps</h2></div>
    <div class="card stack" style="gap:14px"><${ProgressionSettings} set=${set}/></div>
    <div class="section-h"><h2>Rest timer</h2></div>
    <div class="card stack" style="gap:12px">
      <div><span class="lbl">Superset rest starts after</span><div class="seg wide">${[['each', 'Each exercise'], ['round', 'The full round']].map(([k, l]) => html`<button key=${k} class=${st.ssMode === k ? 'on' : ''} onClick=${() => set('ssMode', k)}>${l}</button>`)}</div></div>
      ${tog('beep', 'Beep when time is up', 'Interval timers also beep at each change.')}
      ${tog('countdown', 'Beep the last 3 seconds')}
      ${tog('bgAudio', 'Beep with the phone locked (beta)', 'Plays a silent track carrying the beeps, so they sound with the screen off or in another app. The phone treats it as media, so it may pause music, and some apps block it.')}
      ${exR.length ? html`<div><span class="lbl">Per-exercise rest</span>${exR.map(([ex, v]) => html`<div key=${ex} class="row small" style="min-height:40px"><span style="flex:1">${exName(ex)}</span><b class="num">${v ? clock(v) : 'Off'}</b><button class="icon-btn" aria-label=${'Use defaults for ' + exName(ex)} onClick=${() => commit(x => { delete x.meta.exRest[ex]; }, 'meta', 600)}>${I.x}</button></div>`)}</div>` : null}
      <p class="note">Tap the time on a running timer to pick another, or set one exercise's rest from its ⋯ menu. Without the beta setting, sounds play only while Ironwood is on screen.</p>
      <button class="btn wide" onClick=${() => { UI.setTab('train'); UI.setView({ type: 'timer' }); }}>${I.timer} Open the interval timer</button>
    </div>
    <div class="section-h"><h2>Personal records</h2></div>
    <${PRCard}/>
    <div class="section-h"><h2>Streaks</h2></div>
    <div class="card stack" style="gap:8px">
      ${tog('excuse', 'Sick, injured and break days pause streaks', "They lower that week's goal instead of breaking your streak, and pause challenges.")}
      <p class="note">Mark a day by tapping it in the week strip on Train. Rest days are labels only; your weekly goal already leaves room for them.</p>
    </div>
    <div class="section-h"><h2>Rep ranges</h2></div>
    <div class="card note">Give an exercise a range like 5–8, 8–12, max reps or 1 rep max and that range keeps its own weights, prefills, chart and PRs. Curls done two ways never overwrite each other. Records still count across every range.</div>
  </div>`;
  return html`<div class="stack" style="gap:12px">
    <div class=${'sync ' + S.sync} style="margin-top:6px"><i></i><span>${SYNC_TEXT[S.sync] || ''}</span></div>
    <div class="section-h"><h2>Backup</h2></div>
    <div class="card stack">
      <div class="row wrap"><button class="btn" id="backup-file" onClick=${exportFile}>Save backup file</button><button class="btn" onClick=${copyBackup}>Copy backup</button><button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>
      <div class="row wrap">${phb ? html`<button class="btn primary" onClick=${savePhotos}>Save ${phb.count} photo${phb.count === 1 ? '' : 's'}</button>` : html`<button class="btn" onClick=${preparePhotos}>Prepare photos backup</button>`}</div>
      <p class="note">The backup file has workouts, plans and settings. Progress photos are large, so they go in their own file.</p>
      ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
      <p class="note">${Object.keys(S.sessions).length} workouts · ${Object.keys(S.meta.routines).length} plans · ${Object.keys(S.meta.exercises).length} custom exercises</p>
      <p class="note" id="last-backup">${lastBackupText()}</p>
      <${StorageNote}/>
    </div>
    <div class="section-h" style="margin-top:12px"><h2>Display & language</h2></div>
    <${DisplayCard}/>
    <div class="section-h"><h2>Training basics</h2><button class="btn text" id="profile-plan" onClick=${() => openSheet({ type: 'addons' })}>Your plan</button></div>
    <div class="card stack" style="gap:14px">
      <div><span class="lbl">Main unit</span><div class="seg">${['lb', 'kg'].map(u => html`<button key=${u} class=${st.unit === u ? 'on' : ''} onClick=${() => switchMainUnit(u)}>${u}</button>`)}</div>
        <p class="note" style="margin-top:6px">Any exercise can switch between lb and kg during a workout by tapping the unit above its sets. Stats convert everything to your main unit.</p></div>
      <div class="row" style="align-items:flex-start">${field('goal', 'Workouts per week')}</div>
      <div class="row" style="align-items:flex-start">${field('inc', 'Weight jump (' + st.unit + ')')}${field('bar', 'Barbell (' + st.unit + ')')}</div>
      <p class="note">When you hit the top of an exercise's rep range on every set, the next workout adds its weight jump: this amount, or twice it on barbell deadlifts, unless you set one for that exercise.</p>
      <div class="row" style="align-items:flex-start">${restField('rest', 'Rest between sets (seconds)')}${restField('restSS', 'Superset rest (seconds)')}</div>
      ${tog('autoRest', 'Start the timer when a set is logged')}
      <p class="note">Now ${clock(+st.rest || 0)} after a single exercise and ${clock(+st.restSS || 0)} after a superset. 0 turns one off.</p>
    </div>
    <${AboutYouCard}/>
    <button class="opt" id="profile-more" onClick=${() => UI.setView({ type: 'advanced' })}><div style="flex:1"><div>More training settings</div><div class="d">Weight jump rules, timer sounds, personal records, streaks and rep ranges</div></div></button>
    <div class="section-h" style="margin-top:12px"><h2>Help</h2></div>
    <div class="card stack" style="gap:8px"><button class="btn wide" id="profile-tour" onClick=${() => startTour('full')}>Take the full tour</button><button class="btn wide" onClick=${() => openSheet({ type: 'feedback' })}>Send feedback</button></div>
    <div class="section-h"><h2>About</h2></div>
    <div class="card stack"><a class="btn" href="privacy.html">Privacy policy</a><a class="btn" href="support.html">Help and support</a><p class="note">Ironwood keeps everything on this phone. No accounts, ads or tracking.</p><p class="small faint" id="app-version">Version __APPVER__</p></div>
    ${typeof TIP_URL !== 'undefined' && TIP_URL && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? html`<div class="card stack tip-card-support" id="tip-card"><div style="font-weight:700">Enjoying Ironwood?</div><p class="note">It’s free, with no ads or accounts. If it helps your training, you can buy me a coffee, once or monthly.</p><a class="btn primary wide" id="tip-link" href=${TIP_URL} target="_blank" rel="noopener">☕ Buy me a coffee</a></div>` : null}
  </div>`;
}
function PRCard() {
  const P = prOpts(); const set = (k, v) => commit(x => { x.meta.settings.pr = { ...prOpts(), [k]: v }; }, 'meta', 800);
  const tog = (k, label, sub) => html`<label class="toggle-row" for=${'pr-' + k}><span><span>${label}</span><span class="d">${sub}</span></span><input type="checkbox" role="switch" id=${'pr-' + k} checked=${!!P[k]} onChange=${e => set(k, e.target.checked)}/></label>`;
  return html`<div class="card stack" style="gap:6px">
    <p class="note">New records show on the set as you log it and in your history. Estimated 1-rep max is charted in each exercise’s stats, not counted as a record.</p>
    ${tog('weight', 'Heaviest weight', 'Most weight lifted for at least one rep. For assisted moves, the least assistance.')}
    ${tog('reps', 'Rep PRs', 'More reps than ever at this weight or heavier. For bodyweight moves, most reps in a set.')}
    ${tog('setvol', 'Best single set', 'Most weight × reps in one set.')}
    ${tog('run', 'Times and distances', 'Fastest 100 m, mile and 3 miles from any run, fastest time at a distance, longest hold and heaviest carry.')}
    ${tog('sessvol', 'Session volume', 'Most total weight × reps for the exercise in one workout. Checked when you finish.')}
    ${tog('ranges', 'Count PRs inside each rep range', 'A set that isn’t an all-time best can still be the best for its range, like 8–12.')}
    ${tog('sound', 'PR sound', 'A quick double beep.')}
    <p class="note">The first time you do an exercise sets the baseline, so it can’t be a PR. Ties don’t count. Weights are compared in your main unit, whichever unit you logged in.</p>
  </div>`;
}
function DisplayCard() {
  const [msg, setMsg] = useState(''); const [addLang, setAddLang] = useState(false);
  const customs = (() => { try { return JSON.parse(lsGet('customLangs') || '[]'); } catch (e) { return []; } })();
  const onFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; const rd = new FileReader();
    rd.onload = () => { const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'My language'; const n = l10nImport(String(rd.result || ''), name);
      setMsg(n ? 'Loaded ' + n + ' phrases from “' + f.name + '”.' : 'No phrases found. The file needs two columns: English and your translation.'); };
    rd.readAsText(f); };
  const download = async () => { const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null; const csv = l10nCSV();
    if (dl) { try { await dl.save({ filename: 'ironwood-phrases.csv', data: csv }); setMsg('Saved ironwood-phrases.csv. Fill in the Translation column, then upload it.'); return; } catch (e) { if (e && e.code === 'declined') return; } }
    try { await navigator.clipboard.writeText(csv); setMsg('Copied the phrase list. Paste it into a spreadsheet, translate the second column, and upload it as CSV.'); } catch (e) { setMsg('Saving files isn’t available here.'); } };
  const sizes = [['90', 'Small'], ['100', 'Default'], ['115', 'Large'], ['130', 'Larger']];
  return html`<div class="card stack" style="gap:14px">
    <div><span class="lbl">Theme</span><div class="seg wide">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => html`<button key=${k} class=${DISP.theme === k ? 'on' : ''} aria-pressed=${DISP.theme === k} onClick=${() => setDisp('theme', k)}>${l}</button>`)}</div></div>
    <${PaletteChooser}/>
    <div><span class="lbl">Text size</span><div class="seg wide">${sizes.map(([k, l]) => html`<button key=${k} class=${DISP.size === k ? 'on' : ''} aria-pressed=${DISP.size === k} onClick=${() => setDisp('size', k)}>${l}</button>`)}</div>
      <p class="note" style="margin-top:6px">Follows your iPhone’s text size (Settings → Display & Brightness → Text Size). This makes it a little smaller or larger on top of that.</p></div>
    <label class="toggle-row" for="tg-hc"><span><span>High contrast</span><span class="d">Darker secondary text and stronger lines.</span></span><input type="checkbox" role="switch" id="tg-hc" checked=${DISP.hc} onChange=${e => setDisp('hc', e.target.checked)}/></label>
    <label class="toggle-row" for="tg-rm"><span><span>Reduce motion</span><span class="d">Turns off slides and fades.</span></span><input type="checkbox" role="switch" id="tg-rm" checked=${DISP.rm} onChange=${e => setDisp('rm', e.target.checked)}/></label>
    <div><label class="lbl" for="lang-sel">Language</label>
      <select class="field" id="lang-sel" translate=${false} value=${L10N.lang} onChange=${e => { const v = e.target.value; const c = customs.find(x => x[0] === v); setLang(v, c ? c[1] : ''); }}>
        ${LANGS.filter(([k]) => k === 'en' || k === L10N.lang || !(window.claude && window.claude.standalone)).map(([k, nat, en]) => html`<option key=${k} value=${k}>${nat}${k === 'en' ? '' : ' · ' + en}</option>`)}
        ${customs.map(([k, n]) => html`<option key=${k} value=${k}>${n} (your spreadsheet)</option>`)}
      </select>
      ${L10N.status ? html`<p class="small muted" role="status" style="margin-top:6px">${L10N.status}</p>` : null}
      <p class="note" style="margin-top:6px">${window.claude && window.claude.standalone ? 'Add a language by uploading a translated phrase list below. Your notes are never translated.' : 'Claude translates each phrase the first time it appears and saves it on this device; the first time, it asks your permission. Your notes are never translated.'}</p></div>
    ${!addLang ? html`<button class="btn text" id="lang-add-open" style="align-self:flex-start;padding:0" onClick=${() => setAddLang(true)}>Add a language from a spreadsheet</button>` : html`<div id="lang-add"><span class="lbl">Another language</span>
      <div class="row wrap"><label class="btn" for="lang-file">Upload a spreadsheet (CSV)</label><input id="lang-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden onChange=${onFile}/>
        <button class="btn" onClick=${download}>Get the phrase list</button></div>
      <p class="note" style="margin-top:6px">Two columns: English, then your translation. Get the phrase list, translate it in any spreadsheet, export it as CSV, and upload it. Numbers in phrases are written as {#}.</p></div>`}
      ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
  </div>`;
}
/* ---------- INTERVAL TIMER ---------- */
const TIMER_PRESETS = [
  { id: 'p-tabata', name: '20 on / 10 off', mode: 'intervals', prep: 10, work: 20, rest: 10, rounds: 8, sets: 1, setRest: 60, cool: 0 },
  { id: 'p-3030', name: '30 on / 30 off', mode: 'intervals', prep: 10, work: 30, rest: 30, rounds: 10, sets: 1, setRest: 60, cool: 0 },
  { id: 'p-4020', name: '40 on / 20 off, 2 sets', mode: 'intervals', prep: 10, work: 40, rest: 20, rounds: 8, sets: 2, setRest: 60, cool: 0 },
  { id: 'p-emom', name: 'EMOM 10 min', mode: 'emom', prep: 10, every: 60, rounds: 10 },
  { id: 'p-e2mom', name: 'Every 2 min × 6', mode: 'emom', prep: 10, every: 120, rounds: 6 },
  { id: 'p-amrap', name: 'AMRAP 12 min', mode: 'amrap', prep: 10, total: 720 },
  { id: 'p-sw', name: 'Stopwatch', mode: 'stopwatch' },
];
const TMODES = [['intervals', 'Intervals'], ['emom', 'EMOM'], ['amrap', 'AMRAP'], ['stopwatch', 'Stopwatch']];
const TDEF = { intervals: { prep: 10, work: 30, rest: 15, rounds: 8, sets: 1, setRest: 60, cool: 0 }, emom: { prep: 10, every: 60, rounds: 10 }, amrap: { prep: 10, total: 600 }, stopwatch: {} };
function timerSummary(c) {
  if (c.mode === 'intervals') return clock(c.work) + ' on · ' + clock(c.rest) + ' off · ' + c.rounds + ' rounds' + (c.sets > 1 ? ' × ' + c.sets + ' sets' : '');
  if (c.mode === 'emom') return 'Every ' + clock(c.every) + ' for ' + c.rounds + ' rounds';
  if (c.mode === 'amrap') return clock(c.total) + ' time cap, count your rounds';
  return 'Counts up, with laps';
}
function buildPhases(c) {
  const P = []; const add = (kind, label, secs, extra) => { if (secs > 0) P.push({ kind, label, secs, ...(extra || {}) }); };
  if (c.mode !== 'stopwatch') add('prep', 'Get ready', c.prep || 0);
  if (c.mode === 'intervals') {
    for (let st = 1; st <= c.sets; st++) { for (let r = 1; r <= c.rounds; r++) { add('work', 'Work', c.work, { round: r, set: st }); if (r < c.rounds) add('rest', 'Rest', c.rest, { round: r, set: st }); } if (st < c.sets) add('rest', 'Set rest', c.setRest, { set: st }); }
    add('cool', 'Cool down', c.cool || 0);
  }
  if (c.mode === 'emom') for (let r = 1; r <= c.rounds; r++) add('work', c.every === 60 ? 'Minute ' + r : 'Round ' + r, c.every, { round: r });
  if (c.mode === 'amrap') add('work', 'Go', c.total);
  return P;
}
function tElapsed(T) { const now = Date.now(); return (now - T.startedAt - T.pausedTotal - (T.pausedAt ? now - T.pausedAt : 0)) / 1000; }
function tLocate(T) { const el = tElapsed(T); let acc = 0; for (let i = 0; i < T.phases.length; i++) { const p = T.phases[i]; if (el < acc + p.secs) return { idx: i, phase: p, into: el - acc, left: acc + p.secs - el, el }; acc += p.secs; } return null; }
function startInterval(cfg) { if (typeof fRunning === 'function' && fRunning()) { showToast({ kind: 'info', text: 'End your rounds first, so two timers don’t beep at once.' }); return false; } const c = clone(cfg); const phases = buildPhases(c); S.itimer = { cfg: c, phases, total: phases.reduce((a, p) => a + p.secs, 0), startedAt: Date.now(), pausedAt: null, pausedTotal: 0, laps: [], rounds: 0, beeped: {}, done: false }; unlockAudio(); bgTimer(); lsSave(); S.rerender(); }
function tPause(T) { if (T.pausedAt) { T.pausedTotal += Date.now() - T.pausedAt; T.pausedAt = null; } else T.pausedAt = Date.now(); bgTimer(); S.rerender(); }
function tSkip(T) { const p = tLocate(T); if (!p) return; T.startedAt -= p.left * 1000; bgTimer(); S.rerender(); }
function tBack(T) { const p = tLocate(T); if (!p) return; const back = p.into > 2 || p.idx === 0 ? p.into : p.into + T.phases[p.idx - 1].secs; T.startedAt += back * 1000; T.beeped = {}; bgTimer(); S.rerender(); }
const clockT = x => clock(Math.floor(x)) + '.' + Math.floor((x % 1) * 10);
const stepFor = (v, step, dir) => step === 5 ? ((dir > 0 ? v >= 60 : v > 60) ? 15 : 5) : step;
function TimerScreen() {
  const [, tick] = useState(0); const [cfg, setCfg] = useState(null);
  useWake();
  useEffect(() => { const iv = setInterval(() => tick(x => x + 1), 200); return () => clearInterval(iv); }, []);
  const T = S.itimer;
  if (T) return html`<${TimerRun} T=${T}/>`;
  if (cfg) return html`<${TimerEdit} cfg=${cfg} setCfg=${setCfg}/>`;
  const saved = S.meta.timers || [];
  const row = c => html`<div key=${c.id} class="tm-row"><button class="tm-row-main" onClick=${() => setCfg(clone(c))}><div class="t">${c.name}</div><div class="s">${timerSummary(c)}</div></button><button class="pill-btn accent" onClick=${() => startInterval(c)}>Start</button></div>`;
  return html`<div>
    <p class="note" style="margin-top:6px">For HIIT, circuits and conditioning. Tap a timer to change it, or Start to run it as is.</p>
    ${saved.length ? html`<div class="section-h"><h2>Your timers</h2></div><div class="stack">${saved.map(row)}</div>` : null}
    <div class="section-h"><h2>Quick start</h2></div><div class="stack">${TIMER_PRESETS.map(row)}</div>
    <button class="btn primary wide" style="margin-top:16px" onClick=${() => setCfg({ id: null, name: '', mode: 'intervals', ...TDEF.intervals })}>${I.plus} Build a timer</button>
  </div>`;
}
function TimerEdit({ cfg, setCfg }) {
  const c = cfg; const set = (k, v) => setCfg({ ...c, [k]: v });
  const mine = !!(c.id && (S.meta.timers || []).some(t => t.id === c.id));
  const total = buildPhases(c).reduce((a, p) => a + p.secs, 0);
  const sec = (k, label, step, min, max) => html`<div class="tm-field"><span>${label}</span><span class="stepper"><button aria-label=${'Less ' + label} onClick=${() => set(k, Math.max(min, (c[k] || 0) - stepFor(c[k] || 0, step, -1)))}>−</button><b class="num">${clock(c[k] || 0)}</b><button aria-label=${'More ' + label} onClick=${() => set(k, Math.min(max, (c[k] || 0) + stepFor(c[k] || 0, step, 1)))}>+</button></span></div>`;
  const cnt = (k, label, min, max) => html`<div class="tm-field"><span>${label}</span><span class="stepper"><button aria-label=${'Fewer ' + label} onClick=${() => set(k, Math.max(min, (c[k] || 0) - 1))}>−</button><b class="num">${c[k] || 0}</b><button aria-label=${'More ' + label} onClick=${() => set(k, Math.min(max, (c[k] || 0) + 1))}>+</button></span></div>`;
  const save = () => { const t = { ...c, id: mine ? c.id : uid('tm'), name: (c.name || '').trim() || timerSummary(c) };
    commit(x => { const i = x.meta.timers.findIndex(y => y.id === t.id); if (i >= 0) x.meta.timers[i] = t; else x.meta.timers.push(t); }, 'meta', 600); setCfg(t); showToast({ kind: 'info', text: 'Timer saved' }); };
  return html`<div>
    <button class="btn text" style="padding-left:0" onClick=${() => setCfg(null)}>${I.back} All timers</button>
    <label class="lbl" for="tm-name">Name</label><input class="field" id="tm-name" value=${c.name || ''} placeholder="Leg circuit" onInput=${e => { c.name = e.target.value; }}/>
    <div class="seg wide" style="margin-top:14px">${TMODES.map(([k, l]) => html`<button key=${k} class=${c.mode === k ? 'on' : ''} onClick=${() => setCfg(c.mode === k ? c : { id: c.id, name: c.name, mode: k, ...TDEF[k] })}>${l}</button>`)}</div>
    <div class="card stack" style="margin-top:10px;gap:4px">
      ${c.mode === 'intervals' ? html`${sec('prep', 'Get ready', 5, 0, 600)}${sec('work', 'Work', 5, 5, 3600)}${sec('rest', 'Rest', 5, 0, 3600)}${cnt('rounds', 'Rounds', 1, 99)}${cnt('sets', 'Sets', 1, 20)}${c.sets > 1 ? sec('setRest', 'Rest between sets', 15, 0, 3600) : null}${sec('cool', 'Cool down', 15, 0, 3600)}` : null}
      ${c.mode === 'emom' ? html`${sec('prep', 'Get ready', 5, 0, 600)}${sec('every', 'Every', 15, 15, 3600)}${cnt('rounds', 'Rounds', 1, 99)}` : null}
      ${c.mode === 'amrap' ? html`${sec('prep', 'Get ready', 5, 0, 600)}${sec('total', 'Time cap', 30, 30, 7200)}` : null}
      ${c.mode === 'stopwatch' ? html`<p class="note">Counts up from zero. Tap Lap to record splits.</p>` : html`<div class="tm-field"><span class="muted">Total time</span><b class="num">${clock(total)}</b></div>`}
    </div>
    <div class="stack" style="margin-top:14px"><button class="btn primary wide" onClick=${() => startInterval(c)}>Start</button>
      <button class="btn wide" onClick=${save}>${mine ? 'Save changes' : 'Save timer'}</button>
      ${mine ? html`<button class="btn text danger wide" onClick=${() => { commit(x => { x.meta.timers = x.meta.timers.filter(y => y.id !== c.id); }, 'meta', 600); setCfg(null); }}>Delete timer</button>` : null}</div>
  </div>`;
}
function TimerRun({ T }) {
  const c = T.cfg; const stop = () => { S.itimer = null; bgStop(); lsSave(); S.rerender(); };
  if (c.mode === 'stopwatch') {
    const el = tElapsed(T);
    return html`<div><div class=${'tm-card stop' + (T.pausedAt ? ' paused' : '')} role="timer"><div class="tm-phase">${T.pausedAt ? 'Paused' : 'Stopwatch'}</div><div class="tm-big">${clockT(el)}</div><div class="tm-sub">${T.laps.length} lap${T.laps.length === 1 ? '' : 's'}</div></div>
      <div class="tm-ctl"><button class="btn" onClick=${() => { T.laps.push(el); S.rerender(); }}>Lap</button><button class="btn primary" onClick=${() => tPause(T)}>${T.pausedAt ? 'Resume' : 'Pause'}</button><button class="btn" onClick=${stop}>End</button></div>
      ${T.laps.length ? html`<div class="card" style="margin-top:12px">${T.laps.map((t, i) => html`<div key=${i} class="row small" style="min-height:36px"><span>Lap ${i + 1}</span><span class="spacer"></span><span class="num muted">+${clockT(t - (T.laps[i - 1] || 0))}</span><b class="num" style="min-width:64px;text-align:right">${clockT(t)}</b></div>`).reverse()}</div>` : null}</div>`;
  }
  const p = tLocate(T);
  if (!p) return html`<div><div class="tm-card done"><div class="tm-phase">Done</div><div class="tm-big">${clock(T.total)}</div><div class="tm-sub">${c.name || timerSummary(c)}${c.mode === 'amrap' ? ' · ' + T.rounds + ' rounds' : ''}</div></div>
    <div class="tm-ctl" style="grid-template-columns:1fr 1fr"><button class="btn primary" onClick=${() => startInterval(c)}>Run again</button><button class="btn" onClick=${stop}>Close</button></div></div>`;
  const ph = p.phase; const next = T.phases[p.idx + 1];
  const sub = c.mode === 'intervals' && ph.round ? 'Round ' + ph.round + ' of ' + c.rounds + (c.sets > 1 ? ' · set ' + ph.set + ' of ' + c.sets : '')
    : c.mode === 'intervals' && ph.set ? 'Set ' + ph.set + ' of ' + c.sets + ' done'
    : c.mode === 'emom' && ph.round ? 'Round ' + ph.round + ' of ' + c.rounds
    : c.mode === 'amrap' && ph.kind === 'work' ? T.rounds + ' rounds so far' : '';
  return html`<div>
    <div class=${'tm-card ' + ph.kind + (T.pausedAt ? ' paused' : '')} role="timer">
      <div class="tm-phase">${T.pausedAt ? 'Paused' : ph.label}</div>
      <div class="tm-big">${clock(Math.ceil(p.left - 1e-6))}</div>
      <div class="tm-sub">${sub}</div>
      <div class="bar" style="margin-top:14px"><div style=${{ width: (p.el / T.total * 100).toFixed(1) + '%' }}></div></div>
      <div class="row small" style="margin-top:8px"><span>${next ? 'Next: ' + next.label + ' ' + clock(next.secs) : 'Last one'}</span><span class="spacer"></span><span class="num">${clock(Math.ceil(T.total - p.el))} left</span></div>
    </div>
    ${c.mode === 'amrap' && ph.kind === 'work' ? html`<button class="btn wide" style="margin-top:12px;min-height:64px;font-size:calc(20 * var(--u))" onClick=${() => { T.rounds++; S.rerender(); }}>+1 round (${T.rounds})</button>` : null}
    <div class="tm-ctl"><button class="btn" onClick=${() => tBack(T)}>Back</button><button class="btn primary" onClick=${() => tPause(T)}>${T.pausedAt ? 'Resume' : 'Pause'}</button><button class="btn" onClick=${() => tSkip(T)}>Skip</button></div>
    <button class="btn text danger wide" style="margin-top:8px" onClick=${stop}>End timer</button>
  </div>`;
}

/* ---------- CHALLENGES ---------- */
function chLine(ch, st) {
  if (!st.started) return 'Starts ' + shortDate(+parseYmd(ch.start));
  if (st.finishedOn) return (ch.restart ? 'Finished ' : 'Ended ') + shortDate(+parseYmd(st.finishedOn)) + ' · ' + st.count + ' of ' + ch.days + ' days done';
  return 'Day ' + st.dayNum + ' of ' + ch.days + (ch.restart ? (st.attempt > 1 ? ' · attempt ' + st.attempt : '') : ' · ' + st.count + ' done' + (st.missed ? ', ' + st.missed + ' missed' : ''));
}
function chToggle(id, k, itemId) { commit(m => { const c = m.meta.challenges[id]; if (!c) return; c.log = c.log || {}; const e = c.log[k] = c.log[k] || {}; e.c = e.c || {}; if (e.c[itemId]) delete e.c[itemId]; else e.c[itemId] = 1; if (!Object.keys(e.c).length && !e.rest && !e.light) delete c.log[k]; }, 'meta', 900); }
function chRest(id, k, on) { commit(m => { const c = m.meta.challenges[id]; if (!c) return; c.log = c.log || {}; const e = c.log[k] = c.log[k] || {}; if (on) e.rest = 1; else { delete e.rest; if (!e.c || !Object.keys(e.c).length) delete c.log[k]; } }, 'meta', 900); }
function ChallengeChecklist({ ch, k }) {
  const e = (ch.log || {})[k] || {}; const wc = dayCounts()[k] || 0; const items = chItemsOn(ch, k);
  const mark = (S.meta.dayMarks || {})[k]; const used = restUsedInWeek(ch, k);
  return html`<div class="ch-list">
    ${items.map(it => { const manual = !!(e.c && e.c[it.id]); const auto = chAutoOn(ch, it, k, wc); const on = manual || auto;
      return html`<button key=${it.id} class=${'ch-item' + (on ? ' on' : '')} aria-pressed=${on} onClick=${() => { if (auto && !manual) return; chToggle(ch.id, k, it.id); }}>
        <i>${on ? I.check : null}</i><span class="nm">${it.name}</span>${auto ? html`<span class="d">from your log</span>` : it.auto ? html`<span class="d">${chAutoLabel(it)}</span>` : null}</button>`; })}
    <${LightDay} ch=${ch} k=${k}/>
    ${ch.restPerWeek > 0 ? (e.rest ? html`<button class="btn text" onClick=${() => chRest(ch.id, k, false)}>Rest day taken · Undo</button>`
      : used < ch.restPerWeek ? html`<button class="btn text" onClick=${() => chRest(ch.id, k, true)}>Use a rest day (${ch.restPerWeek - used} left this week)</button>`
      : html`<p class="small faint">No rest days left this week.</p>`) : null}
    ${mark && EXCUSED[mark] && S.meta.settings.excuse ? html`<p class="small muted">Marked ${DAY_MARKS[mark].toLowerCase()}, so this day is paused unless you finish it.</p>` : null}
  </div>`;
}
function ChallengeCard({ ch }) {
  const st = challengeState(ch); const k = ymd(new Date());
  return html`<div class="ch-card">
    <div class="row"><div style="min-width:0;flex:1"><h3>${ch.name}</h3><div class="small muted">${chLine(ch, st)}</div></div><button class="btn text" onClick=${() => UI.setView({ type: 'challenge', id: ch.id })}>Details</button></div>
    <div class="bar" role="progressbar" aria-label="Challenge progress" aria-valuemin="0" aria-valuemax=${ch.days} aria-valuenow=${st.count} aria-valuetext=${st.count + ' of ' + ch.days + ' days'}><div style=${{ width: Math.min(100, st.count / ch.days * 100) + '%' }}></div></div>
    ${st.started && !st.finishedOn ? html`<${ChallengeChecklist} ch=${ch} k=${k}/>` : null}
  </div>`;
}
function ChallengeView({ id }) {
  const ch = S.meta.challenges[id]; if (!ch) return html`<div class="empty"><h3>Challenge deleted</h3></div>`;
  const st = challengeState(ch); const today = ymd(new Date()); const todayD = parseYmd(today);
  const map = Object.fromEntries(st.days.map(d => [d.k, d.status]));
  const start = parseYmd(ch.start); const g0 = startOfWeek(start);
  const endD = st.projectedEnd > todayD ? st.projectedEnd : todayD;
  const weeks = Math.min(60, Math.round((+startOfWeek(endD) - +g0) / (7 * DAY)) + 1);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) { const d = addDays(g0, i); const k = ymd(d);
    const cls = d < start ? 'out' : d > todayD ? (d <= st.projectedEnd ? 'fut' : 'out') : (map[k] || 'out'); cells.push({ k, d, cls }); }
  return html`<div>
    <div class="eyebrow" style="margin-top:6px">Challenge</div><h2 class="wo-title" style="margin:2px 0 6px">${ch.name}</h2>
    <p class="muted">${chLine(ch, st)}</p>
    <div class="kpis" style="margin-top:12px">
      ${kpi(st.count, ch.restart ? 'Days this run' : 'Days done')}
      ${kpi(ch.restart ? st.best : st.missed, ch.restart ? 'Best run' : 'Missed')}
      ${kpi(ch.restart ? st.attempt : Math.max(0, ch.days - st.elapsed), ch.restart ? 'Attempt' : 'Days left')}
    </div>
    ${st.started && !st.finishedOn ? html`<div class="section-h"><h2>Today</h2></div><div class="card"><${ChallengeChecklist} ch=${ch} k=${today}/></div>` : null}
    <div class="section-h"><h2>Calendar</h2><span class="aside">Tap a day to fix it</span></div>
    <div class="card"><div class="ch-cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => html`<span key=${'h' + i} class="dl">${l}</span>`)}
      ${cells.map(c => html`<button key=${c.k} class=${'cc ' + c.cls + (c.k === today ? ' now' : '')} disabled=${c.cls === 'out' || c.cls === 'fut'} aria-label=${shortDate(+c.d) + ', ' + c.cls} onClick=${() => openSheet({ type: 'chday', id, k: c.k })}>${c.d.getDate() === 1 ? MON[c.d.getMonth()] : c.d.getDate()}</button>`)}</div>
      <div class="heat-legend"><span><i class="cc-done"></i>Done</span><span><i class="cc-rest"></i>Rest</span><span><i class="cc-paused"></i>Paused</span><span><i class="cc-missed"></i>Missed</span></div></div>
    <div class="section-h"><h2>Rules</h2></div>
    <div class="card note">${ch.items.map(it => it.name).join(' · ')} every day. ${ch.restart ? 'Missing a day starts it over at day 1.' : 'Missed days are counted, and it keeps going.'}${ch.restPerWeek ? ' ' + ch.restPerWeek + ' rest day' + (ch.restPerWeek > 1 ? 's' : '') + ' a week allowed.' : ''}</div>
    <div class="stack" style="margin-top:14px"><button class="btn wide" onClick=${() => UI.setView({ type: 'chEdit', draft: clone(ch) })}>${I.edit} Edit challenge</button>
      <button class="btn text danger wide" onClick=${() => openSheet({ type: 'confirm', title: 'Delete ' + ch.name + '?', body: 'Its checklist history is deleted too.', ok: 'Delete challenge', danger: true, onOk: () => { commit(m => { delete m.meta.challenges[id]; }, 'meta', 300); closeSheet(); UI.setView(null); } })}>Delete challenge</button></div>
  </div>`;
}
const CH_LENGTHS = [[21, '21 days'], [30, '30 days'], [42, '6 weeks'], [75, '75 days'], [90, '90 days'], [182, '6 months'], [365, '1 year']];
function ChallengeEditor({ view }) {
  const d = view.draft; const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const today = ymd(new Date()); const started = !view.isNew && d.start <= today;
  const save = () => { d.name = (d.name || '').trim() || 'Challenge'; d.days = Math.max(1, Math.min(1000, Math.round(num(d.days)) || 75));
    d.items = d.items.filter(i => (i.name || '').trim()).map(i => ({ ...i, name: i.name.trim() }));
    if (!d.items.length) { showToast({ kind: 'info', text: 'Add at least one checklist item' }); re(); return; }
    commit(m => { m.meta.challenges[d.id] = clone(d); }, 'meta', 300); UI.setView({ type: 'challenge', id: d.id }); };
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= d.items.length) return; [d.items[i], d.items[j]] = [d.items[j], d.items[i]]; re(); };
  return html`<div class="stack" style="gap:16px;margin-top:6px">
    <div><label class="lbl" for="ch-name">Name</label><input class="field" id="ch-name" value=${d.name} onInput=${e => { d.name = e.target.value; }}/></div>
    <div><span class="lbl">Length</span><div class="row wrap">${CH_LENGTHS.map(([n, l]) => html`<button key=${n} class=${'chip' + (+d.days === n ? ' on' : '')} onClick=${() => { d.days = n; re(); }}>${l}</button>`)}</div>
      <div class="row" style="margin-top:8px"><input class="field" id="ch-days" inputmode="numeric" style="max-width:110px" value=${d.days} aria-label="Length in days" onChange=${e => { d.days = Math.max(1, Math.round(num(e.target.value)) || d.days); re(); }}/><span class="muted small">days${+d.days >= 14 ? ', about ' + fmt(r1(d.days / 7)) + ' weeks' : ''}</span></div></div>
    <div><label class="lbl" for="ch-start">Start date</label><input class="field" id="ch-start" type="date" value=${d.start} onChange=${e => { if (e.target.value) { d.start = e.target.value; re(); } }}/></div>
    <div><span class="lbl">Daily checklist</span>
      <div class="stack">${d.items.map((it, i) => html`<div key=${it.id} class="ed-item">
        <div class="row"><input class="field" id=${'chi-' + it.id} value=${it.name} placeholder="e.g. Read 10 pages" aria-label="Checklist item" onInput=${e => { it.name = e.target.value; }}/>
          <button class="icon-btn" aria-label="Move up" onClick=${() => move(i, -1)}>${I.up}</button><button class="icon-btn" aria-label="Remove item" onClick=${() => { d.items.splice(i, 1); re(); }}>${I.x}</button></div>
        <div class="row small"><label class="muted" for=${'cha-' + it.id}>Ticks itself</label><select class="field mini-select" id=${'cha-' + it.id} value=${it.auto || ''} onChange=${e => { it.auto = e.target.value || null; re(); }}>
          <option value="">No, I tick it</option><option value="w1">When I log a workout</option><option value="w2">When I log a 2nd workout</option><option value="protein">When I hit my protein goal</option><option value="kcal">When I stay within my calories</option></select></div></div>`)}</div>
      <button class="btn ghost wide" style="margin-top:8px" onClick=${() => { const it = { id: uid('k'), name: '', auto: null }; if (started) it.since = today; d.items.push(it); re(); }}>${I.plus} Add item</button>
      ${started ? html`<p class="note" style="margin-top:6px">New items count from today, so past days stay complete.</p>` : null}</div>
    <label class="toggle-row" for="ch-restart"><span><span>Start over if I miss a day</span><span class="d">Back to day 1 the day after a miss.</span></span><input type="checkbox" role="switch" id="ch-restart" checked=${!!d.restart} onChange=${e => { d.restart = e.target.checked; re(); }}/></label>
    <div class="row"><span style="flex:1"><span>Rest days per week</span><span class="small muted" style="display:block">A rest day counts as complete.</span></span>
      <span class="stepper"><button aria-label="Fewer rest days" onClick=${() => { d.restPerWeek = Math.max(0, (d.restPerWeek || 0) - 1); re(); }}>−</button><b>${d.restPerWeek || 0}</b><button aria-label="More rest days" onClick=${() => { d.restPerWeek = Math.min(3, (d.restPerWeek || 0) + 1); re(); }}>+</button></span></div>
    <p class="note">Sick, injured and break days you mark on the week strip pause the challenge when that setting is on in Profile.</p>
    <div class="row"><button class="btn" style="flex:1" onClick=${() => UI.setView(view.isNew ? null : { type: 'challenge', id: d.id })}>Cancel</button><button class="btn primary" style="flex:2" onClick=${save}>${view.isNew ? 'Start challenge' : 'Save'}</button></div>
  </div>`;
}

/* ---------- PROGRESS PHOTOS (kept on this device only, never uploaded) ---------- */
const SET_POSES = [['front', 'Front relaxed'], ['side', 'Side relaxed, right'], ['sideL', 'Side relaxed, left'], ['back', 'Back relaxed'], ['abs', 'Abs & thighs'], ['fdb', 'Front double biceps'], ['bdb', 'Back double biceps']];
/* Handheld: mirror photos with the back camera, or an arm's-length selfie with the front camera. Drawn for the right hand; left hand is the mirror image. */
const HAND_POSES = [['mFront', 'Mirror, front'], ['mSide', 'Mirror, side'], ['mBack', 'Mirror, back'], ['mFlex', 'Mirror flex'], ['selfie', 'Arm’s-length selfie']];
const POSES = [...SET_POSES, ...HAND_POSES];
const HANDED = new Set(HAND_POSES.map(p => p[0]));
const POSE_CAM = { mFront: 'environment', mSide: 'environment', mBack: 'environment', mFlex: 'environment', selfie: 'user' };
const POSE_NAME = { ...Object.fromEntries(POSES), lat: 'Front lat spread', schest: 'Side chest' };
const POSE_TIPS = { front: 'Feet hip-width apart, arms a hand’s width from your sides, relaxed.', side: 'Turn so your right side faces the phone. Feet together, arms hanging, stand tall, don’t suck in.', sideL: 'Turn so your left side faces the phone. Feet together, arms hanging, stand tall, don’t suck in.',
  back: 'Face away. Same stance as the front photo.', abs: 'Hands behind your head, elbows out, abs braced.', fdb: 'Arms up, elbows level with your shoulders, flex.', bdb: 'Face away, arms up and flexed, spread your back.',
  mFront: 'Face the mirror. Phone at chest height, straight up and down, camera centered on your body.', mSide: 'Turn sideways to the mirror. Phone at chest height, held straight, stand tall.',
  mBack: 'Back to the mirror. Hold the phone over your shoulder and look at the screen, back straight.', mFlex: 'Face the mirror, phone at chest height, flex your free arm.',
  selfie: 'Arm straight out at chin height. Fit your head and shoulders in the outline.' };
/* Pose outlines are 3D-rendered silhouettes (MakeHuman bodies, man or woman) that cover the whole 3:4 frame, so the
   figure sits where the person should stand: set-up shots from belly-button height 6 ft away, mirror shots from the
   mirror. Each mirror pose was rendered for one hand; the other hand is its mirror image. The outline is drawn from the
   path, blurred, and only the edge is kept, plus a faint fill. Rendered once per pose and cached. */
const POSE_PATH = {"male":{"front":"M298.8 983.5L297.7 981.1L295.2 983.0C292.6 985.1 290.0 984.3 290.0 981.4C290.0 980.6 289.2 980.0 288.2 980.0C287.2 980.0 285.4 978.9 284.2 977.5C283.0 976.1 281.6 975.0 281.0 975.0C280.5 975.0 280.0 974.2 280.0 973.1C280.0 972.1 279.1 971.0 278.0 970.7C273.6 969.6 277.6 957.3 287.8 940.4C291.7 933.8 296.6 924.0 298.7 918.5L302.5 908.5L302.4 891.0C302.4 875.0 302.0 871.2 297.7 846.0C289.6 798.0 288.8 774.3 294.5 747.0C297.9 730.7 301.8 698.5 301.4 690.7C301.3 687.3 300.2 680.7 299.1 676.0C295.1 658.9 293.3 627.8 295.0 605.0C296.1 591.2 298.3 578.5 303.0 560.5C304.1 556.1 305.7 546.0 306.6 538.0C307.4 530.0 308.8 520.6 309.6 517.0C310.5 513.4 311.6 505.1 312.1 498.6C312.5 492.1 313.9 481.9 315.1 476.1C316.9 467.4 317.2 463.4 316.7 453.9C316.0 439.6 314.8 434.7 309.4 424.5C307.1 420.1 304.4 414.3 303.5 411.7C301.3 405.8 301.4 405.6 296.0 424.0C293.7 432.0 290.8 441.9 289.5 446.0C287.2 453.4 286.1 459.9 284.0 479.5C282.4 493.7 279.7 506.2 274.4 523.4C264.6 555.8 262.0 569.8 264.3 578.1C265.2 581.1 266.3 588.7 266.9 595.0C267.8 604.7 268.5 607.5 271.5 613.8C276.8 625.0 276.2 628.2 269.0 628.6C266.0 628.7 265.1 628.2 263.2 625.6C260.3 621.6 260.4 623.7 263.6 633.3C265.4 638.8 266.0 641.9 265.4 643.8C265.0 645.3 264.8 648.4 264.9 650.7C265.2 655.2 262.3 658.3 259.7 656.1C258.5 655.1 254.6 647.8 251.5 640.5C248.7 634.2 246.1 610.4 246.0 591.7C245.9 584.1 246.1 577.6 246.3 577.2C247.0 576.1 248.0 546.9 249.0 501.0C249.9 458.4 251.2 442.8 256.1 413.2C259.1 394.8 259.4 386.8 257.6 376.6C252.7 349.0 260.3 333.2 282.7 324.6C291.2 321.4 316.4 315.2 330.5 313.0C341.3 311.3 345.3 308.5 349.1 300.0C351.7 294.3 351.8 281.5 349.4 272.6C347.4 265.3 346.5 264.1 344.0 264.7C341.6 265.3 340.5 263.2 339.1 254.5C337.7 246.0 338.7 241.8 341.9 242.7C343.8 243.2 344.0 242.8 344.0 237.7C344.0 229.4 345.9 217.4 348.2 211.1C354.8 193.1 378.5 187.1 393.7 199.6C401.1 205.7 404.1 214.1 405.8 233.5C406.4 241.3 406.7 242.5 408.3 242.5C411.6 242.5 412.3 245.6 411.1 253.7C409.8 262.7 408.5 265.4 406.0 264.7C403.5 264.0 402.6 265.3 400.6 272.7C398.2 281.5 398.3 294.3 400.9 300.0C404.7 308.7 408.5 311.2 419.6 313.0C423.4 313.6 429.2 314.7 432.5 315.5C435.8 316.3 442.8 317.9 448.0 319.0C487.2 327.6 498.0 341.9 492.4 377.4C490.6 388.8 490.8 393.2 494.5 417.5C499.5 450.5 500.1 458.7 501.0 500.5C501.5 523.0 502.4 554.8 503.1 571.0C504.3 600.4 504.1 605.0 501.2 629.5C500.1 637.8 492.0 657.0 489.4 657.0C486.5 657.0 484.9 654.6 485.0 650.2C485.1 647.6 484.9 644.3 484.5 642.9C484.1 641.2 484.7 637.7 486.4 632.8C489.6 623.7 489.7 621.6 486.8 625.6C485.0 628.2 484.0 628.7 481.0 628.5C478.9 628.4 476.8 628.0 476.1 627.6C474.1 626.3 474.9 621.3 478.5 613.8C481.5 607.5 482.2 604.7 483.1 595.0C483.6 588.7 484.8 581.2 485.7 578.3C488.1 570.5 485.3 555.6 475.5 523.5C470.3 506.6 467.6 493.9 466.0 480.0C463.6 458.2 462.7 453.1 460.0 444.5C458.5 439.6 455.5 429.6 453.5 422.5C448.7 406.1 448.6 405.7 447.0 410.6C446.3 412.7 443.6 418.8 441.0 424.0C434.4 437.1 434.0 438.6 433.4 453.4C432.9 464.5 433.1 468.1 434.9 476.9C436.1 482.7 437.5 492.6 438.0 498.9C438.4 505.3 439.5 513.4 440.4 517.0C441.2 520.6 442.6 530.0 443.4 538.0C444.2 546.0 446.0 557.0 447.4 562.5C455.1 593.0 456.7 609.3 455.0 641.0C453.9 662.4 453.6 664.7 450.2 679.6C447.4 692.2 449.0 713.0 455.2 745.0C458.5 762.0 460.1 783.9 458.9 795.5C458.5 799.4 457.9 806.1 457.5 810.5C457.1 814.9 455.7 825.0 454.3 833.0C452.9 841.0 451.6 848.9 451.3 850.5C451.1 852.1 450.2 857.1 449.3 861.5C448.5 866.0 447.6 877.4 447.3 887.5L446.9 905.5L450.8 916.7C453.5 924.3 457.4 932.4 462.9 941.5C467.4 949.0 471.0 955.6 471.0 956.3C471.0 957.0 471.7 959.3 472.5 961.5C474.5 967.2 474.4 970.1 472.0 970.7C470.9 971.0 470.0 972.1 470.0 973.1C470.0 974.2 469.2 975.4 468.2 975.7C467.3 976.1 465.9 977.2 465.1 978.3C464.3 979.4 463.0 980.0 461.9 979.7C460.6 979.3 460.0 979.7 460.0 981.0C460.0 984.4 457.2 985.5 454.6 983.1L452.3 981.0L451.2 983.5C448.7 989.0 438.0 983.8 438.0 977.1C438.0 975.8 436.4 972.7 434.4 970.3C430.0 965.0 429.3 962.2 429.1 949.5C428.9 938.8 428.0 936.2 423.2 931.6C421.3 929.8 419.8 927.2 419.3 924.6C418.2 918.8 418.3 918.2 419.8 911.5C420.6 908.2 421.5 903.0 422.0 900.0C422.4 897.0 423.3 892.9 423.9 891.0C426.8 882.0 424.2 854.8 418.1 828.5C412.3 804.0 411.6 797.7 412.6 778.0C414.3 740.8 414.1 738.4 406.1 717.6C403.7 711.7 400.4 700.2 398.5 692.1C396.7 684.1 393.4 671.2 391.2 663.4C386.4 646.5 383.7 630.6 381.5 606.5C379.2 581.4 379.2 581.5 375.0 581.5C370.8 581.5 371.0 581.0 368.5 608.0C366.4 631.4 364.1 643.9 357.9 666.7C355.1 676.8 351.8 690.0 350.5 696.2C349.2 702.6 346.0 712.9 343.2 720.0C336.3 737.2 335.3 744.0 336.8 762.7C339.0 790.2 338.7 794.2 331.6 830.2C323.8 869.1 322.6 882.0 325.9 891.4C327.1 894.7 328.0 898.8 328.0 900.6C328.0 902.4 328.5 905.1 329.1 906.7C332.8 916.5 331.8 926.2 326.5 932.2C321.5 937.7 321.2 938.6 320.9 950.5C320.6 963.3 320.2 964.7 315.5 970.4C313.6 972.8 312.0 975.8 312.0 977.2C312.0 983.7 301.3 988.9 298.8 983.5Z","side":"M427.0 983.7C425.1 983.2 419.3 983.0 414.1 983.4C406.9 983.8 404.1 983.6 402.1 982.5C396.9 979.6 371.8 971.7 364.0 970.5C352.2 968.7 343.6 963.9 340.5 957.3C338.0 952.0 338.9 941.0 342.8 929.2C345.7 920.7 345.8 919.7 344.5 917.6C341.9 913.7 341.6 906.5 343.5 897.8C345.7 888.2 344.8 876.0 340.5 859.0C333.9 832.6 331.2 816.8 330.9 803.0C330.5 788.2 331.4 776.5 333.6 768.0C334.3 764.9 335.4 757.9 336.0 752.5C337.1 741.8 342.5 718.4 346.7 705.8C349.2 698.3 349.3 698.0 348.3 682.3C347.7 673.6 347.5 656.4 347.9 644.0C349.1 599.8 348.4 593.5 339.9 567.0C336.3 555.9 335.8 553.4 335.8 544.9C335.9 532.8 336.7 529.7 344.7 512.5C354.8 490.9 355.0 487.2 347.6 455.0C342.7 433.6 341.3 424.9 340.0 407.5C339.4 399.2 338.4 387.6 337.8 381.5C337.1 375.4 336.5 366.0 336.5 360.5C336.5 351.0 336.7 349.9 341.3 338.0C348.6 318.8 351.5 314.3 360.5 308.0C364.2 305.5 364.7 304.5 365.9 298.8C367.8 289.1 367.5 278.5 365.2 274.1C364.1 272.1 361.3 266.9 359.0 262.6C354.9 255.1 354.6 254.0 354.2 245.0C353.5 229.9 358.2 217.7 367.6 210.3C378.3 201.9 401.1 200.6 416.7 207.5C423.4 210.5 432.7 219.7 436.0 226.5C438.5 231.9 439.3 243.0 437.7 250.0C436.9 253.2 437.3 254.2 440.9 259.7C445.4 266.4 446.2 270.5 443.0 271.5C440.7 272.2 440.5 273.3 442.1 276.2C442.9 277.6 442.9 278.5 442.1 279.3C441.5 279.9 441.0 281.6 441.0 283.1C441.0 284.6 440.3 286.3 439.5 287.0C438.7 287.7 438.0 289.9 438.0 291.9C438.0 297.0 434.9 299.7 427.4 301.1C416.3 303.2 413.6 304.3 412.8 307.0C408.4 321.9 408.6 320.3 410.9 327.1C412.0 330.5 415.3 336.5 418.2 340.4C429.7 356.1 436.1 374.8 436.3 393.5C436.4 401.7 436.0 404.5 434.2 408.8C432.3 413.3 432.0 416.0 432.0 426.8C432.0 433.8 431.3 446.8 430.5 455.6C429.4 467.8 429.3 473.6 430.1 479.1C433.1 500.7 432.0 516.9 425.8 542.0C423.8 549.9 423.7 553.2 423.8 586.1C423.8 607.0 424.2 622.6 424.8 623.6C425.3 624.7 426.1 628.6 426.5 632.3C427.2 639.0 427.1 639.2 424.9 638.8C422.7 638.5 422.5 639.0 421.3 645.9C419.4 657.6 414.3 674.0 408.8 686.8C405.0 695.6 403.2 701.7 401.4 711.5C400.0 718.6 397.2 729.6 395.1 736.0C389.1 753.7 386.0 771.8 384.9 795.9C384.4 807.2 383.3 825.8 382.5 837.3C380.3 866.7 380.3 869.6 382.9 875.7C385.7 882.1 387.6 883.8 397.6 888.9C404.0 892.2 406.7 893.0 410.9 893.0C413.8 893.0 417.6 893.6 419.3 894.4C421.1 895.2 425.8 896.9 429.8 898.0C433.7 899.2 437.3 900.6 437.6 901.2C437.9 901.7 439.3 902.5 440.6 903.0C441.9 903.5 443.0 904.7 443.0 905.6C443.0 906.6 443.7 908.1 444.6 909.1C446.0 910.7 445.9 911.1 443.3 913.9C440.5 917.1 440.1 917.2 430.8 917.0C428.8 917.0 425.4 917.7 423.3 918.6C418.6 920.6 414.0 920.6 409.8 918.4C400.1 913.4 389.0 911.9 384.0 915.0C381.9 916.3 385.6 923.5 391.6 929.6C397.4 935.6 417.3 946.2 425.0 947.5C427.5 947.9 430.9 949.0 432.5 950.0C434.1 951.0 439.1 953.7 443.5 956.0C453.6 961.3 455.2 962.7 454.3 965.4C454.0 966.6 453.7 968.5 453.8 969.7C453.9 971.2 453.0 972.6 451.2 973.7C449.7 974.7 448.3 975.7 448.0 976.1C446.9 977.5 442.9 979.1 442.0 978.5C441.4 978.2 441.0 978.4 441.0 978.9C441.0 979.8 435.4 982.9 431.0 984.5C430.7 984.6 428.9 984.3 427.0 983.7Z","back":"M310.8 954.0C306.0 951.4 304.7 949.5 296.2 932.5C295.4 930.9 293.4 928.0 291.7 926.3C286.6 920.8 286.5 906.9 291.5 905.0C292.9 904.5 294.0 903.6 294.0 903.0C294.0 902.5 295.1 902.0 296.5 902.0C298.3 902.0 299.0 901.5 299.0 900.0C299.0 898.9 299.7 898.0 300.6 898.0C301.8 898.0 302.0 897.2 301.5 893.2C299.7 880.4 294.5 851.4 292.4 842.5C284.6 810.5 284.5 783.9 292.1 752.2C299.5 721.2 302.5 684.5 299.4 663.9C297.9 654.0 297.5 646.1 297.5 624.5C297.6 593.9 298.7 583.9 304.5 562.6C306.7 554.7 308.6 544.4 309.5 536.1C310.3 528.6 311.9 516.9 313.0 510.0C314.0 503.1 315.2 494.7 315.5 491.2C315.8 487.8 317.2 479.7 318.5 473.2C322.4 454.7 320.9 446.8 309.6 424.2C306.6 418.2 303.4 410.7 302.4 407.4L300.6 401.5L299.9 405.5C299.0 411.0 294.5 432.3 291.5 445.5C290.1 451.6 288.1 464.8 287.0 475.0C284.7 495.6 282.7 505.3 276.9 524.7C271.8 541.7 268.0 559.9 268.0 567.6C268.0 572.6 268.7 575.4 271.6 581.6C277.6 594.9 279.3 598.3 282.8 603.9C287.0 610.7 286.8 613.5 282.0 613.5C278.9 613.5 278.1 612.9 274.2 607.2C269.0 599.8 267.7 600.1 266.0 608.9C264.6 616.3 264.7 622.4 266.5 627.9C270.9 642.0 271.2 644.7 268.5 646.6C267.7 647.2 267.0 648.6 267.0 649.7C267.0 652.1 264.5 654.5 263.0 653.5C262.5 653.2 262.0 652.2 262.0 651.4C262.0 650.6 261.5 650.0 261.0 650.0C259.1 650.0 253.2 631.2 251.9 621.0C250.0 607.0 252.1 472.3 254.4 455.0C258.1 427.6 259.4 391.6 257.6 368.3C256.8 357.9 256.9 356.6 259.0 350.8C263.2 339.2 270.6 332.9 289.5 325.0C302.1 319.6 309.7 317.5 325.6 314.9C341.5 312.4 345.1 310.9 348.4 305.9C352.1 300.3 352.5 297.0 350.5 288.4C348.8 281.0 348.3 280.2 344.7 277.7C343.5 276.8 342.4 273.7 341.3 267.4C339.5 257.4 339.9 254.5 342.9 255.5C344.6 256.0 344.8 255.2 345.4 245.5C347.0 221.6 353.0 212.4 368.4 209.8C384.7 207.1 397.6 213.8 401.8 227.0C403.1 231.1 405.0 245.7 405.0 251.7C405.0 255.5 405.2 256.0 407.2 255.7C409.4 255.5 409.5 255.8 409.3 261.5C409.0 270.9 407.2 277.0 404.4 278.2C401.7 279.5 399.2 286.1 398.4 294.5C397.9 298.5 398.3 300.4 400.2 304.0C403.5 310.3 408.0 312.3 424.4 314.9C440.3 317.4 454.8 321.9 468.6 328.6C487.4 337.7 493.9 348.3 492.6 367.5C492.3 372.7 491.7 381.3 491.4 386.5C490.5 400.1 493.3 442.7 496.6 464.0C497.2 467.6 497.6 485.8 498.5 552.0C499.3 604.4 499.2 613.5 498.1 621.5C496.9 630.1 491.4 648.1 489.4 649.6C488.6 650.2 488.0 651.2 488.0 651.8C488.0 653.6 486.0 654.2 484.5 653.0C483.7 652.3 483.0 650.8 483.0 649.7C483.0 648.6 482.3 647.2 481.5 646.6C478.8 644.7 479.1 642.0 483.5 627.9C485.3 622.3 485.4 614.6 483.9 608.2C481.9 600.1 480.9 600.0 475.8 607.2C471.9 612.9 471.1 613.5 468.0 613.5C462.9 613.5 463.1 610.9 468.9 601.2C471.6 596.6 474.4 591.2 475.1 589.2C475.7 587.2 477.6 582.9 479.1 579.8C484.2 569.6 482.5 556.1 471.7 520.0C466.3 502.1 464.9 493.9 461.0 458.5C460.6 454.1 459.7 449.3 459.1 447.8C458.6 446.3 457.2 440.3 456.0 434.3C454.8 428.4 452.9 418.6 451.6 412.5L449.3 401.5L447.6 407.4C446.6 410.7 443.1 418.8 439.8 425.4C428.9 447.2 427.6 454.5 431.5 473.4C432.9 480.0 434.3 488.5 434.6 492.4C434.9 496.3 436.0 504.0 437.0 509.5C438.0 515.0 439.4 525.4 440.0 532.5C440.8 540.5 442.7 551.2 445.0 560.5C449.7 579.3 450.8 585.2 452.0 596.5C453.3 609.7 452.4 652.5 450.6 664.5C447.5 684.3 450.2 717.8 457.4 749.7C465.5 785.5 465.6 810.5 458.0 841.9C455.5 852.2 449.0 890.5 449.0 894.9C449.0 896.6 449.4 898.0 450.0 898.0C450.6 898.0 451.0 898.9 451.0 900.0C451.0 901.5 451.7 902.0 453.5 902.0C454.9 902.0 456.0 902.5 456.0 903.0C456.0 903.6 457.1 904.5 458.5 905.0C463.3 906.8 463.4 920.8 458.7 925.8C456.0 928.6 454.3 931.5 449.3 941.5C445.5 949.1 443.2 951.9 439.0 954.0C431.8 957.7 424.3 955.6 421.9 949.3C420.5 945.7 422.8 912.0 425.1 902.8C428.6 888.7 427.5 877.7 418.6 835.8C413.4 811.4 412.9 802.5 415.1 775.9C416.7 757.0 415.6 749.2 408.1 727.0C404.8 717.4 401.4 706.1 400.5 702.0C398.0 690.5 394.4 675.9 390.5 661.6C386.2 645.4 383.6 629.5 381.0 602.0C379.8 590.2 378.5 580.1 378.1 579.7C377.6 579.2 376.0 579.0 374.4 579.2C370.9 579.6 370.9 579.9 368.5 606.0C366.2 632.1 363.7 646.1 357.5 669.2C354.4 680.3 351.5 692.4 350.9 696.0C350.3 699.6 346.7 712.0 342.9 723.7C334.0 751.0 333.3 755.6 335.0 777.4C336.8 802.0 336.0 815.9 331.5 836.0C322.9 874.6 321.5 888.7 324.9 903.2C327.3 913.2 329.5 945.6 328.1 949.2C325.7 955.6 317.9 957.7 310.8 954.0Z","abs":"M298.8 983.5L297.7 981.1L295.2 983.0C292.6 985.1 290.0 984.3 290.0 981.4C290.0 980.6 289.2 980.0 288.2 980.0C287.2 980.0 285.4 978.9 284.2 977.5C283.0 976.1 281.6 975.0 281.0 975.0C280.5 975.0 280.0 974.2 280.0 973.1C280.0 972.1 279.1 971.0 278.0 970.7C273.6 969.6 277.6 957.3 287.8 940.4C291.7 933.8 296.6 924.0 298.7 918.5L302.5 908.5L302.4 891.0C302.4 875.0 302.0 871.2 297.7 846.0C289.6 798.0 288.8 774.3 294.5 747.0C297.9 730.7 301.8 698.5 301.4 690.7C301.3 687.3 300.2 680.7 299.1 676.0C295.1 658.9 293.3 627.8 295.0 605.0C296.1 591.2 298.3 578.5 303.0 560.5C304.1 556.1 305.7 546.0 306.6 538.0C307.4 530.0 308.8 520.6 309.6 517.0C310.5 513.4 311.6 505.1 312.1 498.6C312.5 492.1 313.9 481.9 315.1 476.1C316.9 467.2 317.2 463.6 316.6 453.5C315.6 433.5 313.4 428.4 298.5 412.0C289.4 402.0 278.6 385.9 275.2 377.5C272.0 369.3 268.3 362.4 264.0 356.5C260.1 351.3 257.4 344.7 257.9 341.8C258.0 340.8 256.5 336.0 254.6 331.1C252.6 326.3 251.0 321.8 251.0 321.1C251.0 320.5 247.9 313.3 244.0 305.0C233.1 281.5 231.0 273.4 233.2 264.5C234.3 260.2 235.7 258.4 242.8 251.5C247.4 247.1 252.4 243.2 253.8 242.8C261.7 240.6 282.5 239.7 299.2 240.9C308.7 241.5 317.9 242.0 319.5 242.0L322.5 241.9L319.2 239.1C314.3 234.9 315.7 229.4 321.6 230.3C323.4 230.6 326.2 230.4 327.8 229.8C330.3 228.8 331.5 229.1 337.0 231.8C343.9 235.3 345.0 235.6 343.2 233.8C341.6 232.2 341.7 229.5 343.4 228.1C344.1 227.5 345.0 224.7 345.4 221.9C347.8 204.0 359.1 193.0 375.0 193.0C390.5 193.0 401.2 203.0 404.2 220.2C404.8 223.7 405.9 227.2 406.6 228.1C408.3 230.0 408.4 232.2 406.8 233.9C405.2 235.6 406.1 235.2 413.3 231.5C418.3 228.9 419.4 228.7 422.1 229.7C423.7 230.3 426.6 230.6 428.4 230.3C434.3 229.4 435.7 234.8 430.8 239.2L427.5 242.1L441.5 241.3C460.1 240.2 484.0 240.5 491.8 241.8C497.7 242.8 498.6 243.4 506.5 250.7C513.8 257.4 515.2 259.2 516.5 263.9C519.2 272.8 515.5 286.2 504.2 308.7C502.5 311.9 499.8 318.6 498.2 323.5C496.5 328.5 494.4 334.5 493.6 337.0C492.7 339.5 491.8 343.2 491.5 345.2C491.2 347.3 488.8 352.2 486.1 356.2C478.5 367.9 478.1 368.6 475.4 376.2C472.1 385.2 461.9 400.4 451.0 412.5C436.7 428.4 434.2 434.2 433.4 453.7C432.9 464.5 433.1 468.1 434.9 476.9C436.1 482.7 437.5 492.6 438.0 498.9C438.4 505.3 439.5 513.4 440.4 517.0C441.2 520.6 442.6 530.0 443.4 538.0C444.2 546.0 446.0 557.0 447.4 562.5C455.1 593.0 456.7 609.3 455.0 641.0C453.9 662.4 453.6 664.7 450.2 679.6C447.4 692.2 449.0 713.0 455.2 745.0C458.5 762.0 460.1 783.9 458.9 795.5C458.5 799.4 457.9 806.1 457.5 810.5C457.1 814.9 455.7 825.0 454.3 833.0C452.9 841.0 451.6 848.9 451.3 850.5C451.1 852.1 450.2 857.1 449.3 861.5C448.5 866.0 447.6 877.4 447.3 887.5L446.9 905.5L450.8 916.7C453.5 924.3 457.4 932.4 462.9 941.5C467.4 949.0 471.0 955.6 471.0 956.3C471.0 957.0 471.7 959.3 472.5 961.5C474.5 967.2 474.4 970.1 472.0 970.7C470.9 971.0 470.0 972.1 470.0 973.1C470.0 974.2 469.2 975.4 468.2 975.7C467.3 976.1 465.9 977.2 465.1 978.3C464.3 979.4 463.0 980.0 461.9 979.7C460.6 979.3 460.0 979.7 460.0 981.0C460.0 984.4 457.2 985.5 454.6 983.1L452.3 981.0L451.2 983.5C448.7 989.0 438.0 983.8 438.0 977.1C438.0 975.8 436.4 972.7 434.4 970.3C430.0 965.0 429.3 962.2 429.1 949.5C428.9 938.8 428.0 936.2 423.2 931.6C421.3 929.8 419.8 927.2 419.3 924.6C418.2 918.8 418.3 918.2 419.8 911.5C420.6 908.2 421.5 903.0 422.0 900.0C422.4 897.0 423.3 892.9 423.9 891.0C426.8 882.0 424.2 854.8 418.1 828.5C412.3 804.0 411.6 797.7 412.6 778.0C414.3 740.8 414.1 738.4 406.1 717.6C403.7 711.7 400.4 700.2 398.5 692.1C396.7 684.1 393.4 671.2 391.2 663.4C386.4 646.5 383.7 630.6 381.5 606.5C379.2 581.4 379.2 581.5 375.0 581.5C370.8 581.5 371.0 581.0 368.5 608.0C366.4 631.4 364.1 643.9 357.9 666.7C355.1 676.8 351.8 690.0 350.5 696.2C349.2 702.6 346.0 712.9 343.2 720.0C336.3 737.2 335.3 744.0 336.8 762.7C339.0 790.2 338.7 794.2 331.6 830.2C323.8 869.1 322.6 882.0 325.9 891.4C327.1 894.7 328.0 898.8 328.0 900.6C328.0 902.4 328.5 905.1 329.1 906.7C332.8 916.5 331.8 926.2 326.5 932.2C321.5 937.7 321.2 938.6 320.9 950.5C320.6 963.3 320.2 964.7 315.5 970.4C313.6 972.8 312.0 975.8 312.0 977.2C312.0 983.7 301.3 988.9 298.8 983.5ZM310.6 342.5C311.8 341.7 314.8 339.3 317.4 337.1C320.0 334.9 324.1 331.7 326.6 330.0C333.0 325.6 343.5 312.8 347.6 304.5C350.9 297.8 351.1 296.7 351.1 288.1C351.1 279.3 348.9 268.1 346.8 265.3C346.3 264.7 345.2 264.4 344.3 264.7C343.3 265.1 342.1 264.4 341.0 263.0L339.2 260.7L331.4 262.3C327.0 263.2 317.9 265.1 311.0 266.4C290.4 270.6 267.0 276.3 267.0 277.2C267.0 277.6 268.5 279.0 270.4 280.2C274.2 282.7 274.2 282.7 281.8 296.0C284.8 301.2 289.8 309.7 292.9 314.9C298.3 324.1 298.5 324.6 298.8 332.4C299.2 345.1 299.3 345.3 304.3 344.5C306.6 344.1 309.4 343.2 310.6 342.5ZM450.4 343.4C450.7 342.5 451.0 338.2 451.0 333.7L451.0 325.5L457.2 314.8C460.7 308.9 466.3 299.2 469.8 293.3C474.1 285.9 477.1 281.8 479.5 280.2C481.4 279.0 483.0 277.6 483.0 277.2C483.0 276.2 456.0 269.8 429.1 264.4L410.8 260.6L409.0 263.0C407.9 264.4 406.7 265.1 405.7 264.7C404.8 264.4 403.7 264.7 403.2 265.3C401.1 268.0 398.9 279.5 398.8 287.9C398.8 296.1 399.0 297.3 402.3 304.1C406.8 313.5 416.0 324.4 425.3 331.4C429.3 334.4 434.2 338.3 436.3 340.1C441.6 344.5 449.3 346.3 450.4 343.4Z","fdb":"M298.8 983.5L297.7 981.1L295.2 983.0C292.6 985.1 290.0 984.3 290.0 981.4C290.0 980.6 289.2 980.0 288.2 980.0C287.2 980.0 285.4 978.9 284.2 977.5C283.0 976.1 281.6 975.0 281.0 975.0C280.5 975.0 280.0 974.2 280.0 973.1C280.0 972.1 279.1 971.0 278.0 970.7C273.6 969.6 277.6 957.3 287.8 940.4C291.7 933.8 296.6 924.0 298.7 918.5L302.5 908.5L302.4 891.0C302.4 875.0 302.0 871.2 297.7 846.0C289.6 798.0 288.8 774.3 294.5 747.0C297.9 730.7 301.8 698.5 301.4 690.7C301.3 687.3 300.2 680.7 299.1 676.0C295.1 658.9 293.3 627.8 295.0 605.0C296.1 591.2 298.3 578.5 303.0 560.5C304.1 556.1 305.7 546.0 306.6 538.0C307.4 530.0 308.8 520.6 309.6 517.0C310.5 513.4 311.6 505.1 312.1 498.6C312.5 492.1 313.9 481.9 315.1 476.1C318.5 459.2 316.7 436.7 311.2 427.8C308.7 423.8 301.6 416.9 297.4 414.3C292.6 411.4 280.0 400.7 280.0 399.5C280.0 398.9 278.1 396.6 275.8 394.3L271.5 390.1L246.0 391.6C189.2 394.8 192.9 394.4 186.4 397.6C172.1 404.6 157.3 398.9 148.5 382.8C146.0 378.4 145.5 376.4 145.6 371.0C145.7 363.1 147.4 359.5 154.1 353.1C156.8 350.5 159.0 348.2 159.0 347.8C159.0 345.8 171.7 325.5 179.8 314.5C185.1 307.4 196.9 291.4 206.1 279.0L222.8 256.5L221.9 251.1C217.9 225.5 246.2 205.4 262.9 222.1C275.6 234.8 271.1 261.1 254.8 269.6C253.1 270.5 252.0 271.9 252.0 273.1C252.0 274.3 247.5 285.4 241.9 297.8C236.4 310.3 231.6 321.1 231.3 321.7C231.0 322.4 231.6 323.3 232.6 323.7C233.7 324.1 238.0 326.8 242.2 329.7C249.6 334.8 251.9 335.8 253.3 334.3C256.0 331.6 281.9 326.1 292.0 326.0C298.0 326.0 304.6 328.5 310.1 333.1L314.7 336.8L318.6 334.6C334.1 325.7 344.9 313.9 349.5 300.9C351.6 295.0 351.5 280.6 349.4 272.7C347.4 265.3 346.5 264.1 344.0 264.7C341.6 265.3 340.5 263.2 339.1 254.5C337.7 246.0 338.7 241.8 341.9 242.7C343.8 243.2 344.0 242.8 344.0 237.7C344.0 229.4 345.9 217.4 348.2 211.1C354.8 193.1 378.5 187.1 393.7 199.6C401.1 205.7 404.1 214.1 405.8 233.5C406.4 241.3 406.7 242.5 408.3 242.5C411.6 242.5 412.3 245.6 411.1 253.7C409.8 262.7 408.5 265.4 406.0 264.7C403.5 264.0 402.6 265.3 400.6 272.7C394.4 295.5 402.6 315.1 424.7 330.2C434.3 336.8 435.1 337.0 439.2 333.5C444.0 329.4 449.8 326.9 455.4 326.3C462.5 325.6 484.2 329.2 491.9 332.4C495.5 333.8 498.7 335.0 499.2 335.0C499.7 335.0 503.6 332.6 507.8 329.8C512.0 326.9 516.3 324.2 517.4 323.7C518.4 323.3 519.0 322.4 518.7 321.7C518.4 321.1 513.6 310.3 508.1 297.8C502.5 285.3 498.0 274.2 498.0 273.2C498.0 272.0 496.3 270.2 493.5 268.5C482.5 261.5 477.1 245.5 481.2 231.8C482.6 226.9 489.3 219.2 493.7 217.4C509.6 210.7 528.2 226.2 528.1 246.2C528.1 250.2 527.9 254.2 527.8 255.1C527.6 256.0 531.8 262.6 537.0 269.6C542.2 276.7 554.2 292.9 563.6 305.6C573.0 318.3 583.3 333.4 586.4 339.1C589.6 344.8 594.2 351.4 596.5 353.7C602.6 359.6 604.3 363.3 604.4 371.0C604.5 376.4 604.0 378.4 601.5 383.0C592.9 398.8 577.5 404.7 564.0 397.6C557.9 394.5 560.6 394.8 503.5 391.6L478.5 390.2L474.2 394.3C471.9 396.6 470.0 398.9 470.0 399.5C470.0 400.7 457.8 411.1 451.5 415.1C443.9 420.1 437.9 428.0 435.1 436.9C432.7 444.4 432.6 465.7 434.9 476.9C436.1 482.7 437.5 492.6 438.0 498.9C438.4 505.3 439.5 513.4 440.4 517.0C441.2 520.6 442.6 530.0 443.4 538.0C444.2 546.0 446.0 557.0 447.4 562.5C455.1 593.0 456.7 609.3 455.0 641.0C453.9 662.4 453.6 664.7 450.2 679.6C447.4 692.2 449.0 713.0 455.2 745.0C458.5 762.0 460.1 783.9 458.9 795.5C458.5 799.4 457.9 806.1 457.5 810.5C457.1 814.9 455.7 825.0 454.3 833.0C452.9 841.0 451.6 848.9 451.3 850.5C451.1 852.1 450.2 857.1 449.3 861.5C448.5 866.0 447.6 877.4 447.3 887.5L446.9 905.5L450.8 916.7C453.5 924.3 457.4 932.4 462.9 941.5C467.4 949.0 471.0 955.6 471.0 956.3C471.0 957.0 471.7 959.3 472.5 961.5C474.5 967.2 474.4 970.1 472.0 970.7C470.9 971.0 470.0 972.1 470.0 973.1C470.0 974.2 469.2 975.4 468.2 975.7C467.3 976.1 465.9 977.2 465.1 978.3C464.3 979.4 463.0 980.0 461.9 979.7C460.6 979.3 460.0 979.7 460.0 981.0C460.0 984.4 457.2 985.5 454.6 983.1L452.3 981.0L451.2 983.5C448.7 989.0 438.0 983.8 438.0 977.1C438.0 975.8 436.4 972.7 434.4 970.3C430.0 965.0 429.3 962.2 429.1 949.5C428.9 938.8 428.0 936.2 423.2 931.6C421.3 929.8 419.8 927.2 419.3 924.6C418.2 918.8 418.3 918.2 419.8 911.5C420.6 908.2 421.5 903.0 422.0 900.0C422.4 897.0 423.3 892.9 423.9 891.0C426.8 882.0 424.2 854.8 418.1 828.5C412.3 804.0 411.6 797.7 412.6 778.0C414.3 740.8 414.1 738.4 406.1 717.6C403.7 711.7 400.4 700.2 398.5 692.1C396.7 684.1 393.4 671.2 391.2 663.4C386.4 646.5 383.7 630.6 381.5 606.5C379.2 581.4 379.2 581.5 375.0 581.5C370.8 581.5 371.0 581.0 368.5 608.0C366.4 631.4 364.1 643.9 357.9 666.7C355.1 676.8 351.8 690.0 350.5 696.2C349.2 702.6 346.0 712.9 343.2 720.0C336.3 737.2 335.3 744.0 336.8 762.7C339.0 790.2 338.7 794.2 331.6 830.2C323.8 869.1 322.6 882.0 325.9 891.4C327.1 894.7 328.0 898.8 328.0 900.6C328.0 902.4 328.5 905.1 329.1 906.7C332.8 916.5 331.8 926.2 326.5 932.2C321.5 937.7 321.2 938.6 320.9 950.5C320.6 963.3 320.2 964.7 315.5 970.4C313.6 972.8 312.0 975.8 312.0 977.2C312.0 983.7 301.3 988.9 298.8 983.5Z","bdb":"M310.8 954.0C306.0 951.4 304.7 949.5 296.2 932.5C295.4 930.9 293.4 928.0 291.7 926.3C286.6 920.8 286.5 906.9 291.5 905.0C292.9 904.5 294.0 903.6 294.0 903.0C294.0 902.5 295.1 902.0 296.5 902.0C298.3 902.0 299.0 901.5 299.0 900.0C299.0 898.9 299.7 898.0 300.6 898.0C301.8 898.0 302.0 897.2 301.5 893.2C299.7 880.4 294.5 851.4 292.4 842.5C284.6 810.5 284.5 783.9 292.1 752.2C299.5 721.2 302.5 684.5 299.4 663.9C297.9 654.0 297.5 646.1 297.5 624.5C297.6 593.9 298.7 583.9 304.5 562.6C306.7 554.7 308.6 544.4 309.5 536.1C310.3 528.6 311.9 516.9 313.0 510.0C314.0 503.1 315.2 494.7 315.5 491.2C315.8 487.8 317.2 479.7 318.5 473.2C320.7 462.8 320.9 460.6 320.0 453.2C318.0 437.4 309.2 421.3 300.0 416.5C295.4 414.1 282.7 403.0 279.0 398.1C274.9 392.9 274.2 392.7 259.0 394.1C254.3 394.6 238.8 395.8 224.6 397.0C205.4 398.5 198.2 399.4 197.0 400.5C194.7 402.6 187.3 405.0 183.1 405.0C164.7 405.0 149.6 381.5 158.5 366.5C159.9 364.0 162.5 361.0 164.1 359.8C165.8 358.5 170.4 352.5 174.4 346.5C178.6 340.0 192.5 322.8 207.6 305.2L233.5 274.9L233.5 267.2C233.6 247.8 250.6 233.8 266.3 240.4C273.9 243.5 279.9 255.4 278.5 264.6C277.2 273.6 271.6 282.4 265.0 286.2C262.8 287.5 261.0 289.1 261.0 289.8C261.0 290.5 256.4 300.1 250.9 311.2L240.8 331.4L243.8 334.0C245.5 335.4 248.4 337.3 250.2 338.3C253.6 340.1 253.6 340.1 260.5 336.9C265.2 334.8 271.4 333.1 280.3 331.6C294.5 329.1 299.2 329.4 306.4 333.0C310.0 334.8 310.5 334.8 313.4 333.3C318.9 330.5 339.4 316.7 343.3 313.1C348.0 308.9 352.0 301.3 352.0 296.8C351.9 292.6 348.4 279.6 347.2 279.2C343.9 278.1 342.8 275.9 341.3 267.4C339.5 257.4 339.9 254.5 342.9 255.5C344.6 256.0 344.8 255.2 345.4 245.5C347.0 221.6 353.0 212.4 368.4 209.8C384.7 207.1 397.6 213.8 401.8 227.0C403.1 231.1 405.0 245.7 405.0 251.7C405.0 255.5 405.2 256.0 407.2 255.7C409.4 255.5 409.5 255.8 409.3 261.5C409.0 270.9 407.2 277.0 404.4 278.2C401.8 279.4 399.4 285.8 398.3 294.0C397.2 302.8 403.4 312.2 415.1 319.6C417.5 321.1 422.6 324.5 426.5 327.0C438.4 335.0 439.1 335.3 443.8 333.0C451.7 329.2 455.2 329.0 469.8 331.6C478.8 333.2 485.6 335.0 490.0 337.1L496.7 340.2L502.9 336.3C506.2 334.2 509.0 332.2 509.0 331.7C509.0 331.3 504.5 322.0 499.0 311.0C493.5 300.0 489.0 290.4 489.0 289.7C489.0 289.0 487.4 287.6 485.4 286.5C474.7 280.7 468.8 264.8 472.9 252.7C478.4 236.4 499.2 234.1 510.2 248.5C515.0 254.8 517.4 262.7 516.7 269.3L516.1 274.3L523.0 282.4C526.8 286.9 538.9 301.0 549.9 313.9C560.9 326.8 572.7 341.7 576.1 347.1C579.5 352.5 584.0 358.2 586.0 359.9C591.0 363.9 594.2 370.7 594.2 377.1C594.2 387.2 585.8 399.2 576.0 403.2C569.0 406.1 557.7 404.7 553.0 400.5C551.5 399.2 540.9 397.9 518.5 396.5C513.5 396.2 508.1 395.7 506.5 395.5C501.4 394.7 485.8 393.6 480.1 393.6C474.7 393.5 474.5 393.6 471.1 398.1C467.6 402.7 453.6 415.0 452.0 415.0C449.7 415.0 439.6 425.9 436.8 431.4C429.2 446.4 428.0 456.2 431.5 473.4C432.9 480.0 434.3 488.5 434.6 492.4C434.9 496.3 436.0 504.0 437.0 509.5C438.0 515.0 439.4 525.4 440.0 532.5C440.8 540.5 442.7 551.2 445.0 560.5C449.7 579.3 450.8 585.2 452.0 596.5C453.3 609.7 452.4 652.5 450.6 664.5C447.5 684.3 450.2 717.8 457.4 749.7C465.5 785.5 465.6 810.5 458.0 841.9C455.5 852.2 449.0 890.5 449.0 894.9C449.0 896.6 449.4 898.0 450.0 898.0C450.6 898.0 451.0 898.9 451.0 900.0C451.0 901.5 451.7 902.0 453.5 902.0C454.9 902.0 456.0 902.5 456.0 903.0C456.0 903.6 457.1 904.5 458.5 905.0C463.3 906.8 463.4 920.8 458.7 925.8C456.0 928.6 454.3 931.5 449.3 941.5C445.5 949.1 443.2 951.9 439.0 954.0C431.8 957.7 424.3 955.6 421.9 949.3C420.5 945.7 422.8 912.0 425.1 902.8C428.6 888.7 427.5 877.7 418.6 835.8C413.4 811.4 412.9 802.5 415.1 775.9C416.7 757.0 415.6 749.2 408.1 727.0C404.8 717.4 401.4 706.1 400.5 702.0C398.0 690.5 394.4 675.9 390.5 661.6C386.2 645.4 383.6 629.5 381.0 602.0C379.8 590.2 378.5 580.1 378.1 579.7C377.6 579.2 376.0 579.0 374.4 579.2C370.9 579.6 370.9 579.9 368.5 606.0C366.2 632.1 363.7 646.1 357.5 669.2C354.4 680.3 351.5 692.4 350.9 696.0C350.3 699.6 346.7 712.0 342.9 723.7C334.0 751.0 333.3 755.6 335.0 777.4C336.8 802.0 336.0 815.9 331.5 836.0C322.9 874.6 321.5 888.7 324.9 903.2C327.3 913.2 329.5 945.6 328.1 949.2C325.7 955.6 317.9 957.7 310.8 954.0Z","lat":"M298.8 983.5L297.7 981.1L295.2 983.0C292.6 985.1 290.0 984.3 290.0 981.4C290.0 980.6 289.2 980.0 288.2 980.0C287.2 980.0 285.4 978.9 284.2 977.5C283.0 976.1 281.6 975.0 281.0 975.0C280.5 975.0 280.0 974.2 280.0 973.1C280.0 972.1 279.1 971.0 278.0 970.7C273.6 969.6 277.6 957.3 287.8 940.4C291.7 933.8 296.6 924.0 298.7 918.5L302.5 908.5L302.4 891.0C302.4 875.0 302.0 871.2 297.7 846.0C289.6 798.0 288.8 774.3 294.5 747.0C297.9 730.7 301.8 698.5 301.4 690.7C301.3 687.3 300.2 680.7 299.1 676.0C295.1 659.1 293.3 627.8 295.0 605.5C296.1 589.9 296.7 586.7 301.7 566.0C303.6 558.0 305.8 545.9 306.5 539.0L307.9 526.5L303.5 518.7C301.0 514.4 298.8 509.4 298.4 507.5C297.0 500.0 295.8 499.0 253.7 471.6C210.9 443.7 201.6 431.6 208.1 412.0C211.0 403.1 216.5 395.5 230.6 380.9C242.3 368.8 243.0 367.8 249.4 354.8C260.8 331.8 270.5 324.7 291.0 324.1C308.7 323.7 332.8 318.1 340.7 312.7C344.8 309.9 349.7 301.7 350.8 295.8C352.3 288.0 349.8 269.4 346.8 265.4C346.3 264.7 345.1 264.4 344.0 264.7C341.6 265.3 340.5 263.2 339.1 254.5C337.7 246.0 338.7 241.8 341.9 242.7C343.8 243.2 344.0 242.8 344.0 237.7C344.0 229.4 345.9 217.4 348.2 211.1C354.8 193.1 378.5 187.1 393.7 199.6C401.1 205.7 404.1 214.1 405.8 233.5C406.4 241.3 406.7 242.5 408.3 242.5C411.6 242.5 412.3 245.6 411.1 253.7C409.8 262.7 408.5 265.4 406.0 264.7C403.5 264.0 402.6 265.3 400.6 272.8C396.5 287.7 399.1 303.0 407.0 310.7C413.1 316.7 431.8 322.0 452.0 323.5C466.2 324.6 467.3 324.7 473.4 326.5C485.4 330.0 491.9 336.9 501.1 355.7C506.9 367.6 507.8 368.9 519.4 380.9C533.5 395.5 539.0 403.1 541.9 412.0C548.5 431.9 539.0 444.0 493.5 473.4C454.6 498.6 453.3 499.7 451.5 508.0C451.1 509.9 448.8 514.9 446.4 519.0L442.1 526.5L443.5 539.5C444.3 546.6 446.0 557.0 447.4 562.5C455.1 592.9 456.7 609.3 455.0 641.0C453.9 662.4 453.6 664.7 450.2 679.6C447.4 692.2 449.0 713.0 455.2 745.0C458.5 762.0 460.1 783.9 458.9 795.5C458.5 799.4 457.9 806.1 457.5 810.5C457.1 814.9 455.7 825.0 454.3 833.0C452.9 841.0 451.6 848.9 451.3 850.5C451.1 852.1 450.2 857.1 449.3 861.5C448.5 866.0 447.6 877.4 447.3 887.5L446.9 905.5L450.8 916.7C453.5 924.3 457.4 932.4 462.9 941.5C467.4 949.0 471.0 955.6 471.0 956.3C471.0 957.0 471.7 959.3 472.5 961.5C474.5 967.2 474.4 970.1 472.0 970.7C470.9 971.0 470.0 972.1 470.0 973.1C470.0 974.2 469.2 975.4 468.2 975.7C467.3 976.1 465.9 977.2 465.1 978.3C464.3 979.4 463.0 980.0 461.9 979.7C460.6 979.3 460.0 979.7 460.0 981.0C460.0 984.4 457.2 985.5 454.6 983.1L452.3 981.0L451.2 983.5C448.7 989.0 438.0 983.8 438.0 977.1C438.0 975.8 436.4 972.7 434.4 970.3C430.0 965.0 429.3 962.2 429.1 949.5C428.9 938.8 428.0 936.2 423.2 931.6C421.3 929.8 419.8 927.2 419.3 924.6C418.2 918.8 418.3 918.2 419.8 911.5C420.6 908.2 421.5 903.0 422.0 900.0C422.4 897.0 423.3 892.9 423.9 891.0C426.8 882.0 424.2 854.8 418.1 828.5C412.3 804.0 411.6 797.7 412.6 778.0C414.3 740.8 414.1 738.4 406.1 717.6C403.7 711.7 400.4 700.2 398.5 692.1C396.7 684.1 393.4 671.2 391.2 663.4C386.4 646.5 383.7 630.6 381.5 606.5C379.2 581.4 379.2 581.5 375.0 581.5C370.8 581.5 371.0 581.0 368.5 608.0C366.4 631.4 364.1 643.9 357.9 666.7C355.1 676.8 351.8 690.0 350.5 696.2C349.2 702.6 346.0 712.9 343.2 720.0C336.3 737.2 335.3 744.0 336.8 762.7C339.0 790.2 338.7 794.2 331.6 830.2C323.8 869.1 322.6 882.0 325.9 891.4C327.1 894.7 328.0 898.8 328.0 900.6C328.0 902.4 328.5 905.1 329.1 906.7C332.8 916.5 331.8 926.2 326.5 932.2C321.5 937.7 321.2 938.6 320.9 950.5C320.6 963.3 320.2 964.7 315.5 970.4C313.6 972.8 312.0 975.8 312.0 977.2C312.0 983.7 301.3 988.9 298.8 983.5ZM315.0 476.4C316.9 466.6 317.2 463.0 316.6 453.2C315.6 434.9 313.1 428.2 303.2 417.0C296.2 409.1 292.1 402.7 290.5 397.2C287.6 387.6 287.3 387.6 277.9 396.1C269.2 403.9 252.9 417.1 246.6 421.3L243.0 423.8L249.6 429.5C253.2 432.7 260.6 440.6 266.0 447.0C271.4 453.5 278.7 461.3 282.2 464.4C290.0 471.4 311.0 488.0 312.0 488.0C312.4 488.0 313.8 482.8 315.0 476.4ZM448.6 480.2C467.7 464.8 472.7 460.2 482.7 448.4C492.8 436.7 498.5 430.8 504.5 426.1C506.3 424.7 507.0 423.6 506.3 423.3C504.0 422.5 481.1 404.3 472.5 396.5L464.0 388.8L462.1 391.1C461.0 392.4 459.9 395.1 459.5 397.0C458.7 401.4 454.0 408.8 447.3 416.3C436.3 428.7 433.6 436.6 433.5 457.0C433.5 471.4 436.0 488.0 438.1 488.0C438.6 488.0 443.3 484.5 448.6 480.2Z","mFront":"M267.4 993.6C268.2 986.0 266.5 976.6 261.5 961.0C256.5 945.5 254.8 937.7 254.0 926.5C253.6 921.0 252.7 910.6 252.0 903.5C249.2 874.0 251.3 848.1 260.5 799.5C262.3 789.6 264.4 776.1 265.0 769.5C265.6 762.9 266.3 756.8 266.5 756.0C269.4 745.4 275.0 707.3 275.0 697.9C275.0 686.2 276.0 677.2 278.8 665.0C280.2 658.9 280.5 652.5 280.4 630.0C280.3 595.3 279.3 588.9 271.6 573.4C268.7 567.4 265.9 561.4 265.5 560.1C264.5 556.7 263.8 558.0 258.5 574.5C255.9 582.8 252.2 594.2 250.3 600.0C243.0 622.0 241.1 630.4 240.0 647.4C238.1 675.6 235.6 687.9 223.8 729.5C214.4 762.5 210.2 779.8 209.3 789.7C208.8 796.4 208.9 797.3 211.4 801.0C215.6 807.4 217.4 823.7 215.1 835.5C214.2 840.1 215.1 842.3 221.7 852.1C225.6 857.8 226.0 858.9 225.1 861.3C223.5 865.5 220.7 864.6 215.1 858.2L210.0 852.5L210.0 856.6C210.0 860.4 211.8 865.3 218.1 878.6C220.7 884.1 220.6 889.0 217.8 892.0C213.6 896.5 213.0 898.5 214.2 904.4C215.2 909.0 215.1 910.1 213.7 912.4C210.7 916.8 208.2 915.8 205.0 908.8C201.6 901.5 201.2 902.8 204.0 911.7C206.2 918.7 205.8 924.0 202.8 926.7C200.9 928.4 200.8 928.4 199.2 926.2C194.3 919.8 186.5 899.5 185.5 891.0C185.2 888.0 184.2 881.2 183.4 876.0C181.5 863.6 180.1 830.7 181.1 820.5C185.4 775.4 187.0 736.7 187.0 676.5C187.0 650.1 187.5 623.5 188.0 617.5C191.1 585.3 192.4 575.6 195.6 559.8C200.0 538.5 200.8 525.5 198.6 510.5C193.3 472.8 197.1 455.2 213.6 440.4C220.8 433.9 222.7 432.9 235.5 427.8C252.2 421.1 275.7 414.6 303.0 409.0C318.9 405.8 323.9 403.7 328.0 398.5C332.9 392.3 334.8 386.1 334.9 375.8C335.0 368.0 334.8 366.9 332.5 364.2C328.9 359.9 325.1 351.2 323.6 343.8C322.6 338.7 321.9 337.4 320.3 337.2C317.8 336.8 317.6 335.7 315.9 316.9C314.7 303.7 315.0 299.3 316.9 300.4C317.4 300.8 318.1 298.0 318.4 294.3C318.8 290.5 319.5 283.9 320.1 279.5C320.8 275.1 321.6 268.8 322.0 265.5C324.8 240.8 338.0 226.5 361.1 222.9C371.5 221.3 380.8 222.7 390.5 227.5C409.7 237.0 418.4 254.8 420.4 288.4C421.1 299.4 421.2 299.9 423.6 297.9C425.0 296.7 425.5 296.9 427.2 299.0C429.0 301.2 429.2 302.4 428.6 310.1C428.0 319.5 424.9 331.0 422.4 333.1C421.6 333.8 419.2 334.4 417.2 334.4L413.5 334.5L411.7 343.5C410.5 349.3 409.8 357.5 409.7 366.5L409.5 380.5L412.9 387.0C420.5 401.8 427.4 406.4 449.2 411.4C450.6 411.7 452.5 412.3 453.4 412.6C454.7 413.1 455.0 411.9 455.2 404.3L455.5 395.5L489.8 395.2L524.0 394.9L524.0 411.5C524.0 426.1 524.2 428.0 525.6 428.0C529.5 428.0 545.3 437.6 550.2 442.9C564.0 458.0 569.6 472.0 572.4 498.5C574.1 514.2 576.0 519.9 588.8 548.5C593.4 559.0 601.1 577.4 605.7 589.5C614.0 611.1 614.2 611.6 613.6 618.1C612.8 627.2 607.3 638.6 600.2 646.1C588.9 658.2 566.9 650.9 545.4 628.0C534.7 616.6 529.4 609.4 520.3 593.5C510.8 577.1 501.9 563.9 494.2 555.0C494.0 554.7 493.3 555.3 492.6 556.4C492.0 557.4 488.3 563.3 484.4 569.4C469.9 592.2 464.3 604.8 462.5 619.0C459.3 643.3 459.4 646.1 464.5 669.0C465.8 674.8 467.4 685.8 468.0 693.4C468.6 701.1 469.9 711.2 471.0 715.9C472.9 724.6 474.6 737.7 477.5 766.0C479.2 783.4 479.8 786.3 486.4 811.2C494.4 841.6 496.4 858.6 496.3 896.0C496.2 929.6 493.7 955.8 488.8 974.4C487.1 980.7 486.8 984.0 487.3 991.1L487.9 1000.0L451.2 999.8L414.5 999.5L411.7 989.5C410.2 984.0 405.1 966.6 400.5 950.8C390.2 916.6 386.7 900.2 384.0 874.1C382.9 863.3 381.2 848.8 380.3 841.8C378.7 829.2 378.6 829.0 376.1 828.8C371.6 828.6 367.5 829.2 366.9 830.1C366.6 830.7 365.6 840.4 364.6 851.8C361.2 894.7 359.2 906.7 351.6 933.1C346.5 950.7 342.4 966.7 341.4 972.5C340.5 978.2 337.2 990.7 335.3 995.8L333.7 1000.0L300.2 1000.0L266.7 1000.0L267.4 993.6Z","mSide":"M326.0 998.4C326.0 997.6 327.8 991.6 330.0 985.2C336.7 965.2 337.3 956.2 334.0 920.5C333.2 911.6 333.0 897.3 333.5 875.0C334.2 838.4 333.4 829.7 326.5 801.5C317.2 763.8 318.3 753.5 335.2 719.4C347.4 694.6 347.5 693.7 337.1 655.5C334.3 645.0 331.0 631.1 329.9 624.5C328.8 617.9 326.8 606.2 325.5 598.5C324.1 590.8 322.6 579.7 322.0 573.9C321.4 568.1 320.3 559.6 319.5 554.9C317.2 542.0 317.6 535.9 321.5 521.6C326.4 503.8 333.9 489.5 342.4 482.0C351.1 474.3 354.6 469.5 358.4 459.8C364.6 444.6 366.3 431.7 363.5 422.2C362.1 417.5 361.6 417.0 359.1 417.0C351.4 417.0 345.8 390.8 353.1 388.5C354.7 388.0 355.0 386.9 355.0 381.6C355.0 368.5 357.6 358.2 362.8 350.6C371.6 337.6 382.9 332.4 400.5 333.2C414.2 333.8 424.1 339.4 430.5 350.4C437.5 362.3 441.3 398.1 437.2 413.0C436.1 417.1 434.6 423.1 434.0 426.3C432.4 434.3 426.9 444.7 421.6 449.8C416.5 454.7 416.6 454.3 415.0 474.4L413.9 488.2L416.6 491.7C418.1 493.7 420.6 498.0 422.3 501.4C423.9 504.7 428.2 511.5 431.8 516.4C439.3 526.7 444.7 538.5 448.1 551.8L450.4 561.2L453.5 557.4C455.1 555.4 461.1 547.6 466.7 540.2L476.9 526.6L477.0 489.6C477.1 469.2 477.3 448.2 477.5 443.0C477.7 437.8 477.9 430.2 477.9 426.2L478.0 419.0L504.0 419.0L530.0 419.0L530.0 428.2C530.1 437.0 531.9 443.8 534.2 444.0C534.7 444.0 535.7 444.0 536.5 444.0C538.5 444.0 541.7 447.7 542.5 450.8C542.8 452.3 544.4 455.2 546.1 457.2C550.9 463.3 549.7 469.4 542.3 476.1C539.0 479.1 537.8 481.4 534.2 492.1C530.1 504.2 530.0 505.0 530.0 517.3L530.0 530.0L521.1 530.0L512.1 530.0L506.1 538.0C502.8 542.4 498.7 549.0 496.9 552.7C475.7 597.5 461.8 623.4 447.9 643.8C443.3 650.7 442.9 651.7 442.4 658.8C442.0 663.5 442.4 671.3 443.4 678.7C446.3 700.7 444.8 722.0 438.6 748.1C434.8 764.0 434.5 770.2 437.0 778.3C438.1 782.0 439.2 787.6 439.4 790.8C439.6 793.9 439.9 797.2 440.1 798.0C440.4 799.0 439.8 799.5 438.4 799.4C436.3 799.4 436.3 799.9 435.7 814.9C435.1 831.8 432.2 853.8 428.9 866.5C427.8 870.9 426.2 878.8 425.4 884.0C420.5 916.2 418.3 924.5 408.8 946.0C403.8 957.1 402.2 962.3 399.4 975.5C397.6 984.3 395.7 993.2 395.2 995.2C394.6 997.2 394.5 999.1 394.8 999.4C395.1 999.8 379.7 1000.0 360.7 1000.0C329.9 1000.0 326.0 999.8 326.0 998.4Z","mBack":"M289.7 988.8C290.1 981.6 289.6 970.9 288.6 959.5C286.8 940.4 286.3 908.3 287.5 888.6L288.3 876.8L286.1 878.0C282.6 879.8 277.8 877.6 273.1 872.0C268.4 866.4 267.2 866.0 264.3 869.2C258.5 875.4 258.1 887.8 263.0 904.5C266.3 915.8 266.5 917.8 264.5 920.0C263.5 921.1 262.1 922.0 261.4 922.0C260.2 922.0 254.0 908.5 254.0 905.8C254.0 904.8 253.8 904.8 253.1 905.9C252.5 906.8 252.5 908.1 253.1 909.1C253.6 910.1 254.3 913.7 254.6 917.2C254.9 920.7 255.4 926.0 255.7 929.0C256.1 933.6 255.9 934.9 254.1 937.0C252.0 939.4 252.0 939.5 250.5 937.6C249.7 936.5 249.0 934.9 248.9 934.1C248.9 933.2 248.3 934.0 247.6 935.9C246.4 939.4 243.6 942.0 242.5 940.8C242.2 940.5 241.5 937.1 240.9 933.4C240.4 929.6 239.0 921.1 237.8 914.6C235.7 903.2 235.7 901.8 236.9 881.1C237.6 869.2 238.5 857.5 239.0 855.0C240.4 848.3 240.1 824.8 238.3 795.5C236.7 768.6 237.0 736.6 239.0 722.5C240.4 712.6 241.5 697.6 241.4 690.0C241.3 686.4 241.2 673.7 241.1 661.8C241.1 647.5 240.5 636.6 239.4 629.8C236.0 608.0 238.3 593.6 247.0 581.2C256.1 568.2 279.0 559.0 320.0 552.0C329.1 550.5 338.2 548.5 340.1 547.7C345.1 545.7 349.2 540.4 352.9 531.5C358.6 518.0 358.4 505.5 352.5 497.3C340.9 481.2 338.1 471.8 339.9 456.2C341.5 442.1 344.3 436.4 353.3 428.9C372.9 412.4 410.9 414.5 428.6 433.1C436.5 441.5 439.4 446.6 442.1 457.2C444.5 466.6 443.8 472.7 440.0 475.7C438.9 476.6 438.8 476.9 439.8 477.0C440.8 477.0 441.0 477.8 440.5 479.9C440.0 482.1 440.6 483.9 442.9 487.6C446.7 493.5 446.8 495.3 443.3 498.0C440.7 500.0 440.7 500.1 442.2 503.3C443.5 506.0 443.6 507.0 442.5 509.0C441.8 510.2 441.4 512.0 441.7 512.9C441.9 513.8 441.2 516.3 440.0 518.5C438.9 520.6 438.0 523.7 438.0 525.3C438.0 531.1 434.6 532.8 416.5 536.0C406.0 537.8 404.4 543.9 411.4 554.5C419.4 566.6 428.8 572.5 448.3 577.7L458.3 580.4L475.3 577.6C502.0 573.1 512.9 574.8 530.4 586.4C538.9 592.0 543.4 593.9 558.3 598.1C573.9 602.6 584.7 606.9 589.8 610.8C591.6 612.2 593.3 613.1 593.5 612.8C595.1 611.2 586.0 566.2 579.6 544.5C577.7 537.9 574.1 525.4 571.6 516.7C569.1 508.0 567.0 500.0 567.0 498.9C567.0 497.9 566.5 496.9 566.0 496.9C565.5 496.8 564.1 496.6 563.0 496.5C561.9 496.4 559.6 496.2 557.9 496.1L554.9 496.0L555.5 469.8C556.6 417.6 557.1 399.6 557.4 399.3C557.6 399.1 568.4 398.7 581.5 398.3L605.2 397.7L604.5 406.6L603.8 415.5L606.9 417.3C608.6 418.3 610.7 420.4 611.4 421.9C612.2 423.4 613.6 425.2 614.4 425.9C616.7 427.8 616.5 437.1 614.1 441.9C611.6 446.6 609.5 448.4 607.1 447.7C605.3 447.3 605.1 447.7 605.1 453.9C605.1 457.5 604.7 461.8 604.1 463.3C603.5 464.9 603.0 473.0 603.0 481.6L603.0 497.0L598.4 497.0C592.8 497.0 592.8 496.8 600.9 513.0C625.3 561.5 630.3 572.1 634.9 584.4C646.7 615.8 647.7 621.1 645.4 640.9C644.5 647.6 643.7 650.7 642.4 652.1C641.3 653.1 634.7 655.6 627.5 657.6C611.4 662.2 597.3 663.1 581.6 660.6C576.0 659.8 567.9 658.6 563.5 658.0C553.0 656.6 525.5 652.3 516.0 650.6C511.4 649.7 507.7 649.5 506.3 650.1C501.9 651.7 495.3 658.9 493.1 664.3C490.7 670.0 481.5 678.8 470.2 686.1C462.1 691.3 455.9 697.7 452.6 704.4C449.7 710.2 449.6 710.4 449.6 728.4C449.5 743.1 449.9 747.7 451.4 753.0C452.5 757.2 453.5 765.2 454.0 775.5C454.6 786.1 455.9 796.7 457.9 807.0C459.5 815.5 461.2 826.1 461.6 830.5C461.9 834.9 462.8 841.6 463.5 845.5C469.3 877.9 471.0 887.7 471.9 895.5C475.2 924.5 473.8 961.4 468.4 991.2L466.8 1000.0L431.5 1000.0L396.2 1000.0L394.1 990.8C390.2 974.4 390.0 973.2 388.0 958.2C385.8 941.0 384.5 927.8 382.9 905.0C381.8 889.4 381.5 888.3 378.8 884.2C376.3 880.6 373.0 878.6 373.0 880.7C373.0 881.4 369.4 911.9 367.9 923.9C366.6 934.4 363.2 948.8 358.4 964.5C356.4 971.1 353.3 981.7 351.5 988.0L348.3 999.5L318.7 999.8L289.2 1000.0L289.7 988.8ZM290.6 864.0C291.4 859.9 294.1 850.2 296.5 842.5C301.9 825.4 303.0 819.0 303.0 803.5C303.0 796.8 303.7 788.6 304.5 785.0C305.3 781.4 306.9 773.1 308.0 766.5C309.2 759.9 311.0 749.4 312.1 743.2C314.5 730.2 314.1 725.5 310.3 714.0C306.4 702.5 298.6 683.3 294.6 675.3C292.6 671.3 290.4 665.5 289.8 662.3L288.6 656.6L287.4 662.6C286.8 665.8 285.7 672.8 285.0 678.0C284.4 683.2 283.3 692.0 282.5 697.5C281.8 703.0 280.9 710.6 280.6 714.5C280.2 718.4 279.5 724.9 279.0 729.0C278.4 733.1 277.3 742.4 276.6 749.5C275.5 758.8 273.6 768.1 269.6 782.5C262.8 807.4 260.7 819.3 261.2 831.1L261.5 840.1L266.8 845.0C269.6 847.6 272.0 850.4 272.0 851.2C272.0 851.9 275.4 857.0 279.5 862.5C283.6 867.9 287.3 873.3 287.7 874.4C288.4 876.4 288.4 876.3 288.8 874.0C288.9 872.6 289.8 868.1 290.6 864.0Z","mFlex":"M267.4 993.6C268.2 986.0 266.5 976.6 261.5 961.0C256.5 945.5 254.8 937.7 254.0 926.5C253.6 921.0 252.7 910.6 252.0 903.5C249.2 874.0 251.3 848.1 260.5 799.5C262.3 789.6 264.4 776.1 265.0 769.5C265.6 762.9 266.3 756.8 266.5 756.0C269.4 745.4 275.0 707.3 275.0 697.9C275.0 686.2 276.0 677.2 278.8 665.0C281.2 654.3 281.1 606.9 278.6 593.0C276.1 579.2 270.2 570.3 258.0 562.0C255.0 559.9 251.4 557.0 250.0 555.5C248.6 554.0 244.4 550.3 240.7 547.3C235.8 543.4 233.2 540.3 231.3 536.6C227.2 528.2 224.0 526.6 212.7 527.4C207.7 527.7 199.7 528.2 195.0 528.5C190.3 528.8 183.8 529.2 180.5 529.5C177.2 529.7 169.8 530.2 164.0 530.5C158.2 530.9 151.0 531.3 148.0 531.5C145.0 531.7 133.9 532.4 123.5 533.0C106.3 534.1 104.2 534.4 100.8 536.5C83.9 547.5 58.9 544.0 46.9 528.9C32.1 510.3 31.9 492.1 46.5 476.7C49.5 473.5 52.0 470.5 52.0 470.0C52.0 467.5 67.9 437.0 74.1 427.5C78.1 421.4 86.5 408.6 92.8 399.0C99.1 389.4 107.5 376.6 111.5 370.5C115.5 364.4 122.2 354.1 126.5 347.5C130.8 340.9 135.1 334.6 136.1 333.5C137.8 331.6 137.8 331.1 136.4 326.5C135.6 323.7 134.9 318.1 134.9 313.9C134.6 281.9 163.6 258.6 188.4 270.9C216.1 284.5 216.0 328.9 188.2 348.1C185.0 350.4 184.0 351.7 184.0 353.9C184.0 356.6 181.4 365.6 180.0 367.5C179.6 368.1 178.3 371.2 177.2 374.5C176.1 377.8 172.1 388.4 168.5 398.0C164.8 407.6 160.8 418.3 159.4 421.8L157.1 428.1L161.3 429.9C163.6 430.9 170.4 435.0 176.4 439.0C186.3 445.6 187.5 446.2 189.4 445.0C193.4 442.5 208.5 436.9 213.5 436.0C216.2 435.6 223.2 434.4 229.0 433.4C251.3 429.4 263.3 431.3 275.7 440.5L281.5 444.9L287.8 441.4C296.6 436.6 312.7 424.2 318.4 418.0C321.1 414.9 325.4 408.0 328.7 401.3L334.4 390.0L334.8 378.7C335.2 367.7 335.2 367.4 332.6 364.3C328.9 360.0 325.1 351.3 323.6 343.8C322.6 338.7 321.9 337.4 320.3 337.2C317.8 336.8 317.6 335.7 315.9 316.9C314.7 303.7 315.0 299.3 316.9 300.4C317.4 300.8 318.1 298.0 318.4 294.3C318.8 290.5 319.5 283.9 320.1 279.5C320.8 275.1 321.6 268.8 322.0 265.5C324.8 240.8 338.0 226.5 361.1 222.9C371.5 221.3 380.8 222.7 390.5 227.5C409.7 237.0 418.4 254.8 420.4 288.4C421.1 299.4 421.2 299.9 423.6 297.9C425.0 296.7 425.5 296.9 427.2 299.0C429.0 301.2 429.2 302.4 428.6 310.1C428.0 319.5 424.9 331.0 422.4 333.1C421.6 333.8 419.2 334.4 417.2 334.4L413.5 334.5L411.7 343.5C410.5 349.3 409.8 357.5 409.7 366.5L409.5 380.5L412.9 387.0C420.5 401.8 427.4 406.4 449.2 411.4C450.6 411.7 452.5 412.3 453.4 412.6C454.7 413.1 455.0 411.9 455.2 404.3L455.5 395.5L489.8 395.2L524.0 394.9L524.0 411.5C524.0 426.1 524.2 428.0 525.6 428.0C529.5 428.0 545.3 437.6 550.2 442.9C564.0 458.0 569.6 472.0 572.4 498.5C574.1 514.2 576.0 519.9 588.8 548.5C593.4 559.0 601.1 577.4 605.7 589.5C614.0 611.1 614.2 611.6 613.6 618.1C612.8 627.2 607.3 638.6 600.2 646.1C588.9 658.2 566.9 650.9 545.4 628.0C534.7 616.6 529.4 609.4 520.3 593.5C510.8 577.1 501.9 563.9 494.2 555.0C494.0 554.7 493.3 555.3 492.6 556.4C492.0 557.4 488.3 563.3 484.4 569.4C469.9 592.2 464.3 604.8 462.5 619.0C459.3 643.3 459.4 646.1 464.5 669.0C465.8 674.8 467.4 685.8 468.0 693.4C468.6 701.1 469.9 711.2 471.0 715.9C472.9 724.6 474.6 737.7 477.5 766.0C479.2 783.4 479.8 786.3 486.4 811.2C494.4 841.6 496.4 858.6 496.3 896.0C496.2 929.6 493.7 955.8 488.8 974.4C487.1 980.7 486.8 984.0 487.3 991.1L487.9 1000.0L451.2 999.8L414.5 999.5L411.7 989.5C410.2 984.0 405.1 966.6 400.5 950.8C390.2 916.6 386.7 900.2 384.0 874.1C382.9 863.3 381.2 848.8 380.3 841.8C378.7 829.2 378.6 829.0 376.1 828.8C371.6 828.6 367.5 829.2 366.9 830.1C366.6 830.7 365.6 840.4 364.6 851.8C361.2 894.7 359.2 906.7 351.6 933.1C346.5 950.7 342.4 966.7 341.4 972.5C340.5 978.2 337.2 990.7 335.3 995.8L333.7 1000.0L300.2 1000.0L266.7 1000.0L267.4 993.6Z","selfie":"M124.7 997.8C124.3 996.5 124.1 980.9 124.0 963.0C124.0 928.5 123.5 914.8 121.9 901.0C120.3 886.7 116.1 857.5 112.9 837.5L109.8 818.5L110.3 784.5C110.7 754.6 111.1 748.4 113.3 733.5C119.4 693.4 119.1 684.0 110.5 654.0C101.5 622.6 101.1 611.5 107.9 591.7C114.9 571.5 115.6 570.3 126.9 560.5C132.4 555.7 139.8 550.0 143.2 547.9C155.1 540.6 214.6 522.6 234.0 520.5C240.0 519.8 262.3 518.1 273.5 517.4C289.7 516.5 298.5 512.4 301.9 504.1C303.1 501.3 302.9 500.6 299.7 495.3C291.7 482.1 287.8 471.0 282.5 447.8C278.4 429.6 278.3 429.4 275.0 428.0C273.3 427.3 272.0 426.7 272.0 426.6C272.0 426.6 271.5 423.8 271.0 420.5C270.4 417.2 269.8 411.5 269.5 407.8C269.2 404.1 268.5 399.9 268.0 398.4C267.4 397.0 267.0 393.1 267.0 389.7C267.0 386.3 266.3 381.3 265.5 378.6C263.5 372.0 263.6 365.1 265.6 362.9C267.2 361.1 267.4 361.1 270.2 363.1C271.8 364.3 273.4 364.9 273.8 364.5C274.2 364.2 274.8 353.9 275.2 341.7C276.8 295.0 280.8 277.3 293.6 260.1C298.3 253.8 302.7 249.2 307.9 245.3C337.3 223.2 389.3 223.2 419.2 245.3C433.8 256.1 446.3 278.0 449.6 298.5C451.8 311.7 454.3 347.9 453.7 357.3C453.1 366.6 454.0 368.7 457.9 366.3C458.8 365.8 460.5 364.7 461.7 363.9C463.7 362.7 464.2 362.8 466.1 364.6C469.2 367.7 469.5 373.3 467.1 382.7C465.9 387.2 465.0 392.2 465.0 393.9C465.0 397.0 463.2 406.7 460.2 419.9C458.4 427.8 455.8 431.0 451.3 431.0C445.1 431.0 444.2 432.6 439.9 451.5C438.3 458.6 435.6 468.3 433.9 472.9C429.9 483.8 430.3 488.8 436.7 502.0C442.1 513.1 448.0 520.5 456.5 526.4C462.5 530.7 543.4 571.7 564.5 581.2L575.5 586.1L598.0 587.5C634.6 589.8 637.2 590.3 651.9 597.3C674.5 608.1 685.2 618.6 695.4 640.1C703.7 657.7 706.0 662.8 709.9 672.5C714.4 683.5 724.9 701.2 734.5 714.0C738.4 719.2 743.5 726.3 745.8 729.7L750.0 735.9L750.0 867.9L750.0 1000.0L675.2 1000.0L600.5 1000.0L616.9 984.2C630.0 971.7 634.6 966.6 639.5 958.9C648.0 945.8 647.6 946.8 650.9 931.7C654.7 914.3 662.1 890.9 667.6 879.2L671.9 869.9L664.9 857.7C661.0 851.0 653.0 835.7 647.0 823.8C641.0 811.8 634.8 800.1 633.2 797.8C631.6 795.4 628.1 789.7 625.5 785.0C622.8 780.3 619.0 774.5 617.0 772.0C614.9 769.5 609.8 762.7 605.6 756.8L597.9 746.1L593.7 747.7C587.3 750.2 578.5 757.4 577.4 760.9C576.8 763.1 574.6 765.3 570.3 768.3C556.1 778.1 533.6 798.7 522.1 812.5C511.9 824.7 506.1 841.4 499.5 878.5L497.2 891.4L500.6 909.5C502.5 919.4 504.5 931.8 505.1 937.0C505.6 942.2 506.5 948.3 507.0 950.6C508.5 957.5 511.8 983.0 512.3 991.8L512.8 1000.0L367.9 1000.0L223.0 1000.0L223.0 993.8C223.0 990.3 224.6 979.0 226.5 968.7C230.0 950.2 230.0 949.6 229.1 935.7C228.1 921.3 228.5 915.3 231.5 894.0C232.5 886.9 233.2 873.2 233.4 858.5C233.8 836.9 233.5 832.8 231.3 817.5L228.7 800.5L221.4 789.8C214.9 780.2 205.0 761.6 205.0 758.9C205.0 758.3 204.6 758.2 204.0 758.5C203.4 758.8 203.0 760.0 203.0 761.1C203.0 762.2 200.8 769.2 198.0 776.8C190.6 797.4 188.9 807.0 188.8 828.0C188.7 856.9 185.6 878.9 176.8 912.5C174.1 923.0 170.6 936.5 169.0 942.5C165.3 956.5 161.0 977.4 160.8 981.6C160.7 985.6 162.2 987.7 166.0 988.5C169.6 989.3 174.0 994.3 174.0 997.6L174.0 1000.0L149.6 1000.0L125.2 1000.0L124.7 997.8Z"},"female":{"front":"M314.4 918.2C313.8 917.8 313.0 916.6 312.6 915.5C311.8 913.6 311.8 913.6 310.9 915.8C310.5 917.0 309.3 918.0 308.3 917.9C305.6 917.8 300.5 914.5 300.5 912.9C300.5 912.1 299.6 911.3 298.5 911.0C297.3 910.6 296.5 909.5 296.5 908.3C296.5 907.1 296.1 905.8 295.7 905.4C294.6 904.3 294.9 899.2 296.0 898.5C296.6 898.2 297.0 897.2 297.0 896.3C297.0 894.6 302.9 884.6 307.9 878.0C311.8 872.8 312.5 871.1 315.2 860.5C317.0 853.3 317.1 851.5 316.1 841.5C315.4 835.5 314.5 825.8 314.0 820.0C313.6 814.2 311.5 797.6 309.4 783.0C305.2 753.7 304.7 736.9 307.5 719.3C308.2 714.5 309.6 705.8 310.5 700.0C312.4 688.2 312.2 658.8 310.2 653.5C306.8 644.6 304.0 621.5 304.0 603.0C304.0 559.0 309.7 524.7 321.5 497.5C326.7 485.5 327.2 483.6 327.4 475.7C327.9 457.0 322.5 428.8 315.7 415.1L312.5 408.6L311.8 413.6C311.3 416.3 310.1 422.6 309.0 427.5C306.1 441.1 301.3 469.4 300.2 479.5C299.6 484.4 296.6 498.6 293.5 511.0C283.3 550.9 282.1 556.7 283.0 560.3C283.4 562.0 284.8 567.8 286.0 573.0C287.2 578.2 289.3 584.4 290.7 586.7C293.7 591.9 293.5 595.5 290.1 595.5C288.2 595.5 287.0 594.3 284.6 589.8C279.8 580.8 278.9 582.1 283.2 591.9C285.4 596.7 284.4 599.4 281.5 597.0C280.0 595.8 280.0 596.0 280.6 598.6C281.0 600.2 281.6 602.2 282.0 603.0C282.7 604.3 283.4 613.5 283.1 616.8C282.9 619.0 280.5 618.0 278.5 614.7C275.8 610.5 272.6 601.1 271.0 593.0C269.3 584.7 268.6 499.4 270.0 483.2C270.6 477.0 272.2 466.4 273.5 459.7C277.8 438.6 278.5 427.2 276.6 411.6C272.1 375.6 275.9 361.7 292.6 352.9C299.6 349.2 317.4 343.7 326.5 342.4C331.8 341.7 343.2 337.9 349.1 334.9C356.9 331.0 358.6 315.5 352.6 304.0C349.8 298.9 348.7 297.6 347.0 297.7C344.7 298.0 343.9 296.5 342.1 288.4C340.7 282.5 341.9 277.6 344.5 278.6C346.1 279.2 346.3 278.5 346.0 273.5C345.7 267.2 348.0 254.1 350.3 248.9C359.6 227.8 390.2 227.9 399.7 248.9C402.0 254.0 404.3 267.8 403.9 274.0C403.7 278.4 403.9 279.2 405.5 278.6C408.2 277.6 409.1 282.2 407.5 289.6C406.0 297.0 405.7 297.5 402.8 297.5C399.2 297.5 394.0 309.1 394.0 317.1C394.0 326.2 394.8 329.5 397.7 332.5C400.9 335.7 413.2 340.3 424.0 342.5C455.1 348.7 468.3 356.3 473.0 370.8C475.4 378.2 475.9 397.0 473.9 407.3C472.2 416.1 472.4 438.8 474.4 448.8C477.8 466.3 478.9 472.9 479.9 482.5C481.4 496.7 480.7 584.4 479.0 593.0C477.5 601.0 474.1 611.0 472.3 613.1C471.6 613.9 471.0 615.1 471.0 615.7C471.0 616.3 470.4 617.3 469.6 617.9C466.2 620.7 465.8 610.2 468.9 600.0C470.3 595.5 470.3 595.5 468.5 597.0C465.5 599.5 464.7 596.6 467.0 591.5C470.2 584.5 469.0 583.1 465.4 589.7C462.9 594.3 461.8 595.5 459.9 595.5C456.7 595.5 456.2 592.0 458.8 587.6C461.0 583.8 463.3 576.9 465.0 568.5C465.7 565.2 466.6 561.3 467.0 559.8C467.9 556.9 465.5 544.5 460.6 527.3C454.2 504.6 450.3 486.3 449.0 472.5C448.1 463.6 446.1 452.4 441.5 430.0C440.6 425.9 439.4 419.4 438.7 415.5L437.5 408.6L434.2 415.2C427.0 429.8 421.8 457.8 422.7 477.2C422.9 483.8 423.7 486.3 430.2 501.5C440.5 525.6 446.0 560.9 446.0 602.5C446.0 622.4 445.2 629.5 440.4 651.9C437.9 663.4 437.8 665.5 438.3 681.4C438.6 692.4 439.6 702.3 440.9 709.3C442.0 715.3 443.2 723.6 443.5 727.8C445.0 748.9 445.0 750.7 442.6 767.0C439.3 789.1 435.8 818.1 434.5 833.3C433.0 850.2 433.0 852.8 434.4 858.8C436.7 868.9 438.6 873.8 442.2 878.3C451.2 889.6 458.1 906.0 453.9 906.0C453.4 906.0 453.1 906.4 453.4 906.9C454.4 908.5 452.9 911.0 451.0 911.0C450.0 911.0 449.3 911.7 449.4 912.6C449.5 914.4 444.6 917.8 441.7 917.9C440.7 918.0 439.5 917.0 439.1 915.8C438.2 913.5 438.2 913.5 437.1 916.3C436.1 918.8 435.6 919.1 432.3 918.8C429.1 918.6 428.2 917.9 426.9 915.2C425.9 913.4 424.1 910.2 422.7 908.2C420.7 905.2 420.1 902.8 419.6 895.2C419.2 889.2 418.4 885.1 417.4 883.5C416.2 881.7 415.9 879.6 416.3 876.4C416.5 873.9 416.3 870.2 415.8 868.2C415.3 866.2 414.7 853.2 414.5 839.5C414.1 810.5 413.5 804.8 405.6 759.6C404.5 753.8 404.0 744.5 404.0 732.4L404.0 714.1L399.9 701.8C397.5 694.4 395.3 685.1 394.4 678.5C393.5 672.5 390.9 659.4 388.5 649.5C381.8 621.9 378.8 603.4 379.7 596.0C380.0 593.5 379.7 589.6 379.1 587.2C378.1 583.5 377.6 583.0 375.0 583.0C372.4 583.0 371.9 583.5 370.9 587.2C370.3 589.6 370.0 593.7 370.4 596.4C371.2 603.7 366.8 629.6 361.0 651.0C359.4 656.8 357.2 668.1 356.1 676.2C354.6 686.7 353.0 693.6 350.3 700.7L346.7 710.5L345.9 734.0C345.4 751.2 344.6 760.5 343.0 768.5C337.0 800.0 335.8 810.7 335.5 838.5C335.3 851.7 334.7 864.5 334.2 866.9C333.6 869.4 333.4 873.5 333.7 876.1C334.1 879.7 333.8 881.6 332.6 883.5C331.4 885.3 330.7 889.1 330.3 895.3C329.8 902.9 329.3 905.2 327.1 908.7C325.7 910.9 323.7 914.2 322.8 915.9C321.1 919.0 317.1 920.1 314.4 918.2Z","side":"M408.5 913.3C407.4 913.1 403.1 911.8 399.0 910.5C390.7 907.9 387.4 907.3 375.1 906.5C359.1 905.4 356.7 901.3 360.5 881.6C363.1 868.3 361.1 839.4 355.6 808.9C349.4 775.1 348.7 768.6 349.3 753.5C350.4 728.0 352.5 713.9 357.6 699.0L362.3 685.5L361.1 673.0C360.5 666.1 359.8 659.4 359.5 658.0C359.3 656.6 358.6 652.6 358.0 649.0C357.3 645.4 356.6 632.1 356.4 619.4C355.9 593.2 355.0 588.9 348.3 579.7C341.1 569.9 337.0 558.0 337.0 546.9C337.0 535.7 340.4 527.8 350.6 514.4C362.1 499.3 366.0 488.2 366.0 470.3C366.0 452.6 364.6 445.6 355.6 420.1C348.7 400.5 345.6 378.4 347.9 364.6C350.1 351.8 351.1 349.7 363.8 333.7C368.6 327.7 371.0 321.1 371.0 313.7C371.0 306.8 369.4 302.8 364.7 297.7C358.9 291.5 355.3 277.6 357.2 268.5C359.5 257.4 366.9 247.7 376.3 243.4C385.3 239.4 399.8 239.3 408.1 243.1C422.4 249.9 432.0 265.5 430.4 279.6C429.8 284.6 430.0 285.4 433.4 291.0C436.5 295.9 436.9 297.3 436.0 299.0C435.4 300.1 434.5 301.0 433.9 301.0C433.4 301.0 433.2 302.1 433.6 303.5C433.9 304.9 433.9 306.8 433.5 307.7C433.1 308.7 432.7 310.6 432.6 311.8C432.5 313.1 431.6 314.6 430.7 315.2C429.7 315.7 429.2 316.5 429.5 317.1C430.5 318.7 427.0 324.8 424.7 325.4C423.5 325.7 419.6 326.0 416.0 326.0C407.9 326.0 407.7 326.1 404.0 334.3C400.9 341.2 400.3 344.4 402.0 345.5C402.6 345.9 404.0 348.0 405.1 350.3C406.3 352.6 409.3 356.6 411.7 359.1C416.8 364.2 419.4 368.4 427.6 384.5C433.4 395.9 439.3 406.2 441.8 409.2C443.1 410.7 443.0 411.6 441.0 416.6C439.7 419.7 438.1 422.4 437.3 422.7C433.9 424.0 432.3 430.2 431.7 444.6C431.3 452.3 430.1 463.3 429.0 469.1C427.7 475.9 427.0 483.7 427.0 491.5C426.9 498.1 426.3 507.1 425.4 511.5C424.6 515.9 423.5 523.4 422.9 528.2C422.4 533.0 421.1 539.9 420.1 543.5C418.1 550.7 418.4 554.8 422.7 581.0C424.0 588.4 424.5 597.0 424.5 610.0C424.5 632.2 422.4 645.1 415.7 666.6C413.2 674.4 410.4 684.1 409.5 688.1C406.6 700.7 405.0 705.2 400.5 713.1C395.5 721.8 394.9 725.3 393.0 754.0C392.4 763.1 391.3 775.5 390.4 781.5C388.1 799.1 387.1 822.7 388.6 828.2C390.2 834.3 393.2 839.2 397.3 842.2C403.3 846.6 405.9 847.4 421.5 849.6C423.7 850.0 426.4 851.0 427.5 852.0C428.6 852.9 431.7 854.5 434.3 855.5C439.9 857.6 440.3 858.1 439.5 861.9C439.1 863.8 437.9 865.2 436.2 865.9C431.9 867.6 413.5 867.5 403.0 865.8C397.8 864.9 393.3 864.4 393.1 864.6C391.9 865.7 396.0 871.7 401.4 876.7C406.0 881.0 409.4 883.2 415.0 885.4C419.1 887.0 424.8 889.3 427.5 890.6C434.6 893.8 440.0 895.8 443.8 896.5C447.0 897.2 448.3 900.1 445.9 901.5C445.3 901.9 445.1 902.9 445.4 903.7C446.2 905.7 439.5 911.7 435.6 912.4C432.8 913.0 426.0 913.1 419.0 912.7C417.6 912.6 415.1 912.8 413.5 913.1C411.9 913.4 409.6 913.5 408.5 913.3Z","back":"M316.3 886.6C314.2 884.9 312.5 881.8 311.1 877.8C309.9 874.4 308.0 870.6 306.9 869.4C303.5 865.8 303.1 858.1 306.1 854.1C307.4 852.4 309.0 851.2 309.7 851.4C310.3 851.7 312.3 851.2 314.0 850.4C316.9 848.9 317.1 848.5 316.6 844.7C316.3 842.4 315.6 835.1 315.0 828.5C314.0 816.4 312.2 804.4 307.4 776.0C302.8 749.7 303.1 738.8 308.6 710.0C310.0 703.1 311.5 696.0 312.1 694.3C313.5 690.1 313.5 658.3 312.1 650.5C311.6 647.2 310.1 639.1 308.8 632.5C306.7 621.3 306.6 618.2 306.9 585.8L307.1 551.1L312.5 529.6C316.6 512.8 318.9 505.6 322.8 497.2C329.6 482.9 330.1 480.4 329.4 466.9C328.6 450.0 320.2 420.3 314.0 412.1C312.3 409.7 312.3 409.8 311.6 416.1C311.2 419.6 309.8 426.8 308.5 432.0C306.2 441.6 304.0 456.9 302.0 478.0C301.4 484.3 300.0 492.9 299.0 497.0C291.9 525.0 286.8 547.2 286.3 551.5C285.9 556.0 286.4 557.5 291.0 567.0C293.9 572.8 297.1 578.7 298.1 580.2C300.3 583.2 300.6 586.6 298.8 587.2C296.6 588.0 295.2 587.0 291.5 581.9C289.6 579.2 287.6 577.0 287.0 577.0C284.0 577.0 283.4 592.0 286.0 600.5C288.2 607.8 288.4 610.9 286.6 611.6C285.7 611.9 285.0 613.1 285.0 614.1C285.0 617.1 282.4 616.3 280.2 612.8C278.3 609.7 275.4 600.4 273.2 590.0C272.6 587.5 272.5 579.2 272.8 571.5C273.5 553.0 273.4 544.5 272.1 526.2C269.9 495.7 270.5 487.5 277.6 449.5C279.8 437.6 279.8 417.7 277.6 409.0C275.2 399.3 274.5 386.2 276.0 378.8C280.0 359.4 289.9 352.4 327.5 342.5C337.7 339.8 349.9 335.2 353.7 332.5C356.8 330.4 357.5 325.8 355.4 321.9C354.5 320.0 353.0 316.3 352.1 313.5C350.9 309.7 350.0 308.4 348.3 308.2C345.9 307.9 345.4 306.3 343.3 295.2C342.3 289.7 343.3 287.4 346.1 288.5C347.2 288.9 347.5 287.1 347.7 279.6C348.1 256.4 356.7 245.8 375.2 245.8C386.7 245.8 394.0 250.1 399.0 260.0C401.2 264.3 403.3 280.2 402.4 285.8C401.9 288.8 402.1 289.1 403.8 288.6C406.6 287.7 408.3 290.1 407.0 293.4C406.5 294.9 406.0 297.1 406.0 298.3C406.0 303.3 404.0 307.8 401.5 308.4C399.7 308.9 398.8 310.1 397.9 313.3C397.3 315.6 395.9 319.2 394.9 321.3C389.7 331.3 395.8 335.2 433.5 345.6C447.4 349.5 459.3 355.1 464.8 360.3C474.5 369.5 477.4 388.1 472.4 409.0C469.5 421.0 469.9 437.4 473.4 455.0C474.3 459.1 475.2 464.1 475.5 466.0C475.8 467.9 476.6 472.9 477.4 477.0C479.2 487.2 479.3 508.4 477.6 533.1C476.6 547.6 476.4 555.8 477.1 561.1C479.3 578.2 475.8 602.7 469.8 612.8C467.6 616.3 465.0 617.1 465.0 614.1C465.0 613.1 464.3 611.9 463.4 611.6C461.6 610.9 461.8 607.6 464.1 600.5C466.4 593.4 465.6 577.0 463.0 577.0C462.4 577.0 460.4 579.2 458.5 581.9C454.4 587.6 452.7 588.5 450.5 586.4C449.1 584.9 449.1 584.5 451.0 581.6C455.5 575.0 464.0 556.2 464.0 553.1C464.0 550.5 456.3 517.4 450.5 495.0C449.7 492.0 448.8 486.1 448.5 482.0C447.1 464.8 443.7 440.9 441.4 431.8C440.1 426.4 438.7 419.3 438.3 415.9L437.7 409.8L435.9 412.1C433.7 414.9 427.6 430.0 426.5 435.0C426.1 436.9 424.7 442.1 423.5 446.5C421.9 452.0 421.0 458.3 420.6 466.7C420.0 480.8 420.8 484.5 427.6 498.5C430.7 504.9 433.5 513.2 437.1 527.5L442.3 547.5L443.0 571.0C444.0 606.8 443.6 618.4 440.6 635.5C439.1 643.8 437.7 651.3 437.4 652.3C436.4 655.4 436.8 689.7 437.9 693.6C439.6 699.9 443.8 722.8 445.1 732.7C446.5 743.4 445.9 759.2 443.6 770.5C441.0 783.9 436.2 817.8 435.0 831.0C434.4 837.9 433.7 844.7 433.4 846.1C433.0 848.4 433.4 849.1 436.1 850.4C437.8 851.3 439.7 851.7 440.2 851.4C440.7 851.1 442.2 852.0 443.6 853.5C447.2 857.4 447.0 864.5 443.0 869.4C441.4 871.5 439.4 875.5 438.6 878.4C436.4 885.9 433.2 888.5 426.3 888.5C417.8 888.5 416.5 886.5 415.4 870.9C415.0 864.1 414.7 852.2 414.8 844.5C415.1 826.7 413.5 806.3 410.4 788.5C404.5 755.0 404.0 750.7 404.4 735.3C404.8 719.4 403.8 713.3 398.6 698.4C397.2 694.5 395.2 684.6 394.0 675.9C392.9 667.4 390.6 655.3 389.0 649.0C381.9 621.2 379.7 608.5 379.6 594.9C379.5 585.5 377.8 580.0 375.0 580.0C372.4 580.0 370.5 585.5 370.7 592.5C371.0 602.9 368.8 616.7 362.5 642.5C360.1 652.4 357.2 667.5 356.0 676.0C354.6 686.0 352.8 694.5 350.9 700.0C345.8 714.7 345.0 719.7 345.7 732.7C346.3 745.8 345.2 758.5 341.5 778.0C336.8 803.2 335.7 813.0 335.5 836.0C334.9 884.8 334.2 887.8 324.4 888.7C320.1 889.2 319.0 888.9 316.3 886.6Z","abs":"M314.4 918.2C313.8 917.8 313.0 916.6 312.6 915.5C311.8 913.6 311.8 913.6 310.9 915.8C310.5 917.0 309.3 918.0 308.3 917.9C305.6 917.8 300.5 914.5 300.5 912.9C300.5 912.1 299.6 911.3 298.5 911.0C297.3 910.6 296.5 909.5 296.5 908.3C296.5 907.1 296.1 905.8 295.7 905.4C294.6 904.3 294.9 899.2 296.0 898.5C296.6 898.2 297.0 897.2 297.0 896.3C297.0 894.6 302.9 884.6 307.9 878.0C311.8 872.8 312.5 871.1 315.2 860.5C317.0 853.3 317.1 851.5 316.1 841.5C315.4 835.5 314.5 825.8 314.0 820.0C313.6 814.2 311.5 797.6 309.4 783.0C305.2 753.7 304.7 736.9 307.5 719.3C308.2 714.5 309.6 705.8 310.5 700.0C312.4 688.2 312.2 658.8 310.2 653.5C306.8 644.6 304.0 621.5 304.0 603.0C304.0 559.0 309.7 524.7 321.5 497.5C326.7 485.5 327.2 483.6 327.4 475.7C327.8 463.2 326.1 449.4 322.5 435.7C318.6 420.5 318.6 420.5 303.4 403.0C286.3 383.3 278.0 369.4 278.0 360.4C278.0 358.7 275.7 350.4 273.0 341.9C264.9 317.2 262.8 308.6 262.8 300.3C262.9 293.3 263.1 292.4 267.1 285.9C269.4 282.1 272.0 278.5 273.0 278.0C276.9 275.9 289.2 275.0 314.6 274.9L341.5 274.9L339.0 272.8C336.3 270.6 335.3 265.2 337.5 264.4C338.2 264.1 340.2 264.6 341.9 265.5C346.1 267.6 346.6 267.1 347.2 260.3C349.2 239.4 368.0 227.7 386.8 235.6C396.0 239.4 402.4 250.3 403.2 263.3C403.4 267.5 403.8 267.6 408.1 265.4C409.8 264.6 411.8 264.1 412.5 264.4C414.7 265.2 413.7 270.6 411.0 272.8L408.5 274.8L436.0 274.9C461.6 275.0 473.1 275.9 477.1 278.0C478.0 278.5 480.6 282.0 482.9 285.9C490.0 297.5 489.1 305.4 476.4 343.9C474.0 351.4 472.0 359.1 472.0 361.0C471.9 370.1 459.8 389.2 441.5 409.0C432.3 418.9 431.1 421.2 427.5 435.2C423.8 449.0 422.1 464.3 422.7 477.2C422.9 483.8 423.7 486.3 430.2 501.5C440.5 525.6 446.0 560.9 446.0 602.5C446.0 622.4 445.2 629.5 440.4 651.9C437.9 663.4 437.8 665.5 438.3 681.4C438.6 692.4 439.6 702.3 440.9 709.3C442.0 715.3 443.2 723.6 443.5 727.8C445.0 748.9 445.0 750.7 442.6 767.0C439.3 789.1 435.8 818.1 434.5 833.3C433.0 850.2 433.0 852.8 434.4 858.8C436.7 868.9 438.6 873.8 442.2 878.3C451.2 889.6 458.1 906.0 453.9 906.0C453.4 906.0 453.1 906.4 453.4 906.9C454.4 908.5 452.9 911.0 451.0 911.0C450.0 911.0 449.3 911.7 449.4 912.6C449.5 914.4 444.6 917.8 441.7 917.9C440.7 918.0 439.5 917.0 439.1 915.8C438.2 913.5 438.2 913.5 437.1 916.3C436.1 918.8 435.6 919.1 432.3 918.8C429.1 918.6 428.2 917.9 426.9 915.2C425.9 913.4 424.1 910.2 422.7 908.2C420.7 905.2 420.1 902.8 419.6 895.2C419.2 889.2 418.4 885.1 417.4 883.5C416.2 881.7 415.9 879.6 416.3 876.4C416.5 873.9 416.3 870.2 415.8 868.2C415.3 866.2 414.7 853.2 414.5 839.5C414.1 810.5 413.5 804.8 405.6 759.6C404.5 753.8 404.0 744.5 404.0 732.4L404.0 714.1L399.9 701.8C397.5 694.4 395.3 685.1 394.4 678.5C393.5 672.5 390.9 659.4 388.5 649.5C381.8 621.9 378.8 603.4 379.7 596.0C380.0 593.5 379.7 589.6 379.1 587.2C378.1 583.5 377.6 583.0 375.0 583.0C372.4 583.0 371.9 583.5 370.9 587.2C370.3 589.6 370.0 593.7 370.4 596.4C371.2 603.7 366.8 629.6 361.0 651.0C359.4 656.8 357.2 668.1 356.1 676.2C354.6 686.7 353.0 693.6 350.3 700.7L346.7 710.5L345.9 734.0C345.4 751.2 344.6 760.5 343.0 768.5C337.0 800.0 335.8 810.7 335.5 838.5C335.3 851.7 334.7 864.5 334.2 866.9C333.6 869.4 333.4 873.5 333.7 876.1C334.1 879.7 333.8 881.6 332.6 883.5C331.4 885.3 330.7 889.1 330.3 895.3C329.8 902.9 329.3 905.2 327.1 908.7C325.7 910.9 323.7 914.2 322.8 915.9C321.1 919.0 317.1 920.1 314.4 918.2ZM322.0 360.1C327.1 356.3 343.8 342.7 349.3 337.8C354.8 332.8 355.9 329.5 356.0 318.0C356.0 311.4 355.6 309.7 352.6 304.0C349.9 298.8 348.7 297.5 346.8 297.5C345.1 297.5 344.3 296.7 343.5 294.2C342.4 290.3 344.0 290.1 324.5 296.3C316.8 298.8 305.4 302.0 299.1 303.3C292.9 304.7 287.5 306.1 287.2 306.5C286.9 306.8 288.0 308.5 289.7 310.3C291.4 312.0 294.4 316.7 296.4 320.6C298.3 324.6 302.1 330.3 304.7 333.3C307.3 336.3 310.8 341.4 312.4 344.6C315.2 350.1 315.3 350.7 314.4 357.2C313.8 361.0 313.6 364.3 313.8 364.5C314.4 365.1 317.7 363.3 322.0 360.1ZM435.9 360.3C433.8 351.3 436.7 343.2 445.5 332.9C448.1 329.9 451.8 324.4 453.7 320.5C455.7 316.6 458.6 311.9 460.3 310.1C463.9 305.9 464.9 306.5 446.0 302.0C438.6 300.3 426.9 297.0 420.2 294.8C413.4 292.6 407.7 291.0 407.6 291.2C407.5 291.4 407.0 292.9 406.4 294.5C405.7 296.7 404.8 297.5 403.1 297.5C401.3 297.5 400.1 298.9 397.4 304.0C394.4 309.7 394.0 311.4 394.0 318.0C394.1 329.5 395.2 332.8 400.7 337.8C415.6 351.1 434.5 365.4 436.0 364.5C436.4 364.2 436.4 362.3 435.9 360.3Z","fdb":"M314.4 918.2C313.8 917.8 313.0 916.6 312.6 915.5C311.8 913.6 311.8 913.6 310.9 915.8C310.5 917.0 309.3 918.0 308.3 917.9C305.6 917.8 300.5 914.5 300.5 912.9C300.5 912.1 299.6 911.3 298.5 911.0C297.3 910.6 296.5 909.5 296.5 908.3C296.5 907.1 296.1 905.8 295.7 905.4C294.6 904.3 294.9 899.2 296.0 898.5C296.6 898.2 297.0 897.2 297.0 896.3C297.0 894.6 302.9 884.6 307.9 878.0C311.8 872.8 312.5 871.1 315.2 860.5C317.0 853.3 317.1 851.5 316.1 841.5C315.4 835.5 314.5 825.8 314.0 820.0C313.6 814.2 311.5 797.6 309.4 783.0C305.2 753.7 304.7 736.9 307.5 719.3C308.2 714.5 309.6 705.8 310.5 700.0C312.4 688.2 312.2 658.8 310.2 653.5C306.8 644.6 304.0 621.5 304.0 603.0C304.0 559.0 309.7 524.7 321.5 497.5C326.7 485.5 327.2 483.6 327.4 475.7C327.8 463.1 326.1 449.4 322.5 435.5C318.5 420.0 317.4 418.1 309.0 413.6C304.7 411.2 303.7 411.1 299.8 412.0C297.4 412.5 278.6 413.9 258.0 415.1C222.6 417.0 220.2 417.3 215.6 419.6C205.6 424.4 195.4 421.9 187.7 412.6C182.4 406.3 181.0 403.1 181.0 397.4C181.0 392.0 183.8 386.2 188.2 382.5C190.0 381.0 193.5 376.1 196.0 371.6C198.5 367.1 207.3 354.7 215.6 344.0C245.1 305.7 242.9 309.1 242.9 302.6C242.9 284.6 261.8 272.4 273.8 282.5C282.9 290.2 282.2 305.7 272.3 315.9C269.4 318.9 267.0 322.0 267.0 322.7C267.0 323.5 263.9 331.3 260.1 340.0C256.1 349.1 253.7 356.0 254.3 356.0C255.0 356.0 259.3 358.5 264.0 361.6C272.0 366.9 272.6 367.1 275.0 365.7C284.8 360.0 309.4 357.0 317.3 360.4L321.2 362.1L328.3 356.3C339.5 347.3 353.1 333.8 354.6 330.3C355.4 328.4 356.0 323.5 356.0 318.8C356.0 311.3 355.7 309.9 352.6 304.0C349.8 298.9 348.7 297.6 347.0 297.7C344.7 298.0 343.9 296.5 342.1 288.4C340.7 282.5 341.9 277.6 344.5 278.6C346.1 279.2 346.3 278.5 346.0 273.5C345.7 267.2 348.0 254.1 350.3 248.9C359.6 227.8 390.2 227.9 399.7 248.9C402.0 254.0 404.3 267.8 403.9 274.0C403.7 278.4 403.9 279.2 405.5 278.6C408.2 277.6 409.1 282.2 407.5 289.6C406.0 297.0 405.7 297.5 402.8 297.5C401.4 297.5 399.9 299.3 397.4 304.0C394.3 309.9 394.0 311.3 394.0 318.8C394.0 323.5 394.6 328.5 395.3 330.3C396.8 333.7 413.6 350.3 423.1 357.6L428.8 362.0L433.2 360.4C441.3 357.5 459.8 359.4 472.1 364.4L478.2 366.9L486.4 361.4C490.8 358.4 495.0 356.0 495.7 356.0C496.3 356.0 493.9 349.2 489.9 340.1C486.1 331.4 483.0 323.4 483.0 322.4C483.0 321.3 481.6 319.6 480.0 318.5C470.3 312.1 466.7 294.3 473.3 285.6C484.5 271.0 506.9 282.1 507.0 302.3L507.0 308.2L523.2 329.3C548.1 361.8 550.4 365.0 554.5 372.3C556.6 376.1 560.0 380.8 562.2 382.8C566.9 387.2 569.0 391.7 569.0 397.6C569.0 403.1 567.6 406.3 562.3 412.6C554.6 421.9 544.4 424.4 534.4 419.6C529.3 417.1 527.1 416.9 481.5 414.4C466.0 413.5 449.7 412.2 447.5 411.5C444.8 410.7 435.2 416.6 432.4 420.7C427.2 428.5 421.9 459.2 422.7 477.2C422.9 483.8 423.7 486.3 430.2 501.5C440.5 525.6 446.0 560.9 446.0 602.5C446.0 622.4 445.2 629.5 440.4 651.9C437.9 663.4 437.8 665.5 438.3 681.4C438.6 692.4 439.6 702.3 440.9 709.3C442.0 715.3 443.2 723.6 443.5 727.8C445.0 748.9 445.0 750.7 442.6 767.0C439.3 789.1 435.8 818.1 434.5 833.3C433.0 850.2 433.0 852.8 434.4 858.8C436.7 868.9 438.6 873.8 442.2 878.3C451.2 889.6 458.1 906.0 453.9 906.0C453.4 906.0 453.1 906.4 453.4 906.9C454.4 908.5 452.9 911.0 451.0 911.0C450.0 911.0 449.3 911.7 449.4 912.6C449.5 914.4 444.6 917.8 441.7 917.9C440.7 918.0 439.5 917.0 439.1 915.8C438.2 913.5 438.2 913.5 437.1 916.3C436.1 918.8 435.6 919.1 432.3 918.8C429.1 918.6 428.2 917.9 426.9 915.2C425.9 913.4 424.1 910.2 422.7 908.2C420.7 905.2 420.1 902.8 419.6 895.2C419.2 889.2 418.4 885.1 417.4 883.5C416.2 881.7 415.9 879.6 416.3 876.4C416.5 873.9 416.3 870.2 415.8 868.2C415.3 866.2 414.7 853.2 414.5 839.5C414.1 810.5 413.5 804.8 405.6 759.6C404.5 753.8 404.0 744.5 404.0 732.4L404.0 714.1L399.9 701.8C397.5 694.4 395.3 685.1 394.4 678.5C393.5 672.5 390.9 659.4 388.5 649.5C381.8 621.9 378.8 603.4 379.7 596.0C380.0 593.5 379.7 589.6 379.1 587.2C378.1 583.5 377.6 583.0 375.0 583.0C372.4 583.0 371.9 583.5 370.9 587.2C370.3 589.6 370.0 593.7 370.4 596.4C371.2 603.7 366.8 629.6 361.0 651.0C359.4 656.8 357.2 668.1 356.1 676.2C354.6 686.7 353.0 693.6 350.3 700.7L346.7 710.5L345.9 734.0C345.4 751.2 344.6 760.5 343.0 768.5C337.0 800.0 335.8 810.7 335.5 838.5C335.3 851.7 334.7 864.5 334.2 866.9C333.6 869.4 333.4 873.5 333.7 876.1C334.1 879.7 333.8 881.6 332.6 883.5C331.4 885.3 330.7 889.1 330.3 895.3C329.8 902.9 329.3 905.2 327.1 908.7C325.7 910.9 323.7 914.2 322.8 915.9C321.1 919.0 317.1 920.1 314.4 918.2Z","bdb":"M316.3 886.6C314.2 884.9 312.5 881.8 311.1 877.8C309.9 874.4 308.0 870.6 306.9 869.4C303.5 865.8 303.1 858.1 306.1 854.1C307.4 852.4 309.0 851.2 309.7 851.4C310.3 851.7 312.3 851.2 314.0 850.4C316.9 848.9 317.1 848.5 316.6 844.7C316.3 842.4 315.6 835.1 315.0 828.5C314.0 816.4 312.2 804.4 307.4 776.0C302.8 749.7 303.1 738.8 308.6 710.0C310.0 703.1 311.5 696.0 312.1 694.3C313.5 690.1 313.5 658.3 312.1 650.5C311.6 647.2 310.1 639.1 308.8 632.5C306.7 621.3 306.6 618.2 306.9 585.8L307.1 551.1L312.5 529.6C316.6 512.8 318.9 505.6 322.8 497.2C325.6 491.3 328.3 484.6 328.9 482.4C331.5 472.5 327.8 446.4 321.3 428.0C317.6 417.5 310.0 411.9 302.0 413.8C299.5 414.4 281.3 416.1 261.5 417.6C229.5 420.0 225.2 420.6 222.8 422.4C215.6 427.6 202.3 424.9 195.8 416.8C186.5 405.4 186.6 396.3 195.9 387.5C198.2 385.3 202.4 380.0 205.2 375.6C208.0 371.3 213.3 364.3 216.9 360.1C247.4 325.6 251.0 321.0 251.0 316.6C251.2 300.0 269.2 287.5 280.0 296.6C289.1 304.3 288.7 318.6 279.1 327.9C276.4 330.5 273.9 333.7 273.5 335.1C273.1 336.4 270.1 342.8 266.9 349.2C263.6 355.7 261.0 361.3 261.0 361.7C261.0 363.0 274.9 371.0 275.5 370.0C277.4 366.8 305.9 360.1 312.1 361.4C315.4 362.0 323.7 356.5 342.0 341.6C346.1 338.2 350.8 334.7 352.3 333.7C356.1 331.2 357.5 327.3 356.0 323.5C355.3 321.9 353.8 317.8 352.6 314.5C350.9 309.9 349.9 308.4 348.2 308.2C345.9 307.9 345.3 306.3 343.3 295.2C342.3 289.7 343.3 287.4 346.1 288.5C347.2 288.9 347.5 287.1 347.7 279.6C348.1 256.4 356.7 245.8 375.2 245.8C386.7 245.8 394.0 250.1 399.0 260.0C401.2 264.3 403.3 280.2 402.4 285.8C401.9 288.8 402.1 289.1 403.8 288.6C406.6 287.7 408.3 290.1 407.0 293.4C406.5 294.9 406.0 297.1 406.0 298.3C406.0 303.3 404.0 307.8 401.5 308.4C399.7 308.9 398.8 310.1 397.9 313.3C397.3 315.6 395.9 319.2 394.9 321.2C393.6 323.7 393.2 325.9 393.6 328.0C394.3 331.3 394.8 331.7 421.2 351.7L433.9 361.3L441.2 361.5C450.4 361.8 462.3 364.3 470.0 367.7L475.9 370.2L480.3 367.7C482.6 366.3 485.6 364.3 486.9 363.3L489.2 361.4L482.6 348.1C479.0 340.8 476.0 334.2 476.0 333.5C476.0 332.9 474.2 330.9 472.1 329.2C459.8 319.4 461.4 297.7 474.6 294.1C485.7 291.2 498.0 301.8 498.6 314.9L498.9 320.5L519.9 345.0C531.4 358.5 543.1 372.9 545.8 377.1C548.5 381.2 551.9 385.5 553.3 386.6C563.4 394.6 563.6 406.5 553.8 417.6C546.5 425.9 535.1 427.3 525.0 421.0C523.7 420.3 489.1 417.3 459.0 415.4C453.8 415.0 448.2 414.2 446.5 413.6C442.9 412.1 436.4 415.3 432.5 420.3C427.6 426.9 421.2 451.8 420.5 467.2C420.0 480.7 420.9 484.7 427.6 498.5C430.7 504.9 433.5 513.2 437.1 527.5L442.3 547.5L443.0 571.0C444.0 606.8 443.6 618.4 440.6 635.5C439.1 643.8 437.7 651.3 437.4 652.3C436.4 655.4 436.8 689.7 437.9 693.6C439.6 699.9 443.8 722.8 445.1 732.7C446.5 743.4 445.9 759.2 443.6 770.5C441.0 783.9 436.2 817.8 435.0 831.0C434.4 837.9 433.7 844.7 433.4 846.1C433.0 848.4 433.4 849.1 436.1 850.4C437.8 851.3 439.7 851.7 440.2 851.4C440.7 851.1 442.2 852.0 443.6 853.5C447.2 857.4 447.0 864.5 443.0 869.4C441.4 871.5 439.4 875.5 438.6 878.4C436.4 885.9 433.2 888.5 426.3 888.5C417.8 888.5 416.5 886.5 415.4 870.9C415.0 864.1 414.7 852.2 414.8 844.5C415.1 826.7 413.5 806.3 410.4 788.5C404.5 755.0 404.0 750.7 404.4 735.3C404.8 719.4 403.8 713.3 398.6 698.4C397.2 694.5 395.2 684.6 394.0 675.9C392.9 667.4 390.6 655.3 389.0 649.0C381.9 621.2 379.7 608.5 379.6 594.9C379.5 585.5 377.8 580.0 375.0 580.0C372.4 580.0 370.5 585.5 370.7 592.5C371.0 602.9 368.8 616.7 362.5 642.5C360.1 652.4 357.2 667.5 356.0 676.0C354.6 686.0 352.8 694.5 350.9 700.0C345.8 714.7 345.0 719.7 345.7 732.7C346.3 745.8 345.2 758.5 341.5 778.0C336.8 803.2 335.7 813.0 335.5 836.0C334.9 884.8 334.2 887.8 324.4 888.7C320.1 889.2 319.0 888.9 316.3 886.6Z","lat":"M314.4 918.2C313.8 917.8 313.0 916.6 312.6 915.5C311.8 913.6 311.8 913.6 310.9 915.8C310.5 917.0 309.3 918.0 308.3 917.9C305.6 917.8 300.5 914.5 300.5 912.9C300.5 912.1 299.6 911.3 298.5 911.0C297.3 910.6 296.5 909.5 296.5 908.3C296.5 907.1 296.1 905.8 295.7 905.4C294.6 904.3 294.9 899.2 296.0 898.5C296.6 898.2 297.0 897.2 297.0 896.3C297.0 894.6 302.9 884.6 307.9 878.0C311.8 872.8 312.5 871.1 315.2 860.5C317.0 853.3 317.1 851.5 316.1 841.5C315.4 835.5 314.5 825.8 314.0 820.0C313.6 814.2 311.5 797.6 309.4 783.0C305.2 753.7 304.7 736.9 307.5 719.3C308.2 714.5 309.6 705.8 310.5 700.0C312.4 688.2 312.2 658.8 310.2 653.5C309.5 651.9 307.9 644.0 306.5 636.0C302.0 610.2 303.7 563.0 310.0 534.7L313.1 520.9L310.8 515.3C309.0 510.9 307.7 509.3 304.0 507.2C286.1 497.0 257.9 477.0 249.4 468.6C235.2 454.4 234.7 447.8 246.6 428.5C258.0 410.3 259.8 406.6 263.9 394.5C273.3 365.9 281.9 354.3 296.1 350.6C299.1 349.8 309.4 347.7 319.0 346.0C334.3 343.2 337.5 342.3 344.5 338.6C354.6 333.3 356.0 331.0 356.0 319.0C356.0 311.2 355.7 309.9 352.6 304.0C349.8 298.9 348.7 297.6 347.0 297.7C344.7 298.0 343.9 296.5 342.1 288.4C340.7 282.5 341.9 277.6 344.5 278.6C346.1 279.2 346.3 278.5 346.0 273.5C345.7 267.2 348.0 254.1 350.3 248.9C359.6 227.8 390.2 227.9 399.7 248.9C402.0 254.0 404.3 267.8 403.9 274.0C403.7 278.4 403.9 279.2 405.5 278.6C408.2 277.6 409.1 282.2 407.5 289.6C406.0 297.0 405.7 297.5 402.8 297.5C401.4 297.5 399.9 299.3 397.4 304.0C394.0 310.3 393.9 310.8 394.2 320.2C394.6 332.1 395.8 334.0 405.9 339.1C411.6 341.9 416.6 343.3 428.3 345.4C459.3 351.0 463.1 352.5 470.9 361.9C475.5 367.4 481.5 380.5 486.6 395.9C488.8 402.5 492.3 410.5 495.0 414.9C497.6 419.1 501.8 425.9 504.3 430.0C510.4 439.8 512.7 448.5 510.9 454.9C508.8 462.9 495.4 475.0 471.0 491.2C459.7 498.6 448.5 505.8 446.1 507.1C442.7 509.0 441.2 510.6 439.3 515.0C436.6 521.1 436.4 518.9 441.1 539.5C445.6 559.3 447.5 611.9 444.5 630.5C443.7 635.5 441.8 645.1 440.4 651.9C437.9 663.4 437.8 665.5 438.3 681.4C438.6 692.4 439.6 702.3 440.9 709.3C442.0 715.3 443.2 723.6 443.5 727.8C445.0 748.9 445.0 750.7 442.6 767.0C439.3 789.1 435.8 818.1 434.5 833.3C433.0 850.2 433.0 852.8 434.4 858.8C436.7 868.9 438.6 873.8 442.2 878.3C451.2 889.6 458.1 906.0 453.9 906.0C453.4 906.0 453.1 906.4 453.4 906.9C454.4 908.5 452.9 911.0 451.0 911.0C450.0 911.0 449.3 911.7 449.4 912.6C449.5 914.4 444.6 917.8 441.7 917.9C440.7 918.0 439.5 917.0 439.1 915.8C438.2 913.5 438.2 913.5 437.1 916.3C436.1 918.8 435.6 919.1 432.3 918.8C429.1 918.6 428.2 917.9 426.9 915.2C425.9 913.4 424.1 910.2 422.7 908.2C420.7 905.2 420.1 902.8 419.6 895.2C419.2 889.2 418.4 885.1 417.4 883.5C416.2 881.7 415.9 879.6 416.3 876.4C416.5 873.9 416.3 870.2 415.8 868.2C415.3 866.2 414.7 853.2 414.5 839.5C414.1 810.5 413.5 804.8 405.6 759.6C404.5 753.8 404.0 744.5 404.0 732.4L404.0 714.1L399.9 701.8C397.5 694.4 395.3 685.1 394.4 678.5C393.5 672.5 390.9 659.4 388.5 649.5C381.8 621.9 378.8 603.4 379.7 596.0C380.0 593.5 379.7 589.6 379.1 587.2C378.1 583.5 377.6 583.0 375.0 583.0C372.4 583.0 371.9 583.5 370.9 587.2C370.3 589.6 370.0 593.7 370.4 596.4C371.2 603.7 366.8 629.6 361.0 651.0C359.4 656.8 357.2 668.1 356.1 676.2C354.6 686.7 353.0 693.6 350.3 700.7L346.7 710.5L345.9 734.0C345.4 751.2 344.6 760.5 343.0 768.5C337.0 800.0 335.8 810.7 335.5 838.5C335.3 851.7 334.7 864.5 334.2 866.9C333.6 869.4 333.4 873.5 333.7 876.1C334.1 879.7 333.8 881.6 332.6 883.5C331.4 885.3 330.7 889.1 330.3 895.3C329.8 902.9 329.3 905.2 327.1 908.7C325.7 910.9 323.7 914.2 322.8 915.9C321.1 919.0 317.1 920.1 314.4 918.2ZM320.8 499.2C321.4 497.7 323.1 493.7 324.5 490.2C329.1 479.1 328.4 458.2 322.5 435.5C318.4 419.5 318.0 418.8 304.4 402.2L302.3 399.7L299.1 405.6C294.0 415.2 274.0 440.5 269.4 443.2C266.3 445.0 264.9 447.0 266.8 447.0C268.1 447.0 275.2 454.4 290.5 471.6C308.1 491.5 318.0 502.0 319.1 502.0C319.5 502.0 320.3 500.8 320.8 499.2ZM459.5 471.6C467.8 462.3 476.5 452.8 479.0 450.4L483.5 446.0L479.3 442.3C476.9 440.2 472.8 435.6 470.0 432.0C456.3 414.4 452.6 409.2 450.3 404.6L447.8 399.6L445.6 402.2C440.8 408.0 434.2 416.7 432.6 419.1C429.7 423.8 424.0 447.8 423.2 459.5C421.7 479.4 422.5 484.9 428.2 496.4L431.2 502.4L437.9 495.4C441.5 491.6 451.3 480.9 459.5 471.6Z","mFront":"M277.4 997.8C277.7 996.5 278.5 987.2 279.1 977.0C280.3 956.7 280.1 955.3 272.5 923.9C266.1 897.4 261.6 852.9 263.9 838.8C264.5 835.1 265.0 829.4 265.0 826.2C265.0 810.3 269.1 768.0 272.0 754.0C275.4 738.1 280.3 717.9 282.0 713.6C282.5 712.1 283.0 709.9 283.0 708.8C283.0 707.7 286.2 699.7 290.0 691.2C298.5 672.4 299.5 667.2 298.6 647.9C297.7 628.9 296.6 621.4 292.5 606.0C289.4 594.7 288.3 591.9 285.5 589.0C281.5 584.8 278.0 578.0 278.0 574.5C278.0 573.1 277.6 572.0 277.0 572.0C276.4 572.0 276.0 572.8 276.0 573.8C276.0 574.8 275.3 578.3 274.4 581.5C273.6 584.8 271.8 594.0 270.5 602.0C269.2 610.0 267.2 620.8 266.1 626.0C265.0 631.2 263.6 640.2 263.0 646.0C261.3 662.8 259.3 672.7 251.3 704.5C234.3 772.2 234.3 771.8 236.5 776.0C238.0 778.9 238.1 780.9 237.4 792.4C236.4 808.7 236.3 808.4 240.5 814.6C244.3 820.2 244.8 822.1 242.5 824.0C241.3 825.0 240.7 825.0 239.5 824.0C238.1 822.8 238.1 823.0 239.1 825.6C244.6 839.3 245.1 842.7 242.3 845.5C241.3 846.6 239.6 847.0 237.8 846.8C235.5 846.4 235.0 846.6 235.6 847.9C239.1 856.4 238.9 861.7 235.0 862.7C233.6 863.1 233.1 863.8 233.5 865.0C234.0 866.6 230.6 872.1 229.8 871.0C224.0 863.3 218.3 849.1 217.1 838.9C216.5 834.8 215.9 830.8 215.6 830.0C215.3 829.2 214.8 823.8 214.6 818.0C214.3 812.2 213.8 803.0 213.4 797.5C213.0 791.1 213.2 784.2 214.0 778.5C215.2 769.9 215.2 759.8 214.5 701.0C214.2 678.6 216.1 655.4 220.5 629.0C226.5 592.3 227.3 574.3 223.9 551.5C220.7 530.5 220.7 505.1 223.8 495.1C226.4 486.9 234.3 474.3 238.7 471.3C250.8 462.9 275.1 453.7 300.0 448.1C313.9 445.0 326.4 440.8 334.9 436.6C341.2 433.3 343.4 428.7 343.5 418.0C343.5 410.6 343.3 410.0 340.2 406.3C336.3 401.7 332.3 393.7 330.7 387.2C329.7 383.2 329.1 382.5 327.3 382.8C324.4 383.2 323.8 382.0 322.3 371.6C321.6 366.6 320.7 361.0 320.4 359.3C319.4 353.9 320.6 350.9 323.5 351.6L326.0 352.2L326.0 340.9C326.1 309.3 332.7 293.6 349.3 285.5C358.6 281.0 363.6 280.0 374.0 280.5C402.2 281.7 417.0 301.6 417.4 338.7C417.5 350.9 417.8 351.7 420.9 350.0C422.8 349.0 423.2 349.3 424.6 352.6C425.5 354.7 425.9 357.5 425.6 358.9C425.3 360.3 424.4 364.6 423.5 368.5C421.1 379.5 420.3 381.0 416.5 381.0C412.5 381.0 410.0 381.9 410.0 383.2C410.0 383.8 408.2 388.0 406.0 392.6C401.6 401.8 401.1 406.1 403.0 419.3C404.3 428.0 406.0 431.2 411.3 434.8C415.8 438.0 428.9 445.0 430.2 445.0C430.6 445.0 431.0 433.8 431.0 420.2L431.0 395.4L465.5 395.1L500.0 394.8L499.3 429.7L498.7 464.6L504.7 466.3C508.8 467.4 512.9 469.6 517.5 473.2C535.0 486.7 543.2 509.4 542.7 543.0C542.6 555.9 542.7 556.9 545.9 566.5C549.4 577.1 551.9 582.7 559.5 598.0C569.9 618.9 570.7 624.3 565.3 635.8C558.6 650.1 551.0 652.7 532.7 646.8C518.4 642.2 509.9 630.9 483.5 581.0C473.4 561.9 471.6 559.0 470.5 559.3C468.1 560.1 462.1 572.3 459.3 582.0C448.9 617.6 447.7 623.4 446.6 643.9C445.3 669.9 445.8 672.1 457.3 693.0C462.0 701.7 463.9 707.7 471.6 738.9C480.8 776.1 480.7 776.0 481.6 814.0C483.1 883.3 481.9 900.3 473.3 933.5C469.9 946.4 468.7 979.3 471.3 988.8C472.1 992.0 473.1 995.7 473.4 997.2L474.0 1000.0L443.1 1000.0L412.2 1000.0L409.2 992.8C403.9 980.1 401.0 968.9 399.4 955.4C397.8 941.3 396.4 934.0 387.7 896.0C381.0 866.8 379.8 857.9 380.0 840.0C380.1 832.6 380.1 826.0 380.1 825.3C380.0 824.5 378.6 824.7 375.5 826.1C372.7 827.3 370.1 827.9 368.8 827.4C366.7 826.8 366.7 826.9 367.3 836.1C367.7 843.7 367.4 847.9 365.4 857.8C364.1 864.6 363.0 871.1 363.0 872.2C363.0 875.4 356.4 904.3 351.5 922.8C348.8 933.0 346.9 942.5 346.5 947.8C345.4 964.0 342.5 976.8 337.2 989.0C336.6 990.4 335.6 993.4 335.0 995.8L333.9 1000.0L305.3 1000.0L276.8 1000.0L277.4 997.8Z","mSide":"M338.0 995.4C338.0 985.1 342.8 964.6 349.0 949.1C352.3 940.5 354.1 926.3 352.9 917.2C352.4 912.9 351.3 904.1 350.4 897.5C349.6 890.9 348.7 884.8 348.5 884.0C347.2 879.9 345.9 864.4 345.0 845.0C344.0 820.2 343.4 817.7 334.2 796.9C327.2 781.3 324.8 771.0 325.0 757.4C325.1 742.7 328.5 733.2 338.5 720.0C340.8 717.0 343.5 712.9 344.5 711.0C345.5 709.1 348.2 705.0 350.6 702.0C353.3 698.5 355.8 693.6 357.5 688.5C360.1 680.7 360.2 680.0 359.6 662.5C359.0 639.6 355.8 625.2 347.9 609.8C346.8 607.6 343.9 599.7 341.4 592.2C330.6 558.9 330.2 547.8 338.8 525.4C343.1 514.3 344.7 511.6 357.8 494.3C367.5 481.4 370.4 468.9 365.8 460.0C363.8 456.1 363.0 455.4 359.6 455.0C354.9 454.4 352.6 450.7 350.8 441.2C349.8 435.9 349.9 434.8 351.4 432.5C352.3 431.1 353.5 430.2 353.9 430.4C354.3 430.7 355.0 425.3 355.2 418.5C355.9 403.9 358.7 396.2 366.0 389.2C377.1 378.3 396.1 376.0 410.4 383.8C421.3 389.8 425.0 398.4 427.6 424.0C429.5 443.0 429.2 445.9 425.0 459.5C421.2 471.9 418.2 477.1 412.5 481.0C408.4 483.8 408.0 484.5 406.4 491.6C404.1 502.1 404.8 508.3 408.8 511.9C410.5 513.5 413.0 516.9 414.3 519.6C415.7 522.3 419.1 527.0 422.0 530.0C424.8 533.0 428.1 537.3 429.2 539.5C430.4 541.7 432.5 545.3 434.0 547.5C435.5 549.7 437.1 552.6 437.5 554.0C437.9 555.4 440.7 561.1 443.8 566.8C450.2 578.7 449.0 578.9 458.3 564.0C461.8 558.2 467.9 548.5 471.8 542.4C479.7 529.9 480.9 527.0 478.6 527.0C477.1 527.0 477.0 521.8 477.2 475.2L477.5 423.5L501.8 423.2L526.0 423.0L526.1 425.2C526.1 426.5 526.1 437.2 526.0 449.2C525.9 463.1 526.3 471.0 526.9 471.4C527.5 471.8 528.6 474.4 529.5 477.2C531.0 482.3 531.0 482.5 528.5 486.2C526.1 489.9 526.0 490.4 526.0 508.5L526.0 527.0L516.6 527.0L507.2 527.0L505.1 531.2C501.9 538.1 499.3 545.1 490.5 570.5C474.5 617.1 468.4 632.4 461.1 644.5C457.9 649.8 456.5 651.0 449.0 655.1C437.5 661.4 437.4 661.6 437.8 677.6C437.9 685.5 437.5 694.6 436.6 700.2C434.6 713.2 432.2 728.3 430.8 736.3C429.7 742.9 430.8 756.7 434.0 773.5C437.4 792.0 435.4 825.8 429.5 849.5C428.1 855.0 426.7 862.4 426.4 866.0C425.7 873.0 420.1 897.0 417.0 906.0C416.0 909.0 413.5 917.8 411.5 925.5C407.2 942.5 405.7 947.1 402.5 953.4C401.1 956.1 400.0 959.7 400.0 961.5C400.0 963.2 399.4 969.7 398.6 976.0C397.8 982.3 396.8 990.3 396.5 993.8L395.8 1000.0L366.9 1000.0L338.0 1000.0L338.0 995.4Z","mBack":"M294.4 998.2C294.7 997.3 295.9 992.5 297.0 987.5C298.2 982.5 300.3 973.8 301.8 968.0C305.9 951.8 305.5 934.1 300.5 902.5C296.7 878.9 296.6 878.1 296.7 852.2L296.8 825.9L294.2 824.9C292.7 824.3 289.4 821.8 286.8 819.3C282.2 814.8 282.0 814.7 280.1 816.4C275.1 820.9 274.8 828.0 278.6 843.1C280.7 851.4 281.2 854.5 280.4 855.8C278.4 858.9 276.7 857.5 274.2 850.7C272.8 847.0 271.6 844.1 271.4 844.3C271.0 844.7 272.6 858.8 273.5 863.1C273.9 864.8 273.4 866.5 272.1 868.1L270.2 870.5L268.9 867.7L267.7 865.0L266.6 867.3C264.0 872.3 262.7 869.9 260.3 856.0C257.6 840.1 257.5 834.4 259.1 815.0C260.8 795.1 260.7 789.6 258.1 766.5C254.9 737.4 254.4 718.8 256.5 707.0C260.6 683.9 262.1 671.5 262.7 657.5C263.2 643.0 263.1 642.1 260.1 630.0C253.2 602.8 255.5 584.9 267.8 571.6C275.4 563.4 293.0 556.2 319.5 550.5C343.8 545.3 351.2 541.8 357.6 532.3C362.0 525.9 363.0 522.1 363.0 512.2C363.0 504.4 361.4 500.4 355.7 494.3C350.2 488.3 348.4 484.9 346.4 476.3C342.1 458.0 349.3 440.8 365.0 432.0C382.3 422.2 404.5 423.5 418.9 435.2C426.6 441.4 430.4 447.4 434.0 458.9C437.1 468.8 437.6 472.5 436.1 473.5C435.5 473.8 434.8 476.0 434.4 478.5C433.9 482.2 434.2 483.7 436.4 487.4C439.5 492.7 439.7 495.4 437.0 497.3C435.3 498.5 435.2 499.0 436.2 501.7C436.9 503.5 437.0 505.5 436.5 506.6C436.0 507.6 435.6 509.6 435.4 511.0C435.1 515.2 431.1 525.2 429.3 526.6C428.1 527.5 424.5 527.9 419.2 528.0C406.9 528.0 403.0 530.9 403.0 540.0C403.0 548.6 406.2 552.5 420.2 561.1C430.7 567.6 432.8 568.5 443.8 570.5C450.4 571.7 451.7 571.6 458.3 569.9C476.2 565.1 490.9 566.4 512.0 574.7C518.3 577.2 531.0 581.4 540.1 584.1C549.2 586.8 558.8 589.9 561.4 591.0C565.7 592.8 566.1 592.8 565.6 591.2C562.9 581.9 561.6 576.0 559.1 560.5C557.4 550.6 554.9 532.4 553.5 520.0C552.0 507.7 550.6 497.2 550.4 496.8C550.1 496.4 546.5 496.0 542.4 496.0L534.9 496.0L535.6 447.8C536.0 421.2 536.3 399.4 536.4 399.4C536.4 399.3 547.0 399.1 559.7 398.9L583.0 398.5L583.0 423.0C583.0 436.5 582.8 448.6 582.6 450.0C582.3 451.4 582.1 462.3 582.1 474.2L582.0 496.0L576.5 496.0C572.4 496.0 571.0 496.4 571.0 497.4C571.0 498.2 575.1 508.0 580.1 519.2C585.1 530.3 591.6 545.1 594.5 552.0C597.4 558.9 600.7 566.6 601.8 569.0C604.1 574.3 608.3 587.1 610.4 595.3C612.0 601.8 612.0 601.8 602.9 613.2C600.5 616.2 598.0 619.4 597.5 620.4C596.1 622.8 580.2 625.9 567.7 626.2C562.1 626.3 546.7 625.7 533.5 624.7C520.3 623.8 505.5 622.8 500.6 622.4C495.8 622.1 491.2 621.6 490.5 621.4C488.0 620.4 479.9 625.3 471.8 632.9C467.2 637.2 460.8 642.6 457.4 645.1C447.2 652.5 445.8 654.8 441.7 670.0C437.5 685.7 435.5 702.7 436.2 717.7C436.7 727.7 436.8 728.2 442.2 739.3C445.3 745.6 448.1 752.7 448.4 755.1C448.8 757.5 450.9 766.7 453.0 775.5C455.1 784.3 457.6 794.6 458.5 798.3C460.7 807.8 463.2 844.9 463.1 867.4C463.0 887.9 462.1 895.1 456.3 923.0C452.7 940.0 452.6 941.1 452.6 962.5C452.5 974.6 452.9 988.0 453.3 992.2L454.1 1000.0L429.2 1000.0L404.4 1000.0L402.2 993.2C399.7 985.4 398.1 974.5 398.0 965.0C398.0 955.9 395.7 941.6 391.1 921.6C385.1 895.7 381.0 869.6 381.7 861.3L382.2 854.5L378.1 850.5C375.5 848.1 374.0 847.1 373.9 848.0C372.2 872.6 370.8 881.0 364.3 906.0C362.3 913.4 360.2 923.5 359.5 928.5C357.7 941.1 350.5 969.8 346.5 980.0C344.7 984.7 342.4 991.1 341.5 994.2L339.9 1000.0L316.9 1000.0C295.4 1000.0 293.9 999.9 294.4 998.2ZM295.6 814.6C294.6 810.5 296.8 797.7 303.0 772.4C309.1 747.7 311.3 741.3 316.9 732.5C322.3 724.0 324.3 715.4 324.4 700.5C324.5 688.0 324.3 687.0 320.6 675.5C316.4 662.2 311.9 652.7 305.7 643.6L301.6 637.6L300.4 644.5C299.8 648.4 298.5 654.2 297.7 657.5C295.5 666.0 292.2 691.9 291.0 709.5C290.1 723.4 285.1 750.8 278.6 776.7C275.3 790.1 275.4 791.6 279.9 796.1C282.1 798.3 284.8 801.8 286.0 803.8C288.4 807.9 295.2 817.0 295.8 817.0C296.0 817.0 295.9 815.9 295.6 814.6Z","mFlex":"M277.4 997.8C277.7 996.5 278.5 987.2 279.1 977.0C280.3 956.7 280.1 955.3 272.5 923.9C266.1 897.4 261.6 852.9 263.9 838.8C264.5 835.1 265.0 829.4 265.0 826.2C265.0 810.3 269.1 768.0 272.0 754.0C275.4 738.1 280.3 717.9 282.0 713.6C282.5 712.1 283.0 709.9 283.0 708.8C283.0 707.7 286.2 699.7 290.0 691.2C298.5 672.4 299.5 667.2 298.6 647.9C297.7 628.9 296.6 621.4 292.5 606.0C289.4 594.6 288.3 591.9 285.5 589.0C282.4 585.8 275.0 572.0 275.0 569.5C275.0 568.2 268.8 562.2 264.3 559.1L261.2 557.0L237.8 558.5C225.0 559.3 211.1 560.2 207.0 560.5C202.9 560.8 186.2 561.9 170.0 562.9C140.5 564.8 140.5 564.8 134.1 568.0C114.8 577.6 95.1 569.8 84.0 548.1C79.0 538.1 82.0 524.1 91.3 514.9C94.3 512.0 97.9 506.5 101.4 499.9C108.0 487.0 108.5 486.2 119.5 470.7C142.8 437.8 155.6 419.8 161.1 412.1L167.2 403.8L167.3 393.6C167.5 384.9 167.9 382.7 170.2 377.8C176.0 365.3 187.9 356.6 198.9 356.8C225.8 357.2 234.0 393.6 212.0 415.1C208.7 418.3 206.0 421.8 206.0 422.9C206.0 424.0 203.5 431.3 200.4 439.2C197.3 447.1 193.3 457.4 191.4 462.2C189.5 467.1 188.0 471.2 188.0 471.5C188.0 471.8 190.4 473.1 193.2 474.5C199.1 477.2 201.7 478.7 210.5 484.4C216.0 488.0 216.7 488.2 219.5 487.0C233.5 481.3 238.9 479.8 253.6 477.5C274.2 474.3 274.5 474.3 287.5 478.5C290.8 479.5 306.8 466.7 330.8 443.9L342.1 433.1L343.1 426.3C344.6 415.8 343.2 409.1 338.4 404.0C335.7 401.1 332.2 393.6 330.6 387.1C329.7 383.2 329.1 382.5 327.3 382.8C324.4 383.2 323.8 382.0 322.3 371.6C321.6 366.6 320.7 361.0 320.4 359.3C319.4 353.9 320.6 350.9 323.5 351.6L326.0 352.2L326.0 340.9C326.1 309.3 332.7 293.6 349.3 285.5C358.6 281.0 363.6 280.0 374.0 280.5C402.2 281.7 417.0 301.6 417.4 338.7C417.5 350.9 417.8 351.7 420.9 350.0C422.8 349.0 423.2 349.3 424.6 352.6C425.5 354.7 425.9 357.5 425.6 358.9C425.3 360.3 424.4 364.6 423.5 368.5C421.1 379.5 420.3 381.0 416.5 381.0C412.5 381.0 410.0 381.9 410.0 383.2C410.0 383.8 408.2 388.0 406.0 392.6C401.6 401.8 401.1 406.1 403.0 419.3C404.3 428.0 406.0 431.2 411.3 434.8C415.8 438.0 428.9 445.0 430.2 445.0C430.6 445.0 431.0 433.8 431.0 420.2L431.0 395.4L465.5 395.1L500.0 394.8L499.3 429.7L498.7 464.6L504.7 466.3C508.8 467.4 512.9 469.6 517.5 473.2C535.0 486.7 543.2 509.4 542.7 543.0C542.6 555.9 542.7 556.9 545.9 566.5C549.4 577.1 551.9 582.7 559.5 598.0C569.9 618.9 570.7 624.3 565.3 635.8C558.6 650.1 551.0 652.7 532.7 646.8C518.4 642.2 509.9 630.9 483.5 581.0C473.4 561.9 471.6 559.0 470.5 559.3C468.1 560.1 462.1 572.3 459.3 582.0C448.9 617.6 447.7 623.4 446.6 643.9C445.3 669.9 445.8 672.1 457.3 693.0C462.0 701.7 463.9 707.7 471.6 738.9C480.8 776.1 480.7 776.0 481.6 814.0C483.1 883.3 481.9 900.3 473.3 933.5C469.9 946.4 468.7 979.3 471.3 988.8C472.1 992.0 473.1 995.7 473.4 997.2L474.0 1000.0L443.1 1000.0L412.2 1000.0L409.2 992.8C403.9 980.1 401.0 968.9 399.4 955.4C397.8 941.3 396.4 934.0 387.7 896.0C381.0 866.8 379.8 857.9 380.0 840.0C380.1 832.6 380.1 826.0 380.1 825.3C380.0 824.5 378.6 824.7 375.5 826.1C372.7 827.3 370.1 827.9 368.8 827.4C366.7 826.8 366.7 826.9 367.3 836.1C367.7 843.7 367.4 847.9 365.4 857.8C364.1 864.6 363.0 871.1 363.0 872.2C363.0 875.4 356.4 904.3 351.5 922.8C348.8 933.0 346.9 942.5 346.5 947.8C345.4 964.0 342.5 976.8 337.2 989.0C336.6 990.4 335.6 993.4 335.0 995.8L333.9 1000.0L305.3 1000.0L276.8 1000.0L277.4 997.8Z","selfie":"M163.6 993.0C162.7 989.1 161.2 982.7 160.3 978.8C158.4 971.2 157.8 940.9 159.3 927.3C159.9 921.5 158.4 894.4 156.1 868.5C155.6 862.5 154.9 853.2 154.6 848.0C154.3 842.8 153.6 834.6 153.0 829.9C151.8 820.3 153.3 765.7 155.0 756.0C156.1 750.3 156.5 722.4 155.6 716.7C155.3 714.9 154.8 708.0 154.5 701.4C154.2 694.7 153.7 687.9 153.4 686.4C153.2 684.8 152.3 679.7 151.6 675.0C150.8 670.3 149.6 662.9 149.0 658.5C148.4 654.1 146.3 644.0 144.4 636.1C142.5 628.1 140.7 618.7 140.5 615.1C140.2 611.5 139.7 607.0 139.4 605.2C138.8 601.5 142.3 582.9 144.7 577.2C146.5 572.9 155.7 557.6 160.6 550.9C164.5 545.6 170.6 541.7 186.5 534.3C207.1 524.7 220.1 521.1 260.6 513.6C285.5 509.0 291.7 507.5 303.0 503.4C315.0 499.0 319.0 497.2 319.0 496.3C318.9 495.8 316.7 492.6 313.9 489.0C306.5 479.3 301.5 468.5 296.0 449.6C293.3 440.3 290.9 432.6 290.8 432.5C290.6 432.4 289.1 431.8 287.5 431.3C283.7 430.1 282.1 425.8 280.8 414.0C278.7 393.8 278.4 391.4 277.2 389.3C275.7 386.7 275.6 377.6 277.0 375.0C278.0 373.1 278.1 373.1 281.3 375.0C283.0 376.1 284.9 377.0 285.4 377.0C285.8 377.0 285.9 369.2 285.5 359.8C283.1 296.7 300.7 264.4 344.0 252.4C352.1 250.1 378.3 249.8 387.5 251.9C413.4 257.7 429.8 271.4 439.8 295.5C442.6 302.1 445.3 310.4 445.9 314.0C448.3 329.2 449.2 346.0 448.6 361.8C447.8 379.8 447.8 379.7 454.2 376.4C457.3 374.8 457.5 374.8 459.2 376.9C462.1 380.6 462.4 385.3 460.1 392.2C458.9 395.6 458.0 399.5 458.0 400.9C458.0 405.1 454.9 420.1 452.8 426.2C450.6 432.3 450.4 432.5 440.8 434.5C438.4 435.0 437.8 435.9 436.0 442.3C431.9 456.1 427.8 466.9 423.9 473.5C418.4 482.9 418.9 491.3 425.3 496.5C437.5 506.7 484.6 533.9 526.5 555.0C562.2 573.1 569.4 576.0 577.9 576.0C586.8 576.0 595.5 577.8 605.3 581.7C613.7 585.0 615.2 586.0 622.6 593.5C627.2 598.1 632.6 604.9 635.0 609.0C639.2 616.2 639.2 616.3 640.0 629.4C641.1 645.8 640.2 651.9 634.5 669.7C630.7 681.6 630.0 685.0 630.0 691.9C630.0 708.9 634.7 730.8 640.0 738.4C648.7 751.2 658.5 775.2 664.3 798.5L667.8 812.5L668.4 846.0C668.8 864.4 669.5 884.2 670.1 890.0C670.9 897.2 671.0 907.7 670.4 923.5C669.9 936.1 669.5 958.5 669.5 973.3L669.5 1000.0L614.2 1000.0L559.0 1000.0L559.0 994.4C559.0 991.4 558.1 984.5 557.0 979.2C553.4 961.7 541.6 885.6 538.5 860.5C537.7 853.8 535.2 836.5 533.5 826.0C532.4 818.7 532.4 814.1 533.5 795.5C536.1 755.5 535.8 750.8 529.9 728.1C527.1 717.3 524.7 708.3 524.5 708.2C524.3 708.0 523.2 709.7 522.0 712.0C520.8 714.3 516.1 721.5 511.6 727.9C503.3 739.4 500.6 745.3 498.0 757.4C497.4 760.1 493.6 770.9 489.6 781.4C481.2 803.3 479.6 809.3 477.5 828.0C474.8 852.4 474.9 853.1 487.6 871.6C494.3 881.5 499.1 890.9 501.5 899.0C508.9 923.7 522.0 984.7 522.0 994.2L522.0 1000.0L372.8 999.8C274.0 999.6 223.6 999.2 223.7 998.5C223.7 998.0 224.7 987.6 225.9 975.5C227.0 963.4 228.4 948.6 229.0 942.7C229.9 933.3 236.0 902.1 238.9 892.0C239.5 890.1 240.4 885.4 240.9 881.7C241.6 876.5 243.6 871.3 249.9 858.5C257.1 843.6 257.8 841.7 256.9 838.8C255.1 832.6 253.0 817.5 253.0 810.6C253.0 799.3 249.1 786.0 245.7 786.0C240.1 786.0 225.1 778.5 221.0 773.6C219.7 771.9 219.6 771.9 218.9 773.7C218.5 774.7 218.1 777.7 218.1 780.5C217.9 789.3 214.9 811.3 212.4 821.5C211.0 827.0 208.3 838.7 206.4 847.5C204.5 856.3 200.9 871.6 198.5 881.5C194.6 897.4 190.0 919.5 190.0 922.0C190.0 922.5 191.2 924.0 192.7 925.4C195.8 928.3 198.0 934.6 198.0 940.7C198.0 946.9 199.4 949.5 204.5 953.0C210.7 957.2 212.6 960.3 211.2 963.5C209.7 966.7 208.3 966.6 201.3 963.1C197.1 960.9 195.3 960.4 194.8 961.3C193.0 964.1 194.3 967.5 200.6 975.7C207.8 985.2 208.8 989.7 204.3 992.7C202.2 994.1 201.7 993.9 196.2 988.6C193.0 985.5 190.0 983.3 189.7 983.7C188.6 984.7 190.2 989.3 193.2 993.7C194.7 996.0 196.0 998.3 196.0 998.9C196.0 999.6 190.9 1000.0 180.6 1000.0L165.2 1000.0L163.6 993.0Z"}};
const POSE_LN = {"male":{"front":{"headtop":0.1883,"shoulder":0.3384,"hip":0.543,"navel":0.4978,"feet":0.9393,"cx":0.5},"side":{"headtop":0.1951,"shoulder":0.3404,"hip":0.5431,"navel":0.4977,"feet":0.9392,"cx":0.4961},"back":{"headtop":0.2019,"shoulder":0.3427,"hip":0.5434,"navel":0.4978,"feet":0.9393,"cx":0.5},"abs":{"headtop":0.1883,"shoulder":0.3384,"hip":0.543,"navel":0.4978,"feet":0.9393,"cx":0.5},"fdb":{"headtop":0.1883,"shoulder":0.3384,"hip":0.543,"navel":0.4978,"feet":0.9393,"cx":0.5},"bdb":{"headtop":0.2019,"shoulder":0.3427,"hip":0.5434,"navel":0.4978,"feet":0.9393,"cx":0.5},"lat":{"headtop":0.1883,"shoulder":0.3384,"hip":0.543,"navel":0.4978,"feet":0.9393,"cx":0.5},"mFront":{"headtop":0.2118,"shoulder":0.4488,"hip":0.7566,"navel":0.69,"feet":1.3327,"cx":0.5009},"mSide":{"headtop":0.3226,"shoulder":0.5051,"hip":0.7531,"navel":0.6981,"feet":1.2231,"cx":0.4953},"mBack":{"headtop":0.4047,"shoulder":0.5854,"hip":0.836,"navel":0.7799,"feet":1.2848,"cx":0.4987},"mFlex":{"headtop":0.2118,"shoulder":0.4488,"hip":0.7566,"navel":0.69,"feet":1.3327,"cx":0.5009},"selfie":{"headtop":0.1957,"shoulder":0.5981,"hip":0.9757,"navel":0.9042,"feet":1.4738,"cx":0.502}},"female":{"front":{"headtop":0.2287,"shoulder":0.3667,"hip":0.5492,"navel":0.4982,"feet":0.8826,"cx":0.5},"side":{"headtop":0.2335,"shoulder":0.3681,"hip":0.5486,"navel":0.4981,"feet":0.8825,"cx":0.5087},"back":{"headtop":0.2384,"shoulder":0.3697,"hip":0.5483,"navel":0.4982,"feet":0.8826,"cx":0.5},"abs":{"headtop":0.2287,"shoulder":0.3667,"hip":0.5492,"navel":0.4982,"feet":0.8826,"cx":0.5},"fdb":{"headtop":0.2287,"shoulder":0.3667,"hip":0.5492,"navel":0.4982,"feet":0.8826,"cx":0.5},"bdb":{"headtop":0.2384,"shoulder":0.3697,"hip":0.5483,"navel":0.4982,"feet":0.8826,"cx":0.5},"lat":{"headtop":0.2287,"shoulder":0.3667,"hip":0.5492,"navel":0.4982,"feet":0.8826,"cx":0.5},"mFront":{"headtop":0.2703,"shoulder":0.4877,"hip":0.7672,"navel":0.6868,"feet":1.2515,"cx":0.4984},"mSide":{"headtop":0.3708,"shoulder":0.5348,"hip":0.7507,"navel":0.6902,"feet":1.1384,"cx":0.5103},"mBack":{"headtop":0.4146,"shoulder":0.5832,"hip":0.8028,"navel":0.7454,"feet":1.1926,"cx":0.5025},"mFlex":{"headtop":0.2703,"shoulder":0.4877,"hip":0.7672,"navel":0.6868,"feet":1.2515,"cx":0.4984},"selfie":{"headtop":0.2237,"shoulder":0.591,"hip":0.9519,"navel":0.851,"feet":1.3871,"cx":0.4953}}};
const POSE_SRC = { sideL: 'side', schest: 'side' };
const POSE_FLIP = { sideL: true };
const RENDER_HAND = { mFront: 'right', mFlex: 'right', mSide: 'left', mBack: 'left', selfie: 'right' };
const BODIES = [['male', 'Man'], ['female', 'Woman']];
const bodyKey = () => lsGet('outlineBody') === 'female' ? 'female' : 'male';
function poseSpec(pose, hand) {
  const src = POSE_SRC[pose] || pose; const b = bodyKey(); const P = POSE_PATH[b] || POSE_PATH.male, L = POSE_LN[b] || POSE_LN.male;
  const d = P[src] || P.front; const ln = L[src] || L.front;
  let flip = !!POSE_FLIP[pose];
  if (HANDED.has(pose) && RENDER_HAND[pose] && (hand || 'right') !== RENDER_HAND[pose]) flip = !flip;
  return { d, ln, flip, key: b + '|' + src + (flip ? '|F' : '') };
}
const POSE_IMG = {};
function poseImage(pose, hand) {
  const sp = poseSpec(pose, hand); if (POSE_IMG[sp.key] != null) return POSE_IMG[sp.key];
  const W = 375, H = 500; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); if (!g) return '';
  g.fillStyle = '#ffffff'; if (sp.flip) { g.translate(W, 0); g.scale(-0.5, 0.5); } else g.scale(0.5, 0.5);
  try { g.fill(new Path2D(sp.d), 'evenodd'); } catch (e) { POSE_IMG[sp.key] = ''; return ''; }
  g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.getImageData(0, 0, W, H); const d = im.data; let a = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3] / 255;
  const blur = (src, r) => { const t = new Float32Array(W * H), o = new Float32Array(W * H), n = 2 * r + 1;
    for (let y = 0; y < H; y++) { const row = y * W; let sum = 0; for (let x = -r; x <= r; x++) sum += src[row + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) { t[row + x] = sum / n; sum += src[row + Math.min(W - 1, x + r + 1)] - src[row + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let sum = 0; for (let y = -r; y <= r; y++) sum += t[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) { o[y * W + x] = sum / n; sum += t[Math.min(H - 1, y + r + 1) * W + x] - t[Math.max(0, y - r) * W + x]; } }
    return o; };
  a = blur(blur(a, 3), 3);
  for (let i = 0; i < W * H; i++) { const v = a[i]; const edge = Math.max(0, 1 - Math.abs(v - 0.5) / 0.14); const fill = v > 0.5 ? 0.12 : 0;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(255 * Math.max(edge, fill)); }
  g.putImageData(im, 0, 0);
  try { POSE_IMG[sp.key] = c.toDataURL('image/png'); } catch (e) { POSE_IMG[sp.key] = ''; }
  return POSE_IMG[sp.key];
}
/* Level lines: head top, shoulders (waist-up poses), hips and feet, wherever they fall inside the frame. */
function PoseGuide({ pose, lines, hand }) {
  const src = poseImage(pose, hand); const sp = poseSpec(pose, hand); const L = sp.ln;
  const hs = [L.headtop, ...(HANDED.has(pose) ? [L.shoulder] : []), L.hip, L.feet].filter(v => v > 0.03 && v < 0.975).map(v => v * 100);
  const vx = (sp.flip ? 1 - L.cx : L.cx) * 75;
  return html`<div class="pose" aria-hidden="true">${src ? html`<img src=${src} alt=""/>` : null}
    ${lines ? html`<svg viewBox="0 0 75 100" preserveAspectRatio="xMidYMid meet"><g stroke="#ffffff" stroke-width="0.35" stroke-dasharray="1.6 1.6" opacity="0.75">${hs.map(y => html`<line key=${y} x1="-10" x2="85" y1=${y} y2=${y}/>`)}<line x1=${vx} x2=${vx} y1="-10" y2="110"/></g></svg>` : null}</div>`;
}
const PH = { list: null, err: '', urls: new Map(), loading: false };
function pdbOpen() {
  return new Promise((res, rej) => { if (PH.db) return res(PH.db); let rq;
    try { rq = indexedDB.open('liftbook-photos', 1); } catch (e) { return rej(e); }
    rq.onupgradeneeded = () => { const d = rq.result; if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' }); };
    rq.onsuccess = () => { PH.db = rq.result; res(PH.db); }; rq.onerror = () => rej(rq.error); rq.onblocked = () => rej(new Error('blocked')); });
}
function pdbTx(mode, fn) { return pdbOpen().then(d => new Promise((res, rej) => { const t = d.transaction('photos', mode); const r = fn(t.objectStore('photos')); t.oncomplete = () => res(r ? r.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })); }
async function phLoad() {
  if (PH.loading) return; PH.loading = true;
  try { const all = await pdbTx('readonly', st => st.getAll()); PH.list = (all || []).sort((a, b) => b.t - a.t); PH.err = '';
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }
  catch (e) { PH.list = PH.list || []; PH.err = 'Photos can’t be stored in this view. Private browsing or blocked site data can cause this.'; }
  PH.loading = false; S.rerender();
}
const phUrl = p => { if (!PH.urls.has(p.id)) PH.urls.set(p.id, URL.createObjectURL(p.blob)); return PH.urls.get(p.id); };
async function phDelete(id) { try { await pdbTx('readwrite', st => st.delete(id)); } catch (e) {} PH.list = (PH.list || []).filter(x => x.id !== id); const u = PH.urls.get(id); if (u) { URL.revokeObjectURL(u); PH.urls.delete(id); } }
/* Photo backups: a separate file (photos are large), restored by Profile -> Restore. */
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const b64ToBlob = (s, type) => { const bin = atob(s); const a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); return new Blob([a], { type: type || 'image/jpeg' }); };
/* The photos file is assembled from one part per photo, never as one huge string, so a few hundred photos don't
   run the page out of memory. Same JSON shape as before: { app, version, exportedAt, photos: [...] }. */
async function photoBackup() {
  const all = ((await pdbTx('readonly', st => st.getAll())) || []).filter(p => p && p.blob).sort((a, b) => (a.t || 0) - (b.t || 0));
  const parts = ['{"app":"liftbook-photos","version":1,"exportedAt":' + JSON.stringify(new Date().toISOString()) + ',"photos":[']; let n = 0;
  for (const p of all) { const { blob, ...rest } = p; parts.push((n ? ',' : '') + JSON.stringify({ ...rest, type: blob.type || 'image/jpeg', data: await blobToB64(blob) })); n++; }
  parts.push(']}');
  return { count: n, blob: new Blob(parts, { type: 'application/json' }) };
}
async function photoRestore(d) {
  const have = new Set(); try { ((await pdbTx('readonly', st => st.getAllKeys())) || []).forEach(k => have.add(k)); } catch (e) {}
  let n = 0;
  for (const p of (d.photos || [])) {
    if (!p || !p.id || !p.data || have.has(p.id)) continue;
    const { data, type, ...rest } = p;
    await pdbTx('readwrite', st => st.put({ ...rest, blob: b64ToBlob(data, type) })); n++;
  }
  PH.urls.forEach(u => URL.revokeObjectURL(u)); PH.urls.clear(); PH.list = null;
  return n;
}
/* Display settings (theme, text size, colors, language) live on the device; backups carry them and a fresh phone takes them */
const DISPLAY_KEYS = ['palette', 'palCustom', 'theme', 'size', 'rm', 'hc', 'lang', 'langName', 'customLangs'];
const displayBackup = () => Object.fromEntries(DISPLAY_KEYS.map(k => [k, lsGet(k)]).filter(([, v]) => v != null));
function restoreDisplay(x) {
  for (const k of DISPLAY_KEYS) if (typeof x[k] === 'string') lsSet(k, x[k]);
  for (const k of ['palette', 'theme', 'size']) if (typeof x[k] === 'string') DISP[k] = x[k];
  for (const k of ['rm', 'hc']) if (typeof x[k] === 'string') DISP[k] = x[k] === '1';
  if (typeof x.lang === 'string' && typeof L10N === 'object') { L10N.lang = x.lang; L10N.name = x.langName || ''; }
  setTimeout(() => { try { if (typeof applyPalette === 'function') applyPalette(); applyDisplay(); } catch (e) {} }, 0);
}
/* Restore merge: an empty app takes the whole backup; a used app gains only what it lacks. */
function restoreInto(st, d) {
  const m = normalizeMeta(d.meta); const keys = ['meta'];
  const fresh = !Object.keys(st.sessions).length && !Object.keys(st.meta.routines).length && !Object.keys(st.meta.exercises).length;
  if (fresh) {
    const deleted = [...new Set([...(m.deleted || []), ...(st.meta.deleted || [])])];
    st.meta = { ...m, deleted };
  } else {
    for (const [k, e] of Object.entries(m.exercises || {})) if (!st.meta.exercises[k]) st.meta.exercises[k] = e;  /* never overwrite an exercise renamed here */
    for (const [k, r] of Object.entries(m.routines || {})) if (!st.meta.routines[k]) st.meta.routines[k] = r;
    for (const f of ['exUnit', 'exRest', 'exCat', 'dayMarks', 'challenges', 'exJump', 'liftGoals', 'monthNotes', 'exSide', 'machines']) { st.meta[f] = st.meta[f] || {}; for (const [k, v] of Object.entries(m[f] || {})) if (!(k in st.meta[f])) st.meta[f][k] = v; }
    const mIds = new Set((st.meta.meas || []).map(x => x.id)); st.meta.meas = (st.meta.meas || []).concat((m.meas || []).filter(x => x && !mIds.has(x.id)));
    const bwDays = new Set((st.meta.bw || []).map(x => x.d)); st.meta.bw = (st.meta.bw || []).concat((m.bw || []).filter(x => x && !bwDays.has(x.d)));
    if (d.meta.meals) { const a = st.meta.meals = normMeals(st.meta.meals), b = normMeals(d.meta.meals); for (const [k, r] of Object.entries(b.recipes)) if (!a.recipes[k]) a.recipes[k] = r; if (!a.plan.items.length && b.plan.items.length) a.plan = b.plan;
      for (const [k, f] of Object.entries(b.foods)) if (!a.foods[k]) a.foods[k] = f; for (const [k, q] of Object.entries(b.preps || {})) if (!a.preps[k]) a.preps[k] = q; for (const [k, q] of Object.entries(b.saved || {})) if (!a.saved[k]) a.saved[k] = q; if (!a.cats && b.cats) a.cats = b.cats; if (!a.rot && b.rot) a.rot = b.rot; if (!a.me && b.me) a.me = b.me; if (!a.prefs && b.prefs) a.prefs = b.prefs; if (!a.habits && b.habits) a.habits = b.habits; if (!a.menu && b.menu) a.menu = b.menu; if (!a.units && b.units) a.units = b.units; if (!Object.keys(a.goals).length) a.goals = b.goals;
      for (const [d, l] of Object.entries(b.log)) { const have = new Set((a.log[d] || []).map(e => e.id)); const add = l.filter(e => !have.has(e.id)); if (add.length) a.log[d] = (a.log[d] || []).concat(add); } }
    if (m.run && !(st.meta.run && st.meta.run.t1)) st.meta.run = m.run;
    if (m.fight && !st.meta.fight) st.meta.fight = m.fight;
    const tIds = new Set((st.meta.timers || []).map(x => x.id)); st.meta.timers = (st.meta.timers || []).concat((m.timers || []).filter(x => x && !tIds.has(x.id)));
    /* settings, running plan and meals: fill in what this phone doesn't have yet; this phone's own choices stay */
    const set = st.meta.settings; for (const [k, v] of Object.entries(m.settings || {})) if (set[k] == null || (k === 'program' && !set.program) || (Array.isArray(set[k]) && !set[k].length && Array.isArray(v))) set[k] = v;
    if (!st.meta.run && m.run) st.meta.run = m.run;
    if (m.meals && typeof m.meals === 'object') { const A = st.meta.meals = st.meta.meals || {}; const B = m.meals;
      for (const f of ['recipes', 'preps', 'foods', 'saved']) if (B[f] && typeof B[f] === 'object') { A[f] = A[f] || {}; for (const [k, v] of Object.entries(B[f])) if (!(k in A[f])) A[f][k] = v; }
      if (B.log && typeof B.log === 'object') { A.log = A.log || {}; for (const [d, l] of Object.entries(B.log)) { const have = new Set((A.log[d] || []).map(e => e && e.id)); A.log[d] = (A.log[d] || []).concat((Array.isArray(l) ? l : []).filter(e => e && !have.has(e.id))); } }
      for (const f of ['me', 'menu', 'prefs', 'habits', 'units', 'rot', 'cats']) if (A[f] == null && B[f] != null) A[f] = B[f];
      if ((!A.goals || !Object.keys(A.goals).length) && B.goals) A.goals = B.goals;
      if ((!A.plan || !(A.plan.items || []).length) && B.plan) A.plan = B.plan;
      st.meta.meals = normMeals(A); }
  }
  if (fresh && d.display && typeof d.display === 'object') restoreDisplay(d.display);
  let added = 0;
  const cs = cleanSessions(d.sessions);
  for (const [k, s] of Object.entries(cs.sessions)) if (!st.sessions[k] && !(st.meta.deleted || []).includes(k)) { st.sessions[k] = s; keys.push('s_' + k); added++; }
  migrateExIds(st);
  return { keys, added, fresh, skipped: cs.skipped };
}
async function phSaveToPhotos(p) {
  const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
  if (!dl) { showToast({ kind: 'info', text: 'Saving isn’t available in this view. Press and hold the photo to save it.' }); return; }
  try { await dl.save({ filename: 'ironwood-' + p.pose + '-' + p.date + '.jpg', data: p.blob }); } catch (e) { if (e && e.code !== 'declined') showToast({ kind: 'info', text: 'Couldn’t save the photo here.' }); }
}
function PhotosScreen() {
  useEffect(() => { if (!PH.list) phLoad(); }, []);
  if (!PH.list) return html`<p class="note" style="margin-top:16px">Loading photos…</p>`;
  const by = {}; for (const p of PH.list) (by[p.date] = by[p.date] || []).push(p);
  const dates = Object.keys(by).sort().reverse();
  const order = k => POSES.findIndex(x => x[0] === k);
  return html`<div>
    ${!dates.length ? html`<div class="card" style="margin-top:14px"><div class="ph-hero">${['front', 'side', 'abs'].map(k => html`<div key=${k} class="ph-hero-cell"><${PoseGuide} pose=${k} lines=${false}/><span>${POSE_NAME[k]}</span></div>`)}</div>
      <p class="note" style="margin-top:10px">Take the same poses every few weeks. Your last photo shows in red over the camera so you can match it, and a level helps you hold the same angle. No tripod? Pick “Holding the phone” for mirror and selfie poses.</p></div>` : null}
    <div class="row" style="margin-top:14px"><button class="btn primary" style="flex:2" onClick=${() => openSheet({ type: 'checkin' })}>${I.camera} New check-in</button>
      ${dates.length > 1 ? html`<button class="btn" style="flex:1" onClick=${() => UI.setView({ type: 'photoCmp' })}>Compare</button>` : null}</div>
    ${PH.err ? html`<p class="small down-c" role="alert" style="margin-top:8px">${PH.err}</p>` : null}
    ${dates.map(d => html`<div key=${d}><div class="section-h"><h2 style="font-size:calc(17 * var(--u))">${shortDate(+parseYmd(d))}</h2><span class="aside">${by[d].length} photo${by[d].length === 1 ? '' : 's'}</span></div>
      <div class="ph-grid">${by[d].slice().sort((a, b) => order(a.pose) - order(b.pose)).map(p => html`<button key=${p.id} class="ph-thumb" onClick=${() => openSheet({ type: 'photo', id: p.id })}><img src=${phUrl(p)} alt=${(POSE_NAME[p.pose] || 'Photo') + ', ' + shortDate(p.t)}/><span>${POSE_NAME[p.pose] || 'Photo'}</span></button>`)}</div></div>`)}
    <p class="note" style="margin-top:16px">Photos stay on this phone. They aren’t uploaded or synced to your account, and deleting Ironwood deletes them, so save the ones you want to keep to your Photos. In the iPhone app they’ll live in the app’s own storage.</p>
  </div>`;
}
function CheckinSheet() {
  const DEF = { set: ['front', 'side', 'back'], hand: ['mFront', 'mSide', 'mBack'] };
  const read = (k, d) => { try { const v = JSON.parse(lsGet(k) || 'null'); return Array.isArray(v) && v.length ? v : d; } catch (e) { return d; } };
  const [pm, setPm] = useState(() => lsGet('poseMode') === 'hand' ? 'hand' : 'set');
  const [hand, setHand] = useState(() => lsGet('phoneHand') === 'left' ? 'left' : 'right');
  const [body, setBody] = useState(bodyKey);
  const setB = b => { setBody(b); lsSet('outlineBody', b); };
  const [sels, setSels] = useState(() => ({ set: read('poses', DEF.set).filter(k => !HANDED.has(k)), hand: read('posesHand', DEF.hand).filter(k => HANDED.has(k)) }));
  const list = pm === 'hand' ? HAND_POSES : SET_POSES; const sel = sels[pm];
  const [bw, setBw] = useState('');
  const toggle = k => setSels({ ...sels, [pm]: sel.includes(k) ? sel.filter(x => x !== k) : list.map(p => p[0]).filter(x => sel.includes(x) || x === k) });
  const setMode = m => { setPm(m); lsSet('poseMode', m); };
  const setH = h => { setHand(h); lsSet('phoneHand', h); };
  const start = () => { if (!sel.length) return; lsSet(pm === 'hand' ? 'posesHand' : 'poses', JSON.stringify(sel)); const today = ymd(new Date());
    if (num(bw) > 0) commit(x => { x.meta.bw = (x.meta.bw || []).filter(y => y.d !== today).concat([{ id: uid('b'), d: today, w: num(bw), u: U() }]); }, 'meta', 600);
    lsSet('statsTab', 'photos'); closeSheet(); UI.setView({ type: 'photoCap', poses: sel, i: 0, date: today, hand: pm === 'hand' ? hand : 'right' }); };
  return html`<${Sheet} label="New check-in"><h2>New check-in</h2><p class="note">Pick the poses to take today. You’ll go through them one at a time.</p>
    <div class="seg wide" style="margin-top:10px">${[['set', 'Phone set up'], ['hand', 'Holding the phone']].map(([k, l]) => html`<button key=${k} class=${pm === k ? 'on' : ''} aria-pressed=${pm === k} onClick=${() => setMode(k)}>${l}</button>`)}</div>
    <div class="row" style="margin-top:10px;align-items:center"><span class="small muted" style="flex:1">Outline</span><div class="seg">${BODIES.map(([k, l]) => html`<button key=${k} class=${body === k ? 'on' : ''} aria-pressed=${body === k} onClick=${() => setB(k)}>${l}</button>`)}</div></div>
    ${pm === 'hand' ? html`<div class="row" style="margin-top:10px;align-items:center"><span class="small muted" style="flex:1">Phone in your</span><div class="seg">${[['right', 'Right hand'], ['left', 'Left hand']].map(([k, l]) => html`<button key=${k} class=${hand === k ? 'on' : ''} aria-pressed=${hand === k} onClick=${() => setH(k)}>${l}</button>`)}</div></div>
      <p class="note" style="margin-top:8px">Mirror poses use the back camera pointed at the mirror; it’s sharper than the front one. Stand the same distance from the mirror each time (a floor tile or tape mark helps), same lighting, first thing in the morning, same clothes.</p>`
    : html`<p class="note" style="margin-top:8px">For photos that line up: same spot and lighting, phone at belly-button height about 6 feet away (a shelf or tripod plus the timer), first thing in the morning before eating, same clothes.</p>`}
    <div class="range-grid">${list.map(([k, l]) => html`<button key=${k} class=${'chip' + (sel.includes(k) ? ' on' : '')} aria-pressed=${sel.includes(k)} onClick=${() => toggle(k)}>${l}</button>`)}</div>
    ${sel.length ? html`<div class="ph-hero" style="margin-top:12px">${sel.slice(0, 3).map(k => html`<div key=${k + hand + body} class="ph-hero-cell"><${PoseGuide} pose=${k} hand=${hand} lines=${false}/><span>${POSE_NAME[k]}</span></div>`)}</div>` : null}
    <div style="margin-top:14px"><label class="lbl" for="ci-bw">Bodyweight today (optional, ${U()})</label><input class="field" id="ci-bw" inputmode="decimal" value=${bw} onInput=${e => setBw(e.target.value)}/></div>
    <button class="btn primary wide" style="margin-top:14px" disabled=${!sel.length} onClick=${start}>Start with ${sel.length ? POSE_NAME[sel[0]] : 'a pose'}</button><//>`;
}
function PhotoCapture({ view }) {
  const pose = view.poses[view.i]; const last = view.i === view.poses.length - 1;
  const ghost = (PH.list || []).filter(p => p.pose === pose && p.date !== view.date).sort((a, b) => b.t - a.t)[0];
  const [mode, setMode] = useState('init'); const [facing, setFacing] = useState(POSE_CAM[pose] || lsGet('camFacing') || 'user');
  const [ghostOp, setGhostOp] = useState(+(lsGet('ghostOp') || 35)); const [timer, setTimer] = useState(+(lsGet('camTimer') || 0)); const [count, setCount] = useState(0);
  const [shot, setShot] = useState(null); const [img, setImg] = useState(null); const [xf, setXf] = useState({ x: 0, y: 0, s: 1, flip: false }); const [fw, setFw] = useState(0);
  const videoRef = useRef(null); const frameRef = useRef(null); const streamRef = useRef(null); const xfRef = useRef(xf); xfRef.current = xf;
  const ptrs = useRef(new Map()); const g0 = useRef(null); useTilt();
  useEffect(() => { if (!PH.list) phLoad(); }, []);
  useEffect(() => { setShot(null); setImg(null); setXf({ x: 0, y: 0, s: 1, flip: false }); setCount(0); const want = POSE_CAM[pose] || lsGet('camFacing') || 'user'; if (want !== facing) setFacing(want); }, [view.i]);
  useEffect(() => { if (frameRef.current) setFw(frameRef.current.offsetWidth); });
  useEffect(() => {
    if (shot || img) return; let alive = true;
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) { setMode('nocam'); return; }
    md.getUserMedia({ video: { facingMode: facing, width: { ideal: 1440 }, height: { ideal: 1920 } }, audio: false })
      .then(st => { if (!alive) { st.getTracks().forEach(t => t.stop()); return; } streamRef.current = st; const v = videoRef.current; if (v) { v.srcObject = st; v.play().catch(() => {}); } setMode('live'); })
      .catch(() => { if (alive) setMode('nocam'); });
    return () => { alive = false; const st = streamRef.current; if (st) st.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  }, [facing, !!shot, !!img, view.i]);
  const toBlob = (c, cb) => c.toBlob(b => { if (b) cb(b); else showToast({ kind: 'info', text: 'Couldn’t capture the photo.' }); }, 'image/jpeg', 0.88);
  const snapLive = () => { const v = videoRef.current; if (!v || !v.videoWidth) return; const c = document.createElement('canvas'); c.width = 1080; c.height = 1440; const g = c.getContext('2d');
    const sc = Math.max(1080 / v.videoWidth, 1440 / v.videoHeight); const dw = v.videoWidth * sc, dh = v.videoHeight * sc;
    if (facing === 'user') { g.translate(1080, 0); g.scale(-1, 1); } g.drawImage(v, (1080 - dw) / 2, (1440 - dh) / 2, dw, dh);
    const tl = TILT.cur(); toBlob(c, b => setShot({ blob: b, url: URL.createObjectURL(b), tilt: tl })); };
  const shoot = () => { unlockAudio(); if (!timer) return snapLive(); let n = timer; setCount(n); beep(660, 100);
    const iv = setInterval(() => { n--; if (n <= 0) { clearInterval(iv); setCount(0); beep(990, 220); snapLive(); } else { setCount(n); beep(660, 100); } }, 1000); };
  const onFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; const url = URL.createObjectURL(f); const im = new Image();
    im.onload = () => { setImg({ el: im, url, iw: im.naturalWidth, ih: im.naturalHeight }); setXf({ x: 0, y: 0, s: 1, flip: false }); setMode('align'); };
    im.onerror = () => showToast({ kind: 'info', text: 'That photo couldn’t be opened.' }); im.src = url; };
  const pd = e => { if (!img || shot) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); g0.current = { xf: { ...xfRef.current }, pts: new Map(ptrs.current) }; };
  const pm = e => { if (!ptrs.current.has(e.pointerId)) return; ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); const s0 = g0.current; if (!s0) return;
    const now = [...ptrs.current.values()], was = [...s0.pts.values()];
    if (now.length === 1 && was.length === 1) setXf({ ...s0.xf, x: s0.xf.x + now[0].x - was[0].x, y: s0.xf.y + now[0].y - was[0].y });
    else if (now.length >= 2 && was.length >= 2) { const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); const k = d(now[0], now[1]) / Math.max(1, d(was[0], was[1]));
      setXf({ ...s0.xf, s: Math.min(5, Math.max(0.5, s0.xf.s * k)), x: s0.xf.x + (now[0].x + now[1].x - was[0].x - was[1].x) / 2, y: s0.xf.y + (now[0].y + now[1].y - was[0].y - was[1].y) / 2 }); } };
  const pu = e => { ptrs.current.delete(e.pointerId); g0.current = { xf: { ...xfRef.current }, pts: new Map(ptrs.current) }; };
  const useAligned = () => { const fr = frameRef.current; const w = fr.offsetWidth, h = fr.offsetHeight; const k = 1080 / w; const c = document.createElement('canvas'); c.width = 1080; c.height = 1440; const g = c.getContext('2d');
    g.fillStyle = '#000000'; g.fillRect(0, 0, 1080, 1440); const b = Math.max(w / img.iw, h / img.ih);
    g.translate(540 + xf.x * k, 720 + xf.y * k); g.scale((xf.flip ? -1 : 1) * xf.s * b * k, xf.s * b * k); g.drawImage(img.el, -img.iw / 2, -img.ih / 2);
    toBlob(c, bl => setShot({ blob: bl, url: URL.createObjectURL(bl) })); };
  const next = () => { if (last) { UI.setView(null); showToast({ kind: 'info', text: 'Check-in saved' }); } else UI.setView({ ...view, i: view.i + 1 }); };
  const save = async () => { const rec = { id: uid('ph'), date: view.date, pose, t: Date.now(), blob: shot.blob }; if (shot.tilt) rec.tilt = shot.tilt; if (HANDED.has(pose)) rec.hand = view.hand || 'right';
    try { await pdbTx('readwrite', st => st.put(rec)); } catch (e) { showToast({ kind: 'info', text: 'Couldn’t save the photo on this device.' }); return; }
    for (const old of (PH.list || []).filter(p => p.date === rec.date && p.pose === rec.pose)) await phDelete(old.id);
    PH.list = [rec, ...(PH.list || [])]; next(); };
  const b = fw && img ? Math.max(fw / img.iw, (fw * 4 / 3) / img.ih) : 0;
  const imgStyle = img && b ? { width: img.iw * b + 'px', height: img.ih * b + 'px', transform: 'translate(-50%,-50%) translate(' + xf.x + 'px,' + xf.y + 'px) scale(' + (xf.flip ? -xf.s : xf.s) + ',' + xf.s + ')' } : null;
  const timerOpts = [0, 3, 10];
  return html`<div class="cap">
    <div class="row" style="margin:2px 0 8px"><div style="flex:1;min-width:0"><div class="eyebrow">Pose ${view.i + 1} of ${view.poses.length}</div><h2 class="wo-title" style="font-size:calc(24 * var(--u))">${POSE_NAME[pose]}</h2>${POSE_TIPS[pose] ? html`<p class="small muted" style="margin-top:2px">${POSE_TIPS[pose]}</p>` : null}</div>
      ${!last ? html`<button class="btn text" onClick=${next}>Skip pose</button>` : null}</div>
    <div class="cam" ref=${frameRef} onPointerDown=${pd} onPointerMove=${pm} onPointerUp=${pu} onPointerCancel=${pu}>
      ${shot ? html`<img class="cam-shot" src=${shot.url} alt="Your photo"/>`
        : img ? html`<img class="cam-img" src=${img.url} style=${imgStyle} alt="Photo to line up"/>`
        : html`<video ref=${videoRef} class=${'cam-video' + (facing === 'user' ? ' mirror' : '')} playsinline muted autoplay></video>`}
      ${ghost && ghostOp > 0 ? html`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="ghost-red" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.45 0.9 0.2 0 0.2  0.05 0.1 0.03 0 0.02  0.05 0.1 0.03 0 0.02  0 0 0 1 0"/></filter></svg><img class="cam-ghost red" src=${phUrl(ghost)} style=${{ opacity: ghostOp / 100 }} alt=""/>` : null}
      ${!shot && !(ghost && ghostOp > 0) ? html`<${PoseGuide} pose=${pose} hand=${view.hand} lines=${true}/>` : null}
      ${mode === 'live' && !shot ? html`<${TiltLevel} target=${ghost && ghost.tilt}/>` : null}
      ${count ? html`<div class="cam-count" aria-live="assertive">${count}</div>` : null}
      ${mode === 'nocam' && !img && !shot ? html`<div class="cam-msg">The live camera isn’t allowed inside this view. Take the photo with your camera, then line it up with the outline here.</div>` : null}
      ${mode === 'align' && img && !shot ? html`<div class="cam-tip">Drag to move · pinch or use the slider to zoom</div>` : null}
    </div>
    ${ghost ? html`<div class="cam-ghost-row"><label for="ghost-op">Last photo <span style="color:#e5484d">(red)</span></label><input id="ghost-op" type="range" min="0" max="70" value=${ghostOp} onInput=${e => { const v = +e.target.value; setGhostOp(v); lsSet('ghostOp', String(v)); }}/><span class="num" style="min-width:36px;text-align:right">${ghostOp}%</span></div>` : null}
    ${shot ? html`<div class="row" style="margin-top:12px"><button class="btn" style="flex:1" onClick=${() => { setShot(null); if (!img) setMode('init'); }}>Retake</button><button class="btn primary" style="flex:2" onClick=${save}>${last ? 'Save check-in' : 'Save, next pose'}</button></div>`
      : img ? html`<div class="stack" style="margin-top:12px"><div class="cam-ghost-row"><label for="zoom">Zoom</label><input id="zoom" type="range" min="50" max="300" value=${Math.round(xf.s * 100)} onInput=${e => setXf({ ...xf, s: +e.target.value / 100 })}/></div>
          <div class="row"><button class="btn" style="flex:1" onClick=${() => setXf({ ...xf, flip: !xf.flip })}>Flip</button><button class="btn" style="flex:1" onClick=${() => { setImg(null); setMode('init'); }}>Retake</button><button class="btn primary" style="flex:1.4" onClick=${useAligned}>Use photo</button></div></div>`
      : mode === 'live' ? html`<${TiltToggle} target=${ghost && ghost.tilt}/><div class="cam-ctl">
          <button class="btn" onClick=${() => { const f = facing === 'user' ? 'environment' : 'user'; setFacing(f); if (!POSE_CAM[pose]) lsSet('camFacing', f); }}>Flip camera</button>
          <button class="shutter" aria-label="Take photo" disabled=${!!count} onClick=${shoot}></button>
          <button class="btn" onClick=${() => { const t = timerOpts[(timerOpts.indexOf(timer) + 1) % timerOpts.length]; setTimer(t); lsSet('camTimer', String(t)); }}>${timer ? timer + 's timer' : 'Timer off'}</button></div>`
      : html`<div class="stack" style="margin-top:12px"><label class="btn primary wide" for="cap-cam">${I.camera} Take photo</label><input id="cap-cam" type="file" accept="image/*" capture=${POSE_CAM[pose] || 'user'} hidden onChange=${onFile}/>
          <label class="btn wide" for="cap-lib">Choose from library</label><input id="cap-lib" type="file" accept="image/*" hidden onChange=${onFile}/></div>`}
  </div>`;
}
function PhotoCompare() {
  const list = PH.list || []; const poses = POSES.filter(p => list.some(x => x.pose === p[0]));
  const [pose, setPose] = useState(poses[0] ? poses[0][0] : 'front'); const [mode, setMode] = useState('slide'); const [pos, setPos] = useState(50);
  const items = list.filter(x => x.pose === pose).sort((a, b) => a.t - b.t);
  const [aId, setA] = useState(null); const [bId, setB] = useState(null);
  const A = items.find(x => x.id === aId) || items[0], B = items.find(x => x.id === bId) || items[items.length - 1];
  const weeks = A && B ? Math.round((B.t - A.t) / (7 * DAY)) : 0;
  return html`<div>
    <div class="range-grid">${poses.map(([k, l]) => html`<button key=${k} class=${'chip' + (pose === k ? ' on' : '')} onClick=${() => { setPose(k); setA(null); setB(null); }}>${l}</button>`)}</div>
    ${items.length < 2 ? html`<p class="note" style="margin-top:14px">Take this pose on two different days to compare.</p>` : html`
      <div class="row" style="margin-top:12px;align-items:flex-end">
        <div style="flex:1"><label class="lbl" for="cmp-a">Before</label><select class="field" id="cmp-a" value=${A.id} onChange=${e => setA(e.target.value)}>${items.map(x => html`<option key=${x.id} value=${x.id}>${shortDate(x.t)}</option>`)}</select></div>
        <div style="flex:1"><label class="lbl" for="cmp-b">After</label><select class="field" id="cmp-b" value=${B.id} onChange=${e => setB(e.target.value)}>${items.map(x => html`<option key=${x.id} value=${x.id}>${shortDate(x.t)}</option>`)}</select></div></div>
      <div class="seg wide" style="margin-top:10px">${[['slide', 'Slider'], ['side', 'Side by side']].map(([k, l]) => html`<button key=${k} class=${mode === k ? 'on' : ''} onClick=${() => setMode(k)}>${l}</button>`)}</div>
      ${mode === 'slide' ? html`<div class="cam cmp" style="margin-top:10px"><img src=${phUrl(A)} alt=${'Before, ' + shortDate(A.t)}/><img src=${phUrl(B)} alt=${'After, ' + shortDate(B.t)} style=${{ clipPath: 'inset(0 0 0 ' + pos + '%)' }}/>
          <div class="cmp-line" style=${{ left: pos + '%' }}></div><span class="cmp-lab" style="left:8px">${shortDate(A.t)}</span><span class="cmp-lab" style="right:8px">${shortDate(B.t)}</span></div>
        <input type="range" min="0" max="100" value=${pos} aria-label="Compare slider" style="width:100%;margin-top:10px;accent-color:var(--accent)" onInput=${e => setPos(+e.target.value)}/>`
      : html`<div class="cmp-side" style="margin-top:10px"><figure><img src=${phUrl(A)} alt=${'Before, ' + shortDate(A.t)}/><figcaption>${shortDate(A.t)}</figcaption></figure><figure><img src=${phUrl(B)} alt=${'After, ' + shortDate(B.t)}/><figcaption>${shortDate(B.t)}</figcaption></figure></div>`}
      <p class="small muted" style="margin-top:8px">${weeks} week${weeks === 1 ? '' : 's'} apart</p>`}
  </div>`;
}
function PhotoSheet({ id }) {
  const p = (PH.list || []).find(x => x.id === id); const [conf, setConf] = useState(false); if (!p) return null;
  return html`<${Sheet} label="Progress photo"><div class="eyebrow">${shortDate(p.t)}</div><h2>${POSE_NAME[p.pose] || 'Photo'}</h2>
    <img class="ph-big" src=${phUrl(p)} alt=${(POSE_NAME[p.pose] || 'Photo') + ', ' + shortDate(p.t)}/>
    <div class="stack" style="margin-top:12px">
      ${conf ? html`<p class="note">Delete this photo from this phone? This can’t be undone.</p><button class="btn wide danger" onClick=${async () => { await phDelete(id); closeSheet(); S.rerender(); }}>Delete photo</button><button class="btn wide" onClick=${() => setConf(false)}>Keep it</button>`
        : html`<button class="btn primary wide" onClick=${() => phSaveToPhotos(p)}>Save to Photos</button><button class="btn text danger wide" onClick=${() => setConf(true)}>Delete</button>`}
    </div><//>`;
}

/* ---------- SHEETS ---------- */
function PickSheet({ title, onPick }) {
  const [q, setQ] = useState(''); const [kind, setKind] = useState(''); const [cat, setCat] = useState('');
  const list = Object.values(allEx()).filter(e => !q || norm(e.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name));
  const exact = q.trim() && findEx(q);
  const create = () => { const name = titleCase(q); const ex = { id: 'u-' + slug(name) + '-' + Math.random().toString(36).slice(2, 5), name, kind: kind || guessKind(name), cat: cat || guessCat(name) }; commit(s => { s.meta.exercises[ex.id] = ex; }, 'meta'); onPick(ex); };
  return html`<${Sheet} label=${title}><h2>${title}</h2>
    <input class="field" id="pick-q" placeholder="Search or type a new exercise" value=${q} onInput=${e => setQ(e.target.value)} autocomplete="off"/>
    ${q.trim() && !exact ? html`<div class="row wrap" style="margin-top:10px"><select class="field" id="pick-kind" aria-label="Equipment" style="flex:1;min-width:120px" value=${kind || guessKind(q)} onChange=${e => setKind(e.target.value)}>${Object.entries(KINDS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select><select class="field" id="pick-cat" aria-label="Category" style="flex:1;min-width:120px" value=${cat || guessCat(q)} onChange=${e => setCat(e.target.value)}>${Object.entries(CATS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select><button class="btn primary" onClick=${create}>${I.plus} Create “${titleCase(q)}”</button></div>` : null}
    <div class="pick-list">${list.map(e => html`<button key=${e.id} class="opt" onClick=${() => onPick(e)}><span style="flex:1">${e.name}</span><span class="d">${KINDS[e.kind] || ''}</span></button>`)}
      ${!list.length ? html`<p class="note" style="padding:12px 4px">No match. Create it above.</p>` : null}</div>
  <//>`;
}
function GroupSheet({ current, dayName, onPick, extra }) {
  const [custom, setCustom] = useState('');
  const short = (dayName || '').replace(/\s*\(.*\)$/, '').split(/\s+[-–]\s+/)[0];
  const others = [['Heavy', 'Heavy'], ['Light', 'Light']]; if (short) others.push([short, short + ' only']);
  return html`<${Sheet} label="Rep range"><h2>Rep range</h2><p class="note">Each range keeps its own weights, prefills, chart and PRs, so curls done two ways never overwrite each other. Records still count overall.</p>
    ${extra || null}
    <div class="range-grid">${RANGES.map(([v, l]) => html`<button key=${v} class=${'chip' + (current === v ? ' on' : '')} aria-pressed=${current === v} onClick=${() => onPick(v)}>${l}</button>`)}</div>
    <div class="lbl" style="margin-top:16px">Or a label</div>
    <div class="range-grid">${others.map(([v, l]) => html`<button key=${v} class=${'chip' + (current === v ? ' on' : '')} aria-pressed=${current === v} onClick=${() => onPick(v)}>${l}</button>`)}</div>
    <div class="row" style="margin-top:12px"><input class="field" id="grp-custom" placeholder="Custom, e.g. Paused" value=${custom} onInput=${e => setCustom(e.target.value)}/><button class="btn" disabled=${!custom.trim()} onClick=${() => onPick(titleCase(custom).slice(0, 24))}>Use</button></div>
    <button class=${'opt' + (!current ? ' on' : '')} style="margin-top:8px" onClick=${() => onPick('')}><div style="flex:1"><div>No range</div><div class="d">One shared history wherever this exercise appears</div></div>${!current ? I.check : null}</button>
  <//>`;
}
function DaySheet({ k }) {
  const d = parseYmd(k); const m = (S.meta.dayMarks || {})[k] || ''; const ss = sessionList().filter(x => ymd(x.startedAt) === k);
  const excuse = !!S.meta.settings.excuse;
  const setM = v => { commit(x => { if (v) x.meta.dayMarks[k] = v; else delete x.meta.dayMarks[k]; }, 'meta', 800); closeSheet(); };
  const opts = [['rest', 'Rest day', 'A planned day off. Your weekly goal already allows for these.'], ['sick', 'Sick', ''], ['injured', 'Injured', ''], ['break', 'Break', 'Travel, vacation or a planned week off.']];
  const exTxt = excuse ? "Lowers that week's goal by one and pauses challenges, so streaks aren't broken." : 'Labeled only. Turn on "Sick, injured and break days pause streaks" in Profile to protect streaks.';
  return html`<${Sheet} label="Mark this day"><h2>${DOW_FULL[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}</h2>
    ${ss.length ? html`<p class="note">Logged: ${ss.map(x => x.name).join(', ')}</p>` : null}
    <div style="margin-top:6px">${opts.map(([v, l, sub]) => html`<button key=${v} class=${'opt' + (m === v ? ' on' : '')} onClick=${() => setM(m === v ? '' : v)}><div style="flex:1"><div>${l}</div><div class="d">${sub || exTxt}</div></div>${m === v ? I.check : null}</button>`)}</div>
    ${m ? html`<button class="btn wide" style="margin-top:12px" onClick=${() => setM('')}>Clear this day</button>` : null}
    ${k <= ymd(Date.now()) ? html`<button class="btn ghost wide" style="margin-top:12px" onClick=${() => openSheet({ type: 'activity', day: k })}>${I.plus} Log an activity on this day</button>` : null}<//>`;
}
function ChDaySheet({ id, k }) {
  const ch = S.meta.challenges[id]; if (!ch) return null; const d = parseYmd(k);
  return html`<${Sheet} label="Challenge day"><div class="eyebrow">${ch.name}</div><h2>${DOW_FULL[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}</h2>
    <${ChallengeChecklist} ch=${ch} k=${k}/>
    <button class="btn primary wide" style="margin-top:14px" onClick=${closeSheet}>Done</button><//>`;
}
const REST_PRESETS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
function RestPickSheet() {
  const r = S.rest; const [scope, setScope] = useState('now');
  if (!r) return null;
  const apply = v => { const start = r.until - r.total * 1000; r.total = v; r.until = start + v * 1000; r.beeped = {}; bgRest();
    if (scope === 'def') commit(m => { m.meta.settings[r.kind === 'ss' ? 'restSS' : 'rest'] = v; }, 'meta', 600);
    if (scope === 'ex') commit(m => { m.meta.exRest[r.ex] = v; }, 'meta', 600);
    closeSheet(); S.rerender(); };
  const desc = { now: 'Changes only the timer that is running.', def: 'Also becomes your default rest after ' + (r.kind === 'ss' ? 'superset exercises.' : 'single exercises.'), ex: 'Also becomes the rest for ' + exName(r.ex) + ' every time.' };
  return html`<${Sheet} label="Rest time"><h2>Rest time</h2>
    <div class="seg wide" style="margin:6px 0 6px">${[['now', 'This rest'], ['def', 'Default'], ['ex', 'This exercise']].map(([k, l]) => html`<button key=${k} class=${scope === k ? 'on' : ''} aria-pressed=${scope === k} onClick=${() => setScope(k)}>${l}</button>`)}</div>
    <p class="note" style="margin-bottom:12px">${desc[scope]}</p>
    <div class="preset-grid">${REST_PRESETS.map(v => html`<button key=${v} class=${'chip' + (r.total === v ? ' on' : '')} onClick=${() => apply(v)}>${clock(v)}</button>`)}</div><//>`;
}
function ExRestSheet({ ex }) {
  const cur = S.meta.exRest[ex]; const st = S.meta.settings;
  const set = v => { commit(m => { if (v === null) delete m.meta.exRest[ex]; else m.meta.exRest[ex] = v; }, 'meta', 600); closeSheet(); };
  return html`<${Sheet} label="Rest timer"><h2>Rest for ${exName(ex)}</h2><p class="note" style="margin-bottom:12px">Overrides your single and superset rest for this exercise only.</p>
    <div class="preset-grid">${REST_PRESETS.map(v => html`<button key=${v} class=${'chip' + (cur === v ? ' on' : '')} onClick=${() => set(v)}>${clock(v)}</button>`)}</div>
    <div style="margin-top:10px"><button class=${'opt' + (cur === 0 ? ' on' : '')} onClick=${() => set(0)}>No timer for this exercise</button>
      <button class=${'opt' + (cur == null ? ' on' : '')} onClick=${() => set(null)}>Use my defaults (${clock(+st.rest)} single, ${clock(+st.restSS)} superset)</button></div><//>`;
}
function BWSheet() {
  const [w, setW] = useState(''); const [d, setD] = useState(ymd(new Date()));
  const last = (S.meta.bw || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).pop();
  const save = () => { const v = num(w); if (!(v > 0)) return; commit(x => { x.meta.bw = (x.meta.bw || []).filter(y => y.d !== d).concat([{ id: uid('b'), d, w: v, u: U() }]); }, 'meta', 600); closeSheet(); };
  return html`<${Sheet} label="Log bodyweight"><h2>Log bodyweight</h2>
    <div class="row" style="align-items:flex-start;margin-top:8px">
      <div style="flex:1"><label class="lbl" for="bw-w">Weight (${U()})</label><input class="field" id="bw-w" inputmode="decimal" placeholder=${last ? fmt(+last.w) : ''} value=${w} onInput=${e => setW(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') save(); }}/></div>
      <div style="flex:1"><label class="lbl" for="bw-d">Date</label><input class="field" id="bw-d" type="date" value=${d} onChange=${e => e.target.value && setD(e.target.value)}/></div></div>
    <p class="note" style="margin-top:8px">One entry per day. Saving the same day again replaces it.</p>
    <button class="btn primary wide" style="margin-top:12px" disabled=${!(num(w) > 0)} onClick=${save}>Save</button><//>`;
}
/* The first exercise can't be in a superset with the one above it */
const ssTop = items => { if (items && items[0] && items[0].ss) items[0].ss = false; };
function SlotSheet({ it }) {
  const a = S.active; const rs = routineSlot(a, it); const idx = a.items.indexOf(it); const u = it.u || U();
  const alsoBox = rs ? html`<label class="toggle" style="margin:8px 0"><input type="checkbox" id="also-routine" checked=${ALSO.v} onChange=${e => { ALSO.v = e.target.checked; S.rerender(); }}/>Also change it in ${a.routineName}</label>`
    : a.routineId && getRoutine(a.routineId) && getRoutine(a.routineId).source === 'builtin' ? html`<p class="note" style="margin:8px 0">This change applies to today. Edit the plan to make it permanent.</p>` : null;
  const persist = patch => { if (rs && ALSO.v) commit(x => { Object.assign(rs, patch); }, 'meta'); };
  const exR = S.meta.exRest[it.ex];
  return html`<${Sheet} label="Exercise options"><h2>${exName(it.ex)}</h2>
    <button class="opt" onClick=${() => openSheet({ type: 'pick', title: 'Swap exercise', onPick: ex => { it.ex = ex.id; it.u = slotUnit(ex.id); refill(it); persist({ ex: ex.id }); closeSheet(); touch(); } })}>${I.swap}<div><div>Swap exercise</div><div class="d">Pick a different movement for this slot</div></div></button>
    <button class="opt" onClick=${() => openSheet({ type: 'group', current: it.group, dayName: a.name, extra: alsoBox, onPick: g => { it.group = g; applyRange(it.target, g); refill(it); persist({ group: g, ...(g in RANGE_REPS ? { reps: RANGE_REPS[g] } : {}) }); closeSheet(); touch(); } })}>${I.layers}<div><div>Rep range: ${it.group ? (RANGE_NAME[it.group] || it.group) : 'none'}</div><div class="d">Each range keeps its own history</div></div></button>
    <button class="opt" onClick=${() => openSheet({ type: 'exRest', ex: it.ex })}>${I.timer}<div><div>Rest timer: ${exR != null ? (exR ? clock(exR) : 'off') : 'default'}</div><div class="d">A rest time just for this exercise</div></div></button>
    ${['bodyweight'].includes(exKind(it.ex)) || isMeasured(exKind(it.ex)) ? null : html`<button class="opt" id="opt-jump" onClick=${() => openSheet({ type: 'exJump', ex: it.ex, u0: u })}>${I.up}<div><div>Weight jump: +${fmt(jumpFor(it.ex, u))} ${u}${(S.meta.exJump || {})[it.ex] ? '' : ' (default)'}</div><div class="d">How much to add when every set hits the top of the range</div></div></button>`}
    ${isMeasured(exKind(it.ex)) ? null : html`<button class="opt" id="opt-machines" onClick=${() => openSheet({ type: 'machines', ex: it.ex, itId: it.id })}>${I.edit}<div><div>Machines${machinesOf(it.ex).length ? ': ' + machinesOf(it.ex).join(', ') : ''}</div><div class="d">Different weights on different machines? Name them and switch mid-lift.</div></div></button>`}
    <button class="opt" onClick=${() => { toggleUnit(it); closeSheet(); }}>${I.swap}<div><div>Weigh in ${u === 'kg' ? 'lb' : 'kg'}</div><div class="d">Now ${u}. Remembered for this exercise.</div></div></button>
    ${idx > 0 ? html`<button class="opt" onClick=${() => { it.ss = !it.ss; closeSheet(); touch(); }}>${I.link}<div>${it.ss ? 'Remove superset' : 'Superset with exercise above'}</div></button>` : null}
    ${idx > 0 ? html`<button class="opt" onClick=${() => { a.items.splice(idx, 1); a.items.splice(idx - 1, 0, it); ssTop(a.items); closeSheet(); touch(); }}>${I.up}<div>Move up</div></button>` : null}
    ${idx < a.items.length - 1 ? html`<button class="opt" onClick=${() => { a.items.splice(idx, 1); a.items.splice(idx + 1, 0, it); ssTop(a.items); closeSheet(); touch(); }}>${I.down}<div>Move down</div></button>` : null}
    ${it.sets.length ? html`<button class="opt" onClick=${() => { copySet(it, it.sets[it.sets.length - 1]); closeSheet(); }}>${I.copy}<div>Copy last set</div></button>
    <button class="opt" onClick=${() => { deleteSet(it, it.sets[it.sets.length - 1]); closeSheet(); }}>${I.trash}<div>Delete last set</div></button>` : null}
    <button class="opt" style="color:var(--stop)" onClick=${() => { const gone = a.items[idx]; const ss0 = a.items[idx + 1] && a.items[idx + 1].ss; a.items.splice(idx, 1); ssTop(a.items); closeSheet(); touch(); const n = gone.sets.filter(isDone).length;
      showToast({ kind: 'info', ms: 8000, text: exName(gone.ex) + ' removed' + (n ? ' with ' + n + ' logged set' + (n === 1 ? '' : 's') : ''), action: 'Undo', fn: () => { if (S.active === a && !a.items.includes(gone)) { a.items.splice(Math.min(idx, a.items.length), 0, gone); if (idx === 0 && a.items[1]) a.items[1].ss = !!ss0; touch(); } } }); }}>${I.trash}<div>Remove from this workout</div></button>
    ${alsoBox}
  <//>`;
}
function FinishSheet() {
  const a = S.active; const done = a.items.reduce((n, it) => n + it.sets.filter(isDone).length, 0);
  const open = a.items.reduce((n, it) => n + it.sets.filter(x => !isDone(x)).length, 0);
  return html`<${Sheet} label="Finish workout"><h2>${done ? 'Finish workout?' : 'No sets logged yet'}</h2>
    <p class="note" style="margin-bottom:14px">${done ? done + ' set' + (done === 1 ? '' : 's') + ' will be saved.' + (open ? ' ' + open + ' set' + (open === 1 ? '' : 's') + ' you didn’t log will be left out.' : '') : a.run ? 'Nothing logged yet. Tap ✓ on the parts of the run you did.' : 'Type reps for the sets you did, or swipe them right to log them as shown.'}</p>
    <div class="stack">${done ? html`<button class="btn primary wide" onClick=${() => { closeSheet(); finishWorkout(); }}>Save workout</button>` : null}
      <button class="btn wide" onClick=${closeSheet}>Keep going</button></div><//>`;
}
function SummarySheet({ id }) {
  const s = S.sessions[id]; if (!s) return null;
  const mins = Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
  const sets = s.items.reduce((n, it) => n + it.sets.length, 0);
  const vol = s.items.reduce((n, it) => n + itemVolume(it), 0);
  return html`<${Sheet} label="Workout saved"><div class="eyebrow">Workout saved</div><h2>${s.name}</h2>
    <div class="trio"><div><b>${mins}</b><span>minutes</span></div><div><b>${sets}</b><span>sets</span></div>${vol > 0 ? html`<div><b>${vol >= 10000 ? fmt(vol / 1000) + 'k' : fmt(vol)}</b><span>${U()} moved</span></div>` : null}</div>
    <${RunSummary} s=${s}/>
    ${noE1(s.prs).length ? html`<div class="section-h"><h2>New PRs</h2></div><div class="prl">${noE1(s.prs).map((p, i) => html`<div key=${i}><div style="min-width:0"><div style="font-weight:600">${exName(p.ex)}${p.group ? ' · ' + p.group : ''}</div><div class="small muted">${p.value}${p.prev ? ' · was ' + p.prev : ''}</div></div><span class="pr-badge">${I.plate} ${p.label}</span></div>`)}</div>`
      : html`<p class="note" style="margin-top:14px">No new records this time. Logged weights become next workout's starting point.</p>`}
    <${SessionActions} id=${id}/>
    <button class="btn primary wide" style="margin-top:18px" onClick=${closeSheet}>Done</button><//>`;
}
/* ---------- Other activities ---------- */
const ACTS = [['run', 'Running', 1], ['walk', 'Walking / hiking', 1], ['cycle', 'Cycling', 1], ['swim', 'Swimming', 1], ['row', 'Rowing', 1], ['ruck', 'Rucking', 1],
  ['cross', 'Cross-training', 0], ['hiit', 'HIIT / conditioning', 0], ['boxing', 'Boxing', 0], ['kickbox', 'Kickboxing / Muay Thai', 0], ['mma', 'MMA', 0], ['bjj', 'BJJ / grappling', 0], ['sport', 'Sports', 0], ['yoga', 'Yoga', 0], ['mobility', 'Stretching / mobility', 0], ['other', 'Other', 0]];
const actInfo = k => ACTS.find(a => a[0] === k) || ACTS[ACTS.length - 1];
const actUnit = k => k === 'swim' ? (U() === 'kg' ? 'm' : 'yd') : (U() === 'kg' ? 'km' : 'mi');
function actLine(s) {
  const p = []; if (s.dist) p.push(fmt(s.dist) + ' ' + (s.distU || 'mi')); if (s.dur) p.push(s.dur + ' min');
  if (s.dist && s.dur && (s.distU === 'mi' || s.distU === 'km') && s.activity !== 'cycle') { const pm = s.dur / s.dist; p.push(Math.floor(pm) + ':' + String(Math.round((pm % 1) * 60)).padStart(2, '0') + ' /' + s.distU); }
  return p.join(' · ');
}
function ActivitySheet({ id, day }) {
  const s0 = id ? S.sessions[id] : null; const today = ymd(Date.now());
  const [act, setAct] = useState(s0 ? s0.activity : 'run'); const [name, setName] = useState(s0 && s0.activity === 'other' ? s0.name : '');
  const [d, setD] = useState(s0 ? ymd(s0.startedAt) : (day && day <= today ? day : today));
  const [dur, setDur] = useState(s0 && s0.dur ? String(s0.dur) : ''); const [dist, setDist] = useState(s0 && s0.dist ? String(s0.dist) : '');
  const [du, setDu] = useState(s0 && s0.distU ? s0.distU : actUnit(s0 ? s0.activity : 'run')); const [note, setNote] = useState(s0 ? s0.note || '' : '');
  const [confirm, setConfirm] = useState(false);
  const info = actInfo(act);
  const pick = k => { setAct(k); if (!dist) setDu(actUnit(k)); };
  const save = () => {
    const m = Math.max(0, Math.round(num(dur))); let start;
    if (s0 && ymd(s0.startedAt) === d) start = s0.startedAt; else if (d === today) { const d0 = new Date(); d0.setHours(0, 0, 0, 0); start = Math.max(+d0 + 60000, Date.now() - Math.max(m, 1) * 60000); }  /* a run finished just after midnight stays on today */ else { const x = parseYmd(d); x.setHours(12, 0, 0, 0); start = +x; }
    const x = { id: s0 ? s0.id : uid('s'), kind: 'activity', activity: act, name: act === 'other' ? (name.trim() || 'Other activity') : s0 && s0.fight && s0.activity === act ? s0.name : info[1], ...(s0 && s0.fight ? { fight: s0.fight } : {}), startedAt: start, endedAt: start + Math.max(m, 1) * 60000,
      updatedAt: Date.now(), items: [], prs: [], dur: m, dist: info[2] && num(dist) > 0 ? num(dist) : 0, distU: du, note: note.trim() };
    commit(st => { st.sessions[x.id] = x; }, 's_' + x.id); closeSheet(); showToast({ kind: 'info', text: x.name + (s0 ? ' updated' : ' logged') }); if (!s0) offerPlanLink(x);
  };
  const del = () => { const gone = clone(s0); commit(st => { delete st.sessions[id]; st.meta.deleted = [...(st.meta.deleted || []), id]; }, ['del:s_' + id, 'meta']); closeSheet();
    showToast({ kind: 'info', ms: 8000, text: 'Activity deleted', action: 'Undo', fn: () => commit(st => { st.sessions[id] = gone; st.meta.deleted = (st.meta.deleted || []).filter(x => x !== id); }, ['s_' + id, 'meta']) }); };
  return html`<${Sheet} label=${s0 ? 'Edit activity' : 'Log an activity'}><h2>${s0 ? 'Edit activity' : 'Log an activity'}</h2>
    <${Tip} id="activity" slot="sheet" style="margin-top:4px">Counts toward your week streak and workouts per week, like a lifting workout.<//>
    <div class="range-grid" role="group" aria-label="Activity">${ACTS.map(([k, l]) => html`<button key=${k} class=${'chip' + (act === k ? ' on' : '')} aria-pressed=${act === k} onClick=${() => pick(k)}>${l}</button>`)}</div>
    <div class="stack" style="margin-top:14px">
      ${act === 'other' ? html`<div><label class="lbl" for="ac-name">What did you do?</label><input class="field" id="ac-name" placeholder="e.g. Climbing" value=${name} onInput=${e => setName(e.target.value)}/></div>` : null}
      <div class="row" style="align-items:flex-end"><div style="flex:1"><label class="lbl" for="ac-date">Date</label><input class="field" id="ac-date" type="date" max=${today} value=${d} onChange=${e => e.target.value && setD(e.target.value)}/></div>
        <div style="flex:1"><label class="lbl" for="ac-dur">Minutes</label><input class="field" id="ac-dur" inputmode="numeric" placeholder="e.g. 45" value=${dur} onInput=${e => setDur(e.target.value.replace(/[^\d]/g, ''))}/></div></div>
      ${info[2] ? html`<div class="row" style="align-items:flex-end"><div style="flex:1"><label class="lbl" for="ac-dist">Distance (optional)</label><input class="field" id="ac-dist" inputmode="decimal" placeholder="0" value=${dist} onInput=${e => setDist(e.target.value.replace(/[^\d.,]/g, ''))}/></div>
        <div class="seg" role="group" aria-label="Distance unit" style="margin-bottom:4px">${['mi', 'km', 'm', 'yd'].map(u => html`<button key=${u} class=${du === u ? 'on' : ''} aria-pressed=${du === u} onClick=${() => setDu(u)}>${u}</button>`)}</div></div>` : null}
      <div><label class="lbl" for="ac-note">Note (optional)</label><input class="field" id="ac-note" placeholder=${act === 'run' ? 'e.g. Easy pace, hills' : 'How it went'} value=${note} onInput=${e => setNote(e.target.value)}/></div>
      <button class="btn primary wide" onClick=${save}>${s0 ? 'Save changes' : 'Save activity'}</button>
      ${s0 ? (confirm ? html`<button class="btn wide danger" onClick=${del}>Delete activity</button><button class="btn wide" onClick=${() => setConfirm(false)}>Keep it</button>`
        : html`<button class="btn text danger wide" onClick=${() => setConfirm(true)}>Delete</button>`) : null}
    </div><//>`;
}
function SessionSheet({ id }) {
  const s0 = S.sessions[id]; const [edit, setEdit] = useState(null); const [confirm, setConfirm] = useState(false);
  if (!s0) return null;
  if (s0.kind === 'activity') return html`<${ActivitySheet} id=${id}/>`;
  const s = edit || s0;
  const mins = Math.max(1, Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000));
  const save = () => { edit.items.forEach(it => { it.note = (it.note || '').trim(); it.sets = it.sets.map(x => { const o = { w: Math.max(0, num(x.w)), r: Math.round(num(x.r)) }; if (x.n && String(x.n).trim()) o.n = String(x.n).trim(); if (x.p) o.p = x.p; if (num(x.t) > 0) o.t = num(x.t); if (num(x.d) > 0) o.d = num(x.d); if (x.sp && x.sp.length) o.sp = x.sp; if (x.st) o.st = x.st; return o; }).filter(x => x.r > 0 || x.t > 0 || x.d > 0); }); edit.items = edit.items.filter(it => it.sets.length);
    if (!edit.items.length && !edit.run) { setEdit(null); del(); return; }   /* nothing left: delete it (with Undo) rather than keep an empty workout */
    edit.updatedAt = Date.now(); const e = clone(edit); commit(st => { st.sessions[id] = e; }, 's_' + id); commit(st => { st.sessions[id].prs = detectPRs(st.sessions[id]); }, 's_' + id); setEdit(null); };
  const del = () => { const gone = clone(s0); commit(st => { delete st.sessions[id]; st.meta.deleted = [...(st.meta.deleted || []), id]; }, ['del:s_' + id, 'meta']); closeSheet();
    showToast({ kind: 'info', ms: 8000, text: 'Workout deleted', action: 'Undo', fn: () => commit(st => { st.sessions[id] = gone; st.meta.deleted = (st.meta.deleted || []).filter(x => x !== id); }, ['s_' + id, 'meta']) }); };
  return html`<${Sheet} label="Workout details"><div class="eyebrow">${shortDate(s.startedAt)} · ${mins} min${s.routineName ? ' · ' + s.routineName : ''}</div><h2>${s.name}</h2>
    ${s.items.map((it, i) => { const kind = exKind(it.ex); const u = it.u || U(); return html`<div key=${i} class="ex-block"><div class="row"><h3 style="flex:1">${exName(it.ex)}</h3>${groupChip(it.group)}</div>
      ${edit ? html`<input class="ex-note" id=${'een-' + i} value=${it.note || ''} placeholder="Exercise note" aria-label="Exercise note" onInput=${e => { it.note = e.target.value; }}/>` : it.note ? html`<p class="small muted" style="margin-top:4px">${it.note}</p>` : null}
      ${edit && isMeasured(kind) ? it.sets.map((x, j) => html`<${MeasEditSet} key=${j} x=${x} j=${j} i=${i} kind=${kind} onRemove=${() => { it.sets.splice(j, 1); setEdit({ ...edit }); }}/>`) : edit ? it.sets.map((x, j) => html`<div key=${j} class="edit-set"><span class="faint num">${j + 1}</span>
          <input id=${'ew-' + i + '-' + j} inputmode="decimal" aria-label=${'Weight, ' + u} value=${x.w} onInput=${e => { x.w = e.target.value; }}/>
          <input id=${'er-' + i + '-' + j} inputmode="numeric" aria-label="Reps" value=${x.r} onInput=${e => { x.r = e.target.value; }}/>
          <input id=${'eno-' + i + '-' + j} class="note" aria-label="Set note" placeholder="Note" value=${x.n || ''} onInput=${e => { x.n = e.target.value; }}/>
          <button class="icon-btn" aria-label="Remove set" onClick=${() => { it.sets.splice(j, 1); setEdit({ ...edit }); }}>${I.x}</button></div>`)
        : html`<div class="set-tbl">${it.sets.map((x, j) => html`<span class="faint">${j + 1}</span><span>${isMeasured(kind) ? measLabel(x, kind, u) : kind === 'bodyweight' && !x.w ? x.r + ' reps' : fmt(x.w) + ' ' + u + ' × ' + x.r}${x.n ? html`<span class="set-note"> · ${x.n}</span>` : null}</span><span class="faint">${kind === 'bodyweight' || kind === 'assisted' || isMeasured(kind) ? '' : '≈ ' + fmt(r05(epley(x.w, x.r)))}</span>${noE1(x.p).length ? html`<span class="pr-line tbl">${noE1(x.p).map((t, k) => html`<span key=${k}>PR · ${t}</span>`)}</span>` : null}`)}</div>`}
      ${!edit ? noE1(s.prs).filter(p => p.ex === it.ex && p.group === (it.group || '') || (p.ex === it.ex && !p.group)).map((p, k) => html`<span key=${k} class="pr-badge" style="margin:6px 6px 0 0">${I.plate} ${p.label}</span>`) : null}
    </div>`; })}
    <div class="stack" style="margin-top:16px">
      ${edit ? html`<button class="btn primary wide" onClick=${save}>Save changes</button><button class="btn wide" onClick=${() => setEdit(null)}>Cancel</button>`
        : confirm ? html`<p class="note">Delete this workout? Its sets and PRs come out of your history.</p><button class="btn wide danger" onClick=${del}>Delete workout</button><button class="btn wide" onClick=${() => setConfirm(false)}>Keep it</button>`
        : html`<${SessionActions} id=${id} summary=${false}/><div class="row"><button class="btn" style="flex:1" onClick=${() => setEdit(clone(s0))}>${I.edit} Edit</button><button class="btn danger" style="flex:1" onClick=${() => setConfirm(true)}>${I.trash} Delete</button></div>`}
    </div><//>`;
}
function ImportSheet() {
  const [text, setText] = useState(''); const [name, setName] = useState('');
  const days = useMemo(() => parseProgram(text), [text]);
  const onFile = e => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { setText(String(rd.result || '')); if (!name) setName(f.name.replace(/\.[^.]+$/, '')); }; rd.readAsText(f); };
  const save = () => { const r = { id: uid('r'), name: name.trim() || 'Imported plan', source: 'imported', createdAt: Date.now(), days: [] };
    commit(st => { r.days = materialize(days); st.meta.routines[r.id] = r; }, 'meta'); closeSheet(); UI.setView({ type: 'routine', id: r.id }); };
  return html`<${Sheet} label="Import plan"><h2>Import a plan</h2>
    <p class="note" style="margin-bottom:10px">Paste a program from RepCount, a website, or a note. Day names go on their own line. Exercises look like <b>3x Squat</b>, <b>4x8-10 Lat Pulldown</b>, or <b>Squat 3x5</b>. Start a line with <b>x</b> to superset it with the line above.</p>
    <div class="stack">
      <div><label class="lbl" for="imp-name">Plan name</label><input class="field" id="imp-name" value=${name} placeholder="e.g. PHUL" onInput=${e => setName(e.target.value)}/></div>
      <textarea class="field" id="imp-text" placeholder=${'Day 1 - Push\n4x6-8 Bench Press\n3x10 Incline Dumbbell Press\n3x x Lateral Raise\n\nDay 2 - Pull\n...'} value=${text} onInput=${e => setText(e.target.value)}></textarea>
      <div class="row"><label class="btn" for="imp-file" style="flex:1">Choose a text file</label><input id="imp-file" type="file" accept=".txt,.md,.csv,text/plain" hidden onChange=${onFile}/></div>
      ${days.length ? html`<div class="stack">${days.map((d, i) => html`<div key=${i} class="preview-day"><b>${d.name}</b>${d.items.map((it, j) => html`<div key=${j}>${it.ss ? '↳ ' : ''}${it.sets}×${it.reps ? it.reps : ''} ${it.name}${findEx(it.name) ? '' : ' (new)'}</div>`)}</div>`)}</div>`
        : text.trim() ? html`<p class="note">No exercises found yet. Each exercise line needs a set count like 3x.</p>` : null}
      <button class="btn primary wide" disabled=${!days.length} onClick=${save}>Save ${days.length} day${days.length === 1 ? '' : 's'} as a plan</button>
    </div><//>`;
}
function RestoreSheet() {
  const [text, setText] = useState(''); const [file, setFile] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const onFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; setErr('');
    const rd = new FileReader(); rd.onload = () => { const t = String(rd.result || ''); if (t.length > 200000) { setFile({ name: f.name, text: t }); setText(''); } else { setFile(null); setText(t); } }; rd.readAsText(f); };
  const restore = async () => {
    let d; try { d = JSON.parse(file ? file.text : text); } catch (e) { setErr('That isn’t an Ironwood backup. Choose the .json file or paste the full backup text.'); return; }
    if (d && d.app === 'liftbook-photos') {
      setBusy(true); try { const n = await photoRestore(d); closeSheet(); showToast({ kind: 'info', text: n ? n + ' photo' + (n === 1 ? '' : 's') + ' restored' : 'Those photos are already here' }); }
      catch (e) { setErr('Couldn’t save the photos on this device.'); } finally { setBusy(false); } return;
    }
    if (!d || d.app !== 'liftbook' || !d.meta || typeof d.meta !== 'object') { setErr('That file isn’t an Ironwood backup.'); return; }
    if (+d.schema > SCHEMA) { setErr('That backup is from a newer version of Ironwood. Update the app, then restore it.'); return; }
    if (d.sessions != null && (typeof d.sessions !== 'object' || Array.isArray(d.sessions))) { setErr('That backup is damaged: its workouts can’t be read.'); return; }
    let r; commit(st => { r = restoreInto(st, d); }, 'meta');
    schedule(r.keys); S.ver++; applyDisplay && applyDisplay(); S.rerender(); closeSheet();
    const skipped = r.skipped ? ' · ' + r.skipped + ' damaged entr' + (r.skipped === 1 ? 'y' : 'ies') + ' skipped' : '';
    showToast({ kind: 'info', text: (r.fresh ? 'Backup restored' : r.added + ' workout' + (r.added === 1 ? '' : 's') + ' added') + skipped, ms: skipped ? 6000 : undefined });
  };
  return html`<${Sheet} label="Restore backup"><h2>Restore a backup</h2><p class="note" style="margin-bottom:10px">Choose a workout backup or a photos backup. On a fresh install this brings back everything; otherwise it adds what's missing and never overwrites what's here.</p>
    <div class="stack"><label class="btn" for="rs-file">${file ? 'Chosen: ' + file.name : 'Choose backup file'}</label><input id="rs-file" type="file" accept=".json,application/json" hidden onChange=${onFile}/>
      ${file ? null : html`<textarea class="field" id="rs-text" placeholder="…or paste the backup text" value=${text} onInput=${e => { setText(e.target.value); setErr(''); }}></textarea>`}
      ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
      <button class="btn primary wide" disabled=${busy || !(file || text.trim())} onClick=${restore}>${busy ? 'Restoring…' : 'Restore'}</button></div><//>`;
}
function ConfirmSheet({ title, body, ok, danger, onOk, alt, onAlt }) {
  return html`<${Sheet} label=${title}><h2>${title}</h2><p class="note" style="margin-bottom:14px">${body}</p>
    <div class="stack"><button class=${'btn wide ' + (danger ? 'danger' : 'primary')} onClick=${onOk}>${ok}</button>${alt ? html`<button class="btn wide" onClick=${onAlt}>${alt}</button>` : null}<button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
function SheetHost({ sheet }) {
  if (!sheet) return null;
  switch (sheet.type) {
    case 'pick': return html`<${PickSheet} ...${sheet}/>`;
    case 'group': return html`<${GroupSheet} ...${sheet}/>`;
    case 'slot': return S.active ? html`<${SlotSheet} it=${sheet.it}/>` : null;
    case 'finish': return S.active ? html`<${FinishSheet}/>` : null;
    case 'summary': return html`<${SummarySheet} id=${sheet.id}/>`;
    case 'session': return html`<${SessionSheet} id=${sheet.id}/>`;
    case 'program': return html`<${ProgramSheet}/>`;
    case 'help': return html`<${HelpSheet}/>`;
    case 'feedback': return html`<${FeedbackSheet}/>`;
    case 'colors': return html`<${ColorSheet}/>`;
    case 'activity': return html`<${ActivitySheet} day=${sheet.day}/>`;
    case 'import': return html`<${ImportSheet}/>`;
    case 'restore': return html`<${RestoreSheet}/>`;
    case 'confirm': return html`<${ConfirmSheet} ...${sheet}/>`;
    case 'setActs': return html`<${SetActsSheet} ...${sheet}/>`;
    case 'day': return html`<${DaySheet} k=${sheet.k}/>`;
    case 'chday': return html`<${ChDaySheet} id=${sheet.id} k=${sheet.k}/>`;
    case 'restPick': return html`<${RestPickSheet}/>`;
    case 'exRest': return html`<${ExRestSheet} ex=${sheet.ex}/>`;
    case 'bw': return html`<${BWSheet}/>`;
    case 'checkin': return html`<${CheckinSheet}/>`;
    case 'photo': return html`<${PhotoSheet} id=${sheet.id}/>`;
    case 'foodPick': return html`<${FoodPickSheet} ...${sheet}/>`;
    case 'foodEdit': return html`<${FoodEditSheet} ...${sheet}/>`;
    case 'mealLog': return html`<${MealLogSheet} ...${sheet}/>`;
    case 'logEntry': return html`<${LogEntrySheet} ...${sheet}/>`;
    case 'mealGoals': return html`<${GoalsSheet}/>`;
    case 'goalSetup': return html`<${GoalSetupSheet} welcome=${sheet.welcome}/>`;
    case 'ironSetup': return html`<${IronSetupSheet} ...${sheet}/>`;
    case 'mealPrefs': return html`<${PrefsSheet}/>`;
    case 'runFit': return html`<${RunFitSheet}/>`;
    case 'addonFit': return html`<${AddonFitSheet} ...${sheet}/>`;
    case 'runRestart': return html`<${RunRestartSheet}/>`;
    case 'machines': return html`<${MachinesSheet} ...${sheet}/>`;
    case 'mealTargets': return html`<${TargetsSheet} preset=${sheet.preset} step0=${sheet.step}/>`;
    case 'liftGoal': return html`<${LiftGoalSheet} ...${sheet}/>`;
    case 'prepSave': return html`<${PrepSaveSheet}/>`;
    case 'rotation': return html`<${RotationSheet}/>`;
    case 'planDates': return html`<${PlanDatesSheet} ...${sheet}/>`;
    case 'usePrep': return html`<${UsePrepSheet}/>`;
    case 'recipePick': return html`<${RecipePickSheet} ...${sheet}/>`;
    case 'planAhead': return html`<${PlanAheadSheet}/>`;
    case 'challenges': return html`<${ChallengeSheet}/>`;
    case 'calendar': return html`<${CalendarSheet}/>`;
    case 'addons': return html`<${AddonsSheet}/>`;
    case 'aboutYou': return html`<${AboutYouSheet}/>`;
    case 'planMore': return html`<${Sheet} label=${sheet.title}><h2>${sheet.title}</h2><div class="stack" style="margin-top:10px">${sheet.acts.map(([id, l, d, fn, danger]) => html`<button key=${id} id=${id} class=${'opt' + (danger ? ' danger' : '')} onClick=${fn}><div style="flex:1"><div>${l}</div>${d ? html`<div class="d">${d}</div>` : null}</div></button>`)}<button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
    case 'schedule': return html`<${Sheet} label="Your schedule"><${PlanWeekCard}/><button class="btn wide" style="margin-top:10px" onClick=${closeSheet}>Done</button><//>`;
    case 'exJump': return html`<${ExJumpSheet} ...${sheet}/>`;
    case 'measure': return html`<${MeasureSheet}/>`;
    case 'runGoal': return html`<${RunGoalSheet}/>`;
    case 'splits': return html`<${SplitsSheet} ...${sheet}/>`;
    case 'runDay': return html`<${RunDaySheet} ...${sheet}/>`;
    case 'runSwap': return html`<${RunSwapSheet} ...${sheet}/>`;
    case 'runMark': return html`<${RunMarkSheet} ...${sheet}/>`;
  }
  return null;
}
/*@include meals.js*/

/*@include run.js*/

/*@include improve.js*/

/*@include care.js*/

/*@include together.js*/

/*@include fight.js*/

/*@include schedule.js*/

/*@include layout.js*/

/*@include foodscan.js*/

/*@include prefill.js*/

/*@include growth.js*/

/*@include mealplan.js*/

/*@include mealdates.js*/

const exSideOn = ex => !!(S.meta.exSide || {})[ex];
function toggleSide(ex) {
  const on = !exSideOn(ex); commit(st => { st.meta.exSide = { ...(st.meta.exSide || {}) }; if (on) st.meta.exSide[ex] = true; else delete st.meta.exSide[ex]; }, 'meta', 400);
  showToast({ kind: 'info', text: on ? exName(ex) + ': weight is each side' : exName(ex) + ': weight is the total' });
}
function SideTog({ ex }) {
  const on = exSideOn(ex);
  return html`<button class="side-tog" id=${'side-' + ex} aria-pressed=${on} aria-label=${on ? 'Weight is for each side. Switch to total' : 'Weight is the total. Switch to each side'} title=${on ? 'Each side' : 'Total'} onClick=${() => toggleSide(ex)}>${on ? html`<span class="dot sm"></span><span class="dot sm"></span>` : html`<span class="dot"></span>`}</button>`;
}
/*@include machines.js*/

/*@include logfind.js*/

/*@include planctl.js*/

/*@include runfit.js*/

/*@include foodprefs.js*/

/*@include iron75.js*/

/*@include goals.js*/

/*@include eatreview.js*/

function HdrClock({ since }) {
  const [show, setShow] = useState(false); const [, tick] = useState(0);
  useEffect(() => {
    const check = () => { const c = document.querySelector('.wo-head .wo-clock'), h = document.querySelector('.hdr');
      setShow(!!c && !!h && c.getBoundingClientRect().bottom <= h.getBoundingClientRect().bottom + 1); };
    const iv = setInterval(() => { check(); tick(x => x + 1); }, 1000);
    window.addEventListener('scroll', check, { passive: true }); check();
    return () => { clearInterval(iv); window.removeEventListener('scroll', check); };
  }, []);
  if (!show) return null;
  return html`<span class="hdr-clock" id="hdr-clock" role="timer" aria-label="Elapsed time">${clock(Math.max(0, Math.floor((Date.now() - since) / 1000)))}</span>`;
}
/*@include labelread.js*/

const KB = { open: false };
function settleScroll() { const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight); const y = Math.min(window.scrollY, max); window.scrollTo(window.scrollX, y + 1); window.scrollTo(window.scrollX, y); }
function kbFit(h, top) {
  const r = document.documentElement; const kb = Math.max(0, window.innerHeight - h - top);
  if (kb > 80) { r.style.setProperty('--vvh', h + 'px'); r.style.setProperty('--vvt', top + 'px'); r.classList.add('kb-open'); }
  else { r.style.removeProperty('--vvh'); r.style.removeProperty('--vvt'); r.classList.remove('kb-open');
    /* iPhone can leave the page nudged up after the keyboard closes on a short screen, which lifts the tab bar off the
       bottom (Nov 10, Newt's Meals screenshot). Settle the scroll back inside the page once the keyboard is gone. */
    if (KB.open || top > 0) setTimeout(settleScroll, 80); }
  KB.open = kb > 80;
  const a = document.activeElement;
  if (kb > 80 && a && a.closest && a.closest('.sheet')) setTimeout(() => { try { a.scrollIntoView({ block: 'nearest' }); } catch (e) {} }, 60);
}
if (window.visualViewport) { const vv = window.visualViewport; const on = () => kbFit(vv.height, vv.offsetTop); vv.addEventListener('resize', on); vv.addEventListener('scroll', on); }
/*@include tilt.js*/

/*@include about.js*/

function SetActsSheet({ it, s }) {
  const j = it.sets.indexOf(s); if (j < 0) return null; const done = isDone(s);
  const go = fn => { closeSheet(); fn(); };
  return html`<${Sheet} label=${'Set ' + (j + 1)}><h2>Set ${j + 1}</h2><p class="note">${exName(it.ex)}${done ? ' · logged' : ''}</p>
    <div class="stack" style="margin-top:12px">
      <button class="btn wide" id="sa-log" onClick=${() => go(() => { if (done) uncompleteSet(it, s, false); else completeSet(it, s, false); S.rerender(); })}>${done ? 'Clear this set' : 'Log this set'}</button>
      <button class="btn wide" id="sa-copy" onClick=${() => go(() => copySet(it, s))}>Copy set</button>
      <button class="btn wide danger" id="sa-del" onClick=${() => go(() => deleteSet(it, s))}>Delete set</button>
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* ---------- APP ---------- */
const TABS = [['train', 'Train'], ['routines', 'Plans'], ['meals', 'Meals'], ['stats', 'Progress'], ['profile', 'Profile']];
function App() {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState(() => { const h = (location.hash || '').slice(1); if (h === 'log' || lsGet('tab') === 'log') { lsSet('statsTab', 'history'); return 'stats'; } return TABS.some(t => t[0] === h) ? h : (lsGet('tab') || 'train'); });
  const [view, setView] = useState(null); const [sheet, setSheet] = useState(null);
  S.rerender = () => setTick(x => x + 1);
  useEffect(() => { wakeSync(); });
  useEffect(() => { measureBars(); });
  UI.setSheet = setSheet; UI.setView = v => { setView(v); scrollTo(0, 0); };
  UI.setTab = k => { setTab(k); setView(null); lsSet('tab', k); scrollTo(0, 0); };
  useEffect(() => { const k = e => { if (e.key === 'Escape') setSheet(null); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const vt = view && view.type;
  let title = { train: S.active ? 'Workout' : '', routines: '', stats: view ? 'Progress' : '', profile: '' }[tab];
  if (tab === 'routines' && vt === 'routine') title = 'Plan';
  if (tab === 'meals' && vt === 'meal') title = 'Recipe';
  if (tab === 'meals' && vt === 'mealEdit') title = view.isNew ? 'New recipe' : 'Edit recipe';
  if (tab === 'meals' && vt === 'foods') title = 'My foods';
  if (tab === 'meals' && vt === 'eatReview') title = 'Review my eating';
  if (tab === 'meals' && vt === 'base') title = 'Mix & match';
  if (tab === 'train' && vt === 'timer') title = 'Timer';
  if (tab === 'train' && vt === 'fight') title = 'Fight coach';
  if (tab === 'train' && vt === 'challenge') title = 'Challenge';
  if (tab === 'train' && vt === 'chEdit') title = view.isNew ? 'New challenge' : 'Edit challenge';
  if (tab === 'routines' && vt === 'edit') title = view.isNew ? 'New plan' : 'Edit plan';
  if (tab === 'stats' && vt === 'photoCap') title = 'Check-in';
  if (tab === 'profile' && vt === 'advanced') title = 'Training settings';
  if (tab === 'stats' && vt === 'photoCmp') title = 'Compare';
  let left = null, right = null;
  if (tab === 'train' && S.active && !view) left = html`<${HdrClock} since=${S.active.startedAt}/>`;
  if (view) left = html`<button class="pill-btn" onClick=${() => UI.setView(view.from ? view.from : vt === 'edit' && !view.isNew ? { type: 'routine', id: view.draft.id } : vt === 'chEdit' && !view.isNew ? { type: 'challenge', id: view.draft.id } : vt === 'mealEdit' && !view.isNew ? { type: 'meal', id: view.draft.id } : null)}>${I.back} Back</button>`;
  if (tab === 'train' && S.active && !view) right = html`<button class="pill-btn accent" onClick=${() => openSheet({ type: 'finish' })}>Finish</button>`;
  const trainBody = vt === 'timer' ? html`<${TimerScreen}/>` : vt === 'fight' ? html`<${FightRun}/>` : vt === 'challenge' ? html`<${ChallengeView} id=${view.id}/>` : vt === 'chEdit' ? html`<${ChallengeEditor} view=${view}/>` : S.active ? html`<${ActiveWorkout}/>` : html`<${TrainSwitch}/>`;
  const body = tab === 'train' ? trainBody : tab === 'routines' ? html`<${RoutinesScreen} view=${view}/>` : tab === 'meals' ? html`<${MealsScreen} view=${view}/>` : tab === 'stats' ? html`<${StatsScreen} view=${view}/>` : html`<${ProfileScreen} view=${view}/>`;
  const showMini = !!S.itimer && !(tab === 'train' && vt === 'timer');
  const showFight = !showMini && fRunning() && !(tab === 'train' && vt === 'fight');
  return html`
    ${title || left || right ? html`<header class="hdr"><div class="hdr-in"><div class="l">${left}</div><h1>${title}</h1><div class="r">${right}</div></div></header>` : html`<div class="hdr-space"></div>`}
    ${showMini ? html`<${IntervalMini}/>` : null}
    ${showFight ? html`<${FightMini}/>` : null}
    <main class=${showMini || showFight ? 'with-mini' : ''} style=${S.rest ? { paddingBottom: 'calc(var(--tabs-h,calc(66px + env(safe-area-inset-bottom,0px))) + var(--rest-h,70px) + 84px)' } : null}>${!view && (tab === 'stats' || tab === 'profile') ? html`<div class="topsw"><h1 class="page-title">${tab === 'stats' ? 'Progress' : 'Profile'}</h1></div><p class="small muted tab-intro" style="margin:2px 0 8px">${tab === 'stats' ? 'Your history, numbers and photos.' : 'Backups, settings and help.'}</p>` : null}${body}<${HelpFoot}/></main>
    <${Toast}/>
    <${Announcer}/>
    ${S.rest ? html`<${RestBar}/>` : null}
    <nav class="tabs" aria-label="Sections"><div class="tabs-in">${TABS.map(([k, l]) => html`<button key=${k} class=${'tab' + (tab === k ? ' on' : '')} aria-current=${tab === k ? 'page' : null} onClick=${() => UI.setTab(k)}>${I[k]}<span>${l}${k === 'train' && S.active && tab !== 'train' ? ' •' : ''}</span></button>`)}</div></nav>
    <${SheetHost} sheet=${sheet}/>
    ${S.tour ? html`<${TourOverlay}/>` : null}`;
}
/* Save whatever is in storage as a file (or to the clipboard), even when the app itself can't run */
async function saveRawData(raw, name) {
  const C = window.claude; let dl = null; try { dl = C && C.use ? await C.use('downloads') : null; } catch (e) {}
  if (dl) { try { await dl.save({ filename: name, data: raw }); return 'Saved.'; } catch (e) { if (e && e.code === 'declined') return 'Not saved.'; } }
  try { await navigator.clipboard.writeText(raw); return 'Copied to the clipboard. Paste it into a note to keep it.'; } catch (e) { return 'Couldn’t save or copy here.'; }
}
/* Shown instead of the app when the saved data can't be read. Nothing is written until the person decides. */
function RecoveryScreen() {
  const [msg, setMsg] = useState(''); const [sure, setSure] = useState(false);
  const save = async () => setMsg(await saveRawData(lsBroken, 'ironwood-data-' + ymd(new Date()) + '.txt'));
  const fresh = () => { try { localStorage.removeItem(LS); } catch (e) {} lsBroken = null; location.reload(); };
  return html`<main><div class="card stack" style="margin-top:24px">
    <h2>Saved data couldn’t be read</h2>
    <p class="note">The workouts saved on this device are there but damaged, so the app can’t open them. Nothing new will be saved until this is sorted out. A copy has been kept.</p>
    <p class="note">Save the raw data first, then start fresh and restore your latest backup.</p>
    <button class="btn primary wide" onClick=${save}>Save raw data</button>
    ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
    ${sure ? html`<button class="btn danger wide" onClick=${fresh}>Yes, start fresh</button>` : html`<button class="btn wide" onClick=${() => setSure(true)}>Start fresh…</button>`}
    <button class="btn text wide" onClick=${() => location.reload()}>Try again</button>
  </div></main>`;
}
/* A render error used to leave a blank page. Now it shows what went wrong, with a way to get the data out. */
class Guard extends htmPreact.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  componentDidCatch(err) { try { if (typeof ERRS !== 'undefined') { ERRS.push(String(err && err.message || err).slice(0, 200)); if (ERRS.length > 5) ERRS.shift(); } } catch (e) {} this.setState({ err }); }
  render() { return this.state.err ? html`<${CrashScreen} err=${this.state.err} retry=${() => this.setState({ err: null })}/>` : this.props.children; }
}
function CrashScreen({ err, retry }) {
  const [msg, setMsg] = useState('');
  const save = async () => { let raw = ''; try { raw = localStorage.getItem(LS) || ''; } catch (e) {} setMsg(raw ? await saveRawData(raw, 'ironwood-backup-' + ymd(new Date()) + '.json') : 'Nothing is saved on this device yet.'); };
  return html`<main><div class="card stack" style="margin-top:24px">
    <h2>Something went wrong</h2>
    <p class="note">The app hit an error it couldn’t recover from. Your saved workouts are still on this device.</p>
    <p class="small muted" style="word-break:break-word">${String(err && err.message || err).slice(0, 300)}</p>
    <button class="btn primary wide" onClick=${retry}>Try again</button>
    <button class="btn wide" onClick=${save}>Save backup file</button>
    ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
    <button class="btn text wide" onClick=${() => location.reload()}>Reload the app</button>
  </div></main>`;
}
(async function boot() {
  const l = migrateData(await storeLoad());
  if (l) { S.meta = normalizeMeta(l.meta);
    if (l.rest && typeof l.rest === 'object' && +l.rest.until > Date.now()) S.rest = l.rest;
    if (l.itimer && typeof l.itimer === 'object' && l.itimer.cfg && Array.isArray(l.itimer.phases)) S.itimer = l.itimer; S.sessions = cleanSessions(l.sessions).sessions; S.active = l.active && typeof l.active === 'object' ? l.active : null; S.activeAt = l.activeAt || 0; S.dirty = new Set(Array.isArray(l.dirty) ? l.dirty : []); }
  if (window.claude && window.claude.standalone) S.dirty = new Set();
  migrateExIds(S);
  applyDisplay(); l10nLoad();
  if (lsBroken) { render(html`<${RecoveryScreen}/>`, document.getElementById('app')); return; }
  if (storeBlocked) { render(html`<${StoreBlockedScreen}/>`, document.getElementById('app')); return; }
  render(html`<${Guard}><${App}/><//>`, document.getElementById('app'));
  setInterval(audioTick, 200);
  setTimeout(l10nStart, 0);
  initCloud();
  setTimeout(() => { if (lsGet('tourDone') !== '1' && !S.active && !Object.keys(S.sessions).length) startTour('short'); }, 1400);
})();

