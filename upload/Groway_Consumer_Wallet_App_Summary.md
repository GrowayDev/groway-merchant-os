# Groway Consumer Wallet Application

## Overview

A comprehensive South African consumer wallet super-app built with Next.js 16, React 19, and TypeScript. The application provides a full-featured financial services platform with South African regulatory compliance (NCA, NCR, FSCA, POPIA).

---

## Application Structure

### Navigation Tabs

| Tab | Icon | Description |
|-----|------|-------------|
| **Home** | 🏠 | Balance card, quick actions, services grid, transactions |
| **Pay** | 💳 | QR scanning, Send/Receive money, PayShap, P2P transfers |
| **Services** | 🛍 | Financial services, bill payments, airtime, remittance |
| **Offers** | 💎 | AI-personalized offers, loyalty program, flash sales |
| **Profile** | 👤 | Settings, KYC documents, security, notifications |

---

## Feature Modules

### 💰 Financial Services

Located in: **Services Tab → Financial Services Section**

| Service | Icon | Description |
|---------|------|-------------|
| **Credit Marketplace** | 📈 | Personal & Business loans from 12 lenders |
| **Savings Goals** | 🎯 | Goal-based savings with auto-save rules |
| **Insurance Marketplace** | 🛡️ | Funeral, Life, Health, Vehicle insurance |
| **Pay+ (EWA)** | ⚡ | Early Wage Access (up to 60% of accrued salary) |
| **BNPL** | 💳 | Buy Now, Pay Later - Pay in 3 instalments |
| **Digital Laybye** | 🛍️ | Reserve items, pay in monthly instalments |

### 💳 BNPL (Buy Now, Pay Later)

**Location:** Services → Financial Services → BNPL

**Features:**
- NCR Registered credit provider badge
- R5,000 spending limit display
- Credit eligibility check (based on credit score)
- 3-instalment payment structure:
  - Instalment 1: Pay 1/3 at checkout
  - Instalment 2: Month 2 (DebiCheck auto-debit)
  - Instalment 3: Month 3 (DebiCheck auto-debit)
- Active BNPL plans tracking with status badges
- Early repayment option (no penalties)
- NCA Pre-Agreement Disclosure:
  - Credit Provider: Groway BNPL (NCR CP XXXX)
  - Agreement Type: Incidental Credit Agreement
  - Interest Rate: 0% (Interest-Free)
  - Initiation Fee: R0
  - Monthly Service Fee: R0
  - Cooling-Off Period: 5 Business Days

**NCA Compliance:**
- DebiCheck mandates via BankServ
- Pre-agreement disclosure before acceptance
- 5 business days cooling-off period
- Late payment interest capped at repo rate + 21%

### 🛍 Digital Laybye

**Location:** Services → Financial Services → Laybye

**Features:**
- Stats dashboard: Active Laybyes, Total Reserved, Total Paid
- NCA Protected indicator (applies to laybyes over R500 or 12+ months)
- Active laybyes with progress tracking:
  - Instalment schedule with status indicators
  - Due date alerts
  - Auto-release notification when complete
- How it works:
  1. Reserve Your Item (10% deposit)
  2. Pay in Instalments (monthly tracking)
  3. Collect When Complete (auto-release notification)

**Terms & Cancellation Policy:**
- Maximum Term: 6 months from deposit date
- Deposit: 10% minimum to reserve item
- Late Payment: 7-day grace period before cancellation
- Cancellation: Full refund minus 15% cancellation fee
- NCA Protection: Applies to laybyes over R500 or terms exceeding 12 months

### 📈 Credit Marketplace

**Location:** Services → Financial Services → Credit

**Personal Loans:**
- Hero stats: 10.5% APR from, up to R350K, 3-84 months terms
- Loan calculator with amount and term sliders
- 4 loan types: Personal, Payday, Debt Consolidation, Vehicle Finance
- 6 personal lenders:
  1. Investec Personal Loans (9.5% - 18.5% APR)
  2. Discovery Personal Loans (10.5% - 22.5% APR)
  3. FNB Personal Loans (11% - 23.5% APR)
  4. Standard Bank (11.5% - 24.5% APR)
  5. Nedbank Personal Loan (12% - 24% APR)
  6. Old Mutual Finance (12.5% - 25.5% APR)

**Business Loans:**
- Hero stats: 12% APR from, up to R5M, 3-84 months terms
- Loan calculator with amount slider (R25K-R5M)
- 5 business loan types:
  - Term Loan
  - Business Overdraft
  - Invoice Financing
  - Equipment Finance
  - Merchant Cash Advance
- 6 business lenders:
  1. Standard Bank Business (12% - 20% APR)
  2. Business Partners Ltd (12.5% - 22.5% APR)
  3. FNB Business (13% - 21.5% APR)
  4. Nedbank Business (13.5% - 22% APR)
  5. Absa Business Banking (14% - 23.5% APR)
  6. Bidvest Bank Business (14.5% - 24% APR)

**Debt Counselling Services:**
- 5-step debt review process
- 4 NCR-registered debt counsellors (DebtSafe, DebtBusters, National Debt Advisors, ZeroDebt)
- Free debt assessment option

### 💳 Payments & Transfers

Located in: **Services Tab → Payments & Transfers Section**

| Service | Description |
|---------|-------------|
| **PayHub Balance** | Wallet balance and transaction history |
| **Bank Accounts** | Link and manage bank accounts (FNB, Capitec, Standard, Absa, Nedbank, TymeBank) |
| **Int'l Transfer** | International remittance to 50+ countries |
| **Beneficiaries** | Manage payment recipients |

### 📱 Airtime & Data

**Networks Supported:**
- Vodacom
- MTN
- Cell C
- Telkom
- Rain

**Bundle Types:**
- Data bundles
- Voice bundles
- SMS bundles
- Social media bundles
- Night data
- Promotional bundles

### ⚡ Bill Payments

**Categories:**
- Electricity (Eskom, Prepaid meters)
- Water (Municipal)
- DStv/MultiChoice
- Insurance premiums
- Municipal rates
- Traffic fines
- Education fees
- Telecom bills

### 🌍 International Remittance

**Providers:**
- Chipper Cash
- Mukuru
- TerraPay
- WorldRemit
- AZA Finance
- Stablecoin (USDC/Stellar)

**Corridors:** South Africa to SADC, rest of Africa, and international

**Compliance:** SARB ADA (Authorised Dealer in Foreign Currency)

### 🎫 Vouchers & Gift Cards

**South African Vouchers:**
- 1voucher (Betting deposits - Hollywoodbets, Betway, etc.)
- OTT Voucher (Online betting)
- Blu Voucher (Gaming & entertainment)
- Flash Voucher (Retail)

**Gift Cards:**
- Retail: Shoprite, Pick n Pay, Woolworths, Game, Makro
- Food: KFC, Nando's, McDonald's, Steers
- Entertainment: Netflix, Spotify, PlayStation, Xbox
- 3-year expiry per Consumer Protection Act (July 2024)

### 🚆 Transport & Travel

**Services:**
- Gautrain tickets
- MyCiTi (Cape Town bus)
- Rea Vaya (Johannesburg bus)
- Inter-city buses (Greyhound, Intercape)
- Domestic flights (FlySafair)
- Airport lounge access

### 💎 Loyalty & Offers

**Loyalty Program:**
- 4 tiers: Bronze → Silver → Gold → Platinum
- Points earned on all transactions
- Tier benefits and rewards
- Progress tracking

**Offers:**
- AI-personalized offer feed
- Category browsing
- Clipped offers
- Flash sales
- Loyalty boosts

---

## Technical Specifications

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 with App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style) |
| Icons | Lucide React |
| State Management | React useState/useEffect |

### Design System

**Brand Colors:**
- Primary Green: `#1B5E20` (Growth Green)
- Secondary Green: `#4CAF50`
- Teal: `#00897B`
- Purple: `#9C27B0`
- Amber: `#FF9800`
- Blue: `#1565C0`

**Typography:**
- Font: System UI (Inter, SF Pro, Segoe UI)
- Currency Format: R X XXX (space as thousands separator)
- ZAR currency throughout

**Components:**
- BottomSheet modal pattern
- Card components with elevation
- Progress bars for tracking
- Badge components for status
- Button variants (primary, outline, ghost)

### South African Compliance

| Regulation | Implementation |
|------------|----------------|
| **NCA** | Pre-agreement disclosures, cooling-off periods, interest caps |
| **NCR** | Credit provider registration displayed |
| **FSCA** | FAIS licence for financial product advice |
| **POPIA** | Privacy consent, data protection |
| **CPA** | Consumer rights, 3-year gift card expiry |
| **FICA** | KYC levels 0-4 |
| **DebiCheck** | Bank-authorised debit orders |

---

## API Endpoints (Credit Service - Port 3016)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/credit/score` | Groway Credit Score (0-850) |
| GET | `/v1/credit/eligibility` | Check BNPL eligibility |
| POST | `/v1/credit/bnpl/initiate` | Start BNPL flow at checkout |
| GET | `/v1/credit/bnpl/disclosure/:id` | NCA pre-agreement disclosure |
| POST | `/v1/credit/bnpl/accept` | Accept NCA credit agreement |
| GET | `/v1/credit/marketplace/prequalify` | Soft credit check (all lenders) |
| GET | `/v1/credit/marketplace/offers/:id` | Lender offers sorted by cost |
| GET | `/v1/credit/debit-orders` | DebiCheck mandate management |

---

## File Structure

```
/home/z/my-project/
├── src/app/
│   └── page.tsx          # Main Consumer Wallet application (9,500+ lines)
├── upload/
│   ├── Groway_Master_Build_Document.docx
│   ├── Groway_Consumer_Wallet_App_Summary.md  # This document
│   └── [other specification documents]
├── worklog.md            # Development progress log
└── dev.log               # Development server logs
```

---

## Development Status

| Module | Status |
|--------|--------|
| Home Dashboard | ✅ Complete |
| Services Tab | ✅ Complete |
| Credit Marketplace | ✅ Complete |
| BNPL | ✅ Complete |
| Digital Laybye | ✅ Complete |
| Airtime & Data | ✅ Complete |
| Bill Payments | ✅ Complete |
| International Remittance | ✅ Complete |
| Vouchers & Gift Cards | ✅ Complete |
| Transport & Travel | ✅ Complete |
| Loyalty & Offers | ✅ Complete |
| Profile & Settings | ✅ Complete |

---

## Testing the Application

1. Open the **Preview Panel** on the right side of the interface
2. Click **"Open in New Tab"** for full-screen view
3. Navigate using the bottom tab bar:
   - **Home**: View balance, quick actions, recent transactions
   - **Pay**: QR payments, send/receive money
   - **Services**: Access all financial services including BNPL and Laybye
   - **Offers**: View personalized offers
   - **Profile**: Manage account settings

---

## Version Information

- **Version:** 4.0
- **Last Updated:** February 2026
- **Target Go-Live:** April 2027
- **Benchmarked Against:** Alipay, WeChat Pay, Revolut, Grab, M-Pesa

---

*This document reflects the current state of the Groway Consumer Wallet application as displayed in the preview.*
