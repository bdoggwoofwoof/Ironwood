"""Body scans in Stats (Nov 16, Newt): read a 3D body scan report PDF (Styku style) on the phone, check the numbers,
save them as measurements, and show them in Stats with trends. A sample report with made-up numbers is in testdata."""
import asyncio, subprocess, sys, time, json
from playwright.async_api import async_playwright
PORT = 8830
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', 'dist'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(detail) if detail else ''))
STYKU = """Summary Report
Full Name Sam Sample Body Fat % 18.4%
Age 27 Fat Mass 33.3 lbs
Gender Male Lean Mass 141.2 lbs
Height & Weight 6 ft 1 in & 181 lbs Your body fat % rank is Fit
Scan Date 11/16/2026 9:51:47 AM BMR 1925 Calories/day
Body Measurements (lbs, in)
Body Fat % 18.4
Lean Mass % 78.0
Bone Mass % 3.6
Fat Mass 33.3
Lean Mass 141.2
Bone Mass 6.5
Android Mass 2.6
Gynoid Mass 10.5
Visceral Fat 0.5
Subcutaneous Fat 1.7
Bicep Left Lower 12.0
Bicep Left 12.6
Bicep Right Lower 12.2
Bicep Right 12.6
Calf Left 15.0
Calf Right 15.1
Chest 37.8
Forearm Left 11.9
Forearm Right 12.1
High Hip 35.8
Hip 38.3
Neck 14.8
Thigh Left Lower 16.4
Mid-Thigh Left 19.6
Thigh Left Upper 22.6
Thigh Right Lower 16.4
Mid-Thigh Right 19.7
Thigh Right Upper 22.7
Waist (Abdominal) 31.6
Waist (Lower) 32.7
Waist (Narrowest) 30.2"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("try{localStorage.setItem('liftbook.tourDone','1');localStorage.setItem('liftbook.setupOffered','1');localStorage.setItem('liftbook.bgOffered','1')}catch(e){}")
        await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1000)
        ev = pg.evaluate
        P = await ev(f"parseScan({json.dumps(STYKU)})")
        v = P['vals']
        check('reads all 32 numbers of a Styku report (31 listed plus BMR)', len(v) == 32, len(v))
        check('date, units and weight', P['d'] == '2026-11-16' and P['mu'] == 'lb' and P['lu'] == 'in' and P['bw'] == 181, [P['d'], P['mu'], P['lu'], P['bw']])
        check('High Hip is not read as Hip', v.get('hip_hi') == 35.8 and v.get('hips') == 38.3, [v.get('hip_hi'), v.get('hips')])
        check('Mid-thigh, upper and lower thighs kept apart', [v.get(k) for k in ['thigh_ml', 'thigh_ul', 'thigh_ll', 'thigh_mr']] == [19.6, 22.6, 16.4, 19.7])
        check('Lean Mass % vs Lean Mass, Visceral Fat', v.get('leanp') == 78 and v.get('leanm') == 141.2 and v.get('visc') == 0.5 and v.get('bf') == 18.4)
        check('narrowest waist is Waist; the other two have their own', v.get('waist') == 30.2 and v.get('waist_ab') == 31.6 and v.get('waist_lo') == 32.7)
        check('BMR read', v.get('bmr') == 1925)
        kg = await ev("parseScan('Body Measurements (kg, cm)\\nFat Mass 15.1\\nChest 96.0\\nScan Date 2/3/2026')")
        check('kg and cm reports too', kg['mu'] == 'kg' and kg['lu'] == 'cm' and kg['d'] == '2026-02-03', kg)
        check('a random text finds nothing', await ev("Object.keys(parseScan('Grocery list: eggs 12, milk 2').vals).length") == 0)
        # The flow, from the Stats tab
        await pg.locator('.tabs button', has_text='Progress').click(); await pg.locator('.seg button', has_text='Numbers').first.click(); await pg.wait_for_timeout(300)
        await pg.locator('#measure-card').scroll_into_view_if_needed()
        check('Measurements has Add a scan', await pg.locator('#scan-import').count() == 1)
        await pg.click('#scan-import'); await pg.wait_for_timeout(200)
        await pg.set_input_files('#bs-file', 'testdata/scan-sample.pdf'); await pg.wait_for_selector('#bs-save', timeout=15000)
        txt = await pg.inner_text('.sheet')
        check('the PDF is read on the phone and the numbers shown to check', 'Found 32 numbers' in txt, txt[:160])
        check('the scan date comes from the report', await ev("document.querySelector('#bs-date').value") == '2026-10-02')
        check('values are filled in', await ev("document.querySelector('#ms-waist').value") == '32.8' and await ev("document.querySelector('#ms-thigh_ml').value") == '19.9')
        check('chart-only numbers are offered to type in', await pg.locator('#mg-pics').count() == 1 and await pg.locator('#ms-shape').count() == 1)
        check('offers to log the weight', '180 lb' in txt and await ev("document.querySelector('#bs-bw').checked"))
        await pg.fill('#ms-waist', '32.6')
        await pg.click('#mg-pics summary'); await pg.fill('#ms-shape', '92'); await pg.fill('#ms-lean_al', '12.4')
        await pg.click('#bs-save'); await pg.wait_for_timeout(500)
        m = await ev("S.meta.meas.filter(e => e.d === '2026-10-02')")
        check('saves 32 numbers plus the two typed in', len(m) == 34, len(m))
        check('a fixed number is saved as fixed', any(e['k'] == 'waist' and e['v'] == 32.6 for e in m))
        check('weight logged too', await ev("S.meta.bw.some(b => b.d === '2026-10-02' && b.w === 180)"))
        card = await pg.inner_text('#measure-card')
        check('Stats shows them grouped after a scan', 'BODY COMPOSITION' in card.upper() and 'Mid-thigh, left' in card and 'Shape score' in card, card[:300].replace('\n', ' | '))
        check('with the not-medical-advice note', 'not medical advice' in card)
        # A second scan: trends
        await ev("""commit(st => { st.meta.meas = st.meta.meas.concat([{ id: 'x1', d: '2026-11-16', k: 'bf', v: 18.4, u: '%' }, { id: 'x2', d: '2026-11-16', k: 'leanm', v: 143.0, u: 'lb' }]); }, 'meta'); S.rerender()"""); await pg.wait_for_timeout(300)
        card = await pg.inner_text('#measure-card')
        check('change since the first scan', '−3.1 %' in card and '+1.7 lb' in card, card[:400].replace('\n', ' | '))
        check('two scans counted', '2 scans' in card)
        await pg.click('#meas-all'); await pg.wait_for_timeout(200)
        check('Show fewer shows the main numbers only', 'Mid-thigh' not in await pg.inner_text('#measure-card') and 'Lean mass' in await pg.inner_text('#measure-card'))
        # Kilos: mass and lengths convert
        await ev("S.meta.settings.unit = 'kg'; S.rerender()"); await pg.wait_for_timeout(200)
        card = await pg.inner_text('#measure-card')
        check('in kg the scan shows kg and cm', '64.9 kg' in card and '82.8 cm' in card, card[:300].replace('\n', ' | '))
        await ev("S.meta.settings.unit = 'lb'; S.rerender()")
        # Editing a date in Log measurements
        await pg.click('#log-meas'); await pg.fill('#ms-date', '2026-10-02'); await pg.dispatch_event('#ms-date', 'change'); await pg.wait_for_timeout(200)
        check('Log measurements opens a date with its numbers filled in', await ev("document.querySelector('#ms-thigh_ml').value") == '19.9')
        await pg.fill('#ms-thigh_ml', ''); await pg.click('#ms-save'); await pg.wait_for_timeout(400)
        check('emptying a box removes that number', not await ev("S.meta.meas.some(e => e.d === '2026-10-02' && e.k === 'thigh_ml')") and await ev("S.meta.meas.some(e => e.d === '2026-10-02' && e.k === 'thigh_mr')"))
        # Paste instead of a file; a bad file
        await pg.click('#scan-import'); await pg.wait_for_timeout(200)
        await pg.set_input_files('#bs-file', 'test_bodyscan.py'); await pg.wait_for_timeout(1500)
        check('a non-PDF says so', 'could not be read' in await pg.inner_text('.sheet'))
        await pg.click('#bs-paste-box summary'); await pg.fill('#bs-paste', STYKU); await pg.click('#bs-read'); await pg.wait_for_timeout(200)
        check('pasted text works too', 'Found 32 numbers' in await pg.inner_text('.sheet'))
        check('measurements are in the backup', len(json.loads(await ev("JSON.stringify(S.meta.meas)"))) >= 33)
        check('no page errors', not errs, errs[:2])
        await b.close()
asyncio.run(main()); srv.kill()
print(f'{sum(results)}/{len(results)} passed')
