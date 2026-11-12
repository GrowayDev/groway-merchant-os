+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| **INVENTORY MANAGEMENT**                                              |
|                                                                       |
| Comprehensive Product & Stock Control Specification                   |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 |
|                                                                       |
| Best-in-Class · 12 Verticals · 47 Sub-Verticals · 3,930+ Pre-Loaded   |
| SKUs                                                                  |
|                                                                       |
| FIFO · Batch & Expiry · Recipe Deduction · Multi-Location · Smart     |
| Reorder · Stocktake · Recall                                          |
|                                                                       |
| GroSupply Integration · JAX AI Forecasting · Real-Time Dashboards ·   |
| Full SA Compliance                                                    |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 |
|                                                                       |
| *Benchmarked against: Shopify POS · Cin7 · Square for Retail ·        |
| Lightspeed · DEAR Systems · Unleashed · inFlow*                       |
|                                                                       |
| Version 1.0 · February 2026 · Internal Product Specification ---      |
| Confidential                                                          |
+-----------------------------------------------------------------------+

+-----------+-----------+-----------+-----------+-----------+-----------+
| *         | **12**    | **47**    | **72h**   | **5-day** | **60s**   |
| *3,930+** |           |           |           |           |           |
|           | Verticals | Sub-      | Offline   | AI        | Recall    |
| P         |           | Verticals | Buffer    | Forecast  | Response  |
| re-loaded |           |           |           |           |           |
| SKUs      |           |           |           |           |           |
+-----------+-----------+-----------+-----------+-----------+-----------+

+---+---------------------------------------------------------------------+
| * | **World-Class Benchmark**                                           |
| * |                                                                     |
| ★ | Every feature in this specification exists because a global         |
| * | inventory leader does it --- and Groway must match or exceed it,    |
| * | with the South African context no global vendor understands.        |
|   | Cin7\'s 3-way GRN matching, Shopify\'s multi-location real-time     |
|   | sync, Lightspeed\'s recipe costing, Square\'s shrinkage analytics,  |
|   | DEAR Systems\' batch traceability --- all here, unified, for spaza  |
|   | shops to pharmacy chains to restaurant groups.                      |
+---+---------------------------------------------------------------------+

**Document Contents**

  ------------- ------------------- ---------------------------------------------------
  **Section**   **Title**           **Key Topics**

  01            Architecture &      Service boundaries, data flows, Kafka events,
                Design Principles   offline engine, design rules

  02            Product & SKU       Product hierarchy, variant matrix, barcodes,
                Management          bundles, BOM, import tools

  03            Stock Receiving &   Purchase orders, GRN mobile workflow, 3-way match,
                GRN                 batch capture, quality flags

  04            Stock Movements &   Movement types, reason codes, audit log,
                Adjustments         auto-journal integration

  05            FIFO, Batch         Batch lifecycle, FIFO enforcement, expiry alerts,
                Tracking & Expiry   recall management

  06            Multi-Location      Branches, warehouses, transfers, consolidated view,
                Stock Management    in-transit tracking

  07            Stocktake &         Cycle count, blind count, variance report,
                Physical Count      write-off workflow, SARS-ready export

  08            Smart Reorder & JAX Par levels, reorder points, 5-day AI forecast,
                AI Forecasting      seasonal patterns, auto-RFQ

  09            Recipe Engine &     Ingredient deduction, recipe costing, menu
                Bill of Materials   engineering, BOM production

  10            Vertical-Specific   12-vertical capability matrix with detailed
                Inventory Modes     per-vertical highlights

  11            Compliance &        Excise register, SAHPRA pharmacy, IMEI/RICA, cold
                Regulatory          chain, allergens
                Inventory           

  12            Shrinkage, Waste &  Theft prevention, wastage tracking, shrinkage KPIs,
                Loss Control        investigation workflow

  13            Inventory Analytics Dashboard, velocity, margin per SKU, dead stock,
                & JAX AI Insights   forecast narrative cards

  14            GroSupply           Full procurement lifecycle tied to inventory
                Procurement         triggers and GRN completion
                Integration         

  15            Pricing, Promotions Price lists, promotions, margin floors, trade
                & Margin Control    pricing, GroCredit funding

  16            API Catalogue ---   All /v1/inventory/\* endpoints + related domain
                Complete Endpoint   endpoints
                Reference           

  17            Database Schema --- Full PostgreSQL schema: all tables, columns,
                Complete Inventory  constraints, indexes
                Model               

  18            UI/UX Screen        Every inventory screen in Merchant OS --- desktop
                Specifications      and mobile

  19            Quality Gates &     Definition of Done, test cases, performance SLAs,
                Testing Standards   load tests
  ------------- ------------------- ---------------------------------------------------

+-----------------------------------------------------------------------+
| **01** ── **Architecture & Design Principles**                        |
|                                                                       |
| *Inventory Service (Port 3005) · PostgreSQL 15 · Redis 7 · Kafka MSK  |
| · OpenSearch · 72h offline*                                           |
|                                                                       |
| Single authoritative source of truth for all stock across every       |
| vertical, branch, and channel                                         |
+-----------------------------------------------------------------------+

**1.1 Service Architecture Overview**

The Groway Inventory Service (Port 3005) is an isolated microservice
with its own PostgreSQL schema, Redis cluster, and Kafka publication
topics. Every sale at POS deducts from inventory in a single atomic
transaction. Every GRN completion from GroSupply adds stock
automatically. Stock counts are cached in Redis for sub-millisecond POS
reads while durable writes go to PostgreSQL. The service exposes REST
APIs consumed by POS, Merchant Portal, Mobile App, Admin Console, and
GroSupply.

  ------------- ------------------ ----------------------------------------
  **Layer**     **Technology**     **Role**

  Primary Store PostgreSQL 15 ---  Master records: products, variants,
                RLS per            batches, movements, locations. Monetary
                merchant_id        cost prices in BIGINT cents.
                                   Soft-deletes only (archived_at).
                                   Append-only movement log --- never
                                   updated or deleted.

  Read Cache    Redis 7 Cluster    Stock-on-hand counts per SKU per
                                   location cached. POS reads from Redis
                                   (\< 1ms). Cache invalidated atomically
                                   on every movement event. Redis also
                                   holds reserved stock for in-progress
                                   transactions.

  Event Bus     Apache Kafka (AWS  Publishes: inventory.sold ·
                MSK, 3 brokers)    inventory.received · inventory.low_stock
                                   · inventory.expired · inventory.adjusted
                                   · inventory.recalled ·
                                   inventory.transferred. Consumed by: POS,
                                   Accounting, GroSupply, Notifications,
                                   Analytics, CRM.

  Search        Amazon OpenSearch  Full-text product search across name,
                (managed)          barcode, SKU, supplier code,
                                   description. Autocomplete on POS
                                   scan/type field (\< 50ms). Synonym
                                   index: \"coke\" finds \"Coca-Cola\".
                                   NAPPI code search for pharmacy.

  Time-Series   TimescaleDB        Sales velocity per SKU per
  Analytics     (PostgreSQL        hour/day/week. Powers JAX AI demand
                extension on       forecasting. Seasonal trend detection.
                reporting replica) Dead stock identification. Theoretical
                                   vs actual COGS variance.

  File Storage  AWS S3 af-south-1  Product photos, GRN attachments,
                (Cape Town)        supplier invoices, stocktake export
                                   PDFs, recall notices. AES-256
                                   server-side encryption. Pre-signed URLs
                                   with 15-minute TTL for download links.

  Offline Queue SQLite (POS        72-hour offline queue for POS sales
                Electron) +        deductions. Idempotency keys prevent
                AsyncStorage       double-deduction on sync. Sync uses
                (React Native      optimistic locking --- conflicting
                mobile)            movements surfaced for manager review.
  ------------- ------------------ ----------------------------------------

**1.2 Non-Negotiable Design Rules**

+-----------------------------------+-----------------------------------+
| **Data Integrity Rules**          | **Accounting Integration Rules**  |
|                                   |                                   |
| -   Atomic transactions --- stock | -   Every movement auto-journals  |
|     deducted and movement record  |     --- every stock movement      |
|     created in one DB             |     publishes a Kafka event.      |
|     transaction. No partial       |     Accounting Service consumes   |
|     updates. Ever.                |     it and creates a double-entry |
|                                   |     journal. Zero manual          |
| -   Idempotency on every write    |     accounting entries needed.    |
|     --- every movement has an     |                                   |
|     idempotency_key. Retried API  | -   COGS calculated at movement   |
|     calls never create duplicate  |     time --- the cost_price_cents |
|     movements.                    |     at the moment of the movement |
|                                   |     is locked to the movement     |
| -   No negative stock by default  |     record. Retroactive price     |
|     --- POS blocks sale when      |     changes never distort         |
|     stock = 0.                    |     historical COGS.              |
|     allow_negative_stock is a     |                                   |
|     per-product override          | -   Weighted average cost ---     |
|     requiring manager             |     cost_price_cents on the       |
|     configuration.                |     product record is updated on  |
|                                   |     every GRN receipt using       |
| -   BIGINT cents for all cost     |     weighted average formula:     |
|     prices --- never DECIMAL or   |     (existing_qty × old_cost +    |
|     FLOAT. Prevents               |     new_qty × new_cost) /         |
|     floating-point rounding on    |     total_qty.                    |
|     COGS calculations across      |                                   |
|     millions of items.            | -   FIFO for COGS reporting ---   |
|                                   |     even if weighted average is   |
| -   Soft deletes only ---         |     the balance sheet method,     |
|     products/variants are never   |     FIFO batch consumption drives |
|     hard-deleted. archived_at     |     traceability and recall       |
|     timestamp set. Full history   |     capability.                   |
|     remains for accounting, SARS  |                                   |
|     audit, SAHPRA.                | -   Variance auto-journalled ---  |
|                                   |     stocktake variances above the |
| -   Movement log is append-only   |     threshold create automatic    |
|     --- no movement record is     |     P&L journal entries (Dr/Cr    |
|     ever UPDATE-d or DELETE-d.    |     Stock Variance, Cr/Dr         |
|     Corrections create reversal   |     Inventory Asset) on manager   |
|     movements. This is immutable  |     approval.                     |
|     audit.                        |                                   |
|                                   |                                   |
| -   Multi-tenant RLS ---          |                                   |
|     PostgreSQL Row-Level Security |                                   |
|     ensures Merchant A can never  |                                   |
|     read or write Merchant B\'s   |                                   |
|     inventory. Enforced at DB     |                                   |
|     layer, not just application.  |                                   |
+-----------------------------------+-----------------------------------+

**1.3 Complete Data Flow Map**

  ---------------- ---------------- ------------------------------ ---------------- -------------------
  **Trigger        **Stock Change** **Kafka Topic Published**      **Consuming      **Auto Journal
  Event**                                                          Services**       Entry**

  POS sale         Deduct qty per   inventory.sold                 Accounting ·     Dr Cost of Sales →
  completed        line item. FIFO                                 Analytics · JAX  Cr Inventory Asset
                   batch consumed.                                 AI · CRM         
                                                                   (loyalty)        

  Customer return  Restore qty to   inventory.returned             Accounting ·     Dr Inventory Asset
  at POS           stock. Batch                                    Analytics        → Cr Cost of Sales
                   restored if                                                      (reversal)
                   still valid.                                                     

  GRN completed    Add qty per GRN  inventory.received             Accounting ·     Dr Inventory Asset
  (GroSupply)      line. New batch                                 Notifications ·  → Cr Accounts
                   record created.                                 JAX AI           Payable
                                                                   retraining       

  Manual           Add qty. Oldest  inventory.adjusted             Accounting ·     Dr Inventory Asset
  adjustment (add) valid batch                                     Analytics        → Cr Stock
                   updated or new                                                   Adjustment Income
                   batch created.                                                   

  Manual           Deduct qty. FIFO inventory.adjusted             Accounting ·     Dr Stock Write-off
  adjustment       batch consumed.                                 Analytics        Expense → Cr
  (remove)         Reason code                                                      Inventory Asset
                   logged.                                                          

  Expiry write-off Batch status →   inventory.expired              Accounting ·     Dr Wastage/Expired
                   expired. Qty                                    Compliance       Stock → Cr
                   deducted from                                   (SAHPRA check    Inventory Asset
                   available stock.                                for pharma)      

  Inter-location   Deduct from      inventory.transferred          Notifications ·  No P&L impact.
  transfer out     source. Place in                                Destination      Balance sheet
                   In-Transit                                      branch           reclassification.
                   virtual                                                          
                   location.                                                        

  Inter-location   Deduct from      inventory.transferred          Notifications ·  No P&L impact.
  transfer in      In-Transit. Add                                 Source branch    Balance sheet
                   to destination                                                   reclassification.
                   location.                                                        

  Stocktake        Add variance qty inventory.stocktake_variance   Accounting ·     Dr Inventory Asset
  variance +       to system stock.                                Analytics        → Cr Stock Variance
                                                                                    Income

  Stocktake        Remove variance  inventory.stocktake_variance   Accounting ·     Dr Stock Variance
  variance −       qty from system                                 Analytics        Expense → Cr
                   stock.                                                           Inventory Asset

  Recipe deduction Deduct           inventory.sold (ingredient     Accounting · JAX Dr Food COGS → Cr
  (F&B dish sold)  per-ingredient   level)                         AI recipe        Ingredient
                   gram quantities.                                costing engine   Inventory
                   FIFO per                                                         
                   ingredient                                                       
                   batch.                                                           

  Assembly/BOM     Raw materials    inventory.assembled            Accounting ·     Dr Finished Goods →
  production       consumed.                                       Analytics        Cr Raw Materials +
                   Finished goods                                                   Dr/Cr WIP Variance
                   stock created.                                                   

  Batch recall     Recalled batch   inventory.recalled             All branch       Dr Recall Loss
  initiated        status →                                        Notifications ·  Provision → Cr
                   quarantined.                                    Admin Console ·  Inventory Asset
                   Blocked from                                    SAHPRA workflow  (pending
                   sale across all                                                  resolution)
                   locations.                                                       
  ---------------- ---------------- ------------------------------ ---------------- -------------------

+-----------------------------------------------------------------------+
| **02** ── **Product & SKU Management**                                |
|                                                                       |
| *Three-level hierarchy · Unlimited variant matrix · All barcode       |
| formats · Bundles · BOM · Bulk import*                                |
|                                                                       |
| The foundation of everything --- every sale, every reorder, every     |
| cost report starts with a correctly set-up product                    |
+-----------------------------------------------------------------------+

**2.1 Three-Level Product Hierarchy**

  ----------- ------------ ------------------------- ----------------------------
  **Level**   **Name**     **Description**           **Example**

  Level 1     Category     Broad grouping for        Food & Bev → Meat → Beef
                           navigation, reporting,    Cuts \| Pharmacy → Schedule
                           VAT treatment, and        3 → Analgesics \| Fashion →
                           GroSupply procurement     Tops → T-Shirts
                           routing. Three levels     
                           deep (Category →          
                           Sub-category → Type).     

  Level 2     Product      The base item concept.    Nike Air Force 1 \| Panado
              (Parent)     Shared name, description, 500mg \| Full Cream Milk 1L
                           photos, brand, supplier.  \| Levi\'s 501 Jeans
                           No stock tracked here.    
                           This is a template for    
                           variants.                 

  Level 3     Variant /    The purchasable,          Nike AF1 / White / Size 9 \|
              SKU          stockable unit. Own       Panado / Box of 24 / 500mg
                           barcode, stock count,     \| Levi\'s 501 / Blue / W32
                           cost price, selling       L30
                           price, and compliance     
                           attributes. This is what  
                           gets sold and tracked.    
  ----------- ------------ ------------------------- ----------------------------

**2.2 Variant Matrix --- Full Attribute System**

Any product can have up to three variant dimensions, generating a matrix
of individually stockable SKUs automatically. Groway matches Shopify\'s
variant system then extends it for SA verticals.

  -------------- -------------------------- --------------------------------- ----------------------------- -------------------
  **Vertical**   **Dimension 1**            **Dimension 2**                   **Dimension 3**               **Matrix Example**

  Fashion        Size (XS/S/M/L/XL/2XL/3XL) Colour (name + hex)               Material (Cotton/Poly/Blend)  T-Shirt: 7 × 6 × 3
                                                                                                            = 126 SKUs

  Footwear       UK Size (3--12 + halves)   Colour                            Width (Standard/Wide/Narrow)  Nike Air: 20 × 4 ×
                                                                                                            2 = 160 SKUs

  Pharmacy       Strength (mg/mcg)          Pack size (tablets/capsules       Format                        Amoxicillin: 3 × 4
                                            count)                            (tablet/syrup/injection)      × 2 = 24 SKUs

  Electronics    Storage (64/128/256/512GB) Colour                            Condition (New/Refurb/Boxed)  iPhone: 4 × 5 × 2 =
                                                                                                            40 SKUs --- each
                                                                                                            with IMEI register

  Grocery/FMCG   Pack size                  Flavour/Type                      Brand                         Flour: 3 × 2 × 3 =
                 (500g/1kg/2kg/5kg)                                                                         18 SKUs

  Liquor         Bottle size                Vintage (wine only)               Type                          Spier SB: 3 × 4 × 2
                 (200/375/750ml/1L/1.75L)                                     (still/sparkling/fortified)   = 24 SKUs --- each
                                                                                                            in excise register

  Beauty/Salon   Size (30/50/100/200/500ml) Formula type                      Fragrance                     Shampoo: 4 × 4 × 6
                                            (curly/straight/colour-treated)                                 = 96 SKUs tracked
                                                                                                            by ml used per
                                                                                                            service
  -------------- -------------------------- --------------------------------- ----------------------------- -------------------

**2.3 Complete Product Field Specification**

+-----------------------------------+-----------------------------------+
| **Core Identity & Display**       | **Pricing, Tax & Margin**         |
|                                   |                                   |
| -   product_id (UUID) ---         | -   cost_price_cents (BIGINT) --- |
|     immutable. Becomes SKU\'s     |     weighted average cost.        |
|     parent reference.             |     Updated on each GRN.          |
|                                   |                                   |
| -   merchant_id (UUID FK) --- RLS | -   selling_price_cents (BIGINT)  |
|     tenant key. Indexed.          |     --- base retail price.        |
|                                   |     VAT-inclusive in SA.          |
| -   vertical_context (VARCHAR 40) |                                   |
|     --- determines VAT,           | -   min_selling_price_cents ---   |
|     compliance, POS layout.       |     floor price. POS blocks sale  |
|                                   |     below this.                   |
| -   name (VARCHAR 200) --- shown  |                                   |
|     in POS search, digital menu,  | -   trade_price_cents --- B2B     |
|     consumer app.                 |     price for hardware/wholesale  |
|                                   |     verticals.                    |
| -   description (TEXT) --- shown  |                                   |
|     in online store, QR menu item | -   rrp_cents --- recommended     |
|     detail.                       |     retail price (display         |
|                                   |     reference only).              |
| -   brand (VARCHAR 100) ---       |                                   |
|     filterable in POS and         | -   vat_treatment ENUM ---        |
|     analytics.                    |     standard_15 \| zero_rated \|  |
|                                   |     exempt \| out_of_scope.       |
| -   category_id (UUID FK) ---     |                                   |
|     three-level category tree.    | -   margin_pct (COMPUTED) ---     |
|     Drives VAT logic.             |     (sell − cost) / sell × 100.   |
|                                   |     Read-only calculated field.   |
| -   photos (JSONB) --- array of   |                                   |
|     S3 URLs with position and     | -   loyalty_earn_multiplier ---   |
|     alt_text.                     |     1.0 default. 2.0 = double     |
|                                   |     points on this SKU.           |
| -   barcode_ean13 / barcode_upc   |                                   |
|     --- primary scan codes.       | -   promo_price_cents +           |
|                                   |     promo_start + promo_end ---   |
| -   internal_sku (VARCHAR 50) --- |     scheduled promotions.         |
|     merchant\'s own coding        |                                   |
|     system.                       | -   commission_rate_pct ---       |
|                                   |     salon/service: staff earns X% |
| -   supplier_code (VARCHAR 100)   |     on each sale of this SKU.     |
|     --- supplier\'s product       |                                   |
|     reference for GroSupply       |                                   |
|     matching.                     |                                   |
|                                   |                                   |
| -   nappi_code (VARCHAR 20) ---   |                                   |
|     SAHPRA-mandated for all       |                                   |
|     pharmacy SKUs.                |                                   |
|                                   |                                   |
| -   country_of_origin (CHAR 2)    |                                   |
|     --- ISO 3166. Required for    |                                   |
|     import permits.               |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------+-----------------------------------+
| **Stock Control & Logistics**     | **Compliance & Traceability**     |
|                                   |                                   |
| -   track_stock (BOOLEAN) ---     | -   batch_tracking_required       |
|     false for pure services       |     (BOOLEAN) --- mandatory:      |
|     (haircut, massage,            |     pharmacy, fresh food,         |
|     consultation).                |     chemicals.                    |
|                                   |                                   |
| -   allow_negative_stock          | -   expiry_tracking (BOOLEAN) --- |
|     (BOOLEAN) --- default FALSE.  |     enables expiry management and |
|     Bar consumables, salon        |     alert engine.                 |
|     products.                     |                                   |
|                                   | -   shelf_life_days (INTEGER) --- |
| -   reorder_point (INTEGER) ---   |     from production date to       |
|     trigger reorder alert /       |     expiry date.                  |
|     GroSupply auto-RFQ.           |                                   |
|                                   | -   expiry_alert_days (INTEGER)   |
| -   reorder_qty (INTEGER) ---     |     --- days before expiry to     |
|     fixed order quantity for Tier |     fire first alert.             |
|     1 reorder.                    |                                   |
|                                   | -   schedule_class (SMALLINT      |
| -   par_level (INTEGER) --- ideal |     0--6) --- SAHPRA drug         |
|     on-hand for Tier 2 par-based  |     schedule. Pharmacy only.      |
|     replenishment.                |                                   |
|                                   | -   age_restricted (BOOLEAN) ---  |
| -   lead_time_days (INTEGER) ---  |     liquor, tobacco, adult        |
|     from order to delivery (per   |     products.                     |
|     preferred supplier).          |                                   |
|                                   | -   cold_chain_required (BOOLEAN) |
| -   min_order_qty (INTEGER) ---   |     --- triggers 4-hourly         |
|     supplier MOQ. Prevents        |     temperature compliance log.   |
|     under-minimum orders.         |                                   |
|                                   | -   allergens (TEXT\[\]) ---      |
| -   storage_location (VARCHAR)    |     array: nuts, dairy, gluten,   |
|     --- aisle/shelf/bin           |     shellfish, eggs, soy, sesame. |
|     reference. Printed on pick    |                                   |
|     lists.                        | -   halal_certified \|            |
|                                   |     kosher_certified \| vegan \|  |
| -   storage_conditions ENUM ---   |     organic --- boolean           |
|     ambient \| refrigerated_2_8   |     certification flags.          |
|     \| frozen_minus18 \|          |                                   |
|     controlled.                   | -   sabs_certified (BOOLEAN) ---  |
|                                   |     electronics, hardware,        |
| -   unit_of_measure ENUM --- each |     children\'s items.            |
|     \| kg \| g \| litre \| ml \|  |                                   |
|     metre \| pair \| dozen.       | -   recall_status ENUM --- none   |
|                                   |     \| quarantined \| recalled \| |
| -   weight_grams (DECIMAL 10,3)   |     cleared.                      |
|     --- for courier cost          |                                   |
|     estimation and recipe         |                                   |
|     costing.                      |                                   |
+-----------------------------------+-----------------------------------+

**2.4 Barcode & Identification Formats**

  ------------ -------------- -------------------- ------------------- --------------------------------
  **Format**   **Length**     **Auto-Detected?**   **Vertical Use**    **Groway Notes**

  EAN-13       13 digits      Yes --- camera + USB All retail,         Global standard. Pre-loaded
                              scanner              grocery, pharmacy,  catalogue uses EAN-13. GS1 SA
                                                   FMCG                registry lookup on unknown scan.

  EAN-8        8 digits       Yes                  Small pack sizes    Auto-detected. Stored alongside
                                                                       EAN-13 where both exist.

  UPC-A        12 digits      Yes                  US-imported         Converted to EAN-13 equivalent
                                                   products            on import (prepend 0).

  QR Code      Variable       Camera only          Restaurant menus,   Encodes product_id, menu item
                                                   custom items,       URL, or custom merchant payload.
                                                   service items       

  Internal SKU Alphanumeric   Manual or            Any vertical ---    Printed on shelf labels. Used
                              barcode-encoded      merchant\'s own     for unlabelled products.
                                                   code                Searchable.

  PLU Code     4--5 digits    Manual entry at POS  Fruit & veg, meat,  Cashier types PLU, scale sends
                                                   deli (weighed       weight → system calculates
                                                   goods)              price.

  NAPPI Code   Variable       Manual entry or scan Pharmacy            Every medicine SKU must have
                                                   (SAHPRA-mandated)   NAPPI code. SAHPRA compliance
                                                                       requirement.

  IMEI         15 digits      Camera scan or       Electronics ---     Stored per unit. Searchable for
                              manual               every mobile phone  stolen phone check. RICA
                                                                       compliance.

  Serial       Variable       Manual or barcode    High-value          Per-unit tracking. Warranty
  Number                                           electronics,        linked to serial from sale
                                                   appliances          record.
  ------------ -------------- -------------------- ------------------- --------------------------------

**2.5 Bundle & Assembly Products**

+-----------------------------------+-----------------------------------+
| **Bundles --- Sell Together,      | **Assemblies --- Produce into     |
| Stock Separately**                | Finished Goods**                  |
|                                   |                                   |
| Components stay as individual     | Raw materials consumed via Work   |
| stock items. Selling the bundle   | Order. Finished good enters stock |
| deducts each component from its   | as a new SKU. Cost of assembly =  |
| own stock. Bundle price can be    | sum of components consumed.       |
| different from the sum of         |                                   |
| components.                       | -   Bakery: Flour + Butter +      |
|                                   |     Eggs + Sugar → 12 Croissants  |
| -   Braai Pack: Boerewors 500g +  |     (finished goods SKU)          |
|     Pork Ribs 1kg + Wors Rolls    |                                   |
|     6-pack                        | -   Butchery: Whole lamb carcass  |
|                                   |     → Leg + Rack of ribs +        |
| -   QSR Combo: Burger + Chips +   |     Shoulder + Mince              |
|     Drink (modifiers allowed per  |                                   |
|     component)                    | -   Catering: Raw ingredients →   |
|                                   |     100 × pre-packed event meal   |
| -   Hair Treatment Package:       |     portions                      |
|     Wash + Conditioner + Blowdry  |                                   |
|     (service) + Argan Oil serum   | -   Cocktail batching: Spirits +  |
|                                   |     Mixers + Garnish → 20L        |
| -   Back-to-School Pack:          |     pre-batch cocktail keg        |
|     Pencils + Ruler + Books +     |                                   |
|     Eraser + Calculator           | -   Assembly Work Order: initiate |
|                                   |     → consume raw materials →     |
| -   Pharmacy First Aid Kit:       |     receive finished goods        |
|     Plasters + Savlon + Bandage + |                                   |
|     Scissors                      | -   Yield factor built in: if     |
|                                   |     chicken is 68% yield, system  |
| -   Bundle line on receipt is     |     calculates raw qty needed     |
|     single entry; COGS            |                                   |
|     individually tracked per      | -   Production variance: actual   |
|     component                     |     yield vs theoretical yield    |
|                                   |     flagged to manager            |
| -   Bundle price editable         |                                   |
|     independently of component    | -   Cost price of finished good   |
|     prices --- margin control     |     set automatically from actual |
|                                   |     WO component cost             |
| -   Low stock alert fires if ANY  |                                   |
|     component drops below reorder |                                   |
|     point                         |                                   |
+-----------------------------------+-----------------------------------+

**2.6 Pre-Loaded SKU Catalogues by Vertical**

  -------------- -------------- ------------------ ---------------------------------
  **Vertical**   **Pre-loaded   **Source /         **Key Pre-configuration**
                 SKUs**         Standard**         

  Grocery &      1,200 SKUs     EAN-13 barcodes,   VAT treatment pre-set per item
  Superette                     GS1 SA + Pick n    (zero-rated staples vs standard).
                                Pay / Checkers     Reorder points set. Shelf-life
                                equivalents        days set.

  Spaza Shop     600 SKUs       Top-moving         Large-icon product images. Price
                                informal trade     benchmarks from informal
                                lines (mealie      wholesale markets.
                                meal, bread, milk, isiZulu/Sesotho product names.
                                pilchards, cold    
                                drinks, airtime)   

  Pharmacy       500 SKUs       NAPPI codes from   Schedule classification pre-set
  (Full)                        SAHPRA register.   per item. VAT zero-rated on
                                Alliance           medicines. Cold chain flag set.
                                Healthcare +       Controlled substance register
                                Dis-Chem Direct    pre-configured.
                                catalogue.         

  Liquor Store   1,200 SKUs     DGB, Distell, SAB, Excise register pre-configured.
                                KWV, Heineken SA   Case → bottle unit conversion
                                distributor        set. Age restriction flag on all
                                catalogues         items. Trading hours enforcement
                                                   active.

  Fashion &      400 base       Common SA fashion  Variant matrix pre-configured per
  Apparel        styles         wholesale lines    style. Size runs set. Laybye
                 (multiply by                      enabled by default. SABS flag for
                 variants)                         children\'s clothing.

  Hair Salon &   300 SKUs       Schwarzkopf,       Consumables tracked per ml.
  Beauty                        Wella, OPI, Revlon Service items (haircut, colour)
                                Professional SA    set as non-stock. Stylist
                                distributor prices commission rates pre-set.

  Restaurant     600 ingredient Common SA          Recipe engine pre-configured with
                 SKUs           restaurant         50 common dishes. FIFO on all
                                ingredient lines.  perishable ingredients. Allergen
                                Recipe templates   flags set.
                                for 50 popular     
                                dishes.            

  Auto Workshop  500 part SKUs  Common SA vehicle  Job card linkage pre-configured.
                                parts: filters,    VIN lookup for parts
                                brake pads, oils,  compatibility. Labour items as
                                tyres (popular     non-stock SKUs.
                                sizes)             

  Hardware       800 SKUs       Builders           Multi-bin storage pre-configured.
                                Warehouse,         MOQ set per supplier. Trade
                                Plumblink, Voltex, account pricing tier active.
                                Ceramic equivalent 
                                catalogue          

  Electronics    200 SKUs       Common handset     IMEI register pre-configured for
                                accessories,       all handset SKUs. Warranty
                                screen protectors, tracking enabled. Secondhand
                                chargers by brand  intake workflow active.
  -------------- -------------- ------------------ ---------------------------------

**2.7 Product Import Methods**

  ---------------- ------------------- ------------------ --------------------
  **Method**       **How It Works**    **Best For**       **Validation**

  Vertical         Automatically       All new merchants. Pre-validated.
  catalogue        applied on merchant Removes biggest    Merchant edits
  (pre-load)       onboarding based on POS adoption       individual items as
                   vertical selection. barrier ---        needed.
                   All products        merchant can start 
                   pre-created with    selling in \< 10   
                   barcodes, VAT       minutes.           
                   treatment, reorder                     
                   points, and photos.                    

  CSV bulk import  Template download   Merchants          Each row validated:
                   with column         migrating from     required fields,
                   headers.            Yoco, iKhokha,     barcode format, VAT
                   Drag-and-drop       Sage, or with      code, price \> 0.
                   upload. Row-by-row  supplier price     Partial import
                   validation report   lists in Excel.    allowed (skip error
                   before commit.                         rows).
                   Errors highlighted                     
                   with fix                               
                   instructions.                          

  Scan-to-create   Scan unknown        New products not   Barcode format
                   barcode at POS →    in pre-loaded      validated. Duplicate
                   name auto-populated catalogue. Fast    check. Required
                   from GS1 SA or Open single-item        fields enforced.
                   Food Facts registry creation for spaza 
                   → merchant adds     owners.            
                   price and VAT →                        
                   save.                                  

  GroSupply        When merchant       Keeps procurement  Supplier data
  catalogue import creates a GroSupply data and inventory validated before
                   PO, any products on always in sync. No import. Duplicate
                   the PO that don\'t  re-entry of        resolution by
                   exist in their      product data from  barcode / NAPPI /
                   inventory are       supplier invoices. internal SKU.
                   auto-created from                      
                   supplier\'s                            
                   catalogue data.                        

  Supplier EDI /   GroSupply           Large suppliers    Supplier must be
  API push         Gold/Preferred      managing           GroSupply verified.
                   suppliers push      consistent pricing Changes audited.
                   catalogue updates   across many        Merchant notified of
                   via API. Price      merchants.         price changes.
                   changes propagate   Distributor→       
                   to merchant         merchant data      
                   cost_price_cents    pipelines.         
                   automatically on                       
                   next GRN.                              
  ---------------- ------------------- ------------------ --------------------

+-----------------------------------------------------------------------+
| **03** ── **Stock Receiving & Goods Received Notes**                  |
|                                                                       |
| *PO → GRN mobile scan → 3-way match → batch capture → quality flags → |
| auto-journal*                                                         |
|                                                                       |
| Benchmarked against Cin7\'s 3-way match and DEAR Systems\' GRN        |
| workflow --- the gold standard for SME procurement                    |
+-----------------------------------------------------------------------+

**3.1 GRN Workflow --- End to End**

  ---------- ------------- -------------------------------------- ----------------
  **Step**   **Action**    **System Behaviour**                   **Auth
                                                                  Required**

  1          Select or     Open from GroSupply linked PO          Cashier or
             create GRN    (pre-fills expected items) or create   manager
                           manual GRN (blank). Manual GRN for     
                           walk-in/COD purchases.                 

  2          Scan items    Scan each product barcode as it comes  None --- scan
                           off the delivery. System matches to    mode
                           expected PO lines.                     

  3          Confirm       For each scanned item, confirm or      Receiver
             quantities    adjust received quantity. Shortages    
                           highlighted amber; overages            
                           highlighted orange.                    

  4          Capture batch For batch-tracked products (pharmacy,  Receiver ---
             details       food, chemicals): enter batch number,  mandatory fields
                           production date, expiry date, unit     enforced
                           cost.                                  

  5          Flag quality  Mark any items Rejected: damage, wrong Receiver
             issues        product, near-expiry on arrival,       
                           temperature breach. Rejected items NOT 
                           added to stock.                        

  6          Review and    Manager reviews GRN summary. Confirms. Manager
             complete      Stock updated atomically. Kafka event  biometric or PIN
                           published. GroSettle payment           
                           eligibility set.                       

  7          3-way match   GroSupply matches PO expected → GRN    Automatic
             (auto)        received → supplier invoice. Variance  
                           \> 5% enters review queue. Match =     
                           payable created.                       

  8          Accounting    On GRN approval: Inventory Service     Automatic
             journal       publishes inventory.received Kafka     
             (auto)        event. Accounting Service creates Dr   
                           Inventory, Cr AP journal.              
  ---------- ------------- -------------------------------------- ----------------

**3.2 Mobile GRN App Specification**

+---+---------------------------------------------------------------------+
| * | **Mobile-First Receiving**                                          |
| * |                                                                     |
| 📱 | GRN is done at the loading bay or back storeroom --- not at a desk. |
| * | The Merchant mobile app (React Native) provides a camera-based      |
| * | barcode scanning module via Vision Camera library. Offline capture  |
|   | stores scans locally in SQLite when there is no WiFi at the         |
|   | receiving point, syncing automatically when connectivity returns.   |
|   | GPS location is captured on GRN completion to accurately log which  |
|   | branch received the stock.                                          |
+---+---------------------------------------------------------------------+

+-----------------------------------+-----------------------------------+
| **Mobile GRN Screen Flow**        | **Hardware Compatibility**        |
|                                   |                                   |
| -   GRN List → \"New GRN\" or     | -   Bluetooth scanner: Honeywell  |
|     select open GroSupply PO      |     Voyager 1202g, Zebra DS2278   |
|                                   |     --- paired via Bluetooth,     |
| -   Scan Mode: full-screen        |     work alongside camera         |
|     camera, torch ON by default   |                                   |
|     for dark stockrooms           | -   USB scanner: Honeywell 1900,  |
|                                   |     Zebra DS2208 --- USB OTG      |
| -   Match feedback: green flash + |     adapter for tablet            |
|     ding = known product; red     |                                   |
|     flash = unknown barcode       | -   Weighing scale: Mettler       |
|     (prompt to create)            |     Toledo, Avery Berkel --- PLU  |
|                                   |     linked via serial/USB         |
| -   Quantity tally: shows         |     (grocery/butchery)            |
|     expected vs received count    |                                   |
|     per item in real time         | -   Thermal label printer: Zebra  |
|                                   |     ZD220, Brother QL-820NWB ---  |
| -   Batch form: slides up after   |     print GRN receipt, batch      |
|     each scan for batch-tracked   |     labels, shelf labels          |
|     products. Number pad          |                                   |
|     optimised for gloved hands.   | -   Cold chain monitor: TZONE     |
|                                   |     TH10S Bluetooth temperature   |
| -   Reject button: long-press on  |     logger --- links to cold      |
|     any item → reason selection   |     chain compliance log on GRN   |
|     (Damaged \| Wrong Item \|     |                                   |
|     Near-expiry \| Short          | -   NFC/RFID reader (future):     |
|     quantity)                     |     pallet-level receiving for    |
|                                   |     high-volume grocery and       |
| -   Progress indicator: \"23 of   |     hardware                      |
|     47 items scanned\" ---        |                                   |
|     prevents incomplete GRNs      |                                   |
|                                   |                                   |
| -   Summary: all items, variances |                                   |
|     highlighted,                  |                                   |
|     accept/investigate per line   |                                   |
|                                   |                                   |
| -   Manager approval: biometric   |                                   |
|     or PIN on summary screen      |                                   |
|     before commit                 |                                   |
|                                   |                                   |
| -   Offline indicator: \"5 items  |                                   |
|     queued --- will sync when     |                                   |
|     connected\"                   |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **04** ── **Stock Movements & Adjustments**                           |
|                                                                       |
| *Every change to stock is a movement record --- typed, reason-coded,  |
| authorised, and accounting-linked*                                    |
|                                                                       |
| Benchmarked against Square for Retail\'s movement audit and           |
| Lightspeed\'s reason-code system                                      |
+-----------------------------------------------------------------------+

**4.1 Movement Types, Reason Codes & Auth Requirements**

  ------------- ------------------- --------------------- ------------------ --------------------
  **Movement    **Direction**       **Reason Codes**      **Auth Level**     **Accounting
  Type**                                                                     Impact**

  POS Sale      OUT --- automatic   N/A (auto-triggered   None ---           Dr COGS → Cr
                                    on tx complete)       system-initiated   Inventory

  Customer      IN --- cashier      Customer return \|    Manager PIN ---    Dr Inventory → Cr
  Return        action              Exchange \| Error     prevents           COGS reversal. Dr
                                    correction \|         fraudulent returns Returns Inward if
                                    Warranty                                 separate account.

  GRN Receive   IN --- automatic on N/A (GRN is the       Manager biometric  Dr Inventory → Cr
                GRN approve         reason)               on GRN             Accounts Payable

  Manual        IN ---              Found stock \|        Manager PIN +      Dr Inventory → Cr
  Addition      manager-initiated   Supplier credit \|    mandatory reason   Stock Adjustment
                                    Production/assembly   code               Income
                                    \| Opening balance                       

  Manual        OUT ---             Damaged \| Expired \| Manager PIN +      Dr Shrinkage/Wastage
  Removal       manager-initiated   Stolen \| Sample      mandatory reason   Expense → Cr
                                    given \| Own use \|   code + optional    Inventory
                                    Promotional giveaway  notes              
                                    \| Error correction                      

  Transfer Out  OUT ---             Branch transfer \|    Manager PIN +      No P&L impact.
                manager-initiated   Warehouse pick \|     destination        Balance sheet
                                    Event stock \| Loan   confirm            reclassification
                                    to supplier                              only.

  Transfer In   IN ---              Received from branch  Receiver           No P&L impact.
                receiver-confirms   \| Received from      confirmation on    Completes the
                                    warehouse             destination device reclassification.

  Stocktake     IN --- auto on      Stocktake count       Manager            Dr Inventory → Cr
  Variance +    approved stocktake  higher than system    authorisation on   Stock Variance
                                                          stocktake submit   Income

  Stocktake     OUT --- auto on     Stocktake count lower Manager            Dr Stock Variance
  Variance −    approved stocktake  than system           authorisation on   Expense → Cr
                                                          stocktake submit   Inventory

  Recipe        OUT --- automatic   N/A (recipe is the    None ---           Dr Food COGS → Cr
  Deduction     on F&B dish sale    reason)               system-initiated   Ingredient Inventory
                                                          on every dish sold 

  Assembly      OUT --- manager     BOM production run \| Production manager Dr WIP → Cr Raw
  Consumption   Work Order approval Prep batch            approves Work      Materials Inventory
                                                          Order              

  Recall        HOLD --- admin or   SAHPRA recall \|      Owner/Admin ---    Dr Recall Loss
  Quarantine    manager-initiated   Supplier recall \|    irreversible       Provision → Cr
                                    Internal quality hold without Owner      Inventory (pending
                                    \| Temperature breach override           supplier credit)
  ------------- ------------------- --------------------- ------------------ --------------------

**4.2 Movement Audit Log --- Immutable Record**

+---+----------------------------------------------------------------------+
|   | **Every Stock Movement Creates a Permanent, Tamper-Evident Record**  |
|   |                                                                      |
|   | -   movement_id (UUID) --- immutable primary key. Referenced on SARS |
|   |     audit requests, SAHPRA inspections, insurance claims.            |
|   |                                                                      |
|   | -   movement_type (ENUM) --- strictly typed: pos_sale \|             |
|   |     customer_return \| grn_receive \| manual_add \| manual_remove \| |
|   |     transfer_out \| transfer_in \| stocktake_plus \| stocktake_minus |
|   |     \| recipe_deduction \| assembly \| recall_quarantine             |
|   |                                                                      |
|   | -   product_id + variant_id --- exactly which SKU moved.             |
|   |                                                                      |
|   | -   batch_id (UUID FK) --- which specific batch was consumed.        |
|   |     FIFO-selected by system. NULL for non-batch-tracked items.       |
|   |                                                                      |
|   | -   location_id (UUID FK) --- which physical location the movement   |
|   |     occurred at (which branch, which stock room).                    |
|   |                                                                      |
|   | -   quantity (INTEGER \> 0) --- always positive. Direction           |
|   |     determined by movement_type, never by sign of quantity.          |
|   |                                                                      |
|   | -   cost_price_cents (BIGINT) --- the COGS cost at the exact moment  |
|   |     of movement. Locked. Never retroactively updated.                |
|   |                                                                      |
|   | -   reference_id (UUID) --- links to: transaction_id (POS sale) \|   |
|   |     grn_id (receive) \| transfer_id \| stocktake_id \|               |
|   |     adjustment_id.                                                   |
|   |                                                                      |
|   | -   reason_code (VARCHAR) + reason_notes (TEXT) --- mandatory for    |
|   |     all manual movements. Free text notes optional but encouraged.   |
|   |                                                                      |
|   | -   performed_by (UUID FK → users) --- staff member who triggered    |
|   |     the movement.                                                    |
|   |                                                                      |
|   | -   authorised_by (UUID FK → users) --- manager who approved (for    |
|   |     movements requiring manager auth). NULL for auto movements.      |
|   |                                                                      |
|   | -   created_at (TIMESTAMPTZ) --- server-side timestamp. Cannot be    |
|   |     backdated. Indexed for movement history queries.                 |
|   |                                                                      |
|   | -   device_id + ip_address --- security forensics. For theft/fraud   |
|   |     investigation.                                                   |
|   |                                                                      |
|   | -   kafka_event_id --- cross-references the published Kafka event    |
|   |     for this movement. Enables end-to-end event tracing.             |
|   |                                                                      |
|   | -   This log is append-only. No UPDATE or DELETE ever. Corrections   |
|   |     create new reversal movement records.                            |
+---+----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **05** ── **FIFO, Batch Tracking & Expiry Management**                |
|                                                                       |
| *FIFO enforced at DB level · Full batch lifecycle · Multi-tier expiry |
| alerts · Instant recall*                                              |
|                                                                       |
| Benchmarked against Cin7\'s batch traceability and DEAR Systems\'     |
| expiry management --- both extended for SA compliance requirements    |
+-----------------------------------------------------------------------+

**5.1 FIFO --- First-In First-Out Enforcement**

FIFO is enforced at the database layer --- not as a UI suggestion. When
a product is sold or adjusted out, the system automatically consumes the
batch with the oldest received_date first. Cashiers cannot override
this. Managers can override with a reason code (e.g. near-expiry
clearance). This matches the Cin7 and DEAR Systems approach and is
essential for accurate COGS and food safety compliance.

  --------------- --------------------------- --------------- --------------------
  **Scenario**    **FIFO Rule Applied**       **Override?**   **Vertical
                                                              Relevance**

  Normal sale at  Oldest received_date batch  No override at  All batch-tracked
  POS             consumed first.             cashier level.  verticals: pharmacy,
                  Auto-selected by inventory                  grocery, F&B,
                  engine, invisible to                        liquor.
                  cashier.                                    

  Partial batch   Batch partially consumed.   N/A.            Everyday partial
  deduction       Remaining qty stays on that                 case/box
                  batch with accurate                         consumption.
                  remaining count.                            

  Batch exhausted System auto-rolls to next   N/A ---         Common on
  mid-sale        oldest batch. Split         seamless.       high-volume lines
                  deduction across two                        where batches
                  batches fully logged.                       exhaust during the
                                                              day.

  Near-expiry     Manager selects specific    Manager PIN +   Grocery, fresh
  clearance       batch to push first         reason code     produce, bakery,
                  (non-FIFO). Reason code:    required.       restaurant
                  \"Near-expiry clearance\".                  ingredients.

  Recalled batch  System skips recalled batch No override --- Pharmacy, food, any
  present         entirely, even if it is the hard block on   batch under recall.
                  oldest. Moves to next valid recalled        Safety-critical.
                  batch.                      batches.        

  Negative stock  If                          Only when       Bar consumables,
  enabled         allow_negative_stock=true   feature         salon service
                  and no batch exists,        explicitly      products,
                  deduction creates a         enabled per     consumables where
                  placeholder batch with      SKU.            exact batches are
                  negative qty.                               impractical.
  --------------- --------------------------- --------------- --------------------

**5.2 Batch Record --- Full Specification**

  -------------------------- -------------- ---------------- ------------------------------
  **Column**                 **Data Type**  **Constraint**   **Purpose & Notes**

  **batch_id**               UUID           PRIMARY KEY      Immutable identifier.
                                                             Referenced in every movement
                                                             record for full
                                                             forward/backward traceability.

  **product_id**             UUID           FK NOT NULL      Parent product. Indexed for
                                                             fast product→batches lookup.

  **variant_id**             UUID           FK NOT NULL      Specific variant
                                                             (size/colour/strength/pack).
                                                             One batch belongs to one
                                                             variant.

  **location_id**            UUID           FK NOT NULL      Physical location where batch
                                                             is stored. Changes via
                                                             transfer movement.

  **batch_number**           VARCHAR(100)   NULLABLE         Supplier\'s batch/lot number.
                                                             Mandatory for SAHPRA
                                                             (pharmacy), food safety,
                                                             chemicals. Used as primary key
                                                             in recall identification.

  **received_date**          DATE           NOT NULL         Date GRN was completed. The
                                                             FIFO sorting key --- oldest
                                                             received_date consumed first.
                                                             Indexed.

  **production_date**        DATE           NULLABLE         Manufacturing date. Used for
                                                             shelf-life calculation.
                                                             Required for pharmaceutical
                                                             products.

  **expiry_date**            DATE           NULLABLE         Expiry/best-before date. NULL
                                                             for non-perishables. Indexed
                                                             for expiry report queries and
                                                             alert generation.

  **quantity_received**      INTEGER        NOT NULL \> 0    Original quantity received in
                                                             this batch. Never updated
                                                             retroactively.

  **quantity_available**     INTEGER        NOT NULL \>= 0   Current remaining quantity.
                                                             Updated atomically on every
                                                             deduction using optimistic
                                                             locking.

  **cost_price_cents**       BIGINT         NOT NULL \> 0    Unit cost at time of receipt.
                                                             Used for FIFO COGS. Never
                                                             updated --- historical cost
                                                             locked.

  **status**                 VARCHAR(20)    NOT NULL         active \| near_expiry \|
                                                             expired \| recalled \|
                                                             quarantined \| depleted.
                                                             Drives dashboard alert badges.

  **grn_id**                 UUID           FK NULLABLE      Links to GRN that created this
                                                             batch. Full receiving audit
                                                             trail. NULL for manually
                                                             created batches.

  **supplier_id**            UUID           FK NULLABLE      GroSupply supplier. Enables
                                                             recall notification routing
                                                             back to source supplier.

  **recall_id**              UUID           FK NULLABLE      Links to recall record if
                                                             recalled. Non-NULL = hard
                                                             block on all deductions from
                                                             this batch.

  **cold_temp_at_receive**   DECIMAL(4,1)   NULLABLE         Temperature (°C) recorded at
                                                             receiving for cold chain
                                                             items. Logged for HACCP
                                                             compliance.

  **created_at**             TIMESTAMPTZ    NOT NULL DEFAULT Batch creation timestamp.
                                            NOW()            Indexed.
  -------------------------- -------------- ---------------- ------------------------------

**5.3 Expiry Alert System --- Three-Tier Proactive Management**

  ------------- ------------- ---------------- ------------------ ---------------------
  **Alert       **Default     **Channel**      **Required         **Vertical-Specific
  Tier**        Threshold**                    Action**           Defaults**

  Critical ---  Day of or     Red badge on     Immediate          Pharma: notify
  Expired       past expiry   dashboard + push write-off with     SAHPRA. Food: HACCP
                              notification +   reason code.       log. Liquor: pull
                              POS hard block   SAHPRA batches:    from shelves. Dairy:
                              on sale          destruction log +  destroy.
                                               notification.      
                                               Food: HACCP log    
                                               entry.             

  Warning ---   30 days       Amber badge +    Create clearance   Fresh produce: 3
  Near Expiry   before expiry daily in-app     promotion. Move to days. Dairy: 5 days.
                (default)     notification     front of shelf /   Bakery: 1 day.
                                               FIFO override.     Pharma: 90 days.
                                               Consider GroSupply Wine: no expiry.
                                               return request.    Canned: 60 days.

  Advisory ---  60 days       Blue advisory on Plan stock         Pharma: 180 days.
  Approaching   before expiry expiry report.   rotation. Adjust   Grocery standard: 60
                (default)     No intrusive     reorder quantity   days. Cold chain: 14
                              push.            downward. Review   days. Dry goods: 90
                                               par level vs       days.
                                               actual velocity.   

  Velocity      JAX AI        JAX AI insight   Promotional action \"At current sales
  Overstock     calculates:   card on          needed. Volume     rate, you will have
  Alert         at current    dashboard +      discount. WhatsApp 45 units of
                sales rate,   optional push    special to loyalty Amoxicillin 500mg
                will X units                   members.           unsold when Batch
                expire                                            BN-202 expires on 15
                unsold?                                           April.\"
  ------------- ------------- ---------------- ------------------ ---------------------

**5.4 Batch Recall Management**

+---+---------------------------------------------------------------------+
| * | **Recall --- Zero Tolerance Hard Lock**                             |
| * |                                                                     |
| ! | A recall quarantines ALL units of the specified batch across ALL    |
| * | merchant locations simultaneously within 60 seconds of initiation.  |
| * | Recalled batches cannot be sold, transferred, or adjusted except to |
|   | \"Destroy\" or \"Return to Supplier\". Every affected merchant      |
|   | receives a push notification, SMS, and WhatsApp message. This meets |
|   | SAHPRA Pharmacovigilance requirements and Food Safety Act           |
|   | obligations.                                                        |
+---+---------------------------------------------------------------------+

+-----------------------------------+-----------------------------------+
| **Recall Initiation --- Who and   | **Recall Resolution Workflow**    |
| How**                             |                                   |
|                                   | -   Merchant selects action per   |
| -   Groway Admin Console (SAHPRA  |     recall: Return to Supplier \| |
|     or government mandate)        |     Destroy on Premises           |
|                                   |                                   |
| -   GroSupply portal              | -   Destruction log: date,        |
|     (supplier-initiated voluntary |     quantity destroyed, method,   |
|     recall)                       |     witnessed by (staff ID +      |
|                                   |     biometric). SAHPRA-required.  |
| -   Merchant Owner (internal      |                                   |
|     quality hold --- their own    | -   Return to supplier: GroSupply |
|     products only)                |     dispute/return workflow.      |
|                                   |     Credit note issued against    |
| -   Input: batch_number OR        |     original PO.                  |
|     supplier batch reference OR   |                                   |
|     date range + product +        | -   Accounting: Dr Recall Loss,   |
|     supplier                      |     Cr Inventory (or Dr Recall    |
|                                   |     Receivable if supplier credit |
| -   System finds all merchants,   |     pending)                      |
|     all branches holding affected |                                   |
|     batches in seconds            | -   Groway Admin confirms         |
|                                   |     resolution per merchant ---   |
| -   All identified batches        |     recall_resolved_at timestamp  |
|     instantly: status → recalled, |     set                           |
|     available_stock blocked       |                                   |
|                                   | -   Full recall audit trail       |
| -   POS engine rejects sale of    |     exportable as signed PDF for  |
|     any recalled batch --- hard   |     SAHPRA or insurer submission  |
|     block, not advisory           |                                   |
|                                   | -   JAX AI recall narrative:      |
| -   Push + SMS + WhatsApp to      |     \"Batch BN-2024-1142 of       |
|     every affected merchant       |     Amoxicillin 500mg recalled 14 |
|     within 60 seconds             |     Feb. You held 48 units at 2   |
|                                   |     locations. All confirmed      |
| -   Recall notice includes:       |     destroyed 16 Feb. Estimated   |
|     product, batch, reason,       |     loss: R2,304.\"               |
|     authority reference, action   |                                   |
|     required                      |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **06** ── **Multi-Location Stock Management**                         |
|                                                                       |
| *Branches · Warehouses · Stock rooms · Inter-location transfers ·     |
| Consolidated owner view · In-transit tracking*                        |
|                                                                       |
| Benchmarked against Shopify\'s multi-location (best-in-class for      |
| retail chains) and Lightspeed\'s warehouse management                 |
+-----------------------------------------------------------------------+

**6.1 Location Hierarchy**

  ----------- -------------- ------------------------ ----------------------------
  **Level**   **Name**       **Description**          **SA Examples**

  Merchant    Organisation   Top-level entity. Owner  Khumalo Butcheries (Pty) Ltd
                             of all stock, all        --- owns Soweto, Midrand,
                             branches, consolidated   and Tembisa branches
                             P&L. One Groway account. 

  Branch /    Physical       Each physical site: own  Khumalo\'s --- Soweto \|
  Store       location       stock levels, own POS    Khumalo\'s --- Midrand \|
                             terminals, own cashiers, Khumalo\'s --- Tembisa
                             own GRN capability.      

  Stock Room  Sub-area       Internal division of a   Walk-in Freezer \| Dry Store
  / Zone      within         branch for organised     \| Display Fridge \| Spirits
              location       stock management and     Cabinet \| Pharmacy
                             pick lists.              Dispensary

  Virtual     Non-physical   Tracks stock that is     In Transit (Soweto →
  Location    holding area   between states or being  Midrand) \| Quarantine \|
                             held. Never maps to a    Returned to Supplier \|
                             physical space.          Quality Hold
  ----------- -------------- ------------------------ ----------------------------

**6.2 Inter-Location Transfer Workflow**

  ------------- ----------------- ------------------ --------------------------------------
  **Step**      **Action**        **Status**         **Stock Position**

  1\. Initiate  Source branch     pending_approval   No stock change yet. Transfer record
                manager creates                      created.
                transfer: select                     
                items,                               
                quantities,                          
                destination.                         

  2\. Approve   Owner or          approved →         Source stock deducted. Added to
                destination       in_transit         In-Transit virtual location.
                branch manager                       
                approves.                            
                (Auto-approved if                    
                Owner has                            
                pre-approved this                    
                route.)                              

  3\. Dispatch  Source confirms   in_transit         Stock shows as \"In Transit\". Visible
                items handed to                      to owner in consolidated view. Not at
                driver/courier.                      source, not yet at destination.
                Tracking number                      
                added if courier.                    

  4\. Receive   Destination scans received or        Destination stock credited. In-Transit
                items received.   partial_receive    deducted. Discrepancies flagged.
                Confirms                             
                quantities. Flags                    
                shortages or                         
                damage.                              

  5\. Resolve   If received \<    disputed →         Source accounts for missing units
  discrepancy   dispatched:       resolved           (theft in transit, loading error,
                source                               carrier damage).
                investigates.                        
                Loss reason code                     
                required.                            

  6\. Complete  Both parties      completed          No P&L accounting impact. Balance
                confirm. Transfer                    sheet reclassification. Full audit
                record closed.                       trail preserved.
  ------------- ----------------- ------------------ --------------------------------------

**6.3 Consolidated Multi-Location Dashboard**

+-----------------------------------+-----------------------------------+
| **Owner / HQ View --- See         | **Branch Manager View --- My      |
| Everything**                      | Branch**                          |
|                                   |                                   |
| -   Total stock-on-hand: all SKUs | -   My branch only: focused view  |
|     aggregated across ALL         |     of this branch\'s stock,      |
|     branches --- one consolidated |     movements, and alerts         |
|     number                        |                                   |
|                                   | -   \"Request Transfer\": tap any |
| -   Branch stock split: tap any   |     product → \"Request X units   |
|     SKU → see \"Soweto: 12 \|     |     from \[Branch\]\" →           |
|     Midrand: 4 \| Tembisa: 31\"   |     auto-notifies source branch   |
|                                   |                                   |
| -   In-transit: items moving      | -   \"Can I fulfil?\": cashier    |
|     between branches shown        |     checks stock across all       |
|     separately as \"In Transit\"  |     branches to advise customer   |
|                                   |     on availability at other      |
| -   Stock value by branch: asset  |     locations                     |
|     value per location for        |                                   |
|     balance sheet allocation      | -   My GRNs: deliveries expected  |
|                                   |     today and this week at my     |
| -   Low stock alerts: flagged     |     branch only                   |
|     across all branches --- any   |                                   |
|     branch below reorder point    | -   My stocktake: initiate and    |
|     appears in consolidated alert |     manage branch-level cycle     |
|                                   |     counts and full stocktakes    |
| -   Reorder summary: one combined |                                   |
|     reorder view across all       | -   My shrinkage: this branch\'s  |
|     locations --- single          |     variance % vs company average |
|     GroSupply order for all       |     --- accountability metric for |
|     branches                      |     branch performance            |
|                                   |                                   |
| -   Branch performance: which     | -   Receive transfer: dedicated   |
|     branch has the highest        |     screen for receiving          |
|     sell-through rate per SKU     |     inter-branch stock. GRN-style |
|                                   |     confirmation flow.            |
| -   JAX AI concentration alert:   |                                   |
|     \"85% of your Boerewors stock | -   My low stock: alerts specific |
|     is at Tembisa --- stockout    |     to my branch --- no noise     |
|     risk at Soweto in 2 days.     |     from other branches unless    |
|     Consider a transfer.\"        |     owner enables cross-view      |
|                                   |                                   |
| -   Stock imbalance: flag SKUs    |                                   |
|     where one branch has excess   |                                   |
|     while another is near         |                                   |
|     stockout --- suggest transfer |                                   |
|     instead of new order          |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **07** ── **Stocktake & Physical Inventory Count**                    |
|                                                                       |
| *Cycle count · Full stocktake · Blind count · Variance report ·       |
| Write-off workflow*                                                   |
|                                                                       |
| Benchmarked against Square for Retail cycle count and Cin7 stocktake  |
| workflow                                                              |
+-----------------------------------------------------------------------+

**7.1 Stocktake Types**

  ----------- --------------- ------------- --------------------------- ----------------
  **Type**    **Frequency**   **POS         **Description**             **Best For**
                              Impact**                                  

  Full        Annual /        POS paused    Count every single SKU at   Year-end SARS
  Stocktake   bi-annual       recommended   every location. Done after  submission.
                                            hours or on a dedicated     Major
                                            day. Produces year-end      discrepancy
                                            stock valuation.            investigation.
                                                                        New branch
                                                                        takeover.

  Cycle Count Rolling         Zero --- runs Count a rotating subset of  High-volume:
              (A-items        during        SKUs. A-items are           grocery,
              weekly, B       trading hours high-value/high-velocity.   pharmacy,
              monthly, C                    C-items are slow-movers.    liquor,
              quarterly)                    Maintains accuracy without  hardware. Best
                                            full shutdown.              practice for
                                                                        ongoing
                                                                        accuracy.

  Category    As needed       Zero          Count all items in one      After suspected
  Count                                     category (e.g. all frozen,  cold chain
                                            all spirits, all Schedule 3 breach. After
                                            medicines).                 large delivery
                                                                        of a category.
                                                                        Reconcile a
                                                                        department.

  Spot Count  Daily or on     Zero --- very Count 1--20 specific        Theft
              suspicion       fast          high-risk SKUs. Cigarettes, investigation.
                                            spirits, electronics,       Reconcile
                                            cash-equivalent items.      high-value SKUs
                                                                        daily. Shrinkage
                                                                        hotspot
                                                                        management.

  Post-GRN    After every GRN Zero          Verify received quantities  All verticals.
  Count                                     match GRN immediately on    Prevents
                                            delivery.                   short-delivery
                                                                        disputes.
                                                                        Quality control
                                                                        at point of
                                                                        entry.
  ----------- --------------- ------------- --------------------------- ----------------

**7.2 Blind Count Workflow --- Best Practice**

+---+---------------------------------------------------------------------+
| * | **Blind Count Enforced by Default**                                 |
| * |                                                                     |
| 🔒 | Groway implements blind count: the counter sees the product name   |
| * | and barcode but NOT the system quantity. This prevents counters     |
| * | from confirming what the system shows instead of actually counting. |
|   | Post-submit variance report reveals system vs counted. This         |
|   | surfaces 2--3× more variance than non-blind counts --- the Square   |
|   | for Retail and Lightspeed standard.                                 |
+---+---------------------------------------------------------------------+

+-----------------------------------+-----------------------------------+
| **Mobile Stocktake Flow**         | **Variance Report Detail**        |
|                                   |                                   |
| -   Manager initiates: select     | -   Variance = System Qty −       |
|     type                          |     Counted Qty (positive =       |
|     (full/cycle/category/spot),   |     shrinkage; negative =         |
|     select location, assign staff |     over-count)                   |
|     member(s)                     |                                   |
|                                   | -   Value at risk: variance qty × |
| -   Staff sees task in Merchant   |     weighted average cost price   |
|     app: \"Stocktake assigned --- |     --- sorted highest value      |
|     Dry Goods Section, 47 items\" |     first                         |
|                                   |                                   |
| -   Scan Mode: camera/scanner     | -   Variance % of total stock     |
|     opens. Scan product barcode → |     value: KPI for loss           |
|     number pad for count. NO      |     prevention benchmarking vs    |
|     system qty shown.             |     industry norms                |
|                                   |                                   |
| -   Unrecognised barcode: prompt  | -   Historical variance per SKU:  |
|     to add new product or flag as |     recurring discrepancy flags   |
|     \"Not In System\"             |     systematic theft or scan      |
|                                   |     errors                        |
| -   \"Not Found\" items: mark     |                                   |
|     unscannable products manually | -   Reason code mandatory for all |
|     from a pick-list              |     variances \> R50 value        |
|                                   |     threshold (configurable)      |
| -   Manager recount flag: flag    |                                   |
|     specific lines for recount    | -   Auto-approve threshold:       |
|     before reviewing variance     |     variances \< R10              |
|                                   |     auto-approved as counting     |
| -   Submit: \"Submit for Manager  |     noise                         |
|     Review\" button --- requires  |                                   |
|     manager PIN before variance   | -   Manager sign-off: variances   |
|     is revealed                   |     \> R500 require owner-level   |
|                                   |     biometric authorisation       |
| -   Variance screen: system qty   |                                   |
|     vs counted qty shown          | -   SARS-ready export: PDF with   |
|     side-by-side for every item   |     merchant details, date,       |
|                                   |     counted by, authorised by,    |
| -   Manager actions: Approve all  |     timestamp                     |
|     / Approve selected / Recount  |                                   |
|     specific items / Override     | -   Journal entry auto-created:   |
|     with reason                   |     Dr Stock Variance (P&L), Cr   |
|                                   |     Inventory --- per approved    |
| -   Commit: approved variances    |     variance line                 |
|     applied to stock + accounting |                                   |
|     journal created automatically | -   Shrinkage KPI updated: branch |
|                                   |     shrinkage % recalculated      |
|                                   |     after every stocktake         |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **08** ── **Smart Reorder & JAX AI Demand Forecasting**               |
|                                                                       |
| *Reorder points · Par-level replenishment · 5-day AI forecast window  |
| · Seasonal patterns · Auto-RFQ*                                       |
|                                                                       |
| Benchmarked against Cin7 reorder management + DEAR Systems AI         |
| replenishment engine                                                  |
+-----------------------------------------------------------------------+

**8.1 Three-Tier Reorder Logic**

  ---------- --------------- --------------------------- ------------------ -----------------
  **Tier**   **Name**        **Trigger Logic**           **Best For**       **Auto-Order?**

  Tier 1     Simple          stock_on_hand ≤             Spaza shops. Small Optional ---
             Threshold       reorder_point → alert +     retailers. Simple  merchant chooses
                             optional auto-RFQ. Reorder  product lines.     alert-only or
                             qty = fixed reorder_qty     Easy to configure  auto-order
                             field.                      and understand.    

  Tier 2     Par-Level       Reorder qty = par_level −   Grocery, pharmacy, Optional auto-RFQ
             Replenishment   current_stock_on_hand.      bar. Par levels    --- manager
                             Order to bring back to par, match daily or     approval step
                             not a fixed qty. Par =      weekly usage       available
                             daily usage ×               patterns. Avoids   
                             safety_stock_days.          both over- and     
                                                         under-ordering.    

  Tier 3     JAX AI Forecast ML model on 90-day sales    High-volume:       Auto-RFQ draft
             Reorder         history + day-of-week +     grocery, pharmacy, created, manager
                             seasonality + upcoming      QSR ingredients,   reviews and sends
                             events + lead time buffer + liquor.            to GroSupply with
                             expiry constraint. Predicts Dramatically       one tap
                             demand for next 14 days.    reduces stockouts  
                             Orders exactly what is      AND overstock      
                             needed.                     simultaneously.    
  ---------- --------------- --------------------------- ------------------ -----------------

**8.2 JAX AI Demand Forecasting Engine**

+---+---------------------------------------------------------------------+
| * | **JAX Explains Its Reasoning**                                      |
| * |                                                                     |
| 🤖 | Every forecast is accompanied by a plain-language narrative: \"I\'m |
| * | recommending 48 units of Castle Lager because last Tuesday was your |
| * | best day this month, you typically sell 12 units on a Wednesday,    |
|   | there\'s a public holiday on Friday which historically increases    |
|   | your volume by 34%, and your supplier takes 2 days to deliver.\"    |
|   | This transparency builds merchant trust and allows them to override |
|   | intelligently.                                                      |
+---+---------------------------------------------------------------------+

  ------------------ ------------ -------------------------- -----------------------------
  **Input Signal**   **Weight**   **Data Source**            **How It Shapes the
                                                             Forecast**

  Historical Sales   40%          TimescaleDB --- 90 days of Rolling average adjusted for
  Velocity                        inventory.sold events per  trend direction (growing /
                                  SKU per location           declining / stable). Most
                                                             recent 14 days weighted 2×.

  Day-of-Week        20%          TimescaleDB --- hourly and Sundays ≠ Mondays. Weekend
  Pattern                         daily sales aggregation    uplift for entertainment
                                  per SKU                    verticals. Pay-day surge
                                                             (25th--27th of month) for
                                                             spaza and grocery.

  Seasonal Trend     15%          TimescaleDB --- same       December liquor surge
                                  calendar period prior      (+40--80%). January health
                                  year. Vertical seasonal    supplement spike.
                                  flags.                     Back-to-school (January).
                                                             Easter meat demand. Winter vs
                                                             summer

  Upcoming Events    10%          Merchant event calendar.   Booked function for 80 pax on
                                  Public holiday calendar    Saturday adds 15% to F&B
                                  (SA-specific). GroSupply   forecast. Public holidays
                                  demand heatmap across all  trigger category-specific
                                  merchants.                 uplift.

  Lead Time Buffer   10%          product.lead_time_days +   Order must arrive before
                                  historic GRN delivery      stockout. If lead time is 3
                                  variance per supplier      days and stockout predicted
                                                             in 4 days --- order now, not
                                                             later.

  Expiry Constraint  5%           batch.expiry_date vs       Never recommend ordering more
                                  forecasted sell-through    than will sell before expiry.
                                  date per SKU               Reduces wastage from
                                                             over-ordering perishables.
  ------------------ ------------ -------------------------- -----------------------------

**8.3 Reorder Dashboard --- Merchant Experience**

+-----------------------------------+-----------------------------------+
| **Reorder Alerts Panel**          | **JAX AI Insight Cards --- Real   |
|                                   | Examples**                        |
| -   Traffic light: Red = out of   |                                   |
|     stock now · Amber = below     | -   💡 \"Boerewors Bulk 5kg --- 3 |
|     reorder point · Yellow = JAX  |     days of stock remaining at    |
|     predicts stockout within 5    |     current rate. Recommend:      |
|     days · Green = healthy        |     order 10kg from Khumalo\'s    |
|                                   |     Wholesale (usual lead time 1  |
| -   Single-tap to create RFQ:     |     day).\"                       |
|     preferred supplier            |                                   |
|     pre-filled, recommended qty   | -   📉 \"You consistently         |
|     pre-calculated, delivery date |     overstock Castle Lager.       |
|     pre-set                       |     Average excess: 14 units per  |
|                                   |     order. Reduce reorder qty     |
| -   Batch reorder: select         |     from 48 to 36 --- save        |
|     multiple items for same       |     R1,260/month in working       |
|     supplier → one combined RFQ,  |     capital.\"                    |
|     reduces ordering admin        |                                   |
|                                   | -   🗓️ \"First December on Groway |
| -   Lead time countdown: \"Order  |     --- based on industry         |
|     by tomorrow 5pm to receive    |     patterns, expect 40--60%      |
|     before you run out\" ---      |     higher liquor demand.         |
|     specific date and time        |     Consider pre-ordering now     |
|                                   |     while stock is available.\"   |
| -   Reorder cost preview: total   |                                   |
|     cost of all recommended       | -   ⚠️ \"Three products           |
|     reorders across all SKUs      |     approaching expiry on 31      |
|     (cash flow awareness)         |     March. At current sales rate, |
|                                   |     34 units will be unsold.      |
| -   \"Skip this week\" option:    |     Suggest weekend special.\"    |
|     defer a recommendation with   |                                   |
|     one tap + optional reason     | -   🔄 \"Your bread sells 18%     |
|     note                          |     faster on Fridays. Your       |
|                                   |     Thursday afternoon reorder    |
| -   Auto-approved reorders: set   |     means you often run out by    |
|     trusted SKUs (e.g. daily milk |     Saturday morning. Switch to   |
|     delivery) to order            |     Wednesday reorder.\"          |
|     automatically without any     |                                   |
|     manual step                   | -   📊 \"Your Paracetamol 500mg   |
|                                   |     was out of stock 3 times last |
| -   GroCredit prompt: if reorder  |     month. Increase reorder point |
|     total exceeds available cash, |     from 20 to 35 units to cover  |
|     \"Finance this R45,000 order  |     weekends.\"                   |
|     with GroCredit --- from       |                                   |
|     R1,820/month\"                |                                   |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **09** ── **Recipe Engine & Bill of Materials**                       |
|                                                                       |
| *Gram-level ingredient deduction · Recipe costing · Menu engineering  |
| · BOM for production verticals*                                       |
|                                                                       |
| Benchmarked against Lightspeed Restaurant recipe costing --- extended |
| across all SA F&B sub-verticals                                       |
+-----------------------------------------------------------------------+

**9.1 Recipe System --- F&B Verticals**

For every Food & Beverage merchant, each menu item has a Recipe Card ---
the exact ingredients and quantities needed per portion. Every dish sold
deducts ingredient quantities (in grams, millilitres, or units) from
ingredient inventory using FIFO batch consumption. A R5 costing error
per dish × 200 covers per day × 365 days = R365,500 annual profit leak
--- which Groway\'s recipe engine eliminates.

  --------------- --------------------------- ----------------------------
  **Feature**     **Detail**                  **Vertical Application**

  Ingredient      Each menu item linked to    Restaurant, QSR, Bakery,
  linking         ingredient SKUs with        Catering, Shisa Nyama, Cloud
                  quantities in               Kitchen, Coffee Shop.
                  grams/ml/units per portion. 

  Gram-level      Quantities stored as        Critical for high-volume
  precision       DECIMAL(10,3). Round-off    kitchens. 10g of mozzarella
                  error on 1,000 portions is  per pizza × 150 pizzas/day =
                  \< 1 gram.                  1.5kg tracked precisely.

  Recipe cost     Cost = Σ(ingredient qty ×   GP% shown live on menu
  auto-calc       weighted average cost).     engineering dashboard.
                  Updates live when           Supplier price increase
                  ingredient cost changes.    immediately reflected.

  Yield factor    Meat/veg lose weight in     Critical for butchery,
                  preparation. Yield%         protein-heavy menus.
                  applied: 70% yield chicken  Ignoring yield creates
                  → system deducts raw weight 15--25% cost understating.
                  needed to produce yield     
                  weight.                     

  Prep batch mode Chef pre-preps 50 portions  High-volume restaurants,
                  in morning. Deducts         cloud kitchens, catering.
                  ingredients now, creates    Separates prep cost from
                  semi-finished stock. POS    service cost.
                  deducts semi-finished at    
                  service.                    

  Modifier        Each modifier (extra        QSR, cafés, burger joints.
  deductions      cheese, double patty, large Every modifier must be
                  size) has own ingredient    costed for accurate menu
                  additions. Modifier at POS  engineering.
                  → additional deduction      
                  triggered.                  

  Menu            4-quadrant: Stars (high GP, Restaurant managers see
  engineering     high volume) → promote.     exactly which dishes drive
  matrix          Plough Horses (high volume, or drain profit.
                  low GP) → reprice. Question 
                  Marks (low volume, high GP) 
                  → feature. Dogs → remove.   

  Theoretical vs  System calculates expected  JAX AI: \"Your actual food
  Actual          usage (theoretical) vs      cost is 34% vs theoretical
                  actual purchased. Variance  28% --- 6% unaccounted.
                  = waste, spillage, theft,   Investigate portion sizes at
                  or portion failure.         Station 2.\"
  --------------- --------------------------- ----------------------------

**9.2 Bill of Materials --- Production Verticals**

  ------------- ------------------------------- ---------------------------
  **BOM Step**  **Description**                 **Accounting Impact**

  Define BOM    Create Bill of Materials:       No immediate journal
                finished product + list of      impact.
                component raw materials +       
                quantities per production run.  
                Version-controlled.             

  Create Work   Initiate production run: select Work Order created ---
  Order         BOM, specify production         status: planned.
                quantity, assign to staff, set  
                scheduled date.                 

  Issue         Manager confirms raw materials  Dr Work-in-Progress (WIP),
  Materials     moved to production area.       Cr Raw Materials Inventory.
                Deducted from raw material      
                stock.                          

  Actual vs     Production manager records      Variance flagged. JAX AI
  Theoretical   actual quantities used (may     explains production
                differ from BOM due to wastage  efficiency.
                or over-runs).                  

  Production    Manager confirms goods          Dr Finished Goods
  Complete      produced. Specify actual yield  Inventory, Cr WIP. Variance
                (may differ from BOM if there   to Dr/Cr Production
                was wastage or recipe           Variance (P&L).
                variation).                     

  Quality Check Optional: QC inspection before  Rejected: Dr Write-off, Cr
                finished goods released to sale Finished Goods. QC pass:
                stock. Reject failed batches.   ready for sale.

  Release to    Finished goods available at     Finished Goods available.
  Stock         POS. Cost price = total BOM     Cost price set from actual
                actual cost ÷ units produced.   production run, not BOM
                                                standard cost.
  ------------- ------------------------------- ---------------------------

**9.3 Recipe Cost Card --- UI Specification**

+-----------------------------------+-----------------------------------+
| **Recipe Builder Screen**         | **Menu Engineering Dashboard**    |
|                                   |                                   |
| -   Menu item name + photo at top | -   4-quadrant matrix visual: all |
|                                   |     menu items plotted by GP%     |
| -   Ingredient list: search/add   |     (y-axis) vs volume sold       |
|     ingredient from inventory →   |     (x-axis)                      |
|     set quantity + unit (g / ml / |                                   |
|     unit)                         | -   Star items highlighted in     |
|                                   |     green --- most valuable       |
| -   Yield % field per ingredient  |     dishes, promote these first   |
|     (optional --- defaults to     |                                   |
|     100%)                         | -   Dog items highlighted in red  |
|                                   |     --- low GP, low volume ---    |
| -   Recipe cost auto-calculated   |     candidate for removal         |
|     and shown live as ingredients |                                   |
|     are added                     | -   Plough Horse items: high      |
|                                   |     volume but low GP --- these   |
| -   Selling price field with live |     need urgent repricing         |
|     GP% calculated: (Sell −       |                                   |
|     Recipe Cost) / Sell × 100     | -   \"Increase price by R10\"     |
|                                   |     simulation: shows impact on   |
| -   Target GP% marker: green if   |     GP% and estimated volume      |
|     above target, red if below.   |     impact                        |
|     Target configurable per       |                                   |
|     category.                     | -   \"Remove item\" impact: shows |
|                                   |     estimated revenue and GP      |
| -   Copy recipe: duplicate a      |     change if item removed from   |
|     recipe and tweak for variants |     menu                          |
|     (e.g. Chicken Burger → Vegan  |                                   |
|     Burger)                       | -   Category-level summary: food  |
|                                   |     vs beverage GP% comparison    |
| -   Version history: track recipe |                                   |
|     changes over time --- who     | -   Month-over-month comparison:  |
|     changed what and when         |     is GP% improving or declining |
|                                   |     per dish?                     |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| **10** ── **Vertical-Specific Inventory Modes**                       |
|                                                                       |
| *Same underlying engine --- 12 different UIs, defaults, compliance    |
| overlays, and SKU catalogues*                                         |
|                                                                       |
| 3,930+ pre-loaded SKUs across 12 verticals --- merchant starts        |
| selling in minutes, not days                                          |
+-----------------------------------------------------------------------+

**10.1 Vertical Capability Matrix**

  --------------------------- ------------------ ---------- ----------- ------------ ------------ ----------- -----------------
  **Vertical/Sub-Vertical**   **Inv Mode**       **FIFO**   **Batch**   **Expiry**   **Recipe**   **Scale**   **IMEI/Serial**

  **QSR / Fast Food**         Recipe-level       ✅         ✅          ✅           ✅           ---         ---

  **Sit-Down Restaurant**     Recipe + table     ✅         ✅          ✅           ✅           ---         ---

  **Shisa Nyama**             Weight + recipe    ✅         ✅          ✅           ✅           ✅          ---

  **Bakery**                  BOM + recipe       ✅         ✅          ✅           ✅           ---         ---

  **Coffee Shop**             Recipe-level       ---        ---         ---          ✅           ---         ---

  **Food Truck**              Simple count       ---        ---         ---          ✅           ---         ---

  **Cloud Kitchen**           Recipe + BOM       ✅         ✅          ✅           ✅           ---         ---

  **Superette/Grocery**       Barcode + PLU      ✅         ✅          ✅           ---          ✅          ---

  **Spaza Shop**              Simple count       ---        ---         ---          ---          ---         ---

  **Butchery**                Weight + batch     ✅         ✅          ✅           ---          ✅          ---

  **Liquor Store**            Case+bottle+keg    ✅         ✅          ✅           ---          ---         ---

  **Bar / Pub**               Measure track      ---        ✅          ---          ---          ---         ---

  **Nightclub**               Bar + wristband    ---        ---         ---          ---          ---         ---

  **Hair Salon**              Consumables/ml     ---        ---         ---          ---          ---         ---

  **Nail Salon**              Consumables/ml     ---        ---         ---          ---          ---         ---

  **Spa & Wellness**          Consumables/ml     ---        ✅          ---          ---          ---         ---

  **Full Pharmacy**           NAPPI+Schedule     ✅         ✅          ✅           ---          ---         ---

  **Health Shop (OTC)**       Standard+expiry    ✅         ✅          ✅           ---          ---         ---

  **Boutique Hotel**          F&B + amenities    ✅         ---         ✅           ✅           ---         ---

  **Guest House / B&B**       Simplified         ---        ---         ---          ---          ---         ---

  **Clothing Boutique**       Variant matrix     ---        ---         ---          ---          ---         ---

  **Footwear**                Variant+size run   ---        ---         ---          ---          ---         ---

  **Auto Workshop**           Parts+consumable   ---        ✅          ---          ---          ---         ✅

  **Laundry**                 Consumables        ---        ---         ---          ---          ---         ---

  **Funeral Home**            Package items      ---        ---         ---          ---          ---         ---

  **Gym / Fitness**           Retail + equip     ---        ---         ---          ---          ---         ---

  **Hardware Store**          Multi-bin+MOQ      ---        ✅          ---          ---          ---         ---

  **Electronics/Repair**      Parts + IMEI       ---        ✅          ---          ---          ---         ✅

  **Crèche / Daycare**        Consumables        ---        ---         ---          ---          ---         ---
  --------------------------- ------------------ ---------- ----------- ------------ ------------ ----------- -----------------

**10.2 Deep-Dive: Vertical Inventory Highlights**

+---+----------------------------------------------------------------------+
|   | **🏥 Pharmacy --- Most Complex Inventory in the Platform**           |
|   |                                                                      |
|   | -   Every medicine SKU carries a NAPPI code --- mandatory for SAHPRA |
|   |     compliance. 500+ NAPPI-coded SKUs pre-loaded on onboarding.      |
|   |                                                                      |
|   | -   Schedule classification (S0--S6) embedded in every medicine SKU. |
|   |     S5/S6 dispensing requires pharmacist biometric confirmation ---  |
|   |     hard block at POS.                                               |
|   |                                                                      |
|   | -   Controlled substances register: every S5/S6 unit received and    |
|   |     dispensed logged with pharmacist ID, date, patient reference.    |
|   |     SAHPRA audit-ready CSV export.                                   |
|   |                                                                      |
|   | -   Cold chain: fridge temperature logged every 4 hours via          |
|   |     connected sensor or manual entry. Alert if outside 2--8°C. HACCP |
|   |     compliance log auto-generated.                                   |
|   |                                                                      |
|   | -   Batch tracking mandatory: every medicine receive records batch   |
|   |     number, production date, and expiry date (minimum 12-month shelf |
|   |     life required for receive.                                       |
|   |                                                                      |
|   | -   Medical aid billing reconciliation: quantities dispensed vs      |
|   |     claims submitted are cross-checked daily to detect billing       |
|   |     discrepancies.                                                   |
|   |                                                                      |
|   | -   Recall instant response: SAHPRA recall quarantines all units     |
|   |     across all pharmacy merchants on the platform within 60 seconds. |
+---+----------------------------------------------------------------------+

+---+----------------------------------------------------------------------+
|   | **🍾 Liquor --- Excise Register + Case Management**                  |
|   |                                                                      |
|   | -   Two unit types per SKU: case (purchasing unit) and bottle/can    |
|   |     (selling unit). Unit conversion automatic at POS. E.g. case of   |
|   |     24 × 340ml → 24 individual units.                                |
|   |                                                                      |
|   | -   Keg management for bar/tavern: tracked in litres, converted to   |
|   |     pints/glasses/tots. Draught yield tracking --- actual yield vs   |
|   |     theoretical keg volume.                                          |
|   |                                                                      |
|   | -   SARS excise register: every case received = register entry       |
|   |     (date, batch, supplier, invoice, qty). Every unit sold deducted. |
|   |     Year-end closing balance verified against SARS return.           |
|   |                                                                      |
|   | -   Bottle deposit tracking: deposit charged on sale, refunded on    |
|   |     empty return. Net deposit liability tracked as balance sheet     |
|   |     creditor.                                                        |
|   |                                                                      |
|   | -   Trading hours enforcement: inventory cannot be sold outside      |
|   |     provincial hours --- POS hard-blocked. Prevents accidental       |
|   |     after-hours sales by staff.                                      |
|   |                                                                      |
|   | -   Vintage tracking for wine: each vintage is a separate SKU        |
|   |     variant. Same label, different year = different product with own |
|   |     batch and cost.                                                  |
+---+----------------------------------------------------------------------+

+---+----------------------------------------------------------------------+
|   | **👗 Fashion --- Variant Matrix + Laybye Lifecycle**                 |
|   |                                                                      |
|   | -   Variant matrix: Style × Size × Colour = three-dimensional        |
|   |     matrix. Each combination is an independently stockable SKU with  |
|   |     own barcode, stock count, and price.                             |
|   |                                                                      |
|   | -   Size run management: when Size M drops below reorder point, the  |
|   |     system recommends reordering the full size run --- not just M.   |
|   |     Prevents patchy size availability.                               |
|   |                                                                      |
|   | -   Open-to-buy planning: seasonal budget control. Actual stock      |
|   |     purchased vs OTB budget tracked. Prevents over-buying seasonal   |
|   |     ranges.                                                          |
|   |                                                                      |
|   | -   Display stock separation: showroom floor item marked as display  |
|   |     (not for sale). Back room holds sale stock. Prevents phantom     |
|   |     stock availability.                                              |
|   |                                                                      |
|   | -   Laybye lifecycle: item reserved in inventory at deposit payment. |
|   |     Cannot be sold to another customer. Released on full payment.    |
|   |     Cancelled laybye: stock re-enters available pool.                |
|   |                                                                      |
|   | -   SABS compliance flag: children\'s clothing must meet             |
|   |     flammability standards. Alert during import if SABS flag not     |
|   |     confirmed by merchant.                                           |
+---+----------------------------------------------------------------------+

+---+----------------------------------------------------------------------+
|   | **🔩 Hardware --- Multi-Bin, MOQ, Trade Accounts**                   |
|   |                                                                      |
|   | -   Multi-bin location management: same SKU can be stocked in        |
|   |     multiple warehouse locations (Bin A3, Bin F7, Showroom shelf).   |
|   |     System picks from correct bin and directs staff.                 |
|   |                                                                      |
|   | -   Minimum Order Quantities (MOQ): supplier-set MOQs enforced on    |
|   |     GroSupply reorders. PO cannot be submitted below MOQ.            |
|   |                                                                      |
|   | -   Trade account allocation: items reserved for specific trade      |
|   |     account customers (contractor pre-orders). Available stock vs    |
|   |     reserved stock separated in inventory view.                      |
|   |                                                                      |
|   | -   Cut-to-length products: pipe, cable, shade cloth, DPC sold by    |
|   |     metre. Scale-like interface: enter metres → system calculates    |
|   |     price and deducts from bulk reel/roll inventory.                 |
|   |                                                                      |
|   | -   B2B price lists: trade customers see trade_price_cents, not      |
|   |     retail selling_price_cents. Price list management per trade      |
|   |     account.                                                         |
|   |                                                                      |
|   | -   5,000+ hardware SKUs pre-loaded with barcodes, SABS compliance   |
|   |     flags, and reorder points configured for typical hardware store  |
|   |     velocity.                                                        |
+---+----------------------------------------------------------------------+

+---+----------------------------------------------------------------------+
|   | **📱 Electronics --- IMEI Register + Repair Parts**                  |
|   |                                                                      |
|   | -   Every handset (new or secondhand) receives its own inventory     |
|   |     record keyed to IMEI number. One IMEI = one SKU record. Quantity |
|   |     is always 1.                                                     |
|   |                                                                      |
|   | -   IMEI register: RICA compliance. Every new device sale records    |
|   |     IMEI + purchaser details. System logs can be exported for ICASA  |
|   |     compliance reporting.                                            |
|   |                                                                      |
|   | -   Secondhand device intake: intake form captures IMEI, condition   |
|   |     assessment, previous owner (if obtainable), and sets resale      |
|   |     price. Added to secondhand inventory category.                   |
|   |                                                                      |
|   | -   Repair parts inventory: managed as standard batch-tracked stock. |
|   |     Parts ordered from GroSupply directly from repair job card ---   |
|   |     demand-driven, not pre-planned.                                  |
|   |                                                                      |
|   | -   Warranty tracking: repair warranty (3 months standard) linked to |
|   |     IMEI. Consumer Protection Act compliance. Warranty start = job   |
|   |     card completed date.                                             |
|   |                                                                      |
|   | -   Stolen device check: IMEI lookup against industry stolen device  |
|   |     database (integration via ICASA API). Alert if device matches    |
|   |     stolen register before intake.                                   |
+---+----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **11** ── **Compliance-Driven Inventory Features**                    |
|                                                                       |
| *SAHPRA · SARS Excise · IMEI/RICA · Cold Chain · Allergen · BCEA ·    |
| Consumer Protection Act*                                              |
|                                                                       |
| South African regulatory requirements built into the inventory engine |
| --- not bolted on as an afterthought                                  |
+-----------------------------------------------------------------------+

**11.1 Compliance Module by Regulator**

  --------------- --------------------- ----------------------------------------
  **Regulator**   **Requirement**       **Groway Inventory Implementation**

  SAHPRA          Pharmacy controlled   S5/S6 register auto-maintained per
                  substances register.  dispense. Cold chain temperature log
                  Cold chain records.   (4-hourly). Batch records with supplier
                  Batch traceability.   reference. Recall quarantine within 60
                  Recall compliance.    seconds. PDF export for inspector.

  SARS            Excise register for   Excise register auto-maintained per sale
                  liquor: opening       and receive. Year-end closing stock
                  stock + received −    report matches LA30 format. Duty-paid
                  sold = closing stock. stock vs own-import distinction.
                  Matches SARS LA30     
                  return.               

  ICASA / RICA    IMEI register for all IMEI captured and stored on every
                  cellular devices sold handset SKU. Purchaser details linked
                  or repaired. SIM card per IMEI sale. Stolen device check on
                  registration at point intake. RICA SIM activation workflow.
                  of sale.              

  DoH / HACCP     Cold chain            Temperature log per fridge/freezer unit.
                  temperature records   Alert on breach. HACCP log export.
                  for food businesses   Supplier delivery temperature captured
                  (restaurants,         on GRN.
                  pharmacies,           
                  caterers).            

  Consumer        Product returns       Return workflow with purchase date
  Protection Act  accepted within 6     validation. 6-month warranty window
                  months of purchase    flagged at POS. Defective stock return
                  for latent defects.   to supplier workflow.
                  Warranty disclosure.  

  Food Safety Act Traceability of food  Batch and supplier traceability on all
  (Act 54)        products from         food items. Allergen flags on menu and
                  supplier to consumer. product record. Best-before / use-by
                  Allergen disclosure.  date tracking.
                  Date marking.         

  SABS            Safety mark           SABS compliance flag per SKU. Alert when
                  compliance for        importing/adding products that should
                  children\'s items,    carry SABS mark but flag is not
                  electrical products,  confirmed.
                  building materials.   

  NCR             Lay-bye arrangements: Laybye agreement auto-generated.
                  written agreement,    NCR-prescribed terms included. Deposit
                  10% deposit,          and instalment tracking. Cancellation
                  instalment schedule,  workflow with refund calculation.
                  right to cancel.      
  --------------- --------------------- ----------------------------------------

**11.2 Allergen Management --- R638 Compliance**

Regulation R638 (Regulations Governing General Hygiene Requirements for
Food Premises) and the Consumer Protection Act require food businesses
to disclose allergens. Groway\'s allergen system is built into the
product record and surfaces on the QR digital menu, the POS order
screen, and the KDS kitchen ticket.

  -------------- ------------- ------------------------ ----------------------------
  **Allergen**   **Flag Name** **Auto-Triggered Alert** **Displayed Where**

  Peanuts        nuts_peanut   High priority ---        Product record · QR digital
                               potentially              menu · KDS ticket (bold red)
                               life-threatening. Staff  · Receipt
                               alert on order if        
                               customer flags allergy.  

  Tree nuts      nuts_tree     High priority alert.     Product record · QR menu ·
                                                        KDS ticket

  Milk/Dairy     dairy         Medium priority.         Product record · QR menu ·
                                                        Recipe card · KDS

  Eggs           eggs          Medium priority.         Product record · QR menu

  Gluten/Wheat   gluten        Medium priority. Coeliac Product record · QR menu ·
                               disease relevance.       Recipe card

  Shellfish      shellfish     High priority.           Product record · QR menu ·
                                                        KDS

  Fish           fish          High priority.           Product record · QR menu

  Soya           soya          Low-medium priority.     Product record · QR menu

  Sesame         sesame        Medium priority.         Product record · QR menu

  Sulphites      sulphites     Medium. Relevant to      Product record · QR menu ·
                               wine, dried fruit,       Receipt for wine
                               processed meats.         

  Halal          halal         Not an allergen ---      QR menu badge · POS product
                               positive certification   detail · Online store
                               flag. Shown as badge on  listing
                               QR menu.                 

  Kosher         kosher        Positive certification   QR menu badge · POS product
                               flag.                    detail

  Vegan          vegan         Positive dietary flag.   QR menu filter · POS product
                                                        detail
  -------------- ------------- ------------------------ ----------------------------

+-----------------------------------------------------------------------+
| **12** ── **Shrinkage, Waste & Loss Control**                         |
|                                                                       |
| *Theft prevention · Breakage tracking · Food wastage · Variance KPIs  |
| · Staff accountability*                                               |
|                                                                       |
| South African retail loses an estimated 2--4% of revenue to shrinkage |
| annually --- Groway targets \< 0.5%                                   |
+-----------------------------------------------------------------------+

**12.1 Shrinkage Categories & Sources**

  ----------------- -------------- -------------------- ---------------------------
  **Category**      **SA           **Root Cause**       **Groway Detection Method**
                    Prevalence**                        

  Staff theft       Highest:       Items removed        Transaction monitoring:
  (internal)        40--50% of all without transaction. voids \> X/day per staff.
                    shrinkage      Price overrides.     Discounts \> Y% per staff.
                                   Void abuse.          Price overrides per
                                   Discounts to         cashier. Receipt
                                   friends.             reconciliation.

  Customer theft    30--35% of all Shoplifting. Barcode Stocktake variance per
  (external)        shrinkage      switching. Walkouts. category. Security tag
                                                        tracking
                                                        (fashion/electronics). CCTV
                                                        system integration note for
                                                        high-risk SKUs.

  Administrative    10--15% of all Scanning errors.     GRN 3-way match catches
  error             shrinkage      Wrong qty received.  receive errors. Movement
                                   Data entry mistakes. audit log surfaces
                                                        systematic
                                                        over/under-counting.
                                                        Stocktake reveals
                                                        cumulative admin errors.

  Vendor/supplier   5--10% of all  Short-delivered.     3-way match: PO vs GRN vs
  fraud             shrinkage      Inferior             Invoice. Weight
                                   substitutions.       verification at receive
                                   Invoice overcharge.  (butchery). Quality flags
                                                        on GRN.

  Food wastage (F&B Up to 8--12%   Overproduction.      Theoretical vs actual food
  specific)         of food cost   Expiry. Breakage.    cost variance. Daily waste
                                   Spillage.            log. Expiry write-off
                                                        journal. Production waste
                                                        tracking.

  Damage / breakage 2--5% of all   Handling damage.     Damage reason code on all
                    shrinkage      Storage damage.      adjustments. Receiving
                                   Transit damage.      quality flags on GRN. Trend
                                                        report per product
                                                        category.
  ----------------- -------------- -------------------- ---------------------------

**12.2 Shrinkage KPI Dashboard**

+-----------------------------------+-----------------------------------+
| **Shrinkage Metrics --- Owner     | **Loss Prevention Alerts**        |
| View**                            |                                   |
|                                   | -   Void abuse alert: cashier     |
| -   Shrinkage Rate %: (total      |     voids \> 3 transactions per   |
|     variance value ÷ total stock  |     shift --- manager notified    |
|     received value) × 100.        |     immediately.                  |
|     Target: \< 0.5%.              |                                   |
|                                   | -   Refund anomaly: refund        |
| -   Shrinkage by category: which  |     without matching purchase     |
|     product category is losing    |     receipt --- flagged for       |
|     the most. Spirits,            |     investigation.                |
|     cigarettes, and electronics   |                                   |
|     are typical leaders.          | -   Price override: cashier sells |
|                                   |     item below minimum price ---  |
| -   Shrinkage by branch: which    |     logged and flagged.           |
|     location has the highest      |                                   |
|     shrinkage rate --- identifies | -   Discount overuse: total       |
|     branch management issues.     |     discounts granted by staff    |
|                                   |     member \> daily threshold --- |
| -   Shrinkage by staff: which     |     alert to manager.             |
|     cashier has the highest void  |                                   |
|     rate, discount rate, or       | -   Out-of-hours movement: any    |
|     adjustment frequency.         |     stock adjustment outside      |
|     Configurable sensitivity.     |     trading hours --- security    |
|                                   |     flag.                         |
| -   Trend line: is shrinkage      |                                   |
|     improving or worsening        | -   No-scan sale: transaction     |
|     month-on-month?               |     completed without a single    |
|                                   |     barcode scan (could indicate  |
| -   Estimated annual shrinkage    |     manual key-in of cheaper      |
|     cost: projects current rate   |     items) --- flagged.           |
|     to annual R-value impact on   |                                   |
|     P&L.                          | -   \"Sweethearting\" detection:  |
|                                   |     same customer buying same     |
| -   Industry benchmark            |     items at below-usual price    |
|     comparison: JAX AI shows how  |     repeatedly from same cashier  |
|     your shrinkage rate compares  |     --- pattern alert.            |
|     to similar businesses on the  |                                   |
|     platform (anonymised).        | -   Stocktake variance            |
|                                   |     acceleration: if stocktake    |
| -   \"High-risk SKU\" watch list: |     variance for a SKU increases  |
|     items with most frequent or   |     more than 20% vs prior        |
|     highest-value variances ---   |     stocktake --- immediate       |
|     candidate for cycle count or  |     alert.                        |
|     security measures.            |                                   |
+-----------------------------------+-----------------------------------+

**12.3 Waste Management --- F&B Verticals**

  ------------------ --------------------- --------------- --------------------
  **Waste Type**     **Tracking Method**   **Accounting    **JAX AI Insight**
                                           Treatment**     

  Daily food waste   End-of-day waste log: Dr Food Wastage \"Your average daily
  (overproduction)   select items, record  Expense (P&L),  food waste is R340.
                     quantity wasted,      Cr Inventory    That is 8.5% of your
                     select reason         Asset.          daily food cost.
                     (overcooked / unsold                  Industry benchmark
                     / contaminated).                      for sit-down
                                                           restaurants is
                                                           4--5%. Recommend
                                                           reviewing your prep
                                                           batch quantities for
                                                           Tuesday.\"

  Expiry write-off   Auto-triggered on     Dr Wastage ---  \"Expiry write-offs
                     expiry date. Manager  Expired (P&L),  this month: R1,240
                     confirms destruction. Cr Inventory    across 14 products.
                     Reason = expired.     Asset.          Top offender: Fresh
                                                           cream (wrote off 8
                                                           times). Consider
                                                           reducing order qty
                                                           from 2L to 1L for
                                                           mid-week.\"

  Spillage /         Spot adjustment:      Dr Breakage /   \"You logged 3
  breakage           select item → adjust  Spillage (P&L), breakages of wine
                     down → reason =       Cr Inventory    bottles this month
                     spillage or breakage. Asset.          (R780). All from
                                                           same staff member.
                                                           Consider additional
                                                           handling training.\"

  Theoretical vs     System compares       Variance = Dr   \"Actual food cost
  actual variance    ingredients used per  Food Cost       this week was 36% vs
  (F&B)              recipe × dishes sold  Variance (P&L), theoretical 28%. The
                     (theoretical) vs      Cr Inventory.   8% gap (R4,200) is
                     actual stock movement Reconciled      unaccounted.
                     (actual).             monthly.        Possible causes:
                                                           portion
                                                           over-serving, staff
                                                           meals, wastage not
                                                           logged.\"
  ------------------ --------------------- --------------- --------------------

+-----------------------------------------------------------------------+
| **13** ── **Inventory Analytics & JAX AI Intelligence**               |
|                                                                       |
| *Stock velocity · Margin per SKU · Dead stock · Turnover ratio ·      |
| Natural language queries*                                             |
|                                                                       |
| TimescaleDB time-series engine + JAX AI agent --- turns raw stock     |
| data into business decisions                                          |
+-----------------------------------------------------------------------+

**13.1 Core Inventory Analytics Dashboard**

  --------------- ------------------ --------------------- ----------------
  **Metric**      **Definition**     **Why It Matters**    **Benchmark**

  Stock Turnover  COGS ÷ Average     How many times you    Grocery:
  Ratio           Inventory Value.   sell and replace your 12--26×/year.
                  Annualised.        entire inventory per  Fashion:
                                     year. Higher = better 4--6×/year.
                                     cash flow.            Pharmacy:
                                                           8--12×/year.
                                                           Hardware:
                                                           4--6×/year.

  Days Inventory  365 ÷ Stock        How many days of      Grocery: 14--30
  Outstanding     Turnover Ratio.    stock you\'re holding days. Restaurant
  (DIO)                              on average. Lower =   ingredients:
                                     less capital tied up  3--7 days.
                                     in stock.             Fashion: 60--90
                                                           days. Pharmacy:
                                                           30--45 days.

  Gross Margin    (Selling Price −   Which specific        Varies by
  per SKU         Cost Price) ÷      products are most     vertical.
                  Selling Price ×    profitable? Drive     Pharmacy OTC:
                  100.               focus to high-margin  30--45%. Grocery
                                     items.                staples: 8--15%.
                                                           Liquor: 20--35%.
                                                           Beauty services:
                                                           60--75%.

  Stockout Rate   \% of items that   Stockouts = lost      World class: \<
                  hit zero stock at  sales + customer      1%. Average SA
                  least once in a    dissatisfaction.      retail: 5--8%.
                  period.            Target near zero.     Groway target:
                                                           \< 2% within 6
                                                           months.

  Overstock Rate  \% of items with   Overstocking ties up  Groway target:
                  \> 90 days of      cash, increases       \< 10% of SKUs
                  supply on hand.    wastage risk, and     in overstock
                                     reduces stock         status at any
                                     turnover.             time.

  Dead Stock      Total cost value   Dead stock is money   Groway target:
  Value           of items with zero locked in unsold      \< 2% of total
                  sales in \> 90     goods. Needs action:  inventory value.
                  days.              discount, return, or  JAX AI alerts
                                     write-off.            when any SKU
                                                           hits 60 days
                                                           without a sale.

  Shrinkage Rate  (Total Variance    Theft, waste, admin   South African
                  Value ÷ Total      error. Every          retail average:
                  Received Value) ×  percentage point      2--4%. Groway
                  100.               costs real money.     platform target:
                                                           \< 0.5% for
                                                           merchants using
                                                           system fully.

  Weighted        Total cost of all  Used for COGS         Recalculated
  Average Cost    units ÷ Total      calculation and stock automatically on
                  units (across all  valuation on balance  every GRN
                  batches).          sheet. Critical for   receive. No
                                     P&L accuracy.         manual entry
                                                           required.
  --------------- ------------------ --------------------- ----------------

**13.2 Inventory Intelligence Screens**

+-----------------------------------+-----------------------------------+
| **Top Performers Dashboard**      | **Dead Stock & Overstock Alerts** |
|                                   |                                   |
| -   Top 20 SKUs by revenue this   | -   Dead stock list: all SKUs     |
|     period: rank by total sales   |     with zero sales in \> 60      |
|     value                         |     days, sorted by cost value    |
|                                   |                                   |
| -   Top 20 SKUs by gross margin:  | -   Overstock heatmap: products   |
|     rank by total GP rand value   |     with current stock \> 90-day  |
|     (not just %)                  |     supply shown in red           |
|                                   |                                   |
| -   Top 20 SKUs by volume sold:   | -   \"Take action\" suggestions   |
|     units moved --- popularity    |     per dead stock item:          |
|     ranking                       |     discount, transfer to busier  |
|                                   |     branch, return to supplier,   |
| -   Fast movers: SKUs with        |     bundle with a fast-mover,     |
|     velocity increasing \> 20% vs |     write-off                     |
|     previous period               |                                   |
|                                   | -   Dead stock ageing: 60 days /  |
| -   Slow movers: SKUs with        |     90 days / 120 days+ --- each  |
|     velocity decreasing \> 20% vs |     tier needs escalating action  |
|     previous period --- review    |                                   |
|     needed                        | -   Supplier return eligibility:  |
|                                   |     items still within supplier   |
| -   Rising stars: new SKUs added  |     return window flagged for     |
|     in last 30 days that are      |     return RFQ via GroSupply      |
|     outperforming category        |                                   |
|     average                       | -   Cash recovery estimate: if    |
|                                   |     all dead stock items          |
| -   Declining lines: SKUs with    |     discounted 30%, total cash    |
|     consistent 3-month revenue    |     recovered = R X               |
|     decline --- consider          |                                   |
|     discontinuing                 | -   Historical dead stock: did    |
|                                   |     this SKU sell before?         |
| -   \"One product family\"        |     Seasonal, or genuinely dead?  |
|     analysis: if a product has    |                                   |
|     many variants, which variants |                                   |
|     carry 80% of sales? (Pareto   |                                   |
|     within style)                 |                                   |
+-----------------------------------+-----------------------------------+

**13.3 JAX AI --- Natural Language Inventory Queries**

+---+---------------------------------------------------------------------+
| * | **Ask JAX Anything About Your Stock**                               |
| * |                                                                     |
| 💬 | Merchants can type plain-language questions to JAX AI and receive  |
| * | accurate answers drawn from live inventory data. JAX is available   |
| * | in all 11 official SA languages. It does not give generic advice    |
|   | --- every response is specific to that merchant\'s actual stock     |
|   | data.                                                               |
+---+---------------------------------------------------------------------+

  --------------------- ------------------------ --------------------------------------
  **Query Example**     **JAX Response Type**    **Data Source**

  \"What stock do I     Real-time stock levels   Current SOH + TimescaleDB weekend
  have enough of to     vs Friday/Saturday       velocity pattern
  last the weekend?\"   velocity forecast. Lists 
                        items at risk + those    
                        well-stocked.            

  \"Which products are  Top 10 products by GP    inventory_movements +
  making me the most    rand value this month.   product.cost_price_cents +
  money?\"              Shows revenue, cost,     transactions
                        GP%, and GP amount per   
                        item.                    

  \"What should I order Ranked reorder list:     Tier 3 JAX forecast engine + reorder
  this week?\"          items below par, items   points + GroSupply catalogue
                        JAX forecasts will run   
                        out, recommended         
                        quantities per item.     

  \"Why is my food cost Compares theoretical     Recipe engine vs GRN receive data vs
  so high this month?\" food cost (recipe ×      inventory movements
                        dishes sold) vs actual   
                        purchases. Highlights    
                        biggest variances by     
                        ingredient.              

  \"What is my current  Total inventory asset    inventory_batches.quantity_available ×
  stock worth?\"        value at weighted        cost_price_cents
                        average cost. Split by   
                        category, by location,   
                        by vertical.             

  \"Which products      Dead stock list with     inventory_movements: no
  haven\'t sold in 30   cost value, days since   movement_type=POS_sale in window
  days?\"               last sale, and suggested 
                        action per item.         

  \"How much did I lose Total write-off value    inventory_movements WHERE reason_code
  to expired stock last from expiry reason       = expired, last 30 days
  month?\"              codes. Breakdown by      
                        product category.        

  \"Am I ordering too   Overstock report: items  SOH ÷ daily velocity vs threshold
  much of anything?\"   with \> 90-day supply.   
                        Estimated overstock      
                        value. Cost of capital   
                        tied up.                 

  \"Ke nna le stock e   Groway responds in       Multi-language NLP: isiZulu, Sesotho,
  kae ya bogobe?\"      Sesotho with exact stock Afrikaans, Zulu, Tswana, Xhosa + 5
  (Sesotho --- \"How    level, days of supply,   others
  much pap stock do I   and reorder              
  have?\")              recommendation.          
  --------------------- ------------------------ --------------------------------------

+-----------------------------------------------------------------------+
| **14** ── **GroSupply Integration --- End-to-End Procurement**        |
|                                                                       |
| *Auto-RFQ · PO lifecycle · Mobile GRN · 3-Way Match · GroSettle ·     |
| Smart Reorder ML*                                                     |
|                                                                       |
| Inventory Service (3005) and GroSupply Service (3040) are deeply      |
| integrated via Kafka events                                           |
+-----------------------------------------------------------------------+

**14.1 Inventory → GroSupply Trigger Events**

  ---------------- --------------------------- --------------------- -------------------
  **Inventory      **Kafka Topic**             **GroSupply           **Merchant
  Event**                                      Reaction**            Experience**

  Stock falls to   inventory.low_stock         GroSupply             Push notification:
  reorder point                                auto-creates a draft  \"Stock alert:
                                               RFQ pre-filled with:  Castle Lager 330ml
                                               SKU, preferred        --- 12 units
                                               supplier, recommended remaining. Draft
                                               qty from JAX AI,      RFQ created. Tap to
                                               delivery date =       review and send.\"
                                               today +               
                                               lead_time_days.       

  Stock hits zero  inventory.stockout          If draft RFQ not yet  Red alert dashboard
                                               sent: escalates to    banner. SMS to
                                               urgent notification.  Owner: \"URGENT:
                                               Preferred supplier    You have run out of
                                               notified directly if  \[product\]. Order
                                               merchant has          now.\"
                                               auto-order enabled.   

  JAX AI forecast  inventory.forecast_alert    GroSupply creates     JAX card on
  alert (5-day)                                advisory RFQ with     dashboard: \"Based
                                               JAX-calculated        on current sales,
                                               quantities. Flagged   you\'ll run out of
                                               as \"Forecast ---     \[product\] in 4
                                               Review Before         days. Review this
                                               Sending.\"            RFQ?\"

  GRN completed    grosupply.grn.completed     Inventory Service     Stock levels update
  (GroSupply)                                  updates stock_on_hand live. GRN receipt
                                               for each received     printable.
                                               SKU. Batch records    Accounting journal
                                               created. Accounting   auto-created.
                                               Service notified.     

  3-Way Match      grosupply.invoice.matched   Accounts Payable      Dashboard:
  completed                                    payable created.      \"Invoice matched
                                               GroSettle payment     for \[Supplier\]
                                               becomes eligible.     --- R23,400.
                                               Merchant can choose   Choose: Pay now
                                               settlement terms.     (0.5% fee) or
                                                                     Net-30 (free).\"

  Recall initiated inventory.recalled          GroSupply creates     All affected
  (admin)                                      return RFQ to         merchants notified
                                               supplier for recalled simultaneously.
                                               batch. Dispute record Return/destroy
                                               auto-created if       instructions sent.
                                               recall is supplier    
                                               responsibility.       
  ---------------- --------------------------- --------------------- -------------------

**14.2 Full Procurement Lifecycle**

  -------------- -------------------- --------------------- -----------------
  **Stage**      **Duration**         **System State**      **Key Groway
                                                            Feature**

  1\. Reorder    Instant              inventory.low_stock   Automatic --- no
  Trigger                             event published       manual monitoring
                                                            needed. JAX AI
                                                            calculates
                                                            quantities.

  2\. Draft RFQ  Merchant\'s pace     RFQ status: draft     Pre-filled with
  Review         (typically same day)                       preferred
                                                            supplier,
                                                            JAX-recommended
                                                            qty, delivery
                                                            date. Merchant
                                                            reviews, adjusts,
                                                            sends.

  3\. RFQ →      48-hour quoting      RFQ status:           GroSupply routes
  Suppliers      window               sent_to_suppliers     to all eligible
                                                            verified
                                                            suppliers in
                                                            merchant\'s
                                                            vertical. B-BBEE
                                                            filter optional.

  4\. Quote      Merchant reviews     Quotes received,      Auto-ranked:
  Comparison     when ready           status: comparing     lowest total
                                                            cost, shortest
                                                            lead time,
                                                            highest supplier
                                                            performance
                                                            score, B-BBEE
                                                            tier.

  5\. Purchase   Instant on accept    PO status: issued     PO auto-generated
  Order                                                     with merchant
                                                            details, delivery
                                                            address, payment
                                                            terms. PDF
                                                            dispatched to
                                                            supplier.

  6\. Dispatch & Supplier-dependent   PO status: in_transit Supplier confirms
  Delivery       (1--5 days                                 dispatch.
                 typically)                                 GroDeliver
                                                            tracking number
                                                            attached if
                                                            courier delivery.

  7\. GRN        At delivery ---      GRN status:           Merchant scans
  Processing     5--15 min            in_progress →         items with mobile
                                      completed             app. Batch
                                                            details captured.
                                                            Variances
                                                            flagged. Manager
                                                            confirms.

  8\. 3-Way      Automatic on GRN +   Match status: matched System compares
  Invoice Match  Invoice receipt      or review_queue       PO quantities and
                                                            prices vs GRN vs
                                                            supplier invoice.
                                                            Variance \> 5% →
                                                            review queue.

  9\. Accounting Automatic on match   Journal posted        Dr
  Auto-Journal   approval                                   Purchases/Stock
                                                            (COGS), Cr
                                                            Accounts Payable.
                                                            Zero manual
                                                            journal entry
                                                            required.

  10\. GroSettle Merchant chooses     Payment status:       Instant (same
  Payment        timing               scheduled /           day, 1.5--2.5%
                                      processing            fee) · Net-30
                                                            (free) · Net-60
                                                            (free) · Dynamic
                                                            discount
                                                            (supplier offers
                                                            early-pay
                                                            discount).
  -------------- -------------------- --------------------- -----------------

+-----------------------------------------------------------------------+
| **15** ── **API Reference --- Inventory Service Complete Catalogue**  |
|                                                                       |
| *Inventory Service (Port 3005) · All endpoints · JWT auth required ·  |
| merchant_id on every request*                                         |
|                                                                       |
| GET = green · POST = blue · PUT = amber · DELETE = red · PATCH =      |
| purple                                                                |
+-----------------------------------------------------------------------+

**15.1 Product Management**

  ------------ ----------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                              **Description**

  **GET**      /v1/inventory/products                    List all products for merchant. Params:
                                                         category, vertical_context, status, search,
                                                         page, per_page, sort_by.

  **POST**     /v1/inventory/products                    Create new product/parent record. Returns
                                                         product_id.

  **GET**      /v1/inventory/products/:id                Get product detail including all variants,
                                                         current SOH per location, batch summary.

  **PUT**      /v1/inventory/products/:id                Update product details: name, description,
                                                         category, photos, compliance flags,
                                                         settings.

  **DELETE**   /v1/inventory/products/:id                Soft-delete (archive) product. Sets
                                                         archived_at. Historical data preserved.

  **POST**     /v1/inventory/products/import             Bulk import products from CSV. Returns:
                                                         import_id, valid_count, error_count,
                                                         error_rows.

  **GET**      /v1/inventory/products/import/:importId   Poll import job status. Returns progress %
                                                         and row-level errors.

  **POST**     /v1/inventory/products/:id/duplicate      Duplicate a product record. Useful for
                                                         similar products. Returns new product_id.

  **GET**      /v1/inventory/products/search             Full-text search via OpenSearch. Params: q,
                                                         vertical_context, category, in_stock_only.
  ------------ ----------------------------------------- -------------------------------------------

**15.2 Variant Management**

  ------------ -------------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                                 **Description**

  **GET**      /v1/inventory/products/:id/variants          List all variants for a product with SOH
                                                            per location.

  **POST**     /v1/inventory/products/:id/variants          Create new variant (size, colour, etc.).
                                                            Assigns barcode if not provided.

  **PUT**      /v1/inventory/products/:id/variants/:vid     Update variant: barcode, prices, cost,
                                                            compliance flags, reorder settings.

  **DELETE**   /v1/inventory/products/:id/variants/:vid     Soft-delete variant. Only allowed if
                                                            variant has zero SOH.

  **POST**     /v1/inventory/products/:id/variants/matrix   Bulk-create full variant matrix from
                                                            attribute arrays. E.g. {sizes:\[S,M,L\],
                                                            colours:\[red,blue\]} creates 6 variants.

  **GET**      /v1/inventory/variants/barcode/:barcode      Look up variant by barcode. Used by POS
                                                            scanner. Returns product details + SOH +
                                                            price.

  **GET**      /v1/inventory/variants/nappi/:nappiCode      Look up pharmaceutical product by NAPPI
                                                            code. Pharmacy vertical only.

  **GET**      /v1/inventory/variants/imei/:imei            Look up device by IMEI. Returns product
                                                            details + sale status + warranty info.
                                                            Electronics vertical.
  ------------ -------------------------------------------- -------------------------------------------

**15.3 Stock Levels & Movements**

  ------------ -------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                           **Description**

  **GET**      /v1/inventory/stock                    Current stock-on-hand for all variants.
                                                      Filter by: location_id, category,
                                                      below_reorder, out_of_stock.

  **GET**      /v1/inventory/stock/:variantId         SOH for specific variant across all
                                                      locations. Returns batch breakdown.

  **POST**     /v1/inventory/adjustments              Manual stock adjustment (add or remove).
                                                      Required fields: variant_id, location_id,
                                                      quantity, direction, reason_code.

  **GET**      /v1/inventory/movements                Stock movement log. Filter: variant_id,
                                                      location_id, movement_type, date_from,
                                                      date_to, performed_by.

  **GET**      /v1/inventory/movements/:movementId    Detail of a single movement record.
                                                      Includes all audit fields.

  **POST**     /v1/inventory/transfers                Initiate inter-location transfer. Fields:
                                                      variant_id, from_location, to_location,
                                                      quantity.

  **PUT**      /v1/inventory/transfers/:id/dispatch   Source confirms items dispatched.

  **PUT**      /v1/inventory/transfers/:id/receive    Destination confirms receipt. Partial
                                                      receive allowed with variance note.

  **GET**      /v1/inventory/transfers                List all transfers. Filter by: status,
                                                      location, date range.
  ------------ -------------------------------------- -------------------------------------------

**15.4 GRN & Receiving**

  ------------ ------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                          **Description**

  **POST**     /v1/inventory/grn                     Create new GRN. Optional: link to GroSupply
                                                     PO via purchase_order_id.

  **GET**      /v1/inventory/grn                     List GRNs. Filter: status, location,
                                                     supplier, date range.

  **GET**      /v1/inventory/grn/:id                 GRN detail: all line items, quantities,
                                                     batch details, variances, approval status.

  **PUT**      /v1/inventory/grn/:id                 Update GRN: add line items, update
                                                     quantities, capture batch details. Only
                                                     while status = draft.

  **POST**     /v1/inventory/grn/:id/lines           Add line item to GRN: variant_id,
                                                     qty_received, batch_number, expiry_date,
                                                     cost_price_cents.

  **PUT**      /v1/inventory/grn/:id/lines/:lineId   Update GRN line: adjust qty, add batch
                                                     info, flag as rejected.

  **POST**     /v1/inventory/grn/:id/complete        Complete GRN. Manager auth required.
                                                     Updates inventory, creates batch records,
                                                     publishes Kafka event.

  **GET**      /v1/inventory/grn/:id/variance        GRN variance report: expected vs received
                                                     per line. Used for GroSupply dispute
                                                     initiation.
  ------------ ------------------------------------- -------------------------------------------

**15.5 Batch Tracking & Expiry**

  ------------ -------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                           **Description**

  **GET**      /v1/inventory/batches                  List batches. Filter: product, location,
                                                      status
                                                      (active/near_expiry/expired/recalled),
                                                      expiry_before.

  **GET**      /v1/inventory/batches/:id              Batch detail: full history from receive
                                                      through every deduction to current qty.

  **PUT**      /v1/inventory/batches/:id              Update batch: correct expiry date, batch
                                                      number (pre-complete only), add notes.

  **POST**     /v1/inventory/batches/:id/quarantine   Quarantine a batch. Quality hold. Requires
                                                      reason and manager auth.

  **POST**     /v1/inventory/batches/:id/writeoff     Write off a batch (expired, recalled,
                                                      damaged beyond use). Requires reason +
                                                      manager auth.

  **GET**      /v1/inventory/expiring                 Expiry report: all batches expiring within
                                                      X days. Params: days (default 30),
                                                      category, location.

  **POST**     /v1/inventory/recall                   Initiate recall for a batch or batch
                                                      number. Platform-wide if admin-initiated.
                                                      Merchant-scoped if merchant-initiated.

  **GET**      /v1/inventory/recall/:id               Recall record: which batches, which
                                                      merchants, resolution status per merchant.

  **PUT**      /v1/inventory/recall/:id/resolve       Merchant resolves recall: action =
                                                      destroyed \| returned_to_supplier. Records
                                                      destruction log.
  ------------ -------------------------------------- -------------------------------------------

**15.6 Stocktake**

  ------------ -------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                           **Description**

  **POST**     /v1/inventory/stocktake                Create new stocktake. Fields: type
                                                      (full/cycle/category/spot), location_id,
                                                      category_ids (for cycle/category),
                                                      assigned_to.

  **GET**      /v1/inventory/stocktake                List stocktakes. Filter: status, location,
                                                      type, date range.

  **GET**      /v1/inventory/stocktake/:id            Stocktake detail: items to count, count
                                                      entries submitted, variance report (if
                                                      completed).

  **POST**     /v1/inventory/stocktake/:id/count      Submit count entries. Array of {variant_id,
                                                      location_id, counted_qty}. Blind --- no
                                                      system qty returned at this stage.

  **GET**      /v1/inventory/stocktake/:id/variance   Variance report: system qty vs counted qty
                                                      per item. Only available after count
                                                      submitted.

  **POST**     /v1/inventory/stocktake/:id/approve    Manager approves variance items. Fields:
                                                      approved_lines\[\], recount_lines\[\].
                                                      Requires manager PIN.

  **POST**     /v1/inventory/stocktake/:id/commit     Commit approved variances to inventory.
                                                      Updates SOH. Creates accounting journal
                                                      entries. Owner auth required.

  **GET**      /v1/inventory/stocktake/:id/report     Download stocktake report as PDF. Includes
                                                      signature fields, all line items,
                                                      variances, approvals.
  ------------ -------------------------------------- -------------------------------------------

**15.7 Reorder & Smart Replenishment**

  ------------ --------------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                                  **Description**

  **GET**      /v1/inventory/reorder-alerts                  Items below reorder point across all
                                                             locations. Sorted by urgency. Returns:
                                                             variant, SOH, reorder_point, suggested_qty,
                                                             preferred_supplier.

  **GET**      /v1/inventory/reorder-alerts/forecast         JAX AI forecast alerts: items predicted to
                                                             stock out in next 5 days. Includes
                                                             confidence score and reasoning narrative.

  **POST**     /v1/inventory/reorder-alerts/create-rfq       Convert reorder alerts to GroSupply RFQ.
                                                             Body: alert_ids\[\], supplier_id. Returns
                                                             rfq_id.

  **PUT**      /v1/inventory/products/:id/reorder-settings   Update reorder settings: reorder_point,
                                                             reorder_qty, par_level, lead_time_days,
                                                             preferred_supplier_id, auto_order.

  **GET**      /v1/inventory/velocity/:variantId             Sales velocity for a variant: daily
                                                             average, 7-day, 30-day, 90-day, day-of-week
                                                             breakdown.

  **GET**      /v1/inventory/forecast/:variantId             JAX AI demand forecast: next 14-day
                                                             predicted demand, confidence interval,
                                                             reasoning narrative.
  ------------ --------------------------------------------- -------------------------------------------

**15.8 Recipe & Bill of Materials**

  ------------ ---------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                             **Description**

  **GET**      /v1/inventory/recipes                    List all recipes for merchant. Filter by:
                                                        menu_item_id, category.

  **POST**     /v1/inventory/recipes                    Create recipe: menu_item_id + array of
                                                        {ingredient_variant_id, quantity_grams,
                                                        yield_pct}.

  **GET**      /v1/inventory/recipes/:id                Recipe detail: ingredients, cost breakdown,
                                                        GP% at current cost prices.

  **PUT**      /v1/inventory/recipes/:id                Update recipe: change ingredients,
                                                        quantities, yield factors.

  **GET**      /v1/inventory/recipes/:id/cost           Live recipe cost calculation: current
                                                        weighted average costs for all ingredients.

  **GET**      /v1/inventory/menu-engineering           Menu engineering matrix: all menu items
                                                        with GP%, volume sold, 4-quadrant
                                                        classification.

  **GET**      /v1/inventory/theoretical-vs-actual      Theoretical vs actual food cost report for
                                                        period. Variance per ingredient.

  **POST**     /v1/inventory/bom                        Create Bill of Materials:
                                                        finished_product_id + components with
                                                        quantities.

  **POST**     /v1/inventory/bom/:id/work-order         Create production work order from BOM:
                                                        quantity to produce, scheduled date.

  **POST**     /v1/inventory/work-orders/:id/complete   Complete work order: record actual
                                                        quantities produced. Triggers stock update.
  ------------ ---------------------------------------- -------------------------------------------

**15.9 Analytics & Reporting**

  ------------ ------------------------------------ -------------------------------------------
  **Method**   **Endpoint**                         **Description**

  **GET**      /v1/inventory/analytics/summary      Inventory health summary: total SKUs, total
                                                    value, stockout count, overstock count,
                                                    shrinkage rate.

  **GET**      /v1/inventory/analytics/velocity     Stock velocity report: fastest/slowest
                                                    movers by qty and by revenue value.

  **GET**      /v1/inventory/analytics/dead-stock   Dead stock report: items with no sales in X
                                                    days. Params: days (default 60). Returns
                                                    cost value at risk.

  **GET**      /v1/inventory/analytics/turnover     Stock turnover ratio by category and
                                                    overall. Annualised. Benchmark comparison
                                                    shown.

  **GET**      /v1/inventory/analytics/margin       Margin per SKU: selling price, cost price,
                                                    GP%, GP rand value. Sortable.

  **GET**      /v1/inventory/shrinkage              Shrinkage report: total variance value,
                                                    variance by category, by staff, by
                                                    location. Date range filter.

  **GET**      /v1/inventory/analytics/overstock    Overstock report: items with \> 90-day
                                                    supply. Cash value tied up.
                                                    Recommendations.

  **POST**     /v1/inventory/jax/query              JAX AI natural language query. Body:
                                                    {query: \"What should I order this week?\",
                                                    language: \"en/zu/st/af\"}. Returns
                                                    narrative + structured data.
  ------------ ------------------------------------ -------------------------------------------

**15.10 Compliance Endpoints**

  ------------ ----------------------------------------------- -------------------------------------------
  **Method**   **Endpoint**                                    **Description**

  **GET**      /v1/inventory/compliance/excise-register        SARS excise stock register. Params:
                                                               date_from, date_to. Export as PDF or CSV.
                                                               Liquor vertical only.

  **GET**      /v1/inventory/compliance/controlled-register    SAHPRA S5/S6 controlled substances
                                                               register. Pharmacy vertical only. PDF
                                                               export for inspector.

  **GET**      /v1/inventory/compliance/cold-chain/:fridgeId   Cold chain temperature log for specified
                                                               fridge. Alert history. HACCP format export.

  **POST**     /v1/inventory/compliance/cold-chain/:fridgeId   Log temperature reading:
                                                               {temperature_celsius, logged_at, method:
                                                               manual\|sensor}.

  **GET**      /v1/inventory/compliance/imei                   IMEI register export. All devices
                                                               sold/repaired with IMEI, purchaser, date.
                                                               Electronics vertical.

  **GET**      /v1/inventory/compliance/allergens/:variantId   Allergen profile for a product. Used by QR
                                                               menu and KDS ticket.

  **GET**      /v1/inventory/compliance/licence-expiry         All compliance licences approaching expiry.
                                                               Returns: licence type, number, expiry date,
                                                               days remaining.
  ------------ ----------------------------------------------- -------------------------------------------

+-----------------------------------------------------------------------+
| **16** ── **Database Schema --- Complete Inventory Tables**           |
|                                                                       |
| *PostgreSQL 15 · Row-Level Security · BIGINT cents for all money ·    |
| Soft deletes · UUID primary keys*                                     |
|                                                                       |
| Every table has: merchant_id (RLS), created_at, updated_at, and soft  |
| delete where applicable                                               |
+-----------------------------------------------------------------------+

**16.1 products --- Parent Product Record**

  ---------------------- --------------- ---------------- ------------------------------------------------
  **Column**             **Data Type**   **Constraint**   **Purpose & Notes**

  **product_id**         UUID            PK DEFAULT       Immutable identifier. Referenced by all variant
                                         uuid()           and recipe records.

  **merchant_id**        UUID            NOT NULL FK +    Multi-tenant isolation via PostgreSQL Row-Level
                                         RLS              Security policy.

  **vertical_context**   VARCHAR(40)     NOT NULL         Vertical:
                                                          restaurant\|grocery\|pharmacy\|liquor\|fashion
                                                          etc. Drives UI, compliance, VAT treatment.

  **name**               VARCHAR(200)    NOT NULL         Display name at POS, QR menu, and online store.

  **description**        TEXT            NULLABLE         Rich description for QR menu and online store.
                                                          Markdown supported.

  **brand**              VARCHAR(100)    NULLABLE         Brand name. Indexed for brand-level reporting.

  **category_id**        UUID            FK → categories  Three-level category tree: Department → Category
                                                          → Sub-category.

  **photos**             JSONB           DEFAULT \[\]     \[{url, position, alt_text, is_hero}\] S3 URLs.
                                                          First image = hero.

  **track_stock**        BOOLEAN         DEFAULT true     FALSE for pure services (massage, haircut) ---
                                                          no inventory deduction.

  **allow_negative**     BOOLEAN         DEFAULT false    Allow SOH to go negative. Only enable for
                                                          specific use cases (bar consumables).

  **unit_of_measure**    VARCHAR(20)     DEFAULT each     each \| kg \| g \| litre \| ml \| metre \| pair
                                                          \| dozen --- affects display and recipe qty
                                                          units.

  **weight_grams**       DECIMAL(10,2)   NULLABLE         Product weight. Used for shipping calculations
                                                          and recipe costing reference.

  **age_restricted**     BOOLEAN         DEFAULT false    TRUE for liquor, tobacco. Triggers age
                                                          verification prompt at POS.

  **halal_certified**    BOOLEAN         DEFAULT false    Displayed as badge on QR menu. Influences offer
                                                          targeting.

  **allergens**          TEXT\[\]        DEFAULT {}       Array: nuts_peanut, dairy, gluten, eggs, fish,
                                                          shellfish, soya, sesame, sulphites.

  **archived_at**        TIMESTAMP       NULLABLE         Soft delete. Archived products excluded from POS
                                                          and reports unless explicitly requested.

  **created_at**         TIMESTAMP       NOT NULL DEFAULT Record creation timestamp. Immutable after
                                         now()            insert.

  **updated_at**         TIMESTAMP       NOT NULL DEFAULT Auto-updated by trigger on every row
                                         now()            modification.
  ---------------------- --------------- ---------------- ------------------------------------------------

**16.2 product_variants --- Stockable SKU Units**

  ------------------------- ------------- ---------------- ------------------------------
  **Column**                **Data Type** **Constraint**   **Purpose & Notes**

  **variant_id**            UUID          PK DEFAULT       Each size/colour/format
                                          uuid()           combination is its own
                                                           variant. One inventory record
                                                           per variant.

  **product_id**            UUID          FK → products    Parent product. Cascade delete
                                          NOT NULL         archives variant if product
                                                           archived.

  **merchant_id**           UUID          NOT NULL FK +    Denormalised for RLS query
                                          RLS              performance. Always matches
                                                           parent product.merchant_id.

  **barcode**               VARCHAR(50)   NULLABLE UNIQUE  EAN-13, EAN-8, UPC-A, or
                                                           custom. NULL for variants
                                                           without a barcode (rare).

  **internal_sku**          VARCHAR(80)   NULLABLE         Merchant\'s own code system.
                                                           Not unique globally --- unique
                                                           per merchant_id.

  **supplier_code**         VARCHAR(80)   NULLABLE         Supplier\'s product reference.
                                                           Used in GroSupply PO matching.

  **nappi_code**            VARCHAR(20)   NULLABLE UNIQUE  National Article Product Price
                                                           Index. SAHPRA mandatory for
                                                           all medicines.

  **imei_number**           VARCHAR(20)   NULLABLE UNIQUE  IMEI for cellular devices. One
                                                           variant per device (qty always
                                                           1 for IMEI-tracked items).

  **variant_attributes**    JSONB         DEFAULT {}       {size: \"M\", colour:
                                                           \"Navy\", material:
                                                           \"Cotton\"} --- unlimited
                                                           attribute dimensions.

  **cost_price_cents**      BIGINT        NOT NULL DEFAULT Weighted average cost. BIGINT
                                          0                cents --- never DECIMAL.
                                                           Updated on each GRN receive.

  **selling_price_cents**   BIGINT        NOT NULL DEFAULT Base selling price.
                                          0                VAT-inclusive (SA standard).
                                                           Updated by merchant from
                                                           Merchant OS.

  **min_price_cents**       BIGINT        NULLABLE         Floor price. POS blocks sale
                                                           below this price. Prevents
                                                           unauthorised discounting.

  **trade_price_cents**     BIGINT        NULLABLE         B2B price for trade account
                                                           customers (hardware,
                                                           wholesale).

  **vat_treatment**         VARCHAR(20)   DEFAULT          standard_15 \| zero_rated \|
                                          standard_15      exempt \| out_of_scope. Drives
                                                           VAT split on every
                                                           transaction.

  **schedule_class**        SMALLINT      NULLABLE 0-6     Pharmacy only: SAHPRA drug
                                                           schedule 0--6. Null for
                                                           non-pharmaceutical products.

  **reorder_point**         INTEGER       DEFAULT 0        Tier 1/2 reorder trigger
                                                           threshold. When SOH ≤ this:
                                                           alert + optional auto-RFQ.

  **reorder_qty**           INTEGER       DEFAULT 0        Tier 1 reorder: fixed quantity
                                                           to order each time. Tier 2
                                                           uses par_level instead.

  **par_level**             INTEGER       NULLABLE         Tier 2: ideal stock level.
                                                           Reorder qty = par_level −
                                                           current_soh.

  **lead_time_days**        INTEGER       DEFAULT 1        Expected supplier delivery
                                                           time. Used in reorder timing
                                                           and JAX AI forecast buffer.

  **storage_conditions**    VARCHAR(30)   DEFAULT ambient  ambient \| refrigerated_2_8 \|
                                                           frozen\_-18 \| controlled.
                                                           Triggers cold chain
                                                           compliance.

  **batch_tracking**        BOOLEAN       DEFAULT false    TRUE for: pharmacy, food with
                                                           expiry, chemicals, wine.
                                                           Enables batch capture on GRN.

  **expiry_tracking**       BOOLEAN       DEFAULT false    TRUE enables expiry alert
                                                           system. Independent from
                                                           batch_tracking (can have one
                                                           without other).

  **shelf_life_days**       INTEGER       NULLABLE         From production/manufacture
                                                           date to expiry. Used to
                                                           validate receives (reject if
                                                           near end of life).
  ------------------------- ------------- ---------------- ------------------------------

**16.3 inventory_batches --- Batch & FIFO Records**

  ----------------------- -------------- ---------------- ------------------------------
  **Column**              **Data Type**  **Constraint**   **Purpose & Notes**

  **batch_id**            UUID           PK DEFAULT       Unique batch record.
                                         uuid()           Referenced by every movement
                                                          that consumes from this batch.

  **variant_id**          UUID           FK NOT NULL      Which SKU this batch belongs
                                                          to.

  **location_id**         UUID           FK NOT NULL      Where this batch is physically
                                                          stored. Each location has its
                                                          own batch record.

  **batch_number**        VARCHAR(100)   NULLABLE         Supplier batch/lot number.
                                                          Mandatory: pharmacy, food,
                                                          chemicals. Used for recall
                                                          identification.

  **received_date**       DATE           NOT NULL         Date GRN completed. Primary
                                                          FIFO key --- oldest
                                                          received_date consumed first.

  **production_date**     DATE           NULLABLE         Manufacturing date. Used with
                                                          shelf_life_days to verify
                                                          expiry.

  **expiry_date**         DATE           NULLABLE         Expiry date. Indexed for
                                                          expiry report performance.
                                                          NULL = non-perishable.

  **qty_received**        INTEGER        NOT NULL         Original quantity on receipt.

  **qty_available**       INTEGER        NOT NULL         Current remaining quantity.
                                                          Updated atomically on every
                                                          deduction. Never negative.

  **cost_price_cents**    BIGINT         NOT NULL         Unit cost at time of receipt.
                                                          Never retroactively updated.
                                                          Historical cost accuracy.

  **status**              VARCHAR(20)    DEFAULT active   active \| near_expiry \|
                                                          expired \| recalled \|
                                                          quarantined \| depleted.
                                                          Drives alerts and POS
                                                          blocking.

  **grn_id**              UUID           FK → grn_headers GRN that created this batch.
                                                          Full receiving audit trail.

  **supplier_id**         UUID           FK → suppliers   Enables recall notification
                                         NULLABLE         routing back to specific
                                                          supplier.

  **recall_id**           UUID           FK → recalls     If recalled: links to recall
                                         NULLABLE         record. Prevents any deduction
                                                          while set.

  **cold_chain_breach**   BOOLEAN        DEFAULT false    TRUE if a temperature reading
                                                          outside range was recorded
                                                          while this batch held stock.
  ----------------------- -------------- ---------------- ------------------------------

**16.4 inventory_movements --- Audit Log**

  ---------------------- -------------- ---------------- ------------------------------
  **Column**             **Data Type**  **Constraint**   **Purpose & Notes**

  **movement_id**        UUID           PK DEFAULT       Immutable. Never deleted.
                                        uuid()           Referenced in SARS audit
                                                         requests.

  **merchant_id**        UUID           NOT NULL FK +    Multi-tenant isolation.
                                        RLS              

  **movement_type**      VARCHAR(30)    NOT NULL         POS_sale \| return \|
                                                         grn_receive \| adjust_in \|
                                                         adjust_out \| transfer_out \|
                                                         transfer_in \| recipe_deduct
                                                         \| assembly_consume \|
                                                         stocktake_variance \|
                                                         expiry_writeoff \|
                                                         recall_quarantine

  **variant_id**         UUID           FK NOT NULL      Which SKU moved.

  **batch_id**           UUID           FK NULLABLE      Which batch was consumed
                                                         (FIFO). NULL for
                                                         non-batch-tracked products.

  **location_id**        UUID           FK NOT NULL      Where the movement occurred.

  **quantity**           INTEGER        NOT NULL \> 0    Always positive. Direction
                                                         determined by movement_type.

  **cost_price_cents**   BIGINT         NOT NULL         Weighted average cost at time
                                                         of movement. Locked.
                                                         Historical COGS accuracy.

  **reference_id**       UUID           NULLABLE         Links to: transaction_id
                                                         (sale) \| grn_id (receive) \|
                                                         transfer_id \| adjustment_id
                                                         \| stocktake_id \|
                                                         recipe_deduction_id.

  **reason_code**        VARCHAR(50)    NULLABLE         Required for manual
                                                         adjustments. Controlled
                                                         vocabulary: damaged \| expired
                                                         \| stolen \| sample \| own_use
                                                         \| found_stock \|
                                                         near_expiry_clearance.

  **reason_notes**       TEXT           NULLABLE         Free-text explanation.
                                                         Optional for most movements.
                                                         Recommended for high-value
                                                         variances.

  **performed_by**       UUID           FK → users NOT   Staff member who triggered the
                                        NULL             movement.

  **authorised_by**      UUID           FK → users       Manager who approved
                                        NULLABLE         (movements requiring manager
                                                         auth).

  **device_id**          VARCHAR(100)   NULLABLE         Device identifier. For fraud
                                                         investigation.

  **kafka_event_id**     UUID           NULLABLE         Cross-references the Kafka
                                                         event published for this
                                                         movement. Event replay
                                                         support.

  **created_at**         TIMESTAMP      NOT NULL DEFAULT Nanosecond precision. Cannot
                                        now()            be backdated. Indexed for
                                                         time-range queries.
  ---------------------- -------------- ---------------- ------------------------------

**16.5 Supporting Tables --- Overview**

  ----------------------------- --------------- --------------------------------------- -----------------
  **Table Name**                **Primary Key** **Description**                         **Row Count
                                                                                        Estimate**

  inventory_locations           location_id     Each physical location (branch, stock   5--20 per
                                UUID            room, virtual). Has: merchant_id, name, merchant
                                                type                                    
                                                (branch/warehouse/stockroom/virtual),   
                                                address, is_active.                     

  inventory_stocktakes          stocktake_id    Stocktake sessions: type, location,     5--50 per
                                UUID            assigned_to, status, started_at,        merchant per year
                                                completed_at,                           
                                                total_variance_value_cents.             

  inventory_stocktake_lines     line_id UUID    Each counted item: stocktake_id,        50--5,000 per
                                                variant_id, location_id, system_qty,    stocktake
                                                counted_qty, variance, reason_code,     
                                                approved_by.                            

  inventory_transfers           transfer_id     Inter-location transfer records:        Varies by
                                UUID            from/to location, status, items JSONB,  merchant size
                                                dispatched_at, received_at.             

  inventory_recipes             recipe_id UUID  Links menu_item (product_variant) to    50--500 per F&B
                                                ingredient components. F&B only.        merchant

  inventory_recipe_components   component_id    Each ingredient in a recipe: recipe_id, 300--3,000 per
                                UUID            ingredient_variant_id, quantity_grams,  F&B merchant
                                                yield_pct.                              

  inventory_work_orders         work_order_id   BOM production runs: bom_id,            Bakery/catering
                                UUID            qty_to_produce, status, issued_at,      specific
                                                completed_at, actual_yield.             

  inventory_reorder_settings    setting_id UUID Per-SKU reorder configuration: tier     1 per tracked SKU
                                                (1/2/3), reorder_point, par_level,      
                                                auto_order, preferred_supplier_id.      

  inventory_recalls             recall_id UUID  Recall records: batch_number, reason,   Rare --- high
                                                initiated_by, initiated_at, scope       importance
                                                (platform/merchant), resolution status. 

  inventory_cold_chain_log      log_id UUID     Temperature readings per                Pharmacy/F&B:
                                                fridge/freezer: location_id,            daily entries
                                                temperature_celsius, method, logged_at, 
                                                in_range boolean.                       
  ----------------------------- --------------- --------------------------------------- -----------------

+-----------------------------------------------------------------------+
| **17** ── **UI/UX Specification --- Merchant OS Inventory Screens**   |
|                                                                       |
| *Desktop Merchant Portal · Tablet POS · Mobile Merchant App · WCAG    |
| 2.1 AA*                                                               |
|                                                                       |
| Every inventory action must be completable in the minimum possible    |
| taps --- benchmarked against Square for Retail\'s UX                  |
+-----------------------------------------------------------------------+

**17.1 Inventory Dashboard --- Main Screen**

The Inventory Dashboard is the merchant\'s first view when they tap the
Inventory tab. It surfaces the most critical information immediately ---
what needs attention now --- and allows drill-down into any category.

+-----------------------------------+-----------------------------------+
| **Above-the-Fold --- Immediate    | **Below-the-Fold --- Browse &     |
| Attention**                       | Manage**                          |
|                                   |                                   |
| -   Critical alerts strip at top: | -   Category tiles: each product  |
|     red tiles for OUT_OF_STOCK    |     category shows SOH, value,    |
|     count, amber for              |     and alert count. Tap to drill |
|     BELOW_REORDER count, yellow   |     in.                           |
|     for JAX AI forecast alerts.   |                                   |
|     Tap any tile to see the list. | -   Recent movements: last 10     |
|                                   |     stock movements with type     |
| -   Stock health scorecard: 6     |     icon, product name, qty,      |
|     KPIs at a glance --- Total    |     time. Tap to see full log.    |
|     SKUs, Total Value (Rand),     |                                   |
|     Turnover Ratio, Shrinkage     | -   Top 5 fast movers: ranked by  |
|     Rate %, Dead Stock Count,     |     units/day velocity. Photo,    |
|     Expiring in 30 days.          |     name, current SOH, days of    |
|                                   |     supply remaining.             |
| -   Today\'s activity summary:    |                                   |
|     Units received (GRNs today),  | -   Top 5 slow movers / at risk:  |
|     Units sold (from POS today),  |     items with low velocity or    |
|     Net stock change.             |     approaching expiry. Action    |
|                                   |     button per item.              |
| -   Quick actions row: \[+ Add    |                                   |
|     Product\] \[Scan to Receive\] | -   Reorder panel: all items      |
|     \[New Stocktake\] \[Order     |     below reorder point. \"Create |
|     More Stock\]                  |     Reorder\" button launches     |
|                                   |     GroSupply RFQ.                |
|                                   |                                   |
|                                   | -   JAX AI insight card: one      |
|                                   |     proactive insight per day.    |
|                                   |     Dismissible. New card appears |
|                                   |     next session.                 |
+-----------------------------------+-----------------------------------+

**17.2 Product List & Detail Screens**

  ------------ ------------------------- ------------------------ ---------------
  **Screen**   **Layout**                **Key Interactions**     **Performance
                                                                  Target**

  Product List Virtualized list ---      Tap row → Product        \< 200ms to
               renders 50 items at a     Detail. Long-press →     render list
               time, infinite scroll.    context menu (Edit /     after
               Each row: hero image      Duplicate / Archive /    navigation.
               (40px), name, SKU,        Quick Adjust). Swipe     Search results
               current SOH, cost, sell   left → Quick Adjust (±1  \< 50ms.
               price, margin%, status    unit). Filter chip row:  
               badge (In Stock / Low /   All / Low Stock / Out /  
               Out). Sortable columns.   Expiring.                
               Search bar at top                                  
               (OpenSearch, \< 50ms                               
               results).                                          

  Product      Tab layout: Overview /    Edit button (top-right)  \< 300ms to
  Detail       Variants / Stock Levels / opens edit form.         load. Batch
               Batches / Movements /     \"Adjust Stock\"         list
               Recipe (F&B only).        floating button ---      lazy-loads.
               Overview: name, photos    opens quick adjustment   
               (carousel), full fields.  sheet. \"Order More\" →  
               Variants: matrix grid     GroSupply RFQ. Photo tap 
               showing SOH per variant + → full-screen view.      
               per location.                                      

  Product Edit Single scrolling form.    Two-panel on desktop:    Form renders in
  Form         Sticky save button at     form left, live preview  \< 100ms.
               bottom. Real-time         right. Mobile:           
               validation (price \> cost full-width form with     
               price check, VAT          compact field labels.    
               treatment consistency).                            
               Auto-save draft if                                 
               merchant navigates away.                           
  ------------ ------------------------- ------------------------ ---------------

**17.3 GRN Screen --- Mobile Receiving Flow**

+-----------------------------------+-----------------------------------+
| **Step 1: Select / Create GRN**   | **Step 3: Confirm & Batch         |
|                                   | Details**                         |
| -   Open GRNs from GroSupply POs  |                                   |
|     show in list with supplier    | -   Each scanned item shows:      |
|     name, expected delivery date, |     product name, expected qty    |
|     item count.                   |     (from PO), received count.    |
|                                   |                                   |
| -   Tap PO-linked GRN →           | -   Increment received count by   |
|     pre-filled with expected      |     scanning again or tapping +/− |
|     items.                        |     buttons.                      |
|                                   |                                   |
| -   \"New Manual GRN\" for        | -   Batch fields (if product      |
|     unplanned deliveries ---      |     requires): batch number       |
|     blank GRN, manual item        |     (keyboard), expiry date       |
|     addition.                     |     (date-picker, optimised for   |
|                                   |     gloved use with large tap     |
| -   Large \"Start Scanning\"      |     targets).                     |
|     button --- immediately enters |                                   |
|     scan mode.                    | -   \"Reject item\" option:       |
|                                   |     reason picker (Damaged /      |
| **Step 2: Scan Items**            |     Wrong Item / Near Expiry /    |
|                                   |     Short Delivery).              |
| -   Camera fills 60% of screen.   |                                   |
|     Torch auto-on if ambient      | **Step 4: Complete GRN**          |
|     light \< threshold.           |                                   |
|                                   | -   Summary screen: all items     |
| -   Successful scan: product name |     received, variances           |
|     appears with green flash +    |     highlighted amber/red.        |
|     audio beep.                   |                                   |
|                                   | -   \"Request Manager Approval\"  |
| -   Unknown barcode: \"Add new    |     button --- manager biometric  |
|     product?\" prompt ---         |     or PIN.                       |
|     quick-create sheet slides up. |                                   |
|                                   | -   On approval: inventory        |
| -   Keyboard entry option for     |     updates, receipt prints       |
|     damaged barcodes.             |     (thermal or PDF), Kafka event |
|                                   |     published.                    |
|                                   |                                   |
|                                   | -   Discrepancy report            |
|                                   |     auto-generated if any         |
|                                   |     variance exists --- forwarded |
|                                   |     to GroSupply.                 |
+-----------------------------------+-----------------------------------+

**17.4 Stocktake Mobile Flow --- Blind Count**

  ------------ --------------------- ---------------- --------------------
  **Screen**   **What Counter Sees** **What Counter   **Manager-Only
                                     Does NOT See**   Screen**

  Stocktake    Product name, barcode System quantity. N/A
  Item Card    image, large number   Zero information 
               pad for count entry,  that could bias  
               progress (X of Y      the count.       
               items), item photo.                    

  Category     \% complete for each  Interim          N/A
  Progress     category section.     variances.       
               Number of items       System           
               counted vs total.     quantities for   
                                     any item.        

  Submission   Total items counted   Variance figures Manager taps: reveal
  Screen       summary. \"Submit for --- all hidden   variance column
               Manager Review\"      until manager    showing System vs
               button.               approves reveal. Counted for all
                                                      items.

  Variance     All items with        ---              Approve individual
  Review       variance highlighted.                  lines, request
  (Manager)    Cost value of each                     recount on specific
               variance. Sort by                      items, override with
               highest value.                         written
                                                      justification. Final
                                                      commit button.
  ------------ --------------------- ---------------- --------------------

+-----------------------------------------------------------------------+
| **18** ── **Quality Gates & Testing Standards**                       |
|                                                                       |
| *Definition of Done · Test coverage targets · Performance benchmarks  |
| · E2E test scenarios*                                                 |
|                                                                       |
| No Inventory feature is marked Done without passing every gate below  |
+-----------------------------------------------------------------------+

**18.1 Definition of Done --- Inventory Features**

  --------------- ----------------------- --------------------- --------------
  **Gate**        **Standard**            **Test Method**       **Blocker?**

  Unit Test       ≥ 80% statement         Jest + Istanbul       YES --- PR
  Coverage        coverage on all new     coverage report in    blocked if
                  inventory code. FIFO    CI/CD pipeline.       coverage drops
                  engine: 100% branch                           below
                  coverage. Movement                            threshold.
                  audit log: 100%.                              

  API Contract    Every new endpoint has  Dredd + Postman in    YES
  Test            Postman test            CI/CD.                
                  collection. Response                          
                  schema matches OpenAPI                        
                  3.0 spec. No                                  
                  undocumented response                         
                  codes.                                        

  Atomic          Every movement that     Jest with database    YES
  Transaction     should be atomic is     transaction rollback  
  Test            tested with a simulated injection.            
                  failure                                       
                  mid-transaction. No                           
                  partial stock updates.                        

  FIFO Validation Test: multiple batches  Jest + test fixtures  YES
                  exist. Sale deducts     with 5 batches per    
                  from oldest first. If   product.              
                  oldest depletes                               
                  mid-sale, continues                           
                  from next. Tested with                        
                  \>3 batches.                                  

  Idempotency     Retry same movement     Jest: submit          YES
  Test            request with same       identical request 3×  
                  idempotency_key. Stock  with same key.        
                  deducted once, not      Assert: stock level   
                  twice.                  same as after 1       
                                          deduction.            

  Negative Stock  Sale attempt when SOH=0 Jest: reduce stock to YES
  Block           and                     0, attempt sale.      
                  allow_negative=false.   Assert: correct 409   
                  Returns 409 with clear  response + stock      
                  error. POS shows \"Out  unchanged.            
                  of Stock\" --- never a                        
                  confusing error.                              

  Recall          Recall initiated at     Automated test:       YES
  Propagation     09:00:00.000. All       initiate recall, poll 
  Speed           affected merchants have all affected merchant 
                  batch status=recalled   batch records, assert 
                  by 09:01:00.000.        status change within  
                  60-second SLA.          60s.                  

  Multi-Tenant    Merchant A cannot read  Jest: authenticate as YES
  Isolation       or write Merchant B\'s  Merchant A, attempt   
                  inventory via any API   to access Merchant    
                  endpoint. RLS verified. B\'s product IDs.     
                                          Assert: 404/403 on    
                                          all attempts.         

  Offline Sync    POS goes offline for 72 Playwright: simulate  YES
  Test            hours. Transactions     network failure 72h   
                  queued. Reconnect. All  buffer, reconnect,    
                  queued transactions     verify idempotent     
                  sync. No duplicate      sync.                 
                  deductions.                                   

  WCAG 2.1 AA     All inventory screens   axe-core in CI/CD +   YES
                  pass accessibility      manual                
                  audit. Colour contrast  VoiceOver/TalkBack    
                  ≥ 4.5:1. All            walkthrough.          
                  interactive elements ≥                        
                  44×44px touch target.                         
  --------------- ----------------------- --------------------- --------------

**18.2 Performance Benchmarks**

  --------------------- ---------- ---------- ----------------------------
  **Operation**         **Target   **Target   **Load Test Scenario**
                        P95**      P99**      

  Product list load     \< 200ms   \< 400ms   k6: 500 concurrent merchant
  (100 SKUs)                                  sessions each loading
                                              product list

  Barcode scan lookup   \< 50ms    \< 100ms   k6: 1,000 scans/second
                                              sustained for 5 minutes
                                              (busy Christmas peak
                                              simulation)

  Stock deduction on    \< 100ms   \< 250ms   k6: 500 concurrent POS
  sale                                        transactions, each with
                                              5-line basket, simultaneous
                                              deduction

  GRN commit (50 items) \< 2,000ms \< 4,000ms Jest: GRN with 50 line
                                              items, each with batch
                                              details. Must complete
                                              atomically.

  Expiry report (10,000 \< 1,000ms \< 2,000ms TimescaleDB query test:
  batches)                                    merchant with 10,000 batch
                                              records, expiry report for
                                              next 90 days

  Stock movement log    \< 500ms   \< 1,000ms Pagination test: merchant
  (1M rows)                                   with 1M movement rows. Page
                                              1 of 50 should return in \<
                                              500ms.

  JAX AI inventory      \< 3,000ms \< 6,000ms Response time for NLP query
  query                                       including TimescaleDB
                                              aggregation and LLM
                                              inference

  Recall propagation    \<         \<         Simulate recall touching
  (1,000 merchants)     60,000ms   90,000ms   1,000 merchants. All batch
                                              records updated within 60s
                                              SLA.

  Full inventory        \< 800ms   \< 1,500ms Dashboard with 500 SKUs, 10
  dashboard load                              locations, all widgets.
                                              Skeleton shown within 300ms.
  --------------------- ---------- ---------- ----------------------------

**18.3 Critical E2E Test Scenarios**

+-----------------------------------+-----------------------------------+
| **Happy Path Tests**              | **Edge Case & Error Tests**       |
|                                   |                                   |
| -   Full receive cycle: GroSupply | -   Duplicate GRN: same PO        |
|     PO → GRN mobile scan →        |     processed twice --- second    |
|     complete → batch record       |     GRN flagged as duplicate,     |
|     created → SOH updated →       |     first GRN quantities not      |
|     accounting journal created →  |     doubled.                      |
|     settlement eligible.          |                                   |
|                                   | -   Batch exhausted mid-sale:     |
| -   Recipe deduction: restaurant  |     sale of 5 units where oldest  |
|     sells 50 dishes → each dish   |     batch has 3 units → 3 from    |
|     deducts correct ingredient    |     batch 1, 2 from batch 2 →     |
|     grams via FIFO → ingredient   |     both batches correctly        |
|     SOH matches theoretical.      |     updated.                      |
|                                   |                                   |
| -   Multi-location transfer:      | -   Concurrent stock deduction:   |
|     initiate → dispatch → receive |     two cashiers selling the last |
|     → SOH correct at both         |     unit simultaneously → exactly |
|     locations → in-transit shows  |     one succeeds, other gets 409  |
|     during movement.              |     Out of Stock.                 |
|                                   |                                   |
| -   Stocktake blind count: count  | -   Partial GRN receive: received |
|     submitted → variance revealed |     80 of 100 ordered → only 80   |
|     to manager → approval →       |     added to stock → PO remains   |
|     commit → SOH updated →        |     open for remaining 20.        |
|     journal created.              |                                   |
|                                   | -   Recall quarantine + sale      |
| -   Reorder cycle: SOH hits       |     attempt: recalled batch       |
|     reorder point → alert fires → |     exists → sale attempt → POS   |
|     merchant creates RFQ → PO     |     blocks → cashier sees         |
|     issued → GRN completed → SOH  |     \"Product Recalled\" message  |
|     replenished.                  |     (not generic error).          |
|                                   |                                   |
| -   Recall: admin initiates       | -   Stocktake during peak         |
|     recall → all merchants        |     trading: cycle count running, |
|     notified within 60s → batch   |     sales happening               |
|     quarantined → POS blocks sale |     simultaneously → stocktake    |
|     → merchant resolves → audit   |     committed at end still        |
|     trail complete.               |     accurate because counted qty  |
|                                   |     was point-in-time +           |
|                                   |     subsequent movements tracked. |
+-----------------------------------+-----------------------------------+

+-----------------------------------------------------------------------+
| groway --- Inventory Management: Comprehensive Specification          |
|                                                                       |
| *12 Verticals · 47 Sub-Verticals · 3,930+ SKUs · FIFO · Batch         |
| Tracking · JAX AI · GroSupply · February 2026 · Confidential*         |
+-----------------------------------------------------------------------+
