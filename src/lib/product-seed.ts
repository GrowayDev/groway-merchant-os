import { randomUUID } from 'crypto'

// SKU catalog data structure
export interface CatalogSKU {
  name: string
  price: number
  category: string
}

// Food & Beverage SKUs
const fnbSKUs: Record<string, CatalogSKU[]> = {
  'qsr': [
    { name: 'Burger Combo (Burger + Fries + Drink)', price: 89.90, category: 'Combos' },
    { name: 'Chicken Combo (2pc + Fries + Drink)', price: 79.90, category: 'Combos' },
    { name: 'Veggie Combo (Veg Burger + Fries + Drink)', price: 84.90, category: 'Combos' },
    { name: 'Family Meal (4 Burgers + 2 Fries + 4 Drinks)', price: 249.90, category: 'Combos' },
    { name: 'Beef Burger Classic', price: 54.90, category: 'Burgers' },
    { name: 'Beef Burger Deluxe (Cheese + Bacon)', price: 69.90, category: 'Burgers' },
    { name: 'Chicken Burger', price: 49.90, category: 'Burgers' },
    { name: 'Veggie Burger', price: 49.90, category: 'Burgers' },
    { name: 'Double Beef Burger', price: 79.90, category: 'Burgers' },
    { name: 'Chicken Wings (6pc)', price: 59.90, category: 'Chicken' },
    { name: 'Chicken Wings (12pc)', price: 99.90, category: 'Chicken' },
    { name: 'Chicken Strips (6pc)', price: 54.90, category: 'Chicken' },
    { name: 'Chicken Nuggets (10pc)', price: 49.90, category: 'Chicken' },
    { name: 'Fries Regular', price: 24.90, category: 'Sides' },
    { name: 'Fries Large', price: 34.90, category: 'Sides' },
    { name: 'Onion Rings', price: 29.90, category: 'Sides' },
    { name: 'Coleslaw', price: 19.90, category: 'Sides' },
    { name: 'Mozzarella Sticks (4pc)', price: 39.90, category: 'Sides' },
    { name: 'Coca-Cola 500ml', price: 18.90, category: 'Beverages' },
    { name: 'Fanta 500ml', price: 18.90, category: 'Beverages' },
    { name: 'Sprite 500ml', price: 18.90, category: 'Beverages' },
    { name: 'Stoney 500ml', price: 18.90, category: 'Beverages' },
    { name: 'Minute Maid 500ml', price: 22.90, category: 'Beverages' },
    { name: 'Milkshake Chocolate', price: 34.90, category: 'Beverages' },
    { name: 'Milkshake Strawberry', price: 34.90, category: 'Beverages' },
    { name: 'Milkshake Vanilla', price: 34.90, category: 'Beverages' },
    { name: 'Ice Cream Cone', price: 15.90, category: 'Desserts' },
    { name: 'Sundae Chocolate', price: 24.90, category: 'Desserts' },
    { name: 'Apple Pie', price: 29.90, category: 'Desserts' },
  ],
  'sitdown': [
    { name: 'Garlic Bread (4 slices)', price: 35.00, category: 'Starters' },
    { name: 'Calamari Rings', price: 75.00, category: 'Starters' },
    { name: 'Chicken Livers Peri-Peri', price: 68.00, category: 'Starters' },
    { name: 'Spring Rolls (4pc)', price: 55.00, category: 'Starters' },
    { name: 'Soup of the Day', price: 45.00, category: 'Starters' },
    { name: 'Caesar Salad', price: 75.00, category: 'Salads' },
    { name: 'Greek Salad', price: 72.00, category: 'Salads' },
    { name: 'Sirloin Steak (300g)', price: 185.00, category: 'Grills' },
    { name: 'Rump Steak (300g)', price: 165.00, category: 'Grills' },
    { name: 'Lamb Chops (4pc)', price: 175.00, category: 'Grills' },
    { name: 'Grilled Chicken', price: 125.00, category: 'Grills' },
    { name: 'Peri-Peri Chicken (Quarter)', price: 85.00, category: 'Grills' },
    { name: 'Peri-Peri Chicken (Half)', price: 145.00, category: 'Grills' },
    { name: 'Hake & Chips', price: 95.00, category: 'Seafood' },
    { name: 'Grilled Salmon', price: 175.00, category: 'Seafood' },
    { name: 'Prawns (6pc)', price: 165.00, category: 'Seafood' },
    { name: 'Oxtail Stew', price: 155.00, category: 'Traditional' },
    { name: 'Bobotie with Rice', price: 95.00, category: 'Traditional' },
    { name: 'Pap', price: 28.00, category: 'Sides' },
    { name: 'Chakalaka', price: 32.00, category: 'Sides' },
    { name: 'Rice', price: 28.00, category: 'Sides' },
    { name: 'Soft Drink 340ml', price: 22.00, category: 'Beverages' },
    { name: 'Malva Pudding', price: 55.00, category: 'Desserts' },
    { name: 'Cheesecake Slice', price: 58.00, category: 'Desserts' },
    { name: 'Ice Cream (2 scoops)', price: 35.00, category: 'Desserts' },
  ],
  'shisa-nyama': [
    { name: 'Beef Steak (per 100g)', price: 35.00, category: 'Meat (Weight)' },
    { name: 'Boerewors (per 100g)', price: 22.00, category: 'Meat (Weight)' },
    { name: 'Lamb Chops (per 100g)', price: 45.00, category: 'Meat (Weight)' },
    { name: 'Chicken (per 100g)', price: 18.00, category: 'Meat (Weight)' },
    { name: 'Beef Braai Plate (500g)', price: 145.00, category: 'Meat Plates' },
    { name: 'Boerewors Plate (500g)', price: 95.00, category: 'Meat Plates' },
    { name: 'Mixed Grill (600g)', price: 185.00, category: 'Meat Plates' },
    { name: 'Chicken Braai', price: 85.00, category: 'Meat Plates' },
    { name: 'Pap & Vleis (300g meat)', price: 75.00, category: 'Combos' },
    { name: 'Pap & Wors', price: 55.00, category: 'Combos' },
    { name: 'Shisa Nyama Special', price: 125.00, category: 'Combos' },
    { name: 'Family Pack (1kg)', price: 320.00, category: 'Combos' },
    { name: 'Pap (Small)', price: 18.00, category: 'Sides' },
    { name: 'Pap (Large)', price: 28.00, category: 'Sides' },
    { name: 'Chakalaka', price: 18.00, category: 'Sides' },
    { name: 'Spinach', price: 18.00, category: 'Sides' },
    { name: 'Samp & Beans', price: 22.00, category: 'Sides' },
    { name: 'Beer (Quart)', price: 35.00, category: 'Beverages' },
    { name: 'Castle Lite (Quart)', price: 38.00, category: 'Beverages' },
    { name: 'Cold Drink (500ml)', price: 15.00, category: 'Beverages' },
  ],
  'coffee-shop': [
    { name: 'Espresso', price: 22.00, category: 'Hot Coffee' },
    { name: 'Americano', price: 28.00, category: 'Hot Coffee' },
    { name: 'Cappuccino', price: 32.00, category: 'Hot Coffee' },
    { name: 'Latte', price: 34.00, category: 'Hot Coffee' },
    { name: 'Mocha', price: 38.00, category: 'Hot Coffee' },
    { name: 'Flat White', price: 32.00, category: 'Hot Coffee' },
    { name: 'Hot Chocolate', price: 35.00, category: 'Hot Coffee' },
    { name: 'Chai Latte', price: 36.00, category: 'Hot Coffee' },
    { name: 'Iced Americano', price: 32.00, category: 'Cold Coffee' },
    { name: 'Iced Latte', price: 38.00, category: 'Cold Coffee' },
    { name: 'Iced Mocha', price: 42.00, category: 'Cold Coffee' },
    { name: 'Frappe', price: 45.00, category: 'Cold Coffee' },
    { name: 'English Breakfast Tea', price: 22.00, category: 'Tea' },
    { name: 'Rooibos Tea', price: 22.00, category: 'Tea' },
    { name: 'Green Tea', price: 24.00, category: 'Tea' },
    { name: 'Croissant', price: 28.00, category: 'Pastries' },
    { name: 'Croissant (Cheese & Ham)', price: 38.00, category: 'Pastries' },
    { name: 'Chocolate Croissant', price: 32.00, category: 'Pastries' },
    { name: 'Muffin (Blueberry)', price: 28.00, category: 'Pastries' },
    { name: 'Muffin (Chocolate)', price: 28.00, category: 'Pastries' },
    { name: 'Cinnamon Roll', price: 35.00, category: 'Pastries' },
    { name: 'Bagel (Cream Cheese)', price: 35.00, category: 'Food' },
    { name: 'Breakfast Wrap', price: 55.00, category: 'Food' },
    { name: 'Club Sandwich', price: 65.00, category: 'Food' },
  ],
  'bakery': [
    { name: 'White Bread Loaf', price: 18.00, category: 'Bread' },
    { name: 'Brown Bread Loaf', price: 20.00, category: 'Bread' },
    { name: 'Sourdough Loaf', price: 38.00, category: 'Bread' },
    { name: 'French Baguette', price: 28.00, category: 'Bread' },
    { name: 'Hot Dog Rolls (6pc)', price: 22.00, category: 'Rolls' },
    { name: 'Burger Buns (6pc)', price: 24.00, category: 'Rolls' },
    { name: 'Portuguese Roll', price: 8.50, category: 'Rolls' },
    { name: 'Croissant', price: 22.00, category: 'Pastries' },
    { name: 'Chocolate Croissant', price: 26.00, category: 'Pastries' },
    { name: 'Vetkoek', price: 12.00, category: 'Pastries' },
    { name: 'Vetkoek with Mince', price: 25.00, category: 'Pastries' },
    { name: 'Scone', price: 15.00, category: 'Pastries' },
    { name: 'Vanilla Cake Slice', price: 35.00, category: 'Cakes' },
    { name: 'Chocolate Cake Slice', price: 38.00, category: 'Cakes' },
    { name: 'Cheesecake Slice', price: 45.00, category: 'Cakes' },
    { name: 'Meat Pie', price: 22.00, category: 'Savory' },
    { name: 'Chicken Pie', price: 22.00, category: 'Savory' },
    { name: 'Sausage Roll', price: 18.00, category: 'Savory' },
  ],
  'default': [
    { name: 'Daily Special', price: 85.00, category: 'Specials' },
    { name: 'Soft Drink', price: 18.00, category: 'Beverages' },
    { name: 'Side Dish', price: 28.00, category: 'Sides' },
  ]
}

// Liquor SKUs
const liquorSKUs: Record<string, CatalogSKU[]> = {
  'liquor-store': [
    { name: 'Smirnoff Vodka 750ml', price: 189.00, category: 'Vodka' },
    { name: 'Smirnoff Vodka 1L', price: 245.00, category: 'Vodka' },
    { name: 'Absolut Vodka 750ml', price: 279.00, category: 'Vodka' },
    { name: 'J&B Whisky 750ml', price: 265.00, category: 'Whisky' },
    { name: 'J&B Whisky 1L', price: 345.00, category: 'Whisky' },
    { name: 'Johnnie Walker Red 750ml', price: 285.00, category: 'Whisky' },
    { name: 'Johnnie Walker Black 750ml', price: 425.00, category: 'Whisky' },
    { name: 'Jameson Irish 750ml', price: 275.00, category: 'Whisky' },
    { name: 'Klipdrift Brandy 750ml', price: 185.00, category: 'Brandy' },
    { name: 'Klipdrift Brandy 1L', price: 245.00, category: 'Brandy' },
    { name: 'Richelieu Brandy 750ml', price: 225.00, category: 'Brandy' },
    { name: 'Gordons Gin 750ml', price: 195.00, category: 'Gin' },
    { name: 'Tanqueray Gin 750ml', price: 285.00, category: 'Gin' },
    { name: 'Bacardi White Rum 750ml', price: 195.00, category: 'Rum' },
    { name: 'Castle Lager 6-Pack', price: 95.00, category: 'Beer' },
    { name: 'Castle Lager Case (24)', price: 320.00, category: 'Beer' },
    { name: 'Castle Lite 6-Pack', price: 105.00, category: 'Beer' },
    { name: 'Castle Lite Case (24)', price: 355.00, category: 'Beer' },
    { name: 'Black Label 6-Pack', price: 98.00, category: 'Beer' },
    { name: 'Black Label Case (24)', price: 330.00, category: 'Beer' },
    { name: 'Heineken 6-Pack', price: 135.00, category: 'Premium Beer' },
    { name: 'Stella Artois 6-Pack', price: 145.00, category: 'Premium Beer' },
    { name: 'Nederburg Baronne 750ml', price: 89.00, category: 'Red Wine' },
    { name: 'Two Oceans Cabernet 750ml', price: 75.00, category: 'Red Wine' },
    { name: 'Four Cousins Red 750ml', price: 85.00, category: 'Red Wine' },
    { name: 'Two Oceans Chenin 750ml', price: 72.00, category: 'White Wine' },
    { name: 'Nederburg Sauvignon 750ml', price: 89.00, category: 'White Wine' },
    { name: 'Savanna Dry 6-Pack', price: 98.00, category: 'Ciders' },
    { name: 'Savanna Light 6-Pack', price: 98.00, category: 'Ciders' },
    { name: "Hunter's Gold 6-Pack", price: 95.00, category: 'Ciders' },
  ],
  'bar-pub': [
    { name: 'Draft Beer (500ml)', price: 35.00, category: 'Draft' },
    { name: 'Draft Beer (1L)', price: 62.00, category: 'Draft' },
    { name: 'Pitcher (2L)', price: 115.00, category: 'Draft' },
    { name: 'Castle Lager (Quart)', price: 38.00, category: 'Beer' },
    { name: 'Castle Lite (Quart)', price: 40.00, category: 'Beer' },
    { name: 'Black Label (Quart)', price: 38.00, category: 'Beer' },
    { name: 'Heineken (330ml)', price: 32.00, category: 'Premium Beer' },
    { name: 'Stella (330ml)', price: 35.00, category: 'Premium Beer' },
    { name: 'Savanna Dry', price: 32.00, category: 'Ciders' },
    { name: 'Savanna Light', price: 32.00, category: 'Ciders' },
    { name: "Hunter's Gold", price: 30.00, category: 'Ciders' },
    { name: 'Brandy & Coke', price: 45.00, category: 'Mixers' },
    { name: 'Whisky & Coke', price: 55.00, category: 'Mixers' },
    { name: 'Vodka & Lemonade', price: 48.00, category: 'Mixers' },
    { name: 'Gin & Tonic', price: 52.00, category: 'Mixers' },
    { name: 'Jagerbomb', price: 55.00, category: 'Shots' },
    { name: 'Tequila Shot', price: 35.00, category: 'Shots' },
    { name: 'Peanuts Pack', price: 15.00, category: 'Snacks' },
    { name: 'Biltong Pack', price: 35.00, category: 'Snacks' },
  ],
  'default': [
    { name: 'Beer Quart', price: 35.00, category: 'Beer' },
    { name: 'Beer Can', price: 22.00, category: 'Beer' },
    { name: 'Brandy 750ml', price: 185.00, category: 'Spirits' },
    { name: 'Vodka 750ml', price: 195.00, category: 'Spirits' },
  ]
}

// Grocery SKUs
const grocerySKUs: Record<string, CatalogSKU[]> = {
  'superette': [
    { name: 'White Bread Loaf', price: 17.50, category: 'Bakery' },
    { name: 'Brown Bread Loaf', price: 18.90, category: 'Bakery' },
    { name: 'Fresh Milk 1L', price: 22.90, category: 'Dairy' },
    { name: 'Fresh Milk 2L', price: 42.90, category: 'Dairy' },
    { name: 'Long Life Milk 1L', price: 19.90, category: 'Dairy' },
    { name: 'Amasi 500ml', price: 18.90, category: 'Dairy' },
    { name: 'Yoghurt (Plain) 1kg', price: 35.90, category: 'Dairy' },
    { name: 'Butter 500g', price: 54.90, category: 'Dairy' },
    { name: 'Cheese (Cheddar) 1kg', price: 115.00, category: 'Dairy' },
    { name: 'Eggs (6)', price: 28.90, category: 'Dairy' },
    { name: 'Eggs (12)', price: 54.90, category: 'Dairy' },
    { name: 'Chicken (Whole)', price: 85.00, category: 'Meat' },
    { name: 'Chicken Portions (1kg)', price: 72.90, category: 'Meat' },
    { name: 'Mince Meat (1kg)', price: 89.90, category: 'Meat' },
    { name: 'Boerewors (1kg)', price: 89.90, category: 'Meat' },
    { name: 'Maize Meal 5kg', price: 59.90, category: 'Pantry' },
    { name: 'Maize Meal 10kg', price: 109.90, category: 'Pantry' },
    { name: 'Rice 2kg', price: 45.90, category: 'Pantry' },
    { name: 'Rice 5kg', price: 99.90, category: 'Pantry' },
    { name: 'Sugar 1kg', price: 32.90, category: 'Pantry' },
    { name: 'Sugar 2.5kg', price: 75.90, category: 'Pantry' },
    { name: 'Flour 1kg', price: 28.90, category: 'Pantry' },
    { name: 'Cooking Oil 750ml', price: 45.90, category: 'Pantry' },
    { name: 'Cooking Oil 2L', price: 89.90, category: 'Pantry' },
    { name: 'Coca-Cola 2L', price: 32.90, category: 'Beverages' },
    { name: 'Fanta 2L', price: 32.90, category: 'Beverages' },
    { name: 'Sprite 2L', price: 32.90, category: 'Beverages' },
    { name: 'Juice 1L', price: 28.90, category: 'Beverages' },
    { name: 'Bottled Water 500ml', price: 8.90, category: 'Beverages' },
    { name: 'Vodacom Airtime R10', price: 10.00, category: 'Airtime' },
    { name: 'Vodacom Airtime R50', price: 50.00, category: 'Airtime' },
    { name: 'MTN Airtime R10', price: 10.00, category: 'Airtime' },
  ],
  'spaza': [
    { name: 'White Bread', price: 16.00, category: 'Bread' },
    { name: 'Brown Bread', price: 17.50, category: 'Bread' },
    { name: 'Milk 1L', price: 20.00, category: 'Dairy' },
    { name: 'Milk 2L', price: 38.00, category: 'Dairy' },
    { name: 'Amasi 500ml', price: 16.00, category: 'Dairy' },
    { name: 'Eggs (6)', price: 25.00, category: 'Dairy' },
    { name: 'Maize Meal 1kg', price: 18.00, category: 'Pantry' },
    { name: 'Maize Meal 5kg', price: 55.00, category: 'Pantry' },
    { name: 'Rice 1kg', price: 22.00, category: 'Pantry' },
    { name: 'Sugar 1kg', price: 30.00, category: 'Pantry' },
    { name: 'Flour 1kg', price: 25.00, category: 'Pantry' },
    { name: 'Cooking Oil 750ml', price: 42.00, category: 'Pantry' },
    { name: 'Chips (Small)', price: 6.50, category: 'Snacks' },
    { name: 'Chips (Large)', price: 12.00, category: 'Snacks' },
    { name: 'Biscuits', price: 8.50, category: 'Snacks' },
    { name: 'Sweets (Small)', price: 3.50, category: 'Snacks' },
    { name: 'Cool Drink 500ml', price: 14.00, category: 'Beverages' },
    { name: 'Cool Drink 2L', price: 28.00, category: 'Beverages' },
    { name: 'Juice 1L', price: 22.00, category: 'Beverages' },
    { name: 'Water 500ml', price: 7.00, category: 'Beverages' },
    { name: 'Ice Cream', price: 18.00, category: 'Frozen' },
    { name: 'Vodacom Airtime', price: 10.00, category: 'Airtime' },
    { name: 'MTN Airtime', price: 10.00, category: 'Airtime' },
  ],
  'default': [
    { name: 'Bread', price: 18.00, category: 'Bakery' },
    { name: 'Milk 1L', price: 22.00, category: 'Dairy' },
    { name: 'Sugar 1kg', price: 32.00, category: 'Pantry' },
    { name: 'Rice 1kg', price: 25.00, category: 'Pantry' },
    { name: 'Cooking Oil', price: 45.00, category: 'Pantry' },
  ]
}

// Health & Beauty SKUs
const healthBeautySKUs: Record<string, CatalogSKU[]> = {
  'hair-salon': [
    { name: 'Haircut - Mens', price: 80.00, category: 'Cuts' },
    { name: 'Haircut - Ladies', price: 120.00, category: 'Cuts' },
    { name: 'Haircut - Kids', price: 50.00, category: 'Cuts' },
    { name: 'Wash & Blow Dry', price: 100.00, category: 'Styling' },
    { name: 'Blow Dry Only', price: 70.00, category: 'Styling' },
    { name: 'Updo / Styling', price: 200.00, category: 'Styling' },
    { name: 'Full Head Colour', price: 350.00, category: 'Colour' },
    { name: 'Root Touch Up', price: 180.00, category: 'Colour' },
    { name: 'Highlights (Full)', price: 450.00, category: 'Colour' },
    { name: 'Highlights (Partial)', price: 280.00, category: 'Colour' },
    { name: 'Balayage', price: 550.00, category: 'Colour' },
    { name: 'Relaxer Treatment', price: 300.00, category: 'Treatments' },
    { name: 'Keratin Treatment', price: 600.00, category: 'Treatments' },
    { name: 'Deep Conditioning', price: 80.00, category: 'Treatments' },
    { name: 'Braids - Full Head', price: 400.00, category: 'Braiding' },
    { name: 'Braids - Cornrows', price: 150.00, category: 'Braiding' },
    { name: 'Weave Installation', price: 250.00, category: 'Extensions' },
  ],
  'barber': [
    { name: 'Haircut', price: 60.00, category: 'Cuts' },
    { name: 'Haircut & Beard', price: 90.00, category: 'Cuts' },
    { name: 'Kids Haircut', price: 40.00, category: 'Cuts' },
    { name: 'Beard Trim', price: 30.00, category: 'Beard' },
    { name: 'Beard Shape Up', price: 40.00, category: 'Beard' },
    { name: 'Hot Towel Shave', price: 80.00, category: 'Shave' },
    { name: 'Clean Shave', price: 50.00, category: 'Shave' },
    { name: 'Hair Design', price: 100.00, category: 'Design' },
    { name: 'Line Up', price: 30.00, category: 'Design' },
  ],
  'nail-salon': [
    { name: 'Manicure Basic', price: 120.00, category: 'Manicure' },
    { name: 'Manicure Deluxe', price: 180.00, category: 'Manicure' },
    { name: 'Pedicure Basic', price: 150.00, category: 'Pedicure' },
    { name: 'Pedicure Deluxe', price: 220.00, category: 'Pedicure' },
    { name: 'Gel Manicure', price: 200.00, category: 'Gel' },
    { name: 'Gel Pedicure', price: 250.00, category: 'Gel' },
    { name: 'Acrylic Full Set', price: 350.00, category: 'Acrylic' },
    { name: 'Acrylic Fill', price: 200.00, category: 'Acrylic' },
    { name: 'Nail Art (per nail)', price: 15.00, category: 'Design' },
  ],
  'spa-wellness': [
    { name: 'Full Body Massage (60min)', price: 450.00, category: 'Massage' },
    { name: 'Full Body Massage (90min)', price: 650.00, category: 'Massage' },
    { name: 'Back Massage (30min)', price: 250.00, category: 'Massage' },
    { name: 'Hot Stone Massage', price: 550.00, category: 'Massage' },
    { name: 'Facial Basic', price: 350.00, category: 'Facial' },
    { name: 'Facial Deluxe', price: 500.00, category: 'Facial' },
    { name: 'Body Scrub', price: 300.00, category: 'Body' },
    { name: 'Body Wrap', price: 400.00, category: 'Body' },
    { name: 'Spa Package (Half Day)', price: 1200.00, category: 'Packages' },
  ],
  'default': [
    { name: 'Standard Service', price: 100.00, category: 'Services' },
    { name: 'Deluxe Service', price: 180.00, category: 'Services' },
    { name: 'Premium Service', price: 280.00, category: 'Services' },
  ]
}

/**
 * Get SKUs for a specific vertical/sub-vertical
 */
export function getSKUsForSubVertical(vertical: string, subVertical: string): CatalogSKU[] {
  const skuMaps: Record<string, Record<string, CatalogSKU[]>> = {
    'fnb': fnbSKUs,
    'liquor': liquorSKUs,
    'grocery': grocerySKUs,
    'health-beauty': healthBeautySKUs,
  }
  
  const map = skuMaps[vertical] || {}
  return map[subVertical] || map['default'] || []
}

/**
 * Seed products for a merchant during onboarding
 * This is called from the registration route
 */
export async function seedProductsForMerchant(
  tx: any,
  merchantId: string,
  vertical: string,
  subVertical?: string
): Promise<{ created: number; categories: string[] }> {
  // Get SKUs for this vertical
  const skus = subVertical 
    ? getSKUsForSubVertical(vertical, subVertical)
    : getSKUsForSubVertical(vertical, 'default')
  
  if (skus.length === 0) {
    return { created: 0, categories: [] }
  }

  // Get or create categories
  const categoryMap: Record<string, string> = {}
  const uniqueCategories = [...new Set(skus.map(s => s.category))]
  
  for (const categoryName of uniqueCategories) {
    // Check if category already exists
    let category = await tx.productCategory.findFirst({
      where: { merchantId, name: categoryName }
    })
    
    if (!category) {
      category = await tx.productCategory.create({
        data: {
          id: randomUUID(),
          merchantId,
          name: categoryName,
          description: `${categoryName} products`
        }
      })
    }
    
    categoryMap[categoryName] = category.id
  }

  // Seed products
  let created = 0

  for (const sku of skus) {
    // Check if product already exists
    const existing = await tx.product.findFirst({
      where: { merchantId, name: sku.name }
    })

    if (!existing) {
      // Generate SKU code
      const skuCode = `${vertical.substring(0, 3).toUpperCase()}-${sku.name.substring(0, 15).toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      
      // Calculate cost and margin (assuming 30% cost of goods)
      const costPrice = sku.price * 0.7
      const margin = ((sku.price - costPrice) / sku.price) * 100
      
      await tx.product.create({
        data: {
          id: randomUUID(),
          merchantId,
          sku: skuCode,
          name: sku.name,
          categoryId: categoryMap[sku.category],
          costPrice,
          sellingPrice: sku.price,
          margin,
          vatRate: 15.0,
          trackInventory: true,
          currentStock: 100, // Default stock
          lowStockThreshold: 10,
          isActive: true,
          isAvailableOnline: true
        }
      })
      created++
    }
  }

  return { 
    created, 
    categories: uniqueCategories 
  }
}
