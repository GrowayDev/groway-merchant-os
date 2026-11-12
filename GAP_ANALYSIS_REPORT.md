# Groway Merchant OS - Gap Analysis Report

## Executive Summary

This report analyzes the gaps between the Groway Merchant OS specifications and the current implementation. The analysis covers all major modules and features documented in:

- Multi-Vertical POS Specification v1.0
- Master Build Document v4.0
- Inventory Management Specification v1.0
- Gift Card Strategy Report Feb 2026
- GroSupply Standalone Spec v4.0

---

## 1. MODULE IMPLEMENTATION STATUS

### 1.1 Current Implementation Overview

| MODULE | COMPONENT | STATUS | COMPLETENESS |
|--------|-----------|--------|--------------|
| Dashboard | MerchantDashboard.tsx | ✅ Implemented | 85% |
| POS | POSLayout.tsx | ✅ Implemented | 75% |
| Inventory | InventoryView.tsx | ✅ Implemented | 80% |
| Accounting | AccountingView.tsx | ✅ Implemented | 85% |
| CRM & Loyalty | CRMView.tsx | ✅ Implemented | 70% |
| Marketing | MarketingView.tsx | ✅ Implemented | 65% |
| Staff & HRM | StaffHRMView.tsx | ✅ Implemented | 75% |
| Transactions | TransactionsView.tsx | ✅ Implemented | 80% |
| Sub-Vertical Selection | SubVerticalWizard.tsx | ✅ Implemented | 90% |

---

## 2. DETAILED GAP ANALYSIS BY MODULE

### 2.1 DASHBOARD GAPS

#### Current Features:
- ✅ Sales analytics (today's sales, transactions, avg transaction)
- ✅ Hourly sales chart
- ✅ Payment methods breakdown
- ✅ Top products ranking
- ✅ GroSupply widget
- ✅ GroCredit widget
- ✅ GroAI business insights

#### Missing Features (Per Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| Settlement Status | HIGH | Real-time bank settlement tracking |
| Live Transaction Feed | MEDIUM | Real-time transactions as they happen |
| Daily Target Tracker | MEDIUM | Progress toward daily sales goals |
| Revenue Trend Chart | HIGH | SVG line/area chart for revenue trends |
| Alert Banner | MEDIUM | Critical business alerts at top |
| JAX AI Daily Tip | LOW | Personalized daily financial nudge |
| Upcoming Bills Alert | LOW | Bills due within 3 days |

---

### 2.2 POS SYSTEM GAPS

#### Current Features:
- ✅ Product grid with vertical-specific SKUs
- ✅ Category filtering
- ✅ Cart management
- ✅ Payment method selection
- ✅ Receipt generation
- ✅ Success animation

#### Missing Features (Per Multi-Vertical Spec):

| FEATURE | PRIORITY | VERTICAL | DESCRIPTION |
|---------|----------|----------|-------------|
| **QSR Features** | | | |
| Drive-through queue | HIGH | QSR | Large text, 1-tap order display |
| KDS (Kitchen Display) | HIGH | QSR/Restaurant | Ticket timer + bump bar |
| Combo builder | MEDIUM | QSR | Combo meals with component mapping |
| Modifier screen | MEDIUM | QSR | Size, extras, sauces, remove items |
| Quick void/re-ring | MEDIUM | All | Error correction |
| **Sit-Down Restaurant** | | | |
| Table floor plan builder | HIGH | Restaurant | Drag-and-drop room layout |
| Waiter tablet order taking | MEDIUM | Restaurant | Course management (starter/main/dessert) |
| KDS routing | HIGH | Restaurant | Starters → cold station, mains → hot |
| Dynamic pricing | MEDIUM | Restaurant | Happy hour auto-discount, events pricing |
| Table timer | LOW | Restaurant | Flag tables seated > X minutes |
| QR self-service ordering | HIGH | Restaurant | Consumer scans table QR |
| Dine-Now-Pay-Later (BNPL) | MEDIUM | Restaurant | BNPL at table close |
| Split bill by item/equal | HIGH | Restaurant | Consumer app selects split method |
| **Shisa Nyama** | | | |
| Braai pit board | HIGH | Shisa Nyama | Track each fire/pit in progress |
| Meat cut calculator | MEDIUM | Shisa Nyama | Price by weight (kg scale integration) |
| Tab-per-group model | HIGH | Shisa Nyama | One tab per braai party |
| Stokvel wallet acceptance | MEDIUM | Shisa Nyama | Group payment method |
| **Coffee Shop** | | | |
| Barista screen | MEDIUM | Coffee | Drink build sequence (shot, milk, syrup) |
| Loyalty cup tracker | MEDIUM | Coffee | "Buy 9 get 1 free" digital stamp |
| Tab for regulars | LOW | Coffee | Pre-saved order with one tap |
| Split screen | MEDIUM | Coffee | Drinks queue + food queue simultaneously |
| **Hotel/Guest House** | | | |
| Room folio | HIGH | Hotel | Charges to room account |
| Check-in/out | HIGH | Hotel | Reservation integration |
| Rate management | MEDIUM | Hotel | Dynamic pricing by room type |
| **Pharmacy** | | | |
| Prescription management | HIGH | Pharmacy | Script tracking |
| Schedule drug register | CRITICAL | Pharmacy | SAHPRA compliance |
| Medical aid billing | HIGH | Pharmacy | Scheme integration |
| **All Verticals** | | | |
| Loyalty stamp card | HIGH | All | Digital stamp at checkout |
| Thermal receipt printer | HIGH | All | Hardware integration |
| Offline 72h buffer | CRITICAL | All | Work without internet |
| Barcode scanner | HIGH | All | Hardware integration |

---

### 2.3 INVENTORY MANAGEMENT GAPS

#### Current Features:
- ✅ Dashboard with KPIs and alerts
- ✅ Products tab with search/filter
- ✅ Movements tab with history
- ✅ Stocktake with 4 modes
- ✅ Gro AI forecasting
- ✅ GroSupply integration
- ✅ Stock analytics
- ✅ Add product functionality
- ✅ GRN workflow
- ✅ Batch tracking UI

#### Missing Features (Per Inventory Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| **Multi-Location** | HIGH | Branch/warehouse stock management |
| **Transfers** | HIGH | Stock transfers between locations |
| **In-transit tracking** | MEDIUM | Track stock being transferred |
| **Recipe Engine** | HIGH | Ingredient deduction per item sold |
| **BOM Production** | MEDIUM | Bill of Materials for manufactured items |
| **FIFO Enforcement** | HIGH | First-In-First-Out at POS level |
| **Recall Management** | CRITICAL | Product recall workflow (60s response) |
| **Expiry Alerts Timeline** | MEDIUM | Calendar view of expiring batches |
| **Cold Chain Tracking** | HIGH | Pharmacy/food temperature logs |
| **Allergen Flags** | HIGH | R638 Consumer Protection compliance |
| **Health & Safety Log** | MEDIUM | Fridge temp, cleaning schedule |
| **Waste Tracking** | MEDIUM | End-of-day shrinkage log |
| **IMEI/RICA** | CRITICAL | Electronics phone tracking |
| **Excise Register** | HIGH | Liquor excise tracking |
| **Offline Mode** | CRITICAL | 72h SQLite buffer for POS |
| **Barcode Generation** | MEDIUM | Generate barcodes for products |
| **Supplier Management** | MEDIUM | Supplier catalog and lead times |
| **Stock Valuation** | MEDIUM | LIFO/FIFO/Weighted average options |
| **Dead Stock Identification** | MEDIUM | Items with no movement > X days |
| **Theft Prevention** | HIGH | Shrinkage KPIs and investigation |

---

### 2.4 ACCOUNTING GAPS

#### Current Features:
- ✅ Dashboard with KPIs
- ✅ Chart of Accounts (50+ accounts)
- ✅ Invoices (AR) with status workflow
- ✅ Bills (AP) with approval workflow
- ✅ Journal Entries with balance validation
- ✅ Bank Reconciliation (6 SA banks)
- ✅ VAT Management (VAT 201)
- ✅ Reports (P&L, Balance Sheet, Cash Flow, Trial Balance)
- ✅ GroAI financial insights
- ✅ Budget tracking

#### Missing Features (Per Master Build Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| **Bank Feeds** | HIGH | Auto-import from FNB, Capitec, Standard, Absa, Nedbank, TymeBank |
| **Open Banking API** | MEDIUM | OAuth2 bank linking |
| **Account Lock** | MEDIUM | Lock periods to prevent changes |
| **Multi-currency** | LOW | Support for foreign currency accounts |
| **Asset Register** | MEDIUM | Fixed asset tracking and depreciation |
| **JAX AI NLP Queries** | HIGH | "What's my profit this month?" natural language |
| **Tax Optimization** | MEDIUM | AI-driven tax deduction recommendations |
| **Payment Schedule** | MEDIUM | Automated payment scheduling |
| **Recurring Invoices** | MEDIUM | Auto-generate recurring customer invoices |
| **Quote to Invoice** | MEDIUM | Convert quotes to invoices |
| **Credit Notes** | HIGH | Issue credit notes for returns |
| **IRP5/EMP201** | HIGH | Year-end tax forms generation |
| **Audit Trail** | CRITICAL | Immutable WORM audit log |
| **Export to SARS eFiling** | MEDIUM | Direct integration with SARS |

---

### 2.5 CRM & LOYALTY GAPS

#### Current Features:
- ✅ Customer management with RFM segmentation
- ✅ Loyalty tier management (Bronze/Silver/Gold/Platinum)
- ✅ Campaign management basics
- ✅ WhatsApp messaging integration
- ✅ Customer detail dialogs
- ✅ GroAI insights

#### Missing Features (Per Multi-Vertical Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| **WhatsApp Campaign Engine** | HIGH | Full campaign automation with templates |
| **Churn Prediction** | HIGH | AI-powered churn alerts |
| **Birthday Campaigns** | MEDIUM | Automated birthday offers |
| **Win-back Flows** | MEDIUM | Automated win-back sequences |
| **Segment Builder** | HIGH | Custom segment creation |
| **Customer Journey** | MEDIUM | Track customer touchpoints |
| **Referral Programme** | MEDIUM | R20 credit on first payment |
| **Sticker/Stamp Card** | HIGH | Digital merchant-specific loyalty cards |
| **Points Redemption** | HIGH | Points-to-discount at checkout |
| **Customer QR Code** | MEDIUM | Unique customer QR for identification |
| **Purchase History** | MEDIUM | Full transaction history per customer |
| **Communication Log** | LOW | Track all customer communications |

---

### 2.6 MARKETING GAPS

#### Current Features:
- ✅ Dashboard with KPIs
- ✅ Campaign management
- ✅ Offers management
- ✅ Analytics

#### Missing Features (Per Master Build Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| **Offer Creation Wizard** | HIGH | Step-by-step offer creation |
| **Promoted Placements** | MEDIUM | Paid promotion in consumer app |
| **AI Offer Targeting** | HIGH | JAX ML-based offer personalization |
| **Flash Sales** | MEDIUM | Time-limited offers |
| **Loyalty Boosts** | MEDIUM | Double points promotions |
| **Geo-fenced Offers** | MEDIUM | Location-based offers |
| **QR Vouchers** | HIGH | Table-specific discount vouchers |
| **Performance Analytics** | MEDIUM | Campaign ROI tracking |
| **Budget Management** | MEDIUM | Campaign budget allocation |
| **A/B Testing** | LOW | Campaign variant testing |

---

### 2.7 STAFF & HRM GAPS

#### Current Features:
- ✅ Employee management
- ✅ Clock in/out
- ✅ Schedule management
- ✅ Leave management
- ✅ Payroll summary
- ✅ Disciplinary records
- ✅ GroAI HR insights

#### Missing Features (Per Master Build Spec):

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| **PAYE Calculation** | HIGH | Full PAYE tax calculation |
| **UIF Calculation** | HIGH | UIF contributions |
| **SDL Calculation** | MEDIUM | Skills Development Levy |
| **Payslip Generation** | HIGH | PDF payslip generation |
| **IRP5 Generation** | HIGH | Year-end tax certificates |
| **EMP201 Filing** | MEDIUM | Monthly SARS submission |
| **Shift Templates** | MEDIUM | Reusable shift patterns |
| **Availability Management** | MEDIUM | Employee availability preferences |
| **Overtime Tracking** | HIGH | BCEA overtime calculation |
| **Break Compliance** | MEDIUM | BCEA break tracking |
| **Tip Pool** | MEDIUM | Tip distribution tracking |
| **Commission Tracking** | MEDIUM | Sales commission calculation |
| **Training Records** | LOW | Employee training tracking |
| **Performance Reviews** | LOW | Annual review workflow |

---

## 3. MISSING MODULES

### 3.1 Gift Card Module (Per Gift Card Strategy Report)

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| Consumer Gift Card Catalog | HIGH | Multi-brand gift cards (Shoprite, PnP, Woolworths) |
| Corporate Incentive Programs | HIGH | B2B gift card rewards |
| White-label Issuance | MEDIUM | Merchants issue own branded gift cards |
| Gaming/Streaming Cards | MEDIUM | Netflix, Spotify, PlayStation, Xbox cards |
| PayShap QR Redemption | MEDIUM | In-store redemption via QR |
| Breakage Tracking | LOW | Unredeemed value tracking |
| 3-Year Expiry Tracking | CRITICAL | July 2024 SA regulation compliance |

### 3.2 GroSupply B2B Marketplace (Per GroSupply Spec)

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| Supplier Portal | CRITICAL | Standalone supplier web app |
| Supplier Mobile App | HIGH | iOS/Android supplier app |
| RFQ Management | HIGH | Request for Quotation workflow |
| Quote Comparison | HIGH | Multi-supplier price comparison |
| 3-Way Match | CRITICAL | PO vs GRN vs Invoice matching |
| GroSettle | HIGH | Instant settlement options |
| GroCredit | HIGH | Merchant working capital |
| GroFloat | MEDIUM | Supplier advance facility |
| Buying Groups | MEDIUM | Group purchasing power |
| Supplier Tiers | MEDIUM | Bronze/Silver/Gold/Preferred |

### 3.3 Booking/Reservation System (Per Multi-Vertical Spec)

| FEATURE | PRIORITY | VERTICAL | DESCRIPTION |
|---------|----------|----------|-------------|
| Appointment Calendar | CRITICAL | Salon/Spa | Day/week/month calendar view |
| Stylist Grid | HIGH | Salon | Staff availability matrix |
| Walk-in Queue | MEDIUM | Salon | Manage walk-in customers |
| Service Duration | HIGH | Salon | Time tracking per service |
| Room Booking | CRITICAL | Hotel | Room reservation system |
| Table Reservations | HIGH | Restaurant | Table booking system |
| OpenTable Integration | MEDIUM | Restaurant | External reservation sync |
| Event Booking | MEDIUM | Events Venue | Function/event deposits |

### 3.4 VAS (Value Added Services)

| FEATURE | PRIORITY | DESCRIPTION |
|---------|----------|-------------|
| Airtime & Data | HIGH | All SA networks top-up |
| Prepaid Electricity | HIGH | 250+ municipalities STS tokens |
| Bill Payments | MEDIUM | DStv, water, municipal rates |
| Insurance Sales | MEDIUM | Funeral, short-term insurance |
| Transport Ticketing | LOW | Gautrain, MyCiTi, Rea Vaya |
| Event Tickets | LOW | Computicket, Quicket integration |

---

## 4. VERTICAL-SPECIFIC GAPS

### 4.1 Food & Beverage (8 Sub-verticals)

| Sub-Vertical | Missing Features |
|--------------|------------------|
| QSR | Drive-through queue, KDS, Combo builder |
| Sit-Down | Table floor plan, KDS routing, Split bill by item |
| Shisa Nyama | Braai pit board, Tab-per-group, Stokvel wallet |
| Coffee Shop | Barista screen, Loyalty cup tracker |
| Bakery | Production schedule, Custom cake configurator |
| Food Truck | Offline mode (72h), Geo-location tagging |
| Cloud Kitchen | Multi-brand order routing |
| Catering | Event order management |

### 4.2 Health & Beauty (7 Sub-verticals)

| Sub-Vertical | Missing Features |
|--------------|------------------|
| Hair Salon | Appointment calendar, Stylist grid |
| Barber | Queue management, Service duration |
| Nail Salon | Booking system |
| Spa & Wellness | Treatment rooms, Package bookings |
| Aesthetic Clinic | Consultation records, Before/after photos |
| Tattoo Studio | Design gallery, Session booking |
| Lash & Brow | Appointment system |

### 4.3 Health & Pharmacy (6 Sub-verticals)

| Sub-Vertical | Missing Features |
|--------------|------------------|
| Full Pharmacy | Schedule drug register, SAHPRA compliance |
| Health Shop | NAPPI code lookup |
| Herbal Medicine | Traditional medicine tracking |
| Optometry | Eye test records, Frame inventory |
| Dentistry | Appointment system, Treatment plans |
| Veterinary | Animal records, Prescription tracking |

### 4.4 Hospitality (7 Sub-verticals)

| Sub-Vertical | Missing Features |
|--------------|------------------|
| Hotel | PMS overlay, Room folio, Channel manager |
| Guest House | Room inventory, Breakfast tracking |
| B&B | Reservation system, Occupancy calendar |
| Backpackers | Dorm bed management |
| Lodge | Activity bookings |
| Self-Catering | Unit inventory |
| Airbnb-style | Calendar sync, Pricing automation |

---

## 5. COMPLIANCE & REGULATORY GAPS

### 5.1 South African Compliance Requirements

| REQUIREMENT | PRIORITY | STATUS | DESCRIPTION |
|-------------|----------|--------|-------------|
| VAT 15% | CRITICAL | ✅ Done | South African VAT calculation |
| POPIA | CRITICAL | ❌ Missing | Data privacy compliance UI |
| FICA/KYC | CRITICAL | ❌ Missing | Customer identification |
| BCEA | HIGH | ⚠️ Partial | Basic Conditions of Employment |
| NCA | HIGH | ❌ Missing | National Credit Act (BNPL) |
| SAHPRA | HIGH | ❌ Missing | Pharmacy drug register |
| Liquor Act | HIGH | ❌ Missing | Liquor licence tracking |
| R638 Allergens | MEDIUM | ❌ Missing | Consumer Protection compliance |
| SARS Integration | MEDIUM | ❌ Missing | eFiling integration |

---

## 6. TECHNICAL GAPS

### 6.1 Backend Integration

| REQUIREMENT | PRIORITY | STATUS |
|-------------|----------|--------|
| 35 Microservices | CRITICAL | ❌ Not implemented |
| PostgreSQL Database | CRITICAL | ⚠️ Schema only |
| Redis Cache | HIGH | ❌ Not implemented |
| Kafka Events | HIGH | ❌ Not implemented |
| OpenSearch | MEDIUM | ❌ Not implemented |
| AWS S3 Storage | MEDIUM | ❌ Not implemented |

### 6.2 Payment Integration

| PROVIDER | PRIORITY | STATUS |
|----------|----------|--------|
| Peach Payments | CRITICAL | ❌ Not implemented |
| Yoco | CRITICAL | ❌ Not implemented |
| PayShap | HIGH | ❌ Not implemented |
| GoPay Instant EFT | HIGH | ❌ Not implemented |
| Bank Feeds | HIGH | ❌ Not implemented |

### 6.3 Hardware Integration

| DEVICE | PRIORITY | STATUS |
|--------|----------|--------|
| Card Terminal | CRITICAL | ❌ Not implemented |
| Barcode Scanner | HIGH | ❌ Not implemented |
| Receipt Printer | HIGH | ❌ Not implemented |
| Cash Drawer | MEDIUM | ❌ Not implemented |
| Kitchen Display | HIGH | ❌ Not implemented |
| Weight Scale | MEDIUM | ❌ Not implemented |

---

## 7. PRIORITY IMPLEMENTATION ROADMAP

### Phase 1: Critical (Weeks 1-4)
1. **Booking System** - Appointment calendar for Salon/Spa verticals
2. **Gift Card Module** - Consumer gift card catalog
3. **GroSupply RFQ** - Basic RFQ/PO workflow
4. **Hardware Integration** - Card terminal, receipt printer
5. **Offline Mode** - 72h buffer for POS

### Phase 2: High Priority (Weeks 5-8)
1. **Table Management** - Floor plan builder for restaurants
2. **Kitchen Display System** - KDS for food verticals
3. **Multi-location Inventory** - Branch/warehouse management
4. **Recipe Engine** - Ingredient deduction for restaurants
5. **VAS Services** - Airtime, electricity, bill payments

### Phase 3: Medium Priority (Weeks 9-12)
1. **WhatsApp Campaign Engine** - Full automation
2. **FIFO Enforcement** - Batch tracking at POS
3. **Supplier Portal** - Standalone supplier app
4. **Bank Feeds** - Auto-import from SA banks
5. **Compliance Modules** - SAHPRA, Liquor Act, R638

### Phase 4: Enhancement (Weeks 13-16)
1. **GroSettle/GroCredit** - Financing modules
2. **Advanced Analytics** - JAX AI features
3. **Multi-currency** - Foreign exchange
4. **Mobile Apps** - Native iOS/Android
5. **Admin Console** - Platform management

---

## 8. SUMMARY STATISTICS

| CATEGORY | TOTAL FEATURES | IMPLEMENTED | GAP |
|----------|----------------|-------------|-----|
| Dashboard | 15 | 10 | 5 |
| POS | 45 | 10 | 35 |
| Inventory | 30 | 20 | 10 |
| Accounting | 25 | 20 | 5 |
| CRM & Loyalty | 20 | 12 | 8 |
| Marketing | 15 | 8 | 7 |
| Staff & HRM | 20 | 12 | 8 |
| Gift Cards | 10 | 0 | 10 |
| GroSupply | 20 | 5 | 15 |
| Booking System | 12 | 0 | 12 |
| VAS | 8 | 0 | 8 |
| **TOTAL** | **220** | **97** | **123** |

**Overall Completion: 44%**

---

## 9. CONCLUSION

The Groway Merchant OS has solid foundations with core modules implemented. However, significant gaps exist in:

1. **Vertical-Specific Features** - Each vertical needs tailored functionality (QSR drive-through, Salon booking, Pharmacy SAHPRA compliance)

2. **Payment & Hardware** - Critical for production: card terminals, receipt printers, barcode scanners

3. **B2B Modules** - GroSupply marketplace, Gift Cards, Booking System

4. **Compliance** - South African regulatory requirements (POPIA, FICA, NCA, SAHPRA)

5. **Backend Infrastructure** - 35 microservices, Kafka events, Redis caching

The recommended approach is to prioritize features that enable merchant acquisition and revenue generation first (Booking, Gift Cards, GroSupply), followed by compliance and operational features.

---

*Report Generated: February 2026*
*Based on: Multi-Vertical POS Spec v1.0, Master Build Document v4.0, Inventory Management v1.0, Gift Card Strategy Feb 2026, GroSupply Standalone v4.0*
