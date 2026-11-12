# Groway and Tshepo: Master Build Document

**Version 2.0 · 11 November 2026 · Prepared for Groway (Pty) Ltd · Replaces the earlier architecture and build specification where they differ**

## 1. Purpose and how to read this

This is the single reference for the whole build: what exists today, what is being built, in what order, on what infrastructure, under which rules, and how mobile money in Malawi is enabled. It is written so a new engineer, an investor or a regulator can start here.

*VERIFY* marks a statement that needs confirmation by counsel, a regulator, a partner or a check of the code before anyone relies on it. Section 13 covers Malawi mobile money in full, and section 16 covers airtime, data and electricity advances for South Africa and Malawi. Sections 17 to 20 cover supplier and aggregator interfaces, float funding, launch order and the TNM proposition, and the complete code inventory.

**Working names.** *Tshepo* is the working name for the credit, ledger and payments-intelligence layer being added to Groway. Pending a trademark and meaning review.

## 2. Where things stand today

These facts come from the Groway source archive and from you.

| Area | Fact |
| --- | --- |
| Application | One Next.js 16 and React 19 application in TypeScript; Prisma 6 for data; roughly 680 API route handlers; about 296 data models |
| Database | SQLite in development. A separate Postgres schema file has 62 models and is stale and unused |
| Hosting | Everything is in development mode. The live site is on Netlify or Cloudflare (to confirm which). No GoPay route is live |
| Authentication | NextAuth v4 and JWT; a permissions module; a tenant context based on platform tenant and merchant |
| Money | About 460 money and number fields are floating point; the consumer wallet model uses integer cents |
| Existing products | Merchant OS, GroCredit (tiers, merchant credit, applications, draws, repayments), GoPay models, grant, BNPL, layby and earned wage access shells, consumer lending models |
| Consumer wallet | Removed from the final specification because of storage problems and lag on GLM; to be restored |
| Older Master Build | Describes about 35 microservices and a React Native app. None of this is in the source |

**Biggest risks in the current state:** production runs on a file database that cannot keep data; money is stored as floating point; GoPay tables have no tenant key and no ledger; tenant isolation is only partly verified.

## 3. Scope

### In scope

1. **Foundation:** move to Postgres, reconcile the schema, fix the database client, set up repeatable environments.
2. **Tshepo core:** double-entry ledger, consent, decisioning, repayment waterfall, GoPay settlement logic, edge decision envelopes.
3. **Credit:** GroCredit connected to the ledger and the decision engine; merchant working capital; grant earned-wage access.
4. **GoPay:** end-to-end acquiring, settlement, repayment split and reconciliation, disabled until licensed.
5. **Mobile money in Malawi:** Airtel Money and TNM Mpamba collections and payouts through licensed partners, with M-Pesa handled as an inbound remittance channel (section 13).
6. **Consumer wallet:** restored from the older build file, after licensing is settled.
7. **SmartPole edge:** offline-capable decisions and payments at Digital Hubs.

### Not in scope until a decision is taken

Groway balance-sheet lending, an own e-money licence in Malawi, quantum and CBDC work, and any move of live customer money onto the Mac server.

## 4. Architecture

### 4.1 Decision: a modular monolith inside the Groway repository

Tshepo is TypeScript modules under `src/lib/tshepo` with route handlers under `src/app/api/tshepo`. Every external dependency (database, payment provider, feature data, messaging) sits behind a port, so a module can be extracted into a service later if a measured need appears. Kubernetes, a separate feature store and a message broker are not needed in the early waves.

### 4.2 Modules

| Module | Responsibility | Status |
| --- | --- | --- |
| ledger | Double-entry posting, idempotency, outbox port, trial balance | Built and tested |
| consent | Purpose-bound, revocable, expiring consent log | Built and tested |
| repayment | Waterfall allocation and the settlement split rule | Built and tested |
| gopay | Capture, fee, settlement, split, payout, debit-order route, refusal while GoPay is not live | Built and tested |
| decisioning | Consent first, features, hard stops, affordability, reason codes, trace | Built and tested |
| edge | Signed offline decision envelopes and spend caps | Built and tested |
| Prisma ledger adapter | Writes entry, lines and outbox in one transaction | Built; tested against a fake client only |
| mobile money rail | Provider-neutral collections and payouts for Malawi | Specified in section 13; not built |
| consumer wallet | Wallet accounts, limits, payments, repayments | Specified in section 6.6; not built |
| routes and screens | API handlers and admin screens | Not built |

The bundle holds 24 passing tests and a schema that passes the Prisma 6 validator when merged with Groway's models. The SQL guards that enforce balanced entries and append-only tables have not yet run on a database.

### 4.3 Data and money rules

- All money in new code is integer minor units (cents, tambala) held as BigInt, with an ISO currency code. Never floating point.
- Each currency has its own ledger accounts. Rand and Malawi kwacha are never netted; conversion is an explicit entry with a recorded rate and source.
- The existing accounting journal stays for accounting. Tshepo has its own ledger tables linked by source type and source ID, and posts summary entries to accounting.
- Float columns in older tables become read-only mirrors. New money movements go to the ledger first.
- Every tenant-scoped table carries a tenant key. Every Tshepo route applies a tenant guard before reading or writing.
- Events are written to a Postgres outbox in the same transaction as the ledger entry, and a worker publishes them. A message broker is added only when a measured threshold is crossed.

### 4.4 Security baseline

- NextAuth and JWT stay. Staff and agent accounts use multi-factor sign-in.
- Personal data is tokenised on ingestion; raw identifiers live only in the identity and KYC code paths.
- Secrets come from the environment or a secret manager, never from the repository. The `.env` file is never committed.
- TLS everywhere; the Mac server is reached only through a Cloudflare tunnel; no router ports are opened.
- Provider callbacks are verified, replay-protected and idempotent (section 13.5).
- Append-only enforcement on ledger and consent tables is done in the database, not only in code.

## 5. Platform, hosting and environments

| Environment | Where | Use |
| --- | --- | --- |
| Development | Your Mac or local machines, Postgres 16 | Building and testing |
| Staging | The Mac server behind a Cloudflare tunnel and Cloudflare Access, on a test address | Demos, partner sandboxes, internal review |
| Production | Hosted Postgres and a hosted app in a South African region (provider to be chosen) | Real customers and real money |

### 5.1 Move from SQLite to Postgres

The bundle contains the 296-model schema switched to Postgres plus the six Tshepo models (302 models). The helper scripts install Postgres, create the database and a restricted role, replace the schema and database client, generate a baseline migration, and add the ledger guards. A separate, checked step moves the data.

### 5.2 Cloudflare

Cloudflare provides the domain, protection and the tunnel to the Mac. Staging uses its own sub-address, locked to your email through Cloudflare Access. The current live site is left alone until staging has run cleanly.

### 5.3 Criteria for moving to hosted production

Hosted Postgres in a South African region with automated backups and point-in-time recovery; an uptime target and an on-call owner; backup restores tested; secrets in a manager; staging and production separated; penetration test closed; licences and agreements for the first product in place. The Mac server never carries live credit or payments.

### 5.4 Operations

One database client per process with query logging off by default; Sentry for errors; structured logs with a correlation ID on every request; daily encrypted backups copied off the machine with a monthly restore test; runbooks for ledger imbalance, provider outage, decision latency, consent backlog, data breach, key compromise and data requests.

## 6. Product build specifications

### 6.1 Ledger

Accounts, journal entries and lines, with signed amounts (debit positive, credit negative). Rules: every entry nets to zero; no zero lines; idempotency key unique per tenant; reversals are new entries; balances come from lines. The Prisma adapter commits entry, lines and outbox row in one transaction. Database triggers reject unbalanced entries at commit and block update and delete on ledger and consent tables.

### 6.2 GoPay end to end (disabled until licensed)

Customer pays at the till on a supported rail (QR or PayShap, instant EFT, debit card, credit card). A licensed partner authorises the payment. GoPay deducts the merchant fee, settles into the trust account, applies any repayment share, and pays out the remainder. Each stage is a ledger entry with its own idempotency key, so a replay changes nothing. In the debit-order route the partner collects repayments on a schedule and failures raise arrears. The split route refuses to run while the live flag is off.

### 6.3 Decisioning and GroCredit

GroCredit tiers and the NCA flags become the policy input. The orchestrator checks consent first, reads features, applies hard stops (identity check, arrears, tenure), runs affordability, then returns an outcome, a limit, reason codes, a counterfactual and a trace carrying policy and model versions. Missing critical data means refer to a human, never a guess. The decision step is where the first scorecard is plugged in.

### 6.4 Repayment and collections

Waterfall order is product configuration approved by compliance. Collections handles arrears buckets, customer messaging, promise-to-pay, hardship and restructuring before any escalation. Grant-linked products enforce a minimum retained amount and a cap on total deductions. Every adverse outcome has a human review path.

### 6.5 Edge and SmartPole

A small Node agent on the hub appliance holds signed eligibility envelopes (Ed25519), verifies signature, tenant, key ID and expiry offline, tracks spend against the cap, and syncs over WiFi, LTE or satellite. Offline limits stay small until early hubs show clean reconciliation.

### 6.6 Consumer wallet (restored from the older build file)

| Area | Specification |
| --- | --- |
| Wallet core | Ledger account kind `consumer_wallet`; limits and KYC levels 0 to 4 as policy; savings pockets; history and export; disputes |
| Payments | QR, peer-to-peer, PayShap, request and split, scheduled payments, beneficiaries; offline tokens reuse the signed-envelope design |
| Services | Bills, airtime, remittance, vouchers, ticketing, prepaid electricity through licensed partners |
| Credit | BNPL, earned wage access and layby shells on the Tshepo decision engine; repayment may come from the wallet |
| Performance fixes | Split the 556 KB page into five tabs loaded on demand, paginate lists, remove backup copies from the app folder, query logging off, a bundle size limit in CI |
| Gate | Holding customer funds is regulated: settle the licence route or a licensed partner first |

The existing wallet model already stores integer cents, so it maps to the ledger without conversion.

## 7. Compliance summary

| Area | South Africa | Malawi |
| --- | --- | --- |
| Credit | NCA registration and affordability rules; collections conduct | Financial Services Act and RBM rules for lenders *VERIFY* |
| Payments | Licence or licensed partner for wallet and settlement activity | RBM licensing under the Payment Systems Act 2016; use a licensed provider (section 13.7) |
| Data protection | POPIA, including limits on solely automated decisions *VERIFY* | Data Protection Act 2024: controller registration, data protection officer, impact assessments, cross-border conditions |
| Anti-money laundering | FICA programme, sanctions screening, goAML reporting | Financial Intelligence Authority obligations *VERIFY* |

Policy and compliance rules are expressed as versioned data and code, reviewed and tested like any other change.

## 8. Build plan

Each wave ends with a deployable increment and a go or no-go gate. Durations are indicative for a small team using AI-assisted development with mandatory human review on ledger, security, credit policy and compliance code.

| Wave | Focus | Main deliverables | Gate |
| --- | --- | --- | --- |
| 0: Foundation (weeks 0 to 4) | Environment and data | Postgres on the Mac, baseline migration, new database client, ledger guards applied, data moved with row-count checks, Tshepo tests running in the repo with jest, regulatory and lender decisions started | Clean restore test; all tests green; legal route confirmed for the first credit product |
| 1: Core and first-party pilot (months 1 to 5) | Money you already control | Tshepo routes behind a tenant guard; ledger-first writes for GroCredit and grant products; consent; decisioning; KYC, bureau and fraud checks; collections; back office views; Wave 1 repayment through licensed partner debit orders | Pilot loss rate inside the base case for two vintages; reconciliation clean for 30 days; no critical security findings |
| 2: GoPay go-live | Acquiring and settlement | Licensing complete; partner integrations; settlement split switched on; reconciliation against partner reports | Licences in force; live reconciliation clean |
| 3: Malawi mobile money (see section 13) | Airtel Money and Mpamba | Sandbox, collections for WiFi top-ups, payouts, merchant collections, then credit disbursement and repayment | Partner contract and entity ready; Data Protection Act steps complete |
| 4: Consumer wallet | Restore the wallet | Performance rebuild, ledger link, limits, partner-backed cash in and out | Licence route settled |
| 5: Partners and edge | Scale | Partner adapters (utility, ISP, MNO), SmartPole edge pilot, second hub | Two external partners live |

## 9. Team and operating rules

- **Roles:** technical lead and architect, compliance and risk lead, credit and product lead, backend engineers, a data and models engineer, a platform and security engineer, QA, operations and collections staff. The mix grows by wave.
- **Review rules:** four-eyes review on the ledger, repayment, credit policy, consent, cryptography, provider callbacks and migrations that touch money.
- **AI-assisted development:** allowed for scaffolding, adapters, tests and documentation; generated code goes through the same pipeline; no secrets or real customer data in prompts; named humans own the controlled areas above.
- **Cadence:** weekly releases behind feature flags; a monthly credit committee; a recorded decision (ADR) for every stack choice.

## 10. Testing and quality gates

| Gate | When |
| --- | --- |
| Type check, unit tests, contract tests | Every pull request |
| Ledger property tests (entries net to zero, replay rebuilds balances) | Any change to ledger or repayment |
| Dependency and container scan, secret scan | Every pull request |
| Integration tests against provider sandboxes | Release candidate |
| Load test at three times expected peak | Release candidate |
| Migration dry run on a staging copy | Release candidate |
| Disaster-recovery restore | Before each pilot stage |
| Penetration test | Before any live money |

## 11. Principal risks

| Risk | Mitigation |
| --- | --- |
| Production data loss on a file database | Move to Postgres first (Wave 0) |
| Float money and no ledger on GoPay and credit tables | Ledger-first writes; floats become mirrors |
| Incomplete tenant isolation | Tenant guard on every Tshepo route; isolation test suite |
| Regulatory delay on GoPay and the wallet | Wave 1 does not depend on either |
| Mobile money provider outage or callback failure | Two providers per operator where possible; status polling; daily reconciliation |
| Cross-border data rules (Malawi data hosted in South Africa) | Legal basis and safeguards agreed before launch *VERIFY* |
| Mac server failure | Staging only; backups; move to hosted production before live money |
| Single-person dependency | Documentation, runbooks and a second engineer with access |

## 12. Decisions still needed

1. Which host serves the live site today (Netlify or Cloudflare), and the plan for the production host.
2. First funding structure and lender for credit.
3. Legal opinion on credit provider, wallet and payment roles in South Africa.
4. The Malawi contracting entity, provider choice and licensing route (section 13).
5. The name, after a trademark and meaning check.
6. Who owns compliance, security and operations once the team grows.

## 13. Malawi mobile money enablement

This section covers Airtel Money, TNM Mpamba and M-Pesa. The facts below come from public sources reviewed on 11 November 2026 (listed in section 15); anything marked *VERIFY* needs a partner or counsel to confirm.

### 13.1 The three names and what they mean in Malawi

| Name | What it is | How Groway reaches it |
| --- | --- | --- |
| Airtel Money | Airtel Malawi's wallet; one of the two main mobile money operators | Through a licensed aggregator first; direct operator integration later for cost |
| TNM Mpamba | The wallet of TNM Mpamba Limited, TNM's mobile money company | Same as Airtel Money |
| M-Pesa | Vodacom and Safaricom's wallet. The sources reviewed name only Airtel and TNM as Malawi's mobile money operators, and aggregator coverage tables list Airtel and TNM for Malawi, with M-Pesa listed for other countries. M-Pesa reaches Malawi as a cross-border sender, for example Vodacom Tanzania customers sending to Malawian bank accounts and to Airtel Money and Mpamba wallets | Treat M-Pesa as an inbound remittance channel that lands in Airtel Money, Mpamba or a bank account. Add a direct M-Pesa adapter only if a domestic M-Pesa wallet launches. *VERIFY* with Vodacom |

Both Malawian wallets are connected to the National Switch and can send money to each other in real time. TNM held about 56% of mobile subscribers and Airtel about 43% at the end of 2022, according to Omdia.

### 13.2 Approach: start with a licensed partner

Groway does not issue e-money or run a payment system in Malawi in the first phases. It integrates through payment service providers that the Reserve Bank of Malawi (RBM) has licensed, behind a provider-neutral interface so providers can be swapped or combined.

| Criterion | pawaPay | PayChangu | Direct operator integration |
| --- | --- | --- | --- |
| Malawi operators | Airtel and TNM, in kwacha | Airtel Money and Mpamba | One integration per operator |
| Services | Collections and payouts through one asynchronous API, with callbacks | Collections (hosted checkout and direct charge), payouts to wallets and banks, bill payments (for example water and electricity), airtime, cards, USD virtual accounts | Depends on the operator |
| Licence | Reported to hold an RBM payment service provider licence | Reported to hold an RBM licence effective 30 September 2026 | Operator-licensed |
| Other countries | About 23 countries, useful for later expansion | Malawi focus | None |
| Fees, limits, settlement terms | To obtain | To obtain | To negotiate |

**Decision rule:** run both sandboxes for a week and compare success rate, latency, fees and settlement terms, then contract one as primary and the other as failover. Move to direct operator integration only when volume makes the fee saving worth the extra work.

### 13.3 Use cases in order

| Phase | Use case | How it works | Why in this order |
| --- | --- | --- | --- |
| M0 | Preparation | Contracting entity, settlement bank account in kwacha, provider onboarding, data protection steps | Nothing live can start without these |
| M1 | Collections: SmartPole WiFi top-ups and Merchant OS sales | Customer enters a phone number, approves a prompt on the handset with their PIN, a callback confirms, the ledger records the sale | Your own first-party flows, small tickets, no credit risk |
| M2 | Payouts | Refunds, supplier payments and merchant settlement to wallets | Reuses the same rail in the other direction |
| M3 | Credit | Disbursement to a merchant's wallet; repayment by a share of collections or by customer-approved prompts | Needs the ledger, decisioning and licensing complete |
| M4 | Wallet and services | Cash in and out through a partner, bill payments and airtime | Depends on the consumer wallet licence route |

My research found no debit-order equivalent for Malawian wallets. Plan repayment around a split of collections, customer-approved payment prompts with reminders, and agent cash, and ask each provider whether standing mandates exist. *VERIFY*

### 13.4 Rail design

The Tshepo mobile money rail is a provider-neutral interface, in the same ports-and-adapters style as the ledger:

```ts
interface MobileMoneyRail {
  provider: 'pawapay' | 'paychangu';
  collect(req: CollectRequest): Promise<RailAccepted>;   // customer approves on handset
  payout(req: PayoutRequest): Promise<RailAccepted>;
  status(reference: string): Promise<RailStatus>;
  parseCallback(headers: Headers, body: string): VerifiedEvent; // throws if invalid
  operators(): Promise<Operator[]>;                      // AIRTEL_MWI, TNM_MWI
}

type CollectRequest = {
  reference: string;        // equals the ledger idempotency key
  amountMinor: bigint;      // kwacha in tambala
  currency: 'MWK';
  msisdn: string;           // +265...
  operator: 'AIRTEL_MWI' | 'TNM_MWI';
  purpose: string;
};
```

**Transaction states:** created, accepted by provider, waiting for the customer, then completed, failed, timed out, or unknown. Unknown is never treated as success: it is polled until final and reconciled.

**Ledger postings (kwacha accounts kept separate from rand):**

| Event | Entry |
| --- | --- |
| Collection completed | Debit mobile money clearing (per provider), credit merchant wallet or sales account |
| Fee charged | Debit merchant wallet, credit fee income; provider cost to a cost account |
| Provider settles to the kwacha bank account | Debit trust bank (kwacha), credit mobile money clearing |
| Payout accepted | Debit wallet, credit payout pending (a reserve) |
| Payout completed | Debit payout pending, credit mobile money clearing |
| Payout failed | Reverse the reserve |

Amount precision differs by provider and operator, so each provider adapter converts between tambala and the provider's decimal rules, with tests for rounding.

**Reconciliation:** a daily job compares provider reports and callbacks with the ledger and sends differences to an exceptions queue. No manual edits to ledger entries; corrections are new entries.

### 13.5 Callback security and failure handling

- Verify every callback signature as the provider specifies, reject stale timestamps, and store the raw payload append-only.
- Answer quickly with a success code and process the event asynchronously. Process each provider reference at most once.
- Always have a status poll as a fallback with backoff.

| Situation | Handling |
| --- | --- |
| Customer ignores the prompt, enters a wrong PIN or has too little money | Mark failed, show a clear message, post nothing |
| No answer before the timeout | Mark unknown, poll, reconcile; never assume success |
| Duplicate callback | No effect, because of the idempotency key |
| Provider outage | Circuit breaker; use the second provider for the same operator; queue payouts |
| Callback for an unknown reference | Quarantine and alert |
| Amount differs from the request | Hold and investigate |
| Wallet limit exceeded | Show the limit message; do not retry |

### 13.6 Identity, limits and fraud

- Validate phone numbers (+265 and operator prefixes); use account-name checks if the provider offers them.
- Keep product limits inside the operator wallet limits. RBM sets transaction and balance limits for e-money accounts under the Payment Systems (E-Money) Regulations 2019.
- Map KYC levels to the national ID route *VERIFY*; reuse sanctions and politically exposed person screening.
- Add velocity rules, SIM-swap signals where operators share them, a cooling-off period when a payout destination changes, and dual approval for large payouts.

### 13.7 Licensing, regulation and data

| Area | What applies | Design consequence |
| --- | --- | --- |
| Payments | The Payment Systems Act 2016 makes it unlawful to run a payment system, remittance or e-money service without RBM authorisation. RBM has warned the public about unlicensed providers | Stay on a licensed partner's licence. The Malawi entity does not hold customer funds. If Groway ever holds or moves funds for others, apply for a licence or use a licensed partner structure. *VERIFY* with Malawian counsel |
| Trust accounts | The 2011 mobile payment guidelines require trust accounts matching e-money issued | Not Groway's duty while it is not an issuer; relevant if the wallet is brought to Malawi |
| Credit | Lending needs registration under the Financial Services Act regime *VERIFY* | Do not start M3 before the registration route is confirmed |
| Anti-money laundering | Financial Intelligence Authority obligations *VERIFY* | Extend the compliance programme to Malawi |
| Data protection | Data Protection Act 2024 in force from 3 June 2024, regulated by MACRA. Requires a lawful basis, a data protection officer, impact assessments for high-risk processing, registration for significant controllers, and conditions on sending data abroad. Financial-sector bodies have asked for a grace period | Complete the data protection steps in M0. Agree a lawful basis and safeguards before Malawi customer data is stored in South Africa or on the Mac. Tokenise phone numbers. *VERIFY* |
| Tax and levies | Press reports describe new mobile money levies | Model fees and taxes as configuration, not constants. *VERIFY* current rates |
| Currency | Kwacha settlement; conversion to rand or dollars is a regulated step | Keep kwacha balances local; record any conversion explicitly. *VERIFY* exchange rules |

### 13.8 Malawi backlog

| ID | Story | Depends on | Phase |
| --- | --- | --- | --- |
| M-01 | Decide the contracting entity; open a kwacha settlement bank account | None | M0 |
| M-02 | Complete provider onboarding and sign agreements with two providers | M-01 | M0 |
| M-03 | Obtain sandbox credentials and store them in the secret manager | M-02 | M0 |
| M-04 | Data protection work: officer, impact assessment, controller registration, transfer basis | None | M0 |
| M-05 | Define the rail interface and types | Wave 0 | M1 |
| M-06 | Kwacha ledger accounts: clearing per provider, payout pending, fees, trust bank | Ledger | M1 |
| M-07 | First provider adapter: collect, status, callback verification | M-03, M-05 | M1 |
| M-08 | Callback endpoint: signature check, replay guard, raw payload store | M-07 | M1 |
| M-09 | Collection state machine and ledger postings | M-06, M-08 | M1 |
| M-10 | WiFi top-up flow in the hub portal | M-09 | M1 |
| M-11 | Pay-by-mobile-money at Merchant OS checkout in kwacha | M-09 | M1 |
| M-12 | Daily reconciliation job and exceptions queue | M-09 | M1 |
| M-13 | Payouts with reserve and compensation | M-09 | M2 |
| M-14 | Second provider adapter and automatic failover | M-07 | M2 |
| M-15 | Operator and limit configuration; phone and name validation | M-07 | M2 |
| M-16 | Fraud rules: velocity, SIM swap signals, payout cooling-off | M-13 | M2 |
| M-17 | Credit disbursement to a wallet through payouts | M-13, credit registration | M3 |
| M-18 | Repayment: split of collections, approved prompts, reminders | M-09 | M3 |
| M-19 | Malawi policy pack: limits, English and Chichewa messages, reporting | M3 start | M3 |
| M-20 | Cash in and out, bill payments and airtime through a provider | M-13 | M4 |
| M-21 | Sandbox failure tests: timeouts, duplicates, outages | M-14 | M1 to M2 |
| M-22 | Runbooks and go-live checklist for each phase | All above | Each phase |

### 13.9 Go-live checklist for each Malawi phase

- [ ] Contracting entity, bank account and provider agreements in place
- [ ] Counsel's written view on licensing for this phase
- [ ] Data protection officer named, impact assessment done, transfer basis agreed
- [ ] Sandbox tests passed, including duplicates, timeouts and outages
- [ ] Daily reconciliation clean for 30 days in sandbox
- [ ] Callback verification and replay guard tested
- [ ] Customer messages reviewed in English and Chichewa
- [ ] Fee and tax settings confirmed
- [ ] Exposure caps, kill switch and on-call owner ready

### 13.10 Questions for Malawi

1. Which entity will sign the provider agreements (the Malawi company that replaces the terminated brand)?
2. Should collections settle into a kwacha bank account in Malawi, and which bank?
3. Who is your Malawian counsel for licensing, credit registration and data protection?
4. Is there any domestic M-Pesa service you have been offered or promised? If so, who is the contact at Vodacom?

## 14. Appendices

### A. Environment variables

| Variable | Purpose | Note |
| --- | --- | --- |
| DATABASE\_URL | Postgres connection | Set by the setup script |
| JWT\_SECRET | Signing key for logins | Generate randomly; never commit |
| NEXT\_PUBLIC\_APP\_URL, NEXT\_PUBLIC\_BASE\_URL, BASE\_URL | Public address of the app | Built into the app; rebuild after changing |
| GOOGLE\_CLIENT\_ID, GOOGLE\_CLIENT\_SECRET | Google sign-in | Only if used |
| PRISMA\_LOG\_QUERIES | Set to 1 to log queries | Off by default |
| Provider keys for mobile money (proposed names such as PAWAPAY\_API\_TOKEN, PAYCHANGU\_SECRET\_KEY) | Sandbox and live credentials | Proposed names; keep in a secret manager |

### B. What has been delivered

- **tshepo-groway-integration (zip):** Tshepo code and 24 tests, Prisma models, SQL guards, the Postgres schema, the fixed database client, and four helper scripts (database setup, build, start, backup).
- **Architecture and build specification v1.0 (document):** the longer technical specification, drawings, build guide and backlog.
- **Groway on your Mac (document):** the step-by-step setup guide.
- **GoPay end-to-end prototype (web page):** the sandbox of one payment from till to ledger.

### C. Glossary

| Term | Meaning |
| --- | --- |
| Ledger | The permanent record of every money movement, where each entry balances |
| Idempotency | Doing the same request twice has the same effect as doing it once |
| Outbox | A table that records events in the same step as the money entry, so none are lost |
| PSP | Payment service provider, licensed to move payments |
| MNO | Mobile network operator, such as Airtel or TNM |
| MSISDN | A mobile phone number |
| Tambala | One hundredth of a Malawi kwacha |
| Trust account | A bank account holding customer money that backs e-money |

## 15. Sources reviewed

- pawaPay provider coverage and payout documentation: https://docs.pawapay.io/v2/docs/providers
- PayChangu developer documentation: https://developer.paychangu.com/docs/introduction
- PayChangu licence report: https://allafrica.com/stories/202610190191.html
- pawaPay licence report: https://mbc.mw/pawapay-secures-mobile-money-licence-from-reserve-bank-of-malawi/
- Payment Systems Act 2016 (Malawi): https://malawilii.org/akn/mw/act/2016/15
- RBM warning on unlicensed providers: https://mwnation.com/rbm-moves-to-curb-unlicensed-payment-service-providers/
- Malawi mobile money market and interoperability: https://www.uncdf.org/article/4270/exciting-changes-in-malawi-dfs-market and https://www.ifc.org/content/dam/ifc/doc/mgrt/malawi-building-resilience-through-dfs.pdf
- TNM and Airtel market shares: https://www.connectingafrica.com/document.asp?doc\_id=783094
- M-Pesa cross-border transfers into Malawi: https://malawihctz.org/launch-of-vodacom-tanzanias-m-pesa-campaign/
- Data Protection Act 2024 overview: https://itlawco.com/focus-areas/data-protection-and-privacy/malawis-data-protection-act-2024-an-overview/
- MACRA data protection regulations in development: https://malawi24.com/2026/07/16/macra-targets-stronger-data-protection-compliance/

## 16. Top-up credit: airtime, data and electricity advances (South Africa and Malawi)

This section covers the product where a customer who is short of money gets airtime, data or an electricity token now, and the advance plus a fee is taken back automatically the next time they top up or buy. Public facts below were reviewed on 11 November 2026 and are listed in 16.14. Fees and menus change, so every figure here is illustrative until confirmed with the operator or vendor. *VERIFY* marks items for counsel or a partner.

### 16.1 How it works in the market today

**Mechanism.** The customer asks (USSD menu, SMS, app or WhatsApp). A decision engine checks recharge or purchase history and returns the amounts they qualify for. The customer sees the fee and accepts. The airtime or token is delivered immediately. The next time they recharge or buy, the platform takes the advance and fee first and lets the rest through. That automatic claw-back is the whole model, and it only works where the platform can see and intercept the top-up.

**South Africa**

- **Vodacom Airtime Advance** (dial *135*082#): advances of up to R20 depending on what the customer qualifies for, with an access fee of R1.10 including VAT on one Vodacom page and R1.20 per R10 or part thereof on another. Repaid from the next recharge. Top-up and uChoose customers who do not recharge are billed (the amount is added to the bill by the end of the month; another page says after 30 days). Eligibility includes recharging at least R29 a month over three months; postpaid customers do not qualify. Vodacom says more than 10 million South Africans use it.
- **MTN XtraTime** launched in 2016 as a USSD service charging a small fee instead of interest. In August 2026 MTN was reported to be cutting back airtime advances while Vodacom and Telkom lean on them.
- **Cell C** offers an advance for a fixed fee per transaction with no interest.
- **Optasia** is reported as the company behind the airtime lending of Vodacom and MTN, and in September 2026 was reported to be acquiring Finergi, whose technology lets prepaid electricity meters work as digital wallets with repayment at the next purchase.
- **Electricity:** Blu Label offers BlueAdvance for airtime and electricity; Citiq launched an in-app electricity advance in November 2025 that takes 50% of each later purchase; WattWallet is a pay-at-month-end pilot.

**Malawi**

- **TNM Pasavute:** airtime credit via \*600# or an SMS, with a 10% service fee repaid on the next recharge, built with South Africa's Net1 and Supa Pesa; reported at more than 20 million requests.
- **Airtel Kutapa:** borrow K50 to K2,000 with codes such as *533*50#; borrowing K50 means paying back K5 extra; needs 90 days on the network, prepaid only, and no outstanding balance.
- **Airtel Kutchova:** a digital loan issued by a bank and transacted on Airtel Money; borrowers use it for airtime, food and electricity.
- **TNM Mpamba Ndikankhe:** an overdraft on the Mpamba wallet after 90 days of use; agents can sell ESCOM tokens and airtime.

**What this means.** Both countries already have incumbents inside the operators' own recharge systems. Groway cannot simply add a menu item to an operator's USSD flow without an operator agreement. The design below therefore starts where Groway controls the top-up.

### 16.2 Review of the build so far

| Capability needed | Before this review | Now |
| --- | --- | --- |
| Advance menu, quote and acceptance (principal, fee, total due) | Not covered | Built: product catalogue and quote |
| Eligibility from recharge history and a limit ladder | Only merchant decisioning | Built: recharge-history rules per product |
| Fee models (flat, per block, percent) with a ceiling check | Not covered | Built |
| One open advance per customer | Not covered | Built |
| Claw-back on the next top-up, with the remainder passed through | Only the GoPay split on merchant sales | Built: full-first and capped-share recovery |
| Electricity: take a share of each purchase, anchored to the meter | Not covered | Built in the rules; vending hook still to build |
| Overdue handling: add to bill (South Africa) or write off | Not covered | Built |
| Delivery of airtime, data or a token | Not covered | Specified as a vending adapter (16.6); not built |
| Top-up event feed and interception across channels | Not covered | Specified (16.5); not built |
| Float funding and settlement with the operator or vendor | Not covered | Specified (16.7); decision needed |
| Malawi parity (airtime, ESCOM, mobile money recovery) | Not covered | Specified; adapters not built |
| Fraud controls specific to advances | General only | Specified (16.9) |
| Regulation, disclosure and responsible-lending rules | General only | Specified (16.8) |

The module has 12 tests covering fees, eligibility, issue, claw-back, partial recovery, electricity share, replays and overdue handling. All 36 tests in the bundle pass.

### 16.3 Three ways Groway can offer it

| Model | How it works | Needs | Verdict |
| --- | --- | --- | --- |
| **C: Merchant float advance** | Spaza merchants who sell airtime and electricity get float on credit, repaid from their sales and vending commissions | Merchant OS data, GroCredit, the ledger | Start here: you see every sale |
| **B: Channel-embedded advance** | Customers buying airtime, data or electricity through Groway's own channels (Merchant OS tills, WhatsApp, SmartPole portal, wallet, Malawi mobile money) get an advance repaid on their next purchase through those channels | A vending or aggregator agreement; consent; licensing route | Second: feasible without an operator deal, but recovery only happens where Groway sees the purchase |
| **A: Operator-embedded (Optasia model)** | Groway's engine sits inside an operator's recharge flow and the operator deducts at recharge | An operator commercial and technical agreement | Later: strongest recovery, hardest to win because incumbents exist |

Recovery rate is the number that decides profitability. Model C and B recover only on purchases Groway can see, so advances are sized to that reach, and recovery falls back to approved wallet or mobile money prompts.

### 16.4 End-to-end flows

**Airtime or data advance (South Africa and Malawi)**

1. The customer asks through WhatsApp, the till, the portal or USSD (Malawi).
2. Identify the subject (phone number) and check consent for credit use.
3. Check eligibility and the limit; show the menu of amounts the customer qualifies for.
4. Show the quote: amount, fee and total to repay. The customer accepts.
5. Post the issue entry and call the vending adapter to deliver the airtime.
6. On the next top-up through a Groway channel, the top-up event calls recovery. The platform takes the allowed amount, tells the vending adapter how much to pass through, posts the entry and sends a message.
7. If not recovered by the due date: add to bill where an operator bill exists (South Africa top-up customers), otherwise write off after reminders and offers.

**Electricity advance (meter-anchored)**

1. The customer gives the meter number. The vending provider validates the meter and supply details.
2. Eligibility uses purchase history for that meter and the customer's identity, so a meter changing hands does not inherit credit.
3. Quote and accept. The vendor issues a single-use token on credit and it is sent by message.
4. The advance is anchored to the meter number and the customer. On each later purchase through Groway's vending path, a capped share (for example 50%) goes to the advance until repaid.
5. Where a municipality allocates part of a purchase to arrears, Groway's share is taken after those deductions. *VERIFY* the allocation order with the vending provider.

**Electricity recovery across channels.** A customer can buy tokens at banks, retailers and apps. The debt follows the meter only if every vending channel calls Groway's recovery hook. Options, in order: become a vendor so purchases flow through Groway; agree a deduction hook with a large vending network (one report says Blu Label's platform handles over 60% of top-ups); offer a customer-approved wallet or mobile money repayment; and size advances to what Groway can recover through its own channels. Do not promise customers that repayment is automatic everywhere.

**Merchant float advance**

1. A merchant buying airtime or electricity stock requests float in Merchant OS.
2. GroCredit tier and sales history set the limit.
3. The float is delivered; repayment is taken as a share of the merchant's later vending sales or settlements.

**Malawi variants**

- Airtime and ESCOM tokens are bought through a licensed provider's bill and airtime interfaces (for example PayChangu's bills and airtime endpoints).
- Recovery uses the mobile money payment prompt flow from section 13: when the customer next pays through Groway, the platform deducts the advance first.
- Menus are in kwacha with tambala precision. Messages are in English and Chichewa.

### 16.5 Product rules by market (illustrative starting points)

| Product | Menu | Fee | Recovery | Eligibility | Overdue |
| --- | --- | --- | --- | --- | --- |
| South Africa airtime | R5 to R20 | R1.20 per R10 or part thereof | Whole top-up until repaid | 90 days; recharged R29 a month in 3 months | Add to bill after 30 days |
| South Africa electricity | R50 to R300 | 10% | Up to 50% of each purchase | 90 days; two months of purchases of R150 or more | Write off after 60 days, after reminders |
| Malawi airtime | K50 to K2,000 | 10% | Whole top-up until repaid | 90 days; two months of K1,000 or more | Write off after 30 days, after reminders |
| Malawi electricity | K5,000 to K20,000 | 10% | Up to 50% of each purchase | 90 days; two months of K5,000 or more | Write off after 60 days, after reminders |

All values are configuration, not constants, and each change goes through the credit committee and a recorded decision. Limits are a share of average monthly recharge (30% by default), so small spenders get small advances.

### 16.6 Technical design

**Built (in `src/lib/tshepo/topup`):** product definitions and fee quotes, eligibility and limit ladder, the advance service (issue, recover, overdue), in-memory repository, and presets for the four products above.

**Ledger postings (customer subject is the phone number or meter):**

| Event | Entry |
| --- | --- |
| Advance issued | Debit advance receivable (principal plus fee); credit supplier payable (principal); credit fee income (fee) |
| Recovered at a top-up | Debit collections clearing; credit advance receivable |
| Written off | Debit bad debt expense; credit advance receivable |
| Added to the operator bill | Receivable closed against a billed-amount account when the operator confirms; no cash is taken by Groway |

**Ports still to build:**

- **Vending adapter:** deliver airtime, data or an electricity token, return a reference, and confirm. One adapter per supplier or aggregator, per country.
- **Top-up event source:** a webhook or stream that reports each recharge or purchase by the subject, with an idempotent reference.
- **Operator or vendor settlement:** daily statements matched to the ledger, with a payable to the supplier for advanced value.
- **Notifier:** WhatsApp, SMS and USSD messages for offers, confirmations and reminders.
- **Data model:** add an advance record table and a consent purpose for top-up credit to the Prisma schema.
- **Routes:** quote, issue, recovery (called by the vending path), status, and an overdue job, all behind the tenant guard.

**Reconciliation:** daily match of supplier statements to issue and recovery entries; unknown vendor outcomes are polled and never assumed to succeed.

### 16.7 Funding and economics

- **Float funding:** someone pays the supplier for the airtime or electricity delivered before the customer repays. Options: lender-funded, Groway-funded, or a supplier credit line. This is a Wave 0 decision.
- **Fee as a rate:** a fee of R2.40 on a R20 advance repaid in 7 days is 12% for the week. Short terms make fees look small and annual rates very high. Report both to the credit committee and regulators.
- **Loss drivers:** customers who stop using the number or meter, switch SIMs, or buy through channels Groway does not see. Track recovery rate, days to recover, and net loss by cohort and channel.
- **Unit economics model:** advance volume, take-up, fee, recovery rate, funding cost, supplier margin, messaging and vending costs, fraud losses. Build it before launch and keep it updated with pilot data.

### 16.8 Regulation, consumer protection and responsible lending

| Area | South Africa | Malawi |
| --- | --- | --- |
| Credit | The National Credit Act sets fee and interest ceilings, and since 2016 the registration threshold for credit providers is nil. Whether an advance with an access fee counts as a credit agreement is a legal question that operators have answered by marketing a fee, not interest. Fees charged by a separate service provider can count towards the ceiling. Get a written legal opinion before launch | Lending needs registration under the Financial Services Act regime, and incumbents issue some products through banks. *VERIFY* for any advance sold through Groway's own channel |
| Electricity | Tokens are issued through vending agreements with Eskom or the municipality; municipalities may allocate part of a purchase to arrears. Reselling electricity needs a vendor agreement. *VERIFY* | ESCOM tokens are sold through licensed channels such as bank and mobile money bill payment; a vendor or provider agreement is needed. *VERIFY* |
| Data | POPIA: consent for credit use, purpose limits, limits on solely automated decisions *VERIFY* | Data Protection Act 2024: lawful basis, officer, impact assessment, cross-border conditions |
| Payments | Licensed partner for moving money | Licensed provider only (section 13.7) |

**Responsible-lending guardrails (both countries):**

- Small starter limits that rise only with repayment.
- One open advance per customer; no rollover or refinancing of an unpaid advance with a new one.
- A clear quote with the total to repay before acceptance, in the customer's language.
- Explicit opt-in, an easy opt-out and a cap on advances per month.
- A hardship route and a human review of complaints.
- Press criticism of electricity advances in South Africa makes transparent pricing and fair treatment a business requirement, not just a legal one.

### 16.9 Fraud and abuse controls

- Phone number recycling and SIM swap: require tenure on the current SIM where the operator shares it; pause advances after a swap.
- Advance farming: link accounts by device, identity and payment instrument; block repeat patterns.
- Meter sharing and meter changes: bind eligibility to the meter and the verified customer.
- Agent and merchant collusion: velocity rules and dual approval for large float.
- Negative list: blocked identities and numbers shared across Groway products.

### 16.10 Build plan

| Phase | Scope | Gate |
| --- | --- | --- |
| T0: Decisions | Choose models C and B first; supplier and aggregator for South Africa and Malawi; legal opinions; float funding | Funding and legal route confirmed |
| T1: South Africa airtime and data | Merchant float, then customer advances through Groway channels | Recovery rate and loss inside the base case for two cohorts |
| T2: South Africa electricity | Meter-anchored advances and a vending hook | Recovery through Groway channels meets target; vendor agreement signed |
| T3: Malawi | Airtime and ESCOM advances through licensed provider interfaces, with mobile money recovery | Section 13 phase M1 and M2 complete; registration route confirmed |
| T4: Operator-embedded | USSD and recharge-flow integration with a partner operator in each country | Operator agreement signed |

### 16.11 Backlog

| ID | Story | Market | Depends on | Phase |
| --- | --- | --- | --- | --- |
| TC-01 | Choose the first models, suppliers and aggregators; record the decision | Both | None | T0 |
| TC-02 | Legal opinions: credit characterisation, electricity vending, data | Both | None | T0 |
| TC-03 | Decide the float funding structure | Both | None | T0 |
| TC-04 | Add the advance record table and top-up consent purpose to the schema | Both | Wave 0 | T1 |
| TC-05 | Persist advances through a Prisma repository | Both | TC-04 | T1 |
| TC-06 | Quote, issue, status and recovery routes behind the tenant guard | Both | TC-05 | T1 |
| TC-07 | Vending adapter interface and a South Africa airtime and data adapter | South Africa | TC-01 | T1 |
| TC-08 | Top-up event source and recovery hook in the Groway vending path | Both | TC-06 | T1 |
| TC-09 | Messages and menus: WhatsApp for South Africa, English and Chichewa for Malawi | Both | TC-06 | T1 |
| TC-10 | Merchant float advance through GroCredit and Merchant OS | South Africa | TC-06 | T1 |
| TC-11 | Daily reconciliation against supplier statements | Both | TC-07 | T1 |
| TC-12 | Overdue job: add to bill or write off, with reminders | Both | TC-06 | T1 |
| TC-13 | Fraud rules: SIM swap, farming, velocity, negative list | Both | TC-06 | T1 |
| TC-14 | Dashboards: recovery rate, days to recover, loss by cohort and channel | Both | TC-08 | T1 |
| TC-15 | Meter lookup and token vending adapter | South Africa | TC-01 | T2 |
| TC-16 | Meter-anchored eligibility and the capped-share recovery hook | South Africa | TC-15, TC-08 | T2 |
| TC-17 | Municipal arrears allocation handling | South Africa | TC-15 | T2 |
| TC-18 | Airtime adapter using a licensed Malawi provider | Malawi | Section 13 M1 | T3 |
| TC-19 | ESCOM token adapter using the provider bills interface | Malawi | Section 13 M1 | T3 |
| TC-20 | Recovery on mobile money collections: deduct the advance first | Malawi | TC-08, Section 13 M1 | T3 |
| TC-21 | Malawi policy pack: kwacha menus, limits, messages, reporting | Malawi | TC-02 | T3 |
| TC-22 | Operator USSD and recharge-flow integration | Both | Operator agreement | T4 |
| TC-23 | Sandbox failure tests: duplicate events, vendor timeouts, partial top-ups | Both | TC-08 | T1 to T3 |
| TC-24 | Runbooks and go-live checklist per phase | Both | All above | Each phase |

### 16.12 Go-live checklist for each phase

- [ ] Legal opinion on credit characterisation and electricity vending for this market
- [ ] Float funding and supplier agreements signed
- [ ] Consent wording, quotes and messages reviewed in the customer's language
- [ ] Product limits, fees and recovery rules approved by the credit committee
- [ ] Recovery tested end to end, including duplicates, partial top-ups and vendor timeouts
- [ ] Daily reconciliation clean for 30 days in sandbox
- [ ] Exposure caps, kill switch and on-call owner ready
- [ ] Complaints and hardship routes live

### 16.13 Open questions

1. Which suppliers or aggregators do you already have, or want, for airtime and electricity in South Africa and Malawi?
2. Is there any operator relationship (Vodacom, MTN, Cell C, Telkom, Airtel or TNM) you can use for the later operator-embedded model?
3. Who funds the float: you, a lender, or a supplier credit line?
4. Should merchant float (model C) launch before customer advances?

### 16.14 Sources reviewed

- Vodacom Airtime Advance: https://www.vodacom.co.za/vodacom/services/airtime-advance and https://vodacom.co.za/vodacom/services/financial-services/airtime-advance
- MTN XtraTime launch: https://itweb.co.za/article/mtn-finally-gives-users-extra-time/XlwrKxv33QPvmg1o
- Emergency airtime in South Africa: https://www.itweb.co.za/article/cash-strapped-south-africans-turn-to-emergency-airtime/RgeVDvPRlJEMKJN3
- MTN cutting airtime credit: https://techcentral.co.za/mtn-is-cutting-airtime-credit-while-its-rivals-lean-on-it/285226/
- Optasia and Vodacom and MTN: https://dailyinvestor.com/business/143933/the-company-making-millions-for-vodacom-and-mtn/
- Optasia and Finergi electricity lending: https://www.businessday.co.za/companies/2026-09-15-optasia-to-soon-offer-electricity-lending-through-finergi-acquisition/
- Citiq Advance: https://businesstech.co.za/news/?p=843911
- Blu Label nano-loans and BlueAdvance: https://connectingafrica.com/fintech/profit-grows-for-sa-s-blue-label-telecoms-as-it-eyes-nano-loans-market and https://www.sabcnews.com/sabcnews/?p=876669
- Blu Label market share: https://www.pulse.bot/energy/news/blu-label-says-it-can-help-fix-municipal-electricity-revenue-problems-in-south-africa-b5d35164-e5a6-4b55-90bf-288e561e00fa/
- TNM Pasavute: https://www.nyasatimes.com/?p=65867 and https://itweb.africa/content/4r1ly7Rb1d57pmda
- Airtel Kutapa terms: https://islamqa.org/hanafi/daruliftaamw/134480/have-you-run-out-of-airtime/
- Airtel Kutchova study: https://repec.cepr.org/repec/cpr/ceprdp/DP16848.pdf
- TNM Mpamba Ndikankhe: https://www.maraviexpress.com/?p=30220
- PayChangu bills and airtime interface: https://developer.paychangu.com/docs/bill-payments
- National Credit Act registration and fees: https://mjkinc.co.za/finance-credit-law/credit-provider-registration and https://www.moonstone.co.za/ruling-clarifies-separate-agreement-fees-under-the-national-credit-act/

## 17. Suppliers, aggregators and the API interface

### 17.1 South Africa: providers to approach

The list below comes from public sources and is a starting point for commercial conversations. Only Prepaid24 states that it offers API integration for platforms, and only PayChangu (Malawi) publishes its API openly. For the rest, the technical documentation sits behind a commercial agreement. *VERIFY* terms, coverage and API access with each.

| Provider | What it offers | Integration status |
| --- | --- | --- |
| Blue Label Telecoms (Cigicell platform, Ringas) | Airtime, data and electricity; reported to handle over 60% of prepaid top-ups; also runs BlueAdvance, a competing advance | Agreement needed |
| EasyPay (Lesaka group) | Switching and bill payments; named as an electricity aggregator | Agreement needed |
| Kazang (Connect Group) | Airtime, data, electricity and 600+ bills; about 68,000 active devices; sells Malawi ESCOM tokens from South Africa | Agreement needed; corporate integration offered |
| Flash | National prepaid supplier | Agreement needed |
| Prepaid24 | Electricity for over 94% of municipalities; airtime and data for all major networks | API integration offered; confirm documentation |
| Syntell, Contour, Ontec, iPay | Electricity vending aggregators | Agreement needed |
| Pay@ | Municipal bill payments | Agreement needed |
| CellAir, RA Cellular | Prepaid airtime and data | Agreement needed |
| Vodacom, MTN, Cell C, Telkom (direct) | Airtime and data supply; for the later operator-embedded model | Operator agreement |
| Eskom national vendors and municipal vending systems | Electricity tokens issued in real time from the utility vending server through contracted vendors | Through a vendor or aggregator |

Municipalities tender their vending contracts about every three years and sometimes switch providers, so electricity coverage needs at least two providers, chosen by municipal reach.

### 17.2 The interface

All suppliers sit behind one provider-neutral interface, so the credit engine never depends on a single aggregator.

- **Request:** a unique reference, country, commodity (airtime, data or electricity), amount in minor units, and the phone number or meter number.
- **Three possible results:** *success* (delivered, with a reference and any token), *failed* (definitely not delivered, with a code and a flag saying whether another provider may be tried), and *unknown* (no way to tell).
- **Routing:** providers are ranked by priority and filtered by country and commodity. After repeated failures a provider is skipped for a cooling period.
- **The key safety rule:** the router moves to the next provider only after a definite failure. An unknown result (a timeout, a server error, an unreadable reply) stops the chain, because the airtime or token may already have been delivered. It is looked up with the same provider, never sent to a second one.
- **One delivery per reference:** repeating a reference returns the stored result and never vends again.
- **Meter validation** is available before an electricity advance is offered.
- **Configuration-driven adapter:** a new supplier needs one configuration object that says how to build each call and read each reply. The adapter treats server errors and timeouts as unknown and rate limits as retryable failures.
- **Sandbox provider:** a mock supplier with success, failure, timeout and error modes for development and tests.

**Onboarding a supplier:** agreement and sandbox credentials, then the supplier's documentation, then the configuration object, then contract tests against the sandbox, then a shadow run, then live at low volume, then promotion to primary or failover.

**Delivery orchestration:** the advance is issued first, then the item is delivered. A definite failure reverses the advance exactly. An unknown result holds the advance as pending: it blocks a second advance and is not recovered until delivery is confirmed. A daily job settles pending deliveries by looking them up.

### 17.3 Malawi: TNM, ESCOM and the interim provider

| Party | Position | What to do |
| --- | --- | --- |
| TNM and TNM Mpamba | In discussions | Show the demo (section 19) and agree the technical list below |
| ESCOM | Negotiations under way | Agree meter validation, token vending and purchase events |
| PayChangu | Public API | Use as the interim provider for Airtel and TNM airtime and ESCOM tokens: validate a meter, pay a bill, buy airtime, all debited from a pre-funded wallet |

Because PayChangu pays bills from a pre-funded wallet, the float for Malawi advances must be loaded in advance and monitored, with an alert before the balance runs out.

**Technical list to send to TNM:**

| Need | Purpose |
| --- | --- |
| Airtime and data top-up API for a given number | Deliver the advance |
| Recharge event webhook with an idempotent reference | Trigger recovery at the next top-up |
| Subscriber tenure and recharge history, with the customer's consent | Eligibility and limits |
| SIM-swap and number-recycling signals | Fraud control |
| Daily settlement and reconciliation file | Match supply and recovery to the ledger |
| Mpamba payment prompt API | Alternative repayment route |
| Sandbox environment | Testing before launch |

**Technical list to send to ESCOM:**

| Need | Purpose |
| --- | --- |
| Meter validation by meter number | Check the meter before offering an advance |
| Prepaid token vending API with a unique reference | Deliver the token |
| Purchase event feed per meter | Trigger recovery at the next purchase |
| Daily reconciliation file | Match to the ledger |
| Sandbox environment | Testing before launch |

### 17.4 Status

Built and tested: the provider interface, router with failover and circuit breaker, the configuration-driven adapter, the sandbox provider, the PayChangu adapter (written from its public documentation; its response shapes and status lookup must be confirmed in its sandbox), the provider catalogue, and the delivery orchestrator. Not built: adapters for individual South African suppliers (blocked on their documentation), and the TNM and ESCOM adapters.

## 18. Float funding: a structure that still works in 2050

### 18.1 The decision

Groway does not rely on one lender. It runs a **funder-agnostic capital mesh**: any number of funding facilities, each held as data (currency, countries, products, limit, price, performance triggers), with the platform allocating each advance to the best eligible facility. Groway seeds the first-loss layer and a senior lender funds the rest, per currency.

### 18.2 Principles

1. **Match currency.** Rand assets are funded in rand and kwacha assets in kwacha. A kwacha advance is never funded from a rand facility. Offshore money enters Malawi only with a hedge or a development lender that carries the currency risk.
2. **Fund short assets with revolving lines.** Advances turn over in days, so the need is working capital: a revolving receivables facility sized to peak float, not a long-term loan.
3. **Layer the capital.** Supplier terms first, a senior revolving facility second, a first-loss layer from Groway or an impact or guarantee provider third, and later additional funders as the book proves itself.
4. **Performance triggers as code.** Minimum recovery rate and maximum charge-off are rules in the platform. A breach suspends new draws automatically and resumes when performance recovers, with no argument about definitions.
5. **Show funders the truth in real time.** Read-only reporting from the ledger: balances, vintages, roll rates, recovery and losses.
6. **Never hard-code a funder.** New funding sources, including pension funds, development lenders, impact funds and whatever digital-native sources exist in the future, are added by configuration through the same interface.
7. **Ring-fence.** Hold funded receivables in a separate vehicle or account structure so funders have a clear claim, and keep funders' money separate from Groway's own.
8. **Stress and diversify.** Test the book against recovery drops and funder withdrawal; keep at least two funders per currency once volume allows.

### 18.3 Layers

| Layer | Source | Role | Starting point |
| --- | --- | --- | --- |
| 1. Supplier credit | Aggregators and operators | Pay for airtime and tokens on terms, so float is partly funded by the supplier | Negotiate in each supplier agreement |
| 2. Senior revolving facility | Bank or development lender, one per currency | Main float | One rand facility, one kwacha facility |
| 3. First loss | Groway, impact funder or guarantee | Absorbs early losses so seniors accept the risk | Groway seeds a defined amount |
| 4. Growth funding | Additional lenders and markets | Scale beyond the first facilities | After two clean cohorts |

### 18.4 Sizing the float

Peak float is daily advances times the days an advance stays outstanding, plus a buffer. For example, R10,000 of advances a day, outstanding on average about 7 days, with a 20% buffer needs R84,000. The platform calculates this from live data and alerts when headroom falls below a threshold.

### 18.5 Status

Built and tested: facility definitions, allocation by priority, currency, country, product and headroom, the ledger entry that moves the obligation from the supplier to the funder, repayment of the funder's principal and cost from recoveries, release of a draw when delivery fails, performance triggers, and the float estimate. Not built: persistence, funder reporting screens, and concentration limits.

## 19. Launch order and the TNM proposition

### 19.1 Merchant float launches first

Yes: launch merchant float before customer advances. Reasons: you see every merchant sale, so recovery comes from settlements you control; the group is small and known; there is no consumer credit exposure yet; and it proves the ledger, recovery, funding and reconciliation in a controlled setting before consumers are involved.

| Stage | Scope | Gate to the next stage (starting points for the credit committee) |
| --- | --- | --- |
| 0 | Internal test with staff accounts in the sandbox | Tests pass; reconciliation clean |
| 1 | A small group of merchants with low caps | Recovery on target for two full cohorts; no unexplained ledger differences |
| 2 | A wider merchant group | Loss within the base case; funding headroom healthy; complaints handled |
| 3 | Customer advances in one Groway channel, small limits | Consent, disclosure and fraud checks proven; legal opinion in hand |
| 4 | Electricity advances | Vending hook working; vendor agreement signed |
| 5 | Malawi | Provider and partner agreements; registration route confirmed |

### 19.2 The TNM proposition

A demonstration for TNM is published at https://claude.ai/artifact/4yUwNwxozzqng2GBhdUrWQ. It shows a customer journey on a simulated handset (limit, quote, acceptance, recovery at the next recharge), what TNM would see on a dashboard, a calculator where TNM sets its own assumptions, and a comparison table. All customers and figures are invented.

**How it is positioned.** The comparison uses only what is publicly described about TNM's current product (a 10% service fee repaid at the next recharge). Features that are suggestions are labelled as proposals: lower fees for customers who repay on time, a small recharge carrying the balance forward, an approved Mpamba prompt as a repayment route, and early repayment.

**Talking points for TNM:**

- Personal limits from each customer's own recharge history, rising as they repay.
- A total shown before acceptance, in plain language.
- One engine for airtime today and ESCOM tokens on a meter later.
- Live recovery, days-to-recover and loss reporting, and a daily settlement file.
- TNM keeps the customer, the data and the brand; Groway supplies the engine through an API and a recharge webhook.
- Consent recorded per purpose, with an audit trail, in line with the Data Protection Act 2024.

**What to confirm before the meeting:** the current terms of the TNM arrangement with its existing provider, any exclusivity, and who owns the customer data.

### 19.3 ESCOM

Use the technical list in 17.3. Until ESCOM's own interface is agreed, ESCOM tokens can be sold and advanced through PayChangu's bills interface, subject to PayChangu's agreement and the registration route for lending.

## 20. Complete code inventory

The full text of every file is in the companion listing at https://claude.ai/artifact/JV3xbiDz1VLCERDRJX14iq and in the `tshepo-groway-integration` zip. The code compiles with no TypeScript errors, and 64 tests pass.

### 20.1 Application code (`src/lib/tshepo`)

| File | Purpose | Lines |
| --- | --- | --- |
| shared/ids.ts | Time-ordered unique identifiers | 12 |
| shared/money.ts | Integer money helpers: basis-point maths, minimum, formatting | 17 |
| ledger/ledger.ts | Double-entry ledger with idempotency, in-memory repository, trial balance | 90 |
| ledger/prisma-ledger-repo.ts | Prisma ledger adapter: entry, lines and outbox in one transaction | 51 |
| consent/consent.ts | Purpose-bound, revocable, expiring consent log | 22 |
| repayment/waterfall.ts | Waterfall allocation and the settlement-split rule | 23 |
| gopay/settlement.ts | Sale settlement, debit-order route, refusal while GoPay is not live | 85 |
| decisioning/orchestrator.ts | Consent-first decisions, hard stops, affordability, reasons, trace | 87 |
| edge/envelope.ts | Signed offline decision envelopes and spend caps | 50 |
| topup/products.ts | Advance products, fee models, eligibility and limit ladder | 85 |
| topup/presets.ts | Illustrative South Africa and Malawi airtime and electricity products | 41 |
| topup/service.ts | Issue, claw-back, pending, confirm, cancel, overdue | 158 |
| topup/orchestrator.ts | Issue, deliver and reconcile an advance | 44 |
| vending/types.ts | Provider-neutral delivery interface and results | 32 |
| vending/router.ts | Routing, safe failover, circuit breaker, one delivery per reference | 77 |
| vending/mock.ts | Sandbox provider | 31 |
| vending/http-adapter.ts | Configuration-driven HTTP supplier adapter | 67 |
| vending/paychangu.ts | PayChangu adapter for Malawi airtime and ESCOM tokens | 53 |
| vending/catalogue.ts | South Africa and Malawi provider catalogue | 33 |
| capital/funding.ts | Funder-agnostic funding mesh, triggers and float estimate | 119 |

### 20.2 Tests (`__tests__/tshepo`)

| File | Cases | Covers |
| --- | --- | --- |
| ledger.test.ts | 5 | Balance rule, validation, idempotency, 500 random entries, tenant isolation |
| prisma-ledger-repo.test.ts | 2 | Round trip through the adapter; rollback when the outbox write fails |
| gopay.test.ts | 8 | Settlement split, GoPay-not-live refusal, caps, replays, debit route, failed debit, waterfall |
| consent-decision-edge.test.ts | 9 | Consent, decision outcomes and counterfactuals, envelope checks, spend caps |
| topup.test.ts | 12 | Fees, eligibility, issue, claw-back, partial recovery, electricity share, replays, overdue |
| vending.test.ts | 15 | Routing, failover, unknown outcomes, circuit breaker, PayChangu requests and replies, catalogue |
| funding-delivery.test.ts | 13 | Funding allocation, currency matching, repayment, triggers, float, delivery success, failure, pending |

### 20.3 Database, scripts and project files

| File | Purpose |
| --- | --- |
| prisma/tshepo.models.prisma | Six Tshepo models for the Postgres schema (validated) |
| prisma/tshepo-ledger-guards.sql | Balanced-entry, non-zero and append-only guards (not yet run on a database) |
| groway-changes/prisma/schema.prisma | Groway's 296-model schema switched to Postgres plus the Tshepo models (302 models, validated) |
| groway-changes/src/lib/db.ts | One database client per process; query logging off by default |
| groway-changes/setup-groway-postgres.sh | Installs Postgres, creates the database, swaps the schema, baselines migrations, applies guards |
| groway-changes/build-groway.sh, start-groway.sh, backup-groway.sh | Build, run and back up the app |
| groway-changes/MAC\_SERVER\_SETUP.md | Mac server notes |
| package.json, tsconfig.json, vitest.config.ts, README.md, INTEGRATION.md | Project and integration files |

### 20.4 Not yet built

Prisma repositories for advances, funding and delivery records; the advance record table and consent purpose in the schema; the quote, issue, recovery and status routes behind the tenant guard; adapters for individual South African suppliers, TNM and ESCOM; the mobile money rail from section 13; the consumer wallet; funder reporting screens; and the staff screens.
