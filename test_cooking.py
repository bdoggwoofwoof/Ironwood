"""Start cooking (Nov 11, Newt): one cooking session for what you'll cook. Long hands-off dishes start first, hands-on
steps of other recipes fill the waits, one oven at a time per temperature, one chopping list, ticks and clock times."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8826
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
PLAN = "[['m-sc-tikka',3],['m-sheet-pan',3],['m-stir-fry',2],['m-egg-muffins',5],['m-yogurt-jars',5],['m-broth-rice',4]]"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        check('reads times from steps', await ev("[stepTiming('Bake 20–25 minutes, until set.').mins, stepTiming('Cover and cook on low 6 hours or high 3 hours.').mins, stepTiming('Whisk the sauce.').passive]") == [25, 360, False])
        await ev(f"mealCommit(m => {{ m.plan.items = {PLAN}.map(([r, n], i) => ({{ id: 'x' + i, r, n }})); }}); UI.setTab('meals'); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        check('Week has Start cooking', await pg.locator('#cook-start').count() == 1)
        S = await ev("(() => { const items = ML().plan.items.map(it => ({ it, r: getRecipe(it.r) })); const S2 = cookSchedule(items); return { end: S2.end, serial: S2.serial, long: S2.longFirst.map(x => x.r.id), plan: S2.plan.map(s => [s.r.id, s.at, s.work, s.run, s.passive, s.oven, s.temp]) }; })()")
        check('the 6-hour slow cooker goes to Set and forget', S['long'] == ['m-sc-tikka'], S['long'])
        check('the whole session is much shorter than one after another', S['end'] < S['serial'] * 0.7, (S['end'], S['serial']))
        first_passive = next(i for i, s in enumerate(S['plan']) if s[4])
        check('something that cooks on its own starts in the first few steps', first_passive <= 2, first_passive)
        # one hands-on step at a time
        work = sorted([(s[1], s[1] + s[2]) for s in S['plan']])
        check('only one hands-on step at a time', all(work[i][1] <= work[i + 1][0] for i in range(len(work) - 1)))
        # oven: different temperatures never overlap
        ov = [(s[1] + s[2], s[1] + s[2] + s[3], s[6]) for s in S['plan'] if s[4] and s[5] and s[6]]
        clash = [(a, c) for a in ov for c in ov if a is not c and a[2] != c[2] and a[0] < c[1] and c[0] < a[1]]
        check('the oven is never at two temperatures at once', not clash, clash)
        # within a recipe, steps stay in order
        order_ok = all([s[1] for s in S['plan'] if s[0] == rid] == sorted(s[1] for s in S['plan'] if s[0] == rid) for rid in set(s[0] for s in S['plan']))
        check('each recipe keeps its own step order', order_ok)
        await pg.click('#cook-start'); await pg.wait_for_timeout(400)
        check('Start cooking opens the plan', await pg.locator('#cook-view').count() == 1 and await pg.locator('#cook-plan .cook-step').count() == len(S['plan']))
        check('shows the time saved', 'instead of' in await pg.inner_text('#cook-sum'))
        knife = await pg.inner_text('#cook-knife')
        check('one chopping list, garlic once for every recipe', knife.lower().count('garlic') == 1 and 'crushed tomatoes' not in knife.lower(), knife[:200])
        check('long dish first, in its own section', 'Tikka' in await pg.inner_text('#cook-long'))
        await pg.click('#cook-go'); await pg.wait_for_timeout(300)
        check('I’m starting now shows clock times', ':' in (await pg.locator('#cook-plan .cook-step .num').first.inner_text()))
        await pg.locator('#cook-plan .cook-box').first.check(); await pg.wait_for_timeout(200)
        check('ticking a step saves it', await ev("Object.keys(ML().cook.done).length") == 1)
        check('done steps fade', await pg.locator('#cook-plan .cook-step.done').count() == 1)
        await pg.click('#cook-reset'); await pg.wait_for_timeout(200)
        check('Start over clears the ticks', await ev("!ML().cook"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
