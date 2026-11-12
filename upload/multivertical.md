+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| **MULTI-VERTICAL POS**                                                |
|                                                                       |
| Merchant OS --- South Africa Deep-Dive Specification                  |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 |
|                                                                       |
| 12 Verticals · 47 Sub-Verticals · QR Digital Menus · Geo-Discovery    |
|                                                                       |
| Mini Online Stores · Inventory & ERP · CRM & Marketing · VAS ·        |
| Rewards                                                               |
|                                                                       |
| GroSupply Integration · Retail Funding · Compliance per Vertical ·    |
| Full Payments Stack                                                   |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 |
|                                                                       |
| Version 1.0 · February 2026 · Confidential --- Internal Product       |
| Specification                                                         |
+-----------------------------------------------------------------------+

+-----------+-----------+-----------+-----------+-----------+-----------+
| **12**    | **47**    | *         | **QR**    | **Geo**   | **Mini    |
|           |           | *3,930+** |           |           | Store**   |
| Business  | Sub-      |           | Digital   | Discovery |           |
| Verticals | Verticals | P         | Menus     |           | Per       |
|           |           | re-loaded |           |           | Merchant  |
|           |           | SKUs      |           |           |           |
+-----------+-----------+-----------+-----------+-----------+-----------+

+---+---------------------------------------------------------------------+
| * | **What This Document Covers**                                       |
| * |                                                                     |
| ★ | A comprehensive sub-vertical breakdown of every business category   |
| * | Groway\'s Merchant OS serves in South Africa --- with the intimacy  |
| * | of knowing how each business actually operates. Each vertical gets: |
|   | its own onboarding sub-type selection, a purpose-built POS screen   |
|   | layout, vertical-specific inventory and SKU catalogues, relevant    |
|   | compliance rules, VAS (Value Added Services), CRM and marketing     |
|   | tools, the QR digital menu and geo-discovery layer, mini online     |
|   | store configuration, GroSupply procurement links, retail funding    |
|   | eligibility, and the full payments and rewards stack.               |
+---+---------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **00** ── **Merchant Onboarding --- Vertical Selection Engine**       |
|                                                                       |
| *Before a merchant sees a single POS screen, Groway must understand   |
| exactly what kind of business they run*                               |
|                                                                       |
| The right sub-vertical unlocks the right POS layout · SKU catalogue · |
| compliance rules · VAS menu · and chart of accounts                   |
+-----------------------------------------------------------------------+

**0.1 Why Sub-Vertical Matters**

A restaurant and a Shisa Nyama are legally, operationally, and
culturally different businesses --- even though both sell food. A QSR
(Quick Service Restaurant) needs a drive-through order screen and combo
meals; a Shisa Nyama needs a braai pit tracking board and a
tab-per-table model with cash dominance. Groway\'s onboarding wizard
determines the exact sub-vertical so every default --- chart of
accounts, VAT treatment, SKU catalogue, compliance overlay, POS screen
layout, and VAS offerings --- is pre-configured correctly on day one.

+---+---------------------------------------------------------------------+
| * | **Design Principle --- The Two-Step Selection**                     |
| * |                                                                     |
| ! | Step 1: Select the broad vertical (Restaurant, Retail, Health &     |
| * | Beauty, etc). Step 2: Select the exact sub-vertical from a visual   |
| * | card grid with descriptions in plain language. If the user is       |
|   | unsure, they can answer 3 plain-language questions (\'Do you cook   |
|   | food on-site?\', \'Do customers sit down?\', \'Do you sell          |
|   | alcohol?\') and Groway recommends the correct sub-vertical          |
|   | automatically. The selection can be changed later by the Owner role |
|   | in Settings --- it reconfigures the POS layout and chart of         |
|   | accounts without losing transaction history.                        |
+---+---------------------------------------------------------------------+

**0.2 Vertical Selection Screen Specification**

  -------------- ---------- --------------------- -----------------------------------
  **Vertical**   **Icon**   **Sub-Verticals**     **Onboarding Question**

  Food &         🍽️         QSR · Sit-Down ·      Do customers eat on-site, take
  Beverage                  Shisa Nyama ·         away, or both?
                            Tavern/Shebeen ·      
                            Bakery · Coffee & Tea 
                            · Food Truck · Cloud  
                            Kitchen · Catering    

  Liquor &       🍾         Liquor Store ·        Does your primary revenue come from
  Nightlife                 Bar/Pub · Nightclub · selling sealed liquor to take away?
                            Shebeen · Bottle      
                            Store · Wine Farm     

  Grocery & FMCG 🛒         Superette · Spaza     Do you sell primarily packaged food
                            Shop · Butchery ·     products for home consumption?
                            Deli · Farm Stall ·   
                            Cash & Carry · Bakery 
                            Retail                

  Health &       💆         Hair Salon · Barber · Do you provide personal care
  Beauty                    Nail Salon · Spa &    services, sell retail products, or
                            Wellness · Aesthetic  both?
                            Clinic · Tattoo       
                            Studio · Lash & Brow  
                            Studio                

  Fashion &      👗         Clothing Boutique ·   Do you primarily sell clothing or
  Apparel                   Shoe Store ·          accessories off-the-shelf or
                            Accessories · Uniform made-to-order?
                            Supplier ·            
                            Second-hand/Thrift ·  
                            Tailor & Alterations  

  Health &       💊         Full Pharmacy ·       Do you dispense Schedule 5/6
  Pharmacy                  Health Shop (OTC) ·   controlled substances?
                            Herbal/Traditional    
                            Medicine · Optometry  
                            · Dentistry ·         
                            Veterinary            

  Hospitality &  🏨         Hotel · Guest House · How many bookable rooms/units do
  Lodging                   B&B · Backpackers ·   you have?
                            Lodge · Self-Catering 
                            · Airbnb-style        

  Professional   🧾         Auto Repair · Dry     Do customers drop off items or
  Services                  Cleaning/Laundry ·    themselves for a service and
                            Funeral Home · Legal  collect later?
                            Services · Accounting 
                            Practice ·            
                            Tutoring/School       

  Sport, Leisure 🎭         Gym · Fitness Studio  Do customers pay recurring
  & Events                  · Sports Club ·       membership fees or per-visit?
                            Events Venue ·        
                            Entertainment Centre  
                            · Escape Room         

  Hardware &     🔧         Hardware Store ·      Do you sell primarily to
  Building                  Building Supplies ·   tradespeople (B2B) or general
                            Paint Shop · Plumbing public (B2C)?
                            Supplies · Electrical 
                            Supplies ·            
                            Agri-Supply           

  Electronics &  📱         Phone & Accessories · Do you primarily sell products,
  Tech                      Computer & IT ·       repair devices, or both?
                            Electronics Retail ·  
                            Repair Workshop       

  Childcare &    📚         Crèche/Daycare ·      Do parents pay recurring fees per
  Education                 After-School Care ·   month or per session?
                            Tutoring Centre ·     
                            Driving School ·      
                            Skills Training       
  -------------- ---------- --------------------- -----------------------------------

**0.3 Post-Selection: What Groway Auto-Configures**

+-----------------------------------+-----------------------------------+
| **Automatically Enabled**         | **Merchant Can Customise**        |
|                                   |                                   |
| -   Correct chart of accounts     | -   Add/remove SKUs and edit      |
|     (vertical-specific account    |     default pricing               |
|     codes)                        |                                   |
|                                   | -   Upload own logo, photos, and  |
| -   Pre-loaded SKU catalogue      |     menu descriptions             |
|     (barcodes + pricing           |                                   |
|     benchmarks)                   | -   Set operating hours per day   |
|                                   |     (shown on geo-discovery card) |
| -   Applicable compliance         |                                   |
|     overlays (Liquor Act, SAHPRA, | -   Enable/disable specific VAS   |
|     etc.)                         |     tiles                         |
|                                   |                                   |
| -   Relevant VAT treatment        | -   Configure loyalty earn rate   |
|     (standard 15% / zero-rated /  |     (default or custom)           |
|     exempt)                       |                                   |
|                                   | -   Set table layout              |
| -   Applicable VAS tiles          |     (hospitality/restaurant only) |
|     (airtime, electricity,        |                                   |
|     insurance, etc.)              | -   Configure staff roles and     |
|                                   |     permissions                   |
| -   Vertical-specific POS screen  |                                   |
|     layout and workflow           | -   Add branch locations under    |
|                                   |     same account                  |
| -   Digital menu template         |                                   |
|     (Food/Hospitality verticals)  | -   Link GroSupply preferred      |
|                                   |     suppliers                     |
| -   Geo-discovery profile         |                                   |
|     category tag                  | -   Set delivery radius for mini  |
|                                   |     online store orders           |
| -   Loyalty rewards earn category |                                   |
|                                   |                                   |
| -   GroSupply supplier catalogue  |                                   |
|     filtered to vertical          |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| 🍽️ **Food & Beverage** · 8 sub-verticals                              |
|                                                                       |
| *South Africa\'s most diverse and culturally rich vertical*           |
+-----------------------------------------------------------------------+

+---+---------------------------------------------------------------------+
| * | **South African Context**                                           |
| * |                                                                     |
| S | Food & Beverage in SA spans ultra-formal hotel restaurants to       |
| A | informal township Shisa Nyamas, from Nando\'s-style QSRs to         |
| * | family-run bunny chow shops in Durban. Each has a completely        |
| * | different operational rhythm, legal requirement, tax treatment, and |
|   | customer expectation. Groway\'s F&B module must speak the language  |
|   | of every one of these operators.                                    |
+---+---------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🍔 **QSR ---    |                         |                         |
| Quick Service   |                         |                         |
| Restaurant**    |                         |                         |
| --- *Nando\'s · |                         |                         |
| Steers · Wimpy  |                         |                         |
| · Chicken       |                         |                         |
| Licken style ·  |                         |                         |
| Drive-through   |                         |                         |
| capable*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Counter /   | -   Recipe-level        | -   Groway Delivery     |
|     kiosk order |     ingredient          |     integration (Uber   |
|     screen with |     deduction per item  |     Eats, Mr D, Bolt    |
|     combo       |     sold (FIFO)         |     Food)               |
|     builder     |                         |                         |
|                 | -   Combo/bundle SKU    | -   QR digital menu --- |
| -               |     management with     |     table scan or       |
|   Drive-through |     component mapping   |     takeaway stand      |
|     queue       |                         |                         |
|     display     | -   Waste tracking ---  | -   Airtime & data      |
|     mode (large |     end-of-day          |     top-up at counter   |
|     text,       |     shrinkage log       |                         |
|     1-tap)      |                         | -   Prepaid electricity |
|                 | -   Daily food cost vs  |     token redemption    |
| -   Kitchen     |     revenue dashboard   |                         |
|     Display     |                         | -   Voucher issue &     |
|     System      | -   Allergen flags on   |     redemption          |
|     (KDS) ---   |     menu items (R638    |     (birthday offers,   |
|     ticket      |     Consumer            |     combos)             |
|     timer +     |     Protection)         |                         |
|     bump        |                         | -   WhatsApp order      |
|                 | -   Health & safety log |     channel (send order |
| -   Modifier    |     (fridge temp,       |     before arriving)    |
|     screen:     |     cleaning schedule)  |                         |
|     size,       |                         | -   GroCredit:          |
|     extras,     | -   VAT: 15% on cooked  |     equipment finance   |
|     sauces,     |     food                |     for fryers, grills  |
|     remove      |     (standard-rated)    |                         |
|     items       |                         |                         |
|                 | -   Staff clock-in/out  |                         |
| -   Split       |     at POS for BCEA     |                         |
|     tender:     |     compliance          |                         |
|     card +      |                         |                         |
|     Groway      |                         |                         |
|     Wallet +    |                         |                         |
|     cash        |                         |                         |
|                 |                         |                         |
| -   Loyalty     |                         |                         |
|     stamp card  |                         |                         |
|     at checkout |                         |                         |
|     ---         |                         |                         |
|     auto-apply  |                         |                         |
|                 |                         |                         |
| -   Quick void  |                         |                         |
|     and re-ring |                         |                         |
|     for errors  |                         |                         |
|                 |                         |                         |
| -   Thermal     |                         |                         |
|     receipt     |                         |                         |
|     printer +   |                         |                         |
|     optional    |                         |                         |
|     loyalty SMS |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🪑 **Sit-Down   |                         |                         |
| Restaurant**    |                         |                         |
| --- *Fine       |                         |                         |
| dining · Family |                         |                         |
| restaurants ·   |                         |                         |
| Casual dining · |                         |                         |
| Spur-style*     |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Table floor | -   Recipe engine ---   | -   QR digital menu     |
|     plan        |     ingredient          |     with stunning food  |
|     builder --- |     deduction per dish, |     photography         |
|                 |     down to grams       |                         |
|   drag-and-drop |                         | -   Consumer app mini   |
|     room layout | -   Menu engineering:   |     online store        |
|                 |     GP% per dish,       |     (pre-orders,        |
| -   Waiter      |     star/dog/plough     |     catering orders)    |
|     tablet      |     classification      |                         |
|     order       |                         | -   Geo-discovery       |
|     taking      | -   Wine/beverage stock |     profile: cuisine    |
|     (course     |     management (by      |     type, price range,  |
|     management: |     bottle and glass)   |     hours               |
|     starte      |                         |                         |
| r/main/dessert) | -   Reservation         | -   Groway Rewards:     |
|                 |     management          |     earn points on      |
| -   KDS routing |     integration         |     dining              |
|     ---         |     (OpenTable API)     |                         |
|     starters go |                         | -   Function/event      |
|     to cold     | -   End-of-service till |     booking deposit via |
|     station,    |     reconciliation      |     Groway Wallet       |
|     mains to    |                         |                         |
|     hot station | -   VAT: 15% food &     | -   GroSupply: weekly   |
|                 |     beverage, tip       |     produce + beverage  |
| -   Dynamic     |     excluded from VAT   |     procurement         |
|     pricing:    |                         |                         |
|     happy hour  | -   Compliance: Liquor  | -   Table-specific QR   |
|     (           |     licence (if alcohol |     vouchers (discount  |
| auto-discount), |     served)             |     for Instagram post) |
|     events      |                         |                         |
|     pricing     | -   Staff tips          |                         |
|                 |     distribution        |                         |
| -   Table timer |     tracking (tip pool  |                         |
|     --- flag    |     or individual)      |                         |
|     tables      |                         |                         |
|     seated \> X |                         |                         |
|     minutes     |                         |                         |
|                 |                         |                         |
| -   QR          |                         |                         |
|                 |                         |                         |
|    self-service |                         |                         |
|     table       |                         |                         |
|     ordering    |                         |                         |
|     (consumer   |                         |                         |
|     scans table |                         |                         |
|     QR)         |                         |                         |
|                 |                         |                         |
| -   Din         |                         |                         |
| e-Now-Pay-Later |                         |                         |
|     (BNPL) at   |                         |                         |
|     table close |                         |                         |
|                 |                         |                         |
| -   Split bill  |                         |                         |
|     by item or  |                         |                         |
|     equally     |                         |                         |
|     (consumer   |                         |                         |
|     app         |                         |                         |
|     selects)    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🔥 **Shisa      |                         |                         |
| Nyama** ---     |                         |                         |
| *Township braai |                         |                         |
| culture ·       |                         |                         |
| Informal +      |                         |                         |
| semi-formal ·   |                         |                         |
| Cash-heavy ·    |                         |                         |
| Social*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Braai pit   | -   Meat stock by cut:  | -   Airtime & data      |
|     board ---   |     beef ribs, pork     |     (highest volume VAS |
|     track each  |     chops, boerewors,   |     in this vertical)   |
|     fire/pit in |     wors, chicken       |                         |
|     progress    |                         | -   Electricity tokens  |
|                 | -   Charcoal + wood     |                         |
| -   Meat cut    |     consumables         | -   WhatsApp pre-order: |
|     calculator: |     tracking            |     \'Reserve your fire |
|     price by    |                         |     for Saturday 2pm\'  |
|     weight (kg  | -   Styrofoam container |                         |
|     scale       |     and sauce cost      | -   QR menu --- meat    |
|                 |     tracking            |     cuts, prices,       |
|    integration) |                         |     availability        |
|                 | -   FIFO meat rotation  |                         |
| -               |     --- alert when cuts | -   Stokvel group       |
|   Tab-per-group |     \> 2 days old       |     events: pre-book    |
|     model (one  |                         |     entire Shisa for a  |
|     tab per     | -   Informal trader     |     stokvel day         |
|     braai       |     compliance:         |                         |
|     party)      |     Business Licence    | -   Cold drink fridge   |
|                 |     (municipal)         |     integration via     |
| -   Airtime     |                         |     GroSupply           |
|     sales       | -   Spaza supplier link |                         |
|     embedded on |     via GroSupply for   | -   GroCredit: fridge,  |
|     main POS    |     meat + drinks       |     braai equipment     |
|     screen      |                         |     finance             |
|                 | -   VAT: registered     |                         |
| -               |     threshold (R1M      |                         |
|  Cash-dominant: |     p.a.) --- many      |                         |
|     prominently |     informal,           |                         |
|     show change |     VAT-exempt          |                         |
|     due         |                         |                         |
|                 | -   Cash float          |                         |
| -   Drink       |     management +        |                         |
|     tally: add  |     end-of-night        |                         |
|                 |     reconciliation      |                         |
|    beers/drinks |                         |                         |
|     to tab from |                         |                         |
|     roving      |                         |                         |
|     waiter view |                         |                         |
|                 |                         |                         |
| -   Quick-close |                         |                         |
|     tab when    |                         |                         |
|     customer    |                         |                         |
|     ready to    |                         |                         |
|     pay         |                         |                         |
|                 |                         |                         |
| -   Stokvel     |                         |                         |
|     wallet      |                         |                         |
|     acceptance  |                         |                         |
|     (group      |                         |                         |
|     payment     |                         |                         |
|     method)     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| ☕ **Coffee     |                         |                         |
| Shop & Café**   |                         |                         |
| --- *Vida e     |                         |                         |
| Caffè style ·   |                         |                         |
| Independent     |                         |                         |
| cafés · Artisan |                         |                         |
| roasters · Tea  |                         |                         |
| rooms*          |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Barista     | -   Milk stock by       | -   QR digital menu --- |
|     screen:     |     litres (daily par   |     displayed at        |
|     drink build |     level alert)        |     counter + scannable |
|     sequence    |                         |     card on table       |
|     (shot,      | -   Coffee bean         |                         |
|     milk,       |     inventory by kg per | -   Wifi voucher sales  |
|     syrup)      |     roast type          |     (Groway Voucher +   |
|                 |                         |     ISP integration)    |
| -   Loyalty cup | -   Consumables: cups,  |                         |
|     tracker:    |     lids, sleeves,      | -   Airtime & data      |
|     \'Buy 9 get |     stirrers tracked    |                         |
|     1 free\'    |     per drink           | -   Mini online store:  |
|     (digital    |                         |     coffee bean         |
|     stamp card) | -   Daily wastage log   |     subscriptions, gift |
|                 |     (milk, pastries     |     boxes               |
| -   Modifiers:  |     end-of-day)         |                         |
|     milk type,  |                         | -   Groway Rewards:     |
|     extra shot, | -   FIFO for pastries   |     earn points per cup |
|     decaf,      |     and food items      |                         |
|     temperature |     (expiry date        | -   Loyalty card ---    |
|                 |     tracking)           |     digital, embedded   |
| -   Tab for     |                         |     in consumer app     |
|     regulars    | -   VAT: 15% on all hot |                         |
|     ---         |     beverages and food  | -   WhatsApp order      |
|     pre-saved   |                         |     ahead: \'Ready when |
|     order with  | -   Franchise           |     you arrive\'        |
|     one tap     |     compliance module   |                         |
|                 |     (if part of chain)  |                         |
| -   Split       |                         |                         |
|     screen:     | -   Staff skill tags    |                         |
|     drinks      |     (qualified barista  |                         |
|     queue +     |     vs counter staff)   |                         |
|     food queue  |                         |                         |
|                 |                         |                         |
|  simultaneously |                         |                         |
|                 |                         |                         |
| -   Retail      |                         |                         |
|     shelf       |                         |                         |
|     integration |                         |                         |
|     (beans,     |                         |                         |
|     mugs,       |                         |                         |
|     merchandise |                         |                         |
|     for sale)   |                         |                         |
|                 |                         |                         |
| -   Reprint     |                         |                         |
|     receipt /   |                         |                         |
|     digital     |                         |                         |
|     receipt via |                         |                         |
|     WhatsApp    |                         |                         |
|                 |                         |                         |
| -   Contactless |                         |                         |
|     card + QR   |                         |                         |
|     tap for     |                         |                         |
|     quick       |                         |                         |
|     counter     |                         |                         |
|     service     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🚚 **Food Truck |                         |                         |
| & Street Food** |                         |                         |
| --- *Mobile     |                         |                         |
| vendor · Market |                         |                         |
| trader ·        |                         |                         |
| Festival food · |                         |                         |
| Boerewors roll  |                         |                         |
| seller*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Full        | -   Simplified 20--50   | -   Geo-discovery: show |
|     offline POS |     item SKU catalogue  |     current GPS         |
|     mode (72h   |                         |     location on         |
|     buffer ---  | -   Day-pack inventory: |     consumer app map    |
|     no wifi at  |     enter what you      |                         |
|     markets)    |     brought, track what | -   QR menu displayed   |
|                 |     you sold            |     on truck/stall      |
| -   One-screen  |                         |     signage             |
|     simplified  | -   Raw materials       |                         |
|     layout: tap |     tracking (bread     | -   Groway social       |
|     item →      |     rolls, patties,     |     share: \'I\'m at    |
|     quantity →  |     oil, etc.)          |     Corner of Jan Smuts |
|     pay         |                         |     & Oxford today\'    |
|                 | -   Municipal by-law    |                         |
| -   Cash-first  |     compliance:         | -   Airtime sales at    |
|     layout with |     informal food       |     counter             |
|     prominent   |     trader permit       |                         |
|     change due  |                         | -   Groway Wallet QR    |
|     display     | -   Health inspection   |     payment (no card    |
|                 |     log (Food Safety    |     machine needed)     |
| -               |     Act)                |                         |
|    Geo-location |                         | -   GroCredit:          |
|     tagging:    | -   VAT: below R1M      |     generator, gazebo,  |
|     \'We are at |     threshold usually   |     food truck          |
|                 |     VAT-exempt          |     equipment finance   |
|  Neighbourgoods |                         |                         |
|     Market      | -   Daily profit        | -   Market event        |
|     today\'     |     calculation:        |     calendar            |
|                 |     revenue minus food  |     integration         |
| -   Quick menu  |     cost = margin       |     (Neighbourgoods,    |
|     edit:       |                         |     Oranjezicht)        |
|     remove      | -   Mobile banking      |                         |
|     sold-out    |     integration for     |                         |
|     items with  |     instant settlement  |                         |
|     one tap     |                         |                         |
|                 |                         |                         |
| -   QR-only     |                         |                         |
|     payment     |                         |                         |
|     option for  |                         |                         |
|     cash-free   |                         |                         |
|     stalls      |                         |                         |
|                 |                         |                         |
| -   Daily sales |                         |                         |
|     summary     |                         |                         |
|     printable   |                         |                         |
|     at end of   |                         |                         |
|     market day  |                         |                         |
|                 |                         |                         |
| -   Battery     |                         |                         |
|     saver mode  |                         |                         |
|     for field   |                         |                         |
|     operation   |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🎂 **Bakery &   |                         |                         |
| Patisserie**    |                         |                         |
| --- *Artisan    |                         |                         |
| bread · Cake    |                         |                         |
| shop ·          |                         |                         |
| Confectionery · |                         |                         |
| Koeksisters ·   |                         |                         |
| Vetkoek*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Product     | -   Baking schedule:    | -   QR menu: full       |
|     build       |     production plan     |     product catalogue   |
|     screen:     |     linked to           |     with photos and     |
|     custom cake |     ingredient          |     prices              |
|                 |     inventory           |                         |
|    configurator |                         | -   Mini online store:  |
|     (size,      | -   Ingredient stock:   |     order custom cakes  |
|     flavour,    |     flour (kg), butter  |     online, pay deposit |
|     message)    |     (kg), eggs (unit),  |     via Groway          |
|                 |     sugar (kg)          |                         |
| -   Pre-order   |                         | -   Delivery            |
|     and deposit | -   Expiry-date         |     integration:        |
|     capture for |     tracking on all     |     deliver custom      |
|     custom      |     fresh products      |     cakes via Groway    |
|     orders      |     (Food Safety Act)   |     Delivery            |
|                 |                         |                         |
| -   Collection  | -   FIFO auto-alert:    | -   Groway Rewards:     |
|     date and    |     oldest bread stock  |     double points on    |
|     time        |     highlighted for     |     birthday cake       |
|     scheduling  |     discount/clearance  |     orders              |
|     per order   |                         |                         |
|                 | -   Wastage log:        | -   WhatsApp order      |
| -   Retail      |     end-of-day unsold   |     channel: \'Order    |
|     shelf       |     items (write-off    |     your cake via       |
|     display     |     journal)            |     WhatsApp\'          |
|     (bread,     |                         |                         |
|     pastries,   | -   VAT: brown bread,   | -   GroSupply: bulk     |
|     packaged    |     milk, eggs ---      |     flour, butter,      |
|     goods)      |     zero-rated; cakes   |     chocolate           |
|                 |     --- 15%             |     procurement         |
| -   Wholesale   |                         |                         |
|     order       | -   Health department   | -   Gift vouchers:      |
|     module      |     certificate         |     \'Gift a birthday   |
|     (supply to  |     compliance log      |     cake\' voucher sold |
|     res         |                         |     via app             |
| taurants/cafés) | -   Allergen labelling  |                         |
|                 |     compliance (R638)   |                         |
| -   Walk-in     |                         |                         |
|     counter:    |                         |                         |
|     quick-scan  |                         |                         |
|     barcode for |                         |                         |
|     packaged    |                         |                         |
|     items       |                         |                         |
|                 |                         |                         |
| -   Order queue |                         |                         |
|     board for   |                         |                         |
|     baking      |                         |                         |
|     schedule    |                         |                         |
|                 |                         |                         |
| -   Loyalty     |                         |                         |
|     points on   |                         |                         |
|     every       |                         |                         |
|     purchase    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| ☁️ **Cloud      |                         |                         |
| Kitchen &       |                         |                         |
| Catering** ---  |                         |                         |
| *Delivery-only  |                         |                         |
| kitchen · Event |                         |                         |
| catering ·      |                         |                         |
| Corporate meal  |                         |                         |
| service*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Order       | -   Recipe costing      | -   Groway direct       |
|     management  |     engine: exact cost  |     ordering: consumer  |
|     screen ---  |     per dish at scale   |     places catering     |
|     aggregates  |                         |     order in app        |
|     Uber/Mr     | -   Production          |                         |
|     D/Bolt      |     planning:           | -   Geo-discovery: show |
|     orders +    |     ingredients needed  |     as \'Available for  |
|     Groway      |     for today\'s orders |     delivery\' in       |
|     direct      |                         |     consumer app        |
|                 | -   Bulk ingredient     |                         |
| -   Order       |     procurement linked  | -   WhatsApp order      |
|     routing to  |     to GroSupply        |     management          |
|     kitchen     |                         |     integration         |
|     stations    | -   Cold chain          |                         |
|     with        |     compliance log      | -   Groway Wallet:      |
|     priority    |     (HACCP)             |     accept corporate    |
|     queue       |                         |     payment via         |
|                 | -   VAT: 15% standard   |     EFT/PayShap         |
| -   Catering    |     rated on all        |                         |
|     quote       |     prepared meals      | -   GroCredit:          |
|     builder:    |                         |     commercial kitchen  |
|     per-head    | -   Waste minimisation  |     equipment finance   |
|     pricing,    |     reporting           |                         |
|     minimum     |                         | -   Loyalty: corporate  |
|     order,      | -   B2B invoicing for   |     accounts earn       |
|     deposit     |     corporate accounts  |     GroRewards on       |
|                 |                         |     repeat catering     |
| -   Event       | -   CIPC/Business       |                         |
|     calendar:   |     licence compliance  | -   Mini online store:  |
|     upcoming    |     check               |     subscription meal   |
|     catering    |                         |     plans, weekly order |
|     bookings    |                         |     ahead               |
|     with prep   |                         |                         |
|     timeline    |                         |                         |
|                 |                         |                         |
| -   Staff       |                         |                         |
|     allocation  |                         |                         |
|     per         |                         |                         |
|     event/order |                         |                         |
|                 |                         |                         |
| -   Packaging   |                         |                         |
|     checklist   |                         |                         |
|     per order   |                         |                         |
|                 |                         |                         |
| -   Invoice     |                         |                         |
|     generation  |                         |                         |
|     for         |                         |                         |
|     corporate   |                         |                         |
|     clients     |                         |                         |
|     (B2B)       |                         |                         |
|                 |                         |                         |
| -   Mobile      |                         |                         |
|     tablet mode |                         |                         |
|     for on-site |                         |                         |
|     catering    |                         |                         |
|     service     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🍾 **Liquor & Nightlife** · 5 sub-verticals                           |
|                                                                       |
| *South Africa\'s most heavily regulated retail vertical ---           |
| non-negotiable compliance*                                            |
+-----------------------------------------------------------------------+

+---+---------------------------------------------------------------------+
| * | **Compliance First**                                                |
| * |                                                                     |
| ! | All liquor sub-verticals require real-time Liquor Act enforcement:  |
| * | mandatory age verification (18+) on every transaction, trading      |
| * | hours enforcement by province (Western Cape, Gauteng, KZN, Eastern  |
|   | Cape all differ), and excise stock register maintenance for SARS.   |
|   | Groway\'s liquor module treats compliance as a hard block --- the   |
|   | POS physically cannot process a liquor sale outside trading hours   |
|   | or without age verification confirmation.                           |
+---+---------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🏪 **Bottle     |                         |                         |
| Store /         |                         |                         |
| Off-Licence**   |                         |                         |
| --- *Packaged   |                         |                         |
| liquor for      |                         |                         |
| take-away       |                         |                         |
| consumption ·   |                         |                         |
| High SKU count  |                         |                         |
| ·               |                         |                         |
| Age-sensitive*  |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Mandatory   | -   Excise stock        | -   Airtime & data      |
|     age verify: |     register: receive → |     (high conversion in |
|     camera      |     sell → closing      |     this foot-traffic   |
|     capture or  |     stock (SARS         |     setting)            |
|     tap \'ID    |     requirement)        |                         |
|     Verified    |                         | -   Electricity tokens  |
|     --- DOB     | -   SKU catalogue:      |                         |
|     entered\'   |     1,200+ barcoded     | -   Groway Rewards:     |
|                 |     products (beer,     |     loyalty points on   |
| -   Trading     |     wine, spirits,      |     liquor purchases    |
|     hours lock: |     ciders, RTDs)       |     (adult accounts     |
|     POS         |                         |     only)               |
|     disables    | -   FIFO rotation:      |                         |
|     liquor      |     date-code tracking, | -   QR product          |
|     sales       |     alert for           |     catalogue --- scan  |
|     outside     |     near-expiry         |     to see tasting      |
|     provincial  |                         |     notes, food         |
|     hours       | -   Shrinkage control:  |     pairings            |
|                 |     theft prevention    |                         |
| -   Case        |     --- daily and       | -   WhatsApp pre-order: |
|     pricing:    |     weekly variance     |     \'Reserve a case    |
|     automatic   |     report              |     for collection      |
|     discount at |                         |     tonight\'           |
|     12/24 unit  | -   Case vs bottle unit |                         |
|     threshold   |     management          | -   GroCredit: working  |
|                 |     (purchase by case,  |     capital for         |
| -   Mixed case  |     sell by bottle)     |     seasonal stock      |
|     builder:    |                         |     buildup (December)  |
|     customer    | -   VAT: 15% plus       |                         |
|     selects own |     excise duty         | -   GroSupply:          |
|     mix at case |     (embedded in price, |     automated reorder   |
|     price       |     not separately      |     from preferred      |
|                 |     charged at retail)  |     distributors        |
| -   Quick       |                         |                         |
|     barcode     | -   Liquor licence      |                         |
|     scan POS    |     number and expiry   |                         |
|     --- high    |     tracked (alert 60   |                         |
|     transaction |     days before expiry) |                         |
|     volume      |                         |                         |
|     environment | -   Supplier invoice    |                         |
|                 |     matching via        |                         |
| -   Lay-by for  |     GroSupply for major |                         |
|     expensive   |     distributors (DGB,  |                         |
|     spirits:    |     Distell, SAB)       |                         |
|     collect     |                         |                         |
|     when paid   |                         |                         |
|     in full     |                         |                         |
|                 |                         |                         |
| -   Receipt     |                         |                         |
|     must print  |                         |                         |
|     liquor      |                         |                         |
|     licence     |                         |                         |
|     number      |                         |                         |
|     (legal      |                         |                         |
|                 |                         |                         |
|    requirement) |                         |                         |
|                 |                         |                         |
| -   Refund on   |                         |                         |
|     empties:    |                         |                         |
|     bottle      |                         |                         |
|     deposit     |                         |                         |
|     tracking +  |                         |                         |
|     refund at   |                         |                         |
|     counter     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🍸 **Bar, Pub & |                         |                         |
| Sports Bar**    |                         |                         |
| ---             |                         |                         |
| *On-consumption |                         |                         |
| · Tab           |                         |                         |
| management ·    |                         |                         |
| Sports viewing  |                         |                         |
| nights · High   |                         |                         |
| volume*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Tab         | -   Draft beer          | -   Groway Tab:         |
|     management: |     tracking: keg stock |     consumer adds funds |
|     open tab    |     (litres → pints →   |     via app to pre-fund |
|     per         |     revenue)            |     their bar tab       |
|                 |                         |                         |
| customer/table, | -   Spirits by measure: | -   QR menu: drinks     |
|     add rounds  |     25ml / 50ml pour    |     list, cocktail      |
|                 |     tracking vs bottle  |     specials, food menu |
|    continuously |     stock               |                         |
|                 |                         | -   Table QR: consumer  |
| -   Round       | -   Bar snacks          |     orders round from   |
|     tracker:    |     inventory           |     phone (waiter       |
|     quick       |     integration with    |     delivers)           |
|     \'same      |     kitchen if food     |                         |
|     again\'     |     served              | -   Sports event        |
|     button for  |                         |     pre-booking         |
|     groups      | -   Liquor licence:     |     (reserve table for  |
|                 |     on-consumption      |     big match)          |
| -   Age verify: |     licence (different  |                         |
|     mandatory   |     from off-sales)     | -   Groway Rewards on   |
|     biometric   |                         |     every tab close     |
|     or ID scan  | -   Age restriction     |                         |
|     before tab  |     compliance:         | -   WhatsApp event      |
|     opened      |     bouncers tab-linked |     notifications:      |
|                 |     to entry age verify |     \'Tonight: R50      |
| -   Cashier     |                         |     all-you-can-drink   |
|     float per   | -   Trading hours:      |     house beer\'        |
|     bartender   |     midnight/2am        |                         |
|                 |     enforcement         | -   GroCredit: new bar  |
| (accountability |     (province-specific) |     equipment (draught  |
|     per staff   |                         |     system, glass       |
|     member)     | -   Staff commission    |     washer)             |
|                 |     and tip tracking    |                         |
| -   Happy hour: |     per bartender       |                         |
|     automatic % |                         |                         |
|     discount    | -   VAT: 15% on all     |                         |
|     during set  |     on-site consumption |                         |
|     time        |                         |                         |
|     windows     |                         |                         |
|                 |                         |                         |
| -   Split tab:  |                         |                         |
|     divide by   |                         |                         |
|     person or   |                         |                         |
|     by item at  |                         |                         |
|     close       |                         |                         |
|                 |                         |                         |
| -   Pre-fund    |                         |                         |
|     tab:        |                         |                         |
|     customer    |                         |                         |
|     loads       |                         |                         |
|     Groway      |                         |                         |
|     Wallet      |                         |                         |
|     amount onto |                         |                         |
|     tab         |                         |                         |
|                 |                         |                         |
| -   Sports      |                         |                         |
|     event mode: |                         |                         |
|     larger      |                         |                         |
|     drink       |                         |                         |
|     tiles,      |                         |                         |
|     fewer       |                         |                         |
|     modifiers   |                         |                         |
|     for speed   |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🕺 **Nightclub  |                         |                         |
| & Entertainment |                         |                         |
| Venue** ---     |                         |                         |
| *Late night ·   |                         |                         |
| Entry ticketing |                         |                         |
| · Wristband     |                         |                         |
| system ·        |                         |                         |
| Promoter        |                         |                         |
| tables*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Entry point | -   Liquor licence:     | -   Groway Ticket: sell |
|     POS: scan   |                         |     nightclub entry via |
|     e-ticket QR | entertainment/nightclub |     Groway consumer app |
|     or sell     |     special licence     |                         |
|     walk-in     |     (LASA)              | -   QR code entry:      |
|     ticket      |                         |     consumer shows QR   |
|                 | -   Trading hours:      |     at door             |
| -   Wristband   |     province-specific   |                         |
|     activation  |     late licence        | -   Groway Rewards:     |
|     (RFID/NFC)  |     (1am--4am depending |     points on ticket    |
|     --- tap to  |     on province)        |     purchase            |
|     pay at all  |                         |                         |
|     bar points  | -   Security log:       | -   Promoter portal:    |
|                 |     incident register   |     track their booking |
| -   Table/booth |     compliance          |     performance,        |
|     booking     |                         |     payouts             |
|     with        | -   Venue capacity      |                         |
|     minimum     |     compliance: Fire    | -   WhatsApp event      |
|     spend       |     and Disaster Act    |     invites: share      |
|     allocation  |                         |     event + Groway      |
|                 | -   Staff clock-in/out  |     buy-ticket link     |
| -   Promoter    |     by zone (bar, door, |                         |
|     commission  |     floor)              | -   Mini online store:  |
|     tracker:    |                         |     buy VIP table       |
|     assigned to | -   Wristband stock     |     packages online     |
|     bookings +  |     management (RFID    |                         |
|     headcount   |     tags as inventory   | -   Wristband RFID      |
|                 |     items)              |     payment: linked to  |
| -   Bar POS:    |                         |     Groway Wallet       |
|     simplified  | -   Excise register for |     (cashless venue)    |
|     mode for    |     bulk liquor         |                         |
|     speed       |     purchases           |                         |
|     (one-tap    |                         |                         |
|     items, no   | -   Sound and           |                         |
|     modifiers)  |     entertainment       |                         |
|                 |     licence (municipal) |                         |
| -   Age verify  |                         |                         |
|     at door --- |                         |                         |
|     mandatory   |                         |                         |
|     (under-18   |                         |                         |
|     lock)       |                         |                         |
|                 |                         |                         |
| -               |                         |                         |
|    End-of-night |                         |                         |
|     wristband   |                         |                         |
|                 |                         |                         |
|  reconciliation |                         |                         |
|                 |                         |                         |
| -   VIP tab     |                         |                         |
|     management  |                         |                         |
|     with credit |                         |                         |
|     limit       |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🛒 **Grocery & FMCG** · 5 sub-verticals                               |
|                                                                       |
| *From Pick n Pay-style superettes to township spaza shops ---         |
| zero-rated VAT complexity*                                            |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🏪 **Superette  |                         |                         |
| & Convenience   |                         |                         |
| Store** ---     |                         |                         |
| *Full grocery · |                         |                         |
| 200--2,000 SKUs |                         |                         |
| · High          |                         |                         |
| transaction     |                         |                         |
| volume*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Barcode     | -   1,200+ pre-loaded   | -   Electricity STS     |
|     scanner POS |     grocery SKUs with   |     tokens (huge volume |
|     (           |     barcodes            |     --- convenience     |
| Honeywell/Zebra |     (Checkers/PnP       |     stores are key      |
|     hardware    |     equivalent)         |     agents)             |
|                 |                         |                         |
|    integration) | -   PLU codes for       | -   Airtime & data for  |
|                 |     weighed items       |     all SA networks     |
| -   Zero-rated  |     (banana, apples,    |                         |
|     VAT         |     cheese by kg)       | -   Bill payments:      |
|     auto-split: |                         |     DStv, insurance,    |
|     staples     | -   Promoted price      |     traffic fines,      |
|     (zero) vs   |     scheduling: mark    |     rates               |
|     standard    |     items on special    |                         |
|     items (15%) |     with start/end      | -   Groway Rewards on   |
|                 |     dates               |     every shop          |
| -   Scale       |                         |                         |
|                 | -   Minimum stock       | -   Lotto ticket sales  |
|    integration: |     alert: auto-draft   |     integration (NLC    |
|     weighed     |     GroSupply RFQ when  |     licence required)   |
|     goods (deli |     below par           |                         |
|     counter,    |                         | -   Mini online store:  |
|     fruit &     | -   Expiry tracking on  |     WhatsApp order +    |
|     veg)        |     dairy, bakery,      |     delivery            |
|                 |     fresh produce       |                         |
| -   Quick cash  |                         | -   GroSupply:          |
|     tender with | -   FIFO rotation       |     automated weekly    |
|     prominent   |     alerts: oldest      |     order from          |
|     change      |     stock to front      |     wholesale suppliers |
|     display     |                         |                         |
|                 | -   VAT 201             |                         |
| -   Customer    |     auto-segregation:   |                         |
|     loyalty:    |     zero-rated vs       |                         |
|     scan Groway |     standard-rated      |                         |
|     Wallet QR   |     daily summary       |                         |
|     for points  |                         |                         |
|                 | -   Shrinkage tracking: |                         |
| -   Multiple    |     variance report     |                         |
|     tender:     |     daily, weekly       |                         |
|     cash +      |                         |                         |
|     Groway      |                         |                         |
|     Wallet +    |                         |                         |
|     card in one |                         |                         |
|     transaction |                         |                         |
|                 |                         |                         |
| -   Returns:    |                         |                         |
|     receipt     |                         |                         |
|     lookup +    |                         |                         |
|     stock       |                         |                         |
|     reversal in |                         |                         |
|     one step    |                         |                         |
|                 |                         |                         |
| -   Cashier     |                         |                         |
|     performance |                         |                         |
|     dashboard   |                         |                         |
|                 |                         |                         |
|  (items/minute, |                         |                         |
|     voids)      |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🏘️ **Spaza      |                         |                         |
| Shop** ---      |                         |                         |
| *Township &     |                         |                         |
| informal        |                         |                         |
| settlement      |                         |                         |
| retail ·        |                         |                         |
| isiZulu/Sesotho |                         |                         |
| UI · Community  |                         |                         |
| pillar*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Large icon, | -   600 core spaza SKUs | -   Airtime & data      |
|     image-first |     pre-loaded (mealie  |     (primary revenue    |
|     tiles       |     meal, bread, milk,  |     item)               |
|                 |     pilchards, baked    |                         |
|   (low-literacy |     beans, etc.)        | -   Electricity tokens  |
|     UX design)  |                         |     (STS prepaid ---    |
|                 | -   Supplier credit     |     very high volume)   |
| -   Language    |     tracking: owe to    |                         |
|     toggle:     |     wholesaler, track   | -   Stokvel wallet      |
|     isiZulu ·   |     manually or via     |     integration (accept |
|     Sesotho ·   |     GroSupply           |     group               |
|     Afrikaans · |                         |     contributions)      |
|     English on  | -   Stock-on-hand       |                         |
|     one tap     |     simple count: tap   | -   Groway agent        |
|                 |     to update, no       |     banking: consumers  |
| -   Airtime at  |     complex batch       |     can                 |
|     top of      |     tracking needed     |     deposit/withdraw    |
|     screen ---  |                         |     cash at spaza       |
|     #1 revenue  | -   VAT: most spaza     |                         |
|     item        |     operators below R1M | -   Bill payments:      |
|                 |     threshold ---       |     send-to-family      |
| -               |     VAT-exempt but must |     (airtime gifts)     |
|  Cash-dominant: |     track               |                         |
|     change due  |                         | -   GroCredit: small    |
|     in HUGE     | -   Business            |     working capital     |
|     font        |     registration: CSD   |     loans (R2K--R20K    |
|                 |     (Central Supplier   |     for stock buildup)  |
| -   Stokvel     |     Database)           |                         |
|     wallet      |     registration        | -   Groway delivery:    |
|     acceptance  |     guidance            |     residents can order |
|     ---         |                         |     for home delivery   |
|     community   | -   Municipal trading   |     from spaza          |
|     group       |     licence compliance  |                         |
|     payment     |                         |                         |
|                 | -   Daily cash          |                         |
| -   Simple      |     reconciliation:     |                         |
|     barcode     |     money in drawer vs  |                         |
|     scan or     |     system sales        |                         |
|     image-tap   |                         |                         |
|     ordering    | -   GroSupply:          |                         |
|                 |     Makro/Jumbo/Metro   |                         |
| -   WhatsApp    |     wholesale           |                         |
|     order       |     integration         |                         |
|     queue:      |                         |                         |
|     community   |                         |                         |
|     members     |                         |                         |
|     pre-order   |                         |                         |
|     via         |                         |                         |
|     WhatsApp    |                         |                         |
|                 |                         |                         |
| -   Offline     |                         |                         |
|     mode: works |                         |                         |
|     without     |                         |                         |
|     data (72h   |                         |                         |
|     buffer)     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🥩 **Butchery** |                         |                         |
| ---             |                         |                         |
| *Meat-focused · |                         |                         |
| Weighed sales · |                         |                         |
| Braai culture · |                         |                         |
| Wholesale +     |                         |                         |
| retail*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Scale POS   | -   SKU by cut AND      | -   QR digital menu:    |
|                 |     weight: manage      |     weekly specials,    |
|    integration: |     stock in kg, not    |     braai pack photos,  |
|                 |     units               |     prices              |
| price-by-weight |                         |                         |
|     for all     | -   Carcass breakdown:  | -   WhatsApp weekly     |
|     cuts        |     full carcass → cuts |     specials broadcast  |
|                 |     → weight allocation |     to subscribers      |
| -   Cut         |                         |                         |
|     selection   | -   Cold chain          | -   GroSupply: direct   |
|     screen:     |     compliance: fridge  |     link to             |
|     beef, pork, |     temp log (HACCP,    |     NDA-registered      |
|     lamb,       |     R638)               |     abattoir suppliers  |
|     chicken --- |                         |                         |
|     each with   | -   Supplier invoice:   | -   Groway Rewards:     |
|     standard    |     purchase per head   |     loyalty on butchery |
|     cuts        |     (live weight) or    |     spend               |
|                 |     dressed weight      |                         |
| -   Braai pack  |                         | -   Mini online store:  |
|     builder:    | -   FIFO rotation:      |     braai pack          |
|     customer    |     oldest cuts         |     pre-orders for      |
|     selects     |     highlighted         |     weekend collection  |
|     cuts,       |     (sell-by date)      |                         |
|     system      |                         | -   GroCredit: cold     |
|     calculates  | -   VAT: meat ---       |     room, display       |
|     total       |     standard 15%        |     refrigerator        |
|                 |     (except bone meal   |     equipment finance   |
| -   Custom      |     --- zero-rated)     |                         |
|     order:      |                         | -   Catering order      |
|     portion     | -   Abattoir            |     channel: corporate  |
|     size +      |     certification log   |     braai order with    |
|     preparation |     (meat supplier must |     delivery            |
|                 |     be NDA-registered)  |                         |
|    instructions |                         |                         |
|                 | -   Staff skill tags:   |                         |
| -   Wholesale   |     trained butcher vs  |                         |
|     mode: B2B   |     counter staff       |                         |
|     invoice for |                         |                         |
|     res         |                         |                         |
| taurant/caterer |                         |                         |
|     customers   |                         |                         |
|                 |                         |                         |
| -   Marinades   |                         |                         |
|     and rubs    |                         |                         |
|     upsell at   |                         |                         |
|     checkout    |                         |                         |
|                 |                         |                         |
| -   Cash +      |                         |                         |
|     Groway QR   |                         |                         |
|     dominant    |                         |                         |
|     payment     |                         |                         |
|     methods     |                         |                         |
|                 |                         |                         |
| -   Printer:    |                         |                         |
|     price       |                         |                         |
|     labels for  |                         |                         |
|                 |                         |                         |
|    pre-packaged |                         |                         |
|     cuts        |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 💆 **Health & Beauty** · 6 sub-verticals                              |
|                                                                       |
| *SA\'s fastest-growing informal sector --- from Sandton spas to       |
| township salons*                                                      |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| ✂️ **Hair       |                         |                         |
| Salon** ---     |                         |                         |
| *Women\'s and   |                         |                         |
| men\'s hair ·   |                         |                         |
| Braiding ·      |                         |                         |
| Weaves ·        |                         |                         |
| Natural hair ·  |                         |                         |
| Township to     |                         |                         |
| suburb*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Appointment | -   Service SKU         | -   QR menu: service    |
|     calendar:   |     catalogue: wash &   |     catalogue with      |
|     stylist ×   |     blowdry, relaxer,   |     photos, prices,     |
|     timeslot    |     weave, braids,      |     stylist bios        |
|     grid        |     locs, colour, trim  |                         |
|     (week/day   |                         | -   Book via Groway     |
|     view)       | -   Retail inventory:   |     app: consumer       |
|                 |     hair products,      |     browses available   |
| -   Walk-in     |     shampoos,           |     slots and books     |
|     mode: add   |     conditioners,       |                         |
|     to queue,   |     accessories         | -   Groway Rewards:     |
|     show        |                         |     earn points on      |
|     estimated   | -   Consumables:        |     every visit         |
|     wait time   |     relaxer, colour,    |                         |
|                 |     toner (tracked per  | -   Prepaid bundles     |
| -   Service     |     service)            |     sold via consumer   |
|     menu: each  |                         |     app (buy 10         |
|     service     | -   Stylist performance |     services upfront)   |
|     linked to   |     dashboard: services |                         |
|     stylist +   |     per day, revenue,   | -   WhatsApp            |
|     duration +  |     commission          |     appointment         |
|     price       |                         |     reminders +         |
|                 | -   Client record: hair |     day-before          |
| -   Stylist     |     history (last       |     confirmation        |
|     commission: |     service, notes,     |                         |
|                 |     allergies to        | -   Mini online store:  |
|  auto-calculate |     products)           |     retail hair         |
|     per service |                         |     products delivered  |
|     at session  | -   Health Act          |     to home             |
|     close       |     compliance:         |                         |
|                 |     sterilisation log   | -   Instagram/TikTok    |
| -   Retail      |     for tools           |     link: share \'Book  |
|     upsell:     |                         |     with me via         |
|     shampoo,    | -   VAT: services 15%,  |     Groway\' link in    |
|                 |     retail products 15% |     bio                 |
|    conditioner, |                         |                         |
|     hair        | -   Municipal beauty    |                         |
|     products at |     salon operating     |                         |
|     checkout    |     permit              |                         |
|                 |                         |                         |
| -   Group       |                         |                         |
|     booking:    |                         |                         |
|     bridal      |                         |                         |
|     party or    |                         |                         |
|     friends     |                         |                         |
|     block-book  |                         |                         |
|     together    |                         |                         |
|                 |                         |                         |
| -   Prepaid     |                         |                         |
|     package:    |                         |                         |
|     buy 5       |                         |                         |
|     blowdrys,   |                         |                         |
|     get 1 free  |                         |                         |
|     (stored in  |                         |                         |
|     consumer    |                         |                         |
|     app)        |                         |                         |
|                 |                         |                         |
| -   Tip prompt  |                         |                         |
|     via Groway  |                         |                         |
|     Wallet at   |                         |                         |
|     checkout    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 💅 **Nail Salon |                         |                         |
| & Nail Bar**    |                         |                         |
| --- *Gel,       |                         |                         |
| acrylic, nail   |                         |                         |
| art ·           |                         |                         |
| Standalone or   |                         |                         |
| within beauty   |                         |                         |
| complex*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Service     | -   Product inventory:  | -   QR menu: service    |
|     selection:  |     gels, acrylics,     |     catalogue with nail |
|     gel,        |     polishes, top       |     art portfolio       |
|     acrylic,    |     coats, tools        |     photos              |
|     SNS, nail   |                         |                         |
|     art,        | -   Product tracking    | -   Online booking via  |
|     pedicure,   |     per nail            |     Groway consumer app |
|     manicure    |     technician: who     |                         |
|                 |     used what per       | -   Groway Rewards on   |
| -   Nail        |     service             |     every appointment   |
|     technician  |                         |                         |
|     assignment: | -   Sanitation          | -   Instagram booking   |
|     each tech   |     compliance:         |     link: \'Book via    |
|     has own     |     single-use items    |     Groway\' in nail    |
|     calendar    |     (files, buffers) vs |     art posts           |
|                 |     reusable (clamps,   |                         |
| -   Add-on      |     nippers)            | -   WhatsApp            |
|     upsell:     |                         |     appointment         |
|     nail art    | -   Health Act:         |     reminders           |
|     design      |     sterilisation       |                         |
|     (+price),   |     register for        | -   Gift vouchers:      |
|     gel         |     reusable tools      |     \'Treat your mom to |
|     upgrade,    |                         |     a gel manicure\'    |
|     nail repair | -   Expiry tracking on  |                         |
|                 |     gel products        | -   Mini online store:  |
| -               |                         |     nail care kit       |
|  Duration-based | -   Stylist commission  |     delivery to home    |
|     scheduling: |     on services +       |                         |
|     gel set =   |     product upsells     |                         |
|     90min,      |                         |                         |
|     manicure =  | -   Client allergy      |                         |
|     45min       |     record: latex       |                         |
|                 |     allergies, product  |                         |
| -   Client      |     sensitivities       |                         |
|     photo       |                         |                         |
|     record:     | -   VAT: 15% on all     |                         |
|     nail design |     services and retail |                         |
|     photos      |     products            |                         |
|     saved to    |                         |                         |
|     client      |                         |                         |
|     profile     |                         |                         |
|                 |                         |                         |
| -   Group       |                         |                         |
|     booking:    |                         |                         |
|                 |                         |                         |
|    bachelorette |                         |                         |
|     nail day    |                         |                         |
|     for 6+      |                         |                         |
|     clients     |                         |                         |
|                 |                         |                         |
| -   Walk-in     |                         |                         |
|     queue with  |                         |                         |
|     live wait   |                         |                         |
|     time        |                         |                         |
|     display     |                         |                         |
|                 |                         |                         |
| -   Package     |                         |                         |
|     deal:       |                         |                         |
|     hands +     |                         |                         |
|     feet combo  |                         |                         |
|     at combined |                         |                         |
|     price       |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🧖 **Spa &      |                         |                         |
| Wellness        |                         |                         |
| Centre** ---    |                         |                         |
| *Luxury to      |                         |                         |
| mid-market ·    |                         |                         |
| Massages ·      |                         |                         |
| Facials · Body  |                         |                         |
| treatments ·    |                         |                         |
| Waxing*         |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Treatment   | -   Treatment product   | -   QR digital menu:    |
|     booking:    |     inventory: massage  |     treatment menu with |
|     therapist × |     oils, facial        |     descriptions,       |
|     room ×      |     products, waxing    |     durations, prices   |
|     duration    |     supplies            |                         |
|     management  |                         | -   Online booking:     |
|                 | -   COSS (Cost of       |     consumer books via  |
| -   Room        |     Service Sold) per   |     Groway app          |
|     allocation  |     treatment           |                         |
|     board:      |                         | -   Groway Rewards:     |
|     which       | -   Health Act          |     earn luxury tier    |
|     treatment   |     compliance:         |     points (higher earn |
|     room is in  |     therapist           |     rate --- premium    |
|     use /       |     registration        |     category)           |
|     available   |     (SAAHIP / SAGA)     |                         |
|                 |                         | -   Gift vouchers sold  |
| -   Series      | -   Hygiene compliance  |     via consumer app    |
|     booking:    |     log: linen changes, |     (top gift product   |
|     book        |     sanitation per room |     in SA)              |
|     5-session   |                         |                         |
|     facial      | -   Contraindication    | -   WhatsApp package    |
|     series      |     management per      |     enquiry → Groway    |
|     upfront     |     client record       |     Wallet deposit to   |
|                 |                         |     confirm             |
| -   Guest       | -   VAT: 15% on all spa |                         |
|     experience  |     services            | -   Corporate wellness  |
|     notes:      |                         |     packages via B2B    |
|                 | -   Professional        |     invoice + GroSupply |
|    preferences, |     indemnity insurance |                         |
|     con         |     tracking (per       | -   Retail product mini |
| traindications, |     therapist)          |     online store (spa   |
|     oil         |                         |     brands for home     |
|     allergies   | -   Municipal health    |     use)                |
|                 |     certificate         |                         |
| -   Membership  |     compliance          |                         |
|     management: |                         |                         |
|     monthly spa |                         |                         |
|     membership  |                         |                         |
|     with        |                         |                         |
|     included    |                         |                         |
|     treatments  |                         |                         |
|                 |                         |                         |
| -   Gift        |                         |                         |
|     voucher     |                         |                         |
|     generation: |                         |                         |
|     digital,    |                         |                         |
|     redeemable  |                         |                         |
|     at POS      |                         |                         |
|                 |                         |                         |
| -   Package     |                         |                         |
|     builder:    |                         |                         |
|     \'Pamper    |                         |                         |
|     Day\'       |                         |                         |
|     (massage +  |                         |                         |
|     facial +    |                         |                         |
|     lunch)      |                         |                         |
|                 |                         |                         |
| -   Corporate   |                         |                         |
|     wellness    |                         |                         |
|     packages:   |                         |                         |
|     bulk        |                         |                         |
|     booking for |                         |                         |
|     company     |                         |                         |
|     wellness    |                         |                         |
|     days        |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 👗 **Fashion & Apparel** · 4 sub-verticals                            |
|                                                                       |
| *Clothing boutiques to secondhand stores --- variant matrix is the    |
| core challenge*                                                       |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 👔 **Clothing   |                         |                         |
| Boutique &      |                         |                         |
| Fashion         |                         |                         |
| Retail** ---    |                         |                         |
| *Independent    |                         |                         |
| fashion ·       |                         |                         |
| Multi-brand ·   |                         |                         |
| High SKU count  |                         |                         |
| with variants*  |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Variant     | -   Variant matrix      | -   QR product          |
|     selector:   |     inventory: each     |     catalogue: scan     |
|     Style →     |     size/colour         |     in-store tag to see |
|     Size        |     combination is a    |     available sizes and |
|     (X          |     unique SKU          |     colours             |
| S/S/M/L/XL/2XL) |                         |                         |
|     → Colour →  | -   Reorder triggers:   | -   Mini online store:  |
|     Price       |     alert when size M   |     WhatsApp + Groway   |
|                 |     in a style goes     |     web store           |
| -   Barcode     |     below 2 units       |     (click-and-collect) |
|     scan or     |                         |                         |
|     visual      | -   Seasonal markdown   | -   Groway Rewards:     |
|     product     |     scheduling: 30% →   |     earn fashion tier   |
|     browse      |     50% → clearance     |     points              |
|                 |                         |                         |
| -   Laybye      | -   Open-to-buy         | -   Laybye accessible   |
|     creation:   |     planning: budget vs |     via consumer app    |
|     item        |     stock value control |     (consumer tracks    |
|     reserved,   |                         |     their own laybye)   |
|     instalment  | -   Shrinkage tracking: |                         |
|     schedule    |     security tag        | -   Instagram/TikTok    |
|     set at      |     management          |     shop integration:   |
|     counter     |                         |     link to Groway      |
|                 | -   Supplier invoice vs |     checkout            |
| -   Re          |     delivery            |                         |
| turns/exchange: |     reconciliation via  | -   Delivery            |
|     receipt     |     GroSupply           |     integration for     |
|     lookup →    |                         |     online orders       |
|     size/colour | -   VAT: 15% on all     |                         |
|     swap →      |     clothing and        | -   GroCredit: season   |
|     stock       |     accessories         |     stock funding (buy  |
|     update      |                         |     summer range in     |
|                 | -   SABS compliance:    |     advance)            |
| -   Gift        |     children\'s         |                         |
|     wrapping    |     clothing safety     | -   GroSupply: access   |
|     upsell at   |     (flammability       |     to SA fashion       |
|     checkout    |     standards)          |     wholesalers         |
|                 |                         |     (Braamfontein, Salt |
| -   Fitting     |                         |     River markets)      |
|     room tag    |                         |                         |
|     system:     |                         |                         |
|     customer    |                         |                         |
|     takes       |                         |                         |
|     items,      |                         |                         |
|     associate   |                         |                         |
|     tracks      |                         |                         |
|                 |                         |                         |
| -   Promotions  |                         |                         |
|     engine:     |                         |                         |
|     BOGO, 30%   |                         |                         |
|     off racks,  |                         |                         |
|     student     |                         |                         |
|     discount    |                         |                         |
|                 |                         |                         |
| -   Staff       |                         |                         |
|                 |                         |                         |
|    performance: |                         |                         |
|     units sold, |                         |                         |
|     conversion  |                         |                         |
|     rate,       |                         |                         |
|     average     |                         |                         |
|     basket      |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 👟 **Shoe       |                         |                         |
| Store** ---     |                         |                         |
| *Footwear ·     |                         |                         |
| Brands · Sports |                         |                         |
| shoes · Formal  |                         |                         |
| · Casual ·      |                         |                         |
| Kids*           |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Size run    | -   Size run            | -   QR in-store         |
|     management: |     replenishment:      |     display: scan to    |
|     same style  |     reorder entire size |     see all available   |
|     available   |     run when any size   |     sizes               |
|     in sizes    |     runs low            |                         |
|     3--12       |                         | -   Mini online store:  |
|     (adult),    | -   Brand allocation    |     browse, reserve,    |
|     1--7 (kids) |     tracking:           |     collect             |
|                 |     Nike/Adidas/local   |                         |
| -   Width       |     brand budget        | -   Groway Rewards on   |
|     variant:    |     control             |     every purchase      |
|                 |                         |                         |
|   standard/wide | -   Display stock vs    | -   School shoe voucher |
|     fitting     |     back stock          |     programme:          |
|                 |     separation          |     municipality or     |
| -   Try         |                         |     employer-funded     |
| -before-you-buy | -   Returns policy      |                         |
|     tracking:   |     management: 30-day  | -   WhatsApp stock      |
|     shoes taken |     exchange (Consumer  |     enquiry: \'Do you   |
|     to fitting  |     Protection Act)     |     have size 9 in the  |
|     area        |                         |     Nike Air Force?\'   |
|                 | -   Defective stock     |                         |
| -   Stock room  |     return to supplier  | -   GroCredit: range    |
|     runner      |     workflow            |     funding for         |
|     screen:     |                         |     back-to-school      |
|     floor staff | -   VAT: 15% on all     |     season              |
|     request     |     footwear            |                         |
|     size from   |                         | -   Laybye: spread      |
|     stockroom   | -   Season changeover:  |     footwear cost over  |
|                 |     summer/winter range |     instalments         |
| -   Multi-pair  |     rollover            |                         |
|     purchase:   |                         |                         |
|     buy 3 pay   | -   GroSupply: access   |                         |
|     for 2       |     to footwear         |                         |
|     (promotion  |     importers and brand |                         |
|     engine)     |     distributors        |                         |
|                 |                         |                         |
| -   Loyalty on  |                         |                         |
|     Groway:     |                         |                         |
|     earn on     |                         |                         |
|     every pair  |                         |                         |
|                 |                         |                         |
| -   School shoe |                         |                         |
|     season      |                         |                         |
|     mode:       |                         |                         |
|     simplified  |                         |                         |
|     filter for  |                         |                         |
|                 |                         |                         |
|  back-to-school |                         |                         |
|     rush        |                         |                         |
|                 |                         |                         |
| -   Repair      |                         |                         |
|     upsell:     |                         |                         |
|     resoling,   |                         |                         |
|     heel        |                         |                         |
|     replacement |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 💊 **Health & Pharmacy** · 4 sub-verticals                            |
|                                                                       |
| *Most compliance-intensive vertical --- SAHPRA, Schedule drugs,       |
| medical aid billing*                                                  |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🏥 **Full       |                         |                         |
| Community       |                         |                         |
| Pharmacy** ---  |                         |                         |
| *Registered     |                         |                         |
| pharmacist ·    |                         |                         |
| Dispensary +    |                         |                         |
| front shop ·    |                         |                         |
| Medical aid     |                         |                         |
| billing*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Dual        | -   500+ medicine SKUs  | -   Chronic medication  |
|     screen:     |     with NAPPI codes    |     reminders via       |
|     Dispensary  |     (National Article   |     Groway consumer app |
|     (script     |     Product Price       |                         |
|     workflow) + |     Index)              | -   Prescription        |
|     Front Shop  |                         |     collection          |
|     (OTC) side  | -   Schedule            |     notification:       |
|     by side     |     classification      |     \'Your medication   |
|                 |     embedded in every   |     is ready\'          |
| -   Script      |     medicine record     |                         |
|     receipt:    |                         | -   Medical aid         |
|     patient     | -   Cold chain: fridge  |     co-payment via      |
|     details,    |     temp log (2--8°C    |     Groway Wallet       |
|     prescriber, |     for vaccines,       |                         |
|     date,       |     insulins)           | -   Groway Rewards:     |
|     ICD-10 code |                         |     earn health points  |
|                 | -   SAHPRA compliance:  |     on OTC purchases    |
| -   Schedule    |     dangerous           |                         |
|     check:      |     substances licence  | -   Mini online store:  |
|     system      |     register            |     OTC product         |
|     classifies  |                         |     delivery to home    |
|     each item   | -   Controlled          |                         |
|     (S0--S6)    |     substances          | -   GroSupply:          |
|                 |     register: S5/S6     |     pharmaceutical      |
|   automatically |     units dispensed vs  |     wholesaler          |
|                 |     stock (SARS/SAHPRA  |     procurement         |
| -   S5/S6       |     audit-ready)        |     (Dis-Chem Direct,   |
|     dispensing: |                         |     Alliance            |
|     pharmacist  | -   Batch and expiry    |     Healthcare)         |
|     PIN         |     management: recall  |                         |
|     (biometric) |     alert system        | -   Immunisation        |
|     mandatory   |                         |     record:             |
|     before      | -   Patient record:     |     customer-facing     |
|     proceeding  |     allergy flags,      |     vaccination record  |
|                 |     chronic conditions, |     in Groway health    |
| -   Medical aid |     current medications |     profile             |
|     billing:    |                         |                         |
|     Discovery,  | -   VAT: medicines      |                         |
|     Bonitas,    |     zero-rated          |                         |
|     GEMS,       |     (Schedule 1 of VAT  |                         |
|     Medihelp    |     Act)                |                         |
|     real-time   |                         |                         |
|     claim       |                         |                         |
|                 |                         |                         |
| -   Repeat      |                         |                         |
|                 |                         |                         |
|    prescription |                         |                         |
|     management: |                         |                         |
|     chronic     |                         |                         |
|     patient     |                         |                         |
|                 |                         |                         |
|   auto-reminder |                         |                         |
|                 |                         |                         |
| -   OTC         |                         |                         |
|     counter:    |                         |                         |
|     barcode     |                         |                         |
|     scan,       |                         |                         |
|     loyalty,    |                         |                         |
|     quick       |                         |                         |
|     checkout    |                         |                         |
|                 |                         |                         |
| -   Pharmacist  |                         |                         |
|                 |                         |                         |
|    verification |                         |                         |
|     screen      |                         |                         |
|     before any  |                         |                         |
|     script is   |                         |                         |
|     dispensed   |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🌿 **Health     |                         |                         |
| Shop &          |                         |                         |
| Supplement      |                         |                         |
| Store** ---     |                         |                         |
| *Vitamins ·     |                         |                         |
| Supplements ·   |                         |                         |
| Natural         |                         |                         |
| remedies · No   |                         |                         |
| S5/S6*          |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Product     | -   SKU management:     | -   QR product          |
|     browser:    |     vitamins, minerals, |     catalogue: scan     |
|     search by   |     proteins,           |     barcode to see full |
|     health      |     superfoods, herbals |     nutritional info    |
|     benefit,    |                         |                         |
|     brand,      | -   Shelf-life          | -   Mini online store:  |
|     ingredient  |     tracking: expiry    |     supplement          |
|                 |     dates on all        |     subscription        |
| -   Bundle      |     supplements         |     delivery            |
|     deals:      |                         |                         |
|     protein     | -   Compliance:         | -   Groway Rewards:     |
|     shake +     |     products must have  |     health tier ---     |
|     creatine +  |     Health Products     |     higher earn rate    |
|     shaker at   |     Regulatory          |     for health          |
|     combo price |     Authority (HPRA)    |     purchases           |
|                 |     registration        |                         |
| -   Loyalty     |                         | -   WhatsApp wellness   |
|     with health | -   Import permits for  |     content: recipes,   |
|     points      |     certain supplement  |     workout tips        |
|     earning     |     ingredients         |     (customer consent)  |
|     (premium    |                         |                         |
|     tier)       | -   No S5/S6 medicines  | -   GroCredit: seasonal |
|                 |     --- any             |     stock finance       |
| -   Staff       |     prescription item   |     (January health     |
|                 |     must be referred to |     resolutions rush)   |
|    consultation |     pharmacist          |                         |
|     log:        |                         | -   GroSupply:          |
|     customer    | -   VAT: supplements    |     supplement          |
|     health goal |     --- 15% (unless     |     wholesaler          |
|     noted per   |     specifically        |     catalogue (USN,     |
|     visit       |     zero-rated food     |     Evox, NPO           |
|                 |     item)               |     distributors)       |
| -               |                         |                         |
|    Subscription | -   Staff               |                         |
|     model:      |     certifications:     |                         |
|     monthly     |     nutritional adviser |                         |
|     supplement  |     training records    |                         |
|     auto-order  |                         |                         |
|                 | -   Product returns:    |                         |
| -   Bulk buy:   |     health products --- |                         |
|     sports      |     sealed only         |                         |
|     nutrition   |                         |                         |
|     packaging   |                         |                         |
|     sizes (500g |                         |                         |
|     / 1kg /     |                         |                         |
|     2.5kg)      |                         |                         |
|                 |                         |                         |
| -   QR scan:    |                         |                         |
|     product     |                         |                         |
|     detail,     |                         |                         |
|                 |                         |                         |
|    ingredients, |                         |                         |
|                 |                         |                         |
|  certifications |                         |                         |
|                 |                         |                         |
| -   Age-gated   |                         |                         |
|     products:   |                         |                         |
|     steroids    |                         |                         |
|     precursors  |                         |                         |
|     (adult      |                         |                         |
|     account     |                         |                         |
|                 |                         |                         |
|   verification) |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🏨 **Hospitality & Lodging** · 4 sub-verticals                        |
|                                                                       |
| *From boutique hotels to rural B&Bs --- room management meets POS*    |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🏩 **Boutique   |                         |                         |
| Hotel** ---     |                         |                         |
| *Rooms · F&B ·  |                         |                         |
| Events ·        |                         |                         |
| Channel         |                         |                         |
| management ·    |                         |                         |
| Foreign guests* |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Room grid:  | -   Property Management | -   Groway consumer     |
|     live status |     System (PMS)        |     app: direct booking |
|     (availabl   |     overlay on Groway   |     (no OTA commission) |
| e/occupied/dirt |     POS                 |                         |
| y/out-of-order) |                         | -   QR digital menu for |
|                 | -   Rate management:    |     in-room dining      |
| -               |     rack rate,          |     orders              |
|    Reservation: |     corporate rate, OTA |                         |
|     walk-in +   |     contracted rate,    | -   Groway Wallet:      |
|     phone + OTA |     group rate          |     guest folio         |
|     (Booki      |                         |     settlement at       |
| ng.com/Expedia) | -   Channel manager     |     checkout            |
|     in one view |     integration:        |                         |
|                 |     Booking.com,        | -   Groway Rewards:     |
| -   Guest       |     Expedia, STO        |     accommodation earn  |
|     folio: all  |     (prevent            |     tier (premium ---   |
|     charges     |     overbooking)        |     3× points)          |
|     accumulate  |                         |                         |
|     (room +     | -   Revenue per         | -   Mini online store:  |
|                 |     Available Room      |     book spa            |
|    restaurant + |     (RevPAR) dashboard  |     treatments,         |
|     minibar +   |                         |     activities,         |
|     parking)    | -   VAT: 15% on         |     transfers           |
|                 |     accommodation and   |                         |
| -   Pre-auth:   |     F&B                 | -   WhatsApp guest      |
|     card hold   |                         |     communication:      |
|     for         | -   Tourism levy: 1%    |     pre-arrival,        |
|     incidentals |     tourism levy (TBCSA |     in-stay, post-stay  |
|     at check-in |     registered          |                         |
|                 |     properties)         | -   GroCredit: room     |
| -   Late        |                         |     renovation finance  |
|     checkout    | -   CATHSSETA staff     |     (R50K--R500K        |
|     and early   |     certification       |     facility)           |
|     check-in    |     compliance tracking |                         |
|     upsell      |                         | -   GroSupply: linen,   |
|                 | -   OTA commission      |     amenities, F&B      |
| -               |     reconciliation:     |     procurement         |
|    Housekeeping |     Booking.com/Expedia |                         |
|     board: room |     invoices vs         |                         |
|     status      |     bookings            |                         |
|     updated by  |                         |                         |
|     housekeeper |                         |                         |
|     on mobile   |                         |                         |
|     app         |                         |                         |
|                 |                         |                         |
| -   Room        |                         |                         |
|     upsell:     |                         |                         |
|     standard →  |                         |                         |
|     deluxe →    |                         |                         |
|     suite       |                         |                         |
|     upgrade at  |                         |                         |
|     check-in    |                         |                         |
|                 |                         |                         |
| -   Foreign     |                         |                         |
|     national    |                         |                         |
|     register:   |                         |                         |
|     passport    |                         |                         |
|     photocopy   |                         |                         |
|     log (DIRCO  |                         |                         |
|                 |                         |                         |
|    requirement) |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🏡 **Guest      |                         |                         |
| House, B&B &    |                         |                         |
| Airbnb-style**  |                         |                         |
| ---             |                         |                         |
| *Owner-operated |                         |                         |
| · Small scale   |                         |                         |
| (2--20 rooms) · |                         |                         |
| Personal touch* |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Simple      | -   Room rate           | -   Groway direct       |
|     booking     |     management:         |     booking: eliminate  |
|     calendar:   |     seasonal pricing    |     OTA commission      |
|     month view, |     (peak/off-peak)     |     (save 15--20%)      |
|     drag to     |                         |                         |
|     block dates | -   Guest register: ID  | -   QR welcome pack:    |
|                 |     document record     |     WiFi code, house    |
| -               |     (Municipal by-law   |     rules, local        |
|   Self-check-in |     requirement)        |     recommendations     |
|     PIN code    |                         |                         |
|     generation  | -   Electricity and     | -   Groway Rewards for  |
|     (send via   |     consumables cost    |     repeat guests       |
|     WhatsApp to |     tracking per stay   |                         |
|     guest)      |                         | -   WhatsApp            |
|                 | -   Airbnb/VRBO channel |     pre-arrival:        |
| -   Breakfast   |     sync (optional, if  |     directions,         |
|     tick-sheet: |     owner wants)        |     parking, check-in   |
|     dietary     |                         |     code                |
|                 | -   Municipal           |                         |
|    requirements |     guesthouse licence  | -   GroCredit: property |
|     per guest   |     (applicable in Cape |     improvement loan    |
|     per day     |     Town, JHB, etc.)    |     (solar, renovation) |
|                 |                         |                         |
| -   Bill        | -   Income tax: rental  | -   Mini online store:  |
|     management: |     income reporting    |     sell experiences    |
|     simple room |     support             |     (wine tour, cooking |
|     rate +      |                         |     class) alongside    |
|     extras      | -   VAT: above R1M      |     accommodation       |
|     (breakfast, |     threshold ---       |                         |
|     parking,    |     accommodation VAT   |                         |
|     laundry)    |     applicable          |                         |
|                 |                         |                         |
| -   House rules | -   TGCSA star grading  |                         |
|     display:    |     optional compliance |                         |
|     shown       |     checklist           |                         |
|     digitally   |                         |                         |
|     to guest    |                         |                         |
|     pre-arrival |                         |                         |
|                 |                         |                         |
| -   Owner app:  |                         |                         |
|     manage      |                         |                         |
|     property    |                         |                         |
|     from phone  |                         |                         |
|     (           |                         |                         |
| approve/decline |                         |                         |
|     requests)   |                         |                         |
|                 |                         |                         |
| -   Guest       |                         |                         |
|     messaging:  |                         |                         |
|     WhatsApp    |                         |                         |
|     built into  |                         |                         |
|     booking     |                         |                         |
|     flow        |                         |                         |
|                 |                         |                         |
| -   Cash or     |                         |                         |
|     Groway      |                         |                         |
|     Wallet      |                         |                         |
|     payment at  |                         |                         |
|     checkout    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🔧 **Professional & Trade Services** · 5 sub-verticals                |
|                                                                       |
| *Workflow-first verticals --- jobs, not transactions*                 |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🚗 **Auto       |                         |                         |
| Repair & Panel  |                         |                         |
| Beating** ---   |                         |                         |
| *Vehicles · Job |                         |                         |
| cards · Parts · |                         |                         |
| Insurance work  |                         |                         |
| · Workshop      |                         |                         |
| management*     |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Job card    | -   Parts inventory:    | -   QR service menu:    |
|     creation:   |     500+ automotive     |     service pricing     |
|                 |     parts (oil filters, |     visible in Groway   |
|    registration |     brake pads, tyres,  |     consumer app        |
|     plate →     |     etc.)               |                         |
|     make/model  |                         | -   Digital job card:   |
|     → fault     | -   VIN-linked parts    |     customer can track  |
|     description |     lookup: correct     |     their car\'s        |
|                 |     parts for specific  |     progress            |
| -   Technician  |     vehicle             |                         |
|     assignment: |                         | -   Groway Wallet: pay  |
|     job         | -   Workshop bay        |     for service via app |
|     allocated   |     management: track   |     at collection       |
|     to          |     which bay is        |                         |
|     qualified   |     occupied            | -   GroCredit:          |
|     mechanic    |                         |     diagnostic          |
|                 | -   Technician          |     equipment, wheel    |
| -   Parts       |     productivity: jobs  |     alignment machine   |
|     order:      |     per day, hours      |     finance             |
|     order parts |     booked vs hours     |                         |
|     via         |     worked              | -   GroSupply: OEM and  |
|     GroSupply   |                         |     aftermarket parts   |
|     directly    | -   Labour rate         |     procurement         |
|     from job    |     schedule: different |                         |
|     card        |     rates per job type  | -   Groway Rewards:     |
|                 |     (service vs major   |     earn points on      |
| -   Labour      |     repair)             |     every service       |
|     pricing:    |                         |                         |
|     flat rate   | -   Insurance work      | -   WhatsApp service    |
|     or          |     rates: separate     |     reminders:          |
|     time-based  |     rate card for       |     \'10,000km service  |
|     (hours ×    |     insurance repairs   |     due --- book now\'  |
|     labour      |                         |                         |
|     rate)       | -   VAT: 15% on parts   |                         |
|                 |     and labour          |                         |
| -   Customer    |                         |                         |
|                 | -   MasterTech / RMI    |                         |
|  authorisation: |     (Retail Motor       |                         |
|     send quote  |     Industry)           |                         |
|     via         |     compliance for      |                         |
|     WhatsApp →  |     registered          |                         |
|     customer    |     workshops           |                         |
|     approves    |                         |                         |
|     before work |                         |                         |
|     starts      |                         |                         |
|                 |                         |                         |
| -   Progress    |                         |                         |
|     updates:    |                         |                         |
|                 |                         |                         |
|    SMS/WhatsApp |                         |                         |
|     milestone   |                         |                         |
|     alerts      |                         |                         |
|     (\'Your car |                         |                         |
|     is ready\') |                         |                         |
|                 |                         |                         |
| -   Invoice     |                         |                         |
|     generation: |                         |                         |
|     parts +     |                         |                         |
|     labour +    |                         |                         |
|     VAT,        |                         |                         |
|     AASA-format |                         |                         |
|                 |                         |                         |
| -   Insurance   |                         |                         |
|     claim job:  |                         |                         |
|     link to     |                         |                         |
|     insurer     |                         |                         |
|     reference   |                         |                         |
|     number      |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🧺 **Laundry &  |                         |                         |
| Dry Cleaning**  |                         |                         |
| --- *Drop-off   |                         |                         |
| tickets ·       |                         |                         |
| Workflow        |                         |                         |
| tracking ·      |                         |                         |
| Machine         |                         |                         |
| integration ·   |                         |                         |
| Subscriptions*  |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Drop-off    | -   Garment tracking:   | -   Consumer app: track |
|     ticket:     |     each item tagged    |     your laundry status |
|     unique QR   |     and logged at       |     live                |
|     code per    |     drop-off            |                         |
|     customer    |                         | -   QR collection       |
|     drop-off    | -   Fabric care         |     notification:       |
|                 |     compliance: staff   |     \'Your laundry is   |
| -   Workflow    |     trained on care     |     ready --- collect   |
|     kanban:     |     labels (Consumer    |     code: 4521\'        |
|     Received →  |     Protection Act)     |                         |
|     Sorted →    |                         | -   Groway Wallet       |
|     Washing →   | -   Machine maintenance |     machine payment (no |
|     Drying →    |     log: service        |     cash at machine)    |
|     Ready →     |     intervals per       |                         |
|     Collected   |     machine             | -   Groway Rewards on   |
|                 |                         |     subscription        |
| -   Machine     | -   Revenue per machine |                         |
|     activation: |     tracking:           | -   GroCredit:          |
|     QR scan     |     utilisation rate    |     commercial washing  |
|     activates   |                         |     machines, ironing   |
|                 | -   Subscription        |     equipment finance   |
|    washer/dryer |     billing: debit on   |                         |
|     (Groway     |     same day each       | -   WhatsApp status     |
|     Wallet      |     week/month          |     updates per ticket  |
|     pays)       |                         |                         |
|                 | -   Chemical inventory: | -   Mini store: fabric  |
| -   Locker      |     detergents,         |     softener, clothing  |
|     system:     |     softeners, dry      |     bags sold at        |
|     assign      |     cleaning solvents   |     counter             |
|                 |                         |                         |
|   PIN-protected | -   Environmental       |                         |
|     locker for  |     compliance: waste   |                         |
|                 |     water from dry      |                         |
| self-collection |     cleaning chemicals  |                         |
|                 |                         |                         |
| -               | -   Staff task          |                         |
|    Subscription |     assignment: which   |                         |
|     packages:   |     staff member        |                         |
|     5kg/week    |     processed which     |                         |
|                 |     items               |                         |
|    subscription |                         |                         |
|                 |                         |                         |
|    auto-debited |                         |                         |
|     from Groway |                         |                         |
|     Wallet      |                         |                         |
|                 |                         |                         |
| -   Rush        |                         |                         |
|     service:    |                         |                         |
|     surcharge   |                         |                         |
|     added,      |                         |                         |
|     priority    |                         |                         |
|     queue       |                         |                         |
|     position    |                         |                         |
|                 |                         |                         |
| -               |                         |                         |
|   Bulk/business |                         |                         |
|     laundry:    |                         |                         |
|     B2B invoice |                         |                         |
|     for hotels, |                         |                         |
|     hospitals,  |                         |                         |
|     restaurants |                         |                         |
|                 |                         |                         |
| -               |                         |                         |
|   Multi-branch: |                         |                         |
|     track items |                         |                         |
|     across      |                         |                         |
|     multiple    |                         |                         |
|     collec      |                         |                         |
| tion/processing |                         |                         |
|     points      |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🕊️ **Funeral    |                         |                         |
| Home &          |                         |                         |
| Mortuary** ---  |                         |                         |
| *Compassionate  |                         |                         |
| · Cultural      |                         |                         |
| compliance ·    |                         |                         |
| FSP licence ·   |                         |                         |
| Payment plans*  |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Case        | -   Package inventory:  | -   Funeral insurance   |
|     creation:   |     coffins, caskets,   |     claims: client can  |
|     deceased    |     urns (SKU by style  |     use existing policy |
|     details,    |     and material)       |     --- Groway          |
|     family      |                         |     facilitates claim   |
|     contact,    | -   Funeral services    |                         |
|     funeral     |     chart of accounts:  | -   Groway Wallet:      |
|     date        |     case revenue,       |     instalments paid    |
|                 |     direct costs, gross |     easily via consumer |
| -   Package     |     margin per case     |     app                 |
|                 |                         |                         |
|   configurator: | -   FSP (Funeral        | -   Compassionate       |
|                 |     Service Provider)   |     credit: GroCredit   |
|  coffin/casket, |     licence compliance  |     interest-free       |
|     flowers,    |     tracking            |     30-day option       |
|     transport,  |                         |                         |
|     catering,   | -   Funeral parlour     | -   Groway Rewards:     |
|     venue,      |     operating licence   |     earn posthumous;    |
|     programs    |     (Department of      |     redirect to family  |
|                 |     Health)             |     account             |
| -   Cultural    |                         |                         |
|     compliance  | -   Body refrigeration  | -   WhatsApp family     |
|     flags:      |     log: compliance     |     communication:      |
|     religion,   |     with Health Act     |     respectful, clear,  |
|     cultural    |                         |     proactive           |
|     practices,  | -   Case closure:       |                         |
|     specific    |     financial           | -   Memorial mini-page: |
|                 |     settlement,         |     loved one\'s        |
|    requirements |     outstanding balance |     digital memorial    |
|     noted       |     cleared             |     via Groway app      |
|                 |                         |                         |
| -   Payment     | -   SAIA-registered     | -   GroSupply: coffin   |
|     plan        |     funeral insurance   |     manufacturers,      |
|     calculator: |     verification for    |     florist, catering   |
|     total       |     cases               |     supplier            |
|     package →   |                         |     procurement         |
|     deposit →   | -   Staff training:     |                         |
|     instalment  |     Funeral Directors   |                         |
|     schedule    |     qualification       |                         |
|                 |     compliance          |                         |
| -   Third-party |                         |                         |
|     coordinator |                         |                         |
|     board:      |                         |                         |
|     hearse      |                         |                         |
|     hire,       |                         |                         |
|     grave,      |                         |                         |
|     church,     |                         |                         |
|     catering    |                         |                         |
|                 |                         |                         |
|    coordination |                         |                         |
|                 |                         |                         |
| -   Document    |                         |                         |
|     management: |                         |                         |
|     death       |                         |                         |
|                 |                         |                         |
|    certificate, |                         |                         |
|     burial      |                         |                         |
|     order       |                         |                         |
|     upload      |                         |                         |
|                 |                         |                         |
| -   Family      |                         |                         |
|     WhatsApp    |                         |                         |
|     group:      |                         |                         |
|     automatic   |                         |                         |
|     updates on  |                         |                         |
|                 |                         |                         |
|    arrangements |                         |                         |
|                 |                         |                         |
| -   Staff       |                         |                         |
|     dignity     |                         |                         |
|     protocol:   |                         |                         |
|     all screens |                         |                         |
|     use         |                         |                         |
|     respectful  |                         |                         |
|     language    |                         |                         |
|     throughout  |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🎭 **Sport, Leisure & Events** · 4 sub-verticals                      |
|                                                                       |
| *Membership-driven · Session-based · Africa\'s passion for sport and  |
| entertainment*                                                        |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 💪 **Gym &      |                         |                         |
| Fitness         |                         |                         |
| Studio** ---    |                         |                         |
| *Commercial gym |                         |                         |
| · Boutique      |                         |                         |
| studio ·        |                         |                         |
| CrossFit ·      |                         |                         |
| Pilates · Yoga* |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Membership  | -   Member database:    | -   Consumer app:       |
|     POS:        |     fitness goals,      |     member scans QR at  |
|     monthly     |     health notes,       |     gate                |
|     debit       |     emergency contact   |                         |
|     (DebiCheck  |                         | -   Class booking via   |
|     from        | -   Class capacity      |     consumer app: 48h   |
|     Groway),    |     management:         |     advance, cancel up  |
|     day pass,   |     waitlist when full  |     to 2h before        |
|     class pass  |                         |                         |
|                 | -   PT contract         | -   Groway Rewards: gym |
| -   Check-in    |     management:         |     tier --- earn       |
|     gate:       |     sessions sold,      |     health points on    |
|     Groway QR   |     sessions used,      |     attendance          |
|     or NFC      |     expiry              |                         |
|     wristband   |                         | -   Member referral     |
|     for member  | -   Equipment           |     programme: bring a  |
|     access      |     maintenance log:    |     friend, earn month  |
|                 |     each machine        |     free                |
| -   Class       |     service interval    |                         |
|     booking:    |     tracking            | -   Mini store: protein |
|     live        |                         |     supplements, gym    |
|     schedule,   | -   Locker allocation:  |     gear, branded       |
|     member      |     daily vs permanent  |     merchandise         |
|     books class |     locker rental       |                         |
|     on consumer |                         | -   WhatsApp class      |
|     app         | -   Staff               |     reminders: \'Your   |
|                 |     certification:      |     Pilates class is in |
| -   Personal    |     Biokineticist,      |     30 minutes\'        |
|     trainer     |     Personal Trainer,   |                         |
|     session     |     Group Fitness       | -   GroCredit: gym      |
|     billing: PT |     registration        |     equipment finance   |
|     logs        |                         |     (treadmills, free   |
|     session →   | -   VAT: gym membership |     weights, cardio     |
|                 |     --- 15% standard    |     equipment)          |
|   auto-invoices |     rated               |                         |
|     member      |                         |                         |
|                 | -   National Fitness    |                         |
| -   Equipment   |     Association (NFA)   |                         |
|     rental:     |     or REPS SA staff    |                         |
|     gloves,     |     compliance          |                         |
|     towel       |                         |                         |
|     rental      |                         |                         |
|     tracked per |                         |                         |
|     session     |                         |                         |
|                 |                         |                         |
| -   Walk-in day |                         |                         |
|     pass: quick |                         |                         |
|     sell at     |                         |                         |
|     reception   |                         |                         |
|                 |                         |                         |
| -   Smoothie    |                         |                         |
|     bar POS:    |                         |                         |
|     quick-sell  |                         |                         |
|     food/drinks |                         |                         |
|     at front    |                         |                         |
|     desk        |                         |                         |
|                 |                         |                         |
| -   Freeze      |                         |                         |
|     request:    |                         |                         |
|     member      |                         |                         |
|     requests    |                         |                         |
|     hold,       |                         |                         |
|     system      |                         |                         |
|     adjusts     |                         |                         |
|     next debit  |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------+-------------------------+-------------------------+
| 🎪 **Events     |                         |                         |
| Venue &         |                         |                         |
| Entertainment   |                         |                         |
| Centre** ---    |                         |                         |
| *Bookings ·     |                         |                         |
| Ticketing ·     |                         |                         |
| Catering ·      |                         |                         |
| Capacity        |                         |                         |
| management*     |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Event       | -   Venue inventory:    | -   Groway Tickets:     |
|     calendar:   |     tables, chairs,     |     sell event tickets  |
|     multi-date  |     linen, AV equipment |     via consumer app    |
|     booking     |     (tracked for        |                         |
|     with        |     damage)             | -   QR entry: consumer  |
|                 |                         |     scans ticket QR at  |
| setup/breakdown | -   Catering inventory  |     door                |
|     time        |     integration (if     |                         |
|     blocked     |     in-house catering)  | -   Groway Wallet: pay  |
|                 |                         |     bar tab, bid at     |
| -   Capacity    | -   Municipal events    |     auctions, donate    |
|     management: |     permit: for events  |                         |
|     set max pax |     \> 100 pax          | -   Mini online store:  |
|     per event,  |     (Disaster           |     sell event packages |
|     track RSVPs |     Management Act)     |     online              |
|                 |                         |                         |
| -   Venue       | -   Liquor permit:      | -   Groway Rewards on   |
|     package     |                         |     ticket purchases    |
|     builder:    |    temporary/occasional |                         |
|     hourly      |     liquor licence per  | -   WhatsApp invites:   |
|     hire +      |     event               |     event organisers    |
|     tables +    |                         |     share Groway        |
|     chairs +    | -   Safety compliance:  |     booking link        |
|     AV +        |     fire exits,         |                         |
|     catering    |     capacity            | -   Corporate events    |
|                 |     certificate         |     invoice via B2B     |
| -   Deposit     |                         |     module              |
|     workflow:   | -   Supplier contract   |                         |
|     book → pay  |     management: keep    | -   GroCredit: venue    |
|     50% deposit |     signed agreements   |     upgrade finance (AV |
|     → balance   |     per event           |     system, outdoor     |
|     due 7 days  |                         |     marquee)            |
|     before      | -   VAT: venue hire --- |                         |
|                 |     15%; private        |                         |
| -   On-the-day  |     function --- 15%    |                         |
|     POS: door   |                         |                         |
|     ticket      | -   Entertainment tax:  |                         |
|     sales, bar, |                         |                         |
|     food        |  municipality-specific, |                         |
|                 |     some apply          |                         |
| -   Seating     |                         |                         |
|     plan        |                         |                         |
|     builder     |                         |                         |
|     (for seated |                         |                         |
|     events)     |                         |                         |
|                 |                         |                         |
| -   Supplier    |                         |                         |
|     management: |                         |                         |
|     caterer,    |                         |                         |
|     DJ, decor   |                         |                         |
|     (coordinate |                         |                         |
|     via         |                         |                         |
|     GroSupply)  |                         |                         |
|                 |                         |                         |
| -   Post-event  |                         |                         |
|                 |                         |                         |
| reconciliation: |                         |                         |
|     actual vs   |                         |                         |
|     expected    |                         |                         |
|     revenue     |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 🔩 **Hardware & Building Supplies** · 3 sub-verticals                 |
|                                                                       |
| *Tradesperson-heavy · Quote-to-invoice · B2B accounts · High-value    |
| stock*                                                                |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🏗️ **Hardware   |                         |                         |
| Store &         |                         |                         |
| Building        |                         |                         |
| Supplies** ---  |                         |                         |
| *Nuts, bolts,   |                         |                         |
| paint, cement,  |                         |                         |
| plumbing ---    |                         |                         |
| complex SKU and |                         |                         |
| B2B accounts*   |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Account     | -   5,000+ hardware     | -   Trade account       |
|     customer    |     SKUs pre-loaded     |     access via Groway   |
|     POS: trade  |     (plumbing,          |     Merchant app:       |
|     account     |     electrical,         |     contractors check   |
|     lookup →    |     building, tools,    |     their balance,      |
|     purchase on |     paint)              |     reorder             |
|     credit →    |                         |                         |
|     monthly     | -   Trade account       | -   GroCredit:          |
|     statement   |     management:         |     revolving facility  |
|                 |     approved credit     |     for established     |
| -   Quotation   |     limit, statement    |     trade customers     |
|     builder:    |     generation monthly  |                         |
|     generate    |                         | -   QR product lookup:  |
|     quote on    | -   Multi-bin           |     scan product to see |
|     the spot    |     locations: stock    |     specifications,     |
|     for         |     stored across       |     SABS cert, price    |
|     contractor  |     warehouse and       |                         |
|     job         |     showroom            | -   WhatsApp quote:     |
|                 |                         |     contractor requests |
| -   Trade       | -   Minimum order       |     quote via WhatsApp, |
|     counter     |     quantities: some    |     received in \< 1    |
|     mode: quick |     suppliers require   |     hour                |
|     barcode     |     MOQ on orders       |                         |
|     scan, high  |                         | -   GroSupply:          |
|     volume,     | -   SABS compliance:    |     automated reorder   |
|     experienced |     stainless steel     |     of fast-moving      |
|     buyers      |     grades, electrical  |     hardware lines      |
|                 |     compliance markings |                         |
| -   Bulk        |                         | -   Delivery            |
|     quantity    | -   Dangerous goods:    |     integration: Groway |
|     pricing:    |     paint thinner, gas  |     Delivery for site   |
|                 |     cylinders ---       |     deliveries          |
|   auto-discount |     storage compliance  |                         |
|     when buying |                         | -   Mini online store:  |
|     \> 10 bags  | -   VAT: 15% on all     |     contractor can      |
|     of cement / |     hardware items (no  |     order online for    |
|     \> 50m of   |     zero-rated items in |     next-day delivery   |
|     pipe        |     this category)      |                         |
|                 |                         |                         |
| -               | -   GroSupply: direct   |                         |
|   Cut-to-length |     integration with    |                         |
|     items:      |     major hardware      |                         |
|     pipe, shade |     distributors        |                         |
|     cloth, DPC  |     (Builders           |                         |
|     --- sell by |     Warehouse, Ceramic, |                         |
|     metre       |     Plumblink)          |                         |
|                 |                         |                         |
| -   Project     |                         |                         |
|     code:       |                         |                         |
|     customer    |                         |                         |
|     can         |                         |                         |
|     reference   |                         |                         |
|     their job   |                         |                         |
|     number on   |                         |                         |
|     invoice     |                         |                         |
|     (for        |                         |                         |
|     accounting) |                         |                         |
|                 |                         |                         |
| -   Staff       |                         |                         |
|     assistance: |                         |                         |
|     look up     |                         |                         |
|     stock       |                         |                         |
|     levels in   |                         |                         |
|     back of     |                         |                         |
|     store from  |                         |                         |
|     counter     |                         |                         |
|                 |                         |                         |
| -   Credit      |                         |                         |
|     check at    |                         |                         |
|     POS: flag   |                         |                         |
|     when trade  |                         |                         |
|     account is  |                         |                         |
|     over limit  |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 📱 **Electronics & Technology** · 3 sub-verticals                     |
|                                                                       |
| *High-value · IMEI tracking · Repair workflow · Insurance             |
| replacement*                                                          |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 📲 **Phone &    |                         |                         |
| Electronics     |                         |                         |
| Retail +        |                         |                         |
| Repair** ---    |                         |                         |
| *Sell new/used  |                         |                         |
| devices,        |                         |                         |
| accessories;    |                         |                         |
| repair devices  |                         |                         |
| at same         |                         |                         |
| counter*        |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   IMEI        | -   IMEI register: all  | -   IMEI check:         |
|     capture at  |     new and secondhand  |     consumer can check  |
|     sale: every |     devices tracked     |     if a secondhand     |
|     handset     |     (RICA requirement)  |     device is stolen    |
|     logged with |                         |     (public service)    |
|     IMEI (theft | -   Parts inventory:    |                         |
|     prevention) |     screens, batteries, | -   Groway Rewards on   |
|                 |     charging ports, by  |     new device          |
| -   Repair job  |     device model        |     purchases (high     |
|     card:       |                         |     basket value = high |
|     device      | -   Warranty            |     points)             |
|     intake      |     management: 3-month |                         |
|     form, fault |     repair warranty     | -   Insurance claim     |
|                 |     logged per job card |     workflow: consumer  |
|    description, |                         |     submits via Groway  |
|     IMEI,       | -   ICASA compliance:   |     app                 |
|     customer    |     RICA registration   |                         |
|     contact     |     for SIM card sales  | -   WhatsApp repair     |
|                 |                         |     updates: \'Your     |
| -   Repair      | -   Secondhand Goods    |     screen has been     |
|     workflow:   |     Act compliance:     |     replaced --- ready  |
|     Received →  |     dealer licence for  |     for collection\'    |
|     Diagnosed → |     secondhand devices  |                         |
|     Parts       |                         | -   Mini online store:  |
|     Ordered →   | -   Consumer Protection |     accessories, screen |
|     In Repair → |     Act: 6-month        |     protectors, cases   |
|     Quality     |     warranty on         |     for delivery        |
|     Check →     |     repaired goods      |                         |
|     Ready       |                         | -   GroCredit: finance  |
|                 | -   VAT: 15% on all     |     for new handset     |
| -   Parts order |     electronics and     |     (instalment sale    |
|     from        |     repair services     |     --- NCA-aware)      |
|     GroSupply   |                         |                         |
|     direct from | -   Parts supplier:     | -   Airtime SIM         |
|     repair job  |     GroSupply linked to |     activation: full    |
|     card        |     approved parts      |     network activation  |
|                 |     importers           |     at point of sale    |
| -   Second-hand |                         |                         |
|     device      |                         |                         |
|     intake:     |                         |                         |
|     assess      |                         |                         |
|     condition → |                         |                         |
|     set resale  |                         |                         |
|     price →     |                         |                         |
|     stock it    |                         |                         |
|                 |                         |                         |
| -   Insurance   |                         |                         |
|     replacement |                         |                         |
|     POS:        |                         |                         |
|     Vodacom/MTN |                         |                         |
|     insurance   |                         |                         |
|     replacement |                         |                         |
|     workflow    |                         |                         |
|                 |                         |                         |
| -               |                         |                         |
|    Airtime/data |                         |                         |
|     top-up at   |                         |                         |
|     counter     |                         |                         |
|     (tied to    |                         |                         |
|     IMEI        |                         |                         |
|     database    |                         |                         |
|     for         |                         |                         |
|     legitimacy) |                         |                         |
|                 |                         |                         |
| -   Quotation   |                         |                         |
|     for repair: |                         |                         |
|     send via    |                         |                         |
|     WhatsApp    |                         |                         |
|     for         |                         |                         |
|     approval    |                         |                         |
|     before      |                         |                         |
|     starting    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| 📚 **Childcare & Education** · 4 sub-verticals                        |
|                                                                       |
| *Monthly recurring fees · Parent communication · SACE compliance ·    |
| Aftercare dominance*                                                  |
+-----------------------------------------------------------------------+

+-----------------+-------------------------+-------------------------+
| 🧒 **Crèche,    |                         |                         |
| Daycare &       |                         |                         |
| After-School    |                         |                         |
| Care** ---      |                         |                         |
| *SACE           |                         |                         |
| registered ·    |                         |                         |
| Parent billing  |                         |                         |
| · Child record  |                         |                         |
| management*     |                         |                         |
+-----------------+-------------------------+-------------------------+
| **POS Features  | **Inventory, ERP &      | **VAS & Revenue         |
| & Screens**     | Compliance**            | Add-ons**               |
|                 |                         |                         |
| -   Child       | -   Child register: ID, | -   Parent consumer     |
|                 |     parent contacts,    |     app: live           |
|   check-in/out: |     emergency contacts, |     check-in/out        |
|     parent      |     allergy/medical     |     notification, daily |
|     scans       |     notes               |     report, photo       |
|     Groway QR   |                         |     gallery             |
|     on arrival  | -   Subsidy tracking:   |                         |
|     and         |     DSD (Department of  | -   Monthly debit:      |
|     departure   |     Social Development) |     DebiCheck           |
|     (safety)    |     subsidy per         |     auto-debit from     |
|                 |     registered child    |     parent\'s Groway    |
| -   Incident    |                         |     Wallet or bank      |
|     report:     | -   Attendance          |                         |
|     digital log |     register: daily,    | -   Groway Rewards:     |
|     linked to   |     exportable for DSD  |     parents earn points |
|     child       |     compliance audit    |     on every monthly    |
|     record      |                         |     payment             |
|                 | -   SACE registration   |                         |
| -   Daily       |     compliance:         | -   WhatsApp daily      |
|     report      |     principal +         |     updates: photos,    |
|     card: food  |     teaching staff      |     milestones, notices |
|     eaten, nap  |     registration        |                         |
|     time,       |                         | -   GroCredit:          |
|     activities  | -   ECD compliance:     |     playground          |
|     --- sent to |     Grade R, Grade 00,  |     equipment,          |
|     parent via  |     Grade 000           |     classroom furniture |
|     WhatsApp    |     classification per  |     finance             |
|                 |     class               |                         |
| -   Monthly fee |                         | -   Mini store: school  |
|     invoice:    | -   Food safety: daily  |     uniform, stationery |
|                 |     meal log (HACCP     |     sold via Groway     |
|  auto-generated |     compliance for food |                         |
|     per child,  |     handling)           | -   Emergency contact   |
|     sent via    |                         |     portal: parent      |
|     WhatsApp on | -   VAT: childcare      |     updates contact     |
|     1st of      |     services ---        |     details via app     |
|     month       |     VAT-exempt (no VAT  |                         |
|                 |     charged to parents) |                         |
| -   Sibling     |                         |                         |
|     discount:   | -   Municipal ECD       |                         |
|                 |     facility operating  |                         |
|    auto-applied |     licence             |                         |
|     for         |                         |                         |
|     multiple    |                         |                         |
|     children    |                         |                         |
|     from same   |                         |                         |
|     family      |                         |                         |
|                 |                         |                         |
| -   Parent      |                         |                         |
|     account:    |                         |                         |
|     bill one    |                         |                         |
|     parent,     |                         |                         |
|     visibility  |                         |                         |
|     to both     |                         |                         |
|     parents     |                         |                         |
|                 |                         |                         |
| -   Staff ratio |                         |                         |
|     tracker:    |                         |                         |
|     alert if    |                         |                         |
|     child:staff |                         |                         |
|     ratio       |                         |                         |
|     exceeds DSD |                         |                         |
|     requirement |                         |                         |
|                 |                         |                         |
| -   Term        |                         |                         |
|     schedule:   |                         |                         |
|     timetable,  |                         |                         |
|     school      |                         |                         |
|     holidays,   |                         |                         |
|     staff leave |                         |                         |
|     calendar    |                         |                         |
+-----------------+-------------------------+-------------------------+

+-----------------------------------------------------------------------+
| **A** ── **QR Digital Menu · Geo-Discovery · Mini Online Store**      |
|                                                                       |
| *Three interconnected layers that turn every Groway merchant into a   |
| discoverable, shoppable digital presence*                             |
|                                                                       |
| No additional tech skills required --- configured in onboarding, live |
| in minutes                                                            |
+-----------------------------------------------------------------------+

**A.1 QR Digital Menu --- Specification**

Every Food & Beverage, Health & Beauty, and Hospitality merchant on
Groway automatically gets a QR-accessible digital menu. It is not a
separate app --- it lives within the Groway consumer app and as a
mobile-optimised web page. The merchant configures it from the Merchant
OS in under 10 minutes.

+-----------------------------------+-----------------------------------+
| **What the Consumer Sees**        | **What the Merchant Configures**  |
|                                   |                                   |
| -   Full-screen menu with hero    | -   Upload logo and hero image    |
|     photo of the merchant         |     from phone camera             |
|                                   |                                   |
| -   Categories: Starters / Mains  | -   Add items: photo + name +     |
|     / Drinks / Specials (Food) or |     description + price (max 2    |
|     Services / Packages           |     minutes per item)             |
|     (Beauty/Spa)                  |                                   |
|                                   | -   Mark items as Available or    |
| -   Each item: photo, name,       |     86\'d (sold out) in real-time |
|     description, price, allergens |                                   |
|                                   | -   Add allergen tags: nuts,      |
| -   \'Order Now\' button links to |     dairy, gluten, halal, kosher, |
|     Groway direct ordering        |     vegan                         |
|                                   |                                   |
| -   \'Get Directions\' --- opens  | -   Set table QR codes (1 per     |
|     Google Maps to merchant       |     table, printed on demand by   |
|                                   |     Groway)                       |
| -   Table number pre-filled if    |                                   |
|     they scanned a table QR       | -   Schedule specials: happy hour |
|                                   |     times, daily specials         |
| -   Estimated prep time shown     |     auto-show                     |
|     dynamically                   |                                   |
|                                   | -   Show or hide                  |
| -   Loyalty points shown:         |     delivery/collection/dine-in   |
|     \'You\'ll earn 34 points on   |     options                       |
|     this order\'                  |                                   |
|                                   | -   Preview exactly what customer |
|                                   |     sees before publishing        |
+-----------------------------------+-----------------------------------+

**QR Menu Technical Architecture**

  --------------- ------------------ -------------------------------------
  **Component**   **Technology**     **Detail**

  QR Code         QR Service (Port   Each merchant gets a static menu QR +
  Generation      3014) ---          per-table dynamic QRs. Static QR
                  EMVCo-compatible   never changes. Table QRs encode table
                                     number.

  Menu Rendering  Next.js SSR ---    URL: groway.app/menu/{merchant_slug}.
                  mobile-first web   Loads in \< 1.5s on 3G. Progressive
                  page               JPEG images, lazy-loaded. No app
                                     install required.

  In-App          React Native       When opened from Groway consumer app,
  Rendering       WebView with       shows native top bar with loyalty
                  native header      points and cart. Seamless transition
                                     from QR scan.

  Real-Time       WebSocket from     When merchant marks item as 86\'d,
  Updates         Menu Service       all open menu instances update within
                                     3 seconds. No stale menus.

  Order           Connects directly  Consumer taps \'Order\' → order sent
  Integration     to POS Service     to POS as table order → appears on
                  (3004)             KDS or waiter screen → payment via
                                     Groway Wallet at end.

  Offline         Cached menu        If merchant has no connectivity,
  Fallback        (last-known state) consumer still sees cached menu.
                                     Orders queued and synced when
                                     reconnected.
  --------------- ------------------ -------------------------------------

**A.2 Geo-Discovery --- Find Nearby Merchants**

Groway\'s Explore tab in the consumer app is a geo-aware merchant
discovery feed --- like Google Maps meets a loyalty programme. Every
registered merchant automatically appears on this map when their Groway
profile is complete. Consumers find them, engage, earn rewards, and
transact --- all within the Groway ecosystem.

  --------------- ---------------------- ---------------------------------
  **Feature**     **Consumer             **Merchant Benefit**
                  Experience**           

  Map View        Interactive map        Passive discovery --- no ad spend
                  showing nearby Groway  required. Merchant shows up
                  merchants.             automatically when consumer
                  Colour-coded by        searches their category nearby.
                  vertical (food =       
                  orange, beauty = pink, 
                  etc). Tap pin to see   
                  merchant card.         

  Category Filter Filter by: Food ·      Merchant appears in the exact
                  Beauty · Grocery ·     category and sub-category their
                  Health · Nightlife ·   business was set up as. Correct
                  Services. Sub-filter   sub-vertical selection = better
                  by sub-vertical (e.g.  discoverability.
                  Food → Shisa Nyama).   

  Merchant Card   Photo, name, rating,   Real-time trading hours shown
                  distance, price range  accurately. Closed merchants
                  (R/RR/RRR), opening    greyed out. \'Open now\' badge
                  hours, loyalty points  drives impulse visits.
                  preview (\'Earn up to  
                  200 points here\').    

  Directions      \'Get Directions\'     Consumer arrives already knowing
                  opens Google Maps with the merchant --- reduces \'is
                  merchant pinned.       this the right place?\'
                  Pre-filled walking,    hesitation.
                  driving, Uber time     
                  estimates.             

  Digital Menu    Tap merchant card →    Menu as a marketing tool --- food
  Preview         see top 6 menu items   photography drives desire before
                  with photos. \'View    consumer even arrives.
                  Full Menu\' opens full 
                  QR menu experience.    

  Book / Order    From merchant card:    Pre-committed customers = lower
  Ahead           \'Book a table\',      no-show rate. Revenue before door
                  \'Order online\',      opens.
                  \'Book appointment\'.  
                  Payment collected      
                  upfront via Groway     
                  Wallet.                

  Groway Verified Verified KYC merchants Trust signal --- especially
  Badge           show a teal checkmark. important for new merchants or
                  Consumers know         informal operators building
                  they\'re dealing with  credibility.
                  a legitimate business. 

  Reviews &       Post-transaction:      Reputation management built into
  Ratings         consumer rates         the platform. Merchants
                  experience 1--5        incentivised to maintain quality.
                  stars + optional text  
                  review. Merchant       
                  responds via Merchant  
                  OS.                    
  --------------- ---------------------- ---------------------------------

**A.3 Mini Online Store --- Click-and-Collect & Delivery**

Every Groway merchant gets a hosted mini online store --- a branded,
mobile-optimised storefront accessible via
groway.app/store/{merchant_slug} and discoverable in the Groway consumer
app\'s Explore → Online Stores section. No Shopify subscription, no
developer needed.

+-----------------------------------+-----------------------------------+
| **Store Features**                | **Merchant Management**           |
|                                   |                                   |
| -   Branded storefront: merchant  | -   Toggle store on/off: pause    |
|     logo, hero image, about       |     during busy periods or when   |
|     section                       |     understaffed                  |
|                                   |                                   |
| -   Product/service catalogue:    | -   Set delivery radius: 1km /    |
|     same as POS inventory, synced |     3km / 5km / 10km              |
|     automatically                 |                                   |
|                                   | -   Minimum order value for       |
| -   Order types: Collection       |     delivery (e.g. R100)          |
|     (ready in X minutes) ·        |                                   |
|     Delivery (within set km       | -   Set collection time: 20 min   |
|     radius) · Pre-order (specific |     for food / next-day for baked |
|     date/time)                    |     goods                         |
|                                   |                                   |
| -   Real-time stock: products     | -   Order management queue: new → |
|     automatically removed when    |     confirmed → ready →           |
|     zero-stock                    |     dispatched                    |
|                                   |                                   |
| -   Payment: Groway Wallet, card  | -   Delivery: integrate own       |
|     via Groway Pay, EFT           |     driver, or use Groway         |
|                                   |     Delivery (on-demand)          |
| -   Order tracking: consumer sees |                                   |
|     status (Received → Preparing  | -   Promotional banner: \'Free    |
|     → Ready → Delivered)          |     delivery on orders over R300  |
|                                   |     this weekend\'                |
| -   WhatsApp order confirmation:  |                                   |
|     auto-sent on every order      | -   Catalogue sync: add item to   |
|                                   |     POS inventory → auto-appears  |
| -   Loyalty: earn points on every |     in store                      |
|     online order (same as         |                                   |
|     in-store)                     |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **B** ── **Cross-Cutting Platform Modules**                           |
|                                                                       |
| *Inventory · ERP & Accounting · CRM & Marketing · Rewards · Payments  |
| · GroSupply · Retail Funding*                                         |
|                                                                       |
| Every module serves every vertical --- configured with                |
| vertical-specific defaults                                            |
+-----------------------------------------------------------------------+

**B.1 Inventory --- Vertical-Aware Stock Management**

Groway\'s inventory system adapts its interface and logic to the
merchant\'s vertical. A butcher\'s inventory UI looks and works
completely differently from a clothing store\'s --- even though the
underlying SKU, batch, and movement engine is the same service (Port
3005).

  ------------- ------------------ ------------------------- -----------------
  **Vertical    **Inventory Mode** **Key Differentiator**    **GroSupply
  Group**                                                    Trigger**

  Food &        Recipe-level       Each dish sold deducts    Reorder when
  Beverage      deduction          exact ingredient          mealie meal \<
                (ingredient        quantities from stock     5kg or chicken \<
                tracking)                                    3 portions

  Grocery &     Barcode scan +     Zero-rated vs standard    Weekly auto-RFQ
  FMCG          FIFO + expiry date VAT auto-split on every   for fast-movers
                mandatory          item                      (bread, milk,
                                                             eggs)

  Liquor        Excise register:   Case vs bottle unit       Monthly reorder
                bottle/case/keg    split; bottle deposit     from
                tracking + SARS    tracking                  DGB/Distell/SAB
                reporting                                    via GroSupply

  Fashion &     Variant matrix:    Size-run replenishment:   Seasonal
  Apparel       each size × colour reorder entire run when   open-to-buy:
                = unique SKU       any size \< 2             GroCredit funds
                                                             seasonal range

  Health &      Consumables per    Therapist-level product   Monthly reorder
  Beauty        service (ml of     usage tracking            of professional
                product per                                  products
                treatment)                                   

  Pharmacy      NAPPI codes +      S5/S6 register: dispensed Monthly
                Schedule           vs received balance       pharmaceutical
                classification +   (SAHPRA)                  wholesaler order
                cold chain                                   

  Hardware      Multi-location     Trade account allocation  Automated reorder
                bins,              tracking                  on 800+
                cut-to-length, MOQ                           fast-moving SKUs

  Electronics   IMEI per unit,     One unit = one inventory  Parts reorder
                warranty start,    record (no bulk quantity  from repair job
                secondhand intake  for phones)               card trigger
  ------------- ------------------ ------------------------- -----------------

**B.2 ERP & Accounting --- Built for SA Business Owners**

Every vertical gets a pre-configured chart of accounts (COA) on day one
--- mapped to their specific revenue and cost categories. The JAX AI
financial agent can explain any number in plain language, making
accounting accessible to owners who are not accountants.

  ---------------- ------------------------ ---------------------------------
  **Module**       **What It Does**         **Vertical-Specific Twist**

  Chart of         Pre-configured accounts: Restaurant: Food Sales, Liquor
  Accounts         revenue, COGS, expenses, Sales, Labour; Salon: Service
                   assets, liabilities      Revenue, Retail; Hotel: Rooms,
                                            F&B, Events

  Double-Entry     Every POS transaction    Debit Cash/Wallet/Card → Credit
  Ledger           auto-creates balanced    Revenue → Debit COGS → Credit
                   journal entry            Stock --- zero manual entry

  VAT 201          Segregates zero-rated vs Critical for grocery (zero-rated
  Auto-Draft       standard transactions    staples) and pharmacy (zero-rated
                   daily                    medicines) --- auto-calculated,
                                            SARS-ready

  Bank             Matches bank statement   Settlement batches tagged by
  Reconciliation   to Groway settlement     vertical, branch, payment method
                   batches (6 SA banks)     for clean reconciliation

  Invoice & Quotes Generate professional    Auto-applies trade account terms;
                   invoices for B2B clients PDF + WhatsApp delivery;
                                            AASA-standard for auto workshops

  Expense Capture  OCR receipt scan (Mindee Capture petrol, supplier
                   API) + manual entry      invoices, maintenance --- linked
                                            to chart of accounts
                                            automatically

  P&L Dashboard    Gross profit per         Restaurant: GP% per dish family;
                   product/service          Hotel: RevPAR and GOPPAR; Gym:
                   category, trending vs    revenue per member
                   same period LY           

  Cash Flow        13-week rolling forecast Hotel: uses room reservations to
  Forecast         based on booking         forecast revenue; Gym: uses
                   commitments + historic   active memberships
                   patterns                 

  JAX AI           NLP query: \'What was my Always responds in plain
  Accounting Agent best month this year?\', language, in the merchant\'s
                   \'Am I profitable?\'     language preference (11 SA
                                            languages supported)

  VAT / EMP201 /   Tax return preparation   PAYE/UIF/SDL auto-calculated from
  IRP5             assistance + SARS        payroll; VAT 201 auto-generated;
                   deadline alerts          IRP5 bulk print at tax year end
  ---------------- ------------------------ ---------------------------------

**B.3 CRM & Marketing --- Know Your Customer**

  --------------- ------------------------- ------------------------------
  **Feature**     **Description**           **Vertical Application**

  Customer        Full transaction history, Salon: hair history, stylist
  Profile         loyalty points, spend     preference; Restaurant:
                  patterns, visit           dietary requirements,
                  frequency, RFM score,     favourite table; Gym: fitness
                  birthday, preferences     goals, class preferences

  RFM             Recency (days since last  Automatically identify your
  Segmentation    visit) × Frequency        top 20% customers (responsible
                  (visits per month) ×      for \~80% of revenue) and your
                  Monetary (average spend)  at-risk regulars
                  --- auto-segments into    
                  Champions, Loyal,         
                  At-Risk, Lost             

  Churn Alert     Consumer hasn\'t          Gym: \'We miss you --- come
                  transacted in \> 30/60/90 back for a free class this
                  days (configurable) ---   week\'. Restaurant: \'20% off
                  alert to merchant + auto  your favourite table on
                  WhatsApp re-engagement    Saturday\'
                  offer                     

  WhatsApp        Segment → compose message Certified template only (no
  Campaigns       → schedule → send via     spam). Opt-in required at
                  WhatsApp Business API     checkout. Respect quiet hours
                                            (07:00--20:00 only)

  Birthday        Auto-send birthday        Bakery: \'Happy Birthday! Your
  Campaign        message + voucher to      free birthday cupcake is
                  every customer on their   waiting\'. Salon: \'15% off
                  birthday                  any service on your birthday\'

  Loyalty         Merchant sets earn rate:  Premium categories earn more:
  Programme       default 1 point per R1,   spa = 3× points. Age-gated
  Config          or configurable (e.g. 2×  categories: alcohol = 1× only.
                  points on treatments,     Kids services: points to
                  0.5× on tobacco)          parent\'s account

  Offer Creation  Create time-bound         Restaurant: Tuesday night
                  promotions: % off, free   special. Bottle store: case of
                  item, 2-for-1. Appears on beer discount. Gym: January
                  consumer offers feed +    joining fee waiver
                  geo-discovery card        

  Review          See all customer ratings. \'Thank you for the 5 stars,
  Management      Respond to reviews from   Nomsa! We look forward to
                  Merchant OS. Escalate     seeing you again.\' Proactive
                  negative reviews to       service recovery.
                  direct WhatsApp           
                  resolution                
  --------------- ------------------------- ------------------------------

**B.4 Rewards Architecture --- Groway Loyalty Platform**

The Groway Rewards system is the glue between consumers and merchants.
Merchants fund a portion of the reward (merchant-funded loyalty) and
Groway supplements from platform earnings. Every consumer earns across
all Groway merchants --- making the rewards more valuable than any
single-merchant loyalty card.

  ---------- ---------------- ------------------ ---------------------------
  **Tier**   **Points         **Earn Rate**      **Benefits**
             Threshold**                         

  Bronze     0 -- 999 points  1 point per R1     Welcome offer · Standard
                              spent at any       offers feed · Groway Wallet
                              Groway merchant    cashback

  Silver     1,000 -- 4,999   1.25 points per R1 Priority offers · 10% more
             points           spent              points at partner merchants
                                                 · Early access to flash
                                                 sales

  Gold       5,000 -- 19,999  1.5 points per R1  Exclusive Gold merchant
             points           spent              offers · Free delivery on
                                                 mini-store orders · VIP
                                                 geo-discovery badge

  Platinum   20,000+ points   2× points per R1   Dedicated account manager ·
                              spent              Best merchant rates ·
                                                 Groway Pay zero transaction
                                                 fee · Airport lounge
                                                 voucher (Year 2)
  ---------- ---------------- ------------------ ---------------------------

+-----------------------------------+-----------------------------------+
| **Merchant-Side Loyalty Config**  | **Consumer-Side Redemption**      |
|                                   |                                   |
| -   Set earn rate per category:   | -   Points visible on home screen |
|     standard, 2× on specific      |     balance card (alongside ZAR   |
|     products, 0× on excluded      |     balance)                      |
|     items (e.g. cigarettes,       |                                   |
|     tobacco)                      | -   Redeem at any Groway          |
|                                   |     merchant: 100 points = R1     |
| -   Create stamp card: buy 9      |     cashback discount             |
|     coffees get 1 free ---        |                                   |
|     digital, in consumer app      | -   Redeem for airtime: 500       |
|                                   |     points = R5 airtime           |
| -   Create milestone reward:      |                                   |
|     spend R1,000 this month, get  | -   Redeem for vouchers: gift     |
|     R50 voucher                   |     cards, merchant vouchers from |
|                                   |     points catalogue              |
| -   Run points booster campaign:  |                                   |
|     double points this weekend    | -   Stokvel group pooling: pool   |
|                                   |     points for group purchase     |
| -   Set minimum spend for points: |                                   |
|     only earn above R50 basket    | -   Gifting: transfer points to   |
|                                   |     family member (birthday,      |
| -   View loyalty ROI dashboard:   |     gift)                         |
|     loyalty members vs            |                                   |
|     non-members average spend     | -   Donate: convert points to     |
|     comparison                    |     charity donation (selected    |
|                                   |     NPOs)                         |
| -   Push offer to loyalty members |                                   |
|     only (exclusive)              | -   Points never expire if        |
|                                   |     account active (trade for SA  |
| -   Reactivation campaign: send   |     bank loyalty norms)           |
|     bonus points to lapsed        |                                   |
|     loyalty members               |                                   |
+-----------------------------------+-----------------------------------+

**B.5 Payments Stack --- Full Vertical Support**

  -------------- ------------------------ ------------------- -----------------
  **Payment      **Description**          **Vertical Fit**    **Settlement**
  Method**                                                    

  Groway Wallet  Consumer scans merchant  All verticals.      Real-time credit
  (QR)           QR with Groway app.      Especially F&B,     to merchant
                 Instant                  spaza, informal     wallet. Daily
                 wallet-to-wallet. Most   traders. Zero       batch settlement
                 cost-effective method.   hardware cost.      to bank account
                                                              by 10am.

  NFC Tap        Consumer taps wearable   Gym,                Same as QR ---
  (wearable)     (watch/ring/wristband)   events/nightclub,   real-time.
                 linked to Groway Wallet. hotel. Cashless     
                                          environments.       

  Card           Visa/Mastercard via      All verticals.      T+1 settlement to
  (Peach/Yoco)   Groway-integrated card   Required for        bank account.
                 terminal or Yoco         tourists (hotel,    
                 terminal pairing.        wine farm, upmarket 
                                          restaurant).        

  PayShap        Instant bank-to-bank     B2B suppliers,      Real-time gross
                 transfer via BankServ.   hardware,           settlement.
                 Consumer uses any SA     high-value          
                 bank app to pay          purchases.          
                 merchant\'s PayShap      Corporate invoices. 
                 proxy.                                       

  GoPay EFT      Instant EFT from         Online store        Same-day
                 consumer\'s bank.        orders. Catering    settlement.
                 Authenticated by         deposits. Funeral   
                 consumer\'s banking app. package deposits.   

  Cash           Cash tender at POS with  Spaza, Shisa Nyama, No settlement
                 change calculation and   street food,        needed ---
                 daily float              informal traders.   physical cash
                 reconciliation.          Never removed as    management.
                                          option.             

  BNPL (Buy Now  Consumer splits purchase Retail: clothing,   Merchant receives
  Pay Later)     into 3 interest-free     electronics,        full amount
                 instalments.             furniture.          upfront from
                 NCR-registered NCA       High-basket         Groway. Consumer
                 agreement.               verticals.          repays Groway.

  Laybye         Item reserved at 10--30% Clothing, footwear, Merchant receives
                 deposit. Consumer pays   electronics,        full payment only
                 instalments. Goods       funeral packages.   when laybye
                 released when paid in    SA-specific,        complete.
                 full.                    culturally          
                                          important.          

  Voucher        Merchant-issued or       Gift vouchers       Merchant redeems
                 Groway platform voucher. (beauty, spa,       voucher liability
                 Scanned/entered at       restaurant).        from Groway
                 checkout.                Promotions.         ledger.
                                          Corporate gifts.    

  Stokvel Wallet Group savings wallet --- Spaza, grocery,     Groway
                 multiple members         shisa nyama, large  distributes from
                 contribute. Group pays   purchase            stokvel pool to
                 jointly at merchant.     (furniture,         merchant wallet.
                                          electronics).       
                                          African-first.      

  Tab / House    Merchant extends credit  Bar, restaurant,    Merchant manages
  Account        to trusted customer. Run hotel, hardware     own credit risk.
                 up tab, settle           (trade accounts).   Groway
                 weekly/monthly.                              facilitates
                                                              statement
                                                              generation +
                                                              payment.
  -------------- ------------------------ ------------------- -----------------

**B.6 GroSupply Integration --- Procurement per Vertical**

GroSupply connects every Groway merchant to B-BBEE-verified South
African suppliers, with automated procurement triggered by Groway\'s
inventory system. The vertical determines which supplier categories are
pre-loaded and which procurement workflows are active.

  -------------- ------------------- ----------------- -------------- ---------------
  **Vertical**   **Pre-loaded        **Auto-Reorder    **GroSettle    **GroCredit Use
                 Supplier            Trigger**         Option**       Case**
                 Categories**                                         

  Food &         Fresh produce       When ingredient   30-day net     Seasonal:
  Beverage       wholesalers, meat   stock falls below (weekly        December party
                 suppliers, dry      2-day production  produce) /     season stock
                 goods distributors, level             Instant        buildup.
                 beverage                              (critical      R20K--R200K.
                 distributors                          last-minute)   

  Liquor         DGB, Distell, SAB,  When bottle stock 60-day net     December stock:
                 KWV, importers      \< 2 case         (standard) /   R50K--R500K
                 registered with     equivalents on    Instant (end   revolving
                 SARS                top-sellers       of month cash  facility for
                                                       flow)          big operators

  Grocery / FMCG Metro Cash & Carry, Weekly reorder on 30-day net     R5K--R50K
                 Jumbo, Makro, fresh 200 top-moving    (established   working capital
                 produce markets     SKUs              spazas with    for spazas.
                                                       history)       Short-term,
                                                                      high-volume.

  Health &       Professional        When service      30-day net     Equipment:
  Beauty         hair/beauty product product stock \<                 chair, basin,
                 distributors        2 weeks supply                   hood dryer
                 (Wella,                                              finance via
                 Schwarzkopf, OPI)                                    GroCredit.
                                                                      R15K--R100K.

  Pharmacy       Alliance            Weekly automated  Immediate      Cold room
                 Healthcare,         order on chronic  (cold chain    refrigeration
                 Dis-Chem Direct,    medication        items cannot   equipment.
                 wholesalers (cold   fast-movers       wait)          Professional
                 chain capable)                                       indemnity
                                                                      insurance.

  Hardware       Builders Warehouse, When any SKU hits 60-day net     Seasonal:
                 Plumblink, Cermaik, reorder point     (large orders) contractor
                 Voltex electrical   (configurable per / 30-day       season
                                     item)             (standard)     (Oct--Feb)
                                                                      stock buildup.
                                                                      R100K--R1M.

  Fashion &      SA fashion          Pre-season        30-day net     Seasonal range
  Apparel        wholesalers         open-to-buy plan                 funding:
                 (Braamfontein, Salt (2× per year:                    R50K--R500K.
                 River, Durban       summer/winter                    GroCredit
                 clothing districts) range)                           repaid from
                                                                      season sales.

  Electronics    Tarsus Technology,  When repair parts Immediate      Display
                 Networks Unlimited, stock depleted by (repair parts  equipment,
                 approved parts      job cards         cannot wait    diagnostic
                 importers                             --- customer   tools.
                                                       waiting)       R20K--R150K.
  -------------- ------------------- ----------------- -------------- ---------------

**B.7 Retail Funding --- Groway Finance Stack**

Groway\'s funding products are deeply integrated into the merchant
journey --- not a separate application, but a contextual offer that
appears when the merchant needs it most. Each product is governed by the
applicable South African regulation.

  ------------- -------------- --------------------- ------------------ --------------- -------------------
  **Product**   **Target       **Limit Range**       **Rate**           **Regulatory    **Trigger Moment**
                Vertical**                                              Framework**     

  GroCredit --- All verticals  R2,000--R2,000,000    Repo rate + 5--15% NCA (sole       Shown when
  Working                                            p.a. (risk-tiered) proprietors) /  inventory reorder
  Capital                                                               Commercial      \> available
                                                                        (companies)     balance. \'You need
                                                                                        R45,000 for this
                                                                                        order --- qualify
                                                                                        for GroCredit?\'

  GroCredit --- All verticals  R10,000--R500,000     Repo rate + 8--12% NCA (sole       Shown in equipment
  Equipment                                          p.a. fixed         proprietors) /  categories of
  Finance                                                               FICA            GroSupply
                                                                        (companies)     catalogue.
                                                                                        \'Finance this
                                                                                        commercial oven at
                                                                                        R3,200/month\'

  GroCredit --- Liquor,        R50,000--R1,000,000   Repo rate + 6%     Commercial      Shown in
  Seasonal      Fashion,                             (low risk ---      lending (FSCA   October/November:
  Surge         Grocery                              stock as           registered)     \'December is
                                                     collateral)                        coming ---
                                                                                        pre-order your
                                                                                        festive stock with
                                                                                        GroCredit\'

  GroCredit --- Established    R5,000--R500,000      5--8% flat fee     NCA-exempt      Shown on dashboard
  Revenue       merchants (\>6                       (not compound)     (merchant, not  when merchant has
  Advance       months on                                               consumer)       consistent revenue:
                Groway)                                                                 \'Based on your
                                                                                        R45K/month revenue,
                                                                                        you qualify for
                                                                                        R135K\'

  GroFloat ---  GroSupply      R20,000--R2,000,000   Repo rate + 6--10% FSCA / NCA      Shown to supplier
  Supplier      suppliers                            p.a.               depending on    in GroSupply portal
  Advance                                                               entity type     when large PO
                                                                                        received:
                                                                                        \'Pre-finance this
                                                                                        R200K order ---
                                                                                        repaid when
                                                                                        GroSettle pays\'

  BNPL ---      Retail,        R200--R10,000 per     Interest-free (3   NCR registered  Shown at POS
  Consumer at   Electronics,   transaction           equal payments) or · NCA full      checkout when
  Checkout      Fashion,                             interest-bearing   disclosure ·    basket \> R500:
                Furniture                            (\>3 months)       DebiCheck       \'Split this R2,400
                                                                                        into 3 × R800 ---
                                                                                        no interest\'

  Merchant Cash All            R10,000--R1,000,000   6--10% flat fee on Not NCA (future Shown on dashboard
  Advance (MCA) established                          advance amount     receivables     to merchants with
                merchants                                               purchase)       \>6 months
                                                                                        transaction
                                                                                        history: \'Get
                                                                                        R200K now, repay
                                                                                        from 10% of daily
                                                                                        sales\'
  ------------- -------------- --------------------- ------------------ --------------- -------------------

+-----------------------------------------------------------------------+
| **C** ── **Database Architecture --- Vertical Extensions**            |
|                                                                       |
| *Core tables + vertical_context tables: every vertical adds its own   |
| domain-specific schema layer*                                         |
|                                                                       |
| PostgreSQL 15 · Row-Level Security · All monetary values in BIGINT    |
| cents                                                                 |
+-----------------------------------------------------------------------+

**C.1 Core POS Transaction Table Extensions**

  ----------------------------- -------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Column**                    **Type**       **Purpose & Notes**

  **vertical_context**          VARCHAR(30)    Identifies vertical:
                                NOT NULL       restaurant\|qsr\|shisanyama\|coffeeshop\|liquor_store\|bar\|grocery\|spaza\|salon\|spa\|pharmacy\|hotel\|guesthouse\|laundry\|funeral\|gym\|hardware\|electronics\|creche
                                               etc.

  **sub_vertical**              VARCHAR(40)    Further classification within vertical: fast_food\|sit_down\|food_truck\|cloud_kitchen within restaurant vertical
                                NULLABLE       

  **table_number**              INTEGER        For hospitality: which table or room the transaction belongs to. NULL for counter/takeaway.
                                NULLABLE       

  **covers_count**              INTEGER        Restaurant: number of diners. Used for RevPAC (Revenue Per Available Cover) analytics.
                                NULLABLE       

  **job_card_id**               UUID FK        Auto/laundry/repair verticals: links transaction to the job card being closed.
                                NULLABLE       

  **booking_id**                UUID FK        Hotel/spa/gym: links transaction to the reservation or appointment being paid.
                                NULLABLE       

  **prescription_id**           UUID FK        Pharmacy: links transaction to the prescription being dispensed. SAHPRA audit trail.
                                NULLABLE       

  **age_verify_confirmed**      BOOLEAN        Liquor/nightclub: records that age verification was performed before this sale. Compliance log.
                                DEFAULT FALSE  

  **excise_register_entry**     UUID FK        Liquor: links transaction to SARS excise stock register entry.
                                NULLABLE       

  **delivery_order_id**         UUID FK        F&B with delivery: links to the delivery platform order (Uber Eats, Groway Delivery).
                                NULLABLE       

  **loyalty_earn_multiplier**   DECIMAL(3,1)   Category-specific multiplier applied at time of transaction. Stored for audit. 2.0 = double points.
                                DEFAULT 1.0    

  **menu_qr_initiated**         BOOLEAN        Flags if this transaction originated from a consumer QR menu scan (vs cashier-initiated).
                                DEFAULT FALSE  
  ----------------------------- -------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**C.2 Restaurant & F&B Schema**

  ----------------------- -------------- -------------------------------------------------
  **Column**              **Type**       **Purpose & Notes**

  **table_id**            UUID PK        Each physical table has a record: table number,
                                         capacity, current status, assigned waiter.

  **order_id**            UUID PK        Open order per table. Contains line items,
                                         modifiers, course assignments, status
                                         (open/sent/billed/paid).

  **order_items**         JSONB NOT NULL \[{menu_item_id, name, qty, modifiers, course,
                                         price_cents, notes}\] --- complete order
                                         snapshot.

  **kds_station**         VARCHAR(30)    Kitchen Display System routing: \'hot_section\'
                                         \| \'cold_section\' \| \'drinks\' \| \'grill\'
                                         etc.

  **recipe_id**           UUID FK        Links menu item to recipe for ingredient
                                         deduction. One menu item can reference many
                                         recipe components.

  **recipe_components**   JSONB NOT NULL \[{ingredient_id, quantity_grams, unit}\] ---
                                         exact ingredient deduction per portion. FIFO from
                                         stock.

  **menu_item_gp_pct**    DECIMAL(5,2)   Gross profit % on this menu item.
                                         Auto-calculated: (price - recipe_cost) / price ×
                                         100. Menu engineering.

  **allergens**           TEXT\[\]       \[\'nuts\',\'dairy\',\'gluten\',\'shellfish\'\]
                          NULLABLE       --- mandatory display on digital menu (R638
                                         compliance).

  **table_qr_code**       VARCHAR(200)   QR code value for this specific table. Consumer
                          UNIQUE         scans → order goes to this table_id.
  ----------------------- -------------- -------------------------------------------------

**C.3 Retail & Fashion Schema**

  ------------------------ ------------- ------------------------------------------
  **Column**               **Type**      **Purpose & Notes**

  **product_id**           UUID PK       Parent product record: style name, brand,
                                         category, description, photos.

  **variant_id**           UUID PK       Each size × colour combination. FK to
                                         product_id. Has its own barcode, stock
                                         count, price.

  **size_code**            VARCHAR(20)   XS/S/M/L/XL/2XL/3XL or numeric (28/30/32)
                                         or shoe size (3--12). Depends on product
                                         category.

  **colour_code**          VARCHAR(40)   Standardised colour name + hex. e.g.
                                         \'Navy Blue #001F5B\'. Used for visual
                                         variant selector in POS.

  **laybye_id**            UUID PK       Laybye agreement: customer, item(s), total
                                         price, deposit paid, instalment schedule,
                                         collection date.

  **laybye_instalments**   JSONB NOT     \[{due_date, amount_cents, paid_at,
                           NULL          payment_method}\] --- instalment tracking
                                         array.

  **imei_number**          VARCHAR(20)   Electronics: IMEI stored per handset.
                           UNIQUE        Indexed for stolen phone lookup. RICA
                           NULLABLE      compliance.

  **promotion_id**         UUID FK       Links SKU to active promotion rule (% off,
                           NULLABLE      BOGO, bundle). NULL if no active
                                         promotion.
  ------------------------ ------------- ------------------------------------------

**C.4 Hospitality (Hotel/Guest House) Schema**

  ------------------------------- -------------- ----------------------------------------------------------------
  **Column**                      **Type**       **Purpose & Notes**

  **property_id**                 UUID PK        Property record: name, address, star rating, licence numbers,
                                                 bank account for settlement.

  **room_id**                     UUID PK        Each bookable unit: room number, type (standard/deluxe/suite),
                                                 capacity, amenities, base rate.

  **reservation_id**              UUID PK        Booking: guest, room(s), check-in, check-out, rate applied,
                                                 channel (direct/Booking.com/walk-in), status.

  **guest_folio_id**              UUID PK        Running account for a stay: all charges (room, F&B, spa,
                                                 parking, laundry) accumulated here.

  **folio_charges**               JSONB NOT NULL \[{timestamp, description, amount_cents, department, staff_id}\]
                                                 --- append-only charge log. Never deleted.

  **foreign_national_register**   JSONB NULLABLE Passport number, nationality, visa type, departure date. DIRCO
                                                 legal requirement for foreign guests.

  **channel_source**              VARCHAR(40)    booking_com\|expedia\|direct\|walk_in\|corporate\|travel_agent
                                                 --- for OTA commission reconciliation.

  **ota_commission_pct**          DECIMAL(5,2)   OTA commission rate on this reservation. Used to calculate net
                                  DEFAULT 0      revenue. e.g. 15.00 for Booking.com.
  ------------------------------- -------------- ----------------------------------------------------------------

**C.5 Pharmacy Schema**

  ------------------------------ -------------- ------------------------------------------
  **Column**                     **Type**       **Purpose & Notes**

  **nappi_code**                 VARCHAR(20)    National Article Product Price Index code.
                                 UNIQUE NOT     Mandatory for all pharmaceutical products
                                 NULL           in SA.

  **schedule_class**             SMALLINT NOT   0=OTC · 1=OTC · 2=Pharmacist only ·
                                 NULL           3=Prescription · 4=Prescription ·
                                                5=Controlled · 6=Controlled (SAHPRA).

  **prescription_id**            UUID PK        Script record: patient, prescriber, date,
                                                ICD-10 code, items, dispensed_by
                                                (pharmacist), dispensed_at.

  **controlled_register_id**     UUID PK        S5/S6 register: every S5/S6 unit dispensed
                                                recorded here for SAHPRA audit. Pharmacist
                                                biometric stamp.

  **cold_chain_log**             JSONB NOT NULL \[{timestamp, temp_celsius, staff_id,
                                                fridge_id}\] --- temperature readings
                                                every 4 hours. HACCP compliance.

  **medical_aid_claim_id**       UUID PK        Claims submitted to
                                                Discovery/Bonitas/GEMS/Medihelp. Tracks:
                                                submitted, approved, paid, rejected
                                                status.

  **patient_chronic_id**         UUID FK        Links to patient chronic medication
                                 NULLABLE       programme: repeat intervals, refill
                                                reminders, compliance tracking.

  **pharmacist_pin_biometric**   VARCHAR(200)   Biometric signature of pharmacist who
                                 NULLABLE       authorised S5/S6 dispensing. Immutable.
                                                SAHPRA audit.
  ------------------------------ -------------- ------------------------------------------

+-----------------------------------------------------------------------+
| **D** ── **API Catalogue --- Vertical-Specific Endpoints**            |
|                                                                       |
| *The POS Service (Port 3004) and all domain services expose           |
| vertical-context-aware endpoints*                                     |
|                                                                       |
| All require JWT + merchant_id. vertical_context header required on    |
| every call to POS Service.                                            |
+-----------------------------------------------------------------------+

**D.1 Restaurant & F&B API**

  ------------ ---------------------------------------------- -------------------------------------------
  **Method**   **Route**                                      **Description**

  **GET**      /v1/pos/restaurant/tables                      Retrieve floor plan with live table
                                                              statuses (available/seated/billed/dirty)

  **POST**     /v1/pos/restaurant/tables/:id/open             Open table --- record cover count, assigned
                                                              waiter, time seated

  **POST**     /v1/pos/restaurant/tables/:id/order            Add items to open table order. Sends to KDS
                                                              automatically.

  **PUT**      /v1/pos/restaurant/tables/:id/order/:itemId    Modify order item: quantity, modifiers,
                                                              course, notes

  **POST**     /v1/pos/restaurant/tables/:id/fire             Fire course to KDS --- signals kitchen to
                                                              begin preparing specified course

  **POST**     /v1/pos/restaurant/tables/:id/bill             Generate bill for table --- calculates
                                                              totals, VAT, tip prompt, payment options

  **POST**     /v1/pos/restaurant/tables/:id/split            Split bill: by item or equally by number of
                                                              diners

  **GET**      /v1/pos/restaurant/kds                         Kitchen Display System feed --- open
                                                              tickets by station, oldest first

  **POST**     /v1/pos/restaurant/kds/:ticketId/bump          Bump (complete) a KDS ticket --- marks it
                                                              done, removes from display

  **GET**      /v1/pos/restaurant/menu                        Digital menu with categories, items,
                                                              photos, prices, allergens, availability

  **PUT**      /v1/pos/restaurant/menu/:itemId/availability   Mark menu item as available or 86\'d (sold
                                                              out) --- updates digital QR menu in
                                                              real-time

  **GET**      /v1/pos/restaurant/recipes/:itemId             Recipe components for a menu item (for
                                                              ingredient deduction preview)

  **GET**      /v1/pos/restaurant/analytics/gp                Gross profit % per menu item --- live from
                                                              recipe cost vs selling price
  ------------ ---------------------------------------------- -------------------------------------------

**D.2 Liquor & Age Verification API**

  ------------ -------------------------------- -------------------------------------------
  **Method**   **Route**                        **Description**

  **POST**     /v1/pos/liquor/age-verify        Record age verification event: method
                                                (id_scan/dob_entered/biometric), verifier
                                                staff ID, timestamp. Required before any
                                                liquor sale.

  **GET**      /v1/pos/liquor/trading-hours     Returns whether current time is within
                                                legal trading hours for merchant\'s
                                                province. Hard-blocks sale if outside
                                                hours.

  **POST**     /v1/pos/liquor/excise-receive    Record incoming stock into excise register:
                                                supplier, invoice, SKUs, quantities, dates

  **GET**      /v1/pos/liquor/excise-register   Full excise stock register for SARS audit:
                                                opening stock + received - sold = closing
                                                stock per SKU

  **GET**      /v1/pos/liquor/licence-status    Liquor licence validity: number, expiry
                                                date, provincial authority, conditions.
                                                Alert if \< 60 days to expiry.
  ------------ -------------------------------- -------------------------------------------

**D.3 Hotel & Hospitality API**

  ------------ ------------------------------------------- -------------------------------------------
  **Method**   **Route**                                   **Description**

  **GET**      /v1/pos/hotel/rooms                         Room grid: all rooms with live status,
                                                           guest name if occupied, check-out time

  **POST**     /v1/pos/hotel/reservations                  Create reservation: guest details, room,
                                                           dates, rate, channel source, OTA commission
                                                           %

  **POST**     /v1/pos/hotel/checkin/:reservationId        Check-in guest: confirm room, capture
                                                           foreign national register if applicable,
                                                           open guest folio, pre-auth card

  **POST**     /v1/pos/hotel/folio/:folioId/charge         Add charge to guest folio: room service,
                                                           minibar, parking, spa treatment

  **GET**      /v1/pos/hotel/folio/:folioId                Get full guest folio: all charges, balance
                                                           due, payment status

  **POST**     /v1/pos/hotel/checkout/:reservationId       Check-out: calculate total, offer payment
                                                           methods, settle folio, release room

  **GET**      /v1/pos/hotel/revpar                        RevPAR dashboard: revenue per available
                                                           room, occupancy %, average daily rate (ADR)

  **POST**     /v1/pos/hotel/housekeeping/:roomId/status   Update room housekeeping status:
                                                           dirty/in_progress/clean/inspected ---
                                                           housekeeper mobile app
  ------------ ------------------------------------------- -------------------------------------------

**D.4 Pharmacy API**

  ------------ --------------------------------------- -------------------------------------------
  **Method**   **Route**                               **Description**

  **POST**     /v1/pos/pharmacy/prescription           Create prescription record: patient,
                                                       prescriber, ICD-10, items with NAPPI codes,
                                                       schedule classifications

  **POST**     /v1/pos/pharmacy/dispense               Dispense items on prescription. S5/S6 items
                                                       require pharmacist biometric confirmation
                                                       before proceeding.

  **GET**      /v1/pos/pharmacy/controlled-register    S5/S6 controlled substances register: all
                                                       dispensed items, dispensing pharmacist,
                                                       SAHPRA-format export

  **POST**     /v1/pos/pharmacy/medical-aid/claim      Submit claim to medical aid: scheme,
                                                       patient membership, items, NAPPI codes,
                                                       ICD-10

  **GET**      /v1/pos/pharmacy/cold-chain/:fridgeId   Cold chain temperature log for specified
                                                       fridge. Alert if any reading outside
                                                       2--8°C.

  **GET**      /v1/pos/pharmacy/nappi/:nappiCode       Look up product by NAPPI code: name,
                                                       schedule, price, stock, cold chain
                                                       requirement

  **GET**      /v1/pos/pharmacy/licence-status         SAHPRA licence status: pharmacy licence
                                                       number, expiry, pharmacist-in-charge (PIC)
                                                       registration
  ------------ --------------------------------------- -------------------------------------------

**D.5 QR Menu, Geo-Discovery & Mini Store API**

  ------------ ---------------------------------------------- -------------------------------------------
  **Method**   **Route**                                      **Description**

  **GET**      /v1/merchant/menu/:merchantSlug                Public endpoint: returns full digital menu
                                                              (no auth required --- consumer-facing)

  **PUT**      /v1/merchant/menu/items/:itemId                Update menu item: photo, description,
                                                              price, allergens, availability. Pushes to
                                                              live QR menu instantly.

  **POST**     /v1/merchant/menu/items/:itemId/availability   Toggle item available/86\'d. Consumer QR
                                                              menus update in \< 3 seconds via WebSocket.

  **GET**      /v1/discovery/nearby                           Geo-discovery: returns merchant cards
                                                              within radius. Params: lat, lng, radius_km,
                                                              category, sub_vertical, open_now.

  **GET**      /v1/discovery/merchant/:merchantId             Full merchant discovery card: photos, menu
                                                              preview, hours, rating, loyalty points
                                                              earn, booking options.

  **POST**     /v1/store/orders                               Consumer places online store order: items,
                                                              delivery/collection, address, payment
                                                              method

  **GET**      /v1/store/orders/:orderId                      Track online store order status: received →
                                                              preparing → ready → dispatched

  **PUT**      /v1/store/orders/:orderId/status               Merchant updates order status from Merchant
                                                              OS

  **GET**      /v1/merchant/store/config                      Merchant\'s mini-store settings: radius,
                                                              minimum order, delivery options, hours

  **PUT**      /v1/merchant/store/config                      Update mini-store settings: toggle delivery
                                                              on/off, change radius, set minimum order
                                                              amount

  **POST**     /v1/merchant/store/table-qr/:tableNumber       Generate table-specific QR code for dine-in
                                                              QR ordering. Returns QR image URL.
  ------------ ---------------------------------------------- -------------------------------------------

+-----------------------------------------------------------------------+
| **E** ── **VAS Catalogue --- Value Added Services per Vertical**      |
|                                                                       |
| *Each sub-vertical gets a curated, relevant VAS tile set --- not a    |
| generic list*                                                         |
|                                                                       |
| VAS drives ancillary revenue for Groway and increases transaction     |
| frequency for merchants                                               |
+-----------------------------------------------------------------------+

  -------------- --------------------------- ------------------------------
  **Vertical**   **Priority VAS Tiles**      **Rationale**

  QSR / Fast     Airtime · Data ·            Customer waiting for food =
  Food           Electricity · Delivery      captive audience for VAS.
                 integration · Vouchers ·    Airtime is impulse purchase.
                 Loyalty stamp               

  Sit-Down       Table QR order · BNPL (Dine Enhance dine-in experience.
  Restaurant     Now Pay Later) · Event      Premium vouchers for corporate
                 booking · Wine list QR ·    gifting.
                 Gift vouchers               

  Shisa Nyama    Airtime · Electricity ·     Township-relevant VAS. Stokvel
                 Stokvel wallet · BNPL       wallet is uniquely powerful
                 (events) · WhatsApp         here.
                 pre-order                   

  Coffee Shop    Wifi voucher · Loyalty cup  Urban professional audience
                 stamp · Gift vouchers ·     --- wifi voucher is premium,
                 Bean subscription · Airtime high-margin.

  Bottle Store / Airtime · Electricity ·     Captive foot traffic. Laybye
  Liquor         Laybye (bulk spirits) · QR  for expensive whisky/cognac is
                 product catalogue ·         common in SA.
                 Delivery                    

  Grocery /      Electricity tokens ·        Convenience store becomes full
  Superette      Airtime · Bill payments ·   community service centre.
                 BNPL · Agent banking ·      
                 Lotto                       

  Spaza          Airtime · Electricity ·     Agent banking converts spaza
                 Stokvel · Agent banking     into a financial services
                 (cash in/out) · Groway      access point for underserved
                 Wallet top-up               communities.

  Hair Salon /   Online booking · Prepaid    Pre-booking drives repeat
  Nail           packages · Gift vouchers ·  visits. Gift vouchers are top
                 Product delivery · Loyalty  SA gifting choice (B-day,
                 stamp                       Mother\'s Day).

  Spa & Wellness Gift vouchers · Day         Gift voucher is highest-value
                 packages · Corporate        sale in this vertical.
                 wellness · Product retail · Packages build predictable
                 Online booking              revenue.

  Pharmacy       Chronic reminders · Medical Compliance VAS that creates
                 aid claims · Cold chain     daily consumer engagement
                 monitoring · OTC delivery · (chronic reminders).
                 Scripts                     

  Hotel          Direct booking (no OTA      Each VAS replaces a
                 commission) · In-room QR    third-party cost or adds
                 ordering · Spa booking ·    revenue with zero marginal
                 Activities · Transfers      cost.

  Gym/Fitness    Class booking · Member app  Digital membership card in
                 · Wearable gate access · PT consumer app creates daily
                 sessions · Supplement shop  habit touchpoint.

  Auto Workshop  Parts ordering via          Service reminder WhatsApp is
                 GroSupply · Service         highest ROI marketing tool for
                 reminders · Insurance claim workshops.
                 workflow · Finance          
                 (equipment)                 

  Hardware       Trade account app · B2B     Trade account via Groway app
                 invoice delivery ·          gives contractors 24/7 account
                 GroCredit · GroSupply parts visibility --- reduces debtor
                 catalogue                   disputes.
  -------------- --------------------------- ------------------------------

+-----------------------------------------------------------------------+
| **F** ── **Build Priorities --- Multi-Vertical POS Sequencing**       |
|                                                                       |
| *Which sub-verticals to build first, in what order, and why*          |
|                                                                       |
| Revenue potential × market size × build complexity × GroSupply        |
| synergy                                                               |
+-----------------------------------------------------------------------+

**F.1 Sub-Vertical Build Priority Matrix**

  -------------- ------------------- --------------------------------- ----------
  **Priority**   **Sub-Vertical**    **Reason**                        **Sprint
                                                                       Target**

  P0 --- Day 1   QSR & Sit-Down      Largest F&B market in SA. KDS +   Sprint
                 Restaurant          recipe engine differentiates from 11--12
                                     every competitor.                 

  P0 --- Day 1   Spaza Shop          Nation\'s most common retail      Sprint 4
                                     format. Groway agent banking +    (Core POS)
                                     stokvel + airtime = ecosystem     
                                     anchor.                           

  P0 --- Day 1   Superette/Grocery   Volume play. Electricity +        Sprint 4
                                     airtime VAS generates daily       (Core POS)
                                     revenue. GroSupply anchor.        

  P0 --- Day 1   Bottle Store /      High revenue per transaction.     Sprint 5
                 Liquor              Compliance moat (age verify +     
                                     excise) blocks competition.       

  P0 --- Day 1   Hair Salon          Most common urban informal        Sprint 4
                                     business. Online booking +        (Core POS)
                                     digital loyalty = stickiness.     

  P1 --- Wave 1  Shisa Nyama         Cultural landmark. Stokvel        Sprint 13
                                     wallet + WhatsApp pre-order =     
                                     unique SA feature.                

  P1 --- Wave 1  Pharmacy (Full)     NAPPI + Schedule + Medical Aid =  Sprint 12
                                     significant moat. Clinical        
                                     compliance builds trust.          

  P1 --- Wave 1  Hotel/Guest House   Settlement volume (room rates ×   Sprint 13
                                     nights). Direct booking           
                                     eliminates OTA commission.        

  P1 --- Wave 1  Gym/Fitness Studio  Recurring DebiCheck membership.   Sprint 9
                                     Wearable NFC gate access =        
                                     hardware moat.                    

  P1 --- Wave 1  Auto Workshop       Job card + GroSupply parts =      Sprint 14
                                     closed loop. Underserved by       
                                     current SA POS.                   

  P2 --- Wave 2  Coffee Shop         Urban density. Loyalty cup        Sprint 15
                                     stamp + wifi voucher + bean       
                                     subscription.                     

  P2 --- Wave 2  Clothing Boutique   Variant matrix + laybye = complex Sprint 15
                                     but high basket value.            

  P2 --- Wave 2  Food Truck          Offline mode hero story.          Sprint 14
                                     Geo-discovery makes Groway their  
                                     only digital presence.            

  P2 --- Wave 2  Butchery            Scale integration + GroSupply     Sprint 15
                                     abattoir links = procurement      
                                     moat.                             

  P2 --- Wave 2  Events Venue        Ticketing + Groway Wallet         Sprint 16
                                     cashless = stadium/nightclub use  
                                     case.                             

  P3 --- Wave 3  Nightclub           RFID wristband cashless + entry   Sprint 19
                                     QR --- requires hardware          
                                     partnership.                      

  P3 --- Wave 3  Funeral Home        Culturally sensitive design.      Sprint 17
                                     Compassionate credit. High value  
                                     per case.                         

  P3 --- Wave 3  Crèche/Daycare      DebiCheck recurring fees + parent Sprint 18
                                     app = strong retention. SACE      
                                     compliance.                       

  P3 --- Wave 3  Cloud Kitchen       Delivery aggregator integration + Sprint 18
                                     production planning.              

  P3 --- Wave 3  Hardware/Trade      B2B trade accounts + GroSupply =  Sprint 19
                                     contractor ecosystem.             
  -------------- ------------------- --------------------------------- ----------

**F.2 Shared Technical Infrastructure Across All Verticals**

+-----------------------------------+-----------------------------------+
| **Built Once, Used by All**       | **Vertical-Specific Services**    |
|                                   |                                   |
| -   vertical_context routing      | -   Restaurant Service (3027) --- |
|     engine in POS Service (3004)  |     table management, KDS         |
|     --- all verticals share one   |     routing, recipe engine        |
|     POS engine, different screens |                                   |
|                                   | -   Pharmacy Service (3028) ---   |
| -   KDS (Kitchen Display System)  |     NAPPI, Schedule drug, medical |
|     --- Restaurant, QSR, Shisa    |     aid billing                   |
|     Nyama, Cloud Kitchen all use  |                                   |
|     same KDS service              | -   Hotel Service (3029) --- PMS, |
|                                   |     channel manager, folio        |
| -   Appointment/booking engine    |     management                    |
|     --- Salon, Spa, Gym, Hotel    |                                   |
|     all use same reservation      | -   Funeral Service (3030) ---    |
|     engine (different UI)         |     case management, cultural     |
|                                   |     flags                         |
| -   Age verification module ---   |                                   |
|     Liquor, Nightclub, Bar,       | -   Excise Register module        |
|     Pharmacy share same age       |     (inside POS Service) ---      |
|     verify service                |     liquor verticals only         |
|                                   |                                   |
| -   Compliance licence tracker    | -   IMEI register (inside         |
|     --- All regulated verticals   |     Inventory Service) ---        |
|     use same Compliance           |     electronics only              |
|     Service (3025) with different |                                   |
|     licence types                 | -   Wristband/RFID module --- gym |
|                                   |     gate access, nightclub        |
| -   FIFO expiry engine ---        |     cashless                      |
|     Grocery, Pharmacy, Bakery,    |                                   |
|     Restaurant all use same       | -   Scale integration adapter --- |
|     inventory expiry logic        |     butchery, deli, grocery       |
|                                   |     weighed goods                 |
| -   Digital menu rendering engine |                                   |
|     --- All F&B and Hospitality   | -   Prescription engine ---       |
|     verticals share same menu     |     pharmacy only (Schedule 5/6   |
|     service                       |     lock)                         |
|                                   |                                   |
| -   Loyalty earn engine --- All   | -   Child register module ---     |
|     verticals plug into same CRM  |     crèche compliance (DSD, SACE) |
|     Service loyalty points engine |                                   |
|     (different earn rates)        |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| groway --- Multi-Vertical POS: South Africa Deep-Dive Specification   |
|                                                                       |
| *12 Verticals · 47 Sub-Verticals · QR Digital Menus · Geo-Discovery · |
| Mini Online Stores · February 2026 · Confidential*                    |
+-----------------------------------------------------------------------+
