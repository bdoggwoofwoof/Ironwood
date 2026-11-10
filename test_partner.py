"""Partner Striking: Boxing to Muay Thai (Nov 4): 12 partner sessions in order, once a week."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8787
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
        ev = pg.evaluate
        d = await ev("""(() => { const r = getRoutine('bi-fight-partner'); return { n: r.days.length, names: r.days.map(d => d.name),
          per: progDaysPerWeek(r), sched: schedFor(r.id, r),
          each: r.days.map(d => d.items.map(i => getEx(i.ex).name)),
          spar: r.days.map(d => { const i = d.items.find(i => getEx(i.ex).name === 'Technical Sparring Rounds'); return i ? (Array.isArray(i.sets) ? i.sets.length : +i.sets) : 0; }),
          timers: r.days.map(d => d.timer && d.timer.work) }; })()""")
        check('12 sessions, in order from week 1 to week 12', d['n'] == 12 and d['names'][0].startswith('Week 1:') and d['names'][11].startswith('Week 12:'), d['names'][:2])
        check('counts as once a week, so the schedule puts it on one day', d['per'] == 1 and len(d['sched']) == 1, (d['per'], d['sched']))
        need = ['Jump Rope', 'Partner Pad Rounds', 'Technical Sparring Rounds', 'Punch-Out Rounds']
        check('every session has rope, pads, punch endurance and sparring', all(all(n in e for n in need) for e in d['each']))
        check('footwork, drills, bag and clinch all appear', all(any(n in e for e in d['each']) for n in ['Mirror Footwork Drill', 'Partner Drill Rounds', 'Heavy Bag Rounds', 'Clinch Rounds', 'Kick Drill', 'Teep Drill']))
        check('push-ups between rounds and leg throw-downs, like tonight’s session', sum('Leg Throw-Downs' in e for e in d['each']) >= 5 and sum('Push-Ups' in e for e in d['each']) >= 4)
        check('sparring builds from 2 rounds to 5, easing off only when kicks (week 5) and the clinch (week 9) start', d['spar'][0] == 2 and d['spar'][11] == 5 and all(d['spar'][i] <= d['spar'][i + 1] or i + 1 in (4, 8) for i in range(11)), d['spar'])
        check('rounds go 2 min (boxing basics), 3 min (kickboxing), then 3 on / 2 off (Muay Thai)', d['timers'][0] == 120 and d['timers'][5] == 180 and await ev("getRoutine('bi-fight-partner').days[10].timer.rest") == 120, d['timers'])
        await ev("UI.setTab('routines'); lsSet('rtFilter', 'fight'); S.rerender()"); await pg.wait_for_timeout(300)
        check('listed under Fight in Plans', await pg.locator('.r-card', has_text='Partner Striking').count() == 1)
        await ev("UI.setView({ type: 'routine', id: 'bi-fight-partner' })"); await pg.wait_for_timeout(300)
        t = await pg.locator('#fight-info').inner_text()
        check('its page explains it, with the sparring safety rules', 'Light means light' in t and 'mouthguard' in t.lower() and '1× with a partner' in t, t[:120])
        await ev("startWorkout(getRoutine('bi-fight-partner'), getRoutine('bi-fight-partner').days[0])"); await pg.wait_for_timeout(400)
        check('week 1 starts as a workout', await ev("S.active && S.active.items.length") >= 8)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
