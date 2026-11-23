/* Progress photo reminders (Nov 23, Newt: "a pop-up reminder for progress pictures people can set it for before and
   after workouts or on a specific day of the week or time").
   settings.photoRem = { before, after: bool, every: 'week' | 'each', weekly: bool, dow: 0–6 (0 = Sunday), time: 'HH:MM',
   lastAsk: ymd (asked or answered), last: ymd (photos taken from a reminder) }.
   Before: a pop-up when a workout starts. After: a card on the workout summary. Weekly: a pop-up when the app is open at
   or after that day and time, until photos are taken or it's dismissed. A web app can't pop up while it's closed, so
   "Add to phone calendar" saves a repeating calendar event with an alert at that time. */
const PHR_DEF = { before: false, after: false, every: 'week', weekly: false, dow: 0, time: '08:00' };
const prSet = () => ({ ...PHR_DEF, ...(S.meta.settings.photoRem || {}) });
const prCommit = patch => commit(st => { st.meta.settings.photoRem = { ...prSet(), ...patch }; }, 'meta');
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const prTime = t => { const [h, m] = String(t || '08:00').split(':').map(Number); const d = new Date(2000, 0, 1, h || 0, m || 0); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
/* Last day with progress photos: the photo store when loaded, or what a reminder recorded */
function prLastShot() { const p = prSet(); const ds = (PH.list || []).map(x => x.date); if (p.last) ds.push(p.last); return ds.sort().pop() || ''; }
/* This week's weekly reminder moment (weeks start Monday, so Sunday is the week's last day) */
function prWeeklyAt(now = new Date()) { const p = prSet(); const [h, m] = String(p.time).split(':').map(Number); const ws = startOfWeek(now); const d = addDays(ws, (p.dow + 6) % 7); d.setHours(h || 0, m || 0, 0, 0); return d; }
function prDue(when, now = new Date()) {
  const p = prSet(); const today = ymd(now); const shot = prLastShot();
  if (when === 'weekly') { if (!p.weekly) return false; const at = prWeeklyAt(now); return now >= at && shot < ymd(at) && (p.lastAsk || '') < ymd(at); }
  if (!p[when] || p.lastAsk === today || shot === today) return false;
  if (p.every === 'week') { const wk = ymd(startOfWeek(now)); if (shot >= wk || (p.lastAsk || '') >= wk) return false; }
  return true;
}
function prTake() { prCommit({ lastAsk: ymd(new Date()), last: ymd(new Date()) }); closeSheet(); UI.setTab('stats'); lsSet('statsTab', 'photos'); setTimeout(() => openSheet({ type: 'checkin' }), 60); }
function prLater() { prCommit({ lastAsk: ymd(new Date()) }); closeSheet(); }
function prMaybe(when) { const p = prSet(); if (!(when === 'weekly' ? p.weekly : p[when])) return; if (!PH.list) { phLoad().then(() => prMaybe(when)); return; } if (SHEET_H.open || !prDue(when)) return; openSheet({ type: 'photoRem', when }); }
const PHR_TEXT = { before: ['Progress photos first?', 'A quick check-in before your first set, in the same light and poses as last time. Your workout keeps running.'],
  weekly: ['Progress photo day', 'Your weekly check-in. Same poses, same light and about the same time of day make the photos easy to compare.'] };
function PhotoRemSheet({ when }) {
  const [h, t] = PHR_TEXT[when] || PHR_TEXT.weekly;
  return html`<${Sheet} label=${h}><h2>${h}</h2><p class="note">${t}</p>
    <div class="stack" style="margin-top:14px"><button class="btn primary wide" id="pr-take" onClick=${prTake}>${I.camera} Take photos</button>
      <button class="btn wide" id="pr-later" onClick=${prLater}>Not now</button>
      <button class="btn text wide" id="pr-settings" onClick=${() => openSheet({ type: 'photoRemSet' })}>Reminder settings</button></div><//>`;
}
/* On the workout summary (the after-workout reminder) */
function PhotoRemCard() {
  if (!prDue('after')) return null;
  return html`<div class="card" id="pr-after" style="margin-top:14px"><div style="font-weight:700">Progress photos now?</div><p class="small muted" style="margin-top:2px">Right after a workout, in the same poses as last time.</p>
    <div class="row" style="margin-top:8px;gap:8px"><button class="btn primary" style="flex:2" id="pr-after-take" onClick=${prTake}>${I.camera} Take photos</button><button class="btn" style="flex:1" id="pr-after-later" onClick=${() => { prCommit({ lastAsk: ymd(new Date()) }); S.rerender(); }}>Not now</button></div></div>`;
}
function prSummary() { const p = prSet(); const a = [p.before && 'before workouts', p.after && 'after workouts'].filter(Boolean); const parts = [];
  if (a.length) parts.push(a.join(' and ') + (p.every === 'week' ? ' (first workout of the week)' : ''));
  if (p.weekly) parts.push(DOW_LONG[p.dow] + 's at ' + prTime(p.time)); return parts.length ? parts.join(' · ') : 'Off'; }
function PhotoRemRow() { return html`<button class="opt" id="photo-rem" onClick=${() => openSheet({ type: 'photoRemSet' })}>${I.timer}<div style="flex:1"><div>Photo reminders</div><div class="d">${prSummary()}</div></div></button>`; }
/* A repeating calendar event with an alert, so the phone reminds you even with Ironwood closed */
function prIcs() {
  const p = prSet(); const at = prWeeklyAt(); if (at < new Date()) at.setDate(at.getDate() + 7);
  const z = n => String(n).padStart(2, '0'); const loc = d => d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' + z(d.getHours()) + z(d.getMinutes()) + '00';
  const now = new Date(); const stamp = now.getUTCFullYear() + z(now.getUTCMonth() + 1) + z(now.getUTCDate()) + 'T' + z(now.getUTCHours()) + z(now.getUTCMinutes()) + '00Z';
  const day = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][p.dow];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ironwood//Photo reminder//EN', 'BEGIN:VEVENT', 'UID:ironwood-progress-photos-' + day + '@ironwood', 'DTSTAMP:' + stamp, 'DTSTART:' + loc(at), 'DURATION:PT10M',
    'RRULE:FREQ=WEEKLY;BYDAY=' + day, 'SUMMARY:Progress photos (Ironwood)', 'DESCRIPTION:Open Ironwood → Progress → Photos → New check-in.', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Progress photos', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
async function prAddToCalendar() {
  const txt = prIcs(); const name = 'ironwood-progress-photos.ics';
  try { const C = window.claude; const dl = C && C.use ? await C.use('downloads') : null;
    if (dl) { await dl.save({ filename: name, data: new Blob([txt], { type: 'text/calendar' }) }); showToast({ kind: 'info', text: 'Calendar file saved. Open it to add the weekly reminder.' }); return; } } catch (e) {}
  const a = document.createElement('a'); a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(txt); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function PhotoRemSetSheet() {
  const p = prSet(); const set = patch => prCommit(patch);
  const row = (k, label, sub) => html`<label class="toggle-row" for=${'pr-' + k}><span><span>${label}</span>${sub ? html`<span class="d">${sub}</span>` : null}</span><input type="checkbox" role="switch" id=${'pr-' + k} checked=${!!p[k]} onChange=${e => set({ [k]: e.target.checked })}/></label>`;
  return html`<${Sheet} label="Photo reminders"><h2>Photo reminders</h2><p class="note">Pick when Ironwood asks you to take progress photos. The same poses, light and time of day make them easy to compare.</p>
    <div class="stack" style="gap:12px;margin-top:12px">
      ${row('before', 'Before workouts', 'A pop-up when you start a workout')}
      ${row('after', 'After workouts', 'A card on the workout summary')}
      ${p.before || p.after ? html`<div><span class="lbl">How often</span><div class="seg wide">${[['week', 'First workout of the week'], ['each', 'Every workout']].map(([k, l]) => html`<button key=${k} class=${p.every === k ? 'on' : ''} aria-pressed=${p.every === k} onClick=${() => set({ every: k })}>${l}</button>`)}</div></div>` : null}
      ${row('weekly', 'On a day and time', 'A pop-up when Ironwood is open at or after that time, until you take them')}
      ${p.weekly ? html`<div><span class="lbl">Day</span><div class="plan-chips" role="group" aria-label="Day of the week">${[1, 2, 3, 4, 5, 6, 0].map(d => html`<button key=${d} class=${'chip' + (p.dow === d ? ' on' : '')} aria-pressed=${p.dow === d} onClick=${() => set({ dow: d })}>${DOW_LONG[d].slice(0, 3)}</button>`)}</div>
        <label class="lbl" for="pr-time" style="margin-top:10px;display:block">Time</label><input class="field" type="time" id="pr-time" value=${p.time} onChange=${e => e.target.value && set({ time: e.target.value })} style="max-width:160px"/>
        <button class="btn wide" id="pr-ics" style="margin-top:12px" onClick=${prAddToCalendar}>Add to phone calendar</button>
        <p class="small muted" style="margin-top:6px">A web app can’t pop up while it’s closed. The calendar event repeats every ${DOW_LONG[p.dow]} at ${prTime(p.time)} with an alert, so your phone reminds you either way. Add it again if you change the day or time.</p></div>` : null}
    </div>
    <button class="btn primary wide" style="margin-top:14px" onClick=${closeSheet}>Done</button><//>`;
}
