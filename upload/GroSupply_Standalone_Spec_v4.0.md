+-----------------------------------------------------------------------+
| **GroSupply**                                                         |
|                                                                       |
| **Standalone B2B Procurement Platform**                               |
|                                                                       |
| Complete Technical Specification --- Frontend · Backend · Admin       |
| Console                                                               |
|                                                                       |
| Merchant Procurement · Supplier Marketplace · GroSettle · GroCredit · |
| GroFloat                                                              |
|                                                                       |
| v4.0 \| February 2026                                                 |
+-----------------------------------------------------------------------+

+-----------------------+-----------------------+-----------------------+
| **Merchant Portal**   | **Supplier Portal**   | **Admin Console**     |
|                       |                       |                       |
| Web App + React       | Web App + React       | Web App (Internal)    |
| Native                | Native                |                       |
+-----------------------+-----------------------+-----------------------+

+-----------------------------------------------------------------------+
| **Standalone Design Principle**                                       |
|                                                                       |
| GroSupply is designed as a fully independent bounded context. It has  |
| its own frontend applications, its own backend service (Port 3040),   |
| its own PostgreSQL schema, its own event topics on Kafka, and its own |
| Admin Console. It integrates with the Groway platform via             |
| well-defined APIs: it consumes merchant inventory data, pushes        |
| journal entries to the Accounting Service, and triggers payments via  |
| the Wallet/GoPay payment rail. Developers can build and deploy        |
| GroSupply independently without touching any other Groway service.    |
+-----------------------------------------------------------------------+

**1. GroSupply Architecture**

GroSupply is a two-sided B2B marketplace: (Side A) Groway merchants
source and purchase stock; (Side B) suppliers list products, receive
orders, dispatch, invoice, and get paid. A neutral GroSupply Ops layer
manages the marketplace, disputes, compliance, and financial controls.

**1.1 System Components**

  ------------------ ----------------------------------------------------
  **Component**      **Technology & Description**

  **GroSupply        Node.js TypeScript microservice (Port 3040). Owns:
  Service**          RFQ, PO, GRN, invoice matching, supplier management,
                     GroSettle, GroCredit, GroFloat. PostgreSQL database:
                     grosupply schema.

  **Merchant Portal  React 18 + TypeScript web app. Integrated as a
  (Web)**            module within the Groway Merchant OS dashboard.
                     Route: /merchant/procurement. Accessible on desktop
                     and tablet.

  **Merchant App     React Native. GRN scanning (camera barcode), PO
  (Mobile)**         approval on the go, delivery confirmation, supplier
                     payment. Integrated in Merchant mobile app.

  **Supplier Portal  Standalone React 18 web application
  (Web)**            (app.grosupply.co.za/supplier). Suppliers log in
                     separately. Order management, catalogue, dispatch,
                     invoice, settlement tracker.

  **Supplier App     React Native. Order notifications, GRN confirmation,
  (Mobile)**         delivery proof (photo + GPS), dispute raise. iOS +
                     Android. Available on App Store and Play Store.

  **GroSupply Admin  React 18 admin web app (admin.grosupply.co.za).
  Console**          Supplier onboarding review, dispute management,
                     GroSettle approval, GroCredit portfolio, marketplace
                     health dashboard.

  **Event            Kafka topics: grosupply.po.created,
  Integration**      grosupply.grn.completed, grosupply.invoice.matched,
                     grosupply.payment.settled, grosupply.dispute.raised.
                     Consumed by: Inventory Service, Accounting Service,
                     Notification Service.
  ------------------ ----------------------------------------------------

**1.2 Data Flow --- Complete Procurement Lifecycle**

  -------- --------------------- ---------------------------------------------
  **\#**   **Stage**             **System Action**

  **1**    Low Stock Trigger     Inventory Service → Kafka event
                                 inventory.low_stock → GroSupply Service
                                 creates auto-draft RFQ and notifies merchant.

  **2**    RFQ Creation          Merchant confirms or creates RFQ: product,
                                 quantity, delivery date, location. GroSupply
                                 routes to all eligible suppliers
                                 (vertical-filtered, B-BBEE tier optionally
                                 applied).

  **3**    Supplier Quoting      Suppliers receive push notification + email.
                                 Log in to Supplier Portal or App. Submit
                                 quote: unit price, MOQ, lead time, delivery
                                 terms. Quote valid for 48 hours.

  **4**    Quote Comparison      Merchant views comparison matrix: price,
                                 delivery date, B-BBEE score, supplier rating,
                                 total cost. Selects winner or splits order.

  **5**    Purchase Order        GroSupply auto-generates PO from accepted
                                 quote: PO number, line items, quantities,
                                 agreed prices, delivery address, payment
                                 terms. PDF dispatched to supplier via email +
                                 portal.

  **6**    Dispatch & Delivery   Supplier confirms dispatch in portal:
                                 tracking number, courier, estimated delivery.
                                 Merchant app notified. Real-time tracking via
                                 GroDeliver API or supplier tracking number.

  **7**    GRN Processing        Merchant receives goods. Opens GRN on mobile
                                 app: scan barcodes, confirm quantities,
                                 capture batch numbers, expiry dates, unit
                                 costs. Flag shortages/damages. Complete GRN →
                                 Inventory Service updated via Kafka.

  **8**    Invoice Submission    Supplier uploads invoice (PDF) in portal.
                                 GroSupply runs 3-way match: PO quantities +
                                 prices vs GRN vs invoice. Variance \>5% →
                                 review queue. Match → payable created.

  **9**    Accounting Journal    On invoice match approval: Accounting Service
                                 receives Kafka event → auto-journal: Dr
                                 Purchases/Stock, Cr Accounts Payable. No
                                 manual entry required.

  **10**   GroSettle Payment     Merchant (or Groway) pays supplier via
                                 GroSettle: instant (4h), 30-day, or 60-day.
                                 Dynamic discount if early payment offered.
                                 Payment via GoPay EFT or Groway Business
                                 Account. Accounting Service journals payment:
                                 Dr AP, Cr Bank.
  -------- --------------------- ---------------------------------------------

**2. Backend API --- Complete Endpoint Registry**

All GroSupply API endpoints are prefixed /v1/grosupply/. Merchant
endpoints require JWT + merchant_id. Supplier endpoints require JWT +
supplier_id. Admin endpoints require Admin JWT + MFA.

**2.1 Merchant Procurement Endpoints**

  ------------ --------------------------------------- --------------------------------- ---------------
  **M**        **Route**                               **Description**                   **Auth**

  **GET**      /v1/grosupply/catalogue                 Browse supplier catalogue         JWT+Merchant
                                                       (vertical-filtered, B-BBEE        
                                                       filter)                           

  **GET**      /v1/grosupply/catalogue/search          Search catalogue by product       JWT+Merchant
                                                       name/barcode/SKU                  

  **GET**      /v1/grosupply/suppliers                 List suppliers for merchant\'s    JWT+Merchant
                                                       vertical                          

  **GET**      /v1/grosupply/suppliers/:id             Supplier profile: rating, tier,   JWT+Merchant
                                                       compliance, delivery zones        

  **GET**      /v1/grosupply/suppliers/:id/products    Supplier\'s product catalogue     JWT+Merchant

  **POST**     /v1/grosupply/rfq                       Create RFQ (manual or from        JWT+Merchant
                                                       reorder trigger)                  

  **GET**      /v1/grosupply/rfq                       List RFQs with status             JWT+Merchant

  **GET**      /v1/grosupply/rfq/:id                   RFQ detail with all submitted     JWT+Merchant
                                                       quotes                            

  **POST**     /v1/grosupply/rfq/:id/accept            Accept quote, auto-generate PO    JWT+Manager

  **POST**     /v1/grosupply/rfq/:id/split             Split order across multiple       JWT+Manager
                                                       suppliers                         

  **GET**      /v1/grosupply/po                        Purchase Order list               JWT+Merchant

  **GET**      /v1/grosupply/po/:id                    PO detail + line items + delivery JWT+Merchant
                                                       status                            

  **GET**      /v1/grosupply/po/:id/pdf                Download PO as PDF                JWT+Merchant

  **DELETE**   /v1/grosupply/po/:id                    Cancel PO (before dispatch)       JWT+Manager

  **POST**     /v1/grosupply/grn                       Create GRN for delivered order    JWT+Merchant

  **PUT**      /v1/grosupply/grn/:id                   Update GRN (add items, flag       JWT+Merchant
                                                       issues)                           

  **POST**     /v1/grosupply/grn/:id/complete          Complete GRN, trigger inventory   JWT+Manager
                                                       update                            

  **GET**      /v1/grosupply/invoices                  Supplier invoices list            JWT+Merchant

  **GET**      /v1/grosupply/invoices/:id              Invoice detail + 3-way match      JWT+Merchant
                                                       status                            

  **POST**     /v1/grosupply/invoices/:id/approve      Approve invoice, create payable   JWT+Manager

  **POST**     /v1/grosupply/invoices/:id/dispute      Raise invoice dispute             JWT+Merchant

  **GET**      /v1/grosupply/payments                  Payment history to suppliers      JWT+Merchant

  **POST**     /v1/grosupply/payments/:invoiceId/pay   Pay supplier via GroSettle option JWT+Owner+PIN

  **GET**      /v1/grosupply/gro-credit/status         GroCredit facility status +       JWT+Merchant
                                                       available                         

  **POST**     /v1/grosupply/gro-credit/draw           Draw GroCredit for PO payment     JWT+Owner

  **GET**      /v1/grosupply/buying-group              Merchant\'s buying group          JWT+Merchant
                                                       membership                        

  **POST**     /v1/grosupply/buying-group              Create buying group               JWT+Merchant

  **POST**     /v1/grosupply/buying-group/:id/join     Join existing buying group        JWT+Merchant

  **GET**      /v1/grosupply/reorder/recommendations   AI reorder recommendations        JWT+Merchant

  **GET**      /v1/grosupply/analytics/spend           Spend analysis by                 JWT+Merchant
                                                       supplier/category                 
  ------------ --------------------------------------- --------------------------------- ---------------

**2.2 Supplier Portal Endpoints**

  ------------ --------------------------------------------- --------------------------------- -------------------
  **M**        **Route**                                     **Description**                   **Auth**

  **POST**     /v1/grosupply/supplier/register               Supplier onboarding: business     Public
                                                             details + docs                    

  **GET**      /v1/grosupply/supplier/profile                Supplier profile + tier +         JWT+Supplier
                                                             compliance status                 

  **PUT**      /v1/grosupply/supplier/profile                Update supplier profile           JWT+Supplier

  **POST**     /v1/grosupply/supplier/documents              Upload compliance documents       JWT+Supplier

  **GET**      /v1/grosupply/supplier/catalogue              Manage own product catalogue      JWT+Supplier

  **POST**     /v1/grosupply/supplier/catalogue/product      Add product to catalogue          JWT+Supplier

  **PUT**      /v1/grosupply/supplier/catalogue/:sku         Update product listing            JWT+Supplier
                                                             (price/stock/images)              

  **DELETE**   /v1/grosupply/supplier/catalogue/:sku         Remove product from catalogue     JWT+Supplier

  **POST**     /v1/grosupply/supplier/catalogue/bulk         Bulk upload products via CSV      JWT+Supplier

  **GET**      /v1/grosupply/supplier/rfq                    Incoming RFQ list                 JWT+Supplier

  **GET**      /v1/grosupply/supplier/rfq/:id                RFQ detail                        JWT+Supplier

  **POST**     /v1/grosupply/supplier/rfq/:id/quote          Submit quote for RFQ              JWT+Supplier

  **PUT**      /v1/grosupply/supplier/rfq/:id/quote          Revise submitted quote            JWT+Supplier

  **GET**      /v1/grosupply/supplier/po                     Purchase Orders received          JWT+Supplier

  **GET**      /v1/grosupply/supplier/po/:id                 PO detail                         JWT+Supplier

  **POST**     /v1/grosupply/supplier/po/:id/confirm         Confirm PO + estimated delivery   JWT+Supplier

  **POST**     /v1/grosupply/supplier/po/:id/dispatch        Mark as dispatched + tracking     JWT+Supplier
                                                             number                            

  **POST**     /v1/grosupply/supplier/invoices               Submit invoice for matched GRN    JWT+Supplier

  **GET**      /v1/grosupply/supplier/invoices               Invoice list + status             JWT+Supplier

  **GET**      /v1/grosupply/supplier/settlements            GroSettle payment tracker         JWT+Supplier

  **POST**     /v1/grosupply/supplier/settlements/option     Choose settlement option          JWT+Supplier
                                                             (instant/30/60/discount)          

  **GET**      /v1/grosupply/supplier/gro-float/status       GroFloat credit facility status   JWT+Supplier

  **GET**      /v1/grosupply/supplier/analytics              Demand analytics: SKU velocity,   JWT+Gold+Supplier
                                                             merchant reach                    

  **GET**      /v1/grosupply/supplier/analytics/heatmap      Geographic merchant demand heat   JWT+Gold+Supplier
                                                             map                               

  **POST**     /v1/grosupply/supplier/promotions             Create promotional offer visible  JWT+Gold+Supplier
                                                             to merchants                      

  **GET**      /v1/grosupply/supplier/disputes               Dispute list + status             JWT+Supplier

  **POST**     /v1/grosupply/supplier/disputes/:id/respond   Respond to dispute                JWT+Supplier
                                                             (accept/contest)                  
  ------------ --------------------------------------------- --------------------------------- -------------------

**2.3 GroSupply Admin Endpoints**

  ---------- ----------------------------------------- --------------------------------- -------------
  **M**      **Route**                                 **Description**                   **Auth**

  **GET**    /admin/grosupply/dashboard                Marketplace health: GMV, active   Admin+MFA
                                                       suppliers, disputes               

  **GET**    /admin/grosupply/suppliers                All suppliers: tier, status,      Admin
                                                       compliance                        

  **POST**   /admin/grosupply/suppliers/:id/approve    Approve supplier onboarding       Admin+MFA

  **POST**   /admin/grosupply/suppliers/:id/suspend    Suspend supplier                  Admin+MFA

  **PUT**    /admin/grosupply/suppliers/:id/tier       Update supplier tier              Admin
                                                       (Bronze→Silver→Gold)              

  **GET**    /admin/grosupply/disputes                 All disputes by status + age      Admin

  **POST**   /admin/grosupply/disputes/:id/resolve     Admin dispute resolution +        Admin+MFA
                                                       outcome                           

  **GET**    /admin/grosupply/gro-settle/queue         Pending GroSettle payments for    Finance
                                                       approval                          

  **POST**   /admin/grosupply/gro-settle/:id/approve   Approve GroSettle payment release Finance+MFA

  **GET**    /admin/grosupply/gro-credit/portfolio     GroCredit merchant loan portfolio Finance

  **POST**   /admin/grosupply/gro-credit/:id/approve   Approve GroCredit facility        Finance+MFA
                                                       increase                          

  **GET**    /admin/grosupply/gro-float/portfolio      GroFloat supplier facility        Finance
                                                       overview                          

  **GET**    /admin/grosupply/compliance               Supplier compliance status: docs, Compliance
                                                       BBBEE, licences                   

  **GET**    /admin/grosupply/analytics                Marketplace analytics: GMV,       Admin
                                                       category, corridor                

  **GET**    /admin/grosupply/buying-groups            All buying groups: size, volume,  Admin
                                                       status                            

  **GET**    /admin/grosupply/audit                    GroSupply audit log               Admin
  ---------- ----------------------------------------- --------------------------------- -------------

**3. Database Schema --- Complete GroSupply Tables**

**3.1 Core Tables**

CREATE TABLE gs_suppliers (

supplier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

company_name VARCHAR(200) NOT NULL,

trading_name VARCHAR(200),

registration_number VARCHAR(50) NOT NULL,

vat_number VARCHAR(15),

bbbee_level INTEGER,

bbbee_cert_expiry DATE,

vertical_categories TEXT\[\] NOT NULL, \--
\[\'grocery\',\'pharmacy\',\'bar\'\...\]

tier VARCHAR(20) DEFAULT \'bronze\', \-- bronze/silver/gold/preferred

performance_score DECIMAL(3,1) DEFAULT 5.0, \-- 1.0-10.0

on_time_delivery_pct DECIMAL(5,2),

quality_dispute_rate DECIMAL(5,2),

kyb_status VARCHAR(20) DEFAULT \'pending\',

bank_account JSONB, \-- encrypted

settlement_preference VARCHAR(20) DEFAULT \'net30\',

status VARCHAR(20) DEFAULT \'pending\', \-- pending/active/suspended

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE gs_rfq (

rfq_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),

rfq_number VARCHAR(20) UNIQUE NOT NULL, \-- RFQ-2026-00001

vertical_type VARCHAR(30) NOT NULL,

line_items JSONB NOT NULL, \-- \[{sku, description, qty, unit, notes}\]

delivery_address JSONB NOT NULL,

required_by DATE NOT NULL,

notes TEXT,

status VARCHAR(20) DEFAULT \'open\', \-- open/quoted/awarded/cancelled

source VARCHAR(20) DEFAULT \'manual\', \-- manual/auto_reorder

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE gs_rfq_quotes (

quote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

rfq_id UUID NOT NULL REFERENCES gs_rfq(rfq_id),

supplier_id UUID NOT NULL REFERENCES gs_suppliers(supplier_id),

line_items JSONB NOT NULL, \-- \[{sku, qty, unit_price_cents,
total_cents, lead_days}\]

subtotal_cents INTEGER NOT NULL,

vat_cents INTEGER NOT NULL,

total_cents INTEGER NOT NULL,

delivery_cost_cents INTEGER DEFAULT 0,

delivery_days INTEGER NOT NULL,

payment_terms VARCHAR(30), \-- \'net30\', \'net60\', \'immediate\'

early_payment_discount DECIMAL(4,2),

valid_until TIMESTAMP NOT NULL,

notes TEXT,

status VARCHAR(20) DEFAULT \'submitted\', \--
submitted/accepted/rejected

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE gs_purchase_orders (

po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

po_number VARCHAR(20) UNIQUE NOT NULL, \-- PO-2026-00001

merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),

supplier_id UUID NOT NULL REFERENCES gs_suppliers(supplier_id),

rfq_id UUID REFERENCES gs_rfq(rfq_id),

quote_id UUID REFERENCES gs_rfq_quotes(quote_id),

line_items JSONB NOT NULL,

subtotal_cents INTEGER NOT NULL,

vat_cents INTEGER NOT NULL,

total_cents INTEGER NOT NULL,

delivery_address JSONB NOT NULL,

requested_delivery_date DATE NOT NULL,

payment_terms VARCHAR(30) NOT NULL,

status VARCHAR(20) DEFAULT \'sent\', \--
sent/confirmed/dispatched/delivered/cancelled

dispatched_at TIMESTAMP,

tracking_number VARCHAR(100),

courier VARCHAR(100),

pdf_url TEXT,

notes TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE gs_grn (

grn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

grn_number VARCHAR(20) UNIQUE NOT NULL,

po_id UUID NOT NULL REFERENCES gs_purchase_orders(po_id),

merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),

supplier_id UUID NOT NULL REFERENCES gs_suppliers(supplier_id),

received_by UUID REFERENCES merchant_staff(staff_id),

line_items JSONB NOT NULL, \-- \[{sku, qty_ordered, qty_received,
qty_rejected, batch, expiry, unit_cost}\]

total_received INTEGER NOT NULL,

has_variance BOOLEAN DEFAULT FALSE,

variance_notes TEXT,

status VARCHAR(20) DEFAULT \'draft\', \-- draft/complete/disputed

completed_at TIMESTAMP,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE gs_supplier_invoices (

invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

invoice_number VARCHAR(50) NOT NULL,

po_id UUID NOT NULL REFERENCES gs_purchase_orders(po_id),

grn_id UUID REFERENCES gs_grn(grn_id),

supplier_id UUID NOT NULL REFERENCES gs_suppliers(supplier_id),

merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),

invoice_date DATE NOT NULL,

line_items JSONB NOT NULL,

subtotal_cents INTEGER NOT NULL,

vat_cents INTEGER NOT NULL,

total_cents INTEGER NOT NULL,

invoice_pdf_url TEXT,

match_status VARCHAR(20) DEFAULT \'pending\', \--
pending/matched/variance/disputed

match_completed_at TIMESTAMP,

approved_by UUID,

approved_at TIMESTAMP,

accounting_journal_id UUID, \-- FK to Accounting Service

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

**3.2 Payment & Credit Tables**

CREATE TABLE gs_settle_payments (

payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

invoice_id UUID NOT NULL REFERENCES gs_supplier_invoices(invoice_id),

merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),

supplier_id UUID NOT NULL REFERENCES gs_suppliers(supplier_id),

gross_amount_cents INTEGER NOT NULL,

early_payment_discount_cents INTEGER DEFAULT 0,

net_amount_cents INTEGER NOT NULL,

grosupply_fee_cents INTEGER DEFAULT 0,

settlement_option VARCHAR(20) NOT NULL, \-- instant/net30/net60/dynamic

settlement_method VARCHAR(20) NOT NULL, \-- gopay_eft/groway_account

payment_initiated_at TIMESTAMP,

payment_completed_at TIMESTAMP,

status VARCHAR(20) DEFAULT \'pending\', \--
pending/processing/completed/failed

external_tx_id VARCHAR(100)

);

CREATE TABLE gs_merchant_credit (

credit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

merchant_id UUID UNIQUE NOT NULL REFERENCES merchants(merchant_id),

credit_tier VARCHAR(20) NOT NULL, \--
starter/business/enterprise/seasonal

approved_limit_cents INTEGER NOT NULL,

available_cents INTEGER NOT NULL,

drawn_cents INTEGER NOT NULL DEFAULT 0,

interest_rate DECIMAL(5,2) DEFAULT 0.00,

nica_applicable BOOLEAN DEFAULT FALSE,

status VARCHAR(20) DEFAULT \'active\',

approved_at TIMESTAMP,

approved_by UUID,

review_date DATE

);

CREATE TABLE gs_disputes (

dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

po_id UUID NOT NULL REFERENCES gs_purchase_orders(po_id),

raised_by VARCHAR(10) NOT NULL, \-- merchant/supplier

raised_by_id UUID NOT NULL,

other_party_id UUID NOT NULL,

dispute_type VARCHAR(50) NOT NULL, \--
short_delivery/quality/price_mismatch/non_delivery

description TEXT NOT NULL,

evidence JSONB, \-- \[{type, url, description}\]

resolution_deadline TIMESTAMP,

status VARCHAR(20) DEFAULT \'open\', \--
open/under_review/resolved/escalated

resolution_outcome VARCHAR(50),

resolution_notes TEXT,

resolved_at TIMESTAMP,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

**4. GroSupply Admin Console**

The GroSupply Admin Console is a dedicated web application for Groway\'s
internal GroSupply operations team. It is separate from the main Groway
Admin Console and focuses entirely on marketplace management.

**4.1 Admin Console Modules**

  ------------------ ----------------------------------------------------
  **Module**         **Features**

  **Marketplace      GMV (daily/weekly/monthly). Active POs, open RFQs,
  Dashboard**        pending GRNs, pending invoice matches. GroSettle
                     queue value. Dispute SLA status. Supplier tier
                     distribution. Geographic activity map.

  **Supplier         Application queue. Document review: CIPC, B-BBEE
  Onboarding**       cert, VAT cert, vertical-specific licences.
                     Approve/reject with reason. Automatic notification
                     to supplier. Tier assignment on approval. Compliance
                     badge grant.

  **Supplier         Supplier directory: search by name, vertical, tier,
  Management**       status. Performance scorecard (delivery %, dispute
                     rate, response time). Tier upgrade/downgrade with
                     reason. Account suspension. Catalogue review.

  **Dispute          Open disputes by age (SLA: 5 business days). Full
  Resolution         dispute detail: PO, GRN, invoice, evidence from both
  Centre**           parties. Resolution tools: award in favour, split
                     resolution, credit note instruction, penalty to low
                     performer.

  **GroSettle        Instant settlement queue: pending approvals (above
  Finance**          R50,000 requires Finance sign-off). Float position
                     for GroSettle fund. Settlement history. Failed
                     payment retry. Reconciliation report.

  **GroCredit        All merchant credit facilities: limit, drawn,
  Portfolio**        available, overdue. Credit limit review queue.
                     Overdue alerts (\>7 days). Escalation to
                     collections. NCA compliance tracker. NCR data
                     preparation.

  **GroFloat         Supplier credit advance facilities: outstanding
  Portfolio**        advances, repayment schedule, risk concentration.
                     Auto-repay from GroSettle settlement toggle.

  **Compliance       B-BBEE certificate expiry alerts (60/30/7 days).
  Tracker**          SAHPRA registration expiry (pharmacy suppliers).
                     Liquor licence expiry (liquor/bar suppliers). CIPC
                     renewal. FICA re-verification schedule.

  **Analytics &      GMV by vertical, corridor, supplier tier. Category
  Reporting**        demand trends. Buying group activity. Cross-border
                     procurement volume. GroSettle revenue (instant
                     settlement fees). GroCredit interest income.

  **Buying Group     Active buying groups: membership, aggregate volume,
  Management**       supplier performance for group. Approve/dissolve
                     buying groups. Coordinate group delivery logistics.
  ------------------ ----------------------------------------------------

**4.2 GroSupply Frontend Architecture**

  ------------------ ----------------------------------------------------
  **Application**    **Technical Specification**

  Merchant Portal    React 18 + TypeScript. TailwindCSS. React Query for
  (Web)              server state. Zustand for client state. Module
                     within Groway Merchant OS at route /procurement.
                     Lazy-loaded to avoid bundle bloat.

  Supplier Portal    Standalone React 18 app deployed at
  (Web)              supplier.grosupply.co.za. Separate auth (JWT with
                     supplier_id claim). Multi-language support (English,
                     Afrikaans, Zulu, Shona for SADC suppliers). PWA
                     support.

  Merchant Mobile    React Native module in Merchant App. Camera barcode
  GRN                scanner (Vision Camera). Offline GRN capture: scans
                     stored locally, synced when online. GPS location
                     capture on GRN completion.

  Supplier Mobile    Standalone React Native app. Features: order alerts
  App                (push notification), order details, dispatch
                     confirmation with tracking input, delivery proof
                     photo + GPS. iOS App Store + Google Play.

  Admin Console      React 18 at admin.grosupply.co.za. Role-based
                     navigation (GroSupply Ops / Finance / Compliance).
                     Charts: Recharts/Chart.js. Tables: TanStack Table.
                     Real-time updates: Server-Sent Events.
  ------------------ ----------------------------------------------------

**4.3 Kafka Event Topics**

  --------------------------------- ------------------ -----------------------------
  **Topic**                         **Producer**       **Consumers + Action**

  inventory.low_stock               Inventory Service  GroSupply Service →
                                                       auto-draft RFQ, notify
                                                       merchant

  grosupply.rfq.created             GroSupply Service  Notification Service → alert
                                                       eligible suppliers

  grosupply.po.created              GroSupply Service  Notification Service → email
                                                       PO to supplier; Audit Service

  grosupply.po.dispatched           GroSupply Service  Notification Service → alert
                                                       merchant; Audit

  grosupply.grn.completed           GroSupply Service  Inventory Service → update
                                                       stock levels + create batch
                                                       records

  grosupply.invoice.matched         GroSupply Service  Accounting Service →
                                                       auto-journal Purchases + AP;
                                                       Notification

  grosupply.dispute.raised          GroSupply Service  Notification Service → alert
                                                       both parties + admin; Audit

  grosupply.payment.settled         GroSupply Service  Accounting Service → journal
                                                       AP Dr, Bank Cr; Notification
                                                       Service

  grosupply.supplier.tier_changed   Admin Console      Notification Service →
                                                       supplier notification;
                                                       Analytics
  --------------------------------- ------------------ -----------------------------

**4.4 GroSupply Security & Compliance**

-   All supplier bank details stored encrypted (AES-256). Decrypted only
    in Payment Service CDE at time of settlement.

-   FICA compliance: supplier CIPC + beneficial owner ID verified before
    first payment. PEP/sanctions screening via ComplyAdvantage.

-   B-BBEE certificate expiry: automated re-upload request 60 days
    before expiry. Tier downgrade to Bronze on expiry if not renewed.

-   GroCredit (NCA): sole proprietor merchants subject to full NCA
    affordability assessment. Pre-agreement disclosure. NCR
    registration.

-   Data: cross-border supplier data (SADC/UAE/China) only processed
    with explicit consent per POPIA Section 72. Stored in af-south-1.

-   Audit: all admin GroSupply actions logged to immutable WORM audit
    trail. All financial approvals require dual signature (4-eyes) above
    R100,000.

**4.5 Revenue Model**

  ------------------ ---------------------- ------------------------------
  **Revenue Stream** **Rate**               **Year 1 Projection**

  GroSettle Instant  1.5--2.5% of invoice   R8M (assume 30% of volume
  Fee                value                  chooses instant)

  GroCredit Interest Repo + 5--8% p.a.      R4M from merchant working
                     (risk-based)           capital portfolio

  GroFloat Interest  Repo + 6--10% p.a.     R2M from supplier advance
                     (risk-based)           portfolio

  Supplier Tier      Gold: R499/mo,         R1.5M from 500 Gold + 100
  Subscription       Preferred: R999/mo     Preferred suppliers

  Analytics Premium  R299/month             R0.9M from 250 paying
                     (Gold/Preferred only)  suppliers

  GroDeliver         5--8% of delivery cost R1M from coordinated
  Commission                                deliveries

  **TOTAL YEAR 1**                          **R17.4M**
  ------------------ ---------------------- ------------------------------

+-----------------------------------------------------------------------+
| **GroSupply Standalone Specification --- v4.0**                       |
|                                                                       |
| Merchant Portal · Supplier Portal · Admin Console · Mobile Apps · 57  |
| API Endpoints                                                         |
|                                                                       |
| February 2026 · Year 1 Revenue Target: R17.4M                         |
+-----------------------------------------------------------------------+
