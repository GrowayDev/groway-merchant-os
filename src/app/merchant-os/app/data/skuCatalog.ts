import { 
  Utensils, Wine, Beer, Droplets, Cookie, Apple, Sandwich, Soup, Pizza, IceCream,
  Coffee, Package, Zap, Scissors, Sparkles, Heart, Shirt, Pill, Hotel, Wrench,
  Smartphone, Dumbbell, Baby, Building2, Car, Home, Brush, Gift, Ticket, Music,
  Bed, Bath, Hammer, Paintbrush, Lightbulb, Wrench as WrenchIcon, Monitor, Headphones,
  Gamepad2, Dumbbell as Gym, Timer, Users, Book, GraduationCap, 
  Scale, Briefcase, Calculator, FileText, CreditCard, Wallet, Receipt, ShoppingBag, 
  Eye, Camera, Clock, Shield
} from 'lucide-react'

export interface SKU {
  name: string
  price: number
  category: string
  icon: any
}

// Food & Beverage SKUs
export const fnbSKUs: Record<string, SKU[]> = {
  'qsr': [
    // Combos
    { name: 'Burger Combo (Burger + Fries + Drink)', price: 89.90, category: 'Combos', icon: Utensils },
    { name: 'Chicken Combo (2pc + Fries + Drink)', price: 79.90, category: 'Combos', icon: Utensils },
    { name: 'Veggie Combo (Veg Burger + Fries + Drink)', price: 84.90, category: 'Combos', icon: Utensils },
    { name: 'Family Meal (4 Burgers + 2 Fries + 4 Drinks)', price: 249.90, category: 'Combos', icon: Utensils },
    // Burgers
    { name: 'Beef Burger Classic', price: 54.90, category: 'Burgers', icon: Sandwich },
    { name: 'Beef Burger Deluxe (Cheese + Bacon)', price: 69.90, category: 'Burgers', icon: Sandwich },
    { name: 'Chicken Burger', price: 49.90, category: 'Burgers', icon: Sandwich },
    { name: 'Veggie Burger', price: 49.90, category: 'Burgers', icon: Sandwich },
    { name: 'Double Beef Burger', price: 79.90, category: 'Burgers', icon: Sandwich },
    // Chicken
    { name: 'Chicken Wings (6pc)', price: 59.90, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Wings (12pc)', price: 99.90, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Strips (6pc)', price: 54.90, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Nuggets (10pc)', price: 49.90, category: 'Chicken', icon: Utensils },
    // Sides
    { name: 'Fries Regular', price: 24.90, category: 'Sides', icon: Cookie },
    { name: 'Fries Large', price: 34.90, category: 'Sides', icon: Cookie },
    { name: 'Onion Rings', price: 29.90, category: 'Sides', icon: Cookie },
    { name: 'Coleslaw', price: 19.90, category: 'Sides', icon: Apple },
    { name: 'Mozzarella Sticks (4pc)', price: 39.90, category: 'Sides', icon: Cookie },
    // Beverages
    { name: 'Coca-Cola 500ml', price: 18.90, category: 'Beverages', icon: Droplets },
    { name: 'Fanta 500ml', price: 18.90, category: 'Beverages', icon: Droplets },
    { name: 'Sprite 500ml', price: 18.90, category: 'Beverages', icon: Droplets },
    { name: 'Stoney 500ml', price: 18.90, category: 'Beverages', icon: Droplets },
    { name: 'Minute Maid 500ml', price: 22.90, category: 'Beverages', icon: Droplets },
    { name: 'Milkshake Chocolate', price: 34.90, category: 'Beverages', icon: Coffee },
    { name: 'Milkshake Strawberry', price: 34.90, category: 'Beverages', icon: Coffee },
    { name: 'Milkshake Vanilla', price: 34.90, category: 'Beverages', icon: Coffee },
    // Desserts
    { name: 'Ice Cream Cone', price: 15.90, category: 'Desserts', icon: IceCream },
    { name: 'Sundae Chocolate', price: 24.90, category: 'Desserts', icon: IceCream },
    { name: 'Apple Pie', price: 29.90, category: 'Desserts', icon: Cookie },
  ],
  'sitdown': [
    // Starters
    { name: 'Garlic Bread (4 slices)', price: 35.00, category: 'Starters', icon: Cookie },
    { name: 'Calamari Rings', price: 75.00, category: 'Starters', icon: Utensils },
    { name: 'Chicken Livers Peri-Peri', price: 68.00, category: 'Starters', icon: Utensils },
    { name: 'Spring Rolls (4pc)', price: 55.00, category: 'Starters', icon: Utensils },
    { name: 'Soup of the Day', price: 45.00, category: 'Starters', icon: Soup },
    { name: 'Bruschetta', price: 48.00, category: 'Starters', icon: Cookie },
    // Salads
    { name: 'Caesar Salad', price: 75.00, category: 'Salads', icon: Apple },
    { name: 'Greek Salad', price: 72.00, category: 'Salads', icon: Apple },
    { name: 'Garden Salad', price: 55.00, category: 'Salads', icon: Apple },
    { name: 'Chicken Salad', price: 85.00, category: 'Salads', icon: Apple },
    // Mains - Grills
    { name: 'Sirloin Steak (300g)', price: 185.00, category: 'Grills', icon: Utensils },
    { name: 'Rump Steak (300g)', price: 165.00, category: 'Grills', icon: Utensils },
    { name: 'Lamb Chops (4pc)', price: 175.00, category: 'Grills', icon: Utensils },
    { name: 'Grilled Chicken', price: 125.00, category: 'Grills', icon: Utensils },
    { name: 'Peri-Peri Chicken (Quarter)', price: 85.00, category: 'Grills', icon: Utensils },
    { name: 'Peri-Peri Chicken (Half)', price: 145.00, category: 'Grills', icon: Utensils },
    { name: 'Baby Chicken (Half)', price: 135.00, category: 'Grills', icon: Utensils },
    // Mains - Seafood
    { name: 'Hake & Chips', price: 95.00, category: 'Seafood', icon: Utensils },
    { name: 'Grilled Salmon', price: 175.00, category: 'Seafood', icon: Utensils },
    { name: 'Prawns (6pc)', price: 165.00, category: 'Seafood', icon: Utensils },
    { name: 'Seafood Platter', price: 245.00, category: 'Seafood', icon: Utensils },
    // Mains - Traditional
    { name: 'Oxtail Stew', price: 155.00, category: 'Traditional', icon: Soup },
    { name: 'Bobotie with Rice', price: 95.00, category: 'Traditional', icon: Utensils },
    { name: 'Potjie Kos', price: 125.00, category: 'Traditional', icon: Soup },
    // Sides
    { name: 'Pap', price: 28.00, category: 'Sides', icon: Soup },
    { name: 'Chakalaka', price: 32.00, category: 'Sides', icon: Soup },
    { name: 'Creamed Spinach', price: 32.00, category: 'Sides', icon: Soup },
    { name: 'Rice', price: 28.00, category: 'Sides', icon: Soup },
    { name: 'Vegetables', price: 35.00, category: 'Sides', icon: Apple },
    { name: 'Chips', price: 35.00, category: 'Sides', icon: Cookie },
    // Beverages
    { name: 'Soft Drink 340ml', price: 22.00, category: 'Beverages', icon: Droplets },
    { name: 'Juice Glass', price: 28.00, category: 'Beverages', icon: Droplets },
    { name: 'Mineral Water', price: 25.00, category: 'Beverages', icon: Droplets },
    // Desserts
    { name: 'Malva Pudding', price: 55.00, category: 'Desserts', icon: IceCream },
    { name: 'Cheesecake Slice', price: 58.00, category: 'Desserts', icon: Cookie },
    { name: 'Ice Cream (2 scoops)', price: 35.00, category: 'Desserts', icon: IceCream },
    { name: 'Chocolate Mousse', price: 48.00, category: 'Desserts', icon: IceCream },
  ],
  'shisa-nyama': [
    // Meat by Weight
    { name: 'Beef Steak (per 100g)', price: 35.00, category: 'Meat (Weight)', icon: Utensils },
    { name: 'Boerewors (per 100g)', price: 22.00, category: 'Meat (Weight)', icon: Utensils },
    { name: 'Lamb Chops (per 100g)', price: 45.00, category: 'Meat (Weight)', icon: Utensils },
    { name: 'Chicken (per 100g)', price: 18.00, category: 'Meat (Weight)', icon: Utensils },
    { name: 'Pork Ribs (per 100g)', price: 32.00, category: 'Meat (Weight)', icon: Utensils },
    // Meat Plates
    { name: 'Beef Braai Plate (500g)', price: 145.00, category: 'Meat Plates', icon: Utensils },
    { name: 'Boerewors Plate (500g)', price: 95.00, category: 'Meat Plates', icon: Utensils },
    { name: 'Mixed Grill (600g)', price: 185.00, category: 'Meat Plates', icon: Utensils },
    { name: 'Chicken Braai', price: 85.00, category: 'Meat Plates', icon: Utensils },
    { name: 'Lamb Chops Plate (400g)', price: 165.00, category: 'Meat Plates', icon: Utensils },
    // Combos
    { name: 'Pap & Vleis (300g meat)', price: 75.00, category: 'Combos', icon: Utensils },
    { name: 'Pap & Wors', price: 55.00, category: 'Combos', icon: Utensils },
    { name: 'Shisa Nyama Special (500g + 2 sides)', price: 125.00, category: 'Combos', icon: Utensils },
    { name: 'Family Pack (1kg mixed + 4 sides)', price: 320.00, category: 'Combos', icon: Utensils },
    // Sides
    { name: 'Pap (Small)', price: 18.00, category: 'Sides', icon: Soup },
    { name: 'Pap (Large)', price: 28.00, category: 'Sides', icon: Soup },
    { name: 'Chakalaka', price: 18.00, category: 'Sides', icon: Soup },
    { name: 'Spinach', price: 18.00, category: 'Sides', icon: Soup },
    { name: 'Samp & Beans', price: 22.00, category: 'Sides', icon: Soup },
    { name: 'Cabbage', price: 15.00, category: 'Sides', icon: Soup },
    { name: 'Potato Salad', price: 22.00, category: 'Sides', icon: Soup },
    { name: 'Braai Broodjie', price: 25.00, category: 'Sides', icon: Cookie },
    // Beverages
    { name: 'Beer (Quart)', price: 35.00, category: 'Beverages', icon: Beer },
    { name: 'Beer (Can)', price: 22.00, category: 'Beverages', icon: Beer },
    { name: 'Castle Lite (Quart)', price: 38.00, category: 'Beverages', icon: Beer },
    { name: 'Black Label (Quart)', price: 36.00, category: 'Beverages', icon: Beer },
    { name: 'Cold Drink (500ml)', price: 15.00, category: 'Beverages', icon: Droplets },
    { name: 'Mageu 500ml', price: 12.00, category: 'Beverages', icon: Droplets },
    { name: 'Amasi 500ml', price: 15.00, category: 'Beverages', icon: Droplets },
  ],
  'coffee-shop': [
    // Hot Coffee
    { name: 'Espresso', price: 22.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Espresso Double', price: 32.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Americano', price: 28.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Cappuccino', price: 32.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Latte', price: 34.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Mocha', price: 38.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Flat White', price: 32.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Macchiato', price: 26.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Hot Chocolate', price: 35.00, category: 'Hot Coffee', icon: Coffee },
    { name: 'Chai Latte', price: 36.00, category: 'Hot Coffee', icon: Coffee },
    // Cold Coffee
    { name: 'Iced Americano', price: 32.00, category: 'Cold Coffee', icon: Coffee },
    { name: 'Iced Latte', price: 38.00, category: 'Cold Coffee', icon: Coffee },
    { name: 'Iced Mocha', price: 42.00, category: 'Cold Coffee', icon: Coffee },
    { name: 'Frappe', price: 45.00, category: 'Cold Coffee', icon: Coffee },
    { name: 'Cold Brew', price: 35.00, category: 'Cold Coffee', icon: Coffee },
    // Tea
    { name: 'English Breakfast Tea', price: 22.00, category: 'Tea', icon: Coffee },
    { name: 'Rooibos Tea', price: 22.00, category: 'Tea', icon: Coffee },
    { name: 'Green Tea', price: 24.00, category: 'Tea', icon: Coffee },
    { name: 'Chamomile Tea', price: 24.00, category: 'Tea', icon: Coffee },
    { name: 'Earl Grey', price: 24.00, category: 'Tea', icon: Coffee },
    // Pastries
    { name: 'Croissant', price: 28.00, category: 'Pastries', icon: Cookie },
    { name: 'Croissant (Cheese & Ham)', price: 38.00, category: 'Pastries', icon: Cookie },
    { name: 'Chocolate Croissant', price: 32.00, category: 'Pastries', icon: Cookie },
    { name: 'Muffin (Blueberry)', price: 28.00, category: 'Pastries', icon: Cookie },
    { name: 'Muffin (Chocolate)', price: 28.00, category: 'Pastries', icon: Cookie },
    { name: 'Danish Pastry', price: 32.00, category: 'Pastries', icon: Cookie },
    { name: 'Cinnamon Roll', price: 35.00, category: 'Pastries', icon: Cookie },
    // Food
    { name: 'Bagel (Cream Cheese)', price: 35.00, category: 'Food', icon: Sandwich },
    { name: 'Bagel (Salmon & Cream Cheese)', price: 58.00, category: 'Food', icon: Sandwich },
    { name: 'Toast (2 slices)', price: 22.00, category: 'Food', icon: Cookie },
    { name: 'Breakfast Wrap', price: 55.00, category: 'Food', icon: Sandwich },
    { name: 'Chicken Mayo Sandwich', price: 52.00, category: 'Food', icon: Sandwich },
    { name: 'Club Sandwich', price: 65.00, category: 'Food', icon: Sandwich },
    { name: 'Quiche Slice', price: 48.00, category: 'Food', icon: Pizza },
    { name: 'Salad Bowl', price: 68.00, category: 'Food', icon: Apple },
  ],
  'bakery': [
    // Bread
    { name: 'White Bread Loaf', price: 18.00, category: 'Bread', icon: Cookie },
    { name: 'Brown Bread Loaf', price: 20.00, category: 'Bread', icon: Cookie },
    { name: 'Whole Wheat Loaf', price: 24.00, category: 'Bread', icon: Cookie },
    { name: 'Sourdough Loaf', price: 38.00, category: 'Bread', icon: Cookie },
    { name: 'French Baguette', price: 28.00, category: 'Bread', icon: Cookie },
    { name: 'Ciabatta', price: 26.00, category: 'Bread', icon: Cookie },
    { name: 'Brioche Loaf', price: 35.00, category: 'Bread', icon: Cookie },
    { name: 'Rye Bread', price: 32.00, category: 'Bread', icon: Cookie },
    // Rolls
    { name: 'Hot Dog Rolls (6pc)', price: 22.00, category: 'Rolls', icon: Cookie },
    { name: 'Burger Buns (6pc)', price: 24.00, category: 'Rolls', icon: Cookie },
    { name: 'Dinner Rolls (6pc)', price: 22.00, category: 'Rolls', icon: Cookie },
    { name: 'Portuguese Roll', price: 8.50, category: 'Rolls', icon: Cookie },
    { name: 'Kota Loaf', price: 15.00, category: 'Rolls', icon: Cookie },
    // Pastries
    { name: 'Croissant', price: 22.00, category: 'Pastries', icon: Cookie },
    { name: 'Chocolate Croissant', price: 26.00, category: 'Pastries', icon: Cookie },
    { name: 'Danish Pastry', price: 24.00, category: 'Pastries', icon: Cookie },
    { name: 'Vetkoek', price: 12.00, category: 'Pastries', icon: Cookie },
    { name: 'Vetkoek with Mince', price: 25.00, category: 'Pastries', icon: Sandwich },
    { name: 'Scone', price: 15.00, category: 'Pastries', icon: Cookie },
    { name: 'Cinnamon Roll', price: 28.00, category: 'Pastries', icon: Cookie },
    // Cakes (per slice)
    { name: 'Vanilla Cake Slice', price: 35.00, category: 'Cakes', icon: Cookie },
    { name: 'Chocolate Cake Slice', price: 38.00, category: 'Cakes', icon: Cookie },
    { name: 'Carrot Cake Slice', price: 38.00, category: 'Cakes', icon: Cookie },
    { name: 'Red Velvet Slice', price: 42.00, category: 'Cakes', icon: Cookie },
    { name: 'Cheesecake Slice', price: 45.00, category: 'Cakes', icon: Cookie },
    // Cakes (whole)
    { name: 'Vanilla Cake (Whole)', price: 185.00, category: 'Whole Cakes', icon: Cookie },
    { name: 'Chocolate Cake (Whole)', price: 195.00, category: 'Whole Cakes', icon: Cookie },
    { name: 'Carrot Cake (Whole)', price: 195.00, category: 'Whole Cakes', icon: Cookie },
    { name: 'Birthday Cake (Decorated)', price: 280.00, category: 'Whole Cakes', icon: Cookie },
    // Savory
    { name: 'Meat Pie', price: 22.00, category: 'Savory', icon: Pizza },
    { name: 'Chicken Pie', price: 22.00, category: 'Savory', icon: Pizza },
    { name: 'Sausage Roll', price: 18.00, category: 'Savory', icon: Sandwich },
    { name: 'Samoosa (Meat)', price: 12.00, category: 'Savory', icon: Sandwich },
    { name: 'Samoosa (Vegetable)', price: 10.00, category: 'Savory', icon: Sandwich },
    { name: 'Gatsby (Small)', price: 65.00, category: 'Savory', icon: Sandwich },
  ],
  'food-truck': [
    // Main Items
    { name: 'Gatsby (Full)', price: 95.00, category: 'Main', icon: Sandwich },
    { name: 'Gatsby (Half)', price: 55.00, category: 'Main', icon: Sandwich },
    { name: 'Gatsby (Quarter)', price: 35.00, category: 'Main', icon: Sandwich },
    { name: 'Bunny Chow (Quarter)', price: 48.00, category: 'Main', icon: Soup },
    { name: 'Bunny Chow (Half)', price: 75.00, category: 'Main', icon: Soup },
    { name: 'Bunny Chow (Full)', price: 125.00, category: 'Main', icon: Soup },
    { name: 'Kota (Basic)', price: 35.00, category: 'Main', icon: Sandwich },
    { name: 'Kota (Deluxe)', price: 55.00, category: 'Main', icon: Sandwich },
    { name: 'Kota (Full House)', price: 72.00, category: 'Main', icon: Sandwich },
    // Wraps & Rolls
    { name: 'Chicken Wrap', price: 55.00, category: 'Wraps', icon: Sandwich },
    { name: 'Beef Wrap', price: 58.00, category: 'Wraps', icon: Sandwich },
    { name: 'Veggie Wrap', price: 48.00, category: 'Wraps', icon: Sandwich },
    { name: 'Shawarma Roll', price: 52.00, category: 'Wraps', icon: Sandwich },
    // Sides
    { name: 'Fries Regular', price: 25.00, category: 'Sides', icon: Cookie },
    { name: 'Fries Large', price: 35.00, category: 'Sides', icon: Cookie },
    { name: 'Onion Rings', price: 28.00, category: 'Sides', icon: Cookie },
    { name: 'Chili Bites', price: 32.00, category: 'Sides', icon: Cookie },
    // Drinks
    { name: 'Cold Drink (500ml)', price: 15.00, category: 'Drinks', icon: Droplets },
    { name: 'Juice Box', price: 12.00, category: 'Drinks', icon: Droplets },
    { name: 'Bottled Water', price: 12.00, category: 'Drinks', icon: Droplets },
  ],
  'cloud-kitchen': [
    // Burgers
    { name: 'Classic Beef Burger', price: 65.00, category: 'Burgers', icon: Sandwich },
    { name: 'Double Beef Burger', price: 95.00, category: 'Burgers', icon: Sandwich },
    { name: 'Cheese Burger', price: 75.00, category: 'Burgers', icon: Sandwich },
    { name: 'Bacon Burger', price: 85.00, category: 'Burgers', icon: Sandwich },
    { name: 'Chicken Burger', price: 62.00, category: 'Burgers', icon: Sandwich },
    { name: 'Veggie Burger', price: 62.00, category: 'Burgers', icon: Sandwich },
    // Pizza
    { name: 'Margherita Pizza (Medium)', price: 85.00, category: 'Pizza', icon: Pizza },
    { name: 'Margherita Pizza (Large)', price: 115.00, category: 'Pizza', icon: Pizza },
    { name: 'Pepperoni Pizza (Medium)', price: 95.00, category: 'Pizza', icon: Pizza },
    { name: 'Pepperoni Pizza (Large)', price: 125.00, category: 'Pizza', icon: Pizza },
    { name: 'Hawaiian Pizza (Medium)', price: 95.00, category: 'Pizza', icon: Pizza },
    { name: 'Meat Lovers Pizza (Large)', price: 145.00, category: 'Pizza', icon: Pizza },
    // Bowls
    { name: 'Chicken Rice Bowl', price: 75.00, category: 'Bowls', icon: Soup },
    { name: 'Beef Rice Bowl', price: 85.00, category: 'Bowls', icon: Soup },
    { name: 'Veggie Rice Bowl', price: 65.00, category: 'Bowls', icon: Soup },
    { name: 'Noodle Bowl', price: 72.00, category: 'Bowls', icon: Soup },
    // Wraps
    { name: 'Chicken Shawarma Wrap', price: 58.00, category: 'Wraps', icon: Sandwich },
    { name: 'Beef Shawarma Wrap', price: 62.00, category: 'Wraps', icon: Sandwich },
    // Sides
    { name: 'Fries', price: 28.00, category: 'Sides', icon: Cookie },
    { name: 'Garlic Bread', price: 32.00, category: 'Sides', icon: Cookie },
    { name: 'Coleslaw', price: 22.00, category: 'Sides', icon: Apple },
    // Drinks
    { name: 'Soft Drink 500ml', price: 18.00, category: 'Drinks', icon: Droplets },
    { name: 'Juice 500ml', price: 25.00, category: 'Drinks', icon: Droplets },
  ],
  'catering': [
    // Platters
    { name: 'Finger Snack Platter (10 pax)', price: 450.00, category: 'Platters', icon: Utensils },
    { name: 'Finger Snack Platter (20 pax)', price: 850.00, category: 'Platters', icon: Utensils },
    { name: 'Meat Platter (10 pax)', price: 650.00, category: 'Platters', icon: Utensils },
    { name: 'Meat Platter (20 pax)', price: 1250.00, category: 'Platters', icon: Utensils },
    { name: 'Vegetarian Platter (10 pax)', price: 380.00, category: 'Platters', icon: Apple },
    { name: 'Dessert Platter (10 pax)', price: 350.00, category: 'Platters', icon: IceCream },
    // Full Meals (per person)
    { name: 'Business Lunch (per person)', price: 125.00, category: 'Full Meals', icon: Utensils },
    { name: 'Buffet Menu (per person)', price: 185.00, category: 'Full Meals', icon: Utensils },
    { name: 'Wedding Menu (per person)', price: 285.00, category: 'Full Meals', icon: Utensils },
    { name: 'Braai Package (per person)', price: 165.00, category: 'Full Meals', icon: Utensils },
    // Braai Catering
    { name: 'Braai Pack (10 pax)', price: 1450.00, category: 'Braai', icon: Utensils },
    { name: 'Braai Pack (20 pax)', price: 2800.00, category: 'Braai', icon: Utensils },
    { name: 'Braai Pack (50 pax)', price: 6500.00, category: 'Braai', icon: Utensils },
    // Drinks (per person)
    { name: 'Soft Drinks Package (per person)', price: 35.00, category: 'Drinks', icon: Droplets },
    { name: 'Juice Package (per person)', price: 45.00, category: 'Drinks', icon: Droplets },
    { name: 'Full Bar Package (per person)', price: 125.00, category: 'Drinks', icon: Wine },
    // Equipment Hire
    { name: 'Tables & Chairs Hire (10 pax)', price: 350.00, category: 'Equipment', icon: Package },
    { name: 'Crockery & Cutlery (10 pax)', price: 180.00, category: 'Equipment', icon: Package },
    { name: 'Gas Braai Hire', price: 450.00, category: 'Equipment', icon: Utensils },
    { name: 'Server Staff (per hour)', price: 120.00, category: 'Equipment', icon: Users },
  ],
  'default': [
    { name: 'Daily Special', price: 85.00, category: 'Specials', icon: Utensils },
    { name: 'Soft Drink', price: 18.00, category: 'Beverages', icon: Droplets },
    { name: 'Side Dish', price: 28.00, category: 'Sides', icon: Cookie },
  ]
}

// Liquor & Nightlife SKUs
export const liquorSKUs: Record<string, SKU[]> = {
  'liquor-store': [
    // Spirits
    { name: 'Smirnoff Vodka 750ml', price: 189.00, category: 'Vodka', icon: Wine },
    { name: 'Smirnoff Vodka 1L', price: 245.00, category: 'Vodka', icon: Wine },
    { name: 'Absolut Vodka 750ml', price: 279.00, category: 'Vodka', icon: Wine },
    { name: 'Sky Vodka 750ml', price: 165.00, category: 'Vodka', icon: Wine },
    { name: 'J&B Whisky 750ml', price: 265.00, category: 'Whisky', icon: Wine },
    { name: 'J&B Whisky 1L', price: 345.00, category: 'Whisky', icon: Wine },
    { name: 'Johnnie Walker Red 750ml', price: 285.00, category: 'Whisky', icon: Wine },
    { name: 'Johnnie Walker Black 750ml', price: 425.00, category: 'Whisky', icon: Wine },
    { name: 'Jameson Irish 750ml', price: 275.00, category: 'Whisky', icon: Wine },
    { name: 'Bains Cape Mountain 750ml', price: 245.00, category: 'Whisky', icon: Wine },
    { name: 'Klipdrift Brandy 750ml', price: 185.00, category: 'Brandy', icon: Wine },
    { name: 'Klipdrift Brandy 1L', price: 245.00, category: 'Brandy', icon: Wine },
    { name: 'Richelieu Brandy 750ml', price: 225.00, category: 'Brandy', icon: Wine },
    { name: 'Oude Meester 750ml', price: 195.00, category: 'Brandy', icon: Wine },
    { name: 'Gordons Gin 750ml', price: 195.00, category: 'Gin', icon: Wine },
    { name: 'Tanqueray Gin 750ml', price: 285.00, category: 'Gin', icon: Wine },
    { name: 'Local Gin 750ml', price: 165.00, category: 'Gin', icon: Wine },
    { name: 'Bacardi White Rum 750ml', price: 195.00, category: 'Rum', icon: Wine },
    { name: 'Bacardi Dark Rum 750ml', price: 215.00, category: 'Rum', icon: Wine },
    // Beer
    { name: 'Castle Lager 6-Pack', price: 95.00, category: 'Beer', icon: Beer },
    { name: 'Castle Lager Case (24)', price: 320.00, category: 'Beer', icon: Beer },
    { name: 'Castle Lite 6-Pack', price: 105.00, category: 'Beer', icon: Beer },
    { name: 'Castle Lite Case (24)', price: 355.00, category: 'Beer', icon: Beer },
    { name: 'Black Label 6-Pack', price: 98.00, category: 'Beer', icon: Beer },
    { name: 'Black Label Case (24)', price: 330.00, category: 'Beer', icon: Beer },
    { name: 'Hansa Pilsener 6-Pack', price: 95.00, category: 'Beer', icon: Beer },
    { name: 'Carling Black Label Quart', price: 38.00, category: 'Beer', icon: Beer },
    { name: 'Castle Quart', price: 35.00, category: 'Beer', icon: Beer },
    { name: 'Castle Lite Quart', price: 38.00, category: 'Beer', icon: Beer },
    { name: 'Amstel Quart', price: 42.00, category: 'Beer', icon: Beer },
    { name: 'Heineken 6-Pack', price: 135.00, category: 'Premium Beer', icon: Beer },
    { name: 'Stella Artois 6-Pack', price: 145.00, category: 'Premium Beer', icon: Beer },
    // Wine
    { name: 'Nederburg Baronne 750ml', price: 89.00, category: 'Red Wine', icon: Wine },
    { name: 'Two Oceans Cabernet 750ml', price: 75.00, category: 'Red Wine', icon: Wine },
    { name: 'Drostdy-Hof Merlot 750ml', price: 85.00, category: 'Red Wine', icon: Wine },
    { name: 'KWV Rooi 750ml', price: 65.00, category: 'Red Wine', icon: Wine },
    { name: 'Four Cousins Red 750ml', price: 85.00, category: 'Red Wine', icon: Wine },
    { name: 'Namaqua Red 750ml', price: 55.00, category: 'Red Wine', icon: Wine },
    { name: 'Two Oceans Chenin 750ml', price: 72.00, category: 'White Wine', icon: Wine },
    { name: 'Nederburg Sauvignon 750ml', price: 89.00, category: 'White Wine', icon: Wine },
    { name: 'KWV Chenin Blanc 750ml', price: 62.00, category: 'White Wine', icon: Wine },
    { name: 'Four Cousins White 750ml', price: 85.00, category: 'White Wine', icon: Wine },
    // Ciders
    { name: 'Savanna Dry 6-Pack', price: 98.00, category: 'Ciders', icon: Beer },
    { name: 'Savanna Light 6-Pack', price: 98.00, category: 'Ciders', icon: Beer },
    { name: 'Hunter\'s Gold 6-Pack', price: 95.00, category: 'Ciders', icon: Beer },
    { name: 'Hunter\'s Dry 6-Pack', price: 95.00, category: 'Ciders', icon: Beer },
    { name: 'Redd\'s 6-Pack', price: 92.00, category: 'Ciders', icon: Beer },
    { name: 'Bernini 6-Pack', price: 88.00, category: 'Ciders', icon: Beer },
  ],
  'bar-pub': [
    // Beers on Tap
    { name: 'Draft Beer (500ml)', price: 35.00, category: 'Draft', icon: Beer },
    { name: 'Draft Beer (1L)', price: 62.00, category: 'Draft', icon: Beer },
    { name: 'Pitcher (2L)', price: 115.00, category: 'Draft', icon: Beer },
    { name: 'Tower (3L)', price: 165.00, category: 'Draft', icon: Beer },
    // Bottled Beer
    { name: 'Castle Lager (Quart)', price: 38.00, category: 'Beer', icon: Beer },
    { name: 'Castle Lite (Quart)', price: 40.00, category: 'Beer', icon: Beer },
    { name: 'Black Label (Quart)', price: 38.00, category: 'Beer', icon: Beer },
    { name: 'Amstel (Quart)', price: 42.00, category: 'Beer', icon: Beer },
    { name: 'Heineken (330ml)', price: 32.00, category: 'Premium Beer', icon: Beer },
    { name: 'Stella (330ml)', price: 35.00, category: 'Premium Beer', icon: Beer },
    // Ciders
    { name: 'Savanna Dry', price: 32.00, category: 'Ciders', icon: Beer },
    { name: 'Savanna Light', price: 32.00, category: 'Ciders', icon: Beer },
    { name: 'Hunter\'s Gold', price: 30.00, category: 'Ciders', icon: Beer },
    { name: 'Hunter\'s Dry', price: 30.00, category: 'Ciders', icon: Beer },
    { name: 'Redd\'s', price: 28.00, category: 'Ciders', icon: Beer },
    // Spirits (by the glass)
    { name: 'Brandy & Coke', price: 45.00, category: 'Mixers', icon: Wine },
    { name: 'Whisky & Coke', price: 55.00, category: 'Mixers', icon: Wine },
    { name: 'Vodka & Lemonade', price: 48.00, category: 'Mixers', icon: Wine },
    { name: 'Gin & Tonic', price: 52.00, category: 'Mixers', icon: Wine },
    { name: 'Rum & Coke', price: 48.00, category: 'Mixers', icon: Wine },
    { name: 'Jägerbomb', price: 55.00, category: 'Shots', icon: Wine },
    { name: 'Tequila Shot', price: 35.00, category: 'Shots', icon: Wine },
    { name: 'Sambuca Shot', price: 32.00, category: 'Shots', icon: Wine },
    // Snacks
    { name: 'Peanuts Pack', price: 15.00, category: 'Snacks', icon: Cookie },
    { name: 'Biltong Pack', price: 35.00, category: 'Snacks', icon: Cookie },
    { name: 'Chip Packet', price: 18.00, category: 'Snacks', icon: Cookie },
    { name: 'Droëwors Pack', price: 32.00, category: 'Snacks', icon: Cookie },
  ],
  'nightclub': [
    // Drinks
    { name: 'Draft Beer', price: 35.00, category: 'Beer', icon: Beer },
    { name: 'Bottled Beer', price: 38.00, category: 'Beer', icon: Beer },
    { name: 'Premium Beer', price: 45.00, category: 'Beer', icon: Beer },
    { name: 'Cider', price: 35.00, category: 'Cider', icon: Beer },
    // Cocktails
    { name: 'Mojito', price: 65.00, category: 'Cocktails', icon: Wine },
    { name: 'Cosmopolitan', price: 68.00, category: 'Cocktails', icon: Wine },
    { name: 'Long Island', price: 72.00, category: 'Cocktails', icon: Wine },
    { name: 'Sex on the Beach', price: 68.00, category: 'Cocktails', icon: Wine },
    { name: 'Margarita', price: 62.00, category: 'Cocktails', icon: Wine },
    { name: 'Pina Colada', price: 65.00, category: 'Cocktails', icon: Wine },
    { name: 'Espresso Martini', price: 75.00, category: 'Cocktails', icon: Wine },
    // Shots
    { name: 'Tequila Shot', price: 35.00, category: 'Shots', icon: Wine },
    { name: 'Jägermeister Shot', price: 38.00, category: 'Shots', icon: Wine },
    { name: 'Sambuca Shot', price: 32.00, category: 'Shots', icon: Wine },
    { name: 'Double Tequila', price: 58.00, category: 'Shots', icon: Wine },
    // Entry
    { name: 'Entry - Regular', price: 100.00, category: 'Entry', icon: Ticket },
    { name: 'Entry - VIP', price: 250.00, category: 'Entry', icon: Ticket },
    { name: 'VIP Table (4 pax)', price: 1500.00, category: 'Entry', icon: Ticket },
    { name: 'Bottle Service (Standard)', price: 850.00, category: 'Bottle Service', icon: Wine },
    { name: 'Bottle Service (Premium)', price: 1450.00, category: 'Bottle Service', icon: Wine },
  ],
  'shebeen': [
    // Beer
    { name: 'Beer Quart', price: 32.00, category: 'Beer', icon: Beer },
    { name: 'Beer Can', price: 22.00, category: 'Beer', icon: Beer },
    { name: 'Beer 6-Pack', price: 95.00, category: 'Beer', icon: Beer },
    { name: 'Beer Case (24)', price: 320.00, category: 'Beer', icon: Beer },
    // Spirits (Affordable)
    { name: 'Brandy 750ml', price: 145.00, category: 'Spirits', icon: Wine },
    { name: 'Vodka 750ml', price: 135.00, category: 'Spirits', icon: Wine },
    { name: 'Gin 750ml', price: 145.00, category: 'Spirits', icon: Wine },
    { name: 'Whisky 750ml', price: 185.00, category: 'Spirits', icon: Wine },
    // Mixers
    { name: 'Brandy & Coke', price: 38.00, category: 'Mixers', icon: Wine },
    { name: 'Vodka & Mix', price: 35.00, category: 'Mixers', icon: Wine },
    { name: 'Whisky & Coke', price: 42.00, category: 'Mixers', icon: Wine },
    // Credit/Tab
    { name: 'Customer Credit', price: 0.00, category: 'Credit', icon: CreditCard },
    { name: 'Deposit', price: 0.00, category: 'Credit', icon: CreditCard },
  ],
  'bottle-store': [
    // Beer Cases
    { name: 'Castle Lager Case (24)', price: 320.00, category: 'Beer Cases', icon: Beer },
    { name: 'Castle Lite Case (24)', price: 355.00, category: 'Beer Cases', icon: Beer },
    { name: 'Black Label Case (24)', price: 330.00, category: 'Beer Cases', icon: Beer },
    { name: 'Hansa Case (24)', price: 310.00, category: 'Beer Cases', icon: Beer },
    { name: 'Amstel Case (24)', price: 380.00, category: 'Beer Cases', icon: Beer },
    { name: 'Heineken Case (24)', price: 520.00, category: 'Beer Cases', icon: Beer },
    // Quarts
    { name: 'Castle Quart', price: 35.00, category: 'Quarts', icon: Beer },
    { name: 'Castle Lite Quart', price: 38.00, category: 'Quarts', icon: Beer },
    { name: 'Black Label Quart', price: 38.00, category: 'Quarts', icon: Beer },
    { name: 'Amstel Quart', price: 42.00, category: 'Quarts', icon: Beer },
    // Spirits
    { name: 'Klipdrift Brandy 750ml', price: 189.00, category: 'Spirits', icon: Wine },
    { name: 'Klipdrift Brandy 1L', price: 249.00, category: 'Spirits', icon: Wine },
    { name: 'Smirnoff Vodka 750ml', price: 195.00, category: 'Spirits', icon: Wine },
    { name: 'Smirnoff Vodka 1L', price: 255.00, category: 'Spirits', icon: Wine },
    { name: 'J&B Whisky 750ml', price: 275.00, category: 'Spirits', icon: Wine },
    { name: 'Gordons Gin 750ml', price: 199.00, category: 'Spirits', icon: Wine },
    // Wine
    { name: 'Four Cousins Red 750ml', price: 89.00, category: 'Wine', icon: Wine },
    { name: 'Four Cousins White 750ml', price: 89.00, category: 'Wine', icon: Wine },
    { name: 'Namaqua Red 750ml', price: 58.00, category: 'Wine', icon: Wine },
    { name: 'KWV 5L Box Wine', price: 145.00, category: 'Wine', icon: Wine },
    // Ciders
    { name: 'Savanna 6-Pack', price: 102.00, category: 'Ciders', icon: Beer },
    { name: 'Hunter\'s 6-Pack', price: 98.00, category: 'Ciders', icon: Beer },
  ],
  'wine-farm': [
    // Wine Tasting
    { name: 'Wine Tasting (5 wines)', price: 85.00, category: 'Tasting', icon: Wine },
    { name: 'Premium Tasting (8 wines)', price: 145.00, category: 'Tasting', icon: Wine },
    { name: 'Wine & Cheese Pairing', price: 165.00, category: 'Tasting', icon: Wine },
    { name: 'Wine & Chocolate Pairing', price: 175.00, category: 'Tasting', icon: Wine },
    // Red Wines
    { name: 'Estate Cabernet Sauvignon', price: 185.00, category: 'Red Wine', icon: Wine },
    { name: 'Estate Merlot', price: 175.00, category: 'Red Wine', icon: Wine },
    { name: 'Estate Pinotage', price: 195.00, category: 'Red Wine', icon: Wine },
    { name: 'Estate Shiraz', price: 195.00, category: 'Red Wine', icon: Wine },
    { name: 'Estate Red Blend', price: 225.00, category: 'Red Wine', icon: Wine },
    { name: 'Reserve Cabernet', price: 285.00, category: 'Red Wine', icon: Wine },
    // White Wines
    { name: 'Estate Chenin Blanc', price: 145.00, category: 'White Wine', icon: Wine },
    { name: 'Estate Sauvignon Blanc', price: 155.00, category: 'White Wine', icon: Wine },
    { name: 'Estate Chardonnay', price: 165.00, category: 'White Wine', icon: Wine },
    { name: 'Estate Semillon', price: 155.00, category: 'White Wine', icon: Wine },
    // Sparkling
    { name: 'Methode Cap Classique', price: 245.00, category: 'Sparkling', icon: Wine },
    { name: 'Sparkling Rosé', price: 195.00, category: 'Sparkling', icon: Wine },
    // Rosé
    { name: 'Estate Rosé', price: 155.00, category: 'Rosé', icon: Wine },
    { name: 'Dry Rosé', price: 145.00, category: 'Rosé', icon: Wine },
    // By Glass
    { name: 'Wine by Glass (House)', price: 45.00, category: 'By Glass', icon: Wine },
    { name: 'Wine by Glass (Premium)', price: 65.00, category: 'By Glass', icon: Wine },
    // Platters
    { name: 'Cheese Platter', price: 125.00, category: 'Food', icon: Apple },
    { name: 'Meat Platter', price: 145.00, category: 'Food', icon: Utensils },
    { name: 'Light Lunch', price: 95.00, category: 'Food', icon: Utensils },
  ],
  'default': [
    { name: 'Beer Quart', price: 35.00, category: 'Beer', icon: Beer },
    { name: 'Beer Can', price: 22.00, category: 'Beer', icon: Beer },
    { name: 'Brandy 750ml', price: 185.00, category: 'Spirits', icon: Wine },
    { name: 'Vodka 750ml', price: 195.00, category: 'Spirits', icon: Wine },
  ]
}

// Grocery & FMCG SKUs
export const grocerySKUs: Record<string, SKU[]> = {
  'superette': [
    // Bakery
    { name: 'White Bread Loaf', price: 17.50, category: 'Bakery', icon: Cookie },
    { name: 'Brown Bread Loaf', price: 18.90, category: 'Bakery', icon: Cookie },
    { name: 'Hot Dog Rolls (6)', price: 22.00, category: 'Bakery', icon: Cookie },
    { name: 'Burger Buns (6)', price: 24.00, category: 'Bakery', icon: Cookie },
    // Dairy
    { name: 'Fresh Milk 1L', price: 22.90, category: 'Dairy', icon: Droplets },
    { name: 'Fresh Milk 2L', price: 42.90, category: 'Dairy', icon: Droplets },
    { name: 'Long Life Milk 1L', price: 19.90, category: 'Dairy', icon: Droplets },
    { name: 'Amasi 500ml', price: 18.90, category: 'Dairy', icon: Droplets },
    { name: 'Maas 500ml', price: 16.90, category: 'Dairy', icon: Droplets },
    { name: 'Yoghurt (Plain) 1kg', price: 35.90, category: 'Dairy', icon: Droplets },
    { name: 'Yoghurt (Flavoured)', price: 12.90, category: 'Dairy', icon: Droplets },
    { name: 'Butter 500g', price: 54.90, category: 'Dairy', icon: Droplets },
    { name: 'Margarine 500g', price: 32.90, category: 'Dairy', icon: Droplets },
    { name: 'Cheese (Cheddar) 1kg', price: 115.00, category: 'Dairy', icon: Cookie },
    { name: 'Eggs (6)', price: 28.90, category: 'Dairy', icon: Cookie },
    { name: 'Eggs (12)', price: 54.90, category: 'Dairy', icon: Cookie },
    { name: 'Eggs (18)', price: 78.90, category: 'Dairy', icon: Cookie },
    // Meat
    { name: 'Chicken (Whole)', price: 85.00, category: 'Meat', icon: Utensils },
    { name: 'Chicken Portions (1kg)', price: 72.90, category: 'Meat', icon: Utensils },
    { name: 'Mince Meat (1kg)', price: 89.90, category: 'Meat', icon: Utensils },
    { name: 'Beef Stew (1kg)', price: 105.00, category: 'Meat', icon: Utensils },
    { name: 'Boerewors (1kg)', price: 89.90, category: 'Meat', icon: Utensils },
    { name: 'Pork Chops (1kg)', price: 95.00, category: 'Meat', icon: Utensils },
    // Pantry
    { name: 'Maize Meal 5kg', price: 59.90, category: 'Pantry', icon: Package },
    { name: 'Maize Meal 10kg', price: 109.90, category: 'Pantry', icon: Package },
    { name: 'Rice 2kg', price: 45.90, category: 'Pantry', icon: Package },
    { name: 'Rice 5kg', price: 99.90, category: 'Pantry', icon: Package },
    { name: 'Sugar 1kg', price: 32.90, category: 'Pantry', icon: Package },
    { name: 'Sugar 2.5kg', price: 75.90, category: 'Pantry', icon: Package },
    { name: 'Flour 1kg', price: 28.90, category: 'Pantry', icon: Package },
    { name: 'Flour 2.5kg', price: 62.90, category: 'Pantry', icon: Package },
    { name: 'Cooking Oil 750ml', price: 45.90, category: 'Pantry', icon: Droplets },
    { name: 'Cooking Oil 2L', price: 89.90, category: 'Pantry', icon: Droplets },
    { name: 'Sunflower Oil 5L', price: 189.00, category: 'Pantry', icon: Droplets },
    // Beverages
    { name: 'Coca-Cola 2L', price: 32.90, category: 'Beverages', icon: Droplets },
    { name: 'Fanta 2L', price: 32.90, category: 'Beverages', icon: Droplets },
    { name: 'Sprite 2L', price: 32.90, category: 'Beverages', icon: Droplets },
    { name: 'Coca-Cola 500ml', price: 14.90, category: 'Beverages', icon: Droplets },
    { name: 'Juice 1L', price: 28.90, category: 'Beverages', icon: Droplets },
    { name: 'Mazoe Orange 2L', price: 42.90, category: 'Beverages', icon: Droplets },
    { name: 'Bottled Water 500ml', price: 8.90, category: 'Beverages', icon: Droplets },
    // Airtime
    { name: 'Vodacom Airtime R10', price: 10.00, category: 'Airtime', icon: Zap },
    { name: 'Vodacom Airtime R20', price: 20.00, category: 'Airtime', icon: Zap },
    { name: 'Vodacom Airtime R50', price: 50.00, category: 'Airtime', icon: Zap },
    { name: 'MTN Airtime R10', price: 10.00, category: 'Airtime', icon: Zap },
    { name: 'MTN Airtime R20', price: 20.00, category: 'Airtime', icon: Zap },
    { name: 'Cell C Airtime R10', price: 10.00, category: 'Airtime', icon: Zap },
    { name: 'Telkom Airtime R10', price: 10.00, category: 'Airtime', icon: Zap },
  ],
  'spaza': [
    // Bread
    { name: 'White Bread', price: 16.00, category: 'Bread', icon: Cookie },
    { name: 'Brown Bread', price: 17.50, category: 'Bread', icon: Cookie },
    // Dairy
    { name: 'Milk 1L', price: 20.00, category: 'Dairy', icon: Droplets },
    { name: 'Milk 2L', price: 38.00, category: 'Dairy', icon: Droplets },
    { name: 'Amasi 500ml', price: 16.00, category: 'Dairy', icon: Droplets },
    { name: 'Eggs (6)', price: 25.00, category: 'Dairy', icon: Cookie },
    { name: 'Eggs (12)', price: 48.00, category: 'Dairy', icon: Cookie },
    // Pantry
    { name: 'Maize Meal 1kg', price: 18.00, category: 'Pantry', icon: Package },
    { name: 'Maize Meal 5kg', price: 55.00, category: 'Pantry', icon: Package },
    { name: 'Rice 1kg', price: 22.00, category: 'Pantry', icon: Package },
    { name: 'Sugar 1kg', price: 30.00, category: 'Pantry', icon: Package },
    { name: 'Flour 1kg', price: 25.00, category: 'Pantry', icon: Package },
    { name: 'Cooking Oil 750ml', price: 42.00, category: 'Pantry', icon: Droplets },
    // Snacks
    { name: 'Chips (Small)', price: 6.50, category: 'Snacks', icon: Cookie },
    { name: 'Chips (Large)', price: 12.00, category: 'Snacks', icon: Cookie },
    { name: 'Biscuits', price: 8.50, category: 'Snacks', icon: Cookie },
    { name: 'Sweets (Small)', price: 3.50, category: 'Snacks', icon: Cookie },
    { name: 'Sweets (Large)', price: 8.00, category: 'Snacks', icon: Cookie },
    { name: 'Chappies', price: 2.00, category: 'Snacks', icon: Cookie },
    { name: 'Bubblegum', price: 2.50, category: 'Snacks', icon: Cookie },
    // Cold Drinks
    { name: 'Coke 500ml', price: 12.00, category: 'Drinks', icon: Droplets },
    { name: 'Fanta 500ml', price: 12.00, category: 'Drinks', icon: Droplets },
    { name: 'Sprite 500ml', price: 12.00, category: 'Drinks', icon: Droplets },
    { name: 'Stoney 500ml', price: 12.00, category: 'Drinks', icon: Droplets },
    { name: 'Juice 500ml', price: 15.00, category: 'Drinks', icon: Droplets },
    { name: 'Water 500ml', price: 6.00, category: 'Drinks', icon: Droplets },
    // Airtime
    { name: 'Vodacom R5', price: 5.00, category: 'Airtime', icon: Zap },
    { name: 'Vodacom R10', price: 10.00, category: 'Airtime', icon: Zap },
    { name: 'MTN R5', price: 5.00, category: 'Airtime', icon: Zap },
    { name: 'MTN R10', price: 10.00, category: 'Airtime', icon: Zap },
    { name: 'Cell C R5', price: 5.00, category: 'Airtime', icon: Zap },
    // Cigarettes
    { name: 'Cigarettes (Loose)', price: 3.50, category: 'Tobacco', icon: Package },
    { name: 'Cigarettes (Pack)', price: 45.00, category: 'Tobacco', icon: Package },
    // Ice
    { name: 'Ice (Small)', price: 8.00, category: 'Other', icon: Droplets },
    { name: 'Ice (Large)', price: 15.00, category: 'Other', icon: Droplets },
  ],
  'butchery': [
    // Beef
    { name: 'Beef Mince (per kg)', price: 89.90, category: 'Beef', icon: Utensils },
    { name: 'Beef Stew (per kg)', price: 95.00, category: 'Beef', icon: Utensils },
    { name: 'Beef Steak (per kg)', price: 145.00, category: 'Beef', icon: Utensils },
    { name: 'Sirloin (per kg)', price: 165.00, category: 'Beef', icon: Utensils },
    { name: 'Rump (per kg)', price: 155.00, category: 'Beef', icon: Utensils },
    { name: 'T-Bone (per kg)', price: 175.00, category: 'Beef', icon: Utensils },
    { name: 'Brisket (per kg)', price: 85.00, category: 'Beef', icon: Utensils },
    { name: 'Oxtail (per kg)', price: 125.00, category: 'Beef', icon: Utensils },
    { name: 'Tripe (per kg)', price: 65.00, category: 'Beef', icon: Utensils },
    // Chicken
    { name: 'Whole Chicken', price: 79.90, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Portions (per kg)', price: 65.00, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Breasts (per kg)', price: 95.00, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Thighs (per kg)', price: 72.00, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Drumsticks (per kg)', price: 68.00, category: 'Chicken', icon: Utensils },
    { name: 'Chicken Livers (per kg)', price: 55.00, category: 'Chicken', icon: Utensils },
    // Lamb
    { name: 'Lamb Chops (per kg)', price: 185.00, category: 'Lamb', icon: Utensils },
    { name: 'Lamb Stew (per kg)', price: 145.00, category: 'Lamb', icon: Utensils },
    { name: 'Lamb Leg (per kg)', price: 155.00, category: 'Lamb', icon: Utensils },
    { name: 'Lamb Shoulder (per kg)', price: 135.00, category: 'Lamb', icon: Utensils },
    // Pork
    { name: 'Pork Chops (per kg)', price: 95.00, category: 'Pork', icon: Utensils },
    { name: 'Pork Ribs (per kg)', price: 105.00, category: 'Pork', icon: Utensils },
    { name: 'Pork Sausage (per kg)', price: 85.00, category: 'Pork', icon: Utensils },
    // Boerewors & Sausages
    { name: 'Boerewors (per kg)', price: 89.90, category: 'Wors', icon: Utensils },
    { name: 'Boerewors (500g)', price: 49.90, category: 'Wors', icon: Utensils },
    { name: 'Spice Wors (per kg)', price: 95.00, category: 'Wors', icon: Utensils },
    { name: 'Chicken Wors (per kg)', price: 78.00, category: 'Wors', icon: Utensils },
    // Braai Packs
    { name: 'Braai Pack (500g)', price: 125.00, category: 'Braai Packs', icon: Utensils },
    { name: 'Braai Pack (1kg)', price: 225.00, category: 'Braai Packs', icon: Utensils },
    { name: 'Family Pack (2kg)', price: 420.00, category: 'Braai Packs', icon: Utensils },
  ],
  'deli': [
    // Cold Meats (per 100g)
    { name: 'Ham (per 100g)', price: 18.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Polony (per 100g)', price: 8.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Salami (per 100g)', price: 24.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Chicken Loaf (per 100g)', price: 12.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Russian Sausage (per 100g)', price: 14.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Viennas (per 100g)', price: 12.90, category: 'Cold Meats', icon: Utensils },
    { name: 'Bacon (per 100g)', price: 22.90, category: 'Cold Meats', icon: Utensils },
    // Cheese (per 100g)
    { name: 'Cheddar (per 100g)', price: 12.90, category: 'Cheese', icon: Cookie },
    { name: 'Gouda (per 100g)', price: 14.90, category: 'Cheese', icon: Cookie },
    { name: 'Mozzarella (per 100g)', price: 15.90, category: 'Cheese', icon: Cookie },
    { name: 'Feta (per 100g)', price: 18.90, category: 'Cheese', icon: Cookie },
    { name: 'Cream Cheese (per 100g)', price: 16.90, category: 'Cheese', icon: Cookie },
    // Salads
    { name: 'Potato Salad (per 100g)', price: 9.90, category: 'Salads', icon: Apple },
    { name: 'Coleslaw (per 100g)', price: 8.90, category: 'Salads', icon: Apple },
    { name: 'Greek Salad (per 100g)', price: 12.90, category: 'Salads', icon: Apple },
    { name: 'Pasta Salad (per 100g)', price: 11.90, category: 'Salads', icon: Apple },
    { name: 'Bean Salad (per 100g)', price: 9.90, category: 'Salads', icon: Apple },
    // Ready Meals
    { name: 'Chicken Pie', price: 38.00, category: 'Ready Meals', icon: Pizza },
    { name: 'Meat Pie', price: 38.00, category: 'Ready Meals', icon: Pizza },
    { name: 'Samoosa (Meat)', price: 12.00, category: 'Ready Meals', icon: Sandwich },
    { name: 'Samoosa (Veg)', price: 10.00, category: 'Ready Meals', icon: Sandwich },
    { name: 'Spring Roll', price: 12.00, category: 'Ready Meals', icon: Sandwich },
    // Platters
    { name: 'Meat Platter (Small)', price: 125.00, category: 'Platters', icon: Utensils },
    { name: 'Meat Platter (Large)', price: 225.00, category: 'Platters', icon: Utensils },
    { name: 'Cheese Platter', price: 165.00, category: 'Platters', icon: Cookie },
    { name: 'Party Platter', price: 285.00, category: 'Platters', icon: Utensils },
  ],
  'farm-stall': [
    // Fresh Produce
    { name: 'Tomatoes (per kg)', price: 25.00, category: 'Vegetables', icon: Apple },
    { name: 'Onions (per kg)', price: 18.00, category: 'Vegetables', icon: Apple },
    { name: 'Potatoes (per kg)', price: 15.00, category: 'Vegetables', icon: Apple },
    { name: 'Carrots (per kg)', price: 18.00, category: 'Vegetables', icon: Apple },
    { name: 'Cabbage (whole)', price: 18.00, category: 'Vegetables', icon: Apple },
    { name: 'Spinach (bunch)', price: 12.00, category: 'Vegetables', icon: Apple },
    { name: 'Green Beans (per kg)', price: 28.00, category: 'Vegetables', icon: Apple },
    { name: 'Butternut (per kg)', price: 15.00, category: 'Vegetables', icon: Apple },
    { name: 'Pumpkin (per kg)', price: 12.00, category: 'Vegetables', icon: Apple },
    { name: 'Peppers (per kg)', price: 35.00, category: 'Vegetables', icon: Apple },
    // Fruits
    { name: 'Apples (per kg)', price: 28.00, category: 'Fruits', icon: Apple },
    { name: 'Oranges (per kg)', price: 22.00, category: 'Fruits', icon: Apple },
    { name: 'Bananas (per kg)', price: 18.00, category: 'Fruits', icon: Apple },
    { name: 'Grapes (500g)', price: 32.00, category: 'Fruits', icon: Apple },
    { name: 'Pears (per kg)', price: 28.00, category: 'Fruits', icon: Apple },
    { name: 'Peaches (per kg)', price: 35.00, category: 'Fruits', icon: Apple },
    // Farm Products
    { name: 'Farm Fresh Eggs (12)', price: 45.00, category: 'Farm Products', icon: Cookie },
    { name: 'Free Range Eggs (12)', price: 58.00, category: 'Farm Products', icon: Cookie },
    { name: 'Farm Milk 1L', price: 25.00, category: 'Farm Products', icon: Droplets },
    { name: 'Farm Butter 500g', price: 65.00, category: 'Farm Products', icon: Droplets },
    { name: 'Honey 500ml', price: 95.00, category: 'Farm Products', icon: Droplets },
    { name: 'Homemade Jam', price: 35.00, category: 'Farm Products', icon: Cookie },
    // Baked Goods
    { name: 'Farm Bread', price: 25.00, category: 'Baked', icon: Cookie },
    { name: 'Fresh Rusks', price: 35.00, category: 'Baked', icon: Cookie },
    { name: 'Baked Muffins (4)', price: 35.00, category: 'Baked', icon: Cookie },
    { name: 'Koeksisters (6)', price: 32.00, category: 'Baked', icon: Cookie },
  ],
  'cash-carry': [
    // Bulk Beverages
    { name: 'Coca-Cola Case (24x330ml)', price: 295.00, category: 'Beverages', icon: Droplets },
    { name: 'Coca-Cola 2L Case (6)', price: 195.00, category: 'Beverages', icon: Droplets },
    { name: 'Fanta 2L Case (6)', price: 195.00, category: 'Beverages', icon: Droplets },
    { name: 'Sprite 2L Case (6)', price: 195.00, category: 'Beverages', icon: Droplets },
    { name: 'Juice 1L Case (12)', price: 295.00, category: 'Beverages', icon: Droplets },
    { name: 'Water 500ml Case (24)', price: 145.00, category: 'Beverages', icon: Droplets },
    // Bulk Pantry
    { name: 'Maize Meal 25kg', price: 249.00, category: 'Pantry', icon: Package },
    { name: 'Rice 20kg', price: 345.00, category: 'Pantry', icon: Package },
    { name: 'Sugar 10kg', price: 245.00, category: 'Pantry', icon: Package },
    { name: 'Flour 10kg', price: 195.00, category: 'Pantry', icon: Package },
    { name: 'Cooking Oil 20L', price: 585.00, category: 'Pantry', icon: Droplets },
    { name: 'Sunflower Oil 5L', price: 175.00, category: 'Pantry', icon: Droplets },
    // Bulk Cleaning
    { name: 'Washing Powder 5kg', price: 165.00, category: 'Cleaning', icon: Package },
    { name: 'Dishwashing Liquid 5L', price: 85.00, category: 'Cleaning', icon: Droplets },
    { name: 'Bleach 5L', price: 65.00, category: 'Cleaning', icon: Droplets },
    { name: 'Multi-Purpose Cleaner 5L', price: 75.00, category: 'Cleaning', icon: Droplets },
    // Snacks Bulk
    { name: 'Chips Box (48 assorted)', price: 295.00, category: 'Snacks', icon: Cookie },
    { name: 'Biscuits Box', price: 125.00, category: 'Snacks', icon: Cookie },
    { name: 'Sweets Box', price: 145.00, category: 'Snacks', icon: Cookie },
    // Paper & Packaging
    { name: 'Toilet Paper 48 rolls', price: 245.00, category: 'Paper', icon: Package },
    { name: 'Paper Towels 12 rolls', price: 135.00, category: 'Paper', icon: Package },
    { name: ' refuse Bags (100)', price: 95.00, category: 'Paper', icon: Package },
  ],
  'bakery-retail': [
    // Bread Wholesale
    { name: 'White Bread (Loose)', price: 15.00, category: 'Bread', icon: Cookie },
    { name: 'Brown Bread (Loose)', price: 16.00, category: 'Bread', icon: Cookie },
    { name: 'White Bread Case (20)', price: 280.00, category: 'Bread Wholesale', icon: Package },
    { name: 'Brown Bread Case (20)', price: 300.00, category: 'Bread Wholesale', icon: Package },
    // Rolls Wholesale
    { name: 'Hot Dog Rolls (6)', price: 18.00, category: 'Rolls', icon: Cookie },
    { name: 'Burger Buns (6)', price: 20.00, category: 'Rolls', icon: Cookie },
    { name: 'Hot Dog Rolls Box (48)', price: 145.00, category: 'Rolls Wholesale', icon: Package },
    { name: 'Burger Buns Box (48)', price: 165.00, category: 'Rolls Wholesale', icon: Package },
    // Pastries
    { name: 'Croissant (Single)', price: 18.00, category: 'Pastries', icon: Cookie },
    { name: 'Croissant Box (24)', price: 395.00, category: 'Pastries Wholesale', icon: Package },
    { name: 'Danish Pastry Box (24)', price: 365.00, category: 'Pastries Wholesale', icon: Package },
    // Savory
    { name: 'Meat Pie (Single)', price: 18.00, category: 'Savory', icon: Pizza },
    { name: 'Meat Pie Box (24)', price: 395.00, category: 'Savory Wholesale', icon: Package },
    { name: 'Sausage Roll Box (36)', price: 295.00, category: 'Savory Wholesale', icon: Package },
  ],
  'default': [
    { name: 'White Bread', price: 18.00, category: 'Bakery', icon: Cookie },
    { name: 'Milk 1L', price: 22.00, category: 'Dairy', icon: Droplets },
    { name: 'Maize Meal 1kg', price: 22.00, category: 'Pantry', icon: Package },
    { name: 'Sugar 1kg', price: 32.00, category: 'Pantry', icon: Package },
    { name: 'Cooking Oil 750ml', price: 42.00, category: 'Pantry', icon: Droplets },
    { name: 'Coca-Cola 2L', price: 32.00, category: 'Beverages', icon: Droplets },
  ]
}

// Health & Beauty SKUs
export const healthBeautySKUs: Record<string, SKU[]> = {
  'hair-salon': [
    // Cuts
    { name: 'Ladies Cut', price: 180.00, category: 'Cuts', icon: Scissors },
    { name: 'Mens Cut', price: 100.00, category: 'Cuts', icon: Scissors },
    { name: 'Kids Cut', price: 80.00, category: 'Cuts', icon: Scissors },
    { name: 'Trim & Shape', price: 120.00, category: 'Cuts', icon: Scissors },
    { name: 'Buzz Cut', price: 60.00, category: 'Cuts', icon: Scissors },
    // Color
    { name: 'Full Color', price: 450.00, category: 'Color', icon: Sparkles },
    { name: 'Root Touch Up', price: 280.00, category: 'Color', icon: Sparkles },
    { name: 'Highlights (Full)', price: 550.00, category: 'Color', icon: Sparkles },
    { name: 'Highlights (Partial)', price: 350.00, category: 'Color', icon: Sparkles },
    { name: 'Bleach & Tone', price: 480.00, category: 'Color', icon: Sparkles },
    { name: 'Color Correction', price: 650.00, category: 'Color', icon: Sparkles },
    // Treatments
    { name: 'Wash & Blow Dry', price: 150.00, category: 'Treatments', icon: Sparkles },
    { name: 'Blow Dry Only', price: 120.00, category: 'Treatments', icon: Sparkles },
    { name: 'Deep Conditioning', price: 180.00, category: 'Treatments', icon: Sparkles },
    { name: 'Protein Treatment', price: 220.00, category: 'Treatments', icon: Sparkles },
    { name: 'Scalp Treatment', price: 200.00, category: 'Treatments', icon: Sparkles },
    { name: 'Relaxer', price: 350.00, category: 'Treatments', icon: Sparkles },
    { name: 'Perms', price: 380.00, category: 'Treatments', icon: Sparkles },
    // Styling
    { name: 'Upstyle', price: 350.00, category: 'Styling', icon: Sparkles },
    { name: 'Bridal Hair', price: 650.00, category: 'Styling', icon: Sparkles },
    { name: 'Braid Extensions', price: 450.00, category: 'Styling', icon: Sparkles },
    { name: 'Cornrows', price: 200.00, category: 'Styling', icon: Sparkles },
    // Packages
    { name: 'Cut & Blow Dry', price: 280.00, category: 'Packages', icon: Scissors },
    { name: 'Cut, Color & Style', price: 650.00, category: 'Packages', icon: Scissors },
    { name: 'Full Makeover', price: 850.00, category: 'Packages', icon: Scissors },
  ],
  'barber': [
    // Cuts
    { name: 'Haircut', price: 80.00, category: 'Cuts', icon: Scissors },
    { name: 'Kids Cut', price: 60.00, category: 'Cuts', icon: Scissors },
    { name: 'Pensioner Cut', price: 55.00, category: 'Cuts', icon: Scissors },
    { name: 'Skin Fade', price: 100.00, category: 'Cuts', icon: Scissors },
    { name: 'Taper Fade', price: 100.00, category: 'Cuts', icon: Scissors },
    { name: 'Buzz Cut', price: 50.00, category: 'Cuts', icon: Scissors },
    { name: 'Head Shave', price: 70.00, category: 'Cuts', icon: Scissors },
    // Beard
    { name: 'Beard Trim', price: 40.00, category: 'Beard', icon: Scissors },
    { name: 'Beard Shape Up', price: 50.00, category: 'Beard', icon: Scissors },
    { name: 'Hot Towel Shave', price: 80.00, category: 'Beard', icon: Scissors },
    { name: 'Full Shave', price: 70.00, category: 'Beard', icon: Scissors },
    // Combo
    { name: 'Cut & Beard', price: 120.00, category: 'Combos', icon: Scissors },
    { name: 'Cut & Hot Towel', price: 150.00, category: 'Combos', icon: Scissors },
    { name: 'The Full Works', price: 180.00, category: 'Combos', icon: Scissors },
    // Extras
    { name: 'Line Up', price: 30.00, category: 'Extras', icon: Scissors },
    { name: 'Edge Up', price: 30.00, category: 'Extras', icon: Scissors },
    { name: 'Hair Design', price: 50.00, category: 'Extras', icon: Scissors },
    { name: 'Eyebrows', price: 25.00, category: 'Extras', icon: Scissors },
  ],
  'nail-salon': [
    // Manicure
    { name: 'Basic Manicure', price: 120.00, category: 'Manicure', icon: Sparkles },
    { name: 'Gel Manicure', price: 180.00, category: 'Manicure', icon: Sparkles },
    { name: 'Acrylic Full Set', price: 350.00, category: 'Manicure', icon: Sparkles },
    { name: 'Acrylic Fill', price: 200.00, category: 'Manicure', icon: Sparkles },
    { name: 'Dip Powder', price: 280.00, category: 'Manicure', icon: Sparkles },
    { name: 'Nail Art (per nail)', price: 25.00, category: 'Manicure', icon: Sparkles },
    // Pedicure
    { name: 'Basic Pedicure', price: 150.00, category: 'Pedicure', icon: Sparkles },
    { name: 'Spa Pedicure', price: 220.00, category: 'Pedicure', icon: Sparkles },
    { name: 'Gel Pedicure', price: 250.00, category: 'Pedicure', icon: Sparkles },
    { name: 'Deluxe Pedicure', price: 320.00, category: 'Pedicure', icon: Sparkles },
    // Extras
    { name: 'Polish Change (Hands)', price: 80.00, category: 'Extras', icon: Sparkles },
    { name: 'Polish Change (Feet)', price: 100.00, category: 'Extras', icon: Sparkles },
    { name: 'Nail Repair', price: 30.00, category: 'Extras', icon: Sparkles },
    { name: 'Nail Removal', price: 80.00, category: 'Extras', icon: Sparkles },
    // Packages
    { name: 'Mani-Pedi Combo', price: 280.00, category: 'Packages', icon: Sparkles },
    { name: 'Gel Mani-Pedi', price: 380.00, category: 'Packages', icon: Sparkles },
    { name: 'Bridal Package', price: 550.00, category: 'Packages', icon: Sparkles },
  ],
  'spa-wellness': [
    // Massages
    { name: 'Swedish Massage (60min)', price: 450.00, category: 'Massage', icon: Heart },
    { name: 'Deep Tissue (60min)', price: 550.00, category: 'Massage', icon: Heart },
    { name: 'Aromatherapy (60min)', price: 480.00, category: 'Massage', icon: Heart },
    { name: 'Hot Stone Massage', price: 550.00, category: 'Massage', icon: Heart },
    { name: 'Back & Neck (30min)', price: 280.00, category: 'Massage', icon: Heart },
    { name: 'Indian Head Massage', price: 220.00, category: 'Massage', icon: Heart },
    // Facials
    { name: 'Classic Facial', price: 380.00, category: 'Facials', icon: Sparkles },
    { name: 'Deep Cleansing', price: 420.00, category: 'Facials', icon: Sparkles },
    { name: 'Anti-Aging Facial', price: 520.00, category: 'Facials', icon: Sparkles },
    { name: 'Hydrating Facial', price: 450.00, category: 'Facials', icon: Sparkles },
    // Body Treatments
    { name: 'Body Scrub', price: 380.00, category: 'Body', icon: Heart },
    { name: 'Body Wrap', price: 420.00, category: 'Body', icon: Heart },
    { name: 'Detox Wrap', price: 450.00, category: 'Body', icon: Heart },
    // Packages
    { name: 'Half Day Spa', price: 1200.00, category: 'Packages', icon: Heart },
    { name: 'Full Day Spa', price: 1850.00, category: 'Packages', icon: Heart },
    { name: 'Couples Package', price: 1650.00, category: 'Packages', icon: Heart },
  ],
  'aesthetic-clinic': [
    // Consultations
    { name: 'Consultation', price: 450.00, category: 'Consultations', icon: Heart },
    { name: 'Follow-up', price: 250.00, category: 'Consultations', icon: Heart },
    // Injectables
    { name: 'Botox (per area)', price: 1850.00, category: 'Injectables', icon: Sparkles },
    { name: 'Filler (per ml)', price: 2500.00, category: 'Injectables', icon: Sparkles },
    { name: 'Lip Filler', price: 2200.00, category: 'Injectables', icon: Sparkles },
    { name: 'Cheek Filler', price: 2800.00, category: 'Injectables', icon: Sparkles },
    // Skin Treatments
    { name: 'Chemical Peel', price: 850.00, category: 'Skin', icon: Sparkles },
    { name: 'Microneedling', price: 1450.00, category: 'Skin', icon: Sparkles },
    { name: 'Dermaplaning', price: 650.00, category: 'Skin', icon: Sparkles },
    { name: 'IPL Treatment', price: 1200.00, category: 'Skin', icon: Sparkles },
    { name: 'Laser Hair Removal (Small)', price: 650.00, category: 'Skin', icon: Sparkles },
    { name: 'Laser Hair Removal (Large)', price: 1200.00, category: 'Skin', icon: Sparkles },
    // Body Treatments
    { name: 'CoolSculpting (per area)', price: 3500.00, category: 'Body', icon: Heart },
    { name: 'Fat Dissolving', price: 1800.00, category: 'Body', icon: Heart },
  ],
  'tattoo-studio': [
    // Tattoos
    { name: 'Small Tattoo (up to 5cm)', price: 650.00, category: 'Tattoos', icon: Sparkles },
    { name: 'Medium Tattoo (5-15cm)', price: 1250.00, category: 'Tattoos', icon: Sparkles },
    { name: 'Large Tattoo (15cm+)', price: 2500.00, category: 'Tattoos', icon: Sparkles },
    { name: 'Custom Design Fee', price: 350.00, category: 'Tattoos', icon: Sparkles },
    { name: 'Touch Up', price: 250.00, category: 'Tattoos', icon: Sparkles },
    { name: 'Cover Up', price: 1850.00, category: 'Tattoos', icon: Sparkles },
    // Piercings
    { name: 'Ear Lobe Piercing', price: 150.00, category: 'Piercings', icon: Sparkles },
    { name: 'Cartilage Piercing', price: 250.00, category: 'Piercings', icon: Sparkles },
    { name: 'Nose Piercing', price: 280.00, category: 'Piercings', icon: Sparkles },
    { name: 'Navel Piercing', price: 320.00, category: 'Piercings', icon: Sparkles },
    { name: 'Eyebrow Piercing', price: 300.00, category: 'Piercings', icon: Sparkles },
    // Removal
    { name: 'Laser Removal (per session)', price: 850.00, category: 'Removal', icon: Sparkles },
    // Aftercare
    { name: 'Aftercare Kit', price: 120.00, category: 'Aftercare', icon: Package },
  ],
  'lash-brow': [
    // Lashes
    { name: 'Classic Lashes (Full Set)', price: 450.00, category: 'Lashes', icon: Sparkles },
    { name: 'Volume Lashes (Full Set)', price: 650.00, category: 'Lashes', icon: Sparkles },
    { name: 'Hybrid Lashes', price: 550.00, category: 'Lashes', icon: Sparkles },
    { name: 'Mega Volume', price: 750.00, category: 'Lashes', icon: Sparkles },
    { name: 'Lash Lift', price: 320.00, category: 'Lashes', icon: Sparkles },
    { name: 'Lash Lift & Tint', price: 380.00, category: 'Lashes', icon: Sparkles },
    { name: 'Lash Refill (2 weeks)', price: 250.00, category: 'Lashes', icon: Sparkles },
    { name: 'Lash Refill (3 weeks)', price: 320.00, category: 'Lashes', icon: Sparkles },
    { name: 'Lash Removal', price: 80.00, category: 'Lashes', icon: Sparkles },
    // Brows
    { name: 'Brow Shape', price: 120.00, category: 'Brows', icon: Sparkles },
    { name: 'Brow Tint', price: 100.00, category: 'Brows', icon: Sparkles },
    { name: 'Brow Shape & Tint', price: 180.00, category: 'Brows', icon: Sparkles },
    { name: 'Brow Lamination', price: 320.00, category: 'Brows', icon: Sparkles },
    { name: 'Henna Brows', price: 220.00, category: 'Brows', icon: Sparkles },
    { name: 'Microblading', price: 1850.00, category: 'Brows', icon: Sparkles },
    { name: 'Brow Lamination + Tint', price: 420.00, category: 'Brows', icon: Sparkles },
    // Packages
    { name: 'Lash Lift + Brow Lamination', price: 550.00, category: 'Packages', icon: Sparkles },
    { name: 'Full Lash & Brow Package', price: 750.00, category: 'Packages', icon: Sparkles },
  ],
  'default': [
    { name: 'Basic Service', price: 150.00, category: 'Services', icon: Scissors },
    { name: 'Premium Service', price: 280.00, category: 'Services', icon: Sparkles },
    { name: 'Treatment Package', price: 450.00, category: 'Packages', icon: Heart },
  ]
}

// Fashion & Apparel SKUs
export const fashionSKUs: Record<string, SKU[]> = {
  'clothing-boutique': [
    // Tops
    { name: 'Basic T-Shirt', price: 195.00, category: 'Tops', icon: Shirt },
    { name: 'Graphic Tee', price: 285.00, category: 'Tops', icon: Shirt },
    { name: 'Casual Shirt', price: 450.00, category: 'Tops', icon: Shirt },
    { name: 'Dress Shirt', price: 595.00, category: 'Tops', icon: Shirt },
    { name: 'Blouse', price: 395.00, category: 'Tops', icon: Shirt },
    { name: 'Tank Top', price: 165.00, category: 'Tops', icon: Shirt },
    // Bottoms
    { name: 'Jeans (Basic)', price: 595.00, category: 'Bottoms', icon: Shirt },
    { name: 'Jeans (Designer)', price: 895.00, category: 'Bottoms', icon: Shirt },
    { name: 'Chinos', price: 495.00, category: 'Bottoms', icon: Shirt },
    { name: 'Shorts', price: 345.00, category: 'Bottoms', icon: Shirt },
    { name: 'Skirt', price: 395.00, category: 'Bottoms', icon: Shirt },
    { name: 'Leggings', price: 245.00, category: 'Bottoms', icon: Shirt },
    // Dresses
    { name: 'Casual Dress', price: 595.00, category: 'Dresses', icon: Shirt },
    { name: 'Maxi Dress', price: 695.00, category: 'Dresses', icon: Shirt },
    { name: 'Cocktail Dress', price: 895.00, category: 'Dresses', icon: Shirt },
    // Jackets
    { name: 'Denim Jacket', price: 795.00, category: 'Jackets', icon: Shirt },
    { name: 'Leather Jacket', price: 1495.00, category: 'Jackets', icon: Shirt },
    { name: 'Bomber Jacket', price: 695.00, category: 'Jackets', icon: Shirt },
    { name: 'Blazer', price: 895.00, category: 'Jackets', icon: Shirt },
    // Lay-bye
    { name: 'Lay-bye Deposit (20%)', price: 0.00, category: 'Lay-bye', icon: CreditCard },
  ],
  'shoe-store': [
    // Sneakers
    { name: 'Canvas Sneakers', price: 495.00, category: 'Sneakers', icon: Shirt },
    { name: 'Running Shoes', price: 1295.00, category: 'Sneakers', icon: Shirt },
    { name: 'Casual Sneakers', price: 795.00, category: 'Sneakers', icon: Shirt },
    { name: 'High Tops', price: 895.00, category: 'Sneakers', icon: Shirt },
    { name: 'Designer Sneakers', price: 2495.00, category: 'Sneakers', icon: Shirt },
    // Formal Shoes
    { name: 'Leather Oxfords', price: 1195.00, category: 'Formal', icon: Shirt },
    { name: 'Loafers', price: 895.00, category: 'Formal', icon: Shirt },
    { name: 'Derby Shoes', price: 995.00, category: 'Formal', icon: Shirt },
    { name: 'Heels (Pumps)', price: 795.00, category: 'Formal', icon: Shirt },
    { name: 'Heels (Stiletto)', price: 995.00, category: 'Formal', icon: Shirt },
    // Casual
    { name: 'Sandals', price: 345.00, category: 'Casual', icon: Shirt },
    { name: 'Slides', price: 295.00, category: 'Casual', icon: Shirt },
    { name: 'Boat Shoes', price: 795.00, category: 'Casual', icon: Shirt },
    { name: 'Boots', price: 1295.00, category: 'Casual', icon: Shirt },
    { name: 'Flip Flops', price: 95.00, category: 'Casual', icon: Shirt },
    // Kids
    { name: 'Kids Sneakers', price: 395.00, category: 'Kids', icon: Shirt },
    { name: 'Kids School Shoes', price: 345.00, category: 'Kids', icon: Shirt },
    { name: 'Kids Sandals', price: 195.00, category: 'Kids', icon: Shirt },
  ],
  'accessories': [
    // Bags
    { name: 'Backpack', price: 495.00, category: 'Bags', icon: ShoppingBag },
    { name: 'Tote Bag', price: 395.00, category: 'Bags', icon: ShoppingBag },
    { name: 'Crossbody Bag', price: 495.00, category: 'Bags', icon: ShoppingBag },
    { name: 'Clutch Bag', price: 295.00, category: 'Bags', icon: ShoppingBag },
    { name: 'Shoulder Bag', price: 595.00, category: 'Bags', icon: ShoppingBag },
    { name: 'Duffel Bag', price: 695.00, category: 'Bags', icon: ShoppingBag },
    // Wallets
    { name: 'Mens Wallet', price: 295.00, category: 'Wallets', icon: Wallet },
    { name: 'Ladies Purse', price: 345.00, category: 'Wallets', icon: Wallet },
    { name: 'Card Holder', price: 145.00, category: 'Wallets', icon: Wallet },
    // Belts
    { name: 'Leather Belt', price: 295.00, category: 'Belts', icon: Shirt },
    { name: 'Casual Belt', price: 195.00, category: 'Belts', icon: Shirt },
    { name: 'Designer Belt', price: 795.00, category: 'Belts', icon: Shirt },
    // Hats
    { name: 'Baseball Cap', price: 195.00, category: 'Hats', icon: Shirt },
    { name: 'Beanie', price: 145.00, category: 'Hats', icon: Shirt },
    { name: 'Sun Hat', price: 245.00, category: 'Hats', icon: Shirt },
    { name: 'Fedora', price: 345.00, category: 'Hats', icon: Shirt },
    // Jewelry
    { name: 'Watch (Basic)', price: 495.00, category: 'Jewelry', icon: CreditCard },
    { name: 'Watch (Designer)', price: 1495.00, category: 'Jewelry', icon: CreditCard },
    { name: 'Sunglasses', price: 395.00, category: 'Jewelry', icon: CreditCard },
    { name: 'Necklace', price: 295.00, category: 'Jewelry', icon: Sparkles },
    { name: 'Bracelet', price: 195.00, category: 'Jewelry', icon: Sparkles },
    // Scarves
    { name: 'Scarf', price: 195.00, category: 'Scarves', icon: Shirt },
    { name: 'Winter Scarf', price: 295.00, category: 'Scarves', icon: Shirt },
  ],
  'uniform-supplier': [
    // School Uniforms
    { name: 'School Shirt (White)', price: 145.00, category: 'School', icon: Shirt },
    { name: 'School Trousers', price: 225.00, category: 'School', icon: Shirt },
    { name: 'School Skirt', price: 195.00, category: 'School', icon: Shirt },
    { name: 'School Blazer', price: 495.00, category: 'School', icon: Shirt },
    { name: 'School Jersey', price: 295.00, category: 'School', icon: Shirt },
    { name: 'School Tracksuit', price: 395.00, category: 'School', icon: Shirt },
    { name: 'School Tie', price: 85.00, category: 'School', icon: Shirt },
    { name: 'School Socks', price: 45.00, category: 'School', icon: Shirt },
    // Corporate Uniforms
    { name: 'Corporate Shirt', price: 225.00, category: 'Corporate', icon: Shirt },
    { name: 'Corporate Trousers', price: 345.00, category: 'Corporate', icon: Shirt },
    { name: 'Corporate Skirt', price: 295.00, category: 'Corporate', icon: Shirt },
    { name: 'Corporate Blazer', price: 695.00, category: 'Corporate', icon: Shirt },
    { name: 'Corporate Dress', price: 495.00, category: 'Corporate', icon: Shirt },
    // Workwear
    { name: 'Overall (Boilersuit)', price: 395.00, category: 'Workwear', icon: Shirt },
    { name: 'Work Trousers', price: 295.00, category: 'Workwear', icon: Shirt },
    { name: 'Work Shirt', price: 195.00, category: 'Workwear', icon: Shirt },
    { name: 'Safety Vest', price: 145.00, category: 'Workwear', icon: Shirt },
    { name: 'Chef Whites', price: 395.00, category: 'Workwear', icon: Shirt },
    // Medical
    { name: 'Nurses Uniform', price: 345.00, category: 'Medical', icon: Shirt },
    { name: 'Doctors Coat', price: 495.00, category: 'Medical', icon: Shirt },
    { name: 'Theatre Scrubs', price: 295.00, category: 'Medical', icon: Shirt },
    // Embroidery
    { name: 'Logo Embroidery (per item)', price: 45.00, category: 'Customization', icon: Sparkles },
    { name: 'Name Embroidery', price: 25.00, category: 'Customization', icon: Sparkles },
    // Bulk Orders
    { name: 'Bulk Order (10+ items) - 10% off', price: 0.00, category: 'Bulk', icon: Package },
    { name: 'Bulk Order (50+ items) - 15% off', price: 0.00, category: 'Bulk', icon: Package },
  ],
  'thrift': [
    // Men's
    { name: 'Mens Shirt', price: 65.00, category: 'Mens', icon: Shirt },
    { name: 'Mens T-Shirt', price: 35.00, category: 'Mens', icon: Shirt },
    { name: 'Mens Jeans', price: 95.00, category: 'Mens', icon: Shirt },
    { name: 'Mens Trousers', price: 75.00, category: 'Mens', icon: Shirt },
    { name: 'Mens Jacket', price: 125.00, category: 'Mens', icon: Shirt },
    { name: 'Mens Shoes', price: 85.00, category: 'Mens', icon: Shirt },
    // Women's
    { name: 'Womens Top', price: 55.00, category: 'Womens', icon: Shirt },
    { name: 'Womens Dress', price: 85.00, category: 'Womens', icon: Shirt },
    { name: 'Womens Jeans', price: 85.00, category: 'Womens', icon: Shirt },
    { name: 'Womens Skirt', price: 55.00, category: 'Womens', icon: Shirt },
    { name: 'Womens Jacket', price: 115.00, category: 'Womens', icon: Shirt },
    { name: 'Womens Shoes', price: 75.00, category: 'Womens', icon: Shirt },
    // Kids
    { name: 'Kids Clothing Item', price: 35.00, category: 'Kids', icon: Shirt },
    { name: 'Kids Shoes', price: 45.00, category: 'Kids', icon: Shirt },
    // Accessories
    { name: 'Bag', price: 45.00, category: 'Accessories', icon: ShoppingBag },
    { name: 'Belt', price: 35.00, category: 'Accessories', icon: Shirt },
    { name: 'Hat', price: 35.00, category: 'Accessories', icon: Shirt },
    { name: 'Scarf', price: 25.00, category: 'Accessories', icon: Shirt },
    // Premium/Vintage
    { name: 'Vintage Item', price: 145.00, category: 'Premium', icon: Shirt },
    { name: 'Designer Item', price: 295.00, category: 'Premium', icon: Shirt },
    { name: 'Collectible', price: 395.00, category: 'Premium', icon: Shirt },
    // Bundles
    { name: 'Clothing Bundle (5 items)', price: 145.00, category: 'Bundles', icon: Package },
    { name: 'Mystery Bag', price: 95.00, category: 'Bundles', icon: Package },
  ],
  'tailor': [
    // Alterations
    { name: 'Trouser Hemming', price: 65.00, category: 'Alterations', icon: Scissors },
    { name: 'Trouser Tapering', price: 95.00, category: 'Alterations', icon: Scissors },
    { name: 'Shirt Hemming', price: 55.00, category: 'Alterations', icon: Scissors },
    { name: 'Dress Hemming', price: 85.00, category: 'Alterations', icon: Scissors },
    { name: 'Taking in (Sides)', price: 95.00, category: 'Alterations', icon: Scissors },
    { name: 'Letting out (Sides)', price: 115.00, category: 'Alterations', icon: Scissors },
    { name: 'Zip Replacement', price: 75.00, category: 'Alterations', icon: Scissors },
    { name: 'Button Replacement', price: 35.00, category: 'Alterations', icon: Scissors },
    // Custom Work
    { name: 'Custom Shirt', price: 695.00, category: 'Custom', icon: Shirt },
    { name: 'Custom Trousers', price: 795.00, category: 'Custom', icon: Shirt },
    { name: 'Custom Suit Jacket', price: 1495.00, category: 'Custom', icon: Shirt },
    { name: 'Custom Dress', price: 895.00, category: 'Custom', icon: Shirt },
    { name: 'Custom Skirt', price: 595.00, category: 'Custom', icon: Shirt },
    // Suit Services
    { name: 'Suit Alteration (Jacket)', price: 195.00, category: 'Suits', icon: Shirt },
    { name: 'Suit Alteration (Trousers)', price: 125.00, category: 'Suits', icon: Shirt },
    { name: 'Full Suit Alteration', price: 295.00, category: 'Suits', icon: Shirt },
    { name: 'Bespoke Suit', price: 4500.00, category: 'Suits', icon: Shirt },
    // Formal Wear
    { name: 'Wedding Dress Alteration', price: 495.00, category: 'Formal', icon: Shirt },
    { name: 'Evening Dress Alteration', price: 295.00, category: 'Formal', icon: Shirt },
    // Measurements
    { name: 'Measurement Session', price: 85.00, category: 'Consultation', icon: Scissors },
    { name: 'Fitting Session', price: 55.00, category: 'Consultation', icon: Scissors },
  ],
  'default': [
    { name: 'Clothing Item', price: 295.00, category: 'Clothing', icon: Shirt },
    { name: 'Accessory Item', price: 195.00, category: 'Accessories', icon: ShoppingBag },
    { name: 'Footwear', price: 495.00, category: 'Shoes', icon: Shirt },
  ]
}

// Default fallback SKUs
export const defaultSKUs: SKU[] = [
  { name: 'Product 1', price: 99.00, category: 'General', icon: Package },
  { name: 'Product 2', price: 149.00, category: 'General', icon: Package },
  { name: 'Product 3', price: 199.00, category: 'General', icon: Package },
]

// Main function to get SKUs
export function getSKUs(verticalId: string, subVerticalId: string): SKU[] {
  const skuMaps: Record<string, Record<string, SKU[]>> = {
    'fnb': fnbSKUs,
    'liquor': liquorSKUs,
    'grocery': grocerySKUs,
    'health-beauty': healthBeautySKUs,
    'fashion': fashionSKUs,
  }
  
  const verticalSKUs = skuMaps[verticalId]
  if (!verticalSKUs) return defaultSKUs
  
  return verticalSKUs[subVerticalId] || verticalSKUs['default'] || defaultSKUs
}

// Health & Pharmacy SKUs
export const healthPharmacySKUs: Record<string, SKU[]> = {
  'pharmacy': [
    // Prescription
    { name: 'Prescription Processing', price: 0.00, category: 'Prescription', icon: Pill },
    { name: 'Dispensing Fee', price: 35.00, category: 'Prescription', icon: Pill },
    // Pain Relief
    { name: 'Panado (20 tablets)', price: 28.90, category: 'Pain Relief', icon: Pill },
    { name: 'Grandpa Headache (20)', price: 22.90, category: 'Pain Relief', icon: Pill },
    { name: 'Nurofen (20 tablets)', price: 45.90, category: 'Pain Relief', icon: Pill },
    { name: 'Disprin (20 tablets)', price: 24.90, category: 'Pain Relief', icon: Pill },
    { name: 'Myprodol (20 capsules)', price: 52.90, category: 'Pain Relief', icon: Pill },
    // Cold & Flu
    { name: 'Corenza C (10 sachets)', price: 48.90, category: 'Cold & Flu', icon: Pill },
    { name: 'Mediclinn (10 sachets)', price: 42.90, category: 'Cold & Flu', icon: Pill },
    { name: 'Lemsip (10 sachets)', price: 45.90, category: 'Cold & Flu', icon: Pill },
    { name: 'Benylin Cough Syrup', price: 65.90, category: 'Cold & Flu', icon: Droplets },
    { name: 'Flusin (20 capsules)', price: 38.90, category: 'Cold & Flu', icon: Pill },
    // Vitamins
    { name: 'Vitamin C 1000mg (30)', price: 75.90, category: 'Vitamins', icon: Pill },
    { name: 'Vitamin D3 (60)', price: 85.90, category: 'Vitamins', icon: Pill },
    { name: 'Multivitamin (60)', price: 95.90, category: 'Vitamins', icon: Pill },
    { name: 'B-Complex (30)', price: 65.90, category: 'Vitamins', icon: Pill },
    { name: 'Iron (30)', price: 55.90, category: 'Vitamins', icon: Pill },
    { name: 'Calcium (30)', price: 72.90, category: 'Vitamins', icon: Pill },
    // Chronic Medication
    { name: 'Chronic Script Processing', price: 0.00, category: 'Chronic', icon: Pill },
    { name: 'Blood Pressure Med', price: 0.00, category: 'Chronic', icon: Pill },
    { name: 'Diabetes Med', price: 0.00, category: 'Chronic', icon: Pill },
    { name: 'Cholesterol Med', price: 0.00, category: 'Chronic', icon: Pill },
    // First Aid
    { name: 'Plasters (Box)', price: 18.90, category: 'First Aid', icon: Package },
    { name: 'Bandage (Roll)', price: 22.90, category: 'First Aid', icon: Package },
    { name: 'Antiseptic Cream', price: 35.90, category: 'First Aid', icon: Package },
    { name: 'Dettol 500ml', price: 42.90, category: 'First Aid', icon: Droplets },
    { name: 'Cotton Wool (Roll)', price: 18.90, category: 'First Aid', icon: Package },
    { name: 'Thermometer', price: 85.90, category: 'First Aid', icon: Package },
  ],
  'health-shop': [
    // Supplements
    { name: 'Whey Protein 1kg', price: 385.00, category: 'Supplements', icon: Pill },
    { name: 'Mass Gainer 1kg', price: 345.00, category: 'Supplements', icon: Pill },
    { name: 'BCAA Powder', price: 295.00, category: 'Supplements', icon: Pill },
    { name: 'Creatine 500g', price: 275.00, category: 'Supplements', icon: Pill },
    { name: 'Pre-Workout', price: 325.00, category: 'Supplements', icon: Pill },
    // Health Foods
    { name: 'Protein Bar', price: 35.00, category: 'Health Foods', icon: Cookie },
    { name: 'Energy Bar', price: 28.00, category: 'Health Foods', icon: Cookie },
    { name: 'Nuts Mix (500g)', price: 85.00, category: 'Health Foods', icon: Apple },
    { name: 'Granola (500g)', price: 65.00, category: 'Health Foods', icon: Cookie },
    { name: 'Honey (500ml)', price: 95.00, category: 'Health Foods', icon: Droplets },
    // Vitamins
    { name: 'Multivitamin (30)', price: 125.00, category: 'Vitamins', icon: Pill },
    { name: 'Vitamin C 1000mg', price: 85.00, category: 'Vitamins', icon: Pill },
    { name: 'Zinc (60)', price: 75.00, category: 'Vitamins', icon: Pill },
    { name: 'Omega 3 (60)', price: 145.00, category: 'Vitamins', icon: Pill },
    // Natural Remedies
    { name: 'Echinacea Drops', price: 95.00, category: 'Natural', icon: Droplets },
    { name: 'Arnica Cream', price: 75.00, category: 'Natural', icon: Package },
    { name: 'Tea Tree Oil', price: 65.00, category: 'Natural', icon: Droplets },
    { name: 'Lavender Oil', price: 75.00, category: 'Natural', icon: Droplets },
  ],
  'herbal-medicine': [
    // Traditional Remedies
    { name: 'African Potato Extract', price: 95.00, category: 'Traditional', icon: Droplets },
    { name: 'Sutherlandia Capsules', price: 125.00, category: 'Traditional', icon: Pill },
    { name: 'Hoodia Tablets', price: 145.00, category: 'Traditional', icon: Pill },
    { name: 'Buchu Tea', price: 55.00, category: 'Traditional', icon: Droplets },
    { name: 'Rooibos Tea (Box)', price: 45.00, category: 'Traditional', icon: Droplets },
    { name: 'Aloe Vera Juice', price: 85.00, category: 'Traditional', icon: Droplets },
    // Consultations
    { name: 'Traditional Consultation', price: 250.00, category: 'Consultation', icon: Heart },
    { name: 'Follow-up Visit', price: 150.00, category: 'Consultation', icon: Heart },
    // Herbal Teas
    { name: 'Herbal Tea Mix', price: 65.00, category: 'Teas', icon: Droplets },
    { name: 'Immune Booster Tea', price: 75.00, category: 'Teas', icon: Droplets },
    { name: 'Detox Tea', price: 85.00, category: 'Teas', icon: Droplets },
    // Custom Blends
    { name: 'Custom Herbal Mix', price: 125.00, category: 'Custom', icon: Package },
    { name: 'Immune Tincture', price: 145.00, category: 'Custom', icon: Droplets },
  ],
  'optometry': [
    // Eye Tests
    { name: 'Standard Eye Test', price: 350.00, category: 'Eye Tests', icon: Eye },
    { name: 'Contact Lens Fitting', price: 450.00, category: 'Eye Tests', icon: Eye },
    { name: 'Driver\'s License Test', price: 250.00, category: 'Eye Tests', icon: Eye },
    { name: 'Children\'s Eye Test', price: 280.00, category: 'Eye Tests', icon: Eye },
    // Frames
    { name: 'Budget Frames', price: 495.00, category: 'Frames', icon: CreditCard },
    { name: 'Standard Frames', price: 895.00, category: 'Frames', icon: CreditCard },
    { name: 'Designer Frames', price: 1950.00, category: 'Frames', icon: CreditCard },
    { name: 'Premium Designer', price: 3500.00, category: 'Frames', icon: CreditCard },
    { name: 'Sports Frames', price: 1250.00, category: 'Frames', icon: CreditCard },
    { name: 'Kids Frames', price: 450.00, category: 'Frames', icon: CreditCard },
    // Lenses
    { name: 'Standard Lenses', price: 395.00, category: 'Lenses', icon: Eye },
    { name: 'Bifocal Lenses', price: 695.00, category: 'Lenses', icon: Eye },
    { name: 'Progressive Lenses', price: 1450.00, category: 'Lenses', icon: Eye },
    { name: 'Anti-Glare Coating', price: 250.00, category: 'Lenses', icon: Eye },
    { name: 'Photochromic Lenses', price: 850.00, category: 'Lenses', icon: Eye },
    { name: 'Blue Light Filter', price: 350.00, category: 'Lenses', icon: Eye },
    // Contact Lenses
    { name: 'Monthly Lenses (Pair)', price: 195.00, category: 'Contacts', icon: Eye },
    { name: 'Daily Lenses (30 pack)', price: 395.00, category: 'Contacts', icon: Eye },
    { name: 'Colored Lenses', price: 295.00, category: 'Contacts', icon: Eye },
    { name: 'Contact Lens Solution', price: 85.00, category: 'Contacts', icon: Droplets },
    // Sunglasses
    { name: 'Prescription Sunglasses', price: 1495.00, category: 'Sunglasses', icon: CreditCard },
    { name: 'Non-Prescription Sunglasses', price: 695.00, category: 'Sunglasses', icon: CreditCard },
  ],
  'dentistry': [
    // Consultations
    { name: 'Dental Consultation', price: 450.00, category: 'Consultation', icon: Heart },
    { name: 'X-Ray (Single)', price: 180.00, category: 'Consultation', icon: Heart },
    { name: 'Panoramic X-Ray', price: 550.00, category: 'Consultation', icon: Heart },
    // Cleanings
    { name: 'Scale & Polish', price: 650.00, category: 'Hygiene', icon: Sparkles },
    { name: 'Deep Cleaning', price: 1250.00, category: 'Hygiene', icon: Sparkles },
    { name: 'Fluoride Treatment', price: 250.00, category: 'Hygiene', icon: Sparkles },
    // Fillings
    { name: 'White Filling (Small)', price: 650.00, category: 'Fillings', icon: Sparkles },
    { name: 'White Filling (Medium)', price: 850.00, category: 'Fillings', icon: Sparkles },
    { name: 'White Filling (Large)', price: 1050.00, category: 'Fillings', icon: Sparkles },
    { name: 'Amalgam Filling', price: 450.00, category: 'Fillings', icon: Sparkles },
    // Extractions
    { name: 'Simple Extraction', price: 650.00, category: 'Extractions', icon: Sparkles },
    { name: 'Surgical Extraction', price: 1450.00, category: 'Extractions', icon: Sparkles },
    { name: 'Wisdom Tooth Removal', price: 2500.00, category: 'Extractions', icon: Sparkles },
    // Root Canal
    { name: 'Root Canal (Front Tooth)', price: 2850.00, category: 'Root Canal', icon: Sparkles },
    { name: 'Root Canal (Molar)', price: 3850.00, category: 'Root Canal', icon: Sparkles },
    // Crowns & Bridges
    { name: 'Crown (Porcelain)', price: 4500.00, category: 'Crowns', icon: Sparkles },
    { name: 'Crown (Metal)', price: 3500.00, category: 'Crowns', icon: Sparkles },
    { name: 'Bridge (Per Tooth)', price: 4500.00, category: 'Crowns', icon: Sparkles },
    // Cosmetic
    { name: 'Teeth Whitening', price: 1950.00, category: 'Cosmetic', icon: Sparkles },
    { name: 'Veneer (Per Tooth)', price: 3500.00, category: 'Cosmetic', icon: Sparkles },
    // Dentures
    { name: 'Full Dentures (Upper)', price: 5500.00, category: 'Dentures', icon: Sparkles },
    { name: 'Full Dentures (Lower)', price: 5500.00, category: 'Dentures', icon: Sparkles },
    { name: 'Partial Denture', price: 3500.00, category: 'Dentures', icon: Sparkles },
  ],
  'veterinary': [
    // Consultations
    { name: 'Consultation (Dog)', price: 350.00, category: 'Consultation', icon: Heart },
    { name: 'Consultation (Cat)', price: 320.00, category: 'Consultation', icon: Heart },
    { name: 'Emergency Consultation', price: 650.00, category: 'Consultation', icon: Heart },
    // Vaccinations
    { name: 'Dog Vaccination (Rabies)', price: 180.00, category: 'Vaccinations', icon: Pill },
    { name: 'Dog Vaccination (5-in-1)', price: 250.00, category: 'Vaccinations', icon: Pill },
    { name: 'Cat Vaccination (Rabies)', price: 180.00, category: 'Vaccinations', icon: Pill },
    { name: 'Cat Vaccination (3-in-1)', price: 220.00, category: 'Vaccinations', icon: Pill },
    { name: 'Puppy Vaccination Course', price: 650.00, category: 'Vaccinations', icon: Pill },
    { name: 'Kitten Vaccination Course', price: 580.00, category: 'Vaccinations', icon: Pill },
    // Sterilization
    { name: 'Dog Sterilization (Male)', price: 950.00, category: 'Surgery', icon: Heart },
    { name: 'Dog Sterilization (Female)', price: 1250.00, category: 'Surgery', icon: Heart },
    { name: 'Cat Sterilization (Male)', price: 750.00, category: 'Surgery', icon: Heart },
    { name: 'Cat Sterilization (Female)', price: 950.00, category: 'Surgery', icon: Heart },
    // Parasite Control
    { name: 'Tick & Flea Treatment', price: 150.00, category: 'Parasites', icon: Pill },
    { name: 'Deworming (Dog)', price: 85.00, category: 'Parasites', icon: Pill },
    { name: 'Deworming (Cat)', price: 75.00, category: 'Parasites', icon: Pill },
    { name: 'Flea Collar', price: 95.00, category: 'Parasites', icon: Package },
    // Medical Treatment
    { name: 'Wound Treatment', price: 250.00, category: 'Treatment', icon: Heart },
    { name: 'Ear Cleaning', price: 180.00, category: 'Treatment', icon: Heart },
    { name: 'Nail Clipping', price: 85.00, category: 'Treatment', icon: Heart },
    { name: 'Anal Gland Expression', price: 120.00, category: 'Treatment', icon: Heart },
    // Tests
    { name: 'Blood Test', price: 450.00, category: 'Tests', icon: Heart },
    { name: 'Fecal Test', price: 180.00, category: 'Tests', icon: Heart },
    { name: 'X-Ray', price: 550.00, category: 'Tests', icon: Heart },
    // Pet Food
    { name: 'Dog Food (Small Bag)', price: 185.00, category: 'Pet Supplies', icon: Package },
    { name: 'Dog Food (Large Bag)', price: 450.00, category: 'Pet Supplies', icon: Package },
    { name: 'Cat Food (Small Bag)', price: 145.00, category: 'Pet Supplies', icon: Package },
    { name: 'Cat Food (Large Bag)', price: 385.00, category: 'Pet Supplies', icon: Package },
  ],
  'default': [
    { name: 'Consultation', price: 350.00, category: 'Consultation', icon: Heart },
    { name: 'OTC Medication', price: 45.00, category: 'Medication', icon: Pill },
    { name: 'Health Product', price: 85.00, category: 'Products', icon: Package },
  ]
}

// Hospitality SKUs
export const hospitalitySKUs: Record<string, SKU[]> = {
  'hotel': [
    // Room Types
    { name: 'Standard Room (Single)', price: 850.00, category: 'Rooms', icon: Bed },
    { name: 'Standard Room (Double)', price: 1150.00, category: 'Rooms', icon: Bed },
    { name: 'Deluxe Room (Single)', price: 1250.00, category: 'Rooms', icon: Bed },
    { name: 'Deluxe Room (Double)', price: 1550.00, category: 'Rooms', icon: Bed },
    { name: 'Suite', price: 2250.00, category: 'Rooms', icon: Bed },
    { name: 'Executive Suite', price: 3500.00, category: 'Rooms', icon: Bed },
    { name: 'Family Room', price: 1850.00, category: 'Rooms', icon: Bed },
    // Extra Person
    { name: 'Extra Person (per night)', price: 350.00, category: 'Extras', icon: Users },
    { name: 'Extra Bed', price: 250.00, category: 'Extras', icon: Bed },
    // Breakfast
    { name: 'Breakfast (Buffet)', price: 185.00, category: 'Dining', icon: Utensils },
    { name: 'Breakfast (Continental)', price: 145.00, category: 'Dining', icon: Utensils },
    { name: 'Room Service Breakfast', price: 195.00, category: 'Dining', icon: Utensils },
    // Services
    { name: 'Laundry Service', price: 150.00, category: 'Services', icon: Shirt },
    { name: 'Airport Shuttle', price: 350.00, category: 'Services', icon: Car },
    { name: 'Parking (per day)', price: 75.00, category: 'Services', icon: Car },
    { name: 'Late Checkout', price: 250.00, category: 'Services', icon: Clock },
    { name: 'Early Check-in', price: 250.00, category: 'Services', icon: Clock },
    // Wi-Fi
    { name: 'Premium Wi-Fi (Day)', price: 95.00, category: 'Services', icon: Zap },
    // Deposits
    { name: 'Room Deposit', price: 1000.00, category: 'Deposits', icon: CreditCard },
    { name: 'Incidentals Deposit', price: 500.00, category: 'Deposits', icon: CreditCard },
  ],
  'guest-house': [
    // Rooms
    { name: 'Single Room (per night)', price: 450.00, category: 'Rooms', icon: Bed },
    { name: 'Double Room (per night)', price: 650.00, category: 'Rooms', icon: Bed },
    { name: 'Twin Room (per night)', price: 650.00, category: 'Rooms', icon: Bed },
    { name: 'Family Room (per night)', price: 850.00, category: 'Rooms', icon: Bed },
    // Weekly/Monthly
    { name: 'Weekly Rate (Single)', price: 2800.00, category: 'Long Stay', icon: Bed },
    { name: 'Weekly Rate (Double)', price: 4200.00, category: 'Long Stay', icon: Bed },
    { name: 'Monthly Rate (Single)', price: 9500.00, category: 'Long Stay', icon: Bed },
    // Meals
    { name: 'Breakfast (Full English)', price: 85.00, category: 'Meals', icon: Utensils },
    { name: 'Breakfast (Continental)', price: 65.00, category: 'Meals', icon: Utensils },
    { name: 'Dinner', price: 145.00, category: 'Meals', icon: Utensils },
    // Extras
    { name: 'Extra Person', price: 200.00, category: 'Extras', icon: Users },
    { name: 'Laundry', price: 75.00, category: 'Extras', icon: Shirt },
    { name: 'Parking', price: 35.00, category: 'Extras', icon: Car },
    // Services
    { name: 'Airport Pickup', price: 250.00, category: 'Services', icon: Car },
    { name: 'Transfer', price: 150.00, category: 'Services', icon: Car },
  ],
  'bnb': [
    // Rooms
    { name: 'Room (per night)', price: 550.00, category: 'Rooms', icon: Bed },
    { name: 'Room with En-suite', price: 750.00, category: 'Rooms', icon: Bed },
    { name: 'Private Room', price: 650.00, category: 'Rooms', icon: Bed },
    // Meals
    { name: 'Breakfast (included)', price: 0.00, category: 'Meals', icon: Utensils },
    { name: 'Extra Breakfast', price: 65.00, category: 'Meals', icon: Utensils },
    // Services
    { name: 'Late Checkout', price: 150.00, category: 'Services', icon: Clock },
    { name: 'Early Check-in', price: 150.00, category: 'Services', icon: Clock },
    { name: 'Luggage Storage', price: 50.00, category: 'Services', icon: Package },
    { name: 'Wifi', price: 0.00, category: 'Services', icon: Zap },
  ],
  'backpackers': [
    // Dorm Beds
    { name: 'Dorm Bed (4-bed)', price: 185.00, category: 'Dorms', icon: Bed },
    { name: 'Dorm Bed (6-bed)', price: 165.00, category: 'Dorms', icon: Bed },
    { name: 'Dorm Bed (8-bed)', price: 145.00, category: 'Dorms', icon: Bed },
    { name: 'Female Only Dorm', price: 195.00, category: 'Dorms', icon: Bed },
    // Private Rooms
    { name: 'Private Single', price: 350.00, category: 'Private', icon: Bed },
    { name: 'Private Double', price: 550.00, category: 'Private', icon: Bed },
    { name: 'Private Twin', price: 550.00, category: 'Private', icon: Bed },
    // Services
    { name: 'Breakfast', price: 65.00, category: 'Services', icon: Utensils },
    { name: 'Wifi', price: 0.00, category: 'Services', icon: Zap },
    { name: 'Locker Rental', price: 25.00, category: 'Services', icon: Package },
    { name: 'Towel Rental', price: 15.00, category: 'Services', icon: Package },
    // Activities
    { name: 'Walking Tour', price: 125.00, category: 'Activities', icon: Users },
    { name: 'Pub Crawl', price: 175.00, category: 'Activities', icon: Beer },
    { name: 'Game Drive', price: 450.00, category: 'Activities', icon: Users },
    // Laundry
    { name: 'Laundry (per load)', price: 45.00, category: 'Services', icon: Shirt },
  ],
  'lodge': [
    // Accommodation
    { name: 'Standard Chalet (per night)', price: 1250.00, category: 'Accommodation', icon: Bed },
    { name: 'Deluxe Chalet (per night)', price: 1850.00, category: 'Accommodation', icon: Bed },
    { name: 'Family Chalet (per night)', price: 2250.00, category: 'Accommodation', icon: Bed },
    { name: 'Luxury Suite (per night)', price: 3500.00, category: 'Accommodation', icon: Bed },
    // Packages
    { name: 'Full Board (per person)', price: 1850.00, category: 'Packages', icon: Utensils },
    { name: 'Half Board (per person)', price: 1250.00, category: 'Packages', icon: Utensils },
    { name: 'Bed & Breakfast (per person)', price: 950.00, category: 'Packages', icon: Utensils },
    // Activities
    { name: 'Game Drive (Morning)', price: 450.00, category: 'Activities', icon: Users },
    { name: 'Game Drive (Evening)', price: 550.00, category: 'Activities', icon: Users },
    { name: 'Bush Walk', price: 350.00, category: 'Activities', icon: Users },
    { name: 'Bird Watching', price: 250.00, category: 'Activities', icon: Users },
    // Transfers
    { name: 'Airport Transfer', price: 650.00, category: 'Transfers', icon: Car },
    { name: 'Shuttle to Town', price: 250.00, category: 'Transfers', icon: Car },
  ],
  'self-catering': [
    // Units
    { name: 'Studio (per night)', price: 550.00, category: 'Units', icon: Home },
    { name: 'One Bedroom (per night)', price: 750.00, category: 'Units', icon: Home },
    { name: 'Two Bedroom (per night)', price: 950.00, category: 'Units', icon: Home },
    { name: 'Three Bedroom (per night)', price: 1250.00, category: 'Units', icon: Home },
    { name: 'Holiday House (per night)', price: 1850.00, category: 'Units', icon: Home },
    // Weekly/Monthly
    { name: 'Weekly Rate', price: 4500.00, category: 'Long Stay', icon: Home },
    { name: 'Monthly Rate', price: 12500.00, category: 'Long Stay', icon: Home },
    // Fees
    { name: 'Cleaning Fee', price: 250.00, category: 'Fees', icon: Home },
    { name: 'Security Deposit', price: 1500.00, category: 'Fees', icon: CreditCard },
    // Services
    { name: 'Extra Cleaning', price: 150.00, category: 'Services', icon: Home },
    { name: 'Linen Change', price: 85.00, category: 'Services', icon: Home },
    { name: 'Late Checkout', price: 200.00, category: 'Services', icon: Clock },
  ],
  'airbnb-style': [
    // Nights
    { name: 'Nightly Rate', price: 650.00, category: 'Booking', icon: Home },
    { name: 'Weekend Rate (Fri/Sat)', price: 850.00, category: 'Booking', icon: Home },
    // Fees
    { name: 'Cleaning Fee', price: 350.00, category: 'Fees', icon: Home },
    { name: 'Service Fee', price: 150.00, category: 'Fees', icon: CreditCard },
    { name: 'Security Deposit', price: 2000.00, category: 'Fees', icon: CreditCard },
    // Services
    { name: 'Early Check-in', price: 150.00, category: 'Services', icon: Clock },
    { name: 'Late Checkout', price: 200.00, category: 'Services', icon: Clock },
    { name: 'Luggage Storage', price: 75.00, category: 'Services', icon: Package },
    // Extras
    { name: 'Extra Guest', price: 150.00, category: 'Extras', icon: Users },
    { name: 'Pet Fee', price: 250.00, category: 'Extras', icon: Heart },
    { name: 'Parking', price: 50.00, category: 'Extras', icon: Car },
  ],
  'default': [
    { name: 'Room (per night)', price: 650.00, category: 'Accommodation', icon: Bed },
    { name: 'Breakfast', price: 85.00, category: 'Meals', icon: Utensils },
    { name: 'Extra Service', price: 150.00, category: 'Services', icon: Sparkles },
  ]
}

// Hardware & Building SKUs
export const hardwareSKUs: Record<string, SKU[]> = {
  'hardware-store': [
    // Tools
    { name: 'Claw Hammer', price: 125.00, category: 'Tools', icon: Wrench },
    { name: 'Screwdriver Set', price: 145.00, category: 'Tools', icon: Wrench },
    { name: 'Adjustable Wrench', price: 95.00, category: 'Tools', icon: Wrench },
    { name: 'Spirit Level', price: 85.00, category: 'Tools', icon: Wrench },
    { name: 'Tape Measure (5m)', price: 65.00, category: 'Tools', icon: Wrench },
    { name: 'Utility Knife', price: 45.00, category: 'Tools', icon: Wrench },
    { name: 'Hacksaw', price: 85.00, category: 'Tools', icon: Wrench },
    { name: 'Drill Bit Set', price: 185.00, category: 'Tools', icon: Wrench },
    { name: 'Pliers Set', price: 125.00, category: 'Tools', icon: Wrench },
    // Fasteners
    { name: 'Screws (Box 100)', price: 45.00, category: 'Fasteners', icon: Package },
    { name: 'Nails 50mm (1kg)', price: 35.00, category: 'Fasteners', icon: Package },
    { name: 'Wall Plugs (Box 100)', price: 35.00, category: 'Fasteners', icon: Package },
    { name: 'Bolts & Nuts Set', price: 85.00, category: 'Fasteners', icon: Package },
    { name: 'Cable Ties (100)', price: 25.00, category: 'Fasteners', icon: Package },
    // Paint Supplies
    { name: 'Paint Brush (50mm)', price: 35.00, category: 'Paint', icon: Paintbrush },
    { name: 'Paint Roller', price: 55.00, category: 'Paint', icon: Paintbrush },
    { name: 'Paint Tray', price: 45.00, category: 'Paint', icon: Paintbrush },
    { name: 'Masking Tape', price: 25.00, category: 'Paint', icon: Package },
    { name: 'Sandpaper (Pack)', price: 35.00, category: 'Paint', icon: Package },
    // Electrical
    { name: 'Extension Lead (10m)', price: 145.00, category: 'Electrical', icon: Lightbulb },
    { name: 'Plug Top', price: 25.00, category: 'Electrical', icon: Lightbulb },
    { name: 'Light Bulb (LED)', price: 65.00, category: 'Electrical', icon: Lightbulb },
    { name: 'Double Socket', price: 45.00, category: 'Electrical', icon: Lightbulb },
    { name: 'Switch', price: 35.00, category: 'Electrical', icon: Lightbulb },
    { name: 'Lamp Holder', price: 28.00, category: 'Electrical', icon: Lightbulb },
    // Plumbing
    { name: 'Tap (Basin)', price: 145.00, category: 'Plumbing', icon: Droplets },
    { name: 'Tap (Kitchen)', price: 195.00, category: 'Plumbing', icon: Droplets },
    { name: 'PVC Pipe (1m)', price: 25.00, category: 'Plumbing', icon: Droplets },
    { name: 'PVC Fittings Set', price: 45.00, category: 'Plumbing', icon: Droplets },
    { name: 'PTFE Tape', price: 15.00, category: 'Plumbing', icon: Package },
    // Adhesives
    { name: 'PVA Glue (500ml)', price: 45.00, category: 'Adhesives', icon: Package },
    { name: 'Wood Glue (500ml)', price: 55.00, category: 'Adhesives', icon: Package },
    { name: 'Super Glue', price: 25.00, category: 'Adhesives', icon: Package },
    { name: 'Silicone Sealant', price: 65.00, category: 'Adhesives', icon: Package },
    { name: 'Contact Adhesive', price: 55.00, category: 'Adhesives', icon: Package },
    // Safety
    { name: 'Safety Goggles', price: 45.00, category: 'Safety', icon: Package },
    { name: 'Work Gloves', price: 35.00, category: 'Safety', icon: Package },
    { name: 'Dust Mask (Box 10)', price: 45.00, category: 'Safety', icon: Package },
    { name: 'Ear Plugs', price: 25.00, category: 'Safety', icon: Package },
  ],
  'building-supplies': [
    // Cement
    { name: 'Cement (50kg)', price: 125.00, category: 'Cement', icon: Package },
    { name: 'Cement (32.5R)', price: 145.00, category: 'Cement', icon: Package },
    { name: 'Building Sand (ton)', price: 450.00, category: 'Aggregates', icon: Package },
    { name: 'Stone (ton)', price: 550.00, category: 'Aggregates', icon: Package },
    { name: 'Crusher Dust (ton)', price: 400.00, category: 'Aggregates', icon: Package },
    // Bricks & Blocks
    { name: 'Stock Bricks (per 1000)', price: 1850.00, category: 'Bricks', icon: Package },
    { name: 'Maxi Bricks (per 1000)', price: 2250.00, category: 'Bricks', icon: Package },
    { name: 'Cement Blocks (per m²)', price: 450.00, category: 'Bricks', icon: Package },
    { name: 'Paving Bricks (per m²)', price: 125.00, category: 'Bricks', icon: Package },
    // Steel
    { name: 'Rebar (Y10 - per meter)', price: 35.00, category: 'Steel', icon: Package },
    { name: 'Rebar (Y12 - per meter)', price: 45.00, category: 'Steel', icon: Package },
    { name: 'Angle Iron (per meter)', price: 125.00, category: 'Steel', icon: Package },
    { name: 'Square Tubing (per meter)', price: 145.00, category: 'Steel', icon: Package },
    // Roofing
    { name: 'Roof Sheets (per m²)', price: 145.00, category: 'Roofing', icon: Home },
    { name: 'IBR Sheets (per m²)', price: 165.00, category: 'Roofing', icon: Home },
    { name: 'Roof Nails (1kg)', price: 55.00, category: 'Roofing', icon: Package },
    { name: 'Gutters (per meter)', price: 85.00, category: 'Roofing', icon: Home },
    // Timber
    { name: 'Pine Plank (per meter)', price: 45.00, category: 'Timber', icon: Package },
    { name: 'Plywood Sheet', price: 285.00, category: 'Timber', icon: Package },
    { name: 'Chipboard Sheet', price: 195.00, category: 'Timber', icon: Package },
    { name: 'Roof Battens (per meter)', price: 25.00, category: 'Timber', icon: Package },
    // Damp Proofing
    { name: 'DPC (per roll)', price: 185.00, category: 'Waterproofing', icon: Package },
    { name: 'Waterproofing (20L)', price: 485.00, category: 'Waterproofing', icon: Package },
    // Delivery
    { name: 'Delivery (Local)', price: 250.00, category: 'Services', icon: Car },
    { name: 'Delivery (Long Distance)', price: 650.00, category: 'Services', icon: Car },
  ],
  'paint-shop': [
    // Interior Paint
    { name: 'White Paint (5L)', price: 285.00, category: 'Interior', icon: Paintbrush },
    { name: 'Color Paint (5L)', price: 345.00, category: 'Interior', icon: Paintbrush },
    { name: 'Ceiling Paint (5L)', price: 245.00, category: 'Interior', icon: Paintbrush },
    { name: 'Primer (5L)', price: 265.00, category: 'Interior', icon: Paintbrush },
    { name: 'Undercoat (5L)', price: 245.00, category: 'Interior', icon: Paintbrush },
    // Exterior Paint
    { name: 'Exterior Paint (5L)', price: 395.00, category: 'Exterior', icon: Paintbrush },
    { name: 'Paving Paint (5L)', price: 425.00, category: 'Exterior', icon: Paintbrush },
    { name: 'Roof Paint (5L)', price: 385.00, category: 'Exterior', icon: Paintbrush },
    { name: 'Waterproofing Paint (5L)', price: 445.00, category: 'Exterior', icon: Paintbrush },
    // Wood Finishes
    { name: 'Varnish (1L)', price: 145.00, category: 'Wood', icon: Paintbrush },
    { name: 'Wood Stain (1L)', price: 125.00, category: 'Wood', icon: Paintbrush },
    { name: 'Wood Preservative (5L)', price: 285.00, category: 'Wood', icon: Paintbrush },
    { name: 'Deck Oil (5L)', price: 345.00, category: 'Wood', icon: Paintbrush },
    // Special Finishes
    { name: 'Spray Paint (400ml)', price: 65.00, category: 'Specialty', icon: Paintbrush },
    { name: 'Metal Paint (1L)', price: 125.00, category: 'Specialty', icon: Paintbrush },
    { name: 'Rust Converter (500ml)', price: 85.00, category: 'Specialty', icon: Paintbrush },
    { name: 'Heat Resistant Paint', price: 185.00, category: 'Specialty', icon: Paintbrush },
    // Tools
    { name: 'Paint Brush Set', price: 125.00, category: 'Tools', icon: Paintbrush },
    { name: 'Roller Kit', price: 145.00, category: 'Tools', icon: Paintbrush },
    { name: 'Paint Tray', price: 35.00, category: 'Tools', icon: Paintbrush },
    // Services
    { name: 'Color Matching', price: 45.00, category: 'Services', icon: Sparkles },
    { name: 'Custom Mixing', price: 65.00, category: 'Services', icon: Sparkles },
  ],
  'plumbing': [
    // Pipes
    { name: 'PVC Pipe 50mm (per m)', price: 35.00, category: 'Pipes', icon: Droplets },
    { name: 'PVC Pipe 110mm (per m)', price: 65.00, category: 'Pipes', icon: Droplets },
    { name: 'Copper Pipe 15mm (per m)', price: 85.00, category: 'Pipes', icon: Droplets },
    { name: 'Copper Pipe 22mm (per m)', price: 125.00, category: 'Pipes', icon: Droplets },
    { name: 'PEX Pipe (per m)', price: 25.00, category: 'Pipes', icon: Droplets },
    { name: 'HDPE Pipe (per m)', price: 45.00, category: 'Pipes', icon: Droplets },
    // Fittings
    { name: 'PVC Fittings (Assorted)', price: 125.00, category: 'Fittings', icon: Droplets },
    { name: 'Copper Fittings (Pack)', price: 85.00, category: 'Fittings', icon: Droplets },
    { name: 'Compression Fittings', price: 45.00, category: 'Fittings', icon: Droplets },
    { name: 'Push-fit Fittings', price: 55.00, category: 'Fittings', icon: Droplets },
    // Taps & Mixers
    { name: 'Basin Tap', price: 145.00, category: 'Taps', icon: Droplets },
    { name: 'Kitchen Mixer', price: 295.00, category: 'Taps', icon: Droplets },
    { name: 'Bath Mixer', price: 395.00, category: 'Taps', icon: Droplets },
    { name: 'Shower Mixer', price: 450.00, category: 'Taps', icon: Droplets },
    { name: 'Outdoor Tap', price: 85.00, category: 'Taps', icon: Droplets },
    // Geysers
    { name: 'Geyser 100L', price: 3500.00, category: 'Geysers', icon: Droplets },
    { name: 'Geyser 150L', price: 4200.00, category: 'Geysers', icon: Droplets },
    { name: 'Geyser 200L', price: 4950.00, category: 'Geysers', icon: Droplets },
    { name: 'Geyser Element', price: 285.00, category: 'Geysers', icon: Droplets },
    { name: 'Geyser Thermostat', price: 185.00, category: 'Geysers', icon: Droplets },
    // Toilets
    { name: 'Toilet Suite (Complete)', price: 1850.00, category: 'Sanitary', icon: Droplets },
    { name: 'Toilet Cistern', price: 650.00, category: 'Sanitary', icon: Droplets },
    { name: 'Toilet Seat', price: 145.00, category: 'Sanitary', icon: Droplets },
    { name: 'Toilet Flush Valve', price: 185.00, category: 'Sanitary', icon: Droplets },
    // Drainage
    { name: 'Gully Trap', price: 145.00, category: 'Drainage', icon: Droplets },
    { name: 'Floor Drain', price: 125.00, category: 'Drainage', icon: Droplets },
    { name: 'Drain Rods (Set)', price: 185.00, category: 'Drainage', icon: Droplets },
    // Consumables
    { name: 'PTFE Tape (Roll)', price: 12.00, category: 'Consumables', icon: Package },
    { name: 'Hemp (Roll)', price: 25.00, category: 'Consumables', icon: Package },
    { name: 'Plumbers Putty', price: 35.00, category: 'Consumables', icon: Package },
    { name: 'Silicone (Tube)', price: 55.00, category: 'Consumables', icon: Package },
  ],
  'electrical': [
    // Cables
    { name: 'Twin & Earth 2.5mm (per m)', price: 18.00, category: 'Cables', icon: Lightbulb },
    { name: 'Twin & Earth 4mm (per m)', price: 28.00, category: 'Cables', icon: Lightbulb },
    { name: 'Twin & Earth 6mm (per m)', price: 42.00, category: 'Cables', icon: Lightbulb },
    { name: 'Surfix Cable (per m)', price: 22.00, category: 'Cables', icon: Lightbulb },
    { name: 'Armoured Cable (per m)', price: 85.00, category: 'Cables', icon: Lightbulb },
    // Switches & Sockets
    { name: 'Switch (Single)', price: 35.00, category: 'Switches', icon: Lightbulb },
    { name: 'Switch (Double)', price: 45.00, category: 'Switches', icon: Lightbulb },
    { name: 'Dimmer Switch', price: 125.00, category: 'Switches', icon: Lightbulb },
    { name: 'Socket (Single)', price: 45.00, category: 'Sockets', icon: Lightbulb },
    { name: 'Socket (Double)', price: 65.00, category: 'Sockets', icon: Lightbulb },
    { name: 'USB Socket', price: 145.00, category: 'Sockets', icon: Lightbulb },
    // Distribution
    { name: 'DB Board (8-way)', price: 285.00, category: 'Distribution', icon: Lightbulb },
    { name: 'DB Board (12-way)', price: 385.00, category: 'Distribution', icon: Lightbulb },
    { name: 'Circuit Breaker (Single)', price: 55.00, category: 'Distribution', icon: Lightbulb },
    { name: 'Earth Leakage', price: 185.00, category: 'Distribution', icon: Lightbulb },
    { name: 'Surge Protection', price: 385.00, category: 'Distribution', icon: Lightbulb },
    // Lighting
    { name: 'Downlight LED', price: 85.00, category: 'Lighting', icon: Lightbulb },
    { name: 'Ceiling Rose', price: 25.00, category: 'Lighting', icon: Lightbulb },
    { name: 'Batten Holder', price: 28.00, category: 'Lighting', icon: Lightbulb },
    { name: 'Outdoor Light', price: 185.00, category: 'Lighting', icon: Lightbulb },
    { name: 'Motion Sensor', price: 145.00, category: 'Lighting', icon: Lightbulb },
    // Conduits
    { name: 'Conduit 20mm (per m)', price: 12.00, category: 'Conduits', icon: Lightbulb },
    { name: 'Conduit 25mm (per m)', price: 15.00, category: 'Conduits', icon: Lightbulb },
    { name: 'Conduit Fittings (Pack)', price: 45.00, category: 'Conduits', icon: Lightbulb },
    { name: 'Conduit Boxes', price: 25.00, category: 'Conduits', icon: Lightbulb },
    // Safety
    { name: 'Isolator Switch', price: 125.00, category: 'Safety', icon: Lightbulb },
    { name: 'Generator Changeover', price: 285.00, category: 'Safety', icon: Lightbulb },
    { name: 'Surge Plug', price: 145.00, category: 'Safety', icon: Lightbulb },
  ],
  'agri-supply': [
    // Animal Feed
    { name: 'Cattle Feed (50kg)', price: 385.00, category: 'Feed', icon: Package },
    { name: 'Chicken Feed (50kg)', price: 285.00, category: 'Feed', icon: Package },
    { name: 'Pig Feed (50kg)', price: 325.00, category: 'Feed', icon: Package },
    { name: 'Horse Feed (50kg)', price: 425.00, category: 'Feed', icon: Package },
    { name: 'Dog Food (25kg)', price: 345.00, category: 'Feed', icon: Package },
    { name: 'Layer Mash (50kg)', price: 265.00, category: 'Feed', icon: Package },
    // Seeds
    { name: 'Maize Seed (10kg)', price: 485.00, category: 'Seeds', icon: Apple },
    { name: 'Sunflower Seed (5kg)', price: 285.00, category: 'Seeds', icon: Apple },
    { name: 'Vegetable Seeds (Assorted)', price: 45.00, category: 'Seeds', icon: Apple },
    { name: 'Grass Seed (1kg)', price: 125.00, category: 'Seeds', icon: Apple },
    // Fertilizer
    { name: 'NPK Fertilizer (50kg)', price: 425.00, category: 'Fertilizer', icon: Package },
    { name: 'Lime (50kg)', price: 185.00, category: 'Fertilizer', icon: Package },
    { name: 'Urea (50kg)', price: 385.00, category: 'Fertilizer', icon: Package },
    { name: 'Organic Compost (50kg)', price: 125.00, category: 'Fertilizer', icon: Package },
    // Tools
    { name: 'Spade', price: 185.00, category: 'Tools', icon: Wrench },
    { name: 'Fork', price: 165.00, category: 'Tools', icon: Wrench },
    { name: 'Rake', price: 145.00, category: 'Tools', icon: Wrench },
    { name: 'Hoe', price: 125.00, category: 'Tools', icon: Wrench },
    { name: 'Wheelbarrow', price: 485.00, category: 'Tools', icon: Wrench },
    // Fencing
    { name: 'Fencing Wire (Roll)', price: 685.00, category: 'Fencing', icon: Package },
    { name: 'Fencing Posts (per 10)', price: 285.00, category: 'Fencing', icon: Package },
    { name: 'Chicken Wire (Roll)', price: 285.00, category: 'Fencing', icon: Package },
    { name: 'Gates', price: 1250.00, category: 'Fencing', icon: Package },
    // Irrigation
    { name: 'Irrigation Pipe (per m)', price: 25.00, category: 'Irrigation', icon: Droplets },
    { name: 'Sprinkler', price: 85.00, category: 'Irrigation', icon: Droplets },
    { name: 'Water Pump', price: 1850.00, category: 'Irrigation', icon: Droplets },
    { name: 'Water Tank (5000L)', price: 3850.00, category: 'Irrigation', icon: Droplets },
    // Animal Health
    { name: 'Dip (5L)', price: 285.00, category: 'Health', icon: Droplets },
    { name: 'Dewormer', price: 125.00, category: 'Health', icon: Pill },
    { name: 'Vitamins (500ml)', price: 145.00, category: 'Health', icon: Droplets },
  ],
  'default': [
    { name: 'Hardware Item', price: 85.00, category: 'General', icon: Wrench },
    { name: 'Tool', price: 145.00, category: 'Tools', icon: Wrench },
    { name: 'Building Material', price: 195.00, category: 'Materials', icon: Package },
  ]
}

// Electronics & Tech SKUs
export const electronicsSKUs: Record<string, SKU[]> = {
  'phone-accessories': [
    // Phone Accessories
    { name: 'Phone Case (Generic)', price: 85.00, category: 'Cases', icon: Smartphone },
    { name: 'Phone Case (Branded)', price: 145.00, category: 'Cases', icon: Smartphone },
    { name: 'Screen Protector', price: 65.00, category: 'Protection', icon: Smartphone },
    { name: 'Tempered Glass', price: 95.00, category: 'Protection', icon: Smartphone },
    // Chargers
    { name: 'USB Cable (Type-C)', price: 65.00, category: 'Chargers', icon: Zap },
    { name: 'USB Cable (Lightning)', price: 85.00, category: 'Chargers', icon: Zap },
    { name: 'Wall Charger', price: 125.00, category: 'Chargers', icon: Zap },
    { name: 'Car Charger', price: 145.00, category: 'Chargers', icon: Zap },
    { name: 'Wireless Charger', price: 285.00, category: 'Chargers', icon: Zap },
    { name: 'Power Bank (10000mAh)', price: 295.00, category: 'Chargers', icon: Zap },
    { name: 'Power Bank (20000mAh)', price: 425.00, category: 'Chargers', icon: Zap },
    // Audio
    { name: 'Wired Earphones', price: 85.00, category: 'Audio', icon: Headphones },
    { name: 'Wireless Earbuds', price: 295.00, category: 'Audio', icon: Headphones },
    { name: 'Premium Earbuds', price: 895.00, category: 'Audio', icon: Headphones },
    { name: 'Bluetooth Speaker', price: 345.00, category: 'Audio', icon: Headphones },
    // Phone Stands
    { name: 'Phone Stand', price: 65.00, category: 'Stands', icon: Smartphone },
    { name: 'Car Phone Holder', price: 95.00, category: 'Stands', icon: Smartphone },
    { name: 'Desk Stand', price: 125.00, category: 'Stands', icon: Smartphone },
    // Repairs
    { name: 'Screen Repair Quote', price: 0.00, category: 'Repairs', icon: Wrench },
    { name: 'Battery Replacement', price: 450.00, category: 'Repairs', icon: Wrench },
    { name: 'Charging Port Repair', price: 250.00, category: 'Repairs', icon: Wrench },
    // Trade-in
    { name: 'Trade-in Evaluation', price: 0.00, category: 'Trade-in', icon: CreditCard },
  ],
  'computer-it': [
    // Laptops
    { name: 'Budget Laptop', price: 6500.00, category: 'Laptops', icon: Monitor },
    { name: 'Business Laptop', price: 12500.00, category: 'Laptops', icon: Monitor },
    { name: 'Gaming Laptop', price: 22500.00, category: 'Laptops', icon: Monitor },
    // Desktops
    { name: 'Desktop PC (Basic)', price: 5500.00, category: 'Desktops', icon: Monitor },
    { name: 'Desktop PC (Office)', price: 8500.00, category: 'Desktops', icon: Monitor },
    { name: 'Gaming PC', price: 18500.00, category: 'Desktops', icon: Monitor },
    // Monitors
    { name: 'Monitor 21.5"', price: 1850.00, category: 'Monitors', icon: Monitor },
    { name: 'Monitor 24"', price: 2450.00, category: 'Monitors', icon: Monitor },
    { name: 'Monitor 27"', price: 3250.00, category: 'Monitors', icon: Monitor },
    { name: 'Gaming Monitor', price: 4850.00, category: 'Monitors', icon: Monitor },
    // Peripherals
    { name: 'Keyboard (Basic)', price: 145.00, category: 'Peripherals', icon: Wrench },
    { name: 'Keyboard (Gaming)', price: 695.00, category: 'Peripherals', icon: Wrench },
    { name: 'Mouse (Basic)', price: 95.00, category: 'Peripherals', icon: Wrench },
    { name: 'Mouse (Gaming)', price: 495.00, category: 'Peripherals', icon: Wrench },
    { name: 'Webcam', price: 445.00, category: 'Peripherals', icon: Monitor },
    // Storage
    { name: 'USB Flash Drive 32GB', price: 95.00, category: 'Storage', icon: Package },
    { name: 'USB Flash Drive 64GB', price: 145.00, category: 'Storage', icon: Package },
    { name: 'External HDD 1TB', price: 895.00, category: 'Storage', icon: Package },
    { name: 'External SSD 500GB', price: 1250.00, category: 'Storage', icon: Package },
    // Networking
    { name: 'WiFi Router', price: 695.00, category: 'Networking', icon: Zap },
    { name: 'Network Cable (5m)', price: 85.00, category: 'Networking', icon: Zap },
    { name: 'Network Switch', price: 345.00, category: 'Networking', icon: Zap },
    // Services
    { name: 'PC Service', price: 450.00, category: 'Services', icon: Wrench },
    { name: 'Virus Removal', price: 350.00, category: 'Services', icon: Wrench },
    { name: 'Data Recovery', price: 850.00, category: 'Services', icon: Wrench },
    { name: 'OS Installation', price: 450.00, category: 'Services', icon: Wrench },
  ],
  'electronics-retail': [
    // TVs
    { name: 'TV 32"', price: 2950.00, category: 'Televisions', icon: Monitor },
    { name: 'TV 43"', price: 4450.00, category: 'Televisions', icon: Monitor },
    { name: 'TV 55"', price: 7950.00, category: 'Televisions', icon: Monitor },
    { name: 'TV 65"', price: 12500.00, category: 'Televisions', icon: Monitor },
    { name: 'Smart TV 50"', price: 6500.00, category: 'Televisions', icon: Monitor },
    // Audio
    { name: 'Bluetooth Speaker', price: 495.00, category: 'Audio', icon: Headphones },
    { name: 'Soundbar', price: 1450.00, category: 'Audio', icon: Headphones },
    { name: 'Home Theater System', price: 3500.00, category: 'Audio', icon: Headphones },
    { name: 'Hi-Fi System', price: 2850.00, category: 'Audio', icon: Headphones },
    // Gaming
    { name: 'Gaming Console', price: 6500.00, category: 'Gaming', icon: Gamepad2 },
    { name: 'Gaming Headset', price: 595.00, category: 'Gaming', icon: Gamepad2 },
    { name: 'Gaming Controller', price: 695.00, category: 'Gaming', icon: Gamepad2 },
    { name: 'Game Title', price: 795.00, category: 'Gaming', icon: Gamepad2 },
    // Appliances
    { name: 'Microwave', price: 1250.00, category: 'Appliances', icon: Home },
    { name: 'Kettle', price: 295.00, category: 'Appliances', icon: Home },
    { name: 'Toaster', price: 245.00, category: 'Appliances', icon: Home },
    { name: 'Iron', price: 345.00, category: 'Appliances', icon: Home },
    { name: 'Hair Dryer', price: 395.00, category: 'Appliances', icon: Home },
    // Cameras
    { name: 'Digital Camera', price: 4500.00, category: 'Cameras', icon: Package },
    { name: 'Action Camera', price: 2850.00, category: 'Cameras', icon: Package },
    { name: 'Drone', price: 5500.00, category: 'Cameras', icon: Package },
    // Services
    { name: 'TV Installation', price: 450.00, category: 'Services', icon: Wrench },
    { name: 'Wall Mounting', price: 350.00, category: 'Services', icon: Wrench },
    { name: 'Extended Warranty', price: 495.00, category: 'Services', icon: Shield },
  ],
  'repair-workshop': [
    // Phone Repairs
    { name: 'Screen Repair (Basic)', price: 650.00, category: 'Phone Repairs', icon: Wrench },
    { name: 'Screen Repair (Premium)', price: 1250.00, category: 'Phone Repairs', icon: Wrench },
    { name: 'Battery Replacement', price: 350.00, category: 'Phone Repairs', icon: Wrench },
    { name: 'Charging Port Repair', price: 250.00, category: 'Phone Repairs', icon: Wrench },
    { name: 'Water Damage Assessment', price: 150.00, category: 'Phone Repairs', icon: Wrench },
    { name: 'Speaker Repair', price: 200.00, category: 'Phone Repairs', icon: Wrench },
    // Laptop Repairs
    { name: 'Laptop Screen Repair', price: 1850.00, category: 'Laptop Repairs', icon: Wrench },
    { name: 'Keyboard Replacement', price: 650.00, category: 'Laptop Repairs', icon: Wrench },
    { name: 'Laptop Battery', price: 850.00, category: 'Laptop Repairs', icon: Wrench },
    { name: 'Hard Drive Replacement', price: 950.00, category: 'Laptop Repairs', icon: Wrench },
    { name: 'RAM Upgrade', price: 450.00, category: 'Laptop Repairs', icon: Wrench },
    // PC Repairs
    { name: 'PC Diagnostic', price: 250.00, category: 'PC Repairs', icon: Wrench },
    { name: 'Virus Removal', price: 350.00, category: 'PC Repairs', icon: Wrench },
    { name: 'OS Reinstall', price: 450.00, category: 'PC Repairs', icon: Wrench },
    { name: 'Hardware Upgrade', price: 350.00, category: 'PC Repairs', icon: Wrench },
    { name: 'Power Supply Replacement', price: 650.00, category: 'PC Repairs', icon: Wrench },
    // TV Repairs
    { name: 'TV Diagnostic', price: 350.00, category: 'TV Repairs', icon: Wrench },
    { name: 'TV Screen Repair Quote', price: 0.00, category: 'TV Repairs', icon: Wrench },
    { name: 'TV Mainboard Repair', price: 1250.00, category: 'TV Repairs', icon: Wrench },
    // Console Repairs
    { name: 'Console Repair', price: 650.00, category: 'Console Repairs', icon: Gamepad2 },
    { name: 'Controller Repair', price: 250.00, category: 'Console Repairs', icon: Gamepad2 },
    // Parts
    { name: 'Phone Screen (Generic)', price: 285.00, category: 'Parts', icon: Smartphone },
    { name: 'Phone Battery', price: 145.00, category: 'Parts', icon: Zap },
    { name: 'Charging Port', price: 65.00, category: 'Parts', icon: Zap },
    // Services
    { name: 'Labor (per hour)', price: 250.00, category: 'Labor', icon: Wrench },
    { name: 'Diagnostic Fee', price: 150.00, category: 'Labor', icon: Wrench },
    { name: 'Data Backup', price: 250.00, category: 'Labor', icon: Package },
  ],
  'default': [
    { name: 'Electronic Device', price: 995.00, category: 'Electronics', icon: Monitor },
    { name: 'Accessory', price: 145.00, category: 'Accessories', icon: Smartphone },
    { name: 'Repair Service', price: 250.00, category: 'Repairs', icon: Wrench },
  ]
}

// Sport & Leisure SKUs
export const sportLeisureSKUs: Record<string, SKU[]> = {
  'gym': [
    // Memberships
    { name: 'Monthly Membership', price: 395.00, category: 'Memberships', icon: Dumbbell },
    { name: '3-Month Membership', price: 995.00, category: 'Memberships', icon: Dumbbell },
    { name: 'Annual Membership', price: 3500.00, category: 'Memberships', icon: Dumbbell },
    { name: 'Student Membership', price: 295.00, category: 'Memberships', icon: Dumbbell },
    { name: 'Couple Membership', price: 650.00, category: 'Memberships', icon: Dumbbell },
    { name: 'Family Membership', price: 895.00, category: 'Memberships', icon: Dumbbell },
    // Day Passes
    { name: 'Day Pass', price: 85.00, category: 'Day Pass', icon: Dumbbell },
    { name: 'Weekly Pass', price: 195.00, category: 'Day Pass', icon: Dumbbell },
    { name: '10-Visit Pass', price: 650.00, category: 'Day Pass', icon: Dumbbell },
    // Personal Training
    { name: 'PT Session (1 hour)', price: 350.00, category: 'Personal Training', icon: Dumbbell },
    { name: 'PT Package (5 sessions)', price: 1500.00, category: 'Personal Training', icon: Dumbbell },
    { name: 'PT Package (10 sessions)', price: 2800.00, category: 'Personal Training', icon: Dumbbell },
    { name: 'Fitness Assessment', price: 150.00, category: 'Personal Training', icon: Dumbbell },
    { name: 'Program Design', price: 250.00, category: 'Personal Training', icon: Dumbbell },
    // Classes
    { name: 'Group Class', price: 45.00, category: 'Classes', icon: Users },
    { name: 'Yoga Class', price: 65.00, category: 'Classes', icon: Users },
    { name: 'Spin Class', price: 55.00, category: 'Classes', icon: Users },
    { name: 'Boxing Class', price: 75.00, category: 'Classes', icon: Users },
    // Services
    { name: 'Locker Rental (Monthly)', price: 75.00, category: 'Services', icon: Package },
    { name: 'Towel Service', price: 45.00, category: 'Services', icon: Package },
    { name: 'Gym Bag', price: 145.00, category: 'Services', icon: ShoppingBag },
    // Supplements
    { name: 'Protein Shake', price: 45.00, category: 'Supplements', icon: Droplets },
    { name: 'Energy Drink', price: 25.00, category: 'Supplements', icon: Droplets },
    { name: 'Energy Bar', price: 28.00, category: 'Supplements', icon: Cookie },
    // Late Fee
    { name: 'Late Fee', price: 50.00, category: 'Fees', icon: CreditCard },
    { name: 'Joining Fee', price: 250.00, category: 'Fees', icon: CreditCard },
  ],
  'fitness-studio': [
    // Memberships
    { name: 'Monthly Unlimited', price: 650.00, category: 'Memberships', icon: Dumbbell },
    { name: '8-Class Pack', price: 895.00, category: 'Memberships', icon: Dumbbell },
    { name: '4-Class Pack', price: 495.00, category: 'Memberships', icon: Dumbbell },
    { name: 'Drop-in Class', price: 125.00, category: 'Memberships', icon: Dumbbell },
    // Classes
    { name: 'Pilates (Reformer)', price: 185.00, category: 'Classes', icon: Users },
    { name: 'Yoga Flow', price: 125.00, category: 'Classes', icon: Users },
    { name: 'Barre Class', price: 145.00, category: 'Classes', icon: Users },
    { name: 'HIIT Class', price: 125.00, category: 'Classes', icon: Users },
    { name: 'Spin/Cycle', price: 135.00, category: 'Classes', icon: Users },
    { name: 'Dance Fitness', price: 115.00, category: 'Classes', icon: Users },
    // Private Sessions
    { name: 'Private Pilates', price: 450.00, category: 'Private', icon: Users },
    { name: 'Private Yoga', price: 350.00, category: 'Private', icon: Users },
    { name: 'Duette Session', price: 295.00, category: 'Private', icon: Users },
    // Workshops
    { name: 'Workshop (2 hours)', price: 295.00, category: 'Workshops', icon: Users },
    { name: 'Masterclass', price: 195.00, category: 'Workshops', icon: Users },
    // Retail
    { name: 'Yoga Mat', price: 295.00, category: 'Retail', icon: Package },
    { name: 'Resistance Bands', price: 125.00, category: 'Retail', icon: Package },
    { name: 'Fitness Apparel', price: 450.00, category: 'Retail', icon: Shirt },
  ],
  'sports-club': [
    // Memberships
    { name: 'Annual Membership', price: 4500.00, category: 'Memberships', icon: Users },
    { name: 'Monthly Membership', price: 450.00, category: 'Memberships', icon: Users },
    { name: 'Social Membership', price: 250.00, category: 'Memberships', icon: Users },
    { name: 'Junior Membership', price: 180.00, category: 'Memberships', icon: Users },
    { name: 'Family Membership', price: 850.00, category: 'Memberships', icon: Users },
    // Facilities
    { name: 'Tennis Court (per hour)', price: 85.00, category: 'Facilities', icon: Users },
    { name: 'Squash Court (per hour)', price: 65.00, category: 'Facilities', icon: Users },
    { name: 'Bowling Green (per session)', price: 45.00, category: 'Facilities', icon: Users },
    { name: 'Swimming Pool (day access)', price: 35.00, category: 'Facilities', icon: Droplets },
    { name: 'Gym Access (day)', price: 55.00, category: 'Facilities', icon: Dumbbell },
    // Bar & Restaurant
    { name: 'Bar Tab', price: 0.00, category: 'Bar', icon: Beer },
    { name: 'Meal', price: 85.00, category: 'Bar', icon: Utensils },
    { name: 'Drink', price: 35.00, category: 'Bar', icon: Droplets },
    // Events
    { name: 'Event Entry', price: 125.00, category: 'Events', icon: Ticket },
    { name: 'Tournament Entry', price: 250.00, category: 'Events', icon: Ticket },
    // Coaching
    { name: 'Group Coaching', price: 125.00, category: 'Coaching', icon: Users },
    { name: 'Private Lesson', price: 285.00, category: 'Coaching', icon: Users },
    // Equipment Hire
    { name: 'Equipment Hire (per session)', price: 45.00, category: 'Hire', icon: Package },
    { name: 'Locker', price: 25.00, category: 'Hire', icon: Package },
  ],
  'events-venue': [
    // Venue Hire
    { name: 'Hall Hire (Half Day)', price: 4500.00, category: 'Venue Hire', icon: Home },
    { name: 'Hall Hire (Full Day)', price: 7500.00, category: 'Venue Hire', icon: Home },
    { name: 'Garden Venue (Half Day)', price: 6500.00, category: 'Venue Hire', icon: Home },
    { name: 'Garden Venue (Full Day)', price: 9500.00, category: 'Venue Hire', icon: Home },
    { name: 'Conference Room (Half Day)', price: 2500.00, category: 'Venue Hire', icon: Home },
    { name: 'Conference Room (Full Day)', price: 4500.00, category: 'Venue Hire', icon: Home },
    // Catering
    { name: 'Buffet (per person)', price: 185.00, category: 'Catering', icon: Utensils },
    { name: 'Plated Meal (per person)', price: 245.00, category: 'Catering', icon: Utensils },
    { name: 'Finger Snacks (per person)', price: 95.00, category: 'Catering', icon: Utensils },
    { name: 'Braai Package (per person)', price: 165.00, category: 'Catering', icon: Utensils },
    { name: 'Kids Menu (per person)', price: 75.00, category: 'Catering', icon: Utensils },
    // Drinks
    { name: 'Cash Bar Setup', price: 1500.00, category: 'Drinks', icon: Beer },
    { name: 'Open Bar (per person)', price: 195.00, category: 'Drinks', icon: Beer },
    { name: 'Soft Drinks Package', price: 45.00, category: 'Drinks', icon: Droplets },
    { name: 'Juice Station', price: 850.00, category: 'Drinks', icon: Droplets },
    // Equipment
    { name: 'Tables & Chairs', price: 850.00, category: 'Equipment', icon: Package },
    { name: 'Crockery & Cutlery', price: 650.00, category: 'Equipment', icon: Package },
    { name: 'Linen (Tables)', price: 450.00, category: 'Equipment', icon: Package },
    { name: 'Chair Covers', price: 350.00, category: 'Equipment', icon: Package },
    { name: 'Sound System', price: 1850.00, category: 'Equipment', icon: Music },
    { name: 'Projector & Screen', price: 850.00, category: 'Equipment', icon: Monitor },
    { name: 'Stage', price: 1500.00, category: 'Equipment', icon: Home },
    // Decor
    { name: 'Flower Arrangements', price: 650.00, category: 'Decor', icon: Sparkles },
    { name: 'Balloon Décor', price: 850.00, category: 'Decor', icon: Sparkles },
    { name: 'Photo Backdrop', price: 650.00, category: 'Decor', icon: Camera },
    // Staff
    { name: 'Waiter (per hour)', price: 85.00, category: 'Staff', icon: Users },
    { name: 'Bartender (per hour)', price: 95.00, category: 'Staff', icon: Users },
    { name: 'Event Coordinator', price: 1500.00, category: 'Staff', icon: Users },
    // Services
    { name: 'Setup & Breakdown', price: 850.00, category: 'Services', icon: Wrench },
    { name: 'Cleaning Fee', price: 650.00, category: 'Services', icon: Home },
    { name: 'Security', price: 450.00, category: 'Services', icon: Shield },
    { name: 'Parking Attendant', price: 250.00, category: 'Services', icon: Car },
    // Deposits
    { name: 'Venue Deposit (50%)', price: 0.00, category: 'Deposits', icon: CreditCard },
    { name: 'Damage Deposit', price: 2500.00, category: 'Deposits', icon: CreditCard },
  ],
  'entertainment': [
    // Arcade Games
    { name: 'Game Credits (10)', price: 25.00, category: 'Arcade', icon: Gamepad2 },
    { name: 'Game Credits (25)', price: 55.00, category: 'Arcade', icon: Gamepad2 },
    { name: 'Game Credits (50)', price: 95.00, category: 'Arcade', icon: Gamepad2 },
    { name: 'Unlimited Play (1 hour)', price: 85.00, category: 'Arcade', icon: Gamepad2 },
    { name: 'Unlimited Play (2 hours)', price: 145.00, category: 'Arcade', icon: Gamepad2 },
    // Bowling
    { name: 'Bowling Game (per person)', price: 55.00, category: 'Bowling', icon: Users },
    { name: 'Bowling + Shoes', price: 75.00, category: 'Bowling', icon: Users },
    { name: 'Bowling Party (8 people)', price: 650.00, category: 'Bowling', icon: Users },
    // Parties
    { name: 'Kids Party Package (10 kids)', price: 1450.00, category: 'Parties', icon: Gift },
    { name: 'Kids Party Package (20 kids)', price: 2500.00, category: 'Parties', icon: Gift },
    { name: 'Teen Party Package', price: 2850.00, category: 'Parties', icon: Gift },
    { name: 'Adult Party Package', price: 3500.00, category: 'Parties', icon: Gift },
    // Food & Drinks
    { name: 'Popcorn', price: 25.00, category: 'Food', icon: Cookie },
    { name: 'Slush Puppy', price: 28.00, category: 'Food', icon: Droplets },
    { name: 'Soft Drink', price: 18.00, category: 'Food', icon: Droplets },
    { name: 'Pizza Slice', price: 28.00, category: 'Food', icon: Pizza },
    { name: 'Hot Dog', price: 25.00, category: 'Food', icon: Sandwich },
    // Party Extras
    { name: 'Party Platter', price: 185.00, category: 'Party Extras', icon: Utensils },
    { name: 'Party Decorations', price: 125.00, category: 'Party Extras', icon: Sparkles },
    { name: 'Cake (per slice)', price: 35.00, category: 'Party Extras', icon: Cookie },
    { name: 'Party Favors (per child)', price: 25.00, category: 'Party Extras', icon: Gift },
    // VR & Special
    { name: 'VR Experience (15 min)', price: 75.00, category: 'Special', icon: Gamepad2 },
    { name: 'VR Experience (30 min)', price: 125.00, category: 'Special', icon: Gamepad2 },
    { name: 'Laser Tag Game', price: 65.00, category: 'Special', icon: Users },
    // Membership
    { name: 'Monthly Membership', price: 195.00, category: 'Memberships', icon: CreditCard },
    { name: 'Annual Membership', price: 1650.00, category: 'Memberships', icon: CreditCard },
  ],
  'escape-room': [
    // Games
    { name: 'Escape Room (2 players)', price: 350.00, category: 'Games', icon: Timer },
    { name: 'Escape Room (3 players)', price: 495.00, category: 'Games', icon: Timer },
    { name: 'Escape Room (4 players)', price: 625.00, category: 'Games', icon: Timer },
    { name: 'Escape Room (5 players)', price: 750.00, category: 'Games', icon: Timer },
    { name: 'Escape Room (6 players)', price: 850.00, category: 'Games', icon: Timer },
    // Themes
    { name: 'Haunted House Theme', price: 0.00, category: 'Themes', icon: Sparkles },
    { name: 'Bank Heist Theme', price: 0.00, category: 'Themes', icon: Sparkles },
    { name: 'Murder Mystery Theme', price: 0.00, category: 'Themes', icon: Sparkles },
    { name: 'Prison Break Theme', price: 0.00, category: 'Themes', icon: Sparkles },
    // Packages
    { name: 'Corporate Team Building (10)', price: 1850.00, category: 'Packages', icon: Users },
    { name: 'Birthday Package (8 players)', price: 1250.00, category: 'Packages', icon: Gift },
    { name: 'Date Night Package (2)', price: 450.00, category: 'Packages', icon: Gift },
    // Add-ons
    { name: 'Photo Package', price: 125.00, category: 'Add-ons', icon: Camera },
    { name: 'Hint Package', price: 50.00, category: 'Add-ons', icon: Sparkles },
    { name: 'Champagne Celebration', price: 185.00, category: 'Add-ons', icon: Wine },
    // Gift Cards
    { name: 'Gift Card (R250)', price: 250.00, category: 'Gift Cards', icon: Gift },
    { name: 'Gift Card (R500)', price: 500.00, category: 'Gift Cards', icon: Gift },
  ],
  'default': [
    { name: 'Day Pass', price: 85.00, category: 'Access', icon: Ticket },
    { name: 'Session', price: 125.00, category: 'Activities', icon: Dumbbell },
    { name: 'Membership', price: 295.00, category: 'Memberships', icon: CreditCard },
  ]
}

// Childcare & Education SKUs
export const childcareSKUs: Record<string, SKU[]> = {
  'creche': [
    // Monthly Fees
    { name: 'Full Day (Monthly)', price: 2500.00, category: 'Monthly Fees', icon: Baby },
    { name: 'Half Day (Monthly)', price: 1850.00, category: 'Monthly Fees', icon: Baby },
    { name: 'Aftercare Only (Monthly)', price: 1200.00, category: 'Monthly Fees', icon: Baby },
    // Registration
    { name: 'Registration Fee', price: 500.00, category: 'Registration', icon: CreditCard },
    { name: 'Deposit (One Month)', price: 0.00, category: 'Registration', icon: CreditCard },
    // Daily Rates
    { name: 'Drop-in Day Rate', price: 150.00, category: 'Daily Rates', icon: Baby },
    { name: 'Half Day Rate', price: 95.00, category: 'Daily Rates', icon: Baby },
    // Extras
    { name: 'Late Collection Fee', price: 50.00, category: 'Extras', icon: Clock },
    { name: 'Early Drop-off', price: 35.00, category: 'Extras', icon: Clock },
    { name: 'Holiday Care (per day)', price: 125.00, category: 'Extras', icon: Baby },
    // Meals
    { name: 'Meal Plan (Monthly)', price: 450.00, category: 'Meals', icon: Utensils },
    { name: 'Breakfast Only', price: 185.00, category: 'Meals', icon: Utensils },
    // Supplies
    { name: 'Stationery Pack', price: 185.00, category: 'Supplies', icon: Book },
    { name: 'Toiletries Pack', price: 125.00, category: 'Supplies', icon: Package },
    { name: 'Mattress & Bedding', price: 350.00, category: 'Supplies', icon: Bed },
    // Uniforms
    { name: 'T-Shirt', price: 85.00, category: 'Uniform', icon: Shirt },
    { name: 'Tracksuit', price: 185.00, category: 'Uniform', icon: Shirt },
    { name: 'Hat', price: 45.00, category: 'Uniform', icon: Shirt },
  ],
  'after-school': [
    // Monthly Fees
    { name: 'Aftercare (Monthly)', price: 1200.00, category: 'Monthly Fees', icon: Book },
    { name: 'Homework Help Only', price: 850.00, category: 'Monthly Fees', icon: Book },
    { name: 'Transport Included', price: 1450.00, category: 'Monthly Fees', icon: Book },
    // Daily Rates
    { name: 'Daily Rate', price: 75.00, category: 'Daily Rates', icon: Book },
    { name: 'Drop-in (per hour)', price: 25.00, category: 'Daily Rates', icon: Book },
    // Activities
    { name: 'Art Club (Monthly)', price: 350.00, category: 'Activities', icon: Sparkles },
    { name: 'Sports Club (Monthly)', price: 350.00, category: 'Activities', icon: Dumbbell },
    { name: 'Music Lessons', price: 450.00, category: 'Activities', icon: Music },
    { name: 'Coding Club', price: 550.00, category: 'Activities', icon: Monitor },
    // Holiday Programs
    { name: 'Holiday Program (Weekly)', price: 650.00, category: 'Holiday', icon: Baby },
    { name: 'Holiday Program (Daily)', price: 145.00, category: 'Holiday', icon: Baby },
    // Registration
    { name: 'Registration Fee', price: 250.00, category: 'Registration', icon: CreditCard },
    // Transport
    { name: 'School Pickup', price: 350.00, category: 'Transport', icon: Car },
    { name: 'Late Pickup Fee', price: 35.00, category: 'Transport', icon: Clock },
    // Meals
    { name: 'Snack Pack (Monthly)', price: 185.00, category: 'Meals', icon: Cookie },
  ],
  'tutoring': [
    // Subjects (per hour)
    { name: 'Mathematics (per hour)', price: 185.00, category: 'Subjects', icon: Book },
    { name: 'English (per hour)', price: 165.00, category: 'Subjects', icon: Book },
    { name: 'Physical Science (per hour)', price: 195.00, category: 'Subjects', icon: Book },
    { name: 'Accounting (per hour)', price: 185.00, category: 'Subjects', icon: Book },
    { name: 'Afrikaans (per hour)', price: 155.00, category: 'Subjects', icon: Book },
    { name: 'Life Science (per hour)', price: 175.00, category: 'Subjects', icon: Book },
    // Packages
    { name: '4-Hour Package', price: 650.00, category: 'Packages', icon: Book },
    { name: '8-Hour Package', price: 1200.00, category: 'Packages', icon: Book },
    { name: '12-Hour Package', price: 1650.00, category: 'Packages', icon: Book },
    // Group Sessions
    { name: 'Group Session (per person)', price: 95.00, category: 'Group', icon: Users },
    { name: 'Exam Prep Group', price: 125.00, category: 'Group', icon: Users },
    // Exam Prep
    { name: 'Exam Crash Course (4 hrs)', price: 650.00, category: 'Exam Prep', icon: GraduationCap },
    { name: 'Final Exam Package', price: 1450.00, category: 'Exam Prep', icon: GraduationCap },
    // Online
    { name: 'Online Session (per hour)', price: 145.00, category: 'Online', icon: Monitor },
    { name: 'Online Package (4 hrs)', price: 520.00, category: 'Online', icon: Monitor },
    // Assessments
    { name: 'Assessment', price: 250.00, category: 'Assessment', icon: FileText },
    { name: 'Progress Report', price: 125.00, category: 'Assessment', icon: FileText },
  ],
  'driving-school': [
    // Lessons
    { name: 'Single Lesson (1 hour)', price: 185.00, category: 'Lessons', icon: Car },
    { name: 'Lesson Package (5)', price: 850.00, category: 'Lessons', icon: Car },
    { name: 'Lesson Package (10)', price: 1550.00, category: 'Lessons', icon: Car },
    { name: 'Double Lesson (2 hours)', price: 350.00, category: 'Lessons', icon: Car },
    // Learners
    { name: 'Learners Test Prep', price: 350.00, category: 'Learners', icon: Book },
    { name: 'Learners Test Booking', price: 250.00, category: 'Learners', icon: FileText },
    // License
    { name: 'License Test Prep', price: 450.00, category: 'License', icon: Car },
    { name: 'Car Hire for Test', price: 350.00, category: 'License', icon: Car },
    { name: 'Test Booking Assistance', price: 150.00, category: 'License', icon: FileText },
    // Code 10
    { name: 'Code 10 Lesson', price: 285.00, category: 'Code 10', icon: Car },
    { name: 'Code 10 Package (5)', price: 1250.00, category: 'Code 10', icon: Car },
    // Motorcycle
    { name: 'Motorcycle Lesson', price: 195.00, category: 'Motorcycle', icon: Car },
    { name: 'Motorcycle Package (5)', price: 850.00, category: 'Motorcycle', icon: Car },
    // Special Needs
    { name: 'Automatic Lesson', price: 195.00, category: 'Automatic', icon: Car },
    { name: 'Defensive Driving Course', price: 850.00, category: 'Special', icon: Car },
    // Pickup
    { name: 'Pickup/Drop-off Service', price: 75.00, category: 'Services', icon: Car },
    { name: 'Weekend Lesson Surcharge', price: 35.00, category: 'Services', icon: Car },
  ],
  'skills-training': [
    // Computer Skills
    { name: 'Basic Computer Course', price: 1850.00, category: 'Computer', icon: Monitor },
    { name: 'Microsoft Office Course', price: 2450.00, category: 'Computer', icon: Monitor },
    { name: 'Excel Advanced', price: 1950.00, category: 'Computer', icon: Monitor },
    // Business Skills
    { name: 'Business Writing', price: 1450.00, category: 'Business', icon: FileText },
    { name: 'Customer Service', price: 1250.00, category: 'Business', icon: Users },
    { name: 'Sales Training', price: 1850.00, category: 'Business', icon: CreditCard },
    // Technical Skills
    { name: 'Plumbing Basics', price: 2850.00, category: 'Technical', icon: Wrench },
    { name: 'Electrical Basics', price: 2850.00, category: 'Technical', icon: Lightbulb },
    { name: 'Welding Course', price: 3500.00, category: 'Technical', icon: Wrench },
    // Beauty
    { name: 'Hairdressing Course', price: 4500.00, category: 'Beauty', icon: Scissors },
    { name: 'Nail Technician', price: 2850.00, category: 'Beauty', icon: Sparkles },
    { name: 'Makeup Artistry', price: 2500.00, category: 'Beauty', icon: Sparkles },
    // Hospitality
    { name: 'Waiter Training', price: 1250.00, category: 'Hospitality', icon: Utensils },
    { name: 'Barista Course', price: 1850.00, category: 'Hospitality', icon: Coffee },
    { name: 'Food Safety Course', price: 950.00, category: 'Hospitality', icon: Utensils },
    // Certification
    { name: 'Certificate Fee', price: 250.00, category: 'Certification', icon: GraduationCap },
    { name: 'Exam Fee', price: 350.00, category: 'Certification', icon: FileText },
    // Materials
    { name: 'Course Materials', price: 350.00, category: 'Materials', icon: Book },
    { name: 'Tool Kit', price: 850.00, category: 'Materials', icon: Wrench },
  ],
  'default': [
    { name: 'Monthly Fee', price: 1500.00, category: 'Fees', icon: CreditCard },
    { name: 'Session', price: 185.00, category: 'Sessions', icon: Book },
    { name: 'Course', price: 1850.00, category: 'Courses', icon: GraduationCap },
  ]
}

// Professional Services SKUs
export const professionalSKUs: Record<string, SKU[]> = {
  'auto-repair': [
    // Labor
    { name: 'Labor (per hour)', price: 350.00, category: 'Labor', icon: Wrench },
    { name: 'Diagnostic Fee', price: 285.00, category: 'Labor', icon: Wrench },
    // Oil & Filters
    { name: 'Oil Change (Basic)', price: 350.00, category: 'Service', icon: Droplets },
    { name: 'Oil Change (Full Synthetic)', price: 550.00, category: 'Service', icon: Droplets },
    { name: 'Oil Filter', price: 85.00, category: 'Parts', icon: Package },
    { name: 'Air Filter', price: 125.00, category: 'Parts', icon: Package },
    // Brakes
    { name: 'Brake Pads (Front)', price: 650.00, category: 'Brakes', icon: Wrench },
    { name: 'Brake Pads (Rear)', price: 550.00, category: 'Brakes', icon: Wrench },
    { name: 'Brake Discs (Front)', price: 1250.00, category: 'Brakes', icon: Wrench },
    { name: 'Brake Fluid Change', price: 185.00, category: 'Brakes', icon: Droplets },
    // Tyres
    { name: 'Tyre (Budget 15")', price: 450.00, category: 'Tyres', icon: Car },
    { name: 'Tyre (Premium 15")', price: 850.00, category: 'Tyres', icon: Car },
    { name: 'Tyre (Budget 17")', price: 650.00, category: 'Tyres', icon: Car },
    { name: 'Tyre (Premium 17")', price: 1250.00, category: 'Tyres', icon: Car },
    { name: 'Wheel Alignment', price: 285.00, category: 'Tyres', icon: Car },
    { name: 'Puncture Repair', price: 95.00, category: 'Tyres', icon: Wrench },
    // Battery
    { name: 'Battery (Standard)', price: 950.00, category: 'Battery', icon: Zap },
    { name: 'Battery (Premium)', price: 1450.00, category: 'Battery', icon: Zap },
    { name: 'Battery Testing', price: 65.00, category: 'Battery', icon: Zap },
    // Major Services
    { name: 'Major Service (Small Car)', price: 1850.00, category: 'Major Service', icon: Wrench },
    { name: 'Major Service (Large Car)', price: 2450.00, category: 'Major Service', icon: Wrench },
    { name: 'Cam Belt Replacement', price: 2850.00, category: 'Major Service', icon: Wrench },
    { name: 'Clutch Replacement', price: 4500.00, category: 'Major Service', icon: Wrench },
    // Air Conditioning
    { name: 'AC Regas', price: 450.00, category: 'AC', icon: Droplets },
    { name: 'AC Repair Quote', price: 0.00, category: 'AC', icon: Wrench },
    // Suspension
    { name: 'Shock Absorbers (per pair)', price: 1250.00, category: 'Suspension', icon: Wrench },
    { name: 'Control Arm', price: 850.00, category: 'Suspension', icon: Wrench },
  ],
  'dry-cleaning': [
    // Dry Cleaning
    { name: 'Suit (2-piece)', price: 85.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Suit (3-piece)', price: 105.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Jacket', price: 55.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Trousers', price: 35.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Dress', price: 65.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Coat/Overcoat', price: 85.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Blazer', price: 55.00, category: 'Dry Cleaning', icon: Shirt },
    { name: 'Waistcoat', price: 35.00, category: 'Dry Cleaning', icon: Shirt },
    // Formal Wear
    { name: 'Wedding Dress', price: 350.00, category: 'Formal Wear', icon: Shirt },
    { name: 'Evening Gown', price: 125.00, category: 'Formal Wear', icon: Shirt },
    { name: 'Tuxedo', price: 95.00, category: 'Formal Wear', icon: Shirt },
    { name: 'Silk Garment', price: 75.00, category: 'Formal Wear', icon: Shirt },
    // Laundry
    { name: 'Shirt (Laundered)', price: 28.00, category: 'Laundry', icon: Shirt },
    { name: 'Shirt (Laundered x5)', price: 125.00, category: 'Laundry', icon: Shirt },
    { name: 'Bed Sheet', price: 35.00, category: 'Household', icon: Bed },
    { name: 'Duvet Cover', price: 55.00, category: 'Household', icon: Bed },
    { name: 'Duvet (Down)', price: 125.00, category: 'Household', icon: Bed },
    { name: 'Blanket', price: 65.00, category: 'Household', icon: Bed },
    { name: 'Curtains (per panel)', price: 55.00, category: 'Household', icon: Home },
    // Special Treatments
    { name: 'Stain Removal', price: 35.00, category: 'Special', icon: Sparkles },
    { name: 'Leather Cleaning', price: 145.00, category: 'Special', icon: Shirt },
    { name: 'Suede Cleaning', price: 145.00, category: 'Special', icon: Shirt },
    // Alterations
    { name: 'Hemming', price: 45.00, category: 'Alterations', icon: Scissors },
    { name: 'Taking In', price: 65.00, category: 'Alterations', icon: Scissors },
    // Delivery
    { name: 'Delivery Fee', price: 25.00, category: 'Services', icon: Car },
    { name: 'Express Service', price: 50.00, category: 'Services', icon: Zap },
  ],
  'funeral-home': [
    // Packages
    { name: 'Basic Funeral Package', price: 8500.00, category: 'Packages', icon: Package },
    { name: 'Standard Funeral Package', price: 15500.00, category: 'Packages', icon: Package },
    { name: 'Premium Funeral Package', price: 25000.00, category: 'Packages', icon: Package },
    // Caskets
    { name: 'Standard Casket', price: 4500.00, category: 'Caskets', icon: Package },
    { name: 'Premium Casket', price: 8500.00, category: 'Caskets', icon: Package },
    { name: 'Economy Casket', price: 2500.00, category: 'Caskets', icon: Package },
    // Services
    { name: 'Hearse Hire', price: 1850.00, category: 'Services', icon: Car },
    { name: 'Family Car', price: 850.00, category: 'Services', icon: Car },
    { name: 'Minister/Officiant', price: 650.00, category: 'Services', icon: Users },
    { name: 'Programs (100)', price: 450.00, category: 'Services', icon: FileText },
    { name: 'Flower Arrangement', price: 850.00, category: 'Services', icon: Sparkles },
    { name: 'Tent & Chairs', price: 1850.00, category: 'Services', icon: Home },
    // Documentation
    { name: 'Death Certificate', price: 150.00, category: 'Documentation', icon: FileText },
    { name: 'Burial Order', price: 250.00, category: 'Documentation', icon: FileText },
    { name: 'Newspaper Notice', price: 450.00, category: 'Documentation', icon: FileText },
    // Cremation
    { name: 'Cremation Fee', price: 3500.00, category: 'Cremation', icon: Package },
    { name: 'Urn', price: 450.00, category: 'Cremation', icon: Package },
    // Policies
    { name: 'Funeral Policy Claim', price: 0.00, category: 'Policy', icon: CreditCard },
    { name: 'Policy Payout Handling', price: 0.00, category: 'Policy', icon: CreditCard },
    // Accounts
    { name: 'Deposit (50%)', price: 0.00, category: 'Accounts', icon: CreditCard },
    { name: 'Family Account', price: 0.00, category: 'Accounts', icon: CreditCard },
  ],
  'legal-services': [
    // Consultations
    { name: 'Initial Consultation (30 min)', price: 450.00, category: 'Consultations', icon: Briefcase },
    { name: 'Consultation (1 hour)', price: 850.00, category: 'Consultations', icon: Briefcase },
    // Conveyancing
    { name: 'Property Transfer', price: 8500.00, category: 'Conveyancing', icon: Home },
    { name: 'Bond Registration', price: 6500.00, category: 'Conveyancing', icon: Home },
    { name: 'Bond Cancellation', price: 2500.00, category: 'Conveyancing', icon: Home },
    // Wills & Estates
    { name: 'Will Drafting', price: 850.00, category: 'Wills', icon: FileText },
    { name: 'Estate Administration', price: 0.00, category: 'Wills', icon: FileText },
    { name: 'Trust Formation', price: 4500.00, category: 'Wills', icon: FileText },
    // Contracts
    { name: 'Contract Review', price: 1250.00, category: 'Contracts', icon: FileText },
    { name: 'Contract Drafting', price: 2500.00, category: 'Contracts', icon: FileText },
    { name: 'Commercial Lease', price: 3500.00, category: 'Contracts', icon: FileText },
    { name: 'Residential Lease', price: 1250.00, category: 'Contracts', icon: FileText },
    // Family Law
    { name: 'Divorce (Uncontested)', price: 4500.00, category: 'Family Law', icon: Scale },
    { name: 'Divorce (Contested)', price: 0.00, category: 'Family Law', icon: Scale },
    { name: 'Custody Agreement', price: 3500.00, category: 'Family Law', icon: Scale },
    // Corporate
    { name: 'Company Registration', price: 1250.00, category: 'Corporate', icon: Building2 },
    { name: 'Shareholders Agreement', price: 4500.00, category: 'Corporate', icon: Building2 },
    { name: 'Company Secretarial', price: 1850.00, category: 'Corporate', icon: Building2 },
    // Litigation
    { name: 'Court Appearance', price: 3500.00, category: 'Litigation', icon: Scale },
    { name: 'Letter of Demand', price: 450.00, category: 'Litigation', icon: FileText },
    { name: 'Debt Collection', price: 0.00, category: 'Litigation', icon: CreditCard },
    // Trust Account
    { name: 'Trust Deposit', price: 0.00, category: 'Trust Account', icon: CreditCard },
    { name: 'Trust Withdrawal', price: 0.00, category: 'Trust Account', icon: CreditCard },
  ],
  'accounting': [
    // Consultations
    { name: 'Initial Consultation', price: 550.00, category: 'Consultations', icon: Calculator },
    { name: 'Follow-up Meeting', price: 350.00, category: 'Consultations', icon: Calculator },
    // Monthly Services
    { name: 'Bookkeeping (Monthly)', price: 1850.00, category: 'Monthly', icon: Calculator },
    { name: 'Payroll Processing', price: 650.00, category: 'Monthly', icon: Calculator },
    { name: 'VAT Return', price: 450.00, category: 'Monthly', icon: Calculator },
    { name: 'PAYE/UIF Filing', price: 350.00, category: 'Monthly', icon: Calculator },
    // Annual Services
    { name: 'Annual Financial Statements', price: 4500.00, category: 'Annual', icon: FileText },
    { name: 'Company Tax Return', price: 1850.00, category: 'Annual', icon: FileText },
    { name: 'Personal Tax Return', price: 850.00, category: 'Annual', icon: FileText },
    { name: 'Provisional Tax', price: 650.00, category: 'Annual', icon: FileText },
    // Registration
    { name: 'Tax Registration', price: 450.00, category: 'Registration', icon: FileText },
    { name: 'VAT Registration', price: 650.00, category: 'Registration', icon: FileText },
    { name: 'PAYE Registration', price: 350.00, category: 'Registration', icon: FileText },
    // Specialized
    { name: 'Business Valuation', price: 8500.00, category: 'Specialized', icon: Calculator },
    { name: 'Due Diligence', price: 12500.00, category: 'Specialized', icon: Calculator },
    { name: 'Audit Preparation', price: 3500.00, category: 'Specialized', icon: Calculator },
    // Advisory
    { name: 'Business Advisory (per hour)', price: 650.00, category: 'Advisory', icon: Calculator },
    { name: 'Tax Planning', price: 1850.00, category: 'Advisory', icon: Calculator },
    { name: 'Budgeting & Forecasting', price: 2500.00, category: 'Advisory', icon: Calculator },
    // Client Portal
    { name: 'Client Portal Access', price: 150.00, category: 'Services', icon: Monitor },
    { name: 'Document Storage', price: 85.00, category: 'Services', icon: Package },
  ],
  'tutoring-school': [
    // Subjects (per hour)
    { name: 'Mathematics (per hour)', price: 185.00, category: 'Subjects', icon: Book },
    { name: 'Physical Science (per hour)', price: 195.00, category: 'Subjects', icon: Book },
    { name: 'English (per hour)', price: 165.00, category: 'Subjects', icon: Book },
    { name: 'Accounting (per hour)', price: 185.00, category: 'Subjects', icon: Book },
    { name: 'Afrikaans (per hour)', price: 155.00, category: 'Subjects', icon: Book },
    { name: 'Geography (per hour)', price: 155.00, category: 'Subjects', icon: Book },
    { name: 'History (per hour)', price: 155.00, category: 'Subjects', icon: Book },
    { name: 'Life Sciences (per hour)', price: 175.00, category: 'Subjects', icon: Book },
    // Packages
    { name: 'Monthly Package (4 sessions)', price: 650.00, category: 'Packages', icon: Book },
    { name: 'Monthly Package (8 sessions)', price: 1200.00, category: 'Packages', icon: Book },
    { name: 'Term Package', price: 3500.00, category: 'Packages', icon: Book },
    // Exam Prep
    { name: 'Exam Prep (Group)', price: 125.00, category: 'Exam Prep', icon: GraduationCap },
    { name: 'Exam Prep (Individual)', price: 225.00, category: 'Exam Prep', icon: GraduationCap },
    { name: 'Crash Course (4 hours)', price: 650.00, category: 'Exam Prep', icon: GraduationCap },
    // Matric Rewrite
    { name: 'Matric Rewrite Course', price: 4500.00, category: 'Matric', icon: GraduationCap },
    { name: 'Matric Subject Package', price: 1850.00, category: 'Matric', icon: GraduationCap },
    // Registration
    { name: 'Registration Fee', price: 150.00, category: 'Registration', icon: CreditCard },
    // Assessments
    { name: 'Assessment', price: 250.00, category: 'Assessment', icon: FileText },
    { name: 'Progress Report', price: 125.00, category: 'Assessment', icon: FileText },
    // Materials
    { name: 'Study Guide', price: 185.00, category: 'Materials', icon: Book },
    { name: 'Past Papers Pack', price: 95.00, category: 'Materials', icon: Package },
  ],
  'default': [
    { name: 'Consultation', price: 450.00, category: 'Consultations', icon: Briefcase },
    { name: 'Service Fee', price: 350.00, category: 'Services', icon: CreditCard },
    { name: 'Hourly Rate', price: 450.00, category: 'Rates', icon: Clock },
  ]
}

// Update the main getSKUs function to include all verticals
export function getAllSKUs(verticalId: string, subVerticalId: string): SKU[] {
  const skuMaps: Record<string, Record<string, SKU[]>> = {
    'fnb': fnbSKUs,
    'liquor': liquorSKUs,
    'grocery': grocerySKUs,
    'health-beauty': healthBeautySKUs,
    'fashion': fashionSKUs,
    'health-pharmacy': healthPharmacySKUs,
    'hospitality': hospitalitySKUs,
    'hardware': hardwareSKUs,
    'electronics': electronicsSKUs,
    'sport-leisure': sportLeisureSKUs,
    'childcare': childcareSKUs,
    'professional': professionalSKUs,
  }
  
  const verticalSKUs = skuMaps[verticalId]
  if (!verticalSKUs) return defaultSKUs
  
  return verticalSKUs[subVerticalId] || verticalSKUs['default'] || defaultSKUs
}
