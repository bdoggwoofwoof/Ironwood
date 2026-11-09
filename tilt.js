/* ============ Level for check-in photos (Nov 9, Newt's request) ============
   The phone's motion sensor (devicemotion, gravity) tells how far the phone leans: pitch = top toward or away from
   the screen side, roll = one side lower. The check-in camera shows a bubble and plain directions, green when the
   phone matches the last photo's angle (saved with each photo as rec.tilt) or, with no earlier angle, when it's
   level. iPhone asks permission the first time you tap Show level. Readings stay on the phone. */
const TILT = { on: false, v: null, at: 0, raf: 0, subs: new Set(),
  ios: /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) };
/* iPhone reports the gravity vector; Android reports its opposite. Normalized so upright portrait is y = -9.8. */
function tiltRead(e) {
  const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null || g.z == null) return;
  const k = TILT.ios ? 1 : -1; const x = g.x * k, y = g.y * k, z = g.z * k;
  const r = Math.atan2(x, -y) * 180 / Math.PI, p = Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI;
  TILT.v = TILT.v ? { p: TILT.v.p * 0.7 + p * 0.3, r: TILT.v.r * 0.7 + r * 0.3 } : { p, r }; TILT.at = Date.now();
  if (!TILT.raf) TILT.raf = requestAnimationFrame(() => { TILT.raf = 0; TILT.subs.forEach(f => f()); });
}
async function tiltStart(ask) {
  const DM = window.DeviceMotionEvent; if (!DM) return 'none';
  if (ask && typeof DM.requestPermission === 'function') { try { if (await DM.requestPermission() !== 'granted') return 'denied'; } catch (e) { return 'denied'; } }
  if (!TILT.on) { window.addEventListener('devicemotion', tiltRead); TILT.on = true; }
  lsSet('tiltOn', '1'); TILT.subs.forEach(f => f()); return 'ok';
}
function tiltStop() { window.removeEventListener('devicemotion', tiltRead); TILT.on = false; TILT.v = null; lsSet('tiltOn', ''); TILT.subs.forEach(f => f()); }
TILT.cur = () => TILT.v && Date.now() - TILT.at < 1500 ? { p: Math.round(TILT.v.p * 10) / 10, r: Math.round(TILT.v.r * 10) / 10 } : null;
function useTilt() {
  const [, t] = useState(0);
  useEffect(() => { const f = () => t(x => x + 1); TILT.subs.add(f); if (lsGet('tiltOn') === '1' && !TILT.on) tiltStart(false); return () => { TILT.subs.delete(f); }; }, []);
  return TILT.cur();
}
/* What to do to match the target angle (the last photo's, or level) */
function tiltAdvice(c, target) {
  const t = target || { p: 0, r: 0 }; const dp = c.p - t.p, dr = c.r - t.r, tol = 1.5;
  const ok = Math.abs(dp) <= tol && Math.abs(dr) <= tol;
  const msg = ok ? (target ? 'Same angle as last photo' : 'Level')
    : [Math.abs(dr) > tol ? (dr > 0 ? 'Raise the right side ' : 'Raise the left side ') + Math.round(Math.abs(dr)) + '°' : '',
       Math.abs(dp) > tol ? (dp > 0 ? 'Tilt the top away ' : 'Tilt the top toward you ') + Math.round(Math.abs(dp)) + '°' : ''].filter(Boolean).join(' · ');
  return { ok, msg, dp, dr };
}
function TiltLevel({ target }) {
  const c = TILT.cur(); if (!c) return null;
  const a = tiltAdvice(c, target); const cl = v => Math.max(-9, Math.min(9, v * 2));
  return html`<div class=${'cam-level' + (a.ok ? ' ok' : '')} id="cam-level"><span class="lv"><i style=${{ transform: 'translate(' + cl(a.dr) + 'px,' + cl(-a.dp) + 'px)' }}></i></span><span>${a.msg}</span></div>`;
}
function TiltToggle({ target }) {
  const [err, setErr] = useState(''); const live = !!TILT.cur();
  const on = async () => { setErr(''); const r = await tiltStart(true); if (r === 'denied') setErr('Motion access was turned down. To use the level, allow Motion & Orientation for Ironwood in Settings, then try again.'); else if (r === 'none') setErr('This phone doesn’t share its tilt here.'); };
  return html`<div class="cam-ghost-row" id="tilt-row"><span style="flex:1">${live ? (target ? 'Level: matching your last photo’s angle' : 'Level: on') : 'Level helps hold the phone at the same angle'}</span>
    ${live ? html`<button class="btn text" id="tilt-off" onClick=${tiltStop}>Turn off</button>` : html`<button class="btn text" id="tilt-on" onClick=${on}>Show level</button>`}</div>
    ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}`;
}
