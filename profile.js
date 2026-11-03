/* ============ Profile, grouped (Nov 2, design review phase 6) ============ */
/* Settings in six groups, in the order people look for them: Data and backups first, then Appearance and accessibility,
   Training preferences, Units, Rest timers and sounds, Help. Each group opens in place with a one-line summary, so the
   page is short and nothing is nested more than one level. Every setting and its behavior is unchanged; the stale
   'Nutrition: coming later' card is gone (Meals exists). Generated from the previous ProfileScreen's pieces. */
function ProfileScreen() {
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
  const [grp, setGrp] = useState(() => lsGet('profGrp') || '');
  const openG = k => { const v = grp === k ? '' : k; setGrp(v); lsSet('profGrp', v); };
  const palName = (PALETTES[DISP.palette] || [DISP.palette === 'custom' ? 'Custom' : 'Classic'])[0];
  const G = (k, title, sub, content) => html`<section class=${'pgrp' + (grp === k ? ' open' : '')} key=${k}>
    <button class="pgrp-h" id=${'pg-' + k} aria-expanded=${grp === k} onClick=${() => openG(k)}><span style="flex:1;min-width:0"><span class="pgrp-t">${title}</span><span class="pgrp-s">${sub}</span></span>${grp === k ? I.up : I.down}</button>
    ${grp === k ? html`<div class="pgrp-b">${content}</div>` : null}</section>`;
  return html`<div class="stack" style="gap:10px">
    <div class=${'sync ' + S.sync} style="margin-top:6px"><i></i><span>${SYNC_TEXT[S.sync] || ''}</span></div>
    <div class="pgroups">
    ${G('data', 'Data and backups', lastBackupText(), html`
    <div class="stack">
      <div class="row wrap"><button class="btn" id="backup-file" onClick=${exportFile}>Save backup file</button><button class="btn" onClick=${copyBackup}>Copy backup</button><button class="btn" onClick=${() => openSheet({ type: 'restore' })}>Restore</button></div>
      <div class="row wrap">${phb ? html`<button class="btn primary" onClick=${savePhotos}>Save ${phb.count} photo${phb.count === 1 ? '' : 's'}</button>` : html`<button class="btn" onClick=${preparePhotos}>Prepare photos backup</button>`}</div>
      <p class="note">The backup file has workouts, routines and settings. Progress photos are large, so they go in their own file.</p>
      ${msg ? html`<p class="small muted" role="status">${msg}</p>` : null}
      <p class="note">${Object.keys(S.sessions).length} workouts · ${Object.keys(S.meta.routines).length} routines · ${Object.keys(S.meta.exercises).length} custom exercises</p>
      <p class="note" id="last-backup">${lastBackupText()}</p>
      <${StorageNote}/>
    </div>
    `)}
    ${G('look', 'Appearance and accessibility', [DISP.theme === 'system' ? 'System theme' : DISP.theme === 'light' ? 'Light' : 'Dark', palName, DISP.hc ? 'High contrast' : '', DISP.rm ? 'Reduced motion' : ''].filter(Boolean).join(' · '), html`<${DisplayCard}/>`)}
    ${G('training', 'Training preferences', st.goal + ' workouts a week · jumps of ' + st.inc + ' ' + st.unit, html`
    <div class="stack" style="gap:14px">
      <div class="row" style="align-items:flex-start">${field('goal', 'Workouts per week')}</div>
      <div class="row" style="align-items:flex-start">${field('inc', 'Weight jump (' + st.unit + ')')}${field('bar', 'Barbell (' + st.unit + ')')}</div>
      <p class="note">When you hit the top of an exercise's rep range on every set, the next workout adds its weight jump: this amount, or twice it on barbell deadlifts, unless you set one for that exercise.</p>
      <${ProgressionSettings} set=${set}/>
    </div>
    <${PRCard}/>
    <div class="lbl" style="margin-top:6px">Streaks</div>
    <div class="card stack" style="gap:8px">
      ${tog('excuse', 'Sick, injured and break days pause streaks', "They lower that week's goal instead of breaking your streak, and pause challenges.")}
      <p class="note">Mark a day by tapping it in the week strip on Train. Rest days are labels only; your weekly goal already leaves room for them.</p>
    </div>
    <div class="note">Give an exercise a range like 5–8, 8–12, max reps or 1 rep max and that range keeps its own weights, prefills, chart and PRs. Curls done two ways never overwrite each other. Records still count across every range.</div>
    `)}
    ${G('units', 'Units and measurements', 'Main unit: ' + st.unit, html`<div class="stack" style="gap:14px">
      <div><span class="lbl">Main unit</span><div class="seg">${['lb', 'kg'].map(u => html`<button key=${u} class=${st.unit === u ? 'on' : ''} onClick=${() => switchMainUnit(u)}>${u}</button>`)}</div>
        <p class="note" style="margin-top:6px">Any exercise can switch between lb and kg during a workout by tapping the unit above its sets. Stats convert everything to your main unit.</p></div>
    </div>`)}
    ${G('rest', 'Rest timers and sounds', clock(+st.rest || 0) + ' rest · ' + (st.beep ? 'beep on' : 'beep off'), html`
    <div class="stack" style="gap:12px">
      <div class="row" style="align-items:flex-start">${restField('rest', 'Single rest (sec)')}${restField('restSS', 'Superset rest (sec)')}</div>
      <div><span class="lbl">Superset rest starts</span><div class="seg wide">${[['each', 'After each exercise'], ['round', 'After the full round']].map(([k, l]) => html`<button key=${k} class=${st.ssMode === k ? 'on' : ''} onClick=${() => set('ssMode', k)}>${l}</button>`)}</div></div>
      ${tog('autoRest', 'Start the timer when a set is logged')}
      ${tog('beep', 'Beep when time is up', 'Interval timers also beep at each change.')}
      ${tog('countdown', 'Beep the last 3 seconds')}
      ${tog('bgAudio', 'Beep with the phone locked (beta)', 'Plays a silent track carrying the beeps, so they sound with the screen off or in another app. The phone treats it as media, so it may pause music, and some apps block it.')}
      ${exR.length ? html`<div><span class="lbl">Per-exercise rest</span>${exR.map(([ex, v]) => html`<div key=${ex} class="row small" style="min-height:40px"><span style="flex:1">${exName(ex)}</span><b class="num">${v ? clock(v) : 'Off'}</b><button class="icon-btn" aria-label=${'Use defaults for ' + exName(ex)} onClick=${() => commit(x => { delete x.meta.exRest[ex]; }, 'meta', 600)}>${I.x}</button></div>`)}</div>` : null}
      <p class="note">Now ${clock(+st.rest || 0)} after a single exercise and ${clock(+st.restSS || 0)} after a superset. 0 turns one off. Tap the time on a running timer to pick another, or set one exercise's rest from its ⋯ menu. Without the beta setting, sounds play only while Ironwood is on screen.</p>
      <button class="btn wide" onClick=${() => { UI.setTab('train'); UI.setView({ type: 'timer' }); }}>${I.timer} Open the interval timer</button>
    </div>
    `)}
    ${G('help', 'Help and information', 'Tour, feedback, privacy', html`
    <div class="stack" style="gap:8px"><button class="btn wide" id="profile-tour" onClick=${startTour}>Take the tour again</button><button class="btn wide" onClick=${() => openSheet({ type: 'feedback' })}>Send feedback</button></div>
    <div class="about-slot"></div>
    `)}
    </div>
  </div>`;
}
