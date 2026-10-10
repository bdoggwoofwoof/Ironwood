"""App Store screenshots: 1206x2622 (6.3" iPhone, required size), dark theme, sample data.
Raw screens go to screens/raw, captioned store images to screens/store."""
import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8767
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f'http://localhost:{PORT}/'
os.makedirs('screens/raw', exist_ok=True); os.makedirs('screens/store', exist_ok=True)

SEED = r"""() => {
  const BASE = { 'Decline Chest Press': 160, 'Russian Tits to L Stretch': 25, 'Hybrid Curls': 30, 'Cable Fly': 30, 'Tricep Pushdowns': 50,
    'Cable Crunch': 70, 'Russian Behind-the-Back Cable Flies': 15, 'Bent-Over Barbell Rows': 135, 'Lat Pulldown': 130, 'Cuban Press': 15,
    'Scapular Shrugs': 60, 'Overhead Barbell Press': 95, 'Face Pulls': 40, 'Overhead Cable Tricep Extension': 40, 'Squat': 185,
    'Romanian Deadlift': 155, 'Leg Curls': 90, 'Calf Raises': 150, 'Assisted Pull-Up': 70 };
  const r = getRoutine('bi-newt-4day'); const DAYOFF = [0, 1, 3, 4];
  const skip = new Set(['2-3', '5-1', '7-3']); const sessions = {};
  const wk0 = startOfWeek(new Date()); let n = 0;
  for (let w = 9; w >= 1; w--) for (let d = 0; d < 4; d++) {
    if (skip.has(w + '-' + d)) continue;
    const day = r.days[d]; const t0 = +addDays(wk0, -7 * w + DAYOFF[d]) + 18 * 3600e3 + (n % 3) * 600e3; const age = 9 - w;
    const items = day.items.map((it, j) => { const name = exName(it.ex); const b = BASE[name] || 40; const kind = exKind(it.ex);
      const step = b < 45 ? 2.5 : 5; let wt = kind === 'assisted' ? b - age * 2.5 : b * (1 + 0.013 * age); wt = Math.max(0, Math.round(wt / step) * step);
      const reps = [8, 8, 7].slice(0, it.sets).concat(Array(Math.max(0, it.sets - 3)).fill(7));
      if ((age + j) % 4 === 0) reps[0] = 9;
      return { ex: it.ex, group: '', ss: !!it.ss, target: { sets: it.sets, reps: it.reps || '' }, note: '', sets: reps.map(rr => ({ w: wt, r: rr })) }; });
    const id = 'seed' + (n++);
    sessions[id] = { id, routineId: r.id, routineName: r.name, dayId: day.id, name: day.name, startedAt: t0, endedAt: t0 + (52 + (n % 4) * 6) * 60e3, updatedAt: t0, items, prs: [] };
  }
  // this week: two done, Monday and Tuesday
  for (let d = 0; d < 2; d++) { const day = r.days[d]; const t0 = +addDays(wk0, d) + 18 * 3600e3;
    const prev = Object.values(sessions).filter(s => s.dayId === day.id).sort((a, b) => b.startedAt - a.startedAt)[0];
    const items = clone(prev.items); items.forEach((it, j) => { if (j < 3 && exKind(it.ex) !== 'assisted') it.sets.forEach(s => { s.w += exKind(it.ex) === 'barbell' || s.w >= 60 ? 5 : 2.5; }); });
    const id = 'seedw' + d; sessions[id] = { ...clone(prev), id, startedAt: t0, endedAt: t0 + 55 * 60e3, updatedAt: t0, items, prs: [] }; }
  S.sessions = sessions; S.ver++;
  for (const s of sessionList()) s.prs = detectPRs(s);
  S.meta.bw = [0, 14, 28, 42, 56].map((a, i) => ({ id: 'bw' + i, d: ymd(addDays(new Date(), -a)), w: 184 - i * 0.8, u: 'lb' }));
  lsSave();
}"""

CAPTIONS = [
    ('workout', 'Log a set in one swipe', 'Last time’s numbers are already filled in'),
    ('stats-lift', 'See where your strength is heading', 'Projections from your own training'),
    ('log', 'PRs the moment they happen', 'Every record, kept per rep range'),
    ('stats', 'Your training at a glance', 'Workouts, volume and time, week by week'),
    ('photos', 'Progress photos that line up', 'Pose outlines on the camera. Photos never leave your phone.'),
    ('train', 'Your routine, ready to go', 'No account. No ads. Everything free.'),
]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 402, 'height': 874}, device_scale_factor=3, color_scheme='dark', has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800)
        await pg.evaluate(SEED); await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.evaluate("document.fonts.ready")
        hide_hint = "document.querySelectorAll('.swipe-hint').forEach(e => e.remove())"

        async def shot(name):
            await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(350)
            await pg.screenshot(path=f'screens/raw/{name}.png')

        await shot('train')
        await pg.locator('.tab', has_text='Log').click(); await pg.wait_for_timeout(400); await shot('log')
        await pg.locator('.tab', has_text='Stats').click(); await pg.wait_for_timeout(500); await shot('stats')
        await pg.evaluate("UI.setView({ type: 'exercise', ex: findEx('Squat').id, group: '' })"); await pg.wait_for_timeout(600)
        await shot('stats-lift')
        # Photos tab inside Stats
        await pg.evaluate("UI.setView(null)"); await pg.wait_for_timeout(300)
        tab = pg.locator('.seg button', has_text='Photos')
        print('photos tab buttons:', await tab.count())
        if await tab.count(): await tab.first.click(); await pg.wait_for_timeout(900)
        await shot('photos')
        # Workout in progress: start Up next, log first set heavier for a PR
        await pg.locator('.tab', has_text='Train').click(); await pg.wait_for_timeout(300)
        await pg.locator('.next-card .btn.primary').click(); await pg.wait_for_timeout(600)
        await pg.evaluate(hide_hint)
        w = pg.locator('.set-row input[inputmode="decimal"]'); rr = pg.locator('.set-row input[inputmode="numeric"]')
        await w.nth(0).fill('115'); await rr.nth(0).fill('8'); await pg.wait_for_timeout(200)
        await w.nth(1).fill('115'); await rr.nth(1).fill('7'); await pg.locator('.wo-title').click(); await pg.wait_for_timeout(500)
        await pg.add_style_tag(content='.toast,.swipe-hint{display:none!important}')
        await pg.evaluate("S.rest = null; S.rerender()"); await pg.wait_for_timeout(300)
        await pg.evaluate(hide_hint)
        await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='screens/raw/workout.png')
        print('page errors:', errs[:3])

        # Captioned store images
        sp = await ctx.new_page()
        import base64, re as _re
        css = _re.sub(r"url\('fonts/([^']+)'\)", lambda m: "url('data:font/woff2;base64," + base64.b64encode(open('dist/fonts/' + m.group(1), 'rb').read()).decode() + "')", open('dist/pages.css').read())
        for i, (name, head, sub) in enumerate(CAPTIONS, 1):
            await sp.set_content(f'''<html><head><meta name=viewport content="width=device-width,initial-scale=1"><style>{css}
              html,body{{margin:0;height:100%;background:#111315}}
              .f{{height:874px;display:flex;flex-direction:column;align-items:center;padding-top:44px;gap:20px;background:radial-gradient(120% 60% at 50% 0%,#1d2a44 0%,#111315 60%)}}
              h1{{color:#eef1f4;font-size:34px;margin:0;text-align:center;max-width:340px;text-wrap:balance}}
              p{{color:#a3abb4;font-size:16px;margin:-12px 0 0;text-align:center;max-width:320px}}
              img{{width:322px;border-radius:30px;box-shadow:0 0 0 7px #2a2f36,0 20px 50px rgba(0,0,0,.55)}}
            </style></head><body><div class="f"><h1>{head}</h1><p>{sub}</p><img src="{URL}../screens/raw/{name}.png"></div></body></html>''')
            await sp.wait_for_timeout(100)
            img = sp.locator('img')
            await sp.evaluate("p => new Promise(r => { const i = document.querySelector('img'); i.onload = r; i.src = 'data:image/png;base64,' + p; })",
                              __import__('base64').b64encode(open(f'screens/raw/{name}.png', 'rb').read()).decode())
            await sp.evaluate("document.fonts.ready"); await sp.wait_for_timeout(200)
            await sp.screenshot(path=f'screens/store/{i:02d}-{name}.png')
        await b.close()

try:
    asyncio.run(main())
finally:
    srv.terminate()
