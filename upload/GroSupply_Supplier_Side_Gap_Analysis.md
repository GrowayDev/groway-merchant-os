# GroSupply Supplier-Side Gap Analysis

**Document Version:** 1.0  
**Date:** January 2026  
**Focus:** Supplier Portal & Supplier-Side Features

---

## Executive Summary

This gap analysis compares the **GroSupply Standalone Specification v4.0** against the current implementation, with a **strong focus on the supplier side** of the two-sided marketplace. The analysis reveals significant gaps in the supplier portal, supplier mobile app, and supplier-specific functionality.

### Critical Gap Overview

| Category | Spec Requirement | Current Status | Gap Level |
|----------|------------------|----------------|-----------|
| Supplier Portal (Web) | Full standalone app | ❌ Not implemented | **CRITICAL** |
| Supplier Mobile App | React Native iOS/Android | ❌ Not implemented | **CRITICAL** |
| RFQ Management | Full quote submission flow | ⚠️ Partial | **HIGH** |
| Order Management | Dispatch, tracking, invoicing | ⚠️ Partial | **HIGH** |
| Settlement Tracker | GroSettle integration | ❌ Not implemented | **HIGH** |
| Product Catalogue | Supplier product management | ⚠️ Basic model exists | **MEDIUM** |
| Dispute Resolution | Full dispute workflow | ❌ Not implemented | **MEDIUM** |
| Compliance Tracking | B-BBEE, SAHPRA, liquor licences | ⚠️ Basic fields only | **MEDIUM** |
| Supplier Analytics | Performance dashboards | ❌ Not implemented | **MEDIUM** |

---

## 1. Supplier Portal (Web) - CRITICAL GAP

### Spec Requirements
The specification defines a **standalone React 18 web application** deployed at `supplier.grosupply.co.za` with:
- Separate authentication (JWT with supplier_id claim)
- Multi-language support (English, Afrikaans, Zulu, Shona)
- PWA support for offline functionality
- Complete order management interface

### Current Implementation
- **Only a supplier onboarding form** exists at `/grosupply/supplier/onboarding`
- **No dedicated supplier portal** for logged-in suppliers
- Supplier onboarding creates a record but no login/dashboard

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Supplier Authentication | JWT-based login with supplier_id claim | P0 |
| Dashboard | Order overview, pending actions, revenue | P0 |
| Order Management | View orders, accept/reject, update status | P0 |
| RFQ Response | Submit quotes with pricing, MOQ, lead time | P0 |
| Dispatch Management | Confirm dispatch, add tracking numbers | P0 |
| Invoice Submission | Upload PDF invoices, 3-way match status | P1 |
| Product Catalogue | Manage listed products, pricing, stock | P1 |
| Settlement Tracker | View GroSettle payments, pending amounts | P1 |
| Dispute Centre | Raise/respond to disputes | P2 |
| Profile Management | Update business details, documents | P2 |
| Analytics Dashboard | Sales trends, product performance | P2 |
| Multi-language | i18n support for SADC suppliers | P2 |
| PWA Support | Offline capability, push notifications | P2 |

---

## 2. Supplier Mobile App - CRITICAL GAP

### Spec Requirements
A **standalone React Native application** for iOS and Android with:
- Order notifications (push)
- Order details and acceptance
- Dispatch confirmation with tracking input
- Delivery proof (photo + GPS)
- GRN confirmation
- Dispute raise functionality

### Current Implementation
- **No supplier mobile app** implemented
- Only merchant-side GRN scanning exists in Merchant OS

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Push Notifications | New RFQs, order updates, payment alerts | P0 |
| Order Alerts | Real-time order notifications | P0 |
| Order Details | View full order information | P0 |
| Dispatch Confirmation | Capture tracking number, courier, ETA | P0 |
| Delivery Proof | Photo capture + GPS coordinates | P1 |
| Quote Submission | Quick quote on RFQs | P1 |
| GRN Confirmation | Acknowledge receipt confirmation | P1 |
| Dispute Raise | Quick dispute submission | P2 |
| Invoice Upload | Camera capture for invoices | P2 |
| Offline Mode | Queue actions when offline | P2 |

---

## 3. RFQ & Quote Management - HIGH GAP

### Spec Requirements

**Data Flow Stage 3 - Supplier Quoting:**
> Suppliers receive push notification + email. Log in to Supplier Portal or App. Submit quote: unit price, MOQ, lead time, delivery terms. Quote valid for 48 hours.

### Current Implementation
- RFQ model exists with `SupplierQuote` model
- **No supplier-facing interface** to submit quotes
- Quote comparison matrix exists for merchants but no supplier submission flow

### Missing Supplier-Side Features

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| RFQ Notification | ❌ | Email + Push | Missing |
| Quote Submission Form | ❌ | Full form | Missing |
| Unit Price Entry | ❌ | Per line item | Missing |
| MOQ Specification | ❌ | Minimum order qty | Missing |
| Lead Time Entry | ❌ | Delivery days | Missing |
| Delivery Terms | ❌ | Incoterms, etc. | Missing |
| Quote Validity | ❌ | 48-hour expiry | Missing |
| Quote Edit/Withdraw | ❌ | Before acceptance | Missing |
| Quote History | ❌ | Past submissions | Missing |

---

## 4. Order Management & Dispatch - HIGH GAP

### Spec Requirements

**Data Flow Stage 6 - Dispatch & Delivery:**
> Supplier confirms dispatch in portal: tracking number, courier, estimated delivery. Merchant app notified. Real-time tracking via GroDeliver API or supplier tracking number.

### Current Implementation
- `PurchaseOrder` model exists with status tracking
- `OrderTrackingEvent` model exists
- **No supplier interface** to manage dispatch

### Missing Supplier-Side Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Order Acceptance | Accept/reject incoming orders | P0 |
| Order Queue | View pending, confirmed, shipped orders | P0 |
| Dispatch Confirmation | Enter tracking number, courier, ETA | P0 |
| Order Status Updates | Update order status stages | P0 |
| Packing Slip | Generate/print packing slips | P1 |
| Shipping Labels | Generate shipping labels | P1 |
| Bulk Dispatch | Dispatch multiple orders | P1 |
| Delivery Scheduling | Schedule delivery slots | P2 |
| Real-time Tracking | Integration with GroDeliver API | P2 |

---

## 5. Invoice & Settlement - HIGH GAP

### Spec Requirements

**Data Flow Stage 8 - Invoice Submission:**
> Supplier uploads invoice (PDF) in portal. GroSupply runs 3-way match: PO quantities + prices vs GRN vs invoice. Variance > 5% triggers review queue.

**GroSettle Integration:**
> Instant settlement option. Settlement tracker showing pending, processing, completed payments.

### Current Implementation
- No invoice upload functionality
- No 3-way match implementation
- No GroSettle supplier view

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Invoice Upload | PDF/image upload | P0 |
| 3-Way Match Status | View match results, variances | P0 |
| Invoice History | Past invoices, status | P0 |
| Settlement Dashboard | GroSettle payment tracker | P1 |
| Payment History | View all payments received | P1 |
| Instant Settlement | Request early payment | P1 |
| Payment Remittance | Download remittance advice | P2 |
| Tax Documents | Generate supplier tax docs | P2 |

---

## 6. Product Catalogue Management - MEDIUM GAP

### Spec Requirements
Suppliers maintain their product catalogue with:
- Product listings with SKU, name, description
- Pricing tiers and bulk discounts
- Stock levels and availability
- Product images and specifications
- Category mappings

### Current Implementation
- `SupplierProduct` model exists with pricing, stock, bulk pricing
- `SupplierBulkPricing` model for volume discounts
- `SupplierProductInventory` links to merchant inventory
- **No supplier interface** to manage products

### Missing Supplier-Side Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Product Listing | Add/edit/delete products | P1 |
| Bulk Import | CSV/Excel product upload | P1 |
| Image Management | Upload product images | P1 |
| Pricing Management | Set prices, bulk tiers | P1 |
| Stock Updates | Update availability, quantities | P1 |
| Category Mapping | Map products to categories | P2 |
| Product Analytics | View performance metrics | P2 |

---

## 7. Dispute Resolution - MEDIUM GAP

### Spec Requirements
Full dispute workflow:
- Merchant or supplier raises dispute
- Admin console manages resolution
- Both parties notified of updates
- Dispute resolution affects ratings

### Current Implementation
- No dispute model or functionality implemented

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Dispute Model | Database schema for disputes | P1 |
| Raise Dispute | Supplier can raise disputes | P1 |
| View Disputes | List of open/closed disputes | P1 |
| Respond to Disputes | Add comments, evidence | P1 |
| Dispute History | Past disputes, resolutions | P2 |
| Rating Impact | Disputes affect supplier rating | P2 |

---

## 8. Compliance & Verification - MEDIUM GAP

### Spec Requirements

From Section 4.1 Admin Console:
> B-BBEE certificate expiry alerts (60/30/7 days). SAHPRA registration expiry (pharmacy suppliers). Liquor licence expiry (liquor/bar suppliers). CIPC renewal. FICA re-verification schedule.

### Current Implementation
- `SupplierDocument` model exists for documents
- `bbbeeLevel` field exists on Supplier
- No expiry tracking or alerts
- No compliance dashboard for suppliers

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Document Expiry Alerts | Notify before expiry | P1 |
| B-BBEE Tracker | Certificate status, renewal | P1 |
| SAHPRA Compliance | Pharmacy supplier tracking | P2 |
| Liquor Licence | Liquor supplier tracking | P2 |
| FICA Status | Verification status | P2 |
| Compliance Dashboard | Supplier-facing compliance view | P2 |

---

## 9. Supplier Analytics - MEDIUM GAP

### Spec Requirements
Analytics module for suppliers:
- Sales trends by product, category
- Order volume trends
- Revenue tracking
- Quote acceptance rate
- Fulfilment rate metrics

### Current Implementation
- `fulfillmentRate`, `rating`, `reviewCount` fields exist
- No analytics dashboard or reporting

### Missing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Sales Dashboard | Revenue, orders, trends | P2 |
| Product Performance | Top products, slow movers | P2 |
| Quote Analytics | Acceptance rate, avg pricing | P2 |
| Customer Insights | Top merchants, repeat orders | P2 |
| Export Reports | PDF/Excel exports | P2 |

---

## 10. Supplier Onboarding - PARTIAL IMPLEMENTATION

### Current State
✅ Multi-step onboarding form exists  
✅ Business info, contact, verticals, categories, banking  
✅ Document templates for download  
✅ Document upload after submission  
⚠️ No authentication created for suppliers  
⚠️ No approval workflow  

### Improvements Needed

| Feature | Current | Required |
|---------|---------|----------|
| Email Verification | ❌ | Verify email on registration |
| Admin Approval | ❌ | Admin reviews and approves |
| Welcome Email | ❌ | Send credentials/instructions |
| Self-Service Login | ❌ | Create supplier account |
| Profile Completion | ⚠️ | Track completion percentage |

---

## 11. Backend API Endpoints Gap

### Spec Requirements
The spec defines a complete set of supplier-specific API endpoints:

### Current Supplier-Side Endpoints

| Endpoint | Method | Current | Required |
|----------|--------|---------|----------|
| `/supplier/auth/login` | POST | ❌ | Authenticate supplier |
| `/supplier/auth/logout` | POST | ❌ | End session |
| `/supplier/profile` | GET/PUT | ❌ | Manage profile |
| `/supplier/orders` | GET | ❌ | List supplier's orders |
| `/supplier/orders/:id` | GET | ❌ | Order details |
| `/supplier/orders/:id/accept` | POST | ❌ | Accept order |
| `/supplier/orders/:id/dispatch` | POST | ❌ | Confirm dispatch |
| `/supplier/rfqs` | GET | ❌ | List RFQs for supplier |
| `/supplier/rfqs/:id/quote` | POST | ❌ | Submit quote |
| `/supplier/invoices` | GET/POST | ❌ | Manage invoices |
| `/supplier/products` | GET/POST/PUT | ❌ | Product catalogue |
| `/supplier/settlements` | GET | ❌ | Payment tracker |
| `/supplier/disputes` | GET/POST | ❌ | Dispute management |
| `/supplier/analytics` | GET | ❌ | Performance metrics |

---

## 12. Kafka Event Topics - Missing Integration

### Spec Requirements
Event-driven architecture with Kafka topics:

| Topic | Producer | Consumer Action |
|-------|----------|-----------------|
| `grosupply.rfq.created` | GroSupply Service | Alert eligible suppliers |
| `grosupply.po.created` | GroSupply Service | Email PO to supplier |
| `grosupply.po.dispatched` | GroSupply Service | Alert merchant |
| `grosupply.invoice.matched` | GroSupply Service | Accounting journal |
| `grosupply.dispute.raised` | GroSupply Service | Alert both parties |
| `grosupply.payment.settled` | GroSupply Service | Journal, notification |

### Current Implementation
- No Kafka integration implemented
- Events not emitted for integrations

---

## Implementation Priority Matrix

### Phase 1: Foundation (P0 - Weeks 1-4)
1. **Supplier Authentication System**
   - JWT-based auth with supplier_id claim
   - Login/logout functionality
   - Session management

2. **Supplier Portal Dashboard**
   - Basic dashboard with order overview
   - Pending actions widget
   - Revenue summary

3. **Order Management**
   - Order list view
   - Order detail page
   - Accept/Reject functionality
   - Dispatch confirmation

4. **RFQ Response System**
   - RFQ list view
   - Quote submission form
   - Quote status tracking

### Phase 2: Core Features (P1 - Weeks 5-8)
1. **Invoice Management**
   - Invoice upload
   - 3-way match status view
   - Invoice history

2. **Settlement Tracker**
   - GroSettle integration
   - Payment history
   - Settlement status

3. **Product Catalogue**
   - Product management
   - Pricing tiers
   - Stock updates

4. **Compliance Dashboard**
   - Document expiry alerts
   - B-BBEE tracking
   - Verification status

### Phase 3: Mobile & Advanced (P2 - Weeks 9-12)
1. **Supplier Mobile App**
   - React Native app
   - Push notifications
   - Core order/RFQ features

2. **Analytics Dashboard**
   - Sales trends
   - Product performance
   - Customer insights

3. **Dispute Resolution**
   - Full dispute workflow
   - Resolution tracking

4. **Multi-language & PWA**
   - i18n implementation
   - PWA capabilities

---

## Recommended Next Steps

### Immediate Actions (This Sprint)
1. **Create Supplier Portal Route Structure**
   ```
   /grosupply/supplier/portal/
   /grosupply/supplier/portal/dashboard
   /grosupply/supplier/portal/orders
   /grosupply/supplier/portal/rfqs
   /grosupply/supplier/portal/products
   /grosupply/supplier/portal/invoices
   /grosupply/supplier/portal/settlements
   ```

2. **Implement Supplier Authentication**
   - Extend existing auth system
   - Add supplier role/claim
   - Create login page

3. **Build Supplier Dashboard**
   - Order count widgets
   - Pending RFQ alerts
   - Revenue summary
   - Quick actions

### Technical Debt
1. Add Kafka event emission to existing flows
2. Create supplier-specific API routes
3. Implement proper supplier authorization middleware
4. Add document expiry tracking

---

## Conclusion

The GroSupply implementation has made good progress on the **merchant side** with marketplace browsing, supplier onboarding, and basic data models. However, the **supplier side** is critically underdeveloped with:

1. **No supplier portal** for logged-in suppliers
2. **No supplier mobile app** 
3. **No supplier-facing order management**
4. **No RFQ/quote submission interface**
5. **No invoice/settlement management**

The gap analysis reveals that approximately **70% of supplier-side functionality** specified in v4.0 is not yet implemented. Priority should be given to building the supplier portal foundation, authentication system, and core order/RFQ management features.
