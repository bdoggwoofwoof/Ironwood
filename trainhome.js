/* ============ Train home, reordered (Nov 2, design review phase 2) ============ */
/* Answers three questions in order: what am I doing next, how do I start, what does my week look like.
   1. The next workout (title, exercise preview, one Start), or the self-log / get-started card.
   2. Plan check-ins (only when something slipped) and anything planned alongside today.
   3. One week strip: a filled check = done, a ring with a colored dot = planned. Planning the week opens in a sheet.
   4. Other days of the program, an empty workout, other activities, the interval timer.
   5. Supporting things: active challenges or the challenge finder, lift goals, month in review.
   6. Backup prompts. Help sits at the bottom of every page. */
function TrainHome() {
  const nx = nextUp(); const ws = weekStats(); const routine = nx && nx.routine; const now = new Date(); const pid = programId();
  const chs = Object.values(S.meta.challenges || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const newCh = () => UI.setView({ type: 'chEdit', draft: newChallenge(), isNew: true });
  const weekTxt = ws.thisReq === 0 ? 'Streak paused this week' : ws.thisCount + ' of ' + ws.thisReq + ' workouts' + (ws.thisExc ? ' (' + ws.thisExc + ' excused)' : '') + (ws.cur ? ' · ' + ws.cur + '-week streak' : '');
  const fresh = !pid && !Object.keys(S.sessions).length;
  const hasPlan = typeof planList === 'function' && planList().length > 0;
  const head = nx ? html`
      <div class="next-card" id="next-card">
        <div><div class="row" style="gap:8px"><div class="eyebrow" style="flex:1;min-width:0">Up next · ${routine.name}</div><button class="btn text btn-sm" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Change</button></div>
          <h2>${nx.day.name}</h2><div class="small muted">${nx.last ? 'Last time: ' + dayLabel({ name: nx.last.name }) : 'First workout of this plan'}</div></div>
        <div class="next-list">${nx.day.items.map(it => html`<div key=${it.id} class=${it.ss ? 'ssl' : ''}>${exName(it.ex)}<span class="faint num"> · ${it.sets} × ${it.reps || ''}</span>${it.group ? ' · ' + (RANGE_NAME[it.group] && (it.group === '1RM' || it.group === 'Max') ? RANGE_NAME[it.group] : it.group) : ''}</div>`)}</div>
        <button class="btn primary wide" id="start-next" onClick=${() => startWorkout(routine, nx.day)}>Start ${nx.day.name.split(/\s+[-–]\s+/)[0]}</button>
      </div>`
    : pid === 'self' ? html`
      <div class="next-card" id="self-card"><div><div class="row" style="gap:8px"><div class="eyebrow" style="flex:1">Self-log</div><button class="btn text btn-sm" id="change-program" onClick=${() => openSheet({ type: 'program' })}>Follow a program</button></div>
        <h2>Log your own workout</h2></div><p class="note">Start an empty workout and add exercises as you go. Weights carry over from last time.</p>
        <button class="btn primary wide" onClick=${() => startWorkout(null, null)}>${I.plus} Start a workout</button></div>`
    : html`
      <div class="next-card" id="get-started"><div><div class="eyebrow">Get started</div><h2>Pick how you train</h2></div><p class="note">Answer a few questions and Ironwood fits a plan to you, or follow any program, or self-log whatever you do.</p>
        <button class="btn primary wide" id="gs-start" onClick=${() => openSheet({ type: 'goalSetup' })}>Build my plan</button>
        <button class="btn wide" onClick=${() => openSheet({ type: 'program' })}>Choose a program</button></div>`;
  return html`<div class="today">
    <div class="eyebrow" style="margin:4px 0 10px">${DOW_FULL[now.getDay()]} · ${MON[now.getMonth()]} ${now.getDate()}</div>
    ${head}
    <${PhaseCheck}/>
    <${PlanCheckIn}/>
    <${AlsoToday} nx=${nx} quiet=${!nx && !pid}/>
    <div class="section-h"><h2>This week</h2>${fresh ? null : html`<span class="aside num">${weekTxt}</span>`}</div>
    <${WeekStrip}/>
    <div class="week-foot"><div style="flex:1;min-width:0"><${Tip} id="week">Tap a day to mark rest or log an activity.<//></div>${hasPlan ? html`<button class="btn text btn-sm" id="plan-week-open" onClick=${() => openSheet({ type: 'planWeek' })}>Plan your week</button>` : null}</div>
    ${nx && routine.days.length > 1 ? html`<div class="section-h"><h2>Other days</h2><button class="btn text btn-sm" onClick=${() => UI.setTab('routines')}>All routines</button></div>
      <div class="list-group">${routine.days.filter(d => d.id !== nx.day.id).map(d => html`<button key=${d.id} class="day-btn" onClick=${() => startWorkout(routine, d)}>
        <div><div class="t">${d.name}</div><div class="s">${d.items.length} exercises</div></div><span class="go">Start</span></button>`)}</div>` : null}
    <div class="list-group" style="margin-top:12px" id="train-more">
      ${nx ? html`<button class="row-btn" onClick=${() => startWorkout(null, null)}>${I.plus}<span>Empty workout</span></button>` : null}
      ${pid === 'self' ? html`<button class="row-btn" onClick=${() => UI.setTab('routines')}>${I.layers}<span>Start a saved routine</span></button>` : null}
      <button class="row-btn" id="log-activity" onClick=${() => openSheet({ type: 'activity' })}>${I.plus}<span>Log another activity</span></button>
      <button class="row-btn" id="timer-open" onClick=${() => UI.setView({ type: 'timer' })}>${I.timer}<span>Interval timer</span></button></div>
    ${chs.length ? html`<div class="section-h"><h2>Challenges</h2><button class="btn text btn-sm" onClick=${newCh}>New</button></div>
      <div class="stack">${chs.map(ch => html`<${ChallengeCard} key=${ch.id} ch=${ch}/>`)}</div>` : null}
    <${GoalsCard}/>
    <${MonthCard}/>
    <${ChallengeFinder} where="train"/>
    ${window.claude && window.claude.standalone && !Object.keys(S.sessions).length && !Object.keys(S.meta.routines).length && lsGet('restoreHint') !== 'off' ? html`<div class="inline-note" id="restore-hint">
      <span><b>Moving from another phone?</b> Restore your backup file to bring back your workouts, routines and settings.</span>
      <span class="row" style="gap:4px"><button class="btn text btn-sm" onClick=${() => openSheet({ type: 'restore' })}>Restore</button><button class="btn text btn-sm muted-btn" onClick=${() => { lsSet('restoreHint', 'off'); S.rerender(); }}>Not now</button></span></div>` : null}
    <${LegacyTimedCard}/>
    ${window.claude && window.claude.standalone ? html`<${BackupNudge}/>` : null}
  </div>`;
}
function PlanWeekSheet() {
  return html`<${Sheet} label="Plan your week"><h2>Plan your week</h2><p class="note">Tap a day to plan it or clear it. Add a program alongside, or save your week to your calendar app.</p>
    <div style="margin-top:10px"><${PlanWeekCard}/></div><//>`;
}
