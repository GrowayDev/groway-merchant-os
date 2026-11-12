+-----------------------------------------------------------------------+
| **groway**                                                            |
|                                                                       |
| **MERCHANT OS & SUPERAPP**                                            |
|                                                                       |
| Comprehensive Development Master Document                             |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             |
|                                                                       |
| Consumer Wallet App · Merchant POS & OS · GroSupply B2B Marketplace   |
|                                                                       |
| Admin Console · 35 Microservices · 11 Verticals · 528+ API Endpoints  |
|                                                                       |
| PCI DSS L1 · SARB · FSCA · NCR · POPIA · FICA · BCEA · NCA            |
|                                                                       |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             |
|                                                                       |
| Version 4.0 · February 2026 · Target Go-Live: April 2027              |
|                                                                       |
| *Benchmarked against Alipay · WeChat Pay · Revolut · Grab · Paytm ·   |
| Gojek · M-Pesa*                                                       |
+-----------------------------------------------------------------------+

+-----------+-----------+-----------+-----------+-----------+-----------+
| **528+**  | **35**    | **11**    | **206**   | **32**    | **64      |
|           |           |           |           |           | wks**     |
| API       | Micr      | Merchant  | DB Tables | Build     |           |
| Endpoints | oservices | Verticals |           | Sprints   | To        |
|           |           |           |           |           | P         |
|           |           |           |           |           | roduction |
+-----------+-----------+-----------+-----------+-----------+-----------+

+---+---------------------------------------------------------------------+
| * | **World-Class Design Standard**                                     |
| * |                                                                     |
| ★ | Groway is engineered to compete directly with the world\'s best     |
| * | superapp fintech platforms. Every architectural decision, UI        |
| * | pattern, and feature specification in this document is benchmarked  |
|   | against global best-in-class: Alipay\'s mini-program ecosystem,     |
|   | Revolut\'s design language, Grab\'s loyalty architecture, M-Pesa\'s |
|   | inclusion model, and Gojek\'s merchant OS. This document is the     |
|   | single source of truth for every team building Groway.              |
+---+---------------------------------------------------------------------+

**Document Overview**

This master document integrates the Master Technical Specification v4.0,
Sprint Build Plan v4.0, GroSupply Standalone Spec v4.0, UI/UX Design
Guide v1.0, and the global superapp competitive analysis into one
comprehensive engineering and product bible. It covers every layer of
the Groway platform --- from pixel-level UI components to database
schemas, from compliance architecture to sprint-by-sprint build
sequencing.

  ------------- --------------------- ---------------------------------------
  **Section**   **Title**             **Scope**

  Section 1     System Architecture & Platform overview, 35 microservices,
                Technology Stack      AWS infrastructure

  Section 2     Consumer App ---      All screens, flows, API endpoints, UI
                Groway Wallet         specifications

  Section 3     Merchant OS --- All   POS engine, dashboard, inventory,
                11 Verticals          analytics, HR, accounting

  Section 4     GroSupply B2B         Procurement lifecycle, supplier portal,
                Marketplace           GroSettle, GroCredit

  Section 5     Backend API Reference Complete 528+ endpoint catalogue across
                                      all services

  Section 6     Database Architecture Schema design, key tables, RLS,
                                      encryption strategy

  Section 7     Security & Compliance PCI DSS L1, POPIA, SARB, NCR, FICA ---
                                      full control framework

  Section 8     UI/UX Design System   Design tokens, components, patterns,
                                      African identity

  Section 9     JAX AI & Intelligence Financial superagent, ML models, offer
                Layer                 targeting, fraud detection

  Section 10    Event Architecture &  Kafka events, webhooks, 3rd-party
                Integrations          integrations

  Section 11    Admin Console         Operations, compliance, fraud, finance,
                                      content management

  Section 12    Non-Functional        Performance targets, offline, load
                Requirements          shedding, disaster recovery

  Section 13    Sprint Build Plan     32 sprints, 64 weeks, 4,905 story
                                      points --- phase by phase

  Section 14    Team & Quality        25-person team structure, QA gates,
                Standards             quality standards

  Section 15    Revenue Model &       All revenue streams, Year 1
                Business Case         projections, unit economics
  ------------- --------------------- ---------------------------------------

+-----------------------------------------------------------------------+
| **01 System Architecture & Technology Stack**                         |
|                                                                       |
| *Cloud-native · Microservices · AWS af-south-1 Cape Town ·            |
| Multi-tenant · PCI DSS L1*                                            |
+-----------------------------------------------------------------------+

**1.1 Architecture Overview**

Groway is a cloud-native, microservices-based platform deployed
exclusively on AWS af-south-1 (Cape Town), ensuring South African data
residency compliance with POPIA. The platform is multi-tenant: each
merchant is an isolated tenant with strict Row-Level Security enforced
at the PostgreSQL layer. Services communicate via REST APIs and AWS
EventBridge for async event processing.

  --------------- ---------------------------------- ---------------------------
  **Layer**       **Components**                     **Technology**

  Client Layer    Consumer iOS/Android app ·         React Native (mobile) ·
                  Merchant POS (tablet/desktop) ·    Next.js (web) · Electron
                  Admin Console (web) · GroSupply    (POS offline)
                  Portals                            

  API Gateway     Kong API Gateway · Rate limiting · Kong + AWS ALB
                  JWT validation · Vertical context  
                  routing · Audit logging            

  Microservices   35 domain services · Each on       Node.js/TypeScript · Docker
                  dedicated port · Docker containers · EKS (Kubernetes)
                  · Auto-scaling groups              

  Event Bus       Async event processing · Webhook   AWS EventBridge · SQS ·
                  delivery · Real-time notifications Kafka (MSK)
                  · Saga orchestration               

  Data Layer      Primary RDBMS (tenant RLS) ·       PostgreSQL 15 · TimescaleDB
                  Time-series analytics · Cache ·    · Redis · OpenSearch
                  Full-text search                   

  Payment CDE     Isolated VPC · PCI DSS L1 · Card   Separate EKS cluster ·
                  tokenisation only · Zero PAN       Peach Payments + Yoco
                  storage                            

  Observability   Distributed tracing · Log          Datadog · CloudWatch ·
                  aggregation · Real-time dashboards Grafana · PagerDuty
                  · Immutable PCI audit log          
  --------------- ---------------------------------- ---------------------------

**1.2 Microservice Registry --- All 35 Services**

Each microservice occupies a dedicated port. Kong API Gateway (port
8000) routes to the correct service based on URL prefix. The CDE payment
service runs in a physically isolated cluster and has no inter-service
calls except through the payment gateway.

  ---------- ---------------- ------------- ----------------------------------------------------- --------------
  **Port**   **Service**      **Domain**    **Responsibilities**                                  **Status**

  **3001**   **Auth Service** Identity      JWT RS256 · OTP · Biometric challenge-response ·      **✅ Prod**
                                            Session management · MFA (TOTP + FIDO2)               

  **3002**   **User Service** Identity      Consumer profiles · KYC/FICA levels 0--4 · POPIA      **✅ Prod**
                                            consent · Notification preferences · 11 SA languages  

  **3003**   **Merchant       Merchant      Merchant onboarding · KYB · Vertical config ·         **✅ Prod**
             Service**                      Multi-branch · Staff RBAC · Settings                  

  **3004**   **POS Service**  Merchant      Transaction processing · Vertical-aware line items ·  **✅ Prod**
                                            Cash/card/wallet/BNPL tender · Offline buffer         

  **3005**   **Inventory      Merchant      SKU management · Batch/expiry tracking · FIFO ·       **✅ Prod**
             Service**                      Multi-location · Reorder automation · 3,930+ SKUs     

  **3006**   **Accounting     Merchant      Double-entry ledger · Chart of accounts · Bank feeds  **✅ Prod**
             Service**                      (6 SA banks) · VAT 201 · JAX AI integration           

  **3007**   **CRM Service**  Merchant      Customer profiles · RFM analytics · Loyalty programme **✅ Prod**
                                            engine · WhatsApp campaign engine                     

  **3008**   **Payroll        HR            PAYE/UIF/SDL · Payslip generation · Leave management  **✅ Prod**
             Service**                      · IRP5/EMP201 · BCEA compliance                       

  **3009**   **Staff          HR            Employee records · Role-based permissions ·           **✅ Prod**
             Service**                      Timesheets · Shift scheduling · Clock in/out          

  **3010**   **PayShap        Payments      BankServ PayShap rail · Proxy addressing ·            **✅ Prod**
             Service**                      Request-to-pay · DebiCheck mandates                   

  **3011**   **GoPay          Payments      Instant EFT · Bank-to-bank push payments · Lower fees **✅ Prod**
             Service**                      than card · 6 SA bank integrations                    

  **3012**   **Wallet         Consumer      Multi-currency wallet · P2P transfers · Savings       **✅ Prod**
             Service**                      pockets · Stokvel wallet · Spending limits            

  **3013**   **Payment CDE**  Payments      Card tokenisation · 3DS2 · PCI DSS L1 isolated        **✅ PCI L1**
                                            cluster · Peach Payments + Yoco gateway               

  **3014**   **QR Service**   Payments      EMVCo QR static/dynamic · NFC tap · Wearable tokens · **✅ Prod**
                                            72h offline payment buffer                            

  **3015**   **Banking        Open Banking  OAuth2 bank linking · Balance aggregation · Bank      **✅ Prod**
             Service**                      feeds · Reconciliation                                

  **3016**   **Credit         Credit        Groway Credit Score · BNPL (NCA) · NCR registered ·   **✅ NCR**
             Service**                      DebiCheck · 8-lender marketplace                      

  **3017**   **Remittance     FX            6-provider marketplace                                **✅ Prod**
             Service**                      (Chipper/Mukuru/TerraPay/WorldRemit/AZA/Stablecoin) · 
                                            SARB ADA                                              

  **3018**   **Bill Payment   VAS           Electricity · Water · DStv · Insurance · Municipal    **✅ Prod**
             Service**                      rates · Airtime/data · Scheduled payments             

  **3019**   **Voucher        VAS           Closed/open-loop vouchers · PayShap vouchers ·        **🔄 Dev**
             Service**                      Marketplace · Corporate bulk orders                   

  **3020**   **Ticketing      VAS           Gautrain/MyCiTi/Rea Vaya · Intercity bus · Domestic   **🔄 Dev**
             Service**                      flights · Events (Computicket/Quicket)                

  **3021**   **Laybye         Commerce      Digital laybye · Deposit tracking · Instalment        **🔄 Dev**
             Service**                      schedule · Auto-release on completion                 

  **3022**   **Offers         Marketing     Merchant offer creation · AI-personalised consumer    **🔄 Dev**
             Service**                      feed · Promoted placements · Analytics                

  **3023**   **Notification   Platform      WhatsApp Business API · FCM/APNS push · Twilio SMS ·  **✅ Prod**
             Service**                      SES email · Delivery tracking                         

  **3024**   **Analytics      Platform      BI dashboards · Merchant analytics · Admin reporting  **✅ Prod**
             Service**                      · ClickHouse OLAP pipeline                            

  **3025**   **Compliance     Regulatory    POPIA governance · FICA/KYC · Sanctions screening     **✅ Prod**
             Service**                      (ComplyAdvantage) · SARS filings                      

  **3026**   **JAX AI         AI/ML         Financial superagent · NLP accounting queries ·       **✅ Prod**
             Service**                      Predictive analytics · Fraud detection ML             

  **3027**   **Restaurant     Vertical      Recipe deduction engine · KDS (Kitchen Display        **✅ Prod**
             Service**                      System) · Table management · Dynamic pricing          

  **3028**   **Pharmacy       Vertical      Schedule drug register · Prescription management ·    **✅ Prod**
             Service**                      SAHPRA · Medical aid billing                          

  **3029**   **Hotel          Vertical      PMS overlay · Room folio · Rate management · Channel  **✅ Prod**
             Service**                      manager · Guest register                              

  **3030**   **Funeral        Vertical      Case management · Package configurator · Cultural     **✅ Prod**
             Service**                      compliance flags · FSP compliance                     

  **3031**   **Admin          Admin         Platform admin · Merchant management · Consumer       **✅ Prod**
             Service**                      oversight · Compliance · Fraud detection              

  **3032**   **GroSupply      Procurement   B2B marketplace · RFQ/PO/GRN · 3-way match ·          **✅
             Service**                      GroSettle · GroCredit · Supplier portal               Standalone**

  **3033**   **Webhook        Platform      Outbound webhook delivery · Retry logic · HMAC        **✅ Prod**
             Service**                      signing · Developer portal                            

  **3034**   **File Service** Platform      Document storage · PDF generation · Receipt printing  **✅ Prod**
                                            · POPIA-encrypted S3 (af-south-1)                     

  **3035**   **Search         Platform      Full-text search: products · merchants · transactions **✅ Prod**
             Service**                      · OpenSearch cluster                                  
  ---------- ---------------- ------------- ----------------------------------------------------- --------------

**1.3 Technology Stack**

  ------------------- --------------------- ------------------------------
  **Layer**           **Technology**        **Rationale**

  Mobile App          React Native (Expo    Single codebase for iOS +
  (Consumer +         managed workflow)     Android · OTA updates without
  Merchant)                                 app store · 40MB APK target

  Web Dashboard       Next.js 14 +          SSR for performance · Type
  (Merchant OS +      TypeScript +          safety · App Router for layout
  Admin)              TailwindCSS           persistence

  POS Offline Mode    Electron + SQLite     72-hour offline transaction
                      local buffer          queue · Auto-sync on reconnect
                                            · Works without internet

  Backend Services    Node.js 20 LTS +      High I/O throughput · Type
  (×35)               TypeScript + Fastify  safety · Fastify 3× faster
                                            than Express

  API Gateway         Kong Gateway + AWS    JWT validation · Rate limiting
                      ALB                   · Vertical-context routing ·
                                            Plugin ecosystem

  Primary Database    PostgreSQL 15 +       Multi-tenant isolation · JSONB
                      Row-Level Security    for flexible schemas · Full
                                            ACID compliance

  Time-Series         TimescaleDB           Revenue charts · Trend
  Analytics           (PostgreSQL           analysis · 10× faster than
                      extension)            vanilla Postgres for time data

  Cache Layer         Redis 7 Cluster       Session tokens · Rate limit
                                            counters · QR token storage ·
                                            72h offline buffers

  Message Broker      Apache Kafka (AWS     Domain event streaming ·
                      MSK)                  3-broker cluster ·
                                            Topic-per-domain pattern

  Event Routing       AWS EventBridge       Cross-service async events ·
                                            Rule-based routing ·
                                            Dead-letter queues

  Search              OpenSearch (AWS       Full-text
                      managed)              product/merchant/transaction
                                            search · Autocomplete

  Object Storage      AWS S3 (af-south-1    Receipts · KYC documents ·
                      only)                 Payslips · POPIA-compliant
                                            encryption

  Animation           React Native          60fps animations · Lottie for
                      Reanimated 3 + Lottie success ticks and complex
                                            motions

  Charts              Victory Native        Fully customisable · No
                      (mobile) + Recharts   licensing costs ·
                      (web)                 TypeScript-first

  State Management    Zustand + React Query Lightweight · Async-first ·
                                            Cache invalidation built in

  Authentication      JWT RS256 +           Zero biometric data
                      Biometrics (device    transmitted ·
                      secure enclave)       Challenge-response model

  Containerisation    Docker + AWS EKS      Auto-scaling · Blue-green
                      (Kubernetes)          deployments · Health checks

  CI/CD               GitHub Actions +      Automated builds · GitOps ·
                      ArgoCD + SonarQube +  Code quality gates ·
                      Snyk                  Dependency scanning

  Observability       Datadog APM +         Distributed tracing · Log
                      CloudWatch +          aggregation · On-call alerting
                      Grafana + PagerDuty   
  ------------------- --------------------- ------------------------------

+-----------------------------------------------------------------------+
| **02 Consumer App --- Groway Wallet**                                 |
|                                                                       |
| *Full-featured South African super-app · 72-hour offline · 11 SA      |
| languages · iOS + Android*                                            |
+-----------------------------------------------------------------------+

**2.1 App Navigation Architecture**

The consumer app uses a bottom tab bar as primary navigation ---
identical to Alipay, Grab, and WeChat Pay patterns. This keeps critical
actions thumb-reachable and reduces cognitive effort. A centre FAB
(floating action button) provides one-tap access to the QR payment flow
at all times.

  --------- ------------- ----------------------------------------------------
  **Tab**   **Screen      **Core Features**
            Name**        

  🏠 Tab 1  Home / Wallet Balance card · Quick actions (Send/Receive/QR/Top
                          Up) · Loyalty tier & points · Services grid (8
                          visible + More) · Recent transactions · JAX AI daily
                          tip · Active offers strip · Upcoming bills alert

  💳 Tab 2  Pay (QR       QR scan · QR generate (static/dynamic) · NFC tap ·
            Centre)       PayShap transfer · GoPay EFT · P2P by phone ·
                          Request money · Split bill · Beneficiaries ·
                          Scheduled payments

  🛍 Tab 3   Services /    Bill payments · Airtime & data · International
            Explore       remittance · Vouchers & gift cards · Transport
                          ticketing · Event tickets · Insurance · Prepaid
                          electricity · Laybye · BNPL

  💎 Tab 4  Offers        Personalised AI offer feed · Category browse ·
                          Clipped offers · Flash sales · Loyalty boosts ·
                          Share with contacts · Merchant discovery map

  👤 Tab 5  Profile /     Personal details · KYC/FICA documents · Security
            Settings      (PIN/biometric/MFA/sessions) · Spending limits ·
                          Language (11 SA languages) · Credit score ·
                          Notifications · Support
  --------- ------------- ----------------------------------------------------

**2.2 Home Screen --- Complete Specification**

The home screen is the financial command centre. One glance must reveal
the user\'s complete financial state. Every element must earn its place.
Inspired by Alipay\'s information density without the cognitive
overload.

+-----------------------------------+-----------------------------------+
| **Layout (Top → Bottom)**         | **Component Rules**               |
|                                   |                                   |
| -   Status bar --- Hope Teal      | -   Balance card: 160px min,      |
|     (#00897B) background, white   |     gradient, radius-xl (24px),   |
|     text                          |     elevation-2, white text only  |
|                                   |                                   |
| -   Header --- Avatar (left) ·    | -   Quick actions: 48×48px touch  |
|     Greeting \'Good morning,      |     target, elevation-1 card,     |
|     \[Name\]\' · Notification     |     teal icon, 8px label below    |
|     bell + badge (right)          |                                   |
|                                   | -   Service tiles: 72×72px,       |
| -   Balance card --- Gradient     |     gradient icon, radius-lg,     |
|     (teal→green), 160px,          |     2-line label max              |
|     radius-xl, masked/unmasked    |                                   |
|     toggle, currency label, KYC   | -   Transaction rows: 72px        |
|     tier badge                    |     height, 40px avatar,          |
|                                   |     right-aligned amount (green   |
| -   Loyalty pill --- Points       |     +, red -)                     |
|     balance + tier                |                                   |
|     (Bronze/Silver/Gold/Platinum) | -   RULE: Max 8 services in       |
|     · Progress to next tier       |     initial grid. \'More\' tile   |
|                                   |     expands full catalogue.       |
| -   Quick actions row --- Send \| |                                   |
|     Receive \| Scan QR \| Top Up  | -   RULE: Long-press service tile |
|     (4 icons, 48×48px, labelled)  |     → reorder mode (Gojek         |
|                                   |     pattern)                      |
| -   Services grid --- 3×3, max 8  |                                   |
|     tiles visible + \'More\'      | -   RULE: Profile completion bar  |
|     tile. Long-press to reorder.  |     shown until KYC Level 3       |
|                                   |     complete                      |
| -   Upcoming bills strip ---      |                                   |
|     Horizontal scroll, amber      | -   RULE: Anti-scam banner shown  |
|     alert if due within 3 days    |     for first 14 days after       |
|                                   |     registration                  |
| -   Recent transactions --- 3     |                                   |
|     rows, avatar + name + amount, |                                   |
|     \'See all →\'                 |                                   |
|                                   |                                   |
| -   JAX AI tip card ---           |                                   |
|     Personalised daily financial  |                                   |
|     nudge                         |                                   |
|                                   |                                   |
| -   Bottom nav --- 5 tabs +       |                                   |
|     centre Pay FAB (gradient      |                                   |
|     pill, elevation-4)            |                                   |
+-----------------------------------+-----------------------------------+

**2.3 Payment Flows --- Send, Receive, QR**

All payment flows must complete in ≤4 taps from any screen. The confirm
screen is the most critical UI moment in the entire app --- it must
eliminate ambiguity completely.

  ----------- --------------------------------- ------------------------------
  **Flow**    **Steps**                         **Critical Requirements**

  Send / P2P  1\. Choose method                 Wrong-number warning if
  Transfer    (contact/number/QR/beneficiary) → recipient not in contacts ·
              2. Enter amount (preset chips:    Show recipient name + photo +
              R50/R100/R200/R500) → 3. Add note Groway verified badge ·
              (optional) → 4. Confirm           Display exact amount, fee, and
              (slide-to-pay + biometric) → 5.   balance after · Slide-to-pay
              Success                           gesture prevents accidental
                                                confirms

  Receive /   1\. Display static QR · or 2.     QR: min 240×240px · White
  Request     Enter amount → generate dynamic   background enforced · Groway
              QR · Share QR or link via         logo centred at 20% · Refresh
              WhatsApp/SMS                      button every 60s · \'Enter
                                                code manually\' fallback
                                                always visible

  QR Scan Pay 1\. Open camera → auto-detect QR  Auto-detect EMVCo QR format ·
              → 2. Confirm merchant name +      Never proceed without amount
              amount → 3. Biometric confirm →   confirmation · Show merchant
              4. Success full-screen animation  verification badge · P95
                                                payment round-trip \< 2
                                                seconds

  NFC Tap Pay 1\. Unlock device → 2. Tap to     Uses secure enclave NFC token
              merchant NFC terminal → 3.        · Auto-prompts when device
              Biometric challenge → 4. Success  near NFC field · Works offline
              notification                      with 72h pre-loaded token

  PayShap     1\. Enter recipient ProxyID       BankServ PayShap rail ·
  Transfer    (phone/SA ID/email) → 2. Amount → Real-time gross settlement ·
              3. Confirm → 4. Instant           Proxy registry lookup
              settlement (\< 60 sec)            auto-populates recipient name

  Split Bill  1\. Send money → select \'Split\' Inspired by WeChat \'Red
              → 2. Select contacts → 3. Set     Envelope\' social model ·
              amounts (equal or custom) → 4.    Group notifications via
              Each contact receives payment     WhatsApp · Track who
              request                           has/hasn\'t paid

  Scheduled   1\. Any payment flow → 2. Toggle  Stores encrypted beneficiary +
  Payment     \'Repeat this payment\' → 3. Set  amount + schedule · Push
              frequency (weekly/monthly/custom) notification 24h before
              → 4. Set end date or transaction  execution · Easy cancel from
              count                             transaction history
  ----------- --------------------------------- ------------------------------

**2.4 Consumer Feature Matrix --- All 42 Features**

  --------------- --------------------------------- ----------------------------------
  **Category**    **Feature**                       **World-Class Benchmark**

  Wallet Core     Multi-currency wallet (ZAR + 40+  Revolut multi-currency accounts
                  currencies)                       

  Wallet Core     Savings pockets with goals and    Monzo Pots · Revolut Vaults
                  auto-save round-up                

  Wallet Core     Stokvel group savings wallet      Africa-first differentiator --- no
                                                    global equivalent

  Wallet Core     Transaction history: infinite     Revolut transaction export
                  scroll, search, export (CSV/PDF)  

  Wallet Core     Transaction dispute management    Revolut dispute flow

  Wallet Core     Spending limits (self-imposed +   Revolut spending controls
                  regulatory)                       

  Payments        QR (static + dynamic, EMVCo)      Alipay, WeChat Pay QR standard

  Payments        NFC tap (wearable support)        Apple Pay · Google Pay

  Payments        P2P by phone number / Groway ID   M-Pesa, WeChat Pay

  Payments        PayShap instant bank transfer     BankServ SA payment rail

  Payments        GoPay instant EFT (6 SA banks)    SA bank integration

  Payments        Request money + split bill        WeChat Pay hongbao model

  Payments        Scheduled / recurring payments    Revolut scheduled payments

  Payments        Beneficiary management            Standard banking feature

  Payments        72-hour offline payment token     M-Pesa offline USSD model

  Financial       Bill payments (electricity,       Alipay bill payment centre
  Services        water, DStv, municipal,           
                  insurance)                        

  Financial       Airtime & data for all SA         M-Pesa, Paytm airtime
  Services        networks                          

  Financial       International remittance ---      WorldRemit, Wise comparison model
  Services        6-provider marketplace            

  Financial       Vouchers & gift cards (closed +   Paytm vouchers
  Services        open loop + PayShap)              

  Financial       Transport ticketing (Gautrain,    Grab ticketing
  Services        bus, flights)                     

  Financial       Event ticketing (Computicket,     Alipay event tickets
  Services        Quicket)                          

  Financial       Prepaid electricity STS tokens    Eskom + municipalities
  Services        (250+ municipalities)             

  Credit          Groway Credit Score (0--850,      Paytm credit score · Alipay Sesame
                  nightly update)                   

  Credit          BNPL at checkout (NCA-compliant,  Payflex SA · Paytm Buy Now Pay
                  NCR-registered)                   Later

  Credit          Credit marketplace (8 lenders,    ClearScore marketplace model
                  soft pre-qualification)           

  Credit          Laybye digital (item              Africa-specific shopping pattern
                  reservation + instalments)        

  Credit          DebiCheck mandate management      SA banking debit order standard

  Loyalty &       4-tier loyalty                    GrabRewards · Alipay Sesame
  Offers          (Bronze/Silver/Gold/Platinum) +   
                  points engine                     

  Loyalty &       Personalised AI offer feed (JAX   Alipay offers · Grab promotions
  Offers          ML targeting)                     

  Loyalty &       Referral programme (R20 credit on Grab, Paytm referral model
  Offers          first payment)                    

  Loyalty &       Sticker/stamp card for merchant   Grab merchant loyalty
  Offers          loyalty                           

  JAX AI          Daily personalised financial tip  Revolut Insights · Monzo Trends

  JAX AI          Electricity usage prediction      Smart home utility apps
                  (days remaining)                  

  JAX AI          Offer personalisation based on    Alipay AI offer targeting
                  spend patterns                    

  JAX AI          Fraud anomaly detection           Revolut · Standard Bank fraud AI
                  (real-time)                       

  Safety & Trust  Anti-scam warnings (new           UK banks mandatory APP fraud
                  recipient, large amounts)         warnings

  Safety & Trust  Security Centre (sessions,        Revolut security hub
                  freeze, login history)            

  Safety & Trust  Verification badges (KYC-verified Alipay blue tick · WeChat verified
                  merchants + users)                

  Safety & Trust  6-digit PIN with bcrypt · 5       Standard fintech security
                  attempts → 30min lockout          

  Safety & Trust  Biometric auth (device secure     Apple Face ID · Android
                  enclave, no data transmitted)     BiometricPrompt

  Accessibility   11 official SA languages UI       Africa-first · isiZulu, isiXhosa,
                                                    Afrikaans, etc.

  Accessibility   WCAG 2.1 AA · Screen reader       Global accessibility standard
                  (VoiceOver + TalkBack)            
  --------------- --------------------------------- ----------------------------------

+-----------------------------------------------------------------------+
| **03 Merchant OS --- All 11 Verticals**                               |
|                                                                       |
| *POS · Dashboard · Inventory · Accounting · CRM · HR/Payroll ·        |
| Analytics · 3,930+ SKUs*                                              |
+-----------------------------------------------------------------------+

**3.1 Merchant OS Architecture**

The Groway Merchant OS is a full business operating system, not just a
POS terminal. It competes directly with Square, Shopify POS, and Yoco in
South Africa. The merchant-facing platform has two components: (1) POS
Terminal --- the transaction-facing tablet/desktop app used at the till;
and (2) Merchant Portal --- the back-office web app for management. Both
are vertical-aware.

+---+---------------------------------------------------------------------+
| * | **Merchant OS Vision**                                              |
| * |                                                                     |
| ★ | Every Groway merchant should feel like they have the tools of a     |
| * | large enterprise --- accounting, HR, CRM, inventory, and analytics  |
| * | --- all in one integrated platform. The Merchant OS replaces: a POS |
|   | system (iKhokha/Yoco), an accounting package (Sage/Xero), a payroll |
|   | system (PaySpace), a CRM (Hubspot), and an inventory system (Cin7). |
|   | The integration between all these modules, all feeding the JAX AI   |
|   | financial superagent, is Groway\'s most defensible competitive      |
|   | advantage.                                                          |
+---+---------------------------------------------------------------------+

**3.2 Merchant Navigation --- Tablet/Desktop Sidebar**

  ------------ ------------ ------------------ ------------------------------
  **Module**   **Mobile     **Desktop          **Key Screens**
               Tab**        Sidebar**          

  Dashboard    Tab 1 ---    Top, always        Revenue hero · Transaction
               Home         visible with live  count · AI insight card ·
                            revenue            Settlement status · Alerts
                                               banner · Revenue chart · Live
                                               feed

  Accept       Tab 2 --- QR Expanded with      Amount numpad · Item basket ·
  Payment      (Primary     quick-accept panel QR display (animated ring) ·
  (POS)        FAB)                            Await screen · Success ·
                                               Receipt options

  Inventory    Tab 3 ---    Full management    Product list/grid · Barcode
               Box icon     panel              scan · Low-stock alerts ·
                                               Batch tracking · Expiry
                                               management · Stocktake ·
                                               Reorder

  Analytics    Tab 4 ---    Real-time &        Revenue trends · Top products
               Chart icon   historic charts    · Customer insights · Peak
                                               hours · AI insights · Tax
                                               summary · Export

  Accounting   Under More   Sidebar section    P&L · Cash flow · Invoices ·
                            --- Finance        Quotes · Bank reconciliation ·
                                               VAT 201 · JAX AI accounting
                                               queries

  CRM &        Under More   Sidebar section    Customer list (RFM scores) ·
  Loyalty                   --- Customers      Segments · WhatsApp campaigns
                                               · Loyalty programme config ·
                                               Churn alerts

  Staff & HR   Under        Sidebar section    Employee list · Clock in/out ·
               Profile      --- People         Timesheets · Leave management
                                               · Payroll run · Payslips ·
                                               IRP5/EMP201

  Offers       Under More   Sidebar section    Create offer ·
                            --- Marketing      Budget/targeting · Performance
                                               analytics · Promoted placement
                                               purchase

  GroSupply    Under More   Sidebar section    RFQ list · PO management · GRN
                            --- Procurement    scanning · Invoice approval ·
                                               GroSettle payment · GroCredit
                                               status

  Settings     Profile tab  Bottom of sidebar, Merchant profile · Branches ·
                            always accessible  Banking details · Devices ·
                                               Integrations ·
                                               Roles/permissions
  ------------ ------------ ------------------ ------------------------------

**3.3 All 11 Merchant Verticals**

Each vertical has a dedicated POS layout, unique feature set, and
pre-loaded SKU catalogue. The active vertical_context header is sent
with every API request, allowing the backend to apply the correct
business rules, VAT treatment, compliance overlays, and chart of
accounts.

+-------------------+---------------------------------------------------+
| 🛒 **Grocery** ·  |                                                   |
| 450 SKUs          |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Barcode scan → basket → zero-rated VAT split      |
| → PLU/scale       | display → tender options (cash/QR/card/account)   |
| integration for   |                                                   |
| weighed items     |                                                   |
|                   |                                                   |
| → Zero-rated VAT  |                                                   |
| split (bread,     |                                                   |
| milk, vegetables) |                                                   |
|                   |                                                   |
| → Stokvel wallet  |                                                   |
| integration for   |                                                   |
| group purchases   |                                                   |
|                   |                                                   |
| → Supplier credit |                                                   |
| (GroSupply        |                                                   |
| pre-loaded)       |                                                   |
|                   |                                                   |
| → 450 pre-loaded  |                                                   |
| grocery SKUs with |                                                   |
| barcodes          |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 💆 **Salon &      |                                                   |
| Spa** · 300 SKUs  |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Appointment calendar → bill close → retail        |
| → Appointment     | add-ons → tip → tender                            |
| calendar          |                                                   |
| integration       |                                                   |
|                   |                                                   |
| → Therapist       |                                                   |
| commission        |                                                   |
| calculation per   |                                                   |
| service           |                                                   |
|                   |                                                   |
| → Service-time    |                                                   |
| billing (by       |                                                   |
| duration)         |                                                   |
|                   |                                                   |
| → Prepaid package |                                                   |
| management (e.g.  |                                                   |
| 10-treatment      |                                                   |
| card)             |                                                   |
|                   |                                                   |
| → Tip prompt via  |                                                   |
| Groway Wallet     |                                                   |
|                   |                                                   |
| → Retail add-on   |                                                   |
| sales at close    |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🏪 **Retail** ·   |                                                   |
| 400 SKUs          |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Barcode → variant select → basket → promotion     |
| → Product         | apply → tender → laybye/BNPL option               |
| variants          |                                                   |
| (size/colour      |                                                   |
| matrix)           |                                                   |
|                   |                                                   |
| → Laybye creation |                                                   |
| at POS            |                                                   |
| (instalment       |                                                   |
| schedule)         |                                                   |
|                   |                                                   |
| →                 |                                                   |
| Returns/exchange  |                                                   |
| workflow with     |                                                   |
| manager PIN       |                                                   |
|                   |                                                   |
| → BNPL checkout   |                                                   |
| (NCA-compliant    |                                                   |
| disclosure)       |                                                   |
|                   |                                                   |
| → Gift card       |                                                   |
| issuance and      |                                                   |
| redemption        |                                                   |
|                   |                                                   |
| → Promotions      |                                                   |
| engine (BOGO,     |                                                   |
| bundle,           |                                                   |
| clearance)        |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🍺 **Bar &        |                                                   |
| Tavern** · 350    |                                                   |
| SKUs              |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Tab open → drinks/food add → round tracking →     |
| → Tab management  | close/split → age verify → tender                 |
| --- open tab per  |                                                   |
| table/customer    |                                                   |
|                   |                                                   |
| → Round tracking  |                                                   |
| for group orders  |                                                   |
|                   |                                                   |
| → Split bill via  |                                                   |
| Groway Wallet     |                                                   |
| (WhatsApp         |                                                   |
| dispatch)         |                                                   |
|                   |                                                   |
| → Age             |                                                   |
| verification      |                                                   |
| (mandatory        |                                                   |
| biometric/ID      |                                                   |
| check)            |                                                   |
|                   |                                                   |
| → Pre-fund tab    |                                                   |
| with Groway       |                                                   |
| Wallet            |                                                   |
|                   |                                                   |
| → Tab pre-auth    |                                                   |
| for credit card   |                                                   |
| hold              |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🍾 **Liquor       |                                                   |
| Store** · 250     |                                                   |
| SKUs              |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Barcode → basket → mandatory age check → case     |
| → Mandatory age   | pricing → trading hours check → tender            |
| verification at   |                                                   |
| checkout          |                                                   |
|                   |                                                   |
| → Case pricing    |                                                   |
| (12/24 bottle     |                                                   |
| discount)         |                                                   |
|                   |                                                   |
| → Bottle deposit  |                                                   |
| tracking          |                                                   |
| (deposit +        |                                                   |
| refund)           |                                                   |
|                   |                                                   |
| → Trading hours   |                                                   |
| enforcement       |                                                   |
| (Liquor Act)      |                                                   |
|                   |                                                   |
| → Excise stock    |                                                   |
| register for      |                                                   |
| compliance        |                                                   |
|                   |                                                   |
| → Licence number  |                                                   |
| display on        |                                                   |
| receipts          |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🏨 **Hotel** ·    |                                                   |
| 200 SKUs          |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Room grid → guest check-in → folio accumulation → |
| → Property        | checkout → split payment → receipt                |
| Management System |                                                   |
| (PMS) overlay     |                                                   |
|                   |                                                   |
| → Room grid with  |                                                   |
| live occupancy    |                                                   |
| status            |                                                   |
|                   |                                                   |
| → Guest folio --- |                                                   |
| real-time charge  |                                                   |
| approval          |                                                   |
|                   |                                                   |
| → Pre-auth card   |                                                   |
| hold for          |                                                   |
| incidentals       |                                                   |
|                   |                                                   |
| → Rate management |                                                   |
| (r                |                                                   |
| ack/corporate/OTA |                                                   |
| rates)            |                                                   |
|                   |                                                   |
| → Channel manager |                                                   |
| (Boo              |                                                   |
| king.com/Expedia) |                                                   |
| sync              |                                                   |
|                   |                                                   |
| → Foreign         |                                                   |
| national register |                                                   |
| (DIRCO            |                                                   |
| compliance)       |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🏡 **Guest        |                                                   |
| House** · 200     |                                                   |
| SKUs              |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Booking calendar → check-in → breakfast tracking  |
| → Simplified PMS  | → channel-aware pricing → checkout                |
| for small         |                                                   |
| properties        |                                                   |
|                   |                                                   |
| → Booking         |                                                   |
| calendar with     |                                                   |
| direct booking    |                                                   |
| rate              |                                                   |
|                   |                                                   |
| → Breakfast/meal  |                                                   |
| tracking per      |                                                   |
| guest             |                                                   |
|                   |                                                   |
| → Channel manager |                                                   |
| integration (B&B  |                                                   |
| rates)            |                                                   |
|                   |                                                   |
| → Guest register  |                                                   |
| with ID           |                                                   |
| verification      |                                                   |
|                   |                                                   |
| → WhatsApp        |                                                   |
| c                 |                                                   |
| heck-in/check-out |                                                   |
| confirmation      |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 💊 **Pharmacy** · |                                                   |
| 500 SKUs          |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Prescription receive → schedule check →           |
| → Dispensary      | pharmacist PIN (S5/S6) → dispense → medical aid   |
| module (S0--S6    | billing → cash/card tender                        |
| schedule drugs)   |                                                   |
|                   |                                                   |
| → Pharmacist PIN  |                                                   |
| required for      |                                                   |
| S5/S6 controlled  |                                                   |
| substances        |                                                   |
|                   |                                                   |
| → Prescription    |                                                   |
| processing and    |                                                   |
| patient records   |                                                   |
|                   |                                                   |
| → SAHPRA          |                                                   |
| compliance        |                                                   |
| reporting         |                                                   |
|                   |                                                   |
| → Medical aid     |                                                   |
| billing           |                                                   |
| (Discov           |                                                   |
| ery/Bonitas/GEMS) |                                                   |
|                   |                                                   |
| → Chronic         |                                                   |
| medication refill |                                                   |
| reminders         |                                                   |
|                   |                                                   |
| → Front shop OTC  |                                                   |
| sales alongside   |                                                   |
| dispensary        |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🏪 **Spaza Shop** |                                                   |
| · 600 SKUs        |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Large product tiles → quick-add to basket →       |
| → Large-icon      | airtime/data option → QR/cash tender → stokvel    |
| image-first POS   | payment                                           |
| (low-literacy UX) |                                                   |
|                   |                                                   |
| → Local language  |                                                   |
| UI (isiZulu,      |                                                   |
| Sesotho,          |                                                   |
| Afrikaans)        |                                                   |
|                   |                                                   |
| → Airtime/data    |                                                   |
| sales integration |                                                   |
|                   |                                                   |
| → Stokvel wallet  |                                                   |
| payment           |                                                   |
| acceptance        |                                                   |
|                   |                                                   |
| → Supplier credit |                                                   |
| from GroSupply    |                                                   |
|                   |                                                   |
| → WhatsApp order  |                                                   |
| queue for         |                                                   |
| delivery          |                                                   |
|                   |                                                   |
| → Cash management |                                                   |
| with daily        |                                                   |
| reconciliation    |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🕊️ **Funeral      |                                                   |
| Home** · 200 SKUs |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Case creation → package config → cultural flags → |
| → Case management | payment plan → FSP compliance check → tender      |
| system (deceased  |                                                   |
| details)          |                                                   |
|                   |                                                   |
| → Package         |                                                   |
| configurator      |                                                   |
| (                 |                                                   |
| coffin/flowers/tr |                                                   |
| ansport/catering) |                                                   |
|                   |                                                   |
| → Cultural        |                                                   |
| compliance flags  |                                                   |
| (r                |                                                   |
| eligious/cultural |                                                   |
| preferences)      |                                                   |
|                   |                                                   |
| → FSP (Funeral    |                                                   |
| Service Provider) |                                                   |
| regulatory        |                                                   |
| compliance        |                                                   |
|                   |                                                   |
| → Compassionate   |                                                   |
| instalment        |                                                   |
| payment plan      |                                                   |
|                   |                                                   |
| → Third-party     |                                                   |
| coordinator       |                                                   |
| integration       |                                                   |
|                   |                                                   |
| → Digital death   |                                                   |
| certificate       |                                                   |
| record link       |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🧺 **Laundromat** |                                                   |
| · 250 SKUs        |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Drop-off scan → ticket QR → workflow board        |
| → Drop-off ticket | progression → machine activation → collection     |
| generation with   | notification → payment                            |
| QR code           |                                                   |
|                   |                                                   |
| → Workflow kanban |                                                   |
| board (Received → |                                                   |
| Sorted → Washing  |                                                   |
| → Folding →       |                                                   |
| Ready)            |                                                   |
|                   |                                                   |
| → Machine API     |                                                   |
| integration       |                                                   |
| (activate via     |                                                   |
| Groway Wallet)    |                                                   |
|                   |                                                   |
| → Locker PIN      |                                                   |
| assignment for    |                                                   |
| self-collection   |                                                   |
|                   |                                                   |
| → Subscription    |                                                   |
| package           |                                                   |
| management        |                                                   |
|                   |                                                   |
| → Collection      |                                                   |
| notification via  |                                                   |
| WhatsApp/SMS      |                                                   |
+-------------------+---------------------------------------------------+

+-------------------+---------------------------------------------------+
| 🍽️ **Restaurant** |                                                   |
| · 600 SKUs        |                                                   |
+-------------------+---------------------------------------------------+
| **Unique POS      | **POS Screen Layout**                             |
| Features**        |                                                   |
|                   | Table plan → seat guests → waiter order tablet →  |
| → Table floor     | KDS routing → course management → QR self-service |
| plan with live    | → bill → split → BNPL option → receipt            |
| status            |                                                   |
| (avail            |                                                   |
| able/seated/bill) |                                                   |
|                   |                                                   |
| → Waiter tablet   |                                                   |
| order taking with |                                                   |
| course management |                                                   |
|                   |                                                   |
| → KDS (Kitchen    |                                                   |
| Display System)   |                                                   |
| --- station       |                                                   |
| routing + bump    |                                                   |
|                   |                                                   |
| → Recipe-deducted |                                                   |
| inventory per     |                                                   |
| dish sold (FIFO)  |                                                   |
|                   |                                                   |
| → Dynamic pricing |                                                   |
| (happy hour,      |                                                   |
| surge, channel)   |                                                   |
|                   |                                                   |
| → QR table        |                                                   |
| ordering          |                                                   |
| (customer         |                                                   |
| self-service)     |                                                   |
|                   |                                                   |
| → Delivery        |                                                   |
| integration (Uber |                                                   |
| Eats, Mr D, Bolt  |                                                   |
| Food)             |                                                   |
|                   |                                                   |
| →                 |                                                   |
| D                 |                                                   |
| ine-Now-Pay-Later |                                                   |
| (BNPL at table)   |                                                   |
+-------------------+---------------------------------------------------+

**3.4 Merchant Dashboard --- Intelligence Layer**

The merchant dashboard must be DATA-FORWARD and INTELLIGENCE-DRIVEN.
Numbers must be large and immediately readable (minimum 32px for key
metrics). Every chart must be accompanied by a plain-language AI insight
--- never leave merchants staring at data without guidance.

  --------------- ------------------------- ------------------------------
  **Widget**      **Data Displayed**        **AI Intelligence Layer**

  Revenue Hero    Today\'s revenue (large), \'Today is tracking 18% above
  Card            24h vs yesterday %,       your typical Tuesday. Peak
                  transaction count,        hour 12--2pm contributed 34%
                  average basket, refunds   of revenue. You need R3,500
                  count                     more to hit your daily
                                            target.\'

  Settlement      Next payout amount,       \'R24,870 settles to FNB
  Status          destination bank + last   \*4521 tomorrow by 10:00am.
                  4, expected time          Settlement is on schedule.\'

  Live            Newest first ·            Animated entry for new
  Transactions    Auto-refresh every 10s ·  transactions · Red highlight
  Feed            Customer name + payment   for refunds · Amber for
                  method + amount           pending

  Revenue Trend   7D/30D/1Y bar chart with  \'Your best day this week was
  Chart           teal gradient fill · Tap  Saturday (R31,200). Tuesday is
                  to see hourly breakdown   consistently your slowest ---
                                            consider a Tuesday special.\'

  Top Products    Horizontal bar chart,     \'Phone Cases are your top
                  ranked by revenue ·       seller but at 12% margin.
                  Margin % per product      Increasing price by R20 could
                                            add R2,400/month without
                                            losing significant volume.\'

  Customer        New vs returning ratio ·  \'38 unique customers today
  Insights        Unique customers today ·  (14 returning). Your returning
                  Peak hours heat map       customer rate is 37% ---
                                            industry benchmark is 25%.
                                            Excellent!\'

  Daily Target    Progress bar toward       \'You are 61% of the way to
  Progress        merchant-set daily        today\'s R40,000 target.
                  revenue target            R15,130 to go. Based on your
                                            pattern, you should hit it by
                                            4pm.\'

  Alerts Banner   Low stock · Pending       PRIORITY: Displayed at TOP
                  settlement · KYC          above all other widgets. Red =
                  reminders · Licence       critical, Amber = warning,
                  expiry · Overdue invoices Teal = info. Swipe to dismiss.
  --------------- ------------------------- ------------------------------

+-----------------------------------------------------------------------+
| **04 GroSupply --- B2B Procurement Marketplace**                      |
|                                                                       |
| *Merchant Procurement · Supplier Portal · GroSettle · GroCredit ·     |
| GroFloat · Year 1: R17.4M*                                            |
+-----------------------------------------------------------------------+

**4.1 GroSupply Platform Overview**

GroSupply is a fully independent bounded context --- its own frontend
apps, backend service (Port 3040), PostgreSQL schema, Kafka topics, and
Admin Console. It integrates with Groway via well-defined APIs:
consuming merchant inventory data, pushing journal entries to
Accounting, and triggering payments via the Wallet/GoPay rail.
Developers can build and deploy GroSupply independently.

+-----------+-----------+-----------+-----------+-----------+-----------+
| *         | **57**    | **3-Way** | **4h**    | **4       | **9**     |
| *R17.4M** |           |           |           | Tiers**   |           |
|           | API       | PO/GR     | Instant   |           | Kafka     |
| Year 1    | Endpoints | N/Invoice | S         | GroCredit | Topics    |
| Revenue   |           | Match     | ettlement | F         |           |
| Target    |           |           |           | acilities |           |
+-----------+-----------+-----------+-----------+-----------+-----------+

**4.2 Complete Procurement Lifecycle**

  ------------ --------------------- ----------------------------------------
  **Stage**    **Trigger / Action**  **System Automation**

  1\. Low      Inventory Service     Kafka event inventory.low_stock →
  Stock        detects stock below   GroSupply auto-drafts RFQ + push
  Trigger      reorder threshold     notification to merchant: \'iPhone
                                     Charger running low (3 left). Auto-RFQ
                                     created --- review and send?\'

  2\. RFQ      Merchant              GroSupply routes to all eligible
  Creation     confirms/creates RFQ: suppliers (vertical-filtered, B-BBEE
               product, quantity,    tier optionally applied). Supplier
               delivery date,        receives push + email alert.
               location              

  3\. Supplier Suppliers log in to   Quote includes: unit price, MOQ, lead
  Quoting      portal/app and submit time, delivery terms, early payment
               quote within 48h      discount option. Auto-expires at 48h.
               window                

  4\. Quote    Merchant views        Auto-ranked by: (1) total cost, (2)
  Comparison   GroSupply comparison  delivery date, (3) supplier performance
               matrix                score, (4) B-BBEE tier. One-click select
                                     or split order.

  5\. Purchase Merchant accepts      GroSupply auto-generates PO
  Order        quote                 (PO-2026-00001 format) with all line
                                     items, quantities, prices, delivery
                                     address, payment terms. PDF dispatched
                                     to supplier via email + portal
                                     notification.

  6\. Dispatch Supplier confirms     Merchant app notified with tracking
  & Delivery   dispatch in portal or number. Real-time tracking via
               app                   GroDeliver API (DHL/RAM/Courier Guy).
                                     ETA displayed in merchant portal.

  7\. GRN      Merchant receives     Barcode scan per item → quantities
  Processing   goods, opens GRN on   matched to PO → batch numbers + expiry
               mobile app            captured → variance flagged. Complete
                                     GRN → Kafka grosupply.grn.completed →
                                     Inventory Service auto-updates stock.

  8\. 3-Way    Supplier uploads      GroSupply auto-matches: PO quantities +
  Invoice      invoice PDF to portal prices vs GRN received vs invoice
  Match                              values. Variance \>5% → review queue.
                                     Match → payable created automatically.

  9\.          Invoice match         Kafka grosupply.invoice.matched →
  Accounting   approved              Accounting Service auto-journals: Dr
  Journal                            Purchases/Stock Account, Cr Accounts
                                     Payable. Zero manual entry required.

  10\.         Merchant selects      Instant (4h): full amount minus
  GroSettle    settlement option     GroSettle fee (1.5--2.5%). Net-30: free.
  Payment                            Net-60: free. Dynamic discount: supplier
                                     offers early payment discount (e.g. 2%
                                     for payment within 7 days). Payment via
                                     GoPay EFT.
  ------------ --------------------- ----------------------------------------

**4.3 GroSupply Revenue Model**

  ------------------ --------------------------------------- -------------- --------------------
  **Revenue Stream** **Rate / Model**                        **Year 1       **Key Driver**
                                                             Projection**   

  GroSettle Instant  1.5--2.5% of invoice value (risk-based) R8M            30% of volume
  Fee                                                                       choosing instant
                                                                            settlement

  GroCredit Interest Repo + 5--8% p.a. (4 merchant tiers:    R4M            Working capital for
                     Starter/Business/Enterprise/Seasonal)                  merchants buying
                                                                            stock

  GroFloat Interest  Repo + 6--10% p.a. (supplier credit     R2M            Supplier liquidity
                     advance on order volume)                               before payment
                                                                            received

  Supplier Tier      Gold: R499/mo · Preferred: R999/mo      R1.5M          500 Gold + 100
  Subscription                                                              Preferred suppliers
                                                                            paying monthly

  Analytics Premium  R299/month (Gold/Preferred tier only)   R0.9M          250 paying suppliers
                                                                            accessing demand
                                                                            heatmaps

  GroDeliver         5--8% of delivery cost (DHL/RAM/Courier R1M            Coordinated
  Commission         Guy)                                                   last-mile delivery
                                                                            through GroSupply

  TOTAL YEAR 1                                               R17.4M         Conservative
                                                                            projection ---
                                                                            scales linearly with
                                                                            merchant base
  ------------------ --------------------------------------- -------------- --------------------

+-----------------------------------------------------------------------+
| **05 Backend API Reference**                                          |
|                                                                       |
| *528+ Endpoints · JWT-Authenticated · Kong Gateway · Rate Limited ·   |
| OpenAPI 3.0*                                                          |
+-----------------------------------------------------------------------+

**5.1 Authentication Architecture**

All consumer endpoints (except /v1/auth/\*) require Authorization:
Bearer \<JWT_ACCESS_TOKEN\>. Tokens are RS256-signed JWTs containing:
user_id, roles\[\], vertical_context, kyc_level. Access tokens expire in
15 minutes. Refresh tokens: 30 days. Biometric logins use
challenge-response --- the server issues a nonce, the device signs with
the biometric-bound key in the secure enclave, and the server verifies.
No biometric data is ever transmitted.

  ---------------- -------------- ------------------- -----------------------
  **Auth Type**    **Lifetime**   **Storage**         **Scope**

  Access Token     15 minutes     Memory only (never  API calls --- contains
  (JWT RS256)                     localStorage)       user_id, roles,
                                                      kyc_level,
                                                      vertical_context

  Refresh Token    30 days        httpOnly cookie     Token renewal only ---
                                  (web) / Keychain    cannot access APIs
                                  (iOS) / Keystore    directly
                                  (Android)           

  Biometric        60 seconds     Memory only         Single-use biometric
  Challenge Token                                     sign-in
                                                      challenge-response

  Admin JWT        1 hour         Secure session      Admin Console --- MFA
                                  (server-side)       required on every login

  API Key          Rotating       Merchant Portal     Webhook delivery +
  (Merchant)       (90-day)       settings            developer API access

  Offline Payment  72 hours       Device encrypted    Offline QR/NFC payments
  Token                           storage             when no connectivity
  ---------------- -------------- ------------------- -----------------------

**Rate Limiting (Kong Gateway)**

  --------------------- ---------------------- ---------------------------
  **Endpoint Category** **Rate Limit**         **Burst**

  Consumer general      100 req/min per JWT    20 req/sec
  endpoints                                    

  Merchant general      1,000 req/min per      50 req/sec
  endpoints             merchant JWT           

  Payment endpoints     10 req/min --- extra   3 req/sec
  (all /pay, /transfer, protection against     
  /qr/pay)              fraud                  

  Admin endpoints       500 req/min per admin  25 req/sec
                        JWT                    

  Public endpoints      20 req/min per IP      5 req/sec
  (/auth/register,                             
  /auth/login)                                 
  --------------------- ---------------------- ---------------------------

**5.2 Core Consumer API Endpoints**

**Authentication & Identity (Port 3001)**

  ------------ ----------------------- --------------------------------- -----------
  **Method**   **Route**               **Description**                   **Auth**

  **POST**     /v1/auth/register       New consumer registration with    Public
                                       phone OTP verification            

  **POST**     /v1/auth/login          Phone + 6-digit PIN login,        Public
                                       returns JWT access + refresh      
                                       tokens                            

  **POST**     /v1/auth/biometric      Biometric challenge-response      Public
                                       login (device secure enclave      
                                       signing)                          

  **POST**     /v1/auth/refresh        Renew access token using refresh  Public
                                       token                             

  **POST**     /v1/auth/otp/send       Send OTP to phone or email (rate: Public
                                       5/hour)                           

  **POST**     /v1/auth/otp/verify     Verify OTP code (6-digit, 5min    Public
                                       TTL)                              

  **POST**     /v1/auth/logout         Revoke refresh token (server-side JWT
                                       blacklist)                        

  **POST**     /v1/auth/pin/change     Change wallet PIN (requires       JWT
                                       current PIN + OTP confirmation)   

  **GET**      /v1/auth/sessions       List all active sessions with     JWT
                                       device name, IP, last seen        

  **DELETE**   /v1/auth/sessions/:id   Revoke specific session (security JWT
                                       centre feature)                   

  **POST**     /v1/auth/mfa/setup      Set up TOTP MFA (Google           JWT
                                       Authenticator compatible, RFC     
                                       6238)                             
  ------------ ----------------------- --------------------------------- -----------

**Wallet Core (Port 3012)**

  ------------ ----------------------------------- --------------------------------- -----------
  **Method**   **Route**                           **Description**                   **Auth**

  **GET**      /v1/wallet/balance                  Current balance: available +      JWT
                                                   reserved + savings pockets total  

  **GET**      /v1/wallet/transactions             Transaction history with          JWT
                                                   pagination, date range, category  
                                                   filters                           

  **POST**     /v1/wallet/transfer                 P2P transfer by phone number,     JWT
                                                   Groway ID, or QR. Idempotency key 
                                                   required.                         

  **POST**     /v1/wallet/transfer/request         Request money from another Groway JWT
                                                   user (sends push + WhatsApp)      

  **POST**     /v1/wallet/transfer/split           Initiate split bill --- select    JWT
                                                   contacts, assign amounts, send    
                                                   requests                          

  **POST**     /v1/wallet/transfer/scheduled       Create scheduled/recurring        JWT
                                                   transfer (daily/weekly/monthly)   

  **POST**     /v1/wallet/topup                    Top up wallet from card, EFT, or  JWT
                                                   cash code                         

  **POST**     /v1/wallet/topup/cash-code          Generate retail cash load         JWT
                                                   reference (Kazang/EasyPay         
                                                   network)                          

  **POST**     /v1/wallet/dispute/:transactionId   Raise transaction dispute with    JWT
                                                   evidence upload                   

  **GET**      /v1/wallet/export                   Export transaction history as CSV JWT
                                                   or PDF (3 months free, 12m        
                                                   premium)                          

  **GET**      /v1/wallet/pockets                  List savings pockets with goals,  JWT
                                                   progress, interest earned         

  **POST**     /v1/wallet/pockets                  Create savings pocket with goal   JWT
                                                   amount, target date, auto-save    
                                                   rules                             

  **GET**      /v1/wallet/stokvel                  Stokvel group details, members,   JWT
                                                   contributions, payout schedule    

  **POST**     /v1/wallet/stokvel                  Create or join stokvel savings    JWT
                                                   group                             

  **GET**      /v1/wallet/limits                   Current spending limits           JWT
                                                   (regulatory + self-imposed)       

  **PUT**      /v1/wallet/limits                   Update self-imposed spending      JWT
                                                   limits                            
  ------------ ----------------------------------- --------------------------------- -----------

**QR & NFC Payments (Port 3014)**

  ------------ ---------------------- --------------------------------- -----------
  **Method**   **Route**              **Description**                   **Auth**

  **GET**      /v1/qr/consumer        Get consumer static receive QR    JWT
                                      (permanent, embeds Groway ID)     

  **POST**     /v1/qr/dynamic         Generate dynamic QR with specific JWT
                                      amount (60s TTL for security)     

  **POST**     /v1/qr/scan            Process scanned merchant QR ---   JWT
                                      decode, validate, prepare payment 
                                      confirm                           

  **POST**     /v1/qr/pay             Execute QR payment --- requires   JWT
                                      confirmed amount + biometric/PIN  

  **GET**      /v1/qr/offline-token   Pre-load 72-hour offline payment  JWT
                                      token for connectivity-limited    
                                      use                               

  **GET**      /v1/nfc/token          Get NFC payment token             JWT
                                      (device-bound, secure enclave)    

  **POST**     /v1/qr/wearable/link   Link wearable device (watch/ring) JWT
                                      to account for tap payment        
  ------------ ---------------------- --------------------------------- -----------

**Credit & BNPL (Port 3016)**

  ------------ ------------------------------------------- --------------------------------- -----------
  **Method**   **Route**                                   **Description**                   **Auth**

  **GET**      /v1/credit/score                            Groway Credit Score (0--850) with JWT
                                                           factor breakdown and improvement  
                                                           tips                              

  **GET**      /v1/credit/eligibility                      Check BNPL eligibility based on   JWT
                                                           credit score + transaction        
                                                           history                           

  **POST**     /v1/credit/bnpl/initiate                    Start BNPL flow at POS checkout   JWT
                                                           (NCR-registered NCA agreement)    

  **GET**      /v1/credit/bnpl/disclosure/:applicationId   NCA-mandatory pre-agreement       JWT
                                                           disclosure (must display before   
                                                           acceptance)                       

  **POST**     /v1/credit/bnpl/accept                      Consumer accepts NCA credit       JWT
                                                           agreement (legally binding        
                                                           signature capture)                

  **GET**      /v1/credit/marketplace/prequalify           Soft credit check across all 8    JWT
                                                           lenders simultaneously (no credit 
                                                           bureau impact)                    

  **GET**      /v1/credit/marketplace/offers/:appId        All lender offers sorted by total JWT
                                                           cost (APR + fees)                 

  **GET**      /v1/credit/debit-orders                     DebiCheck mandates --- view,      JWT
                                                           pause, cancel instalment debit    
                                                           orders                            
  ------------ ------------------------------------------- --------------------------------- -----------

**International Remittance (Port 3017)**

  ------------ ------------------------- --------------------------------- -----------
  **Method**   **Route**                 **Description**                   **Auth**

  **GET**      /v1/remit/providers       List active remittance providers  JWT
                                         with corridors, limits, and KYC   
                                         requirements                      

  **GET**      /v1/remit/quote           Live exchange rate comparison     JWT
                                         across all 6 providers for        
                                         selected corridor                 

  **POST**     /v1/remit/kyc/initiate    Start sender KYC for SARB ADA     JWT
                                         compliance (FICA + FATF)          

  **POST**     /v1/remit/transfer        Initiate transfer via selected    JWT
                                         provider with BOP reference       
                                         auto-generation                   

  **GET**      /v1/remit/transfers/:id   Transfer status + real-time       JWT
                                         tracking + estimated delivery     
                                         time                              

  **GET**      /v1/remit/rates/history   Historical rate data for corridor JWT
                                         (1D/7D/30D/1Y chart)              
  ------------ ------------------------- --------------------------------- -----------

**5.3 Core Merchant API Endpoints**

**POS & Transactions (Port 3004)**

  ------------ -------------------------------- --------------------------------- -------------
  **Method**   **Route**                        **Description**                   **Auth**

  **POST**     /v1/pos/session/open             Open POS session with float       JWT+Staff
                                                declaration (cash drawer count)   

  **POST**     /v1/pos/session/close            Close POS session: cash count,    JWT+Manager
                                                over/short reconciliation,        
                                                z-report                          

  **POST**     /v1/pos/transaction              Create transaction: basket        JWT+Staff
                                                checkout with vertical-context    
                                                rules applied                     

  **POST**     /v1/pos/transaction/:id/void     Void transaction within same      JWT+Manager
                                                session (manager PIN required)    

  **POST**     /v1/pos/transaction/:id/refund   Process refund (full or partial)  JWT+Manager
                                                with biometric double-confirm     

  **POST**     /v1/pos/offline/sync             Sync offline transactions         JWT
                                                captured during connectivity loss 

  **POST**     /v1/pos/laybye/create            Create laybye agreement: item     JWT+Staff
                                                reservation + instalment schedule 
                                                (NCA-aware)                       

  **POST**     /v1/pos/bnpl/initiate            Initiate BNPL at checkout:        JWT+Staff
                                                triggers NCA disclosure flow      

  **GET**      /v1/pos/discount-rules           Active promotion rules for        JWT
                                                current vertical (BOGO, bundle,   
                                                clearance)                        
  ------------ -------------------------------- --------------------------------- -------------

**Accounting & ERP (Port 3006)**

  ------------ ------------------------------------- --------------------------------- ----------------
  **Method**   **Route**                             **Description**                   **Auth**

  **GET**      /v1/accounting/dashboard              P&L summary + 13-week cash flow   JWT+Owner
                                                     forecast + JAX AI weekly          
                                                     narrative                         

  **GET**      /v1/accounting/pl                     Profit & Loss report with         JWT+Owner
                                                     vertical-specific chart of        
                                                     accounts                          

  **GET**      /v1/accounting/cashflow               Cash flow statement --- actual +  JWT+Owner
                                                     13-week forward forecast          

  **POST**     /v1/accounting/invoices               Create customer invoice (PDF +    JWT+Manager
                                                     WhatsApp delivery)                

  **POST**     /v1/accounting/expenses               Capture expense with OCR receipt  JWT+Manager
                                                     scan (Mindee API)                 

  **POST**     /v1/accounting/bank-feeds/reconcile   Match bank statement lines to     JWT+Accountant
                                                     accounting entries                

  **GET**      /v1/accounting/vat201                 Auto-generated VAT 201 return     JWT+Owner
                                                     draft (SARS-format)               

  **GET**      /v1/accounting/jax/query              JAX AI natural language query:    JWT+Owner
                                                     \'What was my profit last         
                                                     month?\'                          

  **GET**      /v1/accounting/jax/narrative          AI-generated weekly business      JWT+Owner
                                                     performance narrative in plain    
                                                     language                          
  ------------ ------------------------------------- --------------------------------- ----------------

**CRM & Loyalty (Port 3007)**

  ------------ --------------------------- --------------------------------- -------------
  **Method**   **Route**                   **Description**                   **Auth**

  **GET**      /v1/crm/customers           Customer list with RFM scores     JWT+Manager
                                           (Recency, Frequency, Monetary     
                                           value)                            

  **GET**      /v1/crm/customers/:id       Full customer profile: purchase   JWT+Manager
                                           history, loyalty points,          
                                           segments, LTV                     

  **GET**      /v1/crm/churn-risk          At-risk customer list (no         JWT+Manager
                                           purchase in 60 days) with         
                                           recommended action                

  **POST**     /v1/crm/campaigns           Create WhatsApp/SMS marketing     JWT+Manager
                                           campaign with segment targeting   

  **GET**      /v1/crm/loyalty/programme   Loyalty programme settings: earn  JWT+Owner
                                           rates, tier thresholds,           
                                           redemption options                

  **PUT**      /v1/crm/loyalty/programme   Update reward earn rates and tier JWT+Owner
                                           benefit configuration             

  **GET**      /v1/crm/rfm                 Full RFM segmentation analysis    JWT+Manager
                                           with actionable segment           
                                           descriptions                      
  ------------ --------------------------- --------------------------------- -------------

+-----------------------------------------------------------------------+
| **06 Database Architecture**                                          |
|                                                                       |
| *PostgreSQL 15 · 206 Tables · Row-Level Security · AES-256 Encryption |
| · UUID PKs*                                                           |
+-----------------------------------------------------------------------+

**6.1 Schema Strategy**

PostgreSQL 15 with Row-Level Security (RLS) for multi-tenant isolation.
Each merchant is a tenant. Sensitive PII fields encrypted at rest
(AES-256). All tables include created_at/updated_at/deleted_at (soft
delete pattern). UUID primary keys throughout --- no sequential integer
IDs exposed to clients. All monetary values stored as BIGINT (cents) ---
never DECIMAL/FLOAT to avoid floating-point precision errors.

+---+---------------------------------------------------------------------+
| * | **Critical Monetary Rule**                                          |
| * |                                                                     |
| \ | ALL monetary values across the entire Groway platform are stored as |
| $ | BIGINT in cents (smallest currency unit). Never use DECIMAL or      |
| * | FLOAT for money. R100.50 is stored as 10050. This eliminates        |
| * | floating-point precision errors and ensures exact arithmetic in     |
|   | financial calculations. The presentation layer formats amounts      |
|   | using a shared currency formatter function with correct decimal     |
|   | places per currency.                                                |
+---+---------------------------------------------------------------------+

**6.2 Users & Identity Schema**

  -------------------------- -------------- ---------------- ---------------------------------------------
  **Column**                 **Type**       **Constraint**   **Notes**

  **user_id**                UUID           PK DEFAULT       Immutable primary key --- never exposed as
                                            uuid()           integer

  **phone_number**           VARCHAR(15)    UNIQUE NOT NULL  E.164 format (+27\...). Primary identifier
                                                             for SA users.

  **id_number**              VARCHAR(13)    UNIQUE ENCRYPTED SA ID (13-digit) encrypted AES-256 at column
                                                             level · POPIA

  **kyc_level**              INTEGER        DEFAULT 0        0=unverified · 1=phone+OTP · 2=ID scan ·
                                                             3=biometric · 4=full FICA

  **wallet_balance_cents**   BIGINT         DEFAULT 0 NOT    Available balance in ZAR cents. R100 = 10000.
                                            NULL             Never DECIMAL.

  **groway_credit_score**    INTEGER        DEFAULT 0        GCS score. Updated nightly by ML model. 0
                                            CHECK(0-850)     until first transaction.

  **loyalty_tier**           VARCHAR(20)    DEFAULT          bronze \| silver \| gold \| platinum ·
                                            \'bronze\'       Updated by CRM Service

  **loyalty_points**         INTEGER        DEFAULT 0 NOT    Total redeemable points. 1 point = R0.01
                                            NULL             cashback value.

  **popia_consent**          JSONB          NOT NULL         {marketing: bool, analytics: bool, sharing:
                                                             bool, timestamp: ISO8601}

  **language_preference**    VARCHAR(5)     DEFAULT \'en\'   en\|af\|zu\|xh\|st\|ts\|ss\|ve\|tn\|nr\|nso
                                                             --- all 11 SA official languages

  **biometric_key_id**       VARCHAR(200)   NULLABLE         Device public key for biometric
                                            ENCRYPTED        challenge-response. Never private key.

  **account_status**         VARCHAR(20)    DEFAULT          active \| frozen \| suspended \| closed.
                                            \'active\'       Frozen blocks all outgoing transactions.

  **pin_hash**               VARCHAR(200)   NOT NULL         bcrypt hash (cost factor 12). PIN never
                                            ENCRYPTED        stored in plaintext or logs.

  **failed_pin_attempts**    INTEGER        DEFAULT 0        Resets to 0 on successful login. Lockout at 5
                                                             attempts for 30 minutes.

  **daily_spend_cents**      BIGINT         DEFAULT 0        Rolling 24-hour spend counter. Resets at
                                                             midnight SAST.

  **kyc_documents**          JSONB          NULLABLE         {id_front_url, id_back_url, selfie_url,
                                                             poa_url} --- S3 presigned URLs
  -------------------------- -------------- ---------------- ---------------------------------------------

**6.3 Transactions Schema (Core Ledger)**

  ---------------------- -------------- ---------------- ----------------------------------------------------------------------------------------------
  **Column**             **Type**       **Constraint**   **Notes**

  **transaction_id**     UUID           PK               Immutable. Never reused even on reversal.

  **idempotency_key**    VARCHAR(100)   UNIQUE NOT NULL  Client-generated key prevents double-processing on retry. Required on all POSTs.

  **vertical_context**   VARCHAR(20)    NOT NULL         grocery\|salon\|retail\|bar\|liquor\|hotel\|pharmacy\|spaza\|funeral\|laundromat\|restaurant

  **payer_id**           UUID           FK users NOT     The account being debited. RLS enforced on queries.
                                        NULL             

  **payee_id**           UUID           FK users         NULL for merchant payments (use merchant_id instead). P2P uses both.
                                        NULLABLE         

  **merchant_id**        UUID           FK merchants     Set for merchant POS transactions. NULL for P2P.
                                        NULLABLE         

  **amount_cents**       BIGINT         NOT NULL         Positive value. Always represents the gross amount charged to payer.
                                        CHECK(\>0)       

  **fee_cents**          BIGINT         DEFAULT 0        Groway platform fee. Shown transparently on confirm screen.

  **vat_amount_cents**   BIGINT         DEFAULT 0        15% VAT portion for VATable items. 0 for zero-rated (grocery staples).

  **currency**           CHAR(3)        DEFAULT \'ZAR\'  ISO 4217. Multi-currency support for FX remittance transactions.

  **payment_method**     VARCHAR(30)    NOT NULL         wallet\|card_token\|gopay\|payshap\|cash\|voucher\|bnpl\|laybye\|nfc

  **status**             VARCHAR(20)    DEFAULT          pending → processing → completed\|failed\|reversed\|disputed
                                        \'pending\'      

  **journal_entry_id**   UUID           FK accounting    Every transaction auto-creates a double-entry journal in Accounting Service.
                                        NOT NULL         

  **receipt_url**        TEXT           NULLABLE         S3 URL of generated PDF receipt. Available 24h after transaction.

  **dispute_id**         UUID           FK disputes      Set when consumer raises a dispute on this transaction.
                                        NULLABLE         

  **created_at**         TIMESTAMP      DEFAULT NOW()    Transaction initiation time (not completion). Used for daily limit calculation.
                                        NOT NULL         

  **completed_at**       TIMESTAMP      NULLABLE         Set when status becomes completed or failed. NULL while pending/processing.
  ---------------------- -------------- ---------------- ----------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **07 Security & Compliance Architecture**                             |
|                                                                       |
| *PCI DSS L1 · SARB · FSCA · NCR/NCA · POPIA · FICA · BCEA --- Built   |
| for South Africa*                                                     |
+-----------------------------------------------------------------------+

**7.1 PCI DSS Level 1 Controls**

Groway is designed for PCI DSS Level 1 compliance --- the highest
standard, required for platforms processing over 6 million card
transactions per year. The payment service (Port 3013) runs in a
physically isolated VPC with no direct inter-service connections except
through the payment gateway. No PAN (Primary Account Number) is ever
stored.

  -------- ------------------ ----------------------------------------------
  **PCI    **Requirement**    **Groway Implementation**
  Req.**                      

  Req 1--2 Network            CDE (Card Data Environment) in isolated AWS
           segmentation       VPC. Separate EKS cluster. WAF + Cloudflare.
                              No inter-service access to CDE except via
                              payment gateway.

  Req 3    Protect stored     ZERO PANs stored. Tokenisation via Peach
           card data          Payments/Yoco. Only stored: last_4 digits,
                              card_type, expiry month/year, token. Token
                              stored AES-256 encrypted.

  Req 4    Encrypt data in    TLS 1.3 minimum. TLS 1.0/1.1 completely
           transit            disabled. Certificate pinning on mobile apps.
                              HSTS on all web endpoints. No HTTP anywhere.

  Req 6    Secure development OWASP Top 10 mitigations built-in. SonarQube
                              code quality gates in CI/CD. Snyk dependency
                              vulnerability scanning. Payment service PRs
                              require security review from SEC team.

  Req 7    Restrict access to IAM least-privilege. Port 3013 has no public
           CDE                DNS. Only payment gateway can reach CDE
                              cluster. All CDE access requires MFA.

  Req 8    Identify and       Unique credentials per developer. No shared
           authenticate       accounts. MFA mandatory for all admin.
                              Privileged access management (PAM) for
                              production access.

  Req 10   Log and monitor    All CDE access immutably logged to AWS
           all access         CloudTrail (WORM storage). SIEM real-time
                              alerts on anomalies. 12-month log retention.
                              Daily log review by SEC team.

  Req 11   Security testing   Quarterly ASV (Approved Scanning Vendor)
                              scans. Annual QSA penetration test. Bug bounty
                              programme via HackerOne. Chaos engineering
                              quarterly.

  Req 12   Security policy    Written security policy. Annual PCI DSS
                              awareness training for all staff. Incident
                              response plan tested annually. QSA assessment
                              annually.
  -------- ------------------ ----------------------------------------------

**7.2 POPIA Compliance Framework**

  --------------------- -------------------------------------------------
  **POPIA Requirement** **Implementation**

  Lawful processing     Explicit consent captured at registration with
  basis                 granular toggles: {marketing, analytics,
                        third-party sharing}. Each with timestamp. Stored
                        in users.popia_consent JSONB. Cannot be coerced.

  Purpose limitation    Data collected only for stated payment/financial
                        service purposes. JAX AI analytics require
                        explicit opt-in. No data sold to third parties
                        --- Anthropic model.

  Data minimisation     KYC documents deleted 30 days after verification
                        unless legally required for FICA. Selfie
                        processed by Smile Identity --- not stored raw by
                        Groway.

  Data subject rights   Subject Access Request: 30-day processing via
                        Admin Console POPIA queue. Right to deletion:
                        implemented (soft delete with 7-year FICA
                        retention override for transactions). Right to
                        correction: self-service via profile.

  Cross-border          All SA user data stored exclusively in AWS
  transfers             af-south-1 (Cape Town). SADC supplier data:
                        explicit consent per POPIA Section 72 before any
                        cross-border processing. No data in US/EU without
                        consent.

  Data breach           Breach register maintained in Admin Console.
  notification          POPIA requires notification within reasonable
                        time. Protocol: internal 1h → legal 4h →
                        Regulator (ICRSA) 72h if high risk → affected
                        users 48h after regulator.

  Information Officer   Designated Information Officer registered with
                        ICRSA. Contact published on privacy policy and
                        in-app settings. Quarterly POPIA compliance
                        review.
  --------------------- -------------------------------------------------

**7.3 South African Regulatory Compliance Summary**

  ---------------- --------------------- ---------------------------------
  **Regulator /    **Requirement**       **Groway Status /
  Law**                                  Implementation**

  SARB --- Reserve E-money licence /     SARB notification filed. E-money
  Bank             Payment System        licence application in progress.
                   Operator licence for  Compliant with National Payment
                   wallet and payments   System Act.

  FSCA ---         FAIS licence for      Credit marketplace
  Financial Sector financial product     intermediation: registered FSP.
  Conduct          advice / credit       Remittance: Authorised Dealer in
  Authority        intermediation via    Foreign Currency (ADA) process
                   offers                underway.

  NCR --- National NCR registration for  NCR registration number active.
  Credit Regulator BNPL and GroCredit.   NCA pre-agreement disclosures on
                   NCA credit agreement  all credit flows. Cooling-off
                   compliance.           period implemented. DebiCheck
                                         mandates via BankServ.

  SARS --- Revenue VAT registration      Accounting Service auto-generates
  Service          (VATable/zero-rated   VAT 201 drafts. IRP5/EMP201 via
                   split). EMP201/IRP5   Payroll Service. SARS eFiling
                   payroll filing. VAT   integration planned.
                   201.                  

  SAHPRA ---       Pharmacy vertical:    Pharmacy Service enforces
  Health Products  scheduled drug        Schedule 0--6 rules. Pharmacist
  Regulator        register. SAHPRA      PIN required for S5/S6. SAHPRA
                   licensing for         licence verification during
                   pharmacy merchants.   merchant KYB.

  FICA ---         KYC/AML for all       4-level KYC progression.
  Financial        consumers and         ComplyAdvantage for PEP/sanctions
  Intelligence     merchants. SAR filing screening. SAR workflow in Admin
  Centre Act       to FIC. Sanctions     Console for filing to FIC.
                   screening.            

  Liquor Act       Age verification      Liquor vertical: mandatory age
                   (18+) for all liquor  check (biometric or ID scan).
                   sales. Trading hours  Trading hours enforced by POS
                   enforcement per       Service with province-aware
                   province.             configuration.

  BCEA --- Basic   Leave management,     Payroll Service: PAYE/UIF/SDL
  Conditions of    payslips, payroll     correct calculations. Leave types
  Employment Act   deductions            per BCEA
                   compliance.           (annual/sick/family/maternity).
                                         Payslip format BCEA-compliant.
  ---------------- --------------------- ---------------------------------

+-----------------------------------------------------------------------+
| **08 UI/UX Design System**                                            |
|                                                                       |
| *Distinctly African · Trust-First · Vibrant · Accessible · Data-Light |
| · WCAG 2.1 AA*                                                        |
+-----------------------------------------------------------------------+

**8.1 Design Philosophy**

Groway\'s UI must accomplish three things simultaneously: eliminate
cognitive overload (every screen has a single primary action), build
trust at every interaction (clarity, confirmation, and security signals
throughout), and serve diverse users (from first-time smartphone users
to power merchants). Groway UI should feel as natural as cash --- but
smarter, safer, and faster. The brand has a distinctly African identity:
vibrant, warm, accessible, and community-oriented.

+-----------------------------------+-----------------------------------+
| **Brand Colors**                  | **Typography Scale**              |
|                                   |                                   |
| -   Hope Teal #00897B --- Primary | -   Typeface: Inter (Google       |
|     CTAs, logo, key data          |     Fonts, all weights)           |
|                                   |                                   |
| -   Growth Green #4CAF50 ---      | -   display-xl: Inter Bold        |
|     Success states, confirmations |     48--72px --- balance amounts, |
|                                   |     hero numbers                  |
| -   Light Green #81C784 --- Hover |                                   |
|     states, secondary accents     | -   heading-1: Inter SemiBold     |
|                                   |     32--40px --- screen titles    |
| -   Deep Charcoal #2E2E2E ---     |                                   |
|     Headlines, primary text       | -   heading-2: Inter SemiBold     |
|                                   |     24--28px --- section headings |
| -   Off-White #FFFFFF --- Card    |                                   |
|     backgrounds, light mode base  | -   heading-3: Inter SemiBold     |
|                                   |     18--20px --- list headers     |
| -   Warm Cream #FFF3E0 ---        |                                   |
|     Section backgrounds, warmth   | -   body-large: Inter Regular     |
|                                   |     16--18px --- primary body     |
| -   Mid-Gray #E0E0E0 --- Borders, |     copy                          |
|     dividers, disabled            |                                   |
|                                   | -   body-small: Inter Regular     |
| -   Error Red #E53935 ---         |     14px --- secondary text       |
|     EXCLUSIVELY errors/alerts     |                                   |
|     (never brand)                 | -   caption: Inter Regular        |
|                                   |     12--13px --- timestamps,      |
| -   Warning Amber #FFB300 ---     |     metadata                      |
|     Pending states, warnings      |                                   |
|                                   | -   label: Inter Medium 11--12px  |
| -   GRADIENT: #00897B → #4CAF50   |     / UPPERCASE / 0.08em --- form |
|     (135°) --- Primary buttons,   |     labels, status chips          |
|     hero areas, balance card      |                                   |
|                                   | -   RULE: Never use font weight   |
|                                   |     \<300 below 18px ---          |
|                                   |     illegible on AMOLED           |
+-----------------------------------+-----------------------------------+

**8.2 Design Tokens**

  ------------ ------------------- ------------------ ----------------------------
  **Token      **Token**           **Value**          **Usage**
  Category**                                          

  Spacing (4px space-1             4px                Icon padding, micro gaps
  base grid)                                          

  Spacing      space-4             16px               Default component padding

  Spacing      space-5             20px               Card padding (mobile)

  Spacing      space-6             24px               Section spacing

  Spacing      space-12            48px               Screen top padding

  Border       radius-sm           8px                Chips, badges, small
  Radius                                              elements

  Border       radius-md           12px               Input fields, secondary
  Radius                                              cards

  Border       radius-lg           16px               Primary cards, modals
  Radius                                              

  Border       radius-xl           24px               Balance cards, hero areas
  Radius                                              

  Border       radius-full         9999px             Pills, avatar, FAB buttons
  Radius                                              

  Elevation    elevation-1         0 1px 4px          Cards on white/cream
                                   rgba(0,0,0,0.08)   background

  Elevation    elevation-2         0 4px 12px         Floating cards, active
                                   rgba(0,0,0,0.12)   states

  Elevation    elevation-3         0 8px 24px         Modals, bottom sheets
                                   rgba(0,0,0,0.16)   

  Elevation    elevation-4         0 16px 40px        FAB, full-screen overlays
                                   rgba(0,0,0,0.20)   

  Animation    micro-interaction   100--150ms         Button taps, toggles
                                   ease-out           

  Animation    screen-transition   300ms ease-in-out  Screen push/pop

  Animation    bottom-sheet        350ms spring(1,    Bottom sheet open --- feels
                                   0.9, 400)          heavy and real

  Animation    success-tick        600ms ease-out     Lottie animation after
                                                      payment success
  ------------ ------------------- ------------------ ----------------------------

**8.3 Component Library**

  --------------- ------------------------- -------------------------------
  **Component**   **Specification**         **Critical Rules**

  Primary Button  Gradient bg (teal→green)  Scale(0.97) + shadow reduction
                  · white text ·            on tap. Never opacity-only. Max
                  radius-full (9999px) ·    2 primary CTAs per screen.
                  elevation-2 · 52px height 

  Secondary       Teal border 2px · teal    Same tap states as primary. Use
  Button          text · white bg ·         when primary is present.
                  radius-full · 52px height 

  Destructive     Error Red (#E53935) bg ·  Always require double-confirm
  Button          white text · radius-full  modal before destructive action
                  · 52px                    executes.

  Input Field     1px border #E0E0E0 ·      Label floats on focus
  (Default)       white bg · 12px radius ·  (animated). Teal 2px border +
                  16px padding · 52px       glow on focus.
                  height                    

  Amount Input    Inter Bold 40px ·         Auto-insert decimal. Show
                  centre-aligned · no       currency symbol always. Comma
                  border · underline only · thousands separator.
                  auto-formatted            

  Balance Card    Gradient bg · radius-xl   Masked by default. Tap eye icon
                  (24px) · elevation-2 ·    to reveal. Pinch gesture also
                  white text only · 160px   toggles.
                  min height                

  Service Tile    White bg · radius-lg      Long-press → reorder mode.
                  (16px) · elevation-1 ·    \'More\' tile always last. Max
                  72×72px · gradient icon · 8 visible.
                  2-line label max          

  Transaction Row White bg · full-width ·   Green for positive · Red for
                  72px height · 40px avatar negative. Never show amount
                  left · amount             without currency symbol.
                  right-aligned             

  QR Code         Min 240×240px (consumer)  Groway logo centred at 20% of
                  / 280×280px (merchant) ·  QR size · Error correction
                  White background enforced Level H · Refresh button every
                                            60s.

  Bottom Sheet    Slides up from bottom ·   350ms spring animation. Never
                  50%/75%/full snap points  use for critical confirmations
                  · drag handle ·           --- use full modal.
                  tap-outside to dismiss    

  Success         Full-screen green         Show: recipient, amount,
  Animation       background · Lottie tick  reference, new balance.
                  animation · 600ms · 2s    Auto-advance after 2s. Share
                  hold                      receipt CTA.

  Toast / Alert   Success: green bg ·       Use aria-live=\'polite\'
                  Error: red bg (persists   (non-critical) or \'assertive\'
                  until tapped) · 3s        (errors) for screen reader.
                  auto-dismiss for success  

  Loading         Shimmer: #E0E0E0 →        Show skeleton within 300ms of
  Skeleton        #F5F5F5 · 1400ms loop ·   screen open. Never show spinner
                  linear easing             for \> 5 seconds.
  --------------- ------------------------- -------------------------------

+-----------------------------------------------------------------------+
| **09 JAX AI --- Financial Superagent & Intelligence Layer**           |
|                                                                       |
| *NLP Accounting · Predictive Analytics · Offer Targeting · Fraud      |
| Detection · Credit Scoring*                                           |
+-----------------------------------------------------------------------+

**9.1 JAX AI Service Overview**

JAX (Just Ask Anything) is Groway\'s AI financial superagent. It sits at
the intersection of the accounting, analytics, CRM, credit, and fraud
detection systems. JAX makes Groway\'s data meaningful --- transforming
numbers into narratives, patterns into predictions, and anomalies into
alerts. JAX is accessible via natural language query and proactively
surfaces insights without users needing to ask.

  ---------------- ---------------------- -------------------------------
  **JAX Feature**  **Description**        **User-Facing Output**

  Natural Language Merchant types         \'What was my profit last
  Accounting       question in plain      month?\' → \'Your net profit in
  Queries          language. JAX          January was R42,300. Revenue
                   translates to          was R198,000 and costs (COGS
                   accounting queries +   R110,000 + expenses R45,700)
                   synthesises answer.    totalled R155,700. Margin:
                                          21.4%\'

  Weekly Business  Auto-generated         \'Good morning, Kojo. Last week
  Narrative        plain-language         was your best week of Q1. You
                   business summary every processed 284 transactions
                   Monday morning at      totalling R92,400. Your top
                   06:00 SAST             product was phone cases. One
                                          area to watch: margin on
                                          Samsung accessories dropped 4%
                                          --- possibly due to increased
                                          input costs.\'

  Consumer Daily   Personalised daily     \'Your electricity is running
  Financial Tip    nudge based on user\'s low --- about 4 days remaining
                   spending patterns and  based on your usage. Top up
                   upcoming commitments   before Thursday to avoid
                                          outage. One tap to buy R200
                                          token.\'

  Electricity      ML model based on      Displayed as banner on home
  Usage Prediction historical purchase    screen with days remaining +
                   patterns predicts days top-up CTA. Re-trained monthly
                   of electricity         per user.
                   remaining              

  AI Offer         User spending pattern  Consumer sees offers most
  Targeting        analysis → offer       relevant to their actual
                   relevance scoring →    behaviour. CTR 3× higher than
                   personalised feed      non-personalised feed
                   ranking                (benchmark: Alipay AI offers).

  Merchant Revenue Pattern analysis on    \'You sold the most between
  Insight          transaction data →     12pm--2pm today (34% of
                   plain-language insight revenue). Your Tuesday
                   above every dashboard  performance is consistently 23%
                   chart                  below your weekly average ---
                                          consider a Tuesday special to
                                          drive footfall.\'

  Churn Prediction RFM + recency model    CRM churn alert list with
                   identifies customers   recommended action: \'Send
                   at risk of not         WhatsApp discount voucher to
                   returning (\>60 days   these 12 customers who haven\'t
                   since purchase)        visited in 60+ days.\'

  Groway Credit    45-feature ML model    Consumer-facing 0--850 score
  Score (GCS)      updated nightly:       with factor breakdown:
                   transaction volume,    \'Payment reliability:
                   payment reliability,   Excellent. Transaction history:
                   wallet behaviour,      Good. Account age: Building.\'
                   business performance   Soft credit checks for BNPL
                   (for merchants)        pre-qualification.

  Fraud Detection  Velocity rules + ML    Triggers: new device + large
  (Real-time)      anomaly detection on   amount + new recipient → manual
                   every transaction.     biometric confirm prompt. Admin
                   Flags unusual patterns alert for review. Transaction
                   instantly.             held in \'processing\' while
                                          risk assessed.

  Smart Reorder    ML predicts reorder    GroSupply push: \'Based on your
  (GroSupply)      point 3--5 days before current sales, you\'ll run out
                   stock hits threshold   of iPhone chargers in 4 days.
                   based on sales         Auto-draft RFQ created ---
                   velocity               review and send?\'
  ---------------- ---------------------- -------------------------------

+-----------------------------------------------------------------------+
| **10 Event Architecture & Third-Party Integrations**                  |
|                                                                       |
| *Kafka · EventBridge · Webhooks · All SA Banks · Payment Rails ·      |
| Remittance Providers*                                                 |
+-----------------------------------------------------------------------+

**10.1 Core Kafka Domain Events**

  --------------------------- --------------- -------------------------------------
  **Event Topic**             **Publisher**   **Subscribers & Actions**

  transaction.completed       POS Service /   Accounting (auto-journal) · CRM
                              Wallet Service  (update loyalty points + RFM score) ·
                                              Notification (SMS/push receipt) ·
                                              Analytics (real-time dashboard)

  transaction.refunded        POS Service     Accounting (reversal double-entry
                                              journal) · CRM (deduct loyalty
                                              points) · Notification (consumer +
                                              merchant alert)

  wallet.topup                Wallet Service  Notification (SMS confirmation) ·
                                              Analytics (fund inflow tracking)

  payment.failed              Payment Service Notification (retry prompt to
                              CDE             consumer) · Fraud Service (flag if
                                              repeated) · Merchant (cashier failure
                                              alert)

  inventory.low_stock         Inventory       GroSupply (auto-draft RFQ) ·
                              Service         Notification (merchant push alert) ·
                                              Analytics (stock health dashboard)

  inventory.expired           Inventory       Accounting (wastage write-off
                              Service         journal) · Notification (merchant
                                              alert) · Compliance (SAHPRA recall
                                              check for pharmacy)

  credit.instalment_due       Credit Service  Notification (3-day advance warning
                                              to consumer) · DebiCheck (trigger
                                              mandate on due date)

  credit.instalment_failed    Credit Service  Notification (SMS to consumer with
                                              catch-up options) · GCS model update
                                              (negative signal) · Collections
                                              workflow trigger

  kyc.approved                Compliance      User Service (upgrade kyc_level
                              Service         field) · Notification (unlock
                                              features message) · Wallet Service
                                              (increase transaction limits)

  offer.redeemed              Offers Service  CRM (update customer segment +
                                              loyalty points) · Analytics (offer
                                              performance tracking) · Merchant
                                              Notification

  grosupply.grn.completed     GroSupply       Inventory Service (update stock
                              Service         levels + batch records) · Accounting
                                              (create AP payable) · Notification
                                              (merchant + supplier)

  grosupply.payment.settled   GroSupply       Accounting (Dr AP, Cr Bank journal) ·
                              Service         Notification (supplier payment
                                              confirmation) · Analytics (GroSettle
                                              revenue tracking)

  payroll.run_completed       Payroll Service Accounting (wage/deduction journals
                                              per employee) · Notification (payslip
                                              delivery via email/WhatsApp) · Wallet
                                              Service (initiate salary payments)

  remittance.delivered        Remittance      Notification (WhatsApp confirmation
                              Service         to sender) · Accounting (commission
                                              journal) · Compliance (BOP register
                                              update)
  --------------------------- --------------- -------------------------------------

**10.2 Third-Party Integration Catalogue**

  ------------------ ------------------ ---------------------------------------------
  **Integration**    **Provider**       **Purpose**

  Card Payments      Peach Payments +   Card tokenisation, 3DS2 authentication,
                     Yoco               payment gateway processing

  Instant Bank       BankServ GoPay     Bank-to-bank push payments, 6 major SA banks
  Transfer                              (FNB/ABSA/StdBank/Nedbank/Capitec/TymeBank)

  PayShap Real-Time  BankServ PayShap   Proxy-addressed instant payments,
  Payments                              request-to-pay, DebiCheck mandates

  Open Banking (Bank Stitch Money /     OAuth2 bank account linking, read-only
  Feeds)             Basiq              transaction data for reconciliation

  Electricity Tokens Kazang / EasyPay   STS prepaid electricity token generation,
  (STS)                                 250+ municipality support

  Bill Payments      EasyPay network    DSTV, insurance, traffic fines, school fees,
                                        municipal rates payment processing

  KYC / Face Match   Smile Identity     SA ID document verification, selfie liveness
                                        check, face match, biographic lookup

  Sanctions          ComplyAdvantage    Real-time PEP (Politically Exposed Person)
  Screening                             and sanctions list screening

  Remittance ---     Chipper Cash,      Southern/Eastern/Western Africa money
  Africa corridors   Mukuru, TerraPay   transfer corridors

  Remittance ---     WorldRemit, AZA    Global remittance corridors, stablecoin rail
  Global             Finance            (USDC/Stellar)

  Transport ---      Gautrain GMA API,  Public transport card top-ups, balance
  Urban              MyCiTi, Rea Vaya   enquiry

  Transport ---      Greyhound,         Intercity bus ticket booking, seat selection,
  Intercity bus      Intercape,         cancellation
                     Translux           

  Domestic Flights   FlySafair, Lift    Flight search, booking, web check-in,
                     (via Travelstart   boarding pass
                     GDS)               

  Event Ticketing    Computicket,       Event discovery, ticket booking, e-ticket QR
                     Quicket            delivery

  Vouchers           Electrum, Bluegum  Open-loop voucher aggregator, 500+ merchant
                                        brands

  WhatsApp Business  Meta Cloud API via Transactional messages, OTP, receipts, CRM
  API                Twilio             campaigns, PayShap vouchers

  SMS                Twilio             OTP delivery, transaction alerts, marketing
                                        opt-in campaigns

  Push Notifications Firebase (FCM) +   iOS + Android push notification delivery with
                     Apple (APNS)       deep link support

  Email              AWS SES            Receipts, payslips, reports, merchant
                                        invoices, system notifications

  Delivery           DHL, RAM, Courier  Last-mile delivery for GroSupply orders,
                     Guy (via           real-time tracking
                     GroDeliver)        

  Accounting OCR     Mindee API         Receipt scanning and data extraction for
                                        expense capture

  Credit Bureaux     TransUnion SA      Soft credit checks for BNPL
                                        pre-qualification, GCS model data

  Monitoring         Datadog APM,       Distributed tracing, log aggregation, on-call
                     Grafana, PagerDuty alerting
  ------------------ ------------------ ---------------------------------------------

+-----------------------------------------------------------------------+
| **11 Groway Admin Console**                                           |
|                                                                       |
| *Internal Operations · Compliance · Fraud Management · Financial Ops  |
| · Content · All 35 Services*                                          |
+-----------------------------------------------------------------------+

**11.1 Admin Console Modules**

The Admin Console is the internal operations platform for the Groway
team. Access is role-gated with MFA mandatory for all admin accounts.
All admin actions are immutably logged to AWS CloudTrail. Admin roles:
super_admin \| compliance_officer \| finance_ops \| support_agent \|
read_only.

  ---------------- --------------------------------------- ---------------------
  **Module**       **Features**                            **Roles**

  Platform         Real-time: transactions/minute · active All roles
  Dashboard        sessions · error rates · payment        
                   success rate · 35-service health grid · 
                   revenue today/MTD/YTD · Kafka consumer  
                   lag                                     

  Merchant         Merchant list · KYC/KYB status ·        super_admin,
  Management       vertical config · feature flags ·       support_agent
                   settlement history · risk score ·       
                   manual override · suspend/activate ·    
                   compliance status · GroSupply link      

  Consumer         User search · KYC/FICA status · wallet  super_admin,
  Management       balance + history · account freeze ·    support_agent,
                   fraud flags · POPIA subject access      compliance_officer
                   request queue · credit score view       

  Financial        E-money float management · settlement   finance_ops,
  Operations       batch approval · failed payment queue · super_admin
                   GoPay/PayShap reconciliation ·          
                   interchange reports · provider          
                   commission tracking                     

  Compliance & AML SAR (Suspicious Activity Report)        compliance_officer,
                   drafting + FIC submission queue · FICA  super_admin
                   screening results · PCI DSS audit log   
                   (immutable) · POPIA breach register ·   
                   SARB reporting · NCR submissions        

  Fraud & Risk     Real-time ML fraud alerts · velocity    super_admin,
                   rule management · IP/device blacklist · finance_ops
                   transaction review hold queue ·         
                   chargeback management · anomaly         
                   detection feed                          

  Remittance       Provider API status · corridor rate     compliance_officer,
  Operations       feeds · BOP reference register · KYC    finance_ops
                   queue · failed transfer remediation ·   
                   FATF Travel Rule monitoring             

  Credit           GCS model performance monitoring · BNPL finance_ops,
  Operations       book overview · DebiCheck mandate       compliance_officer
                   status · NCR data submissions ·         
                   collections queue · lender marketplace  
                   performance                             

  Content          Voucher partner management · offer      super_admin
  Management       catalogue approval · notification       
                   templates · JAX AI system prompt        
                   management · banner management ·        
                   ticketing provider config               

  GroSupply Admin  Supplier onboarding queue · B-BBEE      super_admin,
                   verification · GroSettle payment        finance_ops
                   approval queue · GroCredit portfolio ·  
                   dispute resolution queue                

  Developer / API  API key management · webhook            super_admin
                   configuration · rate limit management · 
                   35-service health grid · feature flag   
                   management · deployment status          

  Reports &        Revenue by service · vertical           All roles
  Analytics        performance · geography heatmaps · NPS  
                   scores · cohort retention analysis ·    
                   JAX AI platform narrative               
  ---------------- --------------------------------------- ---------------------

+-----------------------------------------------------------------------+
| **12 Non-Functional Requirements**                                    |
|                                                                       |
| *Performance · Availability · Offline · Load Shedding · Disaster      |
| Recovery · Scalability*                                               |
+-----------------------------------------------------------------------+

**12.1 Performance & Availability Targets**

  ------------------- ---------------- ------------------ ----------------------
  **NFR**             **Target**       **Measurement**    **Notes**

  Availability ---    99.99% uptime    AWS CloudWatch     4.38 minutes maximum
  Payments & Wallet                    uptime monitoring  downtime per year.
                                                          Multi-AZ failover.

  Availability ---    99.95% uptime    AWS CloudWatch     4.38 hours maximum
  All other services                                      downtime per year.

  Transaction Latency P95 \< 500ms ·   Datadog APM traces Payment confirmation
                      P99 \< 1500ms    (monthly SLA       \< 2 seconds
                                       review)            end-to-end. QR
                                                          generation \< 500ms.

  Throughput          500,000 tx/day · k6 + Gatling load  EKS Horizontal Pod
                      Peak 100,000     tests (quarterly)  Autoscaler. Min
                      concurrent                          replicas × 3 per
                                                          critical service.

  App Cold Start      \< 2.5 seconds   Firebase           Critical for trust on
                      on mid-range     Performance        first launch. APK \<
                      Android          Monitoring         40MB.

  Screen Transition   \< 300ms         React Native       Use skeleton loaders
                      perceived        Performance        to mask latency. Never
                                       Monitor            show spinner \> 5s.

  Dashboard Data Load \< 3 seconds     Datadog RUM        Show cached data +
                      (P95)                               refresh indicator.
                                                          TimescaleDB for
                                                          time-series.

  QR Generation       \< 500ms         Service APM trace  Never block UI thread.
                                                          Generate in
                                                          background, show
                                                          skeleton.

  API Response Time   P95 \< 200ms     Kong API Gateway   Redis caching for
                      (non-payment)    metrics            frequently-read data.
                                                          Read replicas for
                                                          reporting.

  Offline Mode ---    72-hour          Tested with 8-hour Electron + SQLite
  POS                 transaction      simulated network  local queue. Sync
                      buffer           failure            validation on
                                                          reconnect. Idempotency
                                                          keys prevent
                                                          duplication.

  Offline Mode ---    24-hour          Simulated airplane Cached
  Consumer            dashboard cache  mode testing       balance/transactions
                      · 72h payment                       shown with staleness
                      token                               indicator.

  Load Shedding       Full offline     Stage 6 simulation Battery saver mode
  (SA-specific)       operation during (8-hour windows)   (simplified UI) · No
                      Stage 1--6                          loyalty/offers in
                                                          offline · Core
                                                          payments always work.

  Disaster Recovery   \< 4 hours       Annual DR drill    Multi-AZ RDS automated
  --- RTO             (recovery time                      failover. Cross-region
                      objective)                          (eu-west-1) S3 backup.

  Disaster Recovery   \< 15 minutes    Continuous         RDS automated backups
  --- RPO             (recovery point  replication        every 5 min.
                      objective)       testing            Point-in-time recovery
                                                          enabled.

  Data Residency      All SA user data AWS Config rules + Cross-border data only
                      in af-south-1    regular audit      with explicit POPIA
                      (Cape Town)                         Section 72 consent.
  ------------------- ---------------- ------------------ ----------------------

+-----------------------------------------------------------------------+
| **13 Sprint Build Plan --- 32 Sprints · 64 Weeks · 4,905 Story        |
| Points**                                                              |
|                                                                       |
| *Phase 1: Foundation → Phase 6: Launch & Optimise · Target Go-Live:   |
| April 2027*                                                           |
+-----------------------------------------------------------------------+

+---+---------------------------------------------------------------------+
| * | **Sprint Cadence**                                                  |
| * |                                                                     |
| 🗓 | 2-week sprints. Sprint planning: Monday AM. Daily standups: 09:00   |
| * | SAST. Sprint review + retrospective: every other Friday. Velocity   |
| * | target: 40 story points per sprint per team. Teams: (1) Consumer    |
|   | App (MOB), (2) Merchant/POS (FE), (3) Backend/Infrastructure        |
|   | (BE+INF), (4) Compliance/Security (SEC+QA). Sprints within a phase  |
|   | can be parallelised across teams.                                   |
+---+---------------------------------------------------------------------+

**Phase 1 --- Foundation & Core Infrastructure (Sprints 1--4, Weeks
1--8)**

  ------------ ----------- ------------------ ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**           **Key Deliverables**               **Pts**   **Status**

  **S01**      1--2        **Infrastructure   AWS EKS (af-south-1) · VPC +       **180**   **✅
                           Foundation**       subnets · CDE isolated PCI subnet            Complete**
                                              · RDS PostgreSQL multi-AZ · Redis            
                                              cluster · MSK Kafka (3-broker) ·             
                                              CI/CD (GitHub Actions + ArgoCD +             
                                              SonarQube + Snyk) ·                          
                                              Datadog/PagerDuty · Kong API                 
                                              Gateway                                      

  **S02**      3--4        **Auth, KYC &      Auth Service (3001): JWT RS256,    **200**   **✅
                           Wallet Core**      OTP, biometric challenge-response            Complete**
                                              · User Service (3002): profiles,             
                                              POPIA consent · KYC (Smile                   
                                              Identity integration) · Wallet               
                                              Service (3012): balance, pockets,            
                                              P2P · QR Service (3014):                     
                                              static/dynamic · Consumer app                
                                              auth + wallet screens                        

  **S03**      5--6        **Payments         Payment CDE (3013): card           **190**   **✅
                           Foundation**       tokenisation, 3DS2 · PayShap                 Complete**
                                              Service (3010) · GoPay Service               
                                              (3011) · Consumer Pay screens ·              
                                              Banking Service (3015): 6 bank               
                                              OAuth2 links · Merchant dashboard            
                                              shell + POS basic layout ·                   
                                              Monitoring setup                             

  **S04**      7--8        **Merchant Core +  Merchant Service (3003):           **180**   **✅
                           Accounting + HR +  onboarding, KYB, RBAC · POS                  Complete**
                           CRM**              Service (3004): transaction                  
                                              engine + offline buffer ·                    
                                              Inventory (3005): SKU management +           
                                              3,930+ SKU import · Accounting               
                                              (3006): double-entry + bank                  
                                              feeds + VAT · Payroll (3008) +               
                                              Staff (3009) + CRM (3007)                    
  ------------ ----------- ------------------ ---------------------------------- --------- ------------

**Phase 2 --- Financial Services & Consumer Expansion (Sprints 5--10,
Weeks 9--20)**

  ------------ ----------- --------------- ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**        **Key Deliverables**               **Pts**   **Status**

  **S05**      9--10       **Bill Payments Bill Payment (3018): Kazang        **170**   **🔨 In
                           & Remittance    electricity STS + EasyPay network            Dev**
                           (Phase 1)**     · 250+ municipalities ·                      
                                           Remittance: Chipper Cash +                   
                                           TerraPay + Mukuru APIs · Consumer            
                                           UI: bills + electricity token                
                                           display · Merchant POS: bills tile           

  **S06**      11--12      **Remittance    Remittance: AZA Finance +          **170**   **🔨 In
                           Completion &    WorldRemit + Stablecoin rail                 Dev**
                           Credit          (USDC/Stellar) · SARB BOP                    
                           Marketplace**   compliance · Credit Service                  
                                           (3016): 8-lender marketplace +               
                                           45-feature GCS ML model + BNPL NCA           
                                           pre-agreement disclosure                     

  **S07**      13--14      **BNPL &        BNPL: NCR-registered NCA           **160**   **📋
                           Laybye**        agreements · DebiCheck mandates ·            Planned**
                                           3-instalment + early repayment ·             
                                           Laybye Service (3021): item                  
                                           reservation + instalment tracking            
                                           · NCA compliance tests · NCR                 
                                           reporting setup                              

  **S08**      15--16      **Vouchers &    Voucher Service (3019):            **160**   **📋
                           Gift Cards**    closed-loop + open-loop                      Planned**
                                           (Electrum/Bluegum 500+                       
                                           merchants) + PayShap vouchers +              
                                           marketplace + corporate bulk                 
                                           orders · Consumer voucher wallet ·           
                                           Merchant voucher                             
                                           issue/redeem/liability report                

  **S09**      17--18      **Ticketing --- Ticketing (3020): Gautrain GMA +   **155**   **📋
                           Transport &     MyCiTi + Rea Vaya top-ups ·                  Planned**
                           Events**        Greyhound/Intercape bus booking ·            
                                           FlySafair flights (Travelstart               
                                           GDS) · Computicket + Quicket                 
                                           events · E-ticket QR delivery +              
                                           WhatsApp dispatch                            

  **S10**      19--20      **Special       Offers Service (3022): merchant    **155**   **📋
                           Offers Hub &    campaign builder · AI                        Planned**
                           JAX AI Layer**  personalisation engine (user spend           
                                           → offer ranking) · JAX AI Service            
                                           (3026): NLP accounting queries +             
                                           GCS v1 + fraud ML model v1 ·                 
                                           Consumer personalised offers feed            
  ------------ ----------- --------------- ---------------------------------- --------- ------------

**Phase 3 --- Restaurant Module & All 11 Verticals (Sprints 11--16,
Weeks 21--32)**

  ------------ ----------- -------------- ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**       **Key Deliverables**               **Pts**   **Status**

  **S11**      21--22      **Restaurant   Restaurant Service (3027): table   **165**   **📋
                           --- Part 1**   management + floor plan · Order              Planned**
                                          taking API (modifiers + coursing +           
                                          kitchen routing) · KDS web app               
                                          (Kitchen Display System, station             
                                          routing, bump/void) · Recipe                 
                                          engine: ingredient FIFO deduction            
                                          per dish sold · Waiter tablet UI             

  **S12**      23--24      **Restaurant   Restaurant: dynamic pricing (happy **160**   **📋
                           Part 2 &       hour, surge) · QR table ordering ·           Planned**
                           Pharmacy**     delivery integration (Uber Eats,             
                                          Mr D, Bolt) · BNPL table-side ·              
                                          Pharmacy (3028): dispensary                  
                                          module + Schedule drug register +            
                                          pharmacist PIN (S5/S6) + SAHPRA +            
                                          medical aid billing                          

  **S13**      25--26      **Hotel, Spa & Hotel (3029): PMS overlay + room   **155**   **📋
                           Laundromat**   grid + guest folio + channel                 Planned**
                                          manager (Booking.com/Expedia) +              
                                          pre-auth · Laundromat: kanban                
                                          workflow + ticket QR + machine               
                                          API + locker PIN · Guest House:              
                                          simplified PMS + breakfast                   
                                          tracking                                     

  **S14**      27--28      **Funeral,     Funeral (3030): case management +  **140**   **📋
                           Spaza & Guest  package configurator + cultural              Planned**
                           House**        compliance + FSP + compassionate             
                                          payment plans · Spaza: large-icon            
                                          UI + local language                          
                                          (isiZulu/Sesotho) + stokvel                  
                                          wallet + WhatsApp order queue                

  **S15**      29--30      **Bar, Liquor  Bar: tab management + round        **145**   **📋
                           & Retail       tracking + split bill + Liquor Act           Planned**
                           Advanced**     age verify + trading hours                   
                                          enforcement + excise register +              
                                          case pricing · Retail: variant               
                                          matrix (size/colour) + gift                  
                                          cards + BOGO/bundle promotions +             
                                          laybye POS integration                       

  **S16**      31--32      **Salon,       Salon: appointment booking +       **140**   **📋
                           Grocery        therapist commission +                       Planned**
                           Advanced &     service-time billing + prepaid               
                           Compliance     packages + tip via Wallet ·                  
                           Module**       Grocery: PLU/scale + zero-rated              
                                          VAT split + stokvel · Compliance             
                                          Service (3025): licence tracking +           
                                          SARS deadline alerts · Mobile                
                                          offline 72h + load-shedding mode             
  ------------ ----------- -------------- ---------------------------------- --------- ------------

**Phase 4 --- GroSupply & Admin Console (Sprints 17--22, Weeks 33--44)**

  ------------ ----------- --------------- ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**        **Key Deliverables**               **Pts**   **Status**

  **S17**      33--34      **GroSupply     GroSupply Service (3040): supplier **165**   **📋
                           Core**          onboarding · RFQ creation +                  Planned**
                                           multi-supplier routing · PO                  
                                           auto-generation (PDF dispatch) ·             
                                           GRN mobile barcode scanning ·                
                                           3-way match (PO/GRN/invoice)                 
                                           engine · Supplier catalogue                  
                                           (vertical-filtered + B-BBEE                  
                                           filter)                                      

  **S18**      35--36      **GroSupply --- Supplier Portal web app            **160**   **📋
                           Supplier Portal (supplier.grosupply.co.za) ·                 Planned**
                           & Finance**     Supplier mobile app (iOS +                   
                                           Android) · GroSettle:                        
                                           instant/30-day/60-day/dynamic                
                                           discount · GroCredit: 4-tier                 
                                           working capital facility                     
                                           (NCA-aware) · GroFloat: supplier             
                                           advance from order volume                    

  **S19**      37--38      **GroSupply --- GroSupply demand analytics (SKU    **150**   **📋
                           Analytics &     velocity heat map + seasonal                 Planned**
                           Last Mile**     predictions) · Bulk buy group                
                                           coordination · Smart reorder ML              
                                           (3--5 day advance prediction) ·              
                                           GroDeliver: DHL/RAM/Courier Guy              
                                           API integration · Supplier                   
                                           analytics dashboard                          
                                           (Gold/Preferred tier)                        

  **S20**      39--40      **Admin Console Admin API: user/merchant           **160**   **📋
                           --- Part 1      management · KYC/KYB approval                Planned**
                           (Operations &   queue · AML monitoring engine +              
                           Compliance)**   ComplyAdvantage sanctions · SAR              
                                           drafting + FIC submission workflow           
                                           · POPIA subject access request               
                                           queue · Admin Console UI:                    
                                           user/merchant/compliance modules             

  **S21**      41--42      **Admin Console Admin: e-money float management +  **155**   **📋
                           --- Part 2      settlement approval +                        Planned**
                           (Finance &      reconciliation · GroCredit                   
                           Analytics)**    portfolio + NCR submissions ·                
                                           ClickHouse OLAP analytics pipeline           
                                           · Admin BI dashboards + custom               
                                           report builder + scheduled                   
                                           delivery · Service health grid               
                                           (all 35 services)                            

  **S22**      43--44      **Admin Console Admin: fraud score monitoring +    **145**   **📋
                           --- Part 3      velocity rules + blacklist +                 Planned**
                           (Fraud, Risk &  chargeback management · Immutable            
                           Content)**      WORM audit log + admin action                
                                           signing + regulator export ·                 
                                           Content management: vouchers,                
                                           offers, ticketing, remittance ·              
                                           GroSupply Admin Console                      
                                           integration                                  
  ------------ ----------- --------------- ---------------------------------- --------- ------------

**Phase 5 --- QA, Hardening & Production Readiness (Sprints 23--28,
Weeks 45--56)**

  ------------ ----------- --------------- ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**        **Key Deliverables**               **Pts**   **Status**

  **S23**      45--46      **End-to-End    Full consumer journey E2E:         **170**   **📋
                           Integration     register → KYC → top up → pay bill           Planned**
                           Testing**       → remittance · Full merchant                 
                                           journey: onboard → POS → inventory           
                                           → accounting journal · BNPL NCA              
                                           flow · GroSupply                             
                                           RFQ→PO→GRN→GroSettle · Admin                 
                                           journey: KYC approve → SAR file →            
                                           settlement                                   

  **S24**      47--48      **Security      PCI DSS L1 QSA assessment: scope,  **150**   **📋
                           Hardening & PCI evidence, gap remediation · OWASP            Planned**
                           DSS             Top 10 full audit · External                 
                           Assessment**    penetration test (attack surface,            
                                           API enumeration, token forgery) ·            
                                           POPIA DPIA completion · SARB                 
                                           e-money licence submission                   
                                           documentation                                

  **S25**      49--50      **Performance & Load test: 10,000 sustained TPS ×  **145**   **📋
                           Scalability     2 hours · Spike test: 0→25,000 TPS           Planned**
                           Testing**       in 30 seconds · Soak test: 6,000             
                                           TPS × 24 hours (memory leak                  
                                           detection) · Chaos engineering:              
                                           random service kill + DB                     
                                           failover + Kafka partition loss ·            
                                           DR test: af-south-1 failover                 
                                           validation                                   

  **S26**      51--52      **Mobile App    Consumer App: full UX polish,      **145**   **📋
                           Polish & App    onboarding flow, WCAG 2.1 AA                 Planned**
                           Store           audit, 72h offline refinement,               
                           Submission**    load-shedding mode, deep link push           
                                           notifications · iOS App Store                
                                           submission (consumer + merchant +            
                                           supplier apps) · Android Play                
                                           Store submission                             

  **S27**      53--54      **Merchant UAT  UAT pilot: 20 merchants per        **130**   **📋
                           & Training**    vertical (220 total) across all 11           Planned**
                                           verticals --- real transaction               
                                           testing · P1 bug triage and fix ·            
                                           Merchant training materials                  
                                           (vertical-specific guides + video            
                                           walkthroughs) · In-app setup                 
                                           wizard + staff training mode                 

  **S28**      55--56      **Bug Fixes,    P2 UAT bug fixes · Full regression **120**   **📋
                           Documentation & test after all P1/P2 fixes ·                 Planned**
                           Pre-Launch**    OpenAPI 3.0 spec for all 528+                
                                           endpoints (Swagger) · Production             
                                           database seeding ·                           
                                           Datadog/PagerDuty final tuning +             
                                           on-call schedule · CISO security             
                                           sign-off · Go-live runbook +                 
                                           rollback procedure                           
  ------------ ----------- --------------- ---------------------------------- --------- ------------

**Phase 6 --- Launch & Post-Launch Optimisation (Sprints 29--32, Weeks
57--64)**

  ------------ ----------- --------------- ---------------------------------- --------- ------------
  **Sprint**   **Weeks**   **Goal**        **Key Deliverables**               **Pts**   **Status**

  **S29**      57--58      **Soft Launch   Consumer beta: 10,000 users in     **120**   **📋
                           --- Beta        Gauteng + Cape Town · First 500              Planned**
                           (Consumer + 500 merchants live (all 11 verticals)            
                           Merchants)**    · Firebase crash reporting live ·            
                                           Production smoke tests (hourly) ·            
                                           Real-time P0 hotfix capability               
                                           (same-day turnaround) ·                      
                                           Auto-scaling validation                      

  **S30**      59--60      **Full Platform Consumer App public launch --- all **115**   **📋
                           Launch**        SA users · Merchant open                     Planned**
                                           registration nationally ·                    
                                           GroSupply: first 100 suppliers per           
                                           vertical onboarded · Production              
                                           A/B tests: offer AI vs control ·             
                                           Payment gateway live configuration           
                                           · SARB notification filed · NCR              
                                           submission complete                          

  **S31**      61--62      **Post-Launch   Credit marketplace: conversion     **110**   **📋
                           Optimisation    optimisation from launch data ·              Planned**
                           --- Round 1**   JAX AI offer model: retraining on            
                                           first production data ·                      
                                           Remittance: rate accuracy                    
                                           improvements + provider failover ·           
                                           Consumer App v1.1: top App Store             
                                           review feedback items · Merchant             
                                           dashboard v1.1                               

  **S32**      63--64      **Post-Launch   Multi-currency wallet (40+         **105**   **📋
                           Optimisation    currencies, SARB mid-market rates)           Planned**
                           --- Round 2 &   · JAX AI v2: proactive insights +            
                           Year 2          automated accounting tasks ·                 
                           Planning**      GroSupply cross-border (China/UAE            
                                           via stablecoin rail) · Additional            
                                           SA bank integrations (African                
                                           Bank, Grindrod, Sasfin) · Year 2             
                                           capacity planning (1M+ users)                
  ------------ ----------- --------------- ---------------------------------- --------- ------------

+-----------------------------------------------------------------------+
| **14 Team Structure & Quality Standards**                             |
|                                                                       |
| *25-Person Core Team · Scales to 35 at Peak · QA Gates · Definition   |
| of Done*                                                              |
+-----------------------------------------------------------------------+

**14.1 Recommended Team Composition**

  ---------------- --------------- --------------------------------- --------------
  **Team**         **Headcount**   **Core Responsibilities**         **Tools**

  Backend (BE)     8               Node.js/TypeScript microservices  Node.js 20 ·
                                   · API design · Database schemas · TypeScript ·
                                   Kafka integrations · 3rd-party    Fastify ·
                                   API integrations (remittance,     PostgreSQL ·
                                   payments, KYC)                    Redis · Kafka

  Frontend Web     4               React 18: Merchant OS dashboard · Next.js 14 ·
  (FE)                             GroSupply Portals · Admin Console TypeScript ·
                                   · TypeScript · TailwindCSS ·      TailwindCSS ·
                                   Server-side rendering             React Query ·
                                                                     Zustand

  Mobile (MOB)     4               React Native: Consumer Wallet App React Native ·
                                   (iOS + Android) · Merchant App ·  Expo ·
                                   GroSupply Supplier App · Shared   Reanimated 3 ·
                                   codebase (Expo)                   Lottie · Detox

  QA / Test (QA)   3               Playwright (web E2E) · Detox      Playwright ·
                                   (mobile) · Jest (unit +           Detox · k6 ·
                                   integration) · k6 (load testing)  Postman ·
                                   · Postman (API contract) ·        Allure reports
                                   Compliance validation testing     

  Infrastructure   2               AWS EKS · Terraform IaC · CI/CD   AWS ·
  (INF)                            pipelines · Kubernetes HPA tuning Terraform ·
                                   · DR testing · Performance        ArgoCD ·
                                   profiling · Security controls     GitHub Actions
                                                                     · Datadog

  Security &       2               PCI DSS L1 · POPIA · SARB         HackerOne ·
  Compliance (SEC)                 compliance · Penetration testing  SonarQube ·
                                   · FICA/AML implementation ·       Snyk · OWASP
                                   NCA/NCR · Vulnerability           ZAP
                                   management                        

  Product & Design 2               UX design (Figma) · User research Figma · Jira ·
                                   · Sprint planning · Backlog       Notion ·
                                   grooming · Stakeholder management UserTesting
                                   · Merchant onboarding design      

  TOTAL (Core)     25              Full-stack team for 64-week       
                                   production build. Scales to 35 at 
                                   peak (Phase 3 verticals --- add 4 
                                   BE, 3 FE, 3 MOB for parallel      
                                   vertical builds)                  
  ---------------- --------------- --------------------------------- --------------

**14.2 Quality Gates --- Definition of Done**

No screen, endpoint, or feature may be marked \'Done\' without passing
all quality gates. This is non-negotiable. Gates apply equally to
consumer app, merchant OS, GroSupply, and admin console.

  ---------------- --------------------------------- --------------------
  **Gate**         **Requirement**                   **Tool**

  Design Fidelity  Pixel-match against approved      Figma comparison ·
                   Figma design (\< 4px deviation    Visual regression
                   acceptable). All states: default, (Chromatic)
                   hover, focused, error, disabled,  
                   loading, empty state.             

  WCAG AA          All interactive elements: role,   axe-core in CI/CD ·
  Accessibility    aria-label, touch target ≥        Manual screen reader
                   44×44px. Colour contrast ≥ 4.5:1  test
                   for normal text, 3:1 for large.   
                   Screen reader walkthrough         
                   (VoiceOver + TalkBack).           

  API Contract     All API endpoints have Postman    Postman · Dredd ·
  Testing          test collection. Contract matches OpenAPI validator
                   OpenAPI 3.0 spec. No undocumented 
                   responses.                        

  Unit Test        ≥ 80% statement coverage on all   Jest · Istanbul
  Coverage         new code. Critical paths          coverage report
                   (payment, auth, credit): 100%     
                   branch coverage.                  

  E2E Test Pass    All Playwright (web) and Detox    Playwright · Detox ·
                   (mobile) E2E tests pass.          CI/CD green gate
                   Including offline mode, error     
                   states, and timeout scenarios.    

  Performance      Lighthouse score ≥ 85             Lighthouse CI · Web
  (Web)            (Performance + Accessibility +    Vitals monitoring
                   Best Practices). Core Web Vitals: 
                   LCP \< 2.5s, FID \< 100ms, CLS \< 
                   0.1.                              

  Performance      React Native render time ≤ 16ms   Reassured · Flipper
  (Mobile)         (60fps). No JS thread blocks \>   performance monitor
                   100ms. APK/IPA size ≤ 40MB.       

  Device Testing   Tested on: low-end Android (2GB   Physical devices +
                   RAM, Android 10), mid-range       BrowserStack
                   Android (6GB, Android 13), iPhone 
                   SE (2nd gen), iPhone 14, iPad     
                   Pro.                              

  Security Scan    SonarQube: zero Critical/High     SonarQube · Snyk ·
                   findings. Snyk: zero Critical     OWASP in CI/CD
                   dependencies. OWASP dependency    
                   check passing.                    

  Happy Path +     All error states implemented:     QA test plan ·
  Error States     network failure, insufficient     Postman error
                   funds, session expired, wrong     injection
                   PIN, API errors. No raw error     
                   codes shown to users.             

  Offline Mode     Transaction queue works for       Network throttling
  (POS)            minimum 72 hours without          in CI · Simulated
                   connectivity. Sync validation on  failure test
                   reconnect. Idempotency keys       
                   prevent duplication.              

  Regulatory       Any feature touching credit,      SEC team sign-off
  Review           remittance, payments, or PII      ticket in Jira
  (Compliance)     reviewed and approved by SEC team 
                   before sprint demo.               
  ---------------- --------------------------------- --------------------

+-----------------------------------------------------------------------+
| **15 Revenue Model & Business Case**                                  |
|                                                                       |
| *Multiple Revenue Streams · South African Fintech Market · Year 1 to  |
| Scale*                                                                |
+-----------------------------------------------------------------------+

**15.1 Revenue Streams --- Full Platform**

  ------------------- ------------------ ------------------ -------------------
  **Revenue Stream**  **Model**          **Rate**           **Year 1
                                                            Projection**

  Transaction Fee     Per transaction at 0.5--1.5% (lower   R12M (500K tx/day
  (QR/Wallet Pay)     POS using Groway   than card)         at avg R200)
                      Wallet                                

  Payment Rails       Spread on GoPay    0.2--0.5% margin   R4M
  Margin              EFT and PayShap    over cost          
                      rails                                 

  Bill Payments       Commission from    1.5--3% of bill    R6M
  Commission          Kazang/EasyPay     value              
                      network per bill                      
                      paid                                  

  Remittance Margin   Spread on FX rate  1--2.5% of         R8M
                      plus potential     transfer value     
                      provider                              
                      commission                            

  BNPL Interest &     Interest on        NCR limit: repo +  R10M
  Fees                outstanding BNPL   21% p.a.           
                      balances                              
                      (NCA-capped)                          

  Credit Marketplace  Lead fee when      1--3% of loan      R5M
  Commission          consumer selects a value              
                      lender offer                          

  GroCredit Interest  Working capital    Repo + 5--8% p.a.  R4M
  (Merchant)          loans to merchants                    
                      via GroSupply                         

  GroSettle Instant   Suppliers choosing 1.5--2.5% of       R8M
  Fee                 instant settlement invoice value      
                      instead of net-30                     

  Loyalty / Voucher   Merchant-funded    5--15% of voucher  R3M
  Interchange         vouchers and offer face value         
                      placements                            

  Merchant SaaS       Premium            R299--R999/month   R6M (1,000 paying
  (Premium)           accounting,        per merchant       merchants)
                      analytics, and CRM                    
                      features                              

  Ticketing           Commission on      3--5% of ticket    R2M
  Commission          transport and      value              
                      event ticket                          
                      bookings                              

  GroSupply           Supplier tier      R499--R999/month   R2.4M
  Subscriptions +     subscriptions +                       
  Analytics           analytics premium                     

  Promoted Offers     Merchants pay for  CPM/CPC model      R3M
  Placement           promoted placement                    
                      in consumer offers                    
                      feed                                  

  TOTAL ESTIMATED                                           R73.4M
  YEAR 1                                                    (conservative ---
                                                            assumes slow ramp)
  ------------------- ------------------ ------------------ -------------------

**15.2 Unit Economics**

  --------------------- --------------- --------------- -------------------
  **Metric**            **Year 1        **Year 2        **Basis**
                        Target**        Target**        

  Active consumers      50,000          250,000         Referral
  (MAU)                                                 programme +
                                                        merchant network
                                                        effect

  Active merchants      1,000 (all 11   5,000           Direct sales +
                        verticals)                      GroSupply as
                                                        merchant
                                                        acquisition channel

  Daily active users    45%             55%             Daily bill
  (DAU/MAU)                                             payments + loyalty
                                                        drive daily opens
                                                        (Alipay benchmark:
                                                        60%)

  Avg revenue per user  R122/month      R180/month      Transaction fees +
  (ARPU)                                                premium features +
                                                        credit

  Consumer CAC          R80 via         R60 (brand      R20 referral
  (acquisition cost)    referral        recognition)    credit + R60
                                                        overhead ---
                                                        payback in month 1

  Merchant CAC          R2,000 per      R1,200          Sales +
                        merchant                        onboarding +
                                                        GroSupply
                                                        acquisition funnel

  LTV (consumer,        R2,928          R4,320          ARPU × 24 months ×
  24-month)                                             1.0 retention
                                                        factor

  LTV:CAC ratio         36:1 (consumer) 50:1            Best-in-class SaaS
                                                        benchmark: 3:1.
                                                        Groway
                                                        significantly
                                                        exceeds this.

  Gross margin target   65%             72%             Payment rails have
                                                        high margin.
                                                        Platform services
                                                        scale with fixed
                                                        infra cost.

  Break-even ARR        R85M            ---             Based on 25-person
                                                        team fully loaded
                                                        cost at R3.4M/month
  --------------------- --------------- --------------- -------------------

+-----------------------------------------------------------------------+
| groway --- Comprehensive Development Master Document                  |
|                                                                       |
| *Version 4.0 · February 2026 · Target Go-Live: April 2027 ·           |
| Confidential --- Internal Use Only*                                   |
|                                                                       |
| 32 Sprints · 64 Weeks · 4,905 Story Points · 25→35 Person Team · PCI  |
| DSS L1 · Built for South Africa                                       |
+-----------------------------------------------------------------------+
