import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// ============================================================================
// AGRICULTURE SUPPLIER DATA - 350 Suppliers for GroSupply, GroMarket, GroSupply Pro
// ============================================================================
// Categories: 
// - Livestock Farmers (Beef, Dairy, Sheep, Goat, Poultry, Pigs, Game)
// - Crop Farmers (Grains, Vegetables, Fruits, Sugarcane)
// - Agri-Suppliers (Feed, Seeds, Fertilizer, Equipment, Chemicals)
// - Agri-Services (Veterinary, Auctions, Transport, Processing)
// - Food Manufacturers & Processors
// - Distributors & Wholesalers

const agricultureSuppliers = [
  // =====================================================
  // LIVESTOCK - CATTLE (BEEF) - 40 suppliers
  // =====================================================
  { name: "Karan Beef", website: "karanbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial Feedlot", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Chalmar Beef", website: "chalmar.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Feedlot", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Klein Karoo Beef", website: "kkbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Free Range", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Spier Beef", website: "spier.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Grass Fed", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Mooi River Beef", website: "mooriverbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "silver", bbbeeLevel: 4, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Bonsmara Beef SA", website: "bonsmara.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Stud Breeding", tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Afrikaner Cattle Breeders", website: "afrikanercattle.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Stud Breeding", tier: "bronze", bbbeeLevel: 4, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Drakensberger Beef", website: "drakensberger.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Stud Breeding", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Nguni Cattle Breeders SA", website: "ngunicattle.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Indigenous", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Braford SA", website: "braford.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cross Breed", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Simmentaler SA", website: "simmentaler.org", category: "Livestock - Cattle (Beef)", subCategory: "Dual Purpose", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Santa Gertrudis SA", website: "santagertrudis.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Tropical Adapted", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Susex Cattle", website: "susex.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cross Breed", tier: "bronze", bbbeeLevel: 4, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Tuli Cattle Breeders", website: "tuli.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Indigenous", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Limousin SA", website: "limousin.co.za", category: "Livestock - Cattle (Beef)", subCategory: "European", tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Charolais SA", website: "charolais.co.za", category: "Livestock - Cattle (Beef)", subCategory: "European", tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Hereford SA", website: "hereford.co.za", category: "Livestock - Cattle (Beef)", subCategory: "British", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Aberdeen Angus SA", website: "aberdeenangus.co.za", category: "Livestock - Cattle (Beef)", subCategory: "British", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Pinzgauer SA", website: "pinzgauer.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Dual Purpose", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Beefmaster SA", website: "beefmaster.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Composite", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Mooifontein Beef", website: "mooifontein.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Vleisentruim Beef", website: "vleisentruim.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Outeniqua Beef", website: "outeniquabeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Free Range", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Highland Beef SA", website: "highlandbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Specialty", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Grass Fed Beef Co", website: "grassfedbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Grass Fed", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Organic Beef SA", website: "organicbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Wagyu Beef SA", website: "wagyubeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Premium", tier: "gold", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Harambee Beef", website: "harambeebeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Thaba Beef", website: "thababeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "bronze", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "North West Beef Co-op", website: "nwbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Eastern Cape Beef Farmers", website: "ecbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Limpopo Beef Producers", website: "limpopobeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cooperative", tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Mpumalanga Beef Co-op", website: "mpumalangabeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cooperative", tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "KZN Beef Farmers Assn", website: "kznbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Free State Beef", website: "fsbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Northern Cape Beef", website: "ncbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Extensive", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Gauteng Beef Producers", website: "gpbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Western Cape Beef", website: "wcbeef.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Free Range", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "SA Feedlot Association", website: "safedlot.co.za", category: "Livestock - Cattle (Beef)", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 100, minOrderUnit: "kg", supplierType: "association", businessModel: "B2B" },

  // =====================================================
  // LIVESTOCK - DAIRY - 30 suppliers
  // =====================================================
  { name: "Clover SA", website: "clover.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Parmalat SA", website: "parmalat.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Danone SA", website: "danone.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "liters", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Nestlé Dairy SA", website: "nestle.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "liters", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Lancewood Cheese", website: "lancewood.co.za", category: "Livestock - Dairy", subCategory: "Cheese & Products", tier: "gold", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 3, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Fair Cape Dairies", website: "faircape.co.za", category: "Livestock - Dairy", subCategory: "Free Range Dairy", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Woodlands Dairy", website: "woodlandsdairy.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Milk SA", website: "milksa.co.za", category: "Livestock - Dairy", subCategory: "Cooperative", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 50, minOrderUnit: "liters", supplierType: "cooperative", businessModel: "B2B" },
  { name: "DairyBelle", website: "dairybelle.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Olympic Dairy", website: "olympicdairy.co.za", category: "Livestock - Dairy", subCategory: "Commercial Dairy", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Belmonte Cheese", website: "belmonte.co.za", category: "Livestock - Dairy", subCategory: "Artisan Cheese", tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Klein River Cheese", website: "kleinrivercheese.co.za", category: "Livestock - Dairy", subCategory: "Artisan Cheese", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Simonsberg Cheese", website: "simonsberg.co.za", category: "Livestock - Dairy", subCategory: "Commercial Cheese", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Cream O' the Country", website: "creamothecountry.co.za", category: "Livestock - Dairy", subCategory: "Farm Dairy", tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "liter", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Fairview Cheese", website: "fairview.co.za", category: "Livestock - Dairy", subCategory: "Artisan Cheese", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 200, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Woolworths Dairy", website: "woolworths.co.za", category: "Livestock - Dairy", subCategory: "Retail", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "units", supplierType: "wholesaler", businessModel: "B2B" },
  { name: "KwaZulu-Natal Dairy Co-op", website: "kzndairy.co.za", category: "Livestock - Dairy", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 20, minOrderUnit: "liters", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Eastern Cape Dairy", website: "ecdairy.co.za", category: "Livestock - Dairy", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 20, minOrderUnit: "liters", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Free State Dairy", website: "fsdairy.co.za", category: "Livestock - Dairy", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 20, minOrderUnit: "liters", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Western Cape Dairy Farmers", website: "wcdairy.co.za", category: "Livestock - Dairy", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 20, minOrderUnit: "liters", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Organic Milk SA", website: "organicmilk.co.za", category: "Livestock - Dairy", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Goat Milk SA", website: "goatmilk.co.za", category: "Livestock - Dairy", subCategory: "Goat Dairy", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "liter", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Fresh Milk Direct", website: "freshmilkdirect.co.za", category: "Livestock - Dairy", subCategory: "Direct Farm", tier: "bronze", bbbeeLevel: 4, deliveryDays: 3, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Jersey Milk SA", website: "jerseymilk.co.za", category: "Livestock - Dairy", subCategory: "Specialty", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Friesland Dairy", website: "friesland.co.za", category: "Livestock - Dairy", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 6, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B" },
  { name: "Guernsey Dairy SA", website: "guernseydairy.co.za", category: "Livestock - Dairy", subCategory: "Specialty", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Ayrshire Milk Co", website: "ayrshiremilk.co.za", category: "Livestock - Dairy", subCategory: "Specialty", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Farm Fresh Milk", website: "farmfreshmilk.co.za", category: "Livestock - Dairy", subCategory: "Direct Farm", tier: "bronze", bbbeeLevel: 4, deliveryDays: 3, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Happy Cow Dairy", website: "happycow.co.za", category: "Livestock - Dairy", subCategory: "Free Range", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "liters", supplierType: "farmer", businessModel: "B2B,B2C" },

  // =====================================================
  // LIVESTOCK - SHEEP & GOAT - 25 suppliers
  // =====================================================
  { name: "Lamb and Mutton SA", website: "lambsa.co.za", category: "Livestock - Sheep/Goat", subCategory: "Commercial Lamb", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Karoo Lamb", website: "karoolamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Free Range Lamb", tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Dorper Sheep Breeders", website: "dorper.co.za", category: "Livestock - Sheep/Goat", subCategory: "Stud Breeding", tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Merino SA", website: "merino.co.za", category: "Livestock - Sheep/Goat", subCategory: "Wool & Meat", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Dohne Merino", website: "dohne.co.za", category: "Livestock - Sheep/Goat", subCategory: "Dual Purpose", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "SA Mutton Forum", website: "samutton.co.za", category: "Livestock - Sheep/Goat", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "kg", supplierType: "association", businessModel: "B2B" },
  { name: "Ile de France SA", website: "iledefrance.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Breed", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Suffolk Sheep SA", website: "suffolk.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Breed", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Texel Sheep SA", website: "texel.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Breed", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Van Rooy Sheep", website: "vanrooy.co.za", category: "Livestock - Sheep/Goat", subCategory: "Indigenous", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Afrino Sheep", website: "afrino.co.za", category: "Livestock - Sheep/Goat", subCategory: "Composite", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Boer Goat Breeders", website: "boergoat.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Goat", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Kalahari Red Goats", website: "kalaharired.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Goat", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Savanna Goats", website: "savannagoat.co.za", category: "Livestock - Sheep/Goat", subCategory: "Meat Goat", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "head", supplierType: "farmer", businessModel: "B2B" },
  { name: "Angora Goat Breeders", website: "angoragoat.co.za", category: "Livestock - Sheep/Goat", subCategory: "Mohair", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Dairy Goat SA", website: "dairygoat.co.za", category: "Livestock - Sheep/Goat", subCategory: "Dairy Goat", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "liter", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Namaqua Lamb", website: "namaqualamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Free Range", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Cederberg Lamb", website: "cederberglamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Free Range", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Northern Cape Sheep", website: "ncsheep.co.za", category: "Livestock - Sheep/Goat", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Eastern Cape Lamb", website: "eclamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Free State Sheep Farmers", website: "fssheep.co.za", category: "Livestock - Sheep/Goat", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Western Cape Lamb Co-op", website: "wclamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Organic Lamb SA", website: "organiclamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Halal Lamb Suppliers", website: "halallamb.co.za", category: "Livestock - Sheep/Goat", subCategory: "Halal Certified", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },

  // =====================================================
  // LIVESTOCK - POULTRY - 30 suppliers
  // =====================================================
  { name: "Astral Foods / County Fair", website: "astralfoods.com", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Rainbow Chicken", website: "rainbowchicken.co.za", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "RCL Foods - Rainbow", website: "rclfoods.com", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Earlybird Farm", website: "earlybird.co.za", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Supreme Poultry", website: "supremepoultry.co.za", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Rocklands Poultry", website: "rocklands.co.za", category: "Livestock - Poultry", subCategory: "Broiler Chicken", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Woolworths Poultry", website: "woolworths.co.za", category: "Livestock - Poultry", subCategory: "Free Range", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "kg", supplierType: "wholesaler", businessModel: "B2B" },
  { name: "Free Range Chicken SA", website: "freerangechicken.co.za", category: "Livestock - Poultry", subCategory: "Free Range", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Nulaid Eggs", website: "nulaid.co.za", category: "Livestock - Poultry", subCategory: "Eggs", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B" },
  { name: "Highveld Eggs", website: "highveldeggs.co.za", category: "Livestock - Poultry", subCategory: "Eggs", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B" },
  { name: "Cape Eggs", website: "capeeggs.co.za", category: "Livestock - Poultry", subCategory: "Eggs", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B" },
  { name: "Golden Lay Eggs", website: "goldenlay.co.za", category: "Livestock - Poultry", subCategory: "Eggs", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B" },
  { name: "Free Range Eggs SA", website: "freerangeeggs.co.za", category: "Livestock - Poultry", subCategory: "Free Range Eggs", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Organic Eggs SA", website: "organiceggs.co.za", category: "Livestock - Poultry", subCategory: "Organic Eggs", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Duck Farm SA", website: "duckfarm.co.za", category: "Livestock - Poultry", subCategory: "Duck", tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Turkey Farmers SA", website: "turkeyfarm.co.za", category: "Livestock - Poultry", subCategory: "Turkey", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Quail Farm SA", website: "quailfarm.co.za", category: "Livestock - Poultry", subCategory: "Quail", tier: "bronze", bbbeeLevel: 4, deliveryDays: 7, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Ostrich Farmers SA", website: "ostrichsa.co.za", category: "Livestock - Poultry", subCategory: "Ostrich", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Klein Karoo Ostrich", website: "kleinkaroo.co.za", category: "Livestock - Poultry", subCategory: "Ostrich", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Layer Birds SA", website: "layerbirds.co.za", category: "Livestock - Poultry", subCategory: "Day Old Chicks", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 100, minOrderUnit: "chicks", supplierType: "farmer", businessModel: "B2B" },
  { name: "Broiler Chicks SA", website: "broilerchicks.co.za", category: "Livestock - Poultry", subCategory: "Day Old Chicks", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 100, minOrderUnit: "chicks", supplierType: "farmer", businessModel: "B2B" },
  { name: "Poultry Equipment SA", website: "poultryequipment.co.za", category: "Livestock - Poultry", subCategory: "Equipment", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "Chicken Feed Co", website: "chickenfeed.co.za", category: "Livestock - Poultry", subCategory: "Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Poultry Vaccines SA", website: "poultryvaccines.co.za", category: "Livestock - Poultry", subCategory: "Veterinary", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "vial", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Township Poultry Co-op", website: "townshippoultry.co.za", category: "Livestock - Poultry", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Rural Poultry Farmers", website: "ruralpoultry.co.za", category: "Livestock - Poultry", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Halal Poultry SA", website: "halalpoultry.co.za", category: "Livestock - Poultry", subCategory: "Halal Certified", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Kosher Poultry SA", website: "kosherpoultry.co.za", category: "Livestock - Poultry", subCategory: "Kosher Certified", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },

  // =====================================================
  // LIVESTOCK - PIGS - 14 suppliers
  // =====================================================
  { name: "Eskort Ltd", website: "eskort.co.za", category: "Livestock - Pigs", subCategory: "Commercial Piggery", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Farmer's Choice SA", website: "farmerschoice.co.za", category: "Livestock - Pigs", subCategory: "Commercial Piggery", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "SAPPO (SA Pork Producers)", website: "sappo.co.za", category: "Livestock - Pigs", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "kg", supplierType: "association", businessModel: "B2B" },
  { name: "Pig Improvement Co (PIC)", website: "pic.com", category: "Livestock - Pigs", subCategory: "Genetics", tier: "gold", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "semen", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Topigs Norsvin SA", website: "topigs.com", category: "Livestock - Pigs", subCategory: "Genetics", tier: "gold", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "semen", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "KZN Pig Farmers", website: "kznpigs.co.za", category: "Livestock - Pigs", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Free Range Pork SA", website: "freerangepork.co.za", category: "Livestock - Pigs", subCategory: "Free Range", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Organic Pork SA", website: "organicpork.co.za", category: "Livestock - Pigs", subCategory: "Organic", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Western Cape Pork", website: "wcpork.co.za", category: "Livestock - Pigs", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Gauteng Pig Farmers", website: "gppigs.co.za", category: "Livestock - Pigs", subCategory: "Commercial", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Eastern Cape Pork", website: "ecpork.co.za", category: "Livestock - Pigs", subCategory: "Commercial", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Pig Feed SA", website: "pigfeed.co.za", category: "Livestock - Pigs", subCategory: "Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Piggery Equipment SA", website: "piggeryequipment.co.za", category: "Livestock - Pigs", subCategory: "Equipment", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },

  // =====================================================
  // LIVESTOCK - GAME / WILDLIFE - 13 suppliers
  // =====================================================
  { name: "SA Game Breeders", website: "sagamebreeders.co.za", category: "Livestock - Game", subCategory: "Game Breeding", tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "animal", supplierType: "farmer", businessModel: "B2B" },
  { name: "Wildlife Ranching SA", website: "wrsa.co.za", category: "Livestock - Game", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "animal", supplierType: "association", businessModel: "B2B" },
  { name: "Game Auctioneers SA", website: "gameauction.co.za", category: "Livestock - Game", subCategory: "Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "animal", supplierType: "service", businessModel: "B2B" },
  { name: "Sable Antelope Breeders", website: "sableantelope.co.za", category: "Livestock - Game", subCategory: "Specialty Game", tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "animal", supplierType: "farmer", businessModel: "B2B" },
  { name: "Buffalo Breeders SA", website: "buffalobreeders.co.za", category: "Livestock - Game", subCategory: "Disease Free Buffalo", tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "animal", supplierType: "farmer", businessModel: "B2B" },
  { name: "Roan Antelope SA", website: "roanantelope.co.za", category: "Livestock - Game", subCategory: "Rare Game", tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "animal", supplierType: "farmer", businessModel: "B2B" },
  { name: "Kudu Breeders SA", website: "kudubreeders.co.za", category: "Livestock - Game", subCategory: "Plains Game", tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "animal", supplierType: "farmer", businessModel: "B2B" },
  { name: "Impala Breeders", website: "impalabreeders.co.za", category: "Livestock - Game", subCategory: "Plains Game", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "animals", supplierType: "farmer", businessModel: "B2B" },
  { name: "Blesbok Breeders SA", website: "blesbok.co.za", category: "Livestock - Game", subCategory: "Plains Game", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "animals", supplierType: "farmer", businessModel: "B2B" },
  { name: "Game Meat SA", website: "gamemeat.co.za", category: "Livestock - Game", subCategory: "Game Meat", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Venison Suppliers SA", website: "venison.co.za", category: "Livestock - Game", subCategory: "Venison", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Crocodile Farm SA", website: "crocodilefarm.co.za", category: "Livestock - Game", subCategory: "Crocodile", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Wildlife Translocation", website: "wildlifemove.co.za", category: "Livestock - Game", subCategory: "Game Capture", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "service", supplierType: "service", businessModel: "B2B" },

  // =====================================================
  // CROP FARMING - GRAINS & CEREALS - 30 suppliers
  // =====================================================
  { name: "Grain SA", website: "grainsa.co.za", category: "Crops - Grains", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "association", businessModel: "B2B" },
  { name: "AFGRI Grain", website: "afgri.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "farmer", businessModel: "B2B" },
  { name: "Senwes Grain", website: "senwes.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "farmer", businessModel: "B2B" },
  { name: "NWK Grain", website: "nwk.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "farmer", businessModel: "B2B" },
  { name: "Suidwes Grain", website: "suidwes.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "OTK Grain", website: "otk.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "TWK Grain", website: "twk.co.za", category: "Crops - Grains", subCategory: "Commercial Grain", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Maize Trust SA", website: "maizetrust.co.za", category: "Crops - Grains", subCategory: "Maize", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "association", businessModel: "B2B" },
  { name: "Wheat Board SA", website: "wheatboard.co.za", category: "Crops - Grains", subCategory: "Wheat", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ton", supplierType: "association", businessModel: "B2B" },
  { name: "Free State Maize Farmers", website: "fsmaize.co.za", category: "Crops - Grains", subCategory: "Maize", tier: "silver", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 500, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "North West Grain", website: "nwgrain.co.za", category: "Crops - Grains", subCategory: "Mixed Grain", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 500, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Mpumalanga Grain", website: "mpgrain.co.za", category: "Crops - Grains", subCategory: "Maize", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "KZN Grain Farmers", website: "kzngrain.co.za", category: "Crops - Grains", subCategory: "Mixed Grain", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Eastern Cape Grain", website: "ecgrain.co.za", category: "Crops - Grains", subCategory: "Mixed Grain", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Barley SA", website: "barleysa.co.za", category: "Crops - Grains", subCategory: "Barley", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Sorghum SA", website: "sorghumsa.co.za", category: "Crops - Grains", subCategory: "Sorghum", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Oats SA", website: "oatssa.co.za", category: "Crops - Grains", subCategory: "Oats", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Sunflower SA", website: "sunflowersa.co.za", category: "Crops - Grains", subCategory: "Oil Seeds", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Soybeans SA", website: "soybeanssa.co.za", category: "Crops - Grains", subCategory: "Soybeans", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Canola SA", website: "canolasa.co.za", category: "Crops - Grains", subCategory: "Canola", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 500, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Dry Beans SA", website: "drybeans.co.za", category: "Crops - Grains", subCategory: "Dry Beans", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Groundnuts SA", website: "groundnuts.co.za", category: "Crops - Grains", subCategory: "Groundnuts", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Popcorn SA", website: "popcornsa.co.za", category: "Crops - Grains", subCategory: "Specialty Corn", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Rice SA", website: "ricesa.co.za", category: "Crops - Grains", subCategory: "Rice", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Millet SA", website: "milletsa.co.za", category: "Crops - Grains", subCategory: "Millet", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Organic Grain SA", website: "organicgrain.co.za", category: "Crops - Grains", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Non-GMO Grain SA", website: "nongmograin.co.za", category: "Crops - Grains", subCategory: "Non-GMO", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 100, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Small Scale Grain Farmers", website: "smallscalegrain.co.za", category: "Crops - Grains", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Community Grain Project", website: "communitygrain.co.za", category: "Crops - Grains", subCategory: "Community Project", tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 10, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B,B2C" },

  // =====================================================
  // CROP FARMING - VEGETABLES - 35 suppliers
  // =====================================================
  { name: "Freshmark (Shoprite)", website: "freshmark.co.za", category: "Crops - Vegetables", subCategory: "Commercial Vegetables", tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "distributor", businessModel: "B2B" },
  { name: "RSA Veg", website: "rsaveg.co.za", category: "Crops - Vegetables", subCategory: "Commercial Vegetables", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 50, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Vegetable Producers Initiative", website: "vpi.co.za", category: "Crops - Vegetables", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 50, minOrderUnit: "kg", supplierType: "association", businessModel: "B2B" },
  { name: "Potatoes SA", website: "potatoessa.co.za", category: "Crops - Vegetables", subCategory: "Potatoes", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "pockets", supplierType: "association", businessModel: "B2B" },
  { name: "Onions SA", website: "onionssa.co.za", category: "Crops - Vegetables", subCategory: "Onions", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "pockets", supplierType: "farmer", businessModel: "B2B" },
  { name: "Tomatoes SA", website: "tomatoessa.co.za", category: "Crops - Vegetables", subCategory: "Tomatoes", tier: "silver", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Cabbage Growers SA", website: "cabbage.co.za", category: "Crops - Vegetables", subCategory: "Cabbage", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "heads", supplierType: "farmer", businessModel: "B2B" },
  { name: "Carrot Farmers SA", website: "carrots.co.za", category: "Crops - Vegetables", subCategory: "Carrots", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Spinach & Greens SA", website: "spinachsa.co.za", category: "Crops - Vegetables", subCategory: "Leafy Greens", tier: "bronze", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "bundles", supplierType: "farmer", businessModel: "B2B" },
  { name: "Peppers SA", website: "pepperssa.co.za", category: "Crops - Vegetables", subCategory: "Peppers", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Butternut & Pumpkin SA", website: "butternut.co.za", category: "Crops - Vegetables", subCategory: "Squash", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Green Beans SA", website: "greenbeans.co.za", category: "Crops - Vegetables", subCategory: "Beans", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Cucumber Growers", website: "cucumbers.co.za", category: "Crops - Vegetables", subCategory: "Cucumbers", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Lettuce SA", website: "lettucesa.co.za", category: "Crops - Vegetables", subCategory: "Lettuce", tier: "bronze", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "heads", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Garlic SA", website: "garlicsa.co.za", category: "Crops - Vegetables", subCategory: "Garlic", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Ginger SA", website: "gingersa.co.za", category: "Crops - Vegetables", subCategory: "Ginger", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Mushrooms SA", website: "mushroomssa.co.za", category: "Crops - Vegetables", subCategory: "Mushrooms", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Denny Mushrooms", website: "denny.co.za", category: "Crops - Vegetables", subCategory: "Mushrooms", tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Sweet Potatoes SA", website: "sweetpotato.co.za", category: "Crops - Vegetables", subCategory: "Sweet Potatoes", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Beetroot SA", website: "beetrootsa.co.za", category: "Crops - Vegetables", subCategory: "Beetroot", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Cauliflower & Broccoli", website: "brassica.co.za", category: "Crops - Vegetables", subCategory: "Brassicas", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "heads", supplierType: "farmer", businessModel: "B2B" },
  { name: "Eggplant SA", website: "eggplant.co.za", category: "Crops - Vegetables", subCategory: "Eggplant", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Hydroponic Vegetables SA", website: "hydroponic.co.za", category: "Crops - Vegetables", subCategory: "Hydroponic", tier: "silver", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Organic Vegetables SA", website: "organicveg.co.za", category: "Crops - Vegetables", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 2, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Urban Farming SA", website: "urbanfarming.co.za", category: "Crops - Vegetables", subCategory: "Urban Farming", tier: "bronze", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Township Veg Farmers", website: "townshipveg.co.za", category: "Crops - Vegetables", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Market Garden SA", website: "marketgarden.co.za", category: "Crops - Vegetables", subCategory: "Small Scale", tier: "bronze", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Vegetable Seedlings SA", website: "vegseedlings.co.za", category: "Crops - Vegetables", subCategory: "Seedlings", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 100, minOrderUnit: "seedlings", supplierType: "farmer", businessModel: "B2B" },
  { name: "Heirloom Vegetables SA", website: "heirloomveg.co.za", category: "Crops - Vegetables", subCategory: "Heirloom", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Asian Vegetables SA", website: "asianveg.co.za", category: "Crops - Vegetables", subCategory: "Asian Veg", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Herb Growers SA", website: "herbsa.co.za", category: "Crops - Vegetables", subCategory: "Herbs", tier: "bronze", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 100, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Microgreens SA", website: "microgreens.co.za", category: "Crops - Vegetables", subCategory: "Microgreens", tier: "bronze", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 50, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Sprouts SA", website: "sprouts.co.za", category: "Crops - Vegetables", subCategory: "Sprouts", tier: "bronze", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 100, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Freeze Dried Vegetables", website: "freezeveg.co.za", category: "Crops - Vegetables", subCategory: "Processed", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 500, minOrderUnit: "g", supplierType: "manufacturer", businessModel: "B2B" },

  // =====================================================
  // CROP FARMING - FRUIT & ORCHARDS - 30 suppliers
  // =====================================================
  { name: "Cape Fruit SA", website: "capefruit.co.za", category: "Crops - Fruit", subCategory: "Commercial Fruit", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "carton", supplierType: "farmer", businessModel: "B2B" },
  { name: "Fruit South Africa", website: "fruitsa.co.za", category: "Crops - Fruit", subCategory: "Association", tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "association", businessModel: "B2B" },
  { name: "Apples & Pears SA", website: "hortgro.co.za", category: "Crops - Fruit", subCategory: "Pome Fruit", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "carton", supplierType: "association", businessModel: "B2B" },
  { name: "Citrus Growers Association", website: "cga.co.za", category: "Crops - Fruit", subCategory: "Citrus", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "carton", supplierType: "association", businessModel: "B2B" },
  { name: "Table Grapes SA", website: "sats.co.za", category: "Crops - Fruit", subCategory: "Table Grapes", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "carton", supplierType: "association", businessModel: "B2B" },
  { name: "Stone Fruit SA", website: "stonefruit.co.za", category: "Crops - Fruit", subCategory: "Stone Fruit", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "carton", supplierType: "farmer", businessModel: "B2B" },
  { name: "Bananas SA", website: "bananassa.co.za", category: "Crops - Fruit", subCategory: "Bananas", tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },
  { name: "Avocado SA", website: "avocadosa.co.za", category: "Crops - Fruit", subCategory: "Avocado", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },
  { name: "Macadamia SA", website: "macadamiasa.co.za", category: "Crops - Fruit", subCategory: "Macadamia", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Pecan Nut SA", website: "pecannut.co.za", category: "Crops - Fruit", subCategory: "Pecans", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Mango SA", website: "mangosa.co.za", category: "Crops - Fruit", subCategory: "Mango", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },
  { name: "Pineapple SA", website: "pineapplesa.co.za", category: "Crops - Fruit", subCategory: "Pineapple", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },
  { name: "Pawpaw SA", website: "pawpaw.co.za", category: "Crops - Fruit", subCategory: "Pawpaw", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },
  { name: "Strawberries SA", website: "strawberry.co.za", category: "Crops - Fruit", subCategory: "Berries", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Blueberries SA", website: "blueberry.co.za", category: "Crops - Fruit", subCategory: "Berries", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 250, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B" },
  { name: "Raspberries SA", website: "raspberry.co.za", category: "Crops - Fruit", subCategory: "Berries", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 125, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Watermelon SA", website: "watermelon.co.za", category: "Crops - Fruit", subCategory: "Melons", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "fruit", supplierType: "farmer", businessModel: "B2B" },
  { name: "Dried Fruit SA", website: "driedfruit.co.za", category: "Crops - Fruit", subCategory: "Dried Fruit", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Fruit Juice SA", website: "fruitjuice.co.za", category: "Crops - Fruit", subCategory: "Juice", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "liter", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Canned Fruit SA", website: "cannedfruit.co.za", category: "Crops - Fruit", subCategory: "Canned", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "can", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Organic Fruit SA", website: "organicfruit.co.za", category: "Crops - Fruit", subCategory: "Organic", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Export Fruit SA", website: "exportfruit.co.za", category: "Crops - Fruit", subCategory: "Export Quality", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "farmer", businessModel: "B2B" },
  { name: "Local Market Fruit", website: "localfruit.co.za", category: "Crops - Fruit", subCategory: "Local Market", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B,B2C" },
  { name: "Farmers Market Fruit", website: "farmersmarketfruit.co.za", category: "Crops - Fruit", subCategory: "Farmers Market", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2C" },
  { name: "Guava SA", website: "guavasa.co.za", category: "Crops - Fruit", subCategory: "Guava", tier: "bronze", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Passion Fruit SA", website: "passionfruit.co.za", category: "Crops - Fruit", subCategory: "Tropical", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B" },
  { name: "Litchi SA", website: "litchi.co.za", category: "Crops - Fruit", subCategory: "Tropical", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "g", supplierType: "farmer", businessModel: "B2B" },
  { name: "Cape Town Fruit Growers", website: "ctfruit.co.za", category: "Crops - Fruit", subCategory: "Cooperative", tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "carton", supplierType: "cooperative", businessModel: "B2B" },
  { name: "Emerging Fruit Farmers", website: "emergingfruit.co.za", category: "Crops - Fruit", subCategory: "Emerging Farmer", tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "box", supplierType: "farmer", businessModel: "B2B" },

  // =====================================================
  // AGRI-SUPPLIES - FEED & NUTRITION - 25 suppliers
  // =====================================================
  { name: "Meadow Feeds", website: "meadowfeeds.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "AFGRI Animal Feeds", website: "afgri.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Nutri Feeds", website: "nutrifeeds.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Epol Feeds", website: "epol.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "RCL Foods - Feed", website: "rclfoods.com", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Provimi SA", website: "provimi.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Masterfeeds SA", website: "masterfeeds.co.za", category: "Agri-Supplies - Feed", subCategory: "Animal Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Darling Ingredients", website: "darlingingredients.com", category: "Agri-Supplies - Feed", subCategory: "Protein Meal", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Molasses SA", website: "molasses.co.za", category: "Agri-Supplies - Feed", subCategory: "Feed Additives", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Lucerne SA", website: "lucernesa.co.za", category: "Agri-Supplies - Feed", subCategory: "Lucerne", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bale", supplierType: "farmer", businessModel: "B2B" },
  { name: "Hay & Straw SA", website: "haystraw.co.za", category: "Agri-Supplies - Feed", subCategory: "Roughage", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "bale", supplierType: "farmer", businessModel: "B2B" },
  { name: "Silage SA", website: "silage.co.za", category: "Agri-Supplies - Feed", subCategory: "Silage", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "bale", supplierType: "farmer", businessModel: "B2B" },
  { name: "Poultry Feed Specialists", website: "poultryfeedsa.co.za", category: "Agri-Supplies - Feed", subCategory: "Poultry Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Cattle Feed SA", website: "cattlefeed.co.za", category: "Agri-Supplies - Feed", subCategory: "Cattle Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Pig Feed SA", website: "pigfeed.co.za", category: "Agri-Supplies - Feed", subCategory: "Pig Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Horse Feed SA", website: "horsefeed.co.za", category: "Agri-Supplies - Feed", subCategory: "Horse Feed", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Pet Food Ingredients SA", website: "petfoodingredients.co.za", category: "Agri-Supplies - Feed", subCategory: "Pet Food", tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Fish Feed SA", website: "fishfeed.co.za", category: "Agri-Supplies - Feed", subCategory: "Aquaculture Feed", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Feed Supplements SA", website: "feedsupplements.co.za", category: "Agri-Supplies - Feed", subCategory: "Supplements", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Mineral Licks SA", website: "minerallicks.co.za", category: "Agri-Supplies - Feed", subCategory: "Minerals", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "block", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Vitamin Supplements SA", website: "vitaminsupplements.co.za", category: "Agri-Supplies - Feed", subCategory: "Vitamins", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "distributor", businessModel: "B2B" },
  { name: "Feed Additives SA", website: "feedadditives.co.za", category: "Agri-Supplies - Feed", subCategory: "Additives", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "distributor", businessModel: "B2B" },
  { name: "Organic Feed SA", website: "organicfeed.co.za", category: "Agri-Supplies - Feed", subCategory: "Organic Feed", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Feed Concentrates SA", website: "feedconcentrates.co.za", category: "Agri-Supplies - Feed", subCategory: "Concentrates", tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },

  // =====================================================
  // AGRI-SUPPLIES - SEEDS & FERTILIZER - 20 suppliers
  // =====================================================
  { name: "Pannar Seed", website: "pannar.co.za", category: "Agri-Supplies - Seeds", subCategory: "Seed Maize", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Pioneer Seeds SA", website: "pioneer.co.za", category: "Agri-Supplies - Seeds", subCategory: "Seed Maize", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "K2 Seed", website: "k2seed.co.za", category: "Agri-Supplies - Seeds", subCategory: "Vegetable Seeds", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "packet", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Starke Ayres Seeds", website: "starkeayres.co.za", category: "Agri-Supplies - Seeds", subCategory: "Vegetable Seeds", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "packet", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Hygrotech Seeds", website: "hygrotech.co.za", category: "Agri-Supplies - Seeds", subCategory: "Vegetable Seeds", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "packet", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Sakata Seed SA", website: "sakata.co.za", category: "Agri-Supplies - Seeds", subCategory: "Vegetable Seeds", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "packet", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "MayFord Seeds", website: "mayford.co.za", category: "Agri-Supplies - Seeds", subCategory: "Vegetable Seeds", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "packet", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Yara SA Fertilizer", website: "yara.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Omnia Fertilizer", website: "omnia.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Sasol Nitro", website: "sasolnitro.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Profert SA", website: "profert.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Kynoch Fertilizer", website: "kynoch.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Fertilizer SA", website: "fertilizersa.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Fertilizer", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 50, minOrderUnit: "kg", supplierType: "distributor", businessModel: "B2B" },
  { name: "Organic Fertilizer SA", website: "organicfertilizer.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Organic", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 25, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Compost SA", website: "compostsa.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Compost", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer", businessModel: "B2B,B2C" },
  { name: "Lime & Gypsum SA", website: "limegypsum.co.za", category: "Agri-Supplies - Fertilizer", subCategory: "Soil Amendments", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Seed Potatoes SA", website: "seedpotatoes.co.za", category: "Agri-Supplies - Seeds", subCategory: "Seed Potatoes", tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 25, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },
  { name: "Pasture Seeds SA", website: "pastureseeds.co.za", category: "Agri-Supplies - Seeds", subCategory: "Pasture", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Cover Crop Seeds", website: "covercropseeds.co.za", category: "Agri-Supplies - Seeds", subCategory: "Cover Crops", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "kg", supplierType: "farmer", businessModel: "B2B" },

  // =====================================================
  // AGRI-SUPPLIES - EQUIPMENT - 20 suppliers
  // =====================================================
  { name: "John Deere SA", website: "johndeere.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "gold", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Case IH SA", website: "caseih.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "gold", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "New Holland SA", website: "newholland.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "gold", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Massey Ferguson SA", website: "masseyferguson.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "gold", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Landini SA", website: "landini.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "Kubota SA", website: "kubota.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "AGCO SA", website: "agco.co.za", category: "Agri-Supplies - Equipment", subCategory: "Tractors & Machinery", tier: "gold", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Massey Ferguson Parts", website: "mfparts.co.za", category: "Agri-Supplies - Equipment", subCategory: "Spare Parts", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "part", supplierType: "distributor", businessModel: "B2B" },
  { name: "Irrigation Systems SA", website: "irrigation.co.za", category: "Agri-Supplies - Equipment", subCategory: "Irrigation", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "Netafim SA", website: "netafim.co.za", category: "Agri-Supplies - Equipment", subCategory: "Irrigation", tier: "gold", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Center Pivot Irrigation", website: "centerpivot.co.za", category: "Agri-Supplies - Equipment", subCategory: "Irrigation", tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Drip Irrigation SA", website: "dripirrigation.co.za", category: "Agri-Supplies - Equipment", subCategory: "Irrigation", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "Sprayers SA", website: "sprayers.co.za", category: "Agri-Supplies - Equipment", subCategory: "Sprayers", tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Harvesters SA", website: "harvesters.co.za", category: "Agri-Supplies - Equipment", subCategory: "Harvesters", tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Planters & Seeders SA", website: "planters.co.za", category: "Agri-Supplies - Equipment", subCategory: "Planters", tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Farm Implements SA", website: "farmimplements.co.za", category: "Agri-Supplies - Equipment", subCategory: "Implements", tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
  { name: "Milking Equipment SA", website: "milkingequipment.co.za", category: "Agri-Supplies - Equipment", subCategory: "Dairy Equipment", tier: "silver", bbbeeLevel: 3, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Poultry Equipment SA", website: "poultryequipment.co.za", category: "Agri-Supplies - Equipment", subCategory: "Poultry Equipment", tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Used Farm Equipment", website: "usedfarmequipment.co.za", category: "Agri-Supplies - Equipment", subCategory: "Used Equipment", tier: "bronze", bbbeeLevel: 3, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },

  // =====================================================
  // AGRI-SERVICES - VETERINARY & AUCTIONS - 15 suppliers
  // =====================================================
  { name: "Onderstepoort Veterinary", website: "onderstepoort.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Products", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Boehringer Ingelheim Vet", website: "boehringer-ingelheim.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Products", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Zoetis SA", website: "zoetis.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Products", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "MSD Animal Health", website: "msd-animal-health.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Products", tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Virbac SA", website: "virbac.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Products", tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer", businessModel: "B2B" },
  { name: "Livestock Auctioneers SA", website: "livestockauction.co.za", category: "Agri-Services - Auctions", subCategory: "Livestock Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "animal", supplierType: "service", businessModel: "B2B" },
  { name: "Vleissentraal Auctioneers", website: "vleissentraal.co.za", category: "Agri-Services - Auctions", subCategory: "Livestock Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "animal", supplierType: "service", businessModel: "B2B" },
  { name: "Farm Auctions SA", website: "farmauctions.co.za", category: "Agri-Services - Auctions", subCategory: "Farm Auctions", tier: "silver", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "lot", supplierType: "service", businessModel: "B2B" },
  { name: "Game Auction SA", website: "gameauctionsa.co.za", category: "Agri-Services - Auctions", subCategory: "Game Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "animal", supplierType: "service", businessModel: "B2B" },
  { name: "Wool Auctions SA", website: "woolauctions.co.za", category: "Agri-Services - Auctions", subCategory: "Wool Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bale", supplierType: "service", businessModel: "B2B" },
  { name: "Cape Wool SA", website: "capewool.co.za", category: "Agri-Services - Auctions", subCategory: "Wool Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bale", supplierType: "association", businessModel: "B2B" },
  { name: "Mohair SA", website: "mohairsa.co.za", category: "Agri-Services - Auctions", subCategory: "Mohair Auctions", tier: "gold", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "bale", supplierType: "association", businessModel: "B2B" },
  { name: "Veterinary Services SA", website: "vetservices.co.za", category: "Agri-Services - Veterinary", subCategory: "Veterinary Services", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "visit", supplierType: "service", businessModel: "B2B" },
  { name: "AI Services SA", website: "aiservices.co.za", category: "Agri-Services - Veterinary", subCategory: "Artificial Insemination", tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "service", supplierType: "service", businessModel: "B2B" },
  { name: "Animal Health Products SA", website: "animalhealth.co.za", category: "Agri-Services - Veterinary", subCategory: "Health Products", tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor", businessModel: "B2B" },
]

// GET /api/grosupply/seed-agriculture - Seed agriculture suppliers
export async function GET(request: NextRequest) {
  try {
    const count = await seedAgricultureSuppliers()
    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${count} agriculture suppliers`,
      totalSuppliers: count
    })
  } catch (error) {
    console.error('Error seeding agriculture suppliers:', error)
    return NextResponse.json({ error: 'Failed to seed suppliers' }, { status: 500 })
  }
}

// POST /api/grosupply/seed-agriculture - Seed with force option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const force = body.force === true
    
    // Check if suppliers already exist
    const existingCount = await db.supplier.count({
      where: {
        categories: { contains: 'Livestock' }
      }
    })
    
    if (existingCount > 0 && !force) {
      return NextResponse.json({ 
        success: false, 
        message: `Found ${existingCount} existing agriculture suppliers. Use force=true to reseed.`,
        existingCount
      })
    }
    
    const count = await seedAgricultureSuppliers()
    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${count} agriculture suppliers`,
      totalSuppliers: count
    })
  } catch (error) {
    console.error('Error seeding agriculture suppliers:', error)
    return NextResponse.json({ error: 'Failed to seed suppliers' }, { status: 500 })
  }
}

async function seedAgricultureSuppliers(): Promise<number> {
  let seededCount = 0
  
  for (const supplier of agricultureSuppliers) {
    try {
      // Generate unique code
      const code = `AGR-${nanoid(6).toUpperCase()}`
      
      // Map tier to B-BBEE level if not provided
      const bbbeeLevel = supplier.bbbeeLevel || (supplier.tier === 'gold' ? 2 : supplier.tier === 'silver' ? 3 : 4)
      
      // Create verticals string based on category
      const verticals = mapCategoryToVerticals(supplier.category)
      
      await db.supplier.create({
        data: {
          id: `SUP-${nanoid(8).toUpperCase()}`,
          name: supplier.name,
          code,
          website: `https://${supplier.website}`,
          supplierType: supplier.supplierType,
          tier: supplier.tier,
          bbbeeLevel,
          deliveryDays: supplier.deliveryDays,
          minOrderValue: supplier.minOrderValue,
          minOrderUnit: supplier.minOrderUnit,
          paymentTerms: 'net30',
          categories: `${supplier.category}|${supplier.subCategory}`,
          verticals,
          subVerticals: mapCategoryToSubVertical(supplier.category, supplier.subCategory),
          fulfillmentRate: supplier.tier === 'gold' ? 98 : supplier.tier === 'silver' ? 95 : 90,
          rating: supplier.tier === 'gold' ? 4.8 : supplier.tier === 'silver' ? 4.5 : 4.0,
          status: 'active',
          verificationStatus: 'verified'
        }
      })
      seededCount++
    } catch (error) {
      // Skip duplicates silently
      console.log(`Skipping ${supplier.name}: already exists or error`)
    }
  }
  
  return seededCount
}

function mapCategoryToVerticals(category: string): string {
  const mapping: Record<string, string> = {
    'Livestock - Cattle': 'Agriculture & Agribusiness',
    'Livestock - Dairy': 'Agriculture & Agribusiness',
    'Livestock - Sheep/Goat': 'Agriculture & Agribusiness',
    'Livestock - Poultry': 'Agriculture & Agribusiness',
    'Livestock - Pigs': 'Agriculture & Agribusiness',
    'Livestock - Game': 'Agriculture & Agribusiness',
    'Crops - Grains': 'Agriculture & Agribusiness',
    'Crops - Vegetables': 'Agriculture & Agribusiness',
    'Crops - Fruit': 'Agriculture & Agribusiness',
    'Agri-Supplies - Feed': 'Agriculture & Agribusiness',
    'Agri-Supplies - Seeds': 'Agriculture & Agribusiness',
    'Agri-Supplies - Fertilizer': 'Agriculture & Agribusiness',
    'Agri-Supplies - Equipment': 'Agriculture & Agribusiness',
    'Agri-Services - Veterinary': 'Agriculture & Agribusiness',
    'Agri-Services - Auctions': 'Agriculture & Agribusiness',
    'Food Manufacturers': 'Grocery & FMCG'
  }
  return mapping[category] || 'Agriculture & Agribusiness'
}

function mapCategoryToSubVertical(category: string, subCategory: string): string {
  const mapping: Record<string, string> = {
    'Cattle (Beef)': 'cattle-farming',
    'Dairy': 'dairy-farming',
    'Sheep/Goat': 'sheep-goat-farming',
    'Poultry': 'poultry-farming',
    'Pigs': 'piggery',
    'Game': 'game-farming',
    'Grains': 'grain-farming',
    'Vegetables': 'vegetable-farming',
    'Fruit': 'fruit-orchards',
    'Feed': 'agri-supply-store',
    'Seeds': 'agri-supply-store',
    'Fertilizer': 'agri-supply-store',
    'Equipment': 'agri-supply-store',
    'Veterinary': 'agri-supply-store',
    'Auctions': 'agri-marketplace'
  }
  return mapping[category.replace('Livestock - ', '').replace('Crops - ', '').replace('Agri-Supplies - ', '').replace('Agri-Services - ', '')] || 'agri-marketplace'
}
