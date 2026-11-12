# Groway Merchant OS - Inventory Module Gap Analysis

## Executive Summary

**Current Completion: ~35% of Inventory Module Specification**

This document analyzes the gap between the Groway Inventory Management Specification (v1.0, February 2026) and the current implementation, with specific focus on pre-loaded SKU catalogues and vertical-specific inventory configurations.

---

## 1. Pre-Loaded SKU Catalogue Gap Analysis

### Specification Requirements vs Current State

| Vertical | Required SKUs | Current State | Gap |
|----------|---------------|---------------|-----|
| **Grocery & Superette** | 1,200 SKUs | ~60 SKUs in skuCatalog.ts | **93% Missing** |
| **Spaza Shop** | 600 SKUs | ~30 SKUs (partial) | **95% Missing** |
| **Pharmacy** | 500 SKUs | **NOT IMPLEMENTED** | **100% Missing** |
| **Liquor Store** | 1,200 SKUs | ~85 SKUs | **93% Missing** |
| **Hair Salon & Barber** | 300 SKUs | **NOT IMPLEMENTED** | **100% Missing** |
| **Restaurant/F&B** | 600 ingredient SKUs | ~250 SKUs | **58% Missing** |
| **Auto Workshop** | 500 part SKUs | **NOT IMPLEMENTED** | **100% Missing** |
| **Hardware** | 800 SKUs | **NOT IMPLEMENTED** | **100% Missing** |
| **Electronics** | 200 SKUs | **NOT IMPLEMENTED** | **100% Missing** |
| **Fashion & Apparel** | Not specified | **NOT IMPLEMENTED** | **100% Missing** |
| **Hospitality** | Not specified | **NOT IMPLEMENTED** | **100% Missing** |
| **Health & Beauty** | 300+ SKUs | **NOT IMPLEMENTED** | **100% Missing** |

**Total Pre-loaded SKUs Required: 3,930+**
**Current Approximate: ~425**
**Gap: ~3,505 SKUs (89% Missing)**

---

## 2. Missing Sub-Vertical SKU Catalogues

### Food & Beverage (8 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| QSR | ✅ Partial | Expand to include all barcode-compatible items |
| Sit-Down Restaurant | ✅ Partial | Add recipe-linked ingredient SKUs |
| Shisa Nyama | ✅ Implemented | Add weight-based pricing logic |
| Coffee Shop | ✅ Implemented | Add consumables tracking (cups, lids) |
| Bakery | ✅ Partial | Add BOM/recipe ingredient SKUs |
| Food Truck | ✅ Partial | Add offline-sync inventory items |
| Cloud Kitchen | ✅ Partial | Add delivery packaging SKUs |
| Catering | ✅ Partial | Add per-person package SKUs |

### Liquor & Nightlife (6 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Liquor Store | ✅ Partial | Expand to 1,200+ SKUs with EAN-13 |
| Bar/Pub | ✅ Partial | Add draft pricing, tower tracking |
| Nightclub | ✅ Partial | Add entry fees, bottle service |
| Shebeen | ✅ Partial | Add tab/credit tracking SKUs |
| Bottle Store | ✅ Partial | Add case/bulk pricing |
| Wine Farm | ✅ Partial | Add tasting menu, estate wines |

### Grocery & FMCG (7 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Superette | ✅ Partial | Expand to 1,200+ SKUs with barcodes |
| Spaza Shop | ✅ Partial | Add informal trade pricing benchmarks |
| Butchery | ❌ NOT IMPLEMENTED | **Create weight-based SKUs with batch tracking** |
| Deli | ❌ NOT IMPLEMENTED | **Create perishable SKUs with expiry tracking** |
| Farm Stall | ❌ NOT IMPLEMENTED | **Create local produce SKUs** |
| Cash & Carry | ❌ NOT IMPLEMENTED | **Create bulk/wholesale SKUs** |
| Bakery Retail | ❌ NOT IMPLEMENTED | **Create fresh-baked SKUs with shelf-life** |

### Health & Beauty (8 sub-verticals) - **CRITICAL GAP**
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Hair Salon | ❌ NOT IMPLEMENTED | **Create service + consumable SKUs** |
| Barber | ❌ NOT IMPLEMENTED | **Create service SKUs with duration** |
| Nail Salon | ❌ NOT IMPLEMENTED | **Create service + product SKUs** |
| Spa & Wellness | ❌ NOT IMPLEMENTED | **Create treatment package SKUs** |
| Aesthetic Clinic | ❌ NOT IMPLEMENTED | **Create medical-grade product SKUs** |
| Tattoo Studio | ❌ NOT IMPLEMENTED | **Create service + ink/consumable SKUs** |
| Lash & Brow Studio | ❌ NOT IMPLEMENTED | **Create service SKUs** |

### Pharmacy (6 sub-verticals) - **CRITICAL COMPLIANCE GAP**
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Full Pharmacy | ❌ NOT IMPLEMENTED | **NAPPI codes, Schedule 0-6 compliance** |
| Health Shop (OTC) | ❌ NOT IMPLEMENTED | **Schedule 0-2 products only** |
| Herbal/Traditional | ❌ NOT IMPLEMENTED | **Traditional medicine SKUs** |
| Optometry | ❌ NOT IMPLEMENTED | **Frames, lenses, exam SKUs** |
| Dentistry | ❌ NOT IMPLEMENTED | **Dental procedure SKUs** |
| Veterinary | ❌ NOT IMPLEMENTED | **Vet medicine SKUs with NAPPI** |

### Fashion & Apparel (7 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Clothing Boutique | ❌ NOT IMPLEMENTED | **Size/color matrix SKUs** |
| Shoe Store | ❌ NOT IMPLEMENTED | **Size/width variant SKUs** |
| Accessories | ❌ NOT IMPLEMENTED | **Simple SKUs** |
| Uniform Supplier | ❌ NOT IMPLEMENTED | **B2B catalog SKUs** |
| Second-hand/Thrift | ❌ NOT IMPLEMENTED | **Unique item SKUs** |
| Tailor & Alterations | ❌ NOT IMPLEMENTED | **Service SKUs** |

### Hardware & Building (6 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Hardware Store | ❌ NOT IMPLEMENTED | **800+ SKUs with bulk pricing** |
| Building Supplies | ❌ NOT IMPLEMENTED | **Weight/volume-based SKUs** |
| Paint Shop | ❌ NOT IMPLEMENTED | **Color mixing SKUs** |
| Plumbing Supplies | ❌ NOT IMPLEMENTED | **Trade-specific SKUs** |
| Electrical Supplies | ❌ NOT IMPLEMENTED | **Trade-specific SKUs** |
| Agri-Supply | ❌ NOT IMPLEMENTED | **Agricultural input SKUs** |

### Electronics & Tech (4 sub-verticals)
| Sub-Vertical | Status | Action Required |
|--------------|--------|-----------------|
| Phone & Accessories | ❌ NOT IMPLEMENTED | **IMEI register required** |
| Computer & IT | ❌ NOT IMPLEMENTED | **Serial number tracking** |
| Electronics Retail | ❌ NOT IMPLEMENTED | **Warranty-linked SKUs** |
| Repair Workshop | ❌ NOT IMPLEMENTED | **Service + parts SKUs** |

---

## 3. Missing Database Models for Inventory

### Critical Missing Models

| Model | Specification Section | Priority | Description |
|-------|----------------------|----------|-------------|
| **ProductBatch** | Section 05 | HIGH | Batch tracking with expiry dates |
| **ExpiryAlert** | Section 05 | HIGH | Automated expiry notifications |
| **RecallNotice** | Section 05 | HIGH | Product recall management |
| **StocktakeSession** | Section 07 | HIGH | Stocktake/cycle count sessions |
| **StocktakeItem** | Section 07 | HIGH | Individual count records |
| **VarianceReport** | Section 07 | MEDIUM | Stocktake variance reporting |
| **ReorderRule** | Section 08 | MEDIUM | Automated reorder configuration |
| **SupplierProduct** | Section 14 | MEDIUM | Supplier-product-price mapping |
| **PriceList** | Section 15 | MEDIUM | Multiple price lists |
| **ProductBundle** | Section 02 | MEDIUM | Bundle/kit composition |
| **ProductImage** | Section 02 | LOW | Multiple product images |
| **ProductTag** | Section 02 | LOW | Product tagging |
| **ColdChainLog** | Section 11 | HIGH | Cold chain temperature tracking |
| **ExciseEntry** | Section 11 | MEDIUM | Liquor excise register |
| **IMEIRecord** | Section 11 | MEDIUM | Electronics IMEI tracking |
| **AllergenProfile** | Section 11 | MEDIUM | Product allergen data |
| **ShrinkageRecord** | Section 12 | MEDIUM | Theft/waste/loss tracking |

### Current Models Needing Enhancement

| Model | Missing Fields | Specification Reference |
|-------|----------------|------------------------|
| **Product** | nappi_code, schedule_class, allergens, halal_certified, kosher_certified, cold_chain_required, imei_tracking, serial_tracking, country_of_origin | Section 2.3 |
| **ProductVariant** | batch_tracking_enabled, expiry_tracking_enabled, shelf_life_days, expiry_alert_days | Section 2.3 |
| **BranchInventory** | current_batch, batch_expiry, location_aisle, location_shelf, location_bin | Section 6 |
| **StockMovement** | batch_number, expiry_date, unit_cost_cents, total_cost_cents, idempotency_key | Section 4 |

---

## 4. Missing API Endpoints

### Inventory Service (Port 3005) - Specification vs Current

| Endpoint | Specification | Status |
|----------|---------------|--------|
| `GET /v1/inventory/products` | ✅ Implemented | Done |
| `POST /v1/inventory/products` | ✅ Implemented | Done |
| `GET /v1/inventory/products/:id` | ✅ Implemented | Done |
| `PUT /v1/inventory/products/:id` | ✅ Implemented | Done |
| `DELETE /v1/inventory/products/:id` | ✅ Implemented | Done |
| `GET /v1/inventory/products/barcode/:code` | ✅ Implemented | Done |
| `GET /v1/inventory/products/variants/:id` | ✅ Implemented | Done |
| `GET /v1/inventory/branches` | ✅ Implemented | Done |
| `GET /v1/inventory/branches/:id/inventory` | ✅ Implemented | Done |
| `POST /v1/inventory/transfers` | ✅ Implemented | Done |
| `POST /v1/inventory/transfers/:id/ship` | ✅ Implemented | Done |
| `POST /v1/inventory/transfers/:id/receive` | ✅ Implemented | Done |
| `GET /v1/inventory/stats` | ✅ Implemented | Done |
| `POST /v1/inventory/movements` | ❌ NOT IMPLEMENTED | **Required** |
| `GET /v1/inventory/movements` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/adjustments` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/grn` | ❌ NOT IMPLEMENTED | **Required - 3-way match** |
| `GET /v1/inventory/batches` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/batches` | ❌ NOT IMPLEMENTED | **Required** |
| `GET /v1/inventory/expiry-alerts` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/recall` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/stocktake` | ❌ NOT IMPLEMENTED | **Required** |
| `GET /v1/inventory/stocktake/:id` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/stocktake/:id/submit` | ❌ NOT IMPLEMENTED | **Required** |
| `GET /v1/inventory/reorder-suggestions` | ❌ NOT IMPLEMENTED | **Required - JAX AI** |
| `POST /v1/inventory/reorder` | ❌ NOT IMPLEMENTED | **Required - auto-RFQ** |
| `GET /v1/inventory/analytics/velocity` | ❌ NOT IMPLEMENTED | **Required** |
| `GET /v1/inventory/analytics/dead-stock` | ❌ NOT IMPLEMENTED | **Required** |
| `POST /v1/inventory/catalogue/load-vertical` | ❌ NOT IMPLEMENTED | **CRITICAL** |

---

## 5. Missing Vertical-Specific Inventory Features

### Pharmacy Inventory (SAHPRA Compliance)
- [ ] NAPPI code validation and lookup
- [ ] Schedule 0-6 drug classification enforcement
- [ ] Prescription linkage to inventory
- [ ] Controlled substance register
- [ ] Pharmacist-on-duty verification
- [ ] Cold chain compliance logging
- [ ] Recall notification system

### Liquor Inventory (Excise & Compliance)
- [ ] Excise duty calculation per liter alcohol
- [ ] Liquor license trading hours enforcement
- [ ] Age verification at POS
- [ ] Stock register for excise reporting
- [ ] Barrel/tank tracking for wine farms

### Electronics Inventory (IMEI/RICA)
- [ ] IMEI number capture on receipt
- [ ] IMEI-verified sale at POS
- [ ] Warranty registration via serial number
- [ ] RICA compliance for SIM sales

### Food & Beverage (Recipe Engine)
- [ ] Ingredient deduction on sale
- [ ] FIFO batch consumption
- [ ] Allergen flagging on menu items
- [ ] Health & safety log integration

### Butchery (Weight-Based)
- [ ] Scale integration for price calculation
- [ ] Weight-based pricing per cut
- [ ] Carcass breakdown tracking
- [ ] Yield factor calculations

---

## 6. Missing Integration Points

### GroSupply Integration
| Feature | Status | Description |
|---------|--------|-------------|
| Auto-RFQ on low stock | ❌ Missing | Trigger RFQ when stock hits reorder point |
| GRN completion → inventory update | ❌ Missing | Add stock on GRN approval |
| 3-way match | ❌ Missing | PO vs Quote vs GRN reconciliation |
| Supplier catalogue sync | ❌ Missing | Import supplier product data |

### Accounting Integration
| Feature | Status | Description |
|---------|--------|-------------|
| Auto-journal on stock movement | ❌ Missing | Every movement creates journal entry |
| COGS calculation | ❌ Missing | Cost at movement time |
| Variance accounting | ❌ Missing | Stocktake variance to P&L |
| Asset revaluation | ❌ Missing | Weighted average cost updates |

### JAX AI Integration
| Feature | Status | Description |
|---------|--------|-------------|
| Demand forecasting | ❌ Missing | 5-day AI forecast |
| Reorder suggestions | ❌ Missing | ML-based reorder recommendations |
| Seasonal pattern detection | ❌ Missing | Identify seasonal demand |
| Dead stock prediction | ❌ Missing | Predict slow-moving items |

---

## 7. Priority Implementation Roadmap

### Phase 1: Foundation (Week 1-2) - CRITICAL
1. **Expand SKU Catalogue Database**
   - Create database seed for all 3,930+ SKUs
   - Add vertical-specific pre-configuration data
   - Implement vertical selection → catalogue loading

2. **Missing Database Models**
   - ProductBatch (batch tracking)
   - ExpiryAlert (expiry management)
   - StocktakeSession & StocktakeItem

3. **Core API Endpoints**
   - Stock movements and adjustments
   - GRN processing
   - Batch management

### Phase 2: Vertical-Specific Features (Week 3-4)
1. **Pharmacy Module**
   - NAPPI code integration
   - Schedule classification
   - SAHPRA compliance logging

2. **Liquor Module**
   - Excise register
   - Trading hours enforcement
   - Age verification

3. **Electronics Module**
   - IMEI tracking
   - Serial number management

### Phase 3: Intelligence & Automation (Week 5-6)
1. **JAX AI Integration**
   - Demand forecasting
   - Reorder suggestions
   - Dead stock alerts

2. **GroSupply Integration**
   - Auto-RFQ
   - 3-way match
   - Supplier catalogue sync

3. **Accounting Integration**
   - Auto-journaling
   - COGS tracking
   - Variance reporting

---

## 8. Files Requiring Modification

### Database Schema
- `/prisma/schema.prisma` - Add 15+ missing models

### SKU Catalogues
- `/src/app/merchant-os/app/data/skuCatalog.ts` - Expand to 3,930+ SKUs
- Create new files for each vertical:
  - `pharmacySKUs.ts`
  - `hardwareSKUs.ts`
  - `electronicsSKUs.ts`
  - `fashionSKUs.ts`
  - `healthBeautySKUs.ts`

### API Routes
- `/src/app/api/merchant-os/` - Add 20+ missing endpoints

### Seed Data
- `/prisma/seed.ts` - Add comprehensive SKU seeding

### UI Components
- Inventory dashboard enhancements
- Stocktake screen
- Batch tracking interface
- Expiry alerts panel
- Recall management interface

---

## 9. Conclusion

The Groway Merchant OS inventory module is currently at approximately **35% completion** against the specification. The most critical gaps are:

1. **Pre-loaded SKU catalogues** - 89% of required SKUs are missing
2. **Vertical-specific inventory features** - Pharmacy, Electronics, Hardware, Fashion not implemented
3. **Compliance overlays** - SAHPRA, Excise, IMEI, Cold Chain not implemented
4. **Intelligence layer** - JAX AI forecasting not integrated
5. **GroSupply integration** - Auto-replenishment not functional

**Recommended Priority:**
1. Complete SKU catalogues for all verticals
2. Implement vertical selection → catalogue auto-loading
3. Add batch/expiry tracking
4. Implement pharmacy compliance (NAPPI, Schedules)
5. Add JAX AI demand forecasting

This will bring the inventory module to production-ready status for the core merchant OS functionality.
