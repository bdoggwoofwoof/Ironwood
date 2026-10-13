/* ---------- Meal prep ---------- */
/* Saved in meta.meals: { recipes: your own recipes (and edited built-ins, same id + base: true),
   plan: { people, weeks, items: [{ id, r: recipe id, n: times a week per person }] },
   checks: shopping-list items ticked off, extras: [{ id, t, c }] items you added to the list }. */
const AISLES = [['produce', 'Produce'], ['protein', 'Meat & fish'], ['dairy', 'Dairy & eggs'], ['grains', 'Grains & bread'], ['canned', 'Canned & jarred'], ['frozen', 'Frozen'], ['pantry', 'Pantry & spices'], ['other', 'Other']];
const AISLE_NAME = Object.fromEntries(AISLES);
const MEAL_CATS = [['breakfast', 'Breakfast'], ['main', 'Lunch & dinner'], ['snack', 'Snacks'], ['base', 'Building blocks']];
const MEAL_CAT_NAME = Object.fromEntries(MEAL_CATS);
/* Ingredients are written as you'd say them ("2 lb chicken breast, cubed"); the text after a comma is prep, not shopping. */
const MEAL_LIB = [
  { id: 'm-egg-muffins', name: 'Veggie Egg Muffins', cat: 'breakfast', serves: 6, size: '2 muffins', mins: 35, keeps: 4, freezes: true, week: 5,
    ing: ['12 eggs', '5 oz baby spinach, chopped', '1 bell pepper, diced', '½ red onion, diced', '½ cup milk', '½ tsp salt', '¼ tsp black pepper', '½ tsp garlic powder', '1 tbsp olive oil, for the pan'],
    steps: ['Heat the oven to 350°F (175°C). Oil a 12-cup muffin pan well, or use silicone cups.', 'Split the spinach, pepper and onion between the cups.', 'Whisk the eggs, milk, salt, pepper and garlic powder, then pour over the vegetables until each cup is about three-quarters full.', 'Bake 20–25 minutes, until the centers are set.', 'Cool on a rack before packing so they don’t get soggy. Reheat 30–45 seconds in the microwave.'],
    note: 'Swap in any vegetables you have. Cooked ground turkey or chicken makes them more filling.' },
  { id: 'm-yogurt-jars', name: 'Greek Yogurt Parfait Jars', cat: 'breakfast', serves: 5, size: '1 jar', mins: 10, keeps: 5, freezes: false, week: 5,
    ing: ['5 cups plain Greek yogurt', '3 cups mixed berries', '5 tbsp honey', '1¼ cups granola', '5 tbsp chia seeds'],
    steps: ['Stir the honey and chia seeds into the yogurt.', 'Spoon the yogurt into five jars and top with berries.', 'Pack the granola separately (small bags or a dry container) so it stays crunchy, and add it when you eat.'],
    note: 'Frozen berries work too; they thaw into a sauce by morning.' },
  { id: 'm-overnight-oats', name: 'Protein Overnight Oats', cat: 'breakfast', serves: 5, size: '1 jar', mins: 10, keeps: 4, freezes: false, week: 5,
    ing: ['2½ cups rolled oats', '2½ cups milk', '1¼ cups plain Greek yogurt', '5 tbsp chia seeds', '3 tbsp honey', '1 tsp vanilla extract', '½ tsp ground cinnamon', '2 bananas, sliced'],
    steps: ['Mix the oats, milk, yogurt, chia seeds, honey, vanilla and cinnamon in a big bowl.', 'Divide between five jars and top with banana.', 'Refrigerate overnight. Eat cold, or microwave 1–2 minutes with a splash of milk.'],
    note: 'Stir a scoop of protein powder in with a little extra milk for about 20 g more protein.' },
  { id: 'm-breakfast-burritos', name: 'Freezer Breakfast Burritos', cat: 'breakfast', serves: 8, size: '1 burrito', mins: 40, keeps: 4, freezes: true, week: 4,
    ing: ['12 eggs', '1 can black beans (15 oz), rinsed', '2 bell peppers, diced', '1 yellow onion, diced', '½ jar salsa (16 oz)', '8 large flour tortillas', '1 tbsp olive oil', '½ tsp salt', '½ tsp ground cumin'],
    steps: ['Cook the onion and peppers in the oil over medium heat until soft, about 6 minutes. Add the beans and cumin.', 'Whisk the eggs with the salt, pour into the pan and scramble until just set. Stir in the salsa and let it cool.', 'Warm the tortillas so they fold without cracking. Fill each one, fold in the sides and roll up.', 'Wrap each burrito in foil or plastic. Refrigerate or freeze.', 'From frozen: unwrap, cover with a damp paper towel and microwave 2–3 minutes, turning halfway.'] },

  { id: 'm-burrito-bowls', name: 'Chicken Burrito Bowls', cat: 'main', serves: 5, size: '1 bowl', mins: 45, keeps: 4, freezes: true, week: 3,
    ing: ['1½ lb boneless skinless chicken breast', '1½ cups long-grain rice (dry)', '2 cans black beans (15 oz), rinsed', '2 cups frozen corn', '1 jar salsa (16 oz)', '2 limes', '1 bunch cilantro', '1 tbsp chili powder', '2 tsp ground cumin', '1 tsp garlic powder', '1 tsp salt', '1 tbsp olive oil'],
    steps: ['Start the rice. When it’s done, stir in the juice of one lime and some chopped cilantro.', 'Heat the oven to 425°F (220°C). Toss the chicken with the oil, chili powder, cumin, garlic powder and salt.', 'Bake 18–22 minutes, until the thickest piece reaches 165°F (74°C). Rest 5 minutes, then slice.', 'Warm the beans and corn together in a pan or the microwave.', 'Pack rice, beans and corn, and chicken into five containers. Keep salsa and lime wedges on the side.'] },
  { id: 'm-med-bowls', name: 'Mediterranean Chicken Quinoa Bowls', cat: 'main', serves: 5, size: '1 bowl', mins: 40, keeps: 4, freezes: false, week: 3,
    ing: ['1½ lb boneless skinless chicken breast', '1½ cups quinoa (dry)', '1 can chickpeas (15 oz), rinsed', '2 cucumbers, diced', '1 pint cherry tomatoes, halved', '½ red onion, thinly sliced', '2 lemons', '1 tbsp Italian seasoning', '3 tbsp olive oil', '3 tbsp tahini', '1 tsp salt', '½ tsp garlic powder'],
    steps: ['Rinse the quinoa and cook it in 3 cups of water, about 15 minutes. Fluff and cool.', 'Rub the chicken with 1 tbsp oil, the Italian seasoning, garlic powder and half the salt. Bake at 425°F (220°C) for 18–22 minutes, to 165°F (74°C). Slice.', 'Whisk the tahini with the juice of one lemon, the rest of the oil and salt, and water until pourable.', 'Pack quinoa, chickpeas, cucumber, tomatoes, onion and chicken. Keep the sauce in a small container.'],
    note: 'Cucumbers and tomatoes stay crisper if you pack them in their own section.' },
  { id: 'm-sheet-pan', name: 'Sheet-Pan Chicken & Vegetables', cat: 'main', serves: 4, size: '1 container', mins: 45, keeps: 4, freezes: false, week: 2,
    ing: ['2 lb boneless skinless chicken thighs', '1 head broccoli, cut into florets', '2 sweet potatoes, cubed', '1 red onion, cut into wedges', '3 tbsp olive oil', '2 tsp smoked paprika', '1 tsp garlic powder', '1 tsp salt', '½ tsp black pepper'],
    steps: ['Heat the oven to 425°F (220°C). Line two sheet pans.', 'Toss the sweet potatoes and onion with half the oil and seasoning. Roast 10 minutes.', 'Toss the chicken and broccoli with the rest, add them to the pans and spread everything out.', 'Roast 20–25 minutes, until the chicken reaches 165°F (74°C) and the potatoes are tender.'] },
  { id: 'm-turkey-chili', name: 'Turkey & Bean Chili', cat: 'main', serves: 8, size: '1½ cups', mins: 50, keeps: 4, freezes: true, week: 3,
    ing: ['2 lb ground turkey (93% lean)', '2 cans kidney beans (15 oz), rinsed', '1 can black beans (15 oz), rinsed', '1 can crushed tomatoes (28 oz)', '1 can diced tomatoes (14.5 oz)', '1 yellow onion, diced', '2 bell peppers, diced', '4 cloves garlic, minced', '2 tbsp chili powder', '2 tsp ground cumin', '1 tsp smoked paprika', '1 tsp salt', '1 tbsp olive oil'],
    steps: ['Brown the turkey in the oil in a big pot, breaking it up. Add the onion, peppers and garlic and cook until soft.', 'Stir in the spices and cook 1 minute.', 'Add both tomatoes, the beans and 1 cup of water. Simmer 25–30 minutes, stirring now and then.', 'Taste for salt. Cool, then portion. Freeze in flat bags or containers.'] },
  { id: 'm-stir-fry', name: 'Chicken & Broccoli Stir-Fry', cat: 'main', serves: 4, size: '1 container', mins: 35, keeps: 4, freezes: false, week: 2,
    ing: ['1½ lb boneless skinless chicken breast, cut into bite-size pieces', '1 cup long-grain rice (dry)', '1 head broccoli, cut into florets', '2 bell peppers, sliced', '2 cups snap peas', '4 cloves garlic, minced', '1 tbsp fresh ginger, grated', '¼ cup soy sauce', '1 tbsp honey', '1 tbsp rice vinegar', '1 tbsp cornstarch', '2 tbsp olive oil', '1 tsp sesame oil'],
    steps: ['Start the rice.', 'Whisk the soy sauce, honey, vinegar, cornstarch, sesame oil and ¼ cup water for the sauce.', 'Cook the chicken in 1 tbsp oil over high heat until browned and cooked through, then set it aside.', 'Add the rest of the oil, then the broccoli, peppers and snap peas. Stir-fry 4–5 minutes, adding the garlic and ginger for the last minute.', 'Return the chicken, pour in the sauce and stir until glossy. Pack with the rice.'] },
  { id: 'm-curry', name: 'Chickpea & Lentil Curry', cat: 'main', serves: 5, size: '1 container', mins: 40, keeps: 4, freezes: true, week: 2,
    ing: ['2 cans chickpeas (15 oz), rinsed', '1 cup red lentils (dry)', '1 can light coconut milk (13.5 oz)', '1 can diced tomatoes (14.5 oz)', '1 yellow onion, diced', '4 cloves garlic, minced', '1 tbsp fresh ginger, grated', '2 tbsp curry powder', '5 oz baby spinach', '1½ cups long-grain rice (dry)', '1 tbsp olive oil', '1 tsp salt'],
    steps: ['Start the rice.', 'Soften the onion in the oil, then add the garlic, ginger and curry powder for 1 minute.', 'Add the lentils, tomatoes, coconut milk and 2 cups of water. Simmer 15–20 minutes, until the lentils are soft.', 'Stir in the chickpeas and spinach until it wilts. Season and pack with the rice.'],
    note: 'Top with a spoonful of Greek yogurt for extra protein.' },
  { id: 'm-egg-roll-bowl', name: 'Egg Roll in a Bowl (Turkey)', cat: 'main', serves: 5, size: '1 container', mins: 25, keeps: 4, freezes: false, week: 2,
    ing: ['2 lb ground turkey (93% lean)', '2 bags coleslaw mix (14 oz)', '1 bunch green onions, sliced', '4 cloves garlic, minced', '1 tbsp fresh ginger, grated', '¼ cup soy sauce', '1 tbsp rice vinegar', '1 tbsp sesame oil', '1 tbsp sesame seeds'],
    steps: ['Brown the turkey in a large pan, breaking it up.', 'Add the garlic, ginger and most of the green onions for 1 minute.', 'Add the coleslaw mix, soy sauce and vinegar. Cook, stirring, until the cabbage is just tender, 4–5 minutes.', 'Finish with the sesame oil, seeds and remaining green onions.'],
    note: 'Low in carbs on its own. Add rice if you want it around training.' },
  { id: 'm-meatballs', name: 'Baked Turkey Meatballs', cat: 'main', serves: 6, size: '5 meatballs', mins: 35, keeps: 4, freezes: true, week: 2,
    ing: ['2 lb ground turkey (93% lean)', '2 eggs', '½ cup panko breadcrumbs', '½ yellow onion, grated', '3 cloves garlic, minced', '1 tbsp Italian seasoning', '1 tsp salt', '½ tsp black pepper', '1 jar marinara (24 oz)'],
    steps: ['Heat the oven to 400°F (200°C) and line a sheet pan.', 'Mix everything except the marinara with your hands, just until combined.', 'Roll into about 30 balls and bake 18–20 minutes, to 165°F (74°C).', 'Warm in the marinara, or freeze plain on the pan first, then bag them so they don’t stick together.'],
    note: 'Serve with pasta, rice, roasted vegetables or in a sub roll.' },
  { id: 'm-tuna-salad', name: 'Greek Yogurt Tuna Salad', cat: 'main', serves: 4, size: '¾ cup', mins: 10, keeps: 3, freezes: false, week: 3,
    ing: ['4 cans tuna (5 oz), drained', '½ cup plain Greek yogurt', '2 stalks celery, diced', '¼ red onion, diced', '¼ cup dill pickles, chopped', '1 tbsp Dijon mustard', '1 lemon, juiced', '¼ tsp black pepper'],
    steps: ['Mix everything in a bowl, breaking up the tuna.', 'Taste and add salt or more lemon if you like.', 'Pack in four containers. Eat in a wrap, on lettuce, or with crackers.'] },
  { id: 'm-chicken-salad', name: 'Canned Chicken Salad', cat: 'main', serves: 4, size: '¾ cup', mins: 10, keeps: 3, freezes: false, week: 3,
    ing: ['4 cans chicken (5 oz), drained', '½ cup plain Greek yogurt', '2 stalks celery, diced', '1 cup grapes, halved', '¼ cup sliced almonds', '1 tbsp Dijon mustard', '1 lemon, juiced', '¼ tsp salt', '¼ tsp black pepper'],
    steps: ['Flake the chicken into a bowl.', 'Stir in everything else.', 'Pack in four containers. Good in a wrap, on greens or with crackers.'] },
  { id: 'm-salmon-patties', name: 'Canned Salmon Patties', cat: 'main', serves: 4, size: '2 patties', mins: 25, keeps: 3, freezes: true, week: 2,
    ing: ['2 cans salmon (14.75 oz), drained', '2 eggs', '½ cup panko breadcrumbs', '2 green onions, sliced', '1 tbsp Dijon mustard', '1 lemon', '½ tsp garlic powder', '2 tbsp olive oil'],
    steps: ['Flake the salmon into a bowl, removing large bones and skin if you like.', 'Mix in the eggs, breadcrumbs, green onions, mustard, garlic powder and the zest of the lemon. Shape 8 patties.', 'Cook in the oil over medium heat, 3–4 minutes a side, until golden and hot through.', 'Cool and pack with lemon wedges.'] },

  { id: 'm-hb-eggs', name: 'Hard-Boiled Eggs', cat: 'snack', serves: 6, size: '2 eggs', mins: 20, keeps: 7, freezes: false, week: 5,
    ing: ['12 eggs'],
    steps: ['Lower the eggs into boiling water and cook 11–12 minutes (9 for jammy yolks).', 'Move them straight to a bowl of ice water for 10 minutes.', 'Refrigerate in the shell; they peel easiest the next day.'] },
  { id: 'm-snack-box', name: 'Protein Snack Boxes', cat: 'snack', serves: 5, size: '1 box', mins: 25, keeps: 4, freezes: false, week: 5,
    ing: ['10 eggs', '1 cup hummus', '1 lb baby carrots', '2 cucumbers, sliced', '½ box whole-grain crackers', '2 cups grapes'],
    steps: ['Hard-boil the eggs (see Hard-Boiled Eggs), cool and peel.', 'Divide the hummus between five small containers.', 'Fill five boxes with two eggs, vegetables, grapes and a handful of crackers in a separate bag.'] },
  { id: 'm-energy-bites', name: 'Peanut Butter Energy Bites', cat: 'snack', serves: 8, size: '2 bites', mins: 15, keeps: 7, freezes: true, week: 4,
    ing: ['1 cup rolled oats', '½ cup peanut butter', '⅓ cup honey', '2 tbsp chia seeds', '¼ cup mini chocolate chips', '1 tsp vanilla extract', '¼ cup vanilla protein powder (optional)'],
    steps: ['Stir everything together. If it’s too dry, add a spoon of milk; too wet, more oats.', 'Chill 15 minutes, then roll into 16 balls.', 'Keep in the fridge or freezer.'] },

  { id: 'm-taco-chicken', name: 'Taco Chicken (batch)', cat: 'base', serves: 6, size: '4 oz cooked', mins: 30, keeps: 4, freezes: true, week: 4,
    ing: ['2 lb boneless skinless chicken breast', '1 tbsp chili powder', '2 tsp ground cumin', '1 tsp smoked paprika', '1 tsp garlic powder', '1 tsp onion powder', '½ tsp dried oregano', '1 tsp salt', '1 tbsp olive oil', '1 lime'],
    steps: ['Heat the oven to 425°F (220°C).', 'Mix the spices and salt, then rub them over the chicken with the oil.', 'Bake 18–22 minutes, until the thickest piece reaches 165°F (74°C).', 'Rest 5 minutes, squeeze the lime over and slice or shred.'],
    note: 'Use it in bowls, wraps, salads or on eggs. Make a second flavor too so you don’t get tired of one.' },
  { id: 'm-italian-chicken', name: 'Italian Herb Chicken (batch)', cat: 'base', serves: 6, size: '4 oz cooked', mins: 30, keeps: 4, freezes: true, week: 4,
    ing: ['2 lb boneless skinless chicken breast', '1 tbsp Italian seasoning', '1 tsp garlic powder', '1 tsp smoked paprika', '1 tsp salt', '½ tsp black pepper', '1 tbsp olive oil', '1 lemon'],
    steps: ['Heat the oven to 425°F (220°C).', 'Rub the chicken with the oil, seasoning, garlic powder, paprika, salt and pepper.', 'Bake 18–22 minutes, to 165°F (74°C).', 'Rest 5 minutes, squeeze the lemon over and slice.'] },
  { id: 'm-rice', name: 'Batch Rice', cat: 'base', serves: 6, size: '1 cup cooked', mins: 25, keeps: 4, freezes: true, week: 5,
    ing: ['2 cups long-grain rice (dry)', '1 tsp salt'],
    steps: ['Rinse the rice until the water runs mostly clear.', 'Bring 3 cups of water and the salt to a boil, add the rice, cover and simmer on low 18 minutes.', 'Rest 10 minutes covered, then fluff.', 'Spread on a tray to cool quickly, then refrigerate within an hour.'] },
  { id: 'm-quinoa', name: 'Batch Quinoa', cat: 'base', serves: 6, size: '¾ cup cooked', mins: 20, keeps: 5, freezes: true, week: 4,
    ing: ['1½ cups quinoa (dry)', '½ tsp salt'],
    steps: ['Rinse the quinoa well.', 'Simmer in 3 cups of salted water, covered, for 15 minutes.', 'Rest 5 minutes, fluff and cool.'] },
  { id: 'm-roast-veg', name: 'Roasted Vegetables', cat: 'base', serves: 6, size: '1 cup', mins: 40, keeps: 4, freezes: false, week: 6,
    ing: ['1 head broccoli, cut into florets', '2 bell peppers, chopped', '2 zucchini, chopped', '1 red onion, cut into wedges', '3 carrots, sliced', '3 tbsp olive oil', '1 tsp garlic powder', '1 tsp salt', '½ tsp black pepper'],
    steps: ['Heat the oven to 425°F (220°C).', 'Toss the vegetables with the oil and seasoning.', 'Spread over two sheet pans so they roast instead of steam.', 'Roast 25–30 minutes, stirring once, until browned at the edges.'] },
  { id: 'm-black-beans', name: 'Seasoned Black Beans', cat: 'base', serves: 6, size: '¾ cup', mins: 15, keeps: 4, freezes: true, week: 4,
    ing: ['3 cans black beans (15 oz), rinsed', '½ yellow onion, diced', '2 cloves garlic, minced', '1 tsp ground cumin', '1 lime', '½ tsp salt', '1 tbsp olive oil'],
    steps: ['Soften the onion in the oil, add the garlic and cumin for 1 minute.', 'Add the beans and ½ cup water. Simmer 8–10 minutes, mashing a few.', 'Finish with the lime juice and salt.'] },
];
const MEAL_PREPS = [
  { id: 'p-newt', name: 'Newt’s Sunday Prep', d: 'Egg muffins, two chicken flavors so you don’t get tired of one, rice, roasted vegetables, beans and yogurt jars.', items: [['m-egg-muffins', 5], ['m-yogurt-jars', 5], ['m-taco-chicken', 4], ['m-italian-chicken', 4], ['m-rice', 5], ['m-roast-veg', 6], ['m-black-beans', 4]] },
  { id: 'p-bowls', name: 'Bowl Week', d: 'Two complete bowls to trade off, plus a grab-and-go breakfast and snack.', items: [['m-burrito-bowls', 3], ['m-med-bowls', 3], ['m-overnight-oats', 5], ['m-hb-eggs', 5]] },
  { id: 'p-lowcook', name: 'Low-Cook Week', d: 'Canned chicken and fish, yogurt jars and snack boxes. The only cooking is boiling eggs.', items: [['m-tuna-salad', 3], ['m-chicken-salad', 3], ['m-yogurt-jars', 5], ['m-snack-box', 5]] },
  { id: 'p-freezer', name: 'Freezer Stock-Up', d: 'Big batches that freeze well. Portion them, freeze, and pull a few out each week.', items: [['m-turkey-chili', 4], ['m-meatballs', 3], ['m-salmon-patties', 2], ['m-curry', 3], ['m-breakfast-burritos', 4]] },
];

/* ---- quantities ---- */
const UFRAC = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8 };
const UNIT_ALIAS = { tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', cup: 'cup', cups: 'cup', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g', kg: 'kg', kgs: 'kg', ml: 'ml', l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l', can: 'can', cans: 'can', clove: 'clove', cloves: 'clove', pinch: 'pinch', bunch: 'bunch', bunches: 'bunch',
  bag: 'bag', bags: 'bag', jar: 'jar', jars: 'jar', head: 'head', heads: 'head', pkg: 'package', package: 'package', packages: 'package', box: 'box', boxes: 'box', stalk: 'stalk', stalks: 'stalk', pint: 'pint', pints: 'pint', scoop: 'scoop', scoops: 'scoop', slice: 'slice', slices: 'slice' };
const VOL = { tsp: 1, tbsp: 3, cup: 48, ml: 1 / 4.929, l: 1000 / 4.929 };   /* in teaspoons */
const WT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };                    /* in grams */
const UNIT_PL = { clove: 'cloves', pinch: 'pinches', bunch: 'bunches', bag: 'bags', jar: 'jars', head: 'heads', package: 'packages', box: 'boxes', stalk: 'stalks', pint: 'pints', scoop: 'scoops', slice: 'slices', can: 'cans' };
function numOf(s) {
  s = String(s).trim().replace(',', '.'); let v = 0;
  const u = s.match(/[½⅓⅔¼¾⅛]/); if (u) { v += UFRAC[u[0]]; s = s.replace(u[0], '').trim(); }
  if (!s) return v;
  const parts = s.split(/\s+/);
  for (const p of parts) { if (p.includes('/')) { const [a, b] = p.split('/'); if (+b) v += +a / +b; } else v += +p || 0; }
  return v;
}
function parseIng(line) {
  let s = String(line || '').trim().replace(/^[-•*]\s*/, ''); if (!s) return null;
  const m = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[½⅓⅔¼¾⅛]?|[½⅓⅔¼¾⅛])\s*(?:(?:-|–|to)\s*[\d.,\/½⅓⅔¼¾⅛]+\s*)?/);
  let q = null, u = '';
  if (m) { q = numOf(m[1]); s = s.slice(m[0].length); }
  let paren = ''; const pm = s.match(/^(\([^)]*\))\s*/); if (q != null && pm) { paren = pm[1]; s = s.slice(pm[0].length); }
  const um = s.match(/^([A-Za-z]+)\.?(\s+(?:of\s+)?|$)/);
  if (q != null && um && UNIT_ALIAS[um[1].toLowerCase()]) { u = UNIT_ALIAS[um[1].toLowerCase()]; s = s.slice(um[0].length); }
  let n = s.trim(); if (paren) { const c = n.indexOf(','); n = c < 0 ? n + ' ' + paren : n.slice(0, c) + ' ' + paren + n.slice(c); }
  if (!n) return null;
  return { q: q != null && q > 0 ? q : null, u, n, a: guessAisle(n, u) };
}
function guessAisle(n, u) {
  const t = String(n).toLowerCase().split(',')[0];
  if (/\bfrozen\b/.test(t)) return 'frozen';
  if (/protein powder/.test(t)) return 'pantry';
  if (u === 'can' || u === 'jar' || /\bcanned\b|\bbeans?\b|chickpea|salsa|marinara|tomato (paste|sauce)|crushed tomato|diced tomato|coconut milk|broth|stock\b|pickle|olives/.test(t)) return 'canned';
  if (/peanut butter|almond butter|powder|seasoning|flakes|\bdried\b|cumin|paprika|oregano|cinnamon|nutmeg|\bsalt\b|black pepper|curry|vanilla|honey|maple|syrup|soy sauce|vinegar|\boil\b|mustard|sriracha|hot sauce|tahini|chia|flax|cornstarch|baking|sugar|chocolate|almonds?\b|walnut|pecan|cashew|\bnuts?\b|sesame|ketchup|mayo/.test(t)) return 'pantry';
  if (/\beggs?\b|yogurt|\bmilk\b|\bbutter\b|kefir|cream\b/.test(t)) return 'dairy';
  if (/chicken|turkey|salmon|shrimp|tofu|tempeh|\bfish\b|\bcod\b|tilapia|steak|\bbeef\b|\bpork\b|sausage|bacon/.test(t)) return 'protein';
  if (/\brice\b|quinoa|\boats?\b|pasta|noodle|tortilla|bread|granola|crumbs|cracker|lentil|pita|\bwraps?\b|couscous|flour|bagel|\bbuns?\b/.test(t)) return 'grains';
  if (/onion|garlic|pepper|broccoli|spinach|lettuce|romaine|tomato|cucumber|carrot|celery|zucchini|potato|\blimes?\b|lemon|cilantro|parsley|basil|berr|banana|apple|grape|avocado|ginger|scallion|kale|cabbage|coleslaw|\bpeas?\b|mushroom|squash|green bean|\bcorn\b|hummus|orange|cauliflower|asparagus|herb|mint|fruit/.test(t)) return 'produce';
  return 'other';
}
function famOf(u) {
  if (VOL[u]) return { k: 'vol', mul: VOL[u] };
  if (WT[u]) return { k: 'wt', mul: WT[u] };
  return { k: 'n:' + (u || ''), mul: 1, unit: u || '' };
}
const isMetric = () => (S.meta.settings && S.meta.settings.unit) === 'kg';
const FRACS = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
function fracStr(q) {
  if (q == null || !isFinite(q)) return '';
  if (q >= 20) return String(Math.round(q));
  let w = Math.floor(q + 1e-9); const f = q - w; let best = FRACS[0], d = 9;
  for (const x of FRACS) { const e = Math.abs(f - x[0]); if (e < d) { d = e; best = x; } }
  if (best[0] === 1) { w++; best = FRACS[0]; }
  if (!w && !best[1]) return q > 0 ? '⅛' : '0';
  return (w ? String(w) : '') + best[1];
}
const ceilTo = (v, step) => Math.ceil(v / step - 1e-6) * step;
const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);
/* A total in base units (tsp or g, or a count) shown in the friendliest unit. shop = round up for buying. */
function measure(total, fam, shop) {
  if (fam.k === 'vol') {
    if (total < 3 - 1e-6) return [shop ? ceilTo(total, 0.5) : total, 'tsp'];
    if (total < 12 - 1e-6) return [shop ? ceilTo(total / 3, 0.5) : total / 3, 'tbsp'];
    if (isMetric()) { const ml = total * 4.929; return ml >= 1000 ? [roundTo(ml / 1000, 0.1), 'l', true] : [ml < 100 ? roundTo(ml, 5) : roundTo(ml, 10), 'ml', true]; }
    return [shop ? ceilTo(total / 48, 0.25) : total / 48, 'cup'];
  }
  if (fam.k === 'wt') {
    if (isMetric()) return total >= 1000 ? [roundTo(total / 1000, 0.1), 'kg', true] : [total < 100 ? roundTo(total, 5) : roundTo(total, shop ? 50 : 10), 'g', true];
    const oz = total / WT.oz; if (oz < 16 - 1e-6) return [shop ? Math.ceil(oz - 0.05) : oz, 'oz'];
    return [shop ? ceilTo(oz / 16, 0.25) : oz / 16, 'lb'];
  }
  return [shop ? Math.max(1, Math.ceil(total - 0.05)) : total, fam.unit];
}
function qtyText(q, u, dec) {
  const n = dec ? String(Math.round(q * 10) / 10) : fracStr(q);
  if (!u) return n;
  if (u === 'cup') return n + (q > 1.01 ? ' cups' : ' cup');
  return n + ' ' + (q > 1.01 && UNIT_PL[u] ? UNIT_PL[u] : u);
}
const shopName = n => String(n || '').split(',')[0].trim();
function singular(w) { return /ies$/.test(w) ? w.slice(0, -3) + 'y' : /(o|ch|sh|x)es$/.test(w) ? w.slice(0, -2) : /[^su]s$/.test(w) ? w.slice(0, -1) : w; }
function plural(w) { return /[sxi]$/.test(w) ? w : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : /(o|ch|sh)$/.test(w) ? w + 'es' : w + 's'; }
/* "2 bell pepper" → "2 bell peppers"; the last word of the name before any brackets follows the count */
function nameFor(n, q, u) {
  if (u || q == null) return n;
  const m = String(n).match(/^([^(,]*?)(\s*[(,].*)?$/); if (!m) return n;
  const words = m[1].split(' '); const last = words.pop(); const w = q > 1.01 ? plural(last) : singular(last);
  return [...words, w].join(' ') + (m[2] || '');
}
const ingKey = n => singular(shopName(n).toLowerCase().replace(/\s+/g, ' '));
function ingLine(g, f) {
  if (g.q == null) return { q: '', n: g.n };
  const fam = famOf(g.u); const [v, u, dec] = fam.k === 'vol' || fam.k === 'wt' ? measure(g.q * fam.mul * f, fam, false) : [g.q * f, g.u];
  return { q: qtyText(v, u, dec), n: nameFor(g.n, v, u) };
}
/* ---- macros ---- */
/* Rough nutrition per 100 g as bought (USDA-style averages), plus grams per cup / piece / can for converting amounts.
   Spices, salt and vinegar count as zero. Anything not here shows as "not counted". */
const F = (k, kcal, p, c, f, g) => ({ re: new RegExp(k), kcal, p, c, f, g: g || {} });
const FOODS = [
  F('protein powder', 400, 80, 10, 5, { cup: 120, scoop: 30 }),
  F('powder|seasoning|cumin|paprika|oregano|cinnamon|nutmeg|\\bsalt\\b|black pepper|vanilla|\\bdried\\b|flakes|vinegar|extract|curry|thyme|rosemary', 0, 0, 0, 0, { cup: 100 }),
  F('canned chicken', 106, 23, 0, 1.8, { can: 113 }),
  F('canned salmon', 140, 20, 0, 6.5, { can: 340 }),
  F('tuna', 116, 25.5, 0, 0.8, { can: 113 }),
  F('salmon', 208, 20, 0, 13, { each: 170 }),
  F('chicken thigh', 135, 19, 0, 6, { each: 110 }),
  F('chicken', 120, 22.5, 0, 2.6, { each: 200 }),
  F('turkey', 150, 18.7, 0, 8.3, {}),
  F('shrimp', 85, 20, 0, 0.5, {}),
  F('tofu', 144, 17, 3, 9, { package: 397, block: 397 }),
  F('egg white', 52, 11, 0.7, 0.2, { cup: 243, each: 33 }),
  F('\\beggs?\\b', 143, 12.6, 0.7, 9.5, { each: 50 }),
  F('yogurt', 59, 10.3, 3.6, 0.4, { cup: 245 }),
  F('coconut milk', 60, 0.6, 1.4, 5.8, { can: 400, cup: 240 }),
  F('\\bmilk\\b', 50, 3.3, 4.8, 2, { cup: 244 }),
  F('peanut butter|almond butter', 588, 25, 20, 50, { cup: 258 }),
  F('\\bbutter\\b', 717, 0.9, 0.1, 81, { cup: 227 }),
  F('chocolate', 480, 4.2, 63, 30, { cup: 170 }),
  F('black bean', 120, 7.5, 21, 0.4, { can: 240, cup: 172 }),
  F('kidney bean|pinto bean|white bean|cannellini', 120, 7.8, 21, 0.5, { can: 240, cup: 177 }),
  F('chickpea', 139, 7, 22, 2.5, { can: 250, cup: 164 }),
  F('lentil', 358, 24, 63, 2.2, { cup: 192 }),
  F('crushed tomato|tomato sauce', 38, 1.6, 7.3, 0.3, { can: 794, cup: 245 }),
  F('diced tomato', 24, 1.1, 4.5, 0.2, { can: 411, cup: 240 }),
  F('tomato', 18, 0.9, 3.9, 0.2, { pint: 300, each: 120, cup: 150 }),
  F('sweet potato', 86, 1.6, 20, 0.1, { each: 180 }),
  F('potato', 77, 2, 17, 0.1, { each: 210 }),
  F('carrot', 41, 0.9, 9.6, 0.2, { each: 60, cup: 128 }),
  F('bell pepper|jalape', 26, 1, 6, 0.3, { each: 120, cup: 150 }),
  F('green onion|scallion', 32, 1.8, 7.3, 0.2, { each: 15, bunch: 100 }),
  F('onion|shallot', 40, 1.1, 9.3, 0.1, { each: 150, cup: 160 }),
  F('garlic', 149, 6.4, 33, 0.5, { clove: 3, head: 50 }),
  F('ginger', 80, 1.8, 18, 0.8, { cup: 96 }),
  F('broccoli|cauliflower', 34, 2.8, 6.6, 0.4, { head: 300, cup: 91 }),
  F('spinach|kale|lettuce|romaine|greens', 23, 2.9, 3.6, 0.4, { cup: 30, bag: 142, head: 450 }),
  F('zucchini|squash', 17, 1.2, 3.1, 0.3, { each: 200 }),
  F('cucumber', 15, 0.7, 3.6, 0.1, { each: 300 }),
  F('celery', 14, 0.7, 3, 0.2, { stalk: 40, cup: 101 }),
  F('mushroom', 22, 3.1, 3.3, 0.3, { cup: 70 }),
  F('green bean', 31, 1.8, 7, 0.2, { cup: 110 }),
  F('cornstarch', 381, 0.3, 91, 0.1, { cup: 128 }),
  F('\\bcorn\\b', 88, 3, 20.7, 0.8, { cup: 140, each: 100 }),
  F('snap pea|snow pea|\\bpeas\\b', 42, 2.8, 7.6, 0.2, { cup: 98 }),
  F('coleslaw|cabbage', 25, 1.3, 5.8, 0.1, { bag: 397, head: 900, cup: 89 }),
  F('cilantro|parsley|basil|\\bdill\\b|\\bmint\\b|herb', 23, 2.1, 3.7, 0.5, { bunch: 50, cup: 16 }),
  F('\\blimes?\\b', 30, 0.7, 10.5, 0.2, { each: 44 }),
  F('lemon', 29, 1.1, 9.3, 0.3, { each: 60 }),
  F('berr', 50, 0.8, 12, 0.3, { cup: 145, pint: 300 }),
  F('banana', 89, 1.1, 23, 0.3, { each: 118 }),
  F('grape', 69, 0.7, 18, 0.2, { cup: 151 }),
  F('apple', 52, 0.3, 14, 0.2, { each: 180 }),
  F('avocado', 160, 2, 8.5, 14.7, { each: 150 }),
  F('hummus', 166, 7.9, 14.3, 9.6, { cup: 246 }),
  F('salsa', 36, 1.5, 7, 0.2, { jar: 454, cup: 260 }),
  F('marinara|pasta sauce', 50, 1.5, 8, 1.5, { jar: 680, cup: 250 }),
  F('pickle', 12, 0.5, 2.4, 0.2, { cup: 140, each: 35 }),
  F('olive|\\boil\\b', 884, 0, 0, 100, { cup: 216 }),
  F('soy sauce|tamari', 53, 8, 4.9, 0.6, { cup: 255 }),
  F('mustard|dijon', 66, 4, 5, 4, { cup: 250 }),
  F('honey', 304, 0.3, 82, 0, { cup: 339 }),
  F('maple|syrup', 260, 0, 67, 0.1, { cup: 315 }),
  F('sugar', 387, 0, 100, 0, { cup: 200 }),
  F('tahini', 595, 17, 21, 54, { cup: 240 }),
  F('chia|flax', 486, 17, 42, 31, { cup: 192 }),
  F('sesame seed', 573, 18, 23, 50, { cup: 144 }),
  F('almond|walnut|pecan|cashew|\\bnuts?\\b', 579, 21, 22, 50, { cup: 92 }),
  F('granola', 470, 10, 64, 20, { cup: 120 }),
  F('cracker', 440, 9, 68, 15, { box: 255 }),
  F('crumb|panko', 370, 12, 75, 2.5, { cup: 60 }),
  F('tortilla|\\bwraps?\\b', 300, 8, 50, 7.5, { each: 70, package: 560 }),
  F('bread|bun|roll\\b|bagel|pita', 265, 9, 49, 3.2, { slice: 30, each: 60 }),
  F('pasta|noodle|spaghetti|penne', 371, 13, 75, 1.5, { cup: 100, box: 454 }),
  F('\\brice\\b', 365, 7.1, 80, 0.7, { cup: 185 }),
  F('quinoa', 368, 14.1, 64, 6.1, { cup: 170 }),
  F('\\boats?\\b', 379, 13, 68, 6.5, { cup: 81 }),
  F('flour', 364, 10, 76, 1, { cup: 125 }),
];
function foodFor(g) { const t = (g.u === 'can' ? 'canned ' : '') + shopName(g.n).toLowerCase(); return FOODS.find(x => x.re.test(t)) || null; }
/* grams of an ingredient line, or null when the amount can't be turned into grams */
function gramsOf(g, food) {
  if (g.q == null) return food && !food.kcal ? 0 : null;
  if (WT[g.u]) return g.q * WT[g.u];
  if (VOL[g.u]) { const c = food.g.cup; return g.q * VOL[g.u] * (c ? c / 48 : 4.93); }
  const per = food.g[g.u || 'each']; return per ? g.q * per : null;
}
/* Estimated macros for the whole recipe from its ingredients: { kcal, p, c, f, missing: [names] } */
function estimateMacros(ing) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, missing: [] };
  for (const g of ing || []) {
    if (!g || !g.n) continue; const food = foodFor(g); const gr = food ? gramsOf(g, food) : null;
    if (gr == null) { t.missing.push(shopName(g.n)); continue; }
    for (const k of ['kcal', 'p', 'c', 'f']) t[k] += food[k] * gr / 100;
  }
  return t;
}
const MACRO_KEYS = [['kcal', 'Calories', ''], ['p', 'Protein', ' g'], ['c', 'Carbs', ' g'], ['f', 'Fat', ' g']];
/* Per serving. Numbers you typed in win; the rest come from the ingredients. */
function macros(r) {
  if (!r) return null;
  if (r._mac && r._mac.v === r.updatedAt) return r._mac.m;
  const e = estimateMacros(r.ing); const sv = r.serves || 1; const man = r.macros || {}; const out = { missing: e.missing, manual: false, est: false };
  for (const [k] of MACRO_KEYS) {
    const typed = man[k] != null && man[k] !== '' ? +man[k] : k === 'p' && r.protein ? +r.protein : null;
    if (typed != null && isFinite(typed)) { out[k] = typed; out.manual = true; } else { out[k] = e[k] / sv; out.est = true; }
  }
  for (const [k] of MACRO_KEYS) out[k] = Math.round(out[k]);
  const counted = (r.ing || []).length - e.missing.length;
  if (!out.manual && !counted) return null;
  try { Object.defineProperty(r, '_mac', { value: { v: r.updatedAt, m: out }, enumerable: false, configurable: true, writable: true }); } catch (x) {}
  return out;
}
const macroLine = m => m ? m.kcal + ' kcal · ' + m.p + ' g protein' : '';
function MacroTiles({ m }) {
  return html`<div class="mac-tiles">${MACRO_KEYS.map(([k, l, u]) => html`<div key=${k} class=${'mac ' + k}><b class="num">${m[k]}${u}</b><span>${l}</span></div>`)}</div>`;
}
const ingToText = g => (g.q != null ? fracStr(g.q) + ' ' : '') + (g.u ? g.u + ' ' : '') + g.n;

/* ---- data ---- */
const clampInt = (v, lo, hi, d) => { v = Math.round(+v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
function normMeals(x) {
  x = x && typeof x === 'object' ? x : {};
  const p = x.plan && typeof x.plan === 'object' ? x.plan : {};
  const recipes = {}; for (const [k, r] of Object.entries(x.recipes && typeof x.recipes === 'object' ? x.recipes : {})) if (r && typeof r === 'object' && Array.isArray(r.ing)) recipes[k] = r;
  return {
    recipes,
    plan: { people: clampInt(p.people, 1, 12, 1), weeks: clampInt(p.weeks, 1, 4, 1), items: (Array.isArray(p.items) ? p.items : []).filter(i => i && typeof i.r === 'string').map(i => ({ id: String(i.id || uid('mp')), r: i.r, n: clampInt(i.n, 1, 21, 3) })) },
    checks: x.checks && typeof x.checks === 'object' ? x.checks : {},
    extras: (Array.isArray(x.extras) ? x.extras : []).filter(e => e && e.t).map(e => ({ id: String(e.id || uid('mx')), t: String(e.t), c: !!e.c })),
  };
}
const MEAL_BUILTIN = Object.fromEntries(MEAL_LIB.map(r => [r.id, { ...r, builtin: true, ing: r.ing.map(parseIng).filter(Boolean) }]));
const ML = () => { if (!S.meta.meals || !S.meta.meals.plan) S.meta.meals = normMeals(S.meta.meals); return S.meta.meals; };
function getRecipe(id) {
  const own = ML().recipes[id]; const b = MEAL_BUILTIN[id];
  if (own) return { ...own, id, builtin: !!b, edited: !!b };
  return b || null;
}
function allRecipes() {
  const ids = [...Object.keys(MEAL_BUILTIN), ...Object.keys(ML().recipes).filter(k => !MEAL_BUILTIN[k])];
  return ids.map(getRecipe).filter(Boolean);
}
const planItemFor = id => ML().plan.items.find(i => i.r === id);
const mealCommit = fn => commit(st => { st.meta.meals = normMeals(st.meta.meals); fn(st.meta.meals); }, 'meta');
function addToPlan(id, n) {
  const r = getRecipe(id); if (!r) return;
  mealCommit(m => { const it = m.plan.items.find(i => i.r === id); if (it) it.n = n || it.n; else m.plan.items.push({ id: uid('mp'), r: id, n: n || r.week || 3 }); });
  showToast({ kind: 'info', text: r.name + ' added to your prep', action: 'Undo', ms: 5000, fn: () => mealCommit(m => { m.plan.items = m.plan.items.filter(i => i.r !== id); }) });
}
const removeFromPlan = id => mealCommit(m => { m.plan.items = m.plan.items.filter(i => i.r !== id); });
function servingsFor(it) { const P = ML().plan; return it.n * P.people * P.weeks; }
function shoppingList() {
  const P = ML().plan; const map = new Map();
  for (const it of P.items) {
    const r = getRecipe(it.r); if (!r) continue; const f = servingsFor(it) / (r.serves || 1);
    for (const g of r.ing || []) {
      if (!g || !g.n) continue; const key = ingKey(g.n);
      let e = map.get(key); if (!e) { e = { key, name: shopName(g.n), a: g.a || guessAisle(g.n, g.u), fams: {}, from: [], loose: false }; map.set(key, e); }
      if (!e.from.includes(r.name)) e.from.push(r.name);
      if (g.q == null) { e.loose = true; continue; }
      const fam = famOf(g.u); (e.fams[fam.k] = e.fams[fam.k] || { fam, total: 0 }).total += g.q * fam.mul * f;
    }
  }
  return [...map.values()].map(e => {
    const parts = Object.values(e.fams).map(x => measure(x.total, x.fam, true));
    const qty = parts.map(([v, u, dec]) => qtyText(v, u, dec)).join(' + ');
    const name = parts.length === 1 && !parts[0][1] ? nameFor(e.name, parts[0][0], '') : e.name;
    return { ...e, qty, label: name };
  });
}
function listText() {
  const P = ML().plan; const items = shoppingList(); const m = ML(); const out = ['Ironwood shopping list · ' + P.people + (P.people === 1 ? ' person' : ' people') + ' · ' + P.weeks + (P.weeks === 1 ? ' week' : ' weeks')];
  for (const [a, label] of AISLES) {
    const rows = items.filter(x => x.a === a && !m.checks[x.key]).map(x => '- ' + (x.qty ? x.qty + ' ' : '') + x.label);
    const ex = a === 'other' ? m.extras.filter(e => !e.c).map(e => '- ' + e.t) : [];
    if (rows.length || ex.length) out.push('', label.toUpperCase(), ...rows, ...ex);
  }
  return out.join('\n');
}
async function shareList() {
  const t = listText();
  try { if (navigator.share) { await navigator.share({ title: 'Shopping list', text: t }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(t); showToast({ kind: 'info', text: 'Shopping list copied' }); } catch (e) { showToast({ kind: 'bad', text: 'Couldn’t copy the list here' }); }
}

/* ---- screens ---- */
const MEALS = { mode: ['plan', 'recipes', 'list'].includes(lsGet('mealsMode')) ? lsGet('mealsMode') : 'plan', q: '', cat: 'all' };
const setMealsMode = m => { MEALS.mode = m; lsSet('mealsMode', m); S.rerender(); scrollTo(0, 0); };
function MStep({ value, min, max, onChange, label, unit }) {
  return html`<div class="mstep" role="group" aria-label=${label}>
    <button aria-label=${'Fewer ' + label} disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - 1))}>−</button>
    <span class="v num" aria-live="polite">${value}${unit ? html`<small>${unit}</small>` : null}</span>
    <button aria-label=${'More ' + label} disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + 1))}>+</button></div>`;
}
function MealsScreen({ view }) {
  const vt = view && view.type;
  if (vt === 'meal') return html`<${RecipeView} key=${view.id} id=${view.id}/>`;
  if (vt === 'mealEdit') return html`<${RecipeEditor} view=${view}/>`;
  return html`<div><${TopSwitch} value=${MEALS.mode} options=${[['plan', 'Prep'], ['recipes', 'Recipes'], ['list', 'List']]} onChange=${setMealsMode}/>
    ${MEALS.mode === 'recipes' ? html`<${RecipesPane}/>` : MEALS.mode === 'list' ? html`<${ShopPane}/>` : html`<${PrepPane}/>`}</div>`;
}
function keepNote(r, it) {
  const P = ML().plan; const keeps = r.keeps || 4;
  if (P.weeks > 1) return r.freezes ? 'Lasts ' + keeps + ' days in the fridge. Freeze the portions for later weeks.' : 'Doesn’t freeze well. Make this fresh each week rather than all at once.';
  if (it.n > keeps && keeps < 7) return r.freezes ? 'Lasts ' + keeps + ' days in the fridge. Freeze what you’ll eat after day ' + keeps + '.' : 'Lasts ' + keeps + ' days in the fridge. Make a second batch midweek.';
  return null;
}
function PrepPane() {
  const m = ML(); const P = m.plan; const items = P.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r);
  const setP = (k, v) => mealCommit(mm => { mm.plan[k] = v; });
  const total = items.reduce((a, x) => a + servingsFor(x.it), 0);
  const withM = items.map(x => ({ ...x, m: macros(x.r) })).filter(x => x.m); const partial = withM.length < items.length || withM.some(x => x.m.missing.length);
  const perDay = Object.fromEntries(MACRO_KEYS.map(([k]) => [k, Math.round(withM.reduce((a, x) => a + x.m[k] * x.it.n, 0) / 7)]));
  const mins = items.reduce((a, x) => a + (+x.r.mins || 0), 0);
  const usePrep = pr => {
    const apply = replace => { mealCommit(mm => { if (replace) mm.plan.items = []; for (const [r, n] of pr.items) { if (!getRecipe(r)) continue; const ex = mm.plan.items.find(i => i.r === r); if (ex) ex.n = n; else mm.plan.items.push({ id: uid('mp'), r, n }); } }); closeSheet(); scrollTo(0, 0); };
    if (!P.items.length) apply(true);
    else openSheet({ type: 'confirm', title: 'Use ' + pr.name + '?', body: 'Replace what’s in your prep now, or add these recipes to it.', ok: 'Replace my prep', onOk: () => apply(true), alt: 'Add to my prep', onAlt: () => apply(false) });
  };
  return html`<div>
    <div class="card mp-who">
      <div class="mp-cell"><div class="lbl">People</div><${MStep} label="people" value=${P.people} min=${1} max=${12} onChange=${v => setP('people', v)}/></div>
      <div class="mp-cell"><div class="lbl">Weeks</div><${MStep} label="weeks" value=${P.weeks} min=${1} max=${4} onChange=${v => setP('weeks', v)}/></div>
    </div>
    <${Tip} id="meal-prep" style="margin-top:10px">Set how many times a week each person eats a meal. Recipes and the shopping list scale to match.<//>
    <div class="section-h"><h2>Your prep</h2>${items.length ? html`<span class="aside num">${total} serving${total === 1 ? '' : 's'}</span>` : null}</div>
    ${items.length ? html`<div class="stack">${items.map(({ it, r }) => {
      const sv = servingsFor(it); const f = sv / (r.serves || 1); const kn = keepNote(r, it);
      return html`<div key=${it.id} class="mp-item">
        <div class="row" style="align-items:flex-start"><button class="mp-name" onClick=${() => UI.setView({ type: 'meal', id: r.id })}><div class="t">${r.name}</div>
          <div class="s num">${sv} serving${sv === 1 ? '' : 's'} · ${Math.abs(f - 1) < 0.01 ? '1 batch' : fracStr(f) + ' × recipe'}${macros(r) ? ' · ' + macroLine(macros(r)) + ' each' : ''}</div></button>
          <button class="tip-x" aria-label=${'Remove ' + r.name} onClick=${() => removeFromPlan(r.id)}>${I.x}</button></div>
        <div class="row"><span class="small muted" style="flex:1">Times a week${P.people > 1 ? ', per person' : ''}</span><${MStep} label=${'times a week for ' + r.name} value=${it.n} min=${1} max=${21} onChange=${v => mealCommit(mm => { const x = mm.plan.items.find(i => i.id === it.id); if (x) x.n = v; })}/></div>
        ${kn ? html`<div class="mp-warn">${kn}</div>` : null}</div>`; })}</div>
      ${withM.length || mins ? html`<div class="card mp-sum" id="prep-macros">
        ${withM.length ? html`<div style="font-weight:700">${partial ? 'At least, a day' : 'A day, on average'}${P.people > 1 ? ', per person' : ''}</div><${MacroTiles} m=${perDay}/>
          <div class="small muted">Estimated from the ingredients, spread over 7 days. Counts only the meals in your prep.</div>` : null}
        ${mins ? html`<div class="small muted">About ${mins >= 60 ? Math.floor(mins / 60) + ' hr ' + (mins % 60 ? (mins % 60) + ' min' : '') : mins + ' min'} of cooking if you make them one after another. Less with the oven and stove going together.</div>` : null}</div>` : null}
      <div class="row" style="margin-top:12px"><button class="btn primary" style="flex:1" id="to-list" onClick=${() => setMealsMode('list')}>Shopping list</button><button class="btn" style="flex:1" onClick=${() => setMealsMode('recipes')}>${I.plus} Add recipes</button></div>`
    : html`<div class="card stack"><p class="note">Nothing planned yet. Start from a ready-made prep below, or pick recipes one at a time.</p><button class="btn wide" onClick=${() => setMealsMode('recipes')}>Browse recipes</button></div>`}
    <div class="section-h"><h2>Ready-made preps</h2></div>
    <div class="stack">${MEAL_PREPS.map(pr => html`<div key=${pr.id} class="r-card prep-card">
      <h3>${pr.name}</h3><div class="days">${pr.d}</div>
      <div class="small faint">${pr.items.map(([r]) => (getRecipe(r) || {}).name).filter(Boolean).join(' · ')}</div>
      <button class="btn wide" style="margin-top:6px" onClick=${() => usePrep(pr)}>Use this prep</button></div>`)}</div>
    ${items.length ? html`<button class="btn text wide" style="margin-top:14px;color:var(--stop)" onClick=${() => openSheet({ type: 'confirm', title: 'Clear your prep?', body: 'Removes every recipe from this prep and unticks the shopping list. Your saved recipes stay.', ok: 'Clear prep', danger: true, onOk: () => { mealCommit(mm => { mm.plan.items = []; mm.checks = {}; }); closeSheet(); } })}>Clear prep</button>` : null}
  </div>`;
}
function RecipesPane() {
  const [q, setQ] = useState(MEALS.q); const [cat, setCat] = useState(MEALS.cat);
  const own = ML().recipes;
  const term = q.trim().toLowerCase();
  const list = allRecipes().filter(r => (cat === 'all' || (cat === 'mine' ? own[r.id] && !r.builtin : r.cat === cat)) && (!term || (r.name + ' ' + (r.ing || []).map(g => g.n).join(' ')).toLowerCase().includes(term)));
  const mine = list.filter(r => !r.builtin); const lib = list.filter(r => r.builtin);
  const pick = c => { MEALS.cat = c; setCat(c); };
  const row = r => { const inP = planItemFor(r.id);
    return html`<div key=${r.id} class="meal-row"><button class="main" onClick=${() => UI.setView({ type: 'meal', id: r.id })}><div class="t">${r.name}</div>
      <div class="s num">${[macroLine(macros(r)), r.mins ? r.mins + ' min' : '', 'serves ' + r.serves, r.freezes ? 'freezes' : ''].filter(Boolean).join(' · ')}</div></button>
      <button class=${'meal-add' + (inP ? ' on' : '')} aria-label=${inP ? r.name + ' is in your prep. Remove it' : 'Add ' + r.name + ' to your prep'} onClick=${() => inP ? removeFromPlan(r.id) : addToPlan(r.id)}>${inP ? I.check : I.plus}</button></div>`; };
  const newRecipe = () => UI.setView({ type: 'mealEdit', isNew: true, draft: { id: uid('m'), name: '', cat: cat === 'all' || cat === 'mine' ? 'main' : cat, serves: 4, keeps: 4, freezes: false, macros: {}, mins: '', ing: [], steps: [], note: '' } });
  return html`<div>
    <input class="field" type="search" id="meal-search" placeholder="Search recipes or ingredients" value=${q} onInput=${e => { MEALS.q = e.target.value; setQ(e.target.value); }} style="margin-top:6px"/>
    <div class="chips" role="group" aria-label="Recipe type" style="margin-top:10px">${[['all', 'All'], ...MEAL_CATS, ['mine', 'Mine']].map(([k, l]) => html`<button key=${k} class=${'chip' + (cat === k ? ' on' : '')} aria-pressed=${cat === k} onClick=${() => pick(k)}>${l}</button>`)}</div>
    <button class="btn ghost wide" id="new-recipe" style="margin-top:12px" onClick=${newRecipe}>${I.plus} New recipe</button>
    ${mine.length ? html`<div class="section-h"><h2>My recipes</h2></div><div class="stack">${mine.map(row)}</div>` : null}
    ${MEAL_CATS.map(([c, label]) => { const rs = lib.filter(r => r.cat === c); return rs.length ? html`<div key=${c}><div class="section-h"><h2>${label}</h2></div><div class="stack">${rs.map(row)}</div></div>` : null; })}
    ${!list.length ? html`<div class="card note" style="margin-top:14px">No recipes match. Try another word, or make it a new recipe.</div>` : null}
  </div>`;
}
function RecipeView({ id }) {
  const r = getRecipe(id); const it = planItemFor(id);
  const [sv, setSv] = useState(() => r ? (it ? servingsFor(it) : r.serves) : 1);
  if (!r) return html`<div class="card note" style="margin-top:12px">This recipe was deleted.</div>`;
  const f = sv / (r.serves || 1);
  const edit = () => UI.setView({ type: 'mealEdit', isNew: false, draft: clone({ ...r, builtin: undefined, edited: undefined }) });
  const copy = () => UI.setView({ type: 'mealEdit', isNew: true, draft: clone({ ...r, id: uid('m'), name: r.name + ' (my version)', builtin: undefined, edited: undefined }) });
  const del = () => openSheet({ type: 'confirm', title: r.builtin ? 'Undo your changes?' : 'Delete this recipe?', body: r.builtin ? 'Puts ' + r.name + ' back to the original recipe.' : r.name + ' will be removed from your recipes and your prep.', ok: r.builtin ? 'Reset recipe' : 'Delete recipe', danger: true,
    onOk: () => { mealCommit(m => { delete m.recipes[id]; if (!r.builtin) m.plan.items = m.plan.items.filter(i => i.r !== id); }); closeSheet(); if (!r.builtin) UI.setView(null); } });
  return html`<div class="meal-view">
    <div class="eyebrow" style="margin-top:4px">${MEAL_CAT_NAME[r.cat] || 'Recipe'}${r.mins ? ' · ' + r.mins + ' min' : ''}${r.edited ? ' · edited' : !r.builtin ? ' · my recipe' : ''}</div>
    <h2 class="meal-title">${r.name}</h2>
    <div class="row wrap" style="gap:6px;margin-top:8px">
      <span class="chip">Fridge: ${r.keeps || 4} days</span>${r.freezes ? html`<span class="chip">Freezes well</span>` : null}</div>
    <div class="card mp-scale" style="margin-top:14px">
      <div style="flex:1;min-width:0"><div style="font-weight:700">Servings</div><div class="small muted num">${Math.abs(f - 1) < 0.01 ? 'Original recipe' : fracStr(f) + ' × the recipe (makes ' + r.serves + ')'}</div></div>
      <${MStep} label="servings" value=${sv} min=${1} max=${99} onChange=${setSv}/></div>
    ${(() => { const m = macros(r); return m ? html`<div class="section-h"><h2>Per serving</h2>${r.size ? html`<span class="aside">${r.size}</span>` : null}</div>
      <div class="card" id="recipe-macros"><${MacroTiles} m=${m}/>
        <p class="small muted" style="margin-top:10px">${m.manual && !m.est ? 'Entered by you.' : m.manual ? 'Partly entered by you, the rest estimated from the ingredients.' : 'Estimated from the ingredients.'}${m.missing.length && m.est ? ' Not counted: ' + m.missing.join(', ') + '.' : ''}</p></div>` : null; })()}
    <div class="section-h"><h2>Ingredients</h2>${sv !== r.serves ? html`<button class="btn text" onClick=${() => setSv(r.serves)}>Reset</button>` : null}</div>
    <ul class="ing-list card">${(r.ing || []).map((g, i) => { const l = ingLine(g, f); return html`<li key=${i}><span class="q">${l.q}</span><span>${l.n}</span></li>`; })}</ul>
    ${(r.steps || []).length ? html`<div class="section-h"><h2>Steps</h2></div>
      ${Math.abs(f - 1) > 0.01 ? html`<p class="small muted" style="margin:-4px 0 8px">Written for ${r.serves} servings. Cooking times stay about the same; use more pans so food isn’t crowded.</p>` : null}
      <ol class="step-list card">${r.steps.map((s, i) => html`<li key=${i}>${s}</li>`)}</ol>` : null}
    ${r.note ? html`<div class="tip-card" style="margin-top:12px;padding-right:14px">${r.note}</div>` : null}
    <div class="section-h"><h2>Prep</h2></div>
    ${it ? html`<div class="card stack"><div class="row"><span style="flex:1;font-weight:600">In your prep · times a week</span><${MStep} label="times a week" value=${it.n} min=${1} max=${21} onChange=${v => mealCommit(m => { const x = m.plan.items.find(i => i.r === id); if (x) x.n = v; })}/></div>
        <div class="row"><button class="btn" style="flex:1" onClick=${() => { MEALS.mode = 'plan'; lsSet('mealsMode', 'plan'); UI.setView(null); }}>See prep</button><button class="btn text" style="color:var(--stop)" onClick=${() => removeFromPlan(id)}>Remove</button></div></div>`
      : html`<button class="btn primary wide" id="add-to-prep" onClick=${() => addToPlan(id)}>${I.plus} Add to my prep</button>`}
    <div class="row wrap" style="margin-top:14px">
      <button class="btn" style="flex:1" onClick=${edit}>${I.edit} Edit</button>
      <button class="btn" style="flex:1" onClick=${copy}>${I.copy} Copy</button></div>
    ${!r.builtin || r.edited ? html`<button class="btn text wide" style="color:var(--stop);margin-top:6px" onClick=${del}>${r.builtin ? 'Reset to original' : 'Delete recipe'}</button>` : null}
  </div>`;
}
function RecipeEditor({ view }) {
  const d0 = view.draft;
  const [d, setD] = useState(() => ({ ...d0, macros: { ...(d0.protein && !(d0.macros && d0.macros.p) ? { p: d0.protein } : {}), ...(d0.macros || {}) }, mins: d0.mins || '', serves: d0.serves || 4, keeps: d0.keeps || 4 }));
  const [ingTxt, setIngTxt] = useState(() => (d0.ing || []).map(ingToText).join('\n'));
  const [stepTxt, setStepTxt] = useState(() => (d0.steps || []).join('\n'));
  const [ov, setOv] = useState(() => Object.fromEntries((d0.ing || []).filter(g => g.a && g.a !== guessAisle(g.n, g.u)).map(g => [ingKey(g.n), g.a])));
  const [err, setErr] = useState('');
  const set = (k, v) => setD({ ...d, [k]: v });
  const parsed = ingTxt.split('\n').map(parseIng).filter(Boolean).map(g => ({ ...g, a: ov[ingKey(g.n)] || g.a }));
  const cycle = g => { const k = ingKey(g.n); const i = AISLES.findIndex(a => a[0] === g.a); setOv({ ...ov, [k]: AISLES[(i + 1) % AISLES.length][0] }); };
  const save = () => {
    const name = String(d.name || '').trim(); if (!name) { setErr('Give the recipe a name.'); return; }
    if (!parsed.length) { setErr('Add at least one ingredient.'); return; }
    const isBuiltin = !!MEAL_BUILTIN[d.id];
    const rec = { id: d.id, name, cat: d.cat || 'main', serves: clampInt(d.serves, 1, 99, 4), size: String(d.size || '').trim(), macros: Object.fromEntries(MACRO_KEYS.map(([k]) => [k, d.macros[k]]).filter(([, v]) => v !== '' && v != null && isFinite(+v)).map(([k, v]) => [k, +v])), mins: +d.mins > 0 ? Math.round(+d.mins) : null,
      keeps: clampInt(d.keeps, 1, 14, 4), freezes: !!d.freezes, week: d.week || 3, ing: parsed, steps: stepTxt.split('\n').map(s => s.trim()).filter(Boolean), note: String(d.note || '').trim(), base: isBuiltin || undefined, updatedAt: Date.now() };
    mealCommit(m => { m.recipes[d.id] = rec; });
    UI.setView({ type: 'meal', id: d.id });
  };
  return html`<div class="stack" style="margin-top:6px">
    <div><label class="lbl" for="me-name">Name</label><input class="field" id="me-name" value=${d.name} placeholder="e.g. Lemon pepper chicken" onInput=${e => { set('name', e.target.value); setErr(''); }}/></div>
    <div><label class="lbl">Type</label><div class="seg wide per" role="group" aria-label="Recipe type">${MEAL_CATS.map(([k, l]) => html`<button key=${k} class=${d.cat === k ? 'on' : ''} aria-pressed=${d.cat === k} onClick=${() => set('cat', k)}>${l.replace('Lunch & dinner', 'Meal').replace('Building blocks', 'Base')}</button>`)}</div></div>
    <div class="me-grid">
      <div><label class="lbl" for="me-serves">Makes (servings)</label><input class="field" id="me-serves" inputmode="numeric" value=${d.serves} onInput=${e => set('serves', e.target.value.replace(/\D/g, ''))}/></div>
      <div><label class="lbl" for="me-size">Serving size</label><input class="field" id="me-size" value=${d.size || ''} placeholder="e.g. 1 bowl" onInput=${e => set('size', e.target.value)}/></div>
      <div><label class="lbl" for="me-mins">Time (min)</label><input class="field" id="me-mins" inputmode="numeric" value=${d.mins} placeholder="optional" onInput=${e => set('mins', e.target.value.replace(/\D/g, ''))}/></div>
      <div><label class="lbl" for="me-keeps">Keeps in fridge (days)</label><input class="field" id="me-keeps" inputmode="numeric" value=${d.keeps} onInput=${e => set('keeps', e.target.value.replace(/\D/g, ''))}/></div>
      <div><label class="lbl">Freezes well</label><div class="seg wide" role="group" aria-label="Freezes well"><button class=${d.freezes ? 'on' : ''} aria-pressed=${!!d.freezes} onClick=${() => set('freezes', true)}>Yes</button><button class=${!d.freezes ? 'on' : ''} aria-pressed=${!d.freezes} onClick=${() => set('freezes', false)}>No</button></div></div>
    </div>
    <div><label class="lbl" for="me-ing">Ingredients, one per line</label>
      <textarea class="field me-ta" id="me-ing" placeholder=${'2 lb chicken breast\n1 cup rice (dry)\n3 cloves garlic, minced\nsalt and pepper'} value=${ingTxt} onInput=${e => { setIngTxt(e.target.value); setErr(''); }}></textarea>
      <p class="small muted" style="margin-top:6px">Write amounts first. Anything after a comma is prep and stays off the shopping list.</p></div>
    ${parsed.length ? html`<div class="card me-prev"><div class="lbl" style="margin-bottom:2px">How it reads · tap an aisle to change it</div>${parsed.map((g, i) => html`<div key=${i} class="me-row"><span class="q num">${g.q != null ? qtyText(g.q, g.u) : '—'}</span><span class="n">${g.n}</span><button class="chip" onClick=${() => cycle(g)}>${AISLE_NAME[g.a]}</button></div>`)}</div>` : null}
    ${(() => { const e = estimateMacros(parsed); const sv = clampInt(d.serves, 1, 99, 4); const setM = (k, v) => setD({ ...d, macros: { ...d.macros, [k]: v } });
      return html`<div><div class="lbl">Macros per serving</div><div class="me-mac">${MACRO_KEYS.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'me-m-' + k}>${l}${u ? ' (g)' : ''}</label>
        <input class="field" id=${'me-m-' + k} inputmode="decimal" value=${d.macros[k] != null ? d.macros[k] : ''} placeholder=${parsed.length ? String(Math.round(e[k] / sv)) : '—'} onInput=${ev => setM(k, ev.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
        <p class="small muted" style="margin-top:6px">Leave blank to use the estimate shown, worked out from the ingredients.${e.missing.length ? ' Not counted: ' + e.missing.join(', ') + '. Type the numbers in if those matter.' : ''}</p></div>`; })()}
    <div><label class="lbl" for="me-steps">Steps, one per line</label><textarea class="field me-ta" id="me-steps" value=${stepTxt} placeholder="Heat the oven to 425°F…" onInput=${e => setStepTxt(e.target.value)}></textarea></div>
    <div><label class="lbl" for="me-note">Notes</label><input class="field" id="me-note" value=${d.note || ''} placeholder="optional" onInput=${e => set('note', e.target.value)}/></div>
    ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
    <button class="btn primary wide" id="me-save" onClick=${save}>Save recipe</button>
    <button class="btn wide" onClick=${() => UI.setView(view.isNew ? null : { type: 'meal', id: d.id })}>Cancel</button>
  </div>`;
}
function ShopPane() {
  const m = ML(); const P = m.plan; const items = shoppingList(); const [txt, setTxt] = useState('');
  const toggle = k => mealCommit(mm => { if (mm.checks[k]) delete mm.checks[k]; else mm.checks[k] = 1; });
  const got = items.filter(x => m.checks[x.key]).length + m.extras.filter(e => e.c).length; const all = items.length + m.extras.length;
  const addExtra = () => { const t = txt.trim(); if (!t) return; mealCommit(mm => { mm.extras.push({ id: uid('mx'), t, c: false }); }); setTxt(''); };
  const box = on => html`<span class="box" aria-hidden="true">${on ? I.check : null}</span>`;
  return html`<div>
    ${P.items.length ? html`<p class="small muted num" style="margin-top:6px">For ${P.people} ${P.people === 1 ? 'person' : 'people'} · ${P.weeks} ${P.weeks === 1 ? 'week' : 'weeks'} · ${P.items.length} recipe${P.items.length === 1 ? '' : 's'}${all ? ' · ' + got + ' of ' + all + ' in the cart' : ''}</p>`
      : html`<div class="card stack" style="margin-top:8px"><p class="note">Add recipes to your prep and their ingredients show up here, added up and sorted by aisle.</p><button class="btn wide" onClick=${() => setMealsMode('recipes')}>Browse recipes</button></div>`}
    ${all ? html`<div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" id="share-list" onClick=${shareList}>${I.copy} Share or copy</button>${got ? html`<button class="btn" style="flex:1" onClick=${() => mealCommit(mm => { mm.checks = {}; mm.extras.forEach(e => { e.c = false; }); })}>Untick all</button>` : null}</div>` : null}
    ${AISLES.map(([a, label]) => {
      const rows = items.filter(x => x.a === a).sort((x, y) => (+!!m.checks[x.key] - +!!m.checks[y.key]) || x.label.localeCompare(y.label));
      const ex = a === 'other' ? m.extras : [];
      if (!rows.length && !ex.length) return null;
      return html`<div key=${a}><div class="aisle-h">${label}</div>${a === 'pantry' ? html`<p class="small faint" style="margin:0 0 2px">You may have these already.</p>` : null}
        <div class="card shop-card">${rows.map(x => { const on = !!m.checks[x.key]; return html`<button key=${x.key} class=${'shop-row' + (on ? ' on' : '')} role="checkbox" aria-checked=${on} onClick=${() => toggle(x.key)}>${box(on)}
          <span style="flex:1;min-width:0"><span class="nm">${x.qty ? html`<b class="num">${x.qty}</b> ` : null}${x.label}${x.loose && x.qty ? ' (+ to taste)' : ''}</span><span class="from">${x.from.join(' · ')}</span></span></button>`; })}
          ${ex.map(e => html`<div key=${e.id} class=${'shop-row' + (e.c ? ' on' : '')}><button class="shop-x" role="checkbox" aria-checked=${e.c} onClick=${() => mealCommit(mm => { const y = mm.extras.find(z => z.id === e.id); if (y) y.c = !y.c; })}>${box(e.c)}<span class="nm" style="flex:1;text-align:left">${e.t}</span></button>
            <button class="tip-x" aria-label=${'Remove ' + e.t} onClick=${() => mealCommit(mm => { mm.extras = mm.extras.filter(z => z.id !== e.id); })}>${I.x}</button></div>`)}</div></div>`; })}
    <div class="section-h"><h2>Add an item</h2></div>
    <div class="row"><input class="field" id="extra-item" placeholder="e.g. coffee, paper towels" value=${txt} onInput=${e => setTxt(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') addExtra(); }}/><button class="btn primary" aria-label="Add to the list" disabled=${!txt.trim()} onClick=${addExtra}>${I.plus}</button></div>
  </div>`;
}
