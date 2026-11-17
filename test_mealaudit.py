"""Meal plan audit (Nov 10). Second pass: Today / Week / Recipes / Shopping, one way into an empty week (M2, M3, M5),
three-step setup (M4, M12), Recipes groups of 3 with Mix & match last (M8, M9). First pass: making a plan fills the prep and shopping list (M1), an empty List points to the plan (M10),
no repeated subtitle (M11), two amount options (M6), the day total says how it compares with the protein target (M7)."""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright
PORT = 8789
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        await ev("UI.setTab('meals'); setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        check('M11: no shared subtitle', 'logged, planned and shopped for' not in await pg.inner_text('body'))
        check('M10: empty List offers Plan my week', await pg.locator('#list-plan').count() == 1)
        check('G: switch reads Log, Plan, Recipes, Shop', await ev("[...document.querySelectorAll('.topsw button')].map(b => b.textContent)") == ['Log', 'Plan', 'Recipes', 'Shop'])
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        check('M5: an empty week has one main way in and two others', await pg.locator('#plan-start').count() == 1 and await pg.locator('#week-ready').count() == 1 and await pg.locator('#week-pick').count() == 1)
        check('M3: no people or weeks before there is anything to cook', await pg.locator('.mp-who').count() == 0)
        # Nov 16 (phase 3): preps live off Plan; "or use a saved plan" opens them, with the rotation after them
        await pg.click('#week-ready'); await pg.wait_for_timeout(300)
        check('or use a saved plan opens the ready-made preps', await pg.locator('#meal-prep-lib .ready-row').count() == await ev("MEAL_PREPS.length"))
        check('rotation comes after the ready-made preps', await ev("!!(document.querySelector('#meal-prep-lib .ready-list').compareDocumentPosition(document.querySelector('#rot-setup')) & Node.DOCUMENT_POSITION_FOLLOWING)"))
        await pg.locator('#meal-prep-lib .ready-h').first.click(); await pg.wait_for_timeout(200)
        check('...and a tap shows what is in one, with Use this prep', await pg.locator('#meal-prep-lib button', has_text='Use this prep').count() == 1)
        await ev("UI.setTab('meals'); UI.setView(null); setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(300)
        # Recipes
        await ev("setMealsMode('recipes'); S.rerender()"); await pg.wait_for_timeout(300)
        caps = await ev("[...document.querySelectorAll('[id^=rg-]:not(#rg-mix)')].map(g => g.querySelectorAll('.meal-row').length)")
        check('M8: each recipe group shows 3 at first', caps and max(caps) <= 3, caps)
        await pg.click('#rmore-main' if await pg.locator('#rmore-main').count() else '[id^=rmore-]'); await pg.wait_for_timeout(200)
        check('M8: Show all opens a group', max(await ev("[...document.querySelectorAll('[id^=rg-]:not(#rg-mix)')].map(g => g.querySelectorAll('.meal-row').length)")) > 3)
        order = await ev("[...document.querySelectorAll('[id^=rg-]')].map(g => g.id)")
        check('M9: Mix & match comes after the plain recipes', order and order[-1] == 'rg-mix', order)
        await ev("setMealsMode('list'); S.rerender()"); await pg.wait_for_timeout(300)
        await pg.click('#list-plan'); await pg.wait_for_timeout(300)
        check('P6: setup is two steps', await ev("[...document.querySelectorAll('#tg-steps button')].map(s => s.textContent)") == ['About you', 'Your food'])
        check('later steps wait for the numbers', await pg.locator('#tg-go-1[disabled]').count() == 1)
        check('Next waits for the numbers', await pg.locator('#tg-next[disabled]').count() == 1)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '180'); await pg.fill('#tg-age', '30')
        await pg.click('#tg-next'); await pg.wait_for_timeout(200)
        check('P6: step 2 asks meals a day, how you cook, allergies and diet, with the numbers', await pg.locator('#tg-step1 #prefs-fields').count() == 1 and await pg.locator('#tg-step1 #habits-fields #hb-meals-3').count() == 1 and await pg.locator('#tg-step1 #tg-result').count() == 1)
        check('P6: the rest waits under More choices', await pg.locator('#tg-more:not([open])').count() == 1 and await pg.locator('#tg-more #pf-dislikes').count() == 1 and await pg.locator('#tg-more #gear-fields').count() == 1)
        await pg.click('#tg-back'); await pg.wait_for_timeout(200)
        check('Back returns to About you with answers kept', await pg.input_value('#tg-w') == '180')
        await pg.click('#tg-go-1'); await pg.wait_for_timeout(200)
        check('tapping Your food jumps there', await pg.locator('#tg-step1').count() == 1)
        await pg.click('#tg-go-0'); await pg.wait_for_timeout(200)
        await pg.fill('#tg-ft', '5'); await pg.fill('#tg-in', '10'); await pg.fill('#tg-w', '180'); await pg.fill('#tg-age', '30')
        await pg.click('#tg-save'); await pg.wait_for_timeout(600)
        n = await ev("ML().plan.items.length"); lst = await ev("shoppingList().length")
        check('M1: making the plan fills the prep', n >= 3, n)
        check('M1: and the shopping list', lst >= 5, lst)
        check('M1: the summary points to the list', await pg.locator('#plan-list').count() == 1 and await pg.locator('#plan-use').count() == 0)
        await ev("setMealsMode('plan'); S.rerender()"); await pg.wait_for_timeout(200)
        check('B: with a plan, a summary with one main button and a card per date', await pg.locator('#plan-sum #plan-list.primary').count() == 1 and await pg.locator('[id^="day-"]').count() == await ev("planYmds().length"))
        FUT = "JSON.stringify(planYmds().filter(d => d >= ymd(new Date())).map(d => dayMeals(d).map(x => x.r)))"
        before = await ev(FUT)
        await pg.click('#plan-tools'); await pg.wait_for_timeout(200); await pg.click('#wt-reroll'); await pg.wait_for_timeout(200); await pg.click('#rr-go'); await pg.wait_for_timeout(300)
        after = await ev("ML().plan.items.map(i => i.r).sort().join()")
        want = await ev("[...new Set(planYmds().flatMap(d => dayMeals(d)).filter(x => !x.off).map(x => x.r))].sort().join()")
        check('M1: Different meals and the list follows', after == want and before != await ev(FUT), (after[:80], want[:80]))
        tot = await pg.inner_text('#daytot-' + await ev("ymd(new Date())"))
        check('M7: each day shows calories against the target, and protein', ' of ' in tot and 'protein' in tot, tot)
        await pg.click('#plan-tools'); await pg.wait_for_timeout(200)
        check('plan settings is in More planning tools', await pg.locator('.sheet #wt-settings', has_text='Plan settings').count() == 1)
        await pg.click('#plan-people'); await pg.wait_for_timeout(200)
        check('M6: two amount options', await ev("[...document.querySelectorAll('#units-seg button')].map(b => b.textContent)") == ['Easy amounts', 'By weight'])
        await ev("closeSheet()"); await pg.wait_for_timeout(200)
        # a prep you built yourself is not replaced without asking
        # Nov 16 (audit phase 2): a recipe you add goes on the dates as yours, and the plan never re-rolls it
        await ev("addToPlan('m-turkey-chili', 2)"); await pg.wait_for_timeout(200)
        MINE = "planYmds().flatMap(d => dayMeals(d)).filter(x => x.r === 'm-turkey-chili' && x.by === 'you').length"
        check('adding a recipe puts it on the plan as yours', await ev(MINE) >= 2, await ev(MINE))
        await ev("openSheet({ type: 'mealTargets' })"); await pg.wait_for_timeout(300); await pg.click('#tg-save'); await pg.wait_for_timeout(500)
        check('remaking the plan keeps what you added', await ev(MINE) >= 2 and await ev("ML().plan.items.some(i => i.r === 'm-turkey-chili')"))
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
