# Groway Multi-Vertical POS - Gap Analysis Report

**Date:** March 10, 2026  
**Version:** 1.0  
**Status:** Current Implementation vs. Specification

---

## Executive Summary

| Metric | Spec | Implemented | Gap |
|--------|------|-------------|-----|
| **Verticals** | 12 | 12 | ✅ 100% |
| **Sub-Verticals** | 47 | 47 | ✅ 100% |
| **Pre-loaded SKUs** | 3,930+ | ~3,500 | ⚠️ 89% |
| **Vertical-Specific Features** | 150+ | ~45 | ❌ 30% |
| **API Endpoints** | 80+ | ~25 | ❌ 31% |
| **Compliance Modules** | 8 | 2 | ❌ 25% |

**Overall Multi-Vertical Implementation: 45%**

---

## 1. Vertical & Sub-Vertical Definition ✅ COMPLETE

### Implemented
- All **12 verticals** defined with icons and descriptions
- All **47 sub-verticals** defined with SKU counts and feature lists
- **SubVerticalWizard** component for 3-step onboarding
- **Auto-configuration preview** showing what gets configured
- **VAS tiles per vertical** mapping

### Spec Requirement
| Vertical | Sub-Verticals | Status |
|----------|---------------|--------|
| Food & Beverage | 8 | ✅ |
| Liquor & Nightlife | 6 | ✅ |
| Grocery & FMCG | 7 | ✅ |
| Health & Beauty | 7 | ✅ |
| Fashion & Apparel | 6 | ✅ |
| Health & Pharmacy | 6 | ✅ |
| Hospitality | 7 | ✅ |
| Hardware & Building | 6 | ✅ |
| Electronics & Tech | 4 | ✅ |
| Sport & Leisure | 6 | ✅ |
| Childcare & Education | 5 | ✅ |
| Professional Services | 6 | ✅ |

---

## 2. SKU Catalogues ⚠️ PARTIAL (89%)

### Implemented
- SKU catalogues for all 12 verticals
- Realistic South African pricing (ZAR)
- Category organization per vertical
- Icons per product category

### Gaps by Vertical

| Vertical | Spec SKUs | Implemented | Gap |
|----------|-----------|-------------|-----|
| Food & Beverage | 1,500+ | ~800 | ⚠️ 53% |
| Liquor & Nightlife | 800+ | ~450 | ⚠️ 56% |
| Grocery & FMCG | 2,000+ | ~400 | ❌ 20% |
| Health & Beauty | 500+ | ~200 | ⚠️ 40% |
| Fashion & Apparel | 600+ | ~150 | ❌ 25% |
| Health & Pharmacy | 1,500+ | ~300 | ❌ 20% |
| Hospitality | 300+ | ~150 | ⚠️ 50% |
| Hardware & Building | 2,000+ | ~300 | ❌ 15% |
| Electronics & Tech | 800+ | ~200 | ⚠️ 25% |
| Sport & Leisure | 400+ | ~150 | ⚠️ 38% |
| Childcare & Education | 200+ | ~100 | ⚠️ 50% |
| Professional Services | 300+ | ~200 | ⚠️ 67% |

### Missing Features
- [ ] Barcode data for all products
- [ ] NAPPI codes for pharmacy products
- [ ] Supplier linking per SKU
- [ ] Product images
- [ ] Allergen information

---

## 3. Vertical-Specific POS Features ❌ MAJOR GAPS (30%)

### 3.1 Food & Beverage ❌ CRITICAL GAPS

| Feature | Spec | Status |
|---------|------|--------|
| **QSR** | | |
| Counter/Kiosk order screen | Required | ✅ Basic POS |
| Combo builder | Required | ❌ Missing |
| Drive-through queue mode | Required | ❌ Missing |
| Kitchen Display System (KDS) | Required | ⚠️ Basic |
| Modifier screen | Required | ❌ Missing |
| Split tender | Required | ❌ Missing |
| **Sit-Down Restaurant** | | |
| Table floor plan builder | Required | ⚠️ Basic |
| Waiter tablet order taking | Required | ❌ Missing |
| Course management | Required | ❌ Missing |
| KDS routing by station | Required | ❌ Missing |
| Dynamic pricing (happy hour) | Required | ❌ Missing |
| QR self-service ordering | Required | ❌ Missing |
| Split bill by item/equal | Required | ❌ Missing |
| **Shisa Nyama** | | |
| Braai pit tracking board | Required | ❌ Missing |
| Meat cut by weight (scale) | Required | ❌ Missing |
| Tab-per-group model | Required | ❌ Missing |
| Stokvel wallet acceptance | Required | ❌ Missing |
| **Coffee Shop** | | |
| Barista screen (drink build) | Required | ❌ Missing |
| Loyalty cup tracker | Required | ⚠️ Basic |
| Milk type modifiers | Required | ❌ Missing |
| Wifi voucher sales | Required | ❌ Missing |

### 3.2 Liquor & Nightlife ❌ CRITICAL GAPS

| Feature | Spec | Status |
|---------|------|--------|
| Age verification (ID scan) | Required | ❌ Missing |
| Trading hours enforcement | Required | ❌ Missing |
| Excise register for stock | Required | ❌ Missing |
| Liquor licence tracking | Required | ❌ Missing |
| Tab management (bar) | Required | ❌ Missing |
| Happy hour auto-discount | Required | ❌ Missing |
| RFID wristband (nightclub) | Required | ❌ Missing |
| VIP section management | Required | ❌ Missing |

### 3.3 Grocery & FMCG ⚠️ PARTIAL

| Feature | Spec | Status |
|---------|------|--------|
| Barcode scanning | Required | ⚠️ Simulated |
| Promotions engine | Required | ❌ Missing |
| Loyalty integration | Required | ⚠️ Basic |
| Scale integration (butchery) | Required | ❌ Missing |
| Agent banking (spaza) | Required | ❌ Missing |
| Bill payments | Required | ⚠️ Basic |

### 3.4 Health & Beauty ⚠️ PARTIAL

| Feature | Spec | Status |
|---------|------|--------|
| Appointment booking | Required | ✅ Implemented |
| Stylist roster | Required | ⚠️ Basic |
| Service combos | Required | ❌ Missing |
| Membership plans | Required | ❌ Missing |
| Colour formula tracking | Required | ❌ Missing |
| Patch test records | Required | ❌ Missing |
| Consent forms | Required | ❌ Missing |

### 3.5 Health & Pharmacy ❌ CRITICAL GAPS

| Feature | Spec | Status |
|---------|------|--------|
| NAPPI code integration | Required | ❌ Missing |
| Schedule 0-6 tracking | Required | ❌ Missing |
| Prescription processing | Required | ❌ Missing |
| SAHPRA compliance | Required | ⚠️ Backend only |
| Cold chain monitoring | Required | ❌ Missing |
| Medical aid claims | Required | ❌ Missing |
| Controlled substance register | Required | ❌ Missing |

### 3.6 Hospitality ❌ CRITICAL GAPS

| Feature | Spec | Status |
|---------|------|--------|
| Room management grid | Required | ❌ Missing |
| Check-in/out flow | Required | ❌ Missing |
| Guest folio management | Required | ❌ Missing |
| Channel manager (OTA) | Required | ❌ Missing |
| Foreign national register | Required | ❌ Missing |
| Housekeeping status | Required | ❌ Missing |
| RevPAR dashboard | Required | ❌ Missing |

### 3.7 Hardware & Building ❌ CRITICAL GAPS

| Feature | Spec | Status |
|---------|------|--------|
| Trade account app | Required | ❌ Missing |
| B2B invoice delivery | Required | ❌ Missing |
| Quote builder | Required | ❌ Missing |
| Contractor accounts | Required | ❌ Missing |
| Bulk pricing engine | Required | ❌ Missing |

---

## 4. Kitchen Display System (KDS) ⚠️ PARTIAL

### Implemented
- Basic KitchenDisplayView component
- Order ticket display
- Station concept

### Missing (Per Spec)
- [ ] Ticket timer with alerts
- [ ] Bump (complete) functionality
- [ ] Course routing (starters → cold station, mains → hot station)
- [ ] Order bumping with sound alerts
- [ ] Multiple station support
- [ ] Rush mode handling
- [ ] Recall screen for voided items
- [ ] Expeditor screen

---

## 5. Recipe Engine ❌ MISSING

### Spec Requirements
| Feature | Status |
|---------|--------|
| Recipe-level ingredient deduction | ❌ Missing |
| FIFO stock rotation | ⚠️ Concept only |
| Component mapping for combos | ❌ Missing |
| Food cost vs revenue dashboard | ❌ Missing |
| Allergen flags on menu items | ❌ Missing |
| Waste tracking log | ❌ Missing |

---

## 6. QR Digital Menu ❌ MISSING

### Spec Requirements
| Feature | Status |
|---------|--------|
| Public menu endpoint (no auth) | ❌ Missing |
| Table-specific QR generation | ❌ Missing |
| Real-time availability toggle | ❌ Missing |
| Photo upload per item | ❌ Missing |
| Allergen display | ❌ Missing |
| Consumer ordering flow | ❌ Missing |

---

## 7. Geo-Discovery ❌ MISSING

### Spec Requirements
| Feature | Status |
|---------|--------|
| Nearby merchants endpoint | ❌ Missing |
| Category filtering | ❌ Missing |
| Open now filter | ❌ Missing |
| Merchant discovery cards | ❌ Missing |
| Rating system | ❌ Missing |
| Hours display | ❌ Missing |

---

## 8. Mini Online Store ❌ MISSING

### Spec Requirements
| Feature | Status |
|---------|--------|
| Consumer order placement | ❌ Missing |
| Delivery/collection toggle | ❌ Missing |
| Order status tracking | ❌ Missing |
| Delivery radius setting | ❌ Missing |
| Minimum order amount | ❌ Missing |
| WhatsApp ordering channel | ❌ Missing |

---

## 9. Compliance Modules ❌ CRITICAL (25%)

### Implemented
- ✅ POPIA consent backend
- ✅ SAHPRA drug register backend

### Missing
| Module | Vertical | Status |
|--------|----------|--------|
| Liquor Act compliance | Liquor | ❌ Missing |
| Age verification system | Liquor/Pharmacy | ❌ Missing |
| Excise register | Liquor | ❌ Missing |
| Liquor licence tracking | Liquor | ❌ Missing |
| Health & safety log | F&B | ❌ Missing |
| SACE compliance | Education | ❌ Missing |
| BCEA staff tracking | All | ⚠️ Partial |
| Cold chain monitoring | Pharmacy | ❌ Missing |

---

## 10. VAS (Value Added Services) ❌ CRITICAL (17%)

### Implemented
- ✅ Gift cards & vouchers system
- ✅ Airtime/data concept

### Missing Per Vertical

| Vertical | Priority VAS | Status |
|----------|--------------|--------|
| QSR | Delivery integration | ❌ |
| QSR | Loyalty stamps | ⚠️ Concept |
| Sit-Down | BNPL (Dine Now Pay Later) | ❌ |
| Shisa Nyama | Stokvel wallet | ❌ |
| Coffee Shop | Wifi vouchers | ❌ |
| Grocery | Electricity tokens | ❌ |
| Grocery | Bill payments | ⚠️ Concept |
| Spaza | Agent banking | ❌ |
| Pharmacy | Chronic reminders | ❌ |
| Pharmacy | Medical aid claims | ❌ |

---

## 11. API Endpoints ❌ CRITICAL (31%)

### Implemented (~25 endpoints)
- Products CRUD
- Transactions CRUD
- Customers CRUD
- Authentication
- Dashboard stats
- Inventory summary
- POPIA/SAHPRA basics

### Missing Per Spec (55+ endpoints)

#### Restaurant API
- [ ] GET /v1/pos/restaurant/tables
- [ ] POST /v1/pos/restaurant/tables/:id/open
- [ ] POST /v1/pos/restaurant/tables/:id/order
- [ ] POST /v1/pos/restaurant/tables/:id/bill
- [ ] POST /v1/pos/restaurant/tables/:id/split
- [ ] GET /v1/pos/restaurant/kds
- [ ] POST /v1/pos/restaurant/kds/:ticketId/bump

#### Liquor API
- [ ] POST /v1/pos/liquor/age-verify
- [ ] GET /v1/pos/liquor/trading-hours
- [ ] GET /v1/pos/liquor/excise-register
- [ ] GET /v1/pos/liquor/licence-status

#### Hotel API
- [ ] GET /v1/pos/hotel/rooms
- [ ] POST /v1/pos/hotel/reservations
- [ ] POST /v1/pos/hotel/checkin
- [ ] POST /v1/pos/hotel/folio/:id/charge
- [ ] POST /v1/pos/hotel/checkout

#### Pharmacy API
- [ ] POST /v1/pos/pharmacy/prescription
- [ ] POST /v1/pos/pharmacy/dispense
- [ ] GET /v1/pos/pharmacy/controlled-register
- [ ] POST /v1/pos/pharmacy/medical-aid/claim
- [ ] GET /v1/pos/pharmacy/nappi/:code

#### QR Menu & Store API
- [ ] GET /v1/merchant/menu/:slug
- [ ] PUT /v1/merchant/menu/items/:id
- [ ] GET /v1/discovery/nearby
- [ ] POST /v1/store/orders

---

## 12. Database Schema Gaps

### Missing Tables per Spec

| Table | Purpose | Status |
|-------|---------|--------|
| `restaurant_tables` | Floor plan, status | ❌ Missing |
| `restaurant_orders` | Table-linked orders | ❌ Missing |
| `kds_tickets` | Kitchen tickets | ❌ Missing |
| `recipes` | Ingredient mapping | ❌ Missing |
| `recipe_ingredients` | Components per item | ❌ Missing |
| `menu_items` | Digital menu | ❌ Missing |
| `age_verifications` | Liquor compliance | ❌ Missing |
| `excise_register` | Liquor stock tracking | ❌ Missing |
| `liquor_licences` | Licence management | ❌ Missing |
| `hotel_rooms` | Room inventory | ❌ Missing |
| `reservations` | Booking management | ❌ Missing |
| `guest_folios` | Guest billing | ❌ Missing |
| `prescriptions` | Script processing | ❌ Missing |
| `controlled_register` | S5/S6 tracking | ❌ Missing |
| `cold_chain_logs` | Temperature monitoring | ❌ Missing |
| `stokvel_groups` | Group payments | ❌ Missing |
| `store_orders` | Online orders | ❌ Missing |

---

## 13. Build Priority Matrix

Based on spec priorities and business impact:

### P0 - Critical (Sprint 1-4)
| Feature | Impact | Effort |
|---------|--------|--------|
| Table management (Restaurant) | High | Medium |
| KDS ticket routing | High | Medium |
| Age verification (Liquor) | High | Low |
| QR digital menu basics | High | Medium |
| Recipe engine foundation | High | High |

### P1 - High Priority (Sprint 5-8)
| Feature | Impact | Effort |
|---------|--------|--------|
| Hotel room management | High | High |
| Pharmacy prescription flow | High | High |
| Stokvel wallet | Medium | Medium |
| Mini online store | High | Medium |
| Geo-discovery basics | Medium | Medium |

### P2 - Medium Priority (Sprint 9-12)
| Feature | Impact | Effort |
|---------|--------|--------|
| Excise register | Medium | Medium |
| Medical aid claims | Medium | High |
| OTA channel manager | Medium | High |
| Agent banking | Medium | Medium |
| RFID wristband system | Low | High |

---

## 14. Estimated Effort

| Category | Remaining Effort |
|----------|------------------|
| Vertical-Specific POS | 15-20 sprints |
| KDS & Recipe Engine | 4-6 sprints |
| QR Menu & Geo-Discovery | 3-4 sprints |
| Mini Online Store | 3-4 sprints |
| Compliance Modules | 4-5 sprints |
| VAS Integration | 5-6 sprints |
| API Expansion | 8-10 sprints |
| Database Schema | 3-4 sprints |
| **TOTAL** | **45-59 sprints** |

---

## 15. Recommendations

### Immediate Actions (Next 2 Weeks)
1. **Implement Table Management** - Core restaurant functionality
2. **Build Age Verification** - Required for liquor vertical
3. **Complete KDS with Bump** - Kitchen operations
4. **Add QR Menu Foundation** - Customer-facing feature

### Short-Term (1-2 Months)
1. Recipe engine with ingredient deduction
2. Hotel room management module
3. Pharmacy prescription processing
4. Mini online store MVP

### Long-Term (3-6 Months)
1. Full compliance suite
2. VAS integration per vertical
3. Geo-discovery layer
4. OTA channel manager

---

**Report Generated:** March 10, 2026  
**Groway Merchant OS v1.0**
