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
  /* noAuto: in Recipes to look up and add yourself, but never picked for a meal plan (Nov 11, Newt) */
  { id: 'm-turkey-chili', name: 'Turkey & Bean Chili', cat: 'main', serves: 8, size: '1½ cups', mins: 50, keeps: 4, freezes: true, week: 3, noAuto: true,
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
  { id: 'p-mix', name: 'Mix & Match Week', d: 'Three bases, eight flavors: one chicken batch split two ways, turkey tacos, two kinds of rice and two vegetable trays.', items: [['b-chicken~teriyaki', 3], ['b-chicken~shawarma', 3], ['b-turkey~taco', 3], ['b-rice~sesame-rice', 3], ['b-rice~cilantro-lime', 3], ['b-veg~sesame-ginger', 3], ['b-veg~zaatar', 3], ['b-eggs~southwest', 5], ['b-oats~pb-banana', 5]] },
  { id: 'p-freezer', name: 'Freezer Stock-Up', d: 'Big batches that freeze well. Portion them, freeze, and pull a few out each week.', items: [['m-sc-salsa-chicken', 4], ['m-meatballs', 3], ['m-salmon-patties', 2], ['m-curry', 3], ['m-breakfast-burritos', 4]] },
];

/* ---- Whole-food prep and four bowl weeks (Oct 26, from the Meal prep chat's plan) ----
   One Sunday prep built on broth, a turkey crumble with a little liver, chicken thighs, beans and rice cooked in broth,
   two vegetable trays, egg muffins, kefir oats and sauces; then a four-week bowl rotation (Levant, Korea & Japan,
   Latin, Southern): each week two proteins, two bases, two vegetable trays and two sauces, built into a different bowl
   every day. No beef, pork or cheese, like the rest. */
const WF_THIGHS = (id, name, rubIng, rubTxt, note) => ({ id, name, cat: 'base', serves: 8, size: '4 oz cooked', mins: 35, keeps: 4, freezes: true, week: 4,
  ing: ['3 lb boneless skinless chicken thighs', '2 tbsp olive oil', ...rubIng, '1 tsp salt'],
  steps: ['Heat the oven to 425°F (220°C). Pat the thighs dry.', 'Toss the thighs with the oil, salt and ' + rubTxt + '.', 'Spread on a sheet pan in one layer and roast 25–30 minutes, until 175°F (80°C) inside.', 'Rest 5 minutes, then slice. Freeze half and move it to the fridge Wednesday night.'],
  note: note || 'Thighs stay juicy through reheating better than breast.' });
const WF_LIVER_NOTE = 'About 1 part liver to 8 parts turkey: the liver adds iron, B12 and vitamin A without tasting like liver. Liver is very high in vitamin A, so keep this to 2–3 servings a week, and skip the liver if you’re pregnant.';
const WF_CRUMBLE = (id, name, spiceIng, spiceTxt) => ({ id, name, cat: 'base', serves: 8, size: '⅔ cup', mins: 25, keeps: 4, freezes: true, week: 3,
  ing: ['4 oz chicken livers', '2 lb ground turkey (93% lean)', '1 yellow onion, diced', '4 cloves garlic, minced', '1 tbsp olive oil', ...spiceIng, '1 tsp salt'],
  steps: ['Blend the chicken livers until smooth.', 'Soften the onion in the oil over medium heat, about 5 minutes. Add the garlic for 1 minute.', 'Add the turkey and the blended liver and brown, breaking it up, 8–10 minutes until no pink remains.', 'Stir in ' + spiceTxt + ' for the last 2 minutes and season with the salt.', 'Freeze half and move it to the fridge Wednesday night.'],
  note: WF_LIVER_NOTE });
const WF_SAUCE = (id, name, ing, steps, keeps, note) => ({ id, name, cat: 'base', serves: 8, size: '2 tbsp', mins: 10, keeps: keeps || 6, freezes: false, week: 8, ing, steps, note: note || '' });
const WF_VEG = (id, name, ing, steps, note) => ({ id, name, cat: 'base', serves: 6, size: '1 cup', mins: 35, keeps: 4, freezes: false, week: 6, ing, steps, note: note || '' });
MEAL_LIB.push(
  { id: 'm-bone-broth', name: 'Chicken Bone Broth', cat: 'base', serves: 8, size: '1 cup', mins: 20, keeps: 5, freezes: true, week: 8,
    ing: ['3 lb chicken backs or wings', '1 yellow onion, quartered', '2 carrots, chopped', '2 celery stalks, chopped', '2 tbsp apple cider vinegar', '1 bay leaf', '1 tsp salt'],
    steps: ['Saturday night, put everything in a slow cooker and cover with water, about 12 cups.', 'Cook on low 12–24 hours.', 'Strain, chill, then lift off the fat.', 'Use it to cook rice, beans and lentils, or sip a mug in the evening. Freeze extra in 1–2 cup portions.'],
    note: 'Chicken feet make the most gelatin. Nutrition is an estimate for the strained broth.', macros: { kcal: 40, p: 9, c: 1, f: 1, fib: 0, sug: 0, na: 300 } },
  WF_CRUMBLE('m-liver-crumble', 'Turkey-Liver Crumble', ['2 tsp ground cumin', '2 tsp smoked paprika', '½ tsp black pepper'], 'the cumin, paprika and pepper'),
  WF_THIGHS('m-thighs', 'Sheet-Pan Chicken Thighs', ['1 lemon', '2 tbsp za’atar'], 'the zest and juice of the lemon and the za’atar (or any spice rub)'),
  { id: 'm-broth-rice', name: 'Brown Rice in Broth', cat: 'base', serves: 6, size: '1 cup', mins: 50, keeps: 5, freezes: true, week: 6,
    ing: ['2 cups brown rice', '4 cups chicken broth', '½ tsp salt'],
    steps: ['Rinse the rice. Bring the broth and salt to a boil.', 'Add the rice, cover and simmer on low 40–45 minutes, until the broth is absorbed.', 'Rest 10 minutes covered, fluff, and cool before packing.'],
    note: 'Cooked and cooled rice has a little more resistant starch, which feeds gut bacteria.' },
  { id: 'm-broth-beans', name: 'Beans in Broth (from dry)', cat: 'base', serves: 8, size: '¾ cup', mins: 90, keeps: 5, freezes: true, week: 4,
    ing: ['1 lb dry black beans or chickpeas', '6 cups chicken broth', '1 bay leaf', '1 tsp salt'],
    steps: ['Saturday night, soak the beans in plenty of water with a spoon of salt.', 'Drain and rinse. Simmer in the broth with the bay leaf, partly covered, 1–1½ hours until tender, adding water if needed.', 'Season with the salt and cool in their liquid.'],
    note: 'Soaking shortens the cooking and makes beans easier on the gut. Freeze extra in their liquid.' },
  { id: 'm-lentils', name: 'Lentils in Broth', cat: 'base', serves: 6, size: '¾ cup', mins: 30, keeps: 5, freezes: true, week: 4,
    ing: ['1½ cups dry green or brown lentils', '4 cups chicken broth', '1 bay leaf', '½ tsp salt'],
    steps: ['Rinse the lentils.', 'Simmer in the broth with the bay leaf 20–25 minutes, until tender but not mushy.', 'Drain any extra broth, season and cool.'] },
  { id: 'm-farro', name: 'Batch Farro', cat: 'base', serves: 6, size: '¾ cup', mins: 35, keeps: 5, freezes: true, week: 6,
    ing: ['2 cups farro', '6 cups chicken broth', '½ tsp salt'],
    steps: ['Rinse the farro. Simmer in the broth, uncovered, 25–30 minutes until chewy-tender.', 'Drain, season and cool.'] },
  { id: 'm-bep', name: 'Black-Eyed Peas', cat: 'base', serves: 6, size: '¾ cup', mins: 15, keeps: 5, freezes: true, week: 4,
    ing: ['3 cans black-eyed peas (15 oz), rinsed', '½ yellow onion, diced', '2 cloves garlic, minced', '1 tbsp olive oil', '1 cup chicken broth', '½ tsp smoked paprika', '½ tsp salt'],
    steps: ['Soften the onion in the oil, then add the garlic and paprika for 1 minute.', 'Add the peas and broth and simmer 8–10 minutes.', 'Season with the salt.'] },
  WF_VEG('m-sheet-veg', 'Sheet-Pan Vegetables & Sweet Potatoes', ['1 head broccoli, cut into florets', '1 lb Brussels sprouts, halved', '4 carrots, sliced', '1 red onion, cut into wedges', '3 sweet potatoes, cubed', '3 tbsp olive oil', '1 tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss the green vegetables, carrots and onion with half the oil and salt on one pan, and the sweet potatoes with the rest on another.', 'Roast 30–35 minutes, stirring once.']),
  WF_VEG('m-roast-cauli', 'Roasted Cauliflower & Carrots', ['1 head cauliflower, cut into florets', '1 lb carrots, sliced', '3 tbsp olive oil', '1 tsp ground cumin', '1 tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss everything together and spread over two sheet pans.', 'Roast 30 minutes, stirring once, until browned at the edges.']),
  WF_VEG('m-cuke-salad', 'Cucumber, Tomato & Parsley Salad', ['2 cucumbers, diced', '1 pint cherry tomatoes, halved', '1 cup fresh parsley, chopped', '½ red onion, diced', '1 lemon', '2 tbsp olive oil', '½ tsp salt'],
    ['Toss the cucumber, tomatoes, parsley and onion.', 'Dress with the lemon juice, oil and salt when you eat, so it stays crisp.'], 'Keeps 3 days undressed.'),
  WF_VEG('m-roast-sweet-potato', 'Roasted Sweet Potatoes', ['4 sweet potatoes, cubed', '2 tbsp olive oil', '1 tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss the cubes with the oil and salt and roast 30–35 minutes, turning once.']),
  WF_VEG('m-roast-broccoli', 'Roasted Broccoli', ['2 heads broccoli, cut into florets', '2 tbsp olive oil', '2 cloves garlic, minced', '½ tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss everything together and roast 18–22 minutes, until the edges char.']),
  WF_VEG('m-slaw-asian', 'Cabbage & Carrot Slaw', ['½ head green cabbage, shredded', '3 carrots, shredded', '2 green onions, sliced', '2 tbsp rice vinegar', '1 tbsp sesame oil', '1 tsp honey', '½ tsp salt'],
    ['Toss the vegetables.', 'Whisk the vinegar, oil, honey and salt, and toss with the slaw.'], 'Keeps 4 days; it softens a little each day.'),
  WF_VEG('m-roast-peppers', 'Roasted Peppers & Onions', ['4 bell peppers, sliced', '2 yellow onions, sliced', '2 tbsp olive oil', '1 tsp ground cumin', '½ tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss everything together and roast 25 minutes, stirring once.']),
  WF_VEG('m-slaw-lime', 'Lime Cabbage Slaw', ['½ head green cabbage, shredded', '½ red onion, sliced thin', '½ cup fresh cilantro, chopped', '2 limes', '1 tbsp olive oil', '½ tsp salt'],
    ['Toss the cabbage, onion and cilantro.', 'Dress with the lime juice, oil and salt.']),
  WF_VEG('m-collards', 'Garlicky Collards', ['2 bunches collard greens, stems removed, sliced', '4 cloves garlic, sliced', '2 tbsp olive oil', '1 cup chicken broth', '1 tbsp apple cider vinegar', '½ tsp salt'],
    ['Warm the oil and garlic in a big pot for 1 minute.', 'Add the collards and broth, cover, and simmer 15–20 minutes until tender.', 'Finish with the vinegar and salt.']),
  WF_VEG('m-butternut', 'Roasted Butternut Squash', ['1 butternut squash, peeled and cubed', '2 tbsp olive oil', '½ tsp smoked paprika', '½ tsp salt'],
    ['Heat the oven to 425°F (220°C).', 'Toss everything together and roast 30–35 minutes, turning once.']),
  { id: 'm-soaked-oats', name: 'Kefir Soaked Oats', cat: 'breakfast', serves: 4, size: '1 jar', mins: 10, keeps: 4, freezes: false, week: 4,
    ing: ['2 cups rolled oats', '3 cups plain kefir', '4 tbsp chia seeds', '4 tbsp ground flaxseed', '2 cups mixed berries', '2 tbsp honey'],
    steps: ['Mix the oats, kefir, chia and flax and divide between four jars.', 'Top with berries and a drizzle of honey.', 'Refrigerate overnight. Eat cold.'],
    note: 'Plain yogurt works instead of kefir.' },
  WF_SAUCE('m-sauce-tahini', 'Tahini-Lemon Sauce', ['½ cup tahini', '1 lemon', '1 clove garlic, grated', '½ tsp salt'], ['Whisk the tahini, lemon juice, garlic and salt.', 'Whisk in about ⅓ cup water, a little at a time, until it pours.'], 7),
  WF_SAUCE('m-sauce-garlic-yogurt', 'Garlic Yogurt Sauce', ['1 cup plain Greek yogurt', '1 clove garlic, grated', '½ lemon', '1 tbsp fresh dill, chopped', '¼ tsp salt'], ['Stir everything together.'], 5),
  WF_SAUCE('m-sauce-gochujang', 'Gochujang-Miso Sauce', ['2 tbsp gochujang', '2 tbsp white miso', '1 tbsp rice vinegar', '1 tbsp sesame oil', '1 tsp honey'], ['Whisk everything with about 3 tbsp water until smooth.'], 7),
  WF_SAUCE('m-sauce-peanut', 'Peanut-Ginger Sauce', ['⅓ cup peanut butter', '2 tbsp tamari', '1 lime', '1 tbsp fresh ginger, grated', '1 clove garlic, grated'], ['Whisk everything, adding warm water (about ¼ cup) until it pours.'], 6),
  WF_SAUCE('m-sauce-verde', 'Salsa Verde', ['1 lb tomatillos, husked', '1 jalapeño', '½ yellow onion', '1 cup fresh cilantro', '1 lime', '½ tsp salt'], ['Roast the tomatillos, jalapeño and onion at 450°F (230°C) for 15 minutes, until blistered.', 'Blend with the cilantro, lime juice and salt.'], 6, 'Makes about 2 cups; a serving is ¼ cup.'),
  WF_SAUCE('m-sauce-chipotle', 'Chipotle Yogurt Sauce', ['1 cup plain Greek yogurt', '2 chipotle peppers in adobo, minced', '1 lime', '¼ tsp salt'], ['Stir everything together. Add more chipotle for heat.'], 5),
  WF_SAUCE('m-sauce-ranch', 'Herb Yogurt Ranch', ['1 cup plain Greek yogurt', '1 tbsp fresh dill, chopped', '1 tbsp fresh chives, chopped', '1 tbsp fresh parsley, chopped', '1 clove garlic, grated', '½ lemon', '¼ tsp black pepper', '¼ tsp salt'], ['Stir everything together. Thin with kefir or water if you like.'], 5),
  WF_SAUCE('m-sauce-hothoney', 'Hot Honey Vinaigrette', ['3 tbsp hot sauce', '2 tbsp apple cider vinegar', '1 tbsp honey', '3 tbsp olive oil'], ['Shake everything in a jar.'], 7),
  WF_THIGHS('m-thighs-zaatar', 'Za’atar Lemon Chicken Thighs', ['2 lemons', '2 tbsp za’atar', '3 cloves garlic, minced'], 'the zest and juice of the lemons, the za’atar and the garlic'),
  WF_CRUMBLE('m-crumble-levant', 'Cumin-Allspice Turkey-Liver Crumble', ['2 tsp ground cumin', '1 tsp ground allspice', '½ tsp ground cinnamon'], 'the cumin, allspice and cinnamon'),
  WF_THIGHS('m-thighs-gochujang', 'Gochujang Chicken Thighs', ['3 tbsp gochujang', '1 tbsp honey', '1 tbsp soy sauce', '1 tbsp sesame oil', '2 cloves garlic, minced'], 'the gochujang, honey, soy sauce, sesame oil and garlic, stirred together'),
  WF_CRUMBLE('m-crumble-ginger', 'Ginger-Garlic Turkey-Liver Crumble', ['2 tbsp fresh ginger, grated', '2 tbsp tamari', '1 tsp sesame oil', '3 green onions, sliced'], 'the ginger, tamari, sesame oil and green onions'),
  WF_THIGHS('m-thighs-chili-lime', 'Chili-Lime Chicken Thighs', ['2 limes', '2 tsp chili powder', '1 tsp ground cumin', '3 cloves garlic, minced'], 'the zest and juice of the limes, the chili powder, cumin and garlic'),
  WF_CRUMBLE('m-crumble-taco', 'Taco-Spiced Turkey-Liver Crumble', ['1 tbsp chili powder', '2 tsp ground cumin', '1 tsp smoked paprika', '1 tsp dried oregano'], 'the chili powder, cumin, paprika and oregano'),
  WF_THIGHS('m-thighs-paprika', 'Smoked-Paprika Chicken Thighs', ['1 tbsp smoked paprika', '1 tsp garlic powder', '1 tsp onion powder', '¼ tsp cayenne'], 'the paprika, garlic powder, onion powder and cayenne'),
  WF_CRUMBLE('m-crumble-sage', 'Sage & Black Pepper Turkey-Liver Crumble', ['1 tbsp dried sage', '1 tsp black pepper', '½ tsp dried thyme'], 'the sage, pepper and thyme'),
  { id: 'm-ginger-cubes', name: 'Ginger-Turmeric Morning Cubes', cat: 'snack', serves: 26, size: '1 cube in ½ cup hot water', mins: 20, keeps: 90, freezes: true, week: 7,
    ing: ['8 oz fresh ginger, chopped', '3 oz fresh turmeric, chopped', '3 lemons', '1 tsp black pepper', '2 tbsp olive oil', '¼ cup apple cider vinegar', '2 tsp ground cinnamon', '¼ tsp cayenne'],
    steps: ['Blend everything (juice of 3 lemons, zest of 1) with 1 cup water or coconut water on high 60–90 seconds until smooth. Don’t strain.', 'Pour into a 1 oz silicone ice-cube tray and freeze overnight, then store the cubes in a freezer bag up to 3 months.', 'Each morning, pour ½ cup just-boiled water over one cube and stir until it melts. Stir again before drinking.', 'Rinse your mouth with water afterward and wait 30 minutes before brushing; the lemon and vinegar are acidic.'],
    note: 'Start with half a cube. Check with a doctor first if you take blood thinners or diabetes medicine, have gallstones or bad reflux, or have surgery coming up. A habit, not a treatment.' },
);
const WF_BOWL = 'Build each bowl: 2 palms of protein, 1–2 cupped hands of a base (2 on lift and run days), 2 fists of vegetables, 2 tbsp of sauce, a forkful of sauerkraut or kimchi, a small handful of crunch (pumpkin seeds, sesame, roasted chickpeas) and a squeeze of lemon or lime.';
MEAL_PREPS.push(
  { id: 'p-wholefood', name: 'Whole-Food Sunday Prep', d: 'Bone broth (start it Saturday night), a turkey crumble with a little liver blended in, chicken thighs, beans and brown rice cooked in the broth, two vegetable trays, egg muffins, kefir oats and two sauces. Buy raw sauerkraut or kimchi from the refrigerated aisle.',
    items: [['m-bone-broth', 5], ['m-liver-crumble', 3], ['m-thighs', 4], ['m-broth-beans', 4], ['m-broth-rice', 5], ['m-sheet-veg', 6], ['m-egg-muffins', 5], ['m-soaked-oats', 4], ['m-sauce-tahini', 4], ['m-sauce-garlic-yogurt', 4]] },
  { id: 'p-bowls-levant', name: 'Bowl Rotation 1: Levant', d: 'Shawarma, mujaddara (lentils, rice, crispy onions) and fattoush bowls with toasted sourdough. ' + WF_BOWL + ' Ferment: sauerkraut or pickled turnips.',
    items: [['m-thighs-zaatar', 4], ['m-crumble-levant', 3], ['m-broth-rice', 4], ['m-lentils', 3], ['m-roast-cauli', 4], ['m-cuke-salad', 3], ['m-sauce-tahini', 4], ['m-sauce-garlic-yogurt', 3], ['m-egg-muffins', 5]] },
  { id: 'p-bowls-korea', name: 'Bowl Rotation 2: Korea & Japan', d: 'Bibimbap with a jammy egg, peanut-ginger chicken and miso sweet potato bowls with seaweed. ' + WF_BOWL + ' Ferment: kimchi.',
    items: [['m-thighs-gochujang', 4], ['m-crumble-ginger', 3], ['m-broth-rice', 4], ['m-roast-sweet-potato', 3], ['m-roast-broccoli', 4], ['m-slaw-asian', 3], ['m-sauce-gochujang', 4], ['m-sauce-peanut', 3], ['m-egg-muffins', 5]] },
  { id: 'p-bowls-latin', name: 'Bowl Rotation 3: Latin', d: 'Burrito, sweet potato and black bean, and chipotle crumble bowls with avocado. ' + WF_BOWL + ' Ferment: curtido or sauerkraut.',
    items: [['m-thighs-chili-lime', 4], ['m-crumble-taco', 3], ['b-rice~cilantro-lime', 4], ['m-broth-beans', 3], ['m-roast-peppers', 4], ['m-slaw-lime', 3], ['m-sauce-verde', 4], ['m-sauce-chipotle', 3], ['m-egg-muffins', 5]] },
  { id: 'p-bowls-southern', name: 'Bowl Rotation 4: Southern', d: 'Hoppin’ John, collards and crumble, and hot-honey chicken bowls. ' + WF_BOWL + ' Ferment: sauerkraut or fermented hot peppers. Then start again at week 1.',
    items: [['m-thighs-paprika', 4], ['m-crumble-sage', 3], ['m-farro', 4], ['m-bep', 3], ['m-collards', 4], ['m-butternut', 3], ['m-sauce-ranch', 4], ['m-sauce-hothoney', 3], ['m-egg-muffins', 5]] },
);
/* Preps built around food preferences (Nov 11, Newt): halal, lactose intolerant, no beef, pork or cheese. They come
   first, marked "Picked for your food preferences", for anyone whose answers overlap (fits). Swaps fill in the rest:
   milk becomes lactose-free, the burger bowls use turkey and skip the cheese. */
MEAL_PREPS.push(
  { id: 'p-halal-light', name: 'Halal, Dairy-Light Week', fits: { diets: ['halal', 'lactose'], foods: ['beef', 'pork', 'cheese'] },
    d: 'Chicken and turkey only, no cheese, and lactose-free milk where a recipe calls for milk. Za’atar chicken thighs and a slow-cooker chicken tikka masala for lunches and dinners, rice cooked in broth, a tray of roasted vegetables, egg muffins and Greek yogurt jars for breakfast, and hard-boiled eggs to grab.',
    items: [['m-thighs-zaatar', 4], ['m-sc-tikka', 4], ['m-broth-rice', 5], ['m-roast-veg', 5], ['m-egg-muffins', 5], ['m-yogurt-jars', 5], ['m-hb-eggs', 4]] },
  { id: 'p-turkey-bowls', name: 'Turkey Burger Bowl Week', fits: { diets: ['halal', 'lactose'], foods: ['beef', 'pork', 'cheese'] },
    d: 'The burger bowls made with lean ground turkey and no cheese, turkey egg roll bowls, sheet-pan chicken, overnight oats with lactose-free milk, and hard-boiled eggs. High protein, nothing fried.',
    items: [['m-reel-burger-bowls', 3], ['m-egg-roll-bowl', 3], ['m-sheet-pan', 3], ['m-overnight-oats', 5], ['m-hb-eggs', 5]] },
  { id: 'p-slow', name: 'Slow-Cooker Week', fits: { slow: true },
    d: 'Three slow-cooker dinners you start in the morning and portion at night: chicken tikka masala, honey-garlic chicken with broccoli, and salsa chicken. Overnight oats and hard-boiled eggs cover breakfast.',
    items: [['m-sc-tikka', 3], ['m-sc-honey-garlic', 3], ['m-sc-salsa-chicken', 3], ['m-overnight-oats', 5], ['m-hb-eggs', 5]] });
/* Nov 11: ready-made preps from the recipes in Newt's reels log */
MEAL_PREPS.push(
  { id: 'p-reels-faves', name: 'Reel Favorites Week', fits: { diets: ['halal', 'lactose'], foods: ['beef', 'pork', 'cheese'] },
    d: 'Picked from your saved reels: slow-cooker honey teriyaki chicken and rice, loaf-pan chicken shawarma with vermicelli rice, rice-cooker chana masala, a crunchy edamame salad for lunches, banana bread baked oatmeal for breakfast and Korean mayak eggs.',
    items: [['m-reel-sc-teriyaki', 4], ['m-reel-loaf-shawarma', 3], ['m-reel-vermicelli-rice', 3], ['m-reel-chana', 3], ['m-reel-edamame-salad', 3], ['m-reel-banana-oatmeal', 5], ['m-reel-mayak-eggs', 3]] },
  { id: 'p-reels-freezer', name: 'Reel Freezer Stock-Up',
    d: 'Big batches from your reels that freeze well: chicken tikka masala burritos, two lentil soups, a Greek lemon chicken and rice bake, and brownie baked oatmeal. Freeze half and pull a few out each week.',
    items: [['m-reel-tikka-burritos', 5], ['m-reel-red-lentil-soup', 3], ['m-reel-adas-hamod', 3], ['m-reel-greek-lemon-rice', 4], ['m-reel-brownie-oatmeal', 5]] },
  { id: 'p-reels-onepot', name: 'One-Pot Reel Week',
    d: 'Dinners from your reels that cook in one pot: green curry chicken and rice, Lebanese chicken and moghrabieh stew, and gochujang coconut chicken, plus Human Kibble bowls for lunches and tahini granola for breakfast.',
    items: [['m-reel-green-curry', 4], ['m-reel-moghrabieh', 3], ['m-reel-gochujang-coconut', 3], ['m-reel-human-kibble', 4], ['m-reel-tahini-granola', 5]] });
/* Does this prep line up with your answers? */
function prepFits(pr) {
  const f = pr.fits; if (!f) return false; const P = prefsOf(); const dis = parseDislikes(P.dislikes);
  if (f.slow && mealHabits().slow) return true;
  return (f.diets || []).some(d => P.diets.includes(d)) || (f.foods || []).some(x => dis.some(t => dislikeRe(t).test(x)) || (P.swap[x] && P.swap[x] !== 'keep'));
}
const readyPreps = () => MEAL_PREPS.map((pr, i) => ({ pr, s: prepFits(pr) ? 0 : pr.fits ? 2 : prepIssues(pr).length ? 3 : 1, i })).sort((a, b) => a.s - b.s || a.i - b.i).map(x => x.pr);

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
  if (/protein powder|garam masala/.test(t)) return 'pantry';
  if (u === 'can' || u === 'jar' || /\bcanned\b|\bbeans?\b|chickpea|salsa|marinara|tomato (paste|sauce)|crushed tomato|diced tomato|coconut milk|broth|stock\b|pickle|olives/.test(t)) return 'canned';
  if (/peanut butter|almond butter|powder|seasoning|flakes|\bdried\b|cumin|paprika|oregano|cinnamon|nutmeg|\bsalt\b|black pepper|curry|vanilla|honey|maple|syrup|soy sauce|vinegar|\boil\b|mustard|sriracha|hot sauce|tahini|chia|flax|cornstarch|baking|bay lea|za.?atar|allspice|cayenne|gochujang|mirin|fish sauce|oyster sauce|curry paste|harissa|pomegranate molasses|bouillon|\bghee\b|baking soda|gochugaru|caraway|baharat|7 spice|\blumi\b|dried lime|whole cloves|ground cloves|white pepper|urfa|aleppo|saffron|\bmayo|peanuts?\b|seeds?\b|cinnamon stick|cardamom pod|\bmiso\b|tamari|\bsage\b|sugar|chocolate|almonds?\b|walnut|pecan|cashew|\bnuts?\b|sesame|ketchup|mayo/.test(t)) return 'pantry';
  if (/\beggs?\b|yogurt|\bmilk\b|\bbutter\b|kefir|cream\b|cheese|cheddar|mozzarella/.test(t)) return 'dairy';
  if (/chicken|turkey|salmon|shrimp|tofu|tempeh|\bfish\b|\bcod\b|tilapia|steak|\bbeef\b|\bpork\b|sausage|bacon/.test(t)) return 'protein';
  if (/vermicelli|moghrabieh/.test(t)) return 'grains';
  if (/\brice\b|cereal|quinoa|\boats?\b|pasta|noodle|tortilla|bread|granola|crumbs|cracker|lentil|pita|\bwraps?\b|couscous|farro|flour|bagel|\bbuns?\b/.test(t)) return 'grains';
  if (/lemongrass|lime leaf|chil(i|ie|e)s?\b|shallot|/.test(t)) return 'produce';
  if (/onion|garlic|pepper|broccoli|spinach|lettuce|romaine|tomato|cucumber|carrot|celery|zucchini|potato|\blimes?\b|lemon|cilantro|parsley|basil|berr|banana|apple|grape|avocado|ginger|scallion|kale|cabbage|dill|chive|brussels|collard|tomatillo|jalape|turmeric|coleslaw|\bpeas?\b|mushroom|squash|green bean|\bcorn\b|hummus|orange|cauliflower|asparagus|herb|mint|fruit/.test(t)) return 'produce';
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
  /* Nov 11: foods for the meal-prep recipes from Newt's reels log (USDA-style averages per 100 g); first so they win over broader matches */
  F('egg-noodles', 'Egg noodles, dry', 'egg noodle', 384, 14, 71, 4.4, 3.3, 2, 21, { cup: 38 }),
  F('mirin', 'Mirin', 'mirin', 241, 0.2, 43, 0, 0, 43, 90, { cup: 290 }),
  F('oyster-sauce', 'Oyster sauce', 'oyster sauce', 51, 1.4, 11, 0.3, 0.3, 0, 2730, { cup: 288 }),
  F('fish-sauce', 'Fish sauce', 'fish sauce', 35, 5, 3.6, 0, 0, 3.6, 7850, { cup: 290 }),
  F('curry-paste', 'Thai curry paste', 'curry paste', 110, 2.5, 13, 5, 4, 5, 3000, { cup: 256 }),
  F('tomato-paste', 'Tomato paste', 'tomato paste', 82, 4.3, 19, 0.5, 4.1, 12, 59, { cup: 262, can: 170 }),
  F('mayo', 'Mayonnaise, light', '\\bmayo|mayonnaise', 300, 0.9, 9, 30, 0, 4, 830, { cup: 240 }),
  F('edamame', 'Edamame, shelled', 'edamame', 121, 12, 9, 5, 5, 2, 6, { cup: 155 }),
  F('couscous', 'Pearl couscous (moghrabieh), dry', 'couscous|moghrabieh', 370, 13, 75, 1.5, 3, 1, 10, { cup: 170 }),
  F('vermicelli', 'Vermicelli noodles, dry', 'vermicelli', 360, 12, 75, 1.5, 3, 2, 5, { cup: 100 }),
  F('bouillon', 'Bouillon cube', 'bouillon', 300, 10, 30, 15, 0, 10, 24000, { each: 4 }),
  F('ghee', 'Ghee', '\\bghee\\b', 876, 0.3, 0, 99.5, 0, 0, 2, { cup: 205 }),
  F('chicken-leg', 'Chicken legs, bone-in with skin (as bought)', 'chicken leg|drumstick', 160, 13.5, 0, 11.5, 0, 0, 70, { each: 300 }),
  F('whole-chicken', 'Whole chicken (as bought)', 'whole chicken|\\bchickens\\b', 150, 13, 0, 10.5, 0, 0, 60, { each: 1600 }),
  F('chicken-bone-in', 'Chicken thighs, bone-in with skin (as bought)', 'bone-in|skin on|skin-on', 175, 14, 0, 13, 0, 0, 70, { each: 170 }),
  F('seeds', 'Pumpkin, sunflower or hemp seeds', 'pumpkin seed|sunflower seed|hemp seed|pepitas', 570, 27, 15, 47, 6, 1.5, 10, { cup: 130 }),
  F('peanuts', 'Peanuts, roasted', '\\bpeanuts?\\b(?! butter| sauce| oil)', 585, 24, 21, 50, 8, 4, 6, { cup: 146 }),
  F('fresh-chili', 'Fresh chili peppers', 'green chil|red chil|fresh chil|bird.?s.?eye|thai chil|serrano|habanero|fresno', 40, 1.9, 9, 0.4, 1.5, 5, 9, { each: 15 }),
  F('pom-molasses', 'Pomegranate molasses', 'pomegranate molasses', 300, 0, 74, 0, 0, 60, 30, { cup: 320 }),
  F('harissa', 'Harissa paste', 'harissa', 100, 2.5, 10, 6, 4, 4, 1800, { cup: 250 }),
  F('lemongrass', 'Lemongrass', 'lemongrass', 99, 1.8, 25, 0.5, 0, 0, 6, { each: 20, stalk: 20 }),
  F('zero-extras', 'Spices & dried herbs', 'baking soda|lime leaf|gochugaru|caraway|baharat|7 spice|seven spice|\\blumi\\b|dried lime|black lime|whole cloves|ground cloves|white pepper|urfa|aleppo|saffron|cinnamon stick|cardamom pod', 0, 0, 0, 0, 0, 0, 0, { cup: 100, each: 1 }),
  /* Nov 2: foods for the recipes from Newt's reels */
  F('cereal', 'Breakfast cereal', '\\bcereal', 380, 7, 84, 3, 6, 20, 450, { cup: 40 }),
  F('ground-beef', 'Ground beef, 93% lean', 'ground beef', 152, 21, 0, 7, 0, 0, 66, {}),
  F('cheese', 'Cheese, shredded', 'cheese|cheddar|mozzarella', 400, 25, 2, 33, 0, 0.5, 620, { cup: 113, slice: 21 }),
  F('ketchup', 'Ketchup', 'ketchup', 100, 1, 26, 0.1, 0.3, 22, 900, { cup: 240 }),
  /* Oct 26: foods for the whole-food prep and bowl weeks (USDA-style averages per 100 g); listed first so they win over broader matches */
  F('celery', 'Celery', 'celery', 14, 0.7, 3, 0.2, 1.6, 1.3, 80, { stalk: 40, cup: 101, each: 40 }),
  F('brussels', 'Brussels sprouts', 'brussels', 43, 3.4, 9, 0.3, 3.8, 2.2, 25, { cup: 88 }),
  F('kefir', 'Kefir, plain whole milk', 'kefir', 61, 3.4, 4.5, 3.3, 0, 4.5, 40, { cup: 243 }),
  F('miso', 'Miso paste', '\\bmiso\\b', 198, 12, 26, 6, 5, 6, 3728, { cup: 275 }),
  F('tomatillo', 'Tomatillos', 'tomatillo', 32, 1, 5.8, 1, 1.9, 3.9, 1, { each: 34, cup: 132 }),
  F('farro', 'Farro, dry', 'farro', 340, 12.5, 72, 2, 10, 0.5, 10, { cup: 170 }),
  F('black-eyed', 'Black-eyed peas, canned (drained)', 'black.?eyed', 77, 4.7, 14, 0.6, 3.3, 0.4, 300, { can: 255, cup: 170 }),
  F('collards', 'Collard greens', 'collard', 32, 3, 5.4, 0.6, 4, 0.5, 17, { bunch: 300, cup: 36 }),
  F('chives', 'Chives, fresh', 'chive', 30, 3.3, 4.4, 0.7, 2.5, 1.9, 3, { cup: 48 }),
  F('bay-leaf', 'Bay leaf', 'bay lea', 0, 0, 0, 0, 0, 0, 0, { each: 0.2 }),
  F('protein-powder', 'Protein powder (whey)', 'protein powder', 400, 80, 10, 5, 2, 5, 300, { cup: 120, scoop: 30 }),
  F('salt', 'Salt', '\\bsalt\\b', 0, 0, 0, 0, 0, 0, 38758, { cup: 292 }),
  F('cocoa', 'Cocoa powder, unsweetened', 'cocoa', 228, 20, 58, 14, 37, 2, 21, { cup: 86 }),
  F('coconut-flakes', 'Shredded coconut, unsweetened', 'shredded coconut|coconut flakes', 660, 7, 24, 65, 16, 7, 37, { cup: 80 }),
  F('balsamic', 'Balsamic vinegar', 'balsamic', 88, 0.5, 17, 0, 0, 15, 23, { cup: 255 }),
  F('spices', 'Spices & dried herbs', 'italian seasoning|garam masala|cayenne|turmeric|allspice|coriander|cardamom|za.?atar|sumac|ground ginger|powder|cumin|paprika|oregano|cinnamon|nutmeg|black pepper|vanilla|\\bdried\\b|flakes|vinegar|extract|curry|thyme|rosemary|bay lea', 0, 0, 0, 0, 0, 0, 0, { cup: 100 }),
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
  F('hot-sauce', 'Hot sauce or sriracha', 'hot sauce|sriracha|buffalo sauce', 20, 1, 3, 0.5, 0.5, 1.5, 2600, { cup: 240 }),
  F('bbq-sauce', 'BBQ sauce', 'bbq sauce|barbecue sauce', 172, 0.8, 41, 0.6, 0.6, 33, 1000, { cup: 280 }),
  F('gochujang', 'Gochujang', 'gochujang', 200, 4, 44, 1.5, 2, 24, 2500, { cup: 304 }),
  F('chipotle', 'Chipotle peppers in adobo', 'chipotle|adobo', 70, 1.5, 9, 3, 4, 4, 1000, { each: 15, can: 198, cup: 240 }),
  F('olives', 'Olives, kalamata', '\\bolives\\b|kalamata', 115, 0.8, 6, 11, 3, 0, 735, { cup: 135, each: 4 }),
  F('raisins', 'Raisins', 'raisin', 299, 3, 79, 0.5, 3.7, 59, 11, { cup: 145 }),
  F('tropical-fruit', 'Pineapple or mango', 'pineapple|mango', 55, 0.6, 14, 0.2, 1.5, 10.5, 1, { cup: 165, each: 200 }),
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
  F('flour', 'Flour', 'flour', 364, 10, 76, 1, 2.7, 0.3, 2, { cup: 125 })
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
    plan: { people: clampInt(p.people, 1, 12, 1), weeks: clampInt(p.weeks, 1, 4, 1), days: clampInt(p.days, 1, 28, 7 * clampInt(p.weeks, 1, 4, 1)), ...(/^\d{4}-\d\d-\d\d$/.test(p.start) ? { start: p.start } : {}), ...(p.src === 'next' || p.src === 'rot' ? { src: p.src } : {}),
      items: (Array.isArray(p.items) ? p.items : []).filter(i => i && typeof i.r === 'string').map(i => ({ id: String(i.id || uid('mp')), r: i.r, n: +i.n > 0 ? Math.min(21, Math.round(+i.n * 100) / 100) : 3 })), ...(p.fromMenu ? { fromMenu: true } : {}) },
    ...(Number.isInteger(x.prepDay) && x.prepDay >= 0 && x.prepDay <= 6 ? { prepDay: x.prepDay } : {}),
    ...(Array.isArray(x.next) ? { next: x.next.filter(e => e && /^\d{4}-\d\d-\d\d$/.test(e.start) && Array.isArray(e.items)).map(e => ({ id: String(e.id || uid('nx')), name: String(e.name || 'Planned prep'), start: e.start, days: clampInt(e.days, 1, 28, 7), items: e.items.filter(x => Array.isArray(x) && typeof x[0] === 'string').map(([r, n]) => [r, +n > 0 ? +n : 3]) })) } : {}),
    ...(x.stars && typeof x.stars === 'object' && Object.keys(x.stars).length ? { stars: Object.fromEntries(Object.keys(x.stars).filter(k => x.stars[k]).map(k => [k, true])) } : {}),
    checks: x.checks && typeof x.checks === 'object' ? x.checks : {},
    preps: Object.fromEntries(Object.entries(x.preps && typeof x.preps === 'object' ? x.preps : {}).filter(([, p]) => p && p.name && Array.isArray(p.items))),
    ...(x.rot && Array.isArray(x.rot.ids) && x.rot.ids.length >= 2 && /^\d{4}-\d\d-\d\d$/.test(x.rot.start) ? { rot: { ids: x.rot.ids.map(String), start: x.rot.start, applied: x.rot.applied || null } } : {}),
    extras: (Array.isArray(x.extras) ? x.extras : []).filter(e => e && e.t).map(e => ({ id: String(e.id || uid('mx')), t: String(e.t), c: !!e.c })),
    foods: Object.fromEntries(Object.entries(x.foods && typeof x.foods === 'object' ? x.foods : {}).filter(([, f]) => f && f.name && f.sv && +f.sv.gr > 0)),
    log: Object.fromEntries(Object.entries(x.log && typeof x.log === 'object' ? x.log : {}).map(([d, l]) => [d, (Array.isArray(l) ? l : []).filter(e => e && e.id && e.m && typeof e.m === 'object')]).filter(([d, l]) => /^\d{4}-\d\d-\d\d$/.test(d) && l.length)),
    ...(typeof x.lookup === 'boolean' ? { lookup: x.lookup } : {}),
    ...(x.me && typeof x.me === 'object' && +x.me.h > 0 && +x.me.w > 0 ? { me: x.me } : {}),
    ...(x.menu && Array.isArray(x.menu.days) && x.menu.t ? { menu: x.menu } : {}),
    ...(x.skip && typeof x.skip === 'object' && Object.keys(x.skip).length ? { skip: Object.fromEntries(Object.keys(x.skip).filter(k => /^[0-6]:(b|l|d|s\d*)$/.test(k) && x.skip[k]).map(k => [k, true])) } : {}),
    ...(['easy', 'written', 'weight'].includes(x.units) ? { units: x.units } : {}),
    saved: Object.fromEntries(Object.entries(x.saved && typeof x.saved === 'object' ? x.saved : {}).filter(([, v]) => v && v.cat && v.e && v.e.m && v.e.name)),
    ...(Array.isArray(x.cats) && x.cats.length ? { cats: x.cats.map(String).slice(0, 20) } : {}),
    ...(x.prefs && typeof x.prefs === 'object' ? { prefs: { allergies: Array.isArray(x.prefs.allergies) ? x.prefs.allergies.map(String) : [], diet: String(x.prefs.diet || 'none'), ...(Array.isArray(x.prefs.diets) ? { diets: x.prefs.diets.map(String) } : {}), ...(Array.isArray(x.prefs.lactose) ? { lactose: x.prefs.lactose.map(String) } : {}), dislikes: String(x.prefs.dislikes || '') } } : {}),
    ...(x.habits && typeof x.habits === 'object' ? { habits: { meals: clampInt(x.habits.meals, 2, 5, 4), prep: ['once', 'few', 'fresh'].includes(x.habits.prep) ? x.habits.prep : 'few', cheap: !!x.habits.cheap, quick: !!x.habits.quick, ...(Array.isArray(x.habits.pricey) ? { pricey: x.habits.pricey.filter(k => typeof k === 'string') } : {}), ...(Array.isArray(x.habits.gear) ? { gear: x.habits.gear.filter(k => typeof k === 'string') } : {}), ...(x.habits.slow ? { slow: true } : {}), ...(x.habits.starred ? { starred: true } : {}) } } : {}),
    ...(x.stars && typeof x.stars === 'object' && Object.keys(x.stars).length ? { stars: Object.fromEntries(Object.keys(x.stars).filter(k => x.stars[k]).map(k => [k, true])) } : {}),
    ...(x.noPlan && typeof x.noPlan === 'object' && Object.keys(x.noPlan).length ? { noPlan: Object.fromEntries(Object.keys(x.noPlan).filter(k => x.noPlan[k]).map(k => [k, true])) } : {}),
    goals: Object.fromEntries(Object.entries(x.goals && typeof x.goals === 'object' ? x.goals : {}).filter(([k, v]) => NUT.some(n => n[0] === k) && +v > 0).map(([k, v]) => [k, +v])),
  };
}
/* Nov 2: recipes from Newt's saved reels; src credits the creator and links the reel (shown at the bottom of the recipe) */
MEAL_LIB.push(
  { id: 'm-reel-chicken-rice', name: 'Big-Batch Chicken & Rice', cat: 'main', serves: 4, size: '1 big bowl', mins: 40, keeps: 4, freezes: true, week: 4,
    d: 'Simple, high-calorie bowls for building muscle: plenty of chicken and rice, very little fuss.',
    ing: ['2 lb boneless skinless chicken thighs', '3 cups white rice (dry)', '2 cups frozen peas', '2 tbsp olive oil', '1 tsp salt', '1 tsp garlic powder', '1 tsp smoked paprika', '2 tbsp soy sauce'],
    steps: ['Cook the rice with 4½ cups of water and half the salt, covered, about 18 minutes. Stir in the peas for the last 3 minutes.', 'Toss the chicken with the oil, the rest of the salt, the garlic powder and paprika.', 'Cook in a large pan over medium-high heat 6–7 minutes a side, until it reaches 165°F (74°C). Rest 5 minutes and slice.', 'Split the rice and chicken between four containers and drizzle with the soy sauce.'],
    note: 'Bulking: these are big on purpose. For a cut, make 6 smaller bowls from the same batch.',
    src: { by: '@itsoliverdraisey', url: 'https://www.instagram.com/reel/C5gfkBZCJby/', what: 'High-calorie, simple meals over fancy recipes' } },
  { id: 'm-reel-cereal-shake', name: 'Cereal & Shake Breakfast', cat: 'breakfast', serves: 1, size: '1 bowl + 1 shake', mins: 3, keeps: 1, freezes: false, week: 1,
    d: 'A fast, big breakfast when eating enough is the hard part: about 900 calories in three minutes.',
    ing: ['2 cups cereal', '1½ cups whole milk', '1 banana', '1 scoop protein powder', '1 cup whole milk, for the shake'],
    steps: ['Pour the cereal and 1½ cups milk into a big bowl and slice the banana on top.', 'Shake the protein powder with 1 cup milk.'],
    note: 'Pick a cereal with some fiber. For a lighter version use 2% milk and one cup of cereal.',
    src: { by: '@itsoliverdraisey', url: 'https://www.instagram.com/reel/C5gfkBZCJby/', what: 'Big bowl of cereal plus a protein shake' } },
  { id: 'm-reel-half-plate', name: 'Half-Plate Protein Plates', cat: 'main', serves: 4, size: '1 plate', mins: 35, keeps: 4, freezes: false, week: 4,
    d: 'The simple plate rule: half protein, a quarter carbs, a quarter vegetables. No weighing needed.',
    ing: ['1½ lb boneless skinless chicken breast', '1 cup brown rice (dry)', '1 lb broccoli', '1 tbsp olive oil', '1 tsp salt', '½ tsp black pepper', '1 tsp garlic powder', '1 lemon'],
    steps: ['Cook the rice with 2 cups of water, covered, about 40 minutes (or use a rice cooker).', 'Heat the oven to 425°F (220°C). Toss the chicken and broccoli with the oil, salt, pepper and garlic powder on a sheet pan.', 'Roast 18–22 minutes, until the chicken reaches 165°F (74°C).', 'Fill half of each container with sliced chicken, a quarter with rice and a quarter with broccoli. Squeeze lemon over.'],
    note: 'Two plates like this a day plus one or two snacks covers most of a beginner’s protein (estimate).',
    src: { by: '@higherupwellness', url: 'https://www.instagram.com/reel/DHZSLyfhqT7/', what: 'Half protein, a quarter carbs, a quarter vegetables' } },
  { id: 'm-reel-ice-cream', name: 'Protein Ice Cream Pint', cat: 'snack', serves: 1, size: '1 pint', mins: 5, keeps: 30, freezes: true, week: 1,
    d: 'A frozen protein shake spun into soft-serve. Chocolate here; change the flavor with what you have.',
    ing: ['1½ cups 2% milk', '1 scoop protein powder', '1 tbsp cocoa powder', '1 tsp honey'],
    steps: ['Blend or shake everything until smooth and pour into an ice-cream maker pint.', 'Freeze flat for 24 hours.', 'Spin on the light ice cream setting. If it’s crumbly, add a splash of milk and re-spin.'],
    note: 'No pint machine? Freeze in an ice-cube tray and blend the cubes with a splash of milk. Most of the cost is the protein powder (and the pint machine, once); the Greek yogurt freezer cups skip both.', alt: 'm-froyo-cups', altWhy: 'Cheaper option',
    src: { by: '@fitnessproductfinder', url: 'https://www.instagram.com/reel/DWPSUyHPS8k/', what: 'Protein ice cream pint ideas' } },
  /* Slow-cooker mains (Nov 11, Newt likes slow-cooker recipes over another chili). Halal-friendly, no beef, pork or cheese.
     mins is the hands-on time; the cooker does the rest. */
  { id: 'm-sc-salsa-chicken', name: 'Slow-Cooker Salsa Chicken & Rice', cat: 'main', serves: 6, size: '1 container', mins: 15, keeps: 4, freezes: true, week: 3,
    d: 'Chicken, salsa, black beans and corn go in the cooker; you come back to shredded burrito-bowl chicken.',
    ing: ['3 lb boneless skinless chicken breast', '2 cups salsa', '1 can black beans (15 oz), rinsed', '1½ cups frozen corn', '2 tsp ground cumin', '1 tsp chili powder', '1 tsp salt', '2 limes, juiced', '2 cups white rice (dry)'],
    steps: ['Put the chicken in the slow cooker. Pour the salsa over it and add the beans, corn, cumin, chili powder and salt.', 'Cover and cook on low 6 hours or high 3 hours, until the chicken shreds easily.', 'Shred the chicken with two forks right in the cooker and stir in the lime juice.', 'Cook the rice, then portion rice and chicken into six containers.'],
    note: 'Top with lettuce, the Chipotle Yogurt Sauce or hot sauce. Freezes well without the rice.' },
  { id: 'm-sc-tikka', name: 'Slow-Cooker Chicken Tikka Masala', cat: 'main', serves: 6, size: '1 container', mins: 20, keeps: 4, freezes: true, week: 3,
    d: 'Thighs simmer all day in spiced tomato; coconut milk and Greek yogurt make it creamy at the end.',
    ing: ['3 lb boneless skinless chicken thighs, cut into chunks', '1 can crushed tomatoes (28 oz)', '1 yellow onion, diced', '5 cloves garlic, minced', '1 tbsp fresh ginger, grated', '2 tbsp garam masala', '1 tsp ground turmeric', '1 tsp salt', '1 can light coconut milk (13.5 oz)', '¾ cup plain nonfat Greek yogurt', '2 cups white rice (dry)'],
    steps: ['Put the chicken, tomatoes, onion, garlic, ginger, garam masala, turmeric and salt in the slow cooker and stir.', 'Cover and cook on low 6 hours or high 3 hours.', 'Turn the cooker off. Stir in the coconut milk, then the yogurt a spoonful at a time so it stays smooth.', 'Cook the rice and portion it with the curry into six containers.'],
    note: 'No yogurt? Use the whole can of coconut milk instead.' },
  { id: 'm-sc-shawarma', name: 'Slow-Cooker Chicken Shawarma Bowls', cat: 'main', serves: 6, size: '1 bowl', mins: 20, keeps: 4, freezes: true, week: 3,
    d: 'Lemony, cumin-and-paprika chicken over sliced onions, shredded for rice bowls with a garlic yogurt sauce.',
    ing: ['3 lb boneless skinless chicken thighs', '2 red onions, sliced', '2 lemons, juiced', '2 tbsp olive oil', '6 cloves garlic, minced', '1 tbsp ground cumin', '1 tbsp smoked paprika', '1 tsp ground turmeric', '½ tsp ground cinnamon', '1 tsp salt', '2 cups white rice (dry)', '1 cup plain nonfat Greek yogurt', '2 cucumbers, diced'],
    steps: ['Spread the onions in the slow cooker. Toss the chicken with the lemon juice, oil, two-thirds of the garlic, the spices and the salt, and lay it on top.', 'Cover and cook on low 6 hours or high 3 hours, then shred the chicken in the juices.', 'Stir the rest of the garlic and a pinch of salt into the yogurt for the sauce.', 'Cook the rice. Pack rice, chicken and onions, with the cucumbers and sauce in separate small containers.'],
    note: 'Leftover juices make the rice taste great: cook the rice in a cup of them plus water.' },
  { id: 'm-sc-honey-garlic', name: 'Slow-Cooker Honey-Garlic Chicken', cat: 'main', serves: 6, size: '1 container', mins: 15, keeps: 4, freezes: true, week: 3,
    d: 'Sticky soy, honey and garlic chicken with broccoli added at the end.',
    ing: ['3 lb boneless skinless chicken thighs', '⅓ cup soy sauce', '⅓ cup honey', '6 cloves garlic, minced', '1 tbsp fresh ginger, grated', '2 tbsp cornstarch', '1 head broccoli, cut into florets', '2 cups white rice (dry)'],
    steps: ['Whisk the soy sauce, honey, garlic and ginger in the slow cooker. Add the chicken and turn it to coat.', 'Cover and cook on low 5 hours or high 2½ hours.', 'Whisk the cornstarch with 3 tbsp water, stir it in, add the broccoli, and cook on high 30 minutes more, until the sauce thickens.', 'Cook the rice and portion everything into six containers.'],
    note: 'Gluten-free? Use tamari instead of soy sauce.' },
  { id: 'm-sc-lentil-soup', name: 'Slow-Cooker Lentil & Vegetable Soup', cat: 'main', serves: 6, size: '2 cups', mins: 15, keeps: 5, freezes: true, week: 3,
    d: 'A cheap, filling meatless soup: lentils, carrots, celery and tomatoes, with spinach and lemon at the end.',
    ing: ['2 cups lentils (dry), rinsed', '1 can diced tomatoes (14.5 oz)', '8 cups vegetable broth', '3 carrots, diced', '3 celery stalks, diced', '1 yellow onion, diced', '4 cloves garlic, minced', '2 tsp ground cumin', '1 tsp smoked paprika', '1 tsp salt', '4 cups spinach', '1 lemon, juiced', '1 cup plain nonfat Greek yogurt'],
    steps: ['Put everything except the spinach, lemon and yogurt in the slow cooker and stir.', 'Cover and cook on low 7 hours or high 4 hours, until the lentils are soft.', 'Stir in the spinach and lemon juice until the spinach wilts. Taste for salt.', 'Portion into six containers and top each with a spoon of yogurt when you eat it.'],
    note: 'Add a can of chickpeas or some shredded chicken for more protein.' },
  { id: 'm-froyo-cups', name: 'Chocolate Greek Yogurt Freezer Cups', cat: 'snack', serves: 3, size: '1 cup', mins: 5, keeps: 30, freezes: true, week: 3,
    d: 'The cheap way to a frozen protein dessert: Greek yogurt brings the protein, so there’s no protein powder and no ice-cream machine.',
    ing: ['3 cups plain nonfat Greek yogurt', '3 tbsp cocoa powder', '3 tbsp honey', '1 tsp vanilla extract', '¼ tsp salt'],
    steps: ['Whisk everything until smooth. Taste and add more honey if you like it sweeter.', 'Spoon into three freezer-safe cups or containers and smooth the tops.', 'Freeze at least 3 hours.', 'Let one sit on the counter 10–15 minutes before eating so it scoops like soft-serve.'],
    note: 'Swirl in a spoon of peanut butter or a few frozen berries before freezing for a change. Blending the frozen cup with a splash of milk makes a thick shake.' },
  { id: 'm-reel-burger-bowls', name: 'Lighter Burger Bowls', cat: 'main', serves: 4, size: '1 bowl', mins: 20, keeps: 3, freezes: false, week: 3,
    d: 'A cheeseburger, swapped lighter: lean beef over crunchy lettuce with a quick burger sauce.',
    ing: ['1 lb ground beef (93% lean)', '1 onion, diced', '½ tsp salt', '6 cups chopped romaine', '2 tomatoes, diced', '½ cup shredded cheese', '½ cup pickles, chopped', '⅓ cup plain Greek yogurt', '2 tbsp ketchup', '1 tbsp mustard'],
    steps: ['Brown the beef and onion with the salt, 8–10 minutes, breaking it up.', 'Stir the yogurt, ketchup and mustard together for the sauce.', 'Pack the lettuce and tomatoes separately from the warm beef. To eat, top the lettuce with beef, cheese, pickles and sauce.'],
    note: 'The swaps: lean beef, no bun, yogurt-based sauce. Add a toasted bun on a high-carb day.',
    src: { by: '@_aussiefitness', url: 'https://www.instagram.com/reel/C-ukFuAS9ua/', what: 'Macro-friendly versions of favorite meals' } });
/* Nov 11: meal-prep picks from Newt's reels log (Stockpile Ideas → Recipes). Steps are written in Ironwood's own words;
   src credits the creator and links the reel. Amounts follow the reel; where the reel gave none, the note says the amounts
   are Ironwood's. All halal-friendly with no beef, pork or cheese; noAuto ones are in Recipes to look up but not picked
   for a meal plan (long weekend cooks). */
MEAL_LIB.push(
  { id: 'm-reel-sc-teriyaki', name: 'Slow-Cooker Honey Teriyaki Chicken & Rice', cat: 'main', serves: 8, size: '1 container', mins: 20, keeps: 4, freezes: true, week: 4,
    d: 'Sticky teriyaki thighs from the slow cooker over short-grain rice, with a light spicy mayo. Made to portion and freeze.',
    ing: ['3 lb boneless skinless chicken thighs', '5 tbsp soy sauce', '2 tbsp dark soy sauce', '4 tbsp honey', '4 tbsp mirin', '2 tbsp ginger paste', '1 tbsp garlic paste', '3 tbsp cornstarch', '2½ cups short-grain rice (dry)', '½ cup light mayo', '½ cup plain nonfat Greek yogurt', '5 tbsp sriracha', '½ tsp garlic powder', '2 green onions, sliced'],
    steps: ['Put the chicken, both soy sauces, honey, mirin, ginger and garlic in the slow cooker and turn the chicken to coat.', 'Cook on high 4–5 hours or low 5–6 hours, until the chicken is tender.', 'Stir the cornstarch into 4 tbsp cold water, stir it into the sauce and leave the lid off 15–20 minutes so it thickens. Break up the chicken.', 'Cook the rice. Mix it into the chicken or keep it separate.', 'For the spicy mayo, stir the mayo, yogurt, sriracha and garlic powder together, with a splash of water to thin it.', 'Portion into eight containers, top with green onions and keep the sauce on the side. Freeze what you won’t eat in 4 days.'],
    note: 'The creator counts about 515 calories and 40 g protein a serving. The reel thins the sauce with milk; water works and keeps it dairy-light.',
    src: { by: 'Tom Walsh', url: 'https://www.instagram.com/reel/DB60tB4y-lm/', what: 'Slow-cooker meal prep' } },
  { id: 'm-reel-tikka-burritos', name: 'Chicken Tikka Masala Burritos', cat: 'main', serves: 11, size: '1 burrito', mins: 75, keeps: 4, freezes: true, week: 4,
    d: 'Charred yogurt-marinated chicken, a blended masala sauce and rice rolled into eleven freezer burritos, with a herby yogurt dip.',
    ing: ['3 lb boneless skinless chicken breast', '3 tbsp smoked paprika', '2 tbsp ground cumin', '1 tbsp garam masala', '1 tbsp ground coriander', '1 tsp ground turmeric', '1 tsp cayenne', '1 cup plain nonfat Greek yogurt, for the marinade', '4 tbsp minced garlic', '4 tbsp ginger paste', '3 lemons', '2 tbsp salt', '3 tbsp butter', '2 yellow onions, chopped', '4 tbsp tomato paste', '1 can diced tomatoes (14.5 oz)', '1 bunch cilantro', '3½ cups plain nonfat Greek yogurt, for the sauce and dip', '1 cup basmati rice (dry)', '1½ cups chicken bone broth', '11 large flour tortillas', '1 tbsp honey', '2 tbsp chives, chopped'],
    steps: ['Mix the spices. Coat the chicken with the marinade yogurt, half the garlic and ginger, the juice of 2 lemons, the salt and half the spices. Marinate at least 2 hours.', 'For the sauce, melt 2 tbsp butter and cook the onions over high heat until they start to brown. Add the rest of the garlic and ginger for 3–4 minutes, then the tomato paste and the rest of the spices for 1 minute.', 'Add the tomatoes, ⅔ cup water and half the cilantro. Simmer 10–15 minutes, blend until smooth, then stir in 1 cup of the sauce yogurt and the last tbsp of butter over low heat.', 'Cook the rice in the broth. Grill or broil the chicken until charred and cooked to 165°F (74°C), then chop it.', 'Fill each tortilla with rice, chicken and sauce, roll tightly and wrap in foil. Freeze what you won’t eat in 4 days.', 'For the dip, stir the rest of the yogurt with the juice of the last lemon, the honey, chives and the rest of the cilantro.', 'Reheat a frozen burrito unwrapped in a damp paper towel, 3–4 minutes in the microwave, or 25 minutes in a 375°F (190°C) oven in its foil.'],
    note: 'The creator counts about 480 calories and 40 g protein a burrito. The reel thins the dip with milk; a splash of water does the same.',
    src: { by: 'Tom Walsh (Stealth Health)', url: 'https://www.instagram.com/reel/C7ul8ZhJjbZ/', what: 'Frozen burrito meal prep' } },
  { id: 'm-reel-loaf-chicken', name: 'Easy Loaf Pan Chicken', cat: 'main', serves: 6, size: '4–5 oz sliced', mins: 60, keeps: 4, freezes: true, week: 4,
    d: 'Marinated thighs packed into a loaf pan and baked into one juicy block you slice thin, like a homemade gyro.',
    ing: ['2½ lb boneless chicken thighs', '1 yellow onion', '1 lemon', '3 tbsp tomato paste', '2 tbsp plain nonfat Greek yogurt', '1 tsp salt', '½ tsp black pepper', '1½ tbsp dried thyme', '1½ tbsp garlic powder', '1 tbsp urfa or Aleppo pepper flakes'],
    steps: ['Blitz the onion in a food processor (or grate it) and mix it with the chicken, lemon juice, tomato paste and yogurt.', 'Add the salt, pepper, thyme, garlic powder and pepper flakes and mix well. Marinate 2–6 hours, or overnight.', 'Heat the oven to 425°F (220°C). Let the chicken sit out 30 minutes, then pack it tightly into a standard loaf pan.', 'Bake 50 minutes. Pour the juices off into a jar, spoon them back over the top, and do it once more.', 'Turn it out, slice thin and pack with rice, a salad or in wraps. Save the juices for soup or rice.'],
    src: { by: '@shredhappens', url: 'https://www.instagram.com/reel/DE24LhvyGnF/', what: 'Loaf pan chicken for weekly prep' } },
  { id: 'm-reel-loaf-shawarma', name: 'Loaf Pan Chicken Shawarma', cat: 'main', serves: 8, size: '4–5 oz sliced', mins: 60, keeps: 4, freezes: true, week: 4,
    d: 'Lemon, garlic and warm-spiced thighs baked in a loaf pan, then sliced like shawarma for wraps, bowls and salads.',
    ing: ['3½ lb boneless skinless chicken thighs', '⅓ cup lemon juice', '¼ cup olive oil', '10 cloves garlic, minced', '3 tsp salt', '1½ tsp ground cardamom', '1½ tsp paprika', '1½ tsp ground cumin', '½ tsp crushed red pepper flakes', '½ tsp ground cinnamon'],
    steps: ['Mix the lemon juice, oil, garlic, salt and spices, and coat the chicken. Marinate at least 1 hour.', 'Heat the oven to 400°F (200°C) and pack the chicken into a loaf pan.', 'Bake about 45 minutes, until it reaches 165°F (74°C).', 'Cool a little, slice thin, and pack with rice, pickles and a garlic or tahini sauce.'],
    src: { by: '@feelgoodfoodie', url: 'https://www.instagram.com/reel/Cu8P8CONbbP/', what: 'Loaf pan chicken shawarma' } },
  { id: 'm-reel-moghrabieh', name: 'Lebanese Chicken & Moghrabieh Stew', cat: 'main', serves: 5, size: '1 bowl', mins: 90, keeps: 4, freezes: true, week: 3,
    d: 'Chicken thighs braised with caraway, cumin and cinnamon, finished with pearl couscous and chickpeas.',
    ing: ['2¼ lb bone-in skin-on chicken thighs', '2 tbsp olive oil', '6 shallots, peeled', '8 cloves garlic, peeled', '2 tsp ground caraway', '2 tsp ground cumin', '2 tsp baharat (Lebanese 7 spice)', '1 cinnamon stick', '2 cups chicken stock', '2 cups moghrabieh (pearl couscous)', '1 cup chickpeas, drained', '1 lemon', '1 bunch cilantro, chopped', '1 tsp salt'],
    steps: ['Brown the chicken skin side down with the shallots in the oil in a large pot over medium heat, 8–10 minutes.', 'Turn the chicken, add the garlic for 2 minutes, then the spices and stock. Bring to a boil, cover and cook on low 40–45 minutes.', 'Meanwhile boil the moghrabieh 15 minutes and drain.', 'Add it to the pot with the chickpeas, cover and cook 15 minutes, then uncover and cook 10–12 minutes more until the sauce is thick.', 'Finish with the lemon juice and zest, salt and cilantro. Portion into five containers.'],
    src: { by: '@johngregorysmith', url: 'https://www.instagram.com/reel/CsqzW2moGoA/', what: 'Lebanese chicken stew with moghrabieh' } },
  { id: 'm-reel-green-curry', name: 'One-Pot Green Curry Chicken & Rice', cat: 'main', serves: 4, size: '1 container', mins: 60, keeps: 4, freezes: true, week: 3,
    d: 'Chicken, rice and vegetables cooked together in green curry and coconut milk. One pot, a full meal.',
    ing: ['1½ cups jasmine rice (dry)', '1½ lb boneless skinless chicken thighs', '2 tbsp cooking oil', '4 carrots, sliced', '1 head broccoli, cut into florets', '1 small onion, diced', '3 cloves garlic, minced', '1 tbsp fresh ginger, minced', '4 tbsp green curry paste', '1 can coconut milk (13.5 oz)', '1½ cups chicken broth', '1 tsp salt', '2 limes', '½ bunch cilantro'],
    steps: ['Soak the rice 30 minutes, then rinse. Season the chicken with salt and pepper.', 'Sear the chicken in the oil in a large pot over medium-high heat, 3–5 minutes a side, and set it aside.', 'Turn the heat to medium. Cook the onion, carrots and broccoli 3 minutes, then the garlic and ginger 1–2 minutes.', 'Stir the curry paste in a clear spot for 30 seconds, then add the broth and coconut milk, scraping the bottom.', 'Add the rice and salt, bring to a simmer, and nestle the chicken in. Cover and cook on low 20 minutes, then rest 10–15 minutes off the heat.', 'Finish with lime juice and cilantro and portion into four containers.'],
    note: 'Counted with light coconut milk; full-fat adds about 100 calories a serving.',
    src: { by: 'Olivia Adriance', url: 'https://www.instagram.com/reel/C15Z4_JOe2w/', what: 'One-pot green curry chicken and rice' } },
  { id: 'm-reel-gochujang-coconut', name: 'Gochujang Coconut Chicken', cat: 'main', serves: 4, size: '1 container', mins: 30, keeps: 4, freezes: true, week: 3,
    d: 'Crispy-skinned thighs simmered in a spicy, jammy gochujang and coconut sauce. About 25 minutes.',
    ing: ['6 boneless chicken thighs', '3 tsp paprika', '1 tsp ground ginger', '2 tsp gochugaru', '2 tbsp cooking oil', '1 small red onion, diced', '3 cloves garlic, diced', '1 tbsp tomato paste', '1 tbsp gochujang', '1 can coconut milk (13.5 oz)', '1 makrut lime leaf', '1 lime', '1½ cups white rice (dry)'],
    steps: ['Rub the chicken with the paprika, ginger, gochugaru and a little oil while you chop the onion and garlic. Start the rice.', 'Fry the chicken skin side down in a shallow pan over medium heat until crisp, flip for a few minutes and take it out.', 'In the same pan, cook the onion, tomato paste and gochujang 5 minutes until jammy, then the garlic 2 minutes.', 'Pour in the coconut milk with the lime leaf and bring to a simmer. Return the chicken and cook about 10 minutes, to 165°F (74°C).', 'Portion over the rice with a squeeze of lime.'],
    note: 'The reel adds a pinch of MSG with the spices.',
    src: { by: 'Bella | Cooking Made Easy', url: 'https://www.instagram.com/reel/DWOBD5QDXeU/', what: 'Gochujang and coconut chicken' } },
  { id: 'm-reel-greek-lemon-rice', name: 'Greek Lemon Chicken & Rice Bake', cat: 'main', serves: 6, size: '1 container', mins: 60, keeps: 4, freezes: true, week: 3,
    d: 'Raw rice, chicken and vegetables baked together in one dish under foil. Six meals, about 40 g protein each.',
    ing: ['2 lb boneless skinless chicken breast, cut into bites', '1½ cups jasmine rice (dry)', '2 cups chicken broth', '1 red onion, diced', '1 cup cherry tomatoes, halved', '3 cups baby spinach', '4 cloves garlic, minced', '1 lemon', '1 tbsp olive oil', '2 tbsp parsley, chopped', '2 tsp dried oregano', '1 tsp garlic powder', '1 tsp onion powder', '1 tsp dried dill', '1 tsp salt', '½ tsp black pepper'],
    steps: ['Heat the oven to 400°F (200°C).', 'In a 9×13 dish mix the rice, chicken, onion, tomatoes, garlic, lemon zest, oil and all the seasonings.', 'Pour in the warm broth and the juice of half the lemon, stir, and spread it out so the rice is mostly under the liquid.', 'Cover tightly with foil and bake 45–50 minutes, until the rice is tender and the chicken reaches 165°F (74°C).', 'Stir in the spinach while it’s hot, add the parsley and the rest of the lemon juice, and split into six containers.'],
    note: 'The reel tops it with feta; it’s left out here.',
    src: { by: 'Adam Wolfe', url: 'https://www.instagram.com/reel/Deh7xGUBYuU/', what: 'Greek lemon chicken and rice bake' } },
  { id: 'm-reel-yogurt-airfryer', name: 'Yogurt-Marinated Air Fryer Chicken', cat: 'main', serves: 4, size: '1 breast', mins: 50, keeps: 4, freezes: true, week: 3,
    d: 'Greek yogurt, lemon and paprika keep chicken breasts juicy in 12–15 minutes.',
    ing: ['1½ lb boneless skinless chicken breast', '⅓ cup plain nonfat Greek yogurt', '4 cloves garlic, minced', '1 tbsp lemon juice', '2 tsp paprika', '1 tsp garlic powder', '½ tsp onion powder', '½ tsp dried oregano', '1 tsp salt', '½ tsp black pepper'],
    steps: ['Pat the chicken dry and pound the thick ends so the breasts are even.', 'Rub with the yogurt, lemon juice, garlic and seasonings. Marinate at least 30 minutes, up to a day.', 'Air fry at 375°F (190°C) smooth side down 8 minutes, flip, and cook 4–7 minutes more, to 165°F (74°C).', 'Rest 5 minutes, slice and pack with rice and vegetables.'],
    src: { by: '@feelgoodfoodie', url: 'https://www.instagram.com/reel/Cbq1qpNAzIm/', what: 'Yogurt-marinated air fryer chicken' } },
  { id: 'm-reel-me-baked-chicken', name: 'Middle Eastern Baked Chicken Legs', cat: 'main', serves: 6, size: '1 chicken leg', mins: 75, keeps: 4, freezes: true, week: 3,
    d: 'Chicken legs coated in a blended tomato, pepper and herb marinade, baked under foil then browned. Good with vermicelli rice.',
    ing: ['6 chicken legs (thigh and drumstick)', '1 Roma tomato', '½ red onion', '1 red bell pepper', '4 cloves garlic', '⅓ cup fresh parsley', '⅓ cup fresh cilantro', '¼ cup olive oil', '½ lemon', '¼ cup plain nonfat Greek yogurt', '¼ cup tomato paste', '2 tsp salt', '1 tsp black pepper', '1 tsp garlic powder', '1 tsp onion powder', '1 tsp ground coriander', '1 tsp sumac', '1 tsp ground turmeric', '1 tsp smoked paprika'],
    steps: ['Blend everything except the chicken in a food processor until smooth.', 'Coat the chicken in it. You can do this the night before.', 'Heat the oven to 425°F (220°C). Bake the chicken in a dish covered with foil for 45 minutes.', 'Uncover and bake 15 minutes more, until golden.'],
    src: { by: 'Food Dolls', url: 'https://www.instagram.com/reel/Cm9T-arunpq/', what: 'Middle Eastern baked chicken' } },
  { id: 'm-reel-lemon-chicken', name: 'Lemon Chicken with Lemon Sauce', cat: 'main', serves: 4, size: '1 breast', mins: 35, keeps: 4, freezes: true, week: 3,
    d: 'Thin chicken cutlets in a bright lemon pan sauce made with oil and flour: no butter, no cream.',
    ing: ['4 boneless skinless chicken breasts', '¼ cup lemon juice, for the marinade', '1 tsp salt', '1 tsp dried thyme', '½ tsp paprika', '½ tsp black pepper', '2 tbsp olive oil', '2 tbsp flour', '⅓ cup lemon juice, for the sauce', '2 tbsp parsley, chopped'],
    steps: ['Slice the breasts in half lengthwise and marinate in the lemon juice and spices 15–20 minutes.', 'Cook in a pan over medium-high heat 2–3 minutes a side until cooked through, and set aside.', 'In the same pan whisk the oil and flour into a paste, then whisk in 2 cups water and the sauce lemon juice until it thickens.', 'Pour over the chicken, add the parsley, and pack with rice or potatoes.'],
    src: { by: 'Samara Alkhammach', url: 'https://www.instagram.com/reel/Ckn3tLNuUgT/', what: 'Dairy-free lemon chicken' } },
  { id: 'm-reel-peanut-noodles', name: 'Spicy Peanut Broccoli Chicken Noodles', cat: 'main', serves: 3, size: '1 container', mins: 35, keeps: 3, freezes: false, week: 3,
    d: 'Tender stir-fried chicken and broccoli in a peanut, soy and sriracha sauce over egg noodles.',
    ing: ['2 boneless skinless chicken breasts', '1 tsp baking soda', '2 tbsp soy sauce', '3½ tbsp rice vinegar', '2 tsp minced garlic', '⅛ tsp white pepper', '1 head broccoli, thinly sliced', '1 tbsp cooking oil', '4 tbsp peanut butter', '2 tbsp oyster sauce', '2 tbsp sriracha', '1 tsp sesame oil', '½ bouillon cube', '10 oz egg noodles', '2 green onions, sliced', '2 tbsp roasted peanuts, crushed'],
    steps: ['Cube the chicken, toss with the baking soda, wait 15 minutes, then rinse and pat dry.', 'Stir-fry the chicken in a hot wok with ½ tbsp each of soy sauce and rice vinegar, half the garlic and the white pepper until golden. Take it out.', 'Add the oil and stir-fry the broccoli.', 'Simmer the peanut butter, the rest of the soy sauce and vinegar, the oyster sauce, sriracha, the rest of the garlic, sesame oil and bouillon with ⅓ cup water while the noodles cook.', 'Toss the noodles, chicken and broccoli in the sauce and top with green onions and peanuts. Add a splash of water when you reheat.'],
    src: { by: 'Sara | Nutrient Matters', url: 'https://www.instagram.com/reel/C0MpbsnuITa/', what: 'Spicy peanut chicken noodles' } },
  { id: 'm-reel-chana', name: 'Rice Cooker Chana Masala', cat: 'main', serves: 5, size: '1 cup', mins: 10, keeps: 5, freezes: true, week: 3,
    d: 'Four ingredients and the rice cooker: chickpeas in tomato, ginger and coconut milk. Cheap and meatless.',
    ing: ['3 cups cooked chickpeas', '1 cup crushed tomatoes', '1 tbsp fresh ginger, minced', '3 cloves garlic, minced', '1 can coconut milk (13.5 oz)', '2 tsp garam masala', '½ tsp salt'],
    steps: ['Put everything in the rice cooker and stir.', 'Cook on the white rice setting.', 'Stir, taste for salt, and portion. Serve with rice or flatbread.'],
    note: 'The reel uses only chickpeas, tomatoes, ginger and coconut milk; garlic (mentioned in the video), garam masala and salt are Ironwood’s additions.',
    src: { by: 'serena yau', url: 'https://www.instagram.com/reel/DTlTfsWEq7Z/', what: 'Rice cooker chana masala' } },
  { id: 'm-reel-red-lentil-soup', name: 'Red Lentil Soup (Shorbat Adas)', cat: 'main', serves: 4, size: '1½ cups', mins: 40, keeps: 5, freezes: true, week: 3,
    d: 'The classic Arab lentil soup: red lentils, potato and carrot with cumin, blended smooth and finished with lemon.',
    ing: ['1 tbsp olive oil', '1 large onion, diced', '1 russet potato, diced', '1 cup shredded carrots', '1 tsp ground cumin', '2 tsp paprika', '1 tsp salt', '1 cup red lentils (dry)', '6 cups chicken stock', '1 lemon'],
    steps: ['Cook the onion, potato and carrots in the oil with the cumin, paprika and salt until they soften.', 'Add the lentils and stock (and a bouillon cube if the stock is mild). Boil hard, then cover and simmer about 30 minutes.', 'Blend until smooth and finish with lemon juice. Portion; it thickens in the fridge, so add water when you reheat.'],
    src: { by: '@ahmadalzahabi', url: 'https://www.instagram.com/reel/CqLY5XcDpf4/', what: 'Shorbat adas' } },
  { id: 'm-reel-adas-hamod', name: 'Syrian Sour Lentil Soup (Adas bi Hamod)', cat: 'main', serves: 4, size: '1½ cups', mins: 45, keeps: 5, freezes: true, week: 3,
    d: 'Chunky red lentil soup with potato, crushed garlic and lots of lemon. Vegan and very cheap.',
    ing: ['1½ cups red lentils (dry)', '2 tsp salt', '½ tsp ground turmeric', '3 cloves garlic', '2 lemons', '1 russet potato, diced', '¼ cup olive oil'],
    steps: ['Rinse the lentils well and boil them in 5 cups water on medium about 20 minutes, skimming the foam.', 'Crush the garlic with 1 tsp salt and dice the potato.', 'Add the potato, garlic, turmeric and the rest of the salt. Cook about 15 minutes, adding water if it gets thick.', 'Stir in most of the lemon juice, taste, then turn off the heat and stir in the oil. Serve with more lemon and Aleppo pepper.'],
    note: 'Pumpkin or squash work in place of the potato.',
    src: { by: 'Bayan’s kitchen', url: 'https://www.instagram.com/reel/DCHijiDOXY0/', what: 'Adas bi hamod' } },
  { id: 'm-reel-damset-adas', name: 'Lentils with Garlic-Chili Dagga & Tahini', cat: 'main', serves: 4, size: '1½ cups', mins: 45, keeps: 5, freezes: true, week: 3,
    d: 'Brown lentils simmered thick, then stirred with a mashed garlic, chili and lemon dagga and tahini.',
    ing: ['2 cups brown lentils (dry)', '1 tsp salt', '½ tsp black pepper', '1 tsp ground cumin', '4 cloves garlic', '5 green chilies', '2 lemons', '4 tbsp tahini', '4 tbsp olive oil', '1 tomato, chopped'],
    steps: ['Boil the lentils in 4 cups water with the salt, pepper and cumin for 30–40 minutes, adding a cup more water if it thickens before they’re soft.', 'Mash the garlic and chilies with a pinch of salt and stir in the lemon juice.', 'Stir the dagga, 3 tbsp tahini and the oil into the lentils.', 'Portion, and top with the rest of the tahini and the tomato when you eat it.'],
    src: { by: 'Mohammed Moosa', url: 'https://www.instagram.com/reel/C8oowSCMQRl/', what: 'Damset adas' } },
  { id: 'm-reel-mahmoos', name: 'Mahmoos Gutaifi (Saudi Caramelized Onion Chicken & Rice)', cat: 'main', serves: 6, size: '1 plate', mins: 120, keeps: 4, freezes: true, week: 3, noAuto: true,
    d: 'A weekend pot: onions cooked to deep brown, whole chickens simmered with spices, then broiled while basmati cooks in the broth.',
    ing: ['5 onions, finely chopped', '4 tbsp cooking oil', '2 whole chickens', '2 cups basmati rice (dry)', '3 heads garlic', '1 lime', '3 bay leaves', '4 cardamom pods', '4 whole cloves', '2 cinnamon sticks', '4 dried limes (lumi), optional', '1 tsp black pepper', '1 tsp paprika', '1 tsp ground cinnamon', '1 tsp ground cardamom', '1 tsp garlic powder', '1 tsp ground coriander', '½ tsp ground turmeric', '2 tsp salt'],
    steps: ['Fry the onions in the oil on high 10–15 minutes, then turn the heat to low and keep stirring until they’re dark brown.', 'Add the chickens and sear briefly, then the whole spices, garlic heads, ground spices and 5 cups water. Cover and cook on medium about 30 minutes.', 'Move the chickens to a tray and broil until crisp.', 'Soak the rice 30 minutes, add it to the broth (the liquid should sit a fingertip above the rice) and boil uncovered about 10 minutes.', 'Cover and cook on the lowest heat 20 minutes, then leave the lid on 20 minutes off the heat. Serve the chicken on the rice with lime.'],
    note: 'A long cook for a weekend. Portion the chicken off the bone for the week.',
    src: { by: 'Mohammed Moosa', url: 'https://www.instagram.com/reel/DIOMcpOtqn_/', what: 'Mahmoos gutaifi' } },
  { id: 'm-reel-human-kibble', name: 'Human Kibble (Rice, Bean & Veg Bowls)', cat: 'main', serves: 10, size: '1 bowl', mins: 60, keeps: 4, freezes: true, week: 5,
    d: 'Ten high-fiber bowls in an hour: rice, black beans, peas, sautéed vegetables and an egg each.',
    ing: ['3 cups white rice (dry)', '2 cans black beans (15 oz), rinsed', '2 cups frozen peas', '1 head broccoli, chopped', '4 carrots, diced', '3 zucchini, diced', '2 yellow onions, diced', '2 tbsp olive oil', '2 tsp salt', '10 eggs'],
    steps: ['Start the rice first, since it takes longest.', 'Simmer the beans and peas in a little water until hot.', 'Sauté the broccoli, carrots, zucchini and onions in your biggest pot with the oil and salt until tender.', 'Boil, fry or scramble the eggs (one per bowl).', 'Mix everything and split into ten containers.'],
    note: 'Amounts are Ironwood’s; the reel gave the method only. Add chicken for more protein, and a sauce from Mix & match.',
    src: { by: 'Patrick Kong', url: 'https://www.instagram.com/reel/DUWH06CAayU/', what: 'High-fiber meal prep' } },
  { id: 'm-reel-edamame-salad', name: 'Crunchy Edamame Salad', cat: 'main', serves: 4, size: '1 container', mins: 25, keeps: 4, freezes: false, week: 3,
    d: 'Edamame, quinoa, red cabbage and peanuts with a peanut-ginger dressing. Keeps crunchy all week with the dressing on the side.',
    ing: ['½ cup quinoa (dry)', '2½ cups frozen shelled edamame', '2 cups red cabbage, shredded', '2 cups baby spinach, chopped', '1 cup shredded carrots', '½ cup roasted peanuts', '1 jalapeño, sliced', '1 lime', '½ bunch cilantro', '2 tbsp peanut butter', '2 tbsp white vinegar', '1 tbsp soy sauce', '1 tbsp maple syrup', '3 cloves garlic, minced', '1 tsp fresh ginger, minced', '½ tsp chili flakes'],
    steps: ['Cook the quinoa and let it cool. Thaw or briefly boil the edamame.', 'Whisk the peanut butter, vinegar, soy sauce, maple syrup, garlic, ginger, chili flakes and 2 tbsp water.', 'Toast the peanuts in a dry skillet for a few minutes.', 'Pack the quinoa, edamame, cabbage, spinach, carrots, jalapeño and peanuts, with the dressing, lime and cilantro on the side.'],
    note: 'The creator counts about 485 calories and 26 g protein a serving.',
    src: { by: 'Jenny Bolle', url: 'https://www.instagram.com/reel/CbxiDvJKjZr/', what: 'Crunchy edamame salad' } },
  { id: 'm-reel-sp-chickpea-salad', name: 'Sweet Potato Chickpea Salad with Tahini', cat: 'main', serves: 4, size: '1 container', mins: 35, keeps: 4, freezes: false, week: 3,
    d: 'Roasted Cajun sweet potato, chickpeas and crunchy vegetables with a lemon-tahini dressing.',
    ing: ['1 large sweet potato, cubed', '1 can chickpeas (15 oz), rinsed', '1 red onion, diced', '1 cucumber, diced', '1 carrot, diced', '1 yellow bell pepper, diced', '1 red bell pepper, diced', '1 bunch parsley, chopped', '1 tbsp olive oil', '2 tsp Cajun seasoning', '3 tbsp tahini', '⅓ cup lemon juice', '½ tsp ground cumin', '½ tsp salt'],
    steps: ['Toss the sweet potato with the oil and Cajun seasoning. Air fry at 400°F (200°C) 10–12 minutes, or bake at 425°F (220°C) 25–30 minutes.', 'Chop the other vegetables and parsley.', 'Whisk the tahini, lemon juice, cumin, salt and 1–2 tbsp water.', 'Pack the salad with the dressing on the side.'],
    src: { by: 'Samara Alkhammach', url: 'https://www.instagram.com/reel/CoSOdTyrtJ5/', what: 'Sweet potato chickpea salad' } },
  { id: 'm-reel-steamed-chicken', name: 'Juicy Pan-Steamed Chicken Breast', cat: 'base', serves: 6, size: '4 oz cooked', mins: 30, keeps: 4, freezes: true, week: 4,
    d: 'Sear one side, add water, cover and turn the heat off: the easiest way to keep batch chicken breast juicy.',
    ing: ['2 lb boneless skinless chicken breast', '1 tbsp olive oil', '1 tsp salt', '½ tsp black pepper', '1 tsp garlic powder', '1 tsp paprika'],
    steps: ['Season the chicken well on both sides.', 'Heat the oil in a pan over medium heat and cook the chicken 5 minutes without moving it.', 'Flip, add about 1 cup water and cover. Keep the heat on 2 minutes (4 for a thin pan or big breasts), then turn it off.', 'Leave it covered and untouched 15 minutes, rest a few minutes more, then slice.'],
    note: 'Amounts are Ironwood’s; the reel teaches the method with any seasoning. Use it with any Mix & match flavor.',
    src: { by: 'smalltowninfluencer', url: 'https://www.instagram.com/reel/DGwsZ_evJO3/', what: 'Pan-steamed chicken breast' } },
  { id: 'm-reel-vermicelli-rice', name: 'Rice with Vermicelli (Riz bi Shaariyeh)', cat: 'base', serves: 6, size: '¾ cup cooked', mins: 35, keeps: 4, freezes: true, week: 4,
    d: 'Lebanese everyday rice: vermicelli toasted in ghee, then cooked with the rice. Goes with any stew or tray bake.',
    ing: ['1½ cups medium-grain rice (dry)', '1 tbsp ghee', '2 oz vermicelli noodles', '1 tsp salt'],
    steps: ['Wash the rice until the water runs clear.', 'Melt the ghee in a pot, crush the vermicelli in by hand and stir until light brown.', 'Add the rice, 3 cups water and the salt. Cover and bring to a boil.', 'Simmer on low about 25 minutes, until the water is gone.'],
    src: { by: 'Sunday Kitchen', url: 'https://www.instagram.com/reel/DKyxqVSzynZ/', what: 'Rice with vermicelli' } },
  { id: 'm-reel-mayak-eggs', name: 'Korean Mayak Eggs', cat: 'snack', serves: 3, size: '2 eggs', mins: 20, keeps: 5, freezes: false, week: 5,
    d: 'Jammy eggs marinated overnight in sweet-spicy soy with garlic, chilies and sesame. Great over rice.',
    ing: ['6 eggs', '¾ cup soy sauce', '¼ cup sugar', '¼ cup rice vinegar', '1 tbsp sesame oil', '1 tbsp gochugaru', '1 tbsp sesame seeds', '4 cloves garlic, minced', '1 jalapeño, finely diced', '1 Fresno pepper, thinly sliced'],
    steps: ['Lower the eggs into boiling water and cook 6–7 minutes for jammy yolks. Cool in ice water and peel.', 'Stir everything else with ½ cup water.', 'Put the eggs in, making sure they’re covered, and refrigerate overnight.', 'Eat over rice with a spoon of the marinade.'],
    note: 'Nutrition counts 2 eggs and about a tablespoon of the marinade each, since most of it is left over. Reuse it for a second batch within a few days.',
    macros: { kcal: 165, p: 13, c: 5, f: 10, fib: 0, sug: 4, na: 700 },
    src: { by: 'Alexa Santos', url: 'https://www.instagram.com/reel/C4T1FJPPgOT/', what: 'Korean marinated eggs' } },
  { id: 'm-reel-banana-oatmeal', name: 'Banana Bread Baked Oatmeal', cat: 'breakfast', serves: 7, size: '1 square', mins: 40, keeps: 5, freezes: true, week: 5,
    d: 'Dairy-free baked oats that taste like banana bread. One pan covers a week of breakfasts.',
    ing: ['2 large ripe bananas, mashed', '1⅓ cups oat milk', '¼ cup peanut butter', '4 tbsp maple syrup', '¼ tsp salt', '2 cups rolled oats', '2 tsp baking powder', '¼ cup chocolate chips', '1 banana, sliced, for the top'],
    steps: ['Heat the oven to 400°F (200°C). Mash the bananas in a baking dish and mix in the oat milk, peanut butter, maple syrup and salt.', 'Stir in the oats, baking powder and chocolate chips.', 'Lay the banana slices on top.', 'Bake 30–35 minutes, cool, and cut into seven squares. Reheat 30–60 seconds.'],
    src: { by: '@maya.plantbased', url: 'https://www.instagram.com/reel/CqqqboeKYba/', what: 'Banana bread baked oatmeal' } },
  { id: 'm-reel-brownie-oatmeal', name: 'Brownie Baked Oatmeal', cat: 'breakfast', serves: 6, size: '1 square', mins: 50, keeps: 5, freezes: true, week: 5,
    d: 'Chocolate peanut butter baked oats, dairy-free. Breakfast that tastes like dessert.',
    ing: ['2 cups coconut milk', '½ cup maple syrup', '⅓ cup peanut butter', '1 tsp vanilla extract', '2 cups rolled oats', '¼ cup cocoa powder', '1 tsp baking powder', '1 tbsp ground flax', '¼ tsp salt', '⅓ cup chocolate chips'],
    steps: ['Heat the oven to 350°F (175°C).', 'Whisk the coconut milk, maple syrup, peanut butter and vanilla, then stir in the oats, cocoa, baking powder, flax and salt. Fold in the chocolate chips.', 'Pour into a 6×9 pan and bake 40 minutes.', 'Cool, cut into six squares and keep in the fridge. Reheat to serve.'],
    note: 'Counted with light canned coconut milk; a carton of coconut milk works too.',
    src: { by: '@healthygirlkitchen', url: 'https://www.instagram.com/reel/Cc0HFw1JAuq/', what: 'Vegan brownie baked oatmeal' } },
  { id: 'm-reel-tahini-granola', name: 'Spiced Tahini Granola', cat: 'breakfast', serves: 16, size: '½ cup', mins: 40, keeps: 30, freezes: true, week: 5,
    d: 'Oats, nuts and seeds baked with tahini, maple and warm spices. Keeps for weeks in a jar; great on Greek yogurt.',
    ing: ['3 cups rolled oats', '1 cup almonds, chopped', '1 cup walnuts, chopped', '½ cup pumpkin seeds', '½ cup sunflower seeds', '¼ cup hemp seeds', '1 tsp ground cinnamon', '1 tsp ground ginger', '1 tsp ground nutmeg', '¾ tsp salt', '½ cup tahini', '½ cup maple syrup', '½ cup olive oil', '1 tsp vanilla extract'],
    steps: ['Heat the oven to 320°F (160°C) and get two sheet pans ready.', 'Mix the oats, nuts, seeds, spices and salt.', 'Warm the tahini, maple syrup, oil and vanilla in a small pot, pour over and coat everything.', 'Press it thin and flat on the pans. Bake 20 minutes, turn the pans, and bake 5–10 minutes more, watching so it doesn’t burn.', 'Cool completely before breaking into jars.'],
    src: { by: 'Terianncarty', url: 'https://www.instagram.com/reel/ComviwOrZS0/', what: 'Spiced tahini granola' } },
);
const MEAL_BUILTIN = Object.fromEntries(MEAL_LIB.map(r => [r.id, { ...r, builtin: true, ing: r.ing.map(parseIng).filter(Boolean) }]));
const ML = () => { if (!S.meta.meals || !S.meta.meals.plan) S.meta.meals = normMeals(S.meta.meals); return S.meta.meals; };
/* Recipes as written; getRecipe gives them with your food-preference swaps (foodprefs.js) */
const _ownRec = new Map();
function getRecipeRaw(id) {
  const own = ML().recipes[id]; const b = MEAL_BUILTIN[id];
  if (own) { const c = _ownRec.get(id); if (c && c.src === own) return c.r; const r = { ...own, id, builtin: !!b, edited: !!b }; _ownRec.set(id, { src: own, r }); return r; }
  return b || comboRecipe(id);
}
function getRecipe(id) { const r = getRecipeRaw(id); return r && typeof swapRecipe === 'function' ? swapRecipe(r) : r; }
function allRecipes() {
  const ids = [...Object.keys(MEAL_BUILTIN), ...Object.keys(ML().recipes).filter(k => !MEAL_BUILTIN[k])];
  return ids.map(getRecipe).filter(Boolean);
}
const planItemFor = id => ML().plan.items.find(i => i.r === id);
const mealCommit = fn => commit(st => { st.meta.meals = normMeals(st.meta.meals); fn(st.meta.meals); }, 'meta');
function addToPlan(id, n) {
  const r = getRecipe(id); if (!r) return;
  mealCommit(m => { delete m.plan.fromMenu; const it = m.plan.items.find(i => i.r === id); if (it) it.n = n || it.n; else m.plan.items.push({ id: uid('mp'), r: id, n: n || r.week || 3 }); });
  showToast({ kind: 'info', text: r.name + ' added to this week', action: 'Undo', ms: 5000, fn: () => mealCommit(m => { m.plan.items = m.plan.items.filter(i => i.r !== id); }) });
}
const removeFromPlan = id => mealCommit(m => { delete m.plan.fromMenu; m.plan.items = m.plan.items.filter(i => i.r !== id); });
function servingsFor(it) { const P = ML().plan; return servingsOver(it.n, spanDays(P), P.people); }
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
    const ez = easyShop(e); if (ez) return { ...e, qty: ez.qty, label: ez.label };
    const parts = Object.values(e.fams).map(x => measure(x.total, x.fam, true));
    const qty = parts.map(([v, u, dec]) => qtyText(v, u, dec)).join(' + ');
    const name = parts.length === 1 && !parts[0][1] ? nameFor(e.name, parts[0][0], '') : e.name;
    return { ...e, qty, label: name };
  });
}
function listText() {
  const P = ML().plan; const items = shoppingList(); const m = ML(); const out = ['Ironwood shopping list · ' + P.people + (P.people === 1 ? ' person' : ' people') + ' · ' + (P.start ? rangeText(parseYmd(P.start), spanDays(P)) : daysTxt(spanDays(P)))];
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
  useEffect(() => { rotCheck(); }, []);
  const vt = view && view.type;
  if (vt === 'meal') return html`<${RecipeView} key=${view.id} id=${view.id}/>`;
  if (vt === 'mealEdit') return html`<${RecipeEditor} view=${view}/>`;
  if (vt === 'foods') return html`<${MyFoods}/>`;
  if (vt === 'eatReview') return html`<${EatReview}/>`;
  if (vt === 'base') return html`<${BaseView} key=${view.id} id=${view.id}/>`;
  return html`<div><${TopSwitch} value=${MEALS.mode} options=${[['log', 'Today'], ['plan', 'Week'], ['recipes', 'Recipes'], ['list', 'Shopping']]} onChange=${setMealsMode}/>
    ${MEALS.mode === 'log' ? html`<${LogPane}/>` : MEALS.mode === 'recipes' ? html`<${RecipesPane}/>` : MEALS.mode === 'list' ? html`<${ShopPane}/>` : html`<${PrepPane}/>`}
    <button class="fab" id="meal-fab" hidden=${MEALS.mode === 'log'} aria-label="Log food" onClick=${() => openSheet({ type: 'mealLog', day: MEALS.mode === 'log' && MEALS.day ? MEALS.day : ymd(new Date()) })}>${I.plus}</button></div>`;
}
function keepNote(r, it) {
  const P = ML().plan; const keeps = r.keeps || 4;
  if (spanDays(P) > 7) return r.freezes ? 'Lasts ' + keeps + (keeps === 1 ? ' day' : ' days') + ' in the fridge. Freeze the portions for later weeks.' : 'Doesn’t freeze well. Make this fresh each week rather than all at once.';
  const dd = n => n + (n === 1 ? ' day' : ' days'); const once = typeof mealHabits === 'function' && mealHabits().prep === 'once';
  if (it.n > keeps && keeps < 7) return r.freezes ? 'Lasts ' + dd(keeps) + ' in the fridge. Freeze what you’ll eat after day ' + keeps + '.' : once ? 'Lasts ' + dd(keeps) + ' in the fridge and doesn’t freeze well: eat it early in the week.' : 'Lasts ' + dd(keeps) + ' in the fridge. Make a second batch midweek.';
  return null;
}
const PREP_UI = { ready: false, open: null, all: false };
/* Clear this week (Nov 11, Newt): drops the meal plan, what you'll cook and the shopping ticks, and stops a rotation.
   Keeps saved preps, your recipes, food log, answers, food preferences and skipped meals. */
function clearMealPlan() {
  openSheet({ type: 'confirm', danger: true, title: 'Clear everything and start over?', body: 'This can’t be undone. It clears your meal plan, what you’ll cook, the shopping list and your extra items' + (ML().rot ? ', and stops your rotation' : '') + '. Saved preps, your recipes, stars, answers, food preferences and skipped meals stay. To change one thing instead, close this and use the options above it.', ok: 'Clear everything', onOk: () => {
    mealCommit(mm => { delete mm.menu; delete mm.rot; mm.plan.items = []; delete mm.plan.fromMenu; mm.checks = {}; mm.extras = []; });
    closeSheet(); PREP_UI.open = null; showToast({ kind: 'info', text: 'Cleared. Plan my week starts fresh.' }); } });
}
/* Change or clear this week (Nov 11, Newt): smaller changes first, Clear everything last, with a warning */
function WeekTools() {
  const m = ML(); const P = m.plan; const nSkip = Object.keys(m.skip || {}).length; const nTick = Object.values(m.checks || {}).filter(Boolean).length;
  const ask = (title, body, ok, fn) => openSheet({ type: 'confirm', title, body, ok, onOk: () => { fn(); closeSheet(); } });
  const opts = [
    m.menu && ['wt-reroll', 'Different meals', 'New picks for the week with the same settings and skips.', () => { const nm = buildMenu(m.menu.t, (m.menu.seed + 7919) % 1e6); if (!nm) return showToast({ kind: 'info', text: 'Not enough other recipes fit your answers.' }); mealCommit(mm => { mm.menu = nm; }); if (ML().plan.fromMenu && !ML().rot) usePlanForPrep(true, true); showToast({ kind: 'info', text: 'New meals for the week.' }); }],
    ['wt-settings', 'Change plan settings', 'Calories, food preferences, how you eat, kitchen gear.', () => openSheet({ type: 'mealTargets' })],
    nSkip && ['wt-unskip', 'Bring back skipped meals', nSkip + ' meal' + (nSkip === 1 ? ' is' : 's are') + ' marked as covered elsewhere.', () => ask('Bring back skipped meals?', 'They go back into your cooking and shopping list.', 'Bring them back', () => { mealCommit(mm => { delete mm.skip; }); if (ML().plan.fromMenu && !ML().rot) usePlanForPrep(true, true); })],
    nTick && ['wt-untick', 'Untick the shopping list', nTick + ' item' + (nTick === 1 ? '' : 's') + ' ticked. Start the shopping list fresh.', () => ask('Untick the shopping list?', 'Every item goes back to not bought. Nothing else changes.', 'Untick all', () => mealCommit(mm => { mm.checks = {}; }))],
    m.menu && ['wt-drop-menu', 'Remove the meal plan only', 'Keeps what you’ll cook and the shopping list; drops the day-by-day meals.', () => ask('Remove the meal plan?', 'The day-by-day meals go away. What you’ll cook and your shopping list stay, so you can change them by hand.', 'Remove it', () => mealCommit(mm => { delete mm.menu; delete mm.plan.fromMenu; }))],
    P.items.length && ['wt-empty-cook', 'Empty what you’ll cook', 'Takes every recipe out of this week' + (m.menu ? '; the meal plan stays and can fill it again' : '') + '.', () => ask('Empty what you’ll cook?', 'Every recipe comes out of this week and the shopping list starts fresh.' + (m.menu ? ' Your meal plan stays; tap Use these meals to fill it again.' : ''), 'Empty it', () => mealCommit(mm => { mm.plan.items = []; delete mm.plan.fromMenu; mm.checks = {}; delete mm.rot; }))],
  ].filter(Boolean);
  if (!m.menu && !P.items.length) return null;
  return html`<div class="card" id="week-tools" style="margin-top:18px"><div style="font-weight:700">Change or clear this week</div>
    <div class="stack" style="gap:2px;margin-top:6px">${opts.map(([id, l, d, fn]) => html`<button key=${id} class="opt" id=${id} onClick=${fn}><div style="flex:1"><div>${l}</div><div class="d">${d}</div></div></button>`)}</div>
    <button class="btn text wide" id="plan-clear" style="margin-top:8px;color:var(--stop,#c0392b)" onClick=${clearMealPlan}>${I.x} Clear everything and start over</button>
    <p class="small muted" style="text-align:center;margin-top:2px">Asks first. Saved preps, recipes and preferences stay.</p></div>`;
}
function PrepPane() {
  const m = ML(); const P = m.plan; const items = P.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r);
  const setP = (k, v) => mealCommit(mm => { mm.plan[k] = v; });
  const total = items.reduce((a, x) => a + servingsFor(x.it), 0);
  const withM = items.map(x => ({ ...x, m: macros(x.r) })).filter(x => x.m); const partial = withM.length < items.length || withM.some(x => x.m.missing.length);
  const perDay = Object.fromEntries(MACRO_KEYS.map(([k]) => [k, Math.round(withM.reduce((a, x) => a + x.m[k] * x.it.n, 0) / 7)]));
  const mins = items.reduce((a, x) => a + (+x.r.mins || 0), 0);
  const usePrep = (pr, ok) => {
    const bad = pr.items.filter(([r]) => getRecipe(r) && recipeIssues(getRecipe(r)).block.length);
    if (bad.length && !ok) return openSheet({ type: 'confirm', title: 'Some of ' + pr.name + ' goes against your food preferences', body: bad.map(([r]) => getRecipe(r).name + ' (' + recipeIssues(getRecipe(r)).block.join(', ') + ')').join('; ') + '.',
      ok: 'Leave those out', onOk: () => { closeSheet(); setTimeout(() => usePrep({ ...pr, items: pr.items.filter(x => !bad.includes(x)) }, true), 60); }, alt: 'Use all of it', onAlt: () => { closeSheet(); setTimeout(() => usePrep(pr, true), 60); } });
    const apply = replace => { mealCommit(mm => { delete mm.plan.fromMenu; if (replace) mm.plan.items = []; for (const [r, n] of pr.items) { if (!getRecipe(r)) continue; const ex = mm.plan.items.find(i => i.r === r); if (ex) ex.n = n; else mm.plan.items.push({ id: uid('mp'), r, n }); } }); closeSheet(); scrollTo(0, 0); };
    if (!P.items.length) apply(true);
    else openSheet({ type: 'confirm', title: 'Use ' + pr.name + '?', body: 'Replace this week’s cooking, or add these recipes to it.', ok: 'Replace my prep', onOk: () => apply(true), alt: 'Add to my prep', onAlt: () => apply(false) });
  };
  /* This week (Nov 10, meal audit M2, M3, M5): one place for what you'll eat and cook. Empty, it offers one main way in
     (Plan my week) and two others; filled, it shows the plan, then the cooking, people and weeks, and rotation. */
  const empty = !items.length && !(m.menu && m.menu.days && m.menu.days.length);
  const [more, setMore] = useState(false);
  const readyOpen = more || PREP_UI.ready;
  return html`<div>
    <div class="row" style="margin:-4px 0 4px"><button class="btn text" id="meals-tour-btn" style="padding-left:0;flex:1;justify-content:flex-start" onClick=${() => startTour('meals')}><span class="help-q" aria-hidden="true">?</span> How Meals works</button>
      </div>
    <${DatesBar}/>
    ${empty ? html`<div class="card plan-cta" id="plan-cta"><div style="font-weight:700">Plan your week</div>
        <p class="small muted" style="margin:2px 0 10px">A few questions and Ironwood picks a week of meals with portions, then fills your cooking and shopping list.</p>
        <button class="btn primary wide" id="plan-start" onClick=${() => openSheet({ type: 'mealTargets' })}>Plan my week</button>
        ${Object.keys(ML().stars || {}).length ? html`<button class="btn wide" id="plan-stars" style="margin-top:8px" onClick=${planFromStars}><span class="st" aria-hidden="true">★</span> Plan from my ${Object.keys(ML().stars).length} starred recipes</button>` : null}
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn" style="flex:1" id="week-ready" onClick=${() => { PREP_UI.all = true; S.rerender(); const el = document.getElementById('ready-preps'); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); }}>Use a ready-made prep</button><button class="btn" style="flex:1" id="week-pick" onClick=${() => setMealsMode('recipes')}>Pick recipes myself</button></div>
        <button class="btn text" id="plan-whole" style="padding-left:0" onClick=${() => openSheet({ type: 'goalSetup' })}>Or build a training plan and meals together</button></div>`
      : html`<${MenuCard}/>`}
    ${items.length ? html`
    <div class="section-h"><h2>What you’ll cook</h2><span class="aside num">${total} serving${total === 1 ? '' : 's'}</span></div>
    <div class="card mp-who">
      <div class="mp-cell"><div class="lbl">People</div><${MStep} label="people" value=${P.people} min=${1} max=${12} onChange=${v => setP('people', v)}/></div>
      <div class="mp-cell"><div class="lbl">Days</div><${MStep} label="days" value=${spanDays(P)} min=${1} max=${28} onChange=${v => setPlanDates(P.start ? parseYmd(P.start) : null, v)}/></div>
    </div>
    <${Tip} id="meal-prep" style="margin-top:10px">Set how many times each person eats a meal. Recipes and the shopping list scale to match. Swap trades a recipe for another.<//>` : null}
    ${items.length ? html`<div class="stack">${items.map(({ it, r }) => {
      const sv = servingsFor(it); const f = sv / (r.serves || 1); const kn = keepNote(r, it);
      return html`<div key=${it.id} class="mp-item">
        <div class="row" style="align-items:flex-start"><button class="mp-name" onClick=${() => UI.setView({ type: 'meal', id: r.id })}><div class="t">${r.name}</div>
          <div class="s num">${sv} serving${sv === 1 ? '' : 's'} · ${Math.abs(f - 1) < 0.01 ? '1 batch' : fracStr(f) + ' × recipe'}${macros(r) ? ' · ' + macroLine(macros(r)) + ' each' : ''}</div></button>
          <button class="btn mp-swap" id=${'mp-swap-' + r.id} aria-label=${'Swap ' + r.name + ' for another recipe'} onClick=${() => swapPlanItem(it.id)}>${I.swap} Swap</button>
          <button class="tip-x" aria-label=${'Remove ' + r.name} onClick=${() => removeFromPlan(r.id)}>${I.x}</button></div>
        ${(() => { const dd = spanDays(P); const short = dd < 7; const setN = n => mealCommit(mm => { const x = mm.plan.items.find(i => i.id === it.id); if (x) x.n = n; });
          return html`<div class="row"><span class="small muted" style="flex:1">${short ? 'Times in these ' + dd + ' days' : 'Times a week'}${P.people > 1 ? ', per person' : ''}</span>${short
            ? html`<${MStep} label=${'times in these days for ' + r.name} value=${servingsOver(it.n, dd)} min=${1} max=${Math.max(1, Math.floor(3 * dd))} onChange=${v => setN(round2(v * 7 / dd))}/>`
            : html`<${MStep} label=${'times a week for ' + r.name} value=${Math.max(1, Math.round(it.n))} min=${1} max=${21} onChange=${setN}/>`}</div>`; })()}
        ${kn ? html`<div class="mp-warn">${kn}</div>` : null}</div>`; })}</div>
      ${sharedBases(items).map(({ base, list }) => html`<div key=${base.id} class="tip-card mix-share" style="margin-top:10px;padding-right:14px">${list.map(x => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} use the same base, so make them in one session: ${list.every(x => MIX_FLAVOR[x.mix.flavor].kind === 'sauce') ? 'cook the ' + base.name.toLowerCase() + ' together, then split it and add each sauce.' : 'season each portion on its own before it cooks, and add any sauce after.'}</div>`)}
      ${withM.length || mins ? html`<div class="card mp-sum" id="prep-macros">
        ${withM.length ? html`<div style="font-weight:700">${partial ? 'At least, a day' : 'A day, on average'}${P.people > 1 ? ', per person' : ''}</div><${MacroTiles} m=${perDay}/>
          <div class="small muted">Estimated from the ingredients. Counts only what you’ll cook for these dates.</div>` : null}
        ${mins ? html`<div class="small muted">About ${mins >= 60 ? Math.floor(mins / 60) + ' hr ' + (mins % 60 ? (mins % 60) + ' min' : '') : mins + ' min'} of cooking if you make them one after another. Less with the oven and stove going together.</div>` : null}</div>` : null}
      <div class="row" style="margin-top:12px"><button class="btn primary" style="flex:1" id="to-list" onClick=${() => setMealsMode('list')}>Shopping list</button><button class="btn" style="flex:1" onClick=${() => setMealsMode('recipes')}>${I.plus} Add recipes</button></div>
      <button class="btn ghost wide" style="margin-top:8px" id="prep-save" onClick=${() => openSheet({ type: 'prepSave' })}>Save this prep for later</button>`
    : null}
    ${Object.keys(m.preps).length ? html`<div class="section-h"><h2>Saved preps</h2></div>
      <div class="stack">${Object.values(m.preps).map(pr => html`<div key=${pr.id} class="r-card prep-card" id=${'myprep-' + pr.id}>
        <div class="row"><h3 style="flex:1">${pr.name}</h3><button class="tip-x" aria-label=${'Delete ' + pr.name} onClick=${() => deleteMyPrep(pr)}>${I.x}</button></div>
        <div class="small faint">${pr.items.map(([r]) => (getRecipe(r) || {}).name).filter(Boolean).join(' · ')}</div>
        <div class="row" style="margin-top:6px;gap:8px"><button class="btn" style="flex:1" onClick=${() => usePrep(pr)}>Use this prep</button><button class="btn" style="flex:1" onClick=${() => openUsePrep(pr)}>Swap recipes or plan it</button></div></div>`)}</div>` : null}
    <div id="ready-preps"><div class="section-h"><h2>Ready-made preps</h2></div>
    <p class="small muted" style="margin:-4px 0 8px">A whole week of cooking in one tap. Tap one to see what’s in it.</p>
    ${(() => { const list = readyPreps(); const n = empty ? 4 : 0; const shown = PREP_UI.all || PREP_UI.ready ? list : list.filter((pr, i) => i < n || PREP_UI.open === pr.id);
      return html`<div class="ready-list">${shown.map(pr => { const open = PREP_UI.ready || PREP_UI.open === pr.id; const fit = prepFits(pr); const sw = prepSwaps(pr);
      return html`<div key=${pr.id} class=${'prep-card ready-row' + (open ? ' open' : '')}>
      <button class="ready-h" aria-expanded=${open} onClick=${() => { PREP_UI.open = open ? null : pr.id; setMore(!more); }}><span style="flex:1;min-width:0"><b>${pr.name}</b>${fit ? html`<span class="fit-tag">Picked for your food preferences</span>` : null}<span class="small muted" style="display:block">${pr.items.length} recipes${prepIssues(pr).length ? ' · has ' + prepIssues(pr).join(', ') : sw.length ? ' · ' + sw.length + ' swap' + (sw.length === 1 ? '' : 's') + ' for you' : ''}</span></span>${open ? I.up : I.down}</button>
      ${open ? html`<div class="small" style="margin:2px 0 6px">${pr.d}</div><div class="small faint">${pr.items.map(([r]) => (getRecipe(r) || {}).name).filter(Boolean).join(' · ')}</div>
        ${sw.length ? html`<div class="small" style="margin-top:6px">Swapped for you: ${sw.join(' · ')}</div>` : null}
        <div class="row" style="margin-top:8px;gap:8px"><button class="btn primary" style="flex:1" onClick=${() => usePrep(pr)}>Use this prep</button><button class="btn" style="flex:1" id=${'ready-swap-' + pr.id} onClick=${() => openUsePrep(pr)}>Swap recipes or plan it</button></div>` : null}</div>`; })}</div>
      ${list.length > n ? html`<button class="btn wide" id="ready-more" style="margin-top:8px" aria-expanded=${PREP_UI.all} onClick=${() => { PREP_UI.all = !PREP_UI.all; setMore(!more); }}>${PREP_UI.all ? 'Show fewer' : n ? 'Show all ' + list.length + ' ready-made preps' : 'Browse ' + list.length + ' ready-made preps'}</button>` : null}`; })()}</div>
    <${ComingUp}/>
    <${RotationCard}/>
    <${WeekTools}/>
  </div>`;
}
/* ---- Saved preps and the weekly rotation (Oct 29) ----
   meals.preps: { id: { id, name, items: [[recipe id, times a week]] } } (preps you save). meals.rot: { ids: [prep ids, 2–4],
   start: first day 'YYYY-MM-DD', applied: prep-week start last loaded }. Weeks start on your prep day (meals.prepDay,
   Sunday by default; Monday before Nov 11). Each new week the next prep in the list replaces your prep
   and the shopping list starts fresh. */
const allPreps = () => Object.values(ML().preps).concat(MEAL_PREPS);
const prepById = id => ML().preps[id] || MEAL_PREPS.find(p => p.id === id) || null;
const thisMonday = () => ymd(prepWeekStart());   /* the start of this prep week (named before prep days existed) */
function rotIndex(rot, day) { const wk = Math.round((+prepWeekStart(day || new Date()) - +prepWeekStart(parseYmd(rot.start))) / (7 * DAY)); const n = rot.ids.length; return wk < 0 ? -1 : ((wk % n) + n) % n; }
function rotCheck() {
  if (nextCheck()) return true;
  const rot = ML().rot; if (!rot) return false; const mon = thisMonday(); if (rot.applied && ymd(prepWeekStart(parseYmd(rot.applied))) === mon) return false;   /* also covers a Monday saved before prep days */
  const P0 = ML().plan; if (P0.src === 'next' && !planEnded(P0)) return false;   /* a plan you set ahead wins until it ends */
  const i = rotIndex(rot); if (i < 0) return false; const pr = prepById(rot.ids[i]); if (!pr) return false;
  const blocked = pr.items.filter(([r]) => getRecipe(r) && recipeIssues(getRecipe(r)).block.length).map(([r]) => getRecipe(r).name);
  mealCommit(mm => { delete mm.plan.fromMenu; mm.plan.items = pr.items.filter(([r]) => getRecipe(r) && !recipeIssues(getRecipe(r)).block.length).map(([r, n]) => ({ id: uid('mp'), r, n })); mm.checks = {}; mm.rot = { ...mm.rot, applied: mon }; mm.plan.start = mon; mm.plan.days = 7; mm.plan.weeks = 1; mm.plan.src = 'rot'; });
  showToast({ kind: 'info', ms: blocked.length ? 9000 : 4000, text: 'This week’s prep: ' + pr.name + '.' + (blocked.length ? ' Left out for your food preferences: ' + blocked.join(', ') + '.' : '') + ' Your shopping list is ready.' }); return true;
}
function deleteMyPrep(pr) {
  const inRot = ML().rot && ML().rot.ids.includes(pr.id);
  openSheet({ type: 'confirm', title: 'Delete ' + pr.name + '?', body: inRot ? 'It also leaves your rotation.' : 'Your recipes stay.', ok: 'Delete prep', danger: true, onOk: () => { mealCommit(mm => { delete mm.preps[pr.id]; if (mm.rot) { mm.rot.ids = mm.rot.ids.filter(x => x !== pr.id); if (mm.rot.ids.length < 2) delete mm.rot; } }); closeSheet(); } });
}
function PrepSaveSheet() {
  const P = ML().plan; const [name, setName] = useState('My prep ' + (Object.keys(ML().preps).length + 1));
  const save = () => { const id = uid('pp'); mealCommit(mm => { mm.preps[id] = { id, name: name.trim() || 'My prep', d: '', items: mm.plan.items.map(i => [i.r, i.n]) }; }); closeSheet(); showToast({ kind: 'info', text: (name.trim() || 'My prep') + ' saved. Use it again or put it in a rotation.' }); };
  return html`<${Sheet} label="Save this prep"><h2>Save this prep</h2><p class="note">${P.items.length} recipe${P.items.length === 1 ? '' : 's'}, with how many times a week each.</p>
    <div class="stack" style="margin-top:12px"><div><label class="lbl" for="ps-name">Name</label><input class="field" id="ps-name" value=${name} onInput=${e => setName(e.target.value)}/></div>
      <button class="btn primary wide" id="ps-save" onClick=${save}>Save prep</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
function RotationCard() {
  const rot = ML().rot;
  if (!rot) return html`<div class="card" style="margin-top:14px" id="rot-card"><div style="font-weight:700">Rotate preps week by week</div>
    <p class="small muted" style="margin:2px 0 10px">Pick 2 to 4 preps. Each ${DOW_FULL[prepDow()]} the next one becomes that week’s cooking, shopping list included, so dinners don’t repeat every week.</p>
    <button class="btn wide" id="rot-setup" onClick=${() => openSheet({ type: 'rotation' })}>Set up a rotation</button></div>`;
  const i = rotIndex(rot); const n = rot.ids.length; const name = k => (prepById(rot.ids[k]) || {}).name || 'A deleted prep';
  return html`<div class="card" style="margin-top:14px" id="rot-card"><div class="row"><div style="flex:1;min-width:0"><div class="eyebrow">Rotation · ${n} preps</div>
      <div style="font-weight:700">${i < 0 ? 'Starts ' + shortDate(+parseYmd(rot.start)) + ' with ' + name(0) : 'This week: ' + name(i)}</div>
      <div class="small muted">${i < 0 ? '' : 'Week ' + (i + 1) + ' of ' + n + ' · '}Next week: ${name(i < 0 ? 1 % n : (i + 1) % n)}</div></div></div>
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn" style="flex:1" id="rot-edit" onClick=${() => openSheet({ type: 'rotation' })}>Edit</button>
      <button class="btn text" id="rot-stop" onClick=${() => mealCommit(mm => { delete mm.rot; })}>Stop rotating</button></div></div>`;
}
function RotationSheet() {
  const rot = ML().rot; const [ids, setIds] = useState(rot ? rot.ids.filter(prepById) : []); const [when, setWhen] = useState(rot ? 'keep' : 'now');
  const tap = id => setIds(ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 4 ? ids : ids.concat(id));
  const save = () => {
    const start = when === 'keep' && rot ? rot.start : when === 'next' ? ymd(addDays(prepWeekStart(), 7)) : thisMonday();
    mealCommit(mm => { mm.rot = { ids, start, applied: when === 'keep' && rot ? rot.applied : null }; });
    closeSheet(); if (when !== 'keep') rotCheck(); else S.rerender();
  };
  return html`<${Sheet} label="Prep rotation"><h2>Prep rotation</h2><p class="note">Tap 2 to 4 preps in the order you want them. Each ${DOW_FULL[prepDow()]} (your prep day) the next one loads.</p>
    <div class="stack" style="margin-top:10px">${allPreps().map(pr => { const k = ids.indexOf(pr.id);
      return html`<button key=${pr.id} class=${'opt' + (k >= 0 ? ' on' : '')} id=${'rot-' + pr.id} aria-pressed=${k >= 0} onClick=${() => tap(pr.id)}><div style="flex:1;min-width:0"><div>${pr.name}</div><div class="d">${pr.items.length} recipes${ML().preps[pr.id] ? ' · yours' : ''}</div></div>${k >= 0 ? html`<span class="chip on">Week ${k + 1}</span>` : null}</button>`; })}</div>
    <div class="seg wide" role="group" aria-label="Start" style="margin-top:12px">${(rot ? [['keep', 'Keep its place'], ['now', 'Restart this week'], ['next', 'Restart next week']] : [['now', 'Start this week'], ['next', 'Start next week']]).map(([k, l]) => html`<button key=${k} class=${when === k ? 'on' : ''} aria-pressed=${when === k} onClick=${() => setWhen(k)}>${l}</button>`)}</div>
    ${when === 'now' && ML().plan.items.length ? html`<p class="small muted" style="margin-top:6px">Your current prep is replaced by week 1. Save it first if you want to keep it.</p>` : null}
    <div class="stack" style="margin-top:12px"><button class="btn primary wide" id="rot-save" disabled=${ids.length < 2} onClick=${save}>${ids.length < 2 ? 'Pick at least 2' : 'Save rotation'}</button><button class="btn wide" onClick=${closeSheet}>Cancel</button></div><//>`;
}
const REC_MORE = {};
/* Starred recipes (Nov 11, Newt): meals.stars = { id: true }. With "Plan from my starred recipes" on (habits.starred),
   the meal plan is built from them and rebuilds itself whenever you star or unstar one. */
/* Plan from my starred recipes: turns the setting on and builds the week (asks the setup questions first if needed) */
function planFromStars() {
  mealCommit(m => { m.habits = { ...mealHabits(), starred: true }; });
  const t = (ML().menu && ML().menu.t) || (ML().goals && ML().goals.kcal && ML().goals.p ? ML().goals : null);
  if (!t || !ML().me) return openSheet({ type: 'mealTargets', step: 2 });
  const nm = buildMenu(t, Date.now() % 1e6); if (!nm) return showToast({ kind: 'info', text: 'Star a few more recipes first: at least one breakfast and two lunches or dinners.' });
  mealCommit(m => { m.menu = nm; });
  if (!(ML().plan.items.length && !ML().plan.fromMenu) && !ML().rot) usePlanForPrep(true, true);
  showToast({ kind: 'info', text: 'Your week is planned from your starred recipes.' });
}
/* Recipes that came from a saved reel or short video (Nov 11, Newt couldn't tell which ones) */
const fromReel = r => !!(r && r.src && /instagram\.com|tiktok\.com|youtube\.com\/shorts/.test(r.src.url || ''));
function RecipesPane() {
  const [q, setQ] = useState(MEALS.q); const [cat, setCat] = useState(MEALS.cat); const [, setT] = useState(0); const re = () => setT(x => x + 1);
  const own = ML().recipes;
  const term = q.trim().toLowerCase();
  const st = ML().stars || {};
  const list = cat === 'mix' ? [] : (cat === 'starred' ? Object.keys(st).map(getRecipe).filter(Boolean) : allRecipes()).filter(r => (cat === 'all' || cat === 'starred' || (cat === 'mine' ? own[r.id] && !r.builtin : cat === 'reels' ? fromReel(r) : r.cat === cat)) && (!term || (r.name + ' ' + (r.ing || []).map(g => g.n).join(' ')).toLowerCase().includes(term)));
  const mine = list.filter(r => !r.builtin); const lib = list.filter(r => r.builtin);
  const combos = term ? allCombos().filter(r => (cat === 'all' || r.cat === cat) && (r.name + ' ' + r.ing.map(g => g.n).join(' ')).toLowerCase().includes(term)) : [];
  const pick = c => { MEALS.cat = c; setCat(c); };
  const row = r => { const inP = planItemFor(r.id);
    return html`<div key=${r.id} class="meal-row"><button class="main" onClick=${() => UI.setView({ type: 'meal', id: r.id })}><div class="t">${r.name}</div>${fromReel(r) ? html`<span class="reel-tag">From a reel${r.src.by ? ' · ' + r.src.by : ''}</span>` : null}${avoidRecipe(r) ? html`<${IssueLine} r=${r}/>` : null}
      <div class="s num">${[macroLine(macros(r)), r.mins ? r.mins + ' min' : '', 'serves ' + r.serves, r.freezes ? 'freezes' : ''].filter(Boolean).join(' · ')}</div></button>
      <${StarBtn} id=${r.id} name=${r.name}/>
      <button class=${'meal-add' + (inP ? ' on' : '')} aria-label=${inP ? r.name + ' is in this week. Remove it' : 'Add ' + r.name + ' to this week'} onClick=${() => inP ? removeFromPlan(r.id) : addToPlan(r.id)}>${inP ? I.check : I.plus}</button></div>`; };
  const newRecipe = paste => UI.setView({ type: 'mealEdit', isNew: true, paste: paste === true, draft: { id: uid('m'), name: '', cat: ['breakfast', 'main', 'snack', 'base'].includes(cat) ? cat : 'main', serves: 4, keeps: 4, freezes: false, macros: {}, mins: '', ing: [], steps: [], note: '' } });
  return html`<div>
    <input class="field" type="search" id="meal-search" placeholder="Search recipes or ingredients" value=${q} onInput=${e => { MEALS.q = e.target.value; setQ(e.target.value); }} style="margin-top:6px"/>
    <div class="chips" role="group" aria-label="Recipe type" style="margin-top:10px">${[['all', 'All'], ['starred', '★ Starred'], ['mix', 'Mix & match'], ...MEAL_CATS, ['reels', 'From reels'], ['mine', 'Mine']].map(([k, l]) => html`<button key=${k} id=${'rchip-' + k} class=${'chip' + (cat === k ? ' on' : '')} aria-pressed=${cat === k} onClick=${() => pick(k)}>${l}</button>`)}</div>
    <div class="row" style="margin-top:12px"><button class="btn ghost" style="flex:1" id="new-recipe" onClick=${() => newRecipe()}>${I.plus} New recipe</button><button class="btn ghost" style="flex:1" id="my-foods" onClick=${() => UI.setView({ type: 'foods' })}>My foods</button></div>
    ${cat === 'starred' && !list.length ? html`<div class="card note" style="margin-top:14px" id="starred-empty">No starred recipes yet. Tap ☆ on any recipe to keep it here.</div>` : null}
    ${cat === 'mix' ? null : cat === 'starred' ? (list.length ? html`<div class="section-h"><h2>Starred</h2><span class="aside">${list.length}</span></div><div class="stack" id="starred-list">${list.map(row)}</div>` : null) : html`<div>
    ${mine.length ? html`<div class="section-h"><h2>My recipes</h2></div><div class="stack">${mine.map(row)}</div>` : null}
    ${combos.length ? html`<div class="section-h"><h2>Mix & match</h2><span class="aside">${combos.length} match${combos.length === 1 ? '' : 'es'}</span></div><div class="stack">${combos.slice(0, 30).map(row)}</div>` : null}
    ${MEAL_CATS.map(([c, label]) => { const rs = lib.filter(r => r.cat === c); if (!rs.length) return null;
      /* In All, each group shows 3 with Show all (Nov 10, meal audit M8) */
      const capped = cat === 'all' && !term && !REC_MORE[c] && rs.length > 3;
      return html`<div key=${c} id=${'rg-' + c}><div class="section-h"><h2>${label}</h2>${cat === 'all' && !term && rs.length > 3 ? html`<button class="btn text" id=${'rmore-' + c} onClick=${() => { REC_MORE[c] = !REC_MORE[c]; re(); }}>${REC_MORE[c] ? 'Show fewer' : 'Show all ' + rs.length}</button>` : null}</div><div class="stack">${(capped ? rs.slice(0, 3) : rs).map(row)}</div></div>`; })}
    ${!list.length && !combos.length ? html`<div class="card note" style="margin-top:14px">No recipes match. Try another word, or make it a new recipe.</div>` : null}</div>`}
    ${!term && (cat === 'all' || cat === 'mix') ? html`<div id="rg-mix"><div class="section-h"><h2>Mix & match</h2></div>
      <p class="note" style="margin:-4px 0 10px">Cook one plain base, then make it a different meal with a sauce or spice mix.</p><${MixList}/></div>` : null}
  </div>`;
}
function RecipeView({ id }) {
  const r = getRecipe(id); const it = planItemFor(id);
  const [sv, setSv] = useState(() => r ? (it ? servingsFor(it) : r.serves) : 1);
  if (!r) return html`<div class="card note" style="margin-top:12px">This recipe was deleted.</div>`;
  const f = sv / (r.serves || 1);
  const r0 = r.raw || r;
  const edit = () => UI.setView({ type: 'mealEdit', isNew: false, draft: clone({ ...r0, builtin: undefined, edited: undefined }) });
  const copy = () => UI.setView({ type: 'mealEdit', isNew: true, draft: clone({ ...r, raw: undefined, swaps: undefined, id: uid('m'), name: r.name + ' (my version)', builtin: undefined, edited: undefined }) });
  const del = () => openSheet({ type: 'confirm', title: r.builtin ? 'Undo your changes?' : 'Delete this recipe?', body: r.builtin ? 'Puts ' + r.name + ' back to the original recipe.' : r.name + ' will be removed from your recipes and your prep.', ok: r.builtin ? 'Reset recipe' : 'Delete recipe', danger: true,
    onOk: () => { mealCommit(m => { delete m.recipes[id]; if (!r.builtin) m.plan.items = m.plan.items.filter(i => i.r !== id); }); closeSheet(); if (!r.builtin) UI.setView(null); } });
  return html`<div class="meal-view">
    <div class="eyebrow" style="margin-top:4px">${MEAL_CAT_NAME[r.cat] || 'Recipe'}${r.mins ? ' · ' + r.mins + ' min' : ''}${r.edited ? ' · edited' : !r.builtin ? ' · my recipe' : ''}</div>
    <div class="row" style="align-items:flex-start"><h2 class="meal-title" style="flex:1">${r.name}</h2><${StarBtn} id=${r.id} name=${r.name} big=${true}/></div>
    ${r.mix ? html`<button class="btn text" id="mix-base-link" style="padding-left:0;min-height:36px" onClick=${() => UI.setView({ type: 'base', id: r.mix.base })}>${r.mix.flavor ? 'Base: ' + MIX_BASE[r.mix.base].name + ' · see other flavors' : 'See flavors for this base'}</button>` : null}
    <div class="row wrap" style="gap:6px;margin-top:8px">
      <span class="chip">Fridge: ${r.keeps || 4} days</span>${r.freezes ? html`<span class="chip">Freezes well</span>` : null}</div>
    <div class="card mp-scale" style="margin-top:14px">
      <div style="flex:1;min-width:0"><div style="font-weight:700">Servings</div><div class="small muted num">${Math.abs(f - 1) < 0.01 ? 'Original recipe' : fracStr(f) + ' × the recipe (makes ' + r.serves + ')'}</div></div>
      <${MStep} label="servings" value=${sv} min=${1} max=${99} onChange=${setSv}/></div>
    ${(() => { const m = macros(r); return m ? html`<div class="section-h"><h2>Per serving</h2>${r.size ? html`<span class="aside">${r.size}</span>` : null}</div>
      <div class="card" id="recipe-macros"><${MacroTiles} m=${m}/><${ExtraLine} m=${m}/>
        <p class="small muted" style="margin-top:10px">${m.manual && !m.est ? 'Entered by you.' : m.manual ? 'Partly entered by you, the rest estimated from the ingredients.' : 'Estimated from the ingredients.'}${m.missing.length && m.est ? ' Not counted: ' + m.missing.join(', ') + '.' : ''}</p></div>` : null; })()}
    <div class="section-h"><h2>Ingredients</h2>${sv !== r.serves ? html`<button class="btn text" onClick=${() => setSv(r.serves)}>Reset</button>` : null}</div>
    <${IssueLine} r=${r}/><${SwapLine} r=${r}/><${GearLine} r=${r}/>
    ${r.alt && getRecipe(r.alt) ? html`<button class="opt card" id="recipe-alt" style="margin-bottom:10px;padding:12px 14px" onClick=${() => UI.setView({ type: 'meal', id: r.alt })}><div style="flex:1"><div>${r.altWhy || 'Another option'}: ${getRecipe(r.alt).name}</div><div class="d">${getRecipe(r.alt).d || ''}</div></div></button>` : null}
    <div style="margin:-2px 0 8px"><${UnitsSeg}/></div>
    <ul class="ing-list card">${(r.ing || []).map((g, i) => { const l = amtLine(g, f); return html`${r.mix && r.mix.flavor && i === 0 ? html`<li class="ing-h" key="h0">Base</li>` : null}${r.mix && r.mix.flavor && i === r.mix.split ? html`<li class="ing-h" key="h1">${r.mix.part}</li>` : null}<li key=${i}><span class="q">${l.q}</span><span>${l.n}</span></li>`; })}</ul>
    ${(r.steps || []).length ? html`<div class="section-h"><h2>Steps</h2></div>
      ${Math.abs(f - 1) > 0.01 ? html`<p class="small muted" style="margin:-4px 0 8px">Written for ${r.serves} servings. Cooking times stay about the same; use more pans so food isn’t crowded.</p>` : null}
      <ol class="step-list card">${r.steps.map((s, i) => html`<li key=${i}>${s}</li>`)}</ol>` : null}
    ${r.note ? html`<div class="tip-card" style="margin-top:12px;padding-right:14px">${r.note}</div>` : null}
    ${r.mix && r.mix.flavor && (MIX_FLAVOR[r.mix.flavor].goes || []).some(g => comboRecipe(g) && !recipeIssues(comboRecipe(g)).block.length) ? html`<div class="section-h"><h2>Goes with</h2></div>
      <div class="row wrap" style="gap:8px">${MIX_FLAVOR[r.mix.flavor].goes.filter(g => comboRecipe(g) && !recipeIssues(comboRecipe(g)).block.length).map(g => html`<button key=${g} class="chip goes" onClick=${() => UI.setView({ type: 'meal', id: g, from: { type: 'meal', id } })}>${comboName(g)}</button>`)}</div>` : null}
    <div class="section-h"><h2>Prep</h2></div>
    ${it ? html`<div class="card stack"><div class="row"><span style="flex:1;font-weight:600">This week · times a week</span><${MStep} label="times a week" value=${it.n} min=${1} max=${21} onChange=${v => mealCommit(m => { const x = m.plan.items.find(i => i.r === id); if (x) x.n = v; })}/></div>
        <div class="row"><button class="btn" style="flex:1" onClick=${() => { MEALS.mode = 'plan'; lsSet('mealsMode', 'plan'); UI.setView(null); }}>See prep</button><button class="btn text" style="color:var(--stop)" onClick=${() => removeFromPlan(id)}>Remove</button></div></div>`
      : html`<button class="btn primary wide" id="add-to-prep" onClick=${() => addToPlan(id)}>${I.plus} Add to my prep</button>`}
    ${['breakfast', 'main', 'snack'].includes(r.cat) ? html`<label class="toggle-row" for="rec-noplan" style="margin-top:8px"><span><span>Leave out of my meal plans</span><span class="d">Plan my week and Different meals won’t pick it. You can still add it yourself.</span></span>
      <input type="checkbox" role="switch" id="rec-noplan" checked=${!!(ML().noPlan || {})[id]} onChange=${e => setNoPlan(id, e.target.checked)}/></label>` : null}
    <div class="row wrap" style="margin-top:14px">
      ${r.mix ? null : html`<button class="btn" style="flex:1" onClick=${edit}>${I.edit} Edit</button>`}
      <button class="btn" style="flex:1" onClick=${copy}>${I.copy} ${r.mix ? 'Copy to my recipes to change it' : 'Copy'}</button></div>
    ${!r.builtin || r.edited ? html`<button class="btn text wide" style="color:var(--stop);margin-top:6px" onClick=${del}>${r.builtin ? 'Reset to original' : 'Delete recipe'}</button>` : null}
    <${SourceLine} r=${r}/>
  </div>`;
}
function RecipeEditor({ view }) {
  const d0 = view.draft;
  const [d, setD] = useState(() => ({ ...d0, macros: { ...(d0.protein && !(d0.macros && d0.macros.p) ? { p: d0.protein } : {}), ...(d0.macros || {}) }, mins: d0.mins || '', serves: d0.serves || 4, keeps: d0.keeps || 4 }));
  const [ingTxt, setIngTxt] = useState(() => (d0.ing || []).map(ingToText).join('\n'));
  const [stepTxt, setStepTxt] = useState(() => (d0.steps || []).join('\n'));
  const [ov, setOv] = useState(() => Object.fromEntries((d0.ing || []).filter(g => g.a && g.a !== guessAisle(g.n, g.u)).map(g => [ingKey(g.n), g.a])));
  const [fov, setFov] = useState(() => Object.fromEntries((d0.ing || []).filter(g => g.fk).map(g => [ingKey(g.n), g.fk])));
  const [err, setErr] = useState(''); const [pasteOpen, setPasteOpen] = useState(!!view.paste);
  const set = (k, v) => setD({ ...d, [k]: v });
  const parsed = ingTxt.split('\n').map(parseIng).filter(Boolean).map(g => { const fk = fov[ingKey(g.n)]; return { ...g, a: ov[ingKey(g.n)] || g.a, ...(fk ? { fk } : {}) }; });
  const pickFood = g => openSheet({ type: 'foodPick', current: g.fk || '', q: shopName(g.n), onPick: id => setFov(o => { const k = ingKey(g.n); const n = { ...o }; if (id) n[k] = id; else delete n[k]; return n; }) });
  const cycle = g => { const k = ingKey(g.n); const i = AISLES.findIndex(a => a[0] === g.a); setOv({ ...ov, [k]: AISLES[(i + 1) % AISLES.length][0] }); };
  const save = () => {
    const name = String(d.name || '').trim(); if (!name) { setErr('Give the recipe a name.'); return; }
    if (!parsed.length) { setErr('Add at least one ingredient.'); return; }
    const isBuiltin = !!MEAL_BUILTIN[d.id];
    const rec = { id: d.id, name, cat: d.cat || 'main', serves: clampInt(d.serves, 1, 99, 4), size: String(d.size || '').trim(), macros: Object.fromEntries(NUT.map(([k]) => [k, d.macros[k]]).filter(([, v]) => v !== '' && v != null && isFinite(+v)).map(([k, v]) => [k, +v])), mins: +d.mins > 0 ? Math.round(+d.mins) : null,
      keeps: clampInt(d.keeps, 1, 14, 4), freezes: !!d.freezes, week: d.week || 3, ing: parsed, steps: stepTxt.split('\n').map(s => s.trim()).filter(Boolean), note: String(d.note || '').trim(), ...(d.src && /^https?:\/\//.test(String(d.src.url || '').trim()) ? { src: { url: String(d.src.url).trim(), by: d.src.by || '' } } : {}), base: isBuiltin || undefined, updatedAt: Date.now() };
    mealCommit(m => { m.recipes[d.id] = rec; });
    UI.setView({ type: 'meal', id: d.id });
  };
  const fillFrom = x => { setD(cur => ({ ...cur, name: cur.name || x.name, src: x.url ? { url: x.url, by: '' } : cur.src, ...(x.serves ? { serves: x.serves } : {}), ...(x.mins ? { mins: x.mins } : {}), ...(x.macros && Object.keys(x.macros).length ? { macros: { ...cur.macros, ...x.macros } } : {}) })); if (x.ing.length) setIngTxt(x.ing.join('\n')); if (x.steps.length) setStepTxt(x.steps.join('\n')); showToast({ kind: 'info', text: 'Filled in ' + x.ing.length + ' ingredients and ' + x.steps.length + ' steps. Check them over.' }); };
  return html`<div class="stack" style="margin-top:6px">
    ${view.isNew ? (pasteOpen ? html`<${PasteBox} onFill=${fillFrom}/>` : html`<button class="btn ghost wide" id="paste-open" onClick=${() => setPasteOpen(true)}>Fill it in from a post or website</button>`) : null}
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
    <div><label class="lbl" for="me-src">Source link</label><input class="field" id="me-src" inputmode="url" value=${(d.src || {}).url || ''} placeholder="Instagram, TikTok, YouTube or a website (optional)" onInput=${e => set('src', { ...(d.src || {}), url: e.target.value.trim(), by: '' })}/>
      <p class="small muted" style="margin-top:4px">Shown at the bottom of the recipe so you can find the original.</p></div>
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
    ${P.items.length ? html`<div style="margin-top:8px"><${UnitsSeg}/></div>` : null}
    ${P.items.length ? html`<p class="small muted num" style="margin-top:6px">For ${P.people} ${P.people === 1 ? 'person' : 'people'} · ${P.start ? rangeText(parseYmd(P.start), spanDays(P)) : daysTxt(spanDays(P))} · ${P.items.length} recipe${P.items.length === 1 ? '' : 's'}${all ? ' · ' + got + ' of ' + all + ' in the cart' : ''}</p>`
      : html`<div class="card stack" style="margin-top:8px"><p class="note">Your shopping list fills in from your week’s meals, added up and sorted by aisle.</p>
        ${ML().menu && ML().menu.days ? html`<button class="btn primary wide" id="list-from-plan" onClick=${() => usePlanForPrep(false)}>Fill it from my meal plan</button>` : html`<button class="btn primary wide" id="list-plan" onClick=${() => openSheet({ type: 'mealTargets' })}>Plan my week</button>`}
        <button class="btn wide" onClick=${() => setMealsMode('recipes')}>Pick recipes myself</button></div>`}
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
const SV_UNITS = ['g', 'oz', 'serving', 'cup', 'tbsp', 'tsp', 'piece', 'scoop', 'slice', 'can', 'package'];
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
function FoodEditSheet({ id, name, then, bc }) {
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
    mealCommit(m => { m.foods[fid] = { ...(f0 || {}), ...(bc ? { bc } : {}), id: fid, name: nm, sv: { q, u: d.u, gr: Math.round(gr * 10) / 10 }, lab: Object.fromEntries(NUT.filter(([k]) => d[k] !== '' && isFinite(+d[k])).map(([k]) => [k, +d[k]])), updatedAt: Date.now() }; });
    closeSheet(); showToast({ kind: 'info', text: nm + ' saved' }); if (then) then(fid);
  };
  const del = () => { mealCommit(m => { delete m.foods[id]; }); closeSheet(); showToast({ kind: 'info', text: f0.name + ' deleted' }); };
  return html`<${Sheet} label=${id ? 'Edit food' : 'New food'}><h2>${id ? 'Edit food' : 'New food'}</h2>
    <p class="note">Copy the numbers from the nutrition label, per serving.${bc || (f0 && f0.bc) ? ' Barcode ' + (bc || f0.bc) + ' finds this food when you scan it.' : ''}</p>
    <div class="stack" style="margin-top:12px">
      <${LabelReader} onFill=${r => { setD(x => ({ ...x, ...r })); setErr(''); }}/>
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
    <p class="note" style="margin-top:6px">Foods you eat often, saved from their nutrition label, like a protein bar or a shake. Search a name in the food log to log one; recipes count them when an ingredient’s name matches. For a one-time meal, use Quick add numbers in the food log instead.</p>
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
const hhmm = t => { const d = new Date(t || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
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
/* Compact goal tiles (Nov 10, Newt: the bars took over the screen and pushed Log food down) */
function GoalTiles({ tot, G }) {
  const main = [['kcal', 'Calories', ''], ['p', 'Protein', ' g'], ['c', 'Carbs', ' g'], ['f', 'Fat', ' g']];
  const extra = NUT.filter(([k]) => !main.some(x => x[0] === k));
  return html`<div class="mac-tiles goal-tiles" id="goal-tiles">${main.map(([k, l, u]) => { const g = G[k]; const v = tot[k] || 0; const pct = g ? Math.min(100, v / g * 100) : 0;
      return html`<div key=${k} class="mac" role=${g ? 'progressbar' : null} aria-label=${g ? l + ': ' + fmtNut(k, v) + u + ' of ' + fmtNut(k, g) + u : null} aria-valuenow=${g ? Math.round(v) : null} aria-valuemax=${g || null}>
        <b class="num">${fmtNut(k, v)}${u}</b><span>${l}</span>${g ? html`<small class="num">of ${fmtNut(k, g)}${u}</small><i class="gt-bar"><i style=${{ width: pct + '%' }}></i></i>` : null}</div>`; })}</div>
    <div class="mac-extra num">${extra.map(([k, l, u]) => html`<span key=${k}>${l} <b>${fmtNut(k, tot[k] || 0)}${u}</b>${G[k] ? html`<span class="muted"> / ${fmtNut(k, G[k])}${u}${LIMITS[k] ? ' max' : ''}</span>` : null}</span>`)}</div>`;
}
function LogPane() {
  const m = ML(); const today = ymd(new Date()); const day = MEALS.day && MEALS.day < today ? MEALS.day : today;
  const go = n => { const d = ymd(addDays(parseYmd(day), n)); MEALS.day = d >= today ? null : d; S.rerender(); };
  const list = (m.log[day] || []).slice().sort((a, b) => a.at - b.at); const tot = sumNut(list); const G = m.goals;
  const gk = NUT.filter(([k]) => G[k]); const rest = NUT.filter(([k]) => !G[k]);
  const prep = m.menu && m.menu.days ? [] : m.plan.items.map(it => ({ it, r: getRecipe(it.r) })).filter(x => x.r && macros(x.r)); const wk = weekServings(day);
  const quick = r => { const e = logRecipe(day, r, 1); if (e) showToast({ kind: 'info', text: '1 serving of ' + r.name + ' logged', action: 'Undo', ms: 5000, fn: () => dropLog(day, e.id) }); };
  return html`<div>
    <div class="day-nav"><button class="pill-btn" aria-label="Previous day" onClick=${() => go(-1)}>${I.back}</button><div class="t" aria-live="polite">${logDayName(day)}</div>
      <button class="pill-btn flip" aria-label="Next day" disabled=${day === today} onClick=${() => go(1)}>${I.back}</button></div>
    <div class="card" id="log-totals">
      ${gk.length ? html`<${GoalTiles} tot=${tot} G=${G}/>` : html`<${MacroTiles} m=${tot}/><${ExtraLine} m=${tot}/>`}
      <button class="btn text" id="log-goals" style="padding-left:0" onClick=${() => openSheet({ type: 'mealGoals' })}>${gk.length ? 'Change goals' : 'Set daily goals'}</button><button class="btn text" id="log-review" onClick=${() => UI.setView({ type: 'eatReview' })}>Review my eating</button></div>
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" style="flex:2" id="log-add" onClick=${() => openSheet({ type: 'mealLog', day })}>${I.plus} Log food</button><button class="btn" style="flex:1" id="log-scan" onClick=${() => openSheet({ type: 'mealLog', day, tab: 'scan' })}>${I.camera} Scan</button></div>
    <${TodayMenu} day=${day}/>
    ${prep.length ? html`<div class="section-h"><h2>From your prep</h2><span class="aside">Tap to log a serving</span></div>
      <div class="stack">${prep.map(({ it, r }) => { const n = wk[r.id] || 0; return html`<button key=${r.id} class="day-btn prep-log" aria-label=${'Log a serving of ' + r.name} onClick=${() => quick(r)}><div style="min-width:0"><div class="t">${r.name}</div>
        <div class="s num">${n ? fracStr(n) + ' of ' + it.n + ' this week' : it.n + ' planned this week'} · ${macroLine(macros(r))}</div></div><span class="go">${I.plus}</span></button>`; })}</div>` : null}
    <div class="section-h"><h2>${day === today ? 'Eaten today' : 'Eaten'}</h2>${list.length ? html`<span class="aside num">${list.length} item${list.length === 1 ? '' : 's'}</span>` : null}</div>
    ${list.length ? html`<div class="card shop-card">${list.map(e => html`<button key=${e.id} class="opt log-row" onClick=${() => openSheet({ type: 'logEntry', day, id: e.id })}><div style="flex:1;min-width:0"><div>${e.name}</div>
        <div class="d num">${e.k === 'recipe' ? fracStr(e.sv) + ' serving' + (e.sv > 1 ? 's' : '') + ' · ' : e.txt ? e.txt + ' · ' : ''}${fmtNut('kcal', e.m.kcal)} kcal · ${Math.round(e.m.p)} g protein</div></div></button>`)}</div>`
      : html`<div class="card note">Nothing logged ${day === today ? 'yet today' : 'on this day'}. ${prep.length ? 'Tap a prepped meal above to log a serving, or use Log food for anything else.' : 'Use Log food to add a meal or snack, or Scan a barcode.'}</div>`}
    <p class="small faint" style="margin-top:14px">Numbers come from typical nutrition values, for planning. ${NOT_ADVICE}</p>
  </div>`;
}
function MealLogSheet({ day, tab: tab0, txt, fk, fid, only, q0 }) {
  const [st, setSt] = useState({ tab: tab0 || 'find', txt, fk, fid, only, q0 });
  const go = (tab, p) => setSt({ tab, ...(p || {}) });
  const back = st.tab !== 'find' ? html`<button class="btn text" id="lf-back" style="padding-left:0" onClick=${() => go('find')}>${I.back} Search</button>` : null;
  return html`<${Sheet} label="Log food"><h2>Log food</h2><p class="note">${logDayName(day)}</p>${back}
    <div style="margin-top:10px">${st.tab === 'food' ? html`<${LogFood} key=${(st.txt || '') + (st.fk || '')} day=${day} txt0=${st.txt} fk0=${st.fk}/>` : st.tab === 'scan' ? html`<${LogScan} day=${day} fid=${st.fid} only=${st.only} q0=${st.q0}/>`
      : st.tab === 'num' ? html`<${LogNumbers} day=${day} name0=${st.name0}/>` : st.tab === 'recipe' ? html`<${LogRecipe} day=${day} r0=${st.r0}/>` : html`<${FindView} day=${day} go=${go}/>`}</div><//>`;
}
function LogRecipe({ day, r0 }) {
  const [sel, setSel] = useState(r0 || null); const [sv, setSv] = useState(1); const [q, setQ] = useState('');
  const inPrep = new Set(ML().plan.items.map(i => i.r)); const term = q.trim().toLowerCase();
  const r = sel && getRecipe(sel); const m = r && macros(r);
  if (r && m) return html`<div class="stack">
    <div class="row"><div style="flex:1;min-width:0"><div style="font-weight:700">${r.name}</div><div class="small muted">${r.size ? 'A serving is ' + r.size : 'The recipe makes ' + r.serves}</div></div><button class="btn text" onClick=${() => setSel(null)}>Change</button></div>
    <div class="row"><span style="flex:1;font-weight:600">Servings</span><${MStep} label="servings eaten" value=${sv} min=${0.5} max=${10} step=${0.5} onChange=${setSv}/></div>
    <${MacroTiles} m=${scaleNut(m, sv)}/>
    <button class="btn primary wide" id="log-save" onClick=${() => { logRecipe(day, r, sv); closeSheet(); showToast({ kind: 'info', text: r.name + ' logged' }); }}>Log it</button></div>`;
  const prepMix = ML().plan.items.map(i => i.r).filter(x => !MEAL_BUILTIN[x] && !ML().recipes[x]).map(getRecipe).filter(Boolean);
  const pool = term ? allRecipes().concat(allCombos().filter(c => !prepMix.includes(c))).concat(prepMix) : allRecipes().concat(prepMix);
  const list = pool.filter(x => macros(x) && (!term || x.name.toLowerCase().includes(term))).sort((a, b) => (inPrep.has(b.id) ? 1 : 0) - (inPrep.has(a.id) ? 1 : 0));
  return html`<div><input class="field" type="search" id="lr-q" placeholder="Search recipes" value=${q} onInput=${e => setQ(e.target.value)}/>
    <div class="food-list">${list.map(x => html`<button key=${x.id} class="opt" onClick=${() => { setSel(x.id); setSv(1); }}><div style="flex:1;min-width:0"><div>${x.name}</div><div class="d">${inPrep.has(x.id) ? 'In your prep · ' : ''}${macroLine(macros(x))} a serving</div></div></button>`)}
      ${!list.length ? html`<p class="note" style="margin-top:10px">No recipe matches.</p>` : null}</div></div>`;
}
function LogFood({ day, txt0, fk0 }) {
  const [txt, setTxt] = useState(txt0 || ''); const [fk, setFk] = useState(fk0 || ''); const [pick, setPick] = useState(false); const [pq, setPq] = useState(''); const [online, setOnline] = useState(null);
  const g0 = parseIng(txt); const g = g0 && fk ? { ...g0, fk } : g0;
  const fd = g && foodFor(g); const gr = fd && !fd.skip ? gramsOf(g, fd) : null;
  const m = gr != null ? roundNut(Object.fromEntries(NUT.map(([k]) => [k, fd[k] * gr / 100]))) : null;
  const save = () => { const nm = shopName(g.n); addLog(day, { k: 'food', name: nm.replace(/^./, c => c.toUpperCase()), txt: g.q != null ? qtyText(g.q, g.u) : '', fk: fd.id, m }); closeSheet(); showToast({ kind: 'info', text: nm + ' logged' }); };
  const term = g ? shopName(g.n) : txt.trim();
  if (online) return html`<div id="lf-online"><div class="row" style="margin-bottom:8px"><span style="flex:1;font-weight:700">Look up online</span><button class="btn text" onClick=${() => setOnline(null)}>Back</button></div>
    <${LogScan} day=${day} only="search" q0=${online.q} g0=${online.g}/></div>`;
  const goOnline = q => setOnline({ q, g: g && g.q != null && WT[g.u] ? g.q * WT[g.u] : 0 });
  if (pick) return html`<div><div class="row"><input class="field" type="search" id="lf-q" placeholder="Search foods" value=${pq} onInput=${e => setPq(e.target.value)}/><button class="btn text" onClick=${() => setPick(false)}>Back</button></div>
    <${FoodList} current=${fk} q=${pq} onPick=${id => { setFk(id); setPick(false); }} onNew=${name => openSheet({ type: 'foodEdit', name: name || (g && shopName(g.n)), then: id => openSheet({ type: 'mealLog', day, tab: 'food', txt, fk: id }) })}/>
    <button class="btn ghost wide" style="margin-top:10px" id="lf-pick-online" onClick=${() => goOnline(pq.trim() || term)}>Look up “${pq.trim() || term || 'a food'}” online</button></div>`;
  return html`<div class="stack">
    <div><label class="lbl" for="lf-txt">What did you eat?</label><input class="field" id="lf-txt" placeholder="e.g. 1 cup Greek yogurt" value=${txt} onInput=${e => setTxt(e.target.value)}/>
      <p class="small muted" style="margin-top:6px">Amount first: 2 eggs, 150 g chicken, 1 banana. For your own foods, “1 serving protein bar” works.</p></div>
    ${g ? html`<button class=${'me-food' + (m ? '' : ' miss')} id="lf-food" onClick=${() => { setPq(''); setPick(true); }}>${!fd ? 'No match · choose a food' : fd.skip ? 'Not counted · change' : m ? 'Counts as ' + fd.label + ' · change' : fd.label + ' · add an amount like 150 g or 1 cup'}</button>` : null}
    ${m ? html`<${MacroTiles} m=${m}/>` : null}
    <button class="btn primary wide" id="lf-save" disabled=${!m} onClick=${save}>Log it</button>
    <button class=${'btn wide' + (g && !m ? ' primary' : ' ghost')} id="lf-online-go" onClick=${() => goOnline(term)}>${term ? 'Look up “' + term + '” online' : 'Look up a food online'}</button></div>`;
}
function LogNumbers({ day, name0 }) {
  const [d, setD] = useState({ name: name0 || '' }); const set = (k, v) => setD({ ...d, [k]: v });
  const ok = NUT.some(([k]) => +d[k] > 0);
  const save = () => { addLog(day, { k: 'num', name: d.name.trim() || 'Quick add', m: roundNut(Object.fromEntries(NUT.map(([k]) => [k, +d[k] || 0]))) }); closeSheet(); showToast({ kind: 'info', text: 'Logged' }); };
  return html`<div class="stack"><div><label class="lbl" for="ln-name">Name</label><input class="field" id="ln-name" placeholder="e.g. Lunch out" value=${d.name} onInput=${e => set('name', e.target.value)}/></div>
    <div class="me-mac">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'ln-' + k}>${l}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'ln-' + k} inputmode="decimal" value=${d[k] || ''} onInput=${e => set(k, e.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
    <button class="btn primary wide" id="ln-save" disabled=${!ok} onClick=${save}>Log it</button>
    <p class="small muted" id="ln-food-hint">For a one-time log. Eat it often? <button class="btn text" id="ln-as-food" style="padding:0;min-height:0;display:inline" onClick=${() => openSheet({ type: 'foodEdit', name: d.name, then: () => showToast({ kind: 'info', text: 'Saved to My foods. Search its name to log it.' }) })}>Save it as a food</button> from its label instead, and it’s one search away next time.</p></div>`;
}
function NumEdit({ day, e, done }) {
  const [d, setD] = useState(() => ({ name: e.name, ...Object.fromEntries(NUT.map(([k]) => [k, e.m[k] ? String(Math.round(e.m[k] * 10) / 10) : ''])) }));
  const set = (k, v) => setD({ ...d, [k]: v }); const ok = NUT.some(([k]) => +d[k] > 0);
  const save = () => {
    const old = clone(e); const sv = savedFor(e); const svE = sv ? clone(sv.e) : null; const svCat = sv ? sv.cat : ''; const m1 = roundNut(Object.fromEntries(NUT.map(([k]) => [k, +d[k] || 0]))); const name = d.name.trim() || 'Quick add';
    mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === e.id); if (!x) return; x.name = name; x.m = m1; if (x.m1) x.m1 = scaleNut(m1, 1 / (x.q || 1)); if (sv && m.saved && m.saved[sv.id]) m.saved[sv.id].e = tmplOf(x); });
    done(); showToast({ kind: 'info', ms: 7000, text: sv ? 'Updated here and in ' + svCat : 'Updated', action: 'Undo', fn: () => mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === e.id); if (x) { x.name = old.name; x.m = old.m; } if (sv && m.saved && m.saved[sv.id]) m.saved[sv.id].e = svE; }) });
  };
  return html`<div class="stack" id="le-edit-form" style="margin-top:12px"><div><label class="lbl" for="le-name">Name</label><input class="field" id="le-name" value=${d.name} onInput=${x => set('name', x.target.value)}/></div>
    <div class="me-mac">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'le-' + k}>${l}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'le-' + k} inputmode="decimal" value=${d[k]} onInput=${x => set(k, x.target.value.replace(/[^\d.]/g, ''))}/></div>`)}</div>
    ${savedFor(e) ? html`<p class="small muted">This food is saved in ${savedFor(e).cat}; the saved copy changes too.</p>` : null}
    <div class="row" style="gap:8px"><button class="btn primary" style="flex:2" id="le-save" disabled=${!ok} onClick=${save}>Save changes</button><button class="btn" style="flex:1" onClick=${done}>Cancel</button></div></div>`;
}
function LogEntrySheet({ day, id }) {
  const [editing, setEditing] = useState(false);
  const e = (ML().log[day] || []).find(x => x.id === id); if (!e) return null;
  if (editing) return html`<${Sheet} label=${'Edit ' + e.name}><h2>Edit ${e.name}</h2><p class="note">${logDayName(day)}</p><${NumEdit} day=${day} e=${e} done=${() => setEditing(false)}/><//>`;
  const setSv = v => mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === id); if (!x) return; x.m = x.m1 ? scaleNut(x.m1, v) : scaleNut(x.m, v / (x.sv || 1)); x.sv = v; });
  /* When you ate it (Nov 10, audit P3-3): same day, the time you pick */
  const setWhen = v => { const mm = /^(\d{1,2}):(\d{2})$/.exec(v || ''); if (!mm) return; const t = parseYmd(day); t.setHours(+mm[1], +mm[2], 0, 0);
    mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === id); if (x) { x.at = +t; x.atSet = true; } }); };
  const setQ = v => mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === id); if (!x) return;
    if (!x.m1) { x.m1 = scaleNut(x.m, 1 / (x.q || 1)); x.txt1 = x.txt || ''; }
    x.q = v; x.m = scaleNut(x.m1, v); x.txt = x.txt1 ? (v === 1 ? x.txt1 : fracStr(v) + ' × ' + x.txt1) : (v === 1 ? '' : fracStr(v) + '×'); });
  /* Amount as the real count (Nov 11, Newt logged 3 eggs and couldn't go below 1½): a food logged as "3" or "150 g"
     steps in its own unit down to half of one (or 10 g), instead of a times-what-you-logged multiplier. */
  const g0 = e.k === 'food' ? parseIng(String(e.txt1 != null ? e.txt1 : e.txt || '') + ' x') : null;
  const q0 = g0 && g0.q > 0 ? g0.q : 0; const u0 = q0 ? g0.u || '' : '';
  const noun0 = q0 && !u0 ? String(e.txt1 != null ? e.txt1 : e.txt || '').replace(/^[\d\s.\/½¼¾⅓⅔⅛]+(×\s*)?/, '').trim() : '';
  const stepU = /^(g|ml)$/.test(u0) ? 10 : /^(cup|tbsp|tsp)$/.test(u0) ? 0.25 : 0.5;
  const setCount = v => mealCommit(m => { const x = (m.log[day] || []).find(y => y.id === id); if (!x) return;
    if (!x.m1) { x.m1 = scaleNut(x.m, 1 / (x.q || 1)); x.txt1 = x.txt || ''; }
    v = Math.round(v * 100) / 100; x.q = v / q0; x.m = scaleNut(x.m1, x.q); x.txt = u0 ? qtyText(v, u0) : fracStr(v) + (noun0 ? ' ' + (v > 1 && !/s$/.test(noun0) ? noun0 + 's' : v <= 1 ? noun0.replace(/s$/, '') : noun0) : ''); });
  return html`<${Sheet} label=${e.name}><h2>${e.name}</h2><p class="note">${logDayName(day)}${e.txt ? ' · ' + e.txt : ''}</p>
    ${e.k === 'recipe' ? html`<div class="row" style="margin-top:12px"><span style="flex:1;font-weight:600">Servings</span><${MStep} label="servings eaten" value=${e.sv} min=${0.5} max=${10} step=${0.5} onChange=${setSv}/></div>` : null}
    ${q0 ? html`<div class="row" style="margin-top:12px" id="le-amount"><div style="flex:1;min-width:0"><div style="font-weight:600">Amount</div><div class="small muted">${u0 ? 'In ' + (UNIT_PL[u0] || u0) : 'How many'}</div></div><${MStep} label=${'amount of ' + e.name} value=${Math.round(q0 * (e.q || 1) * 100) / 100} min=${stepU} max=${u0 === 'g' || u0 === 'ml' ? 2000 : 50} step=${stepU} unit=${u0 ? ' ' + u0 : ''} onChange=${setCount}/></div>`
    : e.k !== 'recipe' ? html`<div class="row" style="margin-top:12px" id="le-amount"><div style="flex:1;min-width:0"><div style="font-weight:600">Amount</div><div class="small muted">${e.txt1 || (e.txt && !e.q) ? 'Times ' + (e.txt1 || e.txt) : 'Times what you logged'}</div></div><${MStep} label="times the logged amount" value=${e.q || 1} min=${0.25} max=${20} step=${0.5} onChange=${setQ}/></div>` : null}
    <div class="row" style="margin-top:12px" id="le-when-row"><label for="le-when" style="flex:1;font-weight:600">When you ate it<span class="small muted" style="display:block;font-weight:400">Used by Review my eating. Starts as when you logged it.</span></label>
      <input class="field" id="le-when" type="time" style="width:auto" value=${hhmm(e.at)} onChange=${ev => setWhen(ev.target.value)}/></div>
    <div style="margin-top:12px"><${MacroTiles} m=${e.m}/><${ExtraLine} m=${e.m}/></div>
    ${e.k === 'num' ? html`<button class="btn wide" id="le-edit" style="margin-top:12px" onClick=${() => setEditing(true)}>${I.edit} Edit name and numbers</button>` : null}
    <div style="margin-top:14px"><span class="lbl">${savedFor(e) ? 'Saved in ' + savedFor(e).cat : 'Save to a category'}</span><${CatPick} e=${e}/></div>
    <div class="stack" style="margin-top:14px">${day !== ymd(new Date()) ? html`<button class="btn wide" id="le-again" onClick=${() => logAgain(ymd(new Date()), e)}>Log again today</button>` : html`<button class="btn wide" id="le-again" onClick=${() => logAgain(day, e)}>Log another</button>`}
      <button class="btn danger wide" id="le-del" onClick=${() => { closeSheet(); removeLog(day, id); }}>Remove</button><button class="btn wide" onClick=${closeSheet}>Done</button></div><//>`;
}
function GoalsSheet() {
  const G = ML().goals; const [d, setD] = useState(() => Object.fromEntries(NUT.map(([k]) => [k, G[k] != null ? String(G[k]) : ''])));
  const save = () => { mealCommit(m => { m.goals = Object.fromEntries(NUT.filter(([k]) => +d[k] > 0).map(([k]) => [k, +d[k]])); }); closeSheet(); };
  return html`<${Sheet} label="Daily goals"><h2>Daily goals</h2><p class="note">Fill in only what you want to track. Sugar and sodium are limits to stay under.</p>
    <button class="btn ghost wide" id="goal-calc" style="margin-top:10px" onClick=${() => openSheet({ type: 'mealTargets' })}>Work them out from my height, weight and goal</button>
    <div class="me-mac" style="margin-top:12px">${NUT.map(([k, l, u]) => html`<div key=${k}><label class="small muted" for=${'goal-' + k}>${l}${LIMITS[k] ? ' max' : ''}${u ? ' (' + u.trim() + ')' : ''}</label><input class="field" id=${'goal-' + k} inputmode="numeric" value=${d[k]} onInput=${e => setD({ ...d, [k]: e.target.value.replace(/\D/g, '') })}/></div>`)}</div>
    <p class="small faint" style="margin-top:10px">Your own targets, for planning. ${NOT_ADVICE}</p>
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
      <p class="small muted">${G[met] ? 'Your goal is ' + fmtNut(met, G[met]) + (met === 'p' ? ' g' : ' kcal') + ' a day. ' : ''}Averages count only days with something logged.</p>
      <button class="btn text" id="stats-eat-review" style="padding-left:0" onClick=${() => { UI.setTab('meals'); UI.setView({ type: 'eatReview' }); }}>Review my eating</button></div></div>`;
}

/* ---------- Mix & match: one plain base, many flavors ---------- */
/* A base is cooked plain; a flavor (a spice rub, a sauce or mix-ins) turns it into a different meal. Each pairing is a
   full recipe with the id 'base~flavor', so it scales, adds to the prep and shopping list, and counts macros like any
   other. Flavor amounts are written for `per` servings and scale to the base's batch. */
const MIX_BASES = [
  { id: 'b-chicken', name: 'Baked Chicken', short: 'Chicken', fam: 'protein', cat: 'base', serves: 6, size: '4 oz cooked', mins: 30, keeps: 4, freezes: true, week: 4,
    d: 'Plain, juicy chicken breast. Slice it for bowls, wraps and salads.',
    ing: ['2 lb boneless skinless chicken breast', '1 tbsp olive oil', '1 tsp salt', '½ tsp black pepper'],
    steps: ['Heat the oven to 425°F (220°C). Pat the chicken dry.', 'Rub the chicken with the oil, salt and pepper.', 'Bake 18–22 minutes, until the thickest piece reaches 165°F (74°C).', 'Rest 5 minutes, then slice or shred.'],
    rubAt: 1, rubStep: 'Then rub on the spice mix.', sauceAt: 3, sauceStep: 'Toss the chicken in the sauce, or pack the sauce on the side so it stays fresh.',
    tip: 'Cook a double batch plain, split it, and give each half a different flavor.' },
  { id: 'b-turkey', name: 'Ground Turkey Crumble', short: 'Turkey', fam: 'protein', cat: 'base', serves: 6, size: '⅔ cup', mins: 20, keeps: 4, freezes: true, week: 4,
    d: 'Browned turkey with onion and garlic. Good in bowls, lettuce wraps, tortillas and sweet potatoes.',
    ing: ['2 lb ground turkey (93% lean)', '1 yellow onion, diced', '3 cloves garlic, minced', '1 tbsp olive oil', '1 tsp salt'],
    steps: ['Cook the onion in the oil over medium heat until soft, about 5 minutes. Add the garlic for 1 minute.', 'Add the turkey and brown it, breaking it up, 8–10 minutes until no pink remains.', 'Season with the salt and spoon off any liquid.'],
    rubAt: 1, rubStep: 'Stir in the spice mix for the last 2 minutes.', sauceAt: 2, sauceStep: 'Stir in the sauce and simmer 2 minutes until it coats the turkey.',
    tip: 'Brown it all at once, then split it between two pans to flavor each half.' },
  { id: 'b-chickpeas', name: 'Roasted Chickpeas', short: 'Chickpeas', fam: 'protein', cat: 'base', serves: 5, size: '¾ cup', mins: 35, keeps: 4, freezes: false, week: 3,
    d: 'Crispy chickpeas for bowls, salads and snacking. No meat, still filling.',
    ing: ['3 cans chickpeas (15 oz), rinsed', '2 tbsp olive oil', '½ tsp salt'],
    steps: ['Heat the oven to 425°F (220°C). Rinse the chickpeas and pat them very dry.', 'Toss with the oil and salt and spread on a sheet pan.', 'Roast 25–30 minutes, shaking the pan halfway, until crisp.', 'Cool on the pan.'],
    rubAt: 1, rubStep: 'Toss with the spice mix too.', sauceAt: 3, sauceStep: 'Pack the sauce on the side and toss just before eating so they stay crisp.',
    tip: 'Sauced chickpeas soften in the fridge, so dry rubs keep best.' },
  { id: 'b-rice', name: 'Batch Rice', short: 'Rice', fam: 'grain', cat: 'base', serves: 6, size: '1 cup cooked', mins: 30, keeps: 4, freezes: true, week: 5,
    d: 'Plain long-grain rice. Swap in quinoa or brown rice with the same flavors.',
    ing: ['2 cups long-grain rice (dry)', '1 tsp salt'],
    steps: ['Rinse the rice until the water runs mostly clear.', 'Bring 3 cups of water and the salt to a boil, add the rice, cover and simmer on low 18 minutes.', 'Rest 10 minutes covered, then fluff.', 'Spread on a tray to cool quickly, then refrigerate within an hour.'],
    rubAt: 1, rubStep: 'Add the flavorings to the pot with the water.', sauceAt: 2, sauceStep: 'Fold in the flavorings.' },
  { id: 'b-veg', name: 'Roasted Vegetables', short: 'Roasted Vegetables', fam: 'veg', cat: 'base', serves: 6, size: '1 cup', mins: 40, keeps: 4, freezes: false, week: 6,
    d: 'A tray of mixed vegetables. Use whatever is cheap that week.',
    ing: ['1 head broccoli, cut into florets', '2 bell peppers, chopped', '2 zucchini, chopped', '1 red onion, cut into wedges', '3 carrots, sliced', '3 tbsp olive oil', '1 tsp salt'],
    steps: ['Heat the oven to 425°F (220°C).', 'Toss the vegetables with the oil and salt.', 'Spread over two sheet pans so they roast instead of steam.', 'Roast 25–30 minutes, stirring once, until browned at the edges.'],
    rubAt: 1, rubStep: 'Toss with the spice mix too.', sauceAt: 3, sauceStep: 'Toss the hot vegetables with the sauce.' },
  { id: 'b-eggs', name: 'Egg Muffins', short: 'Egg Muffins', fam: 'eggs', cat: 'breakfast', serves: 6, size: '2 muffins', mins: 35, keeps: 4, freezes: true, week: 5,
    d: 'Twelve egg muffins. The mix-ins decide the flavor.',
    ing: ['12 eggs', '½ cup milk', '½ tsp salt', '¼ tsp black pepper', '1 tbsp olive oil, for the pan'],
    steps: ['Heat the oven to 350°F (175°C). Oil a 12-cup muffin pan well.', 'Whisk the eggs, milk, salt and pepper.', 'Pour the eggs into the cups until about three-quarters full.', 'Bake 20–25 minutes, until the centers are set.', 'Cool on a rack before packing. Reheat 30–45 seconds.'],
    rubAt: 2, rubStep: 'Split the mix-ins between the cups first.', sauceAt: 4, sauceStep: '' },
  { id: 'b-oats', name: 'Overnight Oats', short: 'Overnight Oats', fam: 'oats', cat: 'breakfast', serves: 5, size: '1 jar', mins: 10, keeps: 4, freezes: false, week: 5,
    d: 'Oats, milk, Greek yogurt and chia in five jars.',
    ing: ['2½ cups rolled oats', '2½ cups milk', '1¼ cups plain Greek yogurt', '5 tbsp chia seeds', '1 tsp vanilla extract'],
    steps: ['Mix the oats, milk, yogurt, chia seeds and vanilla in a big bowl.', 'Divide between five jars.', 'Refrigerate overnight. Eat cold, or warm 1–2 minutes with a splash of milk.'],
    rubAt: 0, rubStep: 'Stir in the flavorings.', sauceAt: 1, sauceStep: 'Spoon the toppings over the jars.' },
  { id: 'b-salad', name: 'Canned Chicken Salad', short: 'Chicken Salad', fam: 'salad', cat: 'main', serves: 4, size: '¾ cup', mins: 10, keeps: 3, freezes: false, week: 3,
    d: 'Canned chicken and Greek yogurt. Works the same with canned tuna or salmon.',
    ing: ['4 cans chicken (5 oz), drained', '½ cup plain Greek yogurt', '2 stalks celery, diced', '1 tbsp Dijon mustard', '¼ tsp black pepper'],
    steps: ['Flake the chicken into a bowl.', 'Stir in the yogurt, celery, mustard and pepper.', 'Pack in four containers. Eat in a wrap, on greens, or with crackers.'],
    rubAt: 1, rubStep: 'Stir in the flavorings too.', sauceAt: 1, sauceStep: '',
    tip: 'For tuna or salmon, copy the recipe and change the first line.' },
];
/* kind: 'rub' goes on before cooking, 'sauce' after. `for`: which bases it suits. */
const MIX_FLAVORS = [
  { id: 'teriyaki', name: 'Teriyaki', for: ['protein', 'veg'], kind: 'sauce', per: 6, d: 'Sweet, salty and sticky', part: 'Teriyaki sauce',
    ing: ['⅓ cup soy sauce', '3 tbsp honey', '2 cloves garlic, minced', '1 tbsp fresh ginger, grated', '1 tbsp cornstarch', '1 tsp sesame oil', '1 tbsp sesame seeds', '2 green onions, sliced'],
    make: 'Make the sauce: simmer the soy sauce, honey, garlic, ginger, sesame oil and ½ cup water for 2 minutes, then stir in the cornstarch mixed with 2 tbsp water until thick.', finish: 'Top with the sesame seeds and green onions.', goes: ['b-rice~sesame-rice', 'b-veg~sesame-ginger'] },
  { id: 'buffalo', name: 'Buffalo', for: ['protein', 'salad'], kind: 'sauce', per: 6, d: 'Tangy and hot', part: 'Buffalo sauce',
    ing: ['½ cup hot sauce', '2 tbsp butter', '1 tsp garlic powder', '½ cup plain Greek yogurt', '1 tsp dried dill'],
    make: 'Make the sauce: melt the butter and whisk in the hot sauce and garlic powder. Stir the dill into the yogurt for a dip.', finish: 'Serve with the yogurt dip and celery or carrot sticks.', goes: ['b-rice~lemon-rice', 'b-veg~italian'] },
  { id: 'lemon-herb', name: 'Lemon Herb', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Bright, garlicky, goes with anything', part: 'Lemon herb rub',
    ing: ['2 lemons', '4 cloves garlic, minced', '2 tsp dried oregano', '1 tsp dried thyme', '2 tbsp olive oil'],
    make: 'Mix the zest and juice of the lemons with the garlic, herbs and oil.', goes: ['b-rice~lemon-rice', 'b-veg~zaatar'] },
  { id: 'taco', name: 'Taco', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Smoky Tex-Mex spice', part: 'Taco spice mix',
    ing: ['1 tbsp chili powder', '2 tsp ground cumin', '1 tsp smoked paprika', '1 tsp garlic powder', '1 tsp onion powder', '½ tsp dried oregano', '1 lime'],
    make: 'Mix the spices.', finish: 'Squeeze the lime over before packing.', goes: ['b-rice~cilantro-lime', 'b-veg~taco'] },
  { id: 'bbq', name: 'BBQ', for: ['protein'], kind: 'sauce', per: 6, d: 'Sweet and smoky', part: 'BBQ sauce',
    ing: ['¾ cup BBQ sauce', '1 tsp smoked paprika', '1 tbsp apple cider vinegar'],
    make: 'Stir the paprika and vinegar into the BBQ sauce.', finish: 'Good with coleslaw mix or on a bun.', goes: ['b-veg~cajun'] },
  { id: 'shawarma', name: 'Shawarma', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Warm Middle Eastern spices with garlic yogurt sauce', part: 'Shawarma spice and sauce',
    ing: ['2 tsp ground cumin', '2 tsp smoked paprika', '1 tsp ground turmeric', '½ tsp ground cinnamon', '½ tsp ground allspice', '4 cloves garlic, minced', '2 lemons', '2 tbsp olive oil', '1 cup plain Greek yogurt'],
    make: 'Mix the spices with 3 cloves of the garlic, the juice of one lemon and the oil. For the sauce, stir the last clove of garlic, the juice of the other lemon and a pinch of salt into the yogurt.', finish: 'Serve with the garlic yogurt sauce, in pita or over rice with cucumber and tomato.', goes: ['b-rice~turmeric-rice', 'b-veg~zaatar'] },
  { id: 'zaatar', name: 'Za’atar Lemon', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Herby, tangy and nutty', part: 'Za’atar rub',
    ing: ['3 tbsp za’atar', '1 lemon', '2 tbsp olive oil', '2 cloves garlic, minced'],
    make: 'Mix the za’atar with the lemon zest and juice, oil and garlic.', finish: 'A spoon of Greek yogurt on top is good.', goes: ['b-rice~turmeric-rice'] },
  { id: 'peanut', name: 'Peanut', for: ['protein', 'veg'], kind: 'sauce', per: 6, d: 'Creamy satay-style sauce', part: 'Peanut sauce',
    ing: ['⅓ cup peanut butter', '3 tbsp soy sauce', '2 tbsp honey', '1 lime', '1 tbsp sriracha', '2 cloves garlic, minced'],
    make: 'Whisk the peanut butter, soy sauce, honey, lime juice, sriracha and garlic with 3–4 tbsp warm water until pourable.', finish: 'Top with chopped peanuts or green onions if you have them.', goes: ['b-rice~coconut-rice', 'b-veg~sesame-ginger'] },
  { id: 'jerk', name: 'Jerk', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Hot, sweet Caribbean spice', part: 'Jerk spice mix',
    ing: ['1 tsp ground allspice', '1 tsp dried thyme', '1 tsp smoked paprika', '½ tsp cayenne', '1 tsp garlic powder', '1 tbsp brown sugar', '1 lime', '1 tbsp olive oil'],
    make: 'Mix the spices and sugar with the lime juice and oil.', goes: ['b-rice~coconut-rice'] },
  { id: 'honey-garlic', name: 'Honey Garlic', for: ['protein'], kind: 'sauce', per: 6, d: 'Sweet and garlicky glaze', part: 'Honey garlic sauce',
    ing: ['¼ cup honey', '3 tbsp soy sauce', '5 cloves garlic, minced', '1 tsp rice vinegar', '1 tsp cornstarch'],
    make: 'Simmer the honey, soy sauce, garlic, vinegar and ¼ cup water for 2 minutes, then stir in the cornstarch mixed with 1 tbsp water until thick.', goes: ['b-rice~sesame-rice'] },
  { id: 'gochujang', name: 'Gochujang', for: ['protein'], kind: 'sauce', per: 6, d: 'Spicy-sweet Korean chili sauce', part: 'Gochujang sauce',
    ing: ['3 tbsp gochujang', '2 tbsp soy sauce', '2 tbsp honey', '1 tbsp rice vinegar', '1 tsp sesame oil', '2 cloves garlic, minced', '1 tbsp sesame seeds'],
    make: 'Whisk everything except the sesame seeds with 2 tbsp water.', finish: 'Top with the sesame seeds. Good over rice with a fried egg.', goes: ['b-rice~sesame-rice', 'b-veg~sesame-ginger'] },
  { id: 'pesto', name: 'Basil Pesto', for: ['protein', 'veg'], kind: 'sauce', per: 6, d: 'Fresh basil, no cheese', part: 'Pesto',
    ing: ['2 cups fresh basil', '⅓ cup olive oil', '¼ cup walnuts', '2 cloves garlic', '1 lemon', '¼ tsp salt'],
    make: 'Blend the basil, oil, walnuts, garlic, lemon juice and salt until smooth.', finish: 'Good with pasta, rice or roasted tomatoes.', goes: ['b-rice~lemon-rice', 'b-veg~italian'] },
  { id: 'cajun', name: 'Cajun', for: ['protein', 'veg'], kind: 'rub', per: 6, d: 'Peppery Louisiana spice', part: 'Cajun spice mix',
    ing: ['2 tsp smoked paprika', '1 tsp garlic powder', '1 tsp onion powder', '1 tsp dried oregano', '1 tsp dried thyme', '½ tsp cayenne', '½ tsp black pepper', '1 tbsp olive oil'],
    make: 'Mix the spices with the oil.', goes: ['b-rice~spanish-rice', 'b-veg~cajun'] },
  { id: 'chipotle-lime', name: 'Chipotle Lime', for: ['protein', 'salad'], kind: 'sauce', per: 6, d: 'Smoky heat with lime', part: 'Chipotle lime sauce',
    ing: ['2 chipotle peppers in adobo, minced', '2 tbsp adobo sauce', '2 limes', '2 tbsp honey', '2 cloves garlic, minced', '1 tbsp olive oil'],
    make: 'Stir the chipotles, adobo sauce, lime juice, honey, garlic and oil together.', finish: 'Top with cilantro if you have it.', goes: ['b-rice~cilantro-lime'] },
  /* rice */
  { id: 'cilantro-lime', name: 'Cilantro Lime', for: ['grain'], kind: 'sauce', per: 6, d: 'Burrito-bowl rice', part: 'Cilantro lime',
    ing: ['2 limes', '1 bunch cilantro, chopped', '1 tbsp olive oil'], use: 'Fold in the lime zest and juice, cilantro and oil.' },
  { id: 'coconut-rice', name: 'Coconut Ginger', for: ['grain'], kind: 'rub', per: 6, d: 'Rich and lightly sweet', part: 'Coconut ginger',
    ing: ['1 can light coconut milk (13.5 oz)', '1 tbsp fresh ginger, grated'], use: 'Use the coconut milk for part of the water (still 3 cups of liquid in all) and add the ginger.' },
  { id: 'spanish-rice', name: 'Spanish Tomato', for: ['grain'], kind: 'rub', per: 6, d: 'Tomato, cumin and onion', part: 'Tomato flavorings',
    ing: ['1 can tomato sauce (8 oz)', '½ yellow onion, diced', '1 tsp ground cumin', '1 tsp garlic powder', '1 tbsp olive oil'],
    make: 'Before the water, toast the rinsed rice and onion in the oil for 3 minutes.', use: 'Use the tomato sauce for part of the water (3 cups of liquid in all) and add the cumin and garlic powder.' },
  { id: 'lemon-rice', name: 'Lemon Herb', for: ['grain'], kind: 'sauce', per: 6, d: 'Fresh and light', part: 'Lemon herb',
    ing: ['1 lemon', '½ bunch parsley, chopped', '1 tbsp olive oil'], use: 'Fold in the lemon zest and juice, parsley and oil.' },
  { id: 'sesame-rice', name: 'Garlic Sesame Fried', for: ['grain'], kind: 'sauce', per: 6, d: 'Quick fried rice with egg and peas', part: 'Fried rice',
    ing: ['3 tbsp soy sauce', '1 tbsp sesame oil', '3 cloves garlic, minced', '1 cup frozen peas', '2 eggs', '3 green onions, sliced'],
    use: 'Once the rice is cool, stir-fry the garlic and peas in the sesame oil for 2 minutes, scramble in the eggs, then add the rice and soy sauce and toss until hot. Finish with the green onions.' },
  { id: 'turmeric-rice', name: 'Turmeric Spiced', for: ['grain'], kind: 'rub', per: 6, d: 'Golden rice with warm spice', part: 'Spices',
    ing: ['1 tsp ground turmeric', '1 tsp ground cumin', '¼ tsp ground cinnamon', '1 tbsp olive oil', '¼ cup sliced almonds'],
    use: 'Add the turmeric, cumin, cinnamon and oil.', finish: 'Top with the almonds, toasted in a dry pan.' },
  /* vegetables */
  { id: 'italian', name: 'Italian Herb', for: ['veg'], kind: 'rub', per: 6, d: 'Garlic and herbs', part: 'Italian seasoning',
    ing: ['1 tbsp Italian seasoning', '1 tsp garlic powder'] },
  { id: 'sesame-ginger', name: 'Sesame Ginger', for: ['veg'], kind: 'sauce', per: 6, d: 'For Asian-style bowls', part: 'Sesame ginger sauce',
    ing: ['2 tbsp soy sauce', '1 tbsp sesame oil', '1 tbsp honey', '1 tsp fresh ginger, grated', '1 tbsp sesame seeds'], make: 'Whisk the soy sauce, sesame oil, honey and ginger.', finish: 'Sprinkle with the sesame seeds.' },
  { id: 'balsamic', name: 'Balsamic Glaze', for: ['veg'], kind: 'sauce', per: 6, d: 'Sweet and tangy', part: 'Balsamic glaze',
    ing: ['3 tbsp balsamic vinegar', '1 tbsp honey'], make: 'Simmer the vinegar and honey 3–4 minutes until syrupy.' },
  /* egg muffins */
  { id: 'southwest', name: 'Southwest', for: ['eggs'], kind: 'rub', per: 6, d: 'Black beans, peppers and salsa', part: 'Mix-ins',
    ing: ['1 cup black beans, rinsed', '1 bell pepper, diced', '½ cup salsa', '1 tsp ground cumin'], finish: 'Top with more salsa when you eat them.' },
  { id: 'med-eggs', name: 'Mediterranean', for: ['eggs'], kind: 'rub', per: 6, d: 'Spinach, tomato and olives', part: 'Mix-ins',
    ing: ['5 oz baby spinach, chopped', '1 cup cherry tomatoes, quartered', '¼ cup kalamata olives, chopped', '1 tsp dried oregano'] },
  { id: 'turkey-eggs', name: 'Turkey & Spinach', for: ['eggs'], kind: 'rub', per: 6, d: 'Extra protein', part: 'Mix-ins',
    ing: ['½ lb ground turkey (93% lean)', '2 cups baby spinach, chopped', '1 tsp Italian seasoning'], make: 'Brown the turkey with the Italian seasoning and let it cool a little.' },
  { id: 'everything', name: 'Everything Bagel', for: ['eggs'], kind: 'rub', per: 6, d: 'Green onion and everything seasoning', part: 'Mix-ins',
    ing: ['4 green onions, sliced', '1 cup baby spinach, chopped', '2 tbsp everything bagel seasoning'], use: 'Split the green onions and spinach between the cups first, and sprinkle the seasoning on top after pouring.' },
  { id: 'broccoli-eggs', name: 'Broccoli Garlic', for: ['eggs'], kind: 'rub', per: 6, d: 'Simple and green', part: 'Mix-ins',
    ing: ['2 cups broccoli, finely chopped', '2 cloves garlic, minced', '½ tsp onion powder'] },
  /* oats */
  { id: 'pb-banana', name: 'PB Banana', for: ['oats'], kind: 'rub', per: 5, d: 'Peanut butter and banana', part: 'Flavorings',
    ing: ['⅓ cup peanut butter', '2 bananas, sliced', '2 tbsp honey'], use: 'Stir in the peanut butter and honey; top with the banana.' },
  { id: 'berry', name: 'Berry Vanilla', for: ['oats'], kind: 'rub', per: 5, d: 'Fresh or frozen berries', part: 'Flavorings',
    ing: ['2 cups mixed berries', '3 tbsp honey'], use: 'Stir in the honey; top with the berries.' },
  { id: 'apple-pie', name: 'Apple Pie', for: ['oats'], kind: 'rub', per: 5, d: 'Apple, cinnamon and walnuts', part: 'Flavorings',
    ing: ['2 apples, diced', '2 tsp ground cinnamon', '3 tbsp maple syrup', '¼ cup walnuts, chopped'] },
  { id: 'choc-pb', name: 'Chocolate PB', for: ['oats'], kind: 'rub', per: 5, d: 'Tastes like dessert', part: 'Flavorings',
    ing: ['3 tbsp cocoa powder', '¼ cup peanut butter', '3 tbsp maple syrup'] },
  { id: 'carrot-cake', name: 'Carrot Cake', for: ['oats'], kind: 'rub', per: 5, d: 'Carrot, raisins and spice', part: 'Flavorings',
    ing: ['2 carrots, grated', '1 tsp ground cinnamon', '¼ tsp ground nutmeg', '3 tbsp maple syrup', '¼ cup walnuts, chopped', '¼ cup raisins'] },
  { id: 'tropical', name: 'Tropical', for: ['oats'], kind: 'rub', per: 5, d: 'Pineapple and coconut', part: 'Flavorings',
    ing: ['1½ cups pineapple, diced', '¼ cup shredded coconut', '2 tbsp honey'], use: 'Stir in the honey and coconut; top with the pineapple.' },
  /* chicken salad */
  { id: 'lemon-dill', name: 'Lemon Dill', for: ['salad'], kind: 'rub', per: 4, d: 'Classic and fresh', part: 'Flavorings',
    ing: ['1 lemon', '2 tbsp fresh dill, chopped', '¼ cup dill pickles, chopped'] },
  { id: 'curry-salad', name: 'Curry', for: ['salad'], kind: 'rub', per: 4, d: 'Curry, grapes and almonds', part: 'Flavorings',
    ing: ['2 tsp curry powder', '1 cup grapes, halved', '¼ cup sliced almonds'] },
  { id: 'med-salad', name: 'Mediterranean', for: ['salad'], kind: 'rub', per: 4, d: 'Cucumber, olives and oregano', part: 'Flavorings',
    ing: ['1 cucumber, diced', '¼ cup kalamata olives, chopped', '1 tsp dried oregano', '1 lemon'] },
  { id: 'ranch', name: 'Ranch', for: ['salad'], kind: 'rub', per: 4, d: 'Herby and creamy', part: 'Flavorings',
    ing: ['1 tsp dried dill', '1 tsp garlic powder', '1 tsp onion powder', '½ tsp dried parsley', '1 tbsp lemon juice'] },
  /* Nov 11: sauces and marinades from Newt's reels log */
  { id: 'harissa-yogurt', name: 'Harissa Yogurt', for: ['protein', 'veg'], kind: 'rub', per: 9, d: 'Spicy, smoky yogurt marinade (from a reel)', part: 'Harissa yogurt marinade',
    ing: ['1 small yellow onion', '2 small tomatoes', '1 bunch parsley', '6 cloves garlic', '1 cup plain nonfat Greek yogurt', '2 tbsp olive oil', '½ cup harissa paste', '½ lemon', '1½ tbsp ground turmeric', '1 tbsp smoked paprika', '2 tsp salt'],
    make: 'Blend the onion, tomatoes, parsley, garlic and yogurt until smooth, then stir in the oil, harissa, lemon juice, turmeric, paprika and salt. Marinate at least 2 hours.', goes: ['b-rice~turmeric-rice', 'b-veg~zaatar'] },
  { id: 'greek-yogurt', name: 'Greek Yogurt & Oregano', for: ['protein'], kind: 'rub', per: 9, d: 'Tangy, garlicky and tender (from a reel)', part: 'Greek yogurt marinade',
    ing: ['¾ cup plain nonfat Greek yogurt', '1 tbsp light mayo', '4 cloves garlic, grated', '1½ tbsp dried oregano', '½ tsp ground cloves', '1 lemon', '1 tbsp olive oil', '2 tsp salt', '1 tsp black pepper'],
    make: 'Mix the yogurt, mayo, garlic, oregano, cloves, the lemon’s zest and half its juice, the oil, salt and pepper. Marinate at least 2 hours.', goes: ['b-rice~lemon-rice', 'b-veg~italian'] },
  { id: 'thai-herb', name: 'Thai Herb Chili Sauce', for: ['protein', 'veg'], kind: 'sauce', per: 12, d: 'Bright, hot and herby, with lemongrass and lime (a reel favorite)', part: 'Thai herb chili sauce',
    ing: ['½ bunch mint', '½ bunch cilantro', '2 limes', '2 stalks lemongrass', '6 Thai chilies', '4 tbsp fish sauce', '2 tbsp soy sauce', '6 tbsp brown sugar', '¼ shallot', '10 cloves garlic'],
    make: 'Blend the herbs, lime juice, lemongrass, chilies, fish sauce, soy sauce, sugar, shallot and garlic until as smooth as you like.', finish: 'Keep the sauce on the side; it’s also a great salad dressing.', goes: ['b-rice~coconut-rice'] },
  { id: 'muhammara', name: 'Muhammara', for: ['protein', 'veg'], kind: 'sauce', per: 12, d: 'Roasted red pepper and walnut sauce, sweet and smoky (Carleigh Bodrug’s reel)', part: 'Muhammara',
    ing: ['¾ cup walnuts', '4 red bell peppers, roasted and peeled', '½ cup roasted garlic cloves', '1 tbsp Aleppo pepper flakes', '2 tbsp ground cumin', '2 tsp salt', '1 tsp white pepper', '¼ cup pomegranate molasses', '½ cup olive oil', '1 cup breadcrumbs'],
    make: 'Pulse the walnuts in a food processor, then add everything else and pulse until smooth. Taste for salt.', finish: 'Spoon it on when you eat; it also makes a dip with pita.', goes: ['b-rice~lemon-rice'] },
];
const MIX_BASE = Object.fromEntries(MIX_BASES.map(b => [b.id, b]));
const MIX_FLAVOR = Object.fromEntries(MIX_FLAVORS.map(f => [f.id, f]));
const flavorsFor = b => MIX_FLAVORS.filter(f => f.for.includes(b.fam));
const _combo = new Map();
/* The recipe for a base on its own (id 'b-chicken') or with a flavor ('b-chicken~teriyaki') */
function comboRecipe(id) {
  if (_combo.has(id)) return _combo.get(id);
  const [bid, fid] = String(id).split('~'); const b = MIX_BASE[bid]; const fl = fid ? MIX_FLAVOR[fid] : null;
  if (!b || (fid && (!fl || !fl.for.includes(b.fam)))) return null;
  const ing = b.ing.map(parseIng).filter(Boolean); let steps = b.steps.slice(); let r;
  if (!fl) r = { id, name: b.name, cat: b.cat, serves: b.serves, size: b.size, mins: b.mins, keeps: b.keeps, freezes: b.freezes, week: b.week, ing, steps, note: b.tip || '', builtin: true, mix: { base: bid } };
  else {
    const k = b.serves / (fl.per || b.serves);
    const fi = fl.ing.map(parseIng).filter(Boolean).map(g => g.q != null ? { ...g, q: g.q * k } : g);
    steps = [];
    if (fl.make) steps.push(fl.make);
    b.steps.forEach((s, i) => {
      steps.push(i === b.rubAt && fl.kind === 'rub' ? s + ' ' + (fl.use || b.rubStep) : s);
      if (i === b.sauceAt && fl.kind === 'sauce') { const t = fl.use || b.sauceStep; if (t) steps.push(t); }
    });
    if (fl.finish) steps.push(fl.finish);
    r = { id, name: fl.name + ' ' + b.short, cat: b.cat, serves: b.serves, size: b.size, mins: b.mins + (fl.make ? 5 : 0), keeps: b.keeps, freezes: b.freezes,
      week: b.week, ing: ing.concat(fi), steps, note: b.tip || '', builtin: true, mix: { base: bid, flavor: fid, split: ing.length, part: fl.part || fl.name } };
  }
  _combo.set(id, r); return r;
}
const comboName = id => { const r = comboRecipe(id); return r ? r.name : ''; };
/* Every pairing, for search */
const allCombos = () => MIX_BASES.flatMap(b => flavorsFor(b).map(f => comboRecipe(b.id + '~' + f.id)));
/* Pairings in the prep that share a base: cook the base once, then split it */
function sharedBases(items) {
  const by = {}; for (const { r } of items) if (r.mix && r.mix.flavor) (by[r.mix.base] = by[r.mix.base] || []).push(r);
  return Object.entries(by).filter(([, l]) => l.length > 1).map(([b, l]) => ({ base: MIX_BASE[b], list: l }));
}
function MixList() {
  return html`<div class="stack" id="mix-list">${MIX_BASES.map(b => { const fl = flavorsFor(b);
    return html`<button key=${b.id} class="day-btn mix-base" onClick=${() => UI.setView({ type: 'base', id: b.id })}><div style="min-width:0"><div class="t">${b.name}</div>
      <div class="s">${fl.length} flavors · ${fl.slice(0, 3).map(f => f.name).join(', ')}…</div></div><span class="go">Open</span></button>`; })}</div>`;
}
function BaseView({ id }) {
  const b = MIX_BASE[id]; if (!b) return html`<div class="card note" style="margin-top:12px">That base isn’t here.</div>`;
  const plain = comboRecipe(b.id); const pm = macros(plain);
  return html`<div>
    <div class="eyebrow" style="margin-top:4px">Mix & match base · ${MEAL_CAT_NAME[b.cat]}</div>
    <h2 class="meal-title">${b.name}</h2>
    <p class="note" style="margin-top:6px">${b.d}</p>
    <button class="card mix-plain" onClick=${() => UI.setView({ type: 'meal', id: b.id, from: { type: 'base', id: b.id } })}><div style="flex:1;min-width:0"><div style="font-weight:700">The plain base</div>
      <div class="small muted">${b.ing.map(x => shopName(parseIng(x).n)).join(', ')} · makes ${b.serves}</div>
      ${pm ? html`<div class="small muted num">${macroLine(pm)} a serving</div>` : null}</div><span class="go">Recipe</span></button>
    ${b.tip ? html`<div class="tip-card" style="margin-top:10px;padding-right:14px">${b.tip}</div>` : null}
    <div class="section-h"><h2>Pick a flavor</h2><span class="aside">${flavorsFor(b).length} ideas</span></div>
    <div class="stack">${flavorsFor(b).map(f => [f, !recipeIssues(comboRecipe(b.id + '~' + f.id)).block.length]).sort((x, y) => y[1] - x[1]).map(([f]) => { const cid = b.id + '~' + f.id; const r = comboRecipe(cid); const m = macros(r); const inP = planItemFor(cid);
      return html`<div key=${f.id} class="meal-row mix-flavor"><button class="main" onClick=${() => UI.setView({ type: 'meal', id: cid, from: { type: 'base', id: b.id } })}><div class="t">${r.name}</div>
        <div class="s">${f.d}${f.kind === 'rub' && b.fam !== 'eggs' && b.fam !== 'oats' && b.fam !== 'salad' ? ' · spice rub' : f.kind === 'sauce' && (b.fam === 'protein' || b.fam === 'veg') ? ' · sauce' : ''}</div>
        <div class="s faint">Adds ${f.ing.map(x => shopName(parseIng(x).n).replace(/\s*\(.*\)$/, '')).join(', ')}</div>
        ${m ? html`<div class="s num">${macroLine(m)} a serving</div>` : null}<${IssueLine} r=${r}/></button>
        <button class=${'meal-add' + (inP ? ' on' : '')} aria-label=${inP ? r.name + ' is in this week. Remove it' : 'Add ' + r.name + ' to this week'} onClick=${() => inP ? removeFromPlan(cid) : addToPlan(cid)}>${inP ? I.check : I.plus}</button></div>`; })}</div>
    <p class="small faint" style="margin-top:14px">Add two or three flavors to your prep and the shopping list buys the base once, in the total amount.</p>
  </div>`;
}
