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
  bag: 'bag', bags: 'bag', jar: 'jar', jars: 'jar', head: 'head', heads: 'head', pkg: 'package', package: 'package', packages: 'package', box: 'box', boxes: 'box', stalk: 'stalk', stalks: 'stalk', pint: 'pint', pints: 'pint', scoop: 'scoop', scoops: 'scoop', slice: 'slice', slices: 'slice', serving: 'serving', servings: 'serving' };
const VOL = { tsp: 1, tbsp: 3, cup: 48, ml: 1 / 4.929, l: 1000 / 4.929 };   /* in teaspoons */
const WT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };                    /* in grams */
const UNIT_PL = { clove: 'cloves', pinch: 'pinches', bunch: 'bunches', bag: 'bags', jar: 'jars', head: 'heads', package: 'packages', box: 'boxes', stalk: 'stalks', pint: 'pints', scoop: 'scoops', slice: 'slices', can: 'cans', serving: 'servings' };
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
/* Rough nutrition per 100 g as bought (USDA-style averages): calories, protein, carbs, fat, fiber, sugar (g) and
   sodium (mg), plus grams per cup / piece / can for converting amounts. The first entry whose pattern matches an
   ingredient's name is used unless you picked a food for it; spices count as zero. */
const NUT = [['kcal', 'Calories', ''], ['p', 'Protein', ' g'], ['c', 'Carbs', ' g'], ['f', 'Fat', ' g'], ['fib', 'Fiber', ' g'], ['sug', 'Sugar', ' g'], ['na', 'Sodium', ' mg']];
const MACRO_KEYS = NUT.slice(0, 4), EXTRA_KEYS = NUT.slice(4);
const F = (id, label, k, kcal, p, c, f, fib, sug, na, g) => ({ id, label, re: new RegExp(k), kcal, p, c, f, fib, sug, na, g: g || {} });
const FOODS = [
  F('protein-powder', 'Protein powder (whey)', 'protein powder', 400, 80, 10, 5, 2, 5, 300, { cup: 120, scoop: 30 }),
  F('salt', 'Salt', '\\bsalt\\b', 0, 0, 0, 0, 0, 0, 38758, { cup: 292 }),
  F('spices', 'Spices & dried herbs', 'italian seasoning|powder|cumin|paprika|oregano|cinnamon|nutmeg|black pepper|vanilla|\\bdried\\b|flakes|vinegar|extract|curry|thyme|rosemary|bay lea', 0, 0, 0, 0, 0, 0, 0, { cup: 100 }),
  F('seasoning', 'Seasoning blend (with salt)', 'seasoning', 0, 0, 0, 0, 0, 0, 6000, { cup: 100 }),
  F('water', 'Water', '^water$|\\bwater\\b', 0, 0, 0, 0, 0, 0, 0, { cup: 237 }),
  F('broth', 'Broth or stock', 'broth|\\bstock\\b', 5, 0.5, 0.4, 0.2, 0, 0.3, 370, { cup: 240, can: 400 }),
  F('canned-chicken', 'Chicken, canned (drained)', 'canned chicken', 106, 23, 0, 1.8, 0, 0, 400, { can: 113 }),
  F('canned-salmon', 'Salmon, canned', 'canned salmon', 140, 20, 0, 6.5, 0, 0, 400, { can: 340 }),
  F('tuna-oil', 'Tuna in oil (drained)', 'tuna.*\\boil\\b', 198, 29, 0, 8, 0, 0, 350, { can: 113 }),
  F('tuna', 'Tuna in water (drained)', 'tuna', 116, 25.5, 0, 0.8, 0, 0, 300, { can: 113 }),
  F('salmon', 'Salmon, fresh', 'salmon', 208, 20, 0, 13, 0, 0, 59, { each: 170 }),
  F('chicken-thigh', 'Chicken thigh, boneless skinless', 'chicken thigh', 135, 19, 0, 6, 0, 0, 80, { each: 110 }),
  F('chicken', 'Chicken breast, boneless skinless', 'chicken', 120, 22.5, 0, 2.6, 0, 0, 45, { each: 200 }),
  F('turkey-99', 'Ground turkey, 99% lean', 'turkey.*99|99%.*turkey', 112, 25, 0, 1.5, 0, 0, 55, {}),
  F('turkey-85', 'Ground turkey, 85% lean', 'turkey.*85|85%.*turkey', 213, 17, 0, 15, 0, 0, 70, {}),
  F('turkey', 'Ground turkey, 93% lean', 'turkey', 150, 18.7, 0, 8.3, 0, 0, 70, {}),
  F('shrimp', 'Shrimp, raw', 'shrimp', 85, 20, 0, 0.5, 0, 0, 119, {}),
  F('tofu', 'Tofu, firm', 'tofu', 144, 17, 3, 9, 2.3, 0.6, 14, { package: 397, block: 397 }),
  F('egg-white', 'Egg whites', 'egg white', 52, 11, 0.7, 0.2, 0, 0.7, 166, { cup: 243, each: 33 }),
  F('egg', 'Eggs, large', '\\beggs?\\b', 143, 12.6, 0.7, 9.5, 0, 0.4, 142, { each: 50 }),
  F('yogurt-whole', 'Greek yogurt, whole milk', '(whole|full.?fat).*yogurt|yogurt.*(whole|full.?fat)', 97, 9, 4, 5, 0, 4, 35, { cup: 245 }),
  F('yogurt-2', 'Greek yogurt, 2%', '(2%|low.?fat).*yogurt|yogurt.*(2%|low.?fat)', 73, 9.9, 3.9, 1.9, 0, 3.6, 34, { cup: 245 }),
  F('yogurt', 'Greek yogurt, nonfat', 'yogurt', 59, 10.3, 3.6, 0.4, 0, 3.2, 36, { cup: 245 }),
  F('coconut-milk', 'Coconut milk, light (canned)', 'coconut milk', 60, 0.6, 1.4, 5.8, 0, 1, 15, { can: 400, cup: 240 }),
  F('plant-milk', 'Almond, oat or soy milk, unsweetened', 'almond milk|oat milk|soy milk', 15, 0.6, 0.6, 1.2, 0.2, 0, 70, { cup: 240 }),
  F('milk-skim', 'Milk, skim', '(skim|nonfat|fat.free).*milk', 34, 3.4, 5, 0.1, 0, 5, 42, { cup: 245 }),
  F('milk-whole', 'Milk, whole', 'whole milk', 61, 3.2, 4.8, 3.3, 0, 5, 43, { cup: 244 }),
  F('milk', 'Milk, 2%', '\\bmilk\\b', 50, 3.3, 4.8, 2, 0, 5, 44, { cup: 244 }),
  F('peanut-butter', 'Peanut or almond butter', 'peanut butter|almond butter', 588, 25, 20, 50, 6, 9, 430, { cup: 258 }),
  F('butter', 'Butter, salted', '\\bbutter\\b', 717, 0.9, 0.1, 81, 0, 0.1, 643, { cup: 227 }),
  F('chocolate', 'Chocolate chips, semisweet', 'chocolate', 480, 4.2, 63, 30, 6, 55, 20, { cup: 170 }),
  F('black-beans', 'Black beans, canned (drained)', 'black bean', 120, 7.5, 21, 0.4, 7.5, 0.3, 300, { can: 240, cup: 172 }),
  F('kidney-beans', 'Kidney, pinto or white beans, canned', 'kidney bean|pinto bean|white bean|cannellini', 120, 7.8, 21, 0.5, 6.4, 2, 300, { can: 240, cup: 177 }),
  F('chickpeas', 'Chickpeas, canned (drained)', 'chickpea|garbanzo', 139, 7, 22, 2.5, 6.6, 0.3, 250, { can: 250, cup: 164 }),
  F('lentils', 'Lentils, dry', 'lentil', 358, 24, 63, 2.2, 10.7, 2, 6, { cup: 192 }),
  F('crushed-tomatoes', 'Crushed tomatoes or tomato sauce, canned', 'crushed tomato|tomato sauce|tomato puree', 38, 1.6, 7.3, 0.3, 1.9, 4.4, 180, { can: 794, cup: 245 }),
  F('diced-tomatoes', 'Diced tomatoes, canned', 'diced tomato', 24, 1.1, 4.5, 0.2, 1, 2.7, 120, { can: 411, cup: 240 }),
  F('tomato', 'Tomatoes, fresh', 'tomato', 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, { pint: 300, each: 120, cup: 150 }),
  F('sweet-potato', 'Sweet potato', 'sweet potato', 86, 1.6, 20, 0.1, 3, 4.2, 55, { each: 180 }),
  F('potato', 'Potato', 'potato', 77, 2, 17, 0.1, 2.2, 0.8, 6, { each: 210 }),
  F('carrot', 'Carrots', 'carrot', 41, 0.9, 9.6, 0.2, 2.8, 4.7, 69, { each: 60, cup: 128 }),
  F('pepper', 'Bell pepper', 'bell pepper|jalape', 26, 1, 6, 0.3, 2.1, 4.2, 4, { each: 120, cup: 150 }),
  F('green-onion', 'Green onions', 'green onion|scallion', 32, 1.8, 7.3, 0.2, 2.6, 2.3, 16, { each: 15, bunch: 100 }),
  F('onion', 'Onion', 'onion|shallot', 40, 1.1, 9.3, 0.1, 1.7, 4.2, 4, { each: 150, cup: 160 }),
  F('garlic', 'Garlic', 'garlic', 149, 6.4, 33, 0.5, 2.1, 1, 17, { clove: 3, head: 50 }),
  F('ginger', 'Ginger, fresh', 'ginger', 80, 1.8, 18, 0.8, 2, 1.7, 13, { cup: 96 }),
  F('broccoli', 'Broccoli or cauliflower', 'broccoli|cauliflower', 34, 2.8, 6.6, 0.4, 2.6, 1.7, 33, { head: 300, cup: 91 }),
  F('greens', 'Spinach, kale or lettuce', 'spinach|kale|lettuce|romaine|greens|arugula', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, { cup: 30, bag: 142, head: 450 }),
  F('zucchini', 'Zucchini or summer squash', 'zucchini|squash', 17, 1.2, 3.1, 0.3, 1, 2.5, 8, { each: 200 }),
  F('cucumber', 'Cucumber', 'cucumber', 15, 0.7, 3.6, 0.1, 0.5, 1.7, 2, { each: 300 }),
  F('celery', 'Celery', 'celery', 14, 0.7, 3, 0.2, 1.6, 1.3, 80, { stalk: 40, cup: 101 }),
  F('mushroom', 'Mushrooms', 'mushroom', 22, 3.1, 3.3, 0.3, 1, 2, 5, { cup: 70 }),
  F('green-beans', 'Green beans', 'green bean', 31, 1.8, 7, 0.2, 2.7, 3.3, 6, { cup: 110 }),
  F('cornstarch', 'Cornstarch', 'cornstarch', 381, 0.3, 91, 0.1, 0.9, 0, 9, { cup: 128 }),
  F('corn', 'Corn kernels', '\\bcorn\\b', 88, 3, 20.7, 0.8, 2.4, 3.2, 15, { cup: 140, each: 100 }),
  F('peas', 'Peas or snap peas', 'snap pea|snow pea|\\bpeas\\b', 42, 2.8, 7.6, 0.2, 2.6, 4, 4, { cup: 98 }),
  F('cabbage', 'Cabbage or coleslaw mix', 'coleslaw|cabbage', 25, 1.3, 5.8, 0.1, 2.5, 3.2, 18, { bag: 397, head: 900, cup: 89 }),
  F('herbs', 'Fresh herbs', 'cilantro|parsley|basil|\\bdill\\b|\\bmint\\b|herb', 23, 2.1, 3.7, 0.5, 2.8, 0.9, 46, { bunch: 50, cup: 16 }),
  F('lime', 'Lime', '\\blimes?\\b', 30, 0.7, 10.5, 0.2, 2.8, 1.7, 2, { each: 44 }),
  F('lemon', 'Lemon', 'lemon', 29, 1.1, 9.3, 0.3, 2.8, 2.5, 2, { each: 60 }),
  F('berries', 'Berries', 'berr', 50, 0.8, 12, 0.3, 3, 7, 1, { cup: 145, pint: 300 }),
  F('banana', 'Banana', 'banana', 89, 1.1, 23, 0.3, 2.6, 12.2, 1, { each: 118 }),
  F('grapes', 'Grapes', 'grape', 69, 0.7, 18, 0.2, 0.9, 15.5, 2, { cup: 151 }),
  F('apple', 'Apple', 'apple', 52, 0.3, 14, 0.2, 2.4, 10.4, 1, { each: 180 }),
  F('avocado', 'Avocado', 'avocado', 160, 2, 8.5, 14.7, 6.7, 0.7, 7, { each: 150 }),
  F('hummus', 'Hummus', 'hummus', 166, 7.9, 14.3, 9.6, 6, 0.3, 430, { cup: 246 }),
  F('salsa', 'Salsa', 'salsa', 36, 1.5, 7, 0.2, 1.5, 4, 700, { jar: 454, cup: 260 }),
  F('marinara', 'Marinara sauce', 'marinara|pasta sauce', 50, 1.5, 8, 1.5, 1.8, 5, 400, { jar: 680, cup: 250 }),
  F('pickle', 'Pickles', 'pickle', 12, 0.5, 2.4, 0.2, 1.2, 1.3, 800, { cup: 140, each: 35 }),
  F('oil', 'Olive or other oil', 'olive|\\boil\\b', 884, 0, 0, 100, 0, 0, 2, { cup: 216 }),
  F('soy-sauce', 'Soy sauce', 'soy sauce|tamari', 53, 8, 4.9, 0.6, 0.8, 0.4, 5500, { cup: 255 }),
  F('mustard', 'Mustard', 'mustard|dijon', 66, 4, 5, 4, 3.3, 0.9, 1100, { cup: 250 }),
  F('honey', 'Honey', 'honey', 304, 0.3, 82, 0, 0.2, 82, 4, { cup: 339 }),
  F('syrup', 'Maple syrup', 'maple|syrup', 260, 0, 67, 0.1, 0, 60, 12, { cup: 315 }),
  F('sugar', 'Sugar', 'sugar', 387, 0, 100, 0, 0, 100, 1, { cup: 200 }),
  F('tahini', 'Tahini', 'tahini', 595, 17, 21, 54, 9.3, 0.5, 115, { cup: 240 }),
  F('chia', 'Chia or flax seeds', 'chia|flax', 486, 17, 42, 31, 34, 0, 16, { cup: 192 }),
  F('sesame', 'Sesame seeds', 'sesame seed', 573, 18, 23, 50, 11.8, 0.3, 11, { cup: 144 }),
  F('nuts', 'Nuts (almonds, walnuts, cashews)', 'almond|walnut|pecan|cashew|\\bnuts?\\b', 579, 21, 22, 50, 12.5, 4.4, 1, { cup: 92 }),
  F('granola', 'Granola', 'granola', 470, 10, 64, 20, 7, 25, 100, { cup: 120 }),
  F('crackers', 'Crackers, whole-grain', 'cracker', 440, 9, 68, 15, 6, 10, 750, { box: 255 }),
  F('breadcrumbs', 'Breadcrumbs (panko)', 'crumb|panko', 370, 12, 75, 2.5, 3, 3.5, 200, { cup: 60 }),
  F('tortilla', 'Flour tortillas', 'tortilla|\\bwraps?\\b', 300, 8, 50, 7.5, 3.5, 2.5, 700, { each: 70, package: 560 }),
  F('bread', 'Bread, rolls or pita', 'bread|\\bbuns?\\b|\\brolls?\\b|bagel|pita', 265, 9, 49, 3.2, 2.7, 5, 490, { slice: 30, each: 60 }),
  F('pasta', 'Pasta, dry', 'pasta|noodle|spaghetti|penne', 371, 13, 75, 1.5, 3.2, 2.7, 6, { cup: 100, box: 454 }),
  F('brown-rice', 'Brown rice, dry', 'brown rice', 367, 7.5, 76, 2.7, 3.4, 0.9, 7, { cup: 190 }),
  F('rice', 'White rice, dry', '\\brice\\b', 365, 7.1, 80, 0.7, 1.3, 0.1, 5, { cup: 185 }),
  F('quinoa', 'Quinoa, dry', 'quinoa', 368, 14.1, 64, 6.1, 7, 0, 5, { cup: 170 }),
  F('oats', 'Rolled oats', '\\boats?\\b', 379, 13, 68, 6.5, 10, 1, 6, { cup: 81 }),
  F('flour', 'Flour', 'flour', 364, 10, 76, 1, 2.7, 0.3, 2, { cup: 125 }),
];
const FOOD_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]));
const NOFOOD = { id: 'none', label: 'Don’t count this', skip: true, kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, na: 0, g: {} };
/* Your own foods are saved as their nutrition label (per serving) and turned into per-100 g values here. */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const _myFoods = new WeakMap();
function myFoods() {
  const src = ML().foods; const hit = _myFoods.get(src); if (hit) return hit;
  const out = Object.values(src).filter(x => x && x.name && x.sv && +x.sv.gr > 0).map(x => {
    const gr = +x.sv.gr, lab = x.lab || {}; const o = { id: x.id, label: x.name, mine: true, g: { serving: gr }, sv: x.sv, lab };
    const nm = String(x.name).trim().toLowerCase(); o.re = new RegExp('(^|\\W)' + reEsc(nm.replace(/(e?s)$/, '')) + '(e?s)?(\\W|$)');
    for (const [k] of NUT) o[k] = (+lab[k] || 0) / gr * 100;
    const q = +x.sv.q || 1, u = x.sv.u;
    if (VOL[u]) o.g.cup = gr / (q * VOL[u] / 48); else if (u && !WT[u]) o.g[u === 'piece' ? 'each' : u] = gr / q;
    return o;
  }).sort((a, b) => b.label.length - a.label.length);
  _myFoods.set(src, out); return out;
}
const foodById = id => id === 'none' ? NOFOOD : FOOD_BY_ID[id] || myFoods().find(f => f.id === id) || null;
function foodFor(g) {
  if (g.fk) { const f = foodById(g.fk); if (f) return f; }
  const t = (g.u === 'can' ? 'canned ' : '') + shopName(g.n).toLowerCase();
  return myFoods().find(x => x.re.test(t)) || FOODS.find(x => x.re.test(t)) || null;
}
/* grams of an ingredient line, or null when the amount can't be turned into grams */
function gramsOf(g, food) {
  if (food.skip) return 0;
  if (g.q == null) return food.kcal ? null : 0;
  if (WT[g.u]) return g.q * WT[g.u];
  if (VOL[g.u]) { const c = food.g.cup; return g.q * VOL[g.u] * (c ? c / 48 : 4.93); }
  const per = food.g[g.u || 'each'] || ((!g.u || g.u === 'serving') ? food.g.serving : null); return per ? g.q * per : null;
}
/* Nutrition for a list of ingredient lines, all of it: { kcal, p, c, f, fib, sug, na, missing: [names] } */
function estimateMacros(ing) {
  const t = { missing: [] }; for (const [k] of NUT) t[k] = 0;
  for (const g of ing || []) {
    if (!g || !g.n) continue; const food = foodFor(g); const gr = food ? gramsOf(g, food) : null;
    if (gr == null) { t.missing.push(shopName(g.n)); continue; }
    for (const [k] of NUT) t[k] += food[k] * gr / 100;
  }
  return t;
}
const roundNut = o => { const r = {}; for (const [k] of NUT) r[k] = k === 'na' ? Math.round((o[k] || 0) / 5) * 5 : Math.round(o[k] || 0); return r; };
/* Per serving. Numbers you typed in win; the rest come from the ingredients. */
function macros(r) {
  if (!r) return null;
  const e = estimateMacros(r.ing); const sv = r.serves || 1; const man = r.macros || {}; const raw = {}; let manual = false, est = false;
  for (const [k] of NUT) {
    const typed = man[k] != null && man[k] !== '' ? +man[k] : k === 'p' && r.protein ? +r.protein : null;
    if (typed != null && isFinite(typed)) { raw[k] = typed; manual = true; } else { raw[k] = e[k] / sv; if (MACRO_KEYS.some(x => x[0] === k)) est = true; }
  }
  const counted = (r.ing || []).length - e.missing.length;
  if (!manual && !counted) return null;
  return { ...roundNut(raw), missing: e.missing, manual, est };
}
const macroLine = m => m ? m.kcal + ' kcal · ' + m.p + ' g protein' : '';
const fmtNut = (k, v) => (k === 'na' || k === 'kcal' ? Math.round(v).toLocaleString('en-US') : String(Math.round(v * 10) / 10));
function MacroTiles({ m }) {
  return html`<div class="mac-tiles">${MACRO_KEYS.map(([k, l, u]) => html`<div key=${k} class=${'mac ' + k}><b class="num">${fmtNut(k, m[k])}${u}</b><span>${l}</span></div>`)}</div>`;
}
const ExtraLine = ({ m }) => html`<div class="mac-extra num">${EXTRA_KEYS.map(([k, l, u]) => html`<span key=${k}>${l} <b>${fmtNut(k, m[k] || 0)}${u}</b></span>`)}</div>`;
const per100 = f => f.skip ? 'Counts as nothing, like water or a garnish' : f.mine
  ? Math.round(f.lab.kcal || 0) + ' kcal · ' + (Math.round((+f.lab.p || 0) * 10) / 10) + ' g protein per ' + qtyText(+f.sv.q || 1, f.sv.u === 'piece' ? '' : f.sv.u) + (f.sv.u === 'piece' ? ' piece' : '') + (WT[f.sv.u] ? '' : ' (' + Math.round(f.sv.gr) + ' g)')
  : Math.round(f.kcal) + ' kcal · ' + (Math.round(f.p * 10) / 10) + ' g protein per 100 g';
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
    foods: Object.fromEntries(Object.entries(x.foods && typeof x.foods === 'object' ? x.foods : {}).filter(([, f]) => f && f.name && f.sv && +f.sv.gr > 0)),
    log: Object.fromEntries(Object.entries(x.log && typeof x.log === 'object' ? x.log : {}).map(([d, l]) => [d, (Array.isArray(l) ? l : []).filter(e => e && e.id && e.m && typeof e.m === 'object')]).filter(([d, l]) => /^\d{4}-\d\d-\d\d$/.test(d) && l.length)),
    goals: Object.fromEntries(Object.entries(x.goals && typeof x.goals === 'object' ? x.goals : {}).filter(([k, v]) => NUT.some(n => n[0] === k) && +v > 0).map(([k, v]) => [k, +v])),
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
const MEALS = { mode: ['log', 'plan', 'recipes', 'list'].includes(lsGet('mealsMode')) ? lsGet('mealsMode') : 'plan', q: '', cat: 'all', day: null };
const setMealsMode = m => { MEALS.mode = m; lsSet('mealsMode', m); S.rerender(); scrollTo(0, 0); };
function MStep({ value, min, max, onChange, label, unit, step = 1 }) {
  return html`<div class="mstep" role="group" aria-label=${label}>
    <button aria-label=${'Fewer ' + label} disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - step))}>−</button>
    <span class="v num" aria-live="polite">${step < 1 ? fracStr(value) : value}${unit ? html`<small>${unit}</small>` : null}</span>
    <button aria-label=${'More ' + label} disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + step))}>+</button></div>`;
}
function MealsScreen({ view }) {
  const vt = view && view.type;
  if (vt === 'meal') return html`<${RecipeView} key=${view.id} id=${view.id}/>`;
  if (vt === 'mealEdit') return html`<${RecipeEditor} view=${view}/>`;
  if (vt === 'foods') return html`<${MyFoods}/>`;
  return html`<div><${TopSwitch} value=${MEALS.mode} options=${[['log', 'Log'], ['plan', 'Prep'], ['recipes', 'Recipes'], ['list', 'List']]} onChange=${setMealsMode}/>
    ${MEALS.mode === 'log' ? html`<${LogPane}/>` : MEALS.mode === 'recipes' ? html`<${RecipesPane}/>` : MEALS.mode === 'list' ? html`<${ShopPane}/>` : html`<${PrepPane}/>`}</div>`;
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
    <div class="row" style="margin-top:12px"><button class="btn ghost" style="flex:1" id="new-recipe" onClick=${newRecipe}>${I.plus} New recipe</button><button class="btn ghost" style="flex:1" id="my-foods" onClick=${() => UI.setView({ type: 'foods' })}>My foods</button></div>
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
      <div class="card" id="recipe-macros"><${MacroTiles} m=${m}/><${ExtraLine} m=${m}/>
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
  const [fov, setFov] = useState(() => Object.fromEntries((d0.ing || []).filter(g => g.fk).map(g => [ingKey(g.n), g.fk])));
  const [err, setErr] = useState('');
  const set = (k, v) => setD({ ...d, [k]: v });
  const parsed = ingTxt.split('\n').map(parseIng).filter(Boolean).map(g => { const fk = fov[ingKey(g.n)]; return { ...g, a: ov[ingKey(g.n)] || g.a, ...(fk ? { fk } : {}) }; });
  const pickFood = g => openSheet({ type: 'foodPick', current: g.fk || '', q: shopName(g.n), onPick: id => setFov(o => { const k = ingKey(g.n); const n = { ...o }; if (id) n[k] = id; else delete n[k]; return n; }) });
  const cycle = g => { const k = ingKey(g.n); const i = AISLES.findIndex(a => a[0] === g.a); setOv({ ...ov, [k]: AISLES[(i + 1) % AISLES.length][0] }); };
  const save = () => {
    const name = String(d.name || '').trim(); if (!name) { setErr('Give the recipe a name.'); return; }
    if (!parsed.length) { setErr('Add at least one ingredient.'); return; }
    const isBuiltin = !!MEAL_BUILTIN[d.id];
    const rec = { id: d.id, name, cat: d.cat || 'main', serves: clampInt(d.serves, 1, 99, 4), size: String(d.size || '').trim(), macros: Object.fromEntries(NUT.map(([k]) => [k, d.macros[k]]).filter(([, v]) => v !== '' && v != null && isFinite(+v)).map(([k, v]) => [k, +v])), mins: +d.mins > 0 ? Math.round(+d.mins) : null,
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
    ${parsed.length ? html`<div class="card me-prev"><div class="lbl" style="margin-bottom:2px">How it reads · tap an aisle or a food to change it</div>${parsed.map((g, i) => { const fd = foodFor(g); const gr = fd ? gramsOf(g, fd) : null;
      return html`<div key=${i} class="me-row"><div class="me-top"><span class="q num">${g.q != null ? qtyText(g.q, g.u) : '—'}</span><span class="n">${g.n}</span><button class="chip" onClick=${() => cycle(g)}>${AISLE_NAME[g.a]}</button></div>
        <button class=${'me-food' + (gr == null ? ' miss' : '')} onClick=${() => pickFood(g)}>${!fd ? 'Not counted · choose a food' : fd.skip ? 'Not counted (your choice) · change' : gr == null ? fd.label + ' · add an amount, or change' : fd.label + ' · ' + (!fd.kcal && fd.na ? fmtNut('na', fd.na * gr / 100) + ' mg sodium' : Math.round(fd.kcal * gr / 100) + ' kcal')}${g.fk ? '' : fd && !fd.skip ? ' · change' : ''}</button></div>`; })}</div>` : null}
    ${(() => { const e = estimateMacros(parsed); const sv = clampInt(d.serves, 1, 99, 4); const setM = (k, v) => setD({ ...d, macros: { ...d.macros, [k]: v } });
      return html`<div><div class="lbl">Nutrition per serving</div><div class="me-mac">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'me-m-' + k}>${l}${u ? ' (' + u.trim() + ')' : ''}</label>
        <input class="field" id=${'me-m-' + k} inputmode="decimal" value=${d.macros[k] != null ? d.macros[k] : ''} placeholder=${parsed.length ? fmtNut(k, k === 'na' ? Math.round(e[k] / sv / 5) * 5 : e[k] / sv).replace(',', '') : '—'} onInput=${ev => setM(k, ev.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
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

/* ---- your own foods ---- */
const SV_UNITS = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'scoop', 'slice', 'can', 'package'];
function FoodList({ current, q, onPick, onNew }) {
  const term = q.trim().toLowerCase(); const hit = f => !term || f.label.toLowerCase().includes(term) || f.re.test(term);
  const mine = myFoods().filter(hit); const lib = FOODS.filter(hit).sort((a, b) => a.label.localeCompare(b.label));
  const opt = f => html`<button key=${f.id} class="opt" aria-pressed=${current === f.id} onClick=${() => onPick(f.id)}><div style="flex:1;min-width:0"><div>${f.label}</div><div class="d">${per100(f)}</div></div>${current === f.id ? I.check : null}</button>`;
  return html`<div class="food-list">
    ${!term ? html`<button class="opt" onClick=${() => onPick('')}><div style="flex:1;min-width:0"><div>Match automatically</div><div class="d">Use whatever food the name matches</div></div>${!current ? I.check : null}</button>` : null}
    ${opt(NOFOOD)}
    ${onNew ? html`<button class="btn ghost wide" style="margin:10px 0 2px" id="food-new" onClick=${() => onNew(q)}>${I.plus} New food from a nutrition label</button>` : null}
    ${mine.length ? html`<div class="aisle-h">Your foods</div>${mine.map(opt)}` : null}
    ${lib.length ? html`<div class="aisle-h">Built in</div>${lib.map(opt)}` : null}
    ${!mine.length && !lib.length ? html`<p class="note" style="margin-top:10px">No food matches “${q.trim()}”. Clear the search, or add it from its nutrition label.</p>` : null}
  </div>`;
}
function FoodPickSheet({ current, q, onPick }) {
  const [t, setT] = useState(q || '');
  return html`<${Sheet} label="Choose a food"><h2>Counts as</h2>
    <input class="field" type="search" id="food-q" placeholder="Search foods" value=${t} onInput=${e => setT(e.target.value)} style="margin:8px 0 4px"/>
    <${FoodList} current=${current} q=${t} onPick=${id => { closeSheet(); onPick(id); }} onNew=${name => openSheet({ type: 'foodEdit', name, then: id => onPick(id) })}/><//>`;
}
function FoodEditSheet({ id, name, then }) {
  const f0 = id ? ML().foods[id] : null;
  const [d, setD] = useState(() => f0 ? { name: f0.name, q: fracStr(+f0.sv.q || 1), u: f0.sv.u || 'g', gr: String(f0.sv.gr || ''), ...Object.fromEntries(NUT.map(([k]) => [k, f0.lab && f0.lab[k] != null ? String(f0.lab[k]) : ''])) }
    : { name: name ? String(name).trim().replace(/^./, c => c.toUpperCase()) : '', q: '1', u: 'g', gr: '', ...Object.fromEntries(NUT.map(([k]) => [k, ''])) });
  const [err, setErr] = useState('');
  const set = (k, v) => { setD({ ...d, [k]: v }); setErr(''); };
  const q = numOf(d.q) || 0; const gr = d.u === 'g' ? q : d.u === 'oz' ? q * WT.oz : +d.gr;
  const save = () => {
    const nm = d.name.trim(); if (!nm) return setErr('Give the food a name.');
    if (!(q > 0)) return setErr('Enter the serving size from the label.');
    if (!(gr > 0)) return setErr('Enter how many grams one serving is. It’s next to the serving size on the label.');
    if (d.kcal === '' || !(+d.kcal >= 0)) return setErr('Enter the calories per serving.');
    const fid = id || uid('my-');
    mealCommit(m => { m.foods[fid] = { id: fid, name: nm, sv: { q, u: d.u, gr: Math.round(gr * 10) / 10 }, lab: Object.fromEntries(NUT.filter(([k]) => d[k] !== '' && isFinite(+d[k])).map(([k]) => [k, +d[k]])), updatedAt: Date.now() }; });
    closeSheet(); showToast({ kind: 'info', text: nm + ' saved' }); if (then) then(fid);
  };
  const del = () => { mealCommit(m => { delete m.foods[id]; }); closeSheet(); showToast({ kind: 'info', text: f0.name + ' deleted' }); };
  return html`<${Sheet} label=${id ? 'Edit food' : 'New food'}><h2>${id ? 'Edit food' : 'New food'}</h2>
    <p class="note">Copy the numbers from the nutrition label, per serving.</p>
    <div class="stack" style="margin-top:12px">
      <div><label class="lbl" for="fd-name">Name</label><input class="field" id="fd-name" value=${d.name} placeholder="e.g. Protein bar" onInput=${e => set('name', e.target.value)}/>
        <p class="small muted" style="margin-top:6px">Recipe ingredients and log entries with this name count as this food.</p></div>
      <div><label class="lbl" for="fd-q">Serving size</label><div class="row" style="gap:8px">
        <input class="field" id="fd-q" style="width:70px;text-align:center" inputmode="decimal" value=${d.q} onInput=${e => set('q', e.target.value)}/>
        <select class="field" id="fd-u" style="flex:1;min-width:0" aria-label="Serving unit" value=${d.u} onChange=${e => set('u', e.target.value)}>${SV_UNITS.map(u => html`<option key=${u} value=${u}>${u}</option>`)}</select>
        ${d.u === 'g' || d.u === 'oz' ? null : html`<input class="field" id="fd-gr" style="width:84px;text-align:center" inputmode="decimal" placeholder="grams" aria-label="Grams per serving" value=${d.gr} onInput=${e => set('gr', e.target.value.replace(/[^\d.]/g, ''))}/><span class="small muted">g</span>`}</div></div>
      <div class="me-mac">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'fd-' + k}>${l}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'fd-' + k} inputmode="decimal" value=${d[k]} onInput=${e => set(k, e.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
      ${err ? html`<p class="small down-c" role="alert">${err}</p>` : null}
      <button class="btn primary wide" id="fd-save" onClick=${save}>Save food</button>
      ${id ? html`<button class="btn danger wide" onClick=${del}>Delete food</button>` : null}
      <button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
function MyFoods() {
  const list = myFoods().slice().sort((a, b) => a.label.localeCompare(b.label));
  return html`<div>
    <p class="note" style="margin-top:6px">Foods you add from a nutrition label, like a protein bar or a shake. Recipes and the log count them whenever an ingredient’s name matches, or when you pick them.</p>
    <button class="btn primary wide" id="food-add" style="margin-top:12px" onClick=${() => openSheet({ type: 'foodEdit' })}>${I.plus} New food</button>
    ${list.length ? html`<div class="card shop-card" style="margin-top:12px">${list.map(f => html`<button key=${f.id} class="opt" onClick=${() => openSheet({ type: 'foodEdit', id: f.id })}><div style="flex:1;min-width:0"><div>${f.label}</div><div class="d">${per100(f)}</div></div>${I.edit}</button>`)}</div>`
      : html`<div class="card note" style="margin-top:12px">No foods of your own yet.</div>`}
  </div>`;
}

/* ---- daily log and goals ---- */
const LIMITS = { sug: 1, na: 1 };
const sumNut = list => { const t = {}; for (const [k] of NUT) t[k] = 0; for (const e of list || []) for (const [k] of NUT) t[k] += +(e.m && e.m[k]) || 0; return t; };
const scaleNut = (m, f) => roundNut(Object.fromEntries(NUT.map(([k]) => [k, (+m[k] || 0) * f])));
const logDayName = k => { if (k === ymd(new Date())) return 'Today'; if (k === ymd(addDays(new Date(), -1))) return 'Yesterday'; const d = parseYmd(k); return DOW_FULL[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate(); };
function addLog(day, e) { const entry = { id: uid('l'), at: Date.now(), ...e }; mealCommit(m => { (m.log[day] = m.log[day] || []).push(entry); }); return entry; }
const dropLog = (day, id) => mealCommit(m => { m.log[day] = (m.log[day] || []).filter(x => x.id !== id); if (!m.log[day].length) delete m.log[day]; });
function removeLog(day, id) {
  const gone = (ML().log[day] || []).find(x => x.id === id); if (!gone) return; dropLog(day, id);
  showToast({ kind: 'info', text: 'Removed ' + gone.name, action: 'Undo', ms: 6000, fn: () => mealCommit(m => { (m.log[day] = m.log[day] || []).push(gone); }) });
}
function logRecipe(day, r, sv) { const m1 = macros(r); if (!m1) return null; const { missing, manual, est, ...per } = m1; return addLog(day, { k: 'recipe', r: r.id, name: r.name, sv, m1: per, m: scaleNut(per, sv) }); }
function weekServings(day) { const s = startOfWeek(parseYmd(day)); const out = {}; const L = ML().log; for (let i = 0; i < 7; i++) for (const e of L[ymd(addDays(s, i))] || []) if (e.r) out[e.r] = (out[e.r] || 0) + (+e.sv || 0); return out; }
function GoalBar({ k, label, unit, v, goal }) {
  const lim = LIMITS[k]; const over = v - goal; const pct = Math.min(100, v / goal * 100);
  const note = lim ? (over > 0 ? fmtNut(k, over) + unit + ' over your limit' : fmtNut(k, -over) + unit + ' under your limit') : over >= 0 ? (Math.round(over) ? fmtNut(k, over) + unit + ' past your goal' : 'Goal reached') : fmtNut(k, -over) + unit + ' to go';
  return html`<div class="goal-row"><div class="row" style="gap:8px"><span class="gl">${label}${lim ? ' (limit)' : ''}</span><span class="gv num"><b>${fmtNut(k, v)}</b> / ${fmtNut(k, goal)}${unit}</span></div>
    <div class=${'goal-bar' + (lim && over > 0 ? ' over' : '')} role="progressbar" aria-label=${label} aria-valuenow=${Math.round(v)} aria-valuemin="0" aria-valuemax=${goal}><i style=${{ width: pct + '%' }}></i></div>
    <div class="small muted num">${note}</div></div>`;
}
function LogPane() {
  const m = ML(); const today = ymd(new Date()); const day = MEALS.day && MEALS.day < today ? MEALS.day : today;
  const go = n => { const d = ymd(addDays(parseYmd(day), n)); MEALS.day = d >= today ? null : d; S.rerender(); };
  const list = (m.log[day] || []).slice().sort((a, b) => a.at - b.at); const tot = sumNut(list); const G = m.goals;
  const gk = NUT.filter(([k]) => G[k]); const rest = NUT.filter(([k]) => !G[k]);
  const prep = m.plan.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r && macros(x.r)); const wk = weekServings(day);
  const quick = r => { const e = logRecipe(day, r, 1); if (e) showToast({ kind: 'info', text: '1 serving of ' + r.name + ' logged', action: 'Undo', ms: 5000, fn: () => dropLog(day, e.id) }); };
  return html`<div>
    <div class="day-nav"><button class="pill-btn" aria-label="Previous day" onClick=${() => go(-1)}>${I.back}</button><div class="t" aria-live="polite">${logDayName(day)}</div>
      <button class="pill-btn flip" aria-label="Next day" disabled=${day === today} onClick=${() => go(1)}>${I.back}</button></div>
    <div class="card" id="log-totals">
      ${gk.length ? html`<div class="stack" style="gap:14px">${gk.map(([k, l, u]) => html`<${GoalBar} key=${k} k=${k} label=${l} unit=${u} v=${tot[k]} goal=${G[k]}/>`)}</div>
        ${rest.length ? html`<div class="mac-extra num">${rest.map(([k, l, u]) => html`<span key=${k}>${l} <b>${fmtNut(k, tot[k])}${u}</b></span>`)}</div>` : null}`
      : html`<${MacroTiles} m=${tot}/><${ExtraLine} m=${tot}/>`}
      <button class="btn text" id="log-goals" style="padding-left:0" onClick=${() => openSheet({ type: 'mealGoals' })}>${gk.length ? 'Change goals' : 'Set daily goals'}</button></div>
    <button class="btn primary wide" id="log-add" style="margin-top:12px" onClick=${() => openSheet({ type: 'mealLog', day })}>${I.plus} Log food</button>
    ${prep.length ? html`<div class="section-h"><h2>From your prep</h2><span class="aside">Tap to log a serving</span></div>
      <div class="stack">${prep.map(({ it, r }) => { const n = wk[r.id] || 0; return html`<button key=${r.id} class="day-btn prep-log" aria-label=${'Log a serving of ' + r.name} onClick=${() => quick(r)}><div style="min-width:0"><div class="t">${r.name}</div>
        <div class="s num">${n ? fracStr(n) + ' of ' + it.n + ' this week' : it.n + ' planned this week'} · ${macroLine(macros(r))}</div></div><span class="go">${I.plus}</span></button>`; })}</div>` : null}
    <div class="section-h"><h2>${day === today ? 'Eaten today' : 'Eaten'}</h2>${list.length ? html`<span class="aside num">${list.length} item${list.length === 1 ? '' : 's'}</span>` : null}</div>
    ${list.length ? html`<div class="card shop-card">${list.map(e => html`<button key=${e.id} class="opt log-row" onClick=${() => openSheet({ type: 'logEntry', day, id: e.id })}><div style="flex:1;min-width:0"><div>${e.name}</div>
        <div class="d num">${e.k === 'recipe' ? fracStr(e.sv) + ' serving' + (e.sv > 1 ? 's' : '') + ' · ' : e.txt ? e.txt + ' · ' : ''}${fmtNut('kcal', e.m.kcal)} kcal · ${Math.round(e.m.p)} g protein</div></div></button>`)}</div>`
      : html`<div class="card note">Nothing logged ${day === today ? 'yet today' : 'on this day'}. ${prep.length ? 'Tap a prepped meal above to log a serving, or use Log food for anything else.' : 'Use Log food to add a meal or snack.'}</div>`}
    <p class="small faint" style="margin-top:14px">Numbers are estimates from typical nutrition values, for planning. Not medical or diet advice.</p>
  </div>`;
}
function MealLogSheet({ day, tab: tab0, txt, fk }) {
  const [tab, setTab] = useState(tab0 || 'recipe');
  return html`<${Sheet} label="Log food"><h2>Log food</h2><p class="note">${logDayName(day)}</p>
    <div class="seg wide" role="group" aria-label="What to log" style="margin:10px 0 12px">${[['recipe', 'Recipe'], ['food', 'Food'], ['num', 'Numbers']].map(([k, l]) => html`<button key=${k} class=${tab === k ? 'on' : ''} aria-pressed=${tab === k} onClick=${() => setTab(k)}>${l}</button>`)}</div>
    ${tab === 'food' ? html`<${LogFood} day=${day} txt0=${txt} fk0=${fk}/>` : tab === 'num' ? html`<${LogNumbers} day=${day}/>` : html`<${LogRecipe} day=${day}/>`}<//>`;
}
function LogRecipe({ day }) {
  const [sel, setSel] = useState(null); const [sv, setSv] = useState(1); const [q, setQ] = useState('');
  const inPrep = new Set(ML().plan.items.map(i => i.r)); const term = q.trim().toLowerCase();
  const r = sel && getRecipe(sel); const m = r && macros(r);
  if (r && m) return html`<div class="stack">
    <div class="row"><div style="flex:1;min-width:0"><div style="font-weight:700">${r.name}</div><div class="small muted">${r.size ? 'A serving is ' + r.size : 'The recipe makes ' + r.serves}</div></div><button class="btn text" onClick=${() => setSel(null)}>Change</button></div>
    <div class="row"><span style="flex:1;font-weight:600">Servings</span><${MStep} label="servings eaten" value=${sv} min=${0.5} max=${10} step=${0.5} onChange=${setSv}/></div>
    <${MacroTiles} m=${scaleNut(m, sv)}/>
    <button class="btn primary wide" id="log-save" onClick=${() => { logRecipe(day, r, sv); closeSheet(); showToast({ kind: 'info', text: r.name + ' logged' }); }}>Log it</button></div>`;
  const list = allRecipes().filter(x => macros(x) && (!term || x.name.toLowerCase().includes(term))).sort((a, b) => (inPrep.has(b.id) ? 1 : 0) - (inPrep.has(a.id) ? 1 : 0));
  return html`<div><input class="field" type="search" id="lr-q" placeholder="Search recipes" value=${q} onInput=${e => setQ(e.target.value)}/>
    <div class="food-list">${list.map(x => html`<button key=${x.id} class="opt" onClick=${() => { setSel(x.id); setSv(1); }}><div style="flex:1;min-width:0"><div>${x.name}</div><div class="d">${inPrep.has(x.id) ? 'In your prep · ' : ''}${macroLine(macros(x))} a serving</div></div></button>`)}
      ${!list.length ? html`<p class="note" style="margin-top:10px">No recipe matches.</p>` : null}</div></div>`;
}
function LogFood({ day, txt0, fk0 }) {
  const [txt, setTxt] = useState(txt0 || ''); const [fk, setFk] = useState(fk0 || ''); const [pick, setPick] = useState(false); const [pq, setPq] = useState('');
  const g0 = parseIng(txt); const g = g0 && fk ? { ...g0, fk } : g0;
  const fd = g && foodFor(g); const gr = fd && !fd.skip ? gramsOf(g, fd) : null;
  const m = gr != null ? roundNut(Object.fromEntries(NUT.map(([k]) => [k, fd[k] * gr / 100]))) : null;
  const save = () => { const nm = shopName(g.n); addLog(day, { k: 'food', name: nm.replace(/^./, c => c.toUpperCase()), txt: g.q != null ? qtyText(g.q, g.u) : '', fk: fd.id, m }); closeSheet(); showToast({ kind: 'info', text: nm + ' logged' }); };
  if (pick) return html`<div><div class="row"><input class="field" type="search" id="lf-q" placeholder="Search foods" value=${pq} onInput=${e => setPq(e.target.value)}/><button class="btn text" onClick=${() => setPick(false)}>Back</button></div>
    <${FoodList} current=${fk} q=${pq} onPick=${id => { setFk(id); setPick(false); }} onNew=${name => openSheet({ type: 'foodEdit', name: name || (g && shopName(g.n)), then: id => openSheet({ type: 'mealLog', day, tab: 'food', txt, fk: id }) })}/></div>`;
  return html`<div class="stack">
    <div><label class="lbl" for="lf-txt">What did you eat?</label><input class="field" id="lf-txt" placeholder="e.g. 1 cup Greek yogurt" value=${txt} onInput=${e => setTxt(e.target.value)}/>
      <p class="small muted" style="margin-top:6px">Amount first: 2 eggs, 150 g chicken, 1 banana. For your own foods, “1 serving protein bar” works.</p></div>
    ${g ? html`<button class=${'me-food' + (m ? '' : ' miss')} id="lf-food" onClick=${() => { setPq(''); setPick(true); }}>${!fd ? 'No match · choose a food' : fd.skip ? 'Not counted · change' : m ? 'Counts as ' + fd.label + ' · change' : fd.label + ' · add an amount like 150 g or 1 cup'}</button>` : null}
    ${m ? html`<${MacroTiles} m=${m}/>` : null}
    <button class="btn primary wide" id="lf-save" disabled=${!m} onClick=${save}>Log it</button></div>`;
}
function LogNumbers({ day }) {
  const [d, setD] = useState({ name: '' }); const set = (k, v) => setD({ ...d, [k]: v });
  const ok = NUT.some(([k]) => +d[k] > 0);
  const save = () => { addLog(day, { k: 'num', name: d.name.trim() || 'Quick add', m: roundNut(Object.fromEntries(NUT.map(([k]) => [k, +d[k] || 0]))) }); closeSheet(); showToast({ kind: 'info', text: 'Logged' }); };
  return html`<div class="stack"><div><label class="lbl" for="ln-name">Name</label><input class="field" id="ln-name" placeholder="e.g. Lunch out" value=${d.name} onInput=${e => set('name', e.target.value)}/></div>
    <div class="me-mac">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'ln-' + k}>${l}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'ln-' + k} inputmode="decimal" value=${d[k] || ''} onInput=${e => set(k, e.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
    <button class="btn primary wide" id="ln-save" disabled=${!ok} onClick=${save}>Log it</button></div>`;
}
function LogEntrySheet({ day, id }) {
  const e = (ML().log[day] || []).find(x => x.id === id); if (!e) return null;
  const setSv = v => mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === id); if (!x) return; x.m = x.m1 ? scaleNut(x.m1, v) : scaleNut(x.m, v / (x.sv || 1)); x.sv = v; });
  return html`<${Sheet} label=${e.name}><h2>${e.name}</h2><p class="note">${logDayName(day)}${e.txt ? ' · ' + e.txt : ''}</p>
    ${e.k === 'recipe' ? html`<div class="row" style="margin-top:12px"><span style="flex:1;font-weight:600">Servings</span><${MStep} label="servings eaten" value=${e.sv} min=${0.5} max=${10} step=${0.5} onChange=${setSv}/></div>` : null}
    <div style="margin-top:12px"><${MacroTiles} m=${e.m}/><${ExtraLine} m=${e.m}/></div>
    <div class="stack" style="margin-top:14px"><button class="btn danger wide" id="le-del" onClick=${() => { closeSheet(); removeLog(day, id); }}>Remove</button><button class="btn wide" onClick=${closeSheet}>Done</button></div><//>`;
}
function GoalsSheet() {
  const G = ML().goals; const [d, setD] = useState(() => Object.fromEntries(NUT.map(([k]) => [k, G[k] != null ? String(G[k]) : ''])));
  const save = () => { mealCommit(m => { m.goals = Object.fromEntries(NUT.filter(([k]) => +d[k] > 0).map(([k]) => [k, +d[k]])); }); closeSheet(); };
  return html`<${Sheet} label="Daily goals"><h2>Daily goals</h2><p class="note">Fill in only what you want to track. Sugar and sodium are limits to stay under.</p>
    <div class="me-mac" style="margin-top:12px">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'goal-' + k}>${l}${LIMITS[k] ? ' max' : ''}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'goal-' + k} inputmode="numeric" value=${d[k]} onInput=${e => setD({ ...d, [k]: e.target.value.replace(/\D/g, '') })}/></div>`)}</div>
    <p class="small faint" style="margin-top:10px">Your own targets, for planning. Not medical or diet advice.</p>
    <div class="stack" style="margin-top:12px"><button class="btn primary wide" id="goal-save" onClick=${save}>Save goals</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
/* Stats → Overall: the last 7 days of logged food */
function NutritionStatsCard() {
  const L = ML().log; if (!Object.keys(L).length) return null;
  const met = lsGet('statsNut') === 'kcal' ? 'kcal' : 'p'; const G = ML().goals;
  const d0 = addDays(startOfDay(new Date()), -6); const days = [];
  for (let i = 0; i < 7; i++) { const t = addDays(d0, i); const l = L[ymd(t)] || []; days.push({ t: +t, l, s: sumNut(l) }); }
  const had = days.filter(x => x.l.length); const avg = k => had.length ? had.reduce((a, x) => a + x.s[k], 0) / had.length : 0;
  return html`<div id="nutrition-stats"><div class="section-h"><h2>Nutrition</h2><span class="aside">Last 7 days</span></div>
    <div class="kpis kpis3">${kpi(fmtNut('kcal', avg('kcal')), 'Avg calories')}${kpi(Math.round(avg('p')) + ' g', 'Avg protein')}${kpi(had.length + ' of 7', 'Days logged')}</div>
    <div class="card" style="margin-top:8px"><div class="seg wide">${[['p', 'Protein'], ['kcal', 'Calories']].map(([k, l]) => html`<button key=${k} class=${met === k ? 'on' : ''} aria-pressed=${met === k} onClick=${() => { lsSet('statsNut', k); S.rerender(); }}>${l}</button>`)}</div>
      <${BarChart} data=${days.map(x => ({ t: x.t, v: x.s[met] }))} fmtV=${v => fmtNut(met, v)} unit=${met === 'p' ? 'g protein' : 'calories'} daily=${true}/>
      <p class="small muted">${G[met] ? 'Your goal is ' + fmtNut(met, G[met]) + (met === 'p' ? ' g' : ' kcal') + ' a day. ' : ''}Averages count only days with something logged.</p></div></div>`;
}
