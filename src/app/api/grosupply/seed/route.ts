import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Supplier data parsed from Excel - comprehensive list with vertical alignment
const supplierData = [
  { name: "SAB (AB InBev SA)", website: "sabmiller.co.za", verticals: ["Food & Bev", "Liquor & Nightlife"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Heineken Beverages SA", website: "heineken.co.za", verticals: ["Food & Bev", "Liquor & Nightlife"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Distell Group", website: "distell.co.za", verticals: ["Liquor & Nightlife"], tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Diageo SA", website: "diageo.com", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 3, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "Pernod Ricard SA", website: "pernod-ricard.com", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "Brown-Forman SA", website: "brown-forman.com", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "importer" },
  { name: "Tiger Brands", website: "tigerbrands.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Pioneer Foods (PepsiCo)", website: "pioneerfoodssa.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Premier Foods", website: "premierfm.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Clover SA", website: "clover.co.za", verticals: ["Grocery & FMCG", "Hospitality"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Coca-Cola Beverages SA", website: "coca-colabeverages.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "tray", supplierType: "manufacturer" },
  { name: "Unilever SA", website: "unilever.co.za", verticals: ["Grocery & FMCG", "Health & Beauty"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Illovo Sugar (Huletts)", website: "illovo.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 2, minOrderUnit: "bags", supplierType: "manufacturer" },
  { name: "Astral Foods / County Fair", website: "astralfoods.com", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Rainbow Chicken", website: "rainbowchicken.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Karan Beef", website: "karanbeef.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer" },
  { name: "Eskort Ltd", website: "eskort.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Oceana Group", website: "oceana.co.za", verticals: ["Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "cans", supplierType: "manufacturer" },
  { name: "Quantum Foods", website: "quantumfoods.co.za", verticals: ["Grocery & FMCG", "Hospitality"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "tray", supplierType: "farmer" },
  { name: "PPC Cement", website: "ppc.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer" },
  { name: "Holcim SA (Lafarge)", website: "lafarge.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer" },
  { name: "Corobrik", website: "corobrik.com", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1000, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Cape Gate Steel", website: "capegate.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "bars", supplierType: "manufacturer" },
  { name: "Plascon SA", website: "plascon.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bucket", supplierType: "manufacturer" },
  { name: "AkzoNobel SA (Dulux)", website: "dulux.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bucket", supplierType: "manufacturer" },
  { name: "Marley Pipe Systems", website: "marley.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "lengths", supplierType: "manufacturer" },
  { name: "Aberdare Cables", website: "aberdare.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "roll", supplierType: "manufacturer" },
  { name: "Sika SA", website: "sika.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Bosch SA", website: "bosch.co.za", verticals: ["Hardware & Building", "Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Bata Industrial", website: "bata.co.za", verticals: ["Hardware & Building", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "pair", supplierType: "manufacturer" },
  { name: "L'Oréal SA Professional", website: "loreal.co.za", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "tubes", supplierType: "manufacturer" },
  { name: "Wella Professional (P&G)", website: "wella.co.za", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "tubes", supplierType: "manufacturer" },
  { name: "Lycon SA", website: "lycon.com.au", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "Nail Supplies SA", website: "nailsupplies.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Barber Supplies SA", website: "barbersupplies.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Tattoo Supplies SA", website: "tattoosupplies.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Adcock Ingram", website: "adcock.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 24, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Aspen Pharmacare", website: "aspenpharma.com", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 24, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Pfizer SA", website: "pfizer.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "USN SA", website: "usn.co.za", verticals: ["Health & Pharmacy", "Sport & Leisure"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Vital Health Foods", website: "vital.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Heavenly Amenities", website: "heavenlyamenities.co.za", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 50, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Linen SA", website: "linenco.co.za", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "pack", supplierType: "manufacturer" },
  { name: "Bidvest Catering Supplies", website: "bidvest.co.za", verticals: ["Food & Bev", "Hospitality"], tier: "gold", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Bidpaper Plus", website: "bidpaper.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 500, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Samsung SA", website: "samsung.com/za", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Apple SA / iStore", website: "istore.co.za", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Logitech SA", website: "logitech.com", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "units", supplierType: "distributor" },
  { name: "HP SA", website: "hp.com/za", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Lenovo SA", website: "lenovo.com/za", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Trojan Sports SA", website: "trojansports.co.za", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "adidas SA", website: "adidas.co.za", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Gray-Nicolls SA", website: "graynicolls.co.za", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 3, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Funeralware SA", website: "funeralware.co.za", verticals: ["Professional Services"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Castrol SA", website: "castrol.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Willard Batteries", website: "willard.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Kazang (Mastercard)", website: "kazang.co.za", verticals: ["Grocery & FMCG", "All Verticals"], tier: "gold", bbbeeLevel: 1, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Kimberly-Clark SA", website: "huggies.co.za", verticals: ["Childcare & Education"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pack", supplierType: "manufacturer" },
  { name: "Nestlé SA", website: "nestle.co.za", verticals: ["Childcare & Education", "Hospitality"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Faber-Castell SA", website: "faber-castell.co.za", verticals: ["Childcare & Education"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Sappi SA", website: "sappi.com", verticals: ["Childcare & Education", "Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "ream", supplierType: "manufacturer" },
  { name: "McCain Foods SA", website: "mccain.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer" },
  { name: "RCL Foods", website: "rclfoods.com", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Mondelēz SA", website: "mondelez.com", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Mars Wrigley SA", website: "mars.com", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Proctor & Gamble SA", website: "pg.com", verticals: ["Grocery & FMCG", "Health & Beauty"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Reckitt Benckiser SA", website: "rb.com", verticals: ["Grocery & FMCG", "Childcare & Education"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Willowton Group", website: "willowton.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 4, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Rhodes Food Group", website: "rhodesfoods.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Sea Harvest Group", website: "seaharvest.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Tiger Consumer Brands", website: "tigerbrands.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Chalmar Beef & Lamb", website: "chalmar.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 10, minOrderUnit: "kg", supplierType: "farmer" },
  { name: "Bidfood SA (Bidvest Foodservice)", website: "bidfood.co.za", verticals: ["Food & Bev", "Hospitality"], tier: "gold", bbbeeLevel: 1, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "order", supplierType: "distributor" },
  { name: "Freshmark (Shoprite Group)", website: "freshmark.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "distributor" },
  { name: "Afrox (Air Products)", website: "afrox.co.za", verticals: ["Food & Bev", "Hardware & Building"], tier: "silver", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "cylinder", supplierType: "manufacturer" },
  { name: "Parmalat SA", website: "parmalat.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Lancewood Cheese", website: "lancewood.co.za", verticals: ["Food & Bev", "Grocery & FMCG"], tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 3, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Fridge to Fork", website: "fridgetofork.co.za", verticals: ["Food & Bev", "Hospitality"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 24, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Monin SA (Bidvest)", website: "bidvest.co.za", verticals: ["Food & Bev"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "distributor" },
  { name: "DairyBelle", website: "dairybelle.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "units", supplierType: "farmer" },
  { name: "KWV Wines & Spirits", website: "kwv.co.za", verticals: ["Liquor & Nightlife"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "Spier Wines", website: "spier.co.za", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "farmer" },
  { name: "Diemersdal Estate", website: "diemersdal.co.za", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "farmer" },
  { name: "Meerlust Estate", website: "meerlust.co.za", verticals: ["Liquor & Nightlife"], tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "farmer" },
  { name: "Boekenhoutskloof Winery", website: "boekenhoutskloof.co.za", verticals: ["Liquor & Nightlife"], tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "farmer" },
  { name: "DGB (Douglas Green Bellingham)", website: "dgb.co.za", verticals: ["Liquor & Nightlife"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "bottles", supplierType: "distributor" },
  { name: "Edward Snell & Co", website: "edwardsnell.co.za", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "distributor" },
  { name: "Moet Hennessy SA", website: "mh-sa.co.za", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 3, minOrderUnit: "bottles", supplierType: "importer" },
  { name: "William Grant & Sons SA", website: "williamgrant.com", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "importer" },
  { name: "Bacardi Martini SA", website: "bacardi.com", verticals: ["Liquor & Nightlife"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "importer" },
  { name: "Makro Wholesale (Massmart)", website: "makro.co.za", verticals: ["Liquor & Nightlife", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "wholesaler" },
  { name: "Simba / PepsiCo SA", website: "pepsico.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "AVI Ltd", website: "avi.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Libstar Holdings", website: "libstar.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Denny Mushrooms", website: "denny.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "farmer" },
  { name: "Fattis & Moni's (Tiger Brands)", website: "tigerbrands.co.za", verticals: ["Grocery & FMCG"], tier: "gold", bbbeeLevel: 4, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Cape Herb & Spice", website: "capeherbandspice.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Robertsons (Unilever)", website: "unilever.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "National Brands Ltd (NBL)", website: "nationalbiltong.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Olympic Dairy", website: "olympicdairy.co.za", verticals: ["Grocery & FMCG"], tier: "silver", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 6, minOrderUnit: "units", supplierType: "farmer" },
  { name: "Spar Group (Wholesale)", website: "spar.co.za", verticals: ["Grocery & FMCG", "All Verticals"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "wholesaler" },
  { name: "Metcash Trading Africa", website: "metcash.com", verticals: ["Grocery & FMCG"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pallet", supplierType: "wholesaler" },
  { name: "Ruto Mills", website: "rutomills.co.za", verticals: ["Grocery & FMCG"], tier: "silver", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 5, minOrderUnit: "kg", supplierType: "manufacturer" },
  { name: "Foodcorp SA", website: "foodcorp.co.za", verticals: ["Grocery & FMCG", "Food & Bev"], tier: "gold", bbbeeLevel: 3, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Schwarzkopf Professional SA", website: "schwarzkopf.co.za", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Joico SA (Revlon Prof)", website: "joico.com", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 3, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Redken Professional SA", website: "redken.com", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Goldwell SA", website: "goldwell.co.za", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "OPI Products SA", website: "opi.com", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "Essie SA (L'Oréal)", website: "loreal.co.za", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "BABOR SA", website: "babor.com", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 3, minOrderUnit: "units", supplierType: "importer" },
  { name: "Dermalogica SA", website: "dermalogica.com", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 3, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Medline SA", website: "medlinesa.co.za", verticals: ["Health & Beauty", "Health & Pharmacy"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "box", supplierType: "distributor" },
  { name: "Lycon Cosmetics SA", website: "lycon.com.au", verticals: ["Health & Beauty"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "Nala Beauty Supplies", website: "nalabeauty.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Belo Lash Extensions SA", website: "belolash.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "trays", supplierType: "importer" },
  { name: "Burmax SA (Beauty Supplies)", website: "beautysupplies.co.za", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Swarfega SA (Deb Group)", website: "debgroup.com", verticals: ["Health & Beauty"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "The Foschini Group (TFG)", website: "tfggroup.co.za", verticals: ["Fashion & Apparel"], tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Truworths Wholesale", website: "truworths.co.za", verticals: ["Fashion & Apparel"], tier: "gold", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 12, minOrderUnit: "units", supplierType: "wholesaler" },
  { name: "Rex Trueform Clothing", website: "rextrueform.co.za", verticals: ["Fashion & Apparel"], tier: "silver", bbbeeLevel: 3, deliveryDays: 14, minOrderValue: 25, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "LRM Clothing", website: "lrm.co.za", verticals: ["Fashion & Apparel"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 14, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Barron Corporate Clothing", website: "barron.co.za", verticals: ["Fashion & Apparel"], tier: "silver", bbbeeLevel: 2, deliveryDays: 14, minOrderValue: 25, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Scan SA (PPE)", website: "scansa.co.za", verticals: ["Fashion & Apparel", "Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 25, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Tsonga Footwear", website: "tsonga.co.za", verticals: ["Fashion & Apparel"], tier: "silver", bbbeeLevel: 4, deliveryDays: 14, minOrderValue: 6, minOrderUnit: "pairs", supplierType: "manufacturer" },
  { name: "Bata Shoe Company SA", website: "bata.co.za", verticals: ["Fashion & Apparel"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "pairs", supplierType: "manufacturer" },
  { name: "Green Cross Shoes", website: "greencrossshoes.co.za", verticals: ["Fashion & Apparel"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "pairs", supplierType: "manufacturer" },
  { name: "Africa Bales / Durban Importers", website: "africabales.co.za", verticals: ["Fashion & Apparel"], tier: "bronze", bbbeeLevel: 4, deliveryDays: 14, minOrderValue: 1, minOrderUnit: "bale", supplierType: "importer" },
  { name: "Gutermann SA (Coats)", website: "gutermann.com", verticals: ["Fashion & Apparel"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 10, minOrderUnit: "spools", supplierType: "distributor" },
  { name: "Textiles SA / SA Fabrics", website: "textilesmart.co.za", verticals: ["Fashion & Apparel"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "metres", supplierType: "distributor" },
  { name: "Empire Carton / Packaging", website: "empirecarton.co.za", verticals: ["Fashion & Apparel", "All Verticals"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 10, minOrderValue: 100, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Bayer SA", website: "bayer.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 24, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "GSK SA (Haleon)", website: "gsk.com", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Johnson & Johnson SA", website: "jnj.com", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Novartis SA", website: "novartis.com", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Sanofi SA", website: "sanofi.com", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Boehringer Ingelheim SA", website: "boehringer.com", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Alcon SA", website: "alcon.com", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "boxes", supplierType: "manufacturer" },
  { name: "Cipla Medpro SA", website: "cipla.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 24, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Mylan SA (Viatris)", website: "viatris.com", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Clicks Wholesale (Group)", website: "clicks.co.za", verticals: ["Health & Pharmacy", "Health & Beauty"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "wholesaler" },
  { name: "Dis-Chem Pharmacies (Wholesale)", website: "dischem.co.za", verticals: ["Health & Pharmacy"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "wholesaler" },
  { name: "Nature's Choice SA", website: "natureschoice.co.za", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Solal Technologies", website: "solal.co.za", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Herbex SA", website: "herbex.co.za", verticals: ["Health & Pharmacy"], tier: "silver", bbbeeLevel: 4, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Vonk Pharma Supplies", website: "vonkpharma.co.za", verticals: ["Health & Pharmacy"], tier: "bronze", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 5, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Tsogo Sun Procurement", website: "tsogosun.com", verticals: ["Hospitality"], tier: "gold", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 10, minOrderUnit: "units", supplierType: "service" },
  { name: "Southern Sun Wholesale", website: "southernsun.com", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "units", supplierType: "service" },
  { name: "Peermont Procurement", website: "peermont.com", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 5, minOrderUnit: "units", supplierType: "service" },
  { name: "Protea Hotels (Marriott) Supply", website: "marriott.com", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 1, deliveryDays: 14, minOrderValue: 5, minOrderUnit: "units", supplierType: "service" },
  { name: "Cape Linen SA", website: "capelinen.co.za", verticals: ["Hospitality"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "sets", supplierType: "manufacturer" },
  { name: "Sancella SA (Essity)", website: "essity.com", verticals: ["Hospitality"], tier: "gold", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Twinsaver (Essity)", website: "twinsaver.co.za", verticals: ["Hospitality", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "case", supplierType: "manufacturer" },
  { name: "Absa Merchant Services (Float)", website: "absa.co.za", verticals: ["Hospitality", "All Verticals"], tier: "gold", bbbeeLevel: 1, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "terminal", supplierType: "service" },
  { name: "Ceres Fruit Juices", website: "ceres.co.za", verticals: ["Hospitality", "Grocery & FMCG"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "cartons", supplierType: "manufacturer" },
  { name: "Drostdy-Hof Wines", website: "drostdyhof.co.za", verticals: ["Hospitality", "Liquor & Nightlife"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 12, minOrderUnit: "bottles", supplierType: "manufacturer" },
  { name: "La Motte Wine Estate", website: "la-motte.com", verticals: ["Hospitality", "Liquor & Nightlife"], tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "bottles", supplierType: "farmer" },
  { name: "AfriSam SA", website: "afrisam.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 2, deliveryDays: 2, minOrderValue: 1, minOrderUnit: "bag", supplierType: "manufacturer" },
  { name: "Hilti SA", website: "hilti.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Gedore Tools SA", website: "gedore.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Jojo Tanks SA", website: "jojo.co.za", verticals: ["Hardware & Building"], tier: "silver", bbbeeLevel: 3, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Rectron SA (Ingram Micro)", website: "rectron.co.za", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Mustek SA", website: "mustek.co.za", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Axiz SA", website: "axiz.com", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Tarsus Technology", website: "tarsus.co.za", verticals: ["Electronics & Tech"], tier: "gold", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Epson SA", website: "epson.co.za", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Canon SA", website: "canon.co.za", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Seagate SA", website: "seagate.com", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "TP-Link SA", website: "tp-link.com", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Hikvision SA", website: "hikvision.com", verticals: ["Electronics & Tech"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 1, minOrderUnit: "unit", supplierType: "distributor" },
  { name: "Nike SA", website: "nike.com", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "gold", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Puma SA", website: "puma.com", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "New Balance SA", website: "newbalance.com", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Asics SA", website: "asics.com", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Speedo SA", website: "speedo.com", verticals: ["Sport & Leisure"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Biogen SA", website: "biogen.co.za", verticals: ["Sport & Leisure", "Health & Pharmacy"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Evox Nutrition", website: "evox.co.za", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Muscletech SA", website: "muscletech.com", verticals: ["Sport & Leisure"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "SSG (Sporting Supplies Group)", website: "ssg.co.za", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 3, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Kookaburra SA", website: "kookaburra.com", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Mitre SA", website: "mitre.com", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Umbro SA", website: "umbro.com", verticals: ["Sport & Leisure", "Fashion & Apparel"], tier: "silver", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "CE Rental / Events Supply", website: "cerental.co.za", verticals: ["Sport & Leisure"], tier: "silver", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 1, minOrderUnit: "unit", supplierType: "service" },
  { name: "Horizon Fitness SA", website: "horizonfitness.com", verticals: ["Sport & Leisure"], tier: "bronze", bbbeeLevel: 2, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "importer" },
  { name: "Huggies / Kimberly-Clark", website: "huggies.co.za", verticals: ["Childcare & Education"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pack", supplierType: "manufacturer" },
  { name: "Pampers / P&G SA", website: "pampers.com", verticals: ["Childcare & Education"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "pack", supplierType: "manufacturer" },
  { name: "Philips Avent SA", website: "philips.co.za", verticals: ["Childcare & Education"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Hasbro SA", website: "hasbro.com", verticals: ["Childcare & Education"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "Mattel SA", website: "mattel.com", verticals: ["Childcare & Education"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "Lego SA", website: "lego.com", verticals: ["Childcare & Education"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "importer" },
  { name: "Office National SA", website: "officenational.co.za", verticals: ["Childcare & Education", "Professional Services"], tier: "silver", bbbeeLevel: 2, deliveryDays: 3, minOrderValue: 10, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Juta & Co", website: "juta.co.za", verticals: ["Childcare & Education", "Professional Services"], tier: "silver", bbbeeLevel: 2, deliveryDays: 5, minOrderValue: 10, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Promethean SA", website: "prometheanworld.com", verticals: ["Childcare & Education"], tier: "bronze", bbbeeLevel: 1, deliveryDays: 7, minOrderValue: 1, minOrderUnit: "unit", supplierType: "importer" },
  { name: "Shell SA", website: "shell.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Mobil SA (ExxonMobil)", website: "mobil.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Total Energies SA", website: "totalenergies.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "manufacturer" },
  { name: "Wurth SA", website: "wurth.co.za", verticals: ["Professional Services", "Hardware & Building"], tier: "silver", bbbeeLevel: 1, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "3M SA", website: "3m.co.za", verticals: ["Professional Services", "Hardware & Building"], tier: "silver", bbbeeLevel: 1, deliveryDays: 5, minOrderValue: 6, minOrderUnit: "units", supplierType: "manufacturer" },
  { name: "Midas Auto Parts", website: "midas.co.za", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 3, deliveryDays: 3, minOrderValue: 6, minOrderUnit: "units", supplierType: "distributor" },
  { name: "Sage SA", website: "sage.com", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Xero SA", website: "xero.com", verticals: ["Professional Services"], tier: "gold", bbbeeLevel: 1, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Makro / Massmart Wholesale", website: "makro.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "case", supplierType: "wholesaler" },
  { name: "Game (Massmart)", website: "game.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "wholesaler" },
  { name: "Builders Warehouse", website: "builders.co.za", verticals: ["Hardware & Building"], tier: "gold", bbbeeLevel: 2, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "wholesaler" },
  { name: "DHL Supply Chain SA", website: "dhl.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 1, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "service" },
  { name: "The Courier Guy", website: "thecourierguy.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 3, deliveryDays: 1, minOrderValue: 1, minOrderUnit: "unit", supplierType: "service" },
  { name: "PayFast / DPO Group", website: "payfast.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 2, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Yoco Technologies", website: "yoco.co.za", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 3, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Peach Payments", website: "peachpayments.com", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 2, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" },
  { name: "Ozow (i-Pay)", website: "ozow.com", verticals: ["All Verticals"], tier: "gold", bbbeeLevel: 3, deliveryDays: 0, minOrderValue: 1, minOrderUnit: "integration", supplierType: "service" }
]

// GET /api/grosupply/seed - Get seed status
export async function GET() {
  try {
    const supplierCount = await db.supplier.count()
    const productCount = await db.supplierProduct.count()
    
    return NextResponse.json({
      status: 'ready',
      currentSuppliers: supplierCount,
      currentProducts: productCount,
      availableSuppliers: supplierData.length,
      message: supplierCount === 0 
        ? 'Database is empty. Use POST to seed suppliers.' 
        : `Database has ${supplierCount} suppliers. Use DELETE to reset and POST to re-seed.`
    })
  } catch (error) {
    console.error('Error checking seed status:', error)
    return NextResponse.json(
      { error: 'Failed to check seed status' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/seed - Seed all suppliers
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearExisting = searchParams.get('clear') === 'true'
    
    // Clear existing data if requested
    if (clearExisting) {
      await db.supplierProduct.deleteMany({})
      await db.supplier.deleteMany({})
    }
    
    // Check if already seeded
    const existingCount = await db.supplier.count()
    if (existingCount > 0 && !clearExisting) {
      return NextResponse.json({
        message: 'Database already seeded. Use ?clear=true to reset.',
        existingSuppliers: existingCount
      }, { status: 400 })
    }
    
    let createdCount = 0
    let skippedCount = 0
    
    // Create suppliers
    for (const supplier of supplierData) {
      try {
        // Check if exists
        const existing = await db.supplier.findFirst({
          where: { name: supplier.name }
        })
        
        if (existing) {
          skippedCount++
          continue
        }
        
        await db.supplier.create({
          data: {
            name: supplier.name,
            code: `SUP-${String(createdCount + 1).padStart(4, '0')}`,
            tier: supplier.tier,
            website: supplier.website,
            bbbeeLevel: supplier.bbbeeLevel,
            bbbeeExempt: false,
            deliveryDays: supplier.deliveryDays,
            minOrderValue: supplier.minOrderValue,
            minOrderUnit: supplier.minOrderUnit,
            supplierType: supplier.supplierType,
            verticals: JSON.stringify(supplier.verticals),
            subVerticals: JSON.stringify([]),
            status: 'active',
            verificationStatus: 'verified',
            rating: supplier.tier === 'gold' ? 4.8 : supplier.tier === 'silver' ? 4.5 : 4.2,
            reviewCount: Math.floor(Math.random() * 100) + 10,
            paymentTerms: 'net30'
          }
        })
        createdCount++
      } catch (err) {
        console.error(`Error creating supplier ${supplier.name}:`, err)
        skippedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Suppliers seeded successfully',
      created: createdCount,
      skipped: skippedCount,
      total: supplierData.length
    })
  } catch (error) {
    console.error('Error seeding suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to seed suppliers' },
      { status: 500 }
    )
  }
}

// DELETE /api/grosupply/seed - Clear all suppliers
export async function DELETE() {
  try {
    const deletedProducts = await db.supplierProduct.deleteMany({})
    const deletedSuppliers = await db.supplier.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: 'All suppliers and products deleted',
      deletedSuppliers: deletedSuppliers.count,
      deletedProducts: deletedProducts.count
    })
  } catch (error) {
    console.error('Error clearing suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to clear suppliers' },
      { status: 500 }
    )
  }
}
