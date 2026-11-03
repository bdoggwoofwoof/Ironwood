"""Iron 75 / Lite questionnaire and adaptive checklist: priorities, habits, food-log ticks, light days (Nov 2)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8791
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = f'http://localhost:{PORT}/'; results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); errs = []
        await pg.add_init_script("try { localStorage.setItem('liftbook.tourDone', '1') } catch (e) {}")
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); ev = pg.evaluate
        await ev("(() => { S.sessions = {}; S.meta.challenges = {}; S.ver++; touch(); UI.setTab('train'); })()"); await pg.wait_for_timeout(200)
        await ev("openSheet({ type: 'challenges' })"); await pg.wait_for_timeout(150); await pg.click('#cht-iron75lite'); await pg.wait_for_timeout(200)
        check('Lite opens the questionnaire on the Lite version', await pg.locator('#iv-iron75lite.on').count() == 1)
        await pg.click('#ip-muscle'); await pg.wait_for_timeout(80)
        check('no meal targets → says the protein item can’t tick itself, links to meal setup', await pg.locator('#iron-nogoals').count() == 1 and await pg.locator('#iron-meals').count() == 1)
        await pg.click('#ip-muscle'); await ev("mealCommit(m => { m.goals = { kcal: 2400, p: 160 }; })"); await pg.wait_for_timeout(100)
        await pg.click('#ip-habits'); await pg.click('#ip-muscle'); await pg.click('#ip-fat'); await pg.click('#ih-sleep'); await pg.wait_for_timeout(100)
        check('with targets set, the note goes away', await pg.locator('#iron-nogoals').count() == 0)
        prev = await ev("[...document.querySelectorAll('#iron-preview li')].map(l => l.textContent)")
        check('priorities shape the checklist (protein goal, calorie limit, sleep)', 'Hit your protein goal' in prev and 'Stay at or under your calories' in prev and 'Sleep 7+ hours' in prev and 'Stick to your eating plan' not in prev, prev)
        await pg.click('#iron-go'); await pg.wait_for_timeout(250)
        await pg.locator('button', has_text='Start challenge').click(); await pg.wait_for_timeout(300)
        ch = await ev("Object.values(S.meta.challenges)[0]")
        check('Lite: no restart, one rest day a week, light days on', ch['restart'] is False and ch['restPerWeek'] == 1 and ch.get('light') is True, [ch['restart'], ch['restPerWeek'], ch.get('light')])
        autos = sorted(i['auto'] for i in ch['items'] if i['auto'])
        check('auto items: workout, protein, calories', autos == ['kcal', 'protein', 'w1'], autos)
        # food log ticks protein and calories
        k = await ev("ymd(new Date())")
        await ev("mealCommit(m => { m.goals = { kcal: 2400, p: 160 }; m.log[ymd(new Date())] = [{ id: 'a', k: 'num', name: 'x', m: { kcal: 2300, p: 165, c: 200, f: 70, fib: 30, sug: 20, na: 2000 } }]; })")
        st = await ev(f"(() => {{ const c = Object.values(S.meta.challenges)[0]; return c.items.filter(i => i.auto === 'protein' || i.auto === 'kcal').map(i => chChecked(c, i, '{k}', 0)); }})()")
        check('protein and calories tick themselves from the food log', st == [True, True], st)
        await ev("mealCommit(m => { m.log[ymd(new Date())][0].m.kcal = 3000; })")
        st = await ev(f"(() => {{ const c = Object.values(S.meta.challenges)[0]; return chChecked(c, c.items.find(i => i.auto === 'kcal'), '{k}', 0); }})()")
        check('going over calories leaves that one unticked', st is False)
        # light day
        await ev("UI.setView({ type: 'challenge', id: Object.keys(S.meta.challenges)[0] })"); await pg.wait_for_timeout(250)
        await pg.click('#light-day'); await pg.wait_for_timeout(150)
        check('sick or hurt: light day offered', await pg.locator('#light-item').count() == 1)
        await pg.click('#light-item'); await pg.wait_for_timeout(200)
        w = await ev(f"(() => {{ const c = Object.values(S.meta.challenges)[0]; return chChecked(c, c.items.find(i => i.auto === 'w1'), '{k}', 0); }})()")
        check('a light day covers the workout without logging one', w is True)
        # strict keeps restart
        await ev("closeSheet(); openSheet({ type: 'ironSetup', ver: 'iron75' })"); await pg.wait_for_timeout(150)
        prev = await ev("[...document.querySelectorAll('#iron-preview li')].map(l => l.textContent)")
        check('Iron 75 strict: two workouts, one outdoors, a gallon of water', 'Workout 1' in prev and 'Workout 2 (outdoors)' in prev and 'Drink a gallon of water' in prev, prev)
        await pg.click('#iron-go'); await pg.wait_for_timeout(200); await pg.locator('button', has_text='Start challenge').click(); await pg.wait_for_timeout(300)
        check('strict one starts over on a miss', await ev("Object.values(S.meta.challenges).some(c => c.name === 'Iron 75' && c.restart && c.light)"))
        await ev("(() => { S.meta.challenges = {}; S.ver++; touch(); openSheet({ type: 'ironSetup', ver: 'iron75' }); })()"); await pg.wait_for_timeout(200)
        await pg.click('#iron-start'); await pg.wait_for_timeout(300)
        check('Start goes straight to the challenge (the editor is optional)', await ev("Object.values(S.meta.challenges).length") == 1 and await pg.locator('#light-day, .ch-item').count() > 0)
        check('no page errors', not errs, errs[:3]); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
