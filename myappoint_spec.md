**MyAppoint**

Health & Beauty POS Platform

*Product Specification --- Full Feature & Logic Document*

  ------------------------- ---------------------------------------------
  **Version**               1.0 -- March 2026

  **Verticals**             Hair Salon · Barber · Nail Salon · Spa ·
                            Aesthetic Clinic · Tattoo · Lash & Brow

  **Total SKUs**            858 across all verticals

  **Document Owner**        Product Team
  ------------------------- ---------------------------------------------

**1. Product Overview**

MyAppoint is a multi-vertical, category-aware Point of Sale platform
built specifically for the Health & Beauty industry. Each business
category loads a tailored SKU catalogue, workflow logic, and feature set
while sharing a common core POS engine --- ensuring staff familiar with
one vertical can quickly operate another.

**1.1 Core Design Principles**

-   Category-first UX: The operator selects their vertical on setup; the
    UI, SKUs, and flows adapt automatically.

-   One screen checkout: All services, products, staff, and payment
    collected in a single transaction screen.

-   Offline-capable: Core POS functions (checkout, receipts, queue) work
    without internet; sync on reconnection.

-   Role-based access: Owner, Manager, Stylist/Therapist, Receptionist
    --- each with scoped permissions.

-   Multi-location ready: Shared client database, centralised reporting,
    per-location settings.

**1.2 Vertical Summary**

  ----------------------------------------------------------------------------
  **Vertical**    **SKUs**   **Unique           **Core Flow**
                             Features**         
  --------------- ---------- ------------------ ------------------------------
  Hair Salon      145        Stylist roster,    Book → Assign Stylist →
                             service combos     Service → Checkout

  Barber Shop     78         Queue management,  Walk-in Queue → Assign Barber
                             memberships        → Service → Checkout

  Nail Salon      134        Design catalogue,  Book → Select Design → Nail
                             loyalty            Tech → Checkout + Points

  Spa & Wellness  189        Treatment          Book → Package Selection →
                             packages, gift     Therapist → Checkout
                             vouchers           

  Aesthetic       156        Consultations,     Consult → Plan → Consent Form
  Clinic                     treatment plans,   → Treat → Invoice
                             consent            

  Tattoo Studio   89         Custom quotes,     Enquiry → Quote → Deposit →
                             deposits,          Session → Aftercare
                             aftercare          

  Lash & Brow     67         Service menu,      Book → Service → Loyalty
  Studio                     loyalty            Points → Checkout
  ----------------------------------------------------------------------------

**2. Shared Core Features**

All seven verticals share the following foundational modules.
Vertical-specific logic is layered on top of these.

**2.1 Appointment & Booking Engine**

**Features**

-   Calendar views: Day, Week, Multi-staff grid --- colour-coded by
    staff member.

-   Online booking widget: Embeddable on website + Google Business
    Profile link.

-   Booking rules: Minimum lead time, maximum advance booking window,
    buffer time between appointments.

-   Recurring appointments: Weekly / fortnightly / monthly with
    automatic slot reservation.

-   Waitlist: Auto-notify next client if a slot opens.

-   No-show protection: Require card-on-file or deposit to confirm
    booking.

-   Cancellation policy: Configurable notice period; auto-charge
    cancellation fee if breached.

**Booking Flow**

  ----------------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System Action**
  -------- ---------------- ------------------------------------ -------------------
  1        Select Category  Client or staff selects vertical     System loads
                            (e.g. Hair Salon)                    category-specific
                                                                 service menu

  2        Choose           Single or combo services selected    System calculates
           Service(s)                                            total duration and
                                                                 price

  3        Select Staff     Client picks preferred stylist or    System checks staff
                            \'Any Available\'                    roster and
                                                                 availability

  4        Choose Slot      Available time slots displayed       System locks
                                                                 provisional slot
                                                                 (10-min hold)

  5        Client Details   New: enter name/phone. Returning:    System checks for
                            auto-populated from profile          duplicate profiles

  6        Deposit / Card   If policy requires, card captured    System stores
           on File          via payment gateway                  tokenised card; no
                                                                 raw card data
                                                                 retained

  7        Confirmation     SMS + email confirmation sent        System creates
                                                                 appointment,
                                                                 releases
                                                                 provisional lock
  ----------------------------------------------------------------------------------

**2.2 Client Management (CRM)**

**Client Profile Contains**

-   Personal: Name, phone, email, date of birth, photo (optional).

-   Visit history: All past appointments, services received, staff seen,
    spend per visit.

-   Notes & preferences: Free-text notes, allergy flags, product
    preferences.

-   Loyalty balance: Points earned, redeemed, expiry.

-   Consent & medical: Linked consent forms, contraindication flags
    (Aesthetic Clinic / Tattoo).

-   Communications log: All SMS/email sent, opened, clicked.

**Client Lookup Logic**

-   Search by name, phone number, or email.

-   Fuzzy match on partial names to prevent duplicate profiles.

-   Merge duplicate profiles: Staff or admin selects primary record;
    visit history, points, notes merged.

-   Auto-create profile at checkout if walk-in client provides phone
    number.

**2.3 POS & Checkout**

**Transaction Screen Elements**

-   Left panel: Active appointment or walk-in ticket --- services,
    products, staff, duration.

-   Right panel: Line items, discounts, totals (subtotal, tax, tip),
    payment method buttons.

-   Quick-add: Search bar for adding retail products mid-transaction.

-   Staff split: Multiple staff on one ticket --- commission
    auto-calculated per staff member.

**Checkout Flow**

  ----------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System
                                                                 Action**
  -------- ---------------- ------------------------------------ -------------
  1        Open Ticket      Staff opens appointment or creates   System loads
                            walk-in ticket                       client
                                                                 profile if
                                                                 linked

  2        Review Services  Confirm services, durations,         Staff can
                            assigned staff                       edit
                                                                 services,
                                                                 swap staff,
                                                                 add products

  3        Apply Discounts  Enter promo code, loyalty            System
                            redemption, or manual override       validates
                                                                 code; logs
                                                                 override with
                                                                 staff ID

  4        Add Tip          Suggest tip as % buttons (10%, 15%,  Tip allocated
                            20%) or custom amount                to assigned
                                                                 staff\'s
                                                                 commission
                                                                 report

  5        Select Payment   Cash / Card / Split / Gift Voucher / System routes
                            Account                              to payment
                                                                 terminal or
                                                                 cash entry

  6        Process Payment  Card: tap/insert on terminal. Cash:  System
                            enter tendered amount                calculates
                                                                 change; sends
                                                                 approval to
                                                                 gateway

  7        Issue Receipt    Print, email, or SMS receipt         System closes
                                                                 ticket,
                                                                 updates
                                                                 stock, posts
                                                                 to reports
  ----------------------------------------------------------------------------

**Payment Methods**

-   Card: Integrated card terminal (tap, chip, swipe). Supported
    processors: Stripe, Yoco, PayFast, PayStack.

-   Cash: Tender entry, auto-calculate change, cash drawer open trigger.

-   Split payment: Any combination of methods on one ticket.

-   Gift voucher: Scan/enter code; partial redemption supported; balance
    displayed.

-   Loyalty points: Redeem points as currency (operator sets conversion
    rate, e.g. 100pts = R10).

-   Deposit offset: Pre-paid deposit auto-applied to final bill; only
    balance due shown.

-   Account / house credit: For VIP clients; invoiced monthly.

**2.4 Staff Management**

-   Staff profiles: Name, role, services they perform, working hours,
    commission rate.

-   Roster / rota: Weekly schedule builder; drag-and-drop shifts; copy
    previous week.

-   Leave management: Mark days unavailable; system removes from booking
    calendar.

-   Commission engine: Per-service rate OR tiered (e.g. 35% if monthly
    revenue \> R20,000). Retail product commission configurable
    separately.

-   Performance dashboard: Services completed, revenue generated,
    average ticket value, client retention rate --- per staff member.

-   Clock in / out: PIN-based time-tracking; overtime alerts.

**2.5 Inventory & SKU Management**

-   Dual inventory: Retail products (sold to clients) and backbar/sundry
    (consumed in services).

-   Auto-deduct: When a service is completed, linked backbar stock
    decremented automatically.

-   Low-stock alerts: Configurable threshold; email/push notification to
    owner.

-   Purchase orders: Create PO → receive stock → system updates on-hand
    quantity.

-   Supplier management: Supplier contacts, lead times, order history.

-   Barcode / QR scanning: Scan product to add to ticket or receive into
    stock.

-   Variant support: Product variants (size, colour, formula) under a
    single parent SKU.

**2.6 Reporting & Analytics**

-   Daily summary: Revenue, transactions, average ticket, cash vs card,
    voids/refunds.

-   Sales by category: Services vs retail products breakdown.

-   Staff performance: Revenue, services, commission owed --- per staff,
    per period.

-   Client reports: New vs returning, top spenders, lapsed clients (not
    visited in X days).

-   Inventory reports: Stock on hand, stock value, fast vs slow movers,
    wastage.

-   Tax report: VAT/GST collected, adjustable by date range --- export
    to CSV for accounting.

-   Loyalty report: Points issued, redeemed, outstanding liability.

**2.7 Automated Notifications**

  ------------------------------------------------------------------------
  **Trigger**           **Channel**      **Default       **Opt-out?**
                                         Timing**        
  --------------------- ---------------- --------------- -----------------
  Booking confirmed     SMS + Email      Immediately     No

  Appointment reminder  SMS + Push       24 hrs before   Yes

  Appointment reminder  SMS              2 hrs before    Yes
  2                                                      

  Post-visit thank you  SMS + Email      1 hr after      Yes
                                         checkout        

  Rebooking nudge       SMS              X days after    Yes
                                         visit           

  Birthday greeting     SMS + Email      Day of birthday Yes

  Loyalty milestone     Push + SMS       On points       Yes
                                         threshold       

  No-show follow-up     SMS              30 min after    Yes
                                         missed appt     
  ------------------------------------------------------------------------

**3. Vertical-Specific Features & Flows**

  -----------------------------------------------------------------------
  **3.1 Hair Salon --- 145 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Stylist Roster: Each stylist has their own bookable calendar.
    Clients can book a specific stylist or \'any available\'.

-   Service Combos: Pre-built combo packages (e.g. Cut + Colour +
    Blowdry) with bundled pricing and consolidated time slots.

-   Colour Formula Notes: Per-client colour formula record attached to
    visit history (brand, developer %, tone) --- auto-surfaces on
    rebooking.

-   Processing Time Slots: Colour/perm services have active time +
    processing time; stylist can be assigned to another client during
    processing.

-   Patch Test Tracking: Flag whether client has had a patch test; block
    colour bookings if test overdue (configurable days).

**Service Combo Logic**

-   Combo defined in settings: select services, set bundled price (can
    be lower than sum of parts), set total duration.

-   At checkout: combo displayed as single line item; individual
    services listed underneath for commission split.

-   Combo discount auto-applies; manual override allowed by manager role
    only.

  -----------------------------------------------------------------------
  **3.2 Barber Shop --- 78 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Queue Management: Walk-in queue board --- clients join queue
    digitally (QR code at door) or staff adds them. Live wait time
    displayed on TV/tablet.

-   Queue Display Screen: Dedicated screen mode showing queue position,
    estimated wait, current client being served per barber.

-   Membership / Subscription: Monthly membership plans (e.g. 4
    cuts/month for fixed fee). Membership status checked at checkout;
    included services deducted from allowance.

-   Quick Service Mode: Streamlined 2-tap checkout optimised for
    high-volume, short-duration services.

**Queue Flow**

  ------------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System
                                                                 Action**
  -------- ---------------- ------------------------------------ ---------------
  1        Join Queue       Client scans QR or receptionist adds System assigns
                            walk-in                              queue number;
                                                                 sends SMS with
                                                                 position

  2        Wait             Client receives SMS when 2nd in      System triggers
           Notification     queue                                alert
                                                                 automatically

  3        Assign to Barber Barber taps \'Next\' on their screen System moves
                                                                 client from
                                                                 queue to active
                                                                 ticket

  4        Service &        Standard checkout flow               System marks
           Checkout                                              queue slot
                                                                 complete;
                                                                 advances queue
  ------------------------------------------------------------------------------

**Membership Logic**

-   Plans created in settings: name, monthly fee, included services
    (type + quantity), rollover policy.

-   At checkout: system detects active membership; included services
    shown as R0.00 with \'Membership\' label.

-   Usage counter: Tracks remaining allowance for current billing
    period. Alert when last included service used.

-   Billing: Auto-debit on renewal date via tokenised card on file.

  -----------------------------------------------------------------------
  **3.3 Nail Salon --- 134 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Design Catalogue: Visual library of nail designs (image + name +
    add-on price). Browsable by client at booking or in salon on tablet.

-   Design Linking: A design selected adds an \'Art Add-on\' line item
    to the ticket with its price.

-   Nail Tech Assignment: Services assigned to specific nail technician;
    tracks completion per hand/foot (optional split billing for group
    bookings).

-   Loyalty Programme: Points earned per rand spent. Configurable tiers
    (Bronze / Silver / Gold) with escalating earn rates and perks.

-   Group / Party Bookings: Book multiple clients simultaneously (e.g.
    bridal party); single payment option or split by person.

**Loyalty Tier Logic**

  -------------------------------------------------------------------------
  **Tier**      **Spend         **Earn Rate**   **Perks**
                Threshold**                     
  ------------- --------------- --------------- ---------------------------
  Bronze        R0 -- R2,999    1pt per R10     Birthday discount 10%

  Silver        R3,000 --       1.5pts per R10  Priority booking, Birthday
                R7,999                          15%

  Gold          R8,000+         2pts per R10    Free design upgrade,
                                                Birthday 20%, VIP queue
  -------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **3.4 Spa & Wellness --- 189 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Treatment Packages: Bundles of treatments sold as a package (e.g.
    Half-Day Spa: facial + massage + foot treatment). Package price,
    session validity (e.g. 6 months), and session tracking built in.

-   Gift Vouchers: Fixed-amount or service-specific vouchers. Generate
    printable/digital voucher with unique code. Partial redemption
    supported; balance tracked.

-   Room / Resource Management: Treatment rooms assigned to bookings;
    system prevents double-booking of rooms.

-   Therapist Gender Preference: Client can specify preference; booking
    engine filters available therapists accordingly.

-   Intake Forms: Pre-visit health questionnaire sent via SMS link;
    responses stored on client profile, flagged if contraindications
    noted.

**Package Redemption Flow**

  ----------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System
                                                                 Action**
  -------- ---------------- ------------------------------------ -------------
  1        Sell Package     Package added to checkout and paid   System
                                                                 creates
                                                                 package
                                                                 record with
                                                                 session
                                                                 balance

  2        Book Session     Client books any included treatment  System checks
                                                                 package
                                                                 balance
                                                                 before
                                                                 confirming

  3        Check In         Staff opens appointment ticket       System shows
                                                                 \'Package --
                                                                 X sessions
                                                                 remaining\'

  4        Checkout         Confirm session used                 System
                                                                 decrements
                                                                 session
                                                                 counter;
                                                                 R0.00 charge
                                                                 if pre-paid

  5        Expiry Alert     Package nearing expiry               System sends
                                                                 client
                                                                 reminder SMS
                                                                 14 days
                                                                 before expiry
  ----------------------------------------------------------------------------

**Gift Voucher Logic**

-   Voucher types: Monetary value (e.g. R500) or specific service (e.g.
    \'1 x Swedish Massage\').

-   Issuance: Staff creates voucher at POS; system generates unique
    alphanumeric code; client receives branded PDF.

-   Redemption: Enter code at checkout; system validates (active, not
    expired, not fully redeemed); deducts amount or marks service as
    used.

-   Partial use: Remaining balance stored; displayed at next redemption.

-   Expiry: Configurable (default 12 months from issue). Expired
    vouchers locked but visible in client history.

  -----------------------------------------------------------------------
  **3.5 Aesthetic Clinic --- 156 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Consultation Workflow: Initial consultation appointment type
    (non-billable or flat fee). Practitioner records findings and
    recommends treatment plan during consult.

-   Treatment Plans: Multi-session treatment programmes (e.g. 6x LED
    sessions). Plan created post-consult; sessions booked individually
    against the plan.

-   Consent Forms: Digital consent forms per treatment type. Client
    signs on tablet (or via SMS link pre-visit). Signed forms stored as
    PDF on client profile; timestamp and IP logged.

-   Before & After Photos: Capture treatment area photos pre and post.
    Stored securely on client file; never visible to other clients.

-   Contraindication Flags: Intake form responses auto-flag
    contraindications (e.g. pregnancy, pacemaker). Red warning shown
    when opening client ticket.

-   Practitioner Notes: Clinical notes per visit --- SOAP format
    (Subjective, Objective, Assessment, Plan).

**Consent Form Flow**

  -----------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System
                                                                 Action**
  -------- ---------------- ------------------------------------ --------------
  1        Treatment Booked Appointment for a treatment          System
                            requiring consent confirmed          identifies
                                                                 consent
                                                                 requirement
                                                                 from service
                                                                 settings

  2        Send Form        24 hrs before appointment            System sends
                                                                 SMS link to
                                                                 digital
                                                                 consent form

  3        Client Signs     Client completes and signs on        System stores
                            personal device                      signed PDF;
                                                                 flags
                                                                 appointment as
                                                                 \'Consent
                                                                 Received\'

  4        Pre-treatment    Practitioner opens ticket            System shows
           Check                                                 consent
                                                                 status; warns
                                                                 if unsigned

  5        In-Clinic Option If unsigned on arrival               Practitioner
                                                                 presents
                                                                 tablet for
                                                                 in-person
                                                                 signature

  6        Stored on File   Post-treatment                       PDF linked
                                                                 permanently to
                                                                 visit record;
                                                                 auditable
  -----------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **3.6 Tattoo Studio --- 89 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Custom Quote System: Tattoo projects start as enquiries. Artist
    reviews concept, creates custom quote (hourly or fixed price), sends
    to client for approval.

-   Deposit Handling: Configurable deposit amount (flat or % of quote).
    Deposit charged at booking confirmation. Deposit offset at final
    checkout. Non-refundable deposit policy enforced on cancellation.

-   Multi-Session Projects: Large tattoos span multiple sessions.
    Project created with total estimated hours; each session logged
    against the project.

-   Aftercare Instructions: Post-visit, system automatically sends
    branded aftercare PDF + follow-up check message at Day 3 and Day 7.

-   Portfolio / Reference Images: Client can attach reference images at
    enquiry stage; stored on project file for artist reference.

**Quote & Deposit Flow**

  --------------------------------------------------------------------------------
  **\#**   **Step**         **Description**                      **System Action**
  -------- ---------------- ------------------------------------ -----------------
  1        Enquiry Received Client submits enquiry (online form  System creates
                            or walk-in)                          enquiry record;
                                                                 notifies artist

  2        Artist Reviews   Artist views reference images, size, Artist enters
                            placement                            estimated hours
                                                                 and quote amount

  3        Quote Sent       System sends quote summary to client Client receives
                            via SMS/email                        approve/decline
                                                                 link

  4        Client Approves  Client taps approve                  System triggers
                                                                 deposit payment
                                                                 request

  5        Deposit Paid     Client pays deposit (card online or  System confirms
                            in-store)                            booking; deposit
                                                                 logged against
                                                                 project

  6        Session Checkout Each session completed               Staff checks out
                                                                 session; deposit
                                                                 deducted from
                                                                 first session

  7        Final Session    Last session completed               Remaining balance
                                                                 charged; project
                                                                 marked complete
  --------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **3.7 Lash & Brow Studio --- 67 SKUs**

  -----------------------------------------------------------------------

**Unique Features**

-   Infill Booking Intelligence: System detects if client is booking an
    infill vs full set. If last full set was more than X days ago
    (configurable), system recommends (or requires) full set instead.

-   Technician Lash Style Notes: Client\'s preferred lash style, length,
    curl, thickness stored per technician. Auto-displayed when
    technician opens the ticket.

-   Loyalty Programme: Stamp card logic --- every Nth visit earns a free
    service (operator configures N and the reward service).

-   Before & After Gallery: Opt-in photo capture for portfolio. Client
    consent captured at profile creation.

**Infill Detection Logic**

-   On booking: system checks last appointment date for same client for
    a lash service.

-   If gap \> configured threshold (e.g. 5 weeks): system displays
    advisory --- \'It has been X weeks since your last appointment. We
    recommend booking a Full Set.\'

-   Options: Soft advisory (client can still book infill) or Hard block
    (infill unavailable after threshold; manager PIN to override).

**4. User Roles & Permissions**

  ------------------------------------------------------------------------------
  **Permission**   **Owner**    **Manager**   **Stylist /     **Receptionist**
                                              Tech**          
  ---------------- ------------ ------------- --------------- ------------------
  View all         ✓            ✓             Own only        ✓
  appointments                                                

  Create / edit    ✓            ✓             Own only        ✓
  appointments                                                

  Process checkout ✓            ✓             ✓               ✓

  Apply manual     ✓            ✓             --              --
  discounts                                                   

  Issue refunds    ✓            ✓             --              --

  View all staff   ✓            ✓             --              --
  reports                                                     

  Edit staff       ✓            ✓             --              --
  profiles                                                    

  Edit pricing /   ✓            --            --              --
  services                                                    

  View financial   ✓            ✓             --              --
  reports                                                     

  Manage inventory ✓            ✓             --              --

  Manage           ✓            ✓             --              --
  memberships                                                 

  Access settings  ✓            Limited       --              --
  ------------------------------------------------------------------------------

**5. Technical Requirements**

**5.1 Platform Targets**

-   Tablet POS: iPad (iOS 16+) and Android tablet (Android 12+) ---
    primary checkout device.

-   Mobile: Staff-facing iOS and Android app for schedule viewing,
    notifications, clock in/out.

-   Web: Owner/Manager dashboard for reports, settings, roster
    management (Chrome, Safari, Edge, Firefox).

-   Customer Booking: Responsive web widget embeddable on any site; PWA
    for direct app-like access.

**5.2 Integrations**

  -----------------------------------------------------------------------
  **Category**     **Integration**         **Purpose**
  ---------------- ----------------------- ------------------------------
  Payment          Stripe, Yoco, PayFast,  Card processing, online
                   PayStack                deposits, recurring billing

  SMS              Twilio, Vonage, BulkSMS Appointment reminders,
                                           marketing messages

  Email            SendGrid, Mailchimp     Confirmations, receipts,
                                           campaigns

  Calendar         Google Calendar, Apple  Two-way sync for staff
                   iCal                    schedules

  Accounting       Xero, QuickBooks, Sage  Daily sales export, tax
                                           reporting

  Social Booking   Instagram, Facebook     Book Now button directs to
                                           booking widget

  Hardware         Star Micronics, Epson   POS peripherals
                   printers; Cash Drawers; 
                   Barcode scanners        
  -----------------------------------------------------------------------

**5.3 Data & Security**

-   All card data handled via PCI-DSS compliant payment processor.
    MyAppoint stores only tokenised references.

-   Client data encrypted at rest (AES-256) and in transit (TLS 1.3).

-   Consent forms and before/after photos stored in access-controlled
    cloud storage; not publicly accessible.

-   Role-based access enforced at API level, not just UI.

-   GDPR / POPIA compliant: Data deletion request workflow; consent
    captured for marketing communications.

-   Audit log: All financial actions (refunds, discounts, voids) logged
    with staff ID, timestamp, and reason.

**5.4 Offline Mode**

-   Core functions available offline: create tickets, checkout (cash),
    view schedule, add clients.

-   Card payments require connectivity; system prompts staff with clear
    offline indicator.

-   Sync queue: All offline actions timestamped and synced automatically
    on reconnection.

-   Conflict resolution: Server record takes precedence for scheduling
    conflicts; staff notified of any conflicts post-sync.

**6. Settings & Configuration**

**6.1 Business Setup**

-   Business profile: Name, logo, address, phone, website, social links,
    trading hours.

-   Vertical selection: Choose category on setup; can add additional
    verticals later (multi-vertical salons).

-   Tax configuration: Tax name (VAT/GST), rate, inclusive vs exclusive
    pricing.

-   Currency and locale: Currency symbol, date/time format, language.

**6.2 Booking Settings**

-   Booking window: Minimum notice (e.g. 2 hrs), maximum advance (e.g.
    90 days).

-   Slot duration increments: 5, 10, 15, 30 min intervals.

-   Buffer time: Auto-padding between appointments per service or per
    staff member.

-   Deposit rules: Require deposit (yes/no), deposit amount (flat or %),
    refund policy.

-   Cancellation policy: Notice period required; fee amount if cancelled
    late.

**6.3 Notification Templates**

-   All notification templates editable with merge tags: {client_name},
    {appointment_date}, {staff_name}, {service}, {business_name},
    {booking_link}.

-   Enable/disable each notification type globally or per notification.

-   Preview and send test notification from settings screen.

**7. MVP Feature Priority**

The following phased rollout is recommended to reach a testable MVP
quickly, then layer complexity.

  -----------------------------------------------------------------------------
  **Phase**   **Timeline**       **Features**                   **Verticals**
  ----------- ------------------ ------------------------------ ---------------
  1 -- Core   Months 1--3        Booking engine, client         Hair Salon,
                                 profiles, basic POS checkout,  Nail Salon
                                 cash + card payment, staff     
                                 roster, SMS reminders, daily   
                                 reports                        

  2 --        Months 4--5        Inventory, loyalty programme,  \+ Spa &
  Commerce                       gift vouchers, combo services, Wellness,
                                 online booking widget, email   Barber
                                 receipts                       

  3 --        Months 6--7        Consent forms, treatment       \+ Aesthetic
  Vertical                       plans, queue management,       Clinic, Tattoo,
  Depth                          memberships, custom quotes,    Lash & Brow
                                 deposits, design catalogue     

  4 -- Growth Months 8--9        Accounting integrations,       All verticals
                                 multi-location, marketing      
                                 campaigns, advanced analytics, 
                                 API / webhooks                 
  -----------------------------------------------------------------------------

**8. Glossary**

  --------------- -------------------------------------------------------
  **SKU**         Stock Keeping Unit --- a unique identifier for each
                  service or product in the catalogue.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Backbar**     Products consumed during service delivery (shampoo,
                  developer, etc.) not sold directly to clients.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Combo**       A pre-packaged bundle of two or more services sold at a
                  single price with a defined total duration.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Infill**      A maintenance appointment for lash/nail extensions that
                  top-up growth since the last full set.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Treatment     A multi-session programme created for a client in an
  Plan**          aesthetic or clinical context.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Tokenised     A card reference stored by the payment processor --- no
  Card**          raw card numbers held by MyAppoint.

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **POPIA**       Protection of Personal Information Act (South Africa)
                  --- governs how client personal data is collected and
                  stored.

  --------------- -------------------------------------------------------

*--- End of Document ---*
