# GroSell + GroCredit Integration Build Plan
## Including BNPL for SASSA Beneficiaries & Layby

---

# PART 1: GROCREDIT ECOSYSTEM OVERVIEW

## Current State Analysis

### ✅ Already Built (GroCredit for Merchants)
- **4-Tier System**: Starter, Business, Enterprise, Seasonal
- **Algorithm-Based Scoring**:
  - Sales Performance (40% weight)
  - Operational Consistency (20% weight)
  - Inventory Health (20% weight)
  - Supply Reliability (20% weight)
- **Interest Rate**: Repo + 5-8% p.a. (risk-based)
- **Working Capital Facility**: R50K - R1M limits
- **Integration**: GroSupply payments, draw requests, repayments

### ✅ Already Built (Consumer Credit)
- **Credit Scoring**: Payment reliability, transaction history, KYC level
- **BNPL Foundation**: 3-instalment interest-free option
- **Layby Foundation**: 10% minimum deposit, flexible terms
- **DebiCheck**: Mandate management for repayments

---

# PART 2: SASSA BENEFICIARY BNPL MODEL

## SASSA Context

**SASSA (South African Social Security Agency)** provides grants to ~18 million South Africans:
- Old Age Pension: R2,180/month
- Disability Grant: R2,180/month
- Child Support Grant: R530/child/month
- Foster Care Grant: R1,180/child/month
- Care Dependency Grant: R2,180/month

**Key Insight**: SASSA grants are **predictable, guaranteed income streams** - perfect for credit scoring.

## SASSA BNPL Optimization Model

### Credit Scoring for SASSA Beneficiaries

| Factor | Weight | SASSA-Specific Considerations |
|--------|--------|------------------------------|
| **Grant Reliability** | 35% | SASSA payments are guaranteed → auto high score |
| **Payment History** | 25% | GroPay transaction history, airtime purchases |
| **Account Age** | 15% | How long SASSA grant received (via bank verification) |
| **Wallet Behavior** | 15% | Savings patterns, bill payments |
| **KYC Level** | 10% | SA ID + SASSA verification = Level 3 auto |

### SASSA-Specific BNPL Limits

| SASSA Grant Type | Monthly Grant | BNPL Limit | Max Instalment |
|------------------|---------------|------------|----------------|
| Old Age Pension | R2,180 | R1,000 | R350 |
| Disability Grant | R2,180 | R1,000 | R350 |
| Child Support (1 child) | R530 | R250 | R90 |
| Child Support (2+ children) | R1,060+ | R500 | R180 |
| Foster Care | R1,180 | R550 | R200 |
| Care Dependency | R2,180 | R1,000 | R350 |

### Repayment Alignment

**Critical Design**: Repayments align with SASSA payment dates (1st-3rd of each month)

```
SASSA BNPL Flow:
┌─────────────────────────────────────────────────────────────────┐
│ Day 1-3: SASSA pays into beneficiary account                    │
│     ↓                                                           │
│ Day 3: Auto-deduct BNPL instalment via DebiCheck               │
│     ↓                                                           │
│ Day 3+: Remaining funds available for beneficiary use           │
└─────────────────────────────────────────────────────────────────┘
```

### Risk Mitigation for SASSA BNPL

1. **Payment Date Lock**: Instalments only collected on SASSA payment dates
2. **Grace Period**: 3-day grace if SASSA payment delayed
3. **Hardship Pause**: Up to 2 months pause for documented emergencies
4. **Limit Cap**: Never exceed 40% of monthly grant

---

# PART 3: LAYBY SYSTEM DESIGN

## Layby vs BNPL Comparison

| Feature | Layby | BNPL |
|---------|-------|------|
| **Ownership** | After final payment | Immediately |
| **Interest** | None | None (3-instalment) |
| **Deposit** | 10-20% minimum | 0% |
| **Duration** | 3-12 months | 3 months |
| **Cancellation** | Refund minus fee | Full repayment required |
| **Item Risk** | Merchant holds item | Consumer has item |
| **Best For** | Big purchases (furniture, appliances) | Everyday purchases |

## Layby Database Model

```prisma
model LaybyPlan {
  id                    String   @id
  userId                String   // Consumer
  merchantId            String   // Merchant
  conversationId        String?  // GroSell conversation (if originated via WhatsApp)
  
  // Item Details
  productId             String
  productName           String
  productSku            String?
  productImageUrl       String?
  
  // Financial
  totalAmount           Float    // Total price
  depositAmount         Float    // Initial deposit (min 10%)
  depositPaid           Boolean  @default(false)
  depositPaidAt         DateTime?
  
  remainingAmount       Float    // Amount still to pay
  instalmentAmount      Float    // Monthly payment
  instalmentsTotal      Int      // Total instalments
  instalmentsPaid       Int      @default(0)
  
  // Status
  status                String   @default("active") // active, completed, cancelled, expired
  
  // Dates
  startDate             DateTime @default(now())
  nextPaymentDue        DateTime
  expiresAt             DateTime
  
  // Cancellation
  cancelledAt           DateTime?
  cancellationReason    String?
  refundAmount          Float?
  cancellationFee       Float?   @default(0) // Typically 10% of total
  
  // DebiCheck
  debicheckMandateId   String?
  debicheckActive      Boolean  @default(false)
  
  // GroSell Origin
  grosellOrderId        String?  // If created via WhatsApp
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([userId, status])
  @@index([merchantId, status])
}

model LaybyPayment {
  id              String     @id
  laybyPlanId     String
  amount          Float
  paymentMethod   String     // card, eft, cash, wallet
  paymentReference String?
  status          String     @default("completed")
  paidAt          DateTime   @default(now())
  
  laybyPlan       LaybyPlan  @relation(fields: [laybyPlanId], references: [id])
  
  @@index([laybyPlanId])
}
```

---

# PART 4: GROSELL + GROCREDIT INTEGRATION

## Integration Points

### 4.1 GroSell Checkout with GroCredit BNPL

```
WhatsApp Checkout Flow:
┌────────────────────────────────────────────────────────────────────┐
│ Customer: "I want to buy the R450 sneakers"                        │
│     ↓                                                              │
│ GroSell: "Great choice! How would you like to pay?                 │
│          1️⃣ Pay Now (Card/EFT)                                     │
│          2️⃣ Pay in 3 instalments of R150 (BNPL)                    │
│          3️⃣ Layby - R45 deposit + 3x R135"                         │
│     ↓                                                              │
│ [If BNPL Selected]                                                 │
│ GroSell: "Your BNPL eligibility: ✅ Approved up to R1,000          │
│          3 payments: R150 on [dates]                               │
│          Reply ACCEPT to proceed"                                  │
│     ↓                                                              │
│ [Consumer Accepts]                                                 │
│ GroSell: "✅ Payment plan activated!                               │
│          First payment: R150 on [SASSA date + 3 days]             │
│          Your sneakers will be delivered tomorrow."                │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 GroSell Checkout with Layby

```
WhatsApp Layby Flow:
┌────────────────────────────────────────────────────────────────────┐
│ Customer: "I want to layby the R15,999 TV"                         │
│     ↓                                                              │
│ GroSell: "Perfect! Layby terms:                                    │
│          📦 Deposit: R1,600 (10%)                                   │
│          📅 Duration: 6 months                                      │
│          💰 Monthly: R2,400                                         │
│          ✅ You'll receive the TV after final payment              │
│                                                                    │
│          Reply 1 to confirm deposit"                               │
│     ↓                                                              │
│ [Deposit Paid]                                                     │
│ GroSell: "✅ Layby confirmed!                                       │
│          Your Samsung TV is reserved.                              │
│          Next payment R2,400 due [date]                            │
│          We'll remind you 3 days before each payment."             │
└────────────────────────────────────────────────────────────────────┘
```

---

# PART 5: DATABASE SCHEMA ADDITIONS

## New Models Required

### 5.1 SASSA Verification

```prisma
model SassaVerification {
  id                    String   @id
  userId                String   @unique
  consumerUserId        String?  // FK to ConsumerUser
  
  // SASSA Details
  idNumber              String   // SA ID
  sassaGrantType        String   // old_age, disability, child_support, foster_care, care_dependency
  sassaGrantAmount      Float    // Monthly grant amount
  sassaPaymentDay       Int      // Day of month (1-3 typically)
  
  // Verification
  verificationStatus    String   @default("pending") // pending, verified, failed, expired
  verifiedAt            DateTime?
  verifiedBy            String?  // System or manual
  verificationMethod    String?  // sassa_api, bank_statement, manual
  
  // Bank Details (where SASSA pays)
  bankName              String?
  bankAccountNumber     String?
  bankAccountType       String?
  
  // Expiry
  validUntil            DateTime?
  lastCheckedAt         DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([idNumber])
}
```

### 5.2 BNPL Agreement

```prisma
model BNPLPlan {
  id                    String   @id
  userId                String   // Consumer
  merchantId            String   // Merchant
  conversationId        String?  // GroSell origin
  
  // Purchase Details
  grosellOrderId        String?
  totalAmount           Float
  instalmentCount       Int      @default(3)
  
  // Payments
  instalmentAmount      Float
  instalmentsPaid       Int      @default(0)
  remainingAmount       Float
  
  // Status
  status                String   @default("active") // active, completed, defaulted, cancelled
  
  // Dates
  createdAt             DateTime @default(now())
  firstPaymentDue       DateTime
  nextPaymentDue        DateTime?
  completedAt           DateTime?
  
  // NCA Compliance
  ncaDisclosureShown    Boolean  @default(false)
  ncaAccepted           Boolean  @default(false)
  ncaAcceptedAt         DateTime?
  
  // SASSA-Specific
  isSassaBeneficiary    Boolean  @default(false)
  sassaPaymentAligned   Boolean  @default(false) // Payments on SASSA dates
  
  // DebiCheck
  debicheckMandateId   String?
  
  @@index([userId, status])
  @@index([merchantId, status])
}

model BNPLPayment {
  id              String     @id
  bnplPlanId      String
  instalmentNumber Int
  amount          Float
  dueDate         DateTime
  paidAt          DateTime?
  status          String     @default("pending") // pending, paid, late, waived
  lateFeeApplied  Float      @default(0)
  
  bnplPlan        BNPLPlan   @relation(fields: [bnplPlanId], references: [id])
  
  @@index([bnplPlanId, status])
}
```

### 5.3 GroSell Credit Integration

```prisma
model GroSellCreditEvent {
  id                String   @id
  conversationId    String
  merchantId        String
  customerId        String?
  
  eventType         String   // bnpl_offered, bnpl_accepted, layby_created, payment_due, payment_collected
  creditType        String   // bnpl, layby, grocredit_merchant
  
  planId            String?  // FK to BNPLPlan or LaybyPlan
  amount            Float?
  
  metadata          String?  // JSON for additional data
  
  createdAt         DateTime @default(now())
  
  @@index([conversationId])
  @@index([merchantId, eventType])
}
```

---

# PART 6: API ENDPOINTS

## GroCredit Integration APIs

### 6.1 Consumer Credit (BNPL + Layby)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consumer/credit/sassa/verify` | POST | Verify SASSA beneficiary status |
| `/api/consumer/credit/bnpl/check` | GET | Check BNPL eligibility & limit |
| `/api/consumer/credit/bnpl/create` | POST | Create BNPL plan |
| `/api/consumer/credit/bnpl/:id` | GET | Get BNPL plan details |
| `/api/consumer/credit/layby/create` | POST | Create layby plan |
| `/api/consumer/credit/layby/:id` | GET | Get layby plan details |
| `/api/consumer/credit/layby/:id/cancel` | POST | Cancel layby & process refund |
| `/api/consumer/credit/layby/:id/payment` | POST | Make layby payment |

### 6.2 GroSell Credit Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/grosell/credit/check` | GET | Check credit options for customer |
| `/api/grosell/credit/bnpl/offer` | POST | Offer BNPL in WhatsApp chat |
| `/api/grosell/credit/layby/offer` | POST | Offer Layby in WhatsApp chat |
| `/api/grosell/credit/accept` | POST | Customer accepts credit offer |
| `/api/grosell/credit/status` | GET | Get credit plan status |

---

# PART 7: SASSA BNPL ALGORITHM

## Credit Scoring Formula for SASSA

```typescript
interface SassaCreditScore {
  // Base score from SASSA status (guaranteed income)
  sassaBaseScore: number;  // Auto 700+ for verified SASSA

  // Factors
  grantReliability: {
    score: number;      // 0-100
    weight: 0.35;
    factors: {
      sassaVerified: boolean;        // +40 points
      grantConsistent: boolean;      // +30 points (6+ months)
      bankAccountMatch: boolean;     // +30 points (SASSA pays to verified account)
    }
  };

  paymentHistory: {
    score: number;      // 0-100
    weight: 0.25;
    factors: {
      groPayOnTime: number;          // % of on-time payments
      airtimePayments: number;       // Regular airtime purchases
      billPayments: number;          // Utility payments via GroPay
    }
  };

  accountAge: {
    score: number;      // 0-100
    weight: 0.15;
    factors: {
      walletAge: number;             // Months since wallet created
      sassaGrantDuration: number;    // Months receiving SASSA
    }
  };

  walletBehavior: {
    score: number;      // 0-100
    weight: 0.15;
    factors: {
      averageBalance: number;        // Average wallet balance
      savingsPattern: boolean;       // Regular savings
      spendingPattern: string;       // responsible/moderate/high-risk
    }
  };

  kycLevel: {
    score: number;      // 0-100
    weight: 0.10;
    level: number;      // 1-4
    factors: {
      saIdVerified: boolean;         // +25 points
      sassaVerified: boolean;        // +25 points (counts as Level 3)
      proofOfAddress: boolean;       // +25 points
      selfieVerified: boolean;       // +25 points
    }
  };

  // Final calculation
  overallScore: number;   // Weighted sum
  bnplLimit: number;      // Calculated limit in cents
  maxInstalment: number;  // Max single instalment in cents
}
```

## Limit Calculation Formula

```typescript
function calculateSassaBNPLLimit(grantAmount: number, score: number): {
  limit: number;
  maxInstalment: number;
  maxInstalments: number;
} {
  // Maximum BNPL limit is 40% of monthly grant
  const maxLimitPercent = 0.40;
  
  // Score multiplier (0.5 to 1.0 based on credit score)
  const scoreMultiplier = Math.min(1.0, Math.max(0.5, score / 850));
  
  // Calculate limit
  const limit = Math.round(grantAmount * maxLimitPercent * scoreMultiplier);
  
  // Max single instalment should not exceed 15% of grant
  const maxInstalment = Math.round(grantAmount * 0.15);
  
  // Maximum 3 instalments for SASSA beneficiaries
  const maxInstalments = 3;
  
  return { limit, maxInstalment, maxInstalments };
}
```

---

# PART 8: IMPLEMENTATION PHASES

## Phase A: Foundation (Week 1)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Add SassaVerification, BNPLPlan, LaybyPlan models to Prisma | 2h |
| P0 | Create database migration | 0.5h |
| P0 | Build `/api/consumer/credit/sassa/verify` endpoint | 3h |
| P0 | Update GroSell conversation flow for credit options | 3h |

## Phase B: BNPL Implementation (Week 2)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Build SASSA credit scoring algorithm | 4h |
| P0 | Create `/api/consumer/credit/bnpl/*` endpoints | 4h |
| P0 | Integrate BNPL into GroSell checkout | 4h |
| P1 | Build BNPL management UI in Consumer Wallet | 4h |

## Phase C: Layby Implementation (Week 3)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Create `/api/consumer/credit/layby/*` endpoints | 3h |
| P0 | Integrate Layby into GroSell checkout | 3h |
| P0 | Build Layby management UI | 3h |
| P1 | Add payment reminders via WhatsApp | 2h |

## Phase D: DebiCheck & Compliance (Week 4)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | DebiCheck mandate creation flow | 4h |
| P0 | NCA disclosure templates | 2h |
| P0 | Credit agreement PDF generation | 3h |
| P1 | Hardship pause functionality | 2h |

---

# PART 9: GROSELL DATABASE SCHEMA (REVISED)

Based on the GroSell specification, here are the **correct** database tables:

```prisma
// ============================================
// GroSell - WhatsApp Commerce Platform
// ============================================

model GroSellConversation {
  id                String   @id
  merchantId        String
  customerPhone     String
  customerId        String?
  
  // Vertical-specific flow
  vertical          String
  subVertical       String
  flowConfigId      String?
  
  // Conversation state
  state             String   @default("greeting") // greeting, browsing, cart, checkout, complete, handoff
  intent            String?  // order, inquiry, complaint, support
  language          String   @default("en")
  
  // Cart reference
  cartSessionId     String?
  
  // Compliance tracking
  ageVerified       Boolean  @default(false)
  consentCaptured   Boolean  @default(false)
  
  // Status
  status            String   @default("open") // open, closed, pending_handoff
  lastMessageAt     DateTime?
  startedAt         DateTime @default(now())
  
  // Metadata
  metadata          String?  // JSON for flow-specific data
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([merchantId, customerPhone])
  @@index([merchantId, status])
}

model GroSellMessage {
  id                String   @id
  conversationId    String
  
  direction         String   // inbound, outbound
  messageType       String   @default("text") // text, image, document, list, button, product
  
  content           String?
  mediaUrl          String?
  
  // WhatsApp metadata
  messageId         String?  @unique // WhatsApp message ID from Meta
  templateId        String?
  
  // Status tracking
  status            String   @default("pending") // pending, queued, sent, delivered, read, failed
  errorMessage      String?
  
  // Cost tracking
  cost              Float    @default(0)
  
  // Timestamps
  queuedAt          DateTime?
  sentAt            DateTime?
  deliveredAt       DateTime?
  readAt            DateTime?
  failedAt          DateTime?
  
  createdAt         DateTime @default(now())
  
  @@index([conversationId])
  @@index([status])
}

model GroSellCartSession {
  id                String   @id
  conversationId    String
  merchantId        String
  customerId        String?
  
  // Cart items (JSON array)
  items             String   // [{productId, name, quantity, price, total}]
  
  // Totals
  subtotal          Float    @default(0)
  deliveryFee       Float    @default(0)
  discount          Float    @default(0)
  taxAmount         Float    @default(0)
  total             Float    @default(0)
  
  // Status
  status            String   @default("active") // active, abandoned, converted, expired
  
  // Abandonment tracking
  abandonedAt       DateTime?
  recoveryNudgeSent Boolean  @default(false)
  recoveredAt       DateTime?
  
  // Conversion
  convertedToOrderId String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([conversationId])
  @@index([status])
}

model GroSellOrder {
  id                String   @id
  orderNumber       String   @unique
  conversationId    String
  cartSessionId     String?
  merchantId        String
  customerId        String?
  
  // Customer details
  customerPhone     String
  customerName      String?
  customerAddress   String?
  customerCity      String?
  deliveryNotes     String?
  
  // Financial
  subtotal          Float    @default(0)
  deliveryFee       Float    @default(0)
  discount          Float    @default(0)
  taxAmount         Float    @default(0)
  total             Float    @default(0)
  
  // Status
  status            String   @default("pending") // pending, confirmed, preparing, ready, delivered, cancelled
  paymentStatus     String   @default("unpaid") // unpaid, paid, failed, refunded
  paymentMethod     String?  // card, eft, payshap, cash, grocredit_bnpl
  
  // Payment integration
  goPayReference    String?
  bnplPlanId        String?
  laybyPlanId       String?
  
  // WhatsApp integration
  whatsappMessageId String?
  
  // Timestamps
  confirmedAt       DateTime?
  preparingAt       DateTime?
  readyAt           DateTime?
  deliveredAt       DateTime?
  cancelledAt       DateTime?
  paidAt            DateTime?
  
  // Notes
  notes             String?
  internalNotes     String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([merchantId, status])
  @@index([customerPhone])
}

model GroSellFlowConfig {
  id                String   @id
  
  // Vertical identification
  vertical          String
  subVertical       String
  
  // Flow configuration
  flowName          String
  greetingTemplate  String
  menuCategories    String?  // JSON array of categories
  
  // Flow steps (JSON)
  flowSteps         String?  // Step definitions with triggers and responses
  
  // AI features
  upsellRules       String?  // JSON for upsell logic
  crossSellRules    String?  // JSON for cross-sell logic
  
  // Compliance
  complianceRequired String? // JSON: {ageGate: true, scriptUpload: false, consentForm: false}
  
  // Languages
  languages         String?  // JSON: {primary: "en", fallback: "en", supported: ["en", "zu", "af"]}
  
  // Status
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([vertical, subVertical])
}

model GroSellComplianceEvent {
  id                String   @id
  conversationId    String
  merchantId        String
  customerId        String?
  
  // Event type
  type              String   // age_verification, script_upload, consent_form, nca_disclosure
  
  // Status
  status            String   @default("pending") // pending, verified, rejected, expired
  
  // Document
  documentUrl       String?
  documentType      String?
  
  // Verification
  verifiedBy        String?
  verifiedAt        DateTime?
  
  // Expiry
  expiresAt         DateTime?
  
  // Additional data
  metadata          String?  // JSON
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([conversationId])
  @@index([type, status])
}

model GroSellMessageQueue {
  id                String   @id
  merchantId        String
  conversationId    String
  
  // Message payload
  messagePayload    String   // JSON with full message data
  
  // Queue management
  priority          Int      @default(3) // 1-5, 1 being highest
  retryCount        Int      @default(0)
  maxRetries        Int      @default(5)
  
  // Status
  status            String   @default("queued") // queued, sending, sent, failed
  
  // Scheduling
  scheduledAt       DateTime?
  sentAt            DateTime?
  failedAt          DateTime?
  failureReason     String?
  
  createdAt         DateTime @default(now())
  
  @@index([status, scheduledAt])
  @@index([merchantId])
}

model GroSellAnalyticsEvent {
  id                String   @id
  merchantId        String
  conversationId    String?
  customerId        String?
  
  // Event classification
  eventType         String   // conversation_start, product_view, add_to_cart, checkout_start, payment_complete, cart_abandon, etc.
  
  // Event data
  eventData         String?  // JSON with event-specific details
  
  // References
  productId         String?
  orderId           String?
  bnplPlanId        String?
  laybyPlanId       String?
  
  // Revenue tracking
  revenue           Float    @default(0)
  
  createdAt         DateTime @default(now())
  
  @@index([merchantId, eventType])
  @@index([merchantId, createdAt])
}
```

---

# PART 10: SUMMARY & APPROVAL REQUEST

## What This Build Delivers

### For GroSell (WhatsApp Commerce)
1. ✅ Correct database schema per specification (8 tables)
2. ✅ Conversation flow engine with state machine
3. ✅ Vertical-specific flow configurations
4. ✅ Compliance layers (age gate, SAHPRA, consent)
5. ✅ Message queue for offline resilience
6. ✅ Analytics event tracking

### For GroCredit Integration
1. ✅ BNPL for all consumers (3-instalment, interest-free)
2. ✅ **SASSA-optimized BNPL** with aligned payment dates
3. ✅ Layby system with deposit + instalments
4. ✅ DebiCheck mandate integration
5. ✅ NCA compliance throughout

### For SASSA Beneficiaries
1. ✅ Auto-elevated credit scores (guaranteed income = low risk)
2. ✅ Payment alignment with grant dates
3. ✅ Hardship pause capability
4. ✅ Limits capped at 40% of grant

---

## APPROVAL QUESTIONS

1. **Database Schema**: Confirm the GroSell tables + BNPL/Layby tables are correct?

2. **SASSA Model**: Is the 40% of grant limit appropriate, or should it be lower/higher?

3. **BNPL Terms**: Confirm 3-instalment interest-free, or should we offer more flexibility?

4. **Layby Terms**: Confirm 10% minimum deposit, 3-12 month duration?

5. **Implementation Priority**: Should I build in this order?
   - Phase A: Foundation (GroSell tables + SASSA verification)
   - Phase B: BNPL for consumers
   - Phase C: Layby system
   - Phase D: GroSell conversation engine

6. **WhatsApp Business API**: Do you have Meta Cloud API credentials, or should I build with mock first?

---

**Please approve or adjust, and I'll begin implementation.**
